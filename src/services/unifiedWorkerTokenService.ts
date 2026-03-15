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
 * - Credentials source of truth: backend SQLite (/api/credentials/sqlite); survives restarts
 * - Cache layers: memory, IndexedDB, localStorage (not used as source of truth)
 * - Automatic token lifecycle management
 * - Support for different authentication methods
 * - Cross-app token sharing
 * - Retry logic and error handling
 * - Token validation and expiration handling
 */

import { failFrom, ok, type ServiceResult } from '../standards/types';
import { logger } from '../utils/logger';
import { unifiedTokenStorage } from './unifiedTokenStorageService';

declare global {
	interface Window {
		__workerTokenSaved?: boolean;
		resetWorkerTokenLogging?: () => void;
	}
}

const MODULE_TAG = '[🔑 UNIFIED-WORKER-TOKEN]';

// Storage key for fast sync access (cache only; SQLite is source of truth for credentials)
const BROWSER_STORAGE_KEY = 'unified_worker_token';

/** Backend SQLite key for default worker token credentials (persists across restarts; not browser storage). */
const WORKER_TOKEN_SQLITE_KEY = '__worker_token__';

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
	private credentialsCache: UnifiedWorkerTokenCredentials | null = null;
	private credentialsCacheTime: number = 0;
	private credentialsCacheExpiry: number = 30000; // 30 seconds
	private lastLoadAttempt: number = 0;
	private loadRetryDelay: number = 5000; // 5 seconds between attempts
	private lastSaveTime = 0;
	private readonly SAVE_DEBOUNCE_MS = 1000; // 1 second debounce

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
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to load data from storage (sync)`,
				undefined,
				error as Error
			);
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
	 * Reset logging state (for debugging)
	 */
	static resetLoggingState(): void {
		if (typeof window !== 'undefined') {
			window.__workerTokenSaved = false;
		}
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
	 * Save worker token credentials
	 */
	async saveCredentials(
		credentials: UnifiedWorkerTokenCredentials
	): Promise<ServiceResult<undefined>> {
		// Debounce to prevent infinite loops
		const now = Date.now();
		if (now - this.lastSaveTime < this.SAVE_DEBOUNCE_MS) {
			logger.warn(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Save credentials called too frequently, skipping`
			);
			return ok(undefined);
		}
		this.lastSaveTime = now;

		// Only log if this is the first save or debug mode is enabled
		const isFirstSave = !window.__workerTokenSaved;
		if (isFirstSave) {
			logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} Saving worker token credentials`);
			window.__workerTokenSaved = true;
		}

		const data: UnifiedWorkerTokenData = {
			token: '', // Token will be fetched when needed
			credentials,
			savedAt: Date.now(),
		};

		// Update memory cache
		this.memoryCache = data;

		// Save to unified storage (IndexedDB + SQLite) — primary source, credentials never lost
		try {
			await unifiedTokenStorage.storeWorkerTokenCredentials(
				credentials as unknown as Record<string, unknown>
			);
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to save to unified storage`,
				undefined,
				error as Error
			);
			// Continue — localStorage/IndexedDB below provide fallback
		}

		// Sync to localStorage for fast sync access (cache only)
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to save to localStorage`,
				undefined,
				error as Error
			);
		}

		// Persist to backend SQLite so credentials survive restarts (source of truth)
		await this._saveCredentialsToSQLite(credentials);

		// Sync environmentId so all pages pick it up
		if (credentials.environmentId) {
			import('../services/environmentIdService')
				.then(({ saveEnvironmentId }) => saveEnvironmentId(credentials.environmentId))
				.catch((error) => {
					logger.warn('UnifiedWorkerTokenService', `${MODULE_TAG} Failed to sync environmentId`, {
						error: error as Error,
					});
				});
		}

		logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} ✅ Worker token credentials saved`);
		return ok(undefined);
	}

	/**
	 * Clear in-memory credentials cache so the next loadCredentials() reads from
	 * IndexedDB/SQLite again. Call when opening the worker token modal so credentials
	 * are never reported missing when they exist in storage.
	 */
	public clearCredentialsCache(): void {
		this.credentialsCache = null;
		this.credentialsCacheTime = 0;
		this.lastLoadAttempt = 0;
	}

	/**
	 * Load worker token credentials
	 */
	async loadCredentials(): Promise<ServiceResult<UnifiedWorkerTokenCredentials>> {
		const credentials = await this._loadCredentials();
		if (credentials === null) {
			return failFrom('CREDENTIALS_NOT_FOUND', 'No worker token credentials found');
		}
		return ok(credentials);
	}

	/**
	 * Load worker token credentials from backend SQLite (source of truth across restarts).
	 * Returns null if backend unavailable or no row for WORKER_TOKEN_SQLITE_KEY.
	 */
	private async _loadCredentialsFromSQLite(): Promise<UnifiedWorkerTokenCredentials | null> {
		try {
			const res = await fetch(
				`/api/credentials/sqlite/load?environmentId=${encodeURIComponent(WORKER_TOKEN_SQLITE_KEY)}`
			);
			if (!res.ok) return null;
			const json = (await res.json()) as { credentials: Record<string, unknown> | null };
			if (!json?.credentials) return null;
			const c = json.credentials;
			const environmentId = (c.loginHint as string) || (c.environmentId as string) || '';
			const clientId = (c.clientId as string) || '';
			const clientSecret = (c.clientSecret as string) ?? '';
			if (!environmentId || !clientId || !clientSecret) return null;
			const scopesRaw = c.scopes;
			const scopes: string[] = Array.isArray(scopesRaw)
				? scopesRaw
				: typeof scopesRaw === 'string'
					? scopesRaw.split(/\s+/).filter(Boolean)
					: [];
			const credentials: UnifiedWorkerTokenCredentials = {
				environmentId,
				clientId,
				clientSecret,
				scopes: scopes.length ? scopes : undefined,
				region: (c.region as UnifiedWorkerTokenCredentials['region']) || 'us',
				// _saveCredentialsToSQLite stores the field as `clientAuthMethod`; check both
				tokenEndpointAuthMethod: (c.tokenEndpointAuthMethod || c.clientAuthMethod) as
					| UnifiedWorkerTokenCredentials['tokenEndpointAuthMethod']
					| undefined,
			};
			return credentials;
		} catch (error) {
			logger.warn('UnifiedWorkerTokenService', `${MODULE_TAG} SQLite load failed`, {
				error: error as Error,
			});
			return null;
		}
	}

	/**
	 * Sync worker credentials to mcp-config.json so the MCP backend can use them for
	 * "Get worker token" and PingOne API calls. Fire-and-forget; does not throw.
	 */
	private _syncCredentialsToMcpConfig(credentials: UnifiedWorkerTokenCredentials): void {
		const regionUrls: Record<string, string> = {
			us: 'https://auth.pingone.com',
			eu: 'https://auth.pingone.eu',
			ap: 'https://auth.pingone.asia',
			ca: 'https://auth.pingone.ca',
		};
		const apiUrl = regionUrls[credentials.region || 'us'] ?? 'https://auth.pingone.com';
		fetch('/api/credentials/save-mcp-config', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				apiUrl,
			}),
		}).catch(() => {});
	}

	/**
	 * Save worker token credentials to backend SQLite so they persist across restarts.
	 * Does not throw; logs on failure. Also syncs to mcp-config.json for MCP backend.
	 */
	private async _saveCredentialsToSQLite(
		credentials: UnifiedWorkerTokenCredentials
	): Promise<void> {
		try {
			const scopesStr = Array.isArray(credentials.scopes)
				? credentials.scopes.join(' ')
				: typeof credentials.scopes === 'string'
					? credentials.scopes
					: null;
			const body = {
				environmentId: WORKER_TOKEN_SQLITE_KEY,
				credentials: {
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					environmentId: credentials.environmentId,
					loginHint: credentials.environmentId,
					scopes: scopesStr,
					issuerUrl: null,
					redirectUri: null,
					clientAuthMethod: credentials.tokenEndpointAuthMethod ?? null,
				},
				timestamp: new Date().toISOString(),
			};
			const res = await fetch('/api/credentials/sqlite/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				const err = await res.text();
				throw new Error(err || res.statusText);
			}
			logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} Credentials persisted to SQLite`);
			this._syncCredentialsToMcpConfig(credentials);
		} catch (error) {
			logger.warn('UnifiedWorkerTokenService', `${MODULE_TAG} SQLite save failed`, {
				error: error as Error,
			});
		}
	}

	/**
	 * Load worker token credentials (internal implementation).
	 * Order: SQLite (source of truth) → memory → IndexedDB → localStorage → legacy.
	 */
	private async _loadCredentials(): Promise<UnifiedWorkerTokenCredentials | null> {
		// Check if we have cached credentials that haven't expired
		const now = Date.now();

		// If we recently found nothing, return cached null silently
		if (
			this.credentialsCache === null &&
			now - this.credentialsCacheTime < this.credentialsCacheExpiry
		) {
			return null;
		}

		// If we have valid cached credentials, return them silently
		if (this.credentialsCache && now - this.credentialsCacheTime < this.credentialsCacheExpiry) {
			return this.credentialsCache;
		}

		// Prevent excessive retry attempts
		if (this.lastLoadAttempt && now - this.lastLoadAttempt < this.loadRetryDelay) {
			return this.credentialsCache; // Return cached even if expired/null
		}

		this.lastLoadAttempt = now;

		// 1) Try memory cache (fast)
		if (this.memoryCache) {
			this.credentialsCache = this.memoryCache.credentials;
			this.credentialsCacheTime = now;
			return this.memoryCache.credentials;
		}

		// 2) Source of truth: backend SQLite (persists across restarts; not browser storage)
		const sqliteCreds = await this._loadCredentialsFromSQLite();
		if (sqliteCreds) {
			this.memoryCache = {
				token: '',
				credentials: sqliteCreds,
				savedAt: Date.now(),
			};
			this.credentialsCache = sqliteCreds;
			this.credentialsCacheTime = now;
			try {
				localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(this.memoryCache));
			} catch {}
			// Sync to IndexedDB for offline/local use
			unifiedTokenStorage
				.storeWorkerTokenCredentials(sqliteCreds as unknown as Record<string, unknown>)
				.catch(() => {});
			// Sync to mcp-config so MCP backend can use these credentials
			this._syncCredentialsToMcpConfig(sqliteCreds);
			return sqliteCreds;
		}

		// 3) IndexedDB (unified storage)
		try {
			const creds = await unifiedTokenStorage.getWorkerTokenCredentials();
			if (creds?.environmentId && creds.clientId && creds.clientSecret) {
				const credentials = creds as unknown as UnifiedWorkerTokenCredentials;
				this.memoryCache = {
					token: '',
					credentials,
					savedAt: Date.now(),
				};
				this.credentialsCache = credentials;
				this.credentialsCacheTime = now;
				try {
					localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(this.memoryCache));
				} catch {}
				// Backfill SQLite so next load uses SQLite
				this._saveCredentialsToSQLite(credentials).catch(() => {});
				return credentials;
			}
		} catch (error) {
			logger.warn('UnifiedWorkerTokenService', `${MODULE_TAG} Unified storage load failed`, {
				error: error as Error,
			});
		}

		// 4) localStorage (legacy cache only)
		try {
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				const data: UnifiedWorkerTokenData = JSON.parse(stored);
				if (
					data.credentials?.environmentId &&
					data.credentials?.clientId &&
					data.credentials?.clientSecret
				) {
					this.memoryCache = data;
					this.credentialsCache = data.credentials;
					this.credentialsCacheTime = Date.now();
					unifiedTokenStorage
						.storeWorkerTokenCredentials(data.credentials as unknown as Record<string, unknown>)
						.catch(() => {});
					this._saveCredentialsToSQLite(data.credentials).catch(() => {});
					return data.credentials;
				}
			}
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} ❌ Failed to load from localStorage`,
				undefined,
				error as Error
			);
		}

		// 5) Legacy storage keys for migration
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

		// Check legacy keys silently

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
						// Invalid credentials, continue to next key
						continue;
					}

					// Save in unified format
					await this.saveCredentials(unifiedCredentials);

					// Update cache and return
					this.credentialsCache = unifiedCredentials;
					this.credentialsCacheTime = Date.now();
					return unifiedCredentials;
				}
			} catch (error) {
				logger.warn(
					'UnifiedWorkerTokenService',
					`${MODULE_TAG} ⚠️ Failed to migrate from legacy key ${key}:`,
					{ error: error as Error }
				);
			}
		}

		// No valid legacy credentials found
		this.credentialsCache = null;
		this.credentialsCacheTime = Date.now();
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
		const credResult = await this.loadCredentials();
		if (!credResult.success || !credResult.data) {
			throw new Error('No worker token credentials found. Please save credentials first.');
		}
		const credentials = credResult.data;

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

		// Save to unified storage (IndexedDB + SQLite) and localStorage for sync access
		try {
			await unifiedTokenStorage.saveWorkerToken({
				accessToken: token,
				expiresAt: data.expiresAt ?? Date.now() + 3600 * 1000,
				environmentId: credentials.environmentId,
			});
		} catch (error) {
			logger.warn(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to save token to unified storage`,
				{ error: error as Error }
			);
		}
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to save token to localStorage`,
				undefined,
				error as Error
			);
		}

		// Dual-write to backend (enables pull-from-backend; future secure backend-only mode)
		try {
			const res = await fetch('/api/tokens/worker', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					environmentId: credentials.environmentId,
					accessToken: token,
					expiresAt: data.expiresAt ?? Date.now() + 3600 * 1000,
				}),
			});
			if (res.ok) {
				logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} Token also saved to backend`);
			}
		} catch (error) {
			logger.warn(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to save token to backend (client storage still used)`,
				{ error: error as Error }
			);
		}

		// Broadcast token update event
		this.broadcastTokenUpdate(data);

		logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} ✅ Worker token saved`);
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
			logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} Token expired, clearing`);
			await this.clearToken();
			return null;
		}

		// Update last used time
		data.lastUsedAt = Date.now();
		this.memoryCache = data;
		try {
			localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
		} catch (error) {
			logger.warn('UnifiedWorkerTokenService', `${MODULE_TAG} Failed to update last used time`, {
				error: error as Error,
			});
		}

		return data.token;
	}

	/**
	 * Get worker token status
	 */
	async getStatus(): Promise<UnifiedWorkerTokenStatus> {
		const credResult = await this.loadCredentials();
		const credentials = credResult.success ? credResult.data : undefined;
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
	 * Clear worker token credentials from backend SQLite (so they are not reloaded after restart).
	 */
	private async _clearCredentialsFromSQLite(): Promise<void> {
		try {
			const res = await fetch('/api/credentials/sqlite/clear', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ environmentId: WORKER_TOKEN_SQLITE_KEY }),
			});
			if (!res.ok) {
				logger.warn('UnifiedWorkerTokenService', `${MODULE_TAG} SQLite clear failed`, {
					status: res.status,
				});
			}
		} catch (error) {
			logger.warn('UnifiedWorkerTokenService', `${MODULE_TAG} SQLite clear failed`, {
				error: error as Error,
			});
		}
	}

	/**
	 * Clear worker token credentials (browser storage and backend SQLite).
	 */
	async clearCredentials(): Promise<void> {
		this.memoryCache = null;
		this.credentialsCache = null;

		try {
			localStorage.removeItem(BROWSER_STORAGE_KEY);
			await unifiedTokenStorage.deleteTokens({
				type: 'worker_token',
				id: 'unified_worker_token_credentials',
			});
			await unifiedTokenStorage.clearWorkerToken();
			await this._clearCredentialsFromSQLite();
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to clear credentials`,
				undefined,
				error as Error
			);
		}

		logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} ✅ Cleared all worker token data`);
	}

	/**
	 * Clear only the access token (keep credentials).
	 * Credentials remain in SQLite and will be reloaded on next load.
	 */
	async clearToken(): Promise<void> {
		const credResult = await this.loadCredentials();
		if (!credResult.success || !credResult.data) {
			return;
		}
		const credentials = credResult.data;

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
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to clear token from localStorage`,
				undefined,
				error as Error
			);
		}

		// Update unified storage (token cleared, credentials kept)
		try {
			await unifiedTokenStorage.clearWorkerToken();
		} catch (error) {
			logger.warn(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to clear token from unified storage`,
				{
					error: error as Error,
				}
			);
		}

		// Clear backend token so storage stays in sync
		try {
			await fetch('/api/tokens/worker', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ environmentId: credentials.environmentId }),
			});
		} catch {
			// Non-fatal; backend may be unavailable
		}
	}

	// ============================================
	// Private helper methods
	// ============================================

	/**
	 * Load data from storage. Order: GET backend (backend checks SQLite → worker-tokens.json) first, then localStorage, then IndexedDB.
	 */
	private async loadDataFromStorage(): Promise<UnifiedWorkerTokenData | null> {
		try {
			// 1) Try backend first (enables pull-from-backend; future secure backend-only mode)
			const credResult = await this.loadCredentials();
			if (credResult.success && credResult.data) {
				const envId = credResult.data.environmentId;
				try {
					const res = await fetch(`/api/tokens/worker?environmentId=${encodeURIComponent(envId)}`);
					if (res.ok) {
						const json = (await res.json()) as {
							token?: { accessToken?: string; expiresAt?: number; environmentId?: string };
						};
						if (json?.token?.accessToken) {
							const data: UnifiedWorkerTokenData = {
								token: json.token.accessToken,
								credentials: credResult.data,
								expiresAt: json.token.expiresAt,
								savedAt: Date.now(),
							};
							if (this.isTokenValid(data)) {
								this.memoryCache = data;
								try {
									localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
								} catch {}
								unifiedTokenStorage
									.saveWorkerToken({
										accessToken: data.token,
										expiresAt: data.expiresAt ?? Date.now() + 3600 * 1000,
										environmentId: envId,
									})
									.catch(() => {});
								return data;
							}
						}
					}
				} catch {
					// Backend unavailable; fall through to local storage
				}
			}

			// 2) Try localStorage
			const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored) as UnifiedWorkerTokenData;
			}
			// 3) Fallback to unified storage (IndexedDB)
			const tokenData = await unifiedTokenStorage.loadWorkerToken();
			if (tokenData && credResult.success && credResult.data) {
				const data: UnifiedWorkerTokenData = {
					token: tokenData.accessToken,
					credentials: credResult.data,
					expiresAt: tokenData.expiresAt,
					savedAt: Date.now(),
				};
				this.memoryCache = data;
				try {
					localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(data));
				} catch {}
				return data;
			}
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to load data from storage`,
				undefined,
				error as Error
			);
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
		const credResult = await this.loadCredentials();
		if (!credResult.success || !credResult.data) {
			return null;
		}
		const credentials = credResult.data;
		if (!credentials.environmentId || !credentials.clientId) {
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
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to get KRP status:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/**
	 * Get available key rotation policies for the environment
	 */
	async getKeyRotationPolicies(): Promise<KeyRotationPolicy[]> {
		const credResult = await this.loadCredentials();
		if (!credResult.success || !credResult.data) {
			return [];
		}
		const credentials = credResult.data;
		if (!credentials.environmentId) {
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
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to get KRP policies:`,
				undefined,
				error as Error
			);
			return [];
		}
	}

	/**
	 * Update application to use a specific key rotation policy
	 */
	async updateKeyRotationPolicy(policyId: string): Promise<boolean> {
		const credResult = await this.loadCredentials();
		if (!credResult.success || !credResult.data) {
			return false;
		}
		const credentials = credResult.data;
		if (!credentials.environmentId || !credentials.clientId) {
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

			logger.info(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} ✅ Updated application to use KRP: ${policyId}`
			);
			return true;
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to update KRP:`,
				undefined,
				error as Error
			);
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
				exportDate: new Date().toISOString(),
				workerToken: {
					environmentId: tokenData.credentials.environmentId,
					clientId: tokenData.credentials.clientId,
					clientSecret: tokenData.credentials.clientSecret,
					scopes: tokenData.credentials.scopes || [],
					region: tokenData.credentials.region || 'us',
					authMethod: tokenData.credentials.tokenEndpointAuthMethod || 'client_secret_basic',
				},
			};

			return JSON.stringify(exportData, null, 2);
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to export config:`,
				undefined,
				error as Error
			);
			throw error;
		}
	}

	/**
	 * Import worker token configuration from JSON
	 */
	async importConfig(configJson: string): Promise<void> {
		try {
			const importData = JSON.parse(configJson);

			// Handle both old format (credentials) and new format (workerToken)
			let credentials: UnifiedWorkerTokenCredentials;
			if (importData.workerToken) {
				// New standardized format
				credentials = {
					environmentId: importData.workerToken.environmentId,
					clientId: importData.workerToken.clientId,
					clientSecret: importData.workerToken.clientSecret,
					scopes: importData.workerToken.scopes || [],
					region: importData.workerToken.region || 'us',
					tokenEndpointAuthMethod: importData.workerToken.authMethod || 'client_secret_basic',
				};
			} else if (importData.credentials) {
				// Old format - backward compatibility
				credentials = importData.credentials;
			} else {
				throw new Error('Invalid configuration format: expected workerToken or credentials field');
			}

			// Validate required fields
			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				throw new Error('Missing required credentials fields');
			}

			// Import the configuration
			await this.saveCredentials(credentials);

			logger.info(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Successfully imported worker token configuration`
			);
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to import config:`,
				undefined,
				error as Error
			);
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

			logger.info('UnifiedWorkerTokenService', `${MODULE_TAG} Configuration downloaded`);
		} catch (error) {
			logger.error(
				'UnifiedWorkerTokenService',
				`${MODULE_TAG} Failed to download config:`,
				undefined,
				error as Error
			);
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

	// Add debug helper for resetting logging state
	window.resetWorkerTokenLogging = () => {
		UnifiedWorkerTokenService.resetLoggingState();
		logger.info('UnifiedWorkerTokenService', ' Worker token logging state reset');
	};
}

export default unifiedWorkerTokenService;
