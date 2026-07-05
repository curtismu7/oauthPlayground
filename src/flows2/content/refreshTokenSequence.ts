// src/flows2/content/refreshTokenSequence.ts
//
// Spec-accurate sequence-diagram content for the Refresh Token grant
// (RFC 6749 §6 / OAuth 2.1 §4.3 rotation), mapped onto the three step ids of
// refreshToken.flow.tsx: configure, refresh, rotation.
//
// Endpoint shapes mirror src/flows2/services/pingone.ts (pingoneEndpoints):
// /as/token. Feed these to <FlowSequenceDiagram /> alongside engine.current.id
// and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const refreshTokenActors: SequenceActor[] = [
	{ id: 'app', label: 'Your App' },
	{ id: 'token', label: 'PingOne Token' },
];

export const refreshTokenInteractions: SequenceInteraction[] = [
	// configure: the app already holds a refresh_token from a prior offline_access flow.
	{
		id: 'configure-hold',
		from: 'app',
		to: 'app',
		label: 'hold refresh_token from a prior flow',
		detail: 'issued with offline_access (or openid) scope',
		stepId: 'configure',
	},
	// refresh: back-channel exchange — POST the refresh_token to /as/token (RFC 6749 §6).
	{
		id: 'refresh-request',
		from: 'app',
		to: 'token',
		label: 'POST /as/token',
		detail: 'grant_type=refresh_token&refresh_token=...',
		stepId: 'refresh',
	},
	// refresh: AS returns a fresh access_token AND a rotated refresh_token (OAuth 2.1 §4.3).
	{
		id: 'refresh-response',
		from: 'token',
		to: 'app',
		label: '200 OK — token response',
		detail: 'new access_token + NEW refresh_token (rotated)',
		dashed: true,
		stepId: 'refresh',
	},
	// rotation: the old refresh_token is now invalid; replaying it is detected as reuse.
	{
		id: 'rotation-replay',
		from: 'app',
		to: 'token',
		label: 'POST /as/token (replay OLD token)',
		detail: 'reused refresh_token → reuse detected',
		stepId: 'rotation',
	},
	// rotation: reuse of a rotated-away token revokes the whole grant family.
	{
		id: 'rotation-revoke',
		from: 'token',
		to: 'app',
		label: '400 invalid_grant — family revoked',
		detail: 'automatic-reuse-revocation (security-topics §4.14)',
		dashed: true,
		stepId: 'rotation',
	},
];
