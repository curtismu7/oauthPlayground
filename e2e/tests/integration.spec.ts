import { expect, test } from '@playwright/test';

test.describe('Frontend-Backend Integration Tests', () => {
	test.beforeEach(async ({ page }) => {
		test.setTimeout(45000);
		await page.goto('http://localhost:3000');
		await page.waitForLoadState('networkidle');
	});

	test('Frontend can load environment configuration from backend', async ({ page }) => {
		// Test that frontend successfully loads config from backend
		const response = await page.request.get('http://localhost:3001/api/env-config');
		expect(response.status()).toBe(200);

		const config = await response.json();
		expect(config).toHaveProperty('environmentId');
		expect(config).toHaveProperty('redirectUri');
	});

	test('Frontend health check integration works', async ({ page }) => {
		// Test backend health endpoint
		const healthResponse = await page.request.get('http://localhost:3001/api/health');
		expect(healthResponse.status()).toBe(200);

		const health = await healthResponse.json();
		expect(health.status).toBe('ok');
		expect(health).toHaveProperty('uptimeSeconds');
	});

	test('Token exchange flow integration (mock)', async ({ page }) => {
		// Test the token exchange endpoint structure
		const testPayload = {
			grant_type: 'authorization_code',
			client_id: 'test-client',
			code: 'test-code',
			redirect_uri: 'http://localhost:3000/callback',
			environment_id: 'test-env',
		};

		// Test that endpoint accepts the request structure (will fail due to invalid data, but should validate structure)
		const response = await page.request.post('http://localhost:3001/api/token-exchange', {
			data: testPayload,
		});

		// Should get a validation error, not a 500 server error
		expect([400, 401, 403]).toContain(response.status());
	});

	test('Client credentials flow integration structure', async ({ page }) => {
		const testPayload = {
			environment_id: 'test-env',
			auth_method: 'client_secret_post',
			body: {
				grant_type: 'client_credentials',
				client_id: 'test-client',
				client_secret: 'test-secret',
			},
		};

		const response = await page.request.post('http://localhost:3001/api/client-credentials', {
			data: testPayload,
		});

		// Should handle the request structure properly
		expect([400, 401, 403]).toContain(response.status());
	});

	test('Token introspection integration structure', async ({ page }) => {
		const testPayload = {
			token: 'invalid-token',
			client_id: 'test-client',
			introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
		};

		const response = await page.request.post('http://localhost:3001/api/introspect-token', {
			data: testPayload,
		});

		// Should handle the request and attempt to call PingOne
		expect([200, 400, 401, 403]).toContain(response.status());
	});

	test('UserInfo endpoint integration structure', async ({ page }) => {
		const response = await page.request.get(
			'http://localhost:3001/api/userinfo?access_token=invalid&environment_id=test'
		);

		// Should attempt to validate token with PingOne
		expect([401, 403]).toContain(response.status());
	});

	test('Token validation integration structure', async ({ page }) => {
		const testPayload = {
			access_token: 'invalid-token',
			environment_id: 'test-env',
		};

		const response = await page.request.post('http://localhost:3001/api/validate-token', {
			data: testPayload,
		});

		// Should return invalid token response
		expect(response.status()).toBe(200);
		const result = await response.json();
		expect(result.valid).toBe(false);
	});

	test('Device authorization integration structure', async ({ page }) => {
		const testPayload = {
			environment_id: 'test-env',
			client_id: 'test-client',
			scope: 'openid profile',
		};

		const response = await page.request.post('http://localhost:3001/api/device-authorization', {
			data: testPayload,
		});

		// Should handle the request structure
		expect([400, 401, 403]).toContain(response.status());
	});

	test('PAR endpoint integration structure', async ({ page }) => {
		const testPayload = {
			environment_id: 'test-env',
			client_id: 'test-client',
			client_secret: 'test-secret',
			scope: 'openid profile',
			response_type: 'code',
			redirect_uri: 'http://localhost:3000/callback',
		};

		const response = await page.request.post('http://localhost:3001/api/par', {
			data: testPayload,
		});

		// Should handle the request structure
		expect([400, 401, 403]).toContain(response.status());
	});

	test('JWKS endpoint integration', async ({ page }) => {
		const response = await page.request.get('http://localhost:3001/api/jwks?environment_id=test');

		// Should attempt to fetch JWKS from PingOne
		expect([200, 400, 403]).toContain(response.status());
	});

	test('OpenID Discovery integration', async ({ page }) => {
		const response = await page.request.get(
			'http://localhost:3001/api/discovery?environment_id=test'
		);

		// Should return discovery configuration or fallback
		expect(response.status()).toBe(200);
		const result = await response.json();
		expect(result).toHaveProperty('success', true);
	});

	test('User JWKS generation integration', async ({ page }) => {
		const testPayload = {
			privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----`,
			keyId: 'test-key',
		};

		const response = await page.request.post('http://localhost:3001/api/user-jwks', {
			data: testPayload,
		});

		// Should handle JWKS generation (may fail with invalid key, but should not crash)
		expect([200, 400]).toContain(response.status());
	});

	test('Public JWKS endpoint serves content', async ({ page }) => {
		const response = await page.request.get('http://localhost:3001/.well-known/jwks.json');

		// Should return JWKS structure
		expect(response.status()).toBe(200);
		const jwks = await response.json();
		expect(jwks).toHaveProperty('keys');
		expect(Array.isArray(jwks.keys)).toBe(true);
	});

	test('CORS headers are properly set', async ({ page }) => {
		const response = await page.request.get('http://localhost:3001/api/health');

		// Check CORS headers
		const corsHeaders = response.headers();
		expect(corsHeaders['access-control-allow-origin']).toBeDefined();
		expect(corsHeaders['access-control-allow-methods']).toBeDefined();
	});

	test('Error responses have proper structure', async ({ page }) => {
		// Test with invalid endpoint
		const response = await page.request.get('http://localhost:3001/api/nonexistent-endpoint');

		expect(response.status()).toBe(404);
		const error = await response.json();
		expect(error).toHaveProperty('error');
	});

	test('Backend handles malformed JSON gracefully', async ({ page }) => {
		const response = await page.request.post('http://localhost:3001/api/token-exchange', {
			headers: {
				'Content-Type': 'application/json',
			},
			data: '{invalid json',
		});

		// Should handle JSON parsing errors
		expect([400, 500]).toContain(response.status());
	});
});
