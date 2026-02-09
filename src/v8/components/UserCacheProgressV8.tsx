/**
 * @file UserCacheProgressV8.tsx
 * @module v8/components
 * @description User cache progress indicator with controls
 * @version 8.0.0
 * @since 2026-02-01
 *
 * Shows cache status, progress, and provides manual refresh controls
 */

import React, { useCallback, useEffect, useState } from 'react';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { UserCacheServiceV8 } from '@/v8/services/userCacheServiceV8';
import { UserServiceV8 } from '@/v8/services/userServiceV8';

interface UserCacheProgressProps {
	environmentId: string;
	/** Show compact view */
	compact?: boolean;
	/** Auto-start prefetch on mount */
	autoStart?: boolean;
	/** Initial pages to fetch immediately */
	initialPages?: number;
	/** Maximum total pages */
	maxPages?: number;
}

interface CacheInfo {
	totalUsers: number;
	lastFetchedAt: number;
	fetchComplete: boolean;
	fetchInProgress: boolean;
	currentPage: number;
	totalPages: number;
	fetchedCount: number;
}

interface SyncStatus {
	isSyncing: boolean;
	phase: 'idle' | 'checking' | 'syncing' | 'complete';
	message: string;
	progress?: number;
	pingOneTotal?: number;
	indexedDBTotal?: number;
}

export const UserCacheProgressV8: React.FC<UserCacheProgressProps> = ({
	environmentId,
	compact = false,
	autoStart: _autoStart = true,
	initialPages = 5,
	maxPages = 50,
}) => {
	const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [abortController, setAbortController] = useState<AbortController | null>(null);
	const [syncStatus, setSyncStatus] = useState<SyncStatus>({
		isSyncing: false,
		phase: 'idle',
		message: '',
	});

	// Load cache info
	const loadCacheInfo = useCallback(async () => {
		const info = await UserCacheServiceV8.getCacheInfo(environmentId);
		if (info) {
			setCacheInfo({
				totalUsers: info.totalUsers || 0,
				lastFetchedAt: info.lastFetchedAt || 0,
				fetchComplete: info.fetchComplete || false,
				fetchInProgress: info.fetchInProgress || false,
				currentPage: info.currentPage || 0,
				totalPages: info.totalPages || 0,
				fetchedCount: info.fetchedCount || 0,
			});
		}
	}, [environmentId]);

	// Start prefetch
	const startPrefetch = async () => {
		if (isRefreshing) return;

		setIsRefreshing(true);
		const controller = new AbortController();
		setAbortController(controller);

		try {
			await UserServiceV8.prefetchUsers(environmentId, {
				initialPages,
				maxPages,
				delayMs: 150,
				onProgress: (progress) => {
					setCacheInfo((prev) => ({
						...prev!,
						currentPage: progress.currentPage,
						totalPages: progress.totalPages,
						fetchedCount: progress.fetchedCount,
						fetchComplete: progress.isComplete,
						fetchInProgress: !progress.isComplete,
					}));
				},
				signal: controller.signal,
			});
		} catch (error) {
			console.error('Prefetch error:', error);
		} finally {
			setIsRefreshing(false);
			setAbortController(null);
			await loadCacheInfo();
		}
	};

	// Stop prefetch
	const _stopPrefetch = () => {
		if (abortController) {
			abortController.abort();
			setAbortController(null);
			setIsRefreshing(false);
		}
	};

	// Clear cache
	const clearCache = async () => {
		const confirmed = await uiNotificationServiceV8.confirm({
			message: 'Clear user cache? This will require re-fetching users from the server.',
			confirmText: 'Clear Cache',
			cancelText: 'Cancel',
			severity: 'warning',
		});

		if (confirmed) {
			await UserCacheServiceV8.clearCache(environmentId);
			setCacheInfo(null);
		}
	};

	// Manual refresh
	const _handleRefresh = async () => {
		await clearCache();
		await startPrefetch();
	};

	// Smart sync: Compare IndexedDB with PingOne and sync bidirectionally
	const handleSmartSync = async () => {
		if (syncStatus.isSyncing) return;

		setSyncStatus({
			isSyncing: true,
			phase: 'checking',
			message: 'Checking PingOne user count...',
		});

		try {
			// Step 1: Get PingOne total count with minimal API call (limit=1)
			const pingOneResult = await UserServiceV8.listUsers(environmentId, { limit: 1, offset: 0 });
			const pingOneTotal = pingOneResult.totalCount;

			setSyncStatus((prev) => ({
				...prev,
				pingOneTotal,
				message: `PingOne: ${pingOneTotal.toLocaleString()} users`,
			}));

			// Step 2: Get IndexedDB count
			const indexedDBTotal = await UserCacheServiceV8.countUsers(environmentId);

			setSyncStatus((prev) => ({
				...prev,
				indexedDBTotal,
				message: `PingOne: ${pingOneTotal.toLocaleString()}, IndexedDB: ${indexedDBTotal.toLocaleString()}`,
			}));

			// Step 3: Compare and decide sync strategy
			if (pingOneTotal === indexedDBTotal) {
				setSyncStatus({
					isSyncing: false,
					phase: 'complete',
					message: '✓ Already in sync',
					pingOneTotal,
					indexedDBTotal,
				});
				return;
			}

			// Step 4: Sync needed - fetch in smart batches
			setSyncStatus((prev) => ({
				...prev,
				phase: 'syncing',
				message: `Syncing ${Math.abs(pingOneTotal - indexedDBTotal).toLocaleString()} users...`,
			}));

			const batchSize = 200; // PingOne max per request
			const totalPages = Math.ceil(pingOneTotal / batchSize);
			let syncedCount = 0;

			// Fetch all users in batches with delay to avoid rate limiting
			for (let page = 0; page < totalPages; page++) {
				const offset = page * batchSize;
				const result = await UserServiceV8.listUsers(environmentId, {
					limit: batchSize,
					offset,
				});

				// Save batch to IndexedDB
				if (result.users.length > 0) {
					await UserCacheServiceV8.saveUsers(environmentId, result.users, !result.hasMore);
					syncedCount += result.users.length;

					const progress = Math.round((syncedCount / pingOneTotal) * 100);
					setSyncStatus((prev) => ({
						...prev,
						progress,
						message: `Syncing: ${syncedCount.toLocaleString()}/${pingOneTotal.toLocaleString()} (${progress}%)`,
					}));
				}

				// Smart delay to avoid rate limiting (150ms between requests)
				if (result.hasMore) {
					await new Promise((resolve) => setTimeout(resolve, 150));
				}

				// Stop if no more users
				if (!result.hasMore) break;
			}

			// Update final cache info
			await loadCacheInfo();

			setSyncStatus({
				isSyncing: false,
				phase: 'complete',
				message: `✓ Sync complete: ${syncedCount.toLocaleString()} users`,
				pingOneTotal,
				indexedDBTotal: syncedCount,
			});
		} catch (error) {
			console.error('Sync error:', error);
			setSyncStatus({
				isSyncing: false,
				phase: 'idle',
				message: `❌ Sync failed: ${error.message}`,
			});
		}
	};

	// Auto-load cache info on mount
	useEffect(() => {
		loadCacheInfo();
		const interval = setInterval(loadCacheInfo, 2000); // Poll every 2s during fetch
		return () => clearInterval(interval);
	}, [loadCacheInfo]);

	// Auto-start prefetch DISABLED - users should be loaded via CLI tool only
	// useEffect(() => {
	// 	if (autoStart && cacheInfo && cacheInfo.totalUsers === 0 && !cacheInfo.fetchInProgress) {
	// 		startPrefetch();
	// 	}
	// }, [autoStart, cacheInfo?.totalUsers, cacheInfo?.fetchInProgress]);

	if (!cacheInfo && !compact) {
		return (
			<div style={{ padding: '8px', fontSize: '12px', color: '#666' }}>Loading cache info...</div>
		);
	}

	if (compact) {
		// Compact view - single line with icon
		if (!cacheInfo || cacheInfo.totalUsers === 0) {
			return <div style={{ fontSize: '12px', color: '#666' }}>⚪ No users cached</div>;
		}

		if (cacheInfo.fetchInProgress) {
			const progress =
				cacheInfo.totalPages > 0
					? Math.round((cacheInfo.currentPage / cacheInfo.totalPages) * 100)
					: 0;

			return (
				<div style={{ fontSize: '12px', color: '#3b82f6' }}>
					🔄 Caching users... {cacheInfo.fetchedCount} ({progress}%)
				</div>
			);
		}

		return (
			<div style={{ fontSize: '12px', color: '#10b981' }}>
				✓ {cacheInfo.totalUsers.toLocaleString()} users cached
			</div>
		);
	}

	// Full view with controls
	const progress =
		cacheInfo?.totalPages && cacheInfo.totalPages > 0
			? Math.round((cacheInfo.currentPage / cacheInfo.totalPages) * 100)
			: 0;

	const lastFetchedAgo = cacheInfo?.lastFetchedAt
		? Math.floor((Date.now() - cacheInfo.lastFetchedAt) / 1000 / 60)
		: null;

	return (
		<div
			style={{
				padding: '12px',
				background: '#f9fafb',
				border: '1px solid #e5e7eb',
				borderRadius: '6px',
				fontSize: '13px',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '8px',
				}}
			>
				<div style={{ fontWeight: 600, color: '#111827' }}>👥 User Cache</div>
				<button
					type="button"
					onClick={handleSmartSync}
					disabled={syncStatus.isSyncing}
					style={{
						padding: '6px 12px',
						fontSize: '12px',
						background: syncStatus.isSyncing ? '#9ca3af' : '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: syncStatus.isSyncing ? 'not-allowed' : 'pointer',
						fontWeight: 500,
					}}
				>
					{syncStatus.isSyncing ? '⏳ Syncing...' : '🔄 Smart Sync'}
				</button>
			</div>

			{/* Sync Status */}
			{syncStatus.phase !== 'idle' && (
				<div
					style={{
						marginBottom: '8px',
						padding: '8px',
						background: syncStatus.phase === 'complete' ? '#f0fdf4' : '#eff6ff',
						borderRadius: '4px',
						fontSize: '12px',
					}}
				>
					<div style={{ color: '#374151', marginBottom: '4px' }}>{syncStatus.message}</div>
					{syncStatus.progress !== undefined && (
						<div
							style={{
								width: '100%',
								height: '4px',
								background: '#e5e7eb',
								borderRadius: '2px',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									width: `${syncStatus.progress}%`,
									height: '100%',
									background: '#3b82f6',
									transition: 'width 0.3s ease',
								}}
							/>
						</div>
					)}
					{syncStatus.pingOneTotal !== undefined && syncStatus.indexedDBTotal !== undefined && (
						<div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
							PingOne: {syncStatus.pingOneTotal.toLocaleString()} | IndexedDB:{' '}
							{syncStatus.indexedDBTotal.toLocaleString()}
						</div>
					)}
				</div>
			)}

			{/* Status */}
			<div style={{ marginBottom: '8px' }}>
				{cacheInfo?.fetchInProgress ? (
					<div style={{ color: '#3b82f6' }}>
						🔄 Fetching users... Page {cacheInfo.currentPage}/{cacheInfo.totalPages}
					</div>
				) : cacheInfo?.fetchComplete ? (
					<div style={{ color: '#10b981' }}>
						✓ {cacheInfo.totalUsers.toLocaleString()} users in IndexedDB
					</div>
				) : cacheInfo?.totalUsers ? (
					<div style={{ color: '#f59e0b' }}>
						⚠️ {cacheInfo.totalUsers.toLocaleString()} users in IndexedDB (partial)
					</div>
				) : (
					<div style={{ color: '#6b7280' }}>⚪ No users in IndexedDB cache</div>
				)}
			</div>

			{/* Progress bar */}
			{cacheInfo?.fetchInProgress && (
				<div
					style={{
						width: '100%',
						height: '6px',
						background: '#e5e7eb',
						borderRadius: '3px',
						overflow: 'hidden',
						marginBottom: '8px',
					}}
				>
					<div
						style={{
							width: `${progress}%`,
							height: '100%',
							background: '#3b82f6',
							transition: 'width 0.3s ease',
						}}
					/>
				</div>
			)}

			{/* Details */}
			{cacheInfo && (
				<div style={{ fontSize: '11px', color: '#6b7280' }}>
					{cacheInfo.totalUsers > 0 && (
						<div>
							<strong>Cached Users:</strong> {cacheInfo.totalUsers.toLocaleString()} exact count
							from IndexedDB
						</div>
					)}
					{cacheInfo.fetchedCount > 0 && cacheInfo.fetchedCount !== cacheInfo.totalUsers && (
						<div>Fetched in session: {cacheInfo.fetchedCount.toLocaleString()} users</div>
					)}
					{lastFetchedAgo !== null && lastFetchedAgo > 0 && (
						<div>Last updated: {lastFetchedAgo}m ago</div>
					)}
				</div>
			)}
		</div>
	);
};

export default UserCacheProgressV8;
