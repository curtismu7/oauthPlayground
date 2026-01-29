/**
 * @file deviceFlowHelpers.ts
 * @module v8/flows/unified/utils
 * @description Helper utilities for unified device flow operations
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Provide common helper functions for device flow operations:
 * - Phone number formatting
 * - Step navigation logic
 * - Component type detection
 * - Device display formatting
 */

import type { DeviceConfigKey, DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFACredentials } from '@/v8/flows/shared/MFATypes';
import { validateAndNormalizePhone } from '@/v8/utils/phoneValidationV8';

const MODULE_TAG = '[🔧 DEVICE-FLOW-HELPERS]';

// ============================================================================
// PHONE NUMBER HELPERS
// ============================================================================

/**
 * Get full phone number formatted for PingOne API
 * Format: +1.5125201234 (country code + dot + phone number)
 *
 * @param countryCode - Country code (e.g., "+1", "1", "+44")
 * @param phoneNumber - Phone number (with or without formatting)
 * @returns Formatted phone number for API
 *
 * @example
 * getFullPhoneNumber("+1", "512-520-1234") // "+1.5125201234"
 * getFullPhoneNumber("1", "(512) 520-1234") // "+1.5125201234"
 */
export function getFullPhoneNumber(countryCode: string, phoneNumber: string): string {
	const phoneValidation = validateAndNormalizePhone(phoneNumber, countryCode);

	// If validation succeeded, use normalized format
	if (phoneValidation.isValid && phoneValidation.normalizedFullPhone) {
		return phoneValidation.normalizedFullPhone;
	}

	// Fallback to old logic for backward compatibility
	const cleanedPhone = phoneNumber.replace(/[^\d]/g, '');
	const cleanedCountryCode = countryCode.replace(/[^\d+]/g, '');
	return `${cleanedCountryCode}.${cleanedPhone}`;
}

/**
 * Get full phone number from credentials
 *
 * @param credentials - MFA credentials containing phone number and country code
 * @returns Formatted phone number for API
 */
export function getFullPhoneNumberFromCredentials(credentials: MFACredentials): string {
	return getFullPhoneNumber(credentials.countryCode || '+1', credentials.phoneNumber || '');
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Determine the next step after device registration based on device type and status
 *
 * @param config - Device flow configuration
 * @param registrationResult - Result from device registration API
 * @returns Next step index (0-4)
 *
 * Step indices:
 * - 0: Configuration
 * - 1: Device Selection
 * - 2: Registration
 * - 3: Activation
 * - 4: Success
 */
export function getNextStepAfterRegistration(
	config: DeviceFlowConfig,
	registrationResult: { status?: string; deviceId?: string; [key: string]: any }
): number {
	console.log(`${MODULE_TAG} Determining next step`, {
		deviceType: config.deviceType,
		status: registrationResult.status,
		requiresOTP: config.requiresOTP,
	});

	// FIDO2: Registration includes activation (WebAuthn ceremony)
	// Go straight to success
	if (config.deviceType === 'FIDO2') {
		console.log(`${MODULE_TAG} FIDO2 device - skip to success`);
		return 4; // Success step
	}

	// Mobile: Pairing happens via QR code scan
	// Go to activation to show pairing status
	if (config.deviceType === 'MOBILE') {
		console.log(`${MODULE_TAG} Mobile device - go to pairing status`);
		return 3; // Activation step (shows pairing status)
	}

	// Check device status
	const status = registrationResult.status?.toUpperCase();

	// If device is already ACTIVE, skip activation step
	if (status === 'ACTIVE') {
		console.log(`${MODULE_TAG} Device already active - skip to success`);
		return 4; // Success step
	}

	// If device requires OTP activation
	if (config.requiresOTP && status === 'ACTIVATION_REQUIRED') {
		console.log(`${MODULE_TAG} Device requires OTP activation`);
		return 3; // Activation step
	}

	// Default: go to activation step
	console.log(`${MODULE_TAG} Default - go to activation`);
	return 3; // Activation step
}

/**
 * Check if can proceed to next step based on current state
 *
 * @param currentStep - Current step index (0-4)
 * @param config - Device flow configuration
 * @param credentials - MFA credentials
 * @param mfaState - Current MFA state
 * @param tokenStatus - Token status information
 * @returns True if can proceed to next step
 */
export function canProceedToNextStep(
	currentStep: number,
	_config: DeviceFlowConfig,
	credentials: MFACredentials,
	mfaState: { deviceId?: string; deviceStatus?: string; [key: string]: any },
	tokenStatus: { isValid: boolean; [key: string]: any }
): boolean {
	console.log(`${MODULE_TAG} Checking if can proceed from step ${currentStep}`);

	// Step 0 (Configuration): Validate credentials and token
	if (currentStep === 0) {
		const hasRequiredCredentials =
			!!credentials.environmentId &&
			!!credentials.username &&
			!!credentials.deviceAuthenticationPolicyId;
		const hasValidToken = tokenStatus.isValid || !!credentials.userToken;

		return hasRequiredCredentials && hasValidToken;
	}

	// Step 1 (Device Selection): Either selected existing device or ready to register new
	if (currentStep === 1) {
		return true; // Always allow proceeding from device selection
	}

	// Step 2 (Registration): Must have device ID and valid status
	if (currentStep === 2) {
		return !!mfaState.deviceId && !!mfaState.deviceStatus;
	}

	// Step 3 (Activation): Must have active device
	if (currentStep === 3) {
		return mfaState.deviceStatus === 'ACTIVE';
	}

	// Step 4 (Success): Always allow (final step)
	if (currentStep === 4) {
		return true;
	}

	// Unknown step
	return false;
}

// ============================================================================
// COMPONENT TYPE HELPERS
// ============================================================================

/**
 * Check if device type requires a custom component
 * (as opposed to using DynamicFormRenderer)
 *
 * @param deviceType - Device type to check
 * @returns True if device type has a custom component
 *
 * Custom components:
 * - TOTP: QR code display, manual entry
 * - FIDO2: WebAuthn ceremony
 * - MOBILE: QR code pairing
 *
 * Dynamic form renderer:
 * - SMS: Phone number input
 * - EMAIL: Email address input
 * - WHATSAPP: Phone number + email input
 */
export function requiresCustomComponent(deviceType: DeviceConfigKey): boolean {
	const customComponentTypes: DeviceConfigKey[] = ['TOTP', 'FIDO2', 'MOBILE'];
	return customComponentTypes.includes(deviceType);
}

/**
 * Check if device type requires OTP validation
 *
 * @param deviceType - Device type to check
 * @returns True if device type uses OTP
 */
export function requiresOTPValidation(deviceType: DeviceConfigKey): boolean {
	const otpTypes: DeviceConfigKey[] = ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP'];
	return otpTypes.includes(deviceType);
}

// ============================================================================
// DISPLAY FORMATTING HELPERS
// ============================================================================

/**
 * Format device display name for UI
 *
 * @param config - Device flow configuration
 * @param deviceData - Device data from API (optional)
 * @returns Formatted display name
 *
 * @example
 * formatDeviceDisplayName(smsConfig) // "SMS Device"
 * formatDeviceDisplayName(smsConfig, { nickname: "My Phone" }) // "My Phone (SMS)"
 * formatDeviceDisplayName(smsConfig, { phone: "+1.5125201234" }) // "+1.5125201234 (SMS)"
 */
export function formatDeviceDisplayName(
	config: DeviceFlowConfig,
	deviceData?: {
		name?: string;
		nickname?: string;
		phone?: string;
		email?: string;
		[key: string]: any;
	}
): string {
	// If no device data, return config display name
	if (!deviceData) {
		return config.displayName;
	}

	// Prefer nickname, then name, then contact info
	const displayName =
		deviceData.nickname ||
		deviceData.name ||
		deviceData.phone ||
		deviceData.email ||
		config.displayName;

	// Add device type in parentheses if using contact info
	if (deviceData.phone || deviceData.email) {
		return `${displayName} (${config.displayName})`;
	}

	return displayName;
}

/**
 * Format device contact information for display
 *
 * @param deviceType - Device type
 * @param deviceData - Device data from API
 * @returns Formatted contact information or null
 *
 * @example
 * formatDeviceContact('SMS', { phone: '+1.5125201234' }) // "+1 (512) 520-1234"
 * formatDeviceContact('EMAIL', { email: 'user@example.com' }) // "user@example.com"
 * formatDeviceContact('TOTP', {}) // null
 */
export function formatDeviceContact(
	deviceType: DeviceConfigKey,
	deviceData: { phone?: string; email?: string; [key: string]: any }
): string | null {
	switch (deviceType) {
		case 'SMS':
		case 'WHATSAPP':
			if (deviceData.phone) {
				// Format: +1.5125201234 -> +1 (512) 520-1234
				const cleaned = deviceData.phone.replace(/[^\d+.]/g, '');
				const parts = cleaned.split('.');
				if (parts.length === 2) {
					const countryCode = parts[0];
					const number = parts[1];
					// Format US numbers as (XXX) XXX-XXXX
					if (number.length === 10) {
						return `${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
					}
					return `${countryCode} ${number}`;
				}
				return deviceData.phone;
			}
			return null;

		case 'EMAIL':
			return deviceData.email || null;

		case 'TOTP':
			return 'Authenticator App';

		case 'FIDO2':
			return 'Security Key / Biometric';

		case 'MOBILE':
			return 'PingOne Mobile App';

		default:
			return null;
	}
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Get validation error message for a field
 *
 * @param fieldName - Field name
 * @param value - Field value
 * @returns Error message or null if valid
 */
export function getFieldValidationError(fieldName: string, value: string): string | null {
	if (!value || !value.trim()) {
		return `${fieldName} is required`;
	}

	switch (fieldName) {
		case 'email': {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(value)) {
				return 'Invalid email address';
			}
			break;
		}

		case 'phoneNumber': {
			const cleanedPhone = value.replace(/[^\d]/g, '');
			if (cleanedPhone.length < 10) {
				return 'Phone number must be at least 10 digits';
			}
			break;
		}

		case 'deviceName':
			if (value.length > 50) {
				return 'Device name must be 50 characters or less';
			}
			break;

		case 'nickname':
			if (value.length > 100) {
				return 'Nickname must be 100 characters or less';
			}
			break;
	}

	return null;
}

/**
 * Validate all required fields for a device type
 *
 * @param config - Device flow configuration
 * @param values - Field values
 * @returns Map of field name to error message
 */
export function validateDeviceFields(
	config: DeviceFlowConfig,
	values: Record<string, string>
): Record<string, string> {
	const errors: Record<string, string> = {};

	// Validate required fields
	config.requiredFields.forEach((field) => {
		const value = values[field];
		const error = getFieldValidationError(field, value);
		if (error) {
			errors[field] = error;
		}
	});

	// Validate optional fields (only if they have a value)
	config.optionalFields.forEach((field) => {
		const value = values[field];
		if (value?.trim()) {
			const error = getFieldValidationError(field, value);
			if (error) {
				errors[field] = error;
			}
		}
	});

	return errors;
}

/**
 * Check if all required fields are valid
 *
 * @param config - Device flow configuration
 * @param values - Field values
 * @returns True if all required fields are valid
 */
export function areRequiredFieldsValid(
	config: DeviceFlowConfig,
	values: Record<string, string>
): boolean {
	const errors = validateDeviceFields(config, values);
	const requiredFieldErrors = config.requiredFields.filter((field) => errors[field]);
	return requiredFieldErrors.length === 0;
}
