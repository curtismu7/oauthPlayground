// src/pages/flows/config/PingOnePARFlow.config.ts
// PAR (Pushed Authorization Request) Flow Configuration
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import { FlowStateService } from '../../../services/flowStateService';

// Flow configuration
export const FLOW_TYPE = 'par';

// Step configuration with 1-based numbering
export const STEP_CONFIGS = [
	{ title: 'Step 1: Introduction & Setup', subtitle: 'Understand PAR and configure PingOne' },
	{ title: 'Step 2: PKCE Generation', subtitle: 'Generate secure code verifier and challenge' },
	{ title: 'Step 3: PAR Request', subtitle: 'Push authorization request to PAR endpoint' },
	{ title: 'Step 4: Authorization Request', subtitle: 'Redirect with request_uri' },
	{ title: 'Step 5: Authorization Response', subtitle: 'Receive authorization code' },
	{ title: 'Step 6: Token Exchange', subtitle: 'Exchange code for tokens' },
	{ title: 'Step 7: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 8: Flow Summary', subtitle: 'Complete PAR flow overview' },
];

// Service-generated metadata
export const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);

export type IntroSectionKey =
	| 'overview'
	| 'credentials'
	| 'results'
	| 'pkceOverview'
	| 'pkceDetails'
	| 'parOverview'
	| 'parDetails'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'authResponseOverview'
	| 'authResponseDetails'
	| 'tokenExchangeOverview'
	| 'tokenExchangeDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'flowSummary'
	| 'flowComparison'
	| 'responseMode'
	| 'parSecurity'
	| 'parBenefits';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post',
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',
	responseTypeCode: true,
	responseTypeToken: false,
	responseTypeIdToken: true, // PAR typically used with OIDC
	grantTypeAuthorizationCode: true,
	initiateLoginUri: '',
	targetLinkUri: '',
	signoffUrls: [],
	requestParameterSignatureRequirement: 'DEFAULT',
	enableJWKS: false,
	jwksMethod: 'JWKS_URL',
	jwksUrl: '',
	jwks: '',
	requirePushedAuthorizationRequest: true, // PAR is REQUIRED for this flow
	additionalRefreshTokenReplayProtection: false,
	includeX5tParameter: false,
	oidcSessionManagement: false,
	requestScopesForMultipleResources: false,
	terminateUserSessionByIdToken: false,
	corsOrigins: [],
	corsAllowAnyOrigin: false,
};

// PAR-specific educational content
export const PAR_EDUCATION = {
	overview: {
		title: 'What is PAR (Pushed Authorization Request)?',
		description: 'PAR is an enhancement to OAuth 2.0 and OpenID Connect that improves security by pushing authorization request parameters directly to the Authorization Server via a secure back-channel, instead of passing them through the user\'s browser.',
		benefits: [
			'🔒 Parameter Security: Parameters stored server-side, not visible in URLs',
			'🛡️ Request Integrity: User cannot modify authorization parameters',
			'📏 URL Length: No browser URL length limitations',
			'✅ Compatibility: Works with all OAuth/OIDC flows',
		],
	},
	howItWorks: {
		steps: [
			'Client → Authorization Server: POST /par with all authorization parameters',
			'Authorization Server → Client: Returns request_uri (opaque reference)',
			'Client → Authorization Endpoint: GET /authorize with only request_uri',
			'Authorization Server: Retrieves stored parameters and proceeds with normal flow',
		],
	},
	useCases: [
		'Production OIDC clients with sensitive scopes',
		'Mobile/native applications requiring enhanced security',
		'Complex authorization requests with many parameters',
		'Compliance requirements (financial, healthcare)',
	],
	standard: 'RFC 9126 – OAuth 2.0 Pushed Authorization Requests',
};

