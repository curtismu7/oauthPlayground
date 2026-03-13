/**
 * @file universalSettingsService.ts
 * @description Universal Settings Service - Single source of truth for app-wide configuration
 * @version 1.0.0
 * @since 2026-03-11
 *
 * Provides unified settings management with flow-specific override capabilities.
 * Uses unifiedTokenStorageService for persistence with IndexedDB + SQLite backup.
 */

import { logger } from '../utils/logger';
import { unifiedTokenStorage } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔧 UNIVERSAL-SETTINGS]';
const STORAGE_KEY = 'universal_settings_v1';
const OVERRIDE_PREFIX = 'flow_override_';

// ============================================================================
// INTERFACES
// ============================================================================

export interface UniversalSettings {
	// Core PingOne Configuration
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	region: 'na' | 'eu' | 'ca' | 'ap' | 'au';

	// Redirect URIs
	redirectUri: string;
	postLogoutRedirectUri: string;
	logoutUri?: string;

	// OAuth/OIDC Settings
	scopes: string[];
	responseType: string;
	responseMode?: string;
	clientAuthMethod: string;
	pkceMode: 'required' | 'optional' | 'disabled';

	// Advanced Settings
	tokenEndpointAuthMethod: string;
	jwksUri?: string;
	issuerUrl?: string;

	// UI Preferences
	theme: 'light' | 'dark' | 'auto';
	sidebarCollapsed: boolean;
	preferredFlows: string[];

	// Metadata
	version: string;
	lastUpdated: number;
	source: 'universal' | 'flow_override';
}

export interface FlowOverrideSettings
	extends Omit<UniversalSettings, 'version' | 'lastUpdated' | 'source'> {
	flowKey: string;
	isActive: boolean;
	created: number;
	modified: number;
}

export interface SettingsLoadResult {
	settings: UniversalSettings;
	source: 'universal' | 'flow_override' | 'default';
	overrideKey?: string;
}

export interface SettingsPriority {
	useUniversal: boolean;
	flowKey?: string;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const DEFAULT_SETTINGS: UniversalSettings = {
	// Core PingOne Configuration
	environmentId: '',
	clientId: '',
	clientSecret: '',
	region: 'na',

	// Redirect URIs
	redirectUri: '',
	postLogoutRedirectUri: '',
	logoutUri: '',

	// OAuth/OIDC Settings
	scopes: ['openid', 'profile', 'email'],
	responseType: 'code',
	responseMode: 'query',
	clientAuthMethod: 'client_secret_basic',
	pkceMode: 'required',

	// Advanced Settings
	tokenEndpointAuthMethod: 'client_secret_basic',
	jwksUri: '',
	issuerUrl: '',

	// UI Preferences
	theme: 'auto',
	sidebarCollapsed: false,
	preferredFlows: [],

	// Metadata
	version: '1.0.0',
	lastUpdated: Date.now(),
	source: 'universal',
};

// ============================================================================
// UNIVERSAL SETTINGS SERVICE
// ============================================================================

export const UniversalSettingsService = {
	/**
	 * Load settings with priority system
	 * Priority: Flow override → Universal settings → Default settings
	 */
	async loadSettings(priority?: SettingsPriority): Promise<SettingsLoadResult> {
		try {
			logger.info(`${MODULE_TAG} Loading settings with priority:`, priority);

			// If flow-specific priority requested and flow override exists
			if (priority?.flowKey && priority.useUniversal === false) {
				const override = await this.loadFlowOverride(priority.flowKey);
				if (override?.isActive) {
					logger.info(`${MODULE_TAG} Using flow override for:`, priority.flowKey);
					return {
						settings: {
							...override,
							version: '1.0.0',
							lastUpdated: override.modified,
							source: 'flow_override' as const,
						},
						source: 'flow_override',
						overrideKey: `${OVERRIDE_PREFIX}${priority.flowKey}`,
					};
				}
			}

			// Load universal settings
			const universalResult = await unifiedTokenStorage.getTokens({ type: 'environment_settings' });
			if (universalResult.success && universalResult.data) {
				const universalToken = universalResult.data.find((token: any) => token.id === STORAGE_KEY);
				if (universalToken) {
					const universalSettings = JSON.parse(universalToken.value) as UniversalSettings;
					logger.info(`${MODULE_TAG} Using universal settings`);
					return {
						settings: universalSettings,
						source: 'universal',
					};
				}
			}

			// Fallback to default settings
			logger.info(`${MODULE_TAG} Using default settings`);
			return {
				settings: { ...DEFAULT_SETTINGS },
				source: 'default',
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Error loading settings:`, error);
			return {
				settings: { ...DEFAULT_SETTINGS },
				source: 'default',
			};
		}
	},

	/**
	 * Save universal settings
	 */
	async saveUniversalSettings(settings: Partial<UniversalSettings>): Promise<boolean> {
		try {
			// Load existing universal settings
			const existingResult = await this.loadSettings();
			const updatedSettings: UniversalSettings = {
				...existingResult.settings,
				...settings,
				version: '1.0.0',
				lastUpdated: Date.now(),
				source: 'universal',
			};

			// Save to unified storage
			const result = await unifiedTokenStorage.storeToken(
				{
					type: 'environment_settings' as const,
					value: JSON.stringify(updatedSettings),
					expiresAt: null,
					issuedAt: Date.now(),
					source: 'user_input' as const,
					environmentId: updatedSettings.environmentId,
					clientId: updatedSettings.clientId,
				},
				{ id: STORAGE_KEY }
			);

			if (result) {
				logger.info(`${MODULE_TAG} Universal settings saved successfully`);
				return true;
			} else {
				logger.error(`${MODULE_TAG} Failed to save universal settings`);
				return false;
			}
		} catch (error) {
			logger.error(`${MODULE_TAG} Error saving universal settings:`, error);
			return false;
		}
	},

	/**
	 * Save flow-specific override
	 */
	async saveFlowOverride(flowKey: string, settings: Partial<UniversalSettings>): Promise<boolean> {
		try {
			const overrideKey = `${OVERRIDE_PREFIX}${flowKey}`;

			// Load existing override if any
			const existingResult = await this.loadFlowOverride(flowKey);
			let baseOverride: FlowOverrideSettings;

			if (existingResult) {
				baseOverride = existingResult;
			} else {
				// Load universal settings as base
				const universalResult = await this.loadSettings();
				baseOverride = {
					...universalResult.settings,
					flowKey,
					isActive: true,
					created: Date.now(),
					modified: Date.now(),
				};
			}

			// Update override with new settings
			const updatedOverride: FlowOverrideSettings = {
				...baseOverride,
				...settings,
				flowKey,
				isActive: true,
				modified: Date.now(),
			};

			// Save override
			const result = await unifiedTokenStorage.storeToken(
				{
					type: 'environment_settings' as const,
					value: JSON.stringify(updatedOverride),
					expiresAt: null,
					issuedAt: Date.now(),
					source: 'user_input' as const,
					flowType: flowKey,
					environmentId: updatedOverride.environmentId,
					clientId: updatedOverride.clientId,
				},
				{ id: overrideKey }
			);

			if (result) {
				logger.info(`${MODULE_TAG} Flow override saved for:`, flowKey);
				return true;
			} else {
				logger.error(`${MODULE_TAG} Failed to save flow override`);
				return false;
			}
		} catch (error) {
			logger.error(`${MODULE_TAG} Error saving flow override:`, error);
			return false;
		}
	},

	/**
	 * Load flow-specific override
	 */
	async loadFlowOverride(flowKey: string): Promise<FlowOverrideSettings | null> {
		try {
			const overrideKey = `${OVERRIDE_PREFIX}${flowKey}`;
			const result = await unifiedTokenStorage.getTokens({ type: 'environment_settings' });

			if (result.success && result.data) {
				const overrideToken = result.data.find((token: any) => token.id === overrideKey);
				if (overrideToken) {
					return JSON.parse(overrideToken.value) as FlowOverrideSettings;
				}
			}

			return null;
		} catch (error) {
			logger.error(`${MODULE_TAG} Error loading flow override:`, error);
			return null;
		}
	},

	/**
	 * Delete flow override (reset to universal settings)
	 */
	async deleteFlowOverride(flowKey: string): Promise<boolean> {
		try {
			const overrideKey = `${OVERRIDE_PREFIX}${flowKey}`;
			const result = await unifiedTokenStorage.deleteToken(overrideKey);

			if (result.success) {
				logger.info(`${MODULE_TAG} Flow override deleted for:`, flowKey);
				return true;
			} else {
				logger.error(
					`${MODULE_TAG} Failed to delete flow override:`,
					result.error || 'Unknown error'
				);
				return false;
			}
		} catch (error) {
			logger.error(`${MODULE_TAG} Error deleting flow override:`, error);
			return false;
		}
	},

	/**
	 * Get all flow overrides
	 */
	async getAllFlowOverrides(): Promise<FlowOverrideSettings[]> {
		try {
			const result = await unifiedTokenStorage.getTokens({
				type: 'environment_settings',
			});

			if (result.success && result.data) {
				const overrides: FlowOverrideSettings[] = [];

				for (const token of result.data) {
					if (token.id?.startsWith(OVERRIDE_PREFIX)) {
						try {
							const override = JSON.parse(token.value) as FlowOverrideSettings;
							if (override.isActive) {
								overrides.push(override);
							}
						} catch (_parseError) {
							logger.warn(`${MODULE_TAG} Failed to parse override:`, token.id);
						}
					}
				}

				return overrides;
			}

			return [];
		} catch (error) {
			logger.error(`${MODULE_TAG} Error getting all flow overrides:`, error);
			return [];
		}
	},

	/**
	 * Check if flow has override
	 */
	async hasFlowOverride(flowKey: string): Promise<boolean> {
		const override = await this.loadFlowOverride(flowKey);
		return override?.isActive;
	},

	/**
	 * Migrate existing settings to universal settings
	 */
	async migrateExistingSettings(): Promise<void> {
		try {
			logger.info(`${MODULE_TAG} Starting migration of existing settings`);

			// Check if universal settings already exist
			const existing = await this.loadSettings();
			if (existing.source !== 'default') {
				logger.info(`${MODULE_TAG} Universal settings already exist, skipping migration`);
				return;
			}

			// Migrate from localStorage (legacy)
			const migratedSettings: Partial<UniversalSettings> = {};

			// Check for common localStorage keys
			const localStorageKeys = [
				'oauth_config',
				'pingone_config',
				'unified_config',
				'environment_id',
				'client_id',
				'client_secret',
				'region',
			];

			for (const key of localStorageKeys) {
				try {
					const value = localStorage.getItem(key);
					if (value) {
						if (key === 'oauth_config' || key === 'pingone_config' || key === 'unified_config') {
							const config = JSON.parse(value);
							Object.assign(migratedSettings, config);
						} else if (key === 'environment_id') {
							migratedSettings.environmentId = value;
						} else if (key === 'client_id') {
							migratedSettings.clientId = value;
						} else if (key === 'client_secret') {
							migratedSettings.clientSecret = value;
						} else if (key === 'region') {
							migratedSettings.region = value as 'na' | 'eu' | 'ca' | 'ap' | 'au';
						}
					}
				} catch (_parseError) {
					logger.warn(`${MODULE_TAG} Failed to migrate localStorage key:`, key);
				}
			}

			// Save migrated settings if any were found
			if (Object.keys(migratedSettings).length > 0) {
				await this.saveUniversalSettings(migratedSettings);
				logger.info(
					`${MODULE_TAG} Migrated settings from localStorage:`,
					Object.keys(migratedSettings).join(', ')
				);
			} else {
				// Save default settings
				await this.saveUniversalSettings(DEFAULT_SETTINGS);
				logger.info(`${MODULE_TAG} No existing settings found, saved defaults`);
			}

			logger.info(`${MODULE_TAG} Migration completed successfully`);
		} catch (error) {
			logger.error(`${MODULE_TAG} Migration failed:`, error);
		}
	},

	/**
	 * Reset all settings to defaults
	 */
	async resetAllSettings(): Promise<boolean> {
		try {
			// Delete universal settings
			await unifiedTokenStorage.deleteToken(STORAGE_KEY);

			// Delete all flow overrides
			const overrides = await this.getAllFlowOverrides();
			for (const override of overrides) {
				await this.deleteFlowOverride(override.flowKey);
			}

			// Save default universal settings
			await this.saveUniversalSettings(DEFAULT_SETTINGS);

			logger.info(`${MODULE_TAG} All settings reset to defaults`);
			return true;
		} catch (error) {
			logger.error(`${MODULE_TAG} Error resetting settings:`, error);
			return false;
		}
	},
};
