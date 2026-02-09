/**
 * @file sqliteBackupServiceV8.ts
 * @module v8/services
 * @description SQLite server-side backup for credentials, config, and flow state
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Purpose: Backup browser storage (localStorage + IndexedDB) to server-side SQLite
 *
 * Benefits:
 * - Survives browser cache clear
 * - Shared across devices
 * - Persistent server-side storage
 * - Automatic sync on save operations
 *
 * Architecture:
 * - Dual storage: Browser (IndexedDB/localStorage) + Server (SQLite)
 * - Automatic backup on write
 * - Restore from SQLite if browser storage lost
 */

const MODULE_TAG = '[💾 SQLITE-BACKUP-V8]';

export interface SQLiteBackupData {
	key: string;
	environmentId: string;
	dataType: 'credentials' | 'pkce' | 'flowState' | 'config';
	data: unknown;
	savedAt: number;
	expiresAt?: number;
}

export interface SQLiteBackupOptions {
	/** Skip server backup (browser-only) */
	skipServerBackup?: boolean;
	/** TTL in seconds (default: 24 hours) */
	ttl?: number;
}

/**
 * SQLite Backup Service
 *
 * Provides server-side backup for browser storage data.
 * Works alongside existing browser storage (localStorage, IndexedDB).
 */
export class SQLiteBackupServiceV8 {
	private static readonly API_BASE = '/api/backup';
	private static readonly DEFAULT_TTL = 86400; // 24 hours

	/**
	 * Save data to SQLite backup (server-side)
	 *
	 * @param key - Unique key for this data
	 * @param environmentId - PingOne environment ID
	 * @param dataType - Type of data being backed up
	 * @param data - The data to backup
	 * @param options - Backup options
	 */
	static async save(
		key: string,
		environmentId: string,
		dataType: 'credentials' | 'pkce' | 'flowState' | 'config',
		data: unknown,
		options: SQLiteBackupOptions = {}
	): Promise<boolean> {
		if (options.skipServerBackup) {
			console.log(`${MODULE_TAG} Server backup skipped for ${key}`);
			return true;
		}

		try {
			const ttl = options.ttl || SQLiteBackupServiceV8.DEFAULT_TTL;
			const expiresAt = Date.now() + ttl * 1000;

			const backupData: SQLiteBackupData = {
				key,
				environmentId,
				dataType,
				data,
				savedAt: Date.now(),
				expiresAt,
			};

			const response = await fetch(`${SQLiteBackupServiceV8.API_BASE}/save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(backupData),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new Error(error.error || `HTTP ${response.status}`);
			}

			console.log(`${MODULE_TAG} ✅ Backed up ${dataType} to SQLite:`, key);
			return true;
		} catch (error: any) {
			console.error(`${MODULE_TAG} ❌ Failed to backup to SQLite:`, error.message);
			// Don't throw - backup failure shouldn't break the app
			return false;
		}
	}

	/**
	 * Load data from SQLite backup
	 *
	 * @param key - Unique key for this data
	 * @param environmentId - PingOne environment ID
	 * @returns The backed up data, or null if not found/expired
	 */
	static async load<T = unknown>(key: string, environmentId: string): Promise<T | null> {
		try {
			const response = await fetch(`${SQLiteBackupServiceV8.API_BASE}/load`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ key, environmentId }),
			});

			if (!response.ok) {
				if (response.status === 404) {
					console.log(`${MODULE_TAG} No backup found for ${key}`);
					return null;
				}
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();

			if (result.expired) {
				console.log(`${MODULE_TAG} Backup expired for ${key}`);
				return null;
			}

			console.log(`${MODULE_TAG} ✅ Restored from SQLite:`, key);
			return result.data as T;
		} catch (error: any) {
			console.error(`${MODULE_TAG} Failed to load from SQLite:`, error.message);
			return null;
		}
	}

	/**
	 * Delete backup from SQLite
	 */
	static async delete(key: string, environmentId: string): Promise<boolean> {
		try {
			const response = await fetch(`${SQLiteBackupServiceV8.API_BASE}/delete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ key, environmentId }),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			console.log(`${MODULE_TAG} ✅ Deleted backup:`, key);
			return true;
		} catch (error: any) {
			console.error(`${MODULE_TAG} Failed to delete backup:`, error.message);
			return false;
		}
	}

	/**
	 * Clear all backups for an environment
	 */
	static async clearEnvironment(environmentId: string): Promise<boolean> {
		try {
			const response = await fetch(`${SQLiteBackupServiceV8.API_BASE}/clear-environment`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ environmentId }),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			console.log(`${MODULE_TAG} ✅ Cleared all backups for environment:`, environmentId);
			return true;
		} catch (error: any) {
			console.error(`${MODULE_TAG} Failed to clear environment:`, error.message);
			return false;
		}
	}

	/**
	 * List all backups for an environment
	 */
	static async listBackups(environmentId: string, dataType?: string): Promise<SQLiteBackupData[]> {
		try {
			const response = await fetch(`${SQLiteBackupServiceV8.API_BASE}/list`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ environmentId, dataType }),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();
			return result.backups || [];
		} catch (error: any) {
			console.error(`${MODULE_TAG} Failed to list backups:`, error.message);
			return [];
		}
	}
}

export default SQLiteBackupServiceV8;
