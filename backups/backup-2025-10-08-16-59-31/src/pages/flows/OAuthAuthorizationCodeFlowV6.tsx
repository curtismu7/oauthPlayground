// src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx
// V6.0.0 OAuth Authorization Code Flow - Using V6 Service Architecture

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiInfo,
	FiRefreshCw,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import ComprehensiveDiscoveryInput from '../../components/ComprehensiveDiscoveryInput';
import { CredentialsInput } from '../../components/CredentialsInput';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import LoginSuccessModal from '../../components/LoginSuccessModal';
import PingOneAppConfig, {
	type PingOneConfig as PingOneAppConfigType,
} from '../../components/PingOneAppConfig';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../../components/PingOneApplicationConfig';
import ResponseModeSelector from '../../components/ResponseModeSelector';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import UserInformationStep from '../../components/UserInformationStep';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import {
	comprehensiveDiscoveryService,
	DiscoveryResult,
} from '../../services/comprehensiveDiscoveryService';
import { FlowHeader } from '../../services/flowHeaderService';
import { ResponseMode } from '../../services/responseModeService';
import { IntrospectionApiCallData } from '../../services/tokenIntrospectionService';
// Import V6 Service Architecture
import { V6FlowService } from '../../services/v6FlowService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Create all V6 components with blue theme
const { Layout, Collapsible, Info, Cards } = V6FlowService.createFlowComponents('blue');

const STEP_METADATA = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Authorization Code Flow' },
	{ title: 'Step 1: PKCE Parameters', subtitle: 'Generate secure verifier and challenge' },
	{
		title: 'Step 2: Authorization Request',
		subtitle: 'Build and launch the authorization URL',
	},
	{ title: 'Step 3: Authorization Response', subtitle: 'Process the returned authorization code' },
	{ title: 'Step 4: Token Exchange', subtitle: 'Swap the code for tokens' },
	{ title: 'Step 5: User Information', subtitle: 'Inspect ID token claims and user info' },
	{ title: 'Step 6: Token Introspection', subtitle: 'Introspect access token and review results' },
	{ title: 'Step 7: Flow Complete', subtitle: 'Review your results and next steps' },
	{ title: 'Step 8: Security Features', subtitle: 'Demonstrate advanced security implementations' },
	{ title: 'Step 9: Flow Summary', subtitle: 'Comprehensive completion overview' },
] as const;

type IntroSectionKey =
	| 'overview'
	| 'credentials'
	| 'responseMode'
	| 'results'
	| 'pkceOverview'
	| 'pkceDetails'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'authResponseOverview'
	| 'authResponseDetails'
	| 'tokenExchangeOverview'
	| 'tokenExchangeDetails'
	| 'userInfoOverview'
	| 'userInfoDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'completionOverview'
	| 'completionDetails'
	| 'flowSummary';

// Main Component
const OAuthAuthorizationCodeFlowV6: React.FC = () => {
	// Page scroll management
	usePageScroll({ pageName: 'OAuthAuthorizationCodeFlowV6', force: true });

	// Controller hook
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'oauth-authorization-code-v6',
		defaultFlowVariant: 'oauth',
		enableDebugger: true,
	});

	// State management
	const [currentStep, setCurrentStep] = useState(() => {
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step');
			return step;
		}
		return 0;
	});

	const [collapsedSections, setCollapsedSections] = useState<
		Record<IntroSectionKey | 'pingOneAppConfig' | 'pingOneAltConfig', boolean>
	>({
		overview: false,
		credentials: false,
		responseMode: false,
		results: true,
		pkceOverview: false,
		pkceDetails: false,
		authRequestOverview: false,
		authRequestDetails: false,
		authResponseOverview: false,
		authResponseDetails: false,
		tokenExchangeOverview: false,
		tokenExchangeDetails: false,
		userInfoOverview: false,
		userInfoDetails: false,
		introspectionOverview: false,
		introspectionDetails: false,
		completionOverview: false,
		completionDetails: false,
		flowSummary: false,
		pingOneAppConfig: true,
		pingOneAltConfig: true,
	});

	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [responseMode, setResponseMode] = useState<ResponseMode>('query');

	// Scroll to top when page loads or step changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [currentStep]);

	// PingOne Configuration States
	const [pingOneAppState, setPingOneAppState] = useState<PingOneApplicationState>({
		clientAuthMethod: 'client_secret_post',
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'REQUIRED',
		privateKey: '',
		keyId: '',
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
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});

	const [pingOneAppConfig, setPingOneAppConfig] = useState<PingOneAppConfigType>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/authz-callback',
		authServerId: '',
		baseUrl: 'https://auth.pingone.com',
		authUrl: '',
		authorizationEndpoint: '',
		tokenEndpoint: '',
		userInfoEndpoint: '',
		logoutEndpoint: '',
		tokenEndpointAuthMethod: 'client_secret_basic',
		allowRedirectUriPatterns: false,
		responseTypes: {
			code: true,
			token: false,
			idToken: true,
		},
		grantTypes: {
			authorizationCode: true,
			implicit: false,
			clientCredentials: false,
			deviceAuthorization: false,
			refreshToken: true,
		},
		pkceEnforcement: 'required',
		refreshTokenDuration: 30,
		refreshTokenDurationUnit: 'days',
		refreshTokenRollingDuration: 180,
		refreshTokenRollingDurationUnit: 'days',
		refreshTokenRollingGracePeriod: 0,
	});

	// Toggle section visibility
	const toggleSection = useCallback(
		(key: IntroSectionKey | 'pingOneAppConfig' | 'pingOneAltConfig') => {
			setCollapsedSections((prev) => ({
				...prev,
				[key]: !prev[key],
			}));
		},
		[]
	);

	// Handle discovery completion
	const handleDiscoveryComplete = useCallback(
		(result: DiscoveryResult) => {
			if (result.success && result.document) {
				controller.setCredentials({
					...controller.credentials,
					issuerUrl: result.issuerUrl || '',
				});
				v4ToastManager.showSuccess(`Discovered ${result.provider} endpoints`);
			}
		},
		[controller]
	);

	// Handle PingOne Application Config changes
	const handlePingOneAppStateChange = useCallback((newState: PingOneApplicationState) => {
		setPingOneAppState(newState);
		console.log('PingOne Application State updated:', newState);
	}, []);

	// Handle PingOne App Config changes
	const handlePingOneAppConfigChange = useCallback((newConfig: PingOneAppConfigType) => {
		setPingOneAppConfig(newConfig);
		console.log('PingOne App Config updated:', newConfig);
	}, []);

	// Step validation
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0:
					return true;
				case 1:
					return !!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge);
				case 2:
					return !!(controller.authUrl && controller.pkceCodes.codeVerifier);
				case 3:
					return !!controller.authCode;
				case 4:
					return !!controller.tokens.accessToken;
				case 5:
					return !!controller.userInfo;
				case 6:
					return !!introspectionApiCall;
				case 7:
					return true;
				case 8:
					return true;
				case 9:
					return true;
				default:
					return false;
			}
		},
		[controller, introspectionApiCall]
	);

	// Render step content
	const renderStepContent = useMemo(() => {
		const credentials = controller.credentials;
		const pkceCodes = controller.pkceCodes;
		const authCode = controller.authCode;
		const tokens = controller.tokens;
		const userInfo = controller.userInfo;

		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowConfigurationRequirements flowType="authorization-code" variant="oauth" />

						<Collapsible.CollapsibleSection>
							<Collapsible.CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<Collapsible.CollapsibleTitle>
									<FiInfo /> Authorization Code Overview
								</Collapsible.CollapsibleTitle>
								<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</Collapsible.CollapsibleToggleIcon>
							</Collapsible.CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<Collapsible.CollapsibleContent>
									<Info.InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<Info.InfoTitle>When to Use Authorization Code</Info.InfoTitle>
											<Info.InfoText>
												Authorization Code Flow is perfect when you can securely store a client
												secret on a backend and need OAuth 2.0 access tokens.
											</Info.InfoText>
										</div>
									</Info.InfoBox>
									<Cards.FlowSuitability>
										<Cards.SuitabilityCard $variant="success">
											<h4>Great Fit</h4>
											<ul>
												<li>Web apps with backend session storage</li>
												<li>SPAs or native apps using PKCE</li>
												<li>Hybrid flows that need refresh tokens</li>
											</ul>
										</Cards.SuitabilityCard>
										<Cards.SuitabilityCard $variant="warning">
											<h4>Consider Alternatives</h4>
											<ul>
												<li>Machine-to-machine workloads (Client Credentials)</li>
												<li>IoT or low-input devices (Device Authorization)</li>
											</ul>
										</Cards.SuitabilityCard>
										<Cards.SuitabilityCard $variant="danger">
											<h4>Avoid When</h4>
											<ul>
												<li>Secrets cannot be protected at all</li>
												<li>You just need simple backend API access</li>
											</ul>
										</Cards.SuitabilityCard>
									</Cards.FlowSuitability>

									<Cards.GeneratedContentBox style={{ marginTop: '2rem' }}>
										<Cards.GeneratedLabel>OAuth vs OIDC Authorization Code</Cards.GeneratedLabel>
										<Cards.ParameterGrid>
											<div style={{ gridColumn: '1 / -1' }}>
												<Cards.ParameterLabel>Tokens Returned</Cards.ParameterLabel>
												<Cards.ParameterValue>
													Access Token + Refresh Token (no ID Token)
												</Cards.ParameterValue>
											</div>
											<div style={{ gridColumn: '1 / -1' }}>
												<Cards.ParameterLabel>Purpose</Cards.ParameterLabel>
												<Cards.ParameterValue>Authorization (API access) only</Cards.ParameterValue>
											</div>
											<div>
												<Cards.ParameterLabel>Spec Layer</Cards.ParameterLabel>
												<Cards.ParameterValue>OAuth 2.0 / OAuth 2.1</Cards.ParameterValue>
											</div>
											<div>
												<Cards.ParameterLabel>Scope Requirement</Cards.ParameterLabel>
												<Cards.ParameterValue style={{ color: '#3b82f6', fontWeight: 'bold' }}>
													No 'openid' required
												</Cards.ParameterValue>
											</div>
											<div style={{ gridColumn: '1 / -1' }}>
												<Cards.ParameterLabel>Use Case</Cards.ParameterLabel>
												<Cards.ParameterValue>
													API access without user identity verification
												</Cards.ParameterValue>
											</div>
										</Cards.ParameterGrid>
									</Cards.GeneratedContentBox>
								</Collapsible.CollapsibleContent>
							)}
						</Collapsible.CollapsibleSection>

						<Collapsible.CollapsibleSection>
							<Collapsible.CollapsibleHeaderButton
								onClick={() => toggleSection('credentials')}
								aria-expanded={!collapsedSections.credentials}
							>
								<Collapsible.CollapsibleTitle>
									<FiSettings /> Application Configuration & Credentials
								</Collapsible.CollapsibleTitle>
								<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
									<FiChevronDown />
								</Collapsible.CollapsibleToggleIcon>
							</Collapsible.CollapsibleHeaderButton>
							{!collapsedSections.credentials && (
								<Collapsible.CollapsibleContent>
									{/* Comprehensive Discovery Input */}
									<ComprehensiveDiscoveryInput
										onDiscoveryComplete={handleDiscoveryComplete}
										initialInput={credentials.issuerUrl || credentials.environmentId || ''}
										placeholder="Enter Environment ID, issuer URL, or provider..."
										showProviderInfo={true}
									/>

									{/* Credentials Input */}
									<CredentialsInput
										environmentId={credentials.environmentId || ''}
										clientId={credentials.clientId || ''}
										clientSecret={credentials.clientSecret || ''}
										scopes={credentials.scope || 'openid profile email'}
										postLogoutRedirectUri={
											credentials.postLogoutRedirectUri || 'https://localhost:3000/logout-callback'
										}
										onEnvironmentIdChange={(newEnvId) => {
											controller.setCredentials({
												...credentials,
												environmentId: newEnvId,
											});
										}}
										onClientIdChange={(newClientId) => {
											controller.setCredentials({
												...credentials,
												clientId: newClientId,
											});
										}}
										onClientSecretChange={(newSecret) => {
											controller.setCredentials({
												...credentials,
												clientSecret: newSecret,
											});
										}}
										onScopesChange={(newScopes) => {
											controller.setCredentials({
												...credentials,
												scope: newScopes,
											});
										}}
										onPostLogoutRedirectUriChange={(newUri) => {
											controller.setCredentials({
												...credentials,
												postLogoutRedirectUri: newUri,
											});
										}}
										isSaving={controller.isSavingCredentials}
										requireClientSecret={true}
										showLoginHint={true}
										showPostLogoutRedirectUri={true}
										onLoginHintChange={(loginHint) => {
											controller.setCredentials({
												...credentials,
												loginHint,
											});
										}}
										loginHint={credentials.loginHint || ''}
										onDiscoveryComplete={handleDiscoveryComplete}
									/>
								</Collapsible.CollapsibleContent>
							)}
						</Collapsible.CollapsibleSection>

						{/* Enhanced Flow Walkthrough */}
						<EnhancedFlowWalkthrough flowId="oauth-authorization-code" />

						{/* PingOne Application Configuration (Recommended) */}
						<Collapsible.CollapsibleSection>
							<Collapsible.CollapsibleHeaderButton
								onClick={() => toggleSection('pingOneAppConfig')}
							>
								<Collapsible.CollapsibleTitle>
									<FiSettings />
									PingOne Application Configuration (Recommended)
								</Collapsible.CollapsibleTitle>
								<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.pingOneAppConfig}>
									<FiChevronDown />
								</Collapsible.CollapsibleToggleIcon>
							</Collapsible.CollapsibleHeaderButton>
							{!collapsedSections.pingOneAppConfig && (
								<Collapsible.CollapsibleContent>
									<PingOneApplicationConfig
										value={pingOneAppState}
										onChange={handlePingOneAppStateChange}
									/>
								</Collapsible.CollapsibleContent>
							)}
						</Collapsible.CollapsibleSection>

						{/* PingOne App Configuration (Alternative) */}
						<Collapsible.CollapsibleSection>
							<Collapsible.CollapsibleHeaderButton
								onClick={() => toggleSection('pingOneAltConfig')}
							>
								<Collapsible.CollapsibleTitle>
									<FiSettings />
									PingOne App Configuration (Alternative)
								</Collapsible.CollapsibleTitle>
								<Collapsible.CollapsibleToggleIcon $collapsed={collapsedSections.pingOneAltConfig}>
									<FiChevronDown />
								</Collapsible.CollapsibleToggleIcon>
							</Collapsible.CollapsibleHeaderButton>
							{!collapsedSections.pingOneAltConfig && (
								<Collapsible.CollapsibleContent>
									<PingOneAppConfig
										onConfigChange={handlePingOneAppConfigChange}
										initialConfig={pingOneAppConfig}
										storageKey="pingone-v6-config"
									/>
								</Collapsible.CollapsibleContent>
							)}
						</Collapsible.CollapsibleSection>
					</>
				);

			case 1:
				return (
					<>
						<Info.InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<Info.InfoTitle>PKCE Protection</Info.InfoTitle>
								<Info.InfoText>
									PKCE (Proof Key for Code Exchange) protects against authorization code
									interception attacks.
								</Info.InfoText>
							</div>
						</Info.InfoBox>
						{/* TODO: Add PKCE generation UI */}
					</>
				);

			// TODO: Add remaining steps
			default:
				return (
					<Info.InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<Info.InfoTitle>Step {currentStep} - In Development</Info.InfoTitle>
							<Info.InfoText>
								This step is being developed using V6 service architecture.
							</Info.InfoText>
						</div>
					</Info.InfoBox>
				);
		}
	}, [
		currentStep,
		controller,
		collapsedSections,
		toggleSection,
		handleDiscoveryComplete,
		Cards,
		Info,
		Collapsible,
	]);

	return (
		<Layout.Container>
			<FlowHeader
				flowId="oauth-authorization-code"
				title="OAuth 2.0 Authorization Code Flow"
				subtitle="V6 with Comprehensive Discovery Service"
				icon={<FiShield />}
			/>
			<Layout.ContentWrapper>
				<Layout.MainCard>
					<Layout.StepHeader>
						<Layout.StepHeaderLeft>
							<Layout.VersionBadge>V6.0 - Service Architecture</Layout.VersionBadge>
							<Layout.StepHeaderTitle>{STEP_METADATA[currentStep].title}</Layout.StepHeaderTitle>
							<Layout.StepHeaderSubtitle>
								{STEP_METADATA[currentStep].subtitle}
							</Layout.StepHeaderSubtitle>
						</Layout.StepHeaderLeft>
						<Layout.StepHeaderRight>
							<Layout.StepNumber>{currentStep}</Layout.StepNumber>
							<Layout.StepTotal>of {STEP_METADATA.length - 1}</Layout.StepTotal>
						</Layout.StepHeaderRight>
					</Layout.StepHeader>

					<Layout.StepContentWrapper>{renderStepContent}</Layout.StepContentWrapper>
				</Layout.MainCard>
			</Layout.ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onNext={() => setCurrentStep((prev) => Math.min(prev + 1, STEP_METADATA.length - 1))}
				onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
				onGoToStep={(step) => setCurrentStep(step)}
				isStepValid={isStepValid}
				getStepRequirements={() => []}
			/>

			{showLoginModal && (
				<LoginSuccessModal
					onClose={() => setShowLoginModal(false)}
					onContinue={() => {
						setShowLoginModal(false);
						setCurrentStep(4);
					}}
				/>
			)}
		</Layout.Container>
	);
};

export default OAuthAuthorizationCodeFlowV6;
