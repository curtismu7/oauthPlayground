import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/NewAuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { generateRandomString, sha256 } from '../utils/crypto';
import { config } from '../services/config';

// Types
export interface OAuthTokens {
	access_token: string;
	id_token?: string; // Make id_token optional
	refresh_token?: string;
	expires_in?: number;
	token_type?: string;
	scope?: string;
	[key: string]: unknown; // Allow additional properties
}

type UserInfo = {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	email?: string;
	email_verified?: boolean;
	picture?: string;
	[key: string]: unknown; // Allow additional properties
};

type OAuthFlowState = {
	codeVerifier: string;
	state: string;
	nonce: string;
};

type OAuthFlowReturn = {
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	tokens: OAuthTokens | null;
	userInfo: UserInfo | null;
	flowState: OAuthFlowState;
	initFlow: () => Promise<string | null>;
	handleCallback: (callbackUrl: string) => Promise<void>;
	logout: () => void;
};

const useOAuthFlow = (flowType = 'authorization_code'): OAuthFlowReturn => {
	const { notify } = useNotifications();
	const { setAuthState } = useAuth();
	const [state, setState] = useState<{
		isAuthenticated: boolean;
		isLoading: boolean;
		error: string | null;
		tokens: OAuthTokens | null;
		userInfo: UserInfo | null;
		flowState: OAuthFlowState;
	}>({
		isAuthenticated: false,
		isLoading: false,
		error: null,
		tokens: null,
		userInfo: null,
		flowState: {
			codeVerifier: '',
			state: '',
			nonce: '',
		},
	});

	// Memoize the configuration to prevent unnecessary re-renders
	const oauthConfig = useMemo(
		() => ({
			authEndpoint: config.pingone.authEndpoint,
			tokenEndpoint: config.pingone.tokenEndpoint,
			userInfoEndpoint: config.pingone.userInfoEndpoint,
			clientId: config.pingone.clientId,
			redirectUri: config.pingone.redirectUri,
			scopes: config.defaultScopes,
		}),
		[
			config.pingone.authEndpoint,
			config.pingone.tokenEndpoint,
			config.pingone.userInfoEndpoint,
			config.pingone.clientId,
			config.pingone.redirectUri,
			config.defaultScopes,
		]
	);

	// Generate PKCE code verifier and challenge
	const generatePkceCodes = useCallback(async (): Promise<{
		codeVerifier: string;
		codeChallenge: string;
	}> => {
		const codeVerifier = generateRandomString(config.pkce.codeVerifierLength);
		const hashed = await sha256(codeVerifier);
		const hashedArray = Array.from(new Uint8Array(hashed));
		const codeChallenge = btoa(String.fromCharCode(...hashedArray))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		return { codeVerifier, codeChallenge };
	}, [config.pkce.codeVerifierLength]);

	// Initialize the OAuth flow
	const initFlow = useCallback(async (): Promise<string | null> => {
		try {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			const state = generateRandomString(config.pkce.stateLength);
			const nonce = generateRandomString(config.pkce.nonceLength);
			const responseType = flowType === 'authorization_code' ? 'code' : 'token';

			const authUrl = new URL(oauthConfig.authEndpoint);
			const params = new URLSearchParams({
				response_type: responseType,
				client_id: oauthConfig.clientId,
				redirect_uri: oauthConfig.redirectUri,
				scope: oauthConfig.scopes.join(' '),
				state,
				nonce,
			});

			// Add PKCE for authorization code flow
			if (flowType === 'authorization_code' || flowType === 'pkce') {
				const { codeVerifier, codeChallenge } = await generatePkceCodes();
				params.append('code_challenge', codeChallenge);
				params.append('code_challenge_method', 'S256');

				setState((prev) => ({
					...prev,
					flowState: {
						...prev.flowState,
						codeVerifier,
						state,
						nonce,
					},
				}));
			} else {
				setState((prev) => ({
					...prev,
					flowState: {
						...prev.flowState,
						state,
						nonce,
					},
				}));
			}

			authUrl.search = params.toString();
			return authUrl.toString();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to initialize OAuth flow';
			console.error('Error initializing OAuth flow:', error);
			setState((prev) => ({
				...prev,
				error: errorMessage,
				isLoading: false,
			}));
			return null;
		}
	}, [flowType, oauthConfig, generatePkceCodes]);

	// Handle OAuth callback
	const handleCallback = useCallback(
		async (url: string): Promise<void> => {
			try {
				setState((prev) => ({ ...prev, isLoading: true, error: null }));

				const urlObj = new URL(url);
				const params = new URLSearchParams(urlObj.search);
				const code = params.get('code');
				const stateParam = params.get('state');
				const error = params.get('error');

				// Check for errors
				if (error) {
					const errorDesc = params.get('error_description') || 'Authorization failed';
					notify(errorDesc, 'error');
					throw new Error(errorDesc);
				}

				// Verify state matches
				const currentState = state.flowState.state;
				if (!stateParam || stateParam !== currentState) {
					const errorMsg = 'Invalid state parameter';
					notify(errorMsg, 'error');
					throw new Error(errorMsg);
				}

				// Handle implicit flow (token in URL fragment)
				if (flowType === 'implicit') {
					const hash = url.split('#')[1];
					if (!hash) {
						throw new Error('No token found in URL fragment');
					}

					const hashParams = new URLSearchParams(hash);
					const accessToken = hashParams.get('access_token');
					const idToken = hashParams.get('id_token');

					if (!accessToken) {
						throw new Error('No access token found in response');
					}

					// Create tokens object
					const tokens: OAuthTokens = {
						access_token: accessToken,
						...(idToken ? { id_token: idToken } : {}),
						token_type: 'Bearer',
						expires_in: 3600, // Default expiration
					};

					// Store tokens in localStorage
					localStorage.setItem('oauth_tokens', JSON.stringify(tokens));

					// Fetch user info
					let userInfo: UserInfo | null = null;
					try {
						const userInfoResponse = await fetch(oauthConfig.userInfoEndpoint, {
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
							},
						});

						if (userInfoResponse.ok) {
							userInfo = (await userInfoResponse.json()) as UserInfo;
						}
					} catch (error) {
						console.warn('Failed to fetch user info:', error);
					}

					// Update state with tokens and user info
					setState((prev) => ({
						...prev,
						isAuthenticated: true,
						isLoading: false,
						tokens,
						userInfo,
						error: null,
					}));

					// Update auth context
					setAuthState({
						isAuthenticated: true,
						user: userInfo || { sub: 'unknown' },
						tokens,
						isLoading: false,
						error: null,
					});

					notify('Successfully authenticated', 'success');

					return;

					// Handle authorization code flow
				} else if (flowType === 'authorization_code' || flowType === 'pkce') {
					if (!code) {
						throw new Error('Authorization code not found in callback URL');
					}

					// Code is already checked for null above

					// Prepare token request body
					const tokenParams = new URLSearchParams();
					tokenParams.append('grant_type', 'authorization_code');
					tokenParams.append('code', code);
					tokenParams.append('redirect_uri', oauthConfig.redirectUri);
					tokenParams.append('client_id', oauthConfig.clientId);

					// Add PKCE code verifier if using PKCE
					if (flowType === 'pkce') {
						tokenParams.append('code_verifier', state.flowState.codeVerifier);
					}

					const tokenResponse = await fetch(oauthConfig.tokenEndpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
							Accept: 'application/json',
						},
						body: tokenParams,
					});

					if (!tokenResponse.ok) {
						const errorData = await tokenResponse.json();
						throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
					}

					const tokens: OAuthTokens = await tokenResponse.json();
					localStorage.setItem('oauth_tokens', JSON.stringify(tokens));

					// Fetch user info
					let userInfo: UserInfo | null = null;
					if (tokens.access_token) {
						const userInfoResponse = await fetch(oauthConfig.userInfoEndpoint, {
							headers: {
								Authorization: `Bearer ${tokens.access_token}`,
							},
						});

						if (userInfoResponse.ok) {
							userInfo = await userInfoResponse.json();
						}
					}

					setState((prev) => ({
						...prev,
						isAuthenticated: true,
						isLoading: false,
						tokens,
						userInfo,
					}));

					return;
				}
			} catch (error) {
				console.error('Error handling OAuth callback:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to handle OAuth callback';
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: errorMessage,
				}));
				// Error is already handled by setting state
				return;
			}
		},
		[flowType, oauthConfig, state.flowState]
	);

	// Logout
	const logout = useCallback(() => {
		localStorage.removeItem('oauth_tokens');
		setState({
			isAuthenticated: false,
			isLoading: false,
			error: null,
			tokens: null,
			userInfo: null,
			flowState: {
				codeVerifier: '',
				state: '',
				nonce: '',
			},
		});

		setAuthState({
			isAuthenticated: false,
			user: null,
			tokens: null,
			isLoading: false,
			error: null,
		});

		notify('Successfully logged out', 'info');
	}, [notify, setAuthState]);

	return {
		...state,
		initFlow,
		handleCallback,
		logout,
	};
};

export default useOAuthFlow;
