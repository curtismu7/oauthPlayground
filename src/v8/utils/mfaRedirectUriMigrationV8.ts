/**
 * @file mfaRedirectUriMigrationV8.ts
 * @module v8/utils
 * @description Migration utility to update all saved credentials to use the correct redirect URIs for their flow types
 * @version 8.0.0
 */

import { MFARedirectUriServiceV8 } from '@/apps/mfa/services/mfaRedirectUriServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

const MODULE_TAG = '[🔄 MFA-REDIRECT-URI-MIGRATION-V8]';

/**
 * Mapping of credential store keys to their corresponding flow types
 */
const FLOW_KEY_TO_FLOW_TYPE: Record<string, string> = {
	'user-login-v8': 'unified-mfa-v8', // User login modal uses unified MFA flow
	'mfa-flow-v8': 'unified-mfa-v8', // MFA configuration pages use unified MFA flow
	'unified-mfa-v8': 'unified-mfa-v8', // Unified MFA flow
	'mfa-hub-v8': 'mfa-hub-v8', // MFA hub flow
	'oauth-authz-v8u': 'oauth-authz-v8u', // V8U OAuth flow
};

/**
 * Migrate all saved credentials to use the correct redirect URIs for their flow types
 * This should be run on app startup to ensure all old mfa-hub URIs are updated
 */
export function migrateAllMFARedirectUris(): void {
	console.log(`${MODULE_TAG} Starting redirect URI migration...`);

	let migratedCount = 0;

	for (const [flowKey, flowType] of Object.entries(FLOW_KEY_TO_FLOW_TYPE)) {
		try {
			// Load credentials
			const credentials = CredentialsServiceV8.loadCredentials(flowKey, {
				flowKey,
				flowType: 'oidc',
				includeClientSecret: true,
				includeRedirectUri: true,
				includeLogoutUri: false,
				includeScopes: true,
			});

			// Check if migration is needed
			if (MFARedirectUriServiceV8.needsMigration(credentials.redirectUri)) {
				const correctUri = MFARedirectUriServiceV8.getRedirectUri(flowType);
				console.warn(
					`${MODULE_TAG} Migrating ${flowKey}: ${credentials.redirectUri} → ${correctUri} (flow: ${flowType})`
				);

				// Migrate credentials with the correct flow type
				const migrated = MFARedirectUriServiceV8.migrateCredentials(credentials, flowType);

				// Save migrated credentials
				CredentialsServiceV8.saveCredentials(flowKey, migrated);

				migratedCount++;
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to migrate ${flowKey}:`, error);
		}
	}

	if (migratedCount > 0) {
		console.log(
			`${MODULE_TAG} ✅ Migration complete! Updated ${migratedCount} credential store(s)`
		);
	} else {
		console.log(`${MODULE_TAG} ✅ No migration needed - all credentials are up to date`);
	}
}

/**
 * Clear all old mfa-hub related data from localStorage
 * This is a more aggressive cleanup that removes any lingering old data
 */
export function clearOldMFAHubData(): void {
	console.log(`${MODULE_TAG} Clearing old mfa-hub data...`);

	try {
		// Get all localStorage keys
		const keys = Object.keys(localStorage);

		// Find and remove any keys that contain mfa-hub
		const keysToRemove = keys.filter(
			(key) =>
				key.includes('mfa-hub') ||
				key.includes('mfa_hub') ||
				key.includes('user-mfa-login-callback')
		);

		if (keysToRemove.length > 0) {
			console.warn(`${MODULE_TAG} Removing ${keysToRemove.length} old mfa-hub keys:`, keysToRemove);
			for (const key of keysToRemove) {
				localStorage.removeItem(key);
			}
		}

		console.log(`${MODULE_TAG} ✅ Old mfa-hub data cleared`);
	} catch (error) {
		console.warn(`${MODULE_TAG} Failed to clear old mfa-hub data:`, error);
	}
}
