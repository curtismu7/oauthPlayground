/**
 * @file UserCacheSyncUtilityV8.tsx
 * @module v8/pages
 * @description Utility to manage user cache stored in SQLite database (server-side)
 * @version 9.0.0
 * @since 2026-02-01
 *
 * Features:
 * - View users stored in SQLite database (server-side)
 * - SQLite cache statistics and management
 * - Server-side user storage (no client IndexedDB)
 * - Export cache data to JSON
 *
 * Note: Users are now stored in SQLite on the server, not IndexedDB in the browser.
 * Use the CLI tool to sync users from PingOne to SQLite.
 */

import React, { useEffect, useState } from 'react';
import { FiDatabase, FiDownload, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import WorkerTokenStatusDisplayV8 from '@/v8/components/WorkerTokenStatusDisplayV8';
import { useSQLiteStats } from '@/v8/hooks/useSQLiteStats';
import { useWorkerTokenConfig } from '@/v8/hooks/useWorkerTokenConfig';
import { globalEnvironmentService } from '@/v8/services/globalEnvironmentService';
import { StorageServiceV8 } from '@/v8/services/storageServiceV8';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { UserCacheServiceV8 } from '@/v8/services/userCacheServiceV8';
import { WorkerTokenConfigServiceV8 } from '@/v8/services/workerTokenConfigServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[💾 USER-CACHE-SYNC]';

const PAGE_STORAGE_KEY = 'v8:user-cache-sync';

interface UserCacheSyncState {
	environmentId: string;
}

export const UserCacheSyncUtilityV8: React.FC = () => {
	const [environmentId, setEnvironmentId] = useState(() => {
		try {
			globalEnvironmentService.initialize();
			const globalEnvId = globalEnvironmentService.getEnvironmentId();
			if (globalEnvId) return globalEnvId;

			const stored = StorageServiceV8.load<UserCacheSyncState>(PAGE_STORAGE_KEY);
			return stored?.environmentId || '';
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load saved environment ID`, error);
			return '';
		}
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<any>({
		isValid: false,
		minutesRemaining: 0,
	});

	// Use centralized worker token configuration service
	const { silentApiRetrieval, showTokenAtEnd } = useWorkerTokenConfig();

	const [isSyncing, setIsSyncing] = useState(false);
	const [syncProgress, setSyncProgress] = useState<{
		currentPage: number;
		totalPages: number;
		fetchedCount: number;
		percentage: number;
	} | null>(null);

	const [cacheInfo, setCacheInfo] = useState<{
		totalUsers: number;
		lastFetched: Date | null;
		environmentId: string;
	} | null>(null);

	const [maxPages, setMaxPages] = useState(100); // Default: 20,000 users max
	const [abortController, setAbortController] = useState<AbortController | null>(null);

	// SQLite stats from server
	const {
		stats: sqliteStats,
		metadata: sqliteMetadata,
		isLoading: sqliteLoading,
		refresh: refreshSQLiteStats,
	} = useSQLiteStats({
		environmentId,
		refreshInterval: 30,
		enabled: !!environmentId,
	});

	// CLI cache detection (legacy IndexedDB import)
	const [cliCacheAvailable, setCliCacheAvailable] = useState(false);
	const [cliCacheInfo, setCliCacheInfo] = useState<{
		totalUsers: number;
		lastFetched: Date | null;
	} | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [_cliImportedCount, setCliImportedCount] = useState<number | null>(null);

	// Update token status periodically
	useEffect(() => {
		const updateTokenStatus = async () => {
			try {
				const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(status);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to check token status`, error);
				setTokenStatus({ isValid: false, minutesRemaining: 0 });
			}
		};

		updateTokenStatus();
		const interval = setInterval(updateTokenStatus, 30000); // Check every 30s

		return () => clearInterval(interval);
	}, []);

	// Check if CLI cache file exists
	const checkCliCache = async () => {
		if (!environmentId) {
			setCliCacheAvailable(false);
			setCliCacheInfo(null);
			return;
		}

		try {
			const response = await fetch(`/api/cli-cache/${environmentId}`);
			if (response.ok) {
				const data = await response.json();
				setCliCacheAvailable(true);
				setCliCacheInfo({
					totalUsers: data.totalUsers || 0,
					lastFetched: data.lastFetchedAt ? new Date(data.lastFetchedAt) : null,
				});
				console.log(`${MODULE_TAG} CLI cache available with ${data.totalUsers} users`);
			} else {
				setCliCacheAvailable(false);
				setCliCacheInfo(null);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to check CLI cache`, error);
			setCliCacheAvailable(false);
			setCliCacheInfo(null);
		}
	};

	const loadCacheInfo = async () => {
		if (!environmentId) {
			setCacheInfo(null);
			return;
		}

		try {
			const metadata = await UserCacheServiceV8.getCacheInfo(environmentId);
			if (metadata) {
				setCacheInfo({
					totalUsers: metadata.totalUsers,
					lastFetched: metadata.lastFetched ? new Date(metadata.lastFetched) : null,
					environmentId: metadata.environmentId,
				});
			} else {
				setCacheInfo(null);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load cache info`, error);
			setCacheInfo(null);
		}
	};

	// Load cache info on mount
	useEffect(() => {
		loadCacheInfo();
		checkCliCache();
	}, [environmentId]); // Remove function dependencies, only use environmentId

	// Save environment ID to storage
	useEffect(() => {
		if (environmentId) {
			try {
				StorageServiceV8.save(PAGE_STORAGE_KEY, { environmentId });
				globalEnvironmentService.setEnvironmentId(environmentId);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to save state`, error);
			}
		}
	}, [environmentId]);

	const handleStartSync = async () => {
		if (!environmentId || !tokenStatus.isValid) {
			toastV8.error('Environment ID and valid worker token required');
			return;
		}

		setIsSyncing(true);
		setSyncProgress({ currentPage: 0, totalPages: 0, fetchedCount: 0, percentage: 0 });

		const controller = new AbortController();
		setAbortController(controller);

		try {
			console.log(`${MODULE_TAG} Starting user sync for environment: ${environmentId}`);

			const { UserServiceV8 } = await import('@/v8/services/userServiceV8');
			await UserServiceV8.prefetchUsers(environmentId, {
				initialPages: 0, // Start background immediately
				maxPages,
				delayMs: 100,
				signal: controller.signal,
				onProgress: (progress) => {
					const percentage = Math.round((progress.currentPage / progress.totalPages) * 100);

					setSyncProgress({
						currentPage: progress.currentPage,
						totalPages: progress.totalPages,
						fetchedCount: progress.fetchedCount,
						percentage,
					});

					if (progress.currentPage % 10 === 0 || progress.currentPage <= 5) {
						console.log(
							`${MODULE_TAG} Progress: page ${progress.currentPage}/${progress.totalPages}, ${progress.fetchedCount} users`
						);
					}
				},
			});

			toastV8.success(`Successfully synced ${syncProgress?.fetchedCount || 0} users to cache`);
			await loadCacheInfo();
		} catch (error: any) {
			if (error?.name === 'AbortError') {
				toastV8.info('Sync cancelled');
			} else {
				console.error(`${MODULE_TAG} Sync failed:`, error);
				toastV8.error(`Sync failed: ${error.message || 'Unknown error'}`);
			}
		} finally {
			setIsSyncing(false);
			setSyncProgress(null);
			setAbortController(null);
		}
	};

	const handleStopSync = () => {
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
	};

	const handleClearCache = async () => {
		if (!environmentId) {
			toastV8.error('Environment ID required');
			return;
		}

		const confirmed = await uiNotificationServiceV8.confirm({
			message: `Clear cache for environment ${environmentId}?\n\nThis will remove all ${cacheInfo?.totalUsers || 0} cached users.`,
			confirmText: 'Clear Cache',
			cancelText: 'Cancel',
			severity: 'warning',
		});

		if (!confirmed) {
			return;
		}

		try {
			await UserCacheServiceV8.clearCache(environmentId);
			toastV8.success('Cache cleared successfully');
			await loadCacheInfo();
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear cache`, error);
			toastV8.error('Failed to clear cache');
		}
	};

	const handleExportCache = async () => {
		if (!environmentId) {
			toastV8.error('Environment ID required');
			return;
		}

		try {
			const users = await UserCacheServiceV8.loadUsers(environmentId);
			if (!users || users.length === 0) {
				toastV8.warning('No users in cache to export');
				return;
			}

			const data = {
				environmentId,
				exportDate: new Date().toISOString(),
				totalUsers: users.length,
				users,
			};

			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `pingone-users-${environmentId}-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toastV8.success(`Exported ${users.length} users`);
		} catch (error) {
			console.error(`${MODULE_TAG} Export failed:`, error);
			toastV8.error('Failed to export cache');
		}
	};

	const handleImportFromCli = async () => {
		if (!environmentId) {
			toastV8.error('Environment ID required');
			return;
		}

		if (!cliCacheAvailable) {
			toastV8.error('No CLI cache file found');
			return;
		}

		const totalUsers = cliCacheInfo?.totalUsers || 0;
		const confirmed = await uiNotificationServiceV8.confirm({
			message: `Import ${totalUsers.toLocaleString()} users from CLI cache into IndexedDB?\n\nThis will replace any existing cached users.`,
			confirmText: 'Import',
			cancelText: 'Cancel',
			severity: 'info',
		});

		if (!confirmed) {
			return;
		}

		setIsImporting(true);
		try {
			console.log(`${MODULE_TAG} Importing CLI cache for environment: ${environmentId}`);

			const response = await fetch(`/api/cli-cache/${environmentId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch CLI cache');
			}

			const data = await response.json();
			const users = data.users || [];

			console.log(`${MODULE_TAG} Importing ${users.length} users into IndexedDB`);

			// Clear existing cache first
			await UserCacheServiceV8.clearCache(environmentId);

			// Prepare live import counter and update frequency
			setCliImportedCount(0);
			const totalUsers = users.length;
			const updateInterval = totalUsers <= 500 ? 10 : 100;
			const batchSize = 1000;

			// Save users in batches, and within each batch save in sub-batches to provide frequent UI updates
			for (let i = 0; i < users.length; i += batchSize) {
				const batch = users.slice(i, i + batchSize);
				for (let j = 0; j < batch.length; j += updateInterval) {
					const sub = batch.slice(j, j + updateInterval);
					const isLast = i + j + sub.length >= users.length;
					await UserCacheServiceV8.saveUsers(environmentId, sub, isLast);
					const importedSoFar = Math.min(i + j + sub.length, users.length);
					// Update live counter every interval and always on final chunk
					if (importedSoFar % updateInterval === 0 || isLast) {
						setCliImportedCount(importedSoFar);
					}
				}
				console.log(
					`${MODULE_TAG} Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`
				);
			}

			toastV8.success(
				`Successfully imported ${users.length.toLocaleString()} users from CLI cache`
			);
			// Ensure final count recorded
			setCliImportedCount(users.length);
			await loadCacheInfo();
			await checkCliCache();
		} catch (error: any) {
			console.error(`${MODULE_TAG} Import failed:`, error);
			toastV8.error(`Import failed: ${error.message || 'Unknown error'}`);
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
			{/* Header */}
			<div style={{ marginBottom: '32px' }}>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
					💾 User Cache Management (SQLite)
				</h1>
				<p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
					View and manage users stored in SQLite database (server-side)
				</p>
				<p
					style={{
						margin: '8px 0 0 0',
						padding: '12px',
						background: '#fef3c7',
						border: '1px solid #fbbf24',
						borderRadius: '6px',
						fontSize: '14px',
						color: '#92400e',
					}}
				>
					<strong>ℹ️ Note:</strong> Users are now stored in SQLite on the server. Use the CLI tool to
					sync from PingOne to SQLite.
				</p>
			</div>

			{/* Configuration Section */}
			<div
				style={{
					background: 'white',
					border: '1px solid #e5e7eb',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '24px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				}}
			>
				<h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
					Configuration
				</h2>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
					{/* Environment ID */}
					<div>
						<label
							htmlFor="environment-id"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Environment ID *
						</label>
						<input
							id="environment-id"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="Enter PingOne environment ID"
							style={{
								width: '100%',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								fontFamily: 'monospace',
							}}
						/>
					</div>

					{/* Max Pages */}
					<div>
						<label
							htmlFor="max-pages"
							style={{
								display: 'block',
								marginBottom: '8px',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Max Pages (200 users per page)
						</label>
						<input
							id="max-pages"
							type="number"
							value={maxPages}
							onChange={(e) => setMaxPages(Math.max(1, parseInt(e.target.value, 10) || 100))}
							min="1"
							max="500"
							style={{
								width: '200px',
								padding: '10px 12px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						/>
						<span style={{ marginLeft: '12px', fontSize: '13px', color: '#6b7280' }}>
							= {(maxPages * 200).toLocaleString()} users max
						</span>
					</div>

					{/* Worker Token */}
					<div>
						<button
							onClick={async () => {
								const { handleShowWorkerTokenModalSimple } = await import(
									'@/v8/utils/workerTokenModalHelperV8_SIMPLE'
								);
								await handleShowWorkerTokenModalSimple(
									setShowWorkerTokenModal,
									true // forceShowModal=true: user clicked the button
								);
							}}
							style={{
								padding: '8px 16px',
								backgroundColor: tokenStatus.isValid ? '#28a745' : '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								marginBottom: '16px',
							}}
						>
							Get Worker Token
						</button>

						<WorkerTokenStatusDisplayV8
							mode="compact"
							showRefresh={true}
							refreshInterval={30}
							showConfig={false}
						/>
					</div>
				</div>
			</div>

			{/* SQLite Database Statistics (Primary) */}
			{environmentId && (
				<div
					style={{
						background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
						border: '2px solid #10b981',
						borderRadius: '12px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '12px',
						}}
					>
						<h3
							style={{
								margin: 0,
								fontSize: '18px',
								fontWeight: '700',
								color: '#065f46',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<FiDatabase size={20} />
							SQLite Database (Server-Side)
						</h3>
						<button
							onClick={refreshSQLiteStats}
							disabled={sqliteLoading}
							style={{
								padding: '6px 12px',
								fontSize: '12px',
								background: sqliteLoading ? '#9ca3af' : '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: sqliteLoading ? 'not-allowed' : 'pointer',
								fontWeight: 500,
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
							}}
						>
							<FiRefreshCw size={14} />
							Refresh
						</button>
					</div>

					<p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#047857' }}>
						✅ Users are stored in server-side SQLite database and fetched via API endpoints
					</p>

					{sqliteLoading && !sqliteStats ? (
						<div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
							Loading statistics...
						</div>
					) : sqliteStats?.success ? (
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '16px',
								fontSize: '14px',
							}}
						>
							<div
								style={{
									padding: '16px',
									background: 'white',
									borderRadius: '8px',
									boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
								}}
							>
								<div
									style={{
										fontSize: '11px',
										color: '#6b7280',
										marginBottom: '4px',
										fontWeight: 600,
									}}
								>
									TOTAL USERS
								</div>
								<div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
									{sqliteStats.totalUsers.toLocaleString()}
								</div>
							</div>
							<div
								style={{
									padding: '16px',
									background: 'white',
									borderRadius: '8px',
									boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
								}}
							>
								<div
									style={{
										fontSize: '11px',
										color: '#6b7280',
										marginBottom: '4px',
										fontWeight: 600,
									}}
								>
									LAST SYNCED
								</div>
								<div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
									{sqliteMetadata?.lastSyncedAt
										? new Date(sqliteMetadata.lastSyncedAt).toLocaleString()
										: 'Never'}
								</div>
							</div>
							<div
								style={{
									gridColumn: '1 / -1',
									padding: '12px',
									background: 'rgba(16, 185, 129, 0.1)',
									borderRadius: '6px',
								}}
							>
								<div
									style={{
										fontSize: '12px',
										fontWeight: 600,
										color: '#065f46',
										marginBottom: '6px',
									}}
								>
									📝 To sync users from PingOne to SQLite:
								</div>
								<pre
									style={{
										margin: 0,
										padding: '10px',
										background: 'white',
										borderRadius: '4px',
										fontSize: '11px',
										fontFamily: 'monospace',
										overflowX: 'auto',
										border: '1px solid #10b981',
									}}
								>
									{`npm run db:seed-users -- \\
  --envId ${environmentId || 'YOUR_ENV_ID'} \\
  --clientId YOUR_CLIENT_ID \\
  --clientSecret YOUR_SECRET`}
								</pre>
							</div>
						</div>
					) : (
						<div
							style={{
								padding: '16px',
								background: '#fef2f2',
								borderRadius: '8px',
								color: '#991b1b',
							}}
						>
							❌ Failed to load SQLite statistics
							{sqliteStats?.error && (
								<div style={{ fontSize: '12px', marginTop: '4px' }}>{sqliteStats.error}</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* IndexedDB Cache Statistics (Legacy - Deprecated) */}
			{cacheInfo && (
				<div
					style={{
						background: '#fef3c7',
						border: '1px solid #fbbf24',
						borderRadius: '12px',
						padding: '20px',
						marginBottom: '24px',
						opacity: 0.8,
					}}
				>
					<h3
						style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#92400e' }}
					>
						⚠️ Legacy IndexedDB Cache (Deprecated)
					</h3>
					<p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#92400e' }}>
						Old browser IndexedDB storage - Use SQLite database above instead
					</p>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '12px',
							fontSize: '14px',
						}}
					>
						<div>
							<span style={{ color: '#6b7280' }}>Total Users (IndexedDB - Legacy):</span>
							<strong style={{ marginLeft: '8px', color: '#1f2937' }}>
								{cacheInfo.totalUsers.toLocaleString()}
							</strong>
						</div>
						<div>
							<span style={{ color: '#6b7280' }}>Environment:</span>
							<strong
								style={{
									marginLeft: '8px',
									color: '#1f2937',
									fontFamily: 'monospace',
									fontSize: '12px',
								}}
							>
								{cacheInfo.environmentId.slice(0, 24)}...
							</strong>
						</div>
						<div style={{ gridColumn: '1 / -1' }}>
							<span style={{ color: '#6b7280' }}>Last Synced:</span>
							<strong style={{ marginLeft: '8px', color: '#1f2937' }}>
								{cacheInfo.lastFetched ? new Date(cacheInfo.lastFetched).toLocaleString() : 'Never'}
							</strong>
						</div>

						{/* SQLite cache status */}
						{cliCacheInfo && (
							<div style={{ gridColumn: '1 / -1' }}>
								<span style={{ color: '#6b7280' }}>SQLite Database (Server):</span>
								<strong style={{ marginLeft: '8px', color: '#10b981' }}>
									{cliCacheInfo.totalUsers.toLocaleString()} users
								</strong>
								<span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
									(synced{' '}
									{cliCacheInfo.lastFetched
										? new Date(cliCacheInfo.lastFetched).toLocaleString()
										: 'unknown'}
									)
								</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Worker Token Configuration Checkboxes (moved below Cache Statistics) */}
			{(typeof silentApiRetrieval !== 'undefined' || typeof showTokenAtEnd !== 'undefined') && (
				<div
					style={{
						padding: '12px',
						background: '#fafafa',
						border: '1px solid #e6eef6',
						borderRadius: '8px',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
							<input
								type="checkbox"
								checked={silentApiRetrieval}
								onChange={(e) => {
									const newValue = e.target.checked;
									WorkerTokenConfigServiceV8.setSilentApiRetrieval(newValue);
									toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);
								}}
								style={{ width: '16px', height: '16px', marginTop: '4px', cursor: 'pointer' }}
							/>
							<div>
								<div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
									Silent API Token Retrieval
								</div>
								<div style={{ fontSize: '11px', color: '#6b7280' }}>
									Automatically fetch worker token in background without showing modals
								</div>
							</div>
						</div>

						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
							<input
								type="checkbox"
								checked={showTokenAtEnd}
								onChange={(e) => {
									const newValue = e.target.checked;
									WorkerTokenConfigServiceV8.setShowTokenAtEnd(newValue);
									toastV8.info(`Show Token After Generation set to: ${newValue}`);
								}}
								style={{ width: '16px', height: '16px', marginTop: '4px', cursor: 'pointer' }}
							/>
							<div>
								<div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
									Show Token After Generation
								</div>
								<div style={{ fontSize: '11px', color: '#6b7280' }}>
									Display generated worker token in modal after successful retrieval
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Sync Progress */}
			{syncProgress && (
				<div
					style={{
						background: 'white',
						border: '1px solid #e5e7eb',
						borderRadius: '12px',
						padding: '20px',
						marginBottom: '24px',
					}}
				>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '12px',
						}}
					>
						<h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
							Syncing Users...
						</h3>
						<span style={{ fontSize: '14px', color: '#6b7280' }}>{syncProgress.percentage}%</span>
					</div>
					<div
						style={{
							width: '100%',
							height: '8px',
							background: '#e5e7eb',
							borderRadius: '4px',
							overflow: 'hidden',
							marginBottom: '12px',
						}}
					>
						<div
							style={{
								width: `${syncProgress.percentage}%`,
								height: '100%',
								background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
								transition: 'width 0.3s ease',
							}}
						/>
					</div>
					<div style={{ fontSize: '13px', color: '#6b7280' }}>
						Page {syncProgress.currentPage} of {syncProgress.totalPages} •{' '}
						{(syncProgress.fetchedCount || 0).toLocaleString()} users fetched
					</div>
				</div>
			)}

			{/* Actions */}
			<div
				style={{
					background: 'white',
					border: '1px solid #e5e7eb',
					borderRadius: '12px',
					padding: '24px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				}}
			>
				<h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
					Actions
				</h2>

				{/* CLI Cache Import Banner */}
				{cliCacheAvailable && cliCacheInfo && (
					<div
						style={{
							background: 'linear-gradient(135deg, #10b981, #059669)',
							color: 'white',
							padding: '16px',
							borderRadius: '8px',
							marginBottom: '20px',
							boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
							<FiDatabase size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
							<div style={{ flex: 1 }}>
								<h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
									✅ SQLite Database Active
								</h3>
								<p style={{ margin: '0 0 8px 0', fontSize: '13px', opacity: 0.9 }}>
									Users stored in server-side SQLite database
								</p>
								<p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.95 }}>
									{cliCacheInfo.totalUsers.toLocaleString()} users available via API{' '}
									{cliCacheInfo.lastFetched &&
										`• Last synced: ${new Date(cliCacheInfo.lastFetched).toLocaleString()}`}
								</p>
								<div
									style={{
										padding: '12px',
										background: 'rgba(255,255,255,0.2)',
										borderRadius: '6px',
										fontSize: '13px',
									}}
								>
									<strong>📝 To sync users from PingOne to SQLite:</strong>
									<pre
										style={{
											margin: '8px 0 0 0',
											padding: '8px',
											background: 'rgba(0,0,0,0.1)',
											borderRadius: '4px',
											fontSize: '12px',
											fontFamily: 'monospace',
											whiteSpace: 'pre-wrap',
										}}
									>
										{`npm run db:seed-users -- \\
  --envId YOUR_ENV_ID \\
  --clientId YOUR_CLIENT_ID \\
  --clientSecret YOUR_SECRET`}
									</pre>
								</div>
								<button
									onClick={handleImportFromCli}
									disabled={isImporting}
									style={{
										padding: '12px 24px',
										background: 'white',
										color: '#059669',
										border: '2px solid #10b981',
										borderRadius: '8px',
										cursor: isImporting ? 'wait' : 'pointer',
										fontSize: '14px',
										fontWeight: '600',
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										opacity: isImporting ? 0.7 : 1,
										boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
										transition: 'all 0.2s ease',
										marginTop: '12px',
									}}
								>
									<FiDownload size={16} />
									{isImporting
										? 'Importing to IndexedDB (Legacy)...'
										: `Legacy: Import to IndexedDB`}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Legacy IndexedDB Import Status */}
				{isImporting && (
					<div
						style={{
							background: '#fef3c7',
							border: '2px solid #fbbf24',
							borderRadius: '8px',
							padding: '16px',
							marginBottom: '20px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<div
								style={{
									width: '24px',
									height: '24px',
									border: '3px solid #f59e0b',
									borderTopColor: 'transparent',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}}
							/>
							<div>
								<h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
									Importing to Legacy IndexedDB
								</h3>
								<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#92400e' }}>
									Note: IndexedDB is deprecated. Users are fetched from SQLite via API.
								</p>
							</div>
						</div>
					</div>
				)}

				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
					{/* Start Sync */}
					{!isSyncing ? (
						<button
							onClick={handleStartSync}
							disabled={!environmentId || !tokenStatus.isValid}
							style={{
								padding: '12px 24px',
								background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								cursor: environmentId && tokenStatus.isValid ? 'pointer' : 'not-allowed',
								fontSize: '15px',
								fontWeight: '600',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								opacity: !environmentId || !tokenStatus.isValid ? 0.5 : 1,
							}}
						>
							<FiRefreshCw size={18} />
							Start Sync
						</button>
					) : (
						<button
							onClick={handleStopSync}
							style={{
								padding: '12px 24px',
								background: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '15px',
								fontWeight: '600',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<FiX size={18} />
							Stop Sync
						</button>
					)}

					{/* Export Cache */}
					<button
						onClick={handleExportCache}
						disabled={!cacheInfo || cacheInfo.totalUsers === 0}
						style={{
							padding: '12px 24px',
							background: cacheInfo && cacheInfo.totalUsers > 0 ? '#10b981' : '#9ca3af',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							cursor: cacheInfo && cacheInfo.totalUsers > 0 ? 'pointer' : 'not-allowed',
							fontSize: '15px',
							fontWeight: '600',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiDownload size={18} />
						Export to JSON
					</button>

					{/* Clear Cache */}
					<button
						onClick={handleClearCache}
						disabled={!cacheInfo || cacheInfo.totalUsers === 0}
						style={{
							padding: '12px 24px',
							background: cacheInfo && cacheInfo.totalUsers > 0 ? '#f59e0b' : '#9ca3af',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							cursor: cacheInfo && cacheInfo.totalUsers > 0 ? 'pointer' : 'not-allowed',
							fontSize: '15px',
							fontWeight: '600',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiTrash2 size={18} />
						Clear Cache
					</button>
				</div>

				{/* Help Text */}
				<div
					style={{
						marginTop: '24px',
						padding: '16px',
						background: '#f9fafb',
						borderRadius: '8px',
						fontSize: '13px',
						color: '#6b7280',
						lineHeight: '1.6',
					}}
				>
					<strong style={{ color: '#374151', display: 'block', marginBottom: '8px' }}>
						💡 How it works (SQLite):
					</strong>
					<ul style={{ margin: 0, paddingLeft: '20px' }}>
						<li>
							<strong>Users are stored in SQLite database</strong> on the server (not browser
							IndexedDB)
						</li>
						<li>
							Use CLI tool to sync users from PingOne to SQLite:{' '}
							<code
								style={{
									background: '#e5e7eb',
									padding: '2px 6px',
									borderRadius: '3px',
									fontSize: '12px',
								}}
							>
								npm run db:seed-users
							</code>
						</li>
						<li>
							API endpoints fetch users from SQLite:{' '}
							<code
								style={{
									background: '#e5e7eb',
									padding: '2px 6px',
									borderRadius: '3px',
									fontSize: '12px',
								}}
							>
								/api/users/search
							</code>
						</li>
						<li>Much faster than IndexedDB and shared across all clients</li>
						<li>Legacy IndexedDB sync below is deprecated but kept for backward compatibility</li>
					</ul>
				</div>
			</div>

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
					onTokenReceived={async () => {
						setShowWorkerTokenModal(false);
						const status = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
						setTokenStatus(status);
					}}
					showTokenOnly={false}
				/>
			)}
		</div>
	);
};

export default UserCacheSyncUtilityV8;
