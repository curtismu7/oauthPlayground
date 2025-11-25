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

		if (!credentials.phoneNumber?.trim()) {
			errors.push('Phone Number is required for SMS devices');
		} else {
			const cleanedPhone = credentials.phoneNumber.replace(/[^\d]/g, '');
			if (credentials.countryCode === '+1') {
				if (cleanedPhone.length !== 10) {
					errors.push(
						`US/Canada phone numbers must be exactly 10 digits (you have ${cleanedPhone.length})`
					);
				}
			} else {
				if (cleanedPhone.length < 6) {
					errors.push('Phone number is too short (minimum 6 digits)');
				} else if (cleanedPhone.length > 15) {
					errors.push('Phone number is too long (maximum 15 digits)');
				}
			}
		}

		if (!tokenStatus.isValid) {
			errors.push('Worker token is required - please add a token first');
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams> {
		const fullPhone = getFullPhoneNumber(credentials);
		return {
			phone: fullPhone,
			name: `SMS Device - ${new Date().toLocaleDateString()}`,
			nickname: `SMS Device - ${new Date().toLocaleDateString()}`,
		};
	}
}

