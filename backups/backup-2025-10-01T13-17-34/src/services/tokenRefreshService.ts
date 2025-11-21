import type { OAuthTokens } from '../types/storage';
import { logger } from '../utils/logger';
import { oauthStorage } from '../utils/storage';

export interface TokenRefreshConfig {
	tokenEndpoint: string;
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	scope?: string;
}

export interface TokenRefreshResult {
	success: boolean;
	tokens?: OAuthTokens;
	error?: string;
	retryAfter?: number; // seconds to wait before retry
}

export interface TokenRefreshOptions {
	maxRetries?: number;
	retryDelay?: number; // milliseconds
	autoRefresh?: boolean;
	refreshThreshold?: number; // seconds before expiry to refresh
}

/**
 * Token Refresh Service
 * Handles automatic token refresh for Dashboard login
 * Does NOT interfere with OAuth flows - only for authenticated sessions
 */
export class TokenRefreshService {
	private refreshTimer: NodeJS.Timeout | null = null;
	private isRefreshing = false;
	private config: TokenRefreshConfig | null = null;
	private options: TokenRefreshOptions;

	constructor(options: TokenRefreshOptions = {}) {
		this.options = {
			maxRetries: 3,
			retryDelay: 1000,
			autoRefresh: true,
			refreshThreshold: 300, // 5 minutes before expiry
			...options,
		};
	}

	/**
	 * Validate refresh token format
	 */
	private isValidRefreshToken(token: string): boolean {
		if (!token || token.trim() === '') return false;
		if (token.length < 10) return false;
		// Basic format validation - refresh tokens are typically longer and contain various characters
		if (token.length > 1000) return false; // Reasonable upper limit
		return true;
	}

	/**
	 * Initialize token refresh service with configuration
	 */
	async initialize(config: TokenRefreshConfig): Promise<void> {
		this.config = config;

		// Validate that we have a refresh token before attempting auto-refresh
		if (!this.isValidRefreshToken(config.refreshToken)) {
			logger.warn(
				'TokenRefreshService',
				'Invalid refresh token provided, skipping auto-refresh initialization',
				{
					hasToken: !!config.refreshToken,
					tokenLength: config.refreshToken?.length || 0,
				}
			);
			return;
		}

		if (this.options.autoRefresh) {
			await this.scheduleRefresh();
		}

		logger.info('TokenRefreshService', 'Service initialized', {
			autoRefresh: this.options.autoRefresh,
			refreshThreshold: this.options.refreshThreshold,
			hasRefreshToken: !!config.refreshToken,
			refreshTokenLength: config.refreshToken.length,
		});
	}

	/**
	 * Manually refresh tokens
	 */
	async refreshTokens(): Promise<TokenRefreshResult> {
		if (!this.config) {
			return {
				success: false,
				error: 'Token refresh service not initialized',
			};
		}

		if (!this.isValidRefreshToken(this.config.refreshToken)) {
			return {
				success: false,
				error: 'Invalid or missing refresh token',
			};
		}

		if (this.isRefreshing) {
			logger.info('TokenRefreshService', 'Refresh already in progress, skipping');
			return {
				success: false,
				error: 'Refresh already in progress',
			};
		}

		this.isRefreshing = true;

		try {
			logger.info('TokenRefreshService', 'Starting token refresh');

			const result = await this.performTokenRefresh(this.config);

			if (result.success && result.tokens) {
				// Store the new tokens
				await oauthStorage.setTokens(result.tokens);

				// Reschedule next refresh
				if (this.options.autoRefresh) {
					await this.scheduleRefresh();
				}

				logger.info('TokenRefreshService', 'Token refresh completed successfully');
			} else {
				logger.error('TokenRefreshService', 'Token refresh failed', { error: result.error });
			}

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			logger.error('TokenRefreshService', 'Token refresh error', error);

			return {
				success: false,
				error: errorMessage,
			};
		} finally {
			this.isRefreshing = false;
		}
	}

	/**
	 * Perform the actual token refresh request
	 */
	private async performTokenRefresh(config: TokenRefreshConfig): Promise<TokenRefreshResult> {
		const { tokenEndpoint, clientId, clientSecret, refreshToken, scope } = config;

		try {
			const body = new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: clientId,
				client_secret: clientSecret,
			});

			if (scope) {
				body.set('scope', scope);
			}

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
				body: body.toString(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				let retryAfter: number | undefined;

				// Check for rate limiting
				if (response.status === 429) {
					const retryAfterHeader = response.headers.get('Retry-After');
					retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
				}

				// Check for invalid refresh token
				if (response.status === 400 || response.status === 401) {
					logger.error(
						'TokenRefreshService',
						'Invalid refresh token, stopping auto-refresh and clearing stored tokens',
						{
							status: response.status,
							refreshTokenLength: this.config?.refreshToken?.length || 0,
							refreshTokenPreview: this.config?.refreshToken
								? this.config.refreshToken.substring(0, 10) + '...'
								: 'none',
							clientId: this.config?.clientId,
						}
					);
					this.stopAutoRefresh();

					// Clear invalid tokens from storage
					try {
						await oauthStorage.clearTokens();
						logger.info('TokenRefreshService', 'Cleared invalid tokens from storage');
					} catch (error) {
						logger.error(
							'TokenRefreshService',
							'Failed to clear invalid tokens from storage',
							error
						);
					}
				}

				return {
					success: false,
					error: `Token refresh failed: ${response.status} ${errorText}`,
					retryAfter,
				};
			}

			const tokenData = await response.json();

			// Validate response
			if (!tokenData.access_token) {
				return {
					success: false,
					error: 'No access token in response',
				};
			}

			const tokens: OAuthTokens = {
				access_token: tokenData.access_token,
				token_type: tokenData.token_type || 'Bearer',
				expires_in: tokenData.expires_in,
				refresh_token: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
				scope: tokenData.scope,
				id_token: tokenData.id_token,
			};

			return {
				success: true,
				tokens,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Network error';
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Schedule the next token refresh
	 */
	private async scheduleRefresh(): Promise<void> {
		if (this.refreshTimer) {
			clearTimeout(this.refreshTimer);
		}

		try {
			const tokens = await oauthStorage.getTokens();
			if (!tokens?.access_token || !tokens?.expires_in) {
				logger.warn('TokenRefreshService', 'No valid tokens found for scheduling refresh');
				return;
			}

			// Check if we have a valid refresh token
			if (!this.config?.refreshToken || !this.isValidRefreshToken(this.config.refreshToken)) {
				logger.warn(
					'TokenRefreshService',
					'No valid refresh token available for scheduling refresh'
				);
				return;
			}

			// Calculate when to refresh (before expiry)
			const expiresAt = tokens.expires_in * 1000; // Convert to milliseconds
			const refreshThreshold = (this.options.refreshThreshold || 300) * 1000;
			const refreshAt = expiresAt - refreshThreshold;

			// If token is already expired or about to expire, refresh immediately
			if (refreshAt <= Date.now()) {
				logger.info('TokenRefreshService', 'Token expires soon, refreshing immediately');
				await this.refreshTokens();
				return;
			}

			const delay = refreshAt - Date.now();

			this.refreshTimer = setTimeout(async () => {
				await this.refreshTokens();
			}, delay);

			logger.info('TokenRefreshService', 'Next refresh scheduled', {
				refreshIn: Math.round(delay / 1000),
				refreshAt: new Date(refreshAt).toISOString(),
			});
		} catch (error) {
			logger.error('TokenRefreshService', 'Failed to schedule refresh', error);
		}
	}

	/**
	 * Stop automatic token refresh
	 */
	stopAutoRefresh(): void {
		if (this.refreshTimer) {
			clearTimeout(this.refreshTimer);
			this.refreshTimer = null;
		}

		logger.info('TokenRefreshService', 'Auto-refresh stopped');
	}

	/**
	 * Check if tokens need refresh
	 */
	async needsRefresh(): Promise<boolean> {
		try {
			const tokens = await oauthStorage.getTokens();
			if (!tokens?.access_token || !tokens?.expires_in) {
				return false;
			}

			const expiresAt = tokens.expires_in * 1000;
			const refreshThreshold = (this.options.refreshThreshold || 300) * 1000;

			return expiresAt - Date.now() <= refreshThreshold;
		} catch (error) {
			logger.error('TokenRefreshService', 'Error checking refresh need', error);
			return false;
		}
	}

	/**
	 * Get refresh status
	 */
	getStatus(): {
		isInitialized: boolean;
		isRefreshing: boolean;
		autoRefreshEnabled: boolean;
		nextRefreshAt?: Date;
	} {
		return {
			isInitialized: !!this.config,
			isRefreshing: this.isRefreshing,
			autoRefreshEnabled: this.options.autoRefresh || false,
			nextRefreshAt: this.refreshTimer
				? new Date(Date.now() + (this.refreshTimer as any)._idleTimeout)
				: undefined,
		};
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.stopAutoRefresh();
		this.config = null;
		this.isRefreshing = false;

		logger.info('TokenRefreshService', 'Service destroyed');
	}
}

// Global instance for Dashboard use
export const tokenRefreshService = new TokenRefreshService({
	autoRefresh: true,
	refreshThreshold: 300, // 5 minutes before expiry
	maxRetries: 3,
	retryDelay: 1000,
});

// Utility functions for Dashboard integration
export const initializeTokenRefresh = async (config: TokenRefreshConfig): Promise<void> => {
	await tokenRefreshService.initialize(config);
};

export const refreshTokens = async (): Promise<TokenRefreshResult> => {
	return await tokenRefreshService.refreshTokens();
};

export const stopTokenRefresh = (): void => {
	tokenRefreshService.stopAutoRefresh();
};

export const getTokenRefreshStatus = () => {
	return tokenRefreshService.getStatus();
};
