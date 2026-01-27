// src/hooks/useDeviceAuthorizationFlow.ts
// Device Authorization Flow state management and logic
import { useCallback, useEffect, useRef, useState } from 'react';
import { scopeValidationService } from '../services/scopeValidationService';
import { safeLocalStorageParse } from '../utils/secureJson';
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
	loginHint?: string;
	postLogoutRedirectUri?: string;
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
	refreshAuthorizationStatus: () => Promise<void>;

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

	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);

	// Wrapper to persist credentials to localStorage with debouncing
	const setCredentials = useCallback((creds: DeviceAuthCredentials) => {
		// Update state immediately for UI responsiveness
		setCredentialsState(creds);

		// Debounce localStorage save to prevent excessive writes
		if (saveDebounceRef.current) {
			clearTimeout(saveDebounceRef.current);
		}

		saveDebounceRef.current = setTimeout(() => {
			try {
				localStorage.setItem('device_flow_credentials', JSON.stringify(creds));
				console.log(`${LOG_PREFIX} [INFO] Credentials saved to localStorage`);
			} catch (e) {
				console.warn(`${LOG_PREFIX} [WARN] Failed to save credentials to localStorage:`, e);
			}
		}, 500); // Wait 500ms after last keystroke before saving
	}, []);

	// Stop polling - defined early to avoid hoisting issues
	const stopPolling = useCallback(() => {
		// Only log and clear if actually polling to prevent spam
		if (pollingIntervalRef.current || pollingTimeoutRef.current) {
			console.log(`${LOG_PREFIX} [INFO] Stopping polling`);
		}

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
		const creds = safeLocalStorageParse<DeviceAuthCredentials>(
			'device_flow_credentials',
			{} as DeviceAuthCredentials
		);
		if (creds) {
			setCredentialsState(creds);
			console.log(`${LOG_PREFIX} [INFO] Loaded credentials from localStorage`);
		}
	}, []);

	// Countdown timer for device code expiration
	useEffect(() => {
		if (!expiresAt) {
			setTimeRemaining(0);
			return;
		}

		let hasExpired = false; // Flag to prevent multiple expiration calls

		const interval = setInterval(() => {
			const remaining = Math.max(0, expiresAt - Date.now());
			setTimeRemaining(remaining);

			if (remaining === 0 && !hasExpired) {
				hasExpired = true; // Set flag to prevent multiple calls
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
	}, [expiresAt, stopPolling]);

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

		// Prevent multiple simultaneous requests
		if (deviceCodeData && pollingStatus.status === 'polling') {
			console.warn(`${LOG_PREFIX} [WARN] Device code request already in progress`);
			return;
		}

		try {
			const deviceAuthEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/device_authorization`;

			// Use centralized scope validation service
			const scopeValidation = scopeValidationService.validateForAuthorizationUrl(
				credentials.scopes || credentials.scope,
				'device'
			);

			if (!scopeValidation.isValid) {
				throw new Error(scopeValidation.error || 'Invalid scopes configuration');
			}

			const scopes = scopeValidation.scopes;
			console.log('🔍 [useDeviceAuthorizationFlow] Scope validation:', {
				originalScopes: credentials.scopes,
				originalScope: credentials.scope,
				validatedScopes: scopes,
				isValid: scopeValidation.isValid,
			});

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				scope: scopes,
			});

			// RFC 8628 Device Authorization Grant: ONLY client_id and scope are supported
			// Do NOT add response_type, nonce, claims, or client_secret to device authorization endpoint
			// These parameters cause 400 Bad Request errors

			console.log(`${LOG_PREFIX} [INFO] Device Authorization Request (RFC 8628)`);
			console.log(
				`${LOG_PREFIX} [INFO] Using public client authentication (Device flow does not use client_secret)`
			);
			console.log(
				`${LOG_PREFIX} [INFO] Flow type: ${credentials.scopes?.includes('openid') ? 'OIDC' : 'OAuth 2.0'}`
			);

			console.log(`${LOG_PREFIX} [INFO] Device authorization endpoint: ${deviceAuthEndpoint}`);
			console.log(`${LOG_PREFIX} [INFO] Scopes: ${credentials.scopes || 'openid'}`);
			console.log(`${LOG_PREFIX} [INFO] Request body: ${params.toString()}`);

			const response = await fetch(deviceAuthEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: params.toString(),
			});

			console.log(
				`${LOG_PREFIX} [INFO] Response status: ${response.status} ${response.statusText}`
			);

			if (!response.ok) {
				const errorText = await response.text();
				let errorData: { error?: string; error_description?: string; message?: string } = {};
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

				// Enhanced error logging for Device Authorization Grant setup
				console.group('🔧 Device Authorization Grant Setup Issues');
				console.error('Common causes of 400 errors in device code requests:');
				console.log('1. Application not configured for Device Authorization Grant');
				console.log('2. Invalid client_id - check if client exists in PingOne');
				console.log('3. Invalid environment_id - verify the environment ID is correct');
				console.log('4. Missing required scopes or invalid scope format');
				console.log(
					'5. Application not enabled for public clients (Device Flow requires public client)'
				);
				console.log('Request Details:', {
					endpoint: deviceAuthEndpoint,
					client_id: credentials.clientId,
					environment_id: credentials.environmentId,
					scopes: credentials.scopes,
				});
				console.groupEnd();

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
	}, [credentials, deviceCodeData, pollingStatus.status]);

	// Poll for tokens
	const pollForToken = useCallback(async (): Promise<boolean> => {
		if (!deviceCodeData || !credentials) {
			console.error(`${LOG_PREFIX} [ERROR] Cannot poll: missing device code or credentials`);
			return false;
		}

		const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;

		// Prepare request params outside try block to ensure availability in catch block
		const params = new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			device_code: deviceCodeData.device_code,
			client_id: credentials.clientId,
		});

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
			// Device Authorization Flow uses public clients - NO client authentication
			// Do NOT send client_secret even if provided

			console.log(`${LOG_PREFIX} [INFO] Token request parameters:`, params.toString());
			console.log(`${LOG_PREFIX} [INFO] Token endpoint: ${tokenEndpoint}`);
			console.log(`${LOG_PREFIX} [INFO] Device code data:`, {
				device_code: `${deviceCodeData.device_code?.substring(0, 10)}...`,
				user_code: deviceCodeData.user_code,
				verification_uri: deviceCodeData.verification_uri,
				expires_in: deviceCodeData.expires_in,
				interval: deviceCodeData.interval,
			});
			console.log(`${LOG_PREFIX} [INFO] Credentials:`, {
				client_id: credentials.clientId,
				environment_id: credentials.environmentId,
				scopes: credentials.scopes,
			});

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: params.toString(),
			});

			// Only log non-400 responses as they're expected for authorization_pending
			if (response.status !== 400) {
				console.log(
					`${LOG_PREFIX} [INFO] Token response status: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();

			// Only log response data for non-authorization_pending cases to reduce noise
			if (data.error !== 'authorization_pending') {
				console.log(`${LOG_PREFIX} [INFO] Token response data:`, data);
			}

			// Handle Device Authorization Flow specific responses
			if (data.error === 'authorization_pending') {
				// This is normal behavior - user hasn't authorized yet
				// Only log every 10th attempt to reduce console noise
				if (currentAttempt % 10 === 0) {
					console.log(
						`${LOG_PREFIX} [INFO] Authorization pending (attempt ${currentAttempt}/${pollingStatus.maxAttempts}) - waiting for user authorization...`
					);
				}
				
				// Update next attempt time for UI display
				setPollingStatus((prev) => ({
					...prev,
					nextAttempt: Date.now() + (deviceCodeData.interval * 1000),
				}));
				
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
			} else if (data.error === 'invalid_grant') {
				console.log(`${LOG_PREFIX} [ERROR] Invalid grant - device code may be expired or invalid`);
				setPollingStatus((prev) => ({
					...prev,
					isPolling: false,
					error: 'Device code expired or invalid',
					status: 'expired',
				}));
				v4ToastManager.showError('Device code expired or invalid. Please start over.');
				return true; // Stop polling
			}

			// Only throw error for actual HTTP errors (not Device Flow specific responses)
			if (!response.ok && !data.error) {
				console.error(`${LOG_PREFIX} [ERROR] Token request failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: data,
				});
				throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
			}

			if (response.ok && data.access_token) {
				// Success! We got tokens
				console.log(`${LOG_PREFIX} [INFO] ✅ Authorization complete! Tokens received`);
				console.log(`${LOG_PREFIX} [INFO] Token type: ${data.token_type}`);
				console.log(`${LOG_PREFIX} [INFO] Expires in: ${data.expires_in} seconds`);
				console.log(`${LOG_PREFIX} [INFO] Scope: ${data.scope || 'N/A'}`);
				console.log(`${LOG_PREFIX} [INFO] Has refresh token: ${!!data.refresh_token}`);
				console.log(`${LOG_PREFIX} [INFO] Has ID token: ${!!data.id_token}`);

				// Validate response based on requested scopes (OAuth vs OIDC)
				const isOIDCFlow = credentials.scopes?.includes('openid');
				if (isOIDCFlow && !data.id_token) {
					console.warn(`${LOG_PREFIX} [WARN] OIDC flow requested but no ID token received`);
				} else if (!isOIDCFlow && data.id_token) {
					console.warn(`${LOG_PREFIX} [WARN] OAuth 2.0 flow but ID token received (unexpected)`);
				}

				// Log flow type for debugging
				console.log(`${LOG_PREFIX} [INFO] Flow type: ${isOIDCFlow ? 'OIDC' : 'OAuth 2.0'}`);

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

			// Handle unknown errors
			if (data.error) {
				console.error(`${LOG_PREFIX} [ERROR] Unknown error during polling:`, data.error);

				// Enhanced error logging for 400 Bad Request
				console.group('🔧 Device Authorization Error Response - Troubleshooting Guide');
				console.error('Error Response:', data);
				console.log('Response Status:', response.status, response.statusText);
				console.log('Request Details:', {
					url: tokenEndpoint,
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: params.toString(),
				});
				console.log('Device Code Data:', deviceCodeData);
				console.log('Credentials:', {
					clientId: credentials.clientId,
					environmentId: credentials.environmentId,
					scopes: credentials.scopes,
				});

				// Common 400 error causes and solutions
				console.log('Common 400 Error Causes:');
				console.log('1. Invalid client_id - check if client exists in PingOne');
				console.log('2. Invalid device_code - may be expired or already used');
				console.log('3. Missing required parameters - ensure all required fields are present');
				console.log(
					'4. Incorrect grant_type - should be "urn:ietf:params:oauth:grant-type:device_code"'
				);
				console.log('5. Application not configured for Device Authorization Grant');
				console.groupEnd();

				setPollingStatus((prev) => ({
					...prev,
					isPolling: false,
					error: data.error_description || data.error || 'Unknown error',
					status: 'error',
				}));
				v4ToastManager.showError(
					data.error_description || 'Authorization failed - check console for details'
				);
				return true; // Stop polling
			}
		} catch (error) {
			console.error(`${LOG_PREFIX} [ERROR] Polling request failed:`, error);

			// Enhanced error logging for debugging
			console.group('🔧 Device Authorization Token Exchange Error - Troubleshooting Guide');
			console.error('Original Error:', error);
			console.log('Request Details:', {
				url: tokenEndpoint,
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: params.toString(),
				deviceCode: deviceCodeData?.device_code ? 'present' : 'missing',
				clientId: credentials.clientId ? 'present' : 'missing',
				environmentId: credentials.environmentId ? 'present' : 'missing',
			});
			console.log('Device Code Data:', deviceCodeData);
			console.log('Credentials:', {
				clientId: credentials.clientId,
				environmentId: credentials.environmentId,
				scopes: credentials.scopes,
			});
			console.groupEnd();

			setPollingStatus((prev) => ({
				...prev,
				isPolling: false,
				error: error instanceof Error ? error.message : 'Polling failed',
				status: 'error',
			}));
			v4ToastManager.showError('Failed to poll for tokens - check console for details');
			return true; // Stop polling
		}

		// Default return for any unhandled cases
		return false;
	}, [deviceCodeData, credentials, pollingStatus.attempts, pollingStatus.maxAttempts]);

	// Start polling for tokens
	const startPolling = useCallback(() => {
		if (!deviceCodeData) {
			console.error(`${LOG_PREFIX} [ERROR] Cannot start polling: no device code`);
			v4ToastManager.showError('No device code available. Request a device code first.');
			return;
		}

		if (pollingStatus.isPolling || pollingIntervalRef.current) {
			console.warn(`${LOG_PREFIX} [WARN] Polling already in progress`);
			return;
		}

		// Clear any existing intervals before starting new ones
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		if (pollingTimeoutRef.current) {
			clearTimeout(pollingTimeoutRef.current);
			pollingTimeoutRef.current = null;
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

	// Manual refresh to check for completed authorization
	const refreshAuthorizationStatus = useCallback(async () => {
		if (!deviceCodeData || !credentials || pollingStatus.isPolling) {
			console.log(`${LOG_PREFIX} [INFO] Cannot refresh: missing data or already polling`);
			return;
		}

		console.log(`${LOG_PREFIX} [INFO] Manual refresh - checking authorization status...`);
		
		try {
			const shouldStop = await pollForToken();
			if (shouldStop) {
				stopPolling();
			}
		} catch (error) {
			console.error(`${LOG_PREFIX} [ERROR] Manual refresh failed:`, error);
		}
	}, [deviceCodeData, credentials, pollingStatus.isPolling, pollForToken, stopPolling]);

	// Reset flow
	const reset = useCallback(() => {
		console.log(`${LOG_PREFIX} [INFO] Resetting device authorization flow`);

		// Force stop all polling and clear intervals
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		if (pollingTimeoutRef.current) {
			clearTimeout(pollingTimeoutRef.current);
			pollingTimeoutRef.current = null;
		}
		if (saveDebounceRef.current) {
			clearTimeout(saveDebounceRef.current);
			saveDebounceRef.current = null;
		}

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
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Clear all timers and intervals on unmount
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			if (pollingTimeoutRef.current) {
				clearTimeout(pollingTimeoutRef.current);
				pollingTimeoutRef.current = null;
			}
			if (saveDebounceRef.current) {
				clearTimeout(saveDebounceRef.current);
				saveDebounceRef.current = null;
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
		refreshAuthorizationStatus,

		// Utilities
		formatTimeRemaining,
	};
};
