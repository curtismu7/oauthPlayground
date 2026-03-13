/**
 * PingOne token exchange (generic POST to /as/token) and userinfo by URL.
 */

import axios, { AxiosError } from 'axios';

const AUTH_REGION_MAP: Record<string, string> = {
	us: 'https://auth.pingone.com',
	na: 'https://auth.pingone.com',
	eu: 'https://auth.pingone.eu',
	ca: 'https://auth.pingone.ca',
	ap: 'https://auth.pingone.asia',
	asia: 'https://auth.pingone.asia',
};

function resolveAuthBase(environmentId: string, region?: string): string {
	const r = (region ?? 'na').toLowerCase().trim();
	const base = AUTH_REGION_MAP[r] ?? AUTH_REGION_MAP['na'];
	return `${base}/${environmentId}/as`;
}

export interface TokenExchangeRequest {
	environmentId: string;
	region?: string;
	/** URL-encoded body (grant_type, code, redirect_uri, client_id, etc.) */
	body: string;
	authMethod?: 'client_secret_post' | 'client_secret_basic';
	/** Optional headers (e.g. Authorization for client_secret_basic) */
	headers?: Record<string, string>;
}

export interface TokenExchangeResult {
	success: boolean;
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	tokenType?: string;
	expiresIn?: number;
	scope?: string;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Exchange authorization code (or other grant) for tokens. POST to PingOne /as/token. */
export async function tokenExchange(request: TokenExchangeRequest): Promise<TokenExchangeResult> {
	try {
		const base = resolveAuthBase(request.environmentId, request.region);
		const url = `${base}/token`;
		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			...(request.headers ?? {}),
		};

		const { data } = await axios.post<Record<string, unknown>>(url, request.body, {
			headers,
			validateStatus: () => true,
		});

		if (data.error) {
			return {
				success: false,
				error: {
					code: data.error as string,
					message: (data.error_description as string) ?? (data.error as string),
				},
				raw: data,
			};
		}

		return {
			success: true,
			accessToken: data.access_token as string | undefined,
			refreshToken: data.refresh_token as string | undefined,
			idToken: data.id_token as string | undefined,
			tokenType: data.token_type as string | undefined,
			expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
			scope: data.scope as string | undefined,
			raw: data,
		};
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.error_description as string) ??
			(data?.message as string) ??
			axiosError.message ??
			'Token exchange failed';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

export interface UserinfoByEndpointRequest {
	userInfoEndpoint: string;
	accessToken: string;
}

export interface UserinfoByEndpointResult {
	success: boolean;
	userInfo?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Call UserInfo endpoint with access token (GET). Use when endpoint URL is known (e.g. from discovery). */
export async function userinfoByEndpoint(request: UserinfoByEndpointRequest): Promise<UserinfoByEndpointResult> {
	try {
		const url = request.userInfoEndpoint.trim();
		if (!url) {
			return { success: false, error: { message: 'userInfoEndpoint is required' } };
		}
		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: {
				Authorization: `Bearer ${request.accessToken}`,
				Accept: 'application/json',
			},
		});
		return { success: true, userInfo: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.error_description as string) ??
			(data?.message as string) ??
			axiosError.message ??
			'UserInfo request failed';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}
