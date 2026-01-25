/**
 * JWKSCacheService Tests
 * 
 * Test coverage:
 * - JWKS fetching and caching
 * - TTL expiration
 * - Cache invalidation
 * - Key lookup by kid
 * - Error handling
 * - Multiple issuers
 */

import { JWKSCacheService, createJWKSCacheService, JWK } from '../jwksCacheService';
import { HttpClient } from '../httpClient';

jest.mock('../httpClient');

describe('JWKSCacheService', () => {
  const mockJwksUri = 'https://auth.example.com/.well-known/jwks.json';
  const mockKeys: JWK[] = [
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'key-1',
      alg: 'RS256',
      n: 'mock-modulus',
      e: 'AQAB',
    },
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'key-2',
      alg: 'RS256',
      n: 'mock-modulus-2',
      e: 'AQAB',
    },
  ];

  beforeEach(() => {
    JWKSCacheService.clearAll();
    jest.clearAllMocks();
  });

  describe('Fetching and caching', () => {
    it('should fetch and cache JWKS', async () => {
      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: { keys: mockKeys },
        status: 200,
        headers: new Headers(),
      });

      const keys = await JWKSCacheService.getKeys(mockJwksUri);

      expect(keys).toEqual(mockKeys);
      expect(HttpClient.get).toHaveBeenCalledWith(mockJwksUri);
    });

    it('should use cached keys on subsequent calls', async () => {
      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: { keys: mockKeys },
        status: 200,
        headers: new Headers(),
      });

      await JWKSCacheService.getKeys(mockJwksUri);
      const cachedKeys = await JWKSCacheService.getKeys(mockJwksUri);

      expect(cachedKeys).toEqual(mockKeys);
      expect(HttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('should cache keys for multiple issuers independently', async () => {
      const jwksUri1 = 'https://issuer1.com/jwks';
      const jwksUri2 = 'https://issuer2.com/jwks';
      const keys1: JWK[] = [{ kty: 'RSA', kid: 'key-1' }];
      const keys2: JWK[] = [{ kty: 'RSA', kid: 'key-2' }];

      (HttpClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { keys: keys1 }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: keys2 }, status: 200, headers: new Headers() });

      const result1 = await JWKSCacheService.getKeys(jwksUri1);
      const result2 = await JWKSCacheService.getKeys(jwksUri2);

      expect(result1).toEqual(keys1);
      expect(result2).toEqual(keys2);
      expect(HttpClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('TTL expiration', () => {
    it('should refetch keys after TTL expires', async () => {
      jest.useFakeTimers();

      (HttpClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() });

      await JWKSCacheService.getKeys(mockJwksUri);

      jest.advanceTimersByTime(3600001);

      await JWKSCacheService.getKeys(mockJwksUri);

      expect(HttpClient.get).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should not refetch keys before TTL expires', async () => {
      jest.useFakeTimers();

      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: { keys: mockKeys },
        status: 200,
        headers: new Headers(),
      });

      await JWKSCacheService.getKeys(mockJwksUri);

      jest.advanceTimersByTime(1800000);

      await JWKSCacheService.getKeys(mockJwksUri);

      expect(HttpClient.get).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache for specific issuer', async () => {
      (HttpClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() });

      await JWKSCacheService.getKeys(mockJwksUri);
      JWKSCacheService.invalidateCache(mockJwksUri);
      await JWKSCacheService.getKeys(mockJwksUri);

      expect(HttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should clear all cached keys', async () => {
      const jwksUri1 = 'https://issuer1.com/jwks';
      const jwksUri2 = 'https://issuer2.com/jwks';

      (HttpClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() });

      await JWKSCacheService.getKeys(jwksUri1);
      await JWKSCacheService.getKeys(jwksUri2);

      JWKSCacheService.clearAll();

      await JWKSCacheService.getKeys(jwksUri1);
      await JWKSCacheService.getKeys(jwksUri2);

      expect(HttpClient.get).toHaveBeenCalledTimes(4);
    });
  });

  describe('Key lookup by kid', () => {
    it('should find key by kid', async () => {
      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: { keys: mockKeys },
        status: 200,
        headers: new Headers(),
      });

      const key = await JWKSCacheService.getKeyById(mockJwksUri, 'key-1');

      expect(key).toEqual(mockKeys[0]);
    });

    it('should return null for non-existent kid', async () => {
      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: { keys: mockKeys },
        status: 200,
        headers: new Headers(),
      });

      const key = await JWKSCacheService.getKeyById(mockJwksUri, 'non-existent');

      expect(key).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      (HttpClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(JWKSCacheService.getKeys(mockJwksUri)).rejects.toThrow('Failed to fetch JWKS');
    });

    it('should handle invalid JWKS response', async () => {
      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: { invalid: 'response' },
        status: 200,
        headers: new Headers(),
      });

      await expect(JWKSCacheService.getKeys(mockJwksUri)).rejects.toThrow('Invalid JWKS response');
    });

    it('should handle missing keys array', async () => {
      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: {},
        status: 200,
        headers: new Headers(),
      });

      await expect(JWKSCacheService.getKeys(mockJwksUri)).rejects.toThrow('Invalid JWKS response');
    });
  });

  describe('Cache stats', () => {
    it('should provide cache statistics', async () => {
      (HttpClient.get as jest.Mock).mockResolvedValueOnce({
        data: { keys: mockKeys },
        status: 200,
        headers: new Headers(),
      });

      await JWKSCacheService.getKeys(mockJwksUri);

      const stats = JWKSCacheService.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].jwksUri).toBe(mockJwksUri);
      expect(stats.entries[0].keyCount).toBe(2);
      expect(stats.entries[0].age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multiple instances', () => {
    it('should support multiple service instances', async () => {
      const service1 = createJWKSCacheService();
      const service2 = createJWKSCacheService();

      (HttpClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: mockKeys }, status: 200, headers: new Headers() });

      const keys1 = await service1.getKeys(mockJwksUri);
      const keys2 = await service2.getKeys(mockJwksUri);

      expect(keys1).toEqual(mockKeys);
      expect(keys2).toEqual(mockKeys);
      expect(HttpClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Key rotation scenario', () => {
    it('should handle key rotation by invalidating cache', async () => {
      const oldKeys: JWK[] = [{ kty: 'RSA', kid: 'old-key' }];
      const newKeys: JWK[] = [{ kty: 'RSA', kid: 'new-key' }];

      (HttpClient.get as jest.Mock)
        .mockResolvedValueOnce({ data: { keys: oldKeys }, status: 200, headers: new Headers() })
        .mockResolvedValueOnce({ data: { keys: newKeys }, status: 200, headers: new Headers() });

      const keys1 = await JWKSCacheService.getKeys(mockJwksUri);
      expect(keys1).toEqual(oldKeys);

      JWKSCacheService.invalidateCache(mockJwksUri);

      const keys2 = await JWKSCacheService.getKeys(mockJwksUri);
      expect(keys2).toEqual(newKeys);
    });
  });
});
