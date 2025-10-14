// src/hooks/useImplicitFlowController.ts
// Reusable controller hook for Implicit Flow (OAuth and OIDC variants)
// Based on useAuthorizationCodeFlowController but simplified for Implicit flow

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { trackTokenOperation } from '../utils/activityTracker';
import { getCallbackUrlForFlow } from '../utils/callbackUrls';
import { credentialManager } from '../utils/credentialManager';
import { enhancedDebugger } from '../utils/enhancedDebug';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { safeJsonParse } from '../utils/secureJson';
import { storeOAuthTokens } from '../utils/tokenStorage';
import { showGlobalError, showGlobalSuccess } from './useNotifications';
import { useAuthorizationFlowScroll } from './usePageScroll';

// FlowConfig type (simplified for Implicit flow)
interface FlowConfig {
	responseType: string;
	scopes: string[];
	state: string;
	nonce: string;
	pkce: boolean;
	maxAge?: number;
	prompt?: string;
	loginHint?: string;
	acrValues: string[];
	customParams: Record<string, string>;
}

// Helper function to resolve authorization endpoint
const resolveAuthEndpoint = (creds: StepCredentials): string => {
	if (creds.authorizationEndpoint) return creds.authorizationEndpoint;
	if (creds.environmentId) {
		return `https://auth.pingone.com/${creds.environmentId}/as/authorize`;
	}
	return '';
};

export type FlowVariant = 'oauth' | 'oidc';

export interface AuthorizationTokens {
	access_token: string;
	id_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	[key: string]: unknown;
}

export interface ImplicitFlowController {
	flowVariant: FlowVariant;
	setFlowVariant: (variant: FlowVariant) => void;
	persistKey: string;
	credentials: StepCredentials;
	setCredentials: (creds: StepCredentials) => void;
	setFlowConfig: (config: FlowConfig) => void;
	flowConfig: FlowConfig;
	handleFlowConfigChange: (config: FlowConfig) => void;
	nonce: string;
	state: string;
	generateNonce: () => void;
	generateState: () => void;
	authUrl: string;
	generateAuthorizationUrl: () => Promise<void>;
	showUrlExplainer: boolean;
	setShowUrlExplainer: (show: boolean) => void;
	isAuthorizing: boolean;
	handlePopupAuthorization: () => void;
	handleRedirectAuthorization: () => void;
	resetFlow: () => void;
	tokens: AuthorizationTokens | null;
	setTokensFromFragment: (fragment: string) => void;
	userInfo: Record<string, unknown> | null;
	isFetchingUserInfo: boolean;
	fetchUserInfo: () => Promise<void>;
	isSavingCredentials: boolean;
	hasCredentialsSaved: boolean;
	hasUnsavedCredentialChanges: boolean;
	saveCredentials: () => Promise<void>;
	handleCopy: (text: string, label: string) => void;
	copiedField: string | null;
	stepManager: ReturnType<typeof useFlowStepManager>;
	saveStepResult: (stepId: string, result: unknown) => void;
	hasStepResult: (stepId: string) => boolean;
	clearStepResults: () => void;
}

export interface ImplicitFlowControllerOptions {
	flowKey?: string;
	defaultFlowVariant?: FlowVariant;
	enableDebugger?: boolean;
}

const DEFAULT_FLOW_KEY = 'implicit-flow-v5';

const createEmptyCredentials = (): StepCredentials => ({
	environmentId: '',
	clientId: '',
	clientSecret: '', // Not used in Implicit but kept for consistency
	redirectUri: 'https://localhost:3000/oauth-implicit-callback',
	scope: 'openid',
	scopes: 'openid',
	responseType: 'id_token token',
	grantType: '',
	clientAuthMethod: 'none', // Implicit flow doesn't use client authentication
});

const getDefaultConfig = (): FlowConfig => ({
	responseType: 'id_token token',
	scopes: ['openid'],
	state: '',
	nonce: '',
	pkce: false, // No PKCE in Implicit flow
	maxAge: 0,
	prompt: '',
	loginHint: '',
	acrValues: [],
	customParams: {},
});

const loadStoredConfig = (storageKey: string, _variant: FlowVariant): FlowConfig => {
	if (typeof window === 'undefined') {
		return getDefaultConfig();
	}

	try {
		const stored = sessionStorage.getItem(storageKey);
		if (stored) {
			const config = JSON.parse(stored);
			return {
				...getDefaultConfig(),
				...config,
			};
		}
	} catch (error) {
		console.warn('[useImplicitFlowController] Failed to load stored config:', error);
	}

	return getDefaultConfig();
};

const loadInitialCredentials = (variant: FlowVariant, flowKey?: string): StepCredentials => {
	if (typeof window === 'undefined') {
		return createEmptyCredentials();
	}

	const urlParams = new URLSearchParams(window.location.search);
	const urlEnv = urlParams.get('env');
	const urlClient = urlParams.get('client');
	const urlScope = urlParams.get('scope');
	const urlRedirect = urlParams.get('redirect');

	let loaded = credentialManager.loadImplicitFlowCredentials();
	if (!loaded.environmentId || !loaded.clientId) {
		loaded = credentialManager.loadConfigCredentials();
	}
	if (!loaded.environmentId || !loaded.clientId) {
		loaded = credentialManager.loadPermanentCredentials();
	}

	const mergedScopes =
		urlScope ||
		(Array.isArray(loaded.scopes) ? loaded.scopes.join(' ') : loaded.scopes) ||
		'openid';

	// Properly handle redirect URI - only use fallback if truly undefined
	const fallbackFlowType = flowKey || (variant === 'oidc' ? 'oidc-implicit-v5' : 'oauth-implicit-v5');
	const redirectUri = urlRedirect || (loaded.redirectUri !== undefined ? loaded.redirectUri : getCallbackUrlForFlow(fallbackFlowType));

	console.log('🔍 [useImplicitFlowController] loadInitialCredentials:', {
		urlRedirect,
		loadedRedirectUri: loaded.redirectUri,
		finalRedirectUri: redirectUri,
		hasLoadedRedirectUri: loaded.redirectUri !== undefined
	});

	return {
		environmentId: urlEnv || loaded.environmentId || '',
		clientId: urlClient || loaded.clientId || '',
		clientSecret: '', // Not used in Implicit flow
		redirectUri: redirectUri,
		scope: mergedScopes,
		scopes: mergedScopes,
		responseType: variant === 'oidc' ? 'id_token token' : 'token',
		grantType: '',
		issuerUrl: loaded.environmentId ? `https://auth.pingone.com/${loaded.environmentId}` : '',
		authorizationEndpoint: resolveAuthEndpoint({
			environmentId: urlEnv || loaded.environmentId || '',
			authorizationEndpoint: loaded.authEndpoint,
		} as StepCredentials),
		userInfoEndpoint:
			loaded.userInfoEndpoint ||
			(loaded.environmentId ? `https://auth.pingone.com/${loaded.environmentId}/as/userinfo` : ''),
		clientAuthMethod: 'none',
		loginHint: loaded.loginHint || '',
	};
};

const getStoredStepResults = (storageKey: string): Record<string, unknown> => {
	if (typeof window === 'undefined') return {};
	const stored = sessionStorage.getItem(storageKey);
	return stored ? safeJsonParse<Record<string, unknown>>(stored, 100000) || {} : {};
};

export const useImplicitFlowController = (
	options: ImplicitFlowControllerOptions = {}
): ImplicitFlowController => {
	const flowKey = options.flowKey ?? DEFAULT_FLOW_KEY;
	const persistKey = `${flowKey}`;
	const stepResultKey = `${persistKey}-step-results`;
	const configStorageKey = `${persistKey}-config`;

	const [flowVariant, setFlowVariant] = useState<FlowVariant>(options.defaultFlowVariant ?? 'oidc');

	const [credentials, setCredentials] = useState<StepCredentials>(() =>
		loadInitialCredentials(options.defaultFlowVariant ?? 'oidc', flowKey)
	);

	const [flowConfig, setFlowConfig] = useState<FlowConfig>(() =>
		loadStoredConfig(configStorageKey, options.defaultFlowVariant ?? 'oidc')
	);

	const [nonce, setNonce] = useState<string>(() => {
		const stored = sessionStorage.getItem(`${flowKey}-nonce`);
		return stored || '';
	});

	const [state, setState] = useState<string>(() => {
		const stored = sessionStorage.getItem(`${flowKey}-state`);
		return stored || '';
	});

	// Persist nonce and state
	useEffect(() => {
		if (nonce) {
			sessionStorage.setItem(`${flowKey}-nonce`, nonce);
		}
	}, [nonce, flowKey]);

	useEffect(() => {
		if (state) {
			sessionStorage.setItem(`${flowKey}-state`, state);
		}
	}, [state, flowKey]);

	const [authUrl, setAuthUrl] = useState('');
	const [showUrlExplainer, setShowUrlExplainer] = useState(false);
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [tokens, setTokens] = useState<AuthorizationTokens | null>(null);
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
	const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);
	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const originalCredentialsRef = useRef<StepCredentials | null>(null);
	const popupRef = useRef<Window | null>(null);

	useAuthorizationFlowScroll('Implicit Flow V5');

	const stepManager = useFlowStepManager({
		flowType: 'implicit',
		persistKey: flowKey,
		defaultStep: 0,
		enableAutoAdvance: false,
	});

	const saveStepResult = useCallback(
		(stepId: string, result: unknown) => {
			const results = getStoredStepResults(stepResultKey);
			results[stepId] = result;
			sessionStorage.setItem(stepResultKey, JSON.stringify(results));
			console.log(`💾 [useImplicitFlowController] Step result saved: ${stepId}`);
		},
		[stepResultKey]
	);

	const hasStepResult = useCallback(
		(stepId: string) => {
			const results = getStoredStepResults(stepResultKey);
			return !!results[stepId];
		},
		[stepResultKey]
	);

	const clearStepResults = useCallback(() => {
		sessionStorage.removeItem(stepResultKey);
		console.log('🗑️ [useImplicitFlowController] Step results cleared');
	}, [stepResultKey]);

	const handleFlowConfigChange = useCallback(
		(config: FlowConfig) => {
			setFlowConfig(config);
			sessionStorage.setItem(configStorageKey, JSON.stringify(config));
			console.log('💾 [useImplicitFlowController] Flow config updated and persisted');
		},
		[configStorageKey]
	);

	// Initialize debugger if enabled
	useEffect(() => {
		if (options.enableDebugger) {
			const sessionId = enhancedDebugger.startSession('implicit');
			console.log('🔍 [useImplicitFlowController] Debug session started:', sessionId);

			return () => {
				enhancedDebugger.endSession();
			};
		}
	}, [options.enableDebugger]);

	// Generate nonce
	const generateNonce = useCallback(() => {
		const newNonce =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		setNonce(newNonce);
		console.log('🔐 [useImplicitFlowController] Nonce generated');
		saveStepResult('generate-nonce', { nonce: newNonce, timestamp: Date.now() });
		return newNonce;
	}, [saveStepResult]);

	// Generate state
	const generateState = useCallback(() => {
		const newState =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		setState(newState);
		console.log('🔐 [useImplicitFlowController] State generated');
		saveStepResult('generate-state', { state: newState, timestamp: Date.now() });
		return newState;
	}, [saveStepResult]);

	// Generate authorization URL for Implicit flow
	const generateAuthorizationUrl = useCallback(async () => {
		const authEndpoint = resolveAuthEndpoint(credentials);

		if (!authEndpoint) {
			showGlobalError(
				'Authorization endpoint not configured. Please configure your environment ID'
			);
			return;
		}

		// Generate nonce and state if not already set
		const finalNonce =
			nonce ||
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		const finalState =
			state ||
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

		if (!nonce) setNonce(finalNonce);
		if (!state) setState(finalState);

		const params = new URLSearchParams();
		params.set('client_id', credentials.clientId);
		params.set('redirect_uri', credentials.redirectUri);
		params.set(
			'response_type',
			credentials.responseType || (flowVariant === 'oidc' ? 'id_token token' : 'token')
		);
		params.set('scope', credentials.scope || credentials.scopes || 'openid');
		params.set('state', finalState);
		params.set('nonce', finalNonce);
		
		// Add response_mode parameter (default to fragment for implicit flow)
		params.set('response_mode', credentials.responseMode || 'fragment');

		// Add optional OIDC parameters
		if (flowConfig.maxAge && flowConfig.maxAge > 0) {
			params.set('max_age', flowConfig.maxAge.toString());
		}
		if (flowConfig.prompt) {
			params.set('prompt', flowConfig.prompt);
		}
		if (credentials.loginHint) {
			params.set('login_hint', credentials.loginHint);
		}
		if (flowConfig.acrValues && flowConfig.acrValues.length > 0) {
			params.set('acr_values', flowConfig.acrValues.join(' '));
		}

		const url = `${authEndpoint}?${params.toString()}`;
		setAuthUrl(url);

		// Store state and nonce for validation
		sessionStorage.setItem(`${flowKey}-oauth-state`, finalState);
		sessionStorage.setItem(`${flowKey}-oauth-nonce`, finalNonce);

		saveStepResult('generate-auth-url', {
			url,
			state: finalState,
			nonce: finalNonce,
			timestamp: Date.now(),
		});
	}, [credentials, flowVariant, flowConfig, nonce, state, flowKey, saveStepResult]);

	const stopPopupWatch = useCallback(() => {
		// Cleanup handled in effect
	}, []);

	const handlePopupAuthorization = useCallback(() => {
		if (!authUrl) {
			showGlobalError(
				'Authorization URL missing. Generate the authorization URL before starting the flow.'
			);
			return;
		}

		if (popupRef.current && !popupRef.current.closed) {
			popupRef.current.focus();
			return;
		}

		setIsAuthorizing(true);
		popupRef.current = window.open(authUrl, 'oauth-popup', 'width=600,height=700');

		saveStepResult('user-authorization', {
			method: 'popup',
			timestamp: Date.now(),
		});
	}, [authUrl, saveStepResult]);

	const handleRedirectAuthorization = useCallback(() => {
		if (!authUrl) {
			showGlobalError(
				'Authorization URL missing. Generate the authorization URL before starting the flow.'
			);
			return;
		}

		// Store context for callback
		sessionStorage.setItem(
			'flowContext',
			JSON.stringify({
				flow: flowKey,
				returnPath: window.location.pathname,
				timestamp: Date.now(),
			})
		);

		saveStepResult('user-authorization', {
			method: 'redirect',
			timestamp: Date.now(),
		});

		console.log('🔄 [useImplicitFlowController] Redirecting to authorization URL');
		window.location.href = authUrl;
	}, [authUrl, flowKey, saveStepResult]);

	// Parse tokens from URL fragment
	const setTokensFromFragment = useCallback(
		(fragment: string) => {
			try {
				const params = new URLSearchParams(fragment.replace('#', ''));
				const tokenData: AuthorizationTokens = {
					access_token: params.get('access_token') || '',
				};

				if (params.get('id_token')) {
					tokenData.id_token = params.get('id_token') || undefined;
				}
				if (params.get('token_type')) {
					tokenData.token_type = params.get('token_type') || undefined;
				}
				if (params.get('expires_in')) {
					tokenData.expires_in = parseInt(params.get('expires_in') || '0', 10);
				}
				if (params.get('scope')) {
					tokenData.scope = params.get('scope') || undefined;
				}

				setTokens(tokenData);

				// Store tokens (cast to compatible type)
				storeOAuthTokens({
					...tokenData,
					token_type: tokenData.token_type || 'Bearer',
				} as any);

				saveStepResult('receive-tokens', {
					...tokenData,
					timestamp: Date.now(),
				});

				trackTokenOperation(
					'Implicit Flow',
					true,
					`${flowVariant === 'oidc' ? 'OIDC' : 'OAuth'} Implicit - Tokens received`
				);

				console.log('✅ [useImplicitFlowController] Tokens parsed from fragment');
			} catch (error) {
				console.error('[useImplicitFlowController] Failed to parse tokens from fragment:', error);
				showGlobalError(
					'Failed to parse tokens from URL',
					error instanceof Error ? error.message : 'Unknown error'
				);
			}
		},
		[flowVariant, saveStepResult]
	);

	// Fetch user information
	const fetchUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			showGlobalError('No access token. Receive tokens first');
			return;
		}

		setIsFetchingUserInfo(true);
		enhancedDebugger.logStep('fetch-userinfo', 'Fetching user information', 'executing');

		try {
			const userInfoEndpoint =
				credentials.userInfoEndpoint ||
				`https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

			const response = await fetch(userInfoEndpoint, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error_description ||
						errorData.error ||
						`UserInfo request failed: ${response.status}`
				);
			}

			const data = await response.json();
			setUserInfo(data);

			saveStepResult('fetch-userinfo', data);
			trackTokenOperation('UserInfo', true, 'User information fetched successfully');

			console.log('✅ [useImplicitFlowController] User info fetched');
		} catch (error) {
			console.error('[useImplicitFlowController] Fetch user info failed:', error);
			enhancedDebugger.logError('fetch-userinfo', error as Error);

			const errorMessage =
				error instanceof Error ? error.message : 'Failed to fetch user information';
			showGlobalError(`UserInfo request failed: ${errorMessage}`);

			trackTokenOperation('UserInfo', false, errorMessage);
		} finally {
			setIsFetchingUserInfo(false);
		}
	}, [tokens, credentials, saveStepResult]);

	// Save credentials
	const saveCredentials = useCallback(async () => {
		console.log('💾 [useImplicitFlowController] Saving credentials...');
		console.log(
			'📋 [useImplicitFlowController] Credentials:',
			JSON.stringify(credentials, null, 2)
		);
		setIsSavingCredentials(true);

		try {
			// Convert credentials to format expected by credentialManager
			const credsToSave = {
				...credentials,
				scopes:
					typeof credentials.scopes === 'string'
						? credentials.scopes.split(' ').filter(Boolean)
						: credentials.scopes || ['openid'],
			};
			console.log('📤 [useImplicitFlowController] Saving to credentialManager:', credsToSave);
			await credentialManager.saveImplicitFlowCredentials(credsToSave as any);
			setHasCredentialsSaved(true);
			setHasUnsavedCredentialChanges(false);
			originalCredentialsRef.current = { ...credentials };

			// Clear cache to ensure fresh data is loaded
			credentialManager.clearCache();

			// Dispatch events to notify dashboard and other components
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
			console.log('📢 [useImplicitFlowController] Configuration change events dispatched');

			saveStepResult('save-credentials', {
				...credentials,
				timestamp: Date.now(),
			});
			console.log('✅ [useImplicitFlowController] Credentials saved successfully');
		} catch (error) {
			console.error('❌ [useImplicitFlowController] Save credentials failed:', error);
			throw error;
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials, saveStepResult]);

	// Handle copy
	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(label);
		setTimeout(() => setCopiedField(null), 2000);
		showGlobalSuccess(`${label} copied to clipboard!`);
	}, []);

	// Reset flow
	const resetFlow = useCallback(() => {
		setAuthUrl('');
		setTokens(null);
		setUserInfo(null);
		setNonce('');
		setState('');
		setShowUrlExplainer(false);
		stopPopupWatch();
		clearStepResults();

		saveStepResult('reset-flow', { timestamp: Date.now() });

		console.log('🔄 [useImplicitFlowController] Flow reset');
	}, [clearStepResults, saveStepResult, stopPopupWatch]);

	// Track credential changes
	useEffect(() => {
		if (!originalCredentialsRef.current) {
			originalCredentialsRef.current = credentials;
			return;
		}

		const hasChanges =
			JSON.stringify(credentials) !== JSON.stringify(originalCredentialsRef.current);
		setHasUnsavedCredentialChanges(hasChanges);
	}, [credentials]);

	// Load saved credentials on mount
	useEffect(() => {
		try {
			const saved = credentialManager.loadImplicitFlowCredentials();
			if (saved.environmentId && saved.clientId) {
				setHasCredentialsSaved(true);
			}
		} catch (_error) {
			setHasCredentialsSaved(false);
		}
	}, []);

	return {
		flowVariant,
		setFlowVariant,
		persistKey,
		credentials,
		setCredentials,
		setFlowConfig,
		flowConfig,
		handleFlowConfigChange,
		nonce,
		state,
		generateNonce,
		generateState,
		authUrl,
		generateAuthorizationUrl,
		showUrlExplainer,
		setShowUrlExplainer,
		isAuthorizing,
		handlePopupAuthorization,
		handleRedirectAuthorization,
		resetFlow,
		tokens,
		setTokensFromFragment,
		userInfo,
		isFetchingUserInfo,
		fetchUserInfo,
		isSavingCredentials,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		saveCredentials,
		handleCopy,
		copiedField,
		stepManager,
		saveStepResult,
		hasStepResult,
		clearStepResults,
	};
};
