/**
 * @file workerTokenRepository.ts
 * @description Repository pattern for worker token data access
 * @version 2.0.0
 *
 * This repository provides a clean abstraction over storage operations
 * and handles data transformation between different formats.
 */

import { unifiedStorageManager } from './unifiedStorageManager';
import type {
	UnifiedWorkerTokenCredentials,
	UnifiedWorkerTokenData,
} from './unifiedWorkerTokenService';

const MODULE_TAG = '[ WORKER-TOKEN-REPO]';

// Storage keys
const CREDENTIALS_KEY = 'unified_worker_token_credentials';
const TOKEN_KEY = 'unified_worker_token';

export interface TokenMetadata {
	expiresAt?: number;
	savedAt: number;
	lastUsedAt?: number;
	tokenType?: string;
	expiresIn?: number;
	scope?: string;
}

/**
 * Repository for worker token data access
 */
export class WorkerTokenRepository {
	private static instance: WorkerTokenRepository;

	private constructor() {}

	static getInstance(): WorkerTokenRepository {
		if (!WorkerTokenRepository.instance) {
			WorkerTokenRepository.instance = new WorkerTokenRepository();
		}
		return WorkerTokenRepository.instance;
	}

	/**
	 * Save worker token credentials
	 */
	async saveCredentials(credentials: UnifiedWorkerTokenCredentials): Promise<void> {
		console.log(`${MODULE_TAG} Saving credentials...`);

		const data = {
			credentials,
			savedAt: Date.now(),
		};

		await unifiedStorageManager.save(CREDENTIALS_KEY, data);
		console.log(`${MODULE_TAG} ✅ Credentials saved`);
	}

	/**
	 * Load worker token credentials
	 */
	async loadCredentials(): Promise<UnifiedWorkerTokenCredentials | null> {
		console.log(`${MODULE_TAG} Loading credentials...`);

		try {
			const data = await unifiedStorageManager.load<{
				credentials: UnifiedWorkerTokenCredentials;
				savedAt: number;
			}>(CREDENTIALS_KEY);

			if (data?.credentials) {
				console.log(`${MODULE_TAG} ✅ Credentials loaded`);
				return data.credentials;
			}

			console.log(`${MODULE_TAG} ❌ No credentials found`);
			return null;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load credentials:`, error);
			return null;
		}
	}

	/**
	 * Save worker token with metadata
	 */
	async saveToken(token: string, metadata?: Partial<TokenMetadata>): Promise<void> {
		console.log(`${MODULE_TAG} Saving token...`);

		const credentials = await this.loadCredentials();
		if (!credentials) {
			throw new Error('No credentials found. Save credentials first.');
		}

		const tokenData: UnifiedWorkerTokenData = {
			token,
			credentials,
			savedAt: Date.now(),
			...metadata,
		};

		await unifiedStorageManager.save(TOKEN_KEY, tokenData);
		console.log(`${MODULE_TAG} ✅ Token saved`);
	}

	/**
	 * Load worker token data
	 */
	async loadTokenData(): Promise<UnifiedWorkerTokenData | null> {
		console.log(`${MODULE_TAG} Loading token data...`);

		try {
			const data = await unifiedStorageManager.load<UnifiedWorkerTokenData>(TOKEN_KEY);

			if (data?.token) {
				console.log(`${MODULE_TAG} ✅ Token data loaded`);
				return data;
			}

			console.log(`${MODULE_TAG} ❌ No token found`);
			return null;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load token data:`, error);
			return null;
		}
	}

	/**
	 * Get just the token string
	 */
	async getToken(): Promise<string | null> {
		const data = await this.loadTokenData();

		if (!data) return null;

		// Check expiration
		if (data.expiresAt && Date.now() > data.expiresAt) {
			console.log(`${MODULE_TAG} Token expired, clearing`);
			await this.clearToken();
			return null;
		}

		// Update last used time
		data.lastUsedAt = Date.now();
		await unifiedStorageManager.save(TOKEN_KEY, data);

		return data.token;
	}

	/**
	 * Get token status
	 */
	async getStatus() {
		const credentials = await this.loadCredentials();
		const tokenData = await this.loadTokenData();

		// Defensive checks for metadata
		const expiresAt = tokenData?.expiresAt;
		const savedAt = tokenData?.savedAt;
		const lastUsedAt = tokenData?.lastUsedAt;

		return {
			hasCredentials: !!credentials,
			hasToken: !!tokenData?.token,
			tokenValid: this.isTokenValid(tokenData),
			tokenExpiresIn: expiresAt ? Math.floor((expiresAt - Date.now()) / 1000) : undefined,
			lastFetchedAt: savedAt,
			lastUsedAt: lastUsedAt,
			appInfo: credentials
				? {
						appId: credentials.appId,
						appName: credentials.appName,
						appVersion: credentials.appVersion,
					}
				: undefined,
		};
	}

	/**
	 * Clear credentials
	 */
	async clearCredentials(): Promise<void> {
		console.log(`${MODULE_TAG} Clearing credentials...`);

		await unifiedStorageManager.clear(CREDENTIALS_KEY);
		await this.clearToken(); // Also clear token when credentials are cleared

		console.log(`${MODULE_TAG} ✅ Credentials cleared`);
	}

	/**
	 * Clear only the token (keep credentials)
	 */
	async clearToken(): Promise<void> {
		console.log(`${MODULE_TAG} Clearing token...`);

		await unifiedStorageManager.clear(TOKEN_KEY);

		console.log(`${MODULE_TAG} ✅ Token cleared`);
	}

	/**
	 * Get storage metrics
	 */
	getMetrics() {
		return unifiedStorageManager.getMetrics();
	}

	/**
	 * Reset storage metrics
	 */
	resetMetrics(): void {
		unifiedStorageManager.resetMetrics();
	}

	/**
	 * Check if token is valid (not expired)
	 */
	private isTokenValid(tokenData: UnifiedWorkerTokenData | null): boolean {
		if (!tokenData) return false;

		const now = Date.now();
		const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

		return !tokenData.expiresAt || tokenData.expiresAt > now + bufferTime;
	}

	/**
	 * Migrate legacy credentials
	 */
	async migrateLegacyCredentials(): Promise<UnifiedWorkerTokenCredentials | null> {
		const legacyKeys = [
			'v8:worker_token',
			'pingone_worker_token_credentials',
			'worker_token',
			'worker_credentials',
		];

		console.log(`${MODULE_TAG} Checking ${legacyKeys.length} legacy keys...`);

		for (const key of legacyKeys) {
			try {
				const stored = localStorage.getItem(key);
				console.log(`${MODULE_TAG} Legacy key ${key}:`, { hasData: !!stored });

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
						// Add missing app info fields for legacy data
						appId: legacyData.appId || 'legacy-app',
						appName: legacyData.appName || 'Legacy Worker Token App',
						appVersion: legacyData.appVersion || '1.0.0',
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

					// Clean up legacy storage
					localStorage.removeItem(key);

					return unifiedCredentials;
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} ⚠️ Failed to migrate from legacy key ${key}:`, error);
			}
		}

		console.log(`${MODULE_TAG} ❌ No valid legacy credentials found for migration`);
		return null;
	}
}

// Export singleton instance
export const workerTokenRepository = WorkerTokenRepository.getInstance();

export default workerTokenRepository;
