// src/services/deviceManagementService.ts
// Device Management Service for MFA Devices

import { logger } from '../utils/logger';
import PingOneMfaService, { type MfaCredentials, type MfaDevice } from './pingOneMfaService';

export interface DeviceManagementOptions {
	allowRename: boolean;
	allowDelete: boolean;
	allowActivation: boolean;
	allowDeactivation: boolean;
	requireConfirmation: boolean;
	maxDevicesPerType: Record<string, number>;
}

export interface DeviceUpdateRequest {
	deviceId: string;
	nickname?: string;
	isActive?: boolean;
	metadata?: Record<string, any>;
}

export interface DeviceRegistrationRequest {
	type: MfaDevice['type'];
	nickname?: string;
	contactInfo?: {
		phoneNumber?: string;
		emailAddress?: string;
	};
	metadata?: Record<string, any>;
}

export interface DeviceManagementResult {
	success: boolean;
	device?: MfaDevice;
	error?: string;
	requiresVerification?: boolean;
	verificationChallenge?: any;
}

export interface DeviceUsageStats {
	deviceId: string;
	totalUses: number;
	lastUsed?: Date;
	successRate: number;
	averageResponseTime: number;
	recentActivity: Array<{
		timestamp: Date;
		success: boolean;
		duration?: number;
	}>;
}

class DeviceManagementService {
	private static deviceUsage = new Map<string, DeviceUsageStats>();
	private static readonly DEFAULT_OPTIONS: DeviceManagementOptions = {
		allowRename: true,
		allowDelete: true,
		allowActivation: true,
		allowDeactivation: true,
		requireConfirmation: true,
		maxDevicesPerType: {
			SMS: 3,
			EMAIL: 3,
			TOTP: 5,
			FIDO2: 10,
			MOBILE: 3,
			VOICE: 2,
		},
	};

	/**
	 * Get all devices for a user with management options
	 */
	static async getUserDevicesWithManagement(
		credentials: MfaCredentials,
		options?: Partial<DeviceManagementOptions>
	): Promise<{
		devices: (MfaDevice & {
			canRename: boolean;
			canDelete: boolean;
			canActivate: boolean;
			canDeactivate: boolean;
			usageStats?: DeviceUsageStats;
		})[];
		options: DeviceManagementOptions;
		summary: {
			totalDevices: number;
			activeDevices: number;
			devicesByType: Record<string, number>;
			canAddMore: Record<string, boolean>;
		};
	}> {
		try {
			const managementOptions = { ...DeviceManagementService.DEFAULT_OPTIONS, ...options };

			// Get user's devices
			const devices = await PingOneMfaService.getRegisteredDevices(credentials);

			// Add management capabilities to each device
			const devicesWithManagement = devices.map((device) => {
				const usageStats = DeviceManagementService.deviceUsage.get(device.id);

				return {
					...device,
					canRename: managementOptions.allowRename && device.status === 'ACTIVE',
					canDelete: managementOptions.allowDelete && devices.length > 1, // Keep at least one device
					canActivate: managementOptions.allowActivation && device.status !== 'ACTIVE',
					canDeactivate:
						managementOptions.allowDeactivation &&
						device.status === 'ACTIVE' &&
						devices.filter((d) => d.status === 'ACTIVE').length > 1,
					usageStats,
				};
			});

			// Calculate summary
			const totalDevices = devices.length;
			const activeDevices = devices.filter((d) => d.status === 'ACTIVE').length;

			const devicesByType: Record<string, number> = {};
			const canAddMore: Record<string, boolean> = {};

			devices.forEach((device) => {
				devicesByType[device.type] = (devicesByType[device.type] || 0) + 1;
			});

			Object.keys(managementOptions.maxDevicesPerType).forEach((type) => {
				const currentCount = devicesByType[type] || 0;
				const maxAllowed = managementOptions.maxDevicesPerType[type];
				canAddMore[type] = currentCount < maxAllowed;
			});

			logger.info('DeviceManagementService', 'Retrieved user devices with management options', {
				userId: credentials.userId,
				totalDevices,
				activeDevices,
				devicesByType,
			});

			return {
				devices: devicesWithManagement,
				options: managementOptions,
				summary: {
					totalDevices,
					activeDevices,
					devicesByType,
					canAddMore,
				},
			};
		} catch (error) {
			logger.error('DeviceManagementService', 'Failed to get user devices with management', {
				userId: credentials.userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Register a new device
	 */
	static async registerNewDevice(
		credentials: MfaCredentials,
		request: DeviceRegistrationRequest,
		options?: Partial<DeviceManagementOptions>
	): Promise<DeviceManagementResult> {
		try {
			const managementOptions = { ...DeviceManagementService.DEFAULT_OPTIONS, ...options };

			// Check if user can add more devices of this type
			const currentDevices = await PingOneMfaService.getRegisteredDevices(credentials);
			const currentTypeCount = currentDevices.filter((d) => d.type === request.type).length;
			const maxAllowed = managementOptions.maxDevicesPerType[request.type] || 10;

			if (currentTypeCount >= maxAllowed) {
				return {
					success: false,
					error: `Maximum number of ${request.type} devices reached (${maxAllowed})`,
				};
			}

			// Register the device based on type
			let device: MfaDevice;

			switch (request.type) {
				case 'SMS':
					if (!request.contactInfo?.phoneNumber) {
						return {
							success: false,
							error: 'Phone number is required for SMS device registration',
						};
					}
					device = await PingOneMfaService.registerSMSDevice(
						credentials,
						request.contactInfo.phoneNumber,
						request.nickname
					);
					break;

				case 'EMAIL':
					if (!request.contactInfo?.emailAddress) {
						return {
							success: false,
							error: 'Email address is required for email device registration',
						};
					}
					device = await PingOneMfaService.registerEmailDevice(
						credentials,
						request.contactInfo.emailAddress,
						request.nickname
					);
					break;

				case 'TOTP':
					device = await PingOneMfaService.registerTOTPDevice(credentials, request.nickname);
					break;

				case 'FIDO2':
					// FIDO2 registration requires WebAuthn ceremony
					return {
						success: false,
						requiresVerification: true,
						error: 'FIDO2 device registration requires WebAuthn verification',
					};

				default:
					return {
						success: false,
						error: `Unsupported device type: ${request.type}`,
					};
			}

			// Initialize usage tracking
			DeviceManagementService.initializeDeviceUsage(device.id);

			logger.info('DeviceManagementService', 'New device registered successfully', {
				userId: credentials.userId,
				deviceId: device.id,
				deviceType: device.type,
				nickname: device.nickname,
			});

			return {
				success: true,
				device,
			};
		} catch (error) {
			logger.error('DeviceManagementService', 'Device registration failed', {
				userId: credentials.userId,
				deviceType: request.type,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				error: `Device registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Update device properties
	 */
	static async updateDevice(
		credentials: MfaCredentials,
		request: DeviceUpdateRequest,
		options?: Partial<DeviceManagementOptions>
	): Promise<DeviceManagementResult> {
		try {
			const managementOptions = { ...DeviceManagementService.DEFAULT_OPTIONS, ...options };

			// Get current device
			const devices = await PingOneMfaService.getRegisteredDevices(credentials);
			const device = devices.find((d) => d.id === request.deviceId);

			if (!device) {
				return {
					success: false,
					error: 'Device not found',
				};
			}

			// Check permissions
			if (request.nickname !== undefined && !managementOptions.allowRename) {
				return {
					success: false,
					error: 'Device renaming is not allowed',
				};
			}

			if (request.isActive !== undefined) {
				if (request.isActive && !managementOptions.allowActivation) {
					return {
						success: false,
						error: 'Device activation is not allowed',
					};
				}

				if (!request.isActive && !managementOptions.allowDeactivation) {
					return {
						success: false,
						error: 'Device deactivation is not allowed',
					};
				}

				// Ensure at least one device remains active
				if (!request.isActive) {
					const activeDevices = devices.filter(
						(d) => d.status === 'ACTIVE' && d.id !== request.deviceId
					);
					if (activeDevices.length === 0) {
						return {
							success: false,
							error: 'Cannot deactivate the last active device',
						};
					}
				}
			}

			// Update device (mock implementation - in real app, call PingOne API)
			const updatedDevice: MfaDevice = {
				...device,
				nickname: request.nickname !== undefined ? request.nickname : device.nickname,
				status:
					request.isActive !== undefined
						? request.isActive
							? 'ACTIVE'
							: 'BLOCKED'
						: device.status,
				lastModified: new Date(),
			};

			logger.info('DeviceManagementService', 'Device updated successfully', {
				userId: credentials.userId,
				deviceId: request.deviceId,
				changes: request,
			});

			return {
				success: true,
				device: updatedDevice,
			};
		} catch (error) {
			logger.error('DeviceManagementService', 'Device update failed', {
				userId: credentials.userId,
				deviceId: request.deviceId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				error: `Device update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Delete a device
	 */
	static async deleteDevice(
		credentials: MfaCredentials,
		deviceId: string,
		options?: Partial<DeviceManagementOptions>
	): Promise<DeviceManagementResult> {
		try {
			const managementOptions = { ...DeviceManagementService.DEFAULT_OPTIONS, ...options };

			if (!managementOptions.allowDelete) {
				return {
					success: false,
					error: 'Device deletion is not allowed',
				};
			}

			// Get current devices
			const devices = await PingOneMfaService.getRegisteredDevices(credentials);
			const device = devices.find((d) => d.id === deviceId);

			if (!device) {
				return {
					success: false,
					error: 'Device not found',
				};
			}

			// Ensure at least one device remains
			if (devices.length <= 1) {
				return {
					success: false,
					error: 'Cannot delete the last remaining device',
				};
			}

			// Delete device (mock implementation - in real app, call PingOne API)
			// await PingOneMfaService.deleteDevice(credentials, deviceId);

			// Clean up usage tracking
			DeviceManagementService.deviceUsage.delete(deviceId);

			logger.info('DeviceManagementService', 'Device deleted successfully', {
				userId: credentials.userId,
				deviceId,
				deviceType: device.type,
			});

			return {
				success: true,
				device,
			};
		} catch (error) {
			logger.error('DeviceManagementService', 'Device deletion failed', {
				userId: credentials.userId,
				deviceId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				error: `Device deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Get device usage statistics
	 */
	static getDeviceUsageStats(deviceId: string): DeviceUsageStats | null {
		return DeviceManagementService.deviceUsage.get(deviceId) || null;
	}

	/**
	 * Record device usage
	 */
	static recordDeviceUsage(deviceId: string, success: boolean, duration?: number): void {
		const stats =
			DeviceManagementService.deviceUsage.get(deviceId) ||
			DeviceManagementService.initializeDeviceUsage(deviceId);

		stats.totalUses++;
		stats.lastUsed = new Date();

		// Update success rate
		const recentActivity = stats.recentActivity;
		recentActivity.push({
			timestamp: new Date(),
			success,
			duration,
		});

		// Keep only last 100 activities
		if (recentActivity.length > 100) {
			recentActivity.splice(0, recentActivity.length - 100);
		}

		// Recalculate success rate
		const successfulUses = recentActivity.filter((a) => a.success).length;
		stats.successRate =
			recentActivity.length > 0 ? (successfulUses / recentActivity.length) * 100 : 0;

		// Recalculate average response time
		const activitiesWithDuration = recentActivity.filter((a) => a.duration !== undefined);
		if (activitiesWithDuration.length > 0) {
			stats.averageResponseTime =
				activitiesWithDuration.reduce((sum, a) => sum + (a.duration || 0), 0) /
				activitiesWithDuration.length;
		}

		DeviceManagementService.deviceUsage.set(deviceId, stats);
	}

	/**
	 * Get device management recommendations
	 */
	static getDeviceRecommendations(
		_credentials: MfaCredentials,
		devices: MfaDevice[]
	): Array<{
		type: 'add_device' | 'remove_device' | 'activate_device' | 'update_device';
		priority: 'high' | 'medium' | 'low';
		title: string;
		description: string;
		deviceId?: string;
		suggestedAction?: any;
	}> {
		const recommendations: Array<{
			type: 'add_device' | 'remove_device' | 'activate_device' | 'update_device';
			priority: 'high' | 'medium' | 'low';
			title: string;
			description: string;
			deviceId?: string;
			suggestedAction?: any;
		}> = [];

		const activeDevices = devices.filter((d) => d.status === 'ACTIVE');
		const devicesByType = devices.reduce(
			(acc, device) => {
				acc[device.type] = (acc[device.type] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// Recommend adding backup devices if only one active
		if (activeDevices.length === 1) {
			recommendations.push({
				type: 'add_device',
				priority: 'high',
				title: 'Add Backup Authentication Method',
				description:
					'Having only one authentication method is risky. Consider adding a backup device.',
				suggestedAction: {
					deviceType: activeDevices[0].type === 'SMS' ? 'TOTP' : 'SMS',
				},
			});
		}

		// Recommend TOTP if user only has SMS/Email
		if (!devicesByType['TOTP'] && (devicesByType['SMS'] || devicesByType['EMAIL'])) {
			recommendations.push({
				type: 'add_device',
				priority: 'medium',
				title: 'Add Authenticator App',
				description: 'Authenticator apps provide better security than SMS or email.',
				suggestedAction: {
					deviceType: 'TOTP',
				},
			});
		}

		// Recommend FIDO2 for enhanced security
		if (!devicesByType['FIDO2']) {
			recommendations.push({
				type: 'add_device',
				priority: 'low',
				title: 'Consider Security Key',
				description: 'Security keys provide the highest level of protection against phishing.',
				suggestedAction: {
					deviceType: 'FIDO2',
				},
			});
		}

		// Check for unused devices
		devices.forEach((device) => {
			const stats = DeviceManagementService.deviceUsage.get(device.id);
			if (stats?.lastUsed) {
				const daysSinceLastUse = (Date.now() - stats.lastUsed.getTime()) / (1000 * 60 * 60 * 24);

				if (daysSinceLastUse > 90 && activeDevices.length > 1) {
					recommendations.push({
						type: 'remove_device',
						priority: 'low',
						title: 'Remove Unused Device',
						description: `${device.nickname || device.deviceName} hasn't been used in ${Math.floor(daysSinceLastUse)} days.`,
						deviceId: device.id,
					});
				}
			}
		});

		// Check for devices needing activation
		devices.forEach((device) => {
			if (device.status === 'PENDING_ACTIVATION' || device.status === 'ACTIVATION_REQUIRED') {
				recommendations.push({
					type: 'activate_device',
					priority: 'medium',
					title: 'Complete Device Setup',
					description: `${device.nickname || device.deviceName} needs to be activated.`,
					deviceId: device.id,
				});
			}
		});

		return recommendations.sort((a, b) => {
			const priorityOrder = { high: 3, medium: 2, low: 1 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
	}

	/**
	 * Clean up old usage data
	 */
	static cleanupUsageData(): void {
		const now = new Date();
		const cleanupThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days

		for (const [deviceId, stats] of DeviceManagementService.deviceUsage.entries()) {
			// Clean old activity records
			stats.recentActivity = stats.recentActivity.filter(
				(activity) => now.getTime() - activity.timestamp.getTime() < cleanupThreshold
			);

			// Remove stats for devices with no recent activity
			if (
				stats.recentActivity.length === 0 &&
				stats.lastUsed &&
				now.getTime() - stats.lastUsed.getTime() > cleanupThreshold
			) {
				DeviceManagementService.deviceUsage.delete(deviceId);
			} else {
				DeviceManagementService.deviceUsage.set(deviceId, stats);
			}
		}

		logger.info('DeviceManagementService', 'Usage data cleanup completed', {
			remainingDevices: DeviceManagementService.deviceUsage.size,
		});
	}

	// Private helper methods

	private static initializeDeviceUsage(deviceId: string): DeviceUsageStats {
		const stats: DeviceUsageStats = {
			deviceId,
			totalUses: 0,
			successRate: 0,
			averageResponseTime: 0,
			recentActivity: [],
		};

		DeviceManagementService.deviceUsage.set(deviceId, stats);
		return stats;
	}
}

export default DeviceManagementService;
