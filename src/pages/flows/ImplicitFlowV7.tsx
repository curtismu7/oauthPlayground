// src/pages/flows/ImplicitFlowV7.tsx
// Unified OAuth/OIDC Implicit Flow V7 - Single implementation supporting both variants

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiEyeOff,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiZap,
} from 'react-icons/fi';

// Import shared services
import { ImplicitFlowSharedService, ImplicitFlowV7Helpers } from '../../services/implicitFlowSharedService';
import { useImplicitFlowController, loadInitialCredentials } from '../../hooks/useImplicitFlowController';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import { FlowCredentialService } from '../../services/flowCredentialService';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { OAuthErrorHandlingService, OAuthErrorDetails } from '../../services/oauthErrorHandlingService';
import OAuthErrorDisplay from '../../components/OAuthErrorDisplay';

// Import components
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import type { StepCredentials } from '../../components/steps/CommonSteps';
import { usePageScroll } from '../../hooks/usePageScroll';
import { FlowHeader } from '../../services/flowHeaderService';
import '../../utils/testImplicitConfigChecker'; // Auto-run config checker tests in development
import TokenIntrospect from '../../components/TokenIntrospect';
import SecurityFeaturesDemo from '../../components/SecurityFeaturesDemo';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { checkCredentialsAndWarn } from '../../utils/credentialsWarningService';

// Import UI components from services
import { FlowUIService } from '../../services/flowUIService';
import { CopyButtonService } from '../../services/copyButtonService';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';

// Get UI components
const {
	Container,
	ContentWrapper,
	MainCard,
	StepHeader,
	StepHeaderLeft,
	VersionBadge,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepHeaderRight,
	StepNumber,
	StepTotal,
	StepContentWrapper,
	CollapsibleSection,
	CollapsibleHeaderButton,
	CollapsibleTitle,
	CollapsibleContent,
	InfoBox,
	InfoTitle,
	InfoText,
	InfoList,
	StrongText,
	ActionRow,
	Button,
	HighlightedActionButton,
	CodeBlock,
	GeneratedContentBox,
	GeneratedLabel,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	FlowDiagram,
	FlowStep,
	FlowStepNumber,
	FlowStepContent,
	SectionDivider,
	ResultsSection,
	ResultsHeading,
	HelperText,
	ExplanationSection,
	ExplanationHeading,
	NextSteps,
	HighlightBadge,
} = FlowUIService.getFlowUIComponents();

// Local styled components with dynamic colors
const DynamicStepHeader = styled(StepHeader)<{ $variant: 'oauth' | 'oidc' }>`
	background: ${props => props.$variant === 'oidc' 
		? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
		: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
	};
`;

const DynamicVersionBadge = styled(VersionBadge)<{ $variant: 'oauth' | 'oidc' }>`
	background: ${props => props.$variant === 'oidc' 
		? 'rgba(59, 130, 246, 0.2)' 
		: 'rgba(22, 163, 74, 0.2)'
	};
	border: 1px solid ${props => props.$variant === 'oidc' 
		? '#60a5fa' 
		: '#4ade80'
	};
	color: ${props => props.$variant === 'oidc' 
		? '#dbeafe' 
		: '#bbf7d0'
	};
`;

// Local CollapsibleToggleIcon that accepts children
const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: #3b82f6;
	color: white;
	box-shadow: 0 6px 16px #3b82f633;
	transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};

	svg {
		width: 16px;
		height: 16px;
	}
`;

// Styled components
const VariantSelector = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1.5rem;
	background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
	border-radius: 0.75rem;
	border: 1px solid #cbd5e1;
`;

const VariantButton = styled.button<{ $selected: boolean }>`
	flex: 1;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 2px solid ${props => props.$selected ? '#3b82f6' : '#cbd5e1'};
	background: ${props => props.$selected ? '#dbeafe' : 'white'};
	color: ${props => props.$selected ? '#1e40af' : '#475569'};
	font-weight: ${props => props.$selected ? '600' : '500'};
	transition: all 0.2s ease;

	&:hover {
		border-color: #3b82f6;
		background: #dbeafe;
	}
`;

const VariantTitle = styled.div`
	font-size: 1.1rem;
	margin-bottom: 0.25rem;
`;

const VariantDescription = styled.div`
	font-size: 0.875rem;
	opacity: 0.8;
`;

const ImplicitFlowV7: React.FC = () => {
	const location = useLocation();
	
	// Detect default variant based on navigation context
	const getDefaultVariant = (): 'oauth' | 'oidc' => {
		// Check if there's a variant specified in the URL params
		const urlParams = new URLSearchParams(location.search);
		const urlVariant = urlParams.get('variant');
		if (urlVariant === 'oidc' || urlVariant === 'oauth') {
			return urlVariant as 'oauth' | 'oidc';
		}
		
		// Check navigation state for context
		const state = location.state as any;
		if (state?.fromSection === 'oidc') {
			return 'oidc';
		}
		
		// Default to OAuth (base protocol)
		return 'oauth';
	};
	
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>(getDefaultVariant());
	const [workerToken, setWorkerToken] = useState<string>('');

	// Initialize controller with V7 flow key
	const controller = useImplicitFlowController({
		flowKey: 'implicit-v7',
		defaultFlowVariant: selectedVariant,
		enableDebugger: true,
	});

	const [credentials, setCredentials] = useState<StepCredentials>(() => {
		const initialCreds = controller.credentials || {
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: 'https://localhost:3000/implicit-callback',
			scope: selectedVariant === 'oidc' ? 'openid profile email' : '',
			scopes: selectedVariant === 'oidc' ? 'openid profile email' : '',
			responseType: selectedVariant === 'oidc' ? 'id_token token' : 'token',
			grantType: '',
			clientAuthMethod: 'none',
		};
		console.log('[ImplicitFlowV7] Initial credentials from controller:', initialCreds);
		return initialCreds;
	});

	const [currentStep, setCurrentStep] = useState(0);
	const [errorDetails, setErrorDetails] = useState<OAuthErrorDetails | null>(null);
	const [collapsedSections, setCollapsedSections] = useState(
		ImplicitFlowSharedService.CollapsibleSections.getDefaultState
	);

	// Get worker token from location state or localStorage
	useEffect(() => {
		// First try to get from location state (if navigating from Configuration page)
		const tokenFromLocation = location.state?.workerToken;
		if (tokenFromLocation) {
			setWorkerToken(tokenFromLocation);
			console.log('[ImplicitFlowV7] Worker token loaded from location state');
			return;
		}

		// If not in location state, try to load from localStorage
		const savedToken = localStorage.getItem('worker-token');
		const savedEnv = localStorage.getItem('worker-token-env');
		
		if (savedToken && savedEnv) {
			setWorkerToken(savedToken);
			console.log('[ImplicitFlowV7] Worker token loaded from localStorage');
		} else {
			console.log('[ImplicitFlowV7] No worker token found in location state or localStorage');
		}
	}, [location.state]);

	// Process tokens from URL fragment on mount or when tokens change
	useEffect(() => {
		const hash = window.location.hash;
		console.log('[ImplicitFlowV7] Checking for tokens in URL fragment on mount:', hash);
		
		if (hash?.includes('access_token') && !controller.tokens) {
			console.log('[ImplicitFlowV7] Found tokens in URL fragment, processing...');
			controller.setTokensFromFragment(hash);
			// Clean up URL
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, [controller.tokens, controller.setTokensFromFragment]);

	// Handle token reception and step advancement
	useEffect(() => {
		if (controller.tokens && currentStep < 2) {
			console.log('[ImplicitFlowV7] Tokens received, advancing to step 2');
			setCurrentStep(2);
		}
	}, [controller.tokens, currentStep]);

	// Sync local credentials with controller credentials
	useEffect(() => {
		if (controller.credentials && 
		    (controller.credentials.environmentId !== credentials.environmentId ||
		     controller.credentials.clientId !== credentials.clientId ||
		     controller.credentials.redirectUri !== credentials.redirectUri ||
		     controller.credentials.scope !== credentials.scope ||
		     controller.credentials.scopes !== credentials.scopes)) {
			console.log('[ImplicitFlowV7] Syncing credentials from controller:', controller.credentials);
			console.log('[ImplicitFlowV7] Current local credentials:', credentials);
			setCredentials(controller.credentials);
		}
	}, [controller.credentials]); // Removed credentials dependencies to prevent infinite loop

	// Load credentials on mount using V7 standardized storage
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('[ImplicitFlowV7] Loading credentials on mount...');
			
			try {
				// Try V7 standardized storage first
				const { credentials: v7Credentials, hasSharedCredentials, flowState } = await FlowCredentialService.loadFlowCredentials({
					flowKey: 'implicit-v7',
					defaultCredentials: {},
				});

				if (v7Credentials && hasSharedCredentials) {
					console.log('[ImplicitFlowV7] Loaded V7 credentials:', {
						flowKey: 'implicit-v7',
						environmentId: v7Credentials.environmentId,
						clientId: v7Credentials.clientId?.substring(0, 8) + '...',
						hasFlowState: !!flowState,
					});
					setCredentials(v7Credentials);
					controller.setCredentials(v7Credentials);
				} else {
					// Fallback to legacy method
					const initialCredentials = loadInitialCredentials(selectedVariant, 'implicit-v7');
					setCredentials(initialCredentials);
					controller.setCredentials(initialCredentials);
					console.log('[ImplicitFlowV7] Using legacy credentials:', initialCredentials);
				}
			} catch (error) {
				console.error('[ImplicitFlowV7] Failed to load V7 credentials:', error);
				// Fallback to legacy method on error
				const initialCredentials = loadInitialCredentials(selectedVariant, 'implicit-v7');
				setCredentials(initialCredentials);
				controller.setCredentials(initialCredentials);
			}
		};

		loadCredentials();
	}, [selectedVariant]); // Removed controller dependency to prevent infinite loop

	// Update controller when variant changes and reload credentials
	useEffect(() => {
		controller.setFlowVariant(selectedVariant);
		ImplicitFlowV7Helpers.getSessionHelpers(selectedVariant).setActiveFlow();
		
		// Reload variant-specific credentials
		const reloadedCredentials = loadInitialCredentials(selectedVariant, 'implicit-v7');
		controller.setCredentials(reloadedCredentials);
		setCredentials(reloadedCredentials);
		console.log('[ImplicitFlowV7] Variant changed, reloaded credentials:', reloadedCredentials);
	}, [selectedVariant, controller.setFlowVariant, controller.setCredentials]);

	// Sync credentials with variant
	useEffect(() => {
		const variantDefaults = ImplicitFlowV7Helpers.getFlowMetadata(selectedVariant);
		setCredentials(prev => ({
			...prev,
			scope: variantDefaults.scopes || prev.scope || '',
			scopes: variantDefaults.scopes || prev.scopes || '',
			responseType: variantDefaults.responseType,
		}));
	}, [selectedVariant]);

	// Ensure Implicit Flow V7 uses its own credential storage
	useEffect(() => {
		// Save current credentials to flow-specific storage
		if (controller.credentials && (controller.credentials.environmentId || controller.credentials.clientId)) {
			console.log('🔧 [Implicit V7] Saving credentials to flow-specific storage:', {
				flowKey: 'implicit-v7',
				environmentId: controller.credentials.environmentId,
				clientId: controller.credentials.clientId?.substring(0, 8) + '...',
				redirectUri: controller.credentials.redirectUri
			});
			
			// Save to flow-specific storage with enhanced error handling
			FlowCredentialService.saveFlowCredentials('implicit-v7', controller.credentials, {
				showToast: false
			}).catch((error) => {
				console.error('[ImplicitFlowV7] Failed to save credentials to V7 storage:', error);
				// Fallback to legacy storage if V7 fails
				try {
					// This would be the legacy save method if available
					console.log('[ImplicitFlowV7] Attempting legacy credential save...');
				} catch (legacyError) {
					console.error('[ImplicitFlowV7] Legacy credential save also failed:', legacyError);
				}
			});
		}
	}, [controller.credentials]);

	// Use credential backup hook for automatic backup and restoration
	const { clearBackup, getBackupStats, downloadEnvFile } = useCredentialBackup({
		flowKey: 'implicit-v7',
		credentials: controller.credentials,
		setCredentials: controller.setCredentials,
		enabled: true
	});

	usePageScroll({ pageName: 'Implicit Flow V7', force: true });

	// Check credentials on mount and show warning if missing
	useEffect(() => {
		checkCredentialsAndWarn(credentials, {
			flowName: `${selectedVariant.toUpperCase()} Implicit Flow`,
			requiredFields: ['environmentId', 'clientId'],
			showToast: true
		});
	}, []); // Only run once on mount

	// V7 Enhanced step validation
	const isStepValid = (step: number): boolean => {
		switch (step) {
			case 0:
				// Step 0: Must have valid credentials
				return !!(credentials.environmentId && credentials.clientId);
			case 1:
				// Step 1: Must have valid redirect URI
				return !!(credentials.redirectUri);
			case 2:
				// Step 2: Must have generated authorization URL
				return !!(controller.authUrl);
			case 3:
				// Step 3: Must have tokens from callback
				return !!(controller.tokens?.accessToken);
			case 4:
				// Step 4: Must have completed token introspection
				return !!(controller.tokens?.accessToken);
			default:
				return true; // Other steps are always valid
		}
	};

	const toggleSection = ImplicitFlowSharedService.CollapsibleSections.createToggleHandler(setCollapsedSections);

	const handleVariantChange = useCallback((variant: 'oauth' | 'oidc') => {
		setSelectedVariant(variant);
		// Reset to step 0 when switching variants
		setCurrentStep(0);
		controller.resetFlow();
		
		// Update credentials based on variant (PingOne requires openid for both)
		setCredentials(prev => ({
			...prev,
			scope: variant === 'oidc' ? 'openid profile email' : 'openid',
			scopes: variant === 'oidc' ? 'openid profile email' : 'openid',
			responseType: variant === 'oidc' ? 'id_token token' : 'token',
		}));
		
		v4ToastManager.showSuccess(`Switched to ${variant.toUpperCase()} Implicit Flow variant`);
	}, [controller]);

	const renderVariantSelector = () => (
		<VariantSelector>
			<VariantButton
				$selected={selectedVariant === 'oauth'}
				onClick={() => handleVariantChange('oauth')}
			>
				<VariantTitle>OAuth 2.0 Implicit</VariantTitle>
				<VariantDescription>Access token only - API authorization</VariantDescription>
			</VariantButton>
			<VariantButton
				$selected={selectedVariant === 'oidc'}
				onClick={() => handleVariantChange('oidc')}
			>
				<VariantTitle>OpenID Connect Implicit</VariantTitle>
				<VariantDescription>ID token + Access token - Authentication + Authorization</VariantDescription>
			</VariantButton>
		</VariantSelector>
	);

	const renderStep0 = () => {
		const metadata = ImplicitFlowV7Helpers.getFlowMetadata(selectedVariant);
		const educationalContent = ImplicitFlowV7Helpers.getEducationalContent(selectedVariant);
		const flowDiagram = ImplicitFlowV7Helpers.getFlowDiagram(selectedVariant);
		const requirements = ImplicitFlowV7Helpers.getRequirements(selectedVariant);

		return (
			<>
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('overview')}
						aria-expanded={!collapsedSections.overview}
					>
						<CollapsibleTitle>
							<FiInfo /> {metadata.name}
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
									<InfoTitle>{metadata.shortName} Flow Overview</InfoTitle>
									<InfoText>{educationalContent.overview}</InfoText>
								</div>
							</InfoBox>

							<InfoBox $variant="warning">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Security Considerations</InfoTitle>
									<InfoText>{educationalContent.security}</InfoText>
								</div>
							</InfoBox>

							<GeneratedContentBox>
								<GeneratedLabel>Flow Specifications</GeneratedLabel>
								<ParameterGrid>
									<div>
										<ParameterLabel>Response Type</ParameterLabel>
										<ParameterValue>{metadata.responseType}</ParameterValue>
									</div>
									<div>
										<ParameterLabel>Tokens</ParameterLabel>
										<ParameterValue>{metadata.tokens.join(' + ')}</ParameterValue>
									</div>
									<div>
										<ParameterLabel>Security</ParameterLabel>
										<ParameterValue>Implicit Grant (Legacy)</ParameterValue>
									</div>
								</ParameterGrid>
							</GeneratedContentBox>

							<FlowDiagram>
								{flowDiagram.map((step, index) => (
									<FlowStep key={step}>
										<FlowStepNumber>{index + 1}</FlowStepNumber>
										<FlowStepContent>
											<StrongText>{step}</StrongText>
										</FlowStepContent>
									</FlowStep>
								))}
							</FlowDiagram>
						</CollapsibleContent>
					)}
				</CollapsibleSection>

				{/* Credentials section using ComprehensiveCredentialsService */}
				<ComprehensiveCredentialsService
					// Flow identification
					flowType={`implicit-${selectedVariant}-v7`}
					
					// Pass individual credential props
					environmentId={credentials.environmentId || ''}
					clientId={credentials.clientId || ''}
					clientSecret={credentials.clientSecret || ''}
					redirectUri={credentials.redirectUri}
					scopes={credentials.scope || credentials.scopes || ''}
					loginHint={credentials.loginHint || ''}
					postLogoutRedirectUri={credentials.postLogoutRedirectUri || 'https://localhost:3000/logout-callback'}
					
					// Individual change handlers
					onEnvironmentIdChange={(value) => {
						const updated = { ...credentials, environmentId: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
						console.log('[Implicit Flow V7] Environment ID updated:', value);
					}}
					onClientIdChange={(value) => {
						const updated = { ...credentials, clientId: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
						console.log('[Implicit Flow V7] Client ID updated:', value);
					}}
					onClientSecretChange={(value) => {
						const updated = { ...credentials, clientSecret: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
					}}
					onRedirectUriChange={(value) => {
						const updated = { ...credentials, redirectUri: value };
						setCredentials(updated);
						console.log('[ImplicitFlowV7] Setting controller credentials:', updated);
						controller.setCredentials(updated); // Sync with controller immediately
						console.log('[ImplicitFlowV7] Controller credentials after set:', controller.credentials);
						console.log('[Implicit Flow V7] Redirect URI updated:', value);
						// Auto-save redirect URI to persist across refreshes
						FlowCredentialService.saveFlowCredentials({
							flowKey: 'implicit-v7',
							credentials: updated
						}).then(() => {
							console.log('[Implicit Flow V7] Redirect URI auto-saved to V7 storage');
						}).catch((error: any) => {
							console.error('[Implicit Flow V7] Failed to auto-save redirect URI:', error);
						});
						
						// Also save using controller for backward compatibility
						controller.saveCredentials()
							.then(() => {
								console.log('[Implicit Flow V7] Redirect URI auto-saved to controller');
							})
							.catch((error: any) => {
								console.error('[Implicit Flow V7] Failed to auto-save redirect URI to controller:', error);
							});
					}}
					onScopesChange={(value) => {
						const updated = { ...credentials, scope: value, scopes: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
						console.log('[Implicit Flow V7] Scopes updated:', value);
					}}
					onLoginHintChange={(value) => {
						const updated = { ...credentials, loginHint: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
					}}
					
					// Save handler for credentials
					onSave={async () => {
						try {
							// Save using V7 standardized storage
							await FlowCredentialService.saveFlowCredentials({
								flowKey: 'implicit-v7',
								credentials: credentials
							});
							
							// Also save using controller for backward compatibility
							await controller.saveCredentials();
							v4ToastManager.showSuccess('Credentials saved successfully!');
							// Clear any previous error details on success
							setErrorDetails(null);
						} catch (error) {
							console.error('[Implicit Flow V7] Failed to save credentials:', error);
							
							// Use the new OAuth Error Handling Service
							const errorDetails = OAuthErrorHandlingService.parseOAuthError(error, {
								flowType: 'implicit',
								stepId: 'save-credentials',
								operation: 'saveCredentials',
								credentials: {
									hasClientId: !!credentials.clientId,
									hasClientSecret: !!credentials.clientSecret,
									hasEnvironmentId: !!credentials.environmentId,
									hasRedirectUri: !!credentials.redirectUri,
									hasScope: !!credentials.scope
								},
								metadata: {
									flowVariant: selectedVariant,
									clientAuthMethod: credentials.clientAuthMethod
								}
							});
							
							v4ToastManager.showError(errorDetails.message);
							setErrorDetails(errorDetails);
						}
					}}
					
					// Discovery handler
					onDiscoveryComplete={(result) => {
						console.log('[Implicit Flow V7] OIDC Discovery completed:', result);
						// Extract environment ID from issuer URL using the standard service
						if (result.issuerUrl) {
							const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.issuerUrl);
							if (extractedEnvId) {
								const updated = { ...credentials, environmentId: extractedEnvId };
								setCredentials(updated);
								console.log('[Implicit Flow V7] Auto-extracted Environment ID:', extractedEnvId);
							}
						}
					}}
					
					// Configuration
					requireClientSecret={false}
					showAdvancedConfig={false} // Implicit flow deprecated, no token endpoint for client auth
					defaultCollapsed={false}

					// App Creation Handler
					onCreateApplication={async (appData?: { name: string; description: string }) => {
						try {
							// Import the service dynamically
							const { pingOneAppCreationService } = await import('../../services/pingOneAppCreationService');
							
							// Initialize the service
							pingOneAppCreationService.initialize(workerToken, credentials.environmentId || '');
							
							// Generate app name with PingOne and flow type
							const generateAppName = (flowType: string) => {
								// Extract the actual flow name from flowType
								let flowName = flowType.replace(/[-_]/g, '-').toLowerCase();
								
								// For specific flow types, use the main flow name
								if (flowName.includes('implicit')) {
									flowName = 'implicit';
								} else if (flowName.includes('authorization-code')) {
									flowName = 'authorization-code';
								} else if (flowName.includes('device-authorization')) {
									flowName = 'device-authorization';
								} else if (flowName.includes('client-credentials')) {
									flowName = 'client-credentials';
								} else if (flowName.includes('hybrid')) {
									flowName = 'hybrid';
								}
								
								const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
								return `pingone-${flowName}-${uniqueId}`;
							};
							
							// Generate redirect URI with flow name and unique 3-digit number
							const generateRedirectUri = (flowType: string) => {
								// Extract the actual flow name from flowType (same logic as app name)
								let flowName = flowType.replace(/[-_]/g, '-').toLowerCase();
								
								// For specific flow types, use the main flow name
								if (flowName.includes('implicit')) {
									flowName = 'implicit';
								} else if (flowName.includes('authorization-code')) {
									flowName = 'authorization-code';
								} else if (flowName.includes('device-authorization')) {
									flowName = 'device-authorization';
								} else if (flowName.includes('client-credentials')) {
									flowName = 'client-credentials';
								} else if (flowName.includes('hybrid')) {
									flowName = 'hybrid';
								}
								
								const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
								return `https://localhost:3000/callback/${flowName}-${uniqueId}`;
							};
							
							const generatedAppName = generateAppName('implicit');
							const generatedRedirectUri = generateRedirectUri('implicit');
							
							// Create the app
							const result = await pingOneAppCreationService.createSinglePageApp({
								name: appData?.name || generatedAppName,
								description: appData?.description || `Created via OAuth Playground - Implicit Flow`,
								enabled: true,
								type: 'SINGLE_PAGE_APP',
								redirectUris: [generatedRedirectUri],
								grantTypes: ['authorization_code', 'implicit'],
								responseTypes: ['code', 'token', 'id_token'],
								tokenEndpointAuthMethod: 'none',
								pkceEnforcement: 'REQUIRED',
								scopes: credentials.scope?.split(' ') || ['openid', 'profile', 'email'],
								accessTokenValiditySeconds: 3600,
								refreshTokenValiditySeconds: 2592000,
								idTokenValiditySeconds: 3600,
							});
							
							if (result.success && result.app) {
								// Update credentials with the new application details
								const updated = {
									...credentials,
									clientId: result.app.clientId,
									clientSecret: result.app.clientSecret || credentials.clientSecret,
									redirectUri: generatedRedirectUri, // Update with the generated redirect URI
								};
								
								// Update local state
								setCredentials(updated);
								
								// Update controller
								controller.setCredentials(updated);
								
								// Save credentials to persist across refreshes
								await controller.saveCredentials();
								
								console.log('[Implicit Flow V7] Updated credentials with new app details:', {
									clientId: result.app.clientId,
									hasSecret: !!result.app.clientSecret
								});
								
								v4ToastManager.showSuccess(`Application "${result.app.name}" created successfully! Credentials updated and saved.`);
							} else {
								v4ToastManager.showError(`Failed to create application: ${result.error}`);
							}
						} catch (error) {
							console.error('[Implicit Flow V7] Failed to create PingOne application:', error);
							v4ToastManager.showError(`Failed to create application: ${error instanceof Error ? error.message : 'Unknown error'}`);
						}
					}}

					// Config Checker
					showConfigChecker={true}
					workerToken={workerToken}
					region={'NA'}
				/>
			</>
		);
	};

	const renderStepContent = useMemo(() => {
		const tokens = controller.tokens;

		switch (currentStep) {
			case 0:
				return renderStep0();
			case 1:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authRequestOverview')}
								aria-expanded={!collapsedSections.authRequestOverview}
							>
								<CollapsibleTitle>
									<FiGlobe /> Authorization Request Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authRequestOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authRequestOverview && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiGlobe size={20} />
										<div>
											<InfoTitle>Building the Authorization URL</InfoTitle>
											<InfoText>
												The authorization URL includes all OAuth parameters. Unlike Authorization
												Code flow, the response_type is 'token' or 'id_token token', telling PingOne
												to return tokens directly instead of an authorization code.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Implicit Flow Specific Parameters</InfoTitle>
											<InfoList>
												<li>
													<StrongText>response_type:</StrongText> {selectedVariant === 'oidc' ? 'id_token token' : 'token'} ({selectedVariant === 'oidc' ? 'OIDC' : 'OAuth'} variant)
												</li>
												<li>
													<StrongText>nonce:</StrongText>{' '}
													<span style={{ color: selectedVariant === 'oidc' ? '#059669' : '#dc2626' }}>
														{selectedVariant === 'oidc' ? 'Required' : 'Not used'}
													</span>{' '}
													({selectedVariant === 'oidc' ? 'ID token protection' : 'No ID token'})
												</li>
												<li>
													<StrongText>state:</StrongText> CSRF protection (recommended)
												</li>
												<li>
													<StrongText>No PKCE:</StrongText> Implicit flow doesn't support PKCE
												</li>
												<li>
													<StrongText>Tokens:</StrongText> {selectedVariant === 'oidc' ? 'Access Token + ID Token' : 'Access Token only'}
												</li>
												<li>
													<StrongText>Scopes (PingOne):</StrongText> {selectedVariant === 'oidc' ? 'openid required (OIDC spec)' : 'openid required (PingOne-specific) + custom scopes'}
												</li>
											</InfoList>
										</div>
									</InfoBox>

									{selectedVariant === 'oidc' && (
										<InfoBox $variant="warning">
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>OIDC Requirements</InfoTitle>
												<InfoText>
													OIDC Implicit Flow requires the <StrongText>"openid"</StrongText> scope to receive an ID token.
													Make sure your application is configured with the openid scope.
												</InfoText>
											</div>
										</InfoBox>
									)}

									<InfoBox $variant="danger">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Security Warning</InfoTitle>
											<InfoText>
												<StrongText>Implicit Flow is deprecated</StrongText> and should not be used in production.
												Tokens are exposed in the URL and can be intercepted. Use Authorization Code + PKCE instead.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SectionDivider />

						<ResultsSection>
							<ResultsHeading>
								<FiCheckCircle size={18} /> Generate Authorization URL
							</ResultsHeading>
							<HelperText>
								Generate the authorization URL with Implicit flow parameters. Review it carefully
								before redirecting.
							</HelperText>

							{(!credentials.clientId || !credentials.environmentId) && (
								<InfoBox $variant="warning" style={{ marginBottom: '1.5rem' }}>
									<FiAlertCircle size={20} />
									<div>
										<InfoTitle>Missing Required Credentials</InfoTitle>
										<InfoText>
											<StrongText>Environment ID</StrongText> and <StrongText>Client ID</StrongText>{' '}
											are required to generate the authorization URL. Please go back to Step 0 to
											fill in these credentials first.
										</InfoText>
										<InfoText style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
											Client ID: {credentials.clientId || 'EMPTY'} | Environment ID: {credentials.environmentId || 'EMPTY'}
										</InfoText>
									</div>
								</InfoBox>
							)}

							<ActionRow>
								<HighlightedActionButton
									onClick={controller.generateAuthorizationUrl}
									$priority="primary"
									disabled={
										!!controller.authUrl || !credentials.clientId || !credentials.environmentId
									}
									title={
										!credentials.clientId || !credentials.environmentId
											? `Complete Step 0: Fill in Environment ID and Client ID first (Client ID: ${credentials.clientId ? '✓' : '✗'}, Environment ID: ${credentials.environmentId ? '✓' : '✗'})`
											: 'Generate RFC 6749 compliant authorization URL with current credentials'
									}
								>
									{controller.authUrl ? <FiCheckCircle /> : <FiGlobe />}{' '}
									{controller.authUrl
										? 'Authorization URL Generated'
										: 'Generate Authorization URL'}
									<HighlightBadge>1</HighlightBadge>
								</HighlightedActionButton>

								{controller.authUrl && (
									<HighlightedActionButton onClick={controller.handleRedirectAuthorization} $priority="success">
										<FiExternalLink /> Redirect to PingOne
										<HighlightBadge>2</HighlightBadge>
									</HighlightedActionButton>
								)}
							</ActionRow>

							{controller.authUrl && (
								<GeneratedContentBox>
									<GeneratedLabel>Generated Authorization URL (RFC 6749 Compliant)</GeneratedLabel>
									<ColoredUrlDisplay
										url={controller.authUrl}
										label={`${selectedVariant.toUpperCase()} Implicit Flow Authorization URL`}
										showCopyButton={true}
										showInfoButton={true}
										showOpenButton={true}
										onOpen={controller.handleRedirectAuthorization}
									/>
								</GeneratedContentBox>
							)}
						</ResultsSection>
					</>
				);
			case 2:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenResponseOverview')}
								aria-expanded={!collapsedSections.tokenResponseOverview}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Token Response Overview
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenResponseOverview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenResponseOverview && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>Tokens Received Directly</InfoTitle>
											<InfoText>
												In Implicit Flow, tokens come back in the URL fragment (#) immediately after
												authorization. No token exchange step is needed, making it simpler but
												exposing tokens in the browser.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{/* Token Response Details Section */}
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenResponseDetails')}
								aria-expanded={!collapsedSections.tokenResponseDetails}
							>
								<CollapsibleTitle>
									<FiCode /> Token Response Details
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenResponseDetails}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenResponseDetails && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>URL Fragment Response Format</InfoTitle>
											<InfoText>
												In Implicit Flow, tokens are returned in the URL fragment (#) as key-value pairs.
												This allows the client to extract tokens without a server-side exchange.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertTriangle size={20} />
										<div>
											<InfoTitle>Security Considerations</InfoTitle>
											<InfoText>
												Implicit Flow has inherent security limitations. Tokens are exposed in
												the URL, making them vulnerable to interception. This step demonstrates
												security best practices and mitigation strategies.
											</InfoText>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{tokens && (
							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => toggleSection('tokenResponse')}
									aria-expanded={!collapsedSections.tokenResponse}
								>
									<CollapsibleTitle>
										<FiCheckCircle /> Token Response
									</CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.tokenResponse}>
										<FiChevronDown />
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								{!collapsedSections.tokenResponse && (
									<CollapsibleContent>
										<HelperText>
											Review the tokens received. In Implicit Flow, there is no refresh token.
										</HelperText>

										{/* Raw Response Display */}
										<GeneratedContentBox>
											<GeneratedLabel>Raw Token Response</GeneratedLabel>
											<CodeBlock>{JSON.stringify(tokens, null, 2)}</CodeBlock>
											<ActionRow>
												<CopyButtonService
													text={JSON.stringify(tokens, null, 2)}
													label="Copy JSON Response"
													variant="primary"
												/>
											</ActionRow>
										</GeneratedContentBox>

										{UnifiedTokenDisplayService.showTokens(
											tokens,
											selectedVariant,
											'implicit-v7',
											{
												showCopyButtons: true,
												showDecodeButtons: true,
											}
										)}

										{/* Security Warnings */}
										<InfoBox $variant="warning">
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>No Refresh Token</InfoTitle>
												<InfoText>
													Implicit Flow does not provide refresh tokens for security reasons. When the
													access token expires, users must re-authenticate.
												</InfoText>
											</div>
										</InfoBox>
									</CollapsibleContent>
								)}
							</CollapsibleSection>
						)}
					</>
				);
			case 3:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenAnalysis')}
								aria-expanded={!collapsedSections.tokenAnalysis}
							>
								<CollapsibleTitle>
									<FiShield /> Token Analysis & Security
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenAnalysis}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenAnalysis && (
								<CollapsibleContent>
									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>Token Analysis Service</InfoTitle>
											<InfoText>
												The UnifiedTokenDisplayService provides consistent token presentation across all OAuth flows,
												with automatic JWT detection, decode functionality, and token management integration.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertTriangle size={20} />
										<div>
											<InfoTitle>Implicit Flow Security Risks</InfoTitle>
											<InfoText>
												Tokens are exposed in the browser URL, making them vulnerable to:
											</InfoText>
											<InfoList>
												<li><StrongText>Browser History:</StrongText> Tokens saved in browser history</li>
												<li><StrongText>Network Interception:</StrongText> Visible in network logs</li>
												<li><StrongText>Shoulder Surfing:</StrongText> Visible on screen</li>
												<li><StrongText>Server Logs:</StrongText> May be logged by web servers</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						{tokens && (
							<ResultsSection>
								<ResultsHeading>
									<FiCheckCircle size={18} /> Token Validation Results
								</ResultsHeading>

								<GeneratedContentBox>
									<GeneratedLabel>Token Security Analysis</GeneratedLabel>
									<ParameterGrid>
										<div>
											<ParameterLabel>Token Format</ParameterLabel>
											<ParameterValue style={{
												color: tokens.access_token?.includes('.') ? '#059669' : '#6b7280',
												fontWeight: 'bold'
											}}>
												{tokens.access_token?.includes('.') ? 'JWT (Structured)' : 'Opaque (Reference)'}
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Token Length</ParameterLabel>
											<ParameterValue>
												{tokens.access_token?.length || 0} characters
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Expires At</ParameterLabel>
											<ParameterValue>
												{tokens.expires_in
													? new Date(Date.now() + (tokens.expires_in * 1000)).toLocaleString()
													: 'Unknown'
												}
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Security Level</ParameterLabel>
											<ParameterValue style={{ color: '#dc2626', fontWeight: 'bold' }}>
												LOW - Exposed in URL
											</ParameterValue>
										</div>
									</ParameterGrid>

									<ActionRow style={{ justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
										<Button onClick={() => {}} variant="primary">
											<FiExternalLink /> Advanced Token Management
										</Button>
									</ActionRow>
								</GeneratedContentBox>
							</ResultsSection>
						)}
					</>
				);
			case 4:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('securityReview')}
								aria-expanded={!collapsedSections.securityReview}
							>
								<CollapsibleTitle>
									<FiShield /> Security Best Practices Review
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.securityReview}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.securityReview && (
								<CollapsibleContent>
									<InfoBox $variant="danger">
										<FiAlertTriangle size={20} />
										<div>
											<InfoTitle>⚠️ DEPRECATED FLOW - NOT RECOMMENDED</InfoTitle>
											<InfoText>
												The OAuth 2.0 Implicit Flow is <StrongText>deprecated</StrongText> and should
												<StrongText> NOT be used in production applications</StrongText>.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>Recommended Alternative</InfoTitle>
											<InfoText>
												Use <StrongText>Authorization Code Flow with PKCE</StrongText> for all new applications.
												It provides better security and is the OAuth 2.1 standard.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Security Comparison</InfoTitle>
											<InfoList>
												<li><StrongText>Authorization Code + PKCE:</StrongText> High security, refresh tokens, no URL exposure</li>
												<li><StrongText>Implicit Flow:</StrongText> Low security, no refresh tokens, URL exposure</li>
												<li><StrongText>OAuth 2.1:</StrongText> Current standard with enhanced security</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SecurityFeaturesDemo
							flowType="implicit"
							flowKey="implicit-v7"
							tokens={tokens}
							credentials={credentials}
							variant={selectedVariant}
						/>
					</>
				);
			case 5:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('flowSummary')}
								aria-expanded={!collapsedSections.flowSummary}
							>
								<CollapsibleTitle>
									<FiCheckCircle /> Flow Completion Summary
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.flowSummary}>
									<FiChevronDown />
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.flowSummary && (
								<CollapsibleContent>
									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>{selectedVariant.toUpperCase()} Implicit Flow Completed</InfoTitle>
											<InfoText>
												You have successfully completed the {selectedVariant.toUpperCase()} Implicit Flow.
												Tokens were received and validated according to OAuth 2.0 specifications.
											</InfoText>
										</div>
									</InfoBox>

									<GeneratedContentBox>
										<GeneratedLabel>Flow Summary</GeneratedLabel>
										<ParameterGrid>
											<div>
												<ParameterLabel>Flow Variant</ParameterLabel>
												<ParameterValue>{selectedVariant.toUpperCase()}</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Response Type</ParameterLabel>
												<ParameterValue>{selectedVariant === 'oidc' ? 'id_token token' : 'token'}</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Tokens Received</ParameterLabel>
												<ParameterValue>
													{selectedVariant === 'oidc' ? 'Access Token + ID Token' : 'Access Token only'}
												</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Security Level</ParameterLabel>
												<ParameterValue style={{ color: '#dc2626' }}>Deprecated - Low Security</ParameterValue>
											</div>
										</ParameterGrid>
									</GeneratedContentBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<FlowCompletionService
							config={{
								...FlowCompletionConfigs.implicit,
								onStartNewFlow: () => {
									setCurrentStep(0);
									controller.resetFlow();
								}
							}}
							collapsed={false}
						/>
					</>
				);
			default:
				return <div>Step {currentStep} - Not implemented yet</div>;
		}
	}, [currentStep, selectedVariant, collapsedSections, controller, credentials, controller.tokens, toggleSection]);

	const STEP_METADATA = [
		{ title: 'Step 0: Setup & Configuration', subtitle: 'Choose variant and configure credentials' },
		{ title: 'Step 1: Generate Authorization URL', subtitle: 'Build and generate the authorization URL' },
		{ title: 'Step 2: User Authorization', subtitle: 'Complete authorization and receive tokens' },
		{ title: 'Step 3: Token Analysis', subtitle: 'Inspect and validate received tokens' },
		{ title: 'Step 4: Security Review', subtitle: 'Review security features and best practices' },
		{ title: 'Step 5: Flow Complete', subtitle: 'Summary and next steps' },
	];

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="implicit-v7" />

				<EnhancedFlowInfoCard
					flowType="implicit"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={true}
				/>

				{/* Error Display */}
				{errorDetails && (
					<OAuthErrorDisplay
						errorDetails={errorDetails}
						onDismiss={() => setErrorDetails(null)}
						onRetry={() => {
							setErrorDetails(null);
							// Retry the last operation - could be save credentials or other operations
						}}
						showCorrelationId={true}
					/>
				)}

				<MainCard>
					<DynamicStepHeader $variant={selectedVariant}>
						<StepHeaderLeft>
							<DynamicVersionBadge $variant={selectedVariant}>V7</DynamicVersionBadge>
							<div>
								<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
								<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
							</div>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</DynamicStepHeader>

					{/* V7 Variant Selector - Now inside MainCard below Step Header */}
					{renderVariantSelector()}

					<StepContentWrapper>
						{renderStepContent}
					</StepContentWrapper>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
					onReset={() => {
						setCurrentStep(0);
						controller.resetFlow();
						
						// Clear Implicit Flow V7-specific storage
						FlowCredentialService.clearFlowState('implicit-v7');
						console.log('🔧 [Implicit V7] Cleared flow-specific storage');
						
						// Clear credential backup when flow is reset
						clearBackup();
					}}
					onNext={() => setCurrentStep(prev => Math.min(prev + 1, STEP_METADATA.length - 1))}
					canNavigateNext={isStepValid(currentStep)}
					isFirstStep={currentStep === 0}
					nextButtonText="Next"
					disabledMessage=""
				/>
			</ContentWrapper>
		</Container>
	);
};

export default ImplicitFlowV7;