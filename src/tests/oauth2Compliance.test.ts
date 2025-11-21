// src/tests/oauth2Compliance.test.ts
/**
 * OAuth 2.0 Compliance Test Suite
 *
 * Tests the OAuth 2.0 compliance service against RFC 6749 specifications
 * to ensure proper parameter validation, error handling, and security features.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
	type OAuth2AuthorizationRequest,
	OAuth2ComplianceService,
	type OAuth2TokenRequest,
} from '../services/oauth2ComplianceService';

describe('OAuth2ComplianceService', () => {
	let service: OAuth2ComplianceService;

	beforeEach(() => {
		service = new OAuth2ComplianceService();
	});

	describe('State Generation and Validation', () => {
		it('should generate cryptographically secure state', () => {
			const state1 = service.generateSecureState();
			const state2 = service.generateSecureState();

			expect(state1).toBeDefined();
			expect(state2).toBeDefined();
			expect(state1).not.toBe(state2);
			expect(state1.length).toBeGreaterThanOrEqual(32);
			expect(state2.length).toBeGreaterThanOrEqual(32);
			expect(/^[a-f0-9]+$/.test(state1)).toBe(true);
			expect(/^[a-f0-9]+$/.test(state2)).toBe(true);
		});

		it('should validate state parameters correctly', async () => {
			const state = 'test-state-123';

			// Valid state comparison
			const validResult = await service.validateState(state, state);
			expect(validResult).toBe(true);

			// Invalid state comparison
			const invalidResult = await service.validateState(state, 'different-state');
			expect(invalidResult).toBe(false);

			// Empty state handling
			const emptyResult = await service.validateState('', state);
			expect(emptyResult).toBe(false);
		});
	});

	describe('Authorization Request Validation', () => {
		it('should validate valid authorization request', () => {
			const validRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client-123',
				redirect_uri: 'https://example.com/callback',
				scope: 'openid profile email',
				state: 'secure-random-state-12345678',
				code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
				code_challenge_method: 'S256',
			};

			const result = service.validateAuthorizationRequest(validRequest);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject invalid response_type', () => {
			const invalidRequest: OAuth2AuthorizationRequest = {
				response_type: 'invalid',
				client_id: 'test-client',
				redirect_uri: 'https://example.com/callback',
			};

			const result = service.validateAuthorizationRequest(invalidRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'unsupported_response_type: only "code" response type is supported'
			);
		});

		it('should require client_id', () => {
			const invalidRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: '',
				redirect_uri: 'https://example.com/callback',
			};

			const result = service.validateAuthorizationRequest(invalidRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_request: client_id parameter is required');
		});

		it('should validate client_id format', () => {
			const invalidRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'invalid client id with spaces',
				redirect_uri: 'https://example.com/callback',
			};

			const result = service.validateAuthorizationRequest(invalidRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_request: client_id contains invalid characters');
		});

		it('should warn about missing state parameter', () => {
			const requestWithoutState: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				redirect_uri: 'https://example.com/callback',
			};

			const result = service.validateAuthorizationRequest(requestWithoutState);
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain('state parameter not provided - CSRF protection disabled');
		});

		it('should warn about short state parameter', () => {
			const requestWithShortState: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				redirect_uri: 'https://example.com/callback',
				state: 'short',
			};

			const result = service.validateAuthorizationRequest(requestWithShortState);
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain(
				'state parameter is too short - should be at least 16 characters'
			);
		});
	});

	describe('Redirect URI Validation', () => {
		it('should validate valid HTTPS redirect URI', () => {
			const result = service.validateRedirectUri('https://example.com/callback');
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should allow HTTP for localhost', () => {
			const result = service.validateRedirectUri('http://localhost:3000/callback');
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain('redirect_uri uses HTTP - HTTPS recommended for security');
		});

		it('should reject HTTP for non-localhost', () => {
			const service = new OAuth2ComplianceService({ requireHttpsRedirectUri: true });
			const result = service.validateRedirectUri('http://example.com/callback');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: redirect_uri must use HTTPS except for localhost'
			);
		});

		it('should reject redirect URI with fragment', () => {
			const result = service.validateRedirectUri('https://example.com/callback#fragment');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: redirect_uri must not contain fragment component'
			);
		});

		it('should reject invalid URI format', () => {
			const result = service.validateRedirectUri('not-a-valid-uri');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_request: redirect_uri is not a valid URI');
		});

		it('should reject unsupported schemes', () => {
			const service = new OAuth2ComplianceService({
				allowedRedirectUriSchemes: ['https'],
			});
			const result = service.validateRedirectUri('ftp://example.com/callback');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_request: redirect_uri scheme "ftp" is not allowed');
		});
	});

	describe('Scope Validation', () => {
		it('should validate valid scope', () => {
			const result = service.validateScope('openid profile email');
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should warn about duplicate scopes', () => {
			const result = service.validateScope('openid profile profile email');
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain('scope contains duplicate values');
		});

		it('should reject scope exceeding maximum length', () => {
			const service = new OAuth2ComplianceService({ maxScopeLength: 10 });
			const result = service.validateScope('this-scope-is-too-long');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_scope: scope exceeds maximum length of 10');
		});
	});

	describe('PKCE Validation', () => {
		it('should validate valid PKCE parameters', () => {
			const request: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
				code_challenge_method: 'S256',
			};

			const result = service.validatePKCEParameters(request);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should warn about plain challenge method', () => {
			const request: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
				code_challenge_method: 'plain',
			};

			const result = service.validatePKCEParameters(request);
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain(
				'code_challenge_method "plain" is less secure - consider using "S256"'
			);
		});

		it('should reject invalid challenge method', () => {
			const request: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				code_challenge: 'test-challenge',
				code_challenge_method: 'invalid' as any,
			};

			const result = service.validatePKCEParameters(request);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: code_challenge_method must be "plain" or "S256"'
			);
		});

		it('should validate code verifier format', () => {
			const validVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
			const result = service.validateCodeVerifier(validVerifier);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject short code verifier', () => {
			const shortVerifier = 'short';
			const result = service.validateCodeVerifier(shortVerifier);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: code_verifier length must be 43-128 characters'
			);
		});

		it('should reject code verifier with invalid characters', () => {
			const invalidVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk@#$';
			const result = service.validateCodeVerifier(invalidVerifier);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_request: code_verifier contains invalid characters');
		});
	});

	describe('Token Request Validation', () => {
		it('should validate valid authorization code token request', () => {
			const validRequest: OAuth2TokenRequest = {
				grant_type: 'authorization_code',
				code: 'auth-code-123',
				redirect_uri: 'https://example.com/callback',
				client_id: 'test-client',
				client_secret: 'test-secret',
				code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
			};

			const result = service.validateTokenRequest(validRequest);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should require grant_type', () => {
			const invalidRequest: OAuth2TokenRequest = {
				grant_type: '' as any,
				client_id: 'test-client',
			};

			const result = service.validateTokenRequest(invalidRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_request: grant_type parameter is required');
		});

		it('should reject unsupported grant type', () => {
			const invalidRequest: OAuth2TokenRequest = {
				grant_type: 'unsupported' as any,
				client_id: 'test-client',
			};

			const result = service.validateTokenRequest(invalidRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('unsupported_grant_type: grant type not supported');
		});

		it('should require code for authorization_code grant', () => {
			const invalidRequest: OAuth2TokenRequest = {
				grant_type: 'authorization_code',
				client_id: 'test-client',
			};

			const result = service.validateTokenRequest(invalidRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: code parameter is required for authorization_code grant'
			);
		});

		it('should require refresh_token for refresh_token grant', () => {
			const invalidRequest: OAuth2TokenRequest = {
				grant_type: 'refresh_token',
				client_id: 'test-client',
			};

			const result = service.validateTokenRequest(invalidRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: refresh_token parameter is required for refresh_token grant'
			);
		});
	});

	describe('Error Response Creation', () => {
		it('should create proper error response', () => {
			const error = service.createErrorResponse(
				'invalid_request',
				'The request is missing a required parameter',
				'test-state-123'
			);

			expect(error.error).toBe('invalid_request');
			expect(error.error_description).toBe('The request is missing a required parameter');
			expect(error.state).toBe('test-state-123');
		});

		it('should create minimal error response', () => {
			const error = service.createErrorResponse('server_error');

			expect(error.error).toBe('server_error');
			expect(error.error_description).toBeUndefined();
			expect(error.state).toBeUndefined();
		});
	});

	describe('Security Headers', () => {
		it('should provide required security headers', () => {
			const headers = service.getSecurityHeaders();

			expect(headers['Cache-Control']).toBe('no-store');
			expect(headers['Pragma']).toBe('no-cache');
			expect(headers['X-Content-Type-Options']).toBe('nosniff');
			expect(headers['X-Frame-Options']).toBe('DENY');
			expect(headers['Referrer-Policy']).toBe('no-referrer');
			expect(headers['X-XSS-Protection']).toBe('1; mode=block');
		});
	});

	describe('Access Token Validation', () => {
		it('should validate valid access token', () => {
			const token =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
			const result = service.validateAccessToken(token);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject empty token', () => {
			const result = service.validateAccessToken('');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Access token is required');
		});

		it('should reject too short token', () => {
			const result = service.validateAccessToken('short');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Access token is too short');
		});

		it('should warn about Bearer prefix', () => {
			const result = service.validateAccessToken('Bearer token-value');
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain('Access token should not include "Bearer " prefix');
		});
	});

	describe('PKCE Code Generation', () => {
		it('should generate valid PKCE codes', async () => {
			const codes = await service.generatePKCECodes();

			expect(codes.codeVerifier).toBeDefined();
			expect(codes.codeChallenge).toBeDefined();
			expect(codes.codeChallengeMethod).toBe('S256');

			// Validate generated codes
			const verifierValidation = service.validateCodeVerifier(codes.codeVerifier);
			expect(verifierValidation.valid).toBe(true);

			const challengeValidation = service.validatePKCEParameters({
				response_type: 'code',
				client_id: 'test',
				code_challenge: codes.codeChallenge,
				code_challenge_method: codes.codeChallengeMethod,
			});
			expect(challengeValidation.valid).toBe(true);
		});
	});

	describe('Complete Flow Validation', () => {
		it('should validate complete authorization flow', () => {
			const state = 'secure-state-12345678';

			const authRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				redirect_uri: 'https://example.com/callback',
				scope: 'openid profile',
				state,
				code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
				code_challenge_method: 'S256',
			};

			const tokenRequest: OAuth2TokenRequest = {
				grant_type: 'authorization_code',
				code: 'auth-code-123',
				redirect_uri: 'https://example.com/callback',
				client_id: 'test-client',
				code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
			};

			const result = service.validateAuthorizationFlow(authRequest, tokenRequest, state);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should detect state mismatch', () => {
			const authRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				state: 'original-state',
			};

			const tokenRequest: OAuth2TokenRequest = {
				grant_type: 'authorization_code',
				code: 'auth-code-123',
				client_id: 'test-client',
			};

			const result = service.validateAuthorizationFlow(
				authRequest,
				tokenRequest,
				'different-state'
			);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('invalid_request: state parameter mismatch');
		});

		it('should detect redirect_uri mismatch', () => {
			const authRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				redirect_uri: 'https://example.com/callback1',
			};

			const tokenRequest: OAuth2TokenRequest = {
				grant_type: 'authorization_code',
				code: 'auth-code-123',
				client_id: 'test-client',
				redirect_uri: 'https://example.com/callback2',
			};

			const result = service.validateAuthorizationFlow(authRequest, tokenRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: redirect_uri mismatch between authorization and token requests'
			);
		});

		it('should require code_verifier when code_challenge was used', () => {
			const authRequest: OAuth2AuthorizationRequest = {
				response_type: 'code',
				client_id: 'test-client',
				code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
				code_challenge_method: 'S256',
			};

			const tokenRequest: OAuth2TokenRequest = {
				grant_type: 'authorization_code',
				code: 'auth-code-123',
				client_id: 'test-client',
				// Missing code_verifier
			};

			const result = service.validateAuthorizationFlow(authRequest, tokenRequest);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(
				'invalid_request: code_verifier required when code_challenge was used'
			);
		});
	});
});
