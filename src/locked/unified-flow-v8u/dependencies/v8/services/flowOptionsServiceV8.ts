/**
 * @file flowOptionsServiceV8.ts
 * @module v8/services
 * @description Flow-aware options service - determines which OAuth/OIDC options are valid for each flow
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service implements PingOne's smart option filtering:
 * - Only shows valid response types for the flow
 * - Only shows valid auth methods for the flow
 * - Disables options that don't apply
 * - Provides sensible defaults
 *
 * @example
 * const options = FlowOptionsServiceV8.getOptionsForFlow('oauth-authz-v8');
 * // Returns: { responseTypes: [...], authMethods: [...], ... }
 */

const MODULE_TAG = '[⚙️ FLOW-OPTIONS-V8]';

export type ResponseType =
	| 'code'
	| 'token'
	| 'id_token'
	| 'code token'
	| 'code id_token'
	| 'token id_token'
	| 'code token id_token';
export type AuthMethod =
	| 'none'
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';
export type PKCEEnforcement = 'REQUIRED' | 'OPTIONAL' | 'NOT_REQUIRED';

export interface FlowOptions {
	responseTypes: ResponseType[];
	authMethods: AuthMethod[];
	pkceEnforcement: PKCEEnforcement;
	supportsRefreshToken: boolean;
	supportsJWKS: boolean;
	requiresRedirectUri: boolean;
	requiresClientSecret: boolean;
	supportsLoginHint: boolean;
	supportsPostLogoutRedirectUri: boolean;
	supportsScopes: boolean;
	defaultResponseType: ResponseType;
	defaultAuthMethod: AuthMethod;
}

export class FlowOptionsServiceV8 {
	/**
	 * Get valid options for a specific flow
	 * @param flowKey - Flow key (e.g., 'oauth-authz-v8')
	 * @returns Flow options with valid choices
	 */
	static getOptionsForFlow(flowKey: string): FlowOptions {
		const normalized = flowKey.toLowerCase().replace(/[-_]/g, '-');

		console.log(`${MODULE_TAG} Getting options for flow`, { flowKey, normalized });

		// Authorization Code Flow
		if (normalized.includes('oauth-authz') || normalized.includes('authorization-code')) {
			return {
				responseTypes: ['code'],
				authMethods: [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
				],
				pkceEnforcement: 'OPTIONAL',
				supportsRefreshToken: true,
				supportsJWKS: true,
				requiresRedirectUri: true,
				requiresClientSecret: false,
				supportsLoginHint: true,
				supportsPostLogoutRedirectUri: false,
				supportsScopes: true,
				defaultResponseType: 'code',
				defaultAuthMethod: 'client_secret_post',
			};
		}

		// Implicit Flow
		if (normalized.includes('implicit')) {
			return {
				responseTypes: ['token', 'id_token', 'token id_token'],
				authMethods: ['none'],
				pkceEnforcement: 'NOT_REQUIRED',
				supportsRefreshToken: false,
				supportsJWKS: false,
				requiresRedirectUri: true,
				requiresClientSecret: false,
				supportsLoginHint: true,
				supportsPostLogoutRedirectUri: false,
				supportsScopes: true,
				defaultResponseType: 'token',
				defaultAuthMethod: 'none',
			};
		}

		// Hybrid Flow
		if (normalized.includes('hybrid')) {
			return {
				responseTypes: [
					'code',
					'id_token',
					'token id_token',
					'code id_token',
					'code token',
					'code token id_token',
				],
				authMethods: [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
				],
				pkceEnforcement: 'OPTIONAL',
				supportsRefreshToken: true,
				supportsJWKS: true,
				requiresRedirectUri: true,
				requiresClientSecret: false,
				supportsLoginHint: true,
				supportsPostLogoutRedirectUri: true,
				supportsScopes: true,
				defaultResponseType: 'code id_token',
				defaultAuthMethod: 'client_secret_post',
			};
		}

		// Client Credentials Flow
		if (normalized.includes('client-credentials') || normalized.includes('client_credentials')) {
			return {
				responseTypes: [],
				authMethods: [
					'client_secret_basic',
					'client_secret_post',
					'client_secret_jwt',
					'private_key_jwt',
				],
				pkceEnforcement: 'NOT_REQUIRED',
				supportsRefreshToken: false,
				supportsJWKS: true,
				requiresRedirectUri: false,
				requiresClientSecret: true,
				supportsLoginHint: false,
				supportsPostLogoutRedirectUri: false,
				supportsScopes: true,
				defaultResponseType: 'code',
				defaultAuthMethod: 'client_secret_post',
			};
		}

		// Device Authorization Flow
		if (normalized.includes('device')) {
			return {
				responseTypes: [],
				authMethods: ['none', 'client_secret_basic', 'client_secret_post'],
				pkceEnforcement: 'NOT_REQUIRED',
				supportsRefreshToken: true,
				supportsJWKS: false,
				requiresRedirectUri: false,
				requiresClientSecret: false,
				supportsLoginHint: false,
				supportsPostLogoutRedirectUri: false,
				supportsScopes: true,
				defaultResponseType: 'code',
				defaultAuthMethod: 'none',
			};
		}

		// PKCE Flow (Authorization Code with PKCE)
		if (normalized.includes('pkce')) {
			return {
				responseTypes: ['code'],
				authMethods: ['none'],
				pkceEnforcement: 'REQUIRED',
				supportsRefreshToken: true,
				supportsJWKS: false,
				requiresRedirectUri: true,
				requiresClientSecret: false,
				supportsLoginHint: true,
				supportsPostLogoutRedirectUri: false,
				supportsScopes: true,
				defaultResponseType: 'code',
				defaultAuthMethod: 'none',
			};
		}

		// Resource Owner Password Credentials (ROPC)
		if (normalized.includes('ropc') || normalized.includes('resource-owner-password')) {
			return {
				responseTypes: [],
				authMethods: ['client_secret_basic', 'client_secret_post'],
				pkceEnforcement: 'NOT_REQUIRED',
				supportsRefreshToken: true,
				supportsJWKS: false,
				requiresRedirectUri: false,
				requiresClientSecret: true,
				supportsLoginHint: false,
				supportsPostLogoutRedirectUri: false,
				supportsScopes: true,
				defaultResponseType: 'code',
				defaultAuthMethod: 'client_secret_post',
			};
		}

		// Default fallback
		console.warn(`${MODULE_TAG} Unknown flow type, using defaults`, { flowKey });
		return {
			responseTypes: ['code'],
			authMethods: [
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			],
			pkceEnforcement: 'OPTIONAL',
			supportsRefreshToken: true,
			supportsJWKS: true,
			requiresRedirectUri: true,
			requiresClientSecret: false,
			supportsLoginHint: true,
			supportsPostLogoutRedirectUri: true,
			supportsScopes: true,
			defaultResponseType: 'code',
			defaultAuthMethod: 'client_secret_post',
		};
	}

	/**
	 * Check if an auth method is available for a flow
	 * @param flowKey - Flow key
	 * @param authMethod - Auth method to check
	 * @returns True if available
	 */
	static isAuthMethodAvailable(flowKey: string, authMethod: AuthMethod): boolean {
		const options = FlowOptionsServiceV8.getOptionsForFlow(flowKey);
		return options.authMethods.includes(authMethod);
	}

	/**
	 * Check if a response type is available for a flow
	 * @param flowKey - Flow key
	 * @param responseType - Response type to check
	 * @returns True if available
	 */
	static isResponseTypeAvailable(flowKey: string, responseType: ResponseType): boolean {
		const options = FlowOptionsServiceV8.getOptionsForFlow(flowKey);
		return options.responseTypes.includes(responseType);
	}

	/**
	 * Get all available response types
	 * @returns All possible response types
	 */
	static getAllResponseTypes(): ResponseType[] {
		return [
			'code',
			'token',
			'id_token',
			'code token',
			'code id_token',
			'token id_token',
			'code token id_token',
		];
	}

	/**
	 * Get all available auth methods
	 * @returns All possible auth methods
	 */
	static getAllAuthMethods(): AuthMethod[] {
		return [
			'none',
			'client_secret_basic',
			'client_secret_post',
			'client_secret_jwt',
			'private_key_jwt',
		];
	}

	/**
	 * Get human-readable label for auth method
	 * @param method - Auth method
	 * @returns Display label
	 */
	static getAuthMethodLabel(method: AuthMethod): string {
		const labels: Record<AuthMethod, string> = {
			none: 'None',
			client_secret_basic: 'Client Secret Basic',
			client_secret_post: 'Client Secret Post',
			client_secret_jwt: 'Client Secret JWT',
			private_key_jwt: 'Private Key JWT',
		};
		return labels[method] || method;
	}

	/**
	 * Get human-readable label for response type
	 * @param type - Response type
	 * @returns Display label
	 */
	static getResponseTypeLabel(type: ResponseType): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	/**
	 * Get human-readable label for PKCE enforcement
	 * @param enforcement - PKCE enforcement level
	 * @returns Display label
	 */
	static getPKCELabel(enforcement: PKCEEnforcement): string {
		const labels: Record<PKCEEnforcement, string> = {
			REQUIRED: 'Required',
			OPTIONAL: 'Optional',
			NOT_REQUIRED: 'Not Required',
		};
		return labels[enforcement] || enforcement;
	}
}

export default FlowOptionsServiceV8;
