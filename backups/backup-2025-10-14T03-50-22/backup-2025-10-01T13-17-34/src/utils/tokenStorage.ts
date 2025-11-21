/**
 * Shared token storage utility for OAuth flow pages
 * Ensures all flows store and read tokens from the same location
 */

import { logger } from './logger';
import { secureTokenStorage } from './secureTokenStorage';
import { oauthStorage } from './storage';
import { addTokenToHistory } from './tokenHistory';
import { tokenLifecycleManager } from './tokenLifecycle';

export interface OAuthTokens {
	access_token: string;
	id_token?: string;
	refresh_token?: string;
	token_type: string;
	expires_in: number;
	scope: string;
	timestamp?: number;
}

/**
 * Store OAuth tokens using the standardized storage method
 * @param tokens - The OAuth tokens to store
 * @param flowType - The OAuth flow type (e.g., 'authorization_code', 'implicit')
 * @param flowName - The display name of the flow
 * @returns boolean - Success status
 */
export const storeOAuthTokens = (
	tokens: OAuthTokens,
	flowType?: string,
	flowName?: string
): boolean => {
	try {
		logger.debug('TokenStorage', 'storeOAuthTokens called', {
			tokens: tokens.access_token ? 'HAS_ACCESS_TOKEN' : 'NO_ACCESS_TOKEN',
			flowType,
			flowName,
		});

		// Add timestamp if not present
		const tokensWithTimestamp = {
			...tokens,
			timestamp: tokens.timestamp || Date.now(),
		};

		// Store using secure storage (encrypted sessionStorage)
		const success = secureTokenStorage.storeTokens(tokensWithTimestamp);

		if (success) {
			logger.success('TokenStorage', 'Tokens stored securely using secureTokenStorage');

			// Add to token history if flow information is provided
			if (flowType && flowName) {
				logger.info('TokenStorage', 'Adding tokens to history for flow', { flowType, flowName });
				addTokenToHistory(flowType, flowName, tokensWithTimestamp);

				// Register token in lifecycle management system
				try {
					const tokenId = tokenLifecycleManager.registerToken(
						tokensWithTimestamp,
						flowType,
						flowName
					);
					logger.flow('TokenStorage', 'Token registered in lifecycle system', { tokenId });
				} catch (error) {
					logger.warn(
						'TokenStorage',
						'Failed to register token in lifecycle system',
						undefined,
						error
					);
				}
			} else {
				logger.warn(
					'TokenStorage',
					'No flow information provided, tokens not added to history or lifecycle system'
				);
			}
		} else {
			logger.error('TokenStorage', 'Failed to store tokens using secureTokenStorage');
		}

		return success;
	} catch (error) {
		logger.error('TokenStorage', 'Error storing tokens', undefined, error);
		return false;
	}
};

/**
 * Retrieve OAuth tokens using the standardized storage method
 * @returns OAuthTokens | null - The stored tokens or null if not found
 */
export const getOAuthTokens = (): OAuthTokens | null => {
	try {
		const tokens = secureTokenStorage.getTokens();

		if (tokens) {
			logger.success('TokenStorage', 'Tokens retrieved successfully from secureTokenStorage');
			return tokens;
		} else {
			logger.info('TokenStorage', 'No tokens found in secureTokenStorage');
			return null;
		}
	} catch (error) {
		logger.error('TokenStorage', 'Error retrieving tokens', undefined, error);
		return null;
	}
};

/**
 * Clear OAuth tokens using the standardized storage method
 * @returns boolean - Success status
 */
export const clearOAuthTokens = (): boolean => {
	try {
		const success = secureTokenStorage.clearTokens();

		if (success) {
			logger.success('TokenStorage', 'Tokens cleared successfully from secureTokenStorage');
		} else {
			logger.error('TokenStorage', 'Failed to clear tokens from secureTokenStorage');
		}

		return success;
	} catch (error) {
		logger.error('TokenStorage', 'Error clearing tokens', undefined, error);
		return false;
	}
};

/**
 * Check if OAuth tokens exist and are valid
 * @returns boolean - Whether valid tokens exist
 */
export const hasValidOAuthTokens = (): boolean => {
	try {
		return secureTokenStorage.hasValidTokens();
	} catch (error) {
		logger.error('TokenStorage', 'Error checking token validity', undefined, error);
		return false;
	}
};

/**
 * Get token expiration status
 * @returns object - Token expiration information
 */
export const getTokenExpirationStatus = () => {
	try {
		return secureTokenStorage.getTokenExpirationStatus();
	} catch (error) {
		logger.error('TokenStorage', 'Error getting token expiration status', undefined, error);
		return {
			hasTokens: false,
			isExpired: false,
			expiresAt: null,
			timeRemaining: null,
		};
	}
};
