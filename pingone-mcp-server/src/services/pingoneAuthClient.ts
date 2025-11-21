import axios, { AxiosError } from 'axios';

export interface AuthenticateRequest {
	environmentId?: string;
	username: string;
	password: string;
	scope?: string;
	clientId?: string;
	clientSecret?: string;
}

export interface RefreshRequest {
	environmentId?: string;
	refreshToken: string;
	scope?: string;
	clientId?: string;
	clientSecret?: string;
}

export interface RevokeRequest {
	environmentId?: string;
	token: string;
	tokenTypeHint?: 'access_token' | 'refresh_token';
	clientId?: string;
	clientSecret?: string;
}

export interface TokenResult {
	success: boolean;
	tokenType?: string;
	accessToken?: string;
	refreshToken?: string;
	idToken?: string;
	scope?: string;
	expiresIn?: number;
	expiresAt?: string;
	raw?: unknown;
}

export interface OperationResult {
	success: boolean;
	message?: string;
}

export interface PingOneErrorPayload {
	status?: number;
	code?: string;
	message: string;
	description?: string;
	details?: unknown;
}

export class PingOneApiError extends Error {
	status?: number;
	code?: string;
	description?: string;
	details?: unknown;

	constructor(message: string, payload: PingOneErrorPayload = { message }) {
		super(message);
		this.name = 'PingOneApiError';
		this.status = payload.status;
		this.code = payload.code;
		this.description = payload.description;
		this.details = payload.details;
	}
}

const DEFAULT_SCOPE = 'openid profile email';

function resolveEnvironmentId(value?: string): string {
	const envId =
		value ?? process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID;
	if (!envId) {
		throw new PingOneApiError('PingOne environment ID is not configured.', {
			code: 'missing_environment_id',
			message: 'PingOne environment ID is required.',
			description:
				'Set PINGONE_ENVIRONMENT_ID (or VITE_PINGONE_ENVIRONMENT_ID) in the environment variables.',
		});
	}
	return envId;
}

function resolveClientId(value?: string): string {
	const clientId = value ?? process.env.PINGONE_CLIENT_ID ?? process.env.VITE_PINGONE_CLIENT_ID;
	if (!clientId) {
		throw new PingOneApiError('PingOne client ID is not configured.', {
			code: 'missing_client_id',
			message: 'PingOne client ID is required.',
			description:
				'Set PINGONE_CLIENT_ID (or VITE_PINGONE_CLIENT_ID) in the environment variables.',
		});
	}
	return clientId;
}

function resolveClientSecret(value?: string): string {
	const secret =
		value ?? process.env.PINGONE_CLIENT_SECRET ?? process.env.VITE_PINGONE_CLIENT_SECRET;
	if (!secret) {
		throw new PingOneApiError('PingOne client secret is not configured.', {
			code: 'missing_client_secret',
			message: 'PingOne client secret is required.',
			description:
				'Set PINGONE_CLIENT_SECRET (or VITE_PINGONE_CLIENT_SECRET) in the environment variables.',
		});
	}
	return secret;
}

function buildAuthBaseUrl(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/as`;
}

function buildApiBaseUrl(environmentId: string): string {
	return `https://api.pingone.com/v1/environments/${environmentId}`;
}

function createApiError(error: unknown, fallbackMessage: string): PingOneApiError {
	if (error instanceof PingOneApiError) {
		return error;
	}

	if ((axios as { isAxiosError?: (value: unknown) => value is AxiosError }).isAxiosError?.(error)) {
		const axiosError = error as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, any> | undefined;
		const code = (data?.error as string | undefined) ?? axiosError.code;
		const description =
			(data?.error_description as string | undefined) ?? (data?.message as string | undefined);
		const message = description ?? fallbackMessage;

		return new PingOneApiError(message, {
			status,
			code,
			message,
			description,
			details: data,
		});
	}

	if (error instanceof Error) {
		return new PingOneApiError(error.message);
	}

	return new PingOneApiError(fallbackMessage);
}

function normaliseScope(scope?: string): string {
	if (!scope || scope.trim().length === 0) {
		return DEFAULT_SCOPE;
	}
	return scope;
}

function computeExpiresAt(expiresIn?: number): string | undefined {
	if (!expiresIn || Number.isNaN(expiresIn)) {
		return undefined;
	}
	return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export async function authenticateUser(request: AuthenticateRequest): Promise<TokenResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const clientId = resolveClientId(request.clientId);
		const clientSecret = resolveClientSecret(request.clientSecret);
		const scope = normaliseScope(request.scope);

		const url = `${buildAuthBaseUrl(environmentId)}/token`;
		const params = new URLSearchParams({
			grant_type: 'password',
			username: request.username,
			password: request.password,
			client_id: clientId,
			client_secret: clientSecret,
			scope,
		});

		const response = await axios.post(url, params.toString(), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
		});

		const data = response.data as Record<string, any>;
		const expiresIn =
			typeof data.expires_in === 'number' ? data.expires_in : parseInt(data.expires_in, 10);

		return {
			success: true,
			tokenType: data.token_type,
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			idToken: data.id_token,
			scope: data.scope ?? scope,
			expiresIn: Number.isNaN(expiresIn) ? undefined : expiresIn,
			expiresAt: computeExpiresAt(Number.isNaN(expiresIn) ? undefined : expiresIn),
			raw: data,
		};
	} catch (error) {
		throw createApiError(error, 'PingOne authentication failed.');
	}
}

export async function refreshAccessToken(request: RefreshRequest): Promise<TokenResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const clientId = resolveClientId(request.clientId);
		const clientSecret = resolveClientSecret(request.clientSecret);
		const scope = normaliseScope(request.scope);

		const url = `${buildAuthBaseUrl(environmentId)}/token`;
		const params = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: request.refreshToken,
			client_id: clientId,
			client_secret: clientSecret,
			scope,
		});

		const response = await axios.post(url, params.toString(), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
		});

		const data = response.data as Record<string, any>;
		const expiresIn =
			typeof data.expires_in === 'number' ? data.expires_in : parseInt(data.expires_in, 10);

		return {
			success: true,
			tokenType: data.token_type,
			accessToken: data.access_token,
			refreshToken: data.refresh_token ?? request.refreshToken,
			idToken: data.id_token,
			scope: data.scope ?? scope,
			expiresIn: Number.isNaN(expiresIn) ? undefined : expiresIn,
			expiresAt: computeExpiresAt(Number.isNaN(expiresIn) ? undefined : expiresIn),
			raw: data,
		};
	} catch (error) {
		throw createApiError(error, 'PingOne token refresh failed.');
	}
}

export async function revokeToken(request: RevokeRequest): Promise<OperationResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const clientId = resolveClientId(request.clientId);
		const clientSecret = resolveClientSecret(request.clientSecret);

		const url = `${buildAuthBaseUrl(environmentId)}/revoke`;
		const params = new URLSearchParams({
			token: request.token,
			client_id: clientId,
			client_secret: clientSecret,
		});

		if (request.tokenTypeHint) {
			params.append('token_type_hint', request.tokenTypeHint);
		}

		await axios.post(url, params.toString(), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
		});

		return {
			success: true,
			message: 'Token revoked successfully.',
		};
	} catch (error) {
		throw createApiError(error, 'Failed to revoke PingOne token.');
	}
}

export async function getUserInfo(
	environmentId: string,
	accessToken: string
): Promise<Record<string, any>> {
	try {
		const envId = resolveEnvironmentId(environmentId);
		const url = `${buildApiBaseUrl(envId)}/userinfo`; // PingOne userinfo endpoint

		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		});

		return response.data as Record<string, any>;
	} catch (error) {
		throw createApiError(error, 'Failed to retrieve PingOne user info.');
	}
}

export function toPingOneErrorPayload(error: unknown): PingOneErrorPayload {
	if (error instanceof PingOneApiError) {
		return {
			status: error.status,
			code: error.code,
			message: error.message,
			description: error.description,
			details: error.details,
		};
	}

	if ((axios as { isAxiosError?: (value: unknown) => value is AxiosError }).isAxiosError?.(error)) {
		const axiosError = error as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, any> | undefined;
		return {
			status,
			code: (data?.error as string | undefined) ?? axiosError.code,
			message:
				(data?.error_description as string | undefined) ??
				axiosError.message ??
				'PingOne request failed',
			description:
				(data?.error_description as string | undefined) ?? (data?.message as string | undefined),
			details: data,
		};
	}

	if (error instanceof Error) {
		return {
			message: error.message,
		};
	}

	return {
		message: 'Unknown PingOne error',
	};
}
