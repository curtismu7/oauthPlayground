// src/utils/oidcCompliance.ts - OIDC Core 1.0 Compliance Utilities

/**
 * OIDC Core 1.0 Compliance Checker
 * Implements all requirements from OpenID Connect Core 1.0 specification
 */

export interface OIDCComplianceResult {
	isCompliant: boolean;
	violations: string[];
	warnings: string[];
	details: Record<string, unknown>;
}

export interface OIDCFlowConfig {
	responseType: string;
	scopes: string[];
	clientAuthMethod: string;
	enablePKCE: boolean;
	nonce?: string;
	maxAge?: number;
}

/**
 * Validate OIDC flow configuration for compliance
 * @param config - Flow configuration to validate
 * @returns Compliance validation result
 */
export const validateOIDCCompliance = (config: OIDCFlowConfig): OIDCComplianceResult => {
	const violations: string[] = [];
	const warnings: string[] = [];
	const details: Record<string, unknown> = {};

	// 1. OIDC Core 1.0 Section 3.1.2.1: openid scope REQUIRED
	if (!config.scopes.includes('openid')) {
		violations.push('Missing required "openid" scope for OIDC compliance');
	}

	// 2. OIDC Core 1.0 Section 3.1.2.1: response_type validation
	const validResponseTypes = [
		'code',
		'id_token',
		'id_token token',
		'code id_token',
		'code token',
		'code id_token token',
	];
	if (!validResponseTypes.includes(config.responseType)) {
		violations.push(`Invalid response_type "${config.responseType}" for OIDC flow`);
	}

	// 3. OIDC Core 1.0 Section 15.5.2: nonce RECOMMENDED for implicit flows
	if (config.responseType.includes('id_token') && !config.nonce) {
		warnings.push('Nonce is recommended for implicit flows containing id_token');
	}

	// 4. OIDC Core 1.0 Section 7: PKCE REQUIRED for public clients
	if (config.clientAuthMethod === 'none' && !config.enablePKCE) {
		violations.push('PKCE is required when using client authentication method "none"');
	}

	// 5. OIDC Core 1.0 Section 9: Client authentication validation
	const validAuthMethods = [
		'client_secret_post',
		'client_secret_basic',
		'client_secret_jwt',
		'private_key_jwt',
		'none',
	];
	if (!validAuthMethods.includes(config.clientAuthMethod)) {
		violations.push(`Invalid client authentication method "${config.clientAuthMethod}"`);
	}

	// 6. Security recommendations
	if (config.clientAuthMethod === 'client_secret_post') {
		warnings.push('Consider using client_secret_basic or client_secret_jwt for better security');
	}

	if (!config.nonce) {
		warnings.push('Nonce is recommended for all OIDC flows to prevent replay attacks');
	}

	details.scopeCount = config.scopes.length;
	details.hasOpenIdScope = config.scopes.includes('openid');
	details.responseTypeValid = validResponseTypes.includes(config.responseType);
	details.authMethodValid = validAuthMethods.includes(config.clientAuthMethod);
	details.pkceEnabled = config.enablePKCE;
	details.nonceProvided = !!config.nonce;
	details.maxAgeProvided = !!config.maxAge;

	return {
		isCompliant: violations.length === 0,
		violations,
		warnings,
		details,
	};
};

/**
 * Generate OIDC compliance report for display
 * @param result - Compliance validation result
 * @returns Formatted compliance report
 */
export const generateComplianceReport = (result: OIDCComplianceResult): string => {
	const sections = [];

	if (result.isCompliant) {
		sections.push(' OIDC Core 1.0 Compliant');
	} else {
		sections.push(' OIDC Core 1.0 Violations Detected');
	}

	if (result.violations.length > 0) {
		sections.push('\n Compliance Violations:');
		result.violations.forEach((violation) => {
			sections.push(`    ${violation}`);
		});
	}

	if (result.warnings.length > 0) {
		sections.push('\n Security Recommendations:');
		result.warnings.forEach((warning) => {
			sections.push(`    ${warning}`);
		});
	}

	sections.push('\n Compliance Details:');
	Object.entries(result.details).forEach(([key, value]) => {
		const icon = value === true ? '' : value === false ? '' : '';
		sections.push(`   ${icon} ${key}: ${value}`);
	});

	return sections.join('\n');
};

/**
 * Enhanced ID token validation with full OIDC Core 1.0 requirements
 * @param idTokenPayload - Decoded ID token payload
 * @param config - OIDC configuration used for the flow
 * @returns Detailed compliance validation
 */
export const validateIdTokenCompliance = (
	idTokenPayload: Record<string, unknown>,
	config: OIDCFlowConfig
): OIDCComplianceResult => {
	const violations: string[] = [];
	const warnings: string[] = [];
	const details: Record<string, unknown> = {};

	// Required claims validation
	const requiredClaims = ['iss', 'sub', 'aud', 'exp', 'iat'];
	for (const claim of requiredClaims) {
		if (!(claim in idTokenPayload)) {
			violations.push(`Missing required claim: ${claim}`);
		}
		details[`has_${claim}`] = claim in idTokenPayload;
	}

	// Conditional claims validation
	if (config.nonce && !idTokenPayload.nonce) {
		violations.push('Missing nonce claim when nonce was provided in request');
	}

	if (config.maxAge && !idTokenPayload.auth_time) {
		violations.push('Missing auth_time claim when max_age was specified');
	}

	// Additional OIDC claims
	const oidcClaims = ['nonce', 'auth_time', 'acr', 'amr', 'azp', 'at_hash', 'c_hash'];
	for (const claim of oidcClaims) {
		details[`has_${claim}`] = claim in idTokenPayload;
	}

	return {
		isCompliant: violations.length === 0,
		violations,
		warnings,
		details,
	};
};

export default {
	validateOIDCCompliance,
	generateComplianceReport,
	validateIdTokenCompliance,
};
