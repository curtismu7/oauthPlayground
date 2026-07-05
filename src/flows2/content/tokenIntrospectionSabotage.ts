// src/flows2/content/tokenIntrospectionSabotage.ts
//
// Break-it Lab scenarios for the Token Introspection flow (RFC 7662). Each scenario
// names one thing to sabotage on the introspection request and the behaviour a real
// PingOne endpoint exhibits in response. The key teaching point of RFC 7662 is that
// an invalid/foreign/malformed token is NOT an error — the endpoint answers
// { active: false } with a 200 — so several scenarios are `simulateOnly`: the lesson
// is "the server tells you nothing", which cannot be shown as a live rejection.
//
// A LOCAL mutation registry (mirroring ../framework/sabotage.ts) keeps the mutation
// logic here rather than widening the shared framework stage union. The framework file
// is intentionally left unmodified.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';
import type { FlowCredentials } from '../framework/types';

// This flow's single sabotage stage. The shared SabotageStage union
// ('authorize' | 'exchange') doesn't name it, so we reuse the scenario SHAPE for
// parity and treat the stage as a widened string at the framework boundary.
export const introspectStage = 'introspect' as unknown as SabotageStage;

export const tokenIntrospectionSabotageScenarios: SabotageScenario[] = [
	{
		id: 'introspect-missing-client-auth',
		label: 'Drop / corrupt the client authentication',
		stage: introspectStage,
		what: 'Sends the introspection request with a blank or wrong client secret, so the caller no longer proves it is a registered client.',
		expectedError: {
			error: 'invalid_client',
			error_description:
				'Introspection is a protected endpoint (RFC 7662 §2.1). Without valid client credentials PingOne rejects the call before revealing anything about the token.',
			status: 401,
		},
		defends:
			'Requiring client authentication stops an anonymous party from scanning arbitrary token strings to learn which ones are valid.',
		severity: 'token-forgery',
	},
	{
		id: 'introspect-foreign-token',
		label: 'Introspect a token from another environment / client',
		stage: introspectStage,
		what: 'Submits a token that was issued by a different PingOne environment (or a different client) than the one authenticating the request.',
		expectedError: {
			error: 'active:false',
			error_description:
				'RFC 7662 §2.2: a token outside the caller’s trust boundary simply reads inactive. PingOne returns HTTP 200 with { active: false } — never an error and never the foreign token’s claims. Introspection reveals nothing about tokens you did not issue.',
		},
		defends:
			'Scoping introspection to the caller’s own environment means a stolen token from elsewhere leaks no scope, subject, or expiry — you only ever learn "inactive".',
		severity: 'confused-deputy',
		simulateOnly: true,
	},
	{
		id: 'introspect-malformed-token',
		label: 'Introspect a malformed / garbage token',
		stage: introspectStage,
		what: 'Replaces the token with a random, structurally-invalid string that was never issued by any authorization server.',
		expectedError: {
			error: 'active:false',
			error_description:
				'RFC 7662 §2.2: an invalid or malformed token is NOT an error condition. The endpoint returns HTTP 200 with { active: false }. This surprises people expecting a 400 — introspection treats "not a real token" the same as "expired or revoked".',
		},
		defends:
			'Reporting malformed tokens as merely inactive (rather than erroring) keeps the endpoint from becoming an oracle that distinguishes "well-formed but revoked" from "gibberish".',
		severity: 'token-forgery',
		simulateOnly: true,
	},
];

// --- LOCAL mutation registry ---------------------------------------------------
//
// Only the live scenario (dropping client auth) mutates the outgoing params; the two
// `simulateOnly` scenarios leave params untouched, because their lesson ("the server
// answers active:false rather than an error") is shown without a live sabotaged call.

type IntrospectSabotageStage = 'introspect';

interface Mutator {
	stage: IntrospectSabotageStage;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

/** Blank the client secret so the caller can no longer authenticate to the endpoint. */
function dropClientAuth(current: unknown): Record<string, unknown> {
	const creds = (current ?? {}) as FlowCredentials;
	return { ...creds, clientSecret: '' };
}

const MUTATORS: Record<string, Mutator> = {
	'introspect-missing-client-auth': {
		stage: 'introspect',
		mutate: (p) => ({ ...p, credentials: dropClientAuth(p.credentials) }),
	},
	'introspect-foreign-token': {
		stage: 'introspect',
		simulateOnly: true,
	},
	'introspect-malformed-token': {
		stage: 'introspect',
		simulateOnly: true,
	},
};

/**
 * Apply a selected scenario's mutation to the outgoing introspection params.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id, wrong stage, or `simulateOnly` → params unchanged.
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyTokenIntrospectionSabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: IntrospectSabotageStage,
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
