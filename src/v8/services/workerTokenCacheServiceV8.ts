/**
 * @file workerTokenCacheServiceV8.ts
 * @module v8/services
 * @description Worker Token Caching Service for Preflight Validation
 * @version 8.0.0
 * @since 2026-01-24
 *
 * This service caches the last successful worker token to enable
 * preflight validation even when a fresh token isn't available.
 */

import { unifiedWorkerTokenServiceV2 } from '../../services/unifiedWorkerTokenServiceV2';

const MODULE_TAG = '[🔑 WORKER-TOKEN-CACHE-V8]';

interface CachedWorkerToken {
	token: string;
	expiresAt: number;
	createdAt: number;
	lastUsedAt: number;
	environmentId: string;
	clientId: string;
	scopes: string[];
}

interface CacheValidationResult {
	isValid: boolean;
	token: string | null;
	source: 'current' | 'cache' | 'none';
	issues: string[];
}

/**
 * Worker Token Cache Service V8
 * 
 * Provides caching functionality for worker tokens to enable
 * preflight validation when fresh tokens aren't available.
 */
export class WorkerTokenCacheServiceV8 {
	private static instance: WorkerTokenCacheServiceV8;
	private readonly CACHE_KEY = 'worker-token-cache-v8';
	private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

	private constructor() {}

	static getInstance(): WorkerTokenCacheServiceV8 {
		if (!WorkerTokenCacheServiceV8.instance) {
			WorkerTokenCacheServiceV8.instance = new WorkerTokenCacheServiceV8();
		}
		return WorkerTokenCacheServiceV8.instance;
	}

	/**
	 * Cache a worker token for future validation use
	 */
	async cacheWorkerToken(token: string, environmentId: string, clientId: string, scopes: string[]): Promise<void> {
		console.log(`${MODULE_TAG} Caching worker token for validation`);

		const cachedToken: CachedWorkerToken = {
			token,
			expiresAt: Date.now() + this.CACHE_DURATION,
			createdAt: Date.now(),
			lastUsedAt: Date.now(),
			environmentId,
			clientId,
			scopes
		};

		try {
			await this.saveCachedToken(cachedToken);
			console.log(`${MODULE_TAG} ✅ Worker token cached successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to cache worker token:`, error);
		}
	}

	/**
	 * Get a valid worker token for preflight validation
	 * Priority: 1) Current token, 2) Cached token, 3) null
	 */
	async getWorkerTokenForValidation(environmentId?: string, clientId?: string): Promise<CacheValidationResult> {
		console.log(`${MODULE_TAG} Getting worker token for validation`);

		// Try to get current token first
		const currentToken = await unifiedWorkerTokenServiceV2.getToken();
		if (currentToken) {
			console.log(`${MODULE_TAG} ✅ Using current worker token`);
			return {
				isValid: true,
				token: currentToken,
				source: 'current',
				issues: []
			};
		}

		// Try to get cached token
		const cachedToken = await this.getCachedToken(environmentId, clientId);
		if (cachedToken) {
			console.log(`${MODULE_TAG} ✅ Using cached worker token`);
			return {
				isValid: true,
				token: cachedToken.token,
				source: 'cache',
				issues: []
			};
		}

		console.log(`${MODULE_TAG} ❌ No worker token available for validation`);
		return {
			isValid: false,
			token: null,
			source: 'none',
			issues: ['No worker token available. Please generate a worker token first.']
		};
	}

	/**
	 * Update the cache when a new token is generated
	 */
	async updateCacheOnTokenGeneration(environmentId: string, clientId: string, scopes: string[]): Promise<void> {
		console.log(`${MODULE_TAG} Updating cache after token generation`);

		const token = await unifiedWorkerTokenServiceV2.getToken();
		if (token) {
			await this.cacheWorkerToken(token, environmentId, clientId, scopes);
		} else {
			console.warn(`${MODULE_TAG} ⚠️ No token available to cache after generation`);
		}
	}

	/**
	 * Clear the cached token
	 */
	async clearCache(): Promise<void> {
		console.log(`${MODULE_TAG} Clearing worker token cache`);

		try {
			await this.saveCachedToken(null);
			console.log(`${MODULE_TAG} ✅ Cache cleared`);
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to clear cache:`, error);
		}
	}

	/**
	 * Get cache status and statistics
	 */
	async getCacheStatus(): Promise<{
		hasCachedToken: boolean;
		cacheAge: number | null;
		cacheExpiresAt: number | null;
		environmentId: string | null;
		clientId: string | null;
	}> {
		const cachedToken = await this.getCachedToken();

		if (!cachedToken) {
			return {
				hasCachedToken: false,
				cacheAge: null,
				cacheExpiresAt: null,
				environmentId: null,
				clientId: null
			};
		}

		const now = Date.now();
		return {
			hasCachedToken: true,
			cacheAge: now - cachedToken.createdAt,
			cacheExpiresAt: cachedToken.expiresAt,
			environmentId: cachedToken.environmentId,
			clientId: cachedToken.clientId
		};
	}

	/**
	 * Clean up expired cache entries
	 */
	async cleanupExpiredCache(): Promise<void> {
		console.log(`${MODULE_TAG} Cleaning up expired cache entries`);

		const cachedToken = await this.getCachedToken();
		if (cachedToken && Date.now() > cachedToken.expiresAt) {
			await this.clearCache();
			console.log(`${MODULE_TAG} ✅ Expired cache entry removed`);
		}
	}

	/**
	 * Save cached token to storage
	 */
	private async saveCachedToken(token: CachedWorkerToken | null): Promise<void> {
		if (typeof window === 'undefined') return;

		if (token) {
			localStorage.setItem(this.CACHE_KEY, JSON.stringify(token));
		} else {
			localStorage.removeItem(this.CACHE_KEY);
		}
	}

	/**
	 * Load cached token from storage
	 */
	private async loadCachedToken(): Promise<CachedWorkerToken | null> {
		if (typeof window === 'undefined') return null;

		try {
			const cached = localStorage.getItem(this.CACHE_KEY);
			if (!cached) return null;

			const token = JSON.parse(cached) as CachedWorkerToken;

			// Validate structure
			if (!token.token || !token.expiresAt || !token.environmentId || !token.clientId) {
				console.warn(`${MODULE_TAG} ⚠️ Invalid cached token structure, removing`);
				await this.clearCache();
				return null;
			}

			return token;
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to load cached token:`, error);
			await this.clearCache();
			return null;
		}
	}

	/**
	 * Get cached token with validation
	 */
	private async getCachedToken(environmentId?: string, clientId?: string): Promise<CachedWorkerToken | null> {
		const token = await this.loadCachedToken();
		if (!token) return null;

		// Check expiration
		if (Date.now() > token.expiresAt) {
			console.log(`${MODULE_TAG} Cached token expired, removing`);
			await this.clearCache();
			return null;
		}

		// Check environment and client ID match if provided
		if (environmentId && token.environmentId !== environmentId) {
			console.log(`${MODULE_TAG} Cached token environment mismatch, removing`);
			await this.clearCache();
			return null;
		}

		if (clientId && token.clientId !== clientId) {
			console.log(`${MODULE_TAG} Cached token client ID mismatch, removing`);
			await this.clearCache();
			return null;
		}

		// Update last used time
		token.lastUsedAt = Date.now();
		await this.saveCachedToken(token);

		return token;
	}
}

// Export singleton instance
export const workerTokenCacheServiceV8 = WorkerTokenCacheServiceV8.getInstance();

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).workerTokenCacheServiceV8 = workerTokenCacheServiceV8;
}

export default workerTokenCacheServiceV8;
