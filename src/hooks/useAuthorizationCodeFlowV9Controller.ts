// src/hooks/useAuthorizationCodeFlowV9Controller.ts
// V9 Authorization Code Flow Controller - PingOne UI with New Storage & Messaging
// Updated controller for V9 architecture with unified storage and feedback service

import { useCallback, useEffect, useState } from 'react';
import type { FlowConfig } from '../components/FlowConfiguration';
import type { PKCECodes, StepCredentials } from '../components/steps/CommonSteps';
import { feedbackService } from '../services/feedback/feedbackService';
import { FlowCredentialService } from '../services/flowCredentialService';
import { unifiedStorageManager } from '../services/unifiedStorageManager';
import { trackTokenOperation } from '../utils/activityTracker';
import { applyClientAuthentication } from '../utils/clientAuthentication';
import { getDefaultConfig } from '../utils/flowConfigDefaults';
import { useFlowStepManager } from '../utils/flowStepSystem';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/oauth';

type FlowVariant = 'oauth' | 'oidc';

export interface AuthorizationCodeFlowV9ControllerOptions {
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
	id_token?: string; // Added for OIDC support
	[key: string]: unknown;
}

export interface AuthorizationCodeFlowV9Controller {
	flowVariant: FlowVariant;
	setFlowVariant: (variant: FlowVariant) => void;
	persistKey: string;
	credentials: StepCredentials;
	setCredentials: (creds: StepCredentials) => void;
	setFlowConfig: (config: FlowConfig) => void;
	flowConfig: FlowConfig;
	handleFlowConfigChange: (config: FlowConfig) => void;
	pkceCodes: PKCECodes;
	setPkceCodes: React.Dispatch<React.SetStateAction<PKCECodes>>;
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
	accessToken: string;
	idToken: string;
	refreshToken: string;
	isTokenExpired: () => boolean;
	introspectToken: () => Promise<void>;
	tokenIntrospection: Record<string, unknown> | null;
	// V9: New feedback methods
	showSuccessFeedback: (message: string) => void;
	showInfoFeedback: (message: string) => void;
	showWarningFeedback: (message: string) => void;
	showErrorFeedback: (message: string) => void;
}

const DEFAULT_FLOW_KEY = 'authorization-code-v9';

const useAuthorizationCodeFlowV9Controller = (
	options: AuthorizationCodeFlowV9ControllerOptions = {}
): AuthorizationCodeFlowV9Controller => {
	const { flowKey = DEFAULT_FLOW_KEY, defaultFlowVariant = 'oauth' } = options;

	const persistKey = `auth-code-${flowKey}`;
	useFlowStepManager({
		flowType: 'authorization-code',
		persistKey,
		defaultStep: 0,
	});

	// Core state
	const [flowVariant, setFlowVariant] = useState<FlowVariant>(defaultFlowVariant);
	const [credentials, setCredentials] = useState<StepCredentials>(() => ({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		authorizationEndpoint: '',
		tokenEndpoint: '',
		redirectUri: '',
		clientAuthMethod: 'client_secret_post',
	}));
	const [flowConfig, setFlowConfig] = useState<FlowConfig>(getDefaultConfig);
	const [pkceCodes, setPkceCodes] = useState<PKCECodes>({
		codeVerifier: '',
		codeChallenge: '',
		codeChallengeMethod: 'S256',
	});

	// URL and authorization state
	const [authUrl, setAuthUrl] = useState('');
	const [showUrlExplainer, setShowUrlExplainer] = useState(false);
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [authCode, setAuthCode] = useState('');
	const [isExchangingTokens, setIsExchangingTokens] = useState(false);

	// Token state
	const [tokens, setTokens] = useState<AuthorizationTokens | null>(null);
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
	const [isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);
	const [tokenIntrospection, setTokenIntrospection] = useState<Record<string, unknown> | null>(
		null
	);

	// V9: Feedback methods
	const showSuccessFeedback = useCallback((message: string) => {
		feedbackService.showSnackbar({
			type: 'success',
			message,
			duration: 4000,
		});
	}, []);

	const showInfoFeedback = useCallback((message: string) => {
		feedbackService.showSnackbar({
			type: 'info',
			message,
			duration: 3000,
		});
	}, []);

	const showWarningFeedback = useCallback((message: string) => {
		feedbackService.showSnackbar({
			type: 'warning',
			message,
			duration: 3000,
		});
	}, []);

	const showErrorFeedback = useCallback((message: string) => {
		feedbackService.showSnackbar({
			type: 'error',
			message,
			duration: 5000,
		});
	}, []);

	// V9: Persist state using unified storage
	useEffect(() => {
		const saveControllerState = async () => {
			try {
				await unifiedStorageManager.save(`${persistKey}-controller-state`, {
					flowVariant,
					credentials,
					flowConfig,
					pkceCodes,
					authUrl,
					authCode,
					tokens,
					userInfo,
					tokenIntrospection,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				console.error('Failed to save controller state:', error);
				showWarningFeedback('Failed to save controller state');
			}
		};

		saveControllerState();
	}, [
		persistKey,
		flowVariant,
		credentials,
		flowConfig,
		pkceCodes,
		authUrl,
		authCode,
		tokens,
		userInfo,
		tokenIntrospection,
		showWarningFeedback,
	]);

	// V9: Load state on mount
	useEffect(() => {
		const loadControllerState = async () => {
			try {
				const savedState = (await unifiedStorageManager.load(`${persistKey}-controller-state`)) as {
					flowVariant?: FlowVariant;
					credentials?: StepCredentials;
					flowConfig?: FlowConfig;
					pkceCodes?: PKCECodes;
					authUrl?: string;
					authCode?: string;
					tokens?: AuthorizationTokens;
					userInfo?: Record<string, unknown>;
					tokenIntrospection?: Record<string, unknown>;
					timestamp?: string;
				};

				if (savedState) {
					console.log('🔄 [V9] Restored controller state:', savedState);
					// Restore state if available and recent (within 1 hour)
					const stateAge = Date.now() - new Date(savedState.timestamp || '').getTime();
					if (stateAge < 3600000) {
						// 1 hour
						setFlowVariant(savedState.flowVariant || defaultFlowVariant);
						setCredentials(savedState.credentials || credentials);
						setFlowConfig(savedState.flowConfig || flowConfig);
						setPkceCodes(savedState.pkceCodes || pkceCodes);
						setAuthUrl(savedState.authUrl || '');
						setAuthCode(savedState.authCode || '');
						setTokens(savedState.tokens || null);
						setUserInfo(savedState.userInfo || null);
						setTokenIntrospection(savedState.tokenIntrospection || null);
					}
				}
			} catch (error) {
				console.error('Failed to load controller state:', error);
			}
		};

		loadControllerState();
	}, [persistKey, defaultFlowVariant]);

	// Load initial credentials
	useEffect(() => {
		const loadCredentials = async () => {
			try {
				const { credentials: loadedCreds } = await FlowCredentialService.loadFlowCredentials({
					flowKey: persistKey,
					defaultCredentials: credentials,
				});

				if (loadedCreds) {
					setCredentials(loadedCreds);
					showInfoFeedback('Credentials loaded successfully');
				}
			} catch (error) {
				console.error('Failed to load credentials:', error);
				showWarningFeedback('Failed to load credentials');
			}
		};

		loadCredentials();
	}, [persistKey, showInfoFeedback, showWarningFeedback]);

	const handleFlowConfigChange = useCallback(
		(config: FlowConfig) => {
			setFlowConfig(config);
			showInfoFeedback('Flow configuration updated');
		},
		[showInfoFeedback]
	);

	const generatePkceCodes = useCallback(async () => {
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			const newPkceCodes: PKCECodes = {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256',
			};

			setPkceCodes(newPkceCodes);
			showSuccessFeedback('PKCE codes generated successfully');
		} catch (error) {
			console.error('Failed to generate PKCE codes:', error);
			showErrorFeedback('Failed to generate PKCE codes');
		}
	}, [showSuccessFeedback, showErrorFeedback]);

	const generateAuthorizationUrl = useCallback(async () => {
		try {
			if (!credentials.clientId || !credentials.authorizationEndpoint || !credentials.redirectUri) {
				showWarningFeedback('Please configure client ID, authorization endpoint, and redirect URI');
				return;
			}

			// Generate PKCE codes if not present
			if (!pkceCodes.codeVerifier) {
				await generatePkceCodes();
			}

			const params = new URLSearchParams({
				response_type: 'code',
				client_id: credentials.clientId,
				redirect_uri: credentials.redirectUri,
				scope: flowVariant === 'oidc' ? 'openid profile email' : 'read write',
				state: `state_${Date.now()}`,
				code_challenge: pkceCodes.codeChallenge,
				code_challenge_method: pkceCodes.codeChallengeMethod,
			});

			const url = `${credentials.authorizationEndpoint}?${params.toString()}`;
			setAuthUrl(url);
			showSuccessFeedback('Authorization URL generated successfully');
		} catch (error) {
			console.error('Failed to generate authorization URL:', error);
			showErrorFeedback('Failed to generate authorization URL');
		}
	}, [
		credentials,
		pkceCodes,
		flowVariant,
		generatePkceCodes,
		showSuccessFeedback,
		showWarningFeedback,
		showErrorFeedback,
	]);

	const handlePopupAuthorization = useCallback(() => {
		if (!authUrl) {
			showWarningFeedback('Please generate authorization URL first');
			return;
		}

		setIsAuthorizing(true);
		const popup = window.open(
			authUrl,
			'oauth-popup',
			'width=600,height=700,scrollbars=yes,resizable=yes'
		);

		if (!popup) {
			showErrorFeedback('Popup blocked by browser');
			setIsAuthorizing(false);
			return;
		}

		showInfoFeedback('Authorization popup opened');
		// Handle popup response (implementation would depend on specific flow)
		setIsAuthorizing(false);
	}, [authUrl, showWarningFeedback, showErrorFeedback, showInfoFeedback]);

	const handleRedirectAuthorization = useCallback(() => {
		if (!authUrl) {
			showWarningFeedback('Please generate authorization URL first');
			return;
		}

		// Store current state before redirect
		sessionStorage.setItem(
			'oauth_redirect_state',
			JSON.stringify({
				flowKey,
				returnUrl: window.location.href,
			})
		);

		window.location.href = authUrl;
	}, [authUrl, flowKey, showWarningFeedback]);

	const setAuthCodeManually = useCallback(
		(code: string) => {
			setAuthCode(code);
			showSuccessFeedback('Authorization code set manually');
		},
		[showSuccessFeedback]
	);

	const resetFlow = useCallback(() => {
		setAuthUrl('');
		setAuthCode('');
		setTokens(null);
		setUserInfo(null);
		setTokenIntrospection(null);
		setIsAuthorizing(false);
		setIsExchangingTokens(false);
		setShowUrlExplainer(false);
		showInfoFeedback('Flow reset successfully');
	}, [showInfoFeedback]);

	const exchangeTokens = useCallback(async () => {
		if (!authCode || !credentials.tokenEndpoint) {
			showWarningFeedback('Authorization code and token endpoint are required');
			return;
		}

		setIsExchangingTokens(true);
		try {
			const body = new URLSearchParams({
				grant_type: 'authorization_code',
				code: authCode,
				redirect_uri: credentials.redirectUri,
				client_id: credentials.clientId,
				code_verifier: pkceCodes.codeVerifier,
			});

			// Apply client authentication
			const authHeaders = applyClientAuthentication({
				credentials,
				body,
				endpoint: credentials.tokenEndpoint,
			});

			const response = await fetch(credentials.tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					...authHeaders,
				},
				body: body.toString(),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
			}

			const tokenData: AuthorizationTokens = await response.json();
			setTokens(tokenData);

			// Store tokens using unified storage
			await unifiedStorageManager.save(`${persistKey}-tokens`, tokenData);

			trackTokenOperation('exchange', 'success');
			showSuccessFeedback('Tokens exchanged successfully');
		} catch (error) {
			console.error('Token exchange failed:', error);
			trackTokenOperation('exchange', 'error');
			showErrorFeedback(
				`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsExchangingTokens(false);
		}
	}, [
		authCode,
		credentials,
		pkceCodes.codeVerifier,
		persistKey,
		showWarningFeedback,
		showSuccessFeedback,
		showErrorFeedback,
	]);

	const fetchUserInfo = useCallback(async () => {
		if (!tokens?.access_token || flowVariant !== 'oidc') {
			showWarningFeedback('Access token required for OIDC user info');
			return;
		}

		setIsFetchingUserInfo(true);
		try {
			// This would typically use the userinfo endpoint from discovery
			const userInfoEndpoint = 'https://api.pingone.com/userinfo'; // Placeholder
			const response = await fetch(userInfoEndpoint, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to fetch user info');
			}

			const userInfoData = await response.json();
			setUserInfo(userInfoData);
			showSuccessFeedback('User info retrieved successfully');
		} catch (error) {
			console.error('Failed to fetch user info:', error);
			showErrorFeedback('Failed to fetch user info');
		} finally {
			setIsFetchingUserInfo(false);
		}
	}, [tokens, flowVariant, showWarningFeedback, showSuccessFeedback, showErrorFeedback]);

	const isTokenExpired = useCallback(() => {
		if (!tokens?.expires_in) return false;
		const expirationTime = Date.now() + tokens.expires_in * 1000;
		return Date.now() > expirationTime;
	}, [tokens]);

	const introspectToken = useCallback(async () => {
		if (!tokens?.access_token || !credentials.introspectionEndpoint) {
			showWarningFeedback('Access token and introspection endpoint required');
			return;
		}

		try {
			const body = new URLSearchParams({
				token: tokens.access_token,
			});

			const authHeaders = applyClientAuthentication({
				credentials,
				body,
				endpoint: credentials.introspectionEndpoint,
			});

			const response = await fetch(credentials.introspectionEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					...authHeaders,
				},
				body: body.toString(),
			});

			if (!response.ok) {
				throw new Error('Token introspection failed');
			}

			const introspectionData = await response.json();
			setTokenIntrospection(introspectionData);
			showSuccessFeedback('Token introspection completed');
		} catch (error) {
			console.error('Token introspection failed:', error);
			showErrorFeedback('Token introspection failed');
		}
	}, [tokens, credentials, showWarningFeedback, showSuccessFeedback, showErrorFeedback]);

	// Computed properties for easy access
	const accessToken = tokens?.access_token || '';
	const idToken = tokens?.id_token || '';
	const refreshToken = tokens?.refresh_token || '';

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
		accessToken,
		idToken,
		refreshToken,
		isTokenExpired,
		introspectToken,
		tokenIntrospection,
		// V9: Feedback methods
		showSuccessFeedback,
		showInfoFeedback,
		showWarningFeedback,
		showErrorFeedback,
	};
};

export default useAuthorizationCodeFlowV9Controller;
