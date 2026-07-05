// src/flows2/content/tokenRevocationSabotage.ts
//
// Break-it Lab scenarios for the Token Revocation flow (RFC 7009). The defining
// teaching point of RFC 7009 is that revocation is deliberately forgiving: an unknown
// token, someone else's token, or a wrong token_type_hint all still yield a 200 (no
// effect, no error). Because "the server returns 200 rather than an error" cannot be
// shown as a live rejection, those scenarios are `simulateOnly`. The one genuinely
// rejectable mistake — dropping client authentication — is live.
//
// A LOCAL mutation registry (mirroring ../framework/sabotage.ts) keeps the mutation
// logic here rather than widening the shared framework stage union. The framework file
// is intentionally left unmodified.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';
import type { FlowCredentials } from '../framework/types';

// This flow's single sabotage stage. The shared SabotageStage union
// ('authorize' | 'exchange') doesn't name it, so we reuse the scenario SHAPE for
// parity and treat the stage as a widened string at the framework boundary.
export const revokeStage = 'revoke' as unknown as SabotageStage;

export const tokenRevocationSabotageScenarios: SabotageScenario[] = [
	{
		id: 'revoke-missing-client-auth',
		label: 'Drop / corrupt the client authentication',
		stage: revokeStage,
		what: 'Sends the revocation request with a blank or wrong client secret, so the caller no longer proves it is the client that was issued the token.',
		expectedError: {
			error: 'invalid_client',
			error_description:
				'Revocation is a protected operation (RFC 7009 §2.1). Without valid client credentials PingOne rejects the request with invalid_client before touching the token.',
			status: 401,
		},
		defends:
			'Requiring client authentication ensures only the issuing client can revoke its own tokens — an attacker cannot invalidate another application’s tokens.',
		severity: 'token-forgery',
	},
	{
		id: 'revoke-foreign-token',
		label: "Revoke someone else's token",
		stage: revokeStage,
		what: 'Submits a token that belongs to a different client / environment than the one authenticating the request.',
		expectedError: {
			error: '200:no-effect',
			error_description:
				'RFC 7009 §2.2: the endpoint returns HTTP 200 even when it does nothing. A token you were not issued is simply not revoked, and you get the same 200 as a successful revocation — the response is not a confirmation of effect. Verify with introspection.',
		},
		defends:
			'The uniform 200 means the endpoint never leaks whether a foreign token exists, while client-scoped authorization means you cannot actually revoke a token that is not yours (confused-deputy defense).',
		severity: 'confused-deputy',
		simulateOnly: true,
	},
	{
		id: 'revoke-wrong-hint',
		label: 'Send the wrong token_type_hint',
		stage: revokeStage,
		what: 'Labels an access token as a refresh_token (or vice versa) via token_type_hint.',
		expectedError: {
			error: '200:hint-advisory',
			error_description:
				'RFC 7009 §2.1: the hint is advisory. When it is wrong, the server extends its search to other token types and STILL revokes the token, returning 200. The hint optimizes lookup order — it is not a filter and cannot make revocation fail.',
		},
		defends:
			'Treating the hint as advisory (not authoritative) prevents a wrong or malicious hint from silently leaving a token active when the caller intended to revoke it.',
		severity: 'confused-deputy',
		simulateOnly: true,
	},
];

// --- LOCAL mutation registry ---------------------------------------------------
//
// Only the live scenario (dropping client auth) mutates the outgoing params; the two
// `simulateOnly` scenarios leave params untouched, because their lesson ("the server
// returns 200 rather than an error") is shown without a live sabotaged call.

type RevokeSabotageStage = 'revoke';

interface Mutator {
	stage: RevokeSabotageStage;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

/** Blank the client secret so the caller can no longer authenticate to the endpoint. */
function dropClientAuth(current: unknown): Record<string, unknown> {
	const creds = (current ?? {}) as FlowCredentials;
	return { ...creds, clientSecret: '' };
}

const MUTATORS: Record<string, Mutator> = {
	'revoke-missing-client-auth': {
		stage: 'revoke',
		mutate: (p) => ({ ...p, credentials: dropClientAuth(p.credentials) }),
	},
	'revoke-foreign-token': {
		stage: 'revoke',
		simulateOnly: true,
	},
	'revoke-wrong-hint': {
		stage: 'revoke',
		simulateOnly: true,
	},
};

/**
 * Apply a selected scenario's mutation to the outgoing revocation params.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id, wrong stage, or `simulateOnly` → params unchanged.
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyTokenRevocationSabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: RevokeSabotageStage,
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
