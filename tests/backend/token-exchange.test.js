import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';

describe('API Token Exchange Endpoint', () => {
	const mockPingOneResponse = {
		access_token: 'mock_access_token_123',
		refresh_token: 'mock_refresh_token_456',
		id_token: 'mock_id_token_789',
		token_type: 'Bearer',
		expires_in: 3600,
		scope: 'openid profile email',
	};

	beforeEach(() => {
		// Reset fetch mock before each test
		global.fetch.mockClear();
	});

	test('POST /api/token-exchange rejects requests without grant_type', async () => {
		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				client_id: 'test-client',
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing required parameters');
	});

	test('POST /api/token-exchange rejects requests without client_id', async () => {
		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing required parameters');
	});

	test('POST /api/token-exchange rejects authorization_code grant without code', async () => {
		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing required parameter: code');
	});

	test('POST /api/token-exchange rejects refresh_token grant without refresh_token', async () => {
		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'refresh_token',
				client_id: 'test-client',
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing required parameter: refresh_token');
	});

	test('POST /api/token-exchange rejects requests without environment_id', async () => {
		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				code: 'test-code',
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing environment_id');
	});

	test('POST /api/token-exchange successfully exchanges authorization code', async () => {
		// Mock successful PingOne response
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockPingOneResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				client_secret: 'test-secret',
				code: 'auth-code-123',
				redirect_uri: 'https://localhost:3000/callback',
				environment_id: 'test-env-123',
			})
			.expect(200);

		// Verify response structure
		expect(response.body).toMatchObject({
			access_token: 'mock_access_token_123',
			refresh_token: 'mock_refresh_token_456',
			id_token: 'mock_id_token_789',
			token_type: 'Bearer',
			expires_in: 3600,
			scope: 'openid profile email',
			server_timestamp: expect.any(String),
			grant_type: 'authorization_code',
		});

		// Verify fetch was called with correct parameters
		expect(global.fetch).toHaveBeenCalledWith(
			'https://auth.pingone.com/test-env-123/as/token',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				}),
				body: expect.any(String),
			})
		);

		// Verify request body contains expected parameters
		const fetchCall = global.fetch.mock.calls[0];
		const requestBody = fetchCall[1].body;
		expect(requestBody).toContain('grant_type=authorization_code');
		expect(requestBody).toContain('client_id=test-client');
		expect(requestBody).toContain('client_secret=test-secret');
		expect(requestBody).toContain('code=auth-code-123');
		expect(requestBody).toContain('redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fcallback');
	});

	test('POST /api/token-exchange successfully exchanges refresh token', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockPingOneResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'refresh_token',
				client_id: 'test-client',
				client_secret: 'test-secret',
				refresh_token: 'refresh-token-123',
				environment_id: 'test-env-123',
			})
			.expect(200);

		expect(response.body.grant_type).toBe('refresh_token');

		const fetchCall = global.fetch.mock.calls[0];
		const requestBody = fetchCall[1].body;
		expect(requestBody).toContain('grant_type=refresh_token');
		expect(requestBody).toContain('refresh_token=refresh-token-123');
	});

	test('POST /api/token-exchange handles public client (no secret)', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockPingOneResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				code: 'auth-code-123',
				redirect_uri: 'https://localhost:3000/callback',
				environment_id: 'test-env-123',
			})
			.expect(200);

		expect(response.body.access_token).toBe('mock_access_token_123');
	});

	test('POST /api/token-exchange handles basic auth client authentication', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockPingOneResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				client_secret: 'test-secret',
				client_auth_method: 'client_secret_basic',
				code: 'auth-code-123',
				redirect_uri: 'https://localhost:3000/callback',
				environment_id: 'test-env-123',
			})
			.expect(200);

		const fetchCall = global.fetch.mock.calls[0];
		const headers = fetchCall[1].headers;
		expect(headers.Authorization).toMatch(/^Basic /);
	});

	test('POST /api/token-exchange handles JWT bearer authentication', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockPingOneResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				client_auth_method: 'client_secret_jwt',
				client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
				client_assertion: 'jwt-token-123',
				code: 'auth-code-123',
				redirect_uri: 'https://localhost:3000/callback',
				environment_id: 'test-env-123',
			})
			.expect(200);

		const fetchCall = global.fetch.mock.calls[0];
		const requestBody = fetchCall[1].body;
		expect(requestBody).toContain(
			'client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer'
		);
		expect(requestBody).toContain('client_assertion=jwt-token-123');
	});

	test('POST /api/token-exchange handles PKCE code verifier', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockPingOneResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				code: 'auth-code-123',
				code_verifier: 'pkce-code-verifier-123',
				redirect_uri: 'https://localhost:3000/callback',
				environment_id: 'test-env-123',
			})
			.expect(200);

		const fetchCall = global.fetch.mock.calls[0];
		const requestBody = fetchCall[1].body;
		expect(requestBody).toContain('code_verifier=pkce-code-verifier-123');
	});

	test('POST /api/token-exchange forwards PingOne errors', async () => {
		const pingOneError = {
			error: 'invalid_grant',
			error_description: 'Authorization code is invalid or has expired',
		};

		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () => Promise.resolve(pingOneError),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				code: 'invalid-code',
				redirect_uri: 'https://localhost:3000/callback',
				environment_id: 'test-env-123',
			})
			.expect(400);

		expect(response.body).toEqual(pingOneError);
	});

	test('POST /api/token-exchange handles network errors', async () => {
		global.fetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await request(app)
			.post('/api/token-exchange')
			.send({
				grant_type: 'authorization_code',
				client_id: 'test-client',
				code: 'auth-code-123',
				redirect_uri: 'https://localhost:3000/callback',
				environment_id: 'test-env-123',
			})
			.expect(500);

		expect(response.body.error).toBe('server_error');
		expect(response.body.error_description).toContain('Internal server error');
	});
});
