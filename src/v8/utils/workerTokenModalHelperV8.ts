/**
 * @file workerTokenModalHelperV8.ts
 * @module v8/utils
 * @description Helper function to handle worker token modal display with silent API retrieval support
 * @version 8.1.0
 * @since 2025-01-XX
 *
 * IMPORTANT: This file delegates to tokenGatewayV8 for all token acquisition.
 * Do NOT add direct token fetch logic here - use tokenGatewayV8 instead.
 */

import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { tokenGatewayV8 } from '@/v8/services/auth/tokenGatewayV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-MODAL-HELPER-V8]';

/**
 * Attempts to silently retrieve worker token if silentApiRetrieval is enabled
 * Returns true if token was successfully retrieved, false otherwise
 *
 * IMPORTANT: This function delegates to tokenGatewayV8 for actual token acquisition.
 * All token fetch logic is centralized in tokenGatewayV8 to prevent regressions.
 */
async function attemptSilentTokenRetrieval(silentApiRetrievalOverride?: boolean): Promise<boolean> {
	try {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		const silentApiRetrieval =
			silentApiRetrievalOverride !== undefined
				? silentApiRetrievalOverride
				: config.workerToken.silentApiRetrieval;

		if (!silentApiRetrieval) {
			console.log(`${MODULE_TAG} Silent retrieval disabled`);
			return false;
		}

		console.log(`${MODULE_TAG} Attempting silent token retrieval via tokenGatewayV8...`);

		// Delegate to canonical token gateway
		const result = await tokenGatewayV8.getWorkerToken({
			mode: 'silent',
			forceRefresh: false,
			timeout: 10000,
			maxRetries: 2,
			debug: true,
		});

		if (result.success) {
			console.log(`${MODULE_TAG} Token automatically fetched via tokenGatewayV8`);
			toastV8.success('Worker token automatically retrieved!');
			return true;
		}

		// Handle specific error cases
		if (result.error) {
			console.log(`${MODULE_TAG} Silent retrieval failed:`, result.error.code, result.error.message);

			if (result.error.code === 'NO_CREDENTIALS') {
				toastV8.warning(
					'Silent API retrieval requires saved credentials. Click "Get Worker Token" to configure.'
				);
			} else if (result.error.code === 'TIMEOUT') {
				toastV8.warning('Token retrieval timed out. Please try again.');
			} else if (result.error.code === 'NETWORK_ERROR') {
				toastV8.warning('Network error during token retrieval. Check your connection.');
			}
			// Other errors are handled silently - user can click button to get details
		}

		return false;
	} catch (error) {
		console.error(`${MODULE_TAG} Unexpected error in silent retrieval:`, error);
		return false;
	}
}

/**
 * Checks if we should show the modal to display the token
 * Returns true if showTokenAtEnd is enabled, false otherwise
 */
function _shouldShowTokenModal(): boolean {
	try {
		const config = MFAConfigurationServiceV8.loadConfiguration();
		return config.workerToken.showTokenAtEnd;
	} catch (_error) {
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
	forceShowModal: boolean = false, // Default to false for automatic calls
	setSilentLoading?: (loading: boolean) => void // New parameter for loading state
): Promise<void> {
	// #region agent log
	// #endregion
	const config = MFAConfigurationServiceV8.loadConfiguration();
	// Use override values if provided (Hub page checkboxes take precedence), otherwise use config
	const silentApiRetrieval =
		overrideSilentApiRetrieval !== undefined
			? overrideSilentApiRetrieval
			: config.workerToken.silentApiRetrieval;
	const showTokenAtEnd =
		overrideShowTokenAtEnd !== undefined
			? overrideShowTokenAtEnd
			: config.workerToken.showTokenAtEnd;

	// Check current token status
	const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();

	// If token is already valid
	if (currentStatus.isValid) {
		// Only show modal if BOTH silentApiRetrieval is OFF AND showTokenAtEnd is ON
		// If silentApiRetrieval is ON, we should be truly silent (no modals)
		if (!silentApiRetrieval && showTokenAtEnd) {
			setShowModal(true);
			return;
		}

		return;
	}

	// Token is missing or expired
	// If silentApiRetrieval is ON, attempt silent retrieval
	if (silentApiRetrieval) {
		// Show loading state during silent retrieval
		if (setSilentLoading) {
			setSilentLoading(true);
		}

		// #region agent log
		// #endregion
		const silentRetrievalSucceeded = await attemptSilentTokenRetrieval(silentApiRetrieval);

		// Hide loading state
		if (setSilentLoading) {
			setSilentLoading(false);
		}
		// #region agent log
		// #endregion

		if (silentRetrievalSucceeded) {
			// Token was successfully retrieved silently
			if (setTokenStatus) {
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
				await setTokenStatus(newStatus);
			}

			// Only show modal if showTokenAtEnd is also ON (to display the token)
			// AND user didn't explicitly click button (forceShowModal would be false for automatic calls)
			if (showTokenAtEnd && !forceShowModal) {
				setShowModal(true);
			} else {
			}
			return;
		}

		// Silent retrieval failed
		// If user explicitly clicked button (forceShowModal), show modal to allow credential configuration
		// If credentials are missing, show modal to allow configuration (even in silent mode)
		// Otherwise, respect silentApiRetrieval setting and don't show modal
		if (forceShowModal) {
			setShowModal(true);
			return;
		}

		// Check if failure was due to missing credentials
		const credentialsCheck = await workerTokenServiceV8.loadCredentials();
		if (!credentialsCheck) {
			setShowModal(true);
			return;
		}

		return;
	}

	// silentApiRetrieval is OFF - show modal if showTokenAtEnd is ON OR if user explicitly clicked button
	if (forceShowModal || showTokenAtEnd) {
		setShowModal(true);
	} else {
	}
}
