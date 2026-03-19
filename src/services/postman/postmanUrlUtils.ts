/**
 * @file postmanUrlUtils.ts
 * @description URL parsing and conversion utilities for Postman collections
 * @version 9.0.0
 */

/**
 * Convert API endpoint to Postman format with {{authPath}} and {{envID}} variables
 * Format: {{authPath}}/{{envID}}/path/to/endpoint
 */
export const convertEndpointToPostman = (endpoint: string): string => {
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
	result = result.replace(/^https:\/\/{{authPath}}/, '{{authPath}}');
	result = result.replace(/^http:\/\/{{authPath}}/, '{{authPath}}');

	return result;
};

/**
 * Parse URL into Postman URL structure
 */
export const parseUrl = (
	rawUrl: string
): {
	raw: string;
	protocol?: string;
	host?: string[];
	path?: string[];
	query?: Array<{ key: string; value: string }>;
} => {
	// Remove leading slash if present
	let cleanedUrl = rawUrl.trim();
	if (cleanedUrl.startsWith('/{{') || cleanedUrl.startsWith('/{')) {
		cleanedUrl = cleanedUrl.substring(1);
	}

	// Handle Postman variable format {{authPath}}/{{envID}}/...
	if (cleanedUrl.includes('{{authPath}}')) {
		const parts = cleanedUrl.split('/').filter(Boolean);
		const path = parts.slice(1); // Skip {{authPath}}

		// Extract query parameters if present
		const query: Array<{ key: string; value: string }> = [];
		const queryIndex = cleanedUrl.indexOf('?');
		if (queryIndex !== -1) {
			const queryString = cleanedUrl.substring(queryIndex + 1);
			const params = new URLSearchParams(queryString);
			params.forEach((value, key) => {
				query.push({ key, value });
			});
		}

		return {
			raw: cleanedUrl,
			host: ['{{authPath}}'],
			...(path.length > 0 && { path }),
			...(query.length > 0 && { query }),
		};
	}

	// Handle Postman variable format {{apiPath}}/v1/environments/...
	if (cleanedUrl.includes('{{apiPath}}')) {
		const query: Array<{ key: string; value: string }> = [];
		let urlWithoutQuery = cleanedUrl;
		const queryIndex = cleanedUrl.indexOf('?');
		if (queryIndex !== -1) {
			urlWithoutQuery = cleanedUrl.substring(0, queryIndex);
			const queryString = cleanedUrl.substring(queryIndex + 1);
			const params = new URLSearchParams(queryString);
			params.forEach((value, key) => {
				query.push({ key, value });
			});
		}

		const parts = urlWithoutQuery.split('/').filter(Boolean);
		const apiPathIndex = parts.findIndex((p) => p.includes('{{apiPath}}'));
		const path = apiPathIndex >= 0 ? parts.slice(apiPathIndex + 1) : parts;

		return {
			raw: cleanedUrl,
			host: ['{{apiPath}}'],
			...(path.length > 0 && { path }),
			...(query.length > 0 && { query }),
		};
	}

	// Fallback: try to parse as regular URL
	try {
		const url = new URL(cleanedUrl);
		const pathParts = url.pathname.split('/').filter(Boolean);
		const host = url.host.split('.');

		// Replace envID with variable
		const path = pathParts.map((part) => {
			if (/^[a-f0-9-]{36}$/i.test(part)) {
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
			raw: cleanedUrl,
			protocol: url.protocol.replace(':', ''),
			host,
			path,
			...(query.length > 0 && { query }),
		};
	} catch {
		// Fallback: return as-is with empty path
		return {
			raw: cleanedUrl,
			path: [],
		};
	}
};
