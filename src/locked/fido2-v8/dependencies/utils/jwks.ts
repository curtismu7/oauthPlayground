// src/utils/jwks.ts - Core JWKS functionality for multi-flow reuse
import { createRemoteJWKSet, JWTPayload, JWTVerifyOptions, jwtVerify } from 'jose';
import { logger } from './logger';

// Re-export types for convenience
export type { JWTPayload, JWTVerifyOptions } from 'jose';

/**
 * Configuration for JWKS operations
 */
export interface JWKSConfig {
	/** JWKS URI endpoint */
	jwksUri: string;
	/** Cache timeout in milliseconds (default: 5 minutes) */
	cacheTimeout?: number;
	/** Cache tolerance in milliseconds (default: 1 minute) */
	cacheTolerance?: number;
	/** Request timeout in milliseconds (default: 30 seconds) */
	requestTimeout?: number;
	/** Backend proxy URL for CORS handling */
	backendProxyUrl?: string;
}

/**
 * Options for JWT token validation
 */
export interface TokenValidationOptions {
	/** Expected issuer(s) */
	issuer?: string | string[];
	/** Expected audience(s) */
	audience?: string | string[];
	/** Clock tolerance in seconds (default: 300) */
	clockTolerance?: number;
	/** Allowed algorithms (default: ['RS256', 'RS384', 'RS512']) */
	algorithms?: string[];
	/** Expected nonce for replay protection */
	nonce?: string;
	/** Maximum authentication age in seconds */
	maxAge?: number;
	/** Access token for at_hash validation */
	accessToken?: string;
}

/**
 * Result of JWT validation
 */
export interface ValidationResult {
	/** Whether validation was successful */
	valid: boolean;
	/** Decoded JWT payload */
	payload?: JWTPayload;
	/** JWT header */
	header?: any;
	/** Error message if validation failed */
	error?: string;
	/** Validated claims */
	claims?: Record<string, any>;
}

/**
 * JWKS key information
 */
export interface JWK {
	kty: string; // Key Type
	kid: string; // Key ID
	use: string; // Public Key Use
	alg: string; // Algorithm
	n?: string; // RSA Modulus
	e?: string; // RSA Exponent
	k?: string; // Symmetric Key
	x?: string; // X Coordinate
	y?: string; // Y Coordinate
	crv?: string; // Curve
	x5c?: string[]; // X.509 Certificate Chain
	x5t?: string; // X.509 Certificate SHA-1 Thumbprint
	x5t_S256?: string; // X.509 Certificate SHA-256 Thumbprint
}

/**
 * JWKS (JSON Web Key Set) structure
 */
export interface JWKS {
	keys: JWK[];
}

/**
 * Discover JWKS endpoint from OIDC discovery
 */
export async function discoverJWKS(discoveryEndpoint: string): Promise<string> {
	try {
		logger.info('JWKS', 'Discovering JWKS endpoint', { discoveryEndpoint });

		const response = await fetch(discoveryEndpoint, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Discovery failed: ${response.status} ${response.statusText}`);
		}

		const config = await response.json();

		if (!config.jwks_uri) {
			throw new Error('JWKS URI not found in discovery response');
		}

		logger.success('JWKS', 'JWKS endpoint discovered', { jwksUri: config.jwks_uri });
		return config.jwks_uri;
	} catch (error) {
		logger.error('JWKS', 'Failed to discover JWKS endpoint', error);
		throw error;
	}
}

/**
 * Create a remote JWKS set for signature verification
 */
export function createJWKSSet(jwksUri: string): ReturnType<typeof createRemoteJWKSet> {
	try {
		logger.info('JWKS', 'Creating remote JWKS set', { jwksUri });
		return createRemoteJWKSet(new URL(jwksUri));
	} catch (error) {
		logger.error('JWKS', 'Failed to create remote JWKS set', error);
		throw error;
	}
}

/**
 * Get signing key from JWKS
 */
export async function getSigningKey(jwksUri: string, kid: string): Promise<JWK | null> {
	try {
		logger.info('JWKS', 'Getting signing key', { jwksUri, kid });

		const response = await fetch(jwksUri, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
		}

		const jwks: JWKS = await response.json();
		const key = jwks.keys.find((k) => k.kid === kid);

		if (!key) {
			logger.warn('JWKS', 'Signing key not found', {
				kid,
				availableKids: jwks.keys.map((k) => k.kid),
			});
			return null;
		}

		logger.success('JWKS', 'Signing key found', { kid, keyType: key.kty, algorithm: key.alg });
		return key;
	} catch (error) {
		logger.error('JWKS', 'Failed to get signing key', error);
		throw error;
	}
}

/**
 * Decode JWT header without verification
 */
export function decodeJWTHeader(token: string): any {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format');
		}

		const header = JSON.parse(atob(parts[0]));
		logger.debug('JWKS', 'JWT header decoded', { alg: header.alg, kid: header.kid });
		return header;
	} catch (error) {
		logger.error('JWKS', 'Failed to decode JWT header', error);
		throw new Error(
			`Failed to decode JWT header: ${error instanceof Error ? error.message : 'Invalid format'}`
		);
	}
}

/**
 * Decode JWT payload without verification
 */
export function decodeJWTPayload(token: string): JWTPayload {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format');
		}

		const payload = JSON.parse(atob(parts[1]));
		logger.debug('JWKS', 'JWT payload decoded', {
			iss: payload.iss,
			aud: payload.aud,
			exp: payload.exp,
			sub: payload.sub,
		});
		return payload;
	} catch (error) {
		logger.error('JWKS', 'Failed to decode JWT payload', error);
		throw new Error(
			`Failed to decode JWT payload: ${error instanceof Error ? error.message : 'Invalid format'}`
		);
	}
}

/**
 * Validate JWT signature and claims
 */
export async function validateJWT(
	token: string,
	config: JWKSConfig,
	options: TokenValidationOptions = {}
): Promise<ValidationResult> {
	try {
		logger.info('JWKS', 'Starting JWT validation', {
			jwksUri: config.jwksUri,
			hasIssuer: !!options.issuer,
			hasAudience: !!options.audience,
			hasNonce: !!options.nonce,
		});

		// Create remote JWKS set
		const JWKS = createJWKSSet(config.jwksUri);

		// Prepare verification options
		const verifyOptions: JWTVerifyOptions = {
			issuer: options.issuer,
			audience: options.audience,
			clockTolerance: options.clockTolerance || 300, // 5 minutes default
			algorithms: options.algorithms || ['RS256', 'RS384', 'RS512'],
		};

		// Verify JWT signature and decode payload
		const { payload, protectedHeader } = await jwtVerify(token, JWKS, verifyOptions);

		logger.success('JWKS', 'JWT signature verified', {
			kid: protectedHeader.kid,
			alg: protectedHeader.alg,
			iss: payload.iss,
			aud: payload.aud,
			sub: payload.sub,
			exp: payload.exp,
		});

		// Additional claim validations
		const validationErrors: string[] = [];

		// Validate nonce if provided
		if (options.nonce) {
			if (!payload.nonce || payload.nonce !== options.nonce) {
				validationErrors.push(
					`Nonce validation failed: expected ${options.nonce}, got ${payload.nonce}`
				);
			}
		}

		// Validate max age if provided
		if (options.maxAge && options.maxAge > 0) {
			if (!payload.auth_time || typeof payload.auth_time !== 'number') {
				validationErrors.push('Missing auth_time claim when max_age is specified');
			} else {
				const now = Math.floor(Date.now() / 1000);
				const authAge = now - payload.auth_time;
				if (authAge > options.maxAge) {
					validationErrors.push(`Authentication too old: ${authAge}s > ${options.maxAge}s`);
				}
			}
		}

		// Validate at_hash if access token provided
		if (options.accessToken && payload.at_hash) {
			// Note: In a full implementation, you would verify the at_hash
			// For now, we just check that it exists
			logger.debug('JWKS', 'at_hash validation skipped (requires crypto implementation)');
		}

		if (validationErrors.length > 0) {
			const error = validationErrors.join('; ');
			logger.warn('JWKS', 'JWT validation failed', { errors: validationErrors });
			return {
				valid: false,
				error,
				payload,
				header: protectedHeader,
			};
		}

		logger.success('JWKS', 'JWT validation completed successfully');
		return {
			valid: true,
			payload,
			header: protectedHeader,
			claims: payload,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
		logger.error('JWKS', 'JWT validation failed', error);
		return {
			valid: false,
			error: errorMessage,
		};
	}
}

/**
 * Validate JWKS structure
 */
export function validateJWKSStructure(jwks: any): { valid: boolean; errors: string[] } {
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

	jwks.keys.forEach((key: any, index: number) => {
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
 * Find key by ID in JWKS
 */
export function findKeyByID(jwks: JWKS, kid: string): JWK | null {
	return jwks.keys.find((key) => key.kid === kid) || null;
}

/**
 * Find keys by algorithm in JWKS
 */
export function findKeysByAlgorithm(jwks: JWKS, alg: string): JWK[] {
	return jwks.keys.filter((key) => key.alg === alg);
}

/**
 * Find keys by use in JWKS
 */
export function findKeysByUse(jwks: JWKS, use: string): JWK[] {
	return jwks.keys.filter((key) => key.use === use);
}

/**
 * Get key statistics from JWKS
 */
export function getKeyStatistics(jwks: JWKS): {
	totalKeys: number;
	keyTypes: Record<string, number>;
	algorithms: Record<string, number>;
	uses: Record<string, number>;
} {
	const keyTypes: Record<string, number> = {};
	const algorithms: Record<string, number> = {};
	const uses: Record<string, number> = {};

	jwks.keys.forEach((key) => {
		keyTypes[key.kty] = (keyTypes[key.kty] || 0) + 1;
		algorithms[key.alg] = (algorithms[key.alg] || 0) + 1;
		uses[key.use] = (uses[key.use] || 0) + 1;
	});

	return {
		totalKeys: jwks.keys.length,
		keyTypes,
		algorithms,
		uses,
	};
}

/**
 * Format JWKS as pretty JSON string
 */
export function formatJWKS(jwks: JWKS): string {
	return JSON.stringify(jwks, null, 2);
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

/**
 * Build JWKS URI from issuer
 */
export function buildJWKSUri(issuer: string): string {
	// For PingOne, JWKS is typically at /as/jwks
	return `${issuer.replace(/\/$/, '')}/as/jwks`;
}

/**
 * Build discovery URI from issuer
 */
export function buildDiscoveryUri(issuer: string): string {
	// Standard OIDC discovery endpoint
	return `${issuer.replace(/\/$/, '')}/.well-known/openid_configuration`;
}

/**
 * Normalize issuer for validation (handle PingOne variations)
 */
export function normalizeIssuer(issuer: string): string[] {
	const normalized = issuer.replace(/\/$/, ''); // Remove trailing slash
	const withAs = normalized.endsWith('/as') ? normalized : `${normalized}/as`;
	const withoutAs = normalized.endsWith('/as') ? normalized.replace('/as', '') : normalized;

	return [withoutAs, withAs, normalized];
}
