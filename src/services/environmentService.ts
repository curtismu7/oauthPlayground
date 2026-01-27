/**
 * @file environmentService.ts
 * @module services
 * @description Global Environment ID management service
 * @version 1.0.0
 * @since 2025-01-27
 *
 * Centralizes environment ID storage and access across the entire application.
 * Replaces scattered environmentId management in 679+ files.
 */

import React from 'react';

export interface EnvironmentConfig {
	environmentId: string;
	region: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
	lastUpdated: number;
}

export interface EnvironmentServiceConfig {
	defaultRegion?: 'us' | 'eu' | 'ap' | 'ca';
	autoSave?: boolean;
	enableEvents?: boolean;
}

class EnvironmentService {
	private static instance: EnvironmentService;
	private config: EnvironmentServiceConfig = {
		defaultRegion: 'us',
		autoSave: true,
		enableEvents: true,
	};
	private currentEnvironment: EnvironmentConfig | null = null;
	private listeners: Set<(environment: EnvironmentConfig | null) => void> = new Set();
	private readonly STORAGE_KEY = 'oauth-playground-environment';

	private constructor() {
		this.loadFromStorage();
	}

	static getInstance(): EnvironmentService {
		if (!EnvironmentService.instance) {
			EnvironmentService.instance = new EnvironmentService();
		}
		return EnvironmentService.instance;
	}

	/**
	 * Configure the environment service
	 */
	configure(config: Partial<EnvironmentServiceConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get the current environment ID
	 */
	getEnvironmentId(): string {
		return this.currentEnvironment?.environmentId || '';
	}

	/**
	 * Get the current region
	 */
	getRegion(): 'us' | 'eu' | 'ap' | 'ca' {
		return this.currentEnvironment?.region || this.config.defaultRegion || 'us';
	}

	/**
	 * Get the custom domain (if set)
	 */
	getCustomDomain(): string | undefined {
		return this.currentEnvironment?.customDomain;
	}

	/**
	 * Get the full environment configuration
	 */
	getEnvironment(): EnvironmentConfig | null {
		return this.currentEnvironment;
	}

	/**
	 * Check if environment is configured
	 */
	hasEnvironment(): boolean {
		return !!this.currentEnvironment?.environmentId?.trim();
	}

	/**
	 * Set the environment ID
	 */
	setEnvironmentId(environmentId: string, options?: { region?: 'us' | 'eu' | 'ap' | 'ca'; customDomain?: string }): void {
		const trimmedId = environmentId.trim();
		
		if (!trimmedId) {
			this.clearEnvironment();
			return;
		}

		const newEnvironment: EnvironmentConfig = {
			environmentId: trimmedId,
			region: options?.region || this.currentEnvironment?.region || this.config.defaultRegion || 'us',
			customDomain: options?.customDomain,
			lastUpdated: Date.now(),
		};

		this.currentEnvironment = newEnvironment;
		
		if (this.config.autoSave) {
			this.saveToStorage();
		}

		if (this.config.enableEvents) {
			this.notifyListeners();
		}
	}

	/**
	 * Set the region
	 */
	setRegion(region: 'us' | 'eu' | 'ap' | 'ca'): void {
		if (!this.currentEnvironment) {
			return;
		}

		this.currentEnvironment.region = region;
		this.currentEnvironment.lastUpdated = Date.now();

		if (this.config.autoSave) {
			this.saveToStorage();
		}

		if (this.config.enableEvents) {
			this.notifyListeners();
		}
	}

	/**
	 * Set the custom domain
	 */
	setCustomDomain(customDomain: string | undefined): void {
		if (!this.currentEnvironment) {
			return;
		}

		this.currentEnvironment.customDomain = customDomain?.trim() || undefined;
		this.currentEnvironment.lastUpdated = Date.now();

		if (this.config.autoSave) {
			this.saveToStorage();
		}

		if (this.config.enableEvents) {
			this.notifyListeners();
		}
	}

	/**
	 * Update multiple properties at once
	 */
	updateEnvironment(updates: Partial<Omit<EnvironmentConfig, 'lastUpdated'>>): void {
		if (!this.currentEnvironment && !updates.environmentId) {
			return;
		}

		if (!this.currentEnvironment) {
			// Create new environment if it doesn't exist
			this.setEnvironmentId(updates.environmentId || '');
			return;
		}

		this.currentEnvironment = {
			...this.currentEnvironment,
			...updates,
			lastUpdated: Date.now(),
		};

		if (this.config.autoSave) {
			this.saveToStorage();
		}

		if (this.config.enableEvents) {
			this.notifyListeners();
		}
	}

	/**
	 * Clear the environment
	 */
	clearEnvironment(): void {
		this.currentEnvironment = null;
		
		if (this.config.autoSave) {
			this.saveToStorage();
		}

		if (this.config.enableEvents) {
			this.notifyListeners();
		}
	}

	/**
	 * Get the PingOne domain for the environment
	 */
	getPingOneDomain(): string {
		const customDomain = this.getCustomDomain();
		if (customDomain) {
			return customDomain;
		}

		const region = this.getRegion();
		const regionDomains: Record<string, string> = {
			us: 'https://auth.pingone.com',
			eu: 'https://auth.pingone.eu',
			ap: 'https://auth.pingone.asia',
			ca: 'https://auth.pingone.ca',
		};

		return regionDomains[region] || regionDomains.us;
	}

	/**
	 * Get the PingOne API domain for the environment
	 */
	getPingOneApiDomain(): string {
		const customDomain = this.getCustomDomain();
		if (customDomain) {
			return customDomain;
		}

		const region = this.getRegion();
		const regionDomains: Record<string, string> = {
			us: 'https://api.pingone.com',
			eu: 'https://api.pingone.eu',
			ap: 'https://api.pingone.asia',
			ca: 'https://api.pingone.ca',
		};

		return regionDomains[region] || regionDomains.us;
	}

	/**
	 * Subscribe to environment changes
	 */
	subscribe(listener: (environment: EnvironmentConfig | null) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/**
	 * Get environment statistics
	 */
	getStats(): {
		hasEnvironment: boolean;
		environmentId: string;
		region: string;
		hasCustomDomain: boolean;
		lastUpdated: number | null;
		age: string | null;
	} {
		const env = this.currentEnvironment;
		
		return {
			hasEnvironment: !!env,
			environmentId: env?.environmentId || '',
			region: env?.region || this.config.defaultRegion || 'us',
			hasCustomDomain: !!env?.customDomain,
			lastUpdated: env?.lastUpdated || null,
			age: env?.lastUpdated ? this.formatAge(Date.now() - env.lastUpdated) : null,
		};
	}

	/**
	 * Export environment configuration
	 */
	export(): string {
		return JSON.stringify(this.currentEnvironment, null, 2);
	}

	/**
	 * Import environment configuration
	 */
	import(configJson: string): boolean {
		try {
			const config = JSON.parse(configJson) as Partial<EnvironmentConfig>;
			
			if (config.environmentId) {
				this.setEnvironmentId(config.environmentId, {
					region: config.region,
					customDomain: config.customDomain,
				});
				return true;
			}
			
			return false;
		} catch {
			return false;
		}
	}

	private saveToStorage(): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentEnvironment));
		} catch (error) {
			console.warn('[EnvironmentService] Failed to save to localStorage:', error);
		}
	}

	private loadFromStorage(): void {
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as EnvironmentConfig | null;
				this.currentEnvironment = parsed;
			}
		} catch (error) {
			console.warn('[EnvironmentService] Failed to load from localStorage:', error);
			this.currentEnvironment = null;
		}
	}

	private notifyListeners(): void {
		this.listeners.forEach(listener => {
			try {
				listener(this.currentEnvironment);
			} catch (error) {
				console.warn('[EnvironmentService] Error in listener:', error);
			}
		});
	}

	private formatAge(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
		if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
		return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
	}
}

// Singleton instance
export const environmentService = EnvironmentService.getInstance();

// Export convenience functions
export const getEnvironmentId = () => environmentService.getEnvironmentId();
export const getRegion = () => environmentService.getRegion();
export const getCustomDomain = () => environmentService.getCustomDomain();
export const setEnvironmentId = (environmentId: string, options?: { region?: 'us' | 'eu' | 'ap' | 'ca'; customDomain?: string }) => 
	environmentService.setEnvironmentId(environmentId, options);
export const setRegion = (region: 'us' | 'eu' | 'ap' | 'ca') => environmentService.setRegion(region);
export const setCustomDomain = (customDomain: string | undefined) => environmentService.setCustomDomain(customDomain);
export const hasEnvironment = () => environmentService.hasEnvironment();
export const clearEnvironment = () => environmentService.clearEnvironment();

// React hook for environment management
export const useEnvironment = () => {
	const [environment, setEnvironment] = React.useState<EnvironmentConfig | null>(null);

	React.useEffect(() => {
		// Set initial state
		setEnvironment(environmentService.getEnvironment());

		// Subscribe to changes
		const unsubscribe = environmentService.subscribe(setEnvironment);

		return unsubscribe;
	}, []);

	return {
		environment,
		environmentId: environment?.environmentId || '',
		region: environment?.region || 'us',
		customDomain: environment?.customDomain,
		hasEnvironment: !!environment?.environmentId?.trim(),
		setEnvironmentId: (environmentId: string, options?: { region?: 'us' | 'eu' | 'ap' | 'ca'; customDomain?: string }) => 
			environmentService.setEnvironmentId(environmentId, options),
		setRegion: (region: 'us' | 'eu' | 'ap' | 'ca') => environmentService.setRegion(region),
		setCustomDomain: (customDomain: string | undefined) => environmentService.setCustomDomain(customDomain),
		updateEnvironment: (updates: Partial<Omit<EnvironmentConfig, 'lastUpdated'>>) => 
			environmentService.updateEnvironment(updates),
		clearEnvironment: () => environmentService.clearEnvironment(),
		getPingOneDomain: () => environmentService.getPingOneDomain(),
		getPingOneApiDomain: () => environmentService.getPingOneApiDomain(),
		getStats: () => environmentService.getStats(),
		export: () => environmentService.export(),
		import: (configJson: string) => environmentService.import(configJson),
	};
};
