/**
 * @file SMSFlowController.ts
 * @module v8/flows/controllers
 * @description SMS-specific MFA flow controller
 * @version 8.2.0
 */

import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { MFACredentials } from '../shared/MFATypes';
import { MFAFlowController, type FlowControllerCallbacks } from './MFAFlowController';
import type { RegisterDeviceParams } from '@/v8/services/mfaServiceV8';

/**
 * Get full phone number with country code (PingOne format: +1.5125201234)
 */
export const getFullPhoneNumber = (credentials: MFACredentials): string => {
	const cleanedPhone = credentials.phoneNumber.replace(/[^\d]/g, '');
	const countryCode = credentials.countryCode.replace(/[^\d+]/g, '');
	return `${countryCode}.${cleanedPhone}`;
};

/**
 * SMS Flow Controller
 * Handles SMS-specific MFA operations
 */
export class SMSFlowController extends MFAFlowController {
	constructor(callbacks: FlowControllerCallbacks = {}) {
		super('SMS', callbacks);
	}

	protected filterDevicesByType(devices: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
		return devices.filter((d: Record<string, unknown>) => d.type === 'SMS' || d.type === 'MOBILE');
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

		// Phone number validation is now done in Step 1 (registration), not Step 0

		if (!tokenStatus.isValid) {
			errors.push('Worker token is required - please add a token first');
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams> {
		const fullPhone = getFullPhoneNumber(credentials);
		// Use device name from credentials if provided, otherwise generate default
		const deviceName = credentials.deviceName?.trim() || `SMS Device - ${new Date().toLocaleDateString()}`;
		return {
			phone: fullPhone,
			name: deviceName,
			nickname: deviceName,
			// Set to ACTIVE since we're using Worker App (actor making request on behalf of user)
			// Per PingOne API: Worker App can set ACTIVE (pre-paired, no activation required) or ACTIVATION_REQUIRED
			// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#enable-users-mfa
			status: 'ACTIVE',
		};
	}
}

