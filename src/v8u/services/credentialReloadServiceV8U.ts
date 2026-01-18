/**
 * @file credentialReloadServiceV8U.ts
 * @module v8u/services
 * @description Standardized credential reload service for V8U flows
 * @version 1.0.0
 *
 * Ensures credentials are properly saved and retrieved when restarting flows.
 * This service provides a consistent pattern for all OAuth flows to preserve
 * credentials during flow resets.
 *
 * CRITICAL: This service must load ALL fields from UnifiedFlowCredentials:
 * - Basic: environmentId, clientId, clientSecret, redirectUri, scopes, etc.
 * - Advanced: responseMode, usePAR, maxAge, display, prompt, loginHint
 * - PKCE: pkceEnforcement, usePKCE (legacy)
 * - Tokens: enableRefreshToken
 * - Auth: clientAuthMethod, privateKey, issuerUrl
 * - Other: postLogoutRedirectUri, logoutUri, responseType, useRedirectless (deprecated)
 */

import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { SharedCredentialsServiceV8 } from '@/v8/services/sharedCredentialsServiceV8';
import type { UnifiedFlowCredentials } from '@/v8u/services/unifiedFlowIntegrationV8U';

const MODULE_TAG = '[🔄 CREDENTIAL-RELOAD-V8U]';

/**
 * Helper function to merge ALL credential fields from flow-specific and shared storage
 * This ensures no fields are lost when reloading credentials
 */
function mergeAllCredentialFields(
	flowSpecific: Record<string, unknown>,
	shared: Record<string, unknown>,
	storedEnvId: string | null
): UnifiedFlowCredentials {
	return {
		// Basic credentials - priority: flow-specific > shared > global defaults
		environmentId: (
			(flowSpecific.environmentId as string)?.trim() ||
			(shared.environmentId as string)?.trim() ||
			storedEnvId?.trim() ||
			''
		).trim(),
		clientId: (
			(flowSpecific.clientId as string)?.trim() || 
			(shared.clientId as string)?.trim() || 
			''
		).trim(),
		// Client secret: prefer flow-specific, then shared, but only if not empty
		...(flowSpecific.clientSecret && typeof flowSpecific.clientSecret === 'string' && flowSpecific.clientSecret.trim()
			? { clientSecret: flowSpecific.clientSecret.trim() }
			: shared.clientSecret && typeof shared.clientSecret === 'string' && shared.clientSecret.trim()
				? { clientSecret: shared.clientSecret.trim() }
				: {}),
		// Issuer URL: prefer flow-specific, then shared
		...(flowSpecific.issuerUrl && typeof flowSpecific.issuerUrl === 'string' && flowSpecific.issuerUrl.trim()
			? { issuerUrl: flowSpecific.issuerUrl.trim() }
			: shared.issuerUrl && typeof shared.issuerUrl === 'string' && shared.issuerUrl.trim()
				? { issuerUrl: shared.issuerUrl.trim() }
				: {}),
		// Client auth method: prefer flow-specific, then shared
		...(flowSpecific.clientAuthMethod
			? { clientAuthMethod: flowSpecific.clientAuthMethod as UnifiedFlowCredentials['clientAuthMethod'] }
			: shared.clientAuthMethod
				? { clientAuthMethod: shared.clientAuthMethod as UnifiedFlowCredentials['clientAuthMethod'] }
				: {}),
		// Flow-specific credentials (not shared)
		...(flowSpecific.redirectUri && typeof flowSpecific.redirectUri === 'string' && flowSpecific.redirectUri.trim()
			? { redirectUri: flowSpecific.redirectUri.trim() }
			: {}),
		...(flowSpecific.postLogoutRedirectUri && typeof flowSpecific.postLogoutRedirectUri === 'string' && flowSpecific.postLogoutRedirectUri.trim()
			? { postLogoutRedirectUri: flowSpecific.postLogoutRedirectUri.trim() }
			: {}),
		...(flowSpecific.logoutUri && typeof flowSpecific.logoutUri === 'string' && flowSpecific.logoutUri.trim()
			? { logoutUri: flowSpecific.logoutUri.trim() }
			: {}),
		scopes: (
			(flowSpecific.scopes as string)?.trim() || 
			'openid'
		).trim(),
		...(flowSpecific.responseType && typeof flowSpecific.responseType === 'string' && flowSpecific.responseType.trim()
			? { responseType: flowSpecific.responseType.trim() }
			: {}),
		// Checkbox values - load from flow-specific storage
		...(typeof flowSpecific.usePKCE === 'boolean' ? { usePKCE: flowSpecific.usePKCE } : {}),
		...(typeof flowSpecific.enableRefreshToken === 'boolean'
			? { enableRefreshToken: flowSpecific.enableRefreshToken }
			: {}),
		...(typeof flowSpecific.useRedirectless === 'boolean'
			? { useRedirectless: flowSpecific.useRedirectless }
			: {}),
		...(typeof flowSpecific.usePAR === 'boolean' ? { usePAR: flowSpecific.usePAR } : {}),
		// PKCE enforcement - load from flow-specific storage (CRITICAL: was missing!)
		...(flowSpecific.pkceEnforcement
			? { pkceEnforcement: flowSpecific.pkceEnforcement as UnifiedFlowCredentials['pkceEnforcement'] }
			: {}),
		// Private key for private_key_jwt authentication
		...(flowSpecific.privateKey && typeof flowSpecific.privateKey === 'string'
			? { privateKey: flowSpecific.privateKey }
			: {}),
		// OAuth/OIDC advanced parameters - load from flow-specific storage
		// IMPORTANT: Load ALL advanced options to ensure they persist across restarts
		...(flowSpecific.responseMode
			? { responseMode: flowSpecific.responseMode as UnifiedFlowCredentials['responseMode'] }
			: {}),
		...(flowSpecific.loginHint && typeof flowSpecific.loginHint === 'string'
			? { loginHint: flowSpecific.loginHint.trim() }
			: flowSpecific.loginHint === ''
				? { loginHint: '' }
				: {}),
		...(typeof flowSpecific.maxAge === 'number' ? { maxAge: flowSpecific.maxAge } : {}),
		...(flowSpecific.maxAge === null ? { maxAge: undefined } : {}), // Explicitly handle null
		...(flowSpecific.display
			? { display: flowSpecific.display as UnifiedFlowCredentials['display'] }
			: {}),
		...(flowSpecific.prompt
			? { prompt: flowSpecific.prompt as UnifiedFlowCredentials['prompt'] }
			: {}),
	};
}

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
 * - redirectUri: Flow-specific redirect URI (CRITICAL: Must be in flow-specific storage)
 * - clientAuthMethod: Client authentication method (can be in flow-specific or shared)
 * - PKCE settings: Whether PKCE is enabled
 * - Refresh token settings: Whether refresh tokens are enabled
 * - ALL advanced options: responseMode, usePAR, maxAge, display, prompt, loginHint
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
 * @param flowKey - Flow key (e.g., 'oidc-oauth-authz-v8u', 'oauth2.0-implicit-v8u')
 *                  Format: {specVersion}-{flowType}-v8u
 *                  Used to identify which flow-specific credentials to load
 * @returns Reloaded credentials merged from shared and flow-specific storage
 *          Returns minimal defaults if reload fails (empty clientId, default scopes)
 *
 * @example
 * // Called by UnifiedFlowSteps when user clicks "Restart Flow"
 * const credentials = reloadCredentialsAfterReset('oidc-oauth-authz-v8u');
 * setCredentials(credentials);
 *
 * @throws Never throws - always returns valid credentials object (may be minimal defaults)
 */
export async function reloadCredentialsAfterReset(flowKey: string): Promise<UnifiedFlowCredentials> {
	console.log(`${MODULE_TAG} Reloading credentials from storage for flow reset`, { flowKey });

	// Debug: Check what's actually in localStorage for this flowKey
	try {
		const storageKey = `v8_credentials_${flowKey}`;
		const rawStored = localStorage.getItem(storageKey);
		if (rawStored) {
			const parsedStored = JSON.parse(rawStored);
			console.log(`${MODULE_TAG} 🔍 DEBUG: Raw localStorage data for flowKey`, {
				flowKey,
				storageKey,
				hasRedirectUri: !!parsedStored.redirectUri,
				redirectUri: parsedStored.redirectUri,
				hasClientAuthMethod: !!parsedStored.clientAuthMethod,
				clientAuthMethod: parsedStored.clientAuthMethod,
				allKeys: Object.keys(parsedStored),
			});
		} else {
			console.warn(`${MODULE_TAG} ⚠️ DEBUG: No data in localStorage for flowKey`, { flowKey, storageKey });
		}
	} catch (debugError) {
		console.warn(`${MODULE_TAG} ⚠️ DEBUG: Error checking localStorage`, { flowKey, error: debugError });
	}

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
		 * 
		 * CRITICAL: Use loadCredentialsWithBackup to ensure we get credentials from
		 * all storage sources (localStorage, IndexedDB, server backup)
		 * 
		 * CRITICAL: loadCredentials returns the ENTIRE JSON object from storage,
		 * including ALL fields (redirectUri, clientAuthMethod, etc.)
		 */
		// Try async backup first (more reliable), fall back to sync if needed
		let flowSpecific: Record<string, unknown>;
		try {
			// Use async backup version for better persistence
			const loaded = await CredentialsServiceV8.loadCredentialsWithBackup(flowKey, config);
			flowSpecific = loaded as Record<string, unknown>;
		} catch (error) {
			console.warn(`${MODULE_TAG} ⚠️ Async load failed, using sync fallback`, { flowKey, error });
			// Fall back to sync version
			flowSpecific = CredentialsServiceV8.loadCredentials(flowKey, config) as Record<string, unknown>;
		}
		
		// Debug: Log what was loaded to verify redirectUri and clientAuthMethod are present
		console.log(`${MODULE_TAG} 🔍 Loaded flow-specific credentials`, {
			flowKey,
			hasRedirectUri: !!flowSpecific.redirectUri,
			redirectUri: flowSpecific.redirectUri,
			hasClientAuthMethod: !!flowSpecific.clientAuthMethod,
			clientAuthMethod: flowSpecific.clientAuthMethod,
			allKeys: Object.keys(flowSpecific),
		});
		// #region agent log
		import('@/v8/utils/analyticsV8').then(({ analytics }) => {
			analytics.log({ location:'credentialReloadServiceV8U.ts:190',message:'Loaded flow-specific credentials from storage',data:{flowKey,hasRedirectUri:!!flowSpecific.redirectUri,redirectUri:flowSpecific.redirectUri,hasClientAuthMethod:!!flowSpecific.clientAuthMethod,clientAuthMethod:flowSpecific.clientAuthMethod,allKeys:Object.keys(flowSpecific)} });
		}).catch(()=>{});
		// #endregion

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
		 * - ALL fields from UnifiedFlowCredentials are loaded (no fields lost)
		 */
		const merged = mergeAllCredentialFields(
			flowSpecific as Record<string, unknown>,
			shared as Record<string, unknown>,
			storedEnvId
		);

		console.log(`${MODULE_TAG} ✅ Credentials reloaded from storage`, {
			flowKey,
			hasEnvId: !!merged.environmentId?.trim(),
			hasClientId: !!merged.clientId?.trim(),
			hasClientSecret: merged.clientSecret !== undefined && !!merged.clientSecret?.trim(),
			hasSharedEnvId: !!shared.environmentId?.trim(),
			hasSharedClientId: !!shared.clientId?.trim(),
			hasFlowSpecificEnvId: !!flowSpecific.environmentId?.trim(),
			hasFlowSpecificClientId: !!flowSpecific.clientId?.trim(),
			hasRedirectUri: !!merged.redirectUri?.trim(),
			redirectUri: merged.redirectUri,
			hasClientAuthMethod: !!merged.clientAuthMethod,
			clientAuthMethod: merged.clientAuthMethod,
			hasFlowSpecificRedirectUri: !!flowSpecific.redirectUri?.trim(),
			hasFlowSpecificClientAuthMethod: !!flowSpecific.clientAuthMethod,
			hasSharedClientAuthMethod: !!shared.clientAuthMethod,
			// Advanced options
			hasResponseMode: !!merged.responseMode,
			hasUsePAR: merged.usePAR !== undefined,
			hasMaxAge: merged.maxAge !== undefined,
			hasDisplay: !!merged.display,
			hasPrompt: !!merged.prompt,
			hasLoginHint: merged.loginHint !== undefined,
			hasPkceEnforcement: !!merged.pkceEnforcement,
			hasPrivateKey: !!merged.privateKey,
		});
		// #region agent log
		import('@/v8/utils/analyticsV8').then(({ analytics }) => {
			analytics.log({ location:'credentialReloadServiceV8U.ts:232',message:'Credentials reloaded - ALL fields check',data:{flowKey,hasRedirectUri:!!merged.redirectUri?.trim(),redirectUri:merged.redirectUri,hasClientAuthMethod:!!merged.clientAuthMethod,clientAuthMethod:merged.clientAuthMethod,hasResponseMode:!!merged.responseMode,hasUsePAR:merged.usePAR!==undefined,hasMaxAge:merged.maxAge!==undefined,hasDisplay:!!merged.display,hasPrompt:!!merged.prompt,hasLoginHint:merged.loginHint!==undefined,hasPkceEnforcement:!!merged.pkceEnforcement,hasPrivateKey:!!merged.privateKey,allKeys:Object.keys(merged)} });
		}).catch(()=>{});
		// #endregion

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
