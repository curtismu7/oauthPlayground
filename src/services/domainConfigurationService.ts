/**
 * @file domainConfigurationService.ts
 * @module services
 * @description Service for managing custom domain configuration
 * @version 1.0.0
 * @since 2025-01-XX
 *
 * This service provides centralized domain configuration management,
 * allowing users to configure custom domains instead of hardcoded localhost.
 */

import { z } from 'zod';

// Domain configuration schema
const DomainConfigSchema = z.object({
	customDomain: z.string().url().optional(),
	useCustomDomain: z.boolean().default(false),
	enforceHttps: z.boolean().default(true),
	lastValidated: z.string().optional(),
});

export type DomainConfig = z.infer<typeof DomainConfigSchema>;

// Storage key for domain configuration
const DOMAIN_CONFIG_KEY = 'oauth-playground-domain-config';

// Module tag for logging
const MODULE_TAG = '[🌐 DOMAIN-CONFIG-SERVICE]';

/**
 * Domain Configuration Service
 *
 * Provides centralized management of custom domain settings,
 * including validation, persistence, and fallback logic.
 */
export class DomainConfigurationService {
	private static instance: DomainConfigurationService;
	private config: DomainConfig;

	private constructor() {
		this.config = this.loadConfig();
	}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): DomainConfigurationService {
		if (!DomainConfigurationService.instance) {
			DomainConfigurationService.instance = new DomainConfigurationService();
		}
		return DomainConfigurationService.instance;
	}

	/**
	 * Load configuration from localStorage with fallbacks
	 * Default to api.pingdemo.com but allow user customization
	 */
	private loadConfig(): DomainConfig {
		try {
			// Try to load from localStorage first (user's custom configuration)
			const stored = localStorage.getItem(DOMAIN_CONFIG_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				const validated = DomainConfigSchema.parse(parsed);
				console.log(`${MODULE_TAG} Loaded user config from localStorage:`, validated);
				return validated;
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to load from localStorage:`, error);
		}

		// Fallback to environment variables
		const envConfig = this.getEnvironmentConfig();
		if (envConfig) {
			console.log(`${MODULE_TAG} Using environment config:`, envConfig);
			return envConfig;
		}

		// Default to api.pingdemo.com (but allow user to change later)
		const defaultConfig: DomainConfig = {
			customDomain: 'https://api.pingdemo.com',
			useCustomDomain: true,
			enforceHttps: true,
		};

		console.log(`${MODULE_TAG} Using default api.pingdemo.com config:`, defaultConfig);
		return defaultConfig;
	}

	/**
	 * Get configuration from environment variables
	 */
	private getEnvironmentConfig(): DomainConfig | null {
		try {
			// Check for Vite environment variables
			const appDomain = import.meta.env.VITE_APP_DOMAIN;
			const redirectUri = import.meta.env.VITE_PINGONE_REDIRECT_URI;

			if (appDomain || redirectUri) {
				// Extract domain from redirect URI if app domain not provided
				const domain = appDomain || (redirectUri ? new URL(redirectUri).origin : undefined);

				if (domain) {
					return {
						customDomain: domain,
						useCustomDomain: true,
						enforceHttps: true,
					};
				}
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to load environment config:`, error);
		}

		return null;
	}

	/**
	 * Save configuration to localStorage
	 */
	public saveConfig(config: Partial<DomainConfig>): DomainConfig {
		const newConfig = { ...this.config, ...config };

		try {
			// Validate the new configuration
			const validated = DomainConfigSchema.parse(newConfig);

			// Save to localStorage
			localStorage.setItem(DOMAIN_CONFIG_KEY, JSON.stringify(validated));

			// Update internal state
			this.config = validated;

			console.log(`${MODULE_TAG} Saved config:`, validated);
			return validated;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save config:`, error);
			throw new Error(
				`Invalid domain configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): DomainConfig {
		return { ...this.config };
	}

	/**
	 * Get the effective domain for the application
	 */
	public getEffectiveDomain(): string {
		// If custom domain is enabled and valid, use it
		if (this.config.useCustomDomain && this.config.customDomain) {
			console.log(`${MODULE_TAG} Using custom domain:`, this.config.customDomain);
			return this.config.customDomain;
		}

		// Fallback to current origin
		const origin =
			typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
		console.log(`${MODULE_TAG} Using fallback origin:`, origin);
		return origin;
	}

	/**
	 * Get redirect URI for a specific path
	 */
	public getRedirectUri(path: string = '/callback'): string {
		const domain = this.getEffectiveDomain();
		const redirectUri = `${domain}${path}`;

		console.log(`${MODULE_TAG} Generated redirect URI:`, redirectUri);
		return redirectUri;
	}

	/**
	 * Validate a domain
	 */
	public async validateDomain(domain: string): Promise<{ isValid: boolean; error?: string }> {
		try {
			// Basic URL validation
			const url = new URL(domain);

			// Enforce HTTPS for non-localhost domains
			if (
				this.config.enforceHttps &&
				!url.hostname.includes('localhost') &&
				url.protocol !== 'https:'
			) {
				return {
					isValid: false,
					error: 'HTTPS is required for non-localhost domains',
				};
			}

			// Skip reachability test for now to avoid CORS/network issues
			// Domain format validation is sufficient for our use case
			console.log(`${MODULE_TAG} Domain format validated:`, domain);

			return { isValid: true };
		} catch (error) {
			return {
				isValid: false,
				error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Set custom domain with validation
	 */
	public async setCustomDomain(domain: string): Promise<{ success: boolean; error?: string }> {
		// Validate the domain first
		const validation = await this.validateDomain(domain);
		if (!validation.isValid) {
			return { success: false, error: validation.error || 'Validation failed' };
		}

		try {
			this.saveConfig({
				customDomain: domain,
				useCustomDomain: true,
				lastValidated: new Date().toISOString(),
			});

			console.log(`${MODULE_TAG} Custom domain set successfully:`, domain);
			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to set custom domain';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Reset to default configuration
	 */
	public resetToDefault(): void {
		this.saveConfig({
			customDomain: undefined,
			useCustomDomain: false,
			enforceHttps: true,
		});

		console.log(`${MODULE_TAG} Reset to default configuration`);
	}

	/**
	 * Check if custom domain is active
	 */
	public isCustomDomainActive(): boolean {
		return this.config.useCustomDomain && !!this.config.customDomain;
	}

	/**
	 * Handle domain change by clearing relevant tokens
	 */
	public async handleDomainChange(): Promise<void> {
		const currentDomain = this.getEffectiveDomain();
		const previousDomain = this.getPreviousDomain();

		if (previousDomain && previousDomain !== currentDomain) {
			console.log(
				`${MODULE_TAG} Domain changed from ${previousDomain} to ${currentDomain}, clearing relevant tokens`
			);

			// Clear tokens that are domain-specific
			try {
				const { UnifiedTokenStorageService } = await import('./unifiedTokenStorageService');
				const tokenService = UnifiedTokenStorageService.getInstance();

				// Clear V8 storage tokens which might be domain-specific
				const keysToClear = [
					'v8:delete-all-devices',
					'v8:worker-token-status',
					'v8:user-search',
					'v8:device-management',
					'v8:admin-flow',
				];

				for (const key of keysToClear) {
					try {
						await tokenService.clearV8Key(key);
						console.log(`${MODULE_TAG} Cleared domain-specific token: ${key}`);
					} catch (error) {
						console.warn(`${MODULE_TAG} Failed to clear token ${key}:`, error);
					}
				}

				// Update the previous domain
				this.updatePreviousDomain(currentDomain);
			} catch (error) {
				console.error(`${MODULE_TAG} Failed to handle domain change:`, error);
			}
		}
	}

	/**
	 * Get previous domain from storage
	 */
	private getPreviousDomain(): string | null {
		try {
			return localStorage.getItem('oauth-playground-previous-domain');
		} catch {
			return null;
		}
	}

	/**
	 * Update previous domain in storage
	 */
	private updatePreviousDomain(domain: string): void {
		try {
			localStorage.setItem('oauth-playground-previous-domain', domain);
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to update previous domain:`, error);
		}
	}

	/**
	 * Get domain configuration summary for debugging
	 */
	public getConfigSummary(): {
		effectiveDomain: string;
		isCustomDomain: boolean;
		customDomain?: string;
		enforceHttps: boolean;
		lastValidated?: string;
	} {
		const summary: {
			effectiveDomain: string;
			isCustomDomain: boolean;
			customDomain?: string;
			enforceHttps: boolean;
			lastValidated?: string;
		} = {
			effectiveDomain: this.getEffectiveDomain(),
			isCustomDomain: this.isCustomDomainActive(),
			enforceHttps: this.config.enforceHttps,
		};

		// Only include optional fields if they exist
		if (this.config.customDomain) {
			summary.customDomain = this.config.customDomain;
		}
		if (this.config.lastValidated) {
			summary.lastValidated = this.config.lastValidated;
		}

		return summary;
	}
}

// Export singleton instance for backward compatibility
export const domainConfigurationService = DomainConfigurationService.getInstance();

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as unknown as Record<string, unknown>).domainConfigurationService =
		domainConfigurationService;
}

export default domainConfigurationService;
