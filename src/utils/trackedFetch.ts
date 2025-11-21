// src/utils/trackedFetch.ts
// Wrapper around fetch to automatically track API calls

import { type ApiCall, apiCallTrackerService } from '../services/apiCallTrackerService';

/**
 * Extended RequestInit with optional actualPingOneUrl for tracking
 */
export interface TrackedFetchInit extends RequestInit {
	actualPingOneUrl?: string; // The actual PingOne API URL that will be called (for proxy endpoints)
}

/**
 * Tracked fetch wrapper that automatically logs API calls to PingOne
 */
export async function trackedFetch(
	input: RequestInfo | URL,
	init?: TrackedFetchInit
): Promise<Response> {
	const url =
		typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

	// Only track API calls to PingOne domains
	const isPingOneCall =
		url.includes('pingone.com') ||
		url.includes('pingone.eu') ||
		url.includes('pingone.asia') ||
		url.includes('pingone.ca') ||
		url.startsWith('/api/');

	if (!isPingOneCall) {
		// For non-PingOne calls, just use regular fetch
		return fetch(input, init);
	}

	const startTime = Date.now();
	const method = (init?.method || 'GET').toUpperCase() as
		| 'GET'
		| 'POST'
		| 'PUT'
		| 'DELETE'
		| 'PATCH';

	// Parse query params from URL
	const urlObj = new URL(url, window.location.origin);
	const queryParams: Record<string, string> = {};
	urlObj.searchParams.forEach((value, key) => {
		queryParams[key] = value;
	});

	// Extract headers
	const headers: Record<string, string> = {};
	if (init?.headers) {
		if (init.headers instanceof Headers) {
			init.headers.forEach((value, key) => {
				headers[key] = value;
			});
		} else if (Array.isArray(init.headers)) {
			init.headers.forEach(([key, value]) => {
				headers[key] = String(value);
			});
		} else {
			Object.entries(init.headers).forEach(([key, value]) => {
				headers[key] = String(value);
			});
		}
	}

	// Extract body
	let body: string | object | null = null;
	if (init?.body) {
		if (typeof init.body === 'string') {
			// Try to parse string as JSON for better display
			try {
				body = JSON.parse(init.body);
			} catch {
				// If not valid JSON, keep as string
				body = init.body;
			}
		} else if (init.body instanceof FormData || init.body instanceof URLSearchParams) {
			body = init.body.toString();
		} else if (
			init.body instanceof Blob ||
			init.body instanceof ArrayBuffer ||
			'byteLength' in init.body
		) {
			// Skip tracking for binary data types
			body = '[Binary data]';
		} else {
			try {
				// Try to parse as JSON string
				const bodyStr = String(init.body as unknown);
				body = JSON.parse(bodyStr);
			} catch {
				body = String(init.body as unknown);
			}
		}
	}

	// Extract actualPingOneUrl if provided
	const actualPingOneUrl = init?.actualPingOneUrl;

	// Track the API call
	const callData: Omit<ApiCall, 'id' | 'timestamp'> = {
		method,
		url,
		headers,
		body,
	};
	if (Object.keys(queryParams).length > 0) {
		callData.queryParams = queryParams;
	}
	if (actualPingOneUrl) {
		callData.actualPingOneUrl = actualPingOneUrl;
	}
	const callId = apiCallTrackerService.trackApiCall(callData);

	try {
		// Make the actual fetch call
		const response = await fetch(input, init);
		const duration = Date.now() - startTime;

		// Clone response to read body without consuming it
		const clonedResponse = response.clone();

		// Read response body
		let responseData: unknown;
		let responseError: string | undefined;

		try {
			const contentType = response.headers.get('content-type') || '';
			if (contentType.includes('application/json')) {
				responseData = await clonedResponse.json();
			} else {
				const text = await clonedResponse.text();
				try {
					responseData = JSON.parse(text);
				} catch {
					responseData = text;
				}
			}
		} catch (error) {
			responseError = error instanceof Error ? error.message : 'Failed to read response';
		}

		// Extract response headers
		const responseHeaders: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});

		// Update the tracked call with response
		const responseData_obj: ApiCall['response'] = {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		};
		if (responseData !== undefined) {
			responseData_obj.data = responseData;
		}
		if (responseError) {
			responseData_obj.error = responseError;
		}
		apiCallTrackerService.updateApiCallResponse(callId, responseData_obj, duration);

		return response;
	} catch (error) {
		const duration = Date.now() - startTime;

		// Update with error
		apiCallTrackerService.updateApiCallResponse(
			callId,
			{
				status: 0,
				statusText: 'Network Error',
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			duration
		);

		throw error;
	}
}
