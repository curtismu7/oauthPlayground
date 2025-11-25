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

		if (!credentials.email?.trim()) {
			errors.push('Email address is required for Email devices');
		} else if (!isValidEmail(credentials.email)) {
			errors.push('Invalid email address format');
		}

		if (!credentials.deviceName?.trim()) {
			errors.push('Device Name is required');
		}

		if (!tokenStatus.isValid) {
			errors.push('Worker token is required - please add a token first');
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams> {
		return {
			email: credentials.email,
			name: credentials.deviceName.trim(),
			nickname: credentials.deviceName.trim(),
		};
	}
}

