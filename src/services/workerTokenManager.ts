// src/services/workerTokenManager.ts
// Worker Token Manager - Manages Worker Token credentials and access tokens with automatic lifecycle

import type {
	WorkerAccessToken,
	WorkerTokenCredentials,
	WorkerTokenStatus,
} from '../types/credentials';
import { logger } from '../utils/logger';

import { workerTokenRepository } from './workerTokenRepository';

/** Normalize scopes to a space-separated string; credentials.scopes may be string (from storage) or array. */
function normalizeScopesToScopeString(scopes: unknown): string {
	if (Array.isArray(scopes) && scopes.length > 0) {
		return scopes.map(String).filter(Boolean).join(' ');
	}
	if (typeof scopes === 'string' && scopes.trim()) {
		return scopes.trim();
	}
	return '';
}

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
		logger.info('WorkerTokenManager', ` [WorkerTokenManager] Getting worker token...`);

		// Check if we have a valid cached token
		if (this.tokenCache && this.isTokenValid(this.tokenCache)) {
			const expiresIn = this.getTokenExpiresIn(this.tokenCache);
			logger.info('WorkerTokenManager', `✅ Using cached token (expires in ${expiresIn}s)`);
			return this.tokenCache.access_token;
		}

		// Check if we have a stored token
		const storedToken = await this.loadStoredToken();
		if (storedToken && this.isTokenValid(storedToken)) {
			const expiresIn = this.getTokenExpiresIn(storedToken);
			logger.info('WorkerTokenManager', `✅ Using stored token (expires in ${expiresIn}s)`);
			this.tokenCache = storedToken;
			return storedToken.access_token;
		}

		// Need to fetch a new token
		logger.info('WorkerTokenManager', ` Token expired or missing, fetching new token...`);
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
		logger.info('WorkerTokenManager', ` [WorkerTokenManager] Saving Worker Token credentials`);

		await workerTokenRepository.saveCredentials(credentials);

		// Invalidate cached token when credentials change
		this.tokenCache = null;
		await this.clearStoredToken();

		logger.info('WorkerTokenManager', `✅ Worker Token credentials saved`);
	}

	/**
	 * Load Worker Token credentials
	 *
	 * @returns Worker Token credentials or null if not found
	 */
	async loadCredentials(): Promise<WorkerTokenCredentials | null> {
		const result = await workerTokenRepository.loadCredentials();
		if (!result) return null;

		// Convert UnifiedWorkerTokenCredentials to WorkerTokenCredentials.
		// Preserve tokenEndpointAuthMethod — dropping it forced client_secret_post and
		// caused PingOne "Unsupported authentication method" / invalid_client 401s.
		return {
			environmentId: result.environmentId,
			clientId: result.clientId,
			clientSecret: result.clientSecret,
			scopes: result.scopes || [],
			region: result.region || 'us',
			tokenEndpoint: result.tokenEndpoint || '',
			tokenEndpointAuthMethod: result.tokenEndpointAuthMethod,
		};
	}

	/**
	 * Manually refresh the Worker Token
	 *
	 * @returns New access token string
	 */
	async refreshToken(): Promise<string> {
		logger.info('WorkerTokenManager', ` [WorkerTokenManager] Manual token refresh requested`);
		this.tokenCache = null;
		return await this.fetchNewToken();
	}

	/**
	 * Invalidate the current token
	 */
	invalidateToken(): void {
		logger.info('WorkerTokenManager', ` [WorkerTokenManager] Invalidating token`);
		this.tokenCache = null;
	}

	/**
	 * Clear Worker Token credentials and token
	 */
	async clearAll(): Promise<void> {
		logger.info('WorkerTokenManager', ` [WorkerTokenManager] Clearing all Worker Token data`);
		this.tokenCache = null;
		await workerTokenRepository.clearCredentials();
		logger.info('WorkerTokenManager', `✅ Cleared all Worker Token data`);
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
			logger.info('WorkerTokenManager', `⏳ Token fetch already in progress, waiting...`);
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
				logger.info('WorkerTokenManager', ` Token fetch attempt ${attempt}/${maxRetries}`);

				const scopeString = normalizeScopesToScopeString(credentials.scopes);
				const authMethod = credentials.tokenEndpointAuthMethod ?? 'client_secret_post';

				const bodyParams: Record<string, string> = {
					grant_type: 'client_credentials',
				};
				if (scopeString) bodyParams.scope = scopeString;

				const requestHeaders: Record<string, string> = {
					'Content-Type': 'application/x-www-form-urlencoded',
				};

				if (authMethod === 'client_secret_basic') {
					// Credentials in Authorization header (Basic auth)
					const encoded = btoa(
						`${encodeURIComponent(credentials.clientId)}:${encodeURIComponent(credentials.clientSecret)}`
					);
					requestHeaders['Authorization'] = `Basic ${encoded}`;
				} else if (authMethod === 'client_secret_post' || authMethod === 'none') {
					// Credentials in request body (default)
					bodyParams.client_id = credentials.clientId;
					if (authMethod !== 'none') {
						bodyParams.client_secret = credentials.clientSecret;
					}
				} else {
					// private_key_jwt and any future methods: fall back to client_secret_post
					// and log a warning — full private_key_jwt support requires a key in credentials
					logger.warn(
						'WorkerTokenManager',
						`⚠️ Unsupported tokenEndpointAuthMethod "${authMethod}", falling back to client_secret_post`
					);
					bodyParams.client_id = credentials.clientId;
					bodyParams.client_secret = credentials.clientSecret;
				}

				const response = await fetch(credentials.tokenEndpoint, {
					method: 'POST',
					headers: requestHeaders,
					body: new URLSearchParams(bodyParams),
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

				logger.info(
					'WorkerTokenManager',
					`✅ Token fetched successfully (expires in ${tokenData.expires_in}s)`
				);

				// Broadcast token refresh event
				this.broadcastTokenRefresh(token);

				return token;
			} catch (error) {
				lastError = error as Error;
				const message = lastError.message || '';
				const nonRetryable =
					/\b401\b/.test(message) ||
					/invalid_client|unauthorized_client|unsupported authentication method|credentials not configured/i.test(
						message
					);

				logger.error(
					'WorkerTokenManager',
					`❌ Token fetch attempt ${attempt} failed:`,
					undefined,
					error as Error
				);

				// Auth/config failures will not succeed on retry — fail fast to avoid console spam.
				if (nonRetryable) {
					break;
				}

				if (attempt < maxRetries) {
					// Exponential backoff: 1s, 2s, 4s
					const delay = 2 ** (attempt - 1) * 1000;
					logger.info('WorkerTokenManager', `⏳ Retrying in ${delay}ms...`);
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
	 * Save token to storage, persisting the real expiresAt so it can be
	 * restored without fabricating a new expiry on load.
	 */
	private async saveToken(token: WorkerAccessToken): Promise<void> {
		await workerTokenRepository.saveToken(token.access_token, {
			expiresIn: token.expires_in,
			expiresAt: token.expiresAt,
			scope: token.scope,
		});
	}

	/**
	 * Load stored token, restoring the real expiresAt from metadata.
	 */
	private async loadStoredToken(): Promise<WorkerAccessToken | null> {
		const data = await workerTokenRepository.loadTokenData();
		if (!data?.token) return null;

		const storedExpiresAt = data.expiresAt;
		const storedExpiresIn = data.expiresIn;

		// Derive expiresAt: prefer stored value, fall back to savedAt + expiresIn
		const expiresAt =
			storedExpiresAt ??
			(storedExpiresIn && data.savedAt ? data.savedAt + storedExpiresIn * 1000 : undefined);

		return {
			access_token: data.token,
			token_type: 'Bearer',
			expires_in: storedExpiresIn ?? 3600,
			scope: data.scope ?? 'worker',
			fetchedAt: data.savedAt ?? Date.now(),
			expiresAt: expiresAt ?? Date.now() + 3600 * 1000,
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
