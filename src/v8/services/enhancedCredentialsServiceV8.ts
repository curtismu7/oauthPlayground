/**
 * @file enhancedCredentialsServiceV8.ts
 * @module v8/services
 * @description Enhanced multi-storage credentials service with IndexedDB, SQLite, and localStorage support
 * @version 1.0.0
 * @since 2026-02-15
 *
 * Features:
 * - Multi-storage backend: IndexedDB (primary), SQLite (server), localStorage (fallback)
 * - Comprehensive user interaction tracking (username, URLs, dropdown choices, etc.)
 * - Automatic storage tier fallback
 * - Data synchronization across storage backends
 * - Security-conscious data handling
 * - Performance monitoring and metrics
 * - Offline support with localStorage fallback
 */

const MODULE_TAG = '[🔐 ENHANCED-CREDENTIALS-V8]';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserInteractionData {
	/** Timestamp of interaction */
	timestamp: string;
	/** User identifier (if available) */
	username?: string;
	/** Application/flow being used */
	appName: string;
	/** Flow type */
	flowType: string;
	/** Environment ID */
	environmentId: string;
	/** Client ID */
	clientId: string;
	/** Issuer/Discovery URL */
	issuerUrl?: string;
	/** Redirect URI used */
	redirectUri?: string;
	/** Selected scopes */
	scopes?: string;
	/** Client auth method chosen */
	clientAuthMethod?: string;
	/** Response type selected */
	responseType?: string;
	/** Dropdown selections */
	selections: {
		/** App/flow selection */
		app?: string;
		/** Environment selection */
		environment?: string;
		/** Auth method selection */
		authMethod?: string;
		/** Flow variant selection */
		flowVariant?: string;
		/** Custom dropdown choices */
		customChoices?: Record<string, string>;
	};
	/** Form field interactions */
	fieldInteractions: {
		/** Fields that were modified */
		modifiedFields: string[];
		/** Fields that were validated */
		validatedFields: string[];
		/** Fields with errors */
		errorFields: string[];
		/** Time spent on each field (ms) */
		fieldTimeSpent?: Record<string, number>;
	};
	/** Session information */
	sessionInfo: {
		/** Session start time */
		sessionStart: string;
		/** Current step in flow */
		currentStep: string;
		/** Total time in session (ms) */
		sessionDuration: number;
		/** Browser/device info */
		userAgent: string;
		/** Page URL */
		pageUrl: string;
	};
	/** Performance metrics */
	performance: {
		/** Time to load credentials (ms) */
		loadTime: number;
		/** Time to save credentials (ms) */
		saveTime: number;
		/** Storage backend used */
		storageBackend: 'indexeddb' | 'sqlite' | 'localStorage';
		/** Cache hit status */
		cacheHit: boolean;
	};
}

export interface EnhancedCredentials {
	/** Basic credential fields */
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	issuerUrl?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	logoutUri?: string;
	scopes?: string;
	loginHint?: string;
	/** Auth configuration */
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	responseType?: string;
	/** User interaction tracking */
	interactionHistory: UserInteractionData[];
	/** Metadata */
	metadata: {
		/** Last updated timestamp */
		lastUpdated: string;
		/** Created timestamp */
		createdAt: string;
		/** Storage backends used */
		storageBackends: ('indexeddb' | 'sqlite' | 'localStorage')[];
		/** Sync status across backends */
		syncStatus: 'synced' | 'pending' | 'failed';
		/** Data version for migrations */
		version: number;
	};
}

export interface StorageBackend {
	/** Backend identifier */
	name: 'indexeddb' | 'sqlite' | 'localStorage';
	/** Priority order (lower = higher priority) */
	priority: number;
	/** Whether backend is available */
	available: boolean;
	/** Backend capabilities */
	capabilities: {
		/** Can store large objects */
		largeObjects: boolean;
		/** Supports indexing */
		indexing: boolean;
		/** Supports transactions */
		transactions: boolean;
		/** Persistent across sessions */
		persistent: boolean;
		/** Server-side storage */
		serverSide: boolean;
	};
}

export interface StorageMetrics {
	/** Operation counts */
	operations: {
		reads: number;
		writes: number;
		errors: number;
		syncs: number;
	};
	/** Performance metrics */
	performance: {
		avgReadTime: number;
		avgWriteTime: number;
		avgSyncTime: number;
		cacheHitRate: number;
	};
	/** Backend usage */
	backendUsage: Record<string, number>;
	/** Storage usage */
	storageUsage: {
		indexedDB?: number;
		sqlite?: number;
		localStorage?: number;
	};
}

// ============================================================================
// INDEXEDDB IMPLEMENTATION
// ============================================================================

class IndexedDBStorage {
	private constructor() {}

	private static DB_NAME = 'OAuthPlayground_Enhanced';
	private static DB_VERSION = 1;
	private static STORE_NAME = 'enhanced_credentials';

	/**
	 * Initialize IndexedDB database
	 */
	private static async initDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(IndexedDBStorage.DB_NAME, IndexedDBStorage.DB_VERSION);

			request.onerror = () => {
				console.error(`${MODULE_TAG} IndexedDB open failed:`, request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				console.log(`${MODULE_TAG} IndexedDB opened successfully`);
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create credentials store with indexes
				if (!db.objectStoreNames.contains(IndexedDBStorage.STORE_NAME)) {
					const store = db.createObjectStore(IndexedDBStorage.STORE_NAME, {
						keyPath: 'environmentId',
					});

					// Create indexes for common queries
					store.createIndex('clientId', 'clientId', { unique: false });
					store.createIndex('lastUpdated', 'metadata.lastUpdated', { unique: false });
					store.createIndex('flowType', 'interactionHistory.appName', { unique: false });
					store.createIndex('username', 'interactionHistory.username', { unique: false });

					console.log(`${MODULE_TAG} IndexedDB schema created`);
				}
			};
		});
	}

	/**
	 * Save credentials to IndexedDB
	 */
	static async save(environmentId: string, credentials: EnhancedCredentials): Promise<boolean> {
		try {
			const db = await IndexedDBStorage.initDB();

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([IndexedDBStorage.STORE_NAME], 'readwrite');
				const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);

				const request = store.put(credentials);

				request.onsuccess = () => {
					console.log(`${MODULE_TAG} Credentials saved to IndexedDB: ${environmentId}`);
					resolve(true);
				};

				request.onerror = () => {
					console.error(`${MODULE_TAG} IndexedDB save failed:`, request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error(`${MODULE_TAG} IndexedDB save error:`, error);
			return false;
		}
	}

	/**
	 * Load credentials from IndexedDB
	 */
	static async load(environmentId: string): Promise<EnhancedCredentials | null> {
		try {
			const db = await IndexedDBStorage.initDB();

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([IndexedDBStorage.STORE_NAME], 'readonly');
				const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);

				const request = store.get(environmentId);

				request.onsuccess = () => {
					const result = request.result as EnhancedCredentials | undefined;
					if (result) {
						console.log(`${MODULE_TAG} Credentials loaded from IndexedDB: ${environmentId}`);
						resolve(result);
					} else {
						console.log(`${MODULE_TAG} No credentials found in IndexedDB: ${environmentId}`);
						resolve(null);
					}
				};

				request.onerror = () => {
					console.error(`${MODULE_TAG} IndexedDB load failed:`, request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error(`${MODULE_TAG} IndexedDB load error:`, error);
			return null;
		}
	}

	/**
	 * List all stored credentials
	 */
	static async list(): Promise<Array<{ environmentId: string; credentials: EnhancedCredentials }>> {
		try {
			const db = await IndexedDBStorage.initDB();

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([IndexedDBStorage.STORE_NAME], 'readonly');
				const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);

				const request = store.getAll();

				request.onsuccess = () => {
					const results = request.result
						.filter((item: EnhancedCredentials) => item.environmentId)
						.map((item: EnhancedCredentials) => ({
							environmentId: item.environmentId!,
							credentials: item,
						}));
					resolve(results);
				};

				request.onerror = () => {
					console.error(`${MODULE_TAG} IndexedDB list failed:`, request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error(`${MODULE_TAG} IndexedDB list error:`, error);
			return [];
		}
	}

	/**
	 * Clear credentials from IndexedDB
	 */
	static async clear(environmentId: string): Promise<boolean> {
		try {
			const db = await IndexedDBStorage.initDB();

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([IndexedDBStorage.STORE_NAME], 'readwrite');
				const store = transaction.objectStore(IndexedDBStorage.STORE_NAME);

				const request = store.delete(environmentId);

				request.onsuccess = () => {
					console.log(`${MODULE_TAG} Credentials cleared from IndexedDB: ${environmentId}`);
					resolve(true);
				};

				request.onerror = () => {
					console.error(`${MODULE_TAG} IndexedDB clear failed:`, request.error);
					reject(request.error);
				};
			});
		} catch (error) {
			console.error(`${MODULE_TAG} IndexedDB clear error:`, error);
			return false;
		}
	}

	/**
	 * Check if IndexedDB is available
	 */
	static isAvailable(): boolean {
		return 'indexedDB' in window && indexedDB !== null;
	}
}

// ============================================================================
// SQLITE STORAGE IMPLEMENTATION (SERVER-SIDE)
// ============================================================================

class SQLiteStorage {
	private constructor() {}
	private static API_ENDPOINT = '/api/credentials/sqlite';

	/**
	 * Save credentials to server SQLite database
	 */
	static async save(environmentId: string, credentials: EnhancedCredentials): Promise<boolean> {
		try {
			const response = await fetch(`${SQLiteStorage.API_ENDPOINT}/save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					credentials,
					timestamp: new Date().toISOString(),
				}),
			});

			if (response.ok) {
				console.log(`${MODULE_TAG} Credentials saved to SQLite: ${environmentId}`);
				return true;
			} else {
				console.warn(`${MODULE_TAG} SQLite save failed: ${response.status}`);
				return false;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} SQLite save error:`, error);
			return false;
		}
	}

	/**
	 * Load credentials from server SQLite database
	 */
	static async load(environmentId: string): Promise<EnhancedCredentials | null> {
		try {
			const response = await fetch(
				`${SQLiteStorage.API_ENDPOINT}/load?environmentId=${encodeURIComponent(environmentId)}`
			);

			if (response.ok) {
				const data = await response.json();
				if (data.credentials) {
					console.log(`${MODULE_TAG} Credentials loaded from SQLite: ${environmentId}`);
					return data.credentials;
				}
			} else {
				console.warn(`${MODULE_TAG} SQLite load failed: ${response.status}`);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} SQLite load error:`, error);
		}

		return null;
	}

	/**
	 * List all credentials from SQLite
	 */
	static async list(): Promise<Array<{ environmentId: string; credentials: EnhancedCredentials }>> {
		try {
			const response = await fetch(`${SQLiteStorage.API_ENDPOINT}/list`);

			if (response.ok) {
				const data = await response.json();
				return data.credentials || [];
			}
		} catch (error) {
			console.error(`${MODULE_TAG} SQLite list error:`, error);
		}

		return [];
	}

	/**
	 * Clear credentials from SQLite
	 */
	static async clear(environmentId: string): Promise<boolean> {
		try {
			const response = await fetch(`${SQLiteStorage.API_ENDPOINT}/clear`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ environmentId }),
			});

			if (response.ok) {
				console.log(`${MODULE_TAG} Credentials cleared from SQLite: ${environmentId}`);
				return true;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} SQLite clear error:`, error);
		}

		return false;
	}

	/**
	 * Check if SQLite storage is available
	 */
	static async isAvailable(): Promise<boolean> {
		try {
			const response = await fetch(`${SQLiteStorage.API_ENDPOINT}/health`, {
				method: 'HEAD',
				cache: 'no-cache',
			});
			return response.ok;
		} catch {
			return false;
		}
	}
}

// ============================================================================
// LOCALSTORAGE FALLBACK
// ============================================================================

class LocalStorageFallback {
	private constructor() {}
	private static STORAGE_KEY = 'enhanced_credentials_v8';

	/**
	 * Save credentials to localStorage
	 */
	static save(environmentId: string, credentials: EnhancedCredentials): boolean {
		try {
			const existing = LocalStorageFallback.loadAll();
			existing[environmentId] = credentials;

			localStorage.setItem(LocalStorageFallback.STORAGE_KEY, JSON.stringify(existing));
			console.log(`${MODULE_TAG} Credentials saved to localStorage: ${environmentId}`);
			return true;
		} catch (error) {
			console.error(`${MODULE_TAG} localStorage save error:`, error);
			return false;
		}
	}

	/**
	 * Load credentials from localStorage
	 */
	static load(environmentId: string): EnhancedCredentials | null {
		try {
			const all = LocalStorageFallback.loadAll();
			return all[environmentId] || null;
		} catch (error) {
			console.error(`${MODULE_TAG} localStorage load error:`, error);
			return null;
		}
	}

	/**
	 * Load all credentials from localStorage
	 */
	static loadAll(): Record<string, EnhancedCredentials> {
		try {
			const stored = localStorage.getItem(LocalStorageFallback.STORAGE_KEY);
			return stored ? JSON.parse(stored) : {};
		} catch {
			return {};
		}
	}

	/**
	 * Clear credentials from localStorage
	 */
	static clear(environmentId: string): boolean {
		try {
			const all = LocalStorageFallback.loadAll();
			delete all[environmentId];
			localStorage.setItem(LocalStorageFallback.STORAGE_KEY, JSON.stringify(all));
			console.log(`${MODULE_TAG} Credentials cleared from localStorage: ${environmentId}`);
			return true;
		} catch (error) {
			console.error(`${MODULE_TAG} localStorage clear error:`, error);
			return false;
		}
	}

	/**
	 * Check if localStorage is available
	 */
	static isAvailable(): boolean {
		try {
			const test = '__localStorage_test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch {
			return false;
		}
	}
}

// ============================================================================
// MAIN ENHANCED CREDENTIALS SERVICE
// ============================================================================

export class EnhancedCredentialsServiceV8 {
	private constructor() {}
	private static metrics: StorageMetrics = {
		operations: { reads: 0, writes: 0, errors: 0, syncs: 0 },
		performance: { avgReadTime: 0, avgWriteTime: 0, avgSyncTime: 0, cacheHitRate: 0 },
		backendUsage: { indexeddb: 0, sqlite: 0, localStorage: 0 },
		storageUsage: {},
	};

	/**
	 * Get available storage backends in priority order
	 */
	private static async getAvailableBackends(): Promise<StorageBackend[]> {
		const backends: StorageBackend[] = [
			{
				name: 'indexeddb',
				priority: 1,
				available: IndexedDBStorage.isAvailable(),
				capabilities: {
					largeObjects: true,
					indexing: true,
					transactions: true,
					persistent: true,
					serverSide: false,
				},
			},
			{
				name: 'sqlite',
				priority: 2,
				available: await SQLiteStorage.isAvailable(),
				capabilities: {
					largeObjects: true,
					indexing: true,
					transactions: true,
					persistent: true,
					serverSide: true,
				},
			},
			{
				name: 'localStorage',
				priority: 3,
				available: LocalStorageFallback.isAvailable(),
				capabilities: {
					largeObjects: false,
					indexing: false,
					transactions: false,
					persistent: true,
					serverSide: false,
				},
			},
		];

		return backends.filter((backend) => backend.available).sort((a, b) => a.priority - b.priority);
	}

	/**
	 * Save credentials with comprehensive tracking
	 */
	static async save(
		environmentId: string,
		credentials: Partial<EnhancedCredentials>,
		interactionData?: Partial<UserInteractionData>
	): Promise<{ success: boolean; backend: string; error?: string }> {
		const startTime = performance.now();

		try {
			// Load existing credentials
			const existing = await EnhancedCredentialsServiceV8.load(environmentId);

			// Create enhanced credentials object
			const enhanced: EnhancedCredentials = {
				...existing,
				...credentials,
				metadata: {
					lastUpdated: new Date().toISOString(),
					createdAt: existing?.metadata?.createdAt || new Date().toISOString(),
					storageBackends: existing?.metadata?.storageBackends || [],
					syncStatus: 'pending',
					version: 1,
				},
				interactionHistory: [
					...(existing?.interactionHistory || []),
					...(interactionData
						? [
								{
									timestamp: new Date().toISOString(),
									appName: interactionData.appName || 'unknown',
									flowType: interactionData.flowType || 'unknown',
									environmentId,
									clientId: credentials.clientId || '',
									issuerUrl: credentials.issuerUrl,
									redirectUri: credentials.redirectUri,
									scopes: credentials.scopes,
									clientAuthMethod: credentials.clientAuthMethod,
									responseType: credentials.responseType,
									selections: interactionData.selections || {},
									fieldInteractions: interactionData.fieldInteractions || {
										modifiedFields: [],
										validatedFields: [],
										errorFields: [],
									},
									sessionInfo: {
										sessionStart: new Date().toISOString(),
										currentStep: interactionData.sessionInfo?.currentStep || 'credentials',
										sessionDuration: 0,
										userAgent: navigator.userAgent,
										pageUrl: window.location.href,
									},
									performance: {
										loadTime: 0,
										saveTime: performance.now() - startTime,
										storageBackend: 'indexeddb' as const,
										cacheHit: false,
									},
								} as UserInteractionData,
							]
						: []),
				].slice(-50), // Keep last 50 interactions
			};

			// Try each available backend in priority order
			const backends = await EnhancedCredentialsServiceV8.getAvailableBackends();
			let lastError: string | undefined;

			for (const backend of backends) {
				try {
					let success = false;

					switch (backend.name) {
						case 'indexeddb': {
							success = await IndexedDBStorage.save(environmentId, enhanced);
							break;
						}
						case 'sqlite': {
							success = await SQLiteStorage.save(environmentId, enhanced);
							break;
						}
						case 'localStorage': {
							success = await LocalStorageFallback.save(environmentId, enhanced);
							break;
						}
					}

					if (success) {
						// Update metrics
						EnhancedCredentialsServiceV8.metrics.operations.writes++;
						EnhancedCredentialsServiceV8.metrics.backendUsage[backend.name] =
							(EnhancedCredentialsServiceV8.metrics.backendUsage[backend.name] || 0) + 1;
						EnhancedCredentialsServiceV8.metrics.performance.avgWriteTime =
							(EnhancedCredentialsServiceV8.metrics.performance.avgWriteTime +
								(performance.now() - startTime)) /
							2;

						// Update metadata
						enhanced.metadata.storageBackends = [
							...new Set([...enhanced.metadata.storageBackends, backend.name]),
						];
						enhanced.metadata.syncStatus = 'synced';

						console.log(`${MODULE_TAG} Credentials saved successfully using ${backend.name}`);
						return { success: true, backend: backend.name };
					}
				} catch (error) {
					lastError = error instanceof Error ? error.message : String(error);
					console.warn(`${MODULE_TAG} Backend ${backend.name} failed:`, lastError);
				}
			}

			// All backends failed
			EnhancedCredentialsServiceV8.metrics.operations.errors++;
			return { success: false, backend: 'none', ...(lastError && { error: lastError }) };
		} catch (error) {
			EnhancedCredentialsServiceV8.metrics.operations.errors++;
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`${MODULE_TAG} Save failed:`, errorMessage);
			return { success: false, backend: 'none', error: errorMessage };
		}
	}

	/**
	 * Load credentials from available backends
	 */
	static async load(environmentId: string): Promise<EnhancedCredentials | null> {
		const startTime = performance.now();

		try {
			const backends = await EnhancedCredentialsServiceV8.getAvailableBackends();

			for (const backend of backends) {
				try {
					let credentials: EnhancedCredentials | null = null;

					switch (backend.name) {
						case 'indexeddb':
							credentials = await IndexedDBStorage.load(environmentId);
							break;
						case 'sqlite':
							credentials = await SQLiteStorage.load(environmentId);
							break;
						case 'localStorage':
							credentials = LocalStorageFallback.load(environmentId);
							break;
					}

					if (credentials) {
						// Update metrics
						EnhancedCredentialsServiceV8.metrics.operations.reads++;
						EnhancedCredentialsServiceV8.metrics.backendUsage[backend.name] =
							(EnhancedCredentialsServiceV8.metrics.backendUsage[backend.name] || 0) + 1;
						EnhancedCredentialsServiceV8.metrics.performance.avgReadTime =
							(EnhancedCredentialsServiceV8.metrics.performance.avgReadTime +
								(performance.now() - startTime)) /
							2;

						console.log(`${MODULE_TAG} Credentials loaded from ${backend.name}: ${environmentId}`);
						return credentials;
					}
				} catch (error) {
					console.warn(`${MODULE_TAG} Backend ${backend.name} load failed:`, error);
				}
			}

			console.log(`${MODULE_TAG} No credentials found for ${environmentId}`);
			return null;
		} catch (error) {
			EnhancedCredentialsServiceV8.metrics.operations.errors++;
			console.error(`${MODULE_TAG} Load failed:`, error);
			return null;
		}
	}

	/**
	 * List all credentials across backends
	 */
	static async list(): Promise<
		Array<{ environmentId: string; credentials: EnhancedCredentials; backend: string }>
	> {
		const results: Array<{
			environmentId: string;
			credentials: EnhancedCredentials;
			backend: string;
		}> = [];
		const seen = new Set<string>();

		try {
			const backends = await EnhancedCredentialsServiceV8.getAvailableBackends();

			for (const backend of backends) {
				try {
					let backendResults: Array<{ environmentId: string; credentials: EnhancedCredentials }> =
						[];

					switch (backend.name) {
						case 'indexeddb': {
							backendResults = await IndexedDBStorage.list();
							break;
						}
						case 'sqlite': {
							backendResults = await SQLiteStorage.list();
							break;
						}
						case 'localStorage': {
							const all = LocalStorageFallback.loadAll();
							backendResults = Object.entries(all).map(([envId, creds]) => ({
								environmentId: envId,
								credentials: creds,
							}));
							break;
						}
					}

					for (const item of backendResults) {
						if (!seen.has(item.environmentId)) {
							results.push({ ...item, backend: backend.name });
							seen.add(item.environmentId);
						}
					}
				} catch (error) {
					console.warn(`${MODULE_TAG} Backend ${backend.name} list failed:`, error);
				}
			}

			return results;
		} catch (error) {
			console.error(`${MODULE_TAG} List failed:`, error);
			return [];
		}
	}

	/**
	 * Clear credentials from all backends
	 */
	static async clear(
		environmentId: string
	): Promise<{ success: boolean; backends: string[]; errors?: string[] }> {
		const successfulBackends: string[] = [];
		const errors: string[] = [];

		try {
			const backends = await EnhancedCredentialsServiceV8.getAvailableBackends();

			for (const backend of backends) {
				try {
					let success = false;

					switch (backend.name) {
						case 'indexeddb':
							success = await IndexedDBStorage.clear(environmentId);
							break;
						case 'sqlite':
							success = await SQLiteStorage.clear(environmentId);
							break;
						case 'localStorage':
							success = LocalStorageFallback.clear(environmentId);
							break;
					}

					if (success) {
						successfulBackends.push(backend.name);
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					errors.push(`${backend.name}: ${errorMessage}`);
				}
			}

			return {
				success: successfulBackends.length > 0,
				backends: successfulBackends,
				...(errors.length > 0 && { errors }),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Clear failed:`, error);
			return { success: false, backends: [], errors: ['Unexpected error'] };
		}
	}

	/**
	 * Get storage metrics
	 */
	static getMetrics(): StorageMetrics {
		return { ...EnhancedCredentialsServiceV8.metrics };
	}

	/**
	 * Track user interaction
	 */
	static trackInteraction(environmentId: string, interaction: Partial<UserInteractionData>): void {
		// This can be called frequently, so we'll batch updates
		// Implementation would depend on specific tracking requirements
		console.log(`${MODULE_TAG} Tracking interaction for ${environmentId}:`, interaction);
	}

	/**
	 * Sync credentials across backends
	 */
	static async sync(
		environmentId: string
	): Promise<{ success: boolean; syncedBackends: string[]; errors?: string[] }> {
		const startTime = performance.now();
		const syncedBackends: string[] = [];
		const errors: string[] = [];

		try {
			// Load from primary backend
			const credentials = await EnhancedCredentialsServiceV8.load(environmentId);
			if (!credentials) {
				return { success: false, syncedBackends: [], errors: ['No credentials found'] };
			}

			// Save to all available backends
			const backends = await EnhancedCredentialsServiceV8.getAvailableBackends();

			for (const backend of backends) {
				try {
					let success = false;

					switch (backend.name) {
						case 'indexeddb':
							success = await IndexedDBStorage.save(environmentId, credentials);
							break;
						case 'sqlite':
							success = await SQLiteStorage.save(environmentId, credentials);
							break;
						case 'localStorage':
							success = LocalStorageFallback.save(environmentId, credentials);
							break;
					}

					if (success) {
						syncedBackends.push(backend.name);
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					errors.push(`${backend.name}: ${errorMessage}`);
				}
			}

			// Update metrics
			EnhancedCredentialsServiceV8.metrics.operations.syncs++;
			EnhancedCredentialsServiceV8.metrics.performance.avgSyncTime =
				(EnhancedCredentialsServiceV8.metrics.performance.avgSyncTime +
					(performance.now() - startTime)) /
				2;

			return {
				success: syncedBackends.length > 1,
				syncedBackends,
				...(errors.length > 0 && { errors }),
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Sync failed:`, error);
			return { success: false, syncedBackends: [], errors: ['Sync failed'] };
		}
	}

	/**
	 * Get storage backend status
	 */
	static async getBackendStatus(): Promise<StorageBackend[]> {
		return await EnhancedCredentialsServiceV8.getAvailableBackends();
	}

	/**
	 * Migrate data from old storage format
	 */
	static async migrateFromOldFormat(): Promise<{
		success: boolean;
		migrated: number;
		errors?: string[];
	}> {
		const errors: string[] = [];
		let migrated = 0;

		try {
			// Check for old shared credentials
			const oldKey = 'v8_shared_credentials';
			const oldData = localStorage.getItem(oldKey);

			if (oldData) {
				try {
					const oldCredentials = JSON.parse(oldData);

					if (oldCredentials.environmentId) {
						// Create enhanced credentials from old format
						const enhanced: EnhancedCredentials = {
							environmentId: oldCredentials.environmentId,
							clientId: oldCredentials.clientId,
							clientSecret: oldCredentials.clientSecret,
							issuerUrl: oldCredentials.issuerUrl,
							clientAuthMethod: oldCredentials.clientAuthMethod,
							interactionHistory: [
								{
									timestamp: new Date().toISOString(),
									appName: 'migration',
									flowType: 'legacy',
									environmentId: oldCredentials.environmentId,
									clientId: oldCredentials.clientId || '',
									selections: {},
									fieldInteractions: { modifiedFields: [], validatedFields: [], errorFields: [] },
									sessionInfo: {
										sessionStart: new Date().toISOString(),
										currentStep: 'migration',
										sessionDuration: 0,
										userAgent: navigator.userAgent,
										pageUrl: window.location.href,
									},
									performance: {
										loadTime: 0,
										saveTime: 0,
										storageBackend: 'localStorage',
										cacheHit: false,
									},
								},
							],
							metadata: {
								lastUpdated: new Date().toISOString(),
								createdAt: new Date().toISOString(),
								storageBackends: ['localStorage'],
								syncStatus: 'synced',
								version: 1,
							},
						};

						const result = await EnhancedCredentialsServiceV8.save(
							oldCredentials.environmentId,
							enhanced
						);

						if (result.success) {
							migrated++;
							// Clear old data
							localStorage.removeItem(oldKey);
						} else {
							errors.push(`Failed to migrate ${oldCredentials.environmentId}: ${result.error}`);
						}
					}
				} catch (parseError) {
					errors.push(`Failed to parse old credentials: ${parseError}`);
				}
			}

			return { success: migrated > 0, migrated, ...(errors.length > 0 && { errors }) };
		} catch (error) {
			console.error(`${MODULE_TAG} Migration failed:`, error);
			return { success: false, migrated: 0, errors: ['Migration failed'] };
		}
	}
}

export default EnhancedCredentialsServiceV8;
