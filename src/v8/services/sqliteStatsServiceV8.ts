/**
 * @file sqliteStatsServiceV8.ts
 * @module v8/services
 * @description SQLite database statistics service
 * @version 1.1.0
 * @since 2026-02-02
 *
 * Provides methods to fetch user cache statistics from the server's SQLite database.
 * This replaces the old IndexedDB client-side caching approach.
 *
 * Features:
 * - Get total user count
 * - Get sync metadata (last sync time, status)
 * - Lightweight API calls
 * - Cached results to reduce server load
 * - Connection monitoring and resource exhaustion prevention
 * - Automatic retry with exponential backoff
 * - Circuit breaker pattern for reliability
 */

const MODULE_TAG = '[📊 SQLITE-STATS-V8]';

// Connection monitoring and rate limiting
const CONNECTION_LIMIT = 10; // Max concurrent connections
const RETRY_DELAY = 1000; // Initial retry delay in ms
const MAX_RETRIES = 3; // Maximum retry attempts
const CIRCUIT_BREAKER_THRESHOLD = 5; // Failures before circuit breaker opens

// Global connection tracking
let activeConnections = 0;
let connectionErrors = 0;
let circuitBreakerOpen = false;
let lastCircuitBreakerTime = 0;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

interface ConnectionMetrics {
	/** Current active connections */
	activeConnections: number;
	/** Total connection errors */
	connectionErrors: number;
	/** Whether circuit breaker is open */
	circuitBreakerOpen: boolean;
	/** Time when circuit breaker opened */
	lastCircuitBreakerTime: number;
}

export interface SQLiteUserStats {
	/** Environment ID */
	environmentId: string;
	/** Total users in SQLite database for this environment */
	totalUsers: number;
	/** Whether stats were successfully loaded */
	success: boolean;
	/** Error message if failed */
	error?: string;
}

export interface SQLiteSyncMetadata {
	/** Environment ID */
	environmentId: string;
	/** Total users in database */
	totalUsers: number;
	/** Last sync timestamp */
	lastSyncedAt: string | null;
	/** Sync status */
	syncStatus: 'never' | 'syncing' | 'complete' | 'failed';
	/** Number of users synced in last operation */
	lastSyncCount?: number;
	/** Whether sync is currently in progress */
	isSyncing: boolean;
	/** Error from last sync if any */
	lastError?: string;
}

/**
 * SQLite Stats Service with connection monitoring and resource exhaustion prevention
 *
 * Fetches user cache statistics from the server's SQLite database.
 * All operations are server-side; no IndexedDB involved.
 */
export class SQLiteStatsServiceV8 {
	private static userCountCache = new Map<string, { count: number; timestamp: number }>();
	private static CACHE_TTL = 30000; // 30 seconds

	/**
	 * Get connection metrics for monitoring
	 */
	static getConnectionMetrics(): ConnectionMetrics {
		return {
			activeConnections,
			connectionErrors,
			circuitBreakerOpen,
			lastCircuitBreakerTime,
		};
	}

	/**
	 * Check if circuit breaker is open and should be reset
	 */
	private static shouldResetCircuitBreaker(): boolean {
		return circuitBreakerOpen && Date.now() - lastCircuitBreakerTime > CIRCUIT_BREAKER_TIMEOUT;
	}

	/**
	 * Reset circuit breaker after timeout
	 */
	private static resetCircuitBreaker(): void {
		circuitBreakerOpen = false;
		connectionErrors = 0;
		lastCircuitBreakerTime = 0;
		console.log(`${MODULE_TAG} Circuit breaker reset`);
	}

	/**
	 * Open circuit breaker after threshold failures
	 */
	private static openCircuitBreaker(): void {
		circuitBreakerOpen = true;
		lastCircuitBreakerTime = Date.now();
		console.warn(`${MODULE_TAG} Circuit breaker opened due to ${connectionErrors} failures`);
	}

	/**
	 * Execute API call with connection monitoring and circuit breaker
	 */
	private static async executeWithMonitoring<T>(
		apiCall: () => Promise<T>,
		operation: string
	): Promise<T> {
		// Check circuit breaker
		if (circuitBreakerOpen) {
			if (SQLiteStatsServiceV8.shouldResetCircuitBreaker()) {
				SQLiteStatsServiceV8.resetCircuitBreaker();
			} else {
				throw new Error(`Circuit breaker open for ${operation} - too many failures`);
			}
		}

		// Check connection limit
		if (activeConnections >= CONNECTION_LIMIT) {
			throw new Error(`Connection limit exceeded (${CONNECTION_LIMIT}) for ${operation}`);
		}

		activeConnections++;
		let attempt = 0;

		try {
			while (attempt < MAX_RETRIES) {
				try {
					const result = await apiCall();
					// Success - reset error count if we had previous failures
					if (connectionErrors > 0) {
						connectionErrors = Math.max(0, connectionErrors - 1);
					}
					return result;
				} catch (error: unknown) {
					attempt++;
					connectionErrors++;

					const errorMessage = error instanceof Error ? error.message : String(error);
					console.error(`${MODULE_TAG} ${operation} attempt ${attempt} failed:`, errorMessage);

					// Check if we should open circuit breaker
					if (connectionErrors >= CIRCUIT_BREAKER_THRESHOLD) {
						SQLiteStatsServiceV8.openCircuitBreaker();
						throw new Error(`Circuit breaker opened for ${operation} - too many failures`);
					}

					// If we have retries left, wait with exponential backoff
					if (attempt < MAX_RETRIES) {
						const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
						console.log(`${MODULE_TAG} Retrying ${operation} in ${delay}ms...`);
						await new Promise(resolve => setTimeout(resolve, delay));
					} else {
						throw error;
					}
				}
			}

			throw new Error(`Max retries (${MAX_RETRIES}) exceeded for ${operation}`);
		} finally {
			activeConnections--;
		}
	}

	/**
	 * Get total user count for an environment from SQLite database
	 *
	 * @param environmentId - PingOne environment ID
	 * @returns User count and status
	 */
	static async getUserCount(environmentId: string): Promise<SQLiteUserStats> {
		if (!environmentId || !environmentId.trim()) {
			return {
				environmentId,
				totalUsers: 0,
				success: false,
				error: 'Environment ID is required',
			};
		}

		// Check cache first
		const cached = SQLiteStatsServiceV8.userCountCache.get(environmentId);
		if (cached && Date.now() - cached.timestamp < SQLiteStatsServiceV8.CACHE_TTL) {
			console.log(`${MODULE_TAG} Using cached count for ${environmentId}:`, cached.count);
			return {
				environmentId,
				totalUsers: cached.count,
				success: true,
			};
		}

		try {
			const response = await SQLiteStatsServiceV8.executeWithMonitoring(
				() => fetch(`/api/users/count/${environmentId}`),
				'getUserCount'
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const data = await response.json();
			const count = data.totalUsers || 0;

			// Cache the result
			SQLiteStatsServiceV8.userCountCache.set(environmentId, {
				count,
				timestamp: Date.now(),
			});

			console.log(`${MODULE_TAG} Fetched user count for ${environmentId}:`, count);

			return {
				environmentId,
				totalUsers: count,
				success: true,
			};
		} catch (error: unknown) {
			console.error(`${MODULE_TAG} Failed to get user count:`, error);
			return {
				environmentId,
				totalUsers: 0,
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Get sync metadata for an environment
	 *
	 * @param environmentId - PingOne environment ID
	 * @returns Sync metadata including last sync time, status, etc.
	 */
	static async getSyncMetadata(environmentId: string): Promise<SQLiteSyncMetadata> {
		if (!environmentId || !environmentId.trim()) {
			return {
				environmentId,
				totalUsers: 0,
				lastSyncedAt: null,
				syncStatus: 'never',
				isSyncing: false,
			};
		}

		try {
			const response = await SQLiteStatsServiceV8.executeWithMonitoring(
				() => fetch(`/api/users/sync-metadata/${environmentId}`),
				'getSyncMetadata'
			);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();

			return {
				environmentId,
				totalUsers: data.totalUsers || 0,
				lastSyncedAt: data.lastSyncedAt || null,
				syncStatus: data.syncStatus || 'never',
				lastSyncCount: data.lastSyncCount,
				isSyncing: data.isSyncing || false,
				lastError: data.lastError,
			};
		} catch (error: unknown) {
			console.error(`${MODULE_TAG} Failed to get sync metadata:`, error);

			// Fallback to user count endpoint
			const countResult = await SQLiteStatsServiceV8.getUserCount(environmentId);

			return {
				environmentId,
				totalUsers: countResult.totalUsers,
				lastSyncedAt: null,
				syncStatus: 'never',
				isSyncing: false,
			};
		}
	}

	/**
	 * Clear cached stats (force fresh fetch next time)
	 */
	static clearCache(): void {
		SQLiteStatsServiceV8.userCountCache.clear();
		console.log(`${MODULE_TAG} Cache cleared`);
	}

	/**
	 * Clear cache for specific environment
	 */
	static clearCacheForEnvironment(environmentId: string): void {
		SQLiteStatsServiceV8.userCountCache.delete(environmentId);
		console.log(`${MODULE_TAG} Cache cleared for ${environmentId}`);
	}
}

export default SQLiteStatsServiceV8;
