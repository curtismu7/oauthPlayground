/**
 * PingOne password state and recovery (worker token).
 * GET password state, POST send recovery code.
 */

import axios, { AxiosError } from 'axios';
import { issueWorkerToken, type WorkerTokenRequest } from './pingoneManagementClient.js';

const DEFAULT_WORKER_SCOPE = 'p1:read:environment p1:read:application p1:read:resource p1:read:user';

const PASSWORD_REGION_MAP: Record<string, string> = {
	us: 'com',
	na: 'com',
	eu: 'eu',
	ca: 'ca',
	ap: 'asia',
	asia: 'asia',
	au: 'com.au',
	sg: 'sg',
};

function resolveEnvironmentId(value?: string): string {
	const envId =
		value ?? process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID;
	if (!envId) {
		throw new Error('PingOne environment ID is required.');
	}
	return envId;
}

function getPasswordApiBaseUrl(region?: string): string {
	const tld = PASSWORD_REGION_MAP[region?.toLowerCase()?.trim() ?? ''] ?? 'com';
	return `https://api.pingone.${tld}`;
}

async function getWorkerToken(request: {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
}): Promise<string> {
	if (request.workerToken?.trim()) return request.workerToken.trim();
	const envId = resolveEnvironmentId(request.environmentId);
	const result = await issueWorkerToken({
		environmentId: envId,
		clientId: request.clientId ?? process.env.PINGONE_CLIENT_ID ?? process.env.VITE_PINGONE_CLIENT_ID,
		clientSecret:
			request.clientSecret ??
			process.env.PINGONE_CLIENT_SECRET ??
			process.env.VITE_PINGONE_CLIENT_SECRET,
		scope: DEFAULT_WORKER_SCOPE,
	} as WorkerTokenRequest);
	if (!result.success || !result.accessToken) {
		throw new Error('Failed to obtain worker token for password API.');
	}
	return result.accessToken;
}

export interface GetPasswordStateRequest {
	environmentId?: string;
	userId: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
}

export interface GetPasswordStateResult {
	success: boolean;
	passwordState?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Get password state for a user (worker token). */
export async function getPasswordState(request: GetPasswordStateRequest): Promise<GetPasswordStateResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = getPasswordApiBaseUrl(request.region);
		const url = `${baseUrl}/v1/environments/${environmentId}/users/${request.userId}/password`;

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});

		return { success: true, passwordState: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.error_description as string) ??
			(data?.message as string) ??
			axiosError.message ??
			'Failed to get password state';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

export interface SendRecoveryCodeRequest {
	environmentId?: string;
	userId: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
}

export interface SendRecoveryCodeResult {
	success: boolean;
	message?: string;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Send password recovery code to user (worker token). */
export async function sendRecoveryCode(request: SendRecoveryCodeRequest): Promise<SendRecoveryCodeResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = getPasswordApiBaseUrl(request.region);
		const url = `${baseUrl}/v1/environments/${environmentId}/users/${request.userId}/password/recovery`;

		const response = await axios.post(url, {}, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});

		const data = response.data as Record<string, unknown> | undefined;
		return {
			success: true,
			message: 'Recovery code sent successfully',
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
			'Failed to send recovery code';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}
