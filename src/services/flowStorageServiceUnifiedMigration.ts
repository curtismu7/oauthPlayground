// src/services/flowStorageServiceUnifiedMigration.ts
// Comprehensive migration layer for FlowStorageService to unified storage

import { unifiedTokenStorage } from './unifiedTokenStorageService';

const MODULE_TAG = '[🔄 FLOW-STORAGE-UNIFIED-MIGRATION]';

/**
 * Migration state tracking
 */
let migrationCompleted = false;

/**
 * Ensure migration is completed before any flow storage operation
 */
const ensureMigration = async (): Promise<void> => {
	if (!migrationCompleted) {
		if (FlowStorageUnifiedMigration.needsMigration()) {
			console.log(`${MODULE_TAG} Starting automatic flow storage migration...`);
			const result = await FlowStorageUnifiedMigration.migrateAll();
			console.log(`${MODULE_TAG} Flow storage migration completed`, result);
		}
		migrationCompleted = true;
	}
};

/**
 * Comprehensive flow storage migration service
 * Handles migration from localStorage/sessionStorage to unified storage
 * Provides compatibility layer for all FlowStorageService classes
 */
export class FlowStorageUnifiedMigration {
	/**
	 * Migrate all existing flow storage data from localStorage/sessionStorage to unified storage
	 */
	static async migrateAll(): Promise<{ migrated: number; errors: string[] }> {
		const results = { migrated: 0, errors: [] as string[] };

		try {
			// Get all flow storage keys from localStorage and sessionStorage
			const localStorageKeys =
				FlowStorageUnifiedMigration.getFlowStorageKeysFromStorage('localStorage');
			const sessionStorageKeys =
				FlowStorageUnifiedMigration.getFlowStorageKeysFromStorage('sessionStorage');
			const allKeys = [...new Set([...localStorageKeys, ...sessionStorageKeys])];

			console.log(`${MODULE_TAG} Starting comprehensive flow storage migration`, {
				localStorageKeys: localStorageKeys.length,
				sessionStorageKeys: sessionStorageKeys.length,
				totalKeys: allKeys.length,
			});

			for (const key of allKeys) {
				try {
					await FlowStorageUnifiedMigration.migrateFlowStorageKey(key);
					results.migrated++;
				} catch (error) {
					const errorMsg = `Failed to migrate flow storage key ${key}: ${error}`;
					results.errors.push(errorMsg);
					console.error(`${MODULE_TAG} ${errorMsg}`);
				}
			}

			console.log(`${MODULE_TAG} Comprehensive flow storage migration completed`, results);
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

			// Extract storage info from key
			const parts = key.split(':');
			if (parts.length >= 3) {
				const storageType = parts[0] as 'session' | 'local';
				const flowId = parts[1];
				const dataType = parts.slice(2).join(':');

				// Save to unified storage
				await unifiedTokenStorage.saveFlowStorageData(storageType, flowId, dataType, data);

				// Remove from original storage after successful migration
				if (source === 'localStorage') {
					localStorage.removeItem(key);
				} else {
					sessionStorage.removeItem(key);
				}

				console.log(`${MODULE_TAG} Migrated flow storage key`, {
					key,
					source,
					storageType,
					flowId,
					dataType,
				});
			}
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
			if (key && FlowStorageUnifiedMigration.isFlowStorageKey(key)) {
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
			FlowStorageUnifiedMigration.getFlowStorageKeysFromStorage('localStorage');
		const sessionStorageKeys =
			FlowStorageUnifiedMigration.getFlowStorageKeysFromStorage('sessionStorage');
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
			FlowStorageUnifiedMigration.getFlowStorageKeysFromStorage('localStorage');
		const sessionStorageKeys =
			FlowStorageUnifiedMigration.getFlowStorageKeysFromStorage('sessionStorage');

		return {
			localStorageKeys: localStorageKeys.length,
			sessionStorageKeys: sessionStorageKeys.length,
			unifiedStorageKeys: 0, // TODO: Implement getFlowStorageKeyCount in unified storage
		};
	}
}

/**
 * Unified Flow Storage Service - Compatibility Layer
 * Provides backward compatibility with FlowStorageService using unified storage
 */
export class UnifiedFlowStorageService {
	/**
	 * Save flow storage data with automatic migration
	 */
	static async save(
		storageType: 'session' | 'local',
		flowId: string,
		dataType: string,
		data: unknown
	): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.saveFlowStorageData(storageType, flowId, dataType, data);
	}

	/**
	 * Load flow storage data with automatic migration
	 */
	static async load(
		storageType: 'session' | 'local',
		flowId: string,
		dataType: string
	): Promise<unknown | null> {
		await ensureMigration();
		return await unifiedTokenStorage.loadFlowStorageData(storageType, flowId, dataType);
	}

	/**
	 * Remove flow storage data
	 */
	static async remove(
		storageType: 'session' | 'local',
		flowId: string,
		dataType: string
	): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.removeFlowStorageData(storageType, flowId, dataType);
	}

	/**
	 * Check if flow storage data exists
	 */
	static async has(
		storageType: 'session' | 'local',
		flowId: string,
		dataType: string
	): Promise<boolean> {
		await ensureMigration();
		return await unifiedTokenStorage.hasFlowStorageData(storageType, flowId, dataType);
	}

	/**
	 * Clear all flow storage data for a flow
	 */
	static async clear(flowId: string): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.clearFlowStorageData(flowId);
	}

	/**
	 * Export all flow storage data
	 */
	static async export(): Promise<string> {
		await ensureMigration();
		return await unifiedTokenStorage.exportAllFlowStorageData();
	}

	/**
	 * Import flow storage data
	 */
	static async import(jsonData: string, overwrite = false): Promise<void> {
		await ensureMigration();
		await unifiedTokenStorage.importAllFlowStorageData(jsonData, overwrite);
	}
}

/**
 * Compatibility wrapper for AuthCodeStorage class
 */
export class UnifiedAuthCodeStorage {
	static async save(
		flowId: string,
		data: { code: string; timestamp: number; expiresAt?: number }
	): Promise<void> {
		await UnifiedFlowStorageService.save('session', flowId, 'auth-code', data);
	}

	static async load(
		flowId: string
	): Promise<{ code: string; timestamp: number; expiresAt?: number } | null> {
		const data = await UnifiedFlowStorageService.load('session', flowId, 'auth-code');
		return data as { code: string; timestamp: number; expiresAt?: number } | null;
	}

	static async remove(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('session', flowId, 'auth-code');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('session', flowId, 'auth-code');
	}
}

/**
 * Compatibility wrapper for StateStorage class
 */
export class UnifiedStateStorage {
	static async save(flowId: string, data: { state: string; timestamp: number }): Promise<void> {
		await UnifiedFlowStorageService.save('session', flowId, 'state', data);
	}

	static async load(flowId: string): Promise<{ state: string; timestamp: number } | null> {
		const data = await UnifiedFlowStorageService.load('session', flowId, 'state');
		return data as { state: string; timestamp: number } | null;
	}

	static async remove(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('session', flowId, 'state');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('session', flowId, 'state');
	}
}

/**
 * Compatibility wrapper for PKCEStorage class
 */
export class UnifiedPKCEStorage {
	static async save(
		flowId: string,
		data: { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' | 'plain' }
	): Promise<void> {
		await UnifiedFlowStorageService.save('session', flowId, 'pkce', data);
	}

	static async load(flowId: string): Promise<{
		codeVerifier: string;
		codeChallenge: string;
		codeChallengeMethod: 'S256' | 'plain';
	} | null> {
		const data = await UnifiedFlowStorageService.load('session', flowId, 'pkce');
		return data as {
			codeVerifier: string;
			codeChallenge: string;
			codeChallengeMethod: 'S256' | 'plain';
		} | null;
	}

	static async remove(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('session', flowId, 'pkce');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('session', flowId, 'pkce');
	}
}

/**
 * Compatibility wrapper for TokenStorage class
 */
export class UnifiedTokenStorage {
	static async save(
		flowId: string,
		data: {
			access_token: string;
			refresh_token?: string;
			id_token?: string;
			token_type: string;
			expires_in: number;
			scope?: string;
			[key: string]: unknown;
		}
	): Promise<void> {
		await UnifiedFlowStorageService.save('local', flowId, 'tokens', data);
	}

	static async load(flowId: string): Promise<{
		access_token: string;
		refresh_token?: string;
		id_token?: string;
		token_type: string;
		expires_in: number;
		scope?: string;
		[key: string]: unknown;
	} | null> {
		const data = await UnifiedFlowStorageService.load('local', flowId, 'tokens');
		return data as {
			access_token: string;
			refresh_token?: string;
			id_token?: string;
			token_type: string;
			expires_in: number;
			scope?: string;
			[key: string]: unknown;
		} | null;
	}

	static async remove(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('local', flowId, 'tokens');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('local', flowId, 'tokens');
	}
}

/**
 * Compatibility wrapper for CredentialsStorage class
 */
export class UnifiedCredentialsStorage {
	static async save(
		flowId: string,
		data: {
			environmentId: string;
			clientId: string;
			clientSecret?: string;
			redirectUri: string;
			scopes: string;
			[key: string]: unknown;
		}
	): Promise<void> {
		await UnifiedFlowStorageService.save('local', flowId, 'credentials', data);
	}

	static async load(flowId: string): Promise<{
		environmentId: string;
		clientId: string;
		clientSecret?: string;
		redirectUri: string;
		scopes: string;
		[key: string]: unknown;
	} | null> {
		const data = await UnifiedFlowStorageService.load('local', flowId, 'credentials');
		return data as {
			environmentId: string;
			clientId: string;
			clientSecret?: string;
			redirectUri: string;
			scopes: string;
			[key: string]: unknown;
		} | null;
	}

	static async remove(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('local', flowId, 'credentials');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('local', flowId, 'credentials');
	}
}

/**
 * Compatibility wrapper for NavigationStorage class
 */
export class UnifiedNavigationStorage {
	static async save(
		flowId: string,
		data: {
			flowId: string;
			currentStep: number;
			returnPath?: string;
			context?: Record<string, unknown>;
		}
	): Promise<void> {
		await UnifiedFlowStorageService.save('session', flowId, 'navigation', data);
	}

	static async load(flowId: string): Promise<{
		flowId: string;
		currentStep: number;
		returnPath?: string;
		context?: Record<string, unknown>;
	} | null> {
		const data = await UnifiedFlowStorageService.load('session', flowId, 'navigation');
		return data as {
			flowId: string;
			currentStep: number;
			returnPath?: string;
			context?: Record<string, unknown>;
		} | null;
	}

	static async remove(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('session', flowId, 'navigation');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('session', flowId, 'navigation');
	}

	static async clearFlowContext(): Promise<void> {
		// Clear all navigation data
		// This would need to be implemented based on specific requirements
		console.log(`${MODULE_TAG} Clear flow context called`);
	}

	static async removeRestoreStep(): Promise<void> {
		// Remove restore step data
		// This would need to be implemented based on specific requirements
		console.log(`${MODULE_TAG} Remove restore step called`);
	}
}

/**
 * Compatibility wrapper for DeviceCodeStorage class
 */
export class UnifiedDeviceCodeStorage {
	static async save(
		flowId: string,
		data: {
			device_code: string;
			user_code: string;
			verification_uri: string;
			verification_uri_complete?: string;
			expires_in: number;
			interval: number;
			timestamp: number;
		}
	): Promise<void> {
		await UnifiedFlowStorageService.save('session', flowId, 'device-code', data);
	}

	static async load(flowId: string): Promise<{
		device_code: string;
		user_code: string;
		verification_uri: string;
		verification_uri_complete?: string;
		expires_in: number;
		interval: number;
		timestamp: number;
	} | null> {
		const data = await UnifiedFlowStorageService.load('session', flowId, 'device-code');
		return data as {
			device_code: string;
			user_code: string;
			verification_uri: string;
			verification_uri_complete?: string;
			expires_in: number;
			interval: number;
			timestamp: number;
		} | null;
	}

	static async remove(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('session', flowId, 'device-code');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('session', flowId, 'device-code');
	}
}

/**
 * Compatibility wrapper for AdvancedParametersStorage class
 */
export class UnifiedAdvancedParametersStorage {
	static async save(
		flowId: string,
		data: {
			audience?: string;
			resources?: string[];
			displayMode?: string;
			promptValues?: string[];
			claimsRequest?: Record<string, unknown> | null;
			uiLocales?: string;
			claimsLocales?: string;
			loginHint?: string;
			acrValues?: string[];
			maxAge?: number;
		}
	): Promise<void> {
		await UnifiedFlowStorageService.save('local', flowId, 'advanced-parameters', data);
	}

	static async load(flowId: string): Promise<{
		audience?: string;
		resources?: string[];
		displayMode?: string;
		promptValues?: string[];
		claimsRequest?: Record<string, unknown> | null;
		uiLocales?: string;
		claimsLocales?: string;
		loginHint?: string;
		acrValues?: string[];
		maxAge?: number;
	} | null> {
		const data = await UnifiedFlowStorageService.load('local', flowId, 'advanced-parameters');
		return data as {
			audience?: string;
			resources?: string[];
			displayMode?: string;
			promptValues?: string[];
			claimsRequest?: Record<string, unknown> | null;
			uiLocales?: string;
			claimsLocales?: string;
			loginHint?: string;
			acrValues?: string[];
			maxAge?: number;
		} | null;
	}

	static async update(
		flowId: string,
		updates: Partial<{
			audience?: string;
			resources?: string[];
			displayMode?: string;
			promptValues?: string[];
			claimsRequest?: Record<string, unknown> | null;
			uiLocales?: string;
			claimsLocales?: string;
			loginHint?: string;
			acrValues?: string[];
			maxAge?: number;
		}>
	): Promise<void> {
		const existing = (await UnifiedAdvancedParametersStorage.load(flowId)) || {};
		const merged = { ...existing, ...updates };
		await UnifiedAdvancedParametersStorage.save(flowId, merged);
	}

	static async clear(flowId: string): Promise<void> {
		await UnifiedFlowStorageService.remove('local', flowId, 'advanced-parameters');
	}

	static async has(flowId: string): Promise<boolean> {
		return await UnifiedFlowStorageService.has('local', flowId, 'advanced-parameters');
	}
}

export default FlowStorageUnifiedMigration;
