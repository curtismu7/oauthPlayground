// src/flows2/content/dpopSequence.ts
//
// Spec-accurate sequence-diagram content for the DPoP flow (RFC 9449), mapped onto
// the five step ids of dpop.flow.tsx: configure, generate, proof, request, inspect.
//
// DPoP layers proof-of-possession on top of a normal grant (client_credentials here):
// the client holds an EC key pair, signs a fresh proof JWT per request, and the issued
// access token is bound to the key's JWK thumbprint (cnf.jkt). Feed these to
// <FlowSequenceDiagram /> alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const dpopActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'token', label: 'PingOne Token' },
	{ id: 'resource', label: 'Resource' },
];

export const dpopInteractions: SequenceInteraction[] = [
	// configure: the app knows the token endpoint and the grant it will run under.
	{
		id: 'configure-endpoint',
		from: 'app',
		to: 'token',
		label: 'resolve /as/token endpoint',
		detail: 'grant_type=client_credentials; scope optional',
		stepId: 'configure',
	},
	// generate: client-internal EC P-256 key pair; the private key never leaves memory.
	{
		id: 'generate-key',
		from: 'app',
		to: 'app',
		label: 'generate EC P-256 key pair',
		detail: 'jkt = base64url(SHA-256 JWK thumbprint), RFC 7638',
		stepId: 'generate',
	},
	// proof: build and sign the DPoP proof JWT for the upcoming token request.
	{
		id: 'build-proof',
		from: 'app',
		to: 'app',
		label: 'build + sign DPoP proof JWT',
		detail: 'typ=dpop+jwt; htm=POST htu=/as/token; jti, iat; ES256',
		stepId: 'proof',
	},
	// request: POST the token request carrying the proof in the DPoP header.
	{
		id: 'token-request',
		from: 'app',
		to: 'token',
		label: 'POST /as/token',
		detail: 'DPoP: <proof>; grant_type=client_credentials',
		stepId: 'request',
	},
	// request: the AS returns a DPoP-bound token (token_type=DPoP, cnf.jkt set).
	{
		id: 'token-response',
		from: 'token',
		to: 'app',
		label: '200 OK — token_type=DPoP',
		detail: 'access_token bound via cnf.jkt = <thumbprint>',
		dashed: true,
		stepId: 'request',
	},
	// inspect: every resource call needs a fresh proof matching the request method/URI.
	{
		id: 'resource-request',
		from: 'app',
		to: 'resource',
		label: 'GET /resource',
		detail: 'Authorization: DPoP <token>; fresh proof htm=GET htu=/resource',
		stepId: 'inspect',
	},
	// inspect: the resource server verifies the proof signature and jkt binding.
	{
		id: 'resource-response',
		from: 'resource',
		to: 'app',
		label: '200 OK — proof + jkt verified',
		detail: 'recomputed JWK thumbprint == access token cnf.jkt',
		dashed: true,
		stepId: 'inspect',
	},
];
