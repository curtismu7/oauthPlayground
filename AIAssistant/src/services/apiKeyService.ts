/**
 * @file apiKeyService.ts
 * @module services
 * @description Secure API key management service using unified token storage
 * @version 1.0.0
 * @since 2026-03-11
 *
 * Provides secure storage and management for API keys including:
 * - Brave Search API key
 * - Future API keys for other services
 * - Encrypted storage using unified token storage
 * - Easy retrieval for MCP servers and application use
 */

import { logger } from '../utils/logger';
import { UnifiedTokenStorageService } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔑 API-KEY-SERVICE]';

// Create singleton instance
const unifiedTokenStorageService = UnifiedTokenStorageService.getInstance();

export interface ApiKeyInfo {
	id: string;
	service: string;
	name: string;
	description: string;
	value: string;
	createdAt: string;
	updatedAt: string;
	lastUsedAt?: string;
	isActive: boolean;
}

export interface ApiKeyConfig {
	service: string;
	name: string;
	description: string;
	required: boolean;
	validation?: {
		type: 'regex' | 'length' | 'none';
		pattern?: RegExp;
		minLength?: number;
	};
	maskChar?: string;
}

// Supported API key configurations
export const API_KEY_CONFIGS: Record<string, ApiKeyConfig> = {
	'brave-search': {
		service: 'brave-search',
		name: 'Brave Search API',
		description: 'API key for Brave Search service used in AI Assistant web search',
		required: false,
		validation: {
			type: 'regex',
			pattern: /^[A-Za-z0-9_-]+$/,
		},
		maskChar: '*',
	},
	github: {
		service: 'github',
		name: 'GitHub Personal Access Token',
		description: 'Personal access token for GitHub API integration',
		required: false,
		validation: {
			type: 'regex',
			pattern: /^ghp_[A-Za-z0-9_]+$/,
		},
		maskChar: '*',
	},
	groq: {
		service: 'groq',
		name: 'Groq API Key',
		description: 'API key for Groq LLM (Llama 3.3 70B) used by the AI Assistant',
		required: false,
		validation: {
			type: 'regex',
			pattern: /^gsk_[A-Za-z0-9_]+$/,
		},
		maskChar: '*',
	},
};

export interface ApiKeyValidationResult {
	isValid: boolean;
	error?: string;
}

class ApiKeyService {
	private static instance: ApiKeyService;

	private constructor() {}

	public static getInstance(): ApiKeyService {
		if (!ApiKeyService.instance) {
			ApiKeyService.instance = new ApiKeyService();
		}
		return ApiKeyService.instance;
	}

	/**
	 * Store an API key securely
	 */
	public async storeApiKey(
		service: string,
		apiKey: string,
		metadata?: Record<string, unknown>
	): Promise<void> {
		// Validate API key before storing
		const validation = this.validateApiKey(service, apiKey);
		if (!validation.isValid) {
			throw new Error(`Invalid API key: ${validation.error}`);
		}

		// Store in unified storage
		await unifiedTokenStorageService.storeToken({
			type: 'api_key',
			value: apiKey,
			expiresAt: null, // API keys don't expire unless manually revoked
			issuedAt: Date.now(),
			source: 'user_input',
			metadata: {
				service,
				...metadata,
				createdAt: new Date().toISOString(),
				lastUsedAt: new Date().toISOString(),
				validationType: API_KEY_CONFIGS[service]?.validation?.type || 'none',
			},
		});

		// Also store on backend for immediate use
		try {
			const response = await fetch(`/api/api-key/${service}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ apiKey }),
			});

			if (!response.ok) {
				logger.warn('ApiKeyService', `Failed to store API key on backend: ${response.statusText}`);
			}
		} catch (error) {
			logger.warn('ApiKeyService', 'Failed to store API key on backend', { error: String(error) });
		}
	}

	/**
	 * Retrieve an API key
	 */
	public async getApiKey(service: string): Promise<string | null> {
		try {
			const result = await unifiedTokenStorageService.getTokens({
				type: 'api_key',
			});

			if (result.success && result.data) {
				// Find the token for the specified service
				const token = result.data.find((t: any) => t.metadata?.service === service);
				if (token) {
					// Update last used timestamp
					await this.updateLastUsed(service);
					return token.value;
				}
			}

			// IndexedDB miss — ask the backend (holds env / disk JSON / sqlite-store copies).
			// This recovers keys after a browser-data clear or fresh install.
			try {
				const res = await fetch(`/api/api-key/${service}`);
				const data = await res.json();
				if (data.success && data.apiKey) {
					// Sync back into IndexedDB so subsequent reads are fast
					await this.storeApiKey(service, data.apiKey);
					return data.apiKey;
				}
			} catch { /* network unavailable — return null below */ }

			return null;
		} catch (error) {
			logger.error(MODULE_TAG, 'Error retrieving API key:', error);
			return null;
		}
	}

	/**
	 * Get API key info (without exposing the actual key)
	 */
	public async getApiKeyInfo(service: string): Promise<ApiKeyInfo | null> {
		try {
			const result = await unifiedTokenStorageService.getTokens({
				type: 'api_key',
			});

			if (result.success && result.data) {
				const item = result.data.find((t: any) => t.metadata?.service === service);
				if (item) {
					const metadata = (item.metadata || {}) as Record<string, unknown>;
					return {
						id: item.id,
						service: (metadata.service as string | undefined) || service,
						name: (metadata.name as string | undefined) || service,
						description: (metadata.description as string | undefined) || '',
						value: this.maskApiKey(item.value),
						createdAt: (metadata.createdAt as string | undefined) || '',
						updatedAt: (metadata.updatedAt as string | undefined) || (metadata.createdAt as string | undefined) || '',
						lastUsedAt: metadata.lastUsedAt as string | undefined,
						isActive: (metadata.isActive as boolean | undefined) !== false,
					};
				}
			}

			return null;
		} catch (error) {
			logger.error(MODULE_TAG, 'Error retrieving API key info:', error);
			return null;
		}
	}

	/**
	 * Get all stored API keys info
	 */
	public async getAllApiKeys(): Promise<ApiKeyInfo[]> {
		try {
			const result = await unifiedTokenStorageService.getTokens({
				type: 'api_key',
			});

			if (result.success && result.data) {
				return result.data.map((item: any) => {
					const metadata = (item.metadata || {}) as Record<string, unknown>;
					return {
						id: item.id,
						service: (metadata.service as string | undefined) || (item.service as string | undefined) || '',
						name: (metadata.name as string | undefined) || (item.service as string | undefined) || '',
						description: (metadata.description as string | undefined) || '',
						value: this.maskApiKey(item.value),
						createdAt: (metadata.createdAt as string | undefined) || '',
						updatedAt: (metadata.updatedAt as string | undefined) || (metadata.createdAt as string | undefined) || '',
						lastUsedAt: metadata.lastUsedAt as string | undefined,
						isActive: (metadata.isActive as boolean | undefined) !== false,
					};
				});
			}

			return [];
		} catch (error) {
			logger.error(MODULE_TAG, 'Error retrieving all API keys:', error);
			return [];
		}
	}

	/**
	 * Delete an API key
	 */
	public async deleteApiKey(service: string): Promise<boolean> {
		try {
			const result = await unifiedTokenStorageService.getTokens({
				type: 'api_key',
			});

			if (result.success && result.data) {
				const item = result.data.find((t: any) => t.metadata?.service === service);
				if (item) {
					const deleteResult = await unifiedTokenStorageService.deleteToken(item.id);
					if (deleteResult.success) {
						logger.info(MODULE_TAG, `Deleted API key for ${service}`);
						return true;
					}
				}
			}

			return false;
		} catch (error) {
			logger.error(MODULE_TAG, 'Error deleting API key:', error);
			return false;
		}
	}

	/**
	 * Check if an API key exists and is active
	 */
	public async hasApiKey(service: string): Promise<boolean> {
		const info = await this.getApiKeyInfo(service);
		return !!info?.isActive;
	}

	/**
	 * Update the last used timestamp for an API key
	 */
	private async updateLastUsed(service: string): Promise<void> {
		try {
			const result = await unifiedTokenStorageService.getTokens({
				type: 'api_key',
			});

			if (result.success && result.data) {
				const item = result.data.find((t: any) => t.metadata?.service === service);
				if (item) {
					// Update the token with new lastUsed timestamp
					const updatedToken = {
						...item,
						metadata: {
							...item.metadata,
							lastUsedAt: new Date().toISOString(),
						},
					};

					// Store the updated token (will replace existing)
					await unifiedTokenStorageService.storeToken(
						{
							type: 'api_key',
							value: updatedToken.value,
							expiresAt: updatedToken.expiresAt,
							issuedAt: updatedToken.issuedAt,
							source: updatedToken.source,
							metadata: updatedToken.metadata,
						},
						{ id: item.id }
					);
				}
			}
		} catch (error) {
			// Don't log error for this optional update
			logger.debug(MODULE_TAG, 'Could not update last used timestamp:', error);
		}
	}

	/**
	 * Mask API key for display
	 */
	private maskApiKey(apiKey: string): string {
		if (!apiKey || apiKey.length < 8) {
			return apiKey;
		}

		const visibleChars = 4;
		const maskedChars = apiKey.length - visibleChars;
		const visiblePart = apiKey.slice(0, visibleChars);
		const maskedPart = '*'.repeat(maskedChars);

		return visiblePart + maskedPart;
	}

	/**
	 * Validate API key format
	 */
	public validateApiKey(service: string, apiKey: string): ApiKeyValidationResult {
		const config = API_KEY_CONFIGS[service];
		if (!config || !config.validation) {
			return { isValid: true }; // No validation required
		}

		const { validation } = config;

		switch (validation.type) {
			case 'regex':
				if (validation.pattern && !validation.pattern.test(apiKey)) {
					return {
						isValid: false,
						error: `Invalid format for ${config.name}`,
					};
				}
				break;
			case 'length':
				if (validation.minLength && apiKey.length < validation.minLength) {
					return {
						isValid: false,
						error: `${config.name} must be at least ${validation.minLength} characters`,
					};
				}
				break;
			default:
				break;
		}

		return { isValid: true };
	}

	/**
	 * Get configuration for a service
	 */
	public getServiceConfig(service: string): ApiKeyConfig | null {
		return API_KEY_CONFIGS[service] || null;
	}

	/**
	 * Get all available service configurations
	 */
	public getAllServiceConfigs(): ApiKeyConfig[] {
		return Object.values(API_KEY_CONFIGS);
	}
}

// Export singleton instance
export const apiKeyService = ApiKeyService.getInstance();

// Export convenience functions for Brave Search API
export const getBraveApiKey = () => apiKeyService.getApiKey('brave-search');
export const storeBraveApiKey = (apiKey: string) =>
	apiKeyService.storeApiKey('brave-search', apiKey);
export const hasBraveApiKey = () => apiKeyService.hasApiKey('brave-search');
export const deleteBraveApiKey = () => apiKeyService.deleteApiKey('brave-search');
