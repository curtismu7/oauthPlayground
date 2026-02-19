/**
 * @file tokenUtilityService.ts
 * @module protect-portal/services
 * @description Token utility service for OIDC token parsing and validation
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This service provides utilities for parsing and validating OIDC tokens.
 */

import type { TokenSet } from '../types/protectPortal.types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface JWTPayload {
	iss?: string; // Issuer
	sub?: string; // Subject (user ID)
	aud?: string | string[]; // Audience
	exp?: number; // Expiration time
	iat?: number; // Issued at
	auth_time?: number; // Authentication time
	nonce?: string; // Nonce
	acr?: string; // Authentication context class reference
	amr?: string[]; // Authentication methods references
	azp?: string; // Authorized party
	name?: string; // Full name
	given_name?: string; // Given name
	family_name?: string; // Family name
	middle_name?: string; // Middle name
	nickname?: string; // Nickname
	preferred_username?: string; // Preferred username
	email?: string; // Email
	email_verified?: boolean; // Email verification status
	picture?: string; // Profile picture URL
	locale?: string; // Locale
	phone_number?: string; // Phone number
	phone_number_verified?: boolean; // Phone verification status
	address?: {
		formatted?: string;
		street_address?: string;
		locality?: string;
		region?: string;
		postal_code?: string;
		country?: string;
	};
	updated_at?: number; // Last update time
	[key: string]: any; // Additional claims
}

export interface TokenValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	decodedTokens: {
		accessToken?: JWTPayload;
		idToken?: JWTPayload;
	};
	tokenInfo: {
		accessTokenExpiry: Date | null;
		idTokenExpiry: Date | null;
		timeUntilExpiry: {
			accessToken: string;
			idToken: string;
		};
	};
}

// ============================================================================
// TOKEN UTILITY SERVICE
// ============================================================================

class TokenUtilityService {
	/**
	 * Parse JWT token without verification (for display purposes only)
	 */
	static parseJWT(token: string): JWTPayload | null {
		try {
			// JWT format: header.payload.signature
			const parts = token.split('.');
			if (parts.length !== 3) {
				throw new Error('Invalid JWT format');
			}

			// Decode payload (base64url encoded)
			const payload = parts[1];
			const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
			const jsonPayload = decodeURIComponent(
				atob(base64)
					.split('')
					.map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
					.join('')
			);

			return JSON.parse(jsonPayload);
		} catch (error) {
			console.error('[🔐 TOKEN-UTILITY] Failed to parse JWT:', error);
			return null;
		}
	}

	/**
	 * Validate token set and provide detailed information
	 */
	static validateTokens(tokens: TokenSet): TokenValidationResult {
		const result: TokenValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
			decodedTokens: {},
			tokenInfo: {
				accessTokenExpiry: null,
				idTokenExpiry: null,
				timeUntilExpiry: {
					accessToken: 'Unknown',
					idToken: 'Unknown',
				},
			},
		};

		// Validate access token
		if (!tokens.accessToken) {
			result.isValid = false;
			result.errors.push('Access token is missing');
		} else {
			const decoded = TokenUtilityService.parseJWT(tokens.accessToken);
			if (decoded) {
				result.decodedTokens.accessToken = decoded;

				if (decoded.exp) {
					const expiryDate = new Date(decoded.exp * 1000);
					result.tokenInfo.accessTokenExpiry = expiryDate;

					const timeUntilExpiry = expiryDate.getTime() - Date.now();
					if (timeUntilExpiry < 0) {
						result.isValid = false;
						result.errors.push('Access token has expired');
						result.tokenInfo.timeUntilExpiry.accessToken = 'Expired';
					} else if (timeUntilExpiry < 5 * 60 * 1000) {
						// Less than 5 minutes
						result.warnings.push('Access token expires soon');
						result.tokenInfo.timeUntilExpiry.accessToken =
							TokenUtilityService.formatDuration(timeUntilExpiry);
					} else {
						result.tokenInfo.timeUntilExpiry.accessToken =
							TokenUtilityService.formatDuration(timeUntilExpiry);
					}
				}
			} else {
				result.warnings.push('Access token is not a valid JWT (may be opaque)');
			}
		}

		// Validate ID token
		if (tokens.idToken) {
			const decoded = TokenUtilityService.parseJWT(tokens.idToken);
			if (decoded) {
				result.decodedTokens.idToken = decoded;

				if (decoded.exp) {
					const expiryDate = new Date(decoded.exp * 1000);
					result.tokenInfo.idTokenExpiry = expiryDate;

					const timeUntilExpiry = expiryDate.getTime() - Date.now();
					if (timeUntilExpiry < 0) {
						result.isValid = false;
						result.errors.push('ID token has expired');
						result.tokenInfo.timeUntilExpiry.idToken = 'Expired';
					} else if (timeUntilExpiry < 5 * 60 * 1000) {
						// Less than 5 minutes
						result.warnings.push('ID token expires soon');
						result.tokenInfo.timeUntilExpiry.idToken =
							TokenUtilityService.formatDuration(timeUntilExpiry);
					} else {
						result.tokenInfo.timeUntilExpiry.idToken =
							TokenUtilityService.formatDuration(timeUntilExpiry);
					}
				}

				// Validate required OIDC claims
				if (!decoded.iss) {
					result.warnings.push('ID token missing issuer claim (iss)');
				}
				if (!decoded.sub) {
					result.warnings.push('ID token missing subject claim (sub)');
				}
				if (!decoded.aud) {
					result.warnings.push('ID token missing audience claim (aud)');
				}
			} else {
				result.warnings.push('ID token is not a valid JWT');
			}
		} else {
			result.warnings.push('No ID token present');
		}

		// Validate token metadata
		if (!tokens.tokenType) {
			result.warnings.push('Token type not specified');
		}
		if (!tokens.expiresIn || tokens.expiresIn <= 0) {
			result.warnings.push('Token expiry time not specified or invalid');
		}
		if (!tokens.scope) {
			result.warnings.push('Token scope not specified');
		}

		return result;
	}

	/**
	 * Format duration in milliseconds to human-readable format
	 */
	private static formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) {
			return `${days}d ${hours % 24}h`;
		} else if (hours > 0) {
			return `${hours}h ${minutes % 60}m`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		} else {
			return `${seconds}s`;
		}
	}

	/**
	 * Get token scopes as array
	 */
	static getTokenScopes(tokens: TokenSet): string[] {
		if (!tokens.scope) {
			return [];
		}
		return tokens.scope.split(' ').filter((scope) => scope.length > 0);
	}

	/**
	 * Check if token includes specific scope
	 */
	static hasScope(tokens: TokenSet, scope: string): boolean {
		const scopes = TokenUtilityService.getTokenScopes(tokens);
		return scopes.includes(scope);
	}

	/**
	 * Get user information from ID token
	 */
	static getUserInfoFromIdToken(tokens: TokenSet): Partial<JWTPayload> | null {
		if (!tokens.idToken) {
			return null;
		}

		const decoded = TokenUtilityService.parseJWT(tokens.idToken);
		if (!decoded) {
			return null;
		}

		// Return common user claims
		return {
			sub: decoded.sub,
			name: decoded.name,
			given_name: decoded.given_name,
			family_name: decoded.family_name,
			email: decoded.email,
			email_verified: decoded.email_verified,
			picture: decoded.picture,
			preferred_username: decoded.preferred_username,
			phone_number: decoded.phone_number,
			phone_number_verified: decoded.phone_number_verified,
			locale: decoded.locale,
		};
	}

	/**
	 * Format claim value for display
	 */
	static formatClaimValue(value: any): string {
		if (value === null || value === undefined) {
			return 'Not set';
		}

		if (typeof value === 'boolean') {
			return value ? 'Yes' : 'No';
		}

		if (typeof value === 'number') {
			// Check if it's a timestamp
			if (value > 1000000000 && value < 2000000000) {
				return new Date(value * 1000).toLocaleString();
			}
			return value.toString();
		}

		if (Array.isArray(value)) {
			return value.join(', ');
		}

		if (typeof value === 'object') {
			return JSON.stringify(value, null, 2);
		}

		return String(value);
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default TokenUtilityService;
