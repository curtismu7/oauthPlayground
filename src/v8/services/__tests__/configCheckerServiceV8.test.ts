/**
 * @file configCheckerServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for ConfigCheckerServiceV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { ConfigCheckerServiceV8, PingOneApplication } from '../configCheckerServiceV8';

describe('ConfigCheckerServiceV8', () => {
	const mockPingOneConfig: PingOneApplication = {
		id: 'app-123',
		name: 'Test Application',
		enabled: true,
		type: 'WEB_APP',
		grantTypes: ['authorization_code', 'refresh_token'],
		responseTypes: ['code'],
		tokenEndpointAuthMethod: 'client_secret_post',
		redirectUris: ['http://localhost:3000/callback'],
		pkceRequired: true,
		pkceEnforced: false,
		tokenFormat: 'JWT',
		accessTokenDuration: 3600,
		refreshTokenDuration: 604800,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
	};

	describe('compareConfigs', () => {
		it('should match valid configuration', () => {
			const userConfig = {
				clientId: 'app-123',
				redirectUri: 'http://localhost:3000/callback',
				grantType: 'authorization_code',
				responseType: 'code',
				clientAuthMethod: 'client_secret_post',
				usePkce: true,
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, mockPingOneConfig);

			expect(comparison.clientId.match).toBe(true);
			expect(comparison.redirectUris.match).toBe(true);
			expect(comparison.grantTypes.match).toBe(true);
			expect(comparison.responseTypes.match).toBe(true);
			expect(comparison.tokenEndpointAuthMethod.match).toBe(true);
			expect(comparison.pkce.match).toBe(true);
		});

		it('should detect redirect URI mismatch', () => {
			const userConfig = {
				clientId: 'app-123',
				redirectUri: 'http://example.com/callback',
				grantType: 'authorization_code',
				responseType: 'code',
				clientAuthMethod: 'client_secret_post',
				usePkce: true,
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, mockPingOneConfig);

			expect(comparison.redirectUris.match).toBe(false);
			expect(comparison.redirectUris.missing).toContain('http://example.com/callback');
		});

		it('should detect grant type mismatch', () => {
			const userConfig = {
				clientId: 'app-123',
				redirectUri: 'http://localhost:3000/callback',
				grantType: 'implicit',
				responseType: 'code',
				clientAuthMethod: 'client_secret_post',
				usePkce: true,
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, mockPingOneConfig);

			expect(comparison.grantTypes.match).toBe(false);
			expect(comparison.grantTypes.missing).toContain('implicit');
		});

		it('should detect response type mismatch', () => {
			const userConfig = {
				clientId: 'app-123',
				redirectUri: 'http://localhost:3000/callback',
				grantType: 'authorization_code',
				responseType: 'token',
				clientAuthMethod: 'client_secret_post',
				usePkce: true,
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, mockPingOneConfig);

			expect(comparison.responseTypes.match).toBe(false);
			expect(comparison.responseTypes.missing).toContain('token');
		});

		it('should detect PKCE mismatch', () => {
			const userConfig = {
				clientId: 'app-123',
				redirectUri: 'http://localhost:3000/callback',
				grantType: 'authorization_code',
				responseType: 'code',
				clientAuthMethod: 'client_secret_post',
				usePkce: false,
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, mockPingOneConfig);

			expect(comparison.pkce.match).toBe(false);
			expect(comparison.pkce.level).toBe('required');
		});

		it('should detect disabled application', () => {
			const userConfig = {
				clientId: 'app-123',
				redirectUri: 'http://localhost:3000/callback',
				grantType: 'authorization_code',
				responseType: 'code',
				clientAuthMethod: 'client_secret_post',
				usePkce: true,
			};

			const disabledConfig = { ...mockPingOneConfig, enabled: false };

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, disabledConfig);

			expect(comparison.enabled.match).toBe(false);
		});
	});

	describe('generateFixSuggestions', () => {
		it('should generate suggestions for redirect URI mismatch', () => {
			const comparison = ConfigCheckerServiceV8.compareConfigs(
				{
					clientId: 'app-123',
					redirectUri: 'http://example.com/callback',
				},
				mockPingOneConfig
			);

			const suggestions = ConfigCheckerServiceV8.generateFixSuggestions(comparison);

			expect(suggestions.some((s) => s.field === 'redirectUri')).toBe(true);
			expect(suggestions.some((s) => s.severity === 'error')).toBe(true);
		});

		it('should generate suggestions for grant type mismatch', () => {
			const comparison = ConfigCheckerServiceV8.compareConfigs(
				{
					clientId: 'app-123',
					grantType: 'implicit',
				},
				mockPingOneConfig
			);

			const suggestions = ConfigCheckerServiceV8.generateFixSuggestions(comparison);

			expect(suggestions.some((s) => s.field === 'grantType')).toBe(true);
		});

		it('should generate suggestions for PKCE mismatch', () => {
			const comparison = ConfigCheckerServiceV8.compareConfigs(
				{
					clientId: 'app-123',
					usePkce: false,
				},
				mockPingOneConfig
			);

			const suggestions = ConfigCheckerServiceV8.generateFixSuggestions(comparison);

			expect(suggestions.some((s) => s.field === 'pkce')).toBe(true);
		});

		it('should generate suggestions for disabled application', () => {
			const disabledConfig = { ...mockPingOneConfig, enabled: false };
			const comparison = ConfigCheckerServiceV8.compareConfigs(
				{ clientId: 'app-123' },
				disabledConfig
			);

			const suggestions = ConfigCheckerServiceV8.generateFixSuggestions(comparison);

			expect(suggestions.some((s) => s.field === 'enabled')).toBe(true);
			expect(suggestions.some((s) => s.severity === 'error')).toBe(true);
		});
	});

	describe('getApplicationSummary', () => {
		it('should return application summary', () => {
			const summary = ConfigCheckerServiceV8.getApplicationSummary(mockPingOneConfig);

			expect(summary.name).toBe('Test Application');
			expect(summary.type).toBe('WEB_APP');
			expect(summary.enabled).toBe(true);
			expect(summary.grantTypes).toContain('authorization_code');
			expect(summary.responseTypes).toContain('code');
			expect(summary.redirectUris).toContain('http://localhost:3000/callback');
			expect(summary.tokenEndpointAuthMethod).toBe('client_secret_post');
			expect(summary.pkceRequired).toBe(true);
			expect(summary.tokenFormat).toBe('JWT');
		});

		it('should handle default values', () => {
			const minimalConfig: PingOneApplication = {
				id: 'app-123',
				name: 'Minimal App',
				enabled: true,
				type: 'WEB_APP',
				grantTypes: [],
				responseTypes: [],
				tokenEndpointAuthMethod: 'none',
				redirectUris: [],
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			};

			const summary = ConfigCheckerServiceV8.getApplicationSummary(minimalConfig);

			expect(summary.pkceRequired).toBe(false);
			expect(summary.tokenFormat).toBe('OPAQUE');
			expect(summary.accessTokenDuration).toBe(3600);
			expect(summary.refreshTokenDuration).toBe(604800);
		});
	});

	describe('formatConfigForDisplay', () => {
		it('should format configuration for display', () => {
			const formatted = ConfigCheckerServiceV8.formatConfigForDisplay(mockPingOneConfig);

			expect(formatted).toContain('Test Application');
			expect(formatted).toContain('WEB_APP');
			expect(formatted).toContain('✓ Enabled');
			expect(formatted).toContain('authorization_code');
			expect(formatted).toContain('code');
			expect(formatted).toContain('http://localhost:3000/callback');
			expect(formatted).toContain('client_secret_post');
			expect(formatted).toContain('Required');
			expect(formatted).toContain('JWT');
		});

		it('should show disabled status', () => {
			const disabledConfig = { ...mockPingOneConfig, enabled: false };
			const formatted = ConfigCheckerServiceV8.formatConfigForDisplay(disabledConfig);

			expect(formatted).toContain('✗ Disabled');
		});
	});

	describe('validateConfiguration', () => {
		it('should validate correct configuration', () => {
			const validation = ConfigCheckerServiceV8.validateConfiguration(mockPingOneConfig);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it('should detect disabled application', () => {
			const disabledConfig = { ...mockPingOneConfig, enabled: false };
			const validation = ConfigCheckerServiceV8.validateConfiguration(disabledConfig);

			expect(validation.valid).toBe(false);
			expect(validation.errors).toContain('Application is disabled');
		});

		it('should detect missing grant types', () => {
			const noGrantConfig = { ...mockPingOneConfig, grantTypes: [] };
			const validation = ConfigCheckerServiceV8.validateConfiguration(noGrantConfig);

			expect(validation.valid).toBe(false);
			expect(validation.errors).toContain('No grant types configured');
		});

		it('should detect missing response types', () => {
			const noResponseConfig = { ...mockPingOneConfig, responseTypes: [] };
			const validation = ConfigCheckerServiceV8.validateConfiguration(noResponseConfig);

			expect(validation.valid).toBe(false);
			expect(validation.errors).toContain('No response types configured');
		});

		it('should detect missing redirect URIs', () => {
			const noRedirectConfig = { ...mockPingOneConfig, redirectUris: [] };
			const validation = ConfigCheckerServiceV8.validateConfiguration(noRedirectConfig);

			expect(validation.valid).toBe(false);
			expect(validation.errors).toContain('No redirect URIs configured');
		});

		it('should warn about optional PKCE', () => {
			const optionalPkceConfig = { ...mockPingOneConfig, pkceRequired: false, pkceEnforced: false };
			const validation = ConfigCheckerServiceV8.validateConfiguration(optionalPkceConfig);

			expect(validation.warnings.some((w) => w.includes('PKCE'))).toBe(true);
		});

		it('should warn about opaque tokens', () => {
			const opaqueConfig = { ...mockPingOneConfig, tokenFormat: 'OPAQUE' };
			const validation = ConfigCheckerServiceV8.validateConfiguration(opaqueConfig);

			expect(validation.warnings.some((w) => w.includes('opaque'))).toBe(true);
		});
	});

	describe('configuration comparison details', () => {
		it('should show extra redirect URIs', () => {
			const userConfig = {
				clientId: 'app-123',
				redirectUri: 'http://localhost:3000/callback',
			};

			const configWithExtra = {
				...mockPingOneConfig,
				redirectUris: ['http://localhost:3000/callback', 'http://localhost:3000/other'],
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, configWithExtra);

			expect(comparison.redirectUris.extra).toContain('http://localhost:3000/other');
		});

		it('should handle multiple grant types', () => {
			const userConfig = {
				grantType: 'client_credentials',
			};

			const configWithMultiple = {
				...mockPingOneConfig,
				grantTypes: ['authorization_code', 'refresh_token', 'client_credentials'],
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, configWithMultiple);

			expect(comparison.grantTypes.match).toBe(true);
		});

		it('should detect PKCE enforcement', () => {
			const userConfig = {
				usePkce: false,
			};

			const enforcedConfig = {
				...mockPingOneConfig,
				pkceRequired: false,
				pkceEnforced: true,
			};

			const comparison = ConfigCheckerServiceV8.compareConfigs(userConfig, enforcedConfig);

			expect(comparison.pkce.level).toBe('enforced');
			expect(comparison.pkce.match).toBe(false);
		});
	});
});
