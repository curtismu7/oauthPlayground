// src/utils/persistentCredentials.ts
import { logger } from './logger';

export interface FlowCredentials {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes?: string[];
	authEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	tokenAuthMethod?: 'client_secret_basic' | 'client_secret_post' | 'private_key_jwt';
	clientAssertion?: string;
	advanced?: Record<string, any>;
	lastUsed?: number;
	flowType?: string;
}

export interface FlowState {
	currentStepIndex?: number;
	stepResults?: Record<string, any>;
	stepErrors?: Record<string, string>;
	stepHistory?: Array<{
		stepId: string;
		timestamp: number;
		result?: any;
		error?: string;
		duration: number;
	}>;
	lastUpdated?: number;
	flowType?: string;
}

class PersistentCredentialsManager {
	private readonly CREDENTIALS_PREFIX = 'flow_credentials_';
	private readonly STATE_PREFIX = 'flow_state_';
	private readonly GLOBAL_CREDENTIALS_KEY = 'global_oauth_credentials';
	private readonly MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

	/**
	 * Save credentials for a specific flow type
	 */
	saveFlowCredentials(flowType: string, credentials: FlowCredentials): boolean {
		try {
			const credentialsWithMeta = {
				...credentials,
				lastUsed: Date.now(),
				flowType,
			};

			const key = `${this.CREDENTIALS_PREFIX}${flowType}`;
			localStorage.setItem(key, JSON.stringify(credentialsWithMeta));

			// Also save as global credentials if they're complete
			if (this.areCredentialsComplete(credentials)) {
				this.saveGlobalCredentials(credentials);
			}

			logger.success('PersistentCredentials', `Saved credentials for ${flowType}`, {
				hasClientId: !!credentials.clientId,
				hasEnvironmentId: !!credentials.environmentId,
				hasClientSecret: !!credentials.clientSecret,
			});

			return true;
		} catch (error) {
			logger.error('PersistentCredentials', `Failed to save credentials for ${flowType}`, error);
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
			console.log('🔧 [PersistentCredentials] Could not check global config setting:', error);
		}
		return false;
	}

	/**
	 * Load credentials for a specific flow type
	 * If global config is enabled, always returns global credentials
	 */
	loadFlowCredentials(flowType: string): FlowCredentials | null {
		try {
			// Check if global config is enabled - if so, always use global credentials
			if (this.isGlobalConfigEnabled()) {
				console.log(
					'🌐 [PersistentCredentials] Global config enabled - using global credentials for all flows'
				);
				return this.loadGlobalCredentials();
			}

			const key = `${this.CREDENTIALS_PREFIX}${flowType}`;
			const stored = localStorage.getItem(key);

			if (!stored) {
				// Fallback to global credentials
				return this.loadGlobalCredentials();
			}

			const credentials = JSON.parse(stored) as FlowCredentials;

			// Check if credentials are too old
			if (credentials.lastUsed && Date.now() - credentials.lastUsed > this.MAX_AGE) {
				logger.warn('PersistentCredentials', `Credentials for ${flowType} are expired`, {
					lastUsed: new Date(credentials.lastUsed).toISOString(),
				});
				this.removeFlowCredentials(flowType);
				return null;
			}

			logger.info('PersistentCredentials', `Loaded credentials for ${flowType}`, {
				hasClientId: !!credentials.clientId,
				hasEnvironmentId: !!credentials.environmentId,
				lastUsed: credentials.lastUsed ? new Date(credentials.lastUsed).toISOString() : 'unknown',
			});

			return credentials;
		} catch (error) {
			logger.error('PersistentCredentials', `Failed to load credentials for ${flowType}`, error);
			return null;
		}
	}

	/**
	 * Save global credentials (used across all flows)
	 */
	saveGlobalCredentials(credentials: FlowCredentials): boolean {
		try {
			const credentialsWithMeta = {
				...credentials,
				lastUsed: Date.now(),
			};

			localStorage.setItem(this.GLOBAL_CREDENTIALS_KEY, JSON.stringify(credentialsWithMeta));

			// Also save to pingone_config for compatibility
			const configToSave = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: Array.isArray(credentials.scopes)
					? credentials.scopes.join(' ')
					: credentials.scopes,
				authEndpoint: credentials.authEndpoint,
				tokenEndpoint: credentials.tokenEndpoint,
				userInfoEndpoint: credentials.userInfoEndpoint,
				tokenAuthMethod: credentials.tokenAuthMethod,
				clientAssertion: credentials.clientAssertion,
				advanced: credentials.advanced,
			};
			localStorage.setItem('pingone_config', JSON.stringify(configToSave));

			// Dispatch event to notify other components
			window.dispatchEvent(
				new CustomEvent('pingone_config_changed', {
					detail: { config: configToSave },
				})
			);

			logger.success('PersistentCredentials', 'Saved global credentials');
			return true;
		} catch (error) {
			logger.error('PersistentCredentials', 'Failed to save global credentials', error);
			return false;
		}
	}

	/**
	 * Load global credentials
	 */
	loadGlobalCredentials(): FlowCredentials | null {
		try {
			// Try global credentials first
			let stored = localStorage.getItem(this.GLOBAL_CREDENTIALS_KEY);

			if (!stored) {
				// Fallback to pingone_config
				stored = localStorage.getItem('pingone_config');
				if (!stored) {
					// Fallback to login_credentials
					stored = localStorage.getItem('login_credentials');
				}
			}

			if (!stored) {
				return null;
			}

			const credentials = JSON.parse(stored) as FlowCredentials;

			// Normalize scopes
			if (typeof credentials.scopes === 'string') {
				credentials.scopes = credentials.scopes.split(' ').filter(Boolean);
			}

			logger.info('PersistentCredentials', 'Loaded global credentials', {
				hasClientId: !!credentials.clientId,
				hasEnvironmentId: !!credentials.environmentId,
			});

			return credentials;
		} catch (error) {
			logger.error('PersistentCredentials', 'Failed to load global credentials', error);
			return null;
		}
	}

	/**
	 * Save flow state (step progress, results, etc.)
	 */
	saveFlowState(flowType: string, state: FlowState): boolean {
		try {
			const stateWithMeta = {
				...state,
				lastUpdated: Date.now(),
				flowType,
			};

			const key = `${this.STATE_PREFIX}${flowType}`;
			localStorage.setItem(key, JSON.stringify(stateWithMeta));

			logger.debug('PersistentCredentials', `Saved state for ${flowType}`, {
				currentStep: state.currentStepIndex,
				hasResults: !!state.stepResults && Object.keys(state.stepResults).length > 0,
			});

			return true;
		} catch (error) {
			logger.error('PersistentCredentials', `Failed to save state for ${flowType}`, error);
			return false;
		}
	}

	/**
	 * Load flow state
	 */
	loadFlowState(flowType: string): FlowState | null {
		try {
			const key = `${this.STATE_PREFIX}${flowType}`;
			const stored = localStorage.getItem(key);

			if (!stored) {
				return null;
			}

			const state = JSON.parse(stored) as FlowState;

			// Check if state is too old (1 day)
			const maxStateAge = 24 * 60 * 60 * 1000;
			if (state.lastUpdated && Date.now() - state.lastUpdated > maxStateAge) {
				logger.warn('PersistentCredentials', `State for ${flowType} is expired`);
				this.removeFlowState(flowType);
				return null;
			}

			logger.info('PersistentCredentials', `Loaded state for ${flowType}`, {
				currentStep: state.currentStepIndex,
				hasResults: !!state.stepResults && Object.keys(state.stepResults).length > 0,
			});

			return state;
		} catch (error) {
			logger.error('PersistentCredentials', `Failed to load state for ${flowType}`, error);
			return null;
		}
	}

	/**
	 * Remove credentials for a specific flow
	 */
	removeFlowCredentials(flowType: string): void {
		try {
			const key = `${this.CREDENTIALS_PREFIX}${flowType}`;
			localStorage.removeItem(key);
			logger.info('PersistentCredentials', `Removed credentials for ${flowType}`);
		} catch (error) {
			logger.error('PersistentCredentials', `Failed to remove credentials for ${flowType}`, error);
		}
	}

	/**
	 * Remove state for a specific flow
	 */
	removeFlowState(flowType: string): void {
		try {
			const key = `${this.STATE_PREFIX}${flowType}`;
			localStorage.removeItem(key);
			logger.info('PersistentCredentials', `Removed state for ${flowType}`);
		} catch (error) {
			logger.error('PersistentCredentials', `Failed to remove state for ${flowType}`, error);
		}
	}

	/**
	 * Clear all stored credentials and state
	 */
	clearAll(): void {
		try {
			const keys = Object.keys(localStorage);
			const keysToRemove = keys.filter(
				(key) =>
					key.startsWith(this.CREDENTIALS_PREFIX) ||
					key.startsWith(this.STATE_PREFIX) ||
					key === this.GLOBAL_CREDENTIALS_KEY ||
					key === 'pingone_config' ||
					key === 'login_credentials'
			);

			keysToRemove.forEach((key) => localStorage.removeItem(key));

			logger.info('PersistentCredentials', 'Cleared all credentials and state', {
				removedKeys: keysToRemove.length,
			});
		} catch (error) {
			logger.error('PersistentCredentials', 'Failed to clear all credentials', error);
		}
	}

	/**
	 * Get all stored flow types
	 */
	getStoredFlowTypes(): string[] {
		try {
			const keys = Object.keys(localStorage);
			const flowTypes = keys
				.filter((key) => key.startsWith(this.CREDENTIALS_PREFIX))
				.map((key) => key.replace(this.CREDENTIALS_PREFIX, ''));

			return flowTypes;
		} catch (error) {
			logger.error('PersistentCredentials', 'Failed to get stored flow types', error);
			return [];
		}
	}

	/**
	 * Check if credentials are complete enough to use
	 */
	private areCredentialsComplete(credentials: FlowCredentials): boolean {
		return !!(
			credentials.clientId &&
			credentials.environmentId &&
			(credentials.clientSecret || credentials.tokenAuthMethod === 'private_key_jwt')
		);
	}

	/**
	 * Get credentials summary for debugging
	 */
	getCredentialsSummary(): Record<string, any> {
		try {
			const flowTypes = this.getStoredFlowTypes();
			const summary: Record<string, any> = {
				globalCredentials: !!localStorage.getItem(this.GLOBAL_CREDENTIALS_KEY),
				pingoneConfig: !!localStorage.getItem('pingone_config'),
				loginCredentials: !!localStorage.getItem('login_credentials'),
				flowCredentials: {},
			};

			flowTypes.forEach((flowType) => {
				const credentials = this.loadFlowCredentials(flowType);
				summary.flowCredentials[flowType] = {
					exists: !!credentials,
					complete: credentials ? this.areCredentialsComplete(credentials) : false,
					lastUsed: credentials?.lastUsed ? new Date(credentials.lastUsed).toISOString() : null,
				};
			});

			return summary;
		} catch (error) {
			logger.error('PersistentCredentials', 'Failed to get credentials summary', error);
			return {};
		}
	}
}

// Export singleton instance
export const persistentCredentials = new PersistentCredentialsManager();

// Export utility functions
export const saveFlowCredentials = (flowType: string, credentials: FlowCredentials) =>
	persistentCredentials.saveFlowCredentials(flowType, credentials);

export const loadFlowCredentials = (flowType: string) =>
	persistentCredentials.loadFlowCredentials(flowType);

export const saveFlowState = (flowType: string, state: FlowState) =>
	persistentCredentials.saveFlowState(flowType, state);

export const loadFlowState = (flowType: string) => persistentCredentials.loadFlowState(flowType);

export const clearAllCredentials = () => persistentCredentials.clearAll();
