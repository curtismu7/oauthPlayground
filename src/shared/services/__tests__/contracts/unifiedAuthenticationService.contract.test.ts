/**
 * @file unifiedAuthenticationService.contract.test.ts
 * @description Contract tests for Unified Authentication Service
 * @version 1.0.0
 * @since 2026-02-19
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowType, SpecVersion, UnifiedAuthMethod } from '../../unifiedAuthenticationService';
import {
	UnifiedAuthenticationService,
	unifiedAuthenticationService,
} from '../../unifiedAuthenticationService';

describe('UnifiedAuthenticationService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getAllAuthMethodConfigs', () => {
		it('should return all authentication method configurations', () => {
			const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();

			expect(configs).toBeDefined();
			expect(Object.keys(configs)).toHaveLength(5);

			// Check all required methods are present
			expect(configs.none).toBeDefined();
			expect(configs.client_secret_basic).toBeDefined();
			expect(configs.client_secret_post).toBeDefined();
			expect(configs.client_secret_jwt).toBeDefined();
			expect(configs.private_key_jwt).toBeDefined();
		});

		it('should have required configuration properties for each method', () => {
			const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();

			Object.values(configs).forEach((config) => {
				expect(config).toHaveProperty('method');
				expect(config).toHaveProperty('label');
				expect(config).toHaveProperty('description');
				expect(config).toHaveProperty('requiresClientSecret');
				expect(config).toHaveProperty('securityLevel');
				expect(config).toHaveProperty('useCases');
				expect(config).toHaveProperty('pingOneSupported');
				expect(config).toHaveProperty('oauthCompliant');
				expect(config).toHaveProperty('oidcCompliant');
				expect(config).toHaveProperty('pkceCompatible');
				expect(config).toHaveProperty('clientTypes');
				expect(config).toHaveProperty('flowCompatibility');
			});
		});

		it('should have correct security levels', () => {
			const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();

			expect(configs.none.securityLevel).toBe('low');
			expect(configs.client_secret_basic.securityLevel).toBe('high');
			expect(configs.client_secret_post.securityLevel).toBe('medium');
			expect(configs.client_secret_jwt.securityLevel).toBe('high');
			expect(configs.private_key_jwt.securityLevel).toBe('high');
		});

		it('should have correct client secret requirements', () => {
			const configs = UnifiedAuthenticationService.getAllAuthMethodConfigs();

			expect(configs.none.requiresClientSecret).toBe(false);
			expect(configs.client_secret_basic.requiresClientSecret).toBe(true);
			expect(configs.client_secret_post.requiresClientSecret).toBe(true);
			expect(configs.client_secret_jwt.requiresClientSecret).toBe(true);
			expect(configs.private_key_jwt.requiresClientSecret).toBe(false);
		});
	});

	describe('getAllAuthMethods', () => {
		it('should return all authentication methods', () => {
			const methods = UnifiedAuthenticationService.getAllAuthMethods();

			expect(methods).toHaveLength(5);
			expect(methods).toContain('none');
			expect(methods).toContain('client_secret_basic');
			expect(methods).toContain('client_secret_post');
			expect(methods).toContain('client_secret_jwt');
			expect(methods).toContain('private_key_jwt');
		});
	});

	describe('getAuthMethodConfig', () => {
		it('should return configuration for valid method', () => {
			const config = UnifiedAuthenticationService.getAuthMethodConfig('client_secret_basic');

			expect(config.method).toBe('client_secret_basic');
			expect(config.label).toBe('Client Secret Basic');
			expect(config.securityLevel).toBe('high');
			expect(config.requiresClientSecret).toBe(true);
		});

		it('should throw error for invalid method', () => {
			expect(() => {
				UnifiedAuthenticationService.getAuthMethodConfig('invalid' as UnifiedAuthMethod);
			}).toThrow('Unknown authentication method: invalid');
		});
	});

	describe('getFlowAuthRequirements', () => {
		it('should return requirements for oauth-authz flow', () => {
			const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
				'oauth-authz',
				'oauth2.0'
			);

			expect(requirements.flowType).toBe('oauth-authz');
			expect(requirements.specVersion).toBe('oauth2.0');
			expect(requirements.requiresAuthentication).toBe(true);
			expect(requirements.supportsPKCE).toBe(true);
			expect(requirements.allowedClientTypes).toContain('public');
			expect(requirements.allowedClientTypes).toContain('confidential');
			expect(requirements.defaultMethod).toBe('client_secret_basic');
			expect(requirements.securityMinimum).toBe('medium');
		});

		it('should return requirements for implicit flow', () => {
			const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
				'implicit',
				'oauth2.0'
			);

			expect(requirements.flowType).toBe('implicit');
			expect(requirements.requiresAuthentication).toBe(false);
			expect(requirements.supportsPKCE).toBe(false);
			expect(requirements.allowedClientTypes).toEqual(['public']);
			expect(requirements.defaultMethod).toBe('none');
			expect(requirements.securityMinimum).toBe('low');
		});

		it('should return requirements for client-credentials flow', () => {
			const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
				'client-credentials',
				'oauth2.0'
			);

			expect(requirements.flowType).toBe('client-credentials');
			expect(requirements.requiresAuthentication).toBe(true);
			expect(requirements.supportsPKCE).toBe(false);
			expect(requirements.allowedClientTypes).toEqual(['confidential']);
			expect(requirements.defaultMethod).toBe('client_secret_basic');
			expect(requirements.securityMinimum).toBe('high');
		});

		it('should throw error for invalid flow type', () => {
			expect(() => {
				UnifiedAuthenticationService.getFlowAuthRequirements('invalid' as FlowType, 'oauth2.0');
			}).toThrow('Unknown flow type: invalid');
		});
	});

	describe('getValidAuthMethods', () => {
		it('should return valid methods for oauth-authz with PKCE', () => {
			const validations = UnifiedAuthenticationService.getValidAuthMethods(
				'oauth-authz',
				'oauth2.0',
				true,
				'public'
			);

			expect(validations.length).toBeGreaterThan(0);
			expect(validations.every((v) => v.isValid)).toBe(true);

			// Should include 'none' for public clients with PKCE
			const noneValidation = validations.find((v) => v.method === 'none');
			expect(noneValidation?.isValid).toBe(true);
		});

		it('should return valid methods for oauth-authz without PKCE', () => {
			const validations = UnifiedAuthenticationService.getValidAuthMethods(
				'oauth-authz',
				'oauth2.0',
				false,
				'confidential'
			);

			expect(validations.length).toBeGreaterThan(0);
			expect(validations.every((v) => v.isValid)).toBe(true);

			// 'none' should not be included in validations for confidential clients without PKCE
			const noneValidation = validations.find((v) => v.method === 'none');
			expect(noneValidation).toBeUndefined();
		});

		it('should return only confidential methods for client-credentials', () => {
			const validations = UnifiedAuthenticationService.getValidAuthMethods(
				'client-credentials',
				'oauth2.0',
				false,
				'confidential'
			);

			expect(validations.length).toBeGreaterThan(0);
			expect(validations.every((v) => v.isValid)).toBe(true);

			// 'none' should not be included for client-credentials
			const noneValidation = validations.find((v) => v.method === 'none');
			expect(noneValidation).toBeUndefined();
		});

		it('should return only public methods for implicit flow', () => {
			const validations = UnifiedAuthenticationService.getValidAuthMethods(
				'implicit',
				'oauth2.0',
				false,
				'public'
			);

			expect(validations.length).toBeGreaterThan(0);
			expect(validations.every((v) => v.isValid)).toBe(true);

			// Should only include 'none' for implicit flow
			expect(validations).toHaveLength(1);
			expect(validations[0].method).toBe('none');
		});

		it('should sort by security score', () => {
			const validations = UnifiedAuthenticationService.getValidAuthMethods(
				'oauth-authz',
				'oauth2.0',
				true,
				'confidential'
			);

			for (let i = 1; i < validations.length; i++) {
				expect(validations[i - 1].securityScore).toBeGreaterThanOrEqual(
					validations[i].securityScore
				);
			}
		});
	});

	describe('getDefaultAuthMethod', () => {
		it('should return "none" for public clients with PKCE', () => {
			const defaultMethod = UnifiedAuthenticationService.getDefaultAuthMethod(
				'oauth-authz',
				'oauth2.0',
				'public'
			);

			expect(defaultMethod).toBe('none');
		});

		it('should return "client_secret_basic" for confidential clients', () => {
			const defaultMethod = UnifiedAuthenticationService.getDefaultAuthMethod(
				'oauth-authz',
				'oauth2.0',
				'confidential'
			);

			expect(defaultMethod).toBe('client_secret_basic');
		});

		it('should return "none" for implicit flow', () => {
			const defaultMethod = UnifiedAuthenticationService.getDefaultAuthMethod(
				'implicit',
				'oauth2.0',
				'public'
			);

			expect(defaultMethod).toBe('none');
		});
	});

	describe('requiresClientSecret', () => {
		it('should return correct client secret requirements', () => {
			expect(UnifiedAuthenticationService.requiresClientSecret('none')).toBe(false);
			expect(UnifiedAuthenticationService.requiresClientSecret('client_secret_basic')).toBe(true);
			expect(UnifiedAuthenticationService.requiresClientSecret('client_secret_post')).toBe(true);
			expect(UnifiedAuthenticationService.requiresClientSecret('client_secret_jwt')).toBe(true);
			expect(UnifiedAuthenticationService.requiresClientSecret('private_key_jwt')).toBe(false);
		});
	});

	describe('getAuthMethodsBySecurityLevel', () => {
		it('should return methods by security level', () => {
			const lowMethods = UnifiedAuthenticationService.getAuthMethodsBySecurityLevel('low');
			const mediumMethods = UnifiedAuthenticationService.getAuthMethodsBySecurityLevel('medium');
			const highMethods = UnifiedAuthenticationService.getAuthMethodsBySecurityLevel('high');

			expect(lowMethods).toContain('none');
			expect(mediumMethods).toContain('client_secret_post');
			expect(highMethods).toContain('client_secret_basic');
			expect(highMethods).toContain('client_secret_jwt');
			expect(highMethods).toContain('private_key_jwt');
		});
	});

	describe('getPKCECompatibleMethods', () => {
		it('should return PKCE compatible methods', () => {
			const methods = UnifiedAuthenticationService.getPKCECompatibleMethods();

			expect(methods).toContain('none');
			expect(methods).toContain('client_secret_basic');
			expect(methods).toContain('client_secret_post');
			expect(methods).toContain('client_secret_jwt');
			expect(methods).toContain('private_key_jwt');
		});
	});

	describe('getPingOneSupportedMethods', () => {
		it('should return PingOne supported methods', () => {
			const methods = UnifiedAuthenticationService.getPingOneSupportedMethods();

			expect(methods).toContain('none');
			expect(methods).toContain('client_secret_basic');
			expect(methods).toContain('client_secret_post');
			expect(methods).toContain('client_secret_jwt');
			expect(methods).toContain('private_key_jwt');
		});
	});

	describe('getAllAuthMethodsWithStatus', () => {
		it('should return all methods with status for oauth-authz with PKCE', () => {
			const methods = UnifiedAuthenticationService.getAllAuthMethodsWithStatus(
				'oauth-authz',
				'oauth2.0',
				true
			);

			expect(methods).toHaveLength(5);

			methods.forEach((method) => {
				expect(method).toHaveProperty('method');
				expect(method).toHaveProperty('label');
				expect(method).toHaveProperty('enabled');
				expect(typeof method.enabled).toBe('boolean');
			});

			// 'none' should be disabled for confidential clients even with PKCE
			const noneMethod = methods.find((m) => m.method === 'none');
			expect(noneMethod?.enabled).toBe(false);
		});

		it('should return all methods with status for oauth-authz without PKCE', () => {
			const methods = UnifiedAuthenticationService.getAllAuthMethodsWithStatus(
				'oauth-authz',
				'oauth2.0',
				false
			);

			expect(methods).toHaveLength(5);

			// 'none' should be disabled without PKCE
			const noneMethod = methods.find((m) => m.method === 'none');
			expect(noneMethod?.enabled).toBe(false);
			expect(noneMethod?.disabledReason).toBeDefined();
		});

		it('should be compatible with TokenEndpointAuthMethodServiceV8 interface', () => {
			const methods = UnifiedAuthenticationService.getAllAuthMethodsWithStatus(
				'oauth-authz',
				'oauth2.0',
				true
			);

			methods.forEach((method) => {
				expect(method).toHaveProperty('method');
				expect(method).toHaveProperty('label');
				expect(method).toHaveProperty('enabled');
				expect(method).toHaveProperty('disabledReason');
			});
		});
	});

	describe('validateAuthMethodForFlow', () => {
		it('should validate client_secret_basic for oauth-authz', () => {
			const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
				'oauth-authz',
				'oauth2.0'
			);
			const validation = UnifiedAuthenticationService.validateAuthMethodForFlow(
				'client_secret_basic',
				requirements,
				false,
				'confidential',
				'oauth2.0'
			);

			expect(validation.method).toBe('client_secret_basic');
			expect(validation.isValid).toBe(true);
			expect(validation.securityScore).toBe(3);
			expect(validation.recommendation).toBe('required');
		});

		it('should validate none for oauth-authz with PKCE', () => {
			const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
				'oauth-authz',
				'oauth2.0'
			);
			const validation = UnifiedAuthenticationService.validateAuthMethodForFlow(
				'none',
				requirements,
				true,
				'public',
				'oauth2.0'
			);

			expect(validation.method).toBe('none');
			expect(validation.isValid).toBe(true);
			expect(validation.securityScore).toBe(1);
		});

		it('should reject none for oauth-authz without PKCE', () => {
			const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
				'oauth-authz',
				'oauth2.0'
			);
			const validation = UnifiedAuthenticationService.validateAuthMethodForFlow(
				'none',
				requirements,
				false,
				'confidential',
				'oauth2.0'
			);

			expect(validation.method).toBe('none');
			expect(validation.isValid).toBe(false);
			expect(validation.reason).toContain("'none' requires PKCE");
		});

		it('should reject implicit flow in OAuth 2.1', () => {
			const requirements = UnifiedAuthenticationService.getFlowAuthRequirements(
				'implicit',
				'oauth2.1'
			);
			const validation = UnifiedAuthenticationService.validateAuthMethodForFlow(
				'none',
				requirements,
				false,
				'public',
				'oauth2.1'
			);

			expect(validation.method).toBe('none');
			expect(validation.isValid).toBe(false);
			expect(validation.reason).toContain('Implicit flow deprecated');
		});
	});

	describe('Singleton Export', () => {
		it('should export singleton instance', () => {
			expect(unifiedAuthenticationService).toBeDefined();
			expect(unifiedAuthenticationService).toBe(UnifiedAuthenticationService);
		});

		it('should have same methods as class', () => {
			expect(typeof unifiedAuthenticationService.getAllAuthMethods).toBe('function');
			expect(typeof unifiedAuthenticationService.getValidAuthMethods).toBe('function');
			expect(typeof unifiedAuthenticationService.getAuthMethodConfig).toBe('function');
		});
	});

	describe('Edge Cases', () => {
		it('should handle all flow types', () => {
			const flowTypes: FlowType[] = [
				'oauth-authz',
				'implicit',
				'client-credentials',
				'device-code',
				'hybrid',
				'resource-owner',
				'ciba',
				'ropc',
			];

			flowTypes.forEach((flowType) => {
				expect(() => {
					UnifiedAuthenticationService.getFlowAuthRequirements(flowType, 'oauth2.0');
				}).not.toThrow();
			});
		});

		it('should handle all spec versions', () => {
			const specVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];

			specVersions.forEach((specVersion) => {
				expect(() => {
					UnifiedAuthenticationService.getFlowAuthRequirements('oauth-authz', specVersion);
				}).not.toThrow();
			});
		});

		it('should handle all authentication methods', () => {
			const authMethods: UnifiedAuthMethod[] = [
				'none',
				'client_secret_basic',
				'client_secret_post',
				'client_secret_jwt',
				'private_key_jwt',
			];

			authMethods.forEach((method) => {
				expect(() => {
					UnifiedAuthenticationService.getAuthMethodConfig(method);
				}).not.toThrow();
			});
		});
	});
});
