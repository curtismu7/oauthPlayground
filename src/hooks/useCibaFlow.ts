// src/hooks/useCibaFlow.ts
// OIDC Client Initiated Backchannel Authentication (CIBA) V5 flow logic
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeJsonParse } from '../utils/secureJson';
import { v4ToastManager } from '../utils/v4ToastMessages';

export type CibaAuthMethod = 'client_secret_post' | 'client_secret_basic';

export interface CibaConfig {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	scope: string;
	loginHint: string;
	bindingMessage?: string;
	authMethod: CibaAuthMethod;
	requestContext?: string;
}

export interface CibaAuthRequest {
	auth_req_id: string;
	expires_in: number;
	interval?: number;
	launch_mode?: string;
	binding_message?: string;
	user_code?: string;
	client_notification_token?: string;
	server_timestamp?: string;
}

export interface CibaTokens {
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	id_token?: string;
	issued_at?: number;
	server_timestamp?: string;
}

type CibaStage =
	| 'idle'
	| 'saving-config'
	| 'initiating'
	| 'awaiting-approval'
	| 'polling'
	| 'success'
	| 'error';

interface UseCibaFlowReturn {
	config: CibaConfig | null;
	authRequest: CibaAuthRequest | null;
	tokens: CibaTokens | null;
	stage: CibaStage;
	isPolling: boolean;
	error: string | null;
	setConfig: (config: CibaConfig) => void;
	initiateAuthentication: () => Promise<void>;
	cancelPolling: () => void;
	reset: () => void;
}

const LOG_PREFIX = '[📲 CIBA]';
const CONFIG_STORAGE_KEY = 'oidc_ciba_v5_config';
const TOKENS_STORAGE_KEY = 'oidc_ciba_v5_tokens';
const AUTH_REQUEST_STORAGE_KEY = 'oidc_ciba_v5_auth_request';

export const useCibaFlow = (): UseCibaFlowReturn => {
	const [config, setConfigState] = useState<CibaConfig | null>(null);
	const [authRequest, setAuthRequest] = useState<CibaAuthRequest | null>(null);
	const [tokens, setTokens] = useState<CibaTokens | null>(null);
	const [stage, setStage] = useState<CibaStage>('idle');
	const [error, setError] = useState<string | null>(null);
	const [isPolling, setIsPolling] = useState(false);

	const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
	const expiresAtRef = useRef<number | null>(null);

	// Load persisted config and state on mount
	useEffect(() => {
		try {
			const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
			if (savedConfig) {
				const parsed = safeJsonParse<CibaConfig>(savedConfig);
				if (parsed) {
					setConfigState(parsed);
					console.log(`${LOG_PREFIX} Loaded config from localStorage`);
				}
			}

			const savedAuthRequest = sessionStorage.getItem(AUTH_REQUEST_STORAGE_KEY);
			if (savedAuthRequest) {
				const parsedAuth = safeJsonParse<CibaAuthRequest>(savedAuthRequest);
				if (parsedAuth) {
					setAuthRequest(parsedAuth);
					expiresAtRef.current = Date.now() + parsedAuth.expires_in * 1000;
					setStage('awaiting-approval');
				}
			}

			const savedTokens = localStorage.getItem(TOKENS_STORAGE_KEY);
			if (savedTokens) {
				const parsedTokens = safeJsonParse<CibaTokens>(savedTokens);
				if (parsedTokens) {
					setTokens(parsedTokens);
					setStage('success');
				}
			}
		} catch (loadError) {
			console.warn(`${LOG_PREFIX} Failed to restore state:`, loadError);
		}

		return () => {
			if (pollingTimerRef.current) {
				clearTimeout(pollingTimerRef.current);
			}
		};
	}, []);

	const persistConfig = useCallback((newConfig: CibaConfig) => {
		setConfigState(newConfig);
		try {
			localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
			console.log(`${LOG_PREFIX} Saved config to localStorage`);
		} catch (storageError) {
			console.warn(`${LOG_PREFIX} Failed to persist config:`, storageError);
		}
	}, []);

	const persistAuthRequest = useCallback((request: CibaAuthRequest | null) => {
		setAuthRequest(request);
		if (!request) {
			sessionStorage.removeItem(AUTH_REQUEST_STORAGE_KEY);
			expiresAtRef.current = null;
			return;
		}

		try {
			sessionStorage.setItem(AUTH_REQUEST_STORAGE_KEY, JSON.stringify(request));
			expiresAtRef.current = Date.now() + request.expires_in * 1000;
			console.log(`${LOG_PREFIX} Auth request cached for polling`);
		} catch (storageError) {
			console.warn(`${LOG_PREFIX} Failed to persist auth request:`, storageError);
		}
	}, []);

	const persistTokens = useCallback((tokenSet: CibaTokens | null) => {
		setTokens(tokenSet);
		if (!tokenSet) {
			localStorage.removeItem(TOKENS_STORAGE_KEY);
			return;
		}

		try {
			localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokenSet));
			console.log(`${LOG_PREFIX} Tokens stored to localStorage`);
		} catch (storageError) {
			console.warn(`${LOG_PREFIX} Failed to persist tokens:`, storageError);
		}
	}, []);

	const clearPollingTimer = useCallback(() => {
		if (pollingTimerRef.current) {
			clearTimeout(pollingTimerRef.current);
			pollingTimerRef.current = null;
		}
	}, []);

	const scheduleNextPoll = useCallback(
		(intervalSeconds: number) => {
			clearPollingTimer();
			pollingTimerRef.current = setTimeout(async () => {
				await pollForTokens();
			}, Math.max(intervalSeconds, 1) * 1000);
		},
		[clearPollingTimer]
	);

	const pollForTokens = useCallback(async () => {
		if (!authRequest || !config) {
			console.warn(`${LOG_PREFIX} Polling skipped — missing auth request or config`);
			return;
		}

		if (expiresAtRef.current && Date.now() > expiresAtRef.current) {
			setStage('error');
			setError('Authentication request expired. Please try again.');
			clearPollingTimer();
			persistAuthRequest(null);
			setIsPolling(false);
			v4ToastManager.showError('CIBA request expired. Please initiate again.');
			return;
		}

		setStage('polling');
		setIsPolling(true);

		try {
			const response = await fetch('/api/ciba-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environment_id: config.environmentId,
					client_id: config.clientId,
					client_secret: config.clientSecret,
					auth_method: config.authMethod,
					auth_req_id: authRequest.auth_req_id,
				}),
			});

			const data = await response.json();

			if (response.status === 400 || response.status === 401) {
				const errorCode = data.error as string | undefined;
				if (errorCode === 'authorization_pending') {
					scheduleNextPoll((data.interval as number | undefined) ?? authRequest.interval ?? 5);
					return;
				}

				if (errorCode === 'slow_down') {
					const nextInterval =
						((data.interval as number | undefined) ?? authRequest.interval ?? 5) + 5;
					scheduleNextPoll(nextInterval);
					return;
				}

				if (errorCode === 'expired_token' || errorCode === 'access_denied') {
					setStage('error');
					setError(data.error_description || 'Authentication failed or expired.');
					v4ToastManager.showError(data.error_description || 'Backchannel authentication failed.');
					clearPollingTimer();
					persistAuthRequest(null);
					setIsPolling(false);
					return;
				}
			}

			if (!response.ok) {
				const errorMsg = data.error_description || data.error || `HTTP ${response.status}`;
				console.error(`${LOG_PREFIX} Token polling failed:`, errorMsg);
				setStage('error');
				setError(errorMsg);
				clearPollingTimer();
				persistAuthRequest(null);
				setIsPolling(false);
				v4ToastManager.showError(`Token polling failed: ${errorMsg}`);
				return;
			}

			const issuedTokens: CibaTokens = {
				...data,
				issued_at: Date.now(),
			};

			persistTokens(issuedTokens);
			persistAuthRequest(null);
			clearPollingTimer();
			setIsPolling(false);
			setStage('success');
			setError(null);

			try {
				localStorage.setItem('oauth_tokens', JSON.stringify(issuedTokens));
				localStorage.setItem('flow_source', 'oidc-ciba-v5');
				sessionStorage.setItem('flow_source', 'oidc-ciba-v5');

				const flowContext = {
					flow: 'oidc-ciba-v5',
					tokens: issuedTokens,
					credentials: config,
					timestamp: Date.now(),
				};
				sessionStorage.setItem('tokenManagementFlowContext', JSON.stringify(flowContext));

				// Dispatch events to notify dashboard and other components
				window.dispatchEvent(new CustomEvent('pingone-config-changed'));
				window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
				console.log(`${LOG_PREFIX} Configuration change events dispatched`);
			} catch (storageError) {
				console.warn(`${LOG_PREFIX} Failed to persist flow context:`, storageError);
			}

			v4ToastManager.showSuccess('Tokens received successfully!');
		} catch (pollError) {
			console.error(`${LOG_PREFIX} Polling request error:`, pollError);
			setStage('error');
			setError(pollError instanceof Error ? pollError.message : 'Polling failed');
			clearPollingTimer();
			persistAuthRequest(null);
			setIsPolling(false);
			v4ToastManager.showError('Polling error. Please try again.');
		}
	}, [authRequest, clearPollingTimer, config, persistAuthRequest, persistTokens, scheduleNextPoll]);

	const initiateAuthentication = useCallback(async () => {
		if (!config) {
			const errorMsg = 'Configuration is required before initiating CIBA.';
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		if (!config.environmentId || !config.clientId || !config.scope) {
			const errorMsg = 'Environment ID, Client ID, and Scope are required.';
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		if (config.authMethod === 'client_secret_post' || config.authMethod === 'client_secret_basic') {
			if (!config.clientSecret) {
				const errorMsg = 'Client secret is required for the selected authentication method.';
				setError(errorMsg);
				v4ToastManager.showError(errorMsg);
				return;
			}
		}

		setStage('initiating');
		setError(null);
		setTokens(null);
		persistTokens(null);
		persistAuthRequest(null);
		clearPollingTimer();

		try {
			const response = await fetch('/api/ciba-initiate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environment_id: config.environmentId,
					client_id: config.clientId,
					client_secret: config.clientSecret,
					auth_method: config.authMethod,
					scope: config.scope,
					login_hint: config.loginHint,
					binding_message: config.bindingMessage,
					request_context: config.requestContext,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				const errorMsg = data.error_description || data.error || `HTTP ${response.status}`;
				console.error(`${LOG_PREFIX} Initiation failed:`, errorMsg);
				setStage('error');
				setError(errorMsg);
				v4ToastManager.showError(`CIBA initiation failed: ${errorMsg}`);
				return;
			}

			const requestPayload: CibaAuthRequest = {
				...data,
				interval: data.interval ?? 5,
			};

			persistAuthRequest(requestPayload);
			setStage('awaiting-approval');
			setIsPolling(false);
			v4ToastManager.showInfo('CIBA request sent. Awaiting end-user confirmation.');
			scheduleNextPoll(requestPayload.interval ?? 5);
		} catch (initError) {
			console.error(`${LOG_PREFIX} Initiation error:`, initError);
			setStage('error');
			setError(initError instanceof Error ? initError.message : 'Failed to initiate CIBA flow');
			v4ToastManager.showError('Failed to initiate CIBA flow. See console for details.');
		}
	}, [clearPollingTimer, config, persistAuthRequest, persistTokens, scheduleNextPoll]);

	const cancelPolling = useCallback(() => {
		clearPollingTimer();
		setIsPolling(false);
		persistAuthRequest(null);
		setStage('idle');
		setError(null);
		v4ToastManager.showInfo('Polling cancelled. You can restart the flow when ready.');
	}, [clearPollingTimer, persistAuthRequest]);

	const reset = useCallback(() => {
		clearPollingTimer();
		persistAuthRequest(null);
		persistTokens(null);
		setError(null);
		setStage('idle');
		setIsPolling(false);
		setAuthRequest(null);
	}, [clearPollingTimer, persistAuthRequest, persistTokens]);

	return {
		config,
		authRequest,
		tokens,
		stage,
		isPolling,
		error,
		setConfig: persistConfig,
		initiateAuthentication,
		cancelPolling,
		reset,
	};
};

export default useCibaFlow;
