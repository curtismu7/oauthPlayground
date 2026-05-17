// src/utils/stateValidationGate.ts
/**
 * State Validation Gate
 *
 * Thin integration layer between the OAuth callback and StateValidationService.
 *
 * Rollout safety: gated by VITE_ENFORCE_STATE_VALIDATION.
 * - default (flag unset / not 'true'): WARN mode — validate, log, but ALLOW.
 *   Un-migrated flows (no stored state) keep working; mismatches are logged.
 * - 'true': ENFORCE mode — invalid/mismatched state hard-fails the callback.
 *
 * flowId correlation reuses the mechanism flows already use: the value written
 * to sessionStorage 'active_oauth_flow', falling back to flowContext.flow.
 */

import { StateValidationService } from '../services/stateValidationService';
import { logger } from './logger';

export interface GateResult {
	/** true = proceed with the callback; false = caller must short-circuit to an error */
	ok: boolean;
	/** human-readable reason (set when a problem was detected, even if allowed) */
	reason?: string;
	/** true when enforcement is active and the failure is being enforced */
	enforced: boolean;
}

/**
 * Resolve the flowId used to key state storage.
 * Reuses the existing active_oauth_flow / flowContext correlation; returns
 * null when no flow identity can be recovered.
 */
export function resolveFlowId(): string | null {
	try {
		const active = sessionStorage.getItem('active_oauth_flow');
		if (active) return active;

		const rawContext = sessionStorage.getItem('flowContext');
		if (rawContext) {
			const ctx = JSON.parse(rawContext) as { flow?: unknown };
			if (ctx && typeof ctx.flow === 'string' && ctx.flow.length > 0) {
				return ctx.flow;
			}
		}
	} catch (error) {
		logger.warn('StateGate', 'Failed to resolve flowId', error);
	}
	return null;
}

/** Whether state-validation failures should hard-fail the callback. */
export function isEnforcing(): boolean {
	return import.meta.env.VITE_ENFORCE_STATE_VALIDATION === 'true';
}

/**
 * Gate the callback on state validation.
 *
 * Never throws. In WARN mode always returns ok:true (problems are logged).
 * In ENFORCE mode returns ok:false on a real validation failure.
 */
export function gateState(state: string | null): GateResult {
	const enforcing = isEnforcing();

	if (!state) {
		logger.warn('StateGate', 'No state parameter in callback URL');
		return enforcing
			? { ok: false, reason: 'Missing state parameter', enforced: true }
			: { ok: true, reason: 'Missing state parameter', enforced: false };
	}

	const flowId = resolveFlowId();
	if (!flowId) {
		// No flow identity — flow predates the new generator. Allow in WARN.
		logger.warn('StateGate', 'No flowId resolvable; skipping state validation', {
			mode: enforcing ? 'enforce' : 'warn',
		});
		return enforcing
			? { ok: false, reason: 'No flow identity for state validation', enforced: true }
			: { ok: true, reason: 'No flow identity (un-migrated flow)', enforced: false };
	}

	const result = StateValidationService.validateState(flowId, state);
	if (result.valid) {
		return { ok: true, enforced: false };
	}

	const reason = result.error || 'State validation failed';

	// "State not found" means this flow has not adopted generateState yet.
	// In WARN mode that must not break the flow.
	if (!enforcing) {
		logger.error('StateGate', 'State validation failed (allowed: WARN mode)', {
			flowId,
			reason,
		});
		return { ok: true, reason, enforced: false };
	}

	logger.error('StateGate', 'State validation failed (blocked: ENFORCE mode)', {
		flowId,
		reason,
	});
	return { ok: false, reason, enforced: true };
}
