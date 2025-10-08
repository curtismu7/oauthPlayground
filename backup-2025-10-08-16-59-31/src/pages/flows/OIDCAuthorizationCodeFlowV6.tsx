// src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiUser,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { CredentialsInput } from '../../components/CredentialsInput';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import LoginSuccessModal from '../../components/LoginSuccessModal';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../../components/PingOneApplicationConfig';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import TokenIntrospect from '../../components/TokenIntrospect';
import JWTTokenDisplay from '../../components/JWTTokenDisplay';
import { CodeExamplesDisplay } from '../../components/CodeExamplesDisplay';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import {
	EnhancedApiCallDisplayService,
	EnhancedApiCallData,
} from '../../services/enhancedApiCallDisplayService';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import {
	TokenIntrospectionService,
	IntrospectionApiCallData,
} from '../../services/tokenIntrospectionService';
import EnvironmentIdInput from '../../components/EnvironmentIdInput';
import { decodeJWTHeader } from '../../utils/jwks';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { usePageScroll } from '../../hooks/usePageScroll';
import ResponseModeSelector from '../../components/ResponseModeSelector';
import { ResponseMode } from '../../services/responseModeService';
import {
	FlowUIService,
	CollapsibleSection,
	InfoBox,
	ParameterGrid,
	ActionRow,
	Button,
	ResultsSection as FlowResultsSection,
} from '../../services/flowUIService';

// V6 Services
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import PKCEService from '../../services/pkceService';
import { CopyButtonService } from '../../services/copyButtonService';

// Simple Step Header Component
const StepHeader = styled.div`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	padding: 1.5rem;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const StepTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	color: #ffffff;
	margin: 0 0 0.5rem 0;
`;

const StepSubtitle = styled.p`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0;
`;

const STEP_METADATA = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the OIDC Authorization Code Flow' },
	{ title: 'Step 1: PKCE Parameters', subtitle: 'Generate secure verifier and challenge' },
	{
		title: 'Step 2: Authorization Request',
		subtitle: 'Build and launch the PingOne authorization URL',
	},
	{ title: 'Step 3: Authorization Response', subtitle: 'Process the returned authorization code' },
	{ title: 'Step 4: Token Exchange', subtitle: 'Swap the code for tokens using PingOne APIs' },
	{ title: 'Step 5: User Info', subtitle: 'Retrieve user information with access token' },
	{ title: 'Step 6: Token Introspection', subtitle: 'Introspect access token and review results' },
	{ title: 'Step 7: Flow Complete', subtitle: 'Review your results and next steps' },
	{ title: 'Step 8: Security Features', subtitle: 'Demonstrate advanced security implementations' },
	{ title: 'Step 9: Flow Summary', subtitle: 'Comprehensive completion overview' },
] as const;

type StepCompletionState = Record<number, boolean>;

const OIDCAuthorizationCodeFlowV6: React.FC = () => {
	// Ensure page starts at top
	usePageScroll({ pageName: 'OIDCAuthorizationCodeFlowV6', force: true });

	console.log('🚀 [OIDCAuthorizationCodeFlowV6] Component loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	const manualAuthCodeId = useId();
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'oidc-authorization-code-v6',
		defaultFlowVariant: 'oidc',
		enableDebugger: true,
	});

	// State management
	const [currentStep, setCurrentStep] = useState(() => {
		// First check for restore_step (from token management)
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step');
			return step;
		}
		return 0;
	});

	const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [localAuthCode, setLocalAuthCode] = useState<string>('');
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/authz-callback',
		scopes: ['openid', 'profile', 'email'],
		responseType: 'code',
		responseMode: 'query',
		acrValues: '',
		maxAge: '',
		prompt: '',
		loginHint: '',
		uiLocales: '',
		idTokenHint: '',
		loginHintToken: '',
		acr: '',
		claimsLocales: '',
		claims: '',
		request: '',
		requestUri: '',
		registration: '',
		requestObject: '',
		requestObjectEncryptionAlg: '',
		requestObjectEncryptionEnc: '',
		requestObjectSigningAlg: '',
		requestObjectSigningEnc: '',
		requestUriEncryptionAlg: '',
		requestUriEncryptionEnc: '',
		requestUriSigningAlg: '',
		requestUriSigningEnc: '',
	});

	// Load PingOne configuration from sessionStorage on mount
	useEffect(() => {
		const stored = sessionStorage.getItem('oidc-authorization-code-v6-app-config');
		if (stored) {
			try {
				const config = JSON.parse(stored);
				setPingOneConfig(config);
				const updatedCredentials = {
					environmentId: config.environmentId || '',
					clientId: config.clientId || '',
					clientSecret: config.clientSecret || '',
					redirectUri: config.redirectUri || 'https://localhost:3000/authz-callback',
					scope: config.scopes?.join(' ') || 'openid profile email',
					responseType: config.responseType || 'code',
					grantType: 'authorization_code',
					clientAuthMethod: 'client_secret_post',
				};
				controller.setCredentials(updatedCredentials);
			} catch (error) {
				console.warn('[OIDCAuthorizationCodeFlowV6] Failed to parse stored PingOne config:', error);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Debug: Always log the current authorization code state
	console.log('🔍 [OIDCAuthorizationCodeFlowV6] Current controller.authCode:', {
		hasAuthCode: !!controller.authCode,
		authCodeLength: controller.authCode?.length || 0,
		authCodePreview: controller.authCode ? `${controller.authCode.substring(0, 10)}...` : 'Not set',
	});

	// Handle URL parameters and step restoration - SIMPLIFIED LIKE V5
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const authCode = urlParams.get('code');
		const error = urlParams.get('error');
		const urlStep = urlParams.get('step');
		const storedStep = sessionStorage.getItem('oidc-authorization-code-v6-current-step');

		// Also check sessionStorage for auth code (from OAuth callback)
		const sessionAuthCode = sessionStorage.getItem('oauth_auth_code');

		console.log('🚀 [OIDCAuthorizationCodeFlowV6] Initialization check:', {
			hasCode: !!authCode,
			hasError: !!error,
			hasUrlStep: !!urlStep,
			hasStoredStep: !!storedStep,
			hasSessionAuthCode: !!sessionAuthCode,
			fullUrl: window.location.href,
		});

		// Handle OAuth errors first
		if (error) {
			console.error('[OIDCAuthorizationCodeFlowV6] OAuth error in URL:', error);
			v4ToastManager.showError(`OAuth Error: ${error}`);
			// Clear URL parameters and reset to step 0
			window.history.replaceState({}, '', window.location.pathname);
			setCurrentStep(0);
			sessionStorage.setItem('oidc-authorization-code-v6-current-step', '0');
			return;
		}

		// Handle OAuth callback with authorization code - PRIORITY 1
		const finalAuthCode = authCode || sessionAuthCode;
		if (finalAuthCode) {
			console.log('🎉 [OIDCAuthorizationCodeFlowV6] Authorization code found!', {
				source: authCode ? 'URL' : 'sessionStorage',
				code: `${finalAuthCode.substring(0, 10)}...`,
			});
			setLocalAuthCode(finalAuthCode);
			// Also set it in the controller
			controller.setAuthCodeManually(finalAuthCode);
			// Show success modal
			console.log('🟢 [OIDCAuthorizationCodeFlowV6] Opening LoginSuccessModal');
			setShowLoginSuccessModal(true);
			v4ToastManager.showSuccess('Login Successful! You have been authenticated with PingOne.');
			// Navigate to step 4 and persist it
			setCurrentStep(4);
			sessionStorage.setItem('oidc-authorization-code-v6-current-step', '4');
			// Clear URL parameters and sessionStorage
			window.history.replaceState({}, '', window.location.pathname);
			sessionStorage.removeItem('oauth_auth_code');
			return;
		}

		// Handle URL step parameter - PRIORITY 2
		if (urlStep) {
			const stepIndex = parseInt(urlStep, 10);
			if (!Number.isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEP_METADATA.length) {
				console.log('🎯 [OIDCAuthorizationCodeFlowV6] Using URL step parameter:', stepIndex);
				setCurrentStep(stepIndex);
				sessionStorage.setItem('oidc-authorization-code-v6-current-step', stepIndex.toString());
				return;
			}
		}

		// Handle stored step - PRIORITY 3
		if (storedStep) {
			const stepIndex = parseInt(storedStep, 10);
			if (!Number.isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEP_METADATA.length) {
				console.log('🎯 [OIDCAuthorizationCodeFlowV6] Using stored step:', stepIndex);
				setCurrentStep(stepIndex);
				return;
			}
		}

		// Default to step 0 for fresh start - PRIORITY 4
		console.log('🔄 [OIDCAuthorizationCodeFlowV6] Fresh start - going to step 0');
		setCurrentStep(0);
		sessionStorage.setItem('oidc-authorization-code-v6-current-step', '0');
	}, [
		// Also set it in the controller
		controller.setAuthCodeManually,
	]);

	// Persist current step to session storage
	useEffect(() => {
		sessionStorage.setItem('oidc-authorization-code-v6-current-step', currentStep.toString());
	}, [currentStep]);

	// Additional auth code detection for controller updates (backup)
	useEffect(() => {
		// If we just received an auth code from the controller and haven't shown the modal yet
		if (controller.authCode && !showLoginSuccessModal && !localAuthCode) {
			console.log(
				'[OIDCAuthorizationCodeFlowV6] Auth code detected from controller:',
				`${controller.authCode.substring(0, 10)}...`
			);
			setLocalAuthCode(controller.authCode);
			setShowLoginSuccessModal(true);
			v4ToastManager.showSuccess('Login Successful! You have been authenticated with PingOne.');

			// Navigate to the next step (Token Exchange) and persist it
			setCurrentStep(4); // Step 4 is Token Exchange
			sessionStorage.setItem('oidc-authorization-code-v6-current-step', '4');
		}
	}, [controller.authCode, showLoginSuccessModal, localAuthCode]);

	// Reset flow handler
	const handleResetFlow = useCallback(() => {
		controller.resetFlow();
		setCurrentStep(0);
		setLocalAuthCode('');
		setShowLoginSuccessModal(false);
		setShowRedirectModal(false);
		controller.setCredentials({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: 'https://localhost:3000/authz-callback',
			scope: 'openid',
			responseType: 'code',
			grantType: 'authorization_code',
			clientAuthMethod: 'client_secret_post',
		});
		sessionStorage.removeItem('oidc-authorization-code-v6-app-config');
		v4ToastManager.showSuccess('Configuration cleared. Enter PingOne credentials to continue.');
	}, [controller]);

	const savePingOneConfig = useCallback(
		(config: PingOneApplicationState) => {
			setPingOneConfig(config);
			sessionStorage.setItem('oidc-authorization-code-v6-app-config', JSON.stringify(config));

			// Update controller credentials with PingOne configuration
			const updatedCredentials = {
				environmentId: config.environmentId || '',
				clientId: config.clientId || '',
				clientSecret: config.clientSecret || '',
				redirectUri: config.redirectUri || 'https://localhost:3000/authz-callback',
				scope: config.scopes?.join(' ') || 'openid profile email',
				responseType: config.responseType || 'code',
				grantType: 'authorization_code',
				clientAuthMethod: 'client_secret_post',
			};
			controller.setCredentials(updatedCredentials);
			v4ToastManager.showSuccess('PingOne configuration saved successfully!');
		},
		[controller]
	);

	// Step validation
	const isStepValid = useMemo(() => {
		return (step: number): boolean => {
			switch (step) {
				case 0:
					return true; // Introduction is always valid
				case 1:
					return !!(controller.pkceCodes?.codeVerifier && controller.pkceCodes?.codeChallenge);
				case 2:
					return !!(controller.authUrl && controller.pkceCodes?.codeVerifier);
				case 3:
					return !!(controller.authCode || localAuthCode);
				case 4:
					return !!controller.tokens?.accessToken;
				case 5:
					return !!controller.userInfo;
				case 6:
					return true; // Token introspection is optional
				case 7:
					return true; // Flow complete
				case 8:
					return true; // Security features
				case 9:
					return true; // Summary
				default:
					return false;
			}
		};
	}, [controller, localAuthCode]);

	// Step navigation
	const canNavigateNext = useMemo(() => {
		return currentStep < STEP_METADATA.length - 1 && isStepValid(currentStep);
	}, [currentStep, isStepValid]);

	const canNavigatePrev = useMemo(() => {
		return currentStep > 0;
	}, [currentStep]);

	const handleNextStep = useCallback(() => {
		if (canNavigateNext) {
			const nextStep = currentStep + 1;
			setCurrentStep(nextStep);
			storeFlowNavigationState('oidc-authorization-code-v6', nextStep);
		}
	}, [canNavigateNext, currentStep]);

	const handlePrevStep = useCallback(() => {
		if (canNavigatePrev) {
			setCurrentStep(currentStep - 1);
		}
	}, [canNavigatePrev, currentStep]);

	// Generate authorization URL
	const handleGenerateAuthUrl = useCallback(async () => {
		try {
			await controller.generateAuthorizationUrl();
			v4ToastManager.showSuccess('Authorization URL generated successfully!');
		} catch (error) {
			console.error('[OIDCAuthorizationCodeFlowV6] Failed to generate authorization URL:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to generate authorization URL'
			);
		}
	}, [controller]);

	// Handle redirect to PingOne
	const handleRedirectToPingOne = useCallback(() => {
		if (!controller.authUrl) {
			v4ToastManager.showError('Complete above action: Generate the authorization URL first.');
			return;
		}
		console.log('🔧 [OIDCAuthorizationCodeFlowV6] About to redirect to PingOne via controller...');
		controller.handleRedirectAuthorization();
		setShowRedirectModal(true);
		setTimeout(() => setShowRedirectModal(false), 2000);
	}, [controller]);

	// Handle token exchange
	const handleTokenExchange = useCallback(async () => {
		const authCode = controller.authCode || localAuthCode;
		if (!authCode) {
			v4ToastManager.showError(
				'Complete above action: Authorize the application first to get authorization code.'
			);
			return;
		}

		try {
			await controller.exchangeCodeForTokens(authCode);
			v4ToastManager.showSuccess('Token exchange successful!');
		} catch (error) {
			console.error('[OIDCAuthorizationCodeFlowV6] Token exchange failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Token exchange failed'
			);
		}
	}, [controller, localAuthCode]);

	// Handle user info retrieval
	const handleGetUserInfo = useCallback(async () => {
		if (!controller.tokens?.accessToken) {
			v4ToastManager.showError('Complete above action: Exchange authorization code for tokens first.');
			return;
		}

		try {
			await controller.getUserInfo();
			v4ToastManager.showSuccess('User info retrieved successfully!');
		} catch (error) {
			console.error('[OIDCAuthorizationCodeFlowV6] User info retrieval failed:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'User info retrieval failed'
			);
		}
	}, [controller]);

	// Get auth code for modal and rendering
	const authCode = controller.authCode || localAuthCode;

	// Render step content
	const renderStepContent = useMemo(() => {
		const tokens = controller.tokens;

		switch (currentStep) {
			case 0:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[0].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[0].subtitle}</StepSubtitle>
						</StepHeader>
						<ComprehensiveCredentialsService
							onCredentialsChange={(creds) => controller.setCredentials(creds)}
							onDiscoveryComplete={(result) => {
								// Extract environment ID from issuer URL
								const envIdMatch = result.issuerUrl.match(/environments\/([^\/]+)/);
								if (envIdMatch) {
									const newCredentials = { ...controller.credentials, environmentId: envIdMatch[1] };
									controller.setCredentials(newCredentials);
								}
							}}
							onSave={savePingOneConfig}
							credentials={controller.credentials}
							pingOneConfig={pingOneConfig}
						/>
					</FlowResultsSection>
				);

			case 1:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[1].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[1].subtitle}</StepSubtitle>
						</StepHeader>
						<PKCEService
							value={controller.pkceCodes || { codeVerifier: '', codeChallenge: '', codeChallengeMethod: 'S256' }}
							onChange={(pkce) => controller.setPKCECodes(pkce)}
						/>
					</FlowResultsSection>
				);

			case 2:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[2].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[2].subtitle}</StepSubtitle>
						</StepHeader>
						
						<ActionRow>
							<Button onClick={handleGenerateAuthUrl} variant="primary">
								<FiRefreshCw /> Generate Authorization URL
							</Button>
							<Button onClick={handleRedirectToPingOne} variant="success" disabled={!controller.authUrl}>
								<FiExternalLink /> Redirect to PingOne
							</Button>
						</ActionRow>

						{controller.authUrl && (
							<ColoredUrlDisplay
								label="Generated Authorization URL"
								url={controller.authUrl}
								showCopyButton={true}
							/>
						)}
					</FlowResultsSection>
				);

			case 3:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[3].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[3].subtitle}</StepSubtitle>
						</StepHeader>
						
						{authCode ? (
							<InfoBox variant="success">
								<FiCheckCircle />
								<div>
									<strong>Authorization Code Received!</strong>
									<p>Code: {authCode.substring(0, 20)}...</p>
									<CopyButtonService
										text={authCode}
										label="Copy Authorization Code"
										showLabel={false}
									/>
								</div>
							</InfoBox>
						) : (
							<InfoBox variant="info">
								<FiInfo />
								<div>
									<strong>Waiting for Authorization Code</strong>
									<p>Complete the authorization in the previous step to receive the authorization code.</p>
								</div>
							</InfoBox>
						)}
					</FlowResultsSection>
				);

			case 4:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[4].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[4].subtitle}</StepSubtitle>
						</StepHeader>
						
						<ActionRow>
							<Button onClick={handleTokenExchange} variant="primary" disabled={!authCode}>
								<FiKey /> Exchange Code for Tokens
							</Button>
						</ActionRow>

						{tokens?.accessToken && (
							<InfoBox variant="success">
								<FiCheckCircle />
								<div>
									<strong>Tokens Received!</strong>
									<p>Access Token: {tokens.accessToken.substring(0, 20)}...</p>
									{tokens.idToken && <p>ID Token: {tokens.idToken.substring(0, 20)}...</p>}
									{tokens.refreshToken && <p>Refresh Token: {tokens.refreshToken.substring(0, 20)}...</p>}
								</div>
							</InfoBox>
						)}
					</FlowResultsSection>
				);

			case 5:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[5].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[5].subtitle}</StepSubtitle>
						</StepHeader>
						
						<ActionRow>
							<Button onClick={handleGetUserInfo} variant="primary" disabled={!tokens?.accessToken}>
								<FiUser /> Get User Info
							</Button>
						</ActionRow>

						{controller.userInfo && (
							<InfoBox variant="success">
								<FiCheckCircle />
								<div>
									<strong>User Info Retrieved!</strong>
									<pre>{JSON.stringify(controller.userInfo, null, 2)}</pre>
								</div>
							</InfoBox>
						)}
					</FlowResultsSection>
				);

			case 6:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[6].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[6].subtitle}</StepSubtitle>
						</StepHeader>
						
						{tokens?.accessToken && (
							<TokenIntrospect
								token={tokens.accessToken}
								tokenType="access"
								onIntrospect={(result) => {
									console.log('Token introspection result:', result);
								}}
							/>
						)}
					</FlowResultsSection>
				);

			case 7:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[7].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[7].subtitle}</StepSubtitle>
						</StepHeader>
						
						<InfoBox variant="success">
							<FiCheckCircle />
							<div>
								<strong>OIDC Authorization Code Flow Complete!</strong>
								<p>You have successfully completed the OIDC Authorization Code Flow with PKCE.</p>
							</div>
						</InfoBox>
					</FlowResultsSection>
				);

			case 8:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[8].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[8].subtitle}</StepSubtitle>
						</StepHeader>
						
						<SecurityFeaturesDemo />
					</FlowResultsSection>
				);

			case 9:
				return (
					<FlowResultsSection>
						<StepHeader>
							<StepTitle>{STEP_METADATA[9].title}</StepTitle>
							<StepSubtitle>{STEP_METADATA[9].subtitle}</StepSubtitle>
						</StepHeader>
						
						<InfoBox variant="info">
							<FiInfo />
							<div>
								<strong>Flow Summary</strong>
								<p>This flow demonstrated the complete OIDC Authorization Code Flow with PKCE.</p>
							</div>
						</InfoBox>
					</FlowResultsSection>
				);

			default:
				return null;
		}
	}, [
		currentStep,
		controller,
		authCode,
		handleGenerateAuthUrl,
		handleRedirectToPingOne,
		handleTokenExchange,
		handleGetUserInfo,
		savePingOneConfig,
		pingOneConfig,
	]);

	return (
		<>
			<FlowHeader
				flowId="oidc-authorization-code-v6"
				title="OIDC Authorization Code Flow V6"
				subtitle="OpenID Connect Authorization Code Flow with PKCE - Service Architecture"
				version="V6.1.0 - Service Architecture"
			/>

			{renderStepContent}

			{/* Step Navigation */}
			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onNext={handleNextStep}
				onPrev={handlePrevStep}
				onReset={handleResetFlow}
				canNavigateNext={canNavigateNext}
				canNavigatePrev={canNavigatePrev}
				stepMetadata={STEP_METADATA}
				isStepValid={isStepValid}
			/>

			{/* Login Success Modal */}
			<LoginSuccessModal
				isOpen={showLoginSuccessModal}
				onClose={() => setShowLoginSuccessModal(false)}
				authCode={authCode}
				onContinue={() => setShowLoginSuccessModal(false)}
			/>
		</>
	);
};

export default OIDCAuthorizationCodeFlowV6;
