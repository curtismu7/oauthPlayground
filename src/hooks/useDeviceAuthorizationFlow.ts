// src/hooks/useDeviceAuthorizationFlow.ts
// Device Authorization Flow state management and logic
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface DeviceCodeResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete?: string;
	expires_in: number;
	interval: number;
}

export interface DeviceTokens {
	access_token: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
	id_token?: string;
	scope?: string;
}

export interface PollingStatus {
	isPolling: boolean;
	attempts: number;
	maxAttempts: number;
	lastAttempt: number | null;
	nextAttempt: number | null;
	error: string | null;
	status: 'idle' | 'polling' | 'success' | 'error' | 'expired';
}

export interface DeviceAuthCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	scopes: string;
}

interface UseDeviceAuthorizationFlowReturn {
	// State
	deviceCodeData: DeviceCodeResponse | null;
	tokens: DeviceTokens | null;
	pollingStatus: PollingStatus;
	expiresAt: number | null;
	timeRemaining: number;
	credentials: DeviceAuthCredentials | null;

	// Actions
	setCredentials: (creds: DeviceAuthCredentials) => void;
	requestDeviceCode: () => Promise<void>;
	startPolling: () => void;
	stopPolling: () => void;
	reset: () => void;

	// Utilities
	formatTimeRemaining: (ms: number) => string;
}

const LOG_PREFIX = '[📺 OAUTH-DEVICE]';

export const useDeviceAuthorizationFlow = (): UseDeviceAuthorizationFlowReturn => {
	const [deviceCodeData, setDeviceCodeData] = useState<DeviceCodeResponse | null>(null);
	const [tokens, setTokens] = useState<DeviceTokens | null>(null);
	const [pollingStatus, setPollingStatus] = useState<PollingStatus>({
		isPolling: false,
		attempts: 0,
		maxAttempts: 0,
		lastAttempt: null,
		nextAttempt: null,
		error: null,
		status: 'idle',
	});
	const [expiresAt, setExpiresAt] = useState<number | null>(null);
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [credentials, setCredentialsState] = useState<DeviceAuthCredentials | null>(null);

	// Wrapper to persist credentials to localStorage
	const setCredentials = useCallback((creds: DeviceAuthCredentials) => {
		setCredentialsState(creds);
		try {
			localStorage.setItem('device_flow_credentials', JSON.stringify(creds));
			console.log(`${LOG_PREFIX} [INFO] Credentials saved to localStorage`);
		} catch (e) {
			console.warn(`${LOG_PREFIX} [WARN] Failed to save credentials to localStorage:`, e);
		}
	}, []);

	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Stop polling - defined early to avoid hoisting issues
	const stopPolling = useCallback(() => {
		console.log(`${LOG_PREFIX} [INFO] Stopping polling`);

		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}

		if (pollingTimeoutRef.current) {
			clearTimeout(pollingTimeoutRef.current);
			pollingTimeoutRef.current = null;
		}

		setPollingStatus((prev) => ({
			...prev,
			isPolling: false,
		}));
	}, []);

	// Load credentials from localStorage on mount
	useEffect(() => {
		try {
			const savedCreds = localStorage.getItem('device_flow_credentials');
			if (savedCreds) {
				const creds = JSON.parse(savedCreds);
				setCredentialsState(creds);
				console.log(`${LOG_PREFIX} [INFO] Loaded credentials from localStorage`);
			}
		} catch (e) {
			console.warn(`${LOG_PREFIX} [WARN] Failed to load credentials from localStorage:`, e);
		}
	}, []);

	// Countdown timer for device code expiration
	useEffect(() => {
		if (!expiresAt) {
			setTimeRemaining(0);
			return;
		}

		const interval = setInterval(() => {
			const remaining = Math.max(0, expiresAt - Date.now());
			setTimeRemaining(remaining);

			if (remaining === 0) {
				console.log(`${LOG_PREFIX} [WARN] Device code expired`);
				setPollingStatus((prev) => ({
					...prev,
					isPolling: false,
					error: 'Device code expired',
					status: 'expired',
				}));
				stopPolling();
			}
		}, 1000);

		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [expiresAt, stopPolling]); // stopPolling is stable, no need in deps

	// Format time remaining as MM:SS
	const formatTimeRemaining = useCallback((ms: number): string => {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}, []);

	// Request device code from authorization server
	const requestDeviceCode = useCallback(async () => {
		const timestamp = new Date().toISOString();
		console.log(`${LOG_PREFIX} [INFO] [${timestamp}] Requesting device code...`);

		if (!credentials?.environmentId || !credentials?.clientId) {
			const error = 'Missing credentials: environmentId and clientId are required';
			console.error(`${LOG_PREFIX} [ERROR] ${error}`);
			v4ToastManager.showError('Please configure PingOne credentials first.');
			return;
		}

		try {
			const deviceAuthEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/device_authorization`;

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				scope: credentials.scopes || 'openid',
			});

			// Add client_secret if available (for confidential clients)
			if (credentials.clientSecret) {
				params.append('client_secret', credentials.clientSecret);
				console.log(`${LOG_PREFIX} [INFO] Using confidential client authentication`);
			} else {
				console.log(`${LOG_PREFIX} [INFO] Using public client authentication (no client_secret)`);
			}

			console.log(`${LOG_PREFIX} [INFO] Device authorization endpoint: ${deviceAuthEndpoint}`);
			console.log(`${LOG_PREFIX} [INFO] Scopes: ${credentials.scopes || 'openid'}`);

			const response = await fetch(deviceAuthEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: params.toString(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorData: any = {};
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { message: errorText };
				}

				console.error(`${LOG_PREFIX} [ERROR] Device code request failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorData,
				});

				throw new Error(
					errorData.error_description || errorData.message || `Request failed: ${response.status}`
				);
			}

			const data: DeviceCodeResponse = await response.json();

			// Mask sensitive data in logs
			console.log(`${LOG_PREFIX} [INFO] Device code received:`, {
				user_code: data.user_code,
				verification_uri: data.verification_uri,
				has_complete_uri: !!data.verification_uri_complete,
				expires_in: data.expires_in,
				interval: data.interval,
				device_code: `${data.device_code.substring(0, 10)}...`, // Masked
			});

			setDeviceCodeData(data);
			setExpiresAt(Date.now() + data.expires_in * 1000);

			const maxAttempts = Math.floor(data.expires_in / data.interval);
			setPollingStatus((prev) => ({
				...prev,
				maxAttempts,
				status: 'idle',
				error: null,
			}));

			v4ToastManager.showSuccess('Device code received! Display the user code to the user.');
		} catch (error) {
			console.error(`${LOG_PREFIX} [ERROR] Failed to request device code:`, error);
			v4ToastManager.showError(
				error instanceof Error ? error.message : 'Failed to request device code'
			);
			throw error;
		}
	}, [credentials]);

	// Poll for tokens
	const pollForToken = useCallback(async (): Promise<boolean> => {
		if (!deviceCodeData || !credentials) {
			console.error(`${LOG_PREFIX} [ERROR] Cannot poll: missing device code or credentials`);
			return false;
		}

		const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;

		setPollingStatus((prev) => ({
			...prev,
			attempts: prev.attempts + 1,
			lastAttempt: Date.now(),
		}));

		const currentAttempt = pollingStatus.attempts + 1;
		console.log(
			`${LOG_PREFIX} [INFO] Polling attempt ${currentAttempt}/${pollingStatus.maxAttempts}`
		);

		try {
			const params = new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
				device_code: deviceCodeData.device_code,
				client_id: credentials.clientId,
			});

			// Device Authorization Flow uses public clients - NO client authentication
			// Do NOT send client_secret even if provided

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: params.toString(),
			});

			const data = await response.json();

			if (response.ok && data.access_token) {
				// Success! We got tokens
				console.log(`${LOG_PREFIX} [INFO] ✅ Authorization complete! Tokens received`);
				console.log(`${LOG_PREFIX} [INFO] Token type: ${data.token_type}`);
				console.log(`${LOG_PREFIX} [INFO] Expires in: ${data.expires_in} seconds`);
				console.log(`${LOG_PREFIX} [INFO] Scope: ${data.scope || 'N/A'}`);
				console.log(`${LOG_PREFIX} [INFO] Has refresh token: ${!!data.refresh_token}`);
				console.log(`${LOG_PREFIX} [INFO] Has ID token: ${!!data.id_token}`);

				setTokens(data);
				setPollingStatus((prev) => ({
					...prev,
					isPolling: false,
					status: 'success',
					error: null,
				}));

				// Store tokens in localStorage for cross-tab access
				try {
					localStorage.setItem(
						'device_flow_tokens',
						JSON.stringify({
							...data,
							timestamp: Date.now(),
						})
					);
					console.log(`${LOG_PREFIX} [INFO] Tokens stored in localStorage`);
				} catch (e) {
					console.warn(`${LOG_PREFIX} [WARN] Failed to store tokens in localStorage:`, e);
				}

				v4ToastManager.showSuccess('Authorization complete! Tokens received.');
				return true;
			}

			// Handle errors
			if (data.error === 'authorization_pending') {
				console.log(`${LOG_PREFIX} [INFO] Authorization pending, will continue polling...`);
				return false;
			} else if (data.error === 'slow_down') {
				console.log(`${LOG_PREFIX} [WARN] Slow down requested by server`);
				v4ToastManager.showWarning('Server requested slower polling rate');
				return false;
			} else if (data.error === 'access_denied') {
				console.log(`${LOG_PREFIX} [ERROR] Access denied by user`);
				setPollingStatus((prev) => ({
					...prev,
					isPolling: false,
					error: 'Access denied by user',
					status: 'error',
				}));
				v4ToastManager.showError('Authorization denied by user.');
				return true; // Stop polling
			} else if (data.error === 'expired_token') {
				console.log(`${LOG_PREFIX} [ERROR] Device code expired`);
				setPollingStatus((prev) => ({
					...prev,
					isPolling: false,
					error: 'Device code expired',
					status: 'expired',
				}));
				v4ToastManager.showError('Device code expired. Please start over.');
				return true; // Stop polling
			} else {
				console.error(`${LOG_PREFIX} [ERROR] Unknown error during polling:`, data.error);
				setPollingStatus((prev) => ({
					...prev,
					isPolling: false,
					error: data.error_description || data.error || 'Unknown error',
					status: 'error',
				}));
				v4ToastManager.showError(data.error_description || 'Authorization failed');
				return true; // Stop polling
			}
		} catch (error) {
			console.error(`${LOG_PREFIX} [ERROR] Polling request failed:`, error);
			setPollingStatus((prev) => ({
				...prev,
				isPolling: false,
				error: error instanceof Error ? error.message : 'Polling failed',
				status: 'error',
			}));
			v4ToastManager.showError('Failed to poll for tokens');
			return true; // Stop polling
		}
	}, [deviceCodeData, credentials, pollingStatus.attempts, pollingStatus.maxAttempts]);

	// Start polling for tokens
	const startPolling = useCallback(() => {
		if (!deviceCodeData) {
			console.error(`${LOG_PREFIX} [ERROR] Cannot start polling: no device code`);
			v4ToastManager.showError('No device code available. Request a device code first.');
			return;
		}

		if (pollingStatus.isPolling) {
			console.warn(`${LOG_PREFIX} [WARN] Polling already in progress`);
			return;
		}

		console.log(`${LOG_PREFIX} [INFO] Starting token polling...`);
		console.log(`${LOG_PREFIX} [INFO] Poll interval: ${deviceCodeData.interval} seconds`);
		console.log(`${LOG_PREFIX} [INFO] Max attempts: ${pollingStatus.maxAttempts}`);

		setPollingStatus((prev) => ({
			...prev,
			isPolling: true,
			status: 'polling',
			attempts: 0,
			error: null,
		}));

		const pollInterval = deviceCodeData.interval * 1000;

		// Immediate first poll
		pollForToken().then((shouldStop) => {
			if (shouldStop) {
				stopPolling();
				return;
			}

			// Set up interval for subsequent polls
			pollingIntervalRef.current = setInterval(async () => {
				const shouldStop = await pollForToken();
				if (shouldStop) {
					stopPolling();
				}
			}, pollInterval);
		});
	}, [
		deviceCodeData,
		pollingStatus.isPolling,
		pollingStatus.maxAttempts,
		pollForToken,
		stopPolling,
	]);

	// stopPolling moved earlier to avoid hoisting issues

	// Reset flow
	const reset = useCallback(() => {
		console.log(`${LOG_PREFIX} [INFO] Resetting device authorization flow`);

		stopPolling();
		setDeviceCodeData(null);
		setTokens(null);
		setPollingStatus({
			isPolling: false,
			attempts: 0,
			maxAttempts: 0,
			lastAttempt: null,
			nextAttempt: null,
			error: null,
			status: 'idle',
		});
		setExpiresAt(null);
		setTimeRemaining(0);

		// Clear stored tokens
		try {
			localStorage.removeItem('device_flow_tokens');
		} catch (e) {
			console.warn(`${LOG_PREFIX} [WARN] Failed to clear tokens from localStorage:`, e);
		}
	}, [stopPolling]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
			if (pollingTimeoutRef.current) {
				clearTimeout(pollingTimeoutRef.current);
			}
		};
	}, []);

	return {
		// State
		deviceCodeData,
		tokens,
		pollingStatus,
		expiresAt,
		timeRemaining,
		credentials,

		// Actions
		setCredentials,
		requestDeviceCode,
		startPolling,
		stopPolling,
		reset,

		// Utilities
		formatTimeRemaining,
	};
};
