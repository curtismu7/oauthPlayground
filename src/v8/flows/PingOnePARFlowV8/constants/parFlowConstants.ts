// src/pages/flows/PingOnePARFlowV8/constants/parFlowConstants.ts
// PAR Flow V8 Constants

export const PAR_FLOW_CONSTANTS = {
	FLOW_KEY: 'pingone-par-flow-v8',
	DEFAULT_FLOW_VARIANT: 'oidc' as const,
	TOTAL_STEPS: 6,

	DEFAULT_REDIRECT_URI: 'https://localhost:3000/par-callback',
	DEFAULT_OAUTH_SCOPE: 'api.read api.write',
	DEFAULT_OIDC_SCOPE: 'openid profile email',

	PKCE_CHALLENGE_METHOD: 'S256',
	PKCE_CODE_VERIFIER_LENGTH: 43,

	PAR_ENDPOINT_PATH: '/as/par',
	AUTHORIZE_ENDPOINT_PATH: '/as/authorize',
	TOKEN_ENDPOINT_PATH: '/as/token',
	USERINFO_ENDPOINT_PATH: '/as/userinfo',
} as const;

export const STEP_METADATA = [
	{
		id: 0,
		title: 'Configuration',
		subtitle: 'Configure credentials and PAR settings',
		description: 'Set up your PingOne environment and application credentials for PAR flow',
	},
	{
		id: 1,
		title: 'PKCE Generation',
		subtitle: 'Generate PKCE parameters',
		description: 'Create secure PKCE code verifier and challenge for enhanced security',
	},
	{
		id: 2,
		title: 'Push Authorization Request',
		subtitle: 'Send PAR request to secure endpoint',
		description: 'Push authorization parameters to PAR endpoint and receive request_uri',
	},
	{
		id: 3,
		title: 'User Authorization',
		subtitle: 'Complete user authentication',
		description: 'Redirect user to authorization endpoint with request_uri',
	},
	{
		id: 4,
		title: 'Token Exchange',
		subtitle: 'Exchange code for tokens',
		description: 'Exchange authorization code for access token and optional ID token',
	},
	{
		id: 5,
		title: 'Complete',
		subtitle: 'Flow completed successfully',
		description: 'Review tokens and next steps',
	},
] as const;
