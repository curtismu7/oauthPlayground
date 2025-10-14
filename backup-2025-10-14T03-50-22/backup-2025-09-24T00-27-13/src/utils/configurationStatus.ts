// src/utils/configurationStatus.ts
import { credentialManager } from './credentialManager';

/**
 * Centralized configuration status logic
 * Used by Dashboard and ConfigurationStatus components for consistency
 */

export interface ConfigStatus {
	isConfigured: boolean;
	statusText: string;
	statusColor: string;
	// Additional properties for ConfigurationStatus component compatibility
	status: 'ready' | 'error' | 'warning';
	message: string;
	missingItems: string[];
}

/**
 * Check if credentials are saved in any storage location
 */
export const checkSavedCredentials = (): boolean => {
	try {
		// Check credential manager first
		const configCredentials = credentialManager.loadConfigCredentials();
		if (configCredentials?.environmentId && configCredentials?.clientId) {
			return true;
		}

		const authzCredentials = credentialManager.loadAuthzFlowCredentials();
		if (authzCredentials?.environmentId && authzCredentials?.clientId) {
			return true;
		}

		// Fallback: Check localStorage directly
		const stored = localStorage.getItem('oauth_config');
		if (stored) {
			const config = JSON.parse(stored);
			if (config?.environmentId && config?.clientId) {
				return true;
			}
		}

		// Don't use tokens as an indicator of configuration
		// Tokens can exist without proper environment configuration
		return false;
	} catch (error) {
		console.error('Error checking saved credentials:', error);
		return false;
	}
};

/**
 * Get shared configuration status
 */
export const getSharedConfigurationStatus = (flowType?: string): ConfigStatus => {
	const hasSavedCredentials = checkSavedCredentials();

	if (hasSavedCredentials) {
		// Get actual credentials to show details
		const configCredentials = credentialManager.loadConfigCredentials();
		const authzCredentials = credentialManager.loadAuthzFlowCredentials();
		const credentials = configCredentials?.environmentId ? configCredentials : authzCredentials;

		return {
			isConfigured: true,
			statusText: 'Configuration Ready',
			statusColor: 'green',
			status: 'ready',
			message: `${flowType || 'System'} is properly configured and ready to use.`,
			missingItems: [],
		};
	}

	const baseText = flowType ? `${flowType} Configuration Required` : 'Configuration Required';
	const missingItems = [];

	// Check what's missing
	try {
		const configCredentials = credentialManager.loadConfigCredentials();
		const authzCredentials = credentialManager.loadAuthzFlowCredentials();

		if (!configCredentials?.environmentId && !authzCredentials?.environmentId) {
			missingItems.push('Environment ID');
		}
		if (!configCredentials?.clientId && !authzCredentials?.clientId) {
			missingItems.push('Client ID');
		}
		if (!configCredentials?.clientSecret && !authzCredentials?.clientSecret) {
			missingItems.push('Client Secret');
		}
		if (!configCredentials?.redirectUri && !authzCredentials?.redirectUri) {
			missingItems.push('Redirect URI');
		}
	} catch (error) {
		console.error('Error checking missing items:', error);
		missingItems.push('Configuration check failed');
	}

	return {
		isConfigured: false,
		statusText: baseText,
		statusColor: 'red',
		status: 'error',
		message: `${flowType || 'System'} requires configuration before you can proceed.`,
		missingItems,
	};
};

/**
 * Check if a specific flow type is configured
 */
export const isFlowConfigured = (flowType: string): boolean => {
	const status = getSharedConfigurationStatus(flowType);
	return status.isConfigured;
};

// Alias export for backward compatibility
export const hasSavedCredentials = checkSavedCredentials;
