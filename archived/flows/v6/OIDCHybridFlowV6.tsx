// src/pages/flows/OIDCHybridFlowV6.tsx
// V6.0.0 OIDC Hybrid Flow - Service-Based Architecture with Modern UI/UX
// Supports: code id_token, code token, code id_token token

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import EnhancedApiCallDisplay from '../../components/EnhancedApiCallDisplay';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import LoginSuccessModal from '../../components/LoginSuccessModal';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useHybridFlowController } from '../../hooks/useHybridFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import {
	FiBook,
	FiKey,
	FiSend,
	FiSettings,
	FiShield,
	FiZap,
} from '../../services/commonImportsService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

import type { ClaimsRequestStructure } from '../../components/ClaimsRequestBuilder';
import type { DisplayMode } from '../../components/DisplayParameterSelector';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';
import { AdvancedParametersSectionService } from '../../services/advancedParametersSectionService';
import { AuthenticationModalService } from '../../services/authenticationModalService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { CredentialGuardService } from '../../services/credentialGuardService';
import { EducationalContentService } from '../../services/educationalContentService.tsx';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import { FlowHeader } from '../../services/flowHeaderService';
import {
	HybridFlowCollapsibleSectionsManager,
	HybridFlowDefaults,
	HybridFlowStepRestoration,
	log,
} from '../../services/hybridFlowSharedService';
import ModalPresentationService from '../../services/modalPresentationService';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
import {
	IntrospectionApiCallData,
	TokenIntrospectionService,
} from '../../services/tokenIntrospectionService';
import { UISettingsService } from '../../services/uiSettingsService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { getFlowInfo } from '../../utils/flowInfoConfig';

// Styled Components
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
	background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
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
	background: rgba(124, 58, 237, 0.2);
	border: 1px solid rgba(196, 181, 253, 0.6);
	color: #e9d5ff;
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

// Step Metadata
const STEP_METADATA = [
	{
		title: 'Credentials & Configuration',
		subtitle: 'Configure your PingOne application and hybrid flow settings',
		description: 'Set up your application credentials and choose the hybrid response type',
	},
	{
		title: 'Response Type Selection',
		subtitle: 'Choose your hybrid flow variant',
		description: 'Select between code id_token, code token, or code id_token token',
	},
	{
		title: 'Authorization URL Generation',
		subtitle: 'Generate the authorization URL with hybrid parameters',
		description: 'Build the authorization URL with your selected response type',
	},
	{
		title: 'User Authentication',
		subtitle: 'Authenticate with PingOne',
		description: 'Redirect to PingOne for user authentication and authorization',
	},
	{
		title: 'Token Processing',
		subtitle: 'Process tokens from URL fragment',
		description: 'Extract and display tokens received in the URL fragment',
	},
	{
		title: 'Code Exchange',
		subtitle: 'Exchange authorization code for additional tokens',
		description: 'Exchange the authorization code for refresh tokens and other tokens',
	},
	{
		title: 'Token Management',
		subtitle: 'Manage and introspect your tokens',
		description: 'View, decode, and manage all received tokens',
	},
	{
		title: 'Flow Completion',
		subtitle: 'Review and complete the hybrid flow',
		description: 'Review the completed flow and explore next steps',
	},
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
		clientAuthMethod: 'client_secret_post', // Hybrid flow can be confidential
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'REQUIRED',
		responseTypeCode: true,
		responseTypeToken: true,
		responseTypeIdToken: true, // Hybrid flow returns all tokens
		grantTypeAuthorizationCode: true,
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
		HybridFlowCollapsibleSectionsManager.getDefaultState()
	);
	const [displayMode, setDisplayMode] = useState<DisplayMode>('page');
	const [claimsRequest, setClaimsRequest] = useState<ClaimsRequestStructure | null>(null);
	// Internationalization - SAVED FOR LATER
	// const [uiLocales, setUiLocales] = useState<string>('');
	// const [claimsLocales, setClaimsLocales] = useState<string>('');
	const [audience, setAudience] = useState<string>('');
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(
		null
	);
	const [userInfo, setUserInfo] = useState<any>(null);
	const [showMissingCredentialsModal, setShowMissingCredentialsModal] = useState(false);
	const [missingCredentialFields, setMissingCredentialFields] = useState<string[]>([]);

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
	const handleStepChange = useCallback(
		(newStep: number) => {
			setCurrentStep(newStep);
			HybridFlowStepRestoration.scrollToTopOnStepChange();

			// Update URL without triggering navigation
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.set('step', newStep.toString());
			window.history.replaceState({}, '', newUrl.toString());

			log.info('Step changed', { from: currentStep, to: newStep });
		},
		[currentStep]
	);

	// Toggle section handler
	const toggleSection = useCallback(
		HybridFlowCollapsibleSectionsManager.createToggleHandler(setCollapsedSections),
		[]
	);

	// Navigation validation
	const canNavigateNext = useCallback((): boolean => {
		const isValid = (() => {
			switch (currentStep) {
				case 0: // Credentials & Configuration
					return true; // Allow attempt; enforce via modal
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
		})();
		return isValid && currentStep < STEP_METADATA.length - 1;
	}, [currentStep, controller.flowConfig, controller.authorizationUrl, controller.tokens]);

	// Navigation handlers
	const handleNext = useCallback(() => {
		if (currentStep === 0) {
			const { missingFields, canProceed } = CredentialGuardService.checkMissingFields(
				controller.credentials,
				{
					requiredFields: ['environmentId', 'clientId'],
					fieldLabels: {
						environmentId: 'Environment ID',
						clientId: 'Client ID',
						redirectUri: 'Redirect URI',
						clientSecret: 'Client Secret',
					},
				}
			);

			if (!canProceed) {
				setMissingCredentialFields(missingFields);
				setShowMissingCredentialsModal(true);
				log.warn('Blocked navigation due to missing required credentials', { missingFields });
				return;
			}
		}

		if (!canNavigateNext()) {
			return;
		}

		if (currentStep < STEP_METADATA.length - 1) {
			handleStepChange(currentStep + 1);
		}
	}, [currentStep, controller.credentials, canNavigateNext, handleStepChange]);

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

	// Token introspection handler
	const handleIntrospectToken = useCallback(
		async (token: string) => {
			try {
				const introspectionEndpoint = `https://auth.pingone.com/${controller.credentials?.environmentId || ''}/as/introspect`;

				// Determine the appropriate authentication method for hybrid flow
				// Hybrid flows can be public (no client secret) or confidential (with client secret)
				const authMethod = controller.credentials?.clientSecret ? 'client_secret_post' : 'none';

				const { apiCall } = await TokenIntrospectionService.introspectToken(
					{
						token: token,
						clientId: controller.credentials?.clientId || '',
						clientSecret: controller.credentials?.clientSecret || '',
						tokenTypeHint: 'access_token' as const,
					},
					'hybrid',
					'/api/introspect-token', // Use proxy endpoint
					introspectionEndpoint, // Pass PingOne URL as introspection endpoint
					authMethod // Token auth method
				);
				setIntrospectionApiCall(apiCall);
			} catch (error) {
				console.error('[OIDCHybridFlowV6] Token introspection failed:', error);
				v4ToastManager.showError('Token introspection failed. Please check your credentials.');
				throw error;
			}
		},
		[controller.credentials]
	);

	// User info fetch handler
	const handleFetchUserInfo = useCallback(async () => {
		if (!controller.tokens?.access_token) {
			v4ToastManager.showError('Access token required to fetch user info');
			return;
		}

		try {
			// Note: This would need to be implemented in the controller
			// For now, just show a placeholder
			v4ToastManager.showSuccess('User info fetching would be implemented here');
		} catch (error) {
			console.error('[OIDCHybridFlowV6] User info fetch failed:', error);
			v4ToastManager.showError('Failed to fetch user information');
		}
	}, [controller.tokens]);

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
	}, []);

	// Step 0: Credentials & Configuration
	const renderCredentialsConfiguration = () => {
		// Wrapper to enforce openid scope (required for OIDC & PingOne)
		const handleCredentialsChange = useCallback(
			(newCredentials: typeof controller.credentials) => {
				// Ensure openid is always included in scopes
				if (newCredentials && newCredentials.scopes) {
					const scopes = newCredentials.scopes.split(/\s+/).filter((s) => s.length > 0);
					if (!scopes.includes('openid')) {
						scopes.unshift('openid');
						newCredentials.scopes = scopes.join(' ');
						v4ToastManager.showWarning('Added required "openid" scope for OIDC compliance');
					}
				}
				controller.setCredentials(newCredentials);
			},
			[controller]
		);

		return (
			<>
				{/* OIDC Educational Content */}
				<EducationalContentService flowType="oidc-hybrid-credentials" defaultCollapsed={false} />

				<CollapsibleHeader
					title="Application Configuration & Credentials"
					subtitle="Configure your PingOne credentials and OIDC settings"
					icon={<FiSettings />}
					theme="orange"
					defaultCollapsed={collapsedSections.credentials}
				>
					{controller.credentials ? (
						<ComprehensiveCredentialsService
							credentials={controller.credentials}
							onCredentialsChange={handleCredentialsChange}
							onSaveCredentials={controller.saveCredentials}
							flowType="hybrid"
							showAdvancedConfig={true} // ✅ Hybrid flow uses authorization endpoint, PAR applicable
							// Individual field change handlers for editable fields
							environmentId={controller.credentials?.environmentId || ''}
							clientId={controller.credentials?.clientId || ''}
							clientSecret={controller.credentials?.clientSecret || ''}
							redirectUri={controller.credentials?.redirectUri || ''}
							scopes={controller.credentials?.scopes || ''}
							loginHint={controller.credentials?.loginHint || ''}
							postLogoutRedirectUri={
								controller.credentials?.postLogoutRedirectUri ||
								'https://localhost:3000/logout-callback'
							}
							onEnvironmentIdChange={(value) => {
								const updated = { ...(controller.credentials || {}), environmentId: value };
								controller.setCredentials(updated);
							}}
							onClientIdChange={(value) => {
								const updated = { ...(controller.credentials || {}), clientId: value };
								controller.setCredentials(updated);
							}}
							onClientSecretChange={(value) => {
								const updated = { ...(controller.credentials || {}), clientSecret: value };
								controller.setCredentials(updated);
							}}
							onRedirectUriChange={(value) => {
								const updated = { ...(controller.credentials || {}), redirectUri: value };
								controller.setCredentials(updated);
							}}
							onScopesChange={(value) => {
								const updated = { ...(controller.credentials || {}), scopes: value };
								handleCredentialsChange(updated);
							}}
							onLoginHintChange={(value) => {
								const updated = { ...(controller.credentials || {}), loginHint: value };
								controller.setCredentials(updated);
							}}
							onPostLogoutRedirectUriChange={(value) => {
								const updated = { ...(controller.credentials || {}), postLogoutRedirectUri: value };
								controller.setCredentials(updated);
							}}
							// PingOne Advanced Configuration
							pingOneAppState={pingOneConfig}
							onPingOneAppStateChange={setPingOneConfig}
							onPingOneSave={() => {
								console.log('[OIDC Hybrid V6] PingOne config saved:', pingOneConfig);
								v4ToastManager.showSuccess('PingOne configuration saved successfully!');
							}}
							hasUnsavedPingOneChanges={false}
							isSavingPingOne={false}
							// OIDC Discovery completion handler - allows environment ID auto-population
							onDiscoveryComplete={(result) => {
								console.log('[OIDC Hybrid V6] OIDC Discovery completed:', result);
								// Extract environment ID from issuer URL using the standard service
								if (result.issuerUrl) {
									const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(
										result.issuerUrl
									);
									if (extractedEnvId) {
										handleFieldChange('environmentId', extractedEnvId);
										console.log('[OIDC Hybrid V6] Auto-extracted Environment ID:', extractedEnvId);
									}
								}
							}}
						/>
					) : (
						<div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
							Loading credentials configuration...
						</div>
					)}
				</CollapsibleHeader>
			</>
		);
	};

	// Step 1: Response Type Selection
	const renderResponseTypeSelection = () => {
		const supportedVariants = HybridFlowDefaults.getSupportedResponseTypes();

		return (
			<div>
				<EducationalContentService
					flowType="oidc-hybrid-response-types"
					defaultCollapsed={collapsedSections.responseType}
				/>

				<div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
					<div
						style={{
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '0.75rem',
							padding: '1.5rem',
						}}
					>
						<h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', color: '#1e293b' }}>
							Comparison: Authorization Code vs Implicit vs Hybrid
						</h3>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
								gap: '1rem',
							}}
						>
							<div
								style={{
									background: '#fff',
									borderRadius: '0.75rem',
									border: '1px solid #dbeafe',
									padding: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8' }}>Authorization Code</h4>
								<ul
									style={{
										margin: 0,
										paddingLeft: '1rem',
										color: '#475569',
										fontSize: '0.875rem',
										lineHeight: 1.5,
									}}
								>
									<li>Back-channel token exchange with PKCE</li>
									<li>High security; refresh tokens available</li>
									<li>User identity via ID token when using OIDC</li>
								</ul>
							</div>

							<div
								style={{
									background: '#fff',
									borderRadius: '0.75rem',
									border: '1px solid #fef3c7',
									padding: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#b45309' }}>Implicit</h4>
								<ul
									style={{
										margin: 0,
										paddingLeft: '1rem',
										color: '#475569',
										fontSize: '0.875rem',
										lineHeight: 1.5,
									}}
								>
									<li>Front-channel tokens only, no code</li>
									<li>Fast but deprecated due to security concerns</li>
									<li>No refresh token; browser must store tokens</li>
								</ul>
							</div>

							<div
								style={{
									background: '#fff',
									borderRadius: '0.75rem',
									border: '1px solid #c4b5fd',
									padding: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a' }}>Hybrid</h4>
								<ul
									style={{
										margin: 0,
										paddingLeft: '1rem',
										color: '#475569',
										fontSize: '0.875rem',
										lineHeight: 1.5,
									}}
								>
									<li>Front-channel ID/access tokens + back-channel code</li>
									<li>Best of both worlds: instant identity and refresh tokens</li>
									<li>Requires strict security (PKCE, nonce, redirect control)</li>
								</ul>
							</div>
						</div>
					</div>
					{supportedVariants.map((variant) => {
						const config = HybridFlowDefaults.getFlowConfig(variant);
						const isSelected = controller.flowVariant === variant;

						return (
							<div
								key={variant}
								onClick={() => controller.setFlowVariant(variant)}
								style={{
									padding: '1.5rem',
									border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
									borderRadius: '0.75rem',
									background: isSelected ? '#eff6ff' : 'white',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
									display: 'flex',
									alignItems: 'flex-start',
									gap: '1rem',
								}}
							>
								<div style={{ fontSize: '1.5rem', color: isSelected ? '#3b82f6' : '#64748b' }}>
									{variant === 'code-id-token' && <FiShield />}
									{variant === 'code-token' && <FiKey />}
									{variant === 'code-id-token-token' && <FiZap />}
								</div>
								<div style={{ flex: 1 }}>
									<h3
										style={{
											margin: '0 0 0.5rem 0',
											fontSize: '1.125rem',
											fontWeight: '600',
											color: '#1e293b',
										}}
									>
										{config.responseType}
									</h3>
									<div
										style={{
											margin: '0 0 1rem 0',
											color: '#64748b',
											fontSize: '0.875rem',
											lineHeight: '1.5',
										}}
									>
										<p style={{ margin: '0 0 0.5rem 0' }}>{config.description}</p>
										<ul
											style={{
												margin: '0',
												paddingLeft: '1.5rem',
												color: '#64748b',
												fontSize: '0.875rem',
											}}
										>
											{config.benefits.map((benefit, index) => (
												<li key={index} style={{ marginBottom: '0.25rem' }}>
													{benefit}
												</li>
											))}
										</ul>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	// Step 2: Authorization URL Generation
	const renderAuthorizationUrlGeneration = () => (
		<>
			<EducationalContentService
				flowType="oidc-hybrid-authorization"
				defaultCollapsed={collapsedSections.authorizationUrl || false}
			/>
			<CollapsibleHeader
				title="Authorization URL Generation"
				icon={<FiSend />}
				theme="blue"
				defaultCollapsed={false}
			>
				<button
					onClick={() => {
						controller.generateState();
						controller.generateNonce();
						controller.generateAuthorizationUrl();
					}}
					disabled={!controller.hasValidCredentials || controller.isLoading}
					style={{
						padding: '0.75rem 1.5rem',
						background: '#1d4ed8',
						color: 'white',
						border: 'none',
						borderRadius: '0.5rem',
						fontSize: '1rem',
						fontWeight: '500',
						cursor: 'pointer',
						opacity: !controller.hasValidCredentials || controller.isLoading ? 0.5 : 1,
					}}
				>
					{controller.isLoading ? 'Generating...' : 'Generate Authorization URL'}
				</button>

				{controller.authorizationUrl && (
					<div style={{ marginTop: '2rem' }}>
						<EnhancedApiCallDisplay
							apiCall={{
								method: 'GET',
								url: controller.authorizationUrl,
								headers: {},
								body: null,
								timestamp: new Date(),
								flowType: 'hybrid',
								stepName: 'Authorization URL',
								description: 'URL for user authentication with hybrid response type',
							}}
							options={{
								showEducationalNotes: true,
								showFlowContext: true,
							}}
						/>
					</div>
				)}
			</CollapsibleHeader>
		</>
	);

	// Step 3: User Authentication
	const renderUserAuthentication = () => (
		<div>
			<EducationalContentService
				flowType="oidc-hybrid-authentication"
				defaultCollapsed={collapsedSections.authRequest}
			/>

			{controller.authorizationUrl && (
				<div style={{ marginTop: '2rem' }}>
					{AuthenticationModalService.showModal(
						showRedirectModal,
						() => setShowRedirectModal(false),
						() => {
							console.log(
								'[OIDCHybridFlowV6] User clicked Continue - modal service will handle popup opening'
							);
							setShowRedirectModal(false);
							// Modal service handles the popup opening - DO NOT call controller.handleRedirectAuthorization()
							// The modal service will call window.open() in popup mode
						},
						controller.authorizationUrl || '',
						'oidc',
						'OIDC Hybrid Flow',
						{
							description:
								"You're about to be redirected to PingOne for OIDC Hybrid authentication.",
							redirectMode: 'redirect',
						}
					)}
				</div>
			)}
		</div>
	);

	// Step 4: Token Processing
	const renderTokenProcessing = () => {
		return (
			<div>
				<EducationalContentService
					flowType="oidc-hybrid-token-processing"
					defaultCollapsed={collapsedSections.response}
				/>

				{/* Show mock tokens for demonstration - in real flow these come from URL fragment */}
				<div style={{ marginTop: '2rem' }}>
					{UnifiedTokenDisplayService.showTokens(
						{
							id_token:
								'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHQifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.mock_signature',
							access_token:
								'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHQifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.mock_signature',
							token_type: 'Bearer',
							expires_in: 3600,
							scope: 'openid profile email',
						},
						'oidc',
						'oidc-hybrid-v6',
						{
							showCopyButtons: true,
							showDecodeButtons: true,
						}
					)}
				</div>

				{controller.tokens && (
					<div style={{ marginTop: '2rem' }}>
						{UnifiedTokenDisplayService.showTokens(controller.tokens, 'oidc', 'oidc-hybrid-v6', {
							showCopyButtons: true,
							showDecodeButtons: true,
						})}
					</div>
				)}
			</div>
		);
	};

	// Step 5: Code Exchange
	const renderCodeExchange = () => (
		<div>
			<EducationalContentService
				flowType="oidc-hybrid-code-exchange"
				defaultCollapsed={collapsedSections.exchange}
			/>

			{/* Show mock tokens from token endpoint exchange - in real flow these come from POST to token endpoint */}
			<div style={{ marginTop: '2rem' }}>
				{UnifiedTokenDisplayService.showTokens(
					{
						access_token:
							'eyJhbGciOiJSUzI1NiIsImtpZCI6InRva2VuLWVuZHBvaW50In0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.token_endpoint_signature',
						refresh_token: 'refresh_token_from_token_endpoint_abcd1234',
						token_type: 'Bearer',
						expires_in: 3600,
						scope: 'openid profile email offline_access',
					},
					'oidc',
					'oidc-hybrid-v6',
					{
						showCopyButtons: true,
						showDecodeButtons: true,
					}
				)}
			</div>

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
		<>
			<EducationalContentService
				flowType="oidc-hybrid-token-management"
				defaultCollapsed={collapsedSections.tokenManagement || false}
			/>
			<TokenIntrospect
				flowName="OIDC Hybrid Flow"
				flowVersion="V6"
				tokens={controller.tokens as unknown as Record<string, unknown>}
				credentials={controller.credentials || {}}
				userInfo={userInfo}
				onFetchUserInfo={handleFetchUserInfo}
				isFetchingUserInfo={false}
				onResetFlow={handleReset}
				onNavigateToTokenManagement={() => {}}
				onIntrospectToken={handleIntrospectToken}
				collapsedSections={{
					completionOverview: false,
					completionDetails: false,
					introspectionDetails: collapsedSections.introspectionDetails,
					rawJson: false,
				}}
				onToggleSection={(section) => {
					if (section === 'introspectionDetails') {
						toggleSection('introspectionDetails');
					}
				}}
				completionMessage="Nice work! You successfully completed the OIDC Hybrid Flow. You received tokens in both the URL fragment and through code exchange."
				nextSteps={[
					'Inspect or decode tokens using the Token Management tools.',
					'Repeat the flow with different response types.',
					'Explore refresh tokens and introspection flows.',
				]}
			/>

			{introspectionApiCall && (
				<div style={{ marginTop: '2rem' }}>
					<EnhancedApiCallDisplay
						apiCall={introspectionApiCall}
						options={{
							showEducationalNotes: true,
							showFlowContext: true,
						}}
					/>
				</div>
			)}
		</>
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
			showIntrospection: false,
		};

		return (
			<>
				<FlowCompletionService
					config={completionConfig}
					collapsed={collapsedSections.flowSummary}
					onToggleCollapsed={() => toggleSection('flowSummary')}
				/>
				<EducationalContentService
					flowType="oidc-hybrid-completion"
					defaultCollapsed={collapsedSections.flowSummary}
				/>
			</>
		);
	};

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

				{currentStep === 0 && AdvancedParametersSectionService.getSimpleSection('oidc-hybrid')}

				<FlowInfoCard flowInfo={getFlowInfo('oidc-hybrid')!} />

				<FlowSequenceDisplay flowType="hybrid" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>OIDC Hybrid Flow · V6</VersionBadge>
							<StepHeaderTitle>{STEP_METADATA[currentStep].title}</StepHeaderTitle>
							<StepHeaderSubtitle>{STEP_METADATA[currentStep].subtitle}</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {STEP_METADATA.length}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContentWrapper>{renderStepContent(currentStep)}</StepContentWrapper>
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

			{AuthenticationModalService.showModal(
				showRedirectModal,
				() => setShowRedirectModal(false),
				() => {
					console.log(
						'[OIDCHybridFlowV6] User clicked Continue - modal service will handle popup opening'
					);
					setShowRedirectModal(false);
					// Modal service handles the popup opening
				},
				controller.authorizationUrl || '',
				'oidc',
				'OIDC Hybrid Flow',
				{
					description: "You're about to be redirected to PingOne for OIDC Hybrid authentication.",
					redirectMode: 'redirect',
				}
			)}

			<LoginSuccessModal
				isOpen={false}
				onClose={() => {}}
				title="Login Successful!"
				message="You have been successfully authenticated with PingOne. Your authorization code has been received."
				autoCloseDelay={0}
			/>

			<ModalPresentationService
				isOpen={showMissingCredentialsModal}
				onClose={() => setShowMissingCredentialsModal(false)}
				title="Credentials required"
				description={
					missingCredentialFields.length > 0
						? `Please provide the following required credential${missingCredentialFields.length > 1 ? 's' : ''} before continuing:`
						: 'Environment ID and Client ID are required before moving to the next step.'
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
							<li key={field} style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
								{field}
							</li>
						))}
					</ul>
				)}
			</ModalPresentationService>
		</Container>
	);
};

export default OIDCHybridFlowV6;
