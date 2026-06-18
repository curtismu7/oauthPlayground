// src/flows2/services/ropcService.ts
//
// Resource Owner Password Credentials grant (RFC 6749 §4.3) as a flows2 service.
// real mode → POST /api/pingone/token via the BFF proxy with grant_type=password.
// mock mode → return a deterministic offline TokenResult. The password is NEVER
//             included in the returned object in either mode.
//
// ANTI-PATTERN: ROPC was removed in OAuth 2.1. The client directly handles the
// user's password, defeating MFA, consent screens, and federation. Only implement
// for legacy first-party migration. Prefer Authorization Code + PKCE.

import type { FlowCredentials, FlowError, FlowMode } from '../framework/types';
import { applyClientAuth, toTokenResult } from './pingone';

/** Build the url-encoded password-grant body + optional Basic auth header. */
function buildPasswordBody(
	creds: FlowCredentials,
	username: string,
	password: string
): { body: string; headers?: Record<string, string> } {
	const params = new URLSearchParams({
		grant_type: 'password',
		username,
		password,
	});
	if (creds.scope && creds.scope.trim()) {
		params.set('scope', creds.scope.trim());
	}
	return applyClientAuth(params, creds);
}

export const ropcService = {
	/**
	 * RFC 6749 §4.3 — exchange username + password for tokens.
	 *
	 * The password is sent to the authorization server (real mode) or discarded
	 * immediately (mock mode). It is never present on the returned TokenResult.
	 */
	async runPasswordGrant(
		creds: FlowCredentials,
		username: string,
		password: string,
		mode: FlowMode
	): Promise<TokenResult> {
		if (mode === 'mock') {
			const now = Math.floor(Date.now() / 1000);
			const claims = {
				sub: 'mock-user-ropc-4f2e8a1d',
				aud: creds.clientId,
				scope: creds.scope || 'openid profile',
				iat: now,
				exp: now + 3600,
				iss: `https://auth.pingone.${creds.region}/${creds.environmentId}/as`,
				token_use: 'mock',
			};
			const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
			const payload = btoa(JSON.stringify(claims));
			const fakeJwt = `${header}.${payload}.`;
			// password is intentionally excluded from the raw object and the result
			return toTokenResult({
				access_token: fakeJwt,
				id_token: fakeJwt,
				refresh_token: 'mock-refresh-ropc-9c3d',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: claims.scope,
				_mock: true,
			});
		}

		const { body, headers } = buildPasswordBody(creds, username, password);
		const res = await fetch('/api/pingone/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environment_id: creds.environmentId,
				region: creds.region,
				auth_method: creds.authMethod ?? 'client_secret_post',
				body,
				...(headers ? { headers } : {}),
			}),
		});
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok || data.error) {
			const err: FlowError = {
				error: (data.error as string) || 'password_grant_failed',
				error_description:
					(data.error_description as string) ||
					`Token request failed (HTTP ${res.status})`,
				status: res.status,
			};
			throw err;
		}
		return toTokenResult(data);
	},
};
