/**
 * @file authMethodServiceV8.ts
 * @module v8/services
 * @description Token Endpoint Authentication Method Service for V8
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides configuration and utilities for OAuth 2.0 client authentication methods:
 * - client_secret_basic (HTTP Basic Auth)
 * - client_secret_post (POST body)
 * - client_secret_jwt (JWT with client secret)
 * - private_key_jwt (JWT with private key)
 * - none (Public clients)
 */

const MODULE_TAG = '[🔐 AUTH-METHOD-SERVICE-V8]';

export type AuthMethodV8 =
	| 'none'
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';

export interface AuthMethodConfigV8 {
	method: AuthMethodV8;
	label: string;
	description: string;
	requiresClientSecret: boolean;
	securityLevel: 'low' | 'medium' | 'high';
	useCases: string[];
	recommended?: boolean;
	pingOneSupported: boolean;
}

/**
 * AuthMethodServiceV8
 *
 * Service for managing OAuth 2.0 client authentication methods
 */
export class AuthMethodServiceV8 {
	/**
	 * Get all authentication method configurations
	 */
	static getAllMethodConfigs(): Record<AuthMethodV8, AuthMethodConfigV8> {
		return {
			none: {
				method: 'none',
				label: 'None (Public Client)',
				description: 'No client authentication - for public clients with PKCE',
				requiresClientSecret: false,
				securityLevel: 'low',
				useCases: [
					'Single Page Applications (SPAs)',
					'Mobile apps',
					'Public clients that cannot securely store secrets',
					'Must use PKCE for security',
				],
				pingOneSupported: true,
			},
			client_secret_basic: {
				method: 'client_secret_basic',
				label: 'Client Secret Basic',
				description: 'Client credentials sent in HTTP Basic Authorization header',
				requiresClientSecret: true,
				securityLevel: 'high',
				recommended: true,
				useCases: [
					'Recommended for most server-to-server scenarios',
					'Standard OAuth 2.0 client authentication',
					'Backend services with secure credential storage',
					'Server-to-server communication',
				],
				pingOneSupported: true,
			},
			client_secret_post: {
				method: 'client_secret_post',
				label: 'Client Secret Post',
				description: 'Client credentials sent in request body',
				requiresClientSecret: true,
				securityLevel: 'medium',
				useCases: [
					'When Basic Auth is not supported',
					'Clients that cannot use HTTP Basic authentication',
					'Legacy system integration',
					'Simpler implementation requirements',
				],
				pingOneSupported: true,
			},
			client_secret_jwt: {
				method: 'client_secret_jwt',
				label: 'Client Secret JWT',
				description: 'JWT signed with client secret (HMAC)',
				requiresClientSecret: true,
				securityLevel: 'high',
				useCases: [
					'Enhanced security with JWT assertions',
					'When you need additional claims in the token',
					'Compatibility with JWT-based systems',
					'RFC 7523 compliant authentication',
				],
				pingOneSupported: true,
			},
			private_key_jwt: {
				method: 'private_key_jwt',
				label: 'Private Key JWT',
				description: 'JWT signed with client private key (RSA/EC)',
				requiresClientSecret: false,
				securityLevel: 'high',
				recommended: true,
				useCases: [
					'Highest security requirements',
					'Public key infrastructure (PKI) environments',
					'Cryptographic authentication',
					'RFC 7523 compliant authentication',
				],
				pingOneSupported: true,
			},
		};
	}

	/**
	 * Get configuration for a specific authentication method
	 */
	static getMethodConfig(method: AuthMethodV8): AuthMethodConfigV8 {
		const configs = AuthMethodServiceV8.getAllMethodConfigs();
		return configs[method];
	}

	/**
	 * Get all supported authentication methods
	 */
	static getSupportedMethods(): AuthMethodV8[] {
		return Object.keys(AuthMethodServiceV8.getAllMethodConfigs()) as AuthMethodV8[];
	}

	/**
	 * Get methods supported by PingOne
	 */
	static getPingOneSupportedMethods(): AuthMethodV8[] {
		const configs = AuthMethodServiceV8.getAllMethodConfigs();
		return Object.entries(configs)
			.filter(([_, config]) => config.pingOneSupported)
			.map(([method]) => method as AuthMethodV8);
	}

	/**
	 * Check if a method is valid
	 */
	static isValidMethod(method: string): method is AuthMethodV8 {
		return method in AuthMethodServiceV8.getAllMethodConfigs();
	}

	/**
	 * Get display label for a method
	 */
	static getDisplayLabel(method: AuthMethodV8): string {
		return AuthMethodServiceV8.getMethodConfig(method).label;
	}

	/**
	 * Get available methods for a specific flow type
	 * @param flowType - The OAuth/OIDC flow type
	 * @returns Array of available authentication methods
	 */
	static getAvailableMethodsForFlow(flowType: string): AuthMethodV8[] {
		const normalizedFlowType = flowType.toLowerCase();

		console.log(`${MODULE_TAG} Getting available auth methods for flow`, { flowType });

		// Client Credentials - always requires authentication
		if (
			normalizedFlowType.includes('client-credentials') ||
			normalizedFlowType.includes('worker')
		) {
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		}

		// ROPC - always requires authentication
		if (normalizedFlowType.includes('ropc') || normalizedFlowType.includes('password')) {
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		}

		// Device Code - can be public or confidential
		if (normalizedFlowType.includes('device')) {
			return ['none', 'client_secret_basic', 'client_secret_post'];
		}

		// Authorization Code - can be public (with PKCE) or confidential
		if (normalizedFlowType.includes('authz') || normalizedFlowType.includes('authorization')) {
			return [
				'none',
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			];
		}

		// Implicit - typically public clients
		if (normalizedFlowType.includes('implicit')) {
			return ['none'];
		}

		// Hybrid - can be public or confidential
		if (normalizedFlowType.includes('hybrid')) {
			return [
				'none',
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			];
		}

		// Default: allow all methods
		return [
			'none',
			'client_secret_basic',
			'client_secret_post',
			'client_secret_jwt',
			'private_key_jwt',
		];
	}

	/**
	 * Check if a method requires client secret
	 */
	static requiresClientSecret(method: AuthMethodV8): boolean {
		return AuthMethodServiceV8.getMethodConfig(method).requiresClientSecret;
	}

	/**
	 * Get recommended method for a flow type
	 */
	static getRecommendedMethod(flowType: string): AuthMethodV8 {
		const normalizedFlowType = flowType.toLowerCase();

		// Server-to-server flows: recommend client_secret_basic
		if (
			normalizedFlowType.includes('client-credentials') ||
			normalizedFlowType.includes('worker') ||
			normalizedFlowType.includes('ropc')
		) {
			return 'client_secret_basic';
		}

		// Public client flows: recommend none (with PKCE)
		if (normalizedFlowType.includes('implicit')) {
			return 'none';
		}

		// Authorization code: recommend none for SPAs, client_secret_basic for backend
		if (normalizedFlowType.includes('authz') || normalizedFlowType.includes('authorization')) {
			return 'none'; // Assume SPA by default, user can change
		}

		// Default: client_secret_basic
		return 'client_secret_basic';
	}

	/**
	 * Validate that a method is appropriate for a flow type
	 */
	static validateMethodForFlow(
		method: AuthMethodV8,
		flowType: string
	): {
		valid: boolean;
		warning?: string;
	} {
		const availableMethods = AuthMethodServiceV8.getAvailableMethodsForFlow(flowType);

		if (!availableMethods.includes(method)) {
			return {
				valid: false,
				warning: `${method} is not supported for ${flowType} flow`,
			};
		}

		// Additional validation warnings
		const normalizedFlowType = flowType.toLowerCase();

		if (method === 'none' && normalizedFlowType.includes('client-credentials')) {
			return {
				valid: false,
				warning: 'Client Credentials flow requires client authentication',
			};
		}

		if (method === 'none' && !normalizedFlowType.includes('pkce')) {
			return {
				valid: true,
				warning: 'Public clients (none) should use PKCE for security',
			};
		}

		return { valid: true };
	}
}
