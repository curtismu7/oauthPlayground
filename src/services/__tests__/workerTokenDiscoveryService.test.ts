// src/services/__tests__/workerTokenDiscoveryService.test.ts
// Tests for Worker Token Discovery Service

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComprehensiveDiscoveryService } from '../comprehensiveDiscoveryService';
import { workerTokenDiscoveryService } from '../workerTokenDiscoveryService';

const spyOnComprehensiveDiscovery = () =>
	vi.spyOn(
		workerTokenDiscoveryService as unknown as {
			comprehensiveDiscovery: ComprehensiveDiscoveryService;
		},
		'comprehensiveDiscovery',
		'get'
	);

describe('WorkerTokenDiscoveryService', () => {
	beforeEach(() => {
		// Clear cache before each test
		workerTokenDiscoveryService.clearCache();
	});

	describe('discover', () => {
		it('should discover OIDC configuration for valid environment ID', async () => {
			const config = {
				environmentId: 'test-env-id-123',
				region: 'us' as const,
				clientId: 'test-client-id',
				clientSecret: 'test-client-secret',
				timeout: 5000,
				enableCaching: true,
			};

			// Mock the comprehensive discovery service
			const mockResult = {
				success: true,
				document: {
					issuer: 'https://auth.pingone.com/test-env-id-123/as',
					token_endpoint: 'https://auth.pingone.com/test-env-id-123/as/token',
					introspection_endpoint: 'https://auth.pingone.com/test-env-id-123/as/introspect',
					userinfo_endpoint: 'https://auth.pingone.com/test-env-id-123/as/userinfo',
					jwks_uri: 'https://auth.pingone.com/test-env-id-123/as/jwks',
					scopes_supported: [
						'p1:read:user',
						'p1:update:user',
						'p1:read:device',
						'p1:update:device',
					],
					grant_types_supported: ['client_credentials'],
					response_types_supported: ['token'],
				},
				issuerUrl: 'https://auth.pingone.com/test-env-id-123/as',
				cached: false,
			};

			// Mock the comprehensive discovery service
			spyOnComprehensiveDiscovery().mockReturnValue({
				discover: vi.fn().mockResolvedValue(mockResult),
			});

			const result = await workerTokenDiscoveryService.discover(config);

			expect(result.success).toBe(true);
			expect(result.environmentId).toBe('test-env-id-123');
			expect(result.issuerUrl).toBe('https://auth.pingone.com/test-env-id-123/as');
			expect(result.tokenEndpoint).toBe('https://auth.pingone.com/test-env-id-123/as/token');
			expect(result.scopes).toEqual([
				'p1:read:user',
				'p1:update:user',
				'p1:read:device',
				'p1:update:device',
			]);
		});

		it('should handle discovery failure gracefully', async () => {
			const config = {
				environmentId: 'invalid-env-id',
				region: 'us' as const,
			};

			// Mock discovery failure
			spyOnComprehensiveDiscovery().mockReturnValue({
				discover: vi.fn().mockResolvedValue({
					success: false,
					error: 'Discovery failed',
				}),
			});

			const result = await workerTokenDiscoveryService.discover(config);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Discovery failed');
		});

		it('should use cached results when available', async () => {
			const config = {
				environmentId: 'test-env-id-123',
				region: 'us' as const,
				enableCaching: true,
			};

			// First call - should cache the result
			const mockResult = {
				success: true,
				document: {
					issuer: 'https://auth.pingone.com/test-env-id-123/as',
					token_endpoint: 'https://auth.pingone.com/test-env-id-123/as/token',
					scopes_supported: ['p1:read:user', 'p1:update:user'],
				},
				issuerUrl: 'https://auth.pingone.com/test-env-id-123/as',
				cached: false,
			};

			spyOnComprehensiveDiscovery().mockReturnValue({
				discover: vi.fn().mockResolvedValue(mockResult),
			});

			// First call
			const result1 = await workerTokenDiscoveryService.discover(config);
			expect(result1.success).toBe(true);
			expect(result1.cached).toBe(false);

			// Second call - should use cache
			const result2 = await workerTokenDiscoveryService.discover(config);
			expect(result2.success).toBe(true);
			expect(result2.cached).toBe(true);
		});

		it('should extract worker token scopes correctly', async () => {
			const config = {
				environmentId: 'test-env-id-123',
				region: 'us' as const,
			};

			const mockResult = {
				success: true,
				document: {
					issuer: 'https://auth.pingone.com/test-env-id-123/as',
					token_endpoint: 'https://auth.pingone.com/test-env-id-123/as/token',
					scopes_supported: [
						'openid',
						'profile',
						'email',
						'p1:read:user',
						'p1:update:user',
						'p1:read:device',
						'p1:update:device',
						'p1:read:application',
						'p1:update:application',
					],
				},
				issuerUrl: 'https://auth.pingone.com/test-env-id-123/as',
				cached: false,
			};

			spyOnComprehensiveDiscovery().mockReturnValue({
				discover: vi.fn().mockResolvedValue(mockResult),
			});

			const result = await workerTokenDiscoveryService.discover(config);

			expect(result.success).toBe(true);
			expect(result.scopes).toEqual([
				'p1:read:user',
				'p1:update:user',
				'p1:read:device',
				'p1:update:device',
				'p1:read:application',
				'p1:update:application',
			]);
		});

		it('should fallback to default scopes when no worker scopes found', async () => {
			const config = {
				environmentId: 'test-env-id-123',
				region: 'us' as const,
			};

			const mockResult = {
				success: true,
				document: {
					issuer: 'https://auth.pingone.com/test-env-id-123/as',
					token_endpoint: 'https://auth.pingone.com/test-env-id-123/as/token',
					scopes_supported: ['openid', 'profile', 'email'],
				},
				issuerUrl: 'https://auth.pingone.com/test-env-id-123/as',
				cached: false,
			};

			spyOnComprehensiveDiscovery().mockReturnValue({
				discover: vi.fn().mockResolvedValue(mockResult),
			});

			const result = await workerTokenDiscoveryService.discover(config);

			expect(result.success).toBe(true);
			expect(result.scopes).toEqual([
				'p1:read:user',
				'p1:update:user',
				'p1:read:device',
				'p1:update:device',
			]);
		});
	});

	describe('cache management', () => {
		it('should clear cache correctly', () => {
			workerTokenDiscoveryService.clearCache();
			const stats = workerTokenDiscoveryService.getCacheStats();
			expect(stats.size).toBe(0);
		});

		it('should provide cache statistics', () => {
			const stats = workerTokenDiscoveryService.getCacheStats();
			expect(stats).toHaveProperty('size');
			expect(stats).toHaveProperty('keys');
			expect(Array.isArray(stats.keys)).toBe(true);
		});
	});
});
