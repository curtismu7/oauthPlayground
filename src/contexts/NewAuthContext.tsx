import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import FlowContextUtils from '../services/flowContextUtils';
import {
	loadFlowCredentialsIsolated,
	saveFlowCredentials,
} from '../services/flowCredentialService';
import { pingOneConfigService } from '../services/pingoneConfigService';
import { AuthContextType, AuthState, LoginResult } from '../types/auth';
import type { OAuthTokenResponse, OAuthTokens, UserInfo } from '../types/storage';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { generateCodeChallenge } from '../utils/oauth';
import { getBackendUrl } from '../utils/protocolUtils';
import { safeJsonParse } from '../utils/secureJson';
import { oauthStorage } from '../utils/storage';
import { validateAndParseCallbackUrl } from '../utils/urlValidation';

// Define window interface for PingOne environment variables
interface WindowWithPingOne extends Window {
	__PINGONE_ENVIRONMENT_ID__?: string;
	__PINGONE_API_URL__?: string;
	__PINGONE_CLIENT_ID__?: string;
	__PINGONE_CLIENT_SECRET__?: string;
	__PINGONE_REDIRECT_URI__?: string;
}

// Define the complete config type with all required properties
interface AppConfig {
	disableLogin: boolean;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	userInfoEndpoint: string;
	endSessionEndpoint: string;
	scopes: string[];
	environmentId: string;
	hasConfigError?: boolean; // Flag to indicate configuration error
	[key: string]: unknown; // Allow additional properties
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions
const isTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.access_token) return false;
	const now = Date.now();
	const expiresAt = tokens.expires_at || 0;
	return expiresAt ? now < expiresAt : false;
};

const isRefreshTokenValid = (tokens: OAuthTokens | null): boolean => {
	if (!tokens?.refresh_token) return false;
	const now = Date.now();
	const refreshExpiresAt = tokens.refresh_expires_at || 0;
	return refreshExpiresAt ? now < refreshExpiresAt : false;
};

const getStoredTokens = (): OAuthTokens | null => {
	try {
		const tokens = oauthStorage.getTokens();
		return tokens ? JSON.parse(JSON.stringify(tokens)) : null;
	} catch (error) {
		logger.error('NewAuthContext', 'Error parsing stored tokens', error);
		return null;
	}
};

// OAuth-specific token checker that excludes worker tokens
const getOAuthTokens = (): OAuthTokens | null => {
	try {
		// Only check OAuth/user token storage keys, explicitly exclude worker tokens
		const oauthTokenKeys = [
			'pingone_secure_tokens', // Main secure storage
			'pingone_tokens', // Legacy storage
			'tokens', // Basic storage
			'oauth_tokens', // OAuth specific
			'oidc_tokens', // OIDC specific
			'implicit_tokens', // Implicit flow tokens
			'device_code_tokens', // Device code flow tokens
			'client_credentials_tokens', // Client credentials tokens
			'hybrid_tokens', // Hybrid flow tokens
			'authz_flow_tokens', // Authorization flow tokens
			'oauth2_implicit_tokens', // OAuth 2.0 Implicit tokens
			'oidc_implicit_tokens', // OIDC Implicit tokens
			'oauth2_client_credentials_tokens', // OAuth 2.0 Client Credentials tokens
			'oidc_client_credentials_tokens', // OIDC Client Credentials tokens
			'device_code_oidc_tokens', // Device Code OIDC tokens
			// EXPLICITLY EXCLUDED: 'worker_token_tokens', 'worker_token_v3_tokens'
		];

		// Check each storage key for valid tokens
		for (const key of oauthTokenKeys) {
			try {
				// Check sessionStorage first
				const sessionData = sessionStorage.getItem(key);
				if (sessionData) {
					try {
						const parsedTokens = JSON.parse(sessionData);
						if (parsedTokens?.access_token && isTokenValid(parsedTokens)) {
							logger.info('NewAuthContext', `Found valid OAuth tokens in ${key}`, {
								key,
								hasAccessToken: !!parsedTokens.access_token,
								hasIdToken: !!parsedTokens.id_token,
								tokenType: parsedTokens.token_type,
							});
							return parsedTokens;
						}
					} catch (parseError) {
						logger.warn('NewAuthContext', `Invalid JSON in sessionStorage ${key}, skipping`, {
							key,
							error: parseError instanceof Error ? parseError.message : 'Unknown error',
							dataPreview: `${sessionData.substring(0, 50)}...`,
						});
						// Clear invalid data to prevent future errors
						sessionStorage.removeItem(key);
					}
				}

				// Then check localStorage
				const localData = localStorage.getItem(key);
				if (localData) {
					try {
						const parsedTokens = JSON.parse(localData);
						if (parsedTokens?.access_token && isTokenValid(parsedTokens)) {
							logger.info('NewAuthContext', `Found valid OAuth tokens in localStorage ${key}`, {
								key,
								hasAccessToken: !!parsedTokens.access_token,
								hasIdToken: !!parsedTokens.id_token,
								tokenType: parsedTokens.token_type,
							});
							return parsedTokens;
						}
					} catch (parseError) {
						logger.warn('NewAuthContext', `Invalid JSON in localStorage ${key}, skipping`, {
							key,
							error: parseError instanceof Error ? parseError.message : 'Unknown error',
							dataPreview: `${localData.substring(0, 50)}...`,
						});
						// Clear invalid data to prevent future errors
						localStorage.removeItem(key);
					}
				}
			} catch (storageError) {
				logger.warn('NewAuthContext', `Error checking OAuth token storage key ${key}`, {
					key,
					error: storageError instanceof Error ? storageError.message : 'Unknown error',
				});
			}
		}

		// No valid OAuth tokens found
		logger.info('NewAuthContext', 'No valid OAuth tokens found in storage');
		return null;
	} catch (error) {
		logger.error('NewAuthContext', 'Error loading OAuth tokens from storage', error);
		return null;
	}
};

const getStoredUser = (): UserInfo | null => {
	try {
		const user = oauthStorage.getUserInfo();
		return user ? JSON.parse(JSON.stringify(user)) : null;
	} catch (error) {
		logger.error('NewAuthContext', 'Error parsing stored user', error);
		return null;
	}
};

// Loading state to prevent multiple simultaneous configuration loads
let isLoadingConfiguration = false;

// Function to load configuration from environment variables or localStorage
async function loadConfiguration(): Promise<AppConfig> {
	// Prevent multiple simultaneous loads
	if (isLoadingConfiguration) {
		return new Promise((resolve) => {
			// Wait for current load to complete
			const checkInterval = setInterval(() => {
				if (!isLoadingConfiguration) {
					clearInterval(checkInterval);
					resolve(loadConfiguration());
				}
			}, 100);
		});
	}

	isLoadingConfiguration = true;
	try {
		// Try to get from environment variables first
		const envConfig = {
			disableLogin: false,
			clientId: (window as WindowWithPingOne).__PINGONE_CLIENT_ID__ || '',
			clientSecret: (window as WindowWithPingOne).__PINGONE_CLIENT_SECRET__ || '',
			redirectUri:
				(window as WindowWithPingOne).__PINGONE_REDIRECT_URI__ ||
				`${window.location.origin}/authz-callback`,
			authorizationEndpoint: '',
			tokenEndpoint: '',
			userInfoEndpoint: '',
			endSessionEndpoint: '',
			scopes: ['openid', 'profile', 'email'],
			environmentId: (window as WindowWithPingOne).__PINGONE_ENVIRONMENT_ID__ || '',
		};

		// V7 Standardized Credential Loading

		// Try to load from V7 FlowCredentialService first (most recent)
		try {
			const v7Credentials = await loadFlowCredentialsIsolated({
				flowKey: 'dashboard-login',
				defaultCredentials: {
					environmentId: '',
					clientId: '',
					clientSecret: '',
					redirectUri: `${window.location.origin}/dashboard-callback`,
					scope: 'openid profile email',
					scopes: 'openid profile email',
					loginHint: '',
					postLogoutRedirectUri: '',
					responseType: 'code',
					grantType: 'authorization_code',
					issuerUrl: '',
					authorizationEndpoint: '',
					tokenEndpoint: '',
					userInfoEndpoint: '',
					clientAuthMethod: 'client_secret_post',
					tokenEndpointAuthMethod: 'client_secret_post',
				},
				useSharedFallback: false,
			});

			if (v7Credentials.credentials?.clientId && v7Credentials.credentials?.environmentId) {
				return v7Credentials.credentials;
			}
		} catch (_v7Error) {
			// V7 FlowCredentialService not available, continue to fallback
		}

		// Fallback to legacy credential manager
		const permanentCredentials = credentialManager.getAllCredentials();

		if (permanentCredentials?.clientId && permanentCredentials?.environmentId) {
			return permanentCredentials;
		}

		// Final fallback to V5 Config Service (used by Login page)
		try {
			const v5Config = pingOneConfigService.getConfig();

			if (v5Config?.clientId && v5Config?.environmentId) {
				return v5Config;
			}
		} catch (_v5Error) {
			// V5 Config Service not available, continue to fallback
		}

		// Otherwise, fall back to environment variables
		if (envConfig.clientId && envConfig.environmentId) {
			return envConfig;
		}

		// Use config credentials if available, otherwise use authz credentials
		let allCredentials = configCredentials;
		if (!allCredentials.environmentId && !allCredentials.clientId) {
			allCredentials = authzCredentials;
		} else {
			console.log(' [NewAuthContext] Using config credentials');
		}
		console.log(' [NewAuthContext] Final credential manager result:', allCredentials);

		if (allCredentials.environmentId && allCredentials.clientId) {
			// Construct PingOne endpoints from environment ID if not provided
			const baseUrl = `https://auth.pingone.com/${allCredentials.environmentId}/as`;

			const configFromCredentials = {
				disableLogin: false,
				clientId: allCredentials.clientId,
				clientSecret: allCredentials.clientSecret || '',
				redirectUri: allCredentials.redirectUri || `${window.location.origin}/authz-callback`,
				authorizationEndpoint: allCredentials.authEndpoint || `${baseUrl}/authorize`,
				tokenEndpoint: allCredentials.tokenEndpoint || `${baseUrl}/token`,
				userInfoEndpoint: allCredentials.userInfoEndpoint || `${baseUrl}/userinfo`,
				endSessionEndpoint: allCredentials.endSessionEndpoint || `${baseUrl}/signoff`,
				scopes: allCredentials.scopes || ['openid', 'profile', 'email'],
				environmentId: allCredentials.environmentId,
				hasConfigError: false,
			};
			console.log(
				' [NewAuthContext] Using credentials from credential manager:',
				configFromCredentials
			);
			return configFromCredentials;
		}

		// Return default config
		return {
			disableLogin: false,
			clientId: '',
			clientSecret: '',
			redirectUri: `${window.location.origin}/authz-callback`,
			authorizationEndpoint: '',
			tokenEndpoint: '',
			userInfoEndpoint: '',
			endSessionEndpoint: '',
			scopes: ['openid', 'profile', 'email'],
			environmentId: '',
		};
	} catch (error) {
		logger.error('NewAuthContext', 'Error loading configuration', error);
		return {
			disableLogin: false,
			clientId: '',
			clientSecret: '',
			redirectUri: `${window.location.origin}/authz-callback`,
			authorizationEndpoint: '',
			tokenEndpoint: '',
			userInfoEndpoint: '',
			endSessionEndpoint: '',
			scopes: ['openid', 'profile', 'email'],
			environmentId: '',
			hasConfigError: true,
		};
	} finally {
		isLoadingConfiguration = false;
	}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Auth state
	const [state, setState] = useState<AuthState>({
		isAuthenticated: false,
		user: null,
		tokens: null,
		isLoading: true,
		error: null,
	});

	// Modal state
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [authRequestData, setAuthRequestData] = useState<{
		authorizationUrl: string;
		clientId: string;
		redirectUri: string;
		scope: string;
		state: string;
		nonce: string;
	} | null>(null);

	// Configuration state that updates when localStorage changes
	const [config, setConfig] = useState<AppConfig>(() => {
		// Initialize config on first render with error handling
		try {
			// For now, return default config - async loading will happen in useEffect
			return {
				disableLogin: false,
				clientId: '',
				clientSecret: '',
				redirectUri: `${window.location.origin}/authz-callback`,
				authorizationEndpoint: '',
				tokenEndpoint: '',
				userInfoEndpoint: '',
				endSessionEndpoint: '',
				scopes: ['openid', 'profile', 'email'],
				environmentId: '',
				hasConfigError: false,
			};
		} catch (error) {
			logger.error('NewAuthContext', 'Error initializing config', error);
			return {
				disableLogin: false,
				clientId: '',
				clientSecret: '',
				redirectUri: `${window.location.origin}/authz-callback`,
				authorizationEndpoint: '',
				tokenEndpoint: '',
				userInfoEndpoint: '',
				endSessionEndpoint: '',
				scopes: ['openid', 'profile', 'email'],
				environmentId: '',
				hasConfigError: true,
			};
		}
	});

	// Load configuration asynchronously on mount
	useEffect(() => {
		const loadConfig = async () => {
			try {
				const loadedConfig = await loadConfiguration();
				setConfig(loadedConfig);
			} catch (error) {
				logger.error('NewAuthContext', 'Error loading configuration', error);
				setConfig((prev) => ({ ...prev, hasConfigError: true }));
			}
		};

		loadConfig();
	}, []);

	// Update state helper
	const updateState = useCallback((updates: Partial<AuthState>) => {
		setState((prev) => ({
			...prev,
			...updates,
		}));
	}, []);

	// Load tokens from storage on component mount and check configuration
	useEffect(() => {
		const loadTokensFromStorage = () => {
			try {
				const storedTokens = getOAuthTokens(); // Use OAuth-specific token checker
				const storedUser = getStoredUser();

				if (storedTokens && isTokenValid(storedTokens)) {
					logger.auth('NewAuthContext', 'Valid tokens found in storage', storedTokens);
					updateState({
						isAuthenticated: true,
						tokens: storedTokens,
						user: storedUser,
						isLoading: false,
						error: null,
					});
				} else if (storedTokens && isRefreshTokenValid(storedTokens)) {
					logger.auth(
						'NewAuthContext',
						'Access token expired, but refresh token valid',
						storedTokens
					);
					updateState({
						isAuthenticated: false,
						tokens: storedTokens,
						user: storedUser,
						isLoading: false,
						error: 'Access token expired. Please refresh.',
					});
				} else {
					updateState({
						isAuthenticated: false,
						tokens: null,
						user: null,
						isLoading: false,
						error: null,
					});
				}
			} catch (error) {
				logger.error('NewAuthContext', 'Error loading tokens from storage', error);
				updateState({
					isAuthenticated: false,
					tokens: null,
					user: null,
					isLoading: false,
					error: 'Failed to load authentication state',
				});
			}
		};

		loadTokensFromStorage();
	}, [updateState]);

	// Listen for configuration changes
	useEffect(() => {
		let isHandlingChange = false;

		const handleConfigChange = async () => {
			// Prevent multiple simultaneous config changes
			if (isHandlingChange) return;
			isHandlingChange = true;

			try {
				const newConfig = await loadConfiguration();
				setConfig((prevConfig) => {
					// Only update if config actually changed to prevent unnecessary re-renders
					const changed = JSON.stringify(prevConfig) !== JSON.stringify(newConfig);
					if (changed) {
						logger.config('NewAuthContext', 'Configuration updated', newConfig);
						return newConfig;
					}
					return prevConfig;
				});
			} catch (error) {
				logger.error('NewAuthContext', 'Error updating configuration', error);
			} finally {
				isHandlingChange = false;
			}
		};

		// Listen for custom config change events
		window.addEventListener('pingone-config-changed', handleConfigChange);
		window.addEventListener('permanent-credentials-changed', handleConfigChange);
		window.addEventListener('config-credentials-changed', handleConfigChange);

		// Also listen for storage changes
		window.addEventListener('storage', handleConfigChange);

		return () => {
			window.removeEventListener('pingone-config-changed', handleConfigChange);
			window.removeEventListener('permanent-credentials-changed', handleConfigChange);
			window.removeEventListener('config-credentials-changed', handleConfigChange);
			window.removeEventListener('storage', handleConfigChange);
		};
	}, []);

	// Function to refresh configuration
	const refreshConfig = useCallback(async () => {
		logger.config('NewAuthContext', 'Refreshing configuration...');
		try {
			const newConfig = await loadConfiguration();
			setConfig(newConfig);
			logger.config('NewAuthContext', 'Configuration refreshed successfully', newConfig);
		} catch (error) {
			logger.error('NewAuthContext', 'Error refreshing configuration', error);
			setConfig((prev) => ({
				...prev,
				hasConfigError: true,
			}));
		}
	}, []);

	// Listen for localStorage changes and force config refresh
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'pingone_config') {
				logger.config('NewAuthContext', 'PingOne config changed in localStorage, refreshing...');
				refreshConfig();
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, [refreshConfig]);

	// Initialize auth state
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				const storedTokens = getStoredTokens();
				const storedUser = getStoredUser();

				if (storedTokens && isTokenValid(storedTokens)) {
					updateState({
						isAuthenticated: true,
						tokens: storedTokens,
						user: storedUser,
						isLoading: false,
						error: null,
					});
				} else {
					updateState({
						isAuthenticated: false,
						tokens: storedTokens,
						user: storedUser,
						isLoading: false,
						error: null,
					});
				}
			} catch (error) {
				logger.error('NewAuthContext', 'Error initializing auth state', error);
				updateState({
					isAuthenticated: false,
					tokens: null,
					user: null,
					isLoading: false,
					error: 'Failed to initialize authentication',
				});
			}
		};

		initializeAuth();
	}, [updateState]);

	// Listen for configuration changes from the Configuration page
	useEffect(() => {
		const handleConfigChange = async () => {
			try {
				const newConfig = await loadConfiguration();
				setConfig(newConfig);
				logger.info('NewAuthContext', 'Configuration updated from localStorage');
			} catch (error) {
				logger.error('NewAuthContext', 'Error reloading configuration', error);
			}
		};

		// Listen for the custom event dispatched when config is saved
		window.addEventListener('pingone-config-changed', handleConfigChange);

		return () => {
			window.removeEventListener('pingone-config-changed', handleConfigChange);
		};
	}, []);

	// Login function
	const login = useCallback(
		async (
			redirectAfterLogin = '/',
			callbackType: 'dashboard' | 'oauth' = 'oauth'
		): Promise<LoginResult> => {
			console.log(' [NewAuthContext] Starting login process...', {
				redirectAfterLogin,
				callbackType,
				hasConfig: !!config,
				clientId: config?.clientId,
				environmentId: config?.environmentId,
				authorizationEndpoint: config?.authorizationEndpoint,
			});

			try {
				if (!config?.clientId || !config?.environmentId) {
					const errorMessage =
						'Configuration required. Please configure your PingOne settings first.';
					console.error(' [NewAuthContext] Missing configuration:', {
						hasClientId: !!config?.clientId,
						hasEnvironmentId: !!config?.environmentId,
						config,
					});
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				console.log(' [NewAuthContext] Configuration validated');

				// Generate state and nonce for security
				const state = Math.random().toString(36).substring(2, 15);
				const nonce = Math.random().toString(36).substring(2, 15);

				console.log(' [NewAuthContext] Generated security parameters:', {
					state: `${state.substring(0, 8)}...`,
					nonce: `${nonce.substring(0, 8)}...`,
				});

				// Generate PKCE codes for enhanced security
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

				// Store state, nonce, and PKCE codes for validation
				sessionStorage.setItem('oauth_state', state);
				sessionStorage.setItem('oauth_nonce', nonce);
				sessionStorage.setItem('code_verifier', codeVerifier);
				sessionStorage.setItem('oauth_redirect_after_login', redirectAfterLogin);

				console.log(' [NewAuthContext] Stored in sessionStorage:', {
					oauth_state: `${state.substring(0, 8)}...`,
					oauth_nonce: `${nonce.substring(0, 8)}...`,
					code_verifier: `${codeVerifier.substring(0, 20)}...`,
					oauth_redirect_after_login: redirectAfterLogin,
				});

				// Use configured redirect URI from credentials, fallback to callback type logic
				// Per OIDC Spec 3.1.2.1: redirect_uri in token request MUST match authorization request
				const configuredRedirectUri = config?.redirectUri;
				console.log('🔍 [NewAuthContext] REDIRECT URI SELECTION DEBUG:', {
					configRedirectUri: config?.redirectUri,
					hasConfigRedirectUri: !!config?.redirectUri,
					callbackType,
					windowOrigin: window.location.origin,
					configObject: config,
					configKeys: config ? Object.keys(config) : [],
				});

				// Force dashboard callback when explicitly requested to avoid stale config bleed-through
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
					configRedirectUri: config.redirectUri,
					finalRedirectUri: redirectUri,
					configObject: {
						hasRedirectUri: !!config.redirectUri,
						redirectUriValue: config.redirectUri,
						configKeys: config ? Object.keys(config) : [],
						fullConfig: config,
					},
				});

				// Check if PingOne config is available
				// Handle both config structures: config.pingone.* and config.*
				let authEndpoint =
					config?.pingone?.authEndpoint || config?.authorizationEndpoint || config?.authEndpoint;
				const clientId = config?.pingone?.clientId || config?.clientId;

				// If authEndpoint is missing but we have environmentId, construct it
				if (!authEndpoint && config?.environmentId) {
					authEndpoint = `https://auth.pingone.com/${config.environmentId}/as/authorize`;
					console.log(
						' [NewAuthContext] Constructed authEndpoint from environmentId:',
						authEndpoint
					);
				}

				// Debug logging to help identify configuration issues
				console.log(' [NewAuthContext] Configuration debug:', {
					hasConfig: !!config,
					configKeys: config ? Object.keys(config) : [],
					authEndpoint,
					clientId,
					configStructure: {
						pingone: config?.pingone,
						direct: {
							authorizationEndpoint: config?.authorizationEndpoint,
							authEndpoint: config?.authEndpoint,
							clientId: config?.clientId,
							environmentId: config?.environmentId,
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

				// Build authorization URL
				const authUrl = new URL(authEndpoint);
				authUrl.searchParams.set('response_type', 'code');
				authUrl.searchParams.set('client_id', clientId);
				// Enforce correct redirect_uri for dashboard flows
				const enforcedRedirectUri =
					callbackType === 'dashboard'
						? `${window.location.origin}/dashboard-callback`
						: redirectUri;
				authUrl.searchParams.set('redirect_uri', enforcedRedirectUri);

				// Use configured scopes or fallback to default
				const scopes = config?.scopes || ['openid', 'profile', 'email'];
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
						scopeSource: config?.scopes ? 'configured' : 'default',
						scopeExact: scopeString,
						clientIdSource: config?.clientId
							? 'direct'
							: config?.pingone?.clientId
								? 'pingone'
								: 'unknown',
						authEndpointSource: config?.authEndpoint
							? 'authEndpoint'
							: config?.authorizationEndpoint
								? 'authorizationEndpoint'
								: config?.pingone?.authEndpoint
									? 'pingone.authEndpoint'
									: 'constructed',
					},
				});

				logger.auth('NewAuthContext', 'Prepared authorization URL for modal display', {
					authUrl: authUrl.toString(),
				});

				// CRITICAL DEBUG: Log the exact URL being sent to PingOne
				console.log('🔍 [NewAuthContext] EXACT URL BEING SENT TO PINGONE:', authUrl.toString());
				console.log('🔍 [NewAuthContext] URL BREAKDOWN:', {
					base: authEndpoint,
					queryParams: Object.fromEntries(authUrl.searchParams),
					redirectUri: authUrl.searchParams.get('redirect_uri'),
					clientId: authUrl.searchParams.get('client_id'),
					scope: authUrl.searchParams.get('scope'),
					responseType: authUrl.searchParams.get('response_type'),
				});

				// CRITICAL DEBUG: Log redirect URI details
				console.log('🔍 [NewAuthContext] REDIRECT URI BEING SENT:', {
					redirectUri: authUrl.searchParams.get('redirect_uri'),
					clientId: authUrl.searchParams.get('client_id'),
					fullUrl: authUrl.toString(),
					note: 'Check if this redirect URI matches your PingOne application configuration',
				});

				console.log(' [NewAuthContext] Authorization URL prepared, returning for modal display...');

				// Return the URL for modal display instead of direct redirect
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
		[config, updateState]
	);

	// Logout function
	const logout = useCallback(() => {
		try {
			logger.auth('NewAuthContext', 'Logging out user');

			// Clear tokens and user info from storage
			oauthStorage.clearTokens();
			oauthStorage.clearUserInfo();

			// Clear session storage
			sessionStorage.removeItem('oauth_state');
			sessionStorage.removeItem('oauth_nonce');
			sessionStorage.removeItem('oauth_redirect_after_login');

			// Clear flow context using FlowContextService
			try {
				FlowContextUtils.emergencyCleanup();
				console.log(' [NewAuthContext] Flow context cleaned up during logout');
			} catch (flowCleanupError) {
				console.warn(
					' [NewAuthContext] Failed to cleanup flow context during logout:',
					flowCleanupError
				);
			}

			// Update state
			updateState({
				isAuthenticated: false,
				user: null,
				tokens: null,
				isLoading: false,
				error: null,
			});

			logger.auth('NewAuthContext', 'User logged out successfully');
		} catch (error) {
			logger.error('NewAuthContext', 'Error during logout', error);
			updateState({ error: 'Logout failed', isLoading: false });
		}
	}, [updateState]);

	// Handle OAuth callback
	const handleCallback = useCallback(
		async (url: string): Promise<LoginResult> => {
			try {
				// Validate and parse the callback URL
				const { params, code, state, error, errorDescription } = validateAndParseCallbackUrl(
					url,
					'NewAuthContext'
				);

				// Check for OAuth error
				if (error) {
					const errorMessage = errorDescription || error;
					logger.error('NewAuthContext', 'OAuth error in callback', { error, errorDescription });
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				// Check for V6 flow BEFORE state validation - V6 flows handle their own validation
				const flowContextRaw = sessionStorage.getItem('flowContext');
				console.log('🔍 [NewAuthContext] Checking for V6 flow, flowContextRaw:', flowContextRaw);
				if (flowContextRaw) {
					try {
						const parsed = safeJsonParse(flowContextRaw);
						console.log('🔍 [NewAuthContext] Parsed flow context:', parsed);
						const isV6Flow =
							parsed?.flow === 'oidc-authorization-code-v6' ||
							parsed?.flow === 'oauth-authorization-code-v6';

						const isV7Flow =
							parsed?.flow === 'oidc-authorization-code-v7' ||
							parsed?.flow === 'oauth-authorization-code-v7' ||
							parsed?.flow === 'oidc-authorization-code-v7-2' ||
							parsed?.flow === 'oauth-authorization-code-v7-2';

						console.log(
							'🔍 [NewAuthContext] Is V6 flow?',
							isV6Flow,
							'Is V7 flow?',
							isV7Flow,
							'Flow:',
							parsed?.flow
						);

						if (isV6Flow || isV7Flow) {
							// For V6/V7 flows, skip state validation and redirect immediately
							console.log(
								' [NewAuthContext] V6/V7 FLOW DETECTED EARLY - Skipping state validation and redirecting to flow page'
							);

							// Store auth code and state for the flow page
							// Use flow-specific key (oauth_auth_code or oidc_auth_code)
							if (code) {
								const isOIDCFlow = parsed?.flow?.includes('oidc');
								const authCodeKey = isOIDCFlow ? 'oidc_auth_code' : 'oauth_auth_code';
								sessionStorage.setItem(authCodeKey, code);
								console.log(`🔑 [NewAuthContext] Stored auth code with key: ${authCodeKey}`);
							}
							if (state) {
								sessionStorage.setItem('oauth_state', state);
							}

							// Determine correct return path based on flow version
							let returnPath: string;
							if (isV7Flow) {
								const isV7_2 =
									parsed?.flow === 'oauth-authorization-code-v7-2' ||
									parsed?.flow === 'oidc-authorization-code-v7-2';
								returnPath =
									parsed?.returnPath ||
									(isV7_2
										? '/flows/oauth-authorization-code-v7-2?step=4'
										: '/flows/oauth-authorization-code-v7?step=4');
							} else {
								returnPath = parsed?.returnPath || '/flows/oidc-authorization-code-v6';
							}
							console.log(
								'🚀 [NewAuthContext] V6/V7 FLOW REDIRECT - About to redirect to:',
								returnPath
							);
							logger.info('NewAuthContext', 'V6 flow detected - redirecting to flow page', {
								flow: parsed?.flow,
								returnPath,
							});

							return { success: true, redirectUrl: returnPath };
						}
					} catch (err) {
						console.warn(' [NewAuthContext] Failed to parse flow context for V6 detection:', err);
					}
				}

				// Validate state parameter (more lenient for development)
				const storedState = sessionStorage.getItem('oauth_state');
				console.log(' [NewAuthContext] State validation:', {
					received: state,
					stored: storedState,
					match: state === storedState,
					bothExist: !!(state && storedState),
				});

				// Only validate state if both exist - be more lenient for development
				if (state && storedState && state !== storedState) {
					const errorMessage = 'Invalid state parameter. Possible CSRF attack.';
					logger.error('NewAuthContext', 'State validation failed', {
						received: state,
						expected: storedState,
					});
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				// If we have a state but no stored state, log a warning but don't fail
				if (state && !storedState) {
					logger.warn(
						'NewAuthContext',
						'State received but no stored state found - this may happen if sessionStorage was cleared',
						{ received: state }
					);
				}

				// Log state validation for debugging
				if (state && storedState) {
					logger.auth('NewAuthContext', 'State validation successful', {
						received: state,
						expected: storedState,
					});
				} else if (state && !storedState) {
					logger.warn(
						'NewAuthContext',
						'State received but no stored state found (sessionStorage may have been cleared)',
						{ received: state }
					);
				} else if (!state && storedState) {
					logger.warn('NewAuthContext', 'No state in callback but stored state exists', {
						expected: storedState,
					});
				}

				if (!code) {
					const errorMessage = 'Authorization code not found in callback URL';
					logger.error('NewAuthContext', 'No authorization code in callback', {
						url,
						params: Object.fromEntries(params.entries()),
						hasCode: !!code,
						hasState: !!state,
						hasError: !!error,
					});
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				// EARLY GATE: If this callback is for Enhanced Authorization Code Flow V2,
				// do not perform any credential validation or token exchange here.
				try {
					const flowContextRawEarly = sessionStorage.getItem('flowContext');
					if (flowContextRawEarly) {
						const parsedEarly = safeJsonParse(flowContextRawEarly);
						const isEnhancedV2Early = parsedEarly?.flow === 'enhanced-authorization-code-v2';
						if (isEnhancedV2Early) {
							// Persist auth code and state for the flow page to handle later
							// Note: Enhanced V2 is OAuth-based, so use oauth_auth_code
							sessionStorage.setItem('oauth_auth_code', code);
							if (state) sessionStorage.setItem('oauth_state', state);
							const returnPathEarly =
								parsedEarly?.returnPath || '/flows/enhanced-authorization-code-v2?step=4';
							logger.auth(
								'NewAuthContext',
								'Early deferral: Enhanced Auth Code Flow V2 detected; skipping token exchange in context',
								{ returnPath: returnPathEarly }
							);
							return { success: true, redirectUrl: returnPathEarly };
						}
					}
				} catch (e) {
					logger.warn(
						'NewAuthContext',
						'Failed to parse flowContext during early gating',
						e as unknown as string
					);
				}

				// Determine the redirect URI used in the authorization request
				// First check if we have a stored redirect URI from the flow context
				let redirectUri = '';
				const flowContextKey = 'flowContext';
				const flowContext = sessionStorage.getItem(flowContextKey);

				if (flowContext) {
					try {
						const parsedContext = safeJsonParse(flowContext);
						console.log(' [NewAuthContext] Parsed flow context:', parsedContext);
						if (parsedContext.redirectUri) {
							redirectUri = parsedContext.redirectUri;
							console.log(' [NewAuthContext] Using redirect URI from flow context:', redirectUri);
						} else {
							console.log(' [NewAuthContext] No redirectUri in flow context');
						}
					} catch (error) {
						console.warn('Failed to parse flow context for redirect URI:', error);
					}
				} else {
					console.log(
						' [NewAuthContext] NO FLOW CONTEXT FOUND - This means V3 redirect will go to dashboard!'
					);
					console.log(
						' [NewAuthContext] This is the bug - V3 should have set flowContext in sessionStorage'
					);
				}

				// Fallback to determining by callback URL if no flow context
				if (!redirectUri) {
					const isDashboardCallback = url.includes('/dashboard-callback');
					redirectUri = isDashboardCallback
						? `${window.location.origin}/dashboard-callback`
						: config?.redirectUri || '';
					console.log(' [NewAuthContext] Using fallback redirect URI:', redirectUri);
				}

				// Get code_verifier from sessionStorage for PKCE
				// Retrieve stored PKCE verifier - OIDC Spec Compliance
				// Per RFC 7636 (PKCE): code_verifier MUST be provided in token exchange
				// Retrieve code_verifier from sessionStorage for PKCE
				// Check multiple possible storage keys for code_verifier
				const possibleKeys = [
					'code_verifier',
					'oauth_code_verifier',
					'authz_v3_code_verifier',
					'oauth2_v3_code_verifier',
					'oidc_v3_code_verifier',
				];

				let codeVerifier = '';
				for (const key of possibleKeys) {
					const value = sessionStorage.getItem(key);
					if (value?.trim()) {
						codeVerifier = value.trim();
						console.log(` [NewAuthContext] Found code_verifier in sessionStorage key: ${key}`);
						break;
					}
				}

				// If no code_verifier found, generate one as fallback
				if (!codeVerifier) {
					console.log(' [NewAuthContext] No code_verifier found, generating fallback...');
					try {
						// Import PKCE utilities dynamically to avoid circular dependency
						const { generateCodeVerifier } = await import('../utils/oauth');
						codeVerifier = generateCodeVerifier();
						sessionStorage.setItem('code_verifier', codeVerifier);
						console.log(
							' [NewAuthContext] Generated fallback code_verifier and stored in sessionStorage'
						);
					} catch (error) {
						console.error(' [NewAuthContext] Failed to generate fallback code_verifier:', error);
					}
				}

				console.log(' [NewAuthContext] Retrieved code_verifier from sessionStorage:', {
					hasCodeVerifier: !!codeVerifier,
					codeVerifierLength: codeVerifier?.length || 0,
					codeVerifierPrefix: codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'MISSING',
					checkedKeys: possibleKeys,
				});

				// Debug: Log all sessionStorage contents
				console.log(' [NewAuthContext] All sessionStorage contents:', {
					keys: Object.keys(sessionStorage),
					values: Object.keys(sessionStorage).reduce(
						(acc, key) => {
							acc[key] = `${sessionStorage.getItem(key)?.substring(0, 20)}...`;
							return acc;
						},
						{} as Record<string, string>
					),
				});

				// Try to get credentials from flow context first (most reliable for redirected flows)
				let clientId = '';
				let clientSecret = '';
				let environmentId = '';

				// CRITICAL: Extract credentials from flow context FIRST (this is set when starting auth flow)
				if (flowContext) {
					try {
						const parsedContext = safeJsonParse(flowContext);
						if (parsedContext) {
							clientId = parsedContext.clientId || parsedContext.client_id || '';
							clientSecret = parsedContext.clientSecret || parsedContext.client_secret || '';
							environmentId = parsedContext.environmentId || parsedContext.environment_id || '';
							console.log(' [NewAuthContext] Extracted credentials from flow context:', {
								hasClientId: !!clientId,
								hasClientSecret: !!clientSecret,
								hasEnvironmentId: !!environmentId,
							});
						}
					} catch (error) {
						console.warn(' [NewAuthContext] Failed to parse flow context for credentials:', error);
					}
				}

				// Fallback to config if flow context didn't have credentials
				if (!clientId || !environmentId) {
					clientId = clientId || config?.clientId || '';
					clientSecret = clientSecret || config?.clientSecret || '';
					environmentId = environmentId || config?.environmentId || '';
					console.log(' [NewAuthContext] Using config credentials as fallback:', {
						hasClientId: !!clientId,
						hasEnvironmentId: !!environmentId,
					});
				}

				// Final fallback to credential manager if still missing
				if (!clientId || !environmentId) {
					console.log(' [NewAuthContext] Config not loaded, trying credential manager fallback...');
					try {
						// Import credential manager dynamically to avoid circular dependency
						const { credentialManager } = await import('../utils/credentialManager');
						// Prefer Authorization Code flow credentials; fall back to dashboard/config only if missing
						let credentials = credentialManager.loadAuthzFlowCredentials();
						if (!credentials.environmentId && !credentials.clientId) {
							credentials = credentialManager.loadConfigCredentials();
						}

						clientId = clientId || credentials.clientId || '';
						clientSecret = clientSecret || credentials.clientSecret || '';
						environmentId = environmentId || credentials.environmentId || '';

						console.log(' [NewAuthContext] Fallback credentials loaded (preferring AuthZ):', {
							hasClientId: !!clientId,
							hasClientSecret: !!clientSecret,
							hasEnvironmentId: !!environmentId,
						});
					} catch (error) {
						console.error(' [NewAuthContext] Failed to load fallback credentials:', error);
					}
				}

				// CRITICAL VALIDATION - Ensure we have valid credentials
				if (!clientId || clientId.trim() === '') {
					console.error(' [NewAuthContext] CRITICAL: clientId is empty!', {
						clientId,
						environmentId,
						redirectUri,
						hasFlowContext: !!flowContext,
						hasConfig: !!config,
						configClientId: config?.clientId,
					});

					// Provide more helpful error message with troubleshooting steps
					const errorMessage =
						'Client ID is required for token exchange. ' +
						'This usually happens when:\n' +
						'1. You accessed the authorization URL directly (not through the app flow)\n' +
						'2. Your browser session was cleared between authorization and callback\n' +
						'3. Credentials were not properly configured\n\n' +
						'Please restart the flow through the application, or configure your OAuth credentials in the Configuration page.';
					throw new Error(errorMessage);
				}

				if (!environmentId || environmentId.trim() === '') {
					console.error(' [NewAuthContext] CRITICAL: environmentId is empty!', {
						clientId,
						environmentId,
						redirectUri,
					});
					throw new Error(
						'Environment ID is required for token exchange. Please configure your OAuth credentials first.'
					);
				}

				if (!redirectUri || redirectUri.trim() === '') {
					console.error(' [NewAuthContext] CRITICAL: redirectUri is empty!', {
						clientId,
						environmentId,
						redirectUri,
					});
					throw new Error(
						'Redirect URI is required for token exchange. Please configure your OAuth credentials first.'
					);
				}

				// If this callback belongs to Enhanced Authorization Code Flow V2 or V3,
				// do NOT auto-exchange here. Defer token exchange to the flow page to avoid double-use of the code.
				console.log(' [NewAuthContext] FULL REDIRECT CALLBACK DEBUG - START');
				console.log(
					' [NewAuthContext] Checking for Enhanced flow context to defer token exchange...'
				);
				console.log(' [NewAuthContext] Current URL:', url);
				console.log(
					' [NewAuthContext] URL contains authz-callback:',
					url.includes('authz-callback')
				);
				console.log(
					' [NewAuthContext] All sessionStorage contents:',
					Object.fromEntries(
						Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)])
					)
				);
				console.log(' [NewAuthContext] Looking specifically for flowContext key...');

				try {
					const flowContextRaw = sessionStorage.getItem('flowContext');
					console.log(' [NewAuthContext] Flow context raw from sessionStorage:', flowContextRaw);

					// FALLBACK: Check active_oauth_flow if flowContext is not set (V6 flows use this)
					const activeOAuthFlow = sessionStorage.getItem('active_oauth_flow');
					console.log(' [NewAuthContext] Active OAuth flow:', activeOAuthFlow);

					if (flowContextRaw) {
						const parsed = safeJsonParse(flowContextRaw);
						console.log(' [NewAuthContext] Parsed flow context:', parsed);

						const isEnhancedV2 = parsed?.flow === 'enhanced-authorization-code-v2';
						const isEnhancedV3 =
							parsed?.flow === 'enhanced-authorization-code-v3' ||
							parsed?.flow === 'oauth-authorization-code-v3' ||
							parsed?.flow === 'oidc-authorization-code-v3' ||
							parsed?.flow === 'authorization-code-v5' ||
							parsed?.flow === 'oidc-authorization-code-v5' ||
							parsed?.flow === 'oauth-authorization-code-v5';
						const isV6Flow =
							parsed?.flow === 'oidc-authorization-code-v6' ||
							parsed?.flow === 'oauth-authorization-code-v6';

						const isV7Flow =
							parsed?.flow === 'oidc-authorization-code-v7' ||
							parsed?.flow === 'oauth-authorization-code-v7' ||
							parsed?.flow === 'oidc-authorization-code-v7-2' ||
							parsed?.flow === 'oauth-authorization-code-v7-2';

						console.log(' [NewAuthContext] Flow type detection:', {
							flowType: parsed?.flow,
							isEnhancedV2,
							isEnhancedV3,
							isV6Flow,
							isV7Flow,
							hasReturnPath: !!parsed?.returnPath,
							parsedReturnPath: parsed?.returnPath,
						});

						console.log(
							' [NewAuthContext] ENHANCED/V6/V7 FLOW DETECTED?',
							isEnhancedV2 || isEnhancedV3 || isV6Flow || isV7Flow
						);

						if (isEnhancedV2 || isEnhancedV3 || isV6Flow || isV7Flow) {
							// Persist auth code and state for the flow page
							// Use flow-specific key (oauth_auth_code or oidc_auth_code)
							if (code) {
								const isOIDCFlow = parsed?.flow === 'oidc-authorization-code-v6';
								const authCodeKey = isOIDCFlow ? 'oidc_auth_code' : 'oauth_auth_code';
								sessionStorage.setItem(authCodeKey, code);
								console.log(
									`🔑 [NewAuthContext] Stored auth code with key: ${authCodeKey} for flow: ${parsed?.flow}`
								);
							}
							if (state) {
								sessionStorage.setItem('oauth_state', state);
							}

							// OIDC Compliance: Use the redirect URI from flow context if available
							if (parsed?.redirectUri) {
								console.log(
									' [NewAuthContext] Using redirect URI from flow context for OIDC compliance:',
									parsed.redirectUri
								);
								// Override the redirectUri with the one from flow context
								redirectUri = parsed.redirectUri;
							}

							// Determine correct return path based on flow version
							let returnPath: string;
							if (isV7Flow) {
								// For V7 flows, redirect directly to the flow page (they handle auth code themselves)
								console.log(
									' [NewAuthContext] V7 FLOW DETECTED - Redirecting to flow page, it will handle the auth code'
								);
								logger.info('NewAuthContext', 'V7 flow detected - redirecting to flow page', {
									flow: parsed?.flow,
									returnPath: parsed?.returnPath,
								});
								// Determine if this is V7.2 or V7
								const isV7_2 =
									parsed?.flow === 'oauth-authorization-code-v7-2' ||
									parsed?.flow === 'oidc-authorization-code-v7-2';
								if (isV7_2) {
									returnPath = parsed?.returnPath || '/flows/oauth-authorization-code-v7-2?step=4';
								} else {
									returnPath = parsed?.returnPath || '/flows/oauth-authorization-code-v7?step=4';
								}
							} else if (isV6Flow) {
								// For V6 flows, redirect directly to the flow page (they handle auth code themselves)
								console.log(
									' [NewAuthContext] V6 FLOW DETECTED - Redirecting to flow page, it will handle the auth code'
								);
								logger.info('NewAuthContext', 'V6 flow detected - redirecting to flow page', {
									flow: parsed?.flow,
									returnPath: parsed?.returnPath,
								});
								returnPath = parsed?.returnPath || '/flows/oidc-authorization-code-v6';
							} else if (isEnhancedV3) {
								// Determine the correct V3 flow path based on the flow type
								if (parsed?.flow === 'oauth-authorization-code-v3') {
									returnPath = parsed?.returnPath || '/flows/oauth-authorization-code-v3?step=4';
								} else if (parsed?.flow === 'oidc-authorization-code-v3') {
									returnPath = parsed?.returnPath || '/flows/enhanced-authorization-code-v3?step=4';
								} else {
									returnPath = parsed?.returnPath || '/flows/enhanced-authorization-code-v3?step=4';
								}
								console.log(
									' [NewAuthContext] V3 FLOW DETECTED - Returning to V3 page:',
									returnPath
								);
								logger.auth(
									'NewAuthContext',
									'Deferring token exchange to Enhanced Auth Code Flow V3 page',
									{ returnPath, redirectUri }
								);
							} else {
								returnPath = parsed?.returnPath || '/flows/enhanced-authorization-code-v2?step=4';
								console.log(
									' [NewAuthContext] V2 FLOW DETECTED - Returning to V2 page:',
									returnPath
								);
								logger.auth(
									'NewAuthContext',
									'Deferring token exchange to Enhanced Auth Code Flow V2 page',
									{ returnPath, redirectUri }
								);
							}

							return { success: true, redirectUrl: returnPath };
						}
					}
				} catch (e) {
					// Non-fatal: if flowContext is malformed, proceed with normal handling
					logger.warn(
						'NewAuthContext',
						'Failed to inspect flowContext for enhanced flow gating',
						e as unknown as string
					);
				}

				// FALLBACK: Check for V6 flows using active_oauth_flow (when flowContext is not set)
				const activeOAuthFlow = sessionStorage.getItem('active_oauth_flow');
				if (activeOAuthFlow) {
					console.log(' [NewAuthContext] V6 FLOW DETECTED via active_oauth_flow:', activeOAuthFlow);

					// Persist auth code for the flow page
					// Use flow-specific key (oauth_auth_code or oidc_auth_code)
					if (code) {
						const isOIDCFlow = activeOAuthFlow.includes('oidc-authorization-code');
						const authCodeKey = isOIDCFlow ? 'oidc_auth_code' : 'oauth_auth_code';
						sessionStorage.setItem(authCodeKey, code);
						sessionStorage.setItem(`${activeOAuthFlow}-authCode`, code);
						console.log(
							`🔑 [NewAuthContext] Stored auth code with key: ${authCodeKey} for active flow: ${activeOAuthFlow}`
						);
					}
					if (state) {
						sessionStorage.setItem('oauth_state', state);
					}

					// Determine redirect path based on active flow
					let returnPath = '/flows/oauth-authorization-code-v6';
					if (
						activeOAuthFlow.includes('oauth-authorization-code-v7-2') ||
						activeOAuthFlow.includes('oidc-authorization-code-v7-2')
					) {
						returnPath = '/flows/oauth-authorization-code-v7-2?step=4'; // V7.2 flow
					} else if (activeOAuthFlow.includes('oidc-authorization-code-v7')) {
						returnPath = '/flows/oauth-authorization-code-v7?step=4'; // V7 unified flow handles both OAuth and OIDC
					} else if (activeOAuthFlow.includes('oauth-authorization-code-v7')) {
						returnPath = '/flows/oauth-authorization-code-v7?step=4'; // V7 unified flow handles both OAuth and OIDC
					} else if (activeOAuthFlow.includes('oidc-authorization-code')) {
						returnPath = '/flows/oidc-authorization-code-v6';
					} else if (activeOAuthFlow.includes('oauth-authorization-code')) {
						returnPath = '/flows/oauth-authorization-code-v6';
					} else if (activeOAuthFlow.includes('par')) {
						returnPath = '/flows/par-flow';
					} else if (activeOAuthFlow.includes('rar')) {
						returnPath = '/flows/rar-flow';
					}

					console.log(' [NewAuthContext] Deferring to V6 flow page:', returnPath);
					return { success: true, redirectUrl: returnPath };
				}

				// Exchange code for tokens - This should NOT happen for Enhanced V3 or V6 flows
				console.log(' [NewAuthContext] CRITICAL: About to do immediate token exchange!');
				console.log(' [NewAuthContext] If this is V3 or V6, the flow context detection FAILED!');
				console.log(' [NewAuthContext] Flow context should have deferred this to flow page!');

				const requestBody = {
					grant_type: 'authorization_code',
					code: code.trim(), // Ensure no whitespace
					redirect_uri: redirectUri.trim(), // Ensure no whitespace
					client_id: clientId.trim(), // Ensure no whitespace
					client_secret: clientSecret || '',
					environment_id: environmentId.trim(), // Ensure no whitespace
					...(codeVerifier && codeVerifier.length > 0 && { code_verifier: codeVerifier.trim() }),
				};

				console.log(' [NewAuthContext] Token exchange request:', requestBody);
				console.log(' [NewAuthContext] Config object:', config);
				console.log(' [NewAuthContext] PingOne config:', config?.pingone);

				console.log(' [NewAuthContext] Request body validation:', {
					hasGrantType: !!requestBody.grant_type,
					hasCode: !!requestBody.code,
					hasRedirectUri: !!requestBody.redirect_uri,
					hasClientId: !!requestBody.client_id,
					hasClientSecret: !!requestBody.client_secret,
					hasEnvironmentId: !!requestBody.environment_id,
					hasCodeVerifier: !!requestBody.code_verifier,
				});

				// FINAL VALIDATION - Last chance to catch empty values
				if (requestBody.client_id === '' || !requestBody.client_id) {
					console.error(
						' [NewAuthContext] CRITICAL: Request body has empty client_id!',
						requestBody
					);
					throw new Error(
						'CRITICAL ERROR: Request body contains empty client_id. This should never happen.'
					);
				}

				// Additional validation for required fields
				if (!requestBody.redirect_uri || requestBody.redirect_uri.trim() === '') {
					console.error(' [NewAuthContext] Missing redirect_uri in token exchange request');
					throw new Error('Missing redirect URI. Please configure your OAuth settings.');
				}

				if (!requestBody.environment_id || requestBody.environment_id.trim() === '') {
					console.error(' [NewAuthContext] Missing environment_id in token exchange request');
					throw new Error('Missing environment ID. Please configure your PingOne environment.');
				}

				// Check if we have PKCE codes when needed
				if (requestBody.code_verifier && requestBody.code_verifier.trim() === '') {
					console.warn(
						' [NewAuthContext] Empty code_verifier provided - this may cause PKCE mismatch'
					);
				}

				// Use backend proxy to avoid CORS issues
				const backendUrl = getBackendUrl();

				console.log(' [NewAuthContext] Making token exchange request to backend');
				console.log(' [NewAuthContext] Request details:', {
					url: `${backendUrl}/api/token-exchange`,
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: requestBody,
				});

				const tokenResponse = await fetch(`${backendUrl}/api/token-exchange`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});

				console.log(' [NewAuthContext] Token exchange response:', {
					status: tokenResponse.status,
					statusText: tokenResponse.statusText,
					ok: tokenResponse.ok,
					headers: Object.fromEntries(tokenResponse.headers.entries()),
				});

				if (!tokenResponse.ok) {
					const errorText = await tokenResponse.text();
					let errorMessage = `Token exchange failed: ${errorText}`;

					// Parse error response for better user guidance
					let parsedError: { error?: string; error_description?: string };
					try {
						parsedError = JSON.parse(errorText);
					} catch (_e) {
						parsedError = { error: 'unknown', error_description: errorText };
					}

					console.error(' [NewAuthContext] Token exchange failed:', {
						status: tokenResponse.status,
						statusText: tokenResponse.statusText,
						errorText,
						parsedError,
						requestBody,
					});

					// Provide specific guidance based on error type
					if (parsedError.error === 'invalid_client') {
						errorMessage = `Token exchange failed: Invalid client credentials. Please check your PingOne application configuration. If you're using a specific OAuth flow, try using the dedicated flow pages instead of the global callback.`;
					} else if (parsedError.error === 'invalid_grant') {
						errorMessage = `Token exchange failed: Invalid authorization code or PKCE mismatch. This usually means the authorization code has expired or the PKCE codes don't match. Try using the specific OAuth flow pages for better PKCE handling.`;
					} else if (parsedError.error === 'invalid_request') {
						errorMessage = `Token exchange failed: Invalid request parameters. Please check your configuration. For OAuth flows, consider using the dedicated flow pages at /flows/ for better error handling.`;
					}

					logger.error('NewAuthContext', 'Token exchange failed', {
						status: tokenResponse.status,
						error: parsedError,
						guidance: 'Check PingOne application configuration and ensure credentials are correct',
					});
					updateState({ error: errorMessage, isLoading: false });
					return { success: false, error: errorMessage };
				}

				const tokenData: OAuthTokenResponse = await tokenResponse.json();
				console.log(' [NewAuthContext] Token exchange successful:', {
					hasAccessToken: !!tokenData.access_token,
					hasRefreshToken: !!tokenData.refresh_token,
					hasIdToken: !!tokenData.id_token,
					tokenType: tokenData.token_type,
					expiresIn: tokenData.expires_in,
					scope: tokenData.scope,
					tokenData,
				});

				// Store tokens
				const tokens: OAuthTokens = {
					access_token: tokenData.access_token,
					refresh_token: tokenData.refresh_token,
					id_token: tokenData.id_token,
					token_type: tokenData.token_type || 'Bearer',
					expires_in: tokenData.expires_in,
					expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
					refresh_expires_in: tokenData.refresh_expires_in,
					refresh_expires_at: tokenData.refresh_expires_in
						? Date.now() + tokenData.refresh_expires_in * 1000
						: undefined,
					scope: tokenData.scope,
				};

				console.log(' [NewAuthContext] Storing tokens in oauthStorage:', {
					hasAccessToken: !!tokens.access_token,
					hasRefreshToken: !!tokens.refresh_token,
					hasIdToken: !!tokens.id_token,
					tokenType: tokens.token_type,
					expiresIn: tokens.expires_in,
				});

				oauthStorage.setTokens(tokens);

				console.log(' [NewAuthContext] Tokens stored successfully');

				// Get user info if available
				let userInfo: UserInfo | null = null;
				const userInfoEndpoint = config?.pingone?.userInfoEndpoint || config?.userInfoEndpoint;
				if (tokenData.access_token && userInfoEndpoint) {
					try {
						userInfo = await getUserInfo(userInfoEndpoint, tokenData.access_token);
						oauthStorage.setUserInfo(userInfo);
					} catch (error) {
						logger.warn('NewAuthContext', 'Failed to fetch user info', error);
					}
				}

				// Update state
				console.log(' [NewAuthContext] Updating auth state with tokens:', {
					isAuthenticated: true,
					hasTokens: !!tokens,
					hasUser: !!userInfo,
					tokens: tokens
						? {
								hasAccessToken: !!tokens.access_token,
								hasRefreshToken: !!tokens.refresh_token,
								hasIdToken: !!tokens.id_token,
							}
						: null,
				});

				updateState({
					isAuthenticated: true,
					tokens: tokens,
					user: userInfo,
					isLoading: false,
					error: null,
				});

				// Clear session storage (but preserve nonce for Enhanced flows)
				// Note: oauth_nonce will be cleared later if this is not an Enhanced flow
				sessionStorage.removeItem('oauth_state');

				// Get redirect URL first, then clean up
				let redirectUrl = sessionStorage.getItem('oauth_redirect_after_login') || '/';
				sessionStorage.removeItem('oauth_redirect_after_login');

				// Check for flow context to continue to next step BEFORE cleaning up
				console.log(' [NewAuthContext] Checking flow context for redirect:', flowContext);
				console.log(' [NewAuthContext] All sessionStorage keys:', Object.keys(sessionStorage));
				console.log(
					' [NewAuthContext] All sessionStorage contents:',
					Object.fromEntries(
						Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)])
					)
				);

				// Enhanced redirect handling using FlowContextService
				try {
					console.log(' [NewAuthContext] Using enhanced FlowContextService for redirect handling');

					// Prepare callback data for FlowContextService
					const callbackData = {
						code,
						state,
						error,
						error_description: errorDescription,
						session_state: params.get('session_state'),
						iss: params.get('iss'),
					};

					// Use FlowContextUtils to handle the OAuth callback
					const redirectResult = FlowContextUtils.handleOAuthCallback(callbackData);

					if (redirectResult.success) {
						redirectUrl = redirectResult.redirectUrl;
						console.log(' [NewAuthContext] FlowContextService redirect successful:', {
							redirectUrl,
							hasFlowState: !!redirectResult.flowState,
						});
					} else {
						console.warn(
							' [NewAuthContext] FlowContextService redirect failed:',
							redirectResult.error
						);
						redirectUrl = '/dashboard'; // Safe fallback
					}
				} catch (flowContextError) {
					console.error(
						' [NewAuthContext] FlowContextService error, falling back to legacy logic:',
						flowContextError
					);

					// Fallback to legacy flow context handling for backward compatibility
					if (flowContext) {
						try {
							// SECURITY: Validate JSON input before parsing to prevent XSS
							if (typeof flowContext !== 'string' || flowContext.length > 10000) {
								console.warn(' [Security] Invalid flow context format or size');
								redirectUrl = '/dashboard';
							} else if (
								flowContext.includes('<script') ||
								flowContext.includes('javascript:') ||
								flowContext.includes('data:')
							) {
								console.warn(' [Security] Blocked potentially dangerous flow context content');
								redirectUrl = '/dashboard';
							} else {
								const parsedContext = safeJsonParse(flowContext);
								console.log(
									' [NewAuthContext] Safely parsed flow context (fallback):',
									parsedContext
								);

								// Validate the parsed context structure
								if (
									parsedContext &&
									typeof parsedContext === 'object' &&
									parsedContext.returnPath
								) {
									const returnPath = String(parsedContext.returnPath);
									if (returnPath.includes('/flows/enhanced-authorization-code')) {
										redirectUrl = returnPath;
									} else {
										redirectUrl = returnPath.startsWith('/') ? returnPath : '/dashboard';
									}
								} else {
									redirectUrl = '/dashboard';
								}
							}

							// Clean up flow context
							sessionStorage.removeItem('flowContext');
						} catch (error) {
							console.warn('Failed to parse flow context (fallback):', error);
							redirectUrl = '/dashboard';
						}
					} else {
						console.log(' [NewAuthContext] No flow context found, using dashboard');
						redirectUrl = '/dashboard';

						// Clear nonce for non-Enhanced flows
						sessionStorage.removeItem('oauth_nonce');
					}
				}

				logger.auth('NewAuthContext', 'Authentication successful', { redirectUrl });
				return { success: true, redirectUrl };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
				logger.error('NewAuthContext', 'Error in handleCallback', error);
				updateState({ error: errorMessage, isLoading: false });
				return { success: false, error: errorMessage };
			}
		},
		[config, updateState]
	);

	// Set auth state
	const setAuthState = useCallback(
		(updates: Partial<AuthState>) => {
			updateState(updates);
		},
		[updateState]
	);

	// Function to proceed with OAuth redirect after modal confirmation
	const proceedWithOAuth = useCallback(() => {
		if (authRequestData) {
			logger.auth('NewAuthContext', 'Proceeding with OAuth redirect');
			window.location.href = authRequestData.authorizationUrl;
		}
	}, [authRequestData]);

	// Close modal function
	const closeAuthModal = useCallback(() => {
		setShowAuthModal(false);
		setAuthRequestData(null);
	}, []);

	// Function to update tokens (useful for external token updates)
	const updateTokens = useCallback((newTokens: OAuthTokens | null) => {
		logger.auth('NewAuthContext', 'Updating tokens', newTokens);
		setState((prev) => ({
			...prev,
			tokens: newTokens,
			isAuthenticated: !!newTokens?.access_token,
			isLoading: false,
		}));
	}, []);

	// V7 Standardized credential saving function
	const saveCredentialsV7 = useCallback(async (credentials: Record<string, unknown>) => {
		try {
			console.log(
				' [NewAuthContext] Saving credentials using V7 standardized system...',
				credentials
			);

			const success = await saveFlowCredentials(
				'dashboard-login',
				credentials,
				undefined, // flowConfig
				undefined, // additionalState
				{ showToast: true }
			);

			if (success) {
				console.log(' [NewAuthContext] V7 credentials saved successfully');
				// Reload configuration to pick up the new credentials
				const newConfig = await loadConfiguration();
				setState((prev) => ({ ...prev, config: newConfig }));
			} else {
				console.error(' [NewAuthContext] Failed to save V7 credentials');
			}

			return success;
		} catch (error) {
			console.error(' [NewAuthContext] Error saving V7 credentials:', error);
			return false;
		}
	}, []);

	// Dismiss error function
	const dismissError = useCallback(() => {
		updateState({ error: null });
	}, [updateState]);

	// Flow context helper functions
	const initializeFlowContext = useCallback(
		(
			flowType: string,
			currentStep: number,
			flowState: Record<string, unknown>,
			additionalParams?: Record<string, string>
		): string => {
			try {
				return FlowContextUtils.initializeOAuthFlow(
					flowType,
					currentStep,
					flowState,
					additionalParams
				);
			} catch (error) {
				console.error(' [NewAuthContext] Failed to initialize flow context:', error);
				throw error;
			}
		},
		[]
	);

	const updateFlowStep = useCallback(
		(flowId: string, newStep: number, flowState?: Record<string, unknown>): boolean => {
			try {
				return FlowContextUtils.updateFlowStep(flowId, newStep, flowState);
			} catch (error) {
				console.error(' [NewAuthContext] Failed to update flow step:', error);
				return false;
			}
		},
		[]
	);

	const completeFlow = useCallback((flowId: string): void => {
		try {
			FlowContextUtils.completeFlow(flowId);
		} catch (error) {
			console.error(' [NewAuthContext] Failed to complete flow:', error);
		}
	}, []);

	const getCurrentFlow = useCallback(() => {
		try {
			return FlowContextUtils.getCurrentFlow();
		} catch (error) {
			console.error(' [NewAuthContext] Failed to get current flow:', error);
			return null;
		}
	}, []);

	// Context value
	const contextValue = useMemo(() => {
		// Handle both config structures: config.pingone.* and config.*
		// biome-ignore lint/suspicious/noExplicitAny: legacy config shape, types not exported
		const pingoneConfig = (config?.pingone as any) || (config as any) || {};

		// Debug logging for config issues
		if (!config) {
			logger.warn('NewAuthContext', 'Config is undefined', {
				hasConfig: !!config,
				configKeys: config ? Object.keys(config) : [],
				configStructure: config,
			});
		}

		const value = {
			...state,
			config: {
				disableLogin: false,
				clientId: pingoneConfig.clientId || '',
				clientSecret: pingoneConfig.clientSecret || '',
				environmentId: pingoneConfig.environmentId || '',
				redirectUri: pingoneConfig.redirectUri || '',
				authorizationEndpoint:
					pingoneConfig.authEndpoint || pingoneConfig.authorizationEndpoint || '',
				tokenEndpoint: pingoneConfig.tokenEndpoint || '',
				userInfoEndpoint: pingoneConfig.userInfoEndpoint || '',
				endSessionEndpoint: pingoneConfig.logoutEndpoint || pingoneConfig.endSessionEndpoint || '',
				scopes: pingoneConfig.scopes || ['openid', 'profile', 'email'],
				// Also provide the original config structure for backward compatibility
				pingone: {
					clientId: pingoneConfig.clientId || '',
					clientSecret: pingoneConfig.clientSecret || '',
					environmentId: pingoneConfig.environmentId || '',
					redirectUri: pingoneConfig.redirectUri || '',
					authEndpoint: pingoneConfig.authEndpoint || pingoneConfig.authorizationEndpoint || '',
					tokenEndpoint: pingoneConfig.tokenEndpoint || '',
					userInfoEndpoint: pingoneConfig.userInfoEndpoint || '',
					endSessionEndpoint:
						pingoneConfig.logoutEndpoint || pingoneConfig.endSessionEndpoint || '',
				},
			},
			login,
			logout,
			handleCallback,
			setAuthState,
			showAuthModal,
			authRequestData,
			proceedWithOAuth,
			closeAuthModal,
			updateTokens, // Add the updateTokens function
			dismissError, // Add the dismissError function
			saveCredentialsV7, // Add the V7 standardized credential saving function
			// Flow context helper functions
			initializeFlowContext,
			updateFlowStep,
			completeFlow,
			getCurrentFlow,
		};
		// Reduced debug logging to prevent console spam
		// logger.debug('NewAuthContext', 'Creating context value', value);
		return value;
	}, [
		state,
		config,
		login,
		logout,
		handleCallback,
		setAuthState,
		showAuthModal,
		authRequestData,
		proceedWithOAuth,
		closeAuthModal,
		updateTokens,
		dismissError,
		initializeFlowContext,
		updateFlowStep,
		completeFlow,
		getCurrentFlow,
		saveCredentialsV7,
	]);

	// Reduced debug logging to prevent console spam
	// logger.debug('NewAuthContext', 'Rendering AuthProvider with contextValue', contextValue);

	// Add a check to ensure context is properly initialized
	if (!contextValue) {
		logger.error('NewAuthContext', 'Context value is null/undefined, this should not happen');
		return <div>Error: Auth context not properly initialized</div>;
	}

	return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	// Reduced debug logging to prevent console spam
	// logger.debug('useAuth', 'Context value', context);
	if (!context) {
		// In development, suppress the error to prevent console spam during HMR
		if (process.env.NODE_ENV === 'development') {
			// Only log once per session to avoid spam
			// biome-ignore lint/suspicious/noExplicitAny: custom window property for HMR dedup
			if (!(window as any).__useAuthErrorLogged) {
				logger.warn(
					'useAuth',
					'Context is undefined - likely due to HMR, returning default context'
				);
				// biome-ignore lint/suspicious/noExplicitAny: custom window property for HMR dedup
				(window as any).__useAuthErrorLogged = true;
				// Reset the flag after a delay to allow for recovery
				setTimeout(() => {
					// biome-ignore lint/suspicious/noExplicitAny: custom window property for HMR dedup
					(window as any).__useAuthErrorLogged = false;
				}, 5000);
			}
		} else {
			logger.error('useAuth', 'Context is undefined - not within AuthProvider');
		}
		// Return a default context instead of throwing to prevent app crashes
		return {
			isAuthenticated: false,
			user: null,
			tokens: null,
			isLoading: false,
			error: 'AuthProvider not found',
			config: {
				disableLogin: false,
				clientId: '',
				clientSecret: '',
				redirectUri: '',
				authorizationEndpoint: '',
				tokenEndpoint: '',
				userInfoEndpoint: '',
				endSessionEndpoint: '',
				scopes: [],
				environmentId: '',
				hasConfigError: true,
				pingone: {
					clientId: '',
					clientSecret: '',
					environmentId: '',
					redirectUri: '',
					authEndpoint: '',
					tokenEndpoint: '',
					userInfoEndpoint: '',
					endSessionEndpoint: '',
				},
			},
			login: async () => ({ success: false, error: 'AuthProvider not found' }),
			logout: () => {},
			handleCallback: async () => ({ success: false, error: 'AuthProvider not found' }),
			setAuthState: () => {},
			showAuthModal: false,
			authRequestData: null,
			proceedWithOAuth: () => {},
			closeAuthModal: () => {},
			updateTokens: () => {},
			dismissError: () => {
				// Clear the error by reloading the page to reset context
				console.log(' [useAuth] Dismissing error by reloading page');
				window.location.reload();
			},
		};
	}
	return context;
};

// Helper function to get user info
async function getUserInfo(userInfoEndpoint: string, accessToken: string): Promise<UserInfo> {
	// Use backend proxy to avoid CORS issues
	const backendUrl = getBackendUrl();

	// Extract environment ID from userInfoEndpoint
	const environmentId = userInfoEndpoint.match(/\/\/([^/]+)\/([^/]+)\/as\/userinfo/)?.[2];

	const response = await fetch(
		`${backendUrl}/api/userinfo?access_token=${accessToken}&environment_id=${environmentId}`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		}
	);

	if (!response.ok) {
		throw new Error('Failed to fetch user info');
	}

	return response.json();
}
