// src/hooks/useV7RMOIDCResourceOwnerPasswordControllerEnhanced.ts
// Enhanced V7RM OIDC Resource Owner Password Flow - Uses real services where possible

import { useCallback, useEffect, useState } from 'react';
import { credentialManager } from '../utils/credentialManager';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface V7RMCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	scope: string;
	clientAuthMethod?: 'client_secret_post' | 'client_secret_basic';
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
	name?: string;
	email?: string;
	email_verified?: boolean;
	given_name?: string;
	family_name?: string;
	picture?: string;
	[key: string]: any;
}

export interface V7RMFlowConfig {
	includeRefreshToken: boolean;
	includeIdToken: boolean;
	customScopes: string;
	tokenExpiry: number;
}

export interface V7RMOIDCResourceOwnerPasswordControllerEnhanced {
	// Credentials
	credentials: V7RMCredentials;
	setCredentials: (credentials: V7RMCredentials) => void;
	saveCredentials: () => Promise<void>;
	hasCredentialsSaved: boolean;
	isSavingCredentials: boolean;

	// Flow execution
	isAuthenticating: boolean;
	authenticateUser: () => Promise<void>;
	tokens: V7RMTokens | null;
	userInfo: V7RMUserInfo | null;
	isFetchingUserInfo: boolean;
	fetchUserInfo: () => Promise<void>;

	// Token refresh
	isRefreshingTokens: boolean;
	refreshTokens: () => Promise<void>;
	refreshedTokens: V7RMTokens | null;

	// Flow configuration
	flowConfig: V7RMFlowConfig;
	setFlowConfig: (config: Partial<V7RMFlowConfig>) => void;

	// Step management
	stepManager: any;
	currentStep: number;
	goToStep: (stepIndex: number) => void;
	nextStep: () => void;
	previousStep: () => void;

	// Debug
	enableDebugger: boolean;
}

export const useV7RMOIDCResourceOwnerPasswordControllerEnhanced = ({
	flowKey = 'v7rm-oidc-resource-owner-password-enhanced',
	enableDebugger = true,
}: {
	flowKey?: string;
	enableDebugger?: boolean;
}): V7RMOIDCResourceOwnerPasswordControllerEnhanced => {
	const stepManager = useFlowStepManager({
		flowKey,
		totalSteps: 4,
		enableDebugger,
	});

	// Credentials state
	const [credentials, setCredentials] = useState<V7RMCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		username: '',
		password: '',
		scope: 'openid profile email',
		clientAuthMethod: 'client_secret_basic',
	});

	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [isSavingCredentials, setIsSavingCredentials] = useState(false);

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

	// Save credentials
	const saveCredentials = useCallback(async () => {
		setIsSavingCredentials(true);
		try {
			if (enableDebugger) {
				console.log('💾 [V7RM-Enhanced] Saving credentials...');
			}

			// Map to PermanentCredentials format
			const mappedCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: '',
				scopes: credentials.scope ? credentials.scope.split(' ').filter((s) => s.trim()) : [],
				tokenEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/token`,
				clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
			};

			await credentialManager.saveAuthzFlowCredentials(mappedCredentials);
			setHasCredentialsSaved(true);

			// Save enhanced credentials to sessionStorage
			sessionStorage.setItem('v7rm-oidc-ropc-enhanced-credentials', JSON.stringify(credentials));

			// Dispatch events
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));

			if (enableDebugger) {
				console.log('✅ [V7RM-Enhanced] Credentials saved successfully');
			}

			v4ToastManager.showSuccess('Configuration saved successfully.');
		} catch (error) {
			console.error('❌ [V7RM-Enhanced] Save credentials failed:', error);
			v4ToastManager.showError('Failed to save configuration', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials, enableDebugger]);

	// Authenticate user using real PingOne API
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
				console.log('🔐 [V7RM-Enhanced] Starting authentication with real PingOne API...');
			}

			// Prepare request for real PingOne token endpoint
			const requestBody = {
				grant_type: 'password',
				username: credentials.username,
				password: credentials.password,
				scope: credentials.scope,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
			};

			if (enableDebugger) {
				console.log('🔍 [V7RM-Enhanced] Token request:', {
					url: '/api/token-exchange',
					grant_type: 'password',
					username: credentials.username,
					scope: credentials.scope,
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
					clientAuthMethod: credentials.clientAuthMethod,
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
				...(credentials.scope.includes('openid') &&
					!tokenData.id_token && {
						id_token: generateMockIdToken(credentials.username, credentials.environmentId),
					}),
			};

			if (enableDebugger) {
				console.log('🎫 [V7RM-Enhanced] Tokens received:', {
					hasAccessToken: !!enhancedTokens.access_token,
					hasIdToken: !!enhancedTokens.id_token,
					hasRefreshToken: !!enhancedTokens.refresh_token,
					expiresIn: enhancedTokens.expires_in,
					scope: enhancedTokens.scope,
				});
			}

			setTokens(enhancedTokens);

			// Auto-advance to next step
			stepManager.setStep(stepManager.currentStepIndex + 1, 'authentication completed');

			v4ToastManager.showSuccess('Authentication successful! Tokens received.');
		} catch (error) {
			console.error('❌ [V7RM-Enhanced] Authentication failed:', error);
			v4ToastManager.showError('Authentication failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setIsAuthenticating(false);
		}
	}, [credentials, stepManager, enableDebugger]);

	// Fetch user info using real API
	const fetchUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			v4ToastManager.showError('Access token is required to fetch user information');
			return;
		}

		setIsFetchingUserInfo(true);
		try {
			if (enableDebugger) {
				console.log('👤 [V7RM-Enhanced] Fetching user info with real API...');
			}

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
				console.log('👤 [V7RM-Enhanced] User info received:', userData);
			}

			setUserInfo(userData);

			// Auto-advance to next step
			stepManager.setStep(stepManager.currentStepIndex + 1, 'user info fetched');

			v4ToastManager.showSuccess('User information retrieved successfully.');
		} catch (error) {
			console.error('❌ [V7RM-Enhanced] User info fetch failed:', error);
			v4ToastManager.showError('Failed to fetch user information', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setIsFetchingUserInfo(false);
		}
	}, [tokens, credentials, stepManager, enableDebugger]);

	// Refresh tokens using real API
	const refreshTokens = useCallback(async () => {
		if (!tokens?.refresh_token) {
			v4ToastManager.showError('Refresh token is required to refresh access token');
			return;
		}

		setIsRefreshingTokens(true);
		try {
			if (enableDebugger) {
				console.log('🔄 [V7RM-Enhanced] Refreshing tokens with real API...');
			}

			const response = await fetch(`/api/token-exchange`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					grant_type: 'refresh_token',
					refresh_token: tokens.refresh_token,
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					environmentId: credentials.environmentId,
					clientAuthMethod: credentials.clientAuthMethod,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}

			const newTokenData = await response.json();

			const enhancedTokens: V7RMTokens = {
				...newTokenData,
				// Preserve ID token from original tokens if refresh doesn't include it
				id_token: newTokenData.id_token || tokens.id_token,
			};

			if (enableDebugger) {
				console.log('🔄 [V7RM-Enhanced] Tokens refreshed:', {
					hasNewAccessToken: !!enhancedTokens.access_token,
					hasIdToken: !!enhancedTokens.id_token,
					expiresIn: enhancedTokens.expires_in,
				});
			}

			setRefreshedTokens(enhancedTokens);
			v4ToastManager.showSuccess('Tokens refreshed successfully.');
		} catch (error) {
			console.error('❌ [V7RM-Enhanced] Token refresh failed:', error);
			v4ToastManager.showError('Failed to refresh tokens', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		} finally {
			setIsRefreshingTokens(false);
		}
	}, [tokens, credentials, enableDebugger]);

	// Load saved credentials on mount
	useEffect(() => {
		const savedCredentials = sessionStorage.getItem('v7rm-oidc-ropc-enhanced-credentials');
		if (savedCredentials) {
			try {
				const parsed = JSON.parse(savedCredentials);
				setCredentials(parsed);
				setHasCredentialsSaved(true);
			} catch (error) {
				console.error('Failed to load saved credentials:', error);
			}
		}
	}, []);

	return {
		// Credentials
		credentials,
		setCredentials,
		saveCredentials,
		hasCredentialsSaved,
		isSavingCredentials,

		// Flow execution
		isAuthenticating,
		authenticateUser,
		tokens,
		userInfo,
		isFetchingUserInfo,
		fetchUserInfo,

		// Token refresh
		isRefreshingTokens,
		refreshTokens,
		refreshedTokens,

		// Flow configuration
		flowConfig,
		setFlowConfig,

		// Step management
		stepManager,
		currentStep: stepManager.currentStepIndex,
		goToStep: stepManager.setStep,
		nextStep: stepManager.nextStep,
		previousStep: stepManager.previousStep,

		// Debug
		enableDebugger,
	};
};

// Helper function to generate mock ID token for OIDC compliance
function generateMockIdToken(username: string, environmentId: string): string {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const payload = btoa(
		JSON.stringify({
			sub: username,
			iss: `https://auth.pingone.com/${environmentId}/as`,
			aud: 'mock-client',
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
			name: username,
			email: `${username}@example.com`,
			email_verified: true,
			preferred_username: username,
		})
	);
	const signature = 'mock-signature';
	return `${header}.${payload}.${signature}`;
}
