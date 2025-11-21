// src/services/jwtAuthServiceV8.ts
// V8 JWT Authentication Service - Cleaned up and simplified
// Provides JWT generation for client_secret_jwt and private_key_jwt authentication methods

import { createClientAssertion } from '../utils/clientAuthentication';

export interface JWTConfigV8 {
	clientId: string;
	tokenEndpoint: string;
	issuer?: string;
	subject?: string;
	expiryMinutes?: number;
}

export interface ClientSecretJWTConfig extends JWTConfigV8 {
	clientSecret: string;
}

export interface PrivateKeyJWTConfig extends JWTConfigV8 {
	privateKey: string;
	keyId?: string;
}

export interface JWTGenerationResult {
	success: boolean;
	jwt?: string;
	error?: string;
	claims?: Record<string, unknown>;
	header?: Record<string, unknown>;
}

class JWTAuthServiceV8 {
	/**
	 * Generate a client secret JWT for authentication
	 * Uses HMAC-SHA256 (HS256) algorithm
	 */
	async generateClientSecretJWT(config: ClientSecretJWTConfig): Promise<JWTGenerationResult> {
		try {
			if (!config.clientId || !config.tokenEndpoint || !config.clientSecret) {
				return {
					success: false,
					error: 'Client ID, Token Endpoint, and Client Secret are required',
				};
			}

			const _issuer = config.issuer || config.clientId;
			const subject = config.subject || config.clientId;
			const _expiryMinutes = config.expiryMinutes || 5;

			// Use the existing createClientAssertion utility which uses jose library
			const jwt = await createClientAssertion(
				subject, // clientId for assertion
				config.tokenEndpoint, // audience
				config.clientSecret, // secret
				'HS256' // algorithm
			);

			// Decode to show claims (without verification)
			const payload = this.decodeJWTPayload(jwt);

			return {
				success: true,
				jwt,
				claims: payload,
				header: { alg: 'HS256', typ: 'JWT' },
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to generate client secret JWT',
			};
		}
	}

	/**
	 * Generate a private key JWT for authentication
	 * Uses RSA-SHA256 (RS256) algorithm
	 */
	async generatePrivateKeyJWT(config: PrivateKeyJWTConfig): Promise<JWTGenerationResult> {
		try {
			if (!config.clientId || !config.tokenEndpoint || !config.privateKey) {
				return {
					success: false,
					error: 'Client ID, Token Endpoint, and Private Key are required',
				};
			}

			const _issuer = config.issuer || config.clientId;
			const subject = config.subject || config.clientId;

			// Use the existing createClientAssertion utility which uses jose library
			const jwt = await createClientAssertion(
				subject, // clientId for assertion
				config.tokenEndpoint, // audience
				config.privateKey, // private key
				'RS256' // algorithm
			);

			// Decode to show claims (without verification)
			const payload = this.decodeJWTPayload(jwt);
			const header = this.decodeJWTHeader(jwt);

			return {
				success: true,
				jwt,
				claims: payload,
				header,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to generate private key JWT',
			};
		}
	}

	/**
	 * Decode JWT payload without verification
	 */
	private decodeJWTPayload(jwt: string): Record<string, unknown> {
		try {
			const parts = jwt.split('.');
			if (parts.length !== 3) {
				throw new Error('Invalid JWT format');
			}
			const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
			return payload;
		} catch (error) {
			console.error('Failed to decode JWT payload:', error);
			return {};
		}
	}

	/**
	 * Decode JWT header without verification
	 */
	private decodeJWTHeader(jwt: string): Record<string, unknown> {
		try {
			const parts = jwt.split('.');
			if (parts.length !== 3) {
				throw new Error('Invalid JWT format');
			}
			const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
			return header;
		} catch (error) {
			console.error('Failed to decode JWT header:', error);
			return { alg: 'RS256', typ: 'JWT' };
		}
	}

	/**
	 * Validate private key format
	 */
	validatePrivateKey(privateKey: string): boolean {
		const pemHeader = '-----BEGIN';
		const pemFooter = '-----END';
		return privateKey.includes(pemHeader) && privateKey.includes(pemFooter);
	}
}

export const jwtAuthServiceV8 = new JWTAuthServiceV8();
export default jwtAuthServiceV8;
