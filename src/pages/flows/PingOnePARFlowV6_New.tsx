// src/pages/flows/OAuthAuthorizationCodeFlowV5.tsx
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { usePageScroll } from '../../hooks/usePageScroll';
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
import { default as LegacyConfigurationSummaryCard } from '../../components/ConfigurationSummaryCard';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import LoginSuccessModal from '../../components/LoginSuccessModal';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { ConfigurationSummaryCard, ConfigurationSummaryService } from '../../services/configurationSummaryService';
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
import { EnhancedApiCallDisplayService, EnhancedApiCallData } from '../../services/enhancedApiCallDisplayService';
import { TokenIntrospectionService, IntrospectionApiCallData } from '../../services/tokenIntrospectionService';
import { decodeJWTHeader } from '../../utils/jwks';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { CopyButtonService } from '../../services/copyButtonService';
import AuthorizationCodeSharedService from '../../services/authorizationCodeSharedService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import { getFlowSequence } from '../../services/flowSequenceService';
import {
	STEP_METADATA,
	type IntroSectionKey,
	DEFAULT_APP_CONFIG,
	PAR_EDUCATION,
} from './config/PingOnePARFlow.config';

type StepCompletionState = Record<number, boolean>;

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

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #14532d;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	${() => themeService.getCollapseIconStyles()}
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s ease;

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(0deg) scale(1.1)' : 'rotate(180deg) scale(1.1)'};
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #334155;
	line-height: 1.5;
	margin: 0.5rem 0 0;
	padding-left: 1.5rem;
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

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #16a34a;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background-color: #f0fdf4;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #bbf7d0;
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`;

const Button = styled.button<{
	$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.disabled ? 0.6 : 1)};

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #22c55e;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #16a34a;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #16a34a;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #15803d;
		}
	`}

	${({ $variant }) =>
		$variant === 'secondary' &&
		`
		background-color: #0ea5e9;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #0284c7;
		}
	`}

	${({ $variant }) =>
		$variant === 'danger' &&
		`
		background-color: #ef4444;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #dc2626;
		}
	`}

	${({ $variant }) =>
		$variant === 'outline' &&
		`
		background-color: transparent;
		color: #14532d;
		border-color: #bbf7d0;
		&:hover:not(:disabled) {
			background-color: #f0fdf4;
			border-color: #22c55e;
		}
	`}
`;

const HighlightedActionButton = styled(Button)<{ $priority: 'primary' | 'success' }>`
	position: relative;
	background:
		${({ $priority }) =>
			$priority === 'primary'
				? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
				: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
	box-shadow:
		${({ $priority }) =>
			$priority === 'primary'
				? '0 6px 18px rgba(34, 197, 94, 0.35)'
				: '0 6px 18px rgba(16, 185, 129, 0.35)'};
	color: #ffffff;
	padding-right: 2.5rem;

	&:hover {
		transform: scale(1.02);
	}

	&:disabled {
		background:
			${({ $priority }) =>
				$priority === 'primary'
					? 'linear-gradient(135deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.6) 100%)'
					: 'linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(5,150,105,0.6) 100%)'};
		box-shadow: none;
	}
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

const GeneratedUrlDisplay = styled.div`
	background-color: #ecfdf3;
	border: 1px solid #bbf7d0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.9rem;
	word-break: break-all;
	position: relative;
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

const EmptyState = styled.div`
	text-align: center;
	padding: 3rem 2rem;
	color: #166534;
`;

const EmptyIcon = styled.div`
	width: 4rem;
	height: 4rem;
	border-radius: 50%;
	background-color: #ecfdf3;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	font-size: 1.5rem;
	color: #16a34a;
`;

const EmptyTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #14532d;
	margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
	font-size: 0.875rem;
	color: #166534;
	margin-bottom: 1rem;
`;

const PingOnePARFlowV6: React.FC = () => {
	console.log('🚀 [PingOnePARFlowV6] Component loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	// Scroll to top on page load
	usePageScroll({ pageName: 'PingOne PAR Flow V6', force: true });

	const manualAuthCodeId = useId();
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'pingone-par-v6',
		defaultFlowVariant: 'oidc',
		enableDebugger: true,
	});

	const [currentStep, setCurrentStep] = useState(
		AuthorizationCodeSharedService.StepRestoration.getInitialStep()
	);
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
	const [emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
	const [collapsedSections, setCollapsedSections] = useState(
		AuthorizationCodeSharedService.CollapsibleSections.getDefaultState()
	);
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
	const [localAuthCode, setLocalAuthCode] = useState<string | null>(null);
	const [showSavedSecret, setShowSavedSecret] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [completionCollapsed, setCompletionCollapsed] = useState(false);
	
	// API call tracking for display
	const [tokenExchangeApiCall, setTokenExchangeApiCall] = useState<EnhancedApiCallData | null>(null);
	const [userInfoApiCall, setUserInfoApiCall] = useState<EnhancedApiCallData | null>(null);
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(null);

	// Scroll to top on step change
	useEffect(() => {
		AuthorizationCodeSharedService.StepRestoration.scrollToTopOnStepChange();
	}, [currentStep]);

	// Enforce correct response_type for OAuth (should be 'code')
	useEffect(() => {
		AuthorizationCodeSharedService.ResponseTypeEnforcer.enforceResponseType(
			'oauth',
			controller.credentials,
			controller.setCredentials
		);
	}, [controller.credentials.responseType, controller]);

	// Sync credentials from controller to local state
	useEffect(() => {
		if (controller.credentials) {
			AuthorizationCodeSharedService.CredentialsSync.syncCredentials(
				'oauth',
				controller.credentials,
				controller.setCredentials
			);
		}
	}, [controller]);

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

	const toggleSection = AuthorizationCodeSharedService.CollapsibleSections.createToggleHandler(
		setCollapsedSections
	);

	const handleFieldChange = useCallback(
		(field: keyof StepCredentials, value: string) => {
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
		await AuthorizationCodeSharedService.PKCE.generatePKCE(
			'oauth',
			controller.credentials,
			controller
		);
	}, [controller]);

	const handleGenerateAuthUrl = useCallback(async () => {
		await AuthorizationCodeSharedService.Authorization.generateAuthUrl(
			'oauth',
			controller.credentials,
			controller
		);
	}, [controller]);

	const handleOpenAuthUrl = useCallback(() => {
		if (AuthorizationCodeSharedService.Authorization.openAuthUrl(controller.authUrl)) {
			console.log('🔧 [AuthorizationCodeFlowV5] About to redirect to PingOne via controller...');
			controller.handleRedirectAuthorization();
			setShowRedirectModal(true);
			setTimeout(() => setShowRedirectModal(false), 2000);
		}
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
				'Accept': 'application/json'
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
				...(controller.credentials.includeX5tParameter && { includeX5tParameter: controller.credentials.includeX5tParameter })
			},
			timestamp: new Date(),
			description: 'Exchange authorization code for access token and refresh token'
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
					data: controller.tokens
				}
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
					error: error instanceof Error ? error.message : 'Unknown error'
				}
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
			url: controller.credentials.userInfoEndpoint || `https://auth.pingone.com/${controller.credentials.environmentId}/as/userinfo`,
			method: 'GET' as const,
			headers: {
				'Authorization': `Bearer ${controller.tokens.access_token}`,
				'Accept': 'application/json'
			},
			body: null,
			timestamp: new Date(),
			description: 'Fetch user information using the access token'
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
					data: controller.userInfo
				}
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
					error: error instanceof Error ? error.message : 'Unknown error'
				}
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
		AuthorizationCodeSharedService.TokenManagement.navigateToTokenManagement(
			'oauth',
			controller.tokens,
			controller.credentials,
			currentStep
		);
		
		// Additional component-specific logic for access token
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
		AuthorizationCodeSharedService.TokenManagement.navigateToTokenManagement(
			'oauth',
			controller.tokens,
			controller.credentials,
			currentStep
		);
		
		// Additional component-specific logic for refresh token
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
				tokenTypeHint: 'access_token' as const
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
						<FlowConfigurationRequirements flowType="authorization-code" variant="oidc" />
						
						{/* PAR Educational Callout Box */}
						<InfoBox $variant="info" style={{ marginBottom: '1.5rem', background: '#dbeafe', borderColor: '#3b82f6' }}>
							<FiShield size={24} style={{ color: '#1d4ed8' }} />
							<div>
								<InfoTitle style={{ color: '#1e40af', fontSize: '1.125rem' }}>PAR = Enhanced Security via Back-Channel (RFC 9126)</InfoTitle>
								<InfoText style={{ color: '#1e3a8a', marginBottom: '0.75rem' }}>
									{PAR_EDUCATION.overview.description}
								</InfoText>
								<InfoList style={{ color: '#1e3a8a' }}>
									{PAR_EDUCATION.overview.benefits.map((benefit, index) => (
										<li key={index}>{benefit}</li>
									))}
								</InfoList>
								<HelperText style={{ color: '#1e3a8a', fontWeight: 600, marginTop: '0.75rem' }}>
									📋 <strong>How PAR Works:</strong> {PAR_EDUCATION.howItWorks.steps.join(' → ')}
								</HelperText>
								<HelperText style={{ color: '#1e3a8a', fontWeight: 600, marginTop: '0.5rem' }}>
									<strong>Use Cases:</strong> {PAR_EDUCATION.useCases.join(' | ')}
								</HelperText>
								<HelperText style={{ color: '#059669', fontWeight: 700, marginTop: '0.5rem', padding: '0.5rem', background: '#d1fae5', borderRadius: '0.375rem' }}>
									✅ <strong>Recommended:</strong> Always enable PAR for production OIDC clients with sensitive scopes
								</HelperText>
							</div>
						</InfoBox>
						
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> OAuth 2.0 Authorization Code Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>When to Use OAuth 2.0 Authorization Code</InfoTitle>
											<InfoText>
												OAuth 2.0 Authorization Code Flow is perfect when you need to access user's resources 
												on their behalf without needing to authenticate them or know their identity.
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
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('credentials')}
								aria-expanded={!collapsedSections.credentials}
							>
								<CollapsibleTitle>
									<FiSettings /> Application Configuration & Credentials
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.credentials && (
								<CollapsibleContent>
								<ComprehensiveCredentialsService
									// Discovery props
									onDiscoveryComplete={(result) => {
										console.log('[OAuth Authz V5] Discovery completed:', result);
										// Extract environment ID from issuer URL if available
										if (result.issuerUrl) {
											const envIdMatch = result.issuerUrl.match(/\/([a-f0-9-]{36})\//i);
											if (envIdMatch && envIdMatch[1]) {
												handleFieldChange('environmentId', envIdMatch[1]);
											}
										}
									}}
									discoveryPlaceholder="Enter Environment ID, issuer URL, or provider..."
									showProviderInfo={true}
									
									// Credentials props
									environmentId={credentials.environmentId || ''}
									clientId={credentials.clientId || ''}
									clientSecret={credentials.clientSecret || ''}
									redirectUri={credentials.redirectUri || 'https://localhost:3000/authz-callback'}
									scopes={credentials.scopes || credentials.scope || ''}
									loginHint={credentials.loginHint || ''}
									postLogoutRedirectUri={credentials.postLogoutRedirectUri || ''}
									
									// Change handlers
									onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
									onClientIdChange={(value) => handleFieldChange('clientId', value)}
									onClientSecretChange={(value) => handleFieldChange('clientSecret', value)}
									onRedirectUriChange={(value) => handleFieldChange('redirectUri', value)}
									onScopesChange={(value) => handleFieldChange('scopes', value)}
									onLoginHintChange={(value) => handleFieldChange('loginHint', value)}
									onPostLogoutRedirectUriChange={(value) => handleFieldChange('postLogoutRedirectUri', value)}
									
									// Save handler
									onSave={handleSaveConfiguration}
									hasUnsavedChanges={false}
									isSaving={false}
									requireClientSecret={true}
									
									// PingOne Advanced Configuration
									pingOneAppState={pingOneConfig}
									onPingOneAppStateChange={setPingOneConfig}
									onPingOneSave={() => savePingOneConfig(pingOneConfig)}
									hasUnsavedPingOneChanges={false}
									isSavingPingOne={false}
									
									// UI config
									title="OAuth Authorization Code Configuration"
									subtitle="Configure your application settings and credentials"
									showAdvancedConfig={true}
									defaultCollapsed={false}
								/>

								{/* Configuration Summary Card - Compact */}
								{credentials.environmentId && credentials.clientId && (
									<ConfigurationSummaryCard
										config={ConfigurationSummaryService.generateSummary(credentials, 'oauth-authz')}
										onSave={async () => {
											await handleSaveConfiguration();
										}}
										onExport={async (config) => {
											ConfigurationSummaryService.downloadConfig(config, 'oauth-authz-config.json');
										}}
										onImport={async (importedConfig) => {
											setCredentials(importedConfig);
											await handleSaveConfiguration();
										}}
										flowType="oauth-authz"
										showAdvancedFields={false}
									/>
								)}

								<ActionRow>
									<Button onClick={handleSaveConfiguration} $variant="primary">
										<FiSettings /> Save Configuration
									</Button>
									<Button onClick={handleClearConfiguration} $variant="danger">
										<FiRefreshCw /> Clear Configuration
									</Button>
								</ActionRow>

									<InfoBox $variant="warning" style={{ marginTop: '2rem', color: '#92400e' }}>
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle style={{ color: '#92400e' }}>Testing vs Production</InfoTitle>
											<InfoText style={{ color: '#92400e' }}>
												This saves credentials locally for demos only. Remove secrets before
												production.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<EnhancedFlowWalkthrough flowId="oauth-authorization-code" />

						<FlowSequenceDisplay flowType="authorization-code" />

						{/* Legacy Configuration Summary Card */}
						<LegacyConfigurationSummaryCard
							configuration={credentials}
							onSaveConfiguration={handleSaveConfiguration}
							onLoadConfiguration={(config) => {
								if (config) {
									controller.setCredentials(config);
								}
								v4ToastManager.showSuccess('Configuration loaded from saved settings.');
							}}
							primaryColor="#3b82f6"
							flowType="authorization-code"
						/>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('results')}
								aria-expanded={!collapsedSections.results}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Saved Configuration Summary
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.results}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.results && (
								<CollapsibleContent>
									<SectionDivider />
									<ResultsSection>
										<ResultsHeading>
											<FiCheckCircle size={18} /> Configuration Status
										</ResultsHeading>
										<HelperText>
											Save your PingOne credentials so they auto-populate in subsequent steps.
										</HelperText>
										{stepCompletions[0] ? (
											<GeneratedContentBox>
												<GeneratedLabel>Saved</GeneratedLabel>
												<ParameterGrid style={{ gridTemplateColumns: '1fr', gap: '0.75rem' }}>
													<div>
														<ParameterLabel>ENVIRONMENT ID</ParameterLabel>
														<ParameterValue
															style={{
																fontFamily: 'monospace',
																wordBreak: 'break-all',
																padding: '0.75rem',
																background: '#f8fafc',
																border: '1px solid #e2e8f0',
																borderRadius: '0.375rem',
															}}
														>
															{credentials.environmentId || 'Not provided'}
														</ParameterValue>
													</div>
													<div>
														<ParameterLabel>CLIENT ID</ParameterLabel>
														<ParameterValue
															style={{
																fontFamily: 'monospace',
																wordBreak: 'break-all',
																padding: '0.75rem',
																background: '#f8fafc',
																border: '1px solid #e2e8f0',
																borderRadius: '0.375rem',
															}}
														>
															{credentials.clientId || 'Not provided'}
														</ParameterValue>
													</div>
													<div>
														<ParameterLabel>CLIENT SECRET</ParameterLabel>
														<div style={{ position: 'relative' }}>
															<ParameterValue
																style={{
																	fontFamily: 'monospace',
																	wordBreak: 'break-all',
																	padding: '0.75rem',
																	paddingRight: '2.5rem',
																	background: '#f8fafc',
																	border: '1px solid #e2e8f0',
																	borderRadius: '0.375rem',
																}}
															>
																{credentials.clientSecret
																	? showSavedSecret
																		? credentials.clientSecret
																		: '•'.repeat(credentials.clientSecret.length)
																	: 'Not provided'}
															</ParameterValue>
															{credentials.clientSecret && (
																<button
																	type="button"
																	onClick={() => setShowSavedSecret(!showSavedSecret)}
																	style={{
																		position: 'absolute',
																		right: '0.75rem',
																		top: '50%',
																		transform: 'translateY(-50%)',
																		background: 'none',
																		border: 'none',
																		cursor: 'pointer',
																		color: '#6b7280',
																		display: 'flex',
																		alignItems: 'center',
																		justifyContent: 'center',
																	}}
																	title={
																		showSavedSecret ? 'Hide client secret' : 'Show client secret'
																	}
																>
																	{showSavedSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
																</button>
															)}
														</div>
													</div>
													<div>
														<ParameterLabel>REDIRECT URI</ParameterLabel>
														<ParameterValue
															style={{
																fontFamily: 'monospace',
																wordBreak: 'break-all',
																padding: '0.75rem',
																background: '#f8fafc',
																border: '1px solid #e2e8f0',
																borderRadius: '0.375rem',
															}}
														>
															{credentials.redirectUri || 'Not provided'}
														</ParameterValue>
													</div>
												</ParameterGrid>
											</GeneratedContentBox>
										) : (
											<HelperText>
												Save your configuration above to persist it for future sessions.
											</HelperText>
										)}
									</ResultsSection>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 1:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('pkceOverview')}
								aria-expanded={!collapsedSections.pkceOverview}
							>
								<CollapsibleTitle>
									<FiShield /> What is PKCE?
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.pkceOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.pkceOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>PKCE (Proof Key for Code Exchange)</InfoTitle>
											<InfoText>
												PKCE is a security extension for OAuth 2.0 that prevents authorization code
												interception attacks. It's required for public clients (like mobile apps)
												and highly recommended for all OAuth flows.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>The Security Problem PKCE Solves</InfoTitle>
											<InfoText>
												Without PKCE, if an attacker intercepts your authorization code (through app
												redirects, network sniffing, or malicious apps), they could exchange it for
												tokens. PKCE prevents this by requiring proof that the same client that
												started the flow is finishing it.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('pkceDetails')}
								aria-expanded={!collapsedSections.pkceDetails}
							>
								<CollapsibleTitle>
									<FiKey /> Understanding Code Verifier & Code Challenge
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.pkceDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.pkceDetails && (
								<CollapsibleContent>
									<ParameterGrid>
										<InfoBox $variant="success">
											<FiKey size={20} />
											<div>
												<InfoTitle>Code Verifier</InfoTitle>
												<InfoText>
													A high-entropy cryptographic random string (43-128 chars) that stays
													secret in your app. Think of it as a temporary password that proves you're
													the same client that started the OAuth flow.
												</InfoText>
												<InfoList>
													<li>Generated fresh for each OAuth request</li>
													<li>Uses characters: A-Z, a-z, 0-9, -, ., _, ~</li>
													<li>Never sent in the authorization request</li>
													<li>Only revealed during token exchange</li>
												</InfoList>
											</div>
										</InfoBox>

										<InfoBox $variant="info">
											<FiShield size={20} />
											<div>
												<InfoTitle>Code Challenge</InfoTitle>
												<InfoText>
													A SHA256 hash of the code verifier, encoded in base64url format. This is
													sent publicly in the authorization URL but can't be reversed to get the
													original verifier.
												</InfoText>
												<InfoList>
													<li>Derived from: SHA256(code_verifier)</li>
													<li>Encoded in base64url (URL-safe)</li>
													<li>Safe to include in authorization URLs</li>
													<li>Used by PingOne to verify the verifier later</li>
												</InfoList>
											</div>
										</InfoBox>
									</ParameterGrid>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Security Best Practices</InfoTitle>
											<InfoList>
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
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
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
										<CopyButtonService
											text={pkceCodes.codeVerifier}
											label="Code Verifier"
											size="sm"
											variant="secondary"
											showLabel={true}
										/>
										<CopyButtonService
											text={pkceCodes.codeChallenge}
											label="Code Challenge"
											size="sm"
											variant="secondary"
											showLabel={true}
										/>
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
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authRequestOverview')}
								aria-expanded={!collapsedSections.authRequestOverview}
							>
								<CollapsibleTitle>
									<FiGlobe /> Understanding Authorization Requests
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authRequestOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiGlobe size={20} />
										<div>
											<InfoTitle>What is an Authorization Request?</InfoTitle>
											<InfoText>
												An authorization request redirects users to PingOne's authorization server
												where they authenticate and consent to sharing their information with your
												application. This is the first step in obtaining an authorization code.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Critical Security Considerations</InfoTitle>
											<InfoList>
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
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authRequestDetails')}
								aria-expanded={!collapsedSections.authRequestDetails}
							>
								<CollapsibleTitle>
									<FiKey /> Authorization URL Parameters Deep Dive
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authRequestDetails && (
								<CollapsibleContent>
									<ParameterGrid>
										<InfoBox $variant="info">
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

										<InfoBox $variant="success">
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

									<InfoBox $variant="warning">
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

									<InfoBox $variant="info">
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
								</CollapsibleContent>
							)}
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
								<HighlightedActionButton
									onClick={handleGenerateAuthUrl}
									$priority="primary"
									disabled={
										!!controller.authUrl ||
										(!controller.pkceCodes.codeVerifier && !sessionStorage.getItem(`${controller.flowKey}-pkce-codes`))
									}
									title={
										(!controller.pkceCodes.codeVerifier && !sessionStorage.getItem(`${controller.flowKey}-pkce-codes`))
											? 'Generate PKCE parameters first'
											: controller.authUrl
												? 'Authorization URL already generated'
												: 'Generate authorization URL'
									}
								>
									{controller.authUrl ? <FiCheckCircle /> : <FiExternalLink />}{' '}
									{controller.authUrl
										? 'Authorization URL Generated'
										: (!controller.pkceCodes.codeVerifier && !sessionStorage.getItem(`${controller.flowKey}-pkce-codes`))
											? 'Complete above action'
											: 'Generate Authorization URL'}
									<HighlightBadge>1</HighlightBadge>
								</HighlightedActionButton>

								{controller.authUrl && (
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<HighlightedActionButton onClick={handleOpenAuthUrl} $priority="success">
											<FiExternalLink /> Redirect to PingOne
											<HighlightBadge>2</HighlightBadge>
										</HighlightedActionButton>
										<span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
											(Open Authorization URL)
										</span>
									</div>
								)}
							</ActionRow>

							{controller.authUrl ? (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Generated</GeneratedLabel>
									<div style={{ marginBottom: '1rem' }}>{controller.authUrl}</div>
									<CopyButtonService
										text={controller.authUrl ?? ''}
										label="Authorization URL"
										size="md"
										variant="primary"
										showLabel={true}
									/>
								</GeneratedUrlDisplay>
							) : (
								<HelperText>Generate an authorization URL above to continue to PingOne.</HelperText>
							)}
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authResponseOverview')}
								aria-expanded={!collapsedSections.authResponseOverview}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Authorization Response Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authResponseOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authResponseOverview && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Authorization Response</InfoTitle>
											<InfoText>
												After authentication, PingOne returns you to the redirect URI with an
												authorization code or error message.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authResponseDetails')}
								aria-expanded={!collapsedSections.authResponseDetails}
							>
								<CollapsibleTitle>
									<FiKey /> Authorization Code Details
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authResponseDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authResponseDetails && (
								<CollapsibleContent>
									<ResultsSection>
										<ResultsHeading>
											<FiCheckCircle size={18} /> Authorization Code
										</ResultsHeading>
										<HelperText>
											Use the authorization code immediately—it expires quickly. Copy it if you need
											to inspect the token exchange request.
										</HelperText>
										{authCode ? (
											<GeneratedContentBox>
												<GeneratedLabel>Received</GeneratedLabel>
												<ParameterGrid>
													<div>
														<ParameterLabel>Authorization Code</ParameterLabel>
														<ParameterValue>{authCode}</ParameterValue>
													</div>
												</ParameterGrid>
												<ActionRow>
													<CopyButtonService
														text={authCode}
														label="Authorization Code"
														size="sm"
														variant="outline"
														showLabel={true}
													/>
													<HighlightedActionButton
														onClick={handleNextClick}
														$priority="success"
														disabled={!canNavigateNext()}
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
													</HighlightedActionButton>
												</ActionRow>
											</GeneratedContentBox>
										) : (
											<EmptyState>
												<EmptyIcon>
													<FiAlertCircle />
												</EmptyIcon>
												<EmptyTitle>Authorization Code Not Received</EmptyTitle>
												<EmptyText>
													No authorization code detected. You can paste one manually for testing.
												</EmptyText>
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
											</EmptyState>
										)}
									</ResultsSection>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenExchangeOverview')}
								aria-expanded={!collapsedSections.tokenExchangeOverview}
							>
								<CollapsibleTitle>
									<FiKey /> Token Exchange Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenExchangeOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenExchangeOverview && (
								<CollapsibleContent>
									<ExplanationSection>
										<ExplanationHeading>
											<FiKey /> Exchange Authorization Code for Tokens
										</ExplanationHeading>
										<InfoText>
											Call the backend token exchange endpoint to swap the authorization code for
											access and ID tokens.
										</InfoText>
									</ExplanationSection>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenExchangeDetails')}
								aria-expanded={!collapsedSections.tokenExchangeDetails}
							>
								<CollapsibleTitle>
									<FiRefreshCw /> Token Exchange Details
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenExchangeDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenExchangeDetails && (
								<CollapsibleContent>
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
														<ParameterLabel>Code</ParameterLabel>
														<ParameterValue>{controller.authCode || localAuthCode}</ParameterValue>
													</div>
												</ParameterGrid>
												<ActionRow>
													<CopyButtonService
														text={controller.authCode || localAuthCode || ''}
														label="Authorization Code"
														size="sm"
														variant="outline"
														showLabel={true}
													/>
												</ActionRow>
											</GeneratedContentBox>
										</ResultsSection>
									)}

									<ActionRow style={{ justifyContent: 'center' }}>
										<HighlightedActionButton
											onClick={handleExchangeTokens}
											$priority="primary"
											disabled={!(controller.authCode || localAuthCode)}
										>
											<FiRefreshCw /> Exchange Authorization Code for Tokens
										</HighlightedActionButton>
									</ActionRow>

									<SectionDivider />

									{/* API Call Display for Token Exchange */}
									{tokenExchangeApiCall && (
										<EnhancedApiCallDisplay
											apiCall={tokenExchangeApiCall}
											options={{
												showEducationalNotes: true,
												showFlowContext: true,
												urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code')
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
												<ActionRow style={{ marginBottom: '1rem' }}>
													<Button
														onClick={() =>
															handleCopy(JSON.stringify(tokens, null, 2), 'Token Response')
														}
														$variant="primary"
														style={{
															backgroundColor: '#3b82f6',
															borderColor: '#3b82f6',
															color: '#ffffff',
															fontWeight: '600',
														}}
													>
														<FiCopy /> Copy JSON Response
													</Button>
												</ActionRow>
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
												/>
												)}
												
												{/* Refresh Token Display */}
												{tokens.refresh_token && (
													<div style={{ marginTop: '1rem' }}>
														<ParameterLabel>Refresh Token</ParameterLabel>
														<ParameterValue style={{ wordBreak: 'break-all' }}>
															{String(tokens.refresh_token)}
														</ParameterValue>
														<Button
															onClick={() =>
																handleCopy(String(tokens.refresh_token), 'Refresh Token')
															}
															$variant="primary"
															style={{
																marginTop: '0.5rem',
																fontSize: '0.8rem',
																fontWeight: '600',
																padding: '0.5rem 0.75rem',
																backgroundColor: '#10b981',
																borderColor: '#10b981',
																color: '#ffffff',
															}}
														>
															<FiCopy /> Copy Refresh Token
														</Button>
													</div>
												)}
												
												{/* Additional Token Information */}
												<ParameterGrid style={{ marginTop: '1rem' }}>
													{tokens.token_type && (
														<div>
															<ParameterLabel>Token Type</ParameterLabel>
															<ParameterValue>{String(tokens.token_type)}</ParameterValue>
														</div>
													)}
													{tokens.scope && (
														<div>
															<ParameterLabel>Scope</ParameterLabel>
															<ParameterValue>{String(tokens.scope)}</ParameterValue>
														</div>
													)}
													{tokens.expires_in && (
														<div>
															<ParameterLabel>Expires In</ParameterLabel>
															<ParameterValue>{String(tokens.expires_in)} seconds</ParameterValue>
														</div>
													)}
													{tokens.access_token && getX5tParameter(String(tokens.access_token)) && (
														<div>
															<ParameterLabel>x5t (Certificate Thumbprint)</ParameterLabel>
															<ParameterValue>
																{getX5tParameter(String(tokens.access_token))}
															</ParameterValue>
														</div>
													)}
												</ParameterGrid>
												{/* Token Management Buttons */}
												<ActionRow style={{ justifyContent: 'center', gap: '0.75rem' }}>
													<Button onClick={navigateToTokenManagement} $variant="primary">
														<FiExternalLink /> View in Token Management
													</Button>
													{tokens.access_token && (
														<Button
															onClick={navigateToTokenManagement}
															$variant="primary"
															style={{
																fontSize: '0.9rem',
																fontWeight: '600',
																padding: '0.75rem 1rem',
																backgroundColor: '#3b82f6',
																borderColor: '#3b82f6',
																color: '#ffffff',
															}}
														>
															<FiKey /> Decode Access Token
														</Button>
													)}
													{tokens.refresh_token && (
														<Button
															onClick={navigateToTokenManagementWithRefreshToken}
															$variant="primary"
															style={{
																fontSize: '0.9rem',
																fontWeight: '600',
																padding: '0.75rem 1rem',
																backgroundColor: '#f59e0b',
																borderColor: '#f59e0b',
																color: '#ffffff',
															}}
														>
															<FiRefreshCw /> Decode Refresh Token
														</Button>
													)}
												</ActionRow>
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
															scopes: credentials?.scopes?.split(' ') || ['openid', 'profile', 'email'],
															environmentId: credentials?.environmentId || '',
														}}
													/>
												</div>
											)}
										</ResultsSection>
									)}
								</CollapsibleContent>
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
									urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code')
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
									urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code')
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
									urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code')
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
				<FlowHeader flowId="pingone-par-v6" />

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
							<StepTotal>of 07</StepTotal>
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

export default PingOnePARFlowV6;
