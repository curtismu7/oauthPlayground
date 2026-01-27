/**
 * @file discoveryCacheServiceV8.ts
 * @module v8/services
 * @description Caching service for OIDC discovery documents
 * @version 8.0.0
 * @since 2025-01-27
 *
 * Caches OIDC discovery documents in IndexedDB to improve performance
 * and reduce API calls. Discovery documents are cached for 24 hours.
 */

const MODULE_TAG = '[💾 DISCOVERY-CACHE-V8]';

export interface CachedDiscoveryDocument {
	issuer: string;
	environmentId?: string;
	document: Record<string, unknown>;
	cachedAt: number;
	expiresAt: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DB_NAME = 'v8_discovery_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'discovery_documents';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB for discovery document caching
 */
async function initDB(): Promise<IDBDatabase> {
	if (dbPromise) {
		return dbPromise;
	}

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			console.error(`${MODULE_TAG} Failed to open database:`, request.error);
			reject(request.error);
		};

		request.onsuccess = () => {
			console.log(`${MODULE_TAG} ✅ Discovery cache database opened`);
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: 'cacheKey',
				});
				store.createIndex('issuer', 'issuer', { unique: false });
				store.createIndex('expiresAt', 'expiresAt', { unique: false });
				console.log(`${MODULE_TAG} ✅ Discovery cache object store created`);
			}
		};
	});

	return dbPromise;
}

/**
 * Generate cache key from issuer and environment ID
 */
function getCacheKey(issuer: string, environmentId?: string): string {
	return environmentId ? `discovery_${environmentId}_${issuer}` : `discovery_${issuer}`;
}

/**
 * Cache discovery document
 */
export async function cacheDiscoveryDocument(
	issuer: string,
	document: Record<string, unknown>,
	environmentId?: string
): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		const cacheKey = getCacheKey(issuer, environmentId);
		const now = Date.now();

		const cached: CachedDiscoveryDocument = {
			issuer,
			environmentId,
			document,
			cachedAt: now,
			expiresAt: now + CACHE_TTL,
		};

		await new Promise<void>((resolve, reject) => {
			const request = store.put({ cacheKey, ...cached });
			request.onsuccess = () => {
				console.log(`${MODULE_TAG} ✅ Discovery document cached`, { issuer, environmentId });
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.warn(`${MODULE_TAG} ⚠️ Failed to cache discovery document`, { issuer, error });
		// Don't throw - caching is non-critical
	}
}

/**
 * Get cached discovery document if available and not expired
 */
export async function getCachedDiscoveryDocument(
	issuer: string,
	environmentId?: string
): Promise<Record<string, unknown> | null> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const cacheKey = getCacheKey(issuer, environmentId);

		return new Promise((resolve, reject) => {
			const request = store.get(cacheKey);

			request.onsuccess = () => {
				const result = request.result as
					| (CachedDiscoveryDocument & { cacheKey: string })
					| undefined;

				if (!result) {
					console.log(`${MODULE_TAG} ⚠️ No cached discovery document found`, { issuer });
					resolve(null);
					return;
				}

				// Check if expired
				if (Date.now() > result.expiresAt) {
					console.log(`${MODULE_TAG} ⚠️ Cached discovery document expired`, {
						issuer,
						age: Date.now() - result.cachedAt,
					});
					// Delete expired entry
					store.delete(cacheKey);
					resolve(null);
					return;
				}

				console.log(`${MODULE_TAG} ✅ Using cached discovery document`, {
					issuer,
					age: Date.now() - result.cachedAt,
					expiresIn: result.expiresAt - Date.now(),
				});
				resolve(result.document);
			};

			request.onerror = () => {
				console.warn(`${MODULE_TAG} ⚠️ Failed to get cached discovery document`, { issuer });
				resolve(null); // Return null on error, don't reject
			};
		});
	} catch (error) {
		console.warn(`${MODULE_TAG} ⚠️ Error getting cached discovery document`, { issuer, error });
		return null;
	}
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
					console.log(`${MODULE_TAG} ✅ Expired cache entries cleared`);
					resolve();
				}
			};

			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.warn(`${MODULE_TAG} ⚠️ Error clearing expired cache`, { error });
	}
}

/**
 * Clear all cached discovery documents
 */
export async function clearAllCache(): Promise<void> {
	try {
		const db = await initDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);

		await new Promise<void>((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => {
				console.log(`${MODULE_TAG} ✅ All discovery cache cleared`);
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.warn(`${MODULE_TAG} ⚠️ Error clearing cache`, { error });
	}
}

export const DiscoveryCacheServiceV8 = {
	cacheDiscoveryDocument,
	getCachedDiscoveryDocument,
	clearExpiredCache,
	clearAllCache,
};
