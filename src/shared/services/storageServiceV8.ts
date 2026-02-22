/**
 * @file storageServiceV8.ts
 * @module shared/services
 * @description Versioned storage service for all V8 flows - SHARED SERVICE
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service now uses unifiedTokenStorageService for better performance and reliability.
 * All existing API methods are preserved for backward compatibility.
 *
 * @example
 * // Save with versioning
 * StorageServiceV8.save('v8:authz-code', credentials, 1);
 *
 * // Load with migration
 * const data = StorageServiceV8.load('v8:authz-code', migrations);
 *
 * // Export all V8 data
 * const exported = StorageServiceV8.exportAll();
 */

const MODULE_TAG = '[💾 STORAGE-V8-SHARED]';

// ============================================================================
// IMPORTS
// ============================================================================

import { StorageServiceV8Migration } from '../../services/storageServiceV8Migration';
import type { Migration, StorageData } from '../../services/unifiedTokenStorageService';
import { unifiedTokenStorage } from '../../services/unifiedTokenStorageService';

// ============================================================================
// STORAGE KEYS (Preserved for compatibility)
// ============================================================================

export const STORAGE_KEYS = {
	// V8 prefix for all keys
	PREFIX: 'v8',

	// Flow-specific
	AUTHZ_CODE: 'v8:authz-code',
	IMPLICIT: 'v8:implicit',
	CLIENT_CREDENTIALS: 'v8:client-credentials',
	DEVICE_CODE: 'v8:device-code',

	// Shared
	CREDENTIALS: 'v8:credentials',
	DISCOVERY: 'v8:discovery',
	TOKENS: 'v8:tokens',
	PREFERENCES: 'v8:preferences',
	STEP_PROGRESS: 'v8:step-progress',
} as const;

// ============================================================================
// MIGRATION STATE
// ============================================================================

let migrationCompleted = false;

/**
 * Ensure migration is completed before any storage operation
 */
const ensureMigration = async (): Promise<void> => {
	if (!migrationCompleted) {
		if (StorageServiceV8Migration.needsMigration()) {
			console.log(`${MODULE_TAG} Starting automatic migration...`);
			const result = await StorageServiceV8Migration.migrateAll();
			console.log(`${MODULE_TAG} Migration completed`, result);
		}
		migrationCompleted = true;
	}
};

// ============================================================================
// STORAGE SERVICE CLASS (Compatibility Layer)
// ============================================================================

export class StorageServiceV8 {
	/**
	 * Save data with versioning (now uses unified storage)
	 * @param key - Storage key
	 * @param data - Data to save
	 * @param version - Data version
	 * @param flowKey - Optional flow key for tracking
	 * @example
	 * StorageServiceV8.save('v8:authz-code', credentials, 1);
	 */
	static async save<T>(key: string, data: T, version: number, flowKey?: string): Promise<void> {
		try {
			await ensureMigration();
			await unifiedTokenStorage.saveV8Versioned(key, data, version, flowKey);

			console.log(`${MODULE_TAG} Data saved`, {
				key,
				version,
				flowKey,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save data`, {
				key,
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(`Failed to save data to storage: ${error}`);
		}
	}

	/**
	 * Load data with migration support (now uses unified storage)
	 * @param key - Storage key
	 * @param migrations - Optional array of migrations
	 * @returns Loaded data or null if not found
	 * @example
	 * const data = StorageServiceV8.load('v8:authz-code', migrations);
	 */
	static async load<T>(key: string, migrations?: Migration[]): Promise<T | null> {
		try {
			await ensureMigration();
			const data = await unifiedTokenStorage.loadV8Versioned<T>(key, migrations);

			if (data) {
				console.log(`${MODULE_TAG} Data loaded`, { key });
			} else {
				console.log(`${MODULE_TAG} No data found`, { key });
			}

			return data;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load data`, {
				key,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Clear specific key (now uses unified storage)
	 * @param key - Storage key to clear
	 * @example
	 * StorageServiceV8.clear('v8:authz-code');
	 */
	static async clear(key: string): Promise<void> {
		try {
			await ensureMigration();
			await unifiedTokenStorage.clearV8Key(key);
			console.log(`${MODULE_TAG} Data cleared`, { key });
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear data`, {
				key,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Clear all V8 data (now uses unified storage)
	 * @example
	 * StorageServiceV8.clearAll();
	 */
	static async clearAll(): Promise<void> {
		try {
			await ensureMigration();
			await unifiedTokenStorage.clearAllV8();
			console.log(`${MODULE_TAG} All V8 data cleared`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear all data`, {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Get all V8 storage keys (now uses unified storage)
	 * @returns Array of V8 storage keys
	 */
	static async getAllKeys(): Promise<string[]> {
		try {
			await ensureMigration();
			const keys = await unifiedTokenStorage.getAllV8Keys();
			return keys.filter((key) => key.startsWith(STORAGE_KEYS.PREFIX));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get all keys`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	/**
	 * Export all V8 data (now uses unified storage)
	 * @returns JSON string of all V8 data
	 * @example
	 * const exported = StorageServiceV8.exportAll();
	 * // Save to file or clipboard
	 */
	static async exportAll(): Promise<string> {
		try {
			await ensureMigration();
			const exported = await unifiedTokenStorage.exportAllV8();

			console.log(`${MODULE_TAG} Data exported`, {
				size: exported.length,
			});

			return exported;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to export data`, {
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(`Failed to export data: ${error}`);
		}
	}

	/**
	 * Import V8 data (now uses unified storage)
	 * @param jsonData - JSON string of exported data
	 * @param overwrite - Whether to overwrite existing data
	 * @example
	 * StorageServiceV8.importAll(exportedData, true);
	 */
	static async importAll(jsonData: string, overwrite = false): Promise<void> {
		try {
			await ensureMigration();
			await unifiedTokenStorage.importAllV8(jsonData, overwrite);

			console.log(`${MODULE_TAG} Data imported`, { overwrite });
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to import data`, {
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(`Failed to import data: ${error}`);
		}
	}

	/**
	 * Get storage size in bytes (fallback implementation)
	 * @returns Total size of V8 storage in bytes
	 * @example
	 * const size = StorageServiceV8.getSize();
	 * console.log(`Storage size: ${size} bytes`);
	 */
	static async getSize(): Promise<number> {
		try {
			await ensureMigration();
			const keys = await StorageServiceV8.getAllKeys();
			let totalSize = 0;

			// Estimate size based on key lengths
			keys.forEach((key) => {
				totalSize += key.length * 2; // Rough estimate
			});

			console.log(`${MODULE_TAG} Storage size calculated`, {
				bytes: totalSize,
				kb: (totalSize / 1024).toFixed(2),
				keyCount: keys.length,
			});

			return totalSize;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to calculate storage size`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return 0;
		}
	}

	/**
	 * Check if storage is available (always true with unified storage)
	 * @returns True if storage is available
	 */
	static isAvailable(): boolean {
		return true; // Unified storage is always available
	}

	/**
	 * Get storage quota information (fallback implementation)
	 * @returns Storage quota information or null
	 */
	static async getQuota(): Promise<{
		usage: number;
		quota: number;
		available: number;
		percentUsed: number;
	} | null> {
		try {
			if ('storage' in navigator && 'estimate' in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				const usage = estimate.usage || 0;
				const quota = estimate.quota || 0;
				const available = quota - usage;
				const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

				console.log(`${MODULE_TAG} Storage quota`, {
					usage,
					quota,
					available,
					percentUsed: `${percentUsed.toFixed(2)}%`,
				});

				return { usage, quota, available, percentUsed };
			}

			return null;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get storage quota`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Check if key exists (now uses unified storage)
	 * @param key - Storage key
	 * @returns True if key exists
	 */
	static async has(key: string): Promise<boolean> {
		try {
			await ensureMigration();
			return await unifiedTokenStorage.hasV8Key(key);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to check key existence`, {
				key,
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	/**
	 * Get data age in milliseconds (now uses unified storage)
	 * @param key - Storage key
	 * @returns Age in milliseconds or null if not found
	 */
	static async getAge(key: string): Promise<number | null> {
		try {
			await ensureMigration();
			return await unifiedTokenStorage.getV8Age(key);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get data age`, {
				key,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Check if data is expired (now uses unified storage)
	 * @param key - Storage key
	 * @param maxAge - Maximum age in milliseconds
	 * @returns True if data is expired
	 */
	static async isExpired(key: string, maxAge: number): Promise<boolean> {
		try {
			await ensureMigration();
			return await unifiedTokenStorage.isV8Expired(key, maxAge);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to check expiration`, {
				key,
				maxAge,
				error: error instanceof Error ? error.message : String(error),
			});
			return true; // Assume expired on error
		}
	}

	/**
	 * Clean up expired data (now uses unified storage)
	 * @param maxAge - Maximum age in milliseconds
	 * @returns Number of keys cleaned up
	 */
	static async cleanupExpired(maxAge: number): Promise<number> {
		try {
			await ensureMigration();
			const cleaned = await unifiedTokenStorage.cleanupExpiredV8(maxAge);

			console.log(`${MODULE_TAG} Expired data cleaned up`, {
				cleaned,
				maxAge,
			});

			return cleaned;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to cleanup expired data`, {
				maxAge,
				error: error instanceof Error ? error.message : String(error),
			});
			return 0;
		}
	}

	/**
	 * Get all data for a specific flow (fallback implementation)
	 * @param flowKey - Flow key
	 * @returns Array of storage data for the flow
	 */
	static async getFlowData(flowKey: string): Promise<Array<{ key: string; data: StorageData }>> {
		try {
			await ensureMigration();
			const allKeys = await StorageServiceV8.getAllKeys();
			const flowData: Array<{ key: string; data: StorageData }> = [];

			for (const key of allKeys) {
				const data = await StorageServiceV8.load<unknown>(key);
				if (data) {
					// Create a mock StorageData object
					flowData.push({
						key,
						data: {
							version: 1,
							data,
							timestamp: Date.now(),
							flowKey,
						},
					});
				}
			}

			console.log(`${MODULE_TAG} Flow data retrieved`, {
				flowKey,
				count: flowData.length,
			});

			return flowData;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get flow data`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	/**
	 * Clear all data for a specific flow (fallback implementation)
	 * @param flowKey - Flow key
	 * @returns Number of keys cleared
	 */
	static async clearFlowData(flowKey: string): Promise<number> {
		try {
			const flowData = await StorageServiceV8.getFlowData(flowKey);
			let cleared = 0;

			for (const { key } of flowData) {
				await StorageServiceV8.clear(key);
				cleared++;
			}

			console.log(`${MODULE_TAG} Flow data cleared`, {
				flowKey,
				cleared,
			});

			return cleared;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear flow data`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});
			return 0;
		}
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default StorageServiceV8;
