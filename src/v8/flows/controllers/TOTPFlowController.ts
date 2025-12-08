/**
 * @file TOTPFlowController.ts
 * @module v8/flows/controllers
 * @description TOTP-specific MFA flow controller
 * @version 8.2.0
 */

import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { MFACredentials } from '../shared/MFATypes';
import { MFAFlowController, type FlowControllerCallbacks } from './MFAFlowController';
import type { RegisterDeviceParams } from '@/v8/services/mfaServiceV8';

/**
 * TOTP Flow Controller
 * Handles TOTP-specific MFA operations
 */
export class TOTPFlowController extends MFAFlowController {
	constructor(callbacks: FlowControllerCallbacks = {}) {
		super('TOTP', callbacks);
	}

	protected filterDevicesByType(devices: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
		return devices.filter((d: Record<string, unknown>) => d.type === 'TOTP');
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

		// Per rightTOTP.md: Check token validity based on token type (worker or user)
		const tokenType = credentials.tokenType || 'worker';
		const isTokenValid = tokenType === 'worker' 
			? tokenStatus.isValid 
			: !!credentials.userToken?.trim();
		if (!isTokenValid) {
			errors.push(`${tokenType === 'worker' ? 'Worker' : 'User'} token is required - please add a token first`);
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams> {
		// Generate a default device name based on username and timestamp
		const defaultName = credentials.deviceName?.trim() || `TOTP Device - ${credentials.username || 'User'}`;
		
		// According to totp.md spec:
		// - status must be ACTIVATION_REQUIRED to get secret and keyUri
		// - policy object should be included if deviceAuthenticationPolicyId is provided
		const params: Partial<RegisterDeviceParams> = {
			name: defaultName,
			nickname: defaultName,
			status: 'ACTIVATION_REQUIRED', // Required to get secret and keyUri in response
		};
		
		// Include policy if deviceAuthenticationPolicyId is provided
		if (credentials.deviceAuthenticationPolicyId) {
			params.policy = {
				id: credentials.deviceAuthenticationPolicyId,
				type: 'DEVICE_AUTHENTICATION_POLICY',
			};
		}
		
		return params;
	}
}

