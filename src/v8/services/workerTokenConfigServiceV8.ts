/**
 * @file workerTokenConfigServiceV8.ts
 * @module v8/services
 * @description Centralized service for managing worker token configuration state
 * @version 8.2.0
 * @since 2026-02-01
 *
 * Purpose: Single source of truth for worker token configuration (silentApiRetrieval, showTokenAtEnd)
 * Eliminates code duplication and ensures consistent behavior across the entire application
 */

import { MFAConfigurationServiceV8 } from './mfaConfigurationServiceV8';

const MODULE_TAG = '[⚙️ WORKER-TOKEN-CONFIG-V8]';

export interface WorkerTokenConfig {
	silentApiRetrieval: boolean;
	showTokenAtEnd: boolean;
}

type ConfigUpdateListener = (config: WorkerTokenConfig) => void;

/**
 * Centralized worker token configuration service
 * Provides single source of truth for configuration and broadcasts updates to all listeners
 */
class WorkerTokenConfigService {
	private config: WorkerTokenConfig | null = null;
	private listeners: Set<ConfigUpdateListener> = new Set();
	private isInitialized = false;

	constructor() {
		// Listen for MFA configuration updates
		if (typeof window !== 'undefined') {
			window.addEventListener('mfaConfigurationUpdated', this.handleMFAConfigUpdate.bind(this));
		}
	}

	/**
	 * Initialize the service by loading configuration from MFAConfigurationServiceV8
	 */
	private initialize(): void {
		if (this.isInitialized) return;

		try {
			const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
			this.config = {
				silentApiRetrieval: mfaConfig.workerToken?.silentApiRetrieval ?? false,
				showTokenAtEnd: mfaConfig.workerToken?.showTokenAtEnd ?? false,
			};
			console.log(`${MODULE_TAG} Initialized with config:`, this.config);
			this.isInitialized = true;
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to initialize config, using defaults:`, error);
			this.config = {
				silentApiRetrieval: false,
				showTokenAtEnd: false,
			};
			this.isInitialized = true;
		}
	}

	/**
	 * Handle MFA configuration update events
	 */
	private handleMFAConfigUpdate(event: Event): void {
		const customEvent = event as CustomEvent<{
			workerToken?: { silentApiRetrieval?: boolean; showTokenAtEnd?: boolean };
		}>;

		if (customEvent.detail?.workerToken) {
			const oldConfig = this.config ? { ...this.config } : null;
			
			// Update config with new values
			if (!this.config) {
				this.initialize();
			}

			if (this.config) {
				if (customEvent.detail.workerToken.silentApiRetrieval !== undefined) {
					this.config.silentApiRetrieval = customEvent.detail.workerToken.silentApiRetrieval;
				}
				if (customEvent.detail.workerToken.showTokenAtEnd !== undefined) {
					this.config.showTokenAtEnd = customEvent.detail.workerToken.showTokenAtEnd;
				}

				// Only notify if config actually changed
				if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
					console.log(`${MODULE_TAG} Config updated:`, this.config);
					this.notifyListeners();
					this.broadcastConfigUpdate();
				}
			}
		}
	}

	/**
	 * Get current configuration synchronously
	 */
	getConfigSync(): WorkerTokenConfig {
		if (!this.isInitialized) {
			this.initialize();
		}
		return { ...this.config! };
	}

	/**
	 * Get silentApiRetrieval setting
	 */
	getSilentApiRetrieval(): boolean {
		return this.getConfigSync().silentApiRetrieval;
	}

	/**
	 * Get showTokenAtEnd setting
	 */
	getShowTokenAtEnd(): boolean {
		return this.getConfigSync().showTokenAtEnd;
	}

	/**
	 * Update silentApiRetrieval setting
	 */
	setSilentApiRetrieval(value: boolean): void {
		try {
			const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
			mfaConfig.workerToken.silentApiRetrieval = value;
			MFAConfigurationServiceV8.saveConfiguration(mfaConfig);

			// Update local config
			if (!this.config) {
				this.initialize();
			}
			if (this.config) {
				this.config.silentApiRetrieval = value;
				this.notifyListeners();
				this.broadcastConfigUpdate();
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to update silentApiRetrieval:`, error);
		}
	}

	/**
	 * Update showTokenAtEnd setting
	 */
	setShowTokenAtEnd(value: boolean): void {
		try {
			const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
			mfaConfig.workerToken.showTokenAtEnd = value;
			MFAConfigurationServiceV8.saveConfiguration(mfaConfig);

			// Update local config
			if (!this.config) {
				this.initialize();
			}
			if (this.config) {
				this.config.showTokenAtEnd = value;
				this.notifyListeners();
				this.broadcastConfigUpdate();
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to update showTokenAtEnd:`, error);
		}
	}

	/**
	 * Subscribe to configuration changes
	 */
	subscribe(listener: ConfigUpdateListener): () => void {
		this.listeners.add(listener);
		
		// Immediately provide current config to new listener
		if (this.config) {
			listener(this.config);
		}

		// Return unsubscribe function
		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * Notify all listeners of configuration change
	 */
	private notifyListeners(): void {
		if (!this.config) return;

		this.listeners.forEach(listener => {
			try {
				listener(this.config!);
			} catch (error) {
				console.error(`${MODULE_TAG} Error notifying listener:`, error);
			}
		});
	}

	/**
	 * Broadcast configuration update via custom event
	 */
	private broadcastConfigUpdate(): void {
		if (!this.config) return;

		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('workerTokenConfigUpdated', {
					detail: { ...this.config },
				})
			);
		}
	}
}

// Export singleton instance
export const WorkerTokenConfigServiceV8 = new WorkerTokenConfigService();
