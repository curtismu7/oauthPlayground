// src/hooks/useResourceOwnerPasswordFlowV5.ts
// V5 Resource Owner Password Flow controller with real PingOne API integration

import { useCallback, useEffect, useState } from 'react';
import { credentialManager } from '../utils/credentialManager';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface ResourceOwnerPasswordCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	scope: string;
	clientAuthMethod?: 'client_secret_post' | 'client_secret_basic';
}

export interface ResourceOwnerPasswordTokens {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
}

export interface ResourceOwnerPasswordUserInfo {
	sub: string;
	name?: string;
	email?: string;
	email_verified?: boolean;
	given_name?: string;
	family_name?: string;
	picture?: string;
	[key: string]: any;
}

export interface ResourceOwnerPasswordFlowV5Controller {
	// Credentials
	credentials: ResourceOwnerPasswordCredentials;
	setCredentials: (credentials: ResourceOwnerPasswordCredentials) => void;
	saveCredentials: () => Promise<void>;
	hasCredentialsSaved: boolean;
	isSavingCredentials: boolean;

	// Flow execution
	isAuthenticating: boolean;
	authenticateUser: () => Promise<void>;
	tokens: ResourceOwnerPasswordTokens | null;

	// User info
	userInfo: ResourceOwnerPasswordUserInfo | null;
	isFetchingUserInfo: boolean;
	fetchUserInfo: () => Promise<void>;

	// Token refresh
	refreshTokens: () => Promise<void>;
	refreshedTokens: ResourceOwnerPasswordTokens | null;
	isRefreshingTokens: boolean;

	// Flow management
	resetFlow: () => void;
	stepManager: ReturnType<typeof useFlowStepManager>;
	hasStepResult: (stepKey: string) => boolean;
	saveStepResult: (stepKey: string, result: any) => void;
}

interface UseResourceOwnerPasswordFlowV5Params {
	flowKey: string;
	enableDebugger?: boolean;
}

export const useResourceOwnerPasswordFlowV5 = ({
	flowKey,
	enableDebugger = false,
}: UseResourceOwnerPasswordFlowV5Params): ResourceOwnerPasswordFlowV5Controller => {
	const persistKey = `resource-owner-password-v5-${flowKey}`;

	// Step management
	const stepManager = useFlowStepManager({
		flowType: 'resource-owner-password-v5',
		persistKey,
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Credentials state
	const [credentials, setCredentials] = useState<ResourceOwnerPasswordCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		username: '',
		password: '',
		scope: 'read write',
		clientAuthMethod: 'client_secret_post',
	});

	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);

	// Flow state
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [tokens, setTokens] = useState<ResourceOwnerPasswordTokens | null>(null);
	const [userInfo, setUserInfo] = useState<ResourceOwnerPasswordUserInfo | null>(null);
	const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);
	const [refreshedTokens, setRefreshedTokens] = useState<ResourceOwnerPasswordTokens | null>(null);
	const [isRefreshingTokens, setIsRefreshingTokens] = useState(false);

	// Step results storage
	const [stepResults, setStepResults] = useState<Record<string, any>>({});

	// Save credentials
	const saveCredentials = useCallback(async () => {
		setIsSavingCredentials(true);
		try {
			if (enableDebugger) {
				console.log('💾 [ResourceOwnerPasswordV5] Saving credentials...');
			}

			await credentialManager.saveAuthzFlowCredentials(credentials);
			setHasCredentialsSaved(true);

			// Dispatch events for other components
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));

			if (enableDebugger) {
				console.log('✅ [ResourceOwnerPasswordV5] Credentials saved successfully');
			}

			saveStepResult('save-credentials', {
				saved: true,
				timestamp: Date.now(),
			});

			v4ToastManager.showSuccess('Configuration saved successfully.');
		} catch (error) {
			console.error('❌ [ResourceOwnerPasswordV5] Save credentials failed:', error);
			v4ToastManager.showError('Failed to save configuration', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials, enableDebugger]);

	// Authenticate user using Resource Owner Password flow
	const authenticateUser = useCallback(async () => {
		if (
			!credentials.environmentId ||
			!credentials.clientId ||
			!credentials.clientSecret ||
			!credentials.username ||
			!credentials.password
		) {
			v4ToastManager.showError('All credentials are required for Resource Owner Password flow');
			return;
		}

		setIsAuthenticating(true);
		try {
			if (enableDebugger) {
				console.log('🔐 [ResourceOwnerPasswordV5] Starting authentication...');
			}

			const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

			// Prepare request body for Resource Owner Password flow
			const requestBody = {
				grant_type: 'password',
				username: credentials.username,
				password: credentials.password,
				scope: credentials.scope,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
			};

			if (enableDebugger) {
				console.log('🔍 [ResourceOwnerPasswordV5] Token request:', {
					url: `${backendUrl}/api/token-exchange`,
					grant_type: 'password',
					username: credentials.username,
					scope: credentials.scope,
				});
			}

			const response = await fetch(`${backendUrl}/api/token-exchange`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...requestBody,
					environmentId: credentials.environmentId,
					clientAuthMethod: credentials.clientAuthMethod,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}

			const tokenData: ResourceOwnerPasswordTokens = await response.json();

			if (enableDebugger) {
				console.log('🎫 [ResourceOwnerPasswordV5] Tokens received:', {
					hasAccessToken: !!tokenData.access_token,
					hasRefreshToken: !!tokenData.refresh_token,
					expiresIn: tokenData.expires_in,
					scope: tokenData.scope,
				});
			}

			setTokens(tokenData);

			saveStepResult('authenticate-user', {
				success: true,
				timestamp: Date.now(),
				tokenType: tokenData.token_type,
				expiresIn: tokenData.expires_in,
				scope: tokenData.scope,
			});

			v4ToastManager.showSuccess('Authentication successful! Access token received.');

			// Auto-advance to next step
			stepManager.setStep(stepManager.currentStepIndex + 1, 'authentication completed');
		} catch (error) {
			console.error('[ResourceOwnerPasswordV5] Authentication failed:', error);
			v4ToastManager.showError('Authentication failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			saveStepResult('authenticate-user', {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: Date.now(),
			});
		} finally {
			setIsAuthenticating(false);
		}
	}, [credentials, stepManager, enableDebugger]);

	// Fetch user info using access token
	const fetchUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			v4ToastManager.showError('Access token is required to fetch user information');
			return;
		}

		setIsFetchingUserInfo(true);
		try {
			if (enableDebugger) {
				console.log('👤 [ResourceOwnerPasswordV5] Fetching user info...');
			}

			const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

			const response = await fetch(`${backendUrl}/api/userinfo`, {
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

			const userData: ResourceOwnerPasswordUserInfo = await response.json();

			if (enableDebugger) {
				console.log('👤 [ResourceOwnerPasswordV5] User info received:', userData);
			}

			setUserInfo(userData);

			saveStepResult('fetch-user-info', {
				success: true,
				timestamp: Date.now(),
				userSub: userData.sub,
			});

			v4ToastManager.showSuccess('User information fetched successfully.');
		} catch (error) {
			console.error('[ResourceOwnerPasswordV5] User info fetch failed:', error);
			v4ToastManager.showError('Failed to fetch user information', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			saveStepResult('fetch-user-info', {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: Date.now(),
			});
		} finally {
			setIsFetchingUserInfo(false);
		}
	}, [tokens, credentials.environmentId, enableDebugger]);

	// Refresh tokens using refresh token
	const refreshTokens = useCallback(async () => {
		if (!tokens?.refresh_token) {
			v4ToastManager.showError('Refresh token is required to refresh access token');
			return;
		}

		setIsRefreshingTokens(true);
		try {
			if (enableDebugger) {
				console.log('🔄 [ResourceOwnerPasswordV5] Refreshing tokens...');
			}

			const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

			const requestBody = {
				grant_type: 'refresh_token',
				refresh_token: tokens.refresh_token,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
			};

			const response = await fetch(`${backendUrl}/api/token-exchange`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...requestBody,
					environmentId: credentials.environmentId,
					clientAuthMethod: credentials.clientAuthMethod,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}

			const newTokens: ResourceOwnerPasswordTokens = await response.json();

			if (enableDebugger) {
				console.log('🔄 [ResourceOwnerPasswordV5] Tokens refreshed:', {
					hasAccessToken: !!newTokens.access_token,
					hasRefreshToken: !!newTokens.refresh_token,
					expiresIn: newTokens.expires_in,
				});
			}

			setRefreshedTokens(newTokens);

			saveStepResult('refresh-tokens', {
				success: true,
				timestamp: Date.now(),
				tokenType: newTokens.token_type,
				expiresIn: newTokens.expires_in,
			});

			v4ToastManager.showSuccess('Tokens refreshed successfully.');
		} catch (error) {
			console.error('[ResourceOwnerPasswordV5] Token refresh failed:', error);
			v4ToastManager.showError('Failed to refresh tokens', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			saveStepResult('refresh-tokens', {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: Date.now(),
			});
		} finally {
			setIsRefreshingTokens(false);
		}
	}, [tokens, credentials, enableDebugger]);

	// Reset flow
	const resetFlow = useCallback(() => {
		setTokens(null);
		setUserInfo(null);
		setRefreshedTokens(null);
		setStepResults({});
		stepManager.setStep(0, 'flow reset');
		v4ToastManager.showSuccess('Flow reset successfully.');
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
	useEffect(() => {
		const loadCredentials = async () => {
			try {
				const savedCredentials = credentialManager.loadAuthzFlowCredentials();
				if (savedCredentials && savedCredentials.environmentId && savedCredentials.clientId) {
					setCredentials((prev) => ({
						...prev,
						environmentId: savedCredentials.environmentId,
						clientId: savedCredentials.clientId,
						clientSecret: savedCredentials.clientSecret || '',
						scope: savedCredentials.scope || 'read write',
						clientAuthMethod: savedCredentials.clientAuthMethod || 'client_secret_post',
					}));
					setHasCredentialsSaved(true);

					if (enableDebugger) {
						console.log('🔄 [ResourceOwnerPasswordV5] Loaded saved credentials');
					}
				}
			} catch (error) {
				console.error('Failed to load saved credentials:', error);
			}
		};

		loadCredentials();
	}, [enableDebugger]);

	return {
		credentials,
		setCredentials,
		saveCredentials,
		hasCredentialsSaved,
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
		resetFlow,
		stepManager,
		hasStepResult,
		saveStepResult,
	};
};
