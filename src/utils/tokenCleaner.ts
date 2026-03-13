import { logger } from './logger';
// src/utils/tokenCleaner.ts
// Utility for clearing all OAuth/OIDC tokens from storage

export interface TokenCleanupResult {
	success: boolean;
	clearedCount: number;
	errors: string[];
}

/**
 * Comprehensive token cleanup utility
 * Clears all OAuth/OIDC tokens from localStorage and sessionStorage
 */
export function clearAllTokens(): TokenCleanupResult {
	const result: TokenCleanupResult = {
		success: true,
		clearedCount: 0,
		errors: [],
	};

	try {
		logger.info('[TokenCleaner] Starting comprehensive token cleanup...', 'Logger info');

		// Define all known token storage keys
		const tokenKeys = [
			// OAuth/OIDC tokens
			'oauth_tokens',
			'client_credentials_tokens',
			'device_flow_tokens',
			'auth_tokens',
			'pingone_tokens',
			'access_token',
			'id_token',
			'refresh_token',

			// Token analysis and management
			'token_to_analyze',
			'token_type',
			'flow_source',
			'tokenManagementFlowContext',

			// Secure token storage
			'pingone_secure_tokens',

			// Flow-specific tokens (V5)
			'worker_token_v5_step_manager-step',
			'authorization_code_v5-tokens',
			'hybrid_flow_v5-tokens',
			'implicit_flow_v5-tokens',

			// Flow-specific tokens (V6)
			'oauth-authorization-code-v6-tokens',
			'oidc-authorization-code-v6-tokens',
			'worker-token-v6-tokens',
			'client-credentials-v6-tokens',
			'implicit-flow-v6-tokens',
			'device-flow-v6-tokens',
			'par-flow-v6-tokens',
			'rar-flow-v6-tokens',
			'redirectless-flow-v6-tokens',
			'jwt-bearer-v6-tokens',
			'saml-bearer-v6-tokens',

			// Generic flow tokens
			'current-flow-tokens',
			'flow-tokens',
			'tokens',

			// CIBA flow tokens
			'ciba_flow_tokens',
			'ciba_flow_config',
			'ciba_auth_request',

			// Session flags
			'oauth-implicit-v6-flow-active',
			'oidc-implicit-v6-flow-active',
			'implicit-v6-active',
			'flow-active',
		];

		// Clear from localStorage
		tokenKeys.forEach((key) => {
			try {
				if (localStorage.getItem(key)) {
					localStorage.removeItem(key);
					result.clearedCount++;
					logger.info(`[TokenCleaner] Cleared localStorage: ${key}`, 'Logger info');
				}
			} catch (error) {
				result.errors.push(`Failed to clear localStorage key "${key}": ${error}`);
			}
		});

		// Clear from sessionStorage
		tokenKeys.forEach((key) => {
			try {
				if (sessionStorage.getItem(key)) {
					sessionStorage.removeItem(key);
					result.clearedCount++;
					logger.info(`[TokenCleaner] Cleared sessionStorage: ${key}`, 'Logger info');
				}
			} catch (error) {
				result.errors.push(`Failed to clear sessionStorage key "${key}": ${error}`);
			}
		});

		// Clear token cache entries (they have a prefix)
		const TOKEN_CACHE_PREFIX = 'token_cache_';
		try {
			const keysToRemove: string[] = [];

			// Collect keys to remove (can't modify storage while iterating)
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(TOKEN_CACHE_PREFIX)) {
					keysToRemove.push(key);
				}
			}

			// Remove collected keys
			keysToRemove.forEach((key) => {
				localStorage.removeItem(key);
				result.clearedCount++;
				logger.info(`[TokenCleaner] Cleared token cache: ${key}`, 'Logger info');
			});
		} catch (error) {
			result.errors.push(`Failed to clear token cache: ${error}`);
		}

		// Clear any flow-specific session storage with token patterns
		try {
			const sessionKeysToRemove: string[] = [];

			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key && (key.includes('token') || key.includes('flow') || key.includes('oauth'))) {
					sessionKeysToRemove.push(key);
				}
			}

			sessionKeysToRemove.forEach((key) => {
				sessionStorage.removeItem(key);
				result.clearedCount++;
				logger.info(`[TokenCleaner] Cleared session flow data: ${key}`, 'Logger info');
			});
		} catch (error) {
			result.errors.push(`Failed to clear session flow data: ${error}`);
		}

		if (result.errors.length > 0) {
			result.success = false;
			logger.warn('TokenCleaner', 'Token cleanup completed with errors:', {
				errors: result.errors,
			});
		} else {
			logger.info(
				`[TokenCleaner] Token cleanup completed successfully. Cleared ${result.clearedCount} items.`,
				'Logger info'
			);
		}
	} catch (error) {
		result.success = false;
		result.errors.push(`Token cleanup failed: ${error}`);
		logger.error('TokenCleaner', 'Token cleanup failed:', undefined, error as Error);
	}

	return result;
}

/**
 * Clear tokens for a specific flow
 */
export function clearFlowTokens(flowId: string): TokenCleanupResult {
	const result: TokenCleanupResult = {
		success: true,
		clearedCount: 0,
		errors: [],
	};

	try {
		logger.info(`[TokenCleaner] Clearing tokens for flow: ${flowId}`, 'Logger info');

		const flowKeys = [
			`${flowId}_tokens`,
			`${flowId}-tokens`,
			`${flowId}_config`,
			`${flowId}_state`,
			`flow_source_${flowId}`,
			flowId,
		];

		flowKeys.forEach((key) => {
			try {
				if (localStorage.getItem(key)) {
					localStorage.removeItem(key);
					result.clearedCount++;
				}
				if (sessionStorage.getItem(key)) {
					sessionStorage.removeItem(key);
					result.clearedCount++;
				}
			} catch (error) {
				result.errors.push(`Failed to clear flow key "${key}": ${error}`);
			}
		});

		if (result.errors.length > 0) {
			result.success = false;
		}

		logger.info(
			`[TokenCleaner] Flow cleanup completed. Cleared ${result.clearedCount} items for ${flowId}.`,
			'Logger info'
		);
	} catch (error) {
		result.success = false;
		result.errors.push(`Flow cleanup failed: ${error}`);
	}

	return result;
}

/**
 * Check if any tokens exist in storage
 */
export function hasTokensInStorage(): boolean {
	try {
		const tokenKeys = [
			'oauth_tokens',
			'client_credentials_tokens',
			'device_flow_tokens',
			'auth_tokens',
			'token_to_analyze',
		];

		// Check localStorage
		for (const key of tokenKeys) {
			if (localStorage.getItem(key)) {
				return true;
			}
		}

		// Check sessionStorage
		for (const key of tokenKeys) {
			if (sessionStorage.getItem(key)) {
				return true;
			}
		}

		// Check for token cache entries
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('token_cache_')) {
				return true;
			}
		}

		return false;
	} catch (error) {
		logger.error('TokenCleaner', 'Failed to check for tokens:', undefined, error as Error);
		return false;
	}
}

/**
 * Get count of tokens in storage
 */
export function getTokenCount(): number {
	try {
		let count = 0;

		const tokenKeys = [
			'oauth_tokens',
			'client_credentials_tokens',
			'device_flow_tokens',
			'auth_tokens',
			'token_to_analyze',
			'tokenManagementFlowContext',
		];

		// Count localStorage tokens
		tokenKeys.forEach((key) => {
			if (localStorage.getItem(key)) count++;
		});

		// Count sessionStorage tokens
		tokenKeys.forEach((key) => {
			if (sessionStorage.getItem(key)) count++;
		});

		// Count token cache entries
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('token_cache_')) {
				count++;
			}
		}

		return count;
	} catch (error) {
		logger.error('TokenCleaner', 'Failed to count tokens:', undefined, error as Error);
		return 0;
	}
}
