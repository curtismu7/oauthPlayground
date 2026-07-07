// src/flows2/services/redirectlessService.ts
//
// Redirectless / pi.flow grant as a flows2 service.
// real mode  → POST the BFF /api/pingone/redirectless/authorize to get a flow object,
//              POST /api/pingone/flows/check-username-password to submit credentials,
//              then poll /api/pingone/redirectless/poll until the flow COMPLETED.
// mock mode  → deterministic offline simulation: start returns USERNAME_PASSWORD_REQUIRED,
//              submitCredentials immediately returns COMPLETED with fake tokens, poll
//              echoes COMPLETED so the caller's poll loop terminates on the first tick.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';
import { pingoneHost, toTokenResult } from './pingone';

// ─── Public types ────────────────────────────────────────────────────────────

/** Shape returned by startAuthorize — the initial pi.flow object from PingOne. */
export interface RedirectlessFlowState {
	/** PingOne flow id (used to build the flows/{flowId} URL). */
	flowId: string;
	/** Human-readable status, e.g. USERNAME_PASSWORD_REQUIRED, COMPLETED. */
	status: string;
	/** BFF server-side session id (cookie jar key). Must be forwarded on subsequent calls. */
	sessionId?: string;
	/** Resume URL for the poll step. */
	resumeUrl?: string;
	/** Raw PingOne response. */
	raw: Record<string, unknown>;
}

/** Possible poll outcomes (mirrors device-flow PollStatus shape). */
export type RedirectlessPollStatus = 'pending' | 'complete' | 'failed' | 'error';

/** Shape returned by poll — either still in-progress or tokens arrived. */
export interface RedirectlessPollResult {
	status: RedirectlessPollStatus;
	token?: TokenResult;
	error?: { error: string; error_description?: string };
	raw: Record<string, unknown>;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

// us/na are not distinct PingOne regions — map them to 'com' before calling pingoneHost.
function resolveRegion(region: string): string {
	const r = region.toLowerCase();
	if (r === 'us' || r === 'na') return 'com';
	return r;
}

function classifyPollData(data: Record<string, unknown>): RedirectlessPollResult {
	if (typeof data.status !== 'string' || !data.status) {
		throw {
			error: 'invalid_poll_response',
			error_description: 'Poll response missing or invalid status field.'
		};
	}
	const status = data.status.toUpperCase();

	if (status === 'COMPLETED') {
		// The pi.flow COMPLETED payload nests tokens under authorizeResponse; fall back to
		// top-level for flows that embed them directly.
		const tokenSource = (data.authorizeResponse && typeof data.authorizeResponse === 'object')
			? (data.authorizeResponse as Record<string, unknown>)
			: data;
		return { status: 'complete', token: toTokenResult(tokenSource), raw: data };
	}
	if (status === 'FAILED' || status === 'ERROR') {
		return {
			status: 'failed',
			error: {
				error: typeof data.error === 'string' ? data.error : 'flow_failed',
				error_description: typeof data.error_description === 'string'
					? data.error_description
					: undefined,
			},
			raw: data,
		};
	}
	// Still in progress (PENDING, INITIALIZED, etc.)
	return { status: 'pending', raw: data };
}

/** Build a deterministic fake JWT fragment for mock tokens. */
function makeMockToken(creds: FlowCredentials): string {
	const now = Math.floor(Date.now() / 1000);
	const claims = {
		sub: 'mock-user-redirectless',
		aud: creds.clientId,
		scope: creds.scope || 'openid profile',
		iat: now,
		exp: now + 3600,
		iss: `https://auth.pingone.${creds.region}/${creds.environmentId}/as`,
		token_use: 'mock',
	};
	return `${btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${btoa(JSON.stringify(claims))}.`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const redirectlessService = {
	/**
	 * Step 1 — start the pi.flow authorization.
	 * real: POST /api/pingone/redirectless/authorize
	 * mock: returns a synthetic flow state with status USERNAME_PASSWORD_REQUIRED.
	 */
	async startAuthorize(creds: FlowCredentials, mode: FlowMode): Promise<RedirectlessFlowState> {
		if (mode === 'mock') {
			const raw = {
				id: 'mock-flow-id-a1b2c3d4',
				status: 'USERNAME_PASSWORD_REQUIRED',
				_sessionId: 'mock-session-id-x9y8z7',
				resumeUrl: 'https://auth.pingone.mock/resume?flowId=mock-flow-id-a1b2c3d4',
				_mock: true,
			};
			return {
				flowId: raw.id,
				status: raw.status,
				sessionId: raw._sessionId,
				resumeUrl: raw.resumeUrl,
				raw,
			};
		}

		const res = await fetch('/api/pingone/redirectless/authorize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environmentId: creds.environmentId,
				clientId: creds.clientId,
				...(creds.clientSecret ? { clientSecret: creds.clientSecret } : {}),
				scopes: creds.scope?.trim() || 'openid',
				region: creds.region,
			}),
		});
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			throw {
				error: 'invalid_response',
				error_description: `Authorization failed (HTTP ${res.status}) — response was not valid JSON`,
				status: res.status,
			};
		}
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'redirectless_authorize_failed',
				error_description:
					(data.error_description as string) ||
					`Authorization failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		const flowId = String(data.id ?? data.flowId ?? '');
		if (!flowId) {
			throw {
				error: 'missing_flow_id',
				error_description: 'PingOne did not return a flow id.',
			};
		}
		return {
			flowId,
			status: String(data.status ?? ''),
			sessionId: typeof data._sessionId === 'string' ? data._sessionId : undefined,
			resumeUrl: typeof data.resumeUrl === 'string' ? data.resumeUrl : undefined,
			raw: data,
		};
	},

	/**
	 * Step 2 — submit username + password to advance the flow.
	 * real: POST /api/pingone/flows/check-username-password
	 * mock: immediately returns a synthetic COMPLETED flow with tokens.
	 */
	async submitCredentials(
		creds: FlowCredentials,
		flowState: RedirectlessFlowState,
		username: string,
		password: string,
		mode: FlowMode
	): Promise<RedirectlessFlowState> {
		if (mode === 'mock') {
			const fake = makeMockToken(creds);
			const raw = {
				id: flowState.flowId,
				status: 'COMPLETED',
				access_token: fake,
				id_token: fake,
				refresh_token: 'mock-refresh-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: creds.scope || 'openid profile',
				_mock: true,
			};
			return {
				flowId: flowState.flowId,
				status: 'COMPLETED',
				sessionId: flowState.sessionId,
				resumeUrl: flowState.resumeUrl,
				raw,
			};
		}

		const domain = pingoneHost(resolveRegion(creds.region));
		const flowUrl = `https://${domain}/${creds.environmentId}/flows/${flowState.flowId}`;

		const res = await fetch('/api/pingone/flows/check-username-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				flowUrl,
				username,
				password,
				...(flowState.sessionId ? { sessionId: flowState.sessionId } : {}),
				...(creds.clientId ? { clientId: creds.clientId } : {}),
				...(creds.clientSecret ? { clientSecret: creds.clientSecret } : {}),
			}),
		});
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			throw {
				error: 'invalid_response',
				error_description: `Credentials check failed (HTTP ${res.status}) — response was not valid JSON`,
				status: res.status,
			};
		}
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'credentials_check_failed',
				error_description:
					(data.error_description as string) ||
					`Credential submission failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		return {
			flowId: flowState.flowId,
			status: String(data.status ?? ''),
			sessionId: typeof data._sessionId === 'string' ? data._sessionId : flowState.sessionId,
			resumeUrl: typeof data.resumeUrl === 'string' ? data.resumeUrl : flowState.resumeUrl,
			raw: data,
		};
	},

	/**
	 * Step 3 — poll once for flow completion.
	 * real: POST /api/pingone/redirectless/poll with the resumeUrl
	 * mock: always returns complete with the tokens already embedded in flowState.raw
	 */
	async poll(
		creds: FlowCredentials,
		flowState: RedirectlessFlowState,
		mode: FlowMode
	): Promise<RedirectlessPollResult> {
		if (mode === 'mock') {
			// After submitCredentials the mock flowState.raw already carries tokens.
			return { status: 'complete', token: toTokenResult(flowState.raw), raw: flowState.raw };
		}

		if (!flowState.resumeUrl) {
			throw {
				error: 'missing_resume_url',
				error_description: 'No resumeUrl available for polling.',
				status: 400,
			};
		}

		const res = await fetch('/api/pingone/redirectless/poll', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resumeUrl: flowState.resumeUrl }),
		});
		if (!res.ok) {
			return { status: 'error' as const, error: { error: 'network_error', error_description: `Poll failed (HTTP ${res.status})` } };
		}
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			return { status: 'error' as const, error: { error: 'invalid_response', error_description: 'Poll response was not valid JSON' } };
		}
		return classifyPollData(data);
	},
};
