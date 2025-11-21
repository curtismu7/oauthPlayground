// src/services/rarService.ts
// Rich Authorization Requests (RAR) Service - RFC 9396 Compliant Implementation

import { StepCredentials } from '../types/flowTypes';

// RAR Types per RFC 9396
export interface AuthorizationDetail {
	type: string; // Required per RFC 9396
	locations?: string[]; // Optional
	actions?: string[]; // Optional
	datatypes?: string[]; // Optional
	identifier?: string; // Optional
	privileges?: string[]; // Optional
	[key: string]: any; // Type-specific fields
}

export interface PaymentInitiationDetail extends AuthorizationDetail {
	type: 'payment_initiation';
	instructedAmount: {
		currency: string;
		amount: string;
	};
	creditorName: string;
	creditorAccount: {
		iban?: string;
		bban?: string;
		pan?: string;
		maskedPan?: string;
		msisdn?: string;
		email?: string;
	};
	remittanceInformation?: string;
}

export interface AccountInformationDetail extends AuthorizationDetail {
	type: 'account_information';
	accounts?: string[];
	balances?: boolean;
	transactions?: {
		fromBookingDateTime?: string;
		toBookingDateTime?: string;
	};
}

export interface CustomerInformationDetail extends AuthorizationDetail {
	type: 'customer_information';
	actions: string[]; // Required: read, write, etc.
	datatypes: string[]; // Required: contacts, photos, etc.
	locations: string[]; // Required: API endpoints
}

export interface RARValidationResult {
	valid: boolean;
	errors: string[];
}

export interface RARAuthorizationRequest {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	scope: string;
	state?: string;
	authorization_details: AuthorizationDetail[];
}

/**
 * Rich Authorization Requests Service
 * Implements RFC 9396 for fine-grained authorization
 */
export class RARService {
	/**
	 * Generate authorization request URL with RAR parameters
	 */
	static generateAuthorizationRequest(
		credentials: StepCredentials,
		authorizationDetails: AuthorizationDetail[]
	): string {
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			scope: credentials.scope || '',
			state: RARService.generateState(),
			// CORRECT: Direct authorization_details parameter per RFC 9396
			authorization_details: JSON.stringify(authorizationDetails),
		});

		return `${credentials.authorizationEndpoint}?${params.toString()}`;
	}

	/**
	 * Build authorization request with enhanced validation
	 */
	static buildAuthorizationRequest(config: {
		credentials: StepCredentials;
		authorizationDetails: AuthorizationDetail[];
	}): { url: string; validation: RARValidationResult } {
		const validation = RARService.validateAuthorizationDetails(config.authorizationDetails);

		if (!validation.valid) {
			return {
				url: '',
				validation,
			};
		}

		const url = RARService.generateAuthorizationRequest(
			config.credentials,
			config.authorizationDetails
		);
		return { url, validation };
	}

	/**
	 * Validate authorization details array
	 */
	static validateAuthorizationDetails(details: AuthorizationDetail[]): RARValidationResult {
		const errors: string[] = [];

		if (!Array.isArray(details)) {
			errors.push('authorization_details must be an array');
			return { valid: false, errors };
		}

		for (let i = 0; i < details.length; i++) {
			const detail = details[i];
			const detailErrors = RARService.validateSingleAuthorizationDetail(detail, i);
			errors.push(...detailErrors);
		}

		return { valid: errors.length === 0, errors };
	}

	/**
	 * Validate a single authorization detail object
	 */
	private static validateSingleAuthorizationDetail(
		detail: AuthorizationDetail,
		index: number
	): string[] {
		const errors: string[] = [];

		// RFC 9396 Section 2 - Required fields
		if (!detail.type) {
			errors.push(`authorization_details[${index}]: type field is required`);
		}

		// Validate type-specific fields
		const typeErrors = RARService.validateAuthorizationDetailType(detail, index);
		errors.push(...typeErrors);

		return errors;
	}

	/**
	 * Validate type-specific fields for authorization details
	 */
	private static validateAuthorizationDetailType(
		detail: AuthorizationDetail,
		index: number
	): string[] {
		const errors: string[] = [];

		switch (detail.type) {
			case 'payment_initiation':
				if (!detail.instructedAmount?.amount) {
					errors.push(
						`authorization_details[${index}]: instructedAmount.amount is required for payment_initiation`
					);
				}
				if (!detail.creditorName) {
					errors.push(
						`authorization_details[${index}]: creditorName is required for payment_initiation`
					);
				}
				if (!detail.creditorAccount) {
					errors.push(
						`authorization_details[${index}]: creditorAccount is required for payment_initiation`
					);
				}
				break;

			case 'account_information':
				// Account information is more flexible, but should have at least one access type
				if (!detail.balances && !detail.transactions) {
					errors.push(
						`authorization_details[${index}]: account_information should specify balances, transactions, or both`
					);
				}
				break;

			case 'customer_information':
				if (!detail.actions || !Array.isArray(detail.actions) || detail.actions.length === 0) {
					errors.push(
						`authorization_details[${index}]: actions array is required for customer_information`
					);
				}
				if (
					!detail.datatypes ||
					!Array.isArray(detail.datatypes) ||
					detail.datatypes.length === 0
				) {
					errors.push(
						`authorization_details[${index}]: datatypes array is required for customer_information`
					);
				}
				if (
					!detail.locations ||
					!Array.isArray(detail.locations) ||
					detail.locations.length === 0
				) {
					errors.push(
						`authorization_details[${index}]: locations array is required for customer_information`
					);
				}
				// Validate actions contain valid values
				if (detail.actions && Array.isArray(detail.actions)) {
					const validActions = ['read', 'write', 'delete', 'update'];
					const invalidActions = detail.actions.filter((action) => !validActions.includes(action));
					if (invalidActions.length > 0) {
						errors.push(
							`authorization_details[${index}]: invalid actions [${invalidActions.join(', ')}]. Valid actions: ${validActions.join(', ')}`
						);
					}
				}
				// Validate locations are valid URLs
				if (detail.locations && Array.isArray(detail.locations)) {
					detail.locations.forEach((location, locIndex) => {
						try {
							new URL(location);
						} catch {
							errors.push(
								`authorization_details[${index}]: locations[${locIndex}] must be a valid URL`
							);
						}
					});
				}
				break;

			default:
				// For custom types, at least ensure type is present (already checked above)
				break;
		}

		return errors;
	}

	/**
	 * Generate a secure state parameter
	 */
	private static generateState(): string {
		return (
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		);
	}

	/**
	 * Create common RAR authorization details templates
	 */
	static getTemplates(): Record<string, AuthorizationDetail> {
		return {
			paymentInitiation: {
				type: 'payment_initiation',
				instructedAmount: { currency: 'USD', amount: '0.00' },
				creditorName: '',
				creditorAccount: { iban: '' },
			},
			accountInformation: {
				type: 'account_information',
				accounts: [],
				balances: true,
				transactions: {
					fromBookingDateTime: new Date().toISOString(),
					toBookingDateTime: new Date().toISOString(),
				},
			},
			customerInformation: {
				type: 'customer_information',
				actions: ['read', 'write'],
				datatypes: ['contacts', 'photos'],
				locations: ['https://api.example.com/customers'],
			},
		};
	}

	/**
	 * Get example authorization details for different use cases
	 */
	static getExampleAuthorizationDetails(): AuthorizationDetail[] {
		return [
			{
				type: 'customer_information',
				actions: ['read', 'write'],
				datatypes: ['contacts', 'photos'],
				locations: ['https://api.example.com/customers'],
			},
			{
				type: 'payment_initiation',
				instructedAmount: { currency: 'USD', amount: '250.00' },
				creditorName: 'ABC Supplies',
				creditorAccount: { iban: 'DE89370400440532013000' },
			},
			{
				type: 'account_information',
				accounts: ['account1', 'account2'],
				balances: true,
				transactions: {
					fromBookingDateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
					toBookingDateTime: new Date().toISOString(),
				},
			},
		];
	}

	/**
	 * Parse authorization response and extract authorization_details
	 */
	static parseAuthorizationResponse(tokenResponse: any): {
		tokens: any;
		authorizationDetails?: AuthorizationDetail[];
	} {
		let authorizationDetails: AuthorizationDetail[] | undefined;

		// Check if authorization_details are present in the token response
		if (tokenResponse.authorization_details) {
			try {
				if (typeof tokenResponse.authorization_details === 'string') {
					authorizationDetails = JSON.parse(tokenResponse.authorization_details);
				} else if (Array.isArray(tokenResponse.authorization_details)) {
					authorizationDetails = tokenResponse.authorization_details;
				}
			} catch (error) {
				console.warn('Failed to parse authorization_details from token response:', error);
			}
		}

		return {
			tokens: tokenResponse,
			authorizationDetails,
		};
	}

	/**
	 * Validate that authorization details don't exceed granted scopes
	 */
	static validateScopeCompliance(
		authorizationDetails: AuthorizationDetail[],
		grantedScopes: string[]
	): RARValidationResult {
		const errors: string[] = [];

		// Basic scope validation - ensure authorization details are within scope bounds
		for (let i = 0; i < authorizationDetails.length; i++) {
			const detail = authorizationDetails[i];

			// For customer_information type, ensure appropriate scopes are granted
			if (detail.type === 'customer_information') {
				const hasReadScope = grantedScopes.includes('profile') || grantedScopes.includes('openid');
				const hasWriteScope = grantedScopes.includes('profile') || detail.actions?.includes('read');

				if (detail.actions?.includes('write') && !hasWriteScope) {
					errors.push(`authorization_details[${i}]: write action requires appropriate scope`);
				}
				if (detail.actions?.includes('read') && !hasReadScope) {
					errors.push(`authorization_details[${i}]: read action requires appropriate scope`);
				}
			}
		}

		return { valid: errors.length === 0, errors };
	}

	/**
	 * Validate IBAN format (basic validation)
	 */
	static validateIBAN(iban: string): boolean {
		// Basic IBAN validation - should start with 2 letters, then 2 digits, then up to 30 alphanumeric
		const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
		return ibanRegex.test(iban);
	}
}

export default RARService;
