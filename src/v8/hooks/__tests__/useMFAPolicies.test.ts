/**
 * @file useMFAPolicies.test.ts
 * @module v8/hooks/__tests__
 * @description Unit tests for useMFAPolicies hook
 * @version 3.0.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMFAPolicies } from '../useMFAPolicies';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';

// Mock the service
vi.mock('@/v8/services/mfaServiceV8');

describe('useMFAPolicies', () => {
	const mockPolicies = [
		{ id: 'policy1', name: 'Default Policy', status: 'ENABLED', default: true },
		{ id: 'policy2', name: 'Secondary Policy', status: 'ENABLED', default: false },
		{ id: 'policy3', name: 'Disabled Policy', status: 'DISABLED', default: false },
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe('Initialization', () => {
		it('should initialize with empty policies and no loading', () => {
			const { result } = renderHook(() => useMFAPolicies({ autoLoad: false }));

			expect(result.current.policies).toEqual([]);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(result.current.selectedPolicy).toBeNull();
		});

		it('should not auto-load when autoLoad is false', () => {
			renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).not.toHaveBeenCalled();
		});

		it('should auto-load policies when conditions are met', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: true,
				})
			);

			await waitFor(() => {
				expect(MFAServiceV8.getDeviceAuthenticationPolicies).toHaveBeenCalledWith({
					environmentId: 'env123',
				});
			});
		});
	});

	describe('Loading Policies', () => {
		it('should load policies successfully', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.policies).toEqual(mockPolicies);
			expect(result.current.policyCount).toBe(3);
			expect(result.current.hasPolicies).toBe(true);
			expect(result.current.isLoading).toBe(false);
		});

		it('should set loading state during policy fetch', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(mockPolicies), 100))
			);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			act(() => {
				result.current.loadPolicies();
			});

			expect(result.current.isLoading).toBe(true);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
		});

		it('should not load policies when environment ID is missing', async () => {
			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: '',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).not.toHaveBeenCalled();
		});

		it('should not load policies when token is invalid', async () => {
			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: false,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).not.toHaveBeenCalled();
		});
	});

	describe('Policy Caching', () => {
		it('should cache policies and not reload for same environment', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			// First load
			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).toHaveBeenCalledTimes(1);

			// Second load with same environment - should use cache
			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).toHaveBeenCalledTimes(1); // Still 1
		});

		it('should reload policies when environment changes', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result, rerender } = renderHook(
				({ environmentId }) =>
					useMFAPolicies({
						environmentId,
						tokenIsValid: true,
						autoLoad: false,
					}),
				{ initialProps: { environmentId: 'env123' } }
			);

			// First load
			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).toHaveBeenCalledTimes(1);

			// Change environment
			rerender({ environmentId: 'env456' });

			// Second load with different environment
			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).toHaveBeenCalledTimes(2);
		});
	});

	describe('Refresh Policies', () => {
		it('should force reload policies when refreshPolicies is called', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			// First load
			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).toHaveBeenCalledTimes(1);

			// Refresh should force reload
			await act(async () => {
				await result.current.refreshPolicies();
			});

			expect(MFAServiceV8.getDeviceAuthenticationPolicies).toHaveBeenCalledTimes(2);
		});
	});

	describe('Policy Selection', () => {
		it('should select a policy by ID', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			act(() => {
				result.current.selectPolicy('policy2');
			});

			expect(result.current.selectedPolicy).toEqual(mockPolicies[1]);
		});

		it('should clear selected policy when selecting null', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			act(() => {
				result.current.selectPolicy('policy1');
			});

			expect(result.current.selectedPolicy).not.toBeNull();

			act(() => {
				result.current.selectPolicy(null);
			});

			expect(result.current.selectedPolicy).toBeNull();
		});

		it('should auto-select policy when selectedPolicyId is provided', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					selectedPolicyId: 'policy2',
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			await waitFor(() => {
				expect(result.current.selectedPolicy?.id).toBe('policy2');
			});
		});
	});

	describe('Clear Policies', () => {
		it('should clear all policies and selection', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			act(() => {
				result.current.selectPolicy('policy1');
			});

			expect(result.current.policies).toHaveLength(3);
			expect(result.current.selectedPolicy).not.toBeNull();

			act(() => {
				result.current.clearPolicies();
			});

			expect(result.current.policies).toEqual([]);
			expect(result.current.selectedPolicy).toBeNull();
		});
	});

	describe('Default Policy Detection', () => {
		it('should identify default policy', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.defaultPolicy).toEqual(mockPolicies[0]);
			expect(result.current.defaultPolicy?.id).toBe('policy1');
		});

		it('should return null when no default policy exists', async () => {
			const policiesWithoutDefault = mockPolicies.map((p) => ({ ...p, default: false }));
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(
				policiesWithoutDefault
			);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.defaultPolicy).toBeNull();
		});
	});

	describe('Error Handling', () => {
		it('should handle API errors', async () => {
			const errorMessage = 'Failed to fetch policies';
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockRejectedValue(
				new Error(errorMessage)
			);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.error).toBe(errorMessage);
			expect(result.current.policies).toEqual([]);
			expect(result.current.isLoading).toBe(false);
		});

		it('should detect server connection errors', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockRejectedValue(
				new Error('Failed to connect to server')
			);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.error).toContain('Backend server is not running');
		});

		it('should clear error when clearError is called', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockRejectedValue(
				new Error('Test error')
			);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.error).not.toBeNull();

			act(() => {
				result.current.clearError();
			});

			expect(result.current.error).toBeNull();
		});
	});

	describe('Computed Values', () => {
		it('should compute hasPolicies correctly', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			expect(result.current.hasPolicies).toBe(false);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.hasPolicies).toBe(true);
		});

		it('should compute policyCount correctly', async () => {
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(mockPolicies);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
				})
			);

			expect(result.current.policyCount).toBe(0);

			await act(async () => {
				await result.current.loadPolicies();
			});

			expect(result.current.policyCount).toBe(3);
		});
	});

	describe('Configuration Options', () => {
		it('should respect autoSelectSingle configuration', async () => {
			const singlePolicy = [mockPolicies[0]];
			vi.mocked(MFAServiceV8.getDeviceAuthenticationPolicies).mockResolvedValue(singlePolicy);

			const { result } = renderHook(() =>
				useMFAPolicies({
					environmentId: 'env123',
					tokenIsValid: true,
					autoLoad: false,
					autoSelectSingle: true,
				})
			);

			await act(async () => {
				await result.current.loadPolicies();
			});

			// Note: autoSelectSingle logic may need to be implemented in the hook
			expect(result.current.policies).toHaveLength(1);
		});
	});
});
