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
import { workerTokenServiceV8 } from './workerTokenServiceV8';

const MODULE_TAG = '[🔐 WEBAUTHN-AUTHN-SERVICE-V8]';

export interface WebAuthnAuthenticationParams {
	challengeId?: string; // Optional if publicKeyOptions is provided
	rpId: string;
	userName: string;
	userVerification: 'required' | 'preferred' | 'discouraged';
	authenticatorSelection?: {
		authenticatorAttachment?: 'platform' | 'cross-platform';
		userVerification?: 'required' | 'preferred' | 'discouraged';
	};
	publicKeyOptions?: PublicKeyCredentialRequestOptions; // If provided, challengeId is not needed
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
	 * Get WebAuthn assertion from PublicKeyCredentialRequestOptions
	 * This method performs the WebAuthn get() call with the provided options
	 */
	static async getWebAuthnAssertion(
		publicKeyOptions: PublicKeyCredentialRequestOptions
	): Promise<WebAuthnAuthenticationResult> {
		console.log(`${MODULE_TAG} Getting WebAuthn assertion`, {
			hasPublicKeyOptions: !!publicKeyOptions,
			challengeType: publicKeyOptions.challenge?.constructor?.name,
			rpId: publicKeyOptions.rpId,
			timeout: publicKeyOptions.timeout,
		});

		try {
			// Check WebAuthn support
			if (!WebAuthnAuthenticationServiceV8.isWebAuthnSupported()) {
				return {
					success: false,
					error: 'WebAuthn is not supported in this browser',
				};
			}

			// Perform WebAuthn get() call
			const credential = (await navigator.credentials.get({
				publicKey: publicKeyOptions,
			})) as PublicKeyCredential;

			console.log(`${MODULE_TAG} WebAuthn assertion successful`, {
				credentialId: credential.id,
				rawIdLength: credential.rawId.byteLength,
				hasResponse: !!credential.response,
				responseType: credential.response?.constructor?.name,
			});

			// Extract assertion data
			const response = credential.response as AuthenticatorAssertionResponse;

			// Convert ArrayBuffer to base64 strings
			const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
				const bytes = new Uint8Array(buffer);
				let binary = '';
				for (let i = 0; i < bytes.byteLength; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				return btoa(binary);
			};

			return {
				success: true,
				credentialId: credential.id,
				rawId: arrayBufferToBase64(credential.rawId),
				signature: arrayBufferToBase64(response.signature),
				userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : undefined,
				clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
				authenticatorData: arrayBufferToBase64(response.authenticatorData),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} WebAuthn assertion failed:`, error);

			// Handle different error types
			if (error instanceof Error) {
				if (error.name === 'NotAllowedError') {
					return {
						success: false,
						error: 'User cancelled the authentication or the authenticator was blocked',
					};
				} else if (error.name === 'SecurityError') {
					return {
						success: false,
						error: 'Security error: The operation is not allowed',
					};
				} else if (error.name === 'InvalidStateError') {
					return {
						success: false,
						error: 'The authenticator is already registered',
					};
				} else if (error.name === 'NotSupportedError') {
					return {
						success: false,
						error: 'The authenticator does not support the requested operation',
					};
				}
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown WebAuthn error',
			};
		}
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
			const workerToken = await workerTokenServiceV8.getToken();
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
				const isMac =
					typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
				const preferPlatform =
					platformPreference.prefer ||
					isMac ||
					params.authenticatorSelection?.authenticatorAttachment === 'platform';

				const preparedOptions = await WebAuthnAuthenticationServiceV8.preparePublicKeyOptions(
					params.publicKeyOptions,
					currentHost,
					preferPlatform
				);

				console.log(`${MODULE_TAG} Using PingOne publicKeyOptions`, {
					hasAllowCredentials: !!preparedOptions.allowCredentials,
					allowCredentialsCount: preparedOptions.allowCredentials?.length || 0,
					authenticatorAttachment: (preparedOptions as { authenticatorAttachment?: unknown })
						.authenticatorAttachment,
					preferPlatform,
					challengeType: (preparedOptions as { challenge?: unknown }).challenge
						? (preparedOptions as { challenge: { constructor?: { name?: string } } }).challenge
								.constructor?.name
						: undefined,
					challengeLength: preparedOptions.challenge
						? preparedOptions.challenge instanceof ArrayBuffer
							? preparedOptions.challenge.byteLength
							: 'not ArrayBuffer'
						: 'missing',
					rpId: preparedOptions.rpId,
					timeout: preparedOptions.timeout,
					userVerification: preparedOptions.userVerification,
					allowCredentialsKeys: preparedOptions.allowCredentials
						? Object.keys(preparedOptions.allowCredentials)
						: [],
				});

				// CRITICAL: Validate allowCredentials IDs before WebAuthn call
				// Only validate if allowCredentials exists (it may have been removed for platform authenticator)
				if (
					preparedOptions.allowCredentials &&
					Array.isArray(preparedOptions.allowCredentials) &&
					preparedOptions.allowCredentials.length > 0
				) {
					preparedOptions.allowCredentials.forEach((cred: PublicKeyCredentialDescriptor, index) => {
						const id = cred.id as unknown;
						const idIsArrayBuffer = id instanceof ArrayBuffer;
						const idIsArrayBufferView =
							typeof id === 'object' && id !== null && ArrayBuffer.isView(id as ArrayBufferView);
						const isValid = idIsArrayBuffer || idIsArrayBufferView;
						if (!isValid) {
							console.error(
								`${MODULE_TAG} ❌ CRITICAL: allowCredentials[${index}].id is NOT ArrayBuffer/ArrayBufferView!`,
								{
									idType: typeof id,
									idConstructor:
										typeof id === 'object' && id !== null
											? (id as { constructor?: { name?: string } }).constructor?.name
											: undefined,
									isArrayBuffer: idIsArrayBuffer,
									isArrayBufferView: idIsArrayBufferView,
									isUint8Array: id instanceof Uint8Array,
									idValue: typeof id === 'string' ? id.slice(0, 50) : id,
								}
							);
							throw new Error(
								`allowCredentials[${index}].id must be ArrayBuffer or ArrayBufferView, but got ${typeof id}`
							);
						}
					});
					console.log(
						`${MODULE_TAG} ✅ All allowCredentials IDs validated - all are ArrayBuffer/ArrayBufferView`
					);
				}

				// CRITICAL: Log right before the WebAuthn call
				console.log(
					`${MODULE_TAG} 🔐 ABOUT TO CALL navigator.credentials.get() - Browser prompt should appear NOW!`,
					{
						timestamp: new Date().toISOString(),
						options: {
							hasChallenge: !!preparedOptions.challenge,
							challengeIsArrayBuffer: preparedOptions.challenge instanceof ArrayBuffer,
							challengeIsUint8Array: preparedOptions.challenge instanceof Uint8Array,
							rpId: preparedOptions.rpId,
							timeout: preparedOptions.timeout,
							hasAllowCredentials: !!preparedOptions.allowCredentials,
							allowCredentialsCount: preparedOptions.allowCredentials?.length || 0,
							allowCredentialsIdsValid:
								preparedOptions.allowCredentials?.every(
									(cred) =>
										cred.id instanceof ArrayBuffer || ArrayBuffer.isView(cred.id as ArrayBufferView)
								) || false,
						},
					}
				);

				let credential: PublicKeyCredential | null = null;
				try {
					credential = (await navigator.credentials.get({
						publicKey: preparedOptions,
					})) as PublicKeyCredential;

					console.log(`${MODULE_TAG} ✅ navigator.credentials.get() completed`, {
						hasCredential: !!credential,
						credentialId: `${credential?.id?.slice(0, 20) ?? ''}...`,
					});
				} catch (webauthnError) {
					console.error(`${MODULE_TAG} ❌ navigator.credentials.get() threw an error:`, {
						error: webauthnError,
						errorName: webauthnError instanceof Error ? webauthnError.name : 'Unknown',
						errorMessage:
							webauthnError instanceof Error ? webauthnError.message : String(webauthnError),
						errorStack: webauthnError instanceof Error ? webauthnError.stack : undefined,
					});
					throw webauthnError;
				}

				if (!credential) {
					return {
						success: false,
						error: 'Authentication was cancelled or failed',
					};
				}

				const response = credential.response as AuthenticatorAssertionResponse;
				const signature = FIDO2Service.arrayBufferToBase64url(response.signature);
				const userHandle = response.userHandle
					? FIDO2Service.arrayBufferToBase64url(response.userHandle)
					: undefined;
				const clientDataJSON = FIDO2Service.arrayBufferToBase64url(response.clientDataJSON);
				const authenticatorData = FIDO2Service.arrayBufferToBase64url(response.authenticatorData);
				const credentialId = credential.id;
				const rawId = FIDO2Service.arrayBufferToBase64url(credential.rawId);

				console.log(`${MODULE_TAG} WebAuthn authentication successful`, {
					credentialId: `${credentialId.slice(0, 20)}...`,
					hasSignature: !!signature,
				});

				return {
					success: true,
					credentialId,
					rawId,
					signature,
					...(userHandle ? { userHandle } : {}),
					clientDataJSON,
					authenticatorData,
				};
			}

			// Fallback: use challengeId directly if full options are not available
			// At this point, publicKeyOptions was not provided, so challengeId must be present
			if (!params.challengeId) {
				return {
					success: false,
					error:
						'Either challengeId or publicKeyOptions must be provided for WebAuthn authentication',
				};
			}

			const challenge: string = params.challengeId;

			// Check for session cookies and prefer platform authenticators if present
			// Per PingOne MFA API: If session cookie exists, prefer FIDO2 platform device even if not default
			const { getAuthenticatorSelectionPreferences } = await import(
				'./fido2SessionCookieServiceV8'
			);
			const authenticatorPrefs = getAuthenticatorSelectionPreferences();

			// Merge user-provided authenticator selection with session cookie preferences
			const authenticatorSelection = {
				...authenticatorPrefs,
				...(params.authenticatorSelection || {}),
				// Session cookie preferences take precedence
				...(authenticatorPrefs.authenticatorAttachment
					? {
							authenticatorAttachment: authenticatorPrefs.authenticatorAttachment,
						}
					: {}),
			};

			// Check if platform authenticator is available before setting authenticatorAttachment to 'platform'
			if (authenticatorSelection.authenticatorAttachment === 'platform') {
				try {
					const platformAvailable =
						await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
					if (!platformAvailable) {
						console.warn(
							`${MODULE_TAG} Platform authenticator requested but not available. Falling back to any authenticator.`
						);
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
					...(authenticatorSelection.authenticatorAttachment
						? {
								authenticatorAttachment: authenticatorSelection.authenticatorAttachment,
							}
						: {}),
				},
			};

			const publicKeyOptionsForLog = getOptions.publicKey as PublicKeyCredentialRequestOptions & {
				authenticatorAttachment?: 'platform' | 'cross-platform';
			};
			console.log(`${MODULE_TAG} Using fallback WebAuthn options (challengeId)`, {
				hasAuthenticatorAttachment: !!publicKeyOptionsForLog.authenticatorAttachment,
				authenticatorAttachment: publicKeyOptionsForLog.authenticatorAttachment,
				userVerification: publicKeyOptionsForLog.userVerification,
				rpId: publicKeyOptionsForLog.rpId,
			});

			// CRITICAL: Log right before the WebAuthn call
			console.log(
				`${MODULE_TAG} 🔐 ABOUT TO CALL navigator.credentials.get() (fallback path) - Browser prompt should appear NOW!`,
				{
					timestamp: new Date().toISOString(),
					options: {
						hasChallenge: !!getOptions.publicKey?.challenge,
						challengeIsArrayBuffer: getOptions.publicKey?.challenge instanceof ArrayBuffer,
						rpId: getOptions.publicKey?.rpId,
						timeout: getOptions.publicKey?.timeout,
						hasAllowCredentials: !!getOptions.publicKey?.allowCredentials,
						allowCredentialsCount: getOptions.publicKey?.allowCredentials?.length || 0,
					},
				}
			);

			let credential: PublicKeyCredential | null = null;
			try {
				credential = (await navigator.credentials.get(getOptions)) as PublicKeyCredential;

				console.log(`${MODULE_TAG} ✅ navigator.credentials.get() completed (fallback path)`, {
					hasCredential: !!credential,
					credentialId: `${credential?.id?.slice(0, 20) ?? ''}...`,
				});
			} catch (webauthnError) {
				console.error(
					`${MODULE_TAG} ❌ navigator.credentials.get() threw an error (fallback path):`,
					{
						error: webauthnError,
						errorName: webauthnError instanceof Error ? webauthnError.name : 'Unknown',
						errorMessage:
							webauthnError instanceof Error ? webauthnError.message : String(webauthnError),
						errorStack: webauthnError instanceof Error ? webauthnError.stack : undefined,
					}
				);
				throw webauthnError;
			}

			if (!credential) {
				console.warn(
					`${MODULE_TAG} ⚠️ navigator.credentials.get() returned null - user may have cancelled`
				);
				return {
					success: false,
					error: 'Authentication was cancelled or failed',
				};
			}

			// Extract authentication data
			const response = credential.response as AuthenticatorAssertionResponse;
			const signature = FIDO2Service.arrayBufferToBase64url(response.signature);
			const userHandle = response.userHandle
				? FIDO2Service.arrayBufferToBase64url(response.userHandle)
				: undefined;
			const clientDataJSON = FIDO2Service.arrayBufferToBase64url(response.clientDataJSON);
			const authenticatorData = FIDO2Service.arrayBufferToBase64url(response.authenticatorData);
			const credentialId = credential.id;
			const rawId = FIDO2Service.arrayBufferToBase64url(credential.rawId);

			console.log(`${MODULE_TAG} WebAuthn authentication successful`, {
				credentialId: `${credentialId.slice(0, 20)}...`,
				hasSignature: !!signature,
			});

			return {
				success: true,
				credentialId,
				rawId,
				signature,
				...(userHandle ? { userHandle } : {}),
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

		const clonedOptions: PublicKeyCredentialRequestOptions & {
			authenticatorAttachment?: 'platform' | 'cross-platform';
		} = {
			...options,
			rpId: resolvedRpId,
			challenge: challengeBytes,
		};

		// Check if platform authenticator is available
		let platformAvailable = false;
		if (preferPlatform) {
			try {
				platformAvailable =
					await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
				console.log(`${MODULE_TAG} Platform authenticator available: ${platformAvailable}`);
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to check platform authenticator availability:`, error);
				platformAvailable = false;
			}
		}

		// Handle allowCredentials
		if (options.allowCredentials) {
			// Check if any allowCredentials have 'internal' transport (platform authenticator)
			const hasPlatformTransport = options.allowCredentials.some((cred) =>
				cred.transports?.includes('internal')
			);

			// If platform is preferred and available, but allowCredentials doesn't include platform transports,
			// we should NOT restrict to only the allowCredentials - instead, allow any authenticator
			// This is because PingOne might return allowCredentials for cross-platform devices only,
			// but we want to use platform authenticator if available
			if (preferPlatform && platformAvailable && !hasPlatformTransport) {
				console.log(
					`${MODULE_TAG} Platform authenticator preferred but allowCredentials restricts to cross-platform only. Removing allowCredentials restriction to allow platform authenticator.`
				);
				// Explicitly remove allowCredentials - this allows any authenticator including platform
				const hadAllowCredentials = !!clonedOptions.allowCredentials;
				const allowCredentialsCount = clonedOptions.allowCredentials?.length || 0;
				delete clonedOptions.allowCredentials;
				clonedOptions.authenticatorAttachment = 'platform';
				console.log(`${MODULE_TAG} ✅ Removed allowCredentials restriction:`, {
					hadAllowCredentials,
					allowCredentialsCount,
					hasAllowCredentialsAfter: !!clonedOptions.allowCredentials,
					allowCredentialsValue: clonedOptions.allowCredentials,
					authenticatorAttachment: clonedOptions.authenticatorAttachment,
				});
			} else {
				// Process allowCredentials normally
				// Convert credential IDs from base64/base64url strings to ArrayBuffer
				clonedOptions.allowCredentials = options.allowCredentials.map((cred, index) => {
					const originalId = cred.id;
					const idType = typeof originalId;
					const isArrayBuffer = originalId instanceof ArrayBuffer;
					const isArrayBufferView = ArrayBuffer.isView(originalId);
					const isString = typeof originalId === 'string';
					const isArray = Array.isArray(originalId);

					console.log(`${MODULE_TAG} Processing allowCredentials[${index}]:`, {
						idType,
						isArrayBuffer,
						isArrayBufferView,
						isString,
						isArray,
						idPreview: isString ? `${(originalId as string).slice(0, 20)}...` : 'not a string',
					});

					let convertedId: Uint8Array;
					try {
						convertedId = WebAuthnAuthenticationServiceV8.toUint8Array(originalId);
						console.log(
							`${MODULE_TAG} ✅ Successfully converted credential ID[${index}] to Uint8Array:`,
							{
								originalType: idType,
								convertedLength: convertedId.byteLength,
								convertedIsUint8Array: convertedId instanceof Uint8Array,
							}
						);
					} catch (conversionError) {
						console.error(`${MODULE_TAG} ❌ Failed to convert credential ID[${index}]:`, {
							error: conversionError,
							originalIdType: idType,
							originalIdValue: isString ? (originalId as string).substring(0, 50) : originalId,
						});
						throw new Error(
							`Failed to convert credential ID at index ${index}: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`
						);
					}

					// Create a new PublicKeyCredentialDescriptor with the converted ID
					// This ensures TypeScript and runtime both see it as the correct type
					const descriptor: PublicKeyCredentialDescriptor = {
						type: cred.type || 'public-key',
						id: convertedId, // This is now a Uint8Array (ArrayBufferView)
						...(cred.transports ? { transports: cred.transports } : {}),
					};

					// Validate the descriptor before returning
					if (!(descriptor.id instanceof Uint8Array) && !ArrayBuffer.isView(descriptor.id)) {
						throw new Error(`Converted ID is not a valid ArrayBufferView: ${typeof descriptor.id}`);
					}

					return descriptor;
				});

				// If platform is preferred and available, and allowCredentials includes platform transports,
				// set authenticatorAttachment to platform
				if (preferPlatform && platformAvailable && hasPlatformTransport) {
					clonedOptions.authenticatorAttachment = 'platform';
					console.log(
						`${MODULE_TAG} Platform authenticator preferred - allowCredentials includes platform transports`
					);
				}
			}
		} else if (preferPlatform && platformAvailable) {
			// No allowCredentials restriction - allow platform authenticator
			clonedOptions.authenticatorAttachment = 'platform';
			console.log(
				`${MODULE_TAG} Platform authenticator preferred - no allowCredentials restriction, using platform`
			);
		}

		return clonedOptions;
	}

	private static resolveCompatibleRpId(
		providedRpId: string | undefined,
		currentHost: string
	): string {
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

	private static toUint8Array(
		bufferSource: BufferSource | string | number[] | unknown
	): Uint8Array {
		// Handle string (base64 or base64url) - convert to ArrayBuffer first
		if (typeof bufferSource === 'string') {
			try {
				// Handle base64url (WebAuthn standard): replace - with +, _ with /, add padding
				const base64Standard = bufferSource.replace(/-/g, '+').replace(/_/g, '/');
				const padded = base64Standard + '='.repeat((4 - (base64Standard.length % 4)) % 4);
				const binary = atob(padded);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) {
					bytes[i] = binary.charCodeAt(i);
				}
				console.log(`${MODULE_TAG} Converted base64/base64url string to Uint8Array:`, {
					originalLength: bufferSource.length,
					convertedLength: bytes.byteLength,
					isUint8Array: bytes instanceof Uint8Array,
					isArrayBufferView: ArrayBuffer.isView(bytes),
				});
				return bytes;
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to convert base64 string to Uint8Array:`, error);
				throw new Error(
					`Failed to convert base64 string to ArrayBuffer: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}

		// Handle number array (from JSON)
		if (Array.isArray(bufferSource)) {
			const bytes = new Uint8Array(bufferSource);
			console.log(`${MODULE_TAG} Converted number array to Uint8Array:`, {
				arrayLength: bufferSource.length,
				convertedLength: bytes.byteLength,
				isUint8Array: bytes instanceof Uint8Array,
			});
			return bytes;
		}

		// Handle ArrayBuffer
		if (bufferSource instanceof ArrayBuffer) {
			const bytes = new Uint8Array(bufferSource);
			console.log(`${MODULE_TAG} Converted ArrayBuffer to Uint8Array:`, {
				bufferLength: bufferSource.byteLength,
				convertedLength: bytes.byteLength,
			});
			return bytes;
		}

		// Handle ArrayBufferView (TypedArray, DataView, etc.)
		if (ArrayBuffer.isView(bufferSource)) {
			const bytes = new Uint8Array(
				bufferSource.buffer,
				bufferSource.byteOffset,
				bufferSource.byteLength
			);
			console.log(`${MODULE_TAG} Converted ArrayBufferView to Uint8Array:`, {
				viewType: bufferSource.constructor.name,
				convertedLength: bytes.byteLength,
			});
			return bytes;
		}

		// Handle plain object - might be a TypedArray that was JSON-serialized
		// When TypedArrays are JSON.stringify'd, they become objects with numeric keys
		if (typeof bufferSource === 'object' && bufferSource !== null && !Array.isArray(bufferSource)) {
			// Check if it looks like a serialized TypedArray (has numeric keys)
			const keys = Object.keys(bufferSource);
			const numericKeys = keys.filter((k) => /^\d+$/.test(k));

			if (numericKeys.length > 0 && numericKeys.length === keys.length) {
				// It's likely a serialized TypedArray - convert to number array first
				const values: number[] = [];
				for (let i = 0; i < numericKeys.length; i++) {
					const value = (bufferSource as Record<string, unknown>)[String(i)];
					if (typeof value === 'number') {
						values.push(value);
					} else {
						throw new Error(`Object at index ${i} is not a number: ${typeof value}`);
					}
				}
				const bytes = new Uint8Array(values);
				console.log(`${MODULE_TAG} Converted serialized TypedArray object to Uint8Array:`, {
					objectKeys: keys.length,
					convertedLength: bytes.byteLength,
					isUint8Array: bytes instanceof Uint8Array,
				});
				return bytes;
			}

			// Check if it has a 'data' property that might contain the array
			if ('data' in bufferSource && Array.isArray((bufferSource as { data: unknown }).data)) {
				const data = (bufferSource as { data: number[] }).data;
				const bytes = new Uint8Array(data);
				console.log(`${MODULE_TAG} Converted object.data array to Uint8Array:`, {
					dataLength: data.length,
					convertedLength: bytes.byteLength,
				});
				return bytes;
			}

			// Check if it has a 'buffer' property that might be an ArrayBuffer
			if ('buffer' in bufferSource && bufferSource.buffer instanceof ArrayBuffer) {
				const bytes = new Uint8Array(bufferSource.buffer);
				console.log(`${MODULE_TAG} Converted object.buffer to Uint8Array:`, {
					bufferLength: bufferSource.buffer.byteLength,
					convertedLength: bytes.byteLength,
				});
				return bytes;
			}
		}

		// If we get here, we don't know how to convert it
		console.error(`${MODULE_TAG} Cannot convert to Uint8Array:`, {
			type: typeof bufferSource,
			constructor: bufferSource?.constructor?.name,
			isNull: bufferSource === null,
			isArray: Array.isArray(bufferSource),
			isObject: typeof bufferSource === 'object',
			keys:
				typeof bufferSource === 'object' && bufferSource !== null ? Object.keys(bufferSource) : [],
			value: bufferSource,
		});
		throw new Error(
			`Cannot convert to Uint8Array: unsupported type ${typeof bufferSource}. Object keys: ${typeof bufferSource === 'object' && bufferSource !== null ? Object.keys(bufferSource).join(', ') : 'N/A'}`
		);
	}
}
