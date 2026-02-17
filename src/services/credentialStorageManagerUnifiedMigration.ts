// src/services/credentialStorageManagerUnifiedMigration.ts
// Comprehensive migration layer for CredentialStorageManager to unified storage

import { unifiedTokenStorage } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔄 CREDENTIAL-STORAGE-MANAGER-MIGRATION]';

/**
 * Migration state tracking with proper synchronization
 */
let migrationInProgress = false;
let migrationPromise: Promise<void> | null = null;

/**
 * Ensure migration is completed before any credential storage operation
 * Uses proper synchronization to prevent race conditions
 */
const ensureMigration = async (): Promise<void> => {
	if (!migrationInProgress && !migrationPromise) {
		migrationInProgress = true;
		migrationPromise = (async () => {
			try {
				if (CredentialStorageManagerUnifiedMigration.needsMigration()) {
					console.log(`${MODULE_TAG} Starting automatic credential storage migration...`);
					const result = await CredentialStorageManagerUnifiedMigration.migrateAll();
					console.log(`${MODULE_TAG} Credential storage migration completed`, result);
				}
			} finally {
				migrationInProgress = false;
				migrationPromise = null;
			}
		})();
	}

	if (migrationPromise) {
		await migrationPromise;
	}
};

/**
 * Comprehensive credential storage migration service
 * Handles migration from localStorage/sessionStorage/file storage to unified storage
 * Provides compatibility layer for CredentialStorageManager
 */
export class CredentialStorageManagerUnifiedMigration {
	/**
	 * Migrate all existing credential storage data to unified storage
	 */
	static async migrateAll(): Promise<{ migrated: number; errors: string[] }> {
		const results = { migrated: 0, errors: [] as string[] };

		try {
			// Get all credential storage keys from localStorage
			const localStorageKeys =
				CredentialStorageManagerUnifiedMigration.getCredentialStorageKeysFromStorage(
					'localStorage'
				);
			const sessionStorageKeys =
				CredentialStorageManagerUnifiedMigration.getCredentialStorageKeysFromStorage(
					'sessionStorage'
				);
			const allKeys = [...new Set([...localStorageKeys, ...sessionStorageKeys])];

			console.log(`${MODULE_TAG} Starting comprehensive credential storage migration`, {
				localStorageKeys: localStorageKeys.length,
				sessionStorageKeys: sessionStorageKeys.length,
				totalKeys: allKeys.length,
			});

			for (const key of allKeys) {
				try {
					await CredentialStorageManagerUnifiedMigration.migrateCredentialStorageKey(key);
					results.migrated++;
				} catch (migrationError) {
					const errorMsg = `Failed to migrate credential storage key ${key}: ${migrationError}`;
					results.errors.push(errorMsg);
					console.error(`${MODULE_TAG} ${errorMsg}`);
				}
			}

			console.log(`${MODULE_TAG} Comprehensive credential storage migration completed`, results);
			return results;
		} catch (error) {
			const errorMsg = `Credential storage migration failed: ${error}`;
			results.errors.push(errorMsg);
			console.error(`${MODULE_TAG} ${errorMsg}`);
			return results;
		}
	}

	/**
	 * Migrate a single credential storage key from storage to unified storage
	 */
	private static async migrateCredentialStorageKey(key: string): Promise<void> {
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

			// Determine the type of data and migrate accordingly
			if (key.startsWith('flow_credentials_')) {
				const flowKey = key.replace('flow_credentials_', '');
				await unifiedTokenStorage.saveFlowCredentials(flowKey, data);
			} else if (key.startsWith('flow_pkce_')) {
				const flowKey = key.replace('flow_pkce_', '');
				await unifiedTokenStorage.savePKCECodes(flowKey, data);
			} else if (key.startsWith('flow_state_')) {
				const flowKey = key.replace('flow_state_', '');
				await unifiedTokenStorage.saveFlowState(flowKey, data);
			} else if (key === 'worker_token') {
				await unifiedTokenStorage.saveWorkerToken(data);
			}

			// Remove from original storage after successful migration
			if (source === 'localStorage') {
				localStorage.removeItem(key);
			} else {
				sessionStorage.removeItem(key);
			}

			console.log(`${MODULE_TAG} Migrated credential storage key`, { key, source });
		} catch (error) {
			throw new Error(
				`Failed to parse or migrate credential storage data for key ${key}: ${error}`
			);
		}
	}

	/**
	 * Get all credential storage keys from storage
	 */
	private static getCredentialStorageKeysFromStorage(
		storageType: 'localStorage' | 'sessionStorage'
	): string[] {
		const keys: string[] = [];
		const storage = storageType === 'localStorage' ? localStorage : sessionStorage;

		for (let i = 0; i < storage.length; i++) {
			const key = storage.key(i);
			if (key && CredentialStorageManagerUnifiedMigration.isCredentialStorageKey(key)) {
				keys.push(key);
			}
		}

		return keys;
	}

	/**
	 * Check if a key is a credential storage key
	 */
	private static isCredentialStorageKey(key: string): boolean {
		// Check for credential storage patterns
		const credentialStoragePatterns = [
			/^flow_credentials_/, // flow_credentials_*
			/^flow_pkce_/, // flow_pkce_*
			/^flow_state_/, // flow_state_*
			/^worker_token$/, // worker_token
		];

		return credentialStoragePatterns.some((pattern) => pattern.test(key));
	}

	/**
	 * Check if credential storage migration is needed
	 */
	static needsMigration(): boolean {
		const localStorageKeys =
			CredentialStorageManagerUnifiedMigration.getCredentialStorageKeysFromStorage('localStorage');
		const sessionStorageKeys =
			CredentialStorageManagerUnifiedMigration.getCredentialStorageKeysFromStorage(
				'sessionStorage'
			);
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
			CredentialStorageManagerUnifiedMigration.getCredentialStorageKeysFromStorage('localStorage');
		const sessionStorageKeys =
			CredentialStorageManagerUnifiedMigration.getCredentialStorageKeysFromStorage(
				'sessionStorage'
			);

		return {
			localStorageKeys: localStorageKeys.length,
			sessionStorageKeys: sessionStorageKeys.length,
			unifiedStorageKeys: 0, // TODO: Implement getCredentialStorageKeyCount in unified storage
		};
	}
}

/**
 * Unified Credential Storage Manager - Compatibility Layer
 * Provides backward compatibility with CredentialStorageManager using unified storage
 */
export class UnifiedCredentialStorageManager {
	/**
	 * Load flow credentials with automatic migration
	 */
	static async loadFlowCredentials(flowKey: string): Promise<{
		success: boolean;
		data: unknown;
		source: string;
		timestamp?: number;
		error?: string;
	}> {
		await ensureMigration();
		return await unifiedTokenStorage.loadFlowCredentials(flowKey);
	}

	/**
	 * Save flow credentials with automatic migration
	 */
	static async saveFlowCredentials(
		flowKey: string,
		credentials: unknown
	): Promise<{ success: boolean; source: string; error?: string }> {
		await ensureMigration();
		return await unifiedTokenStorage.saveFlowCredentials(flowKey, credentials);
	}

	/**
	 * Clear flow credentials
	 */
	static async clearFlowCredentials(flowKey: string): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.clearFlowCredentials(flowKey);
	}

	/**
	 * Clear all credentials
	 */
	static async clearAll(): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.clearAllCredentials();
	}

	/**
	 * Save PKCE codes
	 */
	static async savePKCECodes(
		flowKey: string,
		pkceCodes: {
			codeVerifier: string;
			codeChallenge: string;
			codeChallengeMethod: 'S256' | 'plain';
		}
	): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.savePKCECodes(flowKey, pkceCodes);
	}

	/**
	 * Load PKCE codes
	 */
	static async loadPKCECodes(flowKey: string): Promise<{
		codeVerifier: string;
		codeChallenge: string;
		codeChallengeMethod: 'S256' | 'plain';
	} | null> {
		await ensureMigration();
		return await unifiedTokenStorage.loadPKCECodes(flowKey);
	}

	/**
	 * Clear PKCE codes
	 */
	static async clearPKCECodes(flowKey: string): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.clearPKCECodes(flowKey);
	}

	/**
	 * Save flow state
	 */
	static async saveFlowState(flowKey: string, state: unknown): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.saveFlowState(flowKey, state);
	}

	/**
	 * Load flow state
	 */
	static async loadFlowState(flowKey: string): Promise<unknown | null> {
		await ensureMigration();
		return await unifiedTokenStorage.loadFlowState(flowKey);
	}

	/**
	 * Clear flow state
	 */
	static async clearFlowState(flowKey: string): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.clearFlowState(flowKey);
	}

	/**
	 * Save worker token
	 */
	static async saveWorkerToken(data: {
		accessToken: string;
		expiresAt: number;
		environmentId: string;
	}): Promise<{ success: boolean; source: string; error?: string }> {
		await ensureMigration();
		return await unifiedTokenStorage.saveWorkerToken(data);
	}

	/**
	 * Load worker token
	 */
	static async loadWorkerToken(): Promise<{
		accessToken: string;
		expiresAt: number;
		environmentId: string;
	} | null> {
		await ensureMigration();
		return await unifiedTokenStorage.loadWorkerToken();
	}

	/**
	 * Clear worker token
	 */
	static async clearWorkerToken(): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.clearWorkerToken();
	}

	/**
	 * Clear all data for a specific flow
	 */
	static async clearAllFlowData(flowKey: string): Promise<void> {
		await ensureMigration();

		// Clear all data types for the flow
		await Promise.all([
			UnifiedCredentialStorageManager.clearFlowCredentials(flowKey),
			UnifiedCredentialStorageManager.clearPKCECodes(flowKey),
			UnifiedCredentialStorageManager.clearFlowState(flowKey),
		]);

		console.log(`${MODULE_TAG} Cleared all data for flow: ${flowKey}`);
	}

	/**
	 * Export all credential storage data
	 */
	static async export(): Promise<string> {
		await ensureMigration();

		// Get all credential tokens from unified storage
		const credentialTokensResult = await unifiedTokenStorage.getTokens({
			type: 'oauth_credentials' as any,
		});
		const pkceTokensResult = await unifiedTokenStorage.getTokens({ type: 'pkce_state' as any });
		const flowStateTokensResult = await unifiedTokenStorage.getTokens({
			type: 'flow_state' as any,
		});
		const workerTokensResult = await unifiedTokenStorage.getTokens({ type: 'worker_token' as any });

		// Extract arrays from results
		const credentialTokens = Array.isArray(credentialTokensResult) ? credentialTokensResult : [];
		const pkceTokens = Array.isArray(pkceTokensResult) ? pkceTokensResult : [];
		const flowStateTokens = Array.isArray(flowStateTokensResult) ? flowStateTokensResult : [];
		const workerTokens = Array.isArray(workerTokensResult) ? workerTokensResult : [];

		const data: Record<string, unknown> = {};

		// Process credential tokens
		for (let i = 0; i < credentialTokens.length; i++) {
			const token = credentialTokens[i];
			try {
				const flowKey = token.flowName || 'unknown';
				data[`flow_credentials_${flowKey}`] = token.value;
			} catch {
				console.warn(`${MODULE_TAG} Failed to process credential token for export`, {
					id: token.id,
				});
			}
		}

		// Process PKCE tokens
		for (let i = 0; i < pkceTokens.length; i++) {
			const token = pkceTokens[i];
			try {
				const flowKey = token.flowName || 'unknown';
				data[`flow_pkce_${flowKey}`] = JSON.parse(token.value as string);
			} catch {
				console.warn(`${MODULE_TAG} Failed to process PKCE token for export`, { id: token.id });
			}
		}

		// Process flow state tokens
		for (let i = 0; i < flowStateTokens.length; i++) {
			const token = flowStateTokens[i];
			try {
				const flowKey = token.flowName || 'unknown';
				data[`flow_state_${flowKey}`] = JSON.parse(token.value as string);
			} catch {
				console.warn(`${MODULE_TAG} Failed to process flow state token for export`, {
					id: token.id,
				});
			}
		}

		// Process worker token
		for (let i = 0; i < workerTokens.length; i++) {
			const token = workerTokens[i];
			try {
				data['worker_token'] = JSON.parse(token.value as string);
			} catch {
				console.warn(`${MODULE_TAG} Failed to process worker token for export`, { id: token.id });
			}
		}

		const exported = JSON.stringify(data, null, 2);

		console.log(`${MODULE_TAG} Credential storage data exported`, {
			credentialCount: credentialTokens.length || 0,
			pkceCount: pkceTokens.length || 0,
			flowStateCount: flowStateTokens.length || 0,
			workerTokenCount: workerTokens.length || 0,
			size: exported.length,
		});

		return exported;
	}

	/**
	 * Import credential storage data
	 */
	static async import(jsonData: string, overwrite = false): Promise<void> {
		await ensureMigration();

		try {
			const data: Record<string, unknown> = JSON.parse(jsonData);

			let imported = 0;
			let skipped = 0;

			for (const [key, value] of Object.entries(data)) {
				try {
					if (key.startsWith('flow_credentials_')) {
						const flowKey = key.replace('flow_credentials_', '');

						// Check if data already exists
						if (!overwrite) {
							const existing = await unifiedTokenStorage.loadFlowCredentials(flowKey);
							if (existing.success) {
								skipped++;
								continue;
							}
						}

						await unifiedTokenStorage.saveFlowCredentials(flowKey, value);
						imported++;
					} else if (key.startsWith('flow_pkce_')) {
						const flowKey = key.replace('flow_pkce_', '');

						// Check if data already exists
						if (!overwrite) {
							const existing = await unifiedTokenStorage.loadPKCECodes(flowKey);
							if (existing) {
								skipped++;
								continue;
							}
						}

						await unifiedTokenStorage.savePKCECodes(
							flowKey,
							value as {
								codeVerifier: string;
								codeChallenge: string;
								codeChallengeMethod: 'S256' | 'plain';
							}
						);
						imported++;
					} else if (key.startsWith('flow_state_')) {
						const flowKey = key.replace('flow_state_', '');

						// Check if data already exists
						if (!overwrite) {
							const existing = await unifiedTokenStorage.loadFlowState(flowKey);
							if (existing) {
								skipped++;
								continue;
							}
						}

						await unifiedTokenStorage.saveFlowState(flowKey, value);
						imported++;
					} else if (key === 'worker_token') {
						// Check if data already exists
						if (!overwrite) {
							const existing = await unifiedTokenStorage.loadWorkerToken();
							if (existing) {
								skipped++;
								continue;
							}
						}

						await unifiedTokenStorage.saveWorkerToken(
							value as {
								accessToken: string;
								expiresAt: number;
								environmentId: string;
							}
						);
						imported++;
					}
				} catch (error) {
					console.error(
						`${MODULE_TAG} Failed to import credential storage data for key ${key}`,
						error
					);
				}
			}

			console.log(`${MODULE_TAG} Credential storage data imported`, {
				imported,
				skipped,
				total: Object.keys(data).length,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to import credential storage data`, error);
			throw error;
		}
	}
}

export default CredentialStorageManagerUnifiedMigration;
