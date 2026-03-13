/**
 * @file useUniversalSettings.ts
 * @description React hook for universal settings management
 * @version 1.0.0
 * @since 2026-03-11
 *
 * Provides easy-to-use React hook for managing universal settings
 * with flow-specific override capabilities.
 */

import { useCallback, useEffect, useState } from 'react';
import {
	type SettingsLoadResult,
	type SettingsPriority,
	type UniversalSettings,
	UniversalSettingsService,
} from '../services/universalSettingsService';

export interface UseUniversalSettingsOptions {
	flowKey?: string;
	autoLoad?: boolean;
	priority?: SettingsPriority;
}

export interface UseUniversalSettingsReturn {
	settings: UniversalSettings | null;
	source: 'universal' | 'flow_override' | 'default';
	isLoading: boolean;
	error: string | null;
	overrideKey: string | undefined;
	hasOverride: boolean;
	useUniversal: boolean;
	saveSettings: (settings: Partial<UniversalSettings>) => Promise<boolean>;
	saveOverride: (settings: Partial<UniversalSettings>) => Promise<boolean>;
	deleteOverride: () => Promise<boolean>;
	resetAll: () => Promise<boolean>;
	togglePriority: (useUniversal: boolean) => void;
	reload: () => Promise<void>;
}

/**
 * React hook for universal settings management
 */
export const useUniversalSettings = (
	options: UseUniversalSettingsOptions = {}
): UseUniversalSettingsReturn => {
	const { flowKey, autoLoad = true, priority } = options;

	const [state, setState] = useState<{
		settings: UniversalSettings | null;
		source: 'universal' | 'flow_override' | 'default';
		isLoading: boolean;
		error: string | null;
		overrideKey: string | undefined;
		useUniversal: boolean;
	}>({
		settings: null,
		source: 'default',
		isLoading: true,
		error: null,
		overrideKey: undefined,
		useUniversal: priority?.useUniversal ?? true,
	});

	/**
	 * Load settings based on current priority
	 */
	const loadSettings = useCallback(async () => {
		if (!flowKey) {
			setState((prev) => ({ ...prev, isLoading: false, error: 'Flow key is required' }));
			return;
		}

		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const currentPriority: SettingsPriority = {
				flowKey,
				useUniversal: state.useUniversal,
			};

			const result: SettingsLoadResult =
				await UniversalSettingsService.loadSettings(currentPriority);

			setState((prev) => ({
				...prev,
				settings: result.settings,
				source: result.source,
				overrideKey: result.overrideKey,
				isLoading: false,
				error: null,
			}));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: errorMessage,
			}));
		}
	}, [flowKey, state.useUniversal]);

	/**
	 * Save universal settings
	 */
	const saveSettings = useCallback(
		async (settings: Partial<UniversalSettings>): Promise<boolean> => {
			try {
				const success = await UniversalSettingsService.saveUniversalSettings(settings);
				if (success) {
					// Reload settings after save
					await loadSettings();
				}
				return success;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
				setState((prev) => ({ ...prev, error: errorMessage }));
				return false;
			}
		},
		[loadSettings]
	);

	/**
	 * Save flow override
	 */
	const saveOverride = useCallback(
		async (settings: Partial<UniversalSettings>): Promise<boolean> => {
			if (!flowKey) {
				setState((prev) => ({ ...prev, error: 'Flow key is required for override' }));
				return false;
			}

			try {
				const success = await UniversalSettingsService.saveFlowOverride(flowKey, settings);
				if (success) {
					// Reload settings after save
					await loadSettings();
				}
				return success;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to save override';
				setState((prev) => ({ ...prev, error: errorMessage }));
				return false;
			}
		},
		[flowKey, loadSettings]
	);

	/**
	 * Delete flow override
	 */
	const deleteOverride = useCallback(async (): Promise<boolean> => {
		if (!flowKey) {
			setState((prev) => ({ ...prev, error: 'Flow key is required for override deletion' }));
			return false;
		}

		try {
			const success = await UniversalSettingsService.deleteFlowOverride(flowKey);
			if (success) {
				// Reload settings after deletion
				await loadSettings();
			}
			return success;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete override';
			setState((prev) => ({ ...prev, error: errorMessage }));
			return false;
		}
	}, [flowKey, loadSettings]);

	/**
	 * Reset all settings to defaults
	 */
	const resetAll = useCallback(async (): Promise<boolean> => {
		try {
			const success = await UniversalSettingsService.resetAllSettings();
			if (success) {
				// Reload settings after reset
				await loadSettings();
			}
			return success;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to reset settings';
			setState((prev) => ({ ...prev, error: errorMessage }));
			return false;
		}
	}, [loadSettings]);

	/**
	 * Toggle between universal and override priority
	 */
	const togglePriority = useCallback((useUniversal: boolean) => {
		setState((prev) => ({ ...prev, useUniversal }));
	}, []);

	/**
	 * Reload settings
	 */
	const reload = useCallback(async () => {
		await loadSettings();
	}, [loadSettings]);

	/**
	 * Check if flow has override
	 */
	const hasOverride = Boolean(state.overrideKey && state.source === 'flow_override');

	// Auto-load settings on mount
	useEffect(() => {
		if (autoLoad && flowKey) {
			loadSettings();
		}
	}, [autoLoad, flowKey, loadSettings]);

	// Reload settings when priority changes
	useEffect(() => {
		if (flowKey) {
			loadSettings();
		}
	}, [flowKey, loadSettings]);

	return {
		settings: state.settings,
		source: state.source,
		isLoading: state.isLoading,
		error: state.error,
		overrideKey: state.overrideKey,
		hasOverride,
		useUniversal: state.useUniversal,
		saveSettings,
		saveOverride,
		deleteOverride,
		resetAll,
		togglePriority,
		reload,
	};
};

/**
 * Hook for managing universal/local settings toggle UI
 */
export const useUniversalSettingsToggle = (flowKey: string) => {
	const { useUniversal, togglePriority, hasOverride, deleteOverride } = useUniversalSettings({
		flowKey,
		autoLoad: true,
	});

	const handleToggle = useCallback(
		(checked: boolean) => {
			togglePriority(checked);
		},
		[togglePriority]
	);

	const handleReset = useCallback(async () => {
		const success = await deleteOverride();
		if (success) {
			togglePriority(true); // Switch back to universal after reset
		}
		return success;
	}, [deleteOverride, togglePriority]);

	return {
		useUniversal,
		hasOverride,
		onToggle: handleToggle,
		onReset: handleReset,
	};
};
