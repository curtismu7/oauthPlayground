// src/services/discoveryPersistenceService.ts
/**
 * Discovery Persistence Service
 * 
 * Centralized service for persisting and restoring OIDC discovery data
 * across the entire application. Once a user discovers endpoints for an
 * environment, the data is saved and automatically restored anywhere in
 * the app that needs it.
 * 
 * Features:
 * - Persists discovery data to localStorage
 * - Auto-restores on component mount
 * - Tracks multiple environments
 * - Manages discovery cache
 * - Environment ID → Full config mapping
 */

import { OIDCDiscoveryDocument } from './comprehensiveDiscoveryService';

export interface PersistedDiscoveryData {
	environmentId: string;
	issuerUrl: string;
	provider: string;
	document: OIDCDiscoveryDocument;
	timestamp: number;
	region?: string;
}

export interface DiscoveryCache {
	[environmentId: string]: PersistedDiscoveryData;
}

export class DiscoveryPersistenceService {
	private readonly STORAGE_KEY = 'oidc_discovery_cache';
	private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
	private readonly LAST_USED_KEY = 'oidc_last_used_environment';

	/**
	 * Save discovery data for an environment
	 */
	saveDiscovery(data: PersistedDiscoveryData): void {
		try {
			const cache = this.getCache();
			cache[data.environmentId] = {
				...data,
				timestamp: Date.now(),
			};

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
			
			// Also save as last used
			this.setLastUsedEnvironment(data.environmentId);
			
			console.log('[Discovery Persistence] Saved discovery for environment:', data.environmentId);
		} catch (error) {
			console.error('[Discovery Persistence] Failed to save discovery:', error);
		}
	}

	/**
	 * Get discovery data for a specific environment
	 */
	getDiscovery(environmentId: string): PersistedDiscoveryData | null {
		try {
			const cache = this.getCache();
			const data = cache[environmentId];

			if (!data) {
				return null;
			}

			// Check if cache is still valid
			if (Date.now() - data.timestamp > this.CACHE_DURATION) {
				console.log('[Discovery Persistence] Cache expired for:', environmentId);
				this.removeDiscovery(environmentId);
				return null;
			}

			console.log('[Discovery Persistence] Found cached discovery for:', environmentId);
			return data;
		} catch (error) {
			console.error('[Discovery Persistence] Failed to get discovery:', error);
			return null;
		}
	}

	/**
	 * Get discovery data by issuer URL
	 */
	getDiscoveryByIssuer(issuerUrl: string): PersistedDiscoveryData | null {
		try {
			const cache = this.getCache();
			
			// Find by matching issuer URL
			for (const data of Object.values(cache)) {
				if (data.issuerUrl === issuerUrl) {
					// Check if cache is still valid
					if (Date.now() - data.timestamp > this.CACHE_DURATION) {
						console.log('[Discovery Persistence] Cache expired for issuer:', issuerUrl);
						this.removeDiscovery(data.environmentId);
						return null;
					}

					console.log('[Discovery Persistence] Found cached discovery for issuer:', issuerUrl);
					return data;
				}
			}

			return null;
		} catch (error) {
			console.error('[Discovery Persistence] Failed to get discovery by issuer:', error);
			return null;
		}
	}

	/**
	 * Remove discovery data for an environment
	 */
	removeDiscovery(environmentId: string): void {
		try {
			const cache = this.getCache();
			delete cache[environmentId];
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
			console.log('[Discovery Persistence] Removed discovery for:', environmentId);
		} catch (error) {
			console.error('[Discovery Persistence] Failed to remove discovery:', error);
		}
	}

	/**
	 * Get all cached discoveries
	 */
	getAllDiscoveries(): PersistedDiscoveryData[] {
		try {
			const cache = this.getCache();
			const now = Date.now();

			// Filter out expired entries
			const validDiscoveries = Object.values(cache).filter(
				(data) => now - data.timestamp < this.CACHE_DURATION
			);

			// Clean up expired entries
			const validEnvironmentIds = new Set(validDiscoveries.map((d) => d.environmentId));
			const allEnvironmentIds = Object.keys(cache);
			
			for (const envId of allEnvironmentIds) {
				if (!validEnvironmentIds.has(envId)) {
					delete cache[envId];
				}
			}

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));

			return validDiscoveries;
		} catch (error) {
			console.error('[Discovery Persistence] Failed to get all discoveries:', error);
			return [];
		}
	}

	/**
	 * Clear all cached discoveries
	 */
	clearAll(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			localStorage.removeItem(this.LAST_USED_KEY);
			console.log('[Discovery Persistence] Cleared all discoveries');
		} catch (error) {
			console.error('[Discovery Persistence] Failed to clear discoveries:', error);
		}
	}

	/**
	 * Get or create cache
	 */
	private getCache(): DiscoveryCache {
		try {
			const cached = localStorage.getItem(this.STORAGE_KEY);
			return cached ? JSON.parse(cached) : {};
		} catch (error) {
			console.error('[Discovery Persistence] Failed to parse cache:', error);
			return {};
		}
	}

	/**
	 * Set last used environment
	 */
	private setLastUsedEnvironment(environmentId: string): void {
		try {
			localStorage.setItem(this.LAST_USED_KEY, environmentId);
		} catch (error) {
			console.error('[Discovery Persistence] Failed to set last used environment:', error);
		}
	}

	/**
	 * Get last used environment
	 */
	getLastUsedEnvironment(): string | null {
		try {
			return localStorage.getItem(this.LAST_USED_KEY);
		} catch (error) {
			console.error('[Discovery Persistence] Failed to get last used environment:', error);
			return null;
		}
	}

	/**
	 * Get last used discovery data
	 */
	getLastUsedDiscovery(): PersistedDiscoveryData | null {
		const lastUsedEnvId = this.getLastUsedEnvironment();
		if (!lastUsedEnvId) {
			return null;
		}

		return this.getDiscovery(lastUsedEnvId);
	}

	/**
	 * Check if environment has cached discovery
	 */
	hasDiscovery(environmentId: string): boolean {
		const data = this.getDiscovery(environmentId);
		return data !== null;
	}

	/**
	 * Get environment IDs that have cached discovery
	 */
	getCachedEnvironmentIds(): string[] {
		const discoveries = this.getAllDiscoveries();
		return discoveries.map((d) => d.environmentId);
	}

	/**
	 * Update discovery data (refresh timestamp)
	 */
	refreshDiscovery(environmentId: string): void {
		const data = this.getDiscovery(environmentId);
		if (data) {
			this.saveDiscovery(data);
		}
	}

	/**
	 * Export discovery data for backup
	 */
	exportDiscoveries(): string {
		const cache = this.getCache();
		return JSON.stringify(cache, null, 2);
	}

	/**
	 * Import discovery data from backup
	 */
	importDiscoveries(jsonData: string): { success: boolean; count: number; error?: string } {
		try {
			const imported = JSON.parse(jsonData);
			
			if (typeof imported !== 'object' || imported === null) {
				throw new Error('Invalid import data');
			}

			// Validate each entry
			let count = 0;
			for (const [envId, data] of Object.entries(imported)) {
				if (this.isValidDiscoveryData(data as any)) {
					const cache = this.getCache();
					cache[envId] = data as PersistedDiscoveryData;
					count++;
				}
			}

			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.getCache()));
			
			console.log('[Discovery Persistence] Imported', count, 'discoveries');
			return { success: true, count };
		} catch (error) {
			console.error('[Discovery Persistence] Import failed:', error);
			return {
				success: false,
				count: 0,
				error: error instanceof Error ? error.message : 'Import failed',
			};
		}
	}

	/**
	 * Validate discovery data structure
	 */
	private isValidDiscoveryData(data: any): boolean {
		return (
			data &&
			typeof data === 'object' &&
			typeof data.environmentId === 'string' &&
			typeof data.issuerUrl === 'string' &&
			typeof data.provider === 'string' &&
			typeof data.timestamp === 'number' &&
			data.document &&
			typeof data.document === 'object'
		);
	}

	/**
	 * Get cache statistics
	 */
	getStats(): {
		totalCached: number;
		validCached: number;
		expiredCached: number;
		lastUsedEnvironment: string | null;
		oldestEntry: number | null;
		newestEntry: number | null;
	} {
		const cache = this.getCache();
		const allDiscoveries = Object.values(cache);
		const now = Date.now();

		const validDiscoveries = allDiscoveries.filter(
			(d) => now - d.timestamp < this.CACHE_DURATION
		);
		const expiredDiscoveries = allDiscoveries.filter(
			(d) => now - d.timestamp >= this.CACHE_DURATION
		);

		const timestamps = validDiscoveries.map((d) => d.timestamp);
		const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : null;
		const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : null;

		return {
			totalCached: allDiscoveries.length,
			validCached: validDiscoveries.length,
			expiredCached: expiredDiscoveries.length,
			lastUsedEnvironment: this.getLastUsedEnvironment(),
			oldestEntry,
			newestEntry,
		};
	}
}

// Export singleton instance
export const discoveryPersistenceService = new DiscoveryPersistenceService();

export default discoveryPersistenceService;












