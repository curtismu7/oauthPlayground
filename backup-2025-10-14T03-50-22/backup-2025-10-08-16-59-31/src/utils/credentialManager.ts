// src/utils/credentialManager.ts

import { getCallbackUrlForFlow } from './callbackUrls';
import { logger } from './logger';
import { oidcDiscoveryService, type OIDCDiscoveryDocument } from '../services/oidcDiscoveryService';

export interface PermanentCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	scopes: string[];
	authEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	endSessionEndpoint?: string;
	tokenAuthMethod?: string;
	useJwksEndpoint?: boolean;
	loginHint?: string;
	// OIDC Discovery fields
	issuerUrl?: string;
	discoveredEndpoints?: OIDCDiscoveryDocument;
	lastDiscoveryTime?: number;
}

export interface SessionCredentials {
	clientSecret: string;
}

export interface AllCredentials extends PermanentCredentials {
	clientSecret: string; // Required in AllCredentials
}

export interface WorkerFlowCredentials extends PermanentCredentials {
	privateKey?: string;
	clientAuthMethod?: string;
}

export interface DiscoveryPreferences {
	environmentId: string;
	region: string;
	lastUpdated: number;
}

class CredentialManager {
	private readonly PERMANENT_CREDENTIALS_KEY = 'pingone_permanent_credentials';
	private readonly SESSION_CREDENTIALS_KEY = 'pingone_session_credentials';
	private readonly CONFIG_CREDENTIALS_KEY = 'pingone_config_credentials';
	private readonly AUTHZ_FLOW_CREDENTIALS_KEY = 'pingone_authz_flow_credentials';
	private readonly IMPLICIT_FLOW_CREDENTIALS_KEY = 'pingone_implicit_flow_credentials';
	private readonly HYBRID_FLOW_CREDENTIALS_KEY = 'pingone_hybrid_flow_credentials';
	private readonly WORKER_FLOW_CREDENTIALS_KEY = 'pingone_worker_flow_credentials';
	private readonly DEVICE_FLOW_CREDENTIALS_KEY = 'pingone_device_flow_credentials';
	private readonly DISCOVERY_PREFERENCES_KEY = 'pingone_discovery_preferences';
	private cache: {
		permanent?: PermanentCredentials;
		session?: SessionCredentials;
		all?: AllCredentials;
		timestamp?: number;
	} = {};
	private readonly CACHE_DURATION = 5000; // 5 second cache

	/**
	 * Invalidate cache when credentials are modified
	 */
	private invalidateCache(): void {
		this.cache = {};
	}

	/**
	 * Save configuration-specific credentials (from Configuration page)
	 * These are separate from flow-specific credentials
	 */
	saveConfigCredentials(credentials: Partial<PermanentCredentials>): boolean {
		try {
			const existing = this.loadConfigCredentials();
			const updated = {
				...existing,
				...credentials,
				lastUpdated: Date.now(),
			};

			console.log(' [CredentialManager] Saving config credentials to localStorage:', {
				key: this.CONFIG_CREDENTIALS_KEY,
				data: updated,
			});

			localStorage.setItem(this.CONFIG_CREDENTIALS_KEY, JSON.stringify(updated));

			// Invalidate cache after saving
			this.invalidateCache();

			// Verify it was saved
			const saved = localStorage.getItem(this.CONFIG_CREDENTIALS_KEY);
			console.log(' [CredentialManager] Verified config credentials save:', saved);

			logger.success('CredentialManager', 'Saved config credentials', {
				hasEnvironmentId: !!updated.environmentId,
				hasClientId: !!updated.clientId,
				hasRedirectUri: !!updated.redirectUri,
			});

			// Dispatch event to notify other components
			window.dispatchEvent(
				new CustomEvent('config-credentials-changed', {
					detail: { credentials: updated },
				})
			);

			return true;
		} catch (error) {
			logger.error('CredentialManager', 'Failed to save config credentials', String(error));
			return false;
		}
	}

	/**
	 * Load configuration-specific credentials
	 */
	loadConfigCredentials(): PermanentCredentials {
		try {
			const stored = localStorage.getItem(this.CONFIG_CREDENTIALS_KEY);

			if (stored) {
				const credentials = JSON.parse(stored);

				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					redirectUri: credentials.redirectUri || `${window.location.origin}/authz-callback`,
					scopes: credentials.scopes || ['openid'],
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
				};

				return result;
			} else {
				return {
					environmentId: '',
					clientId: '',
					redirectUri: `${window.location.origin}/authz-callback`,
					scopes: ['openid'],
				};
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load config credentials:', error);
			logger.error('CredentialManager', 'Failed to load config credentials', String(error));
			return {
				environmentId: '',
				clientId: '',
				redirectUri: `${window.location.origin}/authz-callback`,
				scopes: ['openid'],
			};
		}
	}

	/**
	 * Save authorization flow-specific credentials (from Authorization Code flows)
	 * These are separate from configuration credentials
	 */
	saveAuthzFlowCredentials(credentials: Partial<PermanentCredentials>): boolean {
		try {
			const existing = this.loadAuthzFlowCredentials();
			const updated = {
				...existing,
				...credentials,
				lastUpdated: Date.now(),
			};

			console.log(' [CredentialManager] Saving authz flow credentials to localStorage:', {
				key: this.AUTHZ_FLOW_CREDENTIALS_KEY,
				data: updated,
			});

			localStorage.setItem(this.AUTHZ_FLOW_CREDENTIALS_KEY, JSON.stringify(updated));

			// Invalidate cache after saving
			this.invalidateCache();

			// Verify it was saved
			const saved = localStorage.getItem(this.AUTHZ_FLOW_CREDENTIALS_KEY);
			console.log(' [CredentialManager] Verified authz flow credentials save:', saved);

			logger.success('CredentialManager', 'Saved authz flow credentials', {
				hasEnvironmentId: !!updated.environmentId,
				hasClientId: !!updated.clientId,
				hasRedirectUri: !!updated.redirectUri,
			});

			// Dispatch event to notify other components
			window.dispatchEvent(
				new CustomEvent('authz-credentials-changed', {
					detail: { credentials: updated },
				})
			);

			return true;
		} catch (error) {
			logger.error('CredentialManager', 'Failed to save authz flow credentials', String(error));
			return false;
		}
	}

	/**
	 * Check if global config is enabled for credentials
	 */
	private isGlobalConfigEnabled(): boolean {
		try {
			const configData = localStorage.getItem('pingone_config');
			if (configData) {
				const config = JSON.parse(configData);
				return config.useGlobalConfig === true;
			}
		} catch (error) {
			console.log(' [CredentialManager] Could not check global config setting:', error);
		}
		return false;
	}

	/**
	 * Load authorization flow-specific credentials
	 * If global config is enabled, returns Dashboard config credentials instead
	 */
	loadAuthzFlowCredentials(): PermanentCredentials {
		try {
			// Check if global config is enabled - if so, use Dashboard credentials but with correct redirect URI
			if (this.isGlobalConfigEnabled()) {
				console.log(
					' [CredentialManager] Global config enabled - using Dashboard credentials for all flows'
				);
				const configCredentials = this.loadConfigCredentials();
				// Override redirect URI to use flow-specific default for authorization flows
				return {
					...configCredentials,
					redirectUri: configCredentials.redirectUri || getCallbackUrlForFlow('authorization-code'),
				};
			}

			const stored = localStorage.getItem(this.AUTHZ_FLOW_CREDENTIALS_KEY);

			if (stored) {
				const credentials = JSON.parse(stored);

				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					clientSecret: credentials.clientSecret || '',
					redirectUri: credentials.redirectUri || getCallbackUrlForFlow('authorization-code'),
					scopes: credentials.scopes || ['openid', 'profile', 'email'],
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
					loginHint: credentials.loginHint,
				};

				return result;
			} else {
				return {
					environmentId: '',
					clientId: '',
					clientSecret: '',
					redirectUri: getCallbackUrlForFlow('authorization-code'),
					scopes: ['openid', 'profile', 'email'],
					loginHint: '',
				};
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load authz flow credentials:', error);
			logger.error('CredentialManager', 'Failed to load authz flow credentials', String(error));
			return {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: getCallbackUrlForFlow('authorization-code'),
				scopes: ['openid', 'profile', 'email'],
				loginHint: '',
			};
		}
	}

	/**
	 * Save implicit flow-specific credentials (from Implicit flow)
	 * These are separate from configuration and authz flow credentials
	 */
	saveImplicitFlowCredentials(credentials: Partial<PermanentCredentials>): boolean {
		try {
			const existing = this.loadImplicitFlowCredentials();
			const updated = {
				...existing,
				...credentials,
				lastUpdated: Date.now(),
			};

			console.log(' [CredentialManager] Saving implicit flow credentials to localStorage:', {
				key: this.IMPLICIT_FLOW_CREDENTIALS_KEY,
				data: updated,
			});

			localStorage.setItem(this.IMPLICIT_FLOW_CREDENTIALS_KEY, JSON.stringify(updated));
			this.invalidateCache();

			// Dispatch event to notify components of credential change
			window.dispatchEvent(
				new CustomEvent('implicit-flow-credentials-changed', {
					detail: { credentials: updated },
				})
			);

			console.log(
				' [CredentialManager] Successfully saved implicit flow credentials to localStorage'
			);
			return true;
		} catch (error) {
			console.error(
				' [CredentialManager] Error saving implicit flow credentials to localStorage:',
				error
			);
			return false;
		}
	}

	/**
	 * Load implicit flow-specific credentials
	 */
	loadImplicitFlowCredentials(): PermanentCredentials {
		try {
			const stored = localStorage.getItem(this.IMPLICIT_FLOW_CREDENTIALS_KEY);

			if (stored) {
				const credentials = JSON.parse(stored);

				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					clientSecret: credentials.clientSecret || '',
					redirectUri: credentials.redirectUri !== undefined ? credentials.redirectUri : getCallbackUrlForFlow('oidc-implicit-v3'),
					scopes: credentials.scopes || ['openid', 'profile', 'email'],
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
				};

				console.log('📥 [CredentialManager] Loaded implicit flow credentials:', {
					hasRedirectUri: !!credentials.redirectUri,
					redirectUri: credentials.redirectUri,
					fullResult: result
				});

				return result;
			} else {
				return {
					environmentId: '',
					clientId: '',
					clientSecret: '',
					redirectUri: getCallbackUrlForFlow('oidc-implicit-v3'),
					scopes: ['openid', 'profile', 'email'],
				};
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load implicit flow credentials:', error);
			logger.error('CredentialManager', 'Failed to load implicit flow credentials', String(error));
			return {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: getCallbackUrlForFlow('oidc-implicit-v3'),
				scopes: ['openid', 'profile', 'email'],
			};
		}
	}

	/**
	 * Save hybrid flow-specific credentials
	 */
	saveHybridFlowCredentials(credentials: Partial<PermanentCredentials>): boolean {
		try {
			const existing = this.loadHybridFlowCredentials();
			const updated = {
				...existing,
				...credentials,
				lastUpdated: Date.now(),
			};

			localStorage.setItem(this.HYBRID_FLOW_CREDENTIALS_KEY, JSON.stringify(updated));
			this.invalidateCache();

			window.dispatchEvent(
				new CustomEvent('hybrid-flow-credentials-changed', {
					detail: { credentials: updated },
				})
			);

			return true;
		} catch (error) {
			console.error(' [CredentialManager] Error saving hybrid flow credentials:', error);
			return false;
		}
	}

	/**
	 * Load hybrid flow-specific credentials
	 */
	loadHybridFlowCredentials(): PermanentCredentials {
		try {
			const stored = localStorage.getItem(this.HYBRID_FLOW_CREDENTIALS_KEY);

			if (stored) {
				const credentials = JSON.parse(stored);

				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					clientSecret: credentials.clientSecret || '',
					redirectUri: credentials.redirectUri || getCallbackUrlForFlow('oidc-hybrid-v3'),
					scopes: credentials.scopes || ['openid', 'profile', 'email'],
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
				};

				return result;
			} else {
				return {
					environmentId: '',
					clientId: '',
					clientSecret: '',
					redirectUri: getCallbackUrlForFlow('oidc-hybrid-v3'),
					scopes: ['openid', 'profile', 'email'],
				};
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load hybrid flow credentials:', error);
			return {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: getCallbackUrlForFlow('oidc-hybrid-v3'),
				scopes: ['openid', 'profile', 'email'],
			};
		}
	}

	/**
	 * Save worker flow-specific credentials
	 */
	saveWorkerFlowCredentials(credentials: Partial<PermanentCredentials>): boolean {
		try {
			const existing = this.loadWorkerFlowCredentials();
			const updated = {
				...existing,
				...credentials,
				lastUpdated: Date.now(),
			};

			localStorage.setItem(this.WORKER_FLOW_CREDENTIALS_KEY, JSON.stringify(updated));
			this.invalidateCache();

			window.dispatchEvent(
				new CustomEvent('worker-flow-credentials-changed', {
					detail: { credentials: updated },
				})
			);

			return true;
		} catch (error) {
			console.error(' [CredentialManager] Error saving worker flow credentials:', error);
			return false;
		}
	}

	/**
	 * Load worker flow-specific credentials
	 */
	loadWorkerFlowCredentials(): PermanentCredentials {
		try {
			const stored = localStorage.getItem(this.WORKER_FLOW_CREDENTIALS_KEY);

			if (stored) {
				const credentials = JSON.parse(stored);

				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					clientSecret: credentials.clientSecret || '',
					redirectUri: credentials.redirectUri || getCallbackUrlForFlow('authorization-code'),
					scopes: credentials.scopes || ['openid', 'profile', 'email'],
					loginHint: credentials.loginHint || '',
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
					useJwksEndpoint: credentials.useJwksEndpoint,
				};

				return result;
			} else {
				return {
					environmentId: '',
					clientId: '',
					clientSecret: '',
					redirectUri: getCallbackUrlForFlow('authorization-code'),
					scopes: ['openid', 'profile', 'email'],
					loginHint: '',
					tokenAuthMethod: 'client_secret_post',
					useJwksEndpoint: true,
				};
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load worker flow credentials:', error);
			return {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: '',
				scopes: ['openid'],
				loginHint: '',
				tokenAuthMethod: 'client_secret_post',
				useJwksEndpoint: true,
			};
		}
	}

	/**
	 * Save device flow-specific credentials
	 */
	saveDeviceFlowCredentials(credentials: Partial<PermanentCredentials>): boolean {
		try {
			const existing = this.loadDeviceFlowCredentials();
			const updated = {
				...existing,
				...credentials,
				lastUpdated: Date.now(),
			};

			localStorage.setItem(this.DEVICE_FLOW_CREDENTIALS_KEY, JSON.stringify(updated));
			this.invalidateCache();

			window.dispatchEvent(
				new CustomEvent('device-flow-credentials-changed', {
					detail: { credentials: updated },
				})
			);

			return true;
		} catch (error) {
			console.error(' [CredentialManager] Error saving device flow credentials:', error);
			return false;
		}
	}

	/**
	 * Load device flow-specific credentials
	 */
	loadDeviceFlowCredentials(): PermanentCredentials {
		try {
			const stored = localStorage.getItem(this.DEVICE_FLOW_CREDENTIALS_KEY);

			if (stored) {
				const credentials = JSON.parse(stored);

				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					clientSecret: credentials.clientSecret || '',
					redirectUri: credentials.redirectUri || getCallbackUrlForFlow('oidc-device-code-v3'),
					scopes: credentials.scopes || ['openid', 'profile', 'email'],
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
				};

				return result;
			} else {
				return {
					environmentId: '',
					clientId: '',
					clientSecret: '',
					redirectUri: '',
					scopes: ['openid'],
					tokenAuthMethod: 'client_secret_post',
					useJwksEndpoint: true,
				};
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load device flow credentials:', error);
			return {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: '',
				scopes: ['openid'],
				tokenAuthMethod: 'client_secret_post',
				useJwksEndpoint: true,
			};
		}
	}

	/**
	 * Generic method to load flow-specific credentials by flow type
	 */
	loadFlowCredentials(flowType: string): PermanentCredentials {
		switch (flowType.toLowerCase()) {
			case 'authorization-code':
			case 'authz':
			case 'oauth-authorization-code-v3':
			case 'oidc-authorization-code-v3':
			case 'enhanced-authorization-code-v3':
			case 'unified-authorization-code-v3':
				return this.loadAuthzFlowCredentials();
			case 'implicit':
			case 'implicit-grant':
			case 'oidc-implicit-v3':
			case 'oauth2-implicit-v3':
				return this.loadImplicitFlowCredentials();
			case 'hybrid':
			case 'oidc-hybrid-v3':
				return this.loadHybridFlowCredentials();
			case 'worker-token':
			case 'worker':
			case 'worker-token-v3':
				return this.loadWorkerFlowCredentials();
			case 'device-code':
			case 'device':
			case 'oidc-device-code-v3':
				return this.loadDeviceFlowCredentials();
			default:
				return this.loadConfigCredentials();
		}
	}

	/**
	 * Generic method to save flow-specific credentials by flow type
	 */
	saveFlowCredentials(
		flowType: string,
		credentials: Partial<PermanentCredentials> & {
			clientAuthMethod?: string;
			privateKey?: string;
			useJwksEndpoint?: boolean;
		}
	): boolean {
		switch (flowType.toLowerCase()) {
			case 'authorization-code':
			case 'authz':
			case 'oauth-authorization-code-v3':
			case 'oidc-authorization-code-v3':
			case 'enhanced-authorization-code-v3':
			case 'unified-authorization-code-v3':
				return this.saveAuthzFlowCredentials(credentials);
			case 'implicit':
			case 'implicit-grant':
			case 'oidc-implicit-v3':
			case 'oauth2-implicit-v3':
				return this.saveImplicitFlowCredentials(credentials);
			case 'hybrid':
			case 'oidc-hybrid-v3':
				return this.saveHybridFlowCredentials(credentials);
			case 'worker-token':
			case 'worker':
			case 'worker-token-v3':
			case 'worker-token-v5':
				return this.saveWorkerFlowCredentials(credentials);
			case 'device-code':
			case 'device':
			case 'oidc-device-code-v3':
				return this.saveDeviceFlowCredentials(credentials);
			default:
				return this.saveConfigCredentials(credentials);
		}
	}

	/**
	 * Save permanent credentials (Environment ID, Client ID, etc.)
	 * These persist across browser refreshes and sessions
	 * @deprecated Use saveConfigCredentials or saveAuthzFlowCredentials instead
	 */
	savePermanentCredentials(credentials: Partial<PermanentCredentials>): boolean {
		try {
			const existing = this.loadPermanentCredentials();
			const updated = {
				...existing,
				...credentials,
				lastUpdated: Date.now(),
			};

			console.log(' [CredentialManager] Saving to localStorage:', {
				key: this.PERMANENT_CREDENTIALS_KEY,
				data: updated,
			});

			localStorage.setItem(this.PERMANENT_CREDENTIALS_KEY, JSON.stringify(updated));

			// Invalidate cache after saving
			this.invalidateCache();

			// Verify it was saved
			const saved = localStorage.getItem(this.PERMANENT_CREDENTIALS_KEY);
			console.log(' [CredentialManager] Verified save:', saved);

			logger.success('CredentialManager', 'Saved permanent credentials', {
				hasEnvironmentId: !!updated.environmentId,
				hasClientId: !!updated.clientId,
				hasRedirectUri: !!updated.redirectUri,
			});

			// Dispatch event to notify other components
			window.dispatchEvent(
				new CustomEvent('permanent-credentials-changed', {
					detail: { credentials: updated },
				})
			);

			return true;
		} catch (error) {
			logger.error('CredentialManager', 'Failed to save permanent credentials', String(error));
			return false;
		}
	}

	/**
	 * Load permanent credentials from localStorage, with fallback to environment variables
	 */
	loadPermanentCredentials(): PermanentCredentials {
		try {
			const stored = localStorage.getItem(this.PERMANENT_CREDENTIALS_KEY);
			console.log(' [CredentialManager] Loading from localStorage:', {
				key: this.PERMANENT_CREDENTIALS_KEY,
				stored: stored,
				allKeys: Object.keys(localStorage).filter((key) => key.includes('pingone')),
			});

			if (stored) {
				// Load from localStorage if available
				const credentials = JSON.parse(stored);
				console.log(' [CredentialManager] Loaded from localStorage:', credentials);

				// Ensure required fields have defaults
				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					redirectUri: credentials.redirectUri || `${window.location.origin}/authz-callback`,
					scopes: credentials.scopes || ['openid', 'profile', 'email'],
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
				};

				console.log(' [CredentialManager] Returning credentials:', result);
				return result;
			} else {
				// No localStorage found, return empty credentials
				// The async loading will be handled by loadPermanentCredentialsAsync
				console.log(' [CredentialManager] No stored credentials found');
				return {
					environmentId: '',
					clientId: '',
					redirectUri: `${window.location.origin}/authz-callback`,
					scopes: ['openid', 'profile', 'email'],
				};
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load permanent credentials:', error);
			logger.error('CredentialManager', 'Failed to load permanent credentials', String(error));
			return {
				environmentId: '',
				clientId: '',
				redirectUri: `${window.location.origin}/authz-callback`,
				scopes: ['openid', 'profile', 'email'],
			};
		}
	}

	/**
	 * Load permanent credentials asynchronously, with fallback to environment variables
	 */
	async loadPermanentCredentialsAsync(): Promise<PermanentCredentials> {
		try {
			const stored = localStorage.getItem(this.PERMANENT_CREDENTIALS_KEY);
			console.log(' [CredentialManager] Loading from localStorage (async):', {
				key: this.PERMANENT_CREDENTIALS_KEY,
				stored: stored,
				allKeys: Object.keys(localStorage).filter((key) => key.includes('pingone')),
			});

			if (stored) {
				// Load from localStorage if available
				const credentials = JSON.parse(stored);
				console.log(' [CredentialManager] Loaded from localStorage:', credentials);

				// Ensure required fields have defaults
				const result = {
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					redirectUri: credentials.redirectUri || `${window.location.origin}/authz-callback`,
					scopes: credentials.scopes || ['openid', 'profile', 'email'],
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
					endSessionEndpoint: credentials.endSessionEndpoint,
					tokenAuthMethod: credentials.tokenAuthMethod,
				};

				console.log(' [CredentialManager] Returning credentials:', result);
				return result;
			} else {
				// Fallback to environment variables
				console.log(
					' [CredentialManager] No localStorage found, checking environment variables...'
				);
				const credentials = await this.loadFromEnvironmentVariables();

				if (credentials.environmentId && credentials.clientId) {
					console.log(' [CredentialManager] Loaded from environment variables:', credentials);
					// Auto-save to localStorage for future use
					this.savePermanentCredentials(credentials);
				} else {
					console.log(' [CredentialManager] No credentials found in localStorage or environment');
				}

				return credentials;
			}
		} catch (error) {
			console.error(' [CredentialManager] Failed to load permanent credentials:', error);
			logger.error('CredentialManager', 'Failed to load permanent credentials', String(error));

			// Final fallback to environment variables
			return await this.loadFromEnvironmentVariables();
		}
	}

	/**
	 * Load credentials from environment variables via API endpoint
	 */
	private async loadFromEnvironmentVariables(): Promise<PermanentCredentials> {
		try {
			console.log(' [CredentialManager] Fetching environment config from server...');

			const response = await fetch('/api/env-config');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const envConfig = await response.json();
			console.log(' [CredentialManager] Loaded from environment config:', envConfig);

			return {
				environmentId: envConfig.environmentId || '',
				clientId: envConfig.clientId || '',
				redirectUri: envConfig.redirectUri || `${window.location.origin}/authz-callback`,
				scopes: envConfig.scopes || ['openid', 'profile', 'email'],
				authEndpoint: envConfig.authEndpoint,
				tokenEndpoint: envConfig.tokenEndpoint,
				userInfoEndpoint: envConfig.userInfoEndpoint,
				endSessionEndpoint: envConfig.endSessionEndpoint,
			};
		} catch (error) {
			console.error(' [CredentialManager] Failed to load from environment variables:', error);
			return {
				environmentId: '',
				clientId: '',
				redirectUri: `${window.location.origin}/authz-callback`,
				scopes: ['openid', 'profile', 'email'],
			};
		}
	}

	/**
	 * Save session credentials (Client Secret)
	 * These are NOT persisted across browser refreshes for security
	 */
	saveSessionCredentials(credentials: Partial<SessionCredentials>): boolean {
		try {
			const existing = this.loadSessionCredentials();
			const updated = {
				...existing,
				...credentials,
			};

			sessionStorage.setItem(this.SESSION_CREDENTIALS_KEY, JSON.stringify(updated));

			// Invalidate cache after saving
			this.invalidateCache();

			logger.success('CredentialManager', 'Saved session credentials', {
				hasClientSecret: !!updated.clientSecret,
			});

			return true;
		} catch (error) {
			logger.error('CredentialManager', 'Failed to save session credentials', String(error));
			return false;
		}
	}

	/**
	 * Load session credentials
	 */
	loadSessionCredentials(): SessionCredentials {
		try {
			const stored = sessionStorage.getItem(this.SESSION_CREDENTIALS_KEY);
			if (!stored) {
				return {
					clientSecret: '',
				};
			}

			return JSON.parse(stored);
		} catch (error) {
			logger.error('CredentialManager', 'Failed to load session credentials', String(error));
			return {
				clientSecret: '',
			};
		}
	}

	/**
	 * Get all credentials (permanent + session)
	 */
	getAllCredentials(): AllCredentials {
		// Check cache first
		const now = Date.now();
		if (
			this.cache.all &&
			this.cache.timestamp &&
			now - this.cache.timestamp < this.CACHE_DURATION
		) {
			console.log(' [CredentialManager] getAllCredentials - using cache');
			return this.cache.all;
		}

		const permanent = this.loadPermanentCredentials();
		const session = this.loadSessionCredentials();

		console.log(' [CredentialManager] getAllCredentials - permanent:', permanent);
		console.log(' [CredentialManager] getAllCredentials - session:', session);

		const result = {
			...permanent,
			...session,
		};

		// Update cache
		this.cache.all = result;
		this.cache.timestamp = now;

		console.log(' [CredentialManager] getAllCredentials - result:', result);
		return result;
	}

	/**
	 * Get all credentials asynchronously (permanent + session)
	 */
	async getAllCredentialsAsync(): Promise<AllCredentials> {
		const permanent = await this.loadPermanentCredentialsAsync();
		const session = this.loadSessionCredentials();

		console.log(' [CredentialManager] getAllCredentialsAsync - permanent:', permanent);
		console.log(' [CredentialManager] getAllCredentialsAsync - session:', session);

		const result = {
			...permanent,
			...session,
		};

		console.log(' [CredentialManager] getAllCredentialsAsync - result:', result);
		return result;
	}

	/**
	 * Save all credentials (permanent + session)
	 */
	saveAllCredentials(credentials: Partial<AllCredentials>): boolean {
		const permanentSuccess = this.savePermanentCredentials({
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			redirectUri: credentials.redirectUri,
			scopes: credentials.scopes,
			authEndpoint: credentials.authEndpoint,
			tokenEndpoint: credentials.tokenEndpoint,
			userInfoEndpoint: credentials.userInfoEndpoint,
			endSessionEndpoint: credentials.endSessionEndpoint,
			tokenAuthMethod: credentials.tokenAuthMethod,
		});

		const sessionSuccess = this.saveSessionCredentials({
			clientSecret: credentials.clientSecret,
		});

		return permanentSuccess && sessionSuccess;
	}

	/**
	 * Clear session credentials (Client Secret)
	 * This should be called on logout or when security is needed
	 */
	clearSessionCredentials(): boolean {
		try {
			sessionStorage.removeItem(this.SESSION_CREDENTIALS_KEY);
			logger.info('CredentialManager', 'Cleared session credentials');
			return true;
		} catch (error) {
			logger.error('CredentialManager', 'Failed to clear session credentials', String(error));
			return false;
		}
	}

	/**
	 * Clear all credentials (permanent + session)
	 */
	clearAllCredentials(): boolean {
		try {
			localStorage.removeItem(this.PERMANENT_CREDENTIALS_KEY);
			sessionStorage.removeItem(this.SESSION_CREDENTIALS_KEY);
			logger.info('CredentialManager', 'Cleared all credentials');
			return true;
		} catch (error) {
			logger.error('CredentialManager', 'Failed to clear all credentials', String(error));
			return false;
		}
	}

	/**
	 * Check if permanent credentials are complete
	 */
	arePermanentCredentialsComplete(): boolean {
		const credentials = this.loadPermanentCredentials();
		return !!(credentials.environmentId && credentials.clientId);
	}

	/**
	 * Check if all credentials are complete
	 */
	areAllCredentialsComplete(): boolean {
		const credentials = this.getAllCredentials();
		return !!(credentials.environmentId && credentials.clientId && credentials.clientSecret);
	}

	/**
	 * Get credentials status
	 */
	getCredentialsStatus(): {
		permanent: 'complete' | 'partial' | 'missing';
		session: 'complete' | 'missing';
		overall: 'complete' | 'partial' | 'missing';
	} {
		const permanent = this.loadPermanentCredentials();
		const session = this.loadSessionCredentials();

		const permanentStatus =
			permanent.environmentId && permanent.clientId
				? 'complete'
				: permanent.environmentId || permanent.clientId
					? 'partial'
					: 'missing';

		const sessionStatus = session.clientSecret ? 'complete' : 'missing';

		const overallStatus =
			permanentStatus === 'complete' && sessionStatus === 'complete'
				? 'complete'
				: permanentStatus === 'complete' || permanentStatus === 'partial'
					? 'partial'
					: 'missing';

		return {
			permanent: permanentStatus,
			session: sessionStatus,
			overall: overallStatus,
		};
	}

	/**
	 * Save discovery preferences (Environment ID and Region)
	 */
	saveDiscoveryPreferences(preferences: Partial<DiscoveryPreferences>): boolean {
		try {
			const existing = this.loadDiscoveryPreferences();
			const updated: DiscoveryPreferences = {
				environmentId: preferences.environmentId || existing.environmentId || '',
				region: preferences.region || existing.region || 'us',
				lastUpdated: Date.now(),
			};

			localStorage.setItem(this.DISCOVERY_PREFERENCES_KEY, JSON.stringify(updated));
			logger.info(
				'Discovery preferences saved',
				`environmentId: ${updated.environmentId}, region: ${updated.region}`
			);
			return true;
		} catch (error) {
			logger.error('Failed to save discovery preferences', String(error));
			return false;
		}
	}

	/**
	 * Load discovery preferences
	 */
	loadDiscoveryPreferences(): DiscoveryPreferences {
		try {
			const stored = localStorage.getItem(this.DISCOVERY_PREFERENCES_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				return {
					environmentId: parsed.environmentId || '',
					region: parsed.region || 'us',
					lastUpdated: parsed.lastUpdated || 0,
				};
			}
		} catch (error) {
			logger.error('Failed to load discovery preferences', String(error));
		}

		return {
			environmentId: '',
			region: 'us',
			lastUpdated: 0,
		};
	}

	/**
	 * Debug method to check localStorage contents
	 */
	debugLocalStorage(): void {
		console.log(' [CredentialManager] Debug localStorage contents:');
		console.log(' [CredentialManager] All localStorage keys:', Object.keys(localStorage));
		console.log(
			' [CredentialManager] pingone_permanent_credentials:',
			localStorage.getItem('pingone_permanent_credentials')
		);
		console.log(
			' [CredentialManager] pingone_session_credentials:',
			localStorage.getItem('pingone_session_credentials')
		);
		console.log(
			' [CredentialManager] pingone_config_credentials:',
			localStorage.getItem('pingone_config_credentials')
		);
		console.log(
			' [CredentialManager] pingone_authz_flow_credentials:',
			localStorage.getItem('pingone_authz_flow_credentials')
		);
		console.log(' [CredentialManager] pingone_config:', localStorage.getItem('pingone_config'));
		console.log(
			' [CredentialManager] login_credentials:',
			localStorage.getItem('login_credentials')
		);
	}

	/**
	 * Discover OIDC endpoints from issuer URL and update credentials
	 */
	async discoverAndUpdateCredentials(
		issuerUrl: string,
		clientId: string,
		clientSecret?: string,
		redirectUri?: string
	): Promise<{
		success: boolean;
		credentials?: PermanentCredentials;
		error?: string;
	}> {
		try {
			logger.info('Starting OIDC discovery for issuer:', issuerUrl);

			const discoveryResult = await oidcDiscoveryService.discover({ issuerUrl });

			if (!discoveryResult.success || !discoveryResult.document) {
				return {
					success: false,
					error: discoveryResult.error || 'Discovery failed',
				};
			}

			// Convert discovery document to credentials
			const credentials = oidcDiscoveryService.documentToCredentials(
				discoveryResult.document,
				clientId,
				clientSecret,
				redirectUri
			);

			// Create PermanentCredentials object
			const permanentCredentials: PermanentCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri || getCallbackUrlForFlow('authorization-code'),
				scopes: credentials.supportedScopes.includes('openid')
					? ['openid', 'profile', 'email']
					: ['read', 'write'],
				authEndpoint: credentials.authorizationEndpoint,
				tokenEndpoint: credentials.tokenEndpoint,
				userInfoEndpoint: credentials.userInfoEndpoint,
				endSessionEndpoint: credentials.endSessionEndpoint,
				tokenAuthMethod: 'client_secret_post',
				useJwksEndpoint: true,
				loginHint: '',
				issuerUrl: credentials.issuerUrl,
				discoveredEndpoints: discoveryResult.document,
				lastDiscoveryTime: Date.now(),
			};

			// Save the discovered credentials
			await this.savePermanentCredentials(permanentCredentials);

			logger.info('CredentialManager', 'Successfully discovered and saved OIDC endpoints');
			return {
				success: true,
				credentials: permanentCredentials,
			};
		} catch (error) {
			logger.error('OIDC discovery failed:', String(error));
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Discovery failed',
			};
		}
	}

	/**
	 * Check if discovered endpoints are still valid (not expired)
	 */
	isDiscoveryValid(credentials: PermanentCredentials): boolean {
		if (!credentials.lastDiscoveryTime || !credentials.discoveredEndpoints) {
			return false;
		}

		// Discovery is valid for 24 hours
		const DISCOVERY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
		const now = Date.now();
		return now - credentials.lastDiscoveryTime < DISCOVERY_CACHE_DURATION;
	}

	/**
	 * Refresh discovered endpoints if they're expired
	 */
	async refreshDiscoveryIfNeeded(credentials: PermanentCredentials): Promise<PermanentCredentials> {
		if (!credentials.issuerUrl || this.isDiscoveryValid(credentials)) {
			return credentials;
		}

		logger.info('Discovery expired, refreshing endpoints for:', credentials.issuerUrl);

		const result = await this.discoverAndUpdateCredentials(
			credentials.issuerUrl,
			credentials.clientId,
			credentials.clientSecret,
			credentials.redirectUri
		);

		if (result.success && result.credentials) {
			return result.credentials;
		}

		// If refresh failed, return original credentials
		logger.warn('CredentialManager', 'Failed to refresh discovery, using cached endpoints');
		return credentials;
	}

	/**
	 * Get enhanced credentials with discovery information
	 */
	getEnhancedCredentials(): PermanentCredentials | null {
		const credentials = this.loadPermanentCredentials();
		if (!credentials) {
			return null;
		}

		// If we have discovery information, return it
		if (credentials.issuerUrl && credentials.discoveredEndpoints) {
			return credentials;
		}

		// Otherwise, try to extract from existing endpoints
		if (credentials.authEndpoint) {
			const environmentId = oidcDiscoveryService.extractEnvironmentId(credentials.authEndpoint);
			if (environmentId) {
				return {
					...credentials,
					issuerUrl: `https://auth.pingone.com/${environmentId}`,
					lastDiscoveryTime: Date.now(), // Mark as discovered now
				};
			}
		}

		return credentials;
	}

	/**
	 * Clear the cache to force fresh data loading
	 */
	clearCache(): void {
		this.cache = {};
		console.log(' [CredentialManager] Cache cleared');
	}
}

// Export singleton instance
export const credentialManager = new CredentialManager();
