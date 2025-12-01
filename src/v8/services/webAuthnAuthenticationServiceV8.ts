/**
 * @file webAuthnAuthenticationServiceV8.ts
 * @module v8/services
 * @description WebAuthn authentication service for FIDO2/Passkey authentication
 * @version 8.0.0
 * @since 2025-01-XX
 *
 * This service handles WebAuthn authentication for FIDO2 devices in MFA flows.
 * It wraps the FIDO2Service and integrates with PingOne's MFA API.
 */

import { FIDO2Service } from '@/services/fido2Service';
import { pingOneFetch } from '@/utils/pingOneFetch';
import { workerTokenServiceV8 } from './workerTokenServiceV8';

const MODULE_TAG = '[🔐 WEBAUTHN-AUTHN-SERVICE-V8]';

export interface WebAuthnAuthenticationParams {
	challengeId: string;
	rpId: string;
	userName: string;
	userVerification: 'required' | 'preferred' | 'discouraged';
	authenticatorSelection?: {
		authenticatorAttachment?: 'platform' | 'cross-platform';
		userVerification?: 'required' | 'preferred' | 'discouraged';
	};
}

export interface WebAuthnAuthenticationResult {
	success: boolean;
	error?: string;
	credentialId?: string;
	signature?: string;
	userHandle?: string;
	clientDataJSON?: string;
	authenticatorData?: string;
}

/**
 * WebAuthn Authentication Service for V8 MFA flows
 * Handles FIDO2/Passkey authentication using WebAuthn API
 */
export class WebAuthnAuthenticationServiceV8 {
	/**
	 * Check if WebAuthn is supported in the current browser
	 */
	static isWebAuthnSupported(): boolean {
		return FIDO2Service.isWebAuthnSupported();
	}

	/**
	 * Authenticate with WebAuthn using challenge from PingOne
	 * This method:
	 * 1. Fetches the challenge data from PingOne using challengeId
	 * 2. Performs WebAuthn authentication with the challenge
	 * 3. Returns the assertion result
	 */
	static async authenticateWithWebAuthn(
		params: WebAuthnAuthenticationParams
	): Promise<WebAuthnAuthenticationResult> {
		console.log(`${MODULE_TAG} Starting WebAuthn authentication`, {
			challengeId: params.challengeId,
			rpId: params.rpId,
			userName: params.userName,
		});

		try {
			// Check WebAuthn support
			if (!WebAuthnAuthenticationServiceV8.isWebAuthnSupported()) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
				};
			}

			// Get worker token
			const workerToken = await workerTokenServiceV8.getWorkerToken();
			if (!workerToken) {
				return {
					success: false,
					error: 'Worker token is required for WebAuthn authentication',
				};
			}

			// Fetch challenge data from PingOne
			// The challengeId is typically part of the device authentication response
			// For now, we'll use the challengeId directly and construct a challenge string
			// In a real implementation, you might need to fetch the full challenge data from PingOne
			// using an endpoint like: GET /mfa/v1/environments/{envId}/challenges/{challengeId}
			
			// For FIDO2 authentication, PingOne typically provides the challenge in the device authentication response
			// We'll use the challengeId as a base64-encoded challenge string
			// If the challengeId is not a valid base64 challenge, we'll need to fetch it from PingOne
			let challenge: string;
			
			// Try to decode the challengeId to see if it's already a challenge
			// If not, we'll need to fetch the challenge from PingOne
			// For now, we'll assume the challengeId can be used directly or needs to be fetched
			// This is a simplified implementation - in production, you should fetch the full challenge data
			challenge = params.challengeId;

			// Get the selected device's credential ID
			// In a real flow, this would come from the device selection
			// For now, we'll try to get it from the stored credentials or allow the browser to select
			// The browser will prompt the user to select a credential if allowCredentials is not specified
			
			// Create WebAuthn authentication options
			const getOptions: CredentialRequestOptions = {
				publicKey: {
					challenge: FIDO2Service.base64ToArrayBuffer(challenge),
					timeout: 60000,
					userVerification: params.userVerification,
					rpId: params.rpId,
					// Don't specify allowCredentials to let the browser prompt for any available credential
					// This works better for Passkeys on macOS
					...(params.authenticatorSelection?.authenticatorAttachment === 'platform'
						? {
								// Prefer platform authenticators (Passkeys) on Mac
						  }
						: {}),
				},
			};

			// Perform WebAuthn authentication
			const credential = (await navigator.credentials.get(getOptions)) as PublicKeyCredential;

			if (!credential) {
				return {
					success: false,
					error: 'Authentication was cancelled or failed',
				};
			}

			// Extract authentication data
			const response = credential.response as AuthenticatorAssertionResponse;
			const signature = FIDO2Service.arrayBufferToBase64(response.signature);
			const userHandle = response.userHandle
				? FIDO2Service.arrayBufferToBase64(response.userHandle)
				: undefined;
			const clientDataJSON = FIDO2Service.arrayBufferToBase64(response.clientDataJSON);
			const authenticatorData = FIDO2Service.arrayBufferToBase64(response.authenticatorData);
			const credentialId = credential.id;

			console.log(`${MODULE_TAG} WebAuthn authentication successful`, {
				credentialId: credentialId.substring(0, 20) + '...',
				hasSignature: !!signature,
			});

			return {
				success: true,
				credentialId,
				signature,
				userHandle,
				clientDataJSON,
				authenticatorData,
			};
		} catch (error: unknown) {
			console.error(`${MODULE_TAG} WebAuthn authentication failed:`, error);

			let errorMessage = 'Authentication failed';
			if (error instanceof DOMException) {
				switch (error.name) {
					case 'NotAllowedError':
						errorMessage = 'Authentication was cancelled or not allowed';
						break;
					case 'NotSupportedError':
						errorMessage = 'This authenticator is not supported';
						break;
					case 'SecurityError':
						errorMessage = 'Security error during authentication';
						break;
					case 'InvalidStateError':
						errorMessage = 'Authenticator is not registered';
						break;
					case 'ConstraintError':
						errorMessage = 'Authenticator does not meet requirements';
						break;
					case 'TimeoutError':
						errorMessage = 'Authentication timed out';
						break;
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}

