/**
 * @file MobileFlowController.ts
 * @module v8/flows/controllers
 * @description Mobile-specific MFA flow controller (PingOne Mobile app)
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Handle MFA operations for PingOne Mobile app pairing and authentication
 */

import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import type { MFACredentials } from '../shared/MFATypes';
import { type FlowControllerCallbacks, MFAFlowController } from './MFAFlowController';

const MODULE_TAG = '[📲 MOBILE-CONTROLLER]';

/**
 * Mobile Flow Controller
 * Handles PingOne Mobile app-specific MFA operations (device pairing via QR code)
 */
export class MobileFlowController extends MFAFlowController {
	constructor(callbacks: FlowControllerCallbacks = {}) {
		super('MOBILE', callbacks);
		console.log(`${MODULE_TAG} Mobile Flow Controller initialized`);
	}

	/**
	 * Filter devices to only include Mobile devices
	 */
	protected filterDevicesByType(
		devices: Array<Record<string, unknown>>
	): Array<Record<string, unknown>> {
		return devices.filter((d: Record<string, unknown>) => d.type === 'MOBILE');
	}

	/**
	 * Validate credentials for Mobile device registration
	 */
	validateCredentials(
		credentials: MFACredentials,
		tokenStatus: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>,
		nav: ReturnType<typeof useStepNavigationV8>
	): boolean {
		const errors: string[] = [];

		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		}

		if (!credentials.username?.trim()) {
			errors.push('Username is required');
		}

		if (!credentials.deviceAuthenticationPolicyId?.trim()) {
			errors.push('Device Authentication Policy ID is required');
		}

		// Per rightTOTP.md: Check token validity based on token type (worker or user)
		const tokenType = credentials.tokenType || 'worker';
		const isTokenValid =
			tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim();
		if (!isTokenValid) {
			errors.push(
				`${tokenType === 'worker' ? 'Worker' : 'User'} token is required - please add a token first`
			);
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	/**
	 * Get device registration parameters for Mobile devices
	 * Mobile devices are paired via QR code shown in PingOne Mobile app
	 */
	getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams> {
		// Use device name from credentials if provided, otherwise generate default
		const deviceName =
			credentials.deviceName?.trim() || `Mobile Device - ${new Date().toLocaleDateString()}`;

		const params: Partial<RegisterDeviceParams> = {
			name: deviceName,
			nickname: deviceName,
			// Mobile devices don't require activation via OTP
			// They use QR code pairing through PingOne Mobile app
			// The pairing process handles activation automatically
		};

		// Include policy if deviceAuthenticationPolicyId is provided
		// According to API docs: policy should be an object with id property
		// Format: { "policy": { "id": "policy-id-string" } }
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device
		if (credentials.deviceAuthenticationPolicyId?.trim()) {
			params.policy = { id: credentials.deviceAuthenticationPolicyId.trim() };
		}

		return params;
	}

	/**
	 * Process registration result for Mobile devices
	 * Override to extract Mobile-specific data (pairing key, QR code)
	 */
	protected processRegistrationResult(result: any): {
		deviceId: string;
		status: string;
		[key: string]: any;
	} {
		console.log(`${MODULE_TAG} Processing Mobile device registration result`);

		// Call parent to get base fields
		const baseResult = super.processRegistrationResult(result);

		// Add Mobile-specific fields
		return {
			...baseResult,
			// Mobile devices return a pairing QR code and key
			...(result.pairingKey ? { pairingKey: result.pairingKey } : {}),
			...(result.qrCode ? { qrCode: result.qrCode } : {}),
			...(result.qrCodeUrl ? { qrCodeUrl: result.qrCodeUrl } : {}),
			// Include pairing instructions if available
			...(result.pairingInstructions ? { pairingInstructions: result.pairingInstructions } : {}),
		};
	}
}
