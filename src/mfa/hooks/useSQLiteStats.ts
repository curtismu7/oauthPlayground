/**
 * @file useSQLiteStats.ts
 * @module v8/hooks
 * @description React hook for SQLite database statistics
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Provides real-time SQLite user cache statistics with auto-refresh
 */

import { useCallback, useEffect, useState } from 'react';
import {
	SQLiteStatsService,
	type SQLiteSyncMetadata,
	type SQLiteUserStats,
} from '@/mfa/services/sqliteStatsService';
import { logger } from '../../utils/logger';

const MODULE_TAG = '[ USE-SQLITE-STATS]';

export interface UseSQLiteStatsOptions {
	/** Environment ID to fetch stats for */
	environmentId: string;
	/** Auto-refresh interval in seconds (0 = disabled) */
	refreshInterval?: number;
	/** Enable auto-refresh */
	enabled?: boolean;
}

export interface UseSQLiteStatsReturn {
	/** User count stats */
	stats: SQLiteUserStats | null;
	/** Sync metadata */
	metadata: SQLiteSyncMetadata | null;
	/** Loading state */
	isLoading: boolean;
	/** Manually refresh stats */
	refresh: () => Promise<void>;
	/** Clear cache and force fresh fetch */
	clearCache: () => void;
}

/**
 * React hook for SQLite statistics
 *
 * @example
 * ```tsx
 * const { stats, metadata, isLoading } = useSQLiteStats({
 *   environmentId: 'env-123',
 *   refreshInterval: 30, // Refresh every 30 seconds
 * });
 *
 * if (stats) {
 *   logger.info('Total users:', stats.totalUsers);
 * }
 * ```
 */
export function useSQLiteStats(options: UseSQLiteStatsOptions): UseSQLiteStatsReturn {
	const { environmentId, refreshInterval = 30, enabled = true } = options;

	const [stats, setStats] = useState<SQLiteUserStats | null>(null);
	const [metadata, setMetadata] = useState<SQLiteSyncMetadata | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const fetchStats = useCallback(async () => {
		if (!environmentId || !environmentId.trim() || !enabled) {
			setStats(null);
			setMetadata(null);
			return;
		}

		setIsLoading(true);
		try {
			// Fetch both stats and metadata in parallel
			const [statsResult, metadataResult] = await Promise.all([
				SQLiteStatsService.getUserCount(environmentId),
				SQLiteStatsService.getSyncMetadata(environmentId),
			]);

			setStats(statsResult);
			setMetadata(metadataResult);

			logger.info(`${MODULE_TAG} Stats loaded for ${environmentId}:`, {
				totalUsers: statsResult.totalUsers,
				lastSynced: metadataResult.lastSyncedAt,
			});
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to fetch stats:`, error);
			setStats(null);
			setMetadata(null);
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, enabled]);

	const clearCache = () => {
		SQLiteStatsService.clearCacheForEnvironment(environmentId);
		fetchStats(); // Fetch fresh data
	};

	// Initial fetch
	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	// Auto-refresh
	useEffect(() => {
		if (!enabled || refreshInterval <= 0) {
			return;
		}

		const interval = setInterval(fetchStats, refreshInterval * 1000);
		return () => clearInterval(interval);
	}, [refreshInterval, enabled, fetchStats]);

	return {
		stats,
		metadata,
		isLoading,
		refresh: fetchStats,
		clearCache,
	};
}

export default useSQLiteStats;
