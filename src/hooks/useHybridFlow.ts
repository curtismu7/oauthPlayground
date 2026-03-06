import { useCallback, useEffect, useState } from 'react';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { v4ToastManager } from '../utils/v4ToastMessages';

// logging handled via logger utility

export interface HybridFlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	scopes: string;
	responseType: 'code id_token' | 'code token' | 'code id_token token';
	responseMode?: 'query' | 'fragment' | 'form_post' | 'pi.flow';
	includeX5tParameter?: boolean;
}

export interface HybridFlowTokens {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	code?: string; // Authorization code from hybrid response
}

export interface HybridFlowState {
	// Credentials
	credentials: HybridFlowCredentials | null;
	setCredentials: (creds: HybridFlowCredentials) => void;

	// Authorization URL
	authorizationUrl: string | null;
	generateAuthorizationUrl: () => string;

	// Tokens
	tokens: HybridFlowTokens | null;
	setTokens: (tokens: HybridFlowTokens) => void;

	// State & Nonce
	state: string | null;
	nonce: string | null;

	// Loading states
	isLoading: boolean;
	isExchangingCode: boolean;

	// Error handling
	error: string | null;
	setError: (error: string | null) => void;

	// Flow control
	reset: () => void;
	exchangeCodeForTokens: (code: string) => Promise<void>;
}

// Generate cryptographically secure random string
const generateRandomString = (length: number = 32): string => {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Generate PKCE code verifier and challenge
const _generatePKCE = async () => {
	const codeVerifier = generateRandomString(64);
	const encoder = new TextEncoder();
	const data = encoder.encode(codeVerifier);
	const hash = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hash));
	const codeChallenge = btoa(String.fromCharCode(...hashArray))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');

	return { codeVerifier, codeChallenge };
};

export const useHybridFlow = (): HybridFlowState => {
	const [credentials, setCredentialsState] = useState<HybridFlowCredentials | null>(null);
	const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
	const [tokens, setTokensState] = useState<HybridFlowTokens | null>(null);
	const [state, setState] = useState<string | null>(null);
	const [nonce, setNonce] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isExchangingCode, setIsExchangingCode] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load saved credentials on mount
	useEffect(() => {
		const savedCreds = credentialManager.getAllCredentials();
		if (savedCreds.environmentId && savedCreds.clientId) {
			setCredentialsState({
				environmentId: savedCreds.environmentId,
				clientId: savedCreds.clientId,
				clientSecret: savedCreds.clientSecret || '',
				scopes: savedCreds.scopes?.join(' ') || 'openid profile email',
				responseType: 'code id_token', // Default to code id_token
			});
			logger.info('useHybridFlow', 'Loaded saved credentials from credential manager');
		}
	}, []);

	const setCredentials = useCallback((creds: HybridFlowCredentials) => {
		setCredentialsState(creds);
		logger.info('useHybridFlow', 'Credentials updated', {
			environmentId: creds.environmentId,
			clientId: `${creds.clientId.substring(0, 8)}...`,
			responseType: creds.responseType,
		});
	}, []);

	const setTokens = useCallback((newTokens: HybridFlowTokens) => {
		setTokensState(newTokens);
		logger.success('useHybridFlow', 'Tokens received', {
			hasAccessToken: !!newTokens.access_token,
			hasIdToken: !!newTokens.id_token,
			hasRefreshToken: !!newTokens.refresh_token,
			hasCode: !!newTokens.code,
		});
	}, []);

	const generateAuthorizationUrl = useCallback((): string => {
		if (!credentials) {
			const errorMsg = 'Cannot generate authorization URL: credentials not set';
			logger.error('useHybridFlow', errorMsg);
			setError(errorMsg);
			throw new Error(errorMsg);
		}

		try {
			// Generate state and nonce
			const newState = generateRandomString(32);
			const newNonce = generateRandomString(32);

			setState(newState);
			setNonce(newNonce);

			// Store state and nonce in sessionStorage for validation
			sessionStorage.setItem('hybrid_state', newState);
			sessionStorage.setItem('hybrid_nonce', newNonce);

			// Build authorization URL
			const baseUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
			const redirectUri = `${window.location.origin}/hybrid-callback`;

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				response_type: credentials.responseType,
				redirect_uri: redirectUri,
				scope: credentials.scopes,
				state: newState,
				nonce: newNonce,
				response_mode: credentials.responseMode || 'fragment', // Use selected response mode or default to fragment
			});

			const url = `${baseUrl}?${params.toString()}`;
			setAuthorizationUrl(url);

			logger.info('useHybridFlow', 'Authorization URL generated', {
				responseType: credentials.responseType,
				scopes: credentials.scopes,
				redirectUri,
			});

			return url;
		} catch (err) {
			const errorMsg = `Failed to generate authorization URL: ${err}`;
			logger.error('useHybridFlow', errorMsg, undefined, err instanceof Error ? err : undefined);
			setError(errorMsg);
			throw err;
		}
	}, [credentials]);

	const exchangeCodeForTokens = useCallback(
		async (code: string) => {
			if (!credentials) {
				const errorMsg = 'Cannot exchange code: credentials not set';
				logger.error('useHybridFlow', errorMsg);
				setError(errorMsg);
				throw new Error(errorMsg);
			}

			setIsExchangingCode(true);
			setError(null);

			try {
				logger.info('useHybridFlow', 'Exchanging authorization code for tokens...');

				const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
				const redirectUri = `${window.location.origin}/hybrid-callback`;

				const body = new URLSearchParams({
					grant_type: 'authorization_code',
					code,
					redirect_uri: redirectUri,
					client_id: credentials.clientId,
					...(credentials.includeX5tParameter && { request_x5t: 'true' }),
				});

				// Add client_secret if provided (confidential client)
				if (credentials.clientSecret) {
					body.append('client_secret', credentials.clientSecret);
				}

				const response = await fetch(tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: body.toString(),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.error_description ||
							errorData.error ||
							`Token exchange failed: ${response.status}`
					);
				}

				const tokenData = await response.json();

				logger.success('useHybridFlow', 'Code exchanged successfully', {
					hasAccessToken: !!tokenData.access_token,
					hasIdToken: !!tokenData.id_token,
					hasRefreshToken: !!tokenData.refresh_token,
				});

				// Merge with existing tokens (from fragment)
				setTokensState((prev) => ({
					...prev,
					...tokenData,
				}));

				v4ToastManager.showSuccess('Authorization code exchanged successfully!');
			} catch (err: any) {
				const errorMsg = err.message || 'Failed to exchange authorization code';
				logger.error(
					'useHybridFlow',
					'Code exchange failed',
					undefined,
					err instanceof Error ? err : undefined
				);
				setError(errorMsg);
				v4ToastManager.showError(errorMsg);
				throw err;
			} finally {
				setIsExchangingCode(false);
			}
		},
		[credentials]
	);

	const reset = useCallback(() => {
		logger.info('useHybridFlow', 'Resetting hybrid flow state');
		setAuthorizationUrl(null);
		setTokensState(null);
		setState(null);
		setNonce(null);
		setError(null);
		setIsLoading(false);
		setIsExchangingCode(false);
		sessionStorage.removeItem('hybrid_state');
		sessionStorage.removeItem('hybrid_nonce');
	}, []);

	return {
		credentials,
		setCredentials,
		authorizationUrl,
		generateAuthorizationUrl,
		tokens,
		setTokens,
		state,
		nonce,
		isLoading,
		isExchangingCode,
		error,
		setError,
		reset,
		exchangeCodeForTokens,
	};
};
