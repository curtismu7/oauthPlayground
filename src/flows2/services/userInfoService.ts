// src/flows2/services/userInfoService.ts
//
// UserInfo (OIDC §5.3) as a flows2 service.
// real mode → GET the BFF /api/userinfo proxy, which forwards to the
//             PingOne /as/userinfo endpoint using the caller's access token.
// mock mode → return canned OIDC claims for offline teaching.

import type { FlowMode } from '../framework/types';
import { pingoneHost } from './pingone';

export interface UserInfoParams {
	environmentId: string;
	region: string;
	accessToken: string;
}

/** OIDC §5.1 standard UserInfo claims (plus any extras the AS returns). */
export interface UserInfoResponse {
	sub: string;
	[claim: string]: unknown;
}

/** The UserInfo endpoint URL for display purposes (OIDC Discovery advertises this). */
export function userInfoEndpointFor(environmentId: string, region: string): string {
	return `https://${pingoneHost(region)}/${environmentId}/as/userinfo`;
}

export const userInfoService = {
	/** OIDC §5.3 — fetch live user claims from the authorization server. */
	async run(
		{ environmentId, accessToken }: UserInfoParams,
		mode: FlowMode
	): Promise<UserInfoResponse> {
		if (mode === 'mock') {
			return {
				sub: 'mock-user-00000000-0000-0000-0000-000000000001',
				name: 'Demo User',
				given_name: 'Demo',
				family_name: 'User',
				email: 'demo.user@example.com',
				email_verified: true,
				phone_number: '+1-555-000-1234',
				phone_number_verified: false,
				updated_at: Math.floor(Date.now() / 1000) - 3600,
				_mock: true,
			};
		}

		const params = new URLSearchParams({ access_token: accessToken, environment_id: environmentId });
		const res = await fetch(`/api/userinfo?${params.toString()}`);
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok || data.error) {
			throw {
				error: (data.error as string) || 'userinfo_failed',
				error_description:
					(data.error_description as string) ||
					`UserInfo request failed (HTTP ${res.status}). Make sure the access token was issued via Authorization Code (user-delegated), not Client Credentials.`,
				status: res.status,
			};
		}
		if (!data.sub || typeof data.sub !== 'string') {
			throw {
				error: 'invalid_userinfo_response',
				error_description: 'UserInfo response missing or invalid sub claim',
				status: res.status,
			};
		}
		return data as UserInfoResponse;
	},
};
