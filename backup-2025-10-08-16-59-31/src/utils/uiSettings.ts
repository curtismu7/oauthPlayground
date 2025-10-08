// src/utils/uiSettings.ts
// Legacy utility retained for backward compatibility with older imports.
// The new `UISettingsContext` provides the canonical source of truth. This module
// now proxies to that implementation while keeping the same API surface to avoid
// runtime errors from stale imports.

import type { UISettings } from '../contexts/UISettingsContext';

const LEGACY_DEFAULTS: Pick<
	UISettings,
	| 'showCredentialsModal'
	| 'showSuccessModal'
	| 'showAuthRequestModal'
	| 'showFlowDebugConsole'
	| 'darkMode'
	| 'fontSize'
	| 'colorScheme'
	| 'autoAdvanceSteps'
	| 'collapsibleDefaultState'
	| 'showRequestResponseDetails'
	| 'copyButtonBehavior'
	| 'errorDetailLevel'
	| 'consoleLoggingLevel'
	| 'defaultPageOnLoad'
	| 'hideCompletedFlows'
	| 'quickActionsVisibility'
	| 'showPollingPrompt'
	| 'showApiCallExamples'
> = {
	showCredentialsModal: false,
	showSuccessModal: true,
	showAuthRequestModal: false,
	showFlowDebugConsole: true,
	darkMode: false,
	fontSize: 'medium',
	colorScheme: 'blue',
	autoAdvanceSteps: false,
	collapsibleDefaultState: 'collapsed',
	showRequestResponseDetails: false,
	copyButtonBehavior: 'confirmation',
	errorDetailLevel: 'basic',
	consoleLoggingLevel: 'normal',
	defaultPageOnLoad: 'dashboard',
	hideCompletedFlows: false,
	quickActionsVisibility: true,
	showPollingPrompt: true,
	showApiCallExamples: true,
};

const UI_SETTINGS_KEY = 'ui-settings';
const LEGACY_FLOW_CONFIG_KEY = 'enhanced-flow-authorization-code';

const loadFromStorage = (): UISettings => {
	try {
		const uiSettings = JSON.parse(localStorage.getItem(UI_SETTINGS_KEY) || '{}');
		const flowConfig = JSON.parse(localStorage.getItem(LEGACY_FLOW_CONFIG_KEY) || '{}');
		return {
			...LEGACY_DEFAULTS,
			...flowConfig,
			...uiSettings,
		};
	} catch (error) {
		console.warn('[UISettings] Failed to parse settings from storage:', error);
		return LEGACY_DEFAULTS as UISettings;
	}
};

export const getUISettings = (): UISettings => {
	return loadFromStorage();
};

export const updateUISetting = <K extends keyof UISettings>(key: K, value: UISettings[K]): void => {
	try {
		const current = loadFromStorage();
		const updated = { ...current, [key]: value };
		localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(updated));

		const legacyConfig = JSON.parse(localStorage.getItem(LEGACY_FLOW_CONFIG_KEY) || '{}');
		localStorage.setItem(
			LEGACY_FLOW_CONFIG_KEY,
			JSON.stringify({
				...legacyConfig,
				[key]: value,
			})
		);

		window.dispatchEvent(
			new CustomEvent('uiSettingsChanged', {
				detail: { [key]: value, allSettings: updated },
			})
		);
		console.log(`[UISettings] Legacy update ${String(key)} ->`, value);
	} catch (error) {
		console.error('[UISettings] Failed to update setting from legacy utility:', error);
	}
};

export const subscribeToUISettings = (callback: (settings: UISettings) => void): (() => void) => {
	const handler = (event: Event) => {
		if (event instanceof CustomEvent && event.detail?.allSettings) {
			callback(event.detail.allSettings as UISettings);
			return;
		}
		callback(loadFromStorage());
	};

	window.addEventListener('uiSettingsChanged', handler as EventListener);
	window.addEventListener('storage', handler as EventListener);

	callback(loadFromStorage());

	return () => {
		window.removeEventListener('uiSettingsChanged', handler as EventListener);
		window.removeEventListener('storage', handler as EventListener);
	};
};
