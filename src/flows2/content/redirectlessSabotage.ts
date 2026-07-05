// src/flows2/content/redirectlessSabotage.ts
//
// Break-it Lab scenarios for the Redirectless / pi.flow grant. Each scenario corrupts one
// thing about how the app drives the PingOne Flow API ('flow' stage) and describes what the
// Flow API does in response — teaching the flow state machine. Because pi.flow is a
// stateful, server-driven API, most of these are best shown as simulateOnly (they depend on
// real flow state that a single mutated call can't reproduce cleanly).
//
// The mutation logic lives locally in applyRedirectlessSabotage below (mirrors
// applyAuthzCodeSabotage in ../framework/sabotage.ts).

import type { SabotageScenario } from '../framework/sabotage';

export const redirectlessSabotageScenarios: SabotageScenario[] = [
	{
		id: 'wrong-flow-id',
		label: 'Submit against a wrong / expired flow id',
		stage: 'flow',
		what: 'Sends the credential step to a flowId that does not match the flow PingOne started (mistyped, stale, or already-completed).',
		expectedError: {
			error: 'invalid_request',
			error_description:
				'The flowId is unknown or no longer active, so the Flow API cannot advance it. The app must start a fresh flow rather than resubmitting against a dead flowId.',
			status: 400,
		},
		defends:
			'Binding every step to a live, server-issued flowId means an app cannot smuggle credentials into an arbitrary or already-finished flow — the state machine is anchored to a real session.',
		severity: 'flow-integrity',
	},
	{
		id: 'skip-flow-step',
		label: 'Skip a required flow step',
		stage: 'flow',
		what: 'Tries to jump ahead (e.g. request tokens) while the flow status still says a step like USERNAME_PASSWORD_REQUIRED is outstanding.',
		expectedError: {
			error: 'flow_step_required',
			error_description:
				'Not a hard failure — the Flow API simply returns the same pending step again. The flow will not advance until the required action is completed in order.',
		},
		defends:
			'A server-enforced state machine means the app cannot bypass authentication or policy steps; the flow only progresses when each required step is satisfied in sequence.',
		severity: 'flow-integrity',
		simulateOnly: true,
	},
	{
		id: 'expired-flow',
		label: 'Resume an expired flow',
		stage: 'flow',
		what: 'Submits a step after the flow object’s lifetime has elapsed.',
		expectedError: {
			error: 'flow_expired',
			error_description:
				'The flow timed out before it reached COMPLETED. This is terminal — the app must start a new flow; an expired flow cannot be resumed.',
			status: 400,
		},
		defends:
			'Bounding a flow’s lifetime limits how long a half-finished login session (and any partial state or captured input) remains resumable.',
		severity: 'expiry',
		simulateOnly: true,
	},
	{
		id: 'tamper-response-mode',
		label: 'Drop response_mode=pi.flow',
		stage: 'flow',
		what: 'Starts authorization without response_mode=pi.flow, so PingOne behaves as a standard redirect flow instead of returning a JSON flow object.',
		expectedError: {
			error: 'unexpected_redirect',
			error_description:
				'Without pi.flow, PingOne falls back to a spec redirect-based response — the app receives a 302 to the hosted login page instead of a JSON flow object, and the redirectless code path never engages.',
		},
		defends:
			'response_mode=pi.flow is what selects the redirectless, API-driven ceremony; drop it and you are back on the standard redirect model, which is the safe default for anything that is not a trusted first-party app.',
		severity: 'flow-integrity',
		simulateOnly: true,
	},
];

// ─── Local mutation helper ─────────────────────────────────────────────────────
//
// Mirrors applyAuthzCodeSabotage in ../framework/sabotage.ts, scoped to this flow.
// Only wrong-flow-id is reproducible with a single live call (corrupt the flowId before
// submitting the credential step); the state-machine and expiry scenarios are simulateOnly.

interface RedirectlessMutator {
	stage: string;
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

/** Corrupt a flowId into a plausible-but-wrong value that PingOne won't recognize. */
function corruptFlowId(current: unknown): string {
	if (typeof current === 'string' && current.length > 0) {
		return `wrong-${current.slice(0, Math.max(1, current.length - 4))}`;
	}
	return `wrong-${safeUuid()}`;
}

const REDIRECTLESS_MUTATORS: Record<string, RedirectlessMutator> = {
	// Submit the credential step against a flowId PingOne never issued.
	'wrong-flow-id': {
		stage: 'flow',
		mutate: (p) => ({ ...p, flowId: corruptFlowId(p.flowId) }),
	},
	// Server-driven states — a single mutated request can't reproduce them cleanly.
	'skip-flow-step': { stage: 'flow', simulateOnly: true },
	'expired-flow': { stage: 'flow', simulateOnly: true },
	'tamper-response-mode': { stage: 'flow', simulateOnly: true },
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
export function applyRedirectlessSabotage<T extends Record<string, unknown>>(
	scenarioId: string | null,
	stage: string,
	params: T
): T {
	if (!scenarioId) return params;
	const entry = REDIRECTLESS_MUTATORS[scenarioId];
	if (!entry) return params;
	if (entry.stage !== stage) return params;
	if (entry.simulateOnly || !entry.mutate) return params;
	try {
		return entry.mutate(params) as T;
	} catch {
		return params;
	}
}
