// src/flows2/content/tokenRevocationSequence.ts
//
// Spec-accurate sequence-diagram content for the Token Revocation flow (RFC 7009),
// with a verification hop via introspection (RFC 7662), mapped onto the three step
// ids of tokenRevocation.flow.tsx: configure, revoke, verify.
//
// Endpoint shapes mirror src/flows2/services/tokenRevocationService.ts (/as/revoke)
// and tokenIntrospectionService.ts (/as/introspect). Feed these to
// <FlowSequenceDiagram /> alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const tokenRevocationActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'revoke', label: 'PingOne Revoke' },
	{ id: 'introspect', label: 'PingOne Introspect' },
];

export const tokenRevocationInteractions: SequenceInteraction[] = [
	// configure: the app holds the client credentials it used to obtain the token,
	// plus the token it now wants to invalidate.
	{
		id: 'configure-prepare',
		from: 'app',
		to: 'app',
		label: 'hold client credentials + token',
		detail: 'authenticate as the issuing client (RFC 7009 §2.1)',
		stepId: 'configure',
	},
	// revoke: POST the token, with client auth, to /as/revoke.
	{
		id: 'revoke-request',
		from: 'app',
		to: 'revoke',
		label: 'POST /as/revoke',
		detail: 'token=...&token_type_hint=... + client auth',
		stepId: 'revoke',
	},
	// revoke: RFC 7009 §2.2 — the AS returns 200 for any valid request, even when the
	// token was already invalid or never existed (anti-enumeration).
	{
		id: 'revoke-response',
		from: 'revoke',
		to: 'app',
		label: '200 OK (always)',
		detail: 'empty body — 200 even for an unknown token',
		dashed: true,
		stepId: 'revoke',
	},
	// verify: introspect the same token to confirm the revocation actually applied.
	{
		id: 'verify-request',
		from: 'app',
		to: 'introspect',
		label: 'POST /as/introspect',
		detail: 'confirm the token now reads active:false',
		stepId: 'verify',
	},
	// verify: introspection returns the authoritative post-revocation state.
	{
		id: 'verify-response',
		from: 'introspect',
		to: 'app',
		label: '200 OK — { active: false }',
		detail: 'revocation confirmed',
		dashed: true,
		stepId: 'verify',
	},
];
