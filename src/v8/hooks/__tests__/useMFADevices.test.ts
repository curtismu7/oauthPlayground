/**
 * @file useMFADevices.test.ts
 * @module v8/hooks/__tests__
 * @description Unit tests for useMFADevices hook
 * @version 3.0.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { useMFADevices } from '../useMFADevices';

// Mock the service
vi.mock('@/v8/services/mfaServiceV8');

describe('useMFADevices', () => {
	const mockDevices = [
		{ id: '1', name: 'SMS Device', type: 'SMS', status: 'ACTIVE' },
		{ id: '2', name: 'Email Device', type: 'EMAIL', status: 'ACTIVE' },
		{ id: '3', name: 'TOTP Device', type: 'TOTP', status: 'ACTIVATION_REQUIRED' },
	];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Initialization', () => {
		it('should initialize with empty devices and no loading', () => {
			const { result } = renderHook(() => useMFADevices({ autoLoad: false }));

			expect(result.current.devices).toEqual([]);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(result.current.selectedDevice).toBeNull();
		});

		it('should not auto-load when autoLoad is false', () => {
			renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			expect(MFAServiceV8.getAllDevices).not.toHaveBeenCalled();
		});

		it('should auto-load devices when all required params are provided', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: true,
					debounceDelay: 0,
				})
			);

			await waitFor(() => {
				expect(MFAServiceV8.getAllDevices).toHaveBeenCalledWith({
					environmentId: 'env123',
					username: 'testuser',
				});
			});
		});
	});

	describe('Loading Devices', () => {
		it('should load devices successfully', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(result.current.devices).toEqual(mockDevices);
			expect(result.current.deviceCount).toBe(3);
			expect(result.current.hasDevices).toBe(true);
			expect(result.current.isLoading).toBe(false);
		});

		it('should set loading state during device fetch', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockDevices), 100))
			);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			act(() => {
				result.current.loadDevices();
			});

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
		});

		it('should not load devices when required params are missing', async () => {
			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: '',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(MFAServiceV8.getAllDevices).not.toHaveBeenCalled();
			expect(result.current.devices).toEqual([]);
		});

		it('should not load devices when token is invalid', async () => {
			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: false,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(MFAServiceV8.getAllDevices).not.toHaveBeenCalled();
		});
	});

	describe('Debouncing', () => {
		it('should debounce device loading', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: true,
					debounceDelay: 500,
				})
			);

			// Should not call immediately
			expect(MFAServiceV8.getAllDevices).not.toHaveBeenCalled();

			// Fast-forward time
			await act(async () => {
				vi.advanceTimersByTime(500);
			});

			await waitFor(() => {
				expect(MFAServiceV8.getAllDevices).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('Caching and Duplicate Prevention', () => {
		it('should not reload devices for same username/environment', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			// First load
			await act(async () => {
				await result.current.loadDevices();
			});

			expect(MFAServiceV8.getAllDevices).toHaveBeenCalledTimes(1);

			// Second load with same params - should skip
			await act(async () => {
				await result.current.loadDevices();
			});

			expect(MFAServiceV8.getAllDevices).toHaveBeenCalledTimes(1); // Still 1
		});

		it('should reload devices when username changes', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result, rerender } = renderHook(
				({ username }) =>
					useMFADevices({
						environmentId: 'env123',
						username,
						tokenIsValid: true,
						autoLoad: false,
					}),
				{ initialProps: { username: 'user1' } }
			);

			// First load
			await act(async () => {
				await result.current.loadDevices();
			});

			expect(MFAServiceV8.getAllDevices).toHaveBeenCalledTimes(1);

			// Change username
			rerender({ username: 'user2' });

			// Second load with different username
			await act(async () => {
				await result.current.loadDevices();
			});

			expect(MFAServiceV8.getAllDevices).toHaveBeenCalledTimes(2);
		});
	});

	describe('Refresh Devices', () => {
		it('should force reload devices when refreshDevices is called', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			// First load
			await act(async () => {
				await result.current.loadDevices();
			});

			expect(MFAServiceV8.getAllDevices).toHaveBeenCalledTimes(1);

			// Refresh should force reload
			await act(async () => {
				await result.current.refreshDevices();
			});

			expect(MFAServiceV8.getAllDevices).toHaveBeenCalledTimes(2);
		});
	});

	describe('Device Selection', () => {
		it('should select a device', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			act(() => {
				result.current.selectDevice(mockDevices[0]);
			});

			expect(result.current.selectedDevice).toEqual(mockDevices[0]);
		});

		it('should clear selected device', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			act(() => {
				result.current.selectDevice(mockDevices[0]);
			});

			expect(result.current.selectedDevice).toEqual(mockDevices[0]);

			act(() => {
				result.current.selectDevice(null);
			});

			expect(result.current.selectedDevice).toBeNull();
		});
	});

	describe('Clear Devices', () => {
		it('should clear all devices and selection', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			act(() => {
				result.current.selectDevice(mockDevices[0]);
			});

			expect(result.current.devices).toHaveLength(3);
			expect(result.current.selectedDevice).not.toBeNull();

			act(() => {
				result.current.clearDevices();
			});

			expect(result.current.devices).toEqual([]);
			expect(result.current.selectedDevice).toBeNull();
		});
	});

	describe('Error Handling', () => {
		it('should handle API errors', async () => {
			const errorMessage = 'Failed to fetch devices';
			vi.mocked(MFAServiceV8.getAllDevices).mockRejectedValue(new Error(errorMessage));

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(result.current.error).toBe(errorMessage);
			expect(result.current.devices).toEqual([]);
			expect(result.current.isLoading).toBe(false);
		});

		it('should detect server connection errors', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockRejectedValue(
				new Error('Failed to connect to server')
			);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(result.current.error).toContain('Backend server is not running');
		});

		it('should clear error when clearError is called', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockRejectedValue(new Error('Test error'));

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(result.current.error).not.toBeNull();

			act(() => {
				result.current.clearError();
			});

			expect(result.current.error).toBeNull();
		});
	});

	describe('Computed Values', () => {
		it('should compute hasDevices correctly', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			expect(result.current.hasDevices).toBe(false);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(result.current.hasDevices).toBe(true);
		});

		it('should compute deviceCount correctly', async () => {
			vi.mocked(MFAServiceV8.getAllDevices).mockResolvedValue(mockDevices);

			const { result } = renderHook(() =>
				useMFADevices({
					environmentId: 'env123',
					username: 'testuser',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			expect(result.current.deviceCount).toBe(0);

			await act(async () => {
				await result.current.loadDevices();
			});

			expect(result.current.deviceCount).toBe(3);
		});
	});
});
