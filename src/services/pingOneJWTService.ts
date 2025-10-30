// src/services/pingOneJWTService.ts
/**
 * PingOne JWT Creation Service
 * 
 * Provides utilities for creating PingOne-specific JWTs:
 * - login_hint_token JWT
 * - request property JWT
 * - private key JWT (for client authentication)
 * 
 * Supports keypair generation (RSA/ECDSA) and JWT signing.
 */

import { SignJWT, importPKCS8, importJWK, KeyLike, exportJWK } from 'jose';
import { logger } from '../utils/logger';

export interface KeyPair {
	privateKey: string; // PEM format
	publicKey: string; // PEM format
	jwk: {
		private: JsonWebKey;
		public: JsonWebKey;
	};
	keyId?: string;
}

export interface LoginHintTokenPayload {
	username?: string;
	email?: string;
	phone?: string;
	sub?: string; // Subject identifier
	[i: string]: unknown; // Allow additional claims
}

export interface RequestPropertyPayload {
	// Standard OAuth authorization request parameters as JWT claims
	client_id: string;
	redirect_uri?: string;
	response_type: string;
	scope?: string;
	state?: string;
	nonce?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	[i: string]: unknown; // Allow additional claims
}

export interface PrivateKeyJWTConfig {
	clientId: string;
	audience: string; // Token endpoint URL
	privateKey: string; // PEM format
	keyId?: string;
	expirationTime?: string | number; // Default: '5m'
	additionalClaims?: Record<string, unknown>;
}

export class PingOneJWTService {
	/**
	 * Generate RSA keypair
	 */
	static async generateRSAKeyPair(keySize: 2048 | 3072 | 4096 = 2048): Promise<KeyPair> {
		try {
			logger.info('PingOneJWTService', 'Generating RSA keypair', { keySize });

			// Generate keypair using Web Crypto API
			const cryptoKeyPair = await crypto.subtle.generateKey(
				{
					name: 'RSASSA-PKCS1-v1_5',
					modulusLength: keySize,
					publicExponent: new Uint8Array([1, 0, 1]), // 65537
					hash: 'SHA-256',
				},
				true, // Extractable
				['sign', 'verify']
			);

			// Export keys to JWK format
			const privateJWK = await exportJWK(cryptoKeyPair.privateKey);
			const publicJWK = await exportJWK(cryptoKeyPair.publicKey);

			// Convert to PEM format (simplified - in production use proper PEM conversion)
			// For now, we'll use JWK format and let jose handle it
			const keyId = `key-${Date.now()}`;

			logger.success('PingOneJWTService', 'RSA keypair generated', { keyId, keySize });

			return {
				privateKey: JSON.stringify(privateJWK),
				publicKey: JSON.stringify(publicJWK),
				jwk: {
					private: privateJWK,
					public: publicJWK,
				},
				keyId,
			};
		} catch (error) {
			logger.error('PingOneJWTService', 'Failed to generate RSA keypair', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Generate ECDSA keypair
	 */
	static async generateECDSAKeyPair(
		curve: 'P-256' | 'P-384' | 'P-521' = 'P-256'
	): Promise<KeyPair> {
		try {
			logger.info('PingOneJWTService', 'Generating ECDSA keypair', { curve });

			const cryptoKeyPair = await crypto.subtle.generateKey(
				{
					name: 'ECDSA',
					namedCurve: curve,
				},
				true, // Extractable
				['sign', 'verify']
			);

			const privateJWK = await exportJWK(cryptoKeyPair.privateKey);
			const publicJWK = await exportJWK(cryptoKeyPair.publicKey);

			const keyId = `key-${Date.now()}`;

			logger.success('PingOneJWTService', 'ECDSA keypair generated', { keyId, curve });

			return {
				privateKey: JSON.stringify(privateJWK),
				publicKey: JSON.stringify(publicJWK),
				jwk: {
					private: privateJWK,
					public: publicJWK,
				},
				keyId,
			};
		} catch (error) {
			logger.error('PingOneJWTService', 'Failed to generate ECDSA keypair', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Create login_hint_token JWT
	 * Used to pre-populate user identification in authentication flows
	 */
	static async createLoginHintToken(
		payload: LoginHintTokenPayload,
		privateKey: string | JsonWebKey,
		algorithm: 'RS256' | 'ES256' = 'RS256',
		keyId?: string
	): Promise<string> {
		try {
			logger.info('PingOneJWTService', 'Creating login_hint_token JWT', {
				hasUsername: !!payload.username,
				hasEmail: !!payload.email,
				algorithm,
			});

		// Import private key - handle both JWK (JSON string) and PEM formats
		let key: KeyLike;
		if (typeof privateKey === 'string') {
			try {
				// Try parsing as JWK first
				const jwk = JSON.parse(privateKey);
				key = await importJWK(jwk, algorithm);
			} catch {
				// If not JSON, assume PEM format
				key = await importPKCS8(privateKey, algorithm);
			}
		} else {
			// Already a JWK object
			key = await importJWK(privateKey, algorithm);
		}

			// Build JWT header
			const header: Record<string, unknown> = {
				alg: algorithm,
				typ: 'JWT',
			};
			if (keyId) header.kid = keyId;

			// Create and sign JWT
			const jwt = new SignJWT(payload)
				.setProtectedHeader(header)
				.setIssuedAt()
				.setExpirationTime('1h'); // Login hints typically expire in 1 hour

			const token = await jwt.sign(key);

			logger.success('PingOneJWTService', 'login_hint_token JWT created', {
				algorithm,
				tokenLength: token.length,
			});

			return token;
		} catch (error) {
			logger.error('PingOneJWTService', 'Failed to create login_hint_token JWT', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Create request property JWT
	 * Contains authorization request parameters as JWT claims
	 */
	static async createRequestPropertyJWT(
		payload: RequestPropertyPayload,
		privateKey: string | JsonWebKey,
		algorithm: 'RS256' | 'ES256' = 'RS256',
		keyId?: string
	): Promise<string> {
		try {
			logger.info('PingOneJWTService', 'Creating request property JWT', {
				clientId: payload.client_id,
				responseType: payload.response_type,
				algorithm,
			});

		// Import private key - handle both JWK (JSON string) and PEM formats
		let key: KeyLike;
		if (typeof privateKey === 'string') {
			try {
				// Try parsing as JWK first
				const jwk = JSON.parse(privateKey);
				key = await importJWK(jwk, algorithm);
			} catch {
				// If not JSON, assume PEM format
				key = await importPKCS8(privateKey, algorithm);
			}
		} else {
			// Already a JWK object
			key = await importJWK(privateKey, algorithm);
		}

			// Build JWT header
			const header: Record<string, unknown> = {
				alg: algorithm,
				typ: 'JWT',
			};
			if (keyId) header.kid = keyId;

			// Create and sign JWT
			const jwt = new SignJWT(payload)
				.setProtectedHeader(header)
				.setIssuedAt()
				.setExpirationTime('5m'); // Request objects typically expire quickly

			const token = await jwt.sign(key);

			logger.success('PingOneJWTService', 'request property JWT created', {
				algorithm,
				tokenLength: token.length,
			});

			return token;
		} catch (error) {
			logger.error('PingOneJWTService', 'Failed to create request property JWT', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Create private key JWT for client authentication
	 * Used for token endpoint authentication (PRIVATE_KEY_JWT)
	 */
	static async createPrivateKeyJWT(config: PrivateKeyJWTConfig): Promise<string> {
		try {
			logger.info('PingOneJWTService', 'Creating private key JWT', {
				clientId: config.clientId,
				audience: config.audience,
			});

			// Import private key
			const privateKey = await importPKCS8(config.privateKey, 'RS256');

			// Build JWT header
			const header: Record<string, unknown> = {
				alg: 'RS256',
				typ: 'JWT',
			};
			if (config.keyId) header.kid = config.keyId;

			// Build JWT claims
			const now = Math.floor(Date.now() / 1000);
			const claims: Record<string, unknown> = {
				iss: config.clientId, // issuer is the client_id
				sub: config.clientId, // subject is the client_id
				aud: config.audience, // audience is the token endpoint
				jti: `jti-${Date.now()}-${Math.random().toString(36).substring(7)}`, // unique JWT ID
				iat: now, // issued at
				...config.additionalClaims,
			};

			// Set expiration
			const expirationTime = config.expirationTime || '5m';
			if (typeof expirationTime === 'number') {
				claims.exp = now + expirationTime;
			}

			// Create and sign JWT
			const jwt = new SignJWT(claims)
				.setProtectedHeader(header);

			if (typeof expirationTime === 'string') {
				jwt.setExpirationTime(expirationTime);
			}

			const token = await jwt.sign(privateKey);

			logger.success('PingOneJWTService', 'Private key JWT created', {
				clientId: config.clientId,
				tokenLength: token.length,
			});

			return token;
		} catch (error) {
			logger.error('PingOneJWTService', 'Failed to create private key JWT', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Sign arbitrary JWT with provided key
	 */
	static async signJWT(
		payload: Record<string, unknown>,
		privateKey: string | JsonWebKey,
		algorithm: 'RS256' | 'ES256' = 'RS256',
		options?: {
			keyId?: string;
			expirationTime?: string | number;
			issuedAt?: boolean;
			additionalHeaders?: Record<string, unknown>;
		}
	): Promise<string> {
		try {
		// Import private key - handle both JWK (JSON string) and PEM formats
		let key: KeyLike;
		if (typeof privateKey === 'string') {
			try {
				// Try parsing as JWK first
				const jwk = JSON.parse(privateKey);
				key = await importJWK(jwk, algorithm);
			} catch {
				// If not JSON, assume PEM format
				key = await importPKCS8(privateKey, algorithm);
			}
		} else {
			// Already a JWK object
			key = await importJWK(privateKey, algorithm);
		}

			// Build JWT header
			const header: Record<string, unknown> = {
				alg: algorithm,
				typ: 'JWT',
				...options?.additionalHeaders,
			};
			if (options?.keyId) header.kid = options.keyId;

			// Create and sign JWT
			const jwt = new SignJWT(payload).setProtectedHeader(header);

			if (options?.issuedAt !== false) {
				jwt.setIssuedAt();
			}

			if (options?.expirationTime) {
				if (typeof options.expirationTime === 'string') {
					jwt.setExpirationTime(options.expirationTime);
				} else {
					const exp = Math.floor(Date.now() / 1000) + options.expirationTime;
					jwt.setExpirationTime(exp);
				}
			}

			return await jwt.sign(key);
		} catch (error) {
			logger.error('PingOneJWTService', 'Failed to sign JWT', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}

// Export singleton instance
export const pingOneJWTService = PingOneJWTService;

