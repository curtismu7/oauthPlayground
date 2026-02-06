/**
 * @file mfaRedirectUriServiceV8.ts
 * @module v8/services
 * @description Centralized service for MFA redirect URIs using flow mapping
 * @version 8.0.0
 *
 * This service provides the correct redirect URI for MFA flows based on the flow type.
 * Each flow has its own unique redirect URI to return to the correct place in the app.
 */

import { generateRedirectUriForFlow } from '@/utils/flowRedirectUriMapping';

const MODULE_TAG = '[🔗 MFA-REDIRECT-URI-SERVICE-V8]';

/**
 * MFA Redirect URI Service
 *
 * Provides the correct redirect URI for MFA flows based on flow type.
 * Uses the centralized flow mapping system to ensure each flow gets its unique URI.
 */
export class MFARedirectUriServiceV8 {
	/**
	 * Get the redirect URI for a specific MFA flow type
	 * This uses the centralized flow mapping to get the correct unique URI
	 *
	 * @param flowType - The flow type (e.g., 'unified-mfa-v8', 'oauth-authz-v8u')
	 * @returns The redirect URI for the specified flow
	 */
	static getRedirectUri(flowType: string): string {
		const redirectUri = generateRedirectUriForFlow(flowType);
		
		if (!redirectUri) {
			console.error(`${MODULE_TAG} No redirect URI found for flow type: ${flowType}`);
			// Fallback to a generic MFA callback
			const protocol = window.location.hostname === 'localhost' ? 'http' : 'https';
			return `${protocol}://${window.location.host}/v8/unified-mfa-callback`;
		}

		console.log(`${MODULE_TAG} Providing redirect URI for ${flowType}: ${redirectUri}`);
		return redirectUri;
	}

	/**
	 * Get the redirect URI for unified MFA flow (backward compatibility)
	 *
	 * @returns The redirect URI for unified MFA flow
	 */
	static getUnifiedMFARedirectUri(): string {
		return this.getRedirectUri('unified-mfa-v8');
	}

	/**
	 * Get the redirect URI for V8U OAuth flow
	 *
	 * @returns The redirect URI for V8U OAuth flow
	 */
	static getV8UOAuthRedirectUri(): string {
		return this.getRedirectUri('oauth-authz-v8u');
	}

	/**
	 * Get the redirect URI for MFA Hub flow
	 *
	 * @returns The redirect URI for MFA Hub flow
	 */
	static getMFAHubRedirectUri(): string {
		return this.getRedirectUri('mfa-hub-v8');
	}

	/**
	 * Check if a redirect URI is the old mfa-hub URI that needs migration
	 *
	 * @param uri - The redirect URI to check
	 * @returns True if the URI needs migration
	 */
	static needsMigration(uri: string | undefined): boolean {
		if (!uri) return true;

		return (
			uri.includes('mfa-hub') ||
			uri.includes('/user-mfa-login-callback') ||
			uri.includes('implicit-callback') ||
			uri.includes('authz-callback')
		);
	}

	/**
	 * Migrate credentials to use the correct redirect URI for their flow type
	 * This will update any saved credentials that have old redirect URIs
	 *
	 * @param credentials - The credentials object to migrate
	 * @param flowType - The flow type to get the correct URI for
	 * @returns The migrated credentials with correct redirect URI
	 */
	static migrateCredentials<T extends { redirectUri?: string }>(credentials: T, flowType: string): T {
		if (this.needsMigration(credentials.redirectUri)) {
			const correctUri = this.getRedirectUri(flowType);
			console.warn(`${MODULE_TAG} Migrating old redirect URI to: ${correctUri} (flow: ${flowType})`);

			return {
				...credentials,
				redirectUri: correctUri,
			};
		}

		return credentials;
	}
}
