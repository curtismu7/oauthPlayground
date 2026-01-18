/**
 * @file types.ts
 * @module sdk/p1mfa
 * @description TypeScript types and interfaces for P1MFA SDK
 * @version 1.0.0
 */

/**
 * P1MFA SDK Configuration
 */
export interface P1MFAConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	region?: 'us' | 'eu' | 'ap' | 'ca' | 'na';
	customDomain?: string;
	tokenEndpointAuthMethod?:
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

/**
 * Device Registration Parameters
 */
export interface DeviceRegistrationParams {
	userId: string;
	type: 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2' | 'MOBILE' | 'OATH_TOKEN' | 'VOICE' | 'WHATSAPP';
	phone?: string; // Required for SMS, VOICE, WHATSAPP
	email?: string; // Required for EMAIL
	name?: string;
	nickname?: string;
	status?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	policy?: string | { id: string }; // Device Authentication Policy ID
	rp?: {
		id: string; // Relying Party ID (for FIDO2)
		name: string; // Relying Party name (for FIDO2)
	};
}

/**
 * Device Activation Parameters
 */
export interface DeviceActivationParams {
	userId: string;
	deviceId: string;
	otp?: string; // Required for SMS, EMAIL, VOICE, WHATSAPP
	fido2Credential?: PublicKeyCredential; // Required for FIDO2
}

/**
 * Device Object
 */
export interface Device {
	id: string;
	type: string;
	status: string;
	phone?: string;
	email?: string;
	name?: string;
	nickname?: string;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

/**
 * Device Registration Result
 */
export interface DeviceRegistrationResult {
	deviceId: string;
	userId: string;
	status: string;
	type: string;
	device: Device;
	publicKeyCredentialCreationOptions?: PublicKeyCredentialCreationOptions; // For FIDO2
	[key: string]: unknown;
}

/**
 * Device Activation Result
 */
export interface DeviceActivationResult {
	deviceId: string;
	status: string;
	message?: string;
	[key: string]: unknown;
}

/**
 * Authentication Initialization Parameters
 */
export interface AuthenticationInitParams {
	userId: string;
	deviceId?: string; // Optional: target specific device
	deviceAuthenticationPolicyId: string;
}

/**
 * Authentication Completion Parameters
 */
export interface AuthenticationCompleteParams {
	authenticationId: string;
	otp?: string; // For SMS, EMAIL, VOICE, WHATSAPP
	fido2Assertion?: PublicKeyCredential; // For FIDO2
}

/**
 * Authentication Result
 */
export interface AuthenticationResult {
	authenticationId: string;
	status: string;
	accessToken?: string;
	tokenType?: string;
	expiresIn?: number;
	message?: string;
	[key: string]: unknown;
}

/**
 * Device Authentication Response (from PingOne MFA API)
 */
export interface DeviceAuthenticationResponse {
	id: string;
	status: string;
	nextStep?: string;
	devices?: Array<{ id: string; type: string; nickname?: string }>;
	challengeId?: string;
	_links?: Record<string, { href: string }>;
	[key: string]: unknown;
}
