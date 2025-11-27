/**
 * @file EmailFlowController.ts
 * @module v8/flows/controllers
 * @description Email-specific MFA flow controller
 * @version 8.2.0
 */

import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { MFACredentials } from '../shared/MFATypes';
import { MFAFlowController, type FlowControllerCallbacks } from './MFAFlowController';
import type { RegisterDeviceParams } from '@/v8/services/mfaServiceV8';

const MODULE_TAG = '[📧 EMAIL-CONTROLLER]';

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

	protected filterDevicesByType(devices: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
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

		if (!tokenStatus.isValid) {
			errors.push('Worker token is required - please add a token first');
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams> {
		// Use device name from credentials if provided
		const deviceName = credentials.deviceName?.trim() || `Email Device - ${new Date().toLocaleDateString()}`;
		return {
			email: credentials.email,
			name: deviceName,
			nickname: deviceName,
			// Set to ACTIVE since we're using Worker App (actor making request on behalf of user)
			// Per PingOne API: Worker App can set ACTIVE (pre-paired, no activation required) or ACTIVATION_REQUIRED
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
			status: 'ACTIVE',
		};
	}
}

