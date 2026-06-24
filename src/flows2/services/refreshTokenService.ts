// src/flows2/services/refreshTokenService.ts
//
// Refresh Token grant (RFC 6749 §6 / OAuth 2.1 §4.3), with rotation detection.
// real mode → POST the BFF /api/pingone/token proxy with grant_type=refresh_token,
//             mirror the buildPollBody pattern for client-auth method selection.
// mock mode → return a NEW access_token AND a NEW refresh_token whose value differs
//             from the input, demonstrating OAuth 2.1 §4.3 rotation offline.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';
import { applyClientAuth, toTokenResult } from './pingone';

/** Build the url-encoded refresh body + client-auth headers. */
function buildRefreshBody(
	creds: FlowCredentials,
	refreshToken: string
): { body: string; headers?: Record<string, string> } {
	const params = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
	});
	if (creds.scope && creds.scope.trim()) {
		params.set('scope', creds.scope.trim());
	}
	return applyClientAuth(params, creds);
}

export interface RefreshResult {
	token: TokenResult;
	/** True when the server returned a new refresh_token that differs from the submitted one. */
	rotated: boolean;
	/** The original refresh_token that was submitted. */
	submittedRefreshToken: string;
}

export const refreshTokenService = {
	/** RFC 6749 §6 — exchange a refresh_token for new tokens. */
	async refresh(
		credentials: FlowCredentials,
		refreshToken: string,
		mode: FlowMode
	): Promise<RefreshResult> {
		if (mode === 'mock') {
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
			// New refresh_token must differ from the submitted one to demonstrate rotation.
			const newRefreshToken = `mock-rotated-refresh-${Date.now()}`;
			const raw = {
				access_token: fake,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: claims.scope,
				refresh_token: newRefreshToken,
				_mock: true,
			};
			const token = toTokenResult(raw);
			return {
				token,
				rotated: Boolean(token.refreshToken && token.refreshToken !== refreshToken),
				submittedRefreshToken: refreshToken,
			};
		}

		const { body, headers } = buildRefreshBody(credentials, refreshToken);
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
		if (!res.ok || data.error) {
			throw {
				error: typeof data.error === 'string' ? data.error : 'token_refresh_failed',
				error_description:
					typeof data.error_description === 'string'
						? data.error_description
						: `Token refresh failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		const token = toTokenResult(data);
		return {
			token,
			rotated: Boolean(token.refreshToken && token.refreshToken !== refreshToken),
			submittedRefreshToken: refreshToken,
		};
	},
};
