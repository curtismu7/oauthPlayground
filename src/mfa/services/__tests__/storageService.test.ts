/**
 * @file storageService.test.ts
 * @module v8/services/__tests__
 * @description Tests for StorageService
 * @version 8.0.0
 * @since 2024-11-16
 */

import { STORAGE_KEYS, StorageService } from '../storageService';

describe('StorageService', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	afterEach(() => {
		// Clean up after each test
		localStorage.clear();
	});

	describe('save and load', () => {
		it('should save and load data', async () => {
			const testData = { foo: 'bar', baz: 123 };
			await StorageService.save('v8:test', testData, 1);

			const loaded = await StorageService.load('v8:test');

			expect(loaded).toEqual(testData);
		});

		it('should save with version and flowKey', async () => {
			const testData = { test: 'data' };
			await StorageService.save('v8:test', testData, 2, 'authz-code');

			const serialized = localStorage.getItem('v8:test');
			expect(serialized).toBeTruthy();

			const parsed = JSON.parse(serialized!);
			expect(parsed.version).toBe(2);
			expect(parsed.flowKey).toBe('authz-code');
			expect(parsed.data).toEqual(testData);
		});

		it('should return null for non-existent key', async () => {
			const loaded = await StorageService.load('v8:nonexistent');
			expect(loaded).toBeNull();
		});

		it('should handle complex data structures', async () => {
			const complexData = {
				credentials: {
					environmentId: '12345678-1234-1234-1234-123456789012',
					clientId: 'test-client',
					scopes: ['openid', 'profile', 'email'],
				},
				tokens: {
					access_token: 'abc123',
					id_token: 'def456',
				},
			};

			await StorageService.save('v8:complex', complexData, 1);
			const loaded = await StorageService.load('v8:complex');

			expect(loaded).toEqual(complexData);
		});
	});

	describe('migrations', () => {
		it('should apply migrations when loading', async () => {
			// Save data with version 1
			const oldData = { name: 'John' };
			await StorageService.save('v8:test', oldData, 1);

			// Define migration from v1 to v2
			const migrations = [
				{
					fromVersion: 1,
					toVersion: 2,
					migrate: (data: any) => ({
						...data,
						fullName: data.name,
						name: undefined,
					}),
				},
			];

			// Load with migration
			const loaded = await StorageService.load('v8:test', migrations);

			expect(loaded).toEqual({
				fullName: 'John',
				name: undefined,
			});

			// Verify migrated data was saved
			const _reloaded = await StorageService.load('v8:test');
			const serialized = localStorage.getItem('v8:test');
			const parsed = JSON.parse(serialized!);
			expect(parsed.version).toBe(2);
		});

		it('should apply multiple migrations in sequence', async () => {
			// Save data with version 1
			await StorageService.save('v8:test', { value: 1 }, 1);

			// Define migrations v1 -> v2 -> v3
			const migrations = [
				{
					fromVersion: 1,
					toVersion: 2,
					migrate: (data: any) => ({ value: data.value * 2 }),
				},
				{
					fromVersion: 2,
					toVersion: 3,
					migrate: (data: any) => ({ value: data.value + 10 }),
				},
			];

			// Load with migrations
			const loaded = await StorageService.load('v8:test', migrations);

			// 1 * 2 = 2, then 2 + 10 = 12
			expect(loaded).toEqual({ value: 12 });
		});

		it('should skip migrations if data is already at target version', async () => {
			// Save data with version 2
			await StorageService.save('v8:test', { value: 100 }, 2);

			// Define migration from v1 to v2
			const migrations = [
				{
					fromVersion: 1,
					toVersion: 2,
					migrate: (data: any) => ({ value: data.value * 2 }),
				},
			];

			// Load with migration (should not apply)
			const loaded = await StorageService.load('v8:test', migrations);

			expect(loaded).toEqual({ value: 100 });
		});
	});

	describe('clear', () => {
		it('should clear specific key', async () => {
			await StorageService.save('v8:test1', { data: 1 }, 1);
			await StorageService.save('v8:test2', { data: 2 }, 1);

			await StorageService.clear('v8:test1');

			expect(await StorageService.load('v8:test1')).toBeNull();
			expect(await StorageService.load('v8:test2')).toEqual({ data: 2 });
		});
	});

	describe('clearAll', () => {
		it('should clear all V8 data', async () => {
			await StorageService.save('v8:test1', { data: 1 }, 1);
			await StorageService.save('v8:test2', { data: 2 }, 1);
			await StorageService.save('v8:test3', { data: 3 }, 1);

			// Add non-V8 data
			localStorage.setItem('other:key', 'should not be cleared');

			await StorageService.clearAll();

			expect(await StorageService.load('v8:test1')).toBeNull();
			expect(await StorageService.load('v8:test2')).toBeNull();
			expect(await StorageService.load('v8:test3')).toBeNull();
			expect(localStorage.getItem('other:key')).toBe('should not be cleared');
		});
	});

	describe('getAllKeys', () => {
		it('should return all V8 keys', async () => {
			await StorageService.save('v8:test1', { data: 1 }, 1);
			await StorageService.save('v8:test2', { data: 2 }, 1);
			localStorage.setItem('other:key', 'not v8');

			const keys = await StorageService.getAllKeys();

			expect(keys).toHaveLength(2);
			expect(keys).toContain('v8:test1');
			expect(keys).toContain('v8:test2');
			expect(keys).not.toContain('other:key');
		});
	});

	describe('export and import', () => {
		it('should export all V8 data', async () => {
			await StorageService.save('v8:test1', { data: 1 }, 1);
			await StorageService.save('v8:test2', { data: 2 }, 1);

			const exported = await StorageService.exportAll();
			const parsed = JSON.parse(exported);

			expect(parsed.version).toBe(1);
			expect(parsed.exportedAt).toBeTruthy();
			expect(parsed.data['v8:test1']).toBeTruthy();
			expect(parsed.data['v8:test2']).toBeTruthy();
		});

		it('should import data', async () => {
			const exportData = {
				version: 1,
				exportedAt: new Date().toISOString(),
				data: {
					'v8:test1': {
						version: 1,
						data: { foo: 'bar' },
						timestamp: Date.now(),
					},
				},
			};

			await StorageService.importAll(JSON.stringify(exportData), true);

			const loaded = await StorageService.load('v8:test1');
			expect(loaded).toEqual({ foo: 'bar' });
		});

		it('should not overwrite existing data when overwrite is false', async () => {
			await StorageService.save('v8:test1', { original: true }, 1);

			const exportData = {
				version: 1,
				exportedAt: new Date().toISOString(),
				data: {
					'v8:test1': {
						version: 1,
						data: { imported: true },
						timestamp: Date.now(),
					},
				},
			};

			await StorageService.importAll(JSON.stringify(exportData), false);

			const loaded = await StorageService.load('v8:test1');
			expect(loaded).toEqual({ original: true });
		});

		it('should overwrite existing data when overwrite is true', async () => {
			await StorageService.save('v8:test1', { original: true }, 1);

			const exportData = {
				version: 1,
				exportedAt: new Date().toISOString(),
				data: {
					'v8:test1': {
						version: 1,
						data: { imported: true },
						timestamp: Date.now(),
					},
				},
			};

			await StorageService.importAll(JSON.stringify(exportData), true);

			const loaded = await StorageService.load('v8:test1');
			expect(loaded).toEqual({ imported: true });
		});
	});

	describe('getSize', () => {
		it('should calculate storage size', async () => {
			await StorageService.save('v8:test', { data: 'test' }, 1);

			const size = await StorageService.getSize();

			expect(size).toBeGreaterThan(0);
		});

		it('should return 0 for empty storage', async () => {
			const size = await StorageService.getSize();
			expect(size).toBe(0);
		});
	});

	describe('isAvailable', () => {
		it('should return true when localStorage is available', async () => {
			expect(await StorageService.isAvailable()).toBe(true);
		});
	});

	describe('has', () => {
		it('should return true for existing key', async () => {
			await StorageService.save('v8:test', { data: 'test' }, 1);
			expect(await StorageService.has('v8:test')).toBe(true);
		});

		it('should return false for non-existing key', async () => {
			expect(await StorageService.has('v8:nonexistent')).toBe(false);
		});
	});

	describe('getAge', () => {
		it('should return age of data', async () => {
			await StorageService.save('v8:test', { data: 'test' }, 1);

			const age = await StorageService.getAge('v8:test');

			expect(age).toBeGreaterThanOrEqual(0);
			expect(age).toBeLessThan(1000); // Should be less than 1 second
		});

		it('should return null for non-existing key', async () => {
			const age = await StorageService.getAge('v8:nonexistent');
			expect(age).toBeNull();
		});
	});

	describe('isExpired', () => {
		it('should return false for fresh data', async () => {
			await StorageService.save('v8:test', { data: 'test' }, 1);

			const expired = await StorageService.isExpired('v8:test', 10000); // 10 seconds

			expect(expired).toBe(false);
		});

		it('should return true for expired data', async () => {
			// Save data with old timestamp
			const oldData = {
				version: 1,
				data: { test: 'data' },
				timestamp: Date.now() - 20000, // 20 seconds ago
			};
			localStorage.setItem('v8:test', JSON.stringify(oldData));

			const expired = await StorageService.isExpired('v8:test', 10000); // 10 seconds max age

			expect(expired).toBe(true);
		});

		it('should return true for non-existing key', async () => {
			const expired = await StorageService.isExpired('v8:nonexistent', 10000);
			expect(expired).toBe(true);
		});
	});

	describe('cleanupExpired', () => {
		it('should remove expired data', async () => {
			// Save fresh data
			await StorageService.save('v8:fresh', { data: 'fresh' }, 1);

			// Save expired data
			const expiredData = {
				version: 1,
				data: { test: 'expired' },
				timestamp: Date.now() - 20000, // 20 seconds ago
			};
			localStorage.setItem('v8:expired', JSON.stringify(expiredData));

			const cleaned = await StorageService.cleanupExpired(10000); // 10 seconds max age

			expect(cleaned).toBe(1);
			expect(await StorageService.has('v8:fresh')).toBe(true);
			expect(await StorageService.has('v8:expired')).toBe(false);
		});
	});

	describe('flow data management', () => {
		it('should get data for specific flow', async () => {
			await StorageService.save('v8:test1', { data: 1 }, 1, 'authz-code');
			await StorageService.save('v8:test2', { data: 2 }, 1, 'authz-code');
			await StorageService.save('v8:test3', { data: 3 }, 1, 'implicit');

			const flowData = await StorageService.getFlowData('authz-code');

			expect(flowData).toHaveLength(2);
			expect(flowData.every((item) => item.data.flowKey === 'authz-code')).toBe(true);
		});

		it('should clear data for specific flow', async () => {
			await StorageService.save('v8:test1', { data: 1 }, 1, 'authz-code');
			await StorageService.save('v8:test2', { data: 2 }, 1, 'authz-code');
			await StorageService.save('v8:test3', { data: 3 }, 1, 'implicit');

			const cleared = await StorageService.clearFlowData('authz-code');

			expect(cleared).toBe(2);
			expect(await StorageService.has('v8:test1')).toBe(false);
			expect(await StorageService.has('v8:test2')).toBe(false);
			expect(await StorageService.has('v8:test3')).toBe(true);
		});
	});

	describe('STORAGE_KEYS', () => {
		it('should have all required keys', async () => {
			expect(STORAGE_KEYS.PREFIX).toBe('v8');
			expect(STORAGE_KEYS.AUTHZ_CODE).toBe('v8:authz-code');
			expect(STORAGE_KEYS.IMPLICIT).toBe('v8:implicit');
			expect(STORAGE_KEYS.CREDENTIALS).toBe('v8:credentials');
			expect(STORAGE_KEYS.DISCOVERY).toBe('v8:discovery');
			expect(STORAGE_KEYS.TOKENS).toBe('v8:tokens');
			expect(STORAGE_KEYS.PREFERENCES).toBe('v8:preferences');
			expect(STORAGE_KEYS.STEP_PROGRESS).toBe('v8:step-progress');
		});
	});

	describe('error handling', () => {
		it('should handle invalid JSON gracefully', async () => {
			localStorage.setItem('v8:invalid', 'not valid json');

			const loaded = await StorageService.load('v8:invalid');

			expect(loaded).toBeNull();
		});

		it('should handle import of invalid data', async () => {
			await expect(StorageService.importAll('invalid json', true)).rejects.toThrow();
		});

		it('should handle import of data without version', async () => {
			const invalidExport = JSON.stringify({
				data: { 'v8:test': { data: 'test' } },
			});

			await expect(StorageService.importAll(invalidExport, true)).rejects.toThrow();
		});
	});
});
