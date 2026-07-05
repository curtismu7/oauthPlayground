// src/flows2/content/parSequence.ts
//
// Spec-accurate sequence-diagram content for the Pushed Authorization Request flow
// (RFC 9126 + RFC 6749 §4.1 + RFC 7636), mapped onto the five step ids of
// par.flow.tsx: configure, push, authorize, exchange, use.
//
// The defining trait of PAR is that the full authorization request is POSTed to the
// AS back channel FIRST (with client authentication) and referenced by an opaque,
// short-lived request_uri on the front channel. Endpoint shapes mirror
// src/flows2/services/pingone.ts (pingoneEndpoints): /as/par, /as/authorize, /as/token.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const parActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'par', label: 'PingOne PAR' },
	{ id: 'authz', label: 'PingOne AuthZ' },
	{ id: 'browser', label: 'Browser / User' },
];

export const parInteractions: SequenceInteraction[] = [
	// configure: the app is set up with credentials and generates PKCE before pushing.
	{
		id: 'configure-register',
		from: 'app',
		to: 'authz',
		label: 'register client_id + redirect_uri',
		detail: 'client authenticates on the PAR / token endpoints (confidential client)',
		stepId: 'configure',
	},
	// push: back channel — the FULL authorization request is POSTed to /as/par with client auth.
	{
		id: 'push-request',
		from: 'app',
		to: 'par',
		label: 'POST /as/par',
		detail: 'response_type=code&client_id=…&redirect_uri=…&scope=…&code_challenge=… + client auth',
		stepId: 'push',
	},
	// push: the PAR endpoint validates + stores the request and returns an opaque request_uri.
	{
		id: 'push-response',
		from: 'par',
		to: 'app',
		label: '201 Created — request_uri',
		detail: 'request_uri=urn:ietf:params:oauth:request_uri:… , expires_in (one-time use)',
		dashed: true,
		stepId: 'push',
	},
	// authorize: front channel carries ONLY client_id + request_uri — nothing tamperable.
	{
		id: 'authorize-request',
		from: 'browser',
		to: 'authz',
		label: 'GET /as/authorize',
		detail: 'client_id=…&request_uri=urn:…  (no scope / redirect_uri / challenge in the URL)',
		stepId: 'authorize',
	},
	// authorize: user authenticates + consents; AS redirects back with the code.
	{
		id: 'authorize-redirect',
		from: 'authz',
		to: 'browser',
		label: '302 Redirect to redirect_uri',
		detail: 'code=<authorization_code>&state=…',
		dashed: true,
		stepId: 'authorize',
	},
	// exchange: back channel — app POSTs the code + PKCE code_verifier to /as/token.
	{
		id: 'exchange-request',
		from: 'app',
		to: 'authz',
		label: 'POST /as/token',
		detail: 'grant_type=authorization_code&code=…&code_verifier=…',
		stepId: 'exchange',
	},
	// exchange: AS verifies the PKCE binding locked in via PAR and returns the tokens.
	{
		id: 'exchange-response',
		from: 'authz',
		to: 'app',
		label: '200 OK — token response',
		detail: 'access_token, id_token, refresh_token',
		dashed: true,
		stepId: 'exchange',
	},
	// use: app calls a protected endpoint with the access token.
	{
		id: 'use-request',
		from: 'app',
		to: 'authz',
		label: 'GET /as/userinfo',
		detail: 'Authorization: Bearer <access_token>',
		stepId: 'use',
	},
];
