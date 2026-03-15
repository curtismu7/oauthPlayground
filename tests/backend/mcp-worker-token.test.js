import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { vi } from 'vitest';
import request from 'supertest';

// Mock fetch before server import (server uses global.fetch for PingOne API calls)
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

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
		mockFetch.mockClear();
		_testResetTokenCache();
	});

	test('credentials are loaded from mcp-config.json', () => {
		expect(ENV_ID).toBeTruthy();
		expect(CLIENT_ID).toBeTruthy();
		expect(CLIENT_SECRET).toBeTruthy();
	});

	test('POST /api/mcp/query "Get worker token" calls correct PingOne token endpoint', async () => {
		mockFetch.mockResolvedValueOnce({
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
		expect(mockFetch).toHaveBeenCalledWith(
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
		const callArgs = mockFetch.mock.calls[0];
		const body = new URLSearchParams(callArgs[1].body);
		expect(body.get('client_id')).toBe(CLIENT_ID);
		expect(body.get('grant_type')).toBe('client_credentials');
	});

	test('POST /api/mcp/query "Get worker token" returns credentialsRequired on token failure', async () => {
		mockFetch.mockResolvedValueOnce({
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
		mockFetch.mockResolvedValueOnce({
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

		mockFetch.mockClear();

		// Second call — should hit cache, no fetch
		const response = await request(app)
			.post('/api/mcp/query')
			.send({ query: 'Get worker token' })
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(response.body.data?.cached).toBe(true);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	test('POST /api/mcp/query "List MCP tools" returns tool list without credentials', async () => {
		const response = await request(app)
			.post('/api/mcp/query')
			.send({ query: 'List MCP tools' })
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(response.body.answer).toContain('MCP tools available');
		expect(response.body.data).toBeInstanceOf(Array);
		expect(response.body.data.length).toBeGreaterThan(5);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	test('POST /api/mcp/query "Create application named MyApp" calls PingOne applications API', async () => {
		// Pass workerToken so we skip token fetch; mock only the applications POST
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 201,
			json: () =>
				Promise.resolve({
					id: 'app-uuid-123',
					name: 'MyApp',
					oidcOptions: { clientId: 'client-id-abc' },
				}),
		});

		const response = await request(app)
			.post('/api/mcp/query')
			.send({
				query: 'Create application named MyApp',
				workerToken: 'mock_worker_token',
				environmentId: ENV_ID,
				region: 'us',
			})
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(response.body.answer).toContain('Created application');
		expect(response.body.answer).toContain('MyApp');
		expect(response.body.mcpTool).toBe('pingone_create_application');

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const appsCall = mockFetch.mock.calls[0];
		expect(appsCall[0]).toContain(`/environments/${ENV_ID}/applications`);
		expect(appsCall[1].method).toBe('POST');
		const body = JSON.parse(appsCall[1].body);
		expect(body.name).toBe('MyApp');
		expect(body.protocol).toBe('OPENID_CONNECT');
	});

	test('POST /api/mcp/query "Delete user <uuid>" calls PingOne users DELETE', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 204,
		});

		const userId = 'c5896dcc-5978-4338-ba4d-c8808a256a85';
		const response = await request(app)
			.post('/api/mcp/query')
			.send({
				query: `Delete user ${userId}`,
				workerToken: 'mock_worker_token',
				environmentId: ENV_ID,
				region: 'us',
			})
			.expect(200);

		expect(response.body.success).toBe(true);
		expect(response.body.answer).toContain('Deleted user');
		expect(response.body.mcpTool).toBe('pingone_delete_user');

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const call = mockFetch.mock.calls[0];
		expect(call[0]).toContain(`/environments/${ENV_ID}/users/${userId}`);
		expect(call[1].method).toBe('DELETE');
	});
});
