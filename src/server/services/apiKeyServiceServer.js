/**
 * @file apiKeyServiceServer.js
 * @module server/services
 * @description Server-side API key service for accessing stored API keys
 * @version 1.0.0
 * @since 2026-03-11
 */

import { unifiedTokenStorage } from '../../services/unifiedTokenStorageService.js';
import { logger } from '../../utils/logger.js';

const MODULE_TAG = '[🔑 API-KEY-SERVER]';

/**
 * Server-side API key service for accessing stored API keys
 * This service runs on the server and can access the unified token storage
 */
export class ApiKeyServiceServer {
	static #instance = null;

	static getInstance() {
		if (!ApiKeyServiceServer.#instance) {
			ApiKeyServiceServer.#instance = new ApiKeyServiceServer();
		}
		return ApiKeyServiceServer.#instance;
	}

	/**
	 * Get an API key from secure storage
	 */
	async getApiKey(service) {
		try {
			const tokenId = `api_key_${service}`;
			const result = await unifiedTokenStorage.getToken(tokenId);

			if (result.success && result.token) {
				// Update last used timestamp
				await this.updateLastUsed(service);
				return result.token.value;
			}

			return null;
		} catch (error) {
			logger.error(MODULE_TAG, 'Error retrieving API key:', error);
			return null;
		}
	}

	/**
	 * Check if an API key exists and is active
	 */
	async hasApiKey(service) {
		try {
			const tokenId = `api_key_${service}`;
			const result = await unifiedTokenStorage.getToken(tokenId);

			if (result.success && result.token) {
				const metadata = result.token.metadata;
				return metadata?.isActive === true;
			}

			return false;
		} catch (error) {
			logger.error(MODULE_TAG, 'Error checking API key:', error);
			return false;
		}
	}

	/**
	 * Update the last used timestamp for an API key
	 */
	async updateLastUsed(service) {
		try {
			const tokenId = `api_key_${service}`;
			const result = await unifiedTokenStorage.getToken(tokenId);

			if (result.success && result.token) {
				const updatedToken = {
					...result.token,
					metadata: {
						...result.token.metadata,
						lastUsed: Date.now(),
					},
				};

				await unifiedTokenStorage.storeToken(updatedToken, {
					id: tokenId,
				});
			}
		} catch (error) {
			// Don't log error for this optional update
			logger.debug(MODULE_TAG, 'Could not update last used timestamp:', error);
		}
	}
}

// Export singleton instance
export const apiKeyServiceServer = ApiKeyServiceServer.getInstance();
