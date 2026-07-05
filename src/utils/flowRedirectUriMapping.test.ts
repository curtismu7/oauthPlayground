// src/utils/flowRedirectUriMapping.test.ts
// Tests for the centralized redirect URI mapping system

import { describe, expect, it } from 'vitest';
import {
	FLOW_REDIRECT_URI_MAPPING,
	flowRequiresRedirectUri,
	generateRedirectUriForFlow,
	getFlowRedirectUriConfig,
	getFlowsNotRequiringRedirectUri,
	getFlowsRequiringRedirectUri,
} from './flowRedirectUriMapping';

// Mock window.location.origin for testing
Object.defineProperty(window, 'location', {
	value: {
		origin: 'https://localhost:3001',
	},
	writable: true,
});

describe('FLOW_REDIRECT_URI_MAPPING', () => {
	it('contains a non-empty list of flow configurations', () => {
		expect(FLOW_REDIRECT_URI_MAPPING.length).toBeGreaterThan(0);
	});

	it('has no duplicate flowType entries', () => {
		const flowTypes = FLOW_REDIRECT_URI_MAPPING.map((config) => config.flowType);
		const uniqueFlowTypes = new Set(flowTypes);
		expect(uniqueFlowTypes.size).toBe(flowTypes.length);
	});

	it('gives every entry the required fields', () => {
		for (const config of FLOW_REDIRECT_URI_MAPPING) {
			expect(typeof config.flowType).toBe('string');
			expect(config.flowType.length).toBeGreaterThan(0);
			expect(typeof config.requiresRedirectUri).toBe('boolean');
			expect(typeof config.callbackPath).toBe('string');
			expect(typeof config.description).toBe('string');
			expect(typeof config.specification).toBe('string');
		}
	});
});

describe('getFlowRedirectUriConfig', () => {
	it('returns the matching configuration for a known flow type', () => {
		const config = getFlowRedirectUriConfig('oauth-authorization-code-v9');
		expect(config).not.toBeNull();
		expect(config?.callbackPath).toBe('authz-callback');
		expect(config?.requiresRedirectUri).toBe(true);
	});

	it('returns null for an unknown flow type', () => {
		expect(getFlowRedirectUriConfig('not-a-real-flow')).toBeNull();
	});
});

describe('flowRequiresRedirectUri', () => {
	it('returns true for a flow that requires a redirect URI', () => {
		expect(flowRequiresRedirectUri('oauth-authorization-code-v9')).toBe(true);
	});

	it('returns false for a flow that does not require a redirect URI', () => {
		expect(flowRequiresRedirectUri('client-credentials-v9')).toBe(false);
	});

	it('returns false for an unknown flow type', () => {
		expect(flowRequiresRedirectUri('not-a-real-flow')).toBe(false);
	});
});

describe('generateRedirectUriForFlow', () => {
	it('builds the full redirect URI using window.location.origin for a flow that needs one', () => {
		expect(generateRedirectUriForFlow('oauth-authorization-code-v9')).toBe(
			'https://localhost:3001/authz-callback'
		);
	});

	it('uses the callback path specific to each flow', () => {
		expect(generateRedirectUriForFlow('oidc-implicit-v9')).toBe(
			'https://localhost:3001/implicit-callback'
		);
		expect(generateRedirectUriForFlow('oidc-hybrid-v9')).toBe(
			'https://localhost:3001/hybrid-callback'
		);
	});

	it('returns null for a flow that does not require a redirect URI', () => {
		expect(generateRedirectUriForFlow('client-credentials-v9')).toBeNull();
	});

	it('returns null for an unknown flow type', () => {
		expect(generateRedirectUriForFlow('not-a-real-flow')).toBeNull();
	});

	it('respects an explicit baseUrl override instead of window.location.origin', () => {
		expect(generateRedirectUriForFlow('oauth-authorization-code-v9', 'https://example.com')).toBe(
			'https://example.com/authz-callback'
		);
	});
});

describe('getFlowsRequiringRedirectUri / getFlowsNotRequiringRedirectUri', () => {
	it('partitions all flow types with no overlap and full coverage', () => {
		const requiring = getFlowsRequiringRedirectUri();
		const notRequiring = getFlowsNotRequiringRedirectUri();

		expect(requiring.length + notRequiring.length).toBe(FLOW_REDIRECT_URI_MAPPING.length);
		expect(requiring.some((flowType) => notRequiring.includes(flowType))).toBe(false);
	});

	it('agrees with flowRequiresRedirectUri for every listed flow type', () => {
		const requiring = getFlowsRequiringRedirectUri();
		const notRequiring = getFlowsNotRequiringRedirectUri();

		for (const flowType of requiring) {
			expect(flowRequiresRedirectUri(flowType)).toBe(true);
		}
		for (const flowType of notRequiring) {
			expect(flowRequiresRedirectUri(flowType)).toBe(false);
		}
	});

	it('includes known examples in the correct list', () => {
		expect(getFlowsRequiringRedirectUri()).toContain('oauth-authorization-code-v9');
		expect(getFlowsNotRequiringRedirectUri()).toContain('client-credentials-v9');
	});
});
