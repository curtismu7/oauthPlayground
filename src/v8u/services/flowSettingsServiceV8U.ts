/**
 * @file flowSettingsServiceV8U.ts
 * @module v8u/services
 * @description Service for persisting flow-specific settings (spec version, UI state, etc.)
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Flow Settings Service - Manages per-flow-type settings persistence
 * 
 * Each flow type has its own isolated settings storage in localStorage:
 * - Spec version (OAuth 2.0, OAuth 2.1, OIDC) - user's preference per flow
 * - UI preferences (collapsed sections, etc.) - UI state per flow
 * - Last used timestamp - for analytics and "most recent flow" detection
 * 
 * Why per-flow settings?
 * - Users may want OAuth 2.0 for one flow and OIDC for another
 * - Each flow remembers its own spec version preference
 * - UI state (collapsed sections) can differ per flow
 * 
 * Storage format:
 * - Key: `v8u_flow_settings_{flowType}` (e.g., `v8u_flow_settings_oauth-authz`)
 * - Value: JSON object with FlowSettings interface
 * 
 * Debugging:
 * - Service is available globally as `window.FlowSettingsServiceV8U`
 * - Can inspect all settings: `FlowSettingsServiceV8U.getAllSettings()`
 * - Can modify settings: `FlowSettingsServiceV8U.saveSpecVersion('implicit', 'oauth2.1')`
 */

import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';

const MODULE_TAG = '[⚙️ FLOW-SETTINGS-V8U]';

export interface FlowSettings {
	specVersion: SpecVersion;
	lastUsed: number; // Timestamp
	credentialsCollapsed?: boolean; // UI state
}

const STORAGE_PREFIX = 'v8u_flow_settings_';

/**
 * Get storage key for a flow type
 */
function getStorageKey(flowType: FlowType): string {
	return `${STORAGE_PREFIX}${flowType}`;
}

/**
 * Load settings for a specific flow type
 */
export function loadSettings(flowType: FlowType): FlowSettings | null {
	try {
		const key = getStorageKey(flowType);
		const stored = localStorage.getItem(key);

		if (!stored) {
			console.log(`${MODULE_TAG} No settings found for flow`, { flowType });
			return null;
		}

		const settings = JSON.parse(stored) as FlowSettings;
		console.log(`${MODULE_TAG} Loaded settings for flow`, { flowType, settings });
		return settings;
	} catch (err) {
		console.error(`${MODULE_TAG} Error loading settings for flow`, { flowType, err });
		return null;
	}
}

/**
 * Save settings for a specific flow type
 */
export function saveSettings(flowType: FlowType, settings: Partial<FlowSettings>): void {
	try {
		const key = getStorageKey(flowType);

		// Load existing settings and merge with new ones
		const existing = loadSettings(flowType) || {
			specVersion: 'oauth2.0' as SpecVersion,
			lastUsed: Date.now(),
		};

		const updated: FlowSettings = {
			...existing,
			...settings,
			lastUsed: Date.now(), // Always update timestamp
		};

		localStorage.setItem(key, JSON.stringify(updated));
		console.log(`${MODULE_TAG} Saved settings for flow`, { flowType, updated });
	} catch (err) {
		console.error(`${MODULE_TAG} Error saving settings for flow`, { flowType, err });
	}
}

/**
 * Get spec version for a flow type (with fallback to default)
 */
export function getSpecVersion(flowType: FlowType): SpecVersion {
	const settings = loadSettings(flowType);
	return settings?.specVersion || 'oauth2.0';
}

/**
 * Save spec version for a flow type
 */
export function saveSpecVersion(flowType: FlowType, specVersion: SpecVersion): void {
	saveSettings(flowType, { specVersion });
}

/**
 * Get all flow settings (for debugging)
 */
export function getAllSettings(): Record<FlowType, FlowSettings | null> {
	const flowTypes: FlowType[] = [
		'oauth-authz',
		'implicit',
		'client-credentials',
		'ropc',
		'device-code',
		'hybrid',
	];

	const allSettings: Record<string, FlowSettings | null> = {};
	for (const flowType of flowTypes) {
		allSettings[flowType] = loadSettings(flowType);
	}

	console.log(`${MODULE_TAG} All flow settings`, allSettings);
	return allSettings as Record<FlowType, FlowSettings | null>;
}

/**
 * Clear settings for a specific flow type
 */
export function clearSettings(flowType: FlowType): void {
	try {
		const key = getStorageKey(flowType);
		localStorage.removeItem(key);
		console.log(`${MODULE_TAG} Cleared settings for flow`, { flowType });
	} catch (err) {
		console.error(`${MODULE_TAG} Error clearing settings for flow`, { flowType, err });
	}
}

/**
 * Clear all flow settings
 */
export function clearAllSettings(): void {
	const flowTypes: FlowType[] = [
		'oauth-authz',
		'implicit',
		'client-credentials',
		'ropc',
		'device-code',
		'hybrid',
	];

	for (const flowType of flowTypes) {
		clearSettings(flowType);
	}

	console.log(`${MODULE_TAG} Cleared all flow settings`);
}

/**
 * Get the most recently used flow type
 */
export function getMostRecentFlow(): FlowType | null {
	const allSettings = getAllSettings();
	let mostRecent: { flowType: FlowType; timestamp: number } | null = null;

	for (const [flowType, settings] of Object.entries(allSettings)) {
		if (settings && settings.lastUsed) {
			if (!mostRecent || settings.lastUsed > mostRecent.timestamp) {
				mostRecent = {
					flowType: flowType as FlowType,
					timestamp: settings.lastUsed,
				};
			}
		}
	}

	console.log(`${MODULE_TAG} Most recent flow`, mostRecent);
	return mostRecent?.flowType || null;
}

// Export as object for backward compatibility and global access
export const FlowSettingsServiceV8U = {
	loadSettings,
	saveSettings,
	getSpecVersion,
	saveSpecVersion,
	getAllSettings,
	clearSettings,
	clearAllSettings,
	getMostRecentFlow,
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as { FlowSettingsServiceV8U?: typeof FlowSettingsServiceV8U }).FlowSettingsServiceV8U = FlowSettingsServiceV8U;
	console.log(`${MODULE_TAG} 🔧 Service available globally as window.FlowSettingsServiceV8U`);
	console.log(`${MODULE_TAG} 🔧 Available commands:`);
	console.log(`${MODULE_TAG}   - FlowSettingsServiceV8U.getAllSettings()`);
	console.log(`${MODULE_TAG}   - FlowSettingsServiceV8U.getSpecVersion('implicit')`);
	console.log(`${MODULE_TAG}   - FlowSettingsServiceV8U.saveSpecVersion('implicit', 'oauth2.1')`);
	console.log(`${MODULE_TAG}   - FlowSettingsServiceV8U.clearAllSettings()`);
}
