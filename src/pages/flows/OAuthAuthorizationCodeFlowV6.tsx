// src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx
// V6.0.0 OAuth Authorization Code Flow - Following V5 Structure with Comprehensive Discovery

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
import styled from 'styled-components';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import LoginSuccessModal from '../../components/LoginSuccessModal';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import UserInformationStep from '../../components/UserInformationStep';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import { CredentialsInput } from '../../components/CredentialsInput';
import ComprehensiveDiscoveryInput from '../../components/ComprehensiveDiscoveryInput';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import { TokenIntrospectionService, IntrospectionApiCallData } from '../../services/tokenIntrospectionService';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { decodeJWTHeader } from '../../utils/jwks';
import { usePageScroll } from '../../hooks/usePageScroll';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { comprehensiveDiscoveryService, DiscoveryResult } from '../../services/comprehensiveDiscoveryService';
import ResponseModeSelector from '../../components/ResponseModeSelector';
import { ResponseMode } from '../../services/responseModeService';

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

type StepCompletionState = Record<number, boolean>;
type IntroSectionKey =
	| 'overview'
	| 'credentials'
	| 'responseMode' // Step 0
	| 'results' // Step 0
	| 'pkceOverview'
	| 'pkceDetails' // Step 1
	| 'authRequestOverview'
	| 'authRequestDetails' // Step 2
	| 'authResponseOverview'
	| 'authResponseDetails' // Step 3
	| 'tokenExchangeOverview'
	| 'tokenExchangeDetails' // Step 4
	| 'userInfoOverview'
	| 'userInfoDetails' // Step 5
	| 'introspectionOverview'
	| 'introspectionDetails' // Step 6
	| 'completionOverview'
	| 'completionDetails' // Step 7
	| 'flowSummary'; // Step 9

// V5-style Styled Components (matching OIDCAuthorizationCodeFlowV5_New.tsx)
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
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
	background: rgba(59, 130, 246, 0.2);
	border: 1px solid #60a5fa;
	color: #bfdbfe;
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
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #1e40af;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
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
	color: #3b82f6;
	font-size: 1.25rem;
	transition: transform 0.2s ease;

	${({ $collapsed }) => $collapsed && `transform: rotate(-90deg);`}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	border-top: 1px solid #e2e8f0;
`;

const InfoBox = styled.div<{ $variant?: 'success' | 'info' | 'warning' | 'danger' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.25rem;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;

	${({ $variant = 'info' }) => {
		switch ($variant) {
			case 'success':
				return `
					background-color: #f0fdf4;
					border: 1px solid #bbf7d0;
					color: #166534;
				`;
			case 'info':
				return `
					background-color: #eff6ff;
					border: 1px solid #bfdbfe;
					color: #1e40af;
				`;
			case 'warning':
				return `
					background-color: #fffbeb;
					border: 1px solid #fde68a;
					color: #92400e;
				`;
			case 'danger':
				return `
					background-color: #fef2f2;
					border: 1px solid #fecaca;
					color: #991b1b;
				`;
		}
	}}
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	line-height: 1.5;
	margin: 0;
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
	background-color: ${({ $variant }) => {
		if ($variant === 'success') return '#f0fdf4';
		if ($variant === 'warning') return '#fffbeb';
		return '#fef2f2';
	}};

	h4 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: ${({ $variant }) => {
			if ($variant === 'success') return '#166534';
			if ($variant === 'warning') return '#92400e';
			return '#991b1b';
		}};
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
		line-height: 1.6;
	}
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
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #1e40af;
	word-break: break-all;
	background-color: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.375rem;
	padding: 0.5rem;
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
	background-color: #2563eb;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
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

	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>({
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
	});

	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(null);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [responseMode, setResponseMode] = useState<ResponseMode>('query');

	// Toggle section visibility
	const toggleSection = useCallback((key: IntroSectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	}, []);

	// Handle discovery completion
	const handleDiscoveryComplete = useCallback((result: DiscoveryResult) => {
		if (result.success && result.document) {
			controller.setCredentials({
				...controller.credentials,
				issuerUrl: result.issuerUrl || '',
			});
			v4ToastManager.showSuccess(`Discovered ${result.provider} endpoints`);
		}
	}, [controller]);

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

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> Authorization Code Overview
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
											<InfoTitle>When to Use Authorization Code</InfoTitle>
											<InfoText>
												Authorization Code Flow is perfect when you can securely store a client
												secret on a backend and need OAuth 2.0 access tokens.
											</InfoText>
										</div>
									</InfoBox>
									<FlowSuitability>
										<SuitabilityCard $variant="success">
											<h4>Great Fit</h4>
											<ul>
												<li>Web apps with backend session storage</li>
												<li>SPAs or native apps using PKCE</li>
												<li>Hybrid flows that need refresh tokens</li>
											</ul>
										</SuitabilityCard>
										<SuitabilityCard $variant="warning">
											<h4>Consider Alternatives</h4>
											<ul>
												<li>Machine-to-machine workloads (Client Credentials)</li>
												<li>IoT or low-input devices (Device Authorization)</li>
											</ul>
										</SuitabilityCard>
										<SuitabilityCard $variant="danger">
											<h4>Avoid When</h4>
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
												<ParameterValue>
													Authorization (API access) only
												</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Spec Layer</ParameterLabel>
												<ParameterValue>
													OAuth 2.0 / OAuth 2.1
												</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Scope Requirement</ParameterLabel>
												<ParameterValue style={{ color: '#3b82f6', fontWeight: 'bold' }}>
													No 'openid' required
												</ParameterValue>
											</div>
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Use Case</ParameterLabel>
												<ParameterValue>
													API access without user identity verification
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
									{/* Comprehensive Discovery Input */}
									<ComprehensiveDiscoveryInput
										onDiscoveryComplete={handleDiscoveryComplete}
										initialInput={credentials.issuerUrl || credentials.environmentId}
										placeholder="Enter Environment ID, issuer URL, or provider..."
										showProviderInfo={true}
									/>

									{/* Credentials Input */}
									<CredentialsInput
										environmentId={credentials.environmentId || ''}
										clientId={credentials.clientId || ''}
										clientSecret={credentials.clientSecret || ''}
										scopes={credentials.scope || 'openid profile email'}
										postLogoutRedirectUri={credentials.postLogoutRedirectUri || 'https://localhost:3000/logout-callback'}
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
										onSave={controller.saveCredentials}
										hasUnsavedChanges={controller.hasUnsavedCredentialChanges}
										isSaving={controller.isSavingCredentials}
										requireClientSecret={true}
									/>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{/* Enhanced Flow Walkthrough */}
						<EnhancedFlowWalkthrough flowType="authorization-code" variant="oauth" />
					</>
				);

			case 1:
				return (
					<>
						<InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<InfoTitle>PKCE Protection</InfoTitle>
								<InfoText>
									PKCE (Proof Key for Code Exchange) protects against authorization code interception attacks.
								</InfoText>
							</div>
						</InfoBox>
						{/* TODO: Add PKCE generation UI */}
					</>
				);

			// TODO: Add remaining steps
			default:
				return (
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>Step {currentStep} - In Development</InfoTitle>
							<InfoText>This step is being developed using V6 service architecture.</InfoText>
						</div>
					</InfoBox>
				);
		}
	}, [currentStep, controller, collapsedSections, toggleSection, handleDiscoveryComplete]);

	return (
		<Container>
			<FlowHeader
				title="OAuth 2.0 Authorization Code Flow"
				subtitle="V6 with Comprehensive Discovery Service"
				icon={<FiShield />}
			/>
			<ContentWrapper>
				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V6.0 - Service Architecture</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{currentStep}</StepNumber>
							<StepTotal>of {STEP_METADATA.length - 1}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>
			</ContentWrapper>

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
		</Container>
	);
};

export default OAuthAuthorizationCodeFlowV6;
