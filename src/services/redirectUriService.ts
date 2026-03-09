// src/services/redirectUriService.ts
// Redirect URI Service - Provides educational context about redirect and logout URIs for flows

import { logger } from '../utils/logger';

export interface RedirectUriInfo {
	uri: string;
	purpose: string;
	description: string;
	flowType: string;
	securityConsiderations: string[];
	bestPractices: string[];
}

export interface LogoutUriInfo {
	uri: string;
	purpose: string;
	description: string;
	flowType: string;
	securityConsiderations: string[];
	bestPractices: string[];
}

export interface FlowUriInfo {
	flowName: string;
	flowType: 'OAuth' | 'OIDC' | 'Hybrid' | 'Device Code' | 'Client Credentials';
	redirectUris: RedirectUriInfo[];
	logoutUris: LogoutUriInfo[];
	educationalNotes: string[];
}

class RedirectUriService {
	private flowUriDatabase: Map<string, FlowUriInfo> = new Map();

	constructor() {
		this.initializeFlowDatabase();
	}

	private initializeFlowDatabase(): void {
		// Authorization Code Flow V7.1
		this.flowUriDatabase.set('oauth-authorization-code-v7-1', {
			flowName: 'OAuth Authorization Code Flow V7.1',
			flowType: 'OAuth',
			redirectUris: [
				{
					uri: 'https://localhost:3000/authz-callback',
					purpose: 'OAuth 2.0 Authorization Code callback',
					description: 'Receives authorization code from PingOne after user authentication',
					flowType: 'OAuth Authorization Code',
					securityConsiderations: [
						'Must be registered in PingOne application configuration',
						'HTTPS required in production',
						'No query parameters should be processed from callback',
						'Validate state parameter to prevent CSRF',
					],
					bestPractices: [
						'Use exact URI matching (no wildcards)',
						'Implement PKCE for additional security',
						'Process authorization code immediately',
						'Clear state parameter after validation',
					],
				},
			],
			logoutUris: [
				{
					uri: 'https://localhost:3000/logout-callback',
					purpose: 'Post-logout redirect destination',
					description: 'User returns here after PingOne logout completes',
					flowType: 'OAuth Session Termination',
					securityConsiderations: [
						'Must be registered in PingOne application',
						'Clear local session data on arrival',
						'Validate logout token if present',
					],
					bestPractices: [
						'Destroy all local tokens and session data',
						'Redirect to home page after cleanup',
						'Log successful logout for audit trail',
					],
				},
			],
			educationalNotes: [
				'The authorization code flow is recommended for web applications with server-side backend',
				'PKCE (Proof Key for Code Exchange) adds additional security against code interception',
				'State parameter prevents CSRF attacks during the authorization process',
				"The callback URL must exactly match what's registered in PingOne",
			],
		});

		// Implicit Flow V9
		this.flowUriDatabase.set('implicit-flow-v9', {
			flowName: 'OAuth Implicit Flow V9',
			flowType: 'OIDC',
			redirectUris: [
				{
					uri: 'https://localhost:3000/implicit-callback',
					purpose: 'OAuth 2.0 Implicit + OIDC callback',
					description: 'Receives access token and ID token directly in URL fragment',
					flowType: 'OAuth Implicit + OIDC',
					securityConsiderations: [
						'Tokens exposed in browser URL/history',
						'Short-lived tokens recommended',
						'Not recommended for production use',
						'Use authorization code flow instead',
					],
					bestPractices: [
						'Use only for legacy applications',
						'Implement token revocation on logout',
						'Clear URL fragment immediately',
						'Consider migrating to auth code flow',
					],
				},
			],
			logoutUris: [
				{
					uri: 'https://localhost:3000/implicit-logout',
					purpose: 'Implicit flow logout redirect',
					description: 'Post-logout destination for implicit flow applications',
					flowType: 'OIDC Session Termination',
					securityConsiderations: [
						'Tokens stored in browser memory',
						'Complete client-side token cleanup required',
						"URL fragment doesn't support logout tokens",
					],
					bestPractices: [
						'Clear all browser storage',
						'Revoke tokens at PingOne',
						'Navigate away from token-containing URLs',
					],
				},
			],
			educationalNotes: [
				'Implicit flow is deprecated and should only be used for legacy applications',
				'Tokens are returned directly in the URL fragment, making them less secure',
				'Consider migrating to Authorization Code Flow with PKCE for better security',
				'ID tokens in implicit flow cannot be properly validated without nonce',
			],
		});

		// Add ImplicitFlowV9.tsx flow key
		this.flowUriDatabase.set('ImplicitFlowV9', {
			flowName: 'OAuth Implicit Flow V9 (Component)',
			flowType: 'OIDC',
			redirectUris: [
				{
					uri: 'https://localhost:3000/implicit-callback',
					purpose: 'OAuth 2.0 Implicit + OIDC callback',
					description: 'Receives access token and ID token directly in URL fragment',
					flowType: 'OAuth Implicit + OIDC',
					securityConsiderations: [
						'Tokens exposed in browser URL/history',
						'Short-lived tokens recommended',
						'Not recommended for production use',
						'Use authorization code flow instead',
					],
					bestPractices: [
						'Use only for legacy applications',
						'Implement token revocation on logout',
						'Clear URL fragment immediately',
						'Consider migrating to auth code flow',
					],
				},
			],
			logoutUris: [
				{
					uri: 'https://localhost:3000/implicit-logout',
					purpose: 'Implicit flow logout redirect',
					description: 'Post-logout destination for implicit flow applications',
					flowType: 'OIDC Session Termination',
					securityConsiderations: [
						'Tokens stored in browser memory',
						'Complete client-side token cleanup required',
						"URL fragment doesn't support logout tokens",
					],
					bestPractices: [
						'Clear all browser storage',
						'Revoke tokens at PingOne',
						'Navigate away from token-containing URLs',
					],
				},
			],
			educationalNotes: [
				'Implicit flow is deprecated and should only be used for legacy applications',
				'Tokens are returned directly in the URL fragment, making them less secure',
				'Consider migrating to Authorization Code Flow with PKCE for better security',
				'ID tokens in implicit flow cannot be properly validated without nonce',
			],
		});

		// Add Device Authorization Flow V9
		this.flowUriDatabase.set('DeviceAuthorizationFlowV9', {
			flowName: 'OAuth Device Authorization Flow V9',
			flowType: 'Device Code',
			redirectUris: [
				{
					uri: 'https://localhost:3000/device-callback',
					purpose: 'Device code polling callback',
					description:
						'Not a traditional redirect - used for completion notification and token polling',
					flowType: 'Device Code Authorization',
					securityConsiderations: [
						'No direct redirect from PingOne authorization server',
						'Client continuously polls token endpoint for completion',
						'User authentication happens on separate device',
						'Device code must be securely displayed to user',
					],
					bestPractices: [
						'Implement exponential backoff polling strategy',
						'Display user code prominently with clear instructions',
						'Show QR code for mobile device convenience',
						'Handle slow polling gracefully with user feedback',
						'Implement proper error handling for expired codes',
					],
				},
			],
			logoutUris: [
				{
					uri: 'https://localhost:3000/device-logout',
					purpose: 'Device flow logout redirect',
					description: 'Logout endpoint for device authorization flow applications',
					flowType: 'Device Code Session Termination',
					securityConsiderations: [
						'May not have traditional browser session to clear',
						'Tokens can be long-lived for device scenarios',
						'Multiple devices may be authenticated simultaneously',
						'Revocation must handle device-specific tokens',
					],
					bestPractices: [
						'Revoke device-specific access tokens at PingOne',
						'Notify all connected devices of logout events',
						'Clear device registration and pairing information',
						'Implement device-specific logout tracking',
					],
				},
			],
			educationalNotes: [
				'Device authorization flow enables authentication on devices without browsers or input capabilities',
				'User authenticates on separate device (like phone) using the device code',
				'Client application continuously polls PingOne for token completion status',
				'Ideal for smart TVs, IoT devices, command-line applications, and limited-input devices',
				'Polling interval should respect PingOne rate limits and implement backoff strategies',
			],
		});

		// Device Code Flow V6
		this.flowUriDatabase.set('device-code-flow-v6', {
			flowName: 'OAuth Device Code Flow V6',
			flowType: 'Device Code',
			redirectUris: [
				{
					uri: 'https://localhost:3000/device-callback',
					purpose: 'Device code polling callback',
					description: 'Not a traditional redirect - used for completion notification',
					flowType: 'Device Code Authorization',
					securityConsiderations: [
						'No direct redirect from PingOne',
						'Client polls token endpoint',
						'User code must be entered on separate device',
					],
					bestPractices: [
						'Implement exponential backoff polling',
						'Display user code prominently',
						'Show QR code for mobile devices',
						'Handle slow polling gracefully',
					],
				},
			],
			logoutUris: [
				{
					uri: 'https://localhost:3000/device-logout',
					purpose: 'Device flow logout',
					description: 'Logout endpoint for device flow applications',
					flowType: 'Device Code Session Termination',
					securityConsiderations: [
						'May not have traditional session',
						'Tokens may be long-lived',
						'Multiple devices may be authenticated',
					],
					bestPractices: [
						'Revoke device-specific tokens',
						'Notify all connected devices',
						'Clear device registration',
					],
				},
			],
			educationalNotes: [
				'Device code flow enables authentication on devices without browsers',
				'User authenticates on separate device using device code',
				'Client continuously polls PingOne for token completion',
				'Ideal for smart TVs, IoT devices, and command-line applications',
			],
		});

		// Client Credentials Flow
		this.flowUriDatabase.set('client-credentials-flow', {
			flowName: 'OAuth Client Credentials Flow',
			flowType: 'Client Credentials',
			redirectUris: [
				{
					uri: 'N/A - No redirect URI required',
					purpose: 'Direct token exchange',
					description:
						"Client credentials flow doesn't use redirects - tokens obtained directly from token endpoint",
					flowType: 'Client Credentials Token Exchange',
					securityConsiderations: [
						'No user interaction involved in the flow',
						'Client secret must be strongly protected and securely stored',
						'Tokens represent the application, not an individual user',
						'Suitable for machine-to-machine communication only',
					],
					bestPractices: [
						'Store client secret in secure vault or environment variables',
						'Use certificate-based authentication when possible for enhanced security',
						'Limit token scopes to the minimum required permissions',
						'Implement proper token caching with secure refresh mechanisms',
						'Monitor token usage patterns for security anomalies',
					],
				},
			],
			logoutUris: [
				{
					uri: 'N/A - No logout URI required',
					purpose: 'Token revocation only',
					description:
						"Client credentials flow doesn't have user sessions to logout - focus on token management",
					flowType: 'Application Token Management',
					securityConsiderations: [
						"Tokens don't represent user sessions, so traditional logout doesn't apply",
						'Token revocation must be handled via token endpoint or introspection',
						'No browser session or cookies to clear',
						'Multiple application instances may have active tokens',
					],
					bestPractices: [
						'Revoke tokens when they are no longer needed or on application shutdown',
						'Implement proper token lifecycle management with expiration tracking',
						'Monitor token usage and implement automated cleanup for unused tokens',
						'Use token introspection to validate token status when needed',
					],
				},
			],
			educationalNotes: [
				'Client credentials flow is designed for machine-to-machine communication',
				'Tokens represent the application itself, not an individual user',
				'No user authentication or browser interaction is required',
				'Ideal for backend services, daemons, APIs, and automated processes',
				'Tokens typically have longer lifespans but should still be managed securely',
				'This flow should not be used when user context or authentication is needed',
			],
		});

		// Hybrid Flow
		this.flowUriDatabase.set('hybrid-flow', {
			flowName: 'OAuth Hybrid Flow',
			flowType: 'Hybrid',
			redirectUris: [
				{
					uri: 'https://localhost:3000/hybrid-callback',
					purpose: 'Hybrid flow callback',
					description: 'Receives authorization code and optionally ID token or access token',
					flowType: 'OAuth Hybrid + OIDC',
					securityConsiderations: [
						'Combines characteristics of auth code and implicit flows',
						'ID token in response requires nonce validation',
						'Authorization code still requires token exchange',
					],
					bestPractices: [
						'Always validate ID token nonce',
						'Exchange authorization code for tokens',
						'Use PKCE for additional security',
						'Handle multiple token types properly',
					],
				},
			],
			logoutUris: [
				{
					uri: 'https://localhost:3000/hybrid-logout',
					purpose: 'Hybrid flow logout',
					description: 'Post-logout destination for hybrid flow applications',
					flowType: 'Hybrid Session Termination',
					securityConsiderations: [
						'Multiple token types to manage',
						'ID token and access token cleanup',
						'Session state synchronization',
					],
					bestPractices: [
						'Clear all token types',
						'Revoke tokens at PingOne',
						'Handle session state properly',
					],
				},
			],
			educationalNotes: [
				'Hybrid flow combines features of authorization code and implicit flows',
				'Receives authorization code plus optionally ID token or access token',
				'Provides immediate user info while maintaining token exchange security',
				'Useful for applications needing instant user authentication',
			],
		});
	}

	// Get URI information for a specific flow
	public getFlowUriInfo(flowKey: string): FlowUriInfo | null {
		const info = this.flowUriDatabase.get(flowKey);
		if (!info) {
			logger.warn('RedirectUriService', `No URI information found for flow: ${flowKey}`);
			return null;
		}
		return info;
	}

	// Get all available flows
	public getAllFlows(): FlowUriInfo[] {
		return Array.from(this.flowUriDatabase.values());
	}

	// Get flows by type
	public getFlowsByType(flowType: FlowUriInfo['flowType']): FlowUriInfo[] {
		return Array.from(this.flowUriDatabase.values()).filter((flow) => flow.flowType === flowType);
	}

	// Search flows by name or URI
	public searchFlows(query: string): FlowUriInfo[] {
		const lowercaseQuery = query.toLowerCase();
		return Array.from(this.flowUriDatabase.values()).filter(
			(flow) =>
				flow.flowName.toLowerCase().includes(lowercaseQuery) ||
				flow.redirectUris.some((uri) => uri.uri.toLowerCase().includes(lowercaseQuery)) ||
				flow.logoutUris.some((uri) => uri.uri.toLowerCase().includes(lowercaseQuery))
		);
	}

	// Add custom flow URI information
	public addCustomFlow(flowKey: string, flowInfo: FlowUriInfo): void {
		this.flowUriDatabase.set(flowKey, flowInfo);
		logger.info('RedirectUriService', `Added custom flow URI information: ${flowKey}`);
	}

	// Export flow information as formatted data
	public exportFlowData(flowKey: string): string | null {
		const flowInfo = this.getFlowUriInfo(flowKey);
		if (!flowInfo) {
			return null;
		}

		return JSON.stringify(flowInfo, null, 2);
	}

	// Generate educational summary for a flow
	public generateEducationalSummary(flowKey: string): string | null {
		const flowInfo = this.getFlowUriInfo(flowKey);
		if (!flowInfo) {
			return null;
		}

		const summary = `
# ${flowInfo.flowName} - URI Educational Guide

## Flow Type: ${flowInfo.flowType}

### Redirect URIs
${flowInfo.redirectUris
	.map(
		(uri, index) => `
#### ${index + 1}. ${uri.uri}
**Purpose:** ${uri.purpose}
**Description:** ${uri.description}

**Security Considerations:**
${uri.securityConsiderations.map((sc) => `- ${sc}`).join('\n')}

**Best Practices:**
${uri.bestPractices.map((bp) => `- ${bp}`).join('\n')}
`
	)
	.join('\n')}

### Logout URIs
${flowInfo.logoutUris
	.map(
		(uri, index) => `
#### ${index + 1}. ${uri.uri}
**Purpose:** ${uri.purpose}
**Description:** ${uri.description}

**Security Considerations:**
${uri.securityConsiderations.map((sc) => `- ${sc}`).join('\n')}

**Best Practices:**
${uri.bestPractices.map((bp) => `- ${bp}`).join('\n')}
`
	)
	.join('\n')}

### Educational Notes
${flowInfo.educationalNotes.map((note) => `- ${note}`).join('\n')}
		`.trim();

		return summary;
	}
}

// Export singleton instance
export const redirectUriService = new RedirectUriService();
