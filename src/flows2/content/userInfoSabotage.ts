// src/flows2/content/userInfoSabotage.ts
//
// Break-it Lab scenarios for the UserInfo flow (OpenID Connect Core 1.0 §5.3).
// UserInfo is a single authenticated GET, so the interesting failures are all about
// the credential presented: a bad access token, the wrong kind of token (an id_token),
// or a token that never carried the openid scope. Only the corrupted-access-token
// case is a live mutation a real PingOne endpoint answers with 401; the other two are
// simulateOnly because they depend on how the token was originally minted.
//
// The apply helper is local to this flow (mirrors applyAuthzCodeSabotage in
// ../framework/sabotage.ts): it never throws and is the identity function on a null,
// unknown, wrong-stage, or simulateOnly selection.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';

export const userInfoSabotageScenarios: SabotageScenario[] = [
	{
		id: 'expired-access-token',
		label: 'Present an expired / invalid access token',
		stage: 'userinfo',
		what: 'Sends a corrupted (expired or malformed) access token to the UserInfo endpoint.',
		expectedError: {
			error: 'invalid_token',
			error_description:
				'The access token is expired or otherwise invalid. Per RFC 6750 the endpoint returns 401 with a WWW-Authenticate: Bearer error="invalid_token" challenge.',
			status: 401,
		},
		defends:
			"Requiring a valid, unexpired bearer token means a leaked-then-expired or tampered token can no longer read the user's claims — the token's lifetime and integrity are enforced on every call.",
		severity: 'token-forgery',
	},
	{
		id: 'id-token-instead',
		label: 'Send the id_token instead of the access token',
		stage: 'userinfo',
		what: 'Presents the id_token as the Bearer credential in place of the access token.',
		expectedError: {
			error: 'invalid_token',
			error_description:
				'The id_token is not an access token: it is an authentication assertion for the client, not a credential the UserInfo endpoint accepts. PingOne rejects it with 401 invalid_token.',
			status: 401,
		},
		defends:
			'Keeping the two token types distinct stops the id_token — which is exposed to the client and often logged — from being replayable as an API credential.',
		severity: 'token-confusion',
		simulateOnly: true,
	},
	{
		id: 'missing-openid-scope',
		label: 'Use a token that never had the openid scope',
		stage: 'userinfo',
		what: 'Calls UserInfo with an access token whose original grant did not include the openid scope.',
		expectedError: {
			error: 'insufficient_scope',
			error_description:
				'Without the openid scope the token carries no OIDC user context, so UserInfo has no subject to describe — the request is refused (or returns no usable claims).',
			status: 403,
		},
		defends:
			"Gating UserInfo behind the openid scope ensures only tokens explicitly granted user-identity access can read a person's claims — a plain resource token or a Client Credentials token cannot.",
		severity: 'scope-escalation',
		simulateOnly: true,
	},
];

/** Internal mutation entry. A missing `mutate` (or `simulateOnly`) leaves params unchanged. */
interface Mutator {
	stage: SabotageStage;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

/** Corrupt an access token into a plausible-but-invalid value the endpoint will reject. */
function corruptToken(current: unknown): string {
	if (typeof current === 'string' && current.length > 0) {
		return `tampered-${current.slice(0, Math.max(1, current.length - 4))}`;
	}
	return 'tampered-invalid-access-token';
}

// Mutation registry, keyed by scenario id, kept in lock-step with the scenarios above.
const MUTATORS: Record<string, Mutator> = {
	// Corrupt the access token so the endpoint returns a genuine 401 invalid_token.
	'expired-access-token': {
		stage: 'userinfo',
		mutate: (p) => ({ ...p, accessToken: corruptToken(p.accessToken) }),
	},
	// These depend on how the token was originally issued, so the flow shows the
	// expected error without dispatching a mutated request.
	'id-token-instead': { stage: 'userinfo', simulateOnly: true },
	'missing-openid-scope': { stage: 'userinfo', simulateOnly: true },
};

/**
 * Apply a selected scenario's mutation to the outgoing UserInfo params for `stage`.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id → params unchanged.
 * - Id whose scenario targets a different stage → params unchanged.
 * - `simulateOnly` scenarios → params unchanged (the flow shows the error without a call).
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyUserInfoSabotage<T extends Record<string, unknown>>(
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
