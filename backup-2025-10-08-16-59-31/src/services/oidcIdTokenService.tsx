// src/services/oidcIdTokenService.tsx
// ⭐ V6 SERVICE - ID Token validation and claims extraction
// Used in: OAuthAuthorizationCodeFlowV6
// Purpose: Validate ID tokens and extract claims per OIDC spec

import React from 'react';
import styled from 'styled-components';

export interface IdTokenClaims {
	iss: string; // Issuer
	sub: string; // Subject
	aud: string | string[]; // Audience
	exp: number; // Expiration
	iat: number; // Issued at
	auth_time?: number; // Authentication time
	nonce?: string; // Nonce
	acr?: string; // Authentication context class reference
	amr?: string[]; // Authentication methods references
	azp?: string; // Authorized party
	// Additional claims
	name?: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	picture?: string;
	website?: string;
	email?: string;
	email_verified?: boolean;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	locale?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	address?: {
		formatted?: string;
		street_address?: string;
		locality?: string;
		region?: string;
		postal_code?: string;
		country?: string;
	};
	updated_at?: number;
	[key: string]: unknown; // Additional custom claims
}

export interface IdTokenValidationOptions {
	issuer?: string;
	audience?: string;
	clockTolerance?: number; // in seconds
	maxAge?: number; // in seconds
	nonce?: string;
}

const ClaimsContainer = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const ClaimRow = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 1rem;
	padding: 0.75rem 0;
	border-bottom: 1px solid #e5e7eb;
	
	&:last-child {
		border-bottom: none;
	}
`;

const ClaimLabel = styled.div`
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
	min-width: 150px;
`;

const ClaimValue = styled.div`
	color: #6b7280;
	font-size: 0.875rem;
	word-break: break-word;
	font-family: 'SF Mono', Monaco, monospace;
`;

export class OIDCIdTokenServiceClass {
	// Decode JWT token (no validation, just parsing)
	static decodeToken(token: string): IdTokenClaims | null {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) return null;

			const payload = parts[1];
			const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
			return decoded as IdTokenClaims;
		} catch (error) {
			console.error('Failed to decode ID token:', error);
			return null;
		}
	}

	// Validate and parse claims
	static async validateAndParseClaims(
		token: string,
		options: IdTokenValidationOptions = {}
	): Promise<IdTokenClaims> {
		const claims = OIDCIdTokenServiceClass.decodeToken(token);
		if (!claims) {
			throw new Error('Invalid ID token format');
		}

		// Validate issuer
		if (options.issuer && claims.iss !== options.issuer) {
			throw new Error(`Invalid issuer. Expected: ${options.issuer}, Got: ${claims.iss}`);
		}

		// Validate audience
		if (options.audience) {
			const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
			if (!audiences.includes(options.audience)) {
				throw new Error(`Invalid audience. Expected: ${options.audience}`);
			}
		}

		// Validate expiration
		const now = Math.floor(Date.now() / 1000);
		const clockTolerance = options.clockTolerance || 60;
		
		if (claims.exp && claims.exp < (now - clockTolerance)) {
			throw new Error('ID token has expired');
		}

		// Validate max age if provided
		if (options.maxAge && claims.auth_time) {
			const tokenAge = now - claims.auth_time;
			if (tokenAge > options.maxAge) {
				throw new Error(`ID token is too old. Age: ${tokenAge}s, Max: ${options.maxAge}s`);
			}
		}

		// Validate nonce if provided
		if (options.nonce && claims.nonce !== options.nonce) {
			throw new Error('Nonce mismatch');
		}

		return claims;
	}

	// Format claim value for display
	static formatClaimValue(value: unknown): string {
		if (value === null || value === undefined) return 'null';
		if (typeof value === 'boolean') return value ? 'true' : 'false';
		if (typeof value === 'number') {
			// Check if it's a timestamp
			if (value > 1000000000 && value < 9999999999) {
				return new Date(value * 1000).toISOString();
			}
			return value.toString();
		}
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}
}

// React component for displaying ID token claims
const OIDCIdTokenService: React.FC<{ 
	claims: IdTokenClaims; 
	collapsed?: boolean;
}> = ({ claims, collapsed = false }) => {
	const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

	const standardClaims = [
		'iss', 'sub', 'aud', 'exp', 'iat', 'auth_time', 'nonce',
		'acr', 'amr', 'azp'
	];

	const profileClaims = [
		'name', 'given_name', 'family_name', 'middle_name', 'nickname',
		'preferred_username', 'profile', 'picture', 'website',
		'email', 'email_verified', 'gender', 'birthdate', 'zoneinfo',
		'locale', 'phone_number', 'phone_number_verified', 'address', 'updated_at'
	];

	return React.createElement(ClaimsContainer, {}, [
		React.createElement('h4', { 
			key: 'title',
			style: { margin: '0 0 1rem 0', color: '#1f2937' }
		}, 'ID Token Claims'),
		
		...Object.entries(claims).map(([key, value]) => {
			const isStandard = standardClaims.includes(key);
			const isProfile = profileClaims.includes(key);
			const category = isStandard ? '🔐 Standard' : isProfile ? '👤 Profile' : '📋 Custom';

			return React.createElement(ClaimRow, { key }, [
				React.createElement(ClaimLabel, { key: 'label' }, `${category} ${key}:`),
				React.createElement(ClaimValue, { key: 'value' }, 
					OIDCIdTokenServiceClass.formatClaimValue(value)
				)
			]);
		})
	]);
};

export default OIDCIdTokenService;
export { OIDCIdTokenService };

