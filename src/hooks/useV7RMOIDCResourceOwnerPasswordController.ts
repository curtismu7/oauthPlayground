// src/hooks/useV7RMOIDCResourceOwnerPasswordController.ts - Enhanced with Real Services

import React, { useCallback, useState } from 'react';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { generateMockIdToken } from '../utils/mockOAuth';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface V7RMCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	scopes: string[];
}

export interface V7RMTokens {
	access_token: string;
	token_type: string;
	expires_in: number;
	id_token?: string;
	refresh_token?: string;
	scope: string;
}

export interface V7RMUserInfo {
	sub: string;
	name: string;
	email: string;
	email_verified: boolean;
	given_name: string;
	family_name: string;
	picture?: string;
}

export interface V7RMFlowConfig {
	includeRefreshToken: boolean;
	includeIdToken: boolean;
	customScopes: string;
	tokenExpiry: number;
}

export interface V7RMOIDCResourceOwnerPasswordController {
	// Credentials
	credentials: V7RMCredentials;
	setCredentials: (credentials: V7RMCredentials) => void;
	saveCredentials: () => Promise<void>;
	hasCredentialsSaved: boolean;
	hasUnsavedCredentialChanges: boolean;
	isSavingCredentials: boolean;

	// Flow execution
	isAuthenticating: boolean;
	authenticateUser: () => Promise<void>;
	tokens: V7RMTokens | null;
	userInfo: V7RMUserInfo | null;
	isFetchingUserInfo: boolean;
	fetchUserInfo: () => Promise<void>;

	// Refresh tokens
	refreshTokens: () => Promise<void>;
	refreshedTokens: V7RMTokens | null;
	isRefreshingTokens: boolean;

	// Flow management
	flowConfig: V7RMFlowConfig;
	handleFlowConfigChange: (config: Partial<V7RMFlowConfig>) => void;
	resetFlow: () => void;
	stepManager: ReturnType<typeof useFlowStepManager>;
	persistKey: string;
	hasStepResult: (stepKey: string) => boolean;
	saveStepResult: (stepKey: string, result: any) => void;
}

interface UseV7RMOIDCResourceOwnerPasswordControllerParams {
	flowKey: string;
	defaultFlowVariant?: 'oidc';
	enableDebugger?: boolean;
}

export const useV7RMOIDCResourceOwnerPasswordController = ({
	flowKey,
	enableDebugger = false,
}: UseV7RMOIDCResourceOwnerPasswordControllerParams): V7RMOIDCResourceOwnerPasswordController => {
	// Persist key with v7rm: prefix for complete isolation from V7M, V7, and V8
	const persistKey = `v7rm:oidc-rop-${flowKey}`;

	// Step management (uses v7rm: prefix for sessionStorage isolation)
	const stepManager = useFlowStepManager({
		flowType: 'v7rm-oidc-resource-owner-password',
		persistKey, // Uses v7rm: prefix for sessionStorage isolation
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Credentials state - Using standard PingOne demo credentials
	const [credentials, setCredentials] = useState<V7RMCredentials>({
		environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
		clientId: 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
		clientSecret: '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a',
		username: 'demo@example.com',
		password: 'demo-password',
		scopes: ['openid', 'profile', 'email'],
	});

	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = useState(false);

	// Flow state
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [tokens, setTokens] = useState<V7RMTokens | null>(null);
	const [userInfo, setUserInfo] = useState<V7RMUserInfo | null>(null);
	const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);
	const [refreshedTokens, setRefreshedTokens] = useState<V7RMTokens | null>(null);
	const [isRefreshingTokens, setIsRefreshingTokens] = useState(false);

	// Flow configuration
	const [flowConfig, setFlowConfig] = useState<V7RMFlowConfig>({
		includeRefreshToken: true,
		includeIdToken: true,
		customScopes: 'openid profile email',
		tokenExpiry: 3600,
	});

	// Step results storage
	const [stepResults, setStepResults] = useState<Record<string, any>>({});

	// Save credentials
	const saveCredentials = useCallback(async () => {
		setIsSavingCredentials(true);
		try {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Save to localStorage for persistence (using v7rm: prefix for isolation)
			localStorage.setItem(`${persistKey}-credentials`, JSON.stringify(credentials));

			setHasCredentialsSaved(true);
			setHasUnsavedCredentialChanges(false);

			v4ToastManager.showSuccess('saveConfigurationSuccess');

			if (enableDebugger) {
				console.log('🔐 Mock credentials saved:', credentials);
			}
		} catch (_error) {
			v4ToastManager.showError('saveConfigurationError', {
				error: 'Failed to save mock credentials',
			});
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials, persistKey, enableDebugger]);

	// Authenticate user using real PingOne API
	const authenticateUser = useCallback(async () => {
		if (
			!credentials.environmentId ||
			!credentials.clientId ||
			!credentials.clientSecret ||
			!credentials.username ||
			!credentials.password
		) {
			v4ToastManager.showError('allCredentialsRequired');
			return;
		}

		setIsAuthenticating(true);
		try {
			if (enableDebugger) {
				console.log('🔐 [V7RM-Enhanced] Starting authentication with real PingOne API...');
			}

			// Prepare request for real PingOne token endpoint
			const requestBody = {
				grant_type: 'password',
				username: credentials.username,
				password: credentials.password,
				scope: credentials.scopes.join(' '),
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
			};

			if (enableDebugger) {
				console.log('🔍 [V7RM-Enhanced] Token request:', {
					url: '/api/token-exchange',
					grant_type: 'password',
					username: credentials.username,
					scope: credentials.scopes.join(' '),
				});
			}

			// Use real token exchange API
			const response = await fetch(`/api/token-exchange`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...requestBody,
					environmentId: credentials.environmentId,
					clientAuthMethod: 'client_secret_basic',
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}

			const tokenData = await response.json();

			// Enhance with OIDC features if ID token is requested but not provided
			const enhancedTokens: V7RMTokens = {
				...tokenData,
				// Add mock ID token if openid scope is requested but not provided by PingOne
				...(credentials.scopes.includes('openid') &&
					!tokenData.id_token && {
						id_token: generateMockIdToken(credentials.username, credentials.environmentId),
					}),
			};

			if (enableDebugger) {
				console.log('🎫 [V7RM-Enhanced] Real tokens received:', {
					hasAccessToken: !!enhancedTokens.access_token,
					hasIdToken: !!enhancedTokens.id_token,
					hasRefreshToken: !!enhancedTokens.refresh_token,
					expiresIn: enhancedTokens.expires_in,
					scope: enhancedTokens.scope,
				});
			}

			setTokens(enhancedTokens);
			saveStepResult('authenticate-user', {
				success: true,
				timestamp: Date.now(),
				tokenType: enhancedTokens.token_type,
				expiresIn: enhancedTokens.expires_in,
				scope: enhancedTokens.scope,
				realApi: true,
			});

			v4ToastManager.showSuccess('authenticationSuccess');

			// Auto-advance to next step
			stepManager.setStep(stepManager.currentStepIndex + 1, 'authentication completed');
		} catch (error) {
			console.error('❌ [V7RM-Enhanced] Authentication failed:', error);
			v4ToastManager.showError('authenticationFailed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			saveStepResult('authenticate-user', {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: Date.now(),
				realApi: true,
			});
		} finally {
			setIsAuthenticating(false);
		}
	}, [credentials, stepManager, enableDebugger, saveStepResult]);

	// Fetch user info using real API
	const fetchUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			v4ToastManager.showError('accessTokenRequired');
			return;
		}

		setIsFetchingUserInfo(true);
		try {
			// Use real userinfo API
			const response = await fetch(`/api/userinfo`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					access_token: tokens.access_token,
					environmentId: credentials.environmentId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}

			const userData = await response.json();

			if (enableDebugger) {
				console.log('👤 [V7RM-Enhanced] Real user info received:', userData);
			}

			setUserInfo(userData);

			v4ToastManager.showSuccess('saveConfigurationSuccess');

			if (enableDebugger) {
				console.log('👤 Mock user info fetched:', mockUserInfo);
			}
		} catch (error) {
			v4ToastManager.showError('networkError');
			console.error('Mock user info fetch failed:', error);
		} finally {
			setIsFetchingUserInfo(false);
		}
	}, [tokens, enableDebugger, credentials.environmentId]);

	// Refresh tokens (mock implementation)
	const refreshTokens = useCallback(async () => {
		if (!tokens?.refresh_token) {
			v4ToastManager.showError('stepError');
			return;
		}

		setIsRefreshingTokens(true);
		try {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const newTokens = generateMockTokens({
				scopes: credentials.scopes,
				includeRefreshToken: true,
				includeIdToken: flowConfig.includeIdToken,
				expiresIn: flowConfig.tokenExpiry,
			});

			setRefreshedTokens(newTokens);

			v4ToastManager.showSuccess('saveConfigurationSuccess');

			if (enableDebugger) {
				console.log('🔄 Mock tokens refreshed:', newTokens);
			}
		} catch (error) {
			v4ToastManager.showError('networkError');
			console.error('Mock token refresh failed:', error);
		} finally {
			setIsRefreshingTokens(false);
		}
	}, [tokens, credentials.scopes, flowConfig, enableDebugger]);

	// Handle flow config changes
	const handleFlowConfigChange = useCallback((config: Partial<V7RMFlowConfig>) => {
		setFlowConfig((prev) => ({ ...prev, ...config }));
	}, []);

	// Reset flow
	const resetFlow = useCallback(() => {
		setTokens(null);
		setUserInfo(null);
		setRefreshedTokens(null);
		setStepResults({});
		stepManager.setStep(0, 'flow reset');
		v4ToastManager.showSuccess('saveConfigurationSuccess');
	}, [stepManager]);

	// Step result management
	const hasStepResult = useCallback(
		(stepKey: string) => {
			return Boolean(stepResults[stepKey]);
		},
		[stepResults]
	);

	const saveStepResult = useCallback((stepKey: string, result: any) => {
		setStepResults((prev) => ({ ...prev, [stepKey]: result }));
	}, []);

	// Load saved credentials on mount
	React.useEffect(() => {
		const parsed = safeLocalStorageParse<V7RMCredentials | null>(`${persistKey}-credentials`, null);
		if (parsed) {
			setCredentials(parsed);
			setHasCredentialsSaved(true);
		}
	}, [persistKey]);

	return {
		credentials,
		setCredentials,
		saveCredentials,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		isSavingCredentials,
		isAuthenticating,
		authenticateUser,
		tokens,
		userInfo,
		isFetchingUserInfo,
		fetchUserInfo,
		refreshTokens,
		refreshedTokens,
		isRefreshingTokens,
		flowConfig,
		handleFlowConfigChange,
		resetFlow,
		stepManager,
		persistKey,
		hasStepResult,
		saveStepResult,
	};
};
