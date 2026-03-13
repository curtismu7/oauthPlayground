/**
 * @file apiKeyBackupService.ts
 * @module services
 * @description API key backup service for redundant storage across multiple locations
 * @version 1.0.0
 * @since 2026-03-13
 *
 * Provides comprehensive backup system for API keys including:
 * - Primary storage (unified token storage + backend)
 * - Backup to local filesystem
 * - Backup to localStorage
 * - Recovery mechanisms
 * - Sync across storage locations
 */

import { logger } from '../utils/logger';
import { apiKeyService } from './apiKeyService';

const MODULE_TAG = '[🔄 API-KEY-BACKUP-SERVICE]';

// Backup storage locations
const BACKUP_LOCATIONS = {
	LOCAL_STORAGE: 'localStorage',
	FILESYSTEM: 'filesystem',
	PRIMARY: 'primary', // unified storage + backend
} as const;

export interface BackupManifest {
	version: string;
	createdAt: string;
	updatedAt: string;
	services: Record<string, ApiKeyBackupEntry>;
	checksum: string;
}

export interface ApiKeyBackupEntry {
	service: string;
	encryptedKey: string; // Base64 encoded encrypted key
	metadata: {
		name: string;
		description: string;
		createdAt: string;
		lastUsedAt?: string;
		isActive: boolean;
		validationType: string;
	};
	backupLocations: string[]; // Which locations have this key
}

export interface BackupStatus {
	service: string;
	hasPrimary: boolean;
	hasLocalStorage: boolean;
	hasFilesystem: boolean;
	lastBackupTime?: string;
	isHealthy: boolean;
}

class ApiKeyBackupService {
	private static instance: ApiKeyBackupService;
	private readonly BACKUP_STORAGE_KEY = 'pingone_api_keys_backup';
	private readonly BACKUP_VERSION = '1.0.0';

	private constructor() {}

	public static getInstance(): ApiKeyBackupService {
		if (!ApiKeyBackupService.instance) {
			ApiKeyBackupService.instance = new ApiKeyBackupService();
		}
		return ApiKeyBackupService.instance;
	}

	/**
	 * Create comprehensive backup of all API keys
	 */
	public async createBackup(): Promise<BackupManifest> {
		try {
			logger.info(MODULE_TAG, 'Creating comprehensive API key backup...');

			// Get all API keys from primary storage
			const allKeys = await apiKeyService.getAllApiKeys();
			const manifest: BackupManifest = {
				version: this.BACKUP_VERSION,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				services: {},
				checksum: '',
			};

			// Process each API key
			for (const keyInfo of allKeys) {
				if (!keyInfo.isActive) continue;

				// Get the actual unencrypted key
				const actualKey = await apiKeyService.getApiKey(keyInfo.service);
				if (!actualKey) continue;

				const backupEntry: ApiKeyBackupEntry = {
					service: keyInfo.service,
					encryptedKey: this.encryptKey(actualKey),
					metadata: {
						name: keyInfo.name,
						description: keyInfo.description,
						createdAt: keyInfo.createdAt,
						lastUsedAt: keyInfo.lastUsedAt,
						isActive: keyInfo.isActive,
						validationType: 'regex', // Default validation type
					},
					backupLocations: [BACKUP_LOCATIONS.PRIMARY],
				};

				manifest.services[keyInfo.service] = backupEntry;
			}

			// Calculate checksum
			manifest.checksum = this.calculateChecksum(manifest);

			// Store backup in localStorage
			await this.storeBackupInLocalStorage(manifest);

			// Store backup in filesystem (via backend)
			await this.storeBackupInFilesystem(manifest);

			logger.info(
				MODULE_TAG,
				`Backup created for ${Object.keys(manifest.services).length} API keys`
			);
			return manifest;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to create backup:', error);
			throw error;
		}
	}

	/**
	 * Restore API keys from backup
	 */
	public async restoreFromBackup(preferLocation?: keyof typeof BACKUP_LOCATIONS): Promise<void> {
		try {
			logger.info(
				MODULE_TAG,
				`Restoring API keys from backup (prefer: ${preferLocation || 'auto'})...`
			);

			let manifest: BackupManifest | null = null;

			// Try to load backup from preferred location first, then fallback
			if (preferLocation === BACKUP_LOCATIONS.LOCAL_STORAGE) {
				manifest = await this.loadBackupFromLocalStorage();
				if (!manifest) manifest = await this.loadBackupFromFilesystem();
			} else if (preferLocation === BACKUP_LOCATIONS.FILESYSTEM) {
				manifest = await this.loadBackupFromFilesystem();
				if (!manifest) manifest = await this.loadBackupFromLocalStorage();
			} else {
				// Auto: try localStorage first, then filesystem
				manifest = await this.loadBackupFromLocalStorage();
				if (!manifest) manifest = await this.loadBackupFromFilesystem();
			}

			if (!manifest) {
				logger.warn(MODULE_TAG, 'No backup found to restore from');
				return;
			}

			// Verify backup integrity
			if (!this.verifyBackupIntegrity(manifest)) {
				logger.error(MODULE_TAG, 'Backup integrity check failed');
				throw new Error('Backup integrity verification failed');
			}

			// Restore each API key
			let restoredCount = 0;
			for (const [service, entry] of Object.entries(manifest.services)) {
				try {
					const decryptedKey = this.decryptKey(entry.encryptedKey);
					await apiKeyService.storeApiKey(service, decryptedKey, entry.metadata);
					restoredCount++;
					logger.info(MODULE_TAG, `Restored API key for ${service}`);
				} catch (error) {
					logger.error(MODULE_TAG, `Failed to restore API key for ${service}:`, error);
				}
			}

			logger.info(MODULE_TAG, `Successfully restored ${restoredCount} API keys from backup`);
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to restore from backup:', error);
			throw error;
		}
	}

	/**
	 * Get backup status for all services
	 */
	public async getBackupStatus(): Promise<BackupStatus[]> {
		try {
			const allKeys = await apiKeyService.getAllApiKeys();
			const localStorageBackup = await this.loadBackupFromLocalStorage();
			const filesystemBackup = await this.loadBackupFromFilesystem();

			const statuses: BackupStatus[] = [];

			for (const keyInfo of allKeys) {
				const status: BackupStatus = {
					service: keyInfo.service,
					hasPrimary: true, // If we can get it, primary exists
					hasLocalStorage: !!localStorageBackup?.services[keyInfo.service],
					hasFilesystem: !!filesystemBackup?.services[keyInfo.service],
					lastBackupTime: localStorageBackup?.updatedAt || filesystemBackup?.updatedAt,
					isHealthy: true, // Consider healthy if we have primary
				};

				// Mark as unhealthy if no backups exist
				if (!status.hasLocalStorage && !status.hasFilesystem) {
					status.isHealthy = false;
				}

				statuses.push(status);
			}

			return statuses;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to get backup status:', error);
			return [];
		}
	}

	/**
	 * Sync API keys across all backup locations
	 */
	public async syncAllBackups(): Promise<void> {
		try {
			logger.info(MODULE_TAG, 'Syncing API keys across all backup locations...');

			// Create fresh backup which will sync to all locations
			await this.createBackup();

			logger.info(MODULE_TAG, 'Backup sync completed');
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to sync backups:', error);
			throw error;
		}
	}

	/**
	 * Store backup in localStorage
	 */
	private async storeBackupInLocalStorage(manifest: BackupManifest): Promise<void> {
		try {
			localStorage.setItem(this.BACKUP_STORAGE_KEY, JSON.stringify(manifest));
			logger.debug(MODULE_TAG, 'Backup stored in localStorage');
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to store backup in localStorage:', error);
		}
	}

	/**
	 * Load backup from localStorage
	 */
	private async loadBackupFromLocalStorage(): Promise<BackupManifest | null> {
		try {
			const stored = localStorage.getItem(this.BACKUP_STORAGE_KEY);
			if (stored) {
				const manifest = JSON.parse(stored) as BackupManifest;
				logger.debug(MODULE_TAG, 'Backup loaded from localStorage');
				return manifest;
			}
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to load backup from localStorage:', error);
		}
		return null;
	}

	/**
	 * Store backup in filesystem via backend
	 */
	private async storeBackupInFilesystem(manifest: BackupManifest): Promise<void> {
		try {
			const response = await fetch('/api/api-key/backup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ manifest }),
			});

			if (response.ok) {
				logger.debug(MODULE_TAG, 'Backup stored in filesystem');
			} else {
				logger.warn(MODULE_TAG, `Failed to store backup in filesystem: ${response.statusText}`);
			}
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to store backup in filesystem:', error);
		}
	}

	/**
	 * Load backup from filesystem via backend
	 */
	private async loadBackupFromFilesystem(): Promise<BackupManifest | null> {
		try {
			const response = await fetch('/api/api-key/backup');
			if (response.ok) {
				const data = await response.json();
				if (data.success && data.manifest) {
					logger.debug(MODULE_TAG, 'Backup loaded from filesystem');
					return data.manifest;
				}
			}
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to load backup from filesystem:', error);
		}
		return null;
	}

	/**
	 * Simple encryption for API keys (Base64 encoding for now)
	 * In production, use proper encryption
	 */
	private encryptKey(key: string): string {
		return btoa(key); // Simple Base64 encoding
	}

	/**
	 * Simple decryption for API keys
	 */
	private decryptKey(encryptedKey: string): string {
		return atob(encryptedKey); // Simple Base64 decoding
	}

	/**
	 * Calculate checksum for backup verification
	 */
	private calculateChecksum(manifest: BackupManifest): string {
		const data = JSON.stringify({
			version: manifest.version,
			createdAt: manifest.createdAt,
			services: manifest.services,
		});
		return btoa(data).slice(0, 16); // Simple checksum
	}

	/**
	 * Verify backup integrity
	 */
	private verifyBackupIntegrity(manifest: BackupManifest): boolean {
		try {
			const expectedChecksum = this.calculateChecksum(manifest);
			return manifest.checksum === expectedChecksum;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to verify backup integrity:', error);
			return false;
		}
	}
}

// Export singleton instance
export const apiKeyBackupService = ApiKeyBackupService.getInstance();
