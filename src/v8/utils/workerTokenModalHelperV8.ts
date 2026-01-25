/**
 * @file workerTokenModalHelperV8.ts
 * @module v8/utils
 * @description Helper function to handle worker token modal display with silent API retrieval support
 * @version 8.0.0
 * @since 2025-01-XX
 */

import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8, type TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-MODAL-HELPER-V8]';

/**
 * Attempts to silently retrieve worker token if silentApiRetrieval is enabled
 * Returns true if token was successfully retrieved, false otherwise
 */
async function attemptSilentTokenRetrieval(silentApiRetrievalOverride?: boolean): Promise<boolean> {
	try {
		// #region agent log
		// #endregion
		const config = MFAConfigurationServiceV8.loadConfiguration();
		const silentApiRetrieval = silentApiRetrievalOverride !== undefined ? silentApiRetrievalOverride : config.workerToken.silentApiRetrieval;
		// #region agent log
		// #endregion

		if (!silentApiRetrieval) {
			// #region agent log
			// #endregion
			return false; // Silent retrieval disabled
		}

		console.log(`${MODULE_TAG} Silent API retrieval enabled, attempting to fetch token automatically...`);
		// #region agent log - Check all localStorage keys before loading
		const allKeys = Object.keys(localStorage).filter(k => k.toLowerCase().includes('worker') || k.toLowerCase().includes('token'));
		// #endregion

		const credentials = await workerTokenServiceV8.loadCredentials();
		// #region agent log
		// #endregion
		if (!credentials) {
			console.warn(`${MODULE_TAG} No stored credentials for silent API retrieval - user needs to configure credentials first`);
			// #region agent log
			// #endregion
			// Show a helpful toast when silent retrieval fails due to missing credentials
			// This helps users understand why silent retrieval isn't working
			toastV8.warning('Silent API retrieval requires saved credentials. Click "Get Worker Token" to configure.');
			return false;
		}

		// Try to automatically fetch token using stored credentials
		const region = credentials.region || 'us';
		const apiBase =
			region === 'eu'
				? 'https://auth.pingone.eu'
				: region === 'ap'
					? 'https://auth.pingone.asia'
					: region === 'ca'
						? 'https://auth.pingone.ca'
						: 'https://auth.pingone.com';

		const proxyEndpoint = '/api/pingone/token';
		const defaultScopes = ['mfa:device:manage', 'mfa:device:read'];
		const scopeList = credentials.scopes;
		const normalizedScopes: string[] =
			Array.isArray(scopeList) && scopeList.length > 0 ? scopeList : defaultScopes;

		const params = new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: credentials.clientId,
			scope: normalizedScopes.join(' '),
		});

		const authMethod = credentials.tokenEndpointAuthMethod || 'client_secret_post';
		if (authMethod === 'client_secret_post') {
			params.set('client_secret', credentials.clientSecret);
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		const requestBody: Record<string, unknown> = {
			environment_id: credentials.environmentId,
			region,
			body: params.toString(),
			auth_method: authMethod,
		};

		if (authMethod === 'client_secret_basic') {
			const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
			requestBody.headers = { Authorization: `Basic ${basicAuth}` };
		}

		// #region agent log
		// #endregion
		const response = await fetch(proxyEndpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify(requestBody),
		});
		// #region agent log
		// #endregion

		if (response.ok) {
			const data = (await response.json()) as {
				access_token: string;
				expires_in?: number;
			};

			if (data.access_token) {
				const expiresIn = data.expires_in || 3600; // Default to 1 hour
				const expiresAt = Date.now() + expiresIn * 1000;

				await workerTokenServiceV8.saveToken(data.access_token, expiresAt);

				console.log(`${MODULE_TAG} Token automatically fetched and saved via silent API retrieval`);
				window.dispatchEvent(new Event('workerTokenUpdated'));
				toastV8.success('Worker token automatically retrieved!');
				return true; // Success
			}
		}

		// Silent retrieval failed
		console.warn(`${MODULE_TAG} Silent API retrieval failed (status: ${response.status})`);
		// #region agent log
		// #endregion
		return false;
	} catch (error) {
		console.error(`${MODULE_TAG} Silent API retrieval error:`, error);
		// #region agent log
		// #endregion
		return false;
	}
}

/**
 * Checks if we should show the modal to display the token
 * Returns true if showTokenAtEnd is enabled, false otherwise
 */
function shouldShowTokenModal(): boolean {
	try {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken.showTokenAtEnd;
	} catch (error) {
		console.error(`${MODULE_TAG} Error checking showTokenAtEnd config:`, error);
		return false;
	}
}

/**
 * Handles showing worker token modal with silent API retrieval support
 * Checks if silentApiRetrieval is enabled and attempts to fetch token silently first
 * Only shows modal if silent retrieval fails or is disabled
 * Respects showTokenAtEnd setting to display token without modal
 * 
 * IMPORTANT: When user explicitly clicks "Get Worker Token" button, always show modal
 * to allow credential configuration, even if silentApiRetrieval is ON.
 *
 * @param setShowModal - Function to set modal visibility
 * @param setTokenStatus - Optional function to update token status after retrieval
 * @param overrideSilentApiRetrieval - Optional override for silentApiRetrieval (takes precedence over config)
 * @param overrideShowTokenAtEnd - Optional override for showTokenAtEnd (takes precedence over config)
 * @param forceShowModal - If true, always show modal (user explicitly clicked button)
 * @returns Promise that resolves when modal handling is complete
 */
export async function handleShowWorkerTokenModal(
	setShowModal: (show: boolean) => void,
	setTokenStatus?: (status: TokenStatusInfo) => void | Promise<void>,
	overrideSilentApiRetrieval?: boolean,
	overrideShowTokenAtEnd?: boolean,
	forceShowModal: boolean = false // Default to false for automatic calls
): Promise<void> {
	// #region agent log
	// #endregion
	const config = MFAConfigurationServiceV8.loadConfiguration();
	// Use override values if provided (Hub page checkboxes take precedence), otherwise use config
	const silentApiRetrieval = overrideSilentApiRetrieval !== undefined ? overrideSilentApiRetrieval : config.workerToken.silentApiRetrieval;
	const showTokenAtEnd = overrideShowTokenAtEnd !== undefined ? overrideShowTokenAtEnd : config.workerToken.showTokenAtEnd;
	
	// DEBUG: Log all values for debugging
	console.log(`${MODULE_TAG} DEBUG - handleShowWorkerTokenModal called with:`, {
		overrideSilentApiRetrieval,
		overrideShowTokenAtEnd,
		forceShowModal,
		configSilentApiRetrieval: config.workerToken.silentApiRetrieval,
		configShowTokenAtEnd: config.workerToken.showTokenAtEnd,
		finalSilentApiRetrieval: silentApiRetrieval,
		finalShowTokenAtEnd: showTokenAtEnd,
		finalForceShowModal: forceShowModal,
	});
	
	console.log(`${MODULE_TAG} 🎯 SILENT MODE DEBUG: silentApiRetrieval=${silentApiRetrieval}, forceShowModal=${forceShowModal}, showTokenAtEnd=${showTokenAtEnd}`);
	
	// Log which values are being used (for debugging)
	if (overrideSilentApiRetrieval !== undefined || overrideShowTokenAtEnd !== undefined) {
		console.log(`${MODULE_TAG} Using Hub page checkbox values (override):`, {
			silentApiRetrieval: {
				override: overrideSilentApiRetrieval,
				config: config.workerToken.silentApiRetrieval,
				using: silentApiRetrieval,
			},
			showTokenAtEnd: {
				override: overrideShowTokenAtEnd,
				config: config.workerToken.showTokenAtEnd,
				using: showTokenAtEnd,
			},
		});
	}

	// Check current token status
	const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();

	// If token is already valid
	if (currentStatus.isValid) {
		// Only show modal if BOTH silentApiRetrieval is OFF AND showTokenAtEnd is ON
		// If silentApiRetrieval is ON, we should be truly silent (no modals)
		if (!silentApiRetrieval && showTokenAtEnd) {
			console.log(`${MODULE_TAG} Token is valid, showing modal (silentApiRetrieval is OFF, showTokenAtEnd is ON)`);
			setShowModal(true);
			return;
		}

		// Silent mode or showTokenAtEnd is OFF - don't show modal
		console.log(`${MODULE_TAG} Token is valid, not showing modal (silentApiRetrieval: ${silentApiRetrieval}, showTokenAtEnd: ${showTokenAtEnd})`);
		return;
	}

	// Token is missing or expired
	// If silentApiRetrieval is ON, attempt silent retrieval
	if (silentApiRetrieval) {
		console.log(`${MODULE_TAG} 🤫 Silent API retrieval is enabled, attempting to fetch token silently...`);
		console.log(`${MODULE_TAG} 🎯 DEBUG: forceShowModal=${forceShowModal}, showTokenAtEnd=${showTokenAtEnd}`);
		// #region agent log
		// #endregion
		const silentRetrievalSucceeded = await attemptSilentTokenRetrieval(silentApiRetrieval);
		console.log(`${MODULE_TAG} 🎯 DEBUG: Silent retrieval result=${silentRetrievalSucceeded}`);
		// #region agent log
		// #endregion

		if (silentRetrievalSucceeded) {
			console.log(`${MODULE_TAG} ✅ Silent retrieval succeeded!`);
			// Token was successfully retrieved silently
			if (setTokenStatus) {
				const newStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				await setTokenStatus(newStatus);
			}

			// Only show modal if showTokenAtEnd is also ON (to display the token)
			// AND user didn't explicitly click button (forceShowModal would be false for automatic calls)
			if (showTokenAtEnd && !forceShowModal) {
				console.log(`${MODULE_TAG} 🎯 DEBUG: Showing modal because showTokenAtEnd=true and forceShowModal=false`);
				console.log(`${MODULE_TAG} Silent retrieval succeeded, showing token display modal (showTokenAtEnd is ON)`);
				setShowModal(true);
			} else {
				console.log(`${MODULE_TAG} 🎯 DEBUG: NOT showing modal - showTokenAtEnd=${showTokenAtEnd}, forceShowModal=${forceShowModal}`);
				console.log(`${MODULE_TAG} Silent retrieval succeeded, not showing modal (showTokenAtEnd: ${showTokenAtEnd}, forceShowModal: ${forceShowModal})`);
			}
			return;
		}

		console.log(`${MODULE_TAG} ❌ Silent retrieval failed!`);
		// Silent retrieval failed
		// If user explicitly clicked button (forceShowModal), show modal to allow credential configuration
		// If credentials are missing, show modal to allow configuration (even in silent mode)
		// Otherwise, respect silentApiRetrieval setting and don't show modal
		if (forceShowModal) {
			console.log(`${MODULE_TAG} 🎯 DEBUG: Showing modal because forceShowModal=true (user clicked button)`);
			console.log(`${MODULE_TAG} Silent retrieval failed, but user clicked button - showing modal for credential configuration`);
			setShowModal(true);
			return;
		}
		
		// Check if failure was due to missing credentials
		const credentialsCheck = await workerTokenServiceV8.loadCredentials();
		if (!credentialsCheck) {
			console.log(`${MODULE_TAG} 🎯 DEBUG: Showing modal because credentials are missing`);
			// Credentials are missing - show modal to allow configuration
			// This is helpful even in silent mode, as user needs to configure credentials first
			console.log(`${MODULE_TAG} Silent retrieval failed due to missing credentials - showing modal for configuration`);
			setShowModal(true);
			return;
		}
		
		// Silent retrieval failed for other reasons - but since silentApiRetrieval is ON and not forced, don't show modal
		console.log(`${MODULE_TAG} 🎯 DEBUG: NOT showing modal - silentApiRetrieval=true and not forced`);
		console.log(`${MODULE_TAG} Silent retrieval failed, but silentApiRetrieval is ON - not showing modal (truly silent)`);
		return;
	}

	// silentApiRetrieval is OFF - show modal if showTokenAtEnd is ON OR if user explicitly clicked button
	if (forceShowModal || showTokenAtEnd) {
		console.log(`${MODULE_TAG} Showing modal (forceShowModal: ${forceShowModal}, showTokenAtEnd: ${showTokenAtEnd})`);
		setShowModal(true);
	} else {
		console.log(`${MODULE_TAG} Silent API retrieval is OFF and showTokenAtEnd is OFF - not showing modal`);
	}
}

