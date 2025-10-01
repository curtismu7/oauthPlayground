import { errorHandler } from './errorHandler';

// Validation result interface
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export interface ValidationError {
	field: string;
	code: string;
	message: string;
	value?: unknown;
}

export interface ValidationWarning {
	field: string;
	code: string;
	message: string;
	value?: unknown;
}

// Validation rules interface
export interface ValidationRule {
	field: string;
	rules: ValidationRuleConfig[];
}

export interface ValidationRuleConfig {
	type: 'required' | 'email' | 'url' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
	value?: unknown;
	message?: string;
	validator?: (value: unknown) => boolean;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
	EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
	CLIENT_ID: /^[a-zA-Z0-9\-_]+$/,
	ENVIRONMENT_ID: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
	SCOPE: /^[a-zA-Z0-9\s\-_\.]+$/,
	STATE: /^[a-zA-Z0-9\-_]+$/,
	NONCE: /^[a-zA-Z0-9\-_]+$/,
	CODE_VERIFIER: /^[A-Za-z0-9\-._~]{43,128}$/,
	CODE_CHALLENGE: /^[A-Za-z0-9\-._~]{43,128}$/,
};

// Validation error messages
export const VALIDATION_MESSAGES = {
	REQUIRED: 'This field is required',
	EMAIL: 'Please enter a valid email address',
	URL: 'Please enter a valid URL',
	MIN_LENGTH: 'Must be at least {min} characters long',
	MAX_LENGTH: 'Must be no more than {max} characters long',
	PATTERN: 'Invalid format',
	CUSTOM: 'Invalid value',
	CLIENT_ID: 'Client ID must contain only letters, numbers, hyphens, and underscores',
	ENVIRONMENT_ID: 'Environment ID must be a valid UUID',
	SCOPE: 'Scope must contain only letters, numbers, spaces, hyphens, underscores, and dots',
	STATE: 'State must contain only letters, numbers, hyphens, and underscores',
	NONCE: 'Nonce must contain only letters, numbers, hyphens, and underscores',
	CODE_VERIFIER:
		'Code verifier must be 43-128 characters and contain only A-Z, a-z, 0-9, -, ., _, ~',
	CODE_CHALLENGE:
		'Code challenge must be 43-128 characters and contain only A-Z, a-z, 0-9, -, ., _, ~',
};

// Main validation class
export class Validator {
	private rules: ValidationRule[] = [];
	private customValidators: Map<string, (value: unknown) => boolean> = new Map();

	// Add validation rule
	addRule(rule: ValidationRule): Validator {
		this.rules.push(rule);
		return this;
	}

	// Add multiple rules
	addRules(rules: ValidationRule[]): Validator {
		this.rules.push(...rules);
		return this;
	}

	// Add custom validator
	addCustomValidator(name: string, validator: (value: unknown) => boolean): Validator {
		this.customValidators.set(name, validator);
		return this;
	}

	// Validate data
	validate(data: Record<string, unknown>): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		for (const rule of this.rules) {
			const value = data[rule.field];

			for (const ruleConfig of rule.rules) {
				const result = this.validateField(value, ruleConfig, rule.field);

				if (result.error) {
					errors.push(result.error);
				}

				if (result.warning) {
					warnings.push(result.warning);
				}
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	// Validate single field
	private validateField(
		value: unknown,
		ruleConfig: ValidationRuleConfig,
		field: string
	): { error?: ValidationError; warning?: ValidationWarning } {
		const { type, value: ruleValue, message, validator } = ruleConfig;

		switch (type) {
			case 'required':
				if (this.isEmpty(value)) {
					return {
						error: {
							field,
							code: 'REQUIRED',
							message: message || VALIDATION_MESSAGES.REQUIRED,
							value,
						},
					};
				}
				break;

			case 'email':
				if (
					!this.isEmpty(value) &&
					typeof value === 'string' &&
					!VALIDATION_PATTERNS.EMAIL.test(value)
				) {
					return {
						error: {
							field,
							code: 'EMAIL',
							message: message || VALIDATION_MESSAGES.EMAIL,
							value,
						},
					};
				}
				break;

			case 'url':
				if (
					!this.isEmpty(value) &&
					typeof value === 'string' &&
					!VALIDATION_PATTERNS.URL.test(value)
				) {
					return {
						error: {
							field,
							code: 'URL',
							message: message || VALIDATION_MESSAGES.URL,
							value,
						},
					};
				}
				break;

			case 'minLength':
				if (
					!this.isEmpty(value) &&
					typeof value === 'string' &&
					value.length < (ruleValue as number)
				) {
					return {
						error: {
							field,
							code: 'MIN_LENGTH',
							message: message || VALIDATION_MESSAGES.MIN_LENGTH.replace('{min}', ruleValue),
							value,
						},
					};
				}
				break;

			case 'maxLength':
				if (
					!this.isEmpty(value) &&
					typeof value === 'string' &&
					value.length > (ruleValue as number)
				) {
					return {
						error: {
							field,
							code: 'MAX_LENGTH',
							message: message || VALIDATION_MESSAGES.MAX_LENGTH.replace('{max}', ruleValue),
							value,
						},
					};
				}
				break;

			case 'pattern':
				if (
					!this.isEmpty(value) &&
					typeof value === 'string' &&
					!(ruleValue as RegExp).test(value)
				) {
					return {
						error: {
							field,
							code: 'PATTERN',
							message: message || VALIDATION_MESSAGES.PATTERN,
							value,
						},
					};
				}
				break;

			case 'custom':
				if (validator && !validator(value)) {
					return {
						error: {
							field,
							code: 'CUSTOM',
							message: message || VALIDATION_MESSAGES.CUSTOM,
							value,
						},
					};
				}
				break;
		}

		return {};
	}

	// Check if value is empty
	private isEmpty(value: unknown): boolean {
		return (
			value === null ||
			value === undefined ||
			value === '' ||
			(Array.isArray(value) && value.length === 0) ||
			(typeof value === 'object' && Object.keys(value).length === 0)
		);
	}

	// Clear all rules
	clear(): Validator {
		this.rules = [];
		this.customValidators.clear();
		return this;
	}
}

// OAuth-specific validation functions
export const validateOAuthConfig = (config: Record<string, unknown>): ValidationResult => {
	const validator = new Validator();

	validator.addRules([
		{
			field: 'clientId',
			rules: [
				{ type: 'required' },
				{
					type: 'pattern',
					value: VALIDATION_PATTERNS.CLIENT_ID,
					message: VALIDATION_MESSAGES.CLIENT_ID,
				},
			],
		},
		{
			field: 'redirectUri',
			rules: [{ type: 'required' }, { type: 'url', message: VALIDATION_MESSAGES.URL }],
		},
		{
			field: 'scope',
			rules: [
				{ type: 'required' },
				{ type: 'pattern', value: VALIDATION_PATTERNS.SCOPE, message: VALIDATION_MESSAGES.SCOPE },
			],
		},
		{
			field: 'environmentId',
			rules: [
				{ type: 'required' },
				{
					type: 'pattern',
					value: VALIDATION_PATTERNS.ENVIRONMENT_ID,
					message: VALIDATION_MESSAGES.ENVIRONMENT_ID,
				},
			],
		},
	]);

	return validator.validate(config);
};

export const validateTokenRequest = (request: Record<string, unknown>): ValidationResult => {
	const validator = new Validator();

	validator.addRules([
		{
			field: 'grant_type',
			rules: [
				{ type: 'required' },
				{
					type: 'custom',
					validator: (value) =>
						['authorization_code', 'client_credentials', 'refresh_token', 'device_code'].includes(
							value
						),
				},
			],
		},
		{
			field: 'client_id',
			rules: [
				{ type: 'required' },
				{
					type: 'pattern',
					value: VALIDATION_PATTERNS.CLIENT_ID,
					message: VALIDATION_MESSAGES.CLIENT_ID,
				},
			],
		},
	]);

	// Add conditional validation based on grant type
	if (request.grant_type === 'authorization_code') {
		validator.addRule({
			field: 'code',
			rules: [{ type: 'required' }],
		});
	}

	if (request.grant_type === 'refresh_token') {
		validator.addRule({
			field: 'refresh_token',
			rules: [{ type: 'required' }],
		});
	}

	return validator.validate(request);
};

export const validateAuthorizationRequest = (
	request: Record<string, unknown>
): ValidationResult => {
	const validator = new Validator();

	validator.addRules([
		{
			field: 'client_id',
			rules: [
				{ type: 'required' },
				{
					type: 'pattern',
					value: VALIDATION_PATTERNS.CLIENT_ID,
					message: VALIDATION_MESSAGES.CLIENT_ID,
				},
			],
		},
		{
			field: 'redirect_uri',
			rules: [{ type: 'required' }, { type: 'url', message: VALIDATION_MESSAGES.URL }],
		},
		{
			field: 'response_type',
			rules: [
				{ type: 'required' },
				{
					type: 'custom',
					validator: (value) =>
						[
							'code',
							'token',
							'id_token',
							'code token',
							'code id_token',
							'token id_token',
							'code token id_token',
						].includes(value),
				},
			],
		},
		{
			field: 'scope',
			rules: [
				{ type: 'required' },
				{ type: 'pattern', value: VALIDATION_PATTERNS.SCOPE, message: VALIDATION_MESSAGES.SCOPE },
			],
		},
	]);

	// Optional fields validation
	if (request.state) {
		validator.addRule({
			field: 'state',
			rules: [
				{ type: 'pattern', value: VALIDATION_PATTERNS.STATE, message: VALIDATION_MESSAGES.STATE },
			],
		});
	}

	if (request.nonce) {
		validator.addRule({
			field: 'nonce',
			rules: [
				{ type: 'pattern', value: VALIDATION_PATTERNS.NONCE, message: VALIDATION_MESSAGES.NONCE },
			],
		});
	}

	if (request.code_challenge) {
		validator.addRule({
			field: 'code_challenge',
			rules: [
				{
					type: 'pattern',
					value: VALIDATION_PATTERNS.CODE_CHALLENGE,
					message: VALIDATION_MESSAGES.CODE_CHALLENGE,
				},
			],
		});
	}

	return validator.validate(request);
};

// Form validation utilities
export const validateForm = (
	formData: Record<string, unknown>,
	rules: ValidationRule[]
): ValidationResult => {
	const validator = new Validator();
	validator.addRules(rules);
	return validator.validate(formData);
};

// Sanitization functions
export const sanitizeInput = (input: string): string => {
	if (typeof input !== 'string') return input;

	return input
		.trim()
		.replace(/[<>]/g, '') // Remove potential HTML tags
		.replace(/javascript:/gi, '') // Remove javascript: protocol
		.replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeUrl = (url: string): string => {
	if (typeof url !== 'string') return url;

	try {
		const parsedUrl = new URL(url);

		// Only allow http and https protocols
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			throw new Error('Invalid protocol');
		}

		return parsedUrl.toString();
	} catch (error) {
		errorHandler.handleError(error, 'URL sanitization');
		return '';
	}
};

export const sanitizeOAuthConfig = (config: Record<string, unknown>): Record<string, unknown> => {
	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(config)) {
		if (typeof value === 'string') {
			sanitized[key] = sanitizeInput(value);
		} else {
			sanitized[key] = value;
		}
	}

	return sanitized;
};

// Validation with error handling
export const validateWithErrorHandling = <T>(
	data: T,
	validator: Validator,
	context: string
): ValidationResult => {
	try {
		return validator.validate(data as Record<string, unknown>);
	} catch (error) {
		errorHandler.handleError(error, `Validation error in ${context}`);
		return {
			isValid: false,
			errors: [
				{
					field: 'validation',
					code: 'VALIDATION_ERROR',
					message: 'Validation failed due to an internal error',
				},
			],
			warnings: [],
		};
	}
};

export default {
	Validator,
	validateOAuthConfig,
	validateTokenRequest,
	validateAuthorizationRequest,
	validateForm,
	sanitizeInput,
	sanitizeUrl,
	sanitizeOAuthConfig,
	validateWithErrorHandling,
	VALIDATION_PATTERNS,
	VALIDATION_MESSAGES,
};
