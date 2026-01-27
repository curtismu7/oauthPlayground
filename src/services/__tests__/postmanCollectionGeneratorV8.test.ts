// src/services/__tests__/postmanCollectionGeneratorV8.test.ts
// Unit and integration coverage for Postman generator blank prevention

import { describe, expect, it } from 'vitest';
import {
	allowBlankButWarn,
	convertEndpointToPostman,
	GenerationIssues,
	generateUseCasesPostmanCollection,
	isBlank,
	normalizeUrlForPostman,
	type PostmanCollectionItem,
	parseUrl,
	requireNonBlankString,
	validatePlaceholders,
} from '../postmanCollectionGeneratorV8';

// Helper to locate an item by name in a nested collection tree.
const findItemByName = (
	items: PostmanCollectionItem[],
	name: string
): PostmanCollectionItem | undefined => {
	// Search depth-first for a matching item name.
	for (const item of items) {
		if (item.name === name) return item;
		if (item.item) {
			const match = findItemByName(item.item, name);
			if (match) return match;
		}
	}
	return undefined;
};

// Helper to collect all requests in a collection tree.
const collectRequests = (items: PostmanCollectionItem[]): PostmanCollectionItem[] => {
	// Gather all items that have a request, recursing into folders.
	const results: PostmanCollectionItem[] = [];
	for (const item of items) {
		if (item.request) results.push(item);
		if (item.item) results.push(...collectRequests(item.item));
	}
	return results;
};

describe('postmanCollectionGeneratorV8 helpers', () => {
	it('flags required values that are blank', () => {
		// Ensure required values are never silently blank.
		const issues = new GenerationIssues('test-required');
		const value = requireNonBlankString('envID', '   ', issues, { test: true });

		expect(value).toBe('<<REQUIRED_VALUE_MISSING>>');
		expect(issues.getIssues().some((issue) => issue.level === 'error')).toBe(true);
	});

	it('warns when a value is intentionally blank', () => {
		// Ensure intentionally blank values always emit warnings.
		const issues = new GenerationIssues('test-blank');
		const value = allowBlankButWarn('redirect_uri', '', issues, { test: true });

		expect(isBlank(value)).toBe(true);
		expect(issues.getIssues().some((issue) => issue.level === 'warning')).toBe(true);
	});

	it('normalizes query strings without breaking variables', () => {
		// Ensure query encoding preserves Postman variables.
		const url =
			'{{apiPath}}/v1/environments/{{envID}}/users?filter=username eq "{{SignUpUsername}}"&limit=20';
		const normalized = normalizeUrlForPostman(url);

		expect(normalized).toContain('filter=username%20eq%20%22{{SignUpUsername}}%22');
		expect(normalized).toContain('{{SignUpUsername}}');
	});

	it('detects unresolved template placeholders', () => {
		// Ensure invalid placeholders are caught by validation.
		const issues = new GenerationIssues('test-placeholders');
		validatePlaceholders('{"bad":"{{}}"}', issues, 'test');
		expect(issues.getIssues().some((issue) => issue.level === 'error')).toBe(true);
	});

	it('converts PingOne URLs to Postman variables', () => {
		// Ensure PingOne auth URLs are normalized with variables.
		const converted = convertEndpointToPostman(
			'https://auth.pingone.com/123e4567-e89b-12d3-a456-426614174000/as/authorize'
		);
		expect(converted).toBe('{{authPath}}/{{envID}}/as/authorize');
	});

	it('parses templated URLs with query params without dropping raw', () => {
		// Ensure query params keep raw URL to avoid Postman blank rendering.
		const raw =
			'{{authPath}}/{{envID}}/as/authorize?response_type=code&client_id={{user_client_id}}';
		const parsed = parseUrl(raw);
		expect(parsed.raw).toBe(raw);
		expect(parsed.host).toBeUndefined();
	});

	it('parses absolute URLs and strips leading slash mistakes', () => {
		// Ensure leading slash in raw URLs is normalized.
		const raw = '/https://api.pingone.com/v1/environments/{{envID}}/users';
		const parsed = parseUrl(raw);
		expect(parsed.raw).toBe('https://api.pingone.com/v1/environments/{{envID}}/users');
	});
});

describe('postmanCollectionGeneratorV8 integration', () => {
	it('generates use case requests with non-blank URLs', () => {
		// Ensure generated use cases never include blank request URLs.
		const collection = generateUseCasesPostmanCollection({
			environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
			clientId: 'test-client',
			clientSecret: 'test-secret',
		});

		const requests = collectRequests(collection.item);
		expect(requests.length).toBeGreaterThan(0);
		requests.forEach((requestItem) => {
			expect(requestItem.request?.url?.raw).toBeTruthy();
			expect(requestItem.request?.url?.raw?.trim()).not.toBe('');
		});
	});

	it('encodes Test Registration filters to prevent blank rendering', () => {
		// Ensure filter-based Test Registration URLs are encoded.
		const collection = generateUseCasesPostmanCollection({
			environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
			clientId: 'test-client',
			clientSecret: 'test-secret',
		});

		const lookupByUsername = findItemByName(collection.item, 'Lookup User by Username');
		expect(lookupByUsername?.request?.url?.raw).toContain(
			'filter=username%20eq%20%22{{SignUpUsername}}%22'
		);
	});
});
