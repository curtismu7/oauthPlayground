/**
 * @file unifiedWorkerTokenBackupServiceV8.ts
 * @module services
 * @description SQLite backup service for Unified Worker Token credentials
 * @version 8.0.0
 * @since 2026-02-15
 *
 * Extends the existing worker token service with SQLite backup integration.
 * Provides 4-layer storage: Memory → localStorage → IndexedDB → SQLite backup.
 */

import { logger } from '../v8u/services/unifiedFlowLoggerServiceV8U';
import type { UnifiedWorkerTokenCredentials } from './unifiedWorkerTokenService';

const MODULE_TAG = '[🔑 WORKER-TOKEN-BACKUP-V8]';

export interface WorkerTokenBackupData {
	version: string;
	timestamp: number;
	credentials: UnifiedWorkerTokenCredentials;
	environmentId: string;
	dataType: 'worker_token';
}

/**
 * Enhanced worker token service with SQLite backup
 */
// biome-ignore lint/complexity/noStaticOnlyClass: kept as class for API consistency with existing callers
export class UnifiedWorkerTokenBackupServiceV8 {
	private static readonly BACKUP_API_BASE = '/api/backup';
	private static readonly DEFAULT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

	/**
	 * Save worker token credentials to SQLite backup
	 */
	static async saveWorkerTokenBackup(
		credentials: UnifiedWorkerTokenCredentials,
		options?: {
			environmentId: string;
			enableBackup: boolean;
			backupExpiry?: number;
		}
	): Promise<void> {
		const {
			environmentId,
			enableBackup = true,
			backupExpiry = UnifiedWorkerTokenBackupServiceV8.DEFAULT_EXPIRY,
		} = options || {};

		try {
			// Save to localStorage (primary)
			const localStorageKey = 'unified_worker_token_v8';
			localStorage.setItem(
				localStorageKey,
				JSON.stringify({
					credentials,
					timestamp: Date.now(),
					environmentId,
				})
			);

			// Save to IndexedDB (secondary)
			try {
				const { unifiedWorkerTokenService } = await import('./unifiedWorkerTokenService');
				await unifiedWorkerTokenService.saveCredentials(credentials);
			} catch (indexedDBError) {
				logger.warn(`${MODULE_TAG} IndexedDB backup failed`, indexedDBError);
			}

			// Save to SQLite backup (server-side)
			if (enableBackup && environmentId) {
				const backupData: WorkerTokenBackupData = {
					version: '1.0.0',
					timestamp: Date.now(),
					credentials,
					environmentId,
					dataType: 'worker_token',
				};

				const expiresAt = Date.now() + backupExpiry;

				const response = await fetch(`${UnifiedWorkerTokenBackupServiceV8.BACKUP_API_BASE}/save`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						key: `worker_token_${environmentId}`,
						environmentId,
						dataType: 'worker_token',
						data: backupData,
						expiresAt,
					}),
				});

				if (!response.ok) {
					throw new Error(`Backup API error: ${response.status} ${response.statusText}`);
				}

				const result = await response.json();
				if (!result.success) {
					throw new Error(result.error || 'Backup save failed');
				}

				logger.info(`${MODULE_TAG} ✅ Saved to SQLite backup`, { environmentId });
			}
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to save worker token backup`, error);
			throw error;
		}
	}

	/**
	 * Load worker token credentials from SQLite backup
	 */
	static async loadWorkerTokenBackup(options?: {
		environmentId?: string;
		enableBackup: boolean;
	}): Promise<UnifiedWorkerTokenCredentials | null> {
		const { environmentId, enableBackup = true } = options || {};

		try {
			// Try localStorage first (primary)
			const localStorageKey = 'unified_worker_token_v8';
			const stored = localStorage.getItem(localStorageKey);

			if (stored) {
				try {
					const data = JSON.parse(stored);
					if (data.credentials && data.environmentId === environmentId) {
						logger.info(`${MODULE_TAG} ✅ Loaded from localStorage`, { environmentId });
						return data.credentials;
					}
				} catch (parseError) {
					logger.warn(`${MODULE_TAG} localStorage parse error`, parseError);
				}
			}

			// Try IndexedDB (secondary)
			try {
				const { unifiedWorkerTokenService } = await import('./unifiedWorkerTokenService');
				const credentials = await unifiedWorkerTokenService.loadCredentials();
				if (credentials) {
					logger.info(`${MODULE_TAG} ✅ Loaded from IndexedDB`);
					return credentials;
				}
			} catch (indexedDBError) {
				logger.warn(`${MODULE_TAG} IndexedDB load failed`, indexedDBError);
			}

			// Try SQLite backup (server-side)
			if (enableBackup && environmentId) {
				try {
					const response = await fetch(
						`${UnifiedWorkerTokenBackupServiceV8.BACKUP_API_BASE}/load`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								key: `worker_token_${environmentId}`,
								environmentId,
								dataType: 'worker_token',
							}),
						}
					);

					if (!response.ok) {
						if (response.status === 404) {
							logger.info(`${MODULE_TAG} No SQLite backup found`, { environmentId });
							return null;
						}
						throw new Error(`Backup API error: ${response.status} ${response.statusText}`);
					}

					const result = await response.json();
					if (result.success && result.data) {
						const backupData = result.data as WorkerTokenBackupData;

						// Validate backup data
						if (backupData.dataType === 'worker_token' && backupData.credentials) {
							// Restore to localStorage for faster future access
							try {
								localStorage.setItem(
									localStorageKey,
									JSON.stringify({
										credentials: backupData.credentials,
										timestamp: backupData.timestamp,
										environmentId: backupData.environmentId,
									})
								);
							} catch (restoreError) {
								logger.warn(`${MODULE_TAG} Failed to restore to localStorage`, restoreError);
							}

							logger.info(`${MODULE_TAG} ✅ Loaded from SQLite backup`, {
								environmentId,
								timestamp: backupData.timestamp,
							});
							return backupData.credentials;
						}
					}
				} catch (backupError) {
					logger.warn(`${MODULE_TAG} SQLite backup load failed`, backupError);
				}
			}

			logger.info(`${MODULE_TAG} No worker token credentials found`, { environmentId });
			return null;
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to load worker token backup`, error);
			return null;
		}
	}

	/**
	 * Delete worker token credentials from SQLite backup
	 */
	static async deleteWorkerTokenBackup(options?: {
		environmentId?: string;
		enableBackup: boolean;
	}): Promise<void> {
		const { environmentId, enableBackup = true } = options || {};

		try {
			// Clear localStorage
			const localStorageKey = 'unified_worker_token_v8';
			localStorage.removeItem(localStorageKey);

			// Clear IndexedDB
			try {
				const { unifiedWorkerTokenService } = await import('./unifiedWorkerTokenService');
				await unifiedWorkerTokenService.clearCredentials();
			} catch (indexedDBError) {
				logger.warn(`${MODULE_TAG} IndexedDB clear failed`, indexedDBError);
			}

			// Delete from SQLite backup
			if (enableBackup && environmentId) {
				const response = await fetch(
					`${UnifiedWorkerTokenBackupServiceV8.BACKUP_API_BASE}/delete`,
					{
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							key: `worker_token_${environmentId}`,
							environmentId,
							dataType: 'worker_token',
						}),
					}
				);

				if (!response.ok) {
					throw new Error(`Backup API error: ${response.status} ${response.statusText}`);
				}

				const result = await response.json();
				if (!result.success) {
					throw new Error(result.error || 'Backup delete failed');
				}

				logger.info(`${MODULE_TAG} ✅ Deleted from SQLite backup`, { environmentId });
			}
		} catch (error) {
			logger.error(`${MODULE_TAG} Failed to delete worker token backup`, error);
			throw error;
		}
	}
}

export default UnifiedWorkerTokenBackupServiceV8;
