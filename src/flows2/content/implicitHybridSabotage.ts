// src/flows2/content/implicitHybridSabotage.ts
//
// Break-it Lab scenarios for the Implicit + Hybrid flow. Each scenario sabotages one
// parameter of the authorization request (the only request the implicit sub-mode makes)
// and names the failure a real client or PingOne authorization endpoint would surface.
// Mirrors the shape of authorizationCodeSabotage.ts, but the mutation registry is LOCAL
// to this file via applyImplicitHybridSabotage — the flow calls that helper directly.

import type { SabotageScenario } from '../framework/sabotage';

export const implicitHybridSabotageScenarios: SabotageScenario[] = [
	{
		id: 'tamper-state',
		label: 'Tamper the state parameter',
		stage: 'authorize',
		what: 'Sends a different state on the authorization request than the one stored in the session before the redirect.',
		expectedError: {
			error: 'state_mismatch',
			error_description:
				'The state echoed back in the fragment does not match the value stored before the redirect. The client rejects the response as a possible CSRF / forgery.',
		},
		defends:
			"state binds the authorization response to the session that started it. With no code exchange to anchor the flow, this front-channel check is the implicit grant's CSRF defense — a forged callback is rejected on return.",
		severity: 'csrf',
	},
	{
		id: 'omit-nonce',
		label: 'Omit the nonce on an OIDC request',
		stage: 'authorize',
		what: 'Drops the nonce from an OIDC implicit/hybrid authorization request that returns an id_token directly.',
		expectedError: {
			error: 'unverifiable_id_token',
			error_description:
				'Without a nonce there is no value bound into the id_token to compare on return, so the client cannot detect a replayed id_token. OIDC REQUIRES nonce for implicit/hybrid id_tokens.',
		},
		defends:
			'nonce is the replay defense for an id_token issued at the authorization endpoint. Because there is no back-channel code exchange to tie the token to this request, omitting nonce removes the only check that the id_token is fresh and meant for this session.',
		severity: 'replay',
		simulateOnly: true,
	},
	{
		id: 'unsupported-response-type',
		label: 'Request response_type=token on a code+PKCE (2.1) client',
		stage: 'authorize',
		what: 'Requests the implicit response_type=token for an application that is only enabled for Authorization Code + PKCE (a public / OAuth 2.1 client).',
		expectedError: {
			error: 'unsupported_response_type',
			error_description:
				'The application is not enabled for the implicit grant, so PingOne rejects response_type=token before any token is issued. Enable the grant on the app or use response_type=code with PKCE instead.',
			status: 400,
		},
		defends:
			'Locking each application to an explicit set of grant/response types means a client intended for code + PKCE cannot be coerced into the weaker, token-leaking implicit response — the request is refused up front.',
		severity: 'misconfiguration',
		simulateOnly: true,
	},
];

/**
 * Local mutation registry for the Implicit + Hybrid flow, mirroring
 * applyAuthzCodeSabotage in ../framework/sabotage.ts but kept in this content module
 * because the mutations are flow-specific.
 *
 * Params shape for the 'authorize' stage: { state: string; nonce: string }.
 *
 * Semantics (never throws; returns the identical reference when no mutation applies):
 * - scenarioId === null      → run it correctly → params unchanged.
 * - Unknown id               → params unchanged.
 * - Scenario for a different stage → params unchanged.
 * - simulateOnly scenarios   → params unchanged (the flow shows the error without a call).
 */
interface ImplicitHybridMutator {
	stage: string;
	simulateOnly?: boolean;
	mutate?: (params: Record<string, unknown>) => Record<string, unknown>;
}

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

function differentUuid(current: unknown): string {
	let next = safeUuid();
	if (typeof current === 'string' && next === current) next = `${safeUuid()}-x`;
	return next;
}

const MUTATORS: Record<string, ImplicitHybridMutator> = {
	// Replace the state sent on the authorize request. The AS echoes it back verbatim in
	// the fragment; the client's stored value no longer matches, so it rejects the response.
	'tamper-state': {
		stage: 'authorize',
		mutate: (p) => ({ ...p, state: differentUuid(p.state) }),
	},
	// Omitting the nonce cannot be reproduced as a live rejection (PingOne will still return
	// an id_token) — the failure is a *client-side* replay gap, so this is simulate-only.
	'omit-nonce': {
		stage: 'authorize',
		simulateOnly: true,
	},
	// A client not enabled for the implicit grant can't be driven into it from this UI, so
	// the unsupported_response_type outcome is shown without dispatching a mutated request.
	'unsupported-response-type': {
		stage: 'authorize',
		simulateOnly: true,
	},
};

export function applyImplicitHybridSabotage<T extends Record<string, unknown>>(
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
