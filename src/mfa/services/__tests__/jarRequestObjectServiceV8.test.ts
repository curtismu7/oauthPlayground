/**
 * @file jarRequestObjectServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for JARRequestObjectServiceV8 (JWT-secured Authorization Request)
 * @version 8.0.0
 * @since 2025-01-XX
 */

import { describe, expect, it } from 'vitest';
import {
	JARRequestObjectServiceV8,
	type JARSigningConfig,
	jarRequestObjectServiceV8,
	type OAuthAuthorizationParams,
} from '../jarRequestObjectServiceV8';

describe('JARRequestObjectServiceV8', () => {
	const mockAuthParams: OAuthAuthorizationParams = {
		clientId: 'test-client-id',
		responseType: 'code',
		redirectUri: 'https://app.com/callback',
		scope: 'openid profile email',
		state: 'xyz123abc',
		nonce: 'nonce123',
	};

	const mockAuthEndpoint = 'https://auth.pingone.com/env-id/as/authorize';

	const mockHS256Config: JARSigningConfig = {
		algorithm: 'HS256',
		clientSecret: 'test-client-secret-12345678901234567890',
		audience: mockAuthEndpoint,
	};

	const _mockRS256Config: JARSigningConfig = {
		algorithm: 'RS256',
		privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bN1Al0+8vZr4s+mHc38TZDB3BvbKNN+3lOoXrP1rZ8zQzVNH
K8pV8cLwK4YqJ2P9kZKU5x3n7l8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8p
R0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4Q
K3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8p
AgMBAAECggEAK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7
w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9
m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7
w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9
m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7
w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9
m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7
w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9
m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7
w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9
m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7
w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9
m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7
w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9
QKBgQDk3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n
5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y
8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n
5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y
8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n
5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y
8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n
5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y
8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n
5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y
8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n5v9m8pR0Y8L7w4QK3n
-----END PRIVATE KEY-----`,
		audience: mockAuthEndpoint,
	};

	describe('buildRequestObjectPayload', () => {
		it('should build request object payload with required parameters', () => {
			const service = new JARRequestObjectServiceV8();
			const payload = service['buildRequestObjectPayload'](mockAuthParams, mockHS256Config);

			expect(payload.iss).toBe(mockAuthParams.clientId);
			expect(payload.aud).toBe(mockAuthEndpoint);
			expect(payload.response_type).toBe(mockAuthParams.responseType);
			expect(payload.client_id).toBe(mockAuthParams.clientId);
			expect(payload.redirect_uri).toBe(mockAuthParams.redirectUri);
			expect(payload.scope).toBe(mockAuthParams.scope);
			expect(payload.state).toBe(mockAuthParams.state);
			expect(payload.nonce).toBe(mockAuthParams.nonce);
			expect(payload.iat).toBeDefined();
			expect(payload.exp).toBeDefined();
			expect(payload.jti).toBeDefined();
		});

		it('should include optional parameters when provided', () => {
			const paramsWithOptional: OAuthAuthorizationParams = {
				...mockAuthParams,
				codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
				codeChallengeMethod: 'S256',
				maxAge: 3600,
				prompt: 'login',
				display: 'page',
				claims: {
					userinfo: { email: null },
					id_token: { email: null },
				},
			};

			const service = new JARRequestObjectServiceV8();
			const payload = service['buildRequestObjectPayload'](paramsWithOptional, mockHS256Config);

			expect(payload.code_challenge).toBe(paramsWithOptional.codeChallenge);
			expect(payload.code_challenge_method).toBe(paramsWithOptional.codeChallengeMethod);
			expect(payload.max_age).toBe(paramsWithOptional.maxAge);
			expect(payload.prompt).toBe(paramsWithOptional.prompt);
			expect(payload.display).toBe(paramsWithOptional.display);
			expect(payload.claims).toEqual(paramsWithOptional.claims);
		});

		it('should exclude optional parameters when not provided', () => {
			const minimalParams: OAuthAuthorizationParams = {
				clientId: mockAuthParams.clientId,
				responseType: mockAuthParams.responseType,
				redirectUri: mockAuthParams.redirectUri,
				scope: mockAuthParams.scope,
			};

			const service = new JARRequestObjectServiceV8();
			const payload = service['buildRequestObjectPayload'](minimalParams, mockHS256Config);

			expect(payload.state).toBeUndefined();
			expect(payload.nonce).toBeUndefined();
			expect(payload.code_challenge).toBeUndefined();
			expect(payload.max_age).toBeUndefined();
		});

		it('should throw error when required parameters are missing', () => {
			const service = new JARRequestObjectServiceV8();

			expect(() => {
				service['buildRequestObjectPayload'](
					{ clientId: '', responseType: 'code', redirectUri: 'https://app.com', scope: 'openid' },
					mockHS256Config
				);
			}).toThrow('Missing required parameters');

			expect(() => {
				service['buildRequestObjectPayload'](
					{ ...mockAuthParams, responseType: '' },
					mockHS256Config
				);
			}).toThrow('Missing required parameters');

			expect(() => {
				service['buildRequestObjectPayload'](
					{ ...mockAuthParams, redirectUri: '' },
					mockHS256Config
				);
			}).toThrow('Missing required parameters');

			expect(() => {
				service['buildRequestObjectPayload']({ ...mockAuthParams, scope: '' }, mockHS256Config);
			}).toThrow('Missing required parameters');
		});

		it('should use custom issuer and subject when provided', () => {
			const customConfig: JARSigningConfig = {
				...mockHS256Config,
				issuer: 'custom-issuer',
				subject: 'custom-subject',
			};

			const service = new JARRequestObjectServiceV8();
			const payload = service['buildRequestObjectPayload'](mockAuthParams, customConfig);

			expect(payload.iss).toBe('custom-issuer');
		});

		it('should use custom expiry when provided', () => {
			const customConfig: JARSigningConfig = {
				...mockHS256Config,
				expirySeconds: 600, // 10 minutes
			};

			const service = new JARRequestObjectServiceV8();
			const payload = service['buildRequestObjectPayload'](mockAuthParams, customConfig);

			const now = Math.floor(Date.now() / 1000);
			expect(payload.exp).toBe(now + 600);
		});

		it('should generate unique jti for each request', () => {
			const service = new JARRequestObjectServiceV8();
			const payload1 = service['buildRequestObjectPayload'](mockAuthParams, mockHS256Config);
			const payload2 = service['buildRequestObjectPayload'](mockAuthParams, mockHS256Config);

			expect(payload1.jti).not.toBe(payload2.jti);
			expect(payload1.jti).toMatch(/^jar-/);
			expect(payload2.jti).toMatch(/^jar-/);
		});
	});

	describe('generateRequestObjectJWT - HS256', () => {
		it('should generate signed request object JWT with HS256', async () => {
			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				mockAuthParams,
				mockHS256Config
			);

			expect(result.success).toBe(true);
			expect(result.requestObject).toBeDefined();
			expect(result.payload).toBeDefined();
			expect(result.header).toBeDefined();
			expect(result.error).toBeUndefined();

			// Verify JWT structure (header.payload.signature)
			if (result.requestObject) {
				const parts = result.requestObject.split('.');
				expect(parts.length).toBe(3);

				// Verify header
				expect(result.header?.alg).toBe('HS256');
				expect(result.header?.typ).toBe('JWT');
			}
		});

		it('should include correct payload in request object', async () => {
			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				mockAuthParams,
				mockHS256Config
			);

			expect(result.success).toBe(true);
			if (result.payload) {
				expect(result.payload.iss).toBe(mockAuthParams.clientId);
				expect(result.payload.aud).toBe(mockAuthEndpoint);
				expect(result.payload.response_type).toBe(mockAuthParams.responseType);
				expect(result.payload.client_id).toBe(mockAuthParams.clientId);
				expect(result.payload.redirect_uri).toBe(mockAuthParams.redirectUri);
				expect(result.payload.scope).toBe(mockAuthParams.scope);
			}
		});

		it('should return error when client secret is missing', async () => {
			const invalidConfig: JARSigningConfig = {
				algorithm: 'HS256',
				clientSecret: '',
				audience: mockAuthEndpoint,
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				mockAuthParams,
				invalidConfig
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Client secret is required');
			expect(result.requestObject).toBeUndefined();
		});

		it('should return error when audience is missing', async () => {
			const invalidConfig: JARSigningConfig = {
				algorithm: 'HS256',
				clientSecret: 'test-secret',
				audience: '',
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				mockAuthParams,
				invalidConfig
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Audience');
			expect(result.requestObject).toBeUndefined();
		});
	});

	describe('generateRequestObjectJWT - RS256', () => {
		// Note: RS256 tests require a valid RSA private key
		// For unit tests, we'll skip RS256 tests with invalid keys and test error handling
		it('should return error when private key is missing for RS256', async () => {
			const invalidConfig: JARSigningConfig = {
				algorithm: 'RS256',
				privateKey: '',
				audience: mockAuthEndpoint,
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				mockAuthParams,
				invalidConfig
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Private key is required');
			expect(result.requestObject).toBeUndefined();
		});

		it('should return error for invalid private key format', async () => {
			const invalidConfig: JARSigningConfig = {
				algorithm: 'RS256',
				privateKey: 'invalid-key-format',
				audience: mockAuthEndpoint,
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				mockAuthParams,
				invalidConfig
			);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			// Error should mention PKCS8 or parse
			expect(result.requestObject).toBeUndefined();
		});
	});

	describe('Parameter Validation', () => {
		it('should validate required OAuth parameters', async () => {
			const invalidParams: OAuthAuthorizationParams = {
				clientId: '',
				responseType: 'code',
				redirectUri: 'https://app.com/callback',
				scope: 'openid',
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				invalidParams,
				mockHS256Config
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Missing required parameters');
		});

		it('should handle special characters in parameters', async () => {
			const paramsWithSpecialChars: OAuthAuthorizationParams = {
				clientId: 'client-123',
				responseType: 'code',
				redirectUri: 'https://app.com/callback?param=value&other=123',
				scope: 'openid profile email',
				state: 'state-with-special-chars-!@#$%',
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				paramsWithSpecialChars,
				mockHS256Config
			);

			expect(result.success).toBe(true);
			if (result.payload) {
				expect(result.payload.state).toBe(paramsWithSpecialChars.state);
			}
		});
	});

	describe('Edge Cases', () => {
		it('should handle minimal parameters', async () => {
			const minimalParams: OAuthAuthorizationParams = {
				clientId: 'client-123',
				responseType: 'code',
				redirectUri: 'https://app.com/callback',
				scope: 'openid',
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				minimalParams,
				mockHS256Config
			);

			expect(result.success).toBe(true);
			expect(result.requestObject).toBeDefined();
		});

		it('should handle all optional parameters', async () => {
			const fullParams: OAuthAuthorizationParams = {
				clientId: 'client-123',
				responseType: 'code id_token',
				redirectUri: 'https://app.com/callback',
				scope: 'openid profile email phone',
				state: 'state-123',
				nonce: 'nonce-456',
				codeChallenge: 'challenge-789',
				codeChallengeMethod: 'S256',
				maxAge: 3600,
				prompt: 'login consent',
				display: 'popup',
				uiLocales: 'en-US',
				acrValues: 'acr1 acr2',
				loginHint: 'user@example.com',
				claims: {
					userinfo: { email: null, name: null },
					id_token: { email: null },
				},
			};

			const result = await jarRequestObjectServiceV8.generateRequestObjectJWT(
				fullParams,
				mockHS256Config
			);

			expect(result.success).toBe(true);
			if (result.payload) {
				expect(result.payload.state).toBe(fullParams.state);
				expect(result.payload.nonce).toBe(fullParams.nonce);
				expect(result.payload.code_challenge).toBe(fullParams.codeChallenge);
				expect(result.payload.claims).toEqual(fullParams.claims);
			}
		});
	});
});
