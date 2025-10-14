// src/pages/flows/PingOnePARFlowV5.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePageScroll } from '../../hooks/usePageScroll';
import type { DisplayMode } from '../../components/DisplayParameterSelector';
import type { ClaimsRequestStructure } from '../../components/ClaimsRequestBuilder';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
} from 'react-icons/fi';
import { themeService } from '../../services/themeService'
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';;
import styled from 'styled-components';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { pingOneConfigService } from '../../services/pingoneConfigService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService, EnhancedApiCallData } from '../../services/enhancedApiCallDisplayService';
import { FlowHeader } from '../../services/flowHeaderService';
import AuthorizationCodeSharedService from '../../services/authorizationCodeSharedService';
import { FlowStorageService } from '../../services/flowStorageService';
import {
	STEP_METADATA,
	type IntroSectionKey,
	DEFAULT_APP_CONFIG,
	PAR_EDUCATION,
} from './config/PingOnePARFlow.config';

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
	font-size: 1.125rem;
	margin: 0;
	opacity: 0.9;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

// [REMOVED] Unused CollapsibleSection - migrated to CollapsibleHeader service
// [REMOVED] Local collapsible styled component

const CollapsibleTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

// [REMOVED] Local collapsible styled component

// [REMOVED] Local collapsible styled component

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
	
	/* Ensure URLs wrap properly */
	div {
		word-break: break-all;
		overflow-wrap: break-word;
		white-space: pre-wrap;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #1f2937;
	}
`;

const GeneratedLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const PingOnePARFlowV6: React.FC = () => {
	// Page scroll management
	usePageScroll({ pageName: 'PingOne PAR Flow V6', force: true });

	const controller = useAuthorizationCodeFlowController({
		flowKey: 'pingone-par-v6',
		defaultFlowVariant: 'oidc',
		enableDebugger: true,
	});

	// Use service for state initialization
	const [currentStep, setCurrentStep] = useState(() => 
		AuthorizationCodeSharedService.StepRestoration.getInitialStep('pingone-par-v6')
	);
	
	// Collapse all sections by default for cleaner UI
	const shouldCollapseAll = true;
	
	const [collapsedSections, setCollapsedSections] = useState<Record<IntroSectionKey, boolean>>(() =>
		AuthorizationCodeSharedService.CollapsibleSections.getDefaultState('pingone-par-v6')
	);

	// PAR-specific advanced parameters
	const [audience, setAudience] = useState<string>('');
	const [resources, setResources] = useState<string[]>([]);
	const [promptValues, setPromptValues] = useState<string[]>([]);
	const [displayMode, setDisplayMode] = useState<DisplayMode>('page');
	const [claimsRequest, setClaimsRequest] = useState<ClaimsRequestStructure | null>(null);
	const [isSavedAdvancedParams, setIsSavedAdvancedParams] = useState(false);

	// Load saved PAR advanced parameters on mount
	useEffect(() => {
		const saved = FlowStorageService.AdvancedParameters.get('par-v6');
		if (saved) {
			console.log('[PAR V6] Loading saved advanced parameters:', saved);
			setAudience(saved.audience || '');
			setResources(saved.resources || []);
			setPromptValues(saved.promptValues || []);
			setDisplayMode((saved.displayMode || 'page') as DisplayMode);
			setClaimsRequest(saved.claimsRequest || null);
		}
	}, []);

	// Save PAR advanced parameters
	const handleSaveAdvancedParams = useCallback(async () => {
		console.log('💾 [PAR V6] Saving advanced parameters:', {
			audience,
			resources,
			promptValues,
			displayMode,
			claimsRequest,
		});

		FlowStorageService.AdvancedParameters.set('par-v6', {
			audience,
			resources,
			promptValues,
			displayMode,
			claimsRequest,
		});

		setIsSavedAdvancedParams(true);
		setTimeout(() => setIsSavedAdvancedParams(false), 3000);

		v4ToastManager.showSuccess('Advanced parameters saved successfully!');
	}, [audience, resources, promptValues, displayMode, claimsRequest]);

	// PingOne Application Config
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>(DEFAULT_APP_CONFIG);

	// Scroll to top on step change
	useEffect(() => {
		AuthorizationCodeSharedService.StepRestoration.scrollToTopOnStepChange(currentStep, 'pingone-par-v6');
	}, [currentStep]);

	// PAR (Pushed Authorization Request) state
	const [parRequestUri, setParRequestUri] = useState<string | null>(null);
	const [parExpiresIn, setParExpiresIn] = useState<number | null>(null);
	const [parError, setParError] = useState<string | null>(null);
	const [isParLoading, setIsParLoading] = useState(false);
	
	// API call tracking for display
	const [parApiCall, setParApiCall] = useState<EnhancedApiCallData | null>(null);
	const [authUrlApiCall, setAuthUrlApiCall] = useState<EnhancedApiCallData | null>(null);

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

	// Use service for toggle handler
	const toggleSection = AuthorizationCodeSharedService.CollapsibleSections.createToggleHandler(setCollapsedSections);

	const generateRandomString = useCallback((length: number): string => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}, []);

	// Use service for PKCE generation
	const handleGeneratePkce = useCallback(async () => {
		await AuthorizationCodeSharedService.PKCE.generatePKCE('oidc', controller.credentials, controller);
	}, [controller]);

	const handlePushAuthorizationRequest = useCallback(async () => {
		if (!controller.credentials.clientId || !controller.credentials.environmentId) {
			v4ToastManager.showError(
				'Complete above action: Fill in Client ID and Environment ID first.'
			);
			return;
		}
		const hasPkceCodes = !!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge) || 
						   !!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`);
		
		if (!hasPkceCodes) {
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

			// Create API call display for PAR request
			const parApiCallData: EnhancedApiCallData = {
				flowType: 'authorization-code',
				stepName: 'Push Authorization Request',
				url: `/api/par`,
				method: 'POST' as const,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: {
					environment_id: controller.credentials.environmentId,
					client_secret: '***REDACTED***',
					...parRequest,
				},
				timestamp: new Date(),
				description: 'Push authorization request parameters to PingOne PAR endpoint'
			};

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

			const responseData = await response.json();

			// Update API call with response
			const updatedParApiCall: EnhancedApiCallData = {
				...parApiCallData,
				response: {
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: responseData
				}
			};

			setParApiCall(updatedParApiCall);

			if (!response.ok) {
				throw new Error(`PAR request failed: ${response.status} - ${JSON.stringify(responseData)}`);
			}

			setParRequestUri(responseData.request_uri);
			setParExpiresIn(responseData.expires_in);

			v4ToastManager.showSuccess('PAR request pushed successfully!');
			console.log('✅ [PingOnePARFlowV5] PAR request successful:', responseData);
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
			const authUrl = new URL(controller.credentials.authorizationEndpoint!);
			authUrl.searchParams.set('request_uri', parRequestUri);
			authUrl.searchParams.set('response_type', 'code');

			// Create API call display for authorization URL generation
			const authUrlApiCallData: EnhancedApiCallData = {
				flowType: 'authorization-code',
				stepName: 'Generate Authorization URL',
				url: authUrl.toString(),
				method: 'GET' as const,
				headers: {},
				body: null,
				timestamp: new Date(),
				description: 'Generate authorization URL with PAR request_uri parameter',
				response: {
					status: 200,
					statusText: 'OK',
					headers: {},
					data: {
						authorization_url: authUrl.toString(),
						request_uri: parRequestUri,
						response_type: 'code',
						note: 'This URL contains the request_uri from the PAR request instead of individual parameters'
					}
				}
			};

			setAuthUrlApiCall(authUrlApiCallData);

			// Auth URL is automatically generated by the controller
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
		window.open(controller.authUrl!, '_blank');
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

	const handleReset = useCallback(() => {
		// Reset current step
		setCurrentStep(0);
		
		// Reset PAR-specific state (but keep credentials)
		setParRequestUri(null);
		setParExpiresIn(null);
		setParError(null);
		setIsParLoading(false);
		
		// Reset API call displays
		setParApiCall(null);
		setAuthUrlApiCall(null);
		
		// Reset controller state (this will clear authUrl, authCode, tokens, etc.)
		controller.resetFlow();
		
		// Reset collapsed sections to default
		setCollapsedSections({
			overview: false,
			credentials: false,
			results: false,
			pkceOverview: false,
			pkceDetails: false,
			parOverview: false,
			parDetails: false,
			authRequestOverview: false,
			authRequestDetails: false,
		});
		
		v4ToastManager.showSuccess('PAR flow reset successfully. Credentials preserved.');
	}, [controller]);

	const handleStartOver = useCallback(() => {
		const flowKey = 'pingone-par-v6';
		sessionStorage.removeItem(`${flowKey}-tokens`);
		sessionStorage.removeItem(`${flowKey}-authCode`);
		sessionStorage.removeItem(`${flowKey}-pkce`);
		sessionStorage.removeItem('oauth_state');
		sessionStorage.removeItem('restore_step');
		sessionStorage.removeItem(`redirect_uri_${flowKey}`);
		
		setCurrentStep(0);
		setParRequestUri(null);
		setParExpiresIn(null);
		setParError(null);
		setParApiCall(null);
		setAuthUrlApiCall(null);
		controller.clearStepResults();
		
		console.log('🔄 [PingOnePARFlowV6] Starting over: cleared tokens/codes, keeping credentials');
		v4ToastManager.showSuccess('Flow restarted', {
			description: 'Tokens and codes cleared. Credentials preserved.',
		});
	}, [controller]);

	const renderStepContent = useMemo(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						{/* PAR Educational Callout Box */}
						<InfoBox $variant="info" style={{ marginBottom: '1.5rem', background: '#dbeafe', borderColor: '#3b82f6' }}>
							<FiShield size={24} style={{ color: '#1d4ed8' }} />
							<div>
								<InfoTitle style={{ color: '#1e40af', fontSize: '1.125rem' }}>PAR = Enhanced Security via Back-Channel (RFC 9126)</InfoTitle>
								<InfoText style={{ color: '#1e3a8a', marginBottom: '0.75rem' }}>
									{PAR_EDUCATION.overview.description}
								</InfoText>
								<InfoList style={{ color: '#1e3a8a' }}>
									{PAR_EDUCATION.overview.benefits.map((benefit, index) => (
										<li key={index}>{benefit}</li>
									))}
								</InfoList>
								<HelperText style={{ color: '#1e3a8a', fontWeight: 600, marginTop: '0.75rem' }}>
									📋 <strong>How PAR Works:</strong> {PAR_EDUCATION.howItWorks.steps.join(' → ')}
								</HelperText>
								<HelperText style={{ color: '#1e3a8a', fontWeight: 600, marginTop: '0.5rem' }}>
									<strong>Use Cases:</strong> {PAR_EDUCATION.useCases.join(' | ')}
								</HelperText>
								<HelperText style={{ color: '#059669', fontWeight: 700, marginTop: '0.5rem', padding: '0.5rem', background: '#d1fae5', borderRadius: '0.375rem' }}>
									✅ <strong>Recommended:</strong> Always enable PAR for production OIDC clients with sensitive scopes
								</HelperText>
							</div>
						</InfoBox>

						<CollapsibleHeader
					title="PAR Flow Detailed Overview"
					icon={<FiBook />}
					theme="yellow"
					defaultCollapsed={shouldCollapseAll}
				>
					<InfoBox $variant="info">
										<FiShield size={20} />
										<div>
											<InfoTitle>PAR vs Standard Authorization</InfoTitle>
											<InfoText>
												Compare Pushed Authorization Requests with standard OAuth 2.0 authorization:
											</InfoText>
											<InfoList>
												<li>
													<strong>Parameter Security:</strong> PAR = Server-side storage | Standard = Visible in URL
												</li>
												<li>
													<strong>Request Integrity:</strong> PAR = Cannot be modified | Standard = User can modify query params
												</li>
												<li>
													<strong>URL Length:</strong> PAR = Compact request_uri | Standard = May exceed browser limits
												</li>
												<li>
													<strong>Error Handling:</strong> PAR = Validate before redirect | Standard = Errors after redirect
												</li>
											</InfoList>
										</div>
									</InfoBox>
				</CollapsibleHeader>

						<SectionDivider />

						{/* Comprehensive Credentials Service */}
						<ComprehensiveCredentialsService
							// Discovery props
							onDiscoveryComplete={(result) => {
								console.log('[PAR Flow] Discovery completed:', result);
								if (result.issuerUrl) {
									const envIdMatch = result.issuerUrl.match(/\/([a-f0-9-]{36})\//i);
									if (envIdMatch && envIdMatch[1]) {
										controller.setCredentials({
											...controller.credentials,
											environmentId: envIdMatch[1],
										});
										controller.saveCredentials();
										v4ToastManager.showSuccess('Credentials auto-saved');
									}
								}
							}}
							discoveryPlaceholder="Enter Environment ID, issuer URL, or provider..."
							showProviderInfo={true}
							
							// Credentials props
							environmentId={controller.credentials.environmentId || ''}
							clientId={controller.credentials.clientId || ''}
							clientSecret={controller.credentials.clientSecret || ''}
							redirectUri={controller.credentials.redirectUri || 'https://localhost:3000/authz-callback'}
							scopes={controller.credentials.scope || 'openid profile email'}
							loginHint={controller.credentials.loginHint || ''}
							postLogoutRedirectUri={controller.credentials.postLogoutRedirectUri || 'https://localhost:3000/logout-callback'}
							
							// Change handlers
							onEnvironmentIdChange={(newEnvId) => {
								controller.setCredentials({ ...controller.credentials, environmentId: newEnvId });
								if (newEnvId && controller.credentials.clientId) {
									controller.saveCredentials();
									v4ToastManager.showSuccess('Credentials auto-saved');
								}
							}}
							onClientIdChange={(newClientId) => {
								controller.setCredentials({ ...controller.credentials, clientId: newClientId });
								if (controller.credentials.environmentId && newClientId) {
									controller.saveCredentials();
									v4ToastManager.showSuccess('Credentials auto-saved');
								}
							}}
							onClientSecretChange={(newClientSecret) =>
								controller.setCredentials({ ...controller.credentials, clientSecret: newClientSecret })
							}
							onRedirectUriChange={(newRedirectUri) =>
								controller.setCredentials({ ...controller.credentials, redirectUri: newRedirectUri })
							}
							onScopesChange={(newScopes) =>
								controller.setCredentials({ ...controller.credentials, scope: newScopes })
							}
							onLoginHintChange={(newLoginHint) =>
								controller.setCredentials({ ...controller.credentials, loginHint: newLoginHint })
							}
							onPostLogoutRedirectUriChange={(newPostLogoutRedirectUri) =>
								controller.setCredentials({ ...controller.credentials, postLogoutRedirectUri: newPostLogoutRedirectUri })
							}
							
							// Save handler
							onSave={() => controller.saveCredentials()}
							hasUnsavedChanges={false}
							isSaving={false}
							requireClientSecret={true}
							
							// PingOne Advanced Configuration
							pingOneAppState={pingOneConfig}
							onPingOneAppStateChange={setPingOneConfig}
							onPingOneSave={() => {
								v4ToastManager.showSuccess('PingOne configuration saved');
							}}
							hasUnsavedPingOneChanges={false}
							isSavingPingOne={false}
							
							// UI config
							title="PAR Flow Configuration"
							subtitle="Configure your application for Pushed Authorization Requests with enhanced security"
							showAdvancedConfig={true} // ✅ PAR is the PRIMARY feature of this flow
							defaultCollapsed={shouldCollapseAll}
						/>

					</>
				);

			case 1:
				return (
					<>
						<CollapsibleHeader
				title="PKCE Parameters Overview"
				icon={<FiCheckCircle />}
				theme="green"
				defaultCollapsed={shouldCollapseAll}
				>
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
				</CollapsibleHeader>

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
						<CollapsibleHeader
				title="PAR Request Overview"
				icon={<FiBook />}
				theme="yellow"
				defaultCollapsed={shouldCollapseAll}
				>
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
				</CollapsibleHeader>

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
									disabled={!!parRequestUri || (!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge) && !sessionStorage.getItem(`${controller.persistKey}-pkce-codes`)) || isParLoading}
									title={
										(!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge) && !sessionStorage.getItem(`${controller.persistKey}-pkce-codes`))
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

							{/* API Call Display for PAR Request */}
							{parApiCall && (
								<EnhancedApiCallDisplay
									apiCall={parApiCall}
									options={{
										showEducationalNotes: true,
										showFlowContext: true,
										urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('par')
									}}
								/>
							)}
						</ResultsSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleHeader
				title="Authorization URL Overview"
				icon={<FiCheckCircle />}
				theme="green"
				defaultCollapsed={shouldCollapseAll}
				>
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
				</CollapsibleHeader>

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

							{/* API Call Display for Authorization URL Generation */}
							{authUrlApiCall && (
								<EnhancedApiCallDisplay
									apiCall={authUrlApiCall}
									options={{
										showEducationalNotes: true,
										showFlowContext: true,
										urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('par')
									}}
								/>
							)}
						</ResultsSection>
					</>
				);

			case 4:
				return (
					<>
						<CollapsibleHeader
				title="PAR Flow Complete"
				icon={<FiCheckCircle />}
				theme="green"
				defaultCollapsed={shouldCollapseAll}
				>
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
				</CollapsibleHeader>

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
		parApiCall,
		authUrlApiCall,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="pingone-par-v6" />

				<FlowConfigurationRequirements flowType="authorization-code" variant="oauth" />

				<EnhancedFlowInfoCard
					flowType="par"
					showAdditionalInfo={true}
					showDocumentation={true}
					showCommonIssues={false}
					showImplementationNotes={false}
				/>
				<FlowSequenceDisplay flowType="authorization-code" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>V6</VersionBadge>
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
						onReset={handleReset}
						onStartOver={handleStartOver}
						canNavigateNext={canNavigateNext()}
						isFirstStep={currentStep === 0}
					/>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default PingOnePARFlowV6;
