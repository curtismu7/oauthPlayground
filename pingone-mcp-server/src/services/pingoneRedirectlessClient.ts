import axios, { AxiosError } from 'axios';

export interface RedirectlessAuthRequest {
  environmentId?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  responseType?: string;
  audience?: string;
  username?: string;
  password?: string;
  userId?: string;
  deviceName?: string;
  applicationId?: string;
}

export interface RedirectlessAuthResult {
  success: boolean;
  resumeUrl?: string;
  status?: string;
  flowId?: string;
  interactionId?: string;
  authContext?: Record<string, unknown>;
  raw?: unknown;
  error?: RedirectlessErrorPayload;
}

export interface PollRedirectlessRequest {
  resumeUrl: string;
  environmentId?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export interface RedirectlessErrorPayload {
  status?: number;
  code?: string;
  message: string;
  description?: string;
  details?: unknown;
}

export class RedirectlessApiError extends Error {
  status?: number;
  code?: string;
  description?: string;
  details?: unknown;

  constructor(message: string, payload: RedirectlessErrorPayload = { message }) {
    super(message);
    this.name = 'RedirectlessApiError';
    this.status = payload.status;
    this.code = payload.code;
    this.description = payload.description;
    this.details = payload.details;
  }
}

const DEFAULT_SCOPE = 'openid profile email';

function resolveEnvironmentId(value?: string): string {
  const envId =
    value ??
    process.env.PINGONE_ENVIRONMENT_ID ??
    process.env.VITE_PINGONE_ENVIRONMENT_ID;
  if (!envId) {
    throw new RedirectlessApiError('PingOne environment ID is not configured.', {
      code: 'missing_environment_id',
      message: 'PingOne environment ID is required.',
      description: 'Set PINGONE_ENVIRONMENT_ID (or VITE_PINGONE_ENVIRONMENT_ID) in the environment variables.',
    });
  }
  return envId;
}

function resolveClientId(value?: string): string {
  const clientId = value ?? process.env.PINGONE_CLIENT_ID ?? process.env.VITE_PINGONE_CLIENT_ID;
  if (!clientId) {
    throw new RedirectlessApiError('PingOne client ID is not configured.', {
      code: 'missing_client_id',
      message: 'PingOne client ID is required.',
      description: 'Set PINGONE_CLIENT_ID (or VITE_PINGONE_CLIENT_ID) in the environment variables.',
    });
  }
  return clientId;
}

function resolveClientSecret(value?: string): string {
  const secret =
    value ?? process.env.PINGONE_CLIENT_SECRET ?? process.env.VITE_PINGONE_CLIENT_SECRET;
  if (!secret) {
    throw new RedirectlessApiError('PingOne client secret is not configured.', {
      code: 'missing_client_secret',
      message: 'PingOne client secret is required.',
      description: 'Set PINGONE_CLIENT_SECRET (or VITE_PINGONE_CLIENT_SECRET) in the environment variables.',
    });
  }
  return secret;
}

function determineRegion(environmentId: string): string {
  const lower = environmentId.toLowerCase();
  if (lower.includes('eu')) return 'eu';
  if (lower.includes('asia')) return 'asia';
  return 'com';
}

function buildApiBaseUrl(environmentId: string): string {
  const region = determineRegion(environmentId);
  return `https://api.pingone.${region}/v1/environments/${environmentId}`;
}

function buildAuthUrl(environmentId: string): string {
  const region = determineRegion(environmentId);
  return `https://auth.pingone.${region}/${environmentId}/as`;
}

function createApiError(error: unknown, fallbackMessage: string): RedirectlessApiError {
  if (error instanceof RedirectlessApiError) {
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

    return new RedirectlessApiError(message, {
      status,
      code,
      message,
      description,
      details: data,
    });
  }

  if (error instanceof Error) {
    return new RedirectlessApiError(error.message);
  }

  return new RedirectlessApiError(fallbackMessage);
}

export interface StartRedirectlessResult extends RedirectlessAuthResult {}

export async function startRedirectlessAuthentication(
  request: RedirectlessAuthRequest
): Promise<StartRedirectlessResult> {
  try {
    const environmentId = resolveEnvironmentId(request.environmentId);
    const clientId = resolveClientId(request.clientId);
    const clientSecret = resolveClientSecret(request.clientSecret);
    const scope = request.scope?.trim().length ? request.scope : DEFAULT_SCOPE;
    const responseType = request.responseType ?? 'token';

    const url = `${buildApiBaseUrl(environmentId)}/authentications/redirectless`; // Hypothetical endpoint

    const payload = {
      client_id: clientId,
      client_secret: clientSecret,
      scope,
      response_type: responseType,
      audience: request.audience,
      username: request.username,
      password: request.password,
      device: request.deviceName,
      user_id: request.userId,
      application_id: request.applicationId,
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const data = response.data as Record<string, any>;

    return {
      success: true,
      resumeUrl: data.resumeUrl ?? data.resume_url,
      status: data.status,
      flowId: data.flowId,
      interactionId: data.interactionId,
      authContext: data.context,
      raw: data,
    };
  } catch (error) {
    throw createApiError(error, 'Failed to start redirectless authentication.');
  }
}

export interface PollRedirectlessResult extends RedirectlessAuthResult {}

export async function pollRedirectlessAuthentication(
  request: PollRedirectlessRequest
): Promise<PollRedirectlessResult> {
  try {
    if (!request.resumeUrl || request.resumeUrl.trim().length === 0) {
      throw new RedirectlessApiError('Resume URL is required to poll redirectless authentication.', {
        code: 'missing_resume_url',
        message: 'Resume URL is required to poll redirectless authentication.',
      });
    }

    const environmentId = resolveEnvironmentId(request.environmentId);
    const authUrl = buildAuthUrl(environmentId);
    const resumeUrl = request.resumeUrl.startsWith('http')
      ? request.resumeUrl
      : `${authUrl}${request.resumeUrl.startsWith('/') ? '' : '/'}${request.resumeUrl}`;

    const pollInterval = request.pollIntervalMs ?? 2000;
    const timeout = request.timeoutMs ?? 60000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const response = await axios.get(resumeUrl, {
        headers: {
          Accept: 'application/json',
        },
      });

      const data = response.data as Record<string, any>;

      if (data.status && data.status !== 'PENDING') {
        return {
          success: data.status === 'COMPLETED',
          status: data.status,
          resumeUrl,
          flowId: data.flowId,
          interactionId: data.interactionId,
          authContext: data.context,
          raw: data,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      resumeUrl,
      status: 'TIMEOUT',
      error: {
        message: 'Redirectless authentication timed out before completion.',
      },
    };
  } catch (error) {
    throw createApiError(error, 'Failed to poll redirectless authentication.');
  }
}

export interface CompleteRedirectlessRequest {
  resumeUrl: string;
  environmentId?: string;
  code?: string;
  verifier?: string;
}

export interface CompleteRedirectlessResult extends RedirectlessAuthResult {}

export async function completeRedirectlessAuthentication(
  request: CompleteRedirectlessRequest
): Promise<CompleteRedirectlessResult> {
  try {
    if (!request.resumeUrl || request.resumeUrl.trim().length === 0) {
      throw new RedirectlessApiError('Resume URL is required to complete redirectless authentication.', {
        code: 'missing_resume_url',
        message: 'Resume URL is required to complete redirectless authentication.',
      });
    }

    const environmentId = resolveEnvironmentId(request.environmentId);
    const authUrl = buildAuthUrl(environmentId);
    const resumeUrl = request.resumeUrl.startsWith('http')
      ? request.resumeUrl
      : `${authUrl}${request.resumeUrl.startsWith('/') ? '' : '/'}${request.resumeUrl}`;

    const payload = {
      code: request.code,
      verifier: request.verifier,
    };

    const response = await axios.post(resumeUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const data = response.data as Record<string, any>;

    return {
      success: data.status === 'COMPLETED' || data.success === true,
      status: data.status,
      resumeUrl,
      flowId: data.flowId,
      interactionId: data.interactionId,
      authContext: data.context,
      raw: data,
    };
  } catch (error) {
    throw createApiError(error, 'Failed to complete redirectless authentication.');
  }
}

export function toRedirectlessErrorPayload(error: unknown): RedirectlessErrorPayload {
  if (error instanceof RedirectlessApiError) {
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
        'Redirectless request failed',
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
    message: 'Unknown redirectless error',
  };
}
