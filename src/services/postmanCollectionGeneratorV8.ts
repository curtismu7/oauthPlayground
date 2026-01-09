/**
 * @file postmanCollectionGeneratorV8.ts
 * @module services
 * @description Generate Postman collections from API call documentation
 * @version 8.0.0
 */

import type { FlowType } from '@/v8/services/specVersionServiceV8';
import type { ApiCall as TrackedApiCall } from './apiCallTrackerService';

export interface PostmanCollectionItem {
	name: string;
	request?: {
		method: string;
		header?: Array<{ key: string; value: string; type?: string }>;
		body?: {
			mode: string;
			raw?: string;
			urlencoded?: Array<{ key: string; value: string }>;
			options?: {
				raw?: {
					language?: string;
				};
			};
		};
		url: {
			raw: string;
			protocol?: string;
			host?: string[];
			port?: string;
			path?: string[];
			query?: Array<{ key: string; value: string }>;
		};
		description?: string;
	};
	item?: PostmanCollectionItem[]; // For folders/nested collections
	response?: Array<unknown>;
	event?: Array<{
		listen: 'prerequest' | 'test';
		script: {
			exec: string[];
			type: string;
		};
	}>;
	description?: string;
}

export interface PostmanCollection {
	info: {
		name: string;
		description: string;
		schema: string;
		version?: string;
	};
	variable: Array<{
		key: string;
		value: string;
		type?: string;
	}>;
	item: PostmanCollectionItem[];
}

/**
 * Convert API endpoint to Postman format with {{authPath}} and {{envID}} variables
 * Format: {{authPath}}/{{envID}}/path/to/endpoint
 */
const convertEndpointToPostman = (endpoint: string): string => {
	// Replace common patterns with Postman variables
	let result = endpoint;

	// Replace https://auth.pingone.com with {{authPath}} (keep protocol in variable)
	result = result.replace(/https?:\/\/auth\.pingone\.(com|eu|asia)/g, '{{authPath}}');
	result = result.replace(/https?:\/\/auth\.eu\.pingone\.com/g, '{{authPath}}');
	result = result.replace(/https?:\/\/auth\.asia\.pingone\.com/g, '{{authPath}}');

	// Replace environment ID with {{envID}} (UUID format)
	result = result.replace(/\/([a-f0-9-]{36})\//g, '/{{envID}}/');
	result = result.replace(/\/([a-f0-9-]{36})$/g, '/{{envID}}');
	result = result.replace(/env-[a-f0-9-]+/g, '{{envID}}');

	// Replace common variable patterns (single braces to double braces)
	result = result.replace(/\{environmentId\}/g, '{{envID}}');
	result = result.replace(/\{envID\}/g, '{{envID}}');
	result = result.replace(/\{authPath\}/g, '{{authPath}}');

	// Handle cases where endpoint might already have variables but single braces
	result = result.replace(/\{(\w+)\}/g, '{{$1}}');

	// Ensure format is {{authPath}}/{{envID}}/... (no leading protocol)
	// If result starts with {{authPath}}, it's already in the right format
	// If it starts with https://{{authPath}}, remove the protocol
	result = result.replace(/^https:\/\/{{authPath}}/, '{{authPath}}');
	result = result.replace(/^http:\/\/{{authPath}}/, '{{authPath}}');

	return result;
};

/**
 * Parse URL into Postman URL structure
 */
const parseUrl = (rawUrl: string): {
	raw: string;
	host?: string[];
	path?: string[];
	query?: Array<{ key: string; value: string }>;
} => {
	// Handle Postman variable format {{authPath}}/{{envID}}/...
	// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
	if (rawUrl.includes('{{authPath}}')) {
		// Format: {{authPath}}/{{envID}}/path
		// {{authPath}} = https://auth.pingone.com (includes protocol)
		// For Postman, the raw URL should be: {{authPath}}/{{envID}}/path
		const parts = rawUrl.split('/').filter(Boolean);
		
		// First part is {{authPath}}, rest are path parts
		const path = parts.slice(1); // Skip {{authPath}}

		// Extract query parameters if present
		const query: Array<{ key: string; value: string }> = [];
		const queryIndex = rawUrl.indexOf('?');
		if (queryIndex !== -1) {
			const queryString = rawUrl.substring(queryIndex + 1);
			const params = new URLSearchParams(queryString);
			params.forEach((value, key) => {
				query.push({ key, value });
			});
		}

		// For Postman, use raw URL format matching documentation: {{authPath}}/{{envID}}/...
		// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
		// The raw URL should be exactly: {{authPath}}/{{envID}}/path
		// Postman will substitute {{authPath}} with its value (which includes protocol)
		return {
			raw: rawUrl, // Keep raw URL with {{authPath}}/{{envID}}/... format
			protocol: 'https',
			host: ['{{authPath}}'], // Use variable as host (Postman will substitute the full URL)
			...(path.length > 0 && { path }),
			...(query.length > 0 && { query }),
		};
	}

	// Fallback: try to parse as regular URL
	try {
		const url = new URL(rawUrl);
		const pathParts = url.pathname.split('/').filter(Boolean);

		// Extract host
		const host = url.host.split('.');

		// Extract path parts (replace envID with variable)
		const path = pathParts.map((part) => {
			if (part.match(/^[a-f0-9-]{36}$/)) {
				return '{{envID}}';
			}
			return part;
		});

		// Extract query parameters
		const query: Array<{ key: string; value: string }> = [];
		url.searchParams.forEach((value, key) => {
			query.push({ key, value });
		});

		return {
			raw: rawUrl,
			host,
			...(path.length > 0 && { path }),
			...(query.length > 0 && { query }),
		};
	} catch {
		// If URL parsing fails, return raw URL with basic structure
		const parts = rawUrl.split('/').filter(Boolean);
		return {
			raw: rawUrl,
			path: parts,
		};
	}
};

/**
 * Convert request body to Postman format
 */
const convertRequestBody = (
	requestBody: Record<string, unknown>,
	method: string
): {
	mode: string;
	raw?: string;
	urlencoded?: Array<{ key: string; value: string }>;
} | undefined => {
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
					value: String(value),
				})),
			};
		}

		return {
			mode: 'raw',
			raw: JSON.stringify(requestBody, null, 2),
		};
	}

	return undefined;
};

/**
 * Extract headers from API call
 */
const extractHeaders = (
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
				headers.push({ key, value: String(value) });
			}
		});
	}

	// Add Content-Type based on request body if not already present
	if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.some((h) => h.key.toLowerCase() === 'content-type')) {
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
 * Generate Postman collection from API calls
 */
export const generatePostmanCollection = (
	apiCalls: TrackedApiCall[],
	flowType: FlowType,
	specVersion: string,
	credentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
	}
): PostmanCollection => {
	const flowTypeLabels: Record<FlowType, string> = {
		'oauth-authz': 'Authorization Code',
		hybrid: 'Hybrid',
		implicit: 'Implicit',
		'client-credentials': 'Client Credentials',
		'device-code': 'Device Code',
	};

	const collectionName = `PingOne ${flowTypeLabels[flowType]} Flow (${specVersion})`;

	// Build variables - match PingOne Postman collection format
	// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
	const variables: Array<{ key: string; value: string; type?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{ key: 'envID', value: credentials?.environmentId || '', type: 'string' },
	];

	if (credentials?.clientId) {
		variables.push({ key: 'client_id', value: credentials.clientId, type: 'string' });
	}

	if (credentials?.clientSecret) {
		variables.push({ key: 'client_secret', value: credentials.clientSecret, type: 'secret' });
	}

	// Note: workerToken is NOT included in individual flow collections
	// Worker token is global and obtained separately outside of individual flows

	// Build collection items with educational comments and variable extraction scripts
	const items: PostmanCollectionItem[] = apiCalls.map((apiCall) => {
		// Get endpoint (prefer actualPingOneUrl if available, otherwise use url)
		const endpoint = apiCall.actualPingOneUrl || apiCall.url;
		const postmanUrl = convertEndpointToPostman(endpoint);
		const urlStructure = parseUrl(postmanUrl);
		const headers = extractHeaders(apiCall, apiCall.method);
		const body = convertRequestBody(apiCall.body as Record<string, unknown>, apiCall.method);

		// Build comprehensive educational description
		let educationalDescription = apiCall.step || `${apiCall.method} ${endpoint}`;
		
		// Add flow-specific educational context
		if (endpoint.includes('/as/authorize')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- This is the authorization request step in OAuth 2.0 flow\n';
			educationalDescription += '- User is redirected to PingOne login page\n';
			educationalDescription += '- After authentication, user is redirected back with authorization code\n';
			educationalDescription += '- Authorization code is single-use and short-lived\n';
			educationalDescription += '- State parameter should be validated to prevent CSRF attacks\n';
			if (endpoint.includes('code_challenge')) {
				educationalDescription += '- PKCE (Proof Key for Code Exchange) is used for enhanced security\n';
				educationalDescription += '- code_challenge is sent in this request (public value)\n';
			}
		} else if (endpoint.includes('/as/token')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			if (apiCall.body && typeof apiCall.body === 'object') {
				const body = apiCall.body as Record<string, unknown>;
				if (body.grant_type === 'authorization_code') {
					educationalDescription += '- Exchanges authorization code for access token and ID token\n';
					educationalDescription += '- Authorization code must match the one from authorization request\n';
					educationalDescription += '- redirect_uri must match the one used in authorization request\n';
					if (body.code_verifier) {
						educationalDescription += '- code_verifier must match code_challenge from authorization request\n';
						educationalDescription += '- Server verifies: SHA256(code_verifier) === code_challenge\n';
					}
				} else if (body.grant_type === 'client_credentials') {
					educationalDescription += '- Client Credentials grant for server-to-server authentication\n';
					educationalDescription += '- No user interaction required\n';
					educationalDescription += '- Returns access token for API calls\n';
				} else if (body.grant_type === 'urn:ietf:params:oauth:grant-type:device_code') {
					educationalDescription += '- Device Code grant for devices without browsers\n';
					educationalDescription += '- Polls for tokens after user authorizes on another device\n';
					educationalDescription += '- Returns access token when user completes authorization\n';
				}
			}
			educationalDescription += '- Response includes access_token, id_token (if OIDC), and refresh_token (if requested)\n';
		} else if (endpoint.includes('/as/introspect')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- Token introspection validates and returns token information\n';
			educationalDescription += '- Requires worker token for authentication\n';
			educationalDescription += '- Returns token metadata (active, exp, scopes, etc.)\n';
		} else if (endpoint.includes('/as/userinfo')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- UserInfo endpoint returns user identity claims\n';
			educationalDescription += '- Requires access token in Authorization header\n';
			educationalDescription += '- Returns user information (sub, name, email, etc.)\n';
		} else if (endpoint.includes('/as/device_authorization')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- Device Authorization Request (RFC 8628)\n';
			educationalDescription += '- Returns device_code and user_code for device flow\n';
			educationalDescription += '- User enters user_code on another device to authorize\n';
		} else if (endpoint.includes('/as/par')) {
			educationalDescription += '\n\n**Educational Context:**\n';
			educationalDescription += '- Pushed Authorization Request (PAR, RFC 9126)\n';
			educationalDescription += '- Pushes authorization parameters to server before redirect\n';
			educationalDescription += '- Returns request_uri that is used in authorization URL\n';
			educationalDescription += '- More secure than sending all parameters in URL\n';
		}

		// Determine what variables to extract based on endpoint and response
		const events: Array<{ listen: string; script: { exec: string[]; type: string } }> = [];
		
		// Add test script to extract variables from response
		if (endpoint.includes('/as/token')) {
			events.push({
				listen: 'test',
				script: {
					exec: [
						'// ============================================',
						'// Token Extraction Script',
						'// ============================================',
						'// This script automatically extracts tokens from the token exchange response',
						'// and saves them to environment variables for use in subsequent requests.',
						'',
						'if (pm.response.code === 200) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract access token (used for API authentication)',
						'    if (jsonData.access_token) {',
						'        pm.environment.set("access_token", jsonData.access_token);',
						'        console.log("✅ Access token saved to environment");',
						'    }',
						'    ',
						'    // Extract ID token (contains user identity claims)',
						'    if (jsonData.id_token) {',
						'        pm.environment.set("id_token", jsonData.id_token);',
						'        console.log("✅ ID token saved to environment");',
						'    }',
						'    ',
						'    // Extract refresh token (used to get new access tokens)',
						'    if (jsonData.refresh_token) {',
						'        pm.environment.set("refresh_token", jsonData.refresh_token);',
						'        console.log("✅ Refresh token saved to environment");',
						'    }',
						'    ',
						'    // Extract token expiration time',
						'    if (jsonData.expires_in) {',
						'        pm.environment.set("expires_in", jsonData.expires_in);',
						'    }',
						'} else {',
						'    console.log("❌ Token exchange failed:", pm.response.code);',
						'    console.log("Response:", pm.response.text());',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (endpoint.includes('/as/device_authorization')) {
			events.push({
				listen: 'test',
				script: {
					exec: [
						'// ============================================',
						'// Device Code Extraction Script',
						'// ============================================',
						'// This script extracts device_code and user_code from device authorization response',
						'',
						'if (pm.response.code === 200) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract device_code (used for polling tokens)',
						'    if (jsonData.device_code) {',
						'        pm.environment.set("device_code", jsonData.device_code);',
						'        console.log("✅ Device code saved to environment");',
						'    }',
						'    ',
						'    // Extract user_code (display to user for authorization)',
						'    if (jsonData.user_code) {',
						'        pm.environment.set("user_code", jsonData.user_code);',
						'        console.log("✅ User code saved to environment:", jsonData.user_code);',
						'    }',
						'    ',
						'    // Extract verification URI',
						'    if (jsonData.verification_uri) {',
						'        pm.environment.set("verification_uri", jsonData.verification_uri);',
						'        console.log("✅ Verification URI:", jsonData.verification_uri);',
						'    }',
						'    ',
						'    // Extract expiration time',
						'    if (jsonData.expires_in) {',
						'        pm.environment.set("device_code_expires_in", jsonData.expires_in);',
						'    }',
						'    ',
						'    // Extract polling interval',
						'    if (jsonData.interval) {',
						'        pm.environment.set("polling_interval", jsonData.interval);',
						'    }',
						'} else {',
						'    console.log("❌ Device authorization failed:", pm.response.code);',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (endpoint.includes('/as/par')) {
			events.push({
				listen: 'test',
				script: {
					exec: [
						'// ============================================',
						'// PAR Request URI Extraction Script',
						'// ============================================',
						'// This script extracts request_uri from PAR response',
						'',
						'if (pm.response.code === 201) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract request_uri (used in authorization URL)',
						'    if (jsonData.request_uri) {',
						'        pm.environment.set("request_uri", jsonData.request_uri);',
						'        console.log("✅ Request URI saved to environment");',
						'    }',
						'    ',
						'    // Extract expiration time',
						'    if (jsonData.expires_in) {',
						'        pm.environment.set("par_expires_in", jsonData.expires_in);',
						'    }',
						'} else {',
						'    console.log("❌ PAR request failed:", pm.response.code);',
						'}',
					],
					type: 'text/javascript',
				},
			});
		}

		return {
			name: apiCall.step || `${apiCall.method} ${endpoint}`,
			request: {
				method: apiCall.method,
				...(headers.length > 0 && { header: headers }),
				...(body && { body }),
				url: urlStructure,
				description: educationalDescription,
			},
			...(events.length > 0 && { event: events }),
		};
	});

	return {
		info: {
			name: collectionName,
			description: `Postman collection for PingOne ${flowTypeLabels[flowType]} Flow (${specVersion}). Generated from OAuth Playground.`,
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: variables,
		item: items,
	};
};

/**
 * Generate Postman collection for MFA flows
 */
export const generateMFAPostmanCollection = (
	apiCalls: Array<{
		step: string;
		method: string;
		endpoint: string;
		description: string;
		requestBody: Record<string, unknown>;
		responseBody: Record<string, unknown>;
		notes?: string[];
	}>,
	deviceType: string,
	flowType: 'registration' | 'authentication',
	credentials?: {
		environmentId?: string;
		username?: string;
	}
): PostmanCollection => {
	const collectionName = `PingOne MFA ${deviceType} ${flowType === 'registration' ? 'Registration' : 'Authentication'}`;

	// Build variables - match PingOne Postman collection format
	// Reference: https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template
	// Note: workerToken is NOT included - it's global and obtained separately outside of individual flows
	const variables: Array<{ key: string; value: string; type?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{ key: 'apiPath', value: 'https://api.pingone.com', type: 'string' },
		{ key: 'envID', value: credentials?.environmentId || '', type: 'string' },
		{ key: 'username', value: credentials?.username || '', type: 'string' },
		{ key: 'userId', value: '', type: 'string' },
		{ key: 'deviceId', value: '', type: 'string' },
		{ key: 'deviceAuthenticationPolicyId', value: '', type: 'string' },
		{ key: 'deviceAuthenticationId', value: '', type: 'string' },
		{ key: 'otp_code', value: '', type: 'string' },
	];

	// Build collection items
	const items: PostmanCollectionItem[] = apiCalls.map((apiCall) => {
		const postmanUrl = convertEndpointToPostman(apiCall.endpoint);
		const urlStructure = parseUrl(postmanUrl);
		
		// Extract headers
		const headers: Array<{ key: string; value: string; type?: string }> = [];
		
		// Add Content-Type
		if (['POST', 'PUT', 'PATCH'].includes(apiCall.method)) {
			if (apiCall.endpoint.includes('deviceAuthentications')) {
				// Check for special content types
				if (apiCall.description?.toLowerCase().includes('assertion')) {
					headers.push({
						key: 'Content-Type',
						value: 'application/vnd.pingidentity.assertion.check+json',
					});
				} else if (apiCall.description?.toLowerCase().includes('select')) {
					headers.push({
						key: 'Content-Type',
						value: 'application/vnd.pingidentity.device.select+json',
					});
				} else {
					headers.push({ key: 'Content-Type', value: 'application/json' });
				}
			} else {
				headers.push({ key: 'Content-Type', value: 'application/json' });
			}
		}

		// Add Authorization header based on flow type
		// Note: Individual flow collections don't include workerToken
		// User flows use userToken, admin flows would use workerToken (but workerToken is global)
		if (apiCall.requestBody && typeof apiCall.requestBody === 'object') {
			const body = apiCall.requestBody as Record<string, unknown>;
			// Check if this is a user flow step (has userToken) or admin flow step
			if (apiCall.step.includes('Authorization Code') || apiCall.step.includes('Exchange') || apiCall.step.includes('Token')) {
				// User flow - uses userToken from OAuth login
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{userToken}}',
				});
			} else if (body.workerToken) {
				// Admin flow - but note: workerToken is global, not in individual collections
				// This is for reference only - actual collections won't include workerToken
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{workerToken}}',
				});
			} else if (apiCall.endpoint.includes('/users') || apiCall.endpoint.includes('/devices')) {
				// Most MFA API calls require authorization
				// Default to userToken for user flows, workerToken for admin flows
				// Since we don't know the flow type here, we'll use a variable that can be set
				headers.push({
					key: 'Authorization',
					value: 'Bearer {{userToken}}',
				});
			}
		}

		// Convert request body
		const body = convertRequestBody(apiCall.requestBody, apiCall.method);

		// Build comprehensive educational description
		let educationalDescription = apiCall.description || '';
		
		// Add notes as educational content if available
		if (apiCall.notes && apiCall.notes.length > 0) {
			educationalDescription += '\n\n**Educational Notes:**\n';
			apiCall.notes.forEach((note) => {
				educationalDescription += `- ${note}\n`;
			});
		}
		
		// Add flow context if available
		if (apiCall.step.includes('Worker Token')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This is the first step in Admin Flow\n';
			educationalDescription += '- Worker tokens are used for administrative operations\n';
			educationalDescription += '- No user login is required for this token\n';
			educationalDescription += '- Permissions are controlled by roles assigned to the client application\n';
			educationalDescription += '- **Note:** Worker token is obtained separately and is not included in individual flow collections\n';
		} else if (apiCall.step.includes('Authorization Code') || apiCall.step.includes('Build Authorization URL')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This is part of User Flow (OAuth 2.0 Authorization Code Flow)\n';
			educationalDescription += '- User must authenticate with PingOne before proceeding\n';
			educationalDescription += '- After login, user is redirected back with authorization code\n';
			educationalDescription += '- Authorization code is exchanged for access token (userToken)\n';
		} else if (apiCall.step.includes('Exchange') && apiCall.step.includes('Token')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- Exchanges authorization code for access token (userToken)\n';
			educationalDescription += '- userToken is used for subsequent MFA device operations\n';
			educationalDescription += '- Token is automatically extracted and saved by the test script\n';
		} else if (apiCall.step.includes('Get User ID') || apiCall.step.includes('User Lookup')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This step retrieves the user ID needed for device operations\n';
			educationalDescription += '- The userId will be used in subsequent API calls\n';
			educationalDescription += '- User ID is automatically extracted and saved by the test script\n';
		} else if (apiCall.step.includes('Create') && apiCall.step.includes('Device')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			if (apiCall.requestBody && typeof apiCall.requestBody === 'object') {
				const body = apiCall.requestBody as Record<string, unknown>;
				if (body.status === 'ACTIVE') {
					educationalDescription += '- Device is created with ACTIVE status (Admin Flow)\n';
					educationalDescription += '- Device is immediately usable, no OTP activation required\n';
					educationalDescription += '- This is only possible with worker token (Admin Flow)\n';
				} else if (body.status === 'ACTIVATION_REQUIRED') {
					educationalDescription += '- Device is created with ACTIVATION_REQUIRED status\n';
					educationalDescription += '- PingOne automatically sends OTP to the device\n';
					educationalDescription += '- User must activate device with OTP before first use\n';
					educationalDescription += '- User Flow always uses ACTIVATION_REQUIRED (security requirement)\n';
				}
			}
			educationalDescription += '- Device ID is automatically extracted and saved by the test script\n';
			educationalDescription += '- Policy ID links the device to an MFA authentication policy\n';
		} else if (apiCall.step.includes('Activate')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This step activates a device that was created with ACTIVATION_REQUIRED status\n';
			educationalDescription += '- OTP code is received via SMS/Email/WhatsApp/TOTP app\n';
			educationalDescription += '- After successful activation, device status changes to ACTIVE\n';
			educationalDescription += '- Device can now be used for MFA authentication\n';
		} else if (apiCall.step.includes('Initialize Device Authentication')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This starts the MFA authentication process\n';
			educationalDescription += '- PingOne sends OTP to the selected device\n';
			educationalDescription += '- Device Authentication ID is automatically extracted and saved\n';
			educationalDescription += '- This ID is used in subsequent authentication steps\n';
		} else if (apiCall.step.includes('Check OTP')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- User enters OTP code received on their device\n';
			educationalDescription += '- OTP is validated against the device authentication session\n';
			educationalDescription += '- If valid, authentication proceeds to completion\n';
		} else if (apiCall.step.includes('Complete Authentication')) {
			educationalDescription += '\n\n**Flow Context:**\n';
			educationalDescription += '- This finalizes the MFA authentication process\n';
			educationalDescription += '- Authentication is now complete and user can proceed\n';
		}

		// Determine what variables to extract based on endpoint and response
		const events: Array<{ listen: string; script: { exec: string[]; type: string } }> = [];
		
		// Add test script to extract variables from response
		if (apiCall.endpoint.includes('/users') && apiCall.method === 'GET' && apiCall.step.includes('User ID')) {
			// Extract userId from user lookup response
			events.push({
				listen: 'test',
				script: {
					exec: [
						'// ============================================',
						'// User ID Extraction Script',
						'// ============================================',
						'// This script extracts the user ID from the user lookup response',
						'// The userId is used in subsequent device operations',
						'',
						'if (pm.response.code === 200) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract userId from embedded users array',
						'    if (jsonData._embedded && jsonData._embedded.users && jsonData._embedded.users.length > 0) {',
						'        const userId = jsonData._embedded.users[0].id;',
						'        pm.environment.set("userId", userId);',
						'        console.log("✅ User ID saved to environment:", userId);',
						'    } else if (jsonData.id) {',
						'        // Direct user object response',
						'        pm.environment.set("userId", jsonData.id);',
						'        console.log("✅ User ID saved to environment:", jsonData.id);',
						'    }',
						'} else {',
						'    console.log("❌ User lookup failed:", pm.response.code);',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (apiCall.endpoint.includes('/devices') && apiCall.method === 'POST' && apiCall.step.includes('Create')) {
			// Extract deviceId from device creation response
			events.push({
				listen: 'test',
				script: {
					exec: [
						'// ============================================',
						'// Device ID Extraction Script',
						'// ============================================',
						'// This script extracts the device ID from the device creation response',
						'// The deviceId is used in subsequent device operations (activate, delete, etc.)',
						'',
						'if (pm.response.code === 201 || pm.response.code === 200) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract deviceId from response',
						'    if (jsonData.id) {',
						'        pm.environment.set("deviceId", jsonData.id);',
						'        console.log("✅ Device ID saved to environment:", jsonData.id);',
						'    }',
						'    ',
						'    // Also extract policy ID if available',
						'    if (jsonData.policy && jsonData.policy.id) {',
						'        pm.environment.set("deviceAuthenticationPolicyId", jsonData.policy.id);',
						'        console.log("✅ Policy ID saved to environment:", jsonData.policy.id);',
						'    }',
						'} else {',
						'    console.log("❌ Device creation failed:", pm.response.code);',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (apiCall.endpoint.includes('deviceAuthentications') && apiCall.method === 'POST' && apiCall.step.includes('Initialize')) {
			// Extract deviceAuthenticationId from device authentication initialization response
			events.push({
				listen: 'test',
				script: {
					exec: [
						'// ============================================',
						'// Device Authentication ID Extraction Script',
						'// ============================================',
						'// This script extracts the device authentication ID from the initialization response',
						'// The deviceAuthenticationId is used in subsequent authentication steps (check OTP, complete)',
						'',
						'if (pm.response.code === 201 || pm.response.code === 200) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract deviceAuthenticationId from response',
						'    if (jsonData.id) {',
						'        pm.environment.set("deviceAuthenticationId", jsonData.id);',
						'        console.log("✅ Device Authentication ID saved to environment:", jsonData.id);',
						'    }',
						'} else {',
						'    console.log("❌ Device authentication initialization failed:", pm.response.code);',
						'}',
					],
					type: 'text/javascript',
				},
			});
		} else if (apiCall.step.includes('Exchange') && apiCall.step.includes('Token') && apiCall.endpoint.includes('/as/token')) {
			// Extract userToken from token exchange response
			events.push({
				listen: 'test',
				script: {
					exec: [
						'// ============================================',
						'// User Token Extraction Script',
						'// ============================================',
						'// This script extracts the access token (userToken) from the token exchange response',
						'// The userToken is used for subsequent MFA device operations',
						'',
						'if (pm.response.code === 200) {',
						'    const jsonData = pm.response.json();',
						'    ',
						'    // Extract access token (userToken)',
						'    if (jsonData.access_token) {',
						'        pm.environment.set("userToken", jsonData.access_token);',
						'        console.log("✅ User token saved to environment");',
						'    }',
						'    ',
						'    // Also extract ID token if available (contains user ID)',
						'    if (jsonData.id_token) {',
						'        pm.environment.set("id_token", jsonData.id_token);',
						'        console.log("✅ ID token saved to environment");',
						'    }',
						'} else {',
						'    console.log("❌ Token exchange failed:", pm.response.code);',
						'}',
					],
					type: 'text/javascript',
				},
			});
		}

		return {
			name: apiCall.step,
			request: {
				method: apiCall.method,
				...(headers.length > 0 && { header: headers }),
				...(body && { body }),
				url: urlStructure,
				description: educationalDescription,
			},
			...(events.length > 0 && { event: events }),
		};
	});

	return {
		info: {
			name: collectionName,
			description: `Postman collection for PingOne MFA ${deviceType} ${flowType === 'registration' ? 'Registration' : 'Authentication'}. Generated from OAuth Playground.`,
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: variables,
		item: items,
	};
};

/**
 * Helper: Generate token extraction script based on spec version
 * OAuth 2.0: Only access_token and refresh_token (no id_token)
 * OIDC/OIDC 2.1: access_token, id_token, and refresh_token
 */
const generateTokenExtractionScript = (specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1'): string[] => {
	const baseScript = [
		'// ============================================',
		'// Token Extraction Script',
		'// ============================================',
		'// This script automatically extracts tokens from the token exchange response',
		'// and saves them to environment variables for use in subsequent requests.',
		'//',
		'if (pm.response.code === 200) {',
		'    const jsonData = pm.response.json();',
		'    if (jsonData.access_token) {',
		'        pm.environment.set("access_token", jsonData.access_token);',
		'    }',
	];
	
	if (specVersion === 'oidc' || specVersion === 'oidc2.1') {
		baseScript.push(
			'    // ID Token: Contains user identity information (JWT) - OIDC only',
			'    if (jsonData.id_token) {',
			'        pm.environment.set("id_token", jsonData.id_token);',
			'    }',
		);
	}
	
	baseScript.push(
		'    // Refresh Token: Used to obtain new access tokens when expired',
		'    if (jsonData.refresh_token) {',
		'        pm.environment.set("refresh_token", jsonData.refresh_token);',
		'    }',
		'}',
	);
	
	return baseScript;
};

/**
 * Helper: Get default scopes based on spec version
 * OAuth 2.0: No offline_access, no openid
 * OIDC: openid profile email (optional offline_access)
 * OIDC 2.1: openid profile email offline_access (offline_access recommended)
 */
const getDefaultScopes = (specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1'): string => {
	if (specVersion === 'oauth2.0') {
		return 'profile email'; // No openid, no offline_access
	}
	if (specVersion === 'oidc') {
		return 'openid profile email'; // Optional offline_access
	}
	// OIDC 2.1
	return 'openid profile email offline_access'; // offline_access recommended
};

/**
 * Helper: Build Authorization Code flow for a specific spec version
 */
const buildAuthorizationCodeFlow = (
	specVersion: 'oauth2.0' | 'oidc' | 'oidc2.1',
	authMethod: 'client_secret_post' | 'client_secret_basic' | 'client_secret_jwt' | 'private_key_jwt',
	baseUrl: string,
	includePKCE: boolean = false,
	includePAR: boolean = false,
	responseMode?: 'query' | 'fragment' | 'form_post'
): PostmanCollectionItem => {
	const responseModeLabel = responseMode === 'query' ? ' (Query String)' : responseMode === 'fragment' ? ' (URL Fragment)' : responseMode === 'form_post' ? ' (Form POST)' : '';
	const flowName = `Authorization Code - ${authMethod === 'client_secret_post' ? 'Client Secret Post' : authMethod === 'client_secret_basic' ? 'Client Secret Basic' : authMethod === 'client_secret_jwt' ? 'Client Secret JWT' : 'Private Key JWT'}${responseModeLabel}${includePKCE ? ' with PKCE' : ''}${includePAR ? ' and PAR' : ''}`;
	const scopeVarName = specVersion === 'oauth2.0' ? 'scopes_oauth2' : specVersion === 'oidc' ? 'scopes_oidc' : 'scopes_oidc21';
	const tokenExtractionScript = generateTokenExtractionScript(specVersion);
	
	const items: PostmanCollectionItem[] = [];
	
	// Step 1: Generate PKCE codes if needed
	if (includePKCE) {
		items.push({
			name: '1. Generate PKCE Codes',
			request: {
				method: 'GET',
				url: {
					raw: 'https://example.com/generate-pkce',
				},
				description: `**Generate PKCE Codes**\n\n**Educational Context:**\n- PKCE (Proof Key for Code Exchange) adds security to Authorization Code flow\n- ${specVersion === 'oidc2.1' ? 'REQUIRED for OIDC 2.1' : 'Optional for OIDC, recommended for all clients'}\n- Generates code_verifier (secret) and code_challenge (public)\n- Code challenge is SHA256 hash of code verifier`,
			},
			event: [
				{
					listen: 'prerequest',
					script: {
						exec: [
							'// Generate PKCE code verifier and challenge',
							'function generateCodeVerifier() {',
							'    const array = new Uint8Array(32);',
							'    crypto.getRandomValues(array);',
							'    return btoa(String.fromCharCode.apply(null, Array.from(array)))',
							'        .replace(/\\+/g, "-")',
							'        .replace(/\\//g, "_")',
							'        .replace(/=/g, "");',
							'}',
							'',
							'function generateCodeChallenge(verifier) {',
							'    return CryptoJS.SHA256(verifier).toString(CryptoJS.enc.Base64)',
							'        .replace(/\\+/g, "-")',
							'        .replace(/\\//g, "_")',
							'        .replace(/=/g, "");',
							'}',
							'',
							'const codeVerifier = generateCodeVerifier();',
							'const codeChallenge = generateCodeChallenge(codeVerifier);',
							'',
							'pm.environment.set("code_verifier", codeVerifier);',
							'pm.environment.set("code_challenge", codeChallenge);',
							'pm.environment.set("code_challenge_method", "S256");',
						],
						type: 'text/javascript',
					},
				},
			],
		});
	}
	
	// Step 2: Push Authorization Request (PAR) if needed
	if (includePAR) {
		items.push({
			name: `${items.length + 1}. Push Authorization Request (PAR)`,
			request: {
				method: 'POST',
				header: [
					{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
				],
				body: {
					mode: 'urlencoded',
					urlencoded: [
						{ key: 'client_id', value: '{{client_id}}' },
						{ key: 'response_type', value: 'code' },
						{ key: 'redirect_uri', value: '{{redirect_uri}}' },
						{ key: 'scope', value: `{{${scopeVarName}}}` },
						{ key: 'state', value: '{{state}}' },
						...(includePKCE ? [
							{ key: 'code_challenge', value: '{{code_challenge}}' },
							{ key: 'code_challenge_method', value: '{{code_challenge_method}}' },
						] : []),
					],
				},
				url: {
					raw: `${baseUrl}/as/par`,
					protocol: 'https',
					host: ['auth', 'pingone', 'com'],
					path: ['{{envID}}', 'as', 'par'],
				},
				description: '**Push Authorization Request (PAR)**\n\n**Educational Context:**\n- PAR (Pushed Authorization Requests) pushes auth parameters to server first\n- More secure than sending all parameters in URL\n- Returns request_uri that is used in authorization URL',
			},
			event: [
				{
					listen: 'test',
					script: {
						exec: [
							'if (pm.response.code === 201) {',
							'    const jsonData = pm.response.json();',
							'    if (jsonData.request_uri) {',
							'        pm.environment.set("request_uri", jsonData.request_uri);',
							'    }',
							'}',
						],
						type: 'text/javascript',
					},
				},
			],
		});
	}
	
	// Step 3: Build Authorization URL
	const authUrlQuery = [
		{ key: 'client_id', value: '{{client_id}}' },
		{ key: 'response_type', value: 'code' },
		{ key: 'redirect_uri', value: '{{redirect_uri}}' },
		{ key: 'scope', value: `{{${scopeVarName}}}` },
		{ key: 'state', value: '{{state}}' },
	];
	
	// Add response_mode parameter if specified
	if (responseMode) {
		authUrlQuery.push({ key: 'response_mode', value: responseMode });
	}
	
	if (includePKCE && !includePAR) {
		authUrlQuery.push(
			{ key: 'code_challenge', value: '{{code_challenge}}' },
			{ key: 'code_challenge_method', value: '{{code_challenge_method}}' },
		);
	}
	
	if (includePAR) {
		authUrlQuery.push({ key: 'request_uri', value: '{{request_uri}}' });
	}
	
	items.push({
		name: `${items.length + 1}. Build Authorization URL${includePKCE ? ' (with PKCE)' : ''}${includePAR ? ' (with PAR)' : ''}`,
		request: {
			method: 'GET',
			url: {
				raw: `${baseUrl}/as/authorize?${authUrlQuery.map(q => `${q.key}=${q.value}`).join('&')}`,
				protocol: 'https',
				host: ['auth', 'pingone', 'com'],
				path: ['{{envID}}', 'as', 'authorize'],
				query: authUrlQuery,
			},
			description: `**Authorization Code Grant - ${specVersion.toUpperCase()}${responseMode ? ` (${responseMode})` : ''}**\n\n**Educational Context:**\n- ${specVersion === 'oauth2.0' ? 'OAuth 2.0 Authorization Code flow (no ID token)' : specVersion === 'oidc' ? 'OpenID Connect Authorization Code flow (includes ID token)' : 'OIDC 2.1 Authorization Code flow (PKCE required, includes ID token)'}\n- Client authenticates using ${authMethod}\n- ${responseMode ? `Response Mode: ${responseMode === 'query' ? 'Code/tokens in URL query string (?code=abc)' : responseMode === 'fragment' ? 'Code/tokens in URL fragment (#access_token=xyz)' : 'Code/tokens via HTTP POST (not in URL)'}` : 'Default response mode for this flow'}\n- ${includePKCE ? (specVersion === 'oidc2.1' ? 'PKCE is REQUIRED for OIDC 2.1' : 'PKCE is optional but recommended') : 'No PKCE (not required for OAuth 2.0)'}\n- User authenticates and receives authorization code`,
		},
	});
	
	// Step 4: Exchange Authorization Code for Tokens
	const tokenBody: Array<{ key: string; value: string }> = [
		{ key: 'grant_type', value: 'authorization_code' },
		{ key: 'code', value: '{{authorization_code}}' },
		{ key: 'redirect_uri', value: '{{redirect_uri}}' },
	];
	
	const tokenHeaders: Array<{ key: string; value: string }> = [
		{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
	];
	
	if (authMethod === 'client_secret_post') {
		tokenBody.push(
			{ key: 'client_id', value: '{{client_id}}' },
			{ key: 'client_secret', value: '{{client_secret}}' },
		);
	} else if (authMethod === 'client_secret_basic') {
		tokenHeaders.push({ key: 'Authorization', value: 'Basic {{client_credentials_basic}}' });
	} else if (authMethod === 'client_secret_jwt') {
		tokenBody.push(
			{ key: 'client_id', value: '{{client_id}}' },
			{ key: 'client_assertion_type', value: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' },
			{ key: 'client_assertion', value: '{{client_assertion_jwt}}' },
		);
	} else if (authMethod === 'private_key_jwt') {
		tokenBody.push(
			{ key: 'client_id', value: '{{client_id}}' },
			{ key: 'client_assertion_type', value: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' },
			{ key: 'client_assertion', value: '{{client_assertion_jwt_private}}' },
		);
	}
	
	if (includePKCE) {
		tokenBody.push({ key: 'code_verifier', value: '{{code_verifier}}' });
	}
	
	items.push({
		name: `${items.length + 1}. Exchange Authorization Code for Tokens${includePKCE ? ' (with PKCE)' : ''}`,
		request: {
			method: 'POST',
			header: tokenHeaders,
			body: {
				mode: 'urlencoded',
				urlencoded: tokenBody,
			},
			url: {
				raw: `${baseUrl}/as/token`,
				protocol: 'https',
				host: ['auth', 'pingone', 'com'],
				path: ['{{envID}}', 'as', 'token'],
			},
			description: `**Token Exchange - ${specVersion.toUpperCase()}**\n\n**Educational Context:**\n- Exchanges authorization code for tokens\n- ${specVersion === 'oauth2.0' ? 'OAuth 2.0: Returns access_token only (no id_token)' : specVersion === 'oidc' ? 'OIDC: Returns access_token and id_token' : 'OIDC 2.1: Returns access_token and id_token (PKCE required)'}\n- ${specVersion === 'oidc' || specVersion === 'oidc2.1' ? 'Refresh token available if offline_access scope requested' : 'Refresh token available if requested'}\n- Client authenticates using ${authMethod}`,
		},
		event: [
			{
				listen: 'test',
				script: {
					exec: tokenExtractionScript,
					type: 'text/javascript',
				},
			},
		],
	});
	
	return {
		name: flowName,
		item: items,
	};
};

/**
 * Generate comprehensive Postman collection for all Unified flows
 * Groups flows by OAuth 2.0, OIDC, and OIDC 2.1
 */
export const generateComprehensiveUnifiedPostmanCollection = (
	credentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
	}
): PostmanCollection => {
	const baseUrl = '{{authPath}}/{{envID}}';

	// Build variables
	const variables: Array<{ key: string; value: string; type?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{ key: 'envID', value: credentials?.environmentId || '', type: 'string' },
	];

	if (credentials?.clientId) {
		variables.push({ key: 'client_id', value: credentials.clientId, type: 'string' });
	}

	if (credentials?.clientSecret) {
		variables.push({ key: 'client_secret', value: credentials.clientSecret, type: 'secret' });
	}

	variables.push({ key: 'workerToken', value: '', type: 'string' });
	variables.push({ key: 'redirect_uri', value: '', type: 'string' });
	variables.push({ key: 'scopes_oauth2', value: getDefaultScopes('oauth2.0'), type: 'string' });
	variables.push({ key: 'scopes_oidc', value: getDefaultScopes('oidc'), type: 'string' });
	variables.push({ key: 'scopes_oidc21', value: getDefaultScopes('oidc2.1'), type: 'string' });
	variables.push({ key: 'state', value: '', type: 'string' });
	variables.push({ key: 'authorization_code', value: '', type: 'string' });
	variables.push({ key: 'access_token', value: '', type: 'string' });
	variables.push({ key: 'id_token', value: '', type: 'string' });
	variables.push({ key: 'refresh_token', value: '', type: 'string' });
	variables.push({ key: 'code_verifier', value: '', type: 'string' });
	variables.push({ key: 'code_challenge', value: '', type: 'string' });
	variables.push({ key: 'code_challenge_method', value: 'S256', type: 'string' });
	variables.push({ key: 'client_credentials_basic', value: '', type: 'string' });
	variables.push({ key: 'client_secret_jwt', value: '', type: 'string' });
	variables.push({ key: 'client_assertion_jwt', value: '', type: 'string' });
	variables.push({ key: 'private_key_jwt', value: '', type: 'string' });
	variables.push({ key: 'client_assertion_jwt_private', value: '', type: 'string' });
	variables.push({ key: 'pi_flow_id', value: '', type: 'string' });
	variables.push({ key: 'request_uri', value: '', type: 'string' });
	variables.push({ key: 'device_code', value: '', type: 'string' });
	variables.push({ key: 'nonce', value: '', type: 'string' });
	variables.push({ key: 'response_mode', value: 'query', type: 'string' });
	variables.push({ key: 'redirectless_flowId', value: '', type: 'string' });
	variables.push({ key: 'redirectless_resumeUrl', value: '', type: 'string' });
	variables.push({ key: 'redirectless_sessionId', value: '', type: 'string' });
	variables.push({ key: 'redirectless_status', value: '', type: 'string' });
	variables.push({ key: 'username', value: '', type: 'string' });
	variables.push({ key: 'password', value: '', type: 'string' });
	variables.push({ key: 'otp_code', value: '', type: 'string' });

	// Build collection items grouped by OAuth 2.0, OIDC, and OIDC 2.1
	const oauth20Items: PostmanCollectionItem[] = [];
	const oidcItems: PostmanCollectionItem[] = [];
	const oidc21Items: PostmanCollectionItem[] = [];

	// ============================================
	// OAuth 2.0 Flows
	// ============================================
	// OAuth 2.0: Simple Authorization Code with Query String (default, no PKCE, no id_token, no offline_access)
	oauth20Items.push(buildAuthorizationCodeFlow('oauth2.0', 'client_secret_post', baseUrl, false, false, 'query'));
	oauth20Items.push(buildAuthorizationCodeFlow('oauth2.0', 'client_secret_basic', baseUrl, false, false, 'query'));
	oauth20Items.push(buildAuthorizationCodeFlow('oauth2.0', 'client_secret_jwt', baseUrl, false, false, 'query'));
	oauth20Items.push(buildAuthorizationCodeFlow('oauth2.0', 'private_key_jwt', baseUrl, false, false, 'query'));
	
	// OAuth 2.0: Authorization Code with Form POST (enhanced security)
	oauth20Items.push(buildAuthorizationCodeFlow('oauth2.0', 'client_secret_post', baseUrl, false, false, 'form_post'));

	// OAuth 2.0: Client Credentials
	oauth20Items.push({
		name: 'Client Credentials',
		item: [
			{
				name: 'Get Access Token',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'client_credentials' },
							{ key: 'scope', value: '{{scopes_oauth2}}' },
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'client_secret', value: '{{client_secret}}' },
						],
					},
					url: {
						raw: `${baseUrl}/as/token`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'token'],
					},
					description: '**Client Credentials Grant - OAuth 2.0**\n\n**Educational Context:**\n- Server-to-server authentication (no user involved)\n- Returns access_token only (no id_token, no refresh_token)\n- Used for machine-to-machine communication\n- OAuth 2.0: No offline_access scope needed',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'// OAuth 2.0: Extract access_token only (no id_token)',
									'if (pm.response.code === 200) {',
									'    const jsonData = pm.response.json();',
									'    if (jsonData.access_token) {',
									'        pm.environment.set("access_token", jsonData.access_token);',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			},
		],
	});

	// ============================================
	// OIDC Flows
	// ============================================
	// OIDC: Simple Authorization Code with Query String (no PKCE required, but optional)
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, false, false, 'query'));
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_basic', baseUrl, false, false, 'query'));
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_jwt', baseUrl, false, false, 'query'));
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'private_key_jwt', baseUrl, false, false, 'query'));
	
	// OIDC: Authorization Code with URL Fragment (for SPAs)
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, false, false, 'fragment'));
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_basic', baseUrl, false, false, 'fragment'));
	
	// OIDC: Authorization Code with Form POST (enhanced security)
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, false, false, 'form_post'));
	
	// OIDC: Authorization Code with PKCE and Query String (optional)
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, true, false, 'query'));
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_basic', baseUrl, true, false, 'query'));
	
	// OIDC: Authorization Code with PKCE and URL Fragment (optional)
	oidcItems.push(buildAuthorizationCodeFlow('oidc', 'client_secret_post', baseUrl, true, false, 'fragment'));

	// OIDC: Implicit Flow (deprecated but still supported)
	// Implicit flow uses fragment by default (required by spec)
	oidcItems.push({
		name: 'Implicit Flow (URL Fragment)',
		item: [
			{
				name: '1. Build Authorization URL',
				request: {
					method: 'GET',
					url: {
						raw: `${baseUrl}/as/authorize?client_id={{client_id}}&response_type=id_token token&redirect_uri={{redirect_uri}}&scope={{scopes_oidc}}&state={{state}}&nonce={{nonce}}&response_mode=fragment`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'authorize'],
						query: [
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'response_type', value: 'id_token token' },
							{ key: 'redirect_uri', value: '{{redirect_uri}}' },
							{ key: 'scope', value: '{{scopes_oidc}}' },
							{ key: 'state', value: '{{state}}' },
							{ key: 'nonce', value: '{{nonce}}' },
							{ key: 'response_mode', value: 'fragment' },
						],
					},
					description: '**Implicit Flow - OIDC (URL Fragment)**\n\n**Educational Context:**\n- OIDC Implicit flow (deprecated in OAuth 2.1, but still supported)\n- Tokens returned directly in URL fragment (not secure)\n- Returns access_token and id_token\n- No refresh_token (use Authorization Code flow instead)\n- Requires nonce for id_token validation\n- response_mode=fragment is the default for implicit flow',
				},
			},
		],
	});
	
	// OIDC: Implicit Flow with Form POST (alternative)
	oidcItems.push({
		name: 'Implicit Flow (Form POST)',
		item: [
			{
				name: '1. Build Authorization URL',
				request: {
					method: 'GET',
					url: {
						raw: `${baseUrl}/as/authorize?client_id={{client_id}}&response_type=id_token token&redirect_uri={{redirect_uri}}&scope={{scopes_oidc}}&state={{state}}&nonce={{nonce}}&response_mode=form_post`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'authorize'],
						query: [
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'response_type', value: 'id_token token' },
							{ key: 'redirect_uri', value: '{{redirect_uri}}' },
							{ key: 'scope', value: '{{scopes_oidc}}' },
							{ key: 'state', value: '{{state}}' },
							{ key: 'nonce', value: '{{nonce}}' },
							{ key: 'response_mode', value: 'form_post' },
						],
					},
					description: '**Implicit Flow - OIDC (Form POST)**\n\n**Educational Context:**\n- OIDC Implicit flow with form_post response mode\n- More secure than fragment (no tokens in URL)\n- Tokens sent via HTTP POST as form data\n- Requires server-side form processing',
				},
			},
		],
	});

	// OIDC: Device Code Flow
	oidcItems.push({
		name: 'Device Code Flow',
		item: [
			{
				name: '1. Request Device Authorization',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'scope', value: '{{scopes_oidc}}' },
						],
					},
					url: {
						raw: `${baseUrl}/as/device_authorization`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'device_authorization'],
					},
					description: '**Device Code Flow - OIDC**\n\n**Educational Context:**\n- For devices without browsers (TVs, printers, IoT)\n- Returns device_code and user_code\n- User enters user_code on another device\n- Returns access_token and id_token when authorized',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'if (pm.response.code === 200) {',
									'    const jsonData = pm.response.json();',
									'    if (jsonData.device_code) {',
									'        pm.environment.set("device_code", jsonData.device_code);',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			},
			{
				name: '2. Poll for Tokens',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:device_code' },
							{ key: 'device_code', value: '{{device_code}}' },
							{ key: 'client_id', value: '{{client_id}}' },
						],
					},
					url: {
						raw: `${baseUrl}/as/token`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'token'],
					},
					description: '**Poll for Tokens - Device Code Flow**\n\n**Educational Context:**\n- Poll this endpoint until user authorizes\n- Returns access_token and id_token when ready\n- Refresh token available if offline_access scope requested',
					event: [
						{
							listen: 'test',
							script: {
								exec: generateTokenExtractionScript('oidc'),
								type: 'text/javascript',
							},
						},
					],
				},
			},
		],
	});

	// OIDC: Introspection and UserInfo
	oidcItems.push({
		name: 'Introspect Token',
		request: {
			method: 'POST',
			header: [
				{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			],
			body: {
				mode: 'urlencoded',
				urlencoded: [
					{ key: 'token', value: '{{access_token}}' },
					{ key: 'token_type_hint', value: 'access_token' },
				],
			},
			url: {
				raw: `${baseUrl}/as/introspect`,
				protocol: 'https',
				host: ['auth', 'pingone', 'com'],
				path: ['{{envID}}', 'as', 'introspect'],
			},
			description: '**Token Introspection - OIDC**\n\n**Educational Context:**\n- Validates access_token and returns token metadata\n- Returns active status, expiration, scopes, etc.\n- Requires worker token for authentication',
		},
	});

	oidcItems.push({
		name: 'Get UserInfo',
		request: {
			method: 'GET',
			header: [
				{ key: 'Authorization', value: 'Bearer {{access_token}}' },
			],
			url: {
				raw: `${baseUrl}/as/userinfo`,
				protocol: 'https',
				host: ['auth', 'pingone', 'com'],
				path: ['{{envID}}', 'as', 'userinfo'],
			},
			description: '**UserInfo Endpoint - OIDC**\n\n**Educational Context:**\n- Returns user claims (profile, email, etc.)\n- Requires valid access_token\n- OIDC-specific endpoint (not in OAuth 2.0)',
		},
	});

	// ============================================
	// OIDC 2.1 Flows
	// ============================================
	// OIDC 2.1: Authorization Code with PKCE and Query String (REQUIRED)
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, false, 'query'));
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_basic', baseUrl, true, false, 'query'));
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_jwt', baseUrl, true, false, 'query'));
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'private_key_jwt', baseUrl, true, false, 'query'));
	
	// OIDC 2.1: Authorization Code with PKCE and URL Fragment
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, false, 'fragment'));
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_basic', baseUrl, true, false, 'fragment'));
	
	// OIDC 2.1: Authorization Code with PKCE and Form POST
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, false, 'form_post'));
	
	// OIDC 2.1: Authorization Code with PKCE and PAR (Query String)
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_post', baseUrl, true, true, 'query'));
	oidc21Items.push(buildAuthorizationCodeFlow('oidc2.1', 'client_secret_basic', baseUrl, true, true, 'query'));

	// OIDC 2.1: Client Credentials (same as OAuth 2.0, but with id_token if requested)
	oidc21Items.push({
		name: 'Client Credentials',
		item: [
			{
				name: 'Get Access Token',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'client_credentials' },
							{ key: 'scope', value: '{{scopes_oidc21}}' },
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'client_secret', value: '{{client_secret}}' },
						],
					},
					url: {
						raw: `${baseUrl}/as/token`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'token'],
					},
					description: '**Client Credentials Grant - OIDC 2.1**\n\n**Educational Context:**\n- Server-to-server authentication (no user involved)\n- OIDC 2.1: May return id_token if openid scope requested\n- offline_access scope recommended for refresh tokens',
					event: [
						{
							listen: 'test',
							script: {
								exec: generateTokenExtractionScript('oidc2.1'),
								type: 'text/javascript',
							},
						},
					],
				},
			},
		],
	});

	// OIDC 2.1: Device Code Flow (same as OIDC)
	oidc21Items.push({
		name: 'Device Code Flow',
		item: [
			{
				name: '1. Request Device Authorization',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'client_id', value: '{{client_id}}' },
							{ key: 'scope', value: '{{scopes_oidc21}}' },
						],
					},
					url: {
						raw: `${baseUrl}/as/device_authorization`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'device_authorization'],
					},
					description: '**Device Code Flow - OIDC 2.1**\n\n**Educational Context:**\n- For devices without browsers\n- OIDC 2.1: offline_access scope recommended for refresh tokens',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'if (pm.response.code === 200) {',
									'    const jsonData = pm.response.json();',
									'    if (jsonData.device_code) {',
									'        pm.environment.set("device_code", jsonData.device_code);',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
			},
			{
				name: '2. Poll for Tokens',
				request: {
					method: 'POST',
					header: [
						{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
					],
					body: {
						mode: 'urlencoded',
						urlencoded: [
							{ key: 'grant_type', value: 'urn:ietf:params:oauth:grant-type:device_code' },
							{ key: 'device_code', value: '{{device_code}}' },
							{ key: 'client_id', value: '{{client_id}}' },
						],
					},
					url: {
						raw: `${baseUrl}/as/token`,
						protocol: 'https',
						host: ['auth', 'pingone', 'com'],
						path: ['{{envID}}', 'as', 'token'],
					},
					description: '**Poll for Tokens - Device Code Flow**\n\n**Educational Context:**\n- Returns access_token and id_token\n- Refresh token available if offline_access scope requested',
					event: [
						{
							listen: 'test',
							script: {
								exec: generateTokenExtractionScript('oidc2.1'),
								type: 'text/javascript',
							},
						},
					],
				},
			},
		],
	});

	// OIDC 2.1: Introspection and UserInfo (same as OIDC)
	oidc21Items.push({
		name: 'Introspect Token',
		request: {
			method: 'POST',
			header: [
				{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			],
			body: {
				mode: 'urlencoded',
				urlencoded: [
					{ key: 'token', value: '{{access_token}}' },
					{ key: 'token_type_hint', value: 'access_token' },
				],
			},
			url: {
				raw: `${baseUrl}/as/introspect`,
				protocol: 'https',
				host: ['auth', 'pingone', 'com'],
				path: ['{{envID}}', 'as', 'introspect'],
			},
			description: '**Token Introspection - OIDC 2.1**\n\n**Educational Context:**\n- Validates access_token and returns token metadata\n- OIDC 2.1: Enhanced security requirements',
		},
	});

	oidc21Items.push({
		name: 'Get UserInfo',
		request: {
			method: 'GET',
			header: [
				{ key: 'Authorization', value: 'Bearer {{access_token}}' },
			],
			url: {
				raw: `${baseUrl}/as/userinfo`,
				protocol: 'https',
				host: ['auth', 'pingone', 'com'],
				path: ['{{envID}}', 'as', 'userinfo'],
			},
			description: '**UserInfo Endpoint - OIDC 2.1**\n\n**Educational Context:**\n- Returns user claims\n- OIDC 2.1: Enhanced security requirements',
		},
	});

	// ============================================
	// Redirectless (PingOne pi.flow) - Separate Group
	// ============================================
	// Redirectless uses a separate API endpoint instead of standard authorization URL
	const redirectlessItems: PostmanCollectionItem[] = [
		{
			name: 'Redirectless - Start Flow',
			item: [
				{
					name: '1. Generate PKCE Codes',
					request: {
						method: 'GET',
						url: {
							raw: 'https://example.com/generate-pkce',
						},
						description: '**Generate PKCE Codes for Redirectless**\n\n**Educational Context:**\n- PKCE is REQUIRED for redirectless flows\n- Generates code_verifier (secret) and code_challenge (public)\n- Code challenge is SHA256 hash of code verifier',
					},
					event: [
						{
							listen: 'prerequest',
							script: {
								exec: [
									'// Generate PKCE code verifier and challenge',
									'function generateCodeVerifier() {',
									'    const array = new Uint8Array(32);',
									'    crypto.getRandomValues(array);',
									'    return btoa(String.fromCharCode.apply(null, Array.from(array)))',
									'        .replace(/\\+/g, "-")',
									'        .replace(/\\//g, "_")',
									'        .replace(/=/g, "");',
									'}',
									'',
									'function generateCodeChallenge(verifier) {',
									'    return CryptoJS.SHA256(verifier).toString(CryptoJS.enc.Base64)',
									'        .replace(/\\+/g, "-")',
									'        .replace(/\\//g, "_")',
									'        .replace(/=/g, "");',
									'}',
									'',
									'const codeVerifier = generateCodeVerifier();',
									'const codeChallenge = generateCodeChallenge(codeVerifier);',
									'',
									'pm.environment.set("code_verifier", codeVerifier);',
									'pm.environment.set("code_challenge", codeChallenge);',
									'pm.environment.set("code_challenge_method", "S256");',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '2. Start Redirectless Flow',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/json' },
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify({
								environmentId: '{{envID}}',
								clientId: '{{client_id}}',
								clientSecret: '{{client_secret}}',
								redirectUri: 'urn:pingidentity:redirectless',
								scopes: '{{scopes_oidc}}',
								codeChallenge: '{{code_challenge}}',
								codeChallengeMethod: 'S256',
								state: '{{state}}',
							}, null, 2),
							options: {
								raw: {
									language: 'json',
								},
							},
						},
						url: {
							raw: 'http://localhost:3001/api/pingone/redirectless/authorize',
							protocol: 'http',
							host: ['localhost'],
							port: '3001',
							path: ['api', 'pingone', 'redirectless', 'authorize'],
						},
						description: '**Start Redirectless Flow (PingOne pi.flow)**\n\n**Educational Context:**\n- Redirectless authentication uses a separate API endpoint\n- No browser redirect - returns flow object via POST\n- Perfect for embedded auth, mobile apps, and headless flows\n- PKCE is REQUIRED for redirectless flows\n- Returns flow object with status (USERNAME_PASSWORD_REQUIRED, MFA_REQUIRED, COMPLETE)\n\n**Key Differences from Standard OAuth:**\n- Uses POST instead of GET\n- Endpoint: /api/pingone/redirectless/authorize (not /as/authorize)\n- Returns flow object, not redirect URL\n- Requires resumeUrl to continue flow',
					},
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'// Extract flow data from redirectless response',
									'if (pm.response.code === 200) {',
									'    const jsonData = pm.response.json();',
									'    if (jsonData.id) {',
									'        pm.environment.set("redirectless_flowId", jsonData.id);',
									'    }',
									'    if (jsonData.resumeUrl) {',
									'        pm.environment.set("redirectless_resumeUrl", jsonData.resumeUrl);',
									'    }',
									'    if (jsonData._sessionId || jsonData.sessionId) {',
									'        pm.environment.set("redirectless_sessionId", jsonData._sessionId || jsonData.sessionId);',
									'    }',
									'    if (jsonData.status) {',
									'        pm.environment.set("redirectless_status", jsonData.status);',
									'    }',
									'    console.log("✅ Redirectless flow started:", jsonData.status);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '3. Resume Flow - Enter Credentials',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/json' },
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify({
								flowId: '{{redirectless_flowId}}',
								sessionId: '{{redirectless_sessionId}}',
								username: '{{username}}',
								password: '{{password}}',
							}, null, 2),
							options: {
								raw: {
									language: 'json',
								},
							},
						},
						url: {
							raw: '{{redirectless_resumeUrl}}',
						},
						description: '**Resume Redirectless Flow - Enter Credentials**\n\n**Educational Context:**\n- Resume the redirectless flow after receiving USERNAME_PASSWORD_REQUIRED status\n- Send username and password to the resumeUrl\n- Flow may return MFA_REQUIRED status if MFA is enabled\n- Continue resuming until status is COMPLETE',
					},
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'// Extract updated flow data',
									'if (pm.response.code === 200) {',
									'    const jsonData = pm.response.json();',
									'    if (jsonData.id) {',
									'        pm.environment.set("redirectless_flowId", jsonData.id);',
									'    }',
									'    if (jsonData.resumeUrl) {',
									'        pm.environment.set("redirectless_resumeUrl", jsonData.resumeUrl);',
									'    }',
									'    if (jsonData._sessionId || jsonData.sessionId) {',
									'        pm.environment.set("redirectless_sessionId", jsonData._sessionId || jsonData.sessionId);',
									'    }',
									'    if (jsonData.status) {',
									'        pm.environment.set("redirectless_status", jsonData.status);',
									'    }',
									'    if (jsonData.status === "COMPLETE" && jsonData.code) {',
									'        pm.environment.set("authorization_code", jsonData.code);',
									'        console.log("✅ Authorization code received:", jsonData.code);',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '4. Resume Flow - Enter MFA Code (if required)',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/json' },
						],
						body: {
							mode: 'raw',
							raw: JSON.stringify({
								flowId: '{{redirectless_flowId}}',
								sessionId: '{{redirectless_sessionId}}',
								otpCode: '{{otp_code}}',
							}, null, 2),
							options: {
								raw: {
									language: 'json',
								},
							},
						},
						url: {
							raw: '{{redirectless_resumeUrl}}',
						},
						description: '**Resume Redirectless Flow - Enter MFA Code**\n\n**Educational Context:**\n- Resume the redirectless flow after receiving MFA_REQUIRED status\n- Send OTP code to the resumeUrl\n- Flow should return COMPLETE status with authorization code',
					},
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'// Extract authorization code when flow is complete',
									'if (pm.response.code === 200) {',
									'    const jsonData = pm.response.json();',
									'    if (jsonData.status === "COMPLETE" && jsonData.code) {',
									'        pm.environment.set("authorization_code", jsonData.code);',
									'        console.log("✅ Authorization code received:", jsonData.code);',
									'    }',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
				},
				{
					name: '5. Exchange Authorization Code for Tokens',
					request: {
						method: 'POST',
						header: [
							{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
						],
						body: {
							mode: 'urlencoded',
							urlencoded: [
								{ key: 'grant_type', value: 'authorization_code' },
								{ key: 'code', value: '{{authorization_code}}' },
								{ key: 'redirect_uri', value: 'urn:pingidentity:redirectless' },
								{ key: 'client_id', value: '{{client_id}}' },
								{ key: 'code_verifier', value: '{{code_verifier}}' },
							],
						},
						url: {
							raw: `${baseUrl}/as/token`,
							protocol: 'https',
							host: ['auth', 'pingone', 'com'],
							path: ['{{envID}}', 'as', 'token'],
						},
						description: '**Token Exchange - Redirectless Flow**\n\n**Educational Context:**\n- Exchanges authorization code for tokens (same as standard flow)\n- code_verifier must match code_challenge from redirectless request\n- Returns access_token, id_token, and refresh_token (if offline_access scope requested)',
					},
					event: [
						{
							listen: 'test',
							script: {
								exec: generateTokenExtractionScript('oidc'),
								type: 'text/javascript',
							},
						},
					],
				},
			],
		},
	];

	// Create folder structure organized by spec version
	const items: PostmanCollectionItem[] = [
		{
			name: 'OAuth 2.0',
			item: oauth20Items,
		},
		{
			name: 'OIDC',
			item: oidcItems,
		},
		{
			name: 'OIDC 2.1',
			item: oidc21Items,
		},
		{
			name: 'Redirectless (PingOne pi.flow)',
			item: redirectlessItems,
		},
	];

	return {
		info: {
			name: 'PingOne Unified OAuth/OIDC Flows - Complete Collection',
			description: 'Comprehensive Postman collection for all PingOne OAuth 2.0, OpenID Connect, and OIDC 2.1 flows. Organized by specification version:\n\n**OAuth 2.0:**\n- Authorization Code (simple, no PKCE, no id_token)\n- Client Credentials\n\n**OIDC:**\n- Authorization Code (simple + optional PKCE, includes id_token)\n- Implicit Flow (deprecated)\n- Device Code Flow\n- Introspection & UserInfo\n\n**OIDC 2.1:**\n- Authorization Code (PKCE REQUIRED, includes id_token)\n- Authorization Code with PKCE and PAR\n- Client Credentials\n- Device Code Flow\n- Introspection & UserInfo\n\nGenerated from OAuth Playground.',
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: variables,
		item: items,
	};
};

/**
 * Generate comprehensive Postman collection for all MFA flows
 * Groups flows by Registration and Authentication
 */
export const generateComprehensiveMFAPostmanCollection = (
	credentials?: {
		environmentId?: string;
		username?: string;
	}
): PostmanCollection => {
	const deviceTypes = ['SMS', 'EMAIL', 'WHATSAPP', 'TOTP', 'FIDO2', 'MOBILE'];
	
	// Import getApiCalls from MFADocumentationPageV8
	// We'll use a dynamic import to avoid circular dependencies
	const getApiCalls = async () => {
		const module = await import('@/v8/components/MFADocumentationPageV8');
		return module.getApiCalls;
	};

	// Build variables
	const variables: Array<{ key: string; value: string; type?: string }> = [
		{ key: 'authPath', value: 'https://auth.pingone.com', type: 'string' },
		{ key: 'envID', value: credentials?.environmentId || '', type: 'string' },
		{ key: 'workerToken', value: '', type: 'string' },
		{ key: 'username', value: credentials?.username || '', type: 'string' },
		{ key: 'userId', value: '{userId}', type: 'string' },
		{ key: 'deviceId', value: '{deviceId}', type: 'string' },
		{ key: 'deviceAuthenticationPolicyId', value: '{deviceAuthenticationPolicyId}', type: 'string' },
	];

	// Build registration and authentication items for each device type
	const registrationItems: PostmanCollectionItem[] = [];
	const authenticationItems: PostmanCollectionItem[] = [];

	deviceTypes.forEach((deviceType) => {
		// Registration API calls
		const registrationCalls = [
			{
				step: `Register ${deviceType} Device`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications`,
				description: `Create a new ${deviceType} device for the user`,
				requestBody: {
					type: deviceType,
					status: 'ACTIVATION_REQUIRED',
					policy: {
						id: '{{deviceAuthenticationPolicyId}}',
					},
					...(deviceType === 'SMS' || deviceType === 'WHATSAPP' || deviceType === 'MOBILE'
						? { phone: '+1.5125201234' }
						: deviceType === 'EMAIL'
						? { email: 'user@example.com' }
						: {}),
				},
				responseBody: {
					id: '{{deviceId}}',
					type: deviceType,
					status: 'ACTIVATION_REQUIRED',
				},
			},
		];

		// Add activation call for OTP devices
		if (deviceType !== 'FIDO2') {
			registrationCalls.push({
				step: `Activate ${deviceType} Device`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications/{{deviceId}}/otp/check`,
				description: `Activate ${deviceType} device with OTP code`,
				requestBody: {
					otp: '{otp_code}',
				},
				responseBody: {
					id: '{{deviceId}}',
					status: 'ACTIVE',
				},
			});
		}

		// Convert to Postman items
		const deviceRegistrationItems = registrationCalls.map((call) => {
			const postmanUrl = convertEndpointToPostman(call.endpoint);
			const urlStructure = parseUrl(postmanUrl);
			const headers: Array<{ key: string; value: string; type?: string }> = [
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			];
			const body = convertRequestBody(call.requestBody, call.method);

			// Build comprehensive educational description
			let educationalDescription = call.description || '';
			
			// Add flow context based on step name
			if (call.step.includes('Register') || call.step.includes('Create')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- This creates a new MFA device for the user\n';
				if (call.requestBody && typeof call.requestBody === 'object') {
					const body = call.requestBody as Record<string, unknown>;
					if (body.status === 'ACTIVE') {
						educationalDescription += '- Device status: ACTIVE (immediately usable, no OTP required)\n';
						educationalDescription += '- Only possible with worker token (Admin Flow)\n';
					} else if (body.status === 'ACTIVATION_REQUIRED') {
						educationalDescription += '- Device status: ACTIVATION_REQUIRED (OTP activation required)\n';
						educationalDescription += '- PingOne automatically sends OTP to the device\n';
						educationalDescription += '- User Flow always uses ACTIVATION_REQUIRED\n';
					}
				}
				educationalDescription += '- Device ID is automatically extracted and saved\n';
				educationalDescription += '- Policy ID links device to MFA authentication policy\n';
				educationalDescription += '- This is part of the Registration flow\n';
			} else if (call.step.includes('Activate')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- Activates a device created with ACTIVATION_REQUIRED status\n';
				educationalDescription += '- OTP code is received via SMS/Email/WhatsApp/TOTP app\n';
				educationalDescription += '- After activation, device status changes to ACTIVE\n';
				educationalDescription += '- Device can now be used for MFA authentication\n';
				educationalDescription += '- This is the final step in device registration\n';
			}

			return {
				name: call.step,
				request: {
					method: call.method,
					header: headers,
					...(body && { body }),
					url: urlStructure,
					description: educationalDescription,
				},
			};
		});

		registrationItems.push({
			name: deviceType,
			item: deviceRegistrationItems,
		});

		// Authentication API calls
		const authenticationCalls = [
			{
				step: `Initialize ${deviceType} Authentication`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications`,
				description: `Initialize authentication for ${deviceType} device`,
				requestBody: {
					user: {
						id: '{{userId}}',
					},
					device: {
						id: '{{deviceId}}',
					},
					policy: {
						id: '{{deviceAuthenticationPolicyId}}',
					},
				},
				responseBody: {
					id: '{deviceAuthenticationId}',
					status: 'OTP_SENT',
				},
			},
		];

		// Add OTP check for OTP devices
		if (deviceType !== 'FIDO2') {
			authenticationCalls.push({
				step: `Validate ${deviceType} OTP`,
				method: 'POST',
				endpoint: `{{authPath}}/{{envID}}/deviceAuthentications/{deviceAuthenticationId}/otp/check`,
				description: `Validate OTP code for ${deviceType} authentication`,
				requestBody: {
					otp: '{otp_code}',
				},
				responseBody: {
					id: '{deviceAuthenticationId}',
					status: 'COMPLETED',
				},
			});
		}

		// Convert to Postman items
		const deviceAuthenticationItems = authenticationCalls.map((call) => {
			const postmanUrl = convertEndpointToPostman(call.endpoint);
			const urlStructure = parseUrl(postmanUrl);
			const headers: Array<{ key: string; value: string; type?: string }> = [
				{ key: 'Content-Type', value: 'application/json' },
				{ key: 'Authorization', value: 'Bearer {{workerToken}}' },
			];
			const body = convertRequestBody(call.requestBody, call.method);

			// Build comprehensive educational description
			let educationalDescription = call.description || '';
			
			// Add flow context based on step name
			if (call.step.includes('Initialize')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- This starts the MFA authentication process\n';
				educationalDescription += '- PingOne sends OTP to the selected device (or prompts for device selection)\n';
				educationalDescription += '- Device Authentication ID is automatically extracted and saved\n';
				educationalDescription += '- This ID is used in subsequent authentication steps\n';
				educationalDescription += '- Response includes status indicating next required action\n';
			} else if (call.step.includes('Validate') || call.step.includes('Check OTP')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- User enters OTP code received on their device\n';
				educationalDescription += '- OTP is validated against the device authentication session\n';
				educationalDescription += '- If valid, authentication proceeds to completion\n';
				educationalDescription += '- Use the otp.check URI from _links in the initialize response\n';
			} else if (call.step.includes('Complete')) {
				educationalDescription += '\n\n**Educational Context:**\n';
				educationalDescription += '- This finalizes the MFA authentication process\n';
				educationalDescription += '- Authentication is now complete and user can proceed\n';
				educationalDescription += '- This step is optional if complete link is provided\n';
			}

			return {
				name: call.step,
				request: {
					method: call.method,
					header: headers,
					...(body && { body }),
					url: urlStructure,
					description: educationalDescription,
				},
			};
		});

		authenticationItems.push({
			name: deviceType,
			item: deviceAuthenticationItems,
		});
	});

	// Create folder structure
	const items: PostmanCollectionItem[] = [
		{
			name: 'Registration',
			item: registrationItems,
		},
		{
			name: 'Authentication',
			item: authenticationItems,
		},
	];

	return {
		info: {
			name: 'PingOne MFA Flows - Complete Collection',
			description: 'Comprehensive Postman collection for all PingOne MFA device types. Includes SMS, Email, WhatsApp, TOTP, FIDO2, and Mobile device registration and authentication flows. Generated from OAuth Playground.',
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: variables,
		item: items,
	};
};

/**
 * Postman Environment file structure
 */
export interface PostmanEnvironment {
	id: string;
	name: string;
	values: Array<{
		key: string;
		value: string;
		type: 'default' | 'secret';
		enabled: boolean;
	}>;
	_postman_variable_scope: string;
	_postman_exported_at?: string;
	_postman_exported_using?: string;
}

/**
 * Generate Postman environment from collection variables
 */
export const generatePostmanEnvironment = (
	collection: PostmanCollection,
	environmentName: string
): PostmanEnvironment => {
	const values = collection.variable.map((variable) => ({
		key: variable.key,
		value: variable.value || '',
		type: (variable.type === 'secret' ? 'secret' : 'default') as 'default' | 'secret',
		enabled: true,
	}));

	return {
		id: `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		name: environmentName,
		values,
		_postman_variable_scope: 'environment',
		_postman_exported_at: new Date().toISOString(),
		_postman_exported_using: 'OAuth Playground',
	};
};

/**
 * Download Postman collection as JSON file
 */
export const downloadPostmanCollection = (collection: PostmanCollection, filename: string): void => {
	const json = JSON.stringify(collection, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/**
 * Download Postman environment as JSON file
 */
export const downloadPostmanEnvironment = (environment: PostmanEnvironment, filename: string): void => {
	const json = JSON.stringify(environment, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/**
 * Generate comprehensive Postman collection combining both Unified and MFA flows
 * This creates one big collection with all OAuth/OIDC flows and all MFA device types
 */
export const generateCompletePostmanCollection = (
	credentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		username?: string;
	}
): PostmanCollection => {
	// Generate both collections
	const unifiedCollection = generateComprehensiveUnifiedPostmanCollection({
		environmentId: credentials?.environmentId,
		clientId: credentials?.clientId,
		clientSecret: credentials?.clientSecret,
	});

	const mfaCollection = generateComprehensiveMFAPostmanCollection({
		environmentId: credentials?.environmentId,
		username: credentials?.username,
	});

	// Merge variables (remove duplicates, keep unique keys)
	const variableMap = new Map<string, { key: string; value: string; type?: string }>();
	
	// Add Unified variables first
	unifiedCollection.variable.forEach((v) => {
		variableMap.set(v.key, v);
	});
	
	// Add MFA variables (will override if duplicate, which is fine)
	mfaCollection.variable.forEach((v) => {
		variableMap.set(v.key, v);
	});
	
	// Convert map to array
	const mergedVariables = Array.from(variableMap.values());

	// Combine items into folder structure
	const items: PostmanCollectionItem[] = [
		{
			name: 'Unified OAuth/OIDC Flows',
			item: unifiedCollection.item,
		},
		{
			name: 'MFA Flows',
			item: mfaCollection.item,
		},
	];

	return {
		info: {
			name: 'PingOne Complete Collection - Unified & MFA',
			description: 'Complete Postman collection for all PingOne OAuth 2.0, OpenID Connect, and MFA flows. Includes:\n\n**Unified OAuth/OIDC Flows:**\n- Authorization Code Grant (7 variations)\n- Implicit Flow\n- Client Credentials Flow\n- Device Code Flow\n- Hybrid Flow\n\n**MFA Flows:**\n- SMS Device Registration & Authentication\n- Email Device Registration & Authentication\n- WhatsApp Device Registration & Authentication\n- TOTP Device Registration & Authentication\n- FIDO2 Device Registration & Authentication\n- Mobile Device Registration & Authentication\n\nAll flows include educational comments, variable extraction scripts, and complete OAuth login steps for user flows. Generated from OAuth Playground.',
			schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
		},
		variable: mergedVariables,
		item: items,
	};
};

/**
 * Download both Postman collection and environment files
 */
export const downloadPostmanCollectionWithEnvironment = (
	collection: PostmanCollection,
	collectionFilename: string,
	environmentName?: string
): void => {
	// Generate environment first
	const envName = environmentName || `${collection.info.name.replace(' Collection', '')} Environment`;
	const environment = generatePostmanEnvironment(collection, envName);
	const envFilename = collectionFilename.replace('.json', '-environment.json').replace('-collection.json', '-environment.json');
	
	// Download collection
	downloadPostmanCollection(collection, collectionFilename);

	// Download environment with a small delay to ensure both downloads work
	// Some browsers block multiple simultaneous downloads
	setTimeout(() => {
		downloadPostmanEnvironment(environment, envFilename);
	}, 100);
};
