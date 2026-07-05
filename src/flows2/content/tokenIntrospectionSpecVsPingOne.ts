// src/flows2/content/tokenIntrospectionSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Token Introspection flow (RFC 7662). Each
// entry pairs what the RFC says with what PingOne specifically does — its
// environment-scoped endpoint, client-auth requirement, and response shape.
// Claims are kept conservative and factual; RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const tokenIntrospectionSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'active-semantics',
		topic: 'The `active` member',
		spec: 'The introspection response is a JSON object whose only REQUIRED member is `active`, a boolean indicating whether the token is currently valid at the authorization server. A token is active only if it was issued by this AS, has not expired, and has not been revoked.',
		specRef: 'RFC 7662 §2.2',
		pingone:
			'PingOne returns active:true for a live token issued by the same environment, alongside claims such as scope, client_id, sub, exp, iat, and token_type. A token that is expired, revoked, or unknown to the environment returns active:false with no other claims.',
		note: 'Never infer authorization from the presence of a payload alone — always branch on the `active` flag first.',
	},
	{
		id: 'client-authentication',
		topic: 'Endpoint authentication',
		spec: 'The introspection endpoint MUST require authorization: it either requires client authentication (RFC 6749 §2.3) or accepts a separate credential. This prevents an unauthenticated party from probing (scanning) whether arbitrary token strings are valid.',
		specRef: 'RFC 7662 §2.1',
		pingone:
			'PingOne requires the caller to authenticate as a registered application using client_secret_basic or client_secret_post. The bundled worker app here is registered for client_secret_basic; an unauthenticated or misauthenticated call is rejected with invalid_client (HTTP 401).',
		note: 'Because introspection is authenticated, only a legitimate client — not an attacker with a stolen token string — can query token state.',
	},
	{
		id: 'introspection-endpoint',
		topic: 'Introspection endpoint',
		spec: 'The spec does not fix the endpoint URL; it is published via authorization-server metadata as introspection_endpoint (RFC 8414).',
		specRef: 'RFC 7662 §2 / RFC 8414',
		pingone:
			'PingOne scopes the endpoint per environment: https://auth.pingone.{region}/{environmentId}/as/introspect, where the region host is auth.pingone.com (North America), .eu, .ca, or .asia. The {environmentId} path segment makes introspection tenant-specific.',
		note: "Discover the exact URL from the environment's /{environmentId}/as/.well-known/openid-configuration rather than hardcoding it.",
	},
	{
		id: 'invalid-token-behavior',
		topic: 'Invalid, foreign, or malformed tokens',
		spec: 'If the token is expired, revoked, malformed, or otherwise invalid, the endpoint responds with active:false — it does NOT return an error. Only the caller failing to authenticate produces an error (RFC 7662 §2.3).',
		specRef: 'RFC 7662 §2.2 / §2.3',
		pingone:
			'PingOne returns a 200 with { active: false } for a garbage token string and for a token minted by a different environment or client. Introspection reveals nothing about tokens outside the caller’s trust boundary — a foreign token simply reads inactive.',
		note: 'This is a security feature: a malformed token is not an error to surface, and foreign tokens leak no information.',
	},
	{
		id: 'token-type-hint',
		topic: 'token_type_hint',
		spec: 'token_type_hint is OPTIONAL. It names the token type (access_token or refresh_token) so the server can look in the right store first. A server MAY ignore it, and MUST still return the correct answer if the hint is wrong or absent.',
		specRef: 'RFC 7662 §2.1',
		pingone:
			'PingOne accepts access_token and refresh_token hints. The hint only optimizes lookup order; introspection still returns the correct active state whether the hint is correct, wrong, or omitted.',
		note: 'Treat the hint as a performance nicety, never as a filter or a security boundary.',
	},
];
