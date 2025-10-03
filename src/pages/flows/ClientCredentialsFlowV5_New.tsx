// src/pages/flows/ClientCredentialsFlowV5_New.tsx
// OAuth 2.0 Client Credentials Flow - V5 Implementation with Service Architecture

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiServer,
	FiShield,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import { trackOAuthFlow } from '../../utils/activityTracker';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { usePageScroll } from '../../hooks/usePageScroll';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { FlowDiagram, FlowStep, FlowStepContent, FlowStepNumber } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import JWTTokenDisplay from '../../components/JWTTokenDisplay';
import { CodeExamplesDisplay } from '../../components/CodeExamplesDisplay';
import { FlowHeader } from '../../services/flowHeaderService';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand Client Credentials Flow and configure credentials',
	},
	{
		title: 'Step 1: Configuration',
		subtitle: 'Set up client credentials and authentication method',
	},
	{
		title: 'Step 2: Token Request',
		subtitle: 'Request access token using client credentials',
	},
	{
		title: 'Step 3: Token Analysis',
		subtitle: 'Analyze the received access token',
	},
	{
		title: 'Step 4: Security Features',
		subtitle: 'Explore security best practices and token management',
	},
] as const;

type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'configuration'
	| 'authMethods'
	| 'tokenRequest'
	| 'requestDetails'
	| 'tokenAnalysis'
	| 'tokenIntrospection'
	| 'securityFeatures'
	| 'bestPractices'
	| 'completionOverview'
	| 'completionDetails'
	| 'introspectionDetails'
	| 'rawJson';

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
	background: ${({ theme }) => theme.colors.gray100};
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
						background: ${theme.colors.gray100};
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

const ClientCredentialsFlowV5: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);

	usePageScroll();

	const controller = useClientCredentialsFlowController({
		flowKey: 'oauth-client-credentials-v5',
		defaultFlowVariant: 'oauth',
	});

	const {
		credentials,
		setCredentials,
		flowConfig,
		handleFlowConfigChange,
		resetFlow: resetControllerFlow,
		tokens,
		decodedToken,
		isRequesting,
		requestToken,
		introspectToken,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		saveCredentials,
		handleCopy,
	} = controller;

	// Get UI settings for collapsible default state
	const { collapsibleDefaultState } = { collapsibleDefaultState: 'expanded' }; // Default to expanded for now
	const defaultCollapsed = collapsibleDefaultState === 'collapsed';

	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>({
		overview: defaultCollapsed,
		flowDiagram: defaultCollapsed,
		credentials: false, // Always expanded - users need to see credentials first
		configuration: defaultCollapsed,
		authMethods: defaultCollapsed,
		tokenRequest: defaultCollapsed,
		requestDetails: defaultCollapsed,
		tokenAnalysis: defaultCollapsed,
		tokenIntrospection: defaultCollapsed,
		securityFeatures: defaultCollapsed,
		bestPractices: defaultCollapsed,
		completionOverview: defaultCollapsed,
		completionDetails: defaultCollapsed,
		introspectionDetails: defaultCollapsed,
		rawJson: true, // Default to collapsed for raw JSON
	});

	const toggleSection = useCallback((sectionKey: IntroSectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[sectionKey]: !prev[sectionKey],
		}));
	}, []);

	const handleResetFlow = useCallback(() => {
		resetControllerFlow();
		setCurrentStep(0);
		setCollapsedSections({
			overview: defaultCollapsed,
			flowDiagram: defaultCollapsed,
			credentials: false, // Always expanded - users need to see credentials first
			configuration: defaultCollapsed,
			authMethods: defaultCollapsed,
			tokenRequest: defaultCollapsed,
			requestDetails: defaultCollapsed,
			tokenAnalysis: defaultCollapsed,
			tokenIntrospection: defaultCollapsed,
			securityFeatures: defaultCollapsed,
			bestPractices: defaultCollapsed,
			completionOverview: defaultCollapsed,
			completionDetails: defaultCollapsed,
			introspectionDetails: defaultCollapsed,
			rawJson: true,
		});
		v4ToastManager.showSuccess('Client Credentials Flow reset successfully!');
	}, [resetControllerFlow, defaultCollapsed]);

	const navigateToTokenManagement = useCallback(() => {
		// Set flow source for Token Management page (legacy support)
		sessionStorage.setItem('flow_source', 'client-credentials-v5');

		// Store comprehensive flow context for Token Management page
		const flowContext = {
			flow: 'client-credentials-v5',
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
			localStorage.setItem('flow_source', 'client-credentials-v5');
			console.log(
				'🔍 [ClientCredentialsFlowV5] Passing access token to Token Management via localStorage'
			);
		}

		window.open('/token-management', '_blank');
	}, [controller.tokens, controller.credentials]);

	// Step completion logic
	const stepCompletions: Record<number, boolean> = {
		0: hasCredentialsSaved || Boolean(credentials.clientId && credentials.clientSecret),
		1: Boolean(credentials.clientId && credentials.clientSecret),
		2: Boolean(tokens?.access_token),
		3: Boolean(tokens?.access_token), // Token analysis available
		4: Boolean(tokens?.access_token), // Security Features
	};

	const canNavigateNext = useMemo(() => {
		// Step 0 (introduction) is always valid
		if (currentStep === 0) {
			return currentStep < STEP_METADATA.length - 1;
		}
		return stepCompletions[currentStep] && currentStep < STEP_METADATA.length - 1;
	}, [stepCompletions, currentStep]);

	const canNavigatePrevious = useMemo(() => {
		return currentStep > 0;
	}, [currentStep]);

	// Update step completion when step becomes valid
	useEffect(() => {
		// Auto-save credentials when they change
		if (hasUnsavedCredentialChanges && credentials.clientId && credentials.clientSecret) {
			saveCredentials();
		}
	}, [hasUnsavedCredentialChanges, credentials, saveCredentials]);

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

	// Track flow completion when reaching step 4 (Security Features)
	useEffect(() => {
		if (currentStep === 4) {
			trackOAuthFlow('Client Credentials Flow V5', true, 'Flow completed successfully');
		}
	}, [currentStep]);

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
												<InfoTitle>What is the Client Credentials Flow?</InfoTitle>
												<InfoText>
													The Client Credentials flow is used for server-to-server authentication where
													the client application acts on its own behalf rather than on behalf of a user.
													This is ideal for background processes, API integrations, and
													service-to-service communication.
												</InfoText>
											</div>
										</InfoBox>

										<InfoBox $variant="info">
											<FiServer size={20} />
											<div>
												<InfoTitle>Perfect For:</InfoTitle>
												<InfoList>
													<li>Background services and daemons</li>
													<li>API-to-API communication</li>
													<li>Microservice architectures</li>
													<li>Batch processing jobs</li>
													<li>IoT device authentication</li>
													<li>Scheduled tasks and cron jobs</li>
												</InfoList>
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
											environmentId={credentials.environmentId || ''}
											clientId={credentials.clientId || ''}
											clientSecret={credentials.clientSecret || ''}
											scopes={credentials.scopes || ''}
											onEnvironmentIdChange={(value) => setCredentials({ ...credentials, environmentId: value })}
											onClientIdChange={(value) => setCredentials({ ...credentials, clientId: value })}
											onClientSecretChange={(value) => setCredentials({ ...credentials, clientSecret: value })}
											onScopesChange={(value) => setCredentials({ ...credentials, scopes: value })}
											onCopy={handleCopy}
											showRedirectUri={false}
											showLoginHint={false}
										/>
										<FlowConfigurationRequirements flowType="client-credentials" />

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
										<FiZap /> Client Credentials Flow Walkthrough
									</CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.flowDiagram}>
										<FiChevronDown />
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								{!collapsedSections.flowDiagram && (
									<CollapsibleContent>
										<FlowDiagram>
											{[
												'Client sends credentials to token endpoint',
												'Authorization server validates client credentials',
												'Server issues access token directly to client',
												'Client uses token to access protected resources',
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
							<FlowConfigurationRequirements flowType="client-credentials" />

							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => toggleSection('configuration')}
									aria-expanded={!collapsedSections.configuration}
								>
									<CollapsibleTitle>
										<FiKey /> Authentication Methods
									</CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.configuration}>
										<FiChevronDown />
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								{!collapsedSections.configuration && (
									<CollapsibleContent>
										<InfoBox $variant="info">
											<FiShield size={20} />
											<div>
												<InfoTitle>Client Authentication Methods</InfoTitle>
												<InfoText>
													The Client Credentials flow supports multiple authentication methods for
													different security requirements and deployment scenarios.
												</InfoText>
											</div>
										</InfoBox>

										<ParameterGrid>
											<InfoBox $variant="success">
												<FiKey size={20} />
												<div>
													<InfoTitle>Client Secret (Recommended for Development)</InfoTitle>
													<InfoText>
														Most common method using client_id and client_secret. Simple to implement
														but requires secure secret storage.
													</InfoText>
													<InfoList>
														<li>Uses HTTP Basic or POST authentication</li>
														<li>Easy to implement and test</li>
														<li>Requires secure secret management</li>
														<li>Suitable for server-side applications</li>
													</InfoList>
												</div>
											</InfoBox>

											<InfoBox $variant="info">
												<FiShield size={20} />
												<div>
													<InfoTitle>Private Key JWT (Production Recommended)</InfoTitle>
													<InfoText>
														Uses asymmetric cryptography with JWT assertions signed by private key.
														More secure than client secrets.
													</InfoText>
													<InfoList>
														<li>No shared secrets to manage</li>
														<li>Proof-of-possession security</li>
														<li>Supports key rotation</li>
														<li>Industry standard security</li>
													</InfoList>
												</div>
											</InfoBox>

											<InfoBox $variant="warning">
												<FiServer size={20} />
												<div>
													<InfoTitle>TLS Client Authentication</InfoTitle>
													<InfoText>
														Uses client certificates for mutual TLS authentication. Highest security
														but complex to implement.
													</InfoText>
													<InfoList>
														<li>Certificate-based authentication</li>
														<li>Strong mutual authentication</li>
														<li>Requires PKI infrastructure</li>
														<li>Complex certificate management</li>
													</InfoList>
												</div>
											</InfoBox>
										</ParameterGrid>

										<InfoBox $variant="warning">
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>Security Best Practices</InfoTitle>
												<InfoList>
													<li>Prefer Private Key JWT for production</li>
													<li>Use short-lived access tokens</li>
													<li>Implement proper token caching</li>
													<li>Monitor token usage and revoke when needed</li>
													<li>Never log or expose client secrets</li>
													<li>Use HTTPS for all token requests</li>
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
								<FiZap size={20} />
								<div>
									<InfoTitle>Token Request</InfoTitle>
									<InfoText>
										Request an access token using your configured client credentials. The token will be
										issued directly without user interaction.
									</InfoText>
								</div>
							</InfoBox>

							<ActionRow>
								<Button
									onClick={requestToken}
									disabled={isRequesting || !credentials.clientId || !credentials.clientSecret}
									$variant="primary"
								>
									{isRequesting ? (
										<>
											<FiRefreshCw className="animate-spin" />
											Requesting Token...
										</>
									) : (
										<>
											<FiZap />
											Request Access Token
										</>
									)}
								</Button>
							</ActionRow>

							{tokens && (
								<>
									<SectionDivider />
									<ResultsSection>
										<ResultsHeading>
											<FiCheckCircle />
											Token Retrieved Successfully
										</ResultsHeading>

										{/* Enhanced JWT Token Display */}
										<JWTTokenDisplay
											token={tokens.access_token}
											tokenType={tokens.token_type || 'Bearer'}
											{...(tokens.expires_in && { expiresIn: tokens.expires_in })}
											{...(tokens.scope && { scope: tokens.scope })}
											onCopy={handleCopy}
										/>

										<ActionRow>
											<Button
												onClick={() => handleCopy(tokens.access_token, 'Access Token')}
												$variant="outline"
											>
												<FiCopy />
												Copy Token
											</Button>

											<Button $variant="primary" onClick={navigateToTokenManagement}>
												<FiExternalLink />
												View in Token Management
											</Button>
										</ActionRow>
										
										{/* Code Examples for Client Credentials Flow */}
										<div style={{ marginTop: '2rem' }}>
											<CodeExamplesDisplay
												flowType="client-credentials"
												stepId="step1"
												config={{
													baseUrl: 'https://auth.pingone.com',
													clientId: credentials.clientId || '',
													clientSecret: credentials.clientSecret || '',
													redirectUri: '', // Not used in client credentials
													scopes: credentials.scopes?.split(' ') || ['api:read', 'api:write'],
													environmentId: credentials.environmentId || '',
												}}
											/>
										</div>
									</ResultsSection>
								</>
							)}
						</>
					);

				case 3:
					return (
						<>
							{tokens && (
								<>
									<TokenIntrospect
										flowName="Client Credentials Flow V5"
										flowVersion="V5"
										tokens={{
											access_token: tokens.access_token,
											refresh_token: tokens.refresh_token,
										} as { [key: string]: unknown; access_token?: string; refresh_token?: string }}
										credentials={{
											environmentId: credentials.environmentId,
											clientId: credentials.clientId,
											clientSecret: credentials.clientSecret,
										} as unknown as {
											[key: string]: unknown;
											environmentId?: string;
											clientId?: string;
											clientSecret?: string;
										}}
										userInfo={null}
										onFetchUserInfo={async () => {}}
										isFetchingUserInfo={false}
										onResetFlow={handleResetFlow}
										onNavigateToTokenManagement={navigateToTokenManagement}
										onIntrospectToken={introspectToken}
										collapsedSections={{
											completionOverview: collapsedSections.completionOverview,
											completionDetails: collapsedSections.completionDetails,
											introspectionDetails: collapsedSections.introspectionDetails,
											rawJson: collapsedSections.rawJson || true,
											userInfo: true, // Not applicable for client credentials
										}}
										onToggleSection={(section) => {
											if (section === 'completionOverview' || section === 'completionDetails') {
												toggleSection(section as IntroSectionKey);
											}
										}}
										completionMessage="Token introspection allows you to validate and inspect your access tokens."
										nextSteps={[
											'Use the introspection results to verify token validity and permissions',
											'Check token expiration and active status',
											'View granted scopes and client information',
										]}
									/>

									<CollapsibleSection>
										<CollapsibleHeaderButton
											onClick={() => toggleSection('tokenAnalysis')}
											aria-expanded={!collapsedSections.tokenAnalysis}
										>
											<CollapsibleTitle>
												<FiShield /> Token Analysis
											</CollapsibleTitle>
											<CollapsibleToggleIcon $collapsed={collapsedSections.tokenAnalysis}>
												<FiChevronDown />
											</CollapsibleToggleIcon>
										</CollapsibleHeaderButton>
										{!collapsedSections.tokenAnalysis && (
											<CollapsibleContent>
												<ResultsSection>
													<ResultsHeading>
														<FiCheckCircle />
														Token Analysis Complete
													</ResultsHeading>

													{decodedToken ? (
														<>
															<InfoBox $variant="success">
																<FiCheckCircle />
																<div>
																	<InfoTitle>JWT Token Detected</InfoTitle>
																	<InfoText>
																		This access token is a JWT and can be decoded to view its
																		claims.
																	</InfoText>
																</div>
															</InfoBox>

															<ParameterGrid>
																<ParameterLabel>Algorithm</ParameterLabel>
																<ParameterValue>
																	{decodedToken.header.alg || 'N/A'}
																</ParameterValue>
																<ParameterLabel>Key ID</ParameterLabel>
																<ParameterValue>
																	{decodedToken.header.kid || 'N/A'}
																</ParameterValue>
																<ParameterLabel>Issuer</ParameterLabel>
																<ParameterValue>
																	{decodedToken.payload.iss || 'N/A'}
																</ParameterValue>
																<ParameterLabel>Subject</ParameterLabel>
																<ParameterValue>
																	{decodedToken.payload.sub || 'N/A'}
																</ParameterValue>
																<ParameterLabel>Audience</ParameterLabel>
																<ParameterValue>
																	{Array.isArray(decodedToken.payload.aud)
																		? decodedToken.payload.aud.join(', ')
																		: decodedToken.payload.aud || 'N/A'}
																</ParameterValue>
																<ParameterLabel>Expires</ParameterLabel>
																<ParameterValue>
																	{decodedToken.payload.exp
																		? new Date(decodedToken.payload.exp * 1000).toLocaleString()
																		: 'N/A'}
																</ParameterValue>
																<ParameterLabel>Scopes</ParameterLabel>
																<ParameterValue>
																	{decodedToken.payload.scope || tokens.scope || 'N/A'}
																</ParameterValue>
															</ParameterGrid>
														</>
													) : (
														<InfoBox $variant="info">
															<FiInfo />
															<div>
																<InfoTitle>Opaque Token</InfoTitle>
																<InfoText>
																	This access token is opaque (not a JWT). Use token introspection
																	to retrieve metadata. Navigate to the Token Management page for
																	introspection capabilities.
																</InfoText>
															</div>
														</InfoBox>
													)}
												</ResultsSection>
											</CollapsibleContent>
										)}
									</CollapsibleSection>
								</>
							)}
						</>
					);

				case 4:
					return (
						<SecurityFeaturesDemo
							tokens={tokens as unknown as Record<string, unknown>}
							credentials={credentials as unknown as Record<string, unknown>}
							onTerminateSession={() => {
								// Terminate session functionality
								console.log('Terminate session clicked');
							}}
							onRevokeTokens={() => {
								// Revoke tokens functionality
								console.log('Revoke tokens clicked');
							}}
						/>
					);

				default:
					return null;
			}
		},
		[
			collapsedSections,
			credentials,
			tokens,
			decodedToken,
			handleCopy,
			navigateToTokenManagement,
			toggleSection,
			requestToken,
			isRequesting,
			handleFlowConfigChange,
			flowConfig,
			setCredentials,
			saveCredentials,
			handleResetFlow,
			introspectToken,
		]
	);

	return (
		<Container>
			<FlowHeader flowId="client-credentials-v5" />
			<FlowInfoCard flowInfo={getFlowInfo('client-credentials')!} />
			<FlowSequenceDisplay flowType="client-credentials" />

			<StepHeader>
				<StepHeaderLeft>
					<VersionBadge>V5</VersionBadge>
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

export default ClientCredentialsFlowV5;
