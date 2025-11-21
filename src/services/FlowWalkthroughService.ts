// src/services/FlowWalkthroughService.ts
// Reusable service for generating flow walkthrough steps across all OAuth, OIDC, and PingOne flows

export interface FlowWalkthroughStep {
	title: string;
	description?: string;
}

export interface FlowWalkthroughConfig {
	flowType: 'oauth' | 'oidc' | 'pingone';
	flowName: string;
	steps: FlowWalkthroughStep[];
	icon?: string | undefined;
}

// Predefined walkthrough configurations for all flow types
export const FLOW_WALKTHROUGH_CONFIGS: Record<string, FlowWalkthroughConfig> = {
	// OAuth 2.0 Flows
	'oauth-authorization-code': {
		flowType: 'oauth',
		flowName: 'Authorization Code Flow',
		icon: '🌐',
		steps: [
			{
				title: 'User clicks login to start the flow',
				description:
					'User initiates authentication by clicking the login button in your application',
			},
			{
				title: 'App redirects to PingOne with an authorization request',
				description:
					"Your application redirects the user to PingOne's authorization server with the required parameters",
			},
			{
				title: 'User authenticates and approves scopes',
				description: 'User logs in and grants permission for the requested scopes',
			},
			{
				title: 'PingOne returns an authorization code to the redirect URI',
				description: 'PingOne redirects back to your application with an authorization code',
			},
			{
				title: 'Backend exchanges the code for tokens securely',
				description: 'Your backend exchanges the authorization code for access and refresh tokens',
			},
		],
	},

	'oauth-implicit': {
		flowType: 'oauth',
		flowName: 'Implicit Flow',
		icon: '⚡',
		steps: [
			{
				title: 'User clicks login to start the flow',
				description: 'User initiates authentication in your application',
			},
			{
				title: 'App redirects to PingOne with an authorization request',
				description: 'Your application redirects the user to PingOne with response_type=token',
			},
			{
				title: 'User authenticates and approves scopes',
				description: 'User logs in and grants permission for the requested scopes',
			},
			{
				title: 'PingOne returns tokens directly in URL fragment',
				description:
					'PingOne redirects back with access token in the URL fragment (not recommended for production)',
			},
		],
	},

	'oauth-client-credentials': {
		flowType: 'oauth',
		flowName: 'Client Credentials Flow',
		icon: '🔑',
		steps: [
			{
				title: 'Configure client credentials',
				description: 'Set up client ID and client secret for your application',
			},
			{
				title: 'Send token request to PingOne',
				description: "Make a POST request to PingOne's token endpoint with client credentials",
			},
			{
				title: 'Receive access token',
				description: 'PingOne returns an access token for server-to-server authentication',
			},
			{
				title: 'Use token for API calls',
				description: 'Use the access token to make authenticated calls to protected resources',
			},
		],
	},

	'oauth-device-authorization': {
		flowType: 'oauth',
		flowName: 'Device Authorization Flow',
		icon: '📱',
		steps: [
			{
				title: 'Request device code from PingOne',
				description: 'Your application requests a device code and user code from PingOne',
			},
			{
				title: 'Display user code to user',
				description: 'Show the user code and verification URL to the user on their device',
			},
			{
				title: 'User visits verification URL on another device',
				description: 'User goes to the verification URL on a device with a browser',
			},
			{
				title: 'User authenticates and approves',
				description: 'User logs in and grants permission for the application',
			},
			{
				title: 'Poll for tokens',
				description: "Your application polls PingOne's token endpoint until tokens are available",
			},
		],
	},

	'oauth-resource-owner-password': {
		flowType: 'oauth',
		flowName: 'Resource Owner Password Flow',
		icon: '🔒',
		steps: [
			{
				title: 'User enters credentials',
				description: 'User provides username and password in your application',
			},
			{
				title: 'Send token request with credentials',
				description: "Your application sends the credentials directly to PingOne's token endpoint",
			},
			{
				title: 'Receive access token',
				description: 'PingOne returns an access token (not recommended for production)',
			},
		],
	},

	'oauth-jwt-bearer': {
		flowType: 'oauth',
		flowName: 'JWT Bearer Token Flow',
		icon: '🔐',
		steps: [
			{
				title: 'Create JWT assertion',
				description: 'Generate a JWT assertion with client credentials and claims',
			},
			{
				title: 'Send token request with JWT',
				description: "Send the JWT assertion to PingOne's token endpoint",
			},
			{
				title: 'Receive access token',
				description: 'PingOne validates the JWT and returns an access token',
			},
		],
	},

	// OpenID Connect Flows
	'oidc-authorization-code': {
		flowType: 'oidc',
		flowName: 'OpenID Connect Authorization Code Flow',
		icon: '🆔',
		steps: [
			{
				title: 'User initiates authentication',
				description: 'User clicks login and is redirected to the OpenID Connect provider',
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity and access information',
			},
			{
				title: 'Provider returns authorization code',
				description: 'OpenID Connect provider redirects back with an authorization code',
			},
			{
				title: 'Exchange code for tokens and ID token',
				description: 'Backend exchanges code for access token, refresh token, and ID token',
			},
			{
				title: 'Validate ID token and get user info',
				description: 'Validate the ID token and optionally fetch additional user information',
			},
		],
	},

	'oidc-implicit': {
		flowType: 'oidc',
		flowName: 'OpenID Connect Implicit Flow',
		icon: '⚡',
		steps: [
			{
				title: 'User initiates authentication',
				description: 'User clicks login and is redirected to the OpenID Connect provider',
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity information',
			},
			{
				title: 'Provider returns ID token directly',
				description: 'OpenID Connect provider returns ID token in URL fragment (not recommended)',
			},
			{
				title: 'Validate ID token',
				description: "Validate the ID token to ensure it's authentic and not expired",
			},
		],
	},

	'oidc-hybrid': {
		flowType: 'oidc',
		flowName: 'OpenID Connect Hybrid Flow',
		icon: '🔀',
		steps: [
			{
				title: 'User initiates authentication',
				description: 'User clicks login and is redirected to the OpenID Connect provider',
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity and access information',
			},
			{
				title: 'Provider returns authorization code and ID token',
				description: 'OpenID Connect provider returns both authorization code and ID token',
			},
			{
				title: 'Exchange code for additional tokens',
				description: 'Backend exchanges authorization code for access and refresh tokens',
			},
			{
				title: 'Validate all tokens',
				description: 'Validate ID token, access token, and refresh token',
			},
		],
	},

	'oidc-ciba': {
		flowType: 'oidc',
		flowName: 'OpenID Connect CIBA Flow',
		icon: '📱',
		steps: [
			{
				title: 'Client initiates backchannel authentication',
				description: 'Your application sends an authentication request to PingOne',
			},
			{
				title: 'PingOne notifies user device',
				description: "PingOne sends a notification to the user's registered device",
			},
			{
				title: 'User authenticates on device',
				description: 'User authenticates using their registered authenticator',
			},
			{
				title: 'Poll for authentication result',
				description: 'Your application polls PingOne for the authentication result',
			},
			{
				title: 'Receive tokens',
				description: 'PingOne returns access token, ID token, and refresh token',
			},
		],
	},

	'ciba-v7': {
		flowType: 'oidc',
		flowName: 'OIDC CIBA Flow (V7)',
		icon: '🛡️',
		steps: [
			{
				title: 'Configure CIBA Parameters',
				description:
					'Set up your CIBA configuration with environment details and authentication parameters',
			},
			{
				title: 'Initiate Authentication Request',
				description:
					'Start the CIBA authentication process and generate the authentication request',
			},
			{
				title: 'User Approval Process',
				description: 'Monitor the user approval process and wait for authentication completion',
			},
			{
				title: 'Token Exchange & Results',
				description: 'View the authentication results and access tokens with enhanced V7 services',
			},
		],
	},

	'oidc-ciba-v6': {
		flowType: 'oidc',
		flowName: 'OpenID Connect CIBA Flow (Mock) (V6)',
		icon: '📱',
		steps: [
			{
				title: 'Client initiates backchannel authentication',
				description: 'Your application sends an authentication request to PingOne',
			},
			{
				title: 'PingOne notifies user device',
				description: "PingOne sends a notification to the user's registered device",
			},
			{
				title: 'User authenticates on device',
				description: 'User authenticates using their registered authenticator',
			},
			{
				title: 'Poll for authentication result',
				description: 'Your application polls PingOne for the authentication result',
			},
			{
				title: 'Receive tokens',
				description: 'PingOne returns access token, ID token, and refresh token',
			},
		],
	},

	// PingOne Specific Flows
	'pingone-worker-token': {
		flowType: 'pingone',
		flowName: 'PingOne Worker Token Flow',
		icon: '🔧',
		steps: [
			{
				title: 'Configure PingOne credentials',
				description: 'Set up environment ID, client ID, and client secret for PingOne',
			},
			{
				title: 'Request worker token',
				description: "Send a request to PingOne's token endpoint with client credentials",
			},
			{
				title: 'Receive access token',
				description: 'PingOne returns an access token for administrative operations',
			},
			{
				title: 'Use token for API calls',
				description: 'Use the access token to make authenticated calls to PingOne APIs',
			},
		],
	},

	'pingone-par': {
		flowType: 'pingone',
		flowName: 'PingOne PAR Flow',
		icon: '📤',
		steps: [
			{
				title: 'Create pushed authorization request',
				description: 'Build the authorization request parameters',
			},
			{
				title: 'Push request to PingOne',
				description: "Send the authorization request to PingOne's PAR endpoint",
			},
			{
				title: 'Receive request URI',
				description: 'PingOne returns a request URI for the authorization request',
			},
			{
				title: 'Redirect user to authorization endpoint',
				description: 'Redirect user to PingOne with the request URI',
			},
			{
				title: 'Complete authorization flow',
				description: 'User authenticates and returns authorization code',
			},
		],
	},

	'pingone-redirectless': {
		flowType: 'pingone',
		flowName: 'PingOne Redirectless Flow',
		icon: '⚡',
		steps: [
			{
				title: 'Configure redirectless flow',
				description: 'Set up PingOne environment for redirectless authentication',
			},
			{
				title: 'Initiate flow request',
				description: 'Send a request to PingOne to start the redirectless flow',
			},
			{
				title: 'Receive flow response',
				description: 'PingOne returns flow information and authentication details',
			},
			{
				title: 'Complete authentication',
				description: 'User completes authentication without browser redirects',
			},
			{
				title: 'Receive tokens',
				description: 'PingOne returns access and ID tokens directly',
			},
		],
	},

	'pingone-mfa-v6': {
		flowType: 'pingone',
		flowName: 'PingOne MFA Flow (V6)',
		icon: '🛡️',
		steps: [
			{
				title: 'Obtain worker token for MFA management',
				description:
					'Get a management API token using client credentials to register devices and manage MFA challenges',
			},
			{
				title: 'Configure user information and MFA method',
				description:
					'Set up user details (username, phone, email) and select MFA method (SMS, Email, TOTP, Push)',
			},
			{
				title: 'Register MFA device with PingOne',
				description:
					'Create a device record in PingOne for the selected MFA method using the management API',
			},
			{
				title: 'Initiate MFA challenge',
				description:
					'Send an MFA challenge to the registered device (SMS code, email code, push notification)',
			},
			{
				title: 'User completes MFA verification',
				description:
					'User receives and enters the verification code or approves the push notification',
			},
			{
				title: 'Exchange authorization code for MFA-enhanced tokens',
				description:
					'Exchange the MFA-verified authorization code for access tokens that include MFA context',
			},
			{
				title: 'Review MFA flow results and API interactions',
				description:
					'Examine the complete API flow and MFA-enhanced tokens with verification context',
			},
		],
	},

	'oauth2-resource-owner-password-v6': {
		flowType: 'oauth',
		flowName: 'OAuth 2.0 Resource Owner Password Flow (V6)',
		icon: '🔒',
		steps: [
			{
				title: 'User enters credentials in your application',
				description: 'User provides username and password directly in your application interface',
			},
			{
				title: 'Send token request with user credentials',
				description:
					"Your application sends the user's credentials directly to PingOne's token endpoint with grant_type=password",
			},
			{
				title: 'PingOne validates credentials and returns tokens',
				description:
					'PingOne authenticates the user and returns access token and refresh token (not recommended for production)',
			},
			{
				title: 'Use access token for API calls',
				description:
					'Use the access token to make authenticated calls to protected resources on behalf of the user',
			},
		],
	},

	'oauth-ropc-v7': {
		flowType: 'oauth',
		flowName: 'OAuth Resource Owner Password Credentials (V7)',
		icon: '🔒',
		steps: [
			{
				title: 'User enters credentials in your application',
				description:
					'User provides username and password directly in your application interface with enhanced V7 UI',
			},
			{
				title: 'Send token request with user credentials',
				description:
					"Your application sends the user's credentials directly to PingOne's token endpoint with grant_type=password",
			},
			{
				title: 'PingOne validates credentials and returns tokens',
				description:
					'PingOne authenticates the user and returns access token and refresh token (not recommended for production)',
			},
			{
				title: 'Use access token for API calls',
				description:
					'Use the access token to make authenticated calls to protected resources on behalf of the user',
			},
			{
				title: 'Enhanced error handling and user feedback',
				description:
					'V7 implementation provides better error handling, visual feedback, and educational content about ROPC security concerns',
			},
		],
	},

	'oauth-authorization-code-v6': {
		flowType: 'oauth',
		flowName: 'OAuth 2.0 Authorization Code Flow (V6)',
		icon: '🌐',
		steps: [
			{
				title: 'User clicks login to start the flow',
				description:
					'User initiates authentication by clicking the login button in your application',
			},
			{
				title: 'App redirects to PingOne with an authorization request',
				description:
					"Your application redirects the user to PingOne's authorization server with the required parameters including PKCE",
			},
			{
				title: 'User authenticates and approves scopes',
				description: 'User logs in and grants permission for the requested scopes',
			},
			{
				title: 'PingOne returns an authorization code to the redirect URI',
				description: 'PingOne redirects back to your application with an authorization code',
			},
			{
				title: 'Backend exchanges the code for tokens securely',
				description:
					'Your backend exchanges the authorization code for access and refresh tokens using PKCE verification',
			},
		],
	},

	'client-credentials-v6': {
		flowType: 'oauth',
		flowName: 'Client Credentials Flow (V6)',
		icon: '🔑',
		steps: [
			{
				title: 'Configure client credentials',
				description: 'Set up client ID and client secret for your application',
			},
			{
				title: 'Send token request to PingOne',
				description: "Make a POST request to PingOne's token endpoint with client credentials",
			},
			{
				title: 'Receive access token',
				description: 'PingOne returns an access token for server-to-server authentication',
			},
			{
				title: 'Use token for API calls',
				description: 'Use the access token to make authenticated calls to protected resources',
			},
		],
	},

	'pingone-par-v6': {
		flowType: 'pingone',
		flowName: 'PingOne PAR Flow (V6)',
		icon: '📤',
		steps: [
			{
				title: 'Create pushed authorization request',
				description: 'Build the authorization request parameters with enhanced security',
			},
			{
				title: 'Push request to PingOne PAR endpoint',
				description:
					"Send the authorization request to PingOne's PAR endpoint with client authentication",
			},
			{
				title: 'Receive request URI',
				description: 'PingOne returns a request URI for the authorization request',
			},
			{
				title: 'Redirect user to authorization endpoint',
				description: 'Redirect user to PingOne with the request URI instead of parameters',
			},
			{
				title: 'Complete authorization flow',
				description: 'User authenticates and returns authorization code for token exchange',
			},
		],
	},

	'rar-v6': {
		flowType: 'oidc',
		flowName: 'Rich Authorization Requests (RAR) Flow (V6)',
		icon: '📋',
		steps: [
			{
				title: 'Define rich authorization details',
				description:
					'Create detailed authorization request with specific resource access requirements',
			},
			{
				title: 'Send authorization request with RAR',
				description: 'Include authorization_details parameter in the authorization request',
			},
			{
				title: 'User reviews and approves detailed permissions',
				description: 'User sees granular permission requests and approves specific access',
			},
			{
				title: 'Receive authorization code',
				description: 'PingOne returns authorization code with approved authorization details',
			},
			{
				title: 'Exchange code for tokens with RAR context',
				description:
					'Tokens include the approved authorization details for fine-grained access control',
			},
		],
	},
	'rar-v7': {
		flowType: 'oauth',
		flowName: 'RAR Flow (V7) - Rich Authorization Requests',
		icon: '🎯',
		steps: [
			{
				title: 'RAR Overview and Configuration',
				description:
					'Learn about Rich Authorization Requests (RFC 9396) and configure RAR parameters',
			},
			{
				title: 'Set up RAR credentials',
				description:
					'Configure environment, client credentials, and RAR-specific authorization details',
			},
			{
				title: 'Generate RAR authorization URL',
				description:
					'Create authorization request with structured RAR JSON in authorization_details parameter',
			},
			{
				title: 'Token exchange with RAR context',
				description:
					'Exchange authorization code for tokens, maintaining RAR authorization context',
			},
			{
				title: 'Flow completion and review',
				description: 'Review RAR implementation and understand fine-grained authorization benefits',
			},
		],
	},

	'worker-token-v6': {
		flowType: 'pingone',
		flowName: 'PingOne Worker Token Flow (V6)',
		icon: '🔧',
		steps: [
			{
				title: 'Configure PingOne worker application credentials',
				description:
					'Set up environment ID, client ID, and client secret for PingOne worker application',
			},
			{
				title: 'Request worker token with required scopes',
				description:
					"Send a client credentials request to PingOne's token endpoint with management scopes",
			},
			{
				title: 'Receive management access token',
				description: 'PingOne returns an access token for administrative and management operations',
			},
			{
				title: 'Use token for PingOne API calls',
				description: 'Use the access token to make authenticated calls to PingOne management APIs',
			},
		],
	},

	'redirectless-v6-real': {
		flowType: 'pingone',
		flowName: 'PingOne Redirectless Flow V6 (response_mode=pi.flow)',
		icon: '⚡',
		steps: [
			{
				title: 'Learn about response_mode=pi.flow',
				description:
					'Understand how PingOne redirectless authentication enables API-driven flows without browser redirects',
			},
			{
				title: 'Configure PingOne application for redirectless flow',
				description:
					'Set up your PingOne application with proper redirect URIs and response_mode=pi.flow support',
			},
			{
				title: 'Initiate authorization request with pi.flow',
				description: 'Send authorization request to PingOne with response_mode=pi.flow parameter',
			},
			{
				title: 'Handle API-driven authentication',
				description: 'Process authentication through direct API calls instead of browser redirects',
			},
			{
				title: 'Receive tokens directly from API response',
				description:
					'Get access tokens and ID tokens directly from the API response without redirect handling',
			},
		],
	},

	'device-authorization-v6': {
		flowType: 'oauth',
		flowName: 'OAuth 2.0 Device Authorization Flow (V6)',
		icon: '📱',
		steps: [
			{
				title: 'Request device code from PingOne',
				description:
					'Your application requests a device code and user code from PingOne for input-constrained devices',
			},
			{
				title: 'Display user code to user',
				description: 'Show the user code and verification URL to the user on their device screen',
			},
			{
				title: 'User visits verification URL on another device',
				description:
					'User goes to the verification URL on a device with a browser (phone, computer)',
			},
			{
				title: 'User authenticates and approves',
				description: 'User logs in and grants permission for the application using the user code',
			},
			{
				title: 'Poll for tokens',
				description: "Your application polls PingOne's token endpoint until tokens are available",
			},
			{
				title: 'Receive access and refresh tokens',
				description: 'PingOne returns access and refresh tokens for the authenticated user',
			},
		],
	},

	'oidc-device-authorization-v6': {
		flowType: 'oidc',
		flowName: 'OIDC Device Authorization Flow (V6)',
		icon: '📱',
		steps: [
			{
				title: 'Request device code from PingOne',
				description:
					'Your application requests a device code and user code from PingOne with OIDC scopes',
			},
			{
				title: 'Display user code to user',
				description: 'Show the user code and verification URL to the user on their device screen',
			},
			{
				title: 'User visits verification URL on another device',
				description:
					'User goes to the verification URL on a device with a browser (phone, computer)',
			},
			{
				title: 'User authenticates and approves OIDC scopes',
				description:
					'User logs in and grants permission for identity information (openid, profile, email)',
			},
			{
				title: 'Poll for tokens',
				description: "Your application polls PingOne's token endpoint until tokens are available",
			},
			{
				title: 'Receive access, ID, and refresh tokens',
				description: 'PingOne returns access token, ID token with user identity, and refresh token',
			},
		],
	},

	'oauth-implicit-v6': {
		flowType: 'oauth',
		flowName: 'OAuth 2.0 Implicit Flow (V6)',
		icon: '⚡',
		steps: [
			{
				title: 'User clicks login to start the flow',
				description:
					'User initiates authentication in your application (not recommended for production)',
			},
			{
				title: 'App redirects to PingOne with an authorization request',
				description: 'Your application redirects the user to PingOne with response_type=token',
			},
			{
				title: 'User authenticates and approves scopes',
				description: 'User logs in and grants permission for the requested scopes',
			},
			{
				title: 'PingOne returns tokens directly in URL fragment',
				description: 'PingOne redirects back with access token in the URL fragment (security risk)',
			},
		],
	},

	'oidc-implicit-v6': {
		flowType: 'oidc',
		flowName: 'OIDC Implicit Flow (V6)',
		icon: '⚡',
		steps: [
			{
				title: 'User initiates authentication',
				description:
					'User clicks login and is redirected to the OpenID Connect provider (not recommended)',
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity information',
			},
			{
				title: 'Provider returns ID token directly',
				description: 'OpenID Connect provider returns ID token in URL fragment (security risk)',
			},
			{
				title: 'Validate ID token',
				description: "Validate the ID token to ensure it's authentic and not expired",
			},
		],
	},

	'oidc-hybrid-v6': {
		flowType: 'oidc',
		flowName: 'OIDC Hybrid Flow (V6)',
		icon: '🔀',
		steps: [
			{
				title: 'User initiates authentication',
				description: 'User clicks login and is redirected to the OpenID Connect provider',
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity and access information',
			},
			{
				title: 'Provider returns authorization code and ID token',
				description: 'OpenID Connect provider returns both authorization code and ID token',
			},
			{
				title: 'Exchange code for additional tokens',
				description: 'Backend exchanges authorization code for access and refresh tokens',
			},
			{
				title: 'Validate all tokens',
				description: 'Validate ID token, access token, and refresh token',
			},
		],
	},

	// Token Management Flows
	'token-revocation': {
		flowType: 'oauth',
		flowName: 'Token Revocation Flow',
		icon: '🗑️',
		steps: [
			{
				title: 'Identify token to revoke',
				description: 'Determine which access or refresh token needs to be revoked',
			},
			{
				title: 'Send revocation request',
				description: "Send a POST request to PingOne's revocation endpoint",
			},
			{
				title: 'Confirm revocation',
				description: 'PingOne confirms the token has been revoked',
			},
		],
	},

	'token-introspection': {
		flowType: 'oauth',
		flowName: 'Token Introspection Flow',
		icon: '🔍',
		steps: [
			{
				title: 'Identify token to introspect',
				description: 'Determine which token needs to be validated',
			},
			{
				title: 'Send introspection request',
				description: "Send a POST request to PingOne's introspection endpoint",
			},
			{
				title: 'Receive token information',
				description: 'PingOne returns detailed information about the token',
			},
		],
	},

	'user-info': {
		flowType: 'oidc',
		flowName: 'User Info Flow',
		icon: '👤',
		steps: [
			{
				title: 'Obtain access token',
				description: 'Get a valid access token from an OAuth/OIDC flow',
			},
			{
				title: 'Send user info request',
				description: "Send a GET request to PingOne's userinfo endpoint",
			},
			{
				title: 'Receive user information',
				description: 'PingOne returns user profile information',
			},
		],
	},

	// OIDC Device Authorization Flow
	'oidc-device-authorization': {
		flowType: 'oidc',
		flowName: 'OIDC Device Authorization Flow',
		icon: '📱',
		steps: [
			{
				title: 'Client requests device authorization',
				description: 'Client initiates the flow by requesting device authorization from PingOne',
			},
			{
				title: 'PingOne returns device code and user code',
				description: 'PingOne provides a device code and user code for the authentication process',
			},
			{
				title: 'User visits authorization URL and enters user code',
				description: 'User navigates to the authorization URL and enters the provided user code',
			},
			{
				title: 'User authenticates and approves the request',
				description: 'User logs in and grants permission for the requested scopes',
			},
			{
				title: 'Client polls for tokens',
				description: 'Client polls the token endpoint until authentication is complete',
			},
			{
				title: 'PingOne returns access and ID tokens',
				description: 'PingOne returns the requested tokens to the client',
			},
		],
	},

	// OIDC Authorization Code Flow V6
	'oidc-authorization-code-v6': {
		flowType: 'oidc',
		flowName: 'OIDC Authorization Code Flow (V6)',
		icon: '🔐',
		steps: [
			{
				title: 'User clicks login to start the OIDC flow',
				description:
					'User initiates authentication by clicking the login button in your application',
			},
			{
				title: 'App redirects to PingOne with OIDC authorization request',
				description:
					"Your application redirects the user to PingOne's authorization server with openid scope and required parameters",
			},
			{
				title: 'User authenticates and approves scopes',
				description:
					'User logs in and grants permission for the requested OIDC scopes (openid, profile, email)',
			},
			{
				title: 'PingOne returns an authorization code to the redirect URI',
				description: 'PingOne redirects back to your application with an authorization code',
			},
			{
				title: 'Backend exchanges the code for access and ID tokens',
				description:
					'Your backend exchanges the authorization code for access token and ID token containing user identity claims',
			},
			{
				title: 'Validate ID token and extract user information',
				description:
					'Validate the ID token signature and extract user identity information from the claims',
			},
			{
				title: 'Use access token for API calls',
				description: 'Use the access token to make authenticated API calls to protected resources',
			},
		],
	},
};

// Service helpers for generating flow walkthrough configurations
const getWalkthroughConfig = (flowId: string): FlowWalkthroughConfig | null =>
	FLOW_WALKTHROUGH_CONFIGS[flowId] ?? null;

const getWalkthroughConfigsByType = (
	flowType: 'oauth' | 'oidc' | 'pingone'
): FlowWalkthroughConfig[] =>
	Object.values(FLOW_WALKTHROUGH_CONFIGS).filter((config) => config.flowType === flowType);

const getAllFlowIds = (): string[] => Object.keys(FLOW_WALKTHROUGH_CONFIGS);

const hasWalkthrough = (flowId: string): boolean => flowId in FLOW_WALKTHROUGH_CONFIGS;

const createCustomWalkthrough = (
	flowType: 'oauth' | 'oidc' | 'pingone',
	flowName: string,
	steps: FlowWalkthroughStep[],
	icon?: string
): FlowWalkthroughConfig => ({
	flowType,
	flowName,
	steps,
	icon,
});

export {
	getWalkthroughConfig,
	getWalkthroughConfigsByType,
	getAllFlowIds,
	hasWalkthrough,
	createCustomWalkthrough,
};

export const FlowWalkthroughService = {
	getWalkthroughConfig,
	getWalkthroughConfigsByType,
	getAllFlowIds,
	hasWalkthrough,
	createCustomWalkthrough,
};

export default FlowWalkthroughService;
