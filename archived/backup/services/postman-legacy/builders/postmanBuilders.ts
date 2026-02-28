// src/services/builders/postmanBuilders.ts

import type { ApiCall as TrackedApiCall } from '../apiCallTrackerService';
import type { PostmanCollection, PostmanCollectionItem } from '../postmanTypes';
import { extractVariablesFromItem } from './scriptUtils';
import { formatHeaderValue, formatJsonBodyValue, formatUrlEncodedValue } from './valueFormatters';

/**
 * Convert request body to Postman format.
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
	if (!requestBody || Object.keys(requestBody).length === 0) {
		return undefined;
	}

	// For POST/PUT/PATCH with JSON, use raw JSON
	if (['POST', 'PUT', 'PATCH'].includes(method)) {
		// Check if it looks like form data
		const isFormData = Object.values(requestBody).every(
			(v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
		);

		if (isFormData) {
			return {
				mode: 'urlencoded',
				urlencoded: Object.entries(requestBody).map(([key, value]) => ({
					key,
					value: formatUrlEncodedValue(value),
				})),
			};
		}

		return {
			mode: 'raw',
			raw: JSON.stringify(formatJsonBodyValue(requestBody), null, 2),
			options: {
				raw: {
					language: 'json',
				},
			},
		};
	}

	return undefined;
};

/**
 * Extract headers from API call.
 */
export const extractHeaders = (
	apiCall: TrackedApiCall,
	method: string
): Array<{ key: string; value: string; type?: string }> => {
	const headers: Array<{ key: string; value: string; type?: string }> = [];

	// Use headers from API call if available
	if (apiCall.headers) {
		Object.entries(apiCall.headers).forEach(([key, value]) => {
			// Replace worker token with variable
			if (key.toLowerCase() === 'authorization' && typeof value === 'string') {
				headers.push({
					key: 'Authorization',
					value: value.replace(/Bearer\s+[\w.-]+/i, 'Bearer {{workerToken}}'),
				});
			} else {
				headers.push({ key, value: formatHeaderValue(value) });
			}
		});
	}

	// Add Content-Type based on request body if not already present
	if (
		['POST', 'PUT', 'PATCH'].includes(method) &&
		!headers.some((h) => h.key.toLowerCase() === 'content-type')
	) {
		const requestBody = apiCall.body || {};
		if (requestBody && typeof requestBody === 'object' && Object.keys(requestBody).length > 0) {
			// Check if it's form data
			const bodyObj = requestBody as Record<string, unknown>;
			const isFormData = Object.values(bodyObj).every(
				(v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
			);
			if (isFormData) {
				headers.push({ key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
			} else {
				headers.push({ key: 'Content-Type', value: 'application/json' });
			}
		}
	}

	// Add Authorization header if token is present in body and not already added
	if (!headers.some((h) => h.key.toLowerCase() === 'authorization')) {
		if (apiCall.body && typeof apiCall.body === 'object') {
			const body = apiCall.body as Record<string, unknown>;
			if (body.workerToken || body.access_token) {
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{workerToken}}',
				});
			}
		}
	}

	// Check for special Content-Type headers in endpoint
	const endpoint = apiCall.actualPingOneUrl || apiCall.url;
	if (endpoint.includes('deviceAuthentications')) {
		// Check if it's an assertion check
		if (apiCall.step?.toLowerCase().includes('assertion') || endpoint.includes('assertion')) {
			const existingContentType = headers.find((h) => h.key.toLowerCase() === 'content-type');
			if (!existingContentType) {
				headers.push({
					key: 'Content-Type',
					value: 'application/vnd.pingidentity.assertion.check+json',
				});
			}
		}
		// Check if it's device selection
		else if (apiCall.step?.toLowerCase().includes('select') || endpoint.includes('select')) {
			const existingContentType = headers.find((h) => h.key.toLowerCase() === 'content-type');
			if (!existingContentType) {
				headers.push({
					key: 'Content-Type',
					value: 'application/vnd.pingidentity.device.select+json',
				});
			}
		}
	}

	return headers;
};

/**
 * Helper function to enhance a Postman item's description with Variables Saved section.
 */
const enhanceItemDescription = (item: PostmanCollectionItem): PostmanCollectionItem => {
	const savedVariables = extractVariablesFromItem(item);

	if (item.request && savedVariables.length > 0) {
		// Check if description already has Variables Saved section
		const hasVariablesSection = item.request.description?.includes('**Variables Saved:**');

		if (!hasVariablesSection && item.request.description) {
			const varDescriptions: Record<string, string> = {
				workerToken:
					'Worker token for server-to-server authentication (Bearer token for API calls)',
				userToken: 'User access token (Bearer token for user API calls)',
				access_token: 'Access token for API authentication (Bearer token)',
				id_token: 'ID token containing user identity claims (OIDC)',
				refresh_token: 'Refresh token for obtaining new access tokens',
				expires_in: 'Token expiration time in seconds',
				device_code: 'Device code for polling token endpoint',
				user_code: 'User code to display for authorization',
				verification_uri: 'URI where user enters the user code',
				device_code_expires_in: 'Device code expiration time in seconds',
				polling_interval: 'Recommended polling interval in seconds',
				request_uri: 'Request URI for PAR (Pushed Authorization Request)',
				par_expires_in: 'PAR request URI expiration time in seconds',
				flowID: 'Flow ID for redirectless PingOne authentication',
				interactionId: 'Interaction ID for PingOne authentication flows',
				interactionToken: 'Interaction token for PingOne authentication flows',
				userId: 'User ID for the created user',
				deviceId: 'Device ID for MFA device',
				deviceAuthenticationPolicyId: 'Device authentication policy ID for MFA',
				deviceAuthenticationId: 'Device authentication ID for MFA',
				SignUpUserID: 'User ID from the Sign-up flow (used for registration)',
				SignUpUsername: 'Username from the Sign-up flow (used for registration)',
				SignInUserID: 'User ID from the Sign-in flow (used across all use cases)',
				SignInUsername: 'Username from the Sign-in flow',
				SignInUserEmail: 'Email from the Sign-in flow',
			};

			const variablesSection = savedVariables
				.map((varName) => {
					const description =
						varDescriptions[varName] || 'Saved to environment for use in subsequent requests';
					return `- \`${varName}\` - ${description}`;
				})
				.join('\n');

			item.request.description = `${item.request.description}\n\n**Variables Saved:**\n${variablesSection}`;
		}
	}

	// Recursively enhance nested items
	if (item.item && Array.isArray(item.item)) {
		item.item = item.item.map((nestedItem) => enhanceItemDescription(nestedItem));
	}

	return item;
};

/**
 * Helper function to enhance all items in a Postman collection with Variables Saved information.
 */
export const enhanceCollectionDescriptions = (collection: PostmanCollection): PostmanCollection => {
	if (collection.item && Array.isArray(collection.item)) {
		collection.item = collection.item.map((item) => enhanceItemDescription(item));
	}
	return collection;
};
