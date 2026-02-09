/**
 * @file redirectUriServiceV8.ts
 * @module v8/services
 * @description Service for generating flow-specific redirect URIs (V8 - Enhanced from V7)
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Based on V7's comprehensive flowRedirectUriMapping with V8 enhancements
 */

const MODULE_TAG = '[🔗 REDIRECT-URI-V8]';

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
 * Comprehensive mapping of all OAuth/OIDC flows to their redirect URI patterns
 * Migrated from V7 flowRedirectUriMapping.ts and enhanced for V8
 */
export const FLOW_REDIRECT_URI_MAPPING_V8: FlowRedirectUriConfig[] = [
	// V8 OAuth 2.0 Flows
	{
		flowType: 'oauth-authz-v8',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OAuth 2.0 Authorization Code Flow V8',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'implicit-v8',
		requiresRedirectUri: true,
		callbackPath: 'implicit-callback',
		description: 'OAuth 2.0 Implicit Flow V8',
		specification: 'RFC 6749, Section 4.2',
	},
	{
		flowType: 'pkce-v8',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OAuth 2.0 Authorization Code with PKCE V8',
		specification: 'RFC 7636',
	},
	{
		flowType: 'client-credentials-v8',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'OAuth 2.0 Client Credentials V8',
		specification: 'RFC 6749, Section 4.4',
	},
	{
		flowType: 'device-code-v8',
		requiresRedirectUri: false,
		callbackPath: 'device-callback',
		description: 'OAuth 2.0 Device Authorization V8',
		specification: 'RFC 8628',
	},
	{
		flowType: 'ropc-v8',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'Resource Owner Password Credentials V8',
		specification: 'RFC 6749, Section 4.3',
	},

	// V8 OIDC Flows
	{
		flowType: 'oidc-authz-v8',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		description: 'OpenID Connect Authorization Code Flow V8',
		specification: 'OIDC Core 1.0, Section 3.1.2',
	},
	{
		flowType: 'oidc-implicit-v8',
		requiresRedirectUri: true,
		callbackPath: 'oidc-implicit-callback',
		description: 'OpenID Connect Implicit Flow V8',
		specification: 'OIDC Core 1.0, Section 3.2.2',
	},
	{
		flowType: 'oidc-hybrid-v8',
		requiresRedirectUri: true,
		callbackPath: 'hybrid-callback',
		description: 'OpenID Connect Hybrid Flow V8',
		specification: 'OIDC Core 1.0, Section 3.3',
	},

	// V8U Unified Flows (same mappings as V8 but with -v8u suffix)
	{
		flowType: 'oauth-authz-v8u',
		requiresRedirectUri: true,
		callbackPath: 'unified-callback',
		description: 'OAuth 2.0 Authorization Code Flow V8U (Unified)',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'implicit-v8u',
		requiresRedirectUri: true,
		callbackPath: 'unified-callback',
		description: 'OAuth 2.0 Implicit Flow V8U (Unified)',
		specification: 'RFC 6749, Section 4.2',
	},
	{
		flowType: 'client-credentials-v8u',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'OAuth 2.0 Client Credentials V8U (Unified)',
		specification: 'RFC 6749, Section 4.4',
	},
	{
		flowType: 'device-code-v8u',
		requiresRedirectUri: false,
		callbackPath: 'device-callback',
		description: 'OAuth 2.0 Device Authorization V8U (Unified)',
		specification: 'RFC 8628',
	},
	{
		flowType: 'ropc-v8u',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		description: 'Resource Owner Password Credentials V8U (Unified)',
		specification: 'RFC 6749, Section 4.3',
	},
	{
		flowType: 'hybrid-v8u',
		requiresRedirectUri: true,
		callbackPath: 'unified-callback',
		description: 'OpenID Connect Hybrid Flow V8U (Unified)',
		specification: 'OIDC Core 1.0, Section 3.3',
	},

	// V8 MFA Flows
	{
		flowType: 'unified-mfa-v8',
		requiresRedirectUri: true,
		callbackPath: 'mfa-unified-callback',
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
];

/**
 * Get the base URL for the application
 */
export const getBaseUrl = (): string => {
	if (typeof window !== 'undefined') {
		return `${window.location.protocol}//${window.location.host}`;
	}
	return 'http://localhost:3000';
};

/**
 * Get flow configuration by flow key
 */
export const getFlowConfig = (flowKey: string): FlowRedirectUriConfig | null => {
	return FLOW_REDIRECT_URI_MAPPING_V8.find((config) => config.flowType === flowKey) || null;
};

/**
 * Get flow-specific redirect URI
 */
export const getRedirectUriForFlow = (flowKey: string): string => {
	const baseUrl = getBaseUrl();
	const config = getFlowConfig(flowKey);

	if (!config || !config.requiresRedirectUri) {
		console.log(`${MODULE_TAG} No redirect URI for flow`, { flowKey });
		return '';
	}

	const redirectUri = `${baseUrl}/${config.callbackPath}`;
	console.log(`${MODULE_TAG} Generated redirect URI`, {
		flowKey,
		redirectUri,
		spec: config.specification,
	});
	return redirectUri;
};

/**
 * Get flow-specific post-logout redirect URI
 */
export const getPostLogoutRedirectUriForFlow = (flowKey: string): string => {
	const baseUrl = getBaseUrl();

	// Map flow keys to their logout callback paths
	const flowLogoutPaths: Record<string, string> = {
		// OIDC flows (only OIDC supports post-logout redirect)
		'oidc-authz-v8': '/callback/logout',
		'oidc-implicit-v8': '/callback/logout',
		'oidc-hybrid-v8': '/callback/logout',

		// OAuth flows don't typically have post-logout redirect
		'oauth-authz-v8': '/callback/logout',
		'implicit-v8': '/callback/logout',
		'pkce-v8': '/callback/logout',

		// V8U Unified flows
		'oauth-authz-v8u': '/callback/logout',
		'implicit-v8u': '/callback/logout',
		'hybrid-v8u': '/callback/logout',
	};

	const path = flowLogoutPaths[flowKey] || '/callback/logout';

	if (!path) {
		console.log(`${MODULE_TAG} No post-logout redirect URI for flow`, { flowKey });
		return '';
	}

	const logoutUri = `${baseUrl}${path}`;
	console.log(`${MODULE_TAG} Generated post-logout redirect URI`, { flowKey, logoutUri });
	return logoutUri;
};

/**
 * Get placeholder text for redirect URI based on flow
 */
export const getRedirectUriPlaceholder = (flowKey: string): string => {
	const uri = getRedirectUriForFlow(flowKey);
	return uri || 'https://localhost:3000/callback';
};

/**
 * Get placeholder text for post-logout redirect URI based on flow
 */
export const getPostLogoutRedirectUriPlaceholder = (flowKey: string): string => {
	const uri = getPostLogoutRedirectUriForFlow(flowKey);
	return uri || 'https://localhost:3000/callback/logout';
};

/**
 * Initialize redirect URIs for a flow if not already set
 */
export const initializeRedirectUris = (
	flowKey: string,
	currentRedirectUri?: string,
	currentPostLogoutUri?: string
): { redirectUri: string; postLogoutRedirectUri: string } => {
	const redirectUri = currentRedirectUri || getRedirectUriForFlow(flowKey);
	const postLogoutRedirectUri = currentPostLogoutUri || getPostLogoutRedirectUriForFlow(flowKey);

	console.log(`${MODULE_TAG} Initialized redirect URIs`, {
		flowKey,
		redirectUri,
		postLogoutRedirectUri,
	});

	return { redirectUri, postLogoutRedirectUri };
};

export const RedirectUriServiceV8 = {
	getBaseUrl,
	getRedirectUriForFlow,
	getPostLogoutRedirectUriForFlow,
	getRedirectUriPlaceholder,
	getPostLogoutRedirectUriPlaceholder,
	initializeRedirectUris,
};

export default RedirectUriServiceV8;
