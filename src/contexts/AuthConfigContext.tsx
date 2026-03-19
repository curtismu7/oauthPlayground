/**
 * @file AuthConfigContext.tsx
 * @description Configuration management context - extracted from NewAuthContext.tsx
 * @version 9.16.24
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import type { AppConfig, AuthConfigContextType } from './authConfigTypes';

// Loading state to prevent multiple simultaneous configuration loads
let isLoadingConfiguration = false;
let cachedConfiguration: AppConfig | null = null;

// Default configuration
const getDefaultConfig = (): AppConfig => ({
	disableLogin: false,
	clientId: '',
	clientSecret: '',
	redirectUri: `${window.location.origin}/authz-callback`,
	authorizationEndpoint: '',
	tokenEndpoint: '',
	userInfoEndpoint: '',
	endSessionEndpoint: '',
	scopes: ['openid', 'profile', 'email'],
	environmentId: '',
	hasConfigError: false,
});

// Function to load configuration from environment variables or localStorage
async function loadConfiguration(): Promise<AppConfig> {
	if (cachedConfiguration) {
		return cachedConfiguration;
	}

	if (isLoadingConfiguration) {
		return new Promise((resolve) => {
			const started = Date.now();
			const checkInterval = setInterval(() => {
				if (!isLoadingConfiguration && cachedConfiguration) {
					clearInterval(checkInterval);
					resolve(cachedConfiguration);
				} else if (Date.now() - started > 5000) {
					clearInterval(checkInterval);
					isLoadingConfiguration = false;
					loadConfiguration().then(resolve);
				}
			}, 100);
		});
	}

	isLoadingConfiguration = true;
	try {
		// Try to get from environment variables first
		const envConfig = {
			disableLogin: false,
			clientId: window.__PINGONE_CLIENT_ID__ || '',
			clientSecret: window.__PINGONE_CLIENT_SECRET__ || '',
			redirectUri: window.__PINGONE_REDIRECT_URI__ || `${window.location.origin}/authz-callback`,
			environmentId: window.__PINGONE_ENVIRONMENT_ID__ || '',
		};

		// Check localStorage for saved config
		const savedConfig = localStorage.getItem('pingone_config');
		let parsedConfig: Partial<AppConfig> = {};

		if (savedConfig) {
			try {
				parsedConfig = JSON.parse(savedConfig);
			} catch (e) {
				logger.warn('AuthConfigContext', 'Failed to parse saved config', e);
			}
		}

		// Merge configs: env vars take precedence
		const mergedConfig: AppConfig = {
			...getDefaultConfig(),
			...parsedConfig,
			...envConfig,
			hasConfigError: false,
		};

		cachedConfiguration = mergedConfig;
		return mergedConfig;
	} catch (error) {
		logger.error('AuthConfigContext', 'Error loading configuration', error);
		return {
			...getDefaultConfig(),
			hasConfigError: true,
		};
	} finally {
		isLoadingConfiguration = false;
	}
}

// Create the context
const AuthConfigContext = createContext<AuthConfigContextType | undefined>(undefined);

// Provider component
export const AuthConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [config, setConfig] = useState<AppConfig>(getDefaultConfig());
	const [isLoading, setIsLoading] = useState(true);
	const [configError, setConfigError] = useState<string | null>(null);

	// Load configuration on mount
	useEffect(() => {
		const initConfig = async () => {
			try {
				const loadedConfig = await loadConfiguration();
				setConfig(loadedConfig);
				if (loadedConfig.hasConfigError) {
					setConfigError('Failed to load configuration');
				}
			} catch (error) {
				logger.error('AuthConfigContext', 'Failed to initialize config', error);
				setConfigError('Configuration initialization failed');
			} finally {
				setIsLoading(false);
			}
		};

		initConfig();
	}, []);

	// Listen for config changes
	useEffect(() => {
		const handleConfigChange = () => {
			loadConfiguration().then((newConfig) => {
				setConfig((prev) => ({
					...prev,
					...newConfig,
				}));
			});
		};

		window.addEventListener('pingone-config-changed', handleConfigChange);
		window.addEventListener('permanent-credentials-changed', handleConfigChange);
		window.addEventListener('config-credentials-changed', handleConfigChange);
		window.addEventListener('storage', handleConfigChange);

		return () => {
			window.removeEventListener('pingone-config-changed', handleConfigChange);
			window.removeEventListener('permanent-credentials-changed', handleConfigChange);
			window.removeEventListener('config-credentials-changed', handleConfigChange);
			window.removeEventListener('storage', handleConfigChange);
		};
	}, []);

	// Refresh configuration
	const refreshConfig = useCallback(async () => {
		logger.info('AuthConfigContext', 'Refreshing configuration...');
		try {
			cachedConfiguration = null;
			const newConfig = await loadConfiguration();
			setConfig(newConfig);
			setConfigError(null);
			logger.info('AuthConfigContext', 'Configuration refreshed');
		} catch (error) {
			logger.error('AuthConfigContext', 'Error refreshing configuration', error);
			setConfigError('Failed to refresh configuration');
		}
	}, []);

	const value: AuthConfigContextType = {
		config,
		refreshConfig,
		isLoading,
		configError,
	};

	return <AuthConfigContext.Provider value={value}>{children}</AuthConfigContext.Provider>;
};

// Custom hook
export const useAuthConfig = (): AuthConfigContextType => {
	const context = useContext(AuthConfigContext);
	if (context === undefined) {
		throw new Error('useAuthConfig must be used within an AuthConfigProvider');
	}
	return context;
};

// Re-export types
export type { AppConfig, AuthConfigContextType } from './authConfigTypes';
