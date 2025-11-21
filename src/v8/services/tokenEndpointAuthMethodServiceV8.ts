/**
 * @file tokenEndpointAuthMethodServiceV8.ts
 * @module v8/services
 * @description Service for determining valid Token Endpoint Authentication Methods based on OAuth/OIDC flow
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service provides OAuth 2.0 and OpenID Connect compliant authentication method options
 * based on:
 * - Flow type (Authorization Code, Implicit, Client Credentials, etc.)
 * - Spec version (OAuth 2.0, OAuth 2.1, OIDC)
 * - PKCE usage (affects whether 'none' is allowed)
 * - Client type (public vs confidential)
 *
 * @example
 * const methods = TokenEndpointAuthMethodServiceV8.getAuthMethods('oauth-authz', 'oauth2.0', false);
 * // Returns: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt']
 */

import { type FlowType, type SpecVersion } from './specVersionServiceV8';

const MODULE_TAG = '[🔐 TOKEN-ENDPOINT-AUTH-METHOD-V8]';

export type TokenEndpointAuthMethod =
	| 'none'
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';

export interface AuthMethodInfo {
	method: TokenEndpointAuthMethod;
	label: string;
	description: string;
	rfc?: string;
}

export class TokenEndpointAuthMethodServiceV8 {
	/**
	 * Get valid authentication methods for a flow
	 * @param flowType - OAuth/OIDC flow type
	 * @param specVersion - OAuth 2.0, 2.1, or OIDC
	 * @param usePKCE - Whether PKCE is being used (affects if 'none' is allowed)
	 * @returns Array of valid authentication methods
	 */
	static getAuthMethods(
		flowType: FlowType,
		specVersion: SpecVersion,
		usePKCE: boolean = false
	): TokenEndpointAuthMethod[] {
		console.log(`${MODULE_TAG} Getting auth methods`, { flowType, specVersion, usePKCE });

		// Authorization Code Flow
		if (flowType === 'oauth-authz') {
			// With PKCE: public client can use 'none'
			// Without PKCE: confidential client must authenticate
			if (usePKCE) {
				return [
					'none',
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
				];
			}
			// Confidential client - must authenticate
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		}

		// Implicit Flow (deprecated in OAuth 2.1)
		if (flowType === 'implicit') {
			// Implicit flow is for public clients only - no client authentication
			return ['none'];
		}

		// Hybrid Flow
		if (flowType === 'hybrid') {
			// Hybrid flow typically uses confidential clients
			// But can support public clients with PKCE
			if (usePKCE) {
				return [
					'none',
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
				];
			}
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		}

		// Client Credentials Flow
		if (flowType === 'client-credentials') {
			// Client Credentials flow REQUIRES client authentication (RFC 6749 Section 4.4)
			// 'none' is NOT allowed
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		}

		// Device Authorization Flow (RFC 8628)
		if (flowType === 'device-code') {
			// Device flow can be public (none) or confidential
			// Public clients are common for device flows
			return ['none', 'client_secret_basic', 'client_secret_post'];
		}

		// Resource Owner Password Credentials (ROPC) - Deprecated
		if (flowType === 'ropc') {
			// ROPC flow REQUIRES client authentication (RFC 6749 Section 4.3)
			// 'none' is NOT allowed
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		}

		// Default fallback
		console.warn(`${MODULE_TAG} Unknown flow type, using default auth methods`, { flowType });
		return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
	}

	/**
	 * Get default authentication method for a flow
	 * @param flowType - OAuth/OIDC flow type
	 * @param specVersion - OAuth 2.0, 2.1, or OIDC
	 * @param usePKCE - Whether PKCE is being used
	 * @returns Default authentication method
	 */
	static getDefaultAuthMethod(
		flowType: FlowType,
		specVersion: SpecVersion,
		usePKCE: boolean = false
	): TokenEndpointAuthMethod {
		const methods = TokenEndpointAuthMethodServiceV8.getAuthMethods(flowType, specVersion, usePKCE);

		// Prefer 'client_secret_post' for confidential clients
		if (methods.includes('client_secret_post')) {
			return 'client_secret_post';
		}

		// Fallback to first available method
		return methods[0] || 'client_secret_post';
	}

	/**
	 * Get human-readable label for authentication method
	 * @param method - Authentication method
	 * @returns Display label
	 */
	static getAuthMethodLabel(method: TokenEndpointAuthMethod): string {
		const labels: Record<TokenEndpointAuthMethod, string> = {
			none: 'None (Public Client)',
			client_secret_basic: 'Client Secret Basic (HTTP Basic)',
			client_secret_post: 'Client Secret Post (Form Body)',
			client_secret_jwt: 'Client Secret JWT',
			private_key_jwt: 'Private Key JWT',
		};
		return labels[method] || method;
	}

	/**
	 * Get detailed information about an authentication method
	 * @param method - Authentication method
	 * @returns Method information
	 */
	static getAuthMethodInfo(method: TokenEndpointAuthMethod): AuthMethodInfo {
		const info: Record<TokenEndpointAuthMethod, AuthMethodInfo> = {
			none: {
				method: 'none',
				label: 'None (Public Client)',
				description:
					'No client authentication. Used for public clients (e.g., SPAs, mobile apps) when using PKCE.',
				rfc: 'RFC 6749, Section 2.3.1',
			},
			client_secret_basic: {
				method: 'client_secret_basic',
				label: 'Client Secret Basic (HTTP Basic)',
				description:
					'Client authenticates using HTTP Basic authentication with client_id and client_secret.',
				rfc: 'RFC 6749, Section 2.3.1',
			},
			client_secret_post: {
				method: 'client_secret_post',
				label: 'Client Secret Post (Form Body)',
				description:
					'Client authenticates by including client_id and client_secret in the request body.',
				rfc: 'RFC 6749, Section 2.3.1',
			},
			client_secret_jwt: {
				method: 'client_secret_jwt',
				label: 'Client Secret JWT',
				description:
					'Client authenticates using a JWT signed with a symmetric key (client_secret).',
				rfc: 'RFC 7523, Section 2.2',
			},
			private_key_jwt: {
				method: 'private_key_jwt',
				label: 'Private Key JWT',
				description: 'Client authenticates using a JWT signed with an asymmetric private key.',
				rfc: 'RFC 7523, Section 2.2',
			},
		};
		return (
			info[method] || {
				method,
				label: method,
				description: 'Unknown authentication method',
			}
		);
	}

	/**
	 * Check if an authentication method is valid for a flow
	 * @param method - Authentication method to check
	 * @param flowType - OAuth/OIDC flow type
	 * @param specVersion - OAuth 2.0, 2.1, or OIDC
	 * @param usePKCE - Whether PKCE is being used
	 * @returns True if method is valid
	 */
	static isAuthMethodValid(
		method: TokenEndpointAuthMethod,
		flowType: FlowType,
		specVersion: SpecVersion,
		usePKCE: boolean = false
	): boolean {
		const validMethods = TokenEndpointAuthMethodServiceV8.getAuthMethods(
			flowType,
			specVersion,
			usePKCE
		);
		return validMethods.includes(method);
	}

	/**
	 * Get all authentication methods with enabled/disabled status
	 * @param flowType - OAuth/OIDC flow type
	 * @param specVersion - OAuth 2.0, 2.1, or OIDC
	 * @param usePKCE - Whether PKCE is being used
	 * @returns Array of all methods with enabled status and reason if disabled
	 */
	static getAllAuthMethodsWithStatus(
		flowType: FlowType,
		specVersion: SpecVersion,
		usePKCE: boolean = false
	): Array<{
		method: TokenEndpointAuthMethod;
		label: string;
		enabled: boolean;
		disabledReason?: string;
	}> {
		const validMethods = TokenEndpointAuthMethodServiceV8.getAuthMethods(
			flowType,
			specVersion,
			usePKCE
		);

		// All possible methods
		const allMethods: TokenEndpointAuthMethod[] = [
			'none',
			'client_secret_basic',
			'client_secret_post',
			'client_secret_jwt',
			'private_key_jwt',
		];

		return allMethods.map((method) => {
			const enabled = validMethods.includes(method);
			let disabledReason: string | undefined;

			if (!enabled) {
				// Provide specific reasons why a method is disabled
				if (method === 'none') {
					if (flowType === 'client-credentials') {
						disabledReason = 'Client Credentials flow requires authentication';
					} else if (flowType === 'ropc') {
						disabledReason = 'ROPC flow requires authentication';
					} else if (flowType === 'oauth-authz' && !usePKCE) {
						disabledReason = 'Enable PKCE to use public client (none)';
					} else if (flowType === 'hybrid' && !usePKCE) {
						disabledReason = 'Enable PKCE to use public client (none)';
					}
				} else {
					// Secret-based methods disabled for implicit
					if (flowType === 'implicit') {
						disabledReason = 'Implicit flow does not use token endpoint';
					}
				}
			}

			return {
				method,
				label: TokenEndpointAuthMethodServiceV8.getAuthMethodLabel(method),
				enabled,
				disabledReason,
			};
		});
	}
}
