/**
 * @file useFormValidation.ts
 * @module v8/hooks
 * @description Real-time form validation hook
 * @version 9.1.0
 */

import { useState, useCallback } from 'react';

interface ValidationRule {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	custom?: (value: string) => string | null;
}

interface FieldConfig {
	[key: string]: ValidationRule;
}

export const useFormValidation = <T extends Record<string, string>>(
	initialValues: T,
	config: FieldConfig
) => {
	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

	const validateField = useCallback(
		(name: keyof T, value: string): string | null => {
			const rules = config[name as string];
			if (!rules) return null;

			if (rules.required && !value.trim()) {
				return 'This field is required';
			}

			if (rules.minLength && value.length < rules.minLength) {
				return `Minimum ${rules.minLength} characters required`;
			}

			if (rules.maxLength && value.length > rules.maxLength) {
				return `Maximum ${rules.maxLength} characters allowed`;
			}

			if (rules.pattern && !rules.pattern.test(value)) {
				return 'Invalid format';
			}

			if (rules.custom) {
				return rules.custom(value);
			}

			return null;
		},
		[config]
	);

	const handleChange = useCallback(
		(name: keyof T, value: string) => {
			setValues((prev) => ({ ...prev, [name]: value }));

			// Validate on change if field was touched
			if (touched[name]) {
				const error = validateField(name, value);
				setErrors((prev) => ({ ...prev, [name]: error || undefined }));
			}
		},
		[touched, validateField]
	);

	const handleBlur = useCallback(
		(name: keyof T) => {
			setTouched((prev) => ({ ...prev, [name]: true }));
			const error = validateField(name, values[name]);
			setErrors((prev) => ({ ...prev, [name]: error || undefined }));
		},
		[values, validateField]
	);

	const validateAll = useCallback((): boolean => {
		const newErrors: Partial<Record<keyof T, string>> = {};
		let isValid = true;

		Object.keys(config).forEach((key) => {
			const error = validateField(key as keyof T, values[key as keyof T]);
			if (error) {
				newErrors[key as keyof T] = error;
				isValid = false;
			}
		});

		setErrors(newErrors);
		setTouched(
			Object.keys(config).reduce((acc, key) => ({ ...acc, [key]: true }), {})
		);

		return isValid;
	}, [config, values, validateField]);

	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
		setTouched({});
	}, [initialValues]);

	return {
		values,
		errors,
		touched,
		handleChange,
		handleBlur,
		validateAll,
		reset,
		setValues,
	};
};
