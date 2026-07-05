// src/flows2/content/clientCredentialsSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Client Credentials grant (RFC 6749 §4.4).
// Each entry pairs what the RFC says with what PingOne specifically does — its
// environment-scoped token endpoint, worker-app auth defaults, platform p1:
// scopes, and the absence of a user identity. Claims are kept conservative and
// factual; RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const clientCredentialsSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'grant-type',
		topic: 'client_credentials grant',
		spec: 'The client requests an access token using only its own credentials, with grant_type=client_credentials, when it acts on its own behalf rather than for a resource owner. It is for confidential clients only.',
		specRef: 'RFC 6749 §4.4',
		pingone:
			'PingOne issues client-credentials tokens to applications configured for the grant — typically a Worker app (which carries PingOne platform roles) or a custom OIDC app with the Client Credentials grant enabled. The token is minted at the environment-scoped token endpoint and represents the application itself, not a user.',
		note: 'Enable the Client Credentials grant on the application in PingOne; a Worker app has it by default and is the usual choice for machine-to-machine calls.',
	},
	{
		id: 'token-endpoint',
		topic: 'Token endpoint',
		spec: 'The client posts the token request to the token endpoint published in server metadata (token_endpoint). The spec does not prescribe its URL.',
		specRef: 'RFC 6749 §3.2 / §4.4.2',
		pingone:
			'PingOne scopes the token endpoint per environment: https://auth.pingone.{region}/{environmentId}/as/token, where the region host is auth.pingone.com (North America), .eu, .ca, or .asia. The {environmentId} path segment makes every request tenant-specific.',
		note: 'Discover the exact URL from /{environmentId}/as/.well-known/openid-configuration rather than hardcoding it.',
	},
	{
		id: 'client-authentication',
		topic: 'Client authentication',
		spec: 'A confidential client MUST authenticate at the token endpoint. RFC 6749 defines client_secret_basic (HTTP Basic) and client_secret_post (secret in the body); RFC 7523 adds private_key_jwt (a signed client_assertion). There is no PKCE and no redirect in this grant.',
		specRef: 'RFC 6749 §2.3 / §4.4.2',
		pingone:
			'PingOne applications set a Token Endpoint Authentication Method; Worker apps default to client_secret_basic. client_secret_post and private_key_jwt are also supported. none (public client) is NOT valid here — client_credentials requires a confidential client that can hold a secret.',
		note: 'A wrong or missing secret is rejected with invalid_client and HTTP 401; the Break-it Lab reproduces exactly this.',
	},
	{
		id: 'no-id-token',
		topic: 'No id_token / no user identity',
		spec: 'There is no resource owner in this grant, so no end-user is authenticated. OpenID Connect does not define an id_token for client_credentials — an id_token asserts a user authentication event, which never happens here.',
		specRef: 'RFC 6749 §4.4.3 / OIDC Core §2',
		pingone:
			'PingOne returns only an access_token (and token_type / expires_in) — never an id_token or a refresh_token for this grant. The token has no sub tied to a user; it represents the application. UserInfo is not meaningful because there is no authenticated user to describe.',
		note: 'If you need a user identity or a refresh token, use the Authorization Code flow instead — this grant is strictly machine-to-machine.',
	},
	{
		id: 'scopes',
		topic: 'scope parameter',
		spec: 'scope is an optional, space-delimited, case-sensitive list of requested access. The authorization server may fully or partially honor it, and returns the granted scope when it differs from the request.',
		specRef: 'RFC 6749 §3.3 / §4.4.2',
		pingone:
			'PingOne worker tokens request platform scopes prefixed with p1: (for example p1:read:user, p1:update:user) that map to the roles granted to the Worker app, plus any custom resource scopes attached to the application. A scope the application has not been granted is rejected with invalid_scope.',
		note: 'Requestable scopes come from the roles/resources assigned to the app; requesting one outside that set fails rather than being silently dropped.',
	},
	{
		id: 'resource-indicators',
		topic: 'Audience / resource indicators',
		spec: 'RFC 8707 lets a client include one or more resource parameters to request an access token scoped (aud) to a specific protected resource, narrowing where the token can be used.',
		specRef: 'RFC 8707 §2',
		pingone:
			'PingOne accepts an optional audience/resource on the token request to target a custom resource defined in the environment; the resulting access_token carries the corresponding aud. Omitting it yields a token audienced for PingOne’s own APIs (for Worker apps).',
		note: 'Scoping the token to the narrowest resource limits the blast radius if the token leaks.',
	},
];
