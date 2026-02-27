// src/pages/flows/KrogerGroceryStoreMFA_New.tsx
// 🛒 CLEAN KROGER MFA FLOW - Simplified working version

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthorizationCodeConfigModal } from '../../components/AuthorizationCodeConfigModal';
import RogerGroceryLogo from '../../components/RogerGroceryLogo';
import { WorkerTokenModal } from '../../components/WorkerTokenModal';
import { MFAProvider } from '../../contexts/MFAContext';
import { usePageScroll } from '../../hooks/usePageScroll';
import { buildAuthorizationRequest } from '../../services/authorizationRequestService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import {
	FiArrowLeft,
	FiCheckCircle,
	FiEye,
	FiEyeOff,
	FiHeart,
	FiKey,
	FiSearch,
	FiSend,
	FiSettings,
	FiShoppingCart,
	FiUser,
} from '../../services/commonImportsService';
import { comprehensiveFlowDataService } from '../../services/comprehensiveFlowDataService';
import { credentialStorageManager } from '../../services/credentialStorageManager';
import { FlowHeader } from '../../services/flowHeaderService';
import FlowUIComponentsService from '../../services/flowUIComponentsService';
import {
	type GuidanceVariant,
	OfflineAccessService,
	OfflineAccessSettingsPanel,
	useOfflineAccessSettings,
} from '../../services/offlineAccessService';
import { lookupPingOneUser } from '../../services/pingOneUserProfileService';
import { RedirectlessAuthService } from '../../services/redirectlessAuthService';
import { RedirectStateManager } from '../../services/redirectStateManager';
import {
	formatTimeRemaining,
	getValidWorkerToken,
	type TokenExpirationInfo,
} from '../../services/tokenExpirationService';
import { TokenManagementService, type TokenRequest } from '../../services/tokenManagementService';
import V7StepperService, { StepMetadata } from '../../services/v7StepperService';
import { generateCodeChallenge, generateCodeVerifier } from '../../utils/oauth';
import { v4ToastManager } from '../../utils/v4ToastMessages';
import { getAnyWorkerToken } from '../../utils/workerTokenDetection';
import KrogerGroceryStoreMFA from './KrogerGroceryStoreMFA';
import {
	DEFAULT_REDIRECT_PATH,
	DEFAULT_SCOPE,
	ERROR_MESSAGES,
	FLOW_KEY,
	KROGER_DEFAULT_PASSWORD,
	KROGER_DEFAULT_USERNAME,
	SUCCESS_MESSAGES,
	WORKER_TOKEN_EXPIRY_KEY,
	WORKER_TOKEN_STORAGE_KEY,
} from './kroger/krogerFlowConstants';
import {
	AuthSection,
	CloseButton,
	Container,
	ContentWrapper,
	ErrorMessage,
	FormGroup,
	HelperText,
	HeroBadge,
	HeroFooter,
	HeroLogoRow,
	HeroSubtitle,
	HeroTitle,
	HeroWrapper,
	Input,
	InputWrapper,
	KrogerHeader,
	KrogerLoginOverlay,
	KrogerLogo,
	KrogerNav,
	Label,
	LoginButton,
	LoginCard,
	LoginContainer,
	LoginTitle,
	MissingConfigCard,
	NavItem,
	PasswordToggle,
	RadioGroup,
	RadioLabel,
	SearchBox,
	SignUpLink,
	StepSection,
	SuccessMessage,
} from './kroger/krogerFlowStyles';

const {
	StepContainer,
	StepHeader,
	StepHeaderLeft,
	StepHeaderRight,
	StepHeaderTitle,
	StepHeaderSubtitle,
	StepNumber,
	StepTotal,
	StepContent,
	StepProgress,
	ProgressBar,
	ProgressText,
} = V7StepperService.createStepLayout({ theme: 'blue', showProgress: true });

const { Button: FlowButton } = FlowUIComponentsService.createComponents();

type LoginMode = 'redirect' | 'redirectless';

type AuthConfig = {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
};

interface PingOneUser {
	id: string;
	username: string;
	email?: string;
}

const getDefaultRedirectUri = () => {
	if (typeof window === 'undefined') {
		return DEFAULT_REDIRECT_PATH;
	}

	return `${window.location.origin}${DEFAULT_REDIRECT_PATH}`;
};

const buildInitialAuthConfig = (): AuthConfig => ({
	environmentId: '',
	clientId: '',
	clientSecret: '',
	redirectUri: getDefaultRedirectUri(),
	scopes: DEFAULT_SCOPE,
});

const offlineGuidanceVariantStyles: Record<
	GuidanceVariant,
	{
		background: string;
		border: string;
		heading: string;
		text: string;
	}
> = {
	info: {
		background: '#eff6ff',
		border: '#60a5fa',
		heading: '#1d4ed8',
		text: '#1e3a8a',
	},
	success: {
		background: '#ecfdf5',
		border: '#34d399',
		heading: '#047857',
		text: '#065f46',
	},
	warning: {
		background: '#fffbeb',
		border: '#f97316',
		heading: '#92400e',
		text: '#b45309',
	},
	danger: {
		background: '#fef2f2',
		border: '#f87171',
		heading: '#b91c1c',
		text: '#991b1b',
	},
};
const KrogerGroceryStoreMFA_New: React.FC = () => {
	usePageScroll();

	// Step metadata
	const steps: StepMetadata[] = [
		{
			id: 'authenticate',
			title: 'Authenticate with Kroger',
			subtitle: 'Sign in using redirectless login to simulate the Kroger storefront.',
		},
		{
			id: 'select-mfa-method',
			title: 'Select MFA Method',
			subtitle: 'Choose an MFA method to see how PingOne enrollment works.',
		},
		{
			id: 'manage-mfa-devices',
			title: 'Manage MFA Devices',
			subtitle: 'Walk through the full PingOne MFA device manager experience.',
		},
	];
	const totalSteps = steps.length;

	// State management
	const [authConfig, setAuthConfig] = useState<AuthConfig>(() => buildInitialAuthConfig());
	const [authConfigLoaded, setAuthConfigLoaded] = useState(false);
	const [workerToken, setWorkerToken] = useState<string | null>(null);
	const [workerTokenInfo, setWorkerTokenInfo] = useState<TokenExpirationInfo | null>(null);
	const [workerTokenTimeRemaining, setWorkerTokenTimeRemaining] = useState<string | null>(null);
	const [userInfo, setUserInfo] = useState<PingOneUser | null>(null);
	const [, setAuthError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [loginMode, setLoginMode] = useState<LoginMode>('redirectless');
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showLoginForm, setShowLoginForm] = useState(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [loginCredentials, setLoginCredentials] = useState({
		username: KROGER_DEFAULT_USERNAME,
		password: KROGER_DEFAULT_PASSWORD,
	});
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [selectedMfaMethod, setSelectedMfaMethod] = useState<'SMS' | 'EMAIL' | 'AUTH_APP' | null>(
		null
	);
	const [mfaStatusMessage, setMfaStatusMessage] = useState<string | null>(null);
	const [showAuthConfigModal, setShowAuthConfigModal] = useState(false);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [offlineAccessSettings, updateOfflineAccessSettings] =
		useOfflineAccessSettings('pingone-offline-access');
	const authScopes = useMemo(
		() =>
			authConfig.scopes && authConfig.scopes.trim().length > 0
				? authConfig.scopes.trim()
				: DEFAULT_SCOPE,
		[authConfig.scopes]
	);
	const offlineAccessEvaluation = useMemo(
		() => OfflineAccessService.evaluateAuthorizationCode(authScopes, offlineAccessSettings),
		[authScopes, offlineAccessSettings]
	);
	const previousOfflineSelectionRef = useRef<boolean>(offlineAccessEvaluation.includesOffline);
	useEffect(() => {
		if (offlineAccessEvaluation.includesOffline && !previousOfflineSelectionRef.current) {
			v4ToastManager.showSuccess(offlineAccessEvaluation.addToastMessage);
		}

		if (!offlineAccessEvaluation.includesOffline && previousOfflineSelectionRef.current) {
			const removalMessage = offlineAccessEvaluation.missingRequiredScope
				? 'offline_access removed, but your PingOne application requires it for refresh tokens. Add it back before continuing.'
				: offlineAccessEvaluation.removeToastMessage;
			const removalToast = offlineAccessEvaluation.missingRequiredScope
				? v4ToastManager.showWarning
				: v4ToastManager.showInfo;
			removalToast(removalMessage);
		}

		previousOfflineSelectionRef.current = offlineAccessEvaluation.includesOffline;
	}, [offlineAccessEvaluation]);
	const isReadyForMfa = useMemo(
		() => Boolean(workerToken && userInfo?.id && authConfig.environmentId),
		[authConfig.environmentId, userInfo?.id, workerToken]
	);
	const displayName = userInfo?.username || loginCredentials.username || KROGER_DEFAULT_USERNAME;

	// Debug: Log modal state changes
	useEffect(() => {
		console.log('[Kroger] showAuthConfigModal changed to:', showAuthConfigModal);
	}, [showAuthConfigModal]);

	const formatAuthErrorMessage = useCallback(
		(message: string): string => {
			if (!message) {
				return message;
			}

			const normalized = message.toLowerCase();
			const shouldAppend =
				normalized.includes('token exchange failed') ||
				normalized.includes('token request failed') ||
				normalized.includes('invalid_client') ||
				normalized.includes('request denied') ||
				normalized.includes('no client credentials');

			if (!shouldAppend) {
				return message;
			}

			const environmentDetail = `Environment ID: ${authConfig.environmentId || 'Not provided'}`;
			const clientDetail = `Client ID: ${authConfig.clientId || 'Not provided'}`;
			return `${message}\n${environmentDetail}\n${clientDetail}`;
		},
		[authConfig.environmentId, authConfig.clientId]
	);

	const displayAuthError = useCallback(
		(message: string) => {
			const detailedMessage = formatAuthErrorMessage(message);
			setAuthError(detailedMessage);
			v4ToastManager.showError(message);
		},
		[formatAuthErrorMessage]
	);

	const warnOfflineAccessUsage = useCallback(() => {
		if (offlineAccessEvaluation.missingRequiredScope) {
			v4ToastManager.showWarning(
				'offline_access is required when your PingOne application lists it under Allowed Scopes. Add it in Step 0 before continuing to receive refresh tokens.'
			);
		}

		if (offlineAccessEvaluation.shouldRemoveScope && offlineAccessEvaluation.includesOffline) {
			v4ToastManager.showInfo(
				'PingOne issues refresh tokens automatically for this app. You can remove offline_access to reduce unnecessary consent prompts.'
			);
		}
	}, [offlineAccessEvaluation]);

	/**
	 * Loads Authorization Code configuration for the Kroger flow from local storage.
	 */
	const hydrateAuthConfig = useCallback(() => {
		try {
			const saved = comprehensiveFlowDataService.loadFlowCredentialsIsolated?.(FLOW_KEY);

			if (saved) {
				const normalizedScopes = Array.isArray(saved.scopes)
					? saved.scopes.join(' ')
					: saved.scopes || DEFAULT_SCOPE;

				setAuthConfig({
					environmentId: saved.environmentId || '',
					clientId: saved.clientId || '',
					clientSecret: saved.clientSecret || '',
					redirectUri: saved.redirectUri || getDefaultRedirectUri(),
					scopes: normalizedScopes,
				});
			} else {
				setAuthConfig(buildInitialAuthConfig());
			}
		} catch (loadError) {
			console.error('[Kroger MFA] Failed to hydrate Authorization Code config', loadError);
			setAuthConfig(buildInitialAuthConfig());
		} finally {
			setAuthConfigLoaded(true);
		}
	}, []);

	/**
	 * Refreshes the stored worker token, clearing it if it is missing or expired.
	 * Checks for tokens from any source using getAnyWorkerToken.
	 */
	const hydrateWorkerToken = useCallback(() => {
		// First try to get any worker token from any source
		const anyToken = getAnyWorkerToken();

		if (anyToken) {
			// If we found a token from any source, use it
			setWorkerToken(anyToken);

			// Try to get expiration info from the flow-specific storage
			const tokenResult = getValidWorkerToken(WORKER_TOKEN_STORAGE_KEY, WORKER_TOKEN_EXPIRY_KEY, {
				clearExpired: false,
				showToast: false,
			});

			setWorkerTokenInfo(tokenResult.expirationInfo ?? null);
			if (tokenResult.expirationInfo?.expiresAt) {
				setWorkerTokenTimeRemaining(formatTimeRemaining(tokenResult.expirationInfo.expiresAt));
			} else {
				setWorkerTokenTimeRemaining('Token available');
			}
			return;
		}

		// No token found from any source
		setWorkerToken(null);
		setWorkerTokenInfo(null);
		setWorkerTokenTimeRemaining(null);
	}, []);

	/**
	 * Persists the last username used for login so redirect flows can resume smoothly.
	 */
	const rememberUsername = useCallback((username: string) => {
		if (typeof window === 'undefined') {
			return;
		}
		const trimmed = username.trim();
		if (!trimmed) {
			return;
		}
		// Use credentialStorageManager for flow state
		credentialStorageManager.saveFlowState(FLOW_KEY, { username: trimmed });
	}, []);

	/**
	 * Retrieves and clears the previously remembered username from session storage.
	 */
	const consumeRememberedUsername = useCallback(() => {
		if (typeof window === 'undefined') {
			return null;
		}
		const flowState = credentialStorageManager.loadFlowState(FLOW_KEY);
		if (flowState?.username) {
			// Clear the username after consuming it
			credentialStorageManager.saveFlowState(FLOW_KEY, { ...flowState, username: undefined });
			return flowState.username as string;
		}
		return null;
	}, []);

	/**
	 * Stores redirectless authorization metadata so the flow can resume after PingOne returns.
	 */
	const storeRedirectlessAuthCode = useCallback((code: string, state?: string) => {
		const currentState = credentialStorageManager.loadFlowState(FLOW_KEY) || {};
		const nextState: Record<string, unknown> = {
			...currentState,
			authCode: code,
		};

		if (state) {
			nextState.state = state;
		} else if (typeof currentState.state === 'string') {
			nextState.state = currentState.state;
		}

		credentialStorageManager.saveFlowState(FLOW_KEY, nextState);
	}, []);

	/**
	 * Fetches the PingOne user profile using the worker token for the given identifier.
	 */
	const fetchUserProfile = useCallback(
		async (identifier: string) => {
			if (!workerToken) {
				throw new Error(ERROR_MESSAGES.missingWorkerToken);
			}

			if (!authConfig.environmentId) {
				throw new Error(ERROR_MESSAGES.missingEnvironment);
			}

			const result = await lookupPingOneUser({
				environmentId: authConfig.environmentId,
				accessToken: workerToken,
				identifier,
			});

			const rawUser = (result?.user ?? null) as {
				id?: string;
				username?: string;
				email?: string | null;
			} | null;

			if (!rawUser?.id) {
				throw new Error(ERROR_MESSAGES.userLookupFailed);
			}

			const normalizedUser: PingOneUser = {
				id: rawUser.id,
				username: rawUser.username ?? identifier,
				...(rawUser.email ? { email: rawUser.email } : {}),
			};

			setUserInfo(normalizedUser);
			return normalizedUser;
		},
		[authConfig.environmentId, workerToken]
	);

	/**
	 * Exchanges an authorization code for tokens using the configured client credentials.
	 */
	const exchangeAuthorizationCode = useCallback(
		async (authCode: string) => {
			const redirectUri = authConfig.redirectUri || getDefaultRedirectUri();
			const scopes = authScopes;

			warnOfflineAccessUsage();

			// Load PKCE code verifier if it was used
			const pkceData = credentialStorageManager.loadPKCECodes(FLOW_KEY);
			const codeVerifier = pkceData?.codeVerifier;

			// Validate we have client credentials
			const trimmedClientId = authConfig.clientId?.trim();
			const trimmedClientSecret = authConfig.clientSecret?.trim();

			if (!trimmedClientId || !trimmedClientSecret) {
				console.error('[Kroger] Token exchange validation failed:', {
					hasClientId: !!trimmedClientId,
					hasClientSecret: !!trimmedClientSecret,
					clientIdLength: trimmedClientId?.length || 0,
					clientSecretLength: trimmedClientSecret?.length || 0,
				});
				throw new Error('Client ID and Client Secret are required for token exchange');
			}

			console.log('[Kroger] Exchanging authorization code with credentials:', {
				environmentId: authConfig.environmentId,
				clientId: `${trimmedClientId.substring(0, 8)}...`,
				hasClientSecret: !!trimmedClientSecret,
				clientSecretLength: trimmedClientSecret.length,
			});

			const tokenService = new TokenManagementService(authConfig.environmentId);
			const tokenExchangePayload: TokenRequest = {
				grantType: 'authorization_code',
				code: authCode,
				redirectUri,
				scope: scopes,
				clientId: trimmedClientId,
				clientSecret: trimmedClientSecret,
				environmentId: authConfig.environmentId,
			};

			if (codeVerifier) {
				tokenExchangePayload.codeVerifier = codeVerifier;
				console.log('[Kroger] Including PKCE code_verifier in token exchange');
			} else {
				console.warn('[Kroger] ⚠️ No code_verifier found - PKCE token exchange will fail!');
			}

			console.log('[Kroger] Token exchange payload:', {
				grantType: tokenExchangePayload.grantType,
				hasCode: !!tokenExchangePayload.code,
				hasCodeVerifier: !!tokenExchangePayload.codeVerifier,
				hasRedirectUri: !!tokenExchangePayload.redirectUri,
				hasClientId: !!tokenExchangePayload.clientId,
				hasClientSecret: !!tokenExchangePayload.clientSecret,
			});

			const tokenResponse = await tokenService.exchangeAuthorizationCode(tokenExchangePayload, {
				type: 'CLIENT_SECRET_POST',
				clientId: trimmedClientId,
				clientSecret: trimmedClientSecret,
			});

			// Clear PKCE codes after successful exchange (security best practice)
			credentialStorageManager.clearPKCECodes(FLOW_KEY);
			console.log('[Kroger] ✅ Cleared PKCE codes after successful token exchange');

			return tokenResponse;
		},
		[
			authConfig.clientId,
			authConfig.clientSecret,
			authConfig.environmentId,
			authConfig.redirectUri,
			authScopes,
			warnOfflineAccessUsage,
		]
	);

	/**
	 * Completes post-authorization tasks by exchanging tokens and hydrating user context.
	 */
	const finalizeAuthorization = useCallback(
		async (authCode: string, usernameHint?: string) => {
			if (!authCode) {
				return;
			}

			if (!authConfig.environmentId) {
				const message = ERROR_MESSAGES.missingEnvironment;
				displayAuthError(message);
				return;
			}

			if (!authConfig.clientId || !authConfig.clientSecret) {
				const message = ERROR_MESSAGES.missingCredentials;
				displayAuthError(message);
				return;
			}

			setIsAuthenticating(true);
			setAuthError(null);

			try {
				await exchangeAuthorizationCode(authCode);
				const storedUsername =
					usernameHint || consumeRememberedUsername() || loginCredentials.username;

				if (storedUsername) {
					setLoginCredentials((prev) => ({
						...prev,
						username: storedUsername,
					}));
				}

				if (storedUsername && workerToken) {
					try {
						await fetchUserProfile(storedUsername);
					} catch (lookupError) {
						const message =
							lookupError instanceof Error ? lookupError.message : ERROR_MESSAGES.userLookupFailed;
						v4ToastManager.showWarning(message);
					}
				}

				setIsAuthenticated(true);
				setSuccessMessage(SUCCESS_MESSAGES.tokenExchangeComplete);
				setShowLoginForm(false);
				setCurrentStep(1);
				v4ToastManager.showSuccess(SUCCESS_MESSAGES.tokenExchangeComplete);
				RedirectStateManager.clearFlowState(FLOW_KEY);
				await RedirectlessAuthService.clearFlowData(FLOW_KEY);
			} catch (error) {
				const message = error instanceof Error ? error.message : ERROR_MESSAGES.tokenExchangeFailed;
				displayAuthError(message);
			} finally {
				setIsAuthenticating(false);
			}
		},
		[
			authConfig.clientId,
			authConfig.clientSecret,
			authConfig.environmentId,
			consumeRememberedUsername,
			displayAuthError,
			exchangeAuthorizationCode,
			fetchUserProfile,
			loginCredentials.username,
			workerToken,
		]
	);

	/**
	 * Initiates the traditional redirect-based Authorization Code flow.
	 */
	const handleRedirectAuth = useCallback(async () => {
		try {
			if (!authConfig.environmentId) {
				throw new Error(ERROR_MESSAGES.missingEnvironment);
			}

			if (!authConfig.clientId || !authConfig.clientSecret) {
				throw new Error(ERROR_MESSAGES.missingCredentials);
			}

			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier);
			const state = `${FLOW_KEY}-${Date.now()}`;

			// Use credentialStorageManager for PKCE codes
			credentialStorageManager.savePKCECodes(FLOW_KEY, {
				codeVerifier: verifier,
				codeChallenge: challenge,
				codeChallengeMethod: 'S256',
			});

			// Save state in flow state
			credentialStorageManager.saveFlowState(FLOW_KEY, {
				state,
				username: loginCredentials.username,
			});
			rememberUsername(loginCredentials.username);

			RedirectStateManager.preserveFlowState(FLOW_KEY, {
				currentStep,
				credentials: {
					environmentId: authConfig.environmentId,
					clientId: authConfig.clientId,
					clientSecret: authConfig.clientSecret,
					redirectUri: authConfig.redirectUri,
					scopes: authScopes,
				},
			});

			warnOfflineAccessUsage();

			const { url } = buildAuthorizationRequest(
				{ environmentId: authConfig.environmentId },
				{
					clientId: authConfig.clientId,
					redirectUri: authConfig.redirectUri || getDefaultRedirectUri(),
					scope: authScopes,
					state,
					responseType: 'code',
					codeChallenge: challenge,
					codeChallengeMethod: 'S256',
					extraParams: {
						login_hint: loginCredentials.username.trim(),
					},
				}
			);

			window.location.href = url;
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unable to start redirect authentication.';
			displayAuthError(message);
		}
	}, [
		authConfig.clientId,
		authConfig.clientSecret,
		authConfig.environmentId,
		authConfig.redirectUri,
		authScopes,
		currentStep,
		displayAuthError,
		loginCredentials.username,
		rememberUsername,
		warnOfflineAccessUsage,
	]);
	const progressPercent = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;
	const currentStepMeta = steps[currentStep] ?? steps[0];
	/**
	 * Handles when an MFA setup button is pressed by surfacing contextual guidance.
	 */
	const handleMfaSetup = useCallback(
		(method: 'SMS' | 'EMAIL' | 'AUTH_APP') => {
			if (!isReadyForMfa) {
				v4ToastManager.showWarning(ERROR_MESSAGES.missingWorkerToken);
				return;
			}

			setSelectedMfaMethod(method);
			let message = '';

			if (method === 'SMS') {
				message =
					'SMS setup workflow initiated. Complete enrollment in the Kroger MFA panel below.';
			} else if (method === 'EMAIL') {
				message =
					'Email verification selected. Check your inbox and confirm the security code when prompted.';
			} else {
				message =
					'Authenticator app selected. Scan the QR code that appears in the Kroger MFA panel.';
			}

			setMfaStatusMessage(message);
			v4ToastManager.showSuccess(message);
			setCurrentStep(2);
		},
		[isReadyForMfa]
	);

	// Authentication handlers
	const handleStartAuth = useCallback(() => {
		setError(null);
		setAuthError(null);

		if (loginMode === 'redirectless') {
			setShowLoginForm(true);
			return;
		}

		void (async () => {
			await handleRedirectAuth();
		})();
	}, [handleRedirectAuth, loginMode]);

	/**
	 * Runs the PingOne redirectless login, exchanging the resulting code for tokens.
	 */
	const handleRedirectlessLogin = useCallback(async () => {
		const username = loginCredentials.username.trim();
		const password = loginCredentials.password;

		if (!username || !password) {
			setError('Please enter both username and password');
			return;
		}

		if (!authConfig.environmentId) {
			const message = ERROR_MESSAGES.missingEnvironment;
			setError(message);
			v4ToastManager.showError(message);
			return;
		}

		if (!authConfig.clientId || !authConfig.clientSecret) {
			const message = ERROR_MESSAGES.missingCredentials;
			setError(message);
			v4ToastManager.showError(message);
			return;
		}

		warnOfflineAccessUsage();

		setIsAuthenticating(true);
		setSuccessMessage(null);
		setError(null);

		try {
			rememberUsername(username);

			const authCode = await RedirectlessAuthService.completeFlow({
				credentials: {
					environmentId: authConfig.environmentId,
					clientId: authConfig.clientId,
					clientSecret: authConfig.clientSecret,
					redirectUri: authConfig.redirectUri || getDefaultRedirectUri(),
					scopes: authScopes,
					username,
					password,
				},
				flowKey: FLOW_KEY,
				onAuthCodeReceived: storeRedirectlessAuthCode,
			});

			if (!authCode) {
				v4ToastManager.showInfo('Complete the PingOne sign-on flow to continue.');
				return;
			}

			v4ToastManager.showSuccess(SUCCESS_MESSAGES.redirectlessComplete);
			setSuccessMessage(SUCCESS_MESSAGES.redirectlessComplete);
			await finalizeAuthorization(authCode, username);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : ERROR_MESSAGES.redirectlessFailed;
			setError(message);
			displayAuthError(message);
		} finally {
			setIsAuthenticating(false);
		}
	}, [
		authConfig.clientId,
		authConfig.clientSecret,
		authConfig.environmentId,
		authConfig.redirectUri,
		authScopes,
		displayAuthError,
		finalizeAuthorization,
		loginCredentials.password,
		loginCredentials.username,
		rememberUsername,
		storeRedirectlessAuthCode,
		warnOfflineAccessUsage,
	]);

	useEffect(() => {
		hydrateAuthConfig();
		hydrateWorkerToken();
	}, [hydrateAuthConfig, hydrateWorkerToken]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}

		const onFocus = () => {
			hydrateWorkerToken();
		};

		const onWorkerTokenUpdated = () => {
			console.log('[Kroger] Worker token updated event received');
			hydrateWorkerToken();
		};

		window.addEventListener('focus', onFocus);
		window.addEventListener('workerTokenUpdated', onWorkerTokenUpdated);

		return () => {
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('workerTokenUpdated', onWorkerTokenUpdated);
		};
	}, [hydrateWorkerToken]);

	useEffect(() => {
		const expiresAt = workerTokenInfo?.expiresAt ?? null;

		if (!expiresAt || typeof window === 'undefined') {
			setWorkerTokenTimeRemaining(null);
			return;
		}

		const updateLabel = () => {
			const nextLabel = formatTimeRemaining(expiresAt);
			setWorkerTokenTimeRemaining(nextLabel);
			if (nextLabel === 'EXPIRED') {
				hydrateWorkerToken();
			}
		};

		updateLabel();
		const intervalId = window.setInterval(updateLabel, 60000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [workerTokenInfo?.expiresAt, hydrateWorkerToken]);

	useEffect(() => {
		if (!authConfigLoaded) {
			return;
		}

		const processPendingAuthorization = async () => {
			if (typeof window === 'undefined') {
				return;
			}

			// IMMEDIATE FIX: Clear any stored codes if we don't have credentials
			if (!authConfig.clientId || !authConfig.clientSecret || !authConfig.environmentId) {
				console.log('[Kroger] No credentials configured - clearing all stored authorization codes');
				RedirectlessAuthService.clearFlowData(FLOW_KEY).catch(console.error);
				RedirectStateManager.clearFlowState(FLOW_KEY);
				return;
			}

			const preservedState = RedirectStateManager.restoreFlowState(FLOW_KEY);
			if (preservedState?.currentStep !== undefined) {
				setCurrentStep(preservedState.currentStep);
			}

			const currentUrl = new URL(window.location.href);
			const code = currentUrl.searchParams.get('code');

			if (code) {
				// Only process URL code if we have valid credentials
				if (authConfig.clientId && authConfig.clientSecret && authConfig.environmentId) {
					await finalizeAuthorization(code);
				}
				// Always clean up the URL
				currentUrl.searchParams.delete('code');
				currentUrl.searchParams.delete('state');

				const cleanedUrl = `${currentUrl.pathname}${
					currentUrl.searchParams.toString() ? `?${currentUrl.searchParams.toString()}` : ''
				}${currentUrl.hash}`;
				window.history.replaceState({}, document.title, cleanedUrl);
				return;
			}

			const resumeCredentials = {
				environmentId: authConfig.environmentId,
				clientId: authConfig.clientId,
				clientSecret: authConfig.clientSecret,
				redirectUri: authConfig.redirectUri || getDefaultRedirectUri(),
				scopes: authScopes,
			};

			if (
				resumeCredentials.environmentId &&
				resumeCredentials.clientId &&
				resumeCredentials.clientSecret
			) {
				try {
					const resumedCode = await RedirectlessAuthService.handlePendingResume({
						credentials: resumeCredentials,
						flowKey: FLOW_KEY,
						onAuthCodeReceived: storeRedirectlessAuthCode,
						onError: (resumeError) => {
							const message =
								resumeError instanceof Error
									? resumeError.message
									: ERROR_MESSAGES.redirectlessFailed;
							setAuthError(formatAuthErrorMessage(message));
						},
					});

					if (resumedCode) {
						await finalizeAuthorization(resumedCode);
						return;
					}
				} catch (resumeError) {
					const message =
						resumeError instanceof Error ? resumeError.message : ERROR_MESSAGES.redirectlessFailed;
					displayAuthError(message);
				}
			}

			// Only process stored code if we have valid credentials
			if (authConfig.clientId && authConfig.clientSecret && authConfig.environmentId) {
				const storedCode = RedirectlessAuthService.getStoredAuthCode(FLOW_KEY);
				if (storedCode?.code) {
					await finalizeAuthorization(storedCode.code);
				}
			} else {
				// Clear any stored codes if we don't have credentials
				RedirectlessAuthService.clearFlowData(FLOW_KEY).catch(console.error);
			}
		};

		void processPendingAuthorization();
	}, [
		authConfig.clientId,
		authConfig.clientSecret,
		authConfig.environmentId,
		authConfig.redirectUri,
		authScopes,
		authConfigLoaded,
		displayAuthError,
		finalizeAuthorization,
		formatAuthErrorMessage,
		storeRedirectlessAuthCode,
	]);

	/**
	 * Advances the flow to the MFA selection panel.
	 */
	const handleNavigateToMfa = useCallback(() => {
		setCurrentStep(1);
	}, []);

	/**
	 * Resets the flow to its initial state for a fresh walkthrough.
	 */
	const handleReset = useCallback(() => {
		setCurrentStep(0);
		setIsAuthenticated(false);
		setShowLoginForm(false);
		setError(null);
		setSuccessMessage(null);
		setAuthError(null);
		setLoginCredentials({
			username: KROGER_DEFAULT_USERNAME,
			password: KROGER_DEFAULT_PASSWORD,
		});
		setIsAuthenticating(false);
		setSelectedMfaMethod(null);
		setMfaStatusMessage(null);
		setUserInfo(null);
		hydrateWorkerToken();
	}, [hydrateWorkerToken]);

	/**
	 * Returns the user to the MFA method selection step from device management.
	 */
	const handleBackToMfaSelection = useCallback(() => {
		setCurrentStep(1);
	}, []);

	// Render Kroger header
	const renderKrogerHeader = () => (
		<HeroWrapper>
			<HeroBadge>
				<span role="img" aria-label="shopping cart">
					🛒
				</span>{' '}
				PingOne V7
			</HeroBadge>
			<HeroTitle>Kroger Grocery Store MFA Experience</HeroTitle>
			<HeroSubtitle>
				Guided PingOne MFA walkthrough embedded in a realistic Kroger storefront. Configure worker
				tokens, step through redirectless authentication, and manage MFA devices in a
				production-style UX.
			</HeroSubtitle>
			<HeroFooter>PingOne OAuth/OIDC Playground v7.4.0</HeroFooter>
			<HeroLogoRow>
				<RogerGroceryLogo />
			</HeroLogoRow>
		</HeroWrapper>
	);

	// Render auth mode selection
	const renderAuthModeSelection = () => {
		const hasClientConfig = Boolean(
			authConfig.environmentId && authConfig.clientId && authConfig.clientSecret
		);

		return (
			<AuthSection>
				<h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Choose Authentication Mode</h3>
				<RadioGroup>
					<RadioLabel>
						<input
							type="radio"
							name="loginMode"
							value="redirect"
							checked={loginMode === 'redirect'}
							onChange={(e) => setLoginMode(e.target.value as LoginMode)}
						/>
						Redirect Mode
					</RadioLabel>
					<RadioLabel>
						<input
							type="radio"
							name="loginMode"
							value="redirectless"
							checked={loginMode === 'redirectless'}
							onChange={(e) => setLoginMode(e.target.value as LoginMode)}
						/>
						Redirectless Mode
					</RadioLabel>
				</RadioGroup>

				<div
					style={{
						display: 'flex',
						flexWrap: 'nowrap',
						gap: '0.75rem',
						marginTop: '1rem',
						alignItems: 'stretch',
						width: '100%',
						overflowX: 'auto',
					}}
				>
					<div
						style={{
							flex: '0 0 18rem',
							minWidth: '12rem',
							order: 1,
							display: 'flex',
						}}
					>
						<FlowButton
							variant={hasClientConfig ? 'success' : 'danger'}
							onClick={() => {
								console.log('[Kroger] Opening auth config modal');
								setShowAuthConfigModal(true);
							}}
							disabled={isAuthenticating}
						>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.25rem',
									textAlign: 'center',
									width: '100%',
								}}
							>
								<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
									{hasClientConfig ? <FiCheckCircle /> : <FiSettings />}
									{hasClientConfig
										? 'Authorization Client Configured ✓'
										: 'Configure Authorization Client (Required)'}
								</span>
							</div>
						</FlowButton>
					</div>

					<div
						style={{
							flex: '0 0 18rem',
							minWidth: '12rem',
							order: 2,
							display: 'flex',
						}}
					>
						<FlowButton
							variant={workerToken ? 'success' : 'danger'}
							onClick={() => {
								hydrateWorkerToken();
								setShowWorkerTokenModal(true);
							}}
							disabled={isAuthenticating}
						>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.5rem',
									textAlign: 'center',
									width: '100%',
								}}
							>
								<span
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										fontSize: '0.95rem',
										fontWeight: 600,
									}}
								>
									{workerToken ? <FiCheckCircle size={18} /> : <FiKey size={18} />}
									{workerToken ? 'Worker Token Ready ✓' : 'Worker Token Required for MFA'}
								</span>
								{workerToken && workerTokenTimeRemaining ? (
									<span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
										Expires {workerTokenTimeRemaining}
									</span>
								) : (
									<span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Click to generate token</span>
								)}
							</div>
						</FlowButton>
					</div>

					{!isAuthenticated && !showLoginForm && (
						<div
							style={{
								flex: '0 0 18rem',
								minWidth: '12rem',
								order: 3,
								display: 'flex',
							}}
						>
							<FlowButton
								variant="primary"
								onClick={handleStartAuth}
								disabled={!hasClientConfig || isAuthenticating}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										textAlign: 'center',
										width: '100%',
									}}
								>
									Start {loginMode === 'redirectless' ? 'Redirectless' : 'Redirect'} Authentication
								</div>
							</FlowButton>
						</div>
					)}
				</div>

				{!hasClientConfig && authConfigLoaded && (
					<MissingConfigCard>
						<strong>Authorization Code client not configured.</strong>
						<p style={{ margin: '0.75rem 0 0' }}>
							Open the configuration panel and provide Environment ID, Client ID, and Client Secret
							to continue.
						</p>
						<div style={{ marginTop: '0.75rem' }}>
							<FlowButton
								variant="primary"
								onClick={() => {
									console.log('[Kroger] Opening auth config modal from warning card');
									setShowAuthConfigModal(true);
								}}
							>
								Open Configuration Panel
							</FlowButton>
						</div>
					</MissingConfigCard>
				)}

				<OfflineAccessSettingsPanel
					settings={offlineAccessSettings}
					onSettingsChange={updateOfflineAccessSettings}
					subtitle="Tell us how your PingOne authorization code client is configured so we can warn you when offline_access is required."
				/>

				{(() => {
					const guidanceStyles =
						offlineGuidanceVariantStyles[offlineAccessEvaluation.guidance.variant];
					return (
						<div
							style={{
								marginTop: '1rem',
								padding: '1rem 1.25rem',
								borderRadius: '0.75rem',
								border: `1px solid ${guidanceStyles.border}`,
								background: guidanceStyles.background,
							}}
						>
							<h4 style={{ margin: '0 0 0.5rem 0', color: guidanceStyles.heading }}>
								{offlineAccessEvaluation.guidance.title}
							</h4>
							<p
								style={{
									margin: 0,
									color: guidanceStyles.text,
									lineHeight: 1.6,
									fontSize: '0.9rem',
								}}
							>
								{offlineAccessEvaluation.guidance.description}{' '}
								<a
									href="https://apidocs.pingidentity.com/pingone/workflow-library/v1/api/#post-step-7-assign-the-mfa-sign-on-policy-to-the-web-application"
									target="_blank"
									rel="noopener noreferrer"
									style={{ color: guidanceStyles.heading, fontWeight: 600 }}
								>
									PingOne workflow Step&nbsp;7
								</a>
							</p>
						</div>
					);
				})()}
			</AuthSection>
		);
	};

	// Render professional Kroger login form
	const renderKrogerLoginForm = () => {
		if (!showLoginForm) {
			return null;
		}

		return (
			<KrogerLoginOverlay>
				<KrogerHeader>
					<KrogerLogo>
						<FiShoppingCart size={28} />
						Kroger
					</KrogerLogo>

					<SearchBox>
						<FiSearch size={18} color="#6b7280" />
						<input placeholder="Search products, deals, recipes..." />
					</SearchBox>

					<KrogerNav>
						<NavItem>
							<FiHeart size={20} />
							Lists
						</NavItem>
						<NavItem>
							<FiUser size={20} />
							Account
						</NavItem>
					</KrogerNav>
				</KrogerHeader>

				<LoginContainer>
					<LoginCard>
						<CloseButton onClick={() => setShowLoginForm(false)}>×</CloseButton>

						<LoginTitle>Welcome to Kroger</LoginTitle>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleRedirectlessLogin();
							}}
						>
							<FormGroup>
								<Label htmlFor="username">Email or Phone Number</Label>
								<Input
									id="username"
									type="text"
									placeholder="your.email@example.com or (555) 123-4567"
									value={loginCredentials.username}
									onChange={(e) =>
										setLoginCredentials((prev) => ({ ...prev, username: e.target.value }))
									}
									disabled={isAuthenticating}
								/>
								<HelperText>
									Enter the email or phone number associated with your Kroger account
								</HelperText>
							</FormGroup>

							<FormGroup>
								<Label htmlFor="password">Password</Label>
								<InputWrapper>
									<Input
										id="password"
										type={showPassword ? 'text' : 'password'}
										placeholder="••••••••••••"
										value={loginCredentials.password}
										onChange={(e) =>
											setLoginCredentials((prev) => ({ ...prev, password: e.target.value }))
										}
										disabled={isAuthenticating}
									/>
									<PasswordToggle
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										title={showPassword ? 'Hide password' : 'Show password'}
									>
										{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
									</PasswordToggle>
								</InputWrapper>
								<HelperText>
									Password must be at least 8 characters long
									{loginCredentials.password && (
										<span
											style={{
												color: loginCredentials.password.length >= 8 ? '#16a34a' : '#dc2626',
												marginLeft: '0.5rem',
											}}
										>
											({loginCredentials.password.length}/8 minimum)
										</span>
									)}
								</HelperText>
							</FormGroup>

							{error && <ErrorMessage>{error}</ErrorMessage>}

							<LoginButton
								type="submit"
								disabled={
									isAuthenticating || !loginCredentials.username || !loginCredentials.password
								}
							>
								{isAuthenticating ? (
									<>
										<span style={{ opacity: 0.7 }}>Signing you in</span>
										<span style={{ animation: 'pulse 1.5s infinite' }}>...</span>
									</>
								) : (
									'Sign In to Your Account'
								)}
							</LoginButton>

							<SignUpLink>
								New to Kroger?{' '}
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										v4ToastManager.showInfo('🚀 Create account feature coming soon!');
									}}
								>
									Create an account
								</a>
								<br />
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										v4ToastManager.showInfo('🔒 Password reset coming soon!');
									}}
									style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'inline-block' }}
								>
									Forgot your password?
								</a>
							</SignUpLink>
						</form>
					</LoginCard>
				</LoginContainer>
			</KrogerLoginOverlay>
		);
	};

	const renderStepBody = () => {
		if (currentStep === 0) {
			return (
				<StepSection>
					<CollapsibleHeader
						title="Authentication Setup"
						theme="orange"
						icon={<FiSettings />}
						defaultCollapsed={false}
					>
						<p style={{ marginBottom: '1rem', color: '#4b5563' }}>
							Choose your authentication method and sign in to proceed to MFA configuration.
						</p>

						{renderAuthModeSelection()}

						{successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

						{isAuthenticated && (
							<div style={{ margin: '1rem 0' }}>
								<p
									style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
								>
									<FiCheckCircle /> Authentication complete — preparing MFA configuration page.
								</p>
								<FlowButton variant="primary" onClick={handleNavigateToMfa} className="mt-3">
									Open MFA Configuration
								</FlowButton>
							</div>
						)}
					</CollapsibleHeader>
				</StepSection>
			);
		}

		if (currentStep === 1) {
			return (
				<>
					<div style={{ marginBottom: '1rem' }}>
						<FlowButton variant="secondary" onClick={handleReset} className="gap-2">
							<FiArrowLeft /> Back to Login
						</FlowButton>
					</div>

					<StepSection>
						<CollapsibleHeader
							title="🛡️ Choose Your MFA Method"
							theme="blue"
							icon={<FiSend />}
							defaultCollapsed={false}
						>
							<div style={{ padding: '0.5rem 0' }}>
								<div
									style={{
										background: '#f0f9ff',
										padding: '1rem',
										borderRadius: '8px',
										marginBottom: '1.5rem',
										border: '1px solid #0ea5e9',
									}}
								>
									<p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#0c4a6e' }}>
										👋 Welcome, {displayName}!
									</p>
									<p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
										You're authenticated. Select an MFA method to continue configuring device
										enrollment.
									</p>
								</div>

								{!isReadyForMfa && (
									<MissingConfigCard>
										<strong>Worker token required for MFA enrollment.</strong>
										<p style={{ margin: '0.75rem 0 0' }}>
											Generate a PingOne worker token with device scopes, then return to finish MFA
											setup.
										</p>
									</MissingConfigCard>
								)}

								<h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Available MFA Methods</h4>

								<div
									style={{
										display: 'grid',
										gap: '1rem',
										gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
									}}
								>
									<div
										style={{
											background: 'white',
											border:
												selectedMfaMethod === 'SMS' ? '2px solid #2563eb' : '1px solid #e5e7eb',
											borderRadius: '12px',
											padding: '1.5rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											<span style={{ fontSize: '2rem' }}>📱</span>
											<div>
												<div style={{ fontWeight: 600, fontSize: '16px' }}>SMS Authentication</div>
												<div style={{ fontSize: '12px', color: '#6b7280' }}>Most popular</div>
											</div>
										</div>
										<p
											style={{
												margin: '0 0 1rem 0',
												fontSize: '14px',
												color: '#6b7280',
												lineHeight: '1.5',
											}}
										>
											Receive verification codes via text message to your mobile phone.
										</p>
										<FlowButton
											variant="primary"
											className="w-full"
											onClick={() => handleMfaSetup('SMS')}
											disabled={!isReadyForMfa}
										>
											Setup SMS Verification
										</FlowButton>
									</div>

									<div
										style={{
											background: 'white',
											border:
												selectedMfaMethod === 'EMAIL' ? '2px solid #2563eb' : '1px solid #e5e7eb',
											borderRadius: '12px',
											padding: '1.5rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											<span style={{ fontSize: '2rem' }}>📧</span>
											<div>
												<div style={{ fontWeight: 600, fontSize: '16px' }}>Email Verification</div>
												<div style={{ fontSize: '12px', color: '#6b7280' }}>Quick setup</div>
											</div>
										</div>
										<p
											style={{
												margin: '0 0 1rem 0',
												fontSize: '14px',
												color: '#6b7280',
												lineHeight: '1.5',
											}}
										>
											Receive verification codes via email to your registered address.
										</p>
										<FlowButton
											variant="primary"
											className="w-full"
											onClick={() => handleMfaSetup('EMAIL')}
											disabled={!isReadyForMfa}
										>
											Setup Email Verification
										</FlowButton>
									</div>

									<div
										style={{
											background: 'white',
											border:
												selectedMfaMethod === 'AUTH_APP'
													? '2px solid #2563eb'
													: '1px solid #e5e7eb',
											borderRadius: '12px',
											padding: '1.5rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
												marginBottom: '1rem',
											}}
										>
											<span style={{ fontSize: '2rem' }}>🔐</span>
											<div>
												<div style={{ fontWeight: 600, fontSize: '16px' }}>Authenticator App</div>
												<div style={{ fontSize: '12px', color: '#6b7280' }}>Most secure</div>
											</div>
										</div>
										<p
											style={{
												margin: '0 0 1rem 0',
												fontSize: '14px',
												color: '#6b7280',
												lineHeight: '1.5',
											}}
										>
											Use TOTP apps like Google Authenticator or Microsoft Authenticator.
										</p>
										<FlowButton
											variant="primary"
											className="w-full"
											onClick={() => handleMfaSetup('AUTH_APP')}
											disabled={!isReadyForMfa}
										>
											Setup Authenticator App
										</FlowButton>
									</div>
								</div>

								<div
									style={{
										marginTop: '2rem',
										padding: '1rem',
										background: '#f0f9ff',
										border: '1px solid #0ea5e9',
										borderRadius: '8px',
									}}
								>
									<p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
										💡 <strong>Demo Mode:</strong> This is a guided simulation. Once you choose a
										method, we’ll walk through the full PingOne MFA device manager on the next page.
									</p>
								</div>
							</div>
						</CollapsibleHeader>
					</StepSection>
				</>
			);
		}

		return (
			<>
				<div style={{ marginBottom: '1rem' }}>
					<FlowButton variant="secondary" onClick={handleBackToMfaSelection} className="gap-2">
						<FiArrowLeft /> Back to MFA Method Selection
					</FlowButton>
				</div>

				<StepSection>
					<CollapsibleHeader
						title="🛡️ MFA Device Management"
						theme="blue"
						icon={<FiSend />}
						defaultCollapsed={false}
					>
						<div style={{ padding: '0.5rem 0' }}>
							<div
								style={{
									background: '#f0f9ff',
									padding: '1rem',
									borderRadius: '8px',
									marginBottom: '1.5rem',
									border: '1px solid #0ea5e9',
								}}
							>
								<p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#0c4a6e' }}>
									👋 Welcome, {displayName}! 👋 Welcome, {displayName}!
								</p>
								<p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
									You're now in the full PingOne MFA experience. Follow the prompts below to enroll
									and manage your devices.
								</p>
							</div>

							{mfaStatusMessage && (
								<div
									style={{
										marginBottom: '1.5rem',
										padding: '1rem',
										borderRadius: '8px',
										border: '1px solid #c4b5fd',
										background: '#e0f2fe',
										color: '#4338ca',
									}}
								>
									<strong>Selected method:</strong> {mfaStatusMessage}
								</div>
							)}

							<div
								style={{
									marginTop: '1.5rem',
									padding: '1rem',
									background: '#fef7ff',
									border: '1px solid #d946ef',
									borderRadius: '8px',
								}}
							>
								<p style={{ margin: '0 0 1rem 0', fontSize: '14px' }}>
									Below is the full PingOne MFA Device Manager. Use this to enroll and manage your
									MFA devices directly with PingOne.
								</p>
								{isReadyForMfa ? (
									<MFAProvider
										accessToken={workerToken as string}
										environmentId={authConfig.environmentId}
										userId={userInfo?.id ?? loginCredentials.username}
									>
										<KrogerGroceryStoreMFA />
									</MFAProvider>
								) : (
									<MissingConfigCard>
										<strong>Missing worker token or user context.</strong>
										<p style={{ margin: '0.75rem 0 0' }}>
											Complete authentication and ensure a valid worker token is generated before
											managing MFA devices.
										</p>
									</MissingConfigCard>
								)}
							</div>
						</div>
					</CollapsibleHeader>
				</StepSection>
			</>
		);
	};

	return (
		<Container>
			<ContentWrapper>
				{renderKrogerHeader()}
				<StepContainer>
					<StepHeader>
						<StepHeaderLeft>
							<StepHeaderTitle>{currentStepMeta.title}</StepHeaderTitle>
							<StepHeaderSubtitle>{currentStepMeta.subtitle}</StepHeaderSubtitle>
							{totalSteps > 1 && (
								<StepProgress>
									<ProgressBar $progress={progressPercent} />
									<ProgressText>{`Step ${currentStep + 1} of ${totalSteps}`}</ProgressText>
								</StepProgress>
							)}
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{currentStep + 1}</StepNumber>
							<StepTotal>of {totalSteps}</StepTotal>
						</StepHeaderRight>
					</StepHeader>
					<StepContent>
						<FlowHeader flowType="kroger-grocery-store-mfa" />
						{renderStepBody()}
					</StepContent>
				</StepContainer>
			</ContentWrapper>
			{renderKrogerLoginForm()}
			<AuthorizationCodeConfigModal
				isOpen={showAuthConfigModal}
				onClose={() => {
					console.log('[Kroger] Closing auth config modal');
					setShowAuthConfigModal(false);
				}}
				flowType={FLOW_KEY}
				initialCredentials={{
					environmentId: authConfig.environmentId,
					clientId: authConfig.clientId,
					clientSecret: authConfig.clientSecret,
					redirectUri: authConfig.redirectUri,
					scopes: authConfig.scopes,
				}}
				onCredentialsSaved={() => {
					console.log('[Kroger] Credentials saved, rehydrating config');
					hydrateAuthConfig();
				}}
			/>
			<WorkerTokenModal
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onContinue={() => {
					// Refresh worker token from storage
					const tokenResult = getValidWorkerToken(
						WORKER_TOKEN_STORAGE_KEY,
						WORKER_TOKEN_EXPIRY_KEY,
						{
							clearExpired: true,
							showToast: false,
						}
					);
					setWorkerToken(tokenResult.isValid ? (tokenResult.token ?? null) : null);
					setShowWorkerTokenModal(false);
					if (tokenResult.isValid) {
						v4ToastManager.showSuccess('Worker token loaded successfully!');
					}
				}}
				flowType={FLOW_KEY}
			/>
		</Container>
	);
};

export default KrogerGroceryStoreMFA_New;
