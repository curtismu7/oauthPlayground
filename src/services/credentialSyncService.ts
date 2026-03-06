// src/services/credentialSyncService.ts
// Cross-tab credential synchronization service

import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { FlowCredentialService } from './flowCredentialService';

export interface CredentialSyncEvent {
	type: 'credentials-changed' | 'flow-credentials-changed';
	flowKey?: string;
	credentials: any;
	timestamp: number;
}

class CredentialSyncService {
	private listeners: Map<string, Set<(event: CredentialSyncEvent) => void>> = new Map();
	private isInitialized = false;

	/**
	 * Initialize the credential synchronization service
	 */
	initialize(): void {
		if (this.isInitialized) return;

		// Listen for localStorage changes from other tabs
		window.addEventListener('storage', this.handleStorageChange.bind(this));

		// Listen for custom credential change events
		window.addEventListener(
			'config-credentials-changed',
			this.handleConfigCredentialsChanged.bind(this)
		);
		window.addEventListener(
			'permanent-credentials-changed',
			this.handlePermanentCredentialsChanged.bind(this)
		);
		window.addEventListener(
			'authz-credentials-changed',
			this.handleAuthzCredentialsChanged.bind(this)
		);
		window.addEventListener(
			'implicit-flow-credentials-changed',
			this.handleImplicitCredentialsChanged.bind(this)
		);
		window.addEventListener(
			'worker-flow-credentials-changed',
			this.handleWorkerCredentialsChanged.bind(this)
		);
		window.addEventListener(
			'device-flow-credentials-changed',
			this.handleDeviceCredentialsChanged.bind(this)
		);
		window.addEventListener(
			'hybrid-flow-credentials-changed',
			this.handleHybridCredentialsChanged.bind(this)
		);

		this.isInitialized = true;
		logger.info(
			'CredentialSyncService',
			'🔄 [CredentialSyncService] Initialized cross-tab credential synchronization'
		);
	}

	/**
	 * Handle localStorage changes from other tabs
	 */
	private handleStorageChange(event: StorageEvent): void {
		if (!event.key || !event.key.includes('pingone')) return;
		if (!event.newValue) return; // Ignore deletions

		try {
			const credentials = JSON.parse(event.newValue);
			const timestamp = Date.now();

			// Determine the type of credential change based on the key
			let eventType: CredentialSyncEvent['type'] = 'credentials-changed';
			let flowKey: string | undefined;

			if (event.key.includes('_flow_credentials')) {
				eventType = 'flow-credentials-changed';
				// Extract flow key from storage key
				if (event.key.includes('authz_flow_credentials')) flowKey = 'authorization-code';
				else if (event.key.includes('implicit_flow_credentials')) flowKey = 'implicit';
				else if (event.key.includes('worker_flow_credentials')) flowKey = 'worker-token';
				else if (event.key.includes('device_flow_credentials')) flowKey = 'device-authorization';
				else if (event.key.includes('hybrid_flow_credentials')) flowKey = 'hybrid';
			}

			const syncEvent: CredentialSyncEvent = {
				type: eventType,
				flowKey,
				credentials,
				timestamp,
			};

			logger.info(
				'CredentialSyncService',
				'🔄 [CredentialSyncService] Detected credential change from other tab:',
				{
					arg0: {
						key: event.key,
						eventType,
						flowKey,
						hasCredentials: !!(credentials.environmentId || credentials.clientId),
					},
				}
			);

			// Notify all listeners
			this.notifyListeners(syncEvent);
		} catch (error) {
			logger.error(
				'CredentialSyncService',
				'❌ [CredentialSyncService] Failed to parse credential change event:',
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Handle config credentials changes
	 */
	private handleConfigCredentialsChanged(event: CustomEvent): void {
		// ✅ ADD NULL CHECKING
		if (!event.detail || !event.detail.credentials) {
			logger.warn(
				'CredentialSyncService',
				'[CredentialSyncService] handleConfigCredentialsChanged: event.detail or credentials is null'
			);
			return;
		}

		this.notifyListeners({
			type: 'credentials-changed',
			credentials: event.detail.credentials,
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle permanent credentials changes
	 */
	private handlePermanentCredentialsChanged(event: CustomEvent): void {
		// ✅ ADD NULL CHECKING
		if (!event.detail || !event.detail.credentials) {
			logger.warn(
				'CredentialSyncService',
				'[CredentialSyncService] handlePermanentCredentialsChanged: event.detail or credentials is null'
			);
			return;
		}

		this.notifyListeners({
			type: 'credentials-changed',
			credentials: event.detail.credentials,
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle authorization flow credentials changes
	 */
	private handleAuthzCredentialsChanged(event: CustomEvent): void {
		// ✅ ADD NULL CHECKING
		if (!event.detail || !event.detail.credentials) {
			logger.warn(
				'CredentialSyncService',
				'[CredentialSyncService] handleAuthzCredentialsChanged: event.detail or credentials is null'
			);
			return;
		}

		this.notifyListeners({
			type: 'flow-credentials-changed',
			flowKey: 'authorization-code',
			credentials: event.detail.credentials,
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle implicit flow credentials changes
	 */
	private handleImplicitCredentialsChanged(event: CustomEvent): void {
		// ✅ ADD NULL CHECKING
		if (!event.detail || !event.detail.credentials) {
			logger.warn(
				'CredentialSyncService',
				'[CredentialSyncService] handleImplicitCredentialsChanged: event.detail or credentials is null'
			);
			return;
		}

		this.notifyListeners({
			type: 'flow-credentials-changed',
			flowKey: 'implicit',
			credentials: event.detail.credentials,
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle worker flow credentials changes
	 */
	private handleWorkerCredentialsChanged(event: CustomEvent): void {
		// ✅ ADD NULL CHECKING
		if (!event.detail || !event.detail.credentials) {
			logger.warn(
				'CredentialSyncService',
				'[CredentialSyncService] handleWorkerCredentialsChanged: event.detail or credentials is null'
			);
			return;
		}

		this.notifyListeners({
			type: 'flow-credentials-changed',
			flowKey: 'worker-token',
			credentials: event.detail.credentials,
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle device flow credentials changes
	 */
	private handleDeviceCredentialsChanged(event: CustomEvent): void {
		// ✅ ADD NULL CHECKING
		if (!event.detail || !event.detail.credentials) {
			logger.warn(
				'CredentialSyncService',
				'[CredentialSyncService] handleDeviceCredentialsChanged: event.detail or credentials is null'
			);
			return;
		}

		this.notifyListeners({
			type: 'flow-credentials-changed',
			flowKey: 'device-authorization',
			credentials: event.detail.credentials,
			timestamp: Date.now(),
		});
	}

	/**
	 * Handle hybrid flow credentials changes
	 */
	private handleHybridCredentialsChanged(event: CustomEvent): void {
		// ✅ ADD NULL CHECKING
		if (!event.detail || !event.detail.credentials) {
			logger.warn(
				'CredentialSyncService',
				'[CredentialSyncService] handleHybridCredentialsChanged: event.detail or credentials is null'
			);
			return;
		}

		this.notifyListeners({
			type: 'flow-credentials-changed',
			flowKey: 'hybrid',
			credentials: event.detail.credentials,
			timestamp: Date.now(),
		});
	}

	/**
	 * Notify all listeners of a credential change
	 */
	private notifyListeners(event: CredentialSyncEvent): void {
		// Notify general credential change listeners
		const generalListeners = this.listeners.get('*');
		if (generalListeners) {
			generalListeners.forEach((listener) => {
				try {
					listener(event);
				} catch (error) {
					logger.error(
						'CredentialSyncService',
						'❌ [CredentialSyncService] Error in credential change listener:',
						undefined,
						error as Error
					);
				}
			});
		}

		// Notify flow-specific listeners
		if (event.flowKey) {
			const flowListeners = this.listeners.get(event.flowKey);
			if (flowListeners) {
				flowListeners.forEach((listener) => {
					try {
						listener(event);
					} catch (error) {
						logger.error(
							'CredentialSyncService',
							'❌ [CredentialSyncService] Error in flow credential change listener:',
							undefined,
							error as Error
						);
					}
				});
			}
		}
	}

	/**
	 * Subscribe to credential changes
	 */
	subscribe(flowKey: string | '*', listener: (event: CredentialSyncEvent) => void): () => void {
		if (!this.listeners.has(flowKey)) {
			this.listeners.set(flowKey, new Set());
		}

		this.listeners.get(flowKey)!.add(listener);

		logger.info(
			'CredentialSyncService',
			`🔄 [CredentialSyncService] Subscribed to credential changes for flow: ${flowKey}`
		);

		// Return unsubscribe function
		return () => {
			const listeners = this.listeners.get(flowKey);
			if (listeners) {
				listeners.delete(listener);
				if (listeners.size === 0) {
					this.listeners.delete(flowKey);
				}
			}
			logger.info(
				'CredentialSyncService',
				`🔄 [CredentialSyncService] Unsubscribed from credential changes for flow: ${flowKey}`
			);
		};
	}

	/**
	 * Force refresh credentials for a specific flow
	 */
	async refreshFlowCredentials(flowKey: string): Promise<any> {
		try {
			logger.info(
				'CredentialSyncService',
				`🔄 [CredentialSyncService] Refreshing credentials for flow: ${flowKey}`
			);

			const { credentials } = await FlowCredentialService.loadFlowCredentials({
				flowKey,
				defaultCredentials: {},
			});

			return credentials;
		} catch (error) {
			logger.error(
				'CredentialSyncService',
				`❌ [CredentialSyncService] Failed to refresh credentials for flow ${flowKey}:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/**
	 * Get current shared credentials
	 */
	getSharedCredentials(): any {
		return credentialManager.getAllCredentials();
	}

	/**
	 * Cleanup the service
	 */
	cleanup(): void {
		window.removeEventListener('storage', this.handleStorageChange.bind(this));
		window.removeEventListener(
			'config-credentials-changed',
			this.handleConfigCredentialsChanged.bind(this)
		);
		window.removeEventListener(
			'permanent-credentials-changed',
			this.handlePermanentCredentialsChanged.bind(this)
		);
		window.removeEventListener(
			'authz-credentials-changed',
			this.handleAuthzCredentialsChanged.bind(this)
		);
		window.removeEventListener(
			'implicit-flow-credentials-changed',
			this.handleImplicitCredentialsChanged.bind(this)
		);
		window.removeEventListener(
			'worker-flow-credentials-changed',
			this.handleWorkerCredentialsChanged.bind(this)
		);
		window.removeEventListener(
			'device-flow-credentials-changed',
			this.handleDeviceCredentialsChanged.bind(this)
		);
		window.removeEventListener(
			'hybrid-flow-credentials-changed',
			this.handleHybridCredentialsChanged.bind(this)
		);

		this.listeners.clear();
		this.isInitialized = false;
		logger.info(
			'CredentialSyncService',
			'🔄 [CredentialSyncService] Cleaned up credential synchronization'
		);
	}
}

// Export singleton instance
export const credentialSyncService = new CredentialSyncService();

export default credentialSyncService;
