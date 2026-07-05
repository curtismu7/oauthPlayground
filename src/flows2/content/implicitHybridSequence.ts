// src/flows2/content/implicitHybridSequence.ts
//
// Spec-accurate sequence-diagram content for the Implicit + Hybrid flow
// (OAuth 2.0 §4.2 implicit + OIDC Core §3.2/§3.3 hybrid), mapped onto the four
// step ids of implicitHybrid.flow.tsx: configure, authorize, result, explain.
//
// The defining trait of both sub-modes is FRAGMENT delivery: the authorization
// server returns tokens (implicit) or a code + id_token (hybrid) in the URL
// fragment (#…), which never reaches the server. Feed these to
// <FlowSequenceDiagram /> alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const implicitHybridActors: SequenceActor[] = [
	{ id: 'browser', label: 'Browser / User' },
	{ id: 'app', label: 'Your App' },
	{ id: 'authz', label: 'PingOne AuthZ' },
];

export const implicitHybridInteractions: SequenceInteraction[] = [
	// configure: the app is set up with its client_id, redirect_uri, and response_mode=fragment.
	{
		id: 'configure-register',
		from: 'app',
		to: 'authz',
		label: 'register client_id + redirect_uri',
		detail: 'response_mode=fragment, response_type=token | id_token token | code id_token',
		stepId: 'configure',
	},
	// authorize: app sends the browser to /as/authorize; no back-channel, no PKCE.
	{
		id: 'authorize-request',
		from: 'browser',
		to: 'authz',
		label: 'GET /as/authorize',
		detail: 'response_type=token&state=...&nonce=... (OIDC)',
		stepId: 'authorize',
	},
	// authorize: user authenticates; AS redirects back with tokens IN THE FRAGMENT.
	{
		id: 'authorize-redirect',
		from: 'authz',
		to: 'browser',
		label: '302 Redirect to redirect_uri#…',
		detail: '#access_token=…&id_token=…&state=…  (or #code=…&id_token=… for hybrid)',
		dashed: true,
		stepId: 'authorize',
	},
	// result: the client reads window.location.hash — tokens never touched the server.
	{
		id: 'result-read-fragment',
		from: 'browser',
		to: 'app',
		label: 'read window.location.hash',
		detail: 'parse #access_token / #id_token / #code; verify state + nonce',
		stepId: 'result',
	},
	// result (hybrid only): exchange the front-channel code at the token endpoint.
	{
		id: 'result-exchange',
		from: 'app',
		to: 'authz',
		label: 'POST /as/token (hybrid only)',
		detail: 'grant_type=authorization_code&code=… (back channel)',
		stepId: 'result',
	},
	// result (hybrid only): AS returns the full token set including a refresh_token.
	{
		id: 'result-exchange-response',
		from: 'authz',
		to: 'app',
		label: '200 OK — token response (hybrid)',
		detail: 'access_token, id_token, refresh_token',
		dashed: true,
		stepId: 'result',
	},
	// explain: the teaching point — tokens in the fragment leak to history/logs/referrer.
	{
		id: 'explain-leak',
		from: 'app',
		to: 'app',
		label: 'fragment persists in browser history + Referer',
		detail: 'why OAuth 2.1 (RFC 9700) removes implicit — use code + PKCE instead',
		dashed: true,
		stepId: 'explain',
	},
];
