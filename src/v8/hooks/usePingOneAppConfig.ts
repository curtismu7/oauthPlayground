/**
 * @file usePingOneAppConfig.ts
 * @hook usePingOneAppConfig
 * @description Hook for managing PingOne application configuration
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { PingOneAppConfig, PingOneAppConfigForm } from '../components/PingOneAppConfigForm';

const STORAGE_KEY = 'pingone_app_config';

const DEFAULT_CONFIG: PingOneAppConfig = {
	oauthVersion: '2.0',
	allowRedirectUriPatterns: false,
};

export const usePingOneAppConfig = () => {
	const [config, setConfig] = useState<PingOneAppConfig>(DEFAULT_CONFIG);

	// Load config from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsedConfig = JSON.parse(stored) as PingOneAppConfig;
				setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
			}
		} catch (error) {
			console.error('Failed to load PingOne app config:', error);
		}
	}, []);

	// Save config to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch (error) {
			console.error('Failed to save PingOne app config:', error);
		}
	}, [config]);

	const updateConfig = (newConfig: PingOneAppConfig) => {
		setConfig(newConfig);
	};

	const resetConfig = () => {
		setConfig(DEFAULT_CONFIG);
		localStorage.removeItem(STORAGE_KEY);
	};

	return {
		config,
		updateConfig,
		resetConfig,
		PingOneAppConfigForm: () => 
			React.createElement(PingOneAppConfigForm, { config, onChange: updateConfig }),
	};
};
