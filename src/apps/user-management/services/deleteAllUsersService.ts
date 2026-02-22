/**
 * @file deleteAllUsersService.ts
 * @module apps/user-management/services
 * @description Service for bulk user deletion operations with comprehensive error handling
 * @version 8.0.0
 * @since 2026-02-20
 */

import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// ============================================================================
// TYPES
// ============================================================================

export interface BulkUserDeletionOptions {
	environmentId: string;
	userFilters?: {
		status?: 'active' | 'inactive' | 'pending' | 'all';
		role?: string;
		createdBefore?: Date;
		lastLoginBefore?: Date;
	};
	dryRun?: boolean;
	batchSize?: number;
	skipConfirmation?: boolean;
}

export interface BulkUserDeletionResult {
	totalUsers: number;
	successful: number;
	failed: number;
	skipped: number;
	duration: number;
	errors: Array<{
		userId: string;
		username: string;
		error: string;
		recoverable: boolean;
	}>;
	operationId: string;
	dryRun: boolean;
}

export interface UserDeletionProgress {
	current: number;
	total: number;
	percentage: number;
	currentBatch: number;
	totalBatches: number;
	estimatedTimeRemaining: number;
	currentUser?: {
		id: string;
		username: string;
		email: string;
	};
}

export interface UserSummary {
	id: string;
	username: string;
	email: string;
	status: 'active' | 'inactive' | 'pending';
	createdAt: string;
	lastLogin?: string;
	role: string;
	deviceCount: number;
	hasActiveSessions: boolean;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Delete All Users Service
 * Handles bulk user deletion operations with comprehensive error handling and progress tracking
 */
export class DeleteAllUsersService {
	private static readonly MODULE_TAG = '[🗑️ DELETE-ALL-USERS]';
	private static readonly DEFAULT_BATCH_SIZE = 50;
	private static readonly MAX_BATCH_SIZE = 100;
	private static readonly OPERATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

	/**
	 * Get summary of users that would be deleted
	 */
	static async getUsersSummary(options: BulkUserDeletionOptions): Promise<{
		users: UserSummary[];
		total: number;
		filtered: number;
	}> {
		try {
			const credentials = await unifiedWorkerTokenService.loadCredentials();
			if (!credentials || !credentials.accessToken) {
				throw new Error('Valid worker token required for user deletion');
			}

			// Build query parameters based on filters
			const queryParams = new URLSearchParams();
			queryParams.append('environmentId', options.environmentId);

			if (options.userFilters) {
				if (options.userFilters.status && options.userFilters.status !== 'all') {
					queryParams.append('status', options.userFilters.status);
				}
				if (options.userFilters.role) {
					queryParams.append('role', options.userFilters.role);
				}
				if (options.userFilters.createdBefore) {
					queryParams.append('createdBefore', options.userFilters.createdBefore.toISOString());
				}
				if (options.userFilters.lastLoginBefore) {
					queryParams.append('lastLoginBefore', options.userFilters.lastLoginBefore.toISOString());
				}
			}

			// Mock API call - replace with actual user management API
			const response = await fetch(`/api/users/summary?${queryParams.toString()}`, {
				headers: {
					Authorization: `Bearer ${credentials.accessToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch users summary: ${response.statusText}`);
			}

			const data = await response.json();

			console.log(
				`${DeleteAllUsersService.MODULE_TAG} ✅ Retrieved summary for ${data.filtered} users`
			);
			return data;
		} catch (error) {
			console.error(`${DeleteAllUsersService.MODULE_TAG} ❌ Failed to get users summary:`, error);
			throw error;
		}
	}

	/**
	 * Delete users in bulk with progress tracking
	 */
	static async deleteUsers(
		options: BulkUserDeletionOptions,
		onProgress?: (progress: UserDeletionProgress) => void
	): Promise<BulkUserDeletionResult> {
		const operationId = `bulk-delete-${Date.now()}`;
		const startTime = Date.now();
		const batchSize = Math.min(
			options.batchSize || DeleteAllUsersService.DEFAULT_BATCH_SIZE,
			DeleteAllUsersService.MAX_BATCH_SIZE
		);

		console.log(
			`${DeleteAllUsersService.MODULE_TAG} 🚀 Starting bulk user deletion: ${operationId}`
		);

		try {
			// Get users to delete
			const { users, total } = await DeleteAllUsersService.getUsersSummary(options);

			if (total === 0) {
				return {
					totalUsers: 0,
					successful: 0,
					failed: 0,
					skipped: 0,
					duration: 0,
					errors: [],
					operationId,
					dryRun: options.dryRun || false,
				};
			}

			const result: BulkUserDeletionResult = {
				totalUsers: total,
				successful: 0,
				failed: 0,
				skipped: 0,
				duration: 0,
				errors: [],
				operationId,
				dryRun: options.dryRun || false,
			};

			// Process users in batches
			const totalBatches = Math.ceil(total / batchSize);

			for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
				const startIndex = batchIndex * batchSize;
				const endIndex = Math.min(startIndex + batchSize, total);
				const batch = users.slice(startIndex, endIndex);

				// Update progress
				if (onProgress) {
					onProgress({
						current: startIndex,
						total,
						percentage: Math.round((startIndex / total) * 100),
						currentBatch: batchIndex + 1,
						totalBatches,
						estimatedTimeRemaining: DeleteAllUsersService.calculateEstimatedTimeRemaining(
							startTime,
							startIndex,
							total
						),
					});
				}

				// Process batch
				for (let i = 0; i < batch.length; i++) {
					const user = batch[i];
					const currentIndex = startIndex + i;

					// Update progress with current user
					if (onProgress) {
						onProgress({
							current: currentIndex,
							total,
							percentage: Math.round((currentIndex / total) * 100),
							currentBatch: batchIndex + 1,
							totalBatches,
							estimatedTimeRemaining: DeleteAllUsersService.calculateEstimatedTimeRemaining(
								startTime,
								currentIndex,
								total
							),
							currentUser: {
								id: user.id,
								username: user.username,
								email: user.email,
							},
						});
					}

					try {
						if (options.dryRun) {
							// Simulate deletion for dry run
							await DeleteAllUsersService.simulateUserDeletion(user);
							result.successful++;
						} else {
							// Actual deletion
							await DeleteAllUsersService.deleteUser(user, options.environmentId);
							result.successful++;
						}
					} catch (error) {
						result.failed++;
						const errorMessage = error instanceof Error ? error.message : 'Unknown error';
						const recoverable = await DeleteAllUsersService.isErrorRecoverable(error);

						result.errors.push({
							userId: user.id,
							username: user.username,
							error: errorMessage,
							recoverable,
						});

						// Log error but continue with other users
						console.error(
							`${DeleteAllUsersService.MODULE_TAG} ❌ Failed to delete user ${user.username}:`,
							error
						);

						// Show toast for non-recoverable errors
						if (!recoverable) {
							toastV8.error(`Failed to delete user ${user.username}: ${errorMessage}`);
						}
					}
				}

				// Check for operation timeout
				if (Date.now() - startTime > DeleteAllUsersService.OPERATION_TIMEOUT) {
					throw new Error('Operation timeout: Bulk deletion taking too long');
				}
			}

			// Final progress update
			if (onProgress) {
				onProgress({
					current: total,
					total,
					percentage: 100,
					currentBatch: totalBatches,
					totalBatches,
					estimatedTimeRemaining: 0,
				});
			}

			result.duration = Date.now() - startTime;

			console.log(
				`${DeleteAllUsersService.MODULE_TAG} ✅ Bulk deletion completed: ${operationId}`,
				{
					total: result.totalUsers,
					successful: result.successful,
					failed: result.failed,
					duration: result.duration,
				}
			);

			return result;
		} catch (error) {
			console.error(
				`${DeleteAllUsersService.MODULE_TAG} ❌ Bulk deletion failed: ${operationId}`,
				error
			);
			throw error;
		}
	}

	/**
	 * Delete a single user
	 */
	private static async deleteUser(user: UserSummary, environmentId: string): Promise<void> {
		const credentials = await unifiedWorkerTokenService.loadCredentials();
		if (!credentials || !credentials.accessToken) {
			throw new Error('Valid worker token required for user deletion');
		}

		// Mock API call - replace with actual user management API
		const response = await fetch(`/api/users/${user.id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${credentials.accessToken}`,
				'Content-Type': 'application/json',
				'X-Environment-ID': environmentId,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to delete user: ${response.statusText}`);
		}

		console.log(`${DeleteAllUsersService.MODULE_TAG} ✅ Deleted user: ${user.username}`);
	}

	/**
	 * Simulate user deletion for dry run
	 */
	private static async simulateUserDeletion(user: UserSummary): Promise<void> {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 100));
		console.log(
			`${DeleteAllUsersService.MODULE_TAG} 🧪 Simulated deletion of user: ${user.username}`
		);
	}

	/**
	 * Check if an error is recoverable
	 */
	private static async isErrorRecoverable(error: unknown): Promise<boolean> {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		// Network errors are usually recoverable
		if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
			return true;
		}

		// Permission errors are not recoverable
		if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
			return false;
		}

		// User not found errors are not recoverable
		if (errorMessage.includes('not found')) {
			return false;
		}

		// Default to recoverable for unknown errors
		return true;
	}

	/**
	 * Calculate estimated time remaining
	 */
	private static calculateEstimatedTimeRemaining(
		startTime: number,
		current: number,
		total: number
	): number {
		if (current === 0) return 0;

		const elapsed = Date.now() - startTime;
		const rate = current / elapsed;
		const remaining = total - current;
		const estimatedRemaining = remaining / rate;

		return Math.round(estimatedRemaining);
	}

	/**
	 * Validate deletion options
	 */
	static validateOptions(options: BulkUserDeletionOptions): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!options.environmentId?.trim()) {
			errors.push('Environment ID is required');
		}

		if (
			options.batchSize &&
			(options.batchSize < 1 || options.batchSize > DeleteAllUsersService.MAX_BATCH_SIZE)
		) {
			errors.push(`Batch size must be between 1 and ${DeleteAllUsersService.MAX_BATCH_SIZE}`);
		}

		if (options.userFilters?.createdBefore && options.userFilters.createdBefore > new Date()) {
			errors.push('Created before date cannot be in the future');
		}

		if (options.userFilters?.lastLoginBefore && options.userFilters.lastLoginBefore > new Date()) {
			errors.push('Last login before date cannot be in the future');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get operation history (mock implementation)
	 */
	static async getOperationHistory(_environmentId: string): Promise<
		Array<{
			operationId: string;
			timestamp: string;
			type: 'delete' | 'export' | 'update';
			status: 'completed' | 'failed' | 'cancelled';
			userCount: number;
			duration: number;
		}>
	> {
		// Mock implementation - replace with actual history API
		return [
			{
				operationId: 'bulk-delete-1234567890',
				timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
				type: 'delete',
				status: 'completed',
				userCount: 150,
				duration: 45 * 1000,
			},
			{
				operationId: 'bulk-delete-1234567891',
				timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
				type: 'delete',
				status: 'failed',
				userCount: 75,
				duration: 30 * 1000,
			},
		];
	}
}
