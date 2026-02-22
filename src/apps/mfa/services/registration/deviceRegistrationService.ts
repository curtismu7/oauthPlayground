/**
 * @file deviceRegistrationService.ts
 * @module apps/mfa/services/registration
 * @description Pure device registration service - extracted from MfaAuthenticationServiceV8
 * @version 8.0.0
 * @since 2026-02-20
 *
 * This service handles ONLY device registration operations.
 * Authentication operations are handled by the separate DeviceAuthenticationService.
 */

import type { DeviceConfigKey, DeviceRegistrationData } from '@/apps/mfa/types/mfaFlowTypes';
import { pingOneFetch } from '@/utils/pingOneFetch';

const MODULE_TAG = '[📝 DEVICE-REGISTRATION-SERVICE]';

/**
 * Device registration parameters
 */
export interface RegisterDeviceParams {
	type: DeviceConfigKey;
	environmentId: string;
	username: string;
	phone?: string;
	email?: string;
	name?: string;
	nickname?: string;
	status?: 'ACTIVE' | 'INACTIVE';
	notification?: Record<string, unknown>;
	tokenType?: 'worker' | 'user';
	userToken?: string;
}

/**
 * Device registration result
 */
export interface DeviceRegistrationResult {
	deviceId: string;
	userId: string;
	status: string;
	type: DeviceConfigKey;
	phone?: string;
	email?: string;
	nickname?: string;
	environmentId: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Device validation parameters
 */
export interface ValidateDeviceParams {
	environmentId: string;
	username: string;
	deviceId: string;
	validationCode?: string;
	validationData?: Record<string, unknown>;
}

/**
 * Device validation result
 */
export interface DeviceValidationResult {
	isValid: boolean;
	deviceId: string;
	status: string;
	validationErrors?: string[];
	validationWarnings?: string[];
}

/**
 * Pure device registration service
 * Handles all device registration operations without authentication logic
 */
export class DeviceRegistrationService {
	/**
	 * Register a new MFA device
	 * Extracted from MfaAuthenticationServiceV8.registerDevice
	 */
	static async registerDevice(params: RegisterDeviceParams): Promise<DeviceRegistrationResult> {
		console.log(`${MODULE_TAG} Registering ${params.type} device`, {
			username: params.username,
			type: params.type,
			hasPhone: !!params.phone,
			hasEmail: !!params.email,
		});

		try {
			// Get appropriate token based on tokenType
			let accessToken: string;
			if (params.tokenType === 'user' && params.userToken) {
				accessToken = params.userToken;
				console.log(`${MODULE_TAG} Using provided user token for device registration`);
			} else {
				// Use worker token by default
				accessToken = await DeviceRegistrationService.getWorkerTokenWithAutoRenew();
				console.log(`${MODULE_TAG} Using worker token for device registration`);
			}

			// Build device registration request
			const requestBody: Record<string, unknown> = {
				type: params.type,
				...(params.phone && { phone: params.phone }),
				...(params.email && { email: params.email }),
				...(params.name && { name: params.name }),
				...(params.nickname && { nickname: params.nickname }),
				...(params.status && { status: params.status }),
				...(params.notification && { notification: params.notification }),
			};

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const _startTime = Date.now();

			// Make API call to register device
			const response = await pingOneFetch(
				`https://api.pingone.com/v1/environments/${params.environmentId}/users/${params.username}/devices`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify(requestBody),
				}
			);

			// Track the API call
			apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: `/v1/environments/${params.environmentId}/users/${params.username}/devices`,
				response: {
					status: response.status,
					statusText: response.statusText,
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Device registration failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(`Device registration failed: ${response.status} ${response.statusText}`);
			}

			const deviceData = await response.json();
			console.log(`${MODULE_TAG} ✅ Device registered successfully`, {
				deviceId: deviceData.id,
				type: deviceData.type,
				status: deviceData.status,
			});

			// Transform response to match expected interface
			return {
				deviceId: deviceData.id,
				userId: deviceData.user?.id || params.username,
				status: deviceData.status,
				type: deviceData.type,
				phone: deviceData.phone,
				email: deviceData.email,
				nickname: deviceData.nickname,
				environmentId: params.environmentId,
				createdAt: deviceData.createdAt,
				updatedAt: deviceData.updatedAt,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error registering device:`, error);
			throw error;
		}
	}

	/**
	 * Validate a registered device
	 * Handles device validation after registration
	 */
	static async validateDevice(params: ValidateDeviceParams): Promise<DeviceValidationResult> {
		console.log(`${MODULE_TAG} Validating device`, {
			deviceId: params.deviceId,
			username: params.username,
			hasValidationCode: !!params.validationCode,
		});

		try {
			const accessToken = await DeviceRegistrationService.getWorkerTokenWithAutoRenew();

			// Build validation request
			const requestBody: Record<string, unknown> = {
				...(params.validationCode && { validationCode: params.validationCode }),
				...(params.validationData && { validationData: params.validationData }),
			};

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			const response = await pingOneFetch(
				`https://api.pingone.com/v1/environments/${params.environmentId}/users/${params.username}/devices/${params.deviceId}/validate`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify(requestBody),
				}
			);

			// Track the API call
			apiCallTrackerService.trackCall(
				'POST',
				`/v1/environments/${params.environmentId}/users/${params.username}/devices/${params.deviceId}/validate`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Device validation failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});

				return {
					isValid: false,
					deviceId: params.deviceId,
					status: 'VALIDATION_FAILED',
					validationErrors: [errorText || 'Validation failed'],
				};
			}

			const validationResult = await response.json();
			console.log(`${MODULE_TAG} ✅ Device validation completed`, {
				deviceId: params.deviceId,
				isValid: validationResult.isValid,
				status: validationResult.status,
			});

			return {
				isValid: validationResult.isValid || false,
				deviceId: params.deviceId,
				status: validationResult.status || 'VALIDATED',
				validationErrors: validationResult.errors || [],
				validationWarnings: validationResult.warnings || [],
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error validating device:`, error);

			return {
				isValid: false,
				deviceId: params.deviceId,
				status: 'VALIDATION_ERROR',
				validationErrors: [error instanceof Error ? error.message : 'Unknown validation error'],
			};
		}
	}

	/**
	 * Get registered devices for a user
	 */
	static async getUserDevices(
		environmentId: string,
		username: string
	): Promise<DeviceRegistrationResult[]> {
		console.log(`${MODULE_TAG} Getting devices for user`, { username });

		try {
			const accessToken = await DeviceRegistrationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			const response = await pingOneFetch(
				`https://api.pingone.com/v1/environments/${environmentId}/users/${username}/devices`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			// Track the API call
			apiCallTrackerService.trackCall(
				'GET',
				`/v1/environments/${environmentId}/users/${username}/devices`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Failed to get user devices:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(`Failed to get user devices: ${response.status} ${response.statusText}`);
			}

			const devicesData = await response.json();
			const devices = devicesData.devices || devicesData; // Handle different response formats

			console.log(`${MODULE_TAG} ✅ Retrieved user devices`, {
				deviceCount: Array.isArray(devices) ? devices.length : 0,
			});

			// Transform devices to match expected interface
			return (Array.isArray(devices) ? devices : []).map((device: any) => ({
				deviceId: device.id,
				userId: device.user?.id || username,
				status: device.status,
				type: device.type,
				phone: device.phone,
				email: device.email,
				nickname: device.nickname,
				environmentId,
				createdAt: device.createdAt,
				updatedAt: device.updatedAt,
			}));
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting user devices:`, error);
			throw error;
		}
	}

	/**
	 * Update device registration
	 */
	static async updateDevice(
		environmentId: string,
		username: string,
		deviceId: string,
		updateData: Partial<DeviceRegistrationData>
	): Promise<DeviceRegistrationResult> {
		console.log(`${MODULE_TAG} Updating device`, {
			deviceId,
			username,
			updateFields: Object.keys(updateData),
		});

		try {
			const accessToken = await DeviceRegistrationService.getWorkerTokenWithAutoRenew();

			// Build update request (only include allowed fields)
			const requestBody: Record<string, unknown> = {};
			if (updateData.name !== undefined) requestBody.name = updateData.name;
			if (updateData.nickname !== undefined) requestBody.nickname = updateData.nickname;
			if (updateData.status !== undefined) requestBody.status = updateData.status;
			if (updateData.notification !== undefined) requestBody.notification = updateData.notification;

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			const response = await pingOneFetch(
				`https://api.pingone.com/v1/environments/${environmentId}/users/${username}/devices/${deviceId}`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify(requestBody),
				}
			);

			// Track the API call
			apiCallTrackerService.trackCall(
				'PATCH',
				`/v1/environments/${environmentId}/users/${username}/devices/${deviceId}`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Device update failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(`Device update failed: ${response.status} ${response.statusText}`);
			}

			const deviceData = await response.json();
			console.log(`${MODULE_TAG} ✅ Device updated successfully`, {
				deviceId: deviceData.id,
				status: deviceData.status,
			});

			return {
				deviceId: deviceData.id,
				userId: deviceData.user?.id || username,
				status: deviceData.status,
				type: deviceData.type,
				phone: deviceData.phone,
				email: deviceData.email,
				nickname: deviceData.nickname,
				environmentId,
				createdAt: deviceData.createdAt,
				updatedAt: deviceData.updatedAt,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error updating device:`, error);
			throw error;
		}
	}

	/**
	 * Delete device registration
	 */
	static async deleteDevice(
		environmentId: string,
		username: string,
		deviceId: string
	): Promise<void> {
		console.log(`${MODULE_TAG} Deleting device`, { deviceId, username });

		try {
			const accessToken = await DeviceRegistrationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			const response = await pingOneFetch(
				`https://api.pingone.com/v1/environments/${environmentId}/users/${username}/devices/${deviceId}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			// Track the API call
			apiCallTrackerService.trackCall(
				'DELETE',
				`/v1/environments/${environmentId}/users/${username}/devices/${deviceId}`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Device deletion failed:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(`Device deletion failed: ${response.status} ${response.statusText}`);
			}

			console.log(`${MODULE_TAG} ✅ Device deleted successfully`, { deviceId });
		} catch (error) {
			console.error(`${MODULE_TAG} Error deleting device:`, error);
			throw error;
		}
	}

	/**
	 * Get worker token with auto-renew functionality
	 * Extracted from MfaAuthenticationServiceV8
	 */
	private static async getWorkerTokenWithAutoRenew(): Promise<string> {
		try {
			// Import worker token service
			const { workerTokenServiceV8 } = await import('./workerTokenServiceV8');

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
	 * Get device registration status
	 */
	static async getDeviceStatus(
		environmentId: string,
		username: string,
		deviceId: string
	): Promise<DeviceRegistrationResult> {
		console.log(`${MODULE_TAG} Getting device status`, { deviceId, username });

		try {
			const accessToken = await DeviceRegistrationService.getWorkerTokenWithAutoRenew();

			// Track API call
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			const response = await pingOneFetch(
				`https://api.pingone.com/v1/environments/${environmentId}/users/${username}/devices/${deviceId}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			// Track the API call
			apiCallTrackerService.trackCall(
				'GET',
				`/v1/environments/${environmentId}/users/${username}/devices/${deviceId}`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`${MODULE_TAG} Failed to get device status:`, {
					status: response.status,
					statusText: response.statusText,
					error: errorText,
				});
				throw new Error(`Failed to get device status: ${response.status} ${response.statusText}`);
			}

			const deviceData = await response.json();
			console.log(`${MODULE_TAG} ✅ Retrieved device status`, {
				deviceId: deviceData.id,
				status: deviceData.status,
			});

			return {
				deviceId: deviceData.id,
				userId: deviceData.user?.id || username,
				status: deviceData.status,
				type: deviceData.type,
				phone: deviceData.phone,
				email: deviceData.email,
				nickname: deviceData.nickname,
				environmentId,
				createdAt: deviceData.createdAt,
				updatedAt: deviceData.updatedAt,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting device status:`, error);
			throw error;
		}
	}
}
