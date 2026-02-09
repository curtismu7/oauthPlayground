/**
 * @file dualBackupServiceV8.ts
 * @module v8/services
 * @description Dual storage service: IndexedDB (browser) + SQLite (server)
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Automatically saves to both:
 * - IndexedDB (fast browser access)
 * - SQLite (persistent server backup)
 *
 * Benefits:
 * - Redundancy: If browser storage cleared, restore from server
 * - Cross-device: Access credentials from any device
 * - Automatic: No manual sync needed
 */

import { IndexedDBBackupServiceV8U } from '@/v8u/services/indexedDBBackupServiceV8U';
import { SQLiteBackupServiceV8 } from './sqliteBackupServiceV8';

const MODULE_TAG = '[💾 DUAL-BACKUP-V8]';

export type BackupDataType = 'credentials' | 'pkce' | 'flowState' | 'config';

export interface DualBackupOptions {
	/** Environment ID for SQLite backup */
	environmentId?: string;
	/** Skip server backup (browser-only) */
	browserOnly?: boolean;
	/** TTL in seconds for SQLite backup */
	ttl?: number;
}

/**
 * Dual Backup Service
 *
 * Saves data to both IndexedDB (browser) and SQLite (server) simultaneously.
 * Automatically falls back to server backup if browser storage fails.
 */
export class DualBackupServiceV8 {
	/**
	 * Save data to both IndexedDB and SQLite
	 *
	 * @param key - Unique key for this data
	 * @param data - Data to backup
	 * @param dataType - Type of data
	 * @param options - Backup options
	 */
	static async save(
		key: string,
		data: unknown,
		dataType: BackupDataType,
		options: DualBackupOptions = {}
	): Promise<{ browser: boolean; server: boolean }> {
		const results = { browser: false, server: false };

		// Save to IndexedDB (browser)
		try {
			await IndexedDBBackupServiceV8U.save(key, data, dataType);
			results.browser = true;
			console.log(`${MODULE_TAG} ✅ Saved to IndexedDB: ${key}`);
		} catch (error: any) {
			console.error(`${MODULE_TAG} ❌ IndexedDB save failed:`, error.message);
		}

		// Save to SQLite (server) - only if environmentId provided
		if (!options.browserOnly && options.environmentId) {
			try {
				const serverSuccess = await SQLiteBackupServiceV8.save(
					key,
					options.environmentId,
					dataType,
					data,
					{ ttl: options.ttl }
				);
				results.server = serverSuccess;
				if (serverSuccess) {
					console.log(`${MODULE_TAG} ✅ Backed up to SQLite: ${key}`);
				}
			} catch (error: any) {
				console.error(`${MODULE_TAG} ❌ SQLite backup failed:`, error.message);
			}
		}

		return results;
	}

	/**
	 * Load data from IndexedDB, fallback to SQLite if not found
	 *
	 * @param key - Unique key
	 * @param environmentId - Environment ID (for SQLite fallback)
	 * @returns Data or null if not found
	 */
	static async load<T = unknown>(key: string, environmentId?: string): Promise<T | null> {
		// Try IndexedDB first (faster)
		try {
			const data = await IndexedDBBackupServiceV8U.load<T>(key);
			if (data !== null) {
				console.log(`${MODULE_TAG} ✅ Loaded from IndexedDB: ${key}`);
				return data;
			}
		} catch (error: any) {
			console.warn(`${MODULE_TAG} IndexedDB load failed:`, error.message);
		}

		// Fallback to SQLite if IndexedDB failed or not found
		if (environmentId) {
			try {
				const data = await SQLiteBackupServiceV8.load<T>(key, environmentId);
				if (data !== null) {
					console.log(`${MODULE_TAG} ✅ Restored from SQLite backup: ${key}`);

					// Re-sync to IndexedDB for future fast access
					try {
						await IndexedDBBackupServiceV8U.save(key, data, 'credentials');
						console.log(`${MODULE_TAG} Re-synced to IndexedDB: ${key}`);
					} catch (err) {
						console.warn(`${MODULE_TAG} Failed to re-sync to IndexedDB:`, err);
					}

					return data;
				}
			} catch (error: any) {
				console.warn(`${MODULE_TAG} SQLite load failed:`, error.message);
			}
		}

		console.log(`${MODULE_TAG} ⚠️ No data found in any storage: ${key}`);
		return null;
	}

	/**
	 * Delete from both storages
	 */
	static async delete(key: string, environmentId?: string): Promise<void> {
		// Delete from IndexedDB
		try {
			await IndexedDBBackupServiceV8U.delete(key);
			console.log(`${MODULE_TAG} ✅ Deleted from IndexedDB: ${key}`);
		} catch (error: any) {
			console.warn(`${MODULE_TAG} IndexedDB delete failed:`, error.message);
		}

		// Delete from SQLite
		if (environmentId) {
			try {
				await SQLiteBackupServiceV8.delete(key, environmentId);
				console.log(`${MODULE_TAG} ✅ Deleted from SQLite: ${key}`);
			} catch (error: any) {
				console.warn(`${MODULE_TAG} SQLite delete failed:`, error.message);
			}
		}
	}

	/**
	 * Clear all backups for an environment
	 */
	static async clearEnvironment(environmentId: string): Promise<void> {
		// Clear IndexedDB
		try {
			await IndexedDBBackupServiceV8U.clearAll();
			console.log(`${MODULE_TAG} ✅ Cleared IndexedDB`);
		} catch (error: any) {
			console.warn(`${MODULE_TAG} Failed to clear IndexedDB:`, error.message);
		}

		// Clear SQLite for environment
		try {
			await SQLiteBackupServiceV8.clearEnvironment(environmentId);
			console.log(`${MODULE_TAG} ✅ Cleared SQLite for environment`);
		} catch (error: any) {
			console.warn(`${MODULE_TAG} Failed to clear SQLite:`, error.message);
		}
	}
}

export default DualBackupServiceV8;
