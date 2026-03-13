/**
 * Standardized MCP error handling for PingOne tools.
 * All tool handlers should return { success, error?: { code, message } } for consistent AI handling.
 */

import axios, { AxiosError } from 'axios';
import { toPingOneErrorPayload } from './pingoneAuthClient.js';

export const ERROR_CODES = {
	AUTH_FAILED: 'AUTH_FAILED',
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	MFA_ENROLLMENT_FAILED: 'MFA_ENROLL_FAILED',
	RATE_LIMIT_EXCEEDED: 'RATE_LIMIT',
	INVALID_INPUT: 'INVALID_INPUT',
	INTROSPECT_FAILED: 'INTROSPECT_FAILED',
	DEVICE_AUTH_FAILED: 'DEVICE_AUTH_FAILED',
	MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
	UNKNOWN: 'UNKNOWN',
} as const;

export type McpErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface McpErrorPayload {
	code: string;
	message: string;
	status?: number;
	details?: unknown;
}

/**
 * Convert any thrown value to a consistent MCP error payload.
 */
export function toMcpErrorPayload(error: unknown): McpErrorPayload {
	const payload = toPingOneErrorPayload(error);
	const code =
		payload.status === 401
			? ERROR_CODES.AUTH_FAILED
			: payload.status === 404
				? ERROR_CODES.USER_NOT_FOUND
				: payload.status === 429
					? ERROR_CODES.RATE_LIMIT_EXCEEDED
					: (payload.code as McpErrorCode) || ERROR_CODES.UNKNOWN;
	return {
		code: Object.values(ERROR_CODES).includes(code as McpErrorCode) ? code : ERROR_CODES.UNKNOWN,
		message: payload.message || 'Unknown error',
		status: payload.status,
		details: payload.details,
	};
}

/**
 * Build MCP tool error result with content + structuredContent { success: false, error: { code, message } }.
 */
export function buildToolErrorResult(component: string, error: unknown): {
	content: Array<{ type: 'text'; text: string }>;
	structuredContent: { success: false; error: McpErrorPayload };
} {
	const payload = toMcpErrorPayload(error);
	const structured = {
		success: false as const,
		error: payload,
	};
	return {
		content: [
			{ type: 'text' as const, text: `${component}: ${payload.message}` },
			{ type: 'text' as const, text: JSON.stringify(structured, null, 2) },
		],
		structuredContent: structured,
	};
}
