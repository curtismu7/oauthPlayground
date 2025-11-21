/**
 * @file storageServiceV8.test.ts
 * @module v8/services/__tests__
 * @description Tests for StorageServiceV8
 * @version 8.0.0
 * @since 2024-11-16
 */

import { STORAGE_KEYS, StorageServiceV8 } from '../storageServiceV8';

describe('StorageServiceV8', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
	});

	afterEach(() => {
		// Clean up after each test
		localStorage.clear();
	});

	describe('save and load', () => {
		it('should save and load data', () => {
			const testData = { foo: 'bar', baz: 123 };
			StorageServiceV8.save('v8:test', testData, 1);

			const loaded = StorageServiceV8.load('v8:test');

			expect(loaded).toEqual(testData);
		});

		it('should save with version and flowKey', () => {
			const testData = { test: 'data' };
			StorageServiceV8.save('v8:test', testData, 2, 'authz-code');

			const serialized = localStorage.getItem('v8:test');
			expect(serialized).toBeTruthy();

			const parsed = JSON.parse(serialized!);
			expect(parsed.version).toBe(2);
			expect(parsed.flowKey).toBe('authz-code');
			expect(parsed.data).toEqual(testData);
		});

		it('should return null for non-existent key', () => {
			const loaded = StorageServiceV8.load('v8:nonexistent');
			expect(loaded).toBeNull();
		});

		it('should handle complex data structures', () => {
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

			StorageServiceV8.save('v8:complex', complexData, 1);
			const loaded = StorageServiceV8.load('v8:complex');

			expect(loaded).toEqual(complexData);
		});
	});

	describe('migrations', () => {
		it('should apply migrations when loading', () => {
			// Save data with version 1
			const oldData = { name: 'John' };
			StorageServiceV8.save('v8:test', oldData, 1);

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
			const loaded = StorageServiceV8.load('v8:test', migrations);

			expect(loaded).toEqual({
				fullName: 'John',
				name: undefined,
			});

			// Verify migrated data was saved
			const _reloaded = StorageServiceV8.load('v8:test');
			const serialized = localStorage.getItem('v8:test');
			const parsed = JSON.parse(serialized!);
			expect(parsed.version).toBe(2);
		});

		it('should apply multiple migrations in sequence', () => {
			// Save data with version 1
			StorageServiceV8.save('v8:test', { value: 1 }, 1);

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
			const loaded = StorageServiceV8.load('v8:test', migrations);

			// 1 * 2 = 2, then 2 + 10 = 12
			expect(loaded).toEqual({ value: 12 });
		});

		it('should skip migrations if data is already at target version', () => {
			// Save data with version 2
			StorageServiceV8.save('v8:test', { value: 100 }, 2);

			// Define migration from v1 to v2
			const migrations = [
				{
					fromVersion: 1,
					toVersion: 2,
					migrate: (data: any) => ({ value: data.value * 2 }),
				},
			];

			// Load with migration (should not apply)
			const loaded = StorageServiceV8.load('v8:test', migrations);

			expect(loaded).toEqual({ value: 100 });
		});
	});

	describe('clear', () => {
		it('should clear specific key', () => {
			StorageServiceV8.save('v8:test1', { data: 1 }, 1);
			StorageServiceV8.save('v8:test2', { data: 2 }, 1);

			StorageServiceV8.clear('v8:test1');

			expect(StorageServiceV8.load('v8:test1')).toBeNull();
			expect(StorageServiceV8.load('v8:test2')).toEqual({ data: 2 });
		});
	});

	describe('clearAll', () => {
		it('should clear all V8 data', () => {
			StorageServiceV8.save('v8:test1', { data: 1 }, 1);
			StorageServiceV8.save('v8:test2', { data: 2 }, 1);
			StorageServiceV8.save('v8:test3', { data: 3 }, 1);

			// Add non-V8 data
			localStorage.setItem('other:key', 'should not be cleared');

			StorageServiceV8.clearAll();

			expect(StorageServiceV8.load('v8:test1')).toBeNull();
			expect(StorageServiceV8.load('v8:test2')).toBeNull();
			expect(StorageServiceV8.load('v8:test3')).toBeNull();
			expect(localStorage.getItem('other:key')).toBe('should not be cleared');
		});
	});

	describe('getAllKeys', () => {
		it('should return all V8 keys', () => {
			StorageServiceV8.save('v8:test1', { data: 1 }, 1);
			StorageServiceV8.save('v8:test2', { data: 2 }, 1);
			localStorage.setItem('other:key', 'not v8');

			const keys = StorageServiceV8.getAllKeys();

			expect(keys).toHaveLength(2);
			expect(keys).toContain('v8:test1');
			expect(keys).toContain('v8:test2');
			expect(keys).not.toContain('other:key');
		});
	});

	describe('export and import', () => {
		it('should export all V8 data', () => {
			StorageServiceV8.save('v8:test1', { data: 1 }, 1);
			StorageServiceV8.save('v8:test2', { data: 2 }, 1);

			const exported = StorageServiceV8.exportAll();
			const parsed = JSON.parse(exported);

			expect(parsed.version).toBe(1);
			expect(parsed.exportedAt).toBeTruthy();
			expect(parsed.data['v8:test1']).toBeTruthy();
			expect(parsed.data['v8:test2']).toBeTruthy();
		});

		it('should import data', () => {
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

			StorageServiceV8.importAll(JSON.stringify(exportData), true);

			const loaded = StorageServiceV8.load('v8:test1');
			expect(loaded).toEqual({ foo: 'bar' });
		});

		it('should not overwrite existing data when overwrite is false', () => {
			StorageServiceV8.save('v8:test1', { original: true }, 1);

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

			StorageServiceV8.importAll(JSON.stringify(exportData), false);

			const loaded = StorageServiceV8.load('v8:test1');
			expect(loaded).toEqual({ original: true });
		});

		it('should overwrite existing data when overwrite is true', () => {
			StorageServiceV8.save('v8:test1', { original: true }, 1);

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

			StorageServiceV8.importAll(JSON.stringify(exportData), true);

			const loaded = StorageServiceV8.load('v8:test1');
			expect(loaded).toEqual({ imported: true });
		});
	});

	describe('getSize', () => {
		it('should calculate storage size', () => {
			StorageServiceV8.save('v8:test', { data: 'test' }, 1);

			const size = StorageServiceV8.getSize();

			expect(size).toBeGreaterThan(0);
		});

		it('should return 0 for empty storage', () => {
			const size = StorageServiceV8.getSize();
			expect(size).toBe(0);
		});
	});

	describe('isAvailable', () => {
		it('should return true when localStorage is available', () => {
			expect(StorageServiceV8.isAvailable()).toBe(true);
		});
	});

	describe('has', () => {
		it('should return true for existing key', () => {
			StorageServiceV8.save('v8:test', { data: 'test' }, 1);
			expect(StorageServiceV8.has('v8:test')).toBe(true);
		});

		it('should return false for non-existing key', () => {
			expect(StorageServiceV8.has('v8:nonexistent')).toBe(false);
		});
	});

	describe('getAge', () => {
		it('should return age of data', () => {
			StorageServiceV8.save('v8:test', { data: 'test' }, 1);

			const age = StorageServiceV8.getAge('v8:test');

			expect(age).toBeGreaterThanOrEqual(0);
			expect(age).toBeLessThan(1000); // Should be less than 1 second
		});

		it('should return null for non-existing key', () => {
			const age = StorageServiceV8.getAge('v8:nonexistent');
			expect(age).toBeNull();
		});
	});

	describe('isExpired', () => {
		it('should return false for fresh data', () => {
			StorageServiceV8.save('v8:test', { data: 'test' }, 1);

			const expired = StorageServiceV8.isExpired('v8:test', 10000); // 10 seconds

			expect(expired).toBe(false);
		});

		it('should return true for expired data', () => {
			// Save data with old timestamp
			const oldData = {
				version: 1,
				data: { test: 'data' },
				timestamp: Date.now() - 20000, // 20 seconds ago
			};
			localStorage.setItem('v8:test', JSON.stringify(oldData));

			const expired = StorageServiceV8.isExpired('v8:test', 10000); // 10 seconds max age

			expect(expired).toBe(true);
		});

		it('should return true for non-existing key', () => {
			const expired = StorageServiceV8.isExpired('v8:nonexistent', 10000);
			expect(expired).toBe(true);
		});
	});

	describe('cleanupExpired', () => {
		it('should remove expired data', () => {
			// Save fresh data
			StorageServiceV8.save('v8:fresh', { data: 'fresh' }, 1);

			// Save expired data
			const expiredData = {
				version: 1,
				data: { test: 'expired' },
				timestamp: Date.now() - 20000, // 20 seconds ago
			};
			localStorage.setItem('v8:expired', JSON.stringify(expiredData));

			const cleaned = StorageServiceV8.cleanupExpired(10000); // 10 seconds max age

			expect(cleaned).toBe(1);
			expect(StorageServiceV8.has('v8:fresh')).toBe(true);
			expect(StorageServiceV8.has('v8:expired')).toBe(false);
		});
	});

	describe('flow data management', () => {
		it('should get data for specific flow', () => {
			StorageServiceV8.save('v8:test1', { data: 1 }, 1, 'authz-code');
			StorageServiceV8.save('v8:test2', { data: 2 }, 1, 'authz-code');
			StorageServiceV8.save('v8:test3', { data: 3 }, 1, 'implicit');

			const flowData = StorageServiceV8.getFlowData('authz-code');

			expect(flowData).toHaveLength(2);
			expect(flowData.every((item) => item.data.flowKey === 'authz-code')).toBe(true);
		});

		it('should clear data for specific flow', () => {
			StorageServiceV8.save('v8:test1', { data: 1 }, 1, 'authz-code');
			StorageServiceV8.save('v8:test2', { data: 2 }, 1, 'authz-code');
			StorageServiceV8.save('v8:test3', { data: 3 }, 1, 'implicit');

			const cleared = StorageServiceV8.clearFlowData('authz-code');

			expect(cleared).toBe(2);
			expect(StorageServiceV8.has('v8:test1')).toBe(false);
			expect(StorageServiceV8.has('v8:test2')).toBe(false);
			expect(StorageServiceV8.has('v8:test3')).toBe(true);
		});
	});

	describe('STORAGE_KEYS', () => {
		it('should have all required keys', () => {
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
		it('should handle invalid JSON gracefully', () => {
			localStorage.setItem('v8:invalid', 'not valid json');

			const loaded = StorageServiceV8.load('v8:invalid');

			expect(loaded).toBeNull();
		});

		it('should handle import of invalid data', () => {
			expect(() => {
				StorageServiceV8.importAll('invalid json', true);
			}).toThrow();
		});

		it('should handle import of data without version', () => {
			const invalidExport = JSON.stringify({
				data: { 'v8:test': { data: 'test' } },
			});

			expect(() => {
				StorageServiceV8.importAll(invalidExport, true);
			}).toThrow();
		});
	});
});
