/**
 * @file MFATypes.ts
 * @module v8/flows/shared
 * @description Shared types and interfaces for MFA flows
 */

export type DeviceType =
	| 'SMS'
	| 'EMAIL'
	| 'TOTP'
	| 'FIDO2'
	| 'MOBILE'
	| 'OATH_TOKEN'
	| 'VOICE'
	| 'WHATSAPP';

export type TokenType = 'worker' | 'user'; // Worker token (admin) or User token (access token from implicit flow)

export interface MFACredentials {
	environmentId: string;
	clientId: string;
	username: string;
	deviceType: DeviceType;
	countryCode: string;
	phoneNumber: string;
	email: string;
	deviceName: string;
	deviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED'; // Device status determines if OTP is sent
	deviceAuthenticationPolicyId?: string; // Auth policy to use during device authentication (runtime MFA)
	registrationPolicyId?: string; // Optional policy for registration if tenant requires it
	fido2PolicyId?: string; // FIDO2 policy ID selected in configuration (optional, backward compatible)
	// Token configuration per rightTOTP.md: Support Worker Token OR User Token (access token from implicit)
	tokenType?: TokenType; // 'worker' or 'user'
	userToken?: string; // Access token from implicit flow (when tokenType is 'user')
	region?: 'us' | 'eu' | 'ap' | 'ca' | 'na'; // PingOne region: us (North America), eu (Europe), ap (Asia Pacific), ca (Canada), na (alias for us)
	customDomain?: string; // Custom domain for PingOne API (e.g., auth.yourcompany.com). If provided, overrides region-based domain.
	[key: string]: unknown;
}

export interface DeviceAuthenticationPolicy {
	id: string;
	name: string;
	description?: string;
	status?: string;
	pairingDisabled?: boolean; // If true, device pairing is disabled for this policy
	promptForNicknameOnPairing?: boolean; // If true, prompt user to set nickname after pairing
	skipUserLockVerification?: boolean; // If true, skip lock verification; if false, check user lock status and block if locked
	otp?: {
		failure?: {
			count?: number; // Maximum number of OTP entry failures (1-7)
			coolDown?: {
				duration?: number; // Duration (0-30, or 2-30 depending on device type)
				timeUnit?: 'MINUTES' | 'SECONDS'; // Time unit for duration
			};
		};
	};
	authentication?: {
		deviceSelection?: string;
		[key: string]: unknown;
	};
	// Device limits (according to PingOne documentation)
	// Note: These are implicit limits enforced by PingOne, not explicit policy fields
	_limits?: {
		maxActivationRequiredDevices?: number; // Max 50 devices per user in ACTIVATION_REQUIRED status
		maxValidPairingKeys?: number; // Max 20 valid pairing keys per user
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface MFAState {
	deviceId: string;
	otpCode: string;
	deviceStatus: string;
	verificationResult: {
		status: string;
		message: string;
	} | null;
	showQr?: boolean;
	qrCodeUrl?: string;
	keyUri?: string;
	totpSecret?: string;
	publicKeyCredentialCreationOptions?: unknown;
	pairingKey?: string;
	deviceActivateUri?: string;
	// Additional device registration fields
	nickname?: string;
	environmentId?: string;
	userId?: string;
	createdAt?: string;
	updatedAt?: string;
	// Authentication flow fields (for existing devices)
	authenticationId?: string;
	nextStep?: string; // OTP_REQUIRED, ASSERTION_REQUIRED, SELECTION_REQUIRED, COMPLETED
	// FIDO2-specific fields
	fido2CredentialId?: string;
	fido2PublicKey?: string;
	fido2RegistrationComplete?: boolean;
	fido2ChallengeId?: string; // Challenge ID for WebAuthn assertion
	fido2AssertionOptions?: PublicKeyCredentialRequestOptions | null;
	// Device authentication ID for the new MFA flow
	deviceAuthId?: string;
}

export interface MFAFlowProps {
	credentials: MFACredentials;
	setCredentials: (credentials: MFACredentials) => void;
	mfaState: MFAState;
	setMfaState: (state: MFAState | ((prev: MFAState) => MFAState)) => void;
	tokenStatus: ReturnType<
		typeof import('@/v8/services/workerTokenStatusServiceV8').WorkerTokenStatusServiceV8.checkWorkerTokenStatus
	>;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
	nav: import('@/v8/hooks/useStepNavigationV8').UseStepNavigationV8Return;
	showDeviceLimitModal: boolean;
	setShowDeviceLimitModal: (show: boolean) => void;
}
