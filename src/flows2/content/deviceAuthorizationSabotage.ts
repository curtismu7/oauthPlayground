// src/flows2/content/deviceAuthorizationSabotage.ts
//
// Break-it Lab scenarios for the Device Authorization grant (RFC 8628). Each scenario
// names one thing to change about the device_authorization request ('device-init') or a
// poll of the token endpoint ('poll'), the error RFC 8628 §3.5 describes, and what that
// response teaches. A key lesson here is that authorization_pending and slow_down are
// *normal polling states*, not failures.
//
// Unlike the shared framework helper, the mutation logic lives locally in
// applyDeviceSabotage below (mirrors applyAuthzCodeSabotage in ../framework/sabotage.ts).

import type { SabotageScenario } from '../framework/sabotage';

export const deviceAuthorizationSabotageScenarios: SabotageScenario[] = [
	{
		id: 'wrong-client-init',
		label: 'Request a device code with the wrong client_id',
		stage: 'device-init',
		what: 'Sends an unknown / mistyped client_id to the device_authorization endpoint.',
		expectedError: {
			error: 'invalid_client',
			error_description:
				'The client_id is not recognized (or is not enabled for the Device Authorization grant), so PingOne refuses to issue a device_code / user_code pair.',
			status: 401,
		},
		defends:
			'Client identification at the device_authorization endpoint means only a registered device client with the grant enabled can start a device flow.',
		severity: 'client-authentication',
	},
	{
		id: 'poll-before-approve',
		label: 'Poll before the user has approved',
		stage: 'poll',
		what: 'Polls the token endpoint while the user has not yet entered the user_code and consented on the second device.',
		expectedError: {
			error: 'authorization_pending',
			error_description:
				'This is the EXPECTED response, not a failure. The user has not finished authorizing yet — the client must keep polling at its interval until approval or expiry.',
		},
		defends:
			'authorization_pending is the normal steady state of a device flow: the client keeps polling without leaking anything until the human completes authorization out of band.',
		severity: 'polling-lifecycle',
		simulateOnly: true,
	},
	{
		id: 'poll-too-fast',
		label: 'Poll faster than the interval',
		stage: 'poll',
		what: 'Sends token requests more frequently than the interval returned in the device authorization response.',
		expectedError: {
			error: 'slow_down',
			error_description:
				'Also expected, not a failure. The server is telling the client to back off; per RFC 8628 §3.5 the client must add 5 seconds to its polling interval and continue.',
		},
		defends:
			'slow_down lets the authorization server pace clients and shed load; a well-behaved device widens its interval instead of hammering the token endpoint.',
		severity: 'polling-lifecycle',
		simulateOnly: true,
	},
	{
		id: 'expired-device-code',
		label: 'Poll with an expired device_code',
		stage: 'poll',
		what: 'Keeps polling with a device_code whose expires_in lifetime has already elapsed.',
		expectedError: {
			error: 'expired_token',
			error_description:
				'The device_code / user_code pair expired before the user approved it. This is terminal — the client must request a brand-new device_code and show the user a fresh user_code.',
			status: 400,
		},
		defends:
			'A bounded device_code lifetime limits the window in which a displayed user_code is useful, so an unattended or abandoned code cannot be authorized indefinitely later.',
		severity: 'expiry',
		simulateOnly: true,
	},
	{
		id: 'wrong-client-poll',
		label: 'Poll with the wrong client_id',
		stage: 'poll',
		what: 'Polls the token endpoint with a client_id different from the one that requested the device_code.',
		expectedError: {
			error: 'invalid_client',
			error_description:
				'The polling client_id does not match the client that obtained the device_code, so PingOne rejects the token request.',
			status: 401,
		},
		defends:
			'Binding the poll to the originating client means a device_code observed by another party cannot be redeemed for tokens under a different client identity.',
		severity: 'client-authentication',
	},
];

// ─── Local mutation helper ─────────────────────────────────────────────────────
//
// Mirrors applyAuthzCodeSabotage in ../framework/sabotage.ts, but scoped to this flow.
// The device flow's live-reproducible sabotages both corrupt the client_id; the
// polling-lifecycle and expiry scenarios are simulateOnly (they need real timing /
// approval state), so the flow shows their predicted error without a mutated call.

interface DeviceMutator {
	stage: string;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

/** Best-effort UUID that never throws, even where WebCrypto is unavailable. */
function safeUuid(): string {
	try {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
	} catch {
		/* fall through to Math.random fallback */
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/** Corrupt a client_id into a plausible-but-wrong value. */
function corruptClientId(current: unknown): string {
	if (typeof current === 'string' && current.length > 0) {
		return `wrong-${current.slice(0, Math.max(1, current.length - 4))}`;
	}
	return `wrong-${safeUuid()}`;
}

const DEVICE_MUTATORS: Record<string, DeviceMutator> = {
	// Start the flow with an unrecognized client_id.
	'wrong-client-init': {
		stage: 'device-init',
		mutate: (p) => ({ ...p, clientId: corruptClientId(p.clientId) }),
	},
	// Poll with a client_id different from the one that obtained the device_code.
	'wrong-client-poll': {
		stage: 'poll',
		mutate: (p) => ({ ...p, clientId: corruptClientId(p.clientId) }),
	},
	// Normal polling states + expiry — can't be forced by a single mutated request.
	'poll-before-approve': { stage: 'poll', simulateOnly: true },
	'poll-too-fast': { stage: 'poll', simulateOnly: true },
	'expired-device-code': { stage: 'poll', simulateOnly: true },
};

/**
 * Apply a selected scenario's mutation to the outgoing params for `stage`.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id → params unchanged.
 * - Id whose scenario targets a different stage → params unchanged.
 * - `simulateOnly` scenarios → params unchanged (the flow shows the error without a call).
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyDeviceSabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: string,
	params: T
): T {
	if (!scenarioId) return params;
	const entry = DEVICE_MUTATORS[scenarioId];
	if (!entry) return params;
	if (entry.stage !== stage) return params;
	if (entry.simulateOnly || !entry.mutate) return params;
	try {
		return entry.mutate(params) as T;
	} catch {
		return params;
	}
}
