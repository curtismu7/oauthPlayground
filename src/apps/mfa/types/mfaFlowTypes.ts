/**
 * @file mfaFlowTypes.ts
 * @module apps/mfa/types
 * @description Core type definitions for separated MFA flows
 * @version 8.0.0
 * @since 2026-02-20
 */

/**
 * Device types supported by MFA flows
 */
export type DeviceConfigKey = 'SMS' | 'EMAIL' | 'MOBILE' | 'WHATSAPP' | 'TOTP' | 'FIDO2';

/**
 * Flow types for MFA operations
 */
export type MFAFlowType = 'registration' | 'authentication';

/**
 * Registration flow steps
 */
export enum RegistrationStep {
	DEVICE_TYPE_SELECTION = 0,
	USER_VERIFICATION = 1,
	DEVICE_CONFIGURATION = 2,
	DEVICE_VALIDATION = 3,
	REGISTRATION_COMPLETE = 4,
}

/**
 * Authentication flow steps
 */
export enum AuthenticationStep {
	DEVICE_SELECTION = 0,
	CHALLENGE_INITIATION = 1,
	CHALLENGE_RESPONSE = 2,
	AUTHENTICATION_COMPLETE = 3,
}

/**
 * Base callback data structure
 */
export interface MFACallbackData {
	url: string;
	method: 'GET' | 'POST';
	headers: Record<string, string>;
	data?: Record<string, any>;
	state?: string;
	timestamp: number;
}

/**
 * Callback routing result
 */
export interface CallbackRoutingResult {
	success: boolean;
	flowType: MFAFlowType;
	targetStep?: RegistrationStep | AuthenticationStep;
	flowState?: RegistrationFlowState | AuthenticationFlowState;
	navigationAction?: 'forward' | 'backward' | 'restart';
	error?: CallbackError;
}

/**
 * Callback error information
 */
export interface CallbackError {
	type: 'validation' | 'network' | 'state_corruption' | 'routing';
	message: string;
	recoveryAction: 'restart_flow' | 'retry_callback' | 'manual_intervention';
	details?: Record<string, any>;
}

/**
 * Registration flow state
 */
export interface RegistrationFlowState {
	flowType: 'registration';
	subFlowType: 'user_initiated' | 'admin_setup' | 'bulk_import';
	currentStep: RegistrationStep;
	deviceType: DeviceConfigKey;
	userData: {
		userId: string;
		username: string;
		environmentId: string;
	};
	deviceData: Partial<DeviceRegistrationData>;
	validationState: RegistrationValidationState;
	callbackState: RegistrationCallbackState;
	metadata: {
		startTime: number;
		lastActivity: number;
		version: string;
	};
}

/**
 * Authentication flow state
 */
export interface AuthenticationFlowState {
	flowType: 'authentication';
	subFlowType: 'login' | 'step_up' | 'admin_impersonation';
	currentStep: AuthenticationStep;
	challengeData: AuthenticationChallenge;
	selectedDevice: MFADevice;
	authenticationMethod: AuthenticationMethod;
	callbackState: AuthenticationCallbackState;
	metadata: {
		startTime: number;
		lastActivity: number;
		version: string;
	};
}

/**
 * Device registration data
 */
export interface DeviceRegistrationData {
	type: DeviceConfigKey;
	phone?: string;
	email?: string;
	name?: string;
	nickname?: string;
	status?: 'ACTIVE' | 'INACTIVE';
	notification?: Record<string, any>;
	configuration?: Record<string, any>;
}

/**
 * Registration validation state
 */
export interface RegistrationValidationState {
	isValid: boolean;
	errors: Record<string, string>;
	warnings: Record<string, string>;
	completedSteps: RegistrationStep[];
}

/**
 * Registration callback state
 */
export interface RegistrationCallbackState {
	isPending: boolean;
	callbackUrl?: string;
	callbackData?: Record<string, any>;
	expectedStep?: RegistrationStep;
	retryCount: number;
	lastCallbackTime?: number;
}

/**
 * Authentication challenge data
 */
export interface AuthenticationChallenge {
	challengeId: string;
	challengeType: 'OTP' | 'PUSH' | 'BIOMETRIC' | 'WEBAUTHN';
	expiresAt: number;
	attemptsRemaining: number;
	challengeData?: Record<string, any>;
}

/**
 * MFA device information
 */
export interface MFADevice {
	id: string;
	type: DeviceConfigKey;
	name: string;
	status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
	lastUsed?: number;
	capabilities: string[];
}

/**
 * Authentication method
 */
export interface AuthenticationMethod {
	type: 'OTP' | 'PUSH' | 'BIOMETRIC' | 'WEBAUTHN';
	device: MFADevice;
	configuration?: Record<string, any>;
}

/**
 * Authentication callback state
 */
export interface AuthenticationCallbackState {
	isPending: boolean;
	callbackUrl?: string;
	callbackData?: Record<string, any>;
	expectedStep?: AuthenticationStep;
	retryCount: number;
	lastCallbackTime?: number;
}

/**
 * Validation result for form fields
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validation function signature
 */
export type ValidationFunction = (value: string) => ValidationResult;

/**
 * Device flow configuration
 */
export interface DeviceFlowConfig {
	deviceType: DeviceConfigKey;
	displayName: string;
	description: string;
	requiredFields: string[];
	validationRules: Record<string, ValidationFunction>;
	customComponents?: Record<string, React.ComponentType<any>>;
	apiEndpoints: {
		register: string;
		validate: string;
		authenticate: string;
	};
}

/**
 * Flow navigation state
 */
export interface FlowNavigationState {
	currentStep: number;
	totalSteps: number;
	canGoPrevious: boolean;
	canGoNext: boolean;
	isFlowComplete: boolean;
	progressPercentage: number;
}

/**
 * Error types for callback handling
 */
export class CallbackValidationError extends Error {
	constructor(
		message: string,
		public details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'CallbackValidationError';
	}
}

export class NetworkError extends Error {
	constructor(
		message: string,
		public statusCode?: number
	) {
		super(message);
		this.name = 'NetworkError';
	}
}

export class StateCorruptionError extends Error {
	constructor(
		message: string,
		public corruptedData?: unknown
	) {
		super(message);
		this.name = 'StateCorruptionError';
	}
}
