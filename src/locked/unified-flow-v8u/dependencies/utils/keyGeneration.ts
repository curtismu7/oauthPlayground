/**
 * @file keyGeneration.ts
 * @description Key and secret generation utilities for OAuth client authentication
 * @version 8.0.0
 * @since 2024-11-25
 *
 * Provides utilities for generating:
 * - Random client secrets
 * - RSA private/public key pairs
 * - JWT key IDs
 * - Cryptographically secure random strings
 */

const MODULE_TAG = '[🔐 KEY-GENERATION]';

export interface GeneratedKeyPair {
	privateKey: string;
	publicKey: string;
	keyId: string;
	algorithm: 'RS256';
}

export interface GeneratedSecret {
	secret: string;
	entropy: number;
	encoding: 'hex' | 'base64';
}

/**
 * Generate a cryptographically secure client secret
 * @param length - Length in bytes (default: 32 bytes = 256 bits)
 * @param encoding - Output encoding (hex or base64)
 * @returns Generated client secret with entropy info
 */
export const generateClientSecret = (
	length: number = 32,
	encoding: 'hex' | 'base64' = 'hex'
): GeneratedSecret => {
	console.log(`${MODULE_TAG} Generating client secret (${length} bytes, ${encoding})`);

	const array = new Uint8Array(length);
	window.crypto.getRandomValues(array);

	let secret: string;
	if (encoding === 'hex') {
		secret = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
	} else {
		secret = btoa(String.fromCharCode(...array));
	}

	const entropy = length * 8; // 8 bits per byte

	console.log(`${MODULE_TAG} ✅ Generated client secret (${entropy} bits entropy)`);

	return {
		secret,
		entropy,
		encoding,
	};
};

/**
 * Generate an RSA key pair for JWT signing
 * @param keySize - RSA key size in bits (2048 or 4096)
 * @returns Generated RSA key pair with key ID
 */
export const generateRSAKeyPair = async (
	keySize: 2048 | 4096 = 2048
): Promise<GeneratedKeyPair> => {
	console.log(`${MODULE_TAG} Generating RSA key pair (${keySize} bits)`);

	try {
		// Generate RSA key pair
		const keyPair = await window.crypto.subtle.generateKey(
			{
				name: 'RSASSA-PKCS1-v1_5',
				modulusLength: keySize,
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
				hash: 'SHA-256',
			},
			true, // extractable
			['sign', 'verify']
		);

		// Export private key in PKCS#8 format
		const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
		const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
		const privateKey = `-----BEGIN PRIVATE KEY-----\n${formatBase64(privateKeyBase64)}\n-----END PRIVATE KEY-----`;

		// Export public key in SPKI format
		const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
		const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
		const publicKey = `-----BEGIN PUBLIC KEY-----\n${formatBase64(publicKeyBase64)}\n-----END PUBLIC KEY-----`;

		// Generate key ID
		const keyId = generateKeyId();

		console.log(`${MODULE_TAG} ✅ Generated RSA key pair (keyId: ${keyId})`);

		return {
			privateKey,
			publicKey,
			keyId,
			algorithm: 'RS256',
		};
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Failed to generate RSA key pair:`, error);
		throw new Error(
			`Failed to generate RSA key pair: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
};

/**
 * Generate a unique key ID for JWT headers
 * @param prefix - Optional prefix (default: 'key')
 * @returns Generated key ID
 */
export const generateKeyId = (prefix: string = 'key'): string => {
	const timestamp = Date.now().toString(36);
	const random = window.crypto
		.getRandomValues(new Uint8Array(4))
		.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

	return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate a cryptographically secure random string
 * @param length - Length of string in characters
 * @param charset - Character set to use
 * @returns Random string
 */
export const generateRandomString = (
	length: number,
	charset: 'alphanumeric' | 'hex' | 'base64' | 'custom' = 'alphanumeric',
	customChars?: string
): string => {
	let chars: string;

	switch (charset) {
		case 'alphanumeric':
			chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			break;
		case 'hex':
			chars = '0123456789abcdef';
			break;
		case 'base64':
			chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
			break;
		case 'custom':
			if (!customChars) {
				throw new Error('Custom charset must be provided when using custom charset');
			}
			chars = customChars;
			break;
		default:
			chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	}

	const array = new Uint8Array(length);
	window.crypto.getRandomValues(array);

	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[array[i] % chars.length];
	}

	return result;
};

/**
 * Format base64 string with proper line breaks for PEM format
 * @param base64 - Base64 string to format
 * @param lineLength - Length of each line (default: 64)
 * @returns Formatted base64 string
 */
const formatBase64 = (base64: string, lineLength: number = 64): string => {
	const lines: string[] = [];
	for (let i = 0; i < base64.length; i += lineLength) {
		lines.push(base64.slice(i, i + lineLength));
	}
	return lines.join('\n');
};

/**
 * Validate a private key format
 * @param privateKey - Private key string to validate
 * @returns True if valid PKCS#8 PEM format
 */
export const validatePrivateKey = (privateKey: string): boolean => {
	try {
		// Check PEM format
		const pemRegex = /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/;
		if (!pemRegex.test(privateKey.trim())) {
			return false;
		}

		// Extract base64 content
		const base64Content = privateKey
			.replace(/-----BEGIN PRIVATE KEY-----/, '')
			.replace(/-----END PRIVATE KEY-----/, '')
			.replace(/\s/g, '');

		// Try to decode base64
		const binaryString = atob(base64Content);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		// Try to import as key (basic validation)
		window.crypto.subtle
			.importKey(
				'pkcs8',
				bytes.buffer,
				{
					name: 'RSASSA-PKCS1-v1_5',
					hash: 'SHA-256',
				},
				false, // not extractable for validation
				['sign']
			)
			.catch(() => {
				// Import failed, but that's ok for validation
			});

		return true;
	} catch (error) {
		console.error(`${MODULE_TAG} Private key validation failed:`, error);
		return false;
	}
};

/**
 * Extract public key from private key
 * @param privateKey - Private key in PKCS#8 PEM format
 * @returns Public key in SPKI PEM format
 */
export const extractPublicKey = async (privateKey: string): Promise<string> => {
	try {
		// Extract base64 content
		const base64Content = privateKey
			.replace(/-----BEGIN PRIVATE KEY-----/, '')
			.replace(/-----END PRIVATE KEY-----/, '')
			.replace(/\s/g, '');

		const binaryString = atob(base64Content);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		// Import private key
		const keyPair = await window.crypto.subtle.importKey(
			'pkcs8',
			bytes.buffer,
			{
				name: 'RSASSA-PKCS1-v1_5',
				hash: 'SHA-256',
			},
			true, // extractable
			['sign']
		);

		// Export public key
		const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair);
		const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
		const publicKey = `-----BEGIN PUBLIC KEY-----\n${formatBase64(publicKeyBase64)}\n-----END PUBLIC KEY-----`;

		return publicKey;
	} catch (error) {
		console.error(`${MODULE_TAG} Failed to extract public key:`, error);
		throw new Error(
			`Failed to extract public key: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
};

/**
 * Generate a client secret with specific format requirements
 * @param options - Generation options
 * @returns Formatted client secret
 */
export const generateFormattedClientSecret = (options: {
	prefix?: string;
	includeNumbers?: boolean;
	includeSymbols?: boolean;
	length?: number;
}): string => {
	const { prefix = '', includeNumbers = true, includeSymbols = false, length = 32 } = options;

	let charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	if (includeNumbers) charset += '0123456789';
	if (includeSymbols) charset += '!@#$%^&*';

	const randomPart = generateRandomString(length - prefix.length, 'custom', charset);
	return prefix + randomPart;
};

/**
 * Security strength assessment
 */
export const assessSecurityStrength = {
	/**
	 * Assess client secret strength
	 * @param secret - Client secret to assess
	 * @returns Security strength assessment
	 */
	clientSecret: (
		secret: string
	): {
		strength: 'weak' | 'medium' | 'strong' | 'very-strong';
		score: number;
		recommendations: string[];
	} => {
		const recommendations: string[] = [];
		let score = 0;

		// Length assessment
		if (secret.length >= 32) score += 3;
		else if (secret.length >= 16) score += 2;
		else if (secret.length >= 8) score += 1;
		else recommendations.push('Use at least 32 characters for maximum security');

		// Character variety
		if (/[a-z]/.test(secret)) score += 1;
		else recommendations.push('Include lowercase letters');

		if (/[A-Z]/.test(secret)) score += 1;
		else recommendations.push('Include uppercase letters');

		if (/[0-9]/.test(secret)) score += 1;
		else recommendations.push('Include numbers');

		if (/[^a-zA-Z0-9]/.test(secret)) score += 1;
		else recommendations.push('Include symbols for maximum security');

		// Determine strength
		let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
		if (score >= 6) strength = 'very-strong';
		else if (score >= 4) strength = 'strong';
		else if (score >= 2) strength = 'medium';
		else strength = 'weak';

		return { strength, score, recommendations };
	},

	/**
	 * Assess key pair strength
	 * @param keySize - RSA key size
	 * @returns Security strength assessment
	 */
	keyPair: (
		keySize: number
	): {
		strength: 'weak' | 'medium' | 'strong' | 'very-strong';
		recommendation: string;
		bitsOfSecurity: number;
	} => {
		switch (keySize) {
			case 2048:
				return {
					strength: 'strong',
					recommendation:
						'2048-bit RSA provides ~112 bits of security, suitable for most applications',
					bitsOfSecurity: 112,
				};
			case 4096:
				return {
					strength: 'very-strong',
					recommendation: '4096-bit RSA provides ~144 bits of security, maximum security',
					bitsOfSecurity: 144,
				};
			default:
				return {
					strength: 'weak',
					recommendation: 'Use at least 2048-bit RSA keys for security',
					bitsOfSecurity: keySize >= 2048 ? 80 : 0,
				};
		}
	},
};
