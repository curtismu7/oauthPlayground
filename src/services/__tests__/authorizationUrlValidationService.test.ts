// src/services/__tests__/authorizationUrlValidationService.test.ts
// Comprehensive test suite for Authorization URL Validation Service

import { beforeEach, describe, expect, it } from 'vitest';
import {
	AuthorizationUrlValidationService,
	type ParsedAuthorizationUrl,
} from '../authorizationUrlValidationService';

describe('AuthorizationUrlValidationService', () => {
	let service: AuthorizationUrlValidationService;

	beforeEach(() => {
		service = AuthorizationUrlValidationService.getInstance();
	});

	describe('URL Parsing', () => {
		it('should parse valid authorization URL correctly', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test-client&redirect_uri=https://localhost:3000/callback&scope=openid%20profile&state=test-state';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.parsedUrl).toBeTruthy();
			expect(result.parsedUrl?.clientId).toBe('test-client');
			expect(result.parsedUrl?.redirectUri).toBe('https://localhost:3000/callback');
			expect(result.parsedUrl?.scope).toEqual(['openid', 'profile']);
			expect(result.parsedUrl?.responseType).toEqual(['code']);
		});

		it('should handle URLs with multiple response types', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code%20id_token&client_id=test-client&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'hybrid' });

			expect(result.parsedUrl?.responseType).toEqual(['code', 'id_token']);
			expect(result.flowType).toBe('hybrid');
		});

		it('should handle URLs with custom parameters', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test-client&redirect_uri=https://localhost:3000/callback&scope=openid&custom_param=value';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.parsedUrl?.customParams).toEqual({ custom_param: 'value' });
		});

		it('should handle malformed URLs gracefully', () => {
			const url = 'not-a-valid-url';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('URL_VALIDATION_ERROR: Invalid URL format');
		});

		it('should handle empty or null URLs', () => {
			const result1 = service.validateAuthorizationUrl('', { flowType: 'authorization-code' });
			const result2 = service.validateAuthorizationUrl('   ', { flowType: 'authorization-code' });

			expect(result1.isValid).toBe(false);
			expect(result2.isValid).toBe(false);
		});
	});

	describe('Flow Type Detection', () => {
		it('should detect authorization code flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.flowType).toBe('authorization-code');
		});

		it('should detect implicit flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=token&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'implicit' });

			expect(result.flowType).toBe('implicit');
		});

		it('should detect hybrid flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code%20id_token&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'hybrid' });

			expect(result.flowType).toBe('hybrid');
		});

		it('should detect device flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/device_authorization?client_id=test&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'device' });

			expect(result.flowType).toBe('device');
		});

		it('should detect unknown flow for unrecognized response types', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=unknown&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.flowType).toBe('unknown');
		});
	});

	describe('Scope Validation', () => {
		it('should require openid scope by default', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=profile';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('URL_VALIDATION_ERROR: Missing required scope: openid');
		});

		it('should allow disabling openid requirement', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=profile';

			const result = service.validateAuthorizationUrl(url, {
				flowType: 'authorization-code',
				requireOpenId: false,
			});

			expect(result.errors).not.toContain('URL_VALIDATION_ERROR: Missing required scope: openid');
		});

		it('should validate scope format', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid%20invalid@scope';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('URL_VALIDATION_ERROR: Invalid scope(s): invalid@scope');
		});

		it('should suggest additional scopes when only openid is present', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.suggestions).toContain(
				'Consider adding additional scopes like "profile" or "email" for more user information'
			);
		});

		it('should warn about PingOne-specific scopes', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid%20p1:read:user';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain(
				'URL_VALIDATION_WARNING: Using PingOne-specific scopes: p1:read:user'
			);
		});

		it('should handle empty scope parameter', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('URL_VALIDATION_ERROR: No scopes specified');
		});
	});

	describe('Required Parameters Validation', () => {
		it('should require client_id', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'URL_VALIDATION_ERROR: Missing required parameter: client_id'
			);
		});

		it('should require redirect_uri', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'URL_VALIDATION_ERROR: Missing required parameter: redirect_uri'
			);
		});

		it('should require response_type', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'URL_VALIDATION_ERROR: Missing required parameter: response_type'
			);
		});
	});

	describe('Response Type Validation', () => {
		it('should validate response types for authorization code flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=token&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('URL_VALIDATION_ERROR: Invalid response_type(s): token');
		});

		it('should validate response types for implicit flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'implicit' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('URL_VALIDATION_ERROR: Invalid response_type(s): code');
		});

		it('should validate response types for hybrid flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'hybrid' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'URL_VALIDATION_ERROR: Missing required response_type(s): id_token'
			);
		});

		it('should allow device flow without response_type', () => {
			const url =
				'https://auth.pingone.com/env-id/as/device_authorization?client_id=test&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'device' });

			expect(result.errors).not.toContain(
				'URL_VALIDATION_ERROR: Missing required parameter: response_type'
			);
		});
	});

	describe('Security Validation', () => {
		it('should warn about missing state parameter', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain(
				'URL_VALIDATION_WARNING: Missing state parameter (recommended for security)'
			);
		});

		it('should warn about missing nonce for OIDC flows', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=id_token&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'implicit' });

			expect(result.warnings).toContain(
				'URL_VALIDATION_WARNING: Missing nonce parameter (recommended for OIDC flows)'
			);
		});

		it('should warn about missing PKCE for authorization code flow', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain(
				'URL_VALIDATION_WARNING: Missing PKCE parameters (recommended for security)'
			);
		});

		it('should warn about non-HTTPS redirect URI', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=http://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain('URL_VALIDATION_WARNING: Redirect URI should use HTTPS');
		});

		it('should allow disabling security requirements', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, {
				flowType: 'authorization-code',
				requireState: false,
				requireNonce: false,
				requirePkce: false,
			});

			expect(result.warnings).not.toContain('URL_VALIDATION_WARNING: Missing state parameter');
			expect(result.warnings).not.toContain('URL_VALIDATION_WARNING: Missing PKCE parameters');
		});
	});

	describe('PingOne-Specific Validation', () => {
		it('should warn about non-PingOne URLs', () => {
			const url =
				'https://other-provider.com/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain(
				'URL_VALIDATION_WARNING: URL does not appear to be a PingOne authorization endpoint'
			);
		});

		it('should warn about non-HTTPS URLs', () => {
			const url =
				'http://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain(
				'URL_VALIDATION_WARNING: URL should use HTTPS for security'
			);
		});

		it('should validate prompt parameter', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid&prompt=invalid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain('URL_VALIDATION_WARNING: Invalid prompt value: invalid');
		});

		it('should validate max_age parameter', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid&max_age=invalid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.warnings).toContain('URL_VALIDATION_WARNING: Invalid max_age value: invalid');
		});

		it('should provide suggestion for login_hint', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid&login_hint=user@example.com';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.suggestions).toContain(
				'Login hint provided - this will pre-populate the username field'
			);
		});
	});

	describe('Custom Validation', () => {
		it('should support custom validation functions', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const customValidation = (parsedUrl: ParsedAuthorizationUrl) => {
				if (parsedUrl.clientId === 'test') {
					return ['Custom error: test client ID not allowed'];
				}
				return [];
			};

			const result = service.validateAuthorizationUrl(url, {
				flowType: 'authorization-code',
				customValidation,
			});

			expect(result.errors).toContain('Custom error: test client ID not allowed');
		});
	});

	describe('Quick Validation', () => {
		it('should perform quick validation correctly', () => {
			const validUrl =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';
			const invalidUrl =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback';

			const validResult = service.quickValidate(validUrl);
			const invalidResult = service.quickValidate(invalidUrl);

			expect(validResult.isValid).toBe(true);
			expect(validResult.issues).toHaveLength(0);

			expect(invalidResult.isValid).toBe(false);
			expect(invalidResult.issues).toContain('Missing required scope: openid');
		});
	});

	describe('Validation Summary', () => {
		it('should generate correct summary for valid URL', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid&state=test-state&code_challenge=test-challenge&code_challenge_method=S256';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });
			const summary = service.getValidationSummary(result);

			expect(summary.title).toBe('✅ Authorization URL Validation Passed');
			expect(summary.canProceed).toBe(true);
		});

		it('should generate correct summary for URL with warnings', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });
			const summary = service.getValidationSummary(result);

			expect(summary.title).toBe('⚠️ Authorization URL Validation Warnings');
			expect(summary.canProceed).toBe(true);
		});

		it('should generate correct summary for invalid URL', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });
			const summary = service.getValidationSummary(result);

			expect(summary.title).toBe('❌ Authorization URL Validation Failed');
			expect(summary.canProceed).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('should handle URLs with encoded parameters', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test%20client&redirect_uri=https%3A//localhost%3A3000/callback&scope=openid%20profile';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.parsedUrl?.clientId).toBe('test client');
			expect(result.parsedUrl?.redirectUri).toBe('https://localhost:3000/callback');
			expect(result.parsedUrl?.scope).toEqual(['openid', 'profile']);
		});

		it('should handle URLs with duplicate parameters', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&client_id=duplicate&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			// URLSearchParams will use the first value, not the last
			expect(result.parsedUrl?.clientId).toBe('test');
		});

		it('should handle URLs with empty parameter values', () => {
			const url =
				'https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=&redirect_uri=https://localhost:3000/callback&scope=openid';

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'URL_VALIDATION_ERROR: Missing required parameter: client_id'
			);
		});

		it('should handle very long URLs', () => {
			const longScope = `openid ${'profile '.repeat(100)}`;
			const url = `https://auth.pingone.com/env-id/as/authorize?response_type=code&client_id=test&redirect_uri=https://localhost:3000/callback&scope=${encodeURIComponent(longScope)}`;

			const result = service.validateAuthorizationUrl(url, { flowType: 'authorization-code' });

			// Should still parse and validate
			expect(result.parsedUrl).toBeTruthy();
			expect(result.parsedUrl?.scope.length).toBeGreaterThan(100);
		});
	});
});
