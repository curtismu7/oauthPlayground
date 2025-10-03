// src/hooks/useWorkerTokenFlowController.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlowConfig } from '../components/FlowConfiguration';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { trackTokenOperation } from '../utils/activityTracker';
import { credentialManager } from '../utils/credentialManager';
import { enhancedDebugger } from '../utils/enhancedDebug';
import { getDefaultConfig } from '../utils/flowConfigDefaults';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { safeJsonParse } from '../utils/secureJson';
import { storeOAuthTokens } from '../utils/tokenStorage';
import type { TokenIntrospectionResponse, WorkerTokenResponse } from '../utils/workerToken';
import { requestClientCredentialsToken } from '../utils/workerToken';
import { showGlobalError, showGlobalSuccess } from './useNotifications';
import { useAuthorizationFlowScroll } from './usePageScroll';

export interface WorkerTokenFlowControllerOptions {
	flowKey?: string;
	enableDebugger?: boolean;
}

export interface WorkerTokenFlowController {
	persistKey: string;
	credentials: StepCredentials;
	setCredentials: (creds: StepCredentials) => void;
	setFlowConfig: (config: FlowConfig) => void;
	flowConfig: FlowConfig;
	handleFlowConfigChange: (config: FlowConfig) => void;
	resetFlow: () => void;
	isRequestingToken: boolean;
	requestToken: () => Promise<void>;
	tokens: WorkerTokenResponse | null;
	introspectionResults: TokenIntrospectionResponse | null;
	isIntrospecting: boolean;
	introspectToken: () => Promise<void>;
	isSavingCredentials: boolean;
	hasCredentialsSaved: boolean;
	hasUnsavedCredentialChanges: boolean;
	saveCredentials: () => Promise<void>;
	loadCredentials: (config: StepCredentials) => void;
	handleCopy: (text: string, label: string) => void;
	copiedField: string | null;
	stepManager: ReturnType<typeof useFlowStepManager>;
	saveStepResult: (stepId: string, result: unknown) => void;
	hasStepResult: (stepId: string) => boolean;
	clearStepResults: () => void;
}

const DEFAULT_FLOW_KEY = 'worker-token-v5';

const getSafeOrigin = (): string => {
	if (typeof window === 'undefined') return 'https://localhost:3000';
	return window.location.origin;
};

const createEmptyCredentials = (): StepCredentials => ({
	environmentId: '',
	clientId: '',
	clientSecret: '',
	redirectUri: `${getSafeOrigin()}/callback`,
	scope: 'openid',
	scopes: 'openid',
	responseType: 'code',
	grantType: 'client_credentials',
	issuerUrl: '',
	authServerId: '',
	loginHint: '',
});

const loadInitialCredentials = (): StepCredentials => {
	try {
		const stored = credentialManager.loadWorkerFlowCredentials();
		if (stored.environmentId && stored.clientId) {
			console.log('🔄 [useWorkerTokenFlowController] Loaded credentials from storage');
			return { ...createEmptyCredentials(), ...stored };
		}
	} catch (error) {
		console.warn('[useWorkerTokenFlowController] Failed to load stored credentials:', error);
	}
	return createEmptyCredentials();
};

const loadStoredConfig = (storageKey: string, defaultConfig: FlowConfig): FlowConfig => {
	try {
		const stored = sessionStorage.getItem(storageKey);
		if (stored) {
			const parsed = safeJsonParse(stored, {});
			console.log('🔄 [useWorkerTokenFlowController] Loaded flow config from storage');
			return { ...defaultConfig, ...parsed };
		}
	} catch (error) {
		console.warn('[useWorkerTokenFlowController] Failed to parse stored config:', error);
	}
	return defaultConfig;
};

const getStoredStepResults = (stepResultKey: string): Record<string, unknown> => {
	const stored = sessionStorage.getItem(stepResultKey);
	return stored ? safeJsonParse(stored, {}) : {};
};

export const useWorkerTokenFlowController = (
	options: WorkerTokenFlowControllerOptions = {}
): WorkerTokenFlowController => {
	const flowKey = options.flowKey ?? DEFAULT_FLOW_KEY;
	const persistKey = `${flowKey}`;
	const stepResultKey = `${persistKey}-step-results`;
	const configStorageKey = `${persistKey}-config`;

	const [credentials, setCredentials] = useState<StepCredentials>(() => loadInitialCredentials());

	const [flowConfig, setFlowConfig] = useState<FlowConfig>(() =>
		loadStoredConfig(configStorageKey, getDefaultConfig())
	);

	const [tokens, setTokens] = useState<WorkerTokenResponse | null>(null);
	const [introspectionResults, setIntrospectionResults] =
		useState<TokenIntrospectionResponse | null>(null);
	const [isRequestingToken, setIsRequestingToken] = useState(false);
	const [isIntrospecting, setIsIntrospecting] = useState(false);
	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const originalCredentialsRef = useRef<StepCredentials | null>(null);
	useAuthorizationFlowScroll('Worker Token Flow V5');

	// Step management functions (must be defined before useEffects that use them)
	const stepManager = useFlowStepManager({
		flowType: 'worker-token-v5',
		persistKey: 'worker_token_v5_step_manager',
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Clear stored step on mount to ensure we start at step 0
	useEffect(() => {
		sessionStorage.removeItem('worker_token_v5_step_manager-step');
	}, []);
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
		const nextValue = loadStoredConfig(configStorageKey, getDefaultConfig());
		setFlowConfig(nextValue);
	}, [configStorageKey]);

	// Track credential changes for unsaved changes detection
	useEffect(() => {
		if (originalCredentialsRef.current) {
			const hasChanges =
				JSON.stringify(originalCredentialsRef.current) !== JSON.stringify(credentials);
			setHasUnsavedCredentialChanges(hasChanges);
		}
	}, [credentials]);

	// Debugger integration
	useEffect(() => {
		if (options.enableDebugger) {
			const sessionId = enhancedDebugger.startSession('worker-token-v5');
			console.log('🔍 [useWorkerTokenFlowController] Debug session started:', sessionId);

			return () => {
				enhancedDebugger.endSession();
			};
		}
	}, [options.enableDebugger]);

	const handleFlowConfigChange = useCallback(
		(newConfig: FlowConfig) => {
			setFlowConfig(newConfig);
			sessionStorage.setItem(configStorageKey, JSON.stringify(newConfig));
			console.log('💾 [useWorkerTokenFlowController] Flow config updated and persisted');
		},
		[configStorageKey]
	);

	const requestToken = useCallback(async () => {
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			showGlobalError(
				'Missing required credentials. Please configure your PingOne settings first.'
			);
			return;
		}

		try {
			setIsRequestingToken(true);
			enhancedDebugger.logStep('worker-token-request', 'Requesting worker token');

			// Build token endpoint URL
			const baseUrl = 'https://auth.pingone.com';
			const authUrl = `${baseUrl}/${credentials.environmentId}/as`;
			const tokenEndpoint = `${authUrl}/token`;

			// Prepare scopes
			const scopes = credentials.scopes || credentials.scope || 'openid';
			const scopeArray = scopes.split(' ').filter(Boolean);

			// Get authentication method (default to client_secret_post)
			const authMethod =
				credentials.clientAuthMethod || credentials.tokenAuthMethod || 'client_secret_post';
			console.log('🔐 [useWorkerTokenFlowController] Using authentication method:', authMethod);

			// Request the token
			const tokenResponse = await requestClientCredentialsToken(
				tokenEndpoint,
				credentials.clientId,
				credentials.clientSecret,
				scopeArray,
				authMethod
			);

			setTokens(tokenResponse);
			saveStepResult('token-request', tokenResponse);

			// Store tokens for persistence
			await storeOAuthTokens({
				access_token: tokenResponse.access_token,
				refresh_token: tokenResponse.refresh_token,
				token_type: tokenResponse.token_type,
				expires_in: tokenResponse.expires_in,
				scope: tokenResponse.scope,
			});

			// Track the successful operation
			trackTokenOperation('worker-token-request', true, 'Token requested successfully');
			showGlobalSuccess('Worker token requested successfully!');

			console.log('✅ [useWorkerTokenFlowController] Token request completed successfully');
		} catch (error) {
			console.error('❌ [useWorkerTokenFlowController] Token request failed:', error);
			enhancedDebugger.logError('worker-token-request', error);

			const errorMessage =
				error instanceof Error ? error.message : 'Failed to request worker token';

			// Check if it's an authentication method error and provide helpful guidance
			if (errorMessage.includes('Unsupported authentication method')) {
				showGlobalError(
					`Token request failed: ${errorMessage}\n\nTip: Check your PingOne application's Token Endpoint Authentication Method setting. Try changing it to match your configuration (client_secret_post or client_secret_basic).`,
					'Authentication Method Error'
				);
			} else {
				showGlobalError(`Token request failed: ${errorMessage}`);
			}

			// Track the failed operation
			trackTokenOperation('worker-token-request', false, errorMessage);
		} finally {
			setIsRequestingToken(false);
		}
	}, [credentials, saveStepResult]);

	const introspectToken = useCallback(async () => {
		if (!tokens?.access_token) {
			showGlobalError('No access token available for introspection. Please request a token first.');
			return;
		}

		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			showGlobalError('Missing credentials for token introspection.');
			return;
		}

		try {
			setIsIntrospecting(true);
			enhancedDebugger.logStep('token-introspection', 'Introspecting access token');

			// Build introspection endpoint URL
			const baseUrl = 'https://auth.pingone.com';
			const authUrl = `${baseUrl}/${credentials.environmentId}/as`;
			const introspectionEndpoint = `${authUrl}/introspect`;

			// Perform token introspection
			const introspectionResponse = await introspectToken(
				introspectionEndpoint,
				tokens.access_token,
				{
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
				}
			);

			setIntrospectionResults(introspectionResponse);
			saveStepResult('token-introspection', introspectionResponse);

			// Track the successful operation
			trackTokenOperation('token-introspection', true, 'Token introspection completed');
			showGlobalSuccess('Token introspection completed successfully!');

			console.log('✅ [useWorkerTokenFlowController] Token introspection completed successfully');
		} catch (error) {
			console.error('❌ [useWorkerTokenFlowController] Token introspection failed:', error);
			enhancedDebugger.logError('token-introspection', error);

			const errorMessage = error instanceof Error ? error.message : 'Failed to introspect token';
			showGlobalError(`Token introspection failed: ${errorMessage}`);

			// Track the failed operation
			trackTokenOperation('token-introspection', false, errorMessage);
		} finally {
			setIsIntrospecting(false);
		}
	}, [tokens, credentials, saveStepResult]);

	const saveCredentials = useCallback(async () => {
		try {
			console.log('💾 [useWorkerTokenFlowController] Save credentials button clicked!');
			console.log(
				'📋 [useWorkerTokenFlowController] Credentials object:',
				JSON.stringify(credentials, null, 2)
			);
			console.log('🔍 [useWorkerTokenFlowController] Login Hint value:', credentials.loginHint);
			console.log('🔍 [useWorkerTokenFlowController] Environment ID:', credentials.environmentId);
			console.log('🔍 [useWorkerTokenFlowController] Client ID:', credentials.clientId);
			console.log(
				'🔍 [useWorkerTokenFlowController] Has Client Secret:',
				!!credentials.clientSecret
			);

			setIsSavingCredentials(true);

			// Validate required fields
			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				const missingFields = [];
				if (!credentials.environmentId) missingFields.push('Environment ID');
				if (!credentials.clientId) missingFields.push('Client ID');
				if (!credentials.clientSecret) missingFields.push('Client Secret');

				console.error(
					'❌ [useWorkerTokenFlowController] Missing fields:',
					missingFields.join(', ')
				);
				showGlobalError(`Missing required fields: ${missingFields.join(', ')} are required.`);
				return;
			}

			// Use the direct method instead of the generic one
			const success = credentialManager.saveWorkerFlowCredentials(credentials);

			if (success) {
				// Verify what was actually saved
				const saved = credentialManager.loadWorkerFlowCredentials();
				console.log('✅ [useWorkerTokenFlowController] Credentials saved successfully');
				console.log('🔍 [useWorkerTokenFlowController] Saved loginHint:', saved.loginHint);

				setHasCredentialsSaved(true);
				setHasUnsavedCredentialChanges(false);
				originalCredentialsRef.current = { ...credentials };

				// Clear cache to ensure fresh data is loaded
				credentialManager.clearCache();

				// Dispatch events to notify dashboard and other components
				window.dispatchEvent(new CustomEvent('pingone-config-changed'));
				window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
				console.log('📢 [useWorkerTokenFlowController] Configuration change events dispatched');

				showGlobalSuccess('Credentials saved successfully!');
			} else {
				throw new Error('Failed to save credentials to localStorage');
			}
		} catch (error) {
			console.error('❌ [useWorkerTokenFlowController] Failed to save credentials:', error);
			showGlobalError(
				`Failed to save credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials]);

	const resetFlow = useCallback(() => {
		console.log('🔄 [useWorkerTokenFlowController] Reset flow called (preserving credentials)');

		// Reset flow state but preserve credentials
		setTokens(null);
		setIntrospectionResults(null);
		setIsRequestingToken(false);
		setIsIntrospecting(false);
		setHasUnsavedCredentialChanges(false);

		clearStepResults();
		stepManager.resetFlow();

		// Reset original credentials reference to current credentials
		originalCredentialsRef.current = { ...credentials };

		console.log('✅ [useWorkerTokenFlowController] Flow reset completed (credentials preserved)');
		showGlobalSuccess('Worker Token Flow reset successfully! Credentials preserved.');
	}, [clearStepResults, stepManager, credentials]);

	const loadCredentials = useCallback((config: StepCredentials) => {
		console.log('📥 [useWorkerTokenFlowController] Loading credentials from config');
		setCredentials(config);
		originalCredentialsRef.current = { ...config };
		setHasUnsavedCredentialChanges(false);
	}, []);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(label);
		setTimeout(() => setCopiedField(null), 2000);
		showGlobalSuccess(`${label} copied to clipboard!`);
	}, []);

	// Track credential changes for save button state
	useEffect(() => {
		if (!originalCredentialsRef.current) {
			originalCredentialsRef.current = credentials;
			return;
		}

		const hasChanges =
			JSON.stringify(credentials) !== JSON.stringify(originalCredentialsRef.current);
		setHasUnsavedCredentialChanges(hasChanges);
	}, [credentials]);

	// Check if credentials are saved
	useEffect(() => {
		try {
			const stored = credentialManager.loadWorkerFlowCredentials();
			const isSaved =
				stored.environmentId === credentials.environmentId &&
				stored.clientId === credentials.clientId &&
				stored.clientSecret === credentials.clientSecret;
			setHasCredentialsSaved(Boolean(isSaved));
		} catch (_error) {
			setHasCredentialsSaved(false);
		}
	}, [credentials]);

	return {
		persistKey,
		credentials,
		setCredentials,
		setFlowConfig,
		flowConfig,
		handleFlowConfigChange,
		resetFlow,
		isRequestingToken,
		requestToken,
		tokens,
		introspectionResults,
		isIntrospecting,
		introspectToken,
		isSavingCredentials,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		saveCredentials,
		loadCredentials,
		handleCopy,
		copiedField,
		stepManager,
		saveStepResult,
		hasStepResult,
		clearStepResults,
	};
};
