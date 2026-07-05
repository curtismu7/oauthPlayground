// src/flows2/content/oidcDiscoverySequence.ts
//
// Spec-accurate sequence-diagram content for the OIDC Discovery + JWKS flow
// (OpenID Connect Discovery 1.0 + RFC 8414 + RFC 7517), mapped onto the four
// step ids of oidcDiscovery.flow.tsx: configure, discover, jwks, inspect.
//
// There is no browser redirect and no user: the client makes two public GET
// requests (the discovery document, then the JWKS it points at) and then
// validates what it got back. Endpoint shapes mirror
// src/flows2/services/oidcDiscoveryService.ts. Feed these to
// <FlowSequenceDiagram /> alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const oidcDiscoveryActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'pingone', label: 'PingOne Discovery / JWKS' },
];

export const oidcDiscoveryInteractions: SequenceInteraction[] = [
	// configure: the client only needs the environment id + region — no
	// client_id or secret, because discovery and JWKS are public endpoints.
	{
		id: 'configure-setup',
		from: 'app',
		to: 'app',
		label: 'set environment_id + region',
		detail: 'no client credentials — discovery is a public endpoint',
		stepId: 'configure',
	},
	// discover: GET the well-known document at the environment-scoped issuer.
	{
		id: 'discover-request',
		from: 'app',
		to: 'pingone',
		label: 'GET /{envId}/as/.well-known/openid-configuration',
		detail: 'Accept: application/json',
		stepId: 'discover',
	},
	// discover: the provider returns its metadata (endpoints + capabilities).
	{
		id: 'discover-response',
		from: 'pingone',
		to: 'app',
		label: '200 OK — provider metadata',
		detail: 'issuer, *_endpoint, jwks_uri, *_supported',
		dashed: true,
		stepId: 'discover',
	},
	// jwks: follow the jwks_uri advertised in the discovery document.
	{
		id: 'jwks-request',
		from: 'app',
		to: 'pingone',
		label: 'GET jwks_uri',
		detail: 'the URL taken from the discovery document',
		stepId: 'jwks',
	},
	// jwks: the provider returns its JSON Web Key Set (public signing keys).
	{
		id: 'jwks-response',
		from: 'pingone',
		to: 'app',
		label: '200 OK — JSON Web Key Set',
		detail: 'keys[]: kid, kty, alg, use',
		dashed: true,
		stepId: 'jwks',
	},
	// inspect: client-internal — validate the issuer and cache keys by kid so
	// id_token signatures can later be verified against the matching key.
	{
		id: 'inspect-validate',
		from: 'app',
		to: 'app',
		label: 'validate issuer === expected, cache keys by kid',
		detail: 'reject on issuer mismatch; re-fetch JWKS on an unknown kid',
		stepId: 'inspect',
	},
];
