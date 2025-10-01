// src/pages/flows/PingOnePARFlowV5.tsx
import { useCallback, useId, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import FlowInfoCard from '../../components/FlowInfoCard';
import {
	FlowDiagram,
	FlowStep,
	FlowStepContent,
	FlowStepNumber,
} from '../../components/InfoBlocks';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { pingOneConfigService } from '../../services/pingoneConfigService';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const STEP_METADATA = [
	{
		title: 'Step 0: Introduction & Setup',
		subtitle: 'Understand the PAR Flow and configure PingOne',
	},
	{ title: 'Step 1: PKCE Parameters', subtitle: 'Generate secure verifier and challenge' },
	{ title: 'Step 2: PAR Request', subtitle: 'Push authorization request to PingOne PAR endpoint' },
	{ title: 'Step 3: Authorization URL', subtitle: 'Generate authorization URL with request_uri' },
	{ title: 'Step 4: Complete Flow', subtitle: 'Test the complete PAR flow with PingOne' },
] as const;

type StepCompletionState = Record<number, boolean>;
type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'results' // Step 0
	| 'pkceOverview'
	| 'pkceDetails' // Step 1
	| 'parOverview'
	| 'parDetails' // Step 2
	| 'authRequestOverview'
	| 'authRequestDetails'; // Step 3

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
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s;
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	background-color: #ffffff;
	border: 1px solid #e2e8f0;
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;
	background-color: ${({ $variant }) =>
		$variant === 'success' ? '#f0fdf4' : $variant === 'warning' ? '#fef3c7' : '#eff6ff'};
	border: 1px solid ${({ $variant }) =>
		$variant === 'success' ? '#22c55e' : $variant === 'warning' ? '#f59e0b' : '#3b82f6'};
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

const _ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 1rem;
	margin: 1rem 0;

	@media (min-width: 768px) {
		grid-template-columns: 1fr 1fr;
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
		$priority === 'success' ? '#22c55e' : $priority === 'primary' ? '#0070cc' : '#6b7280'};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;
	position: relative;

	&:hover {
		background-color: ${({ $priority }) =>
			$priority === 'success' ? '#16a34a' : $priority === 'primary' ? '#0056b3' : '#4b5563'};
	}

	&:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
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
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const GeneratedLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const PingOnePARFlowV5: React.FC = () => {
	const _manualAuthCodeId = useId();
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'pingone-par-v5',
		defaultFlowVariant: 'oidc',
		enableDebugger: true,
	});

	const [currentStep, setCurrentStep] = useState(0);
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
		parOverview: false,
		parDetails: false,
		// Step 3
		authRequestOverview: false,
		authRequestDetails: false,
	});

	// PAR (Pushed Authorization Request) state
	const [parRequestUri, setParRequestUri] = useState<string | null>(null);
	const [parExpiresIn, setParExpiresIn] = useState<number | null>(null);
	const [parError, setParError] = useState<string | null>(null);
	const [isParLoading, setIsParLoading] = useState(false);

	// Step validation functions
	const isStepValid = useCallback(
		(stepIndex: number): boolean => {
			switch (stepIndex) {
				case 0: // Step 0: Introduction & Setup
					return true; // Always valid - introduction step
				case 1: // Step 1: PKCE Parameters
					return !!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge);
				case 2: // Step 2: PAR Request
					return !!parRequestUri;
				case 3: // Step 3: Authorization URL
					return !!(controller.authUrl && parRequestUri);
				case 4: // Step 4: Complete Flow
					return true; // Always valid - completion step
				default:
					return false;
			}
		},
		[controller.pkceCodes, controller.authUrl, parRequestUri]
	);

	// Get step completion requirements for user guidance
	const getStepRequirements = useCallback((stepIndex: number): string[] => {
		switch (stepIndex) {
			case 0: // Step 0: Introduction & Setup
				return ['Review the flow overview and setup credentials'];
			case 1: // Step 1: PKCE Parameters
				return ['Generate PKCE code verifier and code challenge'];
			case 2: // Step 2: PAR Request
				return ['Push authorization request to PAR endpoint'];
			case 3: // Step 3: Authorization URL
				return ['Generate authorization URL with request_uri'];
			case 4: // Step 4: Complete Flow
				return ['Test the complete PAR flow'];
			default:
				return [];
		}
	}, []);

	const stepCompletions = useMemo<StepCompletionState>(
		() => ({
			0: controller.hasStepResult('setup-credentials') || controller.hasCredentialsSaved,
			1: controller.hasStepResult('generate-pkce') || Boolean(controller.pkceCodes.codeVerifier),
			2: Boolean(parRequestUri),
			3: controller.hasStepResult('build-auth-url') || Boolean(controller.authUrl),
			4: true, // Always valid - completion step
		}),
		[
			controller.hasCredentialsSaved,
			controller.hasStepResult,
			controller.pkceCodes.codeVerifier,
			controller.authUrl,
			parRequestUri,
		]
	);

	const toggleSection = useCallback((key: IntroSectionKey) => {
		setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
	}, []);

	const generateRandomString = (length: number): string => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

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

	const handlePushAuthorizationRequest = useCallback(async () => {
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

		setIsParLoading(true);
		setParError(null);

		try {
			if (!pingOneConfigService.isConfigValid()) {
				throw new Error('PingOne configuration is incomplete');
			}

			// Build PAR request parameters
			const parRequest = {
				response_type: 'code',
				client_id: controller.credentials.clientId,
				redirect_uri: controller.credentials.redirectUri,
				scope: controller.credentials.scope,
				state: generateRandomString(32),
				nonce: generateRandomString(32),
				code_challenge: controller.pkceCodes.codeChallenge,
				code_challenge_method: 'S256',
			};

			console.log('🔧 [PingOnePARFlowV5] Pushing authorization request to PAR endpoint...');

			// Use the backend proxy to avoid CORS issues
			const response = await fetch('/api/par', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					environment_id: controller.credentials.environmentId,
					client_secret: controller.credentials.clientSecret,
					...parRequest,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`PAR request failed: ${response.status} - ${JSON.stringify(errorData)}`);
			}

			const parData = await response.json();
			setParRequestUri(parData.request_uri);
			setParExpiresIn(parData.expires_in);

			v4ToastManager.showSuccess('PAR request pushed successfully!');
			console.log('✅ [PingOnePARFlowV5] PAR request successful:', parData);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setParError(errorMessage);
			v4ToastManager.showError(`PAR request failed: ${errorMessage}`);
			console.error('❌ [PingOnePARFlowV5] PAR request failed:', error);
		} finally {
			setIsParLoading(false);
		}
	}, [controller, generateRandomString]);

	const handleGenerateAuthUrl = useCallback(async () => {
		if (!controller.credentials.clientId || !controller.credentials.environmentId) {
			v4ToastManager.showError(
				'Complete above action: Fill in Client ID and Environment ID first.'
			);
			return;
		}
		if (!parRequestUri) {
			v4ToastManager.showError('Complete above action: Push PAR request first.');
			return;
		}

		try {
			// Generate authorization URL with PAR request_uri
			const authUrl = new URL(controller.credentials.authorizationEndpoint);
			authUrl.searchParams.set('request_uri', parRequestUri);
			authUrl.searchParams.set('response_type', 'code');

			controller.setAuthUrl(authUrl.toString());
			v4ToastManager.showSuccess('Authorization URL generated successfully!');
		} catch (error) {
			console.error('[PingOnePARFlowV5] Failed to generate authorization URL:', error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to generate authorization URL'
			);
		}
	}, [controller, parRequestUri]);

	const handleOpenAuthUrl = useCallback(() => {
		if (!controller.authUrl) {
			v4ToastManager.showError('Complete above action: Generate the authorization URL first.');
			return;
		}
		window.open(controller.authUrl, '_blank');
	}, [controller.authUrl]);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
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

	const renderStepContent = useMemo(() => {
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
									<FiInfo /> PAR Flow Overview
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
											<InfoTitle>What is PAR?</InfoTitle>
											<InfoText>
												Pushed Authorization Request (PAR) is a security extension to OAuth 2.0 that
												pushes authorization request parameters to the authorization server before
												redirecting the user. This enhances security and prevents parameter
												tampering attacks.
											</InfoText>
											<InfoList>
												<li>
													<strong>Enhanced Security:</strong> Request parameters are protected from
													tampering
												</li>
												<li>
													<strong>Better Error Handling:</strong> Server-side validation before
													redirect
												</li>
												<li>
													<strong>Shorter URLs:</strong> Authorization URLs use request_uri instead
													of parameters
												</li>
												<li>
													<strong>RFC 9126:</strong> Standard OAuth 2.0 security extension
												</li>
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
									<FiArrowRight /> PAR Flow Diagram
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
												<strong>Push Request:</strong> Send authorization parameters to PAR endpoint
											</FlowStepContent>
										</FlowStep>
										<FlowStep>
											<FlowStepNumber>2</FlowStepNumber>
											<FlowStepContent>
												<strong>Get Request URI:</strong> Receive short-lived request_uri from
												server
											</FlowStepContent>
										</FlowStep>
										<FlowStep>
											<FlowStepNumber>3</FlowStepNumber>
											<FlowStepContent>
												<strong>Authorize:</strong> Use request_uri in authorization URL
											</FlowStepContent>
										</FlowStep>
										<FlowStep>
											<FlowStepNumber>4</FlowStepNumber>
											<FlowStepContent>
												<strong>Complete:</strong> Receive authorization code and exchange for
												tokens
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
								Configure your PingOne environment and application credentials to use the PAR flow.
							</HelperText>

							<CredentialsInput
								credentials={controller.credentials}
								onCredentialsChange={controller.setCredentials}
								onSaveCredentials={controller.saveCredentials}
								onClearCredentials={controller.clearCredentials}
								hasCredentialsSaved={controller.hasCredentialsSaved}
								emptyRequiredFields={controller.emptyRequiredFields}
								onFieldChange={controller.handleFieldChange}
							/>
						</ResultsSection>

						<SectionDivider />
						<ConfigurationSummaryCard
							configuration={controller.credentials}
							onSaveConfiguration={controller.saveCredentials}
							onLoadConfiguration={controller.loadCredentials}
							primaryColor="#16a34a"
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
											<InfoTitle>PKCE for PAR</InfoTitle>
											<InfoText>
												PKCE (Proof Key for Code Exchange) is essential for PAR security. The code
												challenge is included in the PAR request, and the code verifier is used
												during token exchange.
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
							<HelperText>Generate secure PKCE parameters for the PAR request.</HelperText>

							<ActionRow>
								<HighlightedActionButton
									onClick={handleGeneratePkce}
									$priority="primary"
									disabled={!!controller.pkceCodes.codeVerifier}
									title={
										controller.pkceCodes.codeVerifier
											? 'PKCE parameters already generated'
											: 'Generate PKCE parameters'
									}
								>
									{controller.pkceCodes.codeVerifier ? <FiCheckCircle /> : <FiKey />}{' '}
									{controller.pkceCodes.codeVerifier
										? 'PKCE Generated'
										: 'Generate PKCE Parameters'}
									<HighlightBadge>1</HighlightBadge>
								</HighlightedActionButton>
							</ActionRow>

							{controller.pkceCodes.codeVerifier && (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Generated PKCE Parameters</GeneratedLabel>
									<div style={{ marginBottom: '1rem' }}>
										<strong>Code Verifier:</strong> {controller.pkceCodes.codeVerifier}
										<br />
										<strong>Code Challenge:</strong> {controller.pkceCodes.codeChallenge}
										<br />
										<strong>Method:</strong> {controller.pkceCodes.codeChallengeMethod}
									</div>
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
								onClick={() => toggleSection('parOverview')}
								aria-expanded={!collapsedSections.parOverview}
							>
								<CollapsibleTitle>
									<FiShield /> PAR Request Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.parOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.parOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>PAR Request Process</InfoTitle>
											<InfoText>
												The PAR request sends all authorization parameters to PingOne's PAR
												endpoint, which validates and stores them securely. You receive a
												short-lived request_uri that references these parameters.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiShield size={18} /> Push Authorization Request
							</ResultsHeading>
							<HelperText>
								Push your authorization request parameters to PingOne's PAR endpoint.
							</HelperText>

							<ActionRow>
								<HighlightedActionButton
									onClick={handlePushAuthorizationRequest}
									$priority="primary"
									disabled={!!parRequestUri || !controller.pkceCodes.codeVerifier || isParLoading}
									title={
										!controller.pkceCodes.codeVerifier
											? 'Generate PKCE parameters first'
											: parRequestUri
												? 'PAR request already pushed'
												: 'Push authorization request to PAR endpoint'
									}
								>
									{parRequestUri ? (
										<FiCheckCircle />
									) : isParLoading ? (
										<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
									) : (
										<FiShield />
									)}{' '}
									{parRequestUri
										? 'PAR Request Pushed'
										: isParLoading
											? 'Pushing Request...'
											: !controller.pkceCodes.codeVerifier
												? 'Complete above action'
												: 'Push Authorization Request'}
									<HighlightBadge>2</HighlightBadge>
								</HighlightedActionButton>
							</ActionRow>

							{parRequestUri ? (
								<GeneratedUrlDisplay>
									<GeneratedLabel>PAR Response</GeneratedLabel>
									<div style={{ marginBottom: '1rem' }}>
										<strong>Request URI:</strong> {parRequestUri}
										<br />
										<strong>Expires In:</strong> {parExpiresIn} seconds
									</div>
									<HighlightedActionButton
										onClick={() => handleCopy(parRequestUri, 'Request URI')}
										$priority="primary"
									>
										<FiCopy /> Copy Request URI
									</HighlightedActionButton>
								</GeneratedUrlDisplay>
							) : parError ? (
								<InfoBox $variant="warning">
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>PAR Request Error</InfoTitle>
										<InfoText>{parError}</InfoText>
									</div>
								</InfoBox>
							) : (
								<HelperText>
									Push your authorization request to PingOne's PAR endpoint to get a request_uri.
								</HelperText>
							)}
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authRequestOverview')}
								aria-expanded={!collapsedSections.authRequestOverview}
							>
								<CollapsibleTitle>
									<FiExternalLink /> Authorization URL Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authRequestOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiExternalLink size={20} />
										<div>
											<InfoTitle>PAR Authorization URL</InfoTitle>
											<InfoText>
												The authorization URL uses the request_uri from the PAR response instead of
												individual parameters. This creates a much shorter and more secure URL.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />
						<ResultsSection>
							<ResultsHeading>
								<FiExternalLink size={18} /> Generate Authorization URL
							</ResultsHeading>
							<HelperText>Generate the authorization URL using the PAR request_uri.</HelperText>

							<ActionRow>
								<HighlightedActionButton
									onClick={handleGenerateAuthUrl}
									$priority="primary"
									disabled={!!controller.authUrl || !parRequestUri}
									title={
										!parRequestUri
											? 'Push PAR request first'
											: controller.authUrl
												? 'Authorization URL already generated'
												: 'Generate authorization URL'
									}
								>
									{controller.authUrl ? <FiCheckCircle /> : <FiExternalLink />}{' '}
									{controller.authUrl
										? 'Authorization URL Generated'
										: !parRequestUri
											? 'Complete above action'
											: 'Generate Authorization URL'}
									<HighlightBadge>3</HighlightBadge>
								</HighlightedActionButton>

								{controller.authUrl && (
									<HighlightedActionButton onClick={handleOpenAuthUrl} $priority="success">
										<FiExternalLink /> Open Authorization URL
									</HighlightedActionButton>
								)}
							</ActionRow>

							{controller.authUrl && (
								<GeneratedUrlDisplay>
									<GeneratedLabel>Generated Authorization URL</GeneratedLabel>
									<div style={{ marginBottom: '1rem' }}>{controller.authUrl}</div>
									<HighlightedActionButton
										onClick={() => handleCopy(controller.authUrl ?? '', 'Authorization URL')}
										$priority="primary"
									>
										<FiCopy /> Copy Authorization URL
									</HighlightedActionButton>
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
								onClick={() => toggleSection('results')}
								aria-expanded={!collapsedSections.results}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> PAR Flow Complete
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.results}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.results && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>PAR Flow Complete!</InfoTitle>
											<InfoText>
												You have successfully completed the PAR flow. The authorization URL is ready
												and contains the secure request_uri from your PAR request.
											</InfoText>
											<InfoList>
												<li>
													<strong>Enhanced Security:</strong> Parameters are protected via PAR
												</li>
												<li>
													<strong>Shorter URLs:</strong> Authorization URL uses request_uri
												</li>
												<li>
													<strong>Better Error Handling:</strong> Server-side validation completed
												</li>
												<li>
													<strong>RFC 9126 Compliant:</strong> Follows OAuth 2.0 security extension
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
								<FiCheckCircle size={18} /> Next Steps
							</ResultsHeading>
							<HelperText>
								Your PAR flow is complete! You can now test the authorization URL or explore other
								OAuth flows.
							</HelperText>

							<ActionRow>
								{controller.authUrl && (
									<HighlightedActionButton onClick={handleOpenAuthUrl} $priority="success">
										<FiExternalLink /> Test Authorization URL
									</HighlightedActionButton>
								)}
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
		controller.credentials,
		controller.setCredentials,
		controller.saveCredentials,
		controller.clearCredentials,
		controller.hasCredentialsSaved,
		controller.emptyRequiredFields,
		controller.handleFieldChange,
		controller.pkceCodes,
		handleGeneratePkce,
		parRequestUri,
		parExpiresIn,
		parError,
		isParLoading,
		handlePushAuthorizationRequest,
		handleCopy,
		controller.authUrl,
		handleGenerateAuthUrl,
		handleOpenAuthUrl,
		controller.loadCredentials,
	]);

	return (
		<Container>
			<ContentWrapper>
				<HeaderSection>
					<MainTitle>PingOne PAR Flow V5</MainTitle>
					<Subtitle>Pushed Authorization Request (RFC 9126) with PingOne Integration</Subtitle>
				</HeaderSection>

				<FlowInfoCard flowInfo={getFlowInfo('par')!} />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V5</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep]?.title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep]?.subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
					</StepHeader>

					<StepContent>{renderStepContent}</StepContent>

					<StepNavigationButtons
						currentStep={currentStep}
						totalSteps={STEP_METADATA.length}
						onNext={handleNext}
						onPrevious={handlePrevious}
						canNavigateNext={canNavigateNext()}
						canNavigatePrevious={canNavigatePrevious()}
						stepCompletions={stepCompletions}
						getStepRequirements={getStepRequirements}
					/>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default PingOnePARFlowV5;
