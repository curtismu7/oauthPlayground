// src/services/credentialMigrationService.ts
// Migration utility for transitioning from old credential system to new system

import type { FlowCredentials, WorkerTokenCredentials } from '../types/credentials';
import { credentialStorageManager } from './credentialStorageManager';
import { unifiedWorkerTokenServiceV2 } from './unifiedWorkerTokenServiceV2';

export interface MigrationReport {
	totalOldCredentials: number;
	migratedFlows: string[];
	skippedFlows: string[];
	errors: string[];
	backupCreated: boolean;
	backupKey?: string;
}

export interface OldCredentialPattern {
	key: string;
	flowKey: string;
	description: string;
}

/**
 * Credential Migration Service
 *
 * Detects and migrates credentials from the old storage system to the new
 * flow-specific isolated storage system.
 *
 * Old patterns detected:
 * - Global credentialManager storage
 * - Flow-specific localStorage keys (various patterns)
 * - Worker Token credentials
 */
export class CredentialMigrationService {
	// Known old storage key patterns
	private static readonly OLD_PATTERNS: OldCredentialPattern[] = [
		// Old flow-specific keys
		{
			key: 'oauth-authorization-code-v6',
			flowKey: 'oauth-authorization-code-v7',
			description: 'OAuth Authorization Code V6',
		},
		{
			key: 'oidc-authorization-code-v6',
			flowKey: 'oidc-authorization-code-v7',
			description: 'OIDC Authorization Code V6',
		},
		{ key: 'oauth-implicit-v6', flowKey: 'oauth-implicit-v7', description: 'OAuth Implicit V6' },
		{ key: 'oidc-implicit-v6', flowKey: 'oidc-implicit-v7', description: 'OIDC Implicit V6' },
		{
			key: 'device-authorization-flow-v6',
			flowKey: 'device-authorization-v7',
			description: 'Device Authorization V6',
		},
		{
			key: 'client-credentials-v6',
			flowKey: 'client-credentials-v7',
			description: 'Client Credentials V6',
		},
		{ key: 'oauth-hybrid-v6', flowKey: 'oauth-hybrid-v7', description: 'OAuth Hybrid V6' },
		{ key: 'oidc-hybrid-v6', flowKey: 'oidc-hybrid-v7', description: 'OIDC Hybrid V6' },

		// Worker Token
		{
			key: 'pingone_worker_token_credentials',
			flowKey: 'worker-token-credentials',
			description: 'Worker Token Credentials',
		},

		// Global credentials (will be migrated to configuration flow)
		{ key: 'pingone_credentials', flowKey: 'configuration', description: 'Global Configuration' },
	];

	/**
	 * Detect old credential storage
	 *
	 * Scans localStorage for old credential patterns
	 *
	 * @returns Report of detected old credentials
	 */
	static detectOldCredentials(): MigrationReport {
		console.log('🔍 [Migration] Scanning for old credentials...');

		const report: MigrationReport = {
			totalOldCredentials: 0,
			migratedFlows: [],
			skippedFlows: [],
			errors: [],
			backupCreated: false,
		};

		// Scan localStorage for old patterns
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key) continue;

			// Check against known patterns
			const pattern = CredentialMigrationService.OLD_PATTERNS.find((p) => key.includes(p.key));
			if (pattern) {
				report.totalOldCredentials++;
				console.log(`✅ Found old credentials: ${pattern.description} (${key})`);
			}

			// Check for other credential-like keys
			if (
				(key.includes('credential') || key.includes('pingone') || key.includes('oauth')) &&
				!key.startsWith('flow_credentials_') &&
				!key.startsWith('file_storage_')
			) {
				report.totalOldCredentials++;
				console.log(`⚠️ Found potential old credentials: ${key}`);
			}
		}

		console.log(`📊 [Migration] Found ${report.totalOldCredentials} old credential entries`);

		return report;
	}

	/**
	 * Create backup of old credentials
	 *
	 * @returns Backup key for restoration
	 */
	static createBackup(): string {
		console.log('💾 [Migration] Creating backup of old credentials...');

		const backup: Record<string, any> = {};
		const timestamp = Date.now();

		// Backup all localStorage
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key) {
				const value = localStorage.getItem(key);
				if (value) {
					backup[key] = value;
				}
			}
		}

		const backupKey = `credential_backup_${timestamp}`;
		localStorage.setItem(backupKey, JSON.stringify(backup));

		console.log(`✅ [Migration] Backup created: ${backupKey}`);

		return backupKey;
	}

	/**
	 * Restore from backup
	 *
	 * @param backupKey - Backup key to restore from
	 */
	static restoreFromBackup(backupKey: string): boolean {
		console.log(`🔄 [Migration] Restoring from backup: ${backupKey}`);

		try {
			const backupData = localStorage.getItem(backupKey);
			if (!backupData) {
				console.error('❌ [Migration] Backup not found');
				return false;
			}

			const backup = JSON.parse(backupData) as Record<string, string>;

			// Restore all keys
			for (const [key, value] of Object.entries(backup)) {
				localStorage.setItem(key, value);
			}

			console.log('✅ [Migration] Backup restored successfully');
			return true;
		} catch (error) {
			console.error('❌ [Migration] Failed to restore backup:', error);
			return false;
		}
	}

	/**
	 * Migrate old credentials to new system
	 *
	 * @param options - Migration options
	 * @returns Migration report
	 */
	static async migrateCredentials(
		options: { createBackup?: boolean; dryRun?: boolean } = {}
	): Promise<MigrationReport> {
		const { createBackup = true, dryRun = false } = options;

		console.group('🚀 [Migration] Starting credential migration');
		console.log(`Dry run: ${dryRun}`);
		console.log(`Create backup: ${createBackup}`);

		const report: MigrationReport = {
			totalOldCredentials: 0,
			migratedFlows: [],
			skippedFlows: [],
			errors: [],
			backupCreated: false,
		};

		// Create backup
		if (createBackup && !dryRun) {
			try {
				const backupKey = CredentialMigrationService.createBackup();
				report.backupCreated = true;
				report.backupKey = backupKey;
			} catch (error) {
				console.error('❌ [Migration] Failed to create backup:', error);
				report.errors.push('Failed to create backup');
				console.groupEnd();
				return report;
			}
		}

		// Migrate each known pattern
		for (const pattern of CredentialMigrationService.OLD_PATTERNS) {
			try {
				const oldData = localStorage.getItem(pattern.key);
				if (!oldData) {
					console.log(`⏭️ Skipping ${pattern.description} - no data found`);
					report.skippedFlows.push(pattern.flowKey);
					continue;
				}

				report.totalOldCredentials++;

				// Parse old credentials
				const oldCredentials = JSON.parse(oldData);

				// Convert to new format
				const newCredentials = CredentialMigrationService.convertToNewFormat(
					oldCredentials,
					pattern.flowKey
				);

				if (!dryRun) {
					// Save to new system
					if (pattern.flowKey === 'worker-token-credentials') {
						// Special handling for Worker Token - use the optimized service
						const workerTokenRepo = (await import('./workerTokenRepository')).WorkerTokenRepository.getInstance();
						await workerTokenRepo.saveCredentials(newCredentials as WorkerTokenCredentials);
					} else {
						// Regular flow credentials
						await credentialStorageManager.saveFlowCredentials(pattern.flowKey, newCredentials);
					}
				}

				report.migratedFlows.push(pattern.flowKey);
				console.log(`✅ Migrated ${pattern.description} → ${pattern.flowKey}`);
			} catch (error) {
				console.error(`❌ Failed to migrate ${pattern.description}:`, error);
				report.errors.push(
					`${pattern.description}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		console.log(`📊 [Migration] Summary:`);
		console.log(`  - Total old credentials: ${report.totalOldCredentials}`);
		console.log(`  - Migrated: ${report.migratedFlows.length}`);
		console.log(`  - Skipped: ${report.skippedFlows.length}`);
		console.log(`  - Errors: ${report.errors.length}`);
		console.groupEnd();

		return report;
	}

	/**
	 * Convert old credential format to new format
	 */
	private static convertToNewFormat(
		oldCredentials: any,
		flowKey: string
	): FlowCredentials | WorkerTokenCredentials {
		// Worker Token special case
		if (flowKey === 'worker-token-credentials') {
			return {
				environmentId: oldCredentials.environmentId || '',
				clientId: oldCredentials.clientId || '',
				clientSecret: oldCredentials.clientSecret || '',
				scopes: oldCredentials.scopes || ['p1:read:user', 'p1:update:user'],
				region: oldCredentials.region || 'us',
				tokenEndpoint:
					oldCredentials.tokenEndpoint ||
					CredentialMigrationService.buildTokenEndpoint(
						oldCredentials.environmentId,
						oldCredentials.region || 'us'
					),
			};
		}

		// Regular flow credentials
		return {
			environmentId: oldCredentials.environmentId || '',
			clientId: oldCredentials.clientId || '',
			clientSecret: oldCredentials.clientSecret || '',
			redirectUri: oldCredentials.redirectUri || '',
			scopes: oldCredentials.scopes || oldCredentials.scope?.split(' ') || [],
			authorizationEndpoint: oldCredentials.authorizationEndpoint || oldCredentials.authEndpoint,
			tokenEndpoint: oldCredentials.tokenEndpoint,
			userInfoEndpoint: oldCredentials.userInfoEndpoint,
			endSessionEndpoint: oldCredentials.endSessionEndpoint,
			clientAuthMethod:
				oldCredentials.clientAuthMethod || oldCredentials.tokenAuthMethod || 'client_secret_post',
			responseType: oldCredentials.responseType,
			responseMode: oldCredentials.responseMode,
			savedAt: Date.now(),
		};
	}

	/**
	 * Build token endpoint URL
	 */
	private static buildTokenEndpoint(environmentId: string, region: string): string {
		const regionUrls: Record<string, string> = {
			us: 'https://auth.pingone.com',
			eu: 'https://auth.pingone.eu',
			ap: 'https://auth.pingone.asia',
			ca: 'https://auth.pingone.ca',
		};

		const baseUrl = regionUrls[region] || regionUrls.us;
		return `${baseUrl}/${environmentId}/as/token`;
	}

	/**
	 * Clean up old credentials after successful migration
	 *
	 * @param report - Migration report
	 */
	static cleanupOldCredentials(report: MigrationReport): void {
		console.log('🧹 [Migration] Cleaning up old credentials...');

		for (const pattern of CredentialMigrationService.OLD_PATTERNS) {
			if (report.migratedFlows.includes(pattern.flowKey)) {
				try {
					localStorage.removeItem(pattern.key);
					console.log(`✅ Removed old key: ${pattern.key}`);
				} catch (error) {
					console.error(`❌ Failed to remove ${pattern.key}:`, error);
				}
			}
		}

		console.log('✅ [Migration] Cleanup complete');
	}

	/**
	 * Check if migration is needed
	 *
	 * @returns True if old credentials are detected
	 */
	static isMigrationNeeded(): boolean {
		const report = CredentialMigrationService.detectOldCredentials();
		return report.totalOldCredentials > 0;
	}

	/**
	 * Get list of available backups
	 *
	 * @returns Array of backup keys
	 */
	static getAvailableBackups(): string[] {
		const backups: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('credential_backup_')) {
				backups.push(key);
			}
		}

		return backups.sort().reverse(); // Most recent first
	}
}

export default CredentialMigrationService;
