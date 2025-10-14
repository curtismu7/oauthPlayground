// src/pages/flows/OIDCAuthorizationCodeFlowV3.tsx - OIDC Authorization Code Flow V3

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import styled from 'styled-components';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import DefaultRedirectUriModal from '../../components/DefaultRedirectUriModal';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { FlowConfiguration, FlowType } from '../../components/FlowConfiguration';
import FlowIntro from '../../components/flow/FlowIntro';
import ImplicitSafetySummary from '../../components/flow/ImplicitSafetySummary';
import {
	createAuthUrlStep,
	createCallbackHandlingStep,
	createCredentialsStep,
	createPKCEStep,
	createRefreshTokenStep,
	createTokenExchangeStep,
	createUserAuthorizationStep,
} from '../../components/steps/CommonSteps';
import { showGlobalError, showGlobalSuccess } from '../../hooks/useNotifications';
import { useUISettings } from '../../contexts/UISettingsContext';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import { credentialManager } from '../../utils/credentialManager';
import { enhancedDebugger } from '../../utils/enhancedDebug';
import { trackFlowCompletion } from '../../utils/flowCredentialChecker';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { generateCodeChallenge, generateCodeVerifier } from '../../utils/oauth';
import { usePerformanceMonitor } from '../../utils/performance';

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const HeroSection = styled.section`
	margin-bottom: 2rem;
	border-radius: 16px;
	padding: 2.5rem;
	background: #f8fafc;
	border: 1px solid #d1d5db;
`;

const FlowCard = styled.div`
	background: white;
	border-radius: 16px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	overflow: hidden;
`;

const FlowControlSection = styled.div`
	padding: 2rem;
	border-top: 1px solid #e5e7eb;
	background: #f9fafb;
`;

const FlowControlTitle = styled.h3`
	margin: 0 0 1.5rem 0;
	color: #374151;
	font-size: 1.1rem;
	font-weight: 600;
`;

const FlowControlButtons = styled.div`
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	justify-content: flex-start;
	align-items: center;
`;

const FlowControlButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	border: none;
	border-radius: 8px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 140px;
	justify-content: center;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	&:active {
		transform: translateY(0);
	}

	&.clear {
		background: #10b981;
		color: white;

		&:hover {
			background: #059669;
		}
	}

	&.reset {
		background: #6b7280;
		color: white;

		&:hover {
			background: #4b5563;
		}
	}
`;

const OIDCAuthorizationCodeFlowV3: React.FC = () => {
	const _authContext = useAuth();

	// Performance monitoring
	const _performanceMonitor = usePerformanceMonitor('OIDCAuthorizationCodeFlowV3');

	// Start debug session
	React.useEffect(() => {
		const sessionId = enhancedDebugger.startSession('oidc-authorization-code-v3');
		console.log('[OIDC-AUTHZ-V3] Debug session started:', sessionId);

		return () => {
			const session = enhancedDebugger.endSession();
			if (session) {
				console.log('[OIDC-AUTHZ-V3] Debug session completed:', {
					duration: session.performance.totalDuration,
					steps: session.steps.length,
					errors: session.errors.length,
				});
			}
		};
	}, []);

	// Use the new step management system
	const stepManager = useFlowStepManager({
		flowType: 'oidc-authorization-code',
		persistKey: 'oidc-authz-v3',
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// State management
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [_userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [showClearCredentialsModal, setShowClearCredentialsModal] = useState(false);
	const [isClearingCredentials, setIsClearingCredentials] = useState(false);
	const [showDefaultRedirectUriModal, setShowDefaultRedirectUriModal] = useState(false);
	const [defaultRedirectUri, setDefaultRedirectUri] = useState('');
	const [isResettingFlow, setIsResettingFlow] = useState(false);
	const [_validationErrors, setValidationErrors] = useState({
		clientId: false,
		environmentId: false,
		redirectUri: false,
		scopes: false,
	});

	// Client ID validation function
	const validateClientId = useCallback((clientId: string): boolean => {
		if (!clientId || clientId.trim() === '') return false;
		const isValid = /^[a-zA-Z0-9_-]+$/.test(clientId) && clientId.length >= 8;
		return isValid;
	}, []);

	// Environment ID validation function
	const validateEnvironmentId = useCallback((envId: string): boolean => {
		if (!envId || envId.trim() === '') return false;
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(envId);
	}, []);

	// Update validation errors when credentials change
	useEffect(() => {
		setValidationErrors({
			clientId: credentials.clientId ? !validateClientId(credentials.clientId) : false,
			environmentId: credentials.environmentId
				? !validateEnvironmentId(credentials.environmentId)
				: false,
		});
	}, [validateClientId, validateEnvironmentId]);

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			try {
				const saved = credentialManager.loadAuthzFlowCredentials();
				if (saved) {
					setCredentials({
						clientId: saved.clientId || '',
						clientSecret: saved.clientSecret || '',
						environmentId: saved.environmentId || '',
						redirectUri: saved.redirectUri || getCallbackUrlForFlow('authorization-code'),
						scope: Array.isArray(saved.scopes)
							? saved.scopes.join(' ')
							: saved.scopes || 'openid profile email',
						authorizationEndpoint: saved.authEndpoint || '',
						tokenEndpoint: saved.tokenEndpoint || '',
						userInfoEndpoint: saved.userInfoEndpoint || '',
						clientAuthMethod: saved.tokenAuthMethod || 'client_secret_post',
					});
				}
			} catch (error) {
				console.error('[OIDC-AUTHZ-V3] Failed to load credentials:', error);
				const defaultUri = getCallbackUrlForFlow('authorization-code');
				setDefaultRedirectUri(defaultUri);
				setShowDefaultRedirectUriModal(true);
				setCredentials((prev) => ({
					...prev,
					redirectUri: defaultUri,
				}));
			}
		};
		loadCredentials();
	}, []);

	// Handle callback return with tokens
	useEffect(() => {
		const handleCallbackReturn = () => {
			try {
				const storedTokens = sessionStorage.getItem('oauth_v3_tokens');
				if (storedTokens) {
					console.log('[OIDC-AUTHZ-V3] Found tokens from callback');

					const tokenData = JSON.parse(storedTokens);
					setTokens(tokenData);

					trackFlowCompletion('oidc-authorization-code-v3');

					stepManager.setStep(5, 'callback return with tokens');
					console.log('[OIDC-AUTHZ-V3] Auto-advancing to step 5 after callback return');

					showGlobalSuccess(
						'Authorization successful',
						'Tokens received from PingOne. You can now view and validate the tokens.'
					);

					sessionStorage.removeItem('oauth_v3_tokens');
				}
			} catch (error) {
				console.error('[OIDC-AUTHZ-V3] Failed to handle callback return:', error);
			}
		};

		handleCallbackReturn();
	}, [stepManager]);

	// Save credentials function
	const saveCredentials = useCallback(async () => {
		try {
			const success = credentialManager.saveAuthzFlowCredentials({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scope.split(' '),
				authEndpoint: credentials.authorizationEndpoint,
				tokenEndpoint: credentials.tokenEndpoint,
				userInfoEndpoint: credentials.userInfoEndpoint,
				tokenAuthMethod: credentials.clientAuthMethod,
			});

			if (success) {
				showGlobalSuccess('Credentials saved successfully');
				console.log('[OIDC-AUTHZ-V3] Credentials saved to credential manager');
			} else {
				throw new Error('Failed to save credentials to credential manager');
			}
		} catch (error) {
			showGlobalError('Failed to save credentials');
			console.error('[OIDC-AUTHZ-V3] Failed to save credentials:', error);
		}
	}, []);

	// Generate PKCE codes
	const generatePKCE = useCallback(async () => {
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			setPkceCodes({
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256',
			});

			sessionStorage.setItem('code_verifier', codeVerifier);

			showGlobalSuccess('PKCE codes generated');
			console.log('[OIDC-AUTHZ-V3] PKCE codes generated and stored');
		} catch (error) {
			showGlobalError('Failed to generate PKCE codes');
			console.error('[OIDC-AUTHZ-V3] Failed to generate PKCE codes:', error);
		}
	}, []);

	// Build authorization URL
	const buildAuthorizationUrl = useCallback(async () => {
		try {
			if (
				!credentials.environmentId ||
				!credentials.clientId ||
				!credentials.redirectUri ||
				!credentials.scope
			) {
				throw new Error('Missing required credentials. Please ensure all fields are filled.');
			}

			const authEndpoint =
				credentials.authorizationEndpoint ||
				`https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				redirect_uri: credentials.redirectUri,
				response_type: 'code',
				scope: credentials.scope,
				code_challenge: pkceCodes.codeChallenge,
				code_challenge_method: 'S256',
			});

			const fullUrl = `${authEndpoint}?${params.toString()}`;
			setAuthUrl(fullUrl);

			showGlobalSuccess('Authorization URL built successfully');
			console.log('[OIDC-AUTHZ-V3] Authorization URL built:', {
				endpoint: authEndpoint,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scope,
			});
		} catch (error) {
			console.error('[OIDC-AUTHZ-V3] Failed to build authorization URL:', error);
			showGlobalError(`Failed to build authorization URL: ${error.message}`);
		}
	}, []);

	// Direct authorization redirect
	const handleAuthorizationDirect = useCallback(() => {
		if (!authUrl) {
			showGlobalError('Please build authorization URL first');
			return;
		}

		setIsRedirecting(true);
		console.log('[OIDC-AUTHZ-V3] Redirecting to authorization server...');

		sessionStorage.setItem(
			'oidc_authz_v3_flow_context',
			JSON.stringify({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scope,
				timestamp: Date.now(),
			})
		);

		window.location.href = authUrl;
	}, []);

	// Get UI settings
	const { settings: uiSettings } = useUISettings();

	// Handle authorization redirect with modal option
	const handleAuthorizationWithModal = useCallback(() => {
		if (!authUrl) {
			showGlobalError('Please generate authorization URL first');
			return;
		}

		// Use UISettings context instead of reading localStorage directly
		const shouldShowModal = uiSettings.showAuthRequestModal;

		if (shouldShowModal) {
			console.log('[OIDC-AUTHZ-V3] Showing authorization request modal');
			setShowAuthRequestModal(true);
		} else {
			console.log('[OIDC-AUTHZ-V3] Skipping authorization modal');
			handleAuthorizationDirect();
		}
	}, [authUrl, handleAuthorizationDirect, uiSettings.showAuthRequestModal]);

	// Navigate to Token Management with token
	const navigateToTokenManagement = useCallback(
		(tokenType: 'access' | 'id') => {
			console.log('[OIDC-AUTHZ-V3] Navigate to token management:', {
				tokenType,
				hasTokens: !!tokens,
				hasAccessToken: !!tokens?.access_token,
				hasIdToken: !!tokens?.id_token,
			});

			const token = tokenType === 'access' ? tokens?.access_token : tokens?.id_token;

			if (token) {
				console.log('[OIDC-AUTHZ-V3] Token found, storing for analysis');

				sessionStorage.setItem('token_to_analyze', token);
				sessionStorage.setItem('token_type', tokenType);
				sessionStorage.setItem('flow_source', 'oidc-authorization-code-v3');

				window.location.href = '/token-management';
			} else {
				console.error(`[OIDC-AUTHZ-V3] No ${tokenType} token available for analysis`);
				showGlobalError(`No ${tokenType} token available for analysis`);
			}
		},
		[tokens]
	);

	// Reset flow
	const resetFlow = useCallback(async () => {
		console.log('[OIDC-AUTHZ-V3] Reset flow initiated');

		setIsResettingFlow(true);

		try {
			await new Promise((resolve) => setTimeout(resolve, 500));

			setAuthUrl('');
			setTokens(null);
			setUserInfo(null);
			setAuthCode('');
			setPkceCodes({ codeVerifier: '', codeChallenge: '' });

			stepManager.resetFlow();

			showGlobalSuccess(
				'OIDC Authorization Code Flow reset successfully. You can now begin a new flow.'
			);

			console.log('[OIDC-AUTHZ-V3] Flow reset complete');
		} catch (error) {
			console.error('[OIDC-AUTHZ-V3] Reset flow failed:', error);
			showGlobalError('Failed to reset flow');
		} finally {
			setIsResettingFlow(false);
		}
	}, [stepManager]);

	// Clear credentials
	const clearCredentials = useCallback(async () => {
		setIsClearingCredentials(true);
		try {
			credentialManager.saveAuthzFlowCredentials({
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: '',
				scopes: [],
				authEndpoint: '',
				tokenEndpoint: '',
				userInfoEndpoint: '',
				tokenAuthMethod: 'client_secret_post',
			});

			setCredentials({
				clientId: '',
				clientSecret: '',
				environmentId: '',
				redirectUri: '',
				scope: 'openid profile email',
				authorizationEndpoint: '',
				tokenEndpoint: '',
				userInfoEndpoint: '',
				clientAuthMethod: 'client_secret_post',
			});

			showGlobalSuccess('Credentials cleared successfully');
			console.log('[OIDC-AUTHZ-V3] Credentials cleared');
		} catch (error) {
			showGlobalError('Failed to clear credentials');
			console.error('[OIDC-AUTHZ-V3] Failed to clear credentials:', error);
		} finally {
			setIsClearingCredentials(false);
			setShowClearCredentialsModal(false);
		}
	}, []);

	// Create steps
	const steps = useMemo(() => {
		return [
			createCredentialsStep(
				credentials,
				setCredentials,
				saveCredentials,
				flowType === 'oidc' ? 'OIDC Authorization Code Flow' : 'OAuth Authorization Code Flow'
			),
			{
				...createPKCEStep(pkceCodes, setPkceCodes, generatePKCE),
				canExecute: Boolean(credentials.environmentId && credentials.clientId),
				completed: Boolean(pkceCodes.codeVerifier && pkceCodes.codeChallenge),
			},
			{
				...createAuthUrlStep(authUrl, buildAuthorizationUrl, credentials, pkceCodes),
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.redirectUri &&
						pkceCodes.codeVerifier &&
						pkceCodes.codeChallenge
				),
				completed: Boolean(authUrl),
			},
			{
				...createUserAuthorizationStep(
					authUrl,
					handleAuthorizationWithModal,
					handleAuthorizationDirect,
					isRedirecting,
					tokens
				),
				canExecute: Boolean(authUrl && !isRedirecting),
				completed: Boolean(tokens),
			},
			createCallbackHandlingStep(authCode, resetFlow),
			{
				...createTokenExchangeStep(authCode, tokens, exchangeTokens, credentials, false, 'oidc'),
				canExecute: Boolean(authCode && credentials.environmentId && credentials.clientId),
				completed: Boolean(tokens?.access_token),
			},
			createRefreshTokenStep(
				tokens?.refresh_token ?? '',
				tokens,
				exchangeTokens,
				credentials,
				navigateToTokenManagement,
				tokens,
				undefined,
				'oidc'
			),
		];
	}, [
		buildAuthorizationUrl,
		generatePKCE,
		handleAuthorizationDirect,
		handleAuthorizationWithModal,
		isRedirecting,
		navigateToTokenManagement,
		resetFlow,
		saveCredentials,
		tokens,
	]);

	return (
		<Container>
			<HeroSection>
				<FlowIntro
					title="OIDC Authorization Code Flow (V3)"
					description="A comprehensive OpenID Connect authorization code journey tailored for apps that require user authentication, profile data, and secure API access."
					introCopy={
						<p>
							The OIDC authorization code flow extends OAuth by returning ID tokens and standard
							user claims. It is the recommended option for web apps that need to authenticate
							users, build profiles, and call backend APIs with access tokens.
						</p>
					}
					bullets={[
						'Handles login, token issuance, and user profile retrieval',
						'PKCE optional for confidential clients, required for public clients',
						'Supports state, nonce, and advanced OIDC parameters',
					]}
					warningTitle="Security Reminder"
					warningBody="Validate the state parameter, generate unique nonce values, and safeguard client secrets to maintain OIDC security."
					warningIcon={<FiShield />}
					illustration="/images/flows/oidc-auth-code-flow.svg"
					illustrationAlt="OIDC Authorization Code Flow overview"
				/>
			</HeroSection>

			<FlowCard>
				<ImplicitSafetySummary />
				<FlowConfiguration
					config={flowConfig}
					onConfigChange={setFlowConfig}
					initialExpanded={false}
					title="Flow Configuration"
					subtitle="Configure OAuth 2.0 and OpenID Connect specific settings"
					flowType={
						flowType === 'oidc'
							? FlowType.OIDC_AUTHORIZATION_CODE
							: FlowType.OAUTH_AUTHORIZATION_CODE
					}
				/>

				<EnhancedStepFlowV2
					steps={steps}
					title={`${flowTitle} (V3)`}
					persistKey={`${flowType}_authz_v3_flow_steps`}
					initialStepIndex={stepManager.currentStepIndex}
					onStepChange={stepManager.setStep}
					autoAdvance={false}
					showDebugInfo={false}
					allowStepJumping={true}
					onStepComplete={(stepId, result) => {
						console.log(`[${flowType.toUpperCase()}-V3] Step completed:`, stepId, result);
					}}
				/>

				{/* Flow Control Actions */}
				<FlowControlSection>
					<FlowControlTitle>Flow Control Actions</FlowControlTitle>
					<FlowControlButtons>
						<FlowControlButton className="clear" onClick={() => setShowClearCredentialsModal(true)}>
							Clear Credentials
						</FlowControlButton>
						<FlowControlButton
							className="reset"
							onClick={resetFlow}
							disabled={isResettingFlow}
							style={{
								background: isResettingFlow ? '#9ca3af' : undefined,
								cursor: isResettingFlow ? 'not-allowed' : 'pointer',
							}}
						>
							<FiRefreshCw
								style={{
									animation: isResettingFlow ? 'spin 1s linear infinite' : 'none',
									marginRight: '0.5rem',
								}}
							/>
							{isResettingFlow ? 'Resetting...' : 'Reset Flow'}
						</FlowControlButton>
					</FlowControlButtons>
				</FlowControlSection>
			</FlowCard>

			{/* Clear Credentials Modal */}
			<ConfirmationModal
				isOpen={showClearCredentialsModal}
				onClose={() => setShowClearCredentialsModal(false)}
				onConfirm={clearCredentials}
				title="Clear OIDC Authorization Code Credentials"
				message="Are you sure you want to clear all saved credentials? This will remove your Environment ID, Client ID, and other configuration data."
				confirmText="Clear Credentials"
				cancelText="Cancel"
				variant="danger"
				isLoading={isClearingCredentials}
			/>

			{/* Authorization Request Modal */}
			<AuthorizationRequestModal
				isOpen={showAuthRequestModal}
				onClose={() => setShowAuthRequestModal(false)}
				onProceed={() => {
					setShowAuthRequestModal(false);
					handleAuthorizationDirect();
				}}
				authorizationUrl={authUrl || ''}
				requestParams={{
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					redirectUri: credentials.redirectUri || '',
					scopes: credentials.scope || '',
					responseType: 'code',
					flowType: 'oidc-authorization-code-v3',
				}}
			/>

			{/* Default Redirect URI Modal */}
			<DefaultRedirectUriModal
				isOpen={showDefaultRedirectUriModal}
				onClose={() => setShowDefaultRedirectUriModal(false)}
				onContinue={() => {
					setShowDefaultRedirectUriModal(false);
					showGlobalSuccess(
						'Using default redirect URI. Please configure it in your PingOne application.'
					);
				}}
				flowType="oidc-authorization-code-v3"
				defaultRedirectUri={defaultRedirectUri}
			/>
		</Container>
	);
};

export default OIDCAuthorizationCodeFlowV3;
