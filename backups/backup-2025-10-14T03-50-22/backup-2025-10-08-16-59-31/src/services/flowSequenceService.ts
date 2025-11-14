// src/services/flowSequenceService.ts
// Service for providing flow sequence steps for different OAuth/OIDC flows

export interface FlowSequenceStep {
	stepNumber: number;
	title: string;
	description: string;
	technicalDetails?: string;
	exampleDisplay?: string;
}

export interface FlowSequence {
	title: string;
	steps: FlowSequenceStep[];
	keyBenefits?: string[];
}

type FlowType =
	| 'device-authorization'
	| 'authorization-code'
	| 'implicit'
	| 'client-credentials'
	| 'resource-owner-password'
	| 'ciba'
	| 'redirectless'
	| 'hybrid'
	| 'jwt-bearer'
	| 'worker-token'
	| 'token-introspection'
	| 'token-revocation'
	| 'user-info'
	| 'rar';

const flowSequences: Record<FlowType, FlowSequence> = {
	'device-authorization': {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Device requests device code',
				description: 'Device calls the device authorization endpoint with client_id and scopes',
				technicalDetails: 'POST /device_authorization',
				exampleDisplay:
					'Server responds with: device_code, user_code, verification_uri, expires_in, interval',
			},
			{
				stepNumber: 2,
				title: 'Display user code',
				description:
					'Device shows user_code and verification_uri to user on screen (e.g., "Visit example.com and enter code: ABCD-1234")',
				exampleDisplay:
					'Example display: "Go to https://auth.pingone.com/activate and enter: WDJB-MJHT"',
			},
			{
				stepNumber: 3,
				title: 'User authorizes on secondary device',
				description:
					'User visits URL on phone/computer, enters code, and authorizes the application',
				exampleDisplay: 'User sees: "Authorize \'Smart TV App\' to access your account?"',
			},
			{
				stepNumber: 4,
				title: 'Device polls for tokens',
				description: 'Device continuously polls token endpoint until user completes authorization',
			},
			{
				stepNumber: 5,
				title: 'Tokens received',
				description: 'Device receives access token, ID token, and optionally refresh token',
			},
		],
		keyBenefits: [
			'No browser required on the device',
			'Secure - uses standard OAuth 2.0',
			'User-friendly - simple code entry',
		],
	},

	'authorization-code': {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Generate PKCE parameters',
				description: 'Client generates code_verifier and code_challenge for security',
			},
			{
				stepNumber: 2,
				title: 'Build authorization URL',
				description:
					'Client constructs authorization URL with client_id, redirect_uri, scope, state, and code_challenge',
			},
			{
				stepNumber: 3,
				title: 'User authorizes',
				description:
					'User is redirected to authorization server, authenticates, and approves scopes',
			},
			{
				stepNumber: 4,
				title: 'Authorization code returned',
				description: 'Authorization server redirects back to client with authorization code',
			},
			{
				stepNumber: 5,
				title: 'Exchange code for tokens',
				description: 'Client exchanges authorization code and code_verifier for tokens',
			},
			{
				stepNumber: 6,
				title: 'Tokens received',
				description: 'Client receives access token, ID token (OIDC), and optionally refresh token',
			},
		],
		keyBenefits: [
			'Most secure flow for web and mobile apps',
			'PKCE protects against authorization code interception',
			'Refresh tokens enable long-lived sessions',
		],
	},

	implicit: {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Build authorization URL',
				description:
					'Client constructs authorization URL with response_type=token for OAuth or response_type=id_token token for OIDC',
			},
			{
				stepNumber: 2,
				title: 'User authorizes',
				description: 'User is redirected to authorization server and authenticates',
			},
			{
				stepNumber: 3,
				title: 'Tokens returned in URL fragment',
				description: 'Authorization server redirects back with tokens in URL fragment (#)',
			},
			{
				stepNumber: 4,
				title: 'Client extracts tokens',
				description: 'JavaScript extracts tokens from URL fragment',
			},
		],
		keyBenefits: [
			'Simple - no backend token exchange required',
			'Fast - tokens returned immediately',
		],
	},

	'client-credentials': {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Client authenticates',
				description: 'Client sends client_id and client_secret to token endpoint',
				technicalDetails: 'POST /token with grant_type=client_credentials',
			},
			{
				stepNumber: 2,
				title: 'Tokens received',
				description: 'Server validates credentials and returns access token',
			},
			{
				stepNumber: 3,
				title: 'Access API',
				description: 'Client uses access token to call protected APIs',
			},
		],
		keyBenefits: [
			'Server-to-server authentication',
			'No user interaction required',
			'Simple and efficient',
		],
	},

	'resource-owner-password': {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Collect credentials',
				description: 'Client collects username and password from user',
			},
			{
				stepNumber: 2,
				title: 'Exchange credentials for tokens',
				description:
					'Client sends username, password, client_id, and client_secret to token endpoint',
				technicalDetails: 'POST /token with grant_type=password',
			},
			{
				stepNumber: 3,
				title: 'Tokens received',
				description:
					'Server validates credentials and returns access token and optionally refresh token',
			},
		],
		keyBenefits: ['Legacy migration support', 'Direct credential exchange'],
	},

	ciba: {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Client sends backchannel authentication request',
				description: 'Client sends authentication request to PingOne with user identifier',
				technicalDetails: 'POST /bc-authorize',
			},
			{
				stepNumber: 2,
				title: 'PingOne prompts end user',
				description: "PingOne sends push notification to user's registered authenticator device",
			},
			{
				stepNumber: 3,
				title: 'Client polls token endpoint',
				description:
					'Client polls token endpoint using auth_req_id received from backchannel request',
			},
			{
				stepNumber: 4,
				title: 'User approves on trusted device',
				description: 'User approves authentication request on their mobile device',
			},
			{
				stepNumber: 5,
				title: 'Tokens issued',
				description: 'Once approved, tokens are issued and returned to polling client',
			},
		],
		keyBenefits: [
			'Decoupled authentication',
			'User authenticates on trusted device',
			'No redirect required',
		],
	},

	redirectless: {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Generate PKCE parameters',
				description: 'Client generates code_verifier and code_challenge',
			},
			{
				stepNumber: 2,
				title: 'Build authorization request',
				description:
					'Client constructs request with response_mode=pi.flow for embedded authentication',
			},
			{
				stepNumber: 3,
				title: 'Embedded authentication',
				description: 'User authenticates within embedded iframe/webview without full redirect',
			},
			{
				stepNumber: 4,
				title: 'Authorization code returned',
				description: 'Authorization code is returned via postMessage or custom URL scheme',
			},
			{
				stepNumber: 5,
				title: 'Exchange code for tokens',
				description: 'Client exchanges authorization code for tokens',
			},
		],
		keyBenefits: ['No full-page redirect', 'Better user experience', 'PingOne-specific feature'],
	},

	hybrid: {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Build authorization URL',
				description:
					'Client constructs URL with hybrid response_type (e.g., code id_token, code token)',
			},
			{
				stepNumber: 2,
				title: 'User authorizes',
				description: 'User authenticates at authorization server',
			},
			{
				stepNumber: 3,
				title: 'Tokens returned in URL fragment',
				description: 'Some tokens (ID token, access token) returned immediately in URL fragment',
			},
			{
				stepNumber: 4,
				title: 'Exchange code for additional tokens',
				description:
					'Client exchanges authorization code for additional tokens (including refresh token)',
			},
		],
		keyBenefits: [
			'Combines benefits of implicit and authorization code flows',
			'Immediate ID token validation',
			'Secure refresh token delivery',
		],
	},

	'jwt-bearer': {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Create JWT assertion',
				description: 'Client creates and signs JWT with client credentials',
			},
			{
				stepNumber: 2,
				title: 'Exchange JWT for tokens',
				description: 'Client sends JWT assertion to token endpoint',
				technicalDetails: 'POST /token with grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer',
			},
			{
				stepNumber: 3,
				title: 'Tokens received',
				description: 'Server validates JWT and returns access token',
			},
		],
		keyBenefits: [
			'Enhanced security with JWT signatures',
			'Sophisticated authentication scenarios',
			'No shared secrets in transit',
		],
	},

	'worker-token': {
		title: 'Complete Flow Sequence',
		steps: [
			{
				stepNumber: 1,
				title: 'Configure worker application',
				description: 'Set up PingOne worker application with appropriate scopes',
			},
			{
				stepNumber: 2,
				title: 'Request worker token',
				description: 'Application authenticates with client credentials',
				technicalDetails: 'POST /token with grant_type=client_credentials',
			},
			{
				stepNumber: 3,
				title: 'Receive worker token',
				description: 'PingOne returns access token with management API permissions',
			},
			{
				stepNumber: 4,
				title: 'Call PingOne Management APIs',
				description: 'Use worker token to manage users, applications, and configurations',
			},
		],
		keyBenefits: [
			'Access to PingOne Management APIs',
			'Automate user and application management',
			'Server-to-server integration',
		],
	},
	'token-introspection': {
		title: 'Token Introspection Flow',
		steps: [
			{
				stepNumber: 1,
				title: 'Prepare introspection request',
				description: 'Client prepares token introspection request with access token',
				technicalDetails: 'POST /introspect',
				exampleDisplay: 'Include client credentials and token to introspect',
			},
			{
				stepNumber: 2,
				title: 'Send introspection request',
				description: 'Send POST request to token introspection endpoint',
				technicalDetails: 'Content-Type: application/x-www-form-urlencoded',
				exampleDisplay: 'Request body: token, token_type_hint, client_id, client_secret',
			},
			{
				stepNumber: 3,
				title: 'Receive introspection response',
				description: 'Server responds with token metadata and validity status',
				technicalDetails: 'JSON response with active, scope, exp, iat, etc.',
				exampleDisplay: 'Response: { "active": true, "scope": "read write", "exp": 1234567890 }',
			},
		],
		keyBenefits: [
			'Validate token status and metadata',
			'Check token expiration and scopes',
			'Security and compliance monitoring',
		],
	},
	'token-revocation': {
		title: 'Token Revocation Flow',
		steps: [
			{
				stepNumber: 1,
				title: 'Prepare revocation request',
				description: 'Client prepares token revocation request',
				technicalDetails: 'POST /revoke',
				exampleDisplay: 'Include client credentials and token to revoke',
			},
			{
				stepNumber: 2,
				title: 'Send revocation request',
				description: 'Send POST request to token revocation endpoint',
				technicalDetails: 'Content-Type: application/x-www-form-urlencoded',
				exampleDisplay: 'Request body: token, token_type_hint, client_id, client_secret',
			},
			{
				stepNumber: 3,
				title: 'Confirm revocation',
				description: 'Server confirms token has been revoked',
				technicalDetails: 'HTTP 200 OK response',
				exampleDisplay: 'Token is now invalid and cannot be used',
			},
		],
		keyBenefits: [
			'Immediately invalidate compromised tokens',
			'Logout and session management',
			'Security incident response',
		],
	},
	'user-info': {
		title: 'UserInfo Endpoint Flow',
		steps: [
			{
				stepNumber: 1,
				title: 'Prepare UserInfo request',
				description: 'Client prepares request to UserInfo endpoint with access token',
				technicalDetails: 'GET /userinfo',
				exampleDisplay: 'Include Authorization: Bearer <access_token> header',
			},
			{
				stepNumber: 2,
				title: 'Send UserInfo request',
				description: 'Send GET request to UserInfo endpoint',
				technicalDetails: 'Authorization: Bearer <access_token>',
				exampleDisplay: 'Request includes valid access token in Authorization header',
			},
			{
				stepNumber: 3,
				title: 'Receive user profile data',
				description: 'Server responds with user profile information',
				technicalDetails: 'JSON response with user claims',
				exampleDisplay:
					'Response: { "sub": "user123", "name": "John Doe", "email": "john@example.com" }',
			},
		],
		keyBenefits: [
			'Retrieve user profile information',
			'Access user claims and attributes',
			'Personalize user experience',
		],
	},
	rar: {
		title: 'Rich Authorization Requests (RAR) Flow',
		steps: [
			{
				stepNumber: 1,
				title: 'Client prepares RAR authorization request',
				description:
					'Client constructs authorization request with authorization_details parameter containing specific permissions',
				technicalDetails: 'GET /authorize?authorization_details=<json>',
				exampleDisplay:
					'Request includes authorization_details with type, locations, actions, and datatypes',
			},
			{
				stepNumber: 2,
				title: 'User reviews granular permissions',
				description: 'Authorization server presents specific permissions to user for consent',
				technicalDetails: 'User sees detailed permission breakdown',
				exampleDisplay:
					'User sees: "Access payment data at api.example.com/payments for initiate, status actions"',
			},
			{
				stepNumber: 3,
				title: 'User grants consent for specific details',
				description: 'User approves the granular authorization details',
				technicalDetails: 'User interaction with consent UI',
				exampleDisplay: 'User clicks "Allow" for specific authorization details',
			},
			{
				stepNumber: 4,
				title: 'Authorization code returned with RAR context',
				description: 'Server returns authorization code with RAR context preserved',
				technicalDetails: 'Redirect to client with code and state',
				exampleDisplay: 'Redirect: https://client.com/callback?code=abc123&state=xyz',
			},
			{
				stepNumber: 5,
				title: 'Client exchanges code for access token',
				description: 'Client exchanges authorization code for access token with RAR claims',
				technicalDetails: 'POST /token with code, client credentials',
				exampleDisplay: 'Token response includes authorization_details as claims',
			},
			{
				stepNumber: 6,
				title: 'Access token contains RAR claims',
				description:
					'Access token includes authorization_details claims specifying exact permissions',
				technicalDetails: 'JWT with authorization_details claim',
				exampleDisplay:
					'Token claims: { "authorization_details": [{ "type": "payment_initiation", ... }] }',
			},
		],
		keyBenefits: [
			'Granular permission control',
			'Reduced over-privileged access',
			'Enhanced security through specific authorization',
			'Better compliance with data protection regulations',
		],
	},
};

/**
 * Get flow sequence data for a specific flow type
 */
export function getFlowSequence(flowType: FlowType): FlowSequence | null {
	return flowSequences[flowType] || null;
}

/**
 * Get all available flow types
 */
export function getAvailableFlowTypes(): FlowType[] {
	return Object.keys(flowSequences) as FlowType[];
}

/**
 * Check if a flow type has sequence data
 */
export function hasFlowSequence(flowType: string): flowType is FlowType {
	return flowType in flowSequences;
}
