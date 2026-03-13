/**
 * PingOne OIDC discovery (no auth).
 * Fetch .well-known/openid_configuration for an environment or arbitrary issuer.
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

function resolveAuthBase(region: string): string {
	const key = region.toLowerCase().trim();
	return AUTH_REGION_MAP[key] ?? AUTH_REGION_MAP['na'];
}

export interface GetOidcConfigRequest {
	environmentId: string;
	region?: string;
}

export interface GetOidcConfigResult {
	success: boolean;
	config?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Fetch PingOne OIDC discovery for an environment (no auth). */
export async function getOidcConfig(request: GetOidcConfigRequest): Promise<GetOidcConfigResult> {
	try {
		const envId = request.environmentId?.trim();
		if (!envId) {
			return { success: false, error: { message: 'environmentId is required' } };
		}
		const region = request.region?.trim() ?? 'na';
		const baseUrl = resolveAuthBase(region);
		const url = `${baseUrl}/${envId}/as/.well-known/openid_configuration`;

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Accept: 'application/json' },
		});

		return { success: true, config: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.error_description as string) ??
			(data?.message as string) ??
			axiosError.message ??
			'Failed to fetch OIDC config';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

export interface GetOidcDiscoveryRequest {
	issuerUrl: string;
}

export interface GetOidcDiscoveryResult {
	success: boolean;
	discovery?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Fetch OIDC discovery from an arbitrary issuer URL (no auth). Normalizes URL and appends .well-known/openid-configuration. */
export async function getOidcDiscovery(request: GetOidcDiscoveryRequest): Promise<GetOidcDiscoveryResult> {
	try {
		let normalized = request.issuerUrl?.trim();
		if (!normalized) {
			return { success: false, error: { message: 'issuerUrl is required' } };
		}
		while (normalized.endsWith('/')) {
			normalized = normalized.slice(0, -1);
		}
		if (normalized.endsWith('/.well-known/openid-configuration') || normalized.endsWith('/.well-known/openid_configuration')) {
			normalized = normalized.replace(/\/\.well-known\/openid[-_]configuration$/, '');
		}
		const url = `${normalized}/.well-known/openid-configuration`;

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Accept: 'application/json' },
		});

		return { success: true, discovery: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			axiosError.message ??
			'Failed to fetch OIDC discovery';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}
