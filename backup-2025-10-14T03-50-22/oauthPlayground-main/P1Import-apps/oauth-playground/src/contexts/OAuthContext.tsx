import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	generateRandomString,
	generateCodeVerifier,
	generateCodeChallenge,
	parseUrlParams,
	buildAuthUrl,
	exchangeCodeForTokens,
	validateIdToken,
	getUserInfo,
	isTokenExpired,
} from '../utils/oauth';

const OAuthContext = createContext();

export const OAuthProvider = ({ children }) => {
	const location = useLocation();
	const navigate = useNavigate();

	// Load saved configuration from localStorage
	const loadConfig = () => {
		try {
			const savedConfig = localStorage.getItem('pingone_config');
			return savedConfig ? JSON.parse(savedConfig) : null;
		} catch (error) {
			console.error('Error loading OAuth config:', error);
			return null;
		}
	};

	// State for OAuth configuration and tokens
	const [config, setConfig] = useState(loadConfig());
	const [tokens, setTokens] = useState(() => {
		const savedTokens = localStorage.getItem('oauth_tokens');
		return savedTokens ? JSON.parse(savedTokens) : null;
	});
	const [userInfo, setUserInfo] = useState(null);
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Save tokens to localStorage when they change
	useEffect(() => {
		if (tokens) {
			localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
			setIsAuthenticated(true);
		} else {
			localStorage.removeItem('oauth_tokens');
			setIsAuthenticated(false);
		}
	}, [tokens]);

	// Check if access token is expired
	const isAccessTokenExpired = useCallback(() => {
		if (!tokens?.access_token) return true;
		return isTokenExpired(tokens.access_token);
	}, [tokens]);

	// Check if refresh token is expired
	const isRefreshTokenExpired = useCallback(() => {
		if (!tokens?.refresh_token) return true;
		if (!tokens?.expires_in) return false; // If we don't have expires_in, assume it's valid

		const now = Math.floor(Date.now() / 1000);
		const tokenIssuedAt = tokens.issued_at || 0;
		const tokenExpiresAt = tokenIssuedAt + tokens.expires_in;

		return now > tokenExpiresAt;
	}, [tokens]);

	// Save configuration
	const saveConfig = (newConfig) => {
		try {
			localStorage.setItem('pingone_config', JSON.stringify(newConfig));
			setConfig(newConfig);
			return true;
		} catch (error) {
			console.error('Error saving OAuth config:', error);
			return false;
		}
	};

	// Initialize OAuth flow
	const startOAuthFlow = useCallback(
		async (flowType = 'authorization_code', options = {}) => {
			if (!config) {
				setError('OAuth configuration is missing. Please configure your PingOne settings first.');
				return false;
			}

			try {
				setError(null);
				setIsLoading(true);

				const state = generateRandomString();
				const nonce = generateRandomString();
				const codeVerifier = generateCodeVerifier();
				const codeChallenge = await generateCodeChallenge(codeVerifier);

				// Save flow state to localStorage
				localStorage.setItem('oauth_state', state);
				localStorage.setItem('oauth_nonce', nonce);
				localStorage.setItem('oauth_code_verifier', codeVerifier);
				localStorage.setItem('oauth_flow_type', flowType);

				// Build authorization URL
				const authUrl = buildAuthUrl({
					authEndpoint: config.authEndpoint.replace('{envId}', config.environmentId),
					clientId: config.clientId,
					redirectUri: config.redirectUri,
					scope: config.scopes,
					state,
					nonce,
					codeChallenge,
					codeChallengeMethod: 'S256',
					responseType: flowType === 'implicit' ? 'id_token token' : 'code',
					...options,
				});

				// Redirect to authorization server
				window.location.href = authUrl;
				return true;
			} catch (error) {
				console.error('Error starting OAuth flow:', error);
				setError(`Failed to start OAuth flow: ${error.message}`);
				setIsLoading(false);
				return false;
			}
		},
		[config]
	);

	// Handle OAuth callback
	const handleCallback = useCallback(
		async (url) => {
			if (!config) {
				setError('OAuth configuration is missing. Please configure your PingOne settings first.');
				return false;
			}

			try {
				setError(null);
				setIsLoading(true);

				const params = parseUrlParams(url);
				const savedState = localStorage.getItem('oauth_state');
				const savedNonce = localStorage.getItem('oauth_nonce');
				const savedCodeVerifier = localStorage.getItem('oauth_code_verifier');
				const flowType = localStorage.getItem('oauth_flow_type') || 'authorization_code';

				// Clean up stored values
				localStorage.removeItem('oauth_state');
				localStorage.removeItem('oauth_nonce');
				localStorage.removeItem('oauth_code_verifier');
				localStorage.removeItem('oauth_flow_type');

				// Check for errors
				if (params.error) {
					throw new Error(params.error_description || `Authorization failed: ${params.error}`);
				}

				// For implicit flow, we get tokens directly in the URL fragment
				if (flowType === 'implicit') {
					if (!params.access_token) {
						throw new Error('No access token found in the response');
					}

					// Validate ID token if present
					if (params.id_token) {
						try {
							await validateIdToken(
								params.id_token,
								config.clientId,
								`https://auth.pingone.com/${config.environmentId}`
							);
						} catch (error) {
							console.error('ID token validation failed:', error);
							throw new Error('Invalid ID token');
						}
					}

					// Store tokens
					const tokens = {
						access_token: params.access_token,
						id_token: params.id_token,
						token_type: params.token_type || 'Bearer',
						expires_in: parseInt(params.expires_in) || 3600,
						scope: params.scope,
						issued_at: Math.floor(Date.now() / 1000),
					};

					setTokens(tokens);

					// Fetch user info if the token includes the required scope
					if (params.scope && params.scope.includes('openid')) {
						try {
							const userInfo = await getUserInfo(
								config.userInfoEndpoint.replace('{envId}', config.environmentId),
								params.access_token
							);
							setUserInfo(userInfo);
						} catch (error) {
							console.error('Failed to fetch user info:', error);
						}
					}

					setIsLoading(false);
					return true;
				}

				// For authorization code flow, exchange the code for tokens
				if (!params.code) {
					throw new Error('No authorization code found in the response');
				}

				// Verify state to prevent CSRF
				if (!params.state || params.state !== savedState) {
					throw new Error('Invalid state parameter');
				}

				// Exchange code for tokens
				const tokenResponse = await exchangeCodeForTokens({
					tokenEndpoint: config.tokenEndpoint.replace('{envId}', config.environmentId),
					clientId: config.clientId,
					clientSecret: config.clientSecret,
					redirectUri: config.redirectUri,
					code: params.code,
					codeVerifier: savedCodeVerifier,
				});

				// Validate ID token if present
				if (tokenResponse.id_token) {
					try {
						const idTokenClaims = await validateIdToken(
							tokenResponse.id_token,
							config.clientId,
							`https://auth.pingone.com/${config.environmentId}`
						);

						// Verify nonce
						if (idTokenClaims.nonce !== savedNonce) {
							throw new Error('Invalid nonce in ID token');
						}

						// Store ID token claims
						tokenResponse.id_token_claims = idTokenClaims;
					} catch (error) {
						console.error('ID token validation failed:', error);
						throw new Error('Invalid ID token');
					}
				}

				// Add issued_at timestamp for token expiration calculation
				tokenResponse.issued_at = Math.floor(Date.now() / 1000);

				// Store tokens
				setTokens(tokenResponse);

				// Fetch user info if the token includes the required scope
				if (tokenResponse.scope && tokenResponse.scope.includes('openid')) {
					try {
						const userInfo = await getUserInfo(
							config.userInfoEndpoint.replace('{envId}', config.environmentId),
							tokenResponse.access_token
						);
						setUserInfo(userInfo);
					} catch (error) {
						console.error('Failed to fetch user info:', error);
					}
				}

				setIsLoading(false);
				return true;
			} catch (error) {
				console.error('Error handling OAuth callback:', error);
				setError(error.message || 'Failed to complete OAuth flow');
				setIsLoading(false);
				return false;
			}
		},
		[config]
	);

	// Logout
	const logout = useCallback(() => {
		setTokens(null);
		setUserInfo(null);

		// Clear tokens from localStorage
		localStorage.removeItem('oauth_tokens');

		// Redirect to home or login page
		navigate('/');
	}, [navigate]);

	// Check if user is authenticated
	const checkAuthStatus = useCallback(() => {
		if (!tokens) return false;

		// Check if access token is expired
		if (isAccessTokenExpired()) {
			// If we have a refresh token, try to refresh the access token
			if (tokens.refresh_token && !isRefreshTokenExpired()) {
				// In a real app, you would implement token refresh here
				console.log('Access token expired, attempting to refresh...');
				// For now, we'll just log out the user
				logout();
				return false;
			} else {
				// No valid refresh token, user needs to log in again
				logout();
				return false;
			}
		}

		return true;
	}, [tokens, isAccessTokenExpired, isRefreshTokenExpired, logout]);

	// Check authentication status on initial load and when tokens change
	useEffect(() => {
		if (tokens) {
			const isAuth = checkAuthStatus();
			setIsAuthenticated(isAuth);
		} else {
			setIsAuthenticated(false);
		}
	}, [tokens, checkAuthStatus]);

	// Handle OAuth callback on component mount if we're on the callback URL
	useEffect(() => {
		if (location.pathname === '/callback' && location.search) {
			handleCallback(window.location.href).then((success) => {
				if (success) {
					navigate('/dashboard');
				} else {
					navigate('/login', { state: { error: 'Authentication failed' } });
				}
			});
		}
	}, [location, navigate, handleCallback]);

	return (
		<OAuthContext.Provider
			value={{
				config,
				tokens,
				userInfo,
				error,
				isLoading,
				isAuthenticated,
				saveConfig,
				startOAuthFlow,
				handleCallback,
				logout,
				checkAuthStatus,
			}}
		>
			{children}
		</OAuthContext.Provider>
	);
};

// Custom hook to use the OAuth context
export const useOAuth = () => {
	const context = useContext(OAuthContext);
	if (!context) {
		throw new Error('useOAuth must be used within an OAuthProvider');
	}
	return context;
};

export default OAuthContext;
