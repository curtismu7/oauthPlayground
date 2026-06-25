// src/utils/jwksConverter.ts
import { logger } from './logger';


export interface JWKSKey {
	kty: string;
	kid: string;
	use: string;
	alg: string;
	n?: string;
	e?: string;
	crv?: string;
	x?: string;
	y?: string;
	k?: string;
}

export interface JWKS {
	keys: JWKSKey[];
}

/**
 * Convert a private key to JWKS format
 * This extracts the public key components from a private key
 */
export async function convertPrivateKeyToJWKS(
	privateKeyPem: string,
	kid: string = 'default'
): Promise<JWKS> {
	try {
		logger.info('JWKSConverter', 'Converting private key to JWKS format', { kid });

		// Import the private key using Web Crypto API
		const { importPKCS8 } = await import('jose');
		const cryptoKey = await importPKCS8(privateKeyPem, 'RS256');

		// Export the public key directly as JWK to get real n and e values
		const publicJwk = await window.crypto.subtle.exportKey('jwk', cryptoKey);

		const jwksKey: JWKSKey = {
			kty: 'RSA',
			kid,
			use: 'sig',
			alg: 'RS256',
			n: publicJwk.n as string,
			e: publicJwk.e as string,
		};

		const jwks: JWKS = {
			keys: [jwksKey],
		};

		logger.success('JWKSConverter', 'Successfully converted private key to JWKS', {
			kid,
			keyType: jwksKey.kty,
			algorithm: jwksKey.alg,
		});

		return jwks;
	} catch (error) {
		logger.error('JWKSConverter', 'Failed to convert private key to JWKS', error);
		throw new Error(
			`Failed to convert private key to JWKS: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}


/**
 * Validate JWKS format
 */
export function validateJWKS(jwks: Record<string, unknown>): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!jwks || typeof jwks !== 'object') {
		errors.push('JWKS must be a valid JSON object');
		return { valid: false, errors };
	}

	if (!jwks.keys || !Array.isArray(jwks.keys)) {
		errors.push('JWKS must contain a "keys" array');
		return { valid: false, errors };
	}

	if (jwks.keys.length === 0) {
		errors.push('JWKS must contain at least one key');
		return { valid: false, errors };
	}

	(jwks.keys as Record<string, unknown>[]).forEach((key, index: number) => {
		if (!key.kty) {
			errors.push(`Key ${index}: missing "kty" (key type)`);
		}
		if (!key.kid) {
			errors.push(`Key ${index}: missing "kid" (key ID)`);
		}
		if (!key.use) {
			errors.push(`Key ${index}: missing "use" (public key use)`);
		}
		if (!key.alg) {
			errors.push(`Key ${index}: missing "alg" (algorithm)`);
		}

		// Validate key type specific fields
		if (key.kty === 'RSA') {
			if (!key.n) {
				errors.push(`RSA Key ${index}: missing "n" (modulus)`);
			}
			if (!key.e) {
				errors.push(`RSA Key ${index}: missing "e" (exponent)`);
			}
		} else if (key.kty === 'EC') {
			if (!key.crv) {
				errors.push(`EC Key ${index}: missing "crv" (curve)`);
			}
			if (!key.x) {
				errors.push(`EC Key ${index}: missing "x" (x coordinate)`);
			}
			if (!key.y) {
				errors.push(`EC Key ${index}: missing "y" (y coordinate)`);
			}
		} else if (key.kty === 'oct') {
			if (!key.k) {
				errors.push(`Symmetric Key ${index}: missing "k" (key value)`);
			}
		}
	});

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Format JWKS as pretty JSON string
 */
export function formatJWKS(jwks: JWKS): string {
	return JSON.stringify(jwks, null, 2);
}

/**
 * Check if a string looks like a private key
 */
export function isPrivateKey(text: string): boolean {
	return (
		text.includes('-----BEGIN PRIVATE KEY-----') || text.includes('-----BEGIN RSA PRIVATE KEY-----')
	);
}

/**
 * Check if a string looks like JWKS format
 */
export function isJWKS(text: string): boolean {
	try {
		const parsed = JSON.parse(text);
		return parsed && typeof parsed === 'object' && Array.isArray(parsed.keys);
	} catch {
		return false;
	}
}
