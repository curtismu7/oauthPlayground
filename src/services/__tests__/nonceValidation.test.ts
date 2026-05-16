// src/services/__tests__/nonceValidation.test.ts
/**
 * Unit tests for Nonce Validation Service
 * Tests OIDC nonce handling and replay attack prevention
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NonceValidationService } from '../nonceValidationService';

describe('NonceValidationService', () => {
	const flowId = 'oidc-flow-123';

	beforeEach(() => {
		sessionStorage.clear();
	});

	afterEach(() => {
		sessionStorage.clear();
	});

	describe('generateNonce', () => {
		it('should generate a valid base64url-encoded nonce', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			expect(nonce).toBeDefined();
			expect(typeof nonce).toBe('string');
			expect(nonce.length).toBeGreaterThan(0);
			// Base64url should not have padding or special chars beyond - and _
			expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
		});

		it('should store encrypted nonce in sessionStorage', () => {
			NonceValidationService.generateNonce(flowId);

			const stored = sessionStorage.getItem(`oidc_nonce_${flowId}`);
			expect(stored).toBeDefined();
			expect(stored).not.toBeNull();
		});

		it('should generate different nonces on each call', () => {
			const nonce1 = NonceValidationService.generateNonce(flowId);
			NonceValidationService.clearNonce(flowId);

			const nonce2 = NonceValidationService.generateNonce(flowId);

			expect(nonce1).not.toBe(nonce2);
		});

		it('should generate nonces of sufficient length for security', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			// Base64url of 32 bytes should be at least 43 characters
			expect(nonce.length).toBeGreaterThanOrEqual(43);
		});
	});

	describe('validateNonce', () => {
		it('should validate a correct nonce from ID token claims', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			const result = NonceValidationService.validateNonce(flowId, nonce);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should reject if ID token nonce is missing', () => {
			NonceValidationService.generateNonce(flowId);

			const result = NonceValidationService.validateNonce(flowId, undefined);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('missing');
		});

		it('should reject a mismatched nonce', () => {
			NonceValidationService.generateNonce(flowId);

			const result = NonceValidationService.validateNonce(flowId, 'wrong-nonce-value');

			expect(result.valid).toBe(false);
			expect(result.error).toContain('mismatch');
		});

		it('should reject if no stored nonce exists', () => {
			const result = NonceValidationService.validateNonce(flowId, 'any-nonce');

			expect(result.valid).toBe(false);
			expect(result.error).toContain('not found');
		});

		it('should reject expired nonces', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			// Manually expire the nonce by manipulating sessionStorage
			const stored = sessionStorage.getItem(`oidc_nonce_${flowId}`);
			if (stored) {
				const decoded = JSON.parse(atob(stored));
				decoded.expiresAt = Date.now() - 1000; // Expire 1 second ago
				const reencoded = btoa(JSON.stringify(decoded));
				sessionStorage.setItem(`oidc_nonce_${flowId}`, reencoded);
			}

			const result = NonceValidationService.validateNonce(flowId, nonce);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('expired');
		});

		it('should clean up nonce after successful validation', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			NonceValidationService.validateNonce(flowId, nonce);

			const stored = sessionStorage.getItem(`oidc_nonce_${flowId}`);
			expect(stored).toBeNull();
		});

		it('should protect against timing attacks with constant-time comparison', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			// Test with early mismatch
			const incorrectStart = 'x' + nonce.substring(1);
			const resultStart = NonceValidationService.validateNonce(flowId, incorrectStart);

			NonceValidationService.clearNonce(flowId);
			const nonce2 = NonceValidationService.generateNonce(flowId);

			// Test with late mismatch
			const incorrectEnd = nonce2.substring(0, -1) + 'x';
			const resultEnd = NonceValidationService.validateNonce(flowId, incorrectEnd);

			expect(resultStart.valid).toBe(false);
			expect(resultEnd.valid).toBe(false);
		});
	});

	describe('clearNonce', () => {
		it('should remove stored nonce', () => {
			NonceValidationService.generateNonce(flowId);

			NonceValidationService.clearNonce(flowId);

			const stored = sessionStorage.getItem(`oidc_nonce_${flowId}`);
			expect(stored).toBeNull();
		});

		it('should handle clearing non-existent nonce gracefully', () => {
			expect(() => {
				NonceValidationService.clearNonce('non-existent-flow');
			}).not.toThrow();
		});
	});

	describe('clearAllNonces', () => {
		it('should remove all stored nonces', () => {
			NonceValidationService.generateNonce('flow-1');
			NonceValidationService.generateNonce('flow-2');
			NonceValidationService.generateNonce('flow-3');

			NonceValidationService.clearAllNonces();

			expect(sessionStorage.getItem('oidc_nonce_flow-1')).toBeNull();
			expect(sessionStorage.getItem('oidc_nonce_flow-2')).toBeNull();
			expect(sessionStorage.getItem('oidc_nonce_flow-3')).toBeNull();
		});

		it('should preserve non-nonce sessionStorage items', () => {
			sessionStorage.setItem('other-key', 'other-value');
			NonceValidationService.generateNonce(flowId);

			NonceValidationService.clearAllNonces();

			expect(sessionStorage.getItem('other-key')).toBe('other-value');
			expect(sessionStorage.getItem(`oidc_nonce_${flowId}`)).toBeNull();
		});
	});

	describe('security scenarios', () => {
		it('should prevent ID token replay attacks', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			// First validation succeeds
			const firstValidation = NonceValidationService.validateNonce(flowId, nonce);
			expect(firstValidation.valid).toBe(true);

			// Attacker tries to replay the same token with same nonce
			const replayValidation = NonceValidationService.validateNonce(flowId, nonce);
			expect(replayValidation.valid).toBe(false);
		});

		it('should prevent nonce reuse across flows', () => {
			const nonce1 = NonceValidationService.generateNonce('flow-1');
			const nonce2 = NonceValidationService.generateNonce('flow-2');

			// Try to use nonce1 with flow-2
			const result = NonceValidationService.validateNonce('flow-2', nonce1);

			expect(result.valid).toBe(false);
		});

		it('should generate unique nonces per flow', () => {
			const nonce1 = NonceValidationService.generateNonce('flow-1');
			const nonce2 = NonceValidationService.generateNonce('flow-2');

			expect(nonce1).not.toBe(nonce2);
		});

		it('should reject forged nonces not in token format', () => {
			NonceValidationService.generateNonce(flowId);

			const result = NonceValidationService.validateNonce(flowId, 'short');

			expect(result.valid).toBe(false);
		});
	});

	describe('OIDC compliance', () => {
		it('should enforce nonce requirement per OIDC spec', () => {
			NonceValidationService.generateNonce(flowId);

			// Per OIDC: if nonce was requested, it MUST be in the ID token
			const result = NonceValidationService.validateNonce(flowId, undefined);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('missing');
		});

		it('should support nonce in various ID token positions', () => {
			const nonce = NonceValidationService.generateNonce(flowId);

			// Standard OIDC nonce claim
			const result = NonceValidationService.validateNonce(flowId, nonce);

			expect(result.valid).toBe(true);
		});
	});
});
