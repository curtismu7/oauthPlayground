/**
 * @file flowResetServiceV8.ts
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
 * FlowResetServiceV8.resetFlow('authz-code');
 *
 * // Full reset (clears everything including credentials)
 * FlowResetServiceV8.fullReset('authz-code');
 *
 * // Clear only tokens
 * FlowResetServiceV8.clearTokens('authz-code');
 */

import { STORAGE_KEYS, StorageServiceV8 } from './storageServiceV8';

const MODULE_TAG = '[🔄 FLOW-RESET-V8]';

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

export class FlowResetServiceV8 {
	/**
	 * Reset flow to initial state
	 * Clears tokens and session, keeps credentials
	 * @param flowKey - Flow key (e.g., 'authz-code', 'implicit')
	 * @param keepWorkerToken - Keep worker token (default: true)
	 * @returns Reset result
	 * @example
	 * FlowResetServiceV8.resetFlow('authz-code');
	 */
	static resetFlow(flowKey: string, keepWorkerToken = true): ResetResult {
		console.log(`${MODULE_TAG} Resetting flow`, { flowKey, keepWorkerToken });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			// Clear tokens
			if (StorageServiceV8.has(STORAGE_KEYS.TOKENS)) {
				StorageServiceV8.clear(STORAGE_KEYS.TOKENS);
				cleared.push('tokens');
			}

			// Clear step progress
			if (StorageServiceV8.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageServiceV8.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			// Clear flow-specific data (except credentials)
			const flowData = StorageServiceV8.getFlowData(flowKey);
			flowData.forEach(({ key }) => {
				// Don't clear credentials
				if (!key.includes('credentials')) {
					StorageServiceV8.clear(key);
					cleared.push(key);
				} else {
					kept.push(key);
				}
			});

			// Keep worker token if requested
			if (keepWorkerToken) {
				kept.push('worker_token');
			}

			console.log(`${MODULE_TAG} Flow reset complete`, {
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
			console.error(`${MODULE_TAG} Failed to reset flow`, {
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
	 * FlowResetServiceV8.fullReset('authz-code');
	 */
	static fullReset(flowKey: string): ResetResult {
		console.log(`${MODULE_TAG} Full reset requested`, { flowKey });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			// Clear all flow-specific data
			const flowData = StorageServiceV8.getFlowData(flowKey);
			flowData.forEach(({ key }) => {
				StorageServiceV8.clear(key);
				cleared.push(key);
			});

			// Clear global tokens and progress
			if (StorageServiceV8.has(STORAGE_KEYS.TOKENS)) {
				StorageServiceV8.clear(STORAGE_KEYS.TOKENS);
				cleared.push('tokens');
			}

			if (StorageServiceV8.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageServiceV8.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			console.log(`${MODULE_TAG} Full reset complete`, {
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
			console.error(`${MODULE_TAG} Failed to perform full reset`, {
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
	 * FlowResetServiceV8.clearTokens('authz-code');
	 */
	static clearTokens(flowKey: string): ResetResult {
		console.log(`${MODULE_TAG} Clearing tokens`, { flowKey });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			if (StorageServiceV8.has(STORAGE_KEYS.TOKENS)) {
				StorageServiceV8.clear(STORAGE_KEYS.TOKENS);
				cleared.push('tokens');
			}

			console.log(`${MODULE_TAG} Tokens cleared`, { flowKey });

			return {
				success: true,
				cleared,
				kept,
				message: 'Tokens cleared.',
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear tokens`, {
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
	 * FlowResetServiceV8.clearSession('authz-code');
	 */
	static clearSession(flowKey: string): ResetResult {
		console.log(`${MODULE_TAG} Clearing session`, { flowKey });

		const cleared: string[] = [];
		const kept: string[] = [];

		try {
			// Clear step progress
			if (StorageServiceV8.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageServiceV8.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			// Clear flow-specific session data
			const flowData = StorageServiceV8.getFlowData(flowKey);
			flowData.forEach(({ key }) => {
				// Only clear session-related data, not credentials or tokens
				if (!key.includes('credentials') && !key.includes('tokens') && !key.includes('worker')) {
					StorageServiceV8.clear(key);
					cleared.push(key);
				} else {
					kept.push(key);
				}
			});

			console.log(`${MODULE_TAG} Session cleared`, {
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
			console.error(`${MODULE_TAG} Failed to clear session`, {
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
	 * FlowResetServiceV8.clearProgress('authz-code');
	 */
	static clearProgress(flowKey: string): ResetResult {
		console.log(`${MODULE_TAG} Clearing progress`, { flowKey });

		const cleared: string[] = [];

		try {
			if (StorageServiceV8.has(STORAGE_KEYS.STEP_PROGRESS)) {
				StorageServiceV8.clear(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			}

			console.log(`${MODULE_TAG} Progress cleared`, { flowKey });

			return {
				success: true,
				cleared,
				kept: [],
				message: 'Progress cleared.',
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear progress`, {
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
	 * FlowResetServiceV8.clearPingOneSession('authz-code');
	 */
	static clearPingOneSession(flowKey: string): ResetResult {
		console.log(`${MODULE_TAG} Clearing PingOne session`, { flowKey });

		const cleared: string[] = [];

		try {
			// Clear discovery cache
			if (StorageServiceV8.has(STORAGE_KEYS.DISCOVERY)) {
				StorageServiceV8.clear(STORAGE_KEYS.DISCOVERY);
				cleared.push('discovery');
			}

			// Clear preferences
			if (StorageServiceV8.has(STORAGE_KEYS.PREFERENCES)) {
				StorageServiceV8.clear(STORAGE_KEYS.PREFERENCES);
				cleared.push('preferences');
			}

			console.log(`${MODULE_TAG} PingOne session cleared`, {
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
			console.error(`${MODULE_TAG} Failed to clear PingOne session`, {
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
	 * const summary = FlowResetServiceV8.getResetSummary('authz-code');
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
			tokens: StorageServiceV8.has(STORAGE_KEYS.TOKENS),
			session: StorageServiceV8.getFlowData(flowKey).length > 0,
			progress: StorageServiceV8.has(STORAGE_KEYS.STEP_PROGRESS),
			discovery: StorageServiceV8.has(STORAGE_KEYS.DISCOVERY),
			preferences: StorageServiceV8.has(STORAGE_KEYS.PREFERENCES),
			credentials: StorageServiceV8.has(STORAGE_KEYS.CREDENTIALS),
			workerToken: StorageServiceV8.has('v8:worker-token'),
		};
	}

	/**
	 * Get reset message for UI
	 * @param flowKey - Flow key
	 * @returns User-friendly reset message
	 * @example
	 * const message = FlowResetServiceV8.getResetMessage('authz-code');
	 */
	static getResetMessage(flowKey: string): string {
		const summary = FlowResetServiceV8.getResetSummary(flowKey);

		const items: string[] = [];
		if (summary.tokens) items.push('✓ Clear all tokens');
		if (summary.session) items.push('✓ Clear PingOne session');
		if (summary.progress) items.push('✓ Return to Step 0');
		if (summary.credentials) items.push('✓ Keep credentials');
		if (summary.workerToken) items.push('✓ Keep worker token');

		return `🔄 Reset Flow?\n\nThis will:\n${items.join('\n')}\n\nContinue?`;
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default FlowResetServiceV8;
