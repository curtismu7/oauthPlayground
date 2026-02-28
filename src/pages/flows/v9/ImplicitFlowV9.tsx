// src/pages/flows/ImplicitFlowV9.tsx
// Unified OAuth/OIDC Implicit Flow V9 - Single implementation supporting both variants

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiCode,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiShield,
} from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import ColoredUrlDisplay from '../../../components/ColoredUrlDisplay';
// Import components
import EnhancedFlowInfoCard from '../../../components/EnhancedFlowInfoCard';
import { EducationModeToggle } from '../../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../../components/education/MasterEducationSection';
import { LearningTooltip } from '../../../components/LearningTooltip';
import OAuthErrorDisplay from '../../../components/OAuthErrorDisplay';
import SecurityFeaturesDemo from '../../../components/SecurityFeaturesDemo';
import { StepNavigationButtons } from '../../../components/StepNavigationButtons';
import type { StepCredentials } from '../../../components/steps/CommonSteps';
import { useCredentialBackup } from '../../../hooks/useCredentialBackup';
import {
	loadInitialCredentials,
	useImplicitFlowController,
} from '../../../hooks/useImplicitFlowController';
import { usePageScroll } from '../../../hooks/usePageScroll';
import ComprehensiveCredentialsService from '../../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../../services/comprehensiveFlowDataService';
import { CopyButtonService } from '../../../services/copyButtonService';
import {
	FlowCompletionConfigs,
	FlowCompletionService,
} from '../../../services/flowCompletionService';
import { FlowCredentialService } from '../../../services/flowCredentialService';
import { FlowHeader } from '../../../services/flowHeaderService';
// Import UI components from services
import { FlowUIService } from '../../../services/flowUIService';
// Import shared services
import {
	ImplicitFlowSharedService,
	ImplicitFlowV9Helpers,
} from '../../../services/implicitFlowSharedService';
import {
	OAuthErrorDetails,
	OAuthErrorHandlingService,
} from '../../../services/oauthErrorHandlingService';
import { oidcDiscoveryService } from '../../../services/oidcDiscoveryService';
import { UnifiedTokenDisplayService } from '../../../services/unifiedTokenDisplayService';
import { checkCredentialsAndWarn } from '../../../utils/credentialsWarningService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';

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
	HighlightBadge,
} = FlowUIService.getFlowUIComponents();

// Local styled components with dynamic colors
const DynamicStepHeader = styled(StepHeader)<{ $variant: 'oauth' | 'oidc' }>`
	background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'};
	color: #ffffff;
`;

// Ensure title and number are white on dark background
const DynamicStepHeaderTitle = styled(StepHeaderTitle)`
	color: #ffffff;
`;

const DynamicStepNumber = styled(StepNumber)`
	color: #ffffff;
`;

const DynamicVersionBadge = styled(VersionBadge)<{ $variant: 'oauth' | 'oidc' }>`
	background: ${(props) =>
		props.$variant === 'oidc' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(22, 163, 74, 0.2)'};
	border: 1px solid ${(props) => (props.$variant === 'oidc' ? '#60a5fa' : '#4ade80')};
	color: ${(props) => (props.$variant === 'oidc' ? '#dbeafe' : '#bbf7d0')};
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
	border: 2px solid ${(props) => (props.$selected ? '#3b82f6' : '#cbd5e1')};
	background: ${(props) => (props.$selected ? '#dbeafe' : 'white')};
	color: ${(props) => (props.$selected ? '#1e40af' : '#475569')};
	font-weight: ${(props) => (props.$selected ? '600' : '500')};
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

const ImplicitFlowV9: React.FC = () => {
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
		const state = location.state as { fromSection?: string } | null;
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
		flowKey: 'implicit-v9',
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
		console.log('[ImplicitFlowV9] Initial credentials from controller:', initialCreds);
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
			console.log('[ImplicitFlowV9] Worker token loaded from location state');
			return;
		}

		// If not in location state, try to load from localStorage
		const savedToken = localStorage.getItem('worker-token');
		const savedEnv = localStorage.getItem('worker-token-env');

		if (savedToken && savedEnv) {
			setWorkerToken(savedToken);
			console.log('[ImplicitFlowV9] Worker token loaded from localStorage');
		} else {
			console.log('[ImplicitFlowV9] No worker token found in location state or localStorage');
		}
	}, [location.state]);

	// Process tokens from URL fragment on mount or when tokens change
	useEffect(() => {
		const hash = window.location.hash;
		console.log('[ImplicitFlowV9] Checking for tokens in URL fragment on mount:', hash);

		if (hash?.includes('access_token') && !controller.tokens) {
			console.log('[ImplicitFlowV9] Found tokens in URL fragment, processing...');
			controller.setTokensFromFragment(hash);
			// Clean up URL
			window.history.replaceState({}, '', window.location.pathname);
		}
	}, [controller.tokens, controller.setTokensFromFragment]);

	// Handle token reception and step advancement
	useEffect(() => {
		if (controller.tokens && currentStep < 2) {
			console.log('[ImplicitFlowV9] Tokens received, advancing to step 2');
			setCurrentStep(2);
		}
	}, [controller.tokens, currentStep]);

	// Sync local credentials with controller credentials
	useEffect(() => {
		if (
			controller.credentials &&
			(controller.credentials.environmentId !== credentials.environmentId ||
				controller.credentials.clientId !== credentials.clientId ||
				controller.credentials.redirectUri !== credentials.redirectUri ||
				controller.credentials.scope !== credentials.scope ||
				controller.credentials.scopes !== credentials.scopes)
		) {
			console.log('[ImplicitFlowV9] Syncing credentials from controller:', controller.credentials);
			console.log('[ImplicitFlowV9] Current local credentials:', credentials);
			setCredentials(controller.credentials);
		}
	}, [controller.credentials, credentials]); // Removed credentials dependencies to prevent infinite loop

	// Load credentials on mount using V7 standardized storage
	useEffect(() => {
		const loadCredentials = async () => {
			console.log('[ImplicitFlowV9] Loading credentials on mount...');

			try {
				// Try V7 standardized storage first
				const flowData = comprehensiveFlowDataService.loadFlowDataComprehensive({
					flowKey: 'implicit-flow-v7',
					useSharedEnvironment: true,
					useSharedDiscovery: true,
				});

				if (flowData.flowCredentials && Object.keys(flowData.flowCredentials).length > 0) {
					console.log('✅ [ImplicitFlowV9] Found flow-specific credentials');
					const updatedCredentials = {
						environmentId: flowData.sharedEnvironment?.environmentId || '',
						clientId: flowData.flowCredentials.clientId,
						clientSecret: flowData.flowCredentials.clientSecret,
						redirectUri: flowData.flowCredentials.redirectUri,
						scopes: flowData.flowCredentials.scopes,
					};

					setCredentials(updatedCredentials);
					controller.setCredentials(updatedCredentials);
				} else if (flowData.sharedEnvironment?.environmentId) {
					console.log('ℹ️ [ImplicitFlowV9] Using shared environment data only');
					const updatedCredentials = {
						...controller.credentials,
						environmentId: flowData.sharedEnvironment.environmentId,
					};
					setCredentials(updatedCredentials);
					controller.setCredentials(updatedCredentials);
				} else {
					console.log('ℹ️ [ImplicitFlowV9] No saved credentials found, using defaults');
					const initialCredentials = loadInitialCredentials(selectedVariant, 'implicit-flow-v7');
					setCredentials(initialCredentials);
					controller.setCredentials(initialCredentials);
				}
			} catch (error) {
				console.error('[ImplicitFlowV9] Failed to load V7 credentials:', error);
				// Fallback to legacy method on error
				const initialCredentials = loadInitialCredentials(selectedVariant, 'implicit-v9');
				setCredentials(initialCredentials);
				controller.setCredentials(initialCredentials);
			}
		};

		loadCredentials();
	}, [selectedVariant, controller.credentials, controller.setCredentials]); // Removed controller dependency to prevent infinite loop

	// Update controller when variant changes and reload credentials
	useEffect(() => {
		controller.setFlowVariant(selectedVariant);
		ImplicitFlowV9Helpers.getSessionHelpers(selectedVariant).setActiveFlow();

		// Reload variant-specific credentials
		const reloadedCredentials = loadInitialCredentials(selectedVariant, 'implicit-v9');
		controller.setCredentials(reloadedCredentials);
		setCredentials(reloadedCredentials);
		console.log('[ImplicitFlowV9] Variant changed, reloaded credentials:', reloadedCredentials);
	}, [selectedVariant, controller.setFlowVariant, controller.setCredentials]);

	// Sync credentials with variant
	useEffect(() => {
		const variantDefaults = ImplicitFlowV9Helpers.getFlowMetadata(selectedVariant);
		setCredentials((prev) => ({
			...prev,
			scope: variantDefaults.scopes || prev.scope || '',
			scopes: variantDefaults.scopes || prev.scopes || '',
			responseType: variantDefaults.responseType,
		}));
	}, [selectedVariant]);

	// Ensure Implicit Flow V9 uses its own credential storage
	useEffect(() => {
		// Save current credentials to flow-specific storage
		if (
			controller.credentials &&
			(controller.credentials.environmentId || controller.credentials.clientId)
		) {
			console.log('🔧 [Implicit V7] Saving credentials to flow-specific storage:', {
				flowKey: 'implicit-v9',
				environmentId: controller.credentials.environmentId,
				clientId: `${controller.credentials.clientId?.substring(0, 8)}...`,
				redirectUri: controller.credentials.redirectUri,
			});

			// Save to comprehensive service with complete isolation
			const success = comprehensiveFlowDataService.saveFlowDataComprehensive('implicit-flow-v7', {
				sharedEnvironment: controller.credentials.environmentId
					? {
							environmentId: controller.credentials.environmentId,
							region: 'us', // Default region
							issuerUrl: `https://auth.pingone.com/${controller.credentials.environmentId}`,
						}
					: undefined,
				flowCredentials: {
					clientId: controller.credentials.clientId,
					clientSecret: controller.credentials.clientSecret,
					redirectUri: controller.credentials.redirectUri,
					scopes: controller.credentials.scopes,
					logoutUrl: controller.credentials.logoutUrl,
					loginHint: controller.credentials.loginHint,
					tokenEndpointAuthMethod: 'client_secret_basic',
					lastUpdated: Date.now(),
				},
			});

			if (!success) {
				console.error('[ImplicitFlowV9] Failed to save credentials to comprehensive service');
			}
		}
	}, [controller.credentials]);

	// Use credential backup hook for automatic backup and restoration
	const { clearBackup } = useCredentialBackup({
		flowKey: 'implicit-v9',
		credentials: controller.credentials,
		setCredentials: controller.setCredentials,
		enabled: true,
	});

	usePageScroll({ pageName: 'Implicit Flow V9', force: true });

	// Check credentials on mount and show warning if missing
	useEffect(() => {
		checkCredentialsAndWarn(credentials, {
			flowName: `${selectedVariant.toUpperCase()} Implicit Flow`,
			requiredFields: ['environmentId', 'clientId'],
			showToast: true,
		});
	}, [credentials, selectedVariant.toUpperCase]); // Only run once on mount

	// V7 Enhanced step validation
	const isStepValid = (step: number): boolean => {
		switch (step) {
			case 0:
				// Step 0: Must have valid credentials
				return !!(credentials.environmentId && credentials.clientId);
			case 1:
				// Step 1: Must have valid redirect URI
				return !!credentials.redirectUri;
			case 2:
				// Step 2: Must have generated authorization URL
				return !!controller.authUrl;
			case 3:
				// Step 3: Must have tokens from callback
				return !!(
					controller.tokens?.access_token ||
					(controller.tokens as Record<string, unknown>)?.accessToken
				);
			case 4:
				// Step 4: Must have completed token introspection
				return !!(
					controller.tokens?.access_token ||
					(controller.tokens as Record<string, unknown>)?.accessToken
				);
			default:
				return true; // Other steps are always valid
		}
	};

	const toggleSection =
		ImplicitFlowSharedService.CollapsibleSections.createToggleHandler(setCollapsedSections);

	const handleVariantChange = useCallback(
		(variant: 'oauth' | 'oidc') => {
			setSelectedVariant(variant);
			// Reset to step 0 when switching variants
			setCurrentStep(0);
			controller.resetFlow();

			// Update credentials based on variant (PingOne requires openid for both)
			setCredentials((prev) => ({
				...prev,
				scope: variant === 'oidc' ? 'openid profile email' : 'openid',
				scopes: variant === 'oidc' ? 'openid profile email' : 'openid',
				responseType: variant === 'oidc' ? 'id_token token' : 'token',
			}));

			v4ToastManager.showSuccess(`Switched to ${variant.toUpperCase()} Implicit Flow variant`);
		},
		[controller]
	);

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
				<VariantDescription>
					ID token + Access token - Authentication + Authorization
				</VariantDescription>
			</VariantButton>
		</VariantSelector>
	);

	const renderStep0 = useCallback(() => {
		const metadata = ImplicitFlowV9Helpers.getFlowMetadata(selectedVariant);
		const educationalContent = ImplicitFlowV9Helpers.getEducationalContent(selectedVariant);
		const flowDiagram = ImplicitFlowV9Helpers.getFlowDiagram(selectedVariant);
		const _requirements = ImplicitFlowV9Helpers.getRequirements(selectedVariant);

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
					postLogoutRedirectUri={
						credentials.postLogoutRedirectUri || 'https://localhost:3000/logout-callback'
					}
					// Individual change handlers
					onEnvironmentIdChange={(value) => {
						const updated = { ...credentials, environmentId: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
						console.log('[Implicit Flow V9] Environment ID updated:', value);
					}}
					onClientIdChange={(value) => {
						const updated = { ...credentials, clientId: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
						console.log('[Implicit Flow V9] Client ID updated:', value);
					}}
					onClientSecretChange={(value) => {
						const updated = { ...credentials, clientSecret: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
					}}
					onRedirectUriChange={(value) => {
						const updated = { ...credentials, redirectUri: value };
						setCredentials(updated);
						console.log('[ImplicitFlowV9] Setting controller credentials:', updated);
						controller.setCredentials(updated); // Sync with controller immediately
						console.log(
							'[ImplicitFlowV9] Controller credentials after set:',
							controller.credentials
						);
						console.log('[Implicit Flow V9] Redirect URI updated:', value);
						// Auto-save redirect URI to persist across refreshes
						comprehensiveFlowDataService.saveFlowDataComprehensive('implicit-flow-v7', {
							flowCredentials: {
								clientId: updated.clientId,
								clientSecret: updated.clientSecret,
								redirectUri: updated.redirectUri,
								scopes: updated.scopes,
								lastUpdated: Date.now(),
							},
						});

						// Also save using controller for backward compatibility
						controller
							.saveCredentials()
							.then(() => {
								console.log('[Implicit Flow V9] Redirect URI auto-saved to controller');
							})
							.catch((error: unknown) => {
								console.error(
									'[Implicit Flow V9] Failed to auto-save redirect URI to controller:',
									error
								);
							});
					}}
					onScopesChange={(value) => {
						// Filter out offline_access for Implicit flow since it never provides refresh tokens
						const scopeArray = value.split(/\s+/).filter((scope) => scope.trim());
						const hasOfflineAccess = scopeArray.includes('offline_access');

						let filteredScopes = value;
						if (hasOfflineAccess) {
							filteredScopes = scopeArray.filter((scope) => scope !== 'offline_access').join(' ');

							// Show warning to user
							v4ToastManager.showWarning(
								'offline_access removed - Implicit Flow never provides refresh tokens',
								{
									description:
										'Use Authorization Code flow if you need refresh tokens for offline access.',
									duration: 5000,
								}
							);

							console.log(
								'[Implicit Flow V9] Removed offline_access scope - Implicit flow never provides refresh tokens'
							);
						}

						const updated = { ...credentials, scope: filteredScopes, scopes: filteredScopes };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
						console.log('[Implicit Flow V9] Scopes updated:', filteredScopes);
					}}
					onLoginHintChange={(value) => {
						const updated = { ...credentials, loginHint: value };
						setCredentials(updated);
						controller.setCredentials(updated); // Sync with controller
					}}
					// Save handler for credentials
					onSave={async () => {
						try {
							// Save using comprehensive service with complete isolation
							const success = comprehensiveFlowDataService.saveFlowDataComprehensive(
								'implicit-flow-v7',
								{
									sharedEnvironment: credentials.environmentId
										? {
												environmentId: credentials.environmentId,
												region: 'us',
												issuerUrl: `https://auth.pingone.com/${credentials.environmentId}`,
											}
										: undefined,
									flowCredentials: {
										clientId: credentials.clientId,
										clientSecret: credentials.clientSecret,
										redirectUri: credentials.redirectUri,
										scopes: credentials.scopes,
										logoutUrl: credentials.logoutUrl,
										loginHint: credentials.loginHint,
										tokenEndpointAuthMethod: 'client_secret_basic',
										lastUpdated: Date.now(),
									},
								}
							);

							if (!success) {
								throw new Error('Failed to save credentials to comprehensive service');
							}

							// Also save using controller for backward compatibility
							await controller.saveCredentials();
							v4ToastManager.showSuccess('Credentials saved successfully!');
							// Clear any previous error details on success
							setErrorDetails(null);
						} catch (error) {
							console.error('[Implicit Flow V9] Failed to save credentials:', error);

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
									hasScope: !!credentials.scope,
								},
								metadata: {
									flowVariant: selectedVariant,
									clientAuthMethod: credentials.clientAuthMethod,
								},
							});

							v4ToastManager.showError(errorDetails.message);
							setErrorDetails(errorDetails);
						}
					}}
					// Discovery handler
					onDiscoveryComplete={(result) => {
						console.log('[Implicit Flow V9] OIDC Discovery completed:', result);
						// Extract environment ID from issuer URL using the standard service
						if (result.issuerUrl) {
							const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.issuerUrl);
							if (extractedEnvId) {
								const updated = { ...credentials, environmentId: extractedEnvId };
								setCredentials(updated);
								console.log('[Implicit Flow V9] Auto-extracted Environment ID:', extractedEnvId);
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
							const { pingOneAppCreationService } = await import(
								'../../../services/pingOneAppCreationService'
							);

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

								console.log('[Implicit Flow V9] Updated credentials with new app details:', {
									clientId: result.app.clientId,
									hasSecret: !!result.app.clientSecret,
								});

								v4ToastManager.showSuccess(
									`Application "${result.app.name}" created successfully! Credentials updated and saved.`
								);
							} else {
								v4ToastManager.showError(`Failed to create application: ${result.error}`);
							}
						} catch (error) {
							console.error('[Implicit Flow V9] Failed to create PingOne application:', error);
							v4ToastManager.showError(
								`Failed to create application: ${error instanceof Error ? error.message : 'Unknown error'}`
							);
						}
					}}
					// Config Checker - Disabled to remove pre-flight API calls
					showConfigChecker={false}
					workerToken={workerToken}
					region={'NA'}
				/>
			</>
		);
	}, [selectedVariant, collapsedSections, toggleSection, credentials, controller, workerToken]);

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
											<InfoTitle>
												Building the{' '}
												<LearningTooltip
													variant="info"
													title="Authorization URL"
													content="URL where user is redirected to authorize the application"
													placement="top"
												>
													Authorization URL
												</LearningTooltip>
											</InfoTitle>
											<InfoText>
												The{' '}
												<LearningTooltip
													variant="info"
													title="Authorization URL"
													content="URL for user authorization"
													placement="top"
												>
													authorization URL
												</LearningTooltip>{' '}
												includes all{' '}
												<LearningTooltip
													variant="info"
													title="OAuth Parameters"
													content="OAuth request parameters like client_id, redirect_uri, scope, state, response_type"
													placement="top"
												>
													OAuth parameters
												</LearningTooltip>
												. Unlike{' '}
												<LearningTooltip
													variant="learning"
													title="Authorization Code Flow"
													content="Secure OAuth flow using authorization code for token exchange"
													placement="top"
												>
													Authorization Code flow
												</LearningTooltip>
												, the{' '}
												<LearningTooltip
													variant="learning"
													title="response_type"
													content="OAuth parameter specifying requested tokens. Implicit uses 'token' or 'id_token token'."
													placement="top"
												>
													response_type
												</LearningTooltip>{' '}
												is{' '}
												<LearningTooltip
													variant="warning"
													title="Implicit response_type"
													content="'token' or 'id_token token' - returns tokens directly in URL fragment. DEPRECATED in OAuth 2.1."
													placement="top"
												>
													'token' or 'id_token token'
												</LearningTooltip>
												, telling{' '}
												<LearningTooltip
													variant="info"
													title="PingOne"
													content="Identity and access management platform"
													placement="top"
												>
													PingOne
												</LearningTooltip>{' '}
												to return{' '}
												<LearningTooltip
													variant="security"
													title="Tokens in URL"
													content="SECURITY RISK: Tokens exposed in browser URL fragment. Deprecated for this reason."
													placement="top"
												>
													tokens directly
												</LearningTooltip>{' '}
												instead of an{' '}
												<LearningTooltip
													variant="learning"
													title="Authorization Code"
													content="Short-lived code exchanged for tokens server-side (safer)"
													placement="top"
												>
													authorization code
												</LearningTooltip>
												.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiInfo size={20} />
										<div>
											<InfoTitle>
												<LearningTooltip
													variant="warning"
													title="Implicit Flow"
													content="OAuth 2.0 flow (RFC 6749 Section 4.2) - DEPRECATED in OAuth 2.1. Tokens returned in URL fragment. Use Authorization Code + PKCE instead."
													placement="top"
												>
													Implicit Flow
												</LearningTooltip>{' '}
												Specific Parameters
											</InfoTitle>
											<InfoList>
												<li>
													<StrongText>
														<LearningTooltip
															variant="learning"
															title="response_type"
															content="OAuth parameter. Implicit uses 'token' (OAuth) or 'id_token token' (OIDC)"
															placement="top"
														>
															response_type
														</LearningTooltip>
														:
													</StrongText>{' '}
													{selectedVariant === 'oidc' ? 'id_token token' : 'token'} (
													{selectedVariant === 'oidc' ? (
														<LearningTooltip
															variant="info"
															title="OIDC"
															content="OpenID Connect - adds authentication via ID token"
															placement="top"
														>
															OIDC
														</LearningTooltip>
													) : (
														<LearningTooltip
															variant="info"
															title="OAuth 2.0"
															content="Authorization framework"
															placement="top"
														>
															OAuth
														</LearningTooltip>
													)}{' '}
													variant)
												</li>
												<li>
													<StrongText>
														<LearningTooltip
															variant="security"
															title="nonce"
															content="Number used once - random value for replay protection. Required for OIDC ID tokens."
															placement="top"
														>
															nonce
														</LearningTooltip>
														:
													</StrongText>{' '}
													<span
														style={{ color: selectedVariant === 'oidc' ? '#059669' : '#dc2626' }}
													>
														{selectedVariant === 'oidc' ? 'Required' : 'Not used'}
													</span>{' '}
													(
													{selectedVariant === 'oidc' ? (
														<LearningTooltip
															variant="security"
															title="ID Token Protection"
															content="Nonce prevents ID token replay attacks"
															placement="top"
														>
															ID token protection
														</LearningTooltip>
													) : (
														'No ID token'
													)}
													)
												</li>
												<li>
													<StrongText>
														<LearningTooltip
															variant="security"
															title="state parameter"
															content="CSRF protection - random value that must match between request and callback"
															placement="top"
														>
															state
														</LearningTooltip>
														:
													</StrongText>{' '}
													<LearningTooltip
														variant="security"
														title="CSRF Protection"
														content="Cross-Site Request Forgery protection using state parameter"
														placement="top"
													>
														CSRF protection
													</LearningTooltip>{' '}
													(recommended)
												</li>
												<li>
													<StrongText>
														No{' '}
														<LearningTooltip
															variant="warning"
															title="PKCE"
															content="Proof Key for Code Exchange - security extension. Implicit flow doesn't support PKCE because it doesn't use authorization codes."
															placement="top"
														>
															PKCE
														</LearningTooltip>
														:
													</StrongText>{' '}
													Implicit flow doesn't support{' '}
													<LearningTooltip
														variant="warning"
														title="PKCE"
														content="RFC 7636 - not supported in Implicit flow"
														placement="top"
													>
														PKCE
													</LearningTooltip>
												</li>
												<li>
													<StrongText>
														<LearningTooltip
															variant="learning"
															title="Tokens"
															content="Access token and optionally ID token returned in URL fragment"
															placement="top"
														>
															Tokens
														</LearningTooltip>
														:
													</StrongText>{' '}
													{selectedVariant === 'oidc' ? (
														<>
															<LearningTooltip
																variant="learning"
																title="Access Token"
																content="Bearer token for API access"
																placement="top"
															>
																Access Token
															</LearningTooltip>
															{' + '}
															<LearningTooltip
																variant="learning"
																title="ID Token"
																content="OIDC JWT with user identity"
																placement="top"
															>
																ID Token
															</LearningTooltip>
														</>
													) : (
														<LearningTooltip
															variant="learning"
															title="Access Token"
															content="Bearer token for API access only"
															placement="top"
														>
															Access Token only
														</LearningTooltip>
													)}
												</li>
												<li>
													<StrongText>
														<LearningTooltip
															variant="learning"
															title="Scopes"
															content="Permissions requested from user"
															placement="top"
														>
															Scopes
														</LearningTooltip>{' '}
														(PingOne):
													</StrongText>{' '}
													{selectedVariant === 'oidc' ? (
														<>
															<LearningTooltip
																variant="info"
																title="openid scope"
																content="Required for OIDC flows to receive ID token"
																placement="top"
															>
																openid required
															</LearningTooltip>{' '}
															(OIDC spec)
														</>
													) : (
														<>
															<LearningTooltip
																variant="info"
																title="openid scope"
																content="PingOne requires openid scope even for OAuth flows"
																placement="top"
															>
																openid required
															</LearningTooltip>{' '}
															(PingOne-specific) + custom scopes
														</>
													)}
												</li>
											</InfoList>
										</div>
									</InfoBox>

									{selectedVariant === 'oidc' && (
										<InfoBox $variant="warning">
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>
													<LearningTooltip
														variant="info"
														title="OIDC"
														content="OpenID Connect - authentication layer on top of OAuth 2.0"
														placement="top"
													>
														OIDC
													</LearningTooltip>{' '}
													Requirements
												</InfoTitle>
												<InfoText>
													<LearningTooltip
														variant="warning"
														title="OIDC Implicit Flow"
														content="OIDC version of deprecated Implicit flow - returns ID token in URL fragment"
														placement="top"
													>
														OIDC Implicit Flow
													</LearningTooltip>{' '}
													requires the{' '}
													<StrongText>
														<LearningTooltip
															variant="info"
															title="openid scope"
															content="Mandatory scope for OIDC flows to receive ID token"
															placement="top"
														>
															"openid"
														</LearningTooltip>
													</StrongText>{' '}
													scope to receive an{' '}
													<LearningTooltip
														variant="learning"
														title="ID Token"
														content="OIDC JWT containing user identity information"
														placement="top"
													>
														ID token
													</LearningTooltip>
													. Make sure your application is configured with the{' '}
													<LearningTooltip
														variant="info"
														title="openid scope"
														content="Required OIDC scope"
														placement="top"
													>
														openid scope
													</LearningTooltip>
													.
												</InfoText>
											</div>
										</InfoBox>
									)}

									<InfoBox $variant="danger">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Security Warning</InfoTitle>
											<InfoText>
												<StrongText>
													<LearningTooltip
														variant="warning"
														title="Implicit Flow Deprecation"
														content="Removed from OAuth 2.1 (RFC 9207). Was part of OAuth 2.0 (RFC 6749 Section 4.2) but deprecated for security reasons."
														placement="top"
													>
														Implicit Flow is deprecated
													</LearningTooltip>
												</StrongText>{' '}
												and should not be used in production.
												<LearningTooltip
													variant="security"
													title="Token Exposure"
													content="Tokens in URL fragment are visible in browser history, logs, and can be intercepted by malicious scripts"
													placement="top"
												>
													Tokens are exposed in the URL
												</LearningTooltip>{' '}
												and can be intercepted. Use{' '}
												<LearningTooltip
													variant="learning"
													title="Authorization Code Flow"
													content="Secure OAuth flow using authorization code"
													placement="top"
												>
													Authorization Code
												</LearningTooltip>{' '}
												+{' '}
												<LearningTooltip
													variant="learning"
													title="PKCE"
													content="RFC 7636 - Proof Key for Code Exchange, security extension"
													placement="top"
												>
													PKCE
												</LearningTooltip>{' '}
												instead.
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
										<InfoText
											style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}
										>
											Client ID: {credentials.clientId || 'EMPTY'} | Environment ID:{' '}
											{credentials.environmentId || 'EMPTY'}
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
									<HighlightedActionButton
										onClick={controller.handleRedirectAuthorization}
										$priority="success"
									>
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
											<InfoTitle>
												<LearningTooltip
													variant="learning"
													title="Tokens"
													content="Access token and optionally ID token returned immediately"
													placement="top"
												>
													Tokens
												</LearningTooltip>{' '}
												Received Directly
											</InfoTitle>
											<InfoText>
												In{' '}
												<LearningTooltip
													variant="warning"
													title="Implicit Flow"
													content="Deprecated OAuth flow - tokens in URL fragment"
													placement="top"
												>
													Implicit Flow
												</LearningTooltip>
												,{' '}
												<LearningTooltip
													variant="learning"
													title="Tokens"
													content="Access token and/or ID token"
													placement="top"
												>
													tokens
												</LearningTooltip>{' '}
												come back in the{' '}
												<LearningTooltip
													variant="security"
													title="URL Fragment"
													content="Part of URL after # - not sent to server but visible in browser. SECURITY RISK: tokens exposed here."
													placement="top"
												>
													URL fragment (#)
												</LearningTooltip>{' '}
												immediately after authorization. No{' '}
												<LearningTooltip
													variant="learning"
													title="Token Exchange"
													content="Server-side step to exchange authorization code for tokens"
													placement="top"
												>
													token exchange step
												</LearningTooltip>{' '}
												is needed, making it simpler but exposing{' '}
												<LearningTooltip
													variant="security"
													title="Tokens in Browser"
													content="Tokens visible in browser URL, history, and can be intercepted"
													placement="top"
												>
													tokens in the browser
												</LearningTooltip>
												.
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
											<InfoTitle>
												<LearningTooltip
													variant="info"
													title="URL Fragment"
													content="URL part after # symbol - processed client-side, not sent to server"
													placement="top"
												>
													URL Fragment
												</LearningTooltip>{' '}
												Response Format
											</InfoTitle>
											<InfoText>
												In{' '}
												<LearningTooltip
													variant="warning"
													title="Implicit Flow"
													content="Deprecated OAuth flow"
													placement="top"
												>
													Implicit Flow
												</LearningTooltip>
												,{' '}
												<LearningTooltip
													variant="learning"
													title="Tokens"
													content="Access token and optionally ID token"
													placement="top"
												>
													tokens
												</LearningTooltip>{' '}
												are returned in the{' '}
												<LearningTooltip
													variant="security"
													title="URL Fragment"
													content="Part after # - tokens exposed here is a security risk"
													placement="top"
												>
													URL fragment (#)
												</LearningTooltip>{' '}
												as key-value pairs. This allows the{' '}
												<LearningTooltip
													variant="info"
													title="OAuth Client"
													content="Application requesting access"
													placement="top"
												>
													client
												</LearningTooltip>{' '}
												to extract{' '}
												<LearningTooltip
													variant="learning"
													title="Tokens"
													content="Access token and/or ID token"
													placement="top"
												>
													tokens
												</LearningTooltip>{' '}
												without a{' '}
												<LearningTooltip
													variant="info"
													title="Server-side Exchange"
													content="Safer method - exchanging code for tokens on backend server"
													placement="top"
												>
													server-side exchange
												</LearningTooltip>
												.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertTriangle size={20} />
										<div>
											<InfoTitle>Security Considerations</InfoTitle>
											<InfoText>
												Implicit Flow has inherent security limitations. Tokens are exposed in the
												URL, making them vulnerable to interception. This step demonstrates security
												best practices and mitigation strategies.
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

										{UnifiedTokenDisplayService.showTokens(tokens, selectedVariant, 'implicit-v9', {
											showCopyButtons: true,
											showDecodeButtons: true,
										})}

										{/* Security Warnings */}
										<InfoBox $variant="warning">
											<FiAlertCircle size={20} />
											<div>
												<InfoTitle>No Refresh Token</InfoTitle>
												<InfoText>
													Implicit Flow does not provide refresh tokens for security reasons. When
													the access token expires, users must re-authenticate.
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
												The UnifiedTokenDisplayService provides consistent token presentation across
												all OAuth flows, with automatic JWT detection, decode functionality, and
												token management integration.
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
												<li>
													<StrongText>Browser History:</StrongText> Tokens saved in browser history
												</li>
												<li>
													<StrongText>Network Interception:</StrongText> Visible in network logs
												</li>
												<li>
													<StrongText>Shoulder Surfing:</StrongText> Visible on screen
												</li>
												<li>
													<StrongText>Server Logs:</StrongText> May be logged by web servers
												</li>
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
											<ParameterValue
												style={{
													color: tokens.access_token?.includes('.') ? '#059669' : '#6b7280',
													fontWeight: 'bold',
												}}
											>
												{tokens.access_token?.includes('.')
													? 'JWT (Structured)'
													: 'Opaque (Reference)'}
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Token Length</ParameterLabel>
											<ParameterValue>{tokens.access_token?.length || 0} characters</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Expires At</ParameterLabel>
											<ParameterValue>
												{tokens.expires_in
													? new Date(Date.now() + tokens.expires_in * 1000).toLocaleString()
													: 'Unknown'}
											</ParameterValue>
										</div>
										<div>
											<ParameterLabel>Security Level</ParameterLabel>
											<ParameterValue style={{ color: '#dc2626', fontWeight: 'bold' }}>
												LOW - Exposed in URL
											</ParameterValue>
										</div>
									</ParameterGrid>

									<ActionRow
										style={{ justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}
									>
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
												The OAuth 2.0 Implicit Flow is <StrongText>deprecated</StrongText> and
												should
												<StrongText> NOT be used in production applications</StrongText>.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>Recommended Alternative</InfoTitle>
											<InfoText>
												Use <StrongText>Authorization Code Flow with PKCE</StrongText> for all new
												applications. It provides better security and is the OAuth 2.1 standard.
											</InfoText>
										</div>
									</InfoBox>

									<InfoBox $variant="warning">
										<FiAlertCircle size={20} />
										<div>
											<InfoTitle>Security Comparison</InfoTitle>
											<InfoList>
												<li>
													<StrongText>Authorization Code + PKCE:</StrongText> High security, refresh
													tokens, no URL exposure
												</li>
												<li>
													<StrongText>Implicit Flow:</StrongText> Low security, no refresh tokens,
													URL exposure
												</li>
												<li>
													<StrongText>OAuth 2.1:</StrongText> Current standard with enhanced
													security
												</li>
											</InfoList>
										</div>
									</InfoBox>
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<SecurityFeaturesDemo
							flowType="implicit"
							flowKey="implicit-v9"
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
												You have successfully completed the {selectedVariant.toUpperCase()} Implicit
												Flow. Tokens were received and validated according to OAuth 2.0
												specifications.
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
												<ParameterValue>
													{selectedVariant === 'oidc' ? 'id_token token' : 'token'}
												</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Tokens Received</ParameterLabel>
												<ParameterValue>
													{selectedVariant === 'oidc'
														? 'Access Token + ID Token'
														: 'Access Token only'}
												</ParameterValue>
											</div>
											<div>
												<ParameterLabel>Security Level</ParameterLabel>
												<ParameterValue style={{ color: '#dc2626' }}>
													Deprecated - Low Security
												</ParameterValue>
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

									// Clear any potential ConfigChecker-related state or cached data
									try {
										// Clear any comparison results or cached application data
										sessionStorage.removeItem('config-checker-diffs');
										sessionStorage.removeItem('config-checker-last-check');
										sessionStorage.removeItem('pingone-app-cache');
										localStorage.removeItem('pingone-applications-cache');

										// Clear any worker token related cache that might be used for pre-flight checks
										sessionStorage.removeItem('worker-token-cache');
										localStorage.removeItem('worker-apps-cache');

										console.log(
											'🔄 [Implicit V7] Start New Flow: cleared ConfigChecker and pre-flight cache data'
										);
									} catch (error) {
										console.warn('[Implicit V7] Failed to clear cache data:', error);
									}
								},
							}}
							collapsed={false}
						/>
					</>
				);
			default:
				return <div>Step {currentStep} - Not implemented yet</div>;
		}
	}, [
		currentStep,
		selectedVariant,
		collapsedSections,
		controller,
		credentials,
		controller.tokens,
		toggleSection,
		renderStep0,
	]);

	const STEP_METADATA = [
		{
			title: 'Step 0: Setup & Configuration',
			subtitle: 'Choose variant and configure credentials',
		},
		{
			title: 'Step 1: Generate Authorization URL',
			subtitle: 'Build and generate the authorization URL',
		},
		{ title: 'Step 2: User Authorization', subtitle: 'Complete authorization and receive tokens' },
		{ title: 'Step 3: Token Analysis', subtitle: 'Inspect and validate received tokens' },
		{ title: 'Step 4: Security Review', subtitle: 'Review security features and best practices' },
		{ title: 'Step 5: Flow Complete', subtitle: 'Summary and next steps' },
	];

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="implicit-v9" />

				{/* Education Mode Toggle */}
				<EducationModeToggle variant="buttons" />

				{/* Master Education Section */}
				<MasterEducationSection
					flowType="implicit"
					title="📚 Implicit Flow Education"
					sections={[
						{
							id: 'implicit-overview',
							title: 'Implicit Flow Overview',
							icon: <FiInfo />,
							summary:
								'Legacy OAuth flow - tokens returned directly in URL fragment (not recommended for new applications)',
							content: (
								<div>
									<p>
										<strong>The Implicit Flow</strong> is a legacy OAuth 2.0 flow where tokens are
										returned directly in the URL fragment:
									</p>
									<ul>
										<li>
											<strong>No Backend Required</strong> - Designed for browser-only applications
										</li>
										<li>
											<strong>Tokens in URL</strong> - Access tokens returned in URL fragment (#)
										</li>
										<li>
											<strong>No Refresh Tokens</strong> - Cannot securely store refresh tokens
										</li>
										<li>
											<strong>Security Concerns</strong> - Tokens exposed in browser history and
											logs
										</li>
									</ul>
									<p>
										<strong>⚠️ Not Recommended:</strong> OAuth 2.1 deprecates this flow. Use
										Authorization Code with PKCE instead.
									</p>
								</div>
							),
						},
						{
							id: 'oauth-vs-oidc',
							title: 'OAuth vs OIDC Variants',
							icon: <FiShield />,
							summary: 'OAuth returns access tokens, OIDC adds ID tokens for authentication',
							content: (
								<div>
									<p>
										<strong>Two Variants Available:</strong>
									</p>
									<ul>
										<li>
											<strong>OAuth Implicit</strong> - Returns access_token for API authorization
										</li>
										<li>
											<strong>OIDC Implicit</strong> - Returns id_token for user authentication
										</li>
									</ul>
									<p>Use the variant selector to switch between OAuth and OIDC modes.</p>
								</div>
							),
						},
					]}
				/>

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
								<DynamicStepHeaderTitle>{STEP_METADATA[currentStep].title}</DynamicStepHeaderTitle>
								<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
							</div>
						</StepHeaderLeft>
						<StepHeaderRight>
							<DynamicStepNumber>{String(currentStep + 1).padStart(2, '0')}</DynamicStepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</DynamicStepHeader>

					{/* V7 Variant Selector - Now inside MainCard below Step Header */}
					{renderVariantSelector()}

					<StepContentWrapper>{renderStepContent}</StepContentWrapper>
				</MainCard>

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
					onReset={() => {
						setCurrentStep(0);
						controller.resetFlow();

						// Clear Implicit Flow V9-specific storage
						FlowCredentialService.clearFlowState('implicit-v9');
						console.log('🔧 [Implicit V7] Cleared flow-specific storage');

						// Clear any potential ConfigChecker-related state or cached data
						try {
							// Clear any comparison results or cached application data
							sessionStorage.removeItem('config-checker-diffs');
							sessionStorage.removeItem('config-checker-last-check');
							sessionStorage.removeItem('pingone-app-cache');
							localStorage.removeItem('pingone-applications-cache');

							// Clear any worker token related cache that might be used for pre-flight checks
							sessionStorage.removeItem('worker-token-cache');
							localStorage.removeItem('worker-apps-cache');

							console.log(
								'🔄 [Implicit V7] Reset: cleared ConfigChecker and pre-flight cache data'
							);
						} catch (error) {
							console.warn('[Implicit V7] Failed to clear cache data:', error);
						}

						// Clear credential backup when flow is reset
						clearBackup();
					}}
					onNext={() => setCurrentStep((prev) => Math.min(prev + 1, STEP_METADATA.length - 1))}
					canNavigateNext={isStepValid(currentStep)}
					isFirstStep={currentStep === 0}
					nextButtonText="Next"
					disabledMessage=""
				/>
			</ContentWrapper>
		</Container>
	);
};

export default ImplicitFlowV9;
