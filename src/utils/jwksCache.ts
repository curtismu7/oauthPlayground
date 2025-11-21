// src/utils/jwksCache.ts - JWKS caching utilities for multi-flow reuse

import { JWKS } from './jwks';
import { logger } from './logger';

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
	/** Cached data */
	data: T;
	/** Timestamp when cached */
	timestamp: number;
	/** Expiration timestamp */
	expiresAt: number;
	/** Cache key */
	key: string;
	/** Metadata about the cache entry */
	metadata?: {
		source?: string;
		version?: string;
		tags?: string[];
	};
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	/** Default TTL in milliseconds */
	defaultTtl?: number;
	/** Maximum cache size */
	maxSize?: number;
	/** Cache cleanup interval in milliseconds */
	cleanupInterval?: number;
	/** Enable cache statistics */
	enableStats?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
	hits: number;
	misses: number;
	sets: number;
	deletes: number;
	evictions: number;
	size: number;
	hitRate: number;
}

/**
 * JWKS-specific cache entry
 */
export interface JWKSCacheEntry extends CacheEntry<JWKS> {
	/** JWKS URI */
	jwksUri: string;
	/** Key statistics */
	keyStats?: {
		totalKeys: number;
		keyTypes: Record<string, number>;
		algorithms: Record<string, number>;
	};
}

/**
 * In-memory JWKS cache implementation
 */
export class JWKSCache {
	private cache = new Map<string, CacheEntry>();
	private stats: CacheStats = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
		evictions: 0,
		size: 0,
		hitRate: 0,
	};
	private cleanupTimer?: NodeJS.Timeout;
	private readonly config: Required<CacheConfig>;

	constructor(config: CacheConfig = {}) {
		this.config = {
			defaultTtl: config.defaultTtl || 5 * 60 * 1000, // 5 minutes
			maxSize: config.maxSize || 100,
			cleanupInterval: config.cleanupInterval || 60 * 1000, // 1 minute
			enableStats: config.enableStats ?? true,
		};

		this.startCleanupTimer();
		logger.info('JWKSCache', 'Cache initialized', this.config);
	}

	/**
	 * Get cached data
	 */
	async get<T = any>(key: string): Promise<T | null> {
		const entry = this.cache.get(key);

		if (!entry) {
			this.stats.misses++;
			this.updateHitRate();
			logger.debug('JWKSCache', 'Cache miss', { key });
			return null;
		}

		// Check if expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			this.stats.misses++;
			this.stats.evictions++;
			this.updateHitRate();
			logger.debug('JWKSCache', 'Cache entry expired', { key, expiresAt: entry.expiresAt });
			return null;
		}

		this.stats.hits++;
		this.updateHitRate();
		logger.debug('JWKSCache', 'Cache hit', { key, age: Date.now() - entry.timestamp });
		return entry.data as T;
	}

	/**
	 * Set cached data
	 */
	async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
		const now = Date.now();
		const expiresAt = now + (ttl || this.config.defaultTtl);

		// Check cache size limit
		if (this.cache.size >= this.config.maxSize) {
			this.evictOldest();
		}

		const entry: CacheEntry<T> = {
			data,
			timestamp: now,
			expiresAt,
			key,
		};

		this.cache.set(key, entry);
		// Evict oldest entries if cache size exceeds maxSize
		if (this.cache.size > this.config.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
				this.stats.evictions++;
			}
		}
		this.stats.sets++;
		this.stats.size = this.cache.size;

		logger.debug('JWKSCache', 'Cache set', {
			key,
			ttl: ttl || this.config.defaultTtl,
			expiresAt,
			cacheSize: this.cache.size,
		});
	}

	/**
	 * Set JWKS-specific cached data
	 */
	async setJWKS(key: string, jwks: JWKS, jwksUri: string, ttl?: number): Promise<void> {
		const now = Date.now();
		const expiresAt = now + (ttl || this.config.defaultTtl);

		// Check cache size limit
		if (this.cache.size >= this.config.maxSize) {
			this.evictOldest();
		}

		const entry: JWKSCacheEntry = {
			data: jwks,
			timestamp: now,
			expiresAt,
			key,
			jwksUri,
			keyStats: {
				totalKeys: jwks.keys.length,
				keyTypes: jwks.keys.reduce(
					(acc, key) => {
						acc[key.kty] = (acc[key.kty] || 0) + 1;
						return acc;
					},
					{} as Record<string, number>
				),
				algorithms: jwks.keys.reduce(
					(acc, key) => {
						acc[key.alg] = (acc[key.alg] || 0) + 1;
						return acc;
					},
					{} as Record<string, number>
				),
			},
		};

		this.cache.set(key, entry);
		// Evict oldest entries if cache size exceeds maxSize
		if (this.cache.size > this.config.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) {
				this.cache.delete(firstKey);
				this.stats.evictions++;
			}
		}
		this.stats.sets++;
		this.stats.size = this.cache.size;

		logger.info('JWKSCache', 'JWKS cached', {
			key,
			jwksUri,
			keyCount: jwks.keys.length,
			ttl: ttl || this.config.defaultTtl,
			cacheSize: this.cache.size,
		});
	}

	/**
	 * Get JWKS-specific cached data
	 */
	async getJWKS(key: string): Promise<JWKSCacheEntry | null> {
		return this.get<JWKSCacheEntry>(key);
	}

	/**
	 * Invalidate cache entry
	 */
	async invalidate(key: string): Promise<void> {
		const existed = this.cache.delete(key);
		if (existed) {
			this.stats.deletes++;
			this.stats.size = this.cache.size;
			logger.debug('JWKSCache', 'Cache invalidated', { key });
		}
	}

	/**
	 * Refresh cache entry with new data
	 */
	async refresh<T = any>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
		logger.debug('JWKSCache', 'Refreshing cache entry', { key });

		try {
			const data = await fetcher();
			await this.set(key, data, ttl);
			return data;
		} catch (error) {
			logger.error('JWKSCache', 'Failed to refresh cache entry', { key, error });
			throw error;
		}
	}

	/**
	 * Clear all cache entries
	 */
	async clear(): Promise<void> {
		const size = this.cache.size;
		this.cache.clear();
		this.stats.size = 0;
		logger.info('JWKSCache', 'Cache cleared', { clearedEntries: size });
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		return { ...this.stats };
	}

	/**
	 * Get cache size
	 */
	getSize(): number {
		return this.cache.size;
	}

	/**
	 * Check if cache is healthy
	 */
	isHealthy(): boolean {
		const now = Date.now();
		const expiredEntries = Array.from(this.cache.values()).filter((entry) => now > entry.expiresAt);
		return expiredEntries.length === 0;
	}

	/**
	 * Get cache entries by pattern
	 */
	getEntriesByPattern(pattern: RegExp): CacheEntry[] {
		return Array.from(this.cache.entries())
			.filter(([key]) => pattern.test(key))
			.map(([, entry]) => entry);
	}

	/**
	 * Evict oldest cache entry
	 */
	private evictOldest(): void {
		let oldestKey = '';
		let oldestTimestamp = Date.now();

		for (const [key, entry] of this.cache.entries()) {
			if (entry.timestamp < oldestTimestamp) {
				oldestTimestamp = entry.timestamp;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey);
			this.stats.evictions++;
			this.stats.size = this.cache.size;
			logger.debug('JWKSCache', 'Evicted oldest entry', {
				key: oldestKey,
				timestamp: oldestTimestamp,
			});
		}
	}

	/**
	 * Update hit rate
	 */
	private updateHitRate(): void {
		const total = this.stats.hits + this.stats.misses;
		this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
	}

	/**
	 * Start cleanup timer
	 */
	private startCleanupTimer(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
		}

		this.cleanupTimer = setInterval(() => {
			this.cleanup();
		}, this.config.cleanupInterval);
	}

	/**
	 * Cleanup expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		const expiredKeys: string[] = [];

		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				expiredKeys.push(key);
			}
		}

		if (expiredKeys.length > 0) {
			expiredKeys.forEach((key) => this.cache.delete(key));
			this.stats.evictions += expiredKeys.length;
			this.stats.size = this.cache.size;
			logger.debug('JWKSCache', 'Cleanup completed', {
				expiredEntries: expiredKeys.length,
				remainingEntries: this.cache.size,
			});
		}
	}

	/**
	 * Destroy cache and cleanup resources
	 */
	destroy(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = undefined;
		}
		this.cache.clear();
		logger.info('JWKSCache', 'Cache destroyed');
	}
}

/**
 * LocalStorage-based JWKS cache implementation
 */
export class LocalStorageJWKSCache {
	private readonly prefix: string;
	private readonly defaultTtl: number;

	constructor(prefix: string = 'jwks_cache_', defaultTtl: number = 5 * 60 * 1000) {
		this.prefix = prefix;
		this.defaultTtl = defaultTtl;
		logger.info('LocalStorageJWKSCache', 'LocalStorage cache initialized', { prefix, defaultTtl });
	}

	/**
	 * Get cached JWKS
	 */
	async get(key: string): Promise<JWKSCacheEntry | null> {
		try {
			const cacheKey = `${this.prefix}${key}`;
			const cached = localStorage.getItem(cacheKey);

			if (!cached) {
				logger.debug('LocalStorageJWKSCache', 'Cache miss', { key });
				return null;
			}

			const entry: JWKSCacheEntry = JSON.parse(cached);
			const now = Date.now();

			// Check if expired
			if (now > entry.expiresAt) {
				localStorage.removeItem(cacheKey);
				logger.debug('LocalStorageJWKSCache', 'Cache entry expired', {
					key,
					expiresAt: entry.expiresAt,
				});
				return null;
			}

			logger.debug('LocalStorageJWKSCache', 'Cache hit', { key, age: now - entry.timestamp });
			return entry;
		} catch (error) {
			logger.warn('LocalStorageJWKSCache', 'Failed to get cached entry', { key, error });
			return null;
		}
	}

	/**
	 * Set cached JWKS
	 */
	async set(key: string, jwks: JWKS, jwksUri: string, ttl?: number): Promise<void> {
		try {
			const now = Date.now();
			const expiresAt = now + (ttl || this.defaultTtl);

			const entry: JWKSCacheEntry = {
				data: jwks,
				timestamp: now,
				expiresAt,
				key,
				jwksUri,
				keyStats: {
					totalKeys: jwks.keys.length,
					keyTypes: jwks.keys.reduce(
						(acc, key) => {
							acc[key.kty] = (acc[key.kty] || 0) + 1;
							return acc;
						},
						{} as Record<string, number>
					),
					algorithms: jwks.keys.reduce(
						(acc, key) => {
							acc[key.alg] = (acc[key.alg] || 0) + 1;
							return acc;
						},
						{} as Record<string, number>
					),
				},
			};

			const cacheKey = `${this.prefix}${key}`;
			localStorage.setItem(cacheKey, JSON.stringify(entry));

			logger.info('LocalStorageJWKSCache', 'JWKS cached', {
				key,
				jwksUri,
				keyCount: jwks.keys.length,
				ttl: ttl || this.defaultTtl,
			});
		} catch (error) {
			logger.warn('LocalStorageJWKSCache', 'Failed to cache entry', { key, error });
		}
	}

	/**
	 * Invalidate cache entry
	 */
	async invalidate(key: string): Promise<void> {
		try {
			const cacheKey = `${this.prefix}${key}`;
			localStorage.removeItem(cacheKey);
			logger.debug('LocalStorageJWKSCache', 'Cache invalidated', { key });
		} catch (error) {
			logger.warn('LocalStorageJWKSCache', 'Failed to invalidate cache entry', { key, error });
		}
	}

	/**
	 * Clear all cache entries
	 */
	async clear(): Promise<void> {
		try {
			const keys = Object.keys(localStorage);
			const cacheKeys = keys.filter((key) => key.startsWith(this.prefix));

			cacheKeys.forEach((key) => localStorage.removeItem(key));

			logger.info('LocalStorageJWKSCache', 'Cache cleared', { clearedEntries: cacheKeys.length });
		} catch (error) {
			logger.warn('LocalStorageJWKSCache', 'Failed to clear cache', { error });
		}
	}

	/**
	 * Get cache size
	 */
	getSize(): number {
		try {
			const keys = Object.keys(localStorage);
			return keys.filter((key) => key.startsWith(this.prefix)).length;
		} catch {
			return 0;
		}
	}
}

// Export default instances
export const defaultJWKSCache = new JWKSCache();
export const defaultLocalStorageCache = new LocalStorageJWKSCache();
