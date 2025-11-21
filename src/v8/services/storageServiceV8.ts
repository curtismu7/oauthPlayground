/**
 * @file storageServiceV8.ts
 * @module v8/services
 * @description Versioned storage service for all V8 flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides versioned localStorage with migration support, export/import
 * functionality, and storage management.
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

const MODULE_TAG = '[💾 STORAGE-V8]';

// ============================================================================
// TYPES
// ============================================================================

export interface StorageData<T = unknown> {
	version: number;
	data: T;
	timestamp: number;
	flowKey?: string;
}

export interface Migration {
	fromVersion: number;
	toVersion: number;
	migrate: (data: unknown) => unknown;
}

export interface ExportData {
	version: number;
	exportedAt: string;
	data: Record<string, StorageData>;
}

// ============================================================================
// STORAGE KEYS
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
// STORAGE SERVICE CLASS
// ============================================================================

export class StorageServiceV8 {
	/**
	 * Save data with versioning
	 * @param key - Storage key
	 * @param data - Data to save
	 * @param version - Data version
	 * @param flowKey - Optional flow key for tracking
	 * @example
	 * StorageServiceV8.save('v8:authz-code', credentials, 1);
	 */
	static save<T>(key: string, data: T, version: number, flowKey?: string): void {
		try {
			const storageData: StorageData<T> = {
				version,
				data,
				timestamp: Date.now(),
				flowKey,
			};

			const serialized = JSON.stringify(storageData);
			localStorage.setItem(key, serialized);

			console.log(`${MODULE_TAG} Data saved`, {
				key,
				version,
				flowKey,
				size: serialized.length,
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
	 * Load data with migration support
	 * @param key - Storage key
	 * @param migrations - Optional array of migrations
	 * @returns Loaded data or null if not found
	 * @example
	 * const data = StorageServiceV8.load('v8:authz-code', migrations);
	 */
	static load<T>(key: string, migrations?: Migration[]): T | null {
		try {
			const serialized = localStorage.getItem(key);
			if (!serialized) {
				console.log(`${MODULE_TAG} No data found`, { key });
				return null;
			}

			let storageData: StorageData<T> = JSON.parse(serialized);

			// Apply migrations if needed
			if (migrations && migrations.length > 0) {
				const currentVersion = storageData.version;
				const targetVersion = Math.max(...migrations.map((m) => m.toVersion));

				if (currentVersion < targetVersion) {
					console.log(`${MODULE_TAG} Migrating data`, {
						key,
						from: currentVersion,
						to: targetVersion,
					});

					storageData = StorageServiceV8.applyMigrations(storageData, migrations);

					// Save migrated data
					StorageServiceV8.save(key, storageData.data, storageData.version, storageData.flowKey);
				}
			}

			console.log(`${MODULE_TAG} Data loaded`, {
				key,
				version: storageData.version,
				age: Date.now() - storageData.timestamp,
			});

			return storageData.data;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load data`, {
				key,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Apply migrations to data
	 * @param storageData - Storage data to migrate
	 * @param migrations - Array of migrations
	 * @returns Migrated storage data
	 */
	private static applyMigrations<T>(
		storageData: StorageData<T>,
		migrations: Migration[]
	): StorageData<T> {
		let currentData = storageData.data;
		let currentVersion = storageData.version;

		// Sort migrations by version
		const sortedMigrations = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion);

		for (const migration of sortedMigrations) {
			if (currentVersion === migration.fromVersion) {
				console.log(`${MODULE_TAG} Applying migration`, {
					from: migration.fromVersion,
					to: migration.toVersion,
				});

				currentData = migration.migrate(currentData) as T;
				currentVersion = migration.toVersion;
			}
		}

		return {
			...storageData,
			version: currentVersion,
			data: currentData,
			timestamp: Date.now(),
		};
	}

	/**
	 * Clear specific key
	 * @param key - Storage key to clear
	 * @example
	 * StorageServiceV8.clear('v8:authz-code');
	 */
	static clear(key: string): void {
		try {
			localStorage.removeItem(key);
			console.log(`${MODULE_TAG} Data cleared`, { key });
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear data`, {
				key,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Clear all V8 data
	 * @example
	 * StorageServiceV8.clearAll();
	 */
	static clearAll(): void {
		try {
			const keys = StorageServiceV8.getAllKeys();
			let cleared = 0;

			keys.forEach((key) => {
				localStorage.removeItem(key);
				cleared++;
			});

			console.log(`${MODULE_TAG} All V8 data cleared`, { count: cleared });
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear all data`, {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Get all V8 storage keys
	 * @returns Array of V8 storage keys
	 */
	static getAllKeys(): string[] {
		const keys: string[] = [];
		const prefix = STORAGE_KEYS.PREFIX;

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(prefix)) {
				keys.push(key);
			}
		}

		return keys;
	}

	/**
	 * Export all V8 data
	 * @returns JSON string of all V8 data
	 * @example
	 * const exported = StorageServiceV8.exportAll();
	 * // Save to file or clipboard
	 */
	static exportAll(): string {
		try {
			const keys = StorageServiceV8.getAllKeys();
			const data: Record<string, StorageData> = {};

			keys.forEach((key) => {
				const serialized = localStorage.getItem(key);
				if (serialized) {
					try {
						data[key] = JSON.parse(serialized);
					} catch {
						console.warn(`${MODULE_TAG} Failed to parse data for export`, { key });
					}
				}
			});

			const exportData: ExportData = {
				version: 1,
				exportedAt: new Date().toISOString(),
				data,
			};

			const exported = JSON.stringify(exportData, null, 2);

			console.log(`${MODULE_TAG} Data exported`, {
				keyCount: keys.length,
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
	 * Import V8 data
	 * @param jsonData - JSON string of exported data
	 * @param overwrite - Whether to overwrite existing data
	 * @example
	 * StorageServiceV8.importAll(exportedData, true);
	 */
	static importAll(jsonData: string, overwrite = false): void {
		try {
			const exportData: ExportData = JSON.parse(jsonData);

			if (!exportData.version || !exportData.data) {
				throw new Error('Invalid export data format');
			}

			let imported = 0;
			let skipped = 0;

			Object.entries(exportData.data).forEach(([key, storageData]) => {
				// Check if key already exists
				if (!overwrite && localStorage.getItem(key)) {
					console.log(`${MODULE_TAG} Skipping existing key`, { key });
					skipped++;
					return;
				}

				// Import data
				localStorage.setItem(key, JSON.stringify(storageData));
				imported++;
			});

			console.log(`${MODULE_TAG} Data imported`, {
				imported,
				skipped,
				total: Object.keys(exportData.data).length,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to import data`, {
				error: error instanceof Error ? error.message : String(error),
			});
			throw new Error(`Failed to import data: ${error}`);
		}
	}

	/**
	 * Get storage size in bytes
	 * @returns Total size of V8 storage in bytes
	 * @example
	 * const size = StorageServiceV8.getSize();
	 * console.log(`Storage size: ${size} bytes`);
	 */
	static getSize(): number {
		try {
			const keys = StorageServiceV8.getAllKeys();
			let totalSize = 0;

			keys.forEach((key) => {
				const value = localStorage.getItem(key);
				if (value) {
					// Calculate size (key + value)
					totalSize += key.length + value.length;
				}
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
	 * Check if storage is available
	 * @returns True if localStorage is available
	 */
	static isAvailable(): boolean {
		try {
			const testKey = '__storage_test__';
			localStorage.setItem(testKey, 'test');
			localStorage.removeItem(testKey);
			return true;
		} catch {
			console.warn(`${MODULE_TAG} localStorage is not available`);
			return false;
		}
	}

	/**
	 * Get storage quota information
	 * @returns Storage quota information
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
	 * Check if key exists
	 * @param key - Storage key
	 * @returns True if key exists
	 */
	static has(key: string): boolean {
		return localStorage.getItem(key) !== null;
	}

	/**
	 * Get data age in milliseconds
	 * @param key - Storage key
	 * @returns Age in milliseconds or null if not found
	 */
	static getAge(key: string): number | null {
		try {
			const serialized = localStorage.getItem(key);
			if (!serialized) {
				return null;
			}

			const storageData: StorageData = JSON.parse(serialized);
			return Date.now() - storageData.timestamp;
		} catch {
			return null;
		}
	}

	/**
	 * Check if data is expired
	 * @param key - Storage key
	 * @param maxAge - Maximum age in milliseconds
	 * @returns True if data is expired
	 */
	static isExpired(key: string, maxAge: number): boolean {
		const age = StorageServiceV8.getAge(key);
		if (age === null) {
			return true;
		}
		return age > maxAge;
	}

	/**
	 * Clean up expired data
	 * @param maxAge - Maximum age in milliseconds
	 * @returns Number of keys cleaned up
	 */
	static cleanupExpired(maxAge: number): number {
		try {
			const keys = StorageServiceV8.getAllKeys();
			let cleaned = 0;

			keys.forEach((key) => {
				if (StorageServiceV8.isExpired(key, maxAge)) {
					StorageServiceV8.clear(key);
					cleaned++;
				}
			});

			console.log(`${MODULE_TAG} Expired data cleaned up`, {
				cleaned,
				maxAge,
			});

			return cleaned;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to cleanup expired data`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return 0;
		}
	}

	/**
	 * Get all data for a specific flow
	 * @param flowKey - Flow key
	 * @returns Array of storage data for the flow
	 */
	static getFlowData(flowKey: string): Array<{ key: string; data: StorageData }> {
		try {
			const keys = StorageServiceV8.getAllKeys();
			const flowData: Array<{ key: string; data: StorageData }> = [];

			keys.forEach((key) => {
				const serialized = localStorage.getItem(key);
				if (serialized) {
					try {
						const storageData: StorageData = JSON.parse(serialized);
						if (storageData.flowKey === flowKey) {
							flowData.push({ key, data: storageData });
						}
					} catch {
						// Skip invalid data
					}
				}
			});

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
	 * Clear all data for a specific flow
	 * @param flowKey - Flow key
	 * @returns Number of keys cleared
	 */
	static clearFlowData(flowKey: string): number {
		try {
			const flowData = StorageServiceV8.getFlowData(flowKey);
			let cleared = 0;

			flowData.forEach(({ key }) => {
				StorageServiceV8.clear(key);
				cleared++;
			});

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
