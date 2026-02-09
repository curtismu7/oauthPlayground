/**
 * @file useMFAAuthentication.ts
 * @module v8/flows/MFAAuthenticationMainPageV8/hooks
 * @description Hook for managing MFA authentication state and flow
 * @version 1.0.0
 * @since 2026-01-31
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx to improve maintainability.
 * This hook encapsulates the core authentication logic including:
 * - Authentication state management
 * - Starting MFA authentication flow
 * - Handling device selection
 * - Managing authentication modals
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MfaAuthenticationServiceV8 } from '@/v8/services/mfaAuthenticationServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { Device } from '../../components/MFADeviceSelector';
import type { DeviceAuthenticationPolicy } from '../../shared/MFATypes';

const MODULE_TAG = '[🔐 useMFAAuthentication]';

export interface AuthenticationState {
	isLoading: boolean;
	authenticationId: string | null;
	status: string | null;
	nextStep: string | null;
	devices: Device[];
	showDeviceSelection: boolean;
	selectedDeviceId: string;
	userId: string | null;
	challengeId: string | null;
	publicKeyCredentialRequestOptions?: unknown;
	_links: Record<string, { href: string }> | null;
	completionResult: {
		accessToken?: string;
		tokenType?: string;
		expiresIn?: number;
	} | null;
}

export interface MFAAuthenticationCredentials {
	environmentId: string;
	deviceAuthenticationPolicyId: string;
	region?: string;
	customDomain?: string;
}

export interface MFAAuthenticationHookResult {
	// State
	authState: AuthenticationState;
	loadingMessage: string;

	// Modals
	showOTPModal: boolean;
	showFIDO2Modal: boolean;
	showPushModal: boolean;

	// OTP State
	otpCode: string;
	isValidatingOTP: boolean;
	otpError: string | null;

	// FIDO2 State
	isAuthenticatingFIDO2: boolean;
	fido2Error: string | null;

	// Actions
	handleStartMFA: (
		username: string,
		credentials: MFAAuthenticationCredentials,
		deviceAuthPolicies: DeviceAuthenticationPolicy[],
		tokenIsValid: boolean
	) => Promise<void>;

	// State setters
	setAuthState: React.Dispatch<React.SetStateAction<AuthenticationState>>;
	setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;
	setShowOTPModal: React.Dispatch<React.SetStateAction<boolean>>;
	setShowFIDO2Modal: React.Dispatch<React.SetStateAction<boolean>>;
	setShowPushModal: React.Dispatch<React.SetStateAction<boolean>>;
	setOtpCode: React.Dispatch<React.SetStateAction<string>>;
	setIsValidatingOTP: React.Dispatch<React.SetStateAction<boolean>>;
	setOtpError: React.Dispatch<React.SetStateAction<string | null>>;
	setIsAuthenticatingFIDO2: React.Dispatch<React.SetStateAction<boolean>>;
	setFido2Error: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseMFAAuthenticationOptions {
	onDeviceFailureError?: (error: unknown) => boolean;
}

/**
 * Hook for managing MFA authentication flow
 *
 * @example
 * ```tsx
 * const {
 *   authState,
 *   handleStartMFA,
 *   showOTPModal,
 *   showFIDO2Modal,
 *   showPushModal
 * } = useMFAAuthentication({
 *   onDeviceFailureError: handleDeviceError
 * });
 * ```
 */
export const useMFAAuthentication = (
	options: UseMFAAuthenticationOptions = {}
): MFAAuthenticationHookResult => {
	const { onDeviceFailureError } = options;
	const _navigate = useNavigate();

	// Authentication State
	const [authState, setAuthState] = useState<AuthenticationState>({
		isLoading: false,
		authenticationId: null,
		status: null,
		nextStep: null,
		devices: [],
		showDeviceSelection: false,
		selectedDeviceId: '',
		userId: null,
		challengeId: null,
		_links: null,
		completionResult: null,
	});

	// Loading message state for spinner modal
	const [loadingMessage, setLoadingMessage] = useState('');

	// Modals
	const [showOTPModal, setShowOTPModal] = useState(false);
	const [showFIDO2Modal, setShowFIDO2Modal] = useState(false);
	const [showPushModal, setShowPushModal] = useState(false);

	// OTP state
	const [otpCode, setOtpCode] = useState('');
	const [isValidatingOTP, setIsValidatingOTP] = useState(false);
	const [otpError, setOtpError] = useState<string | null>(null);

	// FIDO2 state
	const [isAuthenticatingFIDO2, setIsAuthenticatingFIDO2] = useState(false);
	const [fido2Error, setFido2Error] = useState<string | null>(null);

	/**
	 * Start MFA authentication flow for a given username
	 */
	const handleStartMFA = useCallback(
		async (
			username: string,
			credentials: MFAAuthenticationCredentials,
			deviceAuthPolicies: DeviceAuthenticationPolicy[],
			tokenIsValid: boolean
		) => {
			if (!tokenIsValid) {
				toastV8.error('Please configure worker token first');
				return;
			}

			if (!credentials.environmentId) {
				toastV8.error('Please configure environment ID first');
				return;
			}

			if (!credentials.deviceAuthenticationPolicyId) {
				toastV8.error('Please select an MFA Policy first');
				return;
			}

			// Reset auth state to clear any previous authentication session
			setAuthState({
				isLoading: true,
				authenticationId: null,
				status: null,
				nextStep: null,
				devices: [],
				showDeviceSelection: false,
				selectedDeviceId: '',
				userId: null,
				challengeId: null,
				publicKeyCredentialRequestOptions: undefined,
				_links: null,
				completionResult: null,
			});
			setLoadingMessage('🔐 Starting MFA Authentication...');

			try {
				// 1. Lookup user
				const user = await MFAServiceV8.lookupUserByUsername(credentials.environmentId, username);

				// 2. Initialize MFA Authentication
				const response = await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
					environmentId: credentials.environmentId,
					username: username,
					deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
					region: credentials.region,
					customDomain: credentials.customDomain,
				});

				// Extract _links for flow coordination
				const links = (response._links as Record<string, { href: string }>) || {};

				// Parse response
				const status = response.status || '';
				const nextStep = response.nextStep || '';

				// Use devices from authentication response
				const rawDevices = response.devices || [];

				// Filter devices to ensure they belong to the correct user
				const userDevices = rawDevices.filter((d: Record<string, unknown>) => {
					const deviceUserId = d.user?.id || d.userId;
					const matches = !deviceUserId || deviceUserId === user.id;
					if (!matches) {
						console.warn(`${MODULE_TAG} ⚠️ Device belongs to different user, filtering out:`, {
							deviceId: d.id,
							deviceType: d.type,
							deviceUserId,
							expectedUserId: user.id,
							expectedUsername: username,
						});
					}
					return matches;
				});

				let authDevices: Device[] = userDevices.map((d: Record<string, unknown>) => {
					const device: Device = {
						id: (d.id as string) || '',
						type: (d.type as string) || '',
						nickname: (d.nickname as string) || (d.name as string) || (d.type as string),
					};
					if (d.phone) device.phone = d.phone as string;
					if (d.email) device.email = d.email as string;
					if (d.status) device.status = d.status as string;
					return device;
				});

				// Check for session cookies and prefer FIDO2 platform devices if present
				const { shouldPreferFIDO2PlatformDevice } = await import(
					'@/v8/services/fido2SessionCookieServiceV8'
				);
				const platformPreference = shouldPreferFIDO2PlatformDevice();

				if (platformPreference.prefer && authDevices.length > 0) {
					// Reorder devices to prioritize FIDO2 devices when session cookie exists
					const fido2Devices = authDevices.filter((d) => d.type === 'FIDO2');
					const otherDevices = authDevices.filter((d) => d.type !== 'FIDO2');

					if (fido2Devices.length > 0) {
						authDevices = [...fido2Devices, ...otherDevices];
					}
				}

				// Get the selected policy to check device selection behavior
				const selectedPolicy = deviceAuthPolicies.find(
					(p) => p.id === credentials.deviceAuthenticationPolicyId
				);
				const deviceSelectionBehavior = selectedPolicy?.authentication?.deviceSelection as
					| string
					| undefined;

				// Determine next action based on status/nextStep
				const needsDeviceSelection =
					status === 'DEVICE_SELECTION_REQUIRED' ||
					nextStep === 'DEVICE_SELECTION_REQUIRED' ||
					nextStep === 'SELECTION_REQUIRED' ||
					// For ALWAYS_DISPLAY_DEVICES policy, always show device selection if devices are available
					(authDevices.length > 0 && deviceSelectionBehavior === 'ALWAYS_DISPLAY_DEVICES');

				const needsOTP = status === 'OTP_REQUIRED' || nextStep === 'OTP_REQUIRED';
				const needsAssertion = status === 'ASSERTION_REQUIRED' || nextStep === 'ASSERTION_REQUIRED';
				const needsPush =
					status === 'PUSH_CONFIRMATION_REQUIRED' || nextStep === 'PUSH_CONFIRMATION_REQUIRED';

				// Validate that we got an authenticationId from the response
				if (!response.id) {
					console.error(
						`${MODULE_TAG} Authentication initialized but no ID in response:`,
						response
					);
					toastV8.error(
						'Failed to initialize authentication: No authentication ID received from PingOne'
					);
					setAuthState((prev) => ({ ...prev, isLoading: false }));
					setLoadingMessage('');
					return;
				}

				setAuthState({
					isLoading: false,
					authenticationId: response.id,
					status,
					nextStep,
					devices: authDevices,
					showDeviceSelection: needsDeviceSelection,
					selectedDeviceId: '',
					userId: String(user.id || ''),
					challengeId: (response.challengeId as string) || null,
					publicKeyCredentialRequestOptions: (
						response as { publicKeyCredentialRequestOptions?: unknown }
					).publicKeyCredentialRequestOptions,
					_links: links,
					completionResult: null,
				});
				setLoadingMessage('');

				// Show appropriate modal
				if (needsOTP) {
					setShowOTPModal(true);
				} else if (needsPush) {
					setShowPushModal(true);
					toastV8.success('Please approve the sign-in on your phone.');
				} else if (needsAssertion) {
					setShowFIDO2Modal(true);
				} else if (status === 'COMPLETED') {
					toastV8.success('Authentication completed successfully!');
				} else {
					toastV8.success('Authentication started successfully');
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to start authentication:`, error);

				// Check for NO_USABLE_DEVICES error
				if (onDeviceFailureError?.(error)) {
					// Error was handled by callback, just update loading state
					setAuthState((prev) => ({ ...prev, isLoading: false }));
					setLoadingMessage('');
					return;
				}

				toastV8.error(error instanceof Error ? error.message : 'Failed to start authentication');
				setAuthState((prev) => ({ ...prev, isLoading: false }));
				setLoadingMessage('');
			}
		},
		[onDeviceFailureError]
	);

	return {
		// State
		authState,
		loadingMessage,

		// Modals
		showOTPModal,
		showFIDO2Modal,
		showPushModal,

		// OTP State
		otpCode,
		isValidatingOTP,
		otpError,

		// FIDO2 State
		isAuthenticatingFIDO2,
		fido2Error,

		// Actions
		handleStartMFA,

		// State setters
		setAuthState,
		setLoadingMessage,
		setShowOTPModal,
		setShowFIDO2Modal,
		setShowPushModal,
		setOtpCode,
		setIsValidatingOTP,
		setOtpError,
		setIsAuthenticatingFIDO2,
		setFido2Error,
	};
};
