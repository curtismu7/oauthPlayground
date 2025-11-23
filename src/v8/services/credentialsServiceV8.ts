/**
 * @file credentialsServiceV8.ts
 * @module v8/services
 * @description Centralized credentials management service for all V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Smart features:
 * - Flow-specific field visibility
 * - Intelligent defaults to minimize user input
 * - App discovery integration
 * - Automatic field adjustment when app config changes
 *
 * @example
 * // Get smart defaults for a flow
 * const creds = CredentialsServiceV8.getSmartDefaults('oauth-authz-v8');
 *
 * // Load with app discovery
 * const creds = CredentialsServiceV8.loadWithAppDiscovery('oauth-authz-v8', appConfig);
 *
 * // Save credentials
 * CredentialsServiceV8.saveCredentials('oauth-authz-v8', credentials);
 */

const MODULE_TAG = '[💾 CREDENTIALS-SERVICE-V8]';

export interface Credentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	logoutUri?: string;
	scopes?: string;
	loginHint?: string;
	responseType?: string;
	issuerUrl?: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	// OAuth/OIDC advanced parameters
	responseMode?: 'query' | 'fragment' | 'form_post' | 'pi.flow';
	maxAge?: number;
	display?: 'page' | 'popup' | 'touch' | 'wap';
	prompt?: 'none' | 'login' | 'consent';
	[key: string]: any;
}

export interface CredentialsConfig {
	flowKey: string;
	flowType: 'oauth' | 'oidc' | 'client-credentials' | 'device-code' | 'ropc' | 'hybrid' | 'pkce';
	includeClientSecret: boolean;
	includeRedirectUri: boolean;
	includeLogoutUri: boolean;
	includeScopes: boolean;
	defaultScopes?: string;
	defaultRedirectUri?: string;
	defaultLogoutUri?: string;
}

export interface AppConfig {
	clientId: string;
	redirectUris: string[];
	logoutUris?: string[];
	grantTypes: string[];
	scopes?: string[];
	responseTypes?: string[];
}

// Flow-specific field configurations
const FLOW_FIELD_CONFIG: Record<string, CredentialsConfig> = {
	'oauth-authz-v8': {
		flowKey: 'oauth-authz-v8',
		flowType: 'oauth',
		includeClientSecret: true,
		includeRedirectUri: true,
		includeLogoutUri: false,
		includeScopes: true,
		defaultScopes: 'openid profile email',
		defaultRedirectUri: 'http://localhost:3000/callback',
	},
	'implicit-flow-v8': {
		flowKey: 'implicit-flow-v8',
		flowType: 'oidc',
		includeClientSecret: false,
		includeRedirectUri: true,
		includeLogoutUri: false,
		includeScopes: true,
		defaultScopes: 'openid profile email',
		defaultRedirectUri: 'http://localhost:3000/implicit-callback',
	},
	'client-credentials-v8': {
		flowKey: 'client-credentials-v8',
		flowType: 'oauth',
		includeClientSecret: true,
		includeRedirectUri: false,
		includeLogoutUri: false,
		includeScopes: true,
		defaultScopes: 'api:read api:write',
	},
	'device-code-v8': {
		flowKey: 'device-code-v8',
		flowType: 'oauth',
		includeClientSecret: false,
		includeRedirectUri: false,
		includeLogoutUri: false,
		includeScopes: true,
		defaultScopes: 'openid profile email',
	},
	'ropc-v8': {
		flowKey: 'ropc-v8',
		flowType: 'ropc',
		includeClientSecret: true,
		includeRedirectUri: false,
		includeLogoutUri: false,
		includeScopes: true,
		defaultScopes: 'openid profile email',
	},
	'hybrid-v8': {
		flowKey: 'hybrid-v8',
		flowType: 'hybrid',
		includeClientSecret: true,
		includeRedirectUri: true,
		includeLogoutUri: true,
		includeScopes: true,
		defaultScopes: 'openid profile email',
		defaultRedirectUri: 'http://localhost:3000/callback',
		defaultLogoutUri: 'http://localhost:3000/logout',
	},
	'pkce-v8': {
		flowKey: 'pkce-v8',
		flowType: 'pkce',
		includeClientSecret: false,
		includeRedirectUri: true,
		includeLogoutUri: false,
		includeScopes: true,
		defaultScopes: 'openid profile email',
		defaultRedirectUri: 'http://localhost:3000/callback',
	},
};

export class CredentialsServiceV8 {
	private static readonly STORAGE_PREFIX = 'v8_credentials_';

	/**
	 * Get smart defaults for a flow - minimizes user input
	 * @param flowKey - Unique key for the flow (e.g., 'oauth-authz-v8')
	 * @returns Default credentials with smart values
	 * @example
	 * const defaults = CredentialsServiceV8.getSmartDefaults('oauth-authz-v8');
	 */
	static getSmartDefaults(flowKey: string): Credentials {
		const config = FLOW_FIELD_CONFIG[flowKey];
		if (!config) {
			console.warn(`${MODULE_TAG} Unknown flow key, using generic defaults`, { flowKey });
			return CredentialsServiceV8.getDefaultCredentials(flowKey, {
				flowKey,
				flowType: 'oauth',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: true,
			});
		}

		console.log(`${MODULE_TAG} Getting smart defaults`, { flowKey, flowType: config.flowType });

		const defaults: Credentials = {
			environmentId: '',
			clientId: '',
			...(config.includeClientSecret && { clientSecret: '' }),
			...(config.includeRedirectUri && { redirectUri: config.defaultRedirectUri || '' }),
			...(config.includeLogoutUri && { logoutUri: config.defaultLogoutUri || '' }),
			...(config.includeScopes && { scopes: config.defaultScopes || 'openid profile email' }),
		};

		return defaults;
	}

	/**
	 * Get default credentials for a flow type
	 * @param flowKey - Unique key for the flow (e.g., 'oauth-authz-v8')
	 * @param config - Configuration for which fields to include
	 * @returns Default credentials object
	 * @example
	 * const defaults = CredentialsServiceV8.getDefaultCredentials('oauth-authz-v8', config);
	 */
	static getDefaultCredentials(flowKey: string, config: CredentialsConfig): Credentials {
		console.log(`${MODULE_TAG} Getting default credentials`, {
			flowKey,
			flowType: config.flowType,
		});

		const defaults: Credentials = {
			environmentId: '',
			clientId: '',
			...(config.includeClientSecret && { clientSecret: '' }),
			...(config.includeRedirectUri && { redirectUri: config.defaultRedirectUri || '' }),
			...(config.includeLogoutUri && { logoutUri: config.defaultLogoutUri || '' }),
			...(config.includeScopes && { scopes: config.defaultScopes || 'openid profile email' }),
		};

		return defaults;
	}

	/**
	 * Get flow configuration for a flow key
	 * @param flowKey - Unique key for the flow
	 * @returns Flow configuration or undefined if not found
	 */
	static getFlowConfig(flowKey: string): CredentialsConfig | undefined {
		return FLOW_FIELD_CONFIG[flowKey];
	}

	/**
	 * Load credentials with app discovery integration
	 * Automatically adjusts redirect URIs and other fields based on app config
	 * @param flowKey - Unique key for the flow
	 * @param appConfig - App configuration from PingOne
	 * @returns Credentials with app-discovered values
	 * @example
	 * const creds = CredentialsServiceV8.loadWithAppDiscovery('oauth-authz-v8', appConfig);
	 */
	static loadWithAppDiscovery(flowKey: string, appConfig: AppConfig): Credentials {
		console.log(`${MODULE_TAG} Loading credentials with app discovery`, { flowKey });

		const config = FLOW_FIELD_CONFIG[flowKey];
		if (!config) {
			console.warn(`${MODULE_TAG} Unknown flow key, loading without app discovery`, { flowKey });
			return CredentialsServiceV8.loadCredentials(flowKey, {
				flowKey,
				flowType: 'oauth',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: true,
			});
		}

		// Load stored credentials or get defaults
		const stored = CredentialsServiceV8.loadCredentials(flowKey, config);

		// Merge with app config
		const merged: Credentials = {
			...stored,
			clientId: appConfig.clientId || stored.clientId,
			...(config.includeRedirectUri &&
				appConfig.redirectUris?.length > 0 && {
					redirectUri: appConfig.redirectUris[0],
				}),
			...(config.includeLogoutUri &&
				appConfig.logoutUris?.length > 0 && {
					logoutUri: appConfig.logoutUris[0],
				}),
			...(config.includeScopes &&
				appConfig.scopes && {
					scopes: appConfig.scopes.join(' '),
				}),
		};

		console.log(`${MODULE_TAG} Credentials merged with app config`, { flowKey });
		return merged;
	}

	/**
	 * Check if redirect URI changed and needs app update
	 * @param flowKey - Unique key for the flow
	 * @param currentRedirectUri - Current redirect URI from UI
	 * @param appRedirectUris - Redirect URIs from app config
	 * @returns True if redirect URI needs to be updated in app
	 */
	static needsRedirectUriUpdate(
		flowKey: string,
		currentRedirectUri: string,
		appRedirectUris: string[]
	): boolean {
		const config = FLOW_FIELD_CONFIG[flowKey];
		if (!config?.includeRedirectUri) return false;

		const needsUpdate = !appRedirectUris.includes(currentRedirectUri);
		if (needsUpdate) {
			console.log(`${MODULE_TAG} Redirect URI needs app update`, {
				flowKey,
				current: currentRedirectUri,
				registered: appRedirectUris,
			});
		}
		return needsUpdate;
	}

	/**
	 * Check if logout URI changed and needs app update
	 * @param flowKey - Unique key for the flow
	 * @param currentLogoutUri - Current logout URI from UI
	 * @param appLogoutUris - Logout URIs from app config
	 * @returns True if logout URI needs to be updated in app
	 */
	static needsLogoutUriUpdate(
		flowKey: string,
		currentLogoutUri: string,
		appLogoutUris: string[] | undefined
	): boolean {
		const config = FLOW_FIELD_CONFIG[flowKey];
		if (!config?.includeLogoutUri) return false;

		const needsUpdate = !appLogoutUris?.includes(currentLogoutUri);
		if (needsUpdate) {
			console.log(`${MODULE_TAG} Logout URI needs app update`, {
				flowKey,
				current: currentLogoutUri,
				registered: appLogoutUris,
			});
		}
		return needsUpdate;
	}

	/**
	 * Load credentials from storage
	 * @param flowKey - Unique key for the flow
	 * @param config - Configuration for which fields to include
	 * @returns Saved credentials or defaults if not found
	 * @example
	 * const creds = CredentialsServiceV8.loadCredentials('oauth-authz-v8', config);
	 */
	static loadCredentials(flowKey: string, config: CredentialsConfig): Credentials {
		console.log(`${MODULE_TAG} Loading credentials from storage`, { flowKey });

		try {
			const storageKey = `${CredentialsServiceV8.STORAGE_PREFIX}${flowKey}`;
			const stored = localStorage.getItem(storageKey);

			if (stored) {
				const parsed = JSON.parse(stored);
				console.log(`${MODULE_TAG} Credentials loaded from storage`, { flowKey });
				return parsed;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Error loading credentials from storage`, { flowKey, error });
		}

		return CredentialsServiceV8.getDefaultCredentials(flowKey, config);
	}

	/**
	 * Load credentials with IndexedDB fallback (async)
	 * Tries localStorage first, then IndexedDB backup
	 */
	static async loadCredentialsWithBackup(
		flowKey: string,
		config: CredentialsConfig
	): Promise<Credentials> {
		console.log(`${MODULE_TAG} Loading credentials with backup fallback`, { flowKey });

		// Try localStorage first (fast)
		try {
			const storageKey = `${CredentialsServiceV8.STORAGE_PREFIX}${flowKey}`;
			const stored = localStorage.getItem(storageKey);

			if (stored) {
				const parsed = JSON.parse(stored);
				console.log(`${MODULE_TAG} ✅ Credentials loaded from localStorage`, { flowKey });
				return parsed;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Error loading from localStorage`, { flowKey, error });
		}

		// Try IndexedDB backup (fallback)
		if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
			try {
				const storageKey = `${CredentialsServiceV8.STORAGE_PREFIX}${flowKey}`;
				const backup = await (window as any).IndexedDBBackupServiceV8U.load<Credentials>(
					storageKey
				);

				if (backup) {
					console.log(`${MODULE_TAG} ✅ Credentials restored from IndexedDB backup`, { flowKey });
					// Restore to localStorage
					try {
						localStorage.setItem(storageKey, JSON.stringify(backup));
					} catch {}
					return backup;
				}
			} catch (error) {
				console.error(`${MODULE_TAG} ❌ Error loading from IndexedDB`, { flowKey, error });
			}
		}

		console.log(`${MODULE_TAG} ⚠️ No credentials found, using defaults`, { flowKey });
		return CredentialsServiceV8.getDefaultCredentials(flowKey, config);
	}

	/**
	 * Save credentials to storage
	 * @param flowKey - Unique key for the flow
	 * @param credentials - Credentials to save
	 * @example
	 * CredentialsServiceV8.saveCredentials('oauth-authz-v8', credentials);
	 */
	static saveCredentials(flowKey: string, credentials: Credentials): void {
		console.log(`${MODULE_TAG} Saving credentials to storage`, { flowKey });

		try {
			const storageKey = `${CredentialsServiceV8.STORAGE_PREFIX}${flowKey}`;
			localStorage.setItem(storageKey, JSON.stringify(credentials));
			console.log(`${MODULE_TAG} Credentials saved successfully`, { flowKey });

			// BACKUP: Also save to IndexedDB for maximum reliability
			if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
				(window as any).IndexedDBBackupServiceV8U.save(storageKey, credentials, 'credentials')
					.then(() => {
						console.log(`${MODULE_TAG} ✅ Credentials backed up to IndexedDB`, { flowKey });
					})
					.catch((err: Error) => {
						console.warn(`${MODULE_TAG} ⚠️ IndexedDB backup failed (non-critical)`, {
							flowKey,
							error: err,
						});
					});
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Error saving credentials to storage`, { flowKey, error });
		}
	}

	/**
	 * Clear credentials from storage
	 * @param flowKey - Unique key for the flow
	 * @example
	 * CredentialsServiceV8.clearCredentials('oauth-authz-v8');
	 */
	static clearCredentials(flowKey: string): void {
		console.log(`${MODULE_TAG} Clearing credentials from storage`, { flowKey });

		try {
			const storageKey = `${CredentialsServiceV8.STORAGE_PREFIX}${flowKey}`;
			localStorage.removeItem(storageKey);
			console.log(`${MODULE_TAG} Credentials cleared successfully`, { flowKey });
		} catch (error) {
			console.error(`${MODULE_TAG} Error clearing credentials from storage`, { flowKey, error });
		}
	}

	/**
	 * Validate credentials
	 * @param credentials - Credentials to validate
	 * @param flowType - Flow type for validation rules
	 * @returns Validation result with errors and warnings
	 * @example
	 * const result = CredentialsServiceV8.validateCredentials(credentials, 'oauth');
	 * if (result.errors.length > 0) {
	 *   console.error('Validation failed:', result.errors);
	 * }
	 */
	static validateCredentials(
		credentials: Credentials,
		flowType: string
	): {
		errors: Array<{ message: string; field?: string }>;
		warnings: Array<{ message: string; field?: string }>;
	} {
		console.log(`${MODULE_TAG} Validating credentials`, { flowType });

		const errors: Array<{ message: string; field?: string }> = [];
		const warnings: Array<{ message: string; field?: string }> = [];

		// Always required
		if (!credentials.environmentId?.trim()) {
			errors.push({ message: 'Environment ID is required', field: 'environmentId' });
		} else if (!CredentialsServiceV8.isValidUUID(credentials.environmentId)) {
			warnings.push({ message: 'Environment ID should be a valid UUID', field: 'environmentId' });
		}

		if (!credentials.clientId?.trim()) {
			errors.push({ message: 'Client ID is required', field: 'clientId' });
		}

		// Flow-specific validation
		const config = FLOW_FIELD_CONFIG[`${flowType}-v8`] || FLOW_FIELD_CONFIG[flowType];

		if (config?.includeRedirectUri && !credentials.redirectUri?.trim()) {
			errors.push({ message: 'Redirect URI is required for this flow', field: 'redirectUri' });
		} else if (
			credentials.redirectUri &&
			!CredentialsServiceV8.isValidUrl(credentials.redirectUri)
		) {
			warnings.push({ message: 'Redirect URI should be a valid URL', field: 'redirectUri' });
		}

		if (config?.includeScopes && !credentials.scopes?.trim()) {
			errors.push({ message: 'Scopes are required for this flow', field: 'scopes' });
		}

		// Client secret validation
		if (config?.includeClientSecret && !credentials.clientSecret?.trim()) {
			warnings.push({
				message: 'Client Secret is recommended for this flow',
				field: 'clientSecret',
			});
		}

		// OIDC-specific validation
		if (flowType.toLowerCase().includes('oidc') && config?.includeScopes) {
			if (!credentials.scopes?.includes('openid')) {
				errors.push({ message: 'OIDC flows require "openid" scope', field: 'scopes' });
			}
		}

		// Post-logout redirect URI validation
		if (
			credentials.postLogoutRedirectUri &&
			!CredentialsServiceV8.isValidUrl(credentials.postLogoutRedirectUri)
		) {
			warnings.push({
				message: 'Post-Logout Redirect URI should be a valid URL',
				field: 'postLogoutRedirectUri',
			});
		}

		// Issuer URL validation
		if (credentials.issuerUrl && !CredentialsServiceV8.isValidUrl(credentials.issuerUrl)) {
			warnings.push({ message: 'Issuer URL should be a valid URL', field: 'issuerUrl' });
		}

		console.log(`${MODULE_TAG} Validation complete`, {
			errorCount: errors.length,
			warningCount: warnings.length,
		});

		return { errors, warnings };
	}

	/**
	 * Check if string is a valid UUID
	 * @param value - String to check
	 * @returns True if valid UUID format
	 */
	private static isValidUUID(value: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(value);
	}

	/**
	 * Check if string is a valid URL
	 * @param value - String to check
	 * @returns True if valid URL format
	 */
	private static isValidUrl(value: string): boolean {
		try {
			new URL(value);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Export credentials as JSON
	 * @param credentials - Credentials to export
	 * @returns JSON string
	 * @example
	 * const json = CredentialsServiceV8.exportCredentials(credentials);
	 */
	static exportCredentials(credentials: Credentials): string {
		console.log(`${MODULE_TAG} Exporting credentials`);
		return JSON.stringify(credentials, null, 2);
	}

	/**
	 * Import credentials from JSON
	 * @param json - JSON string to import
	 * @returns Parsed credentials
	 * @throws Error if JSON is invalid
	 * @example
	 * const creds = CredentialsServiceV8.importCredentials(jsonString);
	 */
	static importCredentials(json: string): Credentials {
		console.log(`${MODULE_TAG} Importing credentials`);

		try {
			const parsed = JSON.parse(json);
			if (!parsed.environmentId || !parsed.clientId) {
				throw new Error('Invalid credentials: missing required fields');
			}
			return parsed;
		} catch (error) {
			console.error(`${MODULE_TAG} Error importing credentials`, { error });
			throw new Error(
				`Failed to import credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get storage key for a flow
	 * @param flowKey - Unique key for the flow
	 * @returns Full storage key
	 */
	static getStorageKey(flowKey: string): string {
		return `${CredentialsServiceV8.STORAGE_PREFIX}${flowKey}`;
	}

	/**
	 * Check if credentials are stored for a flow
	 * @param flowKey - Unique key for the flow
	 * @returns True if credentials exist in storage
	 */
	static hasStoredCredentials(flowKey: string): boolean {
		try {
			const storageKey = CredentialsServiceV8.getStorageKey(flowKey);
			return localStorage.getItem(storageKey) !== null;
		} catch {
			return false;
		}
	}
}

export default CredentialsServiceV8;
