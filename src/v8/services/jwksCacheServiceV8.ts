/**
 * @file jwksCacheServiceV8.ts
 * @module v8/services
 * @description Caching service for JWKS (JSON Web Key Set)
 * @version 8.0.0
 * @since 2025-01-27
 *
 * Caches JWKS in IndexedDB to improve performance and reduce API calls.
 * JWKS are cached for 24 hours.
 */

import { logger } from '../../utils/logger';
const MODULE_TAG = '[💾 JWKS-CACHE-V8]';

export interface CachedJWKS {
	jwksUri: string;
	issuer: string;
	keys: Array<Record<string, unknown>>;
	cachedAt: number;
	expiresAt: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DB_NAME = 'v8_jwks_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'jwks';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB for JWKS caching
 */
async function initDB(): Promise<IDBDatabase> {
	if (dbPromise) {
		return dbPromise;
	}

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			logger.error(`${MODULE_TAG} Failed to open database:`, request.error);
			reject(request.error);
		};

		request.onsuccess = () => {
			logger.info(`${MODULE_TAG} ✅ JWKS cache database opened`, "Logger info");
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: 'cacheKey',
				});
				store.createIndex('jwksUri', 'jwksUri', { unique: false });
				store.createIndex('issuer', 'issuer', { unique: false });
				store.createIndex('expiresAt', 'expiresAt', { unique: false });
				logger.info(`${MODULE_TAG} ✅ JWKS cache object store created`, "Logger info");
			}
		};
	});

	return dbPromise;
}

/**
 * Generate cache key from JWKS URI
 */
function getCacheKey(jwksUri: string): string {
	return `jwks_${jwksUri}`;
}

/**
 * Cache JWKS
 */
export async function cacheJWKS(
	jwksUri: string,
	issuer: string,
	keys: Array<Record<string, unknown>>
): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		const cacheKey = getCacheKey(jwksUri);
		const now = Date.now();

		const cached: CachedJWKS = {
			jwksUri,
			issuer,
			keys,
			cachedAt: now,
			expiresAt: now + CACHE_TTL,
		};

		await new Promise<void>((resolve, reject) => {
			const request = store.put({ cacheKey, ...cached });
			request.onsuccess = () => {
				logger.info(`${MODULE_TAG} ✅ JWKS cached`, { jwksUri, keyCount: keys.length });
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		logger.warn(`${MODULE_TAG} ⚠️ Failed to cache JWKS`, { jwksUri, error });
		// Don't throw - caching is non-critical
	}
}

/**
 * Get cached JWKS if available and not expired
 */
export async function getCachedJWKS(
	jwksUri: string
): Promise<Array<Record<string, unknown>> | null> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const cacheKey = getCacheKey(jwksUri);

		return new Promise((resolve, _reject) => {
			const request = store.get(cacheKey);

			request.onsuccess = () => {
				const result = request.result as (CachedJWKS & { cacheKey: string }) | undefined;

				if (!result) {
					logger.info(`${MODULE_TAG} ⚠️ No cached JWKS found`, { jwksUri });
					resolve(null);
					return;
				}

				// Check if expired
				if (Date.now() > result.expiresAt) {
					logger.info(`${MODULE_TAG} ⚠️ Cached JWKS expired`, {
						jwksUri,
						age: Date.now() - result.cachedAt,
					});
					// Delete expired entry
					store.delete(cacheKey);
					resolve(null);
					return;
				}

				logger.info(`${MODULE_TAG} ✅ Using cached JWKS`, {
					jwksUri,
					keyCount: result.keys.length,
					age: Date.now() - result.cachedAt,
					expiresIn: result.expiresAt - Date.now(),
				});
				resolve(result.keys);
			};

			request.onerror = () => {
				logger.warn(`${MODULE_TAG} ⚠️ Failed to get cached JWKS`, { jwksUri });
				resolve(null); // Return null on error, don't reject
			};
		});
	} catch (error) {
		logger.warn(`${MODULE_TAG} ⚠️ Error getting cached JWKS`, { jwksUri, error });
		return null;
	}
}

/**
 * Get specific key from cached JWKS by kid (key ID)
 */
export async function getCachedJWKByKid(
	jwksUri: string,
	kid: string
): Promise<Record<string, unknown> | null> {
	const keys = await getCachedJWKS(jwksUri);
	if (!keys) {
		return null;
	}

	const key = keys.find((k) => k.kid === kid);
	return key || null;
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const index = store.index('expiresAt');
		const now = Date.now();

		return new Promise((resolve, reject) => {
			const request = index.openCursor(IDBKeyRange.upperBound(now));

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					cursor.delete();
					cursor.continue();
				} else {
					logger.info(`${MODULE_TAG} ✅ Expired JWKS cache entries cleared`, "Logger info");
					resolve();
				}
			};

			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		logger.warn(`${MODULE_TAG} ⚠️ Error clearing expired cache`, { error });
	}
}

/**
 * Clear all cached JWKS
 */
export async function clearAllCache(): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		await new Promise<void>((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => {
				logger.info(`${MODULE_TAG} ✅ All JWKS cache cleared`, "Logger info");
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		logger.warn(`${MODULE_TAG} ⚠️ Error clearing cache`, { error });
	}
}

export const JWKSCacheServiceV8 = {
	cacheJWKS,
	getCachedJWKS,
	getCachedJWKByKid,
	clearExpiredCache,
	clearAllCache,
};
