// Device Code flow utilities for OIDC Device Code implementation

import { logger } from './logger';

export interface DeviceAuthorizationResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete?: string;
	expires_in: number;
	interval?: number;
}

export interface DeviceTokenResponse {
	access_token?: string;
	token_type?: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
	id_token?: string;
	error?: string;
	error_description?: string;
}

export interface DeviceTokenError {
	error:
		| 'authorization_pending'
		| 'slow_down'
		| 'expired_token'
		| 'access_denied'
		| 'invalid_grant';
	error_description?: string;
	interval?: number;
}

/**
 * Request device authorization from the device authorization endpoint
 */
export async function requestDeviceAuthorization(
	endpoint: string,
	clientId: string,
	scope: string[]
): Promise<DeviceAuthorizationResponse> {
	logger.info('DEVICE-CODE', 'Requesting device authorization', {
		endpoint,
		clientId: clientId.substring(0, 8) + '...',
		scopes: scope,
	});

	const body = new URLSearchParams({
		client_id: clientId,
		scope: scope.join(' '),
	});

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: body.toString(),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Device authorization failed: ${response.status} ${response.statusText}. ${errorData.error_description || errorData.error || 'Unknown error'}`
			);
		}

		const data = await response.json();

		logger.success('DEVICE-CODE', 'Device authorization received', {
			userCode: data.user_code,
			expiresIn: data.expires_in,
			interval: data.interval || 5,
			hasCompleteUri: !!data.verification_uri_complete,
		});

		return data;
	} catch (error) {
		logger.error('DEVICE-CODE', 'Device authorization failed', error);
		throw error;
	}
}

/**
 * Poll the token endpoint for device code flow
 */
export async function pollTokenEndpoint(
	tokenEndpoint: string,
	deviceCode: string,
	clientId: string,
	interval: number = 5000,
	authConfig?: {
		method:
			| 'client_secret_post'
			| 'client_secret_basic'
			| 'client_secret_jwt'
			| 'private_key_jwt'
			| 'none';
		clientSecret?: string;
		privateKey?: string;
	}
): Promise<DeviceTokenResponse> {
	logger.info('POLLING', 'Starting token polling', {
		endpoint: tokenEndpoint,
		deviceCode: deviceCode.substring(0, 8) + '...',
		interval,
		authMethod: authConfig?.method || 'none',
	});

	const baseBody = new URLSearchParams({
		grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
		device_code: deviceCode,
	});

	let headers: Record<string, string> = {
		'Content-Type': 'application/x-www-form-urlencoded',
		Accept: 'application/json',
	};

	let body: URLSearchParams = baseBody;

	// Apply client authentication if provided
	if (authConfig && authConfig.method !== 'none') {
		try {
			const { applyClientAuthentication } = await import('./clientAuthentication');

			const authConfigForToken = {
				method: authConfig.method,
				clientId: clientId,
				clientSecret: authConfig.clientSecret,
				privateKey: authConfig.privateKey,
				tokenEndpoint: tokenEndpoint,
			};

			const authenticatedRequest = await applyClientAuthentication(authConfigForToken, baseBody);
			headers = { ...headers, ...authenticatedRequest.headers };
			body = authenticatedRequest.body;
		} catch (error) {
			logger.error('POLLING', 'Failed to apply client authentication', { error });
			// Fall back to basic client_id in body
			body.append('client_id', clientId);
		}
	} else {
		// No authentication - just add client_id to body
		body.append('client_id', clientId);
	}

	try {
		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: headers,
			body: body.toString(),
		});

		const data = await response.json();

		if (response.ok) {
			logger.success('TOKEN', 'Token received via device code', {
				hasAccessToken: !!data.access_token,
				hasIdToken: !!data.id_token,
				hasRefreshToken: !!data.refresh_token,
				expiresIn: data.expires_in,
			});
			return data;
		} else {
			// Handle polling responses
			const error = data as DeviceTokenError;
			logger.info('POLLING', 'Polling response received', {
				status: error.error,
				description: error.error_description,
				suggestedInterval: error.interval,
			});
			return error;
		}
	} catch (error) {
		logger.error('POLLING', 'Token polling failed', error);
		throw error;
	}
}

/**
 * Format user code for better readability (e.g., "ABCD-EFGH")
 */
export function formatUserCode(code: string): string {
	if (!code || code.length < 4) {
		return code;
	}

	// Remove any existing formatting
	const cleanCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();

	// Add hyphen in the middle if code is 8 characters or more
	if (cleanCode.length >= 8) {
		return `${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}`;
	}

	// For shorter codes, just return uppercase
	return cleanCode;
}

/**
 * Check if a device authorization response is valid
 */
export function validateDeviceAuthorizationResponse(
	response: any
): response is DeviceAuthorizationResponse {
	return (
		response &&
		typeof response.device_code === 'string' &&
		typeof response.user_code === 'string' &&
		typeof response.verification_uri === 'string' &&
		typeof response.expires_in === 'number' &&
		response.device_code.length > 0 &&
		response.user_code.length > 0 &&
		response.verification_uri.length > 0 &&
		response.expires_in > 0
	);
}

/**
 * Check if a token response is an error (polling state)
 */
export function isDeviceTokenError(response: any): response is DeviceTokenError {
	return response && response.error && typeof response.error === 'string';
}

/**
 * Check if polling should continue based on error type
 */
export function shouldContinuePolling(error: DeviceTokenError): boolean {
	return error.error === 'authorization_pending' || error.error === 'slow_down';
}

/**
 * Check if polling should stop due to failure
 */
export function isPollingFailure(error: DeviceTokenError): boolean {
	return (
		error.error === 'expired_token' ||
		error.error === 'access_denied' ||
		error.error === 'invalid_grant'
	);
}

/**
 * Get the next polling interval based on error response
 */
export function getNextPollingInterval(error: DeviceTokenError, currentInterval: number): number {
	if (error.error === 'slow_down') {
		// Increase interval by 5 seconds as per spec
		return Math.min(currentInterval + 5000, 30000); // Cap at 30 seconds
	}

	// Use suggested interval from server or current interval
	return error.interval ? error.interval * 1000 : currentInterval;
}
