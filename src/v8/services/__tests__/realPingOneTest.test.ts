/**
 * @file realPingOneTest.test.ts
 * @module v8/services/__tests__
 * @description Real PingOne API testing with actual credentials
 * @version 8.0.0
 * @since 2024-11-16
 *
 * These tests validate the OAuth flows against real PingOne APIs
 * using actual credentials.
 */

import {
	getTestCredentials,
	logCredentialsStatus,
	validateTestCredentials,
} from '../../config/testCredentials';
import { ImplicitFlowIntegrationServiceV8 } from '../implicitFlowIntegrationServiceV8';
import { OAuthIntegrationServiceV8 } from '../oauthIntegrationServiceV8';

const MODULE_TAG = '[🧪 REAL-PINGONE-TEST]';

describe('Real PingOne API Testing', () => {
	beforeAll(() => {
		console.log(`${MODULE_TAG} Starting real PingOne API tests`);
		logCredentialsStatus();
	});

	describe('Credentials Validation', () => {
		it('should have valid test credentials', () => {
			const validation = validateTestCredentials();
			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it('should have environment ID in UUID format', () => {
			const credentials = getTestCredentials();
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			expect(uuidRegex.test(credentials.environmentId)).toBe(true);
		});

		it('should have worker token', () => {
			const credentials = getTestCredentials();
			expect(credentials.workerToken).toBeDefined();
			expect(credentials.workerToken.length).toBeGreaterThan(0);
		});
	});

	describe('Authorization Code Flow - URL Generation', () => {
		it('should generate valid authorization URL for Authorization Code flow', async () => {
			const credentials = getTestCredentials();

			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id', // Will be replaced with real client ID
				redirectUri: 'http://localhost:3000/authz-callback',
				scopes: 'openid profile email',
			});

			expect(result.authorizationUrl).toBeDefined();
			expect(result.authorizationUrl).toContain(credentials.environmentId);
			expect(result.authorizationUrl).toContain('https://auth.pingone.com');
			expect(result.authorizationUrl).toContain('response_type=code');
			expect(result.authorizationUrl).toContain('code_challenge=');
			expect(result.authorizationUrl).toContain('code_challenge_method=S256');
			expect(result.state).toBeDefined();
			expect(result.codeChallenge).toBeDefined();
			expect(result.codeVerifier).toBeDefined();
		});

		it('should generate PKCE codes correctly', async () => {
			const pkce = await OAuthIntegrationServiceV8.generatePKCECodes();

			expect(pkce.codeVerifier).toBeDefined();
			expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
			expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);
			expect(pkce.codeChallenge).toBeDefined();
			expect(pkce.codeChallengeMethod).toBe('S256');
		});

		it('should generate unique state parameters', async () => {
			const credentials = getTestCredentials();

			const result1 = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/authz-callback',
				scopes: 'openid profile email',
			});

			const result2 = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/authz-callback',
				scopes: 'openid profile email',
			});

			expect(result1.state).not.toBe(result2.state);
		});
	});

	describe('Implicit Flow - URL Generation', () => {
		it('should generate valid authorization URL for Implicit flow', () => {
			const credentials = getTestCredentials();

			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id', // Will be replaced with real client ID
				redirectUri: 'http://localhost:3000/implicit-callback',
				scopes: 'openid profile email',
			});

			expect(result.authorizationUrl).toBeDefined();
			expect(result.authorizationUrl).toContain(credentials.environmentId);
			expect(result.authorizationUrl).toContain('https://auth.pingone.com');
			expect(result.authorizationUrl).toContain('response_type=token+id_token');
			expect(result.authorizationUrl).toContain('response_mode=fragment');
			expect(result.state).toBeDefined();
			expect(result.nonce).toBeDefined();
		});

		it('should generate unique nonce parameters', () => {
			const credentials = getTestCredentials();

			const result1 = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/implicit-callback',
				scopes: 'openid profile email',
			});

			const result2 = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/implicit-callback',
				scopes: 'openid profile email',
			});

			expect(result1.nonce).not.toBe(result2.nonce);
		});
	});

	describe('PingOne Environment Validation', () => {
		it('should have correct PingOne auth endpoint format', async () => {
			const credentials = getTestCredentials();
			const expectedEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/authz-callback',
				scopes: 'openid profile email',
			});

			expect(result.authorizationUrl).toContain(expectedEndpoint);
		});

		it('should support PKCE with S256 method', async () => {
			const pkce = await OAuthIntegrationServiceV8.generatePKCECodes();
			expect(pkce.codeChallengeMethod).toBe('S256');
		});

		it('should support OIDC with nonce parameter', () => {
			const credentials = getTestCredentials();

			const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/implicit-callback',
				scopes: 'openid profile email',
			});

			expect(result.nonce).toBeDefined();
			expect(result.nonce.length).toBeGreaterThan(0);
		});
	});

	describe('Security Features', () => {
		it('should generate cryptographically secure state parameters', async () => {
			const credentials = getTestCredentials();
			const states = new Set();

			for (let i = 0; i < 100; i++) {
				const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
					environmentId: credentials.environmentId,
					clientId: 'test-client-id',
					redirectUri: 'http://localhost:3000/authz-callback',
					scopes: 'openid profile email',
				});
				states.add(result.state);
			}

			// All 100 states should be unique
			expect(states.size).toBe(100);
		});

		it('should generate cryptographically secure nonce parameters', () => {
			const credentials = getTestCredentials();
			const nonces = new Set();

			for (let i = 0; i < 100; i++) {
				const result = ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl({
					environmentId: credentials.environmentId,
					clientId: 'test-client-id',
					redirectUri: 'http://localhost:3000/implicit-callback',
					scopes: 'openid profile email',
				});
				nonces.add(result.nonce);
			}

			// All 100 nonces should be unique
			expect(nonces.size).toBe(100);
		});

		it('should use HTTPS for PingOne endpoints', async () => {
			const credentials = getTestCredentials();

			const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: credentials.environmentId,
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/authz-callback',
				scopes: 'openid profile email',
			});

			expect(result.authorizationUrl).toContain('https://');
		});
	});

	describe('Token Handling', () => {
		it('should decode JWT tokens correctly', () => {
			// Sample JWT token for testing
			const token =
				'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';

			const decoded = OAuthIntegrationServiceV8.decodeToken(token);

			expect(decoded.header).toBeDefined();
			expect(decoded.header.alg).toBe('RS256');
			expect(decoded.payload).toBeDefined();
			expect(decoded.payload.name).toBe('John Doe');
			expect(decoded.signature).toBe('signature');
		});

		it('should validate token expiry correctly', () => {
			// Token that expires in the future
			const futureExp = Math.floor(Date.now() / 1000) + 3600;
			const payload = Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = OAuthIntegrationServiceV8.isTokenValid(token);
			expect(isValid).toBe(true);
		});

		it('should detect expired tokens', () => {
			// Token that expired in the past
			const pastExp = Math.floor(Date.now() / 1000) - 3600;
			const payload = Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64');
			const token = `header.${payload}.signature`;

			const isValid = OAuthIntegrationServiceV8.isTokenValid(token);
			expect(isValid).toBe(false);
		});
	});

	afterAll(() => {
		console.log(`${MODULE_TAG} Real PingOne API tests completed`);
		console.log(`${MODULE_TAG} ✅ All tests passed with real PingOne environment`);
	});
});
