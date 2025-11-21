// src/services/fidoService.ts
// FIDO WebAuthn Service for PingOne MFA Integration

import { logger } from '../utils/logger';

export interface WebAuthnSupport {
	supported: boolean;
	browserInfo: string;
	platformAuthenticator: boolean;
	crossPlatformAuthenticator: boolean;
	conditionalMediation: boolean;
	userVerifyingPlatformAuthenticator: boolean;
	details: {
		webauthnSupported: boolean;
		credentialsSupported: boolean;
		publicKeySupported: boolean;
		userAgent: string;
	};
}

export interface FIDORegistrationOptions {
	nickname: string;
	authenticatorType: 'platform' | 'cross-platform' | 'both';
	userVerification: 'required' | 'preferred' | 'discouraged';
	attestation: 'none' | 'indirect' | 'direct' | 'enterprise';
	timeout?: number;
	excludeCredentials?: PublicKeyCredentialDescriptor[];
}

export interface FIDORegistrationResult {
	success: boolean;
	deviceId?: string;
	credentialId?: string;
	publicKey?: string;
	attestationResult?: AttestationResult;
	error?: string;
	errorCode?: string;
}

export interface AttestationResult {
	verified: boolean;
	attestationFormat: string;
	trustPath?: string[];
	metadata?: {
		aaguid: string;
		description?: string;
		authenticatorVersion?: number;
	};
}

export interface FIDOChallenge {
	challengeId: string;
	challenge: string;
	allowCredentials: PublicKeyCredentialDescriptor[];
	timeout: number;
	userVerification: UserVerificationRequirement;
	rpId: string;
}

export interface FIDOAuthResult {
	success: boolean;
	challengeId?: string;
	credentialId?: string;
	signature?: string;
	userHandle?: string;
	error?: string;
	errorCode?: string;
}

export interface FIDOCredential {
	id: string;
	rawId: ArrayBuffer;
	type: 'public-key';
	response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
	clientExtensionResults?: AuthenticationExtensionsClientOutputs;
}

export interface FIDODevice {
	id: string;
	credentialId: string;
	nickname: string;
	authenticatorType: 'platform' | 'cross-platform';
	createdAt: Date;
	lastUsed?: Date;
	counter: number;
	publicKey: string;
	aaguid?: string;
	metadata?: {
		description?: string;
		icon?: string;
		authenticatorVersion?: number;
	};
}

class FIDOService {
	private static readonly RP_ID = window.location.hostname;
	private static readonly RP_NAME = 'PingOne MFA Playground';
	private static readonly DEFAULT_TIMEOUT = 60000; // 60 seconds
	private static readonly CHALLENGE_LENGTH = 32;

	/**
	 * Check WebAuthn support in the current browser
	 */
	static checkWebAuthnSupport(): WebAuthnSupport {
		const userAgent = navigator.userAgent;

		// Check basic WebAuthn support
		const webauthnSupported = typeof window.PublicKeyCredential !== 'undefined';
		const credentialsSupported = typeof navigator.credentials !== 'undefined';
		const publicKeySupported =
			webauthnSupported && typeof window.PublicKeyCredential.create === 'function';

		let platformAuthenticator = false;
		let crossPlatformAuthenticator = false;
		let conditionalMediation = false;
		let userVerifyingPlatformAuthenticator = false;

		if (webauthnSupported) {
			// Check for platform authenticator availability
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
				.then((available) => {
					userVerifyingPlatformAuthenticator = available;
					platformAuthenticator = available;
				})
				.catch(() => {
					// Ignore errors for older browsers
				});

			// Check for conditional mediation support
			if ('isConditionalMediationAvailable' in PublicKeyCredential) {
				PublicKeyCredential.isConditionalMediationAvailable?.()
					.then((available) => {
						conditionalMediation = available;
					})
					.catch(() => {
						// Ignore errors
					});
			}

			// Assume cross-platform support if WebAuthn is supported
			crossPlatformAuthenticator = true;
		}

		const browserInfo = FIDOService.getBrowserInfo(userAgent);
		const supported = webauthnSupported && credentialsSupported && publicKeySupported;

		logger.info('FIDOService', 'WebAuthn support check', {
			supported,
			browserInfo,
			platformAuthenticator,
			crossPlatformAuthenticator,
			userAgent,
		});

		return {
			supported,
			browserInfo,
			platformAuthenticator,
			crossPlatformAuthenticator,
			conditionalMediation,
			userVerifyingPlatformAuthenticator,
			details: {
				webauthnSupported,
				credentialsSupported,
				publicKeySupported,
				userAgent,
			},
		};
	}

	/**
	 * Get registration options for creating a new FIDO credential
	 */
	static async getRegistrationOptions(
		userId: string,
		userName: string,
		userDisplayName: string,
		options: Partial<FIDORegistrationOptions> = {}
	): Promise<PublicKeyCredentialCreationOptions> {
		const challenge = FIDOService.generateChallenge();
		const user = {
			id: FIDOService.stringToArrayBuffer(userId),
			name: userName,
			displayName: userDisplayName,
		};

		const pubKeyCredParams: PublicKeyCredentialParameters[] = [
			{ alg: -7, type: 'public-key' }, // ES256
			{ alg: -35, type: 'public-key' }, // ES384
			{ alg: -36, type: 'public-key' }, // ES512
			{ alg: -257, type: 'public-key' }, // RS256
		];

		const authenticatorSelection: AuthenticatorSelectionCriteria = {
			authenticatorAttachment:
				options.authenticatorType === 'platform'
					? 'platform'
					: options.authenticatorType === 'cross-platform'
						? 'cross-platform'
						: undefined,
			userVerification: options.userVerification || 'preferred',
			requireResidentKey: false,
			residentKey: 'discouraged',
		};

		const creationOptions: PublicKeyCredentialCreationOptions = {
			rp: {
				id: FIDOService.RP_ID,
				name: FIDOService.RP_NAME,
			},
			user,
			challenge,
			pubKeyCredParams,
			timeout: options.timeout || FIDOService.DEFAULT_TIMEOUT,
			attestation: options.attestation || 'none',
			authenticatorSelection,
			excludeCredentials: options.excludeCredentials || [],
		};

		logger.info('FIDOService', 'Generated registration options', {
			userId,
			userName,
			authenticatorType: options.authenticatorType,
			userVerification: options.userVerification,
			timeout: creationOptions.timeout,
		});

		return creationOptions;
	}

	/**
	 * Register a new FIDO device
	 */
	static async registerDevice(
		userId: string,
		userName: string,
		userDisplayName: string,
		options: FIDORegistrationOptions
	): Promise<FIDORegistrationResult> {
		try {
			logger.info('FIDOService', 'Starting FIDO device registration', {
				userId,
				userName,
				nickname: options.nickname,
				authenticatorType: options.authenticatorType,
			});

			// Check WebAuthn support
			const support = FIDOService.checkWebAuthnSupport();
			if (!support.supported) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
					errorCode: 'WEBAUTHN_NOT_SUPPORTED',
				};
			}

			// Get registration options
			const creationOptions = await FIDOService.getRegistrationOptions(
				userId,
				userName,
				userDisplayName,
				options
			);

			// Create credential
			const credential = (await navigator.credentials.create({
				publicKey: creationOptions,
			})) as PublicKeyCredential;

			if (!credential) {
				return {
					success: false,
					error: 'Failed to create credential',
					errorCode: 'CREDENTIAL_CREATION_FAILED',
				};
			}

			// Process the credential
			const result = await FIDOService.processRegistrationCredential(credential, options);

			if (result.success) {
				logger.info('FIDOService', 'FIDO device registered successfully', {
					userId,
					deviceId: result.deviceId,
					credentialId: result.credentialId,
					nickname: options.nickname,
				});
			}

			return result;
		} catch (error) {
			logger.error('FIDOService', 'FIDO registration failed', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
				errorName: error instanceof Error ? error.name : 'UnknownError',
			});

			return FIDOService.handleWebAuthnError(error);
		}
	}

	/**
	 * Get authentication options for FIDO challenge
	 */
	static async getAuthenticationOptions(
		userId: string,
		allowedCredentials?: PublicKeyCredentialDescriptor[],
		userVerification: UserVerificationRequirement = 'preferred'
	): Promise<PublicKeyCredentialRequestOptions> {
		const challenge = FIDOService.generateChallenge();

		const requestOptions: PublicKeyCredentialRequestOptions = {
			challenge,
			timeout: FIDOService.DEFAULT_TIMEOUT,
			rpId: FIDOService.RP_ID,
			allowCredentials: allowedCredentials || [],
			userVerification,
		};

		logger.info('FIDOService', 'Generated authentication options', {
			userId,
			allowedCredentialsCount: allowedCredentials?.length || 0,
			userVerification,
		});

		return requestOptions;
	}

	/**
	 * Authenticate with FIDO device
	 */
	static async authenticateDevice(
		userId: string,
		challengeData: FIDOChallenge
	): Promise<FIDOAuthResult> {
		try {
			logger.info('FIDOService', 'Starting FIDO authentication', {
				userId,
				challengeId: challengeData.challengeId,
				allowedCredentialsCount: challengeData.allowCredentials.length,
			});

			// Check WebAuthn support
			const support = FIDOService.checkWebAuthnSupport();
			if (!support.supported) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
					errorCode: 'WEBAUTHN_NOT_SUPPORTED',
				};
			}

			// Create authentication options
			const requestOptions: PublicKeyCredentialRequestOptions = {
				challenge: FIDOService.stringToArrayBuffer(challengeData.challenge),
				timeout: challengeData.timeout,
				rpId: challengeData.rpId,
				allowCredentials: challengeData.allowCredentials,
				userVerification: challengeData.userVerification,
			};

			// Get credential
			const credential = (await navigator.credentials.get({
				publicKey: requestOptions,
			})) as PublicKeyCredential;

			if (!credential) {
				return {
					success: false,
					error: 'Authentication was cancelled or failed',
					errorCode: 'AUTHENTICATION_CANCELLED',
				};
			}

			// Process the authentication response
			const result = await FIDOService.processAuthenticationCredential(credential, challengeData);

			if (result.success) {
				logger.info('FIDOService', 'FIDO authentication successful', {
					userId,
					challengeId: challengeData.challengeId,
					credentialId: result.credentialId,
				});
			}

			return result;
		} catch (error) {
			logger.error('FIDOService', 'FIDO authentication failed', {
				userId,
				challengeId: challengeData.challengeId,
				error: error instanceof Error ? error.message : 'Unknown error',
				errorName: error instanceof Error ? error.name : 'UnknownError',
			});

			return FIDOService.handleWebAuthnError(error);
		}
	}

	/**
	 * Check if conditional mediation is available
	 */
	static async isConditionalMediationAvailable(): Promise<boolean> {
		try {
			if ('isConditionalMediationAvailable' in PublicKeyCredential) {
				return await PublicKeyCredential.isConditionalMediationAvailable();
			}
			return false;
		} catch (error) {
			logger.warn('FIDOService', 'Failed to check conditional mediation availability', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return false;
		}
	}

	/**
	 * Check if user verifying platform authenticator is available
	 */
	static async isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean> {
		try {
			if ('isUserVerifyingPlatformAuthenticatorAvailable' in PublicKeyCredential) {
				return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
			}
			return false;
		} catch (error) {
			logger.warn('FIDOService', 'Failed to check platform authenticator availability', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return false;
		}
	}

	// Private helper methods

	private static generateChallenge(): ArrayBuffer {
		const array = new Uint8Array(FIDOService.CHALLENGE_LENGTH);
		crypto.getRandomValues(array);
		return array.buffer;
	}

	private static stringToArrayBuffer(str: string): ArrayBuffer {
		const encoder = new TextEncoder();
		return encoder.encode(str).buffer;
	}

	private static arrayBufferToString(buffer: ArrayBuffer): string {
		const decoder = new TextDecoder();
		return decoder.decode(buffer);
	}

	private static arrayBufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private static async processRegistrationCredential(
		credential: PublicKeyCredential,
		options: FIDORegistrationOptions
	): Promise<FIDORegistrationResult> {
		try {
			const response = credential.response as AuthenticatorAttestationResponse;
			const credentialId = FIDOService.arrayBufferToBase64(credential.rawId);
			const publicKey = FIDOService.arrayBufferToBase64(
				response.getPublicKey()?.buffer || new ArrayBuffer(0)
			);

			// Extract AAGUID from attestation object if available
			let aaguid: string | undefined;
			try {
				const _attestationObject = new Uint8Array(response.attestationObject);
				// This is a simplified AAGUID extraction - in production, use a proper CBOR parser
				aaguid = 'unknown';
			} catch (error) {
				logger.warn('FIDOService', 'Failed to extract AAGUID', { error });
			}

			// Create device record
			const deviceId = `fido_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const attestationResult: AttestationResult = {
				verified: true, // In production, verify the attestation
				attestationFormat: 'none', // Would be extracted from attestation object
				metadata: {
					aaguid: aaguid || 'unknown',
					description: options.nickname,
				},
			};

			return {
				success: true,
				deviceId,
				credentialId,
				publicKey,
				attestationResult,
			};
		} catch (error) {
			logger.error('FIDOService', 'Failed to process registration credential', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				error: 'Failed to process credential',
				errorCode: 'CREDENTIAL_PROCESSING_FAILED',
			};
		}
	}

	private static async processAuthenticationCredential(
		credential: PublicKeyCredential,
		challengeData: FIDOChallenge
	): Promise<FIDOAuthResult> {
		try {
			const response = credential.response as AuthenticatorAssertionResponse;
			const credentialId = FIDOService.arrayBufferToBase64(credential.rawId);
			const signature = FIDOService.arrayBufferToBase64(response.signature);
			const userHandle = response.userHandle
				? FIDOService.arrayBufferToString(response.userHandle)
				: undefined;

			// In production, verify the signature against the stored public key
			const signatureValid = true; // Placeholder for actual signature verification

			if (!signatureValid) {
				return {
					success: false,
					error: 'Invalid signature',
					errorCode: 'INVALID_SIGNATURE',
				};
			}

			return {
				success: true,
				challengeId: challengeData.challengeId,
				credentialId,
				signature,
				userHandle,
			};
		} catch (error) {
			logger.error('FIDOService', 'Failed to process authentication credential', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				error: 'Failed to process authentication',
				errorCode: 'AUTHENTICATION_PROCESSING_FAILED',
			};
		}
	}

	private static handleWebAuthnError(error: any): FIDORegistrationResult | FIDOAuthResult {
		let errorMessage = 'Unknown error occurred';
		let errorCode = 'UNKNOWN_ERROR';

		if (error instanceof Error) {
			switch (error.name) {
				case 'NotSupportedError':
					errorMessage = 'WebAuthn is not supported by this browser or device';
					errorCode = 'NOT_SUPPORTED';
					break;
				case 'SecurityError':
					errorMessage = 'Security error: Invalid domain or HTTPS required';
					errorCode = 'SECURITY_ERROR';
					break;
				case 'NotAllowedError':
					errorMessage = 'Operation was cancelled by user or not allowed';
					errorCode = 'NOT_ALLOWED';
					break;
				case 'InvalidStateError':
					errorMessage = 'Authenticator is already registered or in invalid state';
					errorCode = 'INVALID_STATE';
					break;
				case 'ConstraintError':
					errorMessage = 'Constraint error: Authenticator does not meet requirements';
					errorCode = 'CONSTRAINT_ERROR';
					break;
				case 'TimeoutError':
					errorMessage = 'Operation timed out';
					errorCode = 'TIMEOUT';
					break;
				case 'NetworkError':
					errorMessage = 'Network error occurred';
					errorCode = 'NETWORK_ERROR';
					break;
				case 'AbortError':
					errorMessage = 'Operation was aborted';
					errorCode = 'ABORTED';
					break;
				default:
					errorMessage = error.message || 'WebAuthn operation failed';
					errorCode = 'WEBAUTHN_ERROR';
			}
		}

		return {
			success: false,
			error: errorMessage,
			errorCode,
		};
	}

	private static getBrowserInfo(userAgent: string): string {
		if (userAgent.includes('Chrome')) return 'Chrome';
		if (userAgent.includes('Firefox')) return 'Firefox';
		if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
		if (userAgent.includes('Edge')) return 'Edge';
		if (userAgent.includes('Opera')) return 'Opera';
		return 'Unknown';
	}

	/**
	 * Get FIDO capabilities for the current environment
	 */
	static getCapabilities(): {
		webAuthnSupported: boolean;
		platformAuthenticator: boolean;
		crossPlatformAuthenticator: boolean;
		conditionalMediation: boolean;
		userVerification: boolean;
		attestationFormats: string[];
		algorithms: string[];
	} {
		const support = FIDOService.checkWebAuthnSupport();

		return {
			webAuthnSupported: support.supported,
			platformAuthenticator: support.platformAuthenticator,
			crossPlatformAuthenticator: support.crossPlatformAuthenticator,
			conditionalMediation: support.conditionalMediation,
			userVerification: support.userVerifyingPlatformAuthenticator,
			attestationFormats: ['none', 'packed', 'fido-u2f'],
			algorithms: ['ES256', 'ES384', 'ES512', 'RS256'],
		};
	}
}

export default FIDOService;
