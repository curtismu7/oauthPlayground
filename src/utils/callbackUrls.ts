/**
 * Utility functions for generating per-flow callback URLs
 */

export interface CallbackUrls {
	authz: string;
	hybrid: string;
	implicit: string;
	worker: string;
	deviceCodeStatus: string;
	assertion?: string; // For JWT Bearer if applicable
	dashboard: string; // For dashboard login
}

/**
 * Generate callback URLs for all OAuth flows
 * @param baseUrl - The base URL of the application (e.g., https://localhost:3000)
 * @returns Object containing all callback URLs
 */
export function generateCallbackUrls(baseUrl?: string): CallbackUrls {
	const base = baseUrl || window.location.origin;

	return {
		authz: `${base}/authz-callback`,
		hybrid: `${base}/hybrid-callback`,
		implicit: `${base}/implicit-callback`,
		worker: `${base}/worker-token-callback`,
		deviceCodeStatus: `${base}/device-code-status`,
		assertion: `${base}/assertion-callback`, // For JWT Bearer if applicable
		dashboard: `${base}/dashboard-callback`, // For dashboard login
	};
}

/**
 * Get the appropriate callback URL for a specific flow
 * @param flowType - The type of OAuth flow
 * @param baseUrl - The base URL of the application
 * @returns The callback URL for the specified flow
 */
export function getCallbackUrlForFlow(flowType: string, baseUrl?: string): string {
	const urls = generateCallbackUrls(baseUrl);
	const base = baseUrl || window.location.origin;

	switch (flowType.toLowerCase()) {
		case 'authorization-code':
		case 'authz':
		case 'pkce':
		case 'oauth-authorization-code-v3':
		case 'oidc-authorization-code-v3':
		case 'enhanced-authorization-code-v3':
		case 'unified-authorization-code-v3':
		case 'authorization-code-v5':
			return urls.authz;
		case 'oidc-authorization-code-v6':
		case 'oauth-authorization-code-v6':
			return urls.authz; // Use standard authz-callback, NewAuthContext will redirect to V6 flow page
		case 'oidc-authorization-code-v7':
		case 'oauth-authorization-code-v7':
			return urls.authz; // Use standard authz-callback, NewAuthContext will redirect to V7 flow page
		case 'hybrid':
		case 'oidc-hybrid-v3':
			return urls.hybrid;
		case 'implicit':
		case 'implicit-grant':
		case 'implicit-v7':
			return urls.implicit;
		case 'oidc-implicit-v3':
		case 'oauth2-implicit-v3':
			return `${base}/implicit-callback`;
		case 'oauth-implicit-v5':
		case 'oauth-implicit-v6':
			return `${base}/oauth-implicit-callback`;
		case 'oidc-implicit-v5':
		case 'oidc-implicit-v6':
			return `${base}/oidc-implicit-callback`;
		case 'oidc-hybrid-v6':
			return urls.hybrid;
		case 'worker-token':
		case 'worker':
		case 'worker-token-v3':
			return urls.worker;
		case 'device-code':
		case 'device':
		case 'oidc-device-code-v3':
			return urls.deviceCodeStatus;
		case 'jwt-bearer':
		case 'assertion':
			return urls.assertion || urls.authz; // Fallback to authz if assertion not available
		case 'client-credentials':
			return 'N/A'; // No redirect URI for client credentials
		case 'dashboard':
		case 'dashboard-login':
			return urls.dashboard; // Dashboard login callback
		default:
			return urls.authz; // Default to authorization code callback
	}
}

/**
 * Check if a flow requires a redirect URI
 * @param flowType - The type of OAuth flow
 * @returns true if the flow requires a redirect URI
 */
export function flowRequiresRedirectUri(flowType: string): boolean {
	const noRedirectFlows = ['client-credentials', 'device-code'];
	return !noRedirectFlows.includes(flowType.toLowerCase());
}

/**
 * Get a human-readable description of the callback URL for a flow
 * @param flowType - The type of OAuth flow
 * @returns Description of the callback URL
 */
export function getCallbackDescription(flowType: string): string {
	switch (flowType.toLowerCase()) {
		case 'authorization-code':
		case 'authz':
		case 'pkce':
			return 'Authorization Code flow callback - receives authorization code for token exchange';
		case 'hybrid':
			return 'Hybrid flow callback - receives authorization code and ID token';
		case 'implicit':
		case 'implicit-grant':
			return 'Implicit Grant flow callback - receives access token directly (deprecated)';
		case 'worker-token':
		case 'worker':
			return 'Worker Token flow callback - receives authorization code for worker token exchange';
		case 'device-code':
		case 'device':
			return 'Device Code flow status page - informational only (no browser redirect in spec)';
		case 'jwt-bearer':
		case 'assertion':
			return 'JWT Bearer flow callback - receives authorization code for assertion-based token exchange';
		case 'client-credentials':
			return 'No redirect URI required - Client Credentials flow uses direct token endpoint';
		case 'dashboard':
		case 'dashboard-login':
			return 'Dashboard login callback - receives authorization code for dashboard authentication';
		default:
			return 'OAuth flow callback URL';
	}
}
