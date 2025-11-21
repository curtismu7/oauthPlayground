/**
 * @file oauthIntegrationServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for OAuthIntegrationServiceV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { OAuthIntegrationServiceV8 } from '../oauthIntegrationServiceV8';

describe('OAuthIntegrationServiceV8', () => {
	const mockCredentials = {
		environmentId: '12345678-1234-1234-1234-123456789012',
		clientId: 'test-client-id',
		clientSecret: 'test-client-secret',
		redirectUri: 'http://localhost:3000/callback',
		scopes: 'openid profile email',
	};

	describe('PKCE Code Generation', () => {
		it('should generate PKCE codes', async () => {
			const pkce = await OAuthIntegrationServiceV8.generatePKCECodes();

			expect(pkce.codeVerifier).toBeDefined();
			expect(pkce.codeChallenge).toBeDefined();
			expect(pkce.codeChallengeMethod).toBe('S256');
		});

		it('should generate unique code verifiers', async () => {
			const pkce1 = await OAuthIntegrationServiceV8.generatePKCECodes();
			const pkce2 = await OAuthIntegrationServiceV8.generatePKCECodes();

			expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
		});

		it('should generate valid code verifier length', async () => {
			const pkce = await OAuthIntegrationServiceV8.generatePKCECodes();

			expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
			expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);
		});

		it('should generate valid code challenge', async () => {
			const pkce = await OAuthIntegrationServiceV8.generatePKCECodes();

			// Code challenge should be base64url encoded
			expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
		});
	});

	describe('Authorization URL Generation', () => {
		it('should generate authorization URL', async () => {
			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.authorizationUrl).toBeDefined();
			expect(result.state).toBeDefined();
			expect(result.codeChallenge).toBeDefined();
			expect(result.codeVerifier).toBeDefined();
		});

		it('should include correct parameters in authorization URL', async () => {
			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.authorizationUrl).toContain('client_id=test-client-id');
			expect(result.authorizationUrl).toContain('response_type=code');
			expect(result.authorizationUrl).toContain('redirect_uri=');
			expect(result.authorizationUrl).toContain('scope=openid+profile+email');
			expect(result.authorizationUrl).toContain('code_challenge=');
			expect(result.authorizationUrl).toContain('code_challenge_method=S256');
		});

		it('should include environment ID in authorization URL', async () => {
			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.authorizationUrl).toContain(mockCredentials.environmentId);
		});

		it('should generate unique state parameters', async () => {
			const result1 = await OAuthIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);
			const result2 = await OAuthIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result1.state).not.toBe(result2.state);
		});

		it('should generate valid state parameter', async () => {
			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(mockCredentials);

			expect(result.state.length).toBeGreaterThan(0);
			expect(result.state).toMatch(/^[A-Za-z0-9_-]+$/);
		});
	});

	describe('Callback URL Parsing', () => {
		it('should parse valid callback URL', () => {
			const state = 'test-state-123';
			const code = 'test-auth-code-456';
			const callbackUrl = `http://localhost:3000/callback?code=${code}&state=${state}`;

			const result = OAuthIntegrationServiceV8.parseCallbackUrl(callbackUrl, state);

			expect(result.code).toBe(code);
			expect(result.state).toBe(state);
		});

		it('should throw error if code is missing', () => {
			const state = 'test-state-123';
			const callbackUrl = `http://localhost:3000/callback?state=${state}`;

			expect(() => {
				OAuthIntegrationServiceV8.parseCallbackUrl(callbackUrl, state);
			}).toThrow('Authorization code not found');
		});

		it('should throw error if state is missing', () => {
			const code = 'test-auth-code-456';
			const callbackUrl = `http://localhost:3000/callback?code=${code}`;

			expect(() => {
				OAuthIntegrationServiceV8.parseCallbackUrl(callbackUrl, 'expected-state');
			}).toThrow('State parameter not found');
		});

		it('should throw error if state does not match', () => {
			const state = 'test-state-123';
			const code = 'test-auth-code-456';
			const callbackUrl = `http://localhost:3000/callback?code=${code}&state=${state}`;

			expect(() => {
				OAuthIntegrationServiceV8.parseCallbackUrl(callbackUrl, 'different-state');
			}).toThrow('State parameter mismatch');
		});

		it('should throw error if error parameter is present', () => {
			const callbackUrl =
				'http://localhost:3000/callback?error=access_denied&error_description=User+denied+access';

			expect(() => {
				OAuthIntegrationServiceV8.parseCallbackUrl(callbackUrl, 'any-state');
			}).toThrow('Authorization failed');
		});

		it('should handle URL encoded parameters', () => {
			const state = 'test-state-123';
			const code = 'test-auth-code-456';
			const callbackUrl = `http://localhost:3000/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

			const result = OAuthIntegrationServiceV8.parseCallbackUrl(callbackUrl, state);

			expect(result.code).toBe(code);
			expect(result.state).toBe(state);
		});
	});

	describe('Token Decoding', () => {
		it('should decode valid JWT token', () => {
			// Sample JWT token (not a real token, just for testing structure)
			const token =
				'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';

			const decoded = OAuthIntegrationServiceV8.decodeToken(token);

			expect(decoded.header).toBeDefined();
			expect(decoded.payload).toBeDefined();
			expect(decoded.signature).toBe('signature');
			expect(decoded.header.alg).toBe('RS256');
			expect(decoded.payload.name).toBe('John Doe');
		});

		it('should throw error for invalid JWT format', () => {
			const invalidToken = 'not.a.valid.token.format';

			expect(() => {
				OAuthIntegrationServiceV8.decodeToken(invalidToken);
			}).toThrow();
		});

		it('should throw error for malformed JWT', () => {
			const malformedToken = 'invalid.invalid.invalid';

			expect(() => {
				OAuthIntegrationServiceV8.decodeToken(malformedToken);
			}).toThrow();
		});
	});

	describe('Token Validation', () => {
		it('should validate non-expired token', () => {
			// Create a token that expires in the future
			const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
			const payload = Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = OAuthIntegrationServiceV8.isTokenValid(token);

			expect(isValid).toBe(true);
		});

		it('should invalidate expired token', () => {
			// Create a token that expired in the past
			const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
			const payload = Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = OAuthIntegrationServiceV8.isTokenValid(token);

			expect(isValid).toBe(false);
		});

		it('should handle token without expiry claim', () => {
			const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = OAuthIntegrationServiceV8.isTokenValid(token);

			expect(isValid).toBe(true);
		});
	});

	describe('Token Expiry Time', () => {
		it('should get token expiry time', () => {
			const futureExp = Math.floor(Date.now() / 1000) + 3600;
			const payload = Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const expiryTime = OAuthIntegrationServiceV8.getTokenExpiryTime(token);

			expect(expiryTime).toBeDefined();
			expect(expiryTime).toBeGreaterThan(0);
			expect(expiryTime).toBeLessThanOrEqual(3600 * 1000);
		});

		it('should return null for token without expiry', () => {
			const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64');
			const token = `header.${payload}.signature`;

			const expiryTime = OAuthIntegrationServiceV8.getTokenExpiryTime(token);

			expect(expiryTime).toBeNull();
		});

		it('should return 0 for expired token', () => {
			const pastExp = Math.floor(Date.now() / 1000) - 3600;
			const payload = Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const expiryTime = OAuthIntegrationServiceV8.getTokenExpiryTime(token);

			expect(expiryTime).toBe(0);
		});
	});

	describe('Edge Cases', () => {
		it('should handle credentials without client secret', async () => {
			const publicClientCredentials = {
				environmentId: '12345678-1234-1234-1234-123456789012',
				clientId: 'public-client-id',
				redirectUri: 'http://localhost:3000/callback',
				scopes: 'openid profile',
			};

			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(publicClientCredentials);

			expect(result.authorizationUrl).toContain('public-client-id');
		});

		it('should handle multiple scopes', async () => {
			const multiScopeCredentials = {
				...mockCredentials,
				scopes: 'openid profile email phone address offline_access',
			};

			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(multiScopeCredentials);

			expect(result.authorizationUrl).toContain('scope=');
		});

		it('should handle special characters in redirect URI', async () => {
			const specialUriCredentials = {
				...mockCredentials,
				redirectUri: 'http://localhost:3000/callback?param=value&other=123',
			};

			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl(specialUriCredentials);

			expect(result.authorizationUrl).toContain('redirect_uri=');
		});
	});
});
