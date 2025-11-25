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

import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { workerTokenServiceV8 } from './workerTokenServiceV8';

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
	status?: 'ACTIVE' | 'ACTIVATION_REQUIRED'; // Device status: ACTIVE or ACTIVATION_REQUIRED
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

interface CompleteFIDO2RegistrationParams {
	environmentId: string;
	userId: string;
	deviceId: string;
	credentialId: string;
	attestationObject: string;
	clientDataJSON: string;
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
 * Service for PingOne MFA operations using WorkerTokenManager
 */
export class MFAServiceV8 {
	/**
	 * Get worker token from WorkerTokenServiceV8
	 * @returns Access token
	 */
	static async getWorkerToken(): Promise<string> {
		console.log(`${MODULE_TAG} Getting worker token from WorkerTokenServiceV8`);

		try {
			const token = await workerTokenServiceV8.getToken();
			if (!token) {
				throw new Error('Worker token is not available');
			}
			console.log(`${MODULE_TAG} Using worker token from WorkerTokenServiceV8`, {
				tokenLength: token.length,
				tokenPrefix: token.substring(0, 20),
			});
			return token;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get worker token from WorkerTokenServiceV8`, error);
			throw new Error(
				'Failed to get worker token. Please configure worker token credentials first.'
			);
		}
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
				step: 'mfa-User Lookup',
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
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// STEP 1: Initialize device authentication FIRST (per PingOne MFA Native SDK flow)
			// This uses the auth server endpoint: {{authPath}}/{{envID}}/deviceAuthentications
			console.log(
				`${MODULE_TAG} Step 1: Initializing device authentication before device creation`
			);
			try {
				const authInitResponse = await fetch(
					'/api/pingone/mfa/initialize-device-authentication-auth',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							environmentId: params.environmentId,
							userId: user.id,
							workerToken: accessToken.trim(),
						}),
					}
				);

				if (!authInitResponse.ok) {
					const errorData = await authInitResponse.json().catch(() => ({ error: 'Unknown error' }));
					console.warn(
						`${MODULE_TAG} Device authentication initialization returned error (continuing anyway):`,
						errorData
					);
					// Continue with device registration even if initialization fails
					// Some environments may not require this step
				} else {
					const authData = await authInitResponse.json();
					console.log(`${MODULE_TAG} Device authentication initialized successfully:`, {
						authenticationId: authData.id,
						status: authData.status,
						nextStep: authData.nextStep,
					});
				}
			} catch (authInitError) {
				console.warn(
					`${MODULE_TAG} Device authentication initialization failed (continuing anyway):`,
					authInitError
				);
				// Continue with device registration - initialization may not be required for all flows
			}

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
			if (deviceNickname?.trim()) {
				devicePayload.nickname = deviceNickname.trim();
			}

			// Add device status if provided (ACTIVE or PENDING)
			if (params.status) {
				devicePayload.status = params.status;
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
				workerToken: accessToken.trim(),
			};

			// Only include phone for SMS devices
			if (params.type === 'SMS' && devicePayload.phone) {
				requestBody.phone = devicePayload.phone;
			}

			// Only include email for EMAIL devices
			if (params.type === 'EMAIL' && devicePayload.email) {
				requestBody.email = devicePayload.email;
			}

			// Only include nickname if it exists and is not empty
			if (devicePayload.nickname) {
				requestBody.nickname = devicePayload.nickname;
			}

			// Include status if provided (required for TOTP, optional for SMS/EMAIL)
			if (devicePayload.status) {
				requestBody.status = devicePayload.status;
			}

			console.log(`${MODULE_TAG} Registering device with payload:`, {
				type: requestBody.type,
				status: requestBody.status,
				hasPhone: !!requestBody.phone,
				hasEmail: !!requestBody.email,
				nickname: requestBody.nickname,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/register-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'mfa-Register Device',
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
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

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
				step: 'mfa-Validate OTP',
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
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

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
				step: 'mfa-Get Device Details',
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
				step: 'mfa-Get MFA Settings',
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
				step: 'mfa-Update MFA Settings',
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
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

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
				step: 'mfa-Delete Device',
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
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Use backend proxy to avoid CORS issues
			const proxyEndpoint = '/api/pingone/mfa/get-all-devices';
			const devicesEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices?_t=${Date.now()}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: devicesEndpoint,
				headers: {
					Authorization: 'Bearer ***REDACTED***',
				},
				step: 'mfa-Get All Devices',
			});

			let response: Response;
			try {
				// Add cache-busting timestamp to request body to ensure fresh data
				response = await fetch(`${proxyEndpoint}?_t=${Date.now()}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						Pragma: 'no-cache',
					},
					cache: 'no-store', // Prevent browser caching
					body: JSON.stringify({
						environmentId: params.environmentId,
						userId: user.id,
						workerToken: accessToken.trim(),
						_timestamp: Date.now(), // Additional cache-busting in body
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

			// Backend proxy returns { _embedded: { devices: [...] } }
			const devices =
				(devicesData as { _embedded?: { devices?: Array<Record<string, unknown>> } })._embedded
					?.devices || [];

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
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Update device via backend proxy to avoid CORS
			const proxyEndpoint = '/api/pingone/mfa/update-device';
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'PATCH',
				url: proxyEndpoint,
				headers: {
					'Content-Type': 'application/json',
				},
				body: {
					environmentId: params.environmentId,
					userId: user.id,
					deviceId: params.deviceId,
					updates,
					workerToken: accessToken.trim(),
				},
				step: 'mfa-Update Device',
			});

			let response: Response;
			try {
				response = await fetch(proxyEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId: params.environmentId,
						userId: user.id,
						deviceId: params.deviceId,
						updates,
						workerToken: accessToken.trim(),
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

	/**
	 * Complete FIDO2 registration
	 * @param params - FIDO2 completion parameters
	 * @returns Registration result
	 */
	static async completeFIDO2Registration(
		params: CompleteFIDO2RegistrationParams
	): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Completing FIDO2 registration`, {
			deviceId: params.deviceId,
			userId: params.userId,
		});

		const accessToken = await MFAServiceV8.getWorkerToken();

		const requestBody = {
			environmentId: params.environmentId,
			userId: params.userId,
			deviceId: params.deviceId,
			credentialId: params.credentialId,
			attestationObject: params.attestationObject,
			clientDataJSON: params.clientDataJSON,
			workerToken: accessToken.trim(),
		};

		const startTime = Date.now();
		const callId = apiCallTrackerService.trackApiCall({
			method: 'POST',
			url: '/api/pingone/mfa/complete-fido2-registration',
			headers: {
				'Content-Type': 'application/json',
			},
			body: { ...requestBody, workerToken: '***REDACTED***' },
			step: 'mfa-Complete FIDO2 Registration',
		});

		let response: Response;
		try {
			response = await fetch('/api/pingone/mfa/complete-fido2-registration', {
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
		try {
			responseData = await responseClone.json();
		} catch {
			responseData = { error: 'Failed to parse response' };
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
				`FIDO2 attestation submission failed: ${
					errorData.message || errorData.error || response.statusText
				}`
			);
		}

		return responseData as Record<string, unknown>;
	}

	/**
	 * Activate TOTP device (OATH token)
	 * POST /environments/{environmentId}/users/{userId}/devices/{deviceId}
	 * @param params - Device activation parameters
	 */
	static async activateTOTPDevice(params: SendOTPParams): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Activating TOTP device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Activate TOTP device via Management API
			const deviceEndpoint = `https://api.pingone.com/v1/environments/${params.environmentId}/users/${user.id}/devices/${params.deviceId}`;

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: deviceEndpoint,
				headers: {
					Authorization: 'Bearer ***REDACTED***',
					'Content-Type': 'application/json',
				},
				body: { status: 'ACTIVE' },
				step: 'mfa-Activate TOTP Device',
			});

			let response: Response;
			try {
				response = await fetch(deviceEndpoint, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ status: 'ACTIVE' }),
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
					`Failed to activate TOTP device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} TOTP device activated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Activate TOTP device error`, error);
			throw error;
		}
	}

	/**
	 * Resend pairing code (for SMS/EMAIL devices)
	 * POST /environments/{environmentId}/users/{userId}/devices/{deviceId}/otp
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-resend-pairing-code
	 * @param params - Device parameters
	 */
	static async resendPairingCode(params: SendOTPParams): Promise<void> {
		console.log(`${MODULE_TAG} Resending pairing code`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Validate token before sending
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			const trimmedToken = accessToken.trim();

			// Check if token is a valid JWT (should have 3 parts separated by dots)
			const tokenParts = trimmedToken.split('.');
			if (tokenParts.length !== 3) {
				console.error(`${MODULE_TAG} Invalid JWT token format`, {
					tokenParts: tokenParts.length,
					tokenLength: trimmedToken.length,
					tokenStart: trimmedToken.substring(0, 30),
					tokenEnd: trimmedToken.substring(trimmedToken.length - 10),
					fullToken: trimmedToken,
				});
				throw new Error('Worker token is not a valid JWT. Please generate a new worker token.');
			}

			console.log(`${MODULE_TAG} Token validation before resend:`, {
				tokenLength: trimmedToken.length,
				tokenStart: trimmedToken.substring(0, 30),
				tokenEnd: trimmedToken.substring(trimmedToken.length - 10),
				hasEquals: trimmedToken.includes('='),
				partsCount: trimmedToken.split('.').length,
				tokenParts: tokenParts.map((part, index) => ({
					part: index + 1,
					length: part.length,
					start: part.substring(0, 10),
				})),
			});

			// Resend pairing code via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: trimmedToken,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/resend-pairing-code',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'mfa-Resend Pairing Code',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/resend-pairing-code', {
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
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
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
					`Failed to resend pairing code: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Pairing code resent successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Resend pairing code error`, error);
			throw error;
		}
	}

	/**
	 * Set the order of MFA devices for a user
	 * POST /mfa/v1/environments/{envId}/users/{userId}/devices/order
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-set-device-order
	 * @param environmentId - PingOne environment ID
	 * @param userId - User ID
	 * @param orderedDeviceIds - Array of device IDs in the desired order
	 * @returns Result of the operation
	 */
	static async setUserMfaDeviceOrder(
		environmentId: string,
		userId: string,
		orderedDeviceIds: string[]
	): Promise<Record<string, unknown>> {
		const token = await MFAServiceV8.getWorkerToken();
		const requestId = `mfa-set-device-order-${Date.now()}`;

		try {
			console.log(`${MODULE_TAG} Setting device order for user ${userId}`, {
				environmentId,
				deviceCount: orderedDeviceIds.length,
				requestId,
			});

			// Use backend proxy to avoid CORS issues
			const response = await fetch('/api/pingone/mfa/device-order', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: JSON.stringify({
					environmentId,
					userId,
					deviceIds: orderedDeviceIds, // Backend expects deviceIds array
					workerToken: token.trim(),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				const errorMsg = data.message || data.error || 'Failed to update device order';
				console.error(`${MODULE_TAG} Error setting device order:`, {
					status: response.status,
					error: errorMsg,
					requestId,
				});
				throw new Error(errorMsg);
			}

			console.log(`${MODULE_TAG} Successfully updated device order`, {
				userId,
				deviceCount: orderedDeviceIds.length,
				requestId,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Exception in setUserMfaDeviceOrder:`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				requestId,
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	}

	/**
	 * Activate MFA user device
	 * POST /environments/{environmentId}/users/{userId}/devices/{deviceId}
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device
	 * @param params - Device parameters
	 * @returns Activated device data
	 */
	static async activateDevice(params: SendOTPParams): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Activating device`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Activate device via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/activate-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'mfa-Activate Device',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/activate-device', {
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
					`Failed to activate device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} Device activated successfully`);
			return deviceData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Activate device error`, error);
			throw error;
		}
	}

	/**
	 * Get user MFA enabled status
	 * GET /environments/{environmentId}/users/{userId}/mfaEnabled
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#read-user-mfa-enabled
	 * @param params - User parameters
	 * @returns MFA enabled status
	 */
	static async getUserMFAEnabled(
		params: MFACredentials & { userId: string }
	): Promise<{ mfaEnabled: boolean }> {
		console.log(`${MODULE_TAG} Getting user MFA enabled status`, {
			username: params.username,
			userId: params.userId,
		});

		try {
			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Get user MFA enabled status via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: params.userId,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: '/api/pingone/mfa/get-user-mfa-enabled',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'mfa-Get User MFA Enabled',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/get-user-mfa-enabled', {
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
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
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
					`Failed to get user MFA enabled status: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const mfaData = responseData as { mfaEnabled: boolean };
			console.log(`${MODULE_TAG} User MFA enabled status:`, mfaData);
			return mfaData;
		} catch (error) {
			console.error(`${MODULE_TAG} Get user MFA enabled error`, error);
			throw error;
		}
	}

	/**
	 * Enable or disable MFA for a user
	 * PUT /environments/{environmentId}/users/{userId}/mfaEnabled
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#update-user-mfa-enabled
	 * @param params - User parameters with MFA enabled status
	 * @returns Updated MFA enabled status
	 */
	static async updateUserMFAEnabled(
		params: MFACredentials & { userId: string; mfaEnabled: boolean }
	): Promise<{ mfaEnabled: boolean }> {
		console.log(`${MODULE_TAG} Updating user MFA enabled status`, {
			username: params.username,
			userId: params.userId,
			mfaEnabled: params.mfaEnabled,
		});

		try {
			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Update user MFA enabled status via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: params.userId,
				mfaEnabled: params.mfaEnabled,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'PUT',
				url: '/api/pingone/mfa/update-user-mfa-enabled',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: `mfa-${params.mfaEnabled ? 'Enable' : 'Disable'} User MFA`,
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/update-user-mfa-enabled', {
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
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
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
					`Failed to update user MFA enabled status: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const mfaData = responseData as { mfaEnabled: boolean };
			console.log(`${MODULE_TAG} User MFA enabled status updated:`, mfaData);
			return mfaData;
		} catch (error) {
			console.error(`${MODULE_TAG} Update user MFA enabled error`, error);
			throw error;
		}
	}

	/**
	 * Initialize Device Authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications
	 *
	 * This follows the PingOne MFA Native SDK flow pattern:
	 * 1. Initialize authentication (this method)
	 * 2. Check response for next step (OTP_REQUIRED, ASSERTION_REQUIRED, SELECTION_REQUIRED)
	 * 3. Handle the required step
	 * 4. Complete authentication
	 *
	 * Reference:
	 * - API: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#initialize-device-authentication
	 * - SDK Flows: https://apidocs.pingidentity.com/pingone/native-sdks/v1/api/#pingone-mfa-native-sdks
	 *
	 * @param params - User parameters
	 * @returns Authentication response with next step type:
	 *   - OTP_REQUIRED: User must enter OTP code
	 *   - ASSERTION_REQUIRED: User must complete FIDO2/WebAuthn authentication
	 *   - SELECTION_REQUIRED: User must select from multiple available devices
	 *   - COMPLETED: Authentication is already complete
	 */
	static async initializeDeviceAuthentication(
		params: MFACredentials & { deviceId?: string }
	): Promise<{
		id: string; // authenticationId
		status: string;
		nextStep?: string; // OTP_REQUIRED, ASSERTION_REQUIRED, SELECTION_REQUIRED, etc.
		devices?: Array<{ id: string; type: string; nickname?: string }>;
		challengeId?: string;
		[key: string]: unknown;
	}> {
		console.log(`${MODULE_TAG} Initializing device authentication`, {
			username: params.username,
			deviceId: params.deviceId,
		});

		try {
			// Lookup user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Initialize device authentication via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/initialize-device-authentication',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'mfa-Initialize Device Authentication',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/initialize-device-authentication', {
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
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
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
					`Failed to initialize device authentication: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const authData = responseData as {
				id: string;
				status: string;
				nextStep?: string;
				devices?: Array<{ id: string; type: string; nickname?: string }>;
				challengeId?: string;
				[key: string]: unknown;
			};

			console.log(`${MODULE_TAG} Device authentication initialized:`, authData);
			return authData;
		} catch (error) {
			console.error(`${MODULE_TAG} Initialize device authentication error`, error);
			throw error;
		}
	}

	/**
	 * Validate OTP for Device Authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}/otp
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#validate-otp-for-device
	 * @param params - Authentication parameters with OTP
	 * @returns Validation result
	 */
	static async validateOTPForDevice(
		params: MFACredentials & { authenticationId: string; otp: string }
	): Promise<{ status: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Validating OTP for device authentication`, {
			username: params.username,
			authenticationId: params.authenticationId,
		});

		try {
			// Lookup user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Validate OTP via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				authenticationId: params.authenticationId,
				otp: params.otp,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/validate-otp-for-device',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***', otp: '***REDACTED***' },
				step: 'mfa-Validate OTP for Device',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/validate-otp-for-device', {
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
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
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
					`Failed to validate OTP: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const validationData = responseData as { status: string; [key: string]: unknown };
			console.log(`${MODULE_TAG} OTP validated:`, validationData);
			return validationData;
		} catch (error) {
			console.error(`${MODULE_TAG} Validate OTP for device error`, error);
			throw error;
		}
	}

	/**
	 * Select Device for Authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}/selectDevice
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#select-device-for-authentication
	 * @param params - Authentication parameters with selected device ID
	 * @returns Updated authentication response
	 */
	static async selectDeviceForAuthentication(
		params: MFACredentials & { authenticationId: string; deviceId: string }
	): Promise<{ status: string; nextStep?: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Selecting device for authentication`, {
			username: params.username,
			authenticationId: params.authenticationId,
			deviceId: params.deviceId,
		});

		try {
			// Lookup user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Select device via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				authenticationId: params.authenticationId,
				deviceId: params.deviceId,
				workerToken: accessToken.trim(),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/select-device-for-authentication',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { ...requestBody, workerToken: '***REDACTED***' },
				step: 'mfa-Select Device for Authentication',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/select-device-for-authentication', {
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
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
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
					`Failed to select device: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const selectData = responseData as {
				status: string;
				nextStep?: string;
				[key: string]: unknown;
			};
			console.log(`${MODULE_TAG} Device selected:`, selectData);
			return selectData;
		} catch (error) {
			console.error(`${MODULE_TAG} Select device for authentication error`, error);
			throw error;
		}
	}
}

export default MFAServiceV8;
