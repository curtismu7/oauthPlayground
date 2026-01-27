/**
 * @file webauthn.ts
 * @module features/mfa
 * @description WebAuthn base64url and ArrayBuffer helpers
 * @version 1.0.0
 */

/**
 * Convert ArrayBuffer to base64url string
 */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	const binary = String.fromCharCode(...bytes);
	const base64 = btoa(binary);
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert base64url string to ArrayBuffer
 */
export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
	const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * Convert number array to Uint8Array
 */
export function numberArrayToUint8Array(arr: number[]): Uint8Array {
	return new Uint8Array(arr);
}

/**
 * Convert Uint8Array to number array
 */
export function uint8ArrayToNumberArray(arr: Uint8Array): number[] {
	return Array.from(arr);
}

/**
 * Convert PublicKeyCredential to JSON-serializable format
 */
export function credentialToJson(credential: PublicKeyCredential): {
	id: string;
	type: string;
	rawId: number[];
	response: {
		clientDataJSON: number[];
		attestationObject?: number[];
		authenticatorData?: number[];
		signature?: number[];
		userHandle?: number[] | null;
	};
} {
	const response = credential.response;

	if (response instanceof AuthenticatorAttestationResponse) {
		return {
			id: credential.id,
			type: credential.type,
			rawId: uint8ArrayToNumberArray(new Uint8Array(credential.rawId)),
			response: {
				clientDataJSON: uint8ArrayToNumberArray(new Uint8Array(response.clientDataJSON)),
				attestationObject: uint8ArrayToNumberArray(new Uint8Array(response.attestationObject)),
			},
		};
	}

	if (response instanceof AuthenticatorAssertionResponse) {
		return {
			id: credential.id,
			type: credential.type,
			rawId: uint8ArrayToNumberArray(new Uint8Array(credential.rawId)),
			response: {
				clientDataJSON: uint8ArrayToNumberArray(new Uint8Array(response.clientDataJSON)),
				authenticatorData: uint8ArrayToNumberArray(new Uint8Array(response.authenticatorData)),
				signature: uint8ArrayToNumberArray(new Uint8Array(response.signature)),
				userHandle: response.userHandle
					? uint8ArrayToNumberArray(new Uint8Array(response.userHandle))
					: null,
			},
		};
	}

	throw new Error('Unknown credential response type');
}

/**
 * Convert JSON format back to PublicKeyCredentialCreationOptions
 * (for PingOne API responses that return options as JSON)
 */
export function jsonToCreationOptions(
	json: string | PublicKeyCredentialCreationOptions
): PublicKeyCredentialCreationOptions {
	let options: PublicKeyCredentialCreationOptions;

	if (typeof json === 'string') {
		options = JSON.parse(json);
	} else {
		options = json;
	}

	// Convert byte arrays to Uint8Array
	if (Array.isArray(options.challenge)) {
		options.challenge = numberArrayToUint8Array(options.challenge) as BufferSource;
	}

	if (options.user && Array.isArray(options.user.id)) {
		options.user.id = numberArrayToUint8Array(options.user.id) as BufferSource;
	}

	if (Array.isArray(options.excludeCredentials)) {
		options.excludeCredentials = options.excludeCredentials.map((cred) => ({
			...cred,
			id: Array.isArray(cred.id) ? (numberArrayToUint8Array(cred.id) as BufferSource) : cred.id,
		})) as PublicKeyCredentialDescriptor[];
	}

	return options;
}

/**
 * Convert JSON format to PublicKeyCredentialRequestOptions
 */
export function jsonToRequestOptions(
	json: string | PublicKeyCredentialRequestOptions
): PublicKeyCredentialRequestOptions {
	let options: PublicKeyCredentialRequestOptions;

	if (typeof json === 'string') {
		options = JSON.parse(json);
	} else {
		options = json;
	}

	// Convert byte arrays to Uint8Array
	if (Array.isArray(options.challenge)) {
		options.challenge = numberArrayToUint8Array(options.challenge) as BufferSource;
	}

	if (Array.isArray(options.allowCredentials)) {
		options.allowCredentials = options.allowCredentials.map((cred) => ({
			...cred,
			id: Array.isArray(cred.id) ? (numberArrayToUint8Array(cred.id) as BufferSource) : cred.id,
		})) as PublicKeyCredentialDescriptor[];
	}

	return options;
}

/**
 * Get RP ID from current origin
 */
export function getRpId(): string {
	if (typeof window === 'undefined') {
		return 'localhost';
	}
	const hostname = window.location.hostname;
	return hostname === 'localhost' ? 'localhost' : hostname;
}

/**
 * Get RP name from current origin
 */
export function getRpName(): string {
	if (typeof window === 'undefined') {
		return 'Local Development';
	}
	const hostname = window.location.hostname;
	return hostname === 'localhost' ? 'Local Development' : hostname;
}
