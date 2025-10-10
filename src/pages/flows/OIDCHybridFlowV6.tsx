// src/pages/flows/OIDCHybridFlowV6.tsx
// V6.0.0 OIDC Hybrid Flow - Service-Based Architecture with Modern UI/UX
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
	FiSettings,
	FiShield,
	FiZap,
	FiGitBranch,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { useHybridFlowController } from '../../hooks/useHybridFlowController';
import { 
	HybridFlowVariant,
	HybridFlowDefaults,
	HybridFlowStepRestoration,
	HybridFlowCollapsibleSectionsManager,
	HybridFlowEducationalContent,
	log
} from '../../services/hybridFlowSharedService';
import { FlowHeader } from '../../services/flowHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { ConfigurationSummaryService } from '../../services/configurationSummaryService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { EnhancedApiCallDisplayService } from '../../services/enhancedApiCallDisplayService';
import { TokenIntrospectionService } from '../../services/tokenIntrospectionService';
import { AuthenticationModalService } from '../../services/authenticationModalService';
import { UISettingsService } from '../../services/uiSettingsService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import { EducationalContentService } from '../../services/educationalContentService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import DisplayParameterSelector, { DisplayMode } from '../../components/DisplayParameterSelector';
import ClaimsRequestBuilder, { ClaimsRequestStructure } from '../../components/ClaimsRequestBuilder';
import LocalesParameterInput from '../../components/LocalesParameterInput';
import AudienceParameterInput from '../../components/AudienceParameterInput';

// Note: 'log' is imported from hybridFlowSharedService above
// No need to redefine it locally

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

const ResponseTypeCard = styled.div<{ isSelected: boolean; variant: HybridFlowVariant }>`
	padding: 1.5rem;
	border: 2px solid ${props => props.isSelected ? getVariantColor(props.variant) : '#e2e8f0'};
	border-radius: 0.75rem;
	background: ${props => props.isSelected ? `${getVariantColor(props.variant)}10` : 'white'};
	cursor: pointer;
	transition: all 0.2s ease;
	
	&:hover {
		border-color: ${props => getVariantColor(props.variant)};
		background: ${props => `${getVariantColor(props.variant)}05`};
	}
`;

const ResponseTypeHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const ResponseTypeIcon = styled.div<{ variant: HybridFlowVariant }>`
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 0.5rem;
	background: ${props => getVariantColor(props.variant)};
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.25rem;
`;

const ResponseTypeTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
`;

const ResponseTypeDescription = styled.p`
	color: #64748b;
	margin: 0.5rem 0 0 0;
	line-height: 1.5;
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

// Helper function to get variant colors
function getVariantColor(variant: HybridFlowVariant): string {
	const colors = {
		'code-id-token': '#3b82f6', // Blue
		'code-token': '#10b981', // Green
		'code-id-token-token': '#8b5cf6', // Purple
	};
	return colors[variant];
}

// Step Metadata
const STEP_METADATA = [
	{
		title: 'Credentials & Configuration',
		subtitle: 'Configure your PingOne application and hybrid flow settings',
		description: 'Set up your application credentials and choose the hybrid response type'
	},
	{
		title: 'Response Type Selection',
		subtitle: 'Choose your hybrid flow variant',
		description: 'Select between code id_token, code token, or code id_token token'
	},
	{
		title: 'Authorization URL Generation',
		subtitle: 'Generate the authorization URL with hybrid parameters',
		description: 'Build the authorization URL with your selected response type'
	},
	{
		title: 'User Authentication',
		subtitle: 'Authenticate with PingOne',
		description: 'Redirect to PingOne for user authentication and authorization'
	},
	{
		title: 'Token Processing',
		subtitle: 'Process tokens from URL fragment',
		description: 'Extract and display tokens received in the URL fragment'
	},
	{
		title: 'Code Exchange',
		subtitle: 'Exchange authorization code for additional tokens',
		description: 'Exchange the authorization code for refresh tokens and other tokens'
	},
	{
		title: 'Token Management',
		subtitle: 'Manage and introspect your tokens',
		description: 'View, decode, and manage all received tokens'
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete the hybrid flow',
		description: 'Review the completed flow and explore next steps'
	}
];

const OIDCHybridFlowV6: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	
	// Initialize page scroll management
	usePageScroll();
	
	// Initialize hybrid flow controller
	const controller = useHybridFlowController({
		flowKey: 'oidc-hybrid-v6',
		defaultFlowVariant: 'code-id-token',
		enableDebugger: true,
	});

	// Step management
	const [currentStep, setCurrentStep] = useState(() => HybridFlowStepRestoration.getInitialStep());
	
	// PingOne Advanced Configuration
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		applicationName: '',
		applicationType: 'single_page_application',
		redirectUris: [],
		postLogoutRedirectUris: [],
		allowedScopes: [],
		clientAuthMethods: ['none'],
		additionalSettings: {}
	});
	
	// Collapsible sections state
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
		HybridFlowCollapsibleSectionsManager.getDefaultState()
	);
	const [displayMode, setDisplayMode] = useState<DisplayMode>('page');
	const [claimsRequest, setClaimsRequest] = useState<ClaimsRequestStructure | null>(null);
	// Internationalization - SAVED FOR LATER
	// const [uiLocales, setUiLocales] = useState<string>('');
	// const [claimsLocales, setClaimsLocales] = useState<string>('');
	const [audience, setAudience] = useState<string>('');

	// URL parameter handling
	useEffect(() => {
		const urlStep = searchParams.get('step');
		if (urlStep) {
			const step = parseInt(urlStep, 10);
			if (step >= 0 && step < STEP_METADATA.length) {
				setCurrentStep(step);
				log.info('Step set from URL parameter', { step });
			}
		}
	}, [searchParams]);

	// Step change handler
	const handleStepChange = useCallback((newStep: number) => {
		setCurrentStep(newStep);
		HybridFlowStepRestoration.scrollToTopOnStepChange();
		
		// Update URL without triggering navigation
		const newUrl = new URL(window.location.href);
		newUrl.searchParams.set('step', newStep.toString());
		window.history.replaceState({}, '', newUrl.toString());
		
		log.info('Step changed', { from: currentStep, to: newStep });
	}, [currentStep]);

	// Toggle section handler
	const toggleSection = useCallback(
		HybridFlowCollapsibleSectionsManager.createToggleHandler(setCollapsedSections),
		[]
	);

	// Step validation
	const isStepValid = useCallback((step: number): boolean => {
		switch (step) {
			case 0: // Credentials & Configuration
				return controller.hasValidCredentials;
			case 1: // Response Type Selection
				return !!controller.flowConfig;
			case 2: // Authorization URL Generation
				return !!controller.authorizationUrl;
			case 3: // User Authentication
				return !!controller.authorizationUrl;
			case 4: // Token Processing
				return !!controller.tokens && Object.keys(controller.tokens).length > 0;
			case 5: // Code Exchange
				return !!controller.tokens?.code;
			case 6: // Token Management
				return !!controller.tokens;
			case 7: // Flow Completion
				return !!controller.tokens;
			default:
				return false;
		}
	}, [controller]);

	// Navigation handlers
	const handleNext = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			handleStepChange(currentStep + 1);
		}
	}, [currentStep, handleStepChange]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			handleStepChange(currentStep - 1);
		}
	}, [currentStep, handleStepChange]);

	const handleReset = useCallback(() => {
		controller.reset();
		setCurrentStep(0);
		setCollapsedSections(HybridFlowCollapsibleSectionsManager.getDefaultState());
		log.info('Flow reset');
	}, [controller]);

	// Render step content
	const renderStepContent = useCallback((step: number) => {
		switch (step) {
			case 0:
				return renderCredentialsConfiguration();
			case 1:
				return renderResponseTypeSelection();
			case 2:
				return renderAuthorizationUrlGeneration();
			case 3:
				return renderUserAuthentication();
			case 4:
				return renderTokenProcessing();
			case 5:
				return renderCodeExchange();
			case 6:
				return renderTokenManagement();
			case 7:
				return renderFlowCompletion();
			default:
				return <div>Invalid step</div>;
		}
	}, [controller, collapsedSections, toggleSection]);

	// Step 0: Credentials & Configuration
	const renderCredentialsConfiguration = () => {
		// Wrapper to enforce openid scope (required for OIDC & PingOne)
		const handleCredentialsChange = useCallback((newCredentials: typeof controller.credentials) => {
			// Ensure openid is always included in scopes
			if (newCredentials && newCredentials.scopes) {
				const scopes = newCredentials.scopes.split(/\s+/).filter(s => s.length > 0);
				if (!scopes.includes('openid')) {
					scopes.unshift('openid');
					newCredentials.scopes = scopes.join(' ');
					v4ToastManager.showWarning('Added required "openid" scope for OIDC compliance');
				}
			}
			controller.setCredentials(newCredentials);
		}, [controller]);

		return (
			<div>
				<EducationalContentService
					title="OIDC Hybrid Flow Overview"
					content={HybridFlowEducationalContent.overview}
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
					flowType="hybrid"
					
					// PingOne Advanced Configuration
					pingOneAppState={pingOneConfig}
					onPingOneAppStateChange={setPingOneConfig}
					onPingOneSave={() => {
						console.log('[OIDC Hybrid V6] PingOne config saved:', pingOneConfig);
						v4ToastManager.showSuccess('PingOne configuration saved successfully!');
					}}
					hasUnsavedPingOneChanges={false}
					isSavingPingOne={false}
				/>
				
				<SectionDivider />
				
				{/* Nonce Security Educational Section */}
				<InfoBox $variant="warning" style={{ marginBottom: '1.5rem' }}>
					<FiShield size={24} />
					<div>
						<InfoTitle style={{ fontSize: '1rem', fontWeight: '600', color: '#b45309' }}>
							🔐 OIDC Security: Nonce Parameter (Replay Attack Protection) - REQUIRED
						</InfoTitle>
						<InfoText style={{ marginTop: '0.75rem', color: '#78350f' }}>
							<strong>What is Nonce?</strong> The nonce (number used once) is a cryptographically random string that binds your client session to the ID token and prevents replay attacks.
						</InfoText>
						<InfoText style={{ marginTop: '0.5rem', color: '#78350f' }}>
							<strong>How it works:</strong>
						</InfoText>
						<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#78350f' }}>
							<li>Your client generates a unique random nonce value for each authorization request</li>
							<li>The nonce is sent in the authorization request to the identity provider</li>
							<li>The authorization server includes the nonce claim in the ID token</li>
							<li>Your client MUST validate that the nonce in the ID token matches the original nonce</li>
						</ul>
						<InfoText style={{ marginTop: '0.75rem', color: '#78350f', fontWeight: 'bold' }}>
							⚠️ <strong>Security Critical:</strong> Without nonce validation, an attacker could intercept an old ID token and replay it to impersonate a user. This playground automatically generates and validates nonce for educational purposes.
						</InfoText>
						<InfoText style={{ marginTop: '0.5rem', color: '#dc2626', fontWeight: 'bold' }}>
							🔴 <strong>OIDC Hybrid Requirement:</strong> Nonce validation is REQUIRED for all hybrid flows that return ID tokens (code id_token, code id_token token). This protects the ID token received in the URL fragment.
						</InfoText>
						<InfoText style={{ marginTop: '0.5rem', color: '#78350f', fontSize: '0.875rem', fontStyle: 'italic' }}>
						💡 <strong>Spec Reference:</strong> OIDC Core 1.0 Section 15.5.2 REQUIRES nonce validation for Hybrid Flow when ID tokens are returned directly.
					</InfoText>
				</div>
			</InfoBox>
			
			<SectionDivider />
			
			{/* Display Parameter */}
			<DisplayParameterSelector
				value={displayMode}
				onChange={setDisplayMode}
			/>
			
			<SectionDivider />
			
			{/* Advanced Claims Request */}
			<ClaimsRequestBuilder
				value={claimsRequest}
				onChange={setClaimsRequest}
			/>
			
			<SectionDivider />
			
			{/* Internationalization Parameters - SAVED FOR LATER */}
			{/* 
			<LocalesParameterInput
				type="ui"
				value={uiLocales}
				onChange={setUiLocales}
			/>
			<LocalesParameterInput
				type="claims"
				value={claimsLocales}
				onChange={setClaimsLocales}
			/>
			*/}
			
			<SectionDivider />
			
			{/* Audience Parameter */}
			<AudienceParameterInput
				value={audience}
				onChange={setAudience}
				flowType="oidc"
			/>
			
			</div>
		);
	};

	// Step 1: Response Type Selection
	const renderResponseTypeSelection = () => {
		const supportedVariants = HybridFlowDefaults.getSupportedResponseTypes();
		
		return (
			<div>
				<EducationalContentService
					title="Hybrid Flow Response Types"
					content={{
						title: 'Choose Your Hybrid Flow Variant',
						description: 'Select the response type that best fits your application needs',
						useCases: [
							'code id_token: Immediate user identity verification',
							'code token: Immediate API access',
							'code id_token token: Complete hybrid approach'
						]
					}}
					collapsed={collapsedSections.responseType}
					onToggleCollapsed={() => toggleSection('responseType')}
				/>
				
				<div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
					{supportedVariants.map((variant) => {
						const config = HybridFlowDefaults.getFlowConfig(variant);
						const isSelected = controller.flowVariant === variant;
						
						return (
							<ResponseTypeCard
								key={variant}
								isSelected={isSelected}
								variant={variant}
								onClick={() => controller.setFlowVariant(variant)}
							>
								<ResponseTypeHeader>
									<ResponseTypeIcon variant={variant}>
										{variant === 'code-id-token' && <FiShield />}
										{variant === 'code-token' && <FiKey />}
										{variant === 'code-id-token-token' && <FiZap />}
									</ResponseTypeIcon>
									<div>
										<ResponseTypeTitle>{config.responseType}</ResponseTypeTitle>
										<ResponseTypeDescription>{config.description}</ResponseTypeDescription>
									</div>
								</ResponseTypeHeader>
								
								<BenefitsList>
									{config.benefits.map((benefit, index) => (
										<BenefitItem key={index}>{benefit}</BenefitItem>
									))}
								</BenefitsList>
							</ResponseTypeCard>
						);
					})}
				</div>
			</div>
		);
	};

	// Step 2: Authorization URL Generation
	const renderAuthorizationUrlGeneration = () => (
		<div>
			<EducationalContentService
				title="Authorization URL Generation"
				content={{
					title: 'Building the Authorization URL',
					description: 'The authorization URL contains all necessary parameters for the hybrid flow',
					useCases: [
						'Response type determines which tokens are returned',
						'PKCE parameters provide additional security',
						'State and nonce parameters prevent attacks'
					]
				}}
				collapsed={collapsedSections.authRequest}
				onToggleCollapsed={() => toggleSection('authRequest')}
			/>
			
			<div style={{ marginTop: '2rem' }}>
				<button
					onClick={() => {
						controller.generateState();
						controller.generateNonce();
						controller.generateAuthorizationUrl();
					}}
					disabled={!controller.hasValidCredentials || controller.isLoading}
					style={{
						padding: '0.75rem 1.5rem',
						background: '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '0.5rem',
						fontSize: '1rem',
						fontWeight: '500',
						cursor: 'pointer',
						opacity: (!controller.hasValidCredentials || controller.isLoading) ? 0.5 : 1,
					}}
				>
					{controller.isLoading ? 'Generating...' : 'Generate Authorization URL'}
				</button>
				
				{controller.authorizationUrl && (
					<div style={{ marginTop: '2rem' }}>
						<EnhancedApiCallDisplayService
							title="Authorization URL Generated"
							apiCall={{
								method: 'GET',
								url: controller.authorizationUrl,
								headers: {},
								body: null,
								timestamp: Date.now(),
								flowType: 'oidc-hybrid-v6',
							}}
							collapsed={false}
							onToggleCollapsed={() => {}}
						/>
					</div>
				)}
			</div>
		</div>
	);

	// Step 3: User Authentication
	const renderUserAuthentication = () => (
		<div>
			<EducationalContentService
				title="User Authentication"
				content={{
					title: 'Redirect to PingOne for Authentication',
					description: 'Users will be redirected to PingOne to authenticate and authorize your application',
					useCases: [
						'User enters credentials at PingOne',
						'User grants permissions to your application',
						'PingOne redirects back with tokens in URL fragment'
					]
				}}
				collapsed={collapsedSections.authRequest}
				onToggleCollapsed={() => toggleSection('authRequest')}
			/>
			
			{controller.authorizationUrl && (
				<div style={{ marginTop: '2rem' }}>
					<AuthenticationModalService
						authorizationUrl={controller.authorizationUrl}
						flowType="oidc-hybrid-v6"
						onAuthenticationComplete={() => {
							handleNext();
						}}
					/>
				</div>
			)}
		</div>
	);

	// Step 4: Token Processing
	const renderTokenProcessing = () => (
		<div>
			<EducationalContentService
				title="Token Processing"
				content={{
					title: 'Processing Tokens from URL Fragment',
					description: 'Tokens are returned in the URL fragment based on your selected response type',
					useCases: [
						'Extract tokens from URL fragment parameters',
						'Validate token signatures and claims',
						'Store tokens for later use'
					]
				}}
				collapsed={collapsedSections.response}
				onToggleCollapsed={() => toggleSection('response')}
			/>
			
			{controller.tokens && (
				<div style={{ marginTop: '2rem' }}>
					<UnifiedTokenDisplayService
						tokens={controller.tokens}
						flowType="oidc-hybrid-v6"
						showTokenManagementButtons={true}
					/>
				</div>
			)}
		</div>
	);

	// Step 5: Code Exchange
	const renderCodeExchange = () => (
		<div>
			<EducationalContentService
				title="Code Exchange"
				content={{
					title: 'Exchange Authorization Code for Additional Tokens',
					description: 'Use the authorization code to get refresh tokens and other tokens not returned in the fragment',
					useCases: [
						'Exchange code for refresh token',
						'Get additional access tokens if needed',
						'Complete the hybrid flow token set'
					]
				}}
				collapsed={collapsedSections.exchange}
				onToggleCollapsed={() => toggleSection('exchange')}
			/>
			
			{controller.tokens?.code && (
				<div style={{ marginTop: '2rem' }}>
					<button
						onClick={() => controller.exchangeCodeForTokens(controller.tokens!.code!)}
						disabled={controller.isExchangingCode}
						style={{
							padding: '0.75rem 1.5rem',
							background: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '0.5rem',
							fontSize: '1rem',
							fontWeight: '500',
							cursor: 'pointer',
							opacity: controller.isExchangingCode ? 0.5 : 1,
						}}
					>
						{controller.isExchangingCode ? 'Exchanging Code...' : 'Exchange Code for Tokens'}
					</button>
				</div>
			)}
		</div>
	);

	// Step 6: Token Management
	const renderTokenManagement = () => (
		<div>
			<EducationalContentService
				title="Token Management"
				content={{
					title: 'Manage and Introspect Your Tokens',
					description: 'View, decode, validate, and manage all tokens received from the hybrid flow',
					useCases: [
						'Decode JWT tokens to view claims',
						'Validate token signatures and expiration',
						'Introspect tokens with PingOne'
					]
				}}
				collapsed={collapsedSections.tokens}
				onToggleCollapsed={() => toggleSection('tokens')}
			/>
			
			{controller.tokens && (
				<div style={{ marginTop: '2rem' }}>
					<UnifiedTokenDisplayService
						tokens={controller.tokens}
						flowType="oidc-hybrid-v6"
						showTokenManagementButtons={true}
					/>
					
					<SectionDivider />
					
					<TokenIntrospectionService
						tokens={controller.tokens}
						flowType="oidc-hybrid-v6"
						collapsed={collapsedSections.introspectionDetails}
						onToggleCollapsed={() => toggleSection('introspectionDetails')}
					/>
				</div>
			)}
		</div>
	);

	// Step 7: Flow Completion
	const renderFlowCompletion = () => {
		const completionConfig = {
			...FlowCompletionConfigs.hybrid,
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
			search: window.location.search,
			timestamp: new Date().toISOString(),
		});
	}, []);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="oidc-hybrid-v6" />
				
				{UISettingsService.getFlowSpecificSettingsPanel('oidc-hybrid')}
				
				<FlowSequenceService flowType="hybrid" />
				
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

export default OIDCHybridFlowV6;
