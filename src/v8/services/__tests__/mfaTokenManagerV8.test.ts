/**
 * @file mfaTokenManagerV8.test.ts
 * @module v8/services/__tests__
 * @description Unit tests for MFA Token Manager service
 * @version 8.0.0
 * @since 2026-01-29
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MFATokenManagerV8 } from '../mfaTokenManagerV8';
import type { TokenStatusInfo } from '../workerTokenStatusServiceV8';
import { WorkerTokenStatusServiceV8 } from '../workerTokenStatusServiceV8';

// Mock WorkerTokenStatusServiceV8
vi.mock('../workerTokenStatusServiceV8', () => ({
	WorkerTokenStatusServiceV8: {
		checkWorkerTokenStatusSync: vi.fn(),
		checkWorkerTokenStatus: vi.fn(),
	},
}));

describe('MFATokenManagerV8', () => {
	const mockTokenState: TokenStatusInfo = {
		status: 'valid',
		message: 'Token is valid',
		isValid: true,
		expiresAt: Date.now() + 3600000,
		minutesRemaining: 60,
		token: 'mock-token',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		MFATokenManagerV8.resetInstance();

		// Setup default mock returns
		vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync).mockReturnValue(
			mockTokenState
		);
		vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(mockTokenState);
	});

	afterEach(() => {
		MFATokenManagerV8.resetInstance();
		vi.useRealTimers();
	});

	describe('Singleton behavior', () => {
		it('should return same instance on multiple getInstance calls', () => {
			const instance1 = MFATokenManagerV8.getInstance();
			const instance2 = MFATokenManagerV8.getInstance();

			expect(instance1).toBe(instance2);
		});

		it('should be resettable for testing', () => {
			const instance1 = MFATokenManagerV8.getInstance();
			MFATokenManagerV8.resetInstance();
			const instance2 = MFATokenManagerV8.getInstance();

			expect(instance1).not.toBe(instance2);
		});

		it('should initialize with sync token check', () => {
			MFATokenManagerV8.getInstance();

			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync).toHaveBeenCalledTimes(1);
		});
	});

	describe('Token state management', () => {
		it('should initialize with default token state', () => {
			const manager = MFATokenManagerV8.getInstance();
			const state = manager.getTokenState();

			expect(state).toEqual(mockTokenState);
		});

		it('should update token state on refresh', async () => {
			const manager = MFATokenManagerV8.getInstance();

			const newState: TokenStatusInfo = {
				status: 'expiring-soon',
				message: 'Token expiring soon',
				isValid: true,
				expiresAt: Date.now() + 300000,
				minutesRemaining: 5,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(newState);

			await manager.refreshToken();
			const state = manager.getTokenState();

			expect(state).toEqual(newState);
		});

		it('should check token validity', () => {
			const manager = MFATokenManagerV8.getInstance();
			const state = manager.getTokenState();

			expect(state.isValid).toBe(true);
		});

		it('should detect expired tokens', async () => {
			const manager = MFATokenManagerV8.getInstance();

			const expiredState: TokenStatusInfo = {
				status: 'expired',
				message: 'Token expired',
				isValid: false,
				expiresAt: Date.now() - 1000,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(expiredState);

			await manager.refreshToken();
			const state = manager.getTokenState();

			expect(state.status).toBe('expired');
			expect(state.isValid).toBe(false);
		});

		it('should detect expiring-soon tokens', async () => {
			const manager = MFATokenManagerV8.getInstance();

			const expiringSoonState: TokenStatusInfo = {
				status: 'expiring-soon',
				message: 'Token expiring soon',
				isValid: true,
				expiresAt: Date.now() + 300000,
				minutesRemaining: 5,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(
				expiringSoonState
			);

			await manager.refreshToken();
			const state = manager.getTokenState();

			expect(state.status).toBe('expiring-soon');
			expect(state.minutesRemaining).toBe(5);
		});
	});

	describe('Subscription management', () => {
		it('should allow subscribing to token updates', () => {
			const manager = MFATokenManagerV8.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);

			// Should be called immediately with current state
			expect(callback).toHaveBeenCalledWith(mockTokenState);
		});

		it('should notify subscribers on token refresh', async () => {
			const manager = MFATokenManagerV8.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);
			callback.mockClear(); // Clear initial call

			const newState: TokenStatusInfo = {
				status: 'expiring-soon',
				message: 'Token expiring',
				isValid: true,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(newState);

			await manager.refreshToken();

			expect(callback).toHaveBeenCalledWith(newState);
		});

		it('should allow unsubscribing', () => {
			const manager = MFATokenManagerV8.getInstance();
			const callback = vi.fn();

			const unsubscribe = manager.subscribe(callback);
			callback.mockClear();

			unsubscribe();

			// Manually trigger notify (private method access for testing)
			(manager as any).notify();

			expect(callback).not.toHaveBeenCalled();
		});

		it('should not notify unsubscribed callbacks', async () => {
			const manager = MFATokenManagerV8.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);
			manager.unsubscribe(callback);
			callback.mockClear();

			await manager.refreshToken();

			expect(callback).not.toHaveBeenCalled();
		});

		it('should handle multiple subscribers', async () => {
			const manager = MFATokenManagerV8.getInstance();
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			const callback3 = vi.fn();

			manager.subscribe(callback1);
			manager.subscribe(callback2);
			manager.subscribe(callback3);

			callback1.mockClear();
			callback2.mockClear();
			callback3.mockClear();

			const newState: TokenStatusInfo = {
				status: 'valid',
				message: 'Updated',
				isValid: true,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(newState);

			await manager.refreshToken();

			expect(callback1).toHaveBeenCalledWith(newState);
			expect(callback2).toHaveBeenCalledWith(newState);
			expect(callback3).toHaveBeenCalledWith(newState);
		});
	});

	describe('Auto-refresh', () => {
		it('should auto-refresh tokens at configured interval', async () => {
			const manager = MFATokenManagerV8.getInstance({ autoRefresh: true, refreshInterval: 1000 });

			manager.startAutoRefresh();

			// Fast-forward time
			await vi.advanceTimersByTimeAsync(1000);

			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(1000);

			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalledTimes(2);
		});

		it('should stop auto-refresh when stopped', async () => {
			const manager = MFATokenManagerV8.getInstance({ autoRefresh: true, refreshInterval: 1000 });

			manager.startAutoRefresh();
			await vi.advanceTimersByTimeAsync(1000);

			manager.stopAutoRefresh();

			const callCount = vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mock.calls
				.length;

			await vi.advanceTimersByTimeAsync(2000);

			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalledTimes(callCount);
		});

		it('should handle refresh errors gracefully', async () => {
			const manager = MFATokenManagerV8.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);
			callback.mockClear();

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockRejectedValue(
				new Error('Network error')
			);

			await manager.refreshToken();

			expect(callback).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'missing',
					isValid: false,
				})
			);
		});

		it('should not start auto-refresh if disabled in config', () => {
			const manager = MFATokenManagerV8.getInstance({ autoRefresh: false });

			manager.startAutoRefresh();

			// Should not start timer
			expect((manager as any).refreshTimer).toBeNull();
		});
	});

	describe('Integration with WorkerTokenStatusServiceV8', () => {
		it('should delegate to WorkerTokenStatusServiceV8 for status checks', async () => {
			const manager = MFATokenManagerV8.getInstance();

			await manager.refreshToken();

			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalled();
		});

		it('should use existing worker token service methods', () => {
			MFATokenManagerV8.getInstance();

			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync).toHaveBeenCalled();
		});
	});

	describe('Configuration management', () => {
		it('should use default config when none provided', () => {
			const manager = MFATokenManagerV8.getInstance();
			const config = manager.getConfig();

			expect(config.refreshInterval).toBe(30000);
			expect(config.autoRefresh).toBe(true);
		});

		it('should accept custom config', () => {
			const manager = MFATokenManagerV8.getInstance({
				refreshInterval: 5000,
				autoRefresh: false,
			});
			const config = manager.getConfig();

			expect(config.refreshInterval).toBe(5000);
			expect(config.autoRefresh).toBe(false);
		});

		it('should update config dynamically', () => {
			const manager = MFATokenManagerV8.getInstance();

			manager.updateConfig({ refreshInterval: 10000 });

			const config = manager.getConfig();
			expect(config.refreshInterval).toBe(10000);
		});

		it('should restart auto-refresh when interval changes', async () => {
			const manager = MFATokenManagerV8.getInstance({ autoRefresh: true, refreshInterval: 1000 });

			manager.startAutoRefresh();

			manager.updateConfig({ refreshInterval: 2000 });

			await vi.advanceTimersByTimeAsync(1000);
			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1000);
			expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalledTimes(1);
		});
	});
});
