// src/utils/flowRedirectUriMapping.ts
// Centralized mapping of OAuth/OIDC flows to their redirect URI patterns

/**
 * Returns the app origin (e.g. https://api.pingdemo.com:3000) for building redirect URIs.
 * Uses current page origin so custom domain is used when the app is opened there.
 */
export function getAppOrigin(): string {
	if (typeof window !== 'undefined') return window.location.origin;
	return 'https://localhost:3000';
}

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
 * Centralized mapping of all OAuth/OIDC flows to their redirect URI patterns.
 * Only flows that appear in the sidebar are listed here.
 * Pattern: {origin}/{callbackPath} (origin from getAppOrigin(), e.g. custom domain)
 */
export const FLOW_REDIRECT_URI_MAPPING: FlowRedirectUriConfig[] = [
	// ── V9 OAuth 2.0 Flows ────────────────────────────────────────────────────
	{
		flowType: 'oauth-authorization-code-v9',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Authorization Code (V9)',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'oauth-authorization-code-v9-condensed',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Authorization Code Condensed (V9)',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'oauth2-compliant-authorization-code',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Authorization Code (RFC 6749)',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'implicit-v9',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'Implicit Flow (V9)',
		specification: 'RFC 6749, Section 4.2',
	},
	{
		flowType: 'device-authorization-v9',
		requiresRedirectUri: false,
		callbackPath: 'device-code-status',
		description: 'Device Authorization (V9)',
		specification: 'RFC 8628',
	},
	{
		flowType: 'client-credentials-v9',
		requiresRedirectUri: false,
		callbackPath: 'client-credentials-callback',
		description: 'Client Credentials (V9)',
		specification: 'RFC 6749, Section 4.4',
	},
	{
		flowType: 'dpop-authorization-code-v9',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'DPoP Authorization Code (V9)',
		specification: 'RFC 9449 + RFC 6749, Section 4.1',
	},

	// ── V9 OpenID Connect Flows ───────────────────────────────────────────────
	{
		flowType: 'oidc-implicit-v9',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'OIDC Implicit Flow (V9)',
		specification: 'OIDC Core 1.0, Section 3.2.2',
	},
	{
		flowType: 'oidc-device-authorization-v9',
		requiresRedirectUri: false,
		callbackPath: 'device-code-status',
		description: 'OIDC Device Authorization (V9)',
		specification: 'OIDC Device Flow 1.0',
	},
	{
		flowType: 'oidc-hybrid-v9',
		requiresRedirectUri: true,
		callbackPath: 'hybrid-callback',
		description: 'OIDC Hybrid Flow (V9)',
		specification: 'OIDC Core 1.0, Section 3.3',
	},
	{
		flowType: 'oidc-compliant-authorization-code',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OIDC Authorization Code (OIDC Core 1.0)',
		specification: 'OIDC Core 1.0, Section 3.1.2',
	},
	{
		flowType: 'ciba-v9',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'CIBA Flow (V9)',
		specification: 'OIDC CIBA Core 1.0',
	},

	// ── V9 PingOne Flows ──────────────────────────────────────────────────────
	{
		flowType: 'pingone-par-v9',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Pushed Authorization Request (V9)',
		specification: 'RFC 9126 (PAR)',
	},
	{
		flowType: 'redirectless-v9',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'Redirectless Flow (V9)',
		specification: 'PingOne Redirectless API',
	},
	{
		flowType: 'pingone-mfa-workflow-library-v9',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'PingOne MFA Workflow Library (V9)',
		specification: 'PingOne MFA API',
	},

	// ── V9 Tokens & Session ───────────────────────────────────────────────────
	{
		flowType: 'worker-token-v9',
		requiresRedirectUri: false,
		callbackPath: 'worker-token-callback',
		description: 'Worker Token (V9)',
		specification: 'PingOne Management API',
	},
	{
		flowType: 'token-exchange-v9',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'Token Exchange (V9)',
		specification: 'RFC 8693',
	},

	// ── V9 Mock & Educational Flows ───────────────────────────────────────────
	{
		flowType: 'jwt-bearer-token-v9',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'JWT Bearer Token (V9)',
		specification: 'RFC 7523',
	},
	{
		flowType: 'saml-bearer-assertion-v9',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'SAML Bearer Assertion (V9)',
		specification: 'RFC 7522',
	},
	{
		flowType: 'oauth-ropc-v9',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'Resource Owner Password (V9)',
		specification: 'RFC 6749, Section 4.3',
	},
	{
		flowType: 'mock-oidc-ropc',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'Mock OIDC ROPC',
		specification: 'OIDC Core 1.0 / RFC 6749, Section 4.3',
	},
	{
		flowType: 'dpop-mock',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'DPoP (Educational/Mock)',
		specification: 'RFC 9449',
	},
	{
		flowType: 'rar-v9',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'RAR Flow (V9)',
		specification: 'RFC 9396 (RAR)',
	},
	{
		flowType: 'saml-sp-dynamic-acs-v1',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'SAML Service Provider (V1)',
		specification: 'SAML 2.0',
	},

	// ── V7 Mock Server Flows ──────────────────────────────────────────────────
	{
		flowType: 'v7-oidc-authorization-code',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'Auth Code (V7 Mock)',
		specification: 'OIDC Core 1.0, Section 3.1.2',
	},
	{
		flowType: 'v7-device-authorization',
		requiresRedirectUri: false,
		callbackPath: 'device-code-status',
		description: 'Device Authorization (V7 Mock)',
		specification: 'RFC 8628',
	},
	{
		flowType: 'v7-client-credentials',
		requiresRedirectUri: false,
		callbackPath: 'client-credentials-callback',
		description: 'Client Credentials (V7 Mock)',
		specification: 'RFC 6749, Section 4.4',
	},
	{
		flowType: 'v7-implicit',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'Implicit Flow (V7 Mock)',
		specification: 'RFC 6749, Section 4.2',
	},
	{
		flowType: 'v7-ropc',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'ROPC (V7 Mock)',
		specification: 'RFC 6749, Section 4.3',
	},

	// V8 OAuth 2.0 Flows
	{
		flowType: 'oauth-authz-v8',
		requiresRedirectUri: true,
		callbackPath: 'callback',
		description: 'V8 OAuth 2.0 Authorization Code Flow',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'oidc-authz-v8',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'V8 OpenID Connect Authorization Code Flow',
		specification: 'OIDC Core 1.0, Section 3.1.2',
	},
	{
		flowType: 'implicit-flow-v8',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'V8 OAuth 2.0 Implicit Flow',
		specification: 'RFC 6749, Section 4.2',
	},
	{
		flowType: 'client-credentials-v8',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'V8 OAuth 2.0 Client Credentials Flow',
		specification: 'RFC 6749, Section 4.4',
	},
	{
		flowType: 'device-code-v8',
		requiresRedirectUri: false,
		callbackPath: 'device-code-status',
		description: 'V8 OAuth 2.0 Device Code Flow',
		specification: 'RFC 8628',
	},
	{
		flowType: 'ropc-v8',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'V8 OAuth 2.0 Resource Owner Password Credentials',
		specification: 'RFC 6749, Section 4.3',
	},
	{
		flowType: 'hybrid-v8',
		requiresRedirectUri: true,
		callbackPath: 'callback',
		description: 'V8 OpenID Connect Hybrid Flow',
		specification: 'OIDC Core 1.0, Section 3.3',
	},
	{
		flowType: 'pkce-v8',
		requiresRedirectUri: true,
		callbackPath: 'callback',
		description: 'V8 OAuth 2.0 Authorization Code Flow with PKCE',
		specification: 'RFC 6749, Section 4.1 + RFC 7636',
	},

	// V8U Unified Flows (catalog shows single row for Unified OAuth)
	{
		flowType: 'v8u-unified',
		requiresRedirectUri: true,
		callbackPath: 'unified-callback',
		description: 'Unified OAuth/OIDC (V8U)',
		specification: 'RFC 6749 / OIDC Core 1.0',
	},
	{
		flowType: 'oauth-authz-v8u',
		requiresRedirectUri: true,
		callbackPath: 'unified-callback',
		description: 'V8U Authorization Code Flow',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'implicit-v8u',
		requiresRedirectUri: true,
		callbackPath: 'oauth-implicit-callback',
		description: 'V8U Implicit Flow',
		specification: 'RFC 6749, Section 4.2',
	},
	{
		flowType: 'hybrid-v8u',
		requiresRedirectUri: true,
		callbackPath: 'unified-callback',
		description: 'V8U Hybrid Flow',
		specification: 'OIDC Core 1.0, Section 3.3',
	},
	{
		flowType: 'device-code-v8u',
		requiresRedirectUri: false,
		callbackPath: 'device-code-status',
		description: 'V8U Device Code Flow',
		specification: 'RFC 8628',
	},
	{
		flowType: 'client-credentials-v8u',
		requiresRedirectUri: false,
		callbackPath: 'client-credentials-callback',
		description: 'V8U Client Credentials Flow',
		specification: 'RFC 6749, Section 4.4',
	},
	{
		flowType: 'unified-mfa-v8',
		requiresRedirectUri: true,
		callbackPath: 'v8/unified-mfa-callback',
		description: 'V8 Unified MFA Registration Flow',
		specification: 'PingOne MFA API',
	},
	{
		flowType: 'mfa-hub-v8',
		requiresRedirectUri: true,
		callbackPath: 'mfa-hub-callback',
		description: 'V8 MFA Hub Flow',
		specification: 'PingOne MFA API',
	},
	{
		flowType: 'ropc-v8u',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'V8U Resource Owner Password Credentials',
		specification: 'RFC 6749, Section 4.3',
	},
];

/**
 * Flow types shown in the Configuration redirect/logout URI catalogue.
 * Only PingOne apps need these: Unified MFA and Unified OAuth (V8U).
 */
export const REDIRECT_URI_CATALOG_FLOW_TYPES: string[] = [
	'v8u-unified',
	'implicit-v8u',
	'unified-mfa-v8',
];

/**
 * Get the redirect URI configuration for a specific flow type
 * @param flowType - The flow type identifier
 * @returns The redirect URI configuration or null if not found
 */
export function getFlowRedirectUriConfig(flowType: string): FlowRedirectUriConfig | null {
	return FLOW_REDIRECT_URI_MAPPING.find((config) => config.flowType === flowType) || null;
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

	const base = baseUrl || getAppOrigin().replace(/^http:\/\//, 'https://');
	return `${base}/${config.callbackPath}`;
}

/**
 * Get all flow types that require a redirect URI
 * @returns Array of flow types that require redirect URIs
 */
export function getFlowsRequiringRedirectUri(): string[] {
	return FLOW_REDIRECT_URI_MAPPING.filter((config) => config.requiresRedirectUri).map(
		(config) => config.flowType
	);
}

/**
 * Get all flow types that don't require a redirect URI
 * @returns Array of flow types that don't require redirect URIs
 */
export function getFlowsNotRequiringRedirectUri(): string[] {
	return FLOW_REDIRECT_URI_MAPPING.filter((config) => !config.requiresRedirectUri).map(
		(config) => config.flowType
	);
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
