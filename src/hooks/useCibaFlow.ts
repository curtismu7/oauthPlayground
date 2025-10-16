// src/hooks/useCibaFlow.ts
// OIDC Client Initiated Backchannel Authentication (CIBA) V5 flow logic
import { useCallback, useEffect, useRef, useState } from 'react';
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
	stateId: string;
	status: 'pending' | 'approved' | 'denied';
	interval: number;
	expiresIn: number;
	launchMode: 'poll';
	bindingMessage: string;
	userCode: string;
	expiresAt: number;
	requestContext?: string;
}

export interface CibaTokens {
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	client_id?: string;
	sub?: string;
	aud?: string | string[];
	iss?: string;
	iat?: number;
	exp?: number;
	issued_at?: number;
	server_timestamp?: string;
}

type CibaStage =
	| 'idle'
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
	simulateDecision: (decision: 'approved' | 'denied') => void;
}

const LOG_PREFIX = '[📲 CIBA MOCK]';
const CONFIG_STORAGE_KEY = 'oidc_ciba_v6_mock_config';
const TOKENS_STORAGE_KEY = 'oidc_ciba_v6_mock_tokens';
const AUTH_REQUEST_STORAGE_KEY = 'oidc_ciba_v6_mock_auth_request';
const MOCK_TOKENS = [
	'eyMockAccessToken_A1B2C3D4',
	'eyMockAccessToken_XYZ987654',
	'eyMockAccessToken_12345ABCDE',
];

const createMockTokens = (config: CibaConfig): CibaTokens => {
	const issued = Date.now();
	return {
		access_token: MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)],
		token_type: 'Bearer',
		expires_in: 3600,
		scope: config.scope,
		client_id: config.clientId,
		sub: config.loginHint,
		aud: `https://mock.api/${config.environmentId}`,
		iss: `https://mock.auth/${config.environmentId}`,
		iat: Math.floor(issued / 1000),
		exp: Math.floor(issued / 1000) + 3600,
		issued_at: issued,
		server_timestamp: new Date(issued).toISOString(),
	};
};

const createMockAuthRequest = (config: CibaConfig): CibaAuthRequest => {
	const stateId = `mock-ciba-${Math.random().toString(36).slice(2, 10)}`;
	return {
		stateId,
		status: 'pending',
		interval: 3,
		expiresIn: 90,
		launchMode: 'poll',
		bindingMessage: config.bindingMessage || 'Approve OAuth Playground CIBA Demo',
		userCode: Math.random().toString(36).slice(2, 6).toUpperCase(),
		expiresAt: Date.now() + 90 * 1000,
		requestContext: config.requestContext,
	};
};

const advanceMockAuthRequest = (request: CibaAuthRequest | null): CibaAuthRequest | null => {
	if (!request) {
		return null;
	}

	if (Date.now() > request.expiresAt) {
		return { ...request, status: 'denied' };
	}

	if (request.status === 'pending') {
		const shouldApprove = Math.random() > 0.25;
		return {
			...request,
			status: shouldApprove ? 'approved' : 'denied',
		};
	}

	return request;
};

export const useCibaFlow = (): UseCibaFlowReturn => {
	const [config, setConfigState] = useState<CibaConfig | null>(null);
	const [authRequest, setAuthRequest] = useState<CibaAuthRequest | null>(null);
	const [tokens, setTokens] = useState<CibaTokens | null>(null);
	const [stage, setStage] = useState<CibaStage>('idle');
	const [error, setError] = useState<string | null>(null);
	const [isPolling, setIsPolling] = useState(false);

	const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		try {
			const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
			const savedRequest = sessionStorage.getItem(AUTH_REQUEST_STORAGE_KEY);
			const savedTokens = localStorage.getItem(TOKENS_STORAGE_KEY);

			if (savedConfig) {
				setConfigState(JSON.parse(savedConfig));
			}
			if (savedRequest) {
				setAuthRequest(JSON.parse(savedRequest));
				setStage('awaiting-approval');
			}
			if (savedTokens) {
				setTokens(JSON.parse(savedTokens));
				setStage('success');
			}
		} catch (loadError) {
			console.warn(`${LOG_PREFIX} Failed to restore mock state:`, loadError);
		}

		return () => {
			if (pollingTimerRef.current) {
				clearTimeout(pollingTimerRef.current);
			}
		};
	}, []);

	const persistMockState = useCallback(
		(newConfig: CibaConfig | null, newRequest: CibaAuthRequest | null, newTokens: CibaTokens | null) => {
			if (newConfig) {
				setConfigState(newConfig);
				localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
			}

			setAuthRequest(newRequest);
			if (newRequest) {
				sessionStorage.setItem(AUTH_REQUEST_STORAGE_KEY, JSON.stringify(newRequest));
			} else {
				sessionStorage.removeItem(AUTH_REQUEST_STORAGE_KEY);
			}

			setTokens(newTokens);
			if (newTokens) {
				localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(newTokens));
			} else {
				localStorage.removeItem(TOKENS_STORAGE_KEY);
			}
		},
		[]
	);

	const clearPollingTimer = useCallback(() => {
		if (pollingTimerRef.current) {
			clearTimeout(pollingTimerRef.current);
			pollingTimerRef.current = null;
		}
	}, []);

	const completeWithTokens = useCallback(
		(issuedTokens: CibaTokens) => {
			persistMockState(config || buildInitialConfig(), null, issuedTokens);
			setStage('success');
			setIsPolling(false);
			setError(null);
			v4ToastManager.showSuccess('CIBA request approved. Tokens issued successfully.');
			clearPollingTimer();
		},
		[clearPollingTimer, config, persistMockState]
	);

	const failSimulation = useCallback(
		(message: string) => {
			persistMockState(config || buildInitialConfig(), null, null);
			setStage('error');
			setIsPolling(false);
			setError(message);
			v4ToastManager.showError(message);
			clearPollingTimer();
		},
		[clearPollingTimer, config, persistMockState]
	);

	const scheduleMockPoll = useCallback(
		(intervalSeconds: number) => {
			clearPollingTimer();
			pollingTimerRef.current = setTimeout(() => {
				setIsPolling(true);
				setStage('polling');
				setAuthRequest((current) => {
					const next = advanceMockAuthRequest(current);
					if (!next) {
						return null;
					}

					if (next.status === 'pending') {
						scheduleMockPoll(intervalSeconds);
					} else if (next.status === 'approved') {
						const issuedTokens = createMockTokens(config || buildInitialConfig());
						completeWithTokens(issuedTokens);
					} else {
						failSimulation('CIBA request denied by simulated user.');
					}

					return next;
				});
			}, Math.max(intervalSeconds, 1) * 1000);
		},
		[clearPollingTimer, completeWithTokens, config, failSimulation]
	);

	const simulateDecision = useCallback(
		(decision: 'approved' | 'denied') => {
			setAuthRequest((current) => {
				if (!current) {
					return current;
				}

				const next: CibaAuthRequest = {
					...current,
					status: decision,
				};

				if (decision === 'approved') {
					const issuedTokens = createMockTokens(config || buildInitialConfig());
					completeWithTokens(issuedTokens);
				} else {
					failSimulation('CIBA request denied by simulated user.');
				}

				return next;
			});
		},
		[completeWithTokens, config, failSimulation]
	);

	const initiateAuthentication = useCallback(async () => {
		const activeConfig = config || buildInitialConfig();

		if (!activeConfig.environmentId || !activeConfig.clientId || !activeConfig.scope) {
			const errorMsg = 'Environment ID, Client ID, and Scope are required.';
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		if (
			(activeConfig.authMethod === 'client_secret_post' || activeConfig.authMethod === 'client_secret_basic') &&
			!activeConfig.clientSecret
		) {
			const errorMsg = 'Client secret is required for the selected authentication method.';
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		setStage('initiating');
		setError(null);
		setTokens(null);
		persistMockState(activeConfig, null, null);

		const mockRequest = createMockAuthRequest(activeConfig);
		persistMockState(activeConfig, mockRequest, null);

		setStage('awaiting-approval');
		setIsPolling(true);
		v4ToastManager.showSuccess('Mock CIBA request sent. Awaiting simulated approval.');
		scheduleMockPoll(mockRequest.interval);
	}, [config, persistMockState, scheduleMockPoll]);

	const cancelPolling = useCallback(() => {
		clearPollingTimer();
		setIsPolling(false);
		setStage('idle');
		setError(null);
		persistMockState(config || buildInitialConfig(), null, tokens);
		v4ToastManager.showSuccess('Mock polling cancelled. You can restart the flow when ready.');
	}, [clearPollingTimer, config, persistMockState, tokens]);

	const reset = useCallback(() => {
		clearPollingTimer();
		setIsPolling(false);
		setStage('idle');
		setError(null);
		persistMockState(buildInitialConfig(), null, null);
		setAuthRequest(null);
		setTokens(null);
	}, [clearPollingTimer, persistMockState]);

	const updateConfig = useCallback(
		(newConfig: CibaConfig) => {
			persistMockState(newConfig, authRequest, tokens);
		},
		[authRequest, persistMockState, tokens]
	);

	return {
		config,
		authRequest,
		tokens,
		stage,
		isPolling,
		error,
		setConfig: updateConfig,
		initiateAuthentication,
		cancelPolling,
		reset,
		simulateDecision,
	};
};

const buildInitialConfig = (): CibaConfig => ({
	environmentId: 'mock-ciba-env-id',
	clientId: 'mock_ciba_client_id_demo_12345',
	clientSecret: 'mock_ciba_client_secret_demo_67890',
	scope: 'openid profile',
	loginHint: 'demo.ciba.user@example.com',
	bindingMessage: 'Approve OAuth Playground CIBA Demo',
	authMethod: 'client_secret_post',
	requestContext: `mock-ciba-session-${Math.random().toString(36).slice(2, 10)}`,
});

export default useCibaFlow;
