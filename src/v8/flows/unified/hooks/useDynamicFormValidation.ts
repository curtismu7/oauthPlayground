/**
 * @file useDynamicFormValidation.ts
 * @module v8/flows/unified/hooks
 * @description Dynamic form validation hook using deviceFlowConfigs validation rules
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Validate device-specific form fields using config-driven validation rules
 * from deviceFlowConfigs.ts
 *
 * @example
 * const { errors, warnings, isValid, validate, validateField } =
 *   useDynamicFormValidation(config, deviceFields);
 *
 * // Validate all fields
 * if (validate()) {
 *   console.log('All fields valid!');
 * }
 *
 * // Validate single field
 * const fieldValid = validateField('phoneNumber');
 */

import { useCallback, useEffect, useState } from 'react';
import { areRequiredFieldsValid, validateDeviceFields } from '@/v8/config/deviceFlowConfigs';
import type { DeviceFlowConfig, ValidationResult } from '@/v8/config/deviceFlowConfigTypes';

const MODULE_TAG = '[🪝 USE-DYNAMIC-FORM-VALIDATION]';

/**
 * Dynamic form validation hook
 *
 * @param config - Device flow configuration
 * @param values - Current field values
 * @param options - Validation options
 * @returns Validation state and methods
 */
export const useDynamicFormValidation = (
	config: DeviceFlowConfig,
	values: Record<string, string>,
	options: {
		/** Validate on mount */
		validateOnMount?: boolean;
		/** Validate on change */
		validateOnChange?: boolean;
	} = {}
) => {
	const { validateOnMount = false, validateOnChange = true } = options;

	// ========================================================================
	// STATE
	// ========================================================================

	// Validation errors (field name → error message)
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Validation warnings (field name → warning message)
	const [warnings, setWarnings] = useState<Record<string, string>>({});

	// Overall validation status
	const [isValid, setIsValid] = useState(false);

	// Touched fields (to avoid showing errors before user interacts)
	const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

	// ========================================================================
	// VALIDATION FUNCTIONS
	// ========================================================================

	/**
	 * Validate a single field
	 *
	 * @param fieldName - Name of field to validate
	 * @returns Validation result
	 */
	const validateField = useCallback(
		(fieldName: string): ValidationResult => {
			const validator = config.validationRules[fieldName];
			const value = values[fieldName] || '';

			if (!validator) {
				console.warn(`${MODULE_TAG} No validator found for field:`, fieldName);
				return { valid: true };
			}

			const result = validator(value);
			console.log(`${MODULE_TAG} Validated field ${fieldName}:`, result);

			return result;
		},
		[config, values]
	);

	/**
	 * Validate all fields
	 *
	 * @returns True if all fields valid
	 */
	const validate = useCallback((): boolean => {
		console.log(`${MODULE_TAG} Validating all fields for device:`, config.deviceType);

		// Use helper from deviceFlowConfigs to validate all fields
		const validationResults = validateDeviceFields(config.deviceType, values);

		const newErrors: Record<string, string> = {};
		const newWarnings: Record<string, string> = {};

		// Process validation results
		Object.entries(validationResults).forEach(([field, result]) => {
			if (!result.valid && result.error) {
				newErrors[field] = result.error;
			}
		});

		// Check if all required fields are valid
		const allValid = areRequiredFieldsValid(config.deviceType, values);

		console.log(`${MODULE_TAG} Validation complete:`, {
			allValid,
			errorCount: Object.keys(newErrors).length,
			warningCount: Object.keys(newWarnings).length,
		});

		setErrors(newErrors);
		setWarnings(newWarnings);
		setIsValid(allValid && Object.keys(newErrors).length === 0);

		return allValid && Object.keys(newErrors).length === 0;
	}, [config, values]);

	/**
	 * Validate only touched fields
	 * (Useful to avoid showing errors before user interacts)
	 */
	const validateTouchedFields = useCallback((): boolean => {
		console.log(`${MODULE_TAG} Validating touched fields:`, Array.from(touchedFields));

		const validationResults = validateDeviceFields(config.deviceType, values);
		const newErrors: Record<string, string> = {};

		// Only include errors for touched fields
		Object.entries(validationResults).forEach(([field, result]) => {
			if (touchedFields.has(field) && !result.valid && result.error) {
				newErrors[field] = result.error;
			}
		});

		setErrors(newErrors);

		// Check overall validity (all fields, not just touched)
		const allValid = areRequiredFieldsValid(config.deviceType, values);
		setIsValid(allValid && Object.keys(newErrors).length === 0);

		return allValid;
	}, [config, values, touchedFields]);

	/**
	 * Mark a field as touched
	 */
	const touchField = useCallback((fieldName: string) => {
		console.log(`${MODULE_TAG} Field touched:`, fieldName);
		setTouchedFields((prev) => new Set([...prev, fieldName]));
	}, []);

	/**
	 * Mark multiple fields as touched
	 */
	const touchFields = useCallback((fieldNames: string[]) => {
		console.log(`${MODULE_TAG} Fields touched:`, fieldNames);
		setTouchedFields((prev) => new Set([...prev, ...fieldNames]));
	}, []);

	/**
	 * Clear errors for a specific field
	 */
	const clearFieldError = useCallback((fieldName: string) => {
		console.log(`${MODULE_TAG} Clearing error for field:`, fieldName);
		setErrors((prev) => {
			const newErrors = { ...prev };
			delete newErrors[fieldName];
			return newErrors;
		});
	}, []);

	/**
	 * Clear all errors
	 */
	const clearErrors = useCallback(() => {
		console.log(`${MODULE_TAG} Clearing all errors`);
		setErrors({});
		setWarnings({});
	}, []);

	/**
	 * Reset validation state
	 */
	const reset = useCallback(() => {
		console.log(`${MODULE_TAG} Resetting validation state`);
		setErrors({});
		setWarnings({});
		setIsValid(false);
		setTouchedFields(new Set());
	}, []);

	// ========================================================================
	// EFFECTS
	// ========================================================================

	// Validate on mount if requested
	useEffect(() => {
		if (validateOnMount) {
			console.log(`${MODULE_TAG} Validating on mount`);
			validate();
		}
	}, [validate, validateOnMount]); // Only run once on mount

	// Validate on change if requested
	useEffect(() => {
		if (validateOnChange && touchedFields.size > 0) {
			console.log(`${MODULE_TAG} Validating on change`);
			validateTouchedFields();
		}
	}, [validateOnChange, validateTouchedFields, touchedFields]);

	// ========================================================================
	// RETURN
	// ========================================================================

	return {
		// Validation state
		errors,
		warnings,
		isValid,
		touchedFields,

		// Validation methods
		validate,
		validateField,
		validateTouchedFields,

		// Touch tracking
		touchField,
		touchFields,

		// Error management
		clearFieldError,
		clearErrors,
		reset,
	};
};

export default useDynamicFormValidation;
