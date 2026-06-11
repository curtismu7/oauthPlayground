// src/flows2/services/clientCredentialsService.ts
//
// Client Credentials grant (RFC 6749 §4.4) as an OAuthFlowService.
// real mode → POST the BFF /api/pingone/token proxy (server forwards to PingOne).
// mock mode → return a deterministic fake token (no network), for offline teaching.

import type { FlowCredentials, FlowMode, TokenResult } from '../framework/types';
import { pingoneHost } from './pingone';
import { tokenIntrospectionService } from './tokenIntrospectionService';

export interface ClientCredentialsParams {
	credentials: FlowCredentials;
	/** RFC 8707 resource indicator(s) — narrow the token to a target. */
	audience?: string;
	resource?: string;
}

const DEFAULT_WORKER_SCOPES = ['p1:read:user', 'p1:update:user', 'p1:read:device', 'p1:update:device'];

/** Build the url-encoded token-request body the BFF forwards verbatim to PingOne. */
function buildBody(
	creds: FlowCredentials,
	opts?: { audience?: string; resource?: string }
): { body: string; headers?: Record<string, string> } {
	const params = new URLSearchParams({ grant_type: 'client_credentials' });
	if (creds.scope && creds.scope.trim()) params.set('scope', creds.scope.trim());
	if (opts?.audience && opts.audience.trim()) params.set('audience', opts.audience.trim());
	if (opts?.resource && opts.resource.trim()) params.set('resource', opts.resource.trim());

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

/** RFC 7662 introspection of the worker access token — delegates to the introspection service.
 *  Errors come back as data: the inspect step renders the JSON either way. */
async function introspect(
	accessToken: string,
	credentials: FlowCredentials,
	mode: FlowMode
): Promise<Record<string, unknown>> {
	return tokenIntrospectionService
		.run({ credentials, token: accessToken }, mode)
		.catch((e) => e as Record<string, unknown>);
}

/** Discover the scopes a worker app may request. real → OIDC discovery; mock → PingOne defaults. */
async function discover(credentials: FlowCredentials, mode: FlowMode): Promise<string[]> {
	if (mode === 'mock') return DEFAULT_WORKER_SCOPES;
	const issuerUrl = `https://${pingoneHost(credentials.region)}/${credentials.environmentId}/as`;
	const res = await fetch('/api/pingone/oidc-discovery', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ issuerUrl }),
	});
	const data = (await res.json().catch(() => ({}))) as { scopes_supported?: unknown };
	return Array.isArray(data.scopes_supported)
		? (data.scopes_supported as string[]).filter((s) => typeof s === 'string')
		: [];
}

export const clientCredentialsService = {
	introspect,
	discover,
	async run({ credentials, audience, resource }: ClientCredentialsParams, mode: FlowMode): Promise<TokenResult> {
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

		const { body, headers } = buildBody(credentials, { audience, resource });
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
