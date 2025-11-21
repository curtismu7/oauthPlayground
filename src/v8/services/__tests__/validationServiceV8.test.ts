/**
 * @file validationServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for ValidationServiceV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { ValidationServiceV8 } from '../validationServiceV8';

describe('ValidationServiceV8', () => {
	describe('validateCredentials', () => {
		it('should validate complete OIDC credentials', () => {
			const credentials = {
				environmentId: '12345678-1234-1234-1234-123456789012',
				clientId: 'test-client-id',
				clientSecret: 'test-secret',
				redirectUri: 'http://localhost:3000/callback',
				scopes: 'openid profile email',
			};

			const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should fail when required fields are missing', () => {
			const credentials = {
				environmentId: '12345678-1234-1234-1234-123456789012',
				// Missing clientId, redirectUri, scopes
			};

			const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');

			expect(result.valid).toBe(false);
			expect(result.canProceed).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors.some((e) => e.field === 'clientId')).toBe(true);
			expect(result.errors.some((e) => e.field === 'redirectUri')).toBe(true);
			expect(result.errors.some((e) => e.field === 'scopes')).toBe(true);
		});

		it('should fail when environment ID is not a valid UUID', () => {
			const credentials = {
				environmentId: 'invalid-uuid',
				clientId: 'test-client-id',
				redirectUri: 'http://localhost:3000/callback',
				scopes: 'openid profile',
			};

			const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === 'environmentId')).toBe(true);
			expect(result.errors.some((e) => e.code === 'INVALID_FORMAT')).toBe(true);
		});

		it('should fail when redirect URI is not a valid URL', () => {
			const credentials = {
				environmentId: '12345678-1234-1234-1234-123456789012',
				clientId: 'test-client-id',
				redirectUri: 'not-a-url',
				scopes: 'openid profile',
			};

			const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === 'redirectUri')).toBe(true);
		});

		it('should warn about HTTP redirect URI for non-localhost', () => {
			const credentials = {
				environmentId: '12345678-1234-1234-1234-123456789012',
				clientId: 'test-client-id',
				redirectUri: 'http://example.com/callback',
				scopes: 'openid profile',
			};

			const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');

			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings.some((w) => w.field === 'redirectUri')).toBe(true);
			expect(result.warnings.some((w) => w.message.includes('HTTP'))).toBe(true);
		});
	});

	describe('validateOIDCScopes', () => {
		it('should pass when openid scope is present', () => {
			const result = ValidationServiceV8.validateOIDCScopes('openid profile email');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should fail when openid scope is missing', () => {
			const result = ValidationServiceV8.validateOIDCScopes('profile email');

			expect(result.valid).toBe(false);
			expect(result.canProceed).toBe(false);
			expect(result.errors.some((e) => e.code === 'OPENID_SCOPE_REQUIRED')).toBe(true);
		});

		it('should fail when scopes are empty', () => {
			const result = ValidationServiceV8.validateOIDCScopes('');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'SCOPES_REQUIRED')).toBe(true);
		});

		it('should warn about offline_access scope', () => {
			const result = ValidationServiceV8.validateOIDCScopes('openid profile offline_access');

			expect(result.valid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings.some((w) => w.message.includes('offline_access'))).toBe(true);
		});

		it('should handle multiple spaces in scope string', () => {
			const result = ValidationServiceV8.validateOIDCScopes('openid  profile   email');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});
	});

	describe('validateOAuthScopes', () => {
		it('should pass with any non-empty scopes', () => {
			const result = ValidationServiceV8.validateOAuthScopes('profile email');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});

		it('should fail when scopes are empty', () => {
			const result = ValidationServiceV8.validateOAuthScopes('');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'SCOPES_REQUIRED')).toBe(true);
		});
	});

	describe('validateUrl', () => {
		it('should validate valid HTTP localhost URL', () => {
			const result = ValidationServiceV8.validateUrl('http://localhost:3000/callback', 'redirect');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});

		it('should validate valid HTTPS URL', () => {
			const result = ValidationServiceV8.validateUrl('https://example.com/callback', 'redirect');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});

		it('should fail for invalid URL format', () => {
			const result = ValidationServiceV8.validateUrl('not-a-url', 'redirect');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'INVALID_URL')).toBe(true);
		});

		it('should fail for empty URL', () => {
			const result = ValidationServiceV8.validateUrl('', 'redirect');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'URL_REQUIRED')).toBe(true);
		});

		it('should require HTTPS for issuer URLs (non-localhost)', () => {
			const result = ValidationServiceV8.validateUrl('http://example.com', 'issuer');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'HTTPS_REQUIRED')).toBe(true);
		});

		it('should allow HTTP for localhost issuer', () => {
			const result = ValidationServiceV8.validateUrl('http://localhost:8080', 'issuer');

			expect(result.valid).toBe(true);
		});

		it('should warn about HTTP for non-localhost redirect', () => {
			const result = ValidationServiceV8.validateUrl('http://example.com/callback', 'redirect');

			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings.some((w) => w.message.includes('HTTP'))).toBe(true);
		});

		it('should warn about fragment in redirect URI', () => {
			const result = ValidationServiceV8.validateUrl(
				'http://localhost:3000/callback#fragment',
				'redirect'
			);

			expect(result.warnings.some((w) => w.message.includes('fragment'))).toBe(true);
		});
	});

	describe('validateUUID', () => {
		it('should validate valid UUID', () => {
			const result = ValidationServiceV8.validateUUID(
				'12345678-1234-1234-1234-123456789012',
				'Environment ID'
			);

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should validate UUID with uppercase letters', () => {
			const result = ValidationServiceV8.validateUUID(
				'12345678-1234-1234-1234-123456789ABC',
				'Environment ID'
			);

			expect(result.valid).toBe(true);
		});

		it('should fail for invalid UUID format', () => {
			const result = ValidationServiceV8.validateUUID('not-a-uuid', 'Environment ID');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'INVALID_UUID')).toBe(true);
		});

		it('should fail for empty UUID', () => {
			const result = ValidationServiceV8.validateUUID('', 'Environment ID');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'UUID_REQUIRED')).toBe(true);
		});

		it('should fail for UUID without dashes', () => {
			const result = ValidationServiceV8.validateUUID(
				'12345678123412341234123456789012',
				'Environment ID'
			);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'INVALID_UUID')).toBe(true);
		});
	});

	describe('validateAuthorizationUrlParams', () => {
		it('should validate complete authorization URL params', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'http://localhost:3000/callback',
				scope: 'openid profile',
				responseType: 'code',
				state: 'random-state',
				codeChallenge: 'challenge',
				codeChallengeMethod: 'S256',
			};

			const result = ValidationServiceV8.validateAuthorizationUrlParams(params);

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});

		it('should fail when required params are missing', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				// Missing other required params
			};

			const result = ValidationServiceV8.validateAuthorizationUrlParams(params);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should warn when state parameter is missing', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'http://localhost:3000/callback',
				scope: 'openid profile',
				responseType: 'code',
				// Missing state
			};

			const result = ValidationServiceV8.validateAuthorizationUrlParams(params);

			expect(result.warnings.some((w) => w.field === 'state')).toBe(true);
		});

		it('should fail when code challenge is present without method', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'http://localhost:3000/callback',
				scope: 'openid profile',
				responseType: 'code',
				codeChallenge: 'challenge',
				// Missing codeChallengeMethod
			};

			const result = ValidationServiceV8.validateAuthorizationUrlParams(params);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'PKCE_METHOD_REQUIRED')).toBe(true);
		});

		it('should warn when code challenge method is not S256', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'http://localhost:3000/callback',
				scope: 'openid profile',
				responseType: 'code',
				codeChallenge: 'challenge',
				codeChallengeMethod: 'plain',
			};

			const result = ValidationServiceV8.validateAuthorizationUrlParams(params);

			expect(result.warnings.some((w) => w.field === 'codeChallengeMethod')).toBe(true);
		});
	});

	describe('validateCallbackParams', () => {
		it('should validate successful callback with code', () => {
			const params = {
				code: 'auth-code-123',
				state: 'expected-state',
			};

			const result = ValidationServiceV8.validateCallbackParams(params, 'expected-state');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});

		it('should fail when authorization code is missing', () => {
			const params = {
				state: 'expected-state',
				// Missing code
			};

			const result = ValidationServiceV8.validateCallbackParams(params, 'expected-state');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'CODE_MISSING')).toBe(true);
		});

		it('should fail when state parameter mismatches', () => {
			const params = {
				code: 'auth-code-123',
				state: 'wrong-state',
			};

			const result = ValidationServiceV8.validateCallbackParams(params, 'expected-state');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'STATE_MISMATCH')).toBe(true);
		});

		it('should fail when callback contains error', () => {
			const params = {
				error: 'access_denied',
				errorDescription: 'User denied access',
			};

			const result = ValidationServiceV8.validateCallbackParams(params);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.message.includes('access_denied'))).toBe(true);
		});
	});

	describe('validateTokenResponse', () => {
		it('should validate OAuth token response', () => {
			const tokens = {
				access_token: 'access-token-123',
				token_type: 'Bearer',
				expires_in: 3600,
			};

			const result = ValidationServiceV8.validateTokenResponse(tokens, 'oauth');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});

		it('should validate OIDC token response with ID token', () => {
			const tokens = {
				access_token: 'access-token-123',
				id_token: 'id-token-123',
				token_type: 'Bearer',
				expires_in: 3600,
			};

			const result = ValidationServiceV8.validateTokenResponse(tokens, 'oidc');

			expect(result.valid).toBe(true);
			expect(result.canProceed).toBe(true);
		});

		it('should fail when access token is missing', () => {
			const tokens = {
				token_type: 'Bearer',
				expires_in: 3600,
			};

			const result = ValidationServiceV8.validateTokenResponse(tokens, 'oauth');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'ACCESS_TOKEN_MISSING')).toBe(true);
		});

		it('should fail when ID token is missing for OIDC', () => {
			const tokens = {
				access_token: 'access-token-123',
				token_type: 'Bearer',
				expires_in: 3600,
				// Missing id_token
			};

			const result = ValidationServiceV8.validateTokenResponse(tokens, 'oidc');

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.code === 'ID_TOKEN_MISSING')).toBe(true);
		});

		it('should warn when expires_in is missing', () => {
			const tokens = {
				access_token: 'access-token-123',
				token_type: 'Bearer',
				// Missing expires_in
			};

			const result = ValidationServiceV8.validateTokenResponse(tokens, 'oauth');

			expect(result.warnings.some((w) => w.field === 'expires_in')).toBe(true);
		});
	});

	describe('getRequiredFields', () => {
		it('should return required fields for OIDC', () => {
			const fields = ValidationServiceV8.getRequiredFields('oidc');

			expect(fields).toContain('environmentId');
			expect(fields).toContain('clientId');
			expect(fields).toContain('redirectUri');
			expect(fields).toContain('scopes');
		});

		it('should return required fields for OAuth', () => {
			const fields = ValidationServiceV8.getRequiredFields('oauth');

			expect(fields).toContain('environmentId');
			expect(fields).toContain('clientId');
			expect(fields).toContain('redirectUri');
			expect(fields).toContain('scopes');
		});

		it('should return required fields for client credentials', () => {
			const fields = ValidationServiceV8.getRequiredFields('client_credentials');

			expect(fields).toContain('environmentId');
			expect(fields).toContain('clientId');
			expect(fields).toContain('clientSecret');
			expect(fields).toContain('scopes');
		});
	});

	describe('isEmpty', () => {
		it('should return true for null', () => {
			expect(ValidationServiceV8.isEmpty(null)).toBe(true);
		});

		it('should return true for undefined', () => {
			expect(ValidationServiceV8.isEmpty(undefined)).toBe(true);
		});

		it('should return true for empty string', () => {
			expect(ValidationServiceV8.isEmpty('')).toBe(true);
			expect(ValidationServiceV8.isEmpty('   ')).toBe(true);
		});

		it('should return true for empty array', () => {
			expect(ValidationServiceV8.isEmpty([])).toBe(true);
		});

		it('should return true for empty object', () => {
			expect(ValidationServiceV8.isEmpty({})).toBe(true);
		});

		it('should return false for non-empty string', () => {
			expect(ValidationServiceV8.isEmpty('test')).toBe(false);
		});

		it('should return false for non-empty array', () => {
			expect(ValidationServiceV8.isEmpty(['test'])).toBe(false);
		});

		it('should return false for non-empty object', () => {
			expect(ValidationServiceV8.isEmpty({ key: 'value' })).toBe(false);
		});

		it('should return false for number', () => {
			expect(ValidationServiceV8.isEmpty(0)).toBe(false);
			expect(ValidationServiceV8.isEmpty(123)).toBe(false);
		});
	});

	describe('formatErrors', () => {
		it('should format single error', () => {
			const errors = [
				{
					field: 'clientId',
					message: 'Client ID is required',
					code: 'REQUIRED',
				},
			];

			const formatted = ValidationServiceV8.formatErrors(errors);

			expect(formatted).toContain('Client ID is required');
		});

		it('should format multiple errors', () => {
			const errors = [
				{
					field: 'clientId',
					message: 'Client ID is required',
					code: 'REQUIRED',
				},
				{
					field: 'redirectUri',
					message: 'Redirect URI is required',
					code: 'REQUIRED',
				},
			];

			const formatted = ValidationServiceV8.formatErrors(errors);

			expect(formatted).toContain('Client ID is required');
			expect(formatted).toContain('Redirect URI is required');
		});

		it('should include suggestions when present', () => {
			const errors = [
				{
					field: 'environmentId',
					message: 'Invalid UUID format',
					suggestion: 'Format: 12345678-1234-1234-1234-123456789012',
					code: 'INVALID_UUID',
				},
			];

			const formatted = ValidationServiceV8.formatErrors(errors);

			expect(formatted).toContain('Invalid UUID format');
			expect(formatted).toContain('Format: 12345678-1234-1234-1234-123456789012');
		});

		it('should return empty string for no errors', () => {
			const formatted = ValidationServiceV8.formatErrors([]);

			expect(formatted).toBe('');
		});
	});

	describe('formatWarnings', () => {
		it('should format single warning', () => {
			const warnings = [
				{
					field: 'redirectUri',
					message: 'Using HTTP is insecure',
					canProceed: true,
					severity: 'high' as const,
				},
			];

			const formatted = ValidationServiceV8.formatWarnings(warnings);

			expect(formatted).toContain('Using HTTP is insecure');
		});

		it('should format multiple warnings', () => {
			const warnings = [
				{
					field: 'redirectUri',
					message: 'Using HTTP is insecure',
					canProceed: true,
					severity: 'high' as const,
				},
				{
					field: 'state',
					message: 'State parameter recommended',
					canProceed: true,
					severity: 'medium' as const,
				},
			];

			const formatted = ValidationServiceV8.formatWarnings(warnings);

			expect(formatted).toContain('Using HTTP is insecure');
			expect(formatted).toContain('State parameter recommended');
		});

		it('should return empty string for no warnings', () => {
			const formatted = ValidationServiceV8.formatWarnings([]);

			expect(formatted).toBe('');
		});
	});
});
