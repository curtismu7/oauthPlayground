// src/pages/flows/OIDCHybridFlowV5.tsx
// V5.0.0 OIDC Hybrid Flow - Full parity with Authorization Code Flow V5
// Supports: code id_token, code token, code id_token token

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiZap,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
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
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService'
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';;
import { FlowHeader } from '../../services/flowHeaderService';
import ResponseModeSelector from '../../components/ResponseModeSelector';
import { ResponseMode } from '../../services/responseModeService';
import EnvironmentIdInput from '../../components/EnvironmentIdInput';
import UltimateTokenDisplay from '../../components/UltimateTokenDisplay';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import { FlowStepService, type StepConfig } from '../../services/flowStepService';

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
	{ title: 'Step 6: Flow Summary', subtitle: 'Comprehensive completion overview' },
] as const;

type IntroSectionKey =
	| 'overview'
	| 'flowDiagram'
	| 'credentials'
	| 'configuration'
	| 'responseMode'
	| 'authRequest'
	| 'response'
	| 'exchange'
	| 'tokens'
	| 'complete'
	| 'flowSummary';

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

const StepHeader = styled.div`
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
`;

const StepTitle = styled.h2`
	margin: 0 0 0.5rem 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: #1e293b;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StepDescription = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 1rem;
	line-height: 1.5;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	margin-bottom: 2rem;
`;

const StepContent = styled.div`
	padding: 2rem;
	background-color: #ffffff;
	border-radius: 0 0 1rem 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	border-top: none;
`;

// [REMOVED] Local collapsible styled component

// [REMOVED] Local collapsible styled component

// [REMOVED] Local collapsible styled component

// [REMOVED] Local collapsible styled component

// [REMOVED] Local collapsible styled component

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
		responseMode: false, // Response mode configuration
		authRequest: false,
		response: false,
		exchange: false,
		tokens: false,
		complete: false,
		flowSummary: false, // New Flow Completion Service step
	});

	// Initialize FlowStepService for better step management
	const stepConfigs: StepConfig[] = STEP_METADATA.map((step, index) => ({
		stepIndex: index,
		title: step.title,
		subtitle: step.subtitle,
		content: FlowStepService.createStepContent('hybrid', index, hybridFlow, 'blue'),
		validation: {
			isStepValid: (stepIndex: number) => {
				switch (stepIndex) {
					case 0: return !!hybridFlow.credentials?.environmentId && !!hybridFlow.credentials?.clientId;
					case 1: return !!hybridFlow.authorizationUrl;
					case 2: return !!hybridFlow.tokens || !!hybridFlow.error;
					case 3: return !!hybridFlow.tokens;
					case 4: return !!hybridFlow.tokens;
					case 5: return true;
					case 6: return true;
					default: return false;
				}
			},
			getStepRequirements: (stepIndex: number) => {
				switch (stepIndex) {
					case 0: return ['Valid environment ID', 'Client ID', 'Redirect URI'];
					case 1: return ['Complete step 0', 'Valid credentials'];
					case 2: return ['Authorization URL generated', 'User authorization'];
					case 3: return ['Authorization code received'];
					case 4: return ['Tokens received'];
					case 5: return ['Flow completed'];
					case 6: return ['All previous steps completed'];
					default: return [];
				}
			},
		},
		requirements: [],
	}));

	usePageScroll();

	// Handle OAuth callback from PingOne redirect (URL parameters)
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const authCode = urlParams.get('code');
		const idToken = urlParams.get('id_token');
		const accessToken = urlParams.get('access_token');
		const state = urlParams.get('state');
		const error = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');

		// Only process if we have OAuth callback parameters
		if (authCode || error) {
			console.log('🎯 [OIDC-Hybrid-V5] Processing OAuth callback from URL:', {
				hasCode: !!authCode,
				hasIdToken: !!idToken,
				hasAccessToken: !!accessToken,
				hasError: !!error,
				error,
				errorDescription,
			});

			if (error) {
				console.error('❌ [OIDC-Hybrid-V5] Authorization error:', error, errorDescription);
				v4ToastManager.showError(`Authorization failed: ${errorDescription || error}`);
				
				// Clear URL parameters
				window.history.replaceState({}, '', window.location.pathname);
				return;
			}

			if (authCode) {
				console.log('✅ [OIDC-Hybrid-V5] Authorization code received from URL');
				
				// Create tokens object with what we received
				const tokens: {
					code: string;
					state: string | null;
					id_token?: string;
					access_token?: string;
				} = {
					code: authCode,
					state: state,
				};

				// Add ID token if present (from fragment)
				if (idToken) {
					tokens.id_token = idToken;
					console.log('🎫 [OIDC-Hybrid-V5] ID token received from fragment');
				}

				// Add access token if present (from fragment)
				if (accessToken) {
					tokens.access_token = accessToken;
					console.log('🔑 [OIDC-Hybrid-V5] Access token received from fragment');
				}

				// Set the tokens in the hybrid flow
				hybridFlow.setTokens(tokens);
				
				// Auto-advance to step 2 (process response)
				setCurrentStep(2);
				
				v4ToastManager.showSuccess('🎉 Authorization successful! Ready for token exchange.');
				
				// Clear URL parameters
				window.history.replaceState({}, '', window.location.pathname);
			}
		}
	}, [hybridFlow]);

	// Scroll to top when step changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [currentStep]);

	// Form state
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopes, setScopes] = useState('openid profile email');
	const [responseType] = useState<
		'code id_token' | 'code token' | 'code id_token token'
	>('code id_token');
	const [responseMode, setResponseMode] = useState<ResponseMode>('fragment');

	// Update credentials when response mode changes
	useEffect(() => {
		if (hybridFlow.credentials) {
			hybridFlow.setCredentials({
				...hybridFlow.credentials,
				responseMode,
			});
		}
	}, [responseMode, hybridFlow]);

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

	const handleClientIdChange = useCallback((newClientId: string) => {
		setClientId(newClientId);
		// Auto-save credentials if we have both environmentId and clientId
		if (environmentId && newClientId && environmentId.trim() && newClientId.trim()) {
			hybridFlow.setCredentials({
				environmentId,
				clientId: newClientId,
				clientSecret,
				scopes,
				responseType,
				responseMode,
			});
			v4ToastManager.showSuccess('Credentials auto-saved');
		}
	}, [environmentId, clientSecret, scopes, responseType, responseMode, hybridFlow]);

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

	const handleGenerateUrl = useCallback(() => {
		try {
			hybridFlow.generateAuthorizationUrl();
			log.info('Authorization URL generated');
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
				case 6:
					return renderFlowSummary();
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
			<CollapsibleHeader
					title="OIDC Hybrid Flow Overview"
					icon={<FiInfo />}
					defaultCollapsed={false}
				>
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
				</CollapsibleHeader>

			<CollapsibleHeader
					title="Configure Credentials"
					icon={<FiKey />}
					defaultCollapsed={false}
				>
					<EnvironmentIdInput
							initialEnvironmentId={environmentId}
							onEnvironmentIdChange={(newEnvId) => {
								setEnvironmentId(newEnvId);
								// Auto-save credentials if we have both environmentId and clientId
								if (newEnvId && clientId && newEnvId.trim() && clientId.trim()) {
									hybridFlow.setCredentials({
										environmentId: newEnvId,
										clientId,
										clientSecret,
										scopes,
										responseType,
										responseMode,
									});
									v4ToastManager.showSuccess('Credentials auto-saved after environment ID change');
								}
							}}
							onIssuerUrlChange={() => {}}
							onDiscoveryComplete={async (result) => {
								if (result.success && result.document) {
									console.log('🎯 [OIDCHybrid] OIDC Discovery completed successfully');
									// Auto-populate environment ID if it's a PingOne issuer
									const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
									if (envId) {
										setEnvironmentId(envId);
										// Auto-save credentials if we have both environmentId and clientId
										if (clientId?.trim()) {
											hybridFlow.setCredentials({
												environmentId: envId,
												clientId,
												clientSecret,
												scopes,
												responseType,
												responseMode,
											});
											v4ToastManager.showSuccess('Configuration auto-saved after OIDC discovery');
										}
									}
								}
							}}
							showSuggestions={true}
							autoDiscover={false}
						/>
						
						<SectionDivider />
						
						<CredentialsInput
							environmentId={environmentId}
							clientId={clientId}
							clientSecret={clientSecret}
							scopes={scopes}
							onEnvironmentIdChange={setEnvironmentId}
							onClientIdChange={handleClientIdChange}
							onClientSecretChange={(newClientSecret) => {
								setClientSecret(newClientSecret);
								// Auto-save credentials if we have environmentId, clientId, and now clientSecret
								if (environmentId?.trim() && clientId?.trim() && newClientSecret?.trim()) {
									hybridFlow.setCredentials({
										environmentId,
										clientId,
										clientSecret: newClientSecret,
										scopes,
										responseType,
										responseMode,
									});
									v4ToastManager.showSuccess('Configuration auto-saved after client secret change');
								}
							}}
							onScopesChange={setScopes}
							onCopy={handleCopy}
							showRedirectUri={false}
							showLoginHint={false}
						/>

						<SectionDivider />
						
						<FlowConfigurationRequirements flowType="hybrid" variant="oidc" />

						<SectionDivider />
				</CollapsibleHeader>

			<CollapsibleHeader
					title="Hybrid Flow Sequence"
					icon={<FiZap />}
					defaultCollapsed={true}
				>
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
				</CollapsibleHeader>
		</>
	);

	const renderAuthorizationRequest = () => (
		<>
			<StepHeader>
				<StepTitle>
					<FiExternalLink /> Step 2: Generate Authorization URL
				</StepTitle>
				<StepDescription>
					Configure response mode and generate the authorization URL to redirect users to PingOne for authentication.
				</StepDescription>
			</StepHeader>

			<CollapsibleHeader
					title="Response Mode Configuration"
					icon={<FiSettings />}
					defaultCollapsed={true}
				>
					<InfoBox>
							<FiInfo size={20} />
							<div>
								<InfoText>
									Choose how the authorization response should be returned. This affects security and user experience.
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
				</CollapsibleHeader>

			<CollapsibleHeader
					title="Authorization Request"
					icon={<FiExternalLink />}
					defaultCollapsed={true}
				>
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
							<ParameterLabel>Response Mode</ParameterLabel>
							<ParameterValue>{responseMode}</ParameterValue>
							<ParameterLabel>Scopes</ParameterLabel>
							<ParameterValue>{scopes}</ParameterValue>
						</ParameterGrid>

						{hybridFlow.authorizationUrl && (
							<ColoredUrlDisplay
								url={hybridFlow.authorizationUrl}
								label="Generated Authorization URL"
								showCopyButton={true}
								showInfoButton={true}
								showOpenButton={true}
								onOpen={() => window.open(hybridFlow.authorizationUrl!, '_blank')}
								height="120px"
							/>
						)}

						<ActionRow>
							<Button
								onClick={handleGenerateUrl}
								disabled={!environmentId || !clientId}
								$variant="outline"
							>
								<FiRefreshCw /> Generate URL
							</Button>
							<Button
								onClick={handleStartAuthorization}
								disabled={!environmentId || !clientId || !hybridFlow.authorizationUrl}
								$variant="primary"
							>
								<FiExternalLink /> Start Authorization
							</Button>
						</ActionRow>
				</CollapsibleHeader>
		</>
	);

	const renderProcessResponse = () => (
		<CollapsibleHeader
					title="Process Response"
					icon={<FiCheckCircle />}
					defaultCollapsed={true}
				>
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
									<InfoText>
										You can now close this tab and return to the PingOne authorization flow.
									</InfoText>
								</div>
							</InfoBox>

							{hybridFlow.tokens.id_token && (
								<div style={{ marginTop: '1rem' }}>
									<UltimateTokenDisplay
										tokens={{ id_token: hybridFlow.tokens.id_token }}
										flowType="oidc"
										flowKey="hybrid-flow-v5-fragment"
										displayMode="compact"
										title="ID Token (from fragment)"
										subtitle="Identity token received in URL fragment"
										showCopyButtons={true}
										showDecodeButtons={true}
										showMaskToggle={true}
										showTokenManagement={true}
										defaultMasked={false}
									/>
								</div>
							)}

							{hybridFlow.tokens.access_token && (
								<div style={{ marginTop: '1rem' }}>
									<UltimateTokenDisplay
										tokens={{ 
											access_token: hybridFlow.tokens.access_token,
											...(hybridFlow.tokens.scope && { scope: String(hybridFlow.tokens.scope) }),
											...(hybridFlow.tokens.expires_in && { expires_in: hybridFlow.tokens.expires_in })
										}}
										flowType="oidc"
										flowKey="hybrid-flow-v5-fragment-access"
										displayMode="compact"
										title="Access Token (from fragment)"
										subtitle="Access token received in URL fragment"
										showCopyButtons={true}
										showDecodeButtons={true}
										showMaskToggle={true}
										showTokenManagement={true}
										defaultMasked={false}
									/>
									<ActionRow>
										<Button onClick={navigateToTokenManagement} $variant="outline">
											<FiExternalLink /> Decode Access Token
										</Button>
									</ActionRow>
								</div>
							)}

							{hybridFlow.tokens.code && (
								<div style={{ marginTop: '1rem' }}>
									<UltimateTokenDisplay
										tokens={{ code: hybridFlow.tokens.code }}
										flowType="oidc"
										flowKey="hybrid-flow-v5-code"
										displayMode="compact"
										title="Authorization Code"
										subtitle="Authorization code received in URL fragment"
										showCopyButtons={true}
										showDecodeButtons={true}
										showMaskToggle={true}
										showTokenManagement={true}
										defaultMasked={false}
									/>
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
				</CollapsibleHeader>
	);

	const renderTokenExchange = () => (
		<CollapsibleHeader
					title="Token Exchange"
					icon={<FiRefreshCw />}
					defaultCollapsed={true}
				>
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
				</CollapsibleHeader>
	);

	const renderTokensReceived = () => (
		<CollapsibleHeader
					title="Tokens Received"
					icon={<FiKey />}
					defaultCollapsed={true}
				>
					<InfoBox $variant="success">
						<FiCheckCircle size={20} />
						<div>
							<InfoTitle>All Tokens Received!</InfoTitle>
							<InfoText>
								You now have all tokens from both the authorization endpoint and token endpoint.
							</InfoText>
						</div>
					</InfoBox>

					{(hybridFlow.tokens?.access_token || hybridFlow.tokens?.id_token || hybridFlow.tokens?.refresh_token) && (
						<div style={{ marginTop: '1rem' }}>
							<UltimateTokenDisplay
								tokens={{
									...(hybridFlow.tokens.access_token && { access_token: hybridFlow.tokens.access_token }),
									...(hybridFlow.tokens.id_token && { id_token: hybridFlow.tokens.id_token }),
									...(hybridFlow.tokens.refresh_token && { refresh_token: hybridFlow.tokens.refresh_token }),
									...(hybridFlow.tokens.scope && { scope: String(hybridFlow.tokens.scope) }),
									...(hybridFlow.tokens.expires_in && { expires_in: hybridFlow.tokens.expires_in })
								}}
								flowType="oidc"
								flowKey="hybrid-flow-v5-tokens"
								displayMode="detailed"
								title="OIDC Hybrid Flow Tokens"
								subtitle="Complete token set from authorization code exchange"
								showCopyButtons={true}
								showDecodeButtons={true}
								showMaskToggle={true}
								showTokenManagement={true}
								showMetadata={true}
								defaultMasked={false}
							/>
						</div>
					)}
				</CollapsibleHeader>
	);

	const renderCompletion = () => {
		const completionConfig = {
			...FlowCompletionConfigs.hybrid,
			onStartNewFlow: () => {
				hybridFlow.reset();
				setCurrentStep(0);
			},
			showUserInfo: false,
			showIntrospection: false
		};

		return (
			<FlowCompletionService
				config={completionConfig}
				collapsed={collapsedSections.complete}
				onToggleCollapsed={() => toggleSection('complete')}
			/>
		);
	};

	const renderFlowSummary = () => {
		const completionConfig = {
			...FlowCompletionConfigs.hybrid,
			onStartNewFlow: () => {
				hybridFlow.reset();
				setCurrentStep(0);
			},
			showUserInfo: false,
			showIntrospection: false
		};

		return (
			<FlowCompletionService
				config={completionConfig}
				collapsed={collapsedSections.flowSummary}
				onToggleCollapsed={() => toggleSection('flowSummary')}
			/>
		);
	};

	const canNavigateNext = useCallback((): boolean => {
		const config = stepConfigs.find(c => c.stepIndex === currentStep);
		const isCurrentStepValid = config ? config.validation.isStepValid(currentStep) : false;
		return isCurrentStepValid && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, stepConfigs]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="hybrid-v5" />
				<FlowInfoCard flowInfo={getFlowInfo('hybrid')!} />
				<FlowSequenceDisplay flowType="hybrid" />

				<MainCard>
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
