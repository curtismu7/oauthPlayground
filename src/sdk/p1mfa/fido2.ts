/**
 * @file fido2.ts
 * @module sdk/p1mfa
 * @description FIDO2-specific helper methods for P1MFA SDK
 * @version 1.0.0
 */

import { WebAuthnError } from './errors';
import type { P1MFASDK } from './P1MFASDK';
import type {
	DeviceActivationParams,
	DeviceActivationResult,
	DeviceRegistrationParams,
	DeviceRegistrationResult,
} from './types';

/**
 * FIDO2-specific helper methods
 */
export class FIDO2Helper {
	/**
	 * Register FIDO2 device
	 */
	static async registerFIDO2Device(
		sdk: P1MFASDK,
		params: Omit<DeviceRegistrationParams, 'type'> & { type: 'FIDO2' }
	): Promise<DeviceRegistrationResult> {
		// Ensure RP (Relying Party) is set
		if (!params.rp) {
			const origin = typeof window !== 'undefined' ? window.location.origin : 'localhost';
			const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
			params.rp = {
				id: hostname === 'localhost' ? 'localhost' : hostname,
				name: hostname === 'localhost' ? 'Local Development' : hostname,
			};
		}

		return sdk.registerDevice(params);
	}

	/**
	 * Create WebAuthn credential (browser API)
	 */
	static async createWebAuthnCredential(
		creationOptions: PublicKeyCredentialCreationOptions
	): Promise<PublicKeyCredential> {
		if (!('credentials' in navigator && 'create' in navigator.credentials)) {
			throw new WebAuthnError(
				'WebAuthn is not supported in this browser. Please use a modern browser that supports WebAuthn.'
			);
		}

		try {
			const credential = (await navigator.credentials.create({
				publicKey: creationOptions,
			})) as PublicKeyCredential | null;

			if (!credential) {
				throw new WebAuthnError('Failed to create WebAuthn credential');
			}

			return credential;
		} catch (error) {
			if (error instanceof WebAuthnError) {
				throw error;
			}
			throw new WebAuthnError(
				`WebAuthn credential creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				error
			);
		}
	}

	/**
	 * Activate FIDO2 device with WebAuthn credential
	 */
	static async activateFIDO2Device(
		sdk: P1MFASDK,
		params: Omit<DeviceActivationParams, 'fido2Credential'> & {
			fido2Credential: PublicKeyCredential;
		}
	): Promise<DeviceActivationResult> {
		return sdk.activateDevice(params);
	}

	/**
	 * Get WebAuthn assertion (browser API)
	 */
	static async getWebAuthnAssertion(
		requestOptions: PublicKeyCredentialRequestOptions
	): Promise<PublicKeyCredential> {
		if (!('credentials' in navigator && 'get' in navigator.credentials)) {
			throw new WebAuthnError(
				'WebAuthn is not supported in this browser. Please use a modern browser that supports WebAuthn.'
			);
		}

		try {
			const assertion = (await navigator.credentials.get({
				publicKey: requestOptions,
			})) as PublicKeyCredential | null;

			if (!assertion) {
				throw new WebAuthnError('Failed to get WebAuthn assertion');
			}

			return assertion;
		} catch (error) {
			if (error instanceof WebAuthnError) {
				throw error;
			}
			throw new WebAuthnError(
				`WebAuthn assertion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				undefined,
				error
			);
		}
	}
}
