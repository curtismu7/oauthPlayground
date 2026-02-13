/**
 * @file useSilentApiConfigV8.ts
 * @module v8/hooks
 * @description Centralized hook for Silent API and Show Token configuration management
 * @version 8.1.0
 * @since 2026-02-08
 *
 * Purpose: Provide a single source of truth for Silent API and Show Token checkbox state
 * Ensures consistent behavior across all components using these configurations
 *
 * Features:
 * - Centralized state management for both Silent API and Show Token
 * - Automatic configuration synchronization
 * - Event-driven updates across components
 * - Foolproof persistence and loading
 */

import { useCallback, useEffect, useState } from 'react';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { WorkerTokenConfigServiceV8 } from '@/v8/services/workerTokenConfigServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔕 SILENT-API-CONFIG-V8]';

export interface WorkerTokenConfig {
	silentApiRetrieval: boolean;
	showTokenAtEnd: boolean;
}

/**
 * Hook for managing Worker Token configuration with centralized state
 * Provides consistent behavior across all components for both Silent API and Show Token
 */
export const useWorkerTokenConfigV8 = () => {
	// Local state for immediate UI updates
	const [config, setConfig] = useState<WorkerTokenConfig>(() => {
		try {
			// Initialize from centralized service
			const serviceConfig = WorkerTokenConfigServiceV8.getConfigSync();
			return {
				silentApiRetrieval: serviceConfig.silentApiRetrieval,
				showTokenAtEnd: serviceConfig.showTokenAtEnd,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to initialize config:`, error);
			return {
				silentApiRetrieval: false,
				showTokenAtEnd: true,
			};
		}
	});

	const [isReady, setIsReady] = useState(false);

	// Load initial configuration
	useEffect(() => {
		const loadConfig = () => {
			try {
				const serviceConfig = WorkerTokenConfigServiceV8.getConfigSync();
				setConfig({
					silentApiRetrieval: serviceConfig.silentApiRetrieval,
					showTokenAtEnd: serviceConfig.showTokenAtEnd,
				});
				setIsReady(true);
				console.log(`${MODULE_TAG} Configuration loaded:`, serviceConfig);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to load configuration:`, error);
				setIsReady(true);
			}
		};

		loadConfig();

		// Listen for configuration updates from other components
		const handleConfigUpdate = () => {
			console.log(`${MODULE_TAG} Configuration update detected, reloading...`);
			loadConfig();
		};

		// Listen for MFA configuration updates
		window.addEventListener('mfaConfigurationUpdated', handleConfigUpdate);

		// Listen for worker token config updates
		window.addEventListener('workerTokenConfigUpdated', handleConfigUpdate);

		return () => {
			window.removeEventListener('mfaConfigurationUpdated', handleConfigUpdate);
			window.removeEventListener('workerTokenConfigUpdated', handleConfigUpdate);
		};
	}, []);

	// Update silentApiRetrieval setting
	const updateSilentApiRetrieval = useCallback(async (value: boolean) => {
		try {
			console.log(`${MODULE_TAG} Updating silentApiRetrieval to:`, value);

			// Update local state immediately for responsive UI
			setConfig((prev) => ({ ...prev, silentApiRetrieval: value }));

			// Update centralized service
			WorkerTokenConfigServiceV8.setSilentApiRetrieval(value);

			// Update MFA configuration service for persistence
			const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
			mfaConfig.workerToken.silentApiRetrieval = value;
			MFAConfigurationServiceV8.saveConfiguration(mfaConfig);

			// Dispatch events to notify all components
			window.dispatchEvent(
				new CustomEvent('mfaConfigurationUpdated', {
					detail: { workerToken: mfaConfig.workerToken },
				})
			);

			window.dispatchEvent(
				new CustomEvent('workerTokenConfigUpdated', {
					detail: { silentApiRetrieval: value },
				})
			);

			toastV8.info(`Silent API Token Retrieval set to: ${value}`);
			console.log(`${MODULE_TAG} SilentApiRetrieval updated successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to update silentApiRetrieval:`, error);
			toastV8.error('Failed to update Silent API setting');

			// Revert local state on error
			const serviceConfig = WorkerTokenConfigServiceV8.getConfigSync();
			setConfig({
				silentApiRetrieval: serviceConfig.silentApiRetrieval,
				showTokenAtEnd: serviceConfig.showTokenAtEnd,
			});
		}
	}, []);

	// Update showTokenAtEnd setting
	const updateShowTokenAtEnd = useCallback(async (value: boolean) => {
		try {
			console.log(`${MODULE_TAG} Updating showTokenAtEnd to:`, value);

			// Update local state immediately for responsive UI
			setConfig((prev) => ({ ...prev, showTokenAtEnd: value }));

			// Update centralized service
			WorkerTokenConfigServiceV8.setShowTokenAtEnd(value);

			// Update MFA configuration service for persistence
			const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
			mfaConfig.workerToken.showTokenAtEnd = value;
			MFAConfigurationServiceV8.saveConfiguration(mfaConfig);

			// Dispatch events to notify all components
			window.dispatchEvent(
				new CustomEvent('mfaConfigurationUpdated', {
					detail: { workerToken: mfaConfig.workerToken },
				})
			);

			window.dispatchEvent(
				new CustomEvent('workerTokenConfigUpdated', {
					detail: { showTokenAtEnd: value },
				})
			);

			toastV8.info(`Show Token After Generation set to: ${value}`);
			console.log(`${MODULE_TAG} ShowTokenAtEnd updated successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to update showTokenAtEnd:`, error);
			toastV8.error('Failed to update token display setting');

			// Revert local state on error
			const serviceConfig = WorkerTokenConfigServiceV8.getConfigSync();
			setConfig({
				silentApiRetrieval: serviceConfig.silentApiRetrieval,
				showTokenAtEnd: serviceConfig.showTokenAtEnd,
			});
		}
	}, []);

	// Force refresh configuration from storage
	const refreshConfig = useCallback(() => {
		try {
			// Force service to reinitialize by clearing internal state
			// Note: WorkerTokenConfigServiceV8 doesn't have clearCache, so we reload directly

			// Reload from storage
			const serviceConfig = WorkerTokenConfigServiceV8.getConfigSync();
			setConfig({
				silentApiRetrieval: serviceConfig.silentApiRetrieval,
				showTokenAtEnd: serviceConfig.showTokenAtEnd,
			});

			console.log(`${MODULE_TAG} Configuration refreshed:`, serviceConfig);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to refresh configuration:`, error);
		}
	}, []);

	return {
		// State
		config,
		silentApiRetrieval: config.silentApiRetrieval,
		showTokenAtEnd: config.showTokenAtEnd,
		isReady,

		// Actions
		updateSilentApiRetrieval,
		updateShowTokenAtEnd,
		refreshConfig,

		// Utility
		isSilentModeEnabled: config.silentApiRetrieval,
		shouldShowTokenAtEnd: config.showTokenAtEnd,
	};
};

// Backward compatibility alias
export const useSilentApiConfigV8 = useWorkerTokenConfigV8;

export default useWorkerTokenConfigV8;
