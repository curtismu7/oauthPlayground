// src/pages/flows/RedirectlessFlowV7_Real.tsx
// ⭐ V7 FLOW - Redirectless Flow using PingOne API without browser redirects
// Uses response_mode=pi.flow for server-to-server token exchange
// Enhanced with fresh PKCE generation and improved error handling

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiArrowRight,
	FiCheckCircle,
	FiCode,
	FiExternalLink,
	FiEye,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSend,
	FiShield,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import {
	HelperText,
	ResultsHeading,
	ResultsSection,
	SectionDivider,
} from '../../components/ResultsPanel';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { AuthorizationCodeSharedService } from '../../services/authorizationCodeSharedService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import { EducationalContentService } from '../../services/educationalContentService.tsx';
import {
	EnhancedApiCallData,
	EnhancedApiCallDisplayService,
} from '../../services/enhancedApiCallDisplayService';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import { FlowHeader } from '../../services/flowHeaderService';
import { FlowStorageService } from '../../services/flowStorageService';
import { FlowUIService } from '../../services/flowUIService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { V7StepperService } from '../../services/v7StepperService';
import { v4ToastManager } from '../../utils/v4ToastManager';
import { PKCEStorageServiceV8U } from '../../v8u/services/pkceStorageServiceV8U';

// Import config
import { STEP_METADATA } from './config/RedirectlessFlow.config';

// Get UI components from FlowUIService
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

const StepSection = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	margin: 1.5rem 0;
	border: 1px solid #e5e7eb;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const HighlightBadge = styled.span`
	background: #f59e0b;
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	margin-left: 0.5rem;
`;

// Custom Login Form Styled Components
const LoginFormOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const LoginFormModal = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	width: 90%;
	max-width: 400px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const LoginFormTitle = styled.h3`
	margin: 0 0 1.5rem 0;
	color: #1f2937;
	text-align: center;
	font-size: 1.5rem;
	font-weight: 600;
`;

const LoginFormField = styled.div`
	margin-bottom: 1rem;
`;

const LoginFormLabel = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	color: #374151;
	font-weight: 500;
	font-size: 0.875rem;
`;

const LoginFormInput = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 1rem;
	transition: border-color 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const LoginFormButtons = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;
`;

const LoginFormButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	flex: 1;
	padding: 0.75rem 1rem;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	
	${(props) =>
		props.$variant === 'primary'
			? `
		background: #3b82f6;
		color: white;
		
		&:hover:not(:disabled) {
			background: #2563eb;
		}
	`
			: `
		background: #f3f4f6;
		color: #374151;
		
		&:hover:not(:disabled) {
			background: #e5e7eb;
		}
	`}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const SignInButton = styled.button`
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: white;
	border: none;
	padding: 1rem 2rem;
	border-radius: 0.75rem;
	font-size: 1.1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin: 1.5rem auto;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	
	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`;

// V5Stepper components - using NavigationButton for consistent V7 styling
const { NavigationButton } = V7StepperService.createStepLayout({
	theme: 'blue',
	showProgress: true,
});

/**
 * Redirectless Flow V7 Real - PingOne API-driven authentication without browser redirects
 * Uses response_mode=pi.flow for server-to-server token exchange
 * ⭐ V7 ENHANCEMENTS: Fresh PKCE generation, improved error handling, enhanced logging
 */
const RedirectlessFlowV7Real: React.FC = () => {
	const navigate = useNavigate();

	// Initialize controller with redirectless-specific configuration
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'redirectless-v7-real',
		defaultFlowVariant: 'oidc',
	});

	// Page scroll management
	usePageScroll({ pageName: 'Redirectless Flow V7 Real', force: true });

	// Local state management (V7 pattern)
	const [currentStep, setCurrentStep] = useState(
		AuthorizationCodeSharedService.StepRestoration.getInitialStep()
	);

	// Collapse all sections by default for cleaner UI
	const shouldCollapseAll = true;

	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
		AuthorizationCodeSharedService.CollapsibleSections.getDefaultState()
	);

	// V7 Educational API Call Tracking
	const [apiCalls, setApiCalls] = useState<EnhancedApiCallData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [_error, _setError] = useState<string | null>(null);
	const [_tokens, _setTokens] = useState<Record<string, unknown> | null>(null);

	// Custom login form state
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [loginCredentials, setLoginCredentials] = useState({
		username: 'demo.user@example.com',
		password: 'P@ssw0rd123',
	});
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	// Scroll to top on step change
	useEffect(() => {
		AuthorizationCodeSharedService.StepRestoration.scrollToTopOnStepChange();
	}, [currentStep]);

	// V7 Service: Load saved flow state on mount
	useEffect(() => {
		const savedState = FlowStorageService.AdvancedParameters.get('redirectless-v7');
		if (savedState) {
			console.log('[Redirectless V7] Loading saved flow state:', savedState);
			// Apply saved state if needed
		}
	}, []);

	// V7 Service: Save flow state when it changes
	useEffect(() => {
		if (controller.credentials.clientId) {
			FlowStorageService.AdvancedParameters.set('redirectless-v7', {
				currentStep,
				hasTokens: !!controller.tokens?.accessToken,
				flowType: 'redirectless',
			});
		}
	}, [currentStep, controller.credentials.clientId, controller.tokens]);

	// Toggle section handler
	const toggleSection = useCallback(
		AuthorizationCodeSharedService.CollapsibleSections.createToggleHandler(setCollapsedSections),
		[]
	);

	// Helper to check for PKCE codes (checks controller and bulletproof storage)
	const checkHasPkceCodes = useCallback(() => {
		const flowKey = 'redirectless-v7-real';
		const storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(flowKey);
		const hasPkceCodes =
			!!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge) ||
			!!(storedPKCE?.codeVerifier && storedPKCE?.codeChallenge);
		// Restore from bulletproof storage if missing from controller
		if (!controller.pkceCodes.codeVerifier && storedPKCE?.codeVerifier) {
			controller.setPkceCodes(storedPKCE);
		}
		return hasPkceCodes;
	}, [controller]);

	// Custom navigation handler with validation (V7 pattern)
	const handleStepChange = useCallback(
		(newStep: number) => {
			console.log('🔍 [Redirectless V7] handleStepChange called:', {
				currentStep,
				newStep,
				credentials: controller.credentials,
			});

			// Use service navigation manager for proper validation
			AuthorizationCodeSharedService.Navigation.handleNext(
				currentStep,
				controller.credentials,
				'oauth', // Redirectless is based on OAuth
				controller,
				(step: number) => {
					// Enhanced step validation - checks both controller state and bulletproof storage
					const hasPkceCodes = checkHasPkceCodes();

					switch (step) {
						case 0:
							return true; // Introduction step
						case 1:
							return hasPkceCodes;
						case 2:
							return !!(controller.authUrl && hasPkceCodes);
						case 3:
							return !!(controller.authCode || controller.authCode);
						default:
							return true;
					}
				},
				() => {
					console.log('✅ [Redirectless V7] Navigation allowed, moving to step:', newStep);
					setCurrentStep(newStep);
				}
			);
		},
		[currentStep, controller, checkHasPkceCodes]
	);

	// PKCE generation handler with service-based API call tracking
	const handleGeneratePkce = useCallback(() => {
		// Use service to create PKCE API call template
		const pkceApiCall = EnhancedApiCallDisplayService.createOAuthTemplate(
			'redirectless',
			'PKCE Generation',
			{
				method: 'LOCAL' as any,
				url: 'Client-side PKCE Generation',
				description: 'Generate cryptographically secure PKCE parameters for redirectless flow',
				educationalNotes: [
					'PKCE (Proof Key for Code Exchange) adds security to OAuth flows',
					'Code verifier is a cryptographically random string',
					'Code challenge is SHA256 hash of the verifier',
					'Prevents authorization code interception attacks',
				],
			}
		);

		setApiCalls((prev) => [...prev, pkceApiCall]);
		AuthorizationCodeSharedService.PKCE.generatePKCE('oidc', controller.credentials, controller);
	}, [controller]);

	// Authorization URL generation handler with service-based API call tracking
	const handleGenerateAuthUrl = useCallback(() => {
		// Use service to create authorization URL API call template
		const authUrlApiCall = EnhancedApiCallDisplayService.createOAuthTemplate(
			'redirectless',
			'Authorization URL Generation',
			{
				method: 'LOCAL' as any,
				url: 'Client-side URL Construction',
				description:
					'Generate authorization URL with response_mode=pi.flow for server-to-server exchange',
				body: {
					response_type: 'code',
					response_mode: 'pi.flow',
					client_id: controller.credentials.clientId,
					redirect_uri: 'urn:pingidentity:redirectless',
					scope: 'openid profile email',
					code_challenge: controller.pkceCodes.codeChallenge,
					code_challenge_method: 'S256',
					state: '[random-state-value]',
				},
				educationalNotes: [
					'response_mode=pi.flow enables redirectless flow',
					'redirect_uri uses special urn:pingidentity:redirectless',
					'PKCE parameters ensure security without client secret',
					'Authorization code will be returned directly in API response',
				],
			}
		);

		setApiCalls((prev) => [...prev, authUrlApiCall]);
		AuthorizationCodeSharedService.Authorization.generateAuthUrl(
			'oidc',
			controller.credentials,
			controller
		);
	}, [controller]);

	// Note: handleShowLoginForm is no longer needed - modal is shown automatically
	// when USERNAME_PASSWORD_REQUIRED status is returned from handleStartRedirectlessFlow

	// Step 3: Resume flow to get authorization code (must be defined before handleSubmitCredentials)
	const handleResumeFlow = useCallback(
		async (
			flowId: string,
			stateValue: string,
			pkceCodes: { codeVerifier: string; codeChallenge: string; codeChallengeMethod: string },
			resumeUrl?: string
		) => {
			try {
				console.log('🔐 [Redirectless V7] Step 3: Resuming flow to get authorization code');

				if (!resumeUrl) {
					// Try to get resumeUrl from session storage if not provided
					const storedResumeUrl = sessionStorage.getItem('redirectless-v7-real-resumeUrl');
					if (!storedResumeUrl) {
						throw new Error('No resumeUrl available. Please restart the flow.');
					}
					resumeUrl = storedResumeUrl;
				}

				const resumeResponse = await fetch('/api/pingone/resume', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						resumeUrl,
						flowId,
						flowState: stateValue,
						clientId: controller.credentials.clientId,
						clientSecret: controller.credentials.clientSecret,
						codeVerifier: pkceCodes.codeVerifier,
					}),
				});

				if (!resumeResponse.ok) {
					const errorText = await resumeResponse.text();
					throw new Error(
						`Resume request failed: ${resumeResponse.status} ${resumeResponse.statusText}. ${errorText}`
					);
				}

				const resumeData = (await resumeResponse.json()) as Record<string, unknown>;
				console.log('🔐 [Redirectless V7] Resume response data:', resumeData);

				const authCode = (resumeData.code ||
					(resumeData.authorizeResponse as { code?: string })?.code) as string | undefined;
				if (!authCode) {
					throw new Error('No authorization code received after calling resumeUrl');
				}

				// Proceed to token exchange
				await handleTokenExchange(authCode, pkceCodes.codeVerifier);
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error('🔐 [Redirectless V7] Failed to resume flow:', errorMessage);
				throw error;
			}
		},
		[controller]
	);

	// Step 4: Exchange authorization code for tokens (must be defined before handleResumeFlow)
	const handleTokenExchange = useCallback(
		async (authCode: string, codeVerifier: string) => {
			try {
				console.log('🔐 [Redirectless V7] Step 4: Exchanging authorization code for tokens');

				const backendUrl =
					process.env.NODE_ENV === 'production'
						? 'https://oauth-playground.vercel.app'
						: 'https://localhost:3001';

				const tokenRequestBody = {
					grant_type: 'authorization_code',
					code: authCode,
					redirect_uri: 'urn:pingidentity:redirectless',
					client_id: controller.credentials.clientId,
					client_secret: controller.credentials.clientSecret,
					environment_id: controller.credentials.environmentId,
					code_verifier: codeVerifier,
				};

				const tokenResponse = await fetch(`${backendUrl}/api/token-exchange`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(tokenRequestBody),
				});

				if (!tokenResponse.ok) {
					const errorData = (await tokenResponse.json().catch(() => ({}))) as Record<
						string,
						unknown
					>;
					const errorDesc = (errorData.error_description ||
						errorData.error ||
						'Please check your configuration.') as string;
					throw new Error(
						`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}. ${errorDesc}`
					);
				}

				const tokenData = (await tokenResponse.json()) as Record<string, unknown>;
				console.log('🔐 [Redirectless V7] Token exchange successful:', tokenData);

				if (!tokenData.access_token) {
					throw new Error('No access token received from PingOne');
				}

				// Create API call display for the successful token exchange
				const tokenExchangeApiCall = EnhancedApiCallDisplayService.createOAuthTemplate(
					'redirectless',
					'Token Exchange',
					{
						method: 'POST',
						url: `${backendUrl}/api/token-exchange`,
						headers: {
							'Content-Type': 'application/json',
						},
						body: {
							grant_type: 'authorization_code',
							code: authCode,
							redirect_uri: 'urn:pingidentity:redirectless',
							client_id: controller.credentials.clientId,
							client_secret: '***REDACTED***',
							environment_id: controller.credentials.environmentId,
							code_verifier: codeVerifier,
						},
						description: 'Real server-to-server token exchange using response_mode=pi.flow',
						educationalNotes: [
							'Authorization code obtained from resume step is exchanged for tokens',
							'No browser redirect required - pure server-to-server exchange',
							'PKCE code_verifier validates the original request',
							'Special redirect_uri urn:pingidentity:redirectless used',
							'Response includes access_token, id_token, and refresh_token',
						],
					}
				);

				// Add real response data
				tokenExchangeApiCall.response = {
					status: tokenResponse.status,
					statusText: tokenResponse.statusText,
					headers: Object.fromEntries(tokenResponse.headers.entries()),
					data: {
						...tokenData,
						access_token: `${(tokenData.access_token as string).substring(0, 20)}...[TRUNCATED FOR SECURITY]`,
					},
				};

				setApiCalls((prev) => [...prev, tokenExchangeApiCall]);
				setIsLoading(false);
				setIsAuthenticating(false);
				setShowLoginForm(false);
				v4ToastManager.showSuccess(
					'✅ Tokens obtained from PingOne redirectless flow! No redirects used.'
				);

				// Store tokens in local state for display
				_setTokens({
					access_token: tokenData.access_token,
					refresh_token: tokenData.refresh_token,
					id_token: tokenData.id_token,
					token_type: tokenData.token_type,
					expires_in: tokenData.expires_in,
					scope: tokenData.scope,
				});

				// Also set in controller for consistency
				const accessTokenValue = tokenData.access_token as string;
				const tokenPayload: {
					access_token: string;
					refreshToken?: string;
					idToken?: string;
					tokenType?: string;
					expiresIn?: number;
					scope?: string;
				} = {
					access_token: accessTokenValue,
				};

				if (tokenData.refresh_token) {
					tokenPayload.refreshToken = tokenData.refresh_token as string;
				}
				if (tokenData.id_token) {
					tokenPayload.idToken = tokenData.id_token as string;
				}
				if (tokenData.token_type) {
					tokenPayload.tokenType = tokenData.token_type as string;
				}
				if (tokenData.expires_in) {
					tokenPayload.expiresIn = tokenData.expires_in as number;
				}
				if (tokenData.scope) {
					tokenPayload.scope = tokenData.scope as string;
				}

				controller.setTokens(tokenPayload);

				// Show success message explaining what happened
				v4ToastManager.showSuccess(
					`🎉 Redirectless authentication successful! Tokens returned directly - no browser redirects!`
				);
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error('🔐 [Redirectless V7] Token exchange failed:', errorMessage);
				_setError(errorMessage);
				v4ToastManager.showError(`❌ Token exchange failed: ${errorMessage}`);
				setIsAuthenticating(false);
				setIsLoading(false);
			}
		},
		[controller]
	);

	// Step 2: Submit credentials to PingOne Flow API (depends on handleResumeFlow)
	const handleSubmitCredentials = useCallback(async () => {
		setIsAuthenticating(true);
		_setError(null);

		try {
			const flowId = sessionStorage.getItem('redirectless-v7-real-flowId');
			const stateValue = sessionStorage.getItem('redirectless-v7-real-state');
			const codeVerifier = sessionStorage.getItem('redirectless-v7-real-codeVerifier');

			if (!flowId || !stateValue || !codeVerifier) {
				throw new Error('Flow state not found. Please start the flow again.');
			}

			console.log('🔐 [Redirectless V7] Step 2: Submitting credentials to PingOne Flow API');

			// Send credentials to PingOne Flow API endpoint (NOT /as/authorize)
			const flowApiUrl = `https://auth.pingone.com/${controller.credentials.environmentId}/flows/${flowId}`;

			console.log('🔐 [Redirectless V7] Submitting credentials to Flow API:', {
				flowApiUrl,
				username: loginCredentials.username,
				// Password not logged for security
			});

			const credentialsResponse = await fetch('/api/pingone/flows/check-username-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: controller.credentials.environmentId,
					flowUrl: flowApiUrl,
					username: loginCredentials.username,
					password: loginCredentials.password,
					clientId: controller.credentials.clientId,
					clientSecret: controller.credentials.clientSecret,
				}),
			});

			if (!credentialsResponse.ok) {
				const errorText = await credentialsResponse.text();
				throw new Error(
					`Credentials submission failed: ${credentialsResponse.status} ${credentialsResponse.statusText}. ${errorText}`
				);
			}

			const credentialsData = (await credentialsResponse.json()) as Record<string, unknown>;
			console.log('🔐 [Redirectless V7] Credentials response:', credentialsData);

			// Check if flow is ready to resume
			const status = String(credentialsData.status || '').toUpperCase();
			const resumeUrl = credentialsData.resumeUrl as string | undefined;

			if (status === 'READY_TO_RESUME' && resumeUrl) {
				// Store resumeUrl for resume step
				sessionStorage.setItem('redirectless-v7-real-resumeUrl', resumeUrl);

				// Proceed to resume step
				await handleResumeFlow(
					flowId,
					stateValue,
					{ codeVerifier, codeChallenge: '', codeChallengeMethod: 'S256' as const },
					resumeUrl
				);
			} else {
				throw new Error(`Unexpected status after credentials: ${status || 'UNKNOWN'}`);
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('🔐 [Redirectless V7] Failed to submit credentials:', errorMessage);
			_setError(errorMessage);
			v4ToastManager.showError(`❌ Authentication failed: ${errorMessage}`);
			setIsAuthenticating(false);
		}
	}, [controller, loginCredentials, handleResumeFlow]);

	// Handle login form submission - calls handleSubmitCredentials
	const handleLoginFormSubmit = useCallback(async () => {
		await handleSubmitCredentials();
	}, [handleSubmitCredentials]);

	// Step 1: Start redirectless flow (without credentials)
	const handleStartRedirectlessFlow = useCallback(async () => {
		setIsLoading(true);
		_setError(null);

		try {
			// V7 ENHANCEMENT: Force generate fresh PKCE codes for redirectless flow
			console.log('🔐 [Redirectless V7] Force generating fresh PKCE codes for redirectless flow');

			// Import PKCE generation utilities
			const { generateCodeVerifier, generateCodeChallenge } = await import('../../utils/oauth');

			// Generate fresh PKCE codes directly
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			const freshPkceCodes = {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256' as const,
			};

			console.log('🔐 [Redirectless V7] Generated fresh PKCE codes:', {
				codeVerifier: codeVerifier.substring(0, 20) + '...',
				codeChallenge: codeChallenge.substring(0, 20) + '...',
			});

			// Update the controller with fresh codes
			controller.setPkceCodes(freshPkceCodes);

			// Store PKCE codes in bulletproof storage
			const flowKey = 'redirectless-v7-real';
			PKCEStorageServiceV8U.savePKCECodes(flowKey, {
				codeVerifier: freshPkceCodes.codeVerifier,
				codeChallenge: freshPkceCodes.codeChallenge,
				codeChallengeMethod: freshPkceCodes.codeChallengeMethod,
			});

			console.log(
				'🔐 [Redirectless V7] Fresh PKCE codes set in controller and bulletproof storage'
			);

			// Step 1: Make real authorization request with response_mode=pi.flow (NO CREDENTIALS)
			console.log(
				'🔐 [Redirectless V7] Step 1: Starting authorization request with response_mode=pi.flow (NO credentials)'
			);

			const authEndpoint = `https://auth.pingone.com/${controller.credentials.environmentId}/as/authorize`;
			const stateValue = `redirectless-v7-${Date.now()}`;
			const authRequestBody = new URLSearchParams({
				response_type: 'code',
				client_id: controller.credentials.clientId,
				scope: 'openid profile email',
				state: stateValue,
				nonce: `nonce-v7-${Date.now()}`,
				code_challenge: freshPkceCodes.codeChallenge,
				code_challenge_method: 'S256',
				response_mode: 'pi.flow',
				// CRITICAL: Do NOT send username/password here - credentials go to Flow API in Step 2
			});

			console.log('🔐 [Redirectless V7] Authorization request body:', authRequestBody.toString());

			const authResponse = await fetch(authEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				},
				body: authRequestBody.toString(),
			});

			console.log('🔐 [Redirectless V7] Authorization response status:', authResponse.status);

			if (!authResponse.ok) {
				const errorText = await authResponse.text();
				throw new Error(
					`Authorization request failed: ${authResponse.status} ${authResponse.statusText}. ${errorText}`
				);
			}

			const authData = await authResponse.json();
			console.log('🔐 [Redirectless V7] Authorization response data:', authData);

			// Store flowId and state for later steps
			const flowId = authData.id || authData.flowId;
			if (!flowId) {
				throw new Error('No flowId received from PingOne redirectless flow');
			}

			// Store flow state in sessionStorage for credential submission
			sessionStorage.setItem('redirectless-v7-real-flowId', flowId);
			sessionStorage.setItem('redirectless-v7-real-state', stateValue);
			sessionStorage.setItem('redirectless-v7-real-codeVerifier', freshPkceCodes.codeVerifier);
			sessionStorage.setItem('redirectless-v7-real-codeChallenge', freshPkceCodes.codeChallenge);

			// Check if credentials are required
			const status = authData.status?.toUpperCase();
			console.log('🔐 [Redirectless V7] Flow status:', status);

			if (status === 'USERNAME_PASSWORD_REQUIRED' || status === 'IN_PROGRESS') {
				// Show modal for username/password - DO NOT REDIRECT
				console.log('🔐 [Redirectless V7] Credentials required - showing login modal');
				setShowLoginForm(true);
				setIsLoading(false);
				return; // Exit early, wait for user to submit credentials via modal
			}

			// If flow is already completed (unlikely on first request), proceed to resume
			if (status === 'READY_TO_RESUME' || authData.resumeUrl) {
				// Proceed to resume step
				await handleResumeFlow(flowId, stateValue, freshPkceCodes, authData.resumeUrl);
				return;
			}

			throw new Error(`Unexpected flow status: ${status || 'UNKNOWN'}`);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('🔐 [Redirectless V7] Failed to start flow:', errorMessage);
			_setError(errorMessage);
			v4ToastManager.showError(`❌ Failed to start redirectless flow: ${errorMessage}`);
			setIsLoading(false);
		}
	}, [controller, handleResumeFlow]);

	// Open authorization URL handler
	const handleOpenAuthUrl = useCallback(() => {
		if (controller.authUrl) {
			AuthorizationCodeSharedService.Authorization.openAuthUrl(controller.authUrl);
		}
	}, [controller.authUrl]);

	// Navigate to token management
	const navigateToTokenManagement = useCallback(() => {
		if (!controller.tokens) return;

		// Store tokens in localStorage for token management page
		if (controller.tokens.accessToken) {
			localStorage.setItem('redirectless-access-token', String(controller.tokens.accessToken));
		}
		if (controller.tokens.idToken) {
			localStorage.setItem('redirectless-id-token', String(controller.tokens.idToken));
		}
		if (controller.tokens.refreshToken) {
			localStorage.setItem('redirectless-refresh-token', String(controller.tokens.refreshToken));
		}

		navigate('/token-management');
	}, [controller.tokens, navigate]);

	// Response type enforcement
	useEffect(() => {
		if (!controller.credentials) {
			return;
		}

		AuthorizationCodeSharedService.ResponseTypeEnforcer.enforceResponseType(
			'oidc',
			controller.credentials,
			controller.setCredentials
		);
	}, [controller.credentials, controller.setCredentials]);

	// Credentials sync
	useEffect(() => {
		if (!controller.credentials) {
			return;
		}

		AuthorizationCodeSharedService.CredentialsSync.syncCredentials(
			'oidc',
			controller.credentials,
			controller.setCredentials
		);
	}, [controller.credentials, controller.setCredentials]);

	// Render step content (V7 pattern)
	const renderStepContent = useCallback(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						{/* V7 Redirectless Education - Enhanced with V7 features */}
						<div
							style={{
								background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
								color: 'white',
								padding: '2rem',
								borderRadius: '1rem',
								marginBottom: '2rem',
								boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)',
							}}
						>
							<h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
								🎯 PingOne Redirectless Flow V7 (response_mode=pi.flow)
							</h2>
							<p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', opacity: '0.9' }}>
								Build custom authentication UIs without browser redirects. Perfect for embedded
								login experiences, mobile apps, and server-to-server scenarios where you want full
								control over the user experience.
							</p>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1rem',
									borderRadius: '0.5rem',
									border: '1px solid rgba(255, 255, 255, 0.2)',
								}}
							>
								<strong>V7 Enhancements:</strong> Fresh PKCE generation every time, improved error
								handling, enhanced logging, and better state management for more reliable
								redirectless flows.
							</div>
						</div>

						{/* URL Example */}
						<div
							style={{
								background: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '0.75rem',
								padding: '1.5rem',
								marginBottom: '2rem',
							}}
						>
							<h3
								style={{
									margin: '0 0 1rem 0',
									color: '#1f2937',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiExternalLink />
								Authorization URL with response_mode=pi.flow (V7)
							</h3>
							<div
								style={{
									background: '#1f2937',
									color: '#f9fafb',
									padding: '1rem',
									borderRadius: '0.5rem',
									fontFamily: 'Monaco, Menlo, monospace',
									fontSize: '0.875rem',
									overflow: 'auto',
								}}
							>
								<div style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>POST</div>
								<div style={{ marginBottom: '1rem' }}>
									https://auth.pingone.com/
									{controller.credentials?.environmentId || '{environmentId}'}/as/authorize
								</div>
								<div style={{ color: '#34d399', marginBottom: '0.5rem' }}>Headers:</div>
								<div style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
									Content-Type: application/x-www-form-urlencoded
								</div>
								<div style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Body Parameters:</div>
								<div style={{ marginLeft: '1rem' }}>
									<div>client_id={controller.credentials?.clientId || '{clientId}'}</div>
									<div style={{ color: '#f87171', fontWeight: 'bold' }}>response_mode=pi.flow</div>
									<div>response_type=code</div>
									<div>scope=openid profile email</div>
									<div>username={'{username}'}</div>
									<div>password={'{password}'}</div>
									<div>code_challenge={'{pkce_challenge}'}</div>
									<div>code_challenge_method=S256</div>
								</div>
							</div>
							<div
								style={{
									marginTop: '1rem',
									padding: '1rem',
									background: '#fef3c7',
									border: '1px solid #f59e0b',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
								}}
							>
								<strong>⚡ V7 Key Point:</strong> Notice there's no <code>redirect_uri</code>{' '}
								parameter! The <code>response_mode=pi.flow</code> tells PingOne to return tokens
								directly in the API response instead of redirecting to a callback URL. V7 ensures
								fresh PKCE codes every time.
							</div>
						</div>

						{/* Mock UI Demo */}
						<div
							style={{
								background: 'white',
								border: '2px solid #10b981',
								borderRadius: '1rem',
								padding: '2rem',
								marginBottom: '2rem',
								boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1)',
							}}
						>
							<h3
								style={{
									margin: '0 0 1rem 0',
									color: '#059669',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiEye />
								Mock Custom Login UI (What Your Users Would See) - V7
							</h3>
							<p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
								This is what your custom authentication UI might look like. Instead of redirecting
								to PingOne's hosted login page, you collect credentials in your own UI and make the
								API call behind the scenes. V7 ensures fresh PKCE codes for every authentication
								attempt.
							</p>

							{/* Mock Login Form */}
							<div
								style={{
									background: '#f9fafb',
									border: '1px solid #e5e7eb',
									borderRadius: '0.75rem',
									padding: '2rem',
									maxWidth: '400px',
									margin: '0 auto',
								}}
							>
								<div style={{ textAlign: 'center', marginBottom: '2rem' }}>
									<h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
										Sign In to Your App
									</h4>
									<p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>
										Custom UI powered by PingOne V7
									</p>
								</div>

								<div style={{ marginBottom: '1rem' }}>
									<label
										style={{
											display: 'block',
											marginBottom: '0.5rem',
											fontWeight: '600',
											color: '#374151',
										}}
									>
										Username or Email
									</label>
									<input
										type="text"
										placeholder="Enter your username"
										style={{
											width: '100%',
											padding: '0.75rem',
											border: '1px solid #d1d5db',
											borderRadius: '0.5rem',
											fontSize: '1rem',
										}}
										disabled
									/>
								</div>

								<form key="v7-password-form">
									<div style={{ marginBottom: '2rem' }}>
										<label
											style={{
												display: 'block',
												marginBottom: '0.5rem',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Password
										</label>
										<input
											type="password"
											placeholder="Enter your password"
											style={{
												width: '100%',
												padding: '0.75rem',
												border: '1px solid #d1d5db',
												borderRadius: '0.5rem',
												fontSize: '1rem',
											}}
											disabled
										/>
									</div>
								</form>

								<NavigationButton
									disabled
									style={{
										width: '100%',
										opacity: '0.7',
									}}
								>
									Sign In (Demo Only)
								</NavigationButton>

								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#dbeafe',
										border: '1px solid #3b82f6',
										borderRadius: '0.5rem',
										fontSize: '0.875rem',
										textAlign: 'center',
									}}
								>
									<strong>V7 Behind the scenes:</strong> When user clicks "Sign In", your app makes
									a POST request to PingOne's authorization endpoint with{' '}
									<code>response_mode=pi.flow</code>
									and receives tokens directly - no redirect needed! Fresh PKCE codes generated
									every time.
								</div>
							</div>
						</div>

						{/* API Response Example */}
						<div
							style={{
								background: '#f0fdf4',
								border: '1px solid #16a34a',
								borderRadius: '0.75rem',
								padding: '1.5rem',
								marginBottom: '2rem',
							}}
						>
							<h3
								style={{
									margin: '0 0 1rem 0',
									color: '#15803d',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
								}}
							>
								<FiCheckCircle />
								Direct Token Response (No Redirect!) - V7
							</h3>
							<p style={{ margin: '0 0 1rem 0', color: '#166534' }}>
								Instead of a redirect, PingOne returns tokens directly in the API response:
							</p>
							<div
								style={{
									background: '#1f2937',
									color: '#f9fafb',
									padding: '1rem',
									borderRadius: '0.5rem',
									fontFamily: 'Monaco, Menlo, monospace',
									fontSize: '0.875rem',
									overflow: 'auto',
								}}
							>
								<div style={{ color: '#34d399', marginBottom: '0.5rem' }}>HTTP 200 OK</div>
								<div style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>
									Content-Type: application/json
								</div>
								<div style={{ marginTop: '1rem' }}>
									{`{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
}`}
								</div>
							</div>
						</div>

						<ComprehensiveCredentialsService
							credentials={controller.credentials}
							onCredentialsChange={controller.setCredentials}
							onDiscoveryComplete={() => {}}
							requireClientSecret={false}
							showAdvancedConfig={true}
							defaultCollapsed={shouldCollapseAll}
						/>

						{/* Redirectless Educational Content */}
						<EducationalContentService
							flowType="redirectless"
							defaultCollapsed={shouldCollapseAll}
						/>
					</>
				);

			case 1:
				return (
					<>
						<CollapsibleHeader
							title="PKCE Parameters (V7 Enhanced)"
							icon={<FiCheckCircle />}
							defaultCollapsed={shouldCollapseAll}
						>
							<div style={{ marginBottom: '1rem' }}>
								<p>
									<strong>Proof Key for Code Exchange (PKCE)</strong> adds an extra layer of
									security to the authorization code flow, even for public clients. V7 ensures fresh
									PKCE codes every time.
								</p>
							</div>

							<NavigationButton
								onClick={handleGeneratePkce}
								disabled={!!controller.pkceCodes.codeVerifier}
								title={
									controller.pkceCodes.codeVerifier
										? 'PKCE parameters already generated'
										: 'Generate PKCE parameters'
								}
							>
								{controller.pkceCodes.codeVerifier ? <FiCheckCircle /> : <FiRefreshCw />}{' '}
								{controller.pkceCodes.codeVerifier
									? 'PKCE Parameters Generated'
									: 'Generate PKCE Parameters'}
								<HighlightBadge>1</HighlightBadge>
							</NavigationButton>

							{controller.pkceCodes.codeVerifier && (
								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f9fafb',
										borderRadius: '0.5rem',
									}}
								>
									<div style={{ marginBottom: '0.5rem' }}>
										<strong>Code Verifier:</strong>
										<pre
											style={{
												marginTop: '0.5rem',
												padding: '0.5rem',
												background: 'white',
												borderRadius: '0.25rem',
												fontSize: '0.75rem',
												overflow: 'auto',
											}}
										>
											{controller.pkceCodes.codeVerifier}
										</pre>
									</div>
									<div>
										<strong>Code Challenge:</strong>
										<pre
											style={{
												marginTop: '0.5rem',
												padding: '0.5rem',
												background: 'white',
												borderRadius: '0.25rem',
												fontSize: '0.75rem',
												overflow: 'auto',
											}}
										>
											{controller.pkceCodes.codeChallenge}
										</pre>
									</div>
								</div>
							)}
						</CollapsibleHeader>

						<CollapsibleHeader
							title="Authorization URL Generation (V7)"
							icon={<FiCheckCircle />}
							defaultCollapsed={shouldCollapseAll}
						>
							<div style={{ marginBottom: '1rem' }}>
								<p>
									Generate the authorization URL that will be used to authenticate the user. For
									Redirectless flow, this URL includes the special{' '}
									<code>response_mode=pi.flow</code> parameter.
								</p>
							</div>

							<NavigationButton
								onClick={handleGenerateAuthUrl}
								disabled={!!controller.authUrl || !checkHasPkceCodes()}
								title={
									!checkHasPkceCodes()
										? 'Generate PKCE parameters first'
										: controller.authUrl
											? 'Authorization URL already generated'
											: 'Generate authorization URL'
								}
							>
								{controller.authUrl ? <FiCheckCircle /> : <FiExternalLink />}{' '}
								{controller.authUrl
									? 'Authorization URL Generated'
									: !checkHasPkceCodes()
										? 'Complete above action'
										: 'Generate Authorization URL'}
								<HighlightBadge>1</HighlightBadge>
							</NavigationButton>

							{controller.authUrl && (
								<div style={{ marginTop: '1rem' }}>
									<div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
										<strong>Authorization URL:</strong>
										<pre
											style={{
												marginTop: '0.5rem',
												padding: '0.5rem',
												background: 'white',
												borderRadius: '0.25rem',
												fontSize: '0.75rem',
												overflow: 'auto',
											}}
										>
											{controller.authUrl}
										</pre>
									</div>

									<div style={{ marginTop: '1rem' }}>
										<NavigationButton
											onClick={handleOpenAuthUrl}
											title="Open authorization URL in new tab"
										>
											<FiExternalLink /> Open Authorization URL
										</NavigationButton>
									</div>
								</div>
							)}
						</CollapsibleHeader>
					</>
				);

			case 2:
				return (
					<>
						<CollapsibleHeader
							title="Token Exchange (V7 Enhanced)"
							icon={<FiRefreshCw />}
							defaultCollapsed={shouldCollapseAll}
						>
							<div style={{ marginBottom: '1rem' }}>
								<p>
									<strong>Redirectless Authentication:</strong> Experience a real authorization code
									flow without browser redirects! You'll see a custom login form (not PingOne's UI),
									enter credentials, and receive tokens directly via API calls with{' '}
									<code>response_mode=pi.flow</code>.
								</p>
							</div>

							<div style={{ textAlign: 'center' }}>
								<SignInButton
									onClick={handleStartRedirectlessFlow}
									disabled={!checkHasPkceCodes() || isLoading || isAuthenticating}
									title={
										!checkHasPkceCodes()
											? 'Generate PKCE parameters first'
											: isLoading
												? 'Starting redirectless flow...'
												: 'Start redirectless authentication'
									}
								>
									{isLoading || isAuthenticating ? (
										<>
											<FiRefreshCw className="animate-spin" />
											{isLoading ? 'Starting Flow...' : 'Authenticating...'}
										</>
									) : (
										<>
											<FiShield />
											Start Redirectless Authentication
										</>
									)}
								</SignInButton>

								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#eff6ff',
										borderRadius: '0.5rem',
										border: '1px solid #bfdbfe',
										fontSize: '0.875rem',
										color: '#1e40af',
									}}
								>
									<strong>🚀 Behind the Scenes:</strong>
									<br />
									When you click "Sign In", your app makes a POST request to PingOne's authorization
									endpoint with <code>response_mode=pi.flow</code> and receives tokens directly - no
									redirect needed! Fresh PKCE codes generated every time.
								</div>
							</div>

							{controller.tokens?.accessToken && (
								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f0fdf4',
										borderRadius: '0.5rem',
										border: '1px solid #bbf7d0',
									}}
								>
									<p style={{ color: '#166534', margin: 0, fontWeight: '600' }}>
										✅ Tokens received successfully! The redirectless flow V7 is complete.
									</p>
								</div>
							)}

							{controller.tokens?.accessToken ? (
								<div style={{ marginTop: '1rem' }}>
									{UnifiedTokenDisplayService.showTokens(
										controller.tokens,
										'oidc',
										'redirectless-v7-tokens',
										{
											showCopyButtons: true,
											showDecodeButtons: true,
											showIntrospection: true,
											title: '🎯 Redirectless Flow V7 Tokens',
										}
									)}
								</div>
							) : (
								<div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
									<FiInfo style={{ marginBottom: '0.5rem' }} />
									<p>Complete the token exchange step to receive tokens</p>
								</div>
							)}
						</CollapsibleHeader>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleHeader
							title="Token Management (V7)"
							icon={<FiEye />}
							defaultCollapsed={shouldCollapseAll}
						>
							<div style={{ marginBottom: '1rem' }}>
								<p>Manage your tokens, including introspection, refresh, and validation.</p>
							</div>

							<NavigationButton
								onClick={navigateToTokenManagement}
								disabled={!controller.tokens?.accessToken}
								title={
									!controller.tokens?.accessToken ? 'No tokens available' : 'Open token management'
								}
							>
								<FiEye /> Token Management
								<HighlightBadge>1</HighlightBadge>
							</NavigationButton>

							{controller.tokens?.accessToken ? (
								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f9fafb',
										borderRadius: '0.5rem',
									}}
								>
									<p style={{ color: '#059669', margin: 0 }}>
										✓ Tokens available. Click the button above to navigate to Token Management page.
									</p>
								</div>
							) : null}
						</CollapsibleHeader>
					</>
				);

			default:
				return <div>Step {currentStep}</div>;
		}
	}, [
		currentStep,
		controller,
		collapsedSections,
		toggleSection,
		handleGeneratePkce,
		handleGenerateAuthUrl,
		handleOpenAuthUrl,
		navigateToTokenManagement,
		shouldCollapseAll,
	]);

	return (
		<Container>
			<ContentWrapper>
				<FlowHeader flowId="redirectless-v7" />

				{/* V7 Educational Flow Info Card */}
				<EnhancedFlowInfoCard
					title="Redirectless Flow V7 (response_mode=pi.flow)"
					description="Enhanced server-to-server OAuth/OIDC flow without browser redirects using PingOne's pi.flow response mode"
					features={[
						'No browser redirects required',
						'Server-to-server token exchange',
						'Fresh PKCE codes every time (V7)',
						'Enhanced error handling (V7)',
						'Improved logging (V7)',
						'Direct API integration',
					]}
					flowType="redirectless"
				/>

				{/* V7 Service: Educational Content */}
				<EducationalContentService flowType="oauth" defaultCollapsed={false} />

				{/* V7 API Call Display Section */}
				{apiCalls.length > 0 && (
					<StepSection>
						<ExplanationHeading>
							<FiCode /> API Calls & Responses (V7)
						</ExplanationHeading>
						<ExplanationSection>
							<HelperText>
								Educational view of the redirectless flow V7 API interactions with PingOne.
							</HelperText>
							{apiCalls.map((apiCall, index) => (
								<EnhancedApiCallDisplay
									key={`${apiCall.flowType}-${apiCall.stepName}-${index}`}
									apiCall={apiCall}
									onCopy={() => {}}
								/>
							))}
						</ExplanationSection>
					</StepSection>
				)}

				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={STEP_METADATA.length}
					onPrevious={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
					onNext={() => handleStepChange(currentStep + 1)}
					onReset={() => {
						setCurrentStep(0);
						controller.resetFlow();
					}}
					canNavigateNext={true}
					isFirstStep={currentStep === 0}
				/>

				{/* V7 Service: Flow Completion */}
				{controller.tokens?.accessToken && (
					<FlowCompletionService
						config={{
							...FlowCompletionConfigs.authorizationCode,
							flowType: 'redirectless',
							title: 'Redirectless Flow V7 Complete! 🎉',
							description:
								'You have successfully completed the redirectless OAuth flow V7 using response_mode=pi.flow',
							nextSteps: [
								'Use the access token to make API calls',
								'Implement token refresh using the refresh token',
								'Explore other OAuth flows in the playground',
								'Learn about PKCE security best practices',
								'Try the enhanced V7 features',
							],
						}}
						tokens={controller.tokens}
						onReset={() => {
							controller.resetFlow();
							setCurrentStep(0);
							setApiCalls([]);
						}}
					/>
				)}

				<StepSection>{renderStepContent()}</StepSection>
			</ContentWrapper>

			{/* Custom Login Form Modal */}
			{showLoginForm && (
				<LoginFormOverlay>
					<LoginFormModal>
						<LoginFormTitle>
							<FiShield style={{ marginRight: '0.5rem' }} />
							Sign In to Continue
						</LoginFormTitle>

						<div
							style={{
								background: '#f0f9ff',
								padding: '1rem',
								borderRadius: '0.5rem',
								marginBottom: '1.5rem',
								border: '1px solid #bae6fd',
							}}
						>
							<div style={{ fontSize: '0.875rem', color: '#0c4a6e' }}>
								<strong>🔒 Redirectless Flow Demo</strong>
								<br />
								Enter your credentials below. Behind the scenes, we'll make a POST request to
								PingOne's authorization endpoint with <code>response_mode=pi.flow</code> and receive
								tokens directly - no redirect needed!
							</div>
						</div>

						<LoginFormField>
							<LoginFormLabel>Username / Email</LoginFormLabel>
							<LoginFormInput
								type="email"
								value={loginCredentials.username}
								onChange={(e) =>
									setLoginCredentials((prev) => ({ ...prev, username: e.target.value }))
								}
								placeholder="Enter your username or email"
								disabled={isAuthenticating}
							/>
						</LoginFormField>

						<LoginFormField>
							<LoginFormLabel>Password</LoginFormLabel>
							<LoginFormInput
								type="password"
								value={loginCredentials.password}
								onChange={(e) =>
									setLoginCredentials((prev) => ({ ...prev, password: e.target.value }))
								}
								placeholder="Enter your password"
								disabled={isAuthenticating}
							/>
						</LoginFormField>

						<div
							style={{
								background: '#fef3c7',
								padding: '0.75rem',
								borderRadius: '0.375rem',
								marginBottom: '1rem',
								fontSize: '0.75rem',
								color: '#92400e',
							}}
						>
							💡 <strong>Demo Note:</strong> These are demo credentials for testing. The flow will
							make real API calls to PingOne with <code>response_mode=pi.flow</code> to demonstrate
							redirectless authentication.
						</div>

						<LoginFormButtons>
							<LoginFormButton
								$variant="secondary"
								onClick={() => setShowLoginForm(false)}
								disabled={isAuthenticating}
							>
								Cancel
							</LoginFormButton>
							<LoginFormButton
								$variant="primary"
								onClick={handleLoginFormSubmit}
								disabled={
									isAuthenticating || !loginCredentials.username || !loginCredentials.password
								}
							>
								{isAuthenticating ? (
									<>
										<FiRefreshCw className="animate-spin" />
										Authenticating...
									</>
								) : (
									<>
										<FiKey />
										Sign In
									</>
								)}
							</LoginFormButton>
						</LoginFormButtons>
					</LoginFormModal>
				</LoginFormOverlay>
			)}
		</Container>
	);
};

export default RedirectlessFlowV7Real;
