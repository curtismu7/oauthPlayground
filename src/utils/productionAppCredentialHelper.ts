// src/utils/productionAppCredentialHelper.ts
// Helper utility to integrate standardized credential export/import into Production apps

import { 
	exportStandardizedCredentials, 
	importStandardizedCredentials,
	type StandardizedCredentialExport 
} from '@/services/standardizedCredentialExportService';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { UnifiedOAuthCredentialsServiceV8U } from '@/v8u/services/unifiedOAuthCredentialsServiceV8U';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { UnifiedWorkerTokenBackupServiceV8 } from '@/services/unifiedWorkerTokenBackupServiceV8';

// App type mapping for Production apps
export const PRODUCTION_APP_CONFIGS = {
	'mfa-feature-flags': {
		appName: 'MFA Feature Flags',
		appType: 'mfa' as const,
		flowKey: 'mfa-feature-flags-v8'
	},
	'api-status': {
		appName: 'API Status',
		appType: 'oauth' as const,
		flowKey: 'api-status-v8'
	},
	'flow-comparison': {
		appName: 'Flow Comparison Tool',
		appType: 'oauth' as const,
		flowKey: 'flow-comparison-v8u'
	},
	'resources-api': {
		appName: 'Resources API Tutorial',
		appType: 'oauth' as const,
		flowKey: 'resources-api-v8'
	},
	'spiffe-spire': {
		appName: 'SPIFFE/SPIRE Mock',
		appType: 'oauth' as const,
		flowKey: 'spiffe-spire-v8u'
	},
	'postman-generator': {
		appName: 'Postman Collection Generator',
		appType: 'oauth' as const,
		flowKey: 'postman-generator-v8'
	},
	'unified-mfa': {
		appName: 'Unified MFA',
		appType: 'mfa' as const,
		flowKey: 'unified-mfa-v8'
	},
	'unified-oauth': {
		appName: 'Unified OAuth & OIDC',
		appType: 'oauth' as const,
		flowKey: 'unified-oauth-v8u'
	},
	'delete-devices': {
		appName: 'Delete All Devices',
		appType: 'worker-token' as const,
		flowKey: 'delete-devices-v8'
	},
	'enhanced-state': {
		appName: 'Enhanced State Management',
		appType: 'oauth' as const,
		flowKey: 'enhanced-state-v8u'
	},
	'token-monitoring': {
		appName: 'Token Monitoring Dashboard',
		appType: 'worker-token' as const,
		flowKey: 'token-monitoring-v8u'
	},
	'protect-portal': {
		appName: 'Protect Portal App',
		appType: 'oauth' as const,
		flowKey: 'protect-portal-v8'
	}
};

/**
 * Get environment ID for SQLite backup
 */
function getEnvironmentId(): string {
	return localStorage.getItem('environmentId') || 
		   sessionStorage.getItem('environmentId') ||
		   'default-environment';
}

/**
 * Save credentials with SQLite backup for Production apps
 */
export async function saveProductionAppCredentials(appId: keyof typeof PRODUCTION_APP_CONFIGS, credentials: Record<string, unknown>): Promise<void> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		throw new Error(`Unknown app: ${appId}`);
	}

	const environmentId = getEnvironmentId();
	
	try {
		switch (config.appType) {
			case 'oauth': {
				// Save to unified OAuth credentials service with SQLite backup
				await UnifiedOAuthCredentialsServiceV8U.saveCredentials(config.flowKey, {
					environmentId,
					clientId: credentials.clientId as string,
					clientSecret: credentials.clientSecret as string,
					redirectUri: credentials.redirectUri as string,
					scopes: credentials.scopes as string[],
					responseType: credentials.responseType as string,
					tokenEndpointAuthMethod: credentials.tokenEndpointAuthMethod as string,
					grantType: credentials.grantType as string,
					includeClientSecret: credentials.includeClientSecret as boolean,
					includeLogoutUri: credentials.includeLogoutUri as boolean,
					includeScopes: credentials.includeScopes as boolean,
				}, {
					environmentId,
					enableBackup: true,
					backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
				});
				break;
			}
			
			case 'worker-token': {
				// Save worker token credentials with SQLite backup
				await UnifiedWorkerTokenBackupServiceV8.saveWorkerTokenBackup(credentials as any, {
					environmentId,
					enableBackup: true,
					backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
				});
				break;
			}
			
			case 'mfa': {
				// Save MFA credentials to unified OAuth service for consistency
				await UnifiedOAuthCredentialsServiceV8U.saveSharedCredentials({
					environmentId,
					...credentials,
				}, {
					environmentId,
					enableBackup: true,
					backupExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
				});
				break;
			}
			
			default:
				// Fallback to basic credentials service
				CredentialsServiceV8.saveCredentials(config.flowKey, credentials);
		}
		
		console.log(`✅ [PRODUCTION-APP] ${config.appName} credentials saved with SQLite backup`);
	} catch (error) {
		console.warn(`⚠️ [PRODUCTION-APP] SQLite backup failed for ${config.appName}, using fallback:`, error);
		// Fallback to basic credentials service
		CredentialsServiceV8.saveCredentials(config.flowKey, credentials);
	}
}

/**
 * Load credentials with SQLite backup for Production apps
 */
export async function loadProductionAppCredentials(appId: keyof typeof PRODUCTION_APP_CONFIGS): Promise<Record<string, unknown> | null> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		throw new Error(`Unknown app: ${appId}`);
	}

	const environmentId = getEnvironmentId();
	
	try {
		switch (config.appType) {
			case 'oauth': {
				// Load from unified OAuth credentials service with SQLite backup
				const credentials = await UnifiedOAuthCredentialsServiceV8U.loadCredentials(config.flowKey, {
					environmentId,
					enableBackup: true,
				});
				return credentials;
			}
			
			case 'worker-token': {
				// Load worker token credentials with SQLite backup
				const credentials = await UnifiedWorkerTokenBackupServiceV8.loadWorkerTokenBackup({
					environmentId,
					enableBackup: true,
				});
				return credentials;
			}
			
			case 'mfa': {
				// Load MFA credentials from unified OAuth service
				const credentials = await UnifiedOAuthCredentialsServiceV8U.loadSharedCredentials({
					environmentId,
					enableBackup: true,
				});
				return credentials;
			}
			
			default:
				// Fallback to basic credentials service
				return CredentialsServiceV8.loadCredentials(config.flowKey);
		}
	} catch (error) {
		console.warn(`⚠️ [PRODUCTION-APP] SQLite backup load failed for ${config.appName}, using fallback:`, error);
		// Fallback to basic credentials service
		return CredentialsServiceV8.loadCredentials(config.flowKey);
	}
}

/**
 * Check if Production app has credentials stored
 */
export async function hasProductionAppCredentials(appId: keyof typeof PRODUCTION_APP_CONFIGS): Promise<boolean> {
	try {
		const credentials = await loadProductionAppCredentials(appId);
		return credentials !== null && Object.keys(credentials).length > 0;
	} catch (error) {
		return false;
	}
}

/**
 * Export credentials for a Production app
 */
export async function exportProductionAppCredentials(appId: keyof typeof PRODUCTION_APP_CONFIGS): Promise<void> {
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
				const workerCreds = await unifiedWorkerTokenService.loadCredentials();
				if (!workerCreds) {
					throw new Error('No worker token credentials found');
				}
				credentials = {
					environmentId: workerCreds.environmentId,
					clientId: workerCreds.clientId,
					clientSecret: workerCreds.clientSecret,
					scopes: ['openid'], // Default scope
					region: workerCreds.region || 'us',
					authMethod: 'client_secret_basic'
				};
				break;
			}

			case 'mfa': {
				// Get MFA credentials
				const mfaCreds = CredentialsServiceV8.loadCredentials(config.flowKey, {
					flowKey: config.flowKey,
					flowType: 'oauth',
					includeClientSecret: true,
					includeRedirectUri: true,
					includeLogoutUri: false,
					includeScopes: true
				});
				if (!mfaCreds || !mfaCreds.environmentId) {
					throw new Error('No MFA credentials found');
				}
				credentials = {
					environmentId: mfaCreds.environmentId,
					clientId: mfaCreds.clientId || '',
					clientSecret: mfaCreds.clientSecret || '',
					redirectUri: mfaCreds.redirectUri || '',
					scopes: mfaCreds.scopes || []
				};
				metadata.flowType = 'mfa_registration';
				break;
			}

			case 'oauth': {
				// Get OAuth credentials from unified service
				const oauthCreds = await UnifiedOAuthCredentialsServiceV8U.loadCredentials(config.flowKey);
				if (!oauthCreds || !oauthCreds.environmentId) {
					// Fallback to V8 service
					const v8Creds = CredentialsServiceV8.loadCredentials(config.flowKey, {
						flowKey: config.flowKey,
						flowType: 'oauth',
						includeClientSecret: true,
						includeRedirectUri: true,
						includeLogoutUri: true,
						includeScopes: true
					});
					if (!v8Creds || !v8Creds.environmentId) {
						throw new Error('No OAuth credentials found');
					}
					credentials = {
						environmentId: v8Creds.environmentId,
						clientId: v8Creds.clientId || '',
						clientSecret: v8Creds.clientSecret || '',
						redirectUri: v8Creds.redirectUri || '',
						logoutUri: v8Creds.logoutUri || '',
						scopes: v8Creds.scopes || []
					};
				} else {
					credentials = {
						environmentId: oauthCreds.environmentId,
						clientId: oauthCreds.clientId || '',
						clientSecret: oauthCreds.clientSecret || '',
						redirectUri: oauthCreds.redirectUri || '',
						scopes: oauthCreds.scope ? oauthCreds.scope.split(' ') : []
					};
				}
				metadata.flowType = config.flowKey.includes('authz') ? 'authorization_code' : 'oauth';
				break;
			}

			default:
				throw new Error(`Unsupported app type: ${config.appType}`);
		}

		// Add common metadata
		metadata.environment = credentials.environmentId;
		metadata.region = credentials.region || 'us';

		// Export using standardized format
		exportStandardizedCredentials(config.appName, config.appType, credentials, metadata);
	} catch (error) {
		console.error(`[ProductionAppCredentialHelper] Failed to export credentials for ${config.appName}:`, error);
		throw error;
	}
}

/**
 * Import credentials for a Production app
 */
export async function importProductionAppCredentials(
	appId: keyof typeof PRODUCTION_APP_CONFIGS,
	file: File
): Promise<void> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		throw new Error(`Unknown app: ${appId}`);
	}

	try {
		const imported = await importStandardizedCredentials(file);
		
		// Validate and extract credentials
		const creds = imported.credentials;
		
		switch (config.appType) {
			case 'worker-token': {
				// Save to unified worker token service
				await unifiedWorkerTokenService.saveCredentials({
					environmentId: creds.environmentId,
					clientId: creds.clientId,
					clientSecret: creds.clientSecret,
					region: creds.region || 'us'
				});
				break;
			}

			case 'mfa': {
				// Save to MFA credentials service
				await CredentialsServiceV8.saveCredentials(config.flowKey, {
					environmentId: creds.environmentId,
					clientId: creds.clientId,
					clientSecret: creds.clientSecret,
					redirectUri: creds.redirectUri || '',
					scopes: creds.scopes || []
				});
				break;
			}

			case 'oauth': {
				// Save to unified OAuth credentials service
				await UnifiedOAuthCredentialsServiceV8U.saveCredentials(config.flowKey, {
					environmentId: creds.environmentId,
					clientId: creds.clientId,
					clientSecret: creds.clientSecret,
					redirectUri: creds.redirectUri || '',
					scope: (creds.scopes || []).join(' ')
				});
				break;
			}

			default:
				throw new Error(`Unsupported app type: ${config.appType}`);
		}

		console.log(`[ProductionAppCredentialHelper] Successfully imported credentials for ${config.appName}`);
	} catch (error) {
		console.error(`[ProductionAppCredentialHelper] Failed to import credentials for ${config.appName}:`, error);
		throw error;
	}
}

/**
 * Check if an app has credentials available
 */
export async function hasProductionAppCredentials(appId: keyof typeof PRODUCTION_APP_CONFIGS): Promise<boolean> {
	const config = PRODUCTION_APP_CONFIGS[appId];
	if (!config) {
		return false;
	}

	try {
		switch (config.appType) {
			case 'worker-token': {
				const workerCreds = await unifiedWorkerTokenService.loadCredentials();
				return !!workerCreds;
			}

			case 'mfa': {
				const mfaCreds = CredentialsServiceV8.loadCredentials(config.flowKey, {
					flowKey: config.flowKey,
					flowType: 'oauth',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false
				});
				return !!mfaCreds?.environmentId;
			}

			case 'oauth': {
				const oauthCreds = await UnifiedOAuthCredentialsServiceV8U.loadCredentials(config.flowKey);
				if (oauthCreds?.environmentId) {
					return true;
				}
				// Fallback check
				const v8Creds = CredentialsServiceV8.loadCredentials(config.flowKey, {
					flowKey: config.flowKey,
					flowType: 'oauth',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false
				});
				return !!v8Creds?.environmentId;
			}

			default:
				return false;
		}
	} catch (error) {
		console.error(`[ProductionAppCredentialHelper] Error checking credentials for ${config.appName}:`, error);
		return false;
	}
}
