// src/flows2/content/oidcDiscoverySpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the OIDC Discovery + JWKS flow. Each entry pairs
// what the OpenID Connect Discovery 1.0 / RFC 8414 / RFC 7517 spec says with what
// PingOne specifically does — its environment-scoped issuer and endpoints. Claims
// are kept conservative and factual; spec sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const oidcDiscoverySpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'well-known-location',
		topic: 'Discovery document location',
		spec: 'A client obtains provider metadata by appending /.well-known/openid-configuration to the issuer and issuing an HTTPS GET. The path is fixed by the spec so any client can find the document from the issuer alone.',
		specRef: 'OpenID Connect Discovery 1.0 §4 / RFC 8414 §3',
		pingone:
			'PingOne serves the document per environment at https://auth.pingone.{region}/{environmentId}/as/.well-known/openid-configuration, where the region host is auth.pingone.com (North America), .eu, .ca, or .asia. The issuer prefix is therefore https://auth.pingone.{region}/{environmentId}/as.',
		note: 'Fetch this once at startup and read endpoints from it rather than hardcoding paths — the URLs are environment-specific.',
	},
	{
		id: 'required-metadata',
		topic: 'Required metadata fields',
		spec: 'The response is a JSON object. issuer, authorization_endpoint, jwks_uri, response_types_supported, subject_types_supported, and id_token_signing_alg_values_supported are REQUIRED; token_endpoint is REQUIRED unless only the implicit flow is used.',
		specRef: 'OpenID Connect Discovery 1.0 §3',
		pingone:
			'PingOne returns all of these plus userinfo_endpoint, end_session_endpoint, introspection_endpoint, revocation_endpoint, device_authorization_endpoint, scopes_supported, grant_types_supported, and code_challenge_methods_supported (["S256"]). id_token_signing_alg_values_supported advertises RS256.',
		note: 'Treat any field you rely on as possibly absent: filter on presence before reading, since the set a provider returns can vary.',
	},
	{
		id: 'jwks-uri-signature-verification',
		topic: 'jwks_uri and signature verification',
		spec: "jwks_uri points at the provider's JSON Web Key Set — the public keys clients use to verify id_token signatures. A JWT header carries a kid identifying which key signed it; the client selects the matching key from the JWKS.",
		specRef: 'OpenID Connect Discovery 1.0 §3 / RFC 7517 §5',
		pingone:
			"PingOne's jwks_uri resolves to /{environmentId}/as/jwks and returns RSA signing keys (kty=RSA, alg=RS256, use=sig) each with a kid. Because the endpoint is live, clients can re-fetch it whenever they encounter an unknown kid, so key rotation is transparent.",
		note: 'Never trust an id_token you cannot verify against a key from this set — an unverifiable signature means the token could be forged.',
	},
	{
		id: 'issuer-validation',
		topic: 'Issuer validation',
		spec: 'The issuer value in the returned document MUST be identical to the Issuer URL used as the prefix to /.well-known/openid-configuration. A client that fetched from one issuer but received a document claiming another MUST reject it.',
		specRef: 'OpenID Connect Discovery 1.0 §4.3',
		pingone:
			'For a PingOne environment the issuer is exactly https://auth.pingone.{region}/{environmentId}/as — the same string you built the well-known URL from. It also appears as the iss claim in id_tokens and access tokens minted by that environment, so the client can pin one expected value.',
		note: 'Compare the returned issuer against the value you expected before using any endpoint from the document; a mismatch is a red flag, not a curiosity.',
	},
	{
		id: 'environment-scoped-endpoints',
		topic: 'Environment-scoped issuer and endpoints',
		spec: 'The spec does not prescribe endpoint URLs; each is published in the metadata document and can differ per provider. Clients read authorization_endpoint, token_endpoint, userinfo_endpoint, etc. from the document.',
		specRef: 'OpenID Connect Discovery 1.0 §3',
		pingone:
			'Every PingOne endpoint is namespaced under the environment id, e.g. token_endpoint = {issuer}/token and userinfo_endpoint = {issuer}/userinfo. Two environments in the same tenant have entirely distinct issuers and endpoints, which is why discovery — not a hardcoded base URL — is the correct way to configure a client.',
		note: 'Moving an app between PingOne environments only requires pointing it at a different environment id; discovery re-derives every endpoint from the new issuer.',
	},
];
