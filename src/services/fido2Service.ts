// src/services/fido2Service.ts
// FIDO2/WebAuthn Service for Passkey Registration and Authentication

export interface FIDO2Credential {
	id: string;
	type: 'public-key';
	rawId: ArrayBuffer;
	response: {
		attestationObject: ArrayBuffer;
		clientDataJSON: ArrayBuffer;
	};
}

export interface FIDO2RegistrationResult {
	success: boolean;
	credentialId?: string;
	publicKey?: string;
	attestationObject?: string;
	clientDataJSON?: string;
	error?: string;
	userHandle?: string;
}

export interface FIDO2AuthenticationResult {
	success: boolean;
	credentialId?: string;
	signature?: string;
	error?: string;
	userHandle?: string;
}

export interface FIDO2Config {
	rpId: string;
	rpName: string;
	userDisplayName: string;
	userName: string;
	userHandle: string;
	challenge: string;
	timeout?: number;
	attestation?: 'none' | 'indirect' | 'direct';
	authenticatorSelection?: {
		authenticatorAttachment?: 'platform' | 'cross-platform';
		userVerification?: 'required' | 'preferred' | 'discouraged';
		residentKey?: 'required' | 'preferred' | 'discouraged';
	};
}

/**
 * FIDO2Service - Handles WebAuthn credential creation and verification
 *
 * This service provides:
 * 1. Passkey registration using WebAuthn API
 * 2. Passkey authentication/verification
 * 3. Support for both platform and cross-platform authenticators
 * 4. Proper error handling and user feedback
 */
// biome-ignore lint/complexity/noStaticOnlyClass: shared utility service for WebAuthn helpers
export class FIDO2Service {
	private static readonly DEFAULT_TIMEOUT = 60000; // 60 seconds
	private static readonly DEFAULT_RP_ID = window.location.hostname;

	/**
	 * Check if WebAuthn is supported in the current browser
	 */
	static isWebAuthnSupported(): boolean {
		return !!(
			window.PublicKeyCredential &&
			window.navigator.credentials &&
			window.navigator.credentials.create &&
			window.navigator.credentials.get
		);
	}

	/**
	 * Get WebAuthn capabilities
	 */
	static getCapabilities(): {
		webAuthnSupported: boolean;
		platformAuthenticator: boolean;
		crossPlatformAuthenticator: boolean;
		userVerification: boolean;
	} {
		const supported = FIDO2Service.isWebAuthnSupported();

		return {
			webAuthnSupported: supported,
			platformAuthenticator: supported && FIDO2Service.isPlatformAuthenticatorSupported(),
			crossPlatformAuthenticator: supported && FIDO2Service.isCrossPlatformAuthenticatorSupported(),
			userVerification: supported,
		};
	}

	/**
	 * Register a new FIDO2 credential (passkey)
	 */
	static async registerCredential(config: FIDO2Config): Promise<FIDO2RegistrationResult> {
		try {
			if (!FIDO2Service.isWebAuthnSupported()) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
				};
			}

			console.log('🔐 [FIDO2] Starting credential registration', {
				rpId: config.rpId,
				rpName: config.rpName,
				userName: config.userName,
			});

			// Convert challenge from base64 to ArrayBuffer
			const challengeBuffer = FIDO2Service.base64ToArrayBuffer(config.challenge);

			const authenticatorSelection: AuthenticatorSelectionCriteria = {
				userVerification: config.authenticatorSelection?.userVerification ?? 'preferred',
			};

			if (config.authenticatorSelection?.residentKey) {
				authenticatorSelection.residentKey = config.authenticatorSelection.residentKey;
			}

			if (config.authenticatorSelection?.authenticatorAttachment) {
				authenticatorSelection.authenticatorAttachment =
					config.authenticatorSelection.authenticatorAttachment;
			}

			// Create credential creation options
			const createOptions: CredentialCreationOptions = {
				publicKey: {
					rp: {
						id: config.rpId,
						name: config.rpName,
					},
					user: {
						id: new TextEncoder().encode(config.userHandle),
						name: config.userName,
						displayName: config.userDisplayName,
					},
					challenge: challengeBuffer,
					pubKeyCredParams: [
						{ type: 'public-key', alg: -7 }, // ES256
						{ type: 'public-key', alg: -257 }, // RS256
					],
					timeout: config.timeout || FIDO2Service.DEFAULT_TIMEOUT,
					attestation: config.attestation || 'none',
					authenticatorSelection,
				},
			};

			// Create the credential
			const credential = (await navigator.credentials.create(createOptions)) as PublicKeyCredential;

			if (!credential) {
				return {
					success: false,
					error: 'Credential creation was cancelled or failed',
				};
			}

			// Extract credential data
			const response = credential.response as AuthenticatorAttestationResponse & {
				getPublicKey?: () => ArrayBuffer | null;
			};
			const credentialId = FIDO2Service.arrayBufferToBase64(credential.rawId);
			const rawPublicKey = response.getPublicKey?.() || null;
			const publicKey = rawPublicKey ? FIDO2Service.arrayBufferToBase64(rawPublicKey) : undefined;
			const attestationObject = FIDO2Service.arrayBufferToBase64(response.attestationObject);
			const clientDataJSON = FIDO2Service.arrayBufferToBase64(response.clientDataJSON);

			console.log('✅ [FIDO2] Credential registered successfully', {
				credentialId: `${credentialId.substring(0, 20)}...`,
				hasPublicKey: !!publicKey,
				hasAttestation: !!attestationObject,
			});

			return {
				success: true,
				credentialId,
				...(publicKey ? { publicKey } : {}),
				attestationObject,
				clientDataJSON,
				userHandle: config.userHandle,
			};
		} catch (error: unknown) {
			console.error('❌ [FIDO2] Credential registration failed:', error);

			let errorMessage = 'Credential registration failed';
			if (error instanceof DOMException) {
				switch (error.name) {
					case 'NotAllowedError':
						errorMessage = 'Registration was cancelled or not allowed';
						break;
					case 'NotSupportedError':
						errorMessage = 'This authenticator is not supported';
						break;
					case 'SecurityError':
						errorMessage = 'Security error during registration';
						break;
					case 'InvalidStateError':
						errorMessage = 'Authenticator is already registered';
						break;
					case 'ConstraintError':
						errorMessage = 'Authenticator does not meet requirements';
						break;
					case 'TimeoutError':
						errorMessage = 'Registration timed out';
						break;
				}
			}

			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Authenticate using an existing FIDO2 credential
	 */
	static async authenticateCredential(
		credentialId: string,
		challenge: string,
		rpId?: string
	): Promise<FIDO2AuthenticationResult> {
		try {
			if (!FIDO2Service.isWebAuthnSupported()) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
				};
			}

			console.log('🔐 [FIDO2] Starting credential authentication', {
				credentialId: `${credentialId.substring(0, 20)}...`,
				rpId: rpId || FIDO2Service.DEFAULT_RP_ID,
			});

			// Convert challenge and credential ID to ArrayBuffers
			const challengeBuffer = FIDO2Service.base64ToArrayBuffer(challenge);
			const credentialIdBuffer = FIDO2Service.base64ToArrayBuffer(credentialId);

			// Create authentication options
			const getOptions: CredentialRequestOptions = {
				publicKey: {
					challenge: challengeBuffer,
					allowCredentials: [
						{
							type: 'public-key',
							id: credentialIdBuffer,
							transports: ['usb', 'nfc', 'ble', 'internal'],
						},
					],
					timeout: FIDO2Service.DEFAULT_TIMEOUT,
					userVerification: 'preferred',
					rpId: rpId || FIDO2Service.DEFAULT_RP_ID,
				},
			};

			// Get the credential
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

			console.log('✅ [FIDO2] Credential authenticated successfully', {
				credentialId: `${credentialId.substring(0, 20)}...`,
				hasSignature: !!signature,
			});

			return {
				success: true,
				credentialId,
				signature,
				...(userHandle ? { userHandle } : {}),
			};
		} catch (error: unknown) {
			console.error('❌ [FIDO2] Credential authentication failed:', error);

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
			}

			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Generate a random challenge for registration or authentication
	 */
	static generateChallenge(): string {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		return FIDO2Service.arrayBufferToBase64(array.buffer);
	}

	/**
	 * Check if platform authenticator is supported
	 */
	private static isPlatformAuthenticatorSupported(): boolean {
		try {
			// First check if the API method exists
			if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
				return false;
			}
			
			// For now, return true if the method exists
			// In a real implementation, you might want to call the async method
			// but for synchronous capability checking, this is sufficient
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Async check if platform authenticator is available
	 * This is the proper way to check for platform authenticator support
	 */
	static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
		try {
			if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
				return false;
			}
			
			const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
			return available;
		} catch {
			return false;
		}
	}

	/**
	 * Check if cross-platform authenticator is supported
	 */
	private static isCrossPlatformAuthenticatorSupported(): boolean {
		// Cross-platform authenticators are generally supported if WebAuthn is supported
		return FIDO2Service.isWebAuthnSupported();
	}

	/**
	 * Convert ArrayBuffer to base64 string
	 */
	private static arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private static base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	}

	/**
	 * Get user-friendly device type name
	 */
	static getDeviceTypeName(authenticatorAttachment?: string): string {
		switch (authenticatorAttachment) {
			case 'platform':
				return 'Built-in Authenticator (Touch ID, Face ID, Windows Hello)';
			case 'cross-platform':
				return 'External Security Key (YubiKey, etc.)';
			default:
				return 'Security Key';
		}
	}

	/**
	 * Get setup instructions for different authenticator types
	 */
	static getSetupInstructions(authenticatorAttachment?: string): string[] {
		switch (authenticatorAttachment) {
			case 'platform':
				return [
					"Use your device's built-in authenticator",
					'Touch ID, Face ID, or Windows Hello will be used',
					'Follow the on-screen prompts to complete setup',
				];
			case 'cross-platform':
				return [
					'Insert your external security key (YubiKey, etc.)',
					'Touch the key when prompted',
					'Follow the browser prompts to complete setup',
				];
			default:
				return [
					'Use any compatible security key or authenticator',
					'Follow the on-screen prompts',
					'Complete the setup process',
				];
		}
	}
}

export default FIDO2Service;
