// src/flows2/services/tokenRevocationService.ts
//
// Token Revocation (RFC 7009) as a flows2 service.
// real mode → POST the BFF /api/pingone/revoke proxy, which forwards to the
//             PingOne /as/revoke endpoint using client_secret_post auth.
// mock mode → simulate the revocation response locally for offline teaching.
//             RFC 7009 always returns 200, so mock returns the same shape.

import type { FlowCredentials, FlowMode } from '../framework/types';
import { pingoneHost } from './pingone';

/** Optional hint values from RFC 7009 §2.1 */
export type TokenTypeHint = 'access_token' | 'refresh_token';

export interface TokenRevocationParams {
	credentials: FlowCredentials;
	/** The token to revoke. */
	token: string;
	/** Optional hint that helps the AS pick the right token store first. */
	tokenTypeHint?: TokenTypeHint;
}

/** Response shape returned by our BFF after a successful revocation. */
export interface RevocationResponse {
	revoked: boolean;
	/** Present in mock mode. */
	_mock?: boolean;
}

/** The PingOne revocation endpoint URL for display purposes. */
export function revocationEndpointFor(credentials: FlowCredentials): string {
	return `https://${pingoneHost(credentials.region)}/${credentials.environmentId}/as/revoke`;
}

export const tokenRevocationService = {
	/** RFC 7009 §2 — request that the AS invalidate a token. */
	async run(
		{ credentials, token, tokenTypeHint }: TokenRevocationParams,
		mode: FlowMode
	): Promise<RevocationResponse> {
		if (mode === 'mock') {
			// RFC 7009 §2.2: the server always returns 200; the caller cannot tell whether
			// the token ever existed. Simulate the same no-information response.
			return { revoked: true, _mock: true };
		}

		const res = await fetch('/api/pingone/revoke', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environment_id: credentials.environmentId,
				region: credentials.region,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				token,
				token_type_hint: tokenTypeHint,
			}),
		});
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'revocation_failed',
				error_description:
					(data.error_description as string) ||
					`Token revocation failed (HTTP ${res.status})`,
				status: res.status,
			};
		}
		return data as RevocationResponse;
	},
};
