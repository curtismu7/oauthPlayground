/**
 * @file V9MFARedirectUriService.ts
 * @module services/v9
 * @description V9 MFA Redirect URI Service
 *
 *   Centralized service for Unified MFA redirect URIs. Delegates to
 *   V9RedirectUriService for base URL and callback path generation; stripped of
 *   the V8 PersistentLogger / verbose debug machinery.
 *
 *   Adds `getDefaultReturnPath()` so callback handlers navigate to the correct
 *   app page (/v8/unified-mfa) instead of hardcoded fallback routes.
 *
 * @version 9.0.0
 */

import { V9LoggingService } from './V9LoggingService';
import { V9RedirectUriService } from './V9RedirectUriService';

const MODULE_TAG = '[🔗 V9-MFA-REDIRECT-URI]';

export const V9MFARedirectUriService = {
	/**
	 * Get the OAuth callback URL for an MFA or unified flow type.
	 *
	 * Delegates to V9RedirectUriService which is the single source of truth
	 * for callback paths and base URL. Falls back to a hardcoded HTTPS URL
	 * only when the flow key is not in the V9 mapping (should never happen in
	 * normal operation — alerts via warn log when it does).
	 */
	getRedirectUri(flowType: string): string {
		const uri = V9RedirectUriService.getRedirectUriForFlow(flowType);
		if (uri) {
			V9LoggingService.info(`${MODULE_TAG} Redirect URI for ${flowType}`, {
				flowType,
			});
			return uri;
		}

		// Defensive fallback — only reached if flowType is not in V9 mapping
		const fallback = `https://${window.location.host}/v8/unified-mfa-callback`;
		V9LoggingService.log('warn', `${MODULE_TAG} No redirect URI for flow, using fallback`, {
			flowType,
		});
		return fallback;
	},

	/** Redirect URI for the Unified MFA Registration Flow. */
	getUnifiedMFARedirectUri(): string {
		return V9MFARedirectUriService.getRedirectUri('unified-mfa-v8');
	},

	/** Redirect URI for the V8U OAuth Authorization Code Flow. */
	getV8UOAuthRedirectUri(): string {
		return V9MFARedirectUriService.getRedirectUri('oauth-authz-v8u');
	},

	/** Redirect URI for the MFA Hub Flow. */
	getMFAHubRedirectUri(): string {
		return V9MFARedirectUriService.getRedirectUri('mfa-hub-v8');
	},

	/**
	 * Get the in-app return path for an MFA flow type.
	 *
	 * Use this as a typed fallback in callback handlers instead of hardcoding
	 * routes like '/v8/unified-mfa?step=2'.
	 *
	 * @example
	 *   V9MFARedirectUriService.getDefaultReturnPath('unified-mfa-v8') // '/v8/unified-mfa'
	 *   V9MFARedirectUriService.getDefaultReturnPath('mfa-hub-v8')     // '/v8/mfa-hub'
	 */
	getDefaultReturnPath(flowType: string): string {
		return V9RedirectUriService.getReturnPathForFlow(flowType);
	},

	/**
	 * Returns true when a saved redirect URI looks like an old pattern that
	 * should be replaced with the current service-generated URI.
	 */
	needsMigration(uri: string | undefined): boolean {
		if (!uri) return true;
		return (
			uri.includes('mfa-hub') ||
			uri.includes('/v8/mfa-unified-callback') ||
			uri.includes('/v8/unified-mfa-callback')
		);
	},

	/**
	 * Migrate credentials to use the correct redirect URI for their flow type.
	 * Updates any saved credentials that have old redirect URIs.
	 */
	migrateCredentials<T extends { redirectUri?: string }>(credentials: T, flowType: string): T {
		if (V9MFARedirectUriService.needsMigration(credentials.redirectUri)) {
			const correctUri = V9MFARedirectUriService.getRedirectUri(flowType);
			V9LoggingService.log('warn', `${MODULE_TAG} Migrating old redirect URI`, {
				flowType,
				oldUri: credentials.redirectUri,
				newUri: correctUri,
			});
			return { ...credentials, redirectUri: correctUri };
		}
		return credentials;
	},

	/**
	 * Log a debug event for redirect-related operations.
	 * Drop-in replacement for MFARedirectUriServiceV8.logDebugEvent().
	 */
	logDebugEvent(
		category: string,
		message: string,
		data?: Record<string, unknown>,
		level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
	): void {
		const lvl = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
		V9LoggingService.log(lvl, `${MODULE_TAG} [${category}] ${message}`, {
			...(data ?? {}),
		});
	},
};

export default V9MFARedirectUriService;
