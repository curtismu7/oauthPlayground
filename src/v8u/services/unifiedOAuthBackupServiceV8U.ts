/**
 * @file unifiedOAuthBackupServiceV8U.ts
 * @module v8u/services
 * @description SQLite backup service for Unified OAuth flows
 * @version 8.0.0
 * @since 2026-02-05
 *
 * Provides SQLite backup integration for Unified OAuth flow credentials and state.
 * This service extends the existing IndexedDB backup with server-side SQLite storage.
 *
 * Features:
 * - Automatic backup to SQLite database
 * - Environment-specific data isolation
 * - Expiration handling for temporary data
 * - Fallback to existing IndexedDB storage
 * - Cross-session persistence
 */

import { logger } from './unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[💾 UNIFIED-OAUTH-BACKUP-V8U]';

export interface OAuthBackupData {
	flowType: string;
	specVersion: string;
	credentials: any;
	sharedCredentials: any;
	environmentId: string;
	flowKey: string;
	timestamp: number;
	expiresAt?: number;
}

export interface BackupOptions {
	environmentId: string;
	expiresIn?: number; // milliseconds from now
	dataType?: 'credentials' | 'shared-credentials' | 'flow-state';
}

/**
 * Unified OAuth Backup Service
 * Integrates with existing SQLite backup infrastructure for OAuth flows
 */
export class UnifiedOAuthBackupServiceV8U {
	private static readonly BACKUP_API_BASE = '/api/backup';
	private static readonly DEFAULT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

	/**
	 * Save OAuth flow data to SQLite backup
	 */
	static async saveOAuthBackup(
		key: string,
		data: OAuthBackupData,
		options: BackupOptions
	): Promise<boolean> {
		try {
			const expiresAt = options.expiresIn
				? Date.now() + options.expiresIn
				: Date.now() + UnifiedOAuthBackupServiceV8U.DEFAULT_EXPIRY;

			const payload = {
				key,
				environmentId: options.environmentId,
				dataType: options.dataType || 'credentials',
				data,
				expiresAt,
			};

			const response = await fetch(`${UnifiedOAuthBackupServiceV8U.BACKUP_API_BASE}/save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(`Backup save failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success) {
				logger.info(`${_MODULE_TAG} ✅ OAuth backup saved`, {
					key,
					environmentId: options.environmentId,
					dataType: options.dataType,
				});
				return true;
			} else {
				throw new Error(result.error || 'Unknown backup error');
			}
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to save OAuth backup`, {
				key,
				environmentId: options.environmentId,
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	/**
	 * Load OAuth flow data from SQLite backup
	 */
	static async loadOAuthBackup(
		key: string,
		environmentId: string
	): Promise<OAuthBackupData | null> {
		try {
			const payload = {
				key,
				environmentId,
			};

			const response = await fetch(`${UnifiedOAuthBackupServiceV8U.BACKUP_API_BASE}/load`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}).catch((error) => {
				// Suppress network errors in console (server may not be ready yet)
				logger.debug(`${_MODULE_TAG} Backup API not available`, { error: error.message });
				return null;
			});

			if (!response) {
				return null;
			}

			if (!response.ok) {
				if (response.status === 404) {
					logger.debug(`${_MODULE_TAG} No backup found for key`, { key, environmentId });
					return null;
				}
				throw new Error(`Backup load failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success && result.data) {
				const data = JSON.parse(result.data);
				logger.info(`${_MODULE_TAG} ✅ OAuth backup loaded`, {
					key,
					environmentId,
					flowType: data.flowType,
				});
				return data;
			} else {
				logger.debug(`${_MODULE_TAG} No backup data found`, { key, environmentId });
				return null;
			}
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to load OAuth backup`, {
				key,
				environmentId,
				error: error instanceof Error ? error.message : String(error),
			});
			return null;
		}
	}

	/**
	 * Delete OAuth flow backup
	 */
	static async deleteOAuthBackup(key: string, environmentId: string): Promise<boolean> {
		try {
			const payload = {
				key,
				environmentId,
			};

			const response = await fetch(`${UnifiedOAuthBackupServiceV8U.BACKUP_API_BASE}/delete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(`Backup delete failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success) {
				logger.info(`${_MODULE_TAG} ✅ OAuth backup deleted`, { key, environmentId });
				return true;
			} else {
				throw new Error(result.error || 'Unknown delete error');
			}
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to delete OAuth backup`, {
				key,
				environmentId,
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	/**
	 * List all OAuth backups for an environment
	 */
	static async listOAuthBackups(
		environmentId: string,
		dataType?: string
	): Promise<Array<{ key: string; dataType: string; savedAt: number; expiresAt?: number }>> {
		try {
			const payload = {
				environmentId,
				dataType,
			};

			const response = await fetch(`${UnifiedOAuthBackupServiceV8U.BACKUP_API_BASE}/list`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(`Backup list failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success) {
				return result.backups || [];
			} else {
				throw new Error(result.error || 'Unknown list error');
			}
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to list OAuth backups`, {
				environmentId,
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	/**
	 * Get backup statistics for OAuth flows
	 */
	static async getOAuthBackupStats(environmentId?: string): Promise<{
		totalBackups: number;
		byDataType: Record<string, number>;
		oldestBackup?: number;
		newestBackup?: number;
	}> {
		try {
			const url = environmentId
				? `${UnifiedOAuthBackupServiceV8U.BACKUP_API_BASE}/stats/${environmentId}`
				: `${UnifiedOAuthBackupServiceV8U.BACKUP_API_BASE}/stats`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Backup stats failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success) {
				return {
					totalBackups: result.totalBackups || 0,
					byDataType: result.byDataType || {},
					oldestBackup: result.oldestBackup,
					newestBackup: result.newestBackup,
				};
			} else {
				throw new Error(result.error || 'Unknown stats error');
			}
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to get OAuth backup stats`, {
				environmentId,
				error: error instanceof Error ? error.message : String(error),
			});
			return {
				totalBackups: 0,
				byDataType: {},
			};
		}
	}

	/**
	 * Clear all OAuth backups for an environment
	 */
	static async clearOAuthBackups(environmentId: string): Promise<boolean> {
		try {
			const payload = { environmentId };

			const response = await fetch(
				`${UnifiedOAuthBackupServiceV8U.BACKUP_API_BASE}/clear-environment`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				}
			);

			if (!response.ok) {
				throw new Error(`Backup clear failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success) {
				logger.info(`${_MODULE_TAG} ✅ OAuth backups cleared`, { environmentId });
				return true;
			} else {
				throw new Error(result.error || 'Unknown clear error');
			}
		} catch (error) {
			logger.error(`${_MODULE_TAG} ❌ Failed to clear OAuth backups`, {
				environmentId,
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}
}

// Export singleton instance
export const UnifiedOAuthBackupService = UnifiedOAuthBackupServiceV8U;

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).UnifiedOAuthBackupServiceV8U = UnifiedOAuthBackupServiceV8U;
}
