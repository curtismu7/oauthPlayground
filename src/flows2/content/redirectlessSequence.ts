// src/flows2/content/redirectlessSequence.ts
//
// Sequence-diagram content for the Redirectless / pi.flow grant (a PingOne
// extension: response_mode=pi.flow). Unlike a spec redirect flow, there is no
// browser hop — the app drives a JSON flow state machine over the Flow API and
// receives standard tokens at the end. Mapped onto the four step ids of
// redirectless.flow.tsx: configure, start, authenticate, use.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const redirectlessActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'flow', label: 'PingOne Flow API' },
];

export const redirectlessInteractions: SequenceInteraction[] = [
	// configure: the first-party app is set up; response_mode=pi.flow must be allowed.
	{
		id: 'configure-register',
		from: 'app',
		to: 'flow',
		label: 'register first-party client',
		detail: 'response_mode=pi.flow enabled on the app',
		stepId: 'configure',
	},
	// start: the app opens the flow with response_mode=pi.flow — no redirect issued.
	{
		id: 'start-authorize',
		from: 'app',
		to: 'flow',
		label: 'POST /as/authorize',
		detail: 'response_mode=pi.flow (no browser redirect)',
		stepId: 'start',
	},
	// start: PingOne returns a JSON flow object instead of a 302 redirect.
	{
		id: 'start-flow-object',
		from: 'flow',
		to: 'app',
		label: '200 — flow object (JSON)',
		detail: 'flowId, status=USERNAME_PASSWORD_REQUIRED, _links',
		dashed: true,
		stepId: 'start',
	},
	// authenticate: the app submits the required step (credentials) into the flow.
	{
		id: 'authenticate-submit',
		from: 'app',
		to: 'flow',
		label: 'submit credentials to flow',
		detail: 'username + password → follow _links.next',
		stepId: 'authenticate',
	},
	// authenticate: the flow state machine advances; the app polls until COMPLETED.
	{
		id: 'authenticate-transition',
		from: 'flow',
		to: 'app',
		label: 'flow status transitions',
		detail: 'PENDING → … → COMPLETED (poll via _links)',
		dashed: true,
		stepId: 'authenticate',
	},
	// use: the completed flow carries standard OAuth/OIDC tokens.
	{
		id: 'use-tokens',
		from: 'app',
		to: 'flow',
		label: 'read tokens from completed flow',
		detail: 'access_token, id_token — standard tokens',
		stepId: 'use',
	},
];
