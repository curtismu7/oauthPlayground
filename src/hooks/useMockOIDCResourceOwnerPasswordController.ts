// src/hooks/useMockOIDCResourceOwnerPasswordController.ts

import React, { useCallback, useState } from 'react';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { generateMockTokens, generateMockUserInfo } from '../utils/mockOAuth';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface MockCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	scopes: string[];
}

export interface MockTokens {
	access_token: string;
	token_type: string;
	expires_in: number;
	id_token?: string;
	refresh_token?: string;
	scope: string;
}

export interface MockUserInfo {
	sub: string;
	name: string;
	email: string;
	email_verified: boolean;
	given_name: string;
	family_name: string;
	picture?: string;
}

export interface MockFlowConfig {
	includeRefreshToken: boolean;
	includeIdToken: boolean;
	customScopes: string;
	tokenExpiry: number;
}

export interface MockOIDCResourceOwnerPasswordController {
	// Credentials
	credentials: MockCredentials;
	setCredentials: (credentials: MockCredentials) => void;
	saveCredentials: () => Promise<void>;
	hasCredentialsSaved: boolean;
	hasUnsavedCredentialChanges: boolean;
	isSavingCredentials: boolean;

	// Flow execution
	isAuthenticating: boolean;
	authenticateUser: () => Promise<void>;
	tokens: MockTokens | null;
	userInfo: MockUserInfo | null;
	isFetchingUserInfo: boolean;
	fetchUserInfo: () => Promise<void>;

	// Refresh tokens
	refreshTokens: () => Promise<void>;
	refreshedTokens: MockTokens | null;
	isRefreshingTokens: boolean;

	// Flow management
	flowConfig: MockFlowConfig;
	handleFlowConfigChange: (config: Partial<MockFlowConfig>) => void;
	resetFlow: () => void;
	stepManager: ReturnType<typeof useFlowStepManager>;
	persistKey: string;
	hasStepResult: (stepKey: string) => boolean;
	saveStepResult: (stepKey: string, result: any) => void;
}

interface UseMockOIDCResourceOwnerPasswordControllerParams {
	flowKey: string;
	defaultFlowVariant?: 'oidc';
	enableDebugger?: boolean;
}

export const useMockOIDCResourceOwnerPasswordController = ({
	flowKey,
	enableDebugger = false,
}: UseMockOIDCResourceOwnerPasswordControllerParams): MockOIDCResourceOwnerPasswordController => {
	const persistKey = `mock-oidc-rop-${flowKey}`;

	// Step management
	const stepManager = useFlowStepManager({
		flowType: 'mock-oidc-resource-owner-password',
		persistKey,
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Credentials state
	const [credentials, setCredentials] = useState<MockCredentials>({
		environmentId: 'mock-env-12345',
		clientId: 'mock-client-id',
		clientSecret: 'mock-client-secret',
		username: 'demo@example.com',
		password: 'demo-password',
		scopes: ['openid', 'profile', 'email'],
	});

	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = useState(false);

	// Flow state
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [tokens, setTokens] = useState<MockTokens | null>(null);
	const [userInfo, setUserInfo] = useState<MockUserInfo | null>(null);
	const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);
	const [refreshedTokens, setRefreshedTokens] = useState<MockTokens | null>(null);
	const [isRefreshingTokens, setIsRefreshingTokens] = useState(false);

	// Flow configuration
	const [flowConfig, setFlowConfig] = useState<MockFlowConfig>({
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

			// Save to localStorage for persistence
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

	// Authenticate user (mock implementation)
	const authenticateUser = useCallback(async () => {
		setIsAuthenticating(true);
		try {
			// Simulate authentication delay
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Validate mock credentials
			if (!credentials.username || !credentials.password) {
				throw new Error('Username and password are required');
			}

			// Generate mock tokens
			const mockTokens = generateMockTokens({
				scopes: credentials.scopes,
				includeRefreshToken: flowConfig.includeRefreshToken,
				includeIdToken: flowConfig.includeIdToken,
				expiresIn: flowConfig.tokenExpiry,
			});

			setTokens(mockTokens);

			v4ToastManager.showSuccess('saveConfigurationSuccess');

			if (enableDebugger) {
				console.log('🎫 Mock tokens generated:', mockTokens);
			}

			// Auto-advance to next step
			stepManager.setStep(stepManager.currentStepIndex + 1, 'authentication completed');
		} catch (error) {
			v4ToastManager.showError('networkError');
			console.error('Mock authentication failed:', error);
		} finally {
			setIsAuthenticating(false);
		}
	}, [credentials, flowConfig, stepManager, enableDebugger]);

	// Fetch user info (mock implementation)
	const fetchUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			v4ToastManager.showError('stepError');
			return;
		}

		setIsFetchingUserInfo(true);
		try {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1500));

			const mockUserInfo = generateMockUserInfo(credentials.username);
			setUserInfo(mockUserInfo);

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
	}, [tokens, credentials.username, enableDebugger]);

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
	const handleFlowConfigChange = useCallback((config: Partial<MockFlowConfig>) => {
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
		const savedCredentials = localStorage.getItem(`${persistKey}-credentials`);
		if (savedCredentials) {
			try {
				const parsed = JSON.parse(savedCredentials);
				setCredentials(parsed);
				setHasCredentialsSaved(true);
			} catch (error) {
				console.error('Failed to load saved credentials:', error);
			}
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
