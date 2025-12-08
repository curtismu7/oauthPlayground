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
	publicKeyOptions?: PublicKeyCredentialRequestOptions;
}

export interface WebAuthnAuthenticationResult {
	success: boolean;
	error?: string;
	credentialId?: string;
	rawId?: string;
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

			const currentHost = typeof window !== 'undefined' ? window.location.hostname : params.rpId;

			// Get worker token
			const workerToken = await workerTokenServiceV8.getWorkerToken();
			if (!workerToken) {
				return {
					success: false,
					error: 'Worker token is required for WebAuthn authentication',
				};
			}

			// When PingOne supplies full WebAuthn request options, prefer those
			if (params.publicKeyOptions) {
				// Check if we should prefer platform authenticator
				const { shouldPreferFIDO2PlatformDevice } = await import('./fido2SessionCookieServiceV8');
				const platformPreference = shouldPreferFIDO2PlatformDevice();
				const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
				const preferPlatform = platformPreference.prefer || isMac || params.authenticatorSelection?.authenticatorAttachment === 'platform';
				
				const preparedOptions = await WebAuthnAuthenticationServiceV8.preparePublicKeyOptions(
					params.publicKeyOptions,
					currentHost,
					preferPlatform
				);

				console.log(`${MODULE_TAG} Using PingOne publicKeyOptions`, {
					hasAllowCredentials: !!preparedOptions.allowCredentials,
					allowCredentialsCount: preparedOptions.allowCredentials?.length || 0,
					authenticatorAttachment: preparedOptions.authenticatorAttachment,
					preferPlatform,
				});

				const credential = (await navigator.credentials.get({
					publicKey: preparedOptions,
				})) as PublicKeyCredential;

				if (!credential) {
					return {
						success: false,
						error: 'Authentication was cancelled or failed',
					};
				}

				const response = credential.response as AuthenticatorAssertionResponse;
				const signature = FIDO2Service.arrayBufferToBase64(response.signature);
				const userHandle = response.userHandle
					? FIDO2Service.arrayBufferToBase64(response.userHandle)
					: undefined;
				const clientDataJSON = FIDO2Service.arrayBufferToBase64(response.clientDataJSON);
				const authenticatorData = FIDO2Service.arrayBufferToBase64(response.authenticatorData);
				const credentialId = credential.id;
				const rawId = FIDO2Service.arrayBufferToBase64(credential.rawId);

				console.log(`${MODULE_TAG} WebAuthn authentication successful`, {
					credentialId: credentialId.substring(0, 20) + '...',
					hasSignature: !!signature,
				});

				return {
					success: true,
					credentialId,
					rawId,
					signature,
					userHandle,
					clientDataJSON,
					authenticatorData,
				};
			}

			// Fallback: use challengeId directly if full options are not available
			let challenge: string = params.challengeId;

			// Check for session cookies and prefer platform authenticators if present
			// Per PingOne MFA API: If session cookie exists, prefer FIDO2 platform device even if not default
			const { getAuthenticatorSelectionPreferences } = await import('./fido2SessionCookieServiceV8');
			const authenticatorPrefs = getAuthenticatorSelectionPreferences();
			
			// Merge user-provided authenticator selection with session cookie preferences
			let authenticatorSelection = {
				...authenticatorPrefs,
				...(params.authenticatorSelection || {}),
				// Session cookie preferences take precedence
				...(authenticatorPrefs.authenticatorAttachment ? {
					authenticatorAttachment: authenticatorPrefs.authenticatorAttachment,
				} : {}),
			};

			// Check if platform authenticator is available before setting authenticatorAttachment to 'platform'
			if (authenticatorSelection.authenticatorAttachment === 'platform') {
				try {
					const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
					if (!platformAvailable) {
						console.warn(`${MODULE_TAG} Platform authenticator requested but not available. Falling back to any authenticator.`);
						// Remove platform restriction - allow any authenticator
						delete authenticatorSelection.authenticatorAttachment;
					} else {
						console.log(`${MODULE_TAG} Platform authenticator is available and will be used`);
					}
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to check platform authenticator availability:`, error);
					// If we can't check, remove platform restriction to be safe
					delete authenticatorSelection.authenticatorAttachment;
				}
			}

			const getOptions: CredentialRequestOptions = {
				publicKey: {
					challenge: FIDO2Service.base64ToArrayBuffer(challenge),
					timeout: 60000,
					userVerification: authenticatorSelection.userVerification || params.userVerification,
					rpId: currentHost,
					...(authenticatorSelection.authenticatorAttachment ? {
						authenticatorAttachment: authenticatorSelection.authenticatorAttachment,
					} : {}),
				},
			};

			console.log(`${MODULE_TAG} Using fallback WebAuthn options (challengeId)`, {
				hasAuthenticatorAttachment: !!getOptions.publicKey.authenticatorAttachment,
				authenticatorAttachment: getOptions.publicKey.authenticatorAttachment,
				userVerification: getOptions.publicKey.userVerification,
				rpId: getOptions.publicKey.rpId,
			});

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
			const rawId = FIDO2Service.arrayBufferToBase64(credential.rawId);

			console.log(`${MODULE_TAG} WebAuthn authentication successful`, {
				credentialId: credentialId.substring(0, 20) + '...',
				hasSignature: !!signature,
			});

			return {
				success: true,
				credentialId,
				rawId,
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

	private static async preparePublicKeyOptions(
		options: PublicKeyCredentialRequestOptions,
		currentHost: string,
		preferPlatform?: boolean
	): Promise<PublicKeyCredentialRequestOptions> {
		const resolvedRpId = WebAuthnAuthenticationServiceV8.resolveCompatibleRpId(
			options.rpId,
			currentHost
		);

		const challengeBytes = WebAuthnAuthenticationServiceV8.toUint8Array(options.challenge);
		if (!challengeBytes || !challengeBytes.byteLength) {
			throw new Error('Missing challenge data from PingOne response. Please retry authentication.');
		}

		const clonedOptions: PublicKeyCredentialRequestOptions = {
			...options,
			rpId: resolvedRpId,
			challenge: challengeBytes,
		};

		// Check if platform authenticator is available
		let platformAvailable = false;
		if (preferPlatform) {
			try {
				platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
				console.log(`${MODULE_TAG} Platform authenticator available: ${platformAvailable}`);
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to check platform authenticator availability:`, error);
				platformAvailable = false;
			}
		}

		// Handle allowCredentials
		if (options.allowCredentials) {
			// Check if any allowCredentials have 'internal' transport (platform authenticator)
			const hasPlatformTransport = options.allowCredentials.some(
				(cred) => cred.transports?.includes('internal')
			);
			
			// If platform is preferred and available, but allowCredentials doesn't include platform transports,
			// we should NOT restrict to only the allowCredentials - instead, allow any authenticator
			// This is because PingOne might return allowCredentials for cross-platform devices only,
			// but we want to use platform authenticator if available
			if (preferPlatform && platformAvailable && !hasPlatformTransport) {
				console.log(`${MODULE_TAG} Platform authenticator preferred but allowCredentials restricts to cross-platform only. Removing allowCredentials restriction to allow platform authenticator.`);
				// Don't set allowCredentials - this allows any authenticator including platform
				clonedOptions.authenticatorAttachment = 'platform';
			} else {
				// Process allowCredentials normally
				clonedOptions.allowCredentials = options.allowCredentials.map((cred) => ({
					...cred,
					id: WebAuthnAuthenticationServiceV8.toUint8Array(cred.id),
				}));
				
				// If platform is preferred and available, and allowCredentials includes platform transports,
				// set authenticatorAttachment to platform
				if (preferPlatform && platformAvailable && hasPlatformTransport) {
					clonedOptions.authenticatorAttachment = 'platform';
					console.log(`${MODULE_TAG} Platform authenticator preferred - allowCredentials includes platform transports`);
				}
			}
		} else if (preferPlatform && platformAvailable) {
			// No allowCredentials restriction - allow platform authenticator
			clonedOptions.authenticatorAttachment = 'platform';
			console.log(`${MODULE_TAG} Platform authenticator preferred - no allowCredentials restriction, using platform`);
		}

		return clonedOptions;
	}

	private static resolveCompatibleRpId(providedRpId: string | undefined, currentHost: string): string {
		if (!providedRpId) {
			return currentHost;
		}

		if (providedRpId === currentHost) {
			return providedRpId;
		}

		const isSuffixMatch = currentHost.endsWith(providedRpId);

		if (isSuffixMatch) {
			return providedRpId;
		}

		if (currentHost === 'localhost') {
			throw new Error(
				`Cannot use production passkey on localhost. The passkey was created with RP ID "${providedRpId}" but current host is "${currentHost}". Please create a new passkey for localhost development or use the production domain.`
			);
		}

		console.warn(`${MODULE_TAG} RP ID mismatch detected`, {
			providedRpId,
			currentHost,
		});

		return providedRpId;
	}

	private static toUint8Array(bufferSource: BufferSource): Uint8Array {
		if (bufferSource instanceof ArrayBuffer) {
			return new Uint8Array(bufferSource);
		}

		if (ArrayBuffer.isView(bufferSource)) {
			return new Uint8Array(
				bufferSource.buffer,
				bufferSource.byteOffset,
				bufferSource.byteLength
			);
		}

		// Fallback - assume it's already Uint8Array-compatible
		return new Uint8Array(bufferSource as ArrayBufferLike);
	}
}

