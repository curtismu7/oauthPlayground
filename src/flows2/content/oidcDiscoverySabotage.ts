// src/flows2/content/oidcDiscoverySabotage.ts
//
// Break-it Lab scenarios for the OIDC Discovery + JWKS flow. Discovery is a pair of
// public GETs, so most sabotage here is about what the CLIENT must check on the way
// back — not a parameter the server rejects. One scenario (a typo'd environment id)
// is a genuine live mutation that a real PingOne endpoint answers with 404; the rest
// are simulateOnly because they teach a client-side validation the demo can't force.
//
// The apply helper is local to this flow (mirrors applyAuthzCodeSabotage in
// ../framework/sabotage.ts): it never throws and is the identity function on a null,
// unknown, wrong-stage, or simulateOnly selection.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';

export const oidcDiscoverySabotageScenarios: SabotageScenario[] = [
	{
		id: 'wrong-environment-id',
		label: 'Request a typo’d environment id',
		stage: 'discover',
		what: 'Fetches the well-known document from an environment id that does not exist (a mistyped UUID).',
		expectedError: {
			error: 'not_found',
			error_description:
				'No environment matches this id, so there is no discovery document to return. PingOne answers the well-known request with HTTP 404.',
			status: 404,
		},
		defends:
			'The issuer — including the environment id — must be exactly right; a wrong id resolves to no provider at all, which is why discovery is keyed to a precise, environment-scoped issuer.',
		severity: 'misconfiguration',
	},
	{
		id: 'tamper-issuer',
		label: 'Accept a document whose issuer doesn’t match',
		stage: 'discover',
		what: 'Simulates a returned discovery document whose issuer differs from the URL the client fetched from.',
		expectedError: {
			error: 'issuer_mismatch',
			error_description:
				'The issuer in the document is not identical to the issuer used to build the well-known URL. Per OIDC Discovery §4.3 the client MUST reject the document.',
		},
		defends:
			'Validating that the returned issuer equals the expected value stops a client from silently adopting endpoints advertised by an impostor or wrong tenant.',
		severity: 'spoofing',
		simulateOnly: true,
	},
	{
		id: 'insecure-http',
		label: 'Fetch discovery over http instead of https',
		stage: 'discover',
		what: 'Simulates retrieving the discovery document and JWKS over plain http rather than TLS.',
		expectedError: {
			error: 'insecure_transport',
			error_description:
				'OpenID Connect Discovery requires TLS. Over http the metadata and signing keys could be tampered with in transit, so the client must refuse to use them.',
		},
		defends:
			'TLS is what makes the discovery document and JWKS trustworthy in the first place; without it an on-path attacker could swap the endpoints or the signing keys the client will trust.',
		severity: 'transport',
		simulateOnly: true,
	},
];

/** Internal mutation entry. A missing `mutate` (or `simulateOnly`) leaves params unchanged. */
interface Mutator {
	stage: SabotageStage;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

/** Corrupt an environment id into a plausible-but-nonexistent value (a mistyped UUID). */
function corruptEnvironmentId(current: unknown): string {
	if (typeof current === 'string' && current.length > 0) {
		return `${current.slice(0, Math.max(1, current.length - 4))}-typo`;
	}
	return '00000000-0000-0000-0000-0000000typo';
}

// Mutation registry, keyed by scenario id, kept in lock-step with the scenarios above.
const MUTATORS: Record<string, Mutator> = {
	// Point discovery at an environment id that does not resolve — a real 404.
	'wrong-environment-id': {
		stage: 'discover',
		mutate: (p) => ({ ...p, environmentId: corruptEnvironmentId(p.environmentId) }),
	},
	// Client-side checks the demo can't force from a single live call.
	'tamper-issuer': { stage: 'discover', simulateOnly: true },
	'insecure-http': { stage: 'discover', simulateOnly: true },
};

/**
 * Apply a selected scenario's mutation to the outgoing discovery params for `stage`.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id → params unchanged.
 * - Id whose scenario targets a different stage → params unchanged.
 * - `simulateOnly` scenarios → params unchanged (the flow shows the error without a call).
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyOidcDiscoverySabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: SabotageStage,
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
