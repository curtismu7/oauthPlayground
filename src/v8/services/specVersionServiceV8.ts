/**
 * @file specVersionServiceV8.ts
 * @module v8/services
 * @description Spec version management service for OAuth 2.0, OAuth 2.1, and OpenID Connect
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Manage available flows per spec version
 * - Enforce compliance rules
 * - Validate configurations
 * - Provide spec descriptions
 *
 * @example
 * const flows = SpecVersionServiceV8.getAvailableFlows('oauth2.1');
 * const isValid = SpecVersionServiceV8.isFlowAvailable('oauth2.1', 'implicit');
 */

const MODULE_TAG = '[📋 SPEC-VERSION-V8]';

export type SpecVersion = 'oauth2.0' | 'oauth2.1' | 'oidc';
export type FlowType =
	| 'oauth-authz'
	| 'implicit'
	| 'client-credentials'
	| 'ropc'
	| 'device-code'
	| 'hybrid';

export interface ComplianceRules {
	requirePKCE: boolean;
	requireHTTPS: boolean;
	allowImplicit: boolean;
	allowROPC: boolean;
	requireOpenIDScope: boolean;
	supportedFlows: FlowType[];
}

export interface SpecConfig {
	name: string;
	description: string;
	supportedFlows: FlowType[];
	complianceRules: ComplianceRules;
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

const SPEC_CONFIGS: Record<SpecVersion, SpecConfig> = {
	'oauth2.0': {
		name: 'OAuth 2.0',
		description: 'Standard OAuth 2.0 (RFC 6749)',
		supportedFlows: ['oauth-authz', 'implicit', 'client-credentials', 'device-code'],
		complianceRules: {
			requirePKCE: false,
			requireHTTPS: false,
			allowImplicit: true,
			allowROPC: false, // ROPC is not supported by PingOne - use mock flows instead
			requireOpenIDScope: false,
			supportedFlows: ['oauth-authz', 'implicit', 'client-credentials', 'device-code'],
		},
	},
	'oauth2.1': {
		name: 'OAuth 2.1',
		description: 'Modern OAuth 2.0 (RFC 6749 + Security Best Current Practices)',
		supportedFlows: ['oauth-authz', 'client-credentials', 'device-code'],
		complianceRules: {
			requirePKCE: true,
			requireHTTPS: true,
			allowImplicit: false,
			allowROPC: false,
			requireOpenIDScope: false,
			supportedFlows: ['oauth-authz', 'client-credentials', 'device-code'],
		},
	},
	oidc: {
		name: 'OpenID Connect',
		description: 'Authentication layer on OAuth 2.0 (OpenID Connect Core)',
		supportedFlows: ['oauth-authz', 'implicit', 'hybrid', 'device-code'],
		complianceRules: {
			requirePKCE: false,
			requireHTTPS: false,
			allowImplicit: true,
			allowROPC: false,
			requireOpenIDScope: true,
			supportedFlows: ['oauth-authz', 'implicit', 'hybrid', 'device-code'],
		},
	},
};

export class SpecVersionServiceV8 {
	/**
	 * Get available flows for a spec version
	 * @param specVersion - Spec version (oauth2.0, oauth2.1, oidc)
	 * @returns Array of available flow types
	 */
	static getAvailableFlows(specVersion: SpecVersion): FlowType[] {
		console.log(`${MODULE_TAG} Getting available flows for`, { specVersion });
		return SPEC_CONFIGS[specVersion].supportedFlows;
	}

	/**
	 * Check if a flow is available for a spec version
	 * @param specVersion - Spec version
	 * @param flowType - Flow type to check
	 * @returns True if flow is available
	 */
	static isFlowAvailable(specVersion: SpecVersion, flowType: FlowType): boolean {
		const available = SpecVersionServiceV8.getAvailableFlows(specVersion).includes(flowType);
		console.log(`${MODULE_TAG} Flow availability check`, { specVersion, flowType, available });
		return available;
	}

	/**
	 * Get compliance rules for a spec version
	 * @param specVersion - Spec version
	 * @returns Compliance rules
	 */
	static getComplianceRules(specVersion: SpecVersion): ComplianceRules {
		return SPEC_CONFIGS[specVersion].complianceRules;
	}

	/**
	 * Get spec configuration
	 * @param specVersion - Spec version
	 * @returns Spec configuration
	 */
	static getSpecConfig(specVersion: SpecVersion): SpecConfig {
		return SPEC_CONFIGS[specVersion];
	}

	/**
	 * Get spec description
	 * @param specVersion - Spec version
	 * @returns Human-readable description
	 */
	static getSpecDescription(specVersion: SpecVersion): string {
		return SPEC_CONFIGS[specVersion].description;
	}

	/**
	 * Validate configuration against spec version and flow type
	 * @param specVersion - Spec version
	 * @param flowType - Flow type
	 * @param config - Configuration to validate
	 * @returns Validation result with errors and warnings
	 */
	static validateConfiguration(
		specVersion: SpecVersion,
		flowType: FlowType,
		config: any
	): ValidationResult {
		console.log(`${MODULE_TAG} Validating configuration`, { specVersion, flowType });

		const errors: string[] = [];
		const warnings: string[] = [];

		// Check flow is available
		if (!SpecVersionServiceV8.isFlowAvailable(specVersion, flowType)) {
			errors.push(`${flowType} is not available in ${specVersion}`);
		}

		// Get compliance rules
		const rules = SpecVersionServiceV8.getComplianceRules(specVersion);

		// Check PKCE requirement
		if (rules.requirePKCE && flowType === 'oauth-authz' && !config.usePKCE) {
			errors.push(`${specVersion} requires PKCE for Authorization Code Flow`);
		}

		// Check HTTPS requirement
		if (rules.requireHTTPS) {
			if (config.redirectUri && !config.redirectUri.startsWith('https://')) {
				if (!config.redirectUri.startsWith('http://localhost')) {
					errors.push(`${specVersion} requires HTTPS for all URIs (except localhost)`);
				}
			}
			if (config.postLogoutRedirectUri && !config.postLogoutRedirectUri.startsWith('https://')) {
				if (!config.postLogoutRedirectUri.startsWith('http://localhost')) {
					errors.push(`${specVersion} requires HTTPS for post-logout redirect URI`);
				}
			}
		}

		// Check OpenID scope requirement
		if (rules.requireOpenIDScope && !config.scopes?.includes('openid')) {
			errors.push(`${specVersion} requires "openid" scope`);
		}

		// Warnings for deprecated flows
		if (specVersion === 'oauth2.1' && flowType === 'implicit') {
			warnings.push('Implicit Flow is deprecated in OAuth 2.1');
		}
		if (specVersion === 'oauth2.1' && flowType === 'ropc') {
			warnings.push('Resource Owner Password Credentials is deprecated in OAuth 2.1');
		}

		const valid = errors.length === 0;
		console.log(`${MODULE_TAG} Validation complete`, {
			valid,
			errorCount: errors.length,
			warningCount: warnings.length,
		});

		return { valid, errors, warnings };
	}

	/**
	 * Get all available spec versions
	 * @returns Array of spec versions
	 */
	static getAllSpecVersions(): SpecVersion[] {
		return ['oauth2.0', 'oauth2.1', 'oidc'];
	}

	/**
	 * Get spec version label
	 * @param specVersion - Spec version
	 * @returns Display label
	 */
	static getSpecLabel(specVersion: SpecVersion): string {
		const labels: Record<SpecVersion, string> = {
			'oauth2.0': 'OAuth 2.0',
			'oauth2.1': 'OAuth 2.1',
			oidc: 'OpenID Connect',
		};
		return labels[specVersion];
	}

	/**
	 * Get flow label
	 * @param flowType - Flow type
	 * @returns Display label
	 */
	static getFlowLabel(flowType: FlowType): string {
		const labels: Record<FlowType, string> = {
			'oauth-authz': 'Authorization Code Flow',
			implicit: 'Implicit Flow',
			'client-credentials': 'Client Credentials Flow',
			ropc: 'Resource Owner Password Credentials',
			'device-code': 'Device code grant type',
			hybrid: 'Hybrid Flow',
		};
		return labels[flowType];
	}
}

export default SpecVersionServiceV8;
