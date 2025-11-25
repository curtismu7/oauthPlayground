/**
 * @file FIDO2FlowController.ts
 * @module v8/flows/controllers
 * @description FIDO2-specific MFA flow controller
 * @version 8.2.0
 */

import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import type { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import type { MFACredentials } from '../shared/MFATypes';
import { MFAFlowController, type FlowControllerCallbacks } from './MFAFlowController';
import type { RegisterDeviceParams } from '@/v8/services/mfaServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { FIDO2Service, type FIDO2Config, type FIDO2RegistrationResult } from '@/services/fido2Service';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

/**
 * FIDO2 Flow Controller
 * Handles FIDO2-specific MFA operations with WebAuthn integration
 */
export class FIDO2FlowController extends MFAFlowController {
	constructor(callbacks: FlowControllerCallbacks = {}) {
		super('FIDO2', callbacks);
	}

	protected filterDevicesByType(devices: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
		return devices.filter((d: Record<string, unknown>) => d.type === 'FIDO2');
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

		if (!tokenStatus.isValid) {
			errors.push('Worker token is required - please add a token first');
		}

		// Check WebAuthn support
		if (!FIDO2Service.isWebAuthnSupported()) {
			errors.push('WebAuthn is not supported in this browser. Please use a modern browser that supports WebAuthn.');
		}

		nav.setValidationErrors(errors);
		return errors.length === 0;
	}

	getDeviceRegistrationParams(credentials: MFACredentials): Partial<RegisterDeviceParams> {
		// Generate a default device name based on username
		const defaultName = `FIDO2 Device - ${credentials.username || 'User'}`;
		return {
			name: defaultName,
			nickname: defaultName,
		};
	}

	/**
	 * Register FIDO2 device with WebAuthn
	 * This is a multi-step process:
	 * 1. Create device in PingOne
	 * 2. Get registration options/challenge
	 * 3. Use WebAuthn API to create credential
	 * 4. Complete registration with PingOne
	 */
	async registerFIDO2Device(
		credentials: MFACredentials,
		deviceId: string
	): Promise<{ deviceId: string; status: string; credentialId?: string }> {
		// Check WebAuthn support
		if (!FIDO2Service.isWebAuthnSupported()) {
			throw new Error('WebAuthn is not supported in this browser');
		}

		// Look up user
		const user = await MFAServiceV8.lookupUserByUsername(credentials.environmentId, credentials.username);

		// Generate challenge (in production, this should come from PingOne)
		const challenge = FIDO2Service.generateChallenge();

		// Generate default device name
		const defaultDeviceName = `FIDO2 Device - ${credentials.username || 'User'}`;

		// Create FIDO2 config
		const fido2Config: FIDO2Config = {
			rpId: window.location.hostname,
			rpName: 'PingOne MFA Playground',
			userDisplayName: `${credentials.username} (${defaultDeviceName})`,
			userName: credentials.username,
			userHandle: user.id,
			challenge,
			timeout: 60000,
			attestation: 'none',
			authenticatorSelection: {
				userVerification: 'preferred',
				residentKey: 'preferred',
			},
		};

		// Register credential using WebAuthn API
		const registrationResult: FIDO2RegistrationResult = await FIDO2Service.registerCredential(fido2Config);

		if (!registrationResult.success || !registrationResult.credentialId) {
			throw new Error(registrationResult.error || 'Failed to register FIDO2 credential');
		}

		// Complete registration with PingOne
		await MFAServiceV8.completeFIDO2Registration({
			environmentId: credentials.environmentId,
			userId: user.id,
			deviceId,
			credentialId: registrationResult.credentialId,
			attestationObject: registrationResult.attestationObject || '',
			clientDataJSON: registrationResult.clientDataJSON || '',
		});

		toastV8.success('FIDO2 device registered successfully!');

		return {
			deviceId,
			status: 'ACTIVE',
			credentialId: registrationResult.credentialId,
		};
	}

	/**
	 * Check WebAuthn capabilities
	 */
	static getWebAuthnCapabilities() {
		return FIDO2Service.getCapabilities();
	}
}

