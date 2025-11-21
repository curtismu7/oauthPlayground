// src/pages/flows/RedirectlessFlowV5.tsx
// PingOne Redirectless Flow (response_mode=pi.flow) - Full V5 Implementation
import { useCallback, useId, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiLock,
	FiMonitor,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiSmartphone,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { themeService } from '../../services/themeService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand Redirectless Flow and configure credentials',
	},
	{ title: 'Step 1: PKCE Parameters', subtitle: 'Generate secure PKCE codes for the flow' },
	{
		title: 'Step 2: Authorization Request',
		subtitle: 'Build authorization URL with response_mode=pi.flow',
	},
	{ title: 'Step 3: Flow Response', subtitle: 'Receive and process the flow object (no redirect)' },
	{ title: 'Step 4: Token Response', subtitle: 'Receive tokens in JSON format' },
	{ title: 'Step 5: Complete', subtitle: 'Review the redirectless flow implementation' },
] as const;

type StepCompletionState = Record<number, boolean>;
type IntroSectionKey =
	| 'overview'
	| 'credentials'
	| 'useCases' // Step 0
	| 'pkceOverview'
	| 'pkceDetails' // Step 1
	| 'authRequestOverview'
	| 'authRequestDetails' // Step 2
	| 'flowResponseOverview'
	| 'flowResponseDetails' // Step 3
	| 'tokenResponseOverview'
	| 'tokenResponseDetails' // Step 4
	| 'completionOverview'
	| 'completionDetails'; // Step 5

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
	background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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
	background: rgba(139, 92, 246, 0.2);
	border: 1px solid #a78bfa;
	color: #e9d5ff;
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

const StepHeaderRight = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.25rem;
`;

const StepNumber = styled.div`
	font-size: 3rem;
	font-weight: 700;
	line-height: 1;
	opacity: 0.3;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	opacity: 0.7;
	text-transform: uppercase;
	letter-spacing: 0.05em;
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
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg) scale(1.1)' : 'rotate(180deg) scale(1.1)')};
	}
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	background-color: #ffffff;
	border: 1px solid #e2e8f0;
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' | 'danger' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	background-color: ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#f0fdf4';
			case 'warning':
				return '#fef3c7';
			case 'danger':
				return '#fee2e2';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#22c55e';
			case 'warning':
				return '#f59e0b';
			case 'danger':
				return '#ef4444';
			default:
				return '#8b5cf6';
		}
	}};
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

	strong {
		color: #111827;
		font-weight: 600;
	}
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

const HighlightedActionButton = styled.button<{ $priority?: 'primary' | 'success' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: ${({ $priority }) =>
		$priority === 'success' ? '#22c55e' : $priority === 'primary' ? '#8b5cf6' : '#6b7280'};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	position: relative;

	&:hover:not(:disabled) {
		background-color: ${({ $priority }) =>
			$priority === 'success' ? '#16a34a' : $priority === 'primary' ? '#7c3aed' : '#4b5563'};
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
	}

	&:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
		transform: none;
	}
`;

const HighlightBadge = styled.span`
	position: absolute;
	top: -0.5rem;
	right: -0.5rem;
	background-color: #dc2626;
	color: white;
	font-size: 0.75rem;
	font-weight: 600;
	padding: 0.25rem 0.5rem;
	border-radius: 9999px;
	min-width: 1.5rem;
	text-align: center;
`;

const GeneratedUrlDisplay = styled.div`
	background: linear-gradient(to bottom, #ffffff, #f8fafc);
	border: 2px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1rem 0;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const GeneratedLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 700;
	color: #8b5cf6;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 2px solid #e9d5ff;
`;

const CodeBlock = styled.pre`
	background-color: #ffffff;
	border: 2px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1.5rem;
	font-size: 0.875rem;
	color: #1e293b;
	overflow-x: auto;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	line-height: 1.8;
	white-space: pre;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const UseCaseGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const UseCaseCard = styled.div`
	background: #ffffff;
	border: 2px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	transition: all 0.2s;

	&:hover {
		border-color: #8b5cf6;
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
	}
`;

const UseCaseIcon = styled.div`
	width: 3rem;
	height: 3rem;
	border-radius: 0.75rem;
	background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.5rem;
	margin-bottom: 1rem;
`;

const UseCaseTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #111827;
	margin: 0 0 0.5rem 0;
`;

const UseCaseDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.6;
`;

const RequirementsIndicator = styled.div`
	background-color: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const RequirementsIcon = styled.div`
	color: #f59e0b;
	font-size: 1.25rem;
	flex-shrink: 0;
`;

const RequirementsText = styled.div`
	flex: 1;
	font-size: 0.875rem;
	color: #92400e;

	strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #78350f;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;

		li {
			margin-bottom: 0.25rem;
		}
	}
`;

const RedirectlessFlowV5: React.FC = () => {
	const _manualAuthCodeId = useId();
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'redirectless-flow-v5',
		defaultFlowVariant: 'oidc',
		enableDebugger: true,
	});

	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>({
		// Step 0
		overview: false,
		credentials: false,
		useCases: true,
		// Step 1
		pkceOverview: false,
		pkceDetails: false,
		// Step 2
		authRequestOverview: false,
		authRequestDetails: false,
		// Step 3
		flowResponseOverview: false,
		flowResponseDetails: false,
		// Step 4
		tokenResponseOverview: false,
		tokenResponseDetails: false,
		// Step 5
		completionOverview: false,
		completionDetails: false,
	});

	const [mockFlowResponse, setMockFlowResponse] = useState<any>(null);
	const [mockTokenResponse, setMockTokenResponse] = useState<any>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Step validation functions
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0: // Step 0: Introduction & Setup
					return controller.hasCredentialsSaved;
				case 1: // Step 1: PKCE Parameters
					return !!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge);
				case 2: // Step 2: Authorization Request
					return !!controller.authUrl;
				case 3: // Step 3: Flow Response
					return !!mockFlowResponse;
				case 4: // Step 4: Token Response
					return !!mockTokenResponse;
				case 5: // Step 5: Complete
					return true;
				default:
					return false;
			}
		},
		[
			controller.hasCredentialsSaved,
			controller.pkceCodes,
			controller.authUrl,
			mockFlowResponse,
			mockTokenResponse,
		]
	);

	const getStepRequirements = useCallback((stepIndex: number): string[] => {
		switch (stepIndex) {
			case 0:
				return ['Save your PingOne credentials'];
			case 1:
				return ['Generate PKCE parameters'];
			case 2:
				return ['Build authorization URL with response_mode=pi.flow'];
			case 3:
				return ['Simulate flow response'];
			case 4:
				return ['Simulate token response'];
			case 5:
				return [];
			default:
				return [];
		}
	}, []);

	const _stepCompletions = useMemo<StepCompletionState>(
		() => ({
			0: controller.hasCredentialsSaved,
			1: Boolean(controller.pkceCodes.codeVerifier),
			2: Boolean(controller.authUrl),
			3: Boolean(mockFlowResponse),
			4: Boolean(mockTokenResponse),
			5: true,
		}),
		[
			controller.hasCredentialsSaved,
			controller.pkceCodes.codeVerifier,
			controller.authUrl,
			mockFlowResponse,
			mockTokenResponse,
		]
	);

	const toggleSection = useCallback((key: IntroSectionKey) => {
		setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

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
			// Use the controller's generateAuthorizationUrl method
			// Note: This will generate a standard auth URL, but we'll document the pi.flow parameter
			await controller.generateAuthorizationUrl();
			v4ToastManager.showSuccess(
				'Authorization URL generated! (Add response_mode=pi.flow for redirectless flow)'
			);
		} catch (error) {
			console.error('[RedirectlessFlowV5] Failed to generate authorization URL:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to generate authorization URL'
			);
		}
	}, [controller]);

	const handleSimulateFlowResponse = useCallback(() => {
		// Simulate receiving a flow object from PingOne
		const mockResponse = {
			status: 'AUTHENTICATION_REQUIRED',
			flow: {
				id: `flow-${Math.random().toString(36).substring(7)}`,
				type: 'AUTHENTICATION',
				expiresAt: new Date(Date.now() + 300000).toISOString(),
				_embedded: {
					challenge: {
						type: 'USERNAME_PASSWORD',
						_links: {
							submit: {
								href: `/flows/flow-${Math.random().toString(36).substring(7)}`,
							},
						},
					},
				},
				_links: {
					self: {
						href: `/as/authorize?flowId=flow-${Math.random().toString(36).substring(7)}`,
					},
				},
			},
		};

		setMockFlowResponse(mockResponse);
		v4ToastManager.showSuccess('Flow response received! (Mock).');
	}, []);

	const handleSimulateTokenResponse = useCallback(() => {
		// Simulate receiving tokens in JSON format (no redirect)
		const mockTokens = {
			access_token: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
				JSON.stringify({
					sub: `user-${Math.random().toString(36).substring(7)}`,
					iss: controller.credentials.authorizationEndpoint.replace('/as/authorize', ''),
					aud: controller.credentials.clientId,
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
					scope: controller.credentials.scope,
				})
			)}.signature`,
			id_token: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
				JSON.stringify({
					sub: `user-${Math.random().toString(36).substring(7)}`,
					iss: controller.credentials.authorizationEndpoint.replace('/as/authorize', ''),
					aud: controller.credentials.clientId,
					exp: Math.floor(Date.now() / 1000) + 3600,
					iat: Math.floor(Date.now() / 1000),
					nonce: 'mock-nonce',
					email: 'user@example.com',
					name: 'Mock User',
				})
			)}.signature`,
			token_type: 'Bearer',
			expires_in: 3600,
			scope: controller.credentials.scope,
		};

		setMockTokenResponse(mockTokens);
		v4ToastManager.showSuccess('Tokens received in JSON format! (Mock).');
	}, [controller.credentials]);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
		setCopiedField(label);
		setTimeout(() => setCopiedField(null), 1000);
	}, []);

	const canNavigateNext = useCallback(() => {
		return isStepValid(currentStep);
	}, [isStepValid, currentStep]);

	const canNavigatePrevious = useCallback(() => {
		return currentStep > 0;
	}, [currentStep]);

	const handleNext = useCallback(() => {
		if (!canNavigateNext()) {
			v4ToastManager.showError(`Complete the action above to continue.`);
			return;
		}
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	}, [canNavigateNext, currentStep]);

	const handlePrevious = useCallback(() => {
		if (canNavigatePrevious()) {
			setCurrentStep(currentStep - 1);
		}
	}, [canNavigatePrevious, currentStep]);

	const handleResetFlow = useCallback(() => {
		setCurrentStep(0);
		setMockFlowResponse(null);
		setMockTokenResponse(null);
		controller.resetFlow();
		v4ToastManager.showSuccess('Flow reset successfully!');
	}, [controller]);

	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<FlowConfigurationRequirements flowType="redirectless" variant="pingone" />
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiInfo /> What is Redirectless Flow (pi.flow)?
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
											<InfoTitle>PingOne Proprietary Response Mode</InfoTitle>
											<InfoText>
												<code>response_mode=pi.flow</code> is a PingOne-specific OAuth 2.0 extension
												that allows applications to request OAuth/OIDC tokens without redirecting
												the user's browser. Instead of traditional redirects, the authentication UI
												is hosted within your application, and tokens are returned in a JSON
												response.
											</InfoText>
											<InfoList>
												<li>
													<strong>No Browser Redirects:</strong> Authentication happens within your
													app's context
												</li>
												<li>
													<strong>JSON Response:</strong> Tokens returned as JSON instead of URL
													parameters
												</li>
												<li>
													<strong>Flow Object:</strong> Receive a flow object to manage
													authentication state
												</li>
												<li>
													<strong>Embedded UI:</strong> Host PingOne authentication UI in your
													application
												</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('useCases')}
								aria-expanded={!collapsedSections.useCases}
							>
								<CollapsibleTitle>
									<FiMonitor /> Use Cases
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.useCases}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.useCases && (
								<CollapsibleContent>
									<UseCaseGrid>
										<UseCaseCard>
											<UseCaseIcon>
												<FiSmartphone />
											</UseCaseIcon>
											<UseCaseTitle>Mobile Applications</UseCaseTitle>
											<UseCaseDescription>
												Native mobile apps can implement custom authentication UI without browser
												redirects.
											</UseCaseDescription>
										</UseCaseCard>

										<UseCaseCard>
											<UseCaseIcon>
												<FiMonitor />
											</UseCaseIcon>
											<UseCaseTitle>Single Page Applications</UseCaseTitle>
											<UseCaseDescription>
												SPAs can render authentication UI natively without leaving the application
												context.
											</UseCaseDescription>
										</UseCaseCard>

										<UseCaseCard>
											<UseCaseIcon>
												<FiShield />
											</UseCaseIcon>
											<UseCaseTitle>MFA Integration</UseCaseTitle>
											<UseCaseDescription>
												Integrate PingOne MFA into existing applications without redirecting users.
											</UseCaseDescription>
										</UseCaseCard>

										<UseCaseCard>
											<UseCaseIcon>
												<FiLock />
											</UseCaseIcon>
											<UseCaseTitle>Transaction Approval</UseCaseTitle>
											<UseCaseDescription>
												Implement strong authentication for high-value transactions without full
												page redirects.
											</UseCaseDescription>
										</UseCaseCard>
									</UseCaseGrid>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiSettings size={18} /> PingOne Configuration
							</ResultsHeading>
							<HelperText>
								Configure your PingOne environment and application credentials.
							</HelperText>

							<CredentialsInput
								environmentId={controller.credentials.environmentId}
								clientId={controller.credentials.clientId}
								clientSecret={controller.credentials.clientSecret}
								redirectUri={controller.credentials.redirectUri}
								scopes={controller.credentials.scope}
								onEnvironmentIdChange={(value) =>
									controller.setCredentials({ ...controller.credentials, environmentId: value })
								}
								onClientIdChange={(value) =>
									controller.setCredentials({ ...controller.credentials, clientId: value })
								}
								onClientSecretChange={(value) =>
									controller.setCredentials({ ...controller.credentials, clientSecret: value })
								}
								onRedirectUriChange={(value) =>
									controller.setCredentials({ ...controller.credentials, redirectUri: value })
								}
								onScopesChange={(value) =>
									controller.setCredentials({ ...controller.credentials, scope: value })
								}
								onCopy={handleCopy}
								emptyRequiredFields={controller.emptyRequiredFields}
								copiedField={copiedField}
								showRedirectUri={true}
							/>

							<ActionRow>
								<HighlightedActionButton
									onClick={controller.saveCredentials}
									$priority="primary"
									disabled={controller.hasCredentialsSaved}
								>
									{controller.hasCredentialsSaved ? <FiCheckCircle /> : <FiSettings />}
									{controller.hasCredentialsSaved ? 'Credentials Saved' : 'Save Credentials'}
									{!controller.hasCredentialsSaved && <HighlightBadge>1</HighlightBadge>}
								</HighlightedActionButton>

								{controller.hasCredentialsSaved && (
									<HighlightedActionButton onClick={controller.clearCredentials}>
										<FiRefreshCw /> Clear Credentials
									</HighlightedActionButton>
								)}
							</ActionRow>
						</ResultsSection>

						<SectionDivider />
						<ConfigurationSummaryCard
							configuration={controller.credentials}
							onSaveConfiguration={controller.saveCredentials}
							onLoadConfiguration={controller.loadCredentials}
							primaryColor="#8b5cf6"
						/>
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
									<FiKey /> PKCE Parameters Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.pkceOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.pkceOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiKey size={20} />
										<div>
											<InfoTitle>PKCE for Redirectless Flow</InfoTitle>
											<InfoText>
												PKCE (Proof Key for Code Exchange) is essential for security in redirectless
												flows. The code challenge is included in the authorization request, and the
												code verifier is used during token exchange.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiKey size={18} /> Generate PKCE Parameters
							</ResultsHeading>
							<HelperText>Generate secure PKCE parameters for the redirectless flow.</HelperText>

							<ActionRow>
								<HighlightedActionButton onClick={handleGeneratePkce} $priority="primary">
									{controller.pkceCodes.codeVerifier ? <FiRefreshCw /> : <FiKey />}
									{controller.pkceCodes.codeVerifier
										? 'Regenerate PKCE Parameters'
										: 'Generate PKCE Parameters'}
									{!controller.pkceCodes.codeVerifier && <HighlightBadge>1</HighlightBadge>}
								</HighlightedActionButton>
							</ActionRow>

							{controller.pkceCodes.codeVerifier && (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Generated PKCE Parameters</GeneratedLabel>
									<div style={{ marginBottom: '1.5rem', lineHeight: '2' }}>
										<div style={{ marginBottom: '1rem' }}>
											<strong
												style={{
													display: 'block',
													color: '#6b7280',
													fontSize: '0.875rem',
													marginBottom: '0.25rem',
												}}
											>
												Code Verifier:
											</strong>
											<code
												style={{
													display: 'block',
													backgroundColor: '#f1f5f9',
													padding: '0.75rem',
													borderRadius: '0.375rem',
													fontSize: '0.875rem',
													wordBreak: 'break-all',
													fontFamily: 'Monaco, Menlo, monospace',
													border: '1px solid #e2e8f0',
												}}
											>
												{controller.pkceCodes.codeVerifier}
											</code>
										</div>
										<div style={{ marginBottom: '1rem' }}>
											<strong
												style={{
													display: 'block',
													color: '#6b7280',
													fontSize: '0.875rem',
													marginBottom: '0.25rem',
												}}
											>
												Code Challenge:
											</strong>
											<code
												style={{
													display: 'block',
													backgroundColor: '#f1f5f9',
													padding: '0.75rem',
													borderRadius: '0.375rem',
													fontSize: '0.875rem',
													wordBreak: 'break-all',
													fontFamily: 'Monaco, Menlo, monospace',
													border: '1px solid #e2e8f0',
												}}
											>
												{controller.pkceCodes.codeChallenge}
											</code>
										</div>
										<div>
											<strong
												style={{
													display: 'block',
													color: '#6b7280',
													fontSize: '0.875rem',
													marginBottom: '0.25rem',
												}}
											>
												Method:
											</strong>
											<code
												style={{
													display: 'inline-block',
													backgroundColor: '#8b5cf6',
													color: 'white',
													padding: '0.375rem 0.75rem',
													borderRadius: '0.375rem',
													fontSize: '0.875rem',
													fontFamily: 'Monaco, Menlo, monospace',
													fontWeight: '600',
												}}
											>
												{controller.pkceCodes.codeChallengeMethod}
											</code>
										</div>
									</div>
									<ActionRow>
										<HighlightedActionButton
											onClick={() => handleCopy(controller.pkceCodes.codeVerifier, 'Code Verifier')}
											$priority="primary"
										>
											<FiCopy /> Copy Verifier
										</HighlightedActionButton>
										<HighlightedActionButton
											onClick={() =>
												handleCopy(controller.pkceCodes.codeChallenge, 'Code Challenge')
											}
											$priority="primary"
										>
											<FiCopy /> Copy Challenge
										</HighlightedActionButton>
									</ActionRow>
								</GeneratedUrlDisplay>
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
									<FiCode /> Authorization Request with pi.flow
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authRequestOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiCode size={20} />
										<div>
											<InfoTitle>Key Parameter: response_mode=pi.flow</InfoTitle>
											<InfoText>
												The <code>response_mode=pi.flow</code> parameter tells PingOne to return a
												flow object instead of redirecting the browser. This enables embedded
												authentication within your application.
											</InfoText>
											<CodeBlock>{`GET /as/authorize?
  response_type=code
  &response_mode=pi.flow  // KEY PARAMETER
  &client_id={{clientID}}
  &redirect_uri={{redirectUri}}
  &scope=openid profile email
  &state={{randomState}}
  &nonce={{randomNonce}}
  &code_challenge={{codeChallenge}}
  &code_challenge_method=S256`}</CodeBlock>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiCode size={18} /> Generate Authorization URL
							</ResultsHeading>
							<HelperText>
								Build the authorization URL with <code>response_mode=pi.flow</code>.
							</HelperText>

							<ActionRow>
								<HighlightedActionButton
									onClick={handleGenerateAuthUrl}
									$priority="primary"
									disabled={!!controller.authUrl || !controller.pkceCodes.codeVerifier}
								>
									{controller.authUrl ? <FiCheckCircle /> : <FiCode />}
									{controller.authUrl
										? 'URL Generated'
										: !controller.pkceCodes.codeVerifier
											? 'Complete above action'
											: 'Generate Authorization URL'}
									{!controller.authUrl && controller.pkceCodes.codeVerifier && (
										<HighlightBadge>1</HighlightBadge>
									)}
								</HighlightedActionButton>
							</ActionRow>

							{controller.authUrl && (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Generated Authorization URL</GeneratedLabel>
									<div
										style={{
											marginBottom: '1rem',
											wordBreak: 'break-all',
											backgroundColor: '#f1f5f9',
											padding: '0.75rem',
											borderRadius: '0.375rem',
											fontSize: '0.875rem',
											fontFamily: 'Monaco, Menlo, monospace',
											border: '1px solid #e2e8f0',
											overflowWrap: 'break-word',
										}}
									>
										{controller.authUrl}
									</div>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div style={{ flex: 1 }}>
											<InfoTitle>Add response_mode=pi.flow</InfoTitle>
											<InfoText>
												To make this a redirectless flow, add <code>&response_mode=pi.flow</code> to
												the URL. This tells PingOne to return a flow object instead of redirecting
												the browser.
											</InfoText>
											<InfoText style={{ marginTop: '0.75rem' }}>
												<strong style={{ display: 'block', marginBottom: '0.5rem' }}>
													Example with pi.flow:
												</strong>
												<code
													style={{
														display: 'block',
														backgroundColor: '#f1f5f9',
														padding: '0.75rem',
														borderRadius: '0.375rem',
														fontSize: '0.75rem',
														wordBreak: 'break-all',
														overflowWrap: 'break-word',
														fontFamily: 'Monaco, Menlo, monospace',
														border: '1px solid #e2e8f0',
														lineHeight: '1.5',
													}}
												>
													{controller.authUrl}&response_mode=pi.flow
												</code>
											</InfoText>
										</div>
									</InfoBox>
									<ActionRow>
										<HighlightedActionButton
											onClick={() => handleCopy(controller.authUrl ?? '', 'Authorization URL')}
											$priority="primary"
										>
											<FiCopy /> Copy URL
										</HighlightedActionButton>
										<HighlightedActionButton
											onClick={() =>
												handleCopy(
													`${controller.authUrl}&response_mode=pi.flow`,
													'Redirectless URL'
												)
											}
											$priority="success"
										>
											<FiCopy /> Copy with pi.flow
										</HighlightedActionButton>
									</ActionRow>
								</GeneratedUrlDisplay>
							)}
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('flowResponseOverview')}
								aria-expanded={!collapsedSections.flowResponseOverview}
							>
								<CollapsibleTitle>
									<FiZap /> Flow Response (No Redirect)
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.flowResponseOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.flowResponseOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiZap size={20} />
										<div>
											<InfoTitle>Flow Object Response</InfoTitle>
											<InfoText>
												Instead of redirecting, PingOne returns a JSON flow object containing
												authentication state and UI components. Your application renders the
												authentication UI based on this object.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiZap size={18} /> Simulate Flow Response
							</ResultsHeading>
							<HelperText>
								Simulate receiving a flow object from PingOne (no browser redirect).
							</HelperText>

							<ActionRow>
								<HighlightedActionButton
									onClick={handleSimulateFlowResponse}
									$priority="primary"
									disabled={!!mockFlowResponse}
								>
									{mockFlowResponse ? <FiCheckCircle /> : <FiZap />}
									{mockFlowResponse ? 'Flow Response Received' : 'Simulate Flow Response'}
									{!mockFlowResponse && <HighlightBadge>1</HighlightBadge>}
								</HighlightedActionButton>
							</ActionRow>

							{mockFlowResponse && (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Flow Object Response (JSON)</GeneratedLabel>
									<CodeBlock>{JSON.stringify(mockFlowResponse, null, 2)}</CodeBlock>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>No Redirect Occurred</InfoTitle>
											<InfoText>
												Notice that the browser did not redirect. The flow object was returned as
												JSON, allowing your application to render the authentication UI within its
												own context.
											</InfoText>
										</div>
									</InfoBox>
								</GeneratedUrlDisplay>
							)}
						</ResultsSection>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenResponseOverview')}
								aria-expanded={!collapsedSections.tokenResponseOverview}
							>
								<CollapsibleTitle>
									<FiKey /> Token Response (JSON Format)
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenResponseOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenResponseOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiKey size={20} />
										<div>
											<InfoTitle>Tokens in JSON Format</InfoTitle>
											<InfoText>
												After authentication, tokens are returned in JSON format instead of URL
												parameters. This provides better security and allows your application to
												handle tokens programmatically.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiKey size={18} /> Simulate Token Response
							</ResultsHeading>
							<HelperText>Simulate receiving tokens in JSON format (no URL parameters).</HelperText>

							<ActionRow>
								<HighlightedActionButton
									onClick={handleSimulateTokenResponse}
									$priority="primary"
									disabled={!!mockTokenResponse}
								>
									{mockTokenResponse ? <FiCheckCircle /> : <FiKey />}
									{mockTokenResponse ? 'Tokens Received' : 'Simulate Token Response'}
									{!mockTokenResponse && <HighlightBadge>1</HighlightBadge>}
								</HighlightedActionButton>
							</ActionRow>

							{mockTokenResponse && (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Token Response (JSON)</GeneratedLabel>
									<CodeBlock>{JSON.stringify(mockTokenResponse, null, 2)}</CodeBlock>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Tokens Received Securely</InfoTitle>
											<InfoText>
												Tokens were returned in JSON format, not as URL parameters. This is more
												secure and allows your application to handle them programmatically without
												parsing URLs.
											</InfoText>
										</div>
									</InfoBox>
								</GeneratedUrlDisplay>
							)}
						</ResultsSection>
					</>
				);

			case 5:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('completionOverview')}
								aria-expanded={!collapsedSections.completionOverview}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Redirectless Flow Complete
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.completionOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.completionOverview && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Flow Complete!</InfoTitle>
											<InfoText>
												You've successfully completed the redirectless flow demonstration. You've
												seen how
												<code>response_mode=pi.flow</code> enables embedded authentication without
												browser redirects.
											</InfoText>
											<InfoList>
												<li>
													<strong>No Redirects:</strong> Authentication happened within the app
													context
												</li>
												<li>
													<strong>JSON Responses:</strong> Flow object and tokens returned as JSON
												</li>
												<li>
													<strong>Better UX:</strong> Users stayed within your application
												</li>
												<li>
													<strong>More Secure:</strong> Tokens not exposed in URL parameters
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
								<FiExternalLink size={18} /> Next Steps & Resources
							</ResultsHeading>
							<HelperText>
								Learn more about implementing redirectless flow in production.
							</HelperText>

							<InfoList>
								<li>
									<strong>PingOne Documentation:</strong>{' '}
									<a
										href="https://docs.pingidentity.com/pingone/applications/p1_response_mode_values.html"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#8b5cf6' }}
									>
										Response Mode Values (pi.flow)
									</a>
								</li>
								<li>
									<strong>PingOne Auth API:</strong>{' '}
									<a
										href="https://apidocs.pingidentity.com/pingone/auth/v1/api/"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#8b5cf6' }}
									>
										Redirect and Non-Redirect Authentication Flows
									</a>
								</li>
								<li>
									<strong>DaVinci Widget:</strong>{' '}
									<a
										href="https://docs.pingidentity.com/davinci/integrating_flows_into_applications/davinci_launching_a_flow_with_the_widget.html"
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: '#8b5cf6' }}
									>
										Launching a Flow with the Widget
									</a>
								</li>
							</InfoList>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Security Considerations</InfoTitle>
									<InfoText>When implementing redirectless flow in production:</InfoText>
									<InfoList>
										<li>Configure CORS to allow only your application origins</li>
										<li>Use proper XSS and CSRF protection</li>
										<li>Disable implicit grant type</li>
										<li>Choose authentication method other than NONE</li>
										<li>Follow OWASP security best practices</li>
									</InfoList>
								</div>
							</InfoBox>

							<ActionRow>
								<HighlightedActionButton onClick={handleResetFlow} $priority="danger">
									<FiRefreshCw /> Reset Flow
								</HighlightedActionButton>
							</ActionRow>
						</ResultsSection>
					</>
				);

			default:
				return null;
		}
	}, [
		currentStep,
		collapsedSections,
		toggleSection,
		controller,
		handleCopy,
		handleGeneratePkce,
		handleGenerateAuthUrl,
		handleSimulateFlowResponse,
		handleSimulateTokenResponse,
		handleResetFlow,
		mockFlowResponse,
		mockTokenResponse,
		copiedField,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowType="redirectless" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Redirectless Flow · V5</VersionBadge>
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

					<StepContent>{renderStepContent}</StepContent>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onNext={handleNext}
					onPrevious={handlePrevious}
					onReset={handleResetFlow}
					canNavigateNext={canNavigateNext()}
					isFirstStep={currentStep === 0}
				/>
			</ContentWrapper>
		</Container>
	);
};

export default RedirectlessFlowV5;
