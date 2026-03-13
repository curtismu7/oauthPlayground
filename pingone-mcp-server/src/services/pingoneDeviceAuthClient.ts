/**
 * PingOne device authorization (RFC 8628).
 * Uses environmentId and optional clientId/clientSecret from env/storage.
 */

import axios, { AxiosError } from 'axios';

const envId = () =>
	process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID ?? '';
const clientId = () =>
	process.env.PINGONE_CLIENT_ID ?? process.env.VITE_PINGONE_CLIENT_ID ?? '';
const clientSecret = () =>
	process.env.PINGONE_CLIENT_SECRET ?? process.env.VITE_PINGONE_CLIENT_SECRET ?? '';

function deviceAuthUrl(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/as/device_authorization`;
}

export interface DeviceAuthRequest {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	scope?: string;
}

export interface DeviceAuthResult {
	success: boolean;
	device_code?: string;
	user_code?: string;
	verification_uri?: string;
	verification_uri_complete?: string;
	expires_in?: number;
	interval?: number;
	raw?: Record<string, unknown>;
	error?: { code?: string; message: string };
}

/**
 * Start device authorization flow at PingOne.
 */
export async function startDeviceAuthorization(
	request: DeviceAuthRequest
): Promise<DeviceAuthResult> {
	const environmentId = (request.environmentId || envId()).trim();
	if (!environmentId) {
		return {
			success: false,
			error: { message: 'PingOne environment ID is required (set PINGONE_ENVIRONMENT_ID or pass environmentId).' },
		};
	}
	const cid = (request.clientId || clientId()).trim();
	if (!cid) {
		return {
			success: false,
			error: { message: 'PingOne client ID is required (PINGONE_CLIENT_ID or pass clientId).' },
		};
	}

	const url = deviceAuthUrl(environmentId);
	const body = new URLSearchParams({ client_id: cid });
	const secret = (request.clientSecret ?? clientSecret()).trim();
	if (secret) {
		body.append('client_secret', secret);
	}
	if (request.scope?.trim()) {
		body.append('scope', request.scope.trim());
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
			device_code: data.device_code as string | undefined,
			user_code: data.user_code as string | undefined,
			verification_uri: data.verification_uri as string | undefined,
			verification_uri_complete: data.verification_uri_complete as string | undefined,
			expires_in: data.expires_in as number | undefined,
			interval: data.interval as number | undefined,
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
			'Device authorization failed';
		return {
			success: false,
			error: { code: (data?.error as string) ?? (status ? String(status) : undefined), message },
		};
	}
}
