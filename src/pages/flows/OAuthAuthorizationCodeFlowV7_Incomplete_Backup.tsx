// src/pages/flows/OAuthAuthorizationCodeFlowV7.tsx
// V7 Unified OAuth/OIDC Authorization Code Flow - Single implementation supporting both variants

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { usePageScroll } from '../../hooks/usePageScroll';
import {
	FiAlertCircle,
	FiArrowRight,
	FiBook,
	FiCheckCircle,
	FiChevronDown,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiPackage,
	FiRefreshCw,
	FiSave,
	FiSend,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import { themeService } from '../../services/themeService';
import styled from 'styled-components';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import EnhancedFlowWalkthrough from '../../components/EnhancedFlowWalkthrough';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import ConfigurationBackup from '../../components/ConfigurationBackup';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import LoginSuccessModal from '../../components/LoginSuccessModal';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import EducationalContentService from '../../services/educationalContentService.tsx';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { FlowHeader } from '../../services/flowHeaderService';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService, EnhancedApiCallData } from '../../services/enhancedApiCallDisplayService';
import { TokenIntrospectionService, IntrospectionApiCallData } from '../../services/tokenIntrospectionService';
import { AuthenticationModalService } from '../../services/authenticationModalService';
import { decodeJWTHeader } from '../../utils/jwks';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { storeFlowNavigationState } from '../../utils/flowNavigation';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { UISettingsService } from '../../services/uiSettingsService';
import { PKCEGenerationService } from '../../services/pkceGenerationService';
import AudienceParameterInput from '../../components/AudienceParameterInput';
import { CopyButtonService } from '../../services/copyButtonService';
import AuthorizationCodeSharedService from '../../services/authorizationCodeSharedService';
import { FlowStorageService } from '../../services/flowStorageService';
import {
	STEP_METADATA,
	type IntroSectionKey,
	DEFAULT_APP_CONFIG,
} from './config/OAuthAuthzCodeFlowV6.config';
import FlowCredentialService from '../../services/flowCredentialService';

type StepCompletionState = Record<number, boolean>;
type FlowVariant = 'oauth' | 'oidc';

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
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
`;

// V7 Variant Selector Styling
const VariantSelectorContainer = styled.div`
	display: flex;
	justify-content: center;
	margin: 2rem 0;
`;

const VariantSelector = styled.div`
	display: inline-flex;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 4px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const VariantButton = styled.button<{ $selected: boolean }>`
	padding: 12px 24px;
	border: none;
	border-radius: 8px;
	font-weight: 600;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 140px;
	
	background: ${({ $selected }) => 
		$selected 
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
			: 'transparent'
	};
	color: ${({ $selected }) => ($selected ? '#ffffff' : '#64748b')};
	box-shadow: ${({ $selected }) => 
		$selected 
			? '0 2px 8px rgba(59, 130, 246, 0.3)' 
			: 'none'
	};

	&:hover {
		background: ${({ $selected }) => 
			$selected 
				? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' 
				: '#f1f5f9'
		};
		transform: ${({ $selected }) => ($selected ? 'translateY(-1px)' : 'none')};
	}
`;

const VariantDescription = styled.div`
	text-align: center;
	margin: 1rem 0 2rem;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
`;

const VariantTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0 0 0.5rem 0;
`;

const VariantSubtitle = styled.p`
	font-size: 0.875rem;
	color: #64748b;
	margin: 0;
	line-height: 1.5;
`;

// Rest of the styled components from V6...
const StepHeaderRight = styled.div`
	text-align: right;
`;

const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.05em;
`;

const StepContentWrapper = styled.div`
	padding: 2rem;
	background: #ffffff;
`;

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
	${() => themeService.getCollapseIconStyles()}
	display: inline-flex;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s ease;

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(0deg) scale(1.1)' : 'rotate(180deg) scale(1.1)'};
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

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

const OAuthAuthorizationCodeFlowV7: React.FC = () => {
	console.log('🚀 [OAuthAuthorizationCodeFlowV7] V7 Unified Flow loaded!', {
		url: window.location.href,
		search: window.location.search,
		timestamp: new Date().toISOString(),
	});

	// V7 Flow State
	const [selectedVariant, setSelectedVariant] = useState<FlowVariant>('oidc');
	
	// Scroll to top on page load
	usePageScroll({ pageName: 'OAuth Authorization Code Flow V7 - Unified', force: true });

	const manualAuthCodeId = useId();
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'oauth-authorization-code-v7',
		defaultFlowVariant: selectedVariant,
		enableDebugger: true,
	});

	const [currentStep, setCurrentStep] = useState(
		AuthorizationCodeSharedService.StepRestoration.getInitialStep()
	);
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);
	const [emptyRequiredFields, setEmptyRequiredFields] = useState<Set<string>>(new Set());
	const [collapsedSections, setCollapsedSections] = useState(
		AuthorizationCodeSharedService.CollapsibleSections.getDefaultState()
	);
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
	const [localAuthCode, setLocalAuthCode] = useState<string | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// V7 Variant Change Handler
	const handleVariantChange = useCallback((variant: FlowVariant) => {
		console.log('🔄 [V7] Switching variant:', variant);
		setSelectedVariant(variant);
		controller.setFlowVariant(variant);
		
		// Update credentials based on variant
		const updatedCredentials = {
			...controller.credentials,
			scope: variant === 'oidc' ? 'openid profile email' : '',
			scopes: variant === 'oidc' ? 'openid profile email' : '',
		};
		
		controller.setCredentials(updatedCredentials);
		controller.setFlowConfig({
			...controller.flowConfig,
			enableOIDC: variant === 'oidc',
		});
		
		// Reset to step 0 when switching variants
		setCurrentStep(0);
		
		v4ToastManager.showSuccess(`Switched to ${variant.toUpperCase()} variant`);
	}, [controller]);

	// Get variant-specific metadata
	const getVariantMetadata = useCallback((variant: FlowVariant) => {
		if (variant === 'oidc') {
			return {
				title: 'OpenID Connect Authorization Code',
				subtitle: 'ID token + Access token - Authentication + Authorization',
				description: 'Get both identity information and API access with OpenID Connect',
				features: [
					'ID Token for user identity',
					'Access Token for API calls',
					'Built-in security with nonce',
					'Standardized user info endpoint'
				]
			};
		} else {
			return {
				title: 'OAuth 2.0 Authorization Code',
				subtitle: 'Access token only - API authorization',
				description: 'Pure OAuth 2.0 flow for API access without identity features',
				features: [
					'Access Token for API calls',
					'Custom scopes only',
					'Lightweight implementation',
					'Maximum compatibility'
				]
			};
		}
	}, []);

	const currentMetadata = getVariantMetadata(selectedVariant);

	// Toggle section handler
	const toggleSection = AuthorizationCodeSharedService.CollapsibleSections.createToggleHandler(
		setCollapsedSections
	);

	// Render variant selector
	const renderVariantSelector = () => (
		<VariantSelectorContainer>
			<VariantSelector>
				<VariantButton
					$selected={selectedVariant === 'oauth'}
					onClick={() => handleVariantChange('oauth')}
				>
					OAuth 2.0
				</VariantButton>
				<VariantButton
					$selected={selectedVariant === 'oidc'}
					onClick={() => handleVariantChange('oidc')}
				>
					OpenID Connect
				</VariantButton>
			</VariantSelector>
		</VariantSelectorContainer>
	);

	// Render variant description
	const renderVariantDescription = () => (
		<VariantDescription>
			<VariantTitle>{currentMetadata.title}</VariantTitle>
			<VariantSubtitle>{currentMetadata.subtitle}</VariantSubtitle>
		</VariantDescription>
	);

	// Get variant-specific step metadata
	const getVariantSteps = useCallback((variant: FlowVariant) => {
		const baseSteps = [
			'Setup & Configuration',
			'Generate PKCE Parameters',
			'Build Authorization URL',
			'Handle Authorization Callback',
			'Exchange Code for Tokens',
		];
		
		if (variant === 'oidc') {
			return [
				...baseSteps,
				'Validate ID Token',
				'Fetch User Information',
				'Token Management'
			];
		} else {
			return [
				...baseSteps,
				'Token Introspection',
				'Token Management'
			];
		}
	}, []);

	const currentSteps = getVariantSteps(selectedVariant);

	// Render step content based on current step
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<>
						{renderVariantSelector()}
						{renderVariantDescription()}
						
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>Flow Steps Preview</InfoTitle>
								<InfoText>
									This {selectedVariant === 'oidc' ? 'OIDC' : 'OAuth 2.0'} flow will guide you through {currentSteps.length} steps:
								</InfoText>
								<div style={{ marginTop: '0.5rem' }}>
									{currentSteps.map((step, index) => (
										<div key={index} style={{ 
											fontSize: '0.875rem', 
											color: '#64748b', 
											marginBottom: '0.25rem',
											paddingLeft: '1rem'
										}}>
											{index + 1}. {step}
										</div>
									))}
								</div>
							</div>
						</InfoBox>
						
						<InfoBox $variant={selectedVariant === 'oidc' ? 'info' : 'warning'}>
							<FiShield size={20} />
							<div>
								<InfoTitle>
									{selectedVariant === 'oidc' ? 'OIDC Enhancements Enabled' : 'OAuth 2.0 Mode Active'}
								</InfoTitle>
								<InfoText>
									{selectedVariant === 'oidc' 
										? 'The flow will now request an ID token, include the `openid` scope automatically, and expose additional OpenID Connect configuration options.'
										: 'Pure OAuth 2.0 mode - only access tokens will be requested. No identity features or ID tokens will be included.'
									}
								</InfoText>
							</div>
						</InfoBox>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('variantComparison')}
								aria-expanded={!collapsedSections.variantComparison}
							>
								<CollapsibleTitle>
									<FiInfo /> {selectedVariant === 'oidc' ? 'OIDC' : 'OAuth 2.0'} vs {selectedVariant === 'oidc' ? 'OAuth 2.0' : 'OIDC'} Comparison
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.variantComparison}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.variantComparison && (
								<CollapsibleContent>
									<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
										<InfoBox $variant={selectedVariant === 'oidc' ? 'success' : 'info'}>
											<FiCheckCircle size={20} />
											<div>
												<InfoTitle>OpenID Connect</InfoTitle>
												<InfoText>
													<strong>Tokens:</strong> Access Token + ID Token<br/>
													<strong>Purpose:</strong> Authentication + Authorization<br/>
													<strong>Scopes:</strong> openid required + custom scopes<br/>
													<strong>User Info:</strong> Built-in via ID token or /userinfo endpoint<br/>
													<strong>Security:</strong> Nonce parameter for replay protection
												</InfoText>
											</div>
										</InfoBox>
										<InfoBox $variant={selectedVariant === 'oauth' ? 'success' : 'info'}>
											<FiKey size={20} />
											<div>
												<InfoTitle>OAuth 2.0</InfoTitle>
												<InfoText>
													<strong>Tokens:</strong> Access Token only<br/>
													<strong>Purpose:</strong> Authorization only<br/>
													<strong>Scopes:</strong> Custom scopes only<br/>
													<strong>User Info:</strong> Custom implementation required<br/>
													<strong>Security:</strong> PKCE for code interception protection
												</InfoText>
											</div>
										</InfoBox>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('overview')}
								aria-expanded={!collapsedSections.overview}
							>
								<CollapsibleTitle>
									<FiBook /> What is PKCE?
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.overview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiGlobe size={20} />
										<div>
											<InfoTitle>PKCE (Proof Key for Code Exchange)</InfoTitle>
											<InfoText>
												PKCE is a security extension for OAuth 2.0 that prevents authorization code
												interception attacks. It's required for public clients (like mobile apps)
												and highly recommended for all OAuth flows.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant={selectedVariant === 'oidc' ? 'success' : 'warning'}>
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>
												{selectedVariant === 'oidc' ? 'OIDC + PKCE Security' : 'OAuth 2.0 + PKCE Security'}
											</InfoTitle>
											<InfoText>
												{selectedVariant === 'oidc' 
													? 'OIDC adds an additional layer of security with the nonce parameter in the ID token, combined with PKCE for authorization code protection. This provides comprehensive protection against replay attacks and code interception.'
													: 'OAuth 2.0 with PKCE provides strong protection against authorization code interception. Since there\'s no ID token, PKCE is your primary defense against malicious apps intercepting authorization codes.'
												}
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('features')}
								aria-expanded={!collapsedSections.features}
							>
								<CollapsibleTitle>
									<FiPackage /> {selectedVariant === 'oidc' ? 'OIDC' : 'OAuth 2.0'} Features & Benefits
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.features}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.features && (
								<CollapsibleContent>
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
										{currentMetadata.features.map((feature, index) => (
											<div key={index} style={{
												padding: '1rem',
												background: selectedVariant === 'oidc' ? '#f0f9ff' : '#fef3c7',
												border: `1px solid ${selectedVariant === 'oidc' ? '#0ea5e9' : '#f59e0b'}`,
												borderRadius: '0.5rem'
											}}>
												<div style={{ 
													display: 'flex', 
													alignItems: 'center', 
													gap: '0.5rem',
													color: selectedVariant === 'oidc' ? '#0c4a6e' : '#92400e',
													fontWeight: '600'
												}}>
													<FiCheckCircle size={16} />
													{feature}
												</div>
											</div>
										))}
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokens')}
								aria-expanded={!collapsedSections.tokens}
							>
								<CollapsibleTitle>
									<FiKey /> Expected Tokens & Response
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokens}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokens && (
								<CollapsibleContent>
									<div style={{ display: 'grid', gridTemplateColumns: selectedVariant === 'oidc' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
										<InfoBox $variant="success">
											<FiCheckCircle size={20} />
											<div>
												<InfoTitle>Access Token</InfoTitle>
												<InfoText>
													<strong>Purpose:</strong> API Authorization<br/>
													<strong>Format:</strong> JWT or opaque token<br/>
													<strong>Lifetime:</strong> Typically 1 hour<br/>
													<strong>Usage:</strong> Bearer token for API calls
												</InfoText>
											</div>
										</InfoBox>
										{selectedVariant === 'oidc' && (
											<InfoBox $variant="info">
												<FiShield size={20} />
												<div>
													<InfoTitle>ID Token</InfoTitle>
													<InfoText>
														<strong>Purpose:</strong> User Authentication<br/>
														<strong>Format:</strong> Signed JWT<br/>
														<strong>Lifetime:</strong> Typically 1 hour<br/>
														<strong>Usage:</strong> User identity information
													</InfoText>
												</div>
											</InfoBox>
										)}
									</div>
									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Security Note</InfoTitle>
											<InfoText>
												{selectedVariant === 'oidc' 
													? 'Both tokens will be returned in the token exchange response. The ID token contains user identity claims, while the access token is used for API calls.'
													: 'Only an access token will be returned. For user information, you\'ll need to call a custom user info endpoint or include user data in the access token claims.'
												}
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<EnhancedFlowWalkthrough flowId={selectedVariant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'} />
						<FlowSequenceDisplay flowType="authorization-code" />
						<EnhancedFlowInfoCard flowId={selectedVariant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'} />
					</>
				);
			default:
				return (
					<div style={{ padding: '2rem', textAlign: 'center' }}>
						<InfoTitle>Step {currentStep + 1} - Coming Soon</InfoTitle>
						<InfoText>This step is being implemented for the V7 unified flow.</InfoText>
					</div>
				);
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V7.0 - Unified Flow</VersionBadge>
							<StepHeaderTitle>
								{selectedVariant === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'} Authorization Code
							</StepHeaderTitle>
							<StepHeaderSubtitle>
								{currentMetadata.subtitle}
							</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{currentStep + 1}</StepNumber>
							<StepTotal>of {currentSteps.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>
						{renderStepContent()}
					</StepContentWrapper>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default OAuthAuthorizationCodeFlowV7;