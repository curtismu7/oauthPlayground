/**
 * PingOne token introspection (RFC 7662).
 * Uses environmentId and client credentials from env/storage.
 */

import axios, { AxiosError } from 'axios';

const envId = () =>
	process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID ?? '';
const clientId = () =>
	process.env.PINGONE_CLIENT_ID ?? process.env.VITE_PINGONE_CLIENT_ID ?? '';
const clientSecret = () =>
	process.env.PINGONE_CLIENT_SECRET ?? process.env.VITE_PINGONE_CLIENT_SECRET ?? '';

function introspectUrl(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/as/introspect`;
}

export interface IntrospectRequest {
	environmentId?: string;
	token: string;
	tokenTypeHint?: 'access_token' | 'refresh_token';
}

export interface IntrospectResult {
	success: boolean;
	active?: boolean;
	scope?: string;
	client_id?: string;
	username?: string;
	token_type?: string;
	exp?: number;
	iat?: number;
	sub?: string;
	raw?: Record<string, unknown>;
	error?: { code?: string; message: string };
}

/**
 * Introspect a token at PingOne.
 */
export async function introspectToken(request: IntrospectRequest): Promise<IntrospectResult> {
	const environmentId = (request.environmentId || envId()).trim();
	if (!environmentId) {
		return {
			success: false,
			error: { message: 'PingOne environment ID is required (set PINGONE_ENVIRONMENT_ID or pass environmentId).' },
		};
	}
	const cid = clientId().trim();
	const secret = clientSecret().trim();
	if (!cid || !secret) {
		return {
			success: false,
			error: { message: 'PingOne client credentials required (PINGONE_CLIENT_ID, PINGONE_CLIENT_SECRET).' },
		};
	}

	const url = introspectUrl(environmentId);
	const body = new URLSearchParams({
		token: request.token,
		client_id: cid,
		client_secret: secret,
	});
	if (request.tokenTypeHint) {
		body.append('token_type_hint', request.tokenTypeHint);
	}

	try {
		const { data } = await axios.post<Record<string, unknown>>(url, body.toString(), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
		});
		return {
			success: true,
			active: data.active as boolean | undefined,
			scope: data.scope as string | undefined,
			client_id: data.client_id as string | undefined,
			username: data.username as string | undefined,
			token_type: data.token_type as string | undefined,
			exp: data.exp as number | undefined,
			iat: data.iat as number | undefined,
			sub: data.sub as string | undefined,
			raw: data as Record<string, unknown>,
		};
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.error_description as string) ||
			(data?.message as string) ||
			axiosError.message ||
			'Token introspection failed';
		return {
			success: false,
			error: { code: (data?.error as string) ?? (status ? String(status) : undefined), message },
		};
	}
}
