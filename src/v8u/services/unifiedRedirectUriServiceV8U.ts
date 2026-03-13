/**
 * @file unifiedRedirectUriServiceV8U.ts
 * @module v8u/services
 * @description Single source of truth for redirect URIs for all Unified OAuth flows.
 * Only the redirect URI differs by flow type; pi.flow (redirectless) is supported.
 * @version 8.0.0
 * @since 2026-03
 */

import { RedirectUriServiceV8 } from '@/v8/services/redirectUriServiceV8';
import type { FlowType } from '@/v8/services/specVersionServiceV8';

/** Redirect URI used when response_mode=pi.flow (redirectless); no browser redirect. */
export const REDIRECTLESS_URI = 'urn:pingidentity:redirectless';

/**
 * Get the flow key used by RedirectUriServiceV8 for unified flows.
 */
export function getFlowKeyForRedirect(flowType: FlowType): string {
	return `${flowType}-v8u`;
}

/**
 * Returns the default redirect URI for a unified flow type (no redirectless).
 * Uses RedirectUriServiceV8 so base URL and paths stay consistent.
 * - oauth-authz, hybrid → authz-callback (CallbackHandlerV8U)
 * - implicit → oauth-implicit-callback (ImplicitCallback then redirect to handler)
 */
export function getRedirectUriForUnifiedFlow(flowType: FlowType): string {
	const flowKey = getFlowKeyForRedirect(flowType);
	return RedirectUriServiceV8.getRedirectUriForFlow(flowKey);
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

/**
 * Whether this flow type uses a redirect in the browser (false for pi.flow).
 */
export function flowUsesRedirectUri(flowType: FlowType): boolean {
	const flowKey = getFlowKeyForRedirect(flowType);
	const redirectUri = RedirectUriServiceV8.getRedirectUriForFlow(flowKey);
	return redirectUri !== '';
}

export const UnifiedRedirectUriServiceV8U = {
	REDIRECTLESS_URI,
	getFlowKeyForRedirect,
	getRedirectUriForUnifiedFlow,
	getRedirectUriForAuthorize,
	flowUsesRedirectUri,
	/** Re-export for callers that need base URL or other RedirectUriServiceV8 helpers */
	getBaseUrl: RedirectUriServiceV8.getBaseUrl,
	getRedirectUriForFlow: RedirectUriServiceV8.getRedirectUriForFlow,
};

export default UnifiedRedirectUriServiceV8U;
