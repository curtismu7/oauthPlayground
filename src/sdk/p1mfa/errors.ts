/**
 * @file errors.ts
 * @module sdk/p1mfa
 * @description Custom error classes for P1MFA SDK
 * @version 1.0.0
 */

/**
 * Base error class for P1MFA SDK
 */
export class P1MFAError extends Error {
	constructor(
		message: string,
		public code?: string,
		public statusCode?: number,
		public details?: unknown
	) {
		super(message);
		this.name = 'P1MFAError';
		Object.setPrototypeOf(this, P1MFAError.prototype);
	}
}

/**
 * Device Registration Error
 */
export class DeviceRegistrationError extends P1MFAError {
	constructor(message: string, code?: string, statusCode?: number, details?: unknown) {
		super(message, code, statusCode, details);
		this.name = 'DeviceRegistrationError';
		Object.setPrototypeOf(this, DeviceRegistrationError.prototype);
	}
}

/**
 * Device Activation Error
 */
export class DeviceActivationError extends P1MFAError {
	constructor(message: string, code?: string, statusCode?: number, details?: unknown) {
		super(message, code, statusCode, details);
		this.name = 'DeviceActivationError';
		Object.setPrototypeOf(this, DeviceActivationError.prototype);
	}
}

/**
 * Authentication Error
 */
export class AuthenticationError extends P1MFAError {
	constructor(message: string, code?: string, statusCode?: number, details?: unknown) {
		super(message, code, statusCode, details);
		this.name = 'AuthenticationError';
		Object.setPrototypeOf(this, AuthenticationError.prototype);
	}
}

/**
 * WebAuthn Error
 */
export class WebAuthnError extends P1MFAError {
	constructor(message: string, code?: string, details?: unknown) {
		super(message, code, undefined, details);
		this.name = 'WebAuthnError';
		Object.setPrototypeOf(this, WebAuthnError.prototype);
	}
}

/**
 * Configuration Error
 */
export class ConfigurationError extends P1MFAError {
	constructor(message: string, code?: string) {
		super(message, code);
		this.name = 'ConfigurationError';
		Object.setPrototypeOf(this, ConfigurationError.prototype);
	}
}
