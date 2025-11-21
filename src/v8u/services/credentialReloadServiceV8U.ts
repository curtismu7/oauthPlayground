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

import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { SharedCredentialsServiceV8 } from '@/v8/services/sharedCredentialsServiceV8';
import type { UnifiedFlowCredentials } from '@/v8u/types/flowTypes';

const MODULE_TAG = '[🔄 CREDENTIAL-RELOAD-V8U]';

/**
 * Reload credentials from storage after flow reset
 * Preserves all credentials (client ID, client secret, environment ID, etc.)
 * while clearing only OAuth tokens and flow state
 *
 * @param flowKey - Flow key (e.g., 'oauth-authz-v8u', 'implicit-v8u')
 * @returns Reloaded credentials merged from shared and flow-specific storage
 * @example
 * const credentials = reloadCredentialsAfterReset('oauth-authz-v8u');
 * setCredentials(credentials);
 */
export function reloadCredentialsAfterReset(flowKey: string): UnifiedFlowCredentials {
	console.log(`${MODULE_TAG} Reloading credentials from storage for flow reset`, { flowKey });

	try {
		// Get flow config
		const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
			flowKey: flowKey,
			flowType: 'oauth' as const,
			includeClientSecret: true,
			includeScopes: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
		};

		// Load flow-specific credentials
		const flowSpecific = CredentialsServiceV8.loadCredentials(flowKey, config);

		// Load shared credentials (synchronously for immediate results)
		const shared = SharedCredentialsServiceV8.loadSharedCredentialsSync();

		// Get global environment ID
		const storedEnvId = EnvironmentIdServiceV8.getEnvironmentId();

		// Merge credentials (same logic as initial load)
		// Priority: shared credentials > flow-specific > defaults
		const merged: UnifiedFlowCredentials = {
			// Shared credentials (global across all flows) - with explicit trimming
			environmentId: (
				shared.environmentId?.trim() ||
				flowSpecific.environmentId?.trim() ||
				storedEnvId?.trim() ||
				''
			).trim(),
			clientId: (shared.clientId?.trim() || flowSpecific.clientId?.trim() || '').trim(),
			// Client secret: prefer shared, then flow-specific, but only if not empty
			...(shared.clientSecret?.trim()
				? { clientSecret: shared.clientSecret.trim() }
				: flowSpecific.clientSecret?.trim()
					? { clientSecret: flowSpecific.clientSecret.trim() }
					: {}),
			// Issuer URL
			...(shared.issuerUrl?.trim()
				? { issuerUrl: shared.issuerUrl.trim() }
				: flowSpecific.issuerUrl?.trim()
					? { issuerUrl: flowSpecific.issuerUrl.trim() }
					: {}),
			// Client auth method
			...(shared.clientAuthMethod
				? { clientAuthMethod: shared.clientAuthMethod }
				: flowSpecific.clientAuthMethod
					? { clientAuthMethod: flowSpecific.clientAuthMethod }
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
		SharedCredentialsServiceV8.saveSharedCredentials({
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			issuerUrl: credentials.issuerUrl,
			clientAuthMethod: credentials.clientAuthMethod,
		});

		console.log(`${MODULE_TAG} ✅ Credentials saved before reset`);
	} catch (error) {
		console.error(`${MODULE_TAG} ❌ Error saving credentials before reset`, {
			flowKey,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}
