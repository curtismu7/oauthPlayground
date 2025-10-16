// src/pages/flows/config/OIDCAuthzCodeFlow.config.ts
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import FlowStateService from '../../../services/flowStateService';

// Flow configuration
export const FLOW_TYPE = 'authorization-code';

// Step configuration with 1-based numbering
export const STEP_CONFIGS = [
	{ title: 'Step 1: Introduction & Setup', subtitle: 'Understand the OIDC Authorization Code Flow' },
	{ title: 'Step 2: PKCE Generation', subtitle: 'Generate secure code verifier and challenge' },
	{ title: 'Step 3: Authorization Request', subtitle: 'Build and launch the authorization URL' },
	{ title: 'Step 4: Authorization Response', subtitle: 'Receive the authorization code from PingOne' },
	{ title: 'Step 5: Token Exchange', subtitle: 'Exchange code for ID token and access token' },
	{ title: 'Step 6: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 7: Security Features', subtitle: 'Advanced security demonstrations' },
	{ title: 'Step 8: Flow Summary', subtitle: 'Complete flow overview and next steps' },
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
	clientAuthMethod: 'client_secret_post', // OIDC Authorization Code can be confidential client
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',
	responseTypeCode: true,
	responseTypeToken: false,
	responseTypeIdToken: true, // OIDC returns ID token
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

