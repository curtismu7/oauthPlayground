/**
 * @file useFIDO2Authentication.ts
 * @module v8/flows/MFAAuthenticationMainPageV8/hooks
 * @description Hook for managing FIDO2/WebAuthn authentication
 * @version 1.0.0
 * @since 2026-01-31
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx to improve maintainability.
 * This hook encapsulates FIDO2-related logic including:
 * - Usernameless FIDO2 authentication
 * - Passkey registration
 * - WebAuthn credential management
 */

import { useCallback, useState } from 'react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { useProductionSpinner } from '../../../../hooks/useProductionSpinner';
import type { UnavailableDevice } from './useMFADevices';

const MODULE_TAG = '[🔐 useFIDO2Authentication]';

export interface FIDO2Credentials {
	environmentId: string;
	deviceAuthenticationPolicyId: string;
}

export interface FIDO2AuthenticationHookResult {
	// Usernameless decision modal
	showUsernameDecisionModal: boolean;
	isPasskeyRegistrationMode: boolean;

	// Actions
	handleUsernamelessFIDO2: (
		credentials: FIDO2Credentials,
		tokenIsValid: boolean,
		onDeviceFailure: (error: string, devices: UnavailableDevice[]) => void,
		onRegistrationRequired: () => void
	) => Promise<void>;

	// State setters
	setShowUsernameDecisionModal: React.Dispatch<React.SetStateAction<boolean>>;
	setIsPasskeyRegistrationMode: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook for managing FIDO2/WebAuthn authentication
 *
 * @example
 * ```tsx
 * const {
 *   showUsernameDecisionModal,
 *   handleUsernamelessFIDO2
 * } = useFIDO2Authentication();
 *
 * // Use in button handler
 * await handleUsernamelessFIDO2(
 *   credentials,
 *   tokenStatus.isValid,
 *   (error, devices) => {
 *     setDeviceFailureError(error);
 *     setUnavailableDevices(devices);
 *     setShowDeviceFailureModal(true);
 *   },
 *   () => {
 *     setIsPasskeyRegistrationMode(true);
 *     setShowUsernameDecisionModal(true);
 *   }
 * );
 * ```
 */
export const useFIDO2Authentication = (): FIDO2AuthenticationHookResult => {
	// Usernameless decision modal state
	const [showUsernameDecisionModal, setShowUsernameDecisionModal] = useState(false);
	const [isPasskeyRegistrationMode, setIsPasskeyRegistrationMode] = useState(false);

	// Spinner hooks for async operations
	const fido2AuthSpinner = useProductionSpinner('fido2-auth');
	const _passkeyRegistrationSpinner = useProductionSpinner('passkey-registration');

	/**
	 * Handle Usernameless FIDO2 Authentication
	 */
	const handleUsernamelessFIDO2 = useCallback(
		async (
			credentials: FIDO2Credentials,
			tokenIsValid: boolean,
			onDeviceFailure: (error: string, devices: UnavailableDevice[]) => void,
			onRegistrationRequired: () => void
		) => {
			if (!tokenIsValid) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Please configure worker token first',
					dismissible: true,
				});
				return;
			}

			if (!credentials.environmentId) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Please configure environment ID first',
					dismissible: true,
				});
				return;
			}

			if (!credentials.deviceAuthenticationPolicyId) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Please select an MFA Policy first',
					dismissible: true,
				});
				return;
			}

			return await fido2AuthSpinner.withSpinner(async () => {
				try {
					// Import passkey service dynamically
					const { PasskeyServiceV8 } = await import('@/v8/services/passkeyServiceV8');

					// Step 1: Try authentication first (discoverable credentials)
					const authResult = await PasskeyServiceV8.authenticateUsernameless({
						environmentId: credentials.environmentId,
						deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
					});

					if (authResult.success) {
						// Authentication successful!
						modernMessaging.showFooterMessage({
							type: 'info',
							message: `Authenticated successfully as ${authResult.username || authResult.userId}`,
							duration: 3000,
						});
						return;
					}

					// Step 2: Check for NO_USABLE_DEVICES error
					if (authResult.errorCode === 'NO_USABLE_DEVICES') {
						const unavailableDevices: UnavailableDevice[] = (
							authResult.unavailableDevices || []
						).map((d) => ({ id: d.id }));

						onDeviceFailure(
							authResult.error || 'No usable devices found for authentication',
							unavailableDevices
						);
						return;
					}

					// Step 3: If authentication failed and requires registration, show registration modal
					if (authResult.requiresRegistration) {
						// Show username input modal for registration
						onRegistrationRequired();
						modernMessaging.showFooterMessage({
							type: 'info',
							message: 'No passkey found. Please enter your username to register a new passkey.',
							duration: 3000,
						});
						return;
					}

					// Other error - show error message
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: authResult.error || 'Authentication failed',
						dismissible: true,
					});
				} catch (error) {
					console.error(`${MODULE_TAG} Usernameless FIDO2 failed:`, error);
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: error instanceof Error ? error.message : 'Usernameless authentication failed',
						dismissible: true,
					});
					throw error; // Re-throw to let spinner handle it
				}
			}, 'Authenticating with FIDO2...');
		},
		[fido2AuthSpinner]
	);

	return {
		// Usernameless decision modal
		showUsernameDecisionModal,
		isPasskeyRegistrationMode,

		// Actions
		handleUsernamelessFIDO2,

		// State setters
		setShowUsernameDecisionModal,
		setIsPasskeyRegistrationMode,
	};
};
