/**
 * @file sms.ts
 * @module sdk/p1mfa
 * @description SMS-specific helper methods for P1MFA SDK
 * @version 1.0.0
 */

import { P1MFAError } from './errors';
import type { P1MFASDK } from './P1MFASDK';
import type {
	DeviceActivationParams,
	DeviceActivationResult,
	DeviceRegistrationParams,
	DeviceRegistrationResult,
} from './types';

/**
 * SMS-specific helper methods
 */
export class SMSHelper {
	/**
	 * Register SMS device
	 */
	static async registerSMSDevice(
		sdk: P1MFASDK,
		params: Omit<DeviceRegistrationParams, 'type'> & {
			type: 'SMS';
			phone: string;
		}
	): Promise<DeviceRegistrationResult> {
		// Normalize phone number format
		const normalizedPhone = SMSHelper.normalizePhoneNumber(params.phone);

		return sdk.registerDevice({
			...params,
			phone: normalizedPhone,
		});
	}

	/**
	 * Normalize phone number to PingOne format (+1.5125201234)
	 */
	static normalizePhoneNumber(phone: string): string {
		// Remove all non-digit characters except +
		const cleaned = phone.replace(/[^\d+]/g, '');

		// If starts with +, keep it; otherwise assume US (+1)
		if (cleaned.startsWith('+')) {
			// Format: +1.5125201234 (replace first digit after + with .)
			const countryCode = cleaned.slice(0, 2); // +1
			const rest = cleaned.slice(2);
			return `${countryCode}.${rest}`;
		}

		// If no +, assume US number
		if (cleaned.length === 10) {
			return `+1.${cleaned}`;
		}

		if (cleaned.length === 11 && cleaned.startsWith('1')) {
			return `+${cleaned.slice(0, 1)}.${cleaned.slice(1)}`;
		}

		// Return as-is if format is unclear
		return phone;
	}

	/**
	 * Send OTP to SMS device
	 */
	static async sendOTP(
		sdk: P1MFASDK,
		userId: string,
		deviceId: string
	): Promise<{ message: string }> {
		// Access private config through a workaround
		// In a real implementation, we'd expose this through the SDK
		const config = (sdk as unknown as { config: { environmentId: string } }).config;
		if (!config) {
			throw new P1MFAError('SDK not initialized');
		}

		// Get worker token from SDK
		const token = await (
			sdk as unknown as { getWorkerToken: () => Promise<string> }
		).getWorkerToken();

		try {
			// Use backend proxy endpoint - worker token sent to backend, not exposed in browser
			const response = await fetch('/api/pingone/mfa/send-otp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: config.environmentId,
					userId,
					deviceId,
					workerToken: token,
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				throw new P1MFAError(
					error.message || 'Failed to send OTP',
					error.code,
					response.status,
					error
				);
			}

			return { message: 'OTP sent successfully' };
		} catch (error) {
			if (error instanceof P1MFAError) {
				throw error;
			}
			throw new P1MFAError(
				`Failed to send OTP: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				undefined,
				error
			);
		}
	}

	/**
	 * Activate SMS device with OTP
	 */
	static async activateSMSDevice(
		sdk: P1MFASDK,
		params: Omit<DeviceActivationParams, 'otp'> & { otp: string }
	): Promise<DeviceActivationResult> {
		if (!params.otp) {
			throw new P1MFAError('OTP is required for SMS device activation');
		}

		return sdk.activateDevice(params);
	}
}
