/**
 * @file useApiKeyManager.ts
 * @module hooks
 * @description React hook for managing API keys
 * @version 1.0.0
 * @since 2026-03-11
 */

import { useCallback, useEffect, useState } from 'react';
import { type ApiKeyConfig, type ApiKeyInfo, apiKeyService } from '../services/apiKeyService';

interface UseApiKeyManagerOptions {
	autoLoad?: boolean;
	service?: string;
}

interface UseApiKeyManagerReturn {
	// State
	apiKeys: ApiKeyInfo[];
	loading: boolean;
	error: string | null;

	// Actions
	loadApiKeys: () => Promise<void>;
	storeApiKey: (service: string, apiKey: string) => Promise<boolean>;
	deleteApiKey: (service: string) => Promise<boolean>;
	getApiKey: (service: string) => Promise<string | null>;
	hasApiKey: (service: string) => Promise<boolean>;

	// Service info
	getServiceConfig: (service: string) => ApiKeyConfig | null;
	getAllServiceConfigs: () => ApiKeyConfig[];

	// Validation
	validateApiKey: (service: string, apiKey: string) => boolean;
}

export const useApiKeyManager = (options: UseApiKeyManagerOptions = {}): UseApiKeyManagerReturn => {
	const { autoLoad = true, service: focusService } = options;

	const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load all API keys
	const loadApiKeys = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const keys = await apiKeyService.getAllApiKeys();
			setApiKeys(keys);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load API keys';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, []);

	// Store an API key
	const storeApiKey = useCallback(
		async (service: string, apiKey: string): Promise<boolean> => {
			setLoading(true);
			setError(null);

			try {
				await apiKeyService.storeApiKey(service, apiKey);
				// Reload the keys to update the list
				await loadApiKeys();
				return true;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to store API key';
				setError(errorMessage);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[loadApiKeys]
	);

	// Delete an API key
	const deleteApiKey = useCallback(
		async (service: string): Promise<boolean> => {
			setLoading(true);
			setError(null);

			try {
				const success = await apiKeyService.deleteApiKey(service);
				if (success) {
					// Reload the keys to update the list
					await loadApiKeys();
				} else {
					setError(`Failed to delete API key for ${service}`);
				}
				return success;
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to delete API key';
				setError(errorMessage);
				return false;
			} finally {
				setLoading(false);
			}
		},
		[loadApiKeys]
	);

	// Get a specific API key
	const getApiKey = useCallback(async (service: string): Promise<string | null> => {
		try {
			return await apiKeyService.getApiKey(service);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to get API key';
			setError(errorMessage);
			return null;
		}
	}, []);

	// Check if API key exists
	const hasApiKey = useCallback(async (service: string): Promise<boolean> => {
		try {
			return await apiKeyService.hasApiKey(service);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to check API key';
			setError(errorMessage);
			return false;
		}
	}, []);

	// Get service configuration
	const getServiceConfig = useCallback((service: string): ApiKeyConfig | null => {
		return apiKeyService.getServiceConfig(service);
	}, []);

	// Get all service configurations
	const getAllServiceConfigs = useCallback((): ApiKeyConfig[] => {
		return apiKeyService.getAllServiceConfigs();
	}, []);

	// Validate API key
	const validateApiKey = useCallback((service: string, apiKey: string): boolean => {
		const result = apiKeyService.validateApiKey(service, apiKey);
		return result.isValid;
	}, []);

	// Auto-load on mount if requested
	useEffect(() => {
		if (autoLoad) {
			loadApiKeys();
		}
	}, [autoLoad, loadApiKeys]);

	return {
		// State
		apiKeys,
		loading,
		error,

		// Actions
		loadApiKeys,
		storeApiKey,
		deleteApiKey,
		getApiKey,
		hasApiKey,

		// Service info
		getServiceConfig,
		getAllServiceConfigs,

		// Validation
		validateApiKey,
	};
};

// Convenience hook for Brave Search API
export const useBraveApiKey = () => {
	const { getApiKey, hasApiKey, storeApiKey, deleteApiKey } = useApiKeyManager({
		service: 'brave-search',
	});

	return {
		getBraveApiKey: () => getApiKey('brave-search'),
		hasBraveApiKey: () => hasApiKey('brave-search'),
		storeBraveApiKey: (apiKey: string) => storeApiKey('brave-search', apiKey),
		deleteBraveApiKey: () => deleteApiKey('brave-search'),
	};
};
