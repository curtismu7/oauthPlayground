/**
 * @file unifiedTokenStorageService.ts
 * @description Unified token storage service using IndexedDB and SQLite
 * @version 1.0.0
 * @since 2026-02-15
 *
 * This service provides a unified token storage solution that:
 * 1. Uses IndexedDB as primary storage (browser-native, persistent)
 * 2. Uses SQLite via backend API as backup storage
 * 3. Provides automatic synchronization between storage layers
 * 4. Ensures all apps look up tokens from the same place
 * 5. Supports token lifecycle management and cleanup
 */

import { logger } from '../utils/logger';

const MODULE_TAG = '[🔑 UNIFIED-TOKEN-STORAGE]';
const INDEXEDDB_NAME = 'OAuthPlaygroundTokenStorage';
const INDEXEDDB_VERSION = 1;
const TOKEN_STORE_NAME = 'tokens';

// Token interface for unified storage
export interface UnifiedToken {
	id: string;
	type: 'access_token' | 'refresh_token' | 'id_token' | 'worker_token';
	value: string;
	expiresAt: number | null;
	issuedAt: number;
	scope: string[];
	source: 'oauth_flow' | 'worker_token' | 'manual';
	flowType?: string;
	flowName?: string;
	environmentId?: string;
	clientId?: string;
	metadata?: Record<string, unknown>;
	createdAt: number;
	updatedAt: number;
}

export interface TokenStorageOptions {
	environmentId?: string;
	clientId?: string;
	flowType?: string;
	flowName?: string;
	source?: UnifiedToken['source'];
}

export interface TokenQuery {
	type?: UnifiedToken['type'];
	source?: UnifiedToken['source'];
	environmentId?: string;
	clientId?: string;
	activeOnly?: boolean;
	expiredOnly?: boolean;
}

export interface TokenStorageResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	source?: 'indexeddb' | 'sqlite' | 'cache' | 'none';
}

/**
 * Unified Token Storage Service
 * 
 * Provides centralized token storage with IndexedDB primary storage
 * and SQLite backup via backend API.
 */
export class UnifiedTokenStorageService {
	private static instance: UnifiedTokenStorageService | null = null;
	private db: IDBDatabase | null = null;
	private isInitialized = false;
	private cache: Map<string, UnifiedToken> = new Map();
	private readonly CACHE_KEY = 'unified_token_cache';

	private constructor() {
		this.initializeIndexedDB();
	}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): UnifiedTokenStorageService {
		if (!UnifiedTokenStorageService.instance) {
			UnifiedTokenStorageService.instance = new UnifiedTokenStorageService();
		}
		return UnifiedTokenStorageService.instance;
	}

	/**
	 * Initialize IndexedDB database
	 */
	private async initializeIndexedDB(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.isInitialized) {
				resolve();
				return;
			}

			const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);

			request.onerror = () => {
				logger.error(MODULE_TAG, 'Failed to open IndexedDB', request.error || undefined);
				reject(request.error);
			};

			request.onsuccess = () => {
				this.db = request.result;
				this.isInitialized = true;
				logger.info(MODULE_TAG, 'IndexedDB initialized successfully');
				this.loadCache();
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create tokens object store
				if (!db.objectStoreNames.contains(TOKEN_STORE_NAME)) {
					const store = db.createObjectStore(TOKEN_STORE_NAME, { keyPath: 'id' });
					
					// Create indexes for efficient querying
					store.createIndex('type', 'type', { unique: false });
					store.createIndex('source', 'source', { unique: false });
					store.createIndex('environmentId', 'environmentId', { unique: false });
					store.createIndex('clientId', 'clientId', { unique: false });
					store.createIndex('expiresAt', 'expiresAt', { unique: false });
					store.createIndex('issuedAt', 'issuedAt', { unique: false });
					
					logger.info(MODULE_TAG, 'IndexedDB schema created');
				}
			};
		});
	}

	/**
	 * Load cache from localStorage for fast access
	 */
	private loadCache(): void {
		try {
			const cached = localStorage.getItem(this.CACHE_KEY);
			if (cached) {
				const tokens = JSON.parse(cached) as UnifiedToken[];
				tokens.forEach(token => {
				this.cache.set(token.id, token);
			});
				logger.debug(MODULE_TAG, `Loaded ${tokens.length} tokens from cache`);
			}
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to load cache', error as Error);
		}
	}

	/**
	 * Save cache to localStorage
	 */
	private saveCache(): void {
		try {
			const tokens = Array.from(this.cache.values());
			localStorage.setItem(this.CACHE_KEY, JSON.stringify(tokens));
			logger.debug(MODULE_TAG, `Saved ${tokens.length} tokens to cache`);
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to save cache', error as Error);
		}
	}

	/**
	 * Store a token in all storage layers
	 */
	public async storeToken(token: Omit<UnifiedToken, 'id' | 'createdAt' | 'updatedAt'>, options?: TokenStorageOptions): Promise<TokenStorageResult<string>> {
		try {
			await this.initializeIndexedDB();

			const unifiedToken: UnifiedToken = {
				...token,
				id: this.generateTokenId(token),
				createdAt: Date.now(),
				updatedAt: Date.now(),
				...options,
			};

			// Store in IndexedDB
			await this.storeInIndexedDB(unifiedToken);
			
			// Store in cache
			this.cache.set(unifiedToken.id, unifiedToken);
			this.saveCache();

			// Store in SQLite via backend (async, don't wait)
			this.storeInSQLite(unifiedToken).catch(error => {
				logger.warn(MODULE_TAG, 'Failed to store token in SQLite', undefined, error);
			});

			logger.info(MODULE_TAG, 'Token stored successfully', {
				tokenId: unifiedToken.id,
				type: token.type,
				source: token.source,
			});

			return {
				success: true,
				data: unifiedToken.id,
				source: 'indexeddb',
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to store token', undefined, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				source: 'none',
			};
		}
	}

	/**
	 * Store token in IndexedDB
	 */
	private async storeInIndexedDB(token: UnifiedToken): Promise<void> {
		if (!this.db) throw new Error('IndexedDB not initialized');

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([TOKEN_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(TOKEN_STORE_NAME);
			const request = store.put(token);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Store token in SQLite via backend API
	 */
	private async storeInSQLite(token: UnifiedToken): Promise<void> {
		try {
			const response = await fetch('/api/tokens/store', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(token),
			});

			if (!response.ok) {
				throw new Error(`SQLite storage failed: ${response.statusText}`);
			}

			logger.debug(MODULE_TAG, 'Token stored in SQLite', { tokenId: token.id });
		} catch (error) {
			logger.warn(MODULE_TAG, 'SQLite storage failed', undefined, error);
			throw error;
		}
	}

	/**
	 * Retrieve tokens by query
	 */
	public async getTokens(query?: TokenQuery): Promise<TokenStorageResult<UnifiedToken[]>> {
		try {
			await this.initializeIndexedDB();

			// First try cache for performance
			const cachedTokens = this.queryCache(query);
			if (cachedTokens.length > 0) {
				return {
					success: true,
					data: cachedTokens,
					source: 'cache',
				};
			}

			// Then try IndexedDB
			const indexedDbTokens = await this.queryIndexedDB(query);
			if (indexedDbTokens.length > 0) {
				// Update cache
				indexedDbTokens.forEach(token => this.cache.set(token.id, token));
				this.saveCache();

				return {
					success: true,
					data: indexedDbTokens,
					source: 'indexeddb',
				};
			}

			// Finally try SQLite as fallback
			const sqliteTokens = await this.querySQLite(query);
			if (sqliteTokens.length > 0) {
			// Update cache and IndexedDB
			for (const token of sqliteTokens) {
				this.cache.set(token.id, token);
				await this.storeInIndexedDB(token);
			}
				this.saveCache();

				return {
					success: true,
					data: sqliteTokens,
					source: 'sqlite',
				};
			}

			return {
				success: true,
				data: [],
				source: 'none',
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to get tokens', undefined, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				source: 'none',
			};
		}
	}

	/**
	 * Query cache
	 */
	private queryCache(query?: TokenQuery): UnifiedToken[] {
		const tokens = Array.from(this.cache.values());
		return this.filterTokens(tokens, query);
	}

	/**
	 * Query IndexedDB
	 */
	private async queryIndexedDB(query?: TokenQuery): Promise<UnifiedToken[]> {
		if (!this.db) throw new Error('IndexedDB not initialized');

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([TOKEN_STORE_NAME], 'readonly');
			const store = transaction.objectStore(TOKEN_STORE_NAME);
			const request = store.getAll();

			request.onsuccess = () => {
				const tokens = request.result as UnifiedToken[];
				const filtered = this.filterTokens(tokens, query);
				resolve(filtered);
			};

			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Query SQLite via backend API
	 */
	private async querySQLite(query?: TokenQuery): Promise<UnifiedToken[]> {
		try {
			const params = new URLSearchParams();
			if (query?.type) params.append('type', query.type);
			if (query?.source) params.append('source', query.source);
			if (query?.environmentId) params.append('environmentId', query.environmentId);
			if (query?.clientId) params.append('clientId', query.clientId);
			if (query?.activeOnly) params.append('activeOnly', 'true');
			if (query?.expiredOnly) params.append('expiredOnly', 'true');

			const response = await fetch(`/api/tokens/query?${params.toString()}`);
			if (!response.ok) {
				throw new Error(`SQLite query failed: ${response.statusText}`);
			}

			const tokens = await response.json() as UnifiedToken[];
			return tokens;
		} catch (error) {
			logger.warn(MODULE_TAG, 'SQLite query failed', undefined, error);
			return [];
		}
	}

	/**
	 * Filter tokens based on query
	 */
	private filterTokens(tokens: UnifiedToken[], query?: TokenQuery): UnifiedToken[] {
		if (!query) return tokens;

		return tokens.filter(token => {
			if (query.type && token.type !== query.type) return false;
			if (query.source && token.source !== query.source) return false;
			if (query.environmentId && token.environmentId !== query.environmentId) return false;
			if (query.clientId && token.clientId !== query.clientId) return false;
			
			const now = Date.now();
			if (query.activeOnly && (!token.expiresAt || token.expiresAt <= now)) return false;
			if (query.expiredOnly && (!token.expiresAt || token.expiresAt > now)) return false;

			return true;
		});
	}

	/**
	 * Get a specific token by ID
	 */
	public async getToken(tokenId: string): Promise<TokenStorageResult<UnifiedToken | null>> {
		try {
			// Check cache first
			const cached = this.cache.get(tokenId);
			if (cached) {
				return {
					success: true,
					data: cached,
					source: 'cache',
				};
			}

			// Check IndexedDB
			await this.initializeIndexedDB();
			const indexedDbToken = await this.getFromIndexedDB(tokenId);
			if (indexedDbToken) {
				this.cache.set(tokenId, indexedDbToken);
				return {
					success: true,
					data: indexedDbToken,
					source: 'indexeddb',
				};
			}

			// Check SQLite as fallback
			const sqliteToken = await this.getFromSQLite(tokenId);
			if (sqliteToken) {
				this.cache.set(tokenId, sqliteToken);
				await this.storeInIndexedDB(sqliteToken);
				return {
					success: true,
					data: sqliteToken,
					source: 'sqlite',
				};
			}

			return {
				success: true,
				data: null,
				source: 'none',
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to get token', { tokenId }, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				source: 'none',
			};
		}
	}

	/**
	 * Get token from IndexedDB
	 */
	private async getFromIndexedDB(tokenId: string): Promise<UnifiedToken | null> {
		if (!this.db) throw new Error('IndexedDB not initialized');

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([TOKEN_STORE_NAME], 'readonly');
			const store = transaction.objectStore(TOKEN_STORE_NAME);
			const request = store.get(tokenId);

			request.onsuccess = () => resolve(request.result as UnifiedToken | null);
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Get token from SQLite via backend API
	 */
	private async getFromSQLite(tokenId: string): Promise<UnifiedToken | null> {
		try {
			const response = await fetch(`/api/tokens/${tokenId}`);
			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`SQLite get failed: ${response.statusText}`);
			}

			const token = await response.json() as UnifiedToken;
			return token;
		} catch (error) {
			logger.warn(MODULE_TAG, 'SQLite get failed', { tokenId }, error);
			return null;
		}
	}

	/**
	 * Delete a token from all storage layers
	 */
	public async deleteToken(tokenId: string): Promise<TokenStorageResult<void>> {
		try {
			// Remove from cache
			this.cache.delete(tokenId);
			this.saveCache();

			// Remove from IndexedDB
			await this.deleteFromIndexedDB(tokenId);

			// Remove from SQLite (async, don't wait)
			this.deleteFromSQLite(tokenId).catch(error => {
				logger.warn(MODULE_TAG, 'Failed to delete token from SQLite', { tokenId }, error);
			});

			logger.info(MODULE_TAG, 'Token deleted successfully', { tokenId });

			return {
				success: true,
				source: 'indexeddb',
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to delete token', { tokenId }, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				source: 'none',
			};
		}
	}

	/**
	 * Delete token from IndexedDB
	 */
	private async deleteFromIndexedDB(tokenId: string): Promise<void> {
		if (!this.db) throw new Error('IndexedDB not initialized');

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([TOKEN_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(TOKEN_STORE_NAME);
			const request = store.delete(tokenId);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Delete token from SQLite via backend API
	 */
	private async deleteFromSQLite(tokenId: string): Promise<void> {
		try {
			const response = await fetch(`/api/tokens/${tokenId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`SQLite delete failed: ${response.statusText}`);
			}

			logger.debug(MODULE_TAG, 'Token deleted from SQLite', { tokenId });
		} catch (error) {
			logger.warn(MODULE_TAG, 'SQLite delete failed', { tokenId }, error);
			throw error;
		}
	}

	/**
	 * Clean up expired tokens
	 */
	public async cleanupExpiredTokens(): Promise<TokenStorageResult<number>> {
		try {
			const now = Date.now();
			const allTokensResult = await this.getTokens();
			
			if (!allTokensResult.success || !allTokensResult.data) {
				throw new Error('Failed to get tokens for cleanup');
			}

			const expiredTokens = allTokensResult.data.filter(token => 
				token.expiresAt && token.expiresAt <= now
			);

			let deletedCount = 0;
			for (const token of expiredTokens) {
				const deleteResult = await this.deleteToken(token.id);
				if (deleteResult.success) {
					deletedCount++;
				}
			}

			logger.info(MODULE_TAG, 'Cleanup completed', {
				totalTokens: allTokensResult.data.length,
				expiredTokens: expiredTokens.length,
				deletedCount,
			});

			return {
				success: true,
				data: deletedCount,
				source: 'indexeddb',
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to cleanup expired tokens', undefined, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				source: 'none',
			};
		}
	}

	/**
	 * Generate unique token ID
	 */
	private generateTokenId(token: Omit<UnifiedToken, 'id' | 'createdAt' | 'updatedAt'>): string {
		const prefix = token.type.replace('_', '');
		const timestamp = Date.now();
		const random = Math.random().toString(36).substr(2, 9);
		return `${prefix}-${timestamp}-${random}`;
	}

	/**
	 * Clear all tokens (for testing/reset purposes)
	 */
	public async clearAllTokens(): Promise<TokenStorageResult<void>> {
		try {
			// Clear cache
			this.cache.clear();
			localStorage.removeItem(this.CACHE_KEY);

			// Clear IndexedDB
			await this.clearIndexedDB();

			// Clear SQLite (async, don't wait)
			this.clearSQLite().catch(error => {
				logger.warn(MODULE_TAG, 'Failed to clear SQLite', undefined, error);
			});

			logger.info(MODULE_TAG, 'All tokens cleared');

			return {
				success: true,
				source: 'indexeddb',
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to clear all tokens', undefined, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				source: 'none',
			};
		}
	}

	/**
	 * Clear IndexedDB
	 */
	private async clearIndexedDB(): Promise<void> {
		if (!this.db) throw new Error('IndexedDB not initialized');

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([TOKEN_STORE_NAME], 'readwrite');
			const store = transaction.objectStore(TOKEN_STORE_NAME);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	/**
	 * Clear SQLite via backend API
	 */
	private async clearSQLite(): Promise<void> {
		try {
			const response = await fetch('/api/tokens/clear', {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`SQLite clear failed: ${response.statusText}`);
			}

			logger.debug(MODULE_TAG, 'SQLite cleared');
		} catch (error) {
			logger.warn(MODULE_TAG, 'SQLite clear failed', undefined, error);
			throw error;
		}
	}
}

// Export singleton instance
export const unifiedTokenStorage = UnifiedTokenStorageService.getInstance();
