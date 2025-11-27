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
import type { DeviceAuthenticationPolicy } from '@/v8/flows/shared/MFATypes';
import { PINGONE_WORKER_MFA_SCOPES, PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';

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
	type: 'SMS' | 'EMAIL' | 'TOTP' | 'FIDO2' | 'MOBILE' | 'OATH_TOKEN' | 'VOICE' | 'WHATSAPP' | 'PLATFORM' | 'SECURITY_KEY';
	phone?: string; // Required for SMS, VOICE, WHATSAPP
	email?: string; // Required for EMAIL
	name?: string;
	nickname?: string;
	status?: 'ACTIVE' | 'ACTIVATION_REQUIRED'; // Device status: ACTIVE (pre-paired) or ACTIVATION_REQUIRED (user must activate)
	notification?: {
		// Custom device pairing notification (only applicable when status is ACTIVATION_REQUIRED for SMS, Voice, Email)
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
		message?: string;
		variant?: string;
	};
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
 * Service for PingOne MFA operations using WorkerTokenServiceV8
 *
 * NOTE: This is intentionally designed as a class with static methods for:
 * 1. Clear namespacing and organization
 * 2. Consistent API with other V8 services
 * 3. Future extensibility to instance methods if needed
 * 4. Better IDE support and method discovery
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
			const decodePayload = () => {
				try {
					const [, rawPayload] = token.split('.');
					if (!rawPayload) {
						return null;
					}
					const normalized = rawPayload.replace(/-/g, '+').replace(/_/g, '/');
					const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
					return JSON.parse(atob(padded));
				} catch (error) {
					console.warn(`${MODULE_TAG} Unable to decode worker token payload`, error);
					return null;
				}
			};

			const payload = decodePayload();

			if (payload?.exp) {
				const expiresAt = payload.exp * 1000;
				if (Date.now() >= expiresAt) {
					throw new Error(
						'Worker token has expired. Please generate a new token from the Manage Token dialog.'
					);
				}
			}

			if (payload) {
				const rawScopes: string[] | string | undefined = payload.scp ?? payload.scope;
				let scopes: string[] = [];
				if (Array.isArray(rawScopes)) {
					scopes.push(...rawScopes);
				} else if (rawScopes) {
					scopes.push(...rawScopes.split(/\s+/).filter(Boolean));
				}

				if (scopes.length === 0) {
					try {
						const credentials = await workerTokenServiceV8.loadCredentials();
						if (credentials?.scopes?.length) {
							scopes.push(...credentials.scopes);
						}
					} catch (credError) {
						console.warn(`${MODULE_TAG} Unable to inspect worker token credentials scopes`, credError);
					}
				}

				const requiredScopes = [...PINGONE_WORKER_MFA_SCOPES];

				const missingScopes = requiredScopes.filter((scope) => !scopes.includes(scope));
				if (missingScopes.length > 0) {
					console.warn(
						`${MODULE_TAG} Worker token is missing recommended MFA scopes: ${missingScopes.join(', ')}`
					);
					try {
						const credentials = await workerTokenServiceV8.loadCredentials();
						if (credentials) {
							const combinedScopes = Array.from(
								new Set([...(credentials.scopes ?? []), ...requiredScopes])
							);
							await workerTokenServiceV8.saveCredentials({
								...credentials,
								scopes: combinedScopes,
							});
							window.dispatchEvent(
								new CustomEvent('workerTokenMissingScopes', {
									detail: { missingScopes, scopes: combinedScopes },
								})
							);
						}
					} catch (scopeError) {
						console.error(`${MODULE_TAG} Unable to update stored worker token scopes`, scopeError);
					}
				}
			}

			console.log(`${MODULE_TAG} Using worker token from WorkerTokenServiceV8`, {
				tokenLength: token.length,
				tokenPrefix: token.substring(0, 20),
			});
			return token;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get worker token from WorkerTokenServiceV8`, error);
			throw error instanceof Error ? error : new Error(String(error));
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
				body: requestBody, // Show actual worker token for educational visibility
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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

			// Add phone for SMS, VOICE, and WHATSAPP devices
			if ((params.type === 'SMS' || params.type === 'VOICE' || params.type === 'WHATSAPP') && params.phone) {
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

			// Add device status if provided (ACTIVE or ACTIVATION_REQUIRED)
			// ACTIVE: Device is pre-paired (Worker App can set this, user doesn't need to activate)
			// ACTIVATION_REQUIRED: User must activate device before first use
			if (params.status) {
				devicePayload.status = params.status;
			}

			// Add notification property if provided (only applicable when status is ACTIVATION_REQUIRED for SMS, Voice, Email)
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
			if (params.notification && params.status === 'ACTIVATION_REQUIRED') {
				devicePayload.notification = params.notification;
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

			// Include phone for SMS, VOICE, and WHATSAPP devices
			if ((params.type === 'SMS' || params.type === 'VOICE' || params.type === 'WHATSAPP') && devicePayload.phone) {
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

			// Include status if provided (ACTIVE or ACTIVATION_REQUIRED)
			if (devicePayload.status) {
				requestBody.status = devicePayload.status;
			}

			// Include notification if provided (only applicable when status is ACTIVATION_REQUIRED for SMS, Voice, Email)
			if (devicePayload.notification) {
				requestBody.notification = devicePayload.notification;
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
				body: requestBody,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
	 * Validate OTP for device authentication
	 * Uses the deviceAuthId from the initialization step
	 * @param params - Validation parameters
	 */
	static async validateOTP(params: {
		environmentId: string;
		deviceAuthId: string;
		otp: string;
		workerToken: string;
		otpCheckUrl?: string; // Optional: URL from _links.otp.check.href
	}): Promise<{ valid: boolean; status: string; message?: string }> {
		console.log(`${MODULE_TAG} Validating OTP for device authentication`);

		try {
			// Validate worker token format
			if (typeof params.workerToken !== 'string') {
				throw new Error('Worker token must be a string');
			}

			// Normalize and validate worker token
			let cleanToken = String(params.workerToken);
			// Remove any existing "Bearer " prefix if accidentally included
			cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
			// Remove all whitespace, newlines, carriage returns, and tabs
			cleanToken = cleanToken.replace(/\s+/g, '').trim();

			if (cleanToken.length === 0) {
				throw new Error('Worker token is empty');
			}

			// Basic JWT format check (should have 3 parts separated by dots)
			const tokenParts = cleanToken.split('.');
			if (tokenParts.length !== 3) {
				throw new Error('Invalid worker token format');
			}

			// Validate token parts are not empty
			if (tokenParts.some((part) => part.length === 0)) {
				throw new Error('Invalid worker token format');
			}

			// Prefer the otp.check URL from _links if provided (per Phase 1 spec)
			let endpoint: string;
			let requestBody: Record<string, unknown>;
			
			if (params.otpCheckUrl) {
				// Use the URL from PingOne's _links response
				endpoint = params.otpCheckUrl;
				requestBody = { otp: params.otp };
				console.log(`${MODULE_TAG} Using otp.check URL from _links:`, endpoint);
			} else {
				// Fallback to our proxy endpoint
				endpoint = '/api/pingone/mfa/validate-otp-for-device';
				requestBody = {
					environmentId: params.environmentId,
					authenticationId: params.deviceAuthId,
					otp: params.otp,
					workerToken: cleanToken,
				};
				console.log(`${MODULE_TAG} Using fallback validate-otp-for-device endpoint`);
			}

			console.log(`${MODULE_TAG} Validating OTP`, {
				deviceAuthId: params.deviceAuthId,
				otpLength: params.otp.length,
				tokenLength: cleanToken.length,
				usingLinks: !!params.otpCheckUrl,
			});

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(params.otpCheckUrl ? { Authorization: `Bearer ${cleanToken}` } : {}),
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				return {
					valid: false,
					status: errorData.status || 'FAILED',
					message: errorData.error || errorData.message || 'OTP validation failed',
				};
			}

			const result = await response.json();
			console.log(`${MODULE_TAG} OTP validation result`, {
				status: result.status,
				valid: result.status === 'COMPLETED',
			});

			return {
				valid: result.status === 'COMPLETED',
				status: result.status,
				message: result.message || (result.status === 'COMPLETED' ? 'OTP validated successfully' : 'Invalid OTP code'),
			};

		} catch (error) {
			console.error(`${MODULE_TAG} Error validating OTP:`, error);
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
					Authorization: `Bearer ${accessToken}`,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
				body: { environmentId, workerToken: accessToken },
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
				body: { environmentId, settings, workerToken: accessToken },
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
					Authorization: `Bearer ${accessToken}`,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
					Authorization: `Bearer ${accessToken}`,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
			body: requestBody,
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
				headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
					Authorization: `Bearer ${accessToken}`,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
	 * Initialize one-time device authentication (Phase 2)
	 * Uses selectedDevice.oneTime instead of registered device ID
	 * @param params - One-time device parameters
	 */
	static async initializeOneTimeDeviceAuthentication(params: {
		environmentId: string;
		username: string;
		type: 'EMAIL' | 'SMS';
		email?: string; // Required for EMAIL type
		phone?: string; // Required for SMS type
		workerToken?: string;
		deviceAuthenticationPolicyId?: string;
		region?: string;
	}): Promise<{
		id: string;
		status: string;
		_links?: Record<string, { href: string }>;
		[key: string]: unknown;
	}> {
		console.log(`${MODULE_TAG} Initializing one-time device authentication`, {
			type: params.type,
			environmentId: params.environmentId,
			username: params.username,
		});

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = params.workerToken || await MFAServiceV8.getWorkerToken();

			// Validate token before sending
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				console.error(`${MODULE_TAG} Worker token validation failed`, {
					hasToken: !!accessToken,
					tokenType: typeof accessToken,
					tokenLength: accessToken?.length || 0,
				});
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			// Remove any Bearer prefix if present and trim whitespace
			const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');
			
			// Validate JWT format (should have 3 parts separated by dots)
			const tokenParts = cleanToken.split('.');
			if (tokenParts.length !== 3 || tokenParts.some(part => part.length === 0)) {
				console.error(`${MODULE_TAG} Worker token is not a valid JWT`, {
					tokenLength: cleanToken.length,
					partsCount: tokenParts.length,
					partsLength: tokenParts.map(p => p.length),
					tokenStart: cleanToken.substring(0, 30),
				});
				throw new Error('Worker token is not in valid JWT format. Please generate a new worker token.');
			}
			
			console.log(`${MODULE_TAG} Worker token validated`, {
				tokenLength: cleanToken.length,
				partsCount: tokenParts.length,
				hasBearerPrefix: accessToken.trim().startsWith('Bearer '),
			});

			// Build request body for one-time device authentication
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				type: params.type,
				[params.type.toLowerCase()]: params.type === 'EMAIL' ? params.email : params.phone,
				workerToken: cleanToken,
				deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
				region: params.region,
			};

			console.log(`${MODULE_TAG} Sending one-time device authentication request`, {
				environmentId: params.environmentId,
				userId: user.id,
				type: params.type,
				hasContact: !!(params.email || params.phone),
			});

			const response = await fetch('/api/pingone/mfa/initialize-one-time-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(errorData.error || errorData.message || 'Failed to initialize one-time device authentication');
			}

			const authData = await response.json();
			const deviceAuthId = authData.id;

			// Extract otp.check URL from _links per Phase 2 spec
			let otpCheckUrl: string | undefined;
			if (authData._links?.['otp.check']?.href) {
				otpCheckUrl = authData._links['otp.check'].href;
				console.log(`${MODULE_TAG} Extracted otp.check URL from _links:`, otpCheckUrl);
			} else {
				console.warn(`${MODULE_TAG} No otp.check URL found in _links, will use fallback endpoint`);
			}

			console.log(`${MODULE_TAG} One-time device authentication initialized`, { 
				deviceAuthId, 
				status: authData.status,
				hasOtpCheckLink: !!otpCheckUrl 
			});

			return {
				id: deviceAuthId,
				status: authData.status,
				_links: authData._links,
				...authData
			};

		} catch (error) {
			console.error(`${MODULE_TAG} Error in one-time device authentication:`, error);
			throw error;
		}
	}

	/**
	 * Send OTP to device using the new MFA API pattern
	 * 1. Initialize device authentication to get deviceAuthId
	 * 2. Send OTP to the device
	 * @param params - Device parameters
	 */
	static async sendOTP(params: SendOTPParams): Promise<{ deviceAuthId: string; otpCheckUrl?: string }> {
		console.log(`${MODULE_TAG} Initializing device authentication for OTP`);

		try {
			// Look up user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Validate token before sending
			if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
				console.error(`${MODULE_TAG} Worker token validation failed`, {
					hasToken: !!accessToken,
					tokenType: typeof accessToken,
					tokenLength: accessToken?.length || 0,
				});
				throw new Error('Worker token is missing or invalid. Please generate a new worker token.');
			}

			// Remove any Bearer prefix if present and trim whitespace
			const cleanToken = accessToken.trim().replace(/^Bearer\s+/i, '');
			
			// Validate JWT format (should have 3 parts separated by dots)
			const tokenParts = cleanToken.split('.');
			if (tokenParts.length !== 3 || tokenParts.some(part => part.length === 0)) {
				console.error(`${MODULE_TAG} Worker token is not a valid JWT`, {
					tokenLength: cleanToken.length,
					partsCount: tokenParts.length,
					partsLength: tokenParts.map(p => p.length),
					tokenStart: cleanToken.substring(0, 30),
				});
				throw new Error('Worker token is not in valid JWT format. Please generate a new worker token.');
			}
			
			console.log(`${MODULE_TAG} Worker token validated`, {
				tokenLength: cleanToken.length,
				partsCount: tokenParts.length,
				hasBearerPrefix: accessToken.trim().startsWith('Bearer '),
			});

			// Step 1: Initialize device authentication
			const initRequestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
				workerToken: cleanToken,
			};

			console.log(`${MODULE_TAG} Initializing device authentication`, {
				environmentId: params.environmentId,
				userId: user.id,
				deviceId: params.deviceId,
			});

			const initResponse = await fetch('/api/pingone/mfa/initialize-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(initRequestBody),
			});

			if (!initResponse.ok) {
				const errorData = await initResponse.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(errorData.error || errorData.message || 'Failed to initialize device authentication');
			}

			const authData = await initResponse.json();
			const deviceAuthId = authData.id;

			// Extract otp.check URL from _links per Phase 1 spec
			let otpCheckUrl: string | undefined;
			if (authData._links?.['otp.check']?.href) {
				otpCheckUrl = authData._links['otp.check'].href;
				console.log(`${MODULE_TAG} Extracted otp.check URL from _links:`, otpCheckUrl);
			} else {
				console.warn(`${MODULE_TAG} No otp.check URL found in _links, will use fallback endpoint`);
			}

			console.log(`${MODULE_TAG} Device authentication initialized`, { 
				deviceAuthId, 
				hasOtpCheckLink: !!otpCheckUrl 
			});

			// Step 2: Send OTP to the selected device
			const otpRequestBody = {
				environmentId: params.environmentId,
				deviceAuthId,
				deviceId: params.deviceId,
				workerToken: cleanToken,
			};

			console.log(`${MODULE_TAG} Sending OTP to device`, { deviceAuthId, deviceId: params.deviceId });

			const otpResponse = await fetch('/api/pingone/mfa/send-otp-to-device', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(otpRequestBody),
			});

			if (!otpResponse.ok) {
				const errorData = await otpResponse.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(errorData.error || errorData.message || 'Failed to send OTP');
			}

			console.log(`${MODULE_TAG} OTP sent successfully`, { deviceAuthId, hasOtpCheckUrl: !!otpCheckUrl });
			return { deviceAuthId, otpCheckUrl };

		} catch (error) {
			console.error(`${MODULE_TAG} Error in OTP flow:`, error);
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
				body: requestBody,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
				body: requestBody,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
				body: requestBody,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
				body: requestBody,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
	 * Initialize device authentication using the PingOne MFA API
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication
	 * @param params - Device authentication parameters (deviceId optional, policy recommended)
	 * @returns Authentication data including authenticationId (deviceAuthID)
	 */
	static async initializeDeviceAuthentication(
		params: MFACredentials & {
			deviceId?: string;
			deviceAuthenticationPolicyId?: string;
			region?: string;
		}
	): Promise<{
		id: string; // authenticationId (deviceAuthID)
		status: string;
		nextStep?: string; // OTP_REQUIRED, ASSERTION_REQUIRED, SELECTION_REQUIRED, etc.
		devices?: Array<{ id: string; type: string; nickname?: string }>;
		challengeId?: string;
		[key: string]: unknown;
	}> {
		console.log(`${MODULE_TAG} Initializing device authentication via PingOne MFA API`, {
			username: params.username,
			deviceId: params.deviceId,
			policyId: params.deviceAuthenticationPolicyId,
		});

		try {
			// Lookup user by username to obtain the PingOne user ID required by the MFA API
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Retrieve and trim the worker token
			const accessToken = await MFAServiceV8.getWorkerToken();
			const trimmedToken = accessToken.trim();

			const requestBody: {
				environmentId: string;
				userId: string;
				workerToken: string;
				deviceId?: string;
				policyId?: string;
				region?: string;
			} = {
				environmentId: params.environmentId,
				userId: user.id,
				workerToken: trimmedToken,
			};

			if (params.deviceId) {
				requestBody.deviceId = params.deviceId;
			}

			if (params.deviceAuthenticationPolicyId) {
				requestBody.policyId = params.deviceAuthenticationPolicyId;
			}

			if (params.region) {
				requestBody.region = params.region;
			}

			console.log(`${MODULE_TAG} Calling backend initialize-device-authentication endpoint`, {
				url: '/api/pingone/mfa/initialize-device-authentication',
				body: requestBody,
			});

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/initialize-device-authentication',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
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
				const errorMessage = errorData.message || errorData.error || response.statusText;

				console.error(`${MODULE_TAG} Initialize device authentication (PingOne MFA API) failed`, {
					status: response.status,
					statusText: response.statusText,
					errorData,
					environmentId: params.environmentId,
					userId: user.id,
					tokenLength: trimmedToken.length,
				});

				if (response.status === 403) {
					throw new Error(
						`Failed to initialize device authentication: ${errorMessage}. ` +
							`Verify the worker token includes the required PingOne MFA scopes: ${PINGONE_WORKER_MFA_SCOPE_STRING}.`
					);
				}

				throw new Error(`Failed to initialize device authentication: ${errorMessage}`);
			}

			const authData = responseData as {
				id: string;
				status: string;
				nextStep?: string;
				devices?: Array<{ id: string; type: string; nickname?: string }>;
				challengeId?: string;
				[key: string]: unknown;
			};

			console.log(`${MODULE_TAG} Device authentication initialized via PingOne API`, {
				id: authData.id,
				status: authData.status,
				nextStep: authData.nextStep,
				hasDevices: !!authData.devices,
			});

			return authData;
		} catch (error) {
			console.error(`${MODULE_TAG} Initialize device authentication error`, error);
			throw error;
		}
	}

	/**
	 * @deprecated Use initializeDeviceAuthentication instead.
	 * Retained for backwards compatibility with earlier flows that referenced the
	 * auth.pingone.com endpoint directly.
	 */
	static async initializeDeviceAuthenticationAuth(
		params: MFACredentials & { deviceId?: string; deviceAuthenticationPolicyId?: string; region?: string }
	): Promise<{
		id: string;
		status: string;
		nextStep?: string;
		devices?: Array<{ id: string; type: string; nickname?: string }>;
		challengeId?: string;
		[key: string]: unknown;
	}> {
		console.warn(
			`${MODULE_TAG} initializeDeviceAuthenticationAuth is deprecated. Forwarding to initializeDeviceAuthentication().`,
			{ hasPolicy: !!params.deviceAuthenticationPolicyId }
		);

		return MFAServiceV8.initializeDeviceAuthentication(params);
	}

	/**
	 * Read device authentication details from PingOne MFA API
	 * GET /mfa/v1/environments/{environmentId}/deviceAuthentications/{deviceAuthenticationId}
	 * @param params - Environment & authentication identifiers
	 * @returns Device authentication record
	 */
	static async readDeviceAuthentication(params: {
		environmentId: string;
		authenticationId: string;
		region?: string;
	}): Promise<Record<string, unknown>> {
		console.log(`${MODULE_TAG} Reading device authentication record`, {
			environmentId: params.environmentId,
			authenticationId: params.authenticationId,
			region: params.region || 'na',
		});

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();
			const trimmedToken = accessToken.trim();

			const requestBody = {
				environmentId: params.environmentId,
				authenticationId: params.authenticationId,
				workerToken: trimmedToken,
				...(params.region ? { region: params.region } : {}),
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/read-device-authentication',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Read Device Authentication',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/read-device-authentication', {
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
					`Failed to read device authentication: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			return responseData as Record<string, unknown>;
		} catch (error) {
			console.error(`${MODULE_TAG} Read device authentication error`, error);
			throw error instanceof Error ? error : new Error(String(error));
		}
	}

	/**
	 * Validate OTP for Device Authentication (Auth Server endpoint)
	 * POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/passcode
	 * Per master-sms.md: Use /passcode endpoint, NOT /otp
	 * Request body: { otp, deviceAuthenticationId }
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-validate-otp-for-device
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
				body: requestBody,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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
	 * Cancel Device Authentication (Auth Server endpoint)
	 * POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/cancel
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-cancel-device-authentication
	 * @param params - Authentication parameters with authenticationId (and optional reason)
	 * @returns Cancel result
	 */
	static async cancelDeviceAuthentication(
		params: MFACredentials & {
			authenticationId: string;
			reason?: 'SIGNOUT' | 'CHANGE_DEVICE' | 'ADD_DEVICE' | 'USER_CANCELLED';
		}
	): Promise<{ status: string; [key: string]: unknown }> {
		const cancelReason = params.reason || 'USER_CANCELLED';
		console.log(`${MODULE_TAG} Canceling device authentication`, {
			username: params.username,
			authenticationId: params.authenticationId,
			reason: cancelReason,
		});

		try {
			// Lookup user by username
			const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

			// Get worker token
			const accessToken = await MFAServiceV8.getWorkerToken();

			// Cancel device authentication via backend proxy
			const requestBody = {
				environmentId: params.environmentId,
				userId: user.id,
				authenticationId: params.authenticationId,
				workerToken: accessToken.trim(),
				reason: cancelReason,
			};

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/cancel-device-authentication',
				headers: {
					'Content-Type': 'application/json',
				},
				body: requestBody,
				step: 'mfa-Cancel Device Authentication',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/cancel-device-authentication', {
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to cancel device authentication: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const cancelData = responseData as { status: string; [key: string]: unknown };
			console.log(`${MODULE_TAG} Device authentication canceled:`, cancelData);
			return cancelData;
		} catch (error) {
			console.error(`${MODULE_TAG} Cancel device authentication error`, error);
			throw error;
		}
	}

	/**
	 * Select Device for Authentication (Auth Server endpoint)
	 * POST https://auth.pingone.com/{ENV_ID}/deviceAuthentications/{DEVICE_AUTHENTICATION_ID}/selection
	 * Per master-sms.md: Use /selection endpoint
	 * Request body: { device: { id: DEVICE_ID } }
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
				body: requestBody,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
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

	static async listDeviceAuthenticationPolicies(environmentId: string): Promise<DeviceAuthenticationPolicy[]> {
		console.log(`${MODULE_TAG} Listing device authentication policies`, { environmentId });

		try {
			const accessToken = await MFAServiceV8.getWorkerToken();

			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/device-authentication-policies',
				headers: {
					'Content-Type': 'application/json',
				},
				body: { environmentId, workerToken: accessToken.trim() },
				step: 'mfa-List Device Authentication Policies',
			});

			let response: Response;
			try {
				response = await fetch('/api/pingone/mfa/device-authentication-policies', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId,
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
					headers: (() => {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	return headers;
})(),
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = responseData as PingOneResponse;
				throw new Error(
					`Failed to list device authentication policies: ${errorData.message || errorData.error || response.statusText}`
				);
			}

			const policiesResponse = responseData as {
				_embedded?: { deviceAuthenticationPolicies?: DeviceAuthenticationPolicy[] };
				items?: DeviceAuthenticationPolicy[];
				deviceAuthenticationPolicies?: DeviceAuthenticationPolicy[];
			};

			const policies = Array.isArray(policiesResponse?._embedded?.deviceAuthenticationPolicies)
				? policiesResponse._embedded?.deviceAuthenticationPolicies ?? []
				: Array.isArray(policiesResponse?.items)
					? policiesResponse.items ?? []
					: Array.isArray(policiesResponse?.deviceAuthenticationPolicies)
						? policiesResponse.deviceAuthenticationPolicies ?? []
						: [];

			console.log(`${MODULE_TAG} Retrieved ${policies.length} device authentication policies`);
			return policies;
		} catch (error) {
			console.error(`${MODULE_TAG} List device authentication policies error`, error);
			throw error;
		}
	}
}

export default MFAServiceV8;
