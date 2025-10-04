// src/pages/flows/OAuthAuthorizationCodeFlowV5.tsx
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
} from 'react-icons/fi';
import { themeService } from '../../services/themeService';
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

const STEP_METADATA = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Authorization Code Flow' },
	{ title: 'Step 1: PKCE Parameters', subtitle: 'Generate secure verifier and challenge' },
	{
		title: 'Step 2: Authorization Request',
		subtitle: 'Build and launch the PingOne authorization URL',
	},
	{ title: 'Step 3: Authorization Response', subtitle: 'Process the returned authorization code' },
	{ title: 'Step 4: Token Exchange', subtitle: 'Swap the code for tokens using PingOne APIs' },
	{ title: 'Step 5: Token Introspection', subtitle: 'Introspect access token and review results' },
	{ title: 'Step 6: Flow Complete', subtitle: 'Review your results and next steps' },
	{ title: 'Step 7: Security Features', subtitle: 'Demonstrate advanced security implementations' },
	{ title: 'Step 8: Flow Summary', subtitle: 'Comprehensive completion overview' },
] as const;

type StepCompletionState = Record<number, boolean>;
type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'results' // Step 0
	| 'pkceOverview'
	| 'pkceDetails' // Step 1
	| 'authRequestOverview'
	| 'authRequestDetails' // Step 2
	| 'responseMode' // Response mode selection
	| 'authResponseOverview'
	| 'authResponseDetails' // Step 3
	| 'tokenExchangeOverview'
	| 'tokenExchangeDetails' // Step 4
	| 'introspectionOverview'
	| 'introspectionDetails' // Step 5
	| 'completionOverview'
	| 'completionDetails' // Step 6
	| 'flowSummary'; // Step 8

const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'client_secret_post',
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'REQUIRED',

	// Response Types (from OIDC Settings)
	responseTypeCode: true,
	responseTypeToken: false,
	responseTypeIdToken: false,

	// Grant Types (from OIDC Settings)
	grantTypeAuthorizationCode: true,

	// Advanced OIDC Parameters
	initiateLoginUri: '',
	targetLinkUri: '',
	signoffUrls: [],

	// Request Parameter Signature
	requestParameterSignatureRequirement: 'DEFAULT',

	// JWKS Settings
	enableJWKS: false,
	jwksMethod: 'JWKS_URL',
	jwksUrl: '',
	jwks: '',

	// Pushed Authorization Request (PAR)
	requirePushedAuthorizationRequest: false,
	pushedAuthorizationRequestTimeout: 60,

	// Advanced Security Settings
	additionalRefreshTokenReplayProtection: false,
	includeX5tParameter: false,
	oidcSessionManagement: false,
	requestScopesForMultipleResources: false,
	terminateUserSessionByIdToken: false,

	// CORS Settings
	corsOrigins: [],
	corsAllowAnyOrigin: false,
};

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span`
	align-self: flex-start;
	background: rgba(22, 163, 74, 0.2);
	border: 1px solid #4ade80;
	color: #bbf7d0;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
`;

const StepHeaderTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
`;

const StepHeaderRight = styled.div`
	text-align: right;
`;

const RequirementsIndicator = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const RequirementsIcon = styled.div`
	color: #d97706;
	font-size: 1.25rem;
	margin-top: 0.125rem;
	flex-shrink: 0;
`;

const RequirementsText = styled.div`
	color: #92400e;
	font-size: 0.875rem;
	line-height: 1.5;

	strong {
		font-weight: 600;
		display: block;
		margin-bottom: 0.5rem;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	li {
		margin-bottom: 0.25rem;
	}
`;

const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.05em;
`;

const StepContentWrapper = styled.div`
	padding: 2rem;
	background: #ffffff;
`;

const FlowSuitability = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1.5rem 0 0;
`;

const SuitabilityCard = styled.div<{ $variant: 'success' | 'warning' | 'danger' }>`
	border-radius: 1rem;
	padding: 1.25rem;
	border: 2px solid
		${({ $variant }) => {
			if ($variant === 'success') return '#34d399';
			if ($variant === 'warning') return '#fbbf24';
			return '#f87171';
		}};
	background:
		${({ $variant }) => {
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'warning') return '#fef3c7';
			return '#fee2e2';
		}};
	color: #1f2937;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);

	ul {
		margin: 0.75rem 0 0;
		padding-left: 1.25rem;
		line-height: 1.6;
	}
`;

const GeneratedContentBox = styled.div`
	background-color: #dcfce7;
	border: 1px solid #22c55e;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #16a34a;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const HighlightBadge = styled.span`
	position: absolute;
	top: -10px;
	right: -10px;
	background: #22c55e;
	color: #ffffff;
	border-radius: 9999px;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
`;

const CodeBlock = styled.pre`
	background-color: #1e293b;
	border: 1px solid #334155;
	border-radius: 0.5rem;
	padding: 1.25rem;
	font-size: 0.875rem;
	color: #e2e8f0;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	line-height: 1.5;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;


const Modal = styled.div<{ $show?: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(15, 23, 42, 0.45);
	display: ${({ $show }) => ($show ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 2000;
`;

const ModalContent = styled.div`
	background-color: #ffffff;
	border-radius: 0.75rem;
	padding: 2rem;
	max-width: 400px;
	text-align: center;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalIcon = styled.div`
	width: 4rem;
	height: 4rem;
	border-radius: 50%;
	background-color: #22c55e;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	font-size: 1.5rem;
	color: #ffffff;
`;

const ModalTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--color-text-primary, #111827);
	margin-bottom: 0.5rem;
`;

const ModalText = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.5;
`;



const OAuthAuthorizationCodeFlowV5: React.FC = () => {
	// Ensure page starts at top
	usePageScroll({ pageName: 'OAuthAuthorizationCodeFlowV5', force: true });

	console.log('🚀 [OAuthAuthorizationCodeFlowV5] Component loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	const manualAuthCodeId = useId();
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'oauth-authorization-code-v5',
		defaultFlowVariant: 'oauth',
		enableDebugger: true,
	});



	const [currentStep, setCurrentStep] = useState(() => {
		// Check for restore_step from token management navigation
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step'); // Clear after use
			console.log('🔗 [OAuthAuthorizationCodeFlowV5] Restoring to step:', step);
			return step;
		}
		return 0;
	});
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
	const [emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>({
		// Step 0
		overview: false,
		flowDiagram: true, // Collapsed by default
		credentials: false, // Expanded by default - users need to see credentials first
		results: false,
		// Step 1
		pkceOverview: false,
		pkceDetails: false,
		// Step 2
		authRequestOverview: false,
		authRequestDetails: false,
		responseMode: false, // Expanded by default - users need to see response mode options
		// Step 3
		authResponseOverview: false,
		authResponseDetails: false,
		// Step 4
		tokenExchangeOverview: false,
		tokenExchangeDetails: false,
		// Step 5
		introspectionOverview: false,
		introspectionDetails: false,
		// Step 6
		completionOverview: false,
		completionDetails: false,
		// Step 8
		flowSummary: false, // New Flow Completion Service step
	});
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
	const [localAuthCode, setLocalAuthCode] = useState<string | null>(null);
	const [showSavedSecret, setShowSavedSecret] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// API call tracking for display
	const [tokenExchangeApiCall, setTokenExchangeApiCall] = useState<EnhancedApiCallData | null>(
		null
	);
	const [userInfoApiCall, setUserInfoApiCall] = useState<EnhancedApiCallData | null>(null);
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);

	// Load PingOne configuration from sessionStorage on mount
	useEffect(() => {
		const stored = sessionStorage.getItem('oauth-authorization-code-v5-app-config');
		if (stored) {
			try {
				const config = JSON.parse(stored);
				setPingOneConfig(config);
				// Also update controller credentials with stored config
				const updatedCredentials = {
					...controller.credentials,
					responseTypeCode: config.responseTypeCode,
					responseTypeToken: config.responseTypeToken,
					responseTypeIdToken: config.responseTypeIdToken,
					initiateLoginUri: config.initiateLoginUri,
					targetLinkUri: config.targetLinkUri,
					signoffUrls: config.signoffUrls,
					requestParameterSignatureRequirement: config.requestParameterSignatureRequirement,
					additionalRefreshTokenReplayProtection: config.additionalRefreshTokenReplayProtection,
					includeX5tParameter: config.includeX5tParameter,
					oidcSessionManagement: config.oidcSessionManagement,
					requestScopesForMultipleResources: config.requestScopesForMultipleResources,
					terminateUserSessionByIdToken: config.terminateUserSessionByIdToken,
					corsOrigins: config.corsOrigins,
					corsAllowAnyOrigin: config.corsAllowAnyOrigin,
				};
				controller.setCredentials(updatedCredentials);
			} catch (error) {
				console.warn('[AuthorizationCodeFlowV5] Failed to parse stored PingOne config:', error);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Debug: Always log the current authorization code state
	console.log('🔍 [AuthorizationCodeFlowV5] Current controller.authCode:', {
		hasAuthCode: !!controller.authCode,
		authCodeLength: controller.authCode?.length || 0,
		authCodePreview: controller.authCode ? `${controller.authCode.substring(0, 10)}...` : 'Not set',
		currentStep,
		urlParams: window.location.search,
		localAuthCode: localAuthCode ? `${localAuthCode.substring(0, 10)}...` : 'Not set',
	});

	// Initialize current step and handle OAuth callback - runs only once on mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const authCode = urlParams.get('code');
		const error = urlParams.get('error');
		const urlStep = urlParams.get('step');
		const storedStep = sessionStorage.getItem('oauth-authorization-code-v5-current-step');

		// Also check sessionStorage for auth code (from OAuth callback)
		const sessionAuthCode = sessionStorage.getItem('oauth_auth_code');

		console.log('🚀 [AuthorizationCodeFlowV5] Initialization check:', {
			hasCode: !!authCode,
			hasError: !!error,
			hasUrlStep: !!urlStep,
			hasStoredStep: !!storedStep,
			hasSessionAuthCode: !!sessionAuthCode,
			code: authCode ? `${authCode.substring(0, 10)}...` : 'none',
			error: error || 'none',
		});

		// Handle OAuth errors first
		if (error) {
			console.error('[AuthorizationCodeFlowV5] OAuth error in URL:', error);
			v4ToastManager.showError(`OAuth Error: ${error}`);
			// Clear URL parameters and reset to step 0
			window.history.replaceState({}, '', window.location.pathname);
			setCurrentStep(0);
			sessionStorage.setItem('oauth-authorization-code-v5-current-step', '0');
			return;
		}

		// Handle OAuth callback with authorization code - PRIORITY 1
		const finalAuthCode = authCode || sessionAuthCode;
		if (finalAuthCode) {
			console.log('🎉 [AuthorizationCodeFlowV5] Authorization code found!', {
				source: authCode ? 'URL' : 'sessionStorage',
				code: `${finalAuthCode.substring(0, 10)}...`,
			});
			setLocalAuthCode(finalAuthCode);
			// Also set it in the controller
			controller.setAuthCodeManually(finalAuthCode);
			// Show success modal
			console.log('🟢 [AuthorizationCodeFlowV5] Opening LoginSuccessModal');
			setShowLoginSuccessModal(true);
			v4ToastManager.showSuccess('Login Successful! You have been authenticated with PingOne.');
			// Navigate to step 4 and persist it
			setCurrentStep(4);
			sessionStorage.setItem('oauth-authorization-code-v5-current-step', '4');
			// Clear URL parameters and sessionStorage
			window.history.replaceState({}, '', window.location.pathname);
			sessionStorage.removeItem('oauth_auth_code');
			return;
		}

		// Handle URL step parameter - PRIORITY 2
		if (urlStep) {
			const stepIndex = parseInt(urlStep, 10);
			if (!Number.isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEP_METADATA.length) {
				console.log('🎯 [AuthorizationCodeFlowV5] Using URL step parameter:', stepIndex);
				setCurrentStep(stepIndex);
				sessionStorage.setItem('oauth-authorization-code-v5-current-step', stepIndex.toString());
				return;
			}
		}

		// Handle stored step - PRIORITY 3
		if (storedStep) {
			const stepIndex = parseInt(storedStep, 10);
			if (!Number.isNaN(stepIndex) && stepIndex >= 0 && stepIndex < STEP_METADATA.length) {
				console.log('🎯 [AuthorizationCodeFlowV5] Using stored step:', stepIndex);
				setCurrentStep(stepIndex);
				return;
			}
		}

		// Default to step 0 for fresh start - PRIORITY 4
		console.log('🔄 [AuthorizationCodeFlowV5] Fresh start - going to step 0');
		setCurrentStep(0);
		sessionStorage.setItem('oauth-authorization-code-v5-current-step', '0');
	}, [
		// Also set it in the controller
		controller.setAuthCodeManually,
	]); // Run only once on mount

	// Persist current step to session storage
	useEffect(() => {
		sessionStorage.setItem('oauth-authorization-code-v5-current-step', currentStep.toString());
	}, [currentStep]);

	// Additional auth code detection for controller updates (backup)
	useEffect(() => {
		// If we just received an auth code from the controller and haven't shown the modal yet
		if (controller.authCode && !showLoginSuccessModal && !localAuthCode) {
			console.log(
				'[AuthorizationCodeFlowV5] Auth code detected from controller:',
				`${controller.authCode.substring(0, 10)}...`
			);

			// Show success modal and toast
			setShowLoginSuccessModal(true);
			v4ToastManager.showSuccess('Login Successful! You have been authenticated with PingOne.');

			// Navigate to the next step (Token Exchange) and persist it
			setCurrentStep(4); // Step 4 is Token Exchange
			sessionStorage.setItem('oauth-authorization-code-v5-current-step', '4');
		}
	}, [controller.authCode, showLoginSuccessModal, localAuthCode]);

	// This effect is redundant - removing to prevent conflicts
	// The auth code detection is already handled in the other useEffect

	const stepCompletions = useMemo<StepCompletionState>(
		() => ({
			0: controller.hasStepResult('setup-credentials') || controller.hasCredentialsSaved,
			1: controller.hasStepResult('generate-pkce') || Boolean(controller.pkceCodes.codeVerifier),
			2: controller.hasStepResult('build-auth-url') || Boolean(controller.authUrl),
			3: controller.hasStepResult('handle-callback') || Boolean(controller.authCode),
			4: controller.hasStepResult('exchange-tokens') || Boolean(controller.tokens),
			5: controller.hasStepResult('validate-tokens') || Boolean(controller.userInfo),
			6: Boolean(controller.tokens?.access_token), // Token introspection available
			7:
				controller.hasStepResult('refresh-token-exchange') ||
				Boolean(controller.tokens && controller.userInfo),
		}),
		[
			controller.authCode,
			controller.authUrl,
			controller.hasCredentialsSaved,
			controller.hasStepResult,
			controller.pkceCodes.codeVerifier,
			controller.tokens,
			controller.userInfo,
		]
	);

	const toggleSection = useCallback((key: IntroSectionKey) => {
		setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	const handleFieldChange = useCallback(
		async (field: keyof StepCredentials, value: string) => {
			const updatedCredentials = {
				...controller.credentials,
				[field]: value,
			};
			controller.setCredentials(updatedCredentials);
			if (value.trim()) {
				setEmptyRequiredFields((prev) => {
					const next = new Set(prev);
					next.delete(field as string);
					return next;
				});
			} else {
				setEmptyRequiredFields((prev) => new Set(prev).add(field as string));
			}

			// Auto-save logic
			if (field === 'environmentId' && value.trim() && updatedCredentials.clientId?.trim()) {
				await controller.saveCredentials();
				v4ToastManager.showSuccess('Configuration auto-saved after environment ID change');
			} else if (field === 'clientId' && value.trim() && updatedCredentials.environmentId?.trim()) {
				await controller.saveCredentials();
				v4ToastManager.showSuccess('Configuration auto-saved after client ID change');
			} else if (field === 'clientSecret' && value.trim() && 
				updatedCredentials.environmentId?.trim() && updatedCredentials.clientId?.trim()) {
				await controller.saveCredentials();
				v4ToastManager.showSuccess('Configuration auto-saved after client secret change');
			}
		},
		[controller]
	);

	const handleSaveConfiguration = useCallback(async () => {
		const required: Array<keyof StepCredentials> = [
			'environmentId',
			'clientId',
			'clientSecret',
			'redirectUri',
		];
		const missing = required.filter((field) => {
			const value = controller.credentials[field];
			return !value || (typeof value === 'string' && !value.trim());
		});
		if (missing.length > 0) {
			setEmptyRequiredFields(new Set(missing.map((field) => field as string)));
			v4ToastManager.showError(
				'Missing required fields: Complete all required fields before saving.'
			);
			return;
		}
		await controller.saveCredentials();
		v4ToastManager.showSuccess('Configuration saved successfully!');
	}, [controller]);

	const handleClearConfiguration = useCallback(() => {
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
		setEmptyRequiredFields(new Set(['environmentId', 'clientId', 'clientSecret', 'redirectUri']));
		sessionStorage.removeItem('oauth-authorization-code-v5-app-config');
		v4ToastManager.showSuccess('Configuration cleared. Enter PingOne credentials to continue.');
	}, [controller]);

	const savePingOneConfig = useCallback(
		(config: PingOneApplicationState) => {
			setPingOneConfig(config);
			sessionStorage.setItem('oauth-authorization-code-v5-app-config', JSON.stringify(config));

			// Update controller credentials with PingOne configuration
			const updatedCredentials = {
				...controller.credentials,
				// Client Authentication
				clientAuthMethod: config.clientAuthMethod,
				// JWT Authentication Settings
				privateKey: config.privateKey || '',
				keyId: config.keyId || '',
				// Response Types
				responseTypeCode: config.responseTypeCode,
				responseTypeToken: config.responseTypeToken,
				responseTypeIdToken: config.responseTypeIdToken,
				// Advanced OIDC Parameters
				initiateLoginUri: config.initiateLoginUri,
				targetLinkUri: config.targetLinkUri,
				signoffUrls: config.signoffUrls,
				// Request Parameter Signature
				requestParameterSignatureRequirement: config.requestParameterSignatureRequirement,
				// Advanced Security Settings
				additionalRefreshTokenReplayProtection: config.additionalRefreshTokenReplayProtection,
				includeX5tParameter: config.includeX5tParameter,
				oidcSessionManagement: config.oidcSessionManagement,
				requestScopesForMultipleResources: config.requestScopesForMultipleResources,
				terminateUserSessionByIdToken: config.terminateUserSessionByIdToken,
				// CORS Settings
				corsOrigins: config.corsOrigins,
				corsAllowAnyOrigin: config.corsAllowAnyOrigin,
			};
			controller.setCredentials(updatedCredentials);
		},
		[controller]
	);

	const handleGeneratePkce = useCallback(async () => {
		if (!controller.credentials.clientId || !controller.credentials.environmentId) {
			v4ToastManager.showError(
				'Complete above action: Fill in Client ID and Environment ID first.'
			);
			return;
		}
		await controller.generatePkceCodes();
		v4ToastManager.showSuccess('PKCE parameters generated successfully!');
	}, [controller]);

	const handleGenerateAuthUrl = useCallback(async () => {
		if (!controller.credentials.clientId || !controller.credentials.environmentId) {
			v4ToastManager.showError(
				'Complete above action: Fill in Client ID and Environment ID first.'
			);
			return;
		}
		if (!controller.pkceCodes.codeVerifier || !controller.pkceCodes.codeChallenge) {
			v4ToastManager.showError('Complete above action: Generate PKCE parameters first.');
			return;
		}
		try {
			await controller.generateAuthorizationUrl();
			v4ToastManager.showSuccess('Authorization URL generated successfully!');
		} catch (error) {
			console.error('[AuthorizationCodeFlowV5] Failed to generate authorization URL:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to generate authorization URL'
			);
		}
	}, [controller]);

	const handleOpenAuthUrl = useCallback(() => {
		if (!controller.authUrl) {
			v4ToastManager.showError('Complete above action: Generate the authorization URL first.');
			return;
		}
		console.log('🔧 [AuthorizationCodeFlowV5] About to redirect to PingOne via controller...');
		controller.handleRedirectAuthorization();
		setShowRedirectModal(true);
		setTimeout(() => setShowRedirectModal(false), 2000);
	}, [controller]);

	const handleExchangeTokens = useCallback(async () => {
		const authCode = controller.authCode || localAuthCode;
		if (!authCode) {
			v4ToastManager.showError(
				'Complete above action: Authorize the application first to get authorization code.'
			);
			return;
		}

		// If we have a local auth code but not in controller, set it first
		if (localAuthCode && !controller.authCode) {
			controller.setAuthCodeManually(localAuthCode);
		}

		// Create API call display for token exchange
		const tokenExchangeApiCallData: EnhancedApiCallData = {
			flowType: 'authorization-code',
			stepName: 'Exchange Authorization Code for Tokens',
			url: '/api/token-exchange',
			method: 'POST' as const,
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: {
				grant_type: 'authorization_code',
				code: authCode,
				redirect_uri: controller.credentials.redirectUri,
				client_id: controller.credentials.clientId,
				environment_id: controller.credentials.environmentId,
				code_verifier: controller.pkceCodes.codeVerifier,
				client_auth_method: controller.credentials.clientAuthMethod || 'client_secret_post',
				client_secret: '***REDACTED***',
				...(controller.credentials.includeX5tParameter && {
					includeX5tParameter: controller.credentials.includeX5tParameter,
				}),
			},
			timestamp: new Date(),
			description: 'Exchange authorization code for access token and refresh token',
		};

		try {
			await controller.exchangeTokens();

			// Update API call with success response
			const updatedTokenExchangeApiCall: EnhancedApiCallData = {
				...tokenExchangeApiCallData,
				response: {
					status: 200,
					statusText: 'OK',
					headers: { 'Content-Type': 'application/json' },
					data: controller.tokens,
				},
			};

			setTokenExchangeApiCall(updatedTokenExchangeApiCall);
			v4ToastManager.showSuccess('Tokens exchanged successfully!');
		} catch (error) {
			console.error('[AuthorizationCodeFlowV5] Token exchange failed:', error);

			// Update API call with error response
			const errorApiCall: EnhancedApiCallData = {
				...tokenExchangeApiCallData,
				response: {
					status: 400,
					statusText: 'Bad Request',
					headers: { 'Content-Type': 'application/json' },
					error: error instanceof Error ? error.message : 'Unknown error',
				},
			};

			setTokenExchangeApiCall(errorApiCall);

			// Parse error message for better user feedback
			let errorMessage = 'Token exchange failed. Please try again.';

			if (error instanceof Error) {
				const errorText = error.message.toLowerCase();
				if (errorText.includes('invalid_client')) {
					errorMessage =
						'Invalid client credentials. Please check your Client ID and Client Secret.';
				} else if (errorText.includes('invalid_grant')) {
					errorMessage = 'Invalid authorization code. Please restart the flow.';
				} else if (errorText.includes('unauthorized_client')) {
					errorMessage =
						'Client not authorized for this grant type. Check your PingOne application configuration.';
				} else if (errorText.includes('unsupported_grant_type')) {
					errorMessage = 'Grant type not supported. Check your PingOne application configuration.';
				} else if (errorText.includes('invalid_scope')) {
					errorMessage = 'Invalid scope requested. Check your PingOne application scopes.';
				} else {
					// Try to extract more specific error from the message
					errorMessage = error.message;
				}
			}

			v4ToastManager.showError(errorMessage);
		}
	}, [controller, localAuthCode]);

	const handleFetchUserInfo = useCallback(async () => {
		if (!controller.tokens?.access_token) {
			v4ToastManager.showError('Access token missing: Exchange tokens before fetching user info.');
			return;
		}

		// Create API call display for UserInfo request
		const userInfoApiCallData: EnhancedApiCallData = {
			flowType: 'authorization-code',
			stepName: 'Fetch User Information',
			url:
				controller.credentials.userInfoEndpoint ||
				`https://auth.pingone.com/${controller.credentials.environmentId}/as/userinfo`,
			method: 'GET' as const,
			headers: {
				Authorization: `Bearer ${controller.tokens.access_token}`,
				Accept: 'application/json',
			},
			body: null,
			timestamp: new Date(),
			description: 'Fetch user information using the access token',
		};

		try {
			await controller.fetchUserInfo();

			// Update API call with success response
			const updatedUserInfoApiCall: EnhancedApiCallData = {
				...userInfoApiCallData,
				response: {
					status: 200,
					statusText: 'OK',
					headers: { 'Content-Type': 'application/json' },
					data: controller.userInfo,
				},
			};

			setUserInfoApiCall(updatedUserInfoApiCall);
			v4ToastManager.showSuccess('User info fetched successfully!');
		} catch (error) {
			// Update API call with error response
			const errorApiCall: EnhancedApiCallData = {
				...userInfoApiCallData,
				response: {
					status: 401,
					statusText: 'Unauthorized',
					headers: { 'Content-Type': 'application/json' },
					error: error instanceof Error ? error.message : 'Unknown error',
				},
			};

			setUserInfoApiCall(errorApiCall);
			v4ToastManager.showError('Failed to fetch user info');
		}
	}, [controller]);

	const handleCopy = useCallback((text: string, label: string) => {
		v4ToastManager.handleCopyOperation(text, label);
		setCopiedField(label);
		setTimeout(() => setCopiedField(null), 1000);
	}, []);

	// Extract x5t parameter from JWT header
	const getX5tParameter = useCallback((token: string) => {
		try {
			const header = decodeJWTHeader(token);
			return header.x5t || header['x5t#S256'] || null;
		} catch (error) {
			console.warn('[AuthorizationCodeFlowV5] Failed to decode JWT header for x5t:', error);
			return null;
		}
	}, []);

	const navigateToTokenManagement = useCallback(() => {
		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'oauth-authorization-code-v5');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'oauth-authorization-code-v5',
			step: currentStep,
			tokens: controller.tokens,
			credentials: controller.credentials,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have tokens, pass them to Token Management
		if (controller.tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', controller.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'oauth-authorization-code-v5');
			console.log(
				'🔍 [AuthorizationCodeFlowV5] Passing access token to Token Management via localStorage'
			);
		}

		// Store flow navigation state for back navigation
		storeFlowNavigationState('oauth-authorization-code-v5', currentStep, 'oauth');

		window.open('/token-management', '_blank');
	}, [controller.tokens, controller.credentials, currentStep]);

	const navigateToTokenManagementWithRefreshToken = useCallback(() => {
		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'oauth-authorization-code-v5');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'oauth-authorization-code-v5',
			step: currentStep,
			tokens: controller.tokens,
			credentials: controller.credentials,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have refresh token, pass it to Token Management
		if (controller.tokens?.refresh_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', controller.tokens.refresh_token);
			localStorage.setItem('token_type', 'refresh');
			localStorage.setItem('flow_source', 'oauth-authorization-code-v5');
			console.log(
				'🔍 [AuthorizationCodeFlowV5] Passing refresh token to Token Management via localStorage'
			);
		}

		// Store flow navigation state for back navigation
		storeFlowNavigationState('oauth-authorization-code-v5', currentStep, 'oauth');

		window.open('/token-management', '_blank');
	}, [controller.tokens, controller.credentials, currentStep]);

	const handleResetFlow = useCallback(() => {
		controller.resetFlow();
		setCurrentStep(0);
	}, [controller]);

	const handleIntrospectToken = useCallback(
		async (token: string) => {
			// Use credentials from the controller (same as the flow uses for token exchange)
			const credentials = controller.credentials;

			console.log('🔍 [V5 Flow] Using flow credentials for introspection:', {
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
			});

			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error('Missing PingOne credentials. Please configure your credentials first.');
			}

			const request = {
				token: token,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				tokenTypeHint: 'access_token' as const,
			};

			try {
				// Use the reusable service to create API call data and execute introspection
				const result = await TokenIntrospectionService.introspectToken(
					request,
					'authorization-code',
					'/api/introspect-token'
				);

				// Set the API call data for display
				setIntrospectionApiCall(result.apiCall);

				return result.response;
			} catch (error) {
				// Create error API call using reusable service
				const errorApiCall = TokenIntrospectionService.createErrorApiCall(
					request,
					'authorization-code',
					error instanceof Error ? error.message : 'Unknown error',
					500,
					'/api/introspect-token'
				);

				setIntrospectionApiCall(errorApiCall);
				throw error;
			}
		},
		[controller.credentials]
	);

	// Step validation functions
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0: // Step 0: Introduction & Setup
					return true; // Always valid - introduction step
				case 1: // Step 1: PKCE Parameters
					return !!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge);
				case 2: // Step 2: Authorization Request
					return !!(controller.authUrl && controller.pkceCodes.codeVerifier);
				case 3: // Step 3: Authorization Response
					return !!(controller.authCode || localAuthCode);
				case 4: // Step 4: Token Exchange
					return !!controller.tokens?.access_token;
				case 5: // Step 5: Token Introspection
					return !!controller.tokens?.access_token;
				case 6: // Step 6: Flow Complete
					return true; // Always valid - completion step
				case 7: // Step 7: Security Features
					return true; // Always valid - demonstration step
				case 8: // Step 8: Flow Summary
					return true; // Always valid - flow summary step
				default:
					return false;
			}
		},
		[
			controller.pkceCodes,
			controller.authUrl,
			controller.authCode,
			localAuthCode,
			controller.tokens,
		]
	);

	// Get step completion requirements for user guidance
	const getStepRequirements = useCallback((stepIndex: number): string[] => {
		switch (stepIndex) {
			case 0: // Step 0: Introduction & Setup
				return ['Review the flow overview and setup credentials'];
			case 1: // Step 1: PKCE Parameters
				return ['Generate PKCE code verifier and code challenge'];
			case 2: // Step 2: Authorization Request
				return ['Generate authorization URL with PKCE parameters'];
			case 3: // Step 3: Authorization Response
				return ['Receive authorization code from PingOne callback'];
			case 4: // Step 4: Token Exchange
				return ['Exchange authorization code for access and refresh tokens'];
			case 5: // Step 5: Token Introspection
				return ['Introspect access token to validate and inspect claims'];
			case 6: // Step 6: Flow Complete
				return ['Flow completed successfully'];
			case 7: // Step 7: Security Features
				return ['Demonstrate advanced security implementations'];
			case 8: // Step 8: Flow Summary
				return ['Flow summary and completion overview'];
			default:
				return [];
		}
	}, []);

	const canNavigateNext = useCallback((): boolean => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	const handleNext = useCallback(() => {
		console.log('🔍 [AuthorizationCodeFlowV5] handleNext called:', {
			currentStep,
			canNavigate: canNavigateNext(),
			isStepValid: isStepValid(currentStep),
			pkceCodes: {
				hasCodeVerifier: !!controller.pkceCodes.codeVerifier,
				hasCodeChallenge: !!controller.pkceCodes.codeChallenge,
			},
			authUrl: !!controller.authUrl,
			authCode: !!(controller.authCode || localAuthCode),
		});

		if (!canNavigateNext()) {
			const stepName = STEP_METADATA[currentStep]?.title || `Step ${currentStep + 1}`;
			console.log('🚫 [AuthorizationCodeFlowV5] Navigation blocked:', stepName);
			v4ToastManager.showError(`Complete ${stepName} before proceeding to the next step.`);
			return;
		}

		console.log('✅ [AuthorizationCodeFlowV5] Navigation allowed, moving to next step');
		const next = currentStep + 1;
		setCurrentStep(next);
	}, [
		currentStep,
		canNavigateNext,
		isStepValid,
		controller.pkceCodes,
		controller.authUrl,
		controller.authCode,
		localAuthCode,
	]);

	const handlePrev = useCallback(() => {
		if (currentStep <= 0) {
			return;
		}
		const previous = currentStep - 1;
		setCurrentStep(previous);
	}, [currentStep]);

	// Handle next button click with feedback even when disabled
	const handleNextClick = useCallback(() => {
		console.log('🔍 [AuthorizationCodeFlowV5] Next button clicked');

		if (!canNavigateNext()) {
			v4ToastManager.showError(`Complete the action above to continue.`);
			return;
		}

		handleNext();
	}, [canNavigateNext, handleNext]);

	const renderFlowSummary = useCallback(() => {
		const completionConfig = {
			...FlowCompletionConfigs.authorizationCode,
			onStartNewFlow: () => {
				controller.resetFlow();
				setCurrentStep(0);
			},
			showUserInfo: false,
			showIntrospection: false
		};

		return (
			<FlowCompletionService
				config={completionConfig}
				collapsed={collapsedSections.flowSummary}
				onToggleCollapsed={() => toggleSection('flowSummary')}
			/>
		);
	}, [controller, collapsedSections.flowSummary, toggleSection]);

	const renderStepContent = useMemo(() => {
		const credentials = controller.credentials;
		const pkceCodes = controller.pkceCodes;
		const authCode = controller.authCode;
		const tokens = controller.tokens;
		const userInfo = controller.userInfo;
		const isFetchingUserInfo = controller.isFetchingUserInfo;

		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowConfigurationRequirements flowType="authorization-code" variant="oauth" />
						<CollapsibleSection
							title="Authorization Code Overview"
							isCollapsed={collapsedSections.overview}
							onToggle={() => toggleSection('overview')}
							icon={<FiInfo />}
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
								<GeneratedLabel>OAuth vs OIDC Authorization Code</GeneratedLabel>
								<ParameterGrid>
									<div style={{ gridColumn: '1 / -1' }}>
										<ParameterLabel>Tokens Returned</ParameterLabel>
										<ParameterValue>Access Token + Refresh Token (no ID Token)</ParameterValue>
									</div>
									<div style={{ gridColumn: '1 / -1' }}>
										<ParameterLabel>Purpose</ParameterLabel>
										<ParameterValue>Authorization (API access)</ParameterValue>
									</div>
									<div>
										<ParameterLabel>Spec Layer</ParameterLabel>
										<ParameterValue>Defined in OAuth 2.0</ParameterValue>
									</div>
									<div style={{ gridColumn: '1 / -1' }}>
										<ParameterLabel>Use Case</ParameterLabel>
										<ParameterValue>
											API authorization without user identity requirements
										</ParameterValue>
									</div>
								</ParameterGrid>
							</GeneratedContentBox>
						</CollapsibleSection>

						<CollapsibleSection
							title="Application Configuration & Credentials"
							isCollapsed={collapsedSections.credentials}
							onToggle={() => toggleSection('credentials')}
							icon={<FiSettings />}
						>
							<EnvironmentIdInput
								initialEnvironmentId={credentials.environmentId || ''}
								onEnvironmentIdChange={(newEnvId) => {
									handleFieldChange('environmentId', newEnvId);
									// Set default redirect URI if not already set
									if (!credentials.redirectUri) {
										handleFieldChange('redirectUri', 'http://localhost:3000/callback');
									}
								}}
								onIssuerUrlChange={() => {}}
								onDiscoveryComplete={async (result) => {
									if (result.success && result.document) {
										console.log('🎯 [OAuthAuthorizationCode] OIDC Discovery completed successfully');
										// Auto-populate environment ID if it's a PingOne issuer
										const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
										if (envId) {
											await handleFieldChange('environmentId', envId);
											// Auto-save credentials if we have both environmentId and clientId
											if (controller.credentials?.clientId?.trim()) {
												await controller.saveCredentials();
												v4ToastManager.showSuccess('Configuration auto-saved after OIDC discovery');
											}
										}
									}
								}}
								showSuggestions={true}
								autoDiscover={false}
							/>

							<SectionDivider />

							<CredentialsInput
								environmentId={credentials.environmentId || ''}
								clientId={credentials.clientId || ''}
								clientSecret={credentials.clientSecret || ''}
								redirectUri={credentials.redirectUri || ''}
								scopes={credentials.scopes || credentials.scope || ''}
								loginHint={credentials.loginHint || ''}
								onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
								onClientIdChange={(value) => handleFieldChange('clientId', value)}
								onClientSecretChange={(value) => handleFieldChange('clientSecret', value)}
								onRedirectUriChange={(value) => handleFieldChange('redirectUri', value)}
								onScopesChange={(value) => handleFieldChange('scopes', value)}
								onLoginHintChange={(value) => handleFieldChange('loginHint', value)}
								onCopy={handleCopy}
								emptyRequiredFields={emptyRequiredFields}
								copiedField={copiedField}
							/>

							<PingOneApplicationConfig value={pingOneConfig} onChange={savePingOneConfig} />

							<ActionRow>
								<Button onClick={handleSaveConfiguration} variant="primary">
									<FiSettings /> Save Configuration
								</Button>
								<Button onClick={handleClearConfiguration} variant="danger">
									<FiRefreshCw /> Clear Configuration
								</Button>
							</ActionRow>

							<InfoBox variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<strong style={{ color: '#92400e' }}>Testing vs Production</strong>
									<p style={{ color: '#92400e' }}>
										This saves credentials locally for demos only. Remove secrets before
										production.
									</p>
								</div>
							</InfoBox>
						</CollapsibleSection>

						<EnhancedFlowWalkthrough flowId="oauth-authorization-code" />

						<FlowSequenceDisplay flowType="authorization-code" />


					</>
				);

			case 1:
				return (
					<>
						<CollapsibleSection
							title="What is PKCE?"
							isCollapsed={collapsedSections.pkceOverview}
							onToggle={() => toggleSection('pkceOverview')}
							icon={<FiShield />}
						>
							<InfoBox variant="info">
								<FiShield size={20} />
								<div>
									<strong>PKCE (Proof Key for Code Exchange)</strong>
									<p>
										PKCE is a security extension for OAuth 2.0 that prevents authorization code
										interception attacks. It's required for public clients (like mobile apps)
										and highly recommended for all OAuth flows.
									</p>
								</div>
							</InfoBox>

							<InfoBox variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<strong>The Security Problem PKCE Solves</strong>
									<p>
										Without PKCE, if an attacker intercepts your authorization code (through app
										redirects, network sniffing, or malicious apps), they could exchange it for
										tokens. PKCE prevents this by requiring proof that the same client that
										started the flow is finishing it.
									</p>
								</div>
							</InfoBox>
						</CollapsibleSection>

						<CollapsibleSection
							title="Understanding Code Verifier & Code Challenge"
							isCollapsed={collapsedSections.pkceDetails}
							onToggle={() => toggleSection('pkceDetails')}
							icon={<FiKey />}
						>
							<ParameterGrid>
								<InfoBox variant="success">
									<FiKey size={20} />
									<div>
										<strong>Code Verifier</strong>
										<p>
											A high-entropy cryptographic random string (43-128 chars) that stays
											secret in your app. Think of it as a temporary password that proves you're
											the same client that started the OAuth flow.
										</p>
										<ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', lineHeight: '1.5' }}>
											<li>Generated fresh for each OAuth request</li>
											<li>Uses characters: A-Z, a-z, 0-9, -, ., _, ~</li>
											<li>Never sent in the authorization request</li>
											<li>Only revealed during token exchange</li>
										</ul>
									</div>
								</InfoBox>

								<InfoBox variant="info">
									<FiShield size={20} />
									<div>
										<strong>Code Challenge</strong>
										<p>
											A SHA256 hash of the code verifier, encoded in base64url format. This is
											sent publicly in the authorization URL but can't be reversed to get the
											original verifier.
										</p>
										<ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', lineHeight: '1.5' }}>
											<li>Derived from: SHA256(code_verifier)</li>
											<li>Encoded in base64url (URL-safe)</li>
											<li>Safe to include in authorization URLs</li>
											<li>Used by PingOne to verify the verifier later</li>
										</ul>
									</div>
								</InfoBox>
							</ParameterGrid>

							<InfoBox variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<strong>Security Best Practices</strong>
									<ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', lineHeight: '1.5' }}>
										<li>
											<strong>Generate Fresh Values:</strong> Create new PKCE parameters for
											every authorization request
										</li>
										<li>
											<strong>Secure Storage:</strong> Keep the code verifier in memory or
											secure storage, never log it
										</li>
										<li>
											<strong>Use S256 Method:</strong> Always use SHA256 hashing
											(code_challenge_method=S256)
										</li>
										<li>
											<strong>Sufficient Entropy:</strong> Use at least 43 characters of
											high-entropy randomness
										</li>
									</ul>
								</div>
							</InfoBox>
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Generate PKCE Parameters
							</ResultsHeading>
							<HelperText>
								Generate fresh PKCE values for this authorization request. These will be used to
								secure the code exchange and prevent interception attacks.
							</HelperText>
							{pkceCodes.codeVerifier ? (
								<GeneratedContentBox>
									<GeneratedLabel>Generated</GeneratedLabel>
									<ParameterGrid>
										<div>
											<ParameterLabel>Code Verifier</ParameterLabel>
											<ParameterValue>{pkceCodes.codeVerifier}</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Code Challenge</ParameterLabel>
											<ParameterValue>{pkceCodes.codeChallenge}</ParameterValue>
										</div>
									</ParameterGrid>
									<ActionRow>
										<Button
											onClick={() => handleCopy(pkceCodes.codeVerifier, 'Code Verifier')}
											$variant="secondary"
										>
											<FiCopy /> Copy Verifier
										</Button>
										<Button
											onClick={() => handleCopy(pkceCodes.codeChallenge, 'Code Challenge')}
											$variant="secondary"
										>
											<FiCopy /> Copy Challenge
										</Button>
										<HighlightedActionButton onClick={handleGeneratePkce} $priority="primary">
											<FiRefreshCw /> Regenerate
										</HighlightedActionButton>
									</ActionRow>
								</GeneratedContentBox>
							) : (
								<HighlightedActionButton
									onClick={handleGeneratePkce}
									$priority="primary"
									disabled={
										!controller.credentials.clientId || !controller.credentials.environmentId
									}
									title={
										!controller.credentials.clientId || !controller.credentials.environmentId
											? 'Fill in Client ID and Environment ID first'
											: 'Generate PKCE parameters'
									}
								>
									<FiRefreshCw />{' '}
									{!controller.credentials.clientId || !controller.credentials.environmentId
										? 'Complete above action'
										: 'Generate PKCE'}
								</HighlightedActionButton>
							)}
						</ResultsSection>
					</>
				);

			case 2:
				return (
					<>
						<CollapsibleSection
							title="Understanding Authorization Requests"
							isCollapsed={collapsedSections.authRequestOverview}
							onToggle={() => toggleSection('authRequestOverview')}
							icon={<FiGlobe />}
						>
							<InfoBox variant="info">
								<FiGlobe size={20} />
								<div>
									<strong>What is an Authorization Request?</strong>
									<p>
										An authorization request redirects users to PingOne's authorization server
										where they authenticate and consent to sharing their information with your
										application. This is the first step in obtaining an authorization code.
									</p>
								</div>
							</InfoBox>

							<InfoBox variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<strong>Critical Security Considerations</strong>
									<ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem', lineHeight: '1.5' }}>
										<li>
											<strong>State Parameter:</strong> Always include a unique state parameter
											to prevent CSRF attacks
										</li>
										<li>
											<strong>HTTPS Only:</strong> Authorization requests must use HTTPS in
											production
										</li>
										<li>
											<strong>Validate Redirect URI:</strong> Ensure redirect_uri exactly
											matches what's registered in PingOne
										</li>
										<li>
											<strong>Scope Limitation:</strong> Only request the minimum scopes your
											application needs
										</li>
									</ul>
								</div>
							</InfoBox>
						</CollapsibleSection>

						<CollapsibleSection
							title="Authorization URL Parameters Deep Dive"
							isCollapsed={collapsedSections.authRequestDetails}
							onToggle={() => toggleSection('authRequestDetails')}
							icon={<FiKey />}
						>
							<ParameterGrid>
								<InfoBox variant="info">
									<FiKey size={20} />
									<div>
										<InfoTitle>Required Parameters</InfoTitle>
										<InfoList>
											<li>
												<strong>response_type=code:</strong> Tells PingOne you want an
												authorization code (not tokens)
											</li>
											<li>
												<strong>client_id:</strong> Your application's unique identifier in
												PingOne
											</li>
											<li>
												<strong>redirect_uri:</strong> Exact URL where PingOne sends the user
												back
											</li>
											<li>
												<strong>scope:</strong> Permissions you're requesting (openid, profile,
												email, etc.)
											</li>
										</InfoList>
									</div>
								</InfoBox>

								<InfoBox variant="success">
									<FiShield size={20} />
									<div>
										<InfoTitle>Security Parameters</InfoTitle>
										<InfoList>
											<li>
												<strong>state:</strong> Random value to prevent CSRF attacks and
												maintain session state
											</li>
											<li>
												<strong>code_challenge:</strong> PKCE parameter for secure code exchange
											</li>
											<li>
												<strong>code_challenge_method:</strong> Always "S256" for SHA256 hashing
											</li>
											<li>
												<strong>nonce:</strong> (OIDC) Random value to prevent replay attacks on
												ID tokens
											</li>
										</InfoList>
									</div>
								</InfoBox>
							</ParameterGrid>

							<InfoBox variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Optional But Recommended Parameters</InfoTitle>
									<InfoList>
										<li>
											<strong>prompt:</strong> Controls authentication behavior (none, login,
											consent, select_account)
										</li>
										<li>
											<strong>max_age:</strong> Maximum age of authentication session before
											re-auth required
										</li>
										<li>
											<strong>acr_values:</strong> Requested Authentication Context Class
											Reference values
										</li>
										<li>
											<strong>login_hint:</strong> Hint about the user identifier (email,
											username)
										</li>
									</InfoList>
								</div>
							</InfoBox>

							<InfoBox variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>Authorization URL Parameters</InfoTitle>
									<InfoText>The authorization URL includes these key parameters:</InfoText>
									<ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
										<li>
											<strong>response_type=code</strong> - Authorization Code flow
										</li>
										<li>
											<strong>client_id</strong> - Your PingOne application ID
										</li>
										<li>
											<strong>redirect_uri</strong> - Where to return after authorization
										</li>
										<li>
											<strong>scope</strong> - Permissions requested (openid, profile, email)
										</li>
										<li>
											<strong>state</strong> - CSRF protection token
										</li>
										<li>
											<strong>code_challenge</strong> - PKCE challenge (SHA256 hash)
										</li>
										<li>
											<strong>code_challenge_method=S256</strong> - PKCE method
										</li>
									</ul>
								</div>
							</InfoBox>
						</CollapsibleSection>

						<CollapsibleSection
							title="Response Mode Configuration"
							isCollapsed={collapsedSections.responseMode}
							onToggle={() => toggleSection('responseMode')}
							icon={<FiSettings />}
						>
							<InfoBox variant="info">
								<FiSettings size={20} />
								<div>
									<div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
										Response Mode Selection
									</div>
									<div style={{ fontSize: '0.95rem', color: '#3f3f46', lineHeight: '1.7', margin: '0' }}>
										Choose how the authorization response should be returned to your application.
										This affects how the authorization code and other parameters are delivered.
									</div>
								</div>
							</InfoBox>
							<ResponseModeSelector
								selectedMode={(controller.credentials.responseMode as ResponseMode) || 'query'}
								onModeChange={(mode) => {
									controller.setCredentials({
										...controller.credentials,
										responseMode: mode,
									});
								}}
								responseType="code"
								clientType="confidential"
								platform="web"
								showRecommendations={true}
								showUrlExamples={true}
							/>
						</CollapsibleSection>

						<SectionDivider />


						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Build Your Authorization URL
							</ResultsHeading>
							<HelperText>
								Generate the authorization URL with all required parameters. Review it carefully
								before redirecting users to ensure all parameters are correct.
							</HelperText>

							<ActionRow>
								<Button
									variant="primary"
									size="lg"
									disabled={
										!!controller.authUrl ||
										!controller.pkceCodes.codeVerifier ||
										!controller.pkceCodes.codeChallenge
									}
									onClick={handleGenerateAuthUrl}
									style={{
										position: 'relative',
										background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
										boxShadow: '0 6px 18px rgba(59, 130, 246, 0.35)',
										color: '#ffffff',
										paddingRight: '2.5rem'
									}}
									title={
										!controller.pkceCodes.codeVerifier || !controller.pkceCodes.codeChallenge
											? 'Generate PKCE parameters first'
											: controller.authUrl
												? 'Authorization URL already generated'
												: 'Generate authorization URL'
									}
								>
									{controller.authUrl ? <FiCheckCircle /> : <FiExternalLink />}{' '}
									{controller.authUrl
										? 'Authorization URL Generated'
										: !controller.pkceCodes.codeVerifier || !controller.pkceCodes.codeChallenge
											? 'Complete above action'
											: 'Generate Authorization URL'}
									<HighlightBadge>1</HighlightBadge>
								</Button>

								{controller.authUrl && (
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<Button
											variant="success"
											size="lg"
											onClick={handleOpenAuthUrl}
											style={{
												position: 'relative',
												background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
												boxShadow: '0 6px 18px rgba(34, 197, 94, 0.35)',
												color: '#ffffff',
												paddingRight: '2.5rem'
											}}
										>
											<FiExternalLink /> Redirect to PingOne
											<HighlightBadge>2</HighlightBadge>
										</Button>
										<span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
											(Open Authorization URL)
										</span>
									</div>
								)}
							</ActionRow>

							{controller.authUrl ? (
								<ColoredUrlDisplay
									url={controller.authUrl}
									label="Generated Authorization URL"
									showCopyButton={true}
									showInfoButton={true}
									showOpenButton={true}
									onOpen={() => window.open(controller.authUrl!, '_blank')}
									height="120px"
								/>
							) : (
								<HelperText>Generate an authorization URL above to continue to PingOne.</HelperText>
							)}
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection
							title="Authorization Response Overview"
							isCollapsed={collapsedSections.authResponseOverview}
							onToggle={() => toggleSection('authResponseOverview')}
							icon={<FiCheckCircle />}
						>
							<InfoBox variant="success">
								<FiCheckCircle size={20} />
								<div>
									<div style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
										Authorization Response
									</div>
									<div style={{ fontSize: '0.95rem', color: '#3f3f46', lineHeight: '1.7', margin: '0' }}>
										After authentication, PingOne returns you to the redirect URI with an
										authorization code or error message.
									</div>
								</div>
							</InfoBox>
						</CollapsibleSection>

						<CollapsibleSection
							title="Authorization Code Details"
							isCollapsed={collapsedSections.authResponseDetails}
							onToggle={() => toggleSection('authResponseDetails')}
							icon={<FiKey />}
						>
							<ResultsSection>
								<div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
									<FiCheckCircle size={18} /> Authorization Code
								</div>
								<div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0 1rem 0', lineHeight: '1.5' }}>
									Use the authorization code immediately—it expires quickly. Copy it if you need
									to inspect the token exchange request.
								</div>
								{authCode ? (
									<div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', margin: '1.5rem 0' }}>
										<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>Received</div>
										<ParameterGrid>
											<div>
												<div style={{ fontWeight: '500', color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Authorization Code</div>
												<div style={{ fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace', fontSize: '0.875rem', color: '#1f2937', wordBreak: 'break-all', background: '#f9fafb', padding: '0.5rem', borderRadius: '0.375rem' }}>{authCode}</div>
											</div>
										</ParameterGrid>
										<ActionRow>
											<Button
												variant="outline"
												onClick={() => handleCopy(authCode, 'Authorization Code')}
											>
												<FiCopy /> Copy Code
											</Button>
											<Button
												variant="success"
												size="lg"
												onClick={handleNextClick}
												disabled={!canNavigateNext()}
												style={{
													position: 'relative',
													background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
													boxShadow: '0 6px 18px rgba(34, 197, 94, 0.35)',
													color: '#ffffff',
													paddingRight: '2.5rem'
												}}
												title={
													!canNavigateNext()
														? `Complete the action above to continue`
														: 'Proceed to next step'
												}
											>
												{isStepValid(currentStep)
													? 'Continue to Token Exchange'
													: 'Complete above action'}{' '}
												<FiArrowRight />
											</Button>
										</ActionRow>
									</div>
								) : (
									<div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
										<div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#d1d5db' }}>
											<FiAlertCircle />
										</div>
										<div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', margin: '0 0 0.5rem 0' }}>
											Authorization Code Not Received
										</div>
										<div style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>
											No authorization code detected. You can paste one manually for testing.
										</div>
										<form style={{ maxWidth: '400px', margin: '0 auto' }}>
											<label
												htmlFor={manualAuthCodeId}
												style={{
													display: 'block',
													fontSize: '0.875rem',
													fontWeight: '600',
													color: '#374151',
													marginBottom: '0.5rem',
												}}
											>
												Manual Authorization Code
											</label>
											<input
												id={manualAuthCodeId}
												type="text"
												placeholder="Enter authorization code manually"
												value={authCode}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const value = e.target.value;
													if (value) {
														controller.setAuthCodeManually(value);
													}
												}}
												style={{
													width: '100%',
													padding: '0.75rem',
													border: '1px solid #d1d5db',
													borderRadius: '0.5rem',
													fontSize: '0.875rem',
													backgroundColor: '#ffffff',
													marginBottom: '1rem',
												}}
											/>
										</form>
									</div>
								)}
							</ResultsSection>
						</CollapsibleSection>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection
							title="Token Exchange Overview"
							isCollapsed={collapsedSections.tokenExchangeOverview}
							onToggle={() => toggleSection('tokenExchangeOverview')}
							icon={<FiKey />}
						>
							<ExplanationSection>
								<ExplanationHeading>
									<FiKey /> Exchange Authorization Code for Tokens
								</ExplanationHeading>
								<div style={{ fontSize: '0.95rem', color: '#3f3f46', lineHeight: '1.7', margin: '0' }}>
									Call the backend token exchange endpoint to swap the authorization code for
									access and ID tokens.
								</div>
							</ExplanationSection>
						</CollapsibleSection>

						<CollapsibleSection
							title="Token Exchange Details"
							isCollapsed={collapsedSections.tokenExchangeDetails}
							onToggle={() => toggleSection('tokenExchangeDetails')}
							icon={<FiRefreshCw />}
						>
									{/* Display Authorization Code if available */}
									{(controller.authCode || localAuthCode) && (
										<ResultsSection>
											<ResultsHeading>
												<FiCheckCircle size={18} /> Authorization Code Received
											</ResultsHeading>
											<HelperText>
												The authorization code has been received and is ready for token exchange.
											</HelperText>
											<GeneratedContentBox>
												<GeneratedLabel>Authorization Code</GeneratedLabel>
												<ParameterGrid>
													<div>
														<div style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Code</div>
														<div style={{ fontFamily: 'monospace', wordBreak: 'break-all', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>{controller.authCode || localAuthCode}</div>
													</div>
												</ParameterGrid>
												<ActionRow>
													<Button
														onClick={() => {
															const codeToCopy = controller.authCode || localAuthCode;
															if (codeToCopy) {
																handleCopy(codeToCopy, 'Authorization Code');
															}
														}}
														variant="outline"
													>
														<FiCopy /> Copy Code
													</Button>
												</ActionRow>
											</GeneratedContentBox>
										</ResultsSection>
									)}

									<div style={{ display: 'flex', justifyContent: 'center' }}>
										<HighlightedActionButton
											onClick={handleExchangeTokens}
											$priority="primary"
											disabled={!(controller.authCode || localAuthCode)}
										>
											<FiRefreshCw /> Exchange Authorization Code for Tokens Again
										</HighlightedActionButton>
									</div>

									<SectionDivider />

									{/* API Call Display for Token Exchange */}
									{tokenExchangeApiCall && (
										<EnhancedApiCallDisplay
											apiCall={tokenExchangeApiCall}
											options={{
												showEducationalNotes: true,
												showFlowContext: true,
												urlHighlightRules:
													EnhancedApiCallDisplayService.getDefaultHighlightRules(
														'authorization-code'
													),
											}}
										/>
									)}

									{tokens && (
										<ResultsSection>
											<ResultsHeading>
												<FiCheckCircle size={18} /> Token Response
											</ResultsHeading>
											<HelperText>
												Review the raw token response. Copy the JSON or open the token management
												tooling to inspect each token.
											</HelperText>
											<GeneratedContentBox>
												<GeneratedLabel>Raw Token Response</GeneratedLabel>
												<CodeBlock>{JSON.stringify(tokens, null, 2)}</CodeBlock>
												<div style={{ display: 'flex', marginBottom: '1rem' }}>
													<Button
														onClick={() =>
															handleCopy(JSON.stringify(tokens, null, 2), 'Token Response')
														}
														variant="primary"
													>
														<FiCopy /> Copy JSON Response
													</Button>
												</div>
											</GeneratedContentBox>

											<GeneratedContentBox style={{ marginTop: '1rem' }}>
												<GeneratedLabel>Tokens Received</GeneratedLabel>

												{/* Enhanced JWT Token Display */}
												{tokens.access_token && (
													<JWTTokenDisplay
														token={String(tokens.access_token)}
														tokenType={tokens.token_type || 'Bearer'}
														{...(tokens.expires_in && { expiresIn: tokens.expires_in })}
														{...(tokens.scope && { scope: tokens.scope })}
														onCopy={handleCopy}
													/>
												)}

												{/* Refresh Token Display */}
												{tokens.refresh_token && (
													<div style={{ marginTop: '1rem' }}>
														<div style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Refresh Token</div>
														<div style={{ fontFamily: 'monospace', wordBreak: 'break-all', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
															{String(tokens.refresh_token)}
														</div>
														<Button
															onClick={() =>
																handleCopy(String(tokens.refresh_token), 'Refresh Token')
															}
															variant="primary"
														>
															<FiCopy /> Copy Refresh Token
														</Button>
													</div>
												)}

												{/* Additional Token Information */}
												<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
													{tokens.token_type && (
														<div>
															<div style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Token Type</div>
															<div style={{ fontFamily: 'monospace', wordBreak: 'break-all', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>{String(tokens.token_type)}</div>
														</div>
													)}
													{tokens.scope && (
														<div>
															<div style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Scope</div>
															<div style={{ fontFamily: 'monospace', wordBreak: 'break-all', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>{String(tokens.scope)}</div>
														</div>
													)}
													{tokens.expires_in && (
														<div>
															<div style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Expires In</div>
															<div style={{ fontFamily: 'monospace', wordBreak: 'break-all', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>{String(tokens.expires_in)} seconds</div>
														</div>
													)}
													{tokens.access_token && getX5tParameter(String(tokens.access_token)) && (
														<div>
															<div style={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>x5t (Certificate Thumbprint)</div>
															<div style={{ fontFamily: 'monospace', wordBreak: 'break-all', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
																{getX5tParameter(String(tokens.access_token))}
															</div>
														</div>
													)}
												</div>
												{/* Token Management Buttons */}
												<div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
													<Button onClick={navigateToTokenManagement} variant="primary">
														<FiExternalLink /> View in Token Management
													</Button>
													{tokens.access_token && (
														<Button
															onClick={navigateToTokenManagement}
															variant="primary"
														>
															<FiKey /> Decode Access Token
														</Button>
													)}
													{tokens.refresh_token && (
														<Button
															onClick={navigateToTokenManagementWithRefreshToken}
															variant="primary"
														>
															<FiRefreshCw /> Decode Refresh Token
														</Button>
													)}
												</div>
											</GeneratedContentBox>

											{/* Code Examples for Token Exchange Step */}
											{tokens.access_token && (
												<div style={{ marginTop: '2rem' }}>
													<CodeExamplesDisplay
														flowType="authorization-code"
														stepId="step3"
														config={{
															baseUrl: 'https://auth.pingone.com',
															clientId: credentials?.clientId || '',
															clientSecret: credentials?.clientSecret || '',
															redirectUri: credentials?.redirectUri || '',
															scopes: credentials?.scopes?.split(' ') || [
																'openid',
																'profile',
																'email',
															],
															environmentId: credentials?.environmentId || '',
														}}
													/>
												</div>
											)}
										</ResultsSection>
									)}
						</CollapsibleSection>
					</>
				);

			case 5:
				return (
					<>
						<TokenIntrospect
							flowName="OAuth 2.0 Authorization Code Flow"
							flowVersion="V5"
							tokens={controller.tokens as unknown as Record<string, unknown>}
							credentials={controller.credentials as unknown as Record<string, unknown>}
							userInfo={userInfo}
							onFetchUserInfo={handleFetchUserInfo}
							isFetchingUserInfo={isFetchingUserInfo}
							onResetFlow={handleResetFlow}
							onNavigateToTokenManagement={navigateToTokenManagement}
							onIntrospectToken={handleIntrospectToken}
							collapsedSections={{
								completionOverview: collapsedSections.completionOverview,
								completionDetails: collapsedSections.completionDetails,
								introspectionDetails: collapsedSections.introspectionDetails,
								rawJson: false, // Show raw JSON expanded by default
							}}
							onToggleSection={(section) => {
								if (section === 'completionOverview' || section === 'completionDetails') {
									toggleSection(section as IntroSectionKey);
								}
							}}
							completionMessage="Nice work! You successfully completed the OAuth 2.0 Authorization Code Flow with PKCE using reusable V5 components."
							nextSteps={[
								'Inspect or decode tokens using the Token Management tools.',
								'Repeat the flow with different scopes or redirect URIs.',
								'Explore refresh tokens and introspection flows.',
							]}
						/>

						{/* API Call Display for Token Introspection */}
						{introspectionApiCall && (
							<EnhancedApiCallDisplay
								apiCall={introspectionApiCall}
								options={{
									showEducationalNotes: true,
									showFlowContext: true,
									urlHighlightRules:
										EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code'),
								}}
							/>
						)}

						{/* API Call Display for UserInfo Request */}
						{userInfoApiCall && (
							<EnhancedApiCallDisplay
								apiCall={userInfoApiCall}
								options={{
									showEducationalNotes: true,
									showFlowContext: true,
									urlHighlightRules:
										EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code'),
								}}
							/>
						)}
					</>
				);

			case 6:
				return (
					<>
						<TokenIntrospect
							flowName="OAuth 2.0 Authorization Code Flow"
							flowVersion="V5"
							tokens={controller.tokens as unknown as Record<string, unknown>}
							credentials={controller.credentials as unknown as Record<string, unknown>}
							onResetFlow={handleResetFlow}
							onNavigateToTokenManagement={navigateToTokenManagement}
							onIntrospectToken={handleIntrospectToken}
							collapsedSections={{
								completionOverview: collapsedSections.completionOverview,
								completionDetails: collapsedSections.completionDetails,
								introspectionDetails: collapsedSections.introspectionDetails,
								rawJson: false,
							}}
							onToggleSection={(section) => {
								if (section === 'completionOverview' || section === 'completionDetails') {
									toggleSection(section as IntroSectionKey);
								}
							}}
							completionMessage="Nice work! You successfully completed the OAuth 2.0 Authorization Code Flow with PKCE using reusable V5 components."
							nextSteps={[
								'Inspect or decode tokens using the Token Management tools.',
								'Note: No UserInfo endpoint in OAuth (use OIDC for user identity).',
								'Repeat the flow with different scopes or redirect URIs.',
								'Explore refresh tokens and introspection flows.',
							]}
						/>

						{/* API Call Display for Token Introspection */}
						{introspectionApiCall && (
							<EnhancedApiCallDisplay
								apiCall={introspectionApiCall}
								options={{
									showEducationalNotes: true,
									showFlowContext: true,
									urlHighlightRules:
										EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code'),
								}}
							/>
						)}
					</>
				);

			case 7:
				return (
					<SecurityFeaturesDemo
						tokens={controller.tokens as unknown as Record<string, unknown> | null}
						credentials={controller.credentials as unknown as Record<string, unknown>}
						onTerminateSession={() => {
							console.log('🚪 Session terminated via SecurityFeaturesDemo');
							v4ToastManager.showSuccess('Session termination completed.');
						}}
						onRevokeTokens={() => {
							console.log('❌ Tokens revoked via SecurityFeaturesDemo');
							v4ToastManager.showSuccess('Token revocation completed.');
						}}
					/>
				);

			case 8:
				return renderFlowSummary();

			default:
				return null;
		}
	}, [
		collapsedSections,
		controller.authUrl,
		controller.authCode,
		controller.credentials,
		controller.pkceCodes,
		controller.tokens,
		currentStep,
		handleCopy,
		handleExchangeTokens,
		handleFetchUserInfo,
		handleGenerateAuthUrl,
		handleGeneratePkce,
		navigateToTokenManagement,
		navigateToTokenManagementWithRefreshToken,
		stepCompletions,
		toggleSection,
		canNavigateNext,
		controller.setAuthCodeManually,
		emptyRequiredFields.has,
		handleClearConfiguration,
		handleFieldChange,
		handleNextClick,
		handleOpenAuthUrl,
		handleResetFlow,
		handleSaveConfiguration,
		handleIntrospectToken,
		isStepValid,
		localAuthCode,
		pingOneConfig,
		savePingOneConfig,
		manualAuthCodeId,
		getX5tParameter,
		emptyRequiredFields,
		copiedField,
		showSavedSecret,
		controller.isFetchingUserInfo,
		controller.userInfo,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oauth-authorization-code-v5" />

				<EnhancedFlowInfoCard
					flowType="oauth-authorization-code"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Authorization Code Flow · V5</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of 08</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					{/* Step Requirements Indicator */}
					{!isStepValid(currentStep) && currentStep !== 0 && (
						<RequirementsIndicator>
							<RequirementsIcon>
								<FiAlertCircle />
							</RequirementsIcon>
							<RequirementsText>
								<strong>Complete this step to continue:</strong>
								<ul>
									{getStepRequirements(currentStep).map((requirement, index) => (
										<li key={index}>{requirement}</li>
									))}
								</ul>
							</RequirementsText>
						</RequirementsIndicator>
					)}
					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrev}
				onReset={handleResetFlow}
				onNext={handleNextClick}
				canNavigateNext={canNavigateNext()}
				isFirstStep={currentStep === 0}
				nextButtonText={isStepValid(currentStep) ? 'Next' : 'Complete above action'}
				disabledMessage="Complete the action above to continue"
			/>

			<Modal $show={showRedirectModal}>
				<ModalContent>
					<ModalIcon>
						<FiExternalLink />
					</ModalIcon>
					<ModalTitle>Redirecting to PingOne</ModalTitle>
					<ModalText>Launching the PingOne authorization experience in a new tab…</ModalText>
				</ModalContent>
			</Modal>

			<LoginSuccessModal
				isOpen={showLoginSuccessModal}
				onClose={() => {
					console.log('🔴 [AuthorizationCodeFlowV5] Closing LoginSuccessModal', {
						currentStep,
						hasAuthCode: !!(controller.authCode || localAuthCode),
						storedStep: sessionStorage.getItem('oauth-authorization-code-v5-current-step'),
					});
					setShowLoginSuccessModal(false);
					// Ensure we stay on step 4 after modal closes
					if (currentStep !== 4) {
						console.log('🔧 [AuthorizationCodeFlowV5] Correcting step to 4 after modal close');
						setCurrentStep(4);
						sessionStorage.setItem('oauth-authorization-code-v5-current-step', '4');
					}
				}}
				title="Login Successful!"
				message="You have been successfully authenticated with PingOne. Your authorization code has been received and you can now proceed to exchange it for tokens."
				autoCloseDelay={5000}
			/>
		</Container>
	);
};

export default OAuthAuthorizationCodeFlowV5;
