/**
 * @file bulkOperationCallbackHandler.ts
 * @module apps/user-management/services
 * @description Callback handler for bulk operations with smart routing and recovery
 * @version 8.0.0
 * @since 2026-02-20
 */

import { MFACallbackRouter } from '@/apps/mfa/services/shared/mfaCallbackRouter';
import { MFAErrorHandler } from '@/apps/mfa/services/shared/mfaErrorHandler';
import type { BulkOperationState } from './bulkOperationStateManager';
import { BulkOperationStateManager } from './bulkOperationStateManager';

// ============================================================================
// TYPES
// ============================================================================

export interface BulkOperationCallback {
	operationId: string;
	type: 'progress' | 'error' | 'warning' | 'completion' | 'checkpoint' | 'recovery';
	timestamp: number;
	data: {
		progress?: {
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
		};
		error?: {
			userId: string;
			username: string;
			error: string;
			recoverable: boolean;
			severity: 'low' | 'medium' | 'high' | 'critical';
		};
		checkpoint?: {
			index: number;
			processedUsers: string[];
			failedUsers: Array<{
				id: string;
				error: string;
				recoverable: boolean;
			}>;
		};
		completion?: {
			successful: number;
			failed: number;
			skipped: number;
			duration: number;
			operationId: string;
		};
		recovery?: {
			action: 'retry' | 'resume' | 'rollback' | 'cancel';
			reason: string;
			checkpoint?: string;
		};
	};
	metadata?: {
		source: string;
		version: string;
		correlationId?: string;
	};
}

export interface BulkOperationHandlerResult {
	success: boolean;
	flowState?: BulkOperationState;
	error?: string;
	action?: string;
	nextStep?: string;
}

// ============================================================================
// CALLBACK HANDLER CLASS
// ============================================================================

/**
 * Bulk Operation Callback Handler
 * Handles callbacks for bulk operations with smart routing and recovery
 */
export class BulkOperationCallbackHandler {
	private static readonly MODULE_TAG = '[🔄 BULK-OP-CALLBACK]';
	private static readonly CALLBACK_VERSION = '1.0.0';

	/**
	 * Process bulk operation callback
	 */
	static async process(
		callback: BulkOperationCallback,
		currentState?: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		try {
			console.log(
				`${BulkOperationCallbackHandler.MODULE_TAG} 📥 Processing callback: ${callback.type} for operation: ${callback.operationId}`
			);

			// Validate callback structure
			const validation = BulkOperationCallbackHandler.validateCallback(callback);
			if (!validation.isValid) {
				throw new Error(`Invalid callback: ${validation.errors.join(', ')}`);
			}

			// Load current state if not provided
			const state = currentState || BulkOperationStateManager.loadState(callback.operationId);
			if (!state) {
				throw new Error(`Operation state not found: ${callback.operationId}`);
			}

			// Process callback based on type
			let result: BulkOperationHandlerResult;

			switch (callback.type) {
				case 'progress':
					result = await BulkOperationCallbackHandler.handleProgressCallback(callback, state);
					break;
				case 'error':
					result = await BulkOperationCallbackHandler.handleErrorCallback(callback, state);
					break;
				case 'warning':
					result = await BulkOperationCallbackHandler.handleWarningCallback(callback, state);
					break;
				case 'completion':
					result = await BulkOperationCallbackHandler.handleCompletionCallback(callback, state);
					break;
				case 'checkpoint':
					result = await BulkOperationCallbackHandler.handleCheckpointCallback(callback, state);
					break;
				case 'recovery':
					result = await BulkOperationCallbackHandler.handleRecoveryCallback(callback, state);
					break;
				default:
					throw new Error(`Unknown callback type: ${callback.type}`);
			}

			console.log(
				`${BulkOperationCallbackHandler.MODULE_TAG} ✅ Callback processed successfully: ${callback.type}`
			);
			return result;
		} catch (error) {
			console.error(
				`${BulkOperationCallbackHandler.MODULE_TAG} ❌ Failed to process callback:`,
				error
			);

			// Use MFAErrorHandler for consistent error handling
			const errorResult = await MFAErrorHandler.handleError(error, {
				context: 'bulk-operation-callback',
				operationId: callback.operationId,
				callbackType: callback.type,
				severity: 'high',
				userFriendlyMessage: 'Failed to process bulk operation callback',
				recoveryOptions: ['retry', 'manual-intervention'],
			});

			return {
				success: false,
				error: errorResult.userFriendlyMessage,
				action: errorResult.recommendedAction,
			};
		}
	}

	/**
	 * Handle progress callback
	 */
	private static async handleProgressCallback(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		if (!callback.data.progress) {
			throw new Error('Progress data is required for progress callback');
		}

		// Update state with progress
		BulkOperationStateManager.updateProgress(callback.operationId, callback.data.progress);

		// Check if operation should be paused (for manual intervention)
		if (callback.data.progress.percentage > 0 && callback.data.progress.percentage % 25 === 0) {
			console.log(
				`${BulkOperationCallbackHandler.MODULE_TAG} 📍 Progress milestone: ${callback.data.progress.percentage}%`
			);
		}

		return {
			success: true,
			flowState: BulkOperationStateManager.loadState(callback.operationId) || state,
			action: 'continue',
			nextStep: 'process-next-batch',
		};
	}

	/**
	 * Handle error callback
	 */
	private static async handleErrorCallback(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		if (!callback.data.error) {
			throw new Error('Error data is required for error callback');
		}

		const error = callback.data.error;

		// Add error to state
		BulkOperationStateManager.addError(callback.operationId, {
			userId: error.userId,
			username: error.username,
			error: error.error,
			recoverable: error.recoverable,
		});

		// Determine action based on error severity and recoverability
		let action: string;
		let nextStep: string;

		if (error.recoverable) {
			action = 'retry';
			nextStep = 'retry-current-user';
		} else {
			action = 'skip';
			nextStep = 'continue-next-user';
		}

		// For critical errors, consider pausing the operation
		if (error.severity === 'critical') {
			action = 'pause';
			nextStep = 'manual-intervention';

			// Update state to paused
			BulkOperationStateManager.updateStatus(callback.operationId, 'paused');
		}

		return {
			success: true,
			flowState: BulkOperationStateManager.loadState(callback.operationId) || state,
			action,
			nextStep,
		};
	}

	/**
	 * Handle warning callback
	 */
	private static async handleWarningCallback(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		// Log warning but continue operation
		console.warn(
			`${BulkOperationCallbackHandler.MODULE_TAG} ⚠️ Warning for operation ${callback.operationId}:`,
			callback.data
		);

		// Update last activity
		const updatedState = BulkOperationStateManager.loadState(callback.operationId);
		if (updatedState) {
			BulkOperationStateManager.saveState({
				...updatedState,
				metadata: {
					...updatedState.metadata,
					lastActivity: Date.now(),
				},
			});
		}

		return {
			success: true,
			flowState: updatedState || state,
			action: 'continue',
			nextStep: 'monitor-and-proceed',
		};
	}

	/**
	 * Handle completion callback
	 */
	private static async handleCompletionCallback(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		if (!callback.data.completion) {
			throw new Error('Completion data is required for completion callback');
		}

		const completion = callback.data.completion;

		// Update state to completed
		BulkOperationStateManager.updateStatus(callback.operationId, 'completed', {
			completedAt: Date.now(),
			duration: completion.duration,
		});

		// Update final results
		const finalState = BulkOperationStateManager.loadState(callback.operationId);
		if (finalState) {
			BulkOperationStateManager.saveState({
				...finalState,
				results: {
					successful: completion.successful,
					failed: completion.failed,
					skipped: completion.skipped,
					errors: finalState.results.errors,
				},
				progress: {
					...finalState.progress,
					current: finalState.progress.total,
					percentage: 100,
				},
			});
		}

		// Clean up checkpoints
		BulkOperationStateManager.deleteCheckpoints(callback.operationId);

		return {
			success: true,
			flowState: BulkOperationStateManager.loadState(callback.operationId) || state,
			action: 'cleanup',
			nextStep: 'operation-complete',
		};
	}

	/**
	 * Handle checkpoint callback
	 */
	private static async handleCheckpointCallback(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		if (!callback.data.checkpoint) {
			throw new Error('Checkpoint data is required for checkpoint callback');
		}

		const checkpoint = callback.data.checkpoint;

		// Create checkpoint
		BulkOperationStateManager.createCheckpoint(
			callback.operationId,
			checkpoint.index,
			checkpoint.processedUsers,
			checkpoint.failedUsers
		);

		return {
			success: true,
			flowState: BulkOperationStateManager.loadState(callback.operationId) || state,
			action: 'continue',
			nextStep: 'proceed-to-next-batch',
		};
	}

	/**
	 * Handle recovery callback
	 */
	private static async handleRecoveryCallback(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		if (!callback.data.recovery) {
			throw new Error('Recovery data is required for recovery callback');
		}

		const recovery = callback.data.recovery;

		switch (recovery.action) {
			case 'retry':
				return await BulkOperationCallbackHandler.handleRetryRecovery(callback, state);
			case 'resume':
				return await BulkOperationCallbackHandler.handleResumeRecovery(callback, state);
			case 'rollback':
				return await BulkOperationCallbackHandler.handleRollbackRecovery(callback, state);
			case 'cancel':
				return await BulkOperationCallbackHandler.handleCancelRecovery(callback, state);
			default:
				throw new Error(`Unknown recovery action: ${recovery.action}`);
		}
	}

	/**
	 * Handle retry recovery
	 */
	private static async handleRetryRecovery(
		_callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		// Update retry count
		const updatedState = {
			...state,
			recovery: {
				...state.recovery,
				retryCount: state.recovery.retryCount + 1,
			},
			status: 'running' as const,
		};

		BulkOperationStateManager.saveState(updatedState);

		return {
			success: true,
			flowState: updatedState,
			action: 'retry',
			nextStep: 'retry-failed-operation',
		};
	}

	/**
	 * Handle resume recovery
	 */
	private static async handleResumeRecovery(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		// Resume from checkpoint if available
		const checkpoint = BulkOperationStateManager.resumeFromCheckpoint(callback.operationId);

		if (!checkpoint) {
			throw new Error('No checkpoint available for resume operation');
		}

		// Update state to running
		const updatedState = {
			...state,
			status: 'running' as const,
			progress: {
				...state.progress,
				current: checkpoint.currentIndex,
			},
		};

		BulkOperationStateManager.saveState(updatedState);

		return {
			success: true,
			flowState: updatedState,
			action: 'resume',
			nextStep: 'resume-from-checkpoint',
		};
	}

	/**
	 * Handle rollback recovery
	 */
	private static async handleRollbackRecovery(
		callback: BulkOperationCallback,
		_state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		// Find the last successful checkpoint
		const checkpoints = BulkOperationStateManager.loadCheckpoints(callback.operationId);
		const lastSuccessfulCheckpoint = checkpoints.find((cp) => cp.failedUsers.length === 0);

		if (!lastSuccessfulCheckpoint) {
			throw new Error('No successful checkpoint available for rollback');
		}

		// Restore state from checkpoint
		BulkOperationStateManager.saveState(lastSuccessfulCheckpoint.state);

		return {
			success: true,
			flowState: lastSuccessfulCheckpoint.state,
			action: 'rollback',
			nextStep: 'resume-from-last-successful-checkpoint',
		};
	}

	/**
	 * Handle cancel recovery
	 */
	private static async handleCancelRecovery(
		callback: BulkOperationCallback,
		state: BulkOperationState
	): Promise<BulkOperationHandlerResult> {
		// Update state to cancelled
		BulkOperationStateManager.updateStatus(callback.operationId, 'cancelled', {
			completedAt: Date.now(),
		});

		// Clean up checkpoints
		BulkOperationStateManager.deleteCheckpoints(callback.operationId);

		return {
			success: true,
			flowState: BulkOperationStateManager.loadState(callback.operationId) || state,
			action: 'cancel',
			nextStep: 'operation-cancelled',
		};
	}

	/**
	 * Validate callback structure
	 */
	private static validateCallback(callback: BulkOperationCallback): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!callback.operationId) {
			errors.push('Operation ID is required');
		}

		if (!callback.type) {
			errors.push('Callback type is required');
		}

		if (!callback.timestamp) {
			errors.push('Timestamp is required');
		}

		if (callback.timestamp > Date.now() + 60000) {
			// Allow 1 minute clock skew
			errors.push('Timestamp is in the future');
		}

		if (callback.timestamp < Date.now() - 24 * 60 * 60 * 1000) {
			// 24 hours ago
			errors.push('Timestamp is too old');
		}

		const validTypes = ['progress', 'error', 'warning', 'completion', 'checkpoint', 'recovery'];
		if (!validTypes.includes(callback.type)) {
			errors.push(`Invalid callback type: ${callback.type}`);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Register callback handler with router
	 */
	static registerWithRouter(): void {
		MFACallbackRouter.registerCallbackHandler(
			'bulk-operation',
			BulkOperationCallbackHandler.process.bind(BulkOperationCallbackHandler)
		);
		console.log(
			`${BulkOperationCallbackHandler.MODULE_TAG} 📡 Registered bulk operation callback handler`
		);
	}

	/**
	 * Unregister callback handler from router
	 */
	static unregisterFromRouter(): void {
		MFACallbackRouter.unregisterCallbackHandler('bulk-operation');
		console.log(
			`${BulkOperationCallbackHandler.MODULE_TAG} 📡 Unregistered bulk operation callback handler`
		);
	}

	/**
	 * Create callback from operation state
	 */
	static createCallback(
		operationId: string,
		type: BulkOperationCallback['type'],
		data: BulkOperationCallback['data'],
		metadata?: Partial<BulkOperationCallback['metadata']>
	): BulkOperationCallback {
		return {
			operationId,
			type,
			timestamp: Date.now(),
			data,
			metadata: {
				source: 'bulk-operation-handler',
				version: BulkOperationCallbackHandler.CALLBACK_VERSION,
				...metadata,
			},
		};
	}

	/**
	 * Send callback to router
	 */
	static async sendCallback(callback: BulkOperationCallback): Promise<boolean> {
		try {
			await MFACallbackRouter.routeCallback(callback);
			return true;
		} catch (error) {
			console.error(
				`${BulkOperationCallbackHandler.MODULE_TAG} ❌ Failed to send callback:`,
				error
			);
			return false;
		}
	}
}
