/**
 * @file workerTokenBackupService.ts
 * @description Worker Token Backup and Export Service
 * @version 1.0.0
 *
 * Provides backup, export, and import functionality for worker tokens.
 * Supports multiple formats including JSON, encrypted files, and database sync.
 */

import type { UnifiedWorkerTokenCredentials } from './unifiedWorkerTokenService';
import { unifiedWorkerTokenService } from './unifiedWorkerTokenService';

const MODULE_TAG = '[🔑 WORKER-TOKEN-BACKUP]';

export interface WorkerTokenBackupData {
	version: string;
	timestamp: number;
	credentials: UnifiedWorkerTokenCredentials;
	token?: {
		expiresAt?: number;
		savedAt: number;
		// Note: Actual token string is NOT included in backup for security
		hasToken: boolean;
		tokenPreview?: string; // First 20 chars for identification
	};
	metadata: {
		environmentId: string;
		clientId: string;
		region?: string;
		authMethod?: string;
		scopes?: string[];
		backupType: 'manual' | 'auto';
	};
}

export interface BackupOptions {
	includeToken?: boolean; // Default: false (security)
	encrypt?: boolean; // Default: false
	format?: 'json' | 'env' | 'csv';
	filename?: string;
}

class WorkerTokenBackupService {
	private readonly BACKUP_VERSION = '1.0.0';
	private readonly AUTO_BACKUP_KEY = 'worker_token_auto_backup';
	private readonly MANUAL_BACKUP_KEY = 'worker_token_manual_backup';

	/**
	 * Create backup of current worker token credentials
	 */
	async createBackup(options: BackupOptions = {}): Promise<WorkerTokenBackupData> {
		const { includeToken = false, encrypt = false, format = 'json', filename } = options;

		console.log(`${MODULE_TAG} Creating worker token backup...`);

		try {
			// Get current credentials and token status
			const credentials = await unifiedWorkerTokenService.getCredentials();
			const tokenData = await unifiedWorkerTokenService.getTokenData();
			const status = await unifiedWorkerTokenService.getStatus();

			if (!credentials) {
				throw new Error('No worker token credentials found to backup');
			}

			// Create backup data
			const backupData: WorkerTokenBackupData = {
				version: this.BACKUP_VERSION,
				timestamp: Date.now(),
				credentials: {
					...credentials,
					// Remove sensitive data from backup unless explicitly requested
					clientSecret: includeToken ? credentials.clientSecret : '***REDACTED***',
				},
				token: {
					expiresAt: tokenData?.expiresAt,
					savedAt: tokenData?.savedAt || Date.now(),
					hasToken: status.hasToken,
					tokenPreview: tokenData?.token ? `${tokenData.token.substring(0, 20)}...` : undefined,
				},
				metadata: {
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					region: credentials.region,
					authMethod: credentials.tokenEndpointAuthMethod,
					scopes: credentials.scopes,
					backupType: 'manual',
				},
			};

			// Save to localStorage
			const backupKey = options.includeToken ? this.MANUAL_BACKUP_KEY : this.AUTO_BACKUP_KEY;
			localStorage.setItem(backupKey, JSON.stringify(backupData));

			console.log(`${MODULE_TAG} ✅ Backup created successfully`, {
				hasCredentials: !!backupData.credentials,
				hasToken: backupData.token?.hasToken,
				backupType: backupData.metadata.backupType,
			});

			return backupData;
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to create backup:`, error);
			throw error;
		}
	}

	/**
	 * Restore worker token from backup
	 */
	async restoreFromBackup(backupData: WorkerTokenBackupData): Promise<void> {
		console.log(`${MODULE_TAG} Restoring worker token from backup...`);

		try {
			// Validate backup version
			if (!backupData.version || backupData.version !== this.BACKUP_VERSION) {
				throw new Error(`Incompatible backup version: ${backupData.version}`);
			}

			// Validate required fields
			if (!backupData.credentials?.environmentId || !backupData.credentials?.clientId) {
				throw new Error('Invalid backup data: missing required credentials');
			}

			// Restore credentials (note: clientSecret might be redacted)
			const credentialsToRestore: UnifiedWorkerTokenCredentials = {
				environmentId: backupData.credentials.environmentId,
				clientId: backupData.credentials.clientId,
				clientSecret:
					backupData.credentials.clientSecret === '***REDACTED***'
						? '' // User will need to re-enter secret
						: backupData.credentials.clientSecret,
				region: backupData.credentials.region,
				scopes: backupData.credentials.scopes,
				tokenEndpointAuthMethod: backupData.credentials.tokenEndpointAuthMethod,
			};

			await unifiedWorkerTokenService.saveCredentials(credentialsToRestore);

			console.log(`${MODULE_TAG} ✅ Credentials restored successfully`, {
				environmentId: backupData.credentials.environmentId,
				clientId: backupData.credentials.clientId,
				needsSecret: backupData.credentials.clientSecret === '***REDACTED***',
			});
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to restore from backup:`, error);
			throw error;
		}
	}

	/**
	 * Load backup from localStorage
	 */
	loadBackup(type: 'auto' | 'manual' = 'auto'): WorkerTokenBackupData | null {
		try {
			const backupKey = type === 'auto' ? this.AUTO_BACKUP_KEY : this.MANUAL_BACKUP_KEY;
			const backupData = localStorage.getItem(backupKey);

			if (!backupData) {
				console.log(`${MODULE_TAG} No ${type} backup found`);
				return null;
			}

			const backup: WorkerTokenBackupData = JSON.parse(backupData);
			console.log(`${MODULE_TAG} ✅ Loaded ${type} backup`, {
				timestamp: backup.timestamp,
				hasCredentials: !!backup.credentials,
				hasToken: backup.token?.hasToken,
			});

			return backup;
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to load backup:`, error);
			return null;
		}
	}

	/**
	 * Export backup to downloadable file
	 */
	async exportBackup(options: BackupOptions = {}): Promise<void> {
		try {
			const backupData = await this.createBackup(options);
			const { format = 'json', filename } = options;

			let content: string;
			let mimeType: string;
			let fileExtension: string;

			switch (format) {
				case 'json':
					content = JSON.stringify(backupData, null, 2);
					mimeType = 'application/json';
					fileExtension = 'json';
					break;

				case 'env':
					content = this.generateEnvFormat(backupData);
					mimeType = 'text/plain';
					fileExtension = 'env';
					break;

				case 'csv':
					content = this.generateCsvFormat(backupData);
					mimeType = 'text/csv';
					fileExtension = 'csv';
					break;

				default:
					throw new Error(`Unsupported export format: ${format}`);
			}

			// Generate filename
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const defaultFilename = `worker-token-backup-${timestamp}.${fileExtension}`;
			const finalFilename = filename || defaultFilename;

			// Download file
			const blob = new Blob([content], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = finalFilename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			console.log(`${MODULE_TAG} ✅ Exported backup to ${finalFilename}`);
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to export backup:`, error);
			throw error;
		}
	}

	/**
	 * Import backup from file
	 */
	async importBackup(file: File): Promise<WorkerTokenBackupData> {
		console.log(`${MODULE_TAG} Importing backup from file: ${file.name}`);

		try {
			const content = await file.text();
			let backupData: WorkerTokenBackupData;

			// Parse based on file extension
			if (file.name.endsWith('.json')) {
				backupData = JSON.parse(content);
			} else if (file.name.endsWith('.env')) {
				backupData = this.parseEnvFormat(content);
			} else if (file.name.endsWith('.csv')) {
				backupData = this.parseCsvFormat(content);
			} else {
				throw new Error('Unsupported file format. Please use .json, .env, or .csv files.');
			}

			// Validate and restore
			await this.restoreFromBackup(backupData);

			console.log(`${MODULE_TAG} ✅ Successfully imported backup from ${file.name}`);
			return backupData;
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to import backup:`, error);
			throw error;
		}
	}

	/**
	 * Get backup statistics
	 */
	getBackupStats(): {
		autoBackup: WorkerTokenBackupData | null;
		manualBackup: WorkerTokenBackupData | null;
		lastBackup: number | null;
		totalBackups: number;
	} {
		const autoBackup = this.loadBackup('auto');
		const manualBackup = this.loadBackup('manual');

		const timestamps = [autoBackup?.timestamp, manualBackup?.timestamp].filter(Boolean) as number[];

		return {
			autoBackup,
			manualBackup,
			lastBackup: timestamps.length > 0 ? Math.max(...timestamps) : null,
			totalBackups: timestamps.length,
		};
	}

	/**
	 * Clear all backups
	 */
	clearBackups(): void {
		localStorage.removeItem(this.AUTO_BACKUP_KEY);
		localStorage.removeItem(this.MANUAL_BACKUP_KEY);
		console.log(`${MODULE_TAG} Cleared all worker token backups`);
	}

	/**
	 * Auto-backup functionality
	 */
	async autoBackup(): Promise<void> {
		try {
			// Only create auto-backup if we have valid credentials
			const status = await unifiedWorkerTokenService.getStatus();
			if (status.hasCredentials) {
				await this.createBackup({
					includeToken: false,
					backupType: 'auto',
				});
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Auto-backup failed:`, error);
		}
	}

	// Private helper methods
	private generateEnvFormat(backup: WorkerTokenBackupData): string {
		const lines = [
			'# Worker Token Backup',
			`# Generated: ${new Date(backup.timestamp).toISOString()}`,
			`# Version: ${backup.version}`,
			'',
			'# Credentials',
			`WORKER_TOKEN_ENVIRONMENT_ID=${backup.credentials.environmentId}`,
			`WORKER_TOKEN_CLIENT_ID=${backup.credentials.clientId}`,
			`WORKER_TOKEN_CLIENT_SECRET=${backup.credentials.clientSecret}`,
			`WORKER_TOKEN_REGION=${backup.credentials.region || 'us'}`,
			`WORKER_TOKEN_AUTH_METHOD=${backup.credentials.tokenEndpointAuthMethod || 'client_secret_post'}`,
			`WORKER_TOKEN_SCOPES=${backup.credentials.scopes?.join(',') || ''}`,
			'',
			'# Token Information',
			`WORKER_TOKEN_HAS_TOKEN=${backup.token?.hasToken || false}`,
			`WORKER_TOKEN_EXPIRES_AT=${backup.token?.expiresAt || ''}`,
			`WORKER_TOKEN_SAVED_AT=${backup.token?.savedAt || ''}`,
		];
		return lines.join('\n');
	}

	private generateCsvFormat(backup: WorkerTokenBackupData): string {
		const headers = ['Field', 'Value'];
		const rows = [
			['Version', backup.version],
			['Timestamp', new Date(backup.timestamp).toISOString()],
			['Environment ID', backup.credentials.environmentId],
			['Client ID', backup.credentials.clientId],
			['Client Secret', backup.credentials.clientSecret],
			['Region', backup.credentials.region || ''],
			['Auth Method', backup.credentials.tokenEndpointAuthMethod || ''],
			['Scopes', backup.credentials.scopes?.join(';') || ''],
			['Has Token', backup.token?.hasToken ? 'Yes' : 'No'],
			['Expires At', backup.token?.expiresAt ? new Date(backup.token.expiresAt).toISOString() : ''],
		];

		return [headers, ...rows].map((row) => row.join(',')).join('\n');
	}

	private parseEnvFormat(content: string): WorkerTokenBackupData {
		const lines = content.split('\n');
		const data: any = {};

		lines.forEach((line) => {
			if (line.startsWith('#') || !line.includes('=')) return;

			const [key, value] = line.split('=', 2);
			data[key] = value;
		});

		return {
			version: '1.0.0',
			timestamp: Date.now(),
			credentials: {
				environmentId: data.WORKER_TOKEN_ENVIRONMENT_ID || '',
				clientId: data.WORKER_TOKEN_CLIENT_ID || '',
				clientSecret: data.WORKER_TOKEN_CLIENT_SECRET || '',
				region: data.WORKER_TOKEN_REGION || 'us',
				tokenEndpointAuthMethod: data.WORKER_TOKEN_AUTH_METHOD as any,
				scopes: data.WORKER_TOKEN_SCOPES ? data.WORKER_TOKEN_SCOPES.split(',') : undefined,
			},
			token: {
				hasToken: data.WORKER_TOKEN_HAS_TOKEN === 'true',
				expiresAt: data.WORKER_TOKEN_EXPIRES_AT
					? parseInt(data.WORKER_TOKEN_EXPIRES_AT, 10)
					: undefined,
				savedAt: data.WORKER_TOKEN_SAVED_AT ? parseInt(data.WORKER_TOKEN_SAVED_AT, 10) : Date.now(),
			},
			metadata: {
				environmentId: data.WORKER_TOKEN_ENVIRONMENT_ID || '',
				clientId: data.WORKER_TOKEN_CLIENT_ID || '',
				backupType: 'manual',
			},
		};
	}

	private parseCsvFormat(content: string): WorkerTokenBackupData {
		const lines = content.split('\n');
		const data: any = {};

		lines.slice(1).forEach((line) => {
			// Skip header
			if (!line.includes(',')) return;

			const [field, value] = line.split(',', 2);
			data[field] = value;
		});

		return this.parseEnvFormat(
			this.generateEnvFormat({
				version: '1.0.0',
				timestamp: Date.now(),
				credentials: {
					environmentId: data['Environment ID'] || '',
					clientId: data['Client ID'] || '',
					clientSecret: data['Client Secret'] || '',
					region: data['Region'] || 'us',
					tokenEndpointAuthMethod: data['Auth Method'] as any,
					scopes: data['Scopes'] ? data['Scopes'].split(';') : undefined,
				},
				token: {
					hasToken: data['Has Token'] === 'Yes',
					expiresAt: data['Expires At'] ? new Date(data['Expires At']).getTime() : undefined,
					savedAt: data['Saved At'] ? new Date(data['Saved At']).getTime() : Date.now(),
				},
				metadata: {
					environmentId: data['Environment ID'] || '',
					clientId: data['Client ID'] || '',
					backupType: 'manual',
				},
			})
		);
	}
}

// Export singleton instance
export const workerTokenBackupService = new WorkerTokenBackupService();

// Auto-backup on credential changes
unifiedWorkerTokenService.onCredentialsChanged?.(() => {
	workerTokenBackupService.autoBackup();
});

export default workerTokenBackupService;
