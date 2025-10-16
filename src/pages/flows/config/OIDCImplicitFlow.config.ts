// src/pages/flows/config/OIDCImplicitFlow.config.ts
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';

// Flow configuration
export const FLOW_TYPE = 'implicit';

// Step configuration with 1-based numbering
export const STEP_CONFIGS = [
	{ title: 'Step 1: Introduction & Setup', subtitle: 'Understand the OIDC Implicit Flow' },
	{ title: 'Step 2: Authorization Request', subtitle: 'Build and launch the authorization URL' },
	{ title: 'Step 3: Token Response', subtitle: 'Receive ID token and access token from URL fragment' },
	{ title: 'Step 4: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 5: Security Features', subtitle: 'Advanced security demonstrations' },
	{ title: 'Step 6: Flow Summary', subtitle: 'Complete flow overview and next steps' },
];

// Service-generated metadata
export const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);
export const INTRO_SECTION_KEYS = FlowStateService.createIntroSectionKeys(FLOW_TYPE);

export type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'results'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'tokenResponseOverview'
	| 'tokenResponseDetails'
	| 'tokenResponse'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'completionOverview'
	| 'completionDetails'
	| 'apiCallDisplay'
	| 'securityOverview'
	| 'securityBestPractices'
	| 'flowSummary'
	| 'flowComparison';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'none', // Implicit flow doesn't use client authentication
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'OPTIONAL',
	responseTypeCode: false,
	responseTypeToken: true,
	responseTypeIdToken: true, // OIDC always returns ID token
	grantTypeAuthorizationCode: false,
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

// Import FlowStateService for metadata generation
import FlowStateService from '../../../services/flowStateService';

