// src/services/rarService.ts
// Rich Authorization Requests (RAR) Service - RFC 9396 Compliant Implementation

import { StepCredentials } from '../types/flowTypes';

// RAR Types per RFC 9396
export interface AuthorizationDetail {
	type: string;                    // Required per RFC 9396
	locations?: string[];            // Optional
	actions?: string[];              // Optional
	datatypes?: string[];            // Optional
	identifier?: string;             // Optional
	privileges?: string[];           // Optional
	[key: string]: any;             // Type-specific fields
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
			state: this.generateState(),
			// CORRECT: Direct authorization_details parameter per RFC 9396
			authorization_details: JSON.stringify(authorizationDetails)
		});

		return `${credentials.authorizationEndpoint}?${params.toString()}`;
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
			const detailErrors = this.validateSingleAuthorizationDetail(detail, i);
			errors.push(...detailErrors);
		}

		return { valid: errors.length === 0, errors };
	}

	/**
	 * Validate a single authorization detail object
	 */
	private static validateSingleAuthorizationDetail(detail: AuthorizationDetail, index: number): string[] {
		const errors: string[] = [];

		// RFC 9396 Section 2 - Required fields
		if (!detail.type) {
			errors.push(`authorization_details[${index}]: type field is required`);
		}

		// Validate type-specific fields
		const typeErrors = this.validateAuthorizationDetailType(detail, index);
		errors.push(...typeErrors);

		return errors;
	}

	/**
	 * Validate type-specific fields for authorization details
	 */
	private static validateAuthorizationDetailType(detail: AuthorizationDetail, index: number): string[] {
		const errors: string[] = [];

		switch (detail.type) {
			case 'payment_initiation':
				if (!detail.instructedAmount?.amount) {
					errors.push(`authorization_details[${index}]: instructedAmount.amount is required for payment_initiation`);
				}
				if (!detail.creditorName) {
					errors.push(`authorization_details[${index}]: creditorName is required for payment_initiation`);
				}
				if (!detail.creditorAccount) {
					errors.push(`authorization_details[${index}]: creditorAccount is required for payment_initiation`);
				}
				break;

			case 'account_information':
				// Account information is more flexible, but should have at least one access type
				if (!detail.balances && !detail.transactions) {
					errors.push(`authorization_details[${index}]: account_information should specify balances, transactions, or both`);
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
		return Math.random().toString(36).substring(2, 15) +
			   Math.random().toString(36).substring(2, 15);
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
				creditorAccount: { iban: '' }
			},
			accountInformation: {
				type: 'account_information',
				accounts: [],
				balances: true,
				transactions: {
					fromBookingDateTime: new Date().toISOString(),
					toBookingDateTime: new Date().toISOString()
				}
			}
		};
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
