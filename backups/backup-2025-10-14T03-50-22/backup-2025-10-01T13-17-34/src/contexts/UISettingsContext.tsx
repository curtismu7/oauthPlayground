import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface UISettings {
	// Existing settings
	showCredentialsModal: boolean;
	showSuccessModal: boolean;
	showAuthRequestModal: boolean;
	showFlowDebugConsole: boolean;

	// New UI Settings
	darkMode: boolean;
	fontSize: 'small' | 'medium' | 'large';
	colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';
	autoAdvanceSteps: boolean;
	collapsibleDefaultState: 'collapsed' | 'expanded';
	showRequestResponseDetails: boolean;
	copyButtonBehavior: 'confirmation' | 'silent';
	errorDetailLevel: 'basic' | 'detailed';
	consoleLoggingLevel: 'minimal' | 'normal' | 'verbose';
	defaultPageOnLoad: 'dashboard' | 'authorization-code-v5' | 'token-management' | 'configuration';
	hideCompletedFlows: boolean;
	quickActionsVisibility: boolean;
	showPollingPrompt: boolean; // Device Authorization Code flow polling prompt
}

const DEFAULT_UI_SETTINGS: UISettings = {
	// Existing settings
	showCredentialsModal: false,
	showSuccessModal: true,
	showAuthRequestModal: false,
	showFlowDebugConsole: true,

	// New UI Settings
	darkMode: false,
	fontSize: 'medium',
	colorScheme: 'blue',
	autoAdvanceSteps: false,
	collapsibleDefaultState: 'collapsed', // Flow info cards default to collapsed
	showRequestResponseDetails: false,
	copyButtonBehavior: 'confirmation',
	errorDetailLevel: 'basic',
	consoleLoggingLevel: 'normal',
	defaultPageOnLoad: 'dashboard',
	hideCompletedFlows: false,
	quickActionsVisibility: true,
	showPollingPrompt: true, // Show polling prompt modal by default
};

interface UISettingsContextType {
	settings: UISettings;
	updateSetting: <K extends keyof UISettings>(key: K, value: UISettings[K]) => void;
	resetSettings: () => void;
	saveSettings: () => Promise<void>;
}

const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined);

interface UISettingsProviderProps {
	children: ReactNode;
}

export const UISettingsProvider: React.FC<UISettingsProviderProps> = ({ children }) => {
	const [settings, setSettings] = useState<UISettings>(DEFAULT_UI_SETTINGS);

	// Apply theme settings to document
	const applyThemeSettings = (settings: UISettings) => {
		const root = document.documentElement;

		// Apply dark mode
		if (settings.darkMode) {
			root.classList.add('dark-mode');
		} else {
			root.classList.remove('dark-mode');
		}

		// Apply font size
		root.classList.remove('font-small', 'font-medium', 'font-large');
		root.classList.add(`font-${settings.fontSize}`);

		// Apply color scheme
		root.classList.remove('color-blue', 'color-green', 'color-purple', 'color-orange', 'color-red');
		root.classList.add(`color-${settings.colorScheme}`);
	};

	// Load settings from localStorage on mount
	useEffect(() => {
		const loadSettings = () => {
			try {
				// Load from enhanced-flow-authorization-code config (existing pattern)
				const flowConfigKey = 'enhanced-flow-authorization-code';
				const flowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');

				// Load from dedicated UI settings key (new pattern)
				const uiSettingsKey = 'ui-settings';
				const uiSettings = JSON.parse(localStorage.getItem(uiSettingsKey) || '{}');

				// Merge settings with priority: uiSettings > flowConfig > defaults
				const mergedSettings: UISettings = {
					...DEFAULT_UI_SETTINGS,
					...flowConfig,
					...uiSettings,
				};

				console.log('[UISettings] Loaded settings:', mergedSettings);
				setSettings(mergedSettings);

				// Apply theme settings immediately
				applyThemeSettings(mergedSettings);
			} catch (error) {
				console.error('[UISettings] Failed to load settings:', error);
				setSettings(DEFAULT_UI_SETTINGS);
			}
		};

		loadSettings();
	}, []);

	// Update a specific setting
	const updateSetting = <K extends keyof UISettings>(key: K, value: UISettings[K]) => {
		setSettings((prev) => {
			const newSettings = { ...prev, [key]: value };

			// Save to localStorage
			try {
				const uiSettingsKey = 'ui-settings';
				localStorage.setItem(uiSettingsKey, JSON.stringify(newSettings));

				// Also update the legacy flow config for backward compatibility
				const flowConfigKey = 'enhanced-flow-authorization-code';
				const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
				const updatedFlowConfig = {
					...existingFlowConfig,
					[key]: value,
				};
				localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));

				console.log(`[UISettings] Updated ${key}:`, value);

				// Apply theme changes immediately
				applyThemeSettings(newSettings);

				// Dispatch custom event to notify other components
				window.dispatchEvent(
					new CustomEvent('uiSettingsChanged', {
						detail: { [key]: value, allSettings: newSettings },
					})
				);
			} catch (error) {
				console.error('[UISettings] Failed to save settings:', error);
			}

			return newSettings;
		});
	};

	// Reset all settings to defaults
	const resetSettings = () => {
		setSettings(DEFAULT_UI_SETTINGS);

		try {
			// Apply default theme settings
			applyThemeSettings(DEFAULT_UI_SETTINGS);

			// Dispatch reset event
			window.dispatchEvent(
				new CustomEvent('uiSettingsReset', {
					detail: { settings: DEFAULT_UI_SETTINGS },
				})
			);
		} catch (error) {
			console.error('[UISettings] Failed to reset settings:', error);
		}
	};

	const saveSettings = async (): Promise<void> => {
		try {
			// Save to localStorage
			localStorage.setItem('ui-settings', JSON.stringify(settings));

			// Also save to the legacy key for backward compatibility
			const flowConfigKey = 'enhanced-flow-authorization-code';
			const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
			const updatedFlowConfig = { ...existingFlowConfig, ...settings };
			localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));

			console.log('[UISettings] Settings saved successfully:', settings);

			// Dispatch save event
			window.dispatchEvent(
				new CustomEvent('uiSettingsSaved', {
					detail: { settings },
				})
			);
		} catch (error) {
			console.error('[UISettings] Failed to save settings:', error);
			throw error;
		}
	};

	const contextValue: UISettingsContextType = {
		settings,
		updateSetting,
		resetSettings,
		saveSettings,
	};
	return <UISettingsContext.Provider value={contextValue}>{children}</UISettingsContext.Provider>;
};

// Custom hook to use UI settings
export const useUISettings = (): UISettingsContextType => {
	const context = useContext(UISettingsContext);
	if (context === undefined) {
		throw new Error('useUISettings must be used within a UISettingsProvider');
	}
	return context;
};

// Utility hook for specific settings
export const useUISettingValue = <K extends keyof UISettings>(key: K): UISettings[K] => {
	const { settings } = useUISettings();
	return settings[key];
};

// Utility hook for theme-related settings
export const useThemeSettings = () => {
	const { settings } = useUISettings();
	return {
		darkMode: settings.darkMode,
		fontSize: settings.fontSize,
		colorScheme: settings.colorScheme,
	};
};

// Utility hook for flow behavior settings
export const useFlowBehaviorSettings = () => {
	const { settings } = useUISettings();
	return {
		autoAdvanceSteps: settings.autoAdvanceSteps,
		collapsibleDefaultState: settings.collapsibleDefaultState,
		showRequestResponseDetails: settings.showRequestResponseDetails,
	};
};

// Utility hook for developer settings
export const useDeveloperSettings = () => {
	const { settings } = useUISettings();
	return {
		showRequestResponseDetails: settings.showRequestResponseDetails,
		copyButtonBehavior: settings.copyButtonBehavior,
		errorDetailLevel: settings.errorDetailLevel,
		consoleLoggingLevel: settings.consoleLoggingLevel,
		showFlowDebugConsole: settings.showFlowDebugConsole,
	};
};

export default UISettingsContext;
