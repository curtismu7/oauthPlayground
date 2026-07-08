/**
 * @file flowResetServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for FlowResetServiceV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { FlowResetServiceV8 } from '../flowResetServiceV8';
import { STORAGE_KEYS, StorageServiceV8 } from '../storageServiceV8';

describe('FlowResetServiceV8', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe('resetFlow', () => {
		it('should reset flow and clear tokens', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');

			// Reset
			const result = FlowResetServiceV8.resetFlow('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('tokens');
			expect(result.cleared).toContain('step_progress');
			expect(result.kept).toContain('v8:credentials');
			expect(StorageServiceV8.load(STORAGE_KEYS.TOKENS)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
		});

		it('should keep worker token by default', () => {
			// Setup
			localStorage.setItem('v8:worker-token', JSON.stringify({ token: 'worker123' }));
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Reset
			const result = FlowResetServiceV8.resetFlow('authz-code', true);

			// Verify
			expect(result.kept).toContain('worker_token');
			expect(localStorage.getItem('v8:worker-token')).toBeTruthy();
		});

		it('should clear worker token when keepWorkerToken is false', () => {
			// Setup
			localStorage.setItem('v8:worker-token', JSON.stringify({ token: 'worker123' }));
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Reset
			const result = FlowResetServiceV8.resetFlow('authz-code', false);

			// Verify - worker token should not be in kept list
			expect(result.kept).not.toContain('worker_token');
		});
	});

	describe('fullReset', () => {
		it('should clear all flow data', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Full reset
			const result = FlowResetServiceV8.fullReset('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared.length).toBeGreaterThan(0);
			expect(StorageServiceV8.load(STORAGE_KEYS.TOKENS)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.CREDENTIALS)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
		});
	});

	describe('clearTokens', () => {
		it('should clear only tokens', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Clear tokens
			const result = FlowResetServiceV8.clearTokens('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('tokens');
			expect(StorageServiceV8.load(STORAGE_KEYS.TOKENS)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
			expect(StorageServiceV8.load(STORAGE_KEYS.STEP_PROGRESS)).toEqual({ step: 3 });
		});

		it('should handle missing tokens gracefully', () => {
			// Clear tokens when none exist
			const result = FlowResetServiceV8.clearTokens('authz-code');

			expect(result.success).toBe(true);
			expect(result.cleared).toHaveLength(0);
		});
	});

	describe('clearSession', () => {
		it('should clear session data but keep credentials and tokens', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Clear session
			const result = FlowResetServiceV8.clearSession('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('step_progress');
			expect(StorageServiceV8.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
			expect(StorageServiceV8.load(STORAGE_KEYS.TOKENS)).toEqual({ access_token: 'abc123' });
		});
	});

	describe('clearProgress', () => {
		it('should clear only step progress', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Clear progress
			const result = FlowResetServiceV8.clearProgress('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('step_progress');
			expect(StorageServiceV8.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
			expect(StorageServiceV8.load(STORAGE_KEYS.TOKENS)).toEqual({ access_token: 'abc123' });
		});
	});

	describe('clearPingOneSession', () => {
		it('should clear discovery and preferences', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.DISCOVERY, { endpoints: {} }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.PREFERENCES, { theme: 'dark' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Clear PingOne session
			const result = FlowResetServiceV8.clearPingOneSession('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('discovery');
			expect(result.cleared).toContain('preferences');
			expect(StorageServiceV8.load(STORAGE_KEYS.DISCOVERY)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.PREFERENCES)).toBeNull();
			expect(StorageServiceV8.load(STORAGE_KEYS.TOKENS)).toEqual({ access_token: 'abc123' });
		});
	});

	describe('getResetSummary', () => {
		it('should return accurate summary', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.DISCOVERY, { endpoints: {} }, 1, 'authz-code');

			// Get summary
			const summary = FlowResetServiceV8.getResetSummary('authz-code');

			// Verify
			expect(summary.tokens).toBe(true);
			expect(summary.credentials).toBe(true);
			expect(summary.discovery).toBe(true);
			expect(summary.progress).toBe(false);
			expect(summary.preferences).toBe(false);
		});

		it('should return false for non-existent data', () => {
			// Get summary with empty storage
			const summary = FlowResetServiceV8.getResetSummary('authz-code');

			// Verify
			expect(summary.tokens).toBe(false);
			expect(summary.credentials).toBe(false);
			expect(summary.discovery).toBe(false);
			expect(summary.progress).toBe(false);
			expect(summary.preferences).toBe(false);
		});
	});

	describe('getResetMessage', () => {
		it('should generate user-friendly reset message', () => {
			// Setup
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageServiceV8.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');

			// Get message
			const message = FlowResetServiceV8.getResetMessage('authz-code');

			// Verify
			expect(message).toContain('🔄 Reset Flow?');
			expect(message).toContain('✓ Clear all tokens');
			expect(message).toContain('✓ Keep credentials');
		});

		it('should include worker token in message if present', () => {
			// Setup
			localStorage.setItem('v8:worker-token', JSON.stringify({ token: 'worker123' }));
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Get message
			const message = FlowResetServiceV8.getResetMessage('authz-code');

			// Verify
			expect(message).toContain('✓ Keep worker token');
		});
	});

	describe('multiple flows', () => {
		it('should handle multiple flows independently', () => {
			// Setup for authz-code flow
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'authz-token' }, 1, 'authz-code');
			StorageServiceV8.save(
				STORAGE_KEYS.CREDENTIALS,
				{ clientId: 'authz-client' },
				1,
				'authz-code'
			);

			// Setup for implicit flow
			StorageServiceV8.save(STORAGE_KEYS.TOKENS, { access_token: 'implicit-token' }, 1, 'implicit');
			StorageServiceV8.save(
				STORAGE_KEYS.CREDENTIALS,
				{ clientId: 'implicit-client' },
				1,
				'implicit'
			);

			// Reset authz-code flow
			FlowResetServiceV8.resetFlow('authz-code');

			// Verify authz-code flow is reset
			expect(StorageServiceV8.load(STORAGE_KEYS.TOKENS)).toBeNull();

			// Verify implicit flow is not affected
			const implicitData = StorageServiceV8.getFlowData('implicit');
			expect(implicitData.length).toBeGreaterThan(0);
		});
	});

	describe('error handling', () => {
		it('should handle errors gracefully', () => {
			// Try to reset non-existent flow
			const result = FlowResetServiceV8.resetFlow('non-existent-flow');

			expect(result.success).toBe(true); // Should still succeed even if nothing to clear
		});
	});
});
