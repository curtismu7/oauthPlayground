/**
 * @file V9UnifiedRedirectUriService.ts
 * @module services/v9
 * @description V9 Single source of truth for redirect URIs for all Unified OAuth flows.
 *
 *   Drop-in replacement for UnifiedRedirectUriServiceV8U — delegates to
 *   V9RedirectUriService instead of RedirectUriServiceV8. Adds
 *   `getDefaultReturnPath()` so callback handlers can navigate back to the
 *   correct app page without hardcoding routes.
 *
 * @version 9.0.0
 */

import type { FlowType } from '@/v8/services/specVersionServiceV8';
import { V9RedirectUriService } from './V9RedirectUriService';

/** Redirect URI used when response_mode=pi.flow (redirectless); no browser redirect. */
export const REDIRECTLESS_URI = 'urn:pingidentity:redirectless';

/** Get the flow key used by V9RedirectUriService for unified flows. */
export function getFlowKeyForRedirect(flowType: FlowType): string {
	return `${flowType}-v8u`;
}

/**
 * Returns the default redirect URI for a unified flow type (no redirectless).
 * - oauth-authz, hybrid → authz-callback
 * - implicit → oauth-implicit-callback
 */
export function getRedirectUriForUnifiedFlow(flowType: FlowType): string {
	const flowKey = getFlowKeyForRedirect(flowType);
	return V9RedirectUriService.getRedirectUriForFlow(flowKey);
}

/**
 * Returns the redirect URI to use for the authorize request.
 * When useRedirectless (response_mode=pi.flow), returns REDIRECTLESS_URI.
 * Otherwise returns the flow-specific redirect URI (or user-configured override).
 */
export function getRedirectUriForAuthorize(
	flowType: FlowType,
	options: {
		useRedirectless?: boolean;
		configuredRedirectUri?: string | null;
	}
): string {
	const { useRedirectless = false, configuredRedirectUri } = options;
	if (useRedirectless) {
		return REDIRECTLESS_URI;
	}
	const trimmed = configuredRedirectUri?.trim();
	if (trimmed) {
		return trimmed;
	}
	return getRedirectUriForUnifiedFlow(flowType);
}

/** Whether this flow type uses a browser redirect (false for pi.flow). */
export function flowUsesRedirectUri(flowType: FlowType): boolean {
	const flowKey = getFlowKeyForRedirect(flowType);
	return V9RedirectUriService.getRedirectUriForFlow(flowKey) !== '';
}

/**
 * Get the in-app return path for a unified flow type.
 *
 * Callback handlers should use this instead of hardcoded routes when they need a
 * fallback navigation target after processing the OAuth callback.
 *
 * @example
 *   getDefaultReturnPath('oauth-authz') // '/v8u/unified/oauth-authz'
 *   getDefaultReturnPath('implicit')    // '/v8u/unified/implicit'
 */
export function getDefaultReturnPath(flowType: FlowType): string {
	const flowKey = getFlowKeyForRedirect(flowType);
	return V9RedirectUriService.getReturnPathForFlow(flowKey);
}

export const V9UnifiedRedirectUriService = {
	REDIRECTLESS_URI,
	getFlowKeyForRedirect,
	getRedirectUriForUnifiedFlow,
	getRedirectUriForAuthorize,
	flowUsesRedirectUri,
	getDefaultReturnPath,
	/** Re-exports for callers that need base URL or other V9RedirectUriService helpers */
	getBaseUrl: V9RedirectUriService.getBaseUrl,
	getRedirectUriForFlow: V9RedirectUriService.getRedirectUriForFlow,
};

export default V9UnifiedRedirectUriService;
