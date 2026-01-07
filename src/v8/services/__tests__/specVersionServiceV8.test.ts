/**
 * @file specVersionServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Unit tests for SpecVersionServiceV8
 * @version 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	type ComplianceRules,
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '../specVersionServiceV8';

describe('SpecVersionServiceV8', () => {
	beforeEach(() => {
		// Suppress console.log during tests
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	describe('getAvailableFlows', () => {
		it('should return correct flows for OAuth 2.0', () => {
			const flows = SpecVersionServiceV8.getAvailableFlows('oauth2.0');
			expect(flows).toContain('oauth-authz');
			expect(flows).toContain('implicit');
			expect(flows).toContain('client-credentials');
			expect(flows).toContain('device-code');
			expect(flows).not.toContain('hybrid');
		});

		it('should return correct flows for OAuth 2.1', () => {
			const flows = SpecVersionServiceV8.getAvailableFlows('oauth2.1');
			expect(flows).toContain('oauth-authz');
			expect(flows).toContain('client-credentials');
			expect(flows).toContain('device-code');
			expect(flows).not.toContain('implicit');
			expect(flows).not.toContain('hybrid');
		});

		it('should return correct flows for OpenID Connect', () => {
			const flows = SpecVersionServiceV8.getAvailableFlows('oidc');
			expect(flows).toContain('oauth-authz');
			expect(flows).toContain('implicit');
			expect(flows).toContain('hybrid');
			expect(flows).toContain('device-code');
			expect(flows).not.toContain('client-credentials');
		});
	});

	describe('isFlowAvailable', () => {
		it('should return true for available flows', () => {
			expect(SpecVersionServiceV8.isFlowAvailable('oauth2.0', 'oauth-authz')).toBe(true);
			expect(SpecVersionServiceV8.isFlowAvailable('oauth2.1', 'oauth-authz')).toBe(true);
			expect(SpecVersionServiceV8.isFlowAvailable('oidc', 'oauth-authz')).toBe(true);
		});

		it('should return false for unavailable flows', () => {
			expect(SpecVersionServiceV8.isFlowAvailable('oauth2.1', 'implicit')).toBe(false);
			expect(SpecVersionServiceV8.isFlowAvailable('oauth2.1', 'hybrid')).toBe(false);
			expect(SpecVersionServiceV8.isFlowAvailable('oidc', 'client-credentials')).toBe(false);
		});
	});

	describe('getComplianceRules', () => {
		it('should return correct compliance rules for OAuth 2.0', () => {
			const rules = SpecVersionServiceV8.getComplianceRules('oauth2.0');
			expect(rules.requirePKCE).toBe(false);
			expect(rules.requireHTTPS).toBe(false);
			expect(rules.allowImplicit).toBe(true);
		});

		it('should return correct compliance rules for OAuth 2.1', () => {
			const rules = SpecVersionServiceV8.getComplianceRules('oauth2.1');
			expect(rules.requirePKCE).toBe(true);
			expect(rules.requireHTTPS).toBe(true);
			expect(rules.allowImplicit).toBe(false);
		});

		it('should return correct compliance rules for OpenID Connect', () => {
			const rules = SpecVersionServiceV8.getComplianceRules('oidc');
			expect(rules.requirePKCE).toBe(false);
			expect(rules.requireHTTPS).toBe(false);
			expect(rules.requireOpenIDScope).toBe(true);
		});
	});

	describe('getSpecConfig', () => {
		it('should return complete spec config for OAuth 2.0', () => {
			const config = SpecVersionServiceV8.getSpecConfig('oauth2.0');
			expect(config.name).toBe('OAuth 2.0');
			expect(config.description).toBe('Standard OAuth 2.0 (RFC 6749)');
			expect(config.supportedFlows.length).toBeGreaterThan(0);
		});

		it('should return complete spec config for OAuth 2.1', () => {
			const config = SpecVersionServiceV8.getSpecConfig('oauth2.1');
			expect(config.name).toBe('OAuth 2.1');
			expect(config.description).toContain('Modern OAuth 2.0');
		});

		it('should return complete spec config for OpenID Connect', () => {
			const config = SpecVersionServiceV8.getSpecConfig('oidc');
			expect(config.name).toBe('OpenID Connect');
			expect(config.description).toContain('Authentication layer');
		});
	});

	describe('getSpecDescription', () => {
		it('should return description for each spec version', () => {
			expect(SpecVersionServiceV8.getSpecDescription('oauth2.0')).toBeTruthy();
			expect(SpecVersionServiceV8.getSpecDescription('oauth2.1')).toBeTruthy();
			expect(SpecVersionServiceV8.getSpecDescription('oidc')).toBeTruthy();
		});
	});

	describe('validateConfiguration', () => {
		it('should validate OAuth 2.1 requires PKCE for authorization code flow', () => {
			const result = SpecVersionServiceV8.validateConfiguration('oauth2.1', 'oauth-authz', {
				usePKCE: false,
			});
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(expect.stringContaining('PKCE'));
		});

		it('should validate OAuth 2.1 allows PKCE for authorization code flow', () => {
			const result = SpecVersionServiceV8.validateConfiguration('oauth2.1', 'oauth-authz', {
				usePKCE: true,
			});
			expect(result.valid).toBe(true);
		});

		it('should validate OpenID Connect requires openid scope', () => {
			const result = SpecVersionServiceV8.validateConfiguration('oidc', 'oauth-authz', {
				scopes: 'profile email',
			});
			expect(result.valid).toBe(false);
			expect(result.errors).toContain(expect.stringContaining('openid'));
		});

		it('should validate OpenID Connect allows openid scope', () => {
			const result = SpecVersionServiceV8.validateConfiguration('oidc', 'oauth-authz', {
				scopes: 'openid profile email',
			});
			expect(result.valid).toBe(true);
		});

		it('should reject unavailable flows', () => {
			const result = SpecVersionServiceV8.validateConfiguration('oauth2.1', 'implicit', {});
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should warn about deprecated flows in OAuth 2.1', () => {
			const result = SpecVersionServiceV8.validateConfiguration('oauth2.1', 'implicit', {});
			expect(result.warnings).toContain(expect.stringContaining('deprecated'));
		});
	});

	describe('getAllSpecVersions', () => {
		it('should return all spec versions', () => {
			const versions = SpecVersionServiceV8.getAllSpecVersions();
			expect(versions).toContain('oauth2.0');
			expect(versions).toContain('oauth2.1');
			expect(versions).toContain('oidc');
			expect(versions.length).toBe(3);
		});
	});

	describe('getSpecLabel', () => {
		it('should return correct labels for all spec versions', () => {
			expect(SpecVersionServiceV8.getSpecLabel('oauth2.0')).toBe('OAuth 2.0');
			expect(SpecVersionServiceV8.getSpecLabel('oauth2.1')).toBe('OAuth 2.1');
			expect(SpecVersionServiceV8.getSpecLabel('oidc')).toBe('OpenID Connect');
		});
	});

	describe('getFlowLabel', () => {
		it('should return correct labels for all flow types', () => {
			expect(SpecVersionServiceV8.getFlowLabel('oauth-authz')).toBe('Authorization Code Flow');
			expect(SpecVersionServiceV8.getFlowLabel('implicit')).toBe('Implicit Flow');
			expect(SpecVersionServiceV8.getFlowLabel('client-credentials')).toBe(
				'Client Credentials Flow'
			);
			expect(SpecVersionServiceV8.getFlowLabel('device-code')).toBe('Device Authorization Flow');
			expect(SpecVersionServiceV8.getFlowLabel('hybrid')).toBe('Hybrid Flow');
		});
	});
});
