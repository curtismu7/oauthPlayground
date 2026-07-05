// src/flows2/content/deviceAuthorizationSequence.ts
//
// Spec-accurate sequence-diagram content for the Device Authorization grant
// (RFC 8628), mapped onto the four step ids of deviceAuthorization.flow.tsx:
// configure, request, authorize, use.
//
// Endpoint shapes mirror src/flows2/services/pingone.ts (pingoneEndpoints):
// /as/device_authorization, /as/token, /as/userinfo. Feed these to
// <FlowSequenceDiagram /> alongside engine.current.id and engine.completed.

import type { SequenceActor, SequenceInteraction } from '../framework/FlowSequenceDiagram';

export const deviceAuthorizationActors: SequenceActor[] = [
	{ id: 'device', label: 'Device / Your App' },
	{ id: 'deviceEp', label: 'PingOne Device EP' },
	{ id: 'phone', label: "User's Phone" },
	{ id: 'token', label: 'PingOne Token EP' },
];

export const deviceAuthorizationInteractions: SequenceInteraction[] = [
	// configure: the browserless device is set up with its client_id + scope; the
	// PingOne app must have the Device Authorization grant enabled.
	{
		id: 'configure-register',
		from: 'device',
		to: 'deviceEp',
		label: 'register device client_id',
		detail: 'grant: urn:ietf:params:oauth:grant-type:device_code',
		stepId: 'configure',
	},
	// request: the device asks the device_authorization endpoint for a code pair.
	{
		id: 'request-device-code',
		from: 'device',
		to: 'deviceEp',
		label: 'POST /as/device_authorization',
		detail: 'client_id&scope=openid',
		stepId: 'request',
	},
	// request: PingOne returns the device_code + the short user_code the human types.
	{
		id: 'request-response',
		from: 'deviceEp',
		to: 'device',
		label: '200 — device_code + user_code',
		detail: 'user_code, verification_uri(_complete), interval, expires_in',
		dashed: true,
		stepId: 'request',
	},
	// authorize: the user moves to a second device and authenticates there.
	{
		id: 'authorize-user',
		from: 'phone',
		to: 'deviceEp',
		label: 'open verification_uri + sign in',
		detail: 'user enters user_code, then consents',
		stepId: 'authorize',
	},
	// authorize: meanwhile the device polls the token endpoint with the device_code.
	{
		id: 'authorize-poll',
		from: 'device',
		to: 'token',
		label: 'POST /as/token (poll)',
		detail: 'grant_type=…device_code&device_code=…',
		stepId: 'authorize',
	},
	// authorize: PingOne answers authorization_pending / slow_down until approval,
	// then finally returns the tokens. Both interim states are normal, not failures.
	{
		id: 'authorize-token',
		from: 'token',
		to: 'device',
		label: 'authorization_pending → 200 tokens',
		detail: 'keep polling (honor slow_down) until approved',
		dashed: true,
		stepId: 'authorize',
	},
	// use: the device inspects / uses the tokens it just received.
	{
		id: 'use-inspect',
		from: 'device',
		to: 'token',
		label: 'inspect / use access_token',
		detail: 'decode, introspect, or call /as/userinfo',
		stepId: 'use',
	},
];
