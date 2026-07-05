// src/flows2/framework/sabotage.ts
//
// "Break-it Lab" core: types + a pure application helper. The idea is that a learner
// can deliberately sabotage one security parameter of an OAuth/OIDC request, run the
// step, and watch the authorization server reject it — proving what each check defends.
//
// This module is framework-level and dependency-free: the flow calls
// `applyAuthzCodeSabotage(scenarioId, stage, params)` right before dispatching a request
// and never needs to know how any individual scenario mutates the params. Mutation logic
// lives here, keyed by scenario id, so content and UI stay declarative.

// A flow's request stage that a scenario can corrupt. Flow-agnostic: the Authorization
// Code flow uses 'authorize' | 'exchange', but other flows define their own stages
// (e.g. 'introspect', 'poll', 'token'), so this is an open string.
export type SabotageStage = string;

// Attack class a scenario illustrates. Open string so each flow can name its own
// (the auth-code set is csrf | code-interception | token-forgery | replay | confused-deputy).
export type SabotageSeverity = string;

export interface SabotageScenario {
	/** Stable id — also the key the mutation registry below looks up. */
	id: string;
	/** Short imperative label, e.g. "Tamper the state parameter". */
	label: string;
	/** Which outgoing request this scenario corrupts. */
	stage: SabotageStage;
	/** One sentence: what gets changed. */
	what: string;
	/** The RFC 6749 §5.2 / §4.1.2.1-shaped error the server should return. */
	expectedError: { error: string; error_description: string; status?: number };
	/** One sentence: the security property this failure proves. */
	defends: string;
	/** Attack class this scenario illustrates. */
	severity: SabotageSeverity;
	/**
	 * True when the failure can't be reproduced by a single live request (e.g. code
	 * replay needs a prior successful exchange). The flow shows `expectedError`
	 * without making a live call, and `applyAuthzCodeSabotage` leaves params untouched.
	 */
	simulateOnly?: boolean;
}

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
		/* fall through to Math.random fallback */
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/** Return a UUID guaranteed to differ from `current` (so a tamper is always observable). */
function differentUuid(current: unknown): string {
	let next = safeUuid();
	if (typeof current === 'string' && next === current) next = `${safeUuid()}-x`;
	return next;
}

/** Corrupt a PKCE verifier / secret string into a plausible-but-wrong value. */
function corruptString(current: unknown): string {
	if (typeof current === 'string' && current.length > 0) {
		return `tampered-${current.slice(0, Math.max(1, current.length - 4))}`;
	}
	return `tampered-${safeUuid()}`;
}

/** Point a redirect_uri at an attacker-controlled host (confused-deputy). */
function tamperRedirectUri(_current: unknown): string {
	return 'https://attacker.example/callback';
}

// Mutation registry, keyed by scenario id. Kept in lock-step with the scenario content
// in ../content/authorizationCodeSabotage.ts. Each mutator returns a shallow-copied,
// mutated params object; none throws.
const MUTATORS: Record<string, Mutator> = {
	// Replace the state you send on the authorize request with a fresh, unrelated value.
	// The server echoes it back verbatim; the client's stored value no longer matches.
	'tamper-state': {
		stage: 'authorize',
		mutate: (p) => ({ ...p, state: differentUuid(p.state) }),
	},

	// Strip PKCE from the authorization request. On a public / OAuth 2.1 client where PKCE
	// is enforced, the server rejects the request outright.
	'drop-pkce': {
		stage: 'authorize',
		mutate: (p) => {
			const next = { ...p };
			delete next.codeChallenge;
			delete next.codeVerifier;
			return next;
		},
	},

	// Present a code_verifier that doesn't hash to the code_challenge sent at authorize.
	'wrong-verifier': {
		stage: 'exchange',
		mutate: (p) => ({ ...p, codeVerifier: corruptString(p.codeVerifier) }),
	},

	// Redeem the code against a redirect_uri that doesn't match the one used at authorize.
	'tamper-redirect-uri': {
		stage: 'exchange',
		mutate: (p) => ({ ...p, redirectUri: tamperRedirectUri(p.redirectUri) }),
	},

	// Replay an already-exchanged code. Can't be reproduced with a single live call, so
	// the flow shows the expected error without dispatching a mutated request.
	'reuse-code': {
		stage: 'exchange',
		simulateOnly: true,
	},
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
export function applyAuthzCodeSabotage<T extends Record<string, unknown>>(
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
