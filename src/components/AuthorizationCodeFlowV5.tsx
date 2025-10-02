// src/components/AuthorizationCodeFlowV5.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useFlowBehaviorSettings } from '../contexts/UISettingsContext';
import { useAuthorizationCodeFlowController } from '../hooks/useAuthorizationCodeFlowController';
import { trackOAuthFlow } from '../utils/activityTracker';
import { getFlowInfo } from '../utils/flowInfoConfig';
import { FlowHeader } from '../services/flowHeaderService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import ConfigurationSummaryCard from './ConfigurationSummaryCard';
import { CredentialsInput } from './CredentialsInput';
import FlowInfoCard from './FlowInfoCard';
import { FlowDiagram, FlowStep, FlowStepContent, FlowStepNumber } from './InfoBlocks';
import LoginSuccessModal from './LoginSuccessModal';
import PingOneApplicationConfig from './PingOneApplicationConfig';
import { ResultsHeading, ResultsSection, SectionDivider } from './ResultsPanel';
import SecurityFeaturesDemo from './SecurityFeaturesDemo';
import { StepNavigationButtons } from './StepNavigationButtons';
import TokenIntrospect from './TokenIntrospect';

const STEP_METADATA = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the Authorization Code Flow' },
	{ title: 'Step 1: PKCE Parameters', subtitle: 'Generate secure verifier and challenge' },
	{
		title: 'Step 2: PAR Request (Optional)',
		subtitle: 'Push authorization request to PingOne PAR endpoint',
	},
	{
		title: 'Step 3: Authorization Request',
		subtitle: 'Build and launch the PingOne authorization URL',
	},
	{ title: 'Step 4: Authorization Response', subtitle: 'Process the returned authorization code' },
	{ title: 'Step 5: Token Exchange', subtitle: 'Exchange authorization code for access tokens' },
	{ title: 'Step 6: Token Analysis & User Info', subtitle: 'Introspect tokens and fetch user information' },
	{ title: 'Step 7: Security Features', subtitle: 'Explore advanced security implementations' },
] as const;

type StepCompletionState = Record<number, boolean>;
type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'pkce'
	| 'pkceDetails'
	| 'par'
	| 'authRequest'
	| 'authResponse'
	| 'tokenExchange'
	| 'userInfo'
	| 'completionOverview'
	| 'completionDetails'
	| 'introspectionDetails'
	| 'rawJson';

interface AuthorizationCodeFlowV5Props {
	flowType: 'oauth' | 'oidc';
	flowName: string;
	flowVersion: string;
	completionMessage: string;
	nextSteps: string[];
}

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0;
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
	color: #dbeafe;
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
	background-color: #ffffff;
	border-radius: 0 0 1rem 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	border-top: none;
`;



const CollapsibleSection = styled.section`
	margin-bottom: 1.5rem;
	border: 1px solid ${({ theme }) => theme.colors.gray200};
	border-radius: 0.75rem;
	overflow: hidden;
	background: ${({ theme }) => theme.colors.white};
`;

const CollapsibleHeaderButton = styled.button`
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: none;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: all 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.div<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	transition: transform 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	color: ${({ theme }) => theme.colors.gray600};
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.5rem;
	border-radius: 0.75rem;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#d1fae5';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			default:
				return '#3b82f6';
		}
	}};
	margin-bottom: 1.5rem;
`;

const InfoTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.gray900};
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.p`
	color: ${({ theme }) => theme.colors.gray700};
	margin: 0;
	line-height: 1.6;
`;

const InfoList = styled.ul`
	margin: 1rem 0 0 0;
	padding-left: 1.5rem;
	color: ${({ theme }) => theme.colors.gray700};
	
	li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}
`;

const GeneratedContentBox = styled.div`
	background: ${({ theme }) => theme.colors.white};
	border: 1px solid ${({ theme }) => theme.colors.gray200};
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const GeneratedLabel = styled.div`
	font-size: 1rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.gray900};
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 2fr;
	gap: 0.75rem 1rem;
	align-items: start;
`;

const ParameterLabel = styled.div`
	font-weight: 500;
	color: ${({ theme }) => theme.colors.gray700};
	font-size: 0.875rem;
`;

const ParameterValue = styled.div`
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	font-size: 0.875rem;
	color: ${({ theme }) => theme.colors.gray900};
	word-break: break-all;
	background: ${({ theme }) => theme.colors.gray50};
	padding: 0.5rem;
	border-radius: 0.375rem;
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: center;
	margin: 1.5rem 0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'outline' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border: none;

	${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: linear-gradient(135deg, #3b82f6, #2563eb);
					color: white;
					&:hover {
						background: linear-gradient(135deg, #2563eb, #1d4ed8);
						transform: translateY(-1px);
					}
				`;
			case 'danger':
				return `
					background: linear-gradient(135deg, #ef4444, #dc2626);
					color: white;
					&:hover {
						background: linear-gradient(135deg, #dc2626, #b91c1c);
						transform: translateY(-1px);
					}
				`;
			case 'outline':
				return `
					background: transparent;
					color: ${theme.colors.gray700};
					border: 1px solid ${theme.colors.gray300};
					&:hover {
						background: ${theme.colors.gray50};
						border-color: ${theme.colors.gray400};
					}
				`;
			default:
				return `
					background: ${theme.colors.gray100};
					color: ${theme.colors.gray700};
					&:hover {
						background: ${theme.colors.gray200};
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}
`;

export const AuthorizationCodeFlowV5: React.FC<AuthorizationCodeFlowV5Props> = ({
	flowType,
	flowName,
	flowVersion,
	completionMessage,
	nextSteps,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
	const [localAuthCode, setLocalAuthCode] = useState<string | null>(null);
	const [parRequestUri, setParRequestUri] = useState<string | null>(null);
	const [stepCompletion, setStepCompletion] = useState<Record<number, boolean>>({
		0: true, // Step 0 is always complete (introduction)
	});

	const controller = useAuthorizationCodeFlowController({
		flowKey: `${flowType}-authorization-code-v5`,
		enableDebugger: true,
	});

	const {
		credentials,
		setCredentials,
		flowConfig,
		handleFlowConfigChange,
		resetFlow: resetControllerFlow,
		tokens,
		userInfo: _userInfo,
		isFetchingUserInfo: _isFetchingUserInfo,
		fetchUserInfo: _fetchUserInfo,
		isSavingCredentials: _isSavingCredentials,
		hasCredentialsSaved: _hasCredentialsSaved,
		hasUnsavedCredentialChanges: _hasUnsavedCredentialChanges,
		saveCredentials,
		stepManager: _stepManager,
		saveStepResult: _saveStepResult,
		hasStepResult: _hasStepResult,
		clearStepResults: _clearStepResults,
		pkceCodes,
		authUrl,
		authCode,
		generateAuthorizationUrl,
	} = controller;

	// Wrapper functions for consistency with component naming
	const handleGenerateAuthUrl = generateAuthorizationUrl;
	const handleIntrospectToken = () => {
		// Introspection functionality to be implemented
		console.log('Introspect token clicked');
	};

	// Get UI settings for collapsible default state
	const { collapsibleDefaultState } = useFlowBehaviorSettings();
	const defaultCollapsed = collapsibleDefaultState === 'collapsed';

	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>({
		overview: defaultCollapsed,
		flowDiagram: defaultCollapsed,
		credentials: false, // Always expanded - users need to see credentials first
		pkce: defaultCollapsed,
		pkceDetails: defaultCollapsed,
		par: defaultCollapsed,
		authRequest: defaultCollapsed,
		authResponse: defaultCollapsed,
		tokenExchange: defaultCollapsed,
		userInfo: defaultCollapsed,
		completionOverview: defaultCollapsed,
		completionDetails: defaultCollapsed,
		introspectionDetails: defaultCollapsed,
		rawJson: true, // Default to collapsed for raw JSON
	});

	const toggleSection = useCallback((section: IntroSectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const handleResetFlow = useCallback(() => {
		resetControllerFlow();
		setCurrentStep(0);
		setLocalAuthCode(null);
		setParRequestUri(null);
		// Reset collapsible sections to default state from UI settings
		setCollapsedSections({
			overview: defaultCollapsed,
			flowDiagram: defaultCollapsed,
			credentials: false, // Always expanded - users need to see credentials first
			pkce: defaultCollapsed,
			par: defaultCollapsed,
			authRequest: defaultCollapsed,
			authResponse: defaultCollapsed,
			tokenExchange: defaultCollapsed,
			userInfo: defaultCollapsed,
			completionOverview: defaultCollapsed,
			completionDetails: defaultCollapsed,
			introspectionDetails: defaultCollapsed,
		});
		v4ToastManager.showSuccess(`${flowName} reset successfully!`);
	}, [resetControllerFlow, flowName, defaultCollapsed]);

	const navigateToTokenManagement = useCallback(() => {
		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'authorization-code-v5');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'authorization-code-v5',
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
			localStorage.setItem('flow_source', 'authorization-code-v5');
			console.log(
				'🔍 [AuthorizationCodeFlowV5] Passing access token to Token Management via localStorage'
			);
		}

		window.open('/token-management', '_blank');
	}, [controller.tokens, controller.credentials]);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
	}, []);

	// Step completion logic
	const stepCompletions = useMemo<StepCompletionState>(
		() => ({
			0: controller.hasStepResult('setup-credentials') || controller.hasCredentialsSaved,
			1: controller.hasStepResult('generate-pkce') || Boolean(controller.pkceCodes.codeVerifier),
			2: Boolean(parRequestUri), // PAR step is completed when we have a request URI
			3: controller.hasStepResult('build-auth-url') || Boolean(controller.authUrl),
			4: controller.hasStepResult('handle-callback') || Boolean(controller.authCode),
			5: controller.hasStepResult('exchange-tokens') || Boolean(controller.tokens),
			6: Boolean(controller.tokens?.access_token), // Token introspection available
			7: controller.hasStepResult('validate-tokens') || Boolean(controller.userInfo),
			8:
				controller.hasStepResult('refresh-token-exchange') ||
				Boolean(controller.tokens && controller.userInfo),
			9: Boolean(controller.tokens?.access_token), // Security Features
		}),
		[
			controller.authCode,
			controller.authUrl,
			controller.hasCredentialsSaved,
			controller.hasStepResult,
			controller.pkceCodes.codeVerifier,
			controller.tokens,
			controller.userInfo,
			parRequestUri,
		]
	);

	// Check if current step is valid
	const isStepValid = useCallback(
		(step: number): boolean => {
			switch (step) {
				case 0: // Introduction & Setup
					return Boolean(
						credentials.environmentId && credentials.clientId && credentials.clientSecret
					);
				case 1: // PKCE Parameters
					return Boolean(pkceCodes.codeVerifier && pkceCodes.codeChallenge);
				case 2: // PAR Request (Optional)
					return Boolean(parRequestUri || authUrl); // Either PAR URI or regular auth URL
				case 3: // Authorization Request
					return Boolean(authUrl);
				case 4: // Authorization Response
					return Boolean(authCode);
				case 5: // Token Exchange
					return Boolean(tokens?.access_token);
				case 6: // Flow Complete (includes introspection)
					return Boolean(tokens?.access_token);
				case 7: // Security Features
					return true; // Always valid as it's informational
				default:
					return false;
			}
		},
		[credentials, pkceCodes, parRequestUri, authUrl, authCode, tokens]
	);

	const canNavigateNext = useMemo(() => {
		// Step 0 (introduction) is always valid
		if (currentStep === 0) {
			return currentStep < STEP_METADATA.length - 1;
		}
		return stepCompletion[currentStep] && currentStep < STEP_METADATA.length - 1;
	}, [stepCompletion, currentStep]);

	const canNavigatePrevious = useMemo(() => {
		return currentStep > 0;
	}, [currentStep]);

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

	const handleNext = useCallback(() => {
		if (canNavigateNext) {
			const next = currentStep + 1;
			setCurrentStep(next);
		}
	}, [canNavigateNext, currentStep]);

	const handlePrevious = useCallback(() => {
		if (canNavigatePrevious) {
			const previous = currentStep - 1;
			setCurrentStep(previous);
		}
	}, [canNavigatePrevious, currentStep]);

	// Track flow completion when reaching step 8 (Flow Complete)
	useEffect(() => {
		if (currentStep === 8) {
			trackOAuthFlow(flowName, true, 'Flow completed successfully');
		}
	}, [currentStep, flowName]);

	// Auto-advance to next step when current step is completed
	const { autoAdvanceSteps } = useFlowBehaviorSettings();
	useEffect(() => {
		if (!autoAdvanceSteps) return;

		// Don't auto-advance on the last step
		if (currentStep >= STEP_METADATA.length - 1) return;

		// Don't auto-advance on step 3 (Authorization Request) - user needs to click the button
		if (currentStep === 3) return;

		// Don't auto-advance on step 4 (Authorization Response) - waiting for callback
		if (currentStep === 4) return;

		// Check if current step is completed
		if (stepCompletions[currentStep]) {
			const timer = setTimeout(() => {
				console.log(`[Auto-Advance] Moving from step ${currentStep} to ${currentStep + 1}`);
				setCurrentStep(currentStep + 1);
			}, 2000); // 2 second delay

			return () => clearTimeout(timer);
		}
	}, [autoAdvanceSteps, currentStep, stepCompletions]);

	const renderStepContent = useCallback(
		(stepIndex: number) => {
			switch (stepIndex) {
				case 0:
					return (
						<>
							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => toggleSection('overview')}
									aria-expanded={!collapsedSections.overview}
								>
									<CollapsibleTitle>
										<FiInfo /> Flow Overview
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
												<InfoTitle>What is the Authorization Code Flow?</InfoTitle>
												<InfoText>
													The Authorization Code Flow is the most secure OAuth 2.0 flow for web
													applications. It uses a server-to-server exchange of an authorization code
													for tokens, keeping client secrets secure on the server side.
												</InfoText>
											</div>
										</InfoBox>
									</CollapsibleContent>
								)}
							</CollapsibleSection>

							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => toggleSection('credentials')}
									aria-expanded={!collapsedSections.credentials}
								>
									<CollapsibleTitle>
										<FiKey /> Configure Credentials
									</CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
										<FiChevronDown />
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								{!collapsedSections.credentials && (
									<CollapsibleContent>
										<CredentialsInput
											credentials={credentials}
											onCredentialsChange={setCredentials}
											showAdvancedOptions={true}
											showLoginHint={flowType === 'oidc'}
										/>
										<PingOneApplicationConfig
											value={flowConfig}
											onChange={handleFlowConfigChange}
										/>

										<SectionDivider />
										<ConfigurationSummaryCard
											configuration={credentials}
											onSaveConfiguration={saveCredentials}
											onLoadConfiguration={(config) => {
												if (config) {
													setCredentials(config);
												}
											}}
											primaryColor="#3b82f6"
										/>
									</CollapsibleContent>
								)}
							</CollapsibleSection>

							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => toggleSection('flowDiagram')}
									aria-expanded={!collapsedSections.flowDiagram}
								>
									<CollapsibleTitle>
										<FiGlobe /> Authorization Flow Walkthrough
									</CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.flowDiagram}>
										<FiChevronDown />
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								{!collapsedSections.flowDiagram && (
									<CollapsibleContent>
										<FlowDiagram>
											{[
												'User clicks login to start the flow',
												'App redirects to PingOne with an authorization request',
												'User authenticates and approves scopes',
												'PingOne returns an authorization code to the redirect URI',
												'Backend exchanges the code for tokens securely',
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
						</>
					);

				case 1:
					return (
						<>
							<InfoBox $variant="info">
								<FiKey size={20} />
								<div>
									<InfoTitle>PKCE (Proof Key for Code Exchange)</InfoTitle>
									<InfoText>
										PKCE adds an extra layer of security by using a dynamically generated code
										verifier and challenge. This prevents authorization code interception attacks.
									</InfoText>
								</div>
							</InfoBox>

							<ActionRow>
								<Button
									onClick={handleGenerateAuthUrl}
									disabled={!credentials.environmentId || !credentials.clientId}
									$variant="primary"
								>
									<FiKey /> Generate PKCE Parameters & Auth URL
								</Button>
							</ActionRow>

							{pkceCodes.codeVerifier && (
								<GeneratedContentBox>
									<GeneratedLabel>PKCE Parameters</GeneratedLabel>
									<ParameterGrid>
										<ParameterLabel>Code Verifier</ParameterLabel>
										<ParameterValue>{pkceCodes.codeVerifier}</ParameterValue>
										<ParameterLabel>Code Challenge</ParameterLabel>
										<ParameterValue>{pkceCodes.codeChallenge}</ParameterValue>
										<ParameterLabel>Code Challenge Method</ParameterLabel>
										<ParameterValue>S256</ParameterValue>
									</ParameterGrid>
									<ActionRow>
										<Button
											onClick={() => handleCopy(pkceCodes.codeVerifier, 'Code Verifier')}
											$variant="outline"
										>
											<FiCopy /> Copy Code Verifier
										</Button>
										<Button
											onClick={() => handleCopy(pkceCodes.codeChallenge, 'Code Challenge')}
											$variant="outline"
										>
											<FiCopy /> Copy Code Challenge
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							)}

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
														secret in your app. Think of it as a temporary password that proves
														you're the same client that started the OAuth flow.
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
													<li>Always use PKCE for public clients (mobile apps, SPAs)</li>
													<li>Generate cryptographically secure random code verifiers</li>
													<li>Use S256 (SHA256) method for code challenge</li>
													<li>Store code verifier securely during the flow</li>
													<li>Never log or expose the code verifier</li>
												</InfoList>
											</div>
										</InfoBox>
									</CollapsibleContent>
								)}
							</CollapsibleSection>
						</>
					);

				case 2:
					return (
						<>
							<InfoBox $variant="info">
								<FiShield size={20} />
								<div>
									<InfoTitle>PAR (Pushed Authorization Request)</InfoTitle>
									<InfoText>
										PAR allows you to push the authorization request to the authorization server
										before redirecting the user, improving security and reducing URL length.
									</InfoText>
								</div>
							</InfoBox>

							<ActionRow>
								<Button
									onClick={async () => {
										try {
											const response = await fetch('/api/par', {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({
													environmentId: credentials.environmentId,
													clientId: credentials.clientId,
													redirectUri: credentials.redirectUri,
													scopes: credentials.scopes,
												}),
											});
											const data = await response.json();
											if (data.requestUri) {
												setParRequestUri(data.requestUri);
												v4ToastManager.showSuccess('PAR request successful!');
											}
										} catch (_error) {
											v4ToastManager.showError('PAR request failed');
										}
									}}
									disabled={!credentials.environmentId || !credentials.clientId}
									$variant="primary"
								>
									<FiShield /> Push Authorization Request
								</Button>
							</ActionRow>

							{parRequestUri && (
								<GeneratedContentBox>
									<GeneratedLabel>PAR Request URI</GeneratedLabel>
									<ParameterValue>{parRequestUri}</ParameterValue>
									<ActionRow>
										<Button
											onClick={() => handleCopy(parRequestUri, 'Request URI')}
											$variant="outline"
										>
											<FiCopy /> Copy Request URI
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							)}
						</>
					);

				case 3:
					return (
						<>
							<InfoBox $variant="info">
								<FiGlobe size={20} />
								<div>
									<InfoTitle>Authorization Request</InfoTitle>
									<InfoText>
										This is the authorization URL that will redirect the user to PingOne for
										authentication. The URL includes all necessary parameters for the authorization
										code flow.
									</InfoText>
								</div>
							</InfoBox>

							<ActionRow>
								<Button
									onClick={() => {
										if (authUrl) {
											window.open(authUrl, '_blank');
										}
									}}
									disabled={!authUrl}
									$variant="primary"
								>
									<FiGlobe /> Launch Authorization URL
								</Button>
							</ActionRow>

							{authUrl && (
								<GeneratedContentBox>
									<GeneratedLabel>Authorization URL</GeneratedLabel>
									<ParameterValue style={{ wordBreak: 'break-all' }}>{authUrl}</ParameterValue>
									<ActionRow>
										<Button
											onClick={() => handleCopy(authUrl, 'Authorization URL')}
											$variant="outline"
										>
											<FiCopy /> Copy Authorization URL
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							)}
						</>
					);

				case 4:
					return (
						<>
							<InfoBox $variant="info">
								<FiArrowRight size={20} />
								<div>
									<InfoTitle>Authorization Response</InfoTitle>
									<InfoText>
										After the user authenticates, PingOne will redirect back to your application
										with an authorization code. This code is then exchanged for tokens.
									</InfoText>
								</div>
							</InfoBox>

							{localAuthCode && (
								<GeneratedContentBox>
									<GeneratedLabel>Authorization Code</GeneratedLabel>
									<ParameterValue>{localAuthCode}</ParameterValue>
									<ActionRow>
										<Button
											onClick={() => handleCopy(localAuthCode, 'Authorization Code')}
											$variant="outline"
										>
											<FiCopy /> Copy Authorization Code
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							)}

							<LoginSuccessModal
								isOpen={showLoginSuccessModal}
								onClose={() => setShowLoginSuccessModal(false)}
								authCode={localAuthCode}
								onProceed={() => {
									setShowLoginSuccessModal(false);
									setCurrentStep(5);
								}}
							/>
						</>
					);

				case 5:
					return (
						<>
							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Token Exchange Successful!</InfoTitle>
									<InfoText>
										Your authorization code has been successfully exchanged for access tokens. You can now use these tokens to make authenticated API requests.
									</InfoText>
								</div>
							</InfoBox>

							{tokens && (
								<GeneratedContentBox>
									<GeneratedLabel>Tokens Received</GeneratedLabel>
									<ParameterGrid>
										<ParameterLabel>Access Token</ParameterLabel>
										<ParameterValue style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Received</ParameterValue>
										{tokens.refresh_token && (
											<>
												<ParameterLabel>Refresh Token</ParameterLabel>
												<ParameterValue style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Received</ParameterValue>
											</>
										)}
										{tokens.id_token && (
											<>
												<ParameterLabel>ID Token</ParameterLabel>
												<ParameterValue style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Received</ParameterValue>
											</>
										)}
										<ParameterLabel>Token Type</ParameterLabel>
										<ParameterValue>{tokens.token_type || 'Bearer'}</ParameterValue>
										<ParameterLabel>Expires In</ParameterLabel>
										<ParameterValue>
											{tokens.expires_in ? `${tokens.expires_in} seconds` : 'N/A'}
										</ParameterValue>
										<ParameterLabel>Scope</ParameterLabel>
										<ParameterValue>{tokens.scope || 'N/A'}</ParameterValue>
									</ParameterGrid>
								</GeneratedContentBox>
							)}

							<InfoBox $variant="info">
								<FiArrowRight size={20} />
								<div>
									<InfoTitle>What's Next?</InfoTitle>
									<InfoText>
										Proceed to the next step to introspect your tokens, fetch user information, and explore additional token management features.
									</InfoText>
								</div>
							</InfoBox>
						</>
					);

				case 6:
					return (
						<TokenIntrospect
							flowName={flowName}
							flowVersion={flowVersion}
							{...(controller.tokens && {
								tokens: {
									access_token: controller.tokens.access_token,
									refresh_token: controller.tokens.refresh_token,
								} as { [key: string]: unknown; access_token?: string; refresh_token?: string },
							})}
							credentials={
								controller.credentials as unknown as {
									[key: string]: unknown;
									environmentId?: string;
									clientId?: string;
									clientSecret?: string;
								}
							}
							userInfo={controller.userInfo}
							onFetchUserInfo={controller.fetchUserInfo}
							isFetchingUserInfo={controller.isFetchingUserInfo}
							onResetFlow={handleResetFlow}
							onNavigateToTokenManagement={navigateToTokenManagement}
							onIntrospectToken={handleIntrospectToken}
							collapsedSections={{
								completionOverview: collapsedSections.completionOverview,
								completionDetails: collapsedSections.completionDetails,
								introspectionDetails: collapsedSections.introspectionDetails,
								rawJson: collapsedSections.rawJson || true, // Default to collapsed
								userInfo: collapsedSections.userInfo || false, // Default to expanded
							}}
							onToggleSection={(section) => {
								if (section === 'completionOverview' || section === 'completionDetails') {
									toggleSection(section as IntroSectionKey);
								}
							}}
							completionMessage={completionMessage}
							nextSteps={nextSteps}
						/>
					);

				case 7:
					return (
						<SecurityFeaturesDemo
							flowName={flowName}
							flowVersion={flowVersion}
							completionMessage={completionMessage}
							nextSteps={nextSteps}
						/>
					);

				default:
					return null;
			}
		},
		[
			collapsedSections,
			controller.credentials,
			controller.tokens,
			controller.userInfo,
			handleCopy,
			handleGenerateAuthUrl,
			handleIntrospectToken,
			handleResetFlow,
			handleFlowConfigChange,
			flowConfig,
			credentials,
			setCredentials,
			tokens,
			parRequestUri,
			showLoginSuccessModal,
			localAuthCode,
			toggleSection,
			flowName,
			flowVersion,
			completionMessage,
			nextSteps,
			flowType,
			authUrl,
			controller.fetchUserInfo,
			controller.isFetchingUserInfo,
			navigateToTokenManagement,
			pkceCodes.codeChallenge,
			pkceCodes.codeVerifier,
			saveCredentials,
		]
	);

	return (
		<Container>
			<FlowHeader flowType={flowType} />

			<FlowInfoCard
				flowInfo={
					getFlowInfo(flowType === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code')!
				}
			/>

			<StepHeader>
				<StepHeaderLeft>
					<VersionBadge>{flowVersion}</VersionBadge>
					<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
					<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
				</StepHeaderLeft>
			</StepHeader>

			<StepContent>{renderStepContent(currentStep)}</StepContent>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrevious}
				onReset={handleResetFlow}
				onNext={handleNext}
				canNavigateNext={canNavigateNext}
				isFirstStep={currentStep === 0}
				nextButtonText={canNavigateNext ? 'Next' : 'Complete above action'}
				disabledMessage="Complete the action above to continue"
			/>
		</Container>
	);
};
