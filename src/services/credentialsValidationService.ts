// src/services/credentialsValidationService.ts
/**
 * Credentials Validation Service
 * 
 * Provides reusable validation logic for OAuth/OIDC flow credentials
 * to ensure required fields are filled before proceeding to next steps.
 */

import { v4ToastManager } from '../utils/v4ToastMessages';

export interface ValidationResult {
	isValid: boolean;
	missingFields: string[];
	errorMessage?: string;
}

export interface CredentialsToValidate {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scope?: string;
	scopes?: string;
	[key: string]: string | undefined;
}

export interface ValidationRequirements {
	environmentId?: boolean;
	clientId?: boolean;
	clientSecret?: boolean;
	redirectUri?: boolean;
	scope?: boolean;
	customFields?: Record<string, boolean>;
}

/**
 * Field display names for user-friendly error messages
 */
const FIELD_DISPLAY_NAMES: Record<string, string> = {
	environmentId: 'Environment ID',
	clientId: 'Client ID',
	clientSecret: 'Client Secret',
	redirectUri: 'Redirect URI',
	scope: 'Scope',
	scopes: 'Scopes',
};

/**
 * Validate credentials against requirements
 */
export function validateCredentials(
	credentials: CredentialsToValidate,
	requirements: ValidationRequirements
): ValidationResult {
	const missingFields: string[] = [];

	// Check standard fields
	if (requirements.environmentId && !credentials.environmentId?.trim()) {
		missingFields.push('environmentId');
	}

	if (requirements.clientId && !credentials.clientId?.trim()) {
		missingFields.push('clientId');
	}

	if (requirements.clientSecret && !credentials.clientSecret?.trim()) {
		missingFields.push('clientSecret');
	}

	if (requirements.redirectUri && !credentials.redirectUri?.trim()) {
		missingFields.push('redirectUri');
	}

	if (requirements.scope) {
		const hasScope = credentials.scope?.trim() || credentials.scopes?.trim();
		if (!hasScope) {
			missingFields.push('scope');
		}
	}

	// Check custom fields
	if (requirements.customFields) {
		Object.entries(requirements.customFields).forEach(([fieldName, required]) => {
			if (required && !credentials[fieldName]?.trim()) {
				missingFields.push(fieldName);
			}
		});
	}

	const isValid = missingFields.length === 0;

	// Generate user-friendly error message
	let errorMessage: string | undefined;
	if (!isValid) {
		const fieldNames = missingFields
			.map(field => FIELD_DISPLAY_NAMES[field] || field)
			.join(', ');
		errorMessage = `Please fill in the following required field${missingFields.length > 1 ? 's' : ''}: ${fieldNames}`;
	}

	return {
		isValid,
		missingFields,
		errorMessage,
	};
}

/**
 * Validate and show toast if invalid
 * Returns true if valid, false if invalid
 */
export function validateAndNotify(
	credentials: CredentialsToValidate,
	requirements: ValidationRequirements,
	customMessage?: string
): boolean {
	const result = validateCredentials(credentials, requirements);

	if (!result.isValid) {
		const message = customMessage || result.errorMessage || 'Please complete all required fields';
		v4ToastManager.showError(message);
		return false;
	}

	return true;
}

/**
 * Get validation requirements for different flow types
 */
export const FlowValidationRequirements = {
	// OAuth 2.0 Implicit - Public client, no secret
	oauthImplicit: {
		environmentId: true,
		clientId: true,
		clientSecret: false,
		redirectUri: true,
		scope: false, // OAuth doesn't require openid
	},

	// OIDC Implicit - Public client, no secret, requires openid scope
	oidcImplicit: {
		environmentId: true,
		clientId: true,
		clientSecret: false,
		redirectUri: true,
		scope: true, // OIDC requires openid scope
	},

	// Authorization Code - Public client with PKCE
	authorizationCodePKCE: {
		environmentId: true,
		clientId: true,
		clientSecret: false,
		redirectUri: true,
		scope: false,
	},

	// Authorization Code - Confidential client
	authorizationCodeConfidential: {
		environmentId: true,
		clientId: true,
		clientSecret: true,
		redirectUri: true,
		scope: false,
	},

	// Client Credentials
	clientCredentials: {
		environmentId: true,
		clientId: true,
		clientSecret: true,
		redirectUri: false, // No redirect for client credentials
		scope: false,
	},

	// Device Authorization
	deviceAuthorization: {
		environmentId: true,
		clientId: true,
		clientSecret: false,
		redirectUri: false, // No redirect for device flow
		scope: false,
	},

	// Hybrid Flow
	hybrid: {
		environmentId: true,
		clientId: true,
		clientSecret: false,
		redirectUri: true,
		scope: true,
	},
};

/**
 * Validate before step navigation
 * Use this in handleNext functions to prevent navigation if invalid
 */
export function canNavigateToNextStep(
	credentials: CredentialsToValidate,
	requirements: ValidationRequirements,
	stepName?: string
): boolean {
	const result = validateCredentials(credentials, requirements);

	if (!result.isValid) {
		const stepInfo = stepName ? ` to ${stepName}` : '';
		const message = `Cannot proceed${stepInfo}. ${result.errorMessage}`;
		v4ToastManager.showError(message);
		return false;
	}

	return true;
}

/**
 * Check if specific field is empty
 */
export function isFieldEmpty(value: string | undefined): boolean {
	return !value || value.trim() === '';
}

/**
 * Get list of empty required fields
 */
export function getEmptyRequiredFields(
	credentials: CredentialsToValidate,
	requirements: ValidationRequirements
): string[] {
	const result = validateCredentials(credentials, requirements);
	return result.missingFields;
}

/**
 * Format field names for display
 */
export function formatFieldName(fieldName: string): string {
	return FIELD_DISPLAY_NAMES[fieldName] || fieldName;
}

/**
 * Validate for specific flow step
 */
export function validateForStep(
	stepNumber: number,
	credentials: CredentialsToValidate,
	flowType: 'oauth-implicit' | 'oidc-implicit' | 'authorization-code' | 'client-credentials' | 'device-authorization'
): ValidationResult {
	// Step 0 (intro) - no validation needed
	if (stepNumber === 0) {
		return { isValid: true, missingFields: [] };
	}

	// Step 1 (authorization request) - all required fields must be filled
	if (stepNumber === 1) {
		let requirements: ValidationRequirements;
		
		switch (flowType) {
			case 'oauth-implicit':
				requirements = FlowValidationRequirements.oauthImplicit;
				break;
			case 'oidc-implicit':
				requirements = FlowValidationRequirements.oidcImplicit;
				break;
			case 'authorization-code':
				requirements = FlowValidationRequirements.authorizationCodePKCE;
				break;
			case 'client-credentials':
				requirements = FlowValidationRequirements.clientCredentials;
				break;
			case 'device-authorization':
				requirements = FlowValidationRequirements.deviceAuthorization;
				break;
			default:
				requirements = {
					environmentId: true,
					clientId: true,
				};
		}

		return validateCredentials(credentials, requirements);
	}

	// Steps 2+ - assume credentials are already validated
	return { isValid: true, missingFields: [] };
}

export default {
	validateCredentials,
	validateAndNotify,
	canNavigateToNextStep,
	FlowValidationRequirements,
	isFieldEmpty,
	getEmptyRequiredFields,
	formatFieldName,
	validateForStep,
};

