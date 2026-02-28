// src/services/flowStorageServiceMigration.ts
// Migration layer for FlowStorageService to unified storage

import { unifiedTokenStorage } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔄 FLOW-STORAGE-MIGRATION]';

/**
 * Migration service for FlowStorageService data
 * Handles migration from localStorage/sessionStorage to unified storage
 */
export class FlowStorageServiceMigration {
	/**
	 * Migrate all existing flow storage data from localStorage/sessionStorage to unified storage
	 */
	static async migrateAll(): Promise<{ migrated: number; errors: string[] }> {
		const results = { migrated: 0, errors: [] as string[] };

		try {
			// Get all flow storage keys from localStorage and sessionStorage
			const localStorageKeys =
				FlowStorageServiceMigration.getFlowStorageKeysFromStorage('localStorage');
			const sessionStorageKeys =
				FlowStorageServiceMigration.getFlowStorageKeysFromStorage('sessionStorage');
			const allKeys = [...new Set([...localStorageKeys, ...sessionStorageKeys])];

			console.log(`${MODULE_TAG} Starting flow storage migration`, {
				localStorageKeys: localStorageKeys.length,
				sessionStorageKeys: sessionStorageKeys.length,
				totalKeys: allKeys.length,
			});

			for (const key of allKeys) {
				try {
					await FlowStorageServiceMigration.migrateFlowStorageKey(key);
					results.migrated++;
				} catch (error) {
					const errorMsg = `Failed to migrate flow storage key ${key}: ${error}`;
					results.errors.push(errorMsg);
					console.error(`${MODULE_TAG} ${errorMsg}`);
				}
			}

			console.log(`${MODULE_TAG} Flow storage migration completed`, results);
			return results;
		} catch (error) {
			const errorMsg = `Flow storage migration failed: ${error}`;
			results.errors.push(errorMsg);
			console.error(`${MODULE_TAG} ${errorMsg}`);
			return results;
		}
	}

	/**
	 * Migrate a single flow storage key from storage to unified storage
	 */
	private static async migrateFlowStorageKey(key: string): Promise<void> {
		// Try localStorage first
		let stored = localStorage.getItem(key);
		let source = 'localStorage';

		// If not found, try sessionStorage
		if (!stored) {
			stored = sessionStorage.getItem(key);
			source = 'sessionStorage';
		}

		if (!stored) {
			return; // No data to migrate
		}

		try {
			// Parse the data
			const data = JSON.parse(stored);

			// Save to unified storage using a generic token type
			await unifiedTokenStorage.storeToken({
				id: `flow_storage_${key}`,
				type: 'flow_state' as any,
				value: JSON.stringify(data),
				expiresAt: null,
				issuedAt: Date.now(),
				source: 'indexeddb',
				flowName: 'flow_storage',
				metadata: {
					originalKey: key,
					source,
					migratedAt: Date.now(),
				},
			});

			// Remove from original storage after successful migration
			if (source === 'localStorage') {
				localStorage.removeItem(key);
			} else {
				sessionStorage.removeItem(key);
			}

			console.log(`${MODULE_TAG} Migrated flow storage key`, { key, source });
		} catch (error) {
			throw new Error(`Failed to parse or migrate flow storage data for key ${key}: ${error}`);
		}
	}

	/**
	 * Get all flow storage keys from storage
	 */
	private static getFlowStorageKeysFromStorage(
		storageType: 'localStorage' | 'sessionStorage'
	): string[] {
		const keys: string[] = [];
		const storage = storageType === 'localStorage' ? localStorage : sessionStorage;

		for (let i = 0; i < storage.length; i++) {
			const key = storage.key(i);
			if (key && FlowStorageServiceMigration.isFlowStorageKey(key)) {
				keys.push(key);
			}
		}

		return keys;
	}

	/**
	 * Check if a key is a flow storage key
	 */
	private static isFlowStorageKey(key: string): boolean {
		// Check for flow storage patterns
		const flowStoragePatterns = [
			/^session:.*:/, // session:flow-id:data-type
			/^local:.*:/, // local:flow-id:data-type
			/^oauth-/, // oauth-* patterns
			/^oidc-/, // oidc-* patterns
			/^device-/, // device-* patterns
			/^client-/, // client-* patterns
			/^jwt-/, // jwt-* patterns
			/^saml-/, // saml-* patterns
			/^par-/, // par-* patterns
			/^rar-/, // rar-* patterns
			/^redirectless/, // redirectless-* patterns
			/^hybrid/, // hybrid-* patterns
		];

		return flowStoragePatterns.some((pattern) => pattern.test(key));
	}

	/**
	 * Check if flow storage migration is needed
	 */
	static needsMigration(): boolean {
		const localStorageKeys =
			FlowStorageServiceMigration.getFlowStorageKeysFromStorage('localStorage');
		const sessionStorageKeys =
			FlowStorageServiceMigration.getFlowStorageKeysFromStorage('sessionStorage');
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
			FlowStorageServiceMigration.getFlowStorageKeysFromStorage('localStorage');
		const sessionStorageKeys =
			FlowStorageServiceMigration.getFlowStorageKeysFromStorage('sessionStorage');

		return {
			localStorageKeys: localStorageKeys.length,
			sessionStorageKeys: sessionStorageKeys.length,
			unifiedStorageKeys: 0, // TODO: Implement getFlowStorageKeyCount in unified storage
		};
	}
}

export default FlowStorageServiceMigration;
