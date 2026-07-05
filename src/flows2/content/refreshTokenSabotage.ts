// src/flows2/content/refreshTokenSabotage.ts
//
// Break-it Lab scenarios for the Refresh Token grant (RFC 6749 §6). Each scenario names a
// single parameter to sabotage on the refresh request, the error a real PingOne token
// endpoint returns (RFC 6749 §5.2), and the property that failure proves.
//
// This file also owns a LOCAL, pure sabotage helper with its own MUTATORS registry —
// mirroring applyAuthzCodeSabotage in ../framework/sabotage.ts. The flow calls
// applyRefreshTokenSabotage(scenarioId, 'refresh', params) right before the service call.
// The only live stage is 'refresh'.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';

export const refreshTokenSabotageScenarios: SabotageScenario[] = [
	{
		id: 'tamper-refresh-token',
		label: 'Tamper the refresh_token',
		stage: 'refresh',
		what: 'Submits a refresh_token whose value has been altered (or has already expired / been rotated away) instead of the exact string the server issued.',
		expectedError: {
			error: 'invalid_grant',
			error_description:
				'The refresh token is invalid, expired, revoked, or does not match. PingOne rejects the exchange with HTTP 400 and issues no new tokens.',
			status: 400,
		},
		defends:
			'The refresh_token is a bearer credential — the server accepts it only if it exactly matches an outstanding, unexpired grant, so a tampered or stale token cannot mint new access.',
		severity: 'token-forgery',
	},
	{
		id: 'wrong-client-auth',
		label: 'Present the wrong client_secret',
		stage: 'refresh',
		what: 'Authenticates the refresh request with a client_secret that does not match the one registered for the application.',
		expectedError: {
			error: 'invalid_client',
			error_description:
				'Client authentication failed: the client_secret does not match the registered application. PingOne rejects the request with HTTP 401 before exchanging the token.',
			status: 401,
		},
		defends:
			'A refresh_token is bound to the client it was issued to; requiring the client to re-authenticate on every refresh stops a stolen token from being redeemed by a different party.',
		severity: 'client-impersonation',
	},
	{
		id: 'broaden-scope',
		label: 'Request a broader scope than granted',
		stage: 'refresh',
		what: 'Adds a scope to the refresh request that was not part of the original grant, attempting to escalate the new access token beyond what the user consented to.',
		expectedError: {
			error: 'invalid_scope',
			error_description:
				'The requested scope exceeds the scope originally granted. A refresh may only preserve or narrow scope, never widen it, so PingOne rejects the request.',
			status: 400,
		},
		defends:
			'Refreshing can only preserve or narrow scope, so a client (or attacker holding the token) cannot use the refresh grant to silently acquire access the user never approved.',
		severity: 'privilege-escalation',
	},
	{
		id: 'replay-rotated-token',
		label: 'Replay a rotated-away refresh_token',
		stage: 'refresh',
		what: 'Presents an old refresh_token that has already been rotated out by a prior successful refresh.',
		expectedError: {
			error: 'invalid_grant',
			error_description:
				'The refresh token has already been used and rotated. PingOne treats the reuse as a compromise signal and can revoke the entire token family for the grant.',
			status: 400,
		},
		defends:
			'Reuse detection means a stolen refresh_token is useful for at most one exchange — replaying the rotated-away token trips automatic-reuse-revocation and kills the whole grant.',
		severity: 'replay',
		// Reuse can't be reproduced by a single live request — it needs a prior successful
		// exchange to have rotated the token. Shown as a predicted error only.
		simulateOnly: true,
	},
];

// ---------------------------------------------------------------------------
// Local pure sabotage helper (mirrors applyAuthzCodeSabotage in framework/sabotage.ts).
// ---------------------------------------------------------------------------

/** Internal mutation entry. A missing `mutate` (or `simulateOnly`) leaves params unchanged. */
interface Mutator {
	stage: SabotageStage;
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
		/* fall through */
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/** Corrupt a token / secret string into a plausible-but-wrong value. */
function corruptString(current: unknown): string {
	if (typeof current === 'string' && current.length > 0) {
		return `tampered-${current.slice(0, Math.max(1, current.length - 4))}`;
	}
	return `tampered-${safeUuid()}`;
}

/** Shallow-copy `params` and apply `fn` to its nested `credentials` object. */
function withCredentials(
	params: Record<string, unknown>,
	fn: (creds: Record<string, unknown>) => Record<string, unknown>
): Record<string, unknown> {
	const creds =
		params.credentials && typeof params.credentials === 'object'
			? (params.credentials as Record<string, unknown>)
			: {};
	return { ...params, credentials: fn({ ...creds }) };
}

/** Append a scope to the space-delimited scope string on a credentials object. */
function appendScope(creds: Record<string, unknown>, scope: string): Record<string, unknown> {
	const existing = typeof creds.scope === 'string' ? creds.scope.trim() : '';
	const next = existing ? `${existing} ${scope}` : scope;
	return { ...creds, scope: next };
}

// Mutation registry, keyed by scenario id. Kept in lock-step with the scenarios above.
const MUTATORS: Record<string, Mutator> = {
	// Corrupt the refresh_token so the server can't match it to an outstanding grant.
	'tamper-refresh-token': {
		stage: 'refresh',
		mutate: (p) => ({ ...p, refreshToken: corruptString(p.refreshToken) }),
	},

	// Corrupt the client_secret so token-endpoint client authentication fails.
	'wrong-client-auth': {
		stage: 'refresh',
		mutate: (p) =>
			withCredentials(p, (c) => ({ ...c, clientSecret: corruptString(c.clientSecret) })),
	},

	// Add a scope beyond the original grant; PingOne rejects with invalid_scope.
	'broaden-scope': {
		stage: 'refresh',
		mutate: (p) => withCredentials(p, (c) => appendScope(c, 'p1:read:allAdmin')),
	},

	// Reuse needs a prior successful rotation — can't be reproduced by one live call.
	'replay-rotated-token': {
		stage: 'refresh',
		simulateOnly: true,
	},
};

/**
 * Apply a selected scenario's mutation to the outgoing refresh-request params.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id → params unchanged.
 * - Id whose scenario targets a different stage → params unchanged.
 * - `simulateOnly` scenarios → params unchanged (the flow shows the error without a call).
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyRefreshTokenSabotage<T extends Record<string, unknown>>(
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
