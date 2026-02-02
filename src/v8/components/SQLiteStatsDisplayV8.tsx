/**
 * @file SQLiteStatsDisplayV8.tsx
 * @module v8/components
 * @description SQLite database statistics display component
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Shows user cache statistics from server-side SQLite database.
 * Replaces the old UserCacheProgressV8 component that used IndexedDB.
 */

import React from 'react';
import { FiDatabase, FiRefreshCw } from 'react-icons/fi';
import { useSQLiteStats } from '@/v8/hooks/useSQLiteStats';

interface SQLiteStatsDisplayV8Props {
	/** Environment ID to fetch stats for */
	environmentId: string;
	/** Show in compact mode (single line) */
	compact?: boolean;
	/** Auto-refresh interval in seconds (default: 30) */
	refreshInterval?: number;
	/** Show refresh button */
	showRefreshButton?: boolean;
}

/**
 * SQLite Stats Display Component
 * 
 * Shows real-time statistics from the server's SQLite user database.
 * 
 * @example
 * ```tsx
 * <SQLiteStatsDisplayV8
 *   environmentId="env-123"
 *   compact={true}
 *   refreshInterval={30}
 * />
 * ```
 */
export const SQLiteStatsDisplayV8: React.FC<SQLiteStatsDisplayV8Props> = ({
	environmentId,
	compact = false,
	refreshInterval = 30,
	showRefreshButton = false,
}) => {
	const { stats, metadata, isLoading, refresh } = useSQLiteStats({
		environmentId,
		refreshInterval,
		enabled: !!environmentId,
	});

	// Compact view - single line
	if (compact) {
		if (isLoading && !stats) {
			return (
				<div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
					<div
						style={{
							width: '12px',
							height: '12px',
							border: '2px solid #3b82f6',
							borderTopColor: 'transparent',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite',
						}}
					/>
					Loading SQLite stats...
				</div>
			);
		}

		if (!stats || !stats.success) {
			return (
				<div style={{ fontSize: '12px', color: '#ef4444' }}>
					❌ SQLite stats unavailable
				</div>
			);
		}

		if (stats.totalUsers === 0) {
			return (
				<div style={{ fontSize: '12px', color: '#6b7280' }}>
					⚪ No users in SQLite database
				</div>
			);
		}

		return (
			<div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
				<FiDatabase size={14} />
				<span>{stats.totalUsers.toLocaleString()} users in SQLite</span>
				{metadata?.lastSyncedAt && (
					<span style={{ color: '#6b7280', fontSize: '11px' }}>
						• {new Date(metadata.lastSyncedAt).toLocaleDateString()}
					</span>
				)}
			</div>
		);
	}

	// Full view with details
	return (
		<div
			style={{
				padding: '12px',
				background: '#f0f9ff',
				border: '1px solid #bae6fd',
				borderRadius: '6px',
				fontSize: '13px',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
				<div style={{ fontWeight: 600, color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '6px' }}>
					<FiDatabase size={16} />
					SQLite Database
				</div>
				{showRefreshButton && (
					<button
						onClick={refresh}
						disabled={isLoading}
						style={{
							padding: '4px 10px',
							fontSize: '11px',
							background: isLoading ? '#9ca3af' : '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: isLoading ? 'not-allowed' : 'pointer',
							fontWeight: 500,
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
						}}
					>
						<FiRefreshCw size={12} />
						Refresh
					</button>
				)}
			</div>

			{isLoading && !stats ? (
				<div style={{ color: '#6b7280', fontSize: '12px' }}>
					Loading statistics...
				</div>
			) : !stats || !stats.success ? (
				<div style={{ color: '#ef4444', fontSize: '12px' }}>
					❌ Failed to load statistics
					{stats?.error && <div style={{ marginTop: '4px', fontSize: '11px' }}>{stats.error}</div>}
				</div>
			) : (
				<>
					<div style={{ marginBottom: '6px', color: '#0369a1' }}>
						{stats.totalUsers === 0 ? (
							<span>⚪ No users in database</span>
						) : (
							<span style={{ fontSize: '14px', fontWeight: 600 }}>
								✓ {stats.totalUsers.toLocaleString()} users
							</span>
						)}
					</div>
					
					{metadata && (
						<div style={{ fontSize: '11px', color: '#6b7280' }}>
							{metadata.lastSyncedAt && (
								<div>
									Last synced: {new Date(metadata.lastSyncedAt).toLocaleString()}
								</div>
							)}
							{metadata.isSyncing && (
								<div style={{ color: '#3b82f6', fontWeight: 500, marginTop: '4px' }}>
									🔄 Sync in progress...
								</div>
							)}
							{metadata.lastError && (
								<div style={{ color: '#ef4444', marginTop: '4px' }}>
									Last error: {metadata.lastError}
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default SQLiteStatsDisplayV8;
