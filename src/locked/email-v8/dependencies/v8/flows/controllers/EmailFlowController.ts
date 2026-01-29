/**
 * @file EmailFlowController.ts
 * @module v8/flows/controllers
 * @description Email-specific MFA flow controller
 * @version 8.2.0
 */

import type { useStepNavigationV8 } from '../../hooks/useStepNavigationV8.ts';
import type { RegisterDeviceParams } from '../../services/mfaServiceV8.ts';
import { WorkerTokenStatusServiceV8 } from '../../services/workerTokenStatusServiceV8.ts';
import type { MFACredentials } from '../shared/MFATypes';
import { type FlowControllerCallbacks, MFAFlowController } from './MFAFlowController';

const _MODULE_TAG = '[📧 EMAIL-CONTROLLER]';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

/**
 * Email Flow Controller
 * Handles Email-specific MFA operations
 */
export class EmailFlowController extends MFAFlowController {
	constructor(callbacks: FlowControllerCallbacks = {}) {
		super('EMAIL', callbacks);
	}

	protected filterDevicesByType(
		devices: Array<Record<string, unknown>>
	): Array<Record<string, unknown>> {
		return devices.filter((d: Record<string, unknown>) => d.type === 'EMAIL');
	}

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

		// Email address validation is now done in Step 1 (registration), not Step 0
		// Device name validation is also done in Step 1 (registration), not Step 0

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

	getDeviceRegistrationParams(
		credentials: MFACredentials,
		status: 'ACTIVE' | 'ACTIVATION_REQUIRED' = 'ACTIVE'
	): Partial<RegisterDeviceParams> {
		// Use device name from credentials if provided
		const deviceName =
			credentials.deviceName?.trim() || `Email Device - ${new Date().toLocaleDateString()}`;
		const params: Partial<RegisterDeviceParams> = {
			email: credentials.email,
			name: deviceName,
			nickname: deviceName,
			// Status determines if device needs activation:
			// ACTIVE: Pre-paired device, ready to use immediately (no OTP needed)
			// ACTIVATION_REQUIRED: User must activate device via OTP before first use
			// Per PingOne API: Worker App can set ACTIVE (pre-paired) or ACTIVATION_REQUIRED
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
			status,
		};

		// Include policy if deviceAuthenticationPolicyId is provided
		// According to API docs: policy should be an object with id property
		// Format: { "policy": { "id": "policy-id-string" } }
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-email
		if (credentials.deviceAuthenticationPolicyId?.trim()) {
			params.policy = { id: credentials.deviceAuthenticationPolicyId.trim() };
		}

		return params;
	}
}
