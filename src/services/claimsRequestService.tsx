// src/services/claimsRequestService.tsx
// Service wrapper for Claims Request Builder - Works for both OAuth and OIDC
import React from 'react';
import ClaimsRequestBuilder, { ClaimsRequestStructure, ClaimRequest } from '../components/ClaimsRequestBuilder';

export type { ClaimsRequestStructure, ClaimRequest };

/**
 * Claims Request Service
 * 
 * Provides a service layer for advanced claims requests.
 * Allows requesting specific claims to be returned in ID tokens
 * or from the UserInfo endpoint.
 * 
 * **OIDC Core 1.0 Section 5.5 - Claims Parameter**
 * 
 * @applicability 
 * - OIDC flows: Full support (ID token + UserInfo)
 * - OAuth flows: Limited (UserInfo-like endpoints if supported by provider)
 * 
 * @educational
 * - Shows the power of OIDC's claim request mechanism
 * - Demonstrates essential vs voluntary claims
 * - Illustrates where claims are returned
 */
export class ClaimsRequestService {
	/**
	 * Get the claims request builder component
	 */
	static getBuilder(props: {
		value: ClaimsRequestStructure | null;
		onChange: (value: ClaimsRequestStructure | null) => void;
		collapsed?: boolean;
		onToggleCollapsed?: () => void;
	}): React.ReactElement {
		return <ClaimsRequestBuilder {...props} />;
	}

	/**
	 * Validate claims request structure
	 */
	static isValidClaimsRequest(claims: unknown): claims is ClaimsRequestStructure {
		if (!claims || typeof claims !== 'object') return false;
		
		const claimsObj = claims as Record<string, unknown>;
		
		// Must have at least one of: userinfo or id_token
		if (!claimsObj.userinfo && !claimsObj.id_token) return false;
		
		return true;
	}

	/**
	 * Convert claims structure to JSON string for URL parameter
	 */
	static toUrlParameter(claims: ClaimsRequestStructure | null): string | null {
		if (!claims || !ClaimsRequestService.isValidClaimsRequest(claims)) return null;
		
		try {
			return JSON.stringify(claims);
		} catch {
			return null;
		}
	}

	/**
	 * Parse claims from URL parameter
	 */
	static fromUrlParameter(claimsString: string): ClaimsRequestStructure | null {
		try {
			const parsed = JSON.parse(claimsString);
			return ClaimsRequestService.isValidClaimsRequest(parsed) ? parsed : null;
		} catch {
			return null;
		}
	}

	/**
	 * Determine if claims request should be shown for a flow type
	 */
	static shouldShowForFlow(flowType: string): boolean {
		// Show for all OIDC flows and OAuth flows with UserInfo
		const supportedFlows = [
			'oidc-authorization-code',
			'oidc-implicit',
			'oidc-hybrid',
			'oauth-authorization-code', // Can use for UserInfo-like endpoints
		];
		
		return supportedFlows.some(flow => flowType.includes(flow));
	}

	/**
	 * Add claims parameter to URL if present
	 */
	static addToParams(params: URLSearchParams, claims: ClaimsRequestStructure | null): void {
		const claimsParam = ClaimsRequestService.toUrlParameter(claims);
		if (claimsParam) {
			params.set('claims', claimsParam);
		}
	}

	/**
	 * Get common standard claims
	 */
	static getStandardClaims(): Array<{ name: string; description: string; oidcOnly: boolean }> {
		return [
			{ name: 'sub', description: 'Subject identifier', oidcOnly: false },
			{ name: 'name', description: 'Full name', oidcOnly: false },
			{ name: 'given_name', description: 'First name', oidcOnly: false },
			{ name: 'family_name', description: 'Last name', oidcOnly: false },
			{ name: 'middle_name', description: 'Middle name', oidcOnly: false },
			{ name: 'nickname', description: 'Nickname', oidcOnly: false },
			{ name: 'preferred_username', description: 'Preferred username', oidcOnly: false },
			{ name: 'profile', description: 'Profile page URL', oidcOnly: false },
			{ name: 'picture', description: 'Profile picture URL', oidcOnly: false },
			{ name: 'website', description: 'Website URL', oidcOnly: false },
			{ name: 'email', description: 'Email address', oidcOnly: false },
			{ name: 'email_verified', description: 'Email verification status', oidcOnly: true },
			{ name: 'gender', description: 'Gender', oidcOnly: false },
			{ name: 'birthdate', description: 'Date of birth', oidcOnly: false },
			{ name: 'zoneinfo', description: 'Timezone', oidcOnly: false },
			{ name: 'locale', description: 'Locale preference', oidcOnly: false },
			{ name: 'phone_number', description: 'Phone number', oidcOnly: false },
			{ name: 'phone_number_verified', description: 'Phone verification status', oidcOnly: true },
			{ name: 'address', description: 'Postal address', oidcOnly: false },
			{ name: 'updated_at', description: 'Last profile update time', oidcOnly: true },
		];
	}

	/**
	 * Create an empty claims request structure
	 */
	static createEmpty(): ClaimsRequestStructure {
		return {
			userinfo: {},
			id_token: {}
		};
	}

	/**
	 * Add a claim to the structure
	 */
	static addClaim(
		claims: ClaimsRequestStructure | null,
		location: 'userinfo' | 'id_token',
		claimName: string,
		essential: boolean = false
	): ClaimsRequestStructure {
		const current = claims || ClaimsRequestService.createEmpty();
		
		return {
			...current,
			[location]: {
				...(current[location] || {}),
				[claimName]: essential ? { essential: true } : null
			}
		};
	}
}

export default ClaimsRequestService;

