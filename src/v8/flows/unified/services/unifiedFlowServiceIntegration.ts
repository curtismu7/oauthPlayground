/**
 * @file unifiedFlowServiceIntegration.ts
 * @module v8/flows/unified/services
 * @description Service integration layer for Unified MFA Flow - Leverages existing V8 services
 * @version 9.2.0
 */

import type { DeviceConfigKey } from '@/v8/config/deviceFlowConfigTypes';
import type { MFACredentials } from '@/v8/flows/shared/MFATypes';
import { globalEnvironmentService } from '@/v8/services/globalEnvironmentService';
import { globalWorkerTokenService } from '@/v8/services/globalWorkerTokenService';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';

/**
 * Unified Flow Service Integration
 *
 * Integrates Unified MFA Flow with existing V8 services:
 * - Uses global Environment ID (no redundant inputs)
 * - Uses global Worker Token (automatic refresh)
 * - Leverages MFAServiceV8 (static methods for MFA operations)
 */
export class UnifiedFlowServiceIntegration {
	/**
	 * Build MFA credentials from global services
	 */
	private async buildCredentials(username: string, clientId?: string): Promise<MFACredentials> {
		const environmentId = globalEnvironmentService.getEnvironmentId();

		if (!environmentId) {
			throw new Error('Environment ID not configured. Please configure global settings first.');
		}

		return {
			environmentId,
			clientId: clientId || '',
			username,
			tokenType: 'worker',
		};
	}

	/**
	 * Register a new MFA device
	 */
	async registerDevice(
		username: string,
		deviceType: DeviceConfigKey,
		deviceData: {
			phoneNumber?: string;
			email?: string;
			name?: string;
		}
	): Promise<{
		deviceId: string;
		status: string;
		qrCode?: string;
	}> {
		console.log('[UnifiedFlowServiceIntegration] Registering device:', {
			deviceType,
			username,
			deviceData,
		});

		const credentials = await this.buildCredentials(username);

		// Use MFAServiceV8.registerDevice
		const result = await MFAServiceV8.registerDevice({
			...credentials,
			type: deviceType as any,
			phoneNumber: deviceData.phoneNumber,
			email: deviceData.email,
			name: deviceData.name || `${deviceType} Device`,
		});

		return {
			deviceId: result.deviceId,
			status: result.status || 'PENDING',
			qrCode: result.qrCode,
		};
	}

	/**
	 * Activate an MFA device with OTP code
	 */
	async activateDevice(
		username: string,
		deviceId: string,
		otpCode: string
	): Promise<{
		success: boolean;
		status: string;
	}> {
		console.log('[UnifiedFlowServiceIntegration] Activating device:', deviceId);

		const credentials = await this.buildCredentials(username);

		const result = await MFAServiceV8.activateDevice({
			...credentials,
			deviceId,
			otp: otpCode,
		});

		return {
			success: true,
			status: (result as any).status || 'ACTIVE',
		};
	}

	/**
	 * Get device details
	 */
	async getDevice(username: string, deviceId: string): Promise<Record<string, unknown>> {
		const credentials = await this.buildCredentials(username);
		return await MFAServiceV8.getDevice({ ...credentials, deviceId });
	}

	/**
	 * Delete an MFA device
	 */
	async deleteDevice(username: string, deviceId: string): Promise<void> {
		const credentials = await this.buildCredentials(username);
		await MFAServiceV8.deleteDevice({ ...credentials, deviceId });
	}

	/**
	 * List all MFA devices for a user
	 */
	async listDevices(username: string, filter?: string): Promise<Array<Record<string, unknown>>> {
		const credentials = await this.buildCredentials(username);
		return await MFAServiceV8.getAllDevices(credentials, filter);
	}

	/**
	 * Check if global configuration is valid
	 */
	async validateConfiguration(): Promise<{
		valid: boolean;
		errors: string[];
	}> {
		const errors: string[] = [];

		const environmentId = globalEnvironmentService.getEnvironmentId();
		if (!environmentId) {
			errors.push('Environment ID not configured');
		}

		try {
			const tokenStatus = await globalWorkerTokenService.getStatus();
			if (!tokenStatus.hasCredentials) {
				errors.push('Worker Token credentials not configured');
			}
			if (!tokenStatus.tokenValid) {
				errors.push('Worker Token is invalid or expired');
			}
		} catch (_error) {
			errors.push('Failed to validate Worker Token');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}
}

// Export singleton instance
export const unifiedFlowServiceIntegration = new UnifiedFlowServiceIntegration();
