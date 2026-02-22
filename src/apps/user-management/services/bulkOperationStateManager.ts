/**
 * @file bulkOperationStateManager.ts
 * @module apps/user-management/services
 * @description State manager for bulk operations with persistence and recovery
 * @version 8.0.0
 * @since 2026-02-20
 */

// ============================================================================
// TYPES
// ============================================================================

export type BulkOperationType = 'delete-users' | 'export-users' | 'update-users';

export interface BulkOperationState {
	operationId: string;
	type: BulkOperationType;
	status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
	progress: {
		current: number;
		total: number;
		percentage: number;
		currentBatch: number;
		totalBatches: number;
		estimatedTimeRemaining: number;
	};
	config: {
		environmentId: string;
		userFilters?: {
			status?: string;
			role?: string;
			createdBefore?: string;
			lastLoginBefore?: string;
		};
		batchSize: number;
		dryRun: boolean;
	};
	results: {
		successful: number;
		failed: number;
		skipped: number;
		errors: Array<{
			userId: string;
			username: string;
			error: string;
			recoverable: boolean;
		}>;
	};
	metadata: {
		createdAt: number;
		updatedAt: number;
		startedAt?: number;
		completedAt?: number;
		duration?: number;
		createdBy: string;
		lastActivity: number;
	};
	recovery: {
		canResume: boolean;
		lastCheckpoint?: string;
		retryCount: number;
		maxRetries: number;
	};
}

export interface BulkOperationCheckpoint {
	operationId: string;
	timestamp: number;
	currentIndex: number;
	processedUsers: string[];
	failedUsers: Array<{
		id: string;
		error: string;
		recoverable: boolean;
	}>;
	state: BulkOperationState;
}

// ============================================================================
// STATE MANAGER CLASS
// ============================================================================

/**
 * Bulk Operation State Manager
 * Manages state for bulk operations with persistence, recovery, and checkpointing
 */
export class BulkOperationStateManager {
	private static readonly STORAGE_KEY = 'bulk_operations_state';
	private static readonly CHECKPOINT_KEY = 'bulk_operations_checkpoints';
	private static readonly MAX_CHECKPOINTS = 10;
	private static readonly STATE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
	private static readonly MODULE_TAG = '[📊 BULK-OP-STATE]';

	/**
	 * Create initial operation state
	 */
	static createInitialState(
		type: BulkOperationType,
		config: BulkOperationState['config'],
		createdBy: string
	): BulkOperationState {
		const operationId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = Date.now();

		return {
			operationId,
			type,
			status: 'pending',
			progress: {
				current: 0,
				total: 0,
				percentage: 0,
				currentBatch: 0,
				totalBatches: 0,
				estimatedTimeRemaining: 0,
			},
			config,
			results: {
				successful: 0,
				failed: 0,
				skipped: 0,
				errors: [],
			},
			metadata: {
				createdAt: now,
				updatedAt: now,
				createdBy,
				lastActivity: now,
			},
			recovery: {
				canResume: true,
				retryCount: 0,
				maxRetries: 3,
			},
		};
	}

	/**
	 * Save operation state to localStorage
	 */
	static saveState(state: BulkOperationState): void {
		try {
			const existingStates = BulkOperationStateManager.loadAllStates();
			const updatedStates = {
				...existingStates,
				[state.operationId]: {
					...state,
					metadata: {
						...state.metadata,
						updatedAt: Date.now(),
						lastActivity: Date.now(),
					},
				},
			};

			localStorage.setItem(BulkOperationStateManager.STORAGE_KEY, JSON.stringify(updatedStates));
			console.log(
				`${BulkOperationStateManager.MODULE_TAG} 💾 Saved state for operation: ${state.operationId}`
			);
		} catch (error) {
			console.error(`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to save state:`, error);
		}
	}

	/**
	 * Load operation state by ID
	 */
	static loadState(operationId: string): BulkOperationState | null {
		try {
			const allStates = BulkOperationStateManager.loadAllStates();
			const state = allStates[operationId];

			if (!state) {
				return null;
			}

			// Check if state has expired
			if (Date.now() - state.metadata.lastActivity > BulkOperationStateManager.STATE_EXPIRY) {
				console.log(
					`${BulkOperationStateManager.MODULE_TAG} ⏰ State expired for operation: ${operationId}`
				);
				BulkOperationStateManager.deleteState(operationId);
				return null;
			}

			return state;
		} catch (error) {
			console.error(`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to load state:`, error);
			return null;
		}
	}

	/**
	 * Load all operation states
	 */
	static loadAllStates(): Record<string, BulkOperationState> {
		try {
			const stored = localStorage.getItem(BulkOperationStateManager.STORAGE_KEY);
			return stored ? JSON.parse(stored) : {};
		} catch (error) {
			console.error(`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to load all states:`, error);
			return {};
		}
	}

	/**
	 * Delete operation state
	 */
	static deleteState(operationId: string): void {
		try {
			const allStates = BulkOperationStateManager.loadAllStates();
			delete allStates[operationId];
			localStorage.setItem(BulkOperationStateManager.STORAGE_KEY, JSON.stringify(allStates));

			// Also delete related checkpoints
			BulkOperationStateManager.deleteCheckpoints(operationId);

			console.log(
				`${BulkOperationStateManager.MODULE_TAG} 🗑️ Deleted state for operation: ${operationId}`
			);
		} catch (error) {
			console.error(`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to delete state:`, error);
		}
	}

	/**
	 * Update operation progress
	 */
	static updateProgress(
		operationId: string,
		progress: Partial<BulkOperationState['progress']>
	): void {
		const state = BulkOperationStateManager.loadState(operationId);
		if (!state) return;

		const updatedState: BulkOperationState = {
			...state,
			progress: {
				...state.progress,
				...progress,
			},
			metadata: {
				...state.metadata,
				updatedAt: Date.now(),
				lastActivity: Date.now(),
			},
		};

		BulkOperationStateManager.saveState(updatedState);
	}

	/**
	 * Update operation status
	 */
	static updateStatus(
		operationId: string,
		status: BulkOperationState['status'],
		metadata?: Partial<BulkOperationState['metadata']>
	): void {
		const state = BulkOperationStateManager.loadState(operationId);
		if (!state) return;

		const updatedState: BulkOperationState = {
			...state,
			status,
			metadata: {
				...state.metadata,
				...metadata,
				updatedAt: Date.now(),
				lastActivity: Date.now(),
			},
		};

		// Set timestamps for status changes
		if (status === 'running' && !state.metadata.startedAt) {
			updatedState.metadata.startedAt = Date.now();
		}
		if (status === 'completed' || status === 'failed' || status === 'cancelled') {
			updatedState.metadata.completedAt = Date.now();
			if (state.metadata.startedAt) {
				updatedState.metadata.duration = Date.now() - state.metadata.startedAt;
			}
		}

		BulkOperationStateManager.saveState(updatedState);
	}

	/**
	 * Add error to operation results
	 */
	static addError(
		operationId: string,
		error: {
			userId: string;
			username: string;
			error: string;
			recoverable: boolean;
		}
	): void {
		const state = BulkOperationStateManager.loadState(operationId);
		if (!state) return;

		const updatedState: BulkOperationState = {
			...state,
			results: {
				...state.results,
				failed: state.results.failed + 1,
				errors: [...state.results.errors, error],
			},
			metadata: {
				...state.metadata,
				updatedAt: Date.now(),
				lastActivity: Date.now(),
			},
		};

		BulkOperationStateManager.saveState(updatedState);
	}

	/**
	 * Increment successful count
	 */
	static incrementSuccessful(operationId: string): void {
		const state = BulkOperationStateManager.loadState(operationId);
		if (!state) return;

		const updatedState: BulkOperationState = {
			...state,
			results: {
				...state.results,
				successful: state.results.successful + 1,
			},
			metadata: {
				...state.metadata,
				updatedAt: Date.now(),
				lastActivity: Date.now(),
			},
		};

		BulkOperationStateManager.saveState(updatedState);
	}

	/**
	 * Create checkpoint for operation
	 */
	static createCheckpoint(
		operationId: string,
		currentIndex: number,
		processedUsers: string[],
		failedUsers: Array<{
			id: string;
			error: string;
			recoverable: boolean;
		}>
	): void {
		try {
			const state = BulkOperationStateManager.loadState(operationId);
			if (!state) return;

			const checkpoint: BulkOperationCheckpoint = {
				operationId,
				timestamp: Date.now(),
				currentIndex,
				processedUsers,
				failedUsers,
				state,
			};

			const existingCheckpoints = BulkOperationStateManager.loadAllCheckpoints();
			const operationCheckpoints = existingCheckpoints[operationId] || [];

			// Add new checkpoint and keep only the most recent ones
			const updatedCheckpoints = [...operationCheckpoints, checkpoint]
				.sort((a, b) => b.timestamp - a.timestamp)
				.slice(0, BulkOperationStateManager.MAX_CHECKPOINTS);

			const allCheckpoints = {
				...existingCheckpoints,
				[operationId]: updatedCheckpoints,
			};

			localStorage.setItem(
				BulkOperationStateManager.CHECKPOINT_KEY,
				JSON.stringify(allCheckpoints)
			);

			// Update state with checkpoint info
			BulkOperationStateManager.saveState({
				...state,
				recovery: {
					...state.recovery,
					lastCheckpoint: checkpoint.timestamp.toString(),
				},
			});

			console.log(
				`${BulkOperationStateManager.MODULE_TAG} 📍 Created checkpoint for operation: ${operationId}`
			);
		} catch (error) {
			console.error(
				`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to create checkpoint:`,
				error
			);
		}
	}

	/**
	 * Load checkpoints for operation
	 */
	static loadCheckpoints(operationId: string): BulkOperationCheckpoint[] {
		try {
			const allCheckpoints = BulkOperationStateManager.loadAllCheckpoints();
			return allCheckpoints[operationId] || [];
		} catch (error) {
			console.error(
				`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to load checkpoints:`,
				error
			);
			return [];
		}
	}

	/**
	 * Load all checkpoints
	 */
	static loadAllCheckpoints(): Record<string, BulkOperationCheckpoint[]> {
		try {
			const stored = localStorage.getItem(BulkOperationStateManager.CHECKPOINT_KEY);
			return stored ? JSON.parse(stored) : {};
		} catch (error) {
			console.error(
				`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to load all checkpoints:`,
				error
			);
			return {};
		}
	}

	/**
	 * Delete checkpoints for operation
	 */
	static deleteCheckpoints(operationId: string): void {
		try {
			const allCheckpoints = BulkOperationStateManager.loadAllCheckpoints();
			delete allCheckpoints[operationId];
			localStorage.setItem(
				BulkOperationStateManager.CHECKPOINT_KEY,
				JSON.stringify(allCheckpoints)
			);
		} catch (error) {
			console.error(
				`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to delete checkpoints:`,
				error
			);
		}
	}

	/**
	 * Resume operation from checkpoint
	 */
	static resumeFromCheckpoint(operationId: string): BulkOperationCheckpoint | null {
		try {
			const checkpoints = BulkOperationStateManager.loadCheckpoints(operationId);
			if (checkpoints.length === 0) {
				return null;
			}

			// Get the most recent checkpoint
			const latestCheckpoint = checkpoints[0];

			// Check if operation can be resumed
			const state = BulkOperationStateManager.loadState(operationId);
			if (!state || !state.recovery.canResume) {
				return null;
			}

			console.log(
				`${BulkOperationStateManager.MODULE_TAG} 🔄 Resuming operation from checkpoint: ${operationId}`
			);
			return latestCheckpoint;
		} catch (error) {
			console.error(
				`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to resume from checkpoint:`,
				error
			);
			return null;
		}
	}

	/**
	 * Get operation history
	 */
	static getOperationHistory(limit: number = 10): BulkOperationState[] {
		try {
			const allStates = BulkOperationStateManager.loadAllStates();
			const operations = Object.values(allStates)
				.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt)
				.slice(0, limit);

			return operations;
		} catch (error) {
			console.error(
				`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to get operation history:`,
				error
			);
			return [];
		}
	}

	/**
	 * Clean up expired states
	 */
	static cleanupExpiredStates(): void {
		try {
			const allStates = BulkOperationStateManager.loadAllStates();
			const now = Date.now();
			let cleanedCount = 0;

			for (const [operationId, state] of Object.entries(allStates)) {
				if (now - state.metadata.lastActivity > BulkOperationStateManager.STATE_EXPIRY) {
					BulkOperationStateManager.deleteState(operationId);
					cleanedCount++;
				}
			}

			if (cleanedCount > 0) {
				console.log(
					`${BulkOperationStateManager.MODULE_TAG} 🧹 Cleaned up ${cleanedCount} expired states`
				);
			}
		} catch (error) {
			console.error(
				`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to cleanup expired states:`,
				error
			);
		}
	}

	/**
	 * Get operation statistics
	 */
	static getOperationStatistics(): {
		total: number;
		byStatus: Record<BulkOperationState['status'], number>;
		byType: Record<BulkOperationType, number>;
		averageDuration: number;
	} {
		try {
			const allStates = BulkOperationStateManager.loadAllStates();
			const operations = Object.values(allStates);

			const byStatus = operations.reduce(
				(acc, op) => {
					acc[op.status] = (acc[op.status] || 0) + 1;
					return acc;
				},
				{} as Record<BulkOperationState['status'], number>
			);

			const byType = operations.reduce(
				(acc, op) => {
					acc[op.type] = (acc[op.type] || 0) + 1;
					return acc;
				},
				{} as Record<BulkOperationType, number>
			);

			const completedOperations = operations.filter(
				(op) => op.status === 'completed' && op.metadata.duration
			);
			const averageDuration =
				completedOperations.length > 0
					? completedOperations.reduce((sum, op) => sum + (op.metadata.duration || 0), 0) /
						completedOperations.length
					: 0;

			return {
				total: operations.length,
				byStatus,
				byType,
				averageDuration,
			};
		} catch (error) {
			console.error(`${BulkOperationStateManager.MODULE_TAG} ❌ Failed to get statistics:`, error);
			return {
				total: 0,
				byStatus: {} as Record<BulkOperationState['status'], number>,
				byType: {} as Record<BulkOperationType, number>,
				averageDuration: 0,
			};
		}
	}
}
