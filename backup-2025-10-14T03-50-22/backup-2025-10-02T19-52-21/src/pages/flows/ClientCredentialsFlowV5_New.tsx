// src/pages/flows/ClientCredentialsFlowV5_New.tsx
// OAuth 2.0 Client Credentials Flow - V5 Implementation with Service Architecture

import { useCallback, useEffect, useState } from 'react';
import {
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
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { trackOAuthFlow } from '../../utils/activityTracker';
import { getFlowInfo } from '../../utils/flowInfoConfig';

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

// Styled Components
const Container = styled.div`
	min-height: 100vh;
	background-color: var(--color-background, #f9fafb);
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background: var(--color-surface, #ffffff);
	border-radius: 1rem;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1);
	overflow: hidden;
	margin-bottom: 2rem;
`;

const StepHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 2rem;
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: #ffffff;
`;

const StepHeaderLeft = styled.div`
	flex: 1;
`;

const VersionBadge = styled.span`
	display: inline-block;
	background: rgba(255, 255, 255, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: #ffffff;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	margin-bottom: 0.5rem;
`;

const StepHeaderTitle = styled.h2`
	font-size: 1.75rem;
	font-weight: 700;
	margin: 0 0 0.5rem 0;
	color: #ffffff;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	margin: 0;
	opacity: 0.9;
	color: #ffffff;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const CollapsibleSection = styled.section`
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: var(--color-surface, #ffffff);
	box-shadow: 0 4px 6px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem;
	background: transparent;
	border: none;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: rgba(0, 0, 0, 0.02);
	}
`;

const CollapsibleTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--color-text-primary, #1e293b);
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;

	&:hover {
		color: var(--color-primary, #3b82f6);
	}
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed: boolean }>`
	transition: transform 0.2s;
	transform: ${(props) => (props.$collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
`;

const CollapsibleContent = styled.div`
	padding: 0 1.5rem 1.5rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	font-size: 0.875rem;
	line-height: 1.5;

	${(props) =>
		props.$variant === 'info' &&
		`
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		color: #0c4a6e;
	`}

	${(props) =>
		props.$variant === 'warning' &&
		`
		background: #fffbeb;
		border: 1px solid #fed7aa;
		color: #92400e;
	`}

	${(props) =>
		props.$variant === 'success' &&
		`
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	`}

	${(props) =>
		props.$variant === 'error' &&
		`
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	`}

	svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
`;

const InfoTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.875rem;
	line-height: 1.6;
	margin: 0;
`;

const TokenDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	word-break: break-all;
	position: relative;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterItem = styled.div`
	padding: 1rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.25rem;
`;

const ParameterValue = styled.div`
	font-size: 0.875rem;
	color: #1e293b;
	font-weight: 500;
	word-break: break-word;
`;

const Button = styled.button<{ $variant?: 'primary' | 'outline' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	border: 1px solid transparent;

	${(props) =>
		props.$variant === 'primary' &&
		`
		background: #3b82f6;
		color: #ffffff;
		&:hover:not(:disabled) {
			background: #2563eb;
		}
	`}

	${(props) =>
		props.$variant === 'outline' &&
		`
		background: transparent;
		color: #3b82f6;
		border-color: #3b82f6;
		&:hover:not(:disabled) {
			background: #f0f9ff;
		}
	`}

	${(props) =>
		props.$variant === 'danger' &&
		`
		background: #ef4444;
		color: #ffffff;
		&:hover:not(:disabled) {
			background: #dc2626;
		}
	`}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
	flex-wrap: wrap;
`;

const ClientCredentialsFlowV5: React.FC = () => {
	const controller = useClientCredentialsFlowController({
		flowKey: 'oauth-client-credentials-v5',
		defaultFlowVariant: 'oauth',
	});

	const { currentStep, goToNextStep, goToPreviousStep, resetFlow } = controller.stepManager;

	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
		overview: false,
		credentials: false,
		useCases: false,
		configuration: false,
		authMethods: false,
		tokenRequest: false,
		requestDetails: false,
		tokenAnalysis: false,
		tokenIntrospection: false,
		securityFeatures: false,
		bestPractices: false,
	});

	const toggleSection = useCallback((section: string) => {
		setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
	}, []);

	const canGoToNextStep = useCallback(() => {
		switch (currentStep) {
			case 0:
				return true; // Introduction step
			case 1:
				return controller.flowConfig.clientId && controller.flowConfig.clientSecret;
			case 2:
				return controller.tokens !== null;
			case 3:
				return true; // Analysis step
			case 4:
				return true; // Security features step
			default:
				return false;
		}
	}, [currentStep, controller.flowConfig, controller.tokens]);

	const handleCopy = useCallback(
		(text: string, label: string) => {
			controller.handleCopy(text, label);
		},
		[controller]
	);

	const _handleIntrospectToken = useCallback(async () => {
		await controller.introspectToken();
	}, [controller]);

	const navigateToTokenManagement = useCallback(() => {
		if (controller.tokens?.access_token) {
			localStorage.setItem('token_to_analyze', controller.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'client-credentials-v5');
			window.location.href = '/token-management';
		}
	}, [controller.tokens]);

	// Track flow start
	useEffect(() => {
		trackOAuthFlow(
			'client-credentials',
			true,
			JSON.stringify({
				flowVariant: controller.flowVariant,
				step: currentStep,
			})
		);
	}, [controller.flowVariant, currentStep]);

	const renderStepContent = useCallback(
		(stepIndex: number) => {
			switch (stepIndex) {
				case 0:
					return (
						<>
							<ExplanationSection>
								<ExplanationHeading>
									<FiServer />
									OAuth 2.0 Client Credentials Flow
								</ExplanationHeading>

								<InfoBox $variant="info">
									<FiInfo />
									<div>
										<InfoTitle>What is Client Credentials Flow?</InfoTitle>
										<InfoText>
											The Client Credentials flow is used for server-to-server authentication where
											the client application acts on its own behalf rather than on behalf of a user.
											This is ideal for background processes, API integrations, and
											service-to-service communication.
										</InfoText>
									</div>
								</InfoBox>

								<InfoBox $variant="warning">
									<FiShield />
									<div>
										<InfoTitle>Security Best Practices</InfoTitle>
										<div>
											<InfoText>
												Security best practices for OAuth 2.0 Client Credentials flow:
											</InfoText>
											<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
												<li>
													Prefer <code>private_key_jwt</code> over client secrets
												</li>
												<li>Use OAuth Discovery (/.well-known/oauth-authorization-server)</li>
												<li>Verify token signature using JWKS endpoint</li>
												<li>
													Validate <code>iss</code>, <code>aud</code>, and <code>exp</code> claims
												</li>
												<li>Use short-lived tokens with appropriate scopes</li>
												<li>Never include "openid" scope (will be rejected)</li>
											</ul>
										</div>
									</div>
								</InfoBox>
							</ExplanationSection>

							<ConfigurationSummaryCard
								configuration={controller.flowConfig}
								hasConfiguration={!!controller.flowConfig.clientId}
								onSaveConfiguration={controller.saveCredentials}
							/>
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
										<FiKey /> Configuration
									</CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.configuration}>
										<FiChevronDown />
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								{!collapsedSections.configuration && (
									<CollapsibleContent>
										<div>
											<p>Configuration will be handled through the main form above.</p>
										</div>
									</CollapsibleContent>
								)}
							</CollapsibleSection>
						</>
					);

				case 2:
					return (
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenRequest')}
								aria-expanded={!collapsedSections.tokenRequest}
							>
								<CollapsibleTitle>
									<FiZap /> Token Request
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenRequest}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenRequest && (
								<CollapsibleContent>
									<ActionRow>
										<Button
											$variant="primary"
											onClick={controller.requestToken}
											disabled={
												controller.isRequesting ||
												!controller.flowConfig.clientId ||
												!controller.flowConfig.clientSecret
											}
										>
											{controller.isRequesting ? (
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

									{controller.tokens && (
										<>
											<SectionDivider />
											<ResultsSection>
												<ResultsHeading>
													<FiCheckCircle />
													Token Retrieved Successfully
												</ResultsHeading>

												<ParameterGrid>
													<ParameterItem>
														<ParameterLabel>Access Token</ParameterLabel>
														<TokenDisplay>{controller.tokens.access_token}</TokenDisplay>
													</ParameterItem>

													<ParameterItem>
														<ParameterLabel>Token Type</ParameterLabel>
														<ParameterValue>{controller.tokens.token_type}</ParameterValue>
													</ParameterItem>

													<ParameterItem>
														<ParameterLabel>Expires In</ParameterLabel>
														<ParameterValue>
															{controller.tokens.expires_in
																? `${controller.tokens.expires_in}s`
																: 'N/A'}
														</ParameterValue>
													</ParameterItem>

													{controller.tokens.scope && (
														<ParameterItem>
															<ParameterLabel>Scope</ParameterLabel>
															<ParameterValue>{controller.tokens.scope}</ParameterValue>
														</ParameterItem>
													)}
												</ParameterGrid>

												<ActionRow>
													<Button
														$variant="outline"
														onClick={() =>
															handleCopy(controller.tokens!.access_token, 'Access Token')
														}
													>
														<FiCopy />
														Copy Token
													</Button>

													<Button $variant="primary" onClick={navigateToTokenManagement}>
														<FiExternalLink />
														View in Token Management
													</Button>
												</ActionRow>
											</ResultsSection>
										</>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					);

				case 3:
					return (
						<>
							{controller.tokens && (
								<>
									<TokenIntrospect
										tokens={controller.tokens as unknown as Record<string, unknown>}
										flowName="Client Credentials Flow"
										onResetFlow={controller.resetFlow}
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

													{controller.decodedToken ? (
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
																<ParameterItem>
																	<ParameterLabel>Algorithm</ParameterLabel>
																	<ParameterValue>
																		{controller.decodedToken.header.alg || 'N/A'}
																	</ParameterValue>
																</ParameterItem>
																<ParameterItem>
																	<ParameterLabel>Key ID</ParameterLabel>
																	<ParameterValue>
																		{controller.decodedToken.header.kid || 'N/A'}
																	</ParameterValue>
																</ParameterItem>
																<ParameterItem>
																	<ParameterLabel>Issuer</ParameterLabel>
																	<ParameterValue>
																		{controller.decodedToken.payload.iss || 'N/A'}
																	</ParameterValue>
																</ParameterItem>
																<ParameterItem>
																	<ParameterLabel>Subject</ParameterLabel>
																	<ParameterValue>
																		{controller.decodedToken.payload.sub || 'N/A'}
																	</ParameterValue>
																</ParameterItem>
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
					return <SecurityFeaturesDemo />;

				default:
					return null;
			}
		},
		[controller, collapsedSections, toggleSection, handleCopy, navigateToTokenManagement]
	);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="client-credentials-v5" />
				<FlowInfoCard flowInfo={getFlowInfo('client-credentials')!} />
				<FlowSequenceDisplay flowType="client-credentials" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V5</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
					</StepHeader>

					<StepContent>{renderStepContent(currentStep)}</StepContent>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={goToPreviousStep}
					onNext={goToNextStep}
					onReset={resetFlow}
					canNavigateNext={!!canGoToNextStep()}
					isFirstStep={currentStep === 0}
					nextButtonText={canGoToNextStep() ? 'Next' : 'Complete above action'}
					disabledMessage="Complete the action above to continue"
				/>
			</ContentWrapper>
		</Container>
	);
};

export default ClientCredentialsFlowV5;
