// src/services/authzFlowsService.ts
/**
 * AuthZ Flows Service
 *
 * Centralized service to manage all Authorization Code flow variants.
 * These flows share common patterns but have specific features:
 * - OAuth Authorization Code: Basic authorization
 * - OIDC Authorization Code: Authorization + authentication
 * - PAR: Authorization Code + Pushed Authorization Requests
 * - RAR: Authorization Code + Rich Authorization Requests
 * - Redirectless: Authorization Code + response_mode=pi.flow
 */

export interface AuthZFlowInfo {
	flowKey: string;
	name: string;
	version: string;
	variant: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless';
	route: string;
	description: string;
	features: string[];
	standards: string[];
	educationalContent: boolean;
	serviceIntegration: boolean;
}

export const AUTHZ_FLOWS: AuthZFlowInfo[] = [
	{
		flowKey: 'oauth-authorization-code-v5',
		name: 'OAuth Authorization Code',
		version: 'V6',
		variant: 'oauth',
		route: '/flows/oauth-authorization-code-v5',
		description: 'OAuth 2.0 Authorization Code Flow - Delegated Authorization',
		features: ['Basic authorization', 'Access token only', 'PKCE support'],
		standards: ['RFC 6749 (OAuth 2.0)'],
		educationalContent: true,
		serviceIntegration: true,
	},
	{
		flowKey: 'oidc-authorization-code-v5',
		name: 'OIDC Authorization Code',
		version: 'V6',
		variant: 'oidc',
		route: '/flows/oidc-authorization-code-v5',
		description: 'OIDC Authorization Code Flow - Federated Authentication',
		features: ['Authorization + authentication', 'ID token + access token', 'UserInfo endpoint'],
		standards: ['RFC 6749 (OAuth 2.0)', 'OpenID Connect Core 1.0'],
		educationalContent: true,
		serviceIntegration: true,
	},
	{
		flowKey: 'pingone-par-v6',
		name: 'PAR (Pushed Authorization Requests)',
		version: 'V6',
		variant: 'par',
		route: '/flows/pingone-par-v6',
		description: 'Authorization Code Flow + PAR enhancement for enhanced security',
		features: ['Back-channel parameter pushing', 'Enhanced security', 'Compact URLs'],
		standards: ['RFC 6749 (OAuth 2.0)', 'RFC 9126 (PAR)'],
		educationalContent: true,
		serviceIntegration: true,
	},
	{
		flowKey: 'rar-v6',
		name: 'RAR (Rich Authorization Requests)',
		version: 'V6',
		variant: 'rar',
		route: '/flows/rar-v6',
		description: 'Authorization Code Flow + RAR for fine-grained permissions',
		features: ['Structured JSON permissions', 'Fine-grained authorization', 'Clear consent'],
		standards: ['RFC 6749 (OAuth 2.0)', 'RFC 9396 (RAR)'],
		educationalContent: true,
		serviceIntegration: true,
	},
	{
		flowKey: 'redirectless-v6-real',
		name: 'Redirectless Flow (response_mode=pi.flow)',
		version: 'V6',
		variant: 'redirectless',
		route: '/flows/redirectless-v6-real',
		description: 'Authorization Code Flow with PingOne redirectless authentication',
		features: ['API-driven authentication', 'No browser redirects', 'Embedded UX'],
		standards: ['RFC 6749 (OAuth 2.0)', 'PingOne proprietary'],
		educationalContent: true,
		serviceIntegration: true,
	},
];

export const AuthZFlowsService = {
	/**
	 * Get all AuthZ flows
	 */
	getAllFlows(): AuthZFlowInfo[] {
		return AUTHZ_FLOWS;
	},

	/**
	 * Get flows by variant
	 */
	getFlowsByVariant(variant: AuthZFlowInfo['variant']): AuthZFlowInfo[] {
		return AUTHZ_FLOWS.filter((flow) => flow.variant === variant);
	},

	/**
	 * Get flow by key
	 */
	getFlowByKey(flowKey: string): AuthZFlowInfo | undefined {
		return AUTHZ_FLOWS.find((flow) => flow.flowKey === flowKey);
	},

	/**
	 * Get flows with specific feature
	 */
	getFlowsWithFeature(feature: string): AuthZFlowInfo[] {
		return AUTHZ_FLOWS.filter((flow) =>
			flow.features.some((f) => f.toLowerCase().includes(feature.toLowerCase()))
		);
	},

	/**
	 * Get flows by standard
	 */
	getFlowsByStandard(standard: string): AuthZFlowInfo[] {
		return AUTHZ_FLOWS.filter((flow) =>
			flow.standards.some((s) => s.toLowerCase().includes(standard.toLowerCase()))
		);
	},

	/**
	 * Get V6 flows only
	 */
	getV6Flows(): AuthZFlowInfo[] {
		return AUTHZ_FLOWS.filter((flow) => flow.version === 'V6');
	},

	/**
	 * Get flows with educational content
	 */
	getEducationalFlows(): AuthZFlowInfo[] {
		return AUTHZ_FLOWS.filter((flow) => flow.educationalContent);
	},

	/**
	 * Get flows with service integration
	 */
	getServiceIntegratedFlows(): AuthZFlowInfo[] {
		return AUTHZ_FLOWS.filter((flow) => flow.serviceIntegration);
	},

	/**
	 * Get flow summary statistics
	 */
	getStats() {
		return {
			total: AUTHZ_FLOWS.length,
			v6Flows: this.getV6Flows().length,
			educationalFlows: this.getEducationalFlows().length,
			serviceIntegratedFlows: this.getServiceIntegratedFlows().length,
			variants: [...new Set(AUTHZ_FLOWS.map((f) => f.variant))],
			standards: [...new Set(AUTHZ_FLOWS.flatMap((f) => f.standards))],
		};
	},
};

// Export individual flow keys for easy reference
export const AUTHZ_FLOW_KEYS = {
	OAUTH_AUTHZ_CODE: 'oauth-authorization-code-v5',
	OIDC_AUTHZ_CODE: 'oidc-authorization-code-v5',
	PAR: 'pingone-par-v6',
	RAR: 'rar-v6',
	REDIRECTLESS: 'redirectless-v6-real',
} as const;

// Export flow variants for type safety
export type AuthZFlowVariant = AuthZFlowInfo['variant'];
export type AuthZFlowKey = (typeof AUTHZ_FLOW_KEYS)[keyof typeof AUTHZ_FLOW_KEYS];
