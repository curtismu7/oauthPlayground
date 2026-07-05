// src/flows2/content/tokenExchangeSequence.ts
//
// Spec-accurate sequence-diagram content for the Token Exchange flow (RFC 8693),
// mapped onto the three step ids of tokenExchange.flow.tsx: configure, exchange, inspect.
//
// The requesting service presents a subject_token (whose identity is preserved) and,
// for delegation, an actor_token; the AS returns a narrowed / delegated token. Feed
// these to <FlowSequenceDiagram /> alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const tokenExchangeActors: SequenceActor[] = [
	{ id: 'app', label: 'Your Service' },
	{ id: 'token', label: 'PingOne Token' },
];

export const tokenExchangeInteractions: SequenceInteraction[] = [
	// configure: the service collects the tokens it will exchange.
	{
		id: 'configure-tokens',
		from: 'app',
		to: 'app',
		label: 'collect subject_token (+ optional actor_token)',
		detail: "subject identity is preserved; actor drives the 'act' claim",
		stepId: 'configure',
	},
	// exchange: POST the token-exchange grant to the token endpoint.
	{
		id: 'exchange-request',
		from: 'app',
		to: 'token',
		label: 'POST /as/token',
		detail:
			'grant_type=urn:ietf:params:oauth:grant-type:token-exchange; subject_token; subject_token_type; requested_token_type; audience?; actor_token?',
		stepId: 'exchange',
	},
	// exchange: the AS returns the issued token and echoes its type.
	{
		id: 'exchange-response',
		from: 'token',
		to: 'app',
		label: '200 OK — issued token',
		detail: "issued_token_type; 'act' claim present when delegation was approved",
		dashed: true,
		stepId: 'exchange',
	},
	// inspect: introspect the issued token to confirm what it carries.
	{
		id: 'inspect-request',
		from: 'app',
		to: 'token',
		label: 'POST /as/introspect',
		detail: 'RFC 7662 — verify active, scope, aud, act',
		stepId: 'inspect',
	},
	// inspect: introspection result.
	{
		id: 'inspect-response',
		from: 'token',
		to: 'app',
		label: '200 OK — introspection',
		detail: 'active=true; scope; aud; act chain',
		dashed: true,
		stepId: 'inspect',
	},
];
