import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import request from 'supertest';
import app, { _testResetTokenCache } from '../../server.js';

// Credentials loaded from mcp-config.json (our storage system — not .env)
const MCP_CRED_FILE = join(homedir(), '.pingone-playground', 'credentials', 'mcp-config.json');
let storedCreds = {};
try { storedCreds = JSON.parse(readFileSync(MCP_CRED_FILE, 'utf8')); } catch {}

const ENV_ID = storedCreds.environmentId;
const CLIENT_ID = storedCreds.clientId;
const CLIENT_SECRET = storedCreds.clientSecret;
const TOKEN_URL = `https://auth.pingone.com/${ENV_ID}/as/token`;

describe('MCP Worker Token', () => {
	beforeEach(() => {
		global.fetch.mockClear();
		_testResetTokenCache();
	});

	test('credentials are loaded from mcp-config.json', () => {
		expect(ENV_ID).toBeTruthy();
		expect(CLIENT_ID).toBeTruthy();
		expect(CLIENT_SECRET).toBeTruthy();
	});

	test('POST /api/mcp/query "Get worker token" calls correct PingOne token endpoint', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					access_token: 'mock_worker_access_token',
					token_type: 'Bearer',
					expires_in: 3600,
					scope: 'openid',
				}),
		});

		const response = await request(app)
			.post('/api/mcp/query')
			.send({ query: 'Get worker token' })
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(response.body.data).toMatchObject({
			tokenType: 'Bearer',
			expiresIn: 3600,
		});

		// Verify the token request was sent to the correct PingOne endpoint
		expect(global.fetch).toHaveBeenCalledWith(
			TOKEN_URL,
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/x-www-form-urlencoded',
				}),
				body: expect.stringContaining('grant_type=client_credentials'),
			})
		);

		// Verify stored client_id was used
		const callArgs = global.fetch.mock.calls[0];
		const body = new URLSearchParams(callArgs[1].body);
		expect(body.get('client_id')).toBe(CLIENT_ID);
		expect(body.get('grant_type')).toBe('client_credentials');
	});

	test('POST /api/mcp/query "Get worker token" returns credentialsRequired on token failure', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () =>
				Promise.resolve({
					error: 'invalid_client',
					error_description: 'Client authentication failed',
				}),
		});

		const response = await request(app)
			.post('/api/mcp/query')
			.send({ query: 'Get worker token' })
			.expect(200);

		expect(response.body.success).toBe(false);
		expect(response.body.credentialsRequired).toBe(true);
		expect(response.body.answer).toContain('❌');
	});

	test('POST /api/mcp/query "Get worker token" serves cached token on repeat call', async () => {
		// First call — populate cache
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					access_token: 'cached_token_abc',
					token_type: 'Bearer',
					expires_in: 3600,
				}),
		});

		await request(app)
			.post('/api/mcp/query')
			.send({ query: 'Get worker token' })
			.expect(200);

		global.fetch.mockClear();

		// Second call — should hit cache, no fetch
		const response = await request(app)
			.post('/api/mcp/query')
			.send({ query: 'Get worker token' })
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(response.body.data?.cached).toBe(true);
		expect(global.fetch).not.toHaveBeenCalled();
	});
});
