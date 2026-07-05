// src/flows2/content/clientCredentialsSequence.ts
//
// Spec-accurate sequence-diagram content for the Client Credentials grant
// (RFC 6749 §4.4), mapped onto the three step ids of clientCredentials.flow.tsx:
// configure, request, inspect. There is no user and no redirect — the confidential
// client authenticates as itself directly at the token endpoint.
//
// Endpoint shapes mirror src/flows2/services/pingone.ts (pingoneEndpoints):
// /as/token, /as/introspect. Feed these to <FlowSequenceDiagram /> alongside
// engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const clientCredentialsActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'token', label: 'PingOne Token' },
];

export const clientCredentialsInteractions: SequenceInteraction[] = [
	// configure: the worker/confidential app is set up with its own client_id + secret.
	{
		id: 'configure-credentials',
		from: 'app',
		to: 'app',
		label: 'load client_id + client_secret',
		detail: 'confidential (worker) client — no user, no redirect',
		stepId: 'configure',
	},
	// request: back-channel client authentication + token request (RFC 6749 §4.4.2).
	{
		id: 'request-token',
		from: 'app',
		to: 'token',
		label: 'POST /as/token',
		detail: 'grant_type=client_credentials&scope=p1:read:user',
		stepId: 'request',
	},
	// request: the AS authenticates the client and returns an access token (no id_token).
	{
		id: 'request-response',
		from: 'token',
		to: 'app',
		label: '200 OK — token response',
		detail: 'access_token, token_type=Bearer, expires_in (no id_token)',
		dashed: true,
		stepId: 'request',
	},
	// inspect: the app (acting as a resource server would) introspects the token.
	{
		id: 'inspect-request',
		from: 'app',
		to: 'token',
		label: 'POST /as/introspect',
		detail: 'token=<access_token> (RFC 7662)',
		stepId: 'inspect',
	},
	// inspect: introspection reports the token's active state and claims.
	{
		id: 'inspect-response',
		from: 'token',
		to: 'app',
		label: '200 OK — introspection',
		detail: 'active=true, scope, aud, exp, client_id',
		dashed: true,
		stepId: 'inspect',
	},
];
