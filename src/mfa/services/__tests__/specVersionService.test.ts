/**
 * @file specVersionService.test.ts
 * @module v8/services/__tests__
 * @description Unit tests for SpecVersionService
 * @version 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpecVersionService } from '../specVersionService';

describe('SpecVersionService', () => {
	beforeEach(() => {
		// Suppress console.log during tests
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	describe('getAvailableFlows', () => {
		it('should return correct flows for OAuth 2.0', () => {
			const flows = SpecVersionService.getAvailableFlows('oauth2.0');
			expect(flows).toContain('oauth-authz');
			expect(flows).toContain('implicit');
			expect(flows).toContain('client-credentials');
			expect(flows).toContain('device-code');
			expect(flows).not.toContain('hybrid');
		});

		it('should return correct flows for OAuth 2.1', () => {
			const flows = SpecVersionService.getAvailableFlows('oauth2.1');
			expect(flows).toContain('oauth-authz');
			expect(flows).toContain('client-credentials');
			expect(flows).toContain('device-code');
			expect(flows).not.toContain('implicit');
			expect(flows).not.toContain('hybrid');
		});

		it('should return correct flows for OpenID Connect', () => {
			const flows = SpecVersionService.getAvailableFlows('oidc');
			expect(flows).toContain('oauth-authz');
			expect(flows).toContain('implicit');
			expect(flows).toContain('hybrid');
			expect(flows).toContain('device-code');
			expect(flows).not.toContain('client-credentials');
		});
	});

	describe('isFlowAvailable', () => {
		it('should return true for available flows', () => {
			expect(SpecVersionService.isFlowAvailable('oauth2.0', 'oauth-authz')).toBe(true);
			expect(SpecVersionService.isFlowAvailable('oauth2.1', 'oauth-authz')).toBe(true);
			expect(SpecVersionService.isFlowAvailable('oidc', 'oauth-authz')).toBe(true);
		});

		it('should return false for unavailable flows', () => {
			expect(SpecVersionService.isFlowAvailable('oauth2.1', 'implicit')).toBe(false);
			expect(SpecVersionService.isFlowAvailable('oauth2.1', 'hybrid')).toBe(false);
			expect(SpecVersionService.isFlowAvailable('oidc', 'client-credentials')).toBe(false);
		});
	});

	describe('getComplianceRules', () => {
		it('should return correct compliance rules for OAuth 2.0', () => {
			const rules = SpecVersionService.getComplianceRules('oauth2.0');
			expect(rules.requirePKCE).toBe(false);
			expect(rules.requireHTTPS).toBe(false);
			expect(rules.allowImplicit).toBe(true);
		});

		it('should return correct compliance rules for OAuth 2.1', () => {
			const rules = SpecVersionService.getComplianceRules('oauth2.1');
			expect(rules.requirePKCE).toBe(true);
			expect(rules.requireHTTPS).toBe(true);
			expect(rules.allowImplicit).toBe(false);
		});

		it('should return correct compliance rules for OpenID Connect', () => {
			const rules = SpecVersionService.getComplianceRules('oidc');
			expect(rules.requirePKCE).toBe(false);
			expect(rules.requireHTTPS).toBe(false);
			expect(rules.requireOpenIDScope).toBe(true);
		});
	});

	describe('getSpecConfig', () => {
		it('should return complete spec config for OAuth 2.0', () => {
			const config = SpecVersionService.getSpecConfig('oauth2.0');
			expect(config.name).toBe('OAuth 2.0');
			expect(config.description).toBe('Standard OAuth 2.0 (RFC 6749)');
			expect(config.supportedFlows.length).toBeGreaterThan(0);
		});

		it('should return complete spec config for OAuth 2.1', () => {
			const config = SpecVersionService.getSpecConfig('oauth2.1');
			expect(config.name).toBe('OAuth 2.1');
			expect(config.description).toContain('Modern OAuth 2.0');
		});

		it('should return complete spec config for OpenID Connect', () => {
			const config = SpecVersionService.getSpecConfig('oidc');
			expect(config.name).toBe('OpenID Connect');
			expect(config.description).toContain('Authentication layer');
		});
	});

	describe('getSpecDescription', () => {
		it('should return description for each spec version', () => {
			expect(SpecVersionService.getSpecDescription('oauth2.0')).toBeTruthy();
			expect(SpecVersionService.getSpecDescription('oauth2.1')).toBeTruthy();
			expect(SpecVersionService.getSpecDescription('oidc')).toBeTruthy();
		});
	});

	describe('validateConfiguration', () => {
		it('should validate OAuth 2.1 requires PKCE for authorization code flow', () => {
			const result = SpecVersionService.validateConfiguration('oauth2.1', 'oauth-authz', {
				usePKCE: false,
			});
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(expect.stringContaining('PKCE'));
		});

		it('should validate OAuth 2.1 allows PKCE for authorization code flow', () => {
			const result = SpecVersionService.validateConfiguration('oauth2.1', 'oauth-authz', {
				usePKCE: true,
			});
			expect(result.valid).toBe(true);
		});

		it('should validate OpenID Connect requires openid scope', () => {
			const result = SpecVersionService.validateConfiguration('oidc', 'oauth-authz', {
				scopes: 'profile email',
			});
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(expect.stringContaining('openid'));
		});

		it('should validate OpenID Connect allows openid scope', () => {
			const result = SpecVersionService.validateConfiguration('oidc', 'oauth-authz', {
				scopes: 'openid profile email',
			});
			expect(result.valid).toBe(true);
		});

		it('should reject unavailable flows', () => {
			const result = SpecVersionService.validateConfiguration('oauth2.1', 'implicit', {});
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should warn about deprecated flows in OAuth 2.1', () => {
			const result = SpecVersionService.validateConfiguration('oauth2.1', 'implicit', {});
			expect(result.warnings).toContain(expect.stringContaining('deprecated'));
		});
	});

	describe('getAllSpecVersions', () => {
		it('should return all spec versions', () => {
			const versions = SpecVersionService.getAllSpecVersions();
			expect(versions).toContain('oauth2.0');
			expect(versions).toContain('oauth2.1');
			expect(versions).toContain('oidc');
			expect(versions.length).toBe(3);
		});
	});

	describe('getSpecLabel', () => {
		it('should return correct labels for all spec versions', () => {
			expect(SpecVersionService.getSpecLabel('oauth2.0')).toBe('OAuth 2.0');
			expect(SpecVersionService.getSpecLabel('oauth2.1')).toBe('OAuth 2.1');
			expect(SpecVersionService.getSpecLabel('oidc')).toBe('OpenID Connect');
		});
	});

	describe('getFlowLabel', () => {
		it('should return correct labels for all flow types', () => {
			expect(SpecVersionService.getFlowLabel('oauth-authz')).toBe('Authorization Code Flow');
			expect(SpecVersionService.getFlowLabel('implicit')).toBe('Implicit Flow');
			expect(SpecVersionService.getFlowLabel('client-credentials')).toBe(
				'Client Credentials Flow'
			);
			expect(SpecVersionService.getFlowLabel('device-code')).toBe('Device code grant type');
			expect(SpecVersionService.getFlowLabel('hybrid')).toBe('Hybrid Flow');
		});
	});
});
