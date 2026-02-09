/**
 * @file userCacheServiceV8.ts
 * @module v8/services
 * @description IndexedDB-based user cache service for large user directories
 * @version 8.0.0
 * @since 2026-02-01
 *
 * Provides persistent caching of user data in IndexedDB with:
 * - Large storage capacity (50MB+)
 * - Survives page refresh
 * - TTL-based expiration
 * - Efficient search and filtering
 * - Per-environment caching
 */

import type { User } from './userServiceV8';

const MODULE_TAG = '[💾 USER-CACHE-V8]';

const DB_NAME = 'v8_user_cache';
const DB_VERSION = 1;
const STORE_NAME = 'users';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedUser extends User {
	environmentId: string;
	cachedAt: number;
}

interface CacheMetadata {
	environmentId: string;
	totalUsers: number;
	lastFetchedAt: number;
	fetchComplete: boolean;
	fetchInProgress?: boolean;
	currentPage?: number;
	totalPages?: number;
	fetchedCount?: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
	if (dbPromise) {
		return dbPromise;
	}

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			console.error(`${MODULE_TAG} Failed to open database`, request.error);
			reject(request.error);
		};

		request.onsuccess = () => {
			console.log(`${MODULE_TAG} Database opened successfully`);
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// Create users store
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: ['environmentId', 'id'],
				});
				store.createIndex('environmentId', 'environmentId', { unique: false });
				store.createIndex('username', 'username', { unique: false });
				store.createIndex('email', 'email', { unique: false });
				store.createIndex('cachedAt', 'cachedAt', { unique: false });
				console.log(`${MODULE_TAG} Users store created with indexes`);
			}

			// Create metadata store
			if (!db.objectStoreNames.contains('metadata')) {
				db.createObjectStore('metadata', { keyPath: 'environmentId' });
				console.log(`${MODULE_TAG} Metadata store created`);
			}
		};
	});

	return dbPromise;
}

/**
 * UserCacheServiceV8
 *
 * Provides persistent IndexedDB caching for user data
 */
export class UserCacheServiceV8 {
	/**
	 * Save users to cache
	 */
	static async saveUsers(
		environmentId: string,
		users: User[],
		fetchComplete = false
	): Promise<void> {
		try {
			const db = await initDB();
			const transaction = db.transaction([STORE_NAME, 'metadata'], 'readwrite');
			const userStore = transaction.objectStore(STORE_NAME);
			const _metaStore = transaction.objectStore('metadata');

			const now = Date.now();

			// Save each user
			for (const user of users) {
				const cachedUser: CachedUser = {
					...user,
					environmentId,
					cachedAt: now,
				};
				userStore.put(cachedUser);
			}

			await new Promise<void>((resolve, reject) => {
				transaction.oncomplete = () => {
					console.log(`${MODULE_TAG} Saved ${users.length} users for env ${environmentId}`);
					resolve();
				};
				transaction.onerror = () => {
					console.error(`${MODULE_TAG} Transaction failed`, transaction.error);
					reject(transaction.error);
				};
			});

			// Count actual users in IndexedDB after save
			const actualCount = await UserCacheServiceV8.countUsers(environmentId);

			// Update metadata with actual count
			const metaTransaction = db.transaction(['metadata'], 'readwrite');
			const metaStoreForUpdate = metaTransaction.objectStore('metadata');
			const metadata: CacheMetadata = {
				environmentId,
				totalUsers: actualCount,
				lastFetchedAt: now,
				fetchComplete,
			};
			metaStoreForUpdate.put(metadata);

			await new Promise<void>((resolve, reject) => {
				metaTransaction.oncomplete = () => {
					console.log(`${MODULE_TAG} Updated metadata: ${actualCount} total users in IndexedDB`);
					resolve();
				};
				metaTransaction.onerror = () => reject(metaTransaction.error);
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to save users`, err);
			throw err;
		}
	}

	/**
	 * Count users in cache for an environment
	 */
	static async countUsers(environmentId: string): Promise<number> {
		try {
			const db = await initDB();
			const transaction = db.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index('environmentId');
			const request = index.count(environmentId);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => {
					const count = request.result || 0;
					console.log(`${MODULE_TAG} Counted ${count} users in IndexedDB for env ${environmentId}`);
					resolve(count);
				};
				request.onerror = () => reject(request.error);
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to count users`, err);
			return 0;
		}
	}

	/**
	 * Load all users for an environment
	 */
	static async loadUsers(environmentId: string): Promise<User[] | null> {
		try {
			const db = await initDB();

			// Check metadata first
			const metaTransaction = db.transaction(['metadata'], 'readonly');
			const metaStore = metaTransaction.objectStore('metadata');
			const metaRequest = metaStore.get(environmentId);

			const metadata = await new Promise<CacheMetadata | null>((resolve, reject) => {
				metaRequest.onsuccess = () => resolve(metaRequest.result || null);
				metaRequest.onerror = () => reject(metaRequest.error);
			});

			if (!metadata) {
				console.log(`${MODULE_TAG} No cache found for env ${environmentId}`);
				return null;
			}

			// Check if cache is expired
			const age = Date.now() - metadata.lastFetchedAt;
			if (age > CACHE_TTL) {
				console.log(`${MODULE_TAG} Cache expired for env ${environmentId} (age: ${age}ms)`);
				return null;
			}

			// Load all users for this environment
			const transaction = db.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index('environmentId');
			const request = index.getAll(environmentId);

			const users = await new Promise<CachedUser[]>((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || []);
				request.onerror = () => reject(request.error);
			});

			console.log(`${MODULE_TAG} Loaded ${users.length} users from cache for env ${environmentId}`);
			return users;
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to load users`, err);
			return null;
		}
	}

	/**
	 * Search users in cache using IndexedDB cursor (efficient - doesn't load all users)
	 */
	static async searchUsers(
		environmentId: string,
		searchTerm: string,
		limit = 100
	): Promise<User[]> {
		try {
			if (!searchTerm || !searchTerm.trim()) {
				// If no search term, return limited recent users
				return UserCacheServiceV8.getRecentUsers(environmentId, limit);
			}

			const db = await initDB();
			const transaction = db.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index('environmentId');

			const lowerSearch = searchTerm.toLowerCase();
			const results: User[] = [];

			return new Promise((resolve, reject) => {
				const request = index.openCursor(IDBKeyRange.only(environmentId));

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor && results.length < limit) {
						const user = cursor.value as CachedUser;

						// Check if username or email matches search
						if (
							user.username.toLowerCase().includes(lowerSearch) ||
							user.email?.toLowerCase().includes(lowerSearch)
						) {
							results.push({
								id: user.id,
								username: user.username,
								email: user.email,
							});
						}
						cursor.continue();
					} else {
						// Cursor exhausted or limit reached
						resolve(results);
					}
				};

				request.onerror = () => {
					console.error(`${MODULE_TAG} Search cursor failed`, request.error);
					reject(request.error);
				};
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to search users`, err);
			return [];
		}
	}

	/**
	 * Get recent users (for dropdown initial display)
	 */
	static async getRecentUsers(environmentId: string, limit = 100): Promise<User[]> {
		try {
			const db = await initDB();
			const transaction = db.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index('environmentId');

			const results: User[] = [];

			return new Promise((resolve, reject) => {
				const request = index.openCursor(IDBKeyRange.only(environmentId));

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor && results.length < limit) {
						const user = cursor.value as CachedUser;
						results.push({
							id: user.id,
							username: user.username,
							email: user.email,
						});
						cursor.continue();
					} else {
						resolve(results);
					}
				};

				request.onerror = () => {
					console.error(`${MODULE_TAG} Get recent users failed`, request.error);
					reject(request.error);
				};
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to get recent users`, err);
			return [];
		}
	}

	/**
	 * Clear cache for an environment
	 */
	static async clearCache(environmentId: string): Promise<void> {
		try {
			const db = await initDB();
			const transaction = db.transaction([STORE_NAME, 'metadata'], 'readwrite');
			const userStore = transaction.objectStore(STORE_NAME);
			const metaStore = transaction.objectStore('metadata');

			// Delete all users for this environment
			const index = userStore.index('environmentId');
			const request = index.openCursor(environmentId);

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					cursor.delete();
					cursor.continue();
				}
			};

			// Delete metadata
			metaStore.delete(environmentId);

			await new Promise<void>((resolve, reject) => {
				transaction.oncomplete = () => {
					console.log(`${MODULE_TAG} Cleared cache for env ${environmentId}`);
					resolve();
				};
				transaction.onerror = () => {
					console.error(`${MODULE_TAG} Failed to clear cache`, transaction.error);
					reject(transaction.error);
				};
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to clear cache`, err);
			throw err;
		}
	}

	/**
	 * Get cache metadata
	 */
	static async getCacheInfo(environmentId: string): Promise<CacheMetadata | null> {
		try {
			const db = await initDB();
			const transaction = db.transaction(['metadata'], 'readonly');
			const store = transaction.objectStore('metadata');
			const request = store.get(environmentId);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => reject(request.error);
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to get cache info`, err);
			return null;
		}
	}

	/**
	 * Clear all caches (all environments)
	 */
	static async clearAllCaches(): Promise<void> {
		try {
			const db = await initDB();
			const transaction = db.transaction([STORE_NAME, 'metadata'], 'readwrite');
			const userStore = transaction.objectStore(STORE_NAME);
			const metaStore = transaction.objectStore('metadata');

			userStore.clear();
			metaStore.clear();

			await new Promise<void>((resolve, reject) => {
				transaction.oncomplete = () => {
					console.log(`${MODULE_TAG} Cleared all caches`);
					resolve();
				};
				transaction.onerror = () => reject(transaction.error);
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to clear all caches`, err);
			throw err;
		}
	}

	/**
	 * Update cache metadata (for progress tracking)
	 */
	static async updateMetadata(
		environmentId: string,
		updates: Partial<CacheMetadata>
	): Promise<void> {
		try {
			const db = await initDB();
			const transaction = db.transaction(['metadata'], 'readwrite');
			const store = transaction.objectStore('metadata');

			// Get existing metadata
			const getRequest = store.get(environmentId);

			await new Promise<void>((resolve, reject) => {
				getRequest.onsuccess = () => {
					const existing = getRequest.result || {
						environmentId,
						totalUsers: 0,
						lastFetchedAt: Date.now(),
						fetchComplete: false,
					};

					// Merge updates
					const updated = { ...existing, ...updates };
					const putRequest = store.put(updated);

					putRequest.onsuccess = () => resolve();
					putRequest.onerror = () => reject(putRequest.error);
				};
				getRequest.onerror = () => reject(getRequest.error);
			});
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to update metadata`, err);
			throw err;
		}
	}
}
