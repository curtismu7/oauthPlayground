// src/config/mockFlowCredentials.ts
// Default credentials for all mock flows - enables zero-field entry

export interface FlowCredentials {
	clientId: string;
	clientSecret?: string;
	environmentId: string;
	scope?: string;
	redirectUri?: string;
	username?: string;
	password?: string;
	userEmail?: string;
	tokenEndpoint?: string;
	responseType?: string;
	loginHint?: string;
	[key: string]: string | undefined;
}

/**
 * Default credentials for each mock flow type
 * These enable zero-field entry - users can test flows immediately without configuration
 */
export const DEFAULT_MOCK_CREDENTIALS: Record<string, FlowCredentials> = {
	'client-credentials': {
		clientId: 'v7m-client-credentials',
		clientSecret: 'topsecret',
		scope: 'read write',
		environmentId: 'demo-env',
	},
	'device-authorization': {
		clientId: 'v7m-device-client',
		scope: 'read write',
		userEmail: 'jane.doe@example.com',
		environmentId: 'demo-env',
	},
	'jwt-bearer': {
		clientId: 'jwt-bearer-client',
		clientSecret: 'topsecret',
		tokenEndpoint: 'https://api.pingone.com/oauth2/token',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'oauth-authz-code': {
		clientId: 'v7m-oauth-authz-code',
		clientSecret: 'topsecret',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'oidc-authz-code': {
		clientId: 'v7m-oidc-authz-code',
		clientSecret: 'topsecret',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'implicit': {
		clientId: 'v7m-implicit-client',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'ropc': {
		clientId: 'v7m-ropc-client',
		clientSecret: 'topsecret',
		username: 'jane.doe@example.com',
		password: 'P@ssw0rd123',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'ciba': {
		clientId: 'v7m-ciba-client',
		clientSecret: 'topsecret',
		loginHint: 'jane.doe@example.com',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'hybrid': {
		clientId: 'v7m-hybrid-client',
		clientSecret: 'topsecret',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		responseType: 'code id_token',
		environmentId: 'demo-env',
	},
	'saml-bearer': {
		clientId: 'v7m-saml-bearer-client',
		clientSecret: 'topsecret',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'dpop': {
		clientId: 'v7m-dpop-client',
		clientSecret: 'topsecret',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'par': {
		clientId: 'v7m-par-client',
		clientSecret: 'topsecret',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
	'rar': {
		clientId: 'v7m-rar-client',
		clientSecret: 'topsecret',
		redirectUri: 'https://localhost:3000/callback',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	},
};

/**
 * Get default credentials for a specific flow type
 */
export function getDefaultCredentials(flowType: string): FlowCredentials {
	return DEFAULT_MOCK_CREDENTIALS[flowType] || {
		clientId: `v7m-${flowType}-client`,
		clientSecret: 'topsecret',
		scope: 'openid profile email',
		environmentId: 'demo-env',
	};
}

/**
 * Merge default credentials with user-provided overrides
 */
export function mergeCredentials(
	flowType: string,
	overrides: Partial<FlowCredentials>
): FlowCredentials {
	const defaults = getDefaultCredentials(flowType);
	return { ...defaults, ...overrides };
}
