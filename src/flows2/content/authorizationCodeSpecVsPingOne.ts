// src/flows2/content/authorizationCodeSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Authorization Code + PKCE flow. Each entry
// pairs what the RFC/OIDC spec says with what PingOne specifically does — its
// environment-scoped endpoints, exact-match constraints, defaults, and
// platform extensions. Claims are kept conservative and factual; RFC sections
// are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const authorizationCodeSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'authorization-endpoint',
		topic: 'Authorization endpoint',
		spec: 'The authorization server exposes an authorization endpoint that the client sends the resource owner to. The spec does not prescribe its URL — it is published via server metadata (authorization_endpoint).',
		specRef: 'RFC 6749 §3.1',
		pingone:
			'PingOne scopes the endpoint per environment: https://auth.pingone.{region}/{environmentId}/as/authorize, where the region host is one of auth.pingone.com (North America), .eu, .ca, or .asia (Asia-Pacific). The {environmentId} path segment makes every request tenant-specific.',
		note: "Discover the exact URL from the environment's OpenID configuration at /{environmentId}/as/.well-known/openid-configuration rather than hardcoding it.",
	},
	{
		id: 'redirect-uri-matching',
		topic: 'redirect_uri matching',
		spec: "The client should register its redirect URIs; the authorization server compares the request's redirect_uri against the registered value. The spec allows simple string comparison and, for some cases, does not require full registration.",
		specRef: 'RFC 6749 §3.1.2',
		pingone:
			"PingOne requires redirect_uris to be pre-registered on the application and matched EXACTLY — full string equality including scheme, host, port, and path. No wildcards, no path-prefix matching. If several URIs are registered, the request's redirect_uri must be identical to one of them, and it is echoed unchanged on the response.",
		note: 'A trailing slash, an extra query parameter, or http vs https difference will fail with an invalid redirect error. OAuth 2.1 also mandates exact matching, so this is spec-aligned, not a PingOne quirk.',
	},
	{
		id: 'pkce',
		topic: 'PKCE (code_challenge / code_verifier)',
		spec: 'PKCE is defined as an extension: RFC 7636 recommends it for public clients to defend against authorization-code interception, and supports the plain and S256 challenge methods. OAuth 2.1 elevates PKCE to required for all authorization-code clients.',
		specRef: 'RFC 7636 §4',
		pingone:
			'PingOne supports S256 and can be configured to require PKCE per application (PKCE Enforcement: OPTIONAL, REQUIRED, or S256_REQUIRED). For public clients (no secret) PKCE is the standard protection. This flow always sends code_challenge_method=S256.',
		note: "Prefer S256 over plain; PingOne's S256_REQUIRED setting rejects the weaker plain method outright.",
	},
	{
		id: 'scopes',
		topic: 'scope parameter',
		spec: 'scope is a space-delimited, case-sensitive list of requested access. OpenID Connect reserves openid (required to get an ID token) plus profile, email, address, phone, and offline_access (for a refresh token).',
		specRef: 'RFC 6749 §3.3 / OIDC Core §5.4',
		pingone:
			'PingOne honors the standard OIDC scopes and adds platform scopes prefixed with p1: (for example p1:read:user) that grant access to PingOne management APIs. The openid scope is what gates issuance of an id_token — omit it and you get only an access token. Requested scopes must be granted to the application; the granted set is reflected in the token response scope.',
		note: 'Custom resource scopes are defined on PingOne resources and attached to the application; a scope the app is not authorized for is silently dropped from the grant.',
	},
	{
		id: 'nonce',
		topic: 'nonce parameter',
		spec: 'nonce is a value passed on the authorization request that the authorization server MUST include, unchanged, in the id_token. The client compares it to mitigate replay. It is optional for the authorization-code flow and required for the implicit flow.',
		specRef: 'OIDC Core §3.1.2.1 / §15.5.2',
		pingone:
			"When a nonce is supplied on an OIDC (openid-scoped) authorization request, PingOne binds it into the issued id_token's nonce claim so the client can verify it. This flow generates a fresh random nonce only when OIDC is enabled.",
		note: 'Always verify the returned id_token nonce equals the one you sent; a missing or mismatched nonce should invalidate the token.',
	},
	{
		id: 'client-authentication',
		topic: 'Token endpoint client authentication',
		spec: 'A confidential client authenticates to the token endpoint. RFC 6749 defines client_secret_basic (HTTP Basic) and client_secret_post (secret in the body); RFC 7523 / OIDC add private_key_jwt and client_secret_jwt (a signed client_assertion). Public clients use none and rely on PKCE.',
		specRef: 'RFC 6749 §2.3 / RFC 7523',
		pingone:
			'PingOne applications configure a Token Endpoint Authentication Method: client_secret_basic, client_secret_post, private_key_jwt, or none. Choosing none marks the app as a public client (typically an SPA or native app) where no secret is stored and PKCE carries the protection instead.',
		note: 'private_key_jwt avoids sending a shared secret at all — the client signs a short-lived JWT assertion that PingOne verifies against the registered public key/JWKS.',
	},
	{
		id: 'access-token-typ-header',
		topic: 'Access-token JWT header (typ) and audience',
		spec: 'RFC 9068 defines the JWT profile for OAuth 2.0 access tokens and specifies the header typ value at+jwt so a resource server can distinguish an access token from an id_token. Generic OAuth otherwise treats access tokens as opaque and places no requirement on their format.',
		specRef: 'RFC 9068 §2.1',
		pingone:
			"PingOne is adding support for the at+jwt typ header on access tokens: it is always included for tokens minted for PingOne's own APIs, and optionally included for custom-resource access tokens via a per-application advanced setting (includeTyp). The issuer (iss) is the environment-scoped https://auth.pingone.{region}/{environmentId} and the aud identifies the target resource, reflecting PingOne's multi-tenant, per-environment model.",
		note: 'Resource servers should validate iss, aud, and (when present) the at+jwt typ header, and must tolerate the typ header always being present going forward, since PingOne intends to include it for all APIs and custom resources.',
	},
];
