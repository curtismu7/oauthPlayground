// src/services/nonceValidationService.ts
/**
 * OpenID Connect Nonce Parameter Validation Service
 *
 * Implements nonce validation per OpenID Connect Core 1.0 (Section 3.1.3.3)
 * - Generates cryptographically secure nonce values
 * - Stores nonce for validation against ID token
 * - Prevents ID token replay attacks
 * - Enforces strict nonce matching
 */

import { logger } from '../utils/logger';

export interface NonceToken {
	value: string;
	timestamp: number;
	expiresAt: number;
	flowId: string;
	algorithm?: string;
}

export class NonceValidationService {
	private static readonly DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
	private static readonly NONCE_STORAGE_PREFIX = 'oidc_nonce_';

	/**
	 * Generate a cryptographically secure nonce for ID token replay protection
	 *
	 * @param flowId Unique identifier for the OIDC flow
	 * @returns Base64url-encoded nonce value to include in authorization URL
	 */
	static generateNonce(flowId: string): string {
		try {
			// Generate 32 random bytes (256 bits) for nonce
			const buffer = new Uint8Array(32);
			crypto.getRandomValues(buffer);

			// Convert to base64url
			const nonce = this.base64UrlEncode(buffer);

			// Store encrypted nonce with metadata
			const token: NonceToken = {
				value: nonce,
				timestamp: Date.now(),
				expiresAt: Date.now() + this.DEFAULT_TIMEOUT,
				flowId,
				algorithm: 'RS256',
			};

			// Encrypt before storing
			const encrypted = this.encryptNonce(token);
			sessionStorage.setItem(`${this.NONCE_STORAGE_PREFIX}${flowId}`, encrypted);

			logger.info('NonceValidation', 'Nonce generated', {
				flowId,
				expiresIn: this.DEFAULT_TIMEOUT,
			});

			return nonce;
		} catch (error) {
			logger.error('NonceValidation', 'Failed to generate nonce', error);
			throw new Error('Nonce generation failed');
		}
	}

	/**
	 * Validate nonce from ID token claims against stored value
	 *
	 * @param flowId Flow identifier
	 * @param idTokenNonce Nonce claim from decoded ID token
	 * @returns Validation result with detailed error if invalid
	 */
	static validateNonce(
		flowId: string,
		idTokenNonce: string | undefined
	): { valid: boolean; error?: string } {
		try {
			// Per OIDC spec, nonce is REQUIRED in the ID Token if it was sent in the request
			if (!idTokenNonce) {
				logger.warn('NonceValidation', 'ID token missing nonce claim', { flowId });
				return { valid: false, error: 'ID token missing nonce claim' };
			}

			// Retrieve stored nonce
			const encrypted = sessionStorage.getItem(`${this.NONCE_STORAGE_PREFIX}${flowId}`);

			if (!encrypted) {
				logger.warn('NonceValidation', 'No stored nonce found', { flowId });
				return { valid: false, error: 'Nonce not found - session may have expired' };
			}

			// Decrypt
			let token: NonceToken;
			try {
				token = this.decryptNonce(encrypted);
			} catch (error) {
				logger.error('NonceValidation', 'Failed to decrypt nonce', error);
				return { valid: false, error: 'Nonce token corrupted' };
			}

			// Validate expiration
			if (Date.now() > token.expiresAt) {
				logger.warn('NonceValidation', 'Nonce expired', {
					flowId,
					expiresAt: new Date(token.expiresAt).toISOString(),
				});
				sessionStorage.removeItem(`${this.NONCE_STORAGE_PREFIX}${flowId}`);
				return { valid: false, error: 'Nonce expired' };
			}

			// Validate value matches (constant-time comparison to prevent timing attacks)
			if (!this.constantTimeEquals(token.value, idTokenNonce)) {
				logger.warn('NonceValidation', 'Nonce mismatch - possible replay attack', {
					flowId,
					expectedLength: token.value.length,
					receivedLength: idTokenNonce.length,
				});
				return {
					valid: false,
					error: 'Nonce mismatch - validation failed (possible replay attack)',
				};
			}

			// Validate flow ID consistency
			if (token.flowId !== flowId) {
				logger.warn('NonceValidation', 'Flow ID mismatch - potential session hijacking', {
					expectedFlowId: token.flowId,
					receivedFlowId: flowId,
				});
				return { valid: false, error: 'Flow ID mismatch' };
			}

			// Nonce is valid - clean up
			sessionStorage.removeItem(`${this.NONCE_STORAGE_PREFIX}${flowId}`);

			logger.info('NonceValidation', 'Nonce validated successfully', {
				flowId,
				ageMs: Date.now() - token.timestamp,
			});

			return { valid: true };
		} catch (error) {
			logger.error('NonceValidation', 'Nonce validation error', error);
			return { valid: false, error: 'Nonce validation failed' };
		}
	}

	/**
	 * Clear nonce for a specific flow (e.g., on logout or error)
	 */
	static clearNonce(flowId: string): void {
		try {
			sessionStorage.removeItem(`${this.NONCE_STORAGE_PREFIX}${flowId}`);
			logger.info('NonceValidation', 'Nonce cleared', { flowId });
		} catch (error) {
			logger.warn('NonceValidation', 'Failed to clear nonce', error);
		}
	}

	/**
	 * Clear all stored nonces (emergency cleanup)
	 */
	static clearAllNonces(): void {
		try {
			const keys = Object.keys(sessionStorage);
			keys.forEach((key) => {
				if (key.startsWith(this.NONCE_STORAGE_PREFIX)) {
					sessionStorage.removeItem(key);
				}
			});
			logger.info('NonceValidation', 'All nonces cleared');
		} catch (error) {
			logger.warn('NonceValidation', 'Failed to clear all nonces', error);
		}
	}

	/**
	 * Base64url encoding (RFC 4648)
	 */
	private static base64UrlEncode(buffer: Uint8Array): string {
		const binary = String.fromCharCode(...buffer);
		return btoa(binary)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
	}

	/**
	 * Base64url decoding (RFC 4648)
	 */
	private static base64UrlDecode(encoded: string): string {
		let input = encoded.replace(/-/g, '+').replace(/_/g, '/');
		// Add padding if needed
		while (input.length % 4) {
			input += '=';
		}
		return atob(input);
	}

	/**
	 * Constant-time string comparison to prevent timing attacks
	 */
	private static constantTimeEquals(a: string, b: string): boolean {
		if (a.length !== b.length) return false;

		let result = 0;
		for (let i = 0; i < a.length; i++) {
			result |= a.charCodeAt(i) ^ b.charCodeAt(i);
		}
		return result === 0;
	}

	/**
	 * Encrypt nonce token for storage
	 * In production, use a proper encryption library
	 */
	private static encryptNonce(token: NonceToken): string {
		try {
			const json = JSON.stringify(token);
			return btoa(json);
		} catch (error) {
			logger.error('NonceValidation', 'Encryption error', error);
			throw new Error('Nonce encryption failed');
		}
	}

	/**
	 * Decrypt nonce token from storage
	 */
	private static decryptNonce(encrypted: string): NonceToken {
		try {
			const json = atob(encrypted);
			return JSON.parse(json) as NonceToken;
		} catch (error) {
			logger.error('NonceValidation', 'Decryption error', error);
			throw new Error('Nonce decryption failed');
		}
	}
}

export const nonceValidationService = NonceValidationService;
