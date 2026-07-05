// src/flows2/content/tokenRevocationSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Token Revocation flow (RFC 7009). Each entry
// pairs what the RFC says with what PingOne specifically does — its
// environment-scoped endpoint, the always-200 anti-enumeration behaviour, the
// advisory hint, and refresh-token family invalidation. Claims are kept
// conservative and factual; RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const tokenRevocationSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'always-200',
		topic: 'Response to an invalid or unknown token',
		spec: 'The authorization server responds with HTTP 200 for any valid revocation request, regardless of whether the token was valid, expired, already revoked, or never issued. Invalid tokens do not cause an error response.',
		specRef: 'RFC 7009 §2.2',
		pingone:
			'PingOne returns 200 with an empty body for a well-formed revocation request even when the token string is unknown to the environment. It never returns 404 or a "token not found" error.',
		note: 'The 200 confirms the request was processed, NOT that a token existed — returning 404 would let an attacker enumerate valid token strings.',
	},
	{
		id: 'token-type-hint',
		topic: 'token_type_hint',
		spec: 'token_type_hint is OPTIONAL and advisory: it tells the server which token store to search first. If the hint is wrong, the server SHOULD extend its search to other token types rather than fail.',
		specRef: 'RFC 7009 §2.1',
		pingone:
			'PingOne accepts access_token and refresh_token hints and still revokes the token if the hint is wrong or omitted. The hint only affects lookup order, not the outcome.',
		note: 'A wrong hint does not cause the revocation to silently fail — do not rely on the hint as a safeguard.',
	},
	{
		id: 'client-authentication',
		topic: 'Client authentication',
		spec: 'Revocation is a protected operation: the client authenticates as it does at the token endpoint (RFC 6749 §2.3). A client may only revoke tokens issued to it.',
		specRef: 'RFC 7009 §2.1',
		pingone:
			'PingOne requires the caller to authenticate as a registered application via client_secret_basic or client_secret_post. An unauthenticated or misauthenticated call is rejected with invalid_client (HTTP 401).',
		note: 'Because the caller must be the issuing client, one application cannot revoke another application’s tokens.',
	},
	{
		id: 'revocation-endpoint',
		topic: 'Revocation endpoint',
		spec: 'The spec does not fix the endpoint URL; it is published via authorization-server metadata as revocation_endpoint (RFC 8414).',
		specRef: 'RFC 7009 §2 / RFC 8414',
		pingone:
			'PingOne scopes the endpoint per environment: https://auth.pingone.{region}/{environmentId}/as/revoke, where the region host is auth.pingone.com (North America), .eu, .ca, or .asia. The {environmentId} path segment makes revocation tenant-specific.',
		note: "Discover the exact URL from the environment's /{environmentId}/as/.well-known/openid-configuration rather than hardcoding it.",
	},
	{
		id: 'refresh-family-invalidation',
		topic: 'Revoking a refresh token',
		spec: 'If the revoked token is a refresh token, the AS SHOULD also revoke the access tokens issued from it. If the revoked token is an access token, revoking the associated refresh token is at the server’s discretion.',
		specRef: 'RFC 7009 §2.1',
		pingone:
			'On PingOne, revoking a refresh token invalidates the access tokens derived from it (the token "family"), while revoking a single access token invalidates only that token — its refresh token and sibling access tokens remain active.',
		note: 'To fully sign a session out, revoke the refresh token: revoking one access token leaves the refresh token free to mint new ones.',
	},
];
