/**
 * @file mfaCredentialManager.test.ts
 * @module v8/services/__tests__
 * @description Unit tests for MFA Credential Manager service
 * @version 8.0.0
 * @since 2026-01-29
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MFACredentials } from '../../flows/shared/MFATypes';
import { CredentialsService } from '../credentialsService';
import { EnvironmentIdService } from '../environmentIdService';
import { MFACredentialManager } from '../mfaCredentialManager';

// Mock services
vi.mock('../credentialsService', () => ({
	CredentialsService: {
		loadCredentials: vi.fn(),
		loadCredentialsWithBackup: vi.fn(),
		saveCredentials: vi.fn(),
		clearCredentials: vi.fn(),
	},
}));

vi.mock('../environmentIdService', () => ({
	EnvironmentIdService: {
		getEnvironmentId: vi.fn(),
		saveEnvironmentId: vi.fn(),
	},
}));

describe('MFACredentialManager', () => {
	const mockCredentials: MFACredentials = {
		environmentId: 'test-env-123',
		clientId: 'test-client-456',
		username: 'testuser@example.com',
		deviceType: 'SMS',
		countryCode: '+1',
		phoneNumber: '5551234567',
		email: 'test@example.com',
		deviceName: 'Test Device',
		tokenType: 'worker',
		region: 'na',
	};

	beforeEach(() => {
		localStorage.clear();
		MFACredentialManager.resetInstance();
		vi.clearAllMocks();

		// Setup default mock returns
		vi.mocked(CredentialsService.loadCredentials).mockReturnValue({
			environmentId: mockCredentials.environmentId,
			clientId: mockCredentials.clientId,
			username: mockCredentials.username,
			deviceType: mockCredentials.deviceType,
			countryCode: mockCredentials.countryCode,
			phoneNumber: mockCredentials.phoneNumber,
			email: mockCredentials.email,
			deviceName: mockCredentials.deviceName,
			tokenType: mockCredentials.tokenType,
			region: mockCredentials.region,
		} as any);

		vi.mocked(CredentialsService.loadCredentialsWithBackup).mockResolvedValue({
			environmentId: mockCredentials.environmentId,
			clientId: mockCredentials.clientId,
			username: mockCredentials.username,
			deviceType: mockCredentials.deviceType,
		} as any);

		vi.mocked(EnvironmentIdService.getEnvironmentId).mockReturnValue('global-env-id');
	});

	afterEach(() => {
		localStorage.clear();
		MFACredentialManager.resetInstance();
	});

	describe('Singleton behavior', () => {
		it('should return same instance on multiple getInstance calls', () => {
			const instance1 = MFACredentialManager.getInstance();
			const instance2 = MFACredentialManager.getInstance();

			expect(instance1).toBe(instance2);
		});

		it('should be resettable for testing', () => {
			const instance1 = MFACredentialManager.getInstance();
			MFACredentialManager.resetInstance();
			const instance2 = MFACredentialManager.getInstance();

			expect(instance1).not.toBe(instance2);
		});
	});

	describe('Credential management', () => {
		it('should load credentials from storage', () => {
			const manager = MFACredentialManager.getInstance();
			const loaded = manager.loadCredentials('mfa-flow-v8');

			expect(CredentialsService.loadCredentials).toHaveBeenCalledWith(
				'mfa-flow-v8',
				expect.any(Object)
			);
			expect(loaded.environmentId).toBe(mockCredentials.environmentId);
			expect(loaded.clientId).toBe(mockCredentials.clientId);
		});

		it('should save credentials to storage', () => {
			const manager = MFACredentialManager.getInstance();
			manager.saveCredentials('mfa-flow-v8', mockCredentials);

			expect(CredentialsService.saveCredentials).toHaveBeenCalledWith(
				'mfa-flow-v8',
				mockCredentials
			);
		});

		it('should clear credentials', () => {
			const manager = MFACredentialManager.getInstance();
			manager.clearCredentials('mfa-flow-v8');

			expect(CredentialsService.clearCredentials).toHaveBeenCalledWith('mfa-flow-v8');
		});

		it('should handle missing credentials gracefully', () => {
			vi.mocked(CredentialsService.loadCredentials).mockImplementation(() => {
				throw new Error('Storage error');
			});

			const manager = MFACredentialManager.getInstance();
			const loaded = manager.loadCredentials('mfa-flow-v8');

			// Should return defaults
			expect(loaded).toBeDefined();
			expect(loaded.deviceType).toBe('SMS');
			expect(loaded.tokenType).toBe('worker');
		});

		it('should load credentials with backup fallback', async () => {
			const manager = MFACredentialManager.getInstance();
			const loaded = await manager.loadCredentialsWithBackup('mfa-flow-v8');

			expect(CredentialsService.loadCredentialsWithBackup).toHaveBeenCalled();
			expect(loaded).toBeDefined();
		});

		it('should notify subscribers when credentials change', () => {
			const manager = MFACredentialManager.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);
			callback.mockClear(); // Clear initial call

			manager.saveCredentials('mfa-flow-v8', mockCredentials);

			expect(callback).toHaveBeenCalledWith(mockCredentials);
		});
	});

	describe('Subscription management', () => {
		it('should allow subscribing to credential updates', () => {
			const manager = MFACredentialManager.getInstance();
			const callback = vi.fn();

			manager.subscribe(callback);

			// Should be called immediately with current state (null initially)
			expect(callback).toHaveBeenCalledWith(null);
		});

		it('should allow unsubscribing', () => {
			const manager = MFACredentialManager.getInstance();
			const callback = vi.fn();

			const unsubscribe = manager.subscribe(callback);
			callback.mockClear();

			unsubscribe();

			manager.saveCredentials('mfa-flow-v8', mockCredentials);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should handle multiple subscribers', () => {
			const manager = MFACredentialManager.getInstance();
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			const callback3 = vi.fn();

			manager.subscribe(callback1);
			manager.subscribe(callback2);
			manager.subscribe(callback3);

			callback1.mockClear();
			callback2.mockClear();
			callback3.mockClear();

			manager.saveCredentials('mfa-flow-v8', mockCredentials);

			expect(callback1).toHaveBeenCalledWith(mockCredentials);
			expect(callback2).toHaveBeenCalledWith(mockCredentials);
			expect(callback3).toHaveBeenCalledWith(mockCredentials);
		});
	});

	describe('Validation', () => {
		it('should validate required fields', () => {
			const manager = MFACredentialManager.getInstance();

			const result = manager.validateCredentials({
				environmentId: '',
				clientId: '',
				username: '',
			});

			expect(result.valid).toBe(false);
			expect(result.errors).toHaveLength(3);
			expect(result.errors.some((e) => e.field === 'environmentId')).toBe(true);
			expect(result.errors.some((e) => e.field === 'clientId')).toBe(true);
			expect(result.errors.some((e) => e.field === 'username')).toBe(true);
		});

		it('should validate SMS device requires phone number', () => {
			const manager = MFACredentialManager.getInstance();

			const result = manager.validateCredentials({
				environmentId: 'test-env',
				clientId: 'test-client',
				username: 'testuser',
				deviceType: 'SMS',
				phoneNumber: '',
			});

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === 'phoneNumber')).toBe(true);
		});

		it('should validate EMAIL device requires email', () => {
			const manager = MFACredentialManager.getInstance();

			const result = manager.validateCredentials({
				environmentId: 'test-env',
				clientId: 'test-client',
				username: 'testuser',
				deviceType: 'EMAIL',
				email: '',
			});

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === 'email')).toBe(true);
		});

		it('should validate email format', () => {
			const manager = MFACredentialManager.getInstance();

			const result = manager.validateCredentials({
				environmentId: 'test-env',
				clientId: 'test-client',
				username: 'testuser',
				deviceType: 'EMAIL',
				email: 'invalid-email',
			});

			expect(result.warnings.some((w) => w.field === 'email')).toBe(true);
		});

		it('should pass validation for valid credentials', () => {
			const manager = MFACredentialManager.getInstance();

			const result = manager.validateCredentials(mockCredentials);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should validate WHATSAPP device requires phone number', () => {
			const manager = MFACredentialManager.getInstance();

			const result = manager.validateCredentials({
				environmentId: 'test-env',
				clientId: 'test-client',
				username: 'testuser',
				deviceType: 'WHATSAPP',
				phoneNumber: '',
			});

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.field === 'phoneNumber')).toBe(true);
		});
	});

	describe('Environment ID management', () => {
		it('should get environment ID from credentials', () => {
			const manager = MFACredentialManager.getInstance();
			manager.loadCredentials('mfa-flow-v8');

			const envId = manager.getEnvironmentId();

			expect(envId).toBe(mockCredentials.environmentId);
		});

		it('should fall back to global environment ID', () => {
			const manager = MFACredentialManager.getInstance();

			const envId = manager.getEnvironmentId();

			expect(envId).toBe('global-env-id');
			expect(EnvironmentIdService.getEnvironmentId).toHaveBeenCalled();
		});

		it('should set global environment ID', () => {
			const manager = MFACredentialManager.getInstance();
			manager.setEnvironmentId('new-env-id');

			expect(EnvironmentIdService.saveEnvironmentId).toHaveBeenCalledWith('new-env-id');
		});

		it('should update credentials when setting environment ID', () => {
			const manager = MFACredentialManager.getInstance();
			const callback = vi.fn();

			manager.loadCredentials('mfa-flow-v8');
			manager.subscribe(callback);
			callback.mockClear();

			manager.setEnvironmentId('new-env-id');

			expect(callback).toHaveBeenCalled();
			const creds = manager.getCredentials();
			expect(creds?.environmentId).toBe('new-env-id');
		});
	});

	describe('Credential comparison', () => {
		it('should detect credential changes', () => {
			const manager = MFACredentialManager.getInstance();
			manager.loadCredentials('mfa-flow-v8');

			const newCredentials = {
				...mockCredentials,
				username: 'different-user',
			};

			const changed = manager.hasCredentialsChanged(newCredentials);

			expect(changed).toBe(true);
		});

		it('should detect no changes when credentials are same', () => {
			const manager = MFACredentialManager.getInstance();
			manager.loadCredentials('mfa-flow-v8');

			const changed = manager.hasCredentialsChanged(mockCredentials);

			expect(changed).toBe(false);
		});

		it('should consider credentials changed when no previous credentials', () => {
			const manager = MFACredentialManager.getInstance();

			const changed = manager.hasCredentialsChanged(mockCredentials);

			expect(changed).toBe(true);
		});
	});

	describe('Import/Export', () => {
		it('should export credentials as JSON', () => {
			const json = MFACredentialManager.exportCredentials(mockCredentials);

			expect(json).toContain(mockCredentials.environmentId);
			expect(json).toContain(mockCredentials.username);
			expect(() => JSON.parse(json)).not.toThrow();
		});

		it('should import credentials from JSON', () => {
			const json = JSON.stringify(mockCredentials);
			const imported = MFACredentialManager.importCredentials(json);

			expect(imported.environmentId).toBe(mockCredentials.environmentId);
			expect(imported.username).toBe(mockCredentials.username);
		});

		it('should throw error for invalid JSON', () => {
			expect(() => {
				MFACredentialManager.importCredentials('invalid json');
			}).toThrow();
		});

		it('should throw error for incomplete credentials', () => {
			const incomplete = JSON.stringify({ environmentId: 'test' });

			expect(() => {
				MFACredentialManager.importCredentials(incomplete);
			}).toThrow();
		});
	});

	describe('Credential summary', () => {
		it('should generate human-readable summary', () => {
			const summary = MFACredentialManager.getCredentialsSummary(mockCredentials);

			expect(summary).toContain('Env:');
			expect(summary).toContain('User:');
			expect(summary).toContain('Device:');
			expect(summary).toContain('Token:');
		});

		it('should handle null credentials', () => {
			const summary = MFACredentialManager.getCredentialsSummary(null);

			expect(summary).toBe('No credentials');
		});
	});

	describe('Integration with CredentialsService', () => {
		it('should delegate to CredentialsService for loading', () => {
			const manager = MFACredentialManager.getInstance();
			manager.loadCredentials('mfa-flow-v8');

			expect(CredentialsService.loadCredentials).toHaveBeenCalled();
		});

		it('should delegate to CredentialsService for saving', () => {
			const manager = MFACredentialManager.getInstance();
			manager.saveCredentials('mfa-flow-v8', mockCredentials);

			expect(CredentialsService.saveCredentials).toHaveBeenCalled();
		});

		it('should delegate to CredentialsService for clearing', () => {
			const manager = MFACredentialManager.getInstance();
			manager.clearCredentials('mfa-flow-v8');

			expect(CredentialsService.clearCredentials).toHaveBeenCalled();
		});
	});
});
