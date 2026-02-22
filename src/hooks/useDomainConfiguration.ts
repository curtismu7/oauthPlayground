/**
 * @file useDomainConfiguration.ts
 * @module hooks
 * @description React hook for domain configuration management
 * @version 1.0.0
 * @since 2025-01-XX
 */

import { useCallback, useEffect, useState } from 'react';
import {
	type DomainConfig,
	domainConfigurationService,
} from '@/services/domainConfigurationService';

const MODULE_TAG = '[🌐 USE-DOMAIN-CONFIG]';

/**
 * Hook for domain configuration management
 *
 * Provides reactive state management for domain configuration,
 * including validation, updates, and error handling.
 */
export const useDomainConfiguration = () => {
	const [config, setConfig] = useState<DomainConfig>(() => domainConfigurationService.getConfig());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load initial configuration
	useEffect(() => {
		const loadConfig = () => {
			try {
				const currentConfig = domainConfigurationService.getConfig();
				setConfig(currentConfig);
				setError(null);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to load domain configuration';
				console.error(`${MODULE_TAG} Error loading config:`, err);
				setError(errorMessage);
			}
		};

		loadConfig();

		// Listen for storage changes (in case config is updated in another tab)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'oauth-playground-domain-config') {
				console.log(`${MODULE_TAG} Domain config updated in another tab, reloading...`);
				loadConfig();
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	/**
	 * Update configuration
	 */
	const updateConfig = useCallback(async (updates: Partial<DomainConfig>) => {
		setIsLoading(true);
		setError(null);

		try {
			const newConfig = domainConfigurationService.saveConfig(updates);
			setConfig(newConfig);
			console.log(`${MODULE_TAG} Configuration updated:`, newConfig);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
			console.error(`${MODULE_TAG} Error updating config:`, err);
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Set custom domain with validation
	 */
	const setCustomDomain = useCallback(async (domain: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const result = await domainConfigurationService.setCustomDomain(domain);

			if (result.success) {
				const newConfig = domainConfigurationService.getConfig();
				setConfig(newConfig);
				console.log(`${MODULE_TAG} Custom domain set successfully:`, domain);
			} else {
				setError(result.error || 'Failed to set custom domain');
				throw new Error(result.error || 'Failed to set custom domain');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to set custom domain';
			console.error(`${MODULE_TAG} Error setting custom domain:`, err);
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Validate a domain
	 */
	const validateDomain = useCallback(async (domain: string) => {
		try {
			const result = await domainConfigurationService.validateDomain(domain);
			return result;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Validation failed';
			console.error(`${MODULE_TAG} Error validating domain:`, err);
			return { isValid: false, error: errorMessage };
		}
	}, []);

	/**
	 * Get effective domain
	 */
	const getEffectiveDomain = useCallback(() => {
		return domainConfigurationService.getEffectiveDomain();
	}, []);

	/**
	 * Get redirect URI for a path
	 */
	const getRedirectUri = useCallback((path: string = '/callback') => {
		return domainConfigurationService.getRedirectUri(path);
	}, []);

	/**
	 * Toggle custom domain usage
	 */
	const toggleCustomDomain = useCallback(
		async (enabled: boolean) => {
			await updateConfig({ useCustomDomain: enabled });
		},
		[updateConfig]
	);

	/**
	 * Reset to default configuration
	 */
	const resetToDefault = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			domainConfigurationService.resetToDefault();
			const newConfig = domainConfigurationService.getConfig();
			setConfig(newConfig);
			console.log(`${MODULE_TAG} Configuration reset to default`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to reset configuration';
			console.error(`${MODULE_TAG} Error resetting config:`, err);
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Clear error
	 */
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		// State
		config,
		isLoading,
		error,

		// Computed values
		effectiveDomain: getEffectiveDomain(),
		isCustomDomainActive: domainConfigurationService.isCustomDomainActive(),

		// Actions
		updateConfig,
		setCustomDomain,
		validateDomain,
		getRedirectUri,
		toggleCustomDomain,
		resetToDefault,
		clearError,

		// Debug info
		configSummary: domainConfigurationService.getConfigSummary(),
	};
};

export default useDomainConfiguration;
