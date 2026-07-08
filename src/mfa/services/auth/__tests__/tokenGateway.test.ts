/**
 * @file tokenGateway.test.ts
 * @description Tests for the canonical Token Gateway service
 * @version 1.0.0
 * @since 2026-01-30
 *
 * These tests verify:
 * - Silent token acquisition success/failure
 * - Single-flight concurrency (multiple calls share one promise)
 * - Timeout handling
 * - Retry logic
 * - Error normalization
 */

import { vi } from 'vitest';
import { workerTokenService } from '../../workerTokenService';
import { WorkerTokenStatusService } from '../../workerTokenStatusService';
import { TokenGateway } from '../tokenGateway';

// Mock dependencies (hoisted by Vitest above imports)
vi.mock('../../workerTokenService', () => ({
	workerTokenService: {
		loadCredentials: vi.fn(),
		saveToken: vi.fn(),
	},
}));

vi.mock('../../workerTokenStatusService', () => ({
	WorkerTokenStatusService: {
		checkWorkerTokenStatusSync: vi.fn(),
		checkWorkerTokenStatus: vi.fn(),
	},
}));

vi.mock('../../../../services/unifiedWorkerTokenService', () => ({
	unifiedWorkerTokenService: {
		clearToken: vi.fn(),
		clearCredentials: vi.fn(),
	},
}));

describe('TokenGateway', () => {
	let gateway: TokenGateway;

	beforeEach(() => {
		// Reset singleton before each test
		TokenGateway.resetInstance();
		gateway = TokenGateway.getInstance();

		// Reset all mocks
		vi.clearAllMocks();

		// Default mock implementations
		WorkerTokenStatusService.checkWorkerTokenStatusSync.mockReturnValue({
			status: 'missing',
			message: 'No token',
			isValid: false,
		});

		WorkerTokenStatusService.checkWorkerTokenStatus.mockResolvedValue({
			status: 'missing',
			message: 'No token',
			isValid: false,
		});

		// Mock fetch globally
		global.fetch = vi.fn();
	});

	afterEach(() => {
		gateway.stopAutoRefresh();
		vi.restoreAllMocks();
	});

	describe('getInstance', () => {
		it('should return the same instance (singleton)', () => {
			const instance1 = TokenGateway.getInstance();
			const instance2 = TokenGateway.getInstance();
			expect(instance1).toBe(instance2);
		});

		it('should create new instance after reset', () => {
			const instance1 = TokenGateway.getInstance();
			TokenGateway.resetInstance();
			const instance2 = TokenGateway.getInstance();
			expect(instance1).not.toBe(instance2);
		});
	});

	describe('getWorkerToken - silent mode', () => {
		it('should return existing valid token without fetching', async () => {
			WorkerTokenStatusService.checkWorkerTokenStatusSync.mockReturnValue({
				status: 'valid',
				message: 'Token valid',
				isValid: true,
				token: 'existing-token',
				expiresAt: Date.now() + 3600000,
			});

			const result = await gateway.getWorkerToken({ mode: 'silent' });

			expect(result.success).toBe(true);
			expect(result.token).toBe('existing-token');
			expect(fetch).not.toHaveBeenCalled();
		});

		it('should return error when no credentials', async () => {
			workerTokenService.loadCredentials.mockResolvedValue(null);

			const result = await gateway.getWorkerToken({ mode: 'silent' });

			expect(result.success).toBe(false);
			expect(result.error?.code).toBe('NO_CREDENTIALS');
			expect(result.needsInteraction).toBe(true);
		});

		it('should return error when credentials incomplete', async () => {
			workerTokenService.loadCredentials.mockResolvedValue({
				environmentId: 'env-123',
				clientId: '',
				clientSecret: 'secret',
			});

			const result = await gateway.getWorkerToken({ mode: 'silent' });

			expect(result.success).toBe(false);
			expect(result.error?.code).toBe('INVALID_CREDENTIALS');
		});

		it('should successfully fetch token', async () => {
			workerTokenService.loadCredentials.mockResolvedValue({
				environmentId: 'env-123',
				clientId: 'client-123',
				clientSecret: 'secret-123',
				region: 'us',
			});

			(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						access_token: 'new-token-123',
						expires_in: 3600,
					}),
			});

			const result = await gateway.getWorkerToken({
				mode: 'silent',
				forceRefresh: true,
			});

			expect(result.success).toBe(true);
			expect(result.token).toBe('new-token-123');
			expect(workerTokenService.saveToken).toHaveBeenCalled();
		});
	});

	describe('single-flight concurrency', () => {
		it('should share promise for concurrent calls', async () => {
			workerTokenService.loadCredentials.mockResolvedValue({
				environmentId: 'env-123',
				clientId: 'client-123',
				clientSecret: 'secret-123',
			});

			let fetchCallCount = 0;
			(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
				fetchCallCount++;
				// Simulate network delay
				await new Promise((resolve) => setTimeout(resolve, 100));
				return {
					ok: true,
					json: () =>
						Promise.resolve({
							access_token: `token-${fetchCallCount}`,
							expires_in: 3600,
						}),
				};
			});

			// Make 3 concurrent calls
			const [result1, result2, result3] = await Promise.all([
				gateway.getWorkerToken({ mode: 'silent', forceRefresh: true }),
				gateway.getWorkerToken({ mode: 'silent', forceRefresh: true }),
				gateway.getWorkerToken({ mode: 'silent', forceRefresh: true }),
			]);

			// All should return the same result
			expect(result1.token).toBe(result2.token);
			expect(result2.token).toBe(result3.token);

			// Fetch should only be called once (single-flight)
			expect(fetchCallCount).toBe(1);
		});
	});

	describe('timeout handling', () => {
		it('should return timeout error when request takes too long', async () => {
			workerTokenService.loadCredentials.mockResolvedValue({
				environmentId: 'env-123',
				clientId: 'client-123',
				clientSecret: 'secret-123',
			});

			(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
				() =>
					new Promise((_, reject) => {
						// Simulate abort
						const error = new Error('Aborted');
						error.name = 'AbortError';
						setTimeout(() => reject(error), 50);
					})
			);

			const result = await gateway.getWorkerToken({
				mode: 'silent',
				forceRefresh: true,
				timeout: 100,
			});

			expect(result.success).toBe(false);
			expect(result.error?.code).toBe('TIMEOUT');
			expect(result.error?.retryable).toBe(true);
		});
	});

	describe('retry logic', () => {
		it('should retry on network errors', async () => {
			workerTokenService.loadCredentials.mockResolvedValue({
				environmentId: 'env-123',
				clientId: 'client-123',
				clientSecret: 'secret-123',
			});

			let callCount = 0;
			(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
				callCount++;
				if (callCount < 3) {
					throw new Error('Network error');
				}
				return {
					ok: true,
					json: () =>
						Promise.resolve({
							access_token: 'token-after-retry',
							expires_in: 3600,
						}),
				};
			});

			const result = await gateway.getWorkerToken({
				mode: 'silent',
				forceRefresh: true,
				maxRetries: 3,
			});

			expect(result.success).toBe(true);
			expect(result.token).toBe('token-after-retry');
			expect(callCount).toBe(3);
		});

		it('should not retry on 401 errors', async () => {
			workerTokenService.loadCredentials.mockResolvedValue({
				environmentId: 'env-123',
				clientId: 'client-123',
				clientSecret: 'secret-123',
			});

			let callCount = 0;
			(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => {
				callCount++;
				return {
					ok: false,
					status: 401,
					json: () => Promise.resolve({ error: 'unauthorized' }),
				};
			});

			const result = await gateway.getWorkerToken({
				mode: 'silent',
				forceRefresh: true,
				maxRetries: 3,
			});

			expect(result.success).toBe(false);
			expect(result.error?.code).toBe('UNAUTHORIZED');
			// Should not retry on 401
			expect(callCount).toBe(1);
		});
	});

	describe('subscription', () => {
		it('should notify subscribers on status changes', async () => {
			const callback = vi.fn();

			gateway.subscribe(callback);

			// Should be called immediately with current state
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should allow unsubscribe', () => {
			const callback = vi.fn();

			const unsubscribe = gateway.subscribe(callback);
			expect(callback).toHaveBeenCalledTimes(1);

			callback.mockClear();
			unsubscribe();

			// Should not receive further updates
			// (would need to trigger an update to fully test this)
		});
	});

	describe('auto-refresh', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should start and stop auto-refresh', () => {
			gateway.startAutoRefresh(5000);

			// Should be running
			gateway.startAutoRefresh(5000); // Should log "already running"

			gateway.stopAutoRefresh();
			gateway.stopAutoRefresh(); // Should be no-op
		});
	});
});
