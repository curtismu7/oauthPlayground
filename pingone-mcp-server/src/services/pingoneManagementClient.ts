import axios, { AxiosError } from 'axios';

export interface WorkerTokenRequest {
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	scope?: string;
	tokenEndpointAuthMethod?: 'client_secret_post' | 'client_secret_basic';
}

export interface WorkerTokenResult {
	success: boolean;
	accessToken?: string;
	tokenType?: string;
	scope?: string;
	expiresIn?: number;
	expiresAt?: string;
	raw?: unknown;
}

export interface WorkerTokenErrorResult extends WorkerTokenResult {
	success: false;
	error: PingOneErrorPayload;
}

export interface PingOneApplication {
	id: string;
	name: string;
	description?: string;
	clientId?: string;
	type?: string;
	status?: string;
	redirectUris?: string[];
	postLogoutRedirectUris?: string[];
	scopes?: string[];
	grantTypes?: string[];
	tokenEndpointAuthMethod?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface ListApplicationsRequest {
	environmentId?: string;
	region?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	scope?: string;
	includeSecret?: boolean;
	limit?: number;
}

export interface ListApplicationsResult {
	success: boolean;
	applications?: PingOneApplication[];
	raw?: unknown;
}

export interface ListApplicationsErrorResult extends ListApplicationsResult {
	success: false;
	error: PingOneErrorPayload;
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

const DEFAULT_WORKER_SCOPE = 'p1:read:environment p1:read:application p1:read:resource';

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

function determineRegion(environmentId: string, override?: string): string {
	if (override && override.trim().length > 0) {
		return override.trim();
	}

	const lower = environmentId.toLowerCase();
	if (lower.includes('eu')) {
		return 'eu';
	}
	if (lower.includes('asia')) {
		return 'asia';
	}
	return 'com';
}

function buildAuthBaseUrl(environmentId: string): string {
	return `https://auth.pingone.${determineRegion(environmentId)}/${environmentId}/as`;
}

function buildApiBaseUrl(environmentId: string, region?: string): string {
	const resolvedRegion = determineRegion(environmentId, region);
	return `https://api.pingone.${resolvedRegion}/v1/environments/${environmentId}`;
}

function computeExpiresAt(expiresIn?: number): string | undefined {
	if (!expiresIn || Number.isNaN(expiresIn)) {
		return undefined;
	}
	return new Date(Date.now() + expiresIn * 1000).toISOString();
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

export async function issueWorkerToken(
	request: WorkerTokenRequest
): Promise<WorkerTokenResult | WorkerTokenErrorResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const clientId = resolveClientId(request.clientId);
		const clientSecret = resolveClientSecret(request.clientSecret);
		const scope =
			request.scope && request.scope.trim().length > 0 ? request.scope : DEFAULT_WORKER_SCOPE;

		const url = `${buildAuthBaseUrl(environmentId)}/token`;
		const params = new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: clientId,
			client_secret: clientSecret,
			scope,
		});

		if (request.tokenEndpointAuthMethod) {
			params.append('client_auth_method', request.tokenEndpointAuthMethod);
		}

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
			accessToken: data.access_token,
			tokenType: data.token_type,
			scope: data.scope ?? scope,
			expiresIn: Number.isNaN(expiresIn) ? undefined : expiresIn,
			expiresAt: computeExpiresAt(Number.isNaN(expiresIn) ? undefined : expiresIn),
			raw: data,
		};
	} catch (error) {
		throw createApiError(error, 'Failed to issue PingOne worker token.');
	}
}

export async function listApplications(
	request: ListApplicationsRequest
): Promise<ListApplicationsResult | ListApplicationsErrorResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const region = determineRegion(environmentId, request.region);

		let token = request.workerToken?.trim();
		if (!token) {
			if (!request.clientId || !request.clientSecret) {
				throw new PingOneApiError(
					'Worker token or client credentials are required to fetch applications.',
					{
						code: 'missing_credentials',
						message: 'workerToken or clientId/clientSecret must be provided.',
					}
				);
			}

			const workerTokenResult = await issueWorkerToken({
				environmentId,
				clientId: request.clientId,
				clientSecret: request.clientSecret,
				scope: request.scope ?? DEFAULT_WORKER_SCOPE,
			} as WorkerTokenRequest & { scope?: string });

			if (!workerTokenResult.success || !workerTokenResult.accessToken) {
				throw new PingOneApiError('Failed to obtain worker token for listing applications.');
			}

			token = workerTokenResult.accessToken;
		}

		const baseUrl = buildApiBaseUrl(environmentId, region);
		const limit = request.limit && request.limit > 0 ? request.limit : 100;
		const url = `${baseUrl}/applications?limit=${limit}`;

		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
			params: request.includeSecret ? { includeSecret: true } : undefined,
		});

		const data = response.data as Record<string, any>;
		const embedded = data._embedded?.applications as Array<Record<string, any>> | undefined;

		const applications: PingOneApplication[] = (embedded ?? []).map((app) => ({
			id: app.id,
			name: app.name,
			description: app.description,
			clientId: app.clientId,
			type: app.type,
			status: app.status,
			redirectUris: app.redirectUris ?? [],
			postLogoutRedirectUris: app.postLogoutRedirectUris ?? [],
			scopes: app.scopes ?? [],
			grantTypes: app.grantTypes ?? [],
			tokenEndpointAuthMethod: app.tokenEndpointAuthMethod,
			createdAt: app.createdAt,
			updatedAt: app.updatedAt,
		}));

		return {
			success: true,
			applications,
			raw: data,
		};
	} catch (error) {
		throw createApiError(error, 'Failed to list PingOne applications.');
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
