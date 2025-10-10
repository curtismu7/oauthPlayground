// src/pages/flows/ClientCredentialsFlowV6.tsx
// V6.0.0 OAuth 2.0 Client Credentials Flow - Service-Based Architecture with Modern UI/UX
// Machine-to-machine authentication without user interaction

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiCheckCircle,
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
import { TokenIntrospectionService } from '../../services/tokenIntrospectionService';
import { UISettingsService } from '../../services/uiSettingsService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import { EducationalContentService } from '../../services/educationalContentService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';

const LOG_PREFIX = '[🔑 CLIENT-CREDS-V6]';

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

const AuthMethodCard = styled.div<{ isSelected: boolean; method: ClientAuthMethod }>`
	padding: 1.5rem;
	border: 2px solid ${props => props.isSelected ? getAuthMethodColor(props.method) : '#e2e8f0'};
	border-radius: 0.75rem;
	background: ${props => props.isSelected ? `${getAuthMethodColor(props.method)}10` : 'white'};
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		border-color: ${props => getAuthMethodColor(props.method)};
		background: ${props => `${getAuthMethodColor(props.method)}05`};
	}
`;

const AuthMethodHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const AuthMethodIcon = styled.div<{ method: ClientAuthMethod }>`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 0.5rem;
	background: ${props => getAuthMethodColor(props.method)};
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

const SecurityBadge = styled.span<{ level: 'high' | 'medium' | 'low' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	background: ${props => {
		switch (props.level) {
			case 'high': return '#10b98120';
			case 'medium': return '#f59e0b20';
			case 'low': return '#ef444420';
		}
	}};
	color: ${props => {
		switch (props.level) {
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	background: ${props => props.variant === 'secondary' ? '#10b981' : '#3b82f6'};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover:not(:disabled) {
		background: ${props => props.variant === 'secondary' ? '#059669' : '#2563eb'};
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

const ClientCredentialsFlowV6: React.FC = () => {
	const navigate = useNavigate();
	
	// Initialize page scroll management
	usePageScroll();
	
	// Initialize client credentials flow controller
	const controller = useClientCredentialsFlowController({
		flowKey: 'client-credentials-v6',
	});

	// Step management
	const [currentStep, setCurrentStep] = useState(0);
	
	// Authentication method
	const [selectedAuthMethod, setSelectedAuthMethod] = useState<ClientAuthMethod>('client_secret_post');
	
	// PingOne Advanced Configuration
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		applicationName: '',
		applicationType: 'service',
		redirectUris: [],
		postLogoutRedirectUris: [],
		allowedScopes: [],
		clientAuthMethods: ['client_secret_post'],
		additionalSettings: {}
	});
	
	// Collapsible sections state
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
		ClientCredentialsCollapsibleSections.getDefaultState()
	);

	// Toggle section handler
	const toggleSection = useCallback(
		ClientCredentialsCollapsibleSections.createToggleHandler(setCollapsedSections),
		[]
	);

	// Step validation
	const isStepValid = useCallback((step: number): boolean => {
		switch (step) {
			case 0: // Credentials & Configuration
				return controller.hasValidCredentials;
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
	}, [controller, selectedAuthMethod]);

	// Navigation handlers
	const handleNext = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep(currentStep + 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [currentStep]);

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
			const errorMsg = error instanceof Error ? error.message : 'Failed to request tokens';
			controller.setError(errorMsg);
			log.error('Token request failed', error);
		} finally {
			controller.setIsLoading(false);
		}
	}, [controller, selectedAuthMethod]);

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
		// Wrapper to enforce openid scope (required by PingOne)
		const handleCredentialsChange = useCallback((newCredentials: typeof controller.credentials) => {
			// Ensure openid is always included in scopes
			if (newCredentials.scopes) {
				const scopes = newCredentials.scopes.split(/\s+/).filter(s => s.length > 0);
				if (!scopes.includes('openid')) {
					scopes.unshift('openid');
					newCredentials.scopes = scopes.join(' ');
					v4ToastManager.showWarning('Added required "openid" scope for PingOne compatibility');
				}
			}
			controller.setCredentials(newCredentials);
		}, [controller]);

		return (
			<div>
				<EducationalContentService
					title="OAuth 2.0 Client Credentials Flow"
					content={ClientCredentialsEducationalContent.overview}
					collapsed={collapsedSections.overview}
					onToggleCollapsed={() => toggleSection('overview')}
				/>
				
				<SectionDivider />
				
				<ComprehensiveCredentialsService
					credentials={controller.credentials}
					onCredentialsChange={handleCredentialsChange}
					onSaveCredentials={controller.saveCredentials}
					collapsed={collapsedSections.credentials}
					onToggleCollapsed={() => toggleSection('credentials')}
					flowType="client-credentials"
					
					// PingOne Advanced Configuration
					pingOneAppState={pingOneConfig}
					onPingOneAppStateChange={setPingOneConfig}
					onPingOneSave={() => {
						console.log('[Client Creds V6] PingOne config saved:', pingOneConfig);
						v4ToastManager.showSuccess('PingOne configuration saved successfully!');
					}}
					hasUnsavedPingOneChanges={false}
					isSavingPingOne={false}
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
				<EducationalContentService
					title="Client Authentication Methods"
					content={{
						title: 'Choose Your Authentication Method',
						description: 'Select the authentication method that best fits your security requirements and implementation constraints',
						useCases: [
							'client_secret_basic: Industry standard, highest security',
							'client_secret_post: Simpler implementation, widely supported',
							'private_key_jwt: Enhanced security with PKI',
							'none: Public clients, development only'
						]
					}}
					collapsed={collapsedSections.authMethods}
					onToggleCollapsed={() => toggleSection('authMethods')}
				/>
				
				<div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
					{supportedMethods.map((method) => {
						const config = ClientCredentialsDefaults.getAuthMethodConfig(method);
						const isSelected = selectedAuthMethod === method;
						
						return (
							<AuthMethodCard
								key={method}
								isSelected={isSelected}
								method={method}
								onClick={() => setSelectedAuthMethod(method)}
							>
								<AuthMethodHeader>
									<AuthMethodIcon method={method}>
										{method === 'client_secret_basic' && <FiShield />}
										{method === 'client_secret_post' && <FiKey />}
										{method === 'private_key_jwt' && <FiZap />}
										{method === 'none' && <FiInfo />}
									</AuthMethodIcon>
									<div>
										<AuthMethodTitle>{config.authMethod.replace(/_/g, ' ').toUpperCase()}</AuthMethodTitle>
										<SecurityBadge level={config.securityLevel}>
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
				<EducationalContentService
					title="Token Request"
					content={{
						title: 'Request an Access Token',
						description: `Using ${config.authMethod.replace(/_/g, ' ')} authentication to obtain an access token`,
						useCases: [
							'POST request to token endpoint',
							'Client authentication via selected method',
							'Receive access token for API calls'
						]
					}}
					collapsed={collapsedSections.tokenRequest}
					onToggleCollapsed={() => toggleSection('tokenRequest')}
				/>
				
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
			<EducationalContentService
				title="Token Analysis"
				content={{
					title: 'Analyze Your Access Token',
					description: 'View, decode, and validate the received access token',
					useCases: [
						'Inspect token claims and metadata',
						'Verify token expiration',
						'Validate token scope and audience'
					]
				}}
				collapsed={collapsedSections.tokenAnalysis}
				onToggleCollapsed={() => toggleSection('tokenAnalysis')}
			/>
			
			{controller.tokens && (
				<div style={{ marginTop: '2rem' }}>
					<UnifiedTokenDisplayService
						tokens={controller.tokens}
						flowType="client-credentials-v6"
						showTokenManagementButtons={true}
					/>
				</div>
			)}
		</div>
	);

	// Step 4: Token Management
	const renderTokenManagement = () => (
		<div>
			<EducationalContentService
				title="Token Management"
				content={{
					title: 'Advanced Token Operations',
					description: 'Introspect, manage, and monitor your access tokens',
					useCases: [
						'Token introspection for validation',
						'Token revocation when needed',
						'Token lifecycle management'
					]
				}}
				collapsed={collapsedSections.tokenIntrospection}
				onToggleCollapsed={() => toggleSection('tokenIntrospection')}
			/>
			
			{controller.tokens && (
				<div style={{ marginTop: '2rem' }}>
					<UnifiedTokenDisplayService
						tokens={controller.tokens}
						flowType="client-credentials-v6"
						showTokenManagementButtons={true}
					/>
					
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
				config={completionConfig}
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
				<FlowHeader flowId="client-credentials-v6" />
				
				{UISettingsService.getFlowSpecificSettingsPanel('client-credentials')}
				
				<FlowSequenceService flowType="client-credentials" />
				
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
				canNavigateNext={canNavigateNext()}
				isFirstStep={currentStep === 0}
			/>
		</Container>
	);
};

export default ClientCredentialsFlowV6;
