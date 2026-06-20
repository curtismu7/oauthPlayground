// src/services/__tests__/unifiedTokenStorageService.storeToken.test.ts
// Regression test: storeToken must preserve an id carried on the token object.
//
// Background: tokenMonitoringService.saveTokensToStorage() round-trips tokens
// through storeToken() passing the id INSIDE the token object (not via options).
// When storeToken ignored that id and generated a fresh random one on every
// call, each save created a brand-new storage entry, which the 2s sync re-read
// and re-saved — an exponential runaway loop that flooded /api/tokens/store and
// exhausted the browser connection pool (ERR_INSUFFICIENT_RESOURCES).

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// The service constructs a singleton at import time and opens IndexedDB in its
// constructor. Provide a harmless stub so the module loads under the node test
// environment, then import it dynamically.
let UnifiedTokenStorageService: typeof import('../unifiedTokenStorageService').UnifiedTokenStorageService;

beforeAll(async () => {
	vi.stubGlobal('indexedDB', {
		// Return a request object whose callbacks are never invoked, so the
		// constructor's fire-and-forget open() neither resolves nor rejects.
		open: () => ({ onerror: null, onsuccess: null, onupgradeneeded: null }),
	});
	vi.stubGlobal('localStorage', {
		getItem: () => null,
		setItem: () => {},
		removeItem: () => {},
	});
	({ UnifiedTokenStorageService } = await import('../unifiedTokenStorageService'));
});

describe('UnifiedTokenStorageService.storeToken id handling', () => {
	let svc: InstanceType<typeof UnifiedTokenStorageService>;
	let stored: Array<{ id: string }>;

	beforeEach(() => {
		svc = UnifiedTokenStorageService.getInstance();
		stored = [];
		const anySvc = svc as unknown as Record<string, unknown>;
		vi.spyOn(anySvc as never, 'initializeIndexedDB' as never).mockResolvedValue(undefined as never);
		vi.spyOn(anySvc as never, 'storeInIndexedDB' as never).mockImplementation((async (t: {
			id: string;
		}) => {
			stored.push(t);
		}) as never);
		vi.spyOn(anySvc as never, 'storeInSQLite' as never).mockResolvedValue(undefined as never);
		vi.spyOn(anySvc as never, 'saveCache' as never).mockImplementation((() => {}) as never);
	});

	it('preserves an id provided on the token object instead of generating a new one', async () => {
		const tokenWithId = {
			id: 'oauth_credentials-STABLE',
			type: 'oauth_credentials' as const,
			value: 'secret',
			flowType: 'unified',
		};

		const r1 = await svc.storeToken(tokenWithId as never);
		const r2 = await svc.storeToken(tokenWithId as never);

		// Both stores must upsert the SAME stable id — not two fresh random ids.
		expect(r1.success).toBe(true);
		expect(r1.data).toBe('oauth_credentials-STABLE');
		expect(r2.data).toBe('oauth_credentials-STABLE');
		expect(stored.every((t) => t.id === 'oauth_credentials-STABLE')).toBe(true);
	});

	it('still generates an id when none is provided on the token or options', async () => {
		const r = await svc.storeToken({
			type: 'access_token',
			value: 'abc',
			flowType: 'unified',
		} as never);

		expect(r.success).toBe(true);
		expect(r.data).toMatch(/^accesstoken-\d+-/);
	});

	it('lets options.id take precedence over an id on the token object', async () => {
		const r = await svc.storeToken(
			{ id: 'from-token', type: 'access_token', value: 'abc', flowType: 'unified' } as never,
			{ id: 'from-options' } as never
		);

		expect(r.data).toBe('from-options');
	});
});
