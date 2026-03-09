// src/pages/flows/config/OAuthAuthzCodeFlowV8.config.ts
// V8: Simplified 4-step structure for cleaner UI
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import FlowStateService from '../../../services/flowStateService';

// Flow configuration
export const FLOW_TYPE = 'authorization-code-v8';

// V8: Simplified step configuration (4 steps instead of 7)
export const STEP_CONFIGS = [
	{
		title: 'Configure App & Environment',
		subtitle: 'Set up your credentials and application settings',
	},
	{ title: 'Build Authorization Request', subtitle: 'Generate PKCE and create authorization URL' },
	{
		title: 'Sign In & Capture Code',
		subtitle: 'Authenticate with PingOne and receive authorization code',
	},
	{ title: 'Exchange for Tokens', subtitle: 'Swap authorization code for access and ID tokens' },
];

// Service-generated metadata
export const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);

export type IntroSectionKey =
	| 'overview'
	| 'credentials'
	| 'pkce'
	| 'authRequest'
	| 'authResponse'
	| 'tokenExchange'
	| 'introspection'
	| 'userInfo';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post',
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',
	responseTypeCode: true,
	responseTypeToken: false,
	responseTypeIdToken: false,
	grantTypeAuthorizationCode: true,
	initiateLoginUri: '',
	targetLinkUri: '',
	signoffUrls: [],
	requestParameterSignatureRequirement: 'DEFAULT',
	enableJWKS: false,
	jwksMethod: 'JWKS_URL',
	jwksUrl: '',
	jwks: '',
	requirePushedAuthorizationRequest: false,
	pushedAuthorizationRequestTimeout: 60,
	enableDPoP: false,
	dpopAlgorithm: 'ES256',
	additionalRefreshTokenReplayProtection: false,
	includeX5tParameter: false,
	oidcSessionManagement: false,
	requestScopesForMultipleResources: false,
	terminateUserSessionByIdToken: false,
	corsOrigins: [],
	corsAllowAnyOrigin: false,
};
