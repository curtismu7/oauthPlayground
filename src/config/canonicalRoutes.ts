/**
 * Canonical (versionless) routes. Legacy paths redirect here — see App.tsx.
 * Phase 1 of version consolidation; do not add new /v2, /v8, /v8u, or *-v9 nav links.
 */

export const CANONICAL_ROUTES = {
	useCases: '/use-cases',
	flows: {
		clientCredentials: '/flows/client-credentials',
		authorizationCode: '/flows/authorization-code',
		authorizationCodeEducational: '/flows/authorization-code-educational',
		authzCallback: '/flows/authz-callback',
		deviceAuthorization: '/flows/device-authorization',
		tokenExchange: '/flows/token-exchange',
		tokenIntrospection: '/flows/token-introspection',
		userinfo: '/flows/userinfo',
		tokenRevocation: '/flows/token-revocation',
		par: '/flows/par',
		refreshToken: '/flows/refresh-token',
		oidcDiscovery: '/flows/oidc-discovery',
		dpop: '/flows/dpop',
		redirectless: '/flows/redirectless',
		implicitHybrid: '/flows/implicit-hybrid',
		implicitHybridCallback: '/flows/implicit-hybrid-callback',
		hybrid: '/flows/hybrid',
		ropc: '/flows/ropc',
		samlBearer: '/flows/saml-bearer',
		workerToken: '/flows/worker-token',
	},
	mfa: {
		home: '/mfa',
	},
	lab: {
		oauthAuthz: '/lab/oauth-authz',
		tokenMonitoring: '/lab/token-monitoring',
		flowComparison: '/lab/flow-comparison',
	},
} as const;

/** Legacy path → canonical path (sidebar + redirects). */
export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
	'/v2/use-cases': CANONICAL_ROUTES.useCases,
	'/v8/unified-mfa': CANONICAL_ROUTES.mfa.home,
	'/v8u/token-monitoring': CANONICAL_ROUTES.lab.tokenMonitoring,
	'/v8u/flow-comparison': CANONICAL_ROUTES.lab.flowComparison,
	'/v8u/unified/oauth-authz': CANONICAL_ROUTES.lab.oauthAuthz,
	'/flows/worker-token-v9': CANONICAL_ROUTES.flows.workerToken,
};
