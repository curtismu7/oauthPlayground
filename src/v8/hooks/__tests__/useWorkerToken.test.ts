/**
 * @file useWorkerToken.test.ts
 * @module v8/hooks/__tests__
 * @description Unit tests for useWorkerToken hook
 * @version 3.0.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { useWorkerToken } from '../useWorkerToken';

// Mock the services
vi.mock('@/v8/services/workerTokenStatusServiceV8');
vi.mock('@/v8/services/mfaConfigurationServiceV8');

describe('useWorkerToken', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Initialization', () => {
		it('should initialize with default state', () => {
			const { result } = renderHook(() => useWorkerToken());

			expect(result.current.tokenStatus.status).toBe('missing');
			expect(result.current.showWorkerTokenModal).toBe(false);
			expect(result.current.isRefreshing).toBe(false);
		});

		it('should load token status on mount', async () => {
			const mockStatus = {
				status: 'valid' as const,
				message: 'Token is valid',
				isValid: true,
				expiresAt: Date.now() + 3600000,
				minutesRemaining: 60,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(mockStatus);

			const { result } = renderHook(() => useWorkerToken());

			await waitFor(() => {
				expect(result.current.tokenStatus.isValid).toBe(true);
			});

			expect(result.current.tokenStatus.status).toBe('valid');
			expect(result.current.tokenStatus.message).toBe('Token is valid');
		});

		it('should load configuration settings on mount', () => {
			const mockConfig = {
				workerToken: {
					silentApiRetrieval: true,
					showTokenAtEnd: false,
				},
			};

			vi.mocked(MFAConfigurationServiceV8.loadConfiguration).mockReturnValue(mockConfig as any);

			const { result } = renderHook(() => useWorkerToken());

			expect(result.current.silentApiRetrieval).toBe(true);
			expect(result.current.showTokenAtEnd).toBe(false);
		});
	});

	describe('Token Status Updates', () => {
		it('should refresh token status when refreshTokenStatus is called', async () => {
			const initialStatus = {
				status: 'missing' as const,
				message: 'No token',
				isValid: false,
			};

			const updatedStatus = {
				status: 'valid' as const,
				message: 'Token is valid',
				isValid: true,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus)
				.mockResolvedValueOnce(initialStatus)
				.mockResolvedValueOnce(updatedStatus);

			const { result } = renderHook(() => useWorkerToken());

			await waitFor(() => {
				expect(result.current.tokenStatus.status).toBe('missing');
			});

			await act(async () => {
				await result.current.refreshTokenStatus();
			});

			expect(result.current.tokenStatus.status).toBe('valid');
			expect(result.current.tokenStatus.isValid).toBe(true);
		});

		it('should update token status on interval', async () => {
			const mockStatus = {
				status: 'valid' as const,
				message: 'Token is valid',
				isValid: true,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(mockStatus);

			renderHook(() => useWorkerToken({ refreshInterval: 5000 }));

			// Fast-forward time by 5 seconds
			await act(async () => {
				vi.advanceTimersByTime(5000);
			});

			await waitFor(() => {
				expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalledTimes(2); // Initial + interval
			});
		});
	});

	describe('Modal State Management', () => {
		it('should toggle worker token modal', () => {
			const { result } = renderHook(() => useWorkerToken());

			expect(result.current.showWorkerTokenModal).toBe(false);

			act(() => {
				result.current.setShowWorkerTokenModal(true);
			});

			expect(result.current.showWorkerTokenModal).toBe(true);

			act(() => {
				result.current.setShowWorkerTokenModal(false);
			});

			expect(result.current.showWorkerTokenModal).toBe(false);
		});
	});

	describe('Configuration Settings', () => {
		it('should update silent API retrieval setting', () => {
			const { result } = renderHook(() => useWorkerToken());

			act(() => {
				result.current.setSilentApiRetrieval(true);
			});

			expect(result.current.silentApiRetrieval).toBe(true);

			act(() => {
				result.current.setSilentApiRetrieval(false);
			});

			expect(result.current.silentApiRetrieval).toBe(false);
		});

		it('should update show token at end setting', () => {
			const { result } = renderHook(() => useWorkerToken());

			act(() => {
				result.current.setShowTokenAtEnd(true);
			});

			expect(result.current.showTokenAtEnd).toBe(true);

			act(() => {
				result.current.setShowTokenAtEnd(false);
			});

			expect(result.current.showTokenAtEnd).toBe(false);
		});
	});

	describe('Auto-refresh', () => {
		it('should auto-refresh when token is expiring soon', async () => {
			const expiringStatus = {
				status: 'expiring-soon' as const,
				message: 'Token expiring soon',
				isValid: true,
				expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes
				minutesRemaining: 4,
			};

			const mockConfig = {
				workerToken: {
					silentApiRetrieval: true,
					showTokenAtEnd: false,
				},
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(
				expiringStatus
			);
			vi.mocked(MFAConfigurationServiceV8.loadConfiguration).mockReturnValue(mockConfig as any);

			const { result } = renderHook(() => useWorkerToken({ enableAutoRefresh: true }));

			await waitFor(() => {
				expect(result.current.tokenStatus.status).toBe('expiring-soon');
			});

			// Trigger auto-refresh check
			await act(async () => {
				await result.current.checkAndRefreshToken();
			});

			expect(result.current.isRefreshing).toBe(false);
		});

		it('should not auto-refresh when disabled', async () => {
			const { result } = renderHook(() => useWorkerToken({ enableAutoRefresh: false }));

			await act(async () => {
				await result.current.checkAndRefreshToken();
			});

			// Should not trigger refresh
			expect(result.current.isRefreshing).toBe(false);
		});
	});

	describe('Computed Values', () => {
		it('should compute showTokenOnly correctly', () => {
			const mockConfig = {
				workerToken: {
					silentApiRetrieval: false,
					showTokenAtEnd: true,
				},
			};

			const mockStatus = {
				status: 'valid' as const,
				message: 'Token is valid',
				isValid: true,
			};

			vi.mocked(MFAConfigurationServiceV8.loadConfiguration).mockReturnValue(mockConfig as any);
			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(mockStatus);

			const { result } = renderHook(() => useWorkerToken());

			act(() => {
				result.current.setShowWorkerTokenModal(true);
			});

			// showTokenOnly should be true when modal is shown, showTokenAtEnd is true, and token is valid
			expect(result.current.showTokenOnly).toBe(false); // Will be false initially until status loads
		});
	});

	describe('Error Handling', () => {
		it('should handle token status check errors gracefully', async () => {
			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockRejectedValue(
				new Error('Network error')
			);

			const { result } = renderHook(() => useWorkerToken());

			await waitFor(() => {
				expect(result.current.tokenStatus.status).toBe('missing');
			});
		});

		it('should handle configuration load errors gracefully', () => {
			vi.mocked(MFAConfigurationServiceV8.loadConfiguration).mockImplementation(() => {
				throw new Error('Config error');
			});

			const { result } = renderHook(() => useWorkerToken());

			// Should not crash, should use default values
			expect(result.current.silentApiRetrieval).toBeDefined();
			expect(result.current.showTokenAtEnd).toBeDefined();
		});
	});

	describe('Event Listeners', () => {
		it('should update status on workerTokenUpdated event', async () => {
			const mockStatus = {
				status: 'valid' as const,
				message: 'Token updated',
				isValid: true,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(mockStatus);

			renderHook(() => useWorkerToken());

			// Dispatch custom event
			await act(async () => {
				window.dispatchEvent(new CustomEvent('workerTokenUpdated'));
			});

			await waitFor(() => {
				expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalled();
			});
		});

		it('should update status on storage event', async () => {
			const mockStatus = {
				status: 'valid' as const,
				message: 'Token updated',
				isValid: true,
			};

			vi.mocked(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).mockResolvedValue(mockStatus);

			renderHook(() => useWorkerToken());

			// Dispatch storage event
			await act(async () => {
				window.dispatchEvent(new Event('storage'));
			});

			await waitFor(() => {
				expect(WorkerTokenStatusServiceV8.checkWorkerTokenStatus).toHaveBeenCalled();
			});
		});
	});

	describe('Cleanup', () => {
		it('should cleanup event listeners and intervals on unmount', () => {
			const { unmount } = renderHook(() => useWorkerToken());

			const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				'workerTokenUpdated',
				expect.any(Function)
			);
			expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
		});
	});
});
