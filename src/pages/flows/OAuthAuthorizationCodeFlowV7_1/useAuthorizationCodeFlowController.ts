/**
 * ========================================================================
 * AUTHORIZATION CODE FLOW CONTROLLER V7.1 LOCKED - DO NOT MODIFY THIS FILE
 * ========================================================================
 *
 * This file implements the V7.1 authorization code flow credential management
 * and is LOCKED at Version 1 to prevent credential bleeding between flows.
 *
 * Current Version: V1 (Locked - Credential isolation fixes applied)
 * Locked Date: Latest commit
 *
 * Key Features (DO NOT CHANGE):
 * - Flow-specific credential isolation (disableSharedFallback: true)
 * - No credential bleeding between flows
 * - loadInitialCredentials returns empty defaults (no shared credentials)
 *
 * To modify the flow logic, create:
 * - useAuthorizationCodeFlowController.ts.V2.tsx
 * - Or create a new controller in a different file
 *
 * This ensures authorization flow stability and credential isolation.
 * ========================================================================
 */

// src/hooks/useAuthorizationCodeFlowController.ts

import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import {
	loadFlowCredentialsIsolated,
	saveFlowCredentialsIsolated,
} from '../../../services/flowCredentialService';
import type { FlowConfig } from '../components/FlowConfiguration';
import type { PKCECodes, StepCredentials } from '../components/steps/CommonSteps';
import { HybridFlowDefaults } from '../services/hybridFlowSharedService';
import { trackTokenOperation } from '../utils/activityTracker';
import { getCallbackUrlForFlow } from '../utils/callbackUrls';
import { applyClientAuthentication } from '../utils/clientAuthentication';
import { credentialManager } from '../utils/credentialManager';
import { enhancedDebugger } from '../utils/enhancedDebug';
import { getDefaultConfig } from '../utils/flowConfigDefaults';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';
import {
	auditRedirectUri,
	clearRedirectUri,
	getStoredRedirectUri,
	storeRedirectUriFromAuthUrl,
} from '../utils/redirectUriHelpers';
import { safeJsonParse, safeSessionStorageParse } from '../utils/secureJson';
import { rehydrateOAuthTokens, storeOAuthTokens } from '../utils/tokenStorage';
import { showGlobalError, showGlobalSuccess } from './useNotifications';
import { useAuthorizationFlowScroll } from './usePageScroll';

type FlowVariant = 'oauth' | 'oidc' | 'hybrid';

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

const DEFAULT_FLOW_KEY = 'oauth-authorization-code-v7-1';

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

	// DO NOT load from credentialManager - this causes credential bleeding between flows
	// Each flow should maintain its own credentials in flow-specific storage
	const loaded: any = {}; // Empty object to prevent loading shared credentials

	const mergedScopes = urlScope || (variant === 'oidc' ? 'openid profile email' : 'read write');

	return {
		environmentId: urlEnv || '',
		clientId: urlClient || '',
		clientSecret: '', // Never load from shared credentials
		redirectUri: urlRedirect || getCallbackUrlForFlow('authorization-code'),
		scope: mergedScopes,
		scopes: mergedScopes,
		responseType: 'code',
		grantType: 'authorization_code',
		issuerUrl: '',
		authorizationEndpoint: '',
		tokenEndpoint: '',
		userInfoEndpoint: '',
		clientAuthMethod: 'client_secret_post',
		loginHint: '',
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
		const parsed = safeSessionStorageParse<PKCECodes>(pkceStorageKey, null);

		if (parsed && parsed.codeVerifier && parsed.codeChallenge) {
			console.log(
				'🔄 [useAuthorizationCodeFlowController] Loaded existing PKCE codes from sessionStorage:',
				{
					codeVerifier: parsed.codeVerifier.substring(0, 20) + '...',
					codeChallenge: parsed.codeChallenge.substring(0, 20) + '...',
					storageKey: pkceStorageKey,
				}
			);
			return parsed;
		}

		// No existing PKCE codes found
		console.log('🔄 [useAuthorizationCodeFlowController] No existing PKCE codes in sessionStorage');
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

	// Clear PKCE codes when flow loads to ensure fresh start
	useEffect(() => {
		console.log(
			'🚀 [useAuthorizationCodeFlowV7_1Controller] Flow loaded, clearing PKCE codes for fresh start...'
		);

		// Clear PKCE codes from state
		setPkceCodes({
			codeVerifier: '',
			codeChallenge: '',
			codeChallengeMethod: 'S256',
		});

		// Clear PKCE codes from sessionStorage
		const pkceStorageKey = `${persistKey}-pkce-codes`;
		sessionStorage.removeItem(pkceStorageKey);

		// Clear legacy PKCE storage keys
		const legacyKeys = [
			'code_verifier',
			'oauth_v3_code_verifier',
			`${flowKey}_code_verifier`,
			`${flowKey}_v3_code_verifier`,
			'oauth_code_verifier',
		];
		legacyKeys.forEach((key) => sessionStorage.removeItem(key));

		console.log('✅ [useAuthorizationCodeFlowV7_1Controller] PKCE codes cleared on flow load');
	}, []); // Only run once on mount

	// Load flow-specific credentials on mount using isolated storage
	useEffect(() => {
		const loadData = async () => {
			try {
				console.log(
					'🔄 [useAuthorizationCodeFlowController] Loading flow-specific credentials on mount...'
				);

				const {
					credentials: loadedCreds,
					flowState,
					credentialSource,
				} = await loadFlowCredentialsIsolated<FlowConfig>({
					flowKey: persistKey,
					defaultCredentials: loadInitialCredentials(flowVariant),
					useSharedFallback: false,
				});

				// Load credentials if we have ANY credentials (flow-specific OR shared)
				if (loadedCreds && (loadedCreds.environmentId || loadedCreds.clientId)) {
					console.log('✅ [useAuthorizationCodeFlowController] Found saved credentials', {
						flowKey: persistKey,
						environmentId: loadedCreds.environmentId,
						clientId: `${loadedCreds.clientId?.substring(0, 8)}...`,
						hasFlowState: !!flowState,
						credentialSource,
					});

					setCredentials(loadedCreds);
					setHasCredentialsSaved(true);
					originalCredentialsRef.current = { ...loadedCreds };

					// Load flow-specific state if available
					if (flowState?.flowConfig) {
						setFlowConfig((prev) => ({ ...prev, ...flowState.flowConfig }));
						console.log(
							'✅ [useAuthorizationCodeFlowController] Loaded flow config from saved state'
						);
					}
				} else {
					console.log(
						'ℹ️ [useAuthorizationCodeFlowController] No isolated credentials found, using initial defaults'
					);
				}
			} catch (error) {
				console.error('❌ [useAuthorizationCodeFlowController] Failed to load credentials:', error);
			}
		};

		loadData();
	}, [flowVariant, persistKey]);

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
				showGlobalError('Authorization error', {
					description: url.searchParams.get('error_description') || errorParam,
					meta: { source: 'authorization-callback' },
				});
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

		// Listen for popup callback
		const handlePopupCallback = (event: CustomEvent) => {
			console.log(
				'🎉 [useAuthorizationCodeFlowController] ===== POPUP CALLBACK EVENT RECEIVED ====='
			);
			console.log('✅ [useAuthorizationCodeFlowController] Event detail:', event.detail);
			console.log(
				'✅ [useAuthorizationCodeFlowController] Current authCode state:',
				authCode ? `${authCode.substring(0, 10)}...` : 'none'
			);

			const { code, state } = event.detail;
			if (code) {
				console.log(
					'✅ [useAuthorizationCodeFlowController] Setting auth code from popup:',
					code.substring(0, 10) + '...'
				);
				setAuthCode(code);
				console.log('✅ [useAuthorizationCodeFlowController] Auth code SET in state');

				saveStepResult('handle-callback', {
					code,
					state,
					timestamp: Date.now(),
					source: 'popup',
				});
				console.log('✅ [useAuthorizationCodeFlowController] Step result saved');
			} else {
				console.warn('⚠️ [useAuthorizationCodeFlowController] No code in event detail!');
			}
		};

		console.log(
			'🎧 [useAuthorizationCodeFlowController] Event listener registered for auth-code-received'
		);
		window.addEventListener('auth-code-received', handlePopupCallback as EventListener);

		return () => {
			console.log('🔌 [useAuthorizationCodeFlowController] Removing auth-code-received listener');
			window.removeEventListener('auth-code-received', handlePopupCallback as EventListener);
		};
	}, [authCode, saveStepResult]);

	// Polling mechanism as backup to custom event (in case event is missed due to timing)
	useEffect(() => {
		if (typeof window === 'undefined') return;

		let pollInterval: NodeJS.Timeout | null = null;
		let lastProcessedTimestamp: string | null = null;

		const checkCallbackFlag = () => {
			const callbackProcessed = sessionStorage.getItem('callback_processed');
			const callbackFlowType = sessionStorage.getItem('callback_flow_type');

			// Only process if we have a new callback (timestamp changed)
			if (callbackProcessed && callbackProcessed !== lastProcessedTimestamp) {
				console.log(
					'🔍 [useAuthorizationCodeFlowController] Polling detected callback_processed flag!'
				);
				console.log(
					'🔍 [useAuthorizationCodeFlowController] Callback timestamp:',
					callbackProcessed
				);
				console.log(
					'🔍 [useAuthorizationCodeFlowController] Callback flow type:',
					callbackFlowType
				);

				// Check if this callback is for our flow
				if (callbackFlowType === flowKey) {
					const code =
						sessionStorage.getItem(`${flowKey}-authCode`) ||
						sessionStorage.getItem('oidc_auth_code') ||
						sessionStorage.getItem('auth_code');

					if (code && code !== authCode) {
						console.log(
							'✅ [useAuthorizationCodeFlowController] Polling found new auth code:',
							code.substring(0, 10) + '...'
						);
						setAuthCode(code);

						saveStepResult('handle-callback', {
							code,
							timestamp: Date.now(),
							source: 'polling-fallback',
						});

						// Clear the flag so we don't process it again
						sessionStorage.removeItem('callback_processed');
						sessionStorage.removeItem('callback_flow_type');
						console.log('✅ [useAuthorizationCodeFlowController] Cleared callback flags');
					}
				}

				lastProcessedTimestamp = callbackProcessed;
			}
		};

		// Poll every 500ms while no authCode is set
		if (!authCode) {
			console.log(
				'🔄 [useAuthorizationCodeFlowController] Starting callback polling (backup mechanism)'
			);
			pollInterval = setInterval(checkCallbackFlag, 500);
		}

		return () => {
			if (pollInterval) {
				console.log('🔌 [useAuthorizationCodeFlowController] Stopping callback polling');
				clearInterval(pollInterval);
			}
		};
	}, [authCode, flowKey, saveStepResult]);

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
			// Check if PKCE codes already exist
			if (pkceCodes.codeVerifier && pkceCodes.codeChallenge) {
				console.log('🔐 [PKCE DEBUG] PKCE codes already exist, skipping regeneration');
				return;
			}

			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			console.log('🔐 [PKCE DEBUG] ===== GENERATING NEW PKCE CODES =====');
			console.log(
				'🔐 [PKCE DEBUG] code_verifier (first 20 chars):',
				codeVerifier.substring(0, 20) + '...'
			);
			console.log(
				'🔐 [PKCE DEBUG] code_challenge (first 20 chars):',
				codeChallenge.substring(0, 20) + '...'
			);
			console.log('🔐 [PKCE DEBUG] Storage key:', `${persistKey}-pkce-codes`);

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

			console.log('✅ [PKCE DEBUG] PKCE codes generated and saved to state');
		} catch (error) {
			console.error('[useAuthorizationCodeFlowController] PKCE generation failed:', error);
			showGlobalError('PKCE generation failed', {
				description: 'Failed to generate secure PKCE codes.',
				meta: { source: 'generatePkceCodes' },
			});
		}
	}, [saveStepResult, persistKey, pkceCodes]);

	const generateAuthorizationUrl = useCallback(async () => {
		const authEndpoint = resolveAuthEndpoint(credentials);
		if (!authEndpoint) {
			showGlobalError('Missing authorization endpoint', {
				description: 'Configure PingOne environment ID or authorization endpoint.',
				meta: { field: 'authorizationEndpoint' },
			});
			return;
		}

		if (!credentials.clientId) {
			showGlobalError('Missing client ID', {
				description: 'Configure PingOne client ID.',
				meta: { field: 'clientId' },
			});
			return;
		}

		if (!credentials.redirectUri) {
			showGlobalError('Missing redirect URI', {
				description: 'Configure PingOne redirect URI.',
				meta: { field: 'redirectUri' },
			});
			return;
		}

		// Enhanced redirect URI debugging and validation
		const currentOrigin = window.location.origin;
		const suggestedRedirectUri = `${currentOrigin}/authz-callback`;
		const redirectUriMismatch = credentials.redirectUri !== suggestedRedirectUri;

		console.log('🔍 [REDIRECT URI DEBUG] Detailed Analysis:', {
			configuredRedirectUri: credentials.redirectUri,
			suggestedRedirectUri: suggestedRedirectUri,
			currentOrigin: currentOrigin,
			currentHref: window.location.href,
			protocol: window.location.protocol,
			hostname: window.location.hostname,
			port: window.location.port,
			isLocalhost: ['localhost', '127.0.0.1'].includes(window.location.hostname),
			isHttps: window.location.protocol === 'https:',
			redirectUriProtocol: credentials.redirectUri.split(':')[0],
			redirectUriHost: credentials.redirectUri.split('/')[2],
			mismatch: redirectUriMismatch,
		});

		// Warn about potential redirect URI mismatches
		if (redirectUriMismatch) {
			console.warn('⚠️ [REDIRECT URI WARNING] Potential mismatch detected:', {
				configured: credentials.redirectUri,
				suggested: suggestedRedirectUri,
				recommendation: `Consider updating redirect URI to: ${suggestedRedirectUri}`,
			});
		}

		console.log('🔧 [useAuthorizationCodeFlowController] ===== AUTHORIZATION URL GENERATION =====');
		console.log(
			'🔧 [useAuthorizationCodeFlowController] Using redirect URI:',
			credentials.redirectUri
		);
		console.log('🔧 [useAuthorizationCodeFlowController] Full credentials:', {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			redirectUri: credentials.redirectUri,
			scope: credentials.scope,
		});

		// REDIRECT URI AUDIT - Check for common mismatch issues
		console.log('🔍 [REDIRECT URI AUDIT] Authorization Request:', {
			configuredRedirectUri: credentials.redirectUri,
			hasTrailingSlash: credentials.redirectUri.endsWith('/'),
			protocol: credentials.redirectUri.split(':')[0],
			windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
			windowProtocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
			matchesWindowOrigin: credentials.redirectUri.startsWith(
				typeof window !== 'undefined' ? window.location.origin : ''
			),
		});

		// Ensure PKCE codes are generated before creating authorization URL
		let currentPkceCodes = pkceCodes;
		if (!currentPkceCodes.codeVerifier || !currentPkceCodes.codeChallenge) {
			console.log('🔐 [PKCE] PKCE codes missing, generating them automatically...');

			try {
				const codeVerifier = generateCodeVerifier();
				const codeChallenge = await generateCodeChallenge(codeVerifier);

				currentPkceCodes = {
					codeVerifier,
					codeChallenge,
					codeChallengeMethod: 'S256',
				};

				// Update state for future use
				setPkceCodes(currentPkceCodes);

				console.log('✅ [PKCE] PKCE codes generated automatically');
			} catch (error) {
				console.error('❌ [PKCE] Failed to generate PKCE codes:', error);
				throw new Error('Failed to generate PKCE parameters. Please try again.');
			}
		}

		console.log('🌐 [PKCE DEBUG] ===== BUILDING AUTHORIZATION URL =====');
		console.log('🌐 [PKCE DEBUG] Using PKCE codes:', {
			codeVerifier: currentPkceCodes.codeVerifier.substring(0, 20) + '...',
			codeChallenge: currentPkceCodes.codeChallenge.substring(0, 20) + '...',
			codeChallengeMethod: currentPkceCodes.codeChallengeMethod,
		});

		const state =
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

		// Load PingOne application configuration for PAR and other advanced settings
		let pingOneConfig = null;
		try {
			// Try both possible config keys (for different flow variants)
			const possibleKeys = [
				`${persistKey}-app-config`,
				`${flowKey}-app-config`,
				'pingone-app-config', // fallback
			];

			for (const configKey of possibleKeys) {
				const config = safeSessionStorageParse<typeof pingOneConfig>(configKey, null);
				if (config) {
					pingOneConfig = config;
					console.log('🔧 [useAuthorizationCodeFlowController] Loaded PingOne config:', {
						key: configKey,
						config: pingOneConfig,
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
			console.log(
				'🔗 [useAuthorizationCodeFlowController] PAR is required, generating PAR request'
			);
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
					codeChallenge: currentPkceCodes.codeChallenge,
					codeChallengeMethod: currentPkceCodes.codeChallengeMethod || 'S256',
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

				console.log(
					'🔗 [useAuthorizationCodeFlowController] Generated PAR authorization URL:',
					url
				);
			} catch (error) {
				console.error('❌ [useAuthorizationCodeFlowController] PAR request failed:', error);
				showGlobalError('PAR request failed', {
					description:
						'Failed to generate pushed authorization request. Please check your PingOne configuration.',
					meta: { source: 'parService.generatePARRequest' },
				});
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

			// REDIRECT URI AUDIT - Log what will be sent to PingOne
			console.log('🔍 [REDIRECT URI AUDIT] URL Params:', {
				redirect_uri_param: params.get('redirect_uri'),
				redirect_uri_encoded: encodeURIComponent(credentials.redirectUri),
				params_toString: params.toString(),
			});

			// Add PKCE parameters if using authorization code flow (default behavior)
			if (responseType.includes('code')) {
				params.set('code_challenge', currentPkceCodes.codeChallenge);
				params.set('code_challenge_method', currentPkceCodes.codeChallengeMethod || 'S256');
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

			// Add advanced OAuth/OIDC parameters from flowConfig
			// Note: Resources and Display are intentionally not included for PingOne flows
			// as they are not reliably supported. See AdvancedParametersV6.tsx for details.
			if (flowConfig?.audience) {
				params.set('audience', flowConfig.audience);
				console.log(
					'🔧 [useAuthorizationCodeFlowController] Added audience parameter:',
					flowConfig.audience
				);
			}
			if (flowConfig?.prompt) {
				params.set('prompt', flowConfig.prompt);
				console.log(
					'🔧 [useAuthorizationCodeFlowController] Added prompt parameter:',
					flowConfig.prompt
				);
			}

			// Add OIDC-specific advanced parameters (claims only - display removed for PingOne)
			if (flowVariant === 'oidc') {
				// Claims parameter (JSON structure for id_token and userinfo claims)
				if (flowConfig?.customClaims && Object.keys(flowConfig.customClaims).length > 0) {
					params.set('claims', JSON.stringify(flowConfig.customClaims));
					console.log(
						'🔧 [useAuthorizationCodeFlowController] Added claims parameter:',
						flowConfig.customClaims
					);
				}
			}

			url = `${authEndpoint}?${params.toString()}`;
		}

		console.log('🔧 [useAuthorizationCodeFlowController] ===== FINAL AUTHORIZATION URL =====');
		console.log('🔧 [useAuthorizationCodeFlowController] Generated URL:', url);
		console.log(
			'🔧 [useAuthorizationCodeFlowController] URL parameters:',
			Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''))
		);

		setAuthUrl(url);

		// ✅ CRITICAL: Store the EXACT redirect_uri from the URL for token exchange
		// This prevents mismatch errors when credentials change between steps
		storeRedirectUriFromAuthUrl(url, flowKey);
		auditRedirectUri('authorization', credentials.redirectUri, flowKey);

		// Store state in sessionStorage for callback validation
		sessionStorage.setItem('oauth_state', state);
		console.log('🔧 [useAuthorizationCodeFlowController] Stored state for validation:', state);

		// Store active flow for callback page to know where to return
		sessionStorage.setItem('active_oauth_flow', flowKey);
		console.log('🔧 [useAuthorizationCodeFlowController] Stored active flow:', flowKey);

		saveStepResult('generate-auth-url', {
			url,
			state,
			codeChallenge: currentPkceCodes.codeChallenge,
			codeChallengeMethod: currentPkceCodes.codeChallengeMethod,
			timestamp: Date.now(),
		});
	}, [credentials, pkceCodes, flowVariant, flowKey, flowConfig, persistKey, saveStepResult]);

	const clearPopupInterval = useRef<number | null>(null);

	const stopPopupWatch = () => {
		if (clearPopupInterval.current) {
			window.clearInterval(clearPopupInterval.current);
			clearPopupInterval.current = null;
		}
	};

	const handlePopupAuthorization = useCallback(() => {
		if (!authUrl) {
			showGlobalError('Authorization URL missing', {
				description: 'Generate the authorization URL before starting the flow.',
			});
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
			showGlobalError('Missing authorization code', {
				description: 'Complete the authorization step first.',
			});
			return;
		}

		if (!credentials.clientId || !credentials.clientSecret) {
			showGlobalError('Missing credentials', {
				description: 'Configure PingOne client ID and client secret.',
			});
			return;
		}

		if (!credentials.environmentId) {
			showGlobalError('Missing environment ID', {
				description: 'Configure PingOne environment ID.',
			});
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
				sessionStorageKeys: {
					code_verifier: sessionStorage.getItem('code_verifier') ? 'exists' : 'missing',
					oauth_v3_code_verifier: sessionStorage.getItem('oauth_v3_code_verifier')
						? 'exists'
						: 'missing',
					[`${flowKey}_code_verifier`]: sessionStorage.getItem(`${flowKey}_code_verifier`)
						? 'exists'
						: 'missing',
				},
			});

			// Try to get code verifier from multiple possible storage locations
			console.log('🔍 [PKCE DEBUG] ===== TOKEN EXCHANGE PKCE RETRIEVAL =====');
			console.log('🔍 [PKCE DEBUG] Current pkceCodes state:', {
				codeVerifier: pkceCodes.codeVerifier
					? `${pkceCodes.codeVerifier.substring(0, 20)}...`
					: 'MISSING',
				codeChallenge: pkceCodes.codeChallenge
					? `${pkceCodes.codeChallenge.substring(0, 20)}...`
					: 'MISSING',
				hasBoth: !!(pkceCodes.codeVerifier && pkceCodes.codeChallenge),
			});

			let codeVerifier = pkceCodes.codeVerifier;
			if (!codeVerifier) {
				console.log('⚠️ [PKCE DEBUG] No code_verifier in state, checking sessionStorage...');

				// FIRST: Try the correct key where we actually store PKCE codes
				const pkceStorageKey = `${persistKey}-pkce-codes`;
				const storedPkceCodes = safeSessionStorageParse<PKCECodes>(pkceStorageKey, null);

				console.log('🔍 [PKCE DEBUG] SessionStorage check:', {
					key: pkceStorageKey,
					found: !!storedPkceCodes,
					hasVerifier: !!storedPkceCodes?.codeVerifier,
					hasChallenge: !!storedPkceCodes?.codeChallenge,
				});

				if (storedPkceCodes?.codeVerifier) {
					codeVerifier = storedPkceCodes.codeVerifier;
					console.log(
						`✅ [PKCE DEBUG] Retrieved code_verifier from ${pkceStorageKey}:`,
						codeVerifier.substring(0, 20) + '...'
					);
				} else {
					console.log('⚠️ [PKCE DEBUG] No PKCE in primary storage, trying legacy keys...');

					// FALLBACK: Try legacy keys from older flow versions
					const possibleKeys = [
						'code_verifier',
						'oauth_v3_code_verifier',
						`${flowKey}_code_verifier`,
						`${flowKey}_v3_code_verifier`,
						'oauth_code_verifier',
					];

					for (const key of possibleKeys) {
						const stored = sessionStorage.getItem(key);
						if (stored) {
							codeVerifier = stored;
							console.log(
								`🔧 [PKCE DEBUG] Retrieved code_verifier from legacy key ${key}:`,
								stored.substring(0, 20) + '...'
							);
							break;
						}
					}
				}
			} else {
				console.log(
					'✅ [PKCE DEBUG] Using code_verifier from state:',
					codeVerifier.substring(0, 20) + '...'
				);
			}

			if (!codeVerifier) {
				throw new Error('PKCE code verifier is missing. Please generate PKCE parameters first.');
			}

			// Use backend proxy to avoid CORS issues
			const backendUrl =
				process.env.NODE_ENV === 'production' ? 'https://oauth-playground.vercel.app' : ''; // Use relative URL to go through Vite proxy

			// ✅ CRITICAL FIX: Use the EXACT redirect_uri from the authorization request
			// This is stored in sessionStorage when the auth URL is generated
			// This prevents "Invalid Redirect URI" errors from mismatches
			const actualRedirectUri = getStoredRedirectUri(flowKey, credentials.redirectUri);
			auditRedirectUri('token-exchange', actualRedirectUri, flowKey);

			const requestBody: any = {
				grant_type: 'authorization_code',
				code: authCode.trim(),
				redirect_uri: actualRedirectUri.trim(), // ✅ Use stored value, not credentials
				client_id: credentials.clientId.trim(),
				environment_id: credentials.environmentId.trim(),
				code_verifier: codeVerifier.trim(),
				client_auth_method: credentials.clientAuthMethod || 'client_secret_post',
				...(credentials.includeX5tParameter && {
					includeX5tParameter: credentials.includeX5tParameter,
				}),
			};

			// REDIRECT URI AUDIT - Token Exchange
			console.log('🔍 [REDIRECT URI AUDIT] Token Exchange:', {
				redirect_uri_in_token_request: requestBody.redirect_uri,
				redirect_uri_from_credentials: credentials.redirectUri,
				using_stored_value: actualRedirectUri !== credentials.redirectUri,
				hasTrailingSlash: requestBody.redirect_uri.endsWith('/'),
				guaranteed_match: true, // ✅ Now using same value as authorization!
			});

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

				// Parse error details
				let errorDetails = errorText;
				let userMessage = 'Token exchange failed';

				try {
					const errorJson = JSON.parse(errorText);
					if (errorJson.error === 'invalid_grant') {
						if (errorJson.error_description?.includes('expired or invalid')) {
							userMessage = 'Authorization code expired or already used';
							errorDetails =
								'Authorization codes can only be used once and expire quickly (typically 1-10 minutes). Please restart the authorization flow to get a new code.';
						} else {
							userMessage = errorJson.error_description || 'Invalid authorization code';
							errorDetails = errorJson.error_description || errorText;
						}
					} else if (
						errorJson.error === 'invalid_request' &&
						errorJson.error_description?.toLowerCase().includes('redirect')
					) {
						userMessage = 'Invalid Redirect URI';
						errorDetails = `${errorJson.error_description}\n\nDebugging Info:\n- Configured: ${credentials.redirectUri}\n- Used in token exchange: ${actualRedirectUri}\n- Current origin: ${window.location.origin}\n\nEnsure the redirect URI in PingOne exactly matches: ${actualRedirectUri}`;

						// Additional redirect URI debugging
						console.error('🚨 [REDIRECT URI ERROR] Detailed debugging:', {
							error: errorJson,
							configuredRedirectUri: credentials.redirectUri,
							actualRedirectUriUsed: actualRedirectUri,
							currentOrigin: window.location.origin,
							currentUrl: window.location.href,
							mismatch: actualRedirectUri !== credentials.redirectUri,
							pingOneErrorDescription: errorJson.error_description,
						});
					} else {
						userMessage = errorJson.error_description || errorJson.error || 'Token exchange failed';
						errorDetails = errorJson.error_description || errorText;
					}
				} catch (e) {
					// If not JSON, use the raw error text
				}

				// Show user-friendly error message
				showGlobalError(userMessage, {
					description: errorDetails,
					meta: { status: response.status, action: 'exchangeTokens' },
				});

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
				showGlobalError('Authentication failed', {
					description:
						'The client credentials are invalid or the authentication method is not supported. Please check your Client ID and Client Secret configuration in PingOne.',
					meta: { phase: 'tokenExchange', errorCode: 'invalid_client' },
				});
			} else if (errorMessage.includes('401')) {
				showGlobalError('Unauthorized', {
					description:
						'Authentication failed. Please verify your PingOne credentials and application configuration.',
					meta: { phase: 'tokenExchange', errorCode: 'unauthorized' },
				});
			} else {
				showGlobalError('Token exchange failed', {
					description: errorMessage,
					meta: { phase: 'tokenExchange' },
				});
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
			showGlobalError('Missing access token', {
				description: 'Exchange tokens first.',
				meta: { phase: 'userInfo' },
			});
			return;
		}

		// Try to get userinfo endpoint from credentials, or construct from environment ID
		let userInfoEndpoint = credentials.userInfoEndpoint;

		// Fallback: construct from environment ID if not provided
		if (!userInfoEndpoint && credentials.environmentId) {
			userInfoEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;
			console.log(
				'ℹ️ [fetchUserInfo] UserInfo endpoint not in credentials, constructed from environment ID:',
				userInfoEndpoint
			);
		}

		if (!userInfoEndpoint) {
			console.error('❌ [fetchUserInfo] No userinfo endpoint configured and no environment ID');
			showGlobalError('Missing user info endpoint', {
				description: 'Configure PingOne user info endpoint or environment ID in credentials.',
				meta: { field: 'userInfoEndpoint' },
			});
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
			showGlobalError('Missing refresh token', {
				description: 'No refresh token available.',
			});
			return;
		}

		if (!credentials.clientId || !credentials.clientSecret) {
			showGlobalError('Missing credentials', {
				description: 'Configure PingOne client ID and client secret.',
			});
			return;
		}

		if (!credentials.environmentId) {
			showGlobalError('Missing environment ID', {
				description: 'Configure PingOne environment ID.',
			});
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
				...(credentials.includeX5tParameter && {
					includeX5tParameter: credentials.includeX5tParameter,
				}),
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
			console.log('💾 [useAuthorizationCodeFlowController] Credentials to save:', {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scope: credentials.scope,
			});

			// Save using FlowCredentialService
			const success = await saveFlowCredentialsIsolated(
				persistKey,
				credentials,
				flowConfig,
				{
					flowVariant,
					pkce: pkceCodes,
					authorizationCode: authCode,
					tokens: {
						accessToken: tokens?.access_token,
						refreshToken,
						idToken: tokens?.id_token,
					},
				},
				{ showToast: false, useSharedFallback: false }
			);
			console.log(
				'💾 [useAuthorizationCodeFlowController] saveFlowCredentialsIsolated result:',
				success
			);

			if (!success) {
				throw new Error('Failed to save credentials via saveFlowCredentialsIsolated');
			}

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
	}, [
		credentials,
		persistKey,
		flowConfig,
		flowVariant,
		pkceCodes,
		authCode,
		tokens,
		refreshToken,
		saveStepResult,
	]);

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
		// Clear processed authorization code to allow fresh authorization
		sessionStorage.removeItem('processed_auth_code');
		// ✅ Clear stored redirect_uri to prevent stale values
		clearRedirectUri(flowKey);
		showGlobalSuccess('Flow reset', {
			description: 'Start the authorization sequence again.',
			meta: { action: 'resetFlow' },
		});
	}, [clearStepResults, stepManager, stopPopupWatch, persistKey, flowKey]);

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

	const clearPKCE = useCallback(() => {
		console.log('🧹 [useAuthorizationCodeFlowV7_1Controller] Clearing PKCE codes...');

		// Clear PKCE codes from state
		setPkceCodes({
			codeVerifier: '',
			codeChallenge: '',
			codeChallengeMethod: 'S256',
		});

		// Clear PKCE codes from sessionStorage
		const pkceStorageKey = `${persistKey}-pkce-codes`;
		sessionStorage.removeItem(pkceStorageKey);

		// Clear legacy PKCE storage keys
		const legacyKeys = [
			'code_verifier',
			'oauth_v3_code_verifier',
			`${flowKey}_code_verifier`,
			`${flowKey}_v3_code_verifier`,
			'oauth_code_verifier',
		];
		legacyKeys.forEach((key) => sessionStorage.removeItem(key));

		console.log('✅ [useAuthorizationCodeFlowV7_1Controller] PKCE codes cleared');
		showGlobalSuccess('PKCE codes cleared', {
			description: 'Generate new PKCE codes to start a fresh authorization flow.',
			meta: { action: 'clearPKCE' },
		});
	}, [persistKey, flowKey]);

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
		clearPKCE,
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
