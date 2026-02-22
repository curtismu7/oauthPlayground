/**
 * @file deviceAuthenticationService.ts
 * @module apps/mfa/services/authentication
 * @description Pure device authentication service - extracted from MfaAuthenticationServiceV8
 * @version 8.0.0
 * @since 2026-02-20
 *
 * This service handles ONLY device authentication operations.
 * Registration operations are handled by the separate DeviceRegistrationService.
 */

import type { MFADevice } from '@/apps/mfa/types/mfaFlowTypes';
import { pingOneFetch } from '@/utils/pingOneFetch';

const MODULE_TAG = '[🔐 DEVICE-AUTHENTICATION-SERVICE]';

/**
 * Device authentication initialization parameters
 */
export interface DeviceAuthenticationInitParams {
	environmentId: string;
	username?: string;
	userId?: string;
	deviceAuthenticationPolicyId: string;
	deviceId?: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
}

/**
 * Device authentication response
 */
export interface DeviceAuthenticationResponse {
	id: string;
	status: string;
	device: {
		id: string;
		type: string;
	};
	challenge?: {
		id: string;
		type: string;
		expiresAt: number;
		data?: Record<string, unknown>;
	};
	_links?: Record<string, { href: string }>;
}

/**
 * OTP validation parameters
 */
export interface OTPValidationParams {
	environmentId: string;
	username?: string;
	userId?: string;
	deviceAuthenticationId: string;
	otp: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
}

/**
 * OTP validation result
 */
export interface OTPValidationResult {
	isValid: boolean;
	deviceAuthenticationId: string;
	status: string;
	nextAction?: string;
	error?: string;
}

/**
 * Device selection parameters
 */
export interface DeviceSelectionParams {
	environmentId: string;
	username?: string;
	userId?: string;
	deviceAuthenticationPolicyId: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
}

/**
 * Pure device authentication service
 * Handles all device authentication operations without registration logic
 */
export class DeviceAuthenticationService {
	/**
	 * Initialize device authentication
	 * Extracted from MfaAuthenticationServiceV8.initializeDeviceAuthentication
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
			const cleanToken = await DeviceAuthenticationService.getWorkerTokenWithAutoRenew();

			// Read policy to check skipUserLockVerification setting
			let policy: any = null;
			if (params.deviceAuthenticationPolicyId) {
				try {
					const { MFAServiceV8 } = await import('../mfaServiceV8');
					policy = await MFAServiceV8.readDeviceAuthenticationPolicy(
						params.environmentId,
						params.deviceAuthenticationPolicyId
					);
					console.log(`${MODULE_TAG} Policy loaded for lock verification check:`, {
						policyId: params.deviceAuthenticationPolicyId,
						skipUserLockVerification: policy.skipUserLockVerification,
					});
				} catch (error) {
					console.warn(
						`${MODULE_TAG} Failed to read policy for lock verification, continuing:`,
						error
					);
					// Continue without policy - don't fail initialization
				}
			}

			// Get user data for lock verification if needed
			let user: any = null;

			// Check user lock status if policy requires it
			if (policy?.skipUserLockVerification !== true && params.username) {
				try {
					const { MFAServiceV8 } = await import('../mfaServiceV8');
					user = await MFAServiceV8.lookupUserByUsername(params.environmentId, params.username);

					// Check if user is locked
					const isLocked =
						user?.locked === true ||
						user?.account?.locked === true ||
						user?.status === 'LOCKED' ||
						user?.account?.status === 'LOCKED';

					if (isLocked) {
						const errorMessage =
							'User account is locked. Please contact your administrator to unlock your account.';
						console.error(`${MODULE_TAG} User is locked, blocking authentication:`, {
							userId: user.id,
							username: params.username,
							userStatus: user?.status,
							accountStatus: user?.account?.status,
							userLocked: user?.locked,
							accountLocked: user?.account?.locked,
						});
						throw new Error(errorMessage);
					}
				} catch (error) {
					// If lookup fails, let the backend handle it
					console.warn(`${MODULE_TAG} Could not verify user lock status, continuing:`, error);
				}
			} else {
				console.log(
					`${MODULE_TAG} Skipping user lock verification (skipUserLockVerification=true or no username)`
				);
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			// Determine base URL
			const authPath = DeviceAuthenticationService.getAuthBaseUrl(
				params.region,
				params.customDomain
			);
			const actualPingOneUrl = `${authPath}/${params.environmentId}/deviceAuthentications`;

			// Build request body
			const requestBody: Record<string, unknown> = {
				environmentId: params.environmentId,
				deviceAuthenticationPolicyId: params.deviceAuthenticationPolicyId,
				workerToken: cleanToken,
				...(params.username && { username: params.username }),
				...(params.userId && { userId: params.userId }),
				...(params.deviceId && { deviceId: params.deviceId }),
				...(params.region && { region: params.region }),
				...(params.customDomain && { customDomain: params.customDomain }),
			};

			const response = await pingOneFetch(actualPingOneUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			// Track the API call
			apiCallTrackerService.trackCall(
				'POST',
				`/mfa/v1/environments/${params.environmentId}/deviceAuthentications`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Device authentication initialization failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(
					`Device authentication initialization failed: ${response.status} ${response.statusText}`
				);
			}

			const authData = await response.json();
			console.log(`${MODULE_TAG} ✅ Device authentication initialized`, {
				authId: authData.id,
				status: authData.status,
				deviceId: authData.device?.id,
			});

			return authData;
		} catch (error) {
			console.error(`${MODULE_TAG} Error initializing device authentication:`, error);
			throw error;
		}
	}

	/**
	 * Validate OTP for device authentication
	 */
	static async validateOTP(params: OTPValidationParams): Promise<OTPValidationResult> {
		console.log(`${MODULE_TAG} Validating OTP`, {
			deviceAuthenticationId: params.deviceAuthenticationId,
			username: params.username,
		});

		try {
			const cleanToken = await DeviceAuthenticationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			// Determine base URL
			const authPath = DeviceAuthenticationService.getAuthBaseUrl(
				params.region,
				params.customDomain
			);
			const otpCheckUrl = authPath.includes('otp.check')
				? authPath
				: `${authPath}/${params.environmentId}/deviceAuthentications/${params.deviceAuthenticationId}/otp.check`;

			const response = await pingOneFetch(otpCheckUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					otp: params.otp,
					workerToken: cleanToken,
					environmentId: params.environmentId,
					...(params.username && { username: params.username }),
					...(params.userId && { userId: params.userId }),
					...(params.region && { region: params.region }),
					...(params.customDomain && { customDomain: params.customDomain }),
				}),
			});

			// Track the API call
			apiCallTrackerService.trackCall(
				'POST',
				`/mfa/v1/environments/${params.environmentId}/deviceAuthentications/${params.deviceAuthenticationId}/otp.check`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} OTP validation failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});

				return {
					isValid: false,
					deviceAuthenticationId: params.deviceAuthenticationId,
					status: 'OTP_VALIDATION_FAILED',
					error: errorText || 'OTP validation failed',
				};
			}

			const validationResult = await response.json();
			console.log(`${MODULE_TAG} ✅ OTP validation completed`, {
				deviceAuthenticationId: params.deviceAuthenticationId,
				isValid: validationResult.status === 'COMPLETED',
				status: validationResult.status,
			});

			return {
				isValid: validationResult.status === 'COMPLETED',
				deviceAuthenticationId: params.deviceAuthenticationId,
				status: validationResult.status,
				nextAction: validationResult.nextAction,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error validating OTP:`, error);

			return {
				isValid: false,
				deviceAuthenticationId: params.deviceAuthenticationId,
				status: 'OTP_VALIDATION_ERROR',
				error: error instanceof Error ? error.message : 'Unknown OTP validation error',
			};
		}
	}

	/**
	 * Poll authentication status
	 */
	static async pollAuthenticationStatus(
		pollUrl: string,
		_region?: 'us' | 'eu' | 'ap' | 'ca',
		_customDomain?: string
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Polling authentication status`, { pollUrl });

		try {
			const cleanToken = await DeviceAuthenticationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			const response = await pingOneFetch(pollUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${cleanToken}`,
				},
			});

			// Track the API call
			apiCallTrackerService.trackCall(
				'GET',
				pollUrl.replace(/https?:\/\/[^/]+/, ''),
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Authentication status poll failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(
					`Authentication status poll failed: ${response.status} ${response.statusText}`
				);
			}

			const statusData = await response.json();
			console.log(`${MODULE_TAG} ✅ Authentication status retrieved`, {
				authId: statusData.id,
				status: statusData.status,
			});

			return statusData;
		} catch (error) {
			console.error(`${MODULE_TAG} Error polling authentication status:`, error);
			throw error;
		}
	}

	/**
	 * Complete device authentication
	 */
	static async completeAuthentication(
		deviceAuthenticationId: string,
		environmentId: string,
		region?: 'us' | 'eu' | 'ap' | 'ca',
		customDomain?: string
	): Promise<DeviceAuthenticationResponse> {
		console.log(`${MODULE_TAG} Completing device authentication`, {
			deviceAuthenticationId,
		});

		try {
			const cleanToken = await DeviceAuthenticationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			// Determine base URL
			const authPath = DeviceAuthenticationService.getAuthBaseUrl(region, customDomain);
			const completeUrl = `${authPath}/${environmentId}/deviceAuthentications/${deviceAuthenticationId}/complete`;

			const response = await pingOneFetch(completeUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					workerToken: cleanToken,
					environmentId,
				}),
			});

			// Track the API call
			apiCallTrackerService.trackCall(
				'POST',
				`/mfa/v1/environments/${environmentId}/deviceAuthentications/${deviceAuthenticationId}/complete`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Authentication completion failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(
					`Authentication completion failed: ${response.status} ${response.statusText}`
				);
			}

			const completionData = await response.json();
			console.log(`${MODULE_TAG} ✅ Device authentication completed`, {
				deviceAuthenticationId,
				status: completionData.status,
			});

			return completionData;
		} catch (error) {
			console.error(`${MODULE_TAG} Error completing device authentication:`, error);
			throw error;
		}
	}

	/**
	 * Cancel device authentication
	 */
	static async cancelDeviceAuthentication(
		deviceAuthenticationId: string,
		environmentId: string,
		region?: 'us' | 'eu' | 'ap' | 'ca',
		customDomain?: string
	): Promise<void> {
		console.log(`${MODULE_TAG} Canceling device authentication`, {
			deviceAuthenticationId,
		});

		try {
			const cleanToken = await DeviceAuthenticationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			// Determine base URL
			const authPath = DeviceAuthenticationService.getAuthBaseUrl(region, customDomain);
			const cancelUrl = `${authPath}/${environmentId}/deviceAuthentications/${deviceAuthenticationId}/cancel`;

			const response = await pingOneFetch(cancelUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					workerToken: cleanToken,
					environmentId,
				}),
			});

			// Track the API call
			apiCallTrackerService.trackCall(
				'POST',
				`/mfa/v1/environments/${environmentId}/deviceAuthentications/${deviceAuthenticationId}/cancel`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Authentication cancellation failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(
					`Authentication cancellation failed: ${response.status} ${response.statusText}`
				);
			}

			console.log(`${MODULE_TAG} ✅ Device authentication canceled`, {
				deviceAuthenticationId,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Error canceling device authentication:`, error);
			throw error;
		}
	}

	/**
	 * Get available devices for authentication
	 */
	static async getAvailableDevices(params: DeviceSelectionParams): Promise<MFADevice[]> {
		console.log(`${MODULE_TAG} Getting available devices`, {
			username: params.username,
			policyId: params.deviceAuthenticationPolicyId,
		});

		try {
			// Initialize authentication to get available devices
			const authResponse = await DeviceAuthenticationService.initializeDeviceAuthentication({
				...params,
				deviceId: undefined, // Don't specify device to get all available
			});

			// Extract devices from response
			const devices: MFADevice[] = [];

			if (authResponse.device) {
				devices.push({
					id: authResponse.device.id,
					type: authResponse.device.type as any,
					name: authResponse.device.type,
					status: 'ACTIVE',
					capabilities: [authResponse.device.type],
				});
			}

			console.log(`${MODULE_TAG} ✅ Retrieved available devices`, {
				deviceCount: devices.length,
			});

			return devices;
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting available devices:`, error);
			throw error;
		}
	}

	/**
	 * Get authentication base URL
	 * Extracted from MfaAuthenticationServiceV8
	 */
	private static getAuthBaseUrl(region?: 'us' | 'eu' | 'ap' | 'ca', customDomain?: string): string {
		if (customDomain) {
			return `https://${customDomain}/mfa/v1/environments`;
		}

		const regionMap: Record<string, string> = {
			us: 'https://auth.pingone.com/mfa/v1/environments',
			eu: 'https://auth.pingone.eu/mfa/v1/environments',
			ap: 'https://auth.pingone.asia/mfa/v1/environments',
			ca: 'https://auth.pingone.ca/mfa/v1/environments',
		};

		return regionMap[region || 'us'];
	}

	/**
	 * Get worker token with auto-renew functionality
	 * Extracted from MfaAuthenticationServiceV8
	 */
	private static async getWorkerTokenWithAutoRenew(): Promise<string> {
		try {
			// Import worker token service
			const { workerTokenServiceV8 } = await import('../workerTokenServiceV8');

			// Get current worker token
			const tokenStatus = await workerTokenServiceV8.getTokenStatus();

			if (!tokenStatus.isValid || !tokenStatus.token) {
				console.log(`${MODULE_TAG} Worker token invalid or missing, refreshing...`);
				await workerTokenServiceV8.refreshToken();
				const newStatus = await workerTokenServiceV8.getTokenStatus();

				if (!newStatus.isValid || !newStatus.token) {
					throw new Error('Failed to obtain valid worker token');
				}

				return newStatus.token;
			}

			console.log(`${MODULE_TAG} Using existing valid worker token`);
			return tokenStatus.token;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get worker token:`, error);
			throw new Error(
				`Worker token error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Check FIDO2 assertion
	 */
	static async checkFIDO2Assertion(
		deviceAuthenticationId: string,
		assertionData: Record<string, unknown>,
		environmentId: string,
		region?: 'us' | 'eu' | 'ap' | 'ca',
		customDomain?: string
	): Promise<OTPValidationResult> {
		console.log(`${MODULE_TAG} Checking FIDO2 assertion`, {
			deviceAuthenticationId,
		});

		try {
			const cleanToken = await DeviceAuthenticationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			// Determine base URL
			const authPath = DeviceAuthenticationService.getAuthBaseUrl(region, customDomain);
			const fido2Url = `${authPath}/${environmentId}/deviceAuthentications/${deviceAuthenticationId}/fido2.assertion`;

			const response = await pingOneFetch(fido2Url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					assertion: assertionData,
					workerToken: cleanToken,
					environmentId,
				}),
			});

			// Track the API call
			apiCallTrackerService.trackCall(
				'POST',
				`/mfa/v1/environments/${environmentId}/deviceAuthentications/${deviceAuthenticationId}/fido2.assertion`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} FIDO2 assertion check failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});

				return {
					isValid: false,
					deviceAuthenticationId,
					status: 'FIDO2_ASSERTION_FAILED',
					error: errorText || 'FIDO2 assertion verification failed',
				};
			}

			const validationResult = await response.json();
			console.log(`${MODULE_TAG} ✅ FIDO2 assertion verified`, {
				deviceAuthenticationId,
				status: validationResult.status,
			});

			return {
				isValid: validationResult.status === 'COMPLETED',
				deviceAuthenticationId,
				status: validationResult.status,
				nextAction: validationResult.nextAction,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error checking FIDO2 assertion:`, error);

			return {
				isValid: false,
				deviceAuthenticationId,
				status: 'FIDO2_ASSERTION_ERROR',
				error: error instanceof Error ? error.message : 'Unknown FIDO2 assertion error',
			};
		}
	}
}
