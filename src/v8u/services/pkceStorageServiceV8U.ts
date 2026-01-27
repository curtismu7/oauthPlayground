/**
 * @file pkceStorageServiceV8U.ts
 * @module v8u/services
 * @description Bulletproof PKCE code storage with multiple redundancy layers
 * @version 8.0.0
 * @since 2024-11-18
 */

const MODULE_TAG = '[🔐 PKCE-STORAGE-V8U]';

export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
	savedAt: number;
	flowKey: string;
}

/**
 * Bulletproof PKCE storage service
 * Stores codes in 4 places for maximum reliability:
 * 1. sessionStorage (survives page refresh)
 * 2. localStorage (survives browser restart)
 * 3. IndexedDB (survives cache clear)
 * 4. In-memory cache (fastest access)
 */
export class PKCEStorageServiceV8U {
	private static memoryCache: Map<string, PKCECodes> = new Map();
	private static readonly DB_NAME = 'v8u_pkce_db';
	private static readonly STORE_NAME = 'pkce_codes';
	private static dbPromise: Promise<IDBDatabase> | null = null;

	/**
	 * Initialize IndexedDB
	 */
	private static async initDB(): Promise<IDBDatabase> {
		if (PKCEStorageServiceV8U.dbPromise) {
			return PKCEStorageServiceV8U.dbPromise;
		}

		PKCEStorageServiceV8U.dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(PKCEStorageServiceV8U.DB_NAME, 1);

			request.onerror = () => {
				console.error(`${MODULE_TAG} IndexedDB error:`, request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				console.log(`${MODULE_TAG} IndexedDB opened successfully`);
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(PKCEStorageServiceV8U.STORE_NAME)) {
					db.createObjectStore(PKCEStorageServiceV8U.STORE_NAME, { keyPath: 'flowKey' });
					console.log(`${MODULE_TAG} IndexedDB object store created`);
				}
			};
		});

		return PKCEStorageServiceV8U.dbPromise;
	}

	/**
	 * Save to IndexedDB
	 */
	private static async saveToIndexedDB(flowKey: string, data: PKCECodes): Promise<void> {
		try {
			const db = await PKCEStorageServiceV8U.initDB();
			const transaction = db.transaction([PKCEStorageServiceV8U.STORE_NAME], 'readwrite');
			const store = transaction.objectStore(PKCEStorageServiceV8U.STORE_NAME);
			store.put(data);

			await new Promise<void>((resolve, reject) => {
				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			});

			console.log(`${MODULE_TAG} ✅ Saved to IndexedDB`, { flowKey });
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to save to IndexedDB`, err);
		}
	}

	/**
	 * Load from IndexedDB
	 */
	private static async loadFromIndexedDB(flowKey: string): Promise<PKCECodes | null> {
		try {
			const db = await PKCEStorageServiceV8U.initDB();
			const transaction = db.transaction([PKCEStorageServiceV8U.STORE_NAME], 'readonly');
			const store = transaction.objectStore(PKCEStorageServiceV8U.STORE_NAME);
			const request = store.get(flowKey);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => {
					resolve(request.result || null);
				};
				request.onerror = () => {
					reject(request.error);
				};
			});
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to load from IndexedDB`, err);
			return null;
		}
	}

	/**
	 * Save PKCE codes with quadruple redundancy
	 */
	static savePKCECodes(
		flowKey: string,
		codes: { codeVerifier: string; codeChallenge: string; codeChallengeMethod?: string }
	): void {
		const pkceData: PKCECodes = {
			codeVerifier: codes.codeVerifier,
			codeChallenge: codes.codeChallenge,
			codeChallengeMethod: codes.codeChallengeMethod || 'S256',
			savedAt: Date.now(),
			flowKey,
		};

		const jsonData = JSON.stringify(pkceData);

		// 1. Save to sessionStorage
		try {
			sessionStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
			sessionStorage.setItem('v8u_pkce_codes', jsonData); // Legacy key for compatibility
			console.log(`${MODULE_TAG} ✅ Saved to sessionStorage`, { flowKey });
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to save to sessionStorage`, err);
		}

		// 2. Save to localStorage (backup)
		try {
			localStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
			console.log(`${MODULE_TAG} ✅ Saved to localStorage (backup)`, { flowKey });
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to save to localStorage`, err);
		}

		// 3. Save to IndexedDB (async, most persistent)
		PKCEStorageServiceV8U.saveToIndexedDB(flowKey, pkceData).catch((err) => {
			console.error(`${MODULE_TAG} IndexedDB save failed (non-critical)`, err);
		});

		// 4. Save to memory cache
		PKCEStorageServiceV8U.memoryCache.set(flowKey, pkceData);
		console.log(`${MODULE_TAG} ✅ Saved to memory cache`, { flowKey });

		console.log(`${MODULE_TAG} 🎯 PKCE codes saved with QUADRUPLE redundancy`, {
			flowKey,
			verifierLength: codes.codeVerifier.length,
			challengeLength: codes.codeChallenge.length,
			savedAt: new Date(pkceData.savedAt).toISOString(),
			locations: ['sessionStorage', 'localStorage', 'IndexedDB', 'memory'],
		});
	}

	/**
	 * Load PKCE codes with fallback chain
	 * Tries: memory → sessionStorage → localStorage → IndexedDB
	 */
	static async loadPKCECodesAsync(flowKey: string): Promise<PKCECodes | null> {
		console.log(`${MODULE_TAG} 🔍 Loading PKCE codes (async)`, { flowKey });

		// 1. Try memory cache first (fastest)
		const memoryData = PKCEStorageServiceV8U.memoryCache.get(flowKey);
		if (memoryData) {
			console.log(`${MODULE_TAG} ✅ Found in memory cache`, { flowKey });
			return memoryData;
		}

		// 2. Try sessionStorage
		try {
			const sessionData =
				sessionStorage.getItem(`v8u_pkce_${flowKey}`) || sessionStorage.getItem('v8u_pkce_codes');
			if (sessionData) {
				const parsed = JSON.parse(sessionData) as PKCECodes;
				console.log(`${MODULE_TAG} ✅ Found in sessionStorage`, { flowKey });
				PKCEStorageServiceV8U.memoryCache.set(flowKey, parsed);
				return parsed;
			}
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to load from sessionStorage`, err);
		}

		// 3. Try localStorage
		try {
			const localData = localStorage.getItem(`v8u_pkce_${flowKey}`);
			if (localData) {
				const parsed = JSON.parse(localData) as PKCECodes;
				console.log(`${MODULE_TAG} ✅ Found in localStorage`, { flowKey });
				PKCEStorageServiceV8U.memoryCache.set(flowKey, parsed);
				try {
					sessionStorage.setItem(`v8u_pkce_${flowKey}`, localData);
				} catch {}
				return parsed;
			}
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to load from localStorage`, err);
		}

		// 4. Try IndexedDB (last resort, most persistent)
		try {
			const indexedData = await PKCEStorageServiceV8U.loadFromIndexedDB(flowKey);
			if (indexedData) {
				console.log(`${MODULE_TAG} ✅ Found in IndexedDB (ultimate backup)`, { flowKey });
				// Restore to all other storages
				PKCEStorageServiceV8U.memoryCache.set(flowKey, indexedData);
				try {
					const jsonData = JSON.stringify(indexedData);
					sessionStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
					localStorage.setItem(`v8u_pkce_${flowKey}`, jsonData);
				} catch {}
				return indexedData;
			}
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to load from IndexedDB`, err);
		}

		console.warn(`${MODULE_TAG} ⚠️ No PKCE codes found in any storage`, { flowKey });
		return null;
	}

	/**
	 * Synchronous load (tries memory, sessionStorage, localStorage only)
	 */
	static loadPKCECodes(flowKey: string): PKCECodes | null {
		console.log(`${MODULE_TAG} 🔍 Loading PKCE codes (sync)`, { flowKey });

		// 1. Try memory cache
		const memoryData = PKCEStorageServiceV8U.memoryCache.get(flowKey);
		if (memoryData) {
			console.log(`${MODULE_TAG} ✅ Found in memory cache`, { flowKey });
			return memoryData;
		}

		// 2. Try sessionStorage
		try {
			const sessionData =
				sessionStorage.getItem(`v8u_pkce_${flowKey}`) || sessionStorage.getItem('v8u_pkce_codes');
			if (sessionData) {
				const parsed = JSON.parse(sessionData) as PKCECodes;
				console.log(`${MODULE_TAG} ✅ Found in sessionStorage`, { flowKey });
				PKCEStorageServiceV8U.memoryCache.set(flowKey, parsed);
				return parsed;
			}
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to load from sessionStorage`, err);
		}

		// 3. Try localStorage
		try {
			const localData = localStorage.getItem(`v8u_pkce_${flowKey}`);
			if (localData) {
				const parsed = JSON.parse(localData) as PKCECodes;
				console.log(`${MODULE_TAG} ✅ Found in localStorage`, { flowKey });
				PKCEStorageServiceV8U.memoryCache.set(flowKey, parsed);
				try {
					sessionStorage.setItem(`v8u_pkce_${flowKey}`, localData);
				} catch {}
				return parsed;
			}
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to load from localStorage`, err);
		}

		console.warn(
			`${MODULE_TAG} ⚠️ No PKCE codes found in sync storage (try async load for IndexedDB)`,
			{ flowKey }
		);
		return null;
	}

	/**
	 * Clear PKCE codes from all storage locations
	 */
	static async clearPKCECodes(flowKey: string): Promise<void> {
		console.log(`${MODULE_TAG} 🗑️ Clearing PKCE codes`, { flowKey });

		// Clear from all locations
		PKCEStorageServiceV8U.memoryCache.delete(flowKey);

		try {
			sessionStorage.removeItem(`v8u_pkce_${flowKey}`);
			sessionStorage.removeItem('v8u_pkce_codes');
		} catch {}

		try {
			localStorage.removeItem(`v8u_pkce_${flowKey}`);
		} catch {}

		// Clear from IndexedDB
		try {
			const db = await PKCEStorageServiceV8U.initDB();
			const transaction = db.transaction([PKCEStorageServiceV8U.STORE_NAME], 'readwrite');
			const store = transaction.objectStore(PKCEStorageServiceV8U.STORE_NAME);
			store.delete(flowKey);
			console.log(`${MODULE_TAG} ✅ Cleared from IndexedDB`, { flowKey });
		} catch (err) {
			console.error(`${MODULE_TAG} ❌ Failed to clear from IndexedDB`, err);
		}

		console.log(`${MODULE_TAG} ✅ PKCE codes cleared from all 4 storage locations`, { flowKey });
	}

	/**
	 * Check if PKCE codes exist
	 */
	static hasPKCECodes(flowKey: string): boolean {
		return PKCEStorageServiceV8U.loadPKCECodes(flowKey) !== null;
	}
}
