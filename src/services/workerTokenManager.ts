// src/services/workerTokenManager.ts
// Worker Token Manager - Manages Worker Token credentials and access tokens with automatic lifecycle

import type {
	WorkerAccessToken,
	WorkerTokenCredentials,
	WorkerTokenStatus,
} from '../types/credentials';
import { workerTokenRepository } from './workerTokenRepository';

/**
 * Worker Token Manager
 *
 * Manages Worker Token credentials AND access tokens as shared resources across the app.
 *
 * Key Features:
 * - Singleton pattern ensures single source of truth
 * - Automatic token lifecycle management (fetch, refresh, expire)
 * - Memory cache for fast access
 * - Retry logic with exponential backoff
 * - Prevents concurrent token fetches
 * - Broadcasts token refresh events to all tabs
 *
 * Usage:
 * ```typescript
 * const token = await workerTokenManager.getWorkerToken();
 * // Always returns a valid token or throws an error
 * ```
 */
export class WorkerTokenManager {
	private static instance: WorkerTokenManager;
	private tokenCache: WorkerAccessToken | null = null;
	private fetchPromise: Promise<WorkerAccessToken> | null = null;

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	static getInstance(): WorkerTokenManager {
		if (!WorkerTokenManager.instance) {
			WorkerTokenManager.instance = new WorkerTokenManager();
		}
		return WorkerTokenManager.instance;
	}

	/**
	 * Get a valid Worker Access Token (auto-fetch if needed)
	 *
	 * This is the primary method that all features should use.
	 * It guarantees to return a valid token or throw an error.
	 *
	 * @returns Valid access token string
	 * @throws Error if credentials not configured or fetch fails
	 */
	async getWorkerToken(): Promise<string> {
		console.log(`🎫 [WorkerTokenManager] Getting worker token...`);

		// Check if we have a valid cached token
		if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
			const expiresIn = this.getTokenExpiresIn(this.tokenCache);
			console.log(`✅ Using cached token (expires in ${expiresIn}s)`);
			return this.tokenCache.access_token;
		}

		// Check if we have a stored token
		const storedToken = await this.loadStoredToken();
		if (storedToken && this.isTokenValid(storedToken)) {
			const expiresIn = this.getTokenExpiresIn(storedToken);
			console.log(`✅ Using stored token (expires in ${expiresIn}s)`);
			this.tokenCache = storedToken;
			return storedToken.access_token;
		}

		// Need to fetch a new token
		console.log(`🔄 Token expired or missing, fetching new token...`);
		return await this.fetchNewToken();
	}

	/**
	 * Get Worker Token status
	 *
	 * @returns Status information about credentials and token
	 */
	async getStatus(): Promise<WorkerTokenStatus> {
		const credentials = await this.loadCredentials();
		const token = this.tokenCache || (await this.loadStoredToken());

		return {
			hasCredentials: !!credentials,
			hasToken: !!token,
			tokenValid: token ? this.isTokenValid(token) : false,
			tokenExpiresIn: token ? this.getTokenExpiresIn(token) : undefined,
			lastFetchedAt: token?.fetchedAt || undefined,
		};
	}

	/**
	 * Save Worker Token credentials
	 *
	 * @param credentials - Worker Token credentials to save
	 */
	async saveCredentials(credentials: WorkerTokenCredentials): Promise<void> {
		console.log(`💾 [WorkerTokenManager] Saving Worker Token credentials`);

		await workerTokenRepository.saveCredentials(credentials);

		// Invalidate cached token when credentials change
		this.tokenCache = null;
		await this.clearStoredToken();

		console.log(`✅ Worker Token credentials saved`);
	}

	/**
	 * Load Worker Token credentials
	 *
	 * @returns Worker Token credentials or null if not found
	 */
	async loadCredentials(): Promise<WorkerTokenCredentials | null> {
		const result = await workerTokenRepository.loadCredentials();
		if (!result) return null;
		
		// Convert UnifiedWorkerTokenCredentials to WorkerTokenCredentials
		return {
			environmentId: result.environmentId,
			clientId: result.clientId,
			clientSecret: result.clientSecret,
			scopes: result.scopes || [],
			region: result.region || 'us',
			tokenEndpoint: result.tokenEndpoint || '',
		};
	}

	/**
	 * Manually refresh the Worker Token
	 *
	 * @returns New access token string
	 */
	async refreshToken(): Promise<string> {
		console.log(`🔄 [WorkerTokenManager] Manual token refresh requested`);
		this.tokenCache = null;
		return await this.fetchNewToken();
	}

	/**
	 * Invalidate the current token
	 */
	invalidateToken(): void {
		console.log(`🗑️ [WorkerTokenManager] Invalidating token`);
		this.tokenCache = null;
	}

	/**
	 * Clear Worker Token credentials and token
	 */
	async clearAll(): Promise<void> {
		console.log(`🗑️ [WorkerTokenManager] Clearing all Worker Token data`);
		this.tokenCache = null;
		await workerTokenRepository.clearCredentials();
		console.log(`✅ Cleared all Worker Token data`);
	}

	// ============================================
	// Private Methods
	// ============================================

	/**
	 * Fetch a new Worker Access Token
	 */
	private async fetchNewToken(): Promise<string> {
		// Prevent concurrent fetches
		if (this.fetchPromise) {
			console.log(`⏳ Token fetch already in progress, waiting...`);
			const token = await this.fetchPromise;
			return token.access_token;
		}

		this.fetchPromise = this.performTokenFetch();

		try {
			const token = await this.fetchPromise;
			return token.access_token;
		} finally {
			this.fetchPromise = null;
		}
	}

	/**
	 * Perform the actual token fetch with retry logic
	 */
	private async performTokenFetch(): Promise<WorkerAccessToken> {
		const credentials = await this.loadCredentials();
		if (!credentials) {
			throw new Error('Worker Token credentials not configured');
		}

		let lastError: Error | null = null;
		const maxRetries = 3;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				console.log(`🔄 Token fetch attempt ${attempt}/${maxRetries}`);

				const response = await fetch(credentials.tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams({
						grant_type: 'client_credentials',
						client_id: credentials.clientId,
						client_secret: credentials.clientSecret,
						scope: credentials.scopes.join(' '),
					}),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`Token fetch failed: ${response.status} ${response.statusText} - ${errorText}`
					);
				}

				const tokenData = await response.json();
				const token: WorkerAccessToken = {
					...tokenData,
					fetchedAt: Date.now(),
					expiresAt: Date.now() + tokenData.expires_in * 1000,
				};

				// Cache and store the token
				this.tokenCache = token;
				await this.saveToken(token);

				console.log(`✅ Token fetched successfully (expires in ${tokenData.expires_in}s)`);

				// Broadcast token refresh event
				this.broadcastTokenRefresh(token);

				return token;
			} catch (error) {
				lastError = error as Error;
				console.error(`❌ Token fetch attempt ${attempt} failed:`, error);

				if (attempt < maxRetries) {
					// Exponential backoff: 1s, 2s, 4s
					const delay = 2 ** (attempt - 1) * 1000;
					console.log(`⏳ Retrying in ${delay}ms...`);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		throw new Error(
			`Failed to fetch Worker Token after ${maxRetries} attempts: ${lastError?.message}`
		);
	}

	/**
	 * Check if a token is valid (not expired)
	 */
	private isTokenValid(token: WorkerAccessToken): boolean {
		const now = Date.now();
		const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
		return token.expiresAt > now + bufferTime;
	}

	/**
	 * Get seconds until token expires
	 */
	private getTokenExpiresIn(token: WorkerAccessToken): number {
		return Math.floor((token.expiresAt - Date.now()) / 1000);
	}

	/**
	 * Save token to storage
	 */
	private async saveToken(token: WorkerAccessToken): Promise<void> {
		await workerTokenRepository.saveToken(token.access_token, {
			expiresIn: token.expires_in,
			scope: token.scope,
		});
	}

	/**
	 * Load stored token
	 */
	private async loadStoredToken(): Promise<WorkerAccessToken | null> {
		const tokenString = await workerTokenRepository.getToken();
		if (!tokenString) return null;
		
		// Create a WorkerAccessToken from the stored token string
		return {
			access_token: tokenString,
			token_type: 'Bearer',
			expires_in: 3600, // Default, will be updated if we have metadata
			scope: 'worker',
			fetchedAt: Date.now(),
			expiresAt: Date.now() + (3600 * 1000),
		};
	}

	/**
	 * Clear stored token
	 */
	private async clearStoredToken(): Promise<void> {
		await workerTokenRepository.clearToken();
	}

	/**
	 * Broadcast token refresh event to other tabs/components
	 */
	private broadcastTokenRefresh(token: WorkerAccessToken): void {
		window.dispatchEvent(
			new CustomEvent('worker-token-refreshed', {
				detail: {
					expiresAt: token.expiresAt,
					expiresIn: this.getTokenExpiresIn(token),
				},
			})
		);
	}
}

// Export singleton instance
export const workerTokenManager = WorkerTokenManager.getInstance();

export default workerTokenManager;
