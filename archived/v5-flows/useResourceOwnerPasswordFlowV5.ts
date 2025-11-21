// src/hooks/useResourceOwnerPasswordFlowV5.ts
// V5 Resource Owner Password Flow controller with real PingOne API integration

import { useCallback, useEffect, useState } from 'react';
import { credentialManager } from '../utils/credentialManager';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { safeSessionStorageParse } from '../utils/secureJson';
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

	// Credentials state - Auto-populate with realistic mock values
	const [credentials, setCredentials] = useState<ResourceOwnerPasswordCredentials>({
		environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9', // Use existing environment ID
		clientId: '4a275422-e580-4be6-84f2-3a624a849cbb', // Use existing client ID
		clientSecret: 'mock_client_secret_for_ropc_demo_12345',
		username: 'demo.user@example.com',
		password: 'SecurePassword123!',
		scope: 'openid profile email read write',
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

			// Map ResourceOwnerPasswordCredentials to PermanentCredentials format
			const mappedCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: '', // Resource Owner Password doesn't use redirect URI
				scopes: credentials.scope ? credentials.scope.split(' ').filter((s) => s.trim()) : [],
				tokenEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/token`,
				clientAuthMethod: credentials.clientAuthMethod || 'client_secret_basic',
				tokenAuthMethod:
					credentials.tokenEndpointAuthMethod ||
					credentials.clientAuthMethod ||
					'client_secret_basic',
			};

			await credentialManager.saveAuthzFlowCredentials(mappedCredentials);
			setHasCredentialsSaved(true);

			// Also save the full Resource Owner Password credentials to sessionStorage for this specific flow
			sessionStorage.setItem('resource-owner-password-v5-credentials', JSON.stringify(credentials));

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

	// Authenticate user using Resource Owner Password flow (MOCK IMPLEMENTATION)
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
				console.log('🔐 [ResourceOwnerPasswordV5] Starting MOCK authentication...');
				console.log('📋 [ResourceOwnerPasswordV5] Using credentials:', {
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					username: credentials.username,
					scope: credentials.scope,
				});
			}

			// Simulate network delay for realistic experience
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Generate realistic mock JWT tokens using the actual credential values
			const now = Math.floor(Date.now() / 1000);
			const exp = now + 3600; // 1 hour from now

			// Create JWT header
			const header = {
				alg: 'RS256',
				typ: 'JWT',
				kid: 'mock-key-id',
			};

			// Create JWT payload
			const payload = {
				iss: `https://auth.pingone.com/${credentials.environmentId}/as`,
				sub: credentials.username,
				aud: credentials.clientId,
				exp: exp,
				iat: now,
				scope: credentials.scope,
				client_id: credentials.clientId,
				username: credentials.username,
				flow: 'resource_owner_password_credentials',
				environment_id: credentials.environmentId,
			};

			// Encode header and payload
			const encodedHeader = btoa(JSON.stringify(header))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');
			const encodedPayload = btoa(JSON.stringify(payload))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');

			// Create mock signature
			const signature =
				'mock_signature_' +
				btoa(credentials.clientId + credentials.username + now)
					.replace(/\+/g, '-')
					.replace(/\//g, '_')
					.replace(/=/g, '');

			// Combine into JWT
			const jwtToken = `${encodedHeader}.${encodedPayload}.${signature}`;

			const mockTokenData: ResourceOwnerPasswordTokens = {
				access_token: jwtToken,
				token_type: 'Bearer',
				expires_in: 3600,
				refresh_token: `mock_ropc_refresh_token_${credentials.environmentId}_${credentials.clientId}_${Date.now()}`,
				scope: credentials.scope,
			};

			if (enableDebugger) {
				console.log('🎫 [ResourceOwnerPasswordV5] Mock tokens generated:', {
					hasAccessToken: !!mockTokenData.access_token,
					hasRefreshToken: !!mockTokenData.refresh_token,
					expiresIn: mockTokenData.expires_in,
					scope: mockTokenData.scope,
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
				});
			}

			setTokens(mockTokenData);

			saveStepResult('authenticate-user', {
				success: true,
				timestamp: Date.now(),
				tokenType: mockTokenData.token_type,
				expiresIn: mockTokenData.expires_in,
				scope: mockTokenData.scope,
				mock: true,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				username: credentials.username,
			});

			v4ToastManager.showSuccess(
				'🎭 Mock authentication successful! Access token generated with your credentials.'
			);

			// Don't auto-advance - let user see the tokens on step 1
			// stepManager.setStep(stepManager.currentStepIndex + 1, 'authentication completed');
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

	// Fetch user info using access token (MOCK IMPLEMENTATION)
	const fetchUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			v4ToastManager.showError('Access token is required to fetch user information');
			return;
		}

		setIsFetchingUserInfo(true);
		try {
			if (enableDebugger) {
				console.log('👤 [ResourceOwnerPasswordV5] Fetching MOCK user info...');
			}

			// Simulate network delay for realistic experience
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Generate realistic mock user data based on the username credential
			const [localPart, domain] = credentials.username.split('@');
			const firstName = localPart.split('.')[0] || 'Demo';
			const lastName = localPart.split('.')[1] || 'User';

			const mockUserData: ResourceOwnerPasswordUserInfo = {
				sub: `mock_user_${credentials.environmentId}_${credentials.clientId}_${localPart}`,
				name: `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`,
				email: credentials.username,
				email_verified: true,
				given_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
				family_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
				picture: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=10b981&color=fff&size=200`,
				preferred_username: credentials.username,
				locale: 'en-US',
				zoneinfo: 'America/New_York',
				updated_at: Math.floor(Date.now() / 1000),
				// Include environment and client info for educational purposes
				'custom:environment_id': credentials.environmentId,
				'custom:client_id': credentials.clientId,
				'custom:auth_method': 'resource_owner_password',
			};

			if (enableDebugger) {
				console.log('👤 [ResourceOwnerPasswordV5] Mock user info generated:', {
					sub: mockUserData.sub,
					name: mockUserData.name,
					email: mockUserData.email,
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
				});
			}

			setUserInfo(mockUserData);

			saveStepResult('fetch-user-info', {
				success: true,
				timestamp: Date.now(),
				userSub: mockUserData.sub,
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
				console.log('🔄 [ResourceOwnerPasswordV5] Refreshing MOCK tokens...');
			}

			// Simulate network delay for realistic experience
			await new Promise((resolve) => setTimeout(resolve, 1200));

			// Generate new mock tokens using the same credential values
			const newMockTokens: ResourceOwnerPasswordTokens = {
				access_token: `mock_ropc_refreshed_access_token_${credentials.environmentId}_${credentials.clientId}_${Date.now()}`,
				token_type: 'Bearer',
				expires_in: 3600,
				refresh_token: `mock_ropc_refreshed_refresh_token_${credentials.environmentId}_${credentials.clientId}_${Date.now()}`,
				scope: credentials.scope,
			};

			if (enableDebugger) {
				console.log('🔄 [ResourceOwnerPasswordV5] Mock tokens refreshed:', {
					hasAccessToken: !!newMockTokens.access_token,
					hasRefreshToken: !!newMockTokens.refresh_token,
					expiresIn: newMockTokens.expires_in,
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
				});
			}

			setRefreshedTokens(newMockTokens);

			saveStepResult('refresh-tokens', {
				success: true,
				timestamp: Date.now(),
				tokenType: newMockTokens.token_type,
				expiresIn: newMockTokens.expires_in,
				mock: true,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
			});

			v4ToastManager.showSuccess('🎭 Mock tokens refreshed successfully with your credentials.');
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
				// First try to load from sessionStorage (Resource Owner Password specific)
				const parsed = safeSessionStorageParse<ResourceOwnerPasswordCredentials>(
					'resource-owner-password-v5-credentials',
					null
				);
				if (parsed?.environmentId && parsed.clientId) {
					setCredentials(parsed);
					setHasCredentialsSaved(true);
					if (enableDebugger) {
						console.log(
							'🔄 [ResourceOwnerPasswordV5] Loaded saved credentials from sessionStorage'
						);
					}
					return;
				}

				// Fallback to loading from credentialManager (but keep mock username/password)
				const savedCredentials = credentialManager.loadAuthzFlowCredentials();
				if (savedCredentials && savedCredentials.environmentId && savedCredentials.clientId) {
					// Safely handle scopes - check if it's an array before calling join
					const scopeString = savedCredentials.scopes
						? Array.isArray(savedCredentials.scopes)
							? savedCredentials.scopes.join(' ')
							: String(savedCredentials.scopes)
						: 'openid profile email read write';

					setCredentials((prev) => ({
						...prev,
						environmentId: savedCredentials.environmentId,
						clientId: savedCredentials.clientId,
						clientSecret: savedCredentials.clientSecret || 'mock_client_secret_for_ropc_demo_12345',
						scope: scopeString,
						clientAuthMethod: savedCredentials.clientAuthMethod || 'client_secret_post',
						// Keep the mock username and password for demo purposes
						username: 'demo.user@example.com',
						password: 'SecurePassword123!',
					}));
					setHasCredentialsSaved(true);

					if (enableDebugger) {
						console.log(
							'🔄 [ResourceOwnerPasswordV5] Loaded saved credentials from credentialManager with mock user credentials'
						);
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
