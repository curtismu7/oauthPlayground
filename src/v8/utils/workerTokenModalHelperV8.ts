/**
 * @file workerTokenModalHelperV8.ts
 * @module v8/utils
 * @description Helper function to handle worker token modal display with silent API retrieval support
 * @version 8.1.0
 * @since 2025-01-XX
 *
 * IMPORTANT: This file delegates to UniversalSilentApiService for all token acquisition.
 * Do NOT add direct token fetch logic here - use the universal service instead.
 */

import { UniversalSilentApiService } from '@/services/universalSilentApiService';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-MODAL-HELPER-V8]';

/**
 * Handles showing worker token modal with silent API retrieval support
 * Checks if silentApiRetrieval is enabled and attempts to fetch token silently first
 * Only shows modal if silent retrieval fails or is disabled
 * Respects showTokenAtEnd setting to display token without modal
 *
 * IMPORTANT: When user explicitly clicks "Get Worker Token" button, always show modal
 * to allow credential configuration, even if silentApiRetrieval is ON.
 *
 * Now uses UniversalSilentApiService as the default source for configuration.
 * Override parameters are still supported for backward compatibility.
 *
 * @param setShowModal - Function to set modal visibility
 * @param setTokenStatus - Optional function to update token status after retrieval
 * @param overrideSilentApiRetrieval - Optional override for silentApiRetrieval (takes precedence over centralized service)
 * @param overrideShowTokenAtEnd - Optional override for showTokenAtEnd (takes precedence over centralized service)
 * @param forceShowModal - If true, always show modal (user explicitly clicked button)
 * @param setSilentLoading - Optional function to update loading state during silent retrieval
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
	// SIMPLIFIED: Use centralized service with clear priority
	let silentApiRetrieval = false;
	let showTokenAtEnd = false;

	// Priority 1: Explicit overrides (highest priority)
	if (overrideSilentApiRetrieval !== undefined) {
		silentApiRetrieval = overrideSilentApiRetrieval;
		console.log(`${MODULE_TAG} 🎯 Using override silentApiRetrieval:`, silentApiRetrieval);
	} else {
		// Priority 2: Universal service (recommended)
		try {
			const universalService = new UniversalSilentApiService({
				appId: 'v8',
				appName: 'V8 App',
				appVersion: '8.0.0',
				storageKey: 'v8-silent-api-config',
			});
			silentApiRetrieval = universalService.getConfig().silentApiRetrieval;
			console.log(
				`${MODULE_TAG} ✅ Using UniversalSilentApiService silentApiRetrieval:`,
				silentApiRetrieval
			);
		} catch (serviceError) {
			console.warn(
				`${MODULE_TAG} ⚠️ UniversalSilentApiService failed, using fallback:`,
				serviceError
			);
			// Priority 3: Direct MFA service (fallback)
			try {
				const { MFAConfigurationServiceV8 } = await import(
					'@/v8/services/mfaConfigurationServiceV8'
				);
				const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
				silentApiRetrieval = mfaConfig.workerToken?.silentApiRetrieval ?? false;
				console.log(
					`${MODULE_TAG} 🔄 Using MFAConfigurationServiceV8 fallback silentApiRetrieval:`,
					silentApiRetrieval
				);
			} catch (mfaError) {
				console.warn(`${MODULE_TAG} ❌ All services failed, defaulting to false:`, mfaError);
				silentApiRetrieval = false;
			}
		}
	}

	// Priority 1: Explicit overrides (highest priority)
	if (overrideShowTokenAtEnd !== undefined) {
		showTokenAtEnd = overrideShowTokenAtEnd;
		console.log(`${MODULE_TAG} 🎯 Using override showTokenAtEnd:`, showTokenAtEnd);
	} else {
		// Priority 2: Universal service (recommended)
		try {
			const universalService = new UniversalSilentApiService({
				appId: 'v8',
				appName: 'V8 App',
				appVersion: '8.0.0',
				storageKey: 'v8-silent-api-config',
			});
			showTokenAtEnd = universalService.getConfig().showTokenAtEnd;
			console.log(
				`${MODULE_TAG} ✅ Using UniversalSilentApiService showTokenAtEnd:`,
				showTokenAtEnd
			);
		} catch (serviceError) {
			console.warn(
				`${MODULE_TAG} ⚠️ UniversalSilentApiService failed, using fallback:`,
				serviceError
			);
			// Priority 3: Direct MFA service (fallback)
			try {
				const { MFAConfigurationServiceV8 } = await import(
					'@/v8/services/mfaConfigurationServiceV8'
				);
				const mfaConfig = MFAConfigurationServiceV8.loadConfiguration();
				showTokenAtEnd = mfaConfig.workerToken?.showTokenAtEnd ?? false;
				console.log(
					`${MODULE_TAG} 🔄 Using MFAConfigurationServiceV8 fallback showTokenAtEnd:`,
					showTokenAtEnd
				);
			} catch (mfaError) {
				console.warn(`${MODULE_TAG} ❌ All services failed, defaulting to false:`, mfaError);
				showTokenAtEnd = false;
			}
		}
	}

	// Log final configuration for debugging
	console.log(`${MODULE_TAG} 📋 Final configuration:`, {
		silentApiRetrieval,
		showTokenAtEnd,
		forceShowModal,
		source: overrideSilentApiRetrieval !== undefined ? 'override' : 'service',
	});

	// Check current token status
	const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();

	// If token is already valid AND user didn't explicitly click button
	if (currentStatus.isValid && !forceShowModal) {
		// Only show modal if BOTH silentApiRetrieval is OFF AND showTokenAtEnd is ON
		// If silentApiRetrieval is ON, we should be truly silent (no modals)
		if (!silentApiRetrieval && showTokenAtEnd) {
			setShowModal(true);
			return;
		}

		return;
	}

	// Token is missing or expired (or forceShowModal=true which bypasses the early return above)
	// If silentApiRetrieval is ON, attempt silent retrieval
	if (silentApiRetrieval) {
		// Show loading state during silent retrieval
		if (setSilentLoading) {
			setSilentLoading(true);
		}

		try {
			const universalService = new UniversalSilentApiService({
				appId: 'v8',
				appName: 'V8 App',
				appVersion: '8.0.0',
				storageKey: 'v8-silent-api-config',
			});

			const result = await universalService.executeSilentApi();

			// Hide loading state
			if (setSilentLoading) {
				setSilentLoading(false);
			}

			if (result.success && result.token) {
				console.log(`${MODULE_TAG} ✅ Silent retrieval successful via UniversalSilentApiService`);

				// Update token status if callback provided
				if (setTokenStatus && result.status) {
					await setTokenStatus(result.status);
				}

				// Show token at end if configured
				if (showTokenAtEnd) {
					setShowModal(true);
				}
				return;
			} else {
				console.log(`${MODULE_TAG} ⚠️ Silent retrieval failed, showing modal:`, result.error);

				// Check if it's a credentials issue
				if (result.error?.includes('No credentials configured')) {
					toastV8.warning('No credentials configured. Please set up worker token credentials.');
				}
			}
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ UniversalSilentApiService error:`, error);
		}

		// Hide loading state
		if (setSilentLoading) {
			setSilentLoading(false);
		}

		// Silent retrieval failed - show modal for user interaction
		setShowModal(true);
		return;
	}

	// silentApiRetrieval is OFF - show modal if showTokenAtEnd is ON OR if user explicitly clicked button
	if (forceShowModal || showTokenAtEnd) {
		setShowModal(true);
	}
}
