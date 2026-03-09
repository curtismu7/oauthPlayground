// src/pages/flows/config/OAuthAuthzCodeFlowV7.config.ts
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import FlowStateService from '../../../services/flowStateService';

// Flow configuration
export const FLOW_TYPE = 'authorization-code';

// Step configuration with 1-based numbering
export const STEP_CONFIGS = [
	{
		title: 'Step 1: Introduction & Setup',
		subtitle: 'Understand the OAuth Authorization Code Flow',
	},
	{ title: 'Step 2: MFA Configuration', subtitle: 'Configure MFA policies and user settings' },
	{ title: 'Step 3: PKCE Generation', subtitle: 'Generate secure code verifier and challenge' },
	{ title: 'Step 4: Authorization Request', subtitle: 'Build and launch the authorization URL' },
	{
		title: 'Step 5: Authorization Response',
		subtitle: 'Receive the authorization code from PingOne',
	},
	{ title: 'Step 6: Token Exchange', subtitle: 'Exchange authorization code for access token' },
	{ title: 'Step 7: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 8: Security Features', subtitle: 'Advanced security demonstrations' },
	{ title: 'Step 9: Flow Summary', subtitle: 'Complete flow overview and next steps' },
];

// Service-generated metadata
export const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);
export const INTRO_SECTION_KEYS = FlowStateService.createIntroSectionKeys(FLOW_TYPE);

export type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'results'
	| 'pkceOverview'
	| 'pkceDetails'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'authResponseOverview'
	| 'authResponseDetails'
	| 'tokenExchangeOverview'
	| 'tokenExchangeDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'completionOverview'
	| 'completionDetails'
	| 'apiCallDisplay'
	| 'securityOverview'
	| 'securityBestPractices'
	| 'flowSummary'
	| 'flowComparison'
	| 'responseMode';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post', // Authorization Code can be confidential client
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',
	responseTypeCode: true,
	responseTypeToken: false,
	responseTypeIdToken: false, // OAuth doesn't return ID token (use OIDC for that)
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
