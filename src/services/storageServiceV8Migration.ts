// src/services/storageServiceV8Migration.ts
// Migration layer for StorageServiceV8 to unified storage

import { unifiedTokenStorage } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔄 STORAGE-V8-MIGRATION]';

/**
 * Migration service for StorageServiceV8 data
 * Handles migration from localStorage to unified storage
 */
export class StorageServiceV8Migration {
	/**
	 * Migrate all existing V8 localStorage data to unified storage
	 */
	static async migrateAll(): Promise<{ migrated: number; errors: string[] }> {
		const results = { migrated: 0, errors: [] as string[] };

		try {
			// Get all V8-prefixed keys from localStorage
			const v8Keys = StorageServiceV8Migration.getV8LocalStorageKeys();

			console.log(`${MODULE_TAG} Starting migration`, { keyCount: v8Keys.length });

			for (const key of v8Keys) {
				try {
					await StorageServiceV8Migration.migrateKey(key);
					results.migrated++;
				} catch (error) {
					const errorMsg = `Failed to migrate key ${key}: ${error}`;
					results.errors.push(errorMsg);
					console.error(`${MODULE_TAG} ${errorMsg}`);
				}
			}

			console.log(`${MODULE_TAG} Migration completed`, results);
			return results;
		} catch (error) {
			const errorMsg = `Migration failed: ${error}`;
			results.errors.push(errorMsg);
			console.error(`${MODULE_TAG} ${errorMsg}`);
			return results;
		}
	}

	/**
	 * Migrate a single key from localStorage to unified storage
	 */
	private static async migrateKey(key: string): Promise<void> {
		const serialized = localStorage.getItem(key);
		if (!serialized) {
			return;
		}

		try {
			// Parse the storage data
			const storageData = JSON.parse(serialized);

			// Extract version, data, timestamp, flowKey
			const { version = 1, data, timestamp = Date.now(), flowKey } = storageData;

			// Save to unified storage
			await unifiedTokenStorage.saveV8Versioned(key, data, version, flowKey);

			// Remove from localStorage after successful migration
			localStorage.removeItem(key);

			console.log(`${MODULE_TAG} Migrated key`, { key, version, flowKey });
		} catch (error) {
			throw new Error(`Failed to parse or migrate data for key ${key}: ${error}`);
		}
	}

	/**
	 * Get all V8-prefixed keys from localStorage
	 */
	private static getV8LocalStorageKeys(): string[] {
		const keys: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('v8:')) {
				keys.push(key);
			}
		}

		return keys;
	}

	/**
	 * Check if migration is needed
	 */
	static needsMigration(): boolean {
		return StorageServiceV8Migration.getV8LocalStorageKeys().length > 0;
	}

	/**
	 * Get migration statistics
	 */
	static getMigrationStats(): { localStorageKeys: number; unifiedStorageKeys: number } {
		const localStorageKeys = StorageServiceV8Migration.getV8LocalStorageKeys().length;

		// We'll need to implement this method in unified storage
		// For now, return a placeholder
		return {
			localStorageKeys,
			unifiedStorageKeys: 0, // TODO: Implement getV8KeyCount in unified storage
		};
	}
}

export default StorageServiceV8Migration;
