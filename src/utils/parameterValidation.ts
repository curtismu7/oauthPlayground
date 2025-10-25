// src/utils/parameterValidation.ts
// Comprehensive parameter validation for all OAuth/OIDC flows

export interface ParameterValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	validatedParameters: Record<string, any>;
}

export interface ParameterValidationRule {
	name: string;
	required: boolean;
	type: 'string' | 'number' | 'boolean' | 'array' | 'object';
	pattern?: RegExp;
	minLength?: number;
	maxLength?: number;
	allowedValues?: string[];
	validator?: (value: any) => boolean;
	description: string;
}

export interface FlowParameterConfig {
	flowName: string;
	requiredParameters: string[];
	optionalParameters: string[];
	rules: Record<string, ParameterValidationRule>;
}

/**
 * Comprehensive Parameter Validation Service
 * Implements RFC 6749 and OpenID Connect Core 1.0 parameter validation
 */
export class ParameterValidationService {
	private static flowConfigs: Map<string, FlowParameterConfig> = new Map();

	/**
	 * Initialize flow configurations
	 */
	static initializeFlowConfigs(): void {
		// OAuth 2.0 Authorization Code Flow
		this.flowConfigs.set('oauth-authorization-code-v7', {
			flowName: 'OAuth 2.0 Authorization Code Flow',
			requiredParameters: ['response_type', 'client_id', 'redirect_uri'],
			optionalParameters: ['scope', 'state', 'code_challenge', 'code_challenge_method', 'audience', 'resource'],
			rules: {
				response_type: {
					name: 'response_type',
					required: true,
					type: 'string',
					allowedValues: ['code'],
					description: 'Must be "code" for authorization code flow'
				},
				client_id: {
					name: 'client_id',
					required: true,
					type: 'string',
					minLength: 1,
					description: 'Client identifier'
				},
				redirect_uri: {
					name: 'redirect_uri',
					required: true,
					type: 'string',
					pattern: /^https?:\/\/.+/,
					description: 'Must be a valid HTTPS URL'
				},
				scope: {
					name: 'scope',
					required: false,
					type: 'string',
					description: 'Space-separated list of scopes'
				},
				state: {
					name: 'state',
					required: false,
					type: 'string',
					minLength: 8,
					description: 'CSRF protection parameter (recommended 8+ characters)'
				},
				code_challenge: {
					name: 'code_challenge',
					required: false,
					type: 'string',
					description: 'PKCE code challenge'
				},
				code_challenge_method: {
					name: 'code_challenge_method',
					required: false,
					type: 'string',
					allowedValues: ['S256', 'plain'],
					description: 'PKCE code challenge method'
				},
				audience: {
					name: 'audience',
					required: false,
					type: 'string',
					description: 'API audience identifier'
				},
				resource: {
					name: 'resource',
					required: false,
					type: 'string',
					description: 'Resource server identifier'
				}
			}
		});

		// OAuth 2.0 Implicit Flow
		this.flowConfigs.set('implicit-v7', {
			flowName: 'OAuth 2.0 Implicit Flow',
			requiredParameters: ['response_type', 'client_id', 'redirect_uri'],
			optionalParameters: ['scope', 'state', 'response_mode', 'audience'],
			rules: {
				response_type: {
					name: 'response_type',
					required: true,
					type: 'string',
					allowedValues: ['token', 'id_token', 'id_token token'],
					description: 'Must be "token", "id_token", or "id_token token"'
				},
				client_id: {
					name: 'client_id',
					required: true,
					type: 'string',
					minLength: 1,
					description: 'Client identifier'
				},
				redirect_uri: {
					name: 'redirect_uri',
					required: true,
					type: 'string',
					pattern: /^https?:\/\/.+/,
					description: 'Must be a valid HTTPS URL'
				},
				response_mode: {
					name: 'response_mode',
					required: false,
					type: 'string',
					allowedValues: ['fragment', 'query'],
					description: 'Response mode (fragment or query)'
				},
				scope: {
					name: 'scope',
					required: false,
					type: 'string',
					description: 'Space-separated list of scopes'
				},
				state: {
					name: 'state',
					required: false,
					type: 'string',
					minLength: 8,
					description: 'CSRF protection parameter (recommended 8+ characters)'
				},
				audience: {
					name: 'audience',
					required: false,
					type: 'string',
					description: 'API audience identifier'
				}
			}
		});

		// OIDC Authorization Code Flow
		this.flowConfigs.set('oidc-authorization-code-v7', {
			flowName: 'OIDC Authorization Code Flow',
			requiredParameters: ['response_type', 'client_id', 'redirect_uri', 'scope'],
			optionalParameters: ['state', 'nonce', 'code_challenge', 'code_challenge_method', 'max_age', 'prompt', 'acr_values', 'claims'],
			rules: {
				response_type: {
					name: 'response_type',
					required: true,
					type: 'string',
					allowedValues: ['code'],
					description: 'Must be "code" for authorization code flow'
				},
				client_id: {
					name: 'client_id',
					required: true,
					type: 'string',
					minLength: 1,
					description: 'Client identifier'
				},
				redirect_uri: {
					name: 'redirect_uri',
					required: true,
					type: 'string',
					pattern: /^https?:\/\/.+/,
					description: 'Must be a valid HTTPS URL'
				},
				scope: {
					name: 'scope',
					required: true,
					type: 'string',
					validator: (value: string) => value.includes('openid'),
					description: 'Must include "openid" scope for OIDC'
				},
				nonce: {
					name: 'nonce',
					required: false,
					type: 'string',
					minLength: 8,
					description: 'Nonce for replay protection (recommended 8+ characters)'
				},
				state: {
					name: 'state',
					required: false,
					type: 'string',
					minLength: 8,
					description: 'CSRF protection parameter (recommended 8+ characters)'
				},
				max_age: {
					name: 'max_age',
					required: false,
					type: 'number',
					validator: (value: number) => value > 0,
					description: 'Maximum authentication age in seconds'
				},
				prompt: {
					name: 'prompt',
					required: false,
					type: 'string',
					allowedValues: ['none', 'login', 'consent', 'select_account'],
					description: 'Authentication prompt behavior'
				},
				acr_values: {
					name: 'acr_values',
					required: false,
					type: 'string',
					description: 'Authentication context class references'
				},
				claims: {
					name: 'claims',
					required: false,
					type: 'string',
					validator: (value: string) => {
						try {
							JSON.parse(value);
							return true;
						} catch {
							return false;
						}
					},
					description: 'Requested claims as JSON string'
				}
			}
		});

		// OIDC Hybrid Flow
		this.flowConfigs.set('oidc-hybrid-v7', {
			flowName: 'OIDC Hybrid Flow',
			requiredParameters: ['response_type', 'client_id', 'redirect_uri', 'scope'],
			optionalParameters: ['state', 'nonce', 'code_challenge', 'code_challenge_method', 'max_age', 'prompt', 'acr_values', 'claims'],
			rules: {
				response_type: {
					name: 'response_type',
					required: true,
					type: 'string',
					allowedValues: ['code id_token', 'code token', 'code id_token token'],
					description: 'Must be "code id_token", "code token", or "code id_token token"'
				},
				client_id: {
					name: 'client_id',
					required: true,
					type: 'string',
					minLength: 1,
					description: 'Client identifier'
				},
				redirect_uri: {
					name: 'redirect_uri',
					required: true,
					type: 'string',
					pattern: /^https?:\/\/.+/,
					description: 'Must be a valid HTTPS URL'
				},
				scope: {
					name: 'scope',
					required: true,
					type: 'string',
					validator: (value: string) => value.includes('openid'),
					description: 'Must include "openid" scope for OIDC'
				},
				nonce: {
					name: 'nonce',
					required: true,
					type: 'string',
					minLength: 8,
					description: 'Nonce is required for hybrid flow with id_token'
				},
				state: {
					name: 'state',
					required: false,
					type: 'string',
					minLength: 8,
					description: 'CSRF protection parameter (recommended 8+ characters)'
				}
			}
		});

		// Client Credentials Flow
		this.flowConfigs.set('client-credentials-v7', {
			flowName: 'Client Credentials Flow',
			requiredParameters: ['grant_type', 'client_id'],
			optionalParameters: ['scope', 'audience', 'resource'],
			rules: {
				grant_type: {
					name: 'grant_type',
					required: true,
					type: 'string',
					allowedValues: ['client_credentials'],
					description: 'Must be "client_credentials"'
				},
				client_id: {
					name: 'client_id',
					required: true,
					type: 'string',
					minLength: 1,
					description: 'Client identifier'
				},
				scope: {
					name: 'scope',
					required: false,
					type: 'string',
					description: 'Space-separated list of scopes'
				},
				audience: {
					name: 'audience',
					required: false,
					type: 'string',
					description: 'API audience identifier'
				},
				resource: {
					name: 'resource',
					required: false,
					type: 'string',
					description: 'Resource server identifier'
				}
			}
		});
	}

	/**
	 * Validate parameters for a specific flow
	 */
	static validateFlowParameters(flowName: string, parameters: Record<string, any>): ParameterValidationResult {
		// Initialize configs if not already done
		if (this.flowConfigs.size === 0) {
			this.initializeFlowConfigs();
		}

		const config = this.flowConfigs.get(flowName);
		if (!config) {
			return {
				isValid: false,
				errors: [`Unknown flow: ${flowName}`],
				warnings: [],
				validatedParameters: {}
			};
		}

		const result: ParameterValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
			validatedParameters: {}
		};

		// Validate required parameters
		for (const paramName of config.requiredParameters) {
			if (!parameters[paramName]) {
				result.errors.push(`Missing required parameter: ${paramName}`);
				result.isValid = false;
			}
		}

		// Validate all parameters (required and optional)
		for (const [paramName, value] of Object.entries(parameters)) {
			const rule = config.rules[paramName];
			if (rule) {
				const validation = this.validateParameter(paramName, value, rule);
				if (!validation.isValid) {
					result.errors.push(...validation.errors);
					result.isValid = false;
				}
				if (validation.warnings.length > 0) {
					result.warnings.push(...validation.warnings);
				}
				result.validatedParameters[paramName] = value;
			} else {
				result.warnings.push(`Unknown parameter: ${paramName}`);
			}
		}

		// Check for OIDC-specific validations
		if (flowName.includes('oidc')) {
			this.validateOIDCSpecificParameters(parameters, result);
		}

		return result;
	}

	/**
	 * Validate individual parameter
	 */
	private static validateParameter(
		paramName: string,
		value: any,
		rule: ParameterValidationRule
	): { isValid: boolean; errors: string[]; warnings: string[] } {
		const result = {
			isValid: true,
			errors: [] as string[],
			warnings: [] as string[]
		};

		// Check if required parameter is present
		if (rule.required && (value === undefined || value === null || value === '')) {
			result.errors.push(`Required parameter ${paramName} is missing`);
			result.isValid = false;
			return result;
		}

		// Skip validation if parameter is not present and not required
		if (!rule.required && (value === undefined || value === null || value === '')) {
			return result;
		}

		// Type validation
		if (!this.validateType(value, rule.type)) {
			result.errors.push(`Parameter ${paramName} must be of type ${rule.type}`);
			result.isValid = false;
		}

		// String-specific validations
		if (rule.type === 'string' && typeof value === 'string') {
			if (rule.minLength && value.length < rule.minLength) {
				result.errors.push(`Parameter ${paramName} must be at least ${rule.minLength} characters`);
				result.isValid = false;
			}

			if (rule.maxLength && value.length > rule.maxLength) {
				result.errors.push(`Parameter ${paramName} must be no more than ${rule.maxLength} characters`);
				result.isValid = false;
			}

			if (rule.pattern && !rule.pattern.test(value)) {
				result.errors.push(`Parameter ${paramName} does not match required pattern`);
				result.isValid = false;
			}

			if (rule.allowedValues && !rule.allowedValues.includes(value)) {
				result.errors.push(`Parameter ${paramName} must be one of: ${rule.allowedValues.join(', ')}`);
				result.isValid = false;
			}
		}

		// Number-specific validations
		if (rule.type === 'number' && typeof value === 'number') {
			if (rule.validator && !rule.validator(value)) {
				result.errors.push(`Parameter ${paramName} failed custom validation`);
				result.isValid = false;
			}
		}

		// Custom validator
		if (rule.validator && !rule.validator(value)) {
			result.errors.push(`Parameter ${paramName} failed custom validation`);
			result.isValid = false;
		}

		return result;
	}

	/**
	 * Validate type
	 */
	private static validateType(value: any, expectedType: string): boolean {
		switch (expectedType) {
			case 'string':
				return typeof value === 'string';
			case 'number':
				return typeof value === 'number';
			case 'boolean':
				return typeof value === 'boolean';
			case 'array':
				return Array.isArray(value);
			case 'object':
				return typeof value === 'object' && value !== null && !Array.isArray(value);
			default:
				return true;
		}
	}

	/**
	 * Validate OIDC-specific parameters
	 */
	private static validateOIDCSpecificParameters(
		parameters: Record<string, any>,
		result: ParameterValidationResult
	): void {
		// Check for openid scope
		if (parameters.scope && !parameters.scope.includes('openid')) {
			result.errors.push('OIDC flows require "openid" scope');
			result.isValid = false;
		}

		// Check for nonce when id_token is requested
		if (parameters.response_type && parameters.response_type.includes('id_token')) {
			if (!parameters.nonce) {
				result.warnings.push('Nonce parameter is recommended when requesting id_token');
			}
		}

		// Validate claims parameter
		if (parameters.claims) {
			try {
				JSON.parse(parameters.claims);
			} catch {
				result.errors.push('Claims parameter must be valid JSON');
				result.isValid = false;
			}
		}
	}

	/**
	 * Get validation summary
	 */
	static getValidationSummary(result: ParameterValidationResult): string {
		if (result.isValid) {
			return `✅ Parameters are valid${result.warnings.length > 0 ? ` (${result.warnings.length} warnings)` : ''}`;
		} else {
			return `❌ Parameters are invalid (${result.errors.length} errors)`;
		}
	}

	/**
	 * Get detailed validation report
	 */
	static getValidationReport(result: ParameterValidationResult): string {
		let report = `Parameter Validation Report\n`;
		report += `==========================\n\n`;
		
		report += `Overall Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
		
		if (result.errors.length > 0) {
			report += `Errors:\n`;
			result.errors.forEach(error => report += `  ❌ ${error}\n`);
			report += `\n`;
		}
		
		if (result.warnings.length > 0) {
			report += `Warnings:\n`;
			result.warnings.forEach(warning => report += `  ⚠️ ${warning}\n`);
			report += `\n`;
		}
		
		report += `Validated Parameters:\n`;
		Object.entries(result.validatedParameters).forEach(([key, value]) => {
			report += `  ${key}: ${value}\n`;
		});
		
		return report;
	}

	/**
	 * Get flow configuration
	 */
	static getFlowConfiguration(flowName: string): FlowParameterConfig | undefined {
		if (this.flowConfigs.size === 0) {
			this.initializeFlowConfigs();
		}
		return this.flowConfigs.get(flowName);
	}

	/**
	 * Get all supported flows
	 */
	static getSupportedFlows(): string[] {
		if (this.flowConfigs.size === 0) {
			this.initializeFlowConfigs();
		}
		return Array.from(this.flowConfigs.keys());
	}
}
