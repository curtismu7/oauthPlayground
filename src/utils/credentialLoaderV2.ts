// src/utils/credentialLoaderV2.ts
// New credential loader using the isolated credential storage system

import type { StepCredentials } from '../components/steps/CommonSteps';
import { credentialStorageManager } from '../services/credentialStorageManager';
import { getCallbackUrlForFlow } from './callbackUrls';

/**
 * Load credentials for a specific flow using the new isolated storage system
 * 
 * NO FALLBACK to other flows - this eliminates credential bleeding!
 * 
 * @param flowKey - Unique flow key (e.g., 'oauth-implicit-v7')
 * @param defaultRedirectUri - Default redirect URI for this flow
 * @returns Credentials or empty credentials if not found
 */
export async function loadFlowCredentialsV2(
	flowKey: string,
	defaultRedirectUri?: string
): Promise<StepCredentials> {
	console.group(`🔍 [CredentialLoaderV2] Loading credentials for: ${flowKey}`);

	// Try to load from new isolated storage
	const result = await credentialStorageManager.loadFlowCredentials(flowKey);

	if (result.success && result.data) {
		console.log(`✅ Loaded from ${result.source}`);
		console.groupEnd();
		return result.data as StepCredentials;
	}

	// No credentials found - return empty credentials
	console.log(`❌ No credentials found for ${flowKey}`);
	console.log(`ℹ️ User will need to enter credentials or copy from Configuration`);
	console.groupEnd();

	return createEmptyCredentials(defaultRedirectUri);
}

/**
 * Save credentials for a specific flow using the new isolated storage system
 * 
 * @param flowKey - Unique flow key
 * @param credentials - Credentials to save
 */
export async function saveFlowCredentialsV2(
	flowKey: string,
	credentials: StepCredentials
): Promise<boolean> {
	console.log(`💾 [CredentialLoaderV2] Saving credentials for: ${flowKey}`);

	const result = await credentialStorageManager.saveFlowCredentials(flowKey, credentials);

	if (result.success) {
		console.log(`✅ Credentials saved successfully`);
		return true;
	}

	console.error(`❌ Failed to save credentials:`, result.error);
	return false;
}

/**
 * Create empty credentials with defaults
 */
function createEmptyCredentials(defaultRedirectUri?: string): StepCredentials {
	return {
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: defaultRedirectUri || '',
		scope: 'openid profile email',
		scopes: 'openid profile email',
		clientAuthMethod: 'client_secret_post',
	};
}

/**
 * Check if credentials are complete (have required fields)
 */
export function areCredentialsComplete(credentials: StepCredentials): boolean {
	return !!(
		credentials.environmentId?.trim() &&
		credentials.clientId?.trim() &&
		credentials.redirectUri?.trim()
	);
}

/**
 * Clear credentials for a specific flow
 */
export async function clearFlowCredentialsV2(flowKey: string): Promise<void> {
	console.log(`🗑️ [CredentialLoaderV2] Clearing credentials for: ${flowKey}`);
	await credentialStorageManager.clearFlowCredentials(flowKey);
	console.log(`✅ Credentials cleared`);
}
