// src/utils/flowRedirectUriMapping.ts
// Centralized mapping of OAuth/OIDC flows to their redirect URI patterns

export interface FlowRedirectUriConfig {
	/** The flow type identifier */
	flowType: string;
	/** Whether this flow requires a redirect URI */
	requiresRedirectUri: boolean;
	/** The callback path pattern (without domain/port) */
	callbackPath: string;
	/** Description of the flow */
	description: string;
	/** OAuth 2.0 specification reference */
	specification: string;
}

/**
 * Centralized mapping of all OAuth/OIDC flows to their redirect URI patterns
 * Pattern: https://localhost:{port}/{callbackPath}
 */
export const FLOW_REDIRECT_URI_MAPPING: FlowRedirectUriConfig[] = [
	// OAuth 2.0 Authorization Code Flows
	{
		flowType: 'oauth-authorization-code-v6',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OAuth 2.0 Authorization Code Flow with PKCE',
		specification: 'RFC 6749, Section 4.1'
	},
	{
		flowType: 'oauth-authorization-code-v5',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OAuth 2.0 Authorization Code Flow with PKCE (V5)',
		specification: 'RFC 6749, Section 4.1'
	},

	// OpenID Connect Authorization Code Flows
	{
		flowType: 'oidc-authorization-code-v6',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OpenID Connect Authorization Code Flow',
		specification: 'OIDC Core 1.0, Section 3.1.2'
	},
	{
		flowType: 'oidc-authorization-code-v5',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OpenID Connect Authorization Code Flow (V5)',
		specification: 'OIDC Core 1.0, Section 3.1.2'
	},

	// OAuth 2.0 Implicit Flows
	{
		flowType: 'oauth-implicit-v6',
		requiresRedirectUri: true,
		callbackPath: 'oauth-implicit-callback',
		description: 'OAuth 2.0 Implicit Grant Flow',
		specification: 'RFC 6749, Section 4.2'
	},
	{
		flowType: 'oauth-implicit-v5',
		requiresRedirectUri: true,
		callbackPath: 'oauth-implicit-callback',
		description: 'OAuth 2.0 Implicit Grant Flow (V5)',
		specification: 'RFC 6749, Section 4.2'
	},

	// OpenID Connect Implicit Flows
	{
		flowType: 'oidc-implicit-v6',
		requiresRedirectUri: true,
		callbackPath: 'oidc-implicit-callback',
		description: 'OpenID Connect Implicit Flow',
		specification: 'OIDC Core 1.0, Section 3.2.2'
	},
	{
		flowType: 'oidc-implicit-v5',
		requiresRedirectUri: true,
		callbackPath: 'oidc-implicit-callback',
		description: 'OpenID Connect Implicit Flow (V5)',
		specification: 'OIDC Core 1.0, Section 3.2.2'
	},

	// Unified OAuth/OIDC Implicit Flow V7
	{
		flowType: 'implicit-v7',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'Unified OAuth/OIDC Implicit Flow V7',
		specification: 'RFC 6749, Section 4.2 / OIDC Core 1.0, Section 3.2.2'
	},

	// OpenID Connect Hybrid Flows
	{
		flowType: 'oidc-hybrid-v6',
		requiresRedirectUri: true,
		callbackPath: 'hybrid-callback',
		description: 'OpenID Connect Hybrid Flow',
		specification: 'OIDC Core 1.0, Section 3.3'
	},
	{
		flowType: 'oidc-hybrid-v5',
		requiresRedirectUri: true,
		callbackPath: 'hybrid-callback',
		description: 'OpenID Connect Hybrid Flow (V5)',
		specification: 'OIDC Core 1.0, Section 3.3'
	},

	// Device Authorization Flows
	{
		flowType: 'device-authorization-v6',
		requiresRedirectUri: false,
		callbackPath: 'device-callback',
		description: 'OAuth 2.0 Device Authorization Grant',
		specification: 'RFC 8628, Section 3.4'
	},
	{
		flowType: 'oidc-device-authorization-v6',
		requiresRedirectUri: false,
		callbackPath: 'device-callback',
		description: 'OpenID Connect Device Authorization Grant',
		specification: 'OIDC Device Flow 1.0'
	},

	// Client Credentials Flow
	{
		flowType: 'client-credentials-v6',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'OAuth 2.0 Client Credentials Grant',
		specification: 'RFC 6749, Section 4.4'
	},

	// PingOne PAR (Pushed Authorization Requests)
	{
		flowType: 'pingone-par-v6',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'PingOne Pushed Authorization Requests',
		specification: 'RFC 9126 (PAR)'
	},
	{
		flowType: 'pingone-par-v6-new',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'PingOne Pushed Authorization Requests (New)',
		specification: 'RFC 9126 (PAR)'
	},

	// RAR (Rich Authorization Requests)
	{
		flowType: 'rar-v6',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Rich Authorization Requests',
		specification: 'RFC 9396 (RAR)'
	},

	// Mock/Educational Flows
	{
		flowType: 'jwt-bearer-token-v6',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'OAuth 2.0 JWT Bearer Token Flow (Mock)',
		specification: 'RFC 7523'
	},
	{
		flowType: 'saml-bearer-assertion-v6',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'OAuth 2.0 SAML Bearer Assertion Flow (Mock)',
		specification: 'RFC 7522'
	},

	// Legacy/V3 Flows (for backward compatibility)
	{
		flowType: 'authorization-code-v3',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Authorization Code Flow (V3)',
		specification: 'RFC 6749, Section 4.1'
	},
	{
		flowType: 'implicit-v3',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'Implicit Flow (V3)',
		specification: 'RFC 6749, Section 4.2'
	},
	{
		flowType: 'hybrid-v3',
		requiresRedirectUri: true,
		callbackPath: 'hybrid-callback',
		description: 'Hybrid Flow (V3)',
		specification: 'OIDC Core 1.0, Section 3.3'
	},

	// Generic fallbacks
	{
		flowType: 'authorization-code',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Generic Authorization Code Flow',
		specification: 'RFC 6749, Section 4.1'
	},
	{
		flowType: 'implicit',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'Generic Implicit Flow',
		specification: 'RFC 6749, Section 4.2'
	},
	{
		flowType: 'hybrid',
		requiresRedirectUri: true,
		callbackPath: 'hybrid-callback',
		description: 'Generic Hybrid Flow',
		specification: 'OIDC Core 1.0, Section 3.3'
	}
];

/**
 * Get the redirect URI configuration for a specific flow type
 * @param flowType - The flow type identifier
 * @returns The redirect URI configuration or null if not found
 */
export function getFlowRedirectUriConfig(flowType: string): FlowRedirectUriConfig | null {
	return FLOW_REDIRECT_URI_MAPPING.find(config => config.flowType === flowType) || null;
}

/**
 * Generate the complete redirect URI for a flow type
 * @param flowType - The flow type identifier
 * @param baseUrl - Optional base URL (defaults to window.location.origin)
 * @returns The complete redirect URI or null if flow doesn't require one
 */
export function generateRedirectUriForFlow(flowType: string, baseUrl?: string): string | null {
	const config = getFlowRedirectUriConfig(flowType);
	
	if (!config || !config.requiresRedirectUri) {
		return null;
	}

	const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000');
	return `${base}/${config.callbackPath}`;
}

/**
 * Get all flow types that require a redirect URI
 * @returns Array of flow types that require redirect URIs
 */
export function getFlowsRequiringRedirectUri(): string[] {
	return FLOW_REDIRECT_URI_MAPPING
		.filter(config => config.requiresRedirectUri)
		.map(config => config.flowType);
}

/**
 * Get all flow types that don't require a redirect URI
 * @returns Array of flow types that don't require redirect URIs
 */
export function getFlowsNotRequiringRedirectUri(): string[] {
	return FLOW_REDIRECT_URI_MAPPING
		.filter(config => !config.requiresRedirectUri)
		.map(config => config.flowType);
}

/**
 * Check if a flow type requires a redirect URI
 * @param flowType - The flow type identifier
 * @returns true if the flow requires a redirect URI, false otherwise
 */
export function flowRequiresRedirectUri(flowType: string): boolean {
	const config = getFlowRedirectUriConfig(flowType);
	return config ? config.requiresRedirectUri : false;
}

/**
 * Get the callback path for a flow type
 * @param flowType - The flow type identifier
 * @returns The callback path or null if not found
 */
export function getCallbackPathForFlow(flowType: string): string | null {
	const config = getFlowRedirectUriConfig(flowType);
	return config ? config.callbackPath : null;
}

/**
 * Get all redirect URI configurations for debugging/logging
 * @returns Array of all flow redirect URI configurations
 */
export function getAllFlowRedirectUriConfigs(): FlowRedirectUriConfig[] {
	return [...FLOW_REDIRECT_URI_MAPPING];
}
