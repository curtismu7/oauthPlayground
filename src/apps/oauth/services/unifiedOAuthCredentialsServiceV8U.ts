/**
 * @file unifiedOAuthCredentialsServiceV8U.ts
 * @module apps/oauth/services
 * @description Enhanced credentials service with SQLite backup for Unified OAuth flows - OAUTH SERVICE
 * @version 8.0.0
 * @since 2026-02-05
 *
 * Extends the existing credentials service with SQLite backup integration.
 * Provides 4-layer storage: Memory → localStorage → IndexedDB → SQLite backup.
 */

import { logger } from './unifiedFlowLoggerServiceV8U';
import {
	type BackupOptions,
	type OAuthBackupData,
	UnifiedOAuthBackupServiceV8U,
} from './unifiedOAuthBackupServiceV8U';

const _MODULE_TAG = '[🔐 UNIFIED-OAUTH-CREDENTIALS-OAUTH]';

export interface UnifiedOAuthCredentials {
	// Flow-specific credentials
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scope?: string;
	state?: string;
	nonce?: string;
	codeVerifier?: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;

	// Environment settings
	environmentId?: string;
	baseUrl?: string;
	issuer?: string;

	// Flow state
	flowType?: string;
	specVersion?: string;
	currentStep?: number;

	// Tokens and responses
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	tokenType?: string;
	expiresIn?: number;

	// Timestamps
	createdAt?: number;
	updatedAt?: number;
	expiresAt?: number;
}

export interface SharedOAuthCredentials {
	// Shared across flows
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	baseUrl?: string;
	issuer?: string;

	// User preferences
	defaultFlowType?: string;
	defaultSpecVersion?: string;
	rememberCredentials?: boolean;

	// Timestamps
	createdAt?: number;
	updatedAt?: number;
}

/**
 * Enhanced credentials service with SQLite backup for Unified OAuth flows
 */
export class UnifiedOAuthCredentialsServiceV8U {
	private static readonly STORAGE_PREFIX = 'unified_oauth_';
	private static readonly SHARED_PREFIX = 'unified_oauth_shared_';
	private static readonly BACKUP_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

	/**
	 * Save flow-specific credentials with SQLite backup
	 */
	static async saveCredentials(
		flowKey: string,
		credentials: UnifiedOAuthCredentials,
		options?: {
			environmentId?: string;
			enableBackup?: boolean;
			backupExpiry?: number;
		}
	): Promise<void> {
		try {
			// Add timestamps
			const now = Date.now();
			const credentialsWithTimestamps = {
				...credentials,
				updatedAt: now,
				createdAt: credentials.createdAt || now,
			};

			// Save to localStorage (immediate)
			const storageKey = `${UnifiedOAuthCredentialsServiceV8U.STORAGE_PREFIX}${flowKey}`;
			localStorage.setItem(storageKey, JSON.stringify(credentialsWithTimestamps));

			// Save to IndexedDB (persistent)
			if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
				try {
					await (window as any).IndexedDBBackupServiceV8U.save(
						storageKey,
						credentialsWithTimestamps,
						'credentials'
					);
				} catch (error) {
					logger.warn(`${_MODULE_TAG} IndexedDB save failed`, { flowKey, error });
				}
			}

			// Save to SQLite backup (server-side)
			if (options?.enableBackup && options.environmentId) {
				const backupData: OAuthBackupData = {
					flowType: credentials.flowType || 'unknown',
					specVersion: credentials.specVersion || 'oauth2.0',
					credentials: credentialsWithTimestamps,
					sharedCredentials: {}, // Will be loaded separately
					environmentId: options.environmentId,
					flowKey,
					timestamp: now,
					expiresAt: options.backupExpiry ? now + options.backupExpiry : undefined,
				};

				const backupOptions: BackupOptions = {
					environmentId: options.environmentId,
					expiresIn: options.backupExpiry || UnifiedOAuthCredentialsServiceV8U.BACKUP_EXPIRY,
					dataType: 'credentials',
				};

				await UnifiedOAuthBackupServiceV8U.saveOAuthBackup(storageKey, backupData, backupOptions);
			}

			logger.info(`${_MODULE_TAG} ✅ Credentials saved`, {
				flowKey,
				environmentId: options?.environmentId,
				hasBackup: !!options?.enableBackup,
			});
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to save credentials`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Load flow-specific credentials with SQLite backup fallback
	 */
	static async loadCredentials(
		flowKey: string,
		options?: {
			environmentId?: string;
			enableBackup?: boolean;
		}
	): Promise<UnifiedOAuthCredentials | null> {
		try {
			const storageKey = `${UnifiedOAuthCredentialsServiceV8U.STORAGE_PREFIX}${flowKey}`;

			// Try localStorage first (fastest)
			const localData = localStorage.getItem(storageKey);
			if (localData) {
				const credentials = JSON.parse(localData);
				logger.debug(`${_MODULE_TAG} ✅ Loaded from localStorage`, { flowKey });

				// Trigger async backup refresh if enabled
				if (options?.enableBackup && options.environmentId) {
					UnifiedOAuthCredentialsServiceV8U.refreshFromBackup(flowKey, options.environmentId).catch(
						() => {}
					); // Ignore errors in background refresh
				}

				return credentials;
			}

			// Try IndexedDB (persistent)
			if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
				try {
					const indexedData = await (
						window as any
					).IndexedDBBackupServiceV8U.load<UnifiedOAuthCredentials>(storageKey);
					if (indexedData) {
						// Cache to localStorage for next time
						localStorage.setItem(storageKey, JSON.stringify(indexedData));
						logger.debug(`${_MODULE_TAG} ✅ Loaded from IndexedDB`, { flowKey });
						return indexedData;
					}
				} catch (error) {
					logger.warn(`${_MODULE_TAG} IndexedDB load failed`, { flowKey, error });
				}
			}

			// Try SQLite backup (server-side)
			if (options?.enableBackup && options.environmentId) {
				const backupData = await UnifiedOAuthBackupServiceV8U.loadOAuthBackup(
					storageKey,
					options.environmentId
				);

				if (backupData?.credentials) {
					// Restore to localStorage and IndexedDB
					localStorage.setItem(storageKey, JSON.stringify(backupData.credentials));

					if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
						try {
							await (window as any).IndexedDBBackupServiceV8U.save(
								storageKey,
								backupData.credentials,
								'credentials'
							);
						} catch (error) {
							logger.warn(`${_MODULE_TAG} IndexedDB restore failed`, { flowKey, error });
						}
					}

					logger.info(`${_MODULE_TAG} ✅ Loaded from SQLite backup`, { flowKey });
					return backupData.credentials;
				}
			}

			logger.debug(`${_MODULE_TAG} No credentials found`, { flowKey });
			return null;
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to load credentials`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Save shared credentials with SQLite backup
	 */
	static async saveSharedCredentials(
		sharedCredentials: SharedOAuthCredentials,
		options?: {
			environmentId?: string;
			enableBackup?: boolean;
			backupExpiry?: number;
		}
	): Promise<void> {
		try {
			// Add timestamps
			const now = Date.now();
			const credentialsWithTimestamps = {
				...sharedCredentials,
				updatedAt: now,
				createdAt: sharedCredentials.createdAt || now,
			};

			// Save to localStorage
			const storageKey = UnifiedOAuthCredentialsServiceV8U.SHARED_PREFIX;
			localStorage.setItem(storageKey, JSON.stringify(credentialsWithTimestamps));

			// Save to IndexedDB
			if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
				try {
					await (window as any).IndexedDBBackupServiceV8U.save(
						storageKey,
						credentialsWithTimestamps,
						'shared-credentials'
					);
				} catch (error) {
					logger.warn(`${_MODULE_TAG} Shared IndexedDB save failed`, { error });
				}
			}

			// Save to SQLite backup
			if (options?.enableBackup && options.environmentId) {
				const backupData: OAuthBackupData = {
					flowType: 'shared',
					specVersion: 'shared',
					credentials: {},
					sharedCredentials: credentialsWithTimestamps,
					environmentId: options.environmentId,
					flowKey: storageKey,
					timestamp: now,
					expiresAt: options.backupExpiry ? now + options.backupExpiry : undefined,
				};

				const backupOptions: BackupOptions = {
					environmentId: options.environmentId,
					expiresIn: options.backupExpiry || UnifiedOAuthCredentialsServiceV8U.BACKUP_EXPIRY,
					dataType: 'shared-credentials',
				};

				await UnifiedOAuthBackupServiceV8U.saveOAuthBackup(storageKey, backupData, backupOptions);
			}

			logger.info(`${_MODULE_TAG} ✅ Shared credentials saved`, {
				environmentId: options?.environmentId,
				hasBackup: !!options?.enableBackup,
			});
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to save shared credentials`, {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Load shared credentials with SQLite backup fallback
	 */
	static async loadSharedCredentials(options?: {
		environmentId?: string;
		enableBackup?: boolean;
	}): Promise<SharedOAuthCredentials | null> {
		try {
			const storageKey = UnifiedOAuthCredentialsServiceV8U.SHARED_PREFIX;

			// Try localStorage first
			const localData = localStorage.getItem(storageKey);
			if (localData) {
				const credentials = JSON.parse(localData);
				logger.debug(`${_MODULE_TAG} ✅ Loaded shared from localStorage`);

				// Trigger async backup refresh if enabled
				if (options?.enableBackup && options.environmentId) {
					UnifiedOAuthCredentialsServiceV8U.refreshSharedFromBackup(options.environmentId).catch(
						() => {}
					); // Ignore errors in background refresh
				}

				return credentials;
			}

			// Try IndexedDB
			if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
				try {
					const indexedData = await (
						window as any
					).IndexedDBBackupServiceV8U.load<SharedOAuthCredentials>(storageKey);
					if (indexedData) {
						// Cache to localStorage
						localStorage.setItem(storageKey, JSON.stringify(indexedData));
						logger.debug(`${_MODULE_TAG} ✅ Loaded shared from IndexedDB`);
						return indexedData;
					}
				} catch (error) {
					logger.warn(`${_MODULE_TAG} Shared IndexedDB load failed`, { error });
				}
			}

			// Try SQLite backup
			if (options?.enableBackup && options.environmentId) {
				const backupData = await UnifiedOAuthBackupServiceV8U.loadOAuthBackup(
					storageKey,
					options.environmentId
				);

				if (backupData?.sharedCredentials) {
					// Restore to localStorage and IndexedDB
					localStorage.setItem(storageKey, JSON.stringify(backupData.sharedCredentials));

					if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
						try {
							await (window as any).IndexedDBBackupServiceV8U.save(
								storageKey,
								backupData.sharedCredentials,
								'shared-credentials'
							);
						} catch (error) {
							logger.warn(`${_MODULE_TAG} Shared IndexedDB restore failed`, { error });
						}
					}

					logger.info(`${_MODULE_TAG} ✅ Loaded shared from SQLite backup`);
					return backupData.sharedCredentials;
				}
			}

			logger.debug(`${_MODULE_TAG} No shared credentials found`);
			return null;
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to load shared credentials`, {
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Delete credentials from all storage layers
	 */
	static async deleteCredentials(
		flowKey: string,
		options?: {
			environmentId?: string;
			enableBackup?: boolean;
		}
	): Promise<void> {
		try {
			const storageKey = `${UnifiedOAuthCredentialsServiceV8U.STORAGE_PREFIX}${flowKey}`;

			// Delete from localStorage
			localStorage.removeItem(storageKey);

			// Delete from IndexedDB
			if (typeof window !== 'undefined' && (window as any).IndexedDBBackupServiceV8U) {
				try {
					await (window as any).IndexedDBBackupServiceV8U.delete(storageKey);
				} catch (error) {
					logger.warn(`${_MODULE_TAG} IndexedDB delete failed`, { flowKey, error });
				}
			}

			// Delete from SQLite backup
			if (options?.enableBackup && options.environmentId) {
				await UnifiedOAuthBackupServiceV8U.deleteOAuthBackup(storageKey, options.environmentId);
			}

			logger.info(`${_MODULE_TAG} ✅ Credentials deleted`, {
				flowKey,
				environmentId: options?.environmentId,
			});
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to delete credentials`, {
				flowKey,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Refresh credentials from SQLite backup (background operation)
	 */
	private static async refreshFromBackup(flowKey: string, environmentId: string): Promise<void> {
		try {
			const storageKey = `${UnifiedOAuthCredentialsServiceV8U.STORAGE_PREFIX}${flowKey}`;
			const backupData = await UnifiedOAuthBackupServiceV8U.loadOAuthBackup(
				storageKey,
				environmentId
			);

			if (backupData?.credentials) {
				const localData = localStorage.getItem(storageKey);
				if (localData) {
					const localCredentials = JSON.parse(localData);

					// Only update if backup is newer
					if (backupData.timestamp > (localCredentials.updatedAt || 0)) {
						localStorage.setItem(storageKey, JSON.stringify(backupData.credentials));
						logger.debug(`${_MODULE_TAG} 🔄 Refreshed from backup`, { flowKey });
					}
				}
			}
		} catch (error) {
			// Silently ignore background refresh errors
			logger.debug(`${_MODULE_TAG} Background refresh failed`, { flowKey, error });
		}
	}

	/**
	 * Refresh shared credentials from SQLite backup (background operation)
	 */
	private static async refreshSharedFromBackup(environmentId: string): Promise<void> {
		try {
			const storageKey = UnifiedOAuthCredentialsServiceV8U.SHARED_PREFIX;
			const backupData = await UnifiedOAuthBackupServiceV8U.loadOAuthBackup(
				storageKey,
				environmentId
			);

			if (backupData?.sharedCredentials) {
				const localData = localStorage.getItem(storageKey);
				if (localData) {
					const localCredentials = JSON.parse(localData);

					// Only update if backup is newer
					if (backupData.timestamp > (localCredentials.updatedAt || 0)) {
						localStorage.setItem(storageKey, JSON.stringify(backupData.sharedCredentials));
						logger.debug(`${_MODULE_TAG} 🔄 Refreshed shared from backup`);
					}
				}
			}
		} catch (error) {
			// Silently ignore background refresh errors
			logger.debug(`${_MODULE_TAG} Shared background refresh failed`, { error });
		}
	}

	/**
	 * Get backup statistics for OAuth flows
	 */
	static async getBackupStats(environmentId?: string): Promise<{
		totalBackups: number;
		byDataType: Record<string, number>;
		oldestBackup?: number;
		newestBackup?: number;
	}> {
		return UnifiedOAuthBackupServiceV8U.getOAuthBackupStats(environmentId);
	}

	/**
	 * Clear all OAuth backups for an environment
	 */
	static async clearBackups(environmentId: string): Promise<boolean> {
		return UnifiedOAuthBackupServiceV8U.clearOAuthBackups(environmentId);
	}
}

// Export singleton instance
export const UnifiedOAuthCredentialsService = UnifiedOAuthCredentialsServiceV8U;

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).UnifiedOAuthCredentialsServiceV8U = UnifiedOAuthCredentialsServiceV8U;
}
