/**
 * @file passkeyServiceV8.ts
 * @module v8/services
 * @description Username-less Passkey/FaceID authentication service using PingOne MFA FIDO2 APIs
 * @version 8.0.0
 * @since 2025-01-XX
 *
 * This service implements username-less passkey authentication flow:
 * 1. First attempts authentication using WebAuthn discoverable credentials (no username required)
 * 2. If no credentials found, falls back to registration (requires username for PingOne user creation)
 * 3. Uses existing PingOne MFA FIDO2 APIs for device management and authentication
 *
 * Flow:
 * - Authentication: WebAuthn get() → Extract userHandle → Lookup user → Complete PingOne MFA auth
 * - Registration: Get username → Create/Find user → Register FIDO2 device → Activate
 *
 * Uses existing services:
 * - MFAServiceV8 for device registration
 * - MfaAuthenticationServiceV8 for device authentication
 * - WebAuthnAuthenticationServiceV8 for WebAuthn operations
 */

import { FIDO2Service } from '@/services/fido2Service';
import { workerTokenServiceV8 } from './workerTokenServiceV8';

// Utility function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

const MODULE_TAG = '[🔑 PASSKEY-SERVICE-V8]';

export interface PasskeyAuthOptions {
	environmentId: string;
	deviceAuthenticationPolicyId: string;
}

export interface PasskeyAuthResult {
	success: boolean;
	userId?: string;
	username?: string;
	authenticationId?: string;
	error?: string;
	requiresRegistration?: boolean;
	errorCode?: string;
	unavailableDevices?: Array<{ id: string; type?: string; status?: string; nickname?: string; reason?: string }>;
}

export interface PasskeyRegistrationOptions {
	environmentId: string;
	username: string; // Required for PingOne user lookup/creation
	deviceAuthenticationPolicyId: string;
	deviceName?: string;
}

export interface PasskeyRegistrationResult {
	success: boolean;
	deviceId?: string;
	userId?: string;
	error?: string;
	errorCode?: string;
	unavailableDevices?: Array<{ id: string; type?: string; status?: string; nickname?: string; reason?: string }>;
}

/**
 * Username-less Passkey Authentication Service
 * Implements discoverable credential flow for passwordless authentication
 */
export class PasskeyServiceV8 {
	/**
	 * Check if WebAuthn is supported
	 */
	static isSupported(): boolean {
		return FIDO2Service.isWebAuthnSupported();
	}

	/**
	 * Attempt username-less authentication using discoverable credentials
	 * Flow:
	 * 1. Call WebAuthn get() with discoverable credentials (no allowCredentials restriction)
	 * 2. Extract userHandle from response
	 * 3. Lookup user in PingOne using userHandle
	 * 4. Initialize PingOne MFA authentication
	 * 5. Complete authentication with PingOne
	 */
	static async authenticateUsernameless(
		options: PasskeyAuthOptions
	): Promise<PasskeyAuthResult> {
		console.log(`${MODULE_TAG} Starting username-less passkey authentication`, {
			environmentId: options.environmentId,
		});

		try {
			// Check WebAuthn support
			if (!PasskeyServiceV8.isSupported()) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
					requiresRegistration: false,
				};
			}

			// Get worker token
			const workerToken = await workerTokenServiceV8.getToken();
			if (!workerToken) {
				return {
					success: false,
					error: 'Worker token is required. Please generate a worker token first.',
					requiresRegistration: false,
				};
			}

			// Step 1: Get authentication options from backend
			// For username-less, we request options without username (discoverable credentials)
			const authOptionsResponse = await fetch('/api/auth/passkey/options/authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: options.environmentId,
					deviceAuthenticationPolicyId: options.deviceAuthenticationPolicyId,
					workerToken, // Include worker token for backend
				}),
			});

			if (!authOptionsResponse.ok) {
				const errorData = await authOptionsResponse.json().catch(() => ({}));
				const errorMessage = errorData.error || errorData.message || 'Failed to get authentication options';
				
				// If 404 or "no credentials", this means user needs to register
				if (authOptionsResponse.status === 404 || errorMessage.includes('no credentials') || errorMessage.includes('not found')) {
					return {
						success: false,
						error: 'No passkey found. Please register a passkey first.',
						requiresRegistration: true,
					};
				}

				return {
					success: false,
					error: errorMessage,
					requiresRegistration: false,
				};
			}

			const authOptionsData = await authOptionsResponse.json();
			const publicKeyOptions = authOptionsData.publicKey as PublicKeyCredentialRequestOptions;

			if (!publicKeyOptions) {
				return {
					success: false,
					error: 'Invalid authentication options from server',
					requiresRegistration: false,
				};
			}

			// Step 2: Perform WebAuthn authentication with discoverable credentials
			// For username-less, we don't restrict allowCredentials - let browser find any passkey
			// Convert challenge from base64/base64url to ArrayBuffer if needed
			// WebAuthn requires challenge to be ArrayBuffer, but server may send base64/base64url string
			const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
				// Handle base64url (WebAuthn standard): replace - with +, _ with /, add padding
				const base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
				const padded = base64Standard + '='.repeat((4 - (base64Standard.length % 4)) % 4);
				const binary = atob(padded);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) {
					bytes[i] = binary.charCodeAt(i);
				}
				return bytes.buffer;
			};

			let challengeBuffer: ArrayBuffer;
			const challenge = publicKeyOptions.challenge;
			if (typeof challenge === 'string') {
				challengeBuffer = base64ToArrayBuffer(challenge);
			} else if (challenge instanceof ArrayBuffer) {
				challengeBuffer = challenge;
			} else if (challenge instanceof Uint8Array) {
				challengeBuffer = challenge.buffer;
			} else {
				throw new Error('Invalid challenge format: must be string, ArrayBuffer, or Uint8Array');
			}

			// Build processed options - omit allowCredentials to allow discoverable credentials
			const processedPublicKey: PublicKeyCredentialRequestOptions = {
				challenge: challengeBuffer,
				rpId: publicKeyOptions.rpId,
				timeout: publicKeyOptions.timeout,
				userVerification: publicKeyOptions.userVerification,
				extensions: publicKeyOptions.extensions,
				// Don't include allowCredentials - this allows discoverable credentials
			};

			const getOptions: CredentialRequestOptions = {
				publicKey: processedPublicKey,
			};

			const credential = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;

			if (!credential) {
				return {
					success: false,
					error: 'Authentication was cancelled',
					requiresRegistration: true, // User might want to register
				};
			}

			// Step 3: Extract userHandle from response (this identifies the user)
			const response = credential.response as AuthenticatorAssertionResponse;
			const userHandle = response.userHandle
				? arrayBufferToBase64(response.userHandle)
				: null;

			if (!userHandle) {
				// No userHandle means this is not a discoverable credential
				return {
					success: false,
					error: 'This passkey is not a discoverable credential. Please use username-based authentication.',
					requiresRegistration: false,
				};
			}

			console.log(`${MODULE_TAG} WebAuthn authentication successful, userHandle extracted`, {
				userHandleLength: userHandle.length,
				credentialId: credential.id.substring(0, 20) + '...',
			});

			// Step 4: Verify authentication with backend
			// Reuse worker token from earlier in the function
			// Backend will:
			// - Decode userHandle to get userId/username
			// - Lookup user in PingOne
			// - Initialize MFA authentication
			// - Verify WebAuthn assertion
			// - Complete authentication
			const verifyResponse = await fetch('/api/auth/passkey/verify-authentication', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: options.environmentId,
					deviceAuthenticationPolicyId: options.deviceAuthenticationPolicyId,
					workerToken, // Include worker token
					credentialId: credential.id,
					rawId: arrayBufferToBase64(credential.rawId),
					response: {
						clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
						authenticatorData: arrayBufferToBase64(response.authenticatorData),
						signature: arrayBufferToBase64(response.signature),
						userHandle: userHandle,
					},
				}),
			});

			if (!verifyResponse.ok) {
				const errorData = await verifyResponse.json().catch(() => ({}));
				
				// Check for NO_USABLE_DEVICES error
				if (errorData.error === 'NO_USABLE_DEVICES' || errorData.error?.code === 'NO_USABLE_DEVICES') {
					return {
						success: false,
						error: errorData.message || errorData.error?.message || 'No usable devices found for authentication',
						requiresRegistration: false,
						errorCode: 'NO_USABLE_DEVICES',
						unavailableDevices: errorData.unavailableDevices || errorData.error?.unavailableDevices || [],
					};
				}

				return {
					success: false,
					error: errorData.error || errorData.message || 'Authentication verification failed',
					requiresRegistration: false,
				};
			}

			const verifyData = await verifyResponse.json();
			console.log(`${MODULE_TAG} Authentication verified successfully`, {
				userId: verifyData.userId,
				username: verifyData.username,
			});

			return {
				success: true,
				userId: verifyData.userId,
				username: verifyData.username,
				authenticationId: verifyData.authenticationId,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Username-less authentication error:`, error);

			let errorMessage = 'Authentication failed';
			let requiresRegistration = false;

			if (error instanceof DOMException) {
				switch (error.name) {
					case 'NotAllowedError':
						errorMessage = 'Authentication was cancelled';
						requiresRegistration = true;
						break;
					case 'InvalidStateError':
						errorMessage = 'No passkey found. Please register a passkey first.';
						requiresRegistration = true;
						break;
					case 'NotSupportedError':
						errorMessage = 'Passkeys are not supported on this device';
						break;
					default:
						errorMessage = error.message || 'Authentication failed';
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			return {
				success: false,
				error: errorMessage,
				requiresRegistration,
			};
		}
	}

	/**
	 * Register a new passkey for a user
	 * Note: Registration requires username because PingOne needs to identify/create the user
	 * Flow:
	 * 1. Lookup or create user in PingOne
	 * 2. Get registration options from PingOne
	 * 3. Perform WebAuthn create() with registration options
	 * 4. Activate FIDO2 device in PingOne with attestation
	 */
	static async registerPasskey(
		options: PasskeyRegistrationOptions
	): Promise<PasskeyRegistrationResult> {
		console.log(`${MODULE_TAG} Starting passkey registration`, {
			environmentId: options.environmentId,
			username: options.username,
		});

		try {
			// Check WebAuthn support
			if (!PasskeyServiceV8.isSupported()) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
				};
			}

			// Get worker token
			const workerToken = await workerTokenServiceV8.getToken();
			if (!workerToken) {
				return {
					success: false,
					error: 'Worker token is required. Please generate a worker token first.',
				};
			}

			// Step 1: Get registration options from backend
			// Backend will lookup/create user and get FIDO2 registration options from PingOne
			const regOptionsResponse = await fetch('/api/auth/passkey/options/registration', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: options.environmentId,
					username: options.username,
					deviceAuthenticationPolicyId: options.deviceAuthenticationPolicyId,
					deviceName: options.deviceName || 'My Passkey',
					workerToken, // Include worker token
				}),
			});

			if (!regOptionsResponse.ok) {
				const errorData = await regOptionsResponse.json().catch(() => ({}));
				const errorMessage = errorData.error || errorData.message || 'Failed to get registration options';
				
				// Check for NO_USABLE_DEVICES error
				if (errorData.code === 'NO_USABLE_DEVICES' || errorData.errorCode === 'NO_USABLE_DEVICES') {
					return {
						success: false,
						error: errorMessage,
						errorCode: 'NO_USABLE_DEVICES',
						unavailableDevices: errorData.unavailableDevices || [],
					};
				}
				
				return {
					success: false,
					error: errorMessage,
				};
			}

			const regOptionsData = await regOptionsResponse.json();
			const publicKeyOptions = regOptionsData.publicKey as PublicKeyCredentialCreationOptions;
			const deviceId = regOptionsData.deviceId as string;

			if (!publicKeyOptions || !deviceId) {
				return {
					success: false,
					error: 'Invalid registration options from server',
				};
			}

			// Step 2: Perform WebAuthn registration
			// Convert challenge and user.id from base64/base64url to ArrayBuffer if needed
			const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
				// Handle base64url (WebAuthn standard): replace - with +, _ with /, add padding
				const base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
				const padded = base64Standard + '='.repeat((4 - (base64Standard.length % 4)) % 4);
				const binary = atob(padded);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) {
					bytes[i] = binary.charCodeAt(i);
				}
				return bytes.buffer;
			};

			const processedPublicKey: PublicKeyCredentialCreationOptions = {
				...publicKeyOptions,
				// Convert challenge to ArrayBuffer if it's a string
				challenge: typeof publicKeyOptions.challenge === 'string'
					? base64ToArrayBuffer(publicKeyOptions.challenge)
					: publicKeyOptions.challenge instanceof ArrayBuffer
						? publicKeyOptions.challenge
						: publicKeyOptions.challenge instanceof Uint8Array
							? publicKeyOptions.challenge.buffer
							: publicKeyOptions.challenge,
				// Convert user.id to ArrayBuffer if it's a string
				user: publicKeyOptions.user
					? {
							...publicKeyOptions.user,
							id: typeof publicKeyOptions.user.id === 'string'
								? base64ToArrayBuffer(publicKeyOptions.user.id)
								: publicKeyOptions.user.id instanceof ArrayBuffer
									? publicKeyOptions.user.id
									: publicKeyOptions.user.id instanceof Uint8Array
										? publicKeyOptions.user.id.buffer
										: publicKeyOptions.user.id,
						}
					: publicKeyOptions.user,
			};

			const credential = (await navigator.credentials.create({
				publicKey: processedPublicKey,
			})) as PublicKeyCredential | null;

			if (!credential) {
				return {
					success: false,
					error: 'Registration was cancelled',
				};
			}

			// Step 3: Verify registration with backend
			// Reuse worker token from earlier in the function (line 309)
			// Backend will activate the FIDO2 device in PingOne with attestation
			const response = credential.response as AuthenticatorAttestationResponse;
			const verifyResponse = await fetch('/api/auth/passkey/verify-registration', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId: options.environmentId,
					username: options.username,
					deviceId: deviceId,
					workerToken, // Include worker token (reused from earlier)
					credentialId: credential.id,
					rawId: arrayBufferToBase64(credential.rawId),
					response: {
						clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
						attestationObject: arrayBufferToBase64(response.attestationObject),
					},
				}),
			});

			if (!verifyResponse.ok) {
				const errorData = await verifyResponse.json().catch(() => ({}));
				const errorMessage = errorData.error || errorData.message || 'Registration verification failed';
				
				// Check for NO_USABLE_DEVICES error
				if (errorData.code === 'NO_USABLE_DEVICES' || errorData.errorCode === 'NO_USABLE_DEVICES') {
					return {
						success: false,
						error: errorMessage,
						errorCode: 'NO_USABLE_DEVICES',
						unavailableDevices: errorData.unavailableDevices || [],
					};
				}
				
				return {
					success: false,
					error: errorMessage,
				};
			}

			const verifyData = await verifyResponse.json();
			console.log(`${MODULE_TAG} Passkey registered successfully`, {
				deviceId: verifyData.deviceId,
				userId: verifyData.userId,
			});

			return {
				success: true,
				deviceId: verifyData.deviceId,
				userId: verifyData.userId,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Passkey registration error:`, error);

			let errorMessage = 'Registration failed';
			if (error instanceof DOMException) {
				switch (error.name) {
					case 'NotAllowedError':
						errorMessage = 'Registration was cancelled';
						break;
					case 'NotSupportedError':
						errorMessage = 'Passkeys are not supported on this device';
						break;
					default:
						errorMessage = error.message || 'Registration failed';
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
				
				// Check if error has NO_USABLE_DEVICES error code
				if ((error as Error & { errorCode?: string }).errorCode === 'NO_USABLE_DEVICES') {
					const errorWithDevices = error as Error & { errorCode?: string; unavailableDevices?: Array<{ id: string }> };
					return {
						success: false,
						error: errorMessage,
						errorCode: 'NO_USABLE_DEVICES',
						unavailableDevices: errorWithDevices.unavailableDevices || [],
					};
				}
			}

			return {
				success: false,
				error: errorMessage,
			};
		}
	}
}

