// src/flows2/content/parSabotage.ts
//
// Break-it Lab scenarios for the Pushed Authorization Request flow (RFC 9126). Each
// scenario sabotages one aspect of the PAR push or the front-channel authorize call and
// names the error a real PingOne PAR / authorization endpoint returns. Mirrors the shape
// of authorizationCodeSabotage.ts, but the mutation registry is LOCAL to this file via
// applyParSabotage — the flow calls that helper directly.
//
// Stages: 'par' (the back-channel push to /as/par) and 'authorize' (the front-channel
// redirect that consumes the request_uri).

import type { SabotageScenario } from '../framework/sabotage';

export const parSabotageScenarios: SabotageScenario[] = [
	{
		id: 'missing-client-auth',
		label: 'Push without client authentication',
		stage: 'par',
		what: 'POSTs the authorization request to /as/par without valid client credentials (clears the client secret).',
		expectedError: {
			error: 'invalid_client',
			error_description:
				'The PAR endpoint requires client authentication (RFC 9126 §2). A push missing or presenting invalid client credentials is rejected before any request_uri is issued.',
			status: 401,
		},
		defends:
			"Requiring client authentication on the PAR endpoint means only the registered client can pre-commit an authorization request — an anonymous party cannot seed a request_uri on the client's behalf.",
		severity: 'client-authentication',
	},
	{
		id: 'reuse-request-uri',
		label: 'Reuse an already-consumed request_uri',
		stage: 'authorize',
		what: 'Sends a request_uri to /as/authorize that has already been used once to start authorization.',
		expectedError: {
			error: 'invalid_request',
			error_description:
				'The request_uri has already been consumed. PAR references are single-use (RFC 9126 §2.2); a second use is rejected. Push again to obtain a fresh request_uri.',
			status: 400,
		},
		defends:
			'Single-use request_uris mean a reference captured from a browser or log cannot be replayed to launch a second authorization — the first use consumes it.',
		severity: 'replay',
		simulateOnly: true,
	},
	{
		id: 'expired-request-uri',
		label: 'Let the request_uri expire before authorizing',
		stage: 'authorize',
		what: 'Uses a request_uri at /as/authorize after its expires_in TTL has elapsed.',
		expectedError: {
			error: 'invalid_request',
			error_description:
				'The request_uri has expired. PAR references are short-lived (RFC 9126 §2.2); after expires_in seconds they are no longer valid and the authorize request is rejected.',
			status: 400,
		},
		defends:
			'A short TTL bounds the window in which a leaked request_uri could be used, so a reference that escapes to history or logs is worthless once it expires.',
		severity: 'replay',
		simulateOnly: true,
	},
];

/**
 * Local mutation registry for the PAR flow, mirroring applyAuthzCodeSabotage in
 * ../framework/sabotage.ts but kept in this content module because the mutations are
 * flow-specific.
 *
 * Params shape for the 'par' stage mirrors parService.pushAuthorizationRequest input:
 * { credentials, redirectUri, state, nonce?, codeChallenge, scope }.
 *
 * Semantics (never throws; returns the identical reference when no mutation applies):
 * - scenarioId === null            → run it correctly → params unchanged.
 * - Unknown id                     → params unchanged.
 * - Scenario for a different stage  → params unchanged.
 * - simulateOnly scenarios         → params unchanged (the flow shows the error without a call).
 */
interface ParMutator {
	stage: string;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

const MUTATORS: Record<string, ParMutator> = {
	// Strip client authentication from the push by clearing the client secret. On PingOne
	// the PAR endpoint requires client auth, so the push is rejected with invalid_client.
	'missing-client-auth': {
		stage: 'par',
		mutate: (p) => {
			const creds = (p.credentials ?? {}) as Record<string, unknown>;
			return { ...p, credentials: { ...creds, clientSecret: '' } };
		},
	},
	// Reusing a consumed request_uri can't be reproduced with a single live run (it needs a
	// prior successful authorization), so the expected error is shown without a mutated call.
	'reuse-request-uri': {
		stage: 'authorize',
		simulateOnly: true,
	},
	// Expiry is time-dependent and cannot be forced synchronously here, so this scenario
	// shows the expected error without dispatching a mutated request.
	'expired-request-uri': {
		stage: 'authorize',
		simulateOnly: true,
	},
};

export function applyParSabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: string,
	params: T
): T {
	if (!scenarioId) return params;
	const entry = MUTATORS[scenarioId];
	if (!entry) return params;
	if (entry.stage !== stage) return params;
	if (entry.simulateOnly || !entry.mutate) return params;
	try {
		return entry.mutate(params) as T;
	} catch {
		return params;
	}
}
