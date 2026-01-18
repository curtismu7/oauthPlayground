/**
 * @file credentialReloadServiceV8U.ts
 * @module v8u/services
 * @description Standardized credential reload service for V8U flows
 * @version 1.0.0
 *
 * Ensures credentials are properly saved and retrieved when restarting flows.
 * This service provides a consistent pattern for all OAuth flows to preserve
 * credentials during flow resets.
 */

import { CredentialsServiceV8 } from '../../v8/services/credentialsServiceV8.ts';
import { EnvironmentIdServiceV8 } from '../../v8/services/environmentIdServiceV8.ts';
import { SharedCredentialsServiceV8 } from '../../v8/services/sharedCredentialsServiceV8.ts';
import type { UnifiedFlowCredentials } from './unifiedFlowIntegrationV8U.ts';

const MODULE_TAG = '[🔄 CREDENTIAL-RELOAD-V8U]';

/**
 * Reload credentials from storage after flow reset
 *
 * This function is called when the user clicks "Restart Flow" to ensure credentials
 * are properly restored from storage. It merges credentials from multiple sources:
 *
 * Storage sources (priority order):
 * 1. Shared credentials (global across all flows) - highest priority
 * 2. Flow-specific credentials (stored per flow type)
 * 3. Global environment ID (fallback)
 *
 * What gets reloaded:
 * - environmentId: PingOne environment ID
 * - clientId: Application client ID
 * - clientSecret: Client secret (if available)
 * - scopes: Requested OAuth scopes
 * - redirectUri: Flow-specific redirect URI
 * - clientAuthMethod: Client authentication method
 * - PKCE settings: Whether PKCE is enabled
 * - Refresh token settings: Whether refresh tokens are enabled
 *
 * What does NOT get reloaded (intentionally cleared):
 * - OAuth tokens (access_token, id_token, refresh_token)
 * - Authorization codes
 * - Device codes
 * - PKCE codes (code_verifier, code_challenge)
 * - Flow state (step completion, validation errors)
 *
 * This ensures users can restart a flow with the same credentials without
 * losing their saved configuration.
 *
 * @param flowKey - Flow key (e.g., 'oauth-authz-v8u', 'implicit-v8u')
 *                  Used to identify which flow-specific credentials to load
 * @returns Reloaded credentials merged from shared and flow-specific storage
 *          Returns minimal defaults if reload fails (empty clientId, default scopes)
 *
 * @example
 * // Called by UnifiedFlowSteps when user clicks "Restart Flow"
 * const credentials = reloadCredentialsAfterReset('oauth-authz-v8u');
 * setCredentials(credentials);
 *
 * @throws Never throws - always returns valid credentials object (may be minimal defaults)
 */
export function reloadCredentialsAfterReset(flowKey: string): UnifiedFlowCredentials {
	console.log(`${MODULE_TAG} Reloading credentials from storage for flow reset`, { flowKey });

	try {
		/**
		 * Step 1: Get flow configuration
		 *
		 * Flow config determines which credential fields are relevant for this flow type.
		 * For example, device code flow doesn't need redirectUri, but authorization code flow does.
		 */
		const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
			flowKey: flowKey,
			flowType: 'oauth' as const,
			includeClientSecret: true,
			includeScopes: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
		};

		/**
		 * Step 2: Load flow-specific credentials
		 *
		 * These are credentials stored specifically for this flow type.
		 * Examples: redirectUri (different per flow), scopes (may vary by flow)
		 */
		const flowSpecific = CredentialsServiceV8.loadCredentials(flowKey, config);

		/**
		 * Step 3: Load shared credentials
		 *
		 * Shared credentials are global across all flows:
		 * - environmentId: Same PingOne environment for all flows
		 * - clientId: Same application for all flows
		 * - clientSecret: Same secret for all flows
		 *
		 * Using synchronous load for immediate results (no async delay).
		 */
		const shared = SharedCredentialsServiceV8.loadSharedCredentialsSync();

		/**
		 * Step 4: Get global environment ID
		 *
		 * This is a fallback if neither shared nor flow-specific credentials have environmentId.
		 * The global environment ID is stored separately and used as a last resort.
		 */
		const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();

		/**
		 * Step 5: Merge credentials with priority
		 *
		 * Merge strategy (priority order):
		 * 1. Flow-specific credentials (highest priority - allows per-flow clientId/environmentId)
		 * 2. Shared credentials (fallback - user's global settings)
		 * 3. Global defaults (environment ID, empty strings)
		 *
		 * This ensures:
		 * - Each flow type can have its own clientId/environmentId (per-flow isolation)
		 * - Shared credentials provide fallback if flow-specific not set
		 * - We always have valid credentials (even if minimal)
		 */
		const merged: UnifiedFlowCredentials = {
			// Flow-specific credentials take priority (allows per-flow clientId/environmentId)
			// Fall back to shared credentials if flow-specific not available
			environmentId: (
				flowSpecific.environmentId?.trim() ||
				shared.environmentId?.trim() ||
				storedEnvId?.trim() ||
				''
			).trim(),
			clientId: (flowSpecific.clientId?.trim() || shared.clientId?.trim() || '').trim(),
			// Client secret: prefer flow-specific, then shared, but only if not empty
			...(flowSpecific.clientSecret?.trim()
				? { clientSecret: flowSpecific.clientSecret.trim() }
				: shared.clientSecret?.trim()
					? { clientSecret: shared.clientSecret.trim() }
					: {}),
			// Issuer URL: prefer flow-specific, then shared
			...(flowSpecific.issuerUrl?.trim()
				? { issuerUrl: flowSpecific.issuerUrl.trim() }
				: shared.issuerUrl?.trim()
					? { issuerUrl: shared.issuerUrl.trim() }
					: {}),
			// Client auth method: prefer flow-specific, then shared
			...(flowSpecific.clientAuthMethod
				? { clientAuthMethod: flowSpecific.clientAuthMethod }
				: shared.clientAuthMethod
					? { clientAuthMethod: shared.clientAuthMethod }
					: {}),
			// Flow-specific credentials
			...(flowSpecific.redirectUri?.trim() ? { redirectUri: flowSpecific.redirectUri.trim() } : {}),
			...(flowSpecific.postLogoutRedirectUri?.trim()
				? { postLogoutRedirectUri: flowSpecific.postLogoutRedirectUri.trim() }
				: {}),
			scopes: (flowSpecific.scopes?.trim() || 'openid').trim(),
			...(flowSpecific.responseType?.trim()
				? { responseType: flowSpecific.responseType.trim() }
				: {}),
			...(flowSpecific.loginHint?.trim() ? { loginHint: flowSpecific.loginHint.trim() } : {}),
			// Checkbox values - load from flow-specific storage
			...(typeof flowSpecific.usePKCE === 'boolean' ? { usePKCE: flowSpecific.usePKCE } : {}),
			...(typeof flowSpecific.enableRefreshToken === 'boolean'
				? { enableRefreshToken: flowSpecific.enableRefreshToken }
				: {}),
			...(typeof flowSpecific.useRedirectless === 'boolean'
				? { useRedirectless: flowSpecific.useRedirectless }
				: {}),
			...(typeof flowSpecific.usePAR === 'boolean' ? { usePAR: flowSpecific.usePAR } : {}),

			// OAuth/OIDC advanced parameters - load from flow-specific storage
			...(flowSpecific.responseMode ? { responseMode: flowSpecific.responseMode } : {}),
			...(flowSpecific.loginHint ? { loginHint: flowSpecific.loginHint } : {}),
			...(typeof flowSpecific.maxAge === 'number' ? { maxAge: flowSpecific.maxAge } : {}),
			...(flowSpecific.display ? { display: flowSpecific.display } : {}),
			...(flowSpecific.prompt ? { prompt: flowSpecific.prompt } : {}),
		};

		console.log(`${MODULE_TAG} ✅ Credentials reloaded from storage`, {
			flowKey,
			hasEnvId: !!merged.environmentId?.trim(),
			hasClientId: !!merged.clientId?.trim(),
			hasClientSecret: merged.clientSecret !== undefined && !!merged.clientSecret?.trim(),
			hasSharedEnvId: !!shared.environmentId?.trim(),
			hasSharedClientId: !!shared.clientId?.trim(),
			hasFlowSpecificEnvId: !!flowSpecific.environmentId?.trim(),
			hasFlowSpecificClientId: !!flowSpecific.clientId?.trim(),
		});

		return merged;
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Error reloading credentials from storage`, {
			flowKey,
			error: error instanceof Error ? error.message : String(error),
		});

		// Return minimal defaults if reload fails
		const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		return {
			environmentId: storedEnvId || '',
			clientId: '',
			scopes: 'openid',
		};
	}
}

/**
 * Save credentials before flow reset (optional - for safety)
 * Ensures credentials are persisted before any reset operation
 *
 * @param flowKey - Flow key
 * @param credentials - Credentials to save
 * @example
 * saveCredentialsBeforeReset('oauth-authz-v8u', credentials);
 */
export function saveCredentialsBeforeReset(
	flowKey: string,
	credentials: UnifiedFlowCredentials
): void {
	console.log(`${MODULE_TAG} Saving credentials before flow reset`, { flowKey });

	try {
		// Save flow-specific credentials
		CredentialsServiceV8.saveCredentials(flowKey, credentials);

		// Save shared credentials
		const sharedCreds: {
			environmentId: string;
			clientId: string;
			clientSecret?: string;
			issuerUrl?: string;
			clientAuthMethod?:
				| 'none'
				| 'client_secret_basic'
				| 'client_secret_post'
				| 'client_secret_jwt'
				| 'private_key_jwt';
		} = {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			...(credentials.clientSecret ? { clientSecret: credentials.clientSecret } : {}),
			...(credentials.issuerUrl ? { issuerUrl: credentials.issuerUrl } : {}),
			...(credentials.clientAuthMethod ? { clientAuthMethod: credentials.clientAuthMethod } : {}),
		};
		SharedCredentialsServiceV8.saveSharedCredentials(sharedCreds);

		console.log(`${MODULE_TAG} ✅ Credentials saved before reset`);
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Error saving credentials before reset`, {
			flowKey,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}
