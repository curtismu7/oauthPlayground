// src/pages/flows/config/RedirectlessFlow.config.ts
// PingOne Redirectless Flow (pi.flow) Configuration
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import FlowStateService from '../../../services/flowStateService';
import { V9_COLORS } from '../../../services/v9/V9ColorStandards';

// Flow configuration
export const FLOW_TYPE = 'redirectless';

// Step configuration with 1-based numbering
export const STEP_CONFIGS = [
	{ title: 'Step 1: Introduction & Setup', subtitle: 'Understand Redirectless Flow (pi.flow)' },
	{ title: 'Step 2: PKCE Generation', subtitle: 'Generate secure code verifier and challenge' },
	{
		title: 'Step 3: Authorization Request',
		subtitle: 'POST to /authorize with response_mode=pi.flow',
	},
	{
		title: 'Step 4: Token Response & Management',
		subtitle: 'Handle flow interaction and received tokens',
	},
	{ title: 'Step 5: Flow Complete', subtitle: 'Summary and next steps for redirectless flow' },
];

// Service-generated metadata
export const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);

export type IntroSectionKey =
	| 'overview'
	| 'credentials'
	| 'results'
	| 'pkceOverview'
	| 'pkceDetails'
	| 'piFlowOverview'
	| 'piFlowDetails'
	| 'piFlowBenefits'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'flowInteractionOverview'
	| 'flowInteractionDetails'
	| 'tokenResponseOverview'
	| 'tokenResponseDetails'
	| 'flowSummary'
	| 'flowComparison'
	| 'responseMode'
	| 'piFlowUseCases';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post',
	allowRedirectUriPatterns: false, // No redirect with pi.flow
	pkceEnforcement: 'REQUIRED',
	responseTypeCode: true,
	responseTypeToken: false,
	responseTypeIdToken: true, // Redirectless typically used with OIDC
	grantTypeAuthorizationCode: true,
	initiateLoginUri: '',
	targetLinkUri: '',
	signoffUrls: [],
	requestParameterSignatureRequirement: 'DEFAULT',
	enableJWKS: false,
	jwksMethod: 'JWKS_URL',
	jwksUrl: '',
	jwks: '',
	requirePushedAuthorizationRequest: false, // pi.flow doesn't require PAR
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

// PingOne pi.flow educational content
export const PIFLOW_EDUCATION = {
	overview: {
		title: 'What is response_mode=pi.flow (Redirectless Flow)?',
		description:
			'response_mode=pi.flow is a PingOne-specific response mode that enables redirectless authorization flows. Instead of browser redirects, the client app interacts directly via API - ideal for embedded, mobile, or desktop experiences.',
		keyPoint:
			'This is a PingOne proprietary extension to OAuth 2.0/OIDC, not part of the standard specifications.',
	},
	howItWorks: {
		steps: [
			'App → PingOne: POST /authorize with response_mode=pi.flow',
			'PingOne → App: Returns flow object (id, status, next steps)',
			'App → PingOne Flow API: Handle login steps (username/password, MFA, consent)',
			'PingOne → App: Tokens returned directly via API (no browser redirect)',
		],
	},
	benefits: [
		'🚫 Redirectless: Works entirely via API, no browser navigation',
		'🎨 Seamless UX: Embeds PingOne authentication in your app',
		'🔒 Security: Avoids front-channel redirects and URL leakage',
		'🎮 Developer Control: Flexible handling of auth steps',
		'🔗 Integration: Works with PingOne Flow API and DaVinci policies',
	],
	useCases: [
		'Native mobile apps needing embedded login',
		'Desktop applications without browser context',
		'Thick clients with custom authentication UI',
		'SDK-driven flows with identity-first experiences',
		'Embedded login widgets in web applications',
	],
	limitations: [
		'⚠️ PingOne-specific (not OAuth 2.0 or OIDC standard)',
		'⚠️ Must be enabled in PingOne environment',
		'⚠️ Requires PingOne Flow API or Auth API integration',
		'⚠️ Token format depends on Flow configuration',
	],
	standard: 'PingOne Proprietary Extension (not standardized)',
	references: [
		'PingOne Authentication API Docs',
		'PingOne Flow API Overview',
		'PingOne Redirectless Authentication (pi.flow)',
	],
};
