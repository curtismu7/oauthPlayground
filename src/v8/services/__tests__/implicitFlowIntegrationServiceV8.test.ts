/**
 * @file implicitFlowIntegrationServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for ImplicitFlowIntegrationServiceV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { ImplicitFlowIntegrationServiceV8 } from '../implicitFlowIntegrationServiceV8';

describe('ImplicitFlowIntegrationServiceV8', () => {
	const mockCredentials = {
		environmentId: '12345678-1234-1234-1234-123456789012',
		clientId: 'test-client-id',
		redirectUri: 'http://localhost:3000/callback',
		scopes: 'openid profile email',
	};

	describe('Authorization URL Generation', () => {
		it('should generate authorization URL', () => {
			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.authorizationUrl).toBeDefined();
			expect(result.state).toBeDefined();
			expect(result.nonce).toBeDefined();
		});

		it('should include correct parameters in authorization URL', () => {
			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.authorizationUrl).toContain('client_id=test-client-id');
			expect(result.authorizationUrl).toContain('response_type=token+id_token');
			expect(result.authorizationUrl).toContain('redirect_uri=');
			expect(result.authorizationUrl).toContain('scope=openid+profile+email');
			expect(result.authorizationUrl).toContain('response_mode=fragment');
		});

		it('should include environment ID in authorization URL', () => {
			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.authorizationUrl).toContain(mockCredentials.environmentId);
		});

		it('should generate unique state parameters', () => {
			const result1 = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);
			const result2 = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result1.state).not.toBe(result2.state);
		});

		it('should generate unique nonce parameters', () => {
			const result1 = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);
			const result2 = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result1.nonce).not.toBe(result2.nonce);
		});

		it('should generate valid state parameter', () => {
			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.state.length).toBeGreaterThan(0);
			expect(result.state).toMatch(/^[A-Za-z0-9_-]+$/);
		});

		it('should generate valid nonce parameter', () => {
			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.nonce.length).toBeGreaterThan(0);
			expect(result.nonce).toMatch(/^[A-Za-z0-9_-]+$/);
		});
	});

	describe('Callback Fragment Parsing', () => {
		it('should parse valid callback fragment', () => {
			const state = 'test-state-123';
			const accessToken = 'test-access-token-456';
			const idToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';
			const callbackUrl = `http://localhost:3000/callback#access_token=${accessToken}&token_type=Bearer&expires_in=3600&id_token=${idToken}&state=${state}&scope=openid+profile+email`;

			const result = ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, state);

			expect(result.access_token).toBe(accessToken);
			expect(result.token_type).toBe('Bearer');
			expect(result.expires_in).toBe(3600);
			expect(result.id_token).toBe(idToken);
			expect(result.state).toBe(state);
		});

		it('should throw error if access token is missing', () => {
			const state = 'test-state-123';
			const callbackUrl = `http://localhost:3000/callback#state=${state}`;

			expect(() => {
				ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, state);
			}).toThrow('Access token not found');
		});

		it('should throw error if state is missing', () => {
			const accessToken = 'test-access-token-456';
			const callbackUrl = `http://localhost:3000/callback#access_token=${accessToken}`;

			expect(() => {
				ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, 'expected-state');
			}).toThrow('State parameter not found');
		});

		it('should throw error if state does not match', () => {
			const state = 'test-state-123';
			const accessToken = 'test-access-token-456';
			const callbackUrl = `http://localhost:3000/callback#access_token=${accessToken}&state=${state}`;

			expect(() => {
				ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, 'different-state');
			}).toThrow('State parameter mismatch');
		});

		it('should throw error if error parameter is present', () => {
			const callbackUrl =
				'http://localhost:3000/callback#error=access_denied&error_description=User+denied+access';

			expect(() => {
				ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, 'any-state');
			}).toThrow('Authorization failed');
		});

		it('should handle URL encoded parameters', () => {
			const state = 'test-state-123';
			const accessToken = 'test-access-token-456';
			const callbackUrl = `http://localhost:3000/callback#access_token=${encodeURIComponent(accessToken)}&state=${encodeURIComponent(state)}`;

			const result = ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, state);

			expect(result.access_token).toBe(accessToken);
			expect(result.state).toBe(state);
		});

		it('should use default token type if not provided', () => {
			const state = 'test-state-123';
			const accessToken = 'test-access-token-456';
			const callbackUrl = `http://localhost:3000/callback#access_token=${accessToken}&state=${state}`;

			const result = ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, state);

			expect(result.token_type).toBe('Bearer');
		});

		it('should use default expiry if not provided', () => {
			const state = 'test-state-123';
			const accessToken = 'test-access-token-456';
			const callbackUrl = `http://localhost:3000/callback#access_token=${accessToken}&state=${state}`;

			const result = ImplicitFlowIntegrationServiceV8.parseCallbackFragment(callbackUrl, state);

			expect(result.expires_in).toBe(3600);
		});
	});

	describe('Token Decoding', () => {
		it('should decode valid JWT token', () => {
			const token =
				'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';

			const decoded = ImplicitFlowIntegrationServiceV8.decodeToken(token);

			expect(decoded.header).toBeDefined();
			expect(decoded.payload).toBeDefined();
			expect(decoded.signature).toBe('signature');
			expect(decoded.header.alg).toBe('RS256');
			expect(decoded.payload.name).toBe('John Doe');
		});

		it('should throw error for invalid JWT format', () => {
			const invalidToken = 'not.a.valid.token.format';

			expect(() => {
				ImplicitFlowIntegrationServiceV8.decodeToken(invalidToken);
			}).toThrow();
		});
	});

	describe('Token Validation', () => {
		it('should validate non-expired token', () => {
			const futureExp = Math.floor(Date.now() / 1000) + 3600;
			const payload = Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = ImplicitFlowIntegrationServiceV8.isTokenValid(token);

			expect(isValid).toBe(true);
		});

		it('should invalidate expired token', () => {
			const pastExp = Math.floor(Date.now() / 1000) - 3600;
			const payload = Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = ImplicitFlowIntegrationServiceV8.isTokenValid(token);

			expect(isValid).toBe(false);
		});

		it('should handle token without expiry claim', () => {
			const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = ImplicitFlowIntegrationServiceV8.isTokenValid(token);

			expect(isValid).toBe(true);
		});
	});

	describe('Token Expiry Time', () => {
		it('should get token expiry time', () => {
			const futureExp = Math.floor(Date.now() / 1000) + 3600;
			const payload = Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const expiryTime = ImplicitFlowIntegrationServiceV8.getTokenExpiryTime(token);

			expect(expiryTime).toBeDefined();
			expect(expiryTime).toBeGreaterThan(0);
			expect(expiryTime).toBeLessThanOrEqual(3600 * 1000);
		});

		it('should return null for token without expiry', () => {
			const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64');
			const token = `header.${payload}.signature`;

			const expiryTime = ImplicitFlowIntegrationServiceV8.getTokenExpiryTime(token);

			expect(expiryTime).toBeNull();
		});

		it('should return 0 for expired token', () => {
			const pastExp = Math.floor(Date.now() / 1000) - 3600;
			const payload = Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const expiryTime = ImplicitFlowIntegrationServiceV8.getTokenExpiryTime(token);

			expect(expiryTime).toBe(0);
		});
	});

	describe('Nonce Validation', () => {
		it('should validate matching nonce', () => {
			const nonce = 'test-nonce-123';
			const payload = Buffer.from(JSON.stringify({ nonce })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = ImplicitFlowIntegrationServiceV8.validateNonce(token, nonce);

			expect(isValid).toBe(true);
		});

		it('should invalidate mismatched nonce', () => {
			const nonce = 'test-nonce-123';
			const payload = Buffer.from(JSON.stringify({ nonce })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = ImplicitFlowIntegrationServiceV8.validateNonce(token, 'different-nonce');

			expect(isValid).toBe(false);
		});

		it('should handle missing nonce', () => {
			const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = ImplicitFlowIntegrationServiceV8.validateNonce(token, 'any-nonce');

			expect(isValid).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should handle multiple scopes', () => {
			const multiScopeCredentials = {
				...mockCredentials,
				scopes: 'openid profile email phone address offline_access',
			};

			const result =
				ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(multiScopeCredentials);

			expect(result.authorizationUrl).toContain('scope=');
		});

		it('should handle special characters in redirect URI', () => {
			const specialUriCredentials = {
				...mockCredentials,
				redirectUri: 'http://localhost:3000/callback?param=value&other=123',
			};

			const result =
				ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl(specialUriCredentials);

			expect(result.authorizationUrl).toContain('redirect_uri=');
		});
	});
});
