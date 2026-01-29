/**
 * @file indexedDBBackupServiceV8U.ts
 * @module v8u/services
 * @description IndexedDB backup service for PKCE codes and credentials
 * @version 8.0.0
 * @since 2024-11-18
 *
 * IndexedDB is the most robust browser storage:
 * - Survives page refresh
 * - Survives browser restart
 * - Survives cache clear
 * - Large storage capacity (50MB+)
 * - Async API (doesn't block UI)
 */

import { logger } from './unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[💾 INDEXEDDB-BACKUP-V8U]';

export interface BackupData {
	key: string;
	data: unknown;
	savedAt: number;
	type: 'pkce' | 'credentials' | 'flowState';
}

const DB_NAME = 'v8u_backup_db';
const DB_VERSION = 1;
const STORE_NAME = 'backups';
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
	if (dbPromise) {
		return dbPromise;
	}

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			logger.error('Failed to open database', { error: request.error });
			reject(request.error);
		};

		request.onsuccess = () => {
			logger.debug('Database opened successfully');
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create object store if it doesn't exist
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: 'key',
				});
				store.createIndex('type', 'type', { unique: false });
				store.createIndex('savedAt', 'savedAt', { unique: false });
				logger.debug('Object store created with indexes');
			}
		};
	});

	return dbPromise;
}

/**
 * Save data to IndexedDB backup
 */
export async function save(
	key: string,
	data: unknown,
	type: 'pkce' | 'credentials' | 'flowState'
): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		const backupData: BackupData = {
			key,
			data,
			savedAt: Date.now(),
			type,
		};

		store.put(backupData);

		await new Promise<void>((resolve, reject) => {
			transaction.oncomplete = () => {
				// Backup saved successfully
				resolve();
			};
			transaction.onerror = () => {
				logger.error('Transaction failed', { error: transaction.error });
				reject(transaction.error);
			};
		});
	} catch (err) {
		logger.error('Failed to save backup', { key, type, error: err });
		throw err;
	}
}

/**
 * Load data from IndexedDB backup
 */
export async function load<T = unknown>(key: string): Promise<T | null> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(key);

		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				const result = request.result as BackupData | undefined;
				if (result) {
					logger.debug('Loaded backup', {
						key,
						type: result.type,
						age: Date.now() - result.savedAt,
					});
					resolve(result.data as T);
				} else {
					logger.warn('No backup found', { key });
					resolve(null);
				}
			};
			request.onerror = () => {
				logger.error('Failed to load', { error: request.error });
				reject(request.error);
			};
		});
	} catch (err) {
		logger.error('Failed to load backup', { key, error: err });
		return null;
	}
}

/**
 * Delete data from IndexedDB backup
 */
export async function deleteBackup(key: string): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		store.delete(key);

		await new Promise<void>((resolve, reject) => {
			transaction.oncomplete = () => {
				logger.debug('Deleted backup', { key });
				resolve();
			};
			transaction.onerror = () => reject(transaction.error);
		});
	} catch (err) {
		logger.error('Failed to delete backup', { key, error: err });
	}
}

/**
 * List all backups of a specific type
 */
export async function listByType(
	type: 'pkce' | 'credentials' | 'flowState'
): Promise<BackupData[]> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const index = store.index('type');
		const request = index.getAll(type);

		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				logger.debug('Listed backups', { type, count: request.result.length });
				resolve(request.result);
			};
			request.onerror = () => reject(request.error);
		});
	} catch (err) {
		logger.error('Failed to list backups', { type, error: err });
		return [];
	}
}

/**
 * Clear all backups (useful for testing/debugging)
 */
export async function clearAll(): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		store.clear();

		await new Promise<void>((resolve, reject) => {
			transaction.oncomplete = () => {
				logger.debug('Cleared all backups');
				resolve();
			};
			transaction.onerror = () => reject(transaction.error);
		});
	} catch (err) {
		logger.error('Failed to clear backups', { error: err });
	}
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<{ total: number; byType: Record<string, number> }> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				const all = request.result as BackupData[];
				const byType: Record<string, number> = {};

				all.forEach((item) => {
					byType[item.type] = (byType[item.type] || 0) + 1;
				});

				resolve({ total: all.length, byType });
			};
			request.onerror = () => reject(request.error);
		});
	} catch (err) {
		logger.error('Failed to get stats', { error: err });
		return { total: 0, byType: {} };
	}
}

// Export as object for backward compatibility and global access
export const IndexedDBBackupServiceV8U = {
	save,
	load,
	delete: deleteBackup,
	listByType,
	clearAll,
	getStats,
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(
		window as { IndexedDBBackupServiceV8U?: typeof IndexedDBBackupServiceV8U }
	).IndexedDBBackupServiceV8U = IndexedDBBackupServiceV8U;
}
