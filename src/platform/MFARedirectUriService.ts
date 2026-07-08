/**
 * @file MFARedirectUriService.ts
 * @module platform
 * @description V9 MFA Redirect URI Service
 *
 *   Centralized service for Unified MFA redirect URIs. Delegates to
 *   RedirectUriService for base URL and callback path generation; stripped of
 *   the V8 PersistentLogger / verbose debug machinery.
 *
 *   Adds `getDefaultReturnPath()` so callback handlers navigate to the correct
 *   app page (/v8/unified-mfa) instead of hardcoded fallback routes.
 *
 * @version 9.0.0
 */

import { PlatformLoggingService } from './LoggingService';
import { RedirectUriService } from './RedirectUriService';

const MODULE_TAG = '[ V9-MFA-REDIRECT-URI]';

export const MFARedirectUriService = {
	/**
	 * Get the OAuth callback URL for an MFA or unified flow type.
	 *
	 * Delegates to RedirectUriService which is the single source of truth
	 * for callback paths and base URL. Falls back to a hardcoded HTTPS URL
	 * only when the flow key is not in the V9 mapping (should never happen in
	 * normal operation — alerts via warn log when it does).
	 */
	getRedirectUri(flowType: string): string {
		const uri = RedirectUriService.getRedirectUriForFlow(flowType);
		if (uri) {
			PlatformLoggingService.info(`${MODULE_TAG} Redirect URI for ${flowType}`, {
				flowType,
			});
			return uri;
		}

		// Defensive fallback — only reached if flowType is not in V9 mapping
		const fallback = `https://${window.location.host}/v8/unified-mfa-callback`;
		PlatformLoggingService.log('warn', `${MODULE_TAG} No redirect URI for flow, using fallback`, {
			flowType,
		});
		return fallback;
	},

	/** Redirect URI for the Unified MFA Registration Flow. */
	getUnifiedMFARedirectUri(): string {
		return MFARedirectUriService.getRedirectUri('unified-mfa-v8');
	},

	/** Redirect URI for the V8U OAuth Authorization Code Flow. */
	getV8UOAuthRedirectUri(): string {
		return MFARedirectUriService.getRedirectUri('oauth-authz-v8u');
	},

	/** Redirect URI for the MFA Hub Flow. */
	getMFAHubRedirectUri(): string {
		return MFARedirectUriService.getRedirectUri('mfa-hub-v8');
	},

	/**
	 * Get the in-app return path for an MFA flow type.
	 *
	 * Use this as a typed fallback in callback handlers instead of hardcoding
	 * routes like '/v8/unified-mfa?step=2'.
	 *
	 * @example
	 *   MFARedirectUriService.getDefaultReturnPath('unified-mfa-v8') // '/v8/unified-mfa'
	 *   MFARedirectUriService.getDefaultReturnPath('mfa-hub-v8')     // '/v8/mfa-hub'
	 */
	getDefaultReturnPath(flowType: string): string {
		return RedirectUriService.getReturnPathForFlow(flowType);
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
		if (MFARedirectUriService.needsMigration(credentials.redirectUri)) {
			const correctUri = MFARedirectUriService.getRedirectUri(flowType);
			PlatformLoggingService.log('warn', `${MODULE_TAG} Migrating old redirect URI`, {
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
		PlatformLoggingService.log(lvl, `${MODULE_TAG} [${category}] ${message}`, {
			...(data ?? {}),
		});
	},
};

export default MFARedirectUriService;
