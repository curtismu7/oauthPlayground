/**
 * @file unifiedWorkerTokenService.ts
 * @description Unified Worker Token Service - Single service for all worker token operations
 * @version 1.0.0
 * 
 * This service consolidates all worker token functionality across the application.
 * It supports different input requirements for different apps while maintaining
 * a single source of truth for worker token management.
 * 
 * Features:
 * - Single unified service for all worker token operations
 * - Flexible credential interface to support different app requirements
 * - Multiple storage layers (localStorage, IndexedDB, memory)
 * - Automatic token lifecycle management
 * - Support for different authentication methods
 * - Cross-app token sharing
 * - Retry logic and error handling
 * - Token validation and expiration handling
 */

const MODULE_TAG = '[🔑 UNIFIED-WORKER-TOKEN]';

// Storage keys
const BROWSER_STORAGE_KEY = 'unified_worker_token';
const INDEXEDDB_STORE_NAME = 'unified_worker_tokens';
const INDEXEDDB_DB_NAME = 'oauth_playground_unified';

// Unified interfaces that support all app requirements
export interface UnifiedWorkerTokenCredentials {
	// Core required fields
	environmentId: string;
	clientId: string;
	clientSecret: string;
	
	// Optional fields for different apps
	scopes?: string[];
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
	tokenEndpointAuthMethod?: 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
	
	// App-specific metadata (optional)
	appId?: string;
	appName?: string;
	appVersion?: string;
	
	// Legacy compatibility fields
	grant_type?: string;
	tokenEndpoint?: string;
}

export interface UnifiedWorkerTokenData {
	token: string;
	credentials: UnifiedWorkerTokenCredentials;
	expiresAt?: number;
	savedAt: number;
	lastUsedAt?: number;
	
	// Token metadata
	tokenType?: string;
	expiresIn?: number;
	scope?: string;
}

export interface UnifiedWorkerTokenStatus {
	hasCredentials: boolean;
	hasToken: boolean;
	tokenValid: boolean;
	tokenExpiresIn?: number;
	lastFetchedAt?: number;
	lastUsedAt?: number;
	appInfo?: {
		appId?: string;
		appName?: string;
		appVersion?: string;
	};
}

export interface WorkerTokenValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

/**
 * Unified Worker Token Service
 * 
 * This is the single source of truth for all worker token operations.
 * It replaces multiple scattered implementations with one unified service.
 */
class UnifiedWorkerTokenService {
	private static instance: UnifiedWorkerTokenService;
	private memoryCache: UnifiedWorkerTokenData | null = null;
	private dbPromise: Promise<IDBDatabase> | null = null;

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	static getInstance(): UnifiedWorkerTokenService {
		if (!UnifiedWorkerTokenService.instance) {
			UnifiedWorkerTokenService.instance = new UnifiedWorkerTokenService();
		}
		return UnifiedWorkerTokenService.instance;
	}

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
					store.createIndex('appId', 'appId', { unique: false });
					store.createIndex('savedAt', 'savedAt', { unique: false });
					store.createIndex('expiresAt', 'expiresAt', { unique: false });
				}
			};
		});

		return this.dbPromise;
	}

	/**
	 * Save worker token credentials
	 */
	async saveCredentials(credentials: UnifiedWorkerTokenCredentials): Promise<void> {
		console.log(`${MODULE_TAG} Saving worker token credentials`);

		const data: UnifiedWorkerTokenData = {
			token: '', // Token will be fetched when needed
			credentials,
			savedAt: Date.now(),
		};

		// Update memory cache
		this.memoryCache = data;

		// Save to localStorage (primary storage)
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save to localStorage`, error);
		}

		// Save to IndexedDB (backup storage)
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

			const record = {
				id: 'unified_worker_token',
				...data,
			};

			await new Promise<void>((resolve, reject) => {
				const request = store.put(record);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save to IndexedDB`, error);
			// Don't throw - localStorage is primary
		}

		console.log(`${MODULE_TAG} ✅ Worker token credentials saved`);
	}

	/**
	 * Load worker token credentials
	 */
	async loadCredentials(): Promise<UnifiedWorkerTokenCredentials | null> {
		// Try memory cache first
		if (this.memoryCache) {
			return this.memoryCache.credentials;
		}

		// Try localStorage (primary)
		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				const data: UnifiedWorkerTokenData = JSON.parse(stored);
				this.memoryCache = data;
				return data.credentials;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load from localStorage`, error);
		}

		// Try IndexedDB (backup)
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readonly');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			const request = store.get('unified_worker_token');

			const data = await new Promise<UnifiedWorkerTokenData | null>((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => reject(request.error);
			});

			if (data) {
				this.memoryCache = data;
				// Restore to localStorage
				try {
					localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
				} catch (error) {
					console.warn(`${MODULE_TAG} Failed to restore to localStorage`, error);
				}
				return data.credentials;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load from IndexedDB`, error);
		}

		// Try legacy storage keys for migration
		return await this.migrateLegacyCredentials();
	}

	/**
	 * Migrate from legacy storage formats
	 */
	private async migrateLegacyCredentials(): Promise<UnifiedWorkerTokenCredentials | null> {
		const legacyKeys = [
			'v8:worker_token',
			'pingone_worker_token_credentials',
			'worker_token',
			'worker_credentials',
		];

		for (const key of legacyKeys) {
			try {
				const stored = localStorage.getItem(key);
				if (stored) {
					const legacyData = JSON.parse(stored);
					
					// Convert to unified format
					const unifiedCredentials: UnifiedWorkerTokenCredentials = {
						environmentId: legacyData.environmentId || legacyData.environment_id,
						clientId: legacyData.clientId || legacyData.client_id,
						clientSecret: legacyData.clientSecret || legacyData.client_secret,
						scopes: legacyData.scopes || (legacyData.scope ? legacyData.scope.split(/\s+/) : undefined),
						region: legacyData.region || 'us',
						customDomain: legacyData.customDomain,
						tokenEndpointAuthMethod: legacyData.tokenEndpointAuthMethod || legacyData.authMethod || 'client_secret_post',
					};

					// Save in unified format
					await this.saveCredentials(unifiedCredentials);
					
					console.log(`${MODULE_TAG} 🔄 Migrated credentials from legacy key: ${key}`);
					return unifiedCredentials;
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to migrate from legacy key ${key}:`, error);
			}
		}

		return null;
	}

	/**
	 * Save worker token (access token)
	 */
	async saveToken(token: string, expiresAt?: number, tokenMetadata?: Partial<UnifiedWorkerTokenData>): Promise<void> {
		const credentials = await this.loadCredentials();
		if (!credentials) {
			throw new Error('No worker token credentials found. Please save credentials first.');
		}

		const data: UnifiedWorkerTokenData = {
			token,
			credentials,
			expiresAt: expiresAt || (Date.now() + 3600 * 1000), // Default 1 hour
			savedAt: Date.now(),
			lastUsedAt: Date.now(),
			...tokenMetadata,
		};

		// Update memory cache
		this.memoryCache = data;

		// Save to localStorage
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save token to localStorage`, error);
		}

		// Save to IndexedDB
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.put({
					id: 'unified_worker_token',
					...data,
				});
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save token to IndexedDB`, error);
		}

		// Broadcast token update event
		this.broadcastTokenUpdate(data);

		console.log(`${MODULE_TAG} ✅ Worker token saved`);
	}

	/**
	 * Get worker token (access token) if valid
	 */
	async getToken(): Promise<string | null> {
		const data = await this.loadDataFromStorage();
		if (!data || !data.token) {
			return null;
		}

		// Check expiration
		if (data.expiresAt && Date.now() > data.expiresAt) {
			console.log(`${MODULE_TAG} Token expired, clearing`);
			await this.clearToken();
			return null;
		}

		// Update last used time
		data.lastUsedAt = Date.now();
		this.memoryCache = data;
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to update last used time`, error);
		}

		return data.token;
	}

	/**
	 * Get worker token status
	 */
	async getStatus(): Promise<UnifiedWorkerTokenStatus> {
		const credentials = await this.loadCredentials();
		const data = this.memoryCache || (await this.loadDataFromStorage());

		return {
			hasCredentials: !!credentials,
			hasToken: !!data?.token,
			tokenValid: data ? this.isTokenValid(data) : false,
			tokenExpiresIn: data ? this.getTokenExpiresIn(data) : undefined,
			lastFetchedAt: data?.savedAt,
			lastUsedAt: data?.lastUsedAt,
			appInfo: credentials ? {
				appId: credentials.appId,
				appName: credentials.appName,
				appVersion: credentials.appVersion,
			} : undefined,
		};
	}

	/**
	 * Validate worker token credentials
	 */
	validateCredentials(credentials: UnifiedWorkerTokenCredentials): WorkerTokenValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];
		const suggestions: string[] = [];

		// Required field validation
		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		} else if (!this.isValidEnvironmentId(credentials.environmentId)) {
			errors.push('Environment ID must be a valid UUID format');
			suggestions.push('Environment ID should be a UUID like: 12345678-1234-1234-1234-123456789012');
		}

		if (!credentials.clientId?.trim()) {
			errors.push('Client ID is required');
		}

		if (!credentials.clientSecret?.trim()) {
			errors.push('Client Secret is required');
		}

		// Business logic validation
		if (credentials.environmentId && credentials.clientId && credentials.environmentId === credentials.clientId) {
			errors.push('Client ID cannot be the same as Environment ID');
		}

		// Scope validation
		if (!credentials.scopes || credentials.scopes.length === 0) {
			warnings.push('No scopes specified - using default MFA scopes');
			suggestions.push('Consider adding specific scopes for your use case');
		}

		// Security recommendations
		if (credentials.clientSecret && credentials.clientSecret.length < 16) {
			warnings.push('Client secret should be at least 16 characters for security');
			suggestions.push('Generate a longer client secret for better security');
		}

		// Auth method recommendations
		if (!credentials.tokenEndpointAuthMethod || credentials.tokenEndpointAuthMethod === 'none') {
			warnings.push('No authentication method specified');
			suggestions.push('Use client_secret_basic or client_secret_post for better security');
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			suggestions,
		};
	}

	/**
	 * Build token endpoint URL
	 */
	buildTokenEndpoint(credentials: UnifiedWorkerTokenCredentials): string {
		if (credentials.tokenEndpoint) {
			return credentials.tokenEndpoint;
		}

		const regionUrls = {
			us: 'https://auth.pingone.com',
			eu: 'https://auth.pingone.eu',
			ap: 'https://auth.pingone.asia',
			ca: 'https://auth.pingone.ca',
		};

		const baseUrl = regionUrls[credentials.region || 'us'];
		return `${baseUrl}/${credentials.environmentId}/as/token`;
	}

	/**
	 * Clear worker token credentials
	 */
	async clearCredentials(): Promise<void> {
		this.memoryCache = null;

		// Clear localStorage
		try {
			localStorage.removeItem(BROWSER_STORAGE_KEY);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear localStorage`, error);
		}

		// Clear IndexedDB
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			await new Promise<void>((resolve, reject) => {
				const request = store.delete('unified_worker_token');
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear IndexedDB`, error);
		}

		console.log(`${MODULE_TAG} ✅ Cleared all worker token data`);
	}

	/**
	 * Clear only the access token (keep credentials)
	 */
	async clearToken(): Promise<void> {
		const credentials = await this.loadCredentials();
		if (!credentials) {
			return;
		}

		const data: UnifiedWorkerTokenData = {
			token: '',
			credentials,
			savedAt: Date.now(),
		};

		this.memoryCache = data;

		// Update localStorage
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear token from localStorage`, error);
		}

		// Update IndexedDB
		try {
			const db = await this.initDB();
			const transaction = db.transaction([INDEXEDDB_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(INDEXEDDB_STORE_NAME);
			await new Promise<void>((resolve, reject) => {
				const request = store.put({
					id: 'unified_worker_token',
					...data,
				});
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear token from IndexedDB`, error);
		}
	}

	// ============================================
	// Private helper methods
	// ============================================

	/**
	 * Load data from storage
	 */
	private async loadDataFromStorage(): Promise<UnifiedWorkerTokenData | null> {
		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored) as UnifiedWorkerTokenData;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load data from storage`, error);
		}
		return null;
	}

	/**
	 * Check if a token is valid (not expired)
	 */
	private isTokenValid(data: UnifiedWorkerTokenData): boolean {
		const now = Date.now();
		const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
		return !data.expiresAt || data.expiresAt > now + bufferTime;
	}

	/**
	 * Get seconds until token expires
	 */
	private getTokenExpiresIn(data: UnifiedWorkerTokenData): number {
		if (!data.expiresAt) return 3600; // Default 1 hour
		return Math.floor((data.expiresAt - Date.now()) / 1000);
	}

	/**
	 * Validate environment ID format (UUID)
	 */
	private isValidEnvironmentId(envId: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(envId);
	}

	/**
	 * Broadcast token update event to other tabs/components
	 */
	private broadcastTokenUpdate(data: UnifiedWorkerTokenData): void {
		window.dispatchEvent(
			new CustomEvent('unified-worker-token-updated', {
				detail: {
					expiresAt: data.expiresAt,
					expiresIn: this.getTokenExpiresIn(data),
					appInfo: data.credentials.appId ? {
						appId: data.credentials.appId,
						appName: data.credentials.appName,
						appVersion: data.credentials.appVersion,
					} : undefined,
				},
			})
		);
	}
}

// Export singleton instance
export const unifiedWorkerTokenService = UnifiedWorkerTokenService.getInstance();

// Export types for backward compatibility
export type { WorkerAccessToken, WorkerTokenCredentials, WorkerTokenStatus } from './unifiedWorkerTokenTypes';

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as unknown as { unifiedWorkerTokenService: typeof unifiedWorkerTokenService }).unifiedWorkerTokenService = unifiedWorkerTokenService;
}

export default unifiedWorkerTokenService;
