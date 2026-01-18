/**
 * @file SMSOTPConfigurationPageV8.tsx
 * @module v8/flows/types
 * @description SMS/OTP Configuration and Education Page
 * @version 8.0.0
 *
 * This page provides:
 * - SMS/OTP education and information
 * - Device Authentication Policy selection
 * - Configuration before device registration
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiArrowRight, FiBook, FiMessageSquare } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/NewAuthContext';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { ConfigCheckerServiceV8 } from '@/v8/services/configCheckerServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { sendAnalyticsLog } from '@/v8/utils/analyticsLoggerV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import type { DeviceAuthenticationPolicy, MFACredentials } from '../shared/MFATypes';

const MODULE_TAG = '[📱 SMS-OTP-CONFIG-V8]';

export const SMSOTPConfigurationPageV8: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// Get auth context to check for user tokens from Authorization Code Flow
	const authContext = useAuth();

	// Load saved credentials
	const [credentials, setCredentials] = useState<MFACredentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		// #region agent log
		sendAnalyticsLog({
			location: 'SMSOTPConfigurationPageV8.tsx:45',
			message: 'Initializing credentials from storage',
			data: {
				hasUserToken: !!stored.userToken,
				tokenType: stored.tokenType,
				userTokenLength: stored.userToken?.length,
			},
			timestamp: Date.now(),
			sessionId: 'debug-session',
			runId: 'run3',
			hypothesisId: 'F',
		});
		// #endregion

		return {
			environmentId: stored.environmentId || '',
			clientId: stored.clientId || '',
			username: stored.username || '',
			deviceType: 'SMS' as const,
			countryCode: stored.countryCode || '+1',
			phoneNumber: stored.phoneNumber || '',
			email: stored.email || '',
			deviceName: stored.deviceName || '',
			deviceAuthenticationPolicyId: stored.deviceAuthenticationPolicyId || '',
			registrationPolicyId: stored.registrationPolicyId || '',
			tokenType: stored.tokenType || 'worker',
			userToken: stored.userToken || '',
		};
	});

	// Token and modal state
	const [tokenStatus, setTokenStatus] = useState(
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showUserLoginModal, setShowUserLoginModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);

	// Registration flow type state
	const [registrationFlowType, setRegistrationFlowType] = useState<'admin' | 'user'>('user');
	const [adminDeviceStatus, setAdminDeviceStatus] = useState<'ACTIVE' | 'ACTIVATION_REQUIRED'>(
		'ACTIVE'
	);

	// Ref to prevent infinite loops in bidirectional sync
	const isSyncingRef = React.useRef(false);

	// Auto-populate user token from auth context if available
	// This handles the case where user logged in via Authorization Code Flow and was redirected back
	const hasAutoPopulatedRef = React.useRef(false);
	React.useEffect(() => {
		const authToken = authContext.tokens?.access_token;
		const isAuthenticated = authContext.isAuthenticated;

		// Check auth context for auto-population

		// Only auto-populate if:
		// 1. User is authenticated and has an access token
		// 2. We haven't already auto-populated (prevent re-running)
		// 3. We don't already have a user token in credentials
		// Removed restriction on registrationFlowType/tokenType - always sync if token exists and credentials don't have it
		if (isAuthenticated && authToken && !hasAutoPopulatedRef.current && !credentials.userToken) {
			console.log(`[📱 SMS-CONFIG-PAGE-V8] ✅ Auto-populating user token from auth context`, {
				hasToken: !!authToken,
				tokenLength: authToken.length,
				tokenPreview: `${authToken.substring(0, 20)}...`,
				currentTokenType: credentials.tokenType,
				registrationFlowType: registrationFlowType,
			});

			hasAutoPopulatedRef.current = true;
			setCredentials((prev) => ({
				...prev,
				userToken: authToken,
				tokenType: 'user' as const,
			}));

			toastV8.success('User token automatically loaded from your recent login!');
		} else if (isAuthenticated && authToken && !credentials.userToken) {
			console.log(`[📱 SMS-CONFIG-PAGE-V8] ⚠️ Auth token available but not populating`, {
				hasAutoPopulated: hasAutoPopulatedRef.current,
				hasUserToken: !!credentials.userToken,
				registrationFlowType,
				tokenType: credentials.tokenType,
			});
		}

		// Reset the ref if auth token is cleared (user logged out) or if user token was manually cleared
		if (!isAuthenticated || !authToken || (!credentials.userToken && hasAutoPopulatedRef.current)) {
			hasAutoPopulatedRef.current = false;
		}
	}, [
		authContext.tokens?.access_token,
		authContext.isAuthenticated,
		credentials.userToken,
		credentials.tokenType,
		registrationFlowType,
	]);

	// Process callback code directly if modal isn't open (fallback processing)
	const isProcessingCallbackRef = React.useRef(false);
	useEffect(() => {
		// Backup: Clean up malformed URLs with multiple query parameter sets
		// This handles cases where OAuth redirects accumulate in the URL
		const currentSearch = window.location.search;
		if (currentSearch && currentSearch.includes('?code=') && currentSearch.split('?code=').length > 2) {
			// URL has multiple code parameters - extract only the first valid pair
			const firstCodeMatch = currentSearch.match(/[?&]code=([^&?]+)/);
			const firstStateMatch = currentSearch.match(/[?&]state=([^&?]+)/);
			
			if (firstCodeMatch && firstStateMatch) {
				// Reconstruct clean URL with only the first code/state pair
				const cleanUrl = `${window.location.pathname}?code=${firstCodeMatch[1]}&state=${firstStateMatch[1]}`;
				window.history.replaceState({}, document.title, cleanUrl);
				// Return early - let the effect re-run with the cleaned URL
				return;
			} else {
				// Can't parse - just clean the URL completely
				window.history.replaceState({}, document.title, window.location.pathname);
				return;
			}
		}

		const code = searchParams.get('code');
		const error = searchParams.get('error');
		const state = searchParams.get('state');
		const hasUserLoginState = sessionStorage.getItem('user_login_state_v8');

		// #region agent log
		sendAnalyticsLog({
			location: 'SMSOTPConfigurationPageV8.tsx:140',
			message: 'SMSOTPConfigurationPageV8 checking for callback code',
			data: {
				hasCode: !!code,
				hasError: !!error,
				hasUserLoginState: !!hasUserLoginState,
				showUserLoginModal,
				windowLocationSearch: window.location.search,
			},
			timestamp: Date.now(),
			sessionId: 'debug-session',
			runId: 'run3',
			hypothesisId: 'F',
		});
		// #endregion

		// If modal is open, let it handle the callback
		if (showUserLoginModal) return;

		// If no code/error in URL, nothing to process
		if (!code && !error) return;

		// Prevent concurrent processing
		if (isProcessingCallbackRef.current) return;

		const processCallback = async () => {
			// Get stored state fresh (may have been cleared by another component)
			const storedState = sessionStorage.getItem('user_login_state_v8');
			
			// If no stored state but we have code/state in URL, this was already processed by another component
			// Clean up URL silently and return
			if (!storedState && (code || state)) {
				window.history.replaceState({}, document.title, window.location.pathname);
				return;
			}
			
			// If no stored state and no code/error, nothing to do
			if (!storedState) return;

			// #region agent log
			sendAnalyticsLog({
				location: 'SMSOTPConfigurationPageV8.tsx:159',
				message: 'processCallback function called',
				data: {
					hasCode: !!code,
					hasError: !!error,
					hasState: !!state,
					hasStoredState: !!storedState,
					stateFromUrl: state,
					storedState: storedState,
				},
				timestamp: Date.now(),
				sessionId: 'debug-session',
				runId: 'run3',
				hypothesisId: 'F',
			});
			// #endregion

			if (error) {
				const errorDescription = searchParams.get('error_description') || '';
				toastV8.error(`Login failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
				sessionStorage.removeItem('user_login_state_v8');
				sessionStorage.removeItem('user_login_code_verifier_v8');
				sessionStorage.removeItem('user_login_credentials_temp_v8');
				sessionStorage.removeItem('user_login_redirect_uri_v8');
				window.history.replaceState({}, document.title, window.location.pathname);
				return;
			}

			if (code && state) {
				// Only validate state if we have both stored state and URL state
				// If stored state is missing, another component may have already processed this callback
				if (storedState && state !== storedState) {
					// #region agent log
					sendAnalyticsLog({
						location: 'SMSOTPConfigurationPageV8.tsx:173',
						message: 'State validation failed',
						data: { stateFromUrl: state, storedState: storedState },
						timestamp: Date.now(),
						sessionId: 'debug-session',
						runId: 'run3',
						hypothesisId: 'F',
					});
					// #endregion
					console.warn(`[📱 SMS-CONFIG-PAGE-V8] State mismatch - possible CSRF attack`);
					toastV8.error('Security validation failed. Please try again.');
					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
					window.history.replaceState({}, document.title, window.location.pathname);
					return;
				}
				
				// If we have code but no stored state, another component already processed it - clean up URL silently
				if (!storedState) {
					window.history.replaceState({}, document.title, window.location.pathname);
					return;
				}

				isProcessingCallbackRef.current = true;

				try {
					const storedCodeVerifier = sessionStorage.getItem('user_login_code_verifier_v8');
					const storedCredentials = sessionStorage.getItem('user_login_credentials_temp_v8');

					// #region agent log
					sendAnalyticsLog({
						location: 'SMSOTPConfigurationPageV8.tsx:186',
						message: 'About to exchange code for tokens',
						data: {
							hasCodeVerifier: !!storedCodeVerifier,
							hasStoredCredentials: !!storedCredentials,
						},
						timestamp: Date.now(),
						sessionId: 'debug-session',
						runId: 'run3',
						hypothesisId: 'F',
					});
					// #endregion

					if (!storedCodeVerifier || !storedCredentials) {
						toastV8.error('Missing PKCE verifier or credentials. Please try logging in again.');
						sessionStorage.removeItem('user_login_state_v8');
						sessionStorage.removeItem('user_login_code_verifier_v8');
						sessionStorage.removeItem('user_login_credentials_temp_v8');
						sessionStorage.removeItem('user_login_redirect_uri_v8');
						window.history.replaceState({}, document.title, window.location.pathname);
						return;
					}

					const credentials = JSON.parse(storedCredentials);

					// Exchange authorization code for tokens
					const tokenResponse = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
						{
							environmentId: credentials.environmentId,
							clientId: credentials.clientId,
							clientSecret: credentials.clientSecret,
							redirectUri: credentials.redirectUri,
							scopes: credentials.scopes,
							clientAuthMethod:
								credentials.clientAuthMethod ||
								credentials.tokenEndpointAuthMethod ||
								'client_secret_post',
						},
						code,
						storedCodeVerifier
					);

					// #region agent log
					sendAnalyticsLog({
						location: 'SMSOTPConfigurationPageV8.tsx:211',
						message: 'Token exchange successful',
						data: {
							hasAccessToken: !!tokenResponse?.access_token,
							accessTokenLength: tokenResponse?.access_token?.length,
						},
						timestamp: Date.now(),
						sessionId: 'debug-session',
						runId: 'run3',
						hypothesisId: 'F',
					});
					// #endregion

					// Clean up session storage and URL
					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
					window.history.replaceState({}, document.title, window.location.pathname);

					// Update credentials - mark OAuth as completed (we don't need to store the token itself)
					setCredentials((prev) => {
						const updated = {
							...prev,
							// Store a placeholder to indicate OAuth was successful - the token itself isn't needed
							userToken: 'oauth_completed',
							tokenType: 'user' as const,
						};

						// #region agent log
						sendAnalyticsLog({
							location: 'SMSOTPConfigurationPageV8.tsx:224',
							message: 'Credentials updated to mark OAuth as completed',
							data: { tokenType: updated.tokenType },
							timestamp: Date.now(),
							sessionId: 'debug-session',
							runId: 'run3',
							hypothesisId: 'F',
						});
						// #endregion

						return updated;
					});

					toastV8.success('Authentication successful! You can now proceed.');
				} catch (error) {
					// #region agent log
					sendAnalyticsLog({
						location: 'SMSOTPConfigurationPageV8.tsx:228',
						message: 'Token exchange failed',
						data: { errorMessage: error instanceof Error ? error.message : String(error) },
						timestamp: Date.now(),
						sessionId: 'debug-session',
						runId: 'run3',
						hypothesisId: 'F',
					});
					// #endregion

					console.error(`[📱 SMS-CONFIG-PAGE-V8] Failed to exchange code for tokens`, error);
					const errorMessage =
						error instanceof Error
							? error.message
							: 'Failed to exchange authorization code for tokens';
					if (errorMessage.includes('invalid_grant') || errorMessage.includes('expired')) {
						toastV8.error(
							'Authorization code expired or already used. Please try logging in again.'
						);
					} else {
						toastV8.error(errorMessage);
					}

					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
				} finally {
					isProcessingCallbackRef.current = false;
				}
			}
		};

		if (code || error) {
			processCallback();
		}
	}, [searchParams, showUserLoginModal]);

	// Bidirectional sync between Registration Flow Type and tokenType dropdown
	// When Registration Flow Type changes, update tokenType dropdown
	React.useEffect(() => {
		// Skip if we're in the middle of syncing from the other direction
		if (isSyncingRef.current) return;

		if (registrationFlowType === 'user' && credentials.tokenType !== 'user') {
			// User selected "User Flow" - sync to tokenType dropdown
			console.log(
				`[📱 SMS-CONFIG-PAGE-V8] Registration Flow Type changed to 'user' - syncing tokenType dropdown`,
				{
					currentTokenType: credentials.tokenType,
					hasUserToken: !!credentials.userToken,
					userTokenLength: credentials.userToken?.length || 0,
				}
			);
			isSyncingRef.current = true;
			setCredentials((prev) => {
				const updated = {
					...prev,
					tokenType: 'user' as const,
					// CRITICAL: Preserve existing userToken when switching to user flow (don't clear it)
					userToken: prev.userToken || '',
				};
				console.log(`[📱 SMS-CONFIG-PAGE-V8] ✅ Updated credentials with preserved token`, {
					tokenType: updated.tokenType,
					hasUserToken: !!updated.userToken,
					userTokenLength: updated.userToken?.length || 0,
				});
				return updated;
			});
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		} else if (registrationFlowType === 'admin' && credentials.tokenType !== 'worker') {
			// User selected "Admin Flow" - sync to tokenType dropdown
			console.log(
				`[📱 SMS-CONFIG-PAGE-V8] Registration Flow Type changed to 'admin' - syncing tokenType dropdown`
			);
			isSyncingRef.current = true;
			setCredentials((prev) => ({
				...prev,
				tokenType: 'worker',
				userToken: '', // Clear user token when switching to admin
			}));
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [registrationFlowType, credentials.tokenType, credentials.userToken]);

	// When tokenType dropdown changes, sync to Registration Flow Type
	React.useEffect(() => {
		// Skip if we're in the middle of syncing from the other direction
		if (isSyncingRef.current) return;

		if (credentials.tokenType === 'user' && registrationFlowType !== 'user') {
			// User changed dropdown to "User Token" - sync to Registration Flow Type
			console.log(
				`[📱 SMS-CONFIG-PAGE-V8] Token type dropdown changed to 'user' - syncing Registration Flow Type`
			);
			isSyncingRef.current = true;
			setRegistrationFlowType('user');
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		} else if (credentials.tokenType === 'worker' && registrationFlowType !== 'admin') {
			// User changed dropdown to "Worker Token" - sync to Registration Flow Type
			console.log(
				`[📱 SMS-CONFIG-PAGE-V8] Token type dropdown changed to 'worker' - syncing Registration Flow Type`
			);
			isSyncingRef.current = true;
			setRegistrationFlowType('admin');
			// Reset flag after state update
			setTimeout(() => {
				isSyncingRef.current = false;
			}, 0);
		}
	}, [credentials.tokenType, registrationFlowType]);

	// Policy state
	const [deviceAuthPolicies, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);

	// API display visibility and height for dynamic padding
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(false);
	const [apiDisplayHeight, setApiDisplayHeight] = useState(0);

	// Load device authentication policies
	const loadPolicies = useCallback(async () => {
		// Policies can only be loaded with a worker token
		// Even if using User Token for the flow, we need worker token for policies
		if (!credentials.environmentId || !tokenStatus.isValid) {
			// If no worker token, don't show error - user can enter policy ID manually
			if (!tokenStatus.isValid && credentials.tokenType === 'user') {
				// User is using User Token - policies are optional, they can enter ID manually
				return;
			}
			return;
		}

		setIsLoadingPolicies(true);
		setPoliciesError(null);

		try {
			// Always use worker token for loading policies (even when tokenType is 'user')
			const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(
				credentials.environmentId
			);
			setDeviceAuthPolicies(policies);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Failed to load policies:`, error);
			setPoliciesError(errorMessage);
			// Only show error toast if worker token is available (user expects it to work)
			if (tokenStatus.isValid) {
				toastV8.error(`Failed to load policies: ${errorMessage}`);
			}
		} finally {
			setIsLoadingPolicies(false);
		}
	}, [credentials.environmentId, credentials.tokenType, tokenStatus.isValid]);

	// Load policies when environment and worker token are ready
	// Note: Policies require worker token, even when using User Token for the flow
	useEffect(() => {
		if (credentials.environmentId && tokenStatus.isValid) {
			void loadPolicies();
		}
	}, [credentials.environmentId, tokenStatus.isValid, loadPolicies]);

	// Monitor token status changes
	useEffect(() => {
		const checkToken = () => {
			setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
		};

		const interval = setInterval(checkToken, 30000); // Check every 30 seconds
		checkToken();

		return () => clearInterval(interval);
	}, []);

	// Monitor API display visibility
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});

		return () => unsubscribe();
	}, []);

	// Observe API Display height changes for dynamic padding
	useEffect(() => {
		if (!isApiDisplayVisible) {
			setApiDisplayHeight(0);
			return;
		}

		const updateHeight = () => {
			const apiDisplayElement = document.querySelector('.super-simple-api-display') as HTMLElement;
			if (apiDisplayElement) {
				// Use getBoundingClientRect to get actual rendered height including borders
				const rect = apiDisplayElement.getBoundingClientRect();
				const height = rect.height;
				// Add extra buffer to ensure buttons are visible (40px buffer instead of 20px)
				setApiDisplayHeight(height > 0 ? height : apiDisplayElement.offsetHeight);
			}
		};

		// Initial measurement with delay to ensure element is rendered
		const initialTimeout = setTimeout(updateHeight, 100);

		// Use ResizeObserver to track height changes
		const resizeObserver = new ResizeObserver(() => {
			updateHeight();
		});

		const apiDisplayElement = document.querySelector('.super-simple-api-display');
		if (apiDisplayElement) {
			resizeObserver.observe(apiDisplayElement);
		}

		// Also check periodically in case ResizeObserver doesn't catch all changes
		const interval = setInterval(updateHeight, 200);

		return () => {
			clearTimeout(initialTimeout);
			resizeObserver.disconnect();
			clearInterval(interval);
		};
	}, [isApiDisplayVisible]);

	// Save credentials when they change
	useEffect(() => {
		// #region agent log
		sendAnalyticsLog({
			location: 'SMSOTPConfigurationPageV8.tsx:467',
			message: 'Saving credentials to storage',
			data: {
				hasUserToken: !!credentials.userToken,
				tokenType: credentials.tokenType,
				userTokenLength: credentials.userToken?.length,
			},
			timestamp: Date.now(),
			sessionId: 'debug-session',
			runId: 'run3',
			hypothesisId: 'F',
		});
		// #endregion

		CredentialsServiceV8.saveCredentials('mfa-flow-v8', credentials);

		// Verify the save by immediately reading it back
		setTimeout(() => {
			const saved = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
				flowKey: 'mfa-flow-v8',
				flowType: 'oidc',
				includeClientSecret: false,
				includeRedirectUri: false,
				includeLogoutUri: false,
				includeScopes: false,
			});

			// #region agent log
			sendAnalyticsLog({
				location: 'SMSOTPConfigurationPageV8.tsx:479',
				message: 'Verified saved credentials from storage',
				data: {
					hasUserToken: !!saved.userToken,
					tokenType: saved.tokenType,
					userTokenLength: saved.userToken?.length,
					matches: credentials.userToken === saved.userToken,
				},
				timestamp: Date.now(),
				sessionId: 'debug-session',
				runId: 'run3',
				hypothesisId: 'F',
			});
			// #endregion
		}, 50);
	}, [credentials]);

	// Handle proceed to registration
	const handleProceedToRegistration = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			e.stopPropagation();

			const tokenType = credentials.tokenType || 'worker';
			// For user token type: consider valid if we have any userToken value (including 'oauth_completed' placeholder)
			// This allows progression after successful OAuth exchange without requiring actual token validation
			const isTokenValid =
				tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim();

			if (!credentials.deviceAuthenticationPolicyId) {
				toastV8.warning('Please select a Device Authentication Policy before proceeding');
				return;
			}

			if (!isTokenValid) {
				toastV8.warning(
					`Please provide a valid ${tokenType === 'worker' ? 'Worker Token' : 'User Token'} before proceeding`
				);
				return;
			}

			if (!credentials.environmentId) {
				toastV8.warning('Please enter an Environment ID before proceeding');
				return;
			}

			if (!credentials.username) {
				toastV8.warning('Please enter a Username before proceeding');
				return;
			}

			// Navigate to actual SMS registration flow device route
			navigate('/v8/mfa/register/sms/device', {
				replace: false,
				state: {
					deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
					environmentId: credentials.environmentId,
					username: credentials.username,
					tokenType: credentials.tokenType,
					userToken: credentials.userToken,
					registrationFlowType: registrationFlowType,
					adminDeviceStatus: adminDeviceStatus,
					configured: true, // Flag to indicate configuration is complete
				},
			});
		},
		[navigate, credentials, tokenStatus.isValid, registrationFlowType, adminDeviceStatus]
	);

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb' }}>
			<MFANavigationV8 currentPage="registration" showBackToMain={true} />

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			<div
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					padding: '32px 20px',
					paddingBottom:
						isApiDisplayVisible && apiDisplayHeight > 0 ? `${apiDisplayHeight + 60}px` : '32px',
					transition: 'padding-bottom 0.3s ease',
					overflow: 'visible',
				}}
			>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
						borderRadius: '12px',
						padding: '32px',
						marginBottom: '32px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
						<FiMessageSquare size={32} color="white" />
						<h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>
							SMS / OTP Configuration
						</h1>
					</div>
					<p style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Configure SMS device registration, learn about OTP verification, and prepare for device
						setup
					</p>
				</div>

				{/* Registration Flow Type Selection - SMS/Email specific - MOVED ABOVE MFAConfigurationStepV8 */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is for visual grouping, inputs are inside */}
					<label
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '16px',
						}}
					>
						Registration Flow Type <span style={{ color: '#dc2626' }}>*</span>
					</label>
					<div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
						<label
							style={{
								flex: 1,
								padding: '16px',
								border: `2px solid ${registrationFlowType === 'admin' ? '#3b82f6' : '#d1d5db'}`,
								borderRadius: '8px',
								background: registrationFlowType === 'admin' ? '#eff6ff' : 'white',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onClick={() => setRegistrationFlowType('admin')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="admin"
									checked={registrationFlowType === 'admin'}
									onChange={() => setRegistrationFlowType('admin')}
									style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
								/>
								<div style={{ flex: 1 }}>
									<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
										Admin Flow
									</span>
									<div
										style={{
											fontSize: '12px',
											color: '#6b7280',
											marginTop: '2px',
											fontStyle: 'italic',
										}}
									>
										Using worker token
									</div>
								</div>
							</div>
							{/* Device status options for Admin Flow */}
							<div
								style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}
							>
								<div
									style={{
										fontSize: '13px',
										fontWeight: '600',
										color: '#374151',
										marginBottom: '8px',
									}}
								>
									Device Status:
								</div>
								<div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '8px 12px',
											border: `1px solid ${adminDeviceStatus === 'ACTIVE' ? '#10b981' : '#d1d5db'}`,
											borderRadius: '6px',
											background: adminDeviceStatus === 'ACTIVE' ? '#f0fdf4' : 'white',
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
											transition: 'all 0.2s ease',
											opacity: registrationFlowType === 'admin' ? 1 : 0.7,
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus('ACTIVE');
											}
										}}
									>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVE"
											checked={adminDeviceStatus === 'ACTIVE'}
											onChange={() => {
												if (registrationFlowType === 'admin') {
													setAdminDeviceStatus('ACTIVE');
												}
											}}
											onClick={(e) => e.stopPropagation()}
											disabled={registrationFlowType !== 'admin'}
											style={{
												margin: 0,
												cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
												width: '16px',
												height: '16px',
											}}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>
											<strong>ACTIVE</strong> - Device created as ready to use, no activation needed
										</span>
									</label>
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '8px 12px',
											border: `1px solid ${adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#f59e0b' : '#d1d5db'}`,
											borderRadius: '6px',
											background: adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#fffbeb' : 'white',
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
											transition: 'all 0.2s ease',
											opacity: registrationFlowType === 'admin' ? 1 : 0.7,
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus('ACTIVATION_REQUIRED');
											}
										}}
									>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVATION_REQUIRED"
											checked={adminDeviceStatus === 'ACTIVATION_REQUIRED'}
											onChange={() => {
												if (registrationFlowType === 'admin') {
													setAdminDeviceStatus('ACTIVATION_REQUIRED');
												}
											}}
											onClick={(e) => e.stopPropagation()}
											disabled={registrationFlowType !== 'admin'}
											style={{
												margin: 0,
												cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
												width: '16px',
												height: '16px',
											}}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>
											<strong>ACTIVATION_REQUIRED</strong> - OTP will be sent for device activation
										</span>
									</label>
								</div>
							</div>
						</label>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
						<label
							style={{
								flex: 1,
								padding: '16px',
								border: `2px solid ${registrationFlowType === 'user' ? '#3b82f6' : '#d1d5db'}`,
								borderRadius: '8px',
								background: registrationFlowType === 'user' ? '#eff6ff' : 'white',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onClick={() => setRegistrationFlowType('user')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="user"
									checked={registrationFlowType === 'user'}
									onChange={() => setRegistrationFlowType('user')}
									style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
								/>
								<div style={{ flex: 1 }}>
									<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
										User Flow
									</span>
									<div
										style={{
											fontSize: '12px',
											color: '#6b7280',
											marginTop: '2px',
											fontStyle: 'italic',
										}}
									>
										Using access token from User Authentication
									</div>
								</div>
							</div>
							<div
								style={{
									fontSize: '13px',
									color: '#6b7280',
									marginLeft: '28px',
									lineHeight: '1.5',
									padding: '8px 12px',
									background: '#f9fafb',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}
							>
								<strong style={{ color: '#f59e0b' }}>ACTIVATION_REQUIRED</strong> - OTP will be sent
								for device activation
							</div>
						</label>
					</div>
					<small
						style={{
							display: 'block',
							marginTop: '12px',
							fontSize: '12px',
							color: '#6b7280',
							lineHeight: '1.5',
						}}
					>
						Admin Flow allows choosing device status (ACTIVE or ACTIVATION_REQUIRED). User Flow
						always requires activation.
					</small>
				</div>

				{/* New Configuration Step with Token Type, User Token, Username, etc. */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<MFAConfigurationStepV8
						credentials={credentials}
						setCredentials={setCredentials}
						tokenStatus={tokenStatus}
						deviceAuthPolicies={deviceAuthPolicies}
						isLoadingPolicies={isLoadingPolicies}
						registrationFlowType={registrationFlowType}
						policiesError={policiesError}
						refreshDeviceAuthPolicies={loadPolicies}
						showWorkerTokenModal={showWorkerTokenModal}
						setShowWorkerTokenModal={setShowWorkerTokenModal}
						showUserLoginModal={showUserLoginModal}
						setShowUserLoginModal={setShowUserLoginModal}
						showSettingsModal={showSettingsModal}
						setShowSettingsModal={setShowSettingsModal}
						deviceType="SMS"
						deviceTypeLabel="SMS"
						policyDescription="Controls how PingOne challenges the user during SMS MFA authentication."
						// Mock props required by MFAFlowBaseRenderProps but not used in this context
						mfaState={{ deviceId: '', otpCode: '', deviceStatus: '', verificationResult: null }}
						setMfaState={() => {}}
						isLoading={false}
						setIsLoading={() => {}}
						nav={
							{
								currentStep: 0,
								goToNext: () => {},
								goToPrevious: () => {},
								goToStep: () => {},
								reset: () => {},
								setValidationErrors: () => {},
								setValidationWarnings: () => {},
							} as ReturnType<typeof useStepNavigationV8>
						}
						showDeviceLimitModal={false}
						setShowDeviceLimitModal={() => {}}
					/>
				</div>

				{/* Education Section */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
						<FiBook size={24} color="#3b82f6" />
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
							About SMS / OTP Authentication
						</h2>
					</div>
					<div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>SMS-based OTP (One-Time Password)</strong> authentication sends a temporary
							code to your mobile phone via text message.
						</p>
						<ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
							<li>Secure: Each code is unique and expires after a short time</li>
							<li>Convenient: No additional apps or hardware required</li>
							<li>Widely supported: Works on any mobile phone with SMS capability</li>
							<li>User-friendly: Simple code entry process</li>
						</ul>
						<p style={{ margin: 0 }}>
							After registering your phone number, you'll receive a 6-digit code via SMS whenever
							you need to authenticate.
						</p>
					</div>
				</div>

				{/* Navigation Button - Only show Cancel, navigation happens via flow */}
				<div
					style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}
				>
					<button
						type="button"
						onClick={() => navigateToMfaHubWithCleanup(navigate)}
						style={{
							padding: '12px 24px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							background: 'white',
							color: '#374151',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleProceedToRegistration}
						disabled={
							!credentials.deviceAuthenticationPolicyId ||
							!credentials.environmentId ||
							!credentials.username ||
							((credentials.tokenType || 'worker') === 'worker'
								? !tokenStatus.isValid
								: !credentials.userToken?.trim())
						}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background:
								credentials.deviceAuthenticationPolicyId &&
								credentials.environmentId &&
								credentials.username &&
								((credentials.tokenType || 'worker') === 'worker'
									? tokenStatus.isValid
									: !!credentials.userToken?.trim())
									? '#10b981'
									: '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor:
								credentials.deviceAuthenticationPolicyId &&
								credentials.environmentId &&
								credentials.username &&
								((credentials.tokenType || 'worker') === 'worker'
									? tokenStatus.isValid
									: !!credentials.userToken?.trim())
									? 'pointer'
									: 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						Continue to Device Registration
						<FiArrowRight size={18} />
					</button>
				</div>
			</div>

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (() => {
				// Check if we should show token only (matches MFA pattern)
				try {
					const { MFAConfigurationServiceV8 } = require('@/v8/services/mfaConfigurationServiceV8');
					const config = MFAConfigurationServiceV8.loadConfiguration();
					const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
					
					// Show token-only if showTokenAtEnd is ON and token is valid
					const showTokenOnly = config.workerToken.showTokenAtEnd && tokenStatus.isValid;
					
					return (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
					}}
							showTokenOnly={showTokenOnly}
						/>
					);
				} catch {
					return (
						<WorkerTokenModalV8
							isOpen={showWorkerTokenModal}
							onClose={() => {
								setShowWorkerTokenModal(false);
								setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
							}}
						/>
					);
				}
			})()}

			{/* User Login Modal */}
			{showUserLoginModal && (
				<UserLoginModalV8
					isOpen={showUserLoginModal}
					onClose={() => setShowUserLoginModal(false)}
					onTokenReceived={(token) => {
						setCredentials((prev) => ({ ...prev, userToken: token, tokenType: 'user' }));
						setShowUserLoginModal(false);
						toastV8.success('User token received successfully!');
					}}
					environmentId={credentials.environmentId}
				/>
			)}
		</div>
	);
};
