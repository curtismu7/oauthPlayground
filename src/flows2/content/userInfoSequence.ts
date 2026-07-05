// src/flows2/content/userInfoSequence.ts
//
// Spec-accurate sequence-diagram content for the UserInfo flow (OpenID Connect
// Core 1.0 §5.3), mapped onto the three step ids of userInfo.flow.tsx:
// configure, fetch, compare.
//
// There is no browser redirect and no user interaction here — the client already
// holds a user-delegated access token (obtained earlier via the Authorization
// Code flow) and presents it as a Bearer credential. Endpoint shape mirrors
// src/flows2/services/userInfoService.ts (/as/userinfo). Feed these to
// <FlowSequenceDiagram /> alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const userInfoActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'pingone', label: 'PingOne UserInfo' },
];

export const userInfoInteractions: SequenceInteraction[] = [
	// configure: the app already holds a user-delegated access token from an
	// earlier Authorization Code flow — UserInfo consumes it, it is not minted here.
	{
		id: 'configure-token',
		from: 'app',
		to: 'app',
		label: 'hold user-delegated access_token',
		detail: 'issued via Authorization Code with the openid scope',
		stepId: 'configure',
	},
	// fetch: present the ACCESS token (not the id_token) as a Bearer credential.
	{
		id: 'fetch-request',
		from: 'app',
		to: 'pingone',
		label: 'GET /{envId}/as/userinfo',
		detail: 'Authorization: Bearer <access_token>',
		stepId: 'fetch',
	},
	// fetch: the AS validates the token and returns claims gated by the scopes.
	{
		id: 'fetch-response',
		from: 'pingone',
		to: 'app',
		label: '200 OK — UserInfo claims',
		detail: 'sub (+ name/email/phone as scopes allow)',
		dashed: true,
		stepId: 'fetch',
	},
	// compare: client-internal — contrast the live claims with the id_token snapshot.
	{
		id: 'compare-claims',
		from: 'app',
		to: 'app',
		label: 'compare live claims vs id_token',
		detail: 'id_token = issue-time snapshot; UserInfo = live query',
		stepId: 'compare',
	},
];
