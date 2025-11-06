// src/utils/trackedFetch.ts
// Wrapper around fetch to automatically track API calls

import { apiCallTrackerService } from '../services/apiCallTrackerService';

/**
 * Tracked fetch wrapper that automatically logs API calls to PingOne
 */
export async function trackedFetch(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
	
	// Only track API calls to PingOne domains
	const isPingOneCall = url.includes('pingone.com') || url.includes('pingone.eu') || 
		url.includes('pingone.asia') || url.includes('pingone.ca') || url.startsWith('/api/');
	
	if (!isPingOneCall) {
		// For non-PingOne calls, just use regular fetch
		return fetch(input, init);
	}

	const startTime = Date.now();
	const method = (init?.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	
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
			body = init.body;
		} else if (init.body instanceof FormData || init.body instanceof URLSearchParams) {
			body = init.body.toString();
		} else {
			try {
				body = JSON.parse(init.body as string);
			} catch {
				body = String(init.body);
			}
		}
	}

	// Track the API call
	const callId = apiCallTrackerService.trackApiCall({
		method,
		url,
		headers,
		body,
		queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
	});

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
		apiCallTrackerService.updateApiCallResponse(
			callId,
			{
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
				data: responseData,
				error: responseError,
			},
			duration
		);

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


