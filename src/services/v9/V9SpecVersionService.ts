/**
 * @file V9SpecVersionService.ts
 * @module services/v9
 * @description Spec version management service for V9 with enhanced features
 * @version 9.0.0
 * @since 2026-02-28
 *
 * Migrated from specVersionServiceV8.ts with V9 enhancements:
 * - Enhanced compliance checking
 * - Better TypeScript types
 * - Support for new OAuth 2.1 features
 * - Improved validation and error reporting
 * - V9 color standards compliance
 */

export type V9SpecVersion = 'oauth2.0' | 'oauth2.1' | 'oidc' | 'oauth2.2';
export type V9FlowType =
	| 'oauth-authz'
	| 'implicit'
	| 'client-credentials'
	| 'ropc'
	| 'device-code'
	| 'hybrid'
	| 'mfa'
	| 'ciba'
	| 'par';

export interface V9ComplianceRules {
	requirePKCE: boolean;
	requireHTTPS: boolean;
	allowImplicit: boolean;
	allowROPC: boolean;
	requireOpenIDScope: boolean;
	supportedFlows: V9FlowType[];
	minTokenLength?: number;
	maxTokenLength?: number;
	requireNonce?: boolean;
	requireState?: boolean;
	supportedResponseTypes?: string[];
	supportedGrantTypes?: string[];
}

export interface V9SpecConfig {
	name: string;
	description: string;
	version: string;
	rfcReference?: string;
	status: 'active' | 'deprecated' | 'draft' | 'experimental';
	supportedFlows: V9FlowType[];
	complianceRules: V9ComplianceRules;
	securityFeatures: string[];
	deprecatedFeatures?: string[];
	newFeatures?: string[];
}

export interface V9ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	recommendations: string[];
	securityLevel: 'low' | 'medium' | 'high' | 'critical';
	complianceScore: number; // 0-100
}

export interface V9FlowCompatibility {
	flow: V9FlowType;
	supported: boolean;
	reason?: string;
	alternatives?: V9FlowType[];
	migrationPath?: string;
}

const V9_SPEC_CONFIGS: Record<V9SpecVersion, V9SpecConfig> = {
	'oauth2.0': {
		name: 'OAuth 2.0 Authorization Framework',
		description:
			'Baseline OAuth framework standard (RFC 6749). Provides authorization without authentication. Supports all flow types including Implicit.',
		version: 'RFC 6749',
		rfcReference: 'https://tools.ietf.org/html/rfc6749',
		status: 'active',
		supportedFlows: ['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'ropc'],
		complianceRules: {
			requirePKCE: false,
			requireHTTPS: false,
			allowImplicit: true,
			allowROPC: true,
			requireOpenIDScope: false,
			supportedFlows: ['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'ropc'],
			minTokenLength: 20,
			maxTokenLength: 4096,
			requireState: true,
			supportedResponseTypes: ['code', 'token'],
			supportedGrantTypes: [
				'authorization_code',
				'implicit',
				'client_credentials',
				'password',
				'refresh_token',
			],
		},
		securityFeatures: ['State parameter', 'Redirect URI validation', 'Client authentication'],
		deprecatedFeatures: ['Implicit flow (security concerns)', 'ROPC (password in native apps)'],
	},
	'oauth2.1': {
		name: 'OAuth 2.1 Authorization Framework',
		description:
			'Consolidated OAuth specification that removes deprecated flows and enforces modern security practices. PKCE required, HTTPS enforced.',
		version: 'draft-ietf-oauth-v2-1-04',
		rfcReference: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/',
		status: 'draft',
		supportedFlows: ['oauth-authz', 'client-credentials', 'device-code'],
		complianceRules: {
			requirePKCE: true,
			requireHTTPS: true,
			allowImplicit: false,
			allowROPC: false,
			requireOpenIDScope: false,
			supportedFlows: ['oauth-authz', 'client-credentials', 'device-code'],
			minTokenLength: 32,
			maxTokenLength: 4096,
			requireState: true,
			requireNonce: false,
			supportedResponseTypes: ['code'],
			supportedGrantTypes: [
				'authorization_code',
				'client_credentials',
				'refresh_token',
				'urn:ietf:params:oauth:grant-type:device_code',
			],
		},
		securityFeatures: ['PKCE required', 'HTTPS enforced', 'No implicit flow', 'No ROPC'],
		newFeatures: ['Enhanced security', 'Simplified flows', 'Better mobile app support'],
	},
	oidc: {
		name: 'OpenID Connect Core 1.0',
		description:
			'Authentication layer on top of OAuth 2.0 that adds identity layer with ID Tokens, openid scope, and UserInfo endpoint.',
		version: 'OpenID Connect Core 1.0',
		rfcReference: 'https://openid.net/specs/openid-connect-core-1_0.html',
		status: 'active',
		supportedFlows: ['oauth-authz', 'implicit', 'hybrid', 'device-code'],
		complianceRules: {
			requirePKCE: false,
			requireHTTPS: false,
			allowImplicit: true,
			allowROPC: false,
			requireOpenIDScope: true,
			supportedFlows: ['oauth-authz', 'implicit', 'hybrid', 'device-code'],
			minTokenLength: 32,
			maxTokenLength: 4096,
			requireNonce: true,
			requireState: true,
			supportedResponseTypes: ['code', 'id_token', 'code id_token', 'id_token token'],
			supportedGrantTypes: ['authorization_code', 'implicit', 'refresh_token'],
		},
		securityFeatures: ['ID Tokens', 'Nonce parameter', 'UserInfo endpoint', 'Discovery'],
		newFeatures: ['Identity layer', 'ID Token validation', 'UserInfo endpoint'],
	},
	'oauth2.2': {
		name: 'OAuth 2.2 Authorization Framework',
		description:
			'Next generation OAuth specification with enhanced security features and modern best practices built-in.',
		version: 'draft-ietf-oauth-v2-2-00',
		rfcReference: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-2/',
		status: 'experimental',
		supportedFlows: ['oauth-authz', 'client-credentials', 'device-code', 'par'],
		complianceRules: {
			requirePKCE: true,
			requireHTTPS: true,
			allowImplicit: false,
			allowROPC: false,
			requireOpenIDScope: false,
			supportedFlows: ['oauth-authz', 'client-credentials', 'device-code', 'par'],
			minTokenLength: 43,
			maxTokenLength: 8192,
			requireState: true,
			requireNonce: false,
			supportedResponseTypes: ['code'],
			supportedGrantTypes: [
				'authorization_code',
				'client_credentials',
				'refresh_token',
				'urn:ietf:params:oauth:grant-type:device_code',
				'urn:ietf:params:oauth:grant-type:par',
			],
		},
		securityFeatures: ['PAR support', 'Enhanced PKCE', 'Longer tokens', 'JWS signed requests'],
		newFeatures: ['Pushed Authorization Requests', 'Enhanced PKCE', 'Better security defaults'],
	},
};

export class V9SpecVersionService {
	/**
	 * Get available flows for a spec version
	 */
	static getAvailableFlows(specVersion: V9SpecVersion): V9FlowType[] {
		const config = V9_SPEC_CONFIGS[specVersion];
		return config ? config.supportedFlows : [];
	}

	/**
	 * Check if a flow is available for a spec version
	 */
	static isFlowAvailable(specVersion: V9SpecVersion, flowType: V9FlowType): boolean {
		const config = V9_SPEC_CONFIGS[specVersion];
		return config ? config.supportedFlows.includes(flowType) : false;
	}

	/**
	 * Get configuration for a spec version
	 */
	static getSpecConfig(specVersion: V9SpecVersion): V9SpecConfig | null {
		return V9_SPEC_CONFIGS[specVersion] || null;
	}

	/**
	 * Get all available spec versions
	 */
	static getAllSpecVersions(): V9SpecVersion[] {
		return Object.keys(V9_SPEC_CONFIGS) as V9SpecVersion[];
	}

	/**
	 * Get compliance rules for a spec version
	 */
	static getComplianceRules(specVersion: V9SpecVersion): V9ComplianceRules | null {
		const config = V9_SPEC_CONFIGS[specVersion];
		return config ? config.complianceRules : null;
	}

	/**
	 * Enhanced validation with detailed results
	 */
	static validateConfiguration(
		specVersion: V9SpecVersion,
		flowType: V9FlowType,
		options: {
			usePKCE?: boolean;
			useHTTPS?: boolean;
			useState?: boolean;
			useNonce?: boolean;
			openidScope?: boolean;
			tokenLength?: number;
		}
	): V9ValidationResult {
		const config = V9_SPEC_CONFIGS[specVersion];
		const rules = config?.complianceRules;

		if (!config || !rules) {
			return {
				valid: false,
				errors: ['Unknown spec version'],
				warnings: [],
				recommendations: ['Use a supported spec version'],
				securityLevel: 'low',
				complianceScore: 0,
			};
		}

		const errors: string[] = [];
		const warnings: string[] = [];
		const recommendations: string[] = [];

		// Check flow availability
		if (!rules.supportedFlows.includes(flowType)) {
			errors.push(`Flow '${flowType}' is not supported in ${specVersion}`);
		}

		// Check PKCE requirement
		if (rules.requirePKCE && !options.usePKCE) {
			errors.push('PKCE is required for this spec version');
		}

		// Check HTTPS requirement
		if (rules.requireHTTPS && !options.useHTTPS) {
			errors.push('HTTPS is required for this spec version');
		}

		// Check implicit flow allowance
		if (!rules.allowImplicit && flowType === 'implicit') {
			errors.push('Implicit flow is not allowed in this spec version');
		}

		// Check ROPC allowance
		if (!rules.allowROPC && flowType === 'ropc') {
			errors.push('ROPC flow is not allowed in this spec version');
		}

		// Check OpenID scope requirement
		if (rules.requireOpenIDScope && !options.openidScope) {
			errors.push('OpenID scope is required for this spec version');
		}

		// Check state parameter
		if (rules.requireState && !options.useState) {
			errors.push('State parameter is required for this spec version');
		}

		// Check nonce requirement
		if (rules.requireNonce && !options.useNonce) {
			errors.push('Nonce parameter is required for this spec version');
		}

		// Check token length
		if (options.tokenLength) {
			if (rules.minTokenLength && options.tokenLength < rules.minTokenLength) {
				warnings.push(
					`Token length is shorter than recommended minimum (${rules.minTokenLength} chars)`
				);
			}
			if (rules.maxTokenLength && options.tokenLength > rules.maxTokenLength) {
				warnings.push(`Token length exceeds recommended maximum (${rules.maxTokenLength} chars)`);
			}
		}

		// Generate recommendations
		if (specVersion === 'oauth2.0' && flowType === 'implicit') {
			recommendations.push('Consider migrating to OAuth 2.1 or OIDC with Authorization Code flow');
		}

		if (specVersion === 'oauth2.0' && !options.usePKCE) {
			recommendations.push('Consider using PKCE for enhanced security');
		}

		// Calculate compliance score
		const totalChecks = 8; // Total number of checks
		const passedChecks = totalChecks - errors.length - warnings.length;
		const complianceScore = Math.max(0, Math.round((passedChecks / totalChecks) * 100));

		// Determine security level
		let securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
		if (complianceScore >= 90) securityLevel = 'critical';
		else if (complianceScore >= 75) securityLevel = 'high';
		else if (complianceScore >= 50) securityLevel = 'medium';

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			recommendations,
			securityLevel,
			complianceScore,
		};
	}

	/**
	 * Get flow compatibility matrix
	 */
	static getFlowCompatibility(flowType: V9FlowType): Record<V9SpecVersion, V9FlowCompatibility> {
		const result = {} as Record<V9SpecVersion, V9FlowCompatibility>;

		for (const specVersion of Object.keys(V9_SPEC_CONFIGS) as V9SpecVersion[]) {
			const config = V9_SPEC_CONFIGS[specVersion];
			const isSupported = config.supportedFlows.includes(flowType);

			const compatibility: V9FlowCompatibility = {
				flow: flowType,
				supported: isSupported,
			};

			if (!isSupported) {
				compatibility.reason = `Flow not supported in ${config.name}`;
				compatibility.alternatives = config.supportedFlows;
			}

			result[specVersion] = compatibility;
		}

		return result;
	}

	/**
	 * Get migration path from one spec version to another
	 */
	static getMigrationPath(
		fromSpec: V9SpecVersion,
		toSpec: V9SpecVersion
	): {
		possible: boolean;
		steps: string[];
		breakingChanges: string[];
		effort: 'low' | 'medium' | 'high';
	} {
		const fromConfig = V9_SPEC_CONFIGS[fromSpec];
		const toConfig = V9_SPEC_CONFIGS[toSpec];

		if (!fromConfig || !toConfig) {
			return {
				possible: false,
				steps: ['Invalid spec version'],
				breakingChanges: [],
				effort: 'high',
			};
		}

		const steps: string[] = [];
		const breakingChanges: string[] = [];

		// Check PKCE requirement
		if (toConfig.complianceRules.requirePKCE && !fromConfig.complianceRules.requirePKCE) {
			steps.push('Implement PKCE (Proof Key for Code Exchange)');
			breakingChanges.push('PKCE becomes mandatory');
		}

		// Check HTTPS requirement
		if (toConfig.complianceRules.requireHTTPS && !fromConfig.complianceRules.requireHTTPS) {
			steps.push('Enforce HTTPS for all endpoints');
			breakingChanges.push('HTTPS becomes mandatory');
		}

		// Check implicit flow removal
		if (!toConfig.complianceRules.allowImplicit && fromConfig.complianceRules.allowImplicit) {
			steps.push('Replace implicit flow with authorization code flow');
			breakingChanges.push('Implicit flow no longer supported');
		}

		// Check ROPC removal
		if (!toConfig.complianceRules.allowROPC && fromConfig.complianceRules.allowROPC) {
			steps.push('Replace ROPC flow with client credentials or device code');
			breakingChanges.push('ROPC flow no longer supported');
		}

		// Determine effort level
		let effort: 'low' | 'medium' | 'high' = 'low';
		if (breakingChanges.length >= 3) effort = 'high';
		else if (breakingChanges.length >= 1) effort = 'medium';

		return {
			possible: true,
			steps,
			breakingChanges,
			effort,
		};
	}

	/**
	 * Get spec version status color for UI
	 */
	static getStatusColor(status: V9SpecConfig['status']): string {
		switch (status) {
			case 'active':
				return '#10b981'; // Green
			case 'deprecated':
				return '#f59e0b'; // Orange
			case 'draft':
				return '#3b82f6'; // Blue
			case 'experimental':
				return '#8b5cf6'; // Purple
			default:
				return '#6b7280'; // Gray
		}
	}

	/**
	 * Get security level color for UI
	 */
	static getSecurityLevelColor(level: V9ValidationResult['securityLevel']): string {
		switch (level) {
			case 'critical':
				return '#dc2626'; // Red
			case 'high':
				return '#f59e0b'; // Orange
			case 'medium':
				return '#3b82f6'; // Blue
			case 'low':
				return '#6b7280'; // Gray
			default:
				return '#6b7280'; // Gray
		}
	}
}

// Export service object for consistency
export const V9SpecVersionServiceObject = {
	getAvailableFlows: V9SpecVersionService.getAvailableFlows,
	isFlowAvailable: V9SpecVersionService.isFlowAvailable,
	getSpecConfig: V9SpecVersionService.getSpecConfig,
	getAllSpecVersions: V9SpecVersionService.getAllSpecVersions,
	getComplianceRules: V9SpecVersionService.getComplianceRules,
	validateConfiguration: V9SpecVersionService.validateConfiguration,
	getFlowCompatibility: V9SpecVersionService.getFlowCompatibility,
	getMigrationPath: V9SpecVersionService.getMigrationPath,
	getStatusColor: V9SpecVersionService.getStatusColor,
	getSecurityLevelColor: V9SpecVersionService.getSecurityLevelColor,
};

export default V9SpecVersionService;
