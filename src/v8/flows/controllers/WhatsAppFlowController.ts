/**
 * @file WhatsAppFlowController.ts
 * @module v8/flows/controllers
 * @description WhatsApp-specific MFA flow controller
 * @version 8.2.0
 *
 * WhatsApp MFA is implemented as an SMS-like MFA factor via PingOne MFA with type = "WHATSAPP".
 * All outbound WhatsApp messages are sent by PingOne using its configured sender.
 * This controller reuses SMS patterns but uses WHATSAPP device type.
 */

import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { validateAndNormalizePhone } from '@/v8/utils/phoneValidationV8';
import type { MFACredentials } from '../shared/MFATypes';
import { type FlowControllerCallbacks, MFAFlowController } from './MFAFlowController';

/**
 * Get full phone number with country code (PingOne format: +1.5125201234)
 * Uses phone validation utility to handle multiple input formats
 * Reused from SMSFlowController since WhatsApp uses the same phone format
 */
export const getFullPhoneNumber = (credentials: MFACredentials): string => {
	const phoneValidation = validateAndNormalizePhone(
		credentials.phoneNumber,
		credentials.countryCode
	);

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
 * WhatsApp Flow Controller
 * Handles WhatsApp-specific MFA operations
 *
 * WhatsApp behaves exactly like SMS MFA, but uses type = "WHATSAPP" in PingOne MFA APIs.
 * All WhatsApp OTP messages are sent by PingOne using its configured WhatsApp sender.
 */
export class WhatsAppFlowController extends MFAFlowController {
	constructor(callbacks: FlowControllerCallbacks = {}) {
		super('WHATSAPP', callbacks);
	}

	protected filterDevicesByType(
		devices: Array<Record<string, unknown>>
	): Array<Record<string, unknown>> {
		return devices.filter((d: Record<string, unknown>) => d.type === 'WHATSAPP');
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
		status: 'ACTIVE' | 'ACTIVATION_REQUIRED' = 'ACTIVATION_REQUIRED'
	): Partial<RegisterDeviceParams> {
		const fullPhone = getFullPhoneNumber(credentials);
		// Use device name from credentials if provided, otherwise generate default
		const deviceName =
			credentials.deviceName?.trim() || `WhatsApp Device - ${new Date().toLocaleDateString()}`;
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
		// See: https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-whatsapp
		// NOTE: For educational purposes, policy.id should always be included when available
		// The policy.id comes from the Device Authentication Policy dropdown selection
		if (credentials.deviceAuthenticationPolicyId?.trim()) {
			const policyId = credentials.deviceAuthenticationPolicyId.trim();
			params.policy = { id: policyId };
			console.log(
				'[📲 WHATSAPP-CONTROLLER] ✅ Policy included in registration params (from dropdown selection):',
				{
					policyId: policyId,
					policyObject: params.policy,
					hasStatus: !!params.status,
					status: params.status,
					note: 'Policy ID comes from Device Authentication Policy dropdown selection',
				}
			);
		} else {
			console.warn(
				'[📲 WHATSAPP-CONTROLLER] ⚠️ Policy not included - deviceAuthenticationPolicyId is missing:',
				{
					hasDeviceAuthenticationPolicyId: !!credentials.deviceAuthenticationPolicyId,
					deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId || 'MISSING',
					note: 'Policy ID should be selected from Device Authentication Policy dropdown',
				}
			);
		}

		// Log final params for debugging
		console.log('[📲 WHATSAPP-CONTROLLER] Final registration params:', {
			hasType: false, // Type is added by base controller
			hasPhone: !!params.phone,
			phone: params.phone,
			hasStatus: !!params.status,
			status: params.status,
			hasPolicy: !!params.policy,
			policyId: params.policy?.id || 'MISSING',
			hasName: !!params.name,
			hasNickname: !!params.nickname,
		});

		return params;
	}
}
