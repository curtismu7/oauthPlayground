/**
 * PingOneLoginService — pi.flow unit tests
 *
 * Tests the 3-step redirectless login flow:
 *   1. initializeEmbeddedLogin  → POST /api/pingone/redirectless/authorize
 *   2. submitCredentials        → POST /api/pingone/flows/check-username-password
 *   3. resumeFlow               → POST /api/pingone/resume  → tokens
 *
 * All fetch calls are mocked — no server or PingOne required.
 */

import { describe, beforeEach, vi, expect, it } from 'vitest';
import { PingOneLoginService } from '../pingOneLoginService';

// Mock global fetch before importing the service
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const ENV_ID = 'env-test-123';
const CLIENT_ID = 'client-test-abc';
const FLOW_ID = 'flow-id-xyz';
const RESUME_URL = `https://auth.pingone.com/${ENV_ID}/as/resume?flowId=${FLOW_ID}`;
const SESSION_ID = 'session-id-abc';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function mockAuthorizeSuccess() {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				id: FLOW_ID,
				_sessionId: SESSION_ID,
				resumeUrl: RESUME_URL,
				status: 'USERNAME_PASSWORD_REQUIRED',
			}),
	});
}

function mockAuthorizeFailure() {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		status: 400,
		json: () =>
			Promise.resolve({ error: 'invalid_request', error_description: 'Bad client config' }),
	});
}

function mockCheckCredentialsSuccess() {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		json: () => Promise.resolve({}),
	});
}

function mockCheckCredentialsFailure() {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		status: 401,
		json: () =>
			Promise.resolve({
				error: 'credentials_rejected',
				error_description: 'Invalid username or password',
			}),
	});
}

function mockResumeSuccessFlat() {
	// Tokens at top level (server already flattened them)
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				access_token: 'user_access_token',
				id_token: 'user_id_token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'openid profile email',
			}),
	});
}

function mockResumeSuccessNested() {
	// Tokens nested in authorizeResponse (raw PingOne response, before server fixes it)
	// This tests the client-side fallback in pingOneLoginService.
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				id: FLOW_ID,
				status: 'COMPLETED',
				resumeUrl: RESUME_URL,
				createdAt: '2026-03-15T00:00:00Z',
				expiresAt: '2026-03-15T01:00:00Z',
				authorizeResponse: {
					access_token: 'user_access_token_nested',
					id_token: 'user_id_token_nested',
					token_type: 'Bearer',
					expires_in: 3600,
					scope: 'openid profile',
				},
			}),
	});
}

function mockResumeFailure() {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		status: 400,
		json: () => Promise.resolve({ error: 'resume_failed', error_description: 'Session expired' }),
	});
}

/* ── Tests ───────────────────────────────────────────────────────────────── */

beforeEach(() => {
	mockFetch.mockClear();
	PingOneLoginService.clearFlowParams(FLOW_ID);
});

describe('PingOneLoginService.initializeEmbeddedLogin', () => {
	it('calls /api/pingone/redirectless/authorize with response_type=code (Authorization Code + PKCE)', async () => {
		mockAuthorizeSuccess();

		const result = await PingOneLoginService.initializeEmbeddedLogin(ENV_ID, CLIENT_ID, undefined, [
			'openid',
			'profile',
			'email',
		]);

		expect(result.success).toBe(true);
		expect(result.data?.flowId).toBe(FLOW_ID);
		expect(result.data?.sessionId).toBe(SESSION_ID);
		// codeVerifier should be returned so the caller can pass it to resumeFlow if needed
		expect(result.data?.codeVerifier).toBeTruthy();

		const [url, opts] = mockFetch.mock.calls[0];
		expect(url).toContain('/api/pingone/redirectless/authorize');
		const body = JSON.parse(opts.body);
		expect(body.response_type).toBe('code');
		expect(body.environmentId).toBe(ENV_ID);
		expect(body.clientId).toBe(CLIENT_ID);
	});

	it('includes PKCE code_challenge (S256) and does NOT include nonce', async () => {
		mockAuthorizeSuccess();
		await PingOneLoginService.initializeEmbeddedLogin(ENV_ID, CLIENT_ID);
		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		// PKCE verifier is generated internally; challenge goes in the request
		expect(body.codeChallenge).toBeTruthy();
		expect(body.codeChallengeMethod).toBe('S256');
		// nonce is not used in Authorization Code flow
		expect(body.nonce).toBeUndefined();
		// code_verifier stays client-side — never sent in the authorize request
		expect(body.codeVerifier).toBeUndefined();
	});

	it('includes region when provided', async () => {
		mockAuthorizeSuccess();
		await PingOneLoginService.initializeEmbeddedLogin(
			ENV_ID,
			CLIENT_ID,
			undefined,
			['openid'],
			'eu'
		);
		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.region).toBe('eu');
	});

	it('returns failure when PingOne rejects the request', async () => {
		mockAuthorizeFailure();
		const result = await PingOneLoginService.initializeEmbeddedLogin(ENV_ID, CLIENT_ID);
		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});
});

/**
 * Helper: seed FLOW_PARAMS_STORE via initializeEmbeddedLogin mock so
 * resumeFlow (which only takes flowId) can find the stored params.
 */
async function seedFlowParams(customResumeUrl = RESUME_URL) {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		json: () =>
			Promise.resolve({
				id: FLOW_ID,
				_sessionId: SESSION_ID,
				resumeUrl: customResumeUrl,
				status: 'USERNAME_PASSWORD_REQUIRED',
			}),
	});
	await PingOneLoginService.initializeEmbeddedLogin(ENV_ID, CLIENT_ID);
}

describe('PingOneLoginService.resumeFlow — token extraction', () => {
	it('extracts access_token from flat top-level response', async () => {
		await seedFlowParams();
		mockResumeSuccessFlat();

		const result = await PingOneLoginService.resumeFlow(FLOW_ID);

		expect(result.success).toBe(true);
		expect(result.data?.access_token).toBe('user_access_token');
		expect(result.data?.id_token).toBe('user_id_token');
		expect(result.data?.expires_in).toBe(3600);
	});

	it('extracts access_token from nested authorizeResponse (client-side fallback)', async () => {
		await seedFlowParams();
		mockResumeSuccessNested();

		const result = await PingOneLoginService.resumeFlow(FLOW_ID);

		expect(result.success).toBe(true);
		expect(result.data?.access_token).toBe('user_access_token_nested');
		expect(result.data?.id_token).toBe('user_id_token_nested');
	});

	it('returns failure when no access_token in response', async () => {
		await seedFlowParams();
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					id: FLOW_ID,
					status: 'COMPLETED',
					// No access_token, no authorizeResponse
				}),
		});

		const result = await PingOneLoginService.resumeFlow(FLOW_ID);

		expect(result.success).toBe(false);
		expect(result.error?.message).toMatch(/Token not found/i);
	});

	it('returns failure when resume endpoint returns HTTP error', async () => {
		await seedFlowParams();
		mockResumeFailure();

		const result = await PingOneLoginService.resumeFlow(FLOW_ID);

		expect(result.success).toBe(false);
	});

	it('returns failure when flow params not found (no prior initializeEmbeddedLogin)', async () => {
		// Use a flowId that was never seeded
		const result = await PingOneLoginService.resumeFlow('non-existent-flow-id');
		expect(result.success).toBe(false);
		expect(result.error?.message).toMatch(/Flow parameters not found/i);
	});

	it('exchanges authorization code for tokens when resume returns { code } (PKCE code flow)', async () => {
		await seedFlowParams();

		// Step 3: resume → returns authorization code
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ code: 'auth-code-xyz-123', state: 'pi-flow-state' }),
		});

		// Step 4: token exchange → returns tokens
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					access_token: 'exchanged_access_token_pkce',
					id_token: 'exchanged_id_token_pkce',
					token_type: 'Bearer',
					expires_in: 3600,
					scope: 'openid profile email',
				}),
		});

		const result = await PingOneLoginService.resumeFlow(FLOW_ID, 'client-secret-xyz');

		expect(result.success).toBe(true);
		expect(result.data?.access_token).toBe('exchanged_access_token_pkce');
		expect(result.data?.id_token).toBe('exchanged_id_token_pkce');

		// Verify the token exchange call included the code and code_verifier
		const tokenExchangeCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
		const exchangeBody = JSON.parse(tokenExchangeCall[1].body);
		expect(exchangeBody.code).toBe('auth-code-xyz-123');
		expect(exchangeBody.code_verifier).toBeTruthy();
		expect(exchangeBody.grant_type).toBe('authorization_code');
		expect(exchangeBody.client_secret).toBe('client-secret-xyz');
	});

	it('returns failure when code exchange fails', async () => {
		await seedFlowParams();

		// Resume returns authorization code
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ code: 'auth-code-xyz-123' }),
		});
		// Token exchange fails
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () => Promise.resolve({ error: 'invalid_grant', error_description: 'Code expired' }),
		});

		const result = await PingOneLoginService.resumeFlow(FLOW_ID, 'client-secret-xyz');
		expect(result.success).toBe(false);
	});
});
