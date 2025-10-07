import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FiShield } from 'react-icons/fi';
import PageLayoutService from '../../services/pageLayoutService';
import FlowStepLayoutService from '../../services/flowStepLayoutService'; // V5Stepper service
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
// Removed FlowStatusManagementService - not a service we built
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import OIDCDiscoveryInput from '../../components/OIDCDiscoveryInput';
import { CredentialsInput } from '../../components/CredentialsInput';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import ResponseModeSelector from '../../components/response-modes/ResponseModeSelector';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { FlowValidationService } from '../../services/flowValidationService';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { oidcDiscoveryService, type OIDCDiscoveryDocument } from '../../services/oidcDiscoveryService';
import {
	buildAuthUrl,
	exchangeCodeForTokens,
	getUserInfo,
	introspectToken,
	refreshAccessToken,
	generateCodeChallenge,
	generateCodeVerifier,
	generateCsrfToken,
	generateRandomString,
	parseUrlParams,
} from '../../utils/oauth';

const STEP_METADATA = [
	{
		id: 'introduction',
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the Authorization Code Flow rebuild goals',
		description:
			'Welcome to the V6 rebuild. This step will surface flow context, prerequisites, and configuration guidance before you start.',
	},
	{
		id: 'pkce',
		title: 'Step 1: PKCE Parameters',
		subtitle: 'Generate secure verifier and challenge values',
		description:
			'PKCE protects Authorization Code flows against interception attacks. The dedicated services will render educational content, generation UI, and validation.',
	},
	{
		id: 'authorization-request',
		title: 'Step 2: Authorization Request',
		subtitle: 'Build and launch the PingOne authorization URL',
		description:
			'This step will orchestrate the enhanced response mode selector, authorization URL builder, and parameter deep dives.',
	},
	{
		id: 'authorization-response',
		title: 'Step 3: Authorization Response',
		subtitle: 'Process the returned authorization code and state',
		description:
			'Service placeholders ensure we can integrate secure state validation, error handling, and UI messaging.',
	},
	{
		id: 'token-exchange',
		title: 'Step 4: Token Exchange',
		subtitle: 'Exchange the authorization code for tokens',
		description:
			'Token exchange services, enhanced API displays, and ID token validation will plug into this container.',
	},
	{
		id: 'introspection',
		title: 'Step 5: Token Introspection & UserInfo',
		subtitle: 'Inspect issued tokens and retrieve user information',
		description:
			'Integrate token introspection, OIDC UserInfo, and session-aware UI inside this step layout.',
	},
	{
		id: 'security',
		title: 'Step 6: Security & Session Management',
		subtitle: 'Showcase logout, session monitoring, and advanced features',
		description:
			'Security services (session management, certificate generation, enhanced controls) will mount here.',
	},
	{
		id: 'summary',
		title: 'Step 7: Flow Summary & Next Actions',
		subtitle: 'Review flow completion, logs, and recommended follow-ups',
		description:
			'Provides flow completion summary, analytics hooks, and links to adjacent flows or documentation.',
	},
];

type StepMetadata = (typeof STEP_METADATA)[number];

interface CredentialsState {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	loginHint: string;
	issuerUrl: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	userInfoEndpoint: string;
	introspectionEndpoint: string;
}

type ResponseMode = 'query' | 'fragment' | 'form_post' | 'pi.flow';

interface AuthRequestState {
	responseMode: ResponseMode;
	state: string;
	nonce: string;
	authUrl: string;
	isGenerating: boolean;
	error: string | null;
}

interface AuthResponseState {
	code: string;
	state: string;
	error: string | null;
	isValid: boolean;
}

interface TokenState {
	accessToken: string;
	refreshToken: string;
	idToken: string;
	tokenType: string;
	expiresIn: number;
	scope: string;
	error: string | null;
	isExchanging: boolean;
}

interface IntrospectionState {
	active: boolean;
	client_id: string;
	exp: number;
	iat: number;
	iss: string;
	sub: string;
	error: string | null;
	isIntrospecting: boolean;
}

interface UserInfoState {
	sub: string;
	name: string | undefined;
	email: string | undefined;
	email_verified: boolean | undefined;
	given_name: string | undefined;
	family_name: string | undefined;
	preferred_username: string | undefined;
	error: string | null;
	isFetching: boolean;
}

interface SecurityState {
	isValidating: boolean;
	isRefreshing: boolean;
	isLoggingOut: boolean;
	validationError: string | null;
	refreshError: string | null;
	logoutError: string | null;
	sessionActive: boolean;
	lastValidation: number | null;
	nextRefresh: number | null;
}

interface PkceState {
	codeVerifier: string;
	codeChallenge: string;
	method: string;
	isGenerating: boolean;
	error: string | null;
}

const createInitialAuthRequestState = (): AuthRequestState => ({
	responseMode: 'query',
	state: generateCsrfToken(),
	nonce: generateRandomString(32),
	authUrl: '',
	isGenerating: false,
	error: null,
});

type CollapsibleSectionKey =
	| 'status'
	| 'validation'
	| 'overview'
	| 'requirements'
	| 'discovery'
	| 'credentials'
	| 'walkthrough'
	| 'pkceOverview'
	| 'pkceDetails'
	| 'pkceGeneration'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'authResponseMode'
	| 'authUrlBuilder'
	| 'authResponseOverview'
	| 'authResponseDetails'
	| 'authResponseValidation'
	| 'authResponseErrors'
	| 'authResponseCode'
	| 'tokenExchangeOverview'
	| 'tokenExchangeDetails'
	| 'tokenExchangeApi'
	| 'tokenExchangeTokens'
	| 'tokenExchangeValidation'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'introspectionApi'
	| 'introspectionResponse'
	| 'userInfoOverview'
	| 'userInfoDetails'
	| 'userInfoApi'
	| 'userInfoResponse'
	| 'securityOverview'
	| 'securityValidation'
	| 'securityRefresh'
	| 'securityLogout'
	| 'sessionMonitoring'
	| 'securityBestPractices';

type CollapsedSections = Record<CollapsibleSectionKey, boolean>;

// V6 Service Components - using FlowUIService for consistent styling
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();
const MainCard = FlowUIService.getMainCard();
const StepHeader = FlowUIService.getStepHeader('blue');
const StepHeaderLeft = FlowUIService.getStepHeaderLeft();
const StepHeaderRight = FlowUIService.getStepHeaderRight();
const VersionBadge = FlowUIService.getVersionBadge('blue');
const StepHeaderTitle = FlowUIService.getStepHeaderTitle();
const StepHeaderSubtitle = FlowUIService.getStepHeaderSubtitle();
const StepNumber = FlowUIService.getStepNumber();
const StepTotal = FlowUIService.getStepTotal();
const StepContentWrapper = FlowUIService.getStepContentWrapper();
const NavigationButton = FlowUIService.getButton();

// Create StepNavigation component
const StepNavigation = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem 2rem;
	background: #f9fafb;
	border-top: 1px solid #e5e7eb;
`;

// Flow suitability components
const FlowSuitability = FlowUIService.getFlowSuitability();
const SuitabilityCard = FlowUIService.getSuitabilityCard();

// Parameter display components
const ParameterGrid = FlowUIService.getParameterGrid();
const ParameterLabel = FlowUIService.getParameterLabel();
const ParameterValue = FlowUIService.getParameterValue();

// Generated content components
const GeneratedContentBox = FlowUIService.getGeneratedContentBox();
const GeneratedLabel = FlowUIService.getGeneratedLabel();

// Info components
const InfoBox = FlowUIService.getInfoBox();
const InfoTitle = FlowUIService.getInfoTitle();
const InfoText = FlowUIService.getInfoText();
const InfoList = FlowUIService.getInfoList();

const OAuthAuthorizationCodeFlowV6: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);

	const handleNext = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(prev => prev + 1);
		}
	}, [currentStep]);

	const handlePrev = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(prev => prev - 1);
		}
	}, [currentStep]);

	const [credentials, setCredentials] = useState<CredentialsState>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'http://localhost:3000/callback',
		scopes: 'openid profile email',
		loginHint: '',
		issuerUrl: '',
		authorizationEndpoint: '',
		tokenEndpoint: '',
		userInfoEndpoint: '',
		introspectionEndpoint: '',
	});
	const [copiedField, setCopiedField] = useState<string | null>(null);
	// Removed flowState - FlowStatusManagementService not used
	const [introCompleted, setIntroCompleted] = useState(false);
	const [pkceReady, setPkceReady] = useState(false);
	const [pkceState, setPkceState] = useState<PkceState>({ codeVerifier: '', codeChallenge: '', method: 'S256', isGenerating: false, error: null });
	const [authRequest, setAuthRequest] = useState<AuthRequestState>(createInitialAuthRequestState);
	const [callbackUrl, setCallbackUrl] = useState('');
	const [authResponse, setAuthResponse] = useState<AuthResponseState>({ code: '', state: '', error: null, isValid: false });
	const [tokenState, setTokenState] = useState<TokenState>({ accessToken: '', refreshToken: '', idToken: '', tokenType: '', expiresIn: 0, scope: '', error: null, isExchanging: false });
	const [introspectionState, setIntrospectionState] = useState<IntrospectionState>({ active: false, client_id: '', exp: 0, iat: 0, iss: '', sub: '', error: null, isIntrospecting: false });
	const [userInfoState, setUserInfoState] = useState<UserInfoState>({ sub: '', name: undefined, email: undefined, email_verified: undefined, given_name: undefined, family_name: undefined, preferred_username: undefined, error: null, isFetching: false });
	const [securityState, setSecurityState] = useState<SecurityState>({ isValidating: false, isRefreshing: false, isLoggingOut: false, validationError: null, refreshError: null, logoutError: null, sessionActive: false, lastValidation: null, nextRefresh: null });
	const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({
		status: false,
		validation: false,
		overview: false,
		requirements: false,
		discovery: false,
		credentials: false,
		walkthrough: true,
		pkceOverview: false,
		pkceDetails: true,
		pkceGeneration: false,
		authRequestOverview: false,
		authRequestDetails: true,
		authResponseMode: false,
		authUrlBuilder: false,
		authResponseOverview: false,
		authResponseDetails: true,
		authResponseValidation: false,
		authResponseErrors: false,
		authResponseCode: false,
		tokenExchangeOverview: false,
		tokenExchangeDetails: true,
		tokenExchangeApi: false,
		tokenExchangeTokens: false,
		tokenExchangeValidation: false,
		introspectionOverview: false,
		introspectionDetails: true,
		introspectionApi: false,
		introspectionResponse: false,
		userInfoOverview: false,
		userInfoDetails: true,
		userInfoApi: false,
		userInfoResponse: false,
		securityOverview: false,
		securityValidation: true,
		securityRefresh: false,
		securityLogout: false,
		sessionMonitoring: false,
		securityBestPractices: false,
	});



	const validationRequirements = useMemo(
		() => FlowValidationService.getStepRequirements(0, 'authorization-code'),
		[],
	);

	const requiredFields = useMemo(() => ['environmentId', 'clientId'], []);

	const emptyRequiredFields = useMemo(
		() =>
			new Set(
				requiredFields.filter((field) => !credentials[field as keyof CredentialsState].trim()),
			),
		[credentials, requiredFields],
	);

	const validationReady = useMemo(
		() =>
			requiredFields.every((field) =>
				credentials[field as keyof CredentialsState].trim().length > 0,
			),
		[credentials, requiredFields],
	);

	const handleCredentialChange = useCallback(
		(field: keyof CredentialsState, value: string) => {
			setCredentials((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[],
	);

	const handleCopy = useCallback(async (value: string, label: string) => {
		if (!value) {
			return;
		}
		try {
			await navigator.clipboard.writeText(value);
			setCopiedField(label);
		} catch (error) {
			console.warn('[OAuthAuthorizationCodeFlowV6] Clipboard copy failed', error);
		}
	}, []);

	useEffect(() => {
		if (!copiedField) {
			return;
		}
		const timeout = window.setTimeout(() => setCopiedField(null), 2000);
		return () => window.clearTimeout(timeout);
	}, [copiedField]);

	const handleDiscoveryComplete = useCallback((document: OIDCDiscoveryDocument) => {
		if (!document) {
			return;
		}
		const derivedEnvironmentId = oidcDiscoveryService.extractEnvironmentId(document.issuer);
		setCredentials((prev) => ({
			...prev,
			environmentId: derivedEnvironmentId ?? prev.environmentId,
			issuerUrl: document.issuer,
			authorizationEndpoint: document.authorization_endpoint,
			tokenEndpoint: document.token_endpoint,
			userInfoEndpoint: document.userinfo_endpoint ?? prev.userInfoEndpoint,
		}));
	}, []);

	const toggleSection = useCallback((key: CollapsibleSectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	}, []);

	const handleGeneratePkce = useCallback(async () => {
		setPkceState((prev) => ({ ...prev, isGenerating: true, error: null }));
		setPkceReady(false);
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			setPkceState({
				codeVerifier,
				codeChallenge,
				method: 'S256',
				isGenerating: false,
				error: null,
			});
			setPkceReady(true);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to generate PKCE parameters';
			setPkceState((prev) => ({ ...prev, isGenerating: false, error: message }));
			setPkceReady(false);
		}
	}, []);

	const handleParseCallbackUrl = useCallback((callbackUrl: string) => {
		if (!callbackUrl.trim()) {
			setAuthResponse({ code: '', state: '', error: 'Please enter a callback URL', isValid: false });
			return;
		}
		try {
			const params = parseUrlParams(callbackUrl);
			const code = params.code;
			const state = params.state;
			const error = params.error;
			if (error) {
				setAuthResponse({ code: '', state: '', error: `Authorization error: ${error}`, isValid: false });
			} else if (code && state) {
				setAuthResponse({ code, state, error: null, isValid: true });
			} else {
				setAuthResponse({ code: '', state: '', error: 'Missing code or state parameter in callback URL', isValid: false });
			}
		} catch (e) {
			setAuthResponse({ code: '', state: '', error: 'Invalid callback URL format', isValid: false });
		}
	}, []);

	const handleTokenExchange = useCallback(async () => {
		if (!authResponse.code || !pkceState.codeVerifier || !credentials.tokenEndpoint) {
			setTokenState(prev => ({ ...prev, error: 'Missing required parameters for token exchange' }));
			return;
		}
		setTokenState(prev => ({ ...prev, isExchanging: true, error: null }));
		try {
			const tokens = await exchangeCodeForTokens({
				tokenEndpoint: credentials.tokenEndpoint,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				code: authResponse.code,
				codeVerifier: pkceState.codeVerifier,
				clientSecret: credentials.clientSecret,
			});
			setTokenState({
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token || '',
				idToken: tokens.id_token || '',
				tokenType: tokens.token_type,
				expiresIn: tokens.expires_in,
				scope: tokens.scope,
				error: null,
				isExchanging: false,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Token exchange failed';
			setTokenState(prev => ({ ...prev, isExchanging: false, error: message }));
		}
	}, [authResponse.code, pkceState.codeVerifier, credentials]);

	const handleIntrospection = useCallback(async () => {
		if (!tokenState.accessToken || !credentials.introspectionEndpoint) {
			setIntrospectionState(prev => ({ ...prev, error: 'Missing access token or introspection endpoint' }));
			return;
		}
		setIntrospectionState(prev => ({ ...prev, isIntrospecting: true, error: null }));
		try {
			const response = await introspectToken(credentials.introspectionEndpoint, tokenState.accessToken, credentials.clientId, credentials.clientSecret);
			setIntrospectionState({
				active: response.active,
				client_id: response.client_id,
				exp: response.exp,
				iat: response.iat,
				iss: response.iss,
				sub: response.sub,
				error: null,
				isIntrospecting: false,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Introspection failed';
			setIntrospectionState(prev => ({ ...prev, isIntrospecting: false, error: message }));
		}
	}, [tokenState.accessToken, credentials]);

	const handleUserInfo = useCallback(async () => {
		if (!tokenState.accessToken || !credentials.userInfoEndpoint) {
			setUserInfoState(prev => ({ ...prev, error: 'Missing access token or userInfo endpoint' }));
			return;
		}
		setUserInfoState(prev => ({ ...prev, isFetching: true, error: null }));
		try {
			const userInfo = await getUserInfo(credentials.userInfoEndpoint, tokenState.accessToken);
			setUserInfoState({
				sub: userInfo.sub,
				name: userInfo.name,
				email: userInfo.email,
				email_verified: userInfo.email_verified,
				given_name: userInfo.given_name,
				family_name: userInfo.family_name,
				preferred_username: userInfo.preferred_username,
				error: null,
				isFetching: false,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'UserInfo fetch failed';
			setUserInfoState(prev => ({ ...prev, isFetching: false, error: message }));
		}
	}, [tokenState.accessToken, credentials]);

	useEffect(() => {
		if (validationReady && !introCompleted) {
			setIntroCompleted(true);
		}
	}, [introCompleted, validationReady]);

	useEffect(() => {
		if (!validationReady && introCompleted) {
			setIntroCompleted(false);
		}
	}, [introCompleted, validationReady]);
	const pageLayout = PageLayoutService.createPageLayout({
		flowType: 'oauth',
		theme: 'blue',
		maxWidth: '72rem',
		showHeader: false,
		showFooter: false,
	});

	const stepLayout = FlowStepLayoutService.createStepLayout({
		flowType: 'oauth',
		theme: 'blue',
	});

	const {
		PageContainer,
		ContentWrapper,
		MainCard,
		Spacing,
	} = pageLayout;

	const {
		StepContainer,
		StepHeader,
		StepHeaderLeft,
		VersionBadge,
		StepHeaderTitle,
		StepHeaderSubtitle,
		StepContent,
		StepNavigation,
		PrimaryButton,
		SecondaryButton,
		StepProgress,
	} = stepLayout;

	const renderStepContent = useCallback(
		(step: StepMetadata) => {
		if (step.id === 'introduction') {
			return (
				<>
					<FlowConfigurationRequirements flowType="authorization-code" variant="oauth" />
					<CollapsibleHeader
						title="Authorization Code Overview"
						subtitle="Purpose, security posture, and key benefits"
						onToggle={() => toggleSection('overview')}
						isCollapsed={collapsedSections.overview}
					>
						<InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<InfoTitle>When to Use Authorization Code</InfoTitle>
								<InfoText>
									Authorization Code Flow is perfect when you can securely store a client
									secret on a backend and need full OIDC context.
								</InfoText>
							</div>
						</InfoBox>
						<FlowSuitability>
							<SuitabilityCard $variant="success">
								<InfoTitle>Great Fit</InfoTitle>
								<ul>
									<li>Web apps with backend session storage</li>
									<li>SPAs or native apps using PKCE</li>
									<li>Hybrid flows that need refresh tokens</li>
								</ul>
							</SuitabilityCard>
							<SuitabilityCard $variant="warning">
								<InfoTitle>Consider Alternatives</InfoTitle>
								<ul>
									<li>Machine-to-machine workloads (Client Credentials)</li>
									<li>IoT or low-input devices (Device Authorization)</li>
								</ul>
							</SuitabilityCard>
							<SuitabilityCard $variant="danger">
								<InfoTitle>Avoid When</InfoTitle>
								<ul>
									<li>Secrets cannot be protected at all</li>
									<li>You just need simple backend API access</li>
								</ul>
							</SuitabilityCard>
						</FlowSuitability>

						<GeneratedContentBox style={{ marginTop: '2rem' }}>
							<GeneratedLabel>OIDC vs OAuth Comparison</GeneratedLabel>
							<ParameterGrid>
								<div>
									<ParameterLabel>OIDC (OpenID Connect)</ParameterLabel>
									<ParameterValue>Identity + Authorization</ParameterValue>
								</div>
								<div>
									<ParameterLabel>OAuth 2.0</ParameterLabel>
									<ParameterValue>Authorization Only</ParameterValue>
								</div>
								<div>
									<ParameterLabel>ID Token</ParameterLabel>
									<ParameterValue>User identity information</ParameterValue>
								</div>
								<div>
									<ParameterLabel>Access Token</ParameterLabel>
									<ParameterValue>API access permissions</ParameterValue>
								</div>
							</ParameterGrid>
						</GeneratedContentBox>
					</CollapsibleHeader>

					<CollapsibleHeader
						title="Application Configuration & Credentials"
						subtitle="Provide your PingOne configuration details"
						onToggle={() => toggleSection('credentials')}
						isCollapsed={collapsedSections.credentials}
					>
						<OIDCDiscoveryInput
							onDiscoveryComplete={(result) => {
								if (result?.success && result.document) {
									handleDiscoveryComplete(result.document);
								}
							}}
							initialIssuerUrl={credentials.issuerUrl}
						/>

						<CredentialsInput
							environmentId={credentials.environmentId}
							clientId={credentials.clientId}
							clientSecret={credentials.clientSecret}
							redirectUri={credentials.redirectUri}
							scopes={credentials.scopes}
							loginHint={credentials.loginHint}
							onEnvironmentIdChange={(value) => handleCredentialChange('environmentId', value)}
							onClientIdChange={(value) => handleCredentialChange('clientId', value)}
							onClientSecretChange={(value) => handleCredentialChange('clientSecret', value)}
							onRedirectUriChange={(value) => handleCredentialChange('redirectUri', value)}
							onScopesChange={(value) => handleCredentialChange('scopes', value)}
							onLoginHintChange={(value) => handleCredentialChange('loginHint', value)}
							onCopy={handleCopy}
							emptyRequiredFields={emptyRequiredFields}
							copiedField={copiedField}
						/>
					</CollapsibleHeader>

					<EnhancedFlowWalkthrough flowId="oauth-authorization-code" defaultCollapsed={false} />
				</>
			);
		}

			if (step.id === 'pkce') {
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<CollapsibleHeader
							title="PKCE Overview"
							subtitle="Why Proof Key for Code Exchange protects authorization flows"
							onToggle={() => toggleSection('pkceOverview')}
							isCollapsed={collapsedSections.pkceOverview}
						>
							<p>
								PKCE binds the authorization request and token exchange steps together using a one-time secret.
								It prevents intercepted authorization codes from being replayed by requiring proof that the
								same client that initiated the flow is completing it.
							</p>
							<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
								<li>Required for public clients such as SPAs and native apps.</li>
								<li>Strongly recommended for confidential clients to mitigate interception attacks.</li>
								<li>Fully supported by PingOne authorization servers.</li>
							</ul>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Code Verifier & Code Challenge"
							subtitle="Understand the two PKCE parameters and how they interact"
							onToggle={() => toggleSection('pkceDetails')}
							isCollapsed={collapsedSections.pkceDetails}
						>
							<div style={{ display: 'grid', gap: '1rem' }}>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Verifier</h4>
									<p style={{ margin: 0 }}>
										A high-entropy random string (43-128 characters) generated per authorization
										request. It must remain secret until the token exchange.
									</p>
								</section>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Challenge</h4>
									<p style={{ margin: 0 }}>
										A base64url-encoded SHA-256 hash of the verifier that is safe to transmit in the
										authorization request. PingOne verifies it against the presented verifier during token exchange.
									</p>
								</section>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Security Notes</h4>
									<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
										<li>Always regenerate PKCE parameters for each authorization attempt.</li>
										<li>Use the `S256` method for modern security requirements.</li>
										<li>Store the verifier securely until the token request is sent.</li>
									</ul>
								</section>
							</div>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Generate PKCE Parameters"
							subtitle="Produce fresh code verifier and challenge values for this flow"
							onToggle={() => toggleSection('pkceGeneration')}
							isCollapsed={collapsedSections.pkceGeneration}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
								<button
									type="button"
									onClick={handleGeneratePkce}
									disabled={pkceState.isGenerating}
									style={{
										alignSelf: 'flex-start',
										padding: '0.75rem 1.25rem',
										background: '#2563eb',
										color: '#ffffff',
										border: 'none',
										borderRadius: '0.5rem',
										cursor: pkceState.isGenerating ? 'not-allowed' : 'pointer',
									}}
								>
									{pkceState.isGenerating ? 'Generating…' : 'Generate PKCE Parameters'}
								</button>
								{pkceState.error ? (
									<p style={{ color: '#dc2626', margin: 0 }}>{pkceState.error}</p>
								) : null}
								{pkceState.codeVerifier ? (
									<div
										style={{
											display: 'grid',
											gap: '1rem',
											background: '#f1f5f9',
											border: '1px solid #d1d5db',
											borderRadius: '0.75rem',
											padding: '1.25rem',
										}}
									>
										<section>
											<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Verifier</h4>
											<pre
												style={{
													margin: 0,
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.5rem',
													wordBreak: 'break-all',
												}}
											>
												{pkceState.codeVerifier}
											</pre>
											<button
												type="button"
												onClick={() => handleCopy(pkceState.codeVerifier, 'Code Verifier')}
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem 0.75rem',
													background: '#0ea5e9',
													color: '#ffffff',
													border: 'none',
													borderRadius: '0.5rem',
													cursor: 'pointer',
												}}
											>
												Copy Verifier
											</button>
										</section>
										<section>
											<h4 style={{ margin: '0 0 0.5rem 0' }}>Code Challenge</h4>
											<pre
												style={{
													margin: 0,
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.5rem',
													wordBreak: 'break-all',
												}}
											>
												{pkceState.codeChallenge}
											</pre>
											<button
												type="button"
												onClick={() => handleCopy(pkceState.codeChallenge, 'Code Challenge')}
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem 0.75rem',
													background: '#0f766e',
													color: '#ffffff',
													border: 'none',
													borderRadius: '0.5rem',
													cursor: 'pointer',
												}}
											>
												Copy Challenge
											</button>
										</section>
									</div>
								) : null}
								{pkceReady ? (
									<p style={{ color: '#166534', margin: 0 }}>
										PKCE parameters are ready. Proceed to build your authorization request.
									</p>
								) : null}
							</div>
						</CollapsibleHeader>
					</div>
				);
			}

			if (step.id === 'authorization-response') {
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<CollapsibleHeader
							title="Authorization Response Overview"
							subtitle="Understanding what happens when PingOne redirects back to your application"
							onToggle={() => toggleSection('authResponseOverview')}
							isCollapsed={collapsedSections.authResponseOverview}
						>
							<p>
								After the user authenticates with PingOne, they are redirected back to your application with an authorization code. This code is short-lived and must be exchanged for tokens immediately.
							</p>
							<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
								<li>The redirect URL contains the authorization code and state parameter.</li>
								<li>Validate the state parameter to prevent CSRF attacks.</li>
								<li>Extract the code for the next step (token exchange).</li>
								<li>Handle any error parameters if the authorization failed.</li>
							</ul>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Authorization Code Details"
							subtitle="Technical details about the authorization code and its security properties"
							onToggle={() => toggleSection('authResponseDetails')}
							isCollapsed={collapsedSections.authResponseDetails}
						>
							<div style={{ display: 'grid', gap: '1rem' }}>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>What is an Authorization Code?</h4>
									<p style={{ margin: 0 }}>
										A short-lived token that proves the user has successfully authenticated. It's exchanged for access and refresh tokens in the next step.
									</p>
								</section>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Security Properties</h4>
									<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
										<li>One-time use only</li>
										<li>Expires quickly (typically 10 minutes)</li>
										<li>Bound to the client_id and redirect_uri</li>
										<li>Cannot be intercepted without the PKCE verifier</li>
									</ul>
								</section>
							</div>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Parse Authorization Response"
							subtitle="Extract the authorization code from the callback URL"
							onToggle={() => toggleSection('authResponseCode')}
							isCollapsed={collapsedSections.authResponseCode}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
								<label>
									<strong>Callback URL:</strong>
									<textarea
										placeholder="Paste the full callback URL from PingOne (e.g., https://localhost:3000/callback?code=...&state=...)"
										value={callbackUrl}
										onChange={(e) => setCallbackUrl(e.target.value)}
										style={{
											width: '100%',
											minHeight: '100px',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontFamily: 'monospace',
											fontSize: '0.875rem',
										}}
									/>
								</label>
								<button
									type="button"
									onClick={() => handleParseCallbackUrl(callbackUrl)}
									style={{
										alignSelf: 'flex-start',
										padding: '0.75rem 1.25rem',
										background: '#2563eb',
										color: '#ffffff',
										border: 'none',
										borderRadius: '0.5rem',
										cursor: 'pointer',
									}}
								>
									Parse Callback URL
								</button>
								{authResponse.error && (
									<p style={{ color: '#dc2626', margin: 0 }}>{authResponse.error}</p>
								)}
								{authResponse.isValid && (
									<div
										style={{
											display: 'grid',
											gap: '1rem',
											background: '#f1f5f9',
											border: '1px solid #d1d5db',
											borderRadius: '0.75rem',
											padding: '1.25rem',
										}}
									>
										<section>
											<h4 style={{ margin: '0 0 0.5rem 0' }}>Authorization Code</h4>
											<pre
												style={{
													margin: 0,
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.5rem',
													wordBreak: 'break-all',
												}}
											>
												{authResponse.code}
											</pre>
											<button
												type="button"
												onClick={() => handleCopy(authResponse.code, 'Authorization Code')}
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem 0.75rem',
													background: '#0ea5e9',
													color: '#ffffff',
													border: 'none',
													borderRadius: '0.5rem',
													cursor: 'pointer',
												}}
											>
												Copy Code
											</button>
										</section>
										<section>
											<h4 style={{ margin: '0 0 0.5rem 0' }}>State Parameter</h4>
											<pre
												style={{
													margin: 0,
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.5rem',
													wordBreak: 'break-all',
												}}
											>
												{authResponse.state}
											</pre>
											<button
												type="button"
												onClick={() => handleCopy(authResponse.state, 'State Parameter')}
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem 0.75rem',
													background: '#0f766e',
													color: '#ffffff',
													border: 'none',
													borderRadius: '0.5rem',
													cursor: 'pointer',
												}}
											>
												Copy State
											</button>
										</section>
									</div>
								)}
							</div>
						</CollapsibleHeader>
					</div>
				);
			}

			if (step.id === 'token-exchange') {
				return (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						<CollapsibleHeader
							title="Token Exchange Overview"
							subtitle="Exchanging the authorization code for tokens"
							onToggle={() => toggleSection('tokenExchangeOverview')}
							isCollapsed={collapsedSections.tokenExchangeOverview}
						>
							<p>
								After receiving the authorization code, the client exchanges it for access and refresh tokens. This is done securely with the PKCE verifier and client credentials.
							</p>
							<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
								<li>Send POST request to token endpoint</li>
								<li>Include authorization code, PKCE verifier, and client credentials</li>
								<li>Receive access token, refresh token, and ID token</li>
								<li>Validate tokens before use</li>
							</ul>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Token Exchange Details"
							subtitle="Technical details about the token exchange process"
							onToggle={() => toggleSection('tokenExchangeDetails')}
							isCollapsed={collapsedSections.tokenExchangeDetails}
						>
							<div style={{ display: 'grid', gap: '1rem' }}>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Request Parameters</h4>
									<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
										<li><strong>grant_type:</strong> authorization_code</li>
										<li><strong>client_id:</strong> Your client ID</li>
										<li><strong>code:</strong> The authorization code</li>
										<li><strong>code_verifier:</strong> PKCE verifier</li>
										<li><strong>redirect_uri:</strong> Must match the authorization request</li>
									</ul>
								</section>
								<section>
									<h4 style={{ margin: '0 0 0.5rem 0' }}>Security Features</h4>
									<ul style={{ marginLeft: '1.5rem', lineHeight: 1.6 }}>
										<li>PKCE prevents code interception attacks</li>
										<li>Client authentication ensures legitimate requests</li>
										<li>Tokens are short-lived for security</li>
										<li>Refresh tokens enable seamless re-authentication</li>
									</ul>
								</section>
							</div>
						</CollapsibleHeader>
						<CollapsibleHeader
							title="Exchange Authorization Code"
							subtitle="Send the token exchange request"
							onToggle={() => toggleSection('tokenExchangeApi')}
							isCollapsed={collapsedSections.tokenExchangeApi}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
								<button
									type="button"
									onClick={handleTokenExchange}
									disabled={tokenState.isExchanging}
									style={{
										alignSelf: 'flex-start',
										padding: '0.75rem 1.25rem',
										background: '#2563eb',
										color: '#ffffff',
										border: 'none',
										borderRadius: '0.5rem',
										cursor: tokenState.isExchanging ? 'not-allowed' : 'pointer',
									}}
								>
									{tokenState.isExchanging ? 'Exchanging…' : 'Exchange Code for Tokens'}
								</button>
								{tokenState.error && (
									<p style={{ color: '#dc2626', margin: 0 }}>{tokenState.error}</p>
								)}
								{tokenState.accessToken && (
									<div
										style={{
											display: 'grid',
											gap: '1rem',
											background: '#f1f5f9',
											border: '1px solid #d1d5db',
											borderRadius: '0.75rem',
											padding: '1.25rem',
										}}
									>
										<section>
											<h4 style={{ margin: '0 0 0.5rem 0' }}>Access Token</h4>
											<pre
												style={{
													margin: 0,
													padding: '0.75rem',
													background: '#ffffff',
													borderRadius: '0.5rem',
													wordBreak: 'break-all',
												}}
											>
												{tokenState.accessToken}
											</pre>
											<button
												type="button"
												onClick={() => handleCopy(tokenState.accessToken, 'Access Token')}
												style={{
													marginTop: '0.5rem',
													padding: '0.5rem 0.75rem',
													background: '#0ea5e9',
													color: '#ffffff',
													border: 'none',
													borderRadius: '0.5rem',
													cursor: 'pointer',
												}}
											>
												Copy Access Token
											</button>
										</section>
										{tokenState.refreshToken && (
											<section>
												<h4 style={{ margin: '0 0 0.5rem 0' }}>Refresh Token</h4>
												<pre
													style={{
														margin: 0,
														padding: '0.75rem',
														background: '#ffffff',
														borderRadius: '0.5rem',
														wordBreak: 'break-all',
													}}
												>
													{tokenState.refreshToken}
												</pre>
												<button
													type="button"
													onClick={() => handleCopy(tokenState.refreshToken, 'Refresh Token')}
													style={{
														marginTop: '0.5rem',
														padding: '0.5rem 0.75rem',
														background: '#0f766e',
														color: '#ffffff',
														border: 'none',
														borderRadius: '0.5rem',
														cursor: 'pointer',
													}}
												>
													Copy Refresh Token
												</button>
											</section>
										)}
										{tokenState.idToken && (
											<section>
												<h4 style={{ margin: '0 0 0.5rem 0' }}>ID Token</h4>
												<pre
													style={{
														margin: 0,
														padding: '0.75rem',
														background: '#ffffff',
														borderRadius: '0.5rem',
														wordBreak: 'break-all',
													}}
												>
													{tokenState.idToken}
												</pre>
												<button
													type="button"
													onClick={() => handleCopy(tokenState.idToken, 'ID Token')}
													style={{
														marginTop: '0.5rem',
														padding: '0.5rem 0.75rem',
														background: '#7c3aed',
														color: '#ffffff',
														border: 'none',
														borderRadius: '0.5rem',
														cursor: 'pointer',
													}}
												>
													Copy ID Token
												</button>
											</section>
										)}
									</div>
								)}
							</div>
						</CollapsibleHeader>
					</div>
				);
			}

			return (
				<CollapsibleHeader
					title="Service integration in progress"
					subtitle="Upcoming step services will mount here"
					defaultCollapsed={false}
				>
					<p>{step.description}</p>
				</CollapsibleHeader>
			);
		},
		[
			authResponse,
			callbackUrl,
			collapsedSections,
			copiedField,
			credentials,
			emptyRequiredFields,
			
			handleCopy,
			handleCredentialChange,
			handleDiscoveryComplete,
			handleParseCallbackUrl,
			handleTokenExchange,
			toggleSection,
			tokenState,
			validationReady,
			validationRequirements,
		],
	);


	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oauth-authorization-code-v6" />
				<FlowInfoCard flowInfo={getFlowInfo('authorization-code')!} />
				<FlowSequenceDisplay flowType="authorization-code" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>OAuth Authorization Code Flow · V6</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {STEP_METADATA.length.toString().padStart(2, '0')}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>{renderStepContent(STEP_METADATA[currentStep])}</StepContentWrapper>

					<StepNavigation>
						<NavigationButton variant="secondary" disabled={currentStep === 0} onClick={handlePrev}>
							Back
						</NavigationButton>
						<NavigationButton variant="primary" disabled={currentStep === STEP_METADATA.length - 1} onClick={handleNext}>
							Next
						</NavigationButton>
					</StepNavigation>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
}


export default OAuthAuthorizationCodeFlowV6;
