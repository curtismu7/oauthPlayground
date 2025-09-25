// src/utils/__tests__/jwksCache.test.ts - Tests for JWKS caching utilities
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  JWKSCache,
  LocalStorageJWKSCache,
  CacheEntry,
  JWKSCacheEntry,
  CacheConfig,
  CacheStats
} from '../jwksCache';
import { JWKS, JWK } from '../jwks';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('JWKSCache', () => {
  let cache: JWKSCache;
  const mockJWKS: JWKS = {
    keys: [
      {
        kty: 'RSA',
        kid: 'key1',
        use: 'sig',
        alg: 'RS256',
        n: 'test_modulus',
        e: 'AQAB'
      }
    ]
  };

  beforeEach(() => {
    cache = new JWKSCache({
      defaultTtl: 1000, // 1 second for testing
      maxSize: 2,
      cleanupInterval: 100 // 100ms for testing
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Operations', () => {
    it('should set and get cache entry', async () => {
      await cache.set('test-key', 'test-data');

      const result = await cache.get('test-key');

      expect(result).toBe('test-data');
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for expired entry', async () => {
      await cache.set('test-key', 'test-data', 10); // 10ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await cache.get('test-key');

      expect(result).toBeNull();
    });

    it('should invalidate cache entry', async () => {
      await cache.set('test-key', 'test-data');
      await cache.invalidate('test-key');

      const result = await cache.get('test-key');

      expect(result).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await cache.set('key1', 'data1');
      await cache.set('key2', 'data2');
      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
  });

  describe('JWKS-specific Operations', () => {
    it('should set and get JWKS cache entry', async () => {
      await cache.setJWKS('test-key', mockJWKS, 'https://auth.pingone.com/test/as/jwks');

      const result = await cache.getJWKS('test-key');

      expect(result).not.toBeNull();
      expect(result?.data).toEqual(mockJWKS);
      expect(result?.jwksUri).toBe('https://auth.pingone.com/test/as/jwks');
      expect(result?.keyStats?.totalKeys).toBe(1);
    });

    it('should include key statistics in JWKS cache entry', async () => {
      await cache.setJWKS('test-key', mockJWKS, 'https://auth.pingone.com/test/as/jwks');

      const result = await cache.getJWKS('test-key');

      expect(result?.keyStats).toEqual({
        totalKeys: 1,
        keyTypes: { RSA: 1 },
        algorithms: { RS256: 1 }
      });
    });
  });

  describe('Cache Size Management', () => {
    it('should evict oldest entry when max size reached', async () => {
      // Set max size to 2
      const smallCache = new JWKSCache({ maxSize: 2, defaultTtl: 10000 });
      
      await smallCache.set('key1', 'data1');
      await smallCache.set('key2', 'data2');
      await smallCache.set('key3', 'data3'); // This should evict key1

      expect(await smallCache.get('key1')).toBeNull();
      expect(await smallCache.get('key2')).toBe('data2');
      expect(await smallCache.get('key3')).toBe('data3');

      smallCache.destroy();
    });
  });

  describe('Cache Refresh', () => {
    it('should refresh cache entry with new data', async () => {
      const fetcher = vi.fn().mockResolvedValue('new-data');

      const result = await cache.refresh('test-key', fetcher);

      expect(fetcher).toHaveBeenCalled();
      expect(result).toBe('new-data');
      expect(await cache.get('test-key')).toBe('new-data');
    });

    it('should handle fetcher errors', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(cache.refresh('test-key', fetcher)).rejects.toThrow('Fetch failed');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', async () => {
      await cache.set('key1', 'data1');
      await cache.get('key1'); // Hit
      await cache.get('key2'); // Miss
      await cache.set('key2', 'data2');
      await cache.invalidate('key1');

      const stats = cache.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.sets).toBe(2);
      expect(stats.deletes).toBe(1);
      expect(stats.size).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should return cache size', () => {
      expect(cache.getSize()).toBe(0);

      cache.set('key1', 'data1');
      expect(cache.getSize()).toBe(1);
    });
  });

  describe('Cache Health', () => {
    it('should report healthy cache', () => {
      expect(cache.isHealthy()).toBe(true);
    });

    it('should report unhealthy cache with expired entries', async () => {
      await cache.set('test-key', 'test-data', 10); // 10ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(cache.isHealthy()).toBe(false);
    });
  });

  describe('Pattern Matching', () => {
    it('should get entries by pattern', async () => {
      await cache.set('jwks-env1', 'data1');
      await cache.set('jwks-env2', 'data2');
      await cache.set('other-key', 'data3');

      const jwksEntries = cache.getEntriesByPattern(/^jwks-/);

      expect(jwksEntries).toHaveLength(2);
      expect(jwksEntries.map(e => e.key)).toContain('jwks-env1');
      expect(jwksEntries.map(e => e.key)).toContain('jwks-env2');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired entries automatically', async () => {
      await cache.set('key1', 'data1', 10); // 10ms TTL
      await cache.set('key2', 'data2', 1000); // 1 second TTL

      // Wait for first entry to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBe('data2');
    });
  });
});

describe('LocalStorageJWKSCache', () => {
  let cache: LocalStorageJWKSCache;
  const mockJWKS: JWKS = {
    keys: [
      {
        kty: 'RSA',
        kid: 'key1',
        use: 'sig',
        alg: 'RS256',
        n: 'test_modulus',
        e: 'AQAB'
      }
    ]
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    cache = new LocalStorageJWKSCache('test_jwks_cache_', 1000); // 1 second TTL
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get cache entry', async () => {
      await cache.set('test-key', mockJWKS, 'https://auth.pingone.com/test/as/jwks');

      const result = await cache.get('test-key');

      expect(result).not.toBeNull();
      expect(result?.data).toEqual(mockJWKS);
      expect(result?.jwksUri).toBe('https://auth.pingone.com/test/as/jwks');
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for expired entry', async () => {
      await cache.set('test-key', mockJWKS, 'https://auth.pingone.com/test/as/jwks', 10); // 10ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await cache.get('test-key');

      expect(result).toBeNull();
    });

    it('should invalidate cache entry', async () => {
      await cache.set('test-key', mockJWKS, 'https://auth.pingone.com/test/as/jwks');
      await cache.invalidate('test-key');

      const result = await cache.get('test-key');

      expect(result).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await cache.set('key1', mockJWKS, 'https://auth.pingone.com/test/as/jwks');
      await cache.set('key2', mockJWKS, 'https://auth.pingone.com/test/as/jwks');
      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
  });

  describe('Key Statistics', () => {
    it('should include key statistics in cache entry', async () => {
      await cache.set('test-key', mockJWKS, 'https://auth.pingone.com/test/as/jwks');

      const result = await cache.get('test-key');

      expect(result?.keyStats).toEqual({
        totalKeys: 1,
        keyTypes: { RSA: 1 },
        algorithms: { RS256: 1 }
      });
    });
  });

  describe('Cache Size', () => {
    it('should return cache size', async () => {
      expect(cache.getSize()).toBe(0);

      await cache.set('key1', mockJWKS, 'https://auth.pingone.com/test/as/jwks');
      expect(cache.getSize()).toBe(1);

      await cache.set('key2', mockJWKS, 'https://auth.pingone.com/test/as/jwks');
      expect(cache.getSize()).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      await cache.set('test-key', mockJWKS, 'https://auth.pingone.com/test/as/jwks');

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage getItem errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should return null instead of throwing
      const result = await cache.get('test-key');
      expect(result).toBeNull();

      // Restore original method
      localStorage.getItem = originalGetItem;
    });
  });
});
