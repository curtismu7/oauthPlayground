/**
 * @file silentWorkerTokenServiceV8.ts
 * @module v8/services
 * @description Silent Worker Token Service - Unified silent token retrieval for all V8 components
 * @version 8.0.0
 * @since 2025-01-25
 *
 * This service provides a unified interface for silent worker token retrieval
 * that can be used across all components that have "Get Worker Token" buttons.
 */

import { MFAConfigurationServiceV8 } from './mfaConfigurationServiceV8';
import { workerTokenServiceV8 } from './workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from './workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🤫 SILENT-WORKER-TOKEN-SERVICE-V8]';

export interface SilentRetrievalOptions {
	silentApiRetrieval?: boolean;
	showTokenAtEnd?: boolean;
	forceShowModal?: boolean;
	onStatusUpdate?: (status: any) => void;
	onLoadingStart?: () => void;
	onLoadingEnd?: () => void;
}

export interface SilentRetrievalResult {
	success: boolean;
	tokenRetrieved: boolean;
	modalShown: boolean;
	message: string;
	status?: any;
}

/**
 * Silent Worker Token Service
 * Provides unified silent token retrieval functionality
 */
class SilentWorkerTokenServiceV8 {
	private static instance: SilentWorkerTokenServiceV8;

	/**
	 * Get singleton instance
	 */
	static getInstance(): SilentWorkerTokenServiceV8 {
		if (!SilentWorkerTokenServiceV8.instance) {
			SilentWorkerTokenServiceV8.instance = new SilentWorkerTokenServiceV8();
		}
		return SilentWorkerTokenServiceV8.instance;
	}

	/**
	 * Get current silent retrieval configuration
	 */
	getConfiguration(): { silentApiRetrieval: boolean; showTokenAtEnd: boolean } {
		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			return {
				silentApiRetrieval: config.workerToken?.silentApiRetrieval || false,
				showTokenAtEnd: config.workerToken?.showTokenAtEnd || false,
			};
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to load configuration, using defaults`, error);
			return { silentApiRetrieval: false, showTokenAtEnd: false };
		}
	}

	/**
	 * Update silent retrieval configuration
	 */
	updateConfiguration(silentApiRetrieval: boolean, showTokenAtEnd?: boolean): void {
		try {
			const config = MFAConfigurationServiceV8.loadConfiguration();
			config.workerToken.silentApiRetrieval = silentApiRetrieval;
			if (showTokenAtEnd !== undefined) {
				config.workerToken.showTokenAtEnd = showTokenAtEnd;
			}
			MFAConfigurationServiceV8.saveConfiguration(config);
			
			// Dispatch event to notify other components
			window.dispatchEvent(new CustomEvent('mfaConfigurationUpdated', { 
				detail: { workerToken: config.workerToken } 
			}));
			
			console.log(`${MODULE_TAG} Configuration updated:`, { silentApiRetrieval, showTokenAtEnd });
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to update configuration:`, error);
		}
	}

	/**
	 * Attempt silent worker token retrieval
	 * This is the core silent retrieval logic used by all components
	 */
	async attemptSilentRetrieval(options: SilentRetrievalOptions = {}): Promise<SilentRetrievalResult> {
		const {
			silentApiRetrieval: overrideSilent,
			showTokenAtEnd: overrideShowToken,
			forceShowModal = false,
			onStatusUpdate,
			onLoadingStart,
			onLoadingEnd,
		} = options;

		try {
			// Get current configuration
			const config = this.getConfiguration();
			const silentApiRetrieval = overrideSilent !== undefined ? overrideSilent : config.silentApiRetrieval;
			const showTokenAtEnd = overrideShowToken !== undefined ? overrideShowToken : config.showTokenAtEnd;

			console.log(`${MODULE_TAG} Silent retrieval attempt:`, {
				silentApiRetrieval,
				showTokenAtEnd,
				forceShowModal,
				hasOverride: overrideSilent !== undefined || overrideShowToken !== undefined,
			});

			// Check if silent retrieval is disabled
			if (!silentApiRetrieval && !forceShowModal) {
				return {
					success: false,
					tokenRetrieved: false,
					modalShown: false,
					message: 'Silent retrieval is disabled',
				};
			}

			// Check current token status
			const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			if (currentStatus.isValid) {
				// Token is already valid
				if (showTokenAtEnd && !silentApiRetrieval) {
					// Show modal to display token
					return {
						success: true,
						tokenRetrieved: true,
						modalShown: true,
						message: 'Token already valid, showing modal',
						status: currentStatus,
					};
				}

				return {
					success: true,
					tokenRetrieved: true,
					modalShown: false,
					message: 'Token already valid',
					status: currentStatus,
				};
			}

			// Load credentials
			const credentials = await workerTokenServiceV8.loadCredentials();
			if (!credentials) {
				if (forceShowModal) {
					// Show modal to configure credentials
					return {
						success: false,
						tokenRetrieved: false,
						modalShown: true,
						message: 'No credentials - showing configuration modal',
					};
				}

				return {
					success: false,
					tokenRetrieved: false,
					modalShown: false,
					message: 'No credentials stored',
				};
			}

			// Start loading
			onLoadingStart?.();

			// Attempt to fetch token silently
			try {
				const region = credentials.region || 'us';
				const apiBase = region === 'eu' ? 'https://auth.pingone.eu' :
					region === 'ap' ? 'https://auth.pingone.asia' :
					region === 'ca' ? 'https://auth.pingone.ca' :
					'https://auth.pingone.com';

				const proxyEndpoint = '/api/pingone/token';
				const defaultScopes = ['mfa:device:manage', 'mfa:device:read'];
				const scopeList = credentials.scopes;
				const normalizedScopes: string[] = Array.isArray(scopeList) && scopeList.length > 0 ? scopeList : defaultScopes;

				const requestBody = new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret || '',
					scope: normalizedScopes.join(' '),
				});

				console.log(`${MODULE_TAG} Making silent API call to ${apiBase}`);

				const response = await fetch(`${apiBase}${proxyEndpoint}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: requestBody.toString(),
				});

				if (!response.ok) {
					throw new Error(`API call failed: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();
				const token = data.access_token;
				const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;

				// Save token
				await workerTokenServiceV8.saveToken(token, expiresAt);

				// Update status
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				onStatusUpdate?.(newStatus);

				// Determine if modal should be shown
				const showModal = showTokenAtEnd && !forceShowModal;

				console.log(`${MODULE_TAG} ✅ Silent retrieval successful`, {
					hasToken: !!token,
					showModal,
					showTokenAtEnd,
					forceShowModal,
				});

				return {
					success: true,
					tokenRetrieved: true,
					modalShown: showModal,
					message: showModal ? 'Token retrieved, showing modal' : 'Token retrieved silently',
					status: newStatus,
				};

			} catch (apiError) {
				console.error(`${MODULE_TAG} ❌ Silent API call failed:`, apiError);

				if (forceShowModal) {
					// Show modal for manual configuration
					return {
						success: false,
						tokenRetrieved: false,
						modalShown: true,
						message: 'API call failed - showing modal for manual configuration',
					};
				}

				// Show helpful toast
				toastV8.warning('Silent token retrieval failed. Please check your credentials or try manual retrieval.');

				return {
					success: false,
					tokenRetrieved: false,
					modalShown: false,
					message: 'API call failed',
				};

			} finally {
				onLoadingEnd?.();
			}

		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Silent retrieval failed:`, error);
			onLoadingEnd?.();

			return {
				success: false,
				tokenRetrieved: false,
				modalShown: false,
				message: 'Silent retrieval failed',
			};
		}
	}

	/**
	 * Quick check if silent retrieval is available
	 */
	async isSilentRetrievalAvailable(): Promise<boolean> {
		const config = this.getConfiguration();
		if (!config.silentApiRetrieval) {
			return false;
		}

		const credentials = await workerTokenServiceV8.loadCredentials();
		return !!credentials;
	}

	/**
	 * Get status of silent retrieval
	 */
	getStatus(): {
		enabled: boolean;
		hasCredentials: boolean;
		hasValidToken: boolean;
		canRetrieveSilently: boolean;
	} {
		const config = this.getConfiguration();
		const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
		
		return {
			enabled: config.silentApiRetrieval,
			hasCredentials: false, // Would need async check
			hasValidToken: currentStatus.isValid,
			canRetrieveSilently: config.silentApiRetrieval && currentStatus.isValid,
		};
	}
}

// Export singleton instance
export const silentWorkerTokenServiceV8 = SilentWorkerTokenServiceV8.getInstance();

// Export class for testing or multiple instances
export { SilentWorkerTokenServiceV8 };
