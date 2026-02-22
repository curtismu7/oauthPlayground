/**
 * @file deleteAllUsersService.test.ts
 * @module apps/user-management/services
 * @description Unit tests for DeleteAllUsersService
 * @version 8.0.0
 * @since 2026-02-20
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DeleteAllUsersService } from './deleteAllUsersService';

// Mock dependencies
jest.mock('@/services/unifiedWorkerTokenService');
jest.mock('@/v8/utils/toastNotificationsV8');

describe('DeleteAllUsersService', () => {
	const mockEnvironmentId = 'test-env-id';
	const mockCredentials = {
		accessToken: 'test-token',
		environmentId: mockEnvironmentId,
		expiresAt: Date.now() + 3600000,
	};

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock fetch
		global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

		// Mock localStorage
		const localStorageMock = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			removeItem: jest.fn(),
			clear: jest.fn(),
		};
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('validateOptions', () => {
		it('should validate correct options', () => {
			const options = {
				environmentId: mockEnvironmentId,
				batchSize: 50,
				dryRun: true,
			};

			const result = DeleteAllUsersService.validateOptions(options);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject options without environment ID', () => {
			const options = {
				environmentId: '',
				batchSize: 50,
				dryRun: true,
			};

			const result = DeleteAllUsersService.validateOptions(options);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Environment ID is required');
		});

		it('should reject invalid batch size', () => {
			const options = {
				environmentId: mockEnvironmentId,
				batchSize: 150, // Over max limit
				dryRun: true,
			};

			const result = DeleteAllUsersService.validateOptions(options);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Batch size must be between 1 and 100');
		});

		it('should reject future dates', () => {
			const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const options = {
				environmentId: mockEnvironmentId,
				batchSize: 50,
				dryRun: true,
				userFilters: {
					createdBefore: futureDate,
				},
			};

			const result = DeleteAllUsersService.validateOptions(options);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Created before date cannot be in the future');
		});
	});

	describe('getUsersSummary', () => {
		beforeEach(() => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(mockCredentials);
		});

		it('should fetch users summary successfully', async () => {
			const mockUsers = [
				{
					id: 'user1',
					username: 'testuser1',
					email: 'test1@example.com',
					status: 'active',
					createdAt: '2023-01-01',
					role: 'user',
					deviceCount: 2,
					hasActiveSessions: true,
				},
				{
					id: 'user2',
					username: 'testuser2',
					email: 'test2@example.com',
					status: 'inactive',
					createdAt: '2023-01-02',
					role: 'admin',
					deviceCount: 0,
					hasActiveSessions: false,
				},
			];

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					users: mockUsers,
					total: 2,
					filtered: 2,
				}),
			});

			const options = {
				environmentId: mockEnvironmentId,
				userFilters: {
					status: 'active',
				},
			};

			const result = await DeleteAllUsersService.getUsersSummary(options);

			expect(result.users).toEqual(mockUsers);
			expect(result.total).toBe(2);
			expect(result.filtered).toBe(2);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/users/summary?'),
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
						'Content-Type': 'application/json',
					}),
				})
			);
		});

		it('should handle API errors', async () => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(mockCredentials);

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				statusText: 'Internal Server Error',
			});

			const options = {
				environmentId: mockEnvironmentId,
			};

			await expect(DeleteAllUsersService.getUsersSummary(options)).rejects.toThrow(
				'Failed to fetch users summary: Internal Server Error'
			);
		});

		it('should handle missing credentials', async () => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(null);

			const options = {
				environmentId: mockEnvironmentId,
			};

			await expect(DeleteAllUsersService.getUsersSummary(options)).rejects.toThrow(
				'Valid worker token required for user deletion'
			);
		});
	});

	describe('deleteUsers', () => {
		beforeEach(() => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(mockCredentials);
		});

		it('should delete users successfully', async () => {
			const mockUsers = [
				{
					id: 'user1',
					username: 'testuser1',
					email: 'test1@example.com',
					status: 'active',
					createdAt: '2023-01-01',
					role: 'user',
					deviceCount: 2,
					hasActiveSessions: true,
				},
			];

			// Mock getUsersSummary
			jest.spyOn(DeleteAllUsersService, 'getUsersSummary').mockResolvedValueOnce({
				users: mockUsers,
				total: 1,
				filtered: 1,
			});

			// Mock individual user deletion
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			const options = {
				environmentId: mockEnvironmentId,
				dryRun: false,
				batchSize: 50,
			};

			const progressCallback = jest.fn();
			const result = await DeleteAllUsersService.deleteUsers(options, progressCallback);

			expect(result.totalUsers).toBe(1);
			expect(result.successful).toBe(1);
			expect(result.failed).toBe(0);
			expect(result.dryRun).toBe(false);
			expect(progressCallback).toHaveBeenCalled();
		});

		it('should handle dry run mode', async () => {
			const mockUsers = [
				{
					id: 'user1',
					username: 'testuser1',
					email: 'test1@example.com',
					status: 'active',
					createdAt: '2023-01-01',
					role: 'user',
					deviceCount: 2,
					hasActiveSessions: true,
				},
			];

			// Mock getUsersSummary
			jest.spyOn(DeleteAllUsersService, 'getUsersSummary').mockResolvedValueOnce({
				users: mockUsers,
				total: 1,
				filtered: 1,
			});

			const options = {
				environmentId: mockEnvironmentId,
				dryRun: true,
				batchSize: 50,
			};

			const progressCallback = jest.fn();
			const result = await DeleteAllUsersService.deleteUsers(options, progressCallback);

			expect(result.totalUsers).toBe(1);
			expect(result.successful).toBe(1);
			expect(result.failed).toBe(0);
			expect(result.dryRun).toBe(true);
			expect(global.fetch).not.toHaveBeenCalledWith(
				expect.stringContaining('/api/users/'),
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('should handle deletion errors', async () => {
			const mockUsers = [
				{
					id: 'user1',
					username: 'testuser1',
					email: 'test1@example.com',
					status: 'active',
					createdAt: '2023-01-01',
					role: 'user',
					deviceCount: 2,
					hasActiveSessions: true,
				},
			];

			// Mock getUsersSummary
			jest.spyOn(DeleteAllUsersService, 'getUsersSummary').mockResolvedValueOnce({
				users: mockUsers,
				total: 1,
				filtered: 1,
			});

			// Mock failed deletion
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				statusText: 'User not found',
			});

			const options = {
				environmentId: mockEnvironmentId,
				dryRun: false,
				batchSize: 50,
			};

			const progressCallback = jest.fn();
			const result = await DeleteAllUsersService.deleteUsers(options, progressCallback);

			expect(result.totalUsers).toBe(1);
			expect(result.successful).toBe(0);
			expect(result.failed).toBe(1);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].userId).toBe('user1');
			expect(result.errors[0].username).toBe('testuser1');
		});

		it('should handle empty user list', async () => {
			// Mock getUsersSummary with empty list
			jest.spyOn(DeleteAllUsersService, 'getUsersSummary').mockResolvedValueOnce({
				users: [],
				total: 0,
				filtered: 0,
			});

			const options = {
				environmentId: mockEnvironmentId,
				dryRun: false,
				batchSize: 50,
			};

			const progressCallback = jest.fn();
			const result = await DeleteAllUsersService.deleteUsers(options, progressCallback);

			expect(result.totalUsers).toBe(0);
			expect(result.successful).toBe(0);
			expect(result.failed).toBe(0);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe('getOperationHistory', () => {
		it('should return operation history', async () => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(mockCredentials);

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => [
					{
						operationId: 'bulk-delete-1234567890',
						timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
						type: 'delete',
						status: 'completed',
						userCount: 150,
						duration: 45 * 1000,
					},
				],
			});

			const history = await DeleteAllUsersService.getOperationHistory(mockEnvironmentId);

			expect(history).toHaveLength(1);
			expect(history[0].operationId).toBe('bulk-delete-1234567890');
			expect(history[0].type).toBe('delete');
			expect(history[0].status).toBe('completed');
		});
	});

	describe('error handling', () => {
		it('should handle network errors gracefully', async () => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(mockCredentials);

			(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

			const options = {
				environmentId: mockEnvironmentId,
			};

			await expect(DeleteAllUsersService.getUsersSummary(options)).rejects.toThrow('Network error');
		});

		it('should handle timeout errors', async () => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(mockCredentials);

			const mockUsers = Array.from({ length: 200 }, (_, i) => ({
				id: `user${i}`,
				username: `user${i}`,
				email: `user${i}@example.com`,
				status: 'active' as const,
				createdAt: '2023-01-01',
				role: 'user',
				deviceCount: 1,
				hasActiveSessions: false,
			}));

			// Mock getUsersSummary
			jest.spyOn(DeleteAllUsersService, 'getUsersSummary').mockResolvedValueOnce({
				users: mockUsers,
				total: 200,
				filtered: 200,
			});

			// Mock slow deletion that will timeout
			(global.fetch as jest.Mock).mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 1000))
			);

			const options = {
				environmentId: mockEnvironmentId,
				dryRun: false,
				batchSize: 1, // Small batch to ensure multiple iterations
			};

			// Mock Date.now to simulate timeout
			const originalDateNow = Date.now;
			let callCount = 0;
			Date.now = jest.fn(() => {
				callCount++;
				// Return time that exceeds timeout after a few calls
				return callCount > 5 ? originalDateNow() + 31 * 60 * 1000 : originalDateNow();
			});

			await expect(DeleteAllUsersService.deleteUsers(options)).rejects.toThrow(
				'Operation timeout: Bulk deletion taking too long'
			);

			Date.now = originalDateNow;
		});
	});

	describe('progress tracking', () => {
		it('should call progress callback with correct data', async () => {
			const { unifiedWorkerTokenService } = require('@/services/unifiedWorkerTokenService');
			unifiedWorkerTokenService.loadCredentials.mockResolvedValue(mockCredentials);

			const mockUsers = Array.from({ length: 5 }, (_, i) => ({
				id: `user${i}`,
				username: `user${i}`,
				email: `user${i}@example.com`,
				status: 'active' as const,
				createdAt: '2023-01-01',
				role: 'user',
				deviceCount: 1,
				hasActiveSessions: false,
			}));

			// Mock getUsersSummary
			jest.spyOn(DeleteAllUsersService, 'getUsersSummary').mockResolvedValueOnce({
				users: mockUsers,
				total: 5,
				filtered: 5,
			});

			// Mock successful deletions
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({}),
			});

			const options = {
				environmentId: mockEnvironmentId,
				dryRun: false,
				batchSize: 2,
			};

			const progressCallback = jest.fn();
			await DeleteAllUsersService.deleteUsers(options, progressCallback);

			// Should be called multiple times for progress updates
			expect(progressCallback).toHaveBeenCalledTimes(5); // Once per user

			// Check final progress call
			const finalCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
			expect(finalCall.current).toBe(5);
			expect(finalCall.total).toBe(5);
			expect(finalCall.percentage).toBe(100);
		});
	});
});
