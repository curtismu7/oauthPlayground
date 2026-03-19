/**
 * @file postmanRequestUtils.ts
 * @description Request body and header conversion utilities for Postman collections
 * @version 9.0.0
 */

import type { ApiCall as TrackedApiCall } from '../apiCallTrackerService';

/**
 * Convert request body to Postman format
 */
export const convertRequestBody = (
	requestBody: Record<string, unknown>,
	method: string
):
	| {
			mode: string;
			raw?: string;
			urlencoded?: Array<{ key: string; value: string }>;
			options?: {
				raw?: {
					language?: string;
				};
			};
	  }
	| undefined => {
	// Skip for GET/DELETE requests typically
	if (method === 'GET' || method === 'DELETE') {
		return undefined;
	}

	// Check if body is empty
	if (!requestBody || Object.keys(requestBody).length === 0) {
		return undefined;
	}

	// Check if body contains URL-encoded data
	const isUrlEncoded = Object.values(requestBody).some(
		(value) => typeof value === 'string' && value.includes('=')
	);

	if (isUrlEncoded) {
		// Convert to URL-encoded format
		const urlencoded = Object.entries(requestBody).map(([key, value]) => ({
			key,
			value: String(value),
		}));

		return {
			mode: 'urlencoded',
			urlencoded,
		};
	}

	// Default to raw JSON
	return {
		mode: 'raw',
		raw: JSON.stringify(requestBody, null, 2),
		options: {
			raw: {
				language: 'json',
			},
		},
	};
};

/**
 * Extract headers from API call
 */
export const extractHeaders = (
	apiCall: TrackedApiCall,
	method: string
): Array<{ key: string; value: string; type?: string }> => {
	const headers: Array<{ key: string; value: string; type?: string }> = [];

	// Add Content-Type for requests with body
	if (method !== 'GET' && method !== 'DELETE') {
		headers.push({
			key: 'Content-Type',
			value: 'application/json',
			type: 'default',
		});
	}

	// Add Authorization header if present
	if (apiCall.headers?.Authorization) {
		headers.push({
			key: 'Authorization',
			value: apiCall.headers.Authorization,
			type: 'default',
		});
	}

	// Add custom headers from the API call
	if (apiCall.headers) {
		Object.entries(apiCall.headers).forEach(([key, value]) => {
			if (key !== 'Content-Type' && key !== 'Authorization') {
				headers.push({
					key,
					value: String(value),
					type: 'default',
				});
			}
		});
	}

	return headers;
};

/**
 * Generate test script for extracting variables from response
 */
export const generateTestScript = (
	apiCall: TrackedApiCall,
	extractedVariables: string[]
): string[] => {
	const script: string[] = ['// Parse response JSON', 'var jsonData = pm.response.json();', ''];

	// Extract variables
	extractedVariables.forEach((variable) => {
		script.push(`// Extract ${variable}`);
		script.push(`if (jsonData.${variable}) {`);
		script.push(`    pm.environment.set("${variable}", jsonData.${variable});`);
		script.push(`    console.log("Set ${variable}:", jsonData.${variable});`);
		script.push('}');
		script.push('');
	});

	return script;
};
