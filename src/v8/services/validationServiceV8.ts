/**
 * @file validationServiceV8.ts
 * @module v8/services
 * @description Centralized validation service for all V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides validation rules for credentials, scopes, URLs, and other OAuth/OIDC
 * parameters. Used by step navigation to determine when users can proceed.
 *
 * @example
 * // Validate credentials
 * const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 *
 * // Validate single field
 * const uuidResult = ValidationServiceV8.validateUUID(environmentId, 'Environment ID');
 */

const MODULE_TAG = '[✅ VALIDATION-V8]';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	canProceed: boolean;
}

export interface ValidationError {
	field: string;
	message: string;
	suggestion?: string;
	code?: string;
}

export interface ValidationWarning {
	field: string;
	message: string;
	canProceed: boolean;
	severity: 'low' | 'medium' | 'high';
}

export interface CredentialValidationRules {
	required: boolean;
	pattern?: RegExp;
	minLength?: number;
	maxLength?: number;
	customValidator?: (value: unknown) => ValidationResult;
	message?: string;
	example?: string;
}

// ============================================================================
// VALIDATION RULES REGISTRY
// ============================================================================

const VALIDATION_RULES: Record<string, CredentialValidationRules> = {
	environmentId: {
		required: true,
		pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		message: 'Must be a valid UUID (36 characters with dashes)',
		example: '12345678-1234-1234-1234-123456789012',
	},
	clientId: {
		required: true,
		minLength: 1,
		message: 'Client ID is required',
	},
	clientSecret: {
		required: false, // Optional for public clients
		minLength: 1,
		message: 'Client Secret is required for confidential clients',
	},
	redirectUri: {
		required: true,
		pattern: /^https?:\/\/.+/,
		message: 'Must be a valid HTTP(S) URL',
		example: 'http://localhost:3000/callback',
	},
	issuer: {
		required: false, // Optional, used for OIDC Discovery
		pattern: /^https:\/\/.+/,
		message: 'Issuer must be a valid HTTPS URL',
		example: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
	},
	scopes: {
		required: true,
		minLength: 1,
		message: 'At least one scope is required',
	},
	authorizationEndpoint: {
		required: false, // Can be discovered
		pattern: /^https?:\/\/.+/,
		message: 'Must be a valid HTTP(S) URL',
	},
	tokenEndpoint: {
		required: false, // Can be discovered
		pattern: /^https?:\/\/.+/,
		message: 'Must be a valid HTTP(S) URL',
	},
};

// ============================================================================
// REQUIRED FIELDS BY FLOW TYPE
// ============================================================================

const REQUIRED_FIELDS: Record<string, string[]> = {
	oauth: ['environmentId', 'clientId', 'redirectUri', 'scopes'],
	oidc: [
		'environmentId',
		'clientId',
		'redirectUri',
		'scopes', // Must include 'openid'
	],
	authorization_code: ['environmentId', 'clientId', 'redirectUri', 'scopes'],
	implicit: ['environmentId', 'clientId', 'redirectUri', 'scopes'],
	client_credentials: ['environmentId', 'clientId', 'clientSecret', 'scopes'],
	device_code: ['environmentId', 'clientId', 'scopes'],
};

// ============================================================================
// VALIDATION SERVICE CLASS
// ============================================================================

export class ValidationServiceV8 {
	/**
	 * Validate complete credentials object
	 * @param credentials - Credentials to validate
	 * @param flowType - Flow type ('oauth' | 'oidc')
	 * @returns Validation result with errors and warnings
	 * @example
	 * const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');
	 */
	static validateCredentials(
		credentials: Partial<Record<string, unknown>>,
		flowType: 'oauth' | 'oidc'
	): ValidationResult {
		console.log(`${MODULE_TAG} Validating credentials`, { flowType });

		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Get required fields for this flow type
		const requiredFields = ValidationServiceV8.getRequiredFields(flowType);

		// Validate each required field
		requiredFields.forEach((field) => {
			const value = credentials[field];
			const rules = VALIDATION_RULES[field];

			if (!rules) {
				console.warn(`${MODULE_TAG} No validation rules for field`, { field });
				return;
			}

			// Check if required field is empty
			if (rules.required && ValidationServiceV8.isEmpty(value)) {
				errors.push({
					field,
					message: rules.message || `${field} is required`,
					suggestion: rules.example ? `Example: ${rules.example}` : undefined,
					code: 'REQUIRED_FIELD_MISSING',
				});
				return;
			}

			// Skip further validation if field is empty and not required
			if (ValidationServiceV8.isEmpty(value)) {
				return;
			}

			// Validate pattern
			if (rules.pattern && !rules.pattern.test(value)) {
				errors.push({
					field,
					message: rules.message || `${field} format is invalid`,
					suggestion: rules.example ? `Example: ${rules.example}` : undefined,
					code: 'INVALID_FORMAT',
				});
			}

			// Validate min length
			if (rules.minLength && value.length < rules.minLength) {
				errors.push({
					field,
					message: `${field} must be at least ${rules.minLength} characters`,
					code: 'MIN_LENGTH',
				});
			}

			// Validate max length
			if (rules.maxLength && value.length > rules.maxLength) {
				errors.push({
					field,
					message: `${field} must be at most ${rules.maxLength} characters`,
					code: 'MAX_LENGTH',
				});
			}

			// Custom validator
			if (rules.customValidator) {
				const customResult = rules.customValidator(value);
				errors.push(...customResult.errors);
				warnings.push(...customResult.warnings);
			}
		});

		// OIDC-specific validation
		if (flowType === 'oidc') {
			const scopeResult = ValidationServiceV8.validateOIDCScopes(
				(credentials.scopes as string) || ''
			);
			errors.push(...scopeResult.errors);
			warnings.push(...scopeResult.warnings);
		}

		// Redirect URI warnings
		if (credentials.redirectUri) {
			const redirectWarnings = ValidationServiceV8.validateRedirectUriSecurity(
				credentials.redirectUri as string
			);
			warnings.push(...redirectWarnings);
		}

		// Client Secret warnings for public clients
		if (credentials.clientAuthMethod === 'none' && credentials.clientSecret) {
			warnings.push({
				field: 'clientSecret',
				message: 'Client Secret is not used with public client authentication',
				canProceed: true,
				severity: 'low',
			});
		}

		const valid = errors.length === 0;
		const canProceed = valid && warnings.filter((w) => !w.canProceed).length === 0;

		console.log(`${MODULE_TAG} Validation complete`, {
			valid,
			canProceed,
			errorCount: errors.length,
			warningCount: warnings.length,
		});

		return {
			valid,
			errors,
			warnings,
			canProceed,
		};
	}

	/**
	 * Validate scopes for OIDC flows
	 * @param scopes - Space-separated scope string
	 * @returns Validation result
	 * @example
	 * const result = ValidationServiceV8.validateOIDCScopes('openid profile email');
	 */
	static validateOIDCScopes(scopes: string): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		if (!scopes || scopes.trim().length === 0) {
			errors.push({
				field: 'scopes',
				message: 'At least one scope is required',
				code: 'SCOPES_REQUIRED',
			});
			return { valid: false, errors, warnings, canProceed: false };
		}

		const scopeArray = scopes.split(/\s+/).filter((s) => s.length > 0);

		// OIDC requires 'openid' scope
		if (!scopeArray.includes('openid')) {
			errors.push({
				field: 'scopes',
				message: 'OIDC flows require the "openid" scope',
				suggestion: 'Add "openid" to your scopes',
				code: 'OPENID_SCOPE_REQUIRED',
			});
		}

		// Warn about offline_access
		if (scopeArray.includes('offline_access')) {
			warnings.push({
				field: 'scopes',
				message: 'offline_access will request a refresh token. Ensure you handle it securely.',
				canProceed: true,
				severity: 'medium',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			canProceed: errors.length === 0,
		};
	}

	/**
	 * Validate OAuth scopes (less strict than OIDC)
	 * @param scopes - Space-separated scope string
	 * @returns Validation result
	 */
	static validateOAuthScopes(scopes: string): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		if (!scopes || scopes.trim().length === 0) {
			errors.push({
				field: 'scopes',
				message: 'At least one scope is required',
				code: 'SCOPES_REQUIRED',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			canProceed: errors.length === 0,
		};
	}

	/**
	 * Validate URL format
	 * @param url - URL to validate
	 * @param type - Type of URL ('redirect' | 'issuer' | 'endpoint')
	 * @returns Validation result
	 * @example
	 * const result = ValidationServiceV8.validateUrl('http://localhost:3000', 'redirect');
	 */
	static validateUrl(url: string, type: 'redirect' | 'issuer' | 'endpoint'): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		if (!url || url.trim().length === 0) {
			errors.push({
				field: type,
				message: `${type} URL is required`,
				code: 'URL_REQUIRED',
			});
			return { valid: false, errors, warnings, canProceed: false };
		}

		// Basic URL validation
		try {
			const urlObj = new URL(url);

			// Issuer must be HTTPS (except localhost)
			if (type === 'issuer' && urlObj.protocol !== 'https:') {
				if (!urlObj.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/)) {
					errors.push({
						field: type,
						message: 'Issuer URL must use HTTPS',
						code: 'HTTPS_REQUIRED',
					});
				}
			}

			// Warn about HTTP for non-localhost
			if (urlObj.protocol === 'http:' && !urlObj.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/)) {
				warnings.push({
					field: type,
					message: 'Using HTTP (not HTTPS) for non-localhost URLs is insecure',
					canProceed: true,
					severity: 'high',
				});
			}

			// Warn about fragment in redirect URI
			if (type === 'redirect' && urlObj.hash) {
				warnings.push({
					field: type,
					message: 'Redirect URI should not contain a fragment (#)',
					canProceed: true,
					severity: 'medium',
				});
			}
		} catch {
			errors.push({
				field: type,
				message: 'Invalid URL format',
				suggestion: 'URL must include protocol (http:// or https://)',
				code: 'INVALID_URL',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			canProceed: errors.length === 0,
		};
	}

	/**
	 * Validate UUID format
	 * @param value - Value to validate
	 * @param field - Field name for error messages
	 * @returns Validation result
	 * @example
	 * const result = ValidationServiceV8.validateUUID(environmentId, 'Environment ID');
	 */
	static validateUUID(value: string, field: string): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		if (!value || value.trim().length === 0) {
			errors.push({
				field,
				message: `${field} is required`,
				code: 'UUID_REQUIRED',
			});
			return { valid: false, errors, warnings, canProceed: false };
		}

		const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidPattern.test(value)) {
			errors.push({
				field,
				message: `${field} must be a valid UUID`,
				suggestion: 'Format: 12345678-1234-1234-1234-123456789012',
				code: 'INVALID_UUID',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			canProceed: errors.length === 0,
		};
	}

	/**
	 * Validate authorization URL components
	 * @param params - Authorization URL parameters
	 * @returns Validation result
	 */
	static validateAuthorizationUrlParams(params: {
		authorizationEndpoint?: string;
		clientId?: string;
		redirectUri?: string;
		scope?: string;
		responseType?: string;
		state?: string;
		codeChallenge?: string;
		codeChallengeMethod?: string;
	}): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Required parameters
		if (!params.authorizationEndpoint) {
			errors.push({
				field: 'authorizationEndpoint',
				message: 'Authorization endpoint is required',
				code: 'ENDPOINT_REQUIRED',
			});
		}

		if (!params.clientId) {
			errors.push({
				field: 'clientId',
				message: 'Client ID is required',
				code: 'CLIENT_ID_REQUIRED',
			});
		}

		if (!params.redirectUri) {
			errors.push({
				field: 'redirectUri',
				message: 'Redirect URI is required',
				code: 'REDIRECT_URI_REQUIRED',
			});
		}

		if (!params.scope) {
			errors.push({
				field: 'scope',
				message: 'At least one scope is required',
				code: 'SCOPE_REQUIRED',
			});
		}

		if (!params.responseType) {
			errors.push({
				field: 'responseType',
				message: 'Response type is required',
				code: 'RESPONSE_TYPE_REQUIRED',
			});
		}

		// Validate state parameter
		if (!params.state) {
			warnings.push({
				field: 'state',
				message: 'State parameter is recommended for CSRF protection',
				canProceed: true,
				severity: 'high',
			});
		}

		// Validate PKCE
		if (params.codeChallenge && !params.codeChallengeMethod) {
			errors.push({
				field: 'codeChallengeMethod',
				message: 'Code challenge method is required when using PKCE',
				code: 'PKCE_METHOD_REQUIRED',
			});
		}

		if (params.codeChallengeMethod && params.codeChallengeMethod !== 'S256') {
			warnings.push({
				field: 'codeChallengeMethod',
				message: 'S256 is the recommended code challenge method',
				canProceed: true,
				severity: 'medium',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			canProceed: errors.length === 0,
		};
	}

	/**
	 * Validate callback URL parameters
	 * @param params - Callback URL parameters
	 * @returns Validation result
	 */
	static validateCallbackParams(
		params: {
			code?: string;
			state?: string;
			error?: string;
			errorDescription?: string;
		},
		expectedState?: string
	): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Check for error in callback
		if (params.error) {
			errors.push({
				field: 'callback',
				message: `Authorization failed: ${params.error}`,
				suggestion: params.errorDescription || 'Check your OAuth configuration',
				code: params.error.toUpperCase(),
			});
			return { valid: false, errors, warnings, canProceed: false };
		}

		// Validate authorization code
		if (!params.code) {
			errors.push({
				field: 'code',
				message: 'Authorization code not found in callback',
				code: 'CODE_MISSING',
			});
		}

		// Validate state parameter (CSRF protection)
		if (expectedState && params.state !== expectedState) {
			errors.push({
				field: 'state',
				message: 'State parameter mismatch (possible CSRF attack)',
				code: 'STATE_MISMATCH',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			canProceed: errors.length === 0,
		};
	}

	/**
	 * Validate token response
	 * @param tokens - Token response object
	 * @param flowType - Flow type ('oauth' | 'oidc')
	 * @returns Validation result
	 */
	static validateTokenResponse(
		tokens: {
			access_token?: string;
			id_token?: string;
			refresh_token?: string;
			token_type?: string;
			expires_in?: number;
		},
		flowType: 'oauth' | 'oidc'
	): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Access token is always required
		if (!tokens.access_token) {
			errors.push({
				field: 'access_token',
				message: 'Access token not received',
				code: 'ACCESS_TOKEN_MISSING',
			});
		}

		// ID token required for OIDC
		if (flowType === 'oidc' && !tokens.id_token) {
			errors.push({
				field: 'id_token',
				message: 'ID token not received (required for OIDC flows)',
				code: 'ID_TOKEN_MISSING',
			});
		}

		// Warn if no expiry
		if (!tokens.expires_in) {
			warnings.push({
				field: 'expires_in',
				message: 'Token expiry not provided',
				canProceed: true,
				severity: 'low',
			});
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			canProceed: errors.length === 0,
		};
	}

	/**
	 * Get required fields for a flow type
	 * @param flowType - Flow type
	 * @returns Array of required field names
	 * @example
	 * const fields = ValidationServiceV8.getRequiredFields('oidc');
	 */
	static getRequiredFields(flowType: string): string[] {
		return REQUIRED_FIELDS[flowType] || REQUIRED_FIELDS.oauth;
	}

	/**
	 * Check if a value is empty
	 * @param value - Value to check
	 * @returns True if empty
	 */
	static isEmpty(value: unknown): boolean {
		if (value === null || value === undefined) {
			return true;
		}
		if (typeof value === 'string') {
			return value.trim().length === 0;
		}
		if (Array.isArray(value)) {
			return value.length === 0;
		}
		if (typeof value === 'object') {
			return Object.keys(value).length === 0;
		}
		return false;
	}

	/**
	 * Validate redirect URI security
	 * @param redirectUri - Redirect URI to validate
	 * @returns Array of warnings
	 */
	private static validateRedirectUriSecurity(redirectUri: string): ValidationWarning[] {
		const warnings: ValidationWarning[] = [];

		try {
			const url = new URL(redirectUri);

			// Warn about HTTP for non-localhost
			if (url.protocol === 'http:' && !url.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/)) {
				warnings.push({
					field: 'redirectUri',
					message: 'Using HTTP (not HTTPS) for non-localhost redirect URIs is insecure',
					canProceed: true,
					severity: 'high',
				});
			}

			// Warn about wildcard domains
			if (url.hostname.includes('*')) {
				warnings.push({
					field: 'redirectUri',
					message: 'Wildcard domains in redirect URIs are not recommended',
					canProceed: true,
					severity: 'high',
				});
			}

			// Warn about IP addresses (except localhost)
			if (url.hostname.match(/^\d+\.\d+\.\d+\.\d+$/) && !url.hostname.match(/^127\.0\.0\.1$/)) {
				warnings.push({
					field: 'redirectUri',
					message: 'Using IP addresses in redirect URIs is not recommended',
					canProceed: true,
					severity: 'medium',
				});
			}
		} catch {
			// URL parsing failed, but this will be caught by validateUrl
		}

		return warnings;
	}

	/**
	 * Format validation errors for display
	 * @param errors - Array of validation errors
	 * @returns Formatted error message
	 */
	static formatErrors(errors: ValidationError[]): string {
		if (errors.length === 0) {
			return '';
		}

		return errors
			.map((error) => {
				let message = `• ${error.message}`;
				if (error.suggestion) {
					message += `\n  → ${error.suggestion}`;
				}
				return message;
			})
			.join('\n');
	}

	/**
	 * Format validation warnings for display
	 * @param warnings - Array of validation warnings
	 * @returns Formatted warning message
	 */
	static formatWarnings(warnings: ValidationWarning[]): string {
		if (warnings.length === 0) {
			return '';
		}

		return warnings.map((warning) => `• ${warning.message}`).join('\n');
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ValidationServiceV8;
