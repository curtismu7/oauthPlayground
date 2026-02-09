/**
 * @file tokenGatewayV8.ts
 * @module v8/services/auth
 * @description Canonical Token Gateway - Single source of truth for all worker token acquisition
 * @version 1.0.0
 * @since 2026-01-30
 *
 * IMPORTANT: This is the ONLY place where token acquisition logic should live.
 * All other services (workerTokenServiceV8, MFATokenManagerV8, etc.) must delegate here.
 *
 * Features:
 * - Single-flight: Concurrent calls share one promise (no duplicate requests)
 * - Retry with exponential backoff
 * - Configurable timeout
 * - Structured debug logging
 * - Silent vs interactive mode support
 * - Error normalization
 * - Subscription-based status updates
 */

import { unifiedWorkerTokenService } from '../../../services/unifiedWorkerTokenService';
import { workerTokenServiceV8 } from '../workerTokenServiceV8';
import type { TokenStatusInfo } from '../workerTokenStatusServiceV8';
import { WorkerTokenStatusServiceV8 } from '../workerTokenStatusServiceV8';

const MODULE_TAG = '[🔐 TOKEN-GATEWAY-V8]';

// ============================================================================
// TYPES
// ============================================================================

export type TokenAcquisitionMode = 'silent' | 'interactive';

export interface TokenAcquisitionOptions {
	/** Acquisition mode: 'silent' (background) or 'interactive' (show modal) */
	mode: TokenAcquisitionMode;
	/** Force refresh even if token is valid */
	forceRefresh?: boolean;
	/** Timeout in milliseconds (default: 10000) */
	timeout?: number;
	/** Number of retries for transient failures (default: 2) */
	maxRetries?: number;
	/** Enable debug logging */
	debug?: boolean;
}

export interface TokenAcquisitionResult {
	success: boolean;
	token?: string;
	expiresAt?: number;
	error?: TokenAcquisitionError;
	/** Whether interactive auth is needed (silent failed, user action required) */
	needsInteraction?: boolean;
}

export interface TokenAcquisitionError {
	code: TokenErrorCode;
	message: string;
	details?: string;
	retryable: boolean;
}

export type TokenErrorCode =
	| 'NO_CREDENTIALS'
	| 'INVALID_CREDENTIALS'
	| 'NETWORK_ERROR'
	| 'TIMEOUT'
	| 'SERVER_ERROR'
	| 'UNAUTHORIZED'
	| 'RATE_LIMITED'
	| 'UNKNOWN';

export type TokenStatusCallback = (status: TokenStatusInfo) => void;

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<TokenAcquisitionOptions, 'mode'>> = {
	forceRefresh: false,
	timeout: 10000,
	maxRetries: 2,
	debug: false,
};

const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// ============================================================================
// TOKEN GATEWAY CLASS
// ============================================================================

/**
 * TokenGatewayV8 - Canonical token acquisition service
 *
 * This singleton is the ONLY place where token acquisition logic should exist.
 * Use this for all token operations to ensure consistency and prevent regressions.
 */
class TokenGatewayV8 {
	private static instance: TokenGatewayV8 | null = null;

	// Single-flight: Track in-progress acquisition to prevent duplicate requests
	private pendingAcquisition: Promise<TokenAcquisitionResult> | null = null;

	// Subscribers for status updates
	private subscribers: Set<TokenStatusCallback> = new Set();

	// Auto-refresh timer
	private refreshTimer: NodeJS.Timeout | null = null;
	private refreshInterval: number = 30000; // 30 seconds

	// Debug mode
	private debugEnabled: boolean = false;

	private constructor() {
		this.log('TokenGatewayV8 initialized');
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): TokenGatewayV8 {
		if (!TokenGatewayV8.instance) {
			TokenGatewayV8.instance = new TokenGatewayV8();
		}
		return TokenGatewayV8.instance;
	}

	/**
	 * Reset instance (for testing only)
	 */
	static resetInstance(): void {
		if (TokenGatewayV8.instance) {
			TokenGatewayV8.instance.stopAutoRefresh();
			TokenGatewayV8.instance.subscribers.clear();
			TokenGatewayV8.instance = null;
		}
	}

	// ========================================================================
	// PUBLIC API
	// ========================================================================

	/**
	 * Acquire worker token
	 *
	 * This is the main entry point for token acquisition.
	 * Uses single-flight pattern to prevent duplicate concurrent requests.
	 *
	 * @param options - Acquisition options
	 * @returns Token acquisition result
	 */
	async getWorkerToken(options: TokenAcquisitionOptions): Promise<TokenAcquisitionResult> {
		const opts = { ...DEFAULT_OPTIONS, ...options };
		this.debugEnabled = opts.debug;

		this.log(`getWorkerToken called`, { mode: opts.mode, forceRefresh: opts.forceRefresh });

		// Check if we already have a valid token (unless force refresh)
		if (!opts.forceRefresh) {
			const currentStatus = this.getWorkerTokenStatusSync();
			if (currentStatus.isValid && currentStatus.token) {
				this.log('Returning existing valid token');
				return {
					success: true,
					token: currentStatus.token,
					expiresAt: currentStatus.expiresAt,
				};
			}
		}

		// Single-flight: If acquisition is already in progress, return the same promise
		if (this.pendingAcquisition) {
			this.log('Acquisition already in progress, returning shared promise');
			return this.pendingAcquisition;
		}

		// Start new acquisition
		this.pendingAcquisition = this.doAcquireToken(opts);

		try {
			const result = await this.pendingAcquisition;
			return result;
		} finally {
			this.pendingAcquisition = null;
		}
	}

	/**
	 * Get current token status (synchronous)
	 */
	getWorkerTokenStatusSync(): TokenStatusInfo {
		return WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
	}

	/**
	 * Get current token status (async, more accurate)
	 */
	async getWorkerTokenStatus(): Promise<TokenStatusInfo> {
		return WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
	}

	/**
	 * Subscribe to token status updates
	 */
	subscribe(callback: TokenStatusCallback): () => void {
		this.subscribers.add(callback);
		this.log(`Subscriber added (total: ${this.subscribers.size})`);

		// Immediately notify with current status
		const currentStatus = this.getWorkerTokenStatusSync();
		callback(currentStatus);

		// Return unsubscribe function
		return () => {
			this.subscribers.delete(callback);
			this.log(`Subscriber removed (total: ${this.subscribers.size})`);
		};
	}

	/**
	 * Start auto-refresh timer
	 */
	startAutoRefresh(intervalMs?: number): void {
		if (intervalMs) {
			this.refreshInterval = intervalMs;
		}

		if (this.refreshTimer) {
			this.log('Auto-refresh already running');
			return;
		}

		this.log(`Starting auto-refresh (interval: ${this.refreshInterval}ms)`);

		this.refreshTimer = setInterval(async () => {
			await this.checkAndRefreshIfNeeded();
		}, this.refreshInterval);
	}

	/**
	 * Stop auto-refresh timer
	 */
	stopAutoRefresh(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
			this.refreshTimer = null;
			this.log('Auto-refresh stopped');
		}
	}

	/**
	 * Check token and refresh if expiring soon
	 */
	async checkAndRefreshIfNeeded(): Promise<void> {
		const status = await this.getWorkerTokenStatus();

		// Notify subscribers of current status
		this.notifySubscribers(status);

		// If expiring soon (< 5 minutes), try to refresh
		if (status.status === 'expiring-soon' || !status.isValid) {
			this.log('Token expiring or invalid, attempting refresh');

			const result = await this.getWorkerToken({
				mode: 'silent',
				forceRefresh: true,
			});

			if (result.success) {
				const newStatus = await this.getWorkerTokenStatus();
				this.notifySubscribers(newStatus);
			}
		}
	}

	/**
	 * Clear stored token (keep credentials)
	 */
	async clearToken(): Promise<void> {
		await unifiedWorkerTokenService.clearToken();
		const status = this.getWorkerTokenStatusSync();
		this.notifySubscribers(status);
		window.dispatchEvent(new Event('workerTokenCleared'));
	}

	/**
	 * Clear all credentials and token
	 */
	async clearAll(): Promise<void> {
		await unifiedWorkerTokenService.clearCredentials();
		const status = this.getWorkerTokenStatusSync();
		this.notifySubscribers(status);
		window.dispatchEvent(new Event('workerTokenCleared'));
	}

	/**
	 * Enable/disable debug logging
	 */
	setDebug(enabled: boolean): void {
		this.debugEnabled = enabled;
	}

	// ========================================================================
	// PRIVATE METHODS
	// ========================================================================

	/**
	 * Perform token acquisition with retry logic
	 */
	private async doAcquireToken(
		opts: Required<Omit<TokenAcquisitionOptions, 'mode'>> & { mode: TokenAcquisitionMode }
	): Promise<TokenAcquisitionResult> {
		// Load credentials
		const credentials = await workerTokenServiceV8.loadCredentials();

		if (!credentials) {
			this.log('No credentials found');
			return {
				success: false,
				error: {
					code: 'NO_CREDENTIALS',
					message: 'No worker token credentials found. Please configure credentials first.',
					retryable: false,
				},
				needsInteraction: true,
			};
		}

		// Validate credentials
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			this.log('Invalid credentials', {
				hasEnvId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
			});
			return {
				success: false,
				error: {
					code: 'INVALID_CREDENTIALS',
					message:
						'Incomplete credentials. Environment ID, Client ID, and Client Secret are required.',
					retryable: false,
				},
				needsInteraction: true,
			};
		}

		// Attempt acquisition with retries
		let lastError: TokenAcquisitionError | undefined;

		for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
			if (attempt > 0) {
				const delay = RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)];
				this.log(`Retry attempt ${attempt}/${opts.maxRetries} after ${delay}ms`);
				await this.sleep(delay);
			}

			try {
				const result = await this.fetchToken(credentials, opts.timeout);

				if (result.success) {
					this.log('Token acquired successfully');

					// Notify subscribers
					const status = this.getWorkerTokenStatusSync();
					this.notifySubscribers(status);

					// Dispatch event for other components
					window.dispatchEvent(new Event('workerTokenUpdated'));

					return result;
				}

				lastError = result.error;

				// Don't retry non-retryable errors
				if (lastError && !lastError.retryable) {
					this.log('Non-retryable error, stopping retries', { code: lastError.code });
					break;
				}
			} catch (error) {
				this.log('Unexpected error during acquisition', { error });
				lastError = {
					code: 'UNKNOWN',
					message: error instanceof Error ? error.message : 'Unknown error',
					retryable: false,
				};
			}
		}

		return {
			success: false,
			error: lastError,
			needsInteraction: opts.mode === 'silent',
		};
	}

	/**
	 * Fetch token from PingOne via proxy
	 */
	private async fetchToken(
		credentials: {
			environmentId: string;
			clientId: string;
			clientSecret: string;
			region?: 'us' | 'eu' | 'ap' | 'ca';
			scopes?: string[];
			tokenEndpointAuthMethod?: string;
		},
		timeout: number
	): Promise<TokenAcquisitionResult> {
		const region = credentials.region || 'us';
		const proxyEndpoint = '/api/pingone/token';
		const defaultScopes = ['mfa:device:manage', 'mfa:device:read'];
		const scopes =
			credentials.scopes && credentials.scopes.length > 0 ? credentials.scopes : defaultScopes;

		const params = new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: credentials.clientId,
			scope: scopes.join(' '),
		});

		const authMethod = credentials.tokenEndpointAuthMethod || 'client_secret_post';

		if (authMethod === 'client_secret_post') {
			params.set('client_secret', credentials.clientSecret);
		}

		const requestBody: Record<string, unknown> = {
			environment_id: credentials.environmentId,
			region,
			body: params.toString(),
			auth_method: authMethod,
		};

		if (authMethod === 'client_secret_basic') {
			const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
			requestBody.headers = { Authorization: `Basic ${basicAuth}` };
		}

		this.log('Fetching token', {
			region,
			authMethod,
			envId: `${credentials.environmentId.substring(0, 8)}...`,
		});

		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(proxyEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				return this.handleHttpError(response);
			}

			const data = (await response.json()) as {
				access_token?: string;
				expires_in?: number;
				error?: string;
				error_description?: string;
			};

			if (data.error) {
				return {
					success: false,
					error: {
						code: data.error === 'unauthorized_client' ? 'UNAUTHORIZED' : 'INVALID_CREDENTIALS',
						message: data.error_description || data.error,
						retryable: false,
					},
				};
			}

			if (!data.access_token) {
				return {
					success: false,
					error: {
						code: 'UNKNOWN',
						message: 'No access token in response',
						retryable: false,
					},
				};
			}

			// Save token
			const expiresIn = data.expires_in || 3600;
			const expiresAt = Date.now() + expiresIn * 1000;

			await workerTokenServiceV8.saveToken(data.access_token, expiresAt);

			return {
				success: true,
				token: data.access_token,
				expiresAt,
			};
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error && error.name === 'AbortError') {
				return {
					success: false,
					error: {
						code: 'TIMEOUT',
						message: `Token acquisition timed out after ${timeout}ms`,
						retryable: true,
					},
				};
			}

			return {
				success: false,
				error: {
					code: 'NETWORK_ERROR',
					message: error instanceof Error ? error.message : 'Network error',
					retryable: true,
				},
			};
		}
	}

	/**
	 * Handle HTTP error responses
	 */
	private async handleHttpError(response: Response): Promise<TokenAcquisitionResult> {
		let errorMessage = `HTTP ${response.status}`;
		let errorCode: TokenErrorCode = 'UNKNOWN';
		let retryable = false;

		try {
			const data = await response.json();
			errorMessage = data.error_description || data.error || data.message || errorMessage;
		} catch {
			// Ignore JSON parse errors
		}

		switch (response.status) {
			case 400:
				errorCode = 'INVALID_CREDENTIALS';
				break;
			case 401:
				errorCode = 'UNAUTHORIZED';
				break;
			case 429:
				errorCode = 'RATE_LIMITED';
				retryable = true;
				break;
			case 500:
			case 502:
			case 503:
			case 504:
				errorCode = 'SERVER_ERROR';
				retryable = true;
				break;
		}

		return {
			success: false,
			error: {
				code: errorCode,
				message: errorMessage,
				retryable,
			},
		};
	}

	/**
	 * Notify all subscribers of status change
	 */
	private notifySubscribers(status: TokenStatusInfo): void {
		this.log(`Notifying ${this.subscribers.size} subscribers`);
		this.subscribers.forEach((callback) => {
			try {
				callback(status);
			} catch (error) {
				console.error(`${MODULE_TAG} Error in subscriber callback:`, error);
			}
		});
	}

	/**
	 * Sleep helper
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Debug logging
	 */
	private log(message: string, data?: Record<string, unknown>): void {
		if (
			this.debugEnabled ||
			(typeof window !== 'undefined' && (window as any).TOKEN_GATEWAY_DEBUG)
		) {
			if (data) {
				console.log(`${MODULE_TAG} ${message}`, data);
			} else {
				console.log(`${MODULE_TAG} ${message}`);
			}
		}
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
export const tokenGatewayV8 = TokenGatewayV8.getInstance();

// Export class for testing
export { TokenGatewayV8 };

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).tokenGatewayV8 = tokenGatewayV8;
	(window as any).TOKEN_GATEWAY_DEBUG = false; // Set to true to enable debug logging
}

export default tokenGatewayV8;
