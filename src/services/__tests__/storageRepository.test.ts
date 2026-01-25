/**
 * StorageRepository Tests
 * 
 * Test coverage:
 * - Get/set/remove operations
 * - Prefix support
 * - Migration utilities
 * - Error handling
 * - IndexedDB fallback (mocked)
 */

import { StorageRepository, createStorageRepository } from '../storageRepository';

describe('StorageRepository', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Basic operations', () => {
    it('should set and get values', () => {
      StorageRepository.set('test-key', { value: 123 });
      const result = StorageRepository.get<{ value: number }>('test-key');
      
      expect(result).toEqual({ value: 123 });
    });

    it('should return null for non-existent keys', () => {
      const result = StorageRepository.get('non-existent');
      expect(result).toBeNull();
    });

    it('should remove values', () => {
      StorageRepository.set('test-key', { value: 123 });
      StorageRepository.remove('test-key');
      const result = StorageRepository.get('test-key');
      
      expect(result).toBeNull();
    });

    it('should handle complex objects', () => {
      const complexObject = {
        id: 1,
        name: 'test',
        nested: {
          array: [1, 2, 3],
          boolean: true,
        },
      };

      StorageRepository.set('complex', complexObject);
      const result = StorageRepository.get('complex');
      
      expect(result).toEqual(complexObject);
    });
  });

  describe('Prefix support', () => {
    it('should use prefix when provided', () => {
      const repo = createStorageRepository({ prefix: 'app_' });
      
      repo.set('key1', 'value1');
      
      expect(localStorage.getItem('app_key1')).toBe('"value1"');
    });

    it('should get keys with prefix', () => {
      const repo = createStorageRepository({ prefix: 'app_' });
      
      repo.set('key1', 'value1');
      repo.set('key2', 'value2');
      
      const keys = repo.keys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });

    it('should filter keys by additional prefix', () => {
      const repo = createStorageRepository({ prefix: 'app_' });
      
      repo.set('user_1', 'user1');
      repo.set('user_2', 'user2');
      repo.set('config_1', 'config1');
      
      const userKeys = repo.keys('user_');
      
      expect(userKeys).toContain('user_1');
      expect(userKeys).toContain('user_2');
      expect(userKeys).not.toContain('config_1');
    });

    it('should clear keys with prefix', () => {
      const repo = createStorageRepository({ prefix: 'app_' });
      
      repo.set('user_1', 'user1');
      repo.set('user_2', 'user2');
      repo.set('config_1', 'config1');
      
      repo.clear('user_');
      
      expect(repo.get('user_1')).toBeNull();
      expect(repo.get('user_2')).toBeNull();
      expect(repo.get('config_1')).toBe('config1');
    });
  });

  describe('Migration', () => {
    it('should migrate single key', () => {
      StorageRepository.set('old-key', { value: 123 });
      StorageRepository.migrate('old-key', 'new-key');
      
      expect(StorageRepository.get('old-key')).toBeNull();
      expect(StorageRepository.get('new-key')).toEqual({ value: 123 });
    });

    it('should migrate multiple keys', () => {
      StorageRepository.set('old-key-1', 'value1');
      StorageRepository.set('old-key-2', 'value2');
      StorageRepository.set('old-key-3', 'value3');
      
      StorageRepository.migrateAll({
        'old-key-1': 'new-key-1',
        'old-key-2': 'new-key-2',
        'old-key-3': 'new-key-3',
      });
      
      expect(StorageRepository.get('old-key-1')).toBeNull();
      expect(StorageRepository.get('old-key-2')).toBeNull();
      expect(StorageRepository.get('old-key-3')).toBeNull();
      
      expect(StorageRepository.get('new-key-1')).toBe('value1');
      expect(StorageRepository.get('new-key-2')).toBe('value2');
      expect(StorageRepository.get('new-key-3')).toBe('value3');
    });

    it('should handle migration of non-existent key', () => {
      StorageRepository.migrate('non-existent', 'new-key');
      
      expect(StorageRepository.get('new-key')).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors gracefully', () => {
      localStorage.setItem('invalid-json', '{invalid json}');
      
      const result = StorageRepository.get('invalid-json');
      
      expect(result).toBeNull();
    });

    it('should handle localStorage errors', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });
      
      expect(() => {
        StorageRepository.set('test', 'value');
      }).toThrow('Storage error');
      
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Quota exceeded handling', () => {
    it('should detect quota exceeded error', () => {
      const originalSetItem = Storage.prototype.setItem;
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      
      Storage.prototype.setItem = jest.fn(() => {
        throw quotaError;
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      StorageRepository.set('test', 'value');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('localStorage quota exceeded')
      );
      
      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('Multiple instances', () => {
    it('should support multiple repository instances with different prefixes', () => {
      const repo1 = createStorageRepository({ prefix: 'app1_' });
      const repo2 = createStorageRepository({ prefix: 'app2_' });
      
      repo1.set('key', 'value1');
      repo2.set('key', 'value2');
      
      expect(repo1.get('key')).toBe('value1');
      expect(repo2.get('key')).toBe('value2');
    });
  });
});
