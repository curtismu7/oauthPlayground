/**
 * @file mfaServiceV8.ts
 * @module v8/services
 * @description PingOne MFA service for device registration and OTP validation
 * @version 8.0.0
 * @since 2024-11-19
 * 
 * Implements PingOne MFA API:
 * - User lookup by username
 * - Device registration (SMS, Email, TOTP)
 * - OTP generation and sending
 * - OTP validation
 * - Device management
 * 
 * Uses WorkerTokenServiceV8 for authentication
 * 
 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/
 * 
 * @example
 * const result = await MFAServiceV8.registerDevice({
 *   environmentId: 'xxx',
 *   username: 'john.doe',
 *   type: 'SMS',
 *   phone: '+1234567890'
 * });
 */

import { workerTokenServiceV8 } from './workerTokenServiceV8';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';

const MODULE_TAG = '[📱 MFA-SERVICE-V8]';

export interface MFACredentials {
	environmentId: string;
	username: string;
}

interface PingOneResponse {
	id?: string;
	status?: string;
	message?: string;
	error?: string;
	error_description?: string;
	type?: string;
	phone?: string;
	email?: string;
	access_token?: string;
	expires_in?: number;
	username?: string;
	[key: string]: unknown;
}

export interface RegisterDeviceParams extends MFACredentials {
	type: 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2';
	phone?: string;
	email?: string;
	name?: string;
	nickname?: string;
	// FIDO2-specific fields
	credentialId?: string;
	publicKey?: string;
	attestationObject?: string;
	clientDataJSON?: string;
}

export interface SendOTPParams extends MFACredentials {
	deviceId: string;
}

export interface ValidateOTPParams extends MFACredentials {
	deviceId: string;
	otp: string;
}

export interface DeviceRegistrationResult {
	deviceId: string;
	userId: string;
	status: string;
	type: string;
	phone?: string;
	email?: string;
	nickname?: string;
	environmentId?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface OTPValidationResult {
	status: string;
	message?: string;
	valid: boolean;
}

export interface MFASettings {
	pairing?: {
		maxAllowedDevices?: number;
		pairingKeyFormat?: string;
	};
	lockout?: {
		failureCount?: number;
		durationSeconds?: number;
	};
	[key: string]: unknown;
}

export interface UserLookupResult {
	id: string;
	username: string;
	email?: string;
	name?: {
		given?: string;
		family?: string;
	};
}

/**
 * MFAServiceV8
 * 
 * Service for PingOne MFA operations using WorkerTokenServiceV8
 */
export class MFAServiceV8 {
	/**
	 * Get worker token from WorkerTokenServiceV8
	 * @returns Access token
	 */
	private static async getWorkerToken(): Promise<string> {
		console.log(`${MODULE_TAG} Getting worker token from WorkerTokenServiceV8`);

		// Check if we have a valid cached token
		const cachedToken = await workerTokenServiceV8.getToken();
		if (cachedToken && typeof cachedToken === 'string' && cachedToken.trim().length > 0) {
			console.log(`${MODULE_TAG} Using cached worker token`, {
				tokenLength: cachedToken.length,
				tokenPrefix: cachedToken.substring(0, 20),
			});
			return cachedToken.trim();
		}

		// Get credentials and fetch new token
		const credentials = await workerTokenServiceV8.loadCredentials();
		if (!credentials) {
			throw new Error('No worker token credentials found. Please configure worker token first.');
		}

		console.log(`${MODULE_TAG} Fetching new worker token`);

		const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
		const requestBody = {
			grant_type: 'client_credentials',
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
		};

		const startTime = Date.now();
		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: tokenEndpoint,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: requestBody,
			step: 'Get Worker Token',
		});

		let response: Response;
		try {
			response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams(requestBody),
			});
		} catch (error) {
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: 0,
					statusText: 'Network Error',
					error: error instanceof Error ? error.message : String(error),
				},
				Date.now() - startTime
			);
			throw error;
		}

		const responseClone = response.clone();
		let data: unknown;
		try {
			data = await responseClone.json();
		} catch {
			data = { error: 'Failed to parse response' };
		}

		apiCallTrackerService.updateApiCallResponse(
			callId,
			{
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
				data: data,
			},
			Date.now() - startTime
		);

		if (!response.ok) {
			const errorData = data as PingOneResponse;
			throw new Error(
				`Failed to get worker token: ${errorData.error} - ${errorData.error_description || ''}`
			);
		}

		// Cache the token with expiration
		const tokenData = data as PingOneResponse;
		
		if (!tokenData.access_token || typeof tokenData.access_token !== 'string') {
			throw new Error('Worker token response missing access_token or invalid format');
		}

		const tokenString = String(tokenData.access_token).trim();
		if (tokenString.length === 0) {
			throw new Error('Worker token is empty');
		}

		const expiresAt = tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined;
		await workerTokenServiceV8.saveToken(tokenString, expiresAt);
		
		console.log(`${MODULE_TAG} Worker token obtained and cached`, {
			tokenLength: tokenString.length,
			tokenPrefix: tokenString.substring(0, 20),
		});
		return tokenString;
	}

	/**
	 * Look up user by username
	 * @param environmentId - PingOne environment ID
	 * @param username - Username to search for
	 * @returns User details including ID
	 */
	static async lookupUserByUsername(
		environmentId: string,
		username: string
	): Promise<UserLookupResult> {
		console.log(`${MODULE_TAG} Looking up user by username`, { username });

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Use backend proxy to avoid CORS
			const requestBody = {
				environmentId,
				username,
				workerToken: accessToken,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/lookup-user',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' }, // Redact token in display
				step: 'User Lookup',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/lookup-user', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let user: unknown;
			try {
				user = await responseClone.json();
			} catch {
				user = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: user,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = user as PingOneResponse;
				throw new Error(
					`User lookup failed: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const userData = user as PingOneResponse;

			console.log(`${MODULE_TAG} User found`, {
				userId: userData.id,
				username: userData.username,
			});

			return userData as unknown as UserLookupResult;
		} catch (error) {
			console.error(`${MODULE_TAG} User lookup error`, error);
			throw error;
		}
	}

	/**
	 * Register MFA device for user
	 * @param params - Device registration parameters
	 * @returns Device registration result
	 */
	static async registerDevice(params: RegisterDeviceParams): Promise<DeviceRegistrationResult> {
		console.log(`${MODULE_TAG} Registering ${params.type} device`, {
			username: params.username,
			type: params.type,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(
				params.environmentId,
				params.username
			);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Build device registration payload
			const devicePayload: Record<string, unknown> = {
				type: params.type,
			};

			if (params.type === 'SMS' && params.phone) {
				devicePayload.phone = params.phone;
			} else if (params.type === 'EMAIL' && params.email) {
				devicePayload.email = params.email;
			}

			// Add device nickname if provided (PingOne API uses 'nickname' field)
			// Support both 'name' and 'nickname' for compatibility
			const deviceNickname = params.nickname || params.name;
			if (deviceNickname && deviceNickname.trim()) {
				devicePayload.nickname = deviceNickname.trim();
			}

			// Register device via backend proxy
			console.log(`${MODULE_TAG} Calling device registration endpoint`, {
				type: params.type,
				userId: user.id,
				nickname: devicePayload.nickname || params.nickname || params.name,
			});

			const requestBody: Record<string, unknown> = {
				environmentId: params.environmentId,
				userId: user.id,
				type: params.type,
				phone: devicePayload.phone,
				email: devicePayload.email,
				workerToken: accessToken.trim(),
			};
			
			// Only include nickname if it exists and is not empty
			if (devicePayload.nickname) {
				requestBody.nickname = devicePayload.nickname;
			}

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/register-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'Register Device',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/register-device', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Device registration failed: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const dd = deviceData as PingOneResponse & {
				environment?: { id?: string };
				user?: { id?: string };
				nickname?: string;
				createdAt?: string;
				updatedAt?: string;
			};

			console.log(`${MODULE_TAG} Device registered successfully`, {
				deviceId: dd.id,
				userId: user.id,
				status: dd.status,
				nickname: dd.nickname,
				environmentId: dd.environment?.id,
			});

			return {
				deviceId: dd.id || '',
				userId: user.id,
				status: dd.status || 'ACTIVE',
				type: dd.type || '',
				...(dd.phone ? { phone: dd.phone } : {}),
				...(dd.email ? { email: dd.email } : {}),
				...(dd.nickname ? { nickname: dd.nickname } : {}),
				...(dd.environment?.id ? { environmentId: dd.environment.id } : {}),
				...(dd.createdAt ? { createdAt: dd.createdAt } : {}),
				...(dd.updatedAt ? { updatedAt: dd.updatedAt } : {}),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Device registration error`, error);
			throw error;
		}
	}

	/**
	 * Send OTP to device
	 * @param params - OTP sending parameters
	 */
	static async sendOTP(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Sending OTP`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(
				params.environmentId,
				params.username
			);

		// Get worker token
		const accessToken = await MFAServiceV8.getWorkerToken();

		// Validate token before sending
		if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
			throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
		}

		// Normalize token: remove any existing Bearer prefix and whitespace
		let cleanToken = accessToken.trim();
		cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
		cleanToken = cleanToken.replace(/\s+/g, '');

		// Validate token looks like a JWT (should have 3 parts separated by dots)
		const tokenParts = cleanToken.split('.');
		if (tokenParts.length !== 3) {
			console.error(`${MODULE_TAG} Token does not appear to be a valid JWT format`, {
				partsCount: tokenParts.length,
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 30),
			});
			throw new Error('Worker token is not a valid JWT format. Please generate a new worker token.');
		}

		// Validate token parts are not empty
		if (tokenParts.some(part => part.length === 0)) {
			console.error(`${MODULE_TAG} Token has empty parts`, {
				tokenLength: cleanToken.length,
				partsLength: tokenParts.map(p => p.length),
			});
			throw new Error('Worker token is malformed. Please generate a new worker token.');
		}

		// Validate token is long enough (JWT should be at least 100 characters)
		if (cleanToken.length < 100) {
			console.error(`${MODULE_TAG} Token is too short to be a valid JWT`, {
				tokenLength: cleanToken.length,
				tokenStart: cleanToken.substring(0, 50),
			});
			throw new Error('Worker token appears to be corrupted or incomplete. Please generate a new worker token.');
		}

		// Send OTP via backend proxy
		console.log(`${MODULE_TAG} Calling OTP endpoint`, {
			userId: user.id,
			tokenLength: accessToken.length,
			tokenPrefix: accessToken.substring(0, 20),
		});

		const requestBody = {
			environmentId: params.environmentId,
			userId: user.id,
			deviceId: params.deviceId,
			workerToken: cleanToken, // Use the normalized token
		};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/send-otp',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'Send OTP',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/send-otp', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let responseData: unknown;
			
			// PingOne returns 204 No Content or empty body for successful OTP sends
			if (response.status === 204) {
				responseData = { success: true, message: 'OTP sent successfully' };
			} else {
				try {
					const text = await responseClone.text();
					if (text && text.trim()) {
						responseData = JSON.parse(text);
					} else {
						// Empty response body - treat as success
						responseData = { success: true, message: 'OTP sent successfully' };
					}
				} catch {
					// If parsing fails, that's okay for empty responses
					responseData = response.ok ? { success: true, message: 'OTP sent successfully' } : { error: 'Unknown error' };
				}
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to send OTP: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} OTP sent successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Send OTP error`, error);
			throw error;
		}
	}

	/**
	 * Validate OTP code
	 * @param params - OTP validation parameters
	 * @returns Validation result
	 */
	static async validateOTP(params: ValidateOTPParams): Promise<OTPValidationResult> {
		console.log(`${MODULE_TAG} Validating OTP`, {
			username: params.username,
			deviceId: params.deviceId,
			otpLength: params.otp.length,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(
				params.environmentId,
				params.username
			);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Validate token before using
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			// Validate OTP via backend proxy
			console.log(`${MODULE_TAG} Calling OTP validation endpoint`, {
				userId: user.id,
			});

			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				otp: params.otp,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/validate-otp',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'Validate OTP',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/validate-otp', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let validationData: unknown;
			try {
				validationData = await responseClone.json();
			} catch {
				validationData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: validationData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = validationData as PingOneResponse;
				throw new Error(
					`OTP validation failed: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const vd = validationData as PingOneResponse;

			console.log(`${MODULE_TAG} OTP validated successfully`, {
				status: vd.status,
			});

			return {
				status: vd.status || 'UNKNOWN',
				valid: vd.status === 'COMPLETED',
				...(vd.message ? { message: vd.message } : {}),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} OTP validation error`, error);
			throw error;
		}
	}

	/**
	 * Get device details
	 * @param params - Device lookup parameters
	 * @returns Device details
	 */
	static async getDevice(params: SendOTPParams): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Getting device details`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(
				params.environmentId,
				params.username
			);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Get device via Management API
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: deviceEndpoint,
				headers: {
					Authorization: 'Bearer ***REDACTED***',
				},
				step: 'Get Device Details',
			});

			let response: Response;
			try {
				response = await fetch(deviceEndpoint, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Failed to get device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			// const deviceData = await response.json(); // Already parsed

			console.log(`${MODULE_TAG} Device details retrieved`, {
				deviceId: (deviceData as PingOneResponse).id,
				type: (deviceData as PingOneResponse).type,
				status: (deviceData as PingOneResponse).status,
			});

			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Get device error`, error);
			throw error;
		}
	}

	/**
	 * Get MFA settings
	 * @param environmentId - PingOne environment ID
	 */
	static async getMFASettings(environmentId: string): Promise<MFASettings> {
		console.log(`${MODULE_TAG} Getting MFA settings`);

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/get-mfa-settings',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { environmentId, workerToken: '***REDACTED***' },
				step: 'Get MFA Settings',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/get-mfa-settings', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId,
						workerToken: accessToken,
					}),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let settingsData: unknown;
			try {
				settingsData = await responseClone.json();
			} catch {
				settingsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: settingsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = settingsData as PingOneResponse;
				throw new Error(
					`Failed to get MFA settings: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} MFA settings retrieved`);
			return settingsData as MFASettings;
		} catch (error) {
			console.error(`${MODULE_TAG} Get MFA settings error`, error);
			throw error;
		}
	}

	/**
	 * Update MFA settings
	 * @param environmentId - PingOne environment ID
	 * @param settings - Settings to update
	 */
	static async updateMFASettings(
		environmentId: string,
		settings: MFASettings
	): Promise<MFASettings> {
		console.log(`${MODULE_TAG} Updating MFA settings`);

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/update-mfa-settings',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { environmentId, settings, workerToken: '***REDACTED***' },
				step: 'Update MFA Settings',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/update-mfa-settings', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId,
						settings,
						workerToken: accessToken,
					}),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let settingsData: unknown;
			try {
				settingsData = await responseClone.json();
			} catch {
				settingsData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: settingsData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = settingsData as PingOneResponse;
				throw new Error(
					`Failed to update MFA settings: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} MFA settings updated`);
			return settingsData as MFASettings;
		} catch (error) {
			console.error(`${MODULE_TAG} Update MFA settings error`, error);
			throw error;
		}
	}

	/**
	 * Delete device
	 * @param params - Device deletion parameters
	 */
	static async deleteDevice(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Deleting device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(
				params.environmentId,
				params.username
			);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Delete device via Management API
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'DELETE',
				url: deviceEndpoint,
				headers: {
					Authorization: 'Bearer ***REDACTED***',
				},
				step: 'Delete Device',
			});

			let response: Response;
			try {
				response = await fetch(deviceEndpoint, {
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: null,
				},
				Date.now() - startTime
			);

			if (!response.ok && response.status !== 204) {
				let errorData: unknown;
				try {
					errorData = await response.json();
				} catch {
					errorData = {};
				}
				const err = errorData as PingOneResponse;
				throw new Error(
					`Failed to delete device: ${err.message || err.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device deleted successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Delete device error`, error);
			throw error;
		}
	}

	/**
	 * Get all devices for a user
	 * @param params - User lookup parameters
	 * @returns List of devices
	 */
	static async getAllDevices(params: MFACredentials): Promise<Array<Record<string, unknown>>> {
		console.log(`${MODULE_TAG} Getting all devices for user`, {
			username: params.username,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(
				params.environmentId,
				params.username
			);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Get all devices via Management API
			const devicesEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: devicesEndpoint,
				headers: {
					Authorization: 'Bearer ***REDACTED***',
				},
				step: 'Get All Devices',
			});

			let response: Response;
			try {
				response = await fetch(devicesEndpoint, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let devicesData: unknown;
			try {
				devicesData = await responseClone.json();
			} catch {
				devicesData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: devicesData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = devicesData as PingOneResponse;
				throw new Error(
					`Failed to get devices: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const devices = (devicesData as { _embedded?: { devices?: Array<Record<string, unknown>> } })._embedded?.devices || [];

			console.log(`${MODULE_TAG} Devices retrieved`, {
				count: devices.length,
			});

			return devices;
		} catch (error) {
			console.error(`${MODULE_TAG} Get all devices error`, error);
			throw error;
		}
	}

	/**
	 * Update device (rename, etc.)
	 * @param params - Device update parameters
	 * @param updates - Fields to update
	 */
	static async updateDevice(
		params: SendOTPParams,
		updates: { name?: string; [key: string]: unknown }
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Updating device`, {
			username: params.username,
			deviceId: params.deviceId,
			updates,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(
				params.environmentId,
				params.username
			);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Update device via Management API
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'PATCH',
				url: deviceEndpoint,
				headers: {
					Authorization: 'Bearer ***REDACTED***',
					'Content-Type': 'application/json',
				},
				body: updates,
				step: 'Update Device',
			});

			let response: Response;
			try {
				response = await fetch(deviceEndpoint, {
					method: 'PATCH',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updates),
				});
			} catch (error) {
				apiCallTrackerService.updateApiCallResponse(
					callId,
					{
						status: 0,
						statusText: 'Network Error',
						error: error instanceof Error ? error.message : String(error),
					},
					Date.now() - startTime
				);
				throw error;
			}

			const responseClone = response.clone();
			let deviceData: unknown;
			try {
				deviceData = await responseClone.json();
			} catch {
				deviceData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					headers: Object.fromEntries(response.headers.entries()),
					data: deviceData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = deviceData as PingOneResponse;
				throw new Error(
					`Failed to update device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device updated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Update device error`, error);
			throw error;
		}
	}

	/**
	 * Block device
	 * @param params - Device parameters
	 */
	static async blockDevice(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Blocking device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			await MFAServiceV8.updateDevice(params, { status: 'BLOCKED' });
			console.log(`${MODULE_TAG} Device blocked successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Block device error`, error);
			throw error;
		}
	}

	/**
	 * Unblock device
	 * @param params - Device parameters
	 */
	static async unblockDevice(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Unblocking device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			await MFAServiceV8.updateDevice(params, { status: 'ACTIVE' });
			console.log(`${MODULE_TAG} Device unblocked successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Unblock device error`, error);
			throw error;
		}
	}
}

export default MFAServiceV8;
