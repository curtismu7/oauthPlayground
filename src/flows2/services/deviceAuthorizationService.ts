// src/flows2/services/deviceAuthorizationService.ts
//
// Device Authorization grant (RFC 8628) as a flows2 service.
// real mode → POST the BFF /api/device-authorization proxy for the device code, then poll
//             the /api/pingone/token proxy with grant_type=…:device_code until tokens arrive.
// mock mode → return a deterministic device code and simulate the authorization_pending →
//             complete progression offline, for teaching without a second device.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';

/** RFC 8628 §3.2 device authorization response (normalized). */
export interface DeviceCodeResult {
	deviceCode: string;
	userCode: string;
	verificationUri: string;
	verificationUriComplete?: string;
	expiresIn: number;
	interval: number;
	raw: Record<string, unknown>;
}

export type PollStatus = 'pending' | 'slow_down' | 'complete' | 'denied' | 'expired' | 'error';

export interface PollResult {
	status: PollStatus;
	token?: TokenResult;
	/** Present for terminal error states (denied / expired / error). */
	error?: { error: string; error_description?: string };
}

const DEVICE_CODE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

/** Mock progression: pending for the first two polls, then complete. */
const MOCK_PENDING_POLLS = 2;

function toTokenResult(data: Record<string, unknown>): TokenResult {
	return {
		accessToken: typeof data.access_token === 'string' ? data.access_token : undefined,
		tokenType: typeof data.token_type === 'string' ? data.token_type : undefined,
		expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
		scope: typeof data.scope === 'string' ? data.scope : undefined,
		idToken: typeof data.id_token === 'string' ? data.id_token : undefined,
		refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
		raw: data,
	};
}

/** Build the url-encoded device-code token poll body + client-auth headers. */
function buildPollBody(creds: FlowCredentials, deviceCode: string): {
	body: string;
	headers?: Record<string, string>;
} {
	const params = new URLSearchParams({ grant_type: DEVICE_CODE_GRANT, device_code: deviceCode });
	const method = creds.authMethod ?? 'client_secret_post';
	if (method === 'client_secret_basic' && creds.clientSecret) {
		const basic = btoa(`${creds.clientId}:${creds.clientSecret}`);
		params.set('client_id', creds.clientId); // PingOne still wants client_id in the body
		return { body: params.toString(), headers: { Authorization: `Basic ${basic}` } };
	}
	// client_secret_post (or public client with no secret)
	params.set('client_id', creds.clientId);
	if (creds.clientSecret) params.set('client_secret', creds.clientSecret);
	return { body: params.toString() };
}

/** Map a PingOne token-poll response to a terminal/non-terminal PollResult. */
function classifyPoll(data: Record<string, unknown>): PollResult {
	if (typeof data.access_token === 'string') {
		return { status: 'complete', token: toTokenResult(data) };
	}
	const err = typeof data.error === 'string' ? data.error : 'error';
	switch (err) {
		case 'authorization_pending':
			return { status: 'pending' };
		case 'slow_down':
			return { status: 'slow_down' };
		case 'expired_token':
			return { status: 'expired', error: { error: err, error_description: data.error_description as string } };
		case 'access_denied':
			return { status: 'denied', error: { error: err, error_description: data.error_description as string } };
		default:
			return { status: 'error', error: { error: err, error_description: data.error_description as string } };
	}
}

export const deviceAuthorizationService = {
	/** RFC 8628 §3.1 — request a device + user code. */
	async requestDeviceCode(credentials: FlowCredentials, mode: FlowMode): Promise<DeviceCodeResult> {
		if (mode === 'mock') {
			const raw = {
				device_code: 'mock-device-code-7f3a91c0',
				user_code: 'WDJB-MJHT',
				verification_uri: 'https://auth.pingone.com/mock/device',
				verification_uri_complete: 'https://auth.pingone.com/mock/device?user_code=WDJB-MJHT',
				expires_in: 600,
				interval: 5,
				_mock: true,
			};
			return {
				deviceCode: raw.device_code,
				userCode: raw.user_code,
				verificationUri: raw.verification_uri,
				verificationUriComplete: raw.verification_uri_complete,
				expiresIn: raw.expires_in,
				interval: raw.interval,
				raw,
			};
		}

		const res = await fetch('/api/device-authorization', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environment_id: credentials.environmentId,
				region: credentials.region,
				client_id: credentials.clientId,
				...(credentials.scope && credentials.scope.trim() ? { scope: credentials.scope.trim() } : {}),
			}),
		});
		let data: Record<string, unknown> = {};
		try {
			data = (await res.json()) as Record<string, unknown>;
		} catch {
			if (!res.ok) {
				throw {
					error: 'invalid_response',
					error_description: `Device authorization failed (HTTP ${res.status}) — response was not valid JSON`,
					status: res.status,
				};
			}
		}
		if (!res.ok || data.error) {
			throw {
				error: typeof data.error === 'string' ? data.error : 'device_authorization_failed',
				error_description:
					typeof data.error_description === 'string'
						? data.error_description
						: `Device authorization failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		return {
			deviceCode: String(data.device_code ?? ''),
			userCode: String(data.user_code ?? ''),
			verificationUri: String(data.verification_uri ?? ''),
			verificationUriComplete: typeof data.verification_uri_complete === 'string'
				? data.verification_uri_complete
				: undefined,
			expiresIn: typeof data.expires_in === 'number' ? data.expires_in : 600,
			interval: typeof data.interval === 'number' ? data.interval : 5,
			raw: data,
		};
	},

	/** RFC 8628 §3.4 — poll the token endpoint once. `attempt` (0-based) drives the mock progression. */
	async pollOnce(
		credentials: FlowCredentials,
		deviceCode: string,
		mode: FlowMode,
		attempt: number
	): Promise<PollResult> {
		if (mode === 'mock') {
			if (attempt < MOCK_PENDING_POLLS) return { status: 'pending' };
			const now = Math.floor(Date.now() / 1000);
			const claims = {
				sub: 'mock-user-1d2c3b4a',
				aud: credentials.clientId,
				scope: credentials.scope || 'openid profile',
				iat: now,
				exp: now + 3600,
				iss: `https://auth.pingone.${credentials.region}/${credentials.environmentId}/as`,
				token_use: 'mock',
			};
			const fake = `${btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${btoa(JSON.stringify(claims))}.`;
			return {
				status: 'complete',
				token: toTokenResult({
					access_token: fake,
					id_token: fake,
					refresh_token: 'mock-refresh-token',
					token_type: 'Bearer',
					expires_in: 3600,
					scope: claims.scope,
					_mock: true,
				}),
			};
		}

		const { body, headers } = buildPollBody(credentials, deviceCode);
		const res = await fetch('/api/pingone/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environment_id: credentials.environmentId,
				region: credentials.region,
				auth_method: credentials.authMethod ?? 'client_secret_post',
				body,
				...(headers ? { headers } : {}),
			}),
		});
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		return classifyPoll(data);
	},
};
