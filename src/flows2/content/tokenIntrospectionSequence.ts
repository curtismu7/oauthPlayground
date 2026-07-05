// src/flows2/content/tokenIntrospectionSequence.ts
//
// Spec-accurate sequence-diagram content for the Token Introspection flow
// (RFC 7662), mapped onto the three step ids of tokenIntrospection.flow.tsx:
// configure, introspect, compare.
//
// Endpoint shape mirrors src/flows2/services/tokenIntrospectionService.ts
// (introspectionEndpointFor): /as/introspect. Feed these to <FlowSequenceDiagram />
// alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const tokenIntrospectionActors: SequenceActor[] = [
	{ id: 'client', label: 'Resource / Client' },
	{ id: 'introspect', label: 'PingOne Introspect' },
];

export const tokenIntrospectionInteractions: SequenceInteraction[] = [
	// configure: the caller holds its own client credentials plus the token to inspect.
	// Introspection is a protected endpoint, so the caller authenticates as a client.
	{
		id: 'configure-prepare',
		from: 'client',
		to: 'client',
		label: 'hold client credentials + token',
		detail: 'authenticate as a client (RFC 7662 §2.1)',
		stepId: 'configure',
	},
	// introspect: POST the token, with client auth, to /as/introspect.
	{
		id: 'introspect-request',
		from: 'client',
		to: 'introspect',
		label: 'POST /as/introspect',
		detail: 'token=...&token_type_hint=... + client auth',
		stepId: 'introspect',
	},
	// introspect: AS answers with a JSON object whose only guaranteed member is `active`.
	{
		id: 'introspect-response',
		from: 'introspect',
		to: 'client',
		label: '200 OK — introspection response',
		detail: '{ active: true, scope, sub, exp, ... }',
		dashed: true,
		stepId: 'introspect',
	},
	// compare: the caller decodes the same token locally — fast, but not authoritative.
	{
		id: 'compare-decode',
		from: 'client',
		to: 'client',
		label: 'local JWT decode (not authoritative)',
		detail: 'cannot see revocation; fails on opaque tokens',
		stepId: 'compare',
	},
];
