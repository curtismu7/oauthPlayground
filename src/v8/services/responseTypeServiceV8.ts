/**
 * @file responseTypeServiceV8.ts
 * @module v8/services
 * @description Service for determining valid Response Types based on OAuth/OIDC flow
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service provides OAuth 2.0 and OpenID Connect compliant response type options
 * based on:
 * - Flow type (Authorization Code, Implicit, Hybrid, etc.)
 * - Spec version (OAuth 2.0, OAuth 2.1, OIDC)
 * - Whether OIDC features are enabled
 *
 * @example
 * const responseTypes = ResponseTypeServiceV8.getResponseTypes('oauth-authz', 'oidc');
 * // Returns: ['code', 'code id_token']
 */

import { type FlowType, type SpecVersion } from './specVersionServiceV8';

const MODULE_TAG = '[📋 RESPONSE-TYPE-V8]';

export type ResponseType =
	| 'code'
	| 'token'
	| 'id_token'
	| 'code token'
	| 'code id_token'
	| 'token id_token'
	| 'code token id_token';

export interface ResponseTypeInfo {
	type: ResponseType;
	label: string;
	description: string;
	rfc?: string;
	oidcOnly?: boolean;
}

export class ResponseTypeServiceV8 {
	/**
	 * Get valid response types for a flow
	 * @param flowType - OAuth/OIDC flow type
	 * @param specVersion - OAuth 2.0, 2.1, or OIDC
	 * @returns Array of valid response types
	 */
	static getResponseTypes(flowType: FlowType, specVersion: SpecVersion): ResponseType[] {
		console.log(`${MODULE_TAG} Getting response types`, { flowType, specVersion });

		// Authorization Code Flow
		if (flowType === 'oauth-authz') {
			if (specVersion === 'oidc') {
				// OIDC Authorization Code Flow supports:
				// - 'code' (standard OAuth 2.0)
				// - 'code id_token' (OIDC hybrid-like, but still uses authorization code)
				return ['code', 'code id_token'];
			}
			// Pure OAuth 2.0 Authorization Code Flow
			return ['code'];
		}

		// Implicit Flow (deprecated in OAuth 2.1)
		if (flowType === 'implicit') {
			if (specVersion === 'oidc') {
				// OIDC Implicit Flow supports:
				// - 'id_token' (ID token only)
				// - 'token id_token' (access token + ID token)
				// Note: 'token' alone is not recommended for OIDC
				return ['id_token', 'token id_token'];
			}
			// Pure OAuth 2.0 Implicit Flow (deprecated)
			// - 'token' (access token only)
			// - 'token id_token' (access token + ID token, OIDC extension)
			return ['token', 'token id_token'];
		}

		// Hybrid Flow (OIDC only)
		if (flowType === 'hybrid') {
			// Hybrid flow is OIDC-specific
			// Supports all hybrid response types:
			return [
				'code id_token', // Authorization code + ID token
				'code token', // Authorization code + access token
				'code token id_token', // Authorization code + access token + ID token
			];
		}

		// Client Credentials Flow
		if (flowType === 'client-credentials') {
			// Client Credentials flow does not use authorization endpoint
			// No response_type parameter
			return [];
		}

		// Device Authorization Flow
		if (flowType === 'device-code') {
			// Device flow does not use authorization endpoint
			// No response_type parameter
			return [];
		}

		// Resource Owner Password Credentials (ROPC)
		if (flowType === 'ropc') {
			// ROPC flow does not use authorization endpoint
			// No response_type parameter
			return [];
		}

		// Default fallback
		console.warn(`${MODULE_TAG} Unknown flow type, using default response types`, { flowType });
		return ['code'];
	}

	/**
	 * Get default response type for a flow
	 * @param flowType - OAuth/OIDC flow type
	 * @param specVersion - OAuth 2.0, 2.1, or OIDC
	 * @returns Default response type
	 */
	static getDefaultResponseType(flowType: FlowType, specVersion: SpecVersion): ResponseType {
		const types = ResponseTypeServiceV8.getResponseTypes(flowType, specVersion);

		// Prefer 'code' for authorization code flow
		if (types.includes('code')) {
			return 'code';
		}

		// Prefer 'id_token' for implicit flow in OIDC
		if (types.includes('id_token') && specVersion === 'oidc') {
			return 'id_token';
		}

		// Prefer 'code id_token' for hybrid flow
		if (types.includes('code id_token')) {
			return 'code id_token';
		}

		// Fallback to first available type
		return types[0] || 'code';
	}

	/**
	 * Get human-readable label for response type
	 * @param type - Response type
	 * @returns Display label
	 */
	static getResponseTypeLabel(type: ResponseType): string {
		const labels: Record<ResponseType, string> = {
			code: 'code (Authorization Code)',
			token: 'token (Access Token)',
			id_token: 'id_token (ID Token)',
			'code token': 'code token (Code + Access Token)',
			'code id_token': 'code id_token (Code + ID Token)',
			'token id_token': 'token id_token (Access Token + ID Token)',
			'code token id_token': 'code token id_token (Code + Access Token + ID Token)',
		};
		return labels[type] || type;
	}

	/**
	 * Get detailed information about a response type
	 * @param type - Response type
	 * @returns Response type information
	 */
	static getResponseTypeInfo(type: ResponseType): ResponseTypeInfo {
		const info: Record<ResponseType, ResponseTypeInfo> = {
			code: {
				type: 'code',
				label: 'code (Authorization Code)',
				description:
					'Standard OAuth 2.0 Authorization Code flow. Returns an authorization code that is exchanged for tokens.',
				rfc: 'RFC 6749, Section 4.1',
			},
			token: {
				type: 'token',
				label: 'token (Access Token)',
				description:
					'OAuth 2.0 Implicit flow (deprecated). Returns access token directly in the URL fragment.',
				rfc: 'RFC 6749, Section 4.2',
				oidcOnly: false,
			},
			id_token: {
				type: 'id_token',
				label: 'id_token (ID Token)',
				description: 'OpenID Connect Implicit flow. Returns ID token directly in the URL fragment.',
				rfc: 'OpenID Connect Core, Section 3.2',
				oidcOnly: true,
			},
			'code token': {
				type: 'code token',
				label: 'code token (Code + Access Token)',
				description: 'OpenID Connect Hybrid flow. Returns authorization code and access token.',
				rfc: 'OpenID Connect Core, Section 3.3',
				oidcOnly: true,
			},
			'code id_token': {
				type: 'code id_token',
				label: 'code id_token (Code + ID Token)',
				description: 'OpenID Connect Hybrid flow. Returns authorization code and ID token.',
				rfc: 'OpenID Connect Core, Section 3.3',
				oidcOnly: true,
			},
			'token id_token': {
				type: 'token id_token',
				label: 'token id_token (Access Token + ID Token)',
				description:
					'OpenID Connect Implicit flow. Returns access token and ID token directly in the URL fragment.',
				rfc: 'OpenID Connect Core, Section 3.2',
				oidcOnly: true,
			},
			'code token id_token': {
				type: 'code token id_token',
				label: 'code token id_token (Code + Access Token + ID Token)',
				description:
					'OpenID Connect Hybrid flow. Returns authorization code, access token, and ID token.',
				rfc: 'OpenID Connect Core, Section 3.3',
				oidcOnly: true,
			},
		};
		return (
			info[type] || {
				type,
				label: type,
				description: 'Unknown response type',
			}
		);
	}

	/**
	 * Check if a response type is valid for a flow
	 * @param type - Response type to check
	 * @param flowType - OAuth/OIDC flow type
	 * @param specVersion - OAuth 2.0, 2.1, or OIDC
	 * @returns True if type is valid
	 */
	static isResponseTypeValid(
		type: ResponseType,
		flowType: FlowType,
		specVersion: SpecVersion
	): boolean {
		const validTypes = ResponseTypeServiceV8.getResponseTypes(flowType, specVersion);
		return validTypes.includes(type);
	}
}
