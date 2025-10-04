// src/pages/flows/config/OAuthImplicitFlow.config.ts
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';

// Flow configuration
export const FLOW_TYPE = 'implicit';

// Step configuration
export const STEP_CONFIGS = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Implicit Flow' },
	{ title: 'Step 1: Authorization Request', subtitle: 'Build and launch the authorization URL' },
	{ title: 'Step 2: Token Response', subtitle: 'Receive tokens directly from URL fragment' },
	{ title: 'Step 3: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 4: Security Features', subtitle: 'Advanced security demonstrations' },
	{ title: 'Step 5: Flow Summary', subtitle: 'Complete flow overview and next steps' },
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
	responseTypeIdToken: false,
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
	pushedAuthorizationRequestTimeout: 60,
	additionalRefreshTokenReplayProtection: false,
	includeX5tParameter: false,
	oidcSessionManagement: false,
	requestScopesForMultipleResources: false,
	terminateUserSessionByIdToken: false,
	corsOrigins: [],
	corsAllowAnyOrigin: false,
};

// Import FlowStateService for metadata generation
import { FlowStateService } from '../../../services/flowStateService';
