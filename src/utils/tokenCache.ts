// Token caching utilities for worker tokens

import { logger } from './logger';
import { WorkerTokenResponse } from './workerToken';

export interface CachedToken {
	token: WorkerTokenResponse;
	issuedAt: number;
	expiresAt: number;
	cacheKey: string;
}

const TOKEN_CACHE_PREFIX = 'worker_token_cache_';
const DEFAULT_TTL_PERCENT = 0.8; // Refresh at 80% of token lifetime

/**
 * Get cached token by cache key
 */
export function getCachedToken(cacheKey: string): CachedToken | null {
	try {
		const cached = localStorage.getItem(`${TOKEN_CACHE_PREFIX}${cacheKey}`);
		if (!cached) {
			return null;
		}

		const parsed = JSON.parse(cached);

		// Check if token is still valid
		if (Date.now() >= parsed.expiresAt) {
			logger.info('CACHE', 'Token expired, removing from cache', {
				cacheKey,
				expiresAt: new Date(parsed.expiresAt).toISOString(),
			});
			localStorage.removeItem(`${TOKEN_CACHE_PREFIX}${cacheKey}`);
			return null;
		}

		logger.info('CACHE', 'Token retrieved from cache', {
			cacheKey,
			expiresAt: new Date(parsed.expiresAt).toISOString(),
			timeRemaining: Math.round((parsed.expiresAt - Date.now()) / 1000),
		});

		return parsed;
	} catch (error) {
		logger.error('CACHE', 'Failed to retrieve cached token', error);
		return null;
	}
}

/**
 * Set cached token with TTL
 */
export function setCachedToken(
	cacheKey: string,
	token: WorkerTokenResponse,
	ttl: number = DEFAULT_TTL_PERCENT
): void {
	try {
		const issuedAt = Date.now();
		const expiresAt = issuedAt + token.expires_in * 1000;

		const cachedToken: CachedToken = {
			token,
			issuedAt,
			expiresAt,
			cacheKey,
		};

		localStorage.setItem(`${TOKEN_CACHE_PREFIX}${cacheKey}`, JSON.stringify(cachedToken));

		logger.success('CACHE', 'Token cached successfully', {
			cacheKey,
			expiresIn: token.expires_in,
			expiresAt: new Date(expiresAt).toISOString(),
			ttl,
		});
	} catch (error) {
		logger.error('CACHE', 'Failed to cache token', error);
	}
}

/**
 * Check if token should be refreshed
 */
export function shouldRefreshToken(
	cachedToken: CachedToken,
	ttlPercent: number = DEFAULT_TTL_PERCENT
): boolean {
	const now = Date.now();
	const refreshThreshold = cachedToken.issuedAt + cachedToken.token.expires_in * 1000 * ttlPercent;

	const shouldRefresh = now >= refreshThreshold;

	if (shouldRefresh) {
		logger.info('CACHE', 'Token should be refreshed', {
			cacheKey: cachedToken.cacheKey,
			refreshThreshold: new Date(refreshThreshold).toISOString(),
			currentTime: new Date(now).toISOString(),
		});
	}

	return shouldRefresh;
}

/**
 * Remove cached token
 */
export function removeCachedToken(cacheKey: string): void {
	try {
		localStorage.removeItem(`${TOKEN_CACHE_PREFIX}${cacheKey}`);
		logger.info('CACHE', 'Token removed from cache', { cacheKey });
	} catch (error) {
		logger.error('CACHE', 'Failed to remove cached token', error);
	}
}

/**
 * Clear all cached tokens
 */
export function clearAllCachedTokens(): void {
	try {
		const keys = Object.keys(localStorage);
		const tokenKeys = keys.filter((key) => key.startsWith(TOKEN_CACHE_PREFIX));

		tokenKeys.forEach((key) => {
			localStorage.removeItem(key);
		});

		logger.info('CACHE', 'All cached tokens cleared', { count: tokenKeys.length });
	} catch (error) {
		logger.error('CACHE', 'Failed to clear cached tokens', error);
	}
}

/**
 * Get all cached token keys
 */
export function getAllCachedTokenKeys(): string[] {
	try {
		const keys = Object.keys(localStorage);
		return keys
			.filter((key) => key.startsWith(TOKEN_CACHE_PREFIX))
			.map((key) => key.replace(TOKEN_CACHE_PREFIX, ''));
	} catch (error) {
		logger.error('CACHE', 'Failed to get cached token keys', error);
		return [];
	}
}

/**
 * Clean up expired tokens
 */
export function cleanupExpiredTokens(): number {
	try {
		const keys = getAllCachedTokenKeys();
		let cleanedCount = 0;

		keys.forEach((cacheKey) => {
			const cached = getCachedToken(cacheKey);
			if (!cached) {
				cleanedCount++;
			}
		});

		if (cleanedCount > 0) {
			logger.info('CACHE', 'Cleaned up expired tokens', { count: cleanedCount });
		}

		return cleanedCount;
	} catch (error) {
		logger.error('CACHE', 'Failed to cleanup expired tokens', error);
		return 0;
	}
}

/**
 * Get token cache statistics
 */
export function getTokenCacheStats(): {
	totalTokens: number;
	validTokens: number;
	expiredTokens: number;
	oldestToken: Date | null;
	newestToken: Date | null;
} {
	try {
		const keys = getAllCachedTokenKeys();
		let validTokens = 0;
		let expiredTokens = 0;
		let oldestTime = Infinity;
		let newestTime = 0;

		keys.forEach((cacheKey) => {
			const cached = getCachedToken(cacheKey);
			if (cached) {
				validTokens++;
				if (cached.issuedAt < oldestTime) {
					oldestTime = cached.issuedAt;
				}
				if (cached.issuedAt > newestTime) {
					newestTime = cached.issuedAt;
				}
			} else {
				expiredTokens++;
			}
		});

		return {
			totalTokens: keys.length,
			validTokens,
			expiredTokens,
			oldestToken: oldestTime === Infinity ? null : new Date(oldestTime),
			newestToken: newestTime === 0 ? null : new Date(newestTime),
		};
	} catch (error) {
		logger.error('CACHE', 'Failed to get cache stats', error);
		return {
			totalTokens: 0,
			validTokens: 0,
			expiredTokens: 0,
			oldestToken: null,
			newestToken: null,
		};
	}
}

/**
 * Check if cache is near capacity (simple heuristic)
 */
export function isCacheNearCapacity(maxTokens: number = 50): boolean {
	const stats = getTokenCacheStats();
	return stats.totalTokens >= maxTokens * 0.8;
}

/**
 * Auto-refresh token if needed
 */
export async function autoRefreshTokenIfNeeded(
	cacheKey: string,
	refreshFunction: () => Promise<WorkerTokenResponse>,
	ttlPercent: number = DEFAULT_TTL_PERCENT
): Promise<CachedToken | null> {
	try {
		const cached = getCachedToken(cacheKey);

		if (!cached) {
			logger.info('CACHE', 'No cached token found, requesting new token', { cacheKey });
			const newToken = await refreshFunction();
			setCachedToken(cacheKey, newToken, ttlPercent);
			return getCachedToken(cacheKey);
		}

		if (shouldRefreshToken(cached, ttlPercent)) {
			logger.info('CACHE', 'Token needs refresh, requesting new token', { cacheKey });
			try {
				const newToken = await refreshFunction();
				setCachedToken(cacheKey, newToken, ttlPercent);
				return getCachedToken(cacheKey);
			} catch (_error) {
				logger.warn('CACHE', 'Failed to refresh token, using cached token', { cacheKey });
				return cached;
			}
		}

		return cached;
	} catch (error) {
		logger.error('CACHE', 'Failed to auto-refresh token', error);
		return null;
	}
}
