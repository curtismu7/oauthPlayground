/**
 * @file flowResetServiceV9.ts
 * @module services/v9
 * @description Enhanced Flow Reset Service V9 with full V8 compatibility
 * @version 9.0.0
 * @since 2024-03-09
 *
 * V9 enhancements:
 * - Enhanced reset options with granular control
 * - Reset history tracking and analytics
 * - Better error handling and validation
 * - Performance optimizations
 * - Enhanced logging and monitoring
 * - V8 interface compatibility preserved
 *
 * @example
 * // V8 compatible usage
 * FlowResetServiceV9.resetFlow('authz-code');
 * FlowResetServiceV9.fullReset('authz-code');
 * FlowResetServiceV9.clearTokens('authz-code');
 *
 * // V9 enhanced usage
 * const result = FlowResetServiceV9.resetFlowV9('authz-code', { clearPreferences: true });
 * const history = FlowResetServiceV9.getResetHistory();
 */

import { logger } from '../../utils/logger';

const MODULE_TAG = '[🔄 FLOW-RESET-V9]';

// Re-export V8 types for full compatibility
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
	duration?: number;
	timestamp: string;
}

// V9 enhanced interfaces
export interface ResetOptionsV9 extends ResetOptions {
	clearCache?: boolean;
	clearLogs?: boolean;
	clearAnalytics?: boolean;
	preserveSession?: boolean;
	backupBeforeReset?: boolean;
	resetReason?: string;
}

export interface ResetResultV9 extends ResetResult {
	resetId: string;
	options: ResetOptionsV9;
	backupPath?: string;
	warnings: string[];
	affectedFlows: string[];
	performanceMetrics: {
		itemsCleared: number;
		itemsKept: number;
		resetTime: number;
	};
}

export interface ResetHistoryEntry {
	id: string;
	timestamp: string;
	flowKey: string;
	options: ResetOptionsV9;
	result: ResetResultV9;
	userAgent?: string;
	sessionId?: string;
}

export interface ResetAnalytics {
	totalResets: number;
	resetsByFlow: Record<string, number>;
	resetsByReason: Record<string, number>;
	averageResetTime: number;
	mostClearedItems: string[];
	lastReset: string;
}

// Storage keys (mirroring V8 for compatibility)
const STORAGE_KEYS = {
	TOKENS: 'oauth_tokens',
	CREDENTIALS: 'oauth_credentials',
	STEP_PROGRESS: 'step_progress',
	DISCOVERY: 'discovery_cache',
	PREFERENCES: 'user_preferences',
	WORKER_TOKEN: 'worker_token',
	CACHE: 'app_cache',
	LOGS: 'flow_logs',
	ANALYTICS: 'flow_analytics',
};

class FlowResetServiceV9 {
	private static readonly HISTORY_KEY = 'flow_reset_history';
	private static readonly ANALYTICS_KEY = 'flow_reset_analytics';
	private static readonly MAX_HISTORY_SIZE = 50;

	// V8 Compatibility Layer - All V8 methods preserved exactly

	/**
	 * Reset flow to initial state (V8 compatible)
	 * @param flowKey - Flow key (e.g., 'authz-code', 'implicit')
	 * @param keepWorkerToken - Keep worker token (default: true)
	 * @returns Reset result
	 */
	static resetFlow(flowKey: string, keepWorkerToken = true): ResetResult {
		const options: ResetOptionsV9 = {
			clearTokens: true,
			clearProgress: true,
			keepWorkerToken,
			resetReason: 'V8 compatible reset',
		};

		const result = FlowResetServiceV9.resetFlowV9(flowKey, options);

		// Return V8 compatible format
		return {
			success: result.success,
			cleared: result.cleared,
			kept: result.kept,
			message: result.message,
		};
	}

	/**
	 * Full reset - clear everything (V8 compatible)
	 * @param flowKey - Flow key
	 * @returns Reset result
	 */
	static fullReset(flowKey: string): ResetResult {
		const options: ResetOptionsV9 = {
			clearCredentials: true,
			clearTokens: true,
			clearProgress: true,
			clearDiscovery: true,
			clearPreferences: true,
			keepWorkerToken: false,
			resetReason: 'V8 compatible full reset',
		};

		const result = FlowResetServiceV9.resetFlowV9(flowKey, options);

		// Return V8 compatible format
		return {
			success: result.success,
			cleared: result.cleared,
			kept: result.kept,
			message: result.message,
		};
	}

	/**
	 * Clear only tokens (V8 compatible)
	 * @param flowKey - Flow key
	 * @returns Reset result
	 */
	static clearTokens(flowKey: string): ResetResult {
		const options: ResetOptionsV9 = {
			clearTokens: true,
			keepWorkerToken: true,
			resetReason: 'V8 compatible token clear',
		};

		const result = FlowResetServiceV9.resetFlowV9(flowKey, options);

		// Return V8 compatible format
		return {
			success: result.success,
			cleared: result.cleared,
			kept: result.kept,
			message: result.message,
		};
	}

	// V9 Enhanced Methods

	/**
	 * Enhanced flow reset with granular options
	 * @param flowKey - Flow key
	 * @param options - Enhanced reset options
	 * @returns Enhanced reset result
	 */
	static resetFlowV9(flowKey: string, options: ResetOptionsV9 = {}): ResetResultV9 {
		const startTime = Date.now();
		const resetId = FlowResetServiceV9.generateResetId();

		logger.info(MODULE_TAG, 'Starting enhanced flow reset', {
			flowKey,
			resetId,
			options,
		});

		const cleared: string[] = [];
		const kept: string[] = [];
		const warnings: string[] = [];
		const affectedFlows: string[] = [flowKey];

		try {
			// Backup before reset if requested
			let backupPath: string | undefined;
			if (options.backupBeforeReset) {
				backupPath = FlowResetServiceV9.createBackup(flowKey);
				logger.info(MODULE_TAG, 'Backup created', { backupPath });
			}

			// Clear tokens
			if (options.clearTokens !== false && FlowResetServiceV9.hasStorage(STORAGE_KEYS.TOKENS)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.TOKENS);
				cleared.push('tokens');
			} else {
				kept.push('tokens');
			}

			// Clear credentials
			if (options.clearCredentials && FlowResetServiceV9.hasStorage(STORAGE_KEYS.CREDENTIALS)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.CREDENTIALS);
				cleared.push('credentials');
			} else {
				kept.push('credentials');
			}

			// Clear step progress
			if (
				options.clearProgress !== false &&
				FlowResetServiceV9.hasStorage(STORAGE_KEYS.STEP_PROGRESS)
			) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.STEP_PROGRESS);
				cleared.push('step_progress');
			} else {
				kept.push('step_progress');
			}

			// Clear discovery cache
			if (options.clearDiscovery && FlowResetServiceV9.hasStorage(STORAGE_KEYS.DISCOVERY)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.DISCOVERY);
				cleared.push('discovery');
			} else {
				kept.push('discovery');
			}

			// Clear preferences
			if (options.clearPreferences && FlowResetServiceV9.hasStorage(STORAGE_KEYS.PREFERENCES)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.PREFERENCES);
				cleared.push('preferences');
			} else {
				kept.push('preferences');
			}

			// Clear cache
			if (options.clearCache && FlowResetServiceV9.hasStorage(STORAGE_KEYS.CACHE)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.CACHE);
				cleared.push('cache');
			} else {
				kept.push('cache');
			}

			// Clear logs
			if (options.clearLogs && FlowResetServiceV9.hasStorage(STORAGE_KEYS.LOGS)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.LOGS);
				cleared.push('logs');
			} else {
				kept.push('logs');
			}

			// Clear analytics
			if (options.clearAnalytics && FlowResetServiceV9.hasStorage(STORAGE_KEYS.ANALYTICS)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.ANALYTICS);
				cleared.push('analytics');
			} else {
				kept.push('analytics');
			}

			// Handle worker token
			if (options.keepWorkerToken !== false) {
				kept.push('worker_token');
			} else if (FlowResetServiceV9.hasStorage(STORAGE_KEYS.WORKER_TOKEN)) {
				FlowResetServiceV9.clearStorage(STORAGE_KEYS.WORKER_TOKEN);
				cleared.push('worker_token');
			} else {
				kept.push('worker_token');
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			const result: ResetResultV9 = {
				resetId,
				success: true,
				cleared,
				kept,
				message: `Flow ${flowKey} reset successfully`,
				timestamp: new Date().toISOString(),
				options,
				backupPath,
				warnings,
				affectedFlows,
				performanceMetrics: {
					itemsCleared: cleared.length,
					itemsKept: kept.length,
					resetTime: duration,
				},
			};

			// Record reset in history
			FlowResetServiceV9.recordReset(flowKey, options, result);

			// Update analytics
			FlowResetServiceV9.updateAnalytics(flowKey, options, result);

			logger.info(MODULE_TAG, 'Flow reset completed', {
				flowKey,
				resetId,
				duration,
				itemsCleared: cleared.length,
				itemsKept: kept.length,
			});

			return result;
		} catch (error) {
			const endTime = Date.now();
			const duration = endTime - startTime;

			logger.error(MODULE_TAG, 'Flow reset failed', error);

			const result: ResetResultV9 = {
				resetId,
				success: false,
				cleared,
				kept,
				message: `Flow reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date().toISOString(),
				options,
				warnings: [...warnings, 'Reset completed with errors'],
				affectedFlows,
				performanceMetrics: {
					itemsCleared: cleared.length,
					itemsKept: kept.length,
					resetTime: duration,
				},
			};

			return result;
		}
	}

	/**
	 * Get reset history
	 * @param flowKey - Optional flow key to filter by
	 * @returns Array of reset history entries
	 */
	static getResetHistory(flowKey?: string): ResetHistoryEntry[] {
		try {
			const historyJson = localStorage.getItem(FlowResetServiceV9.HISTORY_KEY);
			if (!historyJson) {
				return [];
			}

			let history: ResetHistoryEntry[] = JSON.parse(historyJson);

			// Filter by flow key if provided
			if (flowKey) {
				history = history.filter((entry) => entry.flowKey === flowKey);
			}

			// Sort by timestamp (newest first)
			history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

			return history;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to get reset history', error);
			return [];
		}
	}

	/**
	 * Get reset analytics
	 * @returns Reset analytics data
	 */
	static getResetAnalytics(): ResetAnalytics {
		try {
			const analyticsJson = localStorage.getItem(FlowResetServiceV9.ANALYTICS_KEY);
			if (!analyticsJson) {
				return {
					totalResets: 0,
					resetsByFlow: {},
					resetsByReason: {},
					averageResetTime: 0,
					mostClearedItems: [],
					lastReset: '',
				};
			}

			return JSON.parse(analyticsJson);
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to get reset analytics', error);
			return {
				totalResets: 0,
				resetsByFlow: {},
				resetsByReason: {},
				averageResetTime: 0,
				mostClearedItems: [],
				lastReset: '',
			};
		}
	}

	/**
	 * Clear reset history
	 * @param olderThan - Optional timestamp to clear only entries older than this
	 */
	static clearResetHistory(olderThan?: number): void {
		try {
			if (olderThan) {
				const history = FlowResetServiceV9.getResetHistory();
				const filteredHistory = history.filter(
					(entry) => new Date(entry.timestamp).getTime() > olderThan
				);
				localStorage.setItem(FlowResetServiceV9.HISTORY_KEY, JSON.stringify(filteredHistory));
			} else {
				localStorage.removeItem(FlowResetServiceV9.HISTORY_KEY);
			}

			logger.info(MODULE_TAG, 'Reset history cleared', { olderThan });
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to clear reset history', error);
		}
	}

	/**
	 * Reset multiple flows at once
	 * @param flowKeys - Array of flow keys
	 * @param options - Reset options
	 * @returns Array of reset results
	 */
	static resetMultipleFlows(flowKeys: string[], options: ResetOptionsV9 = {}): ResetResultV9[] {
		logger.info(MODULE_TAG, 'Resetting multiple flows', { flowKeys, options });

		const results: ResetResultV9[] = [];

		for (const flowKey of flowKeys) {
			const result = FlowResetServiceV9.resetFlowV9(flowKey, options);
			results.push(result);
		}

		const successfulResets = results.filter((r) => r.success).length;
		logger.info(MODULE_TAG, 'Multiple flows reset completed', {
			totalFlows: flowKeys.length,
			successful: successfulResets,
			failed: flowKeys.length - successfulResets,
		});

		return results;
	}

	// Private helper methods

	private static generateResetId(): string {
		return `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private static hasStorage(key: string): boolean {
		return localStorage.getItem(key) !== null;
	}

	private static clearStorage(key: string): void {
		localStorage.removeItem(key);
	}

	private static createBackup(flowKey: string): string {
		const backupData: Record<string, string> = {};
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const backupPath = `backup_${flowKey}_${timestamp}`;

		// Backup all relevant storage items
		[STORAGE_KEYS.TOKENS, STORAGE_KEYS.CREDENTIALS, STORAGE_KEYS.STEP_PROGRESS].forEach((key) => {
			const value = localStorage.getItem(key);
			if (value) {
				backupData[key] = value;
			}
		});

		try {
			localStorage.setItem(backupPath, JSON.stringify(backupData));
			return backupPath;
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to create backup', error);
			return '';
		}
	}

	private static recordReset(
		flowKey: string,
		options: ResetOptionsV9,
		result: ResetResultV9
	): void {
		try {
			const history = FlowResetServiceV9.getResetHistory();

			const entry: ResetHistoryEntry = {
				id: result.resetId,
				timestamp: result.timestamp,
				flowKey,
				options,
				result,
				userAgent: navigator.userAgent,
				sessionId: FlowResetServiceV9.getSessionId(),
			};

			history.unshift(entry);

			// Limit history size
			if (history.length > FlowResetServiceV9.MAX_HISTORY_SIZE) {
				history.splice(FlowResetServiceV9.MAX_HISTORY_SIZE);
			}

			localStorage.setItem(FlowResetServiceV9.HISTORY_KEY, JSON.stringify(history));
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to record reset', error);
		}
	}

	private static updateAnalytics(
		flowKey: string,
		options: ResetOptionsV9,
		result: ResetResultV9
	): void {
		try {
			const analytics = FlowResetServiceV9.getResetAnalytics();

			// Update total resets
			analytics.totalResets++;

			// Update resets by flow
			analytics.resetsByFlow[flowKey] = (analytics.resetsByFlow[flowKey] || 0) + 1;

			// Update resets by reason
			const reason = options.resetReason || 'unknown';
			analytics.resetsByReason[reason] = (analytics.resetsByReason[reason] || 0) + 1;

			// Update average reset time
			const totalTime =
				analytics.averageResetTime * (analytics.totalResets - 1) +
				result.performanceMetrics.resetTime;
			analytics.averageResetTime = totalTime / analytics.totalResets;

			// Update most cleared items
			result.cleared.forEach((item) => {
				if (!analytics.mostClearedItems.includes(item)) {
					analytics.mostClearedItems.push(item);
				}
			});

			// Keep only top 10 most cleared items
			analytics.mostClearedItems = analytics.mostClearedItems.slice(0, 10);

			// Update last reset
			analytics.lastReset = result.timestamp;

			localStorage.setItem(FlowResetServiceV9.ANALYTICS_KEY, JSON.stringify(analytics));
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to update analytics', error);
		}
	}

	private static getSessionId(): string {
		let sessionId = sessionStorage.getItem('session_id');
		if (!sessionId) {
			sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			sessionStorage.setItem('session_id', sessionId);
		}
		return sessionId;
	}
}

export default FlowResetServiceV9;
