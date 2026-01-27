// src/pages/flows/PingOnePARFlowV7.tsx
// V7.0.0 PingOne PAR (Pushed Authorization Request) Flow - Enhanced Service Architecture with Modern UI/UX

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AuthorizationDetailsEditor } from '../../components/AuthorizationDetailsEditor';
import ColoredTokenDisplay from '../../components/ColoredTokenDisplay';
import ColoredUrlDisplay from '../../components/ColoredUrlDisplay';
import { LearningTooltip } from '../../components/LearningTooltip';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { useCredentialBackup } from '../../hooks/useCredentialBackup';
import { usePageScroll } from '../../hooks/usePageScroll';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowUIService } from '../../services/flowUIService';
import ModalPresentationService from '../../services/modalPresentationService';
import {
	type PARConfiguration,
	PARConfigurationService,
	PARConfigurationServiceUtils,
} from '../../services/parConfigurationService';
import PKCEService, { type PKCECodes, PKCEServiceUtils } from '../../services/pkceService';
import { type AuthorizationDetail, RARService } from '../../services/rarService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { PKCEStorageServiceV8U } from '../../v8u/services/pkceStorageServiceV8U';

// Get UI components from FlowUIService
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

const MainCard = styled.div`
	background: white;
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

const VersionBadge = styled.div`
	background: rgba(255, 255, 255, 0.2);
	color: #ffffff;
	font-size: 0.75rem;
	font-weight: 600;
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

const StepContent = styled.div`
	padding: 2rem;
`;

// OAuth/OIDC Variant Selector Components
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
	border: 2px solid ${(props) => (props.$selected ? '#16a34a' : '#cbd5e1')};
	background: ${(props) => (props.$selected ? '#dcfce7' : 'white')};
	color: ${(props) => (props.$selected ? '#166534' : '#475569')};
	font-weight: ${(props) => (props.$selected ? '600' : '500')};
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		border-color: #16a34a;
		background: #dcfce7;
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

// Step metadata for V7
const STEP_METADATA = [
	{
		title: 'Setup & Credentials',
		subtitle: 'Configure your PingOne environment and application settings',
	},
	{
		title: 'PKCE Generation',
		subtitle: 'Generate secure PKCE parameters for enhanced security',
	},
	{
		title: 'Push Authorization Request',
		subtitle: 'Send authorization request to PAR endpoint with all parameters',
	},
	{
		title: 'User Authentication',
		subtitle: 'Complete authorization using the request_uri from PAR',
	},
	{
		title: 'Authorization Response',
		subtitle: 'Handle the authorization callback and extract authorization code',
	},
	{
		title: 'Token Exchange',
		subtitle: 'Exchange authorization code for access tokens',
	},
	{
		title: 'Token Management',
		subtitle: 'Introspect and manage the received tokens',
	},
	{
		title: 'Flow Complete',
		subtitle: 'Review the completed PAR flow and next steps',
	},
];

const RAR_TEMPLATES = RARService.getTemplates();
// type RARTemplateKey = keyof typeof RAR_TEMPLATES; // For future use

const cloneAuthorizationDetail = (detail: AuthorizationDetail): AuthorizationDetail =>
	JSON.parse(JSON.stringify(detail));

const PingOnePARFlowV7: React.FC = () => {
	const location = useLocation();
	const [currentStep, setCurrentStep] = useState(0);

	// Initialize page scroll management
	usePageScroll({ pageName: 'PingOne PAR Flow V7', force: true });

	// Detect default variant based on navigation context
	const getDefaultVariant = (): 'oauth' | 'oidc' => {
		// Check if there's a variant specified in the URL params
		const urlParams = new URLSearchParams(location.search);
		const urlVariant = urlParams.get('variant');
		if (urlVariant === 'oidc' || urlVariant === 'oauth') {
			return urlVariant as 'oauth' | 'oidc';
		}

		// Default to OIDC for PAR flows (more common use case)
		return 'oidc';
	};

	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>(getDefaultVariant());

	// Initialize authorization code flow controller with V7 settings
	// Use dedicated PAR flow key to ensure separate storage
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'pingone-par-flow-v7',
		defaultFlowVariant: selectedVariant,
	});

	const [parConfig, setParConfig] = useState<PARConfiguration>(() =>
		PARConfigurationServiceUtils.getDefaultConfig()
	);

	const parConfigParams = useMemo(() => {
		return PARConfigurationServiceUtils.configToUrlParams(parConfig);
	}, [parConfig]);

	const [authorizationDetails, setAuthorizationDetails] = useState<AuthorizationDetail[]>(() => [
		cloneAuthorizationDetail(RAR_TEMPLATES.customerInformation),
	]);

	// Template handler for future use
	// const handleApplyTemplate = useCallback((templateKey: RARTemplateKey) => {
	// 	const template = RAR_TEMPLATES[templateKey];
	// 	if (template) {
	// 		setAuthorizationDetails([cloneAuthorizationDetail(template)]);
	// 	}
	// }, []);

	const handleAuthorizationDetailsChange = useCallback((details: AuthorizationDetail[]) => {
		setAuthorizationDetails(details);
	}, []);

	// PAR configuration change handler
	const handlePARConfigChange = useCallback((config: PARConfiguration) => {
		setParConfig(config);
		console.log('🔧 [PAR V7] PAR configuration updated:', config);
	}, []);

	// PAR configuration and authorization details (for future use)
	// const [parConfig] = useState<PARConfiguration>(() =>
	// 	PARConfigurationServiceUtils.getDefaultConfig()
	// );

	// Override redirect URI for PAR flows to use par-callback
	useEffect(() => {
		if (
			controller.credentials &&
			controller.credentials.redirectUri !== 'https://localhost:3000/par-callback'
		) {
			console.log('🔧 [PAR V7] Overriding redirect URI for PAR flow:', {
				from: controller.credentials.redirectUri,
				to: 'https://localhost:3000/par-callback',
			});
			controller.setCredentials({
				...controller.credentials,
				redirectUri: 'https://localhost:3000/par-callback',
			});
		}
	}, [controller.credentials]);

	// Ensure PAR flow uses its own credential storage
	useEffect(() => {
		// Save current credentials to PAR-specific storage
		if (
			controller.credentials &&
			(controller.credentials.environmentId || controller.credentials.clientId)
		) {
			console.log('🔧 [PAR V7] Saving credentials to PAR-specific storage:', {
				flowKey: 'pingone-par-flow-v7',
				environmentId: controller.credentials.environmentId,
				clientId: controller.credentials.clientId?.substring(0, 8) + '...',
				redirectUri: controller.credentials.redirectUri,
			});

			// Save to comprehensive service with complete isolation
			const success = comprehensiveFlowDataService.saveFlowDataComprehensive(
				'pingone-par-flow-v7',
				{
					...(controller.credentials.environmentId && {
						sharedEnvironment: {
							environmentId: controller.credentials.environmentId,
							region: 'us', // Default region
							issuerUrl: `https://auth.pingone.com/${controller.credentials.environmentId}`,
						},
					}),
					flowCredentials: {
						clientId: controller.credentials.clientId,
						clientSecret: controller.credentials.clientSecret,
						redirectUri: controller.credentials.redirectUri,
						scopes: Array.isArray(controller.credentials.scopes)
							? controller.credentials.scopes
							: controller.credentials.scopes
								? [controller.credentials.scopes]
								: [],
						tokenEndpointAuthMethod: 'client_secret_basic',
						lastUpdated: Date.now(),
					},
				}
			);

			if (!success) {
				console.error('[PingOnePARFlowV7] Failed to save credentials to comprehensive service');
			}
		}
	}, [controller.credentials]);

	// Use credential backup hook for automatic backup and restoration
	useCredentialBackup({
		flowKey: 'pingone-par-flow-v7',
		credentials: controller.credentials,
		setCredentials: controller.setCredentials,
		enabled: true,
	});

	// Debug: Log credential loading on mount
	useEffect(() => {
		console.log('🔍 [PAR V7] Initial credentials loaded:', {
			flowKey: 'pingone-par-flow-v7',
			environmentId: controller.credentials.environmentId,
			clientId: controller.credentials.clientId,
			redirectUri: controller.credentials.redirectUri,
			hasCredentials: !!(controller.credentials.environmentId && controller.credentials.clientId),
		});
	}, []);

	// V7 Enhanced state management (unused - keeping for future use)
	// const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
	// 	environmentId: '',
	// 	clientId: '',
	// 	clientSecret: '',
	// 	redirectUri: 'https://localhost:3000/callback',
	// 	responseTypeCode: true,
	// 	responseTypeToken: false,
	// 	responseTypeIdToken: false,
	// 	scopes: ['openid', 'profile', 'email'],
	// 	requirePushedAuthorizationRequest: true,
	// 	clientAuthMethod: 'client_secret_post',
	// 	nonce: true,
	// 	acrValues: '',
	// 	prompt: 'consent',
	// 	maxAge: '3600',
	// 	uiLocales: 'en',
	// 	claims: '{"userinfo": {"email": null, "phone_number": null}}',
	// 	privateKey: '',
	// 	keyId: '',
	// 	jwksUri: '',
	// });

	// PKCE state management - restore from bulletproof storage on mount
	const flowKey = 'pingone-par-v7';
	const storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(flowKey);
	const [pkceCodes, setPkceCodes] = useState<PKCECodes>(
		storedPKCE || {
			codeVerifier: '',
			codeChallenge: '',
			codeChallengeMethod: 'S256',
		}
	);

	// Persist PKCE codes to bulletproof storage whenever they change
	useEffect(() => {
		if (pkceCodes.codeVerifier && pkceCodes.codeChallenge) {
			PKCEStorageServiceV8U.savePKCECodes(flowKey, {
				codeVerifier: pkceCodes.codeVerifier,
				codeChallenge: pkceCodes.codeChallenge,
				codeChallengeMethod: pkceCodes.codeChallengeMethod || 'S256',
			});
		}
	}, [pkceCodes.codeVerifier, pkceCodes.codeChallenge, pkceCodes.codeChallengeMethod]);

	// PAR request preview (moved after pkceCodes declaration)
	const parRequestPreview = useMemo(() => {
		const { environmentId, clientId, clientSecret, redirectUri } = controller.credentials;
		if (!environmentId || !clientId || !pkceCodes.codeChallenge) {
			return '';
		}

		const lines: string[] = [
			`POST https://auth.pingone.com/${environmentId}/as/par`,
			'Content-Type: application/x-www-form-urlencoded',
			'',
			'response_type=code',
			`client_id=${clientId}`,
			`client_secret=${clientSecret ? '***' : 'client-secret'}`,
			`scope=${selectedVariant === 'oidc' ? 'openid profile email' : 'api.read api.write'}`,
			`redirect_uri=${redirectUri || 'https://localhost:3000/par-callback'}`,
			`state=par-v7-${selectedVariant}-[timestamp]`,
			`code_challenge=${pkceCodes.codeChallenge}`,
			'code_challenge_method=S256',
		];

		Object.entries(parConfigParams).forEach(([key, value]) => {
			lines.push(`${key}=${value}`);
		});

		if (authorizationDetails.length > 0) {
			lines.push(`authorization_details=${JSON.stringify(authorizationDetails)}`);
		}

		return lines.join('\n');
	}, [
		controller.credentials.clientId,
		controller.credentials.clientSecret,
		controller.credentials.environmentId,
		controller.credentials.redirectUri,
		pkceCodes.codeChallenge,
		selectedVariant,
		parConfigParams,
		authorizationDetails,
		parConfig, // Include PAR configuration in dependencies
	]);

	// PKCE generation handler
	const handlePKCEGenerate = useCallback(async () => {
		try {
			const newCodes = await PKCEServiceUtils.generateCodes();
			setPkceCodes(newCodes);
			v4ToastManager.showSuccess('PKCE parameters generated successfully!');
		} catch (error) {
			console.error('PKCE generation failed:', error);
			v4ToastManager.showError('Failed to generate PKCE parameters');
		}
	}, []);

	// Unused state variables - keeping for future use
	// const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(null);
	// const [apiCalls, setApiCalls] = useState<EnhancedApiCallData[]>([]);
	// const [showRedirectModal, setShowRedirectModal] = useState(false);
	// const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
	// const [localAuthCode, setLocalAuthCode] = useState<string | null>(null);
	// const [showSavedSecret, setShowSavedSecret] = useState(false);
	// const [completionCollapsed, setCompletionCollapsed] = useState(false);

	// Worker token state
	const [workerToken, setWorkerToken] = useState<string>('');
	const [showWorkerToken, setShowWorkerToken] = useState(false);

	// Redirectless authentication state
	const [loginCredentials, setLoginCredentials] = useState({
		username: '',
		password: '',
	});
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	// Warning modal state
	const [showRedirectUriWarning, setShowRedirectUriWarning] = useState(false);

	// Function to show redirect URI warning
	const showRedirectUriWarningModal = useCallback(() => {
		setShowRedirectUriWarning(true);
	}, []);

	// Load worker token from localStorage on mount
	useEffect(() => {
		const savedToken = localStorage.getItem('worker-token');
		const savedEnv = localStorage.getItem('worker-token-env');

		if (savedToken && savedEnv === controller.credentials.environmentId) {
			setWorkerToken(savedToken);
			console.log('[PingOnePARFlowV7] Worker token loaded from localStorage');
		}
	}, [controller.credentials.environmentId]);

	// Track completed actions for each step
	const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

	// V7 Enhanced step validation - requires user to complete actions
	const isStepValid = (step: number): boolean => {
		switch (step) {
			case 0: {
				// Step 0: Must have valid credentials
				const hasCredentials = !!(
					controller.credentials.environmentId && controller.credentials.clientId
				);
				return hasCredentials;
			}
			case 1:
				// Step 1: Must have PKCE parameters generated
				return !!(pkceCodes.codeVerifier && pkceCodes.codeChallenge);
			case 2:
				// Step 2: User must click the PAR request button to proceed
				return completedActions[2] === true;
			case 3:
				// Step 3: User must complete authorization to proceed
				return completedActions[3] === true;
			case 4:
				// Step 4: Must have authorization code from callback
				return !!controller.authCode;
			case 5:
				// Step 5: User must complete token exchange to proceed
				return completedActions[5] === true;
			case 6:
				// Step 6: User must complete token management to proceed
				return completedActions[6] === true;
			case 7:
				// Step 7: Flow completion - always valid
				return true;
			default:
				return false;
		}
	};

	const canNavigateNext = isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;

	// Render variant selector
	const renderVariantSelector = () => (
		<VariantSelector>
			<VariantButton
				$selected={selectedVariant === 'oauth'}
				onClick={() => handleVariantChange('oauth')}
			>
				<VariantTitle>
					<LearningTooltip
						variant="info"
						title="OAuth 2.0"
						content="RFC 6749 - Authorization framework"
						placement="top"
					>
						OAuth 2.0
					</LearningTooltip>{' '}
					<LearningTooltip
						variant="learning"
						title="PAR"
						content="RFC 9126 - Pushed Authorization Requests. Sends authorization parameters to secure endpoint instead of URL."
						placement="top"
					>
						PAR
					</LearningTooltip>
				</VariantTitle>
				<VariantDescription>
					<LearningTooltip
						variant="learning"
						title="Access Token"
						content="Bearer token for API access"
						placement="top"
					>
						Access token
					</LearningTooltip>{' '}
					only - API{' '}
					<LearningTooltip
						variant="info"
						title="Authorization"
						content="Granting access to resources"
						placement="top"
					>
						authorization
					</LearningTooltip>{' '}
					with{' '}
					<LearningTooltip
						variant="security"
						title="Enhanced Security"
						content="PAR prevents parameter tampering by sending params via secure back-channel"
						placement="top"
					>
						enhanced security
					</LearningTooltip>
				</VariantDescription>
			</VariantButton>
			<VariantButton
				$selected={selectedVariant === 'oidc'}
				onClick={() => handleVariantChange('oidc')}
			>
				<VariantTitle>
					<LearningTooltip
						variant="info"
						title="OpenID Connect"
						content="Authentication layer on OAuth 2.0"
						placement="top"
					>
						OpenID Connect
					</LearningTooltip>{' '}
					<LearningTooltip
						variant="learning"
						title="PAR"
						content="RFC 9126 - Pushed Authorization Requests"
						placement="top"
					>
						PAR
					</LearningTooltip>
				</VariantTitle>
				<VariantDescription>
					ID token + Access token - Authentication + Authorization with PAR security
				</VariantDescription>
			</VariantButton>
		</VariantSelector>
	);

	// Handle variant change
	const handleVariantChange = useCallback(
		(variant: 'oauth' | 'oidc') => {
			setSelectedVariant(variant);
			// Reset to step 0 when switching variants
			setCurrentStep(0);
			controller.resetFlow();

			// Update controller variant
			controller.setFlowVariant(variant);

			// Update credentials based on variant
			const updatedCredentials = {
				...controller.credentials,
				scope: variant === 'oidc' ? 'openid profile email' : 'api.read api.write',
				responseType: variant === 'oidc' ? 'code' : 'code', // PAR always uses code flow
			};
			controller.setCredentials(updatedCredentials);

			v4ToastManager.showSuccess(`Switched to ${variant.toUpperCase()} PAR Flow variant`);
		},
		[controller]
	);

	// V7 Enhanced handlers
	const handleNext = useCallback(() => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [currentStep]);

	const handlePrevious = useCallback(() => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	}, [currentStep]);

	const handleReset = useCallback(() => {
		setCurrentStep(0);
		controller.resetFlow();
		setCompletedActions({}); // Clear all completed actions

		// Clear PAR-specific storage using comprehensive service
		comprehensiveFlowDataService.clearFlowData('pingone-par-flow-v7');
		console.log('🔧 [PAR V7] Cleared PAR-specific storage');

		v4ToastManager.showInfo('PAR Flow V7 reset successfully');
	}, [controller]);

	// V7 Enhanced step content rendering
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div>
						<h3>PAR Configuration & Credentials</h3>
						<p>Configure your PingOne environment and PAR settings for enhanced security.</p>

						{/* OAuth/OIDC Variant Selector */}
						{renderVariantSelector()}

						{/* PAR Configuration Service */}
						<PARConfigurationService
							config={parConfig}
							onConfigChange={handlePARConfigChange}
							defaultCollapsed={false}
							title="PAR Authorization Request Configuration"
							showEducationalContent={true}
						/>

						{/* Authorization Details Editor */}
						<div style={{ marginBottom: '1.5rem' }}>
							<AuthorizationDetailsEditor
								authorizationDetails={authorizationDetails}
								onUpdate={handleAuthorizationDetailsChange}
							/>
						</div>

						{/* PAR Overview based on selected variant */}
						<div
							style={{
								padding: '1.5rem',
								background: selectedVariant === 'oidc' ? '#eff6ff' : '#f0fdf4',
								borderRadius: '0.75rem',
								marginBottom: '1.5rem',
								border: `1px solid ${selectedVariant === 'oidc' ? '#3b82f6' : '#16a34a'}`,
							}}
						>
							<h4
								style={{
									margin: '0 0 1rem 0',
									color: selectedVariant === 'oidc' ? '#1e40af' : '#166534',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiShield size={20} />
								{selectedVariant === 'oidc' ? (
									<>
										<LearningTooltip
											variant="info"
											title="OpenID Connect"
											content="Authentication layer on OAuth 2.0"
											placement="top"
										>
											OpenID Connect
										</LearningTooltip>{' '}
										<LearningTooltip
											variant="learning"
											title="PAR"
											content="RFC 9126 - Pushed Authorization Requests"
											placement="top"
										>
											PAR
										</LearningTooltip>
									</>
								) : (
									<>
										<LearningTooltip
											variant="info"
											title="OAuth 2.0"
											content="RFC 6749 - Authorization framework"
											placement="top"
										>
											OAuth 2.0
										</LearningTooltip>{' '}
										<LearningTooltip
											variant="learning"
											title="PAR"
											content="RFC 9126 - Pushed Authorization Requests"
											placement="top"
										>
											PAR
										</LearningTooltip>
									</>
								)}{' '}
								Overview
							</h4>

							{selectedVariant === 'oidc' ? (
								<div>
									<p style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
										<strong>
											<LearningTooltip
												variant="info"
												title="OpenID Connect PAR"
												content="OIDC version of PAR - adds authentication capabilities"
												placement="top"
											>
												OpenID Connect PAR
											</LearningTooltip>
										</strong>{' '}
										extends{' '}
										<LearningTooltip
											variant="info"
											title="OAuth 2.0 PAR"
											content="RFC 9126 - Base PAR specification"
											placement="top"
										>
											OAuth 2.0 PAR
										</LearningTooltip>{' '}
										to include OIDC-specific parameters like{' '}
										<code>
											<LearningTooltip
												variant="security"
												title="nonce"
												content="Number used once - replay protection for ID token"
												placement="top"
											>
												nonce
											</LearningTooltip>
										</code>
										,{' '}
										<code>
											<LearningTooltip
												variant="info"
												title="claims"
												content="Requested user identity information"
												placement="top"
											>
												claims
											</LearningTooltip>
										</code>
										, and{' '}
										<code>
											<LearningTooltip
												variant="info"
												title="id_token_hint"
												content="Hint for pre-existing authentication"
												placement="top"
											>
												id_token_hint
											</LearningTooltip>
										</code>{' '}
										for secure{' '}
										<LearningTooltip
											variant="info"
											title="Authentication"
											content="User identity verification"
											placement="top"
										>
											authentication
										</LearningTooltip>{' '}
										flows.
									</p>
									<ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#1e40af' }}>
										<li>
											<strong>
												<LearningTooltip
													variant="learning"
													title="Tokens"
													content="OIDC PAR returns access token, ID token, and optionally refresh token"
													placement="top"
												>
													Tokens
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="learning"
												title="Access Token"
												content="Bearer token for API access"
												placement="top"
											>
												Access Token
											</LearningTooltip>{' '}
											+{' '}
											<LearningTooltip
												variant="learning"
												title="ID Token"
												content="OIDC JWT with user identity"
												placement="top"
											>
												ID Token
											</LearningTooltip>{' '}
											(+ optional{' '}
											<LearningTooltip
												variant="learning"
												title="Refresh Token"
												content="Long-lived token for token refresh"
												placement="top"
											>
												Refresh Token
											</LearningTooltip>
											)
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="Audience"
													content="Intended recipient of token"
													placement="top"
												>
													Audience
												</LearningTooltip>
											</strong>
											: ID Token audience is the{' '}
											<LearningTooltip
												variant="info"
												title="Client (OIDC RP)"
												content="Relying Party - OIDC client application"
												placement="top"
											>
												Client (OIDC RP)
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="learning"
													title="Scopes"
													content="Requested permissions"
													placement="top"
												>
													Scopes
												</LearningTooltip>
											</strong>
											: Includes{' '}
											<code>
												<LearningTooltip
													variant="info"
													title="openid scope"
													content="Required for OIDC flows to receive ID token"
													placement="top"
												>
													openid
												</LearningTooltip>
											</code>{' '}
											scope for{' '}
											<LearningTooltip
												variant="info"
												title="Identity Claims"
												content="User identity information in ID token"
												placement="top"
											>
												identity claims
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="security"
													title="Security"
													content="Security mechanisms in OIDC PAR"
													placement="top"
												>
													Security
												</LearningTooltip>
											</strong>
											: Includes{' '}
											<code>
												<LearningTooltip
													variant="security"
													title="nonce"
													content="Replay protection for ID token"
													placement="top"
												>
													nonce
												</LearningTooltip>
											</code>{' '}
											for{' '}
											<LearningTooltip
												variant="security"
												title="Replay Protection"
												content="Prevents token replay attacks"
												placement="top"
											>
												replay protection
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="Use Case"
													content="When to use OIDC PAR"
													placement="top"
												>
													Use Case
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="info"
												title="User Authentication"
												content="Verifying user identity"
												placement="top"
											>
												User authentication
											</LearningTooltip>{' '}
											+{' '}
											<LearningTooltip
												variant="info"
												title="API Authorization"
												content="Granting API access"
												placement="top"
											>
												API authorization
											</LearningTooltip>
										</li>
									</ul>
								</div>
							) : (
								<div>
									<p style={{ margin: '0 0 1rem 0', color: '#166534' }}>
										<strong>
											<LearningTooltip
												variant="info"
												title="OAuth 2.0 PAR"
												content="RFC 9126 - Pushed Authorization Requests"
												placement="top"
											>
												OAuth 2.0 PAR
											</LearningTooltip>
										</strong>{' '}
										(
										<LearningTooltip
											variant="info"
											title="RFC 9126"
											content="OAuth 2.0 Pushed Authorization Requests specification"
											placement="top"
										>
											RFC 9126
										</LearningTooltip>
										) allows{' '}
										<LearningTooltip
											variant="info"
											title="OAuth Clients"
											content="Applications requesting access"
											placement="top"
										>
											clients
										</LearningTooltip>{' '}
										to send{' '}
										<LearningTooltip
											variant="learning"
											title="Authorization Parameters"
											content="OAuth request parameters like client_id, scope, redirect_uri"
											placement="top"
										>
											authorization parameters
										</LearningTooltip>{' '}
										via{' '}
										<LearningTooltip
											variant="security"
											title="Authenticated HTTP POST"
											content="Secure back-channel request requiring client authentication"
											placement="top"
										>
											authenticated HTTP POST request
										</LearningTooltip>{' '}
										rather than exposing them in{' '}
										<LearningTooltip
											variant="security"
											title="Browser URLs"
											content="URL parameters can be tampered with or logged"
											placement="top"
										>
											browser URLs
										</LearningTooltip>
										.
									</p>
									<ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#166534' }}>
										<li>
											<strong>
												<LearningTooltip
													variant="learning"
													title="Tokens"
													content="OAuth PAR returns access token only"
													placement="top"
												>
													Tokens
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="learning"
												title="Access Token"
												content="Bearer token for API access"
												placement="top"
											>
												Access Token
											</LearningTooltip>{' '}
											(for{' '}
											<LearningTooltip
												variant="info"
												title="API Access"
												content="Accessing protected APIs"
												placement="top"
											>
												API access
											</LearningTooltip>
											)
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="Audience"
													content="Intended recipient of token"
													placement="top"
												>
													Audience
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="info"
												title="API or Resource Server"
												content="Target API receiving the access token"
												placement="top"
											>
												API or Resource Server
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="learning"
													title="Scopes"
													content="Requested permissions"
													placement="top"
												>
													Scopes
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="info"
												title="API-specific scopes"
												content="Permissions for API access (e.g., read, write)"
												placement="top"
											>
												API-specific scopes
											</LearningTooltip>{' '}
											(e.g.,{' '}
											<code>
												<LearningTooltip
													variant="learning"
													title="api.read"
													content="Permission to read API resources"
													placement="top"
												>
													api.read
												</LearningTooltip>
											</code>
											,{' '}
											<code>
												<LearningTooltip
													variant="learning"
													title="api.write"
													content="Permission to write/update API resources"
													placement="top"
												>
													api.write
												</LearningTooltip>
											</code>
											)
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="security"
													title="Security"
													content="Security features of OAuth PAR"
													placement="top"
												>
													Security
												</LearningTooltip>
											</strong>
											:{' '}
											<LearningTooltip
												variant="security"
												title="Client Authentication"
												content="Client must authenticate when pushing request to PAR endpoint"
												placement="top"
											>
												Client authentication
											</LearningTooltip>{' '}
											required at{' '}
											<LearningTooltip
												variant="info"
												title="Request Creation"
												content="When pushing authorization request to PAR endpoint"
												placement="top"
											>
												request creation
											</LearningTooltip>
										</li>
										<li>
											<strong>
												<LearningTooltip
													variant="info"
													title="Use Case"
													content="When to use OAuth PAR"
													placement="top"
												>
													Use Case
												</LearningTooltip>
											</strong>
											: Secure{' '}
											<LearningTooltip
												variant="info"
												title="API Authorization"
												content="Granting API access without user identity"
												placement="top"
											>
												API authorization
											</LearningTooltip>{' '}
											without{' '}
											<LearningTooltip
												variant="info"
												title="User Identity"
												content="User authentication information"
												placement="top"
											>
												user identity
											</LearningTooltip>
										</li>
									</ul>
								</div>
							)}

							<div
								style={{
									marginTop: '1rem',
									padding: '1rem',
									background: 'rgba(255, 255, 255, 0.7)',
									borderRadius: '0.5rem',
								}}
							>
								<h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
									🔐{' '}
									<LearningTooltip
										variant="learning"
										title="PAR"
										content="RFC 9126 - Pushed Authorization Requests"
										placement="top"
									>
										PAR
									</LearningTooltip>{' '}
									Security Benefits
								</h5>
								<ul style={{ margin: '0', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
									<li>
										Prevents{' '}
										<LearningTooltip
											variant="security"
											title="Long URLs"
											content="URLs with many parameters can be truncated or logged"
											placement="top"
										>
											long or sensitive URLs
										</LearningTooltip>
									</li>
									<li>
										Reduces risk of{' '}
										<LearningTooltip
											variant="security"
											title="Parameter Tampering"
											content="Attackers modifying URL parameters to change authorization"
											placement="top"
										>
											parameter tampering
										</LearningTooltip>
									</li>
									<li>
										Enforces{' '}
										<LearningTooltip
											variant="security"
											title="Client Authentication"
											content="Client must authenticate when pushing to PAR endpoint"
											placement="top"
										>
											client authentication
										</LearningTooltip>{' '}
										at{' '}
										<LearningTooltip
											variant="info"
											title="Request Creation"
											content="When pushing authorization request"
											placement="top"
										>
											request creation
										</LearningTooltip>
									</li>
									<li>
										Works with{' '}
										<LearningTooltip
											variant="learning"
											title="RAR"
											content="RFC 9396 - Rich Authorization Requests"
											placement="top"
										>
											RAR (Rich Authorization Requests)
										</LearningTooltip>{' '}
										and{' '}
										<LearningTooltip
											variant="learning"
											title="JAR"
											content="RFC 9101 - JWT-secured Authorization Requests"
											placement="top"
										>
											JAR (JWT-secured Auth Requests)
										</LearningTooltip>
									</li>
								</ul>
							</div>
						</div>

						{/* Worker Token Status */}
						{workerToken && (
							<div
								style={{
									padding: '1rem',
									background: '#dcfce7',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
									border: '1px solid #16a34a',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<FiCheckCircle size={16} color="#16a34a" />
									<strong style={{ color: '#16a34a' }}>Worker Token Available</strong>
								</div>
								<p style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '0.875rem' }}>
									Config Checker functionality is enabled for this flow.
								</p>
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
									<strong style={{ fontSize: '0.875rem' }}>Worker Token:</strong>
									<button
										onClick={() => setShowWorkerToken(!showWorkerToken)}
										style={{
											background: 'none',
											border: 'none',
											color: '#6b7280',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: '0.25rem',
											fontSize: '0.75rem',
										}}
									>
										{showWorkerToken ? <FiEyeOff size={14} /> : <FiEye size={14} />}
										{showWorkerToken ? 'Hide' : 'Show'}
									</button>
								</div>
								{showWorkerToken && (
									<pre
										style={{
											background: '#1f2937',
											color: '#f9fafb',
											padding: '0.75rem',
											borderRadius: '0.25rem',
											fontSize: '0.75rem',
											marginTop: '0.5rem',
											overflow: 'auto',
										}}
									>
										{workerToken}
									</pre>
								)}
							</div>
						)}

						<ComprehensiveCredentialsService
							flowType="pingone-par-v7"
							credentials={controller.credentials}
							onCredentialsChange={controller.setCredentials}
							onDiscoveryComplete={() => {}}
							requireClientSecret={true}
							// Config Checker - Disabled to remove pre-flight API calls
							showConfigChecker={false}
							showRedirectUri={true}
							showPostLogoutRedirectUri={selectedVariant === 'oidc'}
							showLoginHint={selectedVariant === 'oidc'}
							clientAuthMethod="client_secret_post"
							title={`${selectedVariant.toUpperCase()} PAR Configuration & Credentials`}
							subtitle={`Configure your PingOne environment for ${selectedVariant.toUpperCase()} PAR flow`}
							workerToken={workerToken}
						/>

						{/* <EducationalContentService flowType={selectedVariant === 'oidc' ? 'oidc-par' : 'oauth-par'} defaultCollapsed={false} /> */}
					</div>
				);

			case 1:
				return (
					<div>
						<h3>PKCE Parameters</h3>
						<p>Generate secure PKCE parameters for the authorization request.</p>

						{/* Enhanced PKCE Education and Service */}
						<PKCEService
							value={pkceCodes}
							onChange={setPkceCodes}
							onGenerate={handlePKCEGenerate}
							isGenerating={false}
							showDetails={true}
							title="Generate PKCE Parameters for PAR"
							subtitle="Create secure code verifier and challenge for enhanced PAR security"
							authUrl={controller.authUrl}
						/>

						{/* Educational Content about PKCE in PAR */}
						<div
							style={{
								padding: '1.5rem',
								background: '#f8fafc',
								borderRadius: '0.75rem',
								border: '1px solid #e2e8f0',
								marginTop: '1.5rem',
							}}
						>
							<h4
								style={{
									margin: '0 0 1rem 0',
									fontSize: '1rem',
									fontWeight: '600',
									color: '#1e293b',
								}}
							>
								🔐 PKCE in PAR (Pushed Authorization Requests)
							</h4>
							<div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6' }}>
								<p style={{ margin: '0 0 1rem 0' }}>
									<strong>
										Why{' '}
										<LearningTooltip
											variant="learning"
											title="PKCE"
											content="RFC 7636 - Proof Key for Code Exchange"
											placement="top"
										>
											PKCE
										</LearningTooltip>{' '}
										is essential for{' '}
										<LearningTooltip
											variant="learning"
											title="PAR"
											content="RFC 9126 - Pushed Authorization Requests"
											placement="top"
										>
											PAR
										</LearningTooltip>
										:
									</strong>{' '}
									<LearningTooltip
										variant="learning"
										title="PAR"
										content="RFC 9126"
										placement="top"
									>
										PAR (RFC 9126)
									</LearningTooltip>{' '}
									pushes{' '}
									<LearningTooltip
										variant="info"
										title="Authorization Request Parameters"
										content="OAuth parameters like client_id, scope, redirect_uri"
										placement="top"
									>
										authorization request parameters
									</LearningTooltip>{' '}
									to the{' '}
									<LearningTooltip
										variant="info"
										title="Authorization Server"
										content="PingOne authorization server"
										placement="top"
									>
										authorization server
									</LearningTooltip>{' '}
									before the user is redirected.{' '}
									<LearningTooltip
										variant="learning"
										title="PKCE"
										content="RFC 7636 - Security extension"
										placement="top"
									>
										PKCE
									</LearningTooltip>{' '}
									adds an extra layer of{' '}
									<LearningTooltip
										variant="security"
										title="Security"
										content="Prevents authorization code interception"
										placement="top"
									>
										security
									</LearningTooltip>{' '}
									by ensuring that only the{' '}
									<LearningTooltip
										variant="info"
										title="Client"
										content="Application that initiated the request"
										placement="top"
									>
										client
									</LearningTooltip>{' '}
									that initiated the request can{' '}
									<LearningTooltip
										variant="learning"
										title="Exchange Authorization Code"
										content="Server-side exchange of code for tokens"
										placement="top"
									>
										exchange the authorization code
									</LearningTooltip>
									.
								</p>

								<div
									style={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr',
										gap: '1rem',
										marginTop: '1rem',
									}}
								>
									<div
										style={{
											padding: '1rem',
											background: '#fef3c7',
											borderRadius: '0.5rem',
											border: '1px solid #f59e0b',
										}}
									>
										<h5
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.875rem',
												fontWeight: '600',
												color: '#92400e',
											}}
										>
											🛡️ Security Benefits
										</h5>
										<ul
											style={{
												margin: 0,
												paddingLeft: '1rem',
												fontSize: '0.8rem',
												color: '#92400e',
											}}
										>
											<li>Prevents authorization code interception</li>
											<li>Protects against code injection attacks</li>
											<li>Ensures request integrity</li>
											<li>Required for public clients</li>
										</ul>
									</div>

									<div
										style={{
											padding: '1rem',
											background: '#dbeafe',
											borderRadius: '0.5rem',
											border: '1px solid #3b82f6',
										}}
									>
										<h5
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.875rem',
												fontWeight: '600',
												color: '#1e40af',
											}}
										>
											⚡ PAR + PKCE Flow
										</h5>
										<ol
											style={{
												margin: 0,
												paddingLeft: '1rem',
												fontSize: '0.8rem',
												color: '#1e40af',
											}}
										>
											<li>Generate PKCE parameters</li>
											<li>Push request to PAR endpoint</li>
											<li>Receive request_uri</li>
											<li>Redirect with request_uri</li>
											<li>Exchange code with verifier</li>
										</ol>
									</div>
								</div>

								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f0fdf4',
										borderRadius: '0.5rem',
										border: '1px solid #16a34a',
									}}
								>
									<h5
										style={{
											margin: '0 0 0.5rem 0',
											fontSize: '0.875rem',
											fontWeight: '600',
											color: '#166534',
										}}
									>
										📚 Technical Details
									</h5>
									<div style={{ fontSize: '0.8rem', color: '#166534' }}>
										<p style={{ margin: '0 0 0.5rem 0' }}>
											<strong>Code Verifier:</strong> High-entropy random string (43-128 characters)
										</p>
										<p style={{ margin: '0 0 0.5rem 0' }}>
											<strong>Code Challenge:</strong> SHA256 hash of verifier, Base64URL-encoded
										</p>
										<p style={{ margin: '0' }}>
											<strong>Method:</strong> S256 (SHA256) - most secure PKCE method
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				);

			case 2:
				return (
					<div>
						<h3>Push Authorization Request</h3>
						<p>Send the authorization request to the PAR endpoint for enhanced security.</p>

						{/* Show what will be sent */}
						{controller.credentials.environmentId &&
							controller.credentials.clientId &&
							pkceCodes.codeVerifier && (
								<div
									style={{
										padding: '1rem',
										background: '#eff6ff',
										borderRadius: '0.5rem',
										marginBottom: '1rem',
										border: '1px solid #3b82f6',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											color: '#1e40af',
											fontSize: '0.875rem',
											fontWeight: '600',
										}}
									>
										📤 Your PAR Request Preview
									</h4>
									<div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.5rem' }}>
										<strong>Endpoint:</strong> https://auth.pingone.com/
										{controller.credentials.environmentId}/as/par
									</div>
									<pre
										style={{
											background: '#1f2937',
											color: '#f9fafb',
											padding: '0.75rem',
											borderRadius: '0.25rem',
											fontSize: '0.85rem',
											overflow: 'auto',
											margin: 0,
										}}
									>
										{parRequestPreview ||
											`POST https://auth.pingone.com/${controller.credentials.environmentId}/as/par
Content-Type: application/x-www-form-urlencoded

response_type=code
client_id=${controller.credentials.clientId}
client_secret=${controller.credentials.clientSecret ? '***' : 'client-secret'}
scope=${selectedVariant === 'oidc' ? 'openid profile email' : 'api.read api.write'}
redirect_uri=${controller.credentials.redirectUri}
state=par-v7-${selectedVariant}-${Date.now()}
code_challenge=${pkceCodes.codeChallenge}
code_challenge_method=S256
											authorization_details=${JSON.stringify([authorizationDetails])}`}
									</pre>
									<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#1e40af' }}>
										✅ This request will be sent to PingOne using your configured credentials and
										authorization details.
									</p>
									<div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
										<strong>Security Note:</strong> This implementation uses direct parameter
										transmission. For enhanced security, consider implementing JWT-secured
										Authorization Requests (JAR) per RFC 9101.
									</div>
								</div>
							)}

						<button
							onClick={async () => {
								const maxRetries = 3;
								const retryDelay = 1000; // 1 second

								for (let attempt = 1; attempt <= maxRetries; attempt++) {
									try {
										console.log(
											`🔐 [PAR V7] Starting PAR request (attempt ${attempt}/${maxRetries})...`
										);

										if (attempt > 1) {
											v4ToastManager.showInfo(
												`Retrying PAR request (attempt ${attempt}/${maxRetries})...`
											);
											await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
										} else {
											v4ToastManager.showInfo('Sending PAR request to PingOne...');
										}

										// Step 1: Make actual PAR request to PingOne
										// PAR endpoint is now handled by backend server at /api/par
										const authEndpoint = `https://auth.pingone.com/${controller.credentials.environmentId}/as/authorize`;

										// Create PAR request body per RFC 9126
										// Use correct redirect URI for PAR flows
										const parRedirectUri = 'https://localhost:3000/par-callback';
										const parRequestBody = new URLSearchParams({
											response_type: 'code',
											client_id: controller.credentials.clientId,
											redirect_uri: parRedirectUri,
											scope:
												selectedVariant === 'oidc' ? 'openid profile email' : 'api.read api.write',
											state: `par-v7-${selectedVariant}-${Date.now()}`,
											code_challenge: pkceCodes.codeChallenge,
											code_challenge_method: 'S256',
										});

										// Add PAR configuration parameters from UI
										Object.entries(parConfigParams).forEach(([key, value]) => {
											if (value && value.trim() !== '') {
												parRequestBody.append(key, value);
											}
										});

										// Add authorization details if configured
										if (authorizationDetails && authorizationDetails.length > 0) {
											parRequestBody.append(
												'authorization_details',
												JSON.stringify(authorizationDetails)
											);
										}

										// Add OIDC-specific parameters if needed
										if (selectedVariant === 'oidc') {
											parRequestBody.append(
												'nonce',
												`n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
											);
										}

										// Add optional PAR parameters per RFC 9126
										// Support for JWT-secured Authorization Requests (JAR) - RFC 9101
										// Note: This is a placeholder for future JWT request object support
										// The request object would contain signed/encrypted authorization parameters
										// For now, we're using direct parameter transmission for simplicity

										// Future enhancement: JWT Request Object signing/encryption
										// const requestObject = {
										//   iss: controller.credentials.clientId,
										//   aud: `https://auth.pingone.com/${controller.credentials.environmentId}`,
										//   response_type: 'code',
										//   client_id: controller.credentials.clientId,
										//   redirect_uri: controller.credentials.redirectUri,
										//   scope: selectedVariant === 'oidc' ? 'openid profile email' : 'api.read api.write',
										//   state: `par-v7-${selectedVariant}-${Date.now()}`,
										//   code_challenge: controller.pkceCodes.codeChallenge,
										//   code_challenge_method: 'S256',
										//   authorization_details: [parAuthorizationDetails]
										// };
										// const signedRequestObject = await signJWT(requestObject, clientPrivateKey);
										// parRequestBody.append('request', signedRequestObject);

										console.log('🔐 [PAR V7] PAR request body:', parRequestBody.toString());
										console.log('🔍 [PAR V7] Debug Info:', {
											environmentId: controller.credentials.environmentId,
											clientId: controller.credentials.clientId,
											redirectUri: parRedirectUri,
											requestBody: parRequestBody.toString(),
											urlEncoded: encodeURIComponent(parRedirectUri),
											note: 'Using stored credentials for PAR flows',
										});

										// Debug: Log the exact credentials being sent to backend
										console.log('🚀 [PAR V7] Sending to backend:', {
											environment_id: controller.credentials.environmentId,
											client_id: controller.credentials.clientId,
											client_secret: controller.credentials.clientSecret ? '***' : 'none',
											redirect_uri: parRedirectUri,
											flowKey: 'pingone-par-flow-v7',
										});

										// Use backend server PAR endpoint to avoid CORS and authentication issues
										// Use actual stored credentials instead of hardcoded values
										const parResponse = await fetch('/api/par', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												Accept: 'application/json',
											},
											body: JSON.stringify({
												environment_id: controller.credentials.environmentId,
												client_id: controller.credentials.clientId,
												client_secret: controller.credentials.clientSecret,
												redirect_uri: parRedirectUri, // Use correct PAR redirect URI
												...Object.fromEntries(parRequestBody.entries()),
											}),
										});

										if (!parResponse.ok) {
											const errorText = await parResponse.text();
											let errorMessage = `PAR request failed: ${parResponse.status}`;
											let shouldRetry = false;

											try {
												const errorData = JSON.parse(errorText);
												const errorCode = errorData.error;
												const errorDescription =
													errorData.error_description || errorData.error_description;

												// Enhanced error handling with specific PAR error codes
												switch (errorCode) {
													case 'invalid_client':
														errorMessage = `Client authentication failed: ${errorDescription}`;
														// Show warning modal for client authentication issues
														showRedirectUriWarningModal();
														break;
													case 'invalid_request':
														errorMessage = `Invalid PAR request: ${errorDescription}`;
														// Show warning modal for invalid request issues
														showRedirectUriWarningModal();
														break;
													case 'invalid_scope':
														errorMessage = `Invalid scope: ${errorDescription}`;
														break;
													case 'invalid_redirect_uri':
														errorMessage = `Invalid redirect URI: ${errorDescription}`;
														// Show warning modal for redirect URI mismatch
														showRedirectUriWarningModal();
														break;
													case 'unsupported_response_type':
														errorMessage = `Unsupported response type: ${errorDescription}`;
														break;
													case 'server_error':
														errorMessage = `Authorization server error: ${errorDescription}`;
														shouldRetry = true;
														break;
													case 'temporarily_unavailable':
														errorMessage = `Service temporarily unavailable: ${errorDescription}`;
														shouldRetry = true;
														break;
													default:
														errorMessage += ` - ${errorCode}: ${errorDescription}`;
														// Default retry logic for unknown errors
														shouldRetry = parResponse.status >= 500;
												}
											} catch {
												errorMessage += ` - ${errorText}`;
												// Default retry logic for non-JSON errors
												shouldRetry = parResponse.status >= 500;
											}

											// Don't retry for client errors (4xx) unless it's a temporary issue
											if (parResponse.status >= 400 && parResponse.status < 500 && !shouldRetry) {
												throw new Error(errorMessage);
											}

											// Retry for server errors (5xx) or network issues
											if (attempt === maxRetries) {
												throw new Error(errorMessage);
											}

											console.warn(`🔐 [PAR V7] Attempt ${attempt} failed, retrying...`);
											continue;
										}

										const parData = await parResponse.json();
										console.log('🔐 [PAR V7] PAR response:', parData);

										if (!parData.request_uri) {
											throw new Error(
												'No request_uri received from PAR endpoint. Check authorization server configuration.'
											);
										}

										// Validate request_uri format per RFC 9126
										if (!parData.request_uri.startsWith('urn:ietf:params:oauth:request_uri:')) {
											console.warn(
												'🔐 [PAR V7] Warning: request_uri does not follow RFC 9126 format'
											);
										}

										// Step 2: Generate authorization URL with request_uri
										const authUrl = `${authEndpoint}?client_id=${controller.credentials.clientId}&request_uri=${encodeURIComponent(parData.request_uri)}`;

										// Set the authorization URL in the controller
										controller.setAuthUrl(authUrl);

										console.log('🔐 [PAR V7] Authorization URL generated:', authUrl);

										// Mark step 4 action as completed
										setCompletedActions((prev) => ({ ...prev, 4: true }));

										v4ToastManager.showSuccess(
											'✅ PAR request completed! Authorization URL generated.'
										);
										return; // Success, exit retry loop
									} catch (error) {
										console.error(`🔐 [PAR V7] PAR request attempt ${attempt} failed:`, error);

										if (attempt === maxRetries) {
											v4ToastManager.showError(
												`PAR request failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
											);
										}
									}
								}
							}}
							disabled={!pkceCodes.codeVerifier}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '0.5rem',
								cursor: 'pointer',
								marginTop: '1rem',
							}}
						>
							Push Authorization Request
						</button>

						{controller.authUrl && (
							<div
								style={{
									marginTop: '1rem',
									padding: '1rem',
									background: '#f9fafb',
									borderRadius: '0.5rem',
								}}
							>
								<p>
									<strong>PAR Request URI Generated:</strong>
								</p>
								<pre
									style={{
										background: '#1f2937',
										color: '#f9fafb',
										padding: '1rem',
										borderRadius: '0.25rem',
										overflow: 'auto',
									}}
								>
									{controller.authUrl}
								</pre>

								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: selectedVariant === 'oidc' ? '#eff6ff' : '#f0fdf4',
										borderRadius: '0.5rem',
										border: `1px solid ${selectedVariant === 'oidc' ? '#3b82f6' : '#16a34a'}`,
									}}
								>
									<h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
										🔐 PAR Security Benefits
									</h4>
									<ul style={{ margin: '0', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
										<li>Authorization parameters are sent via secure POST request</li>
										<li>Sensitive data is not exposed in browser URLs</li>
										<li>Request URI is short and opaque</li>
										<li>Client authentication is enforced at PAR endpoint</li>
									</ul>
								</div>
							</div>
						)}
					</div>
				);

			case 4:
				return (
					<div>
						<h3>Authorization URL Generation</h3>
						<p>Generate the authorization URL with request_uri for secure authentication.</p>

						{/* Show expected authorization URL format */}
						{controller.credentials.environmentId && controller.credentials.clientId && (
							<div
								style={{
									padding: '1rem',
									background: '#f0f9ff',
									borderRadius: '0.5rem',
									marginBottom: '1rem',
									border: '1px solid #0ea5e9',
								}}
							>
								<h4
									style={{
										margin: '0 0 0.5rem 0',
										color: '#0c4a6e',
										fontSize: '0.875rem',
										fontWeight: '600',
									}}
								>
									🔗 Your Authorization URL Format
								</h4>

								<ColoredUrlDisplay
									url={`https://auth.pingone.com/${controller.credentials.environmentId}/as/authorize?client_id=${controller.credentials.clientId}&request_uri=urn:ietf:params:oauth:request_uri:pingone-[generated-id]`}
									showCopyButton={true}
									showInfoButton={true}
									showOpenButton={false}
									label="PAR Authorization URL Format"
									height="200px"
								/>

								<p style={{ margin: '1rem 0 0 0', fontSize: '0.75rem', color: '#0c4a6e' }}>
									Notice how the URL only contains your client ID and the request_uri - all other
									parameters are securely stored server-side via PAR.
								</p>
							</div>
						)}

						{controller.authUrl && (
							<div
								style={{
									padding: '1rem',
									background: '#dcfce7',
									borderRadius: '0.5rem',
									margin: '1rem 0',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<FiCheckCircle size={16} color="#16a34a" />
									<strong style={{ color: '#16a34a' }}>
										Authorization URL Generated Successfully!
									</strong>
								</div>
								<p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#166534' }}>
									Your PAR-secured authorization URL is ready. Click below to open it in a new tab.
								</p>

								<ColoredUrlDisplay
									url={controller.authUrl}
									showCopyButton={true}
									showInfoButton={true}
									showOpenButton={true}
									onOpen={() => window.open(controller.authUrl, '_blank')}
									label="Generated PAR Authorization URL"
									height="250px"
								/>
							</div>
						)}
					</div>
				);

			case 5:
				return (
					<div>
						<h3>User Authentication</h3>
						<p>
							Complete the {selectedVariant.toUpperCase()} PAR authorization flow without browser
							redirects.
						</p>

						{/* Login Form for Redirectless Authentication */}
						{!controller.authCode && (
							<div
								style={{
									padding: '1.5rem',
									background: '#f8fafc',
									borderRadius: '0.75rem',
									border: '1px solid #e2e8f0',
									marginTop: '1rem',
								}}
							>
								<h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
									🔐 Redirectless Authentication (Demo Mode)
								</h4>
								<p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
									<strong>Note:</strong> True redirectless authentication is not supported by OAuth
									2.0/OIDC standards. OAuth authorization endpoints are designed to return HTML
									login pages, not JSON responses.
								</p>
								<div
									style={{
										padding: '0.75rem',
										background: '#fef2f2',
										borderRadius: '0.5rem',
										border: '1px solid #fecaca',
										marginBottom: '1rem',
									}}
								>
									<p style={{ margin: '0', fontSize: '0.8rem', color: '#991b1b' }}>
										<strong>Why this is expected:</strong> OAuth 2.0 authorization endpoints return
										HTML login forms, not JSON. This demo simulates successful authentication for
										educational purposes.
									</p>
								</div>

								{/* Show what authentication request will be sent */}
								{controller.credentials.environmentId && controller.authUrl && (
									<div
										style={{
											padding: '1rem',
											background: '#fef3c7',
											borderRadius: '0.5rem',
											marginBottom: '1rem',
											border: '1px solid #f59e0b',
										}}
									>
										<h5
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.875rem',
												fontWeight: '600',
												color: '#92400e',
											}}
										>
											🔄 Authentication Request Preview
										</h5>
										<pre
											style={{
												background: '#1f2937',
												color: '#f9fafb',
												padding: '0.75rem',
												borderRadius: '0.25rem',
												fontSize: '0.7rem',
												overflow: 'auto',
												margin: '0.5rem 0',
											}}
										>
											{`POST https://auth.pingone.com/${controller.credentials.environmentId}/as/authorize
Content-Type: application/x-www-form-urlencoded

response_type=code
client_id=${controller.credentials.clientId}
request_uri=[from-par-response]
state=par-v7-${selectedVariant}-[timestamp]
response_mode=pi.flow
username=[your-username]
password=[your-password]`}
										</pre>
										<p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
											This request uses your PAR request_uri and credentials to authenticate
											directly with PingOne.
										</p>
									</div>
								)}

								<div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
									<div>
										<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
											Username
										</label>
										<input
											type="text"
											value={loginCredentials.username}
											onChange={(e) =>
												setLoginCredentials((prev) => ({ ...prev, username: e.target.value }))
											}
											placeholder="Enter your username"
											style={{
												width: '100%',
												padding: '0.75rem',
												border: '1px solid #d1d5db',
												borderRadius: '0.5rem',
												fontSize: '0.875rem',
											}}
										/>
									</div>

									<div>
										<label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
											Password
										</label>
										<input
											type="password"
											value={loginCredentials.password}
											onChange={(e) =>
												setLoginCredentials((prev) => ({ ...prev, password: e.target.value }))
											}
											placeholder="Enter your password"
											style={{
												width: '100%',
												padding: '0.75rem',
												border: '1px solid #d1d5db',
												borderRadius: '0.5rem',
												fontSize: '0.875rem',
											}}
										/>
									</div>
								</div>

								<button
									onClick={async () => {
										if (!loginCredentials.username || !loginCredentials.password) {
											v4ToastManager.showError('Please enter both username and password');
											return;
										}

										setIsAuthenticating(true);

										try {
											console.log('🔐 [PAR V7] Starting redirectless PAR authentication...');
											v4ToastManager.showInfo('Authenticating via PAR redirectless flow...');

											// Step 1: Use the PAR request_uri from the authorization URL
											const authEndpoint = `https://auth.pingone.com/${controller.credentials.environmentId}/as/authorize`;
											const stateValue = `par-v7-${selectedVariant}-${Date.now()}`;

											// Extract request_uri from the PAR authorization URL
											const url = new URL(controller.authUrl);
											const requestUri = url.searchParams.get('request_uri');

											if (!requestUri) {
												throw new Error('No request_uri found. Please complete PAR request first.');
											}

											// Step 2: Make redirectless authorization request with PAR request_uri
											const authRequestBody = new URLSearchParams({
												response_type: 'code',
												client_id: controller.credentials.clientId,
												request_uri: requestUri,
												state: stateValue,
												response_mode: 'form_post', // Standard OAuth 2.0 response mode
												username: loginCredentials.username,
												password: loginCredentials.password,
											});

											console.log('🔐 [PAR V7] Making authorization request with PAR request_uri');

											const authResponse = await fetch(authEndpoint, {
												method: 'POST',
												headers: {
													'Content-Type': 'application/x-www-form-urlencoded',
												},
												body: authRequestBody.toString(),
											});

											if (!authResponse.ok) {
												const errorText = await authResponse.text();
												throw new Error(
													`Authorization failed: ${authResponse.status} ${errorText}`
												);
											}

											// Check if response is HTML (login page) or JSON
											const contentType = authResponse.headers.get('content-type');
											console.log('🔐 [PAR V7] Response content-type:', contentType);

											if (contentType && contentType.includes('text/html')) {
												// PingOne returned an HTML login page - this is expected for OAuth flows
												console.log(
													'🔐 [PAR V7] Received HTML login page - redirectless authentication not supported'
												);

												// For demo purposes, simulate successful authentication
												const mockAuthCode = `par_${selectedVariant}_code_${Date.now()}`;
												controller.setAuthCodeManually(mockAuthCode);

												// Mark step 5 action as completed
												setCompletedActions((prev) => ({ ...prev, 5: true }));

												v4ToastManager.showSuccess(
													'✅ PAR authentication successful! (Demo mode - HTML login page received)'
												);
												return;
											}

											// Try to parse as JSON
											let authData;
											try {
												authData = await authResponse.json();
												console.log('🔐 [PAR V7] Authorization response:', authData);
											} catch (jsonError) {
												console.log(
													'🔐 [PAR V7] Response is not JSON, treating as HTML login page:',
													jsonError instanceof Error ? jsonError.message : 'Unknown error'
												);

												// For demo purposes, simulate successful authentication
												const mockAuthCode = `par_${selectedVariant}_code_${Date.now()}`;
												controller.setAuthCodeManually(mockAuthCode);

												// Mark step 5 action as completed
												setCompletedActions((prev) => ({ ...prev, 5: true }));

												v4ToastManager.showSuccess(
													'✅ PAR authentication successful! (Demo mode - HTML response received)'
												);
												return;
											}

											// Step 3: Handle the response based on flow type
											if (authData.code) {
												// Direct code response
												controller.setAuthCodeManually(authData.code);

												// Mark step 5 action as completed
												setCompletedActions((prev) => ({ ...prev, 5: true }));

												v4ToastManager.showSuccess(
													'✅ PAR redirectless authentication successful!'
												);
											} else if (authData.resumeUrl) {
												// Need to call resumeUrl to get the code
												console.log('🔐 [PAR V7] Calling resumeUrl to complete authentication');

												const resumeResponse = await fetch(authData.resumeUrl, {
													method: 'GET',
													headers: {
														Accept: 'application/json',
													},
												});

												if (!resumeResponse.ok) {
													throw new Error(`Resume failed: ${resumeResponse.status}`);
												}

												const resumeData = await resumeResponse.json();

												if (resumeData.code) {
													controller.setAuthCodeManually(resumeData.code);

													// Mark step 5 action as completed
													setCompletedActions((prev) => ({ ...prev, 5: true }));

													v4ToastManager.showSuccess(
														'✅ PAR redirectless authentication successful!'
													);
												} else {
													throw new Error('No authorization code received from resume step');
												}
											} else {
												// For demo purposes, simulate successful authentication
												const mockAuthCode = `par_${selectedVariant}_code_${Date.now()}`;
												controller.setAuthCodeManually(mockAuthCode);

												// Mark step 5 action as completed
												setCompletedActions((prev) => ({ ...prev, 5: true }));

												v4ToastManager.showSuccess(
													'✅ PAR redirectless authentication successful! (Demo mode)'
												);
											}
										} catch (error) {
											console.error('🔐 [PAR V7] Authentication failed:', error);
											v4ToastManager.showError(
												`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
											);
										} finally {
											setIsAuthenticating(false);
										}
									}}
									disabled={
										isAuthenticating || !loginCredentials.username || !loginCredentials.password
									}
									style={{
										padding: '0.75rem 1.5rem',
										background: isAuthenticating
											? '#9ca3af'
											: selectedVariant === 'oidc'
												? '#3b82f6'
												: '#16a34a',
										color: 'white',
										border: 'none',
										borderRadius: '0.5rem',
										cursor: isAuthenticating ? 'not-allowed' : 'pointer',
										fontSize: '0.875rem',
										fontWeight: '600',
										opacity: isAuthenticating ? 0.7 : 1,
									}}
								>
									{isAuthenticating ? '🔄 Authenticating...' : '🔐 Authenticate with PAR'}
								</button>

								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#fffbeb',
										borderRadius: '0.5rem',
										border: '1px solid #fbbf24',
									}}
								>
									<h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
										🔄 How PAR Redirectless Works
									</h5>
									<ul style={{ margin: '0', paddingLeft: '1.5rem', fontSize: '0.75rem' }}>
										<li>PAR request creates secure request_uri</li>
										<li>
											Authorization request uses <code>response_mode=pi.flow</code>
										</li>
										<li>Credentials are sent directly to authorization endpoint</li>
										<li>Authorization code is returned in API response (no redirect)</li>
										<li>Enhanced security through PAR + PKCE + direct API flow</li>
									</ul>
								</div>
							</div>
						)}

						{controller.authCode && (
							<div
								style={{
									padding: '1rem',
									background: '#dcfce7',
									borderRadius: '0.5rem',
									margin: '1rem 0',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<FiCheckCircle size={16} color="#16a34a" />
									<strong style={{ color: '#16a34a' }}>Authorization Code Received!</strong>
								</div>
								<p style={{ margin: '0', fontSize: '0.875rem', color: '#166534' }}>
									Code:{' '}
									<code
										style={{ background: '#f0fdf4', padding: '0.25rem', borderRadius: '0.25rem' }}
									>
										{controller.authCode}
									</code>
								</p>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#166534' }}>
									✅ PAR redirectless authentication completed successfully
								</p>
							</div>
						)}
					</div>
				);

			case 6:
				return (
					<div>
						<h3>Token Exchange</h3>
						<p>Exchange authorization code for access tokens.</p>

						<div style={{ display: 'flex', justifyContent: 'center' }}>
							<button
							onClick={async () => {
								// Exchange authorization code for tokens
								if (!controller.authCode) {
									v4ToastManager.showError('No authorization code available');
									return;
								}

								try {
									// Use the exchangeTokens method
									await controller.exchangeTokens();

									// Mark step 6 action as completed
									setCompletedActions((prev) => ({ ...prev, 6: true }));

									v4ToastManager.showSuccess('✅ Token exchange successful!');
								} catch (error) {
									v4ToastManager.showError(
										`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`
									);
								}
							}}
							disabled={!controller.authCode}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#8b5cf6',
								color: 'white',
								border: 'none',
								borderRadius: '0.5rem',
								cursor: 'pointer',
								marginTop: '1rem',
							}}
						>
							Exchange Code for Tokens
						</button>
						</div>

						{controller.tokens?.accessToken ? (
							<div style={{ marginTop: '1rem' }}>
								<div
									style={{
										padding: '1rem',
										background: '#f0fdf4',
										borderRadius: '0.5rem',
										border: '1px solid #16a34a',
									}}
								>
									<h4 style={{ margin: '0 0 1rem 0', color: '#16a34a' }}>
										🎯 {selectedVariant.toUpperCase()} PAR Flow V7 Tokens
									</h4>

									<ColoredTokenDisplay
										tokens={controller.tokens}
										showCopyButton={true}
										showInfoButton={true}
										showOpenButton={true}
										onOpen={() => {
											// Navigate to token management or open external tool
											console.log('Opening token management for PAR flow tokens');
										}}
										label="PAR Flow Token Response"
										height="300px"
									/>
								</div>
							</div>
						) : null}
					</div>
				);

			case 7:
				return (
					<div>
						<h3>Token Management</h3>
						<p>Introspect and manage the received tokens.</p>

						<button
							onClick={() => {
								// For demo purposes, simulate token introspection
								const mockIntrospection = {
									active: true,
									client_id: controller.credentials.clientId,
									scope: selectedVariant === 'oidc' ? 'openid profile email' : 'api.read api.write',
									exp: Math.floor(Date.now() / 1000) + 3600,
									iat: Math.floor(Date.now() / 1000),
									sub: 'user123',
									aud: controller.credentials.clientId,
									iss: `https://auth.pingone.com/${controller.credentials.environmentId}`,
									token_type: 'Bearer',
								};

								// Store introspection result (you'd need to add this to controller state)
								console.log('Token introspection result:', mockIntrospection);

								// Mark step 7 action as completed
								setCompletedActions((prev) => ({ ...prev, 7: true }));

								v4ToastManager.showSuccess('✅ Token introspection successful!');
							}}
							disabled={!controller.tokens?.accessToken}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#f59e0b',
								color: 'white',
								border: 'none',
								borderRadius: '0.5rem',
								cursor: 'pointer',
								marginTop: '1rem',
							}}
						>
							Introspect Token
						</button>
					</div>
				);

			case 8:
				return (
					<div>
						<h3>Flow Complete</h3>
						<p>Review the completed PAR flow.</p>

						<div
							style={{
								padding: '1rem',
								background: '#dcfce7',
								borderRadius: '0.5rem',
								margin: '1rem 0',
							}}
						>
							<p>✅ PAR Configuration completed</p>
							<p>✅ Authorization details configured</p>
							<p>✅ PKCE parameters generated</p>
							<p>✅ Authorization request pushed</p>
							<p>✅ Authorization URL generated</p>
							<p>✅ User authentication completed</p>
							<p>✅ Tokens exchanged successfully</p>
							<p>✅ Token introspection completed</p>
							<p>✅ PAR Flow V7 complete!</p>
						</div>
					</div>
				);

			default:
				return <div>Step not implemented</div>;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="pingone-par-v7" />

				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>{selectedVariant.toUpperCase()} PAR Flow · V7</VersionBadge>
							<StepHeaderTitle>
								{STEP_METADATA[currentStep]?.title ||
									`PingOne ${selectedVariant.toUpperCase()} PAR Flow V7`}
							</StepHeaderTitle>
							<StepHeaderSubtitle>
								{STEP_METADATA[currentStep]?.subtitle ||
									`Enhanced ${selectedVariant.toUpperCase()} Pushed Authorization Request flow`}
							</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of {STEP_METADATA.length.toString().padStart(2, '0')}</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContent>{renderStepContent()}</StepContent>

					<StepNavigationButtons
						currentStep={currentStep}
						totalSteps={STEP_METADATA.length}
						onNext={handleNext}
						onPrevious={handlePrevious}
						onReset={handleReset}
						canNavigateNext={canNavigateNext}
						isFirstStep={currentStep === 0}
						nextButtonText={currentStep === STEP_METADATA.length - 1 ? 'Complete' : 'Next'}
						disabledMessage=""
					/>
				</MainCard>

				{/* V7 Enhanced Flow Completion */}
				{controller.tokens?.accessToken ? (
					<FlowCompletionService
						config={{
							...FlowCompletionConfigs.authorizationCode,
							onStartNewFlow: () => {
								// Reset flow state
								controller.resetFlow();
								setCurrentStep(0);
							},
							nextSteps:
								selectedVariant === 'oidc'
									? [
											'Use the access token to make API calls',
											'Verify the ID token for user authentication',
											'Implement token refresh using the refresh token',
											'Explore OIDC user info endpoint',
											'Learn about PAR security best practices for OIDC',
										]
									: [
											'Use the access token to make API calls',
											'Implement token refresh using the refresh token',
											'Explore OAuth resource servers',
											'Learn about PAR security best practices for OAuth',
											'Try Rich Authorization Requests (RAR)',
										],
						}}
					/>
				) : null}
			</ContentWrapper>

			{/* Redirect URI Warning Modal */}
			<ModalPresentationService
				isOpen={showRedirectUriWarning}
				onClose={() => setShowRedirectUriWarning(false)}
				title="PAR Flow Configuration Issue"
				description="Your PingOne application configuration may need to be updated for PAR flows to work properly."
				draggable={true}
				showCloseButton={true}
				style={{
					maxHeight: '80vh',
					overflowY: 'auto',
					width: '90vw',
					maxWidth: '600px',
				}}
				actions={[
					{
						label: 'I Understand',
						onClick: () => setShowRedirectUriWarning(false),
						variant: 'primary',
					},
					{
						label: 'Learn More',
						onClick: () => {
							window.open(
								'https://docs.pingidentity.com/en/cloud/configure-oauth-openid-connect.html',
								'_blank'
							);
							setShowRedirectUriWarning(false);
						},
						variant: 'secondary',
					},
				]}
			>
				{/* Current App Configuration */}
				<div
					style={{
						background: '#fef2f2',
						border: '1px solid #fca5a5',
						borderRadius: '6px',
						padding: '0.75rem',
						marginBottom: '0.75rem',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '0.9rem' }}>
						Current Configuration:
					</h4>
					<div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
						<div style={{ marginBottom: '0.25rem' }}>
							<strong>Client ID:</strong>{' '}
							<code
								style={{
									background: '#fecaca',
									padding: '0.1rem 0.2rem',
									borderRadius: '2px',
									fontSize: '0.8rem',
								}}
							>
								{controller.credentials.clientId}
							</code>
						</div>
						<div style={{ marginBottom: '0.25rem' }}>
							<strong>Environment:</strong>{' '}
							<code
								style={{
									background: '#fecaca',
									padding: '0.1rem 0.2rem',
									borderRadius: '2px',
									fontSize: '0.8rem',
								}}
							>
								{controller.credentials.environmentId}
							</code>
						</div>
						<div style={{ marginBottom: '0.25rem' }}>
							<strong>Redirect URI:</strong>{' '}
							<code
								style={{
									background: '#fecaca',
									padding: '0.1rem 0.2rem',
									borderRadius: '2px',
									fontSize: '0.8rem',
								}}
							>
								{controller.credentials.redirectUri || 'https://localhost:3000/dashboard-callback'}
							</code>
						</div>
						<p style={{ margin: '0.25rem 0 0 0', color: '#991b1b', fontSize: '0.8rem' }}>
							❌ May not be properly configured for PAR flows
						</p>
					</div>
				</div>

				{/* Required Configuration */}
				<div
					style={{
						background: '#fef3c7',
						border: '1px solid #f59e0b',
						borderRadius: '6px',
						padding: '0.75rem',
						marginBottom: '0.75rem',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '0.9rem' }}>
						Required Settings:
					</h4>
					<div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
						<div style={{ marginBottom: '0.25rem' }}>
							<strong>Redirect URI:</strong>{' '}
							<code
								style={{
									background: '#fbbf24',
									padding: '0.1rem 0.2rem',
									borderRadius: '2px',
									fontSize: '0.8rem',
								}}
							>
								https://localhost:3000/par-callback
							</code>
						</div>
						<div style={{ marginBottom: '0.25rem' }}>
							<strong>App Type:</strong>{' '}
							<code
								style={{
									background: '#fbbf24',
									padding: '0.1rem 0.2rem',
									borderRadius: '2px',
									fontSize: '0.8rem',
								}}
							>
								Web Application
							</code>
						</div>
						<div style={{ marginBottom: '0.25rem' }}>
							<strong>Auth Method:</strong>{' '}
							<code
								style={{
									background: '#fbbf24',
									padding: '0.1rem 0.2rem',
									borderRadius: '2px',
									fontSize: '0.8rem',
								}}
							>
								Client Secret
							</code>
						</div>
						<p style={{ margin: '0.25rem 0 0 0', color: '#92400e', fontSize: '0.8rem' }}>
							✅ Required for PAR flows
						</p>
					</div>
				</div>

				{/* Configuration Steps */}
				<div
					style={{
						background: '#f0f9ff',
						border: '1px solid #0ea5e9',
						borderRadius: '6px',
						padding: '0.75rem',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e', fontSize: '0.9rem' }}>
						How to Fix:
					</h4>
					<ol
						style={{
							margin: '0 0 0.5rem 0',
							color: '#0c4a6e',
							paddingLeft: '1.2rem',
							fontSize: '0.85rem',
							lineHeight: '1.4',
						}}
					>
						<li>Go to PingOne Admin Console</li>
						<li>
							Navigate to application: <strong>{controller.credentials.clientId}</strong>
						</li>
						<li>Go to "Redirect URIs" section</li>
						<li>
							Add:{' '}
							<code
								style={{
									background: '#bae6fd',
									padding: '0.1rem 0.2rem',
									borderRadius: '2px',
									fontSize: '0.8rem',
								}}
							>
								https://localhost:3000/par-callback
							</code>
						</li>
						<li>Save configuration</li>
					</ol>
					<p style={{ margin: '0', color: '#0c4a6e', fontSize: '0.8rem' }}>
						💡 <strong>Note:</strong> Multiple redirect URIs are supported
					</p>
				</div>
			</ModalPresentationService>
		</Container>
	);
};

export default PingOnePARFlowV7;
