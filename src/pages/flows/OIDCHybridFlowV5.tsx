// src/pages/flows/OIDCHybridFlowV5.tsx
// V5.0.0 OIDC Hybrid Flow - Full parity with Authorization Code Flow V5
// Supports: code id_token, code token, code id_token token

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiZap,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useHybridFlow } from '../../hooks/useHybridFlow';
import { usePageScroll } from '../../hooks/usePageScroll';
import { credentialManager } from '../../utils/credentialManager';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { FlowHeader } from '../../services/flowHeaderService';
import ResponseModeSelector from '../../components/ResponseModeSelector';
import { ResponseMode } from '../../services/responseModeService';
import OIDCDiscoveryInput from '../../components/OIDCDiscoveryInput';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';

const LOG_PREFIX = '[🔀 OIDC-HYBRID]';

const log = {
	info: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [INFO]`, message, ...args);
	},
	success: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.log(`${timestamp} ${LOG_PREFIX} [SUCCESS]`, message, ...args);
	},
	error: (message: string, ...args: unknown[]) => {
		const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
		console.error(`${timestamp} ${LOG_PREFIX} [ERROR]`, message, ...args);
	},
};

const STEP_METADATA = [
	{ title: 'Step 0: Introduction & Setup', subtitle: 'Understand the OIDC Hybrid Flow and configure credentials' },
	{ title: 'Step 1: Authorization Request', subtitle: 'Build and launch authorization URL' },
	{ title: 'Step 2: Process Response', subtitle: 'Handle callback and validate tokens' },
	{ title: 'Step 3: Token Exchange', subtitle: 'Exchange code for additional tokens' },
	{ title: 'Step 4: Tokens Received', subtitle: 'View and analyze all tokens' },
	{ title: 'Step 5: Flow Complete', subtitle: 'Summary and next steps' },
] as const;

type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'configuration'
	| 'authRequest'
	| 'response'
	| 'exchange'
	| 'tokens'
	| 'complete';

// Styled Components (V5 parity)
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin-bottom: 2rem;
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
	background: #ffffff;
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

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
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

const TokenDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Courier New', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	max-height: 300px;
	overflow-y: auto;
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


const SectionDivider = styled.div`
	height: 1px;
	background: linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%);
	margin: 2rem 0;
`;

const OIDCHybridFlowV5: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const hybridFlow = useHybridFlow();
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
		flowDiagram: false,
		credentials: false, // Always expanded - users need to see credentials first
		configuration: false,
		authRequest: false,
		response: false,
		exchange: false,
		tokens: false,
		complete: false,
	});

	usePageScroll();

	// Scroll to top when step changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [currentStep]);

	// Form state
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopes, setScopes] = useState('openid profile email');
	const [responseType, setResponseType] = useState<
		'code id_token' | 'code token' | 'code id_token token'
	>('code id_token');
	const [responseMode, setResponseMode] = useState<ResponseMode>('fragment');

	// Load credentials on mount
	useEffect(() => {
		const savedCreds = credentialManager.getAllCredentials();
		if (savedCreds.environmentId) setEnvironmentId(savedCreds.environmentId);
		if (savedCreds.clientId) setClientId(savedCreds.clientId);
		if (savedCreds.clientSecret) setClientSecret(savedCreds.clientSecret || '');
		if (savedCreds.scopes) setScopes(savedCreds.scopes.join(' '));
	}, []);

	// Check for callback tokens
	useEffect(() => {
		const tokensJson = sessionStorage.getItem('hybrid_tokens');
		if (tokensJson) {
			try {
				const tokens = JSON.parse(tokensJson);
				hybridFlow.setTokens(tokens);
				sessionStorage.removeItem('hybrid_tokens');
				setCurrentStep(2); // Move to process response step
				log.success('Tokens loaded from callback');
			} catch (err) {
				log.error('Failed to parse callback tokens', err);
			}
		}

		// Check for error from callback
		const error = searchParams.get('error');
		if (error) {
			hybridFlow.setError(decodeURIComponent(error));
			v4ToastManager.showError(error);
		}
	}, [searchParams, hybridFlow.setError, hybridFlow.setTokens]);

	const handleSaveCredentials = useCallback(() => {
		if (!environmentId || !clientId) {
			v4ToastManager.showError('Please enter Environment ID and Client ID.');
			return;
		}

		hybridFlow.setCredentials({
			environmentId,
			clientId,
			clientSecret,
			scopes,
			responseType,
			responseMode,
		});

		credentialManager.saveAllCredentials({
			environmentId,
			clientId,
			clientSecret,
			scopes: scopes.split(' '),
		});

		v4ToastManager.showSuccess('Credentials saved successfully!');
		log.info('Credentials saved');
	}, [environmentId, clientId, clientSecret, scopes, responseType, hybridFlow]);

	const handleStartAuthorization = useCallback(() => {
		try {
			const authUrl = hybridFlow.generateAuthorizationUrl();
			log.info('Redirecting to authorization URL');
			window.location.href = authUrl;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to generate authorization URL';
			v4ToastManager.showError(errorMessage);
		}
	}, [hybridFlow]);

	const handleExchangeCode = useCallback(async () => {
		if (!hybridFlow.tokens?.code) {
			v4ToastManager.showError('No authorization code available.');
			return;
		}

		try {
			await hybridFlow.exchangeCodeForTokens(hybridFlow.tokens.code);
			setCurrentStep(4); // Move to tokens received
		} catch {
			// Error already handled in hook
		}
	}, [hybridFlow]);

	const toggleSection = useCallback((sectionKey: IntroSectionKey) => {
		setCollapsedSections((prev) => ({
			...prev,
			[sectionKey]: !prev[sectionKey],
		}));
	}, []);

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
	};

	const navigateToTokenManagement = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('oidc-hybrid-v5', currentStep, 'oidc');

		if (hybridFlow.tokens?.access_token) {
			localStorage.setItem('token_to_analyze', hybridFlow.tokens.access_token);
			localStorage.setItem('token_type', 'access');
			localStorage.setItem('flow_source', 'hybrid-v5');
			log.info('Navigating to Token Management with access token');
		}
		navigate('/token-management');
	}, [hybridFlow.tokens, navigate, currentStep]);

	const navigateToTokenManagementWithIdToken = useCallback(() => {
		// Store flow navigation state for back navigation
		storeFlowNavigationState('oidc-hybrid-v5', currentStep, 'oidc');

		if (hybridFlow.tokens?.id_token) {
			localStorage.setItem('token_to_analyze', hybridFlow.tokens.id_token);
			localStorage.setItem('token_type', 'id');
			localStorage.setItem('flow_source', 'hybrid-v5');
			log.info('Navigating to Token Management with ID token');
		}
		navigate('/token-management');
	}, [hybridFlow.tokens, navigate, currentStep]);

	const renderStepContent = useCallback(
		(stepIndex: number) => {
			switch (stepIndex) {
				case 0:
					return renderIntroduction();
				case 1:
					return renderAuthorizationRequest();
				case 2:
					return renderProcessResponse();
				case 3:
					return renderTokenExchange();
				case 4:
					return renderTokensReceived();
				case 5:
					return renderCompletion();
				default:
					return null;
			}
		},
		[
			collapsedSections,
			environmentId,
			clientId,
			clientSecret,
			scopes,
			responseType,
			hybridFlow,
			handleSaveCredentials,
			handleStartAuthorization,
			handleExchangeCode,
			toggleSection,
			handleCopy,
			navigateToTokenManagement,
			navigateToTokenManagementWithIdToken,
		]
	);

	const renderIntroduction = () => (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('overview')}
					aria-expanded={!collapsedSections.overview}
				>
					<CollapsibleTitle>
						<FiInfo /> OIDC Hybrid Flow Overview
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
								<InfoTitle>What is OIDC Hybrid Flow?</InfoTitle>
								<InfoText>
									The Hybrid Flow combines Authorization Code and Implicit flows, allowing tokens to
									be returned from both the authorization endpoint (in the fragment) and the token
									endpoint. This provides flexibility for different client types and security
									requirements.
								</InfoText>
							</div>
						</InfoBox>

						<InfoBox $variant="warning">
							<FiAlertCircle size={20} />
							<div>
								<InfoTitle>Response Types Supported:</InfoTitle>
								<InfoList>
									<li>
										<code>code id_token</code> - Returns code + ID token in fragment
									</li>
									<li>
										<code>code token</code> - Returns code + access token in fragment
									</li>
									<li>
										<code>code id_token token</code> - Returns code + ID token + access token in
										fragment
									</li>
								</InfoList>
							</div>
						</InfoBox>

						<InfoBox>
							<FiZap size={20} />
							<div>
								<InfoTitle>Key Features:</InfoTitle>
								<InfoList>
									<li>Immediate access to ID token for client-side validation</li>
									<li>Authorization code for secure token exchange</li>
									<li>Flexible security model for different client types</li>
									<li>Supports both public and confidential clients</li>
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
							environmentId={environmentId}
							clientId={clientId}
							clientSecret={clientSecret}
							scopes={scopes}
							onEnvironmentIdChange={setEnvironmentId}
							onClientIdChange={setClientId}
							onClientSecretChange={setClientSecret}
							onScopesChange={setScopes}
							onCopy={handleCopy}
							showRedirectUri={false}
							showLoginHint={false}
						/>

						<SectionDivider />
						
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>Response Mode Selection</InfoTitle>
								<InfoText>
									Choose how PingOne returns the authorization response. Different modes are 
									optimized for different application types and security requirements.
								</InfoText>
							</div>
						</InfoBox>

						<ResponseModeSelector
							selectedMode={responseMode}
							onModeChange={setResponseMode}
							responseType={responseType}
							clientType="confidential"
							platform="web"
							showRecommendations={true}
							showUrlExamples={true}
							baseUrl="https://auth.pingone.com/{envID}/as/authorize"
						/>

						<FlowConfigurationRequirements flowType="hybrid" variant="oidc" />

						<SectionDivider />
						<ConfigurationSummaryCard
							configuration={{
								environmentId,
								clientId,
								clientSecret,
								scopes: scopes.split(' '),
								responseType,
								responseMode,
							}}
							onSaveConfiguration={handleSaveCredentials}
							onLoadConfiguration={(config) => {
								if (config) {
									setEnvironmentId(config.environmentId || '');
									setClientId(config.clientId || '');
									setClientSecret(config.clientSecret || '');
									setScopes(config.scopes?.join(' ') || 'openid profile email');
									if (config.responseType) setResponseType(config.responseType as 'code id_token' | 'code token' | 'code id_token token');
									if (config.responseMode) setResponseMode(config.responseMode as ResponseMode);
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
						<FiZap /> Hybrid Flow Sequence
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.flowDiagram}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.flowDiagram && (
					<CollapsibleContent>
						<InfoBox>
							<FiInfo size={20} />
							<div>
								<InfoTitle>Flow Steps:</InfoTitle>
								<InfoList>
									<li>User initiates authorization request with hybrid response type</li>
									<li>Authorization server authenticates user and obtains consent</li>
									<li>Server returns authorization code + tokens in fragment</li>
									<li>Client extracts tokens from URL fragment</li>
									<li>Client exchanges authorization code for additional tokens</li>
									<li>Client receives all tokens (access, ID, refresh)</li>
								</InfoList>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		</>
	);

	const renderAuthorizationRequest = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('authRequest')}
				aria-expanded={!collapsedSections.authRequest}
			>
				<CollapsibleTitle>
					<FiExternalLink /> Authorization Request
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.authRequest}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.authRequest && (
				<CollapsibleContent>
					<InfoBox>
						<FiInfo size={20} />
						<div>
							<InfoText>
								Click the button below to start the authorization flow. You'll be redirected to
								PingOne where you can authenticate and authorize the application.
							</InfoText>
						</div>
					</InfoBox>

					<ParameterGrid>
						<ParameterLabel>Response Type</ParameterLabel>
						<ParameterValue>{responseType}</ParameterValue>
						<ParameterLabel>Scopes</ParameterLabel>
						<ParameterValue>{scopes}</ParameterValue>
					</ParameterGrid>

					<ActionRow>
						<Button
							onClick={handleStartAuthorization}
							disabled={!environmentId || !clientId}
							$variant="primary"
						>
							<FiExternalLink /> Start Authorization
						</Button>
					</ActionRow>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderProcessResponse = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('response')}
				aria-expanded={!collapsedSections.response}
			>
				<CollapsibleTitle>
					<FiCheckCircle /> Process Response
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.response}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.response && (
				<CollapsibleContent>
					{hybridFlow.tokens ? (
						<>
							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Authorization Response Received!</InfoTitle>
									<InfoText>
										Tokens received from authorization endpoint. Click "Exchange Code" to get
										additional tokens from the token endpoint.
									</InfoText>
								</div>
							</InfoBox>

							{hybridFlow.tokens.id_token && (
								<div style={{ marginTop: '1rem' }}>
									<ParameterLabel>ID Token (from fragment)</ParameterLabel>
									<TokenDisplay>{hybridFlow.tokens.id_token}</TokenDisplay>
									<ActionRow>
										<Button onClick={() => handleCopy(hybridFlow.tokens!.id_token!, 'ID Token')}>
											<FiCopy /> Copy
										</Button>
										<Button onClick={navigateToTokenManagementWithIdToken} $variant="outline">
											<FiExternalLink /> Decode ID Token
										</Button>
									</ActionRow>
								</div>
							)}

							{hybridFlow.tokens.access_token && (
								<div style={{ marginTop: '1rem' }}>
									<ParameterLabel>Access Token (from fragment)</ParameterLabel>
									<TokenDisplay>{hybridFlow.tokens.access_token}</TokenDisplay>
									<ActionRow>
										<Button
											onClick={() => handleCopy(hybridFlow.tokens!.access_token!, 'Access Token')}
										>
											<FiCopy /> Copy
										</Button>
										<Button onClick={navigateToTokenManagement} $variant="outline">
											<FiExternalLink /> Decode Access Token
										</Button>
									</ActionRow>
								</div>
							)}

							{hybridFlow.tokens.code && (
								<div style={{ marginTop: '1rem' }}>
									<ParameterLabel>Authorization Code</ParameterLabel>
									<TokenDisplay>{hybridFlow.tokens.code}</TokenDisplay>
								</div>
							)}
						</>
					) : (
						<InfoBox $variant="warning">
							<FiAlertCircle size={20} />
							<div>
								<InfoText>
									Waiting for authorization response. Please complete the authorization flow.
								</InfoText>
							</div>
						</InfoBox>
					)}
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenExchange = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('exchange')}
				aria-expanded={!collapsedSections.exchange}
			>
				<CollapsibleTitle>
					<FiRefreshCw /> Token Exchange
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.exchange}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.exchange && (
				<CollapsibleContent>
					<InfoBox>
						<FiInfo size={20} />
						<div>
							<InfoText>
								Exchange the authorization code for additional tokens (access token, refresh token,
								ID token) from the token endpoint.
							</InfoText>
						</div>
					</InfoBox>

					<ActionRow>
						<Button
							onClick={handleExchangeCode}
							disabled={!hybridFlow.tokens?.code || hybridFlow.isExchangingCode}
							$variant="primary"
						>
							{hybridFlow.isExchangingCode ? (
								<>
									<FiRefreshCw className="animate-spin" />
									Exchanging...
								</>
							) : (
								<>
									<FiRefreshCw />
									Exchange Code for Tokens
								</>
							)}
						</Button>
					</ActionRow>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokensReceived = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('tokens')}
				aria-expanded={!collapsedSections.tokens}
			>
				<CollapsibleTitle>
					<FiKey /> Tokens Received
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.tokens}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.tokens && (
				<CollapsibleContent>
					<InfoBox $variant="success">
						<FiCheckCircle size={20} />
						<div>
							<InfoTitle>All Tokens Received!</InfoTitle>
							<InfoText>
								You now have all tokens from both the authorization endpoint and token endpoint.
							</InfoText>
						</div>
					</InfoBox>

					{hybridFlow.tokens?.access_token && (
						<div style={{ marginTop: '1rem' }}>
							<ParameterLabel>Access Token</ParameterLabel>
							<TokenDisplay>{hybridFlow.tokens.access_token}</TokenDisplay>
							<ActionRow>
								<Button
									onClick={() => handleCopy(hybridFlow.tokens!.access_token!, 'Access Token')}
								>
									<FiCopy /> Copy
								</Button>
								<Button onClick={navigateToTokenManagement} $variant="outline">
									<FiExternalLink /> Analyze in Token Management
								</Button>
							</ActionRow>
						</div>
					)}

					{hybridFlow.tokens?.id_token && (
						<div style={{ marginTop: '1rem' }}>
							<ParameterLabel>ID Token</ParameterLabel>
							<TokenDisplay>{hybridFlow.tokens.id_token}</TokenDisplay>
							<ActionRow>
								<Button onClick={() => handleCopy(hybridFlow.tokens!.id_token!, 'ID Token')}>
									<FiCopy /> Copy
								</Button>
								<Button onClick={navigateToTokenManagementWithIdToken} $variant="outline">
									<FiExternalLink /> Decode ID Token
								</Button>
							</ActionRow>
						</div>
					)}

					{hybridFlow.tokens?.refresh_token && (
						<div style={{ marginTop: '1rem' }}>
							<ParameterLabel>Refresh Token</ParameterLabel>
							<TokenDisplay>{hybridFlow.tokens.refresh_token}</TokenDisplay>
							<Button
								onClick={() => handleCopy(hybridFlow.tokens!.refresh_token!, 'Refresh Token')}
								style={{ marginTop: '0.5rem' }}
							>
								<FiCopy /> Copy Refresh Token
							</Button>
						</div>
					)}
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderCompletion = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('complete')}
				aria-expanded={!collapsedSections.complete}
			>
				<CollapsibleTitle>
					<FiCheckCircle /> Flow Complete
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.complete}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.complete && (
				<CollapsibleContent>
					<InfoBox $variant="success">
						<FiCheckCircle size={20} />
						<div>
							<InfoTitle>Hybrid Flow Completed Successfully!</InfoTitle>
							<InfoText>
								You've successfully completed the OIDC Hybrid Flow and received all tokens.
							</InfoText>
						</div>
					</InfoBox>

					<div style={{ marginTop: '1.5rem' }}>
						<strong>Next Steps:</strong>
						<InfoList>
							<li>Analyze tokens in Token Management</li>
							<li>Test token introspection</li>
							<li>Try different response types</li>
							<li>Implement in your application</li>
						</InfoList>
					</div>

					<ActionRow>
						<Button onClick={navigateToTokenManagement}>
							<FiExternalLink /> Go to Token Management
						</Button>
						<Button
							onClick={() => {
								hybridFlow.reset();
								setCurrentStep(0);
							}}
							$variant="outline"
						>
							<FiRefreshCw /> Start Over
						</Button>
					</ActionRow>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	// Step validation functions
	const isStepValid = useCallback((stepIndex: number): boolean => {
		switch (stepIndex) {
			case 0: // Step 0: Introduction & Setup
				return true; // Always valid - introduction step
			case 1: // Step 1: Authorization Request
				return !!(environmentId && clientId);
			case 2: // Step 2: Process Response
				return !!(hybridFlow.tokens);
			case 3: // Step 3: Token Exchange
				return !!(hybridFlow.tokens);
			case 4: // Step 4: Tokens Received
				return !!(hybridFlow.tokens);
			default:
				return false;
		}
	}, [environmentId, clientId, hybridFlow.tokens]);


	const canNavigateNext = useCallback((): boolean => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="hybrid-v5" />
				<FlowInfoCard flowInfo={getFlowInfo('hybrid')!} />
				<FlowSequenceDisplay flowType="hybrid" />

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
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
				onNext={() => setCurrentStep(Math.min(STEP_METADATA.length - 1, currentStep + 1))}
				onReset={() => {
					hybridFlow.reset();
					setCurrentStep(0);
				}}
				canNavigateNext={canNavigateNext()}
				isFirstStep={currentStep === 0}
			/>
		</Container>
	);
};

export default OIDCHybridFlowV5;
