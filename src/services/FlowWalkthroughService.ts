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
				description: 'User initiates authentication by clicking the login button in your application'
			},
			{
				title: 'App redirects to PingOne with an authorization request',
				description: 'Your application redirects the user to PingOne\'s authorization server with the required parameters'
			},
			{
				title: 'User authenticates and approves scopes',
				description: 'User logs in and grants permission for the requested scopes'
			},
			{
				title: 'PingOne returns an authorization code to the redirect URI',
				description: 'PingOne redirects back to your application with an authorization code'
			},
			{
				title: 'Backend exchanges the code for tokens securely',
				description: 'Your backend exchanges the authorization code for access and refresh tokens'
			}
		]
	},

	'oauth-implicit': {
		flowType: 'oauth',
		flowName: 'Implicit Flow',
		icon: '⚡',
		steps: [
			{
				title: 'User clicks login to start the flow',
				description: 'User initiates authentication in your application'
			},
			{
				title: 'App redirects to PingOne with an authorization request',
				description: 'Your application redirects the user to PingOne with response_type=token'
			},
			{
				title: 'User authenticates and approves scopes',
				description: 'User logs in and grants permission for the requested scopes'
			},
			{
				title: 'PingOne returns tokens directly in URL fragment',
				description: 'PingOne redirects back with access token in the URL fragment (not recommended for production)'
			}
		]
	},

	'oauth-client-credentials': {
		flowType: 'oauth',
		flowName: 'Client Credentials Flow',
		icon: '🔑',
		steps: [
			{
				title: 'Configure client credentials',
				description: 'Set up client ID and client secret for your application'
			},
			{
				title: 'Send token request to PingOne',
				description: 'Make a POST request to PingOne\'s token endpoint with client credentials'
			},
			{
				title: 'Receive access token',
				description: 'PingOne returns an access token for server-to-server authentication'
			},
			{
				title: 'Use token for API calls',
				description: 'Use the access token to make authenticated calls to protected resources'
			}
		]
	},

	'oauth-device-authorization': {
		flowType: 'oauth',
		flowName: 'Device Authorization Flow',
		icon: '📱',
		steps: [
			{
				title: 'Request device code from PingOne',
				description: 'Your application requests a device code and user code from PingOne'
			},
			{
				title: 'Display user code to user',
				description: 'Show the user code and verification URL to the user on their device'
			},
			{
				title: 'User visits verification URL on another device',
				description: 'User goes to the verification URL on a device with a browser'
			},
			{
				title: 'User authenticates and approves',
				description: 'User logs in and grants permission for the application'
			},
			{
				title: 'Poll for tokens',
				description: 'Your application polls PingOne\'s token endpoint until tokens are available'
			}
		]
	},

	'oauth-resource-owner-password': {
		flowType: 'oauth',
		flowName: 'Resource Owner Password Flow',
		icon: '🔒',
		steps: [
			{
				title: 'User enters credentials',
				description: 'User provides username and password in your application'
			},
			{
				title: 'Send token request with credentials',
				description: 'Your application sends the credentials directly to PingOne\'s token endpoint'
			},
			{
				title: 'Receive access token',
				description: 'PingOne returns an access token (not recommended for production)'
			}
		]
	},

	'oauth-jwt-bearer': {
		flowType: 'oauth',
		flowName: 'JWT Bearer Token Flow',
		icon: '🔐',
		steps: [
			{
				title: 'Create JWT assertion',
				description: 'Generate a JWT assertion with client credentials and claims'
			},
			{
				title: 'Send token request with JWT',
				description: 'Send the JWT assertion to PingOne\'s token endpoint'
			},
			{
				title: 'Receive access token',
				description: 'PingOne validates the JWT and returns an access token'
			}
		]
	},

	// OpenID Connect Flows
	'oidc-authorization-code': {
		flowType: 'oidc',
		flowName: 'OpenID Connect Authorization Code Flow',
		icon: '🆔',
		steps: [
			{
				title: 'User initiates authentication',
				description: 'User clicks login and is redirected to the OpenID Connect provider'
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity and access information'
			},
			{
				title: 'Provider returns authorization code',
				description: 'OpenID Connect provider redirects back with an authorization code'
			},
			{
				title: 'Exchange code for tokens and ID token',
				description: 'Backend exchanges code for access token, refresh token, and ID token'
			},
			{
				title: 'Validate ID token and get user info',
				description: 'Validate the ID token and optionally fetch additional user information'
			}
		]
	},

	'oidc-implicit': {
		flowType: 'oidc',
		flowName: 'OpenID Connect Implicit Flow',
		icon: '⚡',
		steps: [
			{
				title: 'User initiates authentication',
				description: 'User clicks login and is redirected to the OpenID Connect provider'
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity information'
			},
			{
				title: 'Provider returns ID token directly',
				description: 'OpenID Connect provider returns ID token in URL fragment (not recommended)'
			},
			{
				title: 'Validate ID token',
				description: 'Validate the ID token to ensure it\'s authentic and not expired'
			}
		]
	},

	'oidc-hybrid': {
		flowType: 'oidc',
		flowName: 'OpenID Connect Hybrid Flow',
		icon: '🔀',
		steps: [
			{
				title: 'User initiates authentication',
				description: 'User clicks login and is redirected to the OpenID Connect provider'
			},
			{
				title: 'User authenticates and consents',
				description: 'User logs in and grants permission for identity and access information'
			},
			{
				title: 'Provider returns authorization code and ID token',
				description: 'OpenID Connect provider returns both authorization code and ID token'
			},
			{
				title: 'Exchange code for additional tokens',
				description: 'Backend exchanges authorization code for access and refresh tokens'
			},
			{
				title: 'Validate all tokens',
				description: 'Validate ID token, access token, and refresh token'
			}
		]
	},

	'oidc-ciba': {
		flowType: 'oidc',
		flowName: 'OpenID Connect CIBA Flow',
		icon: '📱',
		steps: [
			{
				title: 'Client initiates backchannel authentication',
				description: 'Your application sends an authentication request to PingOne'
			},
			{
				title: 'PingOne notifies user device',
				description: 'PingOne sends a notification to the user\'s registered device'
			},
			{
				title: 'User authenticates on device',
				description: 'User authenticates using their registered authenticator'
			},
			{
				title: 'Poll for authentication result',
				description: 'Your application polls PingOne for the authentication result'
			},
			{
				title: 'Receive tokens',
				description: 'PingOne returns access token, ID token, and refresh token'
			}
		]
	},

	// PingOne Specific Flows
	'pingone-worker-token': {
		flowType: 'pingone',
		flowName: 'PingOne Worker Token Flow',
		icon: '🔧',
		steps: [
			{
				title: 'Configure PingOne credentials',
				description: 'Set up environment ID, client ID, and client secret for PingOne'
			},
			{
				title: 'Request worker token',
				description: 'Send a request to PingOne\'s token endpoint with client credentials'
			},
			{
				title: 'Receive access token',
				description: 'PingOne returns an access token for administrative operations'
			},
			{
				title: 'Use token for API calls',
				description: 'Use the access token to make authenticated calls to PingOne APIs'
			}
		]
	},

	'pingone-par': {
		flowType: 'pingone',
		flowName: 'PingOne PAR Flow',
		icon: '📤',
		steps: [
			{
				title: 'Create pushed authorization request',
				description: 'Build the authorization request parameters'
			},
			{
				title: 'Push request to PingOne',
				description: 'Send the authorization request to PingOne\'s PAR endpoint'
			},
			{
				title: 'Receive request URI',
				description: 'PingOne returns a request URI for the authorization request'
			},
			{
				title: 'Redirect user to authorization endpoint',
				description: 'Redirect user to PingOne with the request URI'
			},
			{
				title: 'Complete authorization flow',
				description: 'User authenticates and returns authorization code'
			}
		]
	},

	'pingone-redirectless': {
		flowType: 'pingone',
		flowName: 'PingOne Redirectless Flow',
		icon: '⚡',
		steps: [
			{
				title: 'Configure redirectless flow',
				description: 'Set up PingOne environment for redirectless authentication'
			},
			{
				title: 'Initiate flow request',
				description: 'Send a request to PingOne to start the redirectless flow'
			},
			{
				title: 'Receive flow response',
				description: 'PingOne returns flow information and authentication details'
			},
			{
				title: 'Complete authentication',
				description: 'User completes authentication without browser redirects'
			},
			{
				title: 'Receive tokens',
				description: 'PingOne returns access and ID tokens directly'
			}
		]
	},

	// Token Management Flows
	'token-revocation': {
		flowType: 'oauth',
		flowName: 'Token Revocation Flow',
		icon: '🗑️',
		steps: [
			{
				title: 'Identify token to revoke',
				description: 'Determine which access or refresh token needs to be revoked'
			},
			{
				title: 'Send revocation request',
				description: 'Send a POST request to PingOne\'s revocation endpoint'
			},
			{
				title: 'Confirm revocation',
				description: 'PingOne confirms the token has been revoked'
			}
		]
	},

	'token-introspection': {
		flowType: 'oauth',
		flowName: 'Token Introspection Flow',
		icon: '🔍',
		steps: [
			{
				title: 'Identify token to introspect',
				description: 'Determine which token needs to be validated'
			},
			{
				title: 'Send introspection request',
				description: 'Send a POST request to PingOne\'s introspection endpoint'
			},
			{
				title: 'Receive token information',
				description: 'PingOne returns detailed information about the token'
			}
		]
	},

	'user-info': {
		flowType: 'oidc',
		flowName: 'User Info Flow',
		icon: '👤',
		steps: [
			{
				title: 'Obtain access token',
				description: 'Get a valid access token from an OAuth/OIDC flow'
			},
			{
				title: 'Send user info request',
				description: 'Send a GET request to PingOne\'s userinfo endpoint'
			},
			{
				title: 'Receive user information',
				description: 'PingOne returns user profile information'
			}
		]
	}
};

// Service class for generating flow walkthrough configurations
export class FlowWalkthroughService {
	/**
	 * Get walkthrough configuration for a specific flow
	 */
	static getWalkthroughConfig(flowId: string): FlowWalkthroughConfig | null {
		return FLOW_WALKTHROUGH_CONFIGS[flowId] || null;
	}

	/**
	 * Get all walkthrough configurations for a specific flow type
	 */
	static getWalkthroughConfigsByType(flowType: 'oauth' | 'oidc' | 'pingone'): FlowWalkthroughConfig[] {
		return Object.values(FLOW_WALKTHROUGH_CONFIGS).filter(config => config.flowType === flowType);
	}

	/**
	 * Get all available flow IDs
	 */
	static getAllFlowIds(): string[] {
		return Object.keys(FLOW_WALKTHROUGH_CONFIGS);
	}

	/**
	 * Check if a flow has a walkthrough configuration
	 */
	static hasWalkthrough(flowId: string): boolean {
		return flowId in FLOW_WALKTHROUGH_CONFIGS;
	}

	/**
	 * Generate custom walkthrough configuration
	 */
	static createCustomWalkthrough(
		flowType: 'oauth' | 'oidc' | 'pingone',
		flowName: string,
		steps: FlowWalkthroughStep[],
		icon?: string
	): FlowWalkthroughConfig {
		return {
			flowType,
			flowName,
			steps,
			icon
		};
	}
}

export default FlowWalkthroughService;
