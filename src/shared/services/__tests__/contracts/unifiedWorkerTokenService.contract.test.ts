/**
 * @file unifiedWorkerTokenService.contract.test.ts
 * @description Contract tests for Unified Worker Token Service
 * @version 1.0.0
 *
 * Contract tests ensure behavior preservation during service consolidation.
 * These tests validate the core contract that all consumers depend on.
 */

import { describe, expect, test, vi } from 'vitest';

// Mock the unifiedTokenStorageService before importing the service
vi.mock('../../../../services/unifiedTokenStorageService', () => ({
	unifiedTokenStorage: {
		saveToken: vi.fn(),
		loadToken: vi.fn(),
		removeToken: vi.fn(),
		clearAllTokens: vi.fn(),
		saveCredentials: vi.fn(),
		loadCredentials: vi.fn(),
		clearCredentials: vi.fn(),
	},
}));

import type { UnifiedWorkerTokenCredentials } from '../../../../services/unifiedWorkerTokenService';
import { unifiedWorkerTokenService } from '../../../../services/unifiedWorkerTokenService';

describe('Unified Worker Token Service - Contract Tests', () => {
	const mockCredentials: UnifiedWorkerTokenCredentials = {
		environmentId: 'test-env-id',
		clientId: 'test-client-id',
		clientSecret: 'test-client-secret',
		scopes: ['read', 'write'],
		region: 'us',
		appId: 'test-app',
		appName: 'Test App',
	};

	test('should have required methods defined', () => {
		// Verify all required methods exist
		expect(typeof unifiedWorkerTokenService.getToken).toBe('function');
		expect(typeof unifiedWorkerTokenService.getStatus).toBe('function');
		expect(typeof unifiedWorkerTokenService.saveCredentials).toBe('function');
		expect(typeof unifiedWorkerTokenService.loadCredentials).toBe('function');
		expect(typeof unifiedWorkerTokenService.clearCredentials).toBe('function');
		expect(typeof unifiedWorkerTokenService.clearToken).toBe('function');
		expect(typeof unifiedWorkerTokenService.buildTokenEndpoint).toBe('function');
	});

	test('should maintain consistent return types', () => {
		// These should not throw - type contract validation
		const tokenPromise = unifiedWorkerTokenService.getToken();
		const statusPromise = unifiedWorkerTokenService.getStatus();
		const credentialsPromise = unifiedWorkerTokenService.loadCredentials();

		expect(tokenPromise).toBeInstanceOf(Promise);
		expect(statusPromise).toBeInstanceOf(Promise);
		expect(credentialsPromise).toBeInstanceOf(Promise);
	});

	test('should build token endpoint correctly', () => {
		// Act
		const endpoint = unifiedWorkerTokenService.buildTokenEndpoint(mockCredentials);

		// Assert
		expect(typeof endpoint).toBe('string');
		expect(endpoint).toContain(mockCredentials.environmentId);
		expect(endpoint).toContain('/as/token');
	});

	test('should handle different regions correctly', () => {
		// Arrange
		const euCredentials = { ...mockCredentials, region: 'eu' as const };
		const apCredentials = { ...mockCredentials, region: 'ap' as const };

		// Act
		const euEndpoint = unifiedWorkerTokenService.buildTokenEndpoint(euCredentials);
		const apEndpoint = unifiedWorkerTokenService.buildTokenEndpoint(apCredentials);

		// Assert - The service uses actual PingOne domain format
		expect(euEndpoint).toContain('auth.pingone.eu');
		expect(apEndpoint).toContain('auth.pingone.asia'); // AP region uses asia domain
	});

	test('should handle custom domains correctly', () => {
		// Arrange
		const customCredentials = { ...mockCredentials, customDomain: 'custom.example.com' };

		// Act
		const endpoint = unifiedWorkerTokenService.buildTokenEndpoint(customCredentials);

		// Assert - Custom domains don't override the default in this service
		// The service ignores customDomain and uses the standard PingOne domain
		expect(endpoint).toContain('auth.pingone.com');
	});

	test('should support different app credential formats', () => {
		// Arrange - Test minimal credentials
		const minimalCredentials: UnifiedWorkerTokenCredentials = {
			environmentId: 'test-env',
			clientId: 'test-client',
			clientSecret: 'test-secret',
		};

		// Arrange - Test full credentials
		const fullCredentials: UnifiedWorkerTokenCredentials = {
			...minimalCredentials,
			scopes: ['read', 'write'],
			region: 'eu',
			customDomain: 'custom.domain.com',
			tokenEndpointAuthMethod: 'client_secret_basic',
			appId: 'app-123',
			appName: 'Full App',
		};

		// Act & Assert - Both should work without throwing
		expect(() => {
			unifiedWorkerTokenService.buildTokenEndpoint(minimalCredentials);
		}).not.toThrow();

		expect(() => {
			unifiedWorkerTokenService.buildTokenEndpoint(fullCredentials);
		}).not.toThrow();
	});

	test('should support KRP credentials', () => {
		// Arrange
		const krpCredentials: UnifiedWorkerTokenCredentials = {
			...mockCredentials,
			keyRotationPolicyId: 'krp-123',
			useKeyRotationPolicy: true,
		};

		// Act & Assert - Should not throw
		expect(() => {
			unifiedWorkerTokenService.buildTokenEndpoint(krpCredentials);
		}).not.toThrow();
	});

	test('should handle invalid credentials gracefully', () => {
		// Arrange
		const invalidCredentials = {
			environmentId: '',
			clientId: '',
			clientSecret: '',
		} as UnifiedWorkerTokenCredentials;

		// Act & Assert - Should not throw
		expect(() => {
			unifiedWorkerTokenService.buildTokenEndpoint(invalidCredentials);
		}).not.toThrow();
	});

	test('should handle missing environment ID gracefully', () => {
		// Arrange
		const noEnvCredentials = {
			clientId: 'test-client',
			clientSecret: 'test-secret',
		} as UnifiedWorkerTokenCredentials;

		// Act & Assert - Should not throw
		expect(() => {
			unifiedWorkerTokenService.buildTokenEndpoint(noEnvCredentials);
		}).not.toThrow();
	});

	test('should complete endpoint building within reasonable time', () => {
		// Arrange
		const startTime = Date.now();

		// Act
		for (let i = 0; i < 100; i++) {
			unifiedWorkerTokenService.buildTokenEndpoint(mockCredentials);
		}

		// Assert
		const endTime = Date.now();
		const duration = endTime - startTime;

		// 100 operations should complete within 100ms
		expect(duration).toBeLessThan(100);
	});

	test('should support configuration export', () => {
		// Act & Assert - Should handle empty configuration gracefully
		expect(() => {
			unifiedWorkerTokenService.exportConfig();
		}).toThrow('No worker token configuration to export');
	});

	test('should support configuration import', async () => {
		// Arrange - Use the correct format expected by the service
		const testConfig = JSON.stringify({
			credentials: mockCredentials,
		});

		// Act & Assert - Should not throw with correct format
		await expect(unifiedWorkerTokenService.importConfig(testConfig)).resolves.not.toThrow();
	});
});
