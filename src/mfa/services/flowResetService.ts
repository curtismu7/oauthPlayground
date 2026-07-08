/**
 * @file flowResetService.ts
 * @module v8/services
 * @description Flow reset service for all V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles resetting flows while preserving worker tokens and credentials.
 * Clears tokens, sessions, and step progress.
 *
 * @example
 * // Reset flow (clears tokens, keeps credentials)
 * FlowResetService.resetFlow('authz-code');
 *
 * // Full reset (clears everything including credentials)
 * FlowResetService.fullReset('authz-code');
 *
 * // Clear only tokens
 * FlowResetService.clearTokens('authz-code');
 */

import { logger } from '../../utils/logger';
import { STORAGE_KEYS, StorageService } from './storageService';

const MODULE_TAG = '[ FLOW-RESET-V8]';

// ============================================================================
// TYPES
// ============================================================================

export interface ResetOptions {
	clearCredentials?: boolean;
	clearTokens?: boolean;
	clearProgress?: boolean;
	clearDiscovery?: boolean;
	clearPreferences?: boolean;
	keepWorkerToken?: boolean;
}

export interface ResetResult {
	success: boolean;
	cleared: string[];
	kept: string[];
	message: string;
}

// ============================================================================
// FLOW RESET SERVICE CLASS
// ============================================================================

export class FlowResetService {
	/**
	 * Reset flow to initial state
	 * Clears tokens and session, keeps credentials
	 * @param flowKey - Flow key (e.g., 'authz-code', 'implicit')
	 * @param keepWorkerToken - Keep worker token (default: true)
	 * @returns Reset result
	 * @example
	 * FlowResetService.resetFlow('authz-code');
	 */
	static resetFlow(flowKey: string, keepWorkerToken = true): ResetResult {
		logger.info(`${MODULE_TAG} Resetting flow`, { flowKey, keepWorkerToken });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			// Clear tokens
			if (StorageService.has(STORAGE_KEYS.TOKENS)) {
				StorageService.clear(STORAGE_KEYS.TOKENS);
				cleared.push('tokens');
			}

			// Clear step progress
			if (StorageService.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageService.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			// Clear flow-specific data (except credentials)
			const flowData = StorageService.getFlowData(flowKey);
			flowData.forEach(({ key }) => {
				// Don't clear credentials
				if (!key.includes('credentials')) {
					StorageService.clear(key);
					cleared.push(key);
				} else {
					kept.push(key);
				}
			});

			// Keep worker token if requested
			if (keepWorkerToken) {
				kept.push('worker_token');
			}

			logger.info(`${MODULE_TAG} Flow reset complete`, {
				flowKey,
				cleared: cleared.length,
				kept: kept.length,
			});

			return {
				success: true,
				cleared,
				kept,
				message: `Flow reset complete. Cleared ${cleared.length} items, kept ${kept.length} items.`,
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to reset flow`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				cleared,
				kept,
				message: `Failed to reset flow: ${error}`,
			};
		}
	}

	/**
	 * Full reset - clears everything for a flow
	 * @param flowKey - Flow key
	 * @returns Reset result
	 * @example
	 * FlowResetService.fullReset('authz-code');
	 */
	static fullReset(flowKey: string): ResetResult {
		logger.info(`${MODULE_TAG} Full reset requested`, { flowKey });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			// Clear all flow-specific data
			const flowData = StorageService.getFlowData(flowKey);
			flowData.forEach(({ key }) => {
				StorageService.clear(key);
				cleared.push(key);
			});

			// Clear global tokens and progress
			if (StorageService.has(STORAGE_KEYS.TOKENS)) {
				StorageService.clear(STORAGE_KEYS.TOKENS);
				cleared.push('tokens');
			}

			if (StorageService.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageService.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			logger.info(`${MODULE_TAG} Full reset complete`, {
				flowKey,
				cleared: cleared.length,
			});

			return {
				success: true,
				cleared,
				kept,
				message: `Full reset complete. Cleared ${cleared.length} items.`,
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to perform full reset`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				cleared,
				kept,
				message: `Failed to perform full reset: ${error}`,
			};
		}
	}

	/**
	 * Clear only tokens
	 * @param flowKey - Flow key
	 * @returns Reset result
	 * @example
	 * FlowResetService.clearTokens('authz-code');
	 */
	static clearTokens(flowKey: string): ResetResult {
		logger.info(`${MODULE_TAG} Clearing tokens`, { flowKey });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			if (StorageService.has(STORAGE_KEYS.TOKENS)) {
				StorageService.clear(STORAGE_KEYS.TOKENS);
				cleared.push('tokens');
			}

			logger.info(`${MODULE_TAG} Tokens cleared`, { flowKey });

			return {
				success: true,
				cleared,
				kept,
				message: 'Tokens cleared.',
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to clear tokens`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				cleared,
				kept,
				message: `Failed to clear tokens: ${error}`,
			};
		}
	}

	/**
	 * Clear only session data
	 * @param flowKey - Flow key
	 * @returns Reset result
	 * @example
	 * FlowResetService.clearSession('authz-code');
	 */
	static clearSession(flowKey: string): ResetResult {
		logger.info(`${MODULE_TAG} Clearing session`, { flowKey });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			// Clear step progress
			if (StorageService.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageService.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			// Clear flow-specific session data
			const flowData = StorageService.getFlowData(flowKey);
			flowData.forEach(({ key }) => {
				// Only clear session-related data, not credentials or tokens
				if (!key.includes('credentials') && !key.includes('tokens') && !key.includes('worker')) {
					StorageService.clear(key);
					cleared.push(key);
				} else {
					kept.push(key);
				}
			});

			logger.info(`${MODULE_TAG} Session cleared`, {
				flowKey,
				cleared: cleared.length,
			});

			return {
				success: true,
				cleared,
				kept,
				message: `Session cleared. Cleared ${cleared.length} items.`,
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to clear session`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				cleared,
				kept,
				message: `Failed to clear session: ${error}`,
			};
		}
	}

	/**
	 * Clear only step progress
	 * @param flowKey - Flow key
	 * @returns Reset result
	 * @example
	 * FlowResetService.clearProgress('authz-code');
	 */
	static clearProgress(flowKey: string): ResetResult {
		logger.info(`${MODULE_TAG} Clearing progress`, { flowKey });

		const cleared: string[] = [];

		try {
			if (StorageService.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageService.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			logger.info(`${MODULE_TAG} Progress cleared`, { flowKey });

			return {
				success: true,
				cleared,
				kept: [],
				message: 'Progress cleared.',
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to clear progress`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				cleared,
				kept: [],
				message: `Failed to clear progress: ${error}`,
			};
		}
	}

	/**
	 * Clear PingOne session
	 * Clears discovery and preferences
	 * @param flowKey - Flow key
	 * @returns Reset result
	 * @example
	 * FlowResetService.clearPingOneSession('authz-code');
	 */
	static clearPingOneSession(flowKey: string): ResetResult {
		logger.info(`${MODULE_TAG} Clearing PingOne session`, { flowKey });

		const cleared: string[] = [];

		try {
			// Clear discovery cache
			if (StorageService.has(STORAGE_KEYS.DISCOVERY)) {
				StorageService.clear(STORAGE_KEYS.DISCOVERY);
				cleared.push('discovery');
			}

			// Clear preferences
			if (StorageService.has(STORAGE_KEYS.PREFERENCES)) {
				StorageService.clear(STORAGE_KEYS.PREFERENCES);
				cleared.push('preferences');
			}

			logger.info(`${MODULE_TAG} PingOne session cleared`, {
				flowKey,
				cleared: cleared.length,
			});

			return {
				success: true,
				cleared,
				kept: [],
				message: `PingOne session cleared. Cleared ${cleared.length} items.`,
			};
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to clear PingOne session`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				success: false,
				cleared,
				kept: [],
				message: `Failed to clear PingOne session: ${error}`,
			};
		}
	}

	/**
	 * Get reset summary
	 * Shows what would be cleared
	 * @param flowKey - Flow key
	 * @returns Summary of what would be cleared
	 * @example
	 * const summary = FlowResetService.getResetSummary('authz-code');
	 */
	static getResetSummary(flowKey: string): {
		tokens: boolean;
		session: boolean;
		progress: boolean;
		discovery: boolean;
		preferences: boolean;
		credentials: boolean;
		workerToken: boolean;
	} {
		return {
			tokens: StorageService.has(STORAGE_KEYS.TOKENS),
			session: StorageService.getFlowData(flowKey).length > 0,
			progress: StorageService.has(STORAGE_KEYS.STEP_PROGRESS),
			discovery: StorageService.has(STORAGE_KEYS.DISCOVERY),
			preferences: StorageService.has(STORAGE_KEYS.PREFERENCES),
			credentials: StorageService.has(STORAGE_KEYS.CREDENTIALS),
			workerToken: StorageService.has('v8:worker-token'),
		};
	}

	/**
	 * Get reset message for UI
	 * @param flowKey - Flow key
	 * @returns User-friendly reset message
	 * @example
	 * const message = FlowResetService.getResetMessage('authz-code');
	 */
	static getResetMessage(flowKey: string): string {
		const summary = FlowResetService.getResetSummary(flowKey);

		const items: string[] = [];
		if (summary.tokens) items.push('✓ Clear all tokens');
		if (summary.session) items.push('✓ Clear PingOne session');
		if (summary.progress) items.push('✓ Return to Step 0');
		if (summary.credentials) items.push('✓ Keep credentials');
		if (summary.workerToken) items.push('✓ Keep worker token');

		return ` Reset Flow?\n\nThis will:\n${items.join('\n')}\n\nContinue?`;
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default FlowResetService;
