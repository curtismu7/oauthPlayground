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
 * - Multiple storage layers (localStorage, IndexedDB, database backup)
 * - Automatic token lifecycle management
 * - Support for different authentication methods
 * - Cross-app token sharing
 * - Retry logic and error handling
 * - Token validation and expiration handling
 */

import { DualStorageServiceV8 } from '../v8/services/dualStorageServiceV8';

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
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';

	// App-specific metadata (optional)
	appId?: string;
	appName?: string;
	appVersion?: string;

	// Key Rotation Policy (KRP) support
	keyRotationPolicyId?: string;
	useKeyRotationPolicy?: boolean;

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

	// KRP metadata
	keyRotationPolicyId?: string | undefined;
	keyRotationStatus?: 'active' | 'inactive' | 'expiring' | 'unknown' | undefined;
	keyRotationExpiresAt?: number | undefined;
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
	keyRotationPolicy?: {
		enabled: boolean;
		policyId?: string;
		status?: 'active' | 'inactive' | 'expiring' | 'unknown';
		expiresAt?: number;
		daysUntilExpiry?: number;
	};
}

export interface WorkerTokenValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

export interface KeyRotationPolicy {
	id: string;
	name: string;
	description?: string;
	algorithm: string;
	keySize: number;
	rotationInterval: number; // in days
	createdAt: string;
	updatedAt: string;
	status: 'ACTIVE' | 'INACTIVE' | 'EXPIRING';
	nextRotationAt?: string;
}

export interface ApplicationKeyRotationStatus {
	applicationId: string;
	keyRotationPolicyId?: string | undefined;
	keyRotationEnabled: boolean;
	currentKeyId?: string | undefined;
	nextRotationAt?: string | undefined;
	daysUntilRotation?: number | undefined;
	warningThreshold?: number; // days before rotation to show warning
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
	 * Synchronous get worker token data (for backward compatibility)
	 * Uses memory cache and localStorage only - may be stale but is fast
	 */
	public getTokenDataSync(): UnifiedWorkerTokenData | null {
		// Try memory cache first
		if (this.memoryCache) {
			return this.memoryCache;
		}

		// Try localStorage
		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				const data = JSON.parse(stored) as UnifiedWorkerTokenData;
				this.memoryCache = data; // Update cache
				return data;
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load data from storage (sync)`, error);
		}

		return null;
	}

	/**
	 * Synchronous check if worker token exists and is valid
	 */
	public hasValidTokenSync(): boolean {
		const data = this.getTokenDataSync();
		if (!data || !data.token) {
			return false;
		}
		return this.isTokenValid(data);
	}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): UnifiedWorkerTokenService {
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

		// Save to database via dual storage for persistence
		try {
			await DualStorageServiceV8.save(
				{
					directory: 'worker_token',
					filename: 'unified-credentials.json',
					browserStorageKey: BROWSER_STORAGE_KEY,
				},
				credentials
			);
			console.log(`${MODULE_TAG} ✅ Worker token credentials backed up to database`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to backup to database`, error);
			// Don't throw - local storage is primary
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
			console.error(`${MODULE_TAG} ❌ Failed to load from localStorage`, error);
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
					console.warn(`${MODULE_TAG} ⚠️ Failed to restore to localStorage`, error);
				}
				return data.credentials;
			} else {
				console.log(`${MODULE_TAG} ❌ No data found in IndexedDB`);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to load from IndexedDB`, error);
		}

		// Try database backup via dual storage
		try {
			console.log(`${MODULE_TAG} 🔍 Trying database backup...`);
			const result = await DualStorageServiceV8.load({
				directory: 'worker_token',
				filename: 'unified-credentials.json',
				browserStorageKey: BROWSER_STORAGE_KEY,
			});

			if (result.success && result.data) {
				const credentials = result.data as UnifiedWorkerTokenCredentials;
				console.log(`${MODULE_TAG} ✅ Loaded worker token credentials from database`);

				// Update memory cache and localStorage
				const data: UnifiedWorkerTokenData = {
					token: '', // Token will be fetched when needed
					credentials,
					savedAt: Date.now(),
				};
				this.memoryCache = data;

				// Restore to localStorage
				try {
					localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
				} catch (error) {
					console.warn(`${MODULE_TAG} ⚠️ Failed to restore to localStorage`, error);
				}

				return credentials;
			} else {
				console.log(`${MODULE_TAG} ❌ No data found in database`);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to load from database`, error);
		}

		// Try legacy storage keys for migration
		console.log(`${MODULE_TAG} 🔍 Trying legacy storage migration...`);
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

		console.log(`${MODULE_TAG} 🔍 Checking ${legacyKeys.length} legacy keys...`);

		for (const key of legacyKeys) {
			try {
				const stored = localStorage.getItem(key);
				console.log(`${MODULE_TAG} 🔍 Legacy key ${key}:`, { hasData: !!stored });

				if (stored) {
					const legacyData = JSON.parse(stored);
					console.log(`${MODULE_TAG} 📦 Found legacy data in ${key}:`, {
						hasEnvironmentId: !!legacyData.environmentId || !!legacyData.environment_id,
						hasClientId: !!legacyData.clientId || !!legacyData.client_id,
						hasClientSecret: !!legacyData.clientSecret || !!legacyData.client_secret,
					});

					// Convert to unified format
					const unifiedCredentials: UnifiedWorkerTokenCredentials = {
						environmentId: legacyData.environmentId || legacyData.environment_id,
						clientId: legacyData.clientId || legacyData.client_id,
						clientSecret: legacyData.clientSecret || legacyData.client_secret,
						scopes:
							legacyData.scopes || (legacyData.scope ? legacyData.scope.split(/\s+/) : undefined),
						region: legacyData.region || 'us',
						customDomain: legacyData.customDomain,
						tokenEndpointAuthMethod:
							legacyData.tokenEndpointAuthMethod || legacyData.authMethod || 'client_secret_post',
					};

					// Validate we have the required fields
					if (
						!unifiedCredentials.environmentId ||
						!unifiedCredentials.clientId ||
						!unifiedCredentials.clientSecret
					) {
						console.warn(`${MODULE_TAG} ⚠️ Legacy data missing required fields, skipping`, {
							key,
							hasEnvironmentId: !!unifiedCredentials.environmentId,
							hasClientId: !!unifiedCredentials.clientId,
							hasClientSecret: !!unifiedCredentials.clientSecret,
						});
						continue;
					}

					// Save in unified format
					await this.saveCredentials(unifiedCredentials);

					console.log(
						`${MODULE_TAG} 🔄 Successfully migrated credentials from legacy key: ${key}`,
						{
							environmentId: `${unifiedCredentials.environmentId?.substring(0, 8)}...`,
							clientId: `${unifiedCredentials.clientId?.substring(0, 8)}...`,
							hasClientSecret: !!unifiedCredentials.clientSecret,
						}
					);
					return unifiedCredentials;
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} ⚠️ Failed to migrate from legacy key ${key}:`, error);
			}
		}

		console.log(`${MODULE_TAG} ❌ No valid legacy credentials found for migration`);
		return null;
	}

	/**
	 * Save worker token (access token)
	 */
	async saveToken(
		token: string,
		expiresAt?: number,
		tokenMetadata?: Partial<UnifiedWorkerTokenData>
	): Promise<void> {
		const credentials = await this.loadCredentials();
		if (!credentials) {
			throw new Error('No worker token credentials found. Please save credentials first.');
		}

		const data: UnifiedWorkerTokenData = {
			token,
			credentials,
			expiresAt: expiresAt || Date.now() + 3600 * 1000, // Default 1 hour
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

		const status: UnifiedWorkerTokenStatus = {
			hasCredentials: !!credentials,
			hasToken: !!data?.token,
			tokenValid: data ? this.isTokenValid(data) : false,
		};

		// Add optional properties only if they have values
		if (data) {
			const expiresIn = this.getTokenExpiresIn(data);
			if (expiresIn !== undefined) {
				status.tokenExpiresIn = expiresIn;
			}
			if (data.savedAt !== undefined) {
				status.lastFetchedAt = data.savedAt;
			}
		}

		if (data?.lastUsedAt !== undefined) {
			status.lastUsedAt = data.lastUsedAt;
		}

		if (credentials) {
			const appInfoObj: { appId?: string; appName?: string; appVersion?: string } = {};
			if (credentials.appId) appInfoObj.appId = credentials.appId;
			if (credentials.appName) appInfoObj.appName = credentials.appName;
			if (credentials.appVersion) appInfoObj.appVersion = credentials.appVersion;
			
			if (Object.keys(appInfoObj).length > 0) {
				status.appInfo = appInfoObj;
			}
		}

		return status;
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
			suggestions.push(
				'Environment ID should be a UUID like: 12345678-1234-1234-1234-123456789012'
			);
		}

		if (!credentials.clientId?.trim()) {
			errors.push('Client ID is required');
		}

		if (!credentials.clientSecret?.trim()) {
			errors.push('Client Secret is required');
		}

		// Business logic validation
		if (
			credentials.environmentId &&
			credentials.clientId &&
			credentials.environmentId === credentials.clientId
		) {
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
					appInfo: data.credentials.appId
						? {
								appId: data.credentials.appId,
								appName: data.credentials.appName,
								appVersion: data.credentials.appVersion,
							}
						: undefined,
				},
			})
		);
	}

	// ========================================================================
	// KEY ROTATION POLICY (KRP) SUPPORT
	// ========================================================================

	/**
	 * Get key rotation policy status for the current worker token application
	 */
	async getKeyRotationStatus(): Promise<ApplicationKeyRotationStatus | null> {
		const credentials = await this.loadCredentials();
		if (!credentials || !credentials.environmentId || !credentials.clientId) {
			return null;
		}

		try {
			// Import PingOneAPI dynamically to avoid circular dependencies
			const { default: PingOneAPI } = await import('../api/pingone');

			// Authenticate if needed
			if (PingOneAPI.isTokenExpired()) {
				await PingOneAPI.authenticate(
					credentials.clientId,
					credentials.clientSecret,
					credentials.environmentId
				);
			}

			// Get application details including KRP status
			const response = await PingOneAPI.request(
				`/v1/environments/${credentials.environmentId}/applications/${credentials.clientId}`
			);

			const app = response;
			const krpStatus: ApplicationKeyRotationStatus = {
				applicationId: credentials.clientId,
				keyRotationPolicyId: app.keyRotationPolicy?.id,
				keyRotationEnabled: !!app.keyRotationPolicy,
				currentKeyId: app.tokenSigningKey?.kid,
				nextRotationAt: app.keyRotationPolicy?.nextRotationAt,
				daysUntilRotation: app.keyRotationPolicy?.nextRotationAt
					? Math.ceil(
							(new Date(app.keyRotationPolicy.nextRotationAt).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24)
						)
					: undefined,
				warningThreshold: 30, // Show warning 30 days before rotation
			};

			// Update cached token data with KRP info
			const tokenData = await this.loadDataFromStorage();
			if (tokenData) {
				tokenData.keyRotationPolicyId = krpStatus.keyRotationPolicyId ?? undefined;
				tokenData.keyRotationStatus = krpStatus.keyRotationEnabled ? 'active' : 'inactive';
				tokenData.keyRotationExpiresAt = krpStatus.nextRotationAt
					? new Date(krpStatus.nextRotationAt).getTime()
					: undefined;
				await this.saveToken(tokenData.token, tokenData.expiresAt, {
					credentials: tokenData.credentials,
					keyRotationPolicyId: tokenData.keyRotationPolicyId,
					keyRotationStatus: tokenData.keyRotationStatus,
					keyRotationExpiresAt: tokenData.keyRotationExpiresAt,
				});
			}

			return krpStatus;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get KRP status:`, error);
			return null;
		}
	}

	/**
	 * Get available key rotation policies for the environment
	 */
	async getKeyRotationPolicies(): Promise<KeyRotationPolicy[]> {
		const credentials = await this.loadCredentials();
		if (!credentials || !credentials.environmentId) {
			return [];
		}

		try {
			// Import PingOneAPI dynamically
			const { default: PingOneAPI } = await import('../api/pingone');

			// Authenticate if needed
			if (PingOneAPI.isTokenExpired()) {
				await PingOneAPI.authenticate(
					credentials.clientId,
					credentials.clientSecret,
					credentials.environmentId
				);
			}

			// Get all key rotation policies
			const response = await PingOneAPI.request(
				`/v1/environments/${credentials.environmentId}/keyRotationPolicies`
			);

			return response._embedded?.keyRotationPolicies || [];
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get KRP policies:`, error);
			return [];
		}
	}

	/**
	 * Update application to use a specific key rotation policy
	 */
	async updateKeyRotationPolicy(policyId: string): Promise<boolean> {
		const credentials = await this.loadCredentials();
		if (!credentials || !credentials.environmentId || !credentials.clientId) {
			return false;
		}

		try {
			// Import PingOneAPI dynamically
			const { default: PingOneAPI } = await import('../api/pingone');

			// Authenticate if needed
			if (PingOneAPI.isTokenExpired()) {
				await PingOneAPI.authenticate(
					credentials.clientId,
					credentials.clientSecret,
					credentials.environmentId
				);
			}

			// Update application with KRP
			await PingOneAPI.request(
				`/v1/environments/${credentials.environmentId}/applications/${credentials.clientId}`,
				{
					method: 'PATCH',
					body: JSON.stringify({
						keyRotationPolicy: {
							id: policyId,
						},
					}),
				}
			);

			// Update cached credentials
			credentials.keyRotationPolicyId = policyId;
			credentials.useKeyRotationPolicy = true;
			await this.saveCredentials(credentials);

			console.log(`${MODULE_TAG} ✅ Updated application to use KRP: ${policyId}`);
			return true;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to update KRP:`, error);
			return false;
		}
	}

	/**
	 * Check if application should be migrated to KRP (before March 2027 deadline)
	 */
	async checkKRPCompliance(): Promise<{
		compliant: boolean;
		daysUntilDeadline: number;
		warning: string;
		recommendation: string;
	}> {
		const krpStatus = await this.getKeyRotationStatus();

		// March 2, 2027 deadline
		const deadline = new Date('2027-03-02T00:00:00Z');
		const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

		if (krpStatus?.keyRotationEnabled) {
			return {
				compliant: true,
				daysUntilDeadline,
				warning: '',
				recommendation:
					'Application is using Key Rotation Policy - compliant with PingOne requirements',
			};
		}

		let warning = '';
		if (daysUntilDeadline <= 30) {
			warning = `⚠️ URGENT: KRP migration required in ${daysUntilDeadline} days!`;
		} else if (daysUntilDeadline <= 90) {
			warning = `⚠️ KRP migration required in ${daysUntilDeadline} days`;
		}

		return {
			compliant: false,
			daysUntilDeadline,
			warning,
			recommendation:
				'Configure Key Rotation Policy for this worker application before March 2, 2027',
		};
	}

	/**
	 * Export worker token configuration as JSON
	 */
	exportConfig(): string {
		try {
			const tokenData = this.getTokenDataSync();
			if (!tokenData) {
				throw new Error('No worker token configuration to export');
			}

			const exportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				credentials: tokenData.credentials,
				token: {
					accessToken: tokenData.token,
					expiresAt: tokenData.expiresAt,
					tokenType: tokenData.tokenType,
				},
			};

			return JSON.stringify(exportData, null, 2);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to export config:`, error);
			throw error;
		}
	}

	/**
	 * Import worker token configuration from JSON
	 */
	async importConfig(configJson: string): Promise<void> {
		try {
			const importData = JSON.parse(configJson);

			// Validate import data structure
			if (!importData.credentials || !importData.token) {
				throw new Error('Invalid configuration format');
			}

			// Validate required fields
			const { credentials } = importData;
			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				throw new Error('Missing required credentials fields');
			}

			// Import the configuration
			await this.saveCredentials(credentials);

			console.log(`${MODULE_TAG} Successfully imported worker token configuration`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to import config:`, error);
			throw error;
		}
	}

	/**
	 * Download configuration as a file
	 */
	downloadConfig(): void {
		try {
			const config = this.exportConfig();
			const blob = new Blob([config], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			
			const link = document.createElement('a');
			link.href = url;
			link.download = `worker-token-config-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			console.log(`${MODULE_TAG} Configuration downloaded`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to download config:`, error);
			throw error;
		}
	}
}

// Export singleton instance
export const unifiedWorkerTokenService = UnifiedWorkerTokenService.getInstance();

// Export types for backward compatibility
export type {
	WorkerAccessToken,
	WorkerTokenCredentials,
	WorkerTokenStatus,
} from './unifiedWorkerTokenTypes';

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(
		window as unknown as { unifiedWorkerTokenService: typeof unifiedWorkerTokenService }
	).unifiedWorkerTokenService = unifiedWorkerTokenService;
}

export default unifiedWorkerTokenService;
