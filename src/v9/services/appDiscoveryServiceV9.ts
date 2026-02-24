/**
 * @file appDiscoveryServiceV9.ts
 * @module v9/services
 * @description V9 Application Discovery Service with PingOne API integration
 * @version 9.25.1
 * @since 2026-02-23
 * 
 * Enhanced application discovery service featuring:
 * - PingOne API v1 integration
 * - Unified storage manager
 * - Performance optimizations
 * - Enhanced error handling
 * - Caching and retry logic
 */

import { unifiedStorageManager } from '@/services/unifiedStorageManager';
import { PingOneAPIServiceV9 } from './pingOneAPIServiceV9';

const MODULE_TAG = '[🔍 APP-DISCOVERY-V9]';

// Storage keys
const DISCOVERY_CACHE_KEY = 'app-discovery-cache';
const DISCOVERY_CONFIG_KEY = 'app-discovery-config';

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export interface DiscoveredApp {
	id: string;
	name: string;
	description?: string;
	enabled?: boolean;
	redirectUris?: string[];
	logoutUris?: string[];
	environmentId?: string;
	createdAt?: string;
	updatedAt?: string;
	discoveredAt?: string;
}

export interface DiscoveryCache {
	apps: DiscoveredApp[];
	timestamp: number;
	environmentId: string;
}

export interface DiscoveryConfig {
	enableCaching: boolean;
	cacheTTL: number;
	maxRetryAttempts: number;
	enableDetailedLogging: boolean;
}

/**
 * V9 Application Discovery Service
 * 
 * Provides enhanced application discovery with PingOne API integration,
 * caching, and improved error handling.
 */
export class AppDiscoveryServiceV9 {
	private static config: DiscoveryConfig = {
		enableCaching: true,
		cacheTTL: CACHE_TTL,
		maxRetryAttempts: MAX_RETRY_ATTEMPTS,
		enableDetailedLogging: true,
	};

	/**
	 * Initialize the service with configuration
	 */
	static async initialize(config?: Partial<DiscoveryConfig>): Promise<void> {
		if (config) {
			this.config = { ...this.config, ...config };
		}

		// Load persisted config
		try {
			const persistedConfig = await unifiedStorageManager.load<DiscoveryConfig>(
				DISCOVERY_CONFIG_KEY
			);
			if (persistedConfig) {
				this.config = { ...this.config, ...persistedConfig };
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to load config:`, error);
		}

		console.log(`${MODULE_TAG} Initialized with config:`, this.config);
	}

	/**
	 * Discover applications in a PingOne environment
	 */
	static async discoverApplications(
		environmentId: string,
		workerToken: string
	): Promise<DiscoveredApp[]> {
		console.log(`${MODULE_TAG} Discovering applications`, {
			environmentId: environmentId.substring(0, 20),
			hasToken: !!workerToken,
		});

		// Check cache first
		if (this.config.enableCaching) {
			const cached = await this.getCachedApplications(environmentId);
			if (cached) {
				console.log(`${MODULE_TAG} Returning cached applications`);
				return cached;
			}
		}

		// Discover from API
		const apps = await this.discoverFromAPI(environmentId, workerToken);

		// Cache results
		if (this.config.enableCaching && apps.length > 0) {
			await this.cacheApplications(environmentId, apps);
		}

		return apps;
	}

	/**
	 * Discover applications from PingOne API
	 */
	private static async discoverFromAPI(
		environmentId: string,
		workerToken: string
	): Promise<DiscoveredApp[]> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
			try {
				console.log(`${MODULE_TAG} API attempt ${attempt}/${this.config.maxRetryAttempts}`);

				// Use PingOne API service
				const response = await PingOneAPIServiceV9.getApplications(environmentId, {
					workerToken,
					include: ['redirectUris', 'logoutUris'],
				});

				if (!response.success || !response.data) {
					throw new Error(response.error?.message || 'Failed to fetch applications');
				}

				const apps: DiscoveredApp[] = response.data.map(app => ({
					id: app.id,
					name: app.name,
					description: app.description,
					enabled: app.enabled,
					redirectUris: app.redirectUris,
					logoutUris: app.logoutUris,
					environmentId,
					createdAt: app.createdAt,
					updatedAt: app.updatedAt,
					discoveredAt: new Date().toISOString(),
				}));

				console.log(`${MODULE_TAG} Successfully discovered ${apps.length} applications`);
				return apps;

			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error');
				console.error(`${MODULE_TAG} API attempt ${attempt} failed:`, lastError);

				if (attempt < this.config.maxRetryAttempts) {
					// Exponential backoff
					const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
					console.log(`${MODULE_TAG} Retrying in ${delay}ms`);
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			}
		}

		// All attempts failed
		throw lastError || new Error('Failed to discover applications after all retries');
	}

	/**
	 * Get cached applications
	 */
	private static async getCachedApplications(environmentId: string): Promise<DiscoveredApp[] | null> {
		try {
			const cache = await unifiedStorageManager.load<DiscoveryCache>(
				`${DISCOVERY_CACHE_KEY}-${environmentId}`
			);

			if (!cache) {
				return null;
			}

			// Check if cache is still valid
			const now = Date.now();
			if (now - cache.timestamp > this.config.cacheTTL) {
				console.log(`${MODULE_TAG} Cache expired`);
				await unifiedStorageManager.clear(`${DISCOVERY_CACHE_KEY}-${environmentId}`);
				return null;
			}

			console.log(`${MODULE_TAG} Using cached applications`);
			return cache.apps;
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to get cached applications:`, error);
			return null;
		}
	}

	/**
	 * Cache applications
	 */
	private static async cacheApplications(
		environmentId: string,
		apps: DiscoveredApp[]
	): Promise<void> {
		try {
			const cache: DiscoveryCache = {
				apps,
				timestamp: Date.now(),
				environmentId,
			};

			await unifiedStorageManager.save(
				`${DISCOVERY_CACHE_KEY}-${environmentId}`,
				cache
			);

			console.log(`${MODULE_TAG} Cached ${apps.length} applications`);
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to cache applications:`, error);
		}
	}

	/**
	 * Clear cache for an environment
	 */
	static async clearCache(environmentId?: string): Promise<void> {
		try {
			if (environmentId) {
				await unifiedStorageManager.clear(`${DISCOVERY_CACHE_KEY}-${environmentId}`);
				console.log(`${MODULE_TAG} Cleared cache for environment: ${environmentId}`);
			} else {
				// Clear all cache entries
				const keys = await unifiedStorageManager.getKeys();
				const cacheKeys = keys.filter(key => key.startsWith(DISCOVERY_CACHE_KEY));
				
				for (const key of cacheKeys) {
					await unifiedStorageManager.clear(key);
				}
				
				console.log(`${MODULE_TAG} Cleared all application cache`);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to clear cache:`, error);
		}
	}

	/**
	 * Get cache statistics
	 */
	static async getCacheStats(): Promise<{
		totalEntries: number;
		totalApps: number;
		oldestEntry: number | null;
		newestEntry: number | null;
	}> {
		try {
			const keys = await unifiedStorageManager.getKeys();
			const cacheKeys = keys.filter(key => key.startsWith(DISCOVERY_CACHE_KEY));
			
			let totalApps = 0;
			let oldestEntry: number | null = null;
			let newestEntry: number | null = null;

			for (const key of cacheKeys) {
				const cache = await unifiedStorageManager.load<DiscoveryCache>(key);
				if (cache) {
					totalApps += cache.apps.length;
					
					if (oldestEntry === null || cache.timestamp < oldestEntry) {
						oldestEntry = cache.timestamp;
					}
					
					if (newestEntry === null || cache.timestamp > newestEntry) {
						newestEntry = cache.timestamp;
					}
				}
			}

			return {
				totalEntries: cacheKeys.length,
				totalApps,
				oldestEntry,
				newestEntry,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to get cache stats:`, error);
			return {
				totalEntries: 0,
				totalApps: 0,
				oldestEntry: null,
				newestEntry: null,
			};
		}
	}

	/**
	 * Update configuration
	 */
	static async updateConfig(config: Partial<DiscoveryConfig>): Promise<void> {
		this.config = { ...this.config, ...config };
		
		try {
			await unifiedStorageManager.save(DISCOVERY_CONFIG_KEY, this.config);
			console.log(`${MODULE_TAG} Updated configuration:`, this.config);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save config:`, error);
		}
	}

	/**
	 * Get current configuration
	 */
	static getConfig(): DiscoveryConfig {
		return { ...this.config };
	}
}
