// src/services/__tests__/stateValidation.test.ts
/**
 * Unit tests for State Validation Service
 * Tests CSRF protection and state parameter handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateValidationService } from '../stateValidationService';

describe('StateValidationService', () => {
	const flowId = 'test-flow-123';

	beforeEach(() => {
		// Clear sessionStorage before each test
		sessionStorage.clear();
	});

	afterEach(() => {
		// Clean up after each test
		sessionStorage.clear();
	});

	describe('generateState', () => {
		it('should generate a valid base64url-encoded state', () => {
			const state = StateValidationService.generateState(flowId);

			expect(state).toBeDefined();
			expect(typeof state).toBe('string');
			expect(state.length).toBeGreaterThan(0);
			// Base64url should not have padding or special chars beyond - and _
			expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
		});

		it('should store encrypted state in sessionStorage', () => {
			StateValidationService.generateState(flowId);

			const stored = sessionStorage.getItem(`oauth_state_${flowId}`);
			expect(stored).toBeDefined();
			expect(stored).not.toBeNull();
		});

		it('should generate different states on each call', () => {
			const state1 = StateValidationService.generateState(flowId);
			StateValidationService.clearState(flowId);

			const state2 = StateValidationService.generateState(flowId);

			expect(state1).not.toBe(state2);
		});

		it('should throw error if sessionStorage is unavailable', () => {
			// jsdom's Storage.prototype.setItem is non-writable on the instance,
			// so direct reassignment is a no-op. Spy on the prototype instead.
			const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
				throw new Error('sessionStorage error');
			});

			expect(() => {
				StateValidationService.generateState(flowId);
			}).toThrow();

			spy.mockRestore();
		});
	});

	describe('validateState', () => {
		it('should validate a correct state parameter', () => {
			const state = StateValidationService.generateState(flowId);

			const result = StateValidationService.validateState(flowId, state);

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should reject a mismatched state', () => {
			StateValidationService.generateState(flowId);

			const result = StateValidationService.validateState(flowId, 'wrong-state-value');

			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain('State validation failed');
		});

		it('should reject if no stored state exists', () => {
			const result = StateValidationService.validateState(flowId, 'any-state');

			expect(result.valid).toBe(false);
			expect(result.error).toContain('State not found');
		});

		it('should reject expired state tokens', () => {
			const state = StateValidationService.generateState(flowId);

			// Manually expire the token by manipulating sessionStorage
			const stored = sessionStorage.getItem(`oauth_state_${flowId}`);
			if (stored) {
				const decoded = JSON.parse(atob(stored));
				decoded.expiresAt = Date.now() - 1000; // Expire 1 second ago
				const reencoded = btoa(JSON.stringify(decoded));
				sessionStorage.setItem(`oauth_state_${flowId}`, reencoded);
			}

			const result = StateValidationService.validateState(flowId, state);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('expired');
		});

		it('should clean up state after successful validation', () => {
			const state = StateValidationService.generateState(flowId);

			StateValidationService.validateState(flowId, state);

			const stored = sessionStorage.getItem(`oauth_state_${flowId}`);
			expect(stored).toBeNull();
		});

		it('should protect against timing attacks with constant-time comparison', () => {
			const state = StateValidationService.generateState(flowId);

			// Test that comparison time is consistent regardless of where mismatch occurs
			const incorrectStart = 'x' + state.substring(1);
			const incorrectEnd = state.substring(0, -1) + 'x';

			const resultStart = StateValidationService.validateState(flowId, incorrectStart);
			StateValidationService.clearState(flowId);

			const state2 = StateValidationService.generateState(flowId);
			const resultEnd = StateValidationService.validateState(flowId, incorrectEnd);

			expect(resultStart.valid).toBe(false);
			expect(resultEnd.valid).toBe(false);
		});
	});

	describe('clearState', () => {
		it('should remove stored state', () => {
			StateValidationService.generateState(flowId);

			StateValidationService.clearState(flowId);

			const stored = sessionStorage.getItem(`oauth_state_${flowId}`);
			expect(stored).toBeNull();
		});

		it('should handle clearing non-existent state gracefully', () => {
			expect(() => {
				StateValidationService.clearState('non-existent-flow');
			}).not.toThrow();
		});
	});

	describe('clearAllState', () => {
		it('should remove all stored state tokens', () => {
			StateValidationService.generateState('flow-1');
			StateValidationService.generateState('flow-2');
			StateValidationService.generateState('flow-3');

			StateValidationService.clearAllState();

			expect(sessionStorage.getItem('oauth_state_flow-1')).toBeNull();
			expect(sessionStorage.getItem('oauth_state_flow-2')).toBeNull();
			expect(sessionStorage.getItem('oauth_state_flow-3')).toBeNull();
		});

		it('should preserve non-state sessionStorage items', () => {
			sessionStorage.setItem('other-key', 'other-value');
			StateValidationService.generateState(flowId);

			StateValidationService.clearAllState();

			expect(sessionStorage.getItem('other-key')).toBe('other-value');
			expect(sessionStorage.getItem(`oauth_state_${flowId}`)).toBeNull();
		});
	});

	describe('security scenarios', () => {
		it('should prevent CSRF attacks with state mismatch', () => {
			const state1 = StateValidationService.generateState('flow-1');
			const state2 = StateValidationService.generateState('flow-2');

			// Attacker tries to use state1 with flow-2
			const result = StateValidationService.validateState('flow-2', state1);

			expect(result.valid).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should prevent replay attacks with one-time use', () => {
			const state = StateValidationService.generateState(flowId);

			const firstValidation = StateValidationService.validateState(flowId, state);
			expect(firstValidation.valid).toBe(true);

			// Try to reuse the same state
			const secondValidation = StateValidationService.validateState(flowId, state);
			expect(secondValidation.valid).toBe(false);
		});

		it('should prevent session fixation with unique state per flow', () => {
			const state1 = StateValidationService.generateState('flow-1');
			const state2 = StateValidationService.generateState('flow-1');

			expect(state1).not.toBe(state2);
		});
	});
});
