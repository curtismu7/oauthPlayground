// src/hooks/useHybridFlowController.ts
/**
 * Hybrid Flow Controller Hook - V6 Architecture
 *
 * Modern controller for OIDC Hybrid Flow V6 with service-based architecture
 * Follows the same patterns as useAuthorizationCodeFlowController
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowCredentialService } from '../services/flowCredentialService';
import {
	HybridFlowConfig,
	HybridFlowCredentialsSync,
	HybridFlowDefaults,
	HybridFlowTokenProcessor,
	HybridFlowVariant,
	HybridTokens,
	log,
} from '../services/hybridFlowSharedService';
import { StepCredentials } from '../types/flowTypes';
import { credentialManager } from '../utils/credentialManager';
import {
	auditRedirectUri,
	clearRedirectUri,
	getStoredRedirectUri,
	storeRedirectUriFromAuthUrl,
} from '../utils/redirectUriHelpers';
import { safeSessionStorageParse } from '../utils/secureJson';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface HybridFlowControllerOptions {
	flowKey?: string;
	defaultFlowVariant?: HybridFlowVariant;
	enableDebugger?: boolean;
}

type CredentialsUpdater = StepCredentials | ((prev: StepCredentials | null) => StepCredentials);

export interface HybridFlowController {
	// Credentials
	credentials: StepCredentials | null;
	setCredentials: (updater: CredentialsUpdater) => void;
	saveCredentials: () => Promise<void>;
	hasValidCredentials: boolean;

	// Flow Configuration
	flowConfig: HybridFlowConfig | null;
	setFlowVariant: (variant: HybridFlowVariant) => void;
	flowVariant: HybridFlowVariant;

	// PKCE
	pkceCodes: { codeVerifier: string; codeChallenge: string } | null;
	generatePKCE: () => Promise<void>;
	clearPKCE: () => void;

	// State & Nonce
	state: string | null;
	nonce: string | null;
	generateState: () => void;
	generateNonce: () => void;

	// Authorization URL
	authorizationUrl: string | null;
	generateAuthorizationUrl: () => string | null;

	// Tokens
	tokens: HybridTokens | null;
	setTokens: (tokens: HybridTokens) => void;
	processFragmentTokens: (fragment: string) => HybridTokens;
	mergeTokens: (fragmentTokens: HybridTokens, exchangeTokens: HybridTokens) => HybridTokens;

	// Code Exchange
	isExchangingCode: boolean;
	exchangeCodeForTokens: (code: string) => Promise<HybridTokens>;

	// Loading States
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;

	// Error Handling
	error: string | null;
	setError: (error: string | null) => void;
	clearError: () => void;

	// Flow Control
	reset: () => void;
	persistKey: string;
}

// Generate cryptographically secure random string
const generateRandomString = (length: number = 32): string => {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Generate PKCE codes
const generatePKCE = async (): Promise<{ codeVerifier: string; codeChallenge: string }> => {
	const codeVerifier = generateRandomString(64);
	const encoder = new TextEncoder();
	const data = encoder.encode(codeVerifier);
	const digest = await crypto.subtle.digest('SHA-256', data);
	const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');

	return { codeVerifier, codeChallenge };
};

export const useHybridFlowController = (
	options: HybridFlowControllerOptions = {}
): HybridFlowController => {
	const {
		flowKey = 'hybrid-flow-v6',
		defaultFlowVariant = 'code-id-token',
		enableDebugger = false,
	} = options;

	const _navigate = useNavigate();
	const persistKey = flowKey;

	// Flow Configuration
	const [flowVariant, setFlowVariant] = useState<HybridFlowVariant>(defaultFlowVariant);
	const [flowConfig, setFlowConfig] = useState<HybridFlowConfig | null>(null);

	// Credentials
	const [credentials, setCredentialsState] = useState<StepCredentials | null>(null);
	const [hasValidCredentials, setHasValidCredentials] = useState(false);

	// PKCE
	const [pkceCodes, setPkceCodes] = useState<{
		codeVerifier: string;
		codeChallenge: string;
	} | null>(null);

	// State & Nonce
	const [state, setState] = useState<string | null>(null);
	const [nonce, setNonce] = useState<string | null>(null);

	// Authorization URL
	const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);

	// Tokens
	const [tokens, setTokensState] = useState<HybridTokens | null>(null);

	// Loading States
	const [isLoading, setIsLoading] = useState(false);
	const [isExchangingCode, setIsExchangingCode] = useState(false);

	// Error Handling
	const [error, setError] = useState<string | null>(null);

	// Refs for cleanup
	const isMountedRef = useRef(true);

	// Initialize flow config when variant changes
	useEffect(() => {
		const config = HybridFlowDefaults.getFlowConfig(flowVariant);
		setFlowConfig(config);
		log.info('Flow config updated', { variant: flowVariant, config });
	}, [flowVariant]);

	// Load saved credentials on mount using FlowCredentialService
	useEffect(() => {
		const loadData = async () => {
			try {
				const { credentials: loadedCreds, hasSharedCredentials } =
					await FlowCredentialService.loadFlowCredentials<HybridFlowConfig>({
						flowKey: persistKey,
						defaultCredentials: {
							...HybridFlowDefaults.getDefaultCredentials(flowVariant),
							responseType: flowConfig?.responseType || 'code id_token',
						},
					});

				if (loadedCreds) {
					setCredentialsState(loadedCreds);
					setHasValidCredentials(true);
					log.info('Loaded saved credentials from FlowCredentialService', {
						hasSharedCredentials,
						environmentId: loadedCreds.environmentId,
						clientId: `${loadedCreds.clientId?.substring(0, 8)}...`,
						responseType: loadedCreds.responseType,
					});
				}
			} catch (error) {
				log.error('Failed to load credentials', error);
			}
		};

		loadData();
	}, [flowVariant, flowConfig, persistKey]);

	// Load PKCE codes from session storage
	useEffect(() => {
		const pkce = safeSessionStorageParse<{ codeVerifier: string; codeChallenge: string } | null>(
			`${persistKey}-pkce`,
			null
		);
		if (pkce) {
			setPkceCodes(pkce);
			log.info('Loaded PKCE codes from session storage');
		}
	}, [persistKey]);

	// Persist PKCE codes to session storage
	useEffect(() => {
		if (pkceCodes) {
			sessionStorage.setItem(`${persistKey}-pkce`, JSON.stringify(pkceCodes));
			log.info('PKCE codes persisted to session storage');
		}
	}, [pkceCodes, persistKey]);

	// Load tokens from session storage
	useEffect(() => {
		const tokens = safeSessionStorageParse<HybridTokens | null>(`${persistKey}-tokens`, null);
		if (tokens) {
			setTokensState(tokens);
			log.info('Loaded tokens from session storage');
		}
	}, [persistKey]);

	// Persist tokens to session storage
	useEffect(() => {
		if (tokens) {
			sessionStorage.setItem(`${persistKey}-tokens`, JSON.stringify(tokens));
			log.info('Tokens persisted to session storage');
		}
	}, [tokens, persistKey]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Set credentials with validation
	const setCredentials = useCallback(
		(updater: CredentialsUpdater) => {
			setCredentialsState((prevCredentials: StepCredentials | null) => {
				const resolved =
					typeof updater === 'function'
						? (updater as (prev: StepCredentials | null) => StepCredentials)(prevCredentials)
						: updater;

				const isValid = !!(resolved.environmentId && resolved.clientId);
				setHasValidCredentials(isValid);

				HybridFlowCredentialsSync.syncCredentials(flowVariant, resolved);

				const clientIdPreview = resolved.clientId
					? `${resolved.clientId.substring(0, 8)}...`
					: undefined;
				log.info('Credentials updated', {
					environmentId: resolved.environmentId,
					clientId: clientIdPreview,
					responseType: resolved.responseType,
					isValid,
				});

				return resolved;
			});
		},
		[flowVariant]
	);

	// Save credentials using FlowCredentialService
	const saveCredentials = useCallback(async (): Promise<void> => {
		if (!credentials) {
			throw new Error('No credentials to save');
		}

		try {
			setIsLoading(true);
			const success = await FlowCredentialService.saveFlowCredentials(
				persistKey,
				credentials,
				flowConfig || undefined
			);

			if (success) {
				log.success('Credentials saved via FlowCredentialService');

				// CRITICAL: Also save to authz flow credentials for callback page to load
				credentialManager.saveAuthzFlowCredentials({
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					redirectUri: credentials.redirectUri,
					scopes: credentials.scopes,
					authEndpoint: credentials.authEndpoint,
					tokenEndpoint: credentials.tokenEndpoint,
					userInfoEndpoint: credentials.userInfoEndpoint,
				});
				log.success('Credentials saved to authz flow storage for callback');
			} else {
				throw new Error('Failed to save credentials');
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to save credentials';
			log.error('Failed to save credentials', error);
			v4ToastManager.showError(errorMsg);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [credentials, flowConfig, persistKey]);

	// Generate PKCE codes
	const generatePKCECodes = useCallback(async (): Promise<void> => {
		try {
			setIsLoading(true);
			const pkce = await generatePKCE();
			setPkceCodes(pkce);
			log.success('PKCE codes generated', {
				codeVerifierLength: pkce.codeVerifier.length,
				codeChallengeLength: pkce.codeChallenge.length,
			});
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to generate PKCE codes';
			log.error('Failed to generate PKCE codes', error);
			v4ToastManager.showError(errorMsg);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Clear PKCE codes
	const clearPKCE = useCallback(() => {
		setPkceCodes(null);
		sessionStorage.removeItem(`${persistKey}-pkce`);
		log.info('PKCE codes cleared');
	}, [persistKey]);

	// Generate state parameter
	const generateState = useCallback(() => {
		const newState = generateRandomString(32);
		setState(newState);
		sessionStorage.setItem(`${persistKey}-state`, newState);
		log.info('State parameter generated');
	}, [persistKey]);

	// Generate nonce parameter
	const generateNonce = useCallback(() => {
		const newNonce = generateRandomString(32);
		setNonce(newNonce);
		sessionStorage.setItem(`${persistKey}-nonce`, newNonce);
		log.info('Nonce parameter generated');
	}, [persistKey]);

	// Generate authorization URL
	const generateAuthUrl = useCallback((): string | null => {
		if (!credentials || !flowConfig) {
			log.warn('Cannot generate authorization URL: missing credentials or flow config');
			return null;
		}

		try {
			const params = new URLSearchParams({
				client_id: credentials.clientId,
				redirect_uri: credentials.redirectUri || 'https://localhost:3002/hybrid-callback',
				response_type: flowConfig.responseType,
				scope: credentials.scope || 'openid profile email',
				response_mode: flowConfig.responseMode,
			});

			// Add state parameter
			if (state) {
				params.append('state', state);
			}

			// Add nonce parameter (required for ID token)
			if (flowConfig.requiresNonce && nonce) {
				params.append('nonce', nonce);
			}

			// Add PKCE parameters
			if (flowConfig.supportsPKCE && pkceCodes) {
				params.append('code_challenge', pkceCodes.codeChallenge);
				params.append('code_challenge_method', 'S256');
			}

			// Get authorization endpoint from credentials
			const authEndpoint =
				credentials.authorizationEndpoint || 'https://auth.pingone.com/oauth2/authorize';
			const url = `${authEndpoint}?${params.toString()}`;

			setAuthorizationUrl(url);

			// ✅ CRITICAL: Store the EXACT redirect_uri from the URL for token exchange
			storeRedirectUriFromAuthUrl(url, flowKey);
			const redirectUri = credentials.redirectUri || 'https://localhost:3002/hybrid-callback';
			auditRedirectUri('authorization', redirectUri, flowKey);

			log.success('Authorization URL generated', {
				responseType: flowConfig.responseType,
				hasState: !!state,
				hasNonce: !!nonce,
				hasPKCE: !!pkceCodes,
			});

			return url;
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : 'Failed to generate authorization URL';
			log.error('Failed to generate authorization URL', error);
			v4ToastManager.showError(errorMsg);
			return null;
		}
	}, [credentials, flowConfig, state, nonce, pkceCodes, flowKey]);

	// Set tokens
	const setTokens = useCallback((newTokens: HybridTokens) => {
		setTokensState(newTokens);
		log.success('Tokens updated', {
			hasAccessToken: !!newTokens.access_token,
			hasIdToken: !!newTokens.id_token,
			hasRefreshToken: !!newTokens.refresh_token,
			hasCode: !!newTokens.code,
		});
	}, []);

	// Process fragment tokens
	const processFragmentTokens = useCallback(
		(fragment: string): HybridTokens => {
			const tokens = HybridFlowTokenProcessor.processFragmentTokens(fragment);
			setTokens(tokens);
			return tokens;
		},
		[setTokens]
	);

	// Merge tokens from fragment and exchange
	const mergeTokens = useCallback(
		(fragmentTokens: HybridTokens, exchangeTokens: HybridTokens): HybridTokens => {
			const merged = HybridFlowTokenProcessor.mergeTokens(fragmentTokens, exchangeTokens);
			setTokens(merged);
			return merged;
		},
		[setTokens]
	);

	// Exchange code for tokens
	const exchangeCodeForTokens = useCallback(
		async (code: string): Promise<HybridTokens> => {
			if (!credentials) {
				throw new Error('No credentials available for token exchange');
			}

			try {
				setIsExchangingCode(true);
				setError(null);

				// ✅ CRITICAL FIX: Use the EXACT redirect_uri from the authorization request
				const actualRedirectUri = getStoredRedirectUri(
					flowKey,
					credentials.redirectUri || 'https://localhost:3000/hybrid-callback'
				);
				auditRedirectUri('token-exchange', actualRedirectUri, flowKey);

				const _tokenEndpoint = credentials.tokenEndpoint || 'https://auth.pingone.com/oauth2/token';
				const requestBody = new URLSearchParams({
					grant_type: 'authorization_code',
					code: code,
					redirect_uri: actualRedirectUri, // ✅ Use stored value, not credentials
					client_id: credentials.clientId,
				});

				// Add client secret if available
				if (credentials.clientSecret) {
					requestBody.append('client_secret', credentials.clientSecret);
				}

				// Add PKCE code verifier if available
				if (pkceCodes) {
					requestBody.append('code_verifier', pkceCodes.codeVerifier);
				}

				const response = await fetch('/api/token-exchange', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: requestBody.toString(),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
				}

				const tokenData = await response.json();
				const exchangeTokens: HybridTokens = {
					...tokenData,
					code: code, // Include the authorization code
				};

				// Merge with existing tokens if any
				const mergedTokens = tokens ? mergeTokens(tokens, exchangeTokens) : exchangeTokens;

				log.success('Code exchanged for tokens', {
					hasAccessToken: !!mergedTokens.access_token,
					hasIdToken: !!mergedTokens.id_token,
					hasRefreshToken: !!mergedTokens.refresh_token,
				});

				return mergedTokens;
			} catch (error) {
				const errorMsg =
					error instanceof Error ? error.message : 'Failed to exchange authorization code';
				log.error('Code exchange failed', error);
				setError(errorMsg);
				v4ToastManager.showError(errorMsg);
				throw error;
			} finally {
				setIsExchangingCode(false);
			}
		},
		[credentials, pkceCodes, tokens, mergeTokens, flowKey]
	);

	// Clear error
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Reset flow
	const reset = useCallback(() => {
		log.info('Resetting hybrid flow');

		setCredentialsState(null);
		setHasValidCredentials(false);
		setFlowVariant(defaultFlowVariant);
		setFlowConfig(null);
		setPkceCodes(null);
		setState(null);
		setNonce(null);
		setAuthorizationUrl(null);
		setTokensState(null);
		setError(null);
		setIsLoading(false);
		setIsExchangingCode(false);

		// Clear session storage
		sessionStorage.removeItem(`${persistKey}-pkce`);
		sessionStorage.removeItem(`${persistKey}-state`);
		sessionStorage.removeItem(`${persistKey}-nonce`);

		// ✅ Clear stored redirect_uri to prevent stale values
		clearRedirectUri(flowKey);
		sessionStorage.removeItem(`${persistKey}-tokens`);
	}, [defaultFlowVariant, persistKey, flowKey]);

	return {
		// Credentials
		credentials,
		setCredentials,
		saveCredentials,
		hasValidCredentials,

		// Flow Configuration
		flowConfig,
		setFlowVariant,
		flowVariant,

		// PKCE
		pkceCodes,
		generatePKCE: generatePKCECodes,
		clearPKCE,

		// State & Nonce
		state,
		nonce,
		generateState,
		generateNonce,

		// Authorization URL
		authorizationUrl,
		generateAuthorizationUrl: generateAuthUrl,

		// Tokens
		tokens,
		setTokens,
		processFragmentTokens,
		mergeTokens,

		// Code Exchange
		isExchangingCode,
		exchangeCodeForTokens,

		// Loading States
		isLoading,
		setIsLoading,

		// Error Handling
		error,
		setError,
		clearError,

		// Flow Control
		reset,
		persistKey,
	};
};
