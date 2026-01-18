// src/services/url.ts

import type { GenerationIssues } from './postmanIssues';
import { getActiveContextLabel, getActiveIssues } from './postmanGenerationContext';
import { isBlank, requireNonBlankString } from './variablePolicy';

/**
 * Encode query strings while preserving Postman variables ({{var}}).
 */
export const encodeQueryPreservingVariables = (query: string): string => {
	const parts = query.split(/(\{\{[^}]+\}\})/g);
	return parts
		.map((part) => {
			if (part.startsWith('{{') && part.endsWith('}}')) return part;
			return part.replace(/ /g, '%20').replace(/"/g, '%22').replace(/\+/g, '%2B');
		})
		.join('');
};

/**
 * Normalize URL strings to avoid Postman blank rendering.
 */
export const normalizeUrlForPostman = (rawUrl: string): string => {
	const [base, query] = rawUrl.split('?');
	if (!query) return rawUrl;
	return `${base}?${encodeQueryPreservingVariables(query)}`;
};

/**
 * Convert API endpoint to Postman format with {{authPath}} and {{envID}} variables.
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
	// If result starts with {{authPath}}, it's already in the right format
	// If it starts with https://{{authPath}}, remove the protocol
	result = result.replace(/^https:\/\/{{authPath}}/, '{{authPath}}');
	result = result.replace(/^http:\/\/{{authPath}}/, '{{authPath}}');

	return result;
};

/**
 * Parse URL into Postman URL structure.
 */
export const parseUrl = (
	rawUrl: string,
	issues?: GenerationIssues,
	contextLabel?: string
): {
	raw: string;
	protocol?: string;
	host?: string[];
	path?: string[];
	query?: Array<{ key: string; value: string }>;
} => {
	const issuesCollector = issues ?? getActiveIssues();
	const resolvedContext = contextLabel ?? getActiveContextLabel();

	if (issuesCollector) {
		const resolvedRawUrl = requireNonBlankString('request.url.raw', rawUrl, issuesCollector, {
			contextLabel: resolvedContext,
		});
		if (resolvedRawUrl === '<<REQUIRED_VALUE_MISSING>>') {
			throw new Error('Request URL is required and cannot be blank.');
		}
	} else if (isBlank(rawUrl)) {
		throw new Error('Request URL is required and cannot be blank.');
	}

	// Remove leading slash if present (common mistake that causes /https://api.pingone.com)
	const normalizedUrl = normalizeUrlForPostman(rawUrl);
	let cleanedUrl = normalizedUrl.trim();
	if (cleanedUrl.startsWith('/{{') || cleanedUrl.startsWith('/{')) {
		cleanedUrl = cleanedUrl.substring(1);
	}
	if (cleanedUrl.startsWith('/http://') || cleanedUrl.startsWith('/https://')) {
		cleanedUrl = cleanedUrl.substring(1);
	}

	// Handle Postman variable format {{authPath}}/{{envID}}/...
	if (cleanedUrl.includes('{{authPath}}')) {
		const queryIndex = cleanedUrl.indexOf('?');
		const urlWithoutQuery = queryIndex !== -1 ? cleanedUrl.substring(0, queryIndex) : cleanedUrl;
		const parts = urlWithoutQuery.split('/').filter(Boolean);

		const path = parts.slice(1).map((part) => {
			const queryIdx = part.indexOf('?');
			return queryIdx !== -1 ? part.substring(0, queryIdx) : part;
		});

		if (queryIndex !== -1) {
			return {
				raw: cleanedUrl,
			};
		}

		return {
			raw: cleanedUrl,
			host: ['{{authPath}}'],
			...(path.length > 0 && { path }),
		};
	}

	// Handle Postman variable format {{apiPath}}/v1/environments/{{envID}}/...
	if (cleanedUrl.includes('{{apiPath}}')) {
		const queryIndex = cleanedUrl.indexOf('?');
		if (queryIndex !== -1) {
			return {
				raw: cleanedUrl,
			};
		}

		const parts = cleanedUrl.split('/').filter(Boolean);
		const apiPathIndex = parts.findIndex((p) => p.includes('{{apiPath}}'));
		const path = apiPathIndex >= 0 ? parts.slice(apiPathIndex + 1) : parts;

		return {
			raw: cleanedUrl,
			host: ['{{apiPath}}'],
			...(path.length > 0 && { path }),
		};
	}

	// Handle variable host format {{customAuthPath}}/...
	const variableHostMatch = cleanedUrl.match(/^\{\{([^}]+)\}\}(\/.*)?$/);
	if (variableHostMatch) {
		const hostVar = `{{${variableHostMatch[1]}}}`;
		const pathParts = (variableHostMatch[2] || '')
			.split('/')
			.filter(Boolean)
			.map((part) => part.trim());
		return {
			raw: cleanedUrl,
			host: [hostVar],
			...(pathParts.length > 0 && { path: pathParts }),
		};
	}

	// Handle absolute URL
	try {
		const url = new URL(cleanedUrl);
		const pathParts = url.pathname.split('/').filter(Boolean);
		const host = url.host.split('.');
		const path = pathParts.map((part) => {
			if (part.match(/^[a-f0-9-]{36}$/)) {
				return '{{envID}}';
			}
			return part;
		});
		const query: Array<{ key: string; value: string }> = [];
		url.searchParams.forEach((value, key) => {
			query.push({ key, value });
		});

		return {
			raw: cleanedUrl,
			host,
			...(path.length > 0 && { path }),
			...(query.length > 0 && { query }),
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (issuesCollector) {
			issuesCollector.addError('URL_PARSE_FAILED', 'Failed to parse request URL.', {
				contextLabel: resolvedContext,
				rawUrl: cleanedUrl,
				error: errorMessage,
			});
		}
		if (
			cleanedUrl.startsWith('http://') ||
			cleanedUrl.startsWith('https://') ||
			cleanedUrl.includes('{{authPath}}') ||
			cleanedUrl.includes('{{apiPath}}')
		) {
			throw new Error(`Failed to parse request URL: ${cleanedUrl}`);
		}
		return { raw: cleanedUrl };
	}
};
