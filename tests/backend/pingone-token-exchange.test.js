/**
 * /api/pingone/token-exchange — RFC 8693 Token Exchange endpoint tests
 *
 * Run: pnpm vitest run tests/backend/pingone-token-exchange.test.js
 */

import { vi } from 'vitest';
import request from 'supertest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import app from '../../server.js';

const MOCK_TOKEN_RESPONSE = {
	access_token: 'exchanged_access_token_abc',
	token_type: 'Bearer',
	expires_in: 3600,
	scope: 'openid profile',
	issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
};

function makeHeaders(map = {}) {
	return {
		get: (k) => map[k] ?? null,
		forEach: (fn) => Object.entries(map).forEach(([k, v]) => fn(v, k)),
	};
}

function mockSuccess() {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		statusText: 'OK',
		text: () => Promise.resolve(JSON.stringify(MOCK_TOKEN_RESPONSE)),
		headers: makeHeaders({ 'Content-Type': 'application/json' }),
	});
}

function mockPingOneError(status, body) {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		status,
		statusText: String(status),
		text: () => Promise.resolve(JSON.stringify(body)),
		headers: makeHeaders({}),
	});
}

beforeEach(() => mockFetch.mockClear());

describe('POST /api/pingone/token-exchange (RFC 8693)', () => {
	describe('input validation', () => {
		test('rejects missing environmentId', async () => {
			const res = await request(app)
				.post('/api/pingone/token-exchange')
				.send({ clientId: 'cid', subjectToken: 'tok' })
				.expect(400);
			expect(res.body.error).toBe('invalid_request');
			expect(res.body.error_description).toMatch(/environmentId/i);
		});

		test('rejects missing clientId', async () => {
			const res = await request(app)
				.post('/api/pingone/token-exchange')
				.send({ environmentId: 'env-id', subjectToken: 'tok' })
				.expect(400);
			expect(res.body.error).toBe('invalid_request');
			expect(res.body.error_description).toMatch(/clientId/i);
		});

		test('rejects missing subjectToken', async () => {
			const res = await request(app)
				.post('/api/pingone/token-exchange')
				.send({ environmentId: 'env-id', clientId: 'cid' })
				.expect(400);
			expect(res.body.error).toBe('invalid_request');
			expect(res.body.error_description).toMatch(/subjectToken/i);
		});
	});

	describe('successful exchange', () => {
		test('calls PingOne with correct RFC 8693 grant_type', async () => {
			mockSuccess();
			const res = await request(app)
				.post('/api/pingone/token-exchange')
				.send({
					environmentId: 'env-123',
					clientId: 'client-abc',
					clientSecret: 'secret-xyz',
					subjectToken: 'original_access_token',
					region: 'us',
				})
				.expect(200);

			expect(res.body.access_token).toBe('exchanged_access_token_abc');
			expect(res.body.grant_type).toBe('urn:ietf:params:oauth:grant-type:token-exchange');
			expect(res.body.server_timestamp).toBeDefined();

			// Verify the correct endpoint was called
			const [calledUrl, calledOpts] = mockFetch.mock.calls[0];
			expect(calledUrl).toBe('https://auth.pingone.com/env-123/as/token');
			const body = new URLSearchParams(calledOpts.body);
			expect(body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:token-exchange');
			expect(body.get('client_id')).toBe('client-abc');
			expect(body.get('client_secret')).toBe('secret-xyz');
			expect(body.get('subject_token')).toBe('original_access_token');
			expect(body.get('subject_token_type')).toBe('urn:ietf:params:oauth:token-type:access_token');
		});

		test('passes optional requestedScopes and audience', async () => {
			mockSuccess();
			await request(app)
				.post('/api/pingone/token-exchange')
				.send({
					environmentId: 'env-123',
					clientId: 'client-abc',
					subjectToken: 'tok',
					requestedScopes: 'transfer:funds account:read',
					audience: 'https://banking.example.com',
				})
				.expect(200);

			const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
			expect(body.get('scope')).toBe('transfer:funds account:read');
			expect(body.get('audience')).toBe('https://banking.example.com');
		});

		test('works without clientSecret (public client)', async () => {
			mockSuccess();
			await request(app)
				.post('/api/pingone/token-exchange')
				.send({ environmentId: 'env-123', clientId: 'cid', subjectToken: 'tok' })
				.expect(200);

			const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
			expect(body.has('client_secret')).toBe(false);
		});
	});

	describe('region routing', () => {
		test.each([
			['eu', 'https://auth.pingone.eu'],
			['ca', 'https://auth.pingone.ca'],
			['ap', 'https://auth.pingone.asia'],
			['us', 'https://auth.pingone.com'],
		])('routes region=%s to %s', async (region, expectedBase) => {
			mockSuccess();
			await request(app)
				.post('/api/pingone/token-exchange')
				.send({ environmentId: 'env-123', clientId: 'cid', subjectToken: 'tok', region })
				.expect(200);

			const [calledUrl] = mockFetch.mock.calls[0];
			expect(calledUrl).toMatch(expectedBase);
		});
	});

	describe('PingOne error propagation', () => {
		test('forwards PingOne 401 error', async () => {
			mockPingOneError(401, {
				error: 'invalid_client',
				error_description: 'Bad client credentials',
			});
			const res = await request(app)
				.post('/api/pingone/token-exchange')
				.send({ environmentId: 'env-123', clientId: 'bad-client', subjectToken: 'tok' })
				.expect(401);
			expect(res.body.error).toBe('invalid_client');
		});

		test('forwards PingOne 400 error', async () => {
			mockPingOneError(400, {
				error: 'invalid_grant',
				error_description: 'Subject token is invalid',
			});
			const res = await request(app)
				.post('/api/pingone/token-exchange')
				.send({ environmentId: 'env-123', clientId: 'cid', subjectToken: 'expired_tok' })
				.expect(400);
			expect(res.body.error).toBe('invalid_grant');
		});
	});
});
