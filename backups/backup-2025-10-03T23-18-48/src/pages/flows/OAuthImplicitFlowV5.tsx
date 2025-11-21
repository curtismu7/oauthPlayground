// src/pages/flows/OAuthImplicitFlowV5.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import {
	ExplanationHeading,
	ExplanationSection,
	FlowDiagram,
	FlowStep,
	FlowStepContent,
	FlowStepNumber,
} from '../../components/InfoBlocks';
import NextSteps from '../../components/NextSteps';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../../components/PingOneApplicationConfig';
import ResponseModeSelector from '../../components/ResponseModeSelector';
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
import { useUISettings } from '../../contexts/UISettingsContext';
import { useImplicitFlowController } from '../../hooks/useImplicitFlowController';
import { ApiCallDisplayService } from '../../services/apiCallDisplayService';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import { FlowHeader } from '../../services/flowHeaderService';
// New service imports for enhanced functionality
import { FlowLayoutService } from '../../services/flowLayoutService';
import { FlowStateService } from '../../services/flowStateService';
import { ResponseMode } from '../../services/responseModeService';
import {
	IntrospectionApiCallData,
	TokenIntrospectionService,
} from '../../services/tokenIntrospectionService';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Flow configuration
const FLOW_TYPE = 'implicit';

// Step configuration
const STEP_CONFIGS = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Implicit Flow' },
	{ title: 'Step 1: Authorization Request', subtitle: 'Build and launch the authorization URL' },
	{ title: 'Step 2: Token Response', subtitle: 'Receive tokens directly from URL fragment' },
	{ title: 'Step 3: Token Introspection', subtitle: 'Validate and inspect tokens' },
	{ title: 'Step 4: Security Features', subtitle: 'Advanced security demonstrations' },
	{ title: 'Step 5: Flow Summary', subtitle: 'Complete flow overview and next steps' },
];

// Service-generated metadata
const STEP_METADATA = FlowStateService.createStepMetadata(STEP_CONFIGS);
const INTRO_SECTION_KEYS = FlowStateService.createIntroSectionKeys(FLOW_TYPE);

type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'results'
	| 'authRequestOverview'
	| 'authRequestDetails'
	| 'tokenResponseOverview'
	| 'tokenResponseDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'completionOverview'
	| 'completionDetails'
	| 'apiCallDisplay'
	| 'securityOverview'
	| 'securityBestPractices'
	| 'flowSummary'
	| 'flowComparison';

const DEFAULT_APP_CONFIG: PingOneApplicationState = {
	clientAuthMethod: 'none', // Implicit flow doesn't use client authentication
	allowRedirectUriPatterns: false,
	pkceEnforcement: 'OPTIONAL',
	responseTypeCode: false,
	responseTypeToken: true,
	responseTypeIdToken: false,
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
	pushedAuthorizationRequestTimeout: 60,
	additionalRefreshTokenReplayProtection: false,
	includeX5tParameter: false,
	oidcSessionManagement: false,
	requestScopesForMultipleResources: false,
	terminateUserSessionByIdToken: false,
	corsOrigins: [],
	corsAllowAnyOrigin: false,
};

// Styled components (reusing AuthZ V5 styles with orange theme for Implicit)
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
	background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
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
	background: rgba(249, 115, 22, 0.2);
	border: 1px solid #fb923c;
	color: #fed7aa;
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
	background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #7c2d12;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
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
	color: #ea580c;
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

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'danger' }>`
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
			if ($variant === 'danger') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'danger') return '#fee2e2';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0 0 0.5rem 0;
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
		background-color: #f97316;
		color: #ffffff;
		&:hover:not(:disabled) {
			background-color: #ea580c;
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
		color: #7c2d12;
		border-color: #fed7aa;
		&:hover:not(:disabled) {
			background-color: #ffedd5;
			border-color: #f97316;
		}
	`}
`;

const HighlightedActionButton = styled(Button)<{ $priority: 'primary' | 'success' }>`
	position: relative;
	background:
		${({ $priority }) =>
			$priority === 'primary'
				? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
				: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'};
	box-shadow:
		${({ $priority }) =>
			$priority === 'primary'
				? '0 6px 18px rgba(249, 115, 22, 0.35)'
				: '0 6px 18px rgba(234, 88, 12, 0.35)'};
	color: #ffffff;
	padding-right: 2.5rem;

	&:hover {
		transform: scale(1.02);
	}

	&:disabled {
		background:
			${({ $priority }) =>
				$priority === 'primary'
					? 'linear-gradient(135deg, rgba(249,115,22,0.6) 0%, rgba(234,88,12,0.6) 100%)'
					: 'linear-gradient(135deg, rgba(251,146,60,0.6) 0%, rgba(249,115,22,0.6) 100%)'};
		box-shadow: none;
	}
`;

const HighlightBadge = styled.span`
	position: absolute;
	top: -10px;
	right: -10px;
	background: #f97316;
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

const GeneratedContentBox = styled.div`
	background-color: #fff7ed;
	border: 1px solid #fb923c;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #ea580c;
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
	color: #ea580c;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #7c2d12;
	word-break: break-all;
	background-color: #ffedd5;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid #fed7aa;
`;

const RequirementsIndicator = FlowLayoutService.getRequirementsIndicatorStyles();
const RequirementsIcon = FlowLayoutService.getRequirementsIconStyles();
const RequirementsText = FlowLayoutService.getRequirementsTextStyles();

// Requirements components now generated by FlowLayoutService

const OAuthImplicitFlowV5: React.FC = () => {
	console.log('🚀 [OAuthImplicitFlowV5] Component loaded!', {
		url: window.location.href,
		hash: window.location.hash,
		timestamp: new Date().toISOString(),
	});

	const controller = useImplicitFlowController({
		flowKey: 'oauth-implicit-v5',
		defaultFlowVariant: 'oauth',
		enableDebugger: true,
	});

	const { settings } = useUISettings();
	const { showApiCallExamples } = settings;

	// Override response_type for OAuth Implicit (access token only)
	useEffect(() => {
		if (controller.credentials.responseType !== 'token') {
			controller.setCredentials({
				...controller.credentials,
				responseType: 'token',
			});
		}
	}, [controller.credentials, controller.setCredentials]);

	const [currentStep, setCurrentStep] = useState(() => {
		// Check for restore_step from token management navigation
		const restoreStep = sessionStorage.getItem('restore_step');
		if (restoreStep) {
			const step = parseInt(restoreStep, 10);
			sessionStorage.removeItem('restore_step'); // Clear after use
			console.log('🔗 [OAuthImplicitFlowV5] Restoring to step:', step);
			return step;
		}
		return 0;
	});
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
	const [emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
	const [responseMode, setResponseMode] = useState<ResponseMode>('fragment');

	// API call tracking for display
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		...FlowStateService.createDefaultCollapsedSections(INTRO_SECTION_KEYS),
		apiCallDisplay: false, // Default to expanded for API call examples
		securityOverview: false, // Default to expanded for security overview
		securityBestPractices: false, // Default to expanded for best practices
		flowSummary: false, // Default to expanded for flow summary
		flowComparison: true, // Default to collapsed for comparison
	});
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Check for tokens in URL fragment on mount
	useEffect(() => {
		const hash = window.location.hash;
		if (hash?.includes('access_token')) {
			console.log('🎉 [OAuthImplicitFlowV5] Tokens found in URL fragment');
			controller.setTokensFromFragment(hash);
			setCurrentStep(2); // Go to token response step
			v4ToastManager.showSuccess('Tokens received successfully from authorization server!');

			// Clean up URL
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, [controller]);

	// Step completions are now handled by FlowStateService

	const toggleSection = useCallback((key: IntroSectionKey) => {
		setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

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
		const required: Array<keyof StepCredentials> = ['environmentId', 'clientId', 'redirectUri'];
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
			redirectUri: 'https://localhost:3000/implicit-callback',
			scope: 'openid',
			scopes: 'openid',
			responseType: 'token',
			grantType: '',
			clientAuthMethod: 'none',
		});
		setEmptyRequiredFields(new Set(['environmentId', 'clientId', 'redirectUri']));
		v4ToastManager.showSuccess('Configuration cleared. Enter credentials to continue.');
	}, [controller]);

	const savePingOneConfig = useCallback((config: PingOneApplicationState) => {
		setPingOneConfig(config);
		sessionStorage.setItem('oauth-implicit-v5-app-config', JSON.stringify(config));
	}, []);

	const handleGenerateAuthUrl = useCallback(async () => {
		if (!controller.credentials.clientId || !controller.credentials.environmentId) {
			v4ToastManager.showError(
				'Complete above action: Fill in Client ID and Environment ID first.'
			);
			return;
		}

		// Generate nonce and state if not set
		if (!controller.nonce) {
			controller.generateNonce();
		}
		if (!controller.state) {
			controller.generateState();
		}

		try {
			// Mark this flow as active for callback handling
			sessionStorage.setItem('oauth-implicit-v5-flow-active', 'true');

			await controller.generateAuthorizationUrl();
			v4ToastManager.showSuccess('Authorization URL generated successfully!');
		} catch (error) {
			console.error('[OAuthImplicitFlowV5] Failed to generate authorization URL:', error);
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
		console.log('🔧 [OAuthImplicitFlowV5] Redirecting to PingOne...');
		controller.handleRedirectAuthorization();
	}, [controller]);

	// User info fetching is now handled by the controller directly

	const handleCopy = useCallback((text: string, label: string) => {
		v4ToastManager.handleCopyOperation(text, label);
		setCopiedField(label);
		setTimeout(() => setCopiedField(null), 1000);
	}, []);

	const navigateToTokenManagement = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('oauth-implicit-v5', currentStep, 'oauth');

		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'oauth-implicit-v5');

		const flowContext = {
			flow: 'oauth-implicit-v5',
			tokens: controller.tokens,
			credentials: controller.credentials,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

		if (controller.tokens?.access_token) {
			localStorage.setItem('token_to_analyze', controller.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'oauth-implicit-v5');
		}

		window.open('/token-management', '_blank');
	}, [controller.tokens, controller.credentials, currentStep]);

	const handleResetFlow = useCallback(() => {
		controller.resetFlow();
		setCurrentStep(0);
	}, [controller]);

	const handleIntrospectToken = useCallback(
		async (token: string) => {
			const credentials = controller.credentials;

			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error('Missing PingOne credentials. Please configure your credentials first.');
			}

			const request = {
				token: token,
				clientId: credentials.clientId,
				// No client secret for implicit flow (public client)
				tokenTypeHint: 'access_token' as const,
			};

			try {
				// Use the reusable service to create API call data and execute introspection
				const result = await TokenIntrospectionService.introspectToken(
					request,
					'implicit',
					`https://auth.pingone.com/${credentials.environmentId}/as/introspect`
				);

				// Set the API call data for display
				setIntrospectionApiCall(result.apiCall);

				return result.response;
			} catch (error) {
				// Create error API call using reusable service
				const errorApiCall = TokenIntrospectionService.createErrorApiCall(
					request,
					'implicit',
					error instanceof Error ? error.message : 'Unknown error',
					500,
					`https://auth.pingone.com/${credentials.environmentId}/as/introspect`
				);

				setIntrospectionApiCall(errorApiCall);
				throw error;
			}
		},
		[controller.credentials]
	);

	// Validation and navigation functions using services
	const isStepValid = useCallback(
		(stepIndex: number) => {
			switch (stepIndex) {
				case 0:
					return true;
				case 1:
					return Boolean(controller.authUrl);
				case 2:
					return Boolean(controller.tokens);
				case 3:
					return Boolean(controller.tokens);
				case 4:
					return true;
				case 5:
					return true;
				default:
					return false;
			}
		},
		[controller.authUrl, controller.tokens]
	);

	const getStepRequirements = useCallback((stepIndex: number) => {
		switch (stepIndex) {
			case 1:
				return ['Configure credentials and generate authorization URL'];
			case 2:
				return ['Complete authorization and receive tokens'];
			case 3:
				return ['Validate and inspect received tokens'];
			case 4:
				return ['Review security features and best practices'];
			case 5:
				return ['Review flow completion and next steps'];
			default:
				return [];
		}
	}, []);

	const { handleNext, handlePrev, canNavigateNext } = FlowStateService.createStepNavigationHandlers(
		currentStep,
		setCurrentStep,
		STEP_METADATA.length
	);

	const renderStepContent = useMemo(() => {
		const credentials = controller.credentials;
		const tokens = controller.tokens;

		switch (currentStep) {
			case 0:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> Implicit Flow Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>OAuth 2.0 Implicit Flow</InfoTitle>
											<InfoText>
												This is the pure OAuth 2.0 Implicit Flow that returns{' '}
												<strong>Access Token only</strong>. It's designed for authorization and API
												access, not for user authentication.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Legacy Flow - Use with Caution</InfoTitle>
											<InfoText>
												The Implicit Flow is considered legacy and less secure than Authorization
												Code with PKCE. Tokens are exposed in the URL, making them vulnerable to
												interception. Use this flow only if you have specific requirements that
												prevent using Authorization Code + PKCE.
											</InfoText>
										</div>
									</InfoBox>

									<GeneratedContentBox>
										<GeneratedLabel>OAuth vs OIDC Implicit</GeneratedLabel>
										<ParameterGrid>
											<div>
												<ParameterLabel>Tokens Returned</ParameterLabel>
												<ParameterValue>Access Token only</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Purpose</ParameterLabel>
												<ParameterValue>Authorization (API access)</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Spec Layer</ParameterLabel>
												<ParameterValue>Defined in OAuth 2.0</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Nonce Requirement</ParameterLabel>
												<ParameterValue>Not required</ParameterValue>
											</div>
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Validation</ParameterLabel>
												<ParameterValue>Validate access token with resource server</ParameterValue>
											</div>
										</ParameterGrid>
									</GeneratedContentBox>

									<ExplanationSection>
										<ExplanationHeading>
											<FiShield /> How Implicit Flow Works
										</ExplanationHeading>
										<InfoText>
											In the Implicit Flow, tokens are returned directly from the authorization
											endpoint in the URL fragment (#), without an intermediate authorization code
											exchange step. This makes it simpler but less secure.
										</InfoText>
									</ExplanationSection>

									<FlowDiagram>
										{[
											'User clicks login to start the flow',
											'App redirects to PingOne with authorization request',
											'User authenticates and approves scopes',
											'PingOne returns tokens directly in URL fragment',
											'App extracts and validates tokens from URL',
										].map((description, index) => (
											<FlowStep key={description}>
												<FlowStepNumber>{index + 1}</FlowStepNumber>
												<FlowStepContent>
													<strong>{description}</strong>
												</FlowStepContent>
											</FlowStep>
										))}
									</FlowDiagram>
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
									<CredentialsInput
										environmentId={credentials.environmentId || ''}
										clientId={credentials.clientId || ''}
										clientSecret={''}
										redirectUri={credentials.redirectUri || ''}
										scopes={credentials.scopes || credentials.scope || ''}
										loginHint={credentials.loginHint || ''}
										onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
										onClientIdChange={(value) => handleFieldChange('clientId', value)}
										onClientSecretChange={() => {}} // Not used in Implicit
										onRedirectUriChange={(value) => handleFieldChange('redirectUri', value)}
										onScopesChange={(value) => handleFieldChange('scopes', value)}
										onLoginHintChange={(value) => handleFieldChange('loginHint', value)}
										onCopy={handleCopy}
										emptyRequiredFields={emptyRequiredFields}
										copiedField={copiedField}
										showClientSecret={false}
									/>

									<PingOneApplicationConfig value={pingOneConfig} onChange={savePingOneConfig} />

									<ActionRow>
										<Button onClick={handleSaveConfiguration} $variant="primary">
											<FiSettings /> Save Configuration
										</Button>
										<Button onClick={handleClearConfiguration} $variant="danger">
											<FiRefreshCw /> Clear Configuration
										</Button>
									</ActionRow>

									{(!credentials.clientId || !credentials.environmentId) && (
										<InfoBox $variant="warning" style={{ marginTop: '1.5rem' }}>
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>Required: Fill in Credentials</InfoTitle>
												<InfoText>
													<strong>Environment ID</strong> and <strong>Client ID</strong> are
													required to continue. Fill these in above, then click "Save Configuration"
													before proceeding to Step 1.
												</InfoText>
											</div>
										</InfoBox>
									)}

									<InfoBox $variant="danger" style={{ marginTop: '2rem', color: '#7f1d1d' }}>
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle style={{ color: '#7f1d1d' }}>Security Warning</InfoTitle>
											<InfoText style={{ color: '#7f1d1d' }}>
												Implicit Flow exposes tokens in the URL. Never use this for highly sensitive
												data. Consider migrating to Authorization Code + PKCE for better security.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<ConfigurationSummaryCard
							configuration={credentials}
							onSaveConfiguration={handleSaveConfiguration}
							onLoadConfiguration={(config) => {
								if (config) {
									controller.setCredentials(config);
								}
								v4ToastManager.showSuccess('Configuration loaded from saved settings.');
							}}
							primaryColor="#f97316"
							flowType="implicit"
						/>
					</>
				);

			case 1:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authRequestOverview')}
								aria-expanded={!collapsedSections.authRequestOverview}
							>
								<CollapsibleTitle>
									<FiGlobe /> Authorization Request Overview
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
											<InfoTitle>Building the Authorization URL</InfoTitle>
											<InfoText>
												The authorization URL includes all OAuth parameters. Unlike Authorization
												Code flow, the response_type is 'token' or 'id_token token', telling PingOne
												to return tokens directly instead of an authorization code.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>OAuth Implicit Flow Specific Parameters</InfoTitle>
											<InfoList>
												<li>
													<strong>response_type:</strong> token (Access Token only)
												</li>
												<li>
													<strong>nonce:</strong>{' '}
													<span style={{ color: '#059669', fontWeight: 'bold' }}>NOT required</span>{' '}
													in OAuth Implicit (no ID Token)
												</li>
												<li>
													<strong>state:</strong> CSRF protection (recommended)
												</li>
												<li>
													<strong>No PKCE:</strong> Implicit flow doesn't support PKCE
												</li>
												<li>
													<strong>No ID Token:</strong> OAuth 2.0 doesn't provide identity tokens
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>OAuth vs OIDC</InfoTitle>
											<InfoText>
												OAuth 2.0 Implicit returns only an Access Token for API authorization. If
												you need user authentication and identity, use OIDC Implicit Flow V5 which
												returns an ID Token.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Build Authorization URL
							</ResultsHeading>
							<HelperText>
								Generate the authorization URL with Implicit flow parameters. Review it carefully
								before redirecting.
							</HelperText>

							{(!credentials.clientId || !credentials.environmentId) && (
								<InfoBox $variant="warning" style={{ marginBottom: '1.5rem' }}>
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>Missing Required Credentials</InfoTitle>
										<InfoText>
											<strong>Environment ID</strong> and <strong>Client ID</strong> are required to
											generate the authorization URL. Please go back to Step 0 to fill in these
											credentials first.
										</InfoText>
									</div>
								</InfoBox>
							)}

							<ActionRow>
								<HighlightedActionButton
									onClick={handleGenerateAuthUrl}
									$priority="primary"
									disabled={
										!!controller.authUrl || !credentials.clientId || !credentials.environmentId
									}
									title={
										!credentials.clientId || !credentials.environmentId
											? 'Complete Step 0: Fill in Environment ID and Client ID first'
											: 'Generate authorization URL with current credentials'
									}
								>
									{controller.authUrl ? <FiCheckCircle /> : <FiGlobe />}{' '}
									{controller.authUrl
										? 'Authorization URL Generated'
										: 'Generate Authorization URL'}
									<HighlightBadge>1</HighlightBadge>
								</HighlightedActionButton>

								{controller.authUrl && (
									<HighlightedActionButton onClick={handleOpenAuthUrl} $priority="success">
										<FiExternalLink /> Redirect to PingOne
										<HighlightBadge>2</HighlightBadge>
									</HighlightedActionButton>
								)}
							</ActionRow>

							{controller.authUrl && (
								<GeneratedContentBox>
									<GeneratedLabel>Generated</GeneratedLabel>
									<div
										style={{ marginBottom: '1rem', wordBreak: 'break-all', fontSize: '0.875rem' }}
									>
										{controller.authUrl}
									</div>
									<Button
										onClick={() => handleCopy(controller.authUrl, 'Authorization URL')}
										$variant="outline"
									>
										<FiCopy /> Copy URL
									</Button>
								</GeneratedContentBox>
							)}
						</ResultsSection>
					</>
				);

			case 2:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenResponseOverview')}
								aria-expanded={!collapsedSections.tokenResponseOverview}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Token Response Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenResponseOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenResponseOverview && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Tokens Received Directly</InfoTitle>
											<InfoText>
												In Implicit Flow, tokens come back in the URL fragment (#) immediately after
												authorization. No token exchange step is needed, making it simpler but
												exposing tokens in the browser.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{tokens && (
							<ResultsSection>
								<ResultsHeading>
									<FiCheckCircle size={18} /> Token Response
								</ResultsHeading>
								<HelperText>
									Review the tokens received. In Implicit Flow, there is no refresh token.
								</HelperText>

								<GeneratedContentBox>
									<GeneratedLabel>Raw Token Response</GeneratedLabel>
									<CodeBlock>{JSON.stringify(tokens, null, 2)}</CodeBlock>
									<ActionRow>
										<Button
											onClick={() => handleCopy(JSON.stringify(tokens, null, 2), 'Token Response')}
											$variant="primary"
										>
											<FiCopy /> Copy JSON Response
										</Button>
									</ActionRow>
								</GeneratedContentBox>

								<GeneratedContentBox style={{ marginTop: '1rem' }}>
									<GeneratedLabel>Tokens Received</GeneratedLabel>
									<ParameterGrid>
										{tokens.access_token && (
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Access Token</ParameterLabel>
												<ParameterValue style={{ wordBreak: 'break-all' }}>
													{String(tokens.access_token)}
												</ParameterValue>
												<Button
													onClick={() => handleCopy(String(tokens.access_token), 'Access Token')}
													$variant="primary"
													style={{ marginTop: '0.5rem' }}
												>
													<FiCopy /> Copy Access Token
												</Button>
											</div>
										)}
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
									</ParameterGrid>

									<ActionRow style={{ justifyContent: 'center', gap: '0.75rem' }}>
										<Button onClick={navigateToTokenManagement} $variant="primary">
											<FiExternalLink /> View in Token Management
										</Button>
										<Button
											onClick={navigateToTokenManagement}
											$variant="primary"
											style={{
												backgroundColor: '#f97316',
												borderColor: '#f97316',
											}}
										>
											<FiKey /> Decode Access Token
										</Button>
									</ActionRow>
								</GeneratedContentBox>

								<InfoBox $variant="warning">
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>No Refresh Token</InfoTitle>
										<InfoText>
											Implicit Flow does not provide refresh tokens for security reasons. When the
											access token expires, users must re-authenticate.
										</InfoText>
									</div>
								</InfoBox>
							</ResultsSection>
						)}
					</>
				);

			case 3:
				return (
					<>
						<TokenIntrospect
							flowName="OAuth 2.0 Implicit Flow"
							flowVersion="V5"
							tokens={controller.tokens || {}}
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
							completionMessage="You've completed the OAuth 2.0 Implicit Flow. Remember: this flow is legacy and less secure than Authorization Code + PKCE."
							nextSteps={[
								'Inspect or decode tokens using the Token Management tools.',
								'Note: No refresh token is provided in Implicit Flow.',
								'Note: No UserInfo endpoint in OAuth (use OIDC for user identity).',
								'Consider migrating to Authorization Code + PKCE for better security.',
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
										EnhancedApiCallDisplayService.getDefaultHighlightRules('implicit'),
								}}
							/>
						)}

						{/* API Call Display Section */}
						{controller.tokens?.access_token && showApiCallExamples && (
							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => toggleSection('apiCallDisplay')}
									aria-expanded={!collapsedSections.apiCallDisplay}
								>
									<CollapsibleTitle>
										<FiCode /> API Call Examples
									</CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.apiCallDisplay}>
										<FiChevronDown />
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								{!collapsedSections.apiCallDisplay && (
									<CollapsibleContent>
										<ResultsSection>
											<ResultsHeading>
												<FiCode size={18} /> Test Your Access Token
											</ResultsHeading>
											<HelperText>
												Use the access token to make authenticated API calls. Copy the curl command
												below to test your token with a PingOne API endpoint.
											</HelperText>

											{/* API Call Display using service methods */}
											{(() => {
												const apiCall = {
													method: 'GET' as const,
													url: `https://api.pingone.com/v1/environments/${controller.credentials.environmentId || '{environmentId}'}/users/me`,
													headers: {
														Authorization: `Bearer ${controller.tokens.access_token}`,
														'Content-Type': 'application/json',
													},
												};

												const curlCommand = ApiCallDisplayService.generateCurlCommand(apiCall);
												const sanitizedCall = ApiCallDisplayService.sanitizeApiCall(apiCall);

												return (
													<>
														<InfoBox $variant="info" style={{ marginBottom: '1rem' }}>
															<FiCode size={20} />
															<div>
																<InfoTitle>Get Current User Profile</InfoTitle>
																<InfoText>
																	Retrieve the authenticated user's profile information using the
																	access token. The Authorization header contains your actual access
																	token.
																</InfoText>
															</div>
														</InfoBox>

														<GeneratedContentBox>
															<GeneratedLabel>API Request Details</GeneratedLabel>
															<div style={{ marginBottom: '1rem' }}>
																<strong>Method:</strong> {sanitizedCall.method}
																<br />
																<strong>URL:</strong> {sanitizedCall.url}
																<br />
																<strong>Headers:</strong>
																<ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
																	{Object.entries(sanitizedCall.headers || {}).map(
																		([key, value]) => (
																			<li
																				key={key}
																				style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
																			>
																				{key}: {value}
																			</li>
																		)
																	)}
																</ul>
															</div>
														</GeneratedContentBox>

														<GeneratedContentBox style={{ marginTop: '1rem' }}>
															<GeneratedLabel>cURL Command</GeneratedLabel>
															<CodeBlock style={{ margin: 0 }}>{curlCommand}</CodeBlock>
															<ActionRow>
																<Button
																	onClick={() => handleCopy(curlCommand, 'API call curl command')}
																	$variant="primary"
																>
																	<FiCopy /> Copy cURL Command
																</Button>
															</ActionRow>
														</GeneratedContentBox>
													</>
												);
											})()}

											<InfoBox $variant="info" style={{ marginTop: '1.5rem' }}>
												<FiInfo size={20} />
												<div>
													<InfoTitle>API Testing Tips</InfoTitle>
													<InfoText>
														• Replace <code>{'{environmentId}'}</code> with your actual PingOne
														environment ID
														<br />• The access token is valid for the scopes you requested
														<br />• Test with different API endpoints to verify token functionality
														<br />• Monitor token expiration and handle refresh scenarios
													</InfoText>
												</div>
											</InfoBox>
										</ResultsSection>
									</CollapsibleContent>
								)}
							</CollapsibleSection>
						)}
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('securityOverview')}
								aria-expanded={!collapsedSections.securityOverview}
							>
								<CollapsibleTitle>
									<FiShield /> Security Features Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.securityOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.securityOverview && (
								<CollapsibleContent>
									<InfoBox $variant="warning">
										<FiAlertTriangle size={20} />
										<div>
											<InfoTitle>Implicit Flow Security Considerations</InfoTitle>
											<InfoText>
												The Implicit Flow has inherent security limitations. Tokens are exposed in
												the URL, making them vulnerable to interception. This step demonstrates
												security best practices and mitigation strategies.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>Security Features Demonstrated</InfoTitle>
											<InfoList>
												<li>
													<strong>Token Revocation:</strong> Ability to revoke access tokens before
													expiration
												</li>
												<li>
													<strong>Session Termination:</strong> End user sessions and invalidate
													tokens
												</li>
												<li>
													<strong>State Parameter:</strong> CSRF protection using state parameter
												</li>
												<li>
													<strong>HTTPS Only:</strong> All communications must use HTTPS
												</li>
												<li>
													<strong>Token Validation:</strong> Always validate tokens before use
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
								<FiShield size={18} /> Interactive Security Demonstrations
							</ResultsHeading>
							<HelperText>
								Test security features and understand how to protect your OAuth implementation.
							</HelperText>

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
						</ResultsSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('securityBestPractices')}
								aria-expanded={!collapsedSections.securityBestPractices}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Security Best Practices
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.securityBestPractices}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.securityBestPractices && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Recommended Security Practices</InfoTitle>
											<InfoList>
												<li>
													<strong>Use HTTPS:</strong> Always use HTTPS for all OAuth endpoints
												</li>
												<li>
													<strong>Validate State:</strong> Always validate the state parameter to
													prevent CSRF
												</li>
												<li>
													<strong>Short Token Lifetimes:</strong> Use short-lived access tokens
												</li>
												<li>
													<strong>Token Storage:</strong> Never store tokens in localStorage for
													production
												</li>
												<li>
													<strong>Consider PKCE:</strong> Use Authorization Code + PKCE instead of
													Implicit
												</li>
												<li>
													<strong>Regular Audits:</strong> Regularly audit and rotate client secrets
												</li>
											</InfoList>
										</div>
									</InfoBox>

									<InfoBox $variant="danger">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Critical Security Warnings</InfoTitle>
											<InfoText>
												<strong>⚠️ Production Warning:</strong> The Implicit Flow is deprecated by
												OAuth 2.1 specification due to security concerns. Use Authorization Code +
												PKCE flow for new implementations.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 5:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('flowSummary')}
								aria-expanded={!collapsedSections.flowSummary}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Flow Completion Summary
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.flowSummary}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.flowSummary && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>OAuth 2.0 Implicit Flow Completed!</InfoTitle>
											<InfoText>
												Congratulations! You have successfully completed the OAuth 2.0 Implicit Flow
												demonstration. This flow returned an access token directly in the URL
												fragment for API authorization.
											</InfoText>
										</div>
									</InfoBox>

									<GeneratedContentBox>
										<GeneratedLabel>Flow Summary</GeneratedLabel>
										<ParameterGrid>
											<div>
												<ParameterLabel>Flow Type</ParameterLabel>
												<ParameterValue>OAuth 2.0 Implicit</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Tokens Received</ParameterLabel>
												<ParameterValue>Access Token Only</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Security Level</ParameterLabel>
												<ParameterValue>Legacy (Deprecated)</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Refresh Token</ParameterLabel>
												<ParameterValue>Not Provided</ParameterValue>
											</div>
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Recommended Alternative</ParameterLabel>
												<ParameterValue>Authorization Code + PKCE Flow</ParameterValue>
											</div>
										</ParameterGrid>
									</GeneratedContentBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiExternalLink size={18} /> Next Steps & Recommendations
							</ResultsHeading>
							<HelperText>
								What to do now that you've completed the Implicit Flow demonstration.
							</HelperText>

							<InfoBox $variant="info">
								<FiInfo size={20} />
								<div>
									<InfoTitle>Recommended Actions</InfoTitle>
									<NextSteps
										steps={[
											'Try Authorization Code + PKCE: Experience the more secure modern OAuth flow',
											'Explore OIDC Implicit: See how OpenID Connect adds identity tokens',
											'Test API Calls: Use your access token to call protected APIs',
											'Review Security: Understand the limitations of Implicit Flow',
											'Token Management: Decode and inspect your tokens in detail',
										]}
									/>
								</div>
							</InfoBox>

							<ActionRow style={{ justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
								<Button
									onClick={() => window.open('/authorization-code-v5', '_blank')}
									$variant="primary"
								>
									<FiExternalLink /> Try Auth Code + PKCE
								</Button>
								<Button
									onClick={() => window.open('/oidc-implicit-v5', '_blank')}
									$variant="secondary"
								>
									<FiExternalLink /> Try OIDC Implicit
								</Button>
								<Button onClick={navigateToTokenManagement} $variant="success">
									<FiKey /> Token Management
								</Button>
								<Button onClick={handleResetFlow} $variant="outline">
									<FiRefreshCw /> Reset Flow
								</Button>
							</ActionRow>
						</ResultsSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('flowComparison')}
								aria-expanded={!collapsedSections.flowComparison}
							>
								<CollapsibleTitle>
									<FiShield /> Flow Comparison & Migration Guide
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.flowComparison}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.flowComparison && (
								<CollapsibleContent>
									<InfoBox $variant="warning">
										<FiAlertTriangle size={20} />
										<div>
											<InfoTitle>Implicit Flow vs Authorization Code + PKCE</InfoTitle>
											<NextSteps
												steps={[
													'Security: Auth Code + PKCE is more secure (no token exposure)',
													'Tokens: Auth Code provides refresh tokens for long-term access',
													'Standards: Auth Code + PKCE is OAuth 2.1 recommended',
													'Browser Support: Auth Code works better with modern browsers',
													'Migration: Implicit Flow is deprecated - plan migration',
												]}
											/>
										</div>
									</InfoBox>

									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Migration Benefits</InfoTitle>
											<InfoText>
												Migrating to Authorization Code + PKCE provides better security, refresh
												tokens, and compliance with modern OAuth standards. Your applications will
												be more secure and future-proof.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			default:
				return null;
		}
	}, [
		collapsedSections,
		controller,
		currentStep,
		emptyRequiredFields,
		copiedField,
		handleCopy,
		handleGenerateAuthUrl,
		handleOpenAuthUrl,
		handleClearConfiguration,
		handleFieldChange,
		handleResetFlow,
		handleSaveConfiguration,
		handleIntrospectToken,
		navigateToTokenManagement,
		pingOneConfig,
		savePingOneConfig,
		showApiCallExamples,
		toggleSection,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oauth-implicit-v5" />
				<FlowInfoCard flowInfo={getFlowInfo('oauth-implicit')!} />
				<FlowSequenceDisplay flowType="oauth-implicit" />

				<InfoBox $variant="info">
					<FiInfo />
					<div>
						<InfoTitle>Response Mode Selection</InfoTitle>
						<InfoText>
							Choose how PingOne returns the authorization response. Implicit Flow typically uses
							fragment mode for client-side applications and SPAs.
						</InfoText>
					</div>
				</InfoBox>

				<ResponseModeSelector
					selectedMode={responseMode}
					onModeChange={setResponseMode}
					responseType="token id_token"
					clientType="public"
					platform="web"
					showRecommendations={true}
					showUrlExamples={true}
					baseUrl="https://auth.pingone.com/{envID}/as/authorize"
				/>

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Implicit Flow · V5 · Legacy</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {String(STEP_METADATA.length).padStart(2, '0')}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

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
				onNext={handleNext}
				canNavigateNext={canNavigateNext()}
				isFirstStep={currentStep === 0}
				nextButtonText={isStepValid(currentStep) ? 'Next' : 'Complete above action'}
				disabledMessage="Complete the action above to continue"
			/>
		</Container>
	);
};

export default OAuthImplicitFlowV5;
