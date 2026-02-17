/**
 * @file pingOneFetch.ts
 * @module utils
 * @description Shared helper that wraps fetch with PingOne best-practice defaults
 *              (Accept headers, transient retry handling, forward-compatible fallbacks).
 */

import { apiCallTrackerService } from '@/services/apiCallTrackerService';

const DEFAULT_RETRY_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

export interface PingOneFetchRetryOptions {
	maxAttempts?: number;
	baseDelayMs?: number;
	backoffFactor?: number;
	statusCodes?: number[];
}

export interface PingOneFetchOptions extends RequestInit {
	retry?: PingOneFetchRetryOptions;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfter = (headerValue: string | null): number | null => {
	if (!headerValue) {
		return null;
	}

	// Retry-After can be seconds or HTTP-date. Handle seconds safely.
	const seconds = Number(headerValue);
	if (!Number.isNaN(seconds)) {
		return Math.max(0, seconds * 1000);
	}

	const date = new Date(headerValue);
	const delta = date.getTime() - Date.now();
	return Number.isNaN(delta) ? null : Math.max(0, delta);
};

const normalizeHeaders = (headers: HeadersInit | undefined): Record<string, string> => {
	if (!headers) {
		return {};
	}

	if (headers instanceof Headers) {
		return Object.fromEntries(headers.entries());
	}

	if (Array.isArray(headers)) {
		return Object.fromEntries(headers);
	}

	return { ...headers };
};

const decodeBase64 = (value: string): string => {
	if (typeof window !== 'undefined' && typeof window.atob === 'function') {
		return window.atob(value);
	}
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(value, 'base64').toString('utf-8');
	}
	throw new Error('No base64 decoder available in this environment');
};

const fetchBackendCallsById = async (callId: string) => {
	try {
		const resp = await fetch(`/api/pingone/calls/${encodeURIComponent(callId)}`, {
			credentials: 'same-origin',
		});
		if (!resp.ok) {
			return null;
		}
		return resp.json() as Promise<{ calls: unknown }>;
	} catch (error) {
		// Suppress connection refused errors when server is down
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (
			!errorMessage.includes('ERR_CONNECTION_REFUSED') &&
			!errorMessage.includes('Failed to fetch')
		) {
			console.warn('[pingOneFetch] Failed to fetch backend call metadata', error);
		}
		return null;
	}
};

const processBackendCalls = (
	calls: Array<{
		url: string;
		method: string;
		status: number;
		statusText?: string;
		requestId?: string;
		duration?: number;
		timestamp?: number;
		responseBodyBase64?: string;
		requestBodyBase64?: string;
		requestHeaders?: Record<string, string>;
	}>
) => {
	if (!Array.isArray(calls)) {
		return;
	}
	calls.forEach((call) => {
		if (!call?.url || !call?.method) {
			return;
		}
		let body: string | object | null = null;
		if (call.requestBodyBase64) {
			try {
				const decodedBody = decodeBase64(call.requestBodyBase64);
				body = JSON.parse(decodedBody);
			} catch {
				body = decodeBase64(call.requestBodyBase64);
			}
		}
		let responseData: unknown = null;
		if (call.responseBodyBase64) {
			try {
				responseData = JSON.parse(decodeBase64(call.responseBodyBase64));
			} catch {
				responseData = decodeBase64(call.responseBodyBase64);
			}
		}

		const trackedId = apiCallTrackerService.trackApiCall({
			method: call.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
			url: call.url,
			headers:
				call.requestHeaders ||
				(call.requestId ? { 'pingone-request-id': call.requestId } : undefined),
			body,
			source: 'backend',
			isProxy: false,
		});
		apiCallTrackerService.updateApiCallResponse(
			trackedId,
			{
				status: call.status,
				statusText: call.statusText ?? '',
				data: responseData ?? undefined,
			},
			call.duration
		);
	});
};

const logBackendPingOneCalls = async (response: Response) => {
	const header = response.headers.get('x-pingone-calls');
	if (header) {
		try {
			const decoded = JSON.parse(decodeBase64(header));
			processBackendCalls(decoded);
			return;
		} catch (error) {
			console.warn('[pingOneFetch] Failed to parse inline backend call metadata', error);
		}
	}
	const callId = response.headers.get('x-pingone-calls-id');
	if (!callId) {
		return;
	}
	const payload = await fetchBackendCallsById(callId);
	if (!payload || !payload.calls) {
		return;
	}
	processBackendCalls(payload.calls);
};

/**
 * pingOneFetch – wraps fetch with
 *  - Accept header default (JSON + HAL for forward compatibility)
 *  - Automatic retries for transient PingOne responses
 *  - Respect for Retry-After headers
 */
export async function pingOneFetch(
	input: RequestInfo | URL,
	init: PingOneFetchOptions = {}
): Promise<Response> {
	const headers = normalizeHeaders(init.headers);

	// Forward compatibility guidance: Accept both JSON and HAL without failing on future formats.
	if (!headers.Accept) {
		headers.Accept = 'application/json, application/problem+json, application/hal+json;q=0.9';
	}

	const retryOptions = init.retry ?? {};
	const maxAttempts = retryOptions.maxAttempts ?? 3;
	const baseDelayMs = retryOptions.baseDelayMs ?? 500;
	const backoffFactor = retryOptions.backoffFactor ?? 2;
	const retryStatuses = new Set(retryOptions.statusCodes ?? Array.from(DEFAULT_RETRY_STATUSES));

	let attempt = 0;
	let _lastError: unknown;

	while (attempt < maxAttempts) {
		attempt += 1;

		// #region agent log - Debug instrumentation before fetch
		try {
				method: 'POST',
				headers: 'Content-Type': 'application/json' ,
				body: JSON.stringify(
					location: 'pingOneFetch.ts:198-BEFORE-FETCH',
					message: 'About to call fetch in pingOneFetch',
					data: 
						attempt,
						maxAttempts,
						url:
							typeof input === 'string'
								? input
								: input instanceof URL
									? input.toString()
									: 'Request object',
						method: init.method || 'GET',
						timestamp: Date.now(),,
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'request-hang',
					hypothesisId: 'BEFORE-FETCH',),
			}
		).catch(() => )
	}
	catch (_e)
	// #endregion

	try {
		const _response = await fetch(input, {
			...init,
			headers,
		});

		// #region agent log - Debug instrumentation after fetch
		try {
					method: 'POST',
					headers: 'Content-Type': 'application/json' ,
					body: JSON.stringify(
						location: 'pingOneFetch.ts:198-AFTER-FETCH',
						message: 'Fetch completed in pingOneFetch',
						data: 
							attempt,
							status: response.status,
							statusText: response.statusText,
							ok: response.ok,
							timestamp: Date.now(),,
						timestamp: Date.now(),
						sessionId: 'debug-session',
						runId: 'request-hang',
						hypothesisId: 'AFTER-FETCH',),
				}
		).catch(() => )
	} catch (_e) {}
	// #endregion

	if (!retryStatuses.has(response.status) || attempt === maxAttempts) {
		await logBackendPingOneCalls(response);
		return response;
	}

	const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
	const waitTime = retryAfter ?? baseDelayMs * backoffFactor ** (attempt - 1);

	if (response.body) {
		try {
			response.body.cancel();
		} catch {
			// ignore cancellation errors
		}
	}

	await delay(waitTime);
}
catch (error)
{
	lastError = error;
	if (attempt >= maxAttempts) {
		throw error;
	}

	const waitTime = baseDelayMs * backoffFactor ** (attempt - 1);
	await delay(waitTime);
}
}

throw lastError instanceof Error ? lastError : new Error('PingOne request failed after retries.');
}

export default pingOneFetch;
