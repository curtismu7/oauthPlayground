/**
 * @file workerTokenServiceV8.ts
 * @module v8/services
 * @description Centralized Worker Token Service with IndexedDB backup storage
 * @version 8.0.0
 * @since 2025-01-20
 *
 * This service manages worker tokens globally across the entire application.
 * Users only need to enter worker token credentials once, and they're shared everywhere.
 *
 * Storage Strategy:
 * - Primary: Browser localStorage (fast, synchronous)
 * - Backup: IndexedDB (persistent, survives browser data clearing)
 * - Memory: In-memory cache for performance
 */

const MODULE_TAG = '[🔑 WORKER-TOKEN-V8]';

const BROWSER_STORAGE_KEY = 'v8:worker_token';
const INDEXEDDB_STORE_NAME = 'worker_tokens';
const INDEXEDDB_DB_NAME = 'oauth_playground_v8';

export interface WorkerTokenData {
	token: string;
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string[];
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	expiresAt?: number;
	savedAt: number;
}

export interface WorkerTokenCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string[];
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

class WorkerTokenServiceV8 {
	private memoryCache: WorkerTokenData | null = null;
	private dbPromise: Promise<IDBDatabase> | null = null;

	/**
	 * Initialize IndexedDB database
	 */
	private async initDB(): Promise<IDBDatabase> {
		if (this.dbPromise) {
			return this.dbPromise;
		}

		this.dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(INDEXEDDB_DB_NAME, 1);

			request.onerror = () => {
				console.error(`${MODULE_TAG} Failed to open IndexedDB`, request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(INDEXEDDB_STORE_NAME)) {
					const store = db.createObjectStore(INDEXEDDB_STORE_NAME, { keyPath: 'id' });
					store.createIndex('environmentId', 'environmentId', { unique: false });
					store.createIndex('savedAt', 'savedAt', { unique: false });
				}
			};
		});

		return this.dbPromise;
	}

	/**
	 * Save worker token credentials to all storage layers
	 */
	async saveCredentials(credentials: WorkerTokenCredentials): Promise<void> {
		const data: WorkerTokenData = {
			token: '', // Token will be fetched when needed
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			scopes: credentials.scopes || [],
			region: credentials.region || 'us',
			customDomain: credentials.customDomain,
			tokenEndpointAuthMethod: credentials.tokenEndpointAuthMethod || 'client_secret_post',
			savedAt: Date.now(),
		};

		// Save to memory cache
		this.memoryCache = data;

		// Save to browser storage (primary)
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save to browser storage`, error);
		}

		// Save to IndexedDB (backup)
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

			const record = {
				id: 'worker_token',
				...data,
			};

			await new Promise<void>((resolve, reject) => {
				const request = store.put(record);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save to IndexedDB`, error);
			// Don't throw - browser storage is primary
		}
	}

	/**
	 * Load worker token credentials from all storage layers (memory -> browser -> IndexedDB)
	 */
	async loadCredentials(): Promise<WorkerTokenCredentials | null> {
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:144',message:'loadCredentials called',data:{hasMemoryCache:!!this.memoryCache,storageKey:BROWSER_STORAGE_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
		// #endregion
		// Try memory cache first
		if (this.memoryCache) {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:147',message:'Using memory cache',data:{hasEnvironmentId:!!this.memoryCache.environmentId,hasClientId:!!this.memoryCache.clientId,hasClientSecret:!!this.memoryCache.clientSecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
			return this.extractCredentials(this.memoryCache);
		}

		// Try browser storage (primary)
		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:152',message:'Checking browser storage',data:{hasStored:!!stored,storageKey:BROWSER_STORAGE_KEY,storedLength:stored?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
			if (stored) {
				const data: WorkerTokenData = JSON.parse(stored);
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:155',message:'Parsed storage data',data:{hasEnvironmentId:!!data.environmentId,hasClientId:!!data.clientId,hasClientSecret:!!data.clientSecret,hasScopes:!!data.scopes},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
				// #endregion
				this.memoryCache = data;
				const extracted = this.extractCredentials(data);
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:157',message:'Extracted credentials',data:{hasExtracted:!!extracted,hasExtractedEnvId:!!extracted?.environmentId,hasExtractedClientId:!!extracted?.clientId,hasExtractedClientSecret:!!extracted?.clientSecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
				// #endregion
				return extracted;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load from browser storage`, error);
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:160',message:'Error loading from browser storage',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
		}

		// Try IndexedDB (backup)
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readonly');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			const request = store.get('worker_token');

			const data = await new Promise<WorkerTokenData | null>((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => reject(request.error);
			});

			if (data) {
				this.memoryCache = data;
				// Restore to browser storage
				try {
					localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to restore to browser storage`, error);
				}
				return this.extractCredentials(data);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load from IndexedDB`, error);
		}

		// Try legacy storage key as fallback (worker_credentials)
		try {
			const legacyStored = localStorage.getItem('worker_credentials');
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:188',message:'Checking legacy storage key',data:{hasLegacyStored:!!legacyStored},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
			if (legacyStored) {
				const legacyData = JSON.parse(legacyStored);
				// Convert legacy format to WorkerTokenData format
				const convertedData: WorkerTokenData = {
					token: '', // Token not in legacy format
					environmentId: legacyData.environmentId,
					clientId: legacyData.clientId,
					clientSecret: legacyData.clientSecret,
					scopes: legacyData.scopes ? (Array.isArray(legacyData.scopes) ? legacyData.scopes : legacyData.scopes.split(/\s+/).filter(Boolean)) : [],
					region: legacyData.region || 'us',
					tokenEndpointAuthMethod: legacyData.authMethod || legacyData.tokenEndpointAuthMethod || 'client_secret_post',
					savedAt: Date.now(),
				};
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:200',message:'Found legacy credentials, converting',data:{hasEnvironmentId:!!convertedData.environmentId,hasClientId:!!convertedData.clientId,hasClientSecret:!!convertedData.clientSecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
				// #endregion
				// Save to new format and cache
				this.memoryCache = convertedData;
				try {
					localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(convertedData));
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to migrate legacy credentials to new storage`, error);
				}
				return this.extractCredentials(convertedData);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load from legacy storage`, error);
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:212',message:'Error loading legacy credentials',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
		}

		return null;
	}

	/**
	 * Synchronous version for backwards compatibility (browser storage only)
	 */
	loadCredentialsSync(): WorkerTokenCredentials | null {
		// Try memory cache
		if (this.memoryCache) {
			return this.extractCredentials(this.memoryCache);
		}

		// Try browser storage
		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				const data: WorkerTokenData = JSON.parse(stored);
				this.memoryCache = data;
				return this.extractCredentials(data);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load from browser storage (sync)`, error);
		}

		// Try legacy storage key as fallback (worker_credentials)
		try {
			const legacyStored = localStorage.getItem('worker_credentials');
			if (legacyStored) {
				const legacyData = JSON.parse(legacyStored);
				// Convert legacy format to WorkerTokenData format
				const convertedData: WorkerTokenData = {
					token: '', // Token not in legacy format
					environmentId: legacyData.environmentId,
					clientId: legacyData.clientId,
					clientSecret: legacyData.clientSecret,
					scopes: legacyData.scopes ? (Array.isArray(legacyData.scopes) ? legacyData.scopes : legacyData.scopes.split(/\s+/).filter(Boolean)) : [],
					region: legacyData.region || 'us',
					tokenEndpointAuthMethod: legacyData.authMethod || legacyData.tokenEndpointAuthMethod || 'client_secret_post',
					savedAt: Date.now(),
				};
				// Save to new format and cache
				this.memoryCache = convertedData;
				try {
					localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(convertedData));
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to migrate legacy credentials to new storage (sync)`, error);
				}
				return this.extractCredentials(convertedData);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load from legacy storage (sync)`, error);
		}

		return null;
	}

	/**
	 * Save worker token (access token) with expiration
	 */
	async saveToken(token: string, expiresAt?: number): Promise<void> {
		const credentials = await this.loadCredentials();
		if (!credentials) {
			throw new Error('No worker token credentials found. Please save credentials first.');
		}

		const data: WorkerTokenData = {
			...credentials,
			token,
			...(expiresAt !== undefined ? { expiresAt } : {}),
			savedAt: Date.now(),
		};

		// Update memory cache
		this.memoryCache = data;

		// Save to browser storage
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save token to browser storage`, error);
		}

		// Save to IndexedDB
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.put({
					id: 'worker_token',
					...data,
				});
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save token to IndexedDB`, error);
		}
	}

	/**
	 * Get worker token (access token) if valid
	 */
	async getToken(): Promise<string | null> {
		const data = await this.loadCredentials();
		if (!data) {
			return null;
		}

		// Check if we have a stored token
		const stored = this.memoryCache || (await this.loadDataFromStorage());
		if (!stored || !stored.token) {
			return null;
		}

		// Check expiration
		if (stored.expiresAt && Date.now() > stored.expiresAt) {
			console.log(`${MODULE_TAG} Token expired, clearing`);
			await this.clearToken();
			return null;
		}

		return stored.token;
	}

	/**
	 * Clear worker token credentials from all storage
	 */
	async clearCredentials(): Promise<void> {
		this.memoryCache = null;

		// Clear browser storage
		try {
			localStorage.removeItem(BROWSER_STORAGE_KEY);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear browser storage`, error);
		}

		// Clear IndexedDB
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			await new Promise<void>((resolve, reject) => {
				const request = store.delete('worker_token');
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear IndexedDB`, error);
		}

		console.log(`${MODULE_TAG} Cleared all credentials`);
	}

	/**
	 * Clear only the access token (keep credentials)
	 */
	async clearToken(): Promise<void> {
		const credentials = await this.loadCredentials();
		if (!credentials) {
			return;
		}

		const data: WorkerTokenData = {
			...credentials,
			token: '',
			savedAt: Date.now(),
		};

		this.memoryCache = data;

		// Update browser storage
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear token from browser storage`, error);
		}

		// Update IndexedDB
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			await new Promise<void>((resolve, reject) => {
				const request = store.put({
					id: 'worker_token',
					...data,
				});
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear token from IndexedDB`, error);
		}
	}

	/**
	 * Check if credentials exist
	 */
	async hasCredentials(): Promise<boolean> {
		return (await this.loadCredentials()) !== null;
	}

	/**
	 * Check if valid token exists
	 */
	async hasValidToken(): Promise<boolean> {
		const token = await this.getToken();
		return token !== null;
	}

	/**
	 * Extract credentials from data object
	 */
	private extractCredentials(data: WorkerTokenData): WorkerTokenCredentials {
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'workerTokenServiceV8.ts:394',message:'extractCredentials called',data:{hasData:!!data,hasEnvironmentId:!!data?.environmentId,hasClientId:!!data?.clientId,hasClientSecret:!!data?.clientSecret},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
		// #endregion
		return {
			environmentId: data.environmentId,
			clientId: data.clientId,
			clientSecret: data.clientSecret,
			...(data.scopes && { scopes: data.scopes }),
			...(data.region && { region: data.region }),
			...(data.tokenEndpointAuthMethod && {
				tokenEndpointAuthMethod: data.tokenEndpointAuthMethod,
			}),
		};
	}

	/**
	 * Load data from storage (helper)
	 */
	private async loadDataFromStorage(): Promise<WorkerTokenData | null> {
		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored) as WorkerTokenData;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load data from storage`, error);
		}
		return null;
	}
}

// Export singleton instance
export const workerTokenServiceV8 = new WorkerTokenServiceV8();

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as unknown as { workerTokenServiceV8: WorkerTokenServiceV8 }).workerTokenServiceV8 =
		workerTokenServiceV8;
}

export default workerTokenServiceV8;
