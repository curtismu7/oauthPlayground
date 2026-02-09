/**
 * @file sqliteStatsServiceV8.ts
 * @module v8/services
 * @description SQLite database statistics service
 * @version 1.0.0
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
 */

const MODULE_TAG = '[📊 SQLITE-STATS-V8]';

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
 * SQLite Stats Service
 *
 * Fetches user cache statistics from the server's SQLite database.
 * All operations are server-side; no IndexedDB involved.
 */
export class SQLiteStatsServiceV8 {
	private static userCountCache = new Map<string, { count: number; timestamp: number }>();
	private static CACHE_TTL = 30000; // 30 seconds

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
			const response = await fetch(`/api/users/count/${environmentId}`);

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
		} catch (error: any) {
			console.error(`${MODULE_TAG} Failed to get user count:`, error);
			return {
				environmentId,
				totalUsers: 0,
				success: false,
				error: error.message || 'Failed to fetch user count',
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
			const response = await fetch(`/api/users/sync-metadata/${environmentId}`);

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
		} catch (error: any) {
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
