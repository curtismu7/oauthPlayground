// src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx
// OIDC Device Authorization Code Grant (RFC 8628) - V6 Implementation with ID Token

import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiClock,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiMonitor,
	FiRefreshCw,
	FiShield,
	FiSmartphone,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import JWTTokenDisplay from '../../components/JWTTokenDisplay';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useDeviceAuthorizationFlow } from '../../hooks/useDeviceAuthorizationFlow';
import { FlowHeader as StandardFlowHeader } from '../../services/flowHeaderService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { usePageScroll } from '../../hooks/usePageScroll';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import EducationalContentService from '../../services/educationalContentService';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService, EnhancedApiCallData } from '../../services/enhancedApiCallDisplayService';
import { TokenIntrospectionService, IntrospectionApiCallData } from '../../services/tokenIntrospectionService';
import { UISettingsService } from '../../services/uiSettingsService';
import { ConfigurationSummaryService } from '../../services/configurationSummaryService';
import type { DiscoveryResult } from '../../services/comprehensiveDiscoveryService';
import logger from '../../utils/logger';

// Styled Components (V5 Parity)
const FlowContainer = styled.div`
	min-height: 100vh;
	background-color: var(--color-background, #f9fafb);
	padding: 2rem 0 6rem;
`;

const FlowContent = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const _StepBadge = styled.span`
	background: rgba(22, 163, 74, 0.2);
	border: 1px solid #4ade80;
	color: #bbf7d0;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	display: inline-block;
	margin-bottom: 0.5rem;
`;

const CollapsibleSection = styled.section`
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: var(--color-surface, #ffffff);
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0c4a6e;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	color: #0369a1;
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

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
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
			if ($variant === 'error') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'error') return '#fee2e2';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: var(--font-size-base, 1rem);
	font-weight: 600;
	color: var(--color-text-primary, #0f172a);
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: var(--font-size-sm, 0.95rem);
	color: var(--color-text-secondary, #3f3f46);
	line-height: 1.7;
	margin: 0;
`;

const GeneratedContentBox = styled.div`
	background-color: #dbeafe;
	border: 1px solid #3b82f6;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #3b82f6;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const _GeneratedUrlDisplay = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #1e40af;
	word-break: break-all;
	background-color: #eff6ff;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 1px solid #93c5fd;
	margin: 1rem 0;
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
	color: #3b82f6;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #1e3a8a;
	word-break: break-all;
	background-color: #eff6ff;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #bfdbfe;
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
	font-size: var(--font-size-sm, 0.875rem);
	font-weight: 600;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.disabled ? 0.6 : 1)};

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #2563eb;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: #22c55e;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #16a34a;
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
		color: #1e40af;
		border-color: #bfdbfe;
		&:hover:not(:disabled) {
			background-color: #eff6ff;
			border-color: #3b82f6;
		}
	`}

	${({ $variant }) =>
		!$variant &&
		`
		background-color: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #2563eb;
		}
	`}
`;

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the OIDC Device Authorization Code Flow',
	},
	{ title: 'Step 1: Request Device Code', subtitle: 'Initiate device authorization' },
	{ title: 'Step 2: User Authorization', subtitle: 'Display user code and verification URL' },
	{ title: 'Step 3: Poll for Tokens', subtitle: 'Wait for user authorization' },
	{ title: 'Step 4: Tokens Received', subtitle: 'View Access Token, ID Token, and Refresh Token' },
	{ title: 'Step 5: User Information', subtitle: 'Fetch user profile data' },
	{ title: 'Step 6: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 7: Flow Complete', subtitle: 'Summary and next steps' },
	{ title: 'Step 8: Flow Summary', subtitle: 'Comprehensive completion overview' },
] as const;

type SectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'deviceCodeOverview'
	| 'deviceCodeDetails'
	| 'userAuthOverview'
	| 'userAuthDetails'
	| 'pollingOverview'
	| 'pollingDetails'
	| 'tokensOverview'
	| 'tokensDetails'
	| 'userInfoOverview'
	| 'userInfoDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'completionOverview'
	| 'completionDetails'
	| 'flowSummary'
	| 'uiSettings';

// Styled Components
const _UserCodeDisplay = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	font-family: 'Courier New', monospace;
	letter-spacing: 0.75rem;
	color: #ffffff;
	text-align: center;
	padding: 2rem;
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	border-radius: 0.75rem;
	margin: 1.5rem 0;
	box-shadow: 0 10px 25px rgba(22, 163, 74, 0.3);
	user-select: all;
	cursor: pointer;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.02);
	}

	&:active {
		transform: scale(0.98);
	}
`;

const PollingIndicator = styled.div<{ $isActive: boolean }>`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.5rem;
	background-color: ${(props) => (props.$isActive ? '#dbeafe' : '#f1f5f9')};
	border: 2px solid ${(props) => (props.$isActive ? '#3b82f6' : '#cbd5e1')};
	border-radius: 0.5rem;
	margin: 1rem 0;

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	${(props) =>
		props.$isActive &&
		`
		animation: pulse 2s ease-in-out infinite;
		
		svg {
			animation: spin 2s linear infinite;
		}
	`}
`;

const CountdownTimer = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #3b82f6;
	text-align: center;
	padding: 1.5rem;
	font-family: 'Courier New', monospace;
	background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
	border-radius: 0.5rem;
	border: 2px solid #3b82f6;
	margin: 1rem 0;
`;

const _QRCodeContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 2rem;
	background-color: #ffffff;
	border: 2px solid #e2e8f0;
	border-radius: 0.75rem;
	margin: 1.5rem 0;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const SmartTVContainer = styled.div`
	display: flex;
	gap: 2rem;
	align-items: flex-start;
	margin: 2rem 0;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

const SmartTV = styled.div<{ $isWaiting: boolean }>`
	flex: 1;
	background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
	border-radius: 1rem;
	padding: 1.5rem;
	color: #ffffff;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
	position: relative;
	overflow: hidden;
	border: 8px solid #0f172a;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: ${({ $isWaiting }) =>
			$isWaiting ? 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)' : '#22c55e'};
		animation: ${({ $isWaiting }) => ($isWaiting ? 'shimmer 2s infinite' : 'none')};
		background-size: 200% 100%;
	}

	&::after {
		content: '';
		position: absolute;
		bottom: -20px;
		left: 50%;
		transform: translateX(-50%);
		width: 80px;
		height: 20px;
		background: #0f172a;
		border-radius: 0 0 8px 8px;
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}
`;

const TVScreen = styled.div`
	background-color: #000000;
	border: 2px solid #1e293b;
	border-radius: 0.5rem;
	padding: 2rem;
	margin-bottom: 1rem;
	min-height: 250px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const TVDisplay = styled.div`
	font-family: 'Courier New', monospace;
	font-size: 1.25rem;
	color: #22c55e;
	line-height: 1.8;
`;

const TVStatusIndicator = styled.div<{ $active?: boolean }>`
	background-color: ${({ $active }) => ($active ? '#22c55e' : '#ef4444')};
	border-radius: 50%;
	width: 12px;
	height: 12px;
	display: inline-block;
	margin-right: 0.5rem;
	box-shadow: 0 0 10px ${({ $active }) => ($active ? '#22c55e' : '#ef4444')};
	transition: all 0.3s ease;

	${({ $active }) =>
		$active &&
		`
		animation: pulse 2s infinite;
	`}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
`;

const QRSection = styled.div`
	flex: 1;
	background-color: #ffffff;
	border: 2px solid #e2e8f0;
	border-radius: 1rem;
	padding: 2rem;
	text-align: center;
`;

const _VerificationBox = styled.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 2px solid #3b82f6;
	border-radius: 0.75rem;
	padding: 2rem;
	margin: 1.5rem 0;
	text-align: center;
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	align-items: center;
	justify-content: center;
	padding: 1rem;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	max-width: 32rem;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.5rem 1.5rem 0 1.5rem;
`;

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1e293b;
`;

const ModalBody = styled.div`
	color: #475569;
	font-size: 1rem;
	line-height: 1.6;
	padding: 1.5rem;
	flex: 1;
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.75rem;
	padding: 0 1.5rem 1.5rem 1.5rem;
	justify-content: flex-end;
`;

const OIDCDeviceAuthorizationFlowV6: React.FC = () => {
	const deviceFlow = useDeviceAuthorizationFlow();
	
	// PingOne Advanced Configuration
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		clientAuthMethod: 'none', // OIDC Device flow is public client
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'OPTIONAL',
		responseTypeCode: false,
		responseTypeToken: false,
		responseTypeIdToken: true, // OIDC returns ID token
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
		enableDPoP: false,
		dpopAlgorithm: 'ES256',
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});
	
	const [currentStep, setCurrentStep] = useState(() => {
		// Check for restore_step from token management navigation
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step'); // Clear after use
			console.log('🔗 [OIDCDeviceAuthorizationFlowV6] Restoring to step:', step);
			return step;
		}
		return 0;
	});
	const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
		overview: false,
		flowDiagram: true,
		credentials: false,
		deviceCodeOverview: false,
		deviceCodeDetails: false,
		userAuthOverview: false,
		userAuthDetails: false,
		pollingOverview: false,
		pollingDetails: false,
		tokensOverview: false,
		tokensDetails: false,
		userInfoOverview: false,
		userInfoDetails: false,
		introspectionOverview: false,
		introspectionDetails: false,
		completionOverview: false,
		completionDetails: false,
		flowSummary: false, // New Flow Completion Service step
		uiSettings: true,  // Collapsed by default
	});
	const [_copiedField, setCopiedField] = useState<string | null>(null);
	const [userInfo, setUserInfo] = useState<unknown>(null);
	const [introspectionResult, setIntrospectionResult] = useState<unknown>(null);
	const [hasScrolledToTV, setHasScrolledToTV] = useState(false);
	const [showPollingModal, setShowPollingModal] = useState(false);

	usePageScroll();

	// Explicit scroll to top for step 2 (User Authorization)
	React.useEffect(() => {
		if (currentStep === 2) {
			// Force scroll to top when entering User Authorization step
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	}, [currentStep]);

	const toggleSection = useCallback((section: SectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(label);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
		setTimeout(() => setCopiedField(null), 2000);
	}, []);

	// Note: Credential handlers are now managed by ComprehensiveCredentialsService
	// The V6 service architecture provides unified credential management with OIDC discovery

	// Note: handleDiscoveryComplete is now handled by ComprehensiveCredentialsService
	// Discovery integration is built into the V6 service architecture

	const handleRequestDeviceCode = useCallback(async () => {
		try {
			await deviceFlow.requestDeviceCode();
			setCurrentStep(2); // Auto-advance to User Authorization step
			// Show polling modal after device code is requested
			setShowPollingModal(true);
		} catch (_error) {
			// Error already handled in hook
		}
	}, [deviceFlow]);

	const handleReset = useCallback(() => {
		deviceFlow.reset();
		setCurrentStep(0);
		setUserInfo(null);
		setIntrospectionResult(null);
		setHasScrolledToTV(false);
		setShowPollingModal(false);
	}, [deviceFlow]);

	const handleStartPolling = useCallback(() => {
		setShowPollingModal(false);
		deviceFlow.startPolling();
		// Stay on current step (User Authorization - step 2) so user can see Smart TV update
		// Don't advance to step 3 - let user see the real-time polling results on the TV display
	}, [deviceFlow]);

	const handleDismissModal = useCallback(() => {
		setShowPollingModal(false);
	}, []);

	const navigateToTokenManagement = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('oidc-device-authorization-v6', currentStep, 'oidc');

		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'oidc-device-authorization-v6');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'oidc-device-authorization-v6',
			tokens: deviceFlow.tokens,
			credentials: deviceFlow.credentials,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		// If we have tokens, pass them to Token Management
		if (deviceFlow.tokens?.access_token) {
			// Use localStorage for cross-tab communication
			localStorage.setItem('token_to_analyze', deviceFlow.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'oidc-device-authorization-v6');
			console.log(
				'🔍 [OIDCDeviceAuthorizationFlowV6] Passing access token to Token Management via localStorage'
			);
		}

		window.open('/token-management', '_blank');
	}, [deviceFlow.tokens, deviceFlow.credentials, currentStep]);

	// Step validation
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0:
					return true; // Introduction
				case 1:
					return !!deviceFlow.credentials;
				case 2:
					return !!deviceFlow.deviceCodeData;
				case 3:
					return !!deviceFlow.deviceCodeData;
				case 4:
					return !!deviceFlow.tokens;
				case 5:
					return !!deviceFlow.tokens;
				case 6:
					return !!deviceFlow.tokens;
				case 7:
					return true; // Completion
				case 8:
					return true; // Flow Summary
				default:
					return false;
			}
		},
		[deviceFlow.credentials, deviceFlow.deviceCodeData, deviceFlow.tokens]
	);

	// Auto-advance when tokens received
	React.useEffect(() => {
		if (deviceFlow.pollingStatus.status === 'success' && deviceFlow.tokens) {
			setCurrentStep(4);
		}
	}, [deviceFlow.pollingStatus.status, deviceFlow.tokens]);

	// Scroll to TV when tokens are received
	React.useEffect(() => {
		if (deviceFlow.tokens && !hasScrolledToTV) {
			// Scroll to TV display when tokens are received
			const tvElement = document.querySelector('[data-tv-display]');
			if (tvElement) {
				tvElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
				setHasScrolledToTV(true);
			}

			v4ToastManager.showSuccess(
				'🎉 Authorization successful! Check out your Smart TV screen below!'
			);
		}
	}, [deviceFlow.tokens, hasScrolledToTV]);

	// 20-second fallback scroll timer when polling starts
	React.useEffect(() => {
		if (deviceFlow.pollingStatus.isPolling && !hasScrolledToTV && !deviceFlow.tokens) {
			const fallbackTimer = setTimeout(() => {
				const tvElement = document.querySelector('[data-tv-display]');
				if (tvElement && !hasScrolledToTV) {
					tvElement.scrollIntoView({
						behavior: 'smooth',
						block: 'center',
					});
					setHasScrolledToTV(true);
					v4ToastManager.showSuccess('👇 Check out your Smart TV display below!');
				}
			}, 20000); // 20 seconds

			return () => clearTimeout(fallbackTimer);
		}
		return undefined;
	}, [deviceFlow.pollingStatus.isPolling, hasScrolledToTV, deviceFlow.tokens]);

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return renderIntroduction();
			case 1:
				return renderRequestDeviceCode();
			case 2:
				return renderUserAuthorization();
			case 3:
				return renderPolling();
			case 4:
				return renderTokens();
			case 5:
				return renderUserInfo();
			case 6:
				return renderIntrospection();
			case 7:
				return renderCompletion();
			case 8:
				return renderFlowSummary();
			default:
				return null;
		}
	};

	const renderIntroduction = () => (
		<>
			{/* OIDC Device flow already has comprehensive educational content in the sections below */}
			<FlowConfigurationRequirements flowType="device-authorization" variant="oidc" />
			<FlowSequenceDisplay flowType="device-authorization" />

			<SectionDivider />

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('overview')}
					aria-expanded={!collapsedSections.overview}
				>
					<CollapsibleTitle>
						<FiMonitor /> Device Authorization Flow Overview
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.overview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiInfo /> What is Device Authorization Flow?
							</ExplanationHeading>
							<InfoText>
								The Device Authorization Grant (RFC 8628) enables OAuth clients on input-constrained
								devices to obtain user authorization without a browser. Perfect for smart TVs, IoT
								devices, CLI tools, and gaming consoles.
							</InfoText>
							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiSmartphone size={20} />
								<div>
									<InfoTitle>Perfect for:</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>Smart TVs and streaming devices</li>
										<li>Command-line tools and scripts</li>
										<li>IoT devices without keyboards</li>
										<li>Gaming consoles</li>
										<li>Devices with limited input capabilities</li>
									</ul>
								</div>
							</InfoBox>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('flowDiagram')}
					aria-expanded={!collapsedSections.flowDiagram}
				>
					<CollapsibleTitle>
						<FiZap /> How It Works
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.flowDiagram}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.flowDiagram && (
					<CollapsibleContent>
						<ExplanationSection>
							<div
								style={{
									backgroundColor: '#f8fafc',
									padding: '2rem',
									borderRadius: '0.75rem',
									border: '2px solid #e2e8f0',
								}}
							>
								<ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '2' }}>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Device requests device code</strong> - Device calls the device
										authorization endpoint with client_id and scopes
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Display user code</strong> - Device shows user_code and verification_uri
										to user on screen (e.g., "Visit example.com and enter code: ABCD-1234")
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>User authorizes on secondary device</strong> - User visits URL on
										phone/computer, enters code, and authorizes the application
									</li>
									<li style={{ marginBottom: '1rem' }}>
										<strong>Device polls for tokens</strong> - Device continuously polls token
										endpoint until user completes authorization
									</li>
									<li>
										<strong>Tokens received</strong> - Device receives access token, ID token, and
										optionally refresh token
									</li>
								</ol>
							</div>
							<InfoBox $variant="success" style={{ marginTop: '1.5rem' }}>
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Key Benefits</InfoTitle>
									<ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
										<li>No browser required on the device</li>
										<li>Secure - uses standard OAuth 2.0</li>
										<li>User-friendly - simple code entry</li>
										<li>Works on any device with a display</li>
									</ul>
								</div>
							</InfoBox>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{/* Nonce Security Educational Section for Device Flow */}
			<InfoBox $variant="info" style={{ marginBottom: '1.5rem' }}>
				<FiShield size={24} />
				<div>
					<InfoTitle style={{ fontSize: '1rem', fontWeight: '600', color: '#0369a1' }}>
						🔐 OIDC Security: ID Token Validation (No Nonce in Device Flow)
					</InfoTitle>
					<InfoText style={{ marginTop: '0.75rem', color: '#0c4a6e' }}>
						<strong>Device Flow Security Model:</strong> Unlike browser-based OIDC flows (Implicit, Hybrid), the Device Authorization Flow does NOT use a nonce parameter because there is no direct browser redirect where replay attacks could occur.
					</InfoText>
					<InfoText style={{ marginTop: '0.5rem', color: '#0c4a6e' }}>
						<strong>How Device Flow works:</strong>
					</InfoText>
					<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#0c4a6e' }}>
						<li>The device requests a device code from the authorization server</li>
						<li>User authorizes on a separate device (phone/computer)</li>
						<li>The device polls the token endpoint directly (no URL redirects)</li>
						<li>ID tokens are returned securely via the token endpoint (not URL fragments)</li>
					</ul>
					<InfoText style={{ marginTop: '0.75rem', color: '#0c4a6e', fontWeight: 'bold' }}>
						✅ <strong>Security Note:</strong> While nonce is not used in device flow authorization requests, the ID token you receive should still be validated for signature, issuer, audience, and expiration to ensure authenticity.
					</InfoText>
					<InfoText style={{ marginTop: '0.5rem', color: '#0c4a6e', fontSize: '0.875rem', fontStyle: 'italic' }}>
						💡 <strong>Spec Reference:</strong> RFC 8628 (Device Authorization Grant) combined with OIDC Core 1.0. Nonce is only required for flows where ID tokens are returned in URL fragments (Implicit, Hybrid).
					</InfoText>
				</div>
			</InfoBox>

			{/* V6 Comprehensive Credentials Service */}
			<ComprehensiveCredentialsService
				flowType="oidc-device-authorization-v6"
				// Discovery props
				onDiscoveryComplete={(result) => {
					console.log('[OIDC Device Authz V6] Discovery completed:', result);
					// Extract environment ID from issuer URL using dedicated service
					if (result.issuerUrl) {
						const envIdMatch = result.issuerUrl.match(/\/([a-f0-9-]{36})\//i);
						if (envIdMatch && envIdMatch[1]) {
							deviceFlow.setCredentials({
								...deviceFlow.credentials,
								environmentId: envIdMatch[1],
							});
							// setCredentials already saves to localStorage automatically
							if (envIdMatch[1] && deviceFlow.credentials?.clientId) {
								v4ToastManager.showSuccess('Credentials auto-saved from OIDC discovery');
							}
						}
					}
				}}
				discoveryPlaceholder="Enter Environment ID, issuer URL, or OIDC provider..."
				showProviderInfo={true}
				
				// Credentials props
				environmentId={deviceFlow.credentials?.environmentId || ''}
				clientId={deviceFlow.credentials?.clientId || ''}
				clientSecret={deviceFlow.credentials?.clientSecret || ''}
				scopes={deviceFlow.credentials?.scope || deviceFlow.credentials?.scopes || 'openid profile email'}
				
				// Change handlers
				onEnvironmentIdChange={(newEnvId) => {
					deviceFlow.setCredentials({
						...deviceFlow.credentials,
						environmentId: newEnvId,
					});
					// setCredentials already saves to localStorage automatically
					if (newEnvId && deviceFlow.credentials?.clientId && newEnvId.trim() && deviceFlow.credentials.clientId.trim()) {
						v4ToastManager.showSuccess('Credentials auto-saved');
					}
				}}
				onClientIdChange={(newClientId) => {
					deviceFlow.setCredentials({
						...deviceFlow.credentials,
						clientId: newClientId,
					});
					// setCredentials already saves to localStorage automatically
					if (deviceFlow.credentials?.environmentId && newClientId && deviceFlow.credentials.environmentId.trim() && newClientId.trim()) {
						v4ToastManager.showSuccess('Credentials auto-saved');
					}
				}}
				onClientSecretChange={(newClientSecret) => {
					deviceFlow.setCredentials({
						...deviceFlow.credentials,
						clientSecret: newClientSecret,
					});
				}}
				onScopesChange={(newScopes) => {
					// PingOne requires 'openid' scope even for OIDC flows (always)
					let finalScopes = newScopes;
					if (!newScopes.includes('openid')) {
						finalScopes = `openid ${newScopes}`.trim();
						v4ToastManager.showWarning('Added "openid" scope (required by PingOne)');
					}
					deviceFlow.setCredentials({
						...deviceFlow.credentials,
						scope: finalScopes,
						scopes: finalScopes,
					});
				}}
				
				// Save handler (setCredentials already persists to localStorage)
				onSave={() => {
					// Trigger a re-save by setting credentials again
					if (deviceFlow.credentials) {
						deviceFlow.setCredentials(deviceFlow.credentials);
						v4ToastManager.showSuccess('Credentials saved successfully!');
					}
				}}
				hasUnsavedChanges={false}
				isSaving={false}
				requireClientSecret={false}  // OIDC Device flows use public clients (no client secret needed)
				
				// Hide redirect URI fields (not needed for device flows)
				showRedirectUri={false}
				showPostLogoutRedirectUri={false}
				showLoginHint={false}
				
				// PingOne Advanced Configuration
				pingOneAppState={pingOneConfig}
				onPingOneAppStateChange={setPingOneConfig}
				onPingOneSave={() => {
					console.log('[OIDC Device Authz V6] PingOne config saved:', pingOneConfig);
					v4ToastManager.showSuccess('PingOne configuration saved successfully!');
				}}
				hasUnsavedPingOneChanges={false}
				isSavingPingOne={false}
			/>

			{/* Info about OIDC Device Flow Requirements */}
			<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
				<FiInfo style={{ flexShrink: 0, color: '#3b82f6' }} />
				<div>
					<InfoTitle>OIDC Device Flow Requirements</InfoTitle>
					<InfoText>
						<strong>Redirect URI:</strong> Not required for OIDC Device Authorization Flow (designed for 
						input-constrained devices like smart TVs, IoT devices, or CLI tools).
						<br /><br />
						<strong>Scopes:</strong> The <code>openid</code> scope is <strong>required</strong> for OIDC 
						flows (and also required by PingOne even for OAuth). It will be automatically added if you 
						remove it. Additional common scopes: <code>profile</code>, <code>email</code>, 
						<code>address</code>, <code>phone</code>, <code>offline_access</code> (for refresh tokens).
					</InfoText>
				</div>
			</InfoBox>

		</>
	);

	const renderRequestDeviceCode = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('deviceCodeOverview')}
					aria-expanded={!collapsedSections.deviceCodeOverview}
				>
					<CollapsibleTitle>
						<FiKey /> Request Device Code
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.deviceCodeOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.deviceCodeOverview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiKey /> Initiate Device Authorization
							</ExplanationHeading>
							<InfoText>
								Request a device code and user code from PingOne's device authorization endpoint.
								This is the first step in the device authorization flow.
							</InfoText>
							<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
								<FiInfo size={20} />
								<div>
									<InfoTitle>What happens:</InfoTitle>
									<InfoText>
										The device sends a POST request to the device authorization endpoint with the
										client_id and requested scopes. PingOne responds with a device_code, user_code,
										verification_uri, and polling interval.
									</InfoText>
								</div>
							</InfoBox>
							<ActionRow style={{ marginTop: '1.5rem' }}>
								<Button
									onClick={handleRequestDeviceCode}
									disabled={!deviceFlow.credentials?.environmentId || !!deviceFlow.deviceCodeData}
								>
									<FiKey /> Request Device Code
								</Button>
								{deviceFlow.deviceCodeData && (
									<Button onClick={handleReset} $variant="danger">
										<FiRefreshCw /> Start Over
									</Button>
								)}
							</ActionRow>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{deviceFlow.deviceCodeData && (
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('deviceCodeDetails')}
						aria-expanded={!collapsedSections.deviceCodeDetails}
					>
						<CollapsibleTitle>
							<FiCheckCircle /> Device Code Received
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.deviceCodeDetails}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.deviceCodeDetails && (
						<CollapsibleContent>
							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Success!</InfoTitle>
									<InfoText>
										Device code received from PingOne. You can now display the user code to the
										user.
									</InfoText>
								</div>
							</InfoBox>
							<ResultsSection style={{ marginTop: '1rem' }}>
								<GeneratedContentBox>
									<GeneratedLabel>Device Code Response</GeneratedLabel>
									<ParameterGrid>
										<div style={{ gridColumn: '1 / -1' }}>
											<ParameterLabel>Device Code (Internal - Do Not Display)</ParameterLabel>
											<ParameterValue
												style={{
													wordBreak: 'break-all',
													fontFamily: 'monospace',
													fontSize: '0.75rem',
													color: '#64748b',
												}}
											>
												{deviceFlow.deviceCodeData.device_code.substring(0, 20)}...
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Expires In</ParameterLabel>
											<ParameterValue>
												{deviceFlow.deviceCodeData.expires_in} seconds
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Poll Interval</ParameterLabel>
											<ParameterValue>{deviceFlow.deviceCodeData.interval} seconds</ParameterValue>
										</div>
									</ParameterGrid>
								</GeneratedContentBox>
							</ResultsSection>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}
		</>
	);

	const renderUserAuthorization = () => (
		<>
			{deviceFlow.deviceCodeData && (
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('userAuthOverview')}
						aria-expanded={!collapsedSections.userAuthOverview}
					>
						<CollapsibleTitle>
							<FiSmartphone /> User Authorization Required
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.userAuthOverview}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.userAuthOverview && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>Real-World Scenario: Smart TV App</InfoTitle>
									<InfoText>
										Imagine you're setting up a streaming app on your Smart TV. The TV displays a QR
										code and user code. Scan the QR code with your phone to authorize the app, just
										like Netflix, YouTube, or Disney+!
									</InfoText>
								</div>
							</InfoBox>

							<SmartTVContainer>
								{/* Smart TV Device */}
								<SmartTV
									$isWaiting={deviceFlow.pollingStatus.isPolling || !deviceFlow.tokens}
									data-tv-display
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											marginBottom: '1rem',
										}}
									>
										<TVStatusIndicator $active={deviceFlow.pollingStatus.status === 'success'} />
										<h3 style={{ margin: 0, fontSize: '1.25rem', color: '#94a3b8' }}>
											📺 Smart TV - Living Room
										</h3>
									</div>
									<TVScreen>
										<TVDisplay>
											{deviceFlow.pollingStatus.status === 'success' ? (
												<>
													<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
													<div style={{ fontSize: '1.5rem' }}>AUTHORIZED</div>
													<div
														style={{
															fontSize: '0.875rem',
															marginTop: '0.5rem',
															color: '#94a3b8',
														}}
													>
														Welcome! Loading your content...
													</div>
												</>
											) : deviceFlow.pollingStatus.isPolling ? (
												<>
													<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
													<div>WAITING FOR</div>
													<div>AUTHORIZATION...</div>
													<div
														style={{
															fontSize: '0.875rem',
															marginTop: '0.5rem',
															color: '#94a3b8',
														}}
													>
														Use your phone to authorize
													</div>
												</>
											) : (
												<>
													<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
													<div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
														Activate Your Device
													</div>
													<div
														style={{
															fontSize: '0.875rem',
															color: '#94a3b8',
															marginBottom: '1rem',
														}}
													>
														Scan QR code or visit URL
													</div>
													<div
														style={{
															fontSize: '0.75rem',
															color: '#64748b',
															marginBottom: '0.25rem',
														}}
													>
														Enter this code:
													</div>
													<div
														style={{
															fontSize: '2rem',
															fontWeight: 'bold',
															letterSpacing: '0.5rem',
															color: '#3b82f6',
														}}
													>
														{deviceFlow.deviceCodeData.user_code}
													</div>
												</>
											)}
										</TVDisplay>
									</TVScreen>
									{deviceFlow.timeRemaining > 0 && (
										<div
											style={{
												textAlign: 'center',
												marginTop: '1rem',
												fontSize: '0.875rem',
												color: '#94a3b8',
											}}
										>
											Code expires in: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
										</div>
									)}
								</SmartTV>

								{/* QR Code Section */}
								<QRSection>
									<h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1e293b' }}>
										📱 Scan with Your Phone
									</h3>
									<p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>
										Scan this QR code to activate your Smart TV app
									</p>

									{deviceFlow.deviceCodeData.verification_uri_complete ? (
										<div
											style={{
												padding: '1rem',
												backgroundColor: '#f8fafc',
												borderRadius: '0.5rem',
												marginBottom: '1rem',
											}}
										>
											<QRCodeSVG
												value={deviceFlow.deviceCodeData.verification_uri_complete}
												size={200}
												level="H"
												includeMargin={true}
												style={{ display: 'block', margin: '0 auto' }}
											/>
										</div>
									) : (
										<div
											style={{
												padding: '2rem',
												backgroundColor: '#f8fafc',
												borderRadius: '0.5rem',
												marginBottom: '1rem',
											}}
										>
											<p style={{ color: '#64748b', fontSize: '0.875rem' }}>
												QR code will appear here when available
											</p>
										</div>
									)}

									<div
										style={{
											padding: '1rem',
											backgroundColor: '#eff6ff',
											borderRadius: '0.5rem',
											border: '1px solid #bfdbfe',
											marginBottom: '1rem',
										}}
									>
										<p
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.75rem',
												color: '#64748b',
												textTransform: 'uppercase',
												fontWeight: '600',
											}}
										>
											Or visit manually:
										</p>
										<code
											style={{ fontSize: '0.875rem', color: '#1e40af', wordBreak: 'break-all' }}
										>
											{deviceFlow.deviceCodeData.verification_uri}
										</code>
										<p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
											Enter code:{' '}
											<strong
												style={{ color: '#1e40af', fontSize: '1rem', letterSpacing: '0.1rem' }}
											>
												{deviceFlow.deviceCodeData.user_code}
											</strong>
										</p>
									</div>

									<ActionRow style={{ justifyContent: 'center' }}>
										<Button
											onClick={() =>
												window.open(
													deviceFlow.deviceCodeData!.verification_uri_complete ||
														deviceFlow.deviceCodeData!.verification_uri,
													'_blank'
												)
											}
											$variant="primary"
										>
											<FiExternalLink /> Open on This Device
										</Button>
									</ActionRow>
								</QRSection>
							</SmartTVContainer>

							{deviceFlow.timeRemaining > 0 && (
								<CountdownTimer>
									⏱️ Code expires in: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
								</CountdownTimer>
							)}
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}
		</>
	);

	const renderPolling = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('pollingOverview')}
					aria-expanded={!collapsedSections.pollingOverview}
				>
					<CollapsibleTitle>
						<FiClock /> Polling for Authorization
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.pollingOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.pollingOverview && (
					<CollapsibleContent>
						<ExplanationSection>
							<ExplanationHeading>
								<FiClock /> Waiting for User Authorization
							</ExplanationHeading>
							<InfoText>
								The device is polling PingOne's token endpoint, waiting for the user to complete
								authorization on their secondary device.
							</InfoText>

							<PollingIndicator $isActive={deviceFlow.pollingStatus.isPolling}>
								{deviceFlow.pollingStatus.isPolling ? (
									<>
										<FiRefreshCw size={24} />
										<div style={{ flex: 1 }}>
											<strong style={{ fontSize: '1.125rem' }}>Polling for tokens...</strong>
											<div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
												Attempt {deviceFlow.pollingStatus.attempts} of{' '}
												{deviceFlow.pollingStatus.maxAttempts}
												{deviceFlow.pollingStatus.lastAttempt && (
													<>
														{' '}
														• Last attempt:{' '}
														{new Date(deviceFlow.pollingStatus.lastAttempt).toLocaleTimeString()}
													</>
												)}
											</div>
										</div>
									</>
								) : (
									<>
										<FiClock size={24} />
										<div style={{ flex: 1 }}>
											<strong style={{ fontSize: '1.125rem' }}>
												{deviceFlow.pollingStatus.status === 'success'
													? 'Authorization Complete!'
													: 'Ready to poll'}
											</strong>
											<div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
												{deviceFlow.pollingStatus.status === 'success'
													? 'Tokens have been received successfully'
													: 'Click "Start Polling" to begin waiting for user authorization'}
											</div>
										</div>
									</>
								)}
							</PollingIndicator>

							{deviceFlow.pollingStatus.error && (
								<InfoBox $variant="error" style={{ marginTop: '1rem' }}>
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>Polling Error</InfoTitle>
										<InfoText>{deviceFlow.pollingStatus.error}</InfoText>
									</div>
								</InfoBox>
							)}

							{deviceFlow.timeRemaining > 0 && (
								<CountdownTimer>
									⏱️ Time remaining: {deviceFlow.formatTimeRemaining(deviceFlow.timeRemaining)}
								</CountdownTimer>
							)}

							<ActionRow style={{ marginTop: '1.5rem' }}>
								{!deviceFlow.pollingStatus.isPolling ? (
									<Button
										onClick={deviceFlow.startPolling}
										disabled={
											!deviceFlow.deviceCodeData ||
											deviceFlow.timeRemaining === 0 ||
											deviceFlow.pollingStatus.status === 'success'
										}
									>
										<FiRefreshCw /> Start Polling
									</Button>
								) : (
									<Button onClick={deviceFlow.stopPolling} $variant="outline">
										<FiAlertCircle /> Stop Polling
									</Button>
								)}
								<Button onClick={handleReset} $variant="danger">
									<FiRefreshCw /> Start Over
								</Button>
							</ActionRow>
						</ExplanationSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderTokens = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tokensOverview')}
					aria-expanded={!collapsedSections.tokensOverview}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Tokens Received
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tokensOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tokensOverview && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Authorization Complete!</InfoTitle>
								<InfoText>
									The user has successfully authorized the device. Tokens have been received and
									stored.
								</InfoText>
							</div>
						</InfoBox>

						{deviceFlow.tokens && (
							<>
								<ResultsSection style={{ marginTop: '1.5rem' }}>
									<ResultsHeading>
										<FiKey size={18} /> Access Token
									</ResultsHeading>
									<GeneratedContentBox>
										{/* JWT Token Display with decoding capabilities */}
										<JWTTokenDisplay
											token={deviceFlow.tokens.access_token}
											tokenType="access_token"
											onCopy={(tokenValue, label) => handleCopy(tokenValue, label)}
											copyLabel="Access Token"
											showTokenType={true}
											showExpiry={true}
											{...(deviceFlow.tokens.expires_in && { expiresIn: Number(deviceFlow.tokens.expires_in) })}
											{...(deviceFlow.tokens.scope && { scope: String(deviceFlow.tokens.scope) })}
										/>

										<ActionRow>
											<Button onClick={navigateToTokenManagement} $variant="primary">
												<FiExternalLink /> Open Token Management
											</Button>
										</ActionRow>
									</GeneratedContentBox>
								</ResultsSection>

								{deviceFlow.tokens.id_token && (
									<ResultsSection>
										<ResultsHeading>
											<FiShield size={18} /> ID Token
										</ResultsHeading>
										<GeneratedContentBox>
											{/* JWT Token Display with decoding capabilities */}
											<JWTTokenDisplay
												token={deviceFlow.tokens.id_token}
												tokenType="id_token"
												onCopy={(tokenValue, label) => handleCopy(tokenValue, label)}
												copyLabel="ID Token"
												showTokenType={true}
												showExpiry={true}
												{...(deviceFlow.tokens.expires_in && { expiresIn: Number(deviceFlow.tokens.expires_in) })}
												{...(deviceFlow.tokens.scope && { scope: String(deviceFlow.tokens.scope) })}
											/>
										</GeneratedContentBox>
									</ResultsSection>
								)}

								{deviceFlow.tokens.refresh_token && (
									<ResultsSection>
										<ResultsHeading>
											<FiRefreshCw size={18} /> Refresh Token
										</ResultsHeading>
										<GeneratedContentBox>
											<ParameterGrid>
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Refresh Token</ParameterLabel>
													<ParameterValue
														style={{
															wordBreak: 'break-all',
															fontFamily: 'monospace',
															fontSize: '0.75rem',
														}}
													>
														{deviceFlow.tokens.refresh_token}
													</ParameterValue>
												</div>
											</ParameterGrid>
											<ActionRow>
												<Button
													onClick={() =>
														handleCopy(deviceFlow.tokens!.refresh_token!, 'Refresh Token')
													}
													$variant="outline"
												>
													<FiCopy /> Copy Refresh Token
												</Button>
											</ActionRow>
										</GeneratedContentBox>
									</ResultsSection>
								)}
							</>
						)}
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderUserInfo = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('userInfoOverview')}
					aria-expanded={!collapsedSections.userInfoOverview}
				>
					<CollapsibleTitle>
						<FiInfo /> User Information (Coming Soon)
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.userInfoOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.userInfoOverview && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>User Information Endpoint</InfoTitle>
								<InfoText>
									Use the access token to fetch user information from the /userinfo endpoint. This
									feature will be added in a future update.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderIntrospection = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('introspectionOverview')}
					aria-expanded={!collapsedSections.introspectionOverview}
				>
					<CollapsibleTitle>
						<FiShield /> Token Introspection (Coming Soon)
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.introspectionOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.introspectionOverview && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<InfoTitle>Token Introspection</InfoTitle>
								<InfoText>
									Introspect the access token to validate it and view its claims. This feature will
									be added in a future update.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderCompletion = () => {
		const completionConfig = {
			...FlowCompletionConfigs.deviceAuthorization,
			onStartNewFlow: handleReset,
			showUserInfo: Boolean(userInfo),
			showIntrospection: Boolean(introspectionResult),
			userInfo,
			introspectionResult
		};

		return (
			<FlowCompletionService
				config={completionConfig}
				collapsed={collapsedSections.completionOverview}
				onToggleCollapsed={() => toggleSection('completionOverview')}
			/>
		);
	};

	const renderFlowSummary = () => {
		const completionConfig = {
			...FlowCompletionConfigs.deviceAuthorization,
			onStartNewFlow: handleReset,
			showUserInfo: Boolean(userInfo),
			showIntrospection: Boolean(introspectionResult),
			userInfo,
			introspectionResult
		};

		return (
			<FlowCompletionService
				config={completionConfig}
				collapsed={collapsedSections.flowSummary}
				onToggleCollapsed={() => toggleSection('flowSummary')}
			/>
		);
	};

	return (
		<FlowContainer>
			<FlowContent>
				<StandardFlowHeader flowId="oidc-device-authorization-v6" />
				
				{UISettingsService.getFlowSpecificSettingsPanel('device-authorization')}
				
				<FlowInfoCard flowInfo={getFlowInfo('device-code')!} />
				<FlowSequenceDisplay flowType="device-authorization" />
				{renderStepContent()}

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
					onReset={handleReset}
					onNext={() => setCurrentStep((prev) => Math.min(prev + 1, STEP_METADATA.length - 1))}
					canNavigateNext={isStepValid(currentStep + 1)}
					isFirstStep={currentStep === 0}
					nextButtonText={isStepValid(currentStep + 1) ? 'Next' : 'Complete above action'}
					disabledMessage="Complete the action above to continue"
				/>
			</FlowContent>

			{/* Polling Prompt Modal */}
			<ModalOverlay $isOpen={showPollingModal}>
				<ModalContent>
					<ModalHeader>
						<FiClock size={32} color="#3b82f6" />
						<ModalTitle>Ready to Start Polling?</ModalTitle>
					</ModalHeader>
					<ModalBody>
						<p>
							The device code has been generated and displayed on the Smart TV. The user can now
							scan the QR code or enter the code on their phone.
						</p>
						<p style={{ marginTop: '1rem' }}>
							<strong>Next step:</strong> Start polling the authorization server to check if the
							user has completed authorization. The app will automatically check every{' '}
							{deviceFlow.deviceCodeData?.interval || 5} seconds.
						</p>
						<p
							style={{
								marginTop: '1rem',
								padding: '0.75rem',
								backgroundColor: '#eff6ff',
								borderRadius: '0.5rem',
								border: '1px solid #bfdbfe',
							}}
						>
							📺 <strong>Watch the Smart TV display update in real-time</strong> as the user
							authorizes on their phone!
						</p>
						<InfoBox $variant="info" style={{ marginTop: '1rem' }}>
							<FiInfo size={18} />
							<div>
								<InfoText style={{ fontSize: '0.875rem', margin: 0 }}>
									💡 <strong>Tip:</strong> You can disable this prompt in UI Settings if you prefer
									to start polling manually.
								</InfoText>
							</div>
						</InfoBox>
					</ModalBody>
					<ModalActions>
						<Button onClick={handleDismissModal} $variant="outline">
							I'll Start Later
						</Button>
						<Button onClick={handleStartPolling} $variant="primary">
							<FiRefreshCw /> Start Polling Now
						</Button>
					</ModalActions>
				</ModalContent>
			</ModalOverlay>
		</FlowContainer>
	);
};

export default OIDCDeviceAuthorizationFlowV6;
