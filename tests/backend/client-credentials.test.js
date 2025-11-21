import request from 'supertest';
import app from '../../server.js';

describe('API Client Credentials Endpoint', () => {
	const mockPingOneResponse = {
		access_token: 'mock_client_credentials_token',
		token_type: 'Bearer',
		expires_in: 3600,
		scope: 'read write',
	};

	beforeEach(() => {
		global.fetch.mockClear();
	});

	test('POST /api/client-credentials rejects requests without environment_id', async () => {
		const response = await request(app)
			.post('/api/client-credentials')
			.send({
				auth_method: 'client_secret_post',
				body: {
					grant_type: 'client_credentials',
					client_id: 'test-client',
					client_secret: 'test-secret',
				},
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing required parameter: environment_id');
	});

	test('POST /api/client-credentials successfully exchanges client credentials', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockPingOneResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/client-credentials')
			.send({
				environment_id: 'test-env-123',
				auth_method: 'client_secret_post',
				body: {
					grant_type: 'client_credentials',
					client_id: 'test-client',
					client_secret: 'test-secret',
					scope: 'read write',
				},
			})
			.expect(200);

		expect(response.body).toMatchObject({
			access_token: 'mock_client_credentials_token',
			token_type: 'Bearer',
			expires_in: 3600,
			scope: 'read write',
			server_timestamp: expect.any(String),
			grant_type: 'client_credentials',
		});

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
	});

	test('POST /api/client-credentials forwards PingOne errors', async () => {
		const pingOneError = {
			error: 'invalid_client',
			error_description: 'Client authentication failed',
		};

		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: () => Promise.resolve(pingOneError),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/client-credentials')
			.send({
				environment_id: 'test-env-123',
				auth_method: 'client_secret_post',
				body: {
					grant_type: 'client_credentials',
					client_id: 'invalid-client',
					client_secret: 'wrong-secret',
				},
			})
			.expect(401);

		expect(response.body).toEqual(pingOneError);
	});
});
