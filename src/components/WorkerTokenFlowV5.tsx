// src/components/WorkerTokenFlowV5.tsx
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import { themeService } from '../services/themeService';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';
import { useWorkerTokenFlowController } from '../hooks/useWorkerTokenFlowController';
import { pingOneConfigService } from '../services/pingoneConfigService';
import { trackOAuthFlow } from '../utils/activityTracker';
import { getFlowInfo } from '../utils/flowInfoConfig';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../utils/flowNavigation';
import { CredentialsInput } from './CredentialsInput';
import EnvironmentIdInput from './EnvironmentIdInput';
import { oidcDiscoveryService } from '../services/oidcDiscoveryService';
import { workerTokenDiscoveryService } from '../services/workerTokenDiscoveryService';
import FlowConfigurationRequirements from './FlowConfigurationRequirements';
import FlowInfoCard from './FlowInfoCard';
import FlowSequenceDisplay from './FlowSequenceDisplay';
import { FlowDiagram, FlowStep, FlowStepContent, FlowStepNumber } from './InfoBlocks';
import PingOneApplicationConfig, { type PingOneApplicationState } from './PingOneApplicationConfig';
import { HelperText, ResultsHeading, ResultsSection, SectionDivider } from './ResultsPanel';
import SecurityFeaturesDemo from './SecurityFeaturesDemo';
import { StepNavigationButtons } from './StepNavigationButtons';
import TokenIntrospect from './TokenIntrospect';
import { EnhancedApiCallDisplay } from './EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService } from '../services/enhancedApiCallDisplayService';
import {
	TokenIntrospectionService,
	IntrospectionApiCallData,
} from '../services/tokenIntrospectionService';
import PingOneWorkerInfo from './PingOneWorkerInfo';
import UnifiedTokenDisplayService from '../services/unifiedTokenDisplayService';

export interface WorkerTokenFlowV5Props {
	flowName?: string;
	flowVersion?: string;
	completionMessage?: string;
	nextSteps?: string[];
}

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the Worker Token Flow and configure PingOne',
	},
	{
		title: 'Step 1: Worker Token Request',
		subtitle: 'Request access token using client credentials',
	},
	{ title: 'Step 2: Token Response & Management', subtitle: 'Review tokens and manage them' },
	{ title: 'Step 3: Security Features', subtitle: 'Demonstrate advanced security implementations' },
	{ title: 'Step 4: Token Introspection', subtitle: 'Validate and introspect the access token' },
] as const;
type StepCompletionState = Record<number, boolean>;
type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'results' // Step 0
	| 'securityOverview'
	| 'securityDetails'
	| 'introspectionOverview'
	| 'introspectionDetails'
	| 'workerInfo';

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

const HeaderSection = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const MainTitle = styled.h1`
	font-size: 1.875rem;
	font-weight: 700;
	color: var(--color-text-primary, #111827);
	margin-bottom: 1rem;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: var(--color-text-secondary, #4b5563);
	margin: 0 auto;
	max-width: 42rem;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
	background: rgba(5, 150, 105, 0.2);
	border: 1px solid #34d399;
	color: #a7f3d0;
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
	font-size: 1.125rem;
	margin: 0;
	opacity: 0.9;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const CollapsibleSection = styled.div`
	margin-bottom: 1.5rem;
`;

const CollapsibleHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: #f1f5f9;
		border-color: #cbd5e1;
	}
`;

const CollapsibleTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed: boolean }>`
	${() => themeService.getCollapseIconStyles()}
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	display: flex;
	align-items: center;
	justify-content: center;

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	background-color: #ffffff;
	border: 1px solid #e2e8f0;
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' | 'error' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	background-color: ${({ $variant }) =>
		$variant === 'success'
			? '#f0fdf4'
			: $variant === 'warning'
				? '#fef3c7'
				: $variant === 'error'
					? '#fef2f2'
					: '#eff6ff'};
	border: 1px solid ${({ $variant }) =>
		$variant === 'success'
			? '#22c55e'
			: $variant === 'warning'
				? '#f59e0b'
				: $variant === 'error'
					? '#ef4444'
					: '#3b82f6'};
`;

const InfoTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #111827;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0 0 0.5rem 0;
	line-height: 1.5;
`;

const InfoList = styled.ul`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
	padding-left: 1.25rem;
	line-height: 1.5;

	li {
		margin-bottom: 0.25rem;
	}
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 1rem;
	margin: 1rem 0;

	@media (min-width: 768px) {
		grid-template-columns: 1fr 1fr;
	}
`;

const ParameterLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const ParameterValue = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
	word-break: break-all;
	background-color: #f9fafb;
	padding: 0.5rem;
	border-radius: 0.375rem;
	border: 1px solid #e5e7eb;
`;

const ActionRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 1.5rem 0;

	@media (min-width: 768px) {
		flex-direction: row;
		align-items: center;
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'outline' | 'success' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	border: none;
	cursor: pointer;
	transition: all 0.2s;
	text-decoration: none;
	justify-content: center;

	${({ $variant = 'primary', theme }) => {
		switch ($variant) {
			case 'primary':
				return `
					background-color: #059669;
					color: white !important;
					&:hover {
						background-color: #047857;
						color: white !important;
					}
				`;
			case 'secondary':
				return `
					background-color: #6b7280;
					color: white !important;
					&:hover {
						background-color: #4b5563;
						color: white !important;
					}
				`;
			case 'outline':
				return `
					background-color: transparent;
					color: #059669 !important;
					border: 1px solid #059669;
					&:hover {
						background-color: #059669;
						color: white !important;
					}
				`;
			case 'success':
				return `
					background-color: #10b981;
					color: white !important;
					&:hover {
						background-color: #059669;
						color: white !important;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		color: white !important;
	}
`;

const GeneratedContentBox = styled.div`
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: #059669;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
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

const WorkerTokenFlowV5: React.FC<WorkerTokenFlowV5Props> = ({
	flowName = 'PingOne Worker Token Flow',
	flowVersion = 'V5',
	completionMessage = 'Nice work! You successfully completed the PingOne Worker Token Flow using reusable V5 components.',
	nextSteps = [
		'Inspect or decode tokens using the Token Management tools.',
		'Repeat the flow with different scopes or client credentials.',
		'Explore token introspection and revocation flows.',
	],
}) => {
	const navigate = useNavigate();
	const _manualAuthCodeId = useId();
	const controller = useWorkerTokenFlowController({
		flowKey: 'worker-token-v5',
		enableDebugger: true,
	});

	const [currentStep, setCurrentStep] = useState(() => {
		const restoreStep = sessionStorage.getItem('restore_step');
		return restoreStep ? parseInt(restoreStep, 10) : 0;
	});

	// API call tracking for display
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);

	// Wrapper for introspection that creates API call data using reusable service
	const handleIntrospectToken = useCallback(async () => {
		if (!controller.tokens?.access_token) {
			v4ToastManager.showError('No access token available for introspection');
			return;
		}

		const request = {
			token: controller.tokens.access_token,
			clientId: controller.credentials.clientId,
			clientSecret: controller.credentials.clientSecret,
			tokenTypeHint: 'access_token' as const,
		};

		try {
			await controller.introspectToken();

			// Create success API call using reusable service
			const successApiCall = TokenIntrospectionService.createSuccessApiCall(
				request,
				'worker-token',
				controller.introspectionResults as any
			);

			setIntrospectionApiCall(successApiCall);
		} catch (error) {
			// Create error API call using reusable service
			const errorApiCall = TokenIntrospectionService.createErrorApiCall(
				request,
				'worker-token',
				error instanceof Error ? error.message : 'Unknown error'
			);

			setIntrospectionApiCall(errorApiCall);
		}
	}, [controller]);

	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>({
		// Step 0
		overview: false,
		flowDiagram: true, // Collapsed by default
		credentials: false, // Expanded by default - users need to see credentials first
		results: false,
		// Step 3
		securityOverview: false,
		securityDetails: false,
		// Step 4
		introspectionOverview: false,
		introspectionDetails: false,
		// Worker Info section - collapsed by default
		workerInfo: true,
	});

	const [stepCompletion, setStepCompletion] = useState<StepCompletionState>({
		0: true, // Step 0 is always complete (introduction)
	});

	// PingOne configuration state
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		clientAuthMethod: 'client_secret_post',
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'OPTIONAL',
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
		pushedAuthorizationRequestTimeout: 600,
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});

	// Load PingOne configuration on mount
	useEffect(() => {
		const loadPingOneConfig = async () => {
			try {
				const config = pingOneConfigService.loadConfig();
				// Map PingOneConfig to PingOneApplicationState
				const mappedConfig: PingOneApplicationState = {
					clientAuthMethod: (config.tokenAuthMethod as any) || 'client_secret_post',
					allowRedirectUriPatterns: config.allowRedirectUriPatterns || false,
					pkceEnforcement: 'OPTIONAL',
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
					pushedAuthorizationRequestTimeout: 600,
					additionalRefreshTokenReplayProtection: false,
					includeX5tParameter: false,
					oidcSessionManagement: config.advanced?.oidcSessionManagement || false,
					requestScopesForMultipleResources: false,
					terminateUserSessionByIdToken: config.advanced?.terminateByIdToken || false,
					corsOrigins: [],
					corsAllowAnyOrigin: false,
				};
				setPingOneConfig(mappedConfig);
			} catch (error) {
				console.warn('Failed to load PingOne config:', error);
				// Keep the default state if loading fails
			}
		};
		loadPingOneConfig();
	}, []);

	// Save PingOne configuration
	const savePingOneConfig = useCallback(async (newConfig: PingOneApplicationState) => {
		try {
			// Map PingOneApplicationState to PingOneConfig
			const currentConfig = pingOneConfigService.loadConfig();
			const mappedConfig = {
				...currentConfig,
				tokenAuthMethod: newConfig.clientAuthMethod,
				allowRedirectUriPatterns: newConfig.allowRedirectUriPatterns,
				advanced: {
					...currentConfig.advanced,
					oidcSessionManagement: newConfig.oidcSessionManagement,
					terminateByIdToken: newConfig.terminateUserSessionByIdToken,
				},
			};

			pingOneConfigService.saveConfig(mappedConfig);
			setPingOneConfig(newConfig);
			v4ToastManager.showSuccess('PingOne configuration saved successfully!');
		} catch (error) {
			v4ToastManager.showError('Failed to save PingOne configuration');
			console.error('Failed to save PingOne config:', error);
		}
	}, []);

	// Toggle collapsible sections
	const toggleSection = useCallback((section: IntroSectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	// Step validation functions
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0: // Step 0: Introduction & Setup
					return true; // Always valid - introduction step
				case 1: // Step 1: Worker Token Request
					return Boolean(controller.tokens?.access_token);
				case 2: // Step 2: Token Response & Management
					return Boolean(controller.tokens?.access_token);
				case 3: // Step 3: Security Features
					return Boolean(controller.tokens?.access_token);
				case 4: // Step 4: Token Introspection
					return Boolean(controller.tokens?.access_token);
				default:
					return false;
			}
		},
		[controller.tokens]
	);

	// Check if user can request token (has required credentials)
	const canRequestToken = Boolean(
		controller.credentials.environmentId &&
			controller.credentials.clientId &&
			controller.credentials.clientSecret
	);

	// Update step completion when step becomes valid
	useEffect(() => {
		const newCompletion = { ...stepCompletion };
		const isValid = isStepValid(currentStep);
		if (isValid !== newCompletion[currentStep]) {
			newCompletion[currentStep] = isValid;
			setStepCompletion(newCompletion);
		}
		// Ensure step 0 is always valid
		if (currentStep === 0 && !newCompletion[0]) {
			newCompletion[0] = true;
			setStepCompletion(newCompletion);
		}
	}, [currentStep, isStepValid, stepCompletion]);

	// Scroll to top when step changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [currentStep]);

	// Track flow activity
	useEffect(() => {
		if (controller.tokens?.access_token) {
			trackOAuthFlow('worker-token-v5', {
				step: currentStep,
				hasTokens: true,
				flowType: 'worker-token',
			});
		}
	}, [controller.tokens, currentStep]);

	const navigateToTokenManagement = useCallback(() => {
		// Store flow context for Token Management page
		if (controller.tokens) {
			const flowContext = {
				flow: 'worker-token-v5',
				tokens: controller.tokens,
				credentials: controller.credentials,
				timestamp: Date.now(),
			};
			sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

			// Store flow navigation state for back button
			storeFlowNavigationState('worker-token-v5', currentStep, 'oauth');

			// Pass access token to Token Management
			localStorage.setItem('token_to_analyze', controller.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'worker-token-v5');
		}

		// Navigate in the same tab to preserve flow navigation state
		navigate('/token-management');
	}, [navigate, controller.tokens, controller.credentials, currentStep]);

	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowConfigurationRequirements flowType="worker-token" variant="pingone" />

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> Worker Token Flow Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiKey size={20} />
										<div>
											<InfoTitle>What is the Worker Token Flow?</InfoTitle>
											<InfoText>
												The Worker Token Flow (also known as Client Credentials Flow) allows
												server-to-server authentication using client credentials. This flow is ideal
												for machine-to-machine communication where no user interaction is required.
											</InfoText>
											<InfoList>
												<li>Direct token request using client credentials</li>
												<li>No user interaction required</li>
												<li>Perfect for server-to-server authentication</li>
												<li>Supports custom scopes and claims</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('flowDiagram')}
								aria-expanded={!collapsedSections.flowDiagram}
							>
								<CollapsibleTitle>
									<FiGlobe /> Flow Diagram
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.flowDiagram}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.flowDiagram && (
								<CollapsibleContent>
									<FlowDiagram>
										<FlowStep>
											<FlowStepNumber>1</FlowStepNumber>
											<FlowStepContent>
												<strong>Client Request</strong>
												<p>Application requests access token using client credentials</p>
											</FlowStepContent>
										</FlowStep>
										<FlowStep>
											<FlowStepNumber>2</FlowStepNumber>
											<FlowStepContent>
												<strong>Token Response</strong>
												<p>PingOne returns access token and metadata</p>
											</FlowStepContent>
										</FlowStep>
										<FlowStep>
											<FlowStepNumber>3</FlowStepNumber>
											<FlowStepContent>
												<strong>API Access</strong>
												<p>Use access token to call protected APIs</p>
											</FlowStepContent>
										</FlowStep>
									</FlowDiagram>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiSettings size={18} /> PingOne Configuration
							</ResultsHeading>
							<HelperText>
								Configure your PingOne environment and application credentials for the <strong>Worker Token Flow</strong>.
							</HelperText>

							<EnvironmentIdInput
								environmentId={controller.credentials.environmentId || ''}
								onEnvironmentIdChange={(value) =>
									controller.setCredentials({ ...controller.credentials, environmentId: value })
								}
								onDiscoveryComplete={async (discoveryData) => {
									console.log('[WorkerToken V5] OIDC Discovery completed:', discoveryData);
									
									// Use comprehensive discovery service for enhanced functionality
									if (discoveryData.environmentId) {
										try {
											const comprehensiveResult = await workerTokenDiscoveryService.discover({
												environmentId: discoveryData.environmentId,
												region: 'us',
												clientId: controller.credentials.clientId,
												clientSecret: controller.credentials.clientSecret,
												timeout: 15000,
												enableCaching: true,
											});

											if (comprehensiveResult.success) {
												console.log('[WorkerToken V5] Comprehensive discovery successful:', comprehensiveResult);
												
												// Update credentials with comprehensive discovery results
												const updatedCredentials = {
													...controller.credentials,
													environmentId: comprehensiveResult.environmentId || discoveryData.environmentId,
													tokenEndpoint: comprehensiveResult.tokenEndpoint,
													introspectionEndpoint: comprehensiveResult.introspectionEndpoint,
													userInfoEndpoint: comprehensiveResult.userInfoEndpoint,
													scopes: comprehensiveResult.scopes?.join(' ') || controller.credentials.scopes,
												};

												controller.setCredentials(updatedCredentials);
												
												// Auto-save credentials if we have both environmentId and clientId
												if (updatedCredentials.environmentId && updatedCredentials.clientId) {
													await controller.saveCredentials();
													v4ToastManager.showSuccess('Credentials auto-saved after comprehensive OIDC discovery');
												}
												
												v4ToastManager.showSuccess('Enhanced OIDC discovery completed with comprehensive PingOne configuration');
											} else {
												console.warn('[WorkerToken V5] Comprehensive discovery failed, using basic discovery:', comprehensiveResult.error);
												// Fallback to basic discovery data
												controller.setCredentials({
													...controller.credentials,
													...discoveryData,
												});
											}
										} catch (error) {
											console.warn('[WorkerToken V5] Comprehensive discovery error, using basic discovery:', error);
											// Fallback to basic discovery data
											controller.setCredentials({
												...controller.credentials,
												...discoveryData,
											});
										}
									} else {
										// Use basic discovery data if no environmentId
										controller.setCredentials({
											...controller.credentials,
											...discoveryData,
										});
									}
								}}
							/>

							<CredentialsInput
								environmentId={controller.credentials.environmentId || ''}
								clientId={controller.credentials.clientId || ''}
								clientSecret={controller.credentials.clientSecret || ''}
								scopes={controller.credentials.scopes || ''}
								loginHint={controller.credentials.loginHint || ''}
								onEnvironmentIdChange={(value) => {
									controller.setCredentials({ ...controller.credentials, environmentId: value });
									// Auto-save when both environment ID and client ID are present
									if (value && controller.credentials.clientId) {
										controller.saveCredentials();
									}
								}}
								onClientIdChange={(value) => {
									controller.setCredentials({ ...controller.credentials, clientId: value });
									// Auto-save when both environment ID and client ID are present
									if (value && controller.credentials.environmentId) {
										controller.saveCredentials();
									}
								}}
								onClientSecretChange={(value) =>
									controller.setCredentials({ ...controller.credentials, clientSecret: value })
								}
								onScopesChange={(value) =>
									controller.setCredentials({ ...controller.credentials, scopes: value })
								}
								onLoginHintChange={(value) =>
									controller.setCredentials({ ...controller.credentials, loginHint: value })
								}
								onCopy={controller.handleCopy}
								copiedField={controller.copiedField}
								showRedirectUri={false}
								showLoginHint={false}
								showEnvironmentIdInput={false}
							/>

							{/* Manual Save Button for Credentials */}
							<div style={{ 
								display: 'flex', 
								justifyContent: 'center', 
								marginTop: '1rem',
								marginBottom: '1.5rem'
							}}>
								<button
									onClick={async () => {
										try {
											await controller.saveCredentials();
											v4ToastManager.showSuccess('Credentials saved successfully!');
										} catch (error) {
											v4ToastManager.showError('Failed to save credentials');
											console.error('Failed to save credentials:', error);
										}
									}}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										padding: '0.75rem 1.5rem',
										background: '#10b981',
										color: 'white',
										border: '1px solid #059669',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
										fontWeight: '500',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#059669';
										e.currentTarget.style.transform = 'translateY(-1px)';
										e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = '#10b981';
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
									}}
								>
									<FiSettings size={16} />
									Save Credentials
								</button>
							</div>

							<PingOneApplicationConfig 
								value={pingOneConfig} 
								onChange={savePingOneConfig}
								flowType="worker-token-v5"
							/>
						</ResultsSection>
					</>
				);

			case 1:
				return (
					<>
						<InfoBox>
							<InfoTitle>Worker Token Request</InfoTitle>
							<InfoText>
								Click the button below to request an access token using your configured client
								credentials. This will make an authenticated request to the PingOne token endpoint.
							</InfoText>
						</InfoBox>

						<ActionRow>
							<Button
								onClick={controller.requestToken}
								disabled={controller.isRequestingToken || !canRequestToken}
								$variant="primary"
							>
								{controller.isRequestingToken ? (
									<>
										<FiRefreshCw className="animate-spin" />
										Requesting Token...
									</>
								) : (
									<>
										<FiKey />
										Request Access Token
									</>
								)}
							</Button>
						</ActionRow>

						{!canRequestToken && (
							<InfoBox $variant="warning">
								<InfoTitle>Configuration Required</InfoTitle>
								<InfoText>
									Please configure your client credentials in Step 0 before requesting a token.
								</InfoText>
							</InfoBox>
						)}

						<SectionDivider />

						{controller.tokens && (
							<ResultsSection>
								<ResultsHeading>
									<FiCheckCircle size={18} /> Token Response
								</ResultsHeading>
								<HelperText>
									Review the raw token response. Copy the JSON or individual tokens below.
								</HelperText>
								<GeneratedContentBox>
									<GeneratedLabel>Raw Token Response</GeneratedLabel>
									<CodeBlock>{JSON.stringify(controller.tokens, null, 2)}</CodeBlock>
									<ActionRow style={{ marginBottom: '1rem' }}>
										<Button
											onClick={() => {
												navigator.clipboard.writeText(JSON.stringify(controller.tokens, null, 2));
												v4ToastManager.showSuccess('Token Response copied to clipboard!');
											}}
											$variant="primary"
											style={{
												backgroundColor: '#059669',
												borderColor: '#059669',
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
									{UnifiedTokenDisplayService.showTokens(
										controller.tokens,
										'oauth',
										'worker-token-v5',
										{
											showCopyButtons: true,
											showDecodeButtons: true,
											showIntrospection: false,
											title: '🔑 Worker Access Token'
										}
									)}

									{/* Token Management Buttons */}
									<ActionRow
										style={{ justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}
									>
										<Button
											onClick={navigateToTokenManagement}
											$variant="primary"
											style={{
												backgroundColor: '#3b82f6',
												borderColor: '#3b82f6',
												color: '#ffffff',
											}}
										>
											<FiExternalLink /> View in Token Management
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							</ResultsSection>
						)}
					</>
				);

			case 2:
				return (
					<>
						{controller.tokens ? (
							<>
								<InfoBox $variant="success">
									<InfoTitle>Token Response Received</InfoTitle>
									<InfoText>
										Successfully received an access token from PingOne. Review the token details
										below.
									</InfoText>
								</InfoBox>

								<GeneratedContentBox>
									<ParameterGrid>
										<ParameterLabel>Access Token</ParameterLabel>
										<ParameterValue style={{ wordBreak: 'break-all' }}>
											{controller.tokens.access_token}
										</ParameterValue>
										{controller.tokens.token_type && (
											<>
												<ParameterLabel>Token Type</ParameterLabel>
												<ParameterValue>{controller.tokens.token_type}</ParameterValue>
											</>
										)}
										{controller.tokens.expires_in && (
											<>
												<ParameterLabel>Expires In</ParameterLabel>
												<ParameterValue>{controller.tokens.expires_in} seconds</ParameterValue>
											</>
										)}
										{controller.tokens.scope && (
											<>
												<ParameterLabel>Scope</ParameterLabel>
												<ParameterValue>{controller.tokens.scope}</ParameterValue>
											</>
										)}
									</ParameterGrid>
								</GeneratedContentBox>

								<ActionRow>
									<Button
										onClick={() => {
											navigator.clipboard.writeText(controller.tokens?.access_token || '');
											v4ToastManager.showSuccess('Access token copied to clipboard!');
										}}
										$variant="primary"
									>
										<FiCopy /> Copy Access Token
									</Button>
								</ActionRow>

								{/* Flow Complete Section */}
								<InfoBox $variant="info" style={{ marginTop: '1.5rem' }}>
									<InfoTitle>Flow Complete!</InfoTitle>
									<InfoText>{completionMessage}</InfoText>
								</InfoBox>

								<ResultsSection>
									<ResultsHeading>
										<FiCheckCircle size={18} /> Next Steps
									</ResultsHeading>
									<InfoList>
										{nextSteps.map((step, index) => (
											<li key={index}>{step}</li>
										))}
									</InfoList>
								</ResultsSection>
							</>
						) : (
							<InfoBox $variant="warning">
								<InfoTitle>No Token Received</InfoTitle>
								<InfoText>Please complete Step 1 to request an access token first.</InfoText>
							</InfoBox>
						)}
					</>
				);

			case 3:
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
									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>Worker Token Security</InfoTitle>
											<InfoText>
												The Worker Token Flow implements several security features to protect your
												server-to-server communications.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SecurityFeaturesDemo
							flowType="worker-token"
							tokens={controller.tokens}
							credentials={controller.credentials}
							hideHeader={true}
						/>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('introspectionOverview')}
								aria-expanded={!collapsedSections.introspectionOverview}
							>
								<CollapsibleTitle>
									<FiInfo /> Token Introspection Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.introspectionOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.introspectionOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Token Introspection</InfoTitle>
											<InfoText>
												Token introspection allows you to validate and inspect access tokens to
												determine their current state and associated metadata.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<TokenIntrospect
							flowType="worker-token"
							tokens={controller.tokens}
							credentials={controller.credentials}
							onIntrospect={handleIntrospectToken}
							isIntrospecting={controller.isIntrospecting}
							introspectionResult={controller.introspectionResults}
						/>

						{/* API Call Display for Token Introspection */}
						{introspectionApiCall && (
							<EnhancedApiCallDisplay
								apiCall={introspectionApiCall}
								options={{
									showEducationalNotes: true,
									showFlowContext: true,
									urlHighlightRules:
										EnhancedApiCallDisplayService.getDefaultHighlightRules('worker-token'),
								}}
							/>
						)}
					</>
				);

			default:
				return (
					<InfoBox $variant="warning">
						<InfoTitle>Unknown Step</InfoTitle>
						<InfoText>This step is not yet implemented.</InfoText>
					</InfoBox>
				);
		}
	}, [
		currentStep,
		collapsedSections,
		controller,
		canRequestToken,
		pingOneConfig,
		savePingOneConfig,
		toggleSection,
		completionMessage,
		nextSteps,
		navigateToTokenManagement,
	]);

	const canGoToNextStep = useCallback(() => {
		// Step 0 (introduction) is always valid
		if (currentStep === 0) {
			return currentStep < STEP_METADATA.length - 1;
		}
		return stepCompletion[currentStep] && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, stepCompletion]);

	const canGoToPreviousStep = useCallback(() => {
		return currentStep > 0;
	}, [currentStep]);

	const goToNextStep = useCallback(() => {
		if (canGoToNextStep()) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [canGoToNextStep]);

	const goToPreviousStep = useCallback(() => {
		if (canGoToPreviousStep()) {
			setCurrentStep((prev) => prev - 1);
		}
	}, [canGoToPreviousStep]);

	const _goToStep = useCallback((step: number) => {
		if (step >= 0 && step < STEP_METADATA.length) {
			setCurrentStep(step);
		}
	}, []);

	const handleResetFlow = useCallback(() => {
		console.log('🔄 [WorkerTokenFlowV5] handleResetFlow called');

		// Reset controller state
		controller.resetFlow();

		// Reset local component state
		setCurrentStep(0);
		setStepCompletion({
			0: true, // Step 0 is always complete
		});

		console.log('✅ [WorkerTokenFlowV5] Flow reset completed - returned to step 0');
	}, [controller]);

	return (
		<Container>
			<ContentWrapper>
				{/* Only show header on first page (Step 0) */}
				{currentStep === 0 && (
					<>
						<FlowHeader flowId="worker-token-v5" />
						<FlowInfoCard flowInfo={getFlowInfo('worker-token')!} />
						<FlowSequenceDisplay flowType="worker-token" />

						{/* PingOne Worker Info Section - V5 Collapsible */}
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('workerInfo')}
								aria-expanded={!collapsedSections.workerInfo}
							>
								<CollapsibleTitle>
									<FiInfo /> PingOne Worker Applications & Token Usage
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.workerInfo}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.workerInfo && (
								<CollapsibleContent>
									<PingOneWorkerInfo />
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				)}

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>{flowVersion}</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
					</StepHeader>

					<StepContent>{renderStepContent}</StepContent>
				</MainCard>
				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={goToPreviousStep}
					onNext={goToNextStep}
					onReset={handleResetFlow}
					canNavigateNext={canGoToNextStep()}
					isFirstStep={currentStep === 0}
					nextButtonText={canGoToNextStep() ? 'Next' : 'Complete above action'}
					disabledMessage="Complete the action above to continue"
				/>
			</ContentWrapper>
		</Container>
	);
};

export { WorkerTokenFlowV5 };
