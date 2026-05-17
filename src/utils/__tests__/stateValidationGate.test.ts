// src/utils/__tests__/stateValidationGate.test.ts
/**
 * Unit tests for the State Validation Gate
 * Covers flowId resolution, WARN vs ENFORCE behavior, and never-throws.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveFlowId, isEnforcing, gateState } from '../stateValidationGate';
import { StateValidationService } from '../../services/stateValidationService';

describe('stateValidationGate', () => {
	beforeEach(() => {
		sessionStorage.clear();
		vi.unstubAllEnvs();
	});

	afterEach(() => {
		sessionStorage.clear();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	describe('resolveFlowId', () => {
		it('prefers active_oauth_flow', () => {
			sessionStorage.setItem('active_oauth_flow', 'auth-code-v9');
			sessionStorage.setItem('flowContext', JSON.stringify({ flow: 'other' }));
			expect(resolveFlowId()).toBe('auth-code-v9');
		});

		it('falls back to flowContext.flow', () => {
			sessionStorage.setItem('flowContext', JSON.stringify({ flow: 'hybrid-v9' }));
			expect(resolveFlowId()).toBe('hybrid-v9');
		});

		it('returns null when neither is present', () => {
			expect(resolveFlowId()).toBeNull();
		});

		it('returns null on malformed flowContext (no throw)', () => {
			sessionStorage.setItem('flowContext', '{not json');
			expect(resolveFlowId()).toBeNull();
		});
	});

	describe('isEnforcing', () => {
		it('false by default', () => {
			expect(isEnforcing()).toBe(false);
		});

		it('true only when flag === "true"', () => {
			vi.stubEnv('VITE_ENFORCE_STATE_VALIDATION', 'true');
			expect(isEnforcing()).toBe(true);
			vi.stubEnv('VITE_ENFORCE_STATE_VALIDATION', '1');
			expect(isEnforcing()).toBe(false);
		});
	});

	describe('gateState — WARN mode (default)', () => {
		it('allows when state param missing', () => {
			const r = gateState(null);
			expect(r.ok).toBe(true);
			expect(r.enforced).toBe(false);
		});

		it('allows when no flowId resolvable (un-migrated flow)', () => {
			const r = gateState('some-state');
			expect(r.ok).toBe(true);
			expect(r.reason).toMatch(/un-migrated|flow identity/i);
		});

		it('allows but reports when stored state mismatches', () => {
			sessionStorage.setItem('active_oauth_flow', 'flow-1');
			StateValidationService.generateState('flow-1');
			const r = gateState('wrong-returned-state');
			expect(r.ok).toBe(true);
			expect(r.enforced).toBe(false);
			expect(r.reason).toBeDefined();
		});

		it('allows on a valid round-trip', () => {
			sessionStorage.setItem('active_oauth_flow', 'flow-ok');
			const state = StateValidationService.generateState('flow-ok');
			const r = gateState(state);
			expect(r.ok).toBe(true);
		});
	});

	describe('gateState — ENFORCE mode', () => {
		beforeEach(() => {
			vi.stubEnv('VITE_ENFORCE_STATE_VALIDATION', 'true');
		});

		it('blocks when state param missing', () => {
			const r = gateState(null);
			expect(r.ok).toBe(false);
			expect(r.enforced).toBe(true);
		});

		it('blocks when no flowId resolvable', () => {
			const r = gateState('some-state');
			expect(r.ok).toBe(false);
			expect(r.enforced).toBe(true);
		});

		it('blocks on state mismatch', () => {
			sessionStorage.setItem('active_oauth_flow', 'flow-2');
			StateValidationService.generateState('flow-2');
			const r = gateState('tampered-state');
			expect(r.ok).toBe(false);
			expect(r.enforced).toBe(true);
			expect(r.reason).toBeDefined();
		});

		it('allows a valid round-trip', () => {
			sessionStorage.setItem('active_oauth_flow', 'flow-3');
			const state = StateValidationService.generateState('flow-3');
			const r = gateState(state);
			expect(r.ok).toBe(true);
		});
	});

	it('never throws even if sessionStorage access fails', () => {
		const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('storage blocked');
		});
		expect(() => gateState('x')).not.toThrow();
		spy.mockRestore();
	});
});
