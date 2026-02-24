// src/services/credentialBackupService.ts
// V7 Credential Backup Service - Saves non-sensitive credentials to .env files for fallback

import { StepCredentials } from '../components/steps/CommonSteps';
import { clientError, clientInfo } from '../utils/clientLogger';

export interface CredentialBackupConfig {
	flowKey: string;
	environmentId?: string;
	clientId?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	scopes?: string[];
	responseType?: string;
	// Never include secrets in backup
	// clientSecret: never included
	// workerToken: never included
}

export interface EnvBackupData {
	[flowKey: string]: CredentialBackupConfig;
}

class CredentialBackupService {
	private readonly BACKUP_KEY = 'masterflow_api_credential_backup';
	private readonly MAX_BACKUP_SIZE = 50; // Maximum number of flows to backup

	/**
	 * Save non-sensitive credentials to localStorage backup
	 * This provides fallback when browser storage is cleared
	 */
	saveCredentialBackup(flowKey: string, credentials: StepCredentials): void {
		try {
			const backupConfig: CredentialBackupConfig = {
				flowKey,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				postLogoutRedirectUri: credentials.postLogoutRedirectUri,
				scopes: credentials.scopes,
				responseType: credentials.responseType,
				// Explicitly exclude secrets
			};

			// Get existing backup data
			const existingBackup = this.getCredentialBackup();

			// Add/update this flow's backup
			existingBackup[flowKey] = backupConfig;

			// Limit backup size to prevent localStorage bloat
			const backupEntries = Object.entries(existingBackup);
			if (backupEntries.length > this.MAX_BACKUP_SIZE) {
				// Remove oldest entries (simple FIFO)
				const sortedEntries = backupEntries.sort((a, b) => {
					// Simple timestamp-based sorting (could be improved)
					return a[0].localeCompare(b[0]);
				});

				const trimmedBackup: EnvBackupData = {};
				sortedEntries.slice(-this.MAX_BACKUP_SIZE).forEach(([key, value]) => {
					trimmedBackup[key] = value;
				});

				localStorage.setItem(this.BACKUP_KEY, JSON.stringify(trimmedBackup));
			} else {
				localStorage.setItem(this.BACKUP_KEY, JSON.stringify(existingBackup));
			}

			clientInfo(`🔧 [CredentialBackup] Saved backup for flow: ${flowKey}`, {
				flowKey,
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				hasRedirectUri: !!credentials.redirectUri,
				hasPostLogoutRedirectUri: !!credentials.postLogoutRedirectUri,
				scopes: credentials.scopes?.length || 0,
			});
		} catch (error) {
			clientError('🔧 [CredentialBackup] Failed to save backup', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Load credential backup for a specific flow
	 */
	loadCredentialBackup(flowKey: string): CredentialBackupConfig | null {
		try {
			const backup = this.getCredentialBackup();
			return backup[flowKey] || null;
		} catch (error) {
			clientError('🔧 [CredentialBackup] Failed to load backup', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		}
	}

	/**
	 * Get all credential backups
	 */
	getCredentialBackup(): EnvBackupData {
		try {
			const backupData = localStorage.getItem(this.BACKUP_KEY);
			return backupData ? JSON.parse(backupData) : {};
		} catch (error) {
			clientError('🔧 [CredentialBackup] Failed to parse backup data', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return {};
		}
	}

	/**
	 * Clear backup for a specific flow
	 */
	clearFlowBackup(flowKey: string): void {
		try {
			const backup = this.getCredentialBackup();
			delete backup[flowKey];
			localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));

			clientInfo(`🔧 [CredentialBackup] Cleared backup for flow: ${flowKey}`);
		} catch (error) {
			clientError('🔧 [CredentialBackup] Failed to clear backup', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Clear all credential backups
	 */
	clearAllBackups(): void {
		try {
			localStorage.removeItem(this.BACKUP_KEY);
			clientInfo('🔧 [CredentialBackup] Cleared all credential backups');
		} catch (error) {
			clientError('🔧 [CredentialBackup] Failed to clear all backups', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Generate .env file content for download
	 */
	generateEnvFile(): string {
		const backup = this.getCredentialBackup();
		const envLines: string[] = [];

		envLines.push('# MasterFlow API Credential Backup');
		envLines.push('# Generated automatically - contains non-sensitive configuration only');
		envLines.push('# DO NOT include client secrets or worker tokens in this file');
		envLines.push('');

		Object.entries(backup).forEach(([flowKey, config]) => {
			envLines.push(`# ${flowKey} flow configuration`);
			if (config.environmentId) {
				envLines.push(
					`${flowKey.toUpperCase().replace(/-/g, '_')}_ENVIRONMENT_ID=${config.environmentId}`
				);
			}
			if (config.clientId) {
				envLines.push(`${flowKey.toUpperCase().replace(/-/g, '_')}_CLIENT_ID=${config.clientId}`);
			}
			if (config.redirectUri) {
				envLines.push(
					`${flowKey.toUpperCase().replace(/-/g, '_')}_REDIRECT_URI=${config.redirectUri}`
				);
			}
			if (config.postLogoutRedirectUri) {
				envLines.push(
					`${flowKey.toUpperCase().replace(/-/g, '_')}_POST_LOGOUT_REDIRECT_URI=${config.postLogoutRedirectUri}`
				);
			}
			if (config.scopes && config.scopes.length > 0) {
				envLines.push(
					`${flowKey.toUpperCase().replace(/-/g, '_')}_SCOPES=${config.scopes.join(' ')}`
				);
			}
			if (config.responseType) {
				envLines.push(
					`${flowKey.toUpperCase().replace(/-/g, '_')}_RESPONSE_TYPE=${config.responseType}`
				);
			}
			envLines.push('');
		});

		return envLines.join('\n');
	}

	/**
	 * Download .env file with credential backup
	 */
	downloadEnvFile(): void {
		try {
			const envContent = this.generateEnvFile();
			const blob = new Blob([envContent], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = 'masterflow-api-credentials.env';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			clientInfo('🔧 [CredentialBackup] Downloaded .env file with credential backup');
		} catch (error) {
			clientError('🔧 [CredentialBackup] Failed to download .env file', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Restore credentials from backup (used when storage is cleared)
	 */
	restoreFromBackup(flowKey: string): Partial<StepCredentials> {
		const backup = this.loadCredentialBackup(flowKey);
		if (!backup) {
			return {};
		}

		const restoredCredentials: Partial<StepCredentials> = {};

		if (backup.environmentId) restoredCredentials.environmentId = backup.environmentId;
		if (backup.clientId) restoredCredentials.clientId = backup.clientId;
		if (backup.redirectUri) restoredCredentials.redirectUri = backup.redirectUri;
		if (backup.postLogoutRedirectUri)
			restoredCredentials.postLogoutRedirectUri = backup.postLogoutRedirectUri;
		if (backup.scopes) restoredCredentials.scopes = backup.scopes;
		if (backup.responseType) restoredCredentials.responseType = backup.responseType;

		clientInfo(`🔧 [CredentialBackup] Restored credentials for flow: ${flowKey}`, {
			flowKey,
			restoredFields: Object.keys(restoredCredentials),
		});

		return restoredCredentials;
	}

	/**
	 * Get backup statistics
	 */
	getBackupStats(): {
		totalFlows: number;
		flows: string[];
		lastUpdated: string;
	} {
		const backup = this.getCredentialBackup();
		return {
			totalFlows: Object.keys(backup).length,
			flows: Object.keys(backup),
			lastUpdated: new Date().toISOString(),
		};
	}
}

// Export singleton instance
export const credentialBackupService = new CredentialBackupService();

// Export types for use in other files
export type { CredentialBackupConfig, EnvBackupData };
