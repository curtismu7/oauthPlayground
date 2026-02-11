/**
 * @file protectPortal.types.ts
 * @module protect-portal/types
 * @description Type definitions for Protect Portal application
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This file contains all TypeScript type definitions for the Protect Portal
 * application including user context, risk evaluation, MFA, and token types.
 */

// ============================================================================
// PORTAL STEP TYPES
// ============================================================================

export type PortalStep =
	| 'portal-home' // Initial landing page
	| 'custom-login' // Embedded PingOne login
	| 'risk-evaluation' // Risk assessment in progress
	| 'risk-low-success' // Low risk → direct success
	| 'risk-medium-mfa' // Medium risk → MFA required
	| 'risk-high-block' // High risk → Access blocked
	| 'device-selection' // Choose MFA device
	| 'otp-authentication' // OTP validation
	| 'fido2-authentication' // FIDO2 authentication
	| 'portal-success' // Successful login with tokens
	| 'error'; // Error handling state

// ============================================================================
// USER CONTEXT TYPES
// ============================================================================

export interface UserContext {
	id: string;
	email: string;
	name?: string;
	username: string;
	type: 'PING_ONE' | 'EXTERNAL';
	groups?: Array<{ name: string }>;
	device?: {
		externalId?: string;
		userAgent?: string;
		ipAddress?: string;
	};
	session?: {
		id?: string;
		createdAt?: string;
	};
}

export interface LoginContext {
	timestamp: string;
	ipAddress: string;
	userAgent: string;
	origin: string;
	flowType: 'AUTHENTICATION';
	flowSubtype: 'CUSTOM_LOGIN';
}

// ============================================================================
// RISK EVALUATION TYPES
// ============================================================================

export interface RiskEvaluationEventData {
	ip: string;
	user: {
		id: string;
		name?: string;
		type: 'PING_ONE' | 'EXTERNAL';
		groups?: Array<{ name: string }>;
	};
	targetResource?: {
		id?: string;
		name?: string;
	};
	browser?: {
		userAgent: string;
		cookie?: string;
	};
	device?: {
		externalId?: string;
	};
	session?: {
		id?: string;
	};
	flow: {
		type: 'REGISTRATION' | 'AUTHENTICATION' | 'ACCESS' | 'AUTHORIZATION' | 'TRANSACTION';
		subtype?: string;
	};
	origin?: string;
	timestamp?: string;
	completionStatus?: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
}

export interface RiskEvaluationResult {
	id: string;
	environment: { id: string };
	riskPolicySet: {
		id: string;
		name: string;
		targeted: boolean;
	};
	result: {
		level: 'LOW' | 'MEDIUM' | 'HIGH';
		recommendedAction: string;
		type: 'VALUE';
	};
	details: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

export interface RiskThresholds {
	low: {
		maxScore: number;
		action: 'ALLOW';
	};
	medium: {
		minScore: number;
		maxScore: number;
		action: 'CHALLENGE_MFA';
	};
	high: {
		minScore: number;
		action: 'BLOCK';
	};
}

// ============================================================================
// EDUCATIONAL CONTENT TYPES
// ============================================================================

export interface EducationalContent {
	title: string;
	description: string;
	keyPoints: string[];
	learnMore: {
		title: string;
		url: string;
		description: string;
	};
}

export interface RiskEvaluationExplanation {
	title: string;
	description: string;
	keyPoints: string[];
	learnMore: {
		title: string;
		url: string;
		description: string;
	};
}

export interface MFAExplanation {
	title: string;
	description: string;
	keyPoints: string[];
	learnMore: {
		title: string;
		url: string;
		description: string;
	};
}

export interface TokenExplanation {
	title: string;
	description: string;
	keyPoints: string[];
	learnMore: {
		title: string;
		url: string;
		description: string;
	};
}

// ============================================================================
// MFA DEVICE TYPES
// ============================================================================

export type MFADeviceType =
	| 'SMS'
	| 'EMAIL'
	| 'WHATSAPP'
	| 'TOTP'
	| 'FIDO2'
	| 'MOBILE'
	| 'PUSH'
	| 'VOICE'
	| 'HARDWARE_TOKEN'
	| 'BIOMETRIC';

export interface MFADevice {
	id: string;
	type: MFADeviceType;
	name?: string;
	status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
	phone?: string;
	email?: string;
	createdAt?: string;
	lastUsedAt?: string;
	deviceData?: Record<string, unknown>;
}

export interface DeviceRegistrationResult {
	deviceId: string;
	deviceType: string;
	status: string;
	message: string;
	deviceData?: Record<string, unknown>;
}

export interface DeviceAuthenticationResult {
	success: boolean;
	deviceId: string;
	deviceType: string;
	token?: string;
	message: string;
}

// ============================================================================
// OTP TYPES
// ============================================================================

export interface OTPOptions {
	deviceId: string;
	phoneNumber?: string;
	emailAddress?: string;
	resendCooldown: number;
	maxAttempts: number;
}

export interface OTPValidationResult {
	valid: boolean;
	remainingAttempts?: number;
	canResend: boolean;
	resendCooldown?: number;
	message: string;
}

// ============================================================================
// FIDO2 TYPES
// ============================================================================

export interface FIDO2Challenge {
	challenge: string;
	rp: {
		name: string;
		id: string;
	};
	user: {
		id: string;
		name: string;
		displayName: string;
	};
	pubKeyCredParams: Array<{
		type: string;
		alg: number;
	}>;
	timeout: number;
	allowCredentials?: Array<{
		type: string;
		id: string;
		transports?: string[];
	}>;
}

export interface FIDO2Response {
	id: string;
	rawId: string;
	response: {
		authenticatorData: string;
		clientDataJSON: string;
		signature?: string;
		userHandle?: string;
	};
	type: string;
}

export interface FIDO2AuthenticationResult {
	success: boolean;
	credentialId?: string;
	message: string;
}

// ============================================================================
// TOKEN TYPES
// ============================================================================

export interface TokenSet {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	scope: string;
	idToken?: string;
	refreshToken?: string;
}

export interface IDTokenClaims {
	iss: string;
	sub: string;
	aud: string;
	exp: number;
	iat: number;
	auth_time?: number;
	nonce?: string;
	acr?: string;
	amr?: string[];
	azp?: string;
	at_hash?: string;
	c_hash?: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	picture?: string;
	website?: string;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	locale?: string;
	updated_at?: number;
	phone_number?: string;
	phone_number_verified?: boolean;
	address?: {
		formatted?: string;
		street_address?: string;
		locality?: string;
		region?: string;
		postal_code?: string;
		country?: string;
	};
	[key: string]: unknown;
}

export interface TokenDisplayData {
	accessToken: {
		header: string;
		payload: string;
		signature: string;
		claims: Record<string, unknown>;
		preview: string; // First 20 chars for display
	};
	idToken?: {
		header: string;
		payload: string;
		signature: string;
		claims: IDTokenClaims;
		preview: string;
	};
	tokenInfo: {
		expiresIn: number;
		expiresAt: Date;
		scopes: string[];
		audience: string[];
		issuer: string;
	};
}

// ============================================================================
// PROTECT CREDENTIALS TYPES
// ============================================================================

export interface ProtectCredentials {
	environmentId: string;
	workerToken: string;
	region: 'us' | 'eu' | 'ap' | 'ca';
}

// ============================================================================
// PORTAL STATE TYPES
// ============================================================================

export interface PortalState {
	currentStep: PortalStep;
	userContext: UserContext | null;
	loginContext: LoginContext | null;
	riskEvaluation: RiskEvaluationResult | null;
	selectedDevice: MFADevice | null;
	availableDevices: MFADevice[];
	tokens: TokenSet | null;
	tokenDisplay: TokenDisplayData | null;
	isLoading: boolean;
	error: PortalError | null;
	educationalContent: {
		riskEvaluation: EducationalContent;
		mfaAuthentication: EducationalContent;
		tokenDisplay: EducationalContent;
	};
}

export interface EducationalContent {
	title: string;
	description: string;
	keyPoints: string[];
	learnMore: {
		title: string;
		url: string;
	};
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface PortalError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
	recoverable: boolean;
	suggestedAction?: string;
}

export interface RiskEvaluationError extends PortalError {
	type: 'PROTECT_API_ERROR' | 'RISK_POLICY_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR';
}

export interface MFAError extends PortalError {
	type: 'DEVICE_NOT_FOUND' | 'OTP_INVALID' | 'FIDO2_ERROR' | 'DEVICE_REGISTRATION_ERROR';
}

export interface MFAAuthenticationError extends PortalError {
	type:
		| 'AUTHENTICATION_ERROR'
		| 'DEVICE_NOT_FOUND'
		| 'RATE_LIMIT_ERROR'
		| 'SERVICE_ERROR'
		| 'NETWORK_ERROR';
}

export interface TokenError extends PortalError {
	type: 'TOKEN_EXCHANGE_ERROR' | 'TOKEN_PARSE_ERROR' | 'TOKEN_VALIDATION_ERROR';
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ProtectPortalConfig {
	riskPolicies: RiskThresholds;
	mfaConfig: {
		allowedDeviceTypes: MFADevice['type'][];
		requireDeviceRegistration: boolean;
		otpTimeout: number;
		otpLength: number;
		otpResendCooldown: number;
		otpMaxAttempts: number;
		fido2Timeout: number;
		fido2UserVerification: 'required' | 'preferred' | 'discouraged';
		fido2AuthenticatorAttachment: 'platform' | 'cross-platform';
		maxDevicesPerUser: number;
		deviceInactivityTimeout: number;
	};
	tokenConfig: {
		displaySensitiveData: boolean;
		tokenPreviewLength: number;
		showTokenClaims: boolean;
		autoRefresh: boolean;
		refreshBufferTime: number;
		useSessionStorage: boolean;
		tokenEncryptionEnabled: boolean;
		validateTokens: boolean;
		checkTokenExpiry: boolean;
		validateTokenSignature: boolean;
	};
	uiConfig: {
		theme: 'corporate' | 'modern' | 'minimal';
		showEducationalContent: boolean;
		educationalContentPosition: 'sidebar' | 'modal' | 'inline';
		enableAnimations: boolean;
		animationDuration: number;
		showLoadingSpinners: boolean;
		loadingDelay: number;
		showDetailedErrors: boolean;
		enableErrorRecovery: boolean;
		enableKeyboardNavigation: boolean;
		enableScreenReaderSupport: boolean;
		highContrastMode: boolean;
		mobileBreakpoint: number;
		tabletBreakpoint: number;
		desktopBreakpoint: number;
	};
}

// ============================================================================
// SERVICE RESPONSE TYPES
// ============================================================================

export interface ServiceResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: PortalError;
	metadata?: {
		timestamp: string;
		requestId: string;
		processingTime: number;
	};
}

export interface ProtectApiResponse<T = unknown> {
	data: T;
	status: number;
	statusText: string;
	headers: Record<string, string>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface PortalEvent {
	type: string;
	timestamp: string;
	data: Record<string, unknown>;
}

export interface RiskEvaluationEvent extends PortalEvent {
	type: 'RISK_EVALUATION_STARTED' | 'RISK_EVALUATION_COMPLETED' | 'RISK_EVALUATION_FAILED';
	data: {
		userId: string;
		riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
		riskScore?: number;
		error?: string;
	};
}

export interface MFAEvent extends PortalEvent {
	type: 'MFA_STARTED' | 'MFA_COMPLETED' | 'MFA_FAILED' | 'DEVICE_REGISTERED';
	data: {
		userId: string;
		deviceType?: string;
		deviceId?: string;
		error?: string;
	};
}

export interface TokenEvent extends PortalEvent {
	type: 'TOKENS_RECEIVED' | 'TOKENS_REFRESHED' | 'TOKENS_EXPIRED';
	data: {
		userId: string;
		tokenTypes: string[];
		expiresIn?: number;
	};
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
