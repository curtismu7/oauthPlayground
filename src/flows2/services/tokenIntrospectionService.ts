// src/flows2/services/tokenIntrospectionService.ts
//
// Token Introspection (RFC 7662) as a flows2 service.
// real mode → POST the BFF /api/introspect-token proxy, which authenticates as the
//             client and forwards to the PingOne /as/introspect endpoint.
// mock mode → decode the token locally and answer in RFC 7662 shape, for teaching
//             the active/claims semantics offline.

import type { FlowCredentials, FlowMode } from '../framework/types';
import { decodeJwtPayload, pingoneHost } from './pingone';

/** RFC 7662 §2.1 token_type_hint values PingOne accepts. */
export type TokenTypeHint = 'access_token' | 'refresh_token';

export interface TokenIntrospectionParams {
	credentials: FlowCredentials;
	/** The token whose state is being asked about (JWT or opaque). */
	token: string;
	/** Optional hint that helps the AS pick the right token store first. */
	tokenTypeHint?: TokenTypeHint;
}

/** RFC 7662 §2.2 response — `active` is the only guaranteed member. */
export interface IntrospectionResponse {
	active: boolean;
	[claim: string]: unknown;
}

/** PingOne introspection endpoint for the configured environment. */
export function introspectionEndpointFor(credentials: FlowCredentials): string {
	return `https://${pingoneHost(credentials.region)}/${credentials.environmentId}/as/introspect`;
}

export const tokenIntrospectionService = {
	/** RFC 7662 §2 — ask the AS whether a token is active and what it carries. */
	async run(
		{ credentials, token, tokenTypeHint }: TokenIntrospectionParams,
		mode: FlowMode
	): Promise<IntrospectionResponse> {
		if (mode === 'mock') {
			const claims = decodeJwtPayload(token);
			const now = Math.floor(Date.now() / 1000);
			const exp = typeof claims?.exp === 'number' ? claims.exp : null;
			// RFC 7662 §2.2: for an unknown/expired/revoked token, say ONLY { active: false } —
			// leaking claims about inactive tokens is explicitly discouraged (§4).
			if (!claims || (exp !== null && exp <= now)) {
				return { active: false, _mock: true };
			}
			return {
				active: true,
				scope: claims.scope,
				client_id: claims.client_id ?? claims.azp ?? claims.sub,
				token_type: 'Bearer',
				exp: exp ?? undefined,
				iat: claims.iat,
				sub: claims.sub,
				aud: claims.aud,
				iss: claims.iss,
				act: claims.act,
				_mock: true,
			};
		}

		const res = await fetch('/api/introspect-token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				token,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				introspection_endpoint: introspectionEndpointFor(credentials),
				token_auth_method: credentials.authMethod ?? 'client_secret_post',
				token_type_hint: tokenTypeHint,
			}),
		});
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'introspection_failed',
				error_description:
					(data.error_description as string) || `Token introspection failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		if (typeof data.active !== 'boolean') {
			throw {
				error: 'invalid_introspection_response',
				error_description: 'Introspection response missing or invalid active field',
				status: res.status,
			};
		}
		return data as IntrospectionResponse;
	},
};
