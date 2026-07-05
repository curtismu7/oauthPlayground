// src/flows2/content/clientCredentialsSabotage.ts
//
// Break-it Lab scenarios for the Client Credentials grant (RFC 6749 §4.4). Each scenario
// names a single parameter to sabotage on the token request, the error a real PingOne
// token endpoint returns (RFC 6749 §5.2), and the property that failure proves.
//
// This file also owns a LOCAL, pure sabotage helper with its own MUTATORS registry —
// mirroring applyAuthzCodeSabotage in ../framework/sabotage.ts. The flow calls
// applyClientCredentialsSabotage(scenarioId, 'token', params) right before the service
// call. The only live stage is 'token'.

import type { SabotageScenario, SabotageStage } from '../framework/sabotage';

export const clientCredentialsSabotageScenarios: SabotageScenario[] = [
	{
		id: 'wrong-secret',
		label: 'Present the wrong client_secret',
		stage: 'token',
		what: 'Authenticates at the token endpoint with a client_secret that does not match the one registered for the application.',
		expectedError: {
			error: 'invalid_client',
			error_description:
				'Client authentication failed: the client_secret does not match the registered application. PingOne rejects the request with HTTP 401 before issuing a token.',
			status: 401,
		},
		defends:
			'Client authentication is the only thing standing between an attacker and an application token in this grant — there is no user, no PKCE, no redirect. A wrong secret proves the token endpoint verifies who the client is.',
		severity: 'client-impersonation',
	},
	{
		id: 'unauthorized-scope',
		label: 'Request a scope the app was not granted',
		stage: 'token',
		what: 'Adds a platform scope (e.g. p1:read:allAdmin) that the Worker app has not been assigned via its roles.',
		expectedError: {
			error: 'invalid_scope',
			error_description:
				'The requested scope is not permitted for this application. Client-credentials tokens can only carry scopes mapped to the roles/resources granted to the app.',
			status: 400,
		},
		defends:
			'Binding requestable scopes to the roles assigned to the app enforces least privilege — a compromised or over-eager client cannot mint a token for access it was never granted.',
		severity: 'privilege-escalation',
	},
	{
		id: 'wrong-grant-type',
		label: 'Send an unsupported grant_type',
		stage: 'token',
		what: 'Posts grant_type=client_credential (a typo) or a grant the application has not enabled, instead of the exact client_credentials value.',
		expectedError: {
			error: 'unsupported_grant_type',
			error_description:
				'The authorization server does not support, or the application has not enabled, this grant type. Only exactly grant_type=client_credentials is accepted here.',
			status: 400,
		},
		defends:
			'The token endpoint only honors grant types the application is explicitly configured for, so an app cannot be coerced into a flow it was never meant to support.',
		severity: 'misconfiguration',
		// The service hardcodes grant_type=client_credentials in its request body, so this
		// cannot be reproduced by mutating the params of a single live call.
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

/** Corrupt a secret string into a plausible-but-wrong value. */
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
	// Corrupt the client_secret so token-endpoint client authentication fails.
	'wrong-secret': {
		stage: 'token',
		mutate: (p) =>
			withCredentials(p, (c) => ({ ...c, clientSecret: corruptString(c.clientSecret) })),
	},

	// Add a scope the app was never granted; PingOne rejects with invalid_scope.
	'unauthorized-scope': {
		stage: 'token',
		mutate: (p) => withCredentials(p, (c) => appendScope(c, 'p1:read:allAdmin')),
	},

	// grant_type is fixed inside the service body — can't be injected via params.
	'wrong-grant-type': {
		stage: 'token',
		simulateOnly: true,
	},
};

/**
 * Apply a selected scenario's mutation to the outgoing token-request params.
 *
 * - `scenarioId === null` → run it correctly → params unchanged.
 * - Unknown id → params unchanged.
 * - Id whose scenario targets a different stage → params unchanged.
 * - `simulateOnly` scenarios → params unchanged (the flow shows the error without a call).
 *
 * Never throws; returns the identical reference when no mutation applies.
 */
export function applyClientCredentialsSabotage<T extends Record<string, unknown>>(
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
