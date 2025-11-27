/**
 * @file pingOneFetch.ts
 * @module utils
 * @description Shared helper that wraps fetch with PingOne best-practice defaults
 *              (Accept headers, transient retry handling, forward-compatible fallbacks).
 */

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

/**
 * pingOneFetch – wraps fetch with
 *  - Accept header default (JSON + HAL for forward compatibility)
 *  - Automatic retries for transient PingOne responses
 *  - Respect for Retry-After headers
 */
export async function pingOneFetch(input: RequestInfo | URL, init: PingOneFetchOptions = {}): Promise<Response> {
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
	let lastError: unknown;

	while (attempt < maxAttempts) {
		attempt += 1;
		try {
			const response = await fetch(input, {
				...init,
				headers,
			});

			if (!retryStatuses.has(response.status) || attempt === maxAttempts) {
				return response;
			}

			const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
			const waitTime = retryAfter ?? baseDelayMs * Math.pow(backoffFactor, attempt - 1);

			if (response.body) {
				try {
					response.body.cancel();
				} catch {
					// ignore cancellation errors
				}
			}

			await delay(waitTime);
			continue;
		} catch (error) {
			lastError = error;
			if (attempt >= maxAttempts) {
				throw error;
			}

			const waitTime = baseDelayMs * Math.pow(backoffFactor, attempt - 1);
			await delay(waitTime);
		}
	}

	throw lastError instanceof Error ? lastError : new Error('PingOne request failed after retries.');
}

export default pingOneFetch;


