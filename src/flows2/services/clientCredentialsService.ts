// src/flows2/services/clientCredentialsService.ts
//
// Client Credentials grant (RFC 6749 §4.4) as an OAuthFlowService.
// real mode → POST the BFF /api/pingone/token proxy (server forwards to PingOne).
// mock mode → return a deterministic fake token (no network), for offline teaching.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';

export interface ClientCredentialsParams {
	credentials: FlowCredentials;
}

/** Decode a JWT payload without verification (for the mock introspection view). */
function decodeJwtPayload(token?: string): Record<string, unknown> | null {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/** Build the url-encoded token-request body the BFF forwards verbatim to PingOne. */
function buildBody(creds: FlowCredentials): { body: string; headers?: Record<string, string> } {
	const params = new URLSearchParams({ grant_type: 'client_credentials' });
	if (creds.scope && creds.scope.trim()) params.set('scope', creds.scope.trim());

	const method = creds.authMethod ?? 'client_secret_post';
	if (method === 'client_secret_basic') {
		const basic = btoa(`${creds.clientId}:${creds.clientSecret ?? ''}`);
		return { body: params.toString(), headers: { Authorization: `Basic ${basic}` } };
	}
	// client_secret_post
	params.set('client_id', creds.clientId);
	if (creds.clientSecret) params.set('client_secret', creds.clientSecret);
	return { body: params.toString() };
}

function toTokenResult(data: Record<string, unknown>): TokenResult {
	return {
		accessToken: typeof data.access_token === 'string' ? data.access_token : undefined,
		tokenType: typeof data.token_type === 'string' ? data.token_type : undefined,
		expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
		scope: typeof data.scope === 'string' ? data.scope : undefined,
		raw: data,
	};
}

/** RFC 7662 introspection of the worker access token. mock → decode locally; real → BFF. */
async function introspect(
	accessToken: string,
	credentials: FlowCredentials,
	mode: FlowMode
): Promise<Record<string, unknown>> {
	if (mode === 'mock') {
		const claims = decodeJwtPayload(accessToken) || {};
		const now = Math.floor(Date.now() / 1000);
		const exp = typeof claims.exp === 'number' ? claims.exp : now + 3600;
		return {
			active: exp > now,
			scope: claims.scope,
			client_id: claims.sub,
			token_type: 'Bearer',
			exp,
			iat: claims.iat,
			sub: claims.sub,
			aud: claims.aud,
			iss: claims.iss,
			_mock: true,
		};
	}
	const res = await fetch('/api/introspect-token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			environment_id: credentials.environmentId,
			region: credentials.region,
			token: accessToken,
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
			auth_method: credentials.authMethod ?? 'client_secret_post',
		}),
	});
	return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export const clientCredentialsService = {
	introspect,
	async run({ credentials }: ClientCredentialsParams, mode: FlowMode): Promise<TokenResult> {
		if (mode === 'mock') {
			const now = Math.floor(Date.now() / 1000);
			const fakeClaims = {
				sub: credentials.clientId,
				aud: `https://api.pingone.${credentials.region}/${credentials.environmentId}`,
				scope: credentials.scope || 'mock:read',
				iat: now,
				exp: now + 3600,
				iss: `https://auth.pingone.${credentials.region}/${credentials.environmentId}/as`,
				token_use: 'mock',
			};
			const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
			const payload = btoa(JSON.stringify(fakeClaims));
			const data = {
				access_token: `${header}.${payload}.`,
				token_type: 'Bearer',
				expires_in: 3600,
				scope: fakeClaims.scope,
				_mock: true,
			};
			return toTokenResult(data);
		}

		const { body, headers } = buildBody(credentials);
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
				error: (data.error as string) || 'token_request_failed',
				error_description:
					(data.error_description as string) || `Token request failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		return toTokenResult(data);
	},
};
