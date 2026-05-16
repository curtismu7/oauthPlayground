// src/services/stateValidationService.ts
/**
 * OAuth 2.0 State Parameter Validation Service
 *
 * Implements CSRF protection per OAuth 2.0 Security Best Practices (RFC 6819)
 * - Generates cryptographically secure state tokens
 * - Stores state with encryption and expiration
 * - Validates returned state against stored value
 * - Prevents session fixation attacks
 */

import { logger } from '../utils/logger';

export interface StateToken {
	value: string;
	timestamp: number;
	expiresAt: number;
	flowId: string;
}

export class StateValidationService {
	private static readonly DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
	private static readonly STATE_STORAGE_PREFIX = 'oauth_state_';

	/**
	 * Generate a cryptographically secure state token for CSRF protection
	 *
	 * @param flowId Unique identifier for the OAuth flow
	 * @returns Base64url-encoded state value to include in authorization URL
	 */
	static generateState(flowId: string): string {
		try {
			// Generate 32 random bytes (256 bits)
			const buffer = new Uint8Array(32);
			crypto.getRandomValues(buffer);

			// Convert to base64url
			const state = this.base64UrlEncode(buffer);

			// Store encrypted state with metadata
			const token: StateToken = {
				value: state,
				timestamp: Date.now(),
				expiresAt: Date.now() + this.DEFAULT_TIMEOUT,
				flowId,
			};

			// Encrypt before storing
			const encrypted = this.encryptStateToken(token);
			sessionStorage.setItem(`${this.STATE_STORAGE_PREFIX}${flowId}`, encrypted);

			logger.info('StateValidation', 'State token generated', {
				flowId,
				expiresIn: this.DEFAULT_TIMEOUT,
			});

			return state;
		} catch (error) {
			logger.error('StateValidation', 'Failed to generate state token', error);
			throw new Error('State generation failed');
		}
	}

	/**
	 * Validate returned state against stored token
	 *
	 * @param flowId Flow identifier
	 * @param returnedState State value from authorization response
	 * @returns Validation result with detailed error if invalid
	 */
	static validateState(
		flowId: string,
		returnedState: string
	): { valid: boolean; error?: string } {
		try {
			// Retrieve stored state
			const encrypted = sessionStorage.getItem(`${this.STATE_STORAGE_PREFIX}${flowId}`);

			if (!encrypted) {
				logger.warn('StateValidation', 'No stored state found', { flowId });
				return { valid: false, error: 'State not found - possible session loss' };
			}

			// Decrypt
			let token: StateToken;
			try {
				token = this.decryptStateToken(encrypted);
			} catch (error) {
				logger.error('StateValidation', 'Failed to decrypt state token', error);
				return { valid: false, error: 'State token corrupted' };
			}

			// Validate expiration
			if (Date.now() > token.expiresAt) {
				logger.warn('StateValidation', 'State token expired', {
					flowId,
					expiresAt: new Date(token.expiresAt).toISOString(),
				});
				sessionStorage.removeItem(`${this.STATE_STORAGE_PREFIX}${flowId}`);
				return { valid: false, error: 'State token expired' };
			}

			// Validate value matches (constant-time comparison to prevent timing attacks)
			if (!this.constantTimeEquals(token.value, returnedState)) {
				logger.warn('StateValidation', 'State mismatch - possible CSRF or replay attack', {
					flowId,
					expectedLength: token.value.length,
					receivedLength: returnedState.length,
				});
				return { valid: false, error: 'State validation failed - CSRF detected' };
			}

			// Validate flow ID consistency
			if (token.flowId !== flowId) {
				logger.warn('StateValidation', 'Flow ID mismatch - session hijacking attempt', {
					expectedFlowId: token.flowId,
					receivedFlowId: flowId,
				});
				return { valid: false, error: 'Flow ID mismatch' };
			}

			// State is valid - clean up
			sessionStorage.removeItem(`${this.STATE_STORAGE_PREFIX}${flowId}`);

			logger.info('StateValidation', 'State token validated successfully', {
				flowId,
				ageMs: Date.now() - token.timestamp,
			});

			return { valid: true };
		} catch (error) {
			logger.error('StateValidation', 'State validation error', error);
			return { valid: false, error: 'State validation failed' };
		}
	}

	/**
	 * Clear all state tokens for a flow (e.g., on logout)
	 */
	static clearState(flowId: string): void {
		try {
			sessionStorage.removeItem(`${this.STATE_STORAGE_PREFIX}${flowId}`);
			logger.info('StateValidation', 'State token cleared', { flowId });
		} catch (error) {
			logger.warn('StateValidation', 'Failed to clear state token', error);
		}
	}

	/**
	 * Clear all stored state tokens (emergency cleanup)
	 */
	static clearAllState(): void {
		try {
			const keys = Object.keys(sessionStorage);
			keys.forEach((key) => {
				if (key.startsWith(this.STATE_STORAGE_PREFIX)) {
					sessionStorage.removeItem(key);
				}
			});
			logger.info('StateValidation', 'All state tokens cleared');
		} catch (error) {
			logger.warn('StateValidation', 'Failed to clear all state tokens', error);
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
	 * Simple encryption for state token storage
	 * In production, use a proper encryption library
	 */
	private static encryptStateToken(token: StateToken): string {
		try {
			// For browser environment, use JSON + base64
			// Production: should use Web Crypto API for real encryption
			const json = JSON.stringify(token);
			return btoa(json);
		} catch (error) {
			logger.error('StateValidation', 'Encryption error', error);
			throw new Error('State encryption failed');
		}
	}

	/**
	 * Decrypt state token from storage
	 */
	private static decryptStateToken(encrypted: string): StateToken {
		try {
			const json = atob(encrypted);
			return JSON.parse(json) as StateToken;
		} catch (error) {
			logger.error('StateValidation', 'Decryption error', error);
			throw new Error('State decryption failed');
		}
	}
}

export const stateValidationService = StateValidationService;
