// src/flows2/content/dpopSabotage.ts
//
// Break-it Lab scenarios for the DPoP flow (RFC 9449). Each scenario corrupts one part
// of the proof-of-possession machinery and names the error a DPoP-aware authorization
// or resource server returns. Because the key pair and proof JWT are generated
// client-side (and the offline mock always mints a bound token regardless), these
// rejections cannot be reproduced with a single live call here — every scenario is
// `simulateOnly`, so the predicted error is shown without dispatching a mutated request.
//
// The local applyDpopSabotage mirrors applyAuthzCodeSabotage in ../framework/sabotage.ts:
// it is pure, never throws, and returns params unchanged for null / unknown / wrong-stage
// / simulateOnly ids.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';

export const dpopSabotageScenarios: SabotageScenario[] = [
	{
		id: 'wrong-key-proof',
		label: 'Sign the proof with the wrong key',
		stage: 'request',
		what: 'Presents a DPoP proof signed by a different private key than the one whose thumbprint is bound into the token (cnf.jkt).',
		expectedError: {
			error: 'invalid_dpop_proof',
			error_description:
				'The proof signature does not verify against the embedded jwk, or the jwk thumbprint does not match the access token cnf.jkt. The request is rejected.',
			status: 400,
		},
		defends:
			'Binding the token to a specific key (cnf.jkt) means only the holder of the matching private key can present a valid proof — a stolen token plus a mismatched key is useless.',
		severity: 'key-binding',
		simulateOnly: true,
	},
	{
		id: 'replay-proof',
		label: 'Replay a previously used proof',
		stage: 'request',
		what: 'Re-sends a DPoP proof (same jti and iat) that the server has already seen, instead of minting a fresh one.',
		expectedError: {
			error: 'invalid_dpop_proof',
			error_description:
				'The proof jti has already been seen within the acceptance window, or iat is outside the allowed skew. Replayed proofs are rejected.',
			status: 400,
		},
		defends:
			'A unique jti plus a fresh iat per request stops a captured proof from being replayed — each proof is single-use within the server’s window.',
		severity: 'replay',
		simulateOnly: true,
	},
	{
		id: 'omit-dpop-header',
		label: 'Use a DPoP-bound token as a bearer token',
		stage: 'request',
		what: 'Sends the DPoP-bound access token on a resource call with an Authorization: Bearer header and no DPoP proof header.',
		expectedError: {
			error: 'invalid_token',
			error_description:
				'The access token is bound to a key (cnf.jkt) and must be presented with a matching DPoP proof. Presented as a bearer token with no proof, it is rejected.',
			status: 401,
		},
		defends:
			'Requiring the DPoP scheme (not Bearer) for a bound token means an attacker who exfiltrates the token cannot use it without also producing a valid per-request proof.',
		severity: 'token-theft',
		simulateOnly: true,
	},
];

// Internal mutation entry — mirrors the shape in ../framework/sabotage.ts. Every DPoP
// scenario is simulateOnly, so no mutator is defined; the registry records stage only.
interface DpopMutator {
	stage: SabotageStage;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

const DPOP_MUTATORS: Record<string, DpopMutator> = {
	// All three DPoP sabotages require live proof/key verification that neither the
	// offline mock nor PingOne's limited DPoP support reproduce, so they simulate the
	// rejection without mutating the outgoing request.
	'wrong-key-proof': { stage: 'request', simulateOnly: true },
	'replay-proof': { stage: 'request', simulateOnly: true },
	'omit-dpop-header': { stage: 'request', simulateOnly: true },
};

/**
 * Apply a selected DPoP scenario's mutation to the outgoing params for `stage`.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id → params unchanged.
 * - Id whose scenario targets a different stage → params unchanged.
 * - `simulateOnly` scenarios → params unchanged (the flow shows the error without a call).
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyDpopSabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: SabotageStage,
	params: T
): T {
	if (!scenarioId) return params;
	const entry = DPOP_MUTATORS[scenarioId];
	if (!entry) return params;
	if (entry.stage !== stage) return params;
	if (entry.simulateOnly || !entry.mutate) return params;
	try {
		return entry.mutate(params) as T;
	} catch {
		return params;
	}
}
