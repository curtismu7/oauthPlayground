/**
 * JWKSCacheService - Cache JWKS for ID token signature verification
 * 
 * Features:
 * - Cache with TTL (1 hour default)
 * - Automatic refresh on key rotation
 * - Error handling for network failures
 * - Support for multiple issuers
 * 
 * OIDC Core 1.0 Section 10.1.1:
 * "The Client MUST validate the signature of all other ID Tokens according to
 * JWS [JWS] using the algorithm specified in the JWT alg Header Parameter.
 * The Client MUST use the keys provided by the Issuer."
 */

import { HttpClient } from './httpClient';

export interface JWK {
  kty: string;
  use?: string;
  kid?: string;
  alg?: string;
  n?: string; // RSA modulus
  e?: string; // RSA exponent
  x?: string; // EC x coordinate
  y?: string; // EC y coordinate
  crv?: string; // EC curve
  [key: string]: unknown;
}

interface JWKSResponse {
  keys: JWK[];
}

interface CacheEntry {
  keys: JWK[];
  timestamp: number;
  jwksUri: string;
}

class JWKSCacheServiceImpl {
  private cache = new Map<string, CacheEntry>();
  private ttl = 3600000; // 1 hour in milliseconds
  private isDev = process.env.NODE_ENV === 'development';

  async getKeys(jwksUri: string): Promise<JWK[]> {
    const cached = this.getCached(jwksUri);
    
    if (cached) {
      if (this.isDev) {
        console.log(`[JWKSCacheService] Using cached keys for ${jwksUri}`);
      }
      return cached;
    }

    if (this.isDev) {
      console.log(`[JWKSCacheService] Fetching keys from ${jwksUri}`);
    }

    return this.fetchAndCache(jwksUri);
  }

  invalidateCache(jwksUri: string): void {
    this.cache.delete(jwksUri);
    if (this.isDev) {
      console.log(`[JWKSCacheService] Invalidated cache for ${jwksUri}`);
    }
  }

  clearAll(): void {
    this.cache.clear();
    if (this.isDev) {
      console.log('[JWKSCacheService] Cleared all cached keys');
    }
  }

  private getCached(jwksUri: string): JWK[] | null {
    const entry = this.cache.get(jwksUri);
    
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    
    if (age > this.ttl) {
      this.cache.delete(jwksUri);
      if (this.isDev) {
        console.log(`[JWKSCacheService] Cache expired for ${jwksUri}`);
      }
      return null;
    }

    return entry.keys;
  }

  private async fetchAndCache(jwksUri: string): Promise<JWK[]> {
    try {
      const response = await HttpClient.get<JWKSResponse>(jwksUri);
      
      if (!response.data.keys || !Array.isArray(response.data.keys)) {
        throw new Error('Invalid JWKS response: missing keys array');
      }

      const entry: CacheEntry = {
        keys: response.data.keys,
        timestamp: Date.now(),
        jwksUri,
      };

      this.cache.set(jwksUri, entry);

      if (this.isDev) {
        console.log(`[JWKSCacheService] Cached ${entry.keys.length} keys for ${jwksUri}`);
      }

      return entry.keys;
    } catch (error) {
      console.error(`[JWKSCacheService] Error fetching JWKS from ${jwksUri}:`, error);
      throw new Error(`Failed to fetch JWKS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getKeyById(jwksUri: string, kid: string): Promise<JWK | null> {
    const keys = await this.getKeys(jwksUri);
    return keys.find(key => key.kid === kid) ?? null;
  }

  getCacheStats(): { size: number; entries: Array<{ jwksUri: string; keyCount: number; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([jwksUri, entry]) => ({
      jwksUri,
      keyCount: entry.keys.length,
      age: Date.now() - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

export const JWKSCacheService = new JWKSCacheServiceImpl();

export function createJWKSCacheService(): JWKSCacheServiceImpl {
  return new JWKSCacheServiceImpl();
}
