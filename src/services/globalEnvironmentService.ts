// src/services/globalEnvironmentService.ts
// Global Environment Configuration Service
// Manages persistent environment ID across all flows and pages

export interface GlobalEnvironmentConfig {
	environmentId: string;
	region: 'us' | 'eu' | 'ap' | 'ca';
	lastUpdated: number;
	source: 'user-input' | 'discovery' | 'auto-detected';
}

/**
 * Global Environment Service
 * Provides persistent storage and management of environment ID across the application
 */
class GlobalEnvironmentService {
	private readonly STORAGE_KEY = 'global_environment_config';
	private cache: GlobalEnvironmentConfig | null = null;

	/**
	 * Get the current global environment configuration
	 */
	getEnvironmentConfig(): GlobalEnvironmentConfig | null {
		// Check cache first
		if (this.cache) {
			return this.cache;
		}

		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				const config = JSON.parse(stored) as GlobalEnvironmentConfig;

				// Validate the config structure
				if (this.isValidConfig(config)) {
					this.cache = config;
					return config;
				} else {
					console.warn('[GlobalEnvironment] Invalid stored config, clearing');
					this.clearEnvironmentConfig();
				}
			}
		} catch (error) {
			console.error('[GlobalEnvironment] Failed to load config:', error);
			this.clearEnvironmentConfig();
		}

		return null;
	}

	/**
	 * Get just the environment ID
	 */
	getEnvironmentId(): string | null {
		const config = this.getEnvironmentConfig();
		return config?.environmentId || null;
	}

	/**
	 * Get the region
	 */
	getRegion(): 'us' | 'eu' | 'ap' | 'ca' {
		const config = this.getEnvironmentConfig();
		return config?.region || 'us';
	}

	/**
	 * Set the global environment configuration
	 */
	setEnvironmentConfig(config: Omit<GlobalEnvironmentConfig, 'lastUpdated'>): void {
		const fullConfig: GlobalEnvironmentConfig = {
			...config,
			lastUpdated: Date.now(),
		};

		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullConfig));
			this.cache = fullConfig;

			// Dispatch custom event for cross-tab communication
			window.dispatchEvent(
				new CustomEvent('globalEnvironmentChanged', {
					detail: fullConfig,
				})
			);

			console.log('[GlobalEnvironment] Updated global environment config:', {
				environmentId: fullConfig.environmentId,
				region: fullConfig.region,
				source: fullConfig.source,
			});
		} catch (error) {
			console.error('[GlobalEnvironment] Failed to save config:', error);
			throw new Error('Failed to save global environment configuration');
		}
	}

	/**
	 * Set environment ID with auto-detected region
	 */
	setEnvironmentId(
		environmentId: string,
		source: 'user-input' | 'discovery' | 'auto-detected' = 'user-input'
	): void {
		// Auto-detect region from environment ID if possible
		const region = this.detectRegionFromEnvironmentId(environmentId);

		this.setEnvironmentConfig({
			environmentId,
			region,
			source,
		});
	}

	/**
	 * Clear the global environment configuration
	 */
	clearEnvironmentConfig(): void {
		try {
			localStorage.removeItem(this.STORAGE_KEY);
			this.cache = null;

			// Dispatch custom event
			window.dispatchEvent(new CustomEvent('globalEnvironmentCleared'));

			console.log('[GlobalEnvironment] Cleared global environment config');
		} catch (error) {
			console.error('[GlobalEnvironment] Failed to clear config:', error);
		}
	}

	/**
	 * Check if a global environment ID is configured
	 */
	hasEnvironmentId(): boolean {
		return this.getEnvironmentId() !== null;
	}

	/**
	 * Get environment history (for future use)
	 */
	getEnvironmentHistory(): GlobalEnvironmentConfig[] {
		try {
			const stored = localStorage.getItem(`${this.STORAGE_KEY}_history`);
			if (stored) {
				return JSON.parse(stored) as GlobalEnvironmentConfig[];
			}
		} catch (error) {
			console.error('[GlobalEnvironment] Failed to load history:', error);
		}
		return [];
	}

	/**
	 * Auto-detect region from environment ID
	 * This is a heuristic - in a real implementation, you might call an API
	 */
	private detectRegionFromEnvironmentId(_environmentId: string): 'us' | 'eu' | 'ap' | 'ca' {
		// For now, default to US, but you could implement region detection logic here
		// For example, check environment ID patterns or call a discovery API
		return 'us';
	}

	/**
	 * Validate configuration structure
	 */
	private isValidConfig(config: any): config is GlobalEnvironmentConfig {
		return (
			config &&
			typeof config === 'object' &&
			typeof config.environmentId === 'string' &&
			config.environmentId.trim().length > 0 &&
			['us', 'eu', 'ap', 'ca'].includes(config.region) &&
			typeof config.lastUpdated === 'number' &&
			['user-input', 'discovery', 'auto-detected'].includes(config.source)
		);
	}

	/**
	 * Listen for environment changes from other tabs
	 */
	setupCrossTabSync(): () => void {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === this.STORAGE_KEY) {
				// Clear cache to force reload
				this.cache = null;

				// Dispatch local event
				try {
					const config = e.newValue ? JSON.parse(e.newValue) : null;
					window.dispatchEvent(
						new CustomEvent('globalEnvironmentChanged', {
							detail: config,
						})
					);
				} catch (error) {
					console.error('[GlobalEnvironment] Failed to parse storage change:', error);
				}
			}
		};

		const handleLocalChange = () => {
			// Clear cache when local changes occur
			this.cache = null;
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('globalEnvironmentChanged', handleLocalChange);

		// Return cleanup function
		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('globalEnvironmentChanged', handleLocalChange);
		};
	}

	/**
	 * Get suggested environment IDs from history
	 */
	getSuggestedEnvironmentIds(): string[] {
		const history = this.getEnvironmentHistory();
		return history.map((h) => h.environmentId);
	}
}

// Export singleton instance
export const globalEnvironmentService = new GlobalEnvironmentService();

// Helper functions for easier access
export const getGlobalEnvironmentId = () => globalEnvironmentService.getEnvironmentId();
export const setGlobalEnvironmentId = (
	environmentId: string,
	source?: 'user-input' | 'discovery' | 'auto-detected'
) => globalEnvironmentService.setEnvironmentId(environmentId, source);
export const hasGlobalEnvironmentId = () => globalEnvironmentService.hasEnvironmentId();
export const clearGlobalEnvironmentId = () => globalEnvironmentService.clearEnvironmentConfig();
