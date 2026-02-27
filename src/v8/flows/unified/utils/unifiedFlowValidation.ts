/**
 * @file unifiedFlowValidation.ts
 * @module v8/flows/unified/utils
 * @description Validation utilities for unified MFA registration flow
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Centralized validation logic for the unified flow:
 * - Required field validation
 * - Config-driven validation rules
 * - Step-specific validation
 * - Cross-field validation
 */

import type { DeviceFlowConfig, ValidationResult } from '@/v8/config/deviceFlowConfigTypes';
import type { MFACredentials } from '@/v8/flows/shared/MFATypes';

const MODULE_TAG = '[✅ UNIFIED-FLOW-VALIDATION]';

// ============================================================================
// FIELD VALIDATION
// ============================================================================

/**
 * Validate all required fields are present and non-empty
 *
 * @param config - Device flow configuration
 * @param values - Current field values
 * @returns Validation result with errors by field name
 *
 * @example
 * const result = validateRequiredFields(smsConfig, { phoneNumber: '', countryCode: '+1' });
 * // result = { valid: false, errors: { phoneNumber: 'Phone number is required' } }
 */
export function validateRequiredFields(
	config: DeviceFlowConfig,
	values: Record<string, string>
): { valid: boolean; errors: Record<string, string> } {
	console.log(`${MODULE_TAG} Validating required fields for ${config.deviceType}`);

	const errors: Record<string, string> = {};

	// Check each required field
	config.requiredFields.forEach((fieldName) => {
		const value = values[fieldName];

		if (!value || !value.trim()) {
			errors[fieldName] = `${formatFieldName(fieldName)} is required`;
		}
	});

	const valid = Object.keys(errors).length === 0;

	console.log(`${MODULE_TAG} Required fields validation:`, {
		valid,
		errorCount: Object.keys(errors).length,
	});

	return { valid, errors };
}

/**
 * Run all validation rules from config
 *
 * @param config - Device flow configuration
 * @param values - Current field values
 * @returns Map of field name to validation result
 *
 * @example
 * const results = runValidationRules(smsConfig, { phoneNumber: '123' });
 * // results = { phoneNumber: { valid: false, error: 'Phone number must be at least 10 digits' } }
 */
export function runValidationRules(
	config: DeviceFlowConfig,
	values: Record<string, string>
): Record<string, ValidationResult> {
	console.log(`${MODULE_TAG} Running validation rules for ${config.deviceType}`);

	const results: Record<string, ValidationResult> = {};

	// Run validation rules for each field that has a validator
	Object.entries(config.validationRules).forEach(([fieldName, validator]) => {
		const value = values[fieldName] || '';
		results[fieldName] = validator(value);
	});

	return results;
}

/**
 * Validate all fields using config-driven rules
 *
 * @param config - Device flow configuration
 * @param values - Current field values
 * @returns Combined validation result
 */
export function validateAllFields(
	config: DeviceFlowConfig,
	values: Record<string, string>
): { valid: boolean; errors: Record<string, string>; warnings: Record<string, string> } {
	console.log(`${MODULE_TAG} Validating all fields for ${config.deviceType}`);

	const errors: Record<string, string> = {};
	const warnings: Record<string, string> = {};

	// Run validation rules
	const validationResults = runValidationRules(config, values);

	// Extract errors and warnings
	Object.entries(validationResults).forEach(([fieldName, result]) => {
		if (!result.valid && result.error) {
			errors[fieldName] = result.error;
		}
		if (result.warning) {
			warnings[fieldName] = result.warning;
		}
	});

	const valid = Object.keys(errors).length === 0;

	console.log(`${MODULE_TAG} All fields validation:`, {
		valid,
		errorCount: Object.keys(errors).length,
		warningCount: Object.keys(warnings).length,
	});

	return { valid, errors, warnings };
}

// ============================================================================
// STEP-SPECIFIC VALIDATION
// ============================================================================

/**
 * Validate Step 0 (Configuration) credentials
 *
 * @param credentials - MFA credentials
 * @param tokenStatus - Token status information
 * @returns Validation result
 */
export function validateConfigurationStep(
	credentials: MFACredentials,
	tokenStatus: { isValid: boolean; [key: string]: unknown }
): { valid: boolean; errors: string[] } {
	console.log(`${MODULE_TAG} Validating configuration step`);

	const errors: string[] = [];

	// Environment ID
	if (!credentials.environmentId?.trim()) {
		errors.push('Environment ID is required');
	}

	// Username
	if (!credentials.username?.trim()) {
		errors.push('Username is required');
	}

	// Device Authentication Policy ID
	if (!credentials.deviceAuthenticationPolicyId?.trim()) {
		errors.push('Device Authentication Policy ID is required');
	}

	// Token validation based on token type
	const tokenType = credentials.tokenType || 'worker';
	const isTokenValid =
		tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim();

	if (!isTokenValid) {
		errors.push(`${tokenType === 'worker' ? 'Worker' : 'User'} token is required`);
	}

	const valid = errors.length === 0;

	console.log(`${MODULE_TAG} Configuration validation:`, { valid, errorCount: errors.length });

	return { valid, errors };
}

/**
 * Validate Step 2 (Registration) device fields
 *
 * @param config - Device flow configuration
 * @param values - Field values
 * @returns Validation result
 */
export function validateRegistrationStep(
	config: DeviceFlowConfig,
	values: Record<string, string>
): { valid: boolean; errors: Record<string, string> } {
	console.log(`${MODULE_TAG} Validating registration step for ${config.deviceType}`);

	// Validate using config-driven rules
	const { valid, errors } = validateAllFields(config, values);

	return { valid, errors };
}

/**
 * Validate Step 3 (Activation) OTP code
 *
 * @param otp - OTP code to validate
 * @returns Validation result
 */
export function validateActivationOTP(otp: string): { valid: boolean; error?: string } {
	console.log(`${MODULE_TAG} Validating OTP code`);

	// OTP must be exactly 6 digits
	if (!otp || otp.length !== 6) {
		return { valid: false, error: 'OTP must be 6 digits' };
	}

	// OTP must contain only digits
	if (!/^\d{6}$/.test(otp)) {
		return { valid: false, error: 'OTP must contain only numbers' };
	}

	return { valid: true };
}

// ============================================================================
// CROSS-FIELD VALIDATION
// ============================================================================

/**
 * Validate WhatsApp fields (requires either phone or email)
 *
 * @param values - Field values
 * @returns Validation result
 */
export function validateWhatsAppFields(values: Record<string, string>): {
	valid: boolean;
	errors: Record<string, string>;
} {
	const errors: Record<string, string> = {};

	const hasPhone = !!values.phoneNumber?.trim();
	const hasEmail = !!values.email?.trim();

	// WhatsApp requires either phone or email (or both)
	if (!hasPhone && !hasEmail) {
		errors.phoneNumber = 'Phone number or email is required';
		errors.email = 'Phone number or email is required';
	}

	return {
		valid: Object.keys(errors).length === 0,
		errors,
	};
}

/**
 * Check if can proceed to next step
 *
 * @param currentStep - Current step index (0-4)
 * @param config - Device flow configuration
 * @param credentials - MFA credentials
 * @param mfaState - Current MFA state
 * @param tokenStatus - Token status
 * @returns True if can proceed
 */
export function canProceedToNextStep(
	currentStep: number,
	_config: DeviceFlowConfig,
	credentials: MFACredentials,
	mfaState: { deviceId?: string; deviceStatus?: string; [key: string]: unknown },
	tokenStatus: { isValid: boolean; [key: string]: unknown }
): boolean {
	console.log(`${MODULE_TAG} Checking if can proceed from step ${currentStep}`);

	switch (currentStep) {
		case 0: {
			// Configuration step
			const { valid } = validateConfigurationStep(credentials, tokenStatus);
			return valid;
		}

		case 1: {
			// Device selection step - always allow
			return true;
		}

		case 2: {
			// Registration step - must have device ID
			return !!mfaState.deviceId;
		}

		case 3: {
			// Activation step - must have active device
			return mfaState.deviceStatus === 'ACTIVE';
		}

		case 4: {
			// Success step - final step
			return true;
		}

		default: {
			console.warn(`${MODULE_TAG} Unknown step: ${currentStep}`);
			return false;
		}
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format field name for display in error messages
 *
 * @param fieldName - Field name (camelCase)
 * @returns Formatted field name (Title Case)
 *
 * @example
 * formatFieldName('phoneNumber') // "Phone Number"
 * formatFieldName('email') // "Email"
 */
function formatFieldName(fieldName: string): string {
	// Special cases
	const specialCases: Record<string, string> = {
		phoneNumber: 'Phone Number',
		countryCode: 'Country Code',
		deviceName: 'Device Name',
		email: 'Email Address',
		nickname: 'Nickname',
	};

	if (specialCases[fieldName]) {
		return specialCases[fieldName];
	}

	// Convert camelCase to Title Case
	return fieldName
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

/**
 * Combine multiple error objects into one
 *
 * @param errorObjects - Array of error objects
 * @returns Combined error object
 */
export function combineErrors(
	...errorObjects: Array<Record<string, string>>
): Record<string, string> {
	return Object.assign({}, ...errorObjects);
}

/**
 * Convert error object to array of error messages
 *
 * @param errors - Error object (field name → error message)
 * @returns Array of error messages
 */
export function errorsToArray(errors: Record<string, string>): string[] {
	return Object.values(errors).filter((error) => !!error);
}

/**
 * Check if error object has any errors
 *
 * @param errors - Error object
 * @returns True if has errors
 */
export function hasErrors(errors: Record<string, string>): boolean {
	return Object.keys(errors).length > 0;
}
