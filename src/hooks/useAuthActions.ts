// src/hooks/useAuthActions.ts
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { AuthContextType, AuthState, LoginResult } from '../types/auth';
import type { OAuthTokens, OAuthTokenResponse } from '../types/storage';
import { logger } from '../utils/logger';
import { generateCodeChallenge } from '../utils/oauth';
import { safeJsonParse } from '../utils/secureJson';
import { oauthStorage } from '../utils/storage';
import { validateAndParseCallbackUrl } from '../utils/urlValidation';
import FlowContextUtils from '../services/flowContextUtils';
import { saveFlowCredentials } from '../services/flowCredentialService';
import {
	getAllStoredTokens,
	getStoredTokens,
	getStoredUser,
	isRefreshTokenValid,
	isTokenValid,
} from '../services/authTokenService';
import { loadAuthConfiguration } from '../services/authConfigurationService';
import type { AuthAppConfig } from '../types/auth';

/**
 * Type-safe wrapper for oauthStorage.setTokens
 * Validates that the method exists and provides clear error messages
 * @param tokens - The OAuth token response to store
 * @throws Error if setTokens method is not available
 */
const saveTokensSafely = (tokens: OAuthTokenResponse): boolean => {
	if (!oauthStorage) {
		const error = 'oauthStorage is not available';
		logger.error('NewAuthContext', error);
		throw new Error(error);
	}

	if (typeof oauthStorage.setTokens !== 'function') {
		const error = `oauthStorage.setTokens is not a function. Available methods: ${Object.keys(oauthStorage).join(', ')}`;
		logger.error('NewAuthContext', error);
		throw new Error(error);
	}

	try {
		const success = oauthStorage.setTokens(tokens);
		if (!success) {
			logger.warn('NewAuthContext', 'Failed to save tokens (setTokens returned false)');
		}
		return success;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error saving tokens';
		const errorObj = error instanceof Error ? error : undefined;
		logger.error('NewAuthContext', `Error saving tokens: ${errorMessage}`, undefined, errorObj);
		throw error;
	}
};

type AuthConfig = AuthContextType['config'];

interface AuthRequestData {
	authorizationUrl: string;
	clientId: string;
	redirectUri: string;
	scope: string;
	state: string;
	nonce: string;
	requestParams?: Record<string, string>;
}

interface UseAuthActionsParams {
	config: AuthConfig;
	setConfig: Dispatch<SetStateAction<AuthAppConfig>>;
	updateState: (updates: Partial<AuthState>) => void;
	setState: Dispatch<SetStateAction<AuthState>>;
	authRequestData: AuthRequestData | null;
	setAuthRequestData: Dispatch<SetStateAction<AuthRequestData | null>>;
	setShowAuthModal: Dispatch<SetStateAction<boolean>>;
}

/**
 * Centralise the primary auth actions so NewAuthContext stays lean.
 */
const useAuthActions = ({
	config,
	setConfig,
	updateState,
	setState,
	authRequestData,
	setAuthRequestData,
	setShowAuthModal,
}: UseAuthActionsParams) => {
	const login = useCallback(
		async (
			redirectAfterLogin = '/',
			callbackType: 'dashboard' | 'oauth' = 'oauth',
			overrideConfig?: Partial<AuthConfig>
		): Promise<LoginResult> => {
			const effectiveConfig = overrideConfig ? { ...config, ...overrideConfig } : config;

			console.log(' [NewAuthContext] Starting login process...', {
				redirectAfterLogin,
				callbackType,
				hasConfig: !!effectiveConfig,
				hasOverride: !!overrideConfig,
				clientId: effectiveConfig?.clientId,
				environmentId: effectiveConfig?.environmentId,
				authorizationEndpoint: effectiveConfig?.authorizationEndpoint,
			});

			try {
				if (!effectiveConfig?.clientId || !effectiveConfig?.environmentId) {
					const errorMessage =
						'Configuration required. Please configure your PingOne settings first.';
					console.error(' [NewAuthContext] Missing configuration:', {
						hasClientId: !!effectiveConfig?.clientId,
						hasEnvironmentId: !!effectiveConfig?.environmentId,
						config: effectiveConfig,
					});
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				console.log(' [NewAuthContext] Configuration validated');

				const state = Math.random().toString(36).substring(2, 15);
				const nonce = Math.random().toString(36).substring(2, 15);

				console.log(' [NewAuthContext] Generated security parameters:', {
					state: `${state.substring(0, 8)}...`,
					nonce: `${nonce.substring(0, 8)}...`,
				});

				const codeVerifier =
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15);
				const codeChallenge = await generateCodeChallenge(codeVerifier);

				console.log(' [NewAuthContext] PKCE generation successful:', {
					codeVerifier: `${codeVerifier.substring(0, 20)}...`,
					codeChallenge: `${codeChallenge.substring(0, 20)}...`,
					codeVerifierLength: codeVerifier.length,
					codeChallengeLength: codeChallenge.length,
				});

				sessionStorage.setItem('oauth_state', state);
				sessionStorage.setItem('oauth_nonce', nonce);
				sessionStorage.setItem('code_verifier', codeVerifier);
				sessionStorage.setItem('oauth_code_verifier', codeVerifier);
				sessionStorage.setItem('authz_v3_code_verifier', codeVerifier);
				sessionStorage.setItem('oauth2_v3_code_verifier', codeVerifier);
				sessionStorage.setItem('oidc_v3_code_verifier', codeVerifier);
				sessionStorage.setItem('oauth_redirect_after_login', redirectAfterLogin);

				console.log(' [NewAuthContext] Stored in sessionStorage:', {
					oauth_state: `${state.substring(0, 8)}...`,
					oauth_nonce: `${nonce.substring(0, 8)}...`,
					code_verifier: `${codeVerifier.substring(0, 20)}...`,
					oauth_code_verifier: `${codeVerifier.substring(0, 20)}...`,
					oauth_redirect_after_login: redirectAfterLogin,
				});

				const configuredRedirectUri = effectiveConfig?.redirectUri;
				console.log('🔍 [NewAuthContext] REDIRECT URI SELECTION DEBUG:', {
					configRedirectUri: effectiveConfig?.redirectUri,
					hasConfigRedirectUri: !!effectiveConfig?.redirectUri,
					callbackType,
					windowOrigin: window.location.origin,
					configObject: effectiveConfig,
					configKeys: effectiveConfig ? Object.keys(effectiveConfig) : [],
					hasOverride: !!overrideConfig,
				});

				const redirectUri =
					callbackType === 'dashboard'
						? `${window.location.origin}/dashboard-callback`
						: configuredRedirectUri || `${window.location.origin}/authz-callback`;

				console.log('🔍 [NewAuthContext] FINAL REDIRECT URI DECISION:', {
					configuredRedirectUri,
					callbackType,
					finalRedirectUri: redirectUri,
					usingConfigured: !!configuredRedirectUri,
					usingFallback: !configuredRedirectUri,
				});

				console.log(' [NewAuthContext] Redirect URI configuration:', {
					callbackType,
					configuredRedirectUri,
					redirectUri,
					windowOrigin: window.location.origin,
					configRedirectUri: effectiveConfig.redirectUri,
					finalRedirectUri: redirectUri,
					configObject: {
						hasRedirectUri: !!effectiveConfig.redirectUri,
						redirectUriValue: effectiveConfig.redirectUri,
						configKeys: effectiveConfig ? Object.keys(effectiveConfig) : [],
						fullConfig: effectiveConfig,
					},
				});

				let authEndpoint: string | undefined =
					typeof effectiveConfig?.pingone?.authEndpoint === 'string' ? effectiveConfig.pingone.authEndpoint :
					typeof effectiveConfig?.authorizationEndpoint === 'string' ? effectiveConfig.authorizationEndpoint :
					typeof effectiveConfig?.authEndpoint === 'string' ? effectiveConfig.authEndpoint :
					undefined;
				
				// IMPORTANT: Always prefer direct clientId over nested pingone.clientId
				// The direct clientId is what's shown in the UI and what user configured
				const clientId =
					effectiveConfig?.clientId || effectiveConfig?.pingone?.clientId;
				
				console.log('🔍 [NewAuthContext] CLIENT ID SELECTION:', {
					directClientId: effectiveConfig?.clientId,
					pingoneClientId: effectiveConfig?.pingone?.clientId,
					selectedClientId: clientId,
					usingDirect: !!effectiveConfig?.clientId,
					usingPingone: !effectiveConfig?.clientId && !!effectiveConfig?.pingone?.clientId,
				});

				if (!authEndpoint && effectiveConfig?.environmentId) {
					authEndpoint = `https://auth.pingone.com/${effectiveConfig.environmentId}/as/authorize`;
					console.log(
						' [NewAuthContext] Constructed authEndpoint from environmentId:',
						authEndpoint
					);
				}

				// Ensure authEndpoint is a valid string before using it
				if (!authEndpoint || typeof authEndpoint !== 'string') {
					const errorMessage = `Invalid authorization endpoint: ${authEndpoint}. Please configure your authorization endpoint or environment ID.`;
					console.error(' [NewAuthContext] Invalid authEndpoint:', { authEndpoint, effectiveConfig });
					throw new Error(errorMessage);
				}

				console.log(' [NewAuthContext] Configuration debug:', {
					hasConfig: !!effectiveConfig,
					configKeys: effectiveConfig ? Object.keys(effectiveConfig) : [],
					authEndpoint,
					clientId,
					hasOverride: !!overrideConfig,
					configStructure: {
						pingone: effectiveConfig?.pingone,
						direct: {
							authorizationEndpoint: effectiveConfig?.authorizationEndpoint,
							authEndpoint: effectiveConfig?.authEndpoint,
							clientId: effectiveConfig?.clientId,
							environmentId: effectiveConfig?.environmentId,
						},
					},
				});

				if (!authEndpoint || !clientId) {
					const missing = [];
					if (!authEndpoint) missing.push('Authorization Endpoint');
					if (!clientId) missing.push('Client ID');

					const errorMessage = `PingOne configuration incomplete. Missing: ${missing.join(', ')}.

To set up PingOne authentication:
1. Navigate to Configuration (/configuration)
2. Enter your PingOne Environment ID and Client ID
3. Save the configuration

You can find these values in your PingOne Admin Console under Applications.
Note: The Authorization Endpoint will be automatically constructed from your Environment ID.`;

					console.error(' [NewAuthContext] Configuration error:', errorMessage);
					throw new Error(errorMessage);
				}

				const authUrl = new URL(authEndpoint);
				authUrl.searchParams.set('response_type', 'code');
				authUrl.searchParams.set('client_id', clientId);
				const enforcedRedirectUri =
					callbackType === 'dashboard'
						? `${window.location.origin}/dashboard-callback`
						: redirectUri;
				authUrl.searchParams.set('redirect_uri', enforcedRedirectUri);

				const scopes = effectiveConfig?.scopes || ['openid', 'profile', 'email'];
				const scopeString = Array.isArray(scopes) ? scopes.join(' ') : scopes;
				authUrl.searchParams.set('scope', scopeString);

				authUrl.searchParams.set('state', state);
				authUrl.searchParams.set('nonce', nonce);
				authUrl.searchParams.set('code_challenge', codeChallenge);
				authUrl.searchParams.set('code_challenge_method', 'S256');

				console.log(' [NewAuthContext] Built authorization URL:', {
					baseUrl: authEndpoint,
					fullUrl: authUrl.toString(),
					params: {
						response_type: 'code',
						client_id: clientId,
						redirect_uri: enforcedRedirectUri,
						scope: scopeString,
						state: `${state.substring(0, 8)}...`,
						nonce: `${nonce.substring(0, 8)}...`,
						code_challenge: `${codeChallenge.substring(0, 20)}...`,
						code_challenge_method: 'S256',
					},
					debugInfo: {
						redirectUriSource:
							callbackType === 'dashboard'
								? 'forced-dashboard'
								: configuredRedirectUri
									? 'configured'
									: 'fallback',
						redirectUriExact: enforcedRedirectUri,
						scopeSource: effectiveConfig?.scopes ? 'configured' : 'default',
						scopeExact: scopeString,
						clientIdSource: effectiveConfig?.clientId
							? 'direct'
							: effectiveConfig?.pingone?.clientId
								? 'pingone'
								: 'unknown',
						authEndpointSource: effectiveConfig?.authEndpoint
							? 'authEndpoint'
							: effectiveConfig?.authorizationEndpoint
								? 'authorizationEndpoint'
								: effectiveConfig?.pingone?.authEndpoint
									? 'pingone.authEndpoint'
									: 'constructed',
						hasOverride: !!overrideConfig,
					},
				});

				logger.auth('NewAuthContext', 'Prepared authorization URL for modal display', {
					authUrl: authUrl.toString(),
				});

				console.log(
					'🔍 [NewAuthContext] EXACT URL BEING SENT TO PINGONE:',
					authUrl.toString()
				);
				console.log('🔍 [NewAuthContext] URL BREAKDOWN:', {
					base: authEndpoint,
					queryParams: Object.fromEntries(authUrl.searchParams),
					redirectUri: authUrl.searchParams.get('redirect_uri'),
					clientId: authUrl.searchParams.get('client_id'),
					scope: authUrl.searchParams.get('scope'),
					responseType: authUrl.searchParams.get('response_type'),
				});

				console.log('🔍 [NewAuthContext] REDIRECT URI BEING SENT:', {
					redirectUri: authUrl.searchParams.get('redirect_uri'),
					clientId: authUrl.searchParams.get('client_id'),
					fullUrl: authUrl.toString(),
					note: 'Check if this redirect URI matches your PingOne application configuration',
				});

				// Build request params object for debug logging
				const requestParamsObj = {
					environmentId: effectiveConfig?.environmentId || '',
					clientId,
					redirectUri: enforcedRedirectUri,
					scopes: scopeString,
					state,
					codeChallenge: codeChallenge,
					flowType: 'authorization-code', // Default, can be overridden by flow context
				};

				setAuthRequestData({
					authorizationUrl: authUrl.toString(),
					clientId,
					redirectUri: enforcedRedirectUri,
					scope: scopeString,
					state,
					nonce,
					requestParams: requestParamsObj,
				});
				
			// CRITICAL: Clear any existing user interaction flag before showing modal
			sessionStorage.removeItem('_user_clicked_proceed');
			
			console.log('🐛 [NewAuthContext] DEBUG - About to show authorization modal:', {
				showAuthModal: 'will be set to true',
				authRequestData: {
					authorizationUrl: authUrl.toString(),
					requestParams: requestParamsObj,
					config: config.name || 'unnamed',
				},
				currentModalState: showAuthModal,
				currentAuthData: authRequestData ? 'exists' : 'null',
			});
			
			setShowAuthModal(true);
			console.log('✅ [NewAuthContext] Modal opened - waiting for user to click Continue button');
			console.log('✅ [NewAuthContext] Modal will NOT auto-proceed - user must click Continue');
			console.log('✅ [NewAuthContext] User interaction flag cleared - modal will wait for user click');

			// Add a small delay to ensure state updates are processed
			setTimeout(() => {
				console.log('🐛 [NewAuthContext] DEBUG - Modal state after timeout:', {
					showAuthModal: 'check App.tsx',
					modalShouldBeVisible: 'if showAuthModal is true in App.tsx',
				});
			}, 100);

				return { success: true, redirectUrl: authUrl.toString() };
			} catch (error) {
				console.error(' [NewAuthContext] Login error:', error);
				console.error(' [NewAuthContext] Error details:', {
					message: error instanceof Error ? error.message : 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
					error,
				});
				const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
				updateState({ error: errorMessage, isLoading: false });
				return { success: false, error: errorMessage };
			}
		},
		[config, setAuthRequestData, setShowAuthModal, updateState]
	);

	const logout = useCallback(() => {
		try {
			logger.auth('NewAuthContext', 'Logging out user');

			oauthStorage.clearTokens();
			oauthStorage.clearUserInfo();

			sessionStorage.removeItem('oauth_state');
			sessionStorage.removeItem('oauth_nonce');
			sessionStorage.removeItem('oauth_redirect_after_login');

			try {
				FlowContextUtils.emergencyCleanup();
				console.log(' [NewAuthContext] Flow context cleaned up during logout');
			} catch (flowCleanupError) {
				console.warn(
					' [NewAuthContext] Failed to cleanup flow context during logout:',
					flowCleanupError
				);
			}

			updateState({
				isAuthenticated: false,
				user: null,
				tokens: null,
				isLoading: false,
				error: null,
			});

			logger.auth('NewAuthContext', 'User logged out successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error during logout';
			logger.error('NewAuthContext', `Error during logout: ${errorMessage}`, error instanceof Error ? { message: error.message, stack: error.stack } : undefined);
			updateState({ error: 'Logout failed', isLoading: false });
		}
	}, [updateState]);

	const handleCallback = useCallback(
		async (url: string): Promise<LoginResult> => {
			try {
				const { urlObj, params, code, state, error, errorDescription } =
					validateAndParseCallbackUrl(url, 'NewAuthContext');

				if (error) {
					const errorMessage = errorDescription || error;
					logger.error('NewAuthContext', 'OAuth error in callback', { error, errorDescription });
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				const flowContextRaw = sessionStorage.getItem('flowContext');
				console.log('🔍 [NewAuthContext] Checking for V6 flow, flowContextRaw:', flowContextRaw);
				if (flowContextRaw) {
					try {
						const parsed = safeJsonParse(flowContextRaw) as Record<string, unknown> | null;
						console.log('🔍 [NewAuthContext] Parsed flow context:', parsed);
						
						if (!parsed || typeof parsed !== 'object') {
							throw new Error('Invalid flow context format');
						}
						
						const flow = parsed.flow as string | undefined;
						const returnPath = parsed.returnPath as string | undefined;
						
						const isV6Flow =
							flow === 'oidc-authorization-code-v6' ||
							flow === 'oauth-authorization-code-v6';

						const isV7Flow =
							flow === 'oidc-authorization-code-v7' ||
							flow === 'oauth-authorization-code-v7' ||
							flow === 'oidc-authorization-code-v7-2' ||
							flow === 'oauth-authorization-code-v7-2';

						console.log(
							'🔍 [NewAuthContext] Is V6 flow?',
							isV6Flow,
							'Is V7 flow?',
							isV7Flow,
							'Flow:',
							flow
						);

						if (isV6Flow || isV7Flow) {
							console.log(
								' [NewAuthContext] V6/V7 FLOW DETECTED EARLY - Skipping state validation and redirecting to flow page'
							);

							if (code) {
								const isOIDCFlow = flow?.includes('oidc') ?? false;
								const authCodeKey = isOIDCFlow ? 'oidc_auth_code' : 'oauth_auth_code';
								sessionStorage.setItem(authCodeKey, code);
								console.log(`🔑 [NewAuthContext] Stored auth code with key: ${authCodeKey}`);
							}
							if (state) {
								sessionStorage.setItem('oauth_state', state);
							}

							const flowReturnPath =
								returnPath ||
								(flow?.includes('oidc') ? '/flows/oidc' : '/flows/oauth');
							console.log(
								' [NewAuthContext] Redirecting back to flow page:',
								flowReturnPath
							);
							window.location.replace(flowReturnPath);

							return { success: true };
						}
					} catch (flowParsingError) {
						console.warn(
							' [NewAuthContext] Failed to parse flow context, continuing with standard callback handling',
							flowParsingError
						);
					}
				}

				const storedState = sessionStorage.getItem('oauth_state');
				if (storedState && state && storedState !== state) {
					const errorMessage =
						'State mismatch detected. Possible CSRF attack or stale session. Please restart the login process.';

					logger.error('NewAuthContext', 'State mismatch detected', {
						storedState,
						returnedState: state,
					});

					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				if (code) {
					logger.auth('NewAuthContext', 'Authorization code received, exchanging for tokens', {
						code: `${code.substring(0, 6)}...`,
						state,
						callbackUrl: url,
					});

					const codeVerifier =
						sessionStorage.getItem('code_verifier') ||
						sessionStorage.getItem('oauth_code_verifier') ||
						sessionStorage.getItem('authz_v3_code_verifier') ||
						sessionStorage.getItem('oauth2_v3_code_verifier') ||
						sessionStorage.getItem('oidc_v3_code_verifier');

					const redirectAfterLogin =
						sessionStorage.getItem('oauth_redirect_after_login') || '/dashboard';

				const configState = config ?? (await loadAuthConfiguration());
				
				// Check flow context for flow-specific credentials (e.g., Kroger flow)
				let flowClientId: string | undefined;
				let flowClientSecret: string | undefined;
				let flowEnvironmentId: string | undefined;
				let flowRedirectUri: string | undefined;
				
				if (flowContextRaw) {
					try {
						const parsed = safeJsonParse(flowContextRaw) as Record<string, unknown>;
						if (parsed?.flow === 'kroger-grocery-store-mfa' || parsed?.flowKey === 'kroger-grocery-store-mfa') {
							flowClientId = parsed?.clientId as string | undefined;
							flowClientSecret = parsed?.clientSecret as string | undefined;
							flowEnvironmentId = parsed?.environmentId as string | undefined;
							flowRedirectUri = parsed?.redirectUri as string | undefined;
							logger.auth('NewAuthContext', 'Using Kroger flow-specific credentials from flow context', {
								hasClientId: !!flowClientId,
								hasClientSecret: !!flowClientSecret,
								hasEnvironmentId: !!flowEnvironmentId,
								hasRedirectUri: !!flowRedirectUri,
							});
						}
					} catch (flowParsingError) {
						console.warn('[NewAuthContext] Failed to parse flow context for credentials:', flowParsingError);
					}
				}
				
				// Use backend proxy for token exchange to avoid CORS issues
				const tokenEndpoint = '/api/token-exchange';
				const clientId =
					flowClientId || configState?.clientId || configState?.pingone?.clientId || params.get('client_id') || undefined;

				if (!clientId) {
					const errorMessage =
						'Client ID missing from configuration. Unable to continue token exchange.';
					logger.error('NewAuthContext', errorMessage, { configState, params: Object.fromEntries(params), flowContext: flowContextRaw });
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				const body = new URLSearchParams();
				body.append('grant_type', 'authorization_code');
				body.append('code', code);
				body.append('client_id', clientId);
				
				// For redirectless flows, use the configured redirect_uri (even if not sent in auth request)
				// The redirect_uri in token exchange must match what's registered in PingOne
				// For redirectless (pi.flow), we may not have sent redirect_uri in auth request,
				// but we still need to include it in token exchange if it's configured
				const tokenRedirectUri = flowRedirectUri || params.get('redirect_uri') || configState?.redirectUri || urlObj.origin;
				body.append('redirect_uri', tokenRedirectUri);
				
				logger.auth('NewAuthContext', 'Token exchange redirect_uri', {
					redirectUri: tokenRedirectUri,
					source: flowRedirectUri ? 'flow-context' : params.get('redirect_uri') ? 'callback-url' : configState?.redirectUri ? 'config' : 'fallback',
					isRedirectless: flowContextRaw ? (safeJsonParse(flowContextRaw) as Record<string, unknown>)?.authMode === 'redirectless' : false,
					flowRedirectUri: flowRedirectUri || 'not-set',
					callbackUrlRedirectUri: params.get('redirect_uri') || 'not-in-url',
					configRedirectUri: configState?.redirectUri || 'not-in-config',
					fallbackOrigin: urlObj.origin,
				});
				
				// Add client_secret if available (required for confidential clients)
				// Prioritize flow-specific client secret over global config
				const clientSecret = flowClientSecret || configState?.clientSecret || configState?.pingone?.clientSecret;
				if (clientSecret) {
					body.append('client_secret', clientSecret);
					logger.auth('NewAuthContext', 'Using client_secret for confidential client', {
						source: flowClientSecret ? 'flow-context' : 'global-config',
					});
				} else {
					logger.auth('NewAuthContext', 'No client_secret found - using public client flow');
				}
					
					if (codeVerifier) {
						body.append('code_verifier', codeVerifier);
					}

					logger.auth('NewAuthContext', 'Sending token request', {
						tokenEndpoint,
						body: Object.fromEntries(body),
					});

					// Backend expects flat form data structure with environment_id
					const tokenRequestBody = Object.fromEntries(body);
					tokenRequestBody.environment_id = flowEnvironmentId || configState?.environmentId;
					
					const response = await fetch(tokenEndpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(tokenRequestBody),
					});

					if (!response.ok) {
						const errorBody = await response.text();
						logger.error('NewAuthContext', 'Token exchange failed', {
							status: response.status,
							statusText: response.statusText,
							errorBody,
						});
						updateState({
							error: `Token exchange failed: ${response.status} ${response.statusText}`,
							isLoading: false,
						});
						return {
							success: false,
							error: `Token exchange failed: ${response.status} ${response.statusText}`,
						};
					}

					const tokenData = await response.json();
					logger.auth('NewAuthContext', 'Tokens exchanged successfully', {
						hasAccessToken: Boolean(tokenData.access_token),
						hasIdToken: Boolean(tokenData.id_token),
						hasRefreshToken: Boolean(tokenData.refresh_token),
						idTokenPreview: tokenData.id_token
							? `${tokenData.id_token.substring(0, 40)}...`
							: undefined,
					});

					// Save tokens using type-safe wrapper
					// NOTE: Always use saveTokensSafely() wrapper, NOT oauthStorage.saveTokens() (doesn't exist)
					// The correct method is oauthStorage.setTokens()
					try {
						saveTokensSafely(tokenData);
					} catch (tokenSaveError) {
						const errorMessage =
							tokenSaveError instanceof Error
								? tokenSaveError.message
								: 'Failed to save tokens after exchange';
						logger.error('NewAuthContext', `Token save failed: ${errorMessage}`, undefined, tokenSaveError instanceof Error ? tokenSaveError : undefined);
						// Continue with flow even if save fails - tokens are still in tokenData
						console.warn('[NewAuthContext] Token save failed, but continuing with token exchange result');
					}

					const tokens = getStoredTokens() || tokenData;
					const user = getStoredUser();

					updateState({
						isAuthenticated: true,
						tokens,
						user,
						isLoading: false,
						error: null,
					});

					logger.auth('NewAuthContext', 'Authentication complete, redirecting user', {
						redirectAfterLogin,
					});

					window.location.replace(redirectAfterLogin);
					return { success: true };
				}

				const tokens = getAllStoredTokens();
				if (tokens?.access_token) {
					logger.auth('NewAuthContext', 'Tokens found in storage, validating expiry');

					if (isTokenValid(tokens) || isRefreshTokenValid(tokens)) {
						const user = getStoredUser();
						updateState({
							isAuthenticated: true,
							tokens,
							user,
							isLoading: false,
							error: null,
						});

						const redirectAfterLogin =
							sessionStorage.getItem('oauth_redirect_after_login') || '/dashboard';
						window.location.replace(redirectAfterLogin);

						return { success: true };
					}
				}

				logger.warn(
					'NewAuthContext',
					'Callback completed without code or usable tokens. User may have cancelled the flow.'
				);
				updateState({
					isAuthenticated: false,
					tokens: null,
					user: null,
					isLoading: false,
					error: null,
				});

				return { success: false, error: 'No authorization code or tokens found in callback.' };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
				logger.error('NewAuthContext', `Error in handleCallback: ${errorMessage}`, error instanceof Error ? { message: error.message, stack: error.stack } : undefined);
				updateState({ error: errorMessage, isLoading: false });
				return { success: false, error: errorMessage };
			}
		},
		[config, updateState]
	);

	const proceedWithOAuth = useCallback(() => {
		console.log('🚨 [NewAuthContext] proceedWithOAuth called - this should ONLY happen when user clicks Continue button');
		console.log('🚨 [NewAuthContext] CRITICAL DEBUG - Call source analysis:');
		console.trace('🚨 [NewAuthContext] FULL STACK TRACE for proceedWithOAuth call');
		
		// CRITICAL: Check if user actually clicked the Continue button
		// The modal sets this flag in sessionStorage when user clicks Continue
		const userClickedProceed = sessionStorage.getItem('_user_clicked_proceed') === 'true';
		
		console.log('🚨 [NewAuthContext] User interaction check:', {
			userClickedProceed,
			flagValue: sessionStorage.getItem('_user_clicked_proceed'),
			hasAuthRequestData: !!authRequestData,
			timestamp: new Date().toISOString(),
		});
		
		if (!userClickedProceed) {
			console.error('🚨 [NewAuthContext] BLOCKED: proceedWithOAuth called WITHOUT user interaction!');
			console.error('🚨 [NewAuthContext] This should NEVER happen - modal must wait for user click');
			console.error('🚨 [NewAuthContext] Stack trace:', new Error().stack);
			console.error('🚨 [NewAuthContext] Current sessionStorage state:', {
				_user_clicked_proceed: sessionStorage.getItem('_user_clicked_proceed'),
				showAuthModal: 'check App.tsx state',
			});
			// DO NOT proceed - this is an auto-submit attempt
			alert('🚨 SECURITY: Authorization was blocked because it was triggered without user interaction. Please click the "Continue" button in the modal.');
			return;
		}
		
		// Clear the flag after checking
		sessionStorage.removeItem('_user_clicked_proceed');
		
		console.log('🚨 [NewAuthContext] ✅ USER INTERACTION CONFIRMED - proceeding with OAuth');
		
		if (authRequestData) {
			logger.auth('NewAuthContext', 'Proceeding with OAuth redirect - USER CLICKED CONTINUE BUTTON');
			
			// Check flow context for redirectless mode (e.g., Kroger flow)
			const flowContextRaw = sessionStorage.getItem('flowContext');
			let finalAuthUrl = authRequestData.authorizationUrl;
			
			if (flowContextRaw) {
				try {
					const parsed = safeJsonParse(flowContextRaw) as Record<string, unknown>;
					if (parsed?.flow === 'kroger-grocery-store-mfa' || parsed?.flowKey === 'kroger-grocery-store-mfa') {
						const authMode = parsed?.authMode as string | undefined;
						
						if (authMode === 'redirectless') {
							console.log('[NewAuthContext] Kroger redirectless mode detected, modifying authorization URL');
							try {
								const authUrl = new URL(finalAuthUrl);
								authUrl.searchParams.set('response_mode', 'pi.flow');
								// Remove redirect_uri for redirectless mode - per PingOne docs, redirect_uri is NOT required
								// and should be omitted when using response_mode=pi.flow
								authUrl.searchParams.delete('redirect_uri');
								finalAuthUrl = authUrl.toString();
								logger.auth('NewAuthContext', 'Modified authorization URL for redirectless mode', {
									originalUrl: authRequestData.authorizationUrl,
									modifiedUrl: finalAuthUrl,
									note: 'redirect_uri removed per PingOne pi.flow specification',
								});
							} catch (urlError) {
								console.warn('[NewAuthContext] Failed to modify URL for redirectless mode:', urlError);
							}
						}
					}
				} catch (flowParsingError) {
					console.warn('[NewAuthContext] Failed to parse flow context for redirectless mode:', flowParsingError);
				}
			}
			
			console.log('🚨 [NewAuthContext] About to redirect to:', finalAuthUrl);
			window.location.href = finalAuthUrl;
		} else {
			console.error('🚨 [NewAuthContext] proceedWithOAuth called but authRequestData is null!');
		}
	}, [authRequestData]);

	const closeAuthModal = useCallback(() => {
		setShowAuthModal(false);
		setAuthRequestData(null);
	}, [setAuthRequestData, setShowAuthModal]);

	const updateTokens = useCallback(
		(newTokens: OAuthTokens | null) => {
			logger.auth('NewAuthContext', 'Updating tokens', newTokens);
			setState((prev) => ({
				...prev,
				tokens: newTokens,
				isAuthenticated: !!newTokens?.access_token,
				isLoading: false,
			}));
		},
		[setState]
	);

	const saveCredentialsV7 = useCallback(async (credentials: Record<string, unknown>) => {
		try {
			console.log(
				' [NewAuthContext] Saving credentials using V7 standardized system...',
				credentials
			);
			
			// Type assert and validate credentials as StepCredentials
			// StepCredentials requires: clientId, clientSecret, redirectUri
			const stepCredentials = {
				clientId: typeof credentials.clientId === 'string' ? credentials.clientId : '',
				clientSecret: typeof credentials.clientSecret === 'string' ? credentials.clientSecret : '',
				redirectUri: typeof credentials.redirectUri === 'string' ? credentials.redirectUri : '',
				environmentId: typeof credentials.environmentId === 'string' ? credentials.environmentId : undefined,
				issuerUrl: typeof credentials.issuerUrl === 'string' ? credentials.issuerUrl : undefined,
				region: typeof credentials.region === 'string' ? credentials.region : undefined,
				postLogoutRedirectUri: typeof credentials.postLogoutRedirectUri === 'string' ? credentials.postLogoutRedirectUri : undefined,
				scopes: typeof credentials.scopes === 'string' ? credentials.scopes : undefined,
				scope: typeof credentials.scope === 'string' ? credentials.scope : undefined,
				responseType: typeof credentials.responseType === 'string' ? credentials.responseType : undefined,
			} as import('../components/steps/CommonSteps').StepCredentials;
			
			const success = await saveFlowCredentials('dashboard-login', stepCredentials, undefined, undefined, {
				showToast: true,
			});
			if (success) {
				console.log(' [NewAuthContext] V7 credentials saved successfully');
				const newConfig = await loadAuthConfiguration();
				setConfig(newConfig);
			} else {
				console.error(' [NewAuthContext] Failed to save V7 credentials');
			}
			return success;
		} catch (error) {
			console.error(' [NewAuthContext] Error saving V7 credentials:', error);
			return false;
		}
	}, [setConfig]);

	const dismissError = useCallback(() => {
		updateState({ error: null });
	}, [updateState]);

	return {
		login,
		logout,
		handleCallback,
		proceedWithOAuth,
		closeAuthModal,
		updateTokens,
		saveCredentialsV7,
		dismissError,
	};
};

export default useAuthActions;


