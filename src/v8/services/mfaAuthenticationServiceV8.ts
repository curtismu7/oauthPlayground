/**
 * @file mfaAuthenticationServiceV8.ts
 * @module v8/services
 * @description PingOne MFA v1 authentication service - handles device authentication flows only
 * @version 8.0.0
 * @since 2024-11-30
 *
 * Implements PingOne MFA v1 API for authentication ONLY:
 * - POST /mfa/v1/environments/{envId}/deviceAuthentications
 * - Follow all _links (otp.check, challenge.poll, device.update, complete)
 * - Handle OTP, Push, WebAuthn, Polling, MFA completion
 *
 * STRICTLY uses MFA v1 APIs - NO Platform APIs
 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/
 *
 * @example
 * const result = await MfaAuthenticationServiceV8.initializeDeviceAuthentication({
 *   environmentId: 'xxx',
 *   username: 'john.doe',
 *   deviceAuthenticationPolicyId: 'policy-123'
 * });
 */

import { pingOneFetch } from '@/utils/pingOneFetch';
import { workerTokenServiceV8 } from './workerTokenServiceV8';

const MODULE_TAG = '[🔐 MFA-AUTHENTICATION-SERVICE-V8]';

export interface AuthenticationCredentials {
	environmentId: string;
	username?: string; // Optional - can use userId instead
	userId?: string; // Optional - can use username instead (will be looked up)
	deviceAuthenticationPolicyId: string;
}

export interface DeviceAuthenticationInitParams extends AuthenticationCredentials {
	deviceId?: string; // Optional: target specific device immediately (Phase 1)
}

/**
 * Phase 2: One-time device authentication parameters
 * Used when contact details (email/phone) are stored in our DB, not in PingOne
 */
export interface OneTimeDeviceAuthenticationParams extends AuthenticationCredentials {
	type: 'EMAIL' | 'SMS';
	email?: string; // Required for EMAIL type
	phone?: string; // Required for SMS type
}

export interface DeviceAuthenticationResponse {
	id: string;
	status: string;
	nextStep?: string;
	devices?: Array<{ id: string; type: string; nickname?: string }>;
	challengeId?: string;
	_links?: Record<string, { href: string }>;
	[key: string]: unknown;
}

export interface OTPValidationParams {
	environmentId: string;
	username?: string; // Optional - can use userId instead
	userId?: string; // Optional - can use username instead
	authenticationId: string;
	otp: string;
	otpCheckUrl?: string; // From _links.otp.check.href
}

export interface OTPValidationResult {
	status: string;
	message?: string;
	valid: boolean;
	_links?: Record<string, { href: string }>;
}

export interface DeviceSelectionParams {
	environmentId: string;
	username: string;
	userId?: string; // Optional - will be looked up if not provided
	authenticationId: string;
	deviceId: string;
}

export interface WebAuthnAuthenticationParams {
	environmentId: string;
	username: string;
	authenticationId: string;
	challengeId: string;
}

export interface AuthenticationCompletionResult {
	status: 'COMPLETED' | 'FAILED' | 'PENDING';
	message?: string;
	accessToken?: string;
	tokenType?: string;
	expiresIn?: number;
	[key: string]: unknown;
}

/**
 * PingOne MFA v1 Authentication Service
 * Handles device authentication flows using MFA v1 APIs only
 */
export class MfaAuthenticationServiceV8 {
	/**
	 * Initialize device authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication
	 */
	static async initializeDeviceAuthentication(
		params: DeviceAuthenticationInitParams
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Initializing device authentication`, {
			username: params.username,
			policyId: params.deviceAuthenticationPolicyId,
			deviceId: params.deviceId,
		});

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Read policy to check skipUserLockVerification setting
			let policy: import('@/v8/flows/shared/MFATypes').DeviceAuthenticationPolicy | null = null;
			if (params.deviceAuthenticationPolicyId) {
				try {
					const { MFAServiceV8 } = await import('./mfaServiceV8');
					policy = await MFAServiceV8.readDeviceAuthenticationPolicy(
						params.environmentId,
						params.deviceAuthenticationPolicyId
					);
					console.log(`${MODULE_TAG} Policy loaded for lock verification check:`, {
						policyId: params.deviceAuthenticationPolicyId,
						skipUserLockVerification: policy.skipUserLockVerification,
					});
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to read policy for lock verification, continuing:`, error);
					// Continue without policy - don't fail initialization
				}
			}

			// Get userId - use provided userId or look up by username
			let userId: string;
			let user: import('./mfaServiceV8').UserLookupResult | null = null;
			if (params.userId) {
				userId = params.userId;
			} else if (params.username) {
				const { MFAServiceV8 } = await import('./mfaServiceV8');
				user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
				userId = user.id as string;
			} else {
				throw new Error('Either username or userId must be provided');
			}

			// Check user lock status if policy requires it (skipUserLockVerification is false or undefined)
			// If skipUserLockVerification is true, skip the check
			if (policy?.skipUserLockVerification !== true) {
				// If we don't have user data yet, fetch it
				if (!user && params.username) {
					const { MFAServiceV8 } = await import('./mfaServiceV8');
					user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
				}

				// Check if user is locked (check multiple possible fields)
				const isLocked = user?.locked === true || 
					user?.account?.locked === true || 
					user?.status === 'LOCKED' ||
					user?.account?.status === 'LOCKED';

				if (isLocked) {
					const errorMessage = 'User account is locked. Please contact your administrator to unlock your account.';
					console.error(`${MODULE_TAG} User is locked, blocking authentication:`, {
						userId,
						username: params.username,
						userStatus: user?.status,
						accountStatus: user?.account?.status,
						userLocked: user?.locked,
						accountLocked: user?.account?.locked,
					});
					throw new Error(errorMessage);
				}
			} else {
				console.log(`${MODULE_TAG} Skipping user lock verification (skipUserLockVerification=true)`);
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const requestBody = {
				environmentId: params.environmentId,
				userId,
				deviceId: params.deviceId,
				deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
				workerToken: cleanToken,
			};
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/initialize-device-authentication',
				body: {
					...requestBody,
					workerToken: cleanToken ? '***REDACTED***' : undefined,
				},
				step: 'mfa-Initialize Device Authentication',
				flowType: 'mfa',
			});

			// Use backend proxy endpoint to avoid CORS violations
			const response = await fetch('/api/pingone/mfa/initialize-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				// Check for NO_USABLE_DEVICES error
				if (typeof responseData === 'object' && responseData !== null) {
					const errorObj = responseData as { error?: string | { code?: string; message?: string; unavailableDevices?: Array<{ id: string }> }; message?: string; unavailableDevices?: Array<{ id: string }> };
					
					if (errorObj.error === 'NO_USABLE_DEVICES' || (typeof errorObj.error === 'object' && errorObj.error?.code === 'NO_USABLE_DEVICES')) {
						const unavailableDevices = errorObj.unavailableDevices || (typeof errorObj.error === 'object' ? errorObj.error.unavailableDevices : undefined) || [];
						const errorMessage = (typeof errorObj.error === 'object' ? errorObj.error.message : undefined) || errorObj.message || 'No usable devices found for authentication';
						
						const error = new Error(errorMessage) as Error & { errorCode?: string; unavailableDevices?: Array<{ id: string }> };
						error.errorCode = 'NO_USABLE_DEVICES';
						error.unavailableDevices = unavailableDevices;
						throw error;
					}

					// Check for WhatsApp-specific PingOne errors returned via backend wrapper
					const wrappedError = responseData as {
						error?: string;
						message?: string;
						details?: {
							code?: string;
							message?: string;
							details?: Array<{
								code?: string;
								message?: string;
								innerError?: { deliveryMethod?: string; coolDownExpiresAt?: number };
							}>;
						};
					};

					const pingError = wrappedError.details;
					const pingErrorDetails = pingError?.details;

					if (pingError && Array.isArray(pingErrorDetails)) {
						// WhatsApp temporarily locked (LIMIT_EXCEEDED)
						const limitExceededDetail = pingErrorDetails.find((d) =>
							(d.code === 'LIMIT_EXCEEDED') &&
							d.innerError &&
							typeof d.innerError.deliveryMethod === 'string' &&
							d.innerError.deliveryMethod.toUpperCase() === 'WHATSAPP'
						);

						if (limitExceededDetail) {
							const expiresAt = limitExceededDetail.innerError?.coolDownExpiresAt;
							let friendlyMessage = 'WhatsApp MFA is temporarily locked due to too many recent attempts. Please wait a few minutes and try again, or select a different device such as SMS or FIDO2.';
							if (expiresAt && typeof expiresAt === 'number') {
								try {
									const lockUntil = new Date(expiresAt);
									friendlyMessage =
										`WhatsApp MFA is temporarily locked due to too many recent attempts. It should be available again around ${lockUntil.toLocaleTimeString()} (${lockUntil.toLocaleDateString()}). ` +
										'You can also select another device such as SMS or FIDO2 in the meantime.';
								} catch {
									// If date conversion fails, fall back to generic message
								}
							}
							const error = new Error(friendlyMessage) as Error & { errorCode?: string };
							error.errorCode = 'WHATSAPP_LIMIT_EXCEEDED';
							throw error;
						}

						// WhatsApp device selection not supported / INVALID_DATA "Could not find suitable content."
						const invalidValueDetail = pingErrorDetails.find((d) =>
							(d.code === 'INVALID_VALUE') &&
							typeof d.message === 'string' &&
							d.message.toLowerCase().includes('could not find suitable content')
						);

						if (pingError.code === 'INVALID_DATA' && invalidValueDetail) {
							const error = new Error(
								'This WhatsApp device cannot be used for authentication with the current PingOne policy. Try another device (for example SMS or FIDO2), or update your PingOne Device Authentication Policy to allow WhatsApp for authentication.'
							) as Error & { errorCode?: string };
							error.errorCode = 'WHATSAPP_DEVICE_SELECTION_NOT_SUPPORTED';
							throw error;
						}
					}
				}
				
				const errorText = typeof responseData === 'object' && responseData !== null && 'message' in responseData
					? String(responseData.message)
					: response.statusText;
				throw new Error(`Failed to initialize device authentication: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
			}

			const data = responseData as DeviceAuthenticationResponse;
			console.log(`${MODULE_TAG} Device authentication initialized`, {
				authenticationId: data.id,
				status: data.status,
				nextStep: data.nextStep,
				hasLinks: !!data._links,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error initializing device authentication`, error);
			throw error;
		}
	}

	/**
	 * Phase 2: Initialize one-time device authentication
	 * POST {{authPath}}/{{ENV_ID}}/deviceAuthentications
	 * Uses selectedDevice.oneTime instead of selectedDevice.id
	 * API Reference: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-initialize-device-authentication
	 */
	static async initializeOneTimeDeviceAuthentication(
		params: OneTimeDeviceAuthenticationParams
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Initializing one-time device authentication (Phase 2)`, {
			username: params.username,
			policyId: params.deviceAuthenticationPolicyId,
			type: params.type,
			hasEmail: !!params.email,
			hasPhone: !!params.phone,
		});

		// Validate required fields based on type
		if (params.type === 'EMAIL' && !params.email) {
			throw new Error('Email is required for EMAIL type one-time device authentication');
		}
		if (params.type === 'SMS' && !params.phone) {
			throw new Error('Phone is required for SMS type one-time device authentication');
		}

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Get userId - use provided userId or look up by username
			let userId: string;
			if (params.userId) {
				userId = params.userId;
			} else if (params.username) {
				const { MFAServiceV8 } = await import('./mfaServiceV8');
				const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
				userId = user.id as string;
			} else {
				throw new Error('Either username or userId must be provided');
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const requestBody = {
				environmentId: params.environmentId,
				userId,
				deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
				workerToken: cleanToken,
				// Phase 2: one-time device data
				oneTimeDevice: {
					type: params.type,
					email: params.email,
					phone: params.phone,
				},
			};
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/initialize-device-authentication',
				body: {
					...requestBody,
					workerToken: cleanToken ? '***REDACTED***' : undefined,
				},
				step: 'mfa-Initialize One-Time Device Authentication',
				flowType: 'mfa',
			});

			// Use backend proxy endpoint to avoid CORS violations
			const response = await fetch('/api/pingone/mfa/initialize-device-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorText = typeof responseData === 'object' && responseData !== null && 'message' in responseData
					? String(responseData.message)
					: response.statusText;
				throw new Error(`Failed to initialize one-time device authentication: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
			}

			const data = responseData as DeviceAuthenticationResponse;
			console.log(`${MODULE_TAG} One-time device authentication initialized`, {
				authenticationId: data.id,
				status: data.status,
				nextStep: data.nextStep,
				hasLinks: !!data._links,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error initializing one-time device authentication`, error);
			throw error;
		}
	}

	/**
	 * Read device authentication status
	 * GET /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}
	 */
	static async readDeviceAuthentication(
		environmentId: string,
		usernameOrUserId: string,
		authenticationId: string,
		options?: { isUserId?: boolean }
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Reading device authentication status`, { authenticationId, isUserId: options?.isUserId });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// If not explicitly marked as userId, check if it looks like a UUID (userId) or treat as username
			let userId: string;
			if (options?.isUserId) {
				userId = usernameOrUserId;
			} else {
				// Check if it's a UUID (userId format) or username
				const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
				if (uuidRegex.test(usernameOrUserId)) {
					userId = usernameOrUserId;
				} else {
					// Look up userId from username
					const { MFAServiceV8 } = await import('./mfaServiceV8');
					const user = await MFAServiceV8.lookupUserByUsername(environmentId, usernameOrUserId);
					userId = user.id as string;
				}
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const cleanTokenStr = cleanToken || '';
			const proxyEndpoint = `/api/pingone/mfa/read-device-authentication?environmentId=${encodeURIComponent(environmentId)}&userId=${encodeURIComponent(userId)}&authenticationId=${encodeURIComponent(authenticationId)}&workerToken=${encodeURIComponent(cleanTokenStr)}`;
			
			const callId = apiCallTrackerService.trackApiCall({
				method: 'GET',
				url: '/api/pingone/mfa/read-device-authentication',
				queryParams: cleanTokenStr
					? {
							environmentId,
							userId,
							authenticationId,
							workerToken: '***REDACTED***',
						}
					: {
							environmentId,
							userId,
							authenticationId,
						},
				step: 'mfa-Read Device Authentication',
				flowType: 'mfa',
			});

			const response = await pingOneFetch(
				proxyEndpoint,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					retry: { maxAttempts: 3 },
				}
			);

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorText = typeof responseData === 'object' && responseData !== null && 'message' in responseData
					? String(responseData.message)
					: response.statusText;
				throw new Error(`Failed to read device authentication: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
			}

			const data = responseData as DeviceAuthenticationResponse;
			console.log(`${MODULE_TAG} Device authentication status read`, {
				status: data.status,
				nextStep: data.nextStep,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error reading device authentication`, error);
			throw error;
		}
	}

	/**
	 * Select device for authentication (when multiple devices available)
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}/devices/{deviceId}
	 * @param params - Device selection parameters
	 * @param options - Optional parameters including custom step name for API tracking
	 */
	static async selectDeviceForAuthentication(
		params: DeviceSelectionParams,
		options?: { stepName?: string }
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Selecting device for authentication`, {
			authenticationId: params.authenticationId,
			deviceId: params.deviceId,
			username: params.username,
			userId: params.userId,
		});

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Lookup userId if not provided (API requires userId, not username in path)
			let userId = params.userId;
			if (!userId && params.username) {
				const { MFAServiceV8 } = await import('./mfaServiceV8');
				const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
				userId = user.id as string;
				console.log(`${MODULE_TAG} Looked up userId for username:`, { username: params.username, userId });
			}

			if (!userId) {
				throw new Error('userId is required. Please provide userId or username to lookup.');
			}

			// Validate device is in allowed list before attempting selection
			// This prevents 400 errors when PingOne rejects a device that's not allowed by the policy
			try {
				const authData = await MfaAuthenticationServiceV8.readDeviceAuthentication(
					params.environmentId,
					userId,
					params.authenticationId,
					{ isUserId: true }
				);

				// Check if device selection is required and get list of allowed devices
				const needsDeviceSelection = 
					authData.status === 'DEVICE_SELECTION_REQUIRED' || 
					authData.nextStep === 'SELECTION_REQUIRED' ||
					authData.nextStep === 'DEVICE_SELECTION_REQUIRED';

				if (needsDeviceSelection) {
					// Get list of allowed devices from _embedded.devices or devices array
					const allowedDevices = (authData._embedded as { devices?: Array<{ id: string; type?: string; nickname?: string }> })?.devices || 
						(authData.devices as Array<{ id: string; type?: string; nickname?: string }> | undefined) || 
						[];

					console.log(`${MODULE_TAG} Validating device selection:`, {
						selectedDeviceId: params.deviceId,
						allowedDeviceIds: allowedDevices.map(d => d.id),
						allowedDeviceCount: allowedDevices.length,
					});

					// Check if selected device is in the allowed list
					const isDeviceAllowed = allowedDevices.some(device => device.id === params.deviceId);

					if (!isDeviceAllowed && allowedDevices.length > 0) {
						const allowedDeviceList = allowedDevices.map(d => 
							`${d.id}${d.nickname ? ` (${d.nickname})` : ''}${d.type ? ` [${d.type}]` : ''}`
						).join(', ');
						
						throw new Error(
							`Device ${params.deviceId} is not allowed by the current authentication policy. ` +
							`Please select one of the allowed devices: ${allowedDeviceList}. ` +
							`You may need to re-run "Initialize Authentication" to get the current list of allowed devices.`
						);
					} else if (!isDeviceAllowed && allowedDevices.length === 0) {
						throw new Error(
							`Device ${params.deviceId} is not allowed by the current authentication policy. ` +
							`No devices are currently available for selection. Please re-run "Initialize Authentication" to refresh the device list.`
						);
					}
				}
			} catch (validationError) {
				// If validation fails, check if it's our custom error (device not allowed)
				// or a different error (e.g., can't read auth data)
				if (validationError instanceof Error && validationError.message.includes('is not allowed')) {
					// Re-throw our validation error
					throw validationError;
				}
				// For other errors (e.g., can't read auth data), log warning but continue
				// The actual selection call will fail if device is invalid
				console.warn(`${MODULE_TAG} Could not validate device before selection (will attempt anyway):`, validationError);
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const requestBody = {
				environmentId: params.environmentId,
				deviceAuthId: params.authenticationId,
				deviceId: params.deviceId,
				workerToken: cleanToken,
			};
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/select-device',
				body: {
					...requestBody,
					workerToken: cleanToken ? '***REDACTED***' : undefined,
				},
				step: options?.stepName || 'mfa-Select Device for Authentication',
				flowType: 'mfa',
			});

			const response = await pingOneFetch(
				'/api/pingone/mfa/select-device',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
					retry: { maxAttempts: 3 },
				}
			);

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				// Check for NO_USABLE_DEVICES error
				if (typeof responseData === 'object' && responseData !== null) {
					const errorObj = responseData as { error?: string | { code?: string; message?: string; unavailableDevices?: Array<{ id: string }> }; message?: string; unavailableDevices?: Array<{ id: string }> };
					
					if (errorObj.error === 'NO_USABLE_DEVICES' || (typeof errorObj.error === 'object' && errorObj.error?.code === 'NO_USABLE_DEVICES')) {
						const unavailableDevices = errorObj.unavailableDevices || (typeof errorObj.error === 'object' ? errorObj.error.unavailableDevices : undefined) || [];
						const errorMessage = (typeof errorObj.error === 'object' ? errorObj.error.message : undefined) || errorObj.message || 'No usable devices found for authentication';
						
						const error = new Error(errorMessage) as Error & { errorCode?: string; unavailableDevices?: Array<{ id: string }> };
						error.errorCode = 'NO_USABLE_DEVICES';
						error.unavailableDevices = unavailableDevices;
						throw error;
					}

					// Check for WhatsApp-specific PingOne errors returned via backend wrapper
					const wrappedError = responseData as {
						error?: string;
						message?: string;
						details?: {
							code?: string;
							message?: string;
							details?: Array<{
								code?: string;
								message?: string;
								innerError?: { deliveryMethod?: string; coolDownExpiresAt?: number };
							}>;
						};
					};

					const pingError = wrappedError.details;
					const pingErrorDetails = pingError?.details;

					if (pingError && Array.isArray(pingErrorDetails)) {
						// WhatsApp temporarily locked (LIMIT_EXCEEDED)
						const limitExceededDetail = pingErrorDetails.find((d) =>
							(d.code === 'LIMIT_EXCEEDED') &&
							d.innerError &&
							typeof d.innerError.deliveryMethod === 'string' &&
							d.innerError.deliveryMethod.toUpperCase() === 'WHATSAPP'
						);

						if (limitExceededDetail) {
							const expiresAt = limitExceededDetail.innerError?.coolDownExpiresAt;
							let friendlyMessage = 'WhatsApp MFA is temporarily locked due to too many recent attempts. Please wait a few minutes and try again, or select a different device such as SMS or FIDO2.';
							if (expiresAt && typeof expiresAt === 'number') {
								try {
									const lockUntil = new Date(expiresAt);
									friendlyMessage =
										`WhatsApp MFA is temporarily locked due to too many recent attempts. It should be available again around ${lockUntil.toLocaleTimeString()} (${lockUntil.toLocaleDateString()}). ` +
										'You can also select another device such as SMS or FIDO2 in the meantime.';
								} catch {
									// If date conversion fails, fall back to generic message
								}
							}
							const error = new Error(friendlyMessage) as Error & { errorCode?: string };
							error.errorCode = 'WHATSAPP_LIMIT_EXCEEDED';
							throw error;
						}

						// WhatsApp device selection not supported / INVALID_DATA "Could not find suitable content."
						const invalidValueDetail = pingErrorDetails.find((d) =>
							(d.code === 'INVALID_VALUE') &&
							typeof d.message === 'string' &&
							d.message.toLowerCase().includes('could not find suitable content')
						);

						if (pingError.code === 'INVALID_DATA' && invalidValueDetail) {
							const error = new Error(
								'This WhatsApp device cannot be used for authentication with the current PingOne policy. Try another device (for example SMS or FIDO2), or update your PingOne Device Authentication Policy to allow WhatsApp for authentication.'
							) as Error & { errorCode?: string };
							error.errorCode = 'WHATSAPP_DEVICE_SELECTION_NOT_SUPPORTED';
							throw error;
						}
					}
				}

				const errorText = typeof responseData === 'object' && responseData !== null && 'message' in responseData
					? String(responseData.message)
					: response.statusText;
				
				// If it's a 400 error, try to read the device authentication to get allowed devices
				if (response.status === 400) {
					try {
						const authData = await MfaAuthenticationServiceV8.readDeviceAuthentication(
							params.environmentId,
							userId,
							params.authenticationId,
							{ isUserId: true }
						);
						
						const allowedDevices = (authData._embedded as { devices?: Array<{ id: string; type?: string; nickname?: string }> })?.devices || 
							(authData.devices as Array<{ id: string; type?: string; nickname?: string }> | undefined) || 
							[];
						
						if (allowedDevices.length > 0) {
							const allowedDeviceList = allowedDevices.map(d => 
								`${d.id}${d.nickname ? ` (${d.nickname})` : ''}${d.type ? ` [${d.type}]` : ''}`
							).join(', ');
							
							throw new Error(
								`Device selection failed: ${errorText}. ` +
								`The selected device (${params.deviceId}) is not allowed by the current authentication policy. ` +
								`Allowed devices: ${allowedDeviceList}. ` +
								`Please re-run "Initialize Authentication" and select a device from the allowed list.`
							);
						}
					} catch (readError) {
						// If we can't read auth data, just use the original error
						console.warn(`${MODULE_TAG} Could not read device authentication for better error message:`, readError);
					}
				}
				
				throw new Error(`Failed to select device: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
			}

			const result = responseData as Partial<DeviceAuthenticationResponse>;
			console.log(`${MODULE_TAG} Device selected for authentication`, {
				status: result.status,
				nextStep: result.nextStep,
			});

			// Ensure required fields exist
			if (!result.id || !result.status) {
				throw new Error('Invalid response from device selection API: missing required fields');
			}

			return result as DeviceAuthenticationResponse;
		} catch (error) {
			console.error(`${MODULE_TAG} Error selecting device for authentication`, error);
			throw error;
		}
	}

	/**
	 * Validate OTP using _links.otp.check or direct endpoint
	 * Follows PingOne MFA v1 API exactly
	 */
	/**
	 * Get worker token with automatic renewal if expired
	 * Checks if token exists, and if not, attempts to renew it using stored credentials
	 * Respects MFA configuration settings for auto-renewal
	 */
	private static async getWorkerTokenWithAutoRenew(): Promise<string> {
		// Load MFA configuration to check auto-renewal settings
		const { MFAConfigurationServiceV8 } = await import('@/v8/services/mfaConfigurationServiceV8');
		const config = MFAConfigurationServiceV8.loadConfiguration();
		const autoRenewalEnabled = config.workerToken.autoRenewal;
		const renewalThreshold = config.workerToken.renewalThreshold; // seconds before expiry
		
		let workerToken = await workerTokenServiceV8.getToken();
		
		// Decode JWT to check expiry
		let tokenExpiry: number | null = null;
		if (workerToken) {
			try {
				const [, payload] = workerToken.split('.');
				if (payload) {
					const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
					if (decoded.exp) {
						tokenExpiry = decoded.exp * 1000; // Convert to milliseconds
					}
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Could not decode token to check expiry:`, error);
			}
		}
		
		// Check if token is missing, expired, or about to expire
		const now = Date.now();
		const isExpired = tokenExpiry && now >= tokenExpiry;
		const timeRemaining = tokenExpiry ? Math.max(0, tokenExpiry - now) : 0;
		const timeRemainingSeconds = Math.floor(timeRemaining / 1000);
		const isAboutToExpire = tokenExpiry && timeRemaining <= (renewalThreshold * 1000);
		const needsRenewal = !workerToken || isExpired || isAboutToExpire;
		
		console.log(`${MODULE_TAG} Worker token check:`, {
			hasToken: !!workerToken,
			timeRemainingSeconds,
			renewalThreshold,
			isExpired,
			isAboutToExpire,
			needsRenewal,
			autoRenewalEnabled,
		});
		
		if (needsRenewal) {
			if (!autoRenewalEnabled) {
				console.log(`${MODULE_TAG} Token needs renewal but auto-renewal is disabled in MFA configuration`);
				if (!workerToken || isExpired) {
					throw new Error('Worker token not found or expired. Please generate a new worker token.');
				}
				// Token exists but is about to expire - warn user but don't auto-renew
				console.warn(`${MODULE_TAG} Worker token is about to expire (${timeRemainingSeconds}s remaining, threshold: ${renewalThreshold}s), but auto-renewal is disabled`);
			} else {
				console.log(`${MODULE_TAG} Token needs renewal (${timeRemainingSeconds}s remaining, threshold: ${renewalThreshold}s), attempting automatic renewal (auto-renewal enabled)...`);
				const credentials = await workerTokenServiceV8.loadCredentials();
				
				if (!credentials) {
					throw new Error('Worker token not found. Please generate a worker token first.');
				}
				
				// Attempt to issue a new token using stored credentials
				try {
					const region = credentials.region || 'us';
					const apiBase = 
						region === 'eu' ? 'https://auth.pingone.eu' :
						region === 'ap' ? 'https://auth.pingone.asia' :
						region === 'ca' ? 'https://auth.pingone.ca' :
						'https://auth.pingone.com';
					
					const actualPingOneUrl = `${apiBase}/${credentials.environmentId}/as/token`;
					const proxyEndpoint = '/api/pingone/token';
					const defaultScopes = ['mfa:device:manage', 'mfa:device:read'];
					const scopeList = credentials.scopes;
					const normalizedScopes: string[] = Array.isArray(scopeList) && scopeList.length > 0
						? scopeList 
						: defaultScopes;
					
					const params = new URLSearchParams({
						grant_type: 'client_credentials',
						client_id: credentials.clientId,
						scope: normalizedScopes.join(' '),
					});
					
					const headers: Record<string, string> = {
						'Content-Type': 'application/x-www-form-urlencoded',
					};
					
					const authMethod = credentials.tokenEndpointAuthMethod || 'client_secret_post';
					if (authMethod === 'client_secret_post') {
						params.set('client_secret', credentials.clientSecret);
					} else if (authMethod === 'client_secret_basic') {
						const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
						headers.Authorization = `Basic ${basicAuth}`;
					}
					
					// Track API call
					const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
					const startTime = Date.now();
					const callId = apiCallTrackerService.trackApiCall({
						method: 'POST',
						url: actualPingOneUrl,
						actualPingOneUrl,
						headers: {
							'Content-Type': headers['Content-Type'],
							...(headers.Authorization && { Authorization: 'Basic ***REDACTED***' }),
						},
						body: {
							grant_type: 'client_credentials',
							client_id: credentials.clientId,
							scope: normalizedScopes.join(' '),
							client_secret: authMethod === 'client_secret_post' ? '***REDACTED***' : undefined,
						},
						step: 'mfa-Renew Worker Token',
						flowType: 'mfa',
					});
					
					console.log(`${MODULE_TAG} Renewing worker token...`);
					let response: Response;
					try {
						response = await fetch(proxyEndpoint, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								environment_id: credentials.environmentId,
								region,
								body: params.toString(),
								auth_method: authMethod,
								headers: authMethod === 'client_secret_basic' ? headers : undefined,
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
					let data: unknown;
					try {
						data = await responseClone.json();
					} catch {
						const errorText = await response.text();
						data = { error: 'Failed to parse response', rawResponse: errorText.substring(0, 200) };
					}
					
					// Update API call with response
					apiCallTrackerService.updateApiCallResponse(
						callId,
						{
							status: response.status,
							statusText: response.statusText,
							data,
						},
						Date.now() - startTime
					);
					
					if (!response.ok) {
						const errorData = data as { error?: string; rawResponse?: string };
						throw new Error(`Token renewal failed: ${response.status} ${response.statusText} - ${errorData.error || errorData.rawResponse || 'Unknown error'}`);
					}
					
					const tokenData = data as { access_token: string; expires_in?: number };
					const newToken = tokenData.access_token;
					const expiresAt = tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined;
					
					await workerTokenServiceV8.saveToken(newToken, expiresAt);
					console.log(`${MODULE_TAG} Worker token renewed successfully`);
					
					// Dispatch event for status update
					window.dispatchEvent(new Event('workerTokenUpdated'));
					
					workerToken = newToken;
				} catch (renewError) {
					console.error(`${MODULE_TAG} Failed to renew token automatically:`, renewError);
					throw new Error(`Worker token expired and automatic renewal failed: ${renewError instanceof Error ? renewError.message : 'Unknown error'}. Please generate a new worker token.`);
				}
			}
		}
		
		if (!workerToken) {
			throw new Error('Worker token not found. Please generate a worker token first.');
		}
		
		return workerToken.trim().replace(/^Bearer\s+/i, '');
	}

	static async validateOTP(params: OTPValidationParams): Promise<OTPValidationResult> {
		console.log(`${MODULE_TAG} Validating OTP`, {
			authenticationId: params.authenticationId,
			hasOtpCheckUrl: !!params.otpCheckUrl,
		});

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			let endpoint: string;
			let contentType: string;

			if (params.otpCheckUrl) {
				// Use the URL from PingOne's _links response
				endpoint = params.otpCheckUrl;
				contentType = 'application/vnd.pingidentity.otp.check+json';
				console.log(`${MODULE_TAG} Using otp.check URL from _links:`, endpoint);
			} else {
				// Get userId - use provided userId or look up by username
				let userId: string;
				if (params.userId) {
					userId = params.userId;
				} else if (params.username) {
					const { MFAServiceV8 } = await import('./mfaServiceV8');
					const user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);
					userId = user.id as string;
				} else {
					throw new Error('Either username or userId must be provided');
				}
				
				// Fallback to direct endpoint
				endpoint = `/mfa/v1/environments/${params.environmentId}/users/${encodeURIComponent(
					userId
				)}/deviceAuthentications/${params.authenticationId}/otp`;
				contentType = 'application/json';
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const requestBody = {
				otp: params.otp,
			};
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: endpoint,
				headers: cleanToken
					? {
							'Content-Type': contentType,
							Authorization: 'Bearer ***REDACTED***',
						}
					: {
							'Content-Type': contentType,
						},
				body: requestBody,
				step: 'mfa-Validate OTP',
				flowType: 'mfa',
			});

			const response = await pingOneFetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': contentType,
					Authorization: `Bearer ${cleanToken}`,
				},
				body: JSON.stringify(requestBody),
				retry: { maxAttempts: 3 },
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorText = typeof responseData === 'object' && responseData !== null && 'message' in responseData
					? String(responseData.message)
					: response.statusText;
				console.error(`${MODULE_TAG} OTP validation failed`, {
					status: response.status,
					statusText: response.statusText,
					errorText,
				});

				// Parse error for attempts remaining
				let attemptsRemaining: number | undefined;
				if (typeof responseData === 'object' && responseData !== null) {
					const errorData = responseData as Record<string, unknown>;
					attemptsRemaining = (errorData.details as Array<{ innerError?: { attemptsRemaining?: number } }>)?.[0]?.innerError?.attemptsRemaining;
				}

				const otpError = new Error(`OTP validation failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`) as Error & {
					attemptsRemaining?: number;
				};
				if (attemptsRemaining !== undefined) {
					otpError.attemptsRemaining = attemptsRemaining;
				}
				throw otpError;
			}

			const data = responseData as Partial<OTPValidationResult>;
			const result: OTPValidationResult = {
				status: data.status || 'UNKNOWN',
				...(data.message && { message: data.message }),
				valid: data.status === 'COMPLETED',
				...(data._links && { _links: data._links }),
			};

			console.log(`${MODULE_TAG} OTP validation result`, {
				valid: result.valid,
				status: result.status,
				hasLinks: !!result._links,
			});

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Error validating OTP`, error);
			throw error;
		}
	}

	/**
	 * Poll for authentication completion (follow _links.challenge.poll)
	 * Used for Push notifications and WebAuthn challenges
	 */
	static async pollAuthenticationStatus(
		pollUrl: string
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Polling authentication status`, { pollUrl });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			const response = await pingOneFetch(pollUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${cleanToken}`,
				},
				retry: { maxAttempts: 3 },
			});

			if (!response.ok) {
				throw new Error(`Failed to poll authentication status: ${response.status} ${response.statusText}`);
			}

			const data = await response.json();
			console.log(`${MODULE_TAG} Authentication status polled`, {
				status: data.status,
				nextStep: data.nextStep,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error polling authentication status`, error);
			throw error;
		}
	}

	/**
	 * Complete authentication (follow _links.complete)
	 * Exchange successful authentication for tokens
	 */
	static async completeAuthentication(
		completeUrl: string
	): Promise<AuthenticationCompletionResult> {
		console.log(`${MODULE_TAG} Completing authentication`, { completeUrl });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: completeUrl,
				headers: cleanToken
					? {
							'Content-Type': 'application/json',
							Authorization: 'Bearer ***REDACTED***',
						}
					: {
							'Content-Type': 'application/json',
						},
				body: {},
				step: 'mfa-Complete Authentication',
				flowType: 'mfa',
			});

			const response = await pingOneFetch(completeUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${cleanToken}`,
				},
				body: JSON.stringify({}),
				retry: { maxAttempts: 3 },
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorText = typeof responseData === 'object' && responseData !== null && 'message' in responseData
					? String(responseData.message)
					: response.statusText;
				throw new Error(`Failed to complete authentication: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
			}

			const data = responseData as Record<string, unknown>;
			console.log(`${MODULE_TAG} Authentication completed`, {
				hasAccessToken: !!data.access_token,
				tokenType: data.token_type,
				expiresIn: data.expires_in,
			});

			const result: AuthenticationCompletionResult = {
				status: 'COMPLETED',
			};
			
			// Add optional properties if they exist
			if (data.access_token) {
				result.accessToken = String(data.access_token);
			}
			if (data.token_type) {
				result.tokenType = String(data.token_type);
			}
			if (data.expires_in) {
				result.expiresIn = Number(data.expires_in);
			}
			
			// Add any additional properties from the response
			Object.keys(data).forEach((key) => {
				if (key !== 'access_token' && key !== 'token_type' && key !== 'expires_in' && key !== 'status') {
					result[key] = data[key];
				}
			});
			
			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Error completing authentication`, error);
			throw error;
		}
	}

	/**
	 * Cancel device authentication
	 * POST /mfa/v1/environments/{environmentId}/users/{userId}/deviceAuthentications/{authenticationId}/cancel
	 */
	static async cancelDeviceAuthentication(
		environmentId: string,
		username: string,
		authenticationId: string
	): Promise<{ status: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Canceling device authentication`, { authenticationId });

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');

			const actualPingOneUrl = `https://api.pingone.com/mfa/v1/environments/${environmentId}/users/${encodeURIComponent(
				username
			)}/deviceAuthentications/${authenticationId}/cancel`;
			const proxyEndpoint = '/api/pingone/mfa/cancel-device-authentication';

			// Track API call
			const startTime = Date.now();
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: actualPingOneUrl,
				actualPingOneUrl,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ***REDACTED***`,
				},
				body: {},
				step: 'mfa-Cancel Device Authentication',
				flowType: 'mfa',
			});

			const response = await pingOneFetch(
				proxyEndpoint,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						environmentId,
						userId: username,
						authenticationId,
						workerToken: cleanToken,
					}),
					retry: { maxAttempts: 3 },
				}
			);

			const responseClone = response.clone();
			let data: unknown;
			try {
				data = await responseClone.json();
			} catch {
				data = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorData = data as { error?: string; message?: string };
				throw new Error(`Failed to cancel device authentication: ${response.status} ${response.statusText} - ${errorData.error || errorData.message || 'Unknown error'}`);
			}

			const result = data as { status: string; [key: string]: unknown };
			console.log(`${MODULE_TAG} Device authentication canceled`, { status: result.status });

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Error canceling device authentication`, error);
			throw error;
		}
	}

	/**
	 * Check Assertion (FIDO Device)
	 * POST {{authPath}}/{{envID}}/deviceAuthentications/{{deviceAuthID}}
	 * Content-Type: application/vnd.pingidentity.assertion.check+json
	 * 
	 * Validates the WebAuthn assertion for a FIDO2 device in an MFA authentication flow
	 * when the device authentication status is ASSERTION_REQUIRED.
	 * 
	 * @param deviceAuthId - The device authentication ID
	 * @param assertion - WebAuthn assertion result from navigator.credentials.get()
	 * @param environmentId - Optional environment ID (if not provided, will be loaded from credentials)
	 */
	static async checkFIDO2Assertion(
		deviceAuthId: string,
		assertion: {
			id: string;
			rawId: string;
			type: string;
			response: {
				clientDataJSON: string;
				authenticatorData: string;
				signature: string;
				userHandle?: string;
			};
		},
		environmentId?: string
	): Promise<{ status: string; nextStep?: string; [key: string]: unknown }> {
		console.log(`${MODULE_TAG} Checking FIDO2 assertion`, {
			deviceAuthId,
			hasAssertion: !!assertion,
		});

		try {
			const cleanToken = await MfaAuthenticationServiceV8.getWorkerTokenWithAutoRenew();

			// Build assertion body according to PingOne API spec
			const assertionBody = {
				assertion: {
					id: assertion.id,
					rawId: assertion.rawId,
					type: assertion.type,
					response: {
						clientDataJSON: assertion.response.clientDataJSON,
						authenticatorData: assertion.response.authenticatorData,
						signature: assertion.response.signature,
						...(assertion.response.userHandle && { userHandle: assertion.response.userHandle }),
					},
				},
			};

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();
			
			// Get environment ID - use provided parameter or load from credentials service
			let finalEnvironmentId = environmentId;
			if (!finalEnvironmentId) {
				// Use 'mfa-flow-v8' to match the flow key used in MFAAuthenticationMainPageV8
				const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
				const FLOW_KEY = 'mfa-flow-v8';
				const credentials = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
					flowKey: FLOW_KEY,
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});
				finalEnvironmentId = credentials?.environmentId;
			}
			
			if (!finalEnvironmentId) {
				throw new Error('Environment ID is required for FIDO2 assertion check. Please configure your credentials in the MFA Authentication page.');
			}
			
			const requestBody = {
				deviceAuthId,
				environmentId: finalEnvironmentId, // Include environment ID in request body
				assertion: assertionBody.assertion,
			};
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: '/api/pingone/mfa/check-fido2-assertion',
				body: {
					deviceAuthId,
					environmentId: finalEnvironmentId, // Include environment ID for display
					assertion: assertionBody.assertion, // Include assertion data for display
				},
				step: 'mfa-Check FIDO2 Assertion',
				flowType: 'mfa',
			});

			const response = await pingOneFetch('/api/pingone/mfa/check-fido2-assertion', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${cleanToken}`,
				},
				body: JSON.stringify(requestBody),
				retry: { maxAttempts: 3 },
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorText = typeof responseData === 'object' && responseData !== null && 'message' in responseData
					? String(responseData.message)
					: response.statusText;
				throw new Error(`Failed to check FIDO2 assertion: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
			}

			const data = responseData as { status: string; nextStep?: string; [key: string]: unknown };
			console.log(`${MODULE_TAG} FIDO2 assertion checked`, {
				status: data.status,
				nextStep: data.nextStep,
			});

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Error checking FIDO2 assertion`, error);
			throw error;
		}
	}

	/**
	 * Extract _links from response and return available actions
	 */
	static extractAvailableLinks(response: { _links?: Record<string, { href: string }> }): {
		otpCheck?: string;
		challengePoll?: string;
		deviceUpdate?: string;
		complete?: string;
		cancel?: string;
		assertionCheck?: string;
	} {
		const links = response._links || {};
		
		return {
			otpCheck: links['otp.check']?.href,
			challengePoll: links['challenge.poll']?.href,
			deviceUpdate: links['device.update']?.href,
			complete: links.complete?.href,
			cancel: links.cancel?.href,
			assertionCheck: links['assertion.check']?.href,
		};
	}
}

export default MfaAuthenticationServiceV8;
