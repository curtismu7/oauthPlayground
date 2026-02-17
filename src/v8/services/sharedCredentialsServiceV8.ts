/**
 * @file sharedCredentialsServiceV8.ts
 * @module v8/services
 * @description Service for managing shared credentials across all V8U flow types
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This service manages credentials that should be shared across all flow types:
 * - Environment ID (also stored globally via EnvironmentIdServiceV8)
 * - Client ID
 * - Client Secret
 * - Issuer URL
 * - Client Auth Method (default)
 *
 * Flow-specific credentials (redirectUri, scopes, responseType) are stored per flow type.
 *
 * Uses dual storage: browser storage first, then disk fallback.
 */

const MODULE_TAG = '[🔗 SHARED-CREDENTIALS-V8]';

const BROWSER_STORAGE_KEY = 'v8_shared_credentials';

export interface SharedCredentials {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	issuerUrl?: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

export class SharedCredentialsServiceV8 {
	/**
	 * Load shared credentials from storage (browser first, then disk)
	 * @returns Shared credentials object
	 */
	static async loadSharedCredentials(): Promise<SharedCredentials> {
		console.log(`${MODULE_TAG} Loading shared credentials from localStorage`);

		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				const credentials = JSON.parse(stored) as SharedCredentials;
				console.log(`${MODULE_TAG} Loaded shared credentials from localStorage`);
				return credentials;
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to load from localStorage`, error);
		}

		console.log(`${MODULE_TAG} No shared credentials found`);
		return {};
	}

	/**
	 * Synchronous version for backwards compatibility (browser storage only)
	 * @returns Shared credentials object
	 */
	static loadSharedCredentialsSync(): SharedCredentials {
		console.log(`${MODULE_TAG} Loading shared credentials from browser storage (sync)`);

		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as SharedCredentials;
				console.log(`${MODULE_TAG} Shared credentials loaded from browser`, {
					hasEnvId: !!parsed.environmentId,
					hasClientId: !!parsed.clientId,
				});
				return parsed;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Error loading shared credentials from browser`, { error });
		}

		return {};
	}

	/**
	 * Save shared credentials to storage
	 * - Client secret is ONLY saved to browser localStorage (not disk) for security
	 * - All credentials are saved to browser storage only (disk storage is disabled)
	 * @param credentials - Shared credentials to save
	 */
	static async saveSharedCredentials(credentials: SharedCredentials): Promise<void> {
		console.log(`${MODULE_TAG} Saving shared credentials to browser storage`, {
			hasEnvId: !!credentials.environmentId,
			hasClientId: !!credentials.clientId,
			hasClientSecret: !!credentials.clientSecret,
		});

		try {
			// Load existing shared credentials (sync for merge)
			const existing = SharedCredentialsServiceV8.loadSharedCredentialsSync();

			// Merge with new credentials (only update fields that are provided)
			const merged: SharedCredentials = {
				...existing,
				...(credentials.environmentId && { environmentId: credentials.environmentId }),
				...(credentials.clientId && { clientId: credentials.clientId }),
				...(credentials.clientSecret !== undefined && { clientSecret: credentials.clientSecret }),
				...(credentials.issuerUrl !== undefined && { issuerUrl: credentials.issuerUrl }),
				...(credentials.clientAuthMethod && { clientAuthMethod: credentials.clientAuthMethod }),
			};

			// Save to browser storage only (includes client secret)
			// Note: Disk storage is disabled for security - client secrets should never be on disk
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(merged));
			console.log(
				`${MODULE_TAG} Shared credentials saved to browser storage (client secret included)`
			);
		} catch (error) {
			console.error(`${MODULE_TAG} Error saving shared credentials`, { error });
		}
	}

	/**
	 * Synchronous version for backwards compatibility (browser storage only)
	 * @param credentials - Shared credentials to save
	 */
	static saveSharedCredentialsSync(credentials: SharedCredentials): void {
		console.log(`${MODULE_TAG} Saving shared credentials to browser storage (sync)`, {
			hasEnvId: !!credentials.environmentId,
			hasClientId: !!credentials.clientId,
		});

		try {
			// Load existing shared credentials
			const existing = SharedCredentialsServiceV8.loadSharedCredentialsSync();

			// Merge with new credentials
			const merged: SharedCredentials = {
				...existing,
				...(credentials.environmentId && { environmentId: credentials.environmentId }),
				...(credentials.clientId && { clientId: credentials.clientId }),
				...(credentials.clientSecret !== undefined && { clientSecret: credentials.clientSecret }),
				...(credentials.issuerUrl !== undefined && { issuerUrl: credentials.issuerUrl }),
				...(credentials.clientAuthMethod && { clientAuthMethod: credentials.clientAuthMethod }),
			};

			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(merged));
			console.log(`${MODULE_TAG} Shared credentials saved to browser storage`);
		} catch (error) {
			console.error(`${MODULE_TAG} Error saving shared credentials to browser`, { error });
		}
	}

	/**
	 * Merge shared credentials with flow-specific credentials (async)
	 * @param flowSpecificCredentials - Flow-specific credentials
	 * @returns Merged credentials with shared values applied
	 */
	static async mergeWithShared<T extends Record<string, unknown>>(
		flowSpecificCredentials: T
	): Promise<T & SharedCredentials> {
		const shared = await SharedCredentialsServiceV8.loadSharedCredentials();

		const merged: T & SharedCredentials = {
			...flowSpecificCredentials,
			// Only apply shared values if flow-specific doesn't have them
			environmentId:
				(flowSpecificCredentials.environmentId as string) || shared.environmentId || '',
			clientId: (flowSpecificCredentials.clientId as string) || shared.clientId || '',
			...(shared.clientSecret !== undefined && { clientSecret: shared.clientSecret }),
			...(shared.issuerUrl !== undefined && { issuerUrl: shared.issuerUrl }),
			...(shared.clientAuthMethod && { clientAuthMethod: shared.clientAuthMethod }),
		};

		return merged;
	}

	/**
	 * Merge shared credentials with flow-specific credentials (sync, browser only)
	 * @param flowSpecificCredentials - Flow-specific credentials
	 * @returns Merged credentials with shared values applied
	 */
	static mergeWithSharedSync<T extends Record<string, unknown>>(
		flowSpecificCredentials: T
	): T & SharedCredentials {
		const shared = SharedCredentialsServiceV8.loadSharedCredentialsSync();

		const merged: T & SharedCredentials = {
			...flowSpecificCredentials,
			// Only apply shared values if flow-specific doesn't have them
			environmentId:
				(flowSpecificCredentials.environmentId as string) || shared.environmentId || '',
			clientId: (flowSpecificCredentials.clientId as string) || shared.clientId || '',
			...(shared.clientSecret !== undefined && { clientSecret: shared.clientSecret }),
			...(shared.issuerUrl !== undefined && { issuerUrl: shared.issuerUrl }),
			...(shared.clientAuthMethod && { clientAuthMethod: shared.clientAuthMethod }),
		};

		return merged;
	}

	/**
	 * Extract shared credentials from full credentials object
	 * @param credentials - Full credentials object
	 * @returns Shared credentials subset
	 */
	static extractSharedCredentials(credentials: Record<string, unknown>): SharedCredentials {
		const result: SharedCredentials = {};

		if (credentials.environmentId) {
			result.environmentId = credentials.environmentId as string;
		}
		if (credentials.clientId) {
			result.clientId = credentials.clientId as string;
		}
		if (credentials.clientSecret !== undefined) {
			result.clientSecret = credentials.clientSecret as string;
		}
		if (credentials.issuerUrl !== undefined) {
			result.issuerUrl = credentials.issuerUrl as string;
		}
		if (credentials.clientAuthMethod) {
			const authMethod = credentials.clientAuthMethod as SharedCredentials['clientAuthMethod'];
			if (authMethod) {
				result.clientAuthMethod = authMethod;
			}
		}

		return result;
	}

	/**
	 * Clear shared credentials from storage (localStorage)
	 */
	static async clearSharedCredentials(): Promise<void> {
		console.log(`${MODULE_TAG} Clearing shared credentials from localStorage`);
		try {
			localStorage.removeItem(BROWSER_STORAGE_KEY);
			console.log(`${MODULE_TAG} Shared credentials cleared successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Error clearing shared credentials`, { error });
		}
	}
}
