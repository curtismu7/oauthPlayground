const request = require('supertest');
const app = require('../../server.js');

describe('API Device Authorization and PAR Endpoints', () => {
	const mockDeviceResponse = {
		device_code: 'device-code-123',
		user_code: 'ABC123',
		verification_uri: 'https://auth.pingone.com/test/device',
		verification_uri_complete: 'https://auth.pingone.com/test/device?user_code=ABC123',
		expires_in: 1800,
		interval: 5,
	};

	const mockParResponse = {
		request_uri: 'urn:ietf:params:oauth:request_uri:abc123',
		expires_in: 600,
	};

	beforeEach(() => {
		global.fetch.mockClear();
	});

	test('POST /api/device-authorization successfully initiates device flow', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockDeviceResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/device-authorization')
			.send({
				environment_id: 'test-env-123',
				client_id: 'test-client',
				scope: 'openid profile email',
			})
			.expect(200);

		expect(response.body).toMatchObject({
			device_code: 'device-code-123',
			user_code: 'ABC123',
			verification_uri: 'https://auth.pingone.com/test/device',
			server_timestamp: expect.any(String),
		});
	});

	test('POST /api/device-authorization rejects requests without required params', async () => {
		const response = await request(app)
			.post('/api/device-authorization')
			.send({
				environment_id: 'test-env-123',
				// missing client_id
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
	});

	test('GET /api/device-userinfo successfully retrieves user info', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () =>
				Promise.resolve({
					sub: 'user123',
					email: 'user@example.com',
					name: 'Test User',
				}),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.get('/api/device-userinfo')
			.query({
				access_token: 'device-access-token-123',
				environment_id: 'test-env-123',
			})
			.expect(200);

		expect(response.body.sub).toBe('user123');
		expect(response.body.email).toBe('user@example.com');
		expect(response.body.name).toBe('Test User');
		expect(response.body.server_timestamp).toBeDefined();

		expect(global.fetch).toHaveBeenCalledWith(
			'https://auth.pingone.com/test-env-123/as/userinfo',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer device-access-token-123',
					Accept: 'application/json',
				}),
			})
		);
	});

	test('GET /api/device-userinfo rejects requests without access_token', async () => {
		const response = await request(app)
			.get('/api/device-userinfo')
			.query({
				environment_id: 'test-env-123',
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing required parameters');
	});

	test('GET /api/device-userinfo rejects requests without environment_id', async () => {
		const response = await request(app)
			.get('/api/device-userinfo')
			.query({
				access_token: 'device-access-token-123',
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
		expect(response.body.error_description).toContain('Missing required parameters');
	});

	test('POST /api/par successfully generates PAR request', async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve(mockParResponse),
			headers: new Map([['content-type', 'application/json']]),
		});

		const response = await request(app)
			.post('/api/par')
			.send({
				environment_id: 'test-env-123',
				client_id: 'test-client',
				client_secret: 'test-secret',
				scope: 'openid profile email',
				response_type: 'code',
				redirect_uri: 'https://localhost:3000/callback',
			})
			.expect(200);

		expect(response.body).toMatchObject({
			request_uri: 'urn:ietf:params:oauth:request_uri:abc123',
			expires_in: 600,
			server_timestamp: expect.any(String),
		});
	});

	test('POST /api/par rejects requests without required params', async () => {
		const response = await request(app)
			.post('/api/par')
			.send({
				environment_id: 'test-env-123',
				// missing client_id
			})
			.expect(400);

		expect(response.body.error).toBe('invalid_request');
	});
});
