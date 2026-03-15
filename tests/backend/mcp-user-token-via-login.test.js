/**
 * /api/mcp/user-token-via-login — backend endpoint tests
 *
 * Covers the 4-step backend pi.flow that returns a user access token
 * (authorize → check-username-password → resume → token exchange).
 *
 * Run: pnpm vitest run tests/backend/mcp-user-token-via-login.test.js
 */

import { vi } from 'vitest';
import request from 'supertest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import app from '../../server.js';

const ENV_ID = 'env-abc-123';
const CLIENT_ID = 'client-xyz';
const CLIENT_SECRET = 'secret-abc';
const AUTH_DOMAIN = `https://auth.pingone.com/${ENV_ID}`;

/** Build mock responses for each step of the flow */
function mockFullFlow({
	authorizeOk = true,
	checkOk = true,
	resumeOk = true,
	tokenOk = true,
	resumeReturnsNestedTokens = false,
} = {}) {
	// Step 1: /api/pingone/redirectless/authorize (internal call from backend to itself)
	// Since the backend calls itself via fetch(baseUrl + /api/pingone/redirectless/authorize),
	// we need to let that call through (or supertest will handle it). In unit test context
	// we mock the outbound PingOne calls instead and let Express handle internal routes.
	// So instead we mock the actual PingOne authorize call that redirectless/authorize makes.

	// PingOne authorize start → returns flow JSON (includes _sessionId required by the handler)
	if (authorizeOk) {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					id: 'flow-id-123',
					_sessionId: 'session-id-abc',
					resumeUrl: `${AUTH_DOMAIN}/as/resume?flowId=flow-id-123`,
					_links: { checkUsernamePassword: { href: `${AUTH_DOMAIN}/flows/flow-id-123` } },
				}),
		});
	} else {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ error: 'invalid_request', error_description: 'Bad request' }),
		});
	}

	if (!authorizeOk) return;

	// Step 2: PingOne check username/password → 200 OK
	if (checkOk) {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({}),
		});
	} else {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: () =>
				Promise.resolve({
					error: 'credentials_rejected',
					error_description: 'Invalid credentials',
				}),
		});
	}

	if (!checkOk) return;

	// Step 3: PingOne resume → authorization code (or error)
	if (resumeOk) {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve(
					resumeReturnsNestedTokens
						? {
								id: 'flow-id-123',
								resumeUrl: `${AUTH_DOMAIN}/as/resume`,
								status: 'COMPLETED',
								authorizeResponse: { code: 'auth-code-abc' },
							}
						: { code: 'auth-code-abc' }
				),
		});
	} else {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ error: 'resume_failed' }),
		});
	}

	if (!resumeOk) return;

	// Step 4: PingOne token endpoint → tokens
	if (tokenOk) {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					access_token: 'user_access_token_xyz',
					id_token: 'user_id_token_xyz',
					token_type: 'Bearer',
					expires_in: 3600,
				}),
		});
	} else {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ error: 'invalid_grant', error_description: 'Code expired' }),
		});
	}
}

beforeEach(() => mockFetch.mockReset());

describe('POST /api/mcp/user-token-via-login', () => {
	describe('input validation', () => {
		test('rejects missing environmentId', async () => {
			const res = await request(app)
				.post('/api/mcp/user-token-via-login')
				.send({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, username: 'u', password: 'p' })
				.expect(400);
			expect(res.body.error).toBe('invalid_request');
		});

		test('rejects missing username', async () => {
			const res = await request(app)
				.post('/api/mcp/user-token-via-login')
				.send({
					environmentId: ENV_ID,
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					password: 'p',
				})
				.expect(400);
			expect(res.body.error).toBe('invalid_request');
		});

		test('rejects missing password', async () => {
			const res = await request(app)
				.post('/api/mcp/user-token-via-login')
				.send({
					environmentId: ENV_ID,
					clientId: CLIENT_ID,
					clientSecret: CLIENT_SECRET,
					username: 'u',
				})
				.expect(400);
			expect(res.body.error).toBe('invalid_request');
		});
	});

	describe('successful flow', () => {
		test('returns access_token and id_token on success', async () => {
			mockFullFlow();
			const res = await request(app).post('/api/mcp/user-token-via-login').send({
				environmentId: ENV_ID,
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				username: 'alice@acme.com',
				password: 'secret123',
				region: 'us',
			});

			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.access_token).toBe('user_access_token_xyz');
			expect(res.body.id_token).toBe('user_id_token_xyz');
			expect(res.body.token_type).toBe('Bearer');
			expect(typeof res.body.expires_in).toBe('number');
		});

		test('response includes id_token when PingOne returns it', async () => {
			mockFullFlow();
			const res = await request(app).post('/api/mcp/user-token-via-login').send({
				environmentId: ENV_ID,
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				username: 'alice@acme.com',
				password: 'secret123',
			});
			expect(res.status).toBe(200);
			expect(res.body.id_token).toBe('user_id_token_xyz');
		});
	});

	describe('error propagation', () => {
		test('returns 401 when credentials rejected by PingOne', async () => {
			mockFullFlow({ checkOk: false });
			const res = await request(app).post('/api/mcp/user-token-via-login').send({
				environmentId: ENV_ID,
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				username: 'alice@acme.com',
				password: 'wrongpassword',
				region: 'us',
			});
			expect(res.status).toBe(401);
			expect(res.body.success).toBe(false);
			expect(res.body.error).toBe('credentials_rejected');
		});

		test('returns 400 when authorize step fails', async () => {
			mockFullFlow({ authorizeOk: false });
			const res = await request(app).post('/api/mcp/user-token-via-login').send({
				environmentId: ENV_ID,
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				username: 'alice@acme.com',
				password: 'secret123',
			});
			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
		});

		test('returns 400 when resume fails', async () => {
			mockFullFlow({ resumeOk: false });
			const res = await request(app).post('/api/mcp/user-token-via-login').send({
				environmentId: ENV_ID,
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				username: 'alice@acme.com',
				password: 'secret123',
			});
			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
		});

		test('returns error when token exchange fails', async () => {
			mockFullFlow({ tokenOk: false });
			const res = await request(app).post('/api/mcp/user-token-via-login').send({
				environmentId: ENV_ID,
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				username: 'alice@acme.com',
				password: 'secret123',
			});
			expect(res.status).toBeGreaterThanOrEqual(400);
			expect(res.body.success).toBe(false);
		});
	});
});
