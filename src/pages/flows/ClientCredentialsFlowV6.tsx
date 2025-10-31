// src/pages/flows/ClientCredentialsFlowV6.tsx
// V6.0.0 OAuth 2.0 Client Credentials Flow - Service-Based Architecture with Modern UI/UX
// Machine-to-machine authentication without user interaction

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiEye,
	FiInfo,
	FiKey,
	FiServer,
	FiShield,
	FiZap,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import {
	ClientAuthMethod,
	ClientCredentialsDefaults,
	ClientCredentialsCollapsibleSections,
	ClientCredentialsEducationalContent,
	ClientCredentialsTokenRequest,
	log
} from '../../services/clientCredentialsSharedService';
import { FlowHeader } from '../../services/flowHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { ConfigurationSummaryService } from '../../services/configurationSummaryService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import { FlowSequenceDisplay } from '../../components/FlowSequenceDisplay';
import { TokenIntrospectionService } from '../../services/tokenIntrospectionService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { ErrorHandlingService } from '../../services/errorHandlingService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import ModalPresentationService from '../../services/modalPresentationService';
import { CredentialGuardService } from '../../services/credentialGuardService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';

const LOG_PREFIX = '[🔑 CLIENT-CREDS-V6]';
const DEFAULT_CLIENT_CREDENTIALS_SCOPES = 'p1:read:user p1:update:user p1:read:device p1:update:device';

// Styled Components
const Container = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const ContentWrapper = styled.div`
	flex: 1;
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
	width: 100%;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
	margin-bottom: 2rem;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

const SectionDivider = styled.div`
	height: 1px;
	background: linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%);
	margin: 2rem 0;
`;

const AuthMethodCard = styled.div<{ $isSelected: boolean; $method: ClientAuthMethod }>`
	padding: 1.5rem;
	border: 2px solid ${props => props.$isSelected ? getAuthMethodColor(props.$method) : '#e2e8f0'};
	border-radius: 0.75rem;
	background: ${props => props.$isSelected ? `${getAuthMethodColor(props.$method)}10` : 'white'};
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		border-color: ${props => getAuthMethodColor(props.$method)};
		background: ${props => `${getAuthMethodColor(props.$method)}05`};
	}
`;

const AuthMethodHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const AuthMethodIcon = styled.div<{ $method: ClientAuthMethod }>`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 0.5rem;
	background: ${props => getAuthMethodColor(props.$method)};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.25rem;
`;

const AuthMethodTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
`;

const AuthMethodDescription = styled.p`
	color: #64748b;
	margin: 0.5rem 0 0 0;
	line-height: 1.5;
`;

const SecurityBadge = styled.span<{ $level: 'high' | 'medium' | 'low' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	background: ${props => {
		switch (props.$level) {
			case 'high': return '#10b98120';
			case 'medium': return '#f59e0b20';
			case 'low': return '#ef444420';
		}
	}};
	color: ${props => {
		switch (props.$level) {
			case 'high': return '#047857';
			case 'medium': return '#d97706';
			case 'low': return '#dc2626';
		}
	}};
	margin-top: 0.5rem;
`;

const BenefitsList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 1rem 0 0 0;
`;

const BenefitItem = styled.li`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #059669;
	font-size: 0.875rem;
	margin-bottom: 0.25rem;
	
	&::before {
		content: '✓';
		font-weight: bold;
	}
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	background: ${props => props.$variant === 'secondary' ? '#10b981' : '#3b82f6'};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover:not(:disabled) {
		background: ${props => props.$variant === 'secondary' ? '#059669' : '#2563eb'};
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

// Helper function to get auth method colors
function getAuthMethodColor(method: ClientAuthMethod): string {
	const colors: Record<ClientAuthMethod, string> = {
		'client_secret_basic': '#3b82f6', // Blue
		'client_secret_post': '#10b981', // Green
		'private_key_jwt': '#8b5cf6', // Purple
		'none': '#6b7280', // Gray
	};
	return colors[method];
}

// Additional styled components for educational content
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
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #14532d;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #ecfdf3 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};

	svg {
		width: 16px;
		height: 16px;
	}
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

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' | 'error' }>`
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#f0fdf4';
			case 'warning':
				return '#fffbeb';
			case 'error':
				return '#fef2f2';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#bbf7d0';
			case 'warning':
				return '#fed7aa';
			case 'error':
				return '#fecaca';
			default:
				return '#dbeafe';
		}
	}};
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	svg {
		flex-shrink: 0;
		margin-top: 0.1rem;
		color: ${({ $variant }) => {
			switch ($variant) {
				case 'success':
					return '#22c55e';
				case 'warning':
					return '#f59e0b';
				case 'error':
					return '#ef4444';
				default:
					return '#3b82f6';
			}
		}};
	}
`;

const InfoTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#14532d';
			case 'warning':
				return '#92400e';
			case 'error':
				return '#dc2626';
			default:
				return '#1e40af';
		}
	}};
`;

const InfoText = styled.p`
	margin: 0;
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#166534';
			case 'warning':
				return '#92400e';
			case 'error':
				return '#dc2626';
			default:
				return '#1e40af';
		}
	}};
	line-height: 1.6;
`;

const StrongText = styled.span`
	font-weight: 600;
`;

const FlowDiagram = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 1.5rem 0;
`;

const FlowStep = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
`;

const FlowStepNumber = styled.div`
	background: #3b82f6;
	color: white;
	border-radius: 50%;
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
	flex-shrink: 0;
`;

const FlowStepContent = styled.div`
	flex: 1;
`;

// Step Metadata
const STEP_METADATA = [
	{
		title: 'Credentials & Configuration',
		subtitle: 'Configure your client credentials and authentication settings',
		description: 'Set up your application credentials for machine-to-machine authentication'
	},
	{
		title: 'Authentication Method Selection',
		subtitle: 'Choose your client authentication method',
		description: 'Select the authentication method that best fits your security requirements'
	},
	{
		title: 'Token Request',
		subtitle: 'Request an access token',
		description: 'Execute the token request using your selected authentication method'
	},
	{
		title: 'Token Analysis',
		subtitle: 'Analyze and manage your access token',
		description: 'View, decode, and validate the received access token'
	},
	{
		title: 'Token Management',
		subtitle: 'Advanced token operations',
		description: 'Introspect, manage, and monitor your access tokens'
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete the client credentials flow',
		description: 'Review the completed flow and explore next steps'
	}
];

interface ClientCredentialsFlowV6Props {
	flowKey?: string;
	flowVersion?: string;
	flowTitle?: string;
	selectedAuthMethod?: ClientAuthMethod;
	onAuthMethodChange?: (method: ClientAuthMethod) => void;
}

const ClientCredentialsFlowV6: React.FC<ClientCredentialsFlowV6Props> = ({
	flowKey = 'client-credentials-v6',
	flowVersion = 'V6',
	flowTitle = 'Client Credentials (V6)',
	selectedAuthMethod: propSelectedAuthMethod,
	onAuthMethodChange: propOnAuthMethodChange
}) => {
	const navigate = useNavigate();
	
	// Initialize page scroll management
	usePageScroll();
	
	// Initialize client credentials flow controller
	const controller = useClientCredentialsFlowController({
		flowKey,
	});

	// Step management
	const [currentStep, setCurrentStep] = useState(0);
	
	// Collapse all sections by default for cleaner UI
	const shouldCollapseAll = true;
	
	// Authentication method
	const [selectedAuthMethod, setSelectedAuthMethod] = useState<ClientAuthMethod>(
		propSelectedAuthMethod || 'client_secret_post'
	);

	// Wrapper function to handle auth method changes
	const handleAuthMethodChange = useCallback((method: ClientAuthMethod) => {
		setSelectedAuthMethod(method);
		if (propOnAuthMethodChange) {
			propOnAuthMethodChange(method);
		}
	}, [propOnAuthMethodChange]);
	
	// Worker token for Config Checker
	const [workerToken, setWorkerToken] = useState<string>('');

	// PingOne Advanced Configuration
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		clientAuthMethod: 'client_secret_post',
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'OPTIONAL',
		responseTypeCode: false,
		responseTypeToken: false,
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
		enableDPoP: false,
		dpopAlgorithm: 'ES256',
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});
	
	// Collapsible sections state
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
		ClientCredentialsCollapsibleSections.getDefaultState()
	);
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);

	// Toggle section handler
	const toggleSection = useCallback(
		ClientCredentialsCollapsibleSections.createToggleHandler(setCollapsedSections),
		[]
	);

	// Load worker token from localStorage on mount
	useEffect(() => {
		const savedToken = localStorage.getItem('worker-token');
		const savedEnv = localStorage.getItem('worker-token-env');
		
		if (savedToken && savedEnv === controller.credentials.environmentId) {
			setWorkerToken(savedToken);
			console.log('[ClientCredentialsFlowV6] Worker token loaded from localStorage');
		}
	}, [controller.credentials.environmentId]);

	// Step validation
	const isStepValid = useCallback((step: number): boolean => {
		switch (step) {
			case 0: // Credentials & Configuration
				return !!(
					controller.credentials.environmentId &&
					controller.credentials.clientId &&
					controller.credentials.clientSecret
				);
			case 1: // Authentication Method Selection
				return !!selectedAuthMethod;
			case 2: // Token Request
				return !!selectedAuthMethod;
			case 3: // Token Analysis
				return !!controller.tokens;
			case 4: // Token Management
				return !!controller.tokens;
			case 5: // Flow Completion
				return !!controller.tokens;
			default:
				return false;
		}
	}, [controller.credentials, controller.tokens, selectedAuthMethod]);

	// Navigation handlers
	const handleNext = useCallback(() => {
		if (currentStep === 0) {
			const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(controller.credentials as any, {
				requiredFields: ['environmentId', 'clientId', 'clientSecret'],
				fieldLabels: {
					environmentId: 'Environment ID',
					clientId: 'Client ID',
					clientSecret: 'Client Secret',
				},
			});

			if (!canProceed) {
				setMissingCredentialFields(missingFields);
				setShowMissingCredentialsModal(true);
				log.warn('Blocked navigation due to missing required credentials', { missingFields });
				return;
			}
		}

		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(currentStep + 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [currentStep, controller.credentials]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		controller.reset();
		setCurrentStep(0);
		setSelectedAuthMethod('client_secret_post');
		setCollapsedSections(ClientCredentialsCollapsibleSections.getDefaultState());
		log.info('Flow reset');
	}, [controller]);

	const handleStartOver = useCallback(() => {
		sessionStorage.removeItem(`${flowKey}-tokens`);
		sessionStorage.removeItem('restore_step');
		controller.clearStepResults?.();
		setCurrentStep(0);
		console.log('🔄 [ClientCredentialsFlowV6] Starting over: cleared tokens, keeping credentials');
		v4ToastManager.showSuccess('Flow restarted', {
			description: 'Tokens cleared. Credentials preserved.',
		});
	}, [controller, flowKey]);

	// Token request handler
	const handleTokenRequest = useCallback(async () => {
		if (!controller.credentials) {
			return;
		}

		try {
			controller.setIsLoading(true);
			const tokens = await ClientCredentialsTokenRequest.executeTokenRequest(
				controller.credentials,
				selectedAuthMethod
			);
			controller.setTokens(tokens);
			log.success('Token request successful', tokens);
		} catch (error) {
			// Use ErrorHandlingService for comprehensive error handling
			const errorResponse = ErrorHandlingService.handleFlowError(error, {
				flowId: flowKey,
				stepId: 'token-request',
				metadata: {
					authMethod: selectedAuthMethod,
					clientId: controller.credentials.clientId,
					environmentId: controller.credentials?.environmentId
				}
			});

			// Show user-friendly error message
			v4ToastManager.showError(errorResponse.userMessage);

			// Log technical details for debugging
			console.error('[ClientCredentialsFlowV6] Token request failed:', {
				error: errorResponse.technicalMessage,
				correlationId: errorResponse.correlationId,
				recoveryOptions: errorResponse.recoveryOptions.length
			});

			// The ErrorHandlingService already handled logging and reporting
			log.error('Token request failed', error);
		} finally {
			controller.setIsLoading(false);
		}
	}, [controller, selectedAuthMethod]);

	// Wrapper to enforce openid scope (required by PingOne)
	const handleCredentialsChange = useCallback((newCredentials: typeof controller.credentials) => {
		const trimmedScopes = newCredentials.scopes?.trim() || '';
		const isClientCredentialsV7 = flowKey === 'client-credentials-v7';

		if (isClientCredentialsV7) {
			if (!trimmedScopes) {
				newCredentials.scopes = DEFAULT_CLIENT_CREDENTIALS_SCOPES;
				newCredentials.scope = DEFAULT_CLIENT_CREDENTIALS_SCOPES;
				v4ToastManager.showWarning('Added default admin scopes required for PingOne client credentials');
			}
		} else if (newCredentials.scopes) {
			const scopes = newCredentials.scopes.split(/\s+/).filter(s => s.length > 0);
			if (!scopes.includes('openid')) {
				scopes.unshift('openid');
				newCredentials.scopes = scopes.join(' ');
				v4ToastManager.showWarning('Added required "openid" scope for PingOne compatibility');
			}
		}

		controller.setCredentials(newCredentials);
	}, [controller, flowKey]);

	// Render step content
	const renderStepContent = useCallback((step: number) => {
		switch (step) {
			case 0:
				return renderCredentialsConfiguration();
			case 1:
				return renderAuthMethodSelection();
			case 2:
				return renderTokenRequest();
			case 3:
				return renderTokenAnalysis();
			case 4:
				return renderTokenManagement();
			case 5:
				return renderFlowCompletion();
			default:
				return <div>Invalid step</div>;
		}
	}, [controller, collapsedSections, toggleSection, selectedAuthMethod]);

	// Step 0: Credentials & Configuration
	const renderCredentialsConfiguration = () => {
		return (
			<div>
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('overview')}
						aria-expanded={!collapsedSections.overview}
					>
						<CollapsibleTitle>
							<FiInfo /> Client Credentials Flow Overview
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.overview && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiServer size={20} />
								<div>
									<InfoTitle>What is the Client Credentials Flow?</InfoTitle>
									<InfoText>
										The Client Credentials flow is used for server-to-server authentication
										where the client application acts on its own behalf rather than on behalf
										of a user. This is ideal for background processes, API integrations, and
										service-to-service communication.
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Perfect for Machine-to-Machine</InfoTitle>
									<InfoText>
										Unlike user-facing flows that require user interaction and consent,
										Client Credentials flow is designed for trusted applications that need
										to authenticate directly with the authorization server.
									</InfoText>
								</div>
							</InfoBox>

							<FlowDiagram>
								{[
									'Client application requests access token using its credentials',
									'Authorization server validates client credentials',
									'Access token issued for API access',
									'Client uses token to call protected APIs',
								].map((description, index) => (
									<FlowStep key={description}>
										<FlowStepNumber>{index + 1}</FlowStepNumber>
										<FlowStepContent>
											<StrongText>{description}</StrongText>
										</FlowStepContent>
									</FlowStep>
								))}
							</FlowDiagram>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Security Considerations</InfoTitle>
									<InfoText>
										Client credentials must be stored securely and never exposed in client-side
										code. Use environment variables, secure vaults, or managed identity systems.
									</InfoText>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<SectionDivider />

			<ComprehensiveCredentialsService
				flowType="client-credentials-v6"
				
				// Discovery props
				onDiscoveryComplete={(result) => {
					console.log('[Client Creds V6] Discovery completed:', result);
					// Extract environment ID from issuer URL if available
					if (result.issuerUrl) {
						const envIdMatch = result.issuerUrl.match(/\/([a-f0-9-]{36})\//i);
						if (envIdMatch && envIdMatch[1]) {
							controller.setCredentials({
								...controller.credentials,
								environmentId: envIdMatch[1],
							});
							v4ToastManager.showSuccess('Environment ID extracted from discovery');
						}
					}
				}}
				discoveryPlaceholder="Enter Environment ID, issuer URL, or provider..."
				showProviderInfo={true}
				
				// Credentials props
				environmentId={controller.credentials.environmentId || ''}
				clientId={controller.credentials.clientId || ''}
				clientSecret={controller.credentials.clientSecret || ''}
				scopes={controller.credentials.scopes || controller.credentials.scope || 'openid'}
				
				// Change handlers
				onEnvironmentIdChange={(value) => {
					controller.setCredentials({
						...controller.credentials,
						environmentId: value,
					});
				}}
				onClientIdChange={(value) => {
					controller.setCredentials({
						...controller.credentials,
						clientId: value,
					});
				}}
				onClientSecretChange={(value) => {
					controller.setCredentials({
						...controller.credentials,
						clientSecret: value,
					});
				}}
				onScopesChange={(value) => {
					controller.setCredentials({
						...controller.credentials,
						scopes: value,
						scope: value,
					});
				}}
				
				// Save handlers
				onSave={controller.saveCredentials}
				hasUnsavedChanges={controller.hasUnsavedCredentialChanges}
				isSaving={controller.isSavingCredentials}
				
				// Field visibility
				requireClientSecret={true}
				showRedirectUri={false}
				showPostLogoutRedirectUri={false}
				showLoginHint={false}
				
				// Display config
				title="Client Credentials Configuration"
				subtitle="Configure environment, client ID, client secret, and scopes"
				defaultCollapsed={shouldCollapseAll}
				
				// PingOne Advanced Configuration
				pingOneAppState={pingOneConfig}
				onPingOneAppStateChange={setPingOneConfig}
				onPingOneSave={() => {
					console.log('[Client Creds V6] PingOne config saved:', pingOneConfig);
					v4ToastManager.showSuccess('PingOne configuration saved successfully!');
				}}
				hasUnsavedPingOneChanges={false}
				isSavingPingOne={false}

				// Config Checker
				showConfigChecker={true}
				workerToken={workerToken}
				region={'NA'}
			/>
				
				<SectionDivider />
			</div>
		);
	};

	// Step 1: Authentication Method Selection
	const renderAuthMethodSelection = () => {
		const supportedMethods = ClientCredentialsDefaults.getSupportedAuthMethods();
		
		return (
			<div>
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('authMethods')}
						aria-expanded={!collapsedSections.authMethods}
					>
						<CollapsibleTitle>
							<FiKey /> Client Authentication Methods
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.authMethods}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.authMethods && (
						<CollapsibleContent>
							<InfoBox $variant="info">
								<FiShield size={20} />
								<div>
									<InfoTitle>Choose Your Authentication Method</InfoTitle>
									<InfoText>
										Select the authentication method that best fits your security requirements and
										infrastructure capabilities.
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="success">
								<FiCheckCircle size={20} />
								<div>
									<InfoTitle>Security & Compatibility</InfoTitle>
									<InfoText>
										All methods are secure and fully compatible with PingOne. Choose based on your
										security requirements and implementation constraints.
									</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Security Considerations</InfoTitle>
									<InfoText>
										Store client secrets securely and never expose them in client-side code.
										Use environment variables, secure vaults, or managed identity systems.
									</InfoText>
								</div>
							</InfoBox>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
					{supportedMethods.map((method) => {
						const config = ClientCredentialsDefaults.getAuthMethodConfig(method);
						const isSelected = selectedAuthMethod === method;
						
						return (
							<AuthMethodCard
								key={method}
								$isSelected={isSelected}
								$method={method}
								onClick={() => handleAuthMethodChange(method)}
							>
								<AuthMethodHeader>
									<AuthMethodIcon $method={method}>
										{method === 'client_secret_basic' && <FiShield />}
										{method === 'client_secret_post' && <FiKey />}
										{method === 'private_key_jwt' && <FiZap />}
										{method === 'none' && <FiInfo />}
									</AuthMethodIcon>
									<div>
										<AuthMethodTitle>{config.authMethod.replace(/_/g, ' ').toUpperCase()}</AuthMethodTitle>
										<SecurityBadge $level={config.securityLevel}>
											{config.securityLevel} Security
										</SecurityBadge>
									</div>
								</AuthMethodHeader>
								
								<AuthMethodDescription>{config.description}</AuthMethodDescription>
								
								<BenefitsList>
									{config.useCases.map((useCase, index) => (
										<BenefitItem key={index}>{useCase}</BenefitItem>
									))}
								</BenefitsList>
							</AuthMethodCard>
						);
					})}
				</div>
			</div>
		);
	};

	// Step 2: Token Request
	const renderTokenRequest = () => {
		const config = ClientCredentialsDefaults.getAuthMethodConfig(selectedAuthMethod);

		return (
			<div>
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
							<InfoBox $variant="info">
								<FiZap size={20} />
								<div>
									<InfoTitle>Request an Access Token</InfoTitle>
									<InfoText>
										Execute a token request using {config.authMethod.replace(/_/g, ' ')} authentication
										to obtain an access token for API access.
									</InfoText>
								</div>
							</InfoBox>

							<FlowDiagram>
								{[
									'Send POST request to token endpoint',
									'Include client authentication credentials',
									'Specify grant_type=client_credentials',
									'Receive access token in response',
								].map((description, index) => (
									<FlowStep key={description}>
										<FlowStepNumber>{index + 1}</FlowStepNumber>
										<FlowStepContent>
											<StrongText>{description}</StrongText>
										</FlowStepContent>
									</FlowStep>
								))}
							</FlowDiagram>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				<div style={{ marginTop: '2rem' }}>
					<ActionButton
						onClick={handleTokenRequest}
						disabled={!controller.hasValidCredentials || controller.isLoading}
					>
						{controller.isLoading ? 'Requesting Token...' : 'Request Access Token'}
					</ActionButton>
					
					{controller.tokens && (
						<div style={{ marginTop: '2rem' }}>
							<EnhancedApiCallDisplayService
								title="Token Request Successful"
								apiCall={{
									method: 'POST',
									url: controller.credentials?.tokenEndpoint || '/oauth2/token',
									headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
									body: { grant_type: 'client_credentials' },
									timestamp: Date.now(),
									flowType: 'client-credentials-v6',
								}}
								collapsed={false}
								onToggleCollapsed={() => {}}
							/>
						</div>
					)}
				</div>
			</div>
		);
	};

	// Step 3: Token Analysis
	const renderTokenAnalysis = () => (
		<div>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tokenAnalysis')}
					aria-expanded={!collapsedSections.tokenAnalysis}
				>
					<CollapsibleTitle>
						<FiEye /> Token Analysis
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tokenAnalysis}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tokenAnalysis && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiEye size={20} />
							<div>
								<InfoTitle>Analyze Your Access Token</InfoTitle>
								<InfoText>
									View, decode, and validate the received access token to understand its contents
									and ensure it meets your requirements.
								</InfoText>
							</div>
						</InfoBox>

						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Token Validation</InfoTitle>
								<InfoText>
									Verify token expiration, scope, audience, and other claims to ensure the token
									is valid and appropriate for your use case.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{controller.tokens && (
				<div style={{ marginTop: '2rem' }}>
					{UnifiedTokenDisplayService.showTokens(
						controller.tokens,
						'oauth',
						'client-credentials-v6',
						{
							showCopyButtons: true,
							showDecodeButtons: true,
						}
					)}
				</div>
			)}
		</div>
	);

	// Step 4: Token Management
	const renderTokenManagement = () => (
		<div>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tokenIntrospection')}
					aria-expanded={!collapsedSections.tokenIntrospection}
				>
					<CollapsibleTitle>
						<FiShield /> Token Management
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tokenIntrospection}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tokenIntrospection && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiShield size={20} />
							<div>
								<InfoTitle>Advanced Token Operations</InfoTitle>
								<InfoText>
									Introspect, manage, and monitor your access tokens to ensure proper security
									and lifecycle management.
								</InfoText>
							</div>
						</InfoBox>

						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Token Security</InfoTitle>
								<InfoText>
									Monitor token usage, validate claims, and revoke tokens when necessary to
									maintain security and compliance.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{controller.tokens && (
				<div style={{ marginTop: '2rem' }}>
					{UnifiedTokenDisplayService.showTokens(
						controller.tokens,
						'oauth',
						'client-credentials-v6-management',
						{
							showCopyButtons: true,
							showDecodeButtons: true,
						}
					)}
					
					<SectionDivider />
					
					<TokenIntrospectionService
						tokens={controller.tokens}
						flowType="client-credentials-v6"
						collapsed={collapsedSections.introspectionDetails}
						onToggleCollapsed={() => toggleSection('introspectionDetails')}
					/>
				</div>
			)}
		</div>
	);

	// Step 5: Flow Completion
	const renderFlowCompletion = () => {
		const completionConfig = {
			...FlowCompletionConfigs.clientCredentials,
			onStartNewFlow: () => {
				controller.reset();
				setCurrentStep(0);
			},
			showUserInfo: false,
			showIntrospection: false
		};

		return (
			<FlowCompletionService
				config={{
					...completionConfig,
					flowName: flowTitle,
				}}
				collapsed={collapsedSections.flowSummary}
				onToggleCollapsed={() => toggleSection('flowSummary')}
			/>
		);
	};

	// Navigation validation
	const canNavigateNext = useCallback((): boolean => {
		return isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, isStepValid]);

	// Component mount logging
	useEffect(() => {
		log.success('Component loaded', {
			url: window.location.href,
			timestamp: new Date().toISOString(),
		});
	}, []);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId={flowKey} customConfig={{ title: flowTitle, version: flowVersion }} />
			
			<FlowSequenceDisplay flowType="client-credentials" />
				
				<MainCard>
					<StepContent>{renderStepContent(currentStep)}</StepContent>
				</MainCard>
			</ContentWrapper>

			<StepNavigationButtons
				currentStep={currentStep}
				totalSteps={STEP_METADATA.length}
				onPrevious={handlePrevious}
				onNext={handleNext}
				onReset={handleReset}
				onStartOver={handleStartOver}
				canNavigateNext={canNavigateNext()}
				isFirstStep={currentStep === 0}
			/>

			<ModalPresentationService
				isOpen={showMissingCredentialsModal}
				onClose={() => setShowMissingCredentialsModal(false)}
				title="Credentials required"
				description={
					missingCredentialFields.length > 0
						? `Please provide the following required credential${missingCredentialFields.length > 1 ? 's' : ''} before continuing:`
						: 'Environment ID, Client ID, and Client Secret are required before moving to the next step.'
				}
				actions={[
					{
						label: 'Back to credentials',
						onClick: () => setShowMissingCredentialsModal(false),
						variant: 'primary',
					},
				]}
			>
				{missingCredentialFields.length > 0 && (
					<ul style={{ marginTop: '1rem', marginBottom: '1rem', paddingLeft: '1.5rem' }}>
						{missingCredentialFields.map((field) => (
							<li key={field} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{field}</li>
						))}
					</ul>
				)}
			</ModalPresentationService>
		</Container>
	);
};

export default ClientCredentialsFlowV6;
