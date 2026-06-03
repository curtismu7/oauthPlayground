/**
 * Standardized MCP error handling — decoupled from any specific provider.
 * All tool handlers return { success, error?: { code, message } } for consistent AI handling.
 * Maps OAuth 2.0 error responses (RFC 6749 §5.2) and HTTP/transport errors to a uniform shape.
 */

import axios, { AxiosError } from 'axios';

export const ERROR_CODES = {
	INVALID_REQUEST: 'invalid_request',
	INVALID_CLIENT: 'invalid_client',
	INVALID_GRANT: 'invalid_grant',
	UNAUTHORIZED_CLIENT: 'unauthorized_client',
	UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
	INVALID_SCOPE: 'invalid_scope',
	INVALID_TOKEN: 'invalid_token',
	MISSING_CONFIG: 'missing_config',
	DISCOVERY_FAILED: 'discovery_failed',
	NETWORK_ERROR: 'network_error',
	RATE_LIMIT: 'rate_limit',
	UNKNOWN: 'unknown_error',
} as const;

export type McpErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface McpErrorPayload {
	code: string;
	message: string;
	status?: number;
	description?: string;
	details?: unknown;
}

/** A configuration / input error raised before any HTTP call. */
export class ConfigError extends Error {
	code: string;
	constructor(message: string, code: string = ERROR_CODES.MISSING_CONFIG) {
		super(message);
		this.name = 'ConfigError';
		this.code = code;
	}
}

/**
 * Convert any thrown value to a consistent MCP error payload.
 * Recognizes OAuth 2.0 error bodies ({ error, error_description }) from any provider.
 */
export function toMcpErrorPayload(error: unknown): McpErrorPayload {
	if (error instanceof ConfigError) {
		return { code: error.code, message: error.message };
	}

	if ((axios as { isAxiosError?: (v: unknown) => v is AxiosError }).isAxiosError?.(error)) {
		const axiosError = error as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const oauthError = typeof data?.error === 'string' ? data.error : undefined;
		const description =
			(typeof data?.error_description === 'string' ? data.error_description : undefined) ??
			(typeof data?.message === 'string' ? data.message : undefined);

		let code: string = oauthError ?? ERROR_CODES.UNKNOWN;
		if (!oauthError) {
			if (status === 429) code = ERROR_CODES.RATE_LIMIT;
			else if (status === 401) code = ERROR_CODES.INVALID_CLIENT;
			else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND')
				code = ERROR_CODES.NETWORK_ERROR;
		}

		return {
			code,
			message: description ?? axiosError.message ?? 'OAuth request failed',
			status,
			description,
			details: data,
		};
	}

	if (error instanceof Error) {
		return { code: ERROR_CODES.UNKNOWN, message: error.message };
	}

	return { code: ERROR_CODES.UNKNOWN, message: 'Unknown error' };
}

/**
 * Build an MCP tool error result with content + structuredContent { success: false, error }.
 */
export function buildToolErrorResult(
	component: string,
	error: unknown
): {
	content: Array<{ type: 'text'; text: string }>;
	structuredContent: Record<string, unknown>;
} {
	const payload = toMcpErrorPayload(error);
	return {
		content: [
			{ type: 'text' as const, text: `${component} failed: ${payload.message}` },
			{ type: 'text' as const, text: `Details: ${JSON.stringify(payload, null, 2)}` },
		],
		structuredContent: { success: false, error: payload },
	};
}
