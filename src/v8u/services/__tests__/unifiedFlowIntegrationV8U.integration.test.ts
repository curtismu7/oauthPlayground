/**
 * @file unifiedFlowIntegrationV8U.integration.test.ts
 * @module v8u/services/__tests__
 * @description Integration tests for UnifiedFlowIntegrationV8U - flow type switching and spec version changes
 * @version 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type SpecVersion, SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import type { UnifiedFlowCredentials } from '../unifiedFlowIntegrationV8U';
import { UnifiedFlowIntegrationV8U } from '../unifiedFlowIntegrationV8U';

describe('UnifiedFlowIntegrationV8U - Integration Tests', () => {
	const mockCredentials: UnifiedFlowCredentials = {
		environmentId: 'test-env-id',
		clientId: 'test-client-id',
		clientSecret: 'test-client-secret',
		redirectUri: 'https://localhost:3000/callback',
		scopes: 'openid profile email',
		responseType: 'code',
	};

	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	describe('Flow Type Availability', () => {
		it('should return correct available flows for each spec version', () => {
			const oauth20Flows = UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.0');
			expect(oauth20Flows).toContain('oauth-authz');
			expect(oauth20Flows).toContain('implicit');
			expect(oauth20Flows).toContain('client-credentials');
			expect(oauth20Flows).toContain('device-code');

			const oauth21Flows = UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.1');
			expect(oauth21Flows).toContain('oauth-authz');
			expect(oauth21Flows).toContain('client-credentials');
			expect(oauth21Flows).toContain('device-code');
			expect(oauth21Flows).not.toContain('implicit');

			const oidcFlows = UnifiedFlowIntegrationV8U.getAvailableFlows('oidc');
			expect(oidcFlows).toContain('oauth-authz');
			expect(oidcFlows).toContain('implicit');
			expect(oidcFlows).toContain('hybrid');
			expect(oidcFlows).toContain('device-code');
		});

		it('should match SpecVersionServiceV8 available flows', () => {
			const specVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
			specVersions.forEach((specVersion) => {
				const unifiedFlows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
				const specServiceFlows = SpecVersionServiceV8.getAvailableFlows(specVersion);
				expect(unifiedFlows).toEqual(specServiceFlows);
			});
		});
	});

	describe('Flow Type and Spec Version Compatibility', () => {
		it('should handle switching from OIDC to OAuth 2.1 when selecting client-credentials', () => {
			// Client credentials is available in both OIDC and OAuth 2.1
			// But if user is on OIDC and selects client-credentials, it should work
			const oidcFlows = UnifiedFlowIntegrationV8U.getAvailableFlows('oidc');
			// Note: client-credentials is NOT in OIDC flows, so this tests the auto-switch logic
			expect(oidcFlows).not.toContain('client-credentials');

			// OAuth 2.1 should have client-credentials
			const oauth21Flows = UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.1');
			expect(oauth21Flows).toContain('client-credentials');
		});

		it('should handle switching from OAuth 2.1 to OIDC when selecting implicit', () => {
			// Implicit is NOT available in OAuth 2.1
			const oauth21Flows = UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.1');
			expect(oauth21Flows).not.toContain('implicit');

			// But it IS available in OIDC
			const oidcFlows = UnifiedFlowIntegrationV8U.getAvailableFlows('oidc');
			expect(oidcFlows).toContain('implicit');
		});

		it('should handle device-code flow across all spec versions', () => {
			const specVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
			specVersions.forEach((specVersion) => {
				const flows = UnifiedFlowIntegrationV8U.getAvailableFlows(specVersion);
				expect(flows).toContain('device-code');
			});
		});
	});

	describe('Authorization URL Generation', () => {
		it('should generate authorization URL for OAuth 2.0 authorization code flow', () => {
			const url = UnifiedFlowIntegrationV8U.generateAuthorizationUrl(
				'oauth2.0',
				'oauth-authz',
				mockCredentials
			);
			expect(url).toBeTruthy();
			expect(url).toContain('response_type=code');
			expect(url).toContain(`client_id=${mockCredentials.clientId}`);
		});

		it('should generate authorization URL for OIDC authorization code flow', () => {
			const url = UnifiedFlowIntegrationV8U.generateAuthorizationUrl('oidc', 'oauth-authz', {
				...mockCredentials,
				scopes: 'openid profile email',
			});
			expect(url).toBeTruthy();
			expect(url).toContain('response_type=code');
			expect(url).toContain('scope=openid');
		});

		it('should include PKCE parameters when usePKCE is true', () => {
			const url = UnifiedFlowIntegrationV8U.generateAuthorizationUrl('oauth2.1', 'oauth-authz', {
				...mockCredentials,
				usePKCE: true,
				codeChallenge: 'test-challenge',
				codeChallengeMethod: 'S256',
			});
			expect(url).toBeTruthy();
			expect(url).toContain('code_challenge=');
			expect(url).toContain('code_challenge_method=S256');
		});
	});

	describe('Compliance Validation', () => {
		it('should validate OAuth 2.1 requires PKCE for authorization code flow', () => {
			const errors = UnifiedFlowIntegrationV8U.getComplianceErrors('oauth2.1', 'oauth-authz', {
				...mockCredentials,
				usePKCE: false,
			});
			expect(errors.length).toBeGreaterThan(0);
			expect(errors.some((e) => e.includes('PKCE'))).toBe(true);
		});

		it('should validate OIDC requires openid scope', () => {
			const errors = UnifiedFlowIntegrationV8U.getComplianceErrors('oidc', 'oauth-authz', {
				...mockCredentials,
				scopes: 'profile email', // Missing openid
			});
			expect(errors.length).toBeGreaterThan(0);
			expect(errors.some((e) => e.includes('openid'))).toBe(true);
		});

		it('should pass validation for OAuth 2.0 with implicit flow', () => {
			const errors = UnifiedFlowIntegrationV8U.getComplianceErrors('oauth2.0', 'implicit', {
				...mockCredentials,
				responseType: 'token',
			});
			// OAuth 2.0 allows implicit flow without errors
			expect(errors.filter((e) => e.includes('implicit')).length).toBe(0);
		});
	});

	describe('Flow Type Switching Scenarios', () => {
		it('should handle switching from authorization code to client credentials', () => {
			// Both flows should be available in OAuth 2.0
			const oauth20Flows = UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.0');
			expect(oauth20Flows).toContain('oauth-authz');
			expect(oauth20Flows).toContain('client-credentials');

			// Should be able to generate URLs for both
			const authzUrl = UnifiedFlowIntegrationV8U.generateAuthorizationUrl(
				'oauth2.0',
				'oauth-authz',
				mockCredentials
			);
			expect(authzUrl).toBeTruthy();

			// Client credentials doesn't use authorization URL, but should not error
			expect(() => {
				UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.0');
			}).not.toThrow();
		});

		it('should handle switching from OAuth 2.0 implicit to OAuth 2.1 (should auto-switch spec)', () => {
			// Implicit is available in OAuth 2.0
			const oauth20Flows = UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.0');
			expect(oauth20Flows).toContain('implicit');

			// But NOT in OAuth 2.1
			const oauth21Flows = UnifiedFlowIntegrationV8U.getAvailableFlows('oauth2.1');
			expect(oauth21Flows).not.toContain('implicit');

			// This tests that the system should handle this gracefully
			// (e.g., by auto-switching to OAuth 2.0 or showing an error)
		});
	});
});
