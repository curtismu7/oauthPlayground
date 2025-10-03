// src/hooks/useAuthorizationCodeFlowController.ts

import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import type { FlowConfig } from '../components/FlowConfiguration';
import type { PKCECodes, StepCredentials } from '../components/steps/CommonSteps';
import { trackTokenOperation } from '../utils/activityTracker';
import { getCallbackUrlForFlow } from '../utils/callbackUrls';
import { applyClientAuthentication } from '../utils/clientAuthentication';
import { credentialManager } from '../utils/credentialManager';
import { enhancedDebugger } from '../utils/enhancedDebug';
import { getDefaultConfig } from '../utils/flowConfigDefaults';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';
import { safeJsonParse } from '../utils/secureJson';
import { storeOAuthTokens, rehydrateOAuthTokens } from '../utils/tokenStorage';
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
		loginHint: loaded.loginHint || '',
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
		// Try to load PKCE codes from sessionStorage first using flow-specific key
		const pkceStorageKey = `${persistKey}-pkce-codes`;
		const stored = sessionStorage.getItem(pkceStorageKey);
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
			const pkceStorageKey = `${persistKey}-pkce-codes`;
			sessionStorage.setItem(pkceStorageKey, JSON.stringify(pkceCodes));
			console.log('💾 [useAuthorizationCodeFlowController] PKCE codes persisted to sessionStorage');
		}
	}, [pkceCodes, persistKey]);

	const [authUrl, setAuthUrl] = useState('');
	const [showUrlExplainer, setShowUrlExplainer] = useState(false);
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [authCode, setAuthCode] = useState('');
	const [tokens, setTokens] = useState<AuthorizationTokens | null>(() => {
		const stored = rehydrateOAuthTokens();
		return stored ? (stored as AuthorizationTokens) : null;
	});
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
					return;
				}
			}
		}

		const fallback = rehydrateOAuthTokens();
		if (fallback) {
			setTokens(fallback as AuthorizationTokens);
			setRefreshToken(fallback.refresh_token || '');
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

		// Load PingOne application configuration for PAR and other advanced settings
		let pingOneConfig = null;
		try {
			// Try both possible config keys (for different flow variants)
			const possibleKeys = [
				`${persistKey}-app-config`,
				`${flowKey}-app-config`,
				'pingone-app-config' // fallback
			];

			for (const configKey of possibleKeys) {
				const storedConfig = sessionStorage.getItem(configKey);
				if (storedConfig) {
					pingOneConfig = JSON.parse(storedConfig);
					console.log('🔧 [useAuthorizationCodeFlowController] Loaded PingOne config:', {
						key: configKey,
						config: pingOneConfig
					});
					break;
				}
			}
		} catch (error) {
			console.warn('🔧 [useAuthorizationCodeFlowController] Failed to load PingOne config:', error);
		}

		let url: string;

		// Check if PAR (Pushed Authorization Request) is required
		if (pingOneConfig?.requirePushedAuthorizationRequest) {
			console.log('🔗 [useAuthorizationCodeFlowController] PAR is required, generating PAR request');
			try {
				// Import PAR service dynamically to avoid circular dependencies
				const { PARService } = await import('../services/parService');

				// Create PAR service with actual environment ID
				const parService = new PARService(credentials.environmentId || 'default-environment');

				// Create PAR request
				const parRequest = {
					clientId: credentials.clientId,
					environmentId: credentials.environmentId || '',
					responseType: pingOneConfig.responseTypeCode !== false ? 'code' : 'token',
					redirectUri: credentials.redirectUri,
					scope: credentials.scope || 'openid',
					state,
					nonce: pingOneConfig.nonce,
					codeChallenge: pkceCodes.codeChallenge,
					codeChallengeMethod: pkceCodes.codeChallengeMethod || 'S256',
					acrValues: pingOneConfig.acrValues,
					prompt: pingOneConfig.prompt,
					maxAge: pingOneConfig.maxAge,
					uiLocales: pingOneConfig.uiLocales,
					claims: pingOneConfig.claims,
				};

				// Determine authentication method for PAR
				let authMethod = 'CLIENT_SECRET_POST';
				if (pingOneConfig.clientAuthMethod === 'client_secret_basic') {
					authMethod = 'CLIENT_SECRET_BASIC';
				} else if (pingOneConfig.clientAuthMethod === 'client_secret_jwt') {
					authMethod = 'CLIENT_SECRET_JWT';
				} else if (pingOneConfig.clientAuthMethod === 'private_key_jwt') {
					authMethod = 'PRIVATE_KEY_JWT';
				}

				const parAuthMethod = {
					type: authMethod as any,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					privateKey: pingOneConfig.privateKey,
					keyId: pingOneConfig.keyId,
				};

				// Make PAR request
				const parResponse = await parService.generatePARRequest(parRequest, parAuthMethod);

				// Generate authorization URL with request_uri
				url = parService.generateAuthorizationURL(parResponse.requestUri, {
					client_id: credentials.clientId,
				});

				console.log('🔗 [useAuthorizationCodeFlowController] Generated PAR authorization URL:', url);
			} catch (error) {
				console.error('❌ [useAuthorizationCodeFlowController] PAR request failed:', error);
				showGlobalError(
					'PAR request failed',
					'Failed to generate pushed authorization request. Please check your PingOne configuration.'
				);
				return;
			}
		} else {
			// Regular authorization URL generation (existing logic)
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
				params.set('scope', pingOneConfig?.scope || credentials.scope || 'openid profile email');
			}

			// Add advanced OIDC parameters if configured
			if (pingOneConfig?.initiateLoginUri) {
				params.set('initiate_login_uri', pingOneConfig.initiateLoginUri);
			}
			if (pingOneConfig?.targetLinkUri) {
				params.set('target_link_uri', pingOneConfig.targetLinkUri);
			}
			if (pingOneConfig?.loginHint) {
				params.set('login_hint', pingOneConfig.loginHint);
			}

			url = `${authEndpoint}?${params.toString()}`;
		}

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
	}, [credentials, pkceCodes, flowVariant, saveStepResult]);

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
	}, [authUrl, saveStepResult, credentials.redirectUri, flowKey]);

	const persistConfig = useCallback(
		(nextConfig: FlowConfig) => {
			if (typeof window === 'undefined') {
				return;
			}
			// Use localStorage instead of sessionStorage to persist across browser refreshes
			localStorage.setItem(configStorageKey, JSON.stringify(nextConfig));
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

			const requestBody: any = {
				grant_type: 'authorization_code',
				code: authCode.trim(),
				redirect_uri: credentials.redirectUri.trim(),
				client_id: credentials.clientId.trim(),
				environment_id: credentials.environmentId.trim(),
				code_verifier: pkceCodes.codeVerifier.trim(),
				client_auth_method: credentials.clientAuthMethod || 'client_secret_post',
				...(credentials.includeX5tParameter && { includeX5tParameter: credentials.includeX5tParameter }),
			};

			// Handle JWT-based authentication methods
			const authMethod = credentials.clientAuthMethod || 'client_secret_post';
			if (authMethod === 'client_secret_jwt' || authMethod === 'private_key_jwt') {
				console.log(`🔐 [useAuthorizationCodeFlowController] Using ${authMethod} authentication`);

				try {
					const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
					const baseParams = new URLSearchParams();

					const authResult = await applyClientAuthentication(
						{
							method: authMethod as any,
							clientId: credentials.clientId,
							clientSecret:
								authMethod === 'client_secret_jwt' ? credentials.clientSecret : undefined,
							privateKey: authMethod === 'private_key_jwt' ? credentials.privateKey : undefined,
							keyId: credentials.keyId,
							tokenEndpoint,
						},
						baseParams
					);

					// Add JWT assertion to request body
					requestBody.client_assertion_type = authResult.body.get('client_assertion_type');
					requestBody.client_assertion = authResult.body.get('client_assertion');

					console.log('✅ [useAuthorizationCodeFlowController] JWT assertion generated:', {
						assertionType: requestBody.client_assertion_type,
						assertionLength: requestBody.client_assertion?.length || 0,
					});
				} catch (error) {
					console.error('❌ [useAuthorizationCodeFlowController] JWT generation failed:', error);
					throw new Error(
						`JWT generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
				}
			} else {
				// For client_secret_basic and client_secret_post, include client_secret
				requestBody.client_secret = credentials.clientSecret.trim();
			}

			console.log('🔍 [useAuthorizationCodeFlowController] Token exchange request:', {
				url: `${backendUrl}/api/token-exchange`,
				grant_type: 'authorization_code',
				code: authCode ? `${authCode.substring(0, 10)}...` : 'MISSING',
				redirect_uri: credentials.redirectUri,
				client_id: credentials.clientId,
				environment_id: credentials.environmentId,
				client_auth_method: authMethod,
				code_verifier: pkceCodes.codeVerifier
					? `${pkceCodes.codeVerifier.substring(0, 10)}...`
					: 'MISSING',
				has_jwt_assertion: !!requestBody.client_assertion,
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

			// Show user-friendly error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Parse specific error types for better user feedback
			if (errorMessage.includes('401') && errorMessage.includes('invalid_client')) {
				showGlobalError(
					'Authentication Failed',
					'The client credentials are invalid or the authentication method is not supported. Please check your Client ID and Client Secret configuration in PingOne.'
				);
			} else if (errorMessage.includes('401')) {
				showGlobalError(
					'Unauthorized',
					'Authentication failed. Please verify your PingOne credentials and application configuration.'
				);
			} else {
				showGlobalError('Token Exchange Failed', errorMessage);
			}

			// Re-throw the error so the calling component can handle it
			throw error;
		} finally {
			setIsExchangingTokens(false);
		}
	}, [authCode, credentials, pkceCodes, saveStepResult, flowVariant]);

	const fetchUserInfo = async () => {
		console.log('🔍 [fetchUserInfo] Starting user info fetch:', {
			hasAccessToken: !!tokens?.access_token,
			userInfoEndpoint: credentials.userInfoEndpoint,
			environmentId: credentials.environmentId,
		});

		if (!tokens?.access_token) {
			console.error('❌ [fetchUserInfo] No access token available');
			showGlobalError('Missing access token', 'Exchange tokens first.');
			return;
		}

		const userInfoEndpoint = credentials.userInfoEndpoint;
		if (!userInfoEndpoint) {
			console.error('❌ [fetchUserInfo] No userinfo endpoint configured');
			showGlobalError(
				'Missing user info endpoint',
				'Configure PingOne user info endpoint in credentials.'
			);
			return;
		}

		console.log('✅ [fetchUserInfo] Fetching from:', userInfoEndpoint);
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

			const requestBody: any = {
				grant_type: 'refresh_token',
				refresh_token: refreshToken.trim(),
				client_id: credentials.clientId.trim(),
				environment_id: credentials.environmentId.trim(),
				client_auth_method: credentials.clientAuthMethod || 'client_secret_post',
				...(credentials.includeX5tParameter && { includeX5tParameter: credentials.includeX5tParameter }),
			};

			// Handle JWT-based authentication methods
			const authMethod = credentials.clientAuthMethod || 'client_secret_post';
			if (authMethod === 'client_secret_jwt' || authMethod === 'private_key_jwt') {
				console.log(`🔐 [useAuthorizationCodeFlowController] Using ${authMethod} for refresh`);

				try {
					const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
					const baseParams = new URLSearchParams();

					const authResult = await applyClientAuthentication(
						{
							method: authMethod as any,
							clientId: credentials.clientId,
							clientSecret:
								authMethod === 'client_secret_jwt' ? credentials.clientSecret : undefined,
							privateKey: authMethod === 'private_key_jwt' ? credentials.privateKey : undefined,
							keyId: credentials.keyId,
							tokenEndpoint,
						},
						baseParams
					);

					requestBody.client_assertion_type = authResult.body.get('client_assertion_type');
					requestBody.client_assertion = authResult.body.get('client_assertion');
				} catch (error) {
					throw new Error(
						`JWT generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
				}
			} else {
				// For client_secret_basic and client_secret_post
				requestBody.client_secret = credentials.clientSecret.trim();
			}

			console.log('🔍 [useAuthorizationCodeFlowController] Refresh token request:', {
				url: `${backendUrl}/api/token-exchange`,
				grant_type: 'refresh_token',
				refresh_token: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'MISSING',
				client_id: credentials.clientId,
				environment_id: credentials.environmentId,
				client_auth_method: authMethod,
				has_jwt_assertion: !!requestBody.client_assertion,
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
	}, [refreshToken, credentials, saveStepResult, flowVariant]);

	const saveCredentials = useCallback(async () => {
		setIsSavingCredentials(true);

		try {
			console.log('💾 [useAuthorizationCodeFlowController] Saving credentials...');
			await credentialManager.saveAuthzFlowCredentials(credentials);
			setHasCredentialsSaved(true);
			setHasUnsavedCredentialChanges(false);
			originalCredentialsRef.current = { ...credentials };

			// Clear cache to ensure fresh data is loaded
			credentialManager.clearCache();

			// Dispatch events to notify dashboard and other components
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
			console.log('📢 [useAuthorizationCodeFlowController] Configuration change events dispatched');

			saveStepResult('save-credentials', {
				...credentials,
				timestamp: Date.now(),
			});
			console.log('✅ [useAuthorizationCodeFlowController] Credentials saved successfully');

			// Don't show success message here - let the calling component handle it
			// showGlobalSuccess('Credentials saved', 'PingOne configuration saved successfully.');
		} catch (error) {
			console.error('❌ [useAuthorizationCodeFlowController] Save credentials failed:', error);
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
		const pkceStorageKey = `${persistKey}-pkce-codes`;
		sessionStorage.removeItem(pkceStorageKey);
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
