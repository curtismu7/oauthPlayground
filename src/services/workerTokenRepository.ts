/**
 * @file workerTokenRepository.ts
 * @description Repository pattern for worker token data access
 * @version 2.0.0
 *
 * This repository provides a clean abstraction over storage operations
 * and handles data transformation between different formats.
 */

import { logger } from '../utils/logger';
import { unifiedStorageManager } from './unifiedStorageManager';
import {
	unifiedWorkerTokenService,
	type UnifiedWorkerTokenCredentials,
	type UnifiedWorkerTokenData,
} from './unifiedWorkerTokenService';

const MODULE_TAG = '[ WORKER-TOKEN-REPO]';

/**
 * Utility function to mask tokens for security
 * Shows first 8 characters, masks middle, shows last 4 characters
 */
const maskToken = (token: string): string => {
	if (!token || token.length <= 12) {
		return '••••••••';
	}
	return `${token.slice(0, 8)}...${token.slice(-4)}`;
};

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
		logger.info('WorkerTokenRepository', `${MODULE_TAG} Saving credentials...`);

		const data = {
			credentials,
			savedAt: Date.now(),
		};

		await unifiedStorageManager.save(CREDENTIALS_KEY, data);
		logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Credentials saved`);
	}

	/**
	 * Load worker token credentials
	 * Falls back to unified_worker_token (saved by WorkerTokenModal/unifiedWorkerTokenService) when
	 * unified_worker_token_credentials is empty — fixes "Worker Token credentials not configured" when user has valid credentials.
	 */
	async loadCredentials(): Promise<UnifiedWorkerTokenCredentials | null> {
		logger.info('WorkerTokenRepository', `${MODULE_TAG} Loading credentials...`);

		try {
			const data = await unifiedStorageManager.load<{
				credentials: UnifiedWorkerTokenCredentials;
				savedAt: number;
			}>(CREDENTIALS_KEY);

			if (data?.credentials) {
				logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Credentials loaded`);
				return this.ensureTokenEndpoint(data.credentials);
			}

			// Fallback: credentials saved by WorkerTokenModal/unifiedWorkerTokenService use unified_worker_token key
			const unified = await unifiedStorageManager.load<{
				credentials?: UnifiedWorkerTokenCredentials;
				token?: string;
				savedAt?: number;
			}>(TOKEN_KEY);

			if (unified?.credentials?.environmentId && unified?.credentials?.clientId && unified?.credentials?.clientSecret) {
				logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Credentials loaded from unified_worker_token`);
				return this.ensureTokenEndpoint(unified.credentials);
			}

			// Legacy: try localStorage unified_worker_token directly (unifiedStorageManager may use different key)
			try {
				const stored = localStorage.getItem(TOKEN_KEY);
				if (stored) {
					const parsed = JSON.parse(stored) as { credentials?: UnifiedWorkerTokenCredentials };
					if (parsed?.credentials?.environmentId && parsed?.credentials?.clientId && parsed?.credentials?.clientSecret) {
						logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Credentials loaded from localStorage fallback`);
						return this.ensureTokenEndpoint(parsed.credentials);
					}
				}
			} catch {
				// Ignore parse errors
			}

			logger.info('WorkerTokenRepository', `${MODULE_TAG} ❌ No credentials found`);
			return null;
		} catch (error) {
			logger.error(
				'WorkerTokenRepository',
				`${MODULE_TAG} Failed to load credentials:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/** Ensure tokenEndpoint is set for token fetch (builds from region if missing) */
	private ensureTokenEndpoint(creds: UnifiedWorkerTokenCredentials): UnifiedWorkerTokenCredentials {
		if (creds.tokenEndpoint?.trim()) return creds;
		return {
			...creds,
			tokenEndpoint: unifiedWorkerTokenService.buildTokenEndpoint(creds),
		};
	}

	/**
	 * Save worker token with metadata
	 */
	async saveToken(token: string, metadata?: Partial<TokenMetadata>): Promise<void> {
		logger.info('WorkerTokenRepository', `${MODULE_TAG} Saving token...`);

		// DEBUG: Log the token being saved
		logger.info('WorkerTokenRepository', `${MODULE_TAG} 🔍 DEBUG - Saving token:`, {
			arg0: {
				hasToken: !!token,
				tokenLength: token?.length || 0,
				tokenPrefix: token ? maskToken(token) : 'none',
				isUrlParams: token?.includes('query_parameters=') || token?.includes('response_type='),
				isValidAccessToken: !!token?.match(/^[A-Za-z0-9\-_]+$/),
			},
		});

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
		logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Token saved`);
	}

	/**
	 * Load worker token data
	 */
	async loadTokenData(): Promise<UnifiedWorkerTokenData | null> {
		logger.info('WorkerTokenRepository', `${MODULE_TAG} Loading token data...`);

		try {
			const data = await unifiedStorageManager.load<UnifiedWorkerTokenData>(TOKEN_KEY);

			if (data?.token) {
				logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Token data loaded`);
				return data;
			}

			logger.info('WorkerTokenRepository', `${MODULE_TAG} ❌ No token found`);
			return null;
		} catch (error) {
			logger.error(
				'WorkerTokenRepository',
				`${MODULE_TAG} Failed to load token data:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/**
	 * Get just the token string
	 */
	async getToken(): Promise<string | null> {
		const data = await this.loadTokenData();

		if (!data) return null;

		// DEBUG: Log the actual token being retrieved (avoid Invalid time value for bad expiresAt)
		const expiresAtMs = data.expiresAt != null ? new Date(data.expiresAt).getTime() : NaN;
		const expiresAtLabel =
			Number.isNaN(expiresAtMs) || expiresAtMs <= 0 ? 'none' : new Date(expiresAtMs).toISOString();
		logger.info('WorkerTokenRepository', `${MODULE_TAG} 🔍 DEBUG - Retrieved token:`, {
			arg0: {
				hasToken: !!data.token,
				tokenLength: data.token?.length || 0,
				tokenPrefix: data.token ? maskToken(data.token) : 'none',
				isUrlParams:
					data.token?.includes('query_parameters=') || data.token?.includes('response_type='),
				expiresAt: expiresAtLabel,
			},
		});

		// Check expiration (guard against invalid expiresAt to avoid Invalid time value)
		const expiresAtNum =
			data.expiresAt != null ? new Date(data.expiresAt).getTime() : NaN;
		if (!Number.isNaN(expiresAtNum) && Date.now() > expiresAtNum) {
			logger.info('WorkerTokenRepository', `${MODULE_TAG} Token expired, clearing`);
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
		logger.info('WorkerTokenRepository', `${MODULE_TAG} Clearing credentials...`);

		await unifiedStorageManager.clear(CREDENTIALS_KEY);
		await this.clearToken(); // Also clear token when credentials are cleared

		logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Credentials cleared`);
	}

	/**
	 * Clear only the token (keep credentials)
	 */
	async clearToken(): Promise<void> {
		logger.info('WorkerTokenRepository', `${MODULE_TAG} Clearing token...`);

		await unifiedStorageManager.clear(TOKEN_KEY);

		logger.info('WorkerTokenRepository', `${MODULE_TAG} ✅ Token cleared`);
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

		logger.info(
			'WorkerTokenRepository',
			`${MODULE_TAG} Checking ${legacyKeys.length} legacy keys...`
		);

		for (const key of legacyKeys) {
			try {
				const stored = localStorage.getItem(key);
				logger.info('WorkerTokenRepository', `${MODULE_TAG} Legacy key ${key}:`, {
					arg0: { hasData: !!stored },
				});

				if (stored) {
					const legacyData = JSON.parse(stored);
					logger.info('WorkerTokenRepository', `${MODULE_TAG} 📦 Found legacy data in ${key}:`, {
						arg0: {
							hasEnvironmentId: !!legacyData.environmentId || !!legacyData.environment_id,
							hasClientId: !!legacyData.clientId || !!legacyData.client_id,
							hasClientSecret: !!legacyData.clientSecret || !!legacyData.client_secret,
						},
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
						logger.warn(
							'WorkerTokenRepository',
							`${MODULE_TAG} ⚠️ Legacy data missing required fields, skipping`,
							{
								arg0: {
									key,
									hasEnvironmentId: !!unifiedCredentials.environmentId,
									hasClientId: !!unifiedCredentials.clientId,
									hasClientSecret: !!unifiedCredentials.clientSecret,
								},
							}
						);
						continue;
					}

					// Save in unified format
					await this.saveCredentials(unifiedCredentials);

					logger.info(
						'WorkerTokenRepository',
						`${MODULE_TAG} 🔄 Successfully migrated credentials from legacy key: ${key}`,
						{
							arg0: {
								environmentId: `${unifiedCredentials.environmentId?.substring(0, 8)}...`,
								clientId: `${unifiedCredentials.clientId?.substring(0, 8)}...`,
								hasClientSecret: !!unifiedCredentials.clientSecret,
							},
						}
					);

					// Clean up legacy storage
					localStorage.removeItem(key);

					return unifiedCredentials;
				}
			} catch (error) {
				logger.warn(
					'WorkerTokenRepository',
					`${MODULE_TAG} ⚠️ Failed to migrate from legacy key ${key}:`,
					undefined,
					error as Error
				);
			}
		}

		logger.info(
			'WorkerTokenRepository',
			`${MODULE_TAG} ❌ No valid legacy credentials found for migration`
		);
		return null;
	}
}

// Export singleton instance
export const workerTokenRepository = WorkerTokenRepository.getInstance();

export default workerTokenRepository;
