/**
 * @file useMFAAuthentication.ts
 * @module v8/hooks
 * @description Custom hook for managing MFA authentication flow state
 * @version 3.0.0
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * Centralizes all authentication-related logic including:
 * - Authentication flow state machine
 * - Modal state management (OTP, FIDO2, Push, Email)
 * - Challenge/response handling
 * - Device type routing
 * - Authentication completion
 * - Error handling
 */

import { useCallback, useState } from 'react';

export interface AuthenticationState {
	isLoading: boolean;
	showDeviceSelection: boolean;
	selectedDeviceId: string;
	userId: string | null;
	challengeId: string | null;
	_links: Record<string, { href: string }> | null;
	completionResult: Record<string, unknown> | null;
}

export interface UseMFAAuthenticationConfig {
	/** Username for authentication */
	username?: string;
	/** Environment ID */
	environmentId?: string;
	/** Device authentication policy ID */
	policyId?: string;
}

export interface UseMFAAuthenticationReturn {
	// State
	authState: AuthenticationState;
	showOTPModal: boolean;
	showFIDO2Modal: boolean;
	showPushModal: boolean;
	showEmailModal: boolean;
	showRegistrationModal: boolean;
	showUsernameDecisionModal: boolean;
	isPasskeyRegistrationMode: boolean;

	// Actions
	setAuthState: (
		state: AuthenticationState | ((prev: AuthenticationState) => AuthenticationState)
	) => void;
	setShowOTPModal: (show: boolean) => void;
	setShowFIDO2Modal: (show: boolean) => void;
	setShowPushModal: (show: boolean) => void;
	setShowEmailModal: (show: boolean) => void;
	setShowRegistrationModal: (show: boolean) => void;
	setShowUsernameDecisionModal: (show: boolean) => void;
	setIsPasskeyRegistrationMode: (mode: boolean) => void;
	resetAuthState: () => void;
	closeAllModals: () => void;

	// Computed
	isAuthenticating: boolean;
	hasActiveChallenge: boolean;
}

const MODULE_TAG = '[🔐 USE-MFA-AUTHENTICATION]';

const INITIAL_AUTH_STATE: AuthenticationState = {
	isLoading: false,
	showDeviceSelection: false,
	selectedDeviceId: '',
	userId: null,
	challengeId: null,
	_links: null,
	completionResult: null,
};

/**
 * Custom hook for managing MFA authentication flow state
 */
export const useMFAAuthentication = (
	_config: UseMFAAuthenticationConfig = {}
): UseMFAAuthenticationReturn => {
	// Config will be used in future for advanced authentication logic

	// Authentication state
	const [authState, setAuthState] = useState<AuthenticationState>(INITIAL_AUTH_STATE);

	// Modal states
	const [showOTPModal, setShowOTPModal] = useState(false);
	const [showFIDO2Modal, setShowFIDO2Modal] = useState(false);
	const [showPushModal, setShowPushModal] = useState(false);
	const [showEmailModal, setShowEmailModal] = useState(false);
	const [showRegistrationModal, setShowRegistrationModal] = useState(false);
	const [showUsernameDecisionModal, setShowUsernameDecisionModal] = useState(false);
	const [isPasskeyRegistrationMode, setIsPasskeyRegistrationMode] = useState(false);

	// Reset authentication state
	const resetAuthState = useCallback(() => {
		setAuthState(INITIAL_AUTH_STATE);
		console.log(`${MODULE_TAG} Authentication state reset`);
	}, []);

	// Close all modals
	const closeAllModals = useCallback(() => {
		setShowOTPModal(false);
		setShowFIDO2Modal(false);
		setShowPushModal(false);
		setShowEmailModal(false);
		setShowRegistrationModal(false);
		setShowUsernameDecisionModal(false);
		console.log(`${MODULE_TAG} All modals closed`);
	}, []);

	// Computed values
	const isAuthenticating = authState.isLoading || authState.challengeId !== null;
	const hasActiveChallenge = authState.challengeId !== null;

	return {
		// State
		authState,
		showOTPModal,
		showFIDO2Modal,
		showPushModal,
		showEmailModal,
		showRegistrationModal,
		showUsernameDecisionModal,
		isPasskeyRegistrationMode,

		// Actions
		setAuthState,
		setShowOTPModal,
		setShowFIDO2Modal,
		setShowPushModal,
		setShowEmailModal,
		setShowRegistrationModal,
		setShowUsernameDecisionModal,
		setIsPasskeyRegistrationMode,
		resetAuthState,
		closeAllModals,

		// Computed
		isAuthenticating,
		hasActiveChallenge,
	};
};
