// src/utils/configurationStatus.ts

import { UnifiedTokenStorageService } from '../services/unifiedTokenStorageService';
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
 * Check if credentials are saved in any storage location (async version)
 * Checks unified storage (IndexedDB/SQLite) and localStorage
 */
export const checkSavedCredentialsAsync = async (): Promise<boolean> => {
	try {
		// Check unified storage first (IndexedDB/SQLite)
		const unifiedStorage = UnifiedTokenStorageService.getInstance();
		const unifiedCreds = await unifiedStorage.getOAuthCredentials();

		if (unifiedCreds) {
			const envId = unifiedCreds.environmentId as string | undefined;
			const clientId = unifiedCreds.clientId as string | undefined;

			if (envId && clientId && envId.trim() !== '' && clientId.trim() !== '') {
				return true;
			}
		}

		// Check credential manager (localStorage-based)
		const configCredentials = credentialManager.loadConfigCredentials();
		if (
			configCredentials?.environmentId &&
			configCredentials?.clientId &&
			configCredentials.environmentId.trim() !== '' &&
			configCredentials.clientId.trim() !== ''
		) {
			return true;
		}

		const authzCredentials = credentialManager.loadAuthzFlowCredentials();
		if (
			authzCredentials?.environmentId &&
			authzCredentials?.clientId &&
			authzCredentials.environmentId.trim() !== '' &&
			authzCredentials.clientId.trim() !== ''
		) {
			return true;
		}

		// Fallback: Check localStorage directly
		const stored = localStorage.getItem('oauth_config');
		if (stored) {
			const config = JSON.parse(stored);
			if (
				config?.environmentId &&
				config?.clientId &&
				config.environmentId.trim() !== '' &&
				config.clientId.trim() !== ''
			) {
				return true;
			}
		}

		return false;
	} catch (error) {
		console.error('Error checking saved credentials:', error);
		return false;
	}
};

/**
 * Check if credentials are saved in any storage location (sync version)
 * Only checks localStorage - use checkSavedCredentialsAsync for complete check
 */
export const checkSavedCredentials = (): boolean => {
	try {
		// Check credential manager first
		const configCredentials = credentialManager.loadConfigCredentials();
		if (
			configCredentials?.environmentId &&
			configCredentials?.clientId &&
			configCredentials.environmentId.trim() !== '' &&
			configCredentials.clientId.trim() !== ''
		) {
			return true;
		}

		const authzCredentials = credentialManager.loadAuthzFlowCredentials();
		if (
			authzCredentials?.environmentId &&
			authzCredentials?.clientId &&
			authzCredentials.environmentId.trim() !== '' &&
			authzCredentials.clientId.trim() !== ''
		) {
			return true;
		}

		// Fallback: Check localStorage directly
		const stored = localStorage.getItem('oauth_config');
		if (stored) {
			const config = JSON.parse(stored);
			if (
				config?.environmentId &&
				config?.clientId &&
				config.environmentId.trim() !== '' &&
				config.clientId.trim() !== ''
			) {
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
 * Get shared configuration status (async version - checks unified storage)
 */
export const getSharedConfigurationStatusAsync = async (
	flowType?: string
): Promise<ConfigStatus> => {
	const hasSavedCredentials = await checkSavedCredentialsAsync();

	if (hasSavedCredentials) {
		// Get actual credentials to show details
		const configCredentials = credentialManager.loadConfigCredentials();
		const authzCredentials = credentialManager.loadAuthzFlowCredentials();
		const _credentials = configCredentials?.environmentId ? configCredentials : authzCredentials;

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
 * Get shared configuration status (sync version - only checks localStorage)
 */
export const getSharedConfigurationStatus = (flowType?: string): ConfigStatus => {
	const hasSavedCredentials = checkSavedCredentials();

	if (hasSavedCredentials) {
		// Get actual credentials to show details
		const configCredentials = credentialManager.loadConfigCredentials();
		const authzCredentials = credentialManager.loadAuthzFlowCredentials();
		const _credentials = configCredentials?.environmentId ? configCredentials : authzCredentials;

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
 * Check if a specific flow type is configured (async version - checks unified storage)
 */
export const isFlowConfiguredAsync = async (flowType: string): Promise<boolean> => {
	const status = await getSharedConfigurationStatusAsync(flowType);
	return status.isConfigured;
};

/**
 * Check if a specific flow type is configured (sync version - only checks localStorage)
 */
export const isFlowConfigured = (flowType: string): boolean => {
	const status = getSharedConfigurationStatus(flowType);
	return status.isConfigured;
};

// Alias export for backward compatibility
export const hasSavedCredentials = checkSavedCredentials;
