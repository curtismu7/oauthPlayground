/**
 * @file unifiedAuthenticationService.ts
 * @module shared/services
 * @description Unified Authentication Service for OAuth 2.0 and OIDC
 * @version 1.0.0
 * @since 2026-02-19
 *
 * Consolidates authentication method functionality from:
 * - AuthMethodServiceV8 (static configuration and metadata)
 * - TokenEndpointAuthMethodServiceV8 (flow-specific validation)
 *
 * Provides comprehensive OAuth 2.0 and OpenID Connect authentication method support:
 * - Authentication method configurations and metadata
 * - Flow-specific validation and filtering
 * - Security level assessments
 * - PKCE integration
 * - Client type considerations
 *
 * @example
 * import { unifiedAuthenticationService } from '@/shared/services/unifiedAuthenticationService';
 *
 * // Get all authentication methods with metadata
 * const methods = unifiedAuthenticationService.getAllAuthMethods();
 *
 * // Get valid methods for a specific flow
 * const validMethods = unifiedAuthenticationService.getValidAuthMethods('oauth-authz', 'oauth2.0', true);
 *
 * // Get method configuration
 * const config = unifiedAuthenticationService.getAuthMethodConfig('client_secret_basic');
 */

const MODULE_TAG = '[🔐 UNIFIED-AUTH-SERVICE]';

// Unified authentication method type
export type UnifiedAuthMethod =
	| 'none'
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';

// Flow types (import from existing service)
export type FlowType =
	| 'oauth-authz'
	| 'implicit'
	| 'client-credentials'
	| 'device-code'
	| 'hybrid'
	| 'resource-owner'
	| 'ciba'
	| 'ropc';

// Spec versions
export type SpecVersion = 'oauth2.0' | 'oauth2.1' | 'oidc';

// Enhanced authentication method configuration
export interface UnifiedAuthMethodConfig {
	method: UnifiedAuthMethod;
	label: string;
	description: string;
	requiresClientSecret: boolean;
	securityLevel: 'low' | 'medium' | 'high';
	recommended?: boolean;
	useCases: string[];
	pingOneSupported: boolean;
	oauthCompliant: boolean;
	oidcCompliant: boolean;
	pkceCompatible: boolean;
	clientTypes: ('public' | 'confidential')[];
	flowCompatibility: FlowType[];
}

// Authentication method validation result
export interface AuthMethodValidation {
	method: UnifiedAuthMethod;
	isValid: boolean;
	reason?: string | undefined;
	securityScore: number;
	recommendation: 'required' | 'recommended' | 'optional' | 'not-recommended';
}

// Flow authentication requirements
export interface FlowAuthRequirements {
	flowType: FlowType;
	specVersion: SpecVersion;
	requiresAuthentication: boolean;
	supportsPKCE: boolean;
	allowedClientTypes: ('public' | 'confidential')[];
	defaultMethod?: UnifiedAuthMethod;
	securityMinimum: 'low' | 'medium' | 'high';
}

export class UnifiedAuthenticationService {
	/**
	 * Get all authentication method configurations with enhanced metadata
	 */
	static getAllAuthMethodConfigs(): Record<UnifiedAuthMethod, UnifiedAuthMethodConfig> {
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
				oauthCompliant: true,
				oidcCompliant: true,
				pkceCompatible: true,
				clientTypes: ['public'],
				flowCompatibility: ['oauth-authz', 'implicit', 'hybrid'],
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
				oauthCompliant: true,
				oidcCompliant: true,
				pkceCompatible: true,
				clientTypes: ['confidential'],
				flowCompatibility: [
					'oauth-authz',
					'client-credentials',
					'hybrid',
					'resource-owner',
					'ciba',
					'ropc',
				],
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
				oauthCompliant: true,
				oidcCompliant: true,
				pkceCompatible: true,
				clientTypes: ['confidential'],
				flowCompatibility: ['oauth-authz', 'client-credentials', 'hybrid', 'resource-owner'],
			},
			client_secret_jwt: {
				method: 'client_secret_jwt',
				label: 'Client Secret JWT',
				description: 'JWT assertion signed with client secret',
				requiresClientSecret: true,
				securityLevel: 'high',
				useCases: [
					'High-security requirements',
					'JWT-based authentication architecture',
					'Enterprise integration scenarios',
					'When JWT assertions are preferred',
				],
				pingOneSupported: true,
				oauthCompliant: true,
				oidcCompliant: true,
				pkceCompatible: true,
				clientTypes: ['confidential'],
				flowCompatibility: [
					'oauth-authz',
					'client-credentials',
					'hybrid',
					'resource-owner',
					'ciba',
					'ropc',
				],
			},
			private_key_jwt: {
				method: 'private_key_jwt',
				label: 'Private Key JWT',
				description: 'JWT assertion signed with private key',
				requiresClientSecret: false,
				securityLevel: 'high',
				useCases: [
					'Mutual TLS requirements',
					'Public key infrastructure',
					'Zero-trust architectures',
					'When client secrets are not desirable',
				],
				pingOneSupported: true,
				oauthCompliant: true,
				oidcCompliant: true,
				pkceCompatible: true,
				clientTypes: ['confidential'],
				flowCompatibility: [
					'oauth-authz',
					'client-credentials',
					'hybrid',
					'resource-owner',
					'ciba',
					'ropc',
				],
			},
		};
	}

	/**
	 * Get all authentication methods
	 */
	static getAllAuthMethods(): UnifiedAuthMethod[] {
		return Object.keys(
			UnifiedAuthenticationService.getAllAuthMethodConfigs()
		) as UnifiedAuthMethod[];
	}

	/**
	 * Get authentication method configuration
	 */
	static getAuthMethodConfig(method: UnifiedAuthMethod): UnifiedAuthMethodConfig {
		const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();
		const config = configs[method];

		if (!config) {
			throw new Error(`Unknown authentication method: ${method}`);
		}

		return config;
	}

	/**
	 * Get flow authentication requirements
	 */
	static getFlowAuthRequirements(
		flowType: FlowType,
		specVersion: SpecVersion
	): FlowAuthRequirements {
		const requirements: Record<FlowType, Omit<FlowAuthRequirements, 'specVersion'>> = {
			'oauth-authz': {
				flowType: 'oauth-authz',
				requiresAuthentication: true,
				supportsPKCE: true,
				allowedClientTypes: ['public', 'confidential'],
				defaultMethod: 'client_secret_basic',
				securityMinimum: 'medium',
			},
			implicit: {
				flowType: 'implicit',
				requiresAuthentication: false,
				supportsPKCE: false,
				allowedClientTypes: ['public'],
				defaultMethod: 'none',
				securityMinimum: 'low',
			},
			'client-credentials': {
				flowType: 'client-credentials',
				requiresAuthentication: true,
				supportsPKCE: false,
				allowedClientTypes: ['confidential'],
				defaultMethod: 'client_secret_basic',
				securityMinimum: 'high',
			},
			'device-code': {
				flowType: 'device-code',
				requiresAuthentication: true,
				supportsPKCE: true,
				allowedClientTypes: ['public', 'confidential'],
				defaultMethod: 'client_secret_basic',
				securityMinimum: 'medium',
			},
			hybrid: {
				flowType: 'hybrid',
				requiresAuthentication: true,
				supportsPKCE: true,
				allowedClientTypes: ['public', 'confidential'],
				defaultMethod: 'client_secret_basic',
				securityMinimum: 'medium',
			},
			'resource-owner': {
				flowType: 'resource-owner',
				requiresAuthentication: true,
				supportsPKCE: false,
				allowedClientTypes: ['confidential'],
				defaultMethod: 'client_secret_basic',
				securityMinimum: 'high',
			},
			ciba: {
				flowType: 'ciba',
				requiresAuthentication: true,
				supportsPKCE: false,
				allowedClientTypes: ['confidential'],
				defaultMethod: 'client_secret_basic',
				securityMinimum: 'high',
			},
			ropc: {
				flowType: 'ropc',
				requiresAuthentication: true,
				supportsPKCE: false,
				allowedClientTypes: ['confidential'],
				defaultMethod: 'client_secret_basic',
				securityMinimum: 'high',
			},
		};

		const req = requirements[flowType];
		if (!req) {
			throw new Error(`Unknown flow type: ${flowType}`);
		}

		return { ...req, specVersion };
	}

	/**
	 * Get valid authentication methods for a flow with enhanced validation
	 */
	static getValidAuthMethods(
		flowType: FlowType,
		specVersion: SpecVersion,
		usePKCE: boolean = false,
		clientType: 'public' | 'confidential' = 'confidential'
	): AuthMethodValidation[] {
		console.log(`${MODULE_TAG} Getting valid auth methods`, {
			flowType,
			specVersion,
			usePKCE,
			clientType,
		});

		const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
			flowType,
			specVersion
		);
		const allConfigs = UnifiedAuthenticationService.getAllAuthMethodConfigs();
		const validations: AuthMethodValidation[] = [];

		// Validate each authentication method
		for (const [method, _config] of Object.entries(allConfigs)) {
			const validation = UnifiedAuthenticationService.validateAuthMethodForFlow(
				method as UnifiedAuthMethod,
				requirements,
				usePKCE,
				clientType,
				specVersion
			);
			validations.push(validation);
		}

		// Filter to only valid methods and sort by security score
		return validations.filter((v) => v.isValid).sort((a, b) => b.securityScore - a.securityScore);
	}

	/**
	 * Validate an authentication method for a specific flow
	 */
	static validateAuthMethodForFlow(
		method: UnifiedAuthMethod,
		requirements: FlowAuthRequirements,
		usePKCE: boolean,
		clientType: 'public' | 'confidential',
		specVersion: SpecVersion
	): AuthMethodValidation {
		const config = UnifiedAuthenticationService.getAuthMethodConfig(method);
		const securityScores = { low: 1, medium: 2, high: 3 };

		// Base validation
		let isValid = true;
		let reason: string | undefined;
		let recommendation: AuthMethodValidation['recommendation'] = 'optional';

		// Check flow compatibility
		if (!config.flowCompatibility.includes(requirements.flowType)) {
			isValid = false;
			reason = `Not compatible with ${requirements.flowType} flow`;
		}

		// Check client type compatibility
		if (!config.clientTypes.includes(clientType)) {
			isValid = false;
			reason = reason
				? `${reason}; not compatible with ${clientType} clients`
				: `Not compatible with ${clientType} clients`;
		}

		// Check PKCE requirements
		if (method === 'none' && !usePKCE && requirements.supportsPKCE) {
			isValid = false;
			reason = reason ? `${reason}; 'none' requires PKCE` : `'none' requires PKCE`;
		}

		// Check spec version compatibility
		if (specVersion === 'oauth2.1' && requirements.flowType === 'implicit') {
			isValid = false;
			reason = reason
				? `${reason}; implicit flow deprecated in OAuth 2.1`
				: 'Implicit flow deprecated in OAuth 2.1';
		}

		// Determine recommendation
		if (isValid) {
			if (config.recommended) {
				recommendation = 'recommended';
			} else if (requirements.requiresAuthentication && method === 'none') {
				recommendation = 'optional';
			} else if (config.securityLevel === 'high') {
				recommendation = 'recommended';
			} else if (config.securityLevel === 'low') {
				recommendation = 'not-recommended';
			}

			if (requirements.defaultMethod === method) {
				recommendation = 'required';
			}
		}

		return {
			method,
			isValid,
			reason,
			securityScore: securityScores[config.securityLevel],
			recommendation,
		};
	}

	/**
	 * Get default authentication method for a flow
	 */
	static getDefaultAuthMethod(
		flowType: FlowType,
		specVersion: SpecVersion,
		clientType: 'public' | 'confidential' = 'confidential'
	): UnifiedAuthMethod {
		const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
			flowType,
			specVersion
		);

		// For public clients with PKCE, default to 'none'
		if (clientType === 'public' && requirements.supportsPKCE) {
			return 'none';
		}

		// Use the flow's default method
		return requirements.defaultMethod || 'client_secret_basic';
	}

	/**
	 * Check if authentication method requires client secret
	 */
	static requiresClientSecret(method: UnifiedAuthMethod): boolean {
		return UnifiedAuthenticationService.getAuthMethodConfig(method).requiresClientSecret;
	}

	/**
	 * Get authentication methods by security level
	 */
	static getAuthMethodsBySecurityLevel(level: 'low' | 'medium' | 'high'): UnifiedAuthMethod[] {
		const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();
		return Object.entries(configs)
			.filter(([, config]) => config.securityLevel === level)
			.map(([method]) => method as UnifiedAuthMethod);
	}

	/**
	 * Get authentication methods compatible with PKCE
	 */
	static getPKCECompatibleMethods(): UnifiedAuthMethod[] {
		const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();
		return Object.entries(configs)
			.filter(([, config]) => config.pkceCompatible)
			.map(([method]) => method as UnifiedAuthMethod);
	}

	/**
	 * Get all authentication methods with status (compatible with TokenEndpointAuthMethodServiceV8)
	 */
	static getAllAuthMethodsWithStatus(
		flowType: FlowType,
		specVersion: SpecVersion,
		usePKCE: boolean = false
	): Array<{
		method: UnifiedAuthMethod;
		label: string;
		enabled: boolean;
		disabledReason?: string | undefined;
	}> {
		const validations = UnifiedAuthenticationService.getValidAuthMethods(
			flowType,
			specVersion,
			usePKCE,
			'confidential'
		);
		const allConfigs = UnifiedAuthenticationService.getAllAuthMethodConfigs();

		return Object.entries(allConfigs).map(([method, config]) => {
			const validation = validations.find((v) => v.method === method);
			const enabled = validation?.isValid || false;
			let disabledReason: string | undefined;

			if (!enabled && validation?.reason) {
				disabledReason = validation.reason;
			} else if (!enabled) {
				disabledReason = 'Not compatible with current flow configuration';
			}

			return {
				method: method as UnifiedAuthMethod,
				label: config.label,
				enabled,
				disabledReason,
			};
		});
	}

	/**
	 * Get authentication methods supported by PingOne
	 */
	static getPingOneSupportedMethods(): UnifiedAuthMethod[] {
		const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();
		return Object.entries(configs)
			.filter(([, config]) => config.pingOneSupported)
			.map(([method]) => method as UnifiedAuthMethod);
	}
}

// Export singleton instance
export const unifiedAuthenticationService = UnifiedAuthenticationService;

export default UnifiedAuthenticationService;
