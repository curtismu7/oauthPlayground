// src/flows2/content/authorizationCodeSequence.ts
//
// Spec-accurate sequence-diagram content for the Authorization Code + PKCE flow
// (RFC 6749 §4.1 + RFC 7636 + OIDC Core), mapped onto the five step ids of
// authorizationCode.flow.tsx: configure, pkce, authorize, exchange, use.
//
// Endpoint shapes mirror src/flows2/services/pingone.ts (pingoneEndpoints):
// /as/authorize, /as/token, /as/userinfo. Feed these to <FlowSequenceDiagram />
// alongside engine.current.id and engine.completed.

import type {
	SequenceActor,
	SequenceInteraction,
} from '../framework/FlowSequenceDiagram';

export const authorizationCodeActors: SequenceActor[] = [
	{ id: 'browser', label: 'Browser / User' },
	{ id: 'app', label: 'Your App' },
	{ id: 'authz', label: 'PingOne AuthZ' },
	{ id: 'resource', label: 'UserInfo' },
];

export const authorizationCodeInteractions: SequenceInteraction[] = [
	// configure: the app is set up with its client_id, redirect_uri, and scopes.
	{
		id: 'configure-register',
		from: 'app',
		to: 'authz',
		label: 'register client_id + redirect_uri',
		detail: 'scope=openid profile email',
		stepId: 'configure',
	},
	// pkce: client-internal generation of the verifier + S256 challenge (RFC 7636).
	{
		id: 'pkce-generate',
		from: 'app',
		to: 'app',
		label: 'generate code_verifier + S256 challenge',
		detail: 'code_challenge = BASE64URL(SHA256(code_verifier))',
		stepId: 'pkce',
	},
	// authorize: app sends the user's browser to /as/authorize with the challenge.
	{
		id: 'authorize-request',
		from: 'browser',
		to: 'authz',
		label: 'GET /as/authorize',
		detail: 'response_type=code&code_challenge=...&code_challenge_method=S256',
		stepId: 'authorize',
	},
	// authorize: user authenticates and consents; AS redirects back with the code.
	{
		id: 'authorize-redirect',
		from: 'authz',
		to: 'browser',
		label: '302 Redirect to redirect_uri',
		detail: 'code=<authorization_code>&state=...',
		dashed: true,
		stepId: 'authorize',
	},
	// exchange: back channel — app POSTs the code + code_verifier to /as/token.
	{
		id: 'exchange-request',
		from: 'app',
		to: 'authz',
		label: 'POST /as/token',
		detail: 'grant_type=authorization_code&code=...&code_verifier=...',
		stepId: 'exchange',
	},
	// exchange: AS verifies the PKCE binding and returns the tokens.
	{
		id: 'exchange-response',
		from: 'authz',
		to: 'app',
		label: '200 OK — token response',
		detail: 'access_token, id_token, refresh_token',
		dashed: true,
		stepId: 'exchange',
	},
	// use: app calls the OIDC UserInfo endpoint with the access token.
	{
		id: 'use-request',
		from: 'app',
		to: 'resource',
		label: 'GET /as/userinfo',
		detail: 'Authorization: Bearer <access_token>',
		stepId: 'use',
	},
	// use: UserInfo returns the authenticated user's claims.
	{
		id: 'use-response',
		from: 'resource',
		to: 'app',
		label: '200 OK — userinfo claims',
		detail: 'sub, name, email, ...',
		dashed: true,
		stepId: 'use',
	},
];
