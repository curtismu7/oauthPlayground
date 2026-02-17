// src/services/pkceStorageServiceV8UMigration.ts
// Migration layer for PKCEStorageServiceV8U to unified storage

import type { V8UPKCECodes } from './unifiedTokenStorageService';
import { unifiedTokenStorage } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔄 PKCE-STORAGE-V8U-MIGRATION]';

/**
 * Migration service for PKCEStorageServiceV8U data
 * Handles migration from localStorage/sessionStorage to unified storage
 */
export class PKCEStorageServiceV8UMigration {
	/**
	 * Migrate all existing V8U PKCE codes from localStorage/sessionStorage to unified storage
	 */
	static async migrateAll(): Promise<{ migrated: number; errors: string[] }> {
		const results = { migrated: 0, errors: [] as string[] };

		try {
			// Get all V8U PKCE keys from localStorage and sessionStorage
			const localStorageKeys =
				PKCEStorageServiceV8UMigration.getV8UPKCEKeysFromStorage('localStorage');
			const sessionStorageKeys =
				PKCEStorageServiceV8UMigration.getV8UPKCEKeysFromStorage('sessionStorage');
			const allKeys = [...new Set([...localStorageKeys, ...sessionStorageKeys])];

			console.log(`${MODULE_TAG} Starting PKCE migration`, {
				localStorageKeys: localStorageKeys.length,
				sessionStorageKeys: sessionStorageKeys.length,
				totalKeys: allKeys.length,
			});

			for (const flowKey of allKeys) {
				try {
					await PKCEStorageServiceV8UMigration.migratePKCEKey(flowKey);
					results.migrated++;
				} catch (error) {
					const errorMsg = `Failed to migrate PKCE key ${flowKey}: ${error}`;
					results.errors.push(errorMsg);
					console.error(`${MODULE_TAG} ${errorMsg}`);
				}
			}

			console.log(`${MODULE_TAG} PKCE migration completed`, results);
			return results;
		} catch (error) {
			const errorMsg = `PKCE migration failed: ${error}`;
			results.errors.push(errorMsg);
			console.error(`${MODULE_TAG} ${errorMsg}`);
			return results;
		}
	}

	/**
	 * Migrate a single PKCE key from storage to unified storage
	 */
	private static async migratePKCEKey(flowKey: string): Promise<void> {
		// Try localStorage first
		const storageKey = `v8u_pkce_${flowKey}`;
		let stored = localStorage.getItem(storageKey);
		let source = 'localStorage';

		// If not found, try sessionStorage
		if (!stored) {
			stored = sessionStorage.getItem(storageKey) || sessionStorage.getItem('v8u_pkce_codes');
			source = 'sessionStorage';
		}

		if (!stored) {
			return; // No data to migrate
		}

		try {
			// Parse the PKCE data
			const pkceData: V8UPKCECodes = JSON.parse(stored);

			// Save to unified storage
			await unifiedTokenStorage.saveV8UPKCECodes(flowKey, pkceData);

			// Remove from original storage after successful migration
			if (source === 'localStorage') {
				localStorage.removeItem(storageKey);
			} else {
				sessionStorage.removeItem(storageKey);
				sessionStorage.removeItem('v8u_pkce_codes');
			}

			console.log(`${MODULE_TAG} Migrated PKCE key`, {
				flowKey,
				source,
				challengeMethod: pkceData.codeChallengeMethod,
			});
		} catch (error) {
			throw new Error(`Failed to parse or migrate PKCE data for key ${flowKey}: ${error}`);
		}
	}

	/**
	 * Get all V8U PKCE keys from storage
	 */
	private static getV8UPKCEKeysFromStorage(
		storageType: 'localStorage' | 'sessionStorage'
	): string[] {
		const keys: string[] = [];
		const prefix = 'v8u_pkce_';
		const storage = storageType === 'localStorage' ? localStorage : sessionStorage;

		for (let i = 0; i < storage.length; i++) {
			const key = storage.key(i);
			if (key?.startsWith(prefix)) {
				// Extract flowKey from storage key
				const flowKey = key.substring(prefix.length);
				keys.push(flowKey);
			}
		}

		return keys;
	}

	/**
	 * Check if PKCE migration is needed
	 */
	static needsMigration(): boolean {
		const localStorageKeys =
			PKCEStorageServiceV8UMigration.getV8UPKCEKeysFromStorage('localStorage');
		const sessionStorageKeys =
			PKCEStorageServiceV8UMigration.getV8UPKCEKeysFromStorage('sessionStorage');
		return localStorageKeys.length > 0 || sessionStorageKeys.length > 0;
	}

	/**
	 * Get migration statistics
	 */
	static getMigrationStats(): {
		localStorageKeys: number;
		sessionStorageKeys: number;
		unifiedStorageKeys: number;
	} {
		const localStorageKeys =
			PKCEStorageServiceV8UMigration.getV8UPKCEKeysFromStorage('localStorage');
		const sessionStorageKeys =
			PKCEStorageServiceV8UMigration.getV8UPKCEKeysFromStorage('sessionStorage');

		// We'll need to implement this method in unified storage
		// For now, return a placeholder
		return {
			localStorageKeys: localStorageKeys.length,
			sessionStorageKeys: sessionStorageKeys.length,
			unifiedStorageKeys: 0, // TODO: Implement getV8UPKCEKeyCount in unified storage
		};
	}
}

export default PKCEStorageServiceV8UMigration;
