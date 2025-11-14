import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/NewAuthContext';
import { generateRandomString, sha256 } from '../utils/crypto';
import { credentialManager } from '../utils/credentialManager';
import { showGlobalError, showGlobalSuccess } from '../hooks/useNotifications';

// Educational Note: This is an OAuth 2.0 Authorization Code Flow implementation
// The Authorization Code Flow is the most secure OAuth flow for web applications
// It involves redirecting the user to the authorization server, then exchanging
// the authorization code for tokens on the backend to prevent token exposure in the browser

export interface OAuthTokens {
	access_token: string;
	id_token?: string; // ID token for OIDC flows
	refresh_token?: string; // Allows obtaining new access tokens without re-authorization
	expires_in?: number;
	token_type: string; // Made required to match OAuthTokenResponse
	scope?: string;
	[key: string]: unknown; // Allow additional properties
}

type UserInfo = {
	sub: string; // Subject identifier (unique user ID)
	name?: string;
	given_name?: string;
	family_name?: string;
	email?: string;
	email_verified?: boolean;
	picture?: string;
	[key: string]: unknown; // Allow additional properties
};

type OAuthFlowState = {
	codeVerifier: string; // PKCE code verifier for security
	state: string; // CSRF protection parameter
	nonce: string; // OIDC nonce for replay attack protection
};

// Educational Note: This interface defines what the hook returns
// It provides all the state and functions needed to manage an OAuth flow
type OAuthFlowReturn = {
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	tokens: OAuthTokens | null;
	userInfo: UserInfo | null;
	flowState: OAuthFlowState;
	initFlow: () => Promise<string | null>; // Starts the OAuth flow by generating auth URL
	handleCallback: (callbackUrl: string) => Promise<void>; // Processes the redirect callback
	logout: () => void; // Clears authentication state
};

const useAuthzV4NewWindsurf = (): OAuthFlowReturn => {
	// Educational Note: We use React hooks to manage component state
	// useState for local state, useCallback for memoized functions, useMemo for computed values
	const { setAuthState } = useAuth();

	// Educational Note: This state holds all the flow's current status
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

	// Educational Note: PingOne integration - we load credentials dynamically like V3 flows
	// This allows the flow to work with different PingOne environments
	const credentials = useMemo(() => {
		console.log('[Authz-V4] Loading PingOne credentials for authorization flow');

		// Try multiple credential sources for flexibility
		let creds = credentialManager.loadAuthzFlowCredentials();
		if (!creds?.environmentId) {
			creds = credentialManager.loadConfigCredentials();
		}
		if (!creds?.environmentId) {
			creds = credentialManager.loadPermanentCredentials();
		}

		if (!creds?.environmentId || !creds?.clientId) {
			console.warn('[Authz-V4] No valid PingOne credentials found');
			return null;
		}

		console.log('[Authz-V4] Credentials loaded:', {
			environmentId: creds.environmentId,
			hasClientId: !!creds.clientId,
			hasClientSecret: !!creds.clientSecret,
			scopes: creds.scopes,
		});

		return creds;
	}, []);

	// Educational Note: Construct PingOne endpoints dynamically from environment ID
	// This is how V3 flows integrate with PingOne - flexible and environment-specific
	const oauthConfig = useMemo(() => {
		if (!credentials?.environmentId) {
			console.warn('[Authz-V4] Cannot construct endpoints without environment ID');
			return null;
		}

		const baseUrl = `https://auth.pingone.com/${credentials.environmentId}`;

		return {
			authEndpoint: `${baseUrl}/as/authorize`,
			tokenEndpoint: `${baseUrl}/as/token`,
			userInfoEndpoint: `${baseUrl}/as/userinfo`,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			redirectUri: credentials.redirectUri || 'http://localhost:3000/callback',
			scopes: credentials.scopes || ['openid', 'profile', 'email'],
		};
	}, [credentials]);

	// Educational Note: PKCE (Proof Key for Code Exchange) adds security to the flow
	// It prevents authorization code interception attacks by binding the code to the client
	const generatePkceCodes = useCallback(async (): Promise<{
		codeVerifier: string;
		codeChallenge: string;
	}> => {
		console.log('[Authz-V4] Generating PKCE codes for enhanced security');

		const codeVerifier = generateRandomString(64); // PKCE code verifier length
		const hashed = await sha256(codeVerifier);
		const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hashed)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		console.log('[Authz-V4] PKCE codes generated successfully');
		return { codeVerifier, codeChallenge };
	}, []);

	// Educational Note: This function initiates the OAuth flow
	// It builds the authorization URL with all necessary parameters
	const initFlow = useCallback(async (): Promise<string | null> => {
		if (!oauthConfig) {
			const errorMsg = 'OAuth configuration not available - check PingOne credentials';
			console.error('[Authz-V4] Init flow failed:', errorMsg);
			setState((prev) => ({ ...prev, error: errorMsg }));
			return null;
		}

		console.log('[Authz-V4] Initializing authorization code flow');

		try {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			// Generate security parameters
			const state = generateRandomString(32); // State parameter length
			const nonce = generateRandomString(32); // Nonce parameter length
			const responseType = 'code'; // Authorization code flow

			console.log('[Authz-V4] Generated security parameters:', {
				state: state.substring(0, 8) + '...',
				nonce: nonce.substring(0, 8) + '...',
			});

			// Build authorization URL
			const authUrl = new URL(oauthConfig.authEndpoint);
			const params = new URLSearchParams({
				response_type: responseType,
				client_id: oauthConfig.clientId,
				redirect_uri: oauthConfig.redirectUri,
				scope: Array.isArray(oauthConfig.scopes)
					? oauthConfig.scopes.join(' ')
					: oauthConfig.scopes,
				state,
				nonce,
			});

			// Add PKCE for security (always use for authorization code)
			const { codeVerifier, codeChallenge } = await generatePkceCodes();
			params.append('code_challenge', codeChallenge);
			params.append('code_challenge_method', 'S256');

			// Store flow state for callback verification
			setState((prev) => ({
				...prev,
				flowState: {
					codeVerifier,
					state,
					nonce,
				},
			}));

			authUrl.search = params.toString();
			const finalUrl = authUrl.toString();

			console.log('[Authz-V4] Authorization URL constructed:', finalUrl.substring(0, 100) + '...');
			return finalUrl;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to initialize OAuth flow';
			console.error('[Authz-V4] Error initializing flow:', error);
			setState((prev) => ({
				...prev,
				error: errorMessage,
				isLoading: false,
			}));
			showGlobalError(errorMessage);
			return null;
		}
	}, [oauthConfig, generatePkceCodes]);

	// Educational Note: Handle the callback from the authorization server
	// This processes the authorization code and exchanges it for tokens
	const handleCallback = useCallback(
		async (url: string): Promise<void> => {
			console.log('[Authz-V4] Processing OAuth callback');

			if (!oauthConfig) {
				throw new Error('OAuth configuration not available');
			}

			try {
				setState((prev) => ({ ...prev, isLoading: true, error: null }));

				const urlObj = new URL(url);
				const params = new URLSearchParams(urlObj.search);
				const code = params.get('code');
				const stateParam = params.get('state');
				const error = params.get('error');

				console.log('[Authz-V4] Callback parameters:', {
					hasCode: !!code,
					stateParam: stateParam?.substring(0, 8) + '...',
					error,
				});

				// Check for authorization errors
				if (error) {
					const errorDesc = params.get('error_description') || 'Authorization failed';
					console.error('[Authz-V4] Authorization error:', errorDesc);
					showGlobalError(errorDesc);
					throw new Error(errorDesc);
				}

				// Verify state parameter for CSRF protection
				const currentState = state.flowState.state;
				if (!stateParam || stateParam !== currentState) {
					const errorMsg = 'Invalid state parameter - possible CSRF attack';
					console.error('[Authz-V4] State verification failed');
					showGlobalError(errorMsg);
					throw new Error(errorMsg);
				}

				if (!code) {
					throw new Error('Authorization code not found in callback URL');
				}

				console.log('[Authz-V4] State verified, exchanging code for tokens');

				// Exchange authorization code for tokens using backend API (like V3 flows)
				// This prevents exposing client secret in the browser
				const tokenResponse = await fetch('/api/token-exchange', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						grant_type: 'authorization_code',
						code,
						code_verifier: state.flowState.codeVerifier,
						redirect_uri: oauthConfig.redirectUri,
						client_id: oauthConfig.clientId,
						client_secret: oauthConfig.clientSecret,
						environment_id: credentials?.environmentId,
					}),
				});

				if (!tokenResponse.ok) {
					const errorData = await tokenResponse.json();
					console.error('[Authz-V4] Token exchange failed:', errorData);
					throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
				}

				const tokens: OAuthTokens = await tokenResponse.json();
				console.log('[Authz-V4] Tokens received successfully');

				// Store tokens securely
				localStorage.setItem('oauth_tokens', JSON.stringify(tokens));

				// Fetch user information if we have an access token
				let userInfo: UserInfo | null = null;
				if (tokens.access_token) {
					console.log('[Authz-V4] Fetching user information');

					try {
						const userInfoResponse = await fetch(oauthConfig.userInfoEndpoint, {
							headers: {
								Authorization: `Bearer ${tokens.access_token}`,
								'Content-Type': 'application/json',
							},
						});

						if (userInfoResponse.ok) {
							userInfo = (await userInfoResponse.json()) as UserInfo;
							console.log('[Authz-V4] User information retrieved');
						} else {
							console.warn('[Authz-V4] Failed to fetch user info:', userInfoResponse.status);
						}
					} catch (error) {
						console.warn('[Authz-V4] Error fetching user info:', error);
					}
				}

				// Update authentication state
				setState((prev) => ({
					...prev,
					isAuthenticated: true,
					isLoading: false,
					tokens,
					userInfo,
					error: null,
				}));

				// Update global auth context
				setAuthState({
					isAuthenticated: true,
					user: userInfo || { sub: 'unknown' },
					tokens,
					isLoading: false,
					error: null,
				});

				console.log('[Authz-V4] Authentication completed successfully');
				showGlobalSuccess('Successfully authenticated with PingOne!');
			} catch (error) {
				console.error('[Authz-V4] Callback handling error:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Failed to handle OAuth callback';
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: errorMessage,
				}));
				showGlobalError(errorMessage);
			}
		},
		[oauthConfig, state.flowState, credentials, setAuthState]
	);

	// Educational Note: Logout clears all authentication state
	const logout = useCallback(() => {
		console.log('[Authz-V4] Logging out user');

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

		console.log('[Authz-V4] Logout completed');
		showGlobalSuccess('Successfully logged out');
	}, [setAuthState]);

	return {
		...state,
		initFlow,
		handleCallback,
		logout,
	};
};

export default useAuthzV4NewWindsurf;
