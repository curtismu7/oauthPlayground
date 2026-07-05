// src/flows2/content/userInfoSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the UserInfo flow. Each entry pairs what OpenID
// Connect Core 1.0 §5.3 (plus RFC 6750 for Bearer usage) says with what PingOne
// specifically does — its environment-scoped endpoint and scope-gated claims.
// Claims are kept conservative and factual; spec sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const userInfoSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'access-token-not-id-token',
		topic: 'UserInfo needs the access token',
		spec: 'The UserInfo request is authenticated with the ACCESS token issued in the OIDC flow — not the id_token. The id_token is a client-facing assertion about authentication; it is not a credential for calling the UserInfo endpoint.',
		specRef: 'OpenID Connect Core 1.0 §5.3.1',
		pingone:
			"PingOne's /as/userinfo endpoint accepts the access token from an Authorization Code (or other user-delegated) flow. Presenting the id_token instead is rejected — the id_token is not a bearer credential the endpoint recognizes.",
		note: 'A common mistake is sending the id_token because it "looks like the user"; UserInfo only understands the access token.',
	},
	{
		id: 'bearer-auth',
		topic: 'Bearer authentication',
		spec: 'The access token is presented as an OAuth 2.0 Bearer token. The preferred method is the Authorization: Bearer <token> request header; on failure the server responds 401 with a WWW-Authenticate header describing the error.',
		specRef: 'OpenID Connect Core 1.0 §5.3.1 / RFC 6750 §2.1',
		pingone:
			"PingOne accepts the access token as a Bearer credential and, on an expired or invalid token, returns 401 with error=invalid_token. This demo's BFF forwards the token to /as/userinfo on the client's behalf.",
		note: 'An expired token yields invalid_token; missing scope yields insufficient_scope — read the error to tell the two apart.',
	},
	{
		id: 'openid-required',
		topic: 'openid scope is required',
		spec: 'UserInfo is an OpenID Connect feature: the access token must have been granted the openid scope. Without openid the token is a plain OAuth access token with no OIDC user context to expose.',
		specRef: 'OpenID Connect Core 1.0 §5.3 / §3.1.2.1',
		pingone:
			'PingOne issues an id_token and populates UserInfo only when openid was among the granted scopes. An access token minted without openid (or a Client Credentials token, which has no user at all) has no subject for the endpoint to describe.',
		note: 'Client Credentials tokens represent an application, not a person — they carry no user for UserInfo to return.',
	},
	{
		id: 'scopes-gate-claims',
		topic: 'Scopes gate which claims are returned',
		spec: 'The claims UserInfo returns are limited to those authorized by the granted scopes: profile unlocks name/family_name/given_name/updated_at, email adds email/email_verified, phone adds phone_number/phone_number_verified, address adds address.',
		specRef: 'OpenID Connect Core 1.0 §5.4',
		pingone:
			'PingOne honors these standard scope-to-claim mappings. With only openid the response is essentially just sub; each additional scope granted at token issue widens the returned claim set. The server never returns claims the user did not consent to.',
		note: 'You cannot broaden the claim set at UserInfo time — the scopes were fixed when the access token was issued.',
	},
	{
		id: 'pingone-endpoint',
		topic: 'UserInfo endpoint location',
		spec: 'The endpoint URL is not fixed by the spec; it is published in the discovery document as userinfo_endpoint. Clients should discover it there rather than hardcoding a path.',
		specRef: 'OpenID Connect Core 1.0 §5.3 / Discovery 1.0 §3',
		pingone:
			"PingOne's userinfo_endpoint is https://auth.pingone.{region}/{environmentId}/as/userinfo, namespaced under the environment id like every other endpoint. Read it from the environment's discovery document to stay environment-agnostic.",
		note: 'The same access token only works against the UserInfo endpoint of the environment that issued it.',
	},
	{
		id: 'id-token-vs-userinfo',
		topic: 'id_token vs UserInfo as claim sources',
		spec: 'The id_token is a signed, self-contained snapshot of claims taken at authentication time. UserInfo is a live query answered now. Both describe the same subject, but UserInfo can reflect changes made after the id_token was issued.',
		specRef: 'OpenID Connect Core 1.0 §2 / §5.3',
		pingone:
			'PingOne signs the id_token at issue time, so long-lived tokens may carry stale attributes; /as/userinfo returns the current values. For low-churn claims (sub, email) the two agree; for dynamic ones (updated_at, group membership) UserInfo is authoritative.',
		note: 'Use the id_token for offline verification of who authenticated; call UserInfo when you need the freshest attribute values.',
	},
];
