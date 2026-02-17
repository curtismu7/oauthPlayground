// src/services/credentialsServiceV8Migration.ts
// Migration layer for CredentialsServiceV8 to unified storage

import type { V8Credentials } from './unifiedTokenStorageService';
import { unifiedTokenStorage } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔄 CREDENTIALS-V8-MIGRATION]';

/**
 * Migration service for CredentialsServiceV8 data
 * Handles migration from localStorage to unified storage
 */
export class CredentialsServiceV8Migration {
	/**
	 * Migrate all existing V8 credentials from localStorage to unified storage
	 */
	static async migrateAll(): Promise<{ migrated: number; errors: string[] }> {
		const results = { migrated: 0, errors: [] as string[] };

		try {
			// Get all V8 credentials keys from localStorage
			const v8Keys = CredentialsServiceV8Migration.getV8CredentialsKeys();

			console.log(`${MODULE_TAG} Starting credentials migration`, { keyCount: v8Keys.length });

			for (const key of v8Keys) {
				try {
					await CredentialsServiceV8Migration.migrateCredentialsKey(key);
					results.migrated++;
				} catch (error) {
					const errorMsg = `Failed to migrate credentials key ${key}: ${error}`;
					results.errors.push(errorMsg);
					console.error(`${MODULE_TAG} ${errorMsg}`);
				}
			}

			console.log(`${MODULE_TAG} Credentials migration completed`, results);
			return results;
		} catch (error) {
			const errorMsg = `Credentials migration failed: ${error}`;
			results.errors.push(errorMsg);
			console.error(`${MODULE_TAG} ${errorMsg}`);
			return results;
		}
	}

	/**
	 * Migrate a single credentials key from localStorage to unified storage
	 */
	private static async migrateCredentialsKey(flowKey: string): Promise<void> {
		const storageKey = `v8_credentials_${flowKey}`;
		const serialized = localStorage.getItem(storageKey);
		if (!serialized) {
			return;
		}

		try {
			// Parse the credentials data
			const credentials: V8Credentials = JSON.parse(serialized);

			// Save to unified storage
			await unifiedTokenStorage.saveV8Credentials(flowKey, credentials);

			// Remove from localStorage after successful migration
			localStorage.removeItem(storageKey);

			console.log(`${MODULE_TAG} Migrated credentials key`, {
				flowKey,
				environmentId: credentials.environmentId,
			});
		} catch (error) {
			throw new Error(`Failed to parse or migrate credentials for key ${flowKey}: ${error}`);
		}
	}

	/**
	 * Get all V8 credentials keys from localStorage
	 */
	private static getV8CredentialsKeys(): string[] {
		const keys: string[] = [];
		const prefix = 'v8_credentials_';

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(prefix)) {
				// Extract flowKey from storage key
				const flowKey = key.substring(prefix.length);
				keys.push(flowKey);
			}
		}

		return keys;
	}

	/**
	 * Check if credentials migration is needed
	 */
	static needsMigration(): boolean {
		return CredentialsServiceV8Migration.getV8CredentialsKeys().length > 0;
	}

	/**
	 * Get migration statistics
	 */
	static getMigrationStats(): { localStorageKeys: number; unifiedStorageKeys: number } {
		const localStorageKeys = CredentialsServiceV8Migration.getV8CredentialsKeys().length;

		// We'll need to implement this method in unified storage
		// For now, return a placeholder
		return {
			localStorageKeys,
			unifiedStorageKeys: 0, // TODO: Implement getV8CredentialsCount in unified storage
		};
	}
}

export default CredentialsServiceV8Migration;
