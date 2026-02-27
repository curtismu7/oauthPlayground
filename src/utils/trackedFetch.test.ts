/**
 * Tests for trackedFetch: proxy vs direct PingOne calls and backend log-call reporting.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { trackedFetch } from './trackedFetch';

// Mock apiCallTrackerService
vi.mock('../services/apiCallTrackerService', () => ({
	apiCallTrackerService: {
		trackApiCall: vi.fn(() => 'track-id-1'),
		updateApiCallResponse: vi.fn(),
	},
}));

describe('trackedFetch', () => {
	let fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fetchCalls = [];
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
			const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
			fetchCalls.push({ url, init });
			// Return a minimal Response so trackedFetch can read status, headers, clone, json()
			return Promise.resolve(
				new Response(JSON.stringify({ data: 'test' }), {
					status: 200,
					statusText: 'OK',
					headers: new Headers({ 'content-type': 'application/json' }),
				})
			);
		});
	});

	afterEach(() => {
		fetchSpy?.mockRestore();
	});

	describe('proxy (localhost): /api/pingone/*', () => {
		it('calls fetch once and does NOT POST to /api/pingone/log-call', async () => {
			await trackedFetch('/api/pingone/token', { method: 'POST', body: '{}' });

			expect(fetchCalls.length).toBe(1);
			expect(fetchCalls[0].url).toContain('/api/pingone/token');
			expect(fetchCalls.some((c) => c.url.includes('/api/pingone/log-call'))).toBe(false);
		});

		it('calls fetch once for /api/pingone/mfa/register-device', async () => {
			await trackedFetch('/api/pingone/mfa/register-device', { method: 'POST' });

			expect(fetchCalls.length).toBe(1);
			expect(fetchCalls[0].url).toContain('/api/pingone/mfa/register-device');
		});
	});

	describe('direct (custom domain): https://api.pingone.com/*', () => {
		it('calls fetch twice: actual PingOne URL then POST /api/pingone/log-call', async () => {
			await trackedFetch('https://api.pingone.com/v1/environments', { method: 'GET' });

			expect(fetchCalls.length).toBe(2);
			expect(fetchCalls[0].url).toBe('https://api.pingone.com/v1/environments');
			expect(fetchCalls[1].url).toContain('/api/pingone/log-call');
			expect(fetchCalls[1].init?.method).toBe('POST');
			const body = JSON.parse((fetchCalls[1].init?.body as string) || '{}');
			expect(body.url).toBe('https://api.pingone.com/v1/environments');
			expect(body.method).toBe('GET');
			expect(body.status).toBe(200);
			expect(body.operationName).toBeDefined();
		});

		it('log-call payload includes operationName derived from URL path', async () => {
			await trackedFetch('https://api.pingone.com/v1/environments/env-123/users', {
				method: 'GET',
			});

			const logCall = fetchCalls.find((c) => c.url.includes('/api/pingone/log-call'));
			expect(logCall).toBeDefined();
			const body = JSON.parse((logCall!.init?.body as string) || '{}');
			expect(body.operationName).toBe('v1/environments');
			expect(body.url).toContain('/v1/environments/');
		});

		it('direct auth.pingone.com call is reported to log-call', async () => {
			await trackedFetch('https://auth.pingone.com/env-id/as/token', { method: 'POST' });

			expect(fetchCalls.length).toBe(2);
			expect(fetchCalls[0].url).toContain('auth.pingone.com');
			expect(fetchCalls[1].url).toContain('/api/pingone/log-call');
		});
	});

	describe('non-PingOne URLs', () => {
		it('does not track and does not log-call for non-PingOne URL', async () => {
			await trackedFetch('https://example.com/api', { method: 'GET' });

			// trackedFetch delegates to plain fetch for non-PingOne; only one call
			expect(fetchCalls.length).toBe(1);
			expect(fetchCalls[0].url).toBe('https://example.com/api');
		});
	});

	describe('direct call on network error', () => {
		it('still POSTs to /api/pingone/log-call with status 0 when fetch throws', async () => {
			fetchSpy.mockRejectedValueOnce(new Error('Network error'));

			await expect(
				trackedFetch('https://api.pingone.com/v1/environments', { method: 'GET' })
			).rejects.toThrow('Network error');

			// First call failed; second call is the log-call (fire-and-forget)
			expect(fetchCalls.length).toBeGreaterThanOrEqual(1);
			const logCall = fetchCalls.find((c) => c.url.includes('/api/pingone/log-call'));
			expect(logCall).toBeDefined();
			const body = JSON.parse((logCall!.init?.body as string) || '{}');
			expect(body.status).toBe(0);
			expect(body.statusText).toBe('Network Error');
		});
	});
});
