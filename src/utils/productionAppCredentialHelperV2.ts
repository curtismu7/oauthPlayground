// src/utils/productionAppCredentialHelperV2.ts
// Enhanced helper utility for Production apps with SQLite backup integration

import {
	exportStandardizedCredentials,
	importStandardizedCredentials,
	type StandardizedCredentialExport,
} from '@/services/standardizedCredentialExportService';
import { UnifiedWorkerTokenBackupServiceV8 } from '@/services/unifiedWorkerTokenBackupServiceV8';
import type { UnifiedWorkerTokenCredentials } from '@/services/unifiedWorkerTokenService';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { UnifiedOAuthCredentialsServiceV8U } from '@/v8u/services/unifiedOAuthCredentialsServiceV8U';

// App type mapping for Production apps
export const PRODUCTION_APP_CONFIGS = {
	'mfa-feature-flags': {
		appName: 'MFA Feature Flags',
		appType: 'mfa' as const,
		flowKey: 'mfa-feature-flags-v8',
	},
	'api-status': {
		appName: 'API Status',
		appType: 'oauth' as const,
		flowKey: 'api-status-v8',
	},
	'flow-comparison': {
		appName: 'Flow Comparison Tool',
		appType: 'oauth' as const,
		flowKey: 'flow-comparison-v8u',
	},
	'resources-api': {
		appName: 'Resources API Tutorial',
		appType: 'oauth' as const,
		flowKey: 'resources-api-v8',
	},
	'spiffe-spire': {
		appName: 'SPIFFE/SPIRE Mock',
		appType: 'oauth' as const,
		flowKey: 'spiffe-spire-v8u',
	},
	'postman-generator': {
		appName: 'Postman Collection Generator',
		appType: 'oauth' as const,
		flowKey: 'postman-generator-v8',
	},
	'unified-mfa': {
		appName: 'Unified MFA',
		appType: 'mfa' as const,
		flowKey: 'unified-mfa-v8',
	},
	'unified-oauth': {
		appName: 'Unified OAuth & OIDC',
		appType: 'oauth' as const,
		flowKey: 'unified-oauth-v8u',
	},
	'delete-devices': {
		appName: 'Delete All Devices',
		appType: 'worker-token' as const,
		flowKey: 'delete-devices-v8',
	},
	'enhanced-state': {
		appName: 'Enhanced State Management',
		appType: 'oauth' as const,
		flowKey: 'enhanced-state-v8u',
	},
	'token-monitoring': {
		appName: 'Token Monitoring Dashboard',
		appType: 'worker-token' as const,
		flowKey: 'token-monitoring-v8u',
	},
	'protect-portal': {
		appName: 'Protect Portal App',
		appType: 'oauth' as const,
		flowKey: 'protect-portal-v8',
	},
};

export type ProductionAppId = keyof typeof PRODUCTION_APP_CONFIGS;

/**
 * Get environment ID for SQLite backup
 */
function getEnvironmentId(): string {
	return (
		localStorage.getItem('environmentId') ||
		sessionStorage.getItem('environmentId') ||
		'default-environment'
	);
}

/**
 * Save credentials with SQLite backup for Production apps
 */
export async function saveProductionAppCredentialsWithSQLite(
	appId: ProductionAppId,
	credentials: Record<string, unknown>
): Promise<void> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		throw new Error(`Unknown app: ${appId}`);
	}

	const environmentId = getEnvironmentId();

	try {
		switch (config.appType) {
			case 'oauth': {
				// Save to unified OAuth credentials service with SQLite backup
				await UnifiedOAuthCredentialsServiceV8U.saveCredentials(
					config.flowKey,
					{
						environmentId,
						clientId: credentials.clientId as string,
						clientSecret: credentials.clientSecret as string,
						redirectUri: credentials.redirectUri as string,
						scope: credentials.scope as string,
						responseType: credentials.responseType as string,
						tokenEndpointAuthMethod: credentials.tokenEndpointAuthMethod as string,
						grantType: credentials.grantType as string,
						includeClientSecret: credentials.includeClientSecret as boolean,
						includeLogoutUri: credentials.includeLogoutUri as boolean,
						includeScopes: credentials.includeScopes as boolean,
					},
					{
						environmentId,
						enableBackup: true,
						backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
					}
				);
				break;
			}

			case 'worker-token': {
				// Save worker token credentials with SQLite backup
				await UnifiedWorkerTokenBackupServiceV8.saveWorkerTokenBackup(
					credentials as UnifiedWorkerTokenCredentials,
					{
						environmentId,
						enableBackup: true,
						backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
					}
				);
				break;
			}

			case 'mfa': {
				// Save MFA credentials to unified OAuth service for consistency
				await UnifiedOAuthCredentialsServiceV8U.saveSharedCredentials(
					{
						environmentId,
						...credentials,
					},
					{
						environmentId,
						enableBackup: true,
						backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
					}
				);
				break;
			}

			default:
				throw new Error(`Unknown app type: ${config.appType}`);
		}

		console.log(`✅ [PRODUCTION-APP] ${config.appName} credentials saved with SQLite backup`);
	} catch (error) {
		console.warn(
			`⚠️ [PRODUCTION-APP] SQLite backup failed for ${config.appName}, using fallback:`,
			error
		);
		// Fallback to basic credentials service
		CredentialsServiceV8.saveCredentials(config.flowKey, credentials as any);
	}
}

/**
 * Load credentials with SQLite backup for Production apps
 */
export async function loadProductionAppCredentialsWithSQLite(
	appId: ProductionAppId
): Promise<Record<string, unknown> | null> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		throw new Error(`Unknown app: ${appId}`);
	}

	const environmentId = getEnvironmentId();

	try {
		switch (config.appType) {
			case 'oauth': {
				// Load from unified OAuth credentials service with SQLite backup
				const credentials = await UnifiedOAuthCredentialsServiceV8U.loadCredentials(
					config.flowKey,
					{
						environmentId,
						enableBackup: true,
					}
				);
				return credentials as Record<string, unknown>;
			}

			case 'worker-token': {
				// Load worker token credentials with SQLite backup
				const credentials = await UnifiedWorkerTokenBackupServiceV8.loadWorkerTokenBackup({
					environmentId,
					enableBackup: true,
				});
				return credentials as Record<string, unknown>;
			}

			case 'mfa': {
				// Load MFA credentials from unified OAuth service
				const credentials = await UnifiedOAuthCredentialsServiceV8U.loadSharedCredentials({
					environmentId,
					enableBackup: true,
				});
				return credentials as Record<string, unknown>;
			}

			default:
				throw new Error(`Unknown app type: ${config.appType}`);
		}
	} catch (error) {
		console.warn(
			`⚠️ [PRODUCTION-APP] SQLite backup load failed for ${config.appName}, using fallback:`,
			error
		);
		// Fallback to basic credentials service
		return CredentialsServiceV8.loadCredentials(config.flowKey, {}) as Record<string, unknown>;
	}
}

/**
 * Check if Production app has credentials stored
 */
export async function hasProductionAppCredentialsWithSQLite(
	appId: ProductionAppId
): Promise<boolean> {
	try {
		const credentials = await loadProductionAppCredentialsWithSQLite(appId);
		return credentials !== null && Object.keys(credentials).length > 0;
	} catch {
		return false;
	}
}

/**
 * Export credentials for a Production app with SQLite integration
 */
export async function exportProductionAppCredentialsWithSQLite(
	appId: ProductionAppId
): Promise<void> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		throw new Error(`Unknown app: ${appId}`);
	}

	let credentials: Record<string, unknown>;
	let metadata: StandardizedCredentialExport['metadata'] = {};

	try {
		switch (config.appType) {
			case 'worker-token': {
				// Get worker token credentials
				const workerCreds = await loadProductionAppCredentialsWithSQLite(appId);
				if (!workerCreds) {
					throw new Error('No worker token credentials found');
				}
				credentials = {
					environmentId: workerCreds.environmentId,
					clientId: workerCreds.clientId,
					clientSecret: workerCreds.clientSecret,
					region: workerCreds.region,
					tokenEndpointAuthMethod: workerCreds.tokenEndpointAuthMethod,
					scopes: workerCreds.scopes,
				};
				metadata = {
					appName: config.appName,
					appType: config.appType,
					flowKey: config.flowKey,
					exportedAt: new Date().toISOString(),
					version: '2.0',
				};
				break;
			}

			case 'oauth': {
				// Get OAuth credentials from unified service
				const oauthCreds = await loadProductionAppCredentialsWithSQLite(appId);
				if (!oauthCreds || !oauthCreds.environmentId) {
					throw new Error('No OAuth credentials found');
				}
				credentials = oauthCreds;
				metadata = {
					appName: config.appName,
					appType: config.appType,
					flowKey: config.flowKey,
					exportedAt: new Date().toISOString(),
					version: '2.0',
				};
				break;
			}

			case 'mfa': {
				// Get MFA credentials
				const mfaCreds = await loadProductionAppCredentialsWithSQLite(appId);
				if (!mfaCreds) {
					throw new Error('No MFA credentials found');
				}
				credentials = mfaCreds;
				metadata = {
					appName: config.appName,
					appType: config.appType,
					flowKey: config.flowKey,
					exportedAt: new Date().toISOString(),
					version: '2.0',
				};
				break;
			}

			default:
				throw new Error(`Unknown app type: ${config.appType}`);
		}

		await exportStandardizedCredentials(credentials, metadata);
		console.log(`✅ Exported ${config.appName} credentials with SQLite backup metadata`);
	} catch (error) {
		console.error(`❌ Failed to export ${config.appName} credentials:`, error);
		throw error;
	}
}

/**
 * Import credentials for a Production app with SQLite integration
 */
export async function importProductionAppCredentialsWithSQLite(
	appId: ProductionAppId,
	file: File
): Promise<void> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		throw new Error(`Unknown app: ${appId}`);
	}

	try {
		const importedData = await importStandardizedCredentials(file);

		if (!importedData.credentials) {
			throw new Error('No credentials found in import file');
		}

		// Validate metadata matches app type
		if (importedData.metadata.appType !== config.appType) {
			throw new Error(
				`Import file type (${importedData.metadata.appType}) doesn't match app type (${config.appType})`
			);
		}

		// Save credentials with SQLite backup
		await saveProductionAppCredentialsWithSQLite(appId, importedData.credentials);
		console.log(`✅ Imported ${config.appName} credentials with SQLite backup`);
	} catch (error) {
		console.error(`❌ Failed to import ${config.appName} credentials:`, error);
		throw error;
	}
}

/**
 * Verify SQLite backup integration for all Production apps
 */
export async function verifyProductionAppsSQLiteIntegration(): Promise<
	{ appId: ProductionAppId; appName: string; hasBackup: boolean; error?: string }[]
> {
	const results: { appId: ProductionAppId; appName: string; hasBackup: boolean; error?: string }[] =
		[];

	for (const appId of Object.keys(PRODUCTION_APP_CONFIGS) as ProductionAppId[]) {
		const config = PRODUCTION_APP_CONFIGS[appId];
		try {
			const hasBackup = await hasProductionAppCredentialsWithSQLite(appId);
			results.push({
				appId,
				appName: config.appName,
				hasBackup,
			});
		} catch (error) {
			results.push({
				appId,
				appName: config.appName,
				hasBackup: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	return results;
}
