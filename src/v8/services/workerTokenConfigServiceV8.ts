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
			const mfaSilentApi = mfaConfig.workerToken?.silentApiRetrieval ?? false;
			const mfaShowToken = mfaConfig.workerToken?.showTokenAtEnd ?? false;

			this.config = {
				silentApiRetrieval: mfaSilentApi,
				showTokenAtEnd: mfaShowToken,
			};

			// Validate configuration consistency
			this.validateConfigurationConsistency(mfaConfig);

			console.log(`${MODULE_TAG} Initialized with MFA config:`, this.config);
			this.isInitialized = true;
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to initialize config, using defaults:`, error);
			this.config = {
				silentApiRetrieval: true, // Match MFAConfigurationServiceV8 default
				showTokenAtEnd: true, // Match MFAConfigurationServiceV8 default
			};
			this.isInitialized = true;

			// Log configuration source for debugging
			console.log(`${MODULE_TAG} Initialized with fallback defaults:`, this.config);
		}
	}

	/**
	 * Validate configuration consistency and log any discrepancies
	 */
	private validateConfigurationConsistency(mfaConfig: {
		workerToken?: { silentApiRetrieval?: boolean; showTokenAtEnd?: boolean };
	}): void {
		const mfaSilentApi = mfaConfig.workerToken?.silentApiRetrieval ?? false;
		const mfaShowToken = mfaConfig.workerToken?.showTokenAtEnd ?? false;

		// Check if MFA config has different values than our defaults
		const defaultSilentApi = true;
		const defaultShowToken = true;

		if (mfaSilentApi !== defaultSilentApi) {
			console.log(`${MODULE_TAG} ⚠️ MFA silentApiRetrieval differs from default:`, {
				mfaValue: mfaSilentApi,
				defaultValue: defaultSilentApi,
				source: 'MFAConfigurationServiceV8',
			});
		}

		if (mfaShowToken !== defaultShowToken) {
			console.log(`${MODULE_TAG} ⚠️ MFA showTokenAtEnd differs from default:`, {
				mfaValue: mfaShowToken,
				defaultValue: defaultShowToken,
				source: 'MFAConfigurationServiceV8',
			});
		}

		// Log final configuration source
		if (this.config) {
			console.log(`${MODULE_TAG} ✅ Configuration validated:`, {
				silentApiRetrieval: this.config.silentApiRetrieval,
				showTokenAtEnd: this.config.showTokenAtEnd,
				source: 'MFAConfigurationServiceV8',
			});
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
				const silentApiChanged =
					customEvent.detail.workerToken.silentApiRetrieval !== undefined &&
					customEvent.detail.workerToken.silentApiRetrieval !== this.config.silentApiRetrieval;
				const showTokenChanged =
					customEvent.detail.workerToken.showTokenAtEnd !== undefined &&
					customEvent.detail.workerToken.showTokenAtEnd !== this.config.showTokenAtEnd;

				if (silentApiChanged) {
					this.config.silentApiRetrieval =
						customEvent.detail.workerToken.silentApiRetrieval ?? false;
					console.log(
						`${MODULE_TAG} 🔄 Silent API retrieval updated:`,
						this.config.silentApiRetrieval
					);
				}

				if (showTokenChanged) {
					this.config.showTokenAtEnd = customEvent.detail.workerToken.showTokenAtEnd ?? false;
					console.log(`${MODULE_TAG} 🔄 Show token at end updated:`, this.config.showTokenAtEnd);
				}

				// Only notify if config actually changed
				if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
					console.log(`${MODULE_TAG} Config updated from MFA service:`, this.config);
					this.notifyListeners();
					this.broadcastConfigUpdate();
					this.syncBackToMFAService(); // Sync back to maintain consistency
				}
			}
		}
	}

	/**
	 * Sync configuration back to MFA service to maintain consistency
	 */
	private syncBackToMFAService(): void {
		try {
			if (!this.config) return;

			const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();

			// Update MFA config with our values to ensure consistency
			const needsUpdate =
				mfaConfig.workerToken?.silentApiRetrieval !== this.config.silentApiRetrieval ||
				mfaConfig.workerToken?.showTokenAtEnd !== this.config.showTokenAtEnd;

			if (needsUpdate) {
				mfaConfig.workerToken = {
					...mfaConfig.workerToken,
					silentApiRetrieval: this.config.silentApiRetrieval,
					showTokenAtEnd: this.config.showTokenAtEnd,
				};

				MFAConfigurationServiceV8.saveConfiguration(mfaConfig);
				console.log(`${MODULE_TAG} 🔄 Synced back to MFA service:`, this.config);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to sync back to MFA service:`, error);
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

		this.listeners.forEach((listener) => {
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
