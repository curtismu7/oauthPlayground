// src/utils/uiSettings.ts
// Utility for managing UI settings across the application

export interface UISettings {
  showCredentialsModal: boolean;
  showSuccessModal: boolean;
  showAuthRequestModal: boolean;
  showFlowDebugConsole: boolean;
}

const DEFAULT_UI_SETTINGS: UISettings = {
  showCredentialsModal: false,
  showSuccessModal: true,
  showAuthRequestModal: false,
  showFlowDebugConsole: true,
};

/**
 * Get UI settings from localStorage
 */
export const getUISettings = (): UISettings => {
  try {
    const flowConfigKey = 'enhanced-flow-authorization-code';
    const flowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
    
    return {
      showCredentialsModal: flowConfig.showCredentialsModal ?? DEFAULT_UI_SETTINGS.showCredentialsModal,
      showSuccessModal: flowConfig.showSuccessModal ?? DEFAULT_UI_SETTINGS.showSuccessModal,
      showAuthRequestModal: flowConfig.showAuthRequestModal ?? DEFAULT_UI_SETTINGS.showAuthRequestModal,
      showFlowDebugConsole: flowConfig.showFlowDebugConsole ?? DEFAULT_UI_SETTINGS.showFlowDebugConsole,
    };
  } catch (error) {
    console.warn('Failed to load UI settings from localStorage:', error);
    return DEFAULT_UI_SETTINGS;
  }
};

/**
 * Update a specific UI setting
 */
export const updateUISetting = (key: keyof UISettings, value: boolean): void => {
  try {
    const flowConfigKey = 'enhanced-flow-authorization-code';
    const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
    const updatedFlowConfig = {
      ...existingFlowConfig,
      [key]: value
    };
    localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));
    console.log(`💾 [UISettings] Updated ${key} to ${value}`);
  } catch (error) {
    console.error('Failed to update UI setting:', error);
  }
};

/**
 * Check if Flow Debug Console should be visible
 */
export const shouldShowFlowDebugConsole = (): boolean => {
  return getUISettings().showFlowDebugConsole;
};

/**
 * Subscribe to UI settings changes
 */
export const subscribeToUISettings = (callback: (settings: UISettings) => void): (() => void) => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'enhanced-flow-authorization-code') {
      callback(getUISettings());
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};
