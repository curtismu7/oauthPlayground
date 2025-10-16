// src/pages/flows/config/RARFlow.config.ts
// RAR (Rich Authorization Requests) Flow Configuration
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import FlowStateService from '../../../services/flowStateService';

// Flow configuration
export const FLOW_TYPE = 'rar';

// Step configuration with 1-based numbering
export const STEP_CONFIGS = [
	{ title: 'Step 1: Introduction & Setup', subtitle: 'Understand RAR and configure PingOne' },
	{ title: 'Step 2: PKCE Generation', subtitle: 'Generate secure code verifier and challenge' },
	{ title: 'Step 3: Authorization Details', subtitle: 'Define fine-grained authorization requirements' },
	{ title: 'Step 4: PAR Request with RAR', subtitle: 'Push authorization request with authorization_details' },
	{ title: 'Step 5: Authorization Request', subtitle: 'Redirect with request_uri' },
	{ title: 'Step 6: Authorization Response', subtitle: 'Receive authorization code' },
	{ title: 'Step 7: Token Exchange', subtitle: 'Exchange code for tokens' },
	{ title: 'Step 8: Flow Summary', subtitle: 'Complete RAR flow overview' },
];

// Service-generated metadata
export const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);

export type IntroSectionKey =
	| 'overview'
	| 'credentials'
	| 'results'
	| 'pkceOverview'
	| 'pkceDetails'
	| 'rarOverview'
	| 'rarDetails'
	| 'rarExamples'
	| 'parOverview'
	| 'parDetails'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'authResponseOverview'
	| 'authResponseDetails'
	| 'tokenExchangeOverview'
	| 'tokenExchangeDetails'
	| 'flowSummary'
	| 'flowComparison'
	| 'responseMode'
	| 'rarBenefits'
	| 'rarUseCases';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post',
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',
	responseTypeCode: true,
	responseTypeToken: false,
	responseTypeIdToken: true, // RAR typically used with OIDC
	grantTypeAuthorizationCode: true,
	initiateLoginUri: '',
	targetLinkUri: '',
	signoffUrls: [],
	requestParameterSignatureRequirement: 'DEFAULT',
	enableJWKS: false,
	jwksMethod: 'JWKS_URL',
	jwksUrl: '',
	jwks: '',
	requirePushedAuthorizationRequest: true, // RAR should use PAR for security
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

// RAR-specific educational content
export const RAR_EDUCATION = {
	overview: {
		title: 'What is RAR (Rich Authorization Requests)?',
		description: 'RAR is an extension to OAuth 2.0 and OpenID Connect that enables clients to express fine-grained authorization details beyond simple scope strings using structured JSON data called authorization details.',
		keyPoint: 'While OAuth scopes convey coarse-grained permissions (e.g., "read write"), RAR lets clients describe complex, domain-specific access needs (e.g., "read account #1234 transactions between specific dates").',
	},
	benefits: [
		'🎯 Permission Granularity: Fine-grained and contextual (vs broad scopes)',
		'📊 Data Model: Structured JSON objects (vs unstructured strings)',
		'🔒 Security Context: Explicit intent and limits',
		'👥 User Consent: Clear, human-readable purpose',
		'📝 Auditing: Rich, structured data for logs and compliance',
	],
	example: {
		type: 'payment_initiation',
		description: 'Authorize a $250 payment to ABC Supplies',
		json: {
			authorization_details: [
				{
					type: 'payment_initiation',
					instructedAmount: {
						currency: 'USD',
						amount: '250.00',
					},
					creditorName: 'ABC Supplies',
					creditorAccount: {
						iban: 'US12345678901234567890',
					},
					remittanceInformation: 'Invoice #789',
				},
			],
		},
	},
	useCases: [
		'Financial transactions with specific amounts and payees',
		'Data sharing with granular permissions and constraints',
		'Healthcare records access with specific date ranges',
		'API access with transaction-level authorization',
		'Compliance scenarios requiring detailed audit trails',
	],
	standard: 'RFC 9396 – OAuth 2.0 Rich Authorization Requests',
};

