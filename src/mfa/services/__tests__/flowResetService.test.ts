/**
 * @file flowResetService.test.ts
 * @module v8/services/__tests__
 * @description Tests for FlowResetService
 * @version 8.0.0
 * @since 2024-11-16
 */

import { FlowResetService } from '../flowResetService';
import { STORAGE_KEYS, StorageService } from '../storageService';

describe('FlowResetService', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe('resetFlow', () => {
		it('should reset flow and clear tokens', () => {
			// Setup
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');

			// Reset
			const result = FlowResetService.resetFlow('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('tokens');
			expect(result.cleared).toContain('step_progress');
			expect(result.kept).toContain('v8:credentials');
			expect(StorageService.load(STORAGE_KEYS.TOKENS)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
		});

		it('should keep worker token by default', () => {
			// Setup
			localStorage.setItem('v8:worker-token', JSON.stringify({ token: 'worker123' }));
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Reset
			const result = FlowResetService.resetFlow('authz-code', true);

			// Verify
			expect(result.kept).toContain('worker_token');
			expect(localStorage.getItem('v8:worker-token')).toBeTruthy();
		});

		it('should clear worker token when keepWorkerToken is false', () => {
			// Setup
			localStorage.setItem('v8:worker-token', JSON.stringify({ token: 'worker123' }));
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Reset
			const result = FlowResetService.resetFlow('authz-code', false);

			// Verify - worker token should not be in kept list
			expect(result.kept).not.toContain('worker_token');
		});
	});

	describe('fullReset', () => {
		it('should clear all flow data', () => {
			// Setup
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Full reset
			const result = FlowResetService.fullReset('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared.length).toBeGreaterThan(0);
			expect(StorageService.load(STORAGE_KEYS.TOKENS)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.CREDENTIALS)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
		});
	});

	describe('clearTokens', () => {
		it('should clear only tokens', () => {
			// Setup
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Clear tokens
			const result = FlowResetService.clearTokens('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('tokens');
			expect(StorageService.load(STORAGE_KEYS.TOKENS)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
			expect(StorageService.load(STORAGE_KEYS.STEP_PROGRESS)).toEqual({ step: 3 });
		});

		it('should handle missing tokens gracefully', () => {
			// Clear tokens when none exist
			const result = FlowResetService.clearTokens('authz-code');

			expect(result.success).toBe(true);
			expect(result.cleared).toHaveLength(0);
		});
	});

	describe('clearSession', () => {
		it('should clear session data but keep credentials and tokens', () => {
			// Setup
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Clear session
			const result = FlowResetService.clearSession('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('step_progress');
			expect(StorageService.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
			expect(StorageService.load(STORAGE_KEYS.TOKENS)).toEqual({ access_token: 'abc123' });
		});
	});

	describe('clearProgress', () => {
		it('should clear only step progress', () => {
			// Setup
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.STEP_PROGRESS, { step: 3 }, 1, 'authz-code');

			// Clear progress
			const result = FlowResetService.clearProgress('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('step_progress');
			expect(StorageService.load(STORAGE_KEYS.STEP_PROGRESS)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.CREDENTIALS)).toEqual({ clientId: 'test' });
			expect(StorageService.load(STORAGE_KEYS.TOKENS)).toEqual({ access_token: 'abc123' });
		});
	});

	describe('clearPingOneSession', () => {
		it('should clear discovery and preferences', () => {
			// Setup
			StorageService.save(STORAGE_KEYS.DISCOVERY, { endpoints: {} }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.PREFERENCES, { theme: 'dark' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Clear PingOne session
			const result = FlowResetService.clearPingOneSession('authz-code');

			// Verify
			expect(result.success).toBe(true);
			expect(result.cleared).toContain('discovery');
			expect(result.cleared).toContain('preferences');
			expect(StorageService.load(STORAGE_KEYS.DISCOVERY)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.PREFERENCES)).toBeNull();
			expect(StorageService.load(STORAGE_KEYS.TOKENS)).toEqual({ access_token: 'abc123' });
		});
	});

	describe('getResetSummary', () => {
		it('should return accurate summary', () => {
			// Setup
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.DISCOVERY, { endpoints: {} }, 1, 'authz-code');

			// Get summary
			const summary = FlowResetService.getResetSummary('authz-code');

			// Verify
			expect(summary.tokens).toBe(true);
			expect(summary.credentials).toBe(true);
			expect(summary.discovery).toBe(true);
			expect(summary.progress).toBe(false);
			expect(summary.preferences).toBe(false);
		});

		it('should return false for non-existent data', () => {
			// Get summary with empty storage
			const summary = FlowResetService.getResetSummary('authz-code');

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
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');
			StorageService.save(STORAGE_KEYS.CREDENTIALS, { clientId: 'test' }, 1, 'authz-code');

			// Get message
			const message = FlowResetService.getResetMessage('authz-code');

			// Verify
			expect(message).toContain('🔄 Reset Flow?');
			expect(message).toContain('✓ Clear all tokens');
			expect(message).toContain('✓ Keep credentials');
		});

		it('should include worker token in message if present', () => {
			// Setup
			localStorage.setItem('v8:worker-token', JSON.stringify({ token: 'worker123' }));
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'abc123' }, 1, 'authz-code');

			// Get message
			const message = FlowResetService.getResetMessage('authz-code');

			// Verify
			expect(message).toContain('✓ Keep worker token');
		});
	});

	describe('multiple flows', () => {
		it('should handle multiple flows independently', () => {
			// Setup for authz-code flow
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'authz-token' }, 1, 'authz-code');
			StorageService.save(
				STORAGE_KEYS.CREDENTIALS,
				{ clientId: 'authz-client' },
				1,
				'authz-code'
			);

			// Setup for implicit flow
			StorageService.save(STORAGE_KEYS.TOKENS, { access_token: 'implicit-token' }, 1, 'implicit');
			StorageService.save(
				STORAGE_KEYS.CREDENTIALS,
				{ clientId: 'implicit-client' },
				1,
				'implicit'
			);

			// Reset authz-code flow
			FlowResetService.resetFlow('authz-code');

			// Verify authz-code flow is reset
			expect(StorageService.load(STORAGE_KEYS.TOKENS)).toBeNull();

			// Verify implicit flow is not affected
			const implicitData = StorageService.getFlowData('implicit');
			expect(implicitData.length).toBeGreaterThan(0);
		});
	});

	describe('error handling', () => {
		it('should handle errors gracefully', () => {
			// Try to reset non-existent flow
			const result = FlowResetService.resetFlow('non-existent-flow');

			expect(result.success).toBe(true); // Should still succeed even if nothing to clear
		});
	});
});
