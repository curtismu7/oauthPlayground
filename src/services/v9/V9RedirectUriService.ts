/**
 * @file V9RedirectUriService.ts
 * @module services/v9
 * @description V9 Redirect URI Service
 *
 *   Canonical mapping of Unified OAuth (V8U) and Unified MFA callback paths and
 *   base URL. Scoped intentionally to Unified apps only — mock / legacy V8 flows
 *   are excluded.
 *
 *   Adds `returnPath` to each entry: the in-app page to navigate back to after
 *   the OAuth callback completes. Callers (e.g. CallbackHandlerV8U) should call
 *   `V9RedirectUriService.getReturnPathForFlow(flowKey)` instead of hardcoding
 *   fallback routes.
 *
 * @version 9.0.0
 */

import { getCachedDomain } from '@/services/customDomainService';
import { logger } from '@/utils/logger';

const MODULE_TAG = '[🔗 V9-REDIRECT-URI]';

export interface V9FlowRedirectUriConfig {
	/** The flow type identifier (e.g. 'oauth-authz-v8u') */
	flowType: string;
	/** Whether this flow requires a redirect URI */
	requiresRedirectUri: boolean;
	/** The OAuth callback path relative to base URL (e.g. 'authz-callback') */
	callbackPath: string;
	/**
	 * In-app return path — the React Router path to navigate to after the
	 * callback has been processed (e.g. '/v8u/unified/oauth-authz').
	 * Used by callback handlers as a typed fallback instead of hardcoded routes.
	 */
	returnPath: string;
	/** Human-readable description */
	description: string;
	/** OAuth/OIDC specification reference */
	specification: string;
}

/**
 * Flow → callback + return path mapping.
 * Scope: Unified OAuth (V8U) and Unified MFA only. No V8 mock/legacy entries.
 */
export const V9_FLOW_REDIRECT_URI_MAPPING: V9FlowRedirectUriConfig[] = [
	// ─── Unified OAuth (V8U) ─────────────────────────────────────────────────
	{
		flowType: 'oauth-authz-v8u',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		returnPath: '/v8u/unified/oauth-authz',
		description: 'OAuth 2.0 Authorization Code Flow (Unified)',
		specification: 'RFC 6749, Section 4.1',
	},
	{
		flowType: 'implicit-v8u',
		requiresRedirectUri: true,
		callbackPath: 'oauth-implicit-callback',
		returnPath: '/v8u/unified/implicit',
		description: 'OAuth 2.0 Implicit Flow (Unified)',
		specification: 'RFC 6749, Section 4.2',
	},
	{
		flowType: 'hybrid-v8u',
		requiresRedirectUri: true,
		callbackPath: 'authz-callback',
		returnPath: '/v8u/unified/hybrid',
		description: 'OpenID Connect Hybrid Flow (Unified)',
		specification: 'OIDC Core 1.0, Section 3.3',
	},
	{
		flowType: 'client-credentials-v8u',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		returnPath: '/v8u/unified/client-credentials',
		description: 'OAuth 2.0 Client Credentials (Unified)',
		specification: 'RFC 6749, Section 4.4',
	},
	{
		flowType: 'device-code-v8u',
		requiresRedirectUri: false,
		callbackPath: 'device-callback',
		returnPath: '/v8u/unified/device-code',
		description: 'OAuth 2.0 Device Authorization (Unified)',
		specification: 'RFC 8628',
	},
	{
		flowType: 'ropc-v8u',
		requiresRedirectUri: false,
		callbackPath: 'N/A',
		returnPath: '/v8u/unified/ropc',
		description: 'Resource Owner Password Credentials (Unified)',
		specification: 'RFC 6749, Section 4.3',
	},

	// ─── Unified MFA ─────────────────────────────────────────────────────────
	{
		flowType: 'unified-mfa-v8',
		requiresRedirectUri: true,
		callbackPath: 'v8/unified-mfa-callback',
		returnPath: '/v8/unified-mfa',
		description: 'Unified MFA Registration Flow',
		specification: 'PingOne MFA API',
	},
	{
		flowType: 'mfa-hub-v8',
		requiresRedirectUri: true,
		callbackPath: 'mfa-hub-callback',
		returnPath: '/v8/mfa-hub',
		description: 'MFA Hub Flow',
		specification: 'PingOne MFA API',
	},
];

/**
 * Get the base URL for the application.
 *
 * Priority:
 *   1. Domain stored in IndexedDB/SQLite (loaded via initDomainCache at startup)
 *      — uses stored hostname but preserves the current browser port so the
 *        redirect URI matches the registered PingOne callback exactly.
 *   2. VITE_APP_DOMAIN env variable (includes scheme; set in .env.local)
 *   3. window.location (verbatim — dev/fallback)
 */
export const getBaseUrl = (): string => {
	if (typeof window !== 'undefined') {
		const cachedHostname = getCachedDomain();
		if (cachedHostname) {
			const port = window.location.port;
			const portStr = port ? `:${port}` : '';
			return `${window.location.protocol}//${cachedHostname}${portStr}`;
		}
		const envDomain = (import.meta.env.VITE_APP_DOMAIN as string | undefined)?.trim();
		if (envDomain) return envDomain.replace(/\/$/, '');
		const appUrl = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim();
		if (appUrl) {
			try {
				const parsed = new URL(appUrl);
				return parsed.origin;
			} catch {
				// fall through
			}
		}
		return `${window.location.protocol}//${window.location.host}`;
	}
	// SSR / test context
	const envDomain = (import.meta.env.VITE_APP_DOMAIN as string | undefined)?.trim();
	if (envDomain) return envDomain.replace(/\/$/, '');
	const appUrl = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim();
	if (appUrl) {
		try {
			return new URL(appUrl).origin;
		} catch {
			// fall through
		}
	}
	return 'https://api.pingdemo.com:3000';
};

/** Look up flow config by flow key. Returns null if not in this service's scope. */
export const getFlowConfig = (flowKey: string): V9FlowRedirectUriConfig | null =>
	V9_FLOW_REDIRECT_URI_MAPPING.find((c) => c.flowType === flowKey) ?? null;

/** Build the full OAuth callback URL for a flow key (e.g. `https://host/authz-callback`). */
export const getRedirectUriForFlow = (flowKey: string): string => {
	const config = getFlowConfig(flowKey);
	if (!config || !config.requiresRedirectUri) {
		logger.info(`${MODULE_TAG} No redirect URI for flow`, { flowKey });
		return '';
	}
	const uri = `${getBaseUrl()}/${config.callbackPath}`;
	logger.info(`${MODULE_TAG} Generated redirect URI`, { flowKey, uri });
	return uri;
};

/** Build the post-logout redirect URI for a flow key. */
export const getPostLogoutRedirectUriForFlow = (flowKey: string): string => {
	const logoutPaths: Record<string, string> = {
		'oauth-authz-v8u': '/callback/logout',
		'implicit-v8u': '/callback/logout',
		'hybrid-v8u': '/callback/logout',
	};
	const path = logoutPaths[flowKey] ?? '/callback/logout';
	const uri = `${getBaseUrl()}${path}`;
	logger.info(`${MODULE_TAG} Generated post-logout redirect URI`, { flowKey, uri });
	return uri;
};

/**
 * Get the in-app return path for a flow key.
 *
 * This is the React Router path callback handlers should navigate to after
 * processing the OAuth callback — NOT the OAuth callback URL itself.
 *
 * @example
 *   getReturnPathForFlow('oauth-authz-v8u') // '/v8u/unified/oauth-authz'
 *   getReturnPathForFlow('unified-mfa-v8')  // '/v8/unified-mfa'
 */
export const getReturnPathForFlow = (flowKey: string): string => {
	const config = getFlowConfig(flowKey);
	if (!config) {
		logger.info(`${MODULE_TAG} No return path for flow key, using root`, { flowKey });
		return '/';
	}
	return config.returnPath;
};

/** Placeholder text for redirect URI inputs. */
export const getRedirectUriPlaceholder = (flowKey: string): string =>
	getRedirectUriForFlow(flowKey) || 'https://localhost:3000/callback';

/** Placeholder text for post-logout redirect URI inputs. */
export const getPostLogoutRedirectUriPlaceholder = (flowKey: string): string =>
	getPostLogoutRedirectUriForFlow(flowKey) || 'https://localhost:3000/callback/logout';

/** Initialize redirect URIs for a flow, filling from service when not yet set. */
export const initializeRedirectUris = (
	flowKey: string,
	currentRedirectUri?: string,
	currentPostLogoutUri?: string
): { redirectUri: string; postLogoutRedirectUri: string } => {
	const redirectUri = currentRedirectUri || getRedirectUriForFlow(flowKey);
	const postLogoutRedirectUri = currentPostLogoutUri || getPostLogoutRedirectUriForFlow(flowKey);
	logger.info(`${MODULE_TAG} Initialized redirect URIs`, {
		flowKey,
		redirectUri,
		postLogoutRedirectUri,
	});
	return { redirectUri, postLogoutRedirectUri };
};

export const V9RedirectUriService = {
	getBaseUrl,
	getFlowConfig,
	getRedirectUriForFlow,
	getPostLogoutRedirectUriForFlow,
	getReturnPathForFlow,
	getRedirectUriPlaceholder,
	getPostLogoutRedirectUriPlaceholder,
	initializeRedirectUris,
};

export default V9RedirectUriService;
