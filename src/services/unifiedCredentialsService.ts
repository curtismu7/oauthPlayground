/**
 * Unified Credentials Service Adapter
 * 
 * This file provides a compatibility layer for the flowStorageService
 * to work with the V8U unified credentials service.
 */

import { UnifiedOAuthCredentialsServiceV8U } from '../v8u/services/unifiedOAuthCredentialsServiceV8U';

export interface CredentialsStorageOptions {
	flowName: string;
	environmentId?: string;
	enableBackup?: boolean;
}

export interface OAuthCredentials {
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scope?: string;
	state?: string;
	nonce?: string;
	codeVerifier?: string;
	codeChallenge?: string;
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	tokenType?: string;
	expiresIn?: number;
	expiresAt?: number;
	// Additional flow-specific fields
	[key: string]: unknown;
}

/**
 * Adapter class that provides the expected interface for flowStorageService
 */
class UnifiedCredentialsServiceAdapter {
	/**
	 * Store OAuth credentials
	 */
	async storeOAuthCredentials(
		credentials: OAuthCredentials,
		options: CredentialsStorageOptions
	): Promise<void> {
		try {
			// Use the V8U service with the flow name as the key
			await UnifiedOAuthCredentialsServiceV8U.saveCredentials(
				options.flowName,
				credentials,
				{
					...(options.enableBackup !== undefined && { enableBackup: options.enableBackup }),
					...(options.environmentId && { environmentId: options.environmentId }),
				}
			);
		} catch (error) {
			console.error('Failed to store credentials:', error);
			throw error;
		}
	}

	/**
	 * Get OAuth credentials
	 */
	async getOAuthCredentials(
		options: CredentialsStorageOptions
	): Promise<OAuthCredentials | null> {
		try {
			// Use the V8U service to retrieve credentials
			const credentials = await UnifiedOAuthCredentialsServiceV8U.loadCredentials(
				options.flowName,
				{
					...(options.enableBackup !== undefined && { enableBackup: options.enableBackup }),
					...(options.environmentId && { environmentId: options.environmentId }),
				}
			);
			// Type cast to match expected interface
			return credentials as OAuthCredentials | null;
		} catch (error) {
			console.error('Failed to load credentials:', error);
			return null;
		}
	}

	/**
	 * Clear OAuth credentials
	 */
	async clearOAuthCredentials(
		options: CredentialsStorageOptions
	): Promise<void> {
		try {
			await UnifiedOAuthCredentialsServiceV8U.deleteCredentials(options.flowName, {
				...(options.enableBackup !== undefined && { enableBackup: options.enableBackup }),
				...(options.environmentId && { environmentId: options.environmentId }),
			});
		} catch (error) {
			console.error('Failed to clear credentials:', error);
			throw error;
		}
	}
}

// Export singleton instance
export const unifiedCredentialsService = new UnifiedCredentialsServiceAdapter();

export default unifiedCredentialsService;
