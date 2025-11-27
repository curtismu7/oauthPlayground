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
	| 'WHATSAPP' 
	| 'PLATFORM' 
	| 'SECURITY_KEY';

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
	[key: string]: unknown;
}

export interface DeviceAuthenticationPolicy {
	id: string;
	name: string;
	description?: string;
	status?: string;
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
	// Additional device registration fields
	nickname?: string;
	environmentId?: string;
	userId?: string;
	createdAt?: string;
	updatedAt?: string;
	// Authentication flow fields (for existing devices)
	authenticationId?: string;
	nextStep?: string; // OTP_REQUIRED, ASSERTION_REQUIRED, SELECTION_REQUIRED, COMPLETED
	// TOTP-specific fields
	qrCodeUrl?: string;
	totpSecret?: string;
	// FIDO2-specific fields
	fido2CredentialId?: string;
	fido2PublicKey?: string;
	fido2RegistrationComplete?: boolean;
	// Device authentication ID for the new MFA flow
	deviceAuthId?: string;
}

export interface MFAFlowProps {
	credentials: MFACredentials;
	setCredentials: (credentials: MFACredentials) => void;
	mfaState: MFAState;
	setMfaState: (state: MFAState | ((prev: MFAState) => MFAState)) => void;
	tokenStatus: ReturnType<typeof import('@/v8/services/workerTokenStatusServiceV8').WorkerTokenStatusServiceV8.checkWorkerTokenStatus>;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
	nav: ReturnType<typeof import('@/v8/hooks/useStepNavigationV8')>;
	showDeviceLimitModal: boolean;
	setShowDeviceLimitModal: (show: boolean) => void;
}

