// src/flows2/content/tokenExchangeSabotage.ts
//
// Break-it Lab scenarios for the Token Exchange flow (RFC 8693). Each scenario corrupts
// one part of the exchange request and names the error PingOne's token endpoint returns
// (RFC 8693 §2.2.2 / RFC 6749 §5.2). The offline mock always mints an exchanged token
// regardless of these inputs, so the rejections cannot be reproduced with a single live
// mock call — every scenario is `simulateOnly`, showing the predicted error without
// dispatching a mutated request.
//
// The local applyTokenExchangeSabotage mirrors applyAuthzCodeSabotage in
// ../framework/sabotage.ts: it is pure, never throws, and returns params unchanged for
// null / unknown / wrong-stage / simulateOnly ids.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';

export const tokenExchangeSabotageScenarios: SabotageScenario[] = [
	{
		id: 'invalid-subject-token',
		label: 'Present an invalid / expired subject_token',
		stage: 'exchange',
		what: 'Sends a subject_token that is malformed, revoked, or past its exp so it cannot be validated as an active token.',
		expectedError: {
			error: 'invalid_grant',
			error_description:
				'The subject_token is expired, revoked, or otherwise not a valid, active token. The exchange is refused.',
			status: 400,
		},
		defends:
			'Validating the subject_token before minting a new token stops a stale or forged token from being laundered into a fresh, valid one.',
		severity: 'token-substitution',
		simulateOnly: true,
	},
	{
		id: 'unsupported-subject-token-type',
		label: 'Declare an unsupported subject_token_type',
		stage: 'exchange',
		what: 'Sets subject_token_type to a value the server does not support, or one that does not describe the token actually presented.',
		expectedError: {
			error: 'invalid_request',
			error_description:
				'subject_token_type is missing, unsupported, or inconsistent with the presented subject_token. The request is rejected before any token is issued.',
			status: 400,
		},
		defends:
			'Requiring an accurate, supported subject_token_type prevents a token of one kind from being misinterpreted as another during the exchange.',
		severity: 'protocol',
		simulateOnly: true,
	},
	{
		id: 'disallowed-audience',
		label: 'Request an audience the subject is not allowed',
		stage: 'exchange',
		what: 'Sets the audience/resource to a target the subject (or requesting client) is not authorized to receive a token for.',
		expectedError: {
			error: 'invalid_target',
			error_description:
				'The requested audience/resource is unknown or not permitted for this subject. The server refuses rather than issuing a broader token.',
			status: 400,
		},
		defends:
			'Audience restriction (RFC 8707) keeps an exchanged token scoped to resources the subject is entitled to, blocking privilege escalation across services.',
		severity: 'audience-restriction',
		simulateOnly: true,
	},
];

// Internal mutation entry — mirrors the shape in ../framework/sabotage.ts. Every
// token-exchange scenario is simulateOnly, so no mutator is defined; the registry
// records stage only.
interface TokenExchangeMutator {
	stage: SabotageStage;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

const TOKEN_EXCHANGE_MUTATORS: Record<string, TokenExchangeMutator> = {
	// The offline mock issues a token regardless of subject-token validity, token type,
	// or audience, so these rejections are simulated (the predicted error is shown
	// without dispatching a mutated request).
	'invalid-subject-token': { stage: 'exchange', simulateOnly: true },
	'unsupported-subject-token-type': { stage: 'exchange', simulateOnly: true },
	'disallowed-audience': { stage: 'exchange', simulateOnly: true },
};

/**
 * Apply a selected token-exchange scenario's mutation to the outgoing params for `stage`.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id → params unchanged.
 * - Id whose scenario targets a different stage → params unchanged.
 * - `simulateOnly` scenarios → params unchanged (the flow shows the error without a call).
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyTokenExchangeSabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: SabotageStage,
	params: T
): T {
	if (!scenarioId) return params;
	const entry = TOKEN_EXCHANGE_MUTATORS[scenarioId];
	if (!entry) return params;
	if (entry.stage !== stage) return params;
	if (entry.simulateOnly || !entry.mutate) return params;
	try {
		return entry.mutate(params) as T;
	} catch {
		return params;
	}
}
