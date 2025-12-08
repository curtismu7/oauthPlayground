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
import { validateAndNormalizePhone } from '@/v8/utils/phoneValidationV8';

/**
 * Get full phone number with country code (PingOne format: +1.5125201234)
 * Uses phone validation utility to handle multiple input formats
 */
export const getFullPhoneNumber = (credentials: MFACredentials): string => {
	const phoneValidation = validateAndNormalizePhone(credentials.phoneNumber, credentials.countryCode);
	
	// If validation succeeded, use normalized format; otherwise fall back to old logic
	if (phoneValidation.isValid && phoneValidation.normalizedFullPhone) {
		return phoneValidation.normalizedFullPhone;
	}
	
	// Fallback to old logic for backward compatibility
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

		if (!credentials.deviceAuthenticationPolicyId?.trim()) {
			errors.push('Device Authentication Policy ID is required');
		}

		// Phone number validation is now done in Step 1 (registration), not Step 0

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

	getDeviceRegistrationParams(credentials: MFACredentials, status: 'ACTIVE' | 'ACTIVATION_REQUIRED' = 'ACTIVE'): Partial<RegisterDeviceParams> {
		const fullPhone = getFullPhoneNumber(credentials);
		// Use device name from credentials if provided, otherwise generate default
		const deviceName = credentials.deviceName?.trim() || `SMS Device - ${new Date().toLocaleDateString()}`;
		const params: Partial<RegisterDeviceParams> = {
			phone: fullPhone,
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
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms
		if (credentials.deviceAuthenticationPolicyId?.trim()) {
			params.policy = { id: credentials.deviceAuthenticationPolicyId.trim() };
		}

		return params;
	}
}

