/**
 * @file TokenManagementServiceV9.ts
 * @module shared/services/v9
 * @description V9 unified token management service
 * @version 9.0.0
 * @since 2026-02-20
 *
 * Consolidates token management from:
 * - workerTokenServiceV8
 * - workerTokenStatusServiceV8
 * - workerTokenCacheServiceV8
 * - workerTokenConfigServiceV8
 * - unifiedWorkerTokenService
 *
 * Provides unified token lifecycle management across all apps and flows.
 */

export interface V9TokenInfo {
	token: string;
	expiresAt: number;
	savedAt: number;
	environmentId?: string;
	[key: string]: unknown;
}

export interface V9TokenStatus {
	status: 'valid' | 'expired' | 'expiring-soon' | 'missing';
	message: string;
	isValid: boolean;
	expiresAt?: number;
	minutesRemaining?: number;
	token?: string;
}

export interface V9TokenConfig {
	storageKey: string;
	defaultExpiration: number; // in milliseconds
	refreshThreshold: number; // minutes before expiration to trigger refresh
}

const DEFAULT_CONFIG: V9TokenConfig = {
	storageKey: 'v9_unified_token',
	defaultExpiration: 3600 * 1000, // 1 hour
	refreshThreshold: 5, // 5 minutes
};

/**
 * V9 Token Management Service
 *
 * Consolidates token management functionality from multiple V8 services
 * into a single, unified service for better maintainability and consistency.
 */
export const TokenManagementServiceV9 = {
	/**
	 * Store a token with expiration and metadata
	 */
	storeToken(token: string, environmentId?: string, customExpiration?: number): void {
		const now = Date.now();
		const expiration = customExpiration || DEFAULT_CONFIG.defaultExpiration;

		const tokenInfo: V9TokenInfo = {
			token,
			expiresAt: now + expiration,
			savedAt: now,
			...(environmentId && { environmentId }),
		};

		try {
			localStorage.setItem(DEFAULT_CONFIG.storageKey, JSON.stringify(tokenInfo));
			console.log('[V9-TOKEN] ✅ Token stored successfully');
		} catch (error) {
			console.error('[V9-TOKEN] Error storing token:', error);
		}
	},

	/**
	 * Retrieve stored token
	 */
	getToken(): V9TokenInfo | null {
		try {
			const stored = localStorage.getItem(DEFAULT_CONFIG.storageKey);
			return stored ? JSON.parse(stored) : null;
		} catch (error) {
			console.error('[V9-TOKEN] Error retrieving token:', error);
			return null;
		}
	},

	/**
	 * Get token string only (for backward compatibility)
	 */
	getTokenString(): string {
		const tokenInfo = this.getToken();
		return tokenInfo?.token || '';
	},

	/**
	 * Check token status synchronously
	 */
	checkTokenStatus(): V9TokenStatus {
		try {
			const tokenInfo = this.getToken();

			if (!tokenInfo || !tokenInfo.token) {
				return {
					status: 'missing',
					message: 'No token found.',
					isValid: false,
				};
			}

			const now = Date.now();
			const expiresAt = tokenInfo.expiresAt;
			const isExpired = now >= expiresAt;
			const minutesRemaining = Math.max(0, Math.floor((expiresAt - now) / 60000));

			if (isExpired) {
				console.warn('[V9-TOKEN] Token expired:', {
					now: new Date(now).toISOString(),
					expiresAt: new Date(expiresAt).toISOString(),
					minutesOverdue: Math.floor((now - expiresAt) / 60000),
				});
			}

			let tokenStatus: V9TokenStatus['status'] = 'valid';
			let message = 'Token is valid and ready to use.';

			if (isExpired) {
				tokenStatus = 'expired';
				message = 'Token has expired. Please generate a new one.';
			} else if (minutesRemaining < DEFAULT_CONFIG.refreshThreshold) {
				tokenStatus = 'expiring-soon';
				message = `Token expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`;
			}

			return {
				status: tokenStatus,
				message,
				isValid: !isExpired,
				expiresAt,
				minutesRemaining,
				token: tokenInfo.token,
			};
		} catch (error) {
			console.error('[V9-TOKEN] Error checking token status:', error);
			return {
				status: 'missing',
				message: 'Error checking token status.',
				isValid: false,
			};
		}
	},

	/**
	 * Check token status asynchronously (for future API integration)
	 */
	async checkTokenStatusAsync(): Promise<V9TokenStatus> {
		// For now, just call the sync version
		// Future: could add server-side validation here
		return this.checkTokenStatus();
	},

	/**
	 * Refresh token (placeholder for future implementation)
	 */
	async refreshToken(): Promise<boolean> {
		console.log('[V9-TOKEN] Token refresh requested (not implemented yet)');
		// Future implementation would call token refresh API
		return false;
	},

	/**
	 * Clear stored token
	 */
	clearToken(): void {
		try {
			localStorage.removeItem(DEFAULT_CONFIG.storageKey);
			console.log('[V9-TOKEN] 🗑️ Token cleared successfully');
		} catch (error) {
			console.error('[V9-TOKEN] Error clearing token:', error);
		}
	},

	/**
	 * Check if token needs refresh
	 */
	needsRefresh(): boolean {
		const status = this.checkTokenStatus();
		return status.status === 'expired' || status.status === 'expiring-soon';
	},

	/**
	 * Get environment ID from stored token
	 */
	getEnvironmentId(): string {
		const tokenInfo = this.getToken();
		return tokenInfo?.environmentId || '';
	},

	/**
	 * Export token data for backup/migration
	 */
	exportTokenData(): V9TokenInfo | null {
		return this.getToken();
	},

	/**
	 * Import token data from backup/migration
	 */
	importTokenData(tokenInfo: V9TokenInfo): void {
		if (tokenInfo?.token) {
			try {
				localStorage.setItem(DEFAULT_CONFIG.storageKey, JSON.stringify(tokenInfo));
				console.log('[V9-TOKEN] 📥 Token data imported successfully');
			} catch (error) {
				console.error('[V9-TOKEN] Error importing token data:', error);
			}
		}
	},

	/**
	 * Get token expiration time as Date object
	 */
	getExpirationDate(): Date | null {
		const tokenInfo = this.getToken();
		return tokenInfo ? new Date(tokenInfo.expiresAt) : null;
	},

	/**
	 * Get time until expiration in milliseconds
	 */
	getTimeUntilExpiration(): number {
		const tokenInfo = this.getToken();
		if (!tokenInfo) return 0;

		return Math.max(0, tokenInfo.expiresAt - Date.now());
	},
};

export default TokenManagementServiceV9;
