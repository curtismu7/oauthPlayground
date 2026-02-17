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

// Unified storage interface for all data types
export interface UnifiedStorageItem {
	id: string;
	type: 'access_token' | 'refresh_token' | 'id_token' | 'worker_token' | 
	      'oauth_credentials' | 'mfa_credentials' | 'environment_settings' | 
	      'ui_preferences' | 'pkce_state' | 'flow_state';
	value: string;
	expiresAt: number | null;
	issuedAt: number;
	scope?: string[];
	source: 'oauth_flow' | 'worker_token' | 'manual' | 'system' | 'user_input';
	flowType?: string;
	flowName?: string;
	environmentId?: string;
	clientId?: string;
	metadata?: Record<string, unknown>;
	createdAt: number;
	updatedAt: number;
}

// Legacy token interface for backward compatibility
export interface UnifiedToken extends Omit<UnifiedStorageItem, 'type'> {
	type: 'access_token' | 'refresh_token' | 'id_token' | 'worker_token';
}

export interface StorageQuery {
	type?: UnifiedStorageItem['type'];
	source?: UnifiedStorageItem['source'];
	environmentId?: string;
	clientId?: string;
	flowType?: string;
	flowName?: string;
	expired?: boolean;
}

export interface TokenStorageResult<T = UnifiedStorageItem> {
	success: boolean;
	data?: T[];
	error?: string;
	source?: 'indexeddb' | 'sqlite' | 'cache';
}

export interface TokenStorageOptions {
	environmentId?: string;
	clientId?: string;
	flowType?: string;
	flowName?: string;
	source?: UnifiedStorageItem['source'];
}

// Legacy interfaces for backward compatibility
export interface TokenQuery extends Omit<StorageQuery, 'type'> {
	type?: UnifiedToken['type'];
}

// V8 Storage Compatibility Interfaces
export interface V8FlowData {
	flowType: string;
	discovery?: V8DiscoveryData;
	credentials?: V8CredentialsData;
	advanced?: V8AdvancedData;
	savedAt?: number;
}

export interface V8DiscoveryData {
	issuerUrl?: string;
	authorizationEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	jwksUrl?: string;
	endSessionEndpoint?: string;
	discoveryDocument?: any;
	discoveredAt?: number;
}

export interface V8CredentialsData {
	environmentId?: string;
	region?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	scopes?: string | string[];
	loginHint?: string;
	clientAuthMethod?: string;
}

export interface V8AdvancedData {
	privateKey?: string;
	jwksUrl?: string;
	issuer?: string;
	subject?: string;
	tokenEndpointAuthMethod?: string;
	[key: string]: any;
}

// StorageServiceV8 Compatibility Interfaces
export interface StorageData<T = unknown> {
	version: number;
	data: T;
	timestamp: number;
	flowKey?: string;
}

export interface Migration {
	fromVersion: number;
	toVersion: number;
	migrate: (data: unknown) => unknown;
}

export interface ExportData {
	version: number;
	exportedAt: string;
	data: Record<string, StorageData>;
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

	// ============================================================================
	// CREDENTIALS AND SETTINGS METHODS
	// ============================================================================

	/**
	 * Store OAuth credentials
	 */
	async storeOAuthCredentials(
		credentials: Record<string, unknown>,
		options?: TokenStorageOptions
	): Promise<void> {
		await this.storeToken({
			id: `oauth_${options?.environmentId || 'default'}_${options?.clientId || 'default'}`,
			type: 'oauth_credentials',
			value: JSON.stringify(credentials),
			expiresAt: null,
			issuedAt: Date.now(),
			source: 'system',
			environmentId: options?.environmentId,
			clientId: options?.clientId,
			flowType: options?.flowType,
			flowName: options?.flowName,
			metadata: { credentials },
		});
	}

	/**
	 * Get OAuth credentials
	 */
	async getOAuthCredentials(options?: TokenStorageOptions): Promise<Record<string, unknown> | null> {
		const result = await this.getTokens({
			type: 'oauth_credentials',
			environmentId: options?.environmentId,
			clientId: options?.clientId,
		});

		if (result.success && result.data && result.data.length > 0) {
			try {
				return JSON.parse(result.data[0].value) as Record<string, unknown>;
			} catch (error) {
				logger.warn(MODULE_TAG, 'Failed to parse OAuth credentials', undefined, error);
				return null;
			}
		}

		return null;
	}

	/**
	 * Store MFA credentials
	 */
	async storeMFACredentials(
		credentials: Record<string, unknown>,
		options?: TokenStorageOptions
	): Promise<void> {
		await this.storeToken({
			id: `mfa_${options?.environmentId || 'default'}_${options?.clientId || 'default'}`,
			type: 'mfa_credentials',
			value: JSON.stringify(credentials),
			expiresAt: null,
			issuedAt: Date.now(),
			source: 'system',
			environmentId: options?.environmentId,
			clientId: options?.clientId,
			flowType: options?.flowType,
			flowName: options?.flowName,
			metadata: { credentials },
		});
	}

	/**
	 * Get MFA credentials
	 */
	async getMFACredentials(options?: TokenStorageOptions): Promise<Record<string, unknown> | null> {
		const result = await this.getTokens({
			type: 'mfa_credentials',
			environmentId: options?.environmentId,
			clientId: options?.clientId,
		});

		if (result.success && result.data && result.data.length > 0) {
			try {
				return JSON.parse(result.data[0].value) as Record<string, unknown>;
			} catch (error) {
				logger.warn(MODULE_TAG, 'Failed to parse MFA credentials', undefined, error);
				return null;
			}
		}

		return null;
	}

	/**
	 * Store environment settings
	 */
	async storeEnvironmentSettings(
		settings: Record<string, unknown>,
		options?: TokenStorageOptions
	): Promise<void> {
		await this.storeToken({
			id: `env_settings_${options?.environmentId || 'default'}`,
			type: 'environment_settings',
			value: JSON.stringify(settings),
			expiresAt: null,
			issuedAt: Date.now(),
			source: 'user_input',
			environmentId: options?.environmentId,
			metadata: { settings },
		});
	}

	/**
	 * Get environment settings
	 */
	async getEnvironmentSettings(environmentId?: string): Promise<Record<string, unknown> | null> {
		const result = await this.getTokens({
			type: 'environment_settings',
			environmentId,
		});

		if (result.success && result.data && result.data.length > 0) {
			try {
				return JSON.parse(result.data[0].value) as Record<string, unknown>;
			} catch (error) {
				logger.warn(MODULE_TAG, 'Failed to parse environment settings', undefined, error);
				return null;
			}
		}

		return null;
	}

	/**
	 * Store UI preferences
	 */
	async storeUIPreferences(
		preferences: Record<string, unknown>,
		userId?: string
	): Promise<void> {
		await this.storeToken({
			id: `ui_prefs_${userId || 'default'}`,
			type: 'ui_preferences',
			value: JSON.stringify(preferences),
			expiresAt: null,
			issuedAt: Date.now(),
			source: 'user_input',
			metadata: { preferences, userId },
		});
	}

	/**
	 * Get UI preferences
	 */
	async getUIPreferences(userId?: string): Promise<Record<string, unknown> | null> {
		const result = await this.getTokens({
			type: 'ui_preferences',
		});

		if (result.success && result.data && result.data.length > 0) {
			try {
				return JSON.parse(result.data[0].value) as Record<string, unknown>;
			} catch (error) {
				logger.warn(MODULE_TAG, 'Failed to parse UI preferences', undefined, error);
				return null;
			}
		}

		return null;
	}

	/**
	 * Store PKCE state
	 */
	async storePKCEState(
		state: Record<string, unknown>,
		flowId: string
	): Promise<void> {
		await this.storeToken({
			id: `pkce_${flowId}`,
			type: 'pkce_state',
			value: JSON.stringify(state),
			expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
			issuedAt: Date.now(),
			source: 'system',
			flowName: flowId,
			metadata: { flowId },
		});
	}

	/**
	 * Get PKCE state
	 */
	async getPKCEState(flowId: string): Promise<Record<string, unknown> | null> {
		const result = await this.getTokens({
			type: 'pkce_state',
			flowName: flowId,
		});

		if (result.success && result.data && result.data.length > 0) {
			try {
				return JSON.parse(result.data[0].value) as Record<string, unknown>;
			} catch (error) {
				logger.warn(MODULE_TAG, 'Failed to parse PKCE state', undefined, error);
				return null;
			}
		}

		return null;
	}

	/**
	 * Store flow state
	 */
	async storeFlowState(
		state: Record<string, unknown>,
		flowId: string
	): Promise<void> {
		await this.storeToken({
			id: `flow_${flowId}`,
			type: 'flow_state',
			value: JSON.stringify(state),
			expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
			issuedAt: Date.now(),
			source: 'system',
			flowName: flowId,
			metadata: { flowId },
		});
	}

	/**
	 * Get flow state
	 */
	async getFlowState(flowId: string): Promise<Record<string, unknown> | null> {
		const result = await this.getTokens({
			type: 'flow_state',
			flowName: flowId,
		});

		if (result.success && result.data && result.data.length > 0) {
			try {
				return JSON.parse(result.data[0].value) as Record<string, unknown>;
			} catch (error) {
				logger.warn(MODULE_TAG, 'Failed to parse flow state', undefined, error);
				return null;
			}
		}

		return null;
	}

	// ===== V8 STORAGE COMPATIBILITY METHODS =====
	// These methods provide backward compatibility with v8StorageService

	/**
	 * Save V8 flow data (compatibility method)
	 */
	async saveV8FlowData(flowType: string, data: V8FlowData): Promise<boolean> {
		try {
			const itemId = `v8_flow_${flowType}`;
			
			await this.storeToken({
				id: itemId,
				type: 'oauth_credentials' as any,
				value: JSON.stringify(data),
				expiresAt: null,
				issuedAt: Date.now(),
				source: 'user_input',
				flowType,
				flowName: `V8 ${flowType}`,
				environmentId: data.credentials?.environmentId,
				clientId: data.credentials?.clientId,
				metadata: {
					version: 'v8',
					sections: {
						discovery: !!data.discovery,
						credentials: !!data.credentials,
						advanced: !!data.advanced
					}
				},
				createdAt: Date.now(),
				updatedAt: Date.now()
			});
			
			return true;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to save V8 flow data', error as Error);
			return false;
		}
	}

	/**
	 * Load V8 flow data (compatibility method)
	 */
	async loadV8FlowData(flowType: string): Promise<V8FlowData | null> {
		try {
			const items = await this.getTokens({
				type: 'oauth_credentials' as any,
				flowType
			});
			
			if (items.success && items.data && items.data.length > 0) {
				const item = items.data[0];
				return JSON.parse(item.value) as V8FlowData;
			}
			
			return null;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to load V8 flow data', error as Error);
			return null;
		}
	}

	/**
	 * Save V8 discovery data (compatibility method)
	 */
	async saveV8Discovery(flowType: string, data: V8DiscoveryData): Promise<boolean> {
		try {
			const existingData = await this.loadV8FlowData(flowType) || { flowType };
			const updatedData = {
				...existingData,
				discovery: data,
				savedAt: Date.now()
			};
			
			return await this.saveV8FlowData(flowType, updatedData);
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to save V8 discovery data', error as Error);
			return false;
		}
	}

	/**
	 * Save V8 credentials data (compatibility method)
	 */
	async saveV8Credentials(flowType: string, data: V8CredentialsData): Promise<boolean> {
		try {
			const existingData = await this.loadV8FlowData(flowType) || { flowType };
			const updatedData = {
				...existingData,
				credentials: data,
				savedAt: Date.now()
			};
			
			return await this.saveV8FlowData(flowType, updatedData);
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to save V8 credentials data', error as Error);
			return false;
		}
	}

	/**
	 * Save V8 advanced data (compatibility method)
	 */
	async saveV8Advanced(flowType: string, data: V8AdvancedData): Promise<boolean> {
		try {
			const existingData = await this.loadV8FlowData(flowType) || { flowType };
			const updatedData = {
				...existingData,
				advanced: data,
				savedAt: Date.now()
			};
			
			return await this.saveV8FlowData(flowType, updatedData);
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to save V8 advanced data', error as Error);
			return false;
		}
	}

	/**
	 * Load V8 discovery data (compatibility method)
	 */
	async loadV8Discovery(flowType: string): Promise<V8DiscoveryData | null> {
		try {
			const flowData = await this.loadV8FlowData(flowType);
			return flowData?.discovery || null;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to load V8 discovery data', error as Error);
			return null;
		}
	}

	/**
	 * Load V8 credentials data (compatibility method)
	 */
	async loadV8Credentials(flowType: string): Promise<V8CredentialsData | null> {
		try {
			const flowData = await this.loadV8FlowData(flowType);
			return flowData?.credentials || null;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to load V8 credentials data', error as Error);
			return null;
		}
	}

	/**
	 * Load V8 advanced data (compatibility method)
	 */
	async loadV8Advanced(flowType: string): Promise<V8AdvancedData | null> {
		try {
			const flowData = await this.loadV8FlowData(flowType);
			return flowData?.advanced || null;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to load V8 advanced data', error as Error);
			return null;
		}
	}

	/**
	 * Clear V8 flow data (compatibility method)
	 */
	async clearV8FlowData(flowType: string): Promise<void> {
		try {
			await this.deleteTokens({
				type: 'oauth_credentials' as any,
				flowType
			});
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to clear V8 flow data', error as Error);
		}
	}

	// ===== STORAGE SERVICE V8 COMPATIBILITY METHODS =====
	// These methods provide backward compatibility with StorageServiceV8

	/**
	 * Save data with versioning (StorageServiceV8 compatibility)
	 */
	async saveV8Versioned<T>(key: string, data: T, version: number, flowKey?: string): Promise<void> {
		try {
			const storageData: StorageData<T> = {
				version,
				data,
				timestamp: Date.now(),
				flowKey,
			};

			await this.storeToken({
				id: key,
				type: 'v8_storage' as any,
				value: JSON.stringify(storageData),
				expiresAt: null,
				issuedAt: Date.now(),
				source: 'indexeddb',
				flowName: flowKey || 'v8',
				metadata: {
					version,
					flowKey,
					key,
				},
			});

			logger.info(MODULE_TAG, 'V8 versioned data saved', { key, version, flowKey });
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to save V8 versioned data', error as Error);
			throw error;
		}
	}

	/**
	 * Load data with migration support (StorageServiceV8 compatibility)
	 */
	async loadV8Versioned<T>(key: string, migrations?: Migration[]): Promise<T | null> {
		try {
			const tokens = await this.getTokens({
				type: 'v8_storage' as any,
				key,
			});

			if (tokens.length === 0) {
				logger.info(MODULE_TAG, 'No V8 versioned data found', { key });
				return null;
			}

			const token = tokens[0];
			let storageData: StorageData<T> = JSON.parse(token.value);

			// Apply migrations if needed
			if (migrations && migrations.length > 0) {
				const currentVersion = storageData.version;
				const targetVersion = Math.max(...migrations.map((m) => m.toVersion));

				if (currentVersion < targetVersion) {
					logger.info(MODULE_TAG, 'Migrating V8 data', {
						key,
						from: currentVersion,
						to: targetVersion,
					});

					storageData = this.applyV8Migrations(storageData, migrations);

					// Save migrated data
					await this.saveV8Versioned(key, storageData.data, storageData.version, storageData.flowKey);
				}
			}

			logger.info(MODULE_TAG, 'V8 versioned data loaded', {
				key,
				version: storageData.version,
				age: Date.now() - storageData.timestamp,
			});

			return storageData.data;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to load V8 versioned data', error as Error);
			return null;
		}
	}

	/**
	 * Apply migrations to V8 data
	 */
	private applyV8Migrations<T>(storageData: StorageData<T>, migrations: Migration[]): StorageData<T> {
		let currentData = storageData.data;
		let currentVersion = storageData.version;

		// Sort migrations by version
		const sortedMigrations = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion);

		for (const migration of sortedMigrations) {
			if (currentVersion === migration.fromVersion) {
				logger.info(MODULE_TAG, 'Applying V8 migration', {
					from: migration.fromVersion,
					to: migration.toVersion,
				});

				currentData = migration.migrate(currentData) as T;
				currentVersion = migration.toVersion;
			}
		}

		return {
			...storageData,
			version: currentVersion,
			data: currentData,
			timestamp: Date.now(),
		};
	}

	/**
	 * Clear specific V8 key
	 */
	async clearV8Key(key: string): Promise<void> {
		try {
			await this.deleteTokens({
				type: 'v8_storage' as any,
				key,
			});
			logger.info(MODULE_TAG, 'V8 key cleared', { key });
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to clear V8 key', error as Error);
		}
	}

	/**
	 * Clear all V8 data
	 */
	async clearAllV8(): Promise<void> {
		try {
			await this.deleteTokens({
				type: 'v8_storage' as any,
			});
			logger.info(MODULE_TAG, 'All V8 data cleared');
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to clear all V8 data', error as Error);
		}
	}

	/**
	 * Get all V8 storage keys
	 */
	async getAllV8Keys(): Promise<string[]> {
		try {
			const tokens = await this.getTokens({
				type: 'v8_storage' as any,
			});
			return tokens.map(token => token.metadata?.key || token.id);
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to get all V8 keys', error as Error);
			return [];
		}
	}

	/**
	 * Export all V8 data
	 */
	async exportAllV8(): Promise<string> {
		try {
			const tokens = await this.getTokens({
				type: 'v8_storage' as any,
			});
			const data: Record<string, StorageData> = {};

			tokens.forEach((token) => {
				try {
					const storageData: StorageData = JSON.parse(token.value);
					const key = token.metadata?.key || token.id;
					data[key] = storageData;
				} catch (error) {
					logger.warn(MODULE_TAG, 'Failed to parse V8 data for export', { key: token.id });
				}
			});

			const exportData: ExportData = {
				version: 1,
				exportedAt: new Date().toISOString(),
				data,
			};

			const exported = JSON.stringify(exportData, null, 2);

			logger.info(MODULE_TAG, 'V8 data exported', {
				keyCount: tokens.length,
				size: exported.length,
			});

			return exported;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to export V8 data', error as Error);
			throw error;
		}
	}

	/**
	 * Import V8 data
	 */
	async importAllV8(jsonData: string, overwrite = false): Promise<void> {
		try {
			const exportData: ExportData = JSON.parse(jsonData);

			if (!exportData.version || !exportData.data) {
				throw new Error('Invalid export data format');
			}

			let imported = 0;
			let skipped = 0;

			for (const [key, storageData] of Object.entries(exportData.data)) {
				// Check if key already exists
				if (!overwrite) {
					const existing = await this.getTokens({
						type: 'v8_storage' as any,
						key,
					});
					if (existing.length > 0) {
						logger.info(MODULE_TAG, 'Skipping existing V8 key', { key });
						skipped++;
						continue;
					}
				}

				// Import data
				await this.saveV8Versioned(key, storageData.data, storageData.version, storageData.flowKey);
				imported++;
			}

			logger.info(MODULE_TAG, 'V8 data imported', {
				imported,
				skipped,
				total: Object.keys(exportData.data).length,
			});
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to import V8 data', error as Error);
			throw error;
		}
	}

	/**
	 * Check if V8 key exists
	 */
	async hasV8Key(key: string): Promise<boolean> {
		try {
			const tokens = await this.getTokens({
				type: 'v8_storage' as any,
				key,
			});
			return tokens.length > 0;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to check V8 key existence', error as Error);
			return false;
		}
	}

	/**
	 * Get V8 data age in milliseconds
	 */
	async getV8Age(key: string): Promise<number | null> {
		try {
			const tokens = await this.getTokens({
				type: 'v8_storage' as any,
				key,
			});

			if (tokens.length === 0) {
				return null;
			}

			const token = tokens[0];
			const storageData: StorageData = JSON.parse(token.value);
			return Date.now() - storageData.timestamp;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to get V8 data age', error as Error);
			return null;
		}
	}

	/**
	 * Check if V8 data is expired
	 */
	async isV8Expired(key: string, maxAge: number): Promise<boolean> {
		const age = await this.getV8Age(key);
		if (age === null) {
			return true;
		}
		return age > maxAge;
	}

	/**
	 * Clean up expired V8 data
	 */
	async cleanupExpiredV8(maxAge: number): Promise<number> {
		try {
			const tokens = await this.getTokens({
				type: 'v8_storage' as any,
			});
			let cleaned = 0;

			for (const token of tokens) {
				const key = token.metadata?.key || token.id;
				if (await this.isV8Expired(key, maxAge)) {
					await this.clearV8Key(key);
					cleaned++;
				}
			}

			logger.info(MODULE_TAG, 'Expired V8 data cleaned up', {
				cleaned,
				maxAge,
			});

			return cleaned;
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to cleanup expired V8 data', error as Error);
			return 0;
		}
	}
}

// Export singleton instance
export const unifiedTokenStorage = UnifiedTokenStorageService.getInstance();
