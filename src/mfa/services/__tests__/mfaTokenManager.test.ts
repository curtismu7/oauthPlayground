/**
 * @file mfaTokenManager.test.ts
 * @module v8/services/__tests__
 * @description Unit tests for MFA Token Manager service
 * @version 8.0.0
 * @since 2026-01-29
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MFATokenManager } from '../mfaTokenManager';
import type { TokenStatusInfo } from '../workerTokenStatusService';
import { WorkerTokenStatusService } from '../workerTokenStatusService';

// Mock WorkerTokenStatusService
vi.mock('../workerTokenStatusService', () => ({
	WorkerTokenStatusService: {
		checkWorkerTokenStatusSync: vi.fn(),
		checkWorkerTokenStatus: vi.fn(),
	},
}));

describe('MFATokenManager', () => {
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
		MFATokenManager.resetInstance();

		// Setup default mock returns
		vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatusSync).mockReturnValue(
			mockTokenState
		);
		vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mockResolvedValue(mockTokenState);
	});

	afterEach(() => {
		MFATokenManager.resetInstance();
		vi.useRealTimers();
	});

	describe('Singleton behavior', () => {
		it('should return same instance on multiple getInstance calls', () => {
			const instance1 = MFATokenManager.getInstance();
			const instance2 = MFATokenManager.getInstance();

			expect(instance1).toBe(instance2);
		});

		it('should be resettable for testing', () => {
			const instance1 = MFATokenManager.getInstance();
			MFATokenManager.resetInstance();
			const instance2 = MFATokenManager.getInstance();

			expect(instance1).not.toBe(instance2);
		});

		it('should initialize with sync token check', () => {
			MFATokenManager.getInstance();

			expect(WorkerTokenStatusService.checkWorkerTokenStatusSync).toHaveBeenCalledTimes(1);
		});
	});

	describe('Token state management', () => {
		it('should initialize with default token state', () => {
			const manager = MFATokenManager.getInstance();
			const state = manager.getTokenState();

			expect(state).toEqual(mockTokenState);
		});

		it('should update token state on refresh', async () => {
			const manager = MFATokenManager.getInstance();

			const newState: TokenStatusInfo = {
				status: 'expiring-soon',
				message: 'Token expiring soon',
				isValid: true,
				expiresAt: Date.now() + 300000,
				minutesRemaining: 5,
			};

			vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mockResolvedValue(newState);

			await manager.refreshToken();
			const state = manager.getTokenState();

			expect(state).toEqual(newState);
		});

		it('should check token validity', () => {
			const manager = MFATokenManager.getInstance();
			const state = manager.getTokenState();

			expect(state.isValid).toBe(true);
		});

		it('should detect expired tokens', async () => {
			const manager = MFATokenManager.getInstance();

			const expiredState: TokenStatusInfo = {
				status: 'expired',
				message: 'Token expired',
				isValid: false,
				expiresAt: Date.now() - 1000,
			};

			vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mockResolvedValue(expiredState);

			await manager.refreshToken();
			const state = manager.getTokenState();

			expect(state.status).toBe('expired');
			expect(state.isValid).toBe(false);
		});

		it('should detect expiring-soon tokens', async () => {
			const manager = MFATokenManager.getInstance();

			const expiringSoonState: TokenStatusInfo = {
				status: 'expiring-soon',
				message: 'Token expiring soon',
				isValid: true,
				expiresAt: Date.now() + 300000,
				minutesRemaining: 5,
			};

			vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mockResolvedValue(
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
			const manager = MFATokenManager.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);

			// Should be called immediately with current state
			expect(callback).toHaveBeenCalledWith(mockTokenState);
		});

		it('should notify subscribers on token refresh', async () => {
			const manager = MFATokenManager.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);
			callback.mockClear(); // Clear initial call

			const newState: TokenStatusInfo = {
				status: 'expiring-soon',
				message: 'Token expiring',
				isValid: true,
			};

			vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mockResolvedValue(newState);

			await manager.refreshToken();

			expect(callback).toHaveBeenCalledWith(newState);
		});

		it('should allow unsubscribing', () => {
			const manager = MFATokenManager.getInstance();
			const callback = vi.fn();

			const unsubscribe = manager.subscribe(callback);
			callback.mockClear();

			unsubscribe();

			// Manually trigger notify (private method access for testing)
			(manager as any).notify();

			expect(callback).not.toHaveBeenCalled();
		});

		it('should not notify unsubscribed callbacks', async () => {
			const manager = MFATokenManager.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);
			manager.unsubscribe(callback);
			callback.mockClear();

			await manager.refreshToken();

			expect(callback).not.toHaveBeenCalled();
		});

		it('should handle multiple subscribers', async () => {
			const manager = MFATokenManager.getInstance();
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

			vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mockResolvedValue(newState);

			await manager.refreshToken();

			expect(callback1).toHaveBeenCalledWith(newState);
			expect(callback2).toHaveBeenCalledWith(newState);
			expect(callback3).toHaveBeenCalledWith(newState);
		});
	});

	describe('Auto-refresh', () => {
		it('should auto-refresh tokens at configured interval', async () => {
			const manager = MFATokenManager.getInstance({ autoRefresh: true, refreshInterval: 1000 });

			manager.startAutoRefresh();

			// Fast-forward time
			await vi.advanceTimersByTimeAsync(1000);

			expect(WorkerTokenStatusService.checkWorkerTokenStatus).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(1000);

			expect(WorkerTokenStatusService.checkWorkerTokenStatus).toHaveBeenCalledTimes(2);
		});

		it('should stop auto-refresh when stopped', async () => {
			const manager = MFATokenManager.getInstance({ autoRefresh: true, refreshInterval: 1000 });

			manager.startAutoRefresh();
			await vi.advanceTimersByTimeAsync(1000);

			manager.stopAutoRefresh();

			const callCount = vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mock.calls
				.length;

			await vi.advanceTimersByTimeAsync(2000);

			expect(WorkerTokenStatusService.checkWorkerTokenStatus).toHaveBeenCalledTimes(callCount);
		});

		it('should handle refresh errors gracefully', async () => {
			const manager = MFATokenManager.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);
			callback.mockClear();

			vi.mocked(WorkerTokenStatusService.checkWorkerTokenStatus).mockRejectedValue(
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
			const manager = MFATokenManager.getInstance({ autoRefresh: false });

			manager.startAutoRefresh();

			// Should not start timer
			expect((manager as any).refreshTimer).toBeNull();
		});
	});

	describe('Integration with WorkerTokenStatusService', () => {
		it('should delegate to WorkerTokenStatusService for status checks', async () => {
			const manager = MFATokenManager.getInstance();

			await manager.refreshToken();

			expect(WorkerTokenStatusService.checkWorkerTokenStatus).toHaveBeenCalled();
		});

		it('should use existing worker token service methods', () => {
			MFATokenManager.getInstance();

			expect(WorkerTokenStatusService.checkWorkerTokenStatusSync).toHaveBeenCalled();
		});
	});

	describe('Configuration management', () => {
		it('should use default config when none provided', () => {
			const manager = MFATokenManager.getInstance();
			const config = manager.getConfig();

			expect(config.refreshInterval).toBe(30000);
			expect(config.autoRefresh).toBe(true);
		});

		it('should accept custom config', () => {
			const manager = MFATokenManager.getInstance({
				refreshInterval: 5000,
				autoRefresh: false,
			});
			const config = manager.getConfig();

			expect(config.refreshInterval).toBe(5000);
			expect(config.autoRefresh).toBe(false);
		});

		it('should update config dynamically', () => {
			const manager = MFATokenManager.getInstance();

			manager.updateConfig({ refreshInterval: 10000 });

			const config = manager.getConfig();
			expect(config.refreshInterval).toBe(10000);
		});

		it('should restart auto-refresh when interval changes', async () => {
			const manager = MFATokenManager.getInstance({ autoRefresh: true, refreshInterval: 1000 });

			manager.startAutoRefresh();

			manager.updateConfig({ refreshInterval: 2000 });

			await vi.advanceTimersByTimeAsync(1000);
			expect(WorkerTokenStatusService.checkWorkerTokenStatus).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1000);
			expect(WorkerTokenStatusService.checkWorkerTokenStatus).toHaveBeenCalledTimes(1);
		});
	});
});
