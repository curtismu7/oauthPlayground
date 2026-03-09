// src/pages/flows/config/OIDCHybridFlowV7.config.ts
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import FlowStateService from '../../../services/flowStateService';

export const FLOW_TYPE = 'oidc';

export const STEP_CONFIGS = [
	{
		title: 'Step 0: Setup & Credentials',
		subtitle: 'Configure PingOne application credentials and redirect URIs',
		description:
			'Provide the PingOne environment, client details, and redirect URIs required for hybrid flow testing.',
	},
	{
		title: 'Step 1: Hybrid Variant Selection',
		subtitle: 'Choose the hybrid response type for this run',
		description:
			'Select between code + ID token, code + access token, or the complete hybrid response.',
	},
	{
		title: 'Step 2: Authorization Request',
		subtitle: 'Generate the hybrid authorization URL',
		description:
			'Build an authorization request using the selected hybrid variant and PKCE parameters.',
	},
	{
		title: 'Step 3: Authorization Response',
		subtitle: 'Process returned fragment tokens and authorization code',
		description:
			'Capture immediate tokens from the URL fragment and validate the hybrid response content.',
	},
	{
		title: 'Step 4: Code Exchange & Token Validation',
		subtitle: 'Exchange the authorization code and inspect tokens',
		description:
			'Perform the back-channel token exchange, merge tokens, and run token validation helpers.',
	},
	{
		title: 'Step 5: Flow Completion',
		subtitle: 'Review results and next steps',
		description: 'Summarize the hybrid run, explore next steps, and launch token tooling.',
	},
];

export const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);
export const INTRO_SECTION_KEYS = FlowStateService.createIntroSectionKeys(FLOW_TYPE);

export type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'configuration'
	| 'responseType'
	| 'authorizationUrl'
	| 'authRequest'
	| 'response'
	| 'exchange'
	| 'tokens'
	| 'tokenManagement'
	| 'flowSummary'
	| 'securityOverview';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post',
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',
	responseTypeCode: true,
	responseTypeToken: true,
	responseTypeIdToken: true,
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
