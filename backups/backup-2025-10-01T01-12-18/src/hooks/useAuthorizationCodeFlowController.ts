// src/hooks/useAuthorizationCodeFlowController.ts

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from 'react';
import type { FlowConfig } from '../components/FlowConfiguration';
import type { PKCECodes, StepCredentials } from '../components/steps/CommonSteps';
import { getCallbackUrlForFlow } from '../utils/callbackUrls';
import { credentialManager } from '../utils/credentialManager';
import { enhancedDebugger } from '../utils/enhancedDebug';
import { getDefaultConfig } from '../utils/flowConfigDefaults';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';
import { safeJsonParse } from '../utils/secureJson';
import { trackOAuthFlow, trackTokenOperation } from '../utils/activityTracker';
import { storeOAuthTokens } from '../utils/tokenStorage';
import { showGlobalError, showGlobalSuccess } from './useNotifications';
import { useAuthorizationFlowScroll } from './usePageScroll';

type FlowVariant = 'oauth' | 'oidc';

export interface AuthorizationCodeFlowControllerOptions {
	flowKey?: string;
	defaultFlowVariant?: FlowVariant;
	enableDebugger?: boolean;
}

export interface AuthorizationTokens {
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	[key: string]: unknown;
}

export interface AuthorizationCodeFlowController {
	flowVariant: FlowVariant;
	setFlowVariant: (variant: FlowVariant) => void;
	persistKey: string;
	credentials: StepCredentials;
	setCredentials: (creds: StepCredentials) => void;
	setFlowConfig: (config: FlowConfig) => void;
	flowConfig: FlowConfig;
	handleFlowConfigChange: (config: FlowConfig) => void;
	pkceCodes: PKCECodes;
	setPkceCodes: Dispatch<SetStateAction<PKCECodes>>;
	generatePkceCodes: () => Promise<void>;
	authUrl: string;
	generateAuthorizationUrl: () => Promise<void>;
	showUrlExplainer: boolean;
	setShowUrlExplainer: (show: boolean) => void;
	isAuthorizing: boolean;
	handlePopupAuthorization: () => void;
	handleRedirectAuthorization: () => void;
	authCode: string;
	setAuthCodeManually: (code: string) => void;
	resetFlow: () => void;
	isExchangingTokens: boolean;
	exchangeTokens: () => Promise<void>;
	tokens: AuthorizationTokens | null;
	userInfo: Record<string, unknown> | null;
	isFetchingUserInfo: boolean;
	fetchUserInfo: () => Promise<void>;
	refreshToken: string;
	isRefreshingTokens: boolean;
	refreshedTokens: AuthorizationTokens | null;
	refreshTokens: () => Promise<void>;
	isSavingCredentials: boolean;
	hasCredentialsSaved: boolean;
	hasUnsavedCredentialChanges: boolean;
	saveCredentials: () => Promise<void>;
	stepManager: ReturnType<typeof useFlowStepManager>;
	saveStepResult: (stepId: string, result: unknown) => void;
	hasStepResult: (stepId: string) => boolean;
	clearStepResults: () => void;
}

const DEFAULT_FLOW_KEY = 'authorization-code-v5';

const getSafeOrigin = (): string => {
	if (typeof window === 'undefined') return 'https://localhost:3000';
	return window.location.origin;
};

const createEmptyCredentials = (): StepCredentials => ({
	environmentId: '',
	clientId: '',
	clientSecret: '',
	redirectUri: `${getSafeOrigin()}/authz-callback`,
	scope: 'openid',
	scopes: 'openid',
	responseType: 'code',
	grantType: 'authorization_code',
	issuerUrl: '',
	authorizationEndpoint: '',
	tokenEndpoint: '',
	userInfoEndpoint: '',
	clientAuthMethod: 'client_secret_post',
});

const resolveAuthEndpoint = (creds: StepCredentials): string => {
	if (creds.authorizationEndpoint) return creds.authorizationEndpoint;
	if (creds.environmentId) {
		return `https://auth.pingone.com/${creds.environmentId}/as/authorize`;
	}
	return '';
};

const resolveTokenEndpoint = (creds: StepCredentials): string => {
	if (creds.tokenEndpoint) return creds.tokenEndpoint;
	if (creds.environmentId) {
		return `https://auth.pingone.com/${creds.environmentId}/as/token`;
	}
	return '';
};

const loadStoredConfig = (storageKey: string, variant: FlowVariant): FlowConfig => {
	if (typeof window === 'undefined') {
		return getDefaultConfig(
			variant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'
		);
	}

	const stored = sessionStorage.getItem(storageKey);
	if (!stored) {
		return getDefaultConfig(
			variant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'
		);
	}

	try {
		const parsed = safeJsonParse<FlowConfig>(stored, getDefaultConfig('oauth-authorization-code'));
		return {
			...getDefaultConfig(
				variant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'
			),
			...parsed,
		};
	} catch {
		return getDefaultConfig(
			variant === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'
		);
	}
};

const loadInitialCredentials = (variant: FlowVariant): StepCredentials => {
	if (typeof window === 'undefined') {
		return createEmptyCredentials();
	}

	const urlParams = new URLSearchParams(window.location.search);
	const urlEnv = urlParams.get('env');
	const urlClient = urlParams.get('client');
	const urlScope = urlParams.get('scope');
	const urlRedirect = urlParams.get('redirect');

	let loaded = credentialManager.loadAuthzFlowCredentials();
	if (!loaded.environmentId || !loaded.clientId) {
		loaded = credentialManager.loadConfigCredentials();
	}
	if (!loaded.environmentId || !loaded.clientId) {
		loaded = credentialManager.loadPermanentCredentials();
	}

	const mergedScopes =
		urlScope ||
		(Array.isArray(loaded.scopes) ? loaded.scopes.join(' ') : loaded.scopes) ||
		(variant === 'oidc' ? 'openid profile email' : 'read write');

	return {
		environmentId: urlEnv || loaded.environmentId || '',
		clientId: urlClient || loaded.clientId || '',
		clientSecret: loaded.clientSecret || '',
		redirectUri: urlRedirect || loaded.redirectUri || getCallbackUrlForFlow('authorization-code'),
		scope: mergedScopes,
		scopes: mergedScopes,
		responseType: 'code',
		grantType: 'authorization_code',
		issuerUrl: loaded.environmentId
			? `https://auth.pingone.com/${loaded.environmentId}`
			: loaded.authEndpoint?.replace('/as/authorize', '') || '',
		authorizationEndpoint: resolveAuthEndpoint({
			environmentId: urlEnv || loaded.environmentId || '',
			authorizationEndpoint: loaded.authEndpoint,
		} as StepCredentials),
		tokenEndpoint: resolveTokenEndpoint({
			environmentId: urlEnv || loaded.environmentId || '',
			tokenEndpoint: loaded.tokenEndpoint,
		} as StepCredentials),
		userInfoEndpoint:
			loaded.userInfoEndpoint ||
			(loaded.environmentId ? `https://auth.pingone.com/${loaded.environmentId}/as/userinfo` : ''),
		clientAuthMethod: loaded.tokenAuthMethod || 'client_secret_post',
	};
};

const getStoredStepResults = (storageKey: string): Record<string, unknown> => {
	if (typeof window === 'undefined') return {};
	const stored = sessionStorage.getItem(storageKey);
	return stored ? safeJsonParse(stored, {}) : {};
};

export const useAuthorizationCodeFlowController = (
	options: AuthorizationCodeFlowControllerOptions = {}
): AuthorizationCodeFlowController => {
	const flowKey = options.flowKey ?? DEFAULT_FLOW_KEY;
	const persistKey = `${flowKey}`;
	const stepResultKey = `${persistKey}-step-results`;
	const configStorageKey = `${persistKey}-config`;

	const [flowVariant, setFlowVariant] = useState<FlowVariant>(options.defaultFlowVariant ?? 'oidc');

	const [credentials, setCredentials] = useState<StepCredentials>(() =>
		loadInitialCredentials(options.defaultFlowVariant ?? 'oidc')
	);

	const [flowConfig, setFlowConfig] = useState<FlowConfig>(() =>
		loadStoredConfig(configStorageKey, options.defaultFlowVariant ?? 'oidc')
	);

	const [pkceCodes, setPkceCodes] = useState<PKCECodes>(() => {
		// Try to load PKCE codes from sessionStorage first
		const stored = sessionStorage.getItem('authorization-code-v5-pkce-codes');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				console.log(
					'🔄 [useAuthorizationCodeFlowController] Loaded PKCE codes from sessionStorage'
				);
				return parsed;
			} catch (error) {
				console.warn(
					'[useAuthorizationCodeFlowController] Failed to parse stored PKCE codes:',
					error
				);
			}
		}
		// Fallback to empty PKCE codes if none stored
		return {
			codeVerifier: '',
			codeChallenge: '',
			codeChallengeMethod: 'S256',
		};
	});

	// Persist PKCE codes to sessionStorage whenever they change
	useEffect(() => {
		if (pkceCodes.codeVerifier && pkceCodes.codeChallenge) {
			sessionStorage.setItem('authorization-code-v5-pkce-codes', JSON.stringify(pkceCodes));
			console.log('💾 [useAuthorizationCodeFlowController] PKCE codes persisted to sessionStorage');
		}
	}, [pkceCodes]);

	const [authUrl, setAuthUrl] = useState('');
	const [showUrlExplainer, setShowUrlExplainer] = useState(false);
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [authCode, setAuthCode] = useState('');
	const [tokens, setTokens] = useState<AuthorizationTokens | null>(null);
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
	const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);
	const [isExchangingTokens, setIsExchangingTokens] = useState(false);
	const [isRefreshingTokens, setIsRefreshingTokens] = useState(false);
	const [refreshedTokens, setRefreshedTokens] = useState<AuthorizationTokens | null>(null);
	const [refreshToken, setRefreshToken] = useState('');
	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = useState(false);

	const originalCredentialsRef = useRef<StepCredentials | null>(null);
	const popupRef = useRef<Window | null>(null);
	useAuthorizationFlowScroll('Authorization Code Flow V5');

	// Step management functions (must be defined before useEffects that use them)
	const stepManager = useFlowStepManager(persistKey);
	const stepResultsRef = useRef<Record<string, unknown>>(getStoredStepResults(stepResultKey));

	const persistStepResults = useCallback(() => {
		if (typeof window === 'undefined') {
			return;
		}
		sessionStorage.setItem(stepResultKey, JSON.stringify(stepResultsRef.current ?? {}));
	}, [stepResultKey]);

	const saveStepResult = useCallback(
		(stepId: string, result: unknown) => {
			stepResultsRef.current = {
				...stepResultsRef.current,
				[stepId]: result,
			};
			persistStepResults();
		},
		[persistStepResults]
	);

	const hasStepResult = useCallback((stepId: string) => {
		return Boolean(stepResultsRef.current?.[stepId]);
	}, []);

	const clearStepResults = useCallback(() => {
		stepResultsRef.current = {};
		persistStepResults();
	}, [persistStepResults]);

	useEffect(() => {
		if (!originalCredentialsRef.current) {
			originalCredentialsRef.current = credentials;
		}
	}, [credentials]);

	useEffect(() => {
		const nextValue = loadStoredConfig(configStorageKey, flowVariant);
		setFlowConfig((prev) => ({ ...nextValue, ...prev }));
	}, [flowVariant, configStorageKey]);

	useEffect(() => {
		const sessionId = options.enableDebugger
			? enhancedDebugger.startSession(`${flowVariant}-authorization-code-v5`)
			: null;
		return () => {
			if (sessionId) {
				enhancedDebugger.endSession();
			}
		};
	}, [options.enableDebugger, flowVariant]);

	useEffect(() => {
		const detectCallback = () => {
			if (typeof window === 'undefined') {
				return;
			}
			const url = new URL(window.location.href);
			const codeParam = url.searchParams.get('code');
			const stateParam = url.searchParams.get('state');
			const errorParam = url.searchParams.get('error');

			if (errorParam) {
				showGlobalError(
					'Authorization error',
					url.searchParams.get('error_description') || errorParam
				);
				return;
			}

			if (codeParam) {
				setAuthCode(codeParam);
				saveStepResult('handle-callback', {
					code: codeParam,
					state: stateParam,
					timestamp: Date.now(),
				});
				url.searchParams.delete('code');
				url.searchParams.delete('state');
				url.searchParams.delete('error');
				window.history.replaceState({}, document.title, url.toString());
			}
		};

		detectCallback();
	}, [saveStepResult]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const stored = sessionStorage.getItem(stepResultKey);
		if (stored) {
			const parsed = safeJsonParse<Record<string, unknown>>(stored, {});
			if (parsed.exchangeTokens) {
				const previousTokens = safeJsonParse<AuthorizationTokens | null>(
					JSON.stringify(parsed.exchangeTokens),
					null
				);
				if (previousTokens) {
					setTokens(previousTokens);
					setRefreshToken(previousTokens.refresh_token || '');
				}
			}
		}
	}, [stepResultKey]);

	useEffect(() => {
		if (!originalCredentialsRef.current) {
			return;
		}
		const hasChanges = Object.keys(credentials).some((key) => {
			const typedKey = key as keyof StepCredentials;
			return credentials[typedKey] !== originalCredentialsRef.current?.[typedKey];
		});
		setHasUnsavedCredentialChanges(hasChanges);
	}, [
		credentials.environmentId,
		credentials.clientId,
		credentials.clientSecret,
		credentials.scopes,
		credentials.redirectUri,
	]);

	const generatePkceCodes = useCallback(async () => {
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);
			setPkceCodes({
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256',
			});
			saveStepResult('generate-pkce', {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256',
				timestamp: Date.now(),
			});
		} catch (error) {
			console.error('[useAuthorizationCodeFlowController] PKCE generation failed:', error);
			showGlobalError('PKCE generation failed', 'Failed to generate secure PKCE codes.');
		}
	}, [saveStepResult]);

	const generateAuthorizationUrl = useCallback(async () => {
		const authEndpoint = resolveAuthEndpoint(credentials);
		if (!authEndpoint) {
			showGlobalError(
				'Missing authorization endpoint',
				'Configure PingOne environment ID or authorization endpoint.'
			);
			return;
		}

		if (!credentials.clientId) {
			showGlobalError('Missing client ID', 'Configure PingOne client ID.');
			return;
		}

		if (!credentials.redirectUri) {
			showGlobalError('Missing redirect URI', 'Configure PingOne redirect URI.');
			return;
		}

		if (!pkceCodes.codeVerifier || !pkceCodes.codeChallenge) {
			throw new Error('PKCE parameters not generated. Please generate PKCE codes first.');
		}

		const state =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		// Build response_type based on configuration
		const responseTypes = [];
		if (credentials.responseTypeCode !== false) responseTypes.push('code'); // Default to true if not specified
		if (credentials.responseTypeToken) responseTypes.push('token');
		if (credentials.responseTypeIdToken) responseTypes.push('id_token');
		const responseType = responseTypes.length > 0 ? responseTypes.join(' ') : 'code';

		const params = new URLSearchParams({
			response_type: responseType,
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			scope: credentials.scope || 'openid',
			state,
		});

		// Add PKCE parameters if using authorization code flow (default behavior)
		if (responseType.includes('code')) {
			params.set('code_challenge', pkceCodes.codeChallenge);
			params.set('code_challenge_method', pkceCodes.codeChallengeMethod || 'S256');
		}

		// Add OIDC-specific parameters
		if (flowVariant === 'oidc') {
			params.set('scope', credentials.scope || 'openid profile email');
		}

		// Add advanced OIDC parameters if configured
		if (credentials.initiateLoginUri) {
			params.set('initiate_login_uri', credentials.initiateLoginUri);
		}
		if (credentials.targetLinkUri) {
			params.set('target_link_uri', credentials.targetLinkUri);
		}
		if (credentials.loginHint) {
			params.set('login_hint', credentials.loginHint);
		}

		const url = `${authEndpoint}?${params.toString()}`;
		setAuthUrl(url);

		// Store state in sessionStorage for callback validation
		sessionStorage.setItem('oauth_state', state);
		console.log('🔧 [useAuthorizationCodeFlowController] Stored state for validation:', state);

		saveStepResult('generate-auth-url', {
			url,
			state,
			codeChallenge: pkceCodes.codeChallenge,
			codeChallengeMethod: pkceCodes.codeChallengeMethod,
			timestamp: Date.now(),
		});
	}, [credentials, pkceCodes, flowVariant, generatePkceCodes, saveStepResult]);

	const clearPopupInterval = useRef<number | null>(null);

	const stopPopupWatch = () => {
		if (clearPopupInterval.current) {
			window.clearInterval(clearPopupInterval.current);
			clearPopupInterval.current = null;
		}
	};

	const handlePopupAuthorization = useCallback(() => {
		if (!authUrl) {
			showGlobalError(
				'Authorization URL missing',
				'Generate the authorization URL before starting the flow.'
			);
			return;
		}

		if (popupRef.current && !popupRef.current.closed) {
			popupRef.current.focus();
			return;
		}

		setIsAuthorizing(true);
		popupRef.current = window.open(authUrl, 'oauth-popup', 'width=600,height=700');

		clearPopupInterval.current = window.setInterval(() => {
			if (!popupRef.current || popupRef.current.closed) {
				setIsAuthorizing(false);
				stopPopupWatch();
			}
		}, 400);

		saveStepResult('user-authorization', {
			method: 'popup',
			timestamp: Date.now(),
		});
	}, [authUrl, saveStepResult, stopPopupWatch]);

	const handleRedirectAuthorization = useCallback(() => {
		if (!authUrl) {
			showGlobalError(
				'Authorization URL missing',
				'Generate the authorization URL before starting the flow.'
			);
			return;
		}

		// Set flow context for callback handling
		const flowContext = {
			flow: flowKey,
			returnPath: `/flows/${flowKey}?step=4`,
			redirectUri: credentials.redirectUri,
			timestamp: Date.now(),
		};
		sessionStorage.setItem('flowContext', JSON.stringify(flowContext));
		console.log(
			'🔧 [useAuthorizationCodeFlowController] Stored flow context for V5 callback:',
			flowContext
		);
		console.log('🔧 [useAuthorizationCodeFlowController] About to redirect to:', authUrl);

		saveStepResult('user-authorization', {
			method: 'redirect',
			timestamp: Date.now(),
		});
		window.location.assign(authUrl);
	}, [authUrl, saveStepResult, credentials.redirectUri]);

	const persistConfig = useCallback(
		(nextConfig: FlowConfig) => {
			if (typeof window === 'undefined') {
				return;
			}
			sessionStorage.setItem(configStorageKey, JSON.stringify(nextConfig));
		},
		[configStorageKey]
	);

	const handleFlowConfigChange = useCallback(
		(nextConfig: FlowConfig) => {
			setFlowConfig(nextConfig);
			persistConfig(nextConfig);
		},
		[persistConfig]
	);

	const exchangeTokens = useCallback(async () => {
		if (!authCode) {
			showGlobalError('Missing authorization code', 'Complete the authorization step first.');
			return;
		}

		if (!credentials.clientId || !credentials.clientSecret) {
			showGlobalError('Missing credentials', 'Configure PingOne client ID and client secret.');
			return;
		}

		if (!credentials.environmentId) {
			showGlobalError('Missing environment ID', 'Configure PingOne environment ID.');
			return;
		}

		setIsExchangingTokens(true);

		try {
			console.log('🔍 [useAuthorizationCodeFlowController] Token exchange debug:', {
				hasAuthCode: !!authCode,
				authCodeLength: authCode?.length || 0,
				hasCodeVerifier: !!pkceCodes.codeVerifier,
				codeVerifierLength: pkceCodes.codeVerifier?.length || 0,
				hasCodeChallenge: !!pkceCodes.codeChallenge,
				codeChallengeLength: pkceCodes.codeChallenge?.length || 0,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				environmentId: credentials.environmentId,
			});

			if (!pkceCodes.codeVerifier) {
				throw new Error('PKCE code verifier is missing. Please generate PKCE parameters first.');
			}

			// Use backend proxy to avoid CORS issues
			const backendUrl =
				process.env.NODE_ENV === 'production' ? 'https://oauth-playground.vercel.app' : ''; // Use relative URL to go through Vite proxy

			const requestBody = {
				grant_type: 'authorization_code',
				code: authCode.trim(),
				redirect_uri: credentials.redirectUri.trim(),
				client_id: credentials.clientId.trim(),
				client_secret: credentials.clientSecret.trim(),
				environment_id: credentials.environmentId.trim(),
				code_verifier: pkceCodes.codeVerifier.trim(),
			};

			console.log('🔍 [useAuthorizationCodeFlowController] Token exchange request:', {
				url: `${backendUrl}/api/token-exchange`,
				grant_type: 'authorization_code',
				code: authCode ? authCode.substring(0, 10) + '...' : 'MISSING',
				redirect_uri: credentials.redirectUri,
				client_id: credentials.clientId,
				environment_id: credentials.environmentId,
				code_verifier: pkceCodes.codeVerifier
					? pkceCodes.codeVerifier.substring(0, 10) + '...'
					: 'MISSING',
			});

			const response = await fetch(`${backendUrl}/api/token-exchange`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
			}

			const tokenData = await response.json();
			setTokens(tokenData);
			setRefreshToken(tokenData.refresh_token || '');

			// Store tokens for persistence
			storeOAuthTokens(tokenData, 'authorization_code', 'Authorization Code Flow V5');

			// Also store in localStorage for cross-tab communication (Token Management page)
			localStorage.setItem('oauth_tokens', JSON.stringify(tokenData));
			localStorage.setItem(
				'flow_source',
				flowVariant === 'oidc' ? 'oidc-authorization-code-v5' : 'oauth-authorization-code-v5'
			);

			saveStepResult('exchange-tokens', {
				...tokenData,
				timestamp: Date.now(),
			});

			// Track successful token exchange
			trackTokenOperation(
				'Exchange',
				true,
				`${flowVariant === 'oidc' ? 'OIDC' : 'OAuth'} Authorization Code`
			);

			// Don't show success message here - let the calling component handle it
			// showGlobalSuccess('Tokens received', 'Authorization code exchanged for tokens successfully.');

			// Return the token data for immediate use
			return tokenData;
		} catch (error) {
			console.error('[useAuthorizationCodeFlowController] Token exchange failed:', error);

			// Track failed token exchange
			trackTokenOperation(
				'Exchange',
				false,
				`${flowVariant === 'oidc' ? 'OIDC' : 'OAuth'} Authorization Code - ${error instanceof Error ? error.message : 'Unknown error'}`
			);

			// Don't show error message here - let the calling component handle it
			// showGlobalError('Token exchange failed', error instanceof Error ? error.message : 'Unknown error');
			// Re-throw the error so the calling component can handle it
			throw error;
		} finally {
			setIsExchangingTokens(false);
		}
	}, [authCode, credentials, pkceCodes, saveStepResult]);

	const fetchUserInfo = async () => {
		if (!tokens?.access_token) {
			showGlobalError('Missing access token', 'Exchange tokens first.');
			return;
		}

		const userInfoEndpoint = credentials.userInfoEndpoint;
		if (!userInfoEndpoint) {
			showGlobalError('Missing user info endpoint', 'Configure PingOne user info endpoint.');
			return;
		}

		setIsFetchingUserInfo(true);

		try {
			const response = await fetch(userInfoEndpoint, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
					Accept: 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`User info request failed: ${response.status}`);
			}

			const userData = await response.json();
			setUserInfo(userData);

			saveStepResult('fetch-user-info', {
				...userData,
				timestamp: Date.now(),
			});

			// Don't show success message here - let the calling component handle it
			// showGlobalSuccess('User info received', 'User information fetched successfully.');
		} catch (error) {
			console.error('[useAuthorizationCodeFlowController] User info fetch failed:', error);
			// Don't show error message here - let the calling component handle it
			// showGlobalError('User info fetch failed', error instanceof Error ? error.message : 'Unknown error');
			// Re-throw the error so the calling component can handle it
			throw error;
		} finally {
			setIsFetchingUserInfo(false);
		}
	};

	const refreshTokens = useCallback(async () => {
		if (!refreshToken) {
			showGlobalError('Missing refresh token', 'No refresh token available.');
			return;
		}

		if (!credentials.clientId || !credentials.clientSecret) {
			showGlobalError('Missing credentials', 'Configure PingOne client ID and client secret.');
			return;
		}

		if (!credentials.environmentId) {
			showGlobalError('Missing environment ID', 'Configure PingOne environment ID.');
			return;
		}

		setIsRefreshingTokens(true);

		try {
			// Use backend proxy to avoid CORS issues
			const backendUrl =
				process.env.NODE_ENV === 'production' ? 'https://oauth-playground.vercel.app' : ''; // Use relative URL to go through Vite proxy

			const requestBody = {
				grant_type: 'refresh_token',
				refresh_token: refreshToken.trim(),
				client_id: credentials.clientId.trim(),
				client_secret: credentials.clientSecret.trim(),
				environment_id: credentials.environmentId.trim(),
			};

			console.log('🔍 [useAuthorizationCodeFlowController] Refresh token request:', {
				url: `${backendUrl}/api/token-exchange`,
				grant_type: 'refresh_token',
				refresh_token: refreshToken ? refreshToken.substring(0, 10) + '...' : 'MISSING',
				client_id: credentials.clientId,
				environment_id: credentials.environmentId,
			});

			const response = await fetch(`${backendUrl}/api/token-exchange`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
			}

			const tokenData = await response.json();
			setRefreshedTokens(tokenData);
			setRefreshToken(tokenData.refresh_token || refreshToken);

			saveStepResult('refresh-tokens', {
				...tokenData,
				timestamp: Date.now(),
			});

			// Track successful token refresh
			trackTokenOperation(
				'Refresh',
				true,
				`${flowVariant === 'oidc' ? 'OIDC' : 'OAuth'} Authorization Code`
			);

			// Don't show success message here - let the calling component handle it
			// showGlobalSuccess('Tokens refreshed', 'Access token refreshed successfully.');
		} catch (error) {
			console.error('[useAuthorizationCodeFlowController] Token refresh failed:', error);

			// Track failed token refresh
			trackTokenOperation(
				'Refresh',
				false,
				`${flowVariant === 'oidc' ? 'OIDC' : 'OAuth'} Authorization Code - ${error instanceof Error ? error.message : 'Unknown error'}`
			);

			// Don't show error message here - let the calling component handle it
			// showGlobalError('Token refresh failed', error instanceof Error ? error.message : 'Unknown error');
			// Re-throw the error so the calling component can handle it
			throw error;
		} finally {
			setIsRefreshingTokens(false);
		}
	}, [refreshToken, credentials, saveStepResult]);

	const saveCredentials = useCallback(async () => {
		setIsSavingCredentials(true);

		try {
			await credentialManager.saveAuthzFlowCredentials(credentials);
			setHasCredentialsSaved(true);
			setHasUnsavedCredentialChanges(false);
			originalCredentialsRef.current = { ...credentials };

			saveStepResult('save-credentials', {
				...credentials,
				timestamp: Date.now(),
			});

			// Don't show success message here - let the calling component handle it
			// showGlobalSuccess('Credentials saved', 'PingOne configuration saved successfully.');
		} catch (error) {
			console.error('[useAuthorizationCodeFlowController] Save credentials failed:', error);
			// Don't show error message here - let the calling component handle it
			// showGlobalError('Save failed', error instanceof Error ? error.message : 'Unknown error');
			// Re-throw the error so the calling component can handle it
			throw error;
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials, saveStepResult]);

	const resetFlow = useCallback(() => {
		setAuthUrl('');
		setAuthCode('');
		setTokens(null);
		setUserInfo(null);
		setRefreshToken('');
		setRefreshedTokens(null);
		setPkceCodes({ codeVerifier: '', codeChallenge: '', codeChallengeMethod: 'S256' });
		setShowUrlExplainer(false);
		stopPopupWatch();
		clearStepResults();
		stepManager.setStep(0, 'reset');
		// Clear PKCE codes from sessionStorage
		sessionStorage.removeItem('authorization-code-v5-pkce-codes');
		showGlobalSuccess('Flow reset', 'Start the authorization sequence again.');
	}, [clearStepResults, stepManager, stopPopupWatch]);

	const setAuthCodeManually = useCallback(
		(code: string) => {
			setAuthCode(code);
			if (code) {
				saveStepResult('handle-callback', {
					code,
					state: 'manual',
					timestamp: Date.now(),
				});
			}
		},
		[saveStepResult]
	);

	return {
		flowVariant,
		setFlowVariant,
		persistKey,
		credentials,
		setCredentials,
		setFlowConfig,
		flowConfig,
		handleFlowConfigChange,
		pkceCodes,
		setPkceCodes,
		generatePkceCodes,
		authUrl,
		generateAuthorizationUrl,
		showUrlExplainer,
		setShowUrlExplainer,
		isAuthorizing,
		handlePopupAuthorization,
		handleRedirectAuthorization,
		authCode,
		setAuthCodeManually,
		resetFlow,
		isExchangingTokens,
		exchangeTokens,
		tokens,
		userInfo,
		isFetchingUserInfo,
		fetchUserInfo,
		refreshToken,
		isRefreshingTokens,
		refreshedTokens,
		refreshTokens,
		isSavingCredentials,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		saveCredentials,
		stepManager,
		saveStepResult,
		hasStepResult,
		clearStepResults,
	};
};
