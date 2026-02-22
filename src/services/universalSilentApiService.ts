/**
 * @file universalSilentApiService.ts
 * @module services
 * @description Universal Silent API and Show Token Service
 * @version 1.0.0
 * @since 2026-02-20
 *
 * Purpose: Consolidate Silent API and Show Token functionality across all apps
 * Provides a single source of truth for worker token configuration and silent retrieval
 */

import {
	checkWorkerTokenStatus,
	type TokenStatusInfo,
} from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { unifiedWorkerTokenService } from './unifiedWorkerTokenService';

const MODULE_TAG = '[🔕 UNIVERSAL-SILENT-API]';

export interface UniversalSilentApiConfig {
	silentApiRetrieval: boolean;
	showTokenAtEnd: boolean;
}

export interface SilentApiResult {
	success: boolean;
	token?: string;
	status?: TokenStatusInfo;
	error?: string;
	wasSilent?: boolean;
	showTokenModal?: boolean;
}

export interface UniversalSilentApiServiceConfig {
	appId: string;
	appName: string;
	appVersion: string;
	storageKey?: string;
}

/**
 * Universal Silent API and Show Token Service
 *
 * Consolidates all Silent API and Show Token functionality across V8, V8U, and V8M apps
 * Uses the unified storage service and provides consistent behavior
 */
export class UniversalSilentApiService {
	private config: UniversalSilentApiServiceConfig;
	private storageKey: string;

	constructor(config: UniversalSilentApiServiceConfig) {
		this.config = config;
		this.storageKey = config.storageKey || `universal_silent_api_${config.appId}`;
	}

	/**
	 * Get Silent API and Show Token configuration
	 */
	getConfig(): UniversalSilentApiConfig {
		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to load config, using defaults:`, error);
		}

		// Default configuration
		return {
			silentApiRetrieval: false,
			showTokenAtEnd: true,
		};
	}

	/**
	 * Save Silent API and Show Token configuration
	 */
	saveConfig(config: UniversalSilentApiConfig): void {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(config));
			this.broadcastConfigUpdate(config);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save config:`, error);
		}
	}

	/**
	 * Update configuration - allow any combination of settings
	 */
	updateConfig(updates: Partial<UniversalSilentApiConfig>): UniversalSilentApiConfig {
		const current = this.getConfig();

		// Simply merge updates - no mutual exclusivity
		const newConfig: UniversalSilentApiConfig = {
			...current,
			...updates,
		};

		this.saveConfig(newConfig);
		return newConfig;
	}

	/**
	 * Execute silent API token retrieval with fallback
	 */
	async executeSilentApi(): Promise<SilentApiResult> {
		console.log(`${MODULE_TAG} Executing silent API for ${this.config.appName}`);

		const config = this.getConfig();
		const tokenStatus = await checkWorkerTokenStatus();

		// Check if we have credentials configured
		const hasCredentials = await this.checkCredentialsConfigured();

		if (!hasCredentials) {
			console.log(`${MODULE_TAG} No credentials configured, showing setup modal`);
			return {
				success: false,
				status: tokenStatus,
				wasSilent: false,
				showTokenModal: true,
				error: 'No credentials configured - setup required',
			};
		}

		// If silent retrieval is disabled, return with instruction to show modal
		if (!config.silentApiRetrieval) {
			console.log(`${MODULE_TAG} Silent API disabled, showing modal`);
			return {
				success: false,
				status: tokenStatus,
				wasSilent: false,
				showTokenModal: true,
				error: 'Silent API disabled - user interaction required',
			};
		}

		// If we already have a valid token, return it
		if (tokenStatus.isValid && tokenStatus.token) {
			console.log(`${MODULE_TAG} Valid token already exists`);
			return {
				success: true,
				token: tokenStatus.token,
				status: tokenStatus,
				wasSilent: true,
				showTokenModal: config.showTokenAtEnd,
			};
		}

		// Attempt silent token retrieval
		try {
			console.log(`${MODULE_TAG} Attempting silent token retrieval`);

			// Get token using unified service
			const token = await unifiedWorkerTokenService.getToken();

			if (!token) {
				throw new Error('No token returned from unified service');
			}

			// Get updated status
			const updatedStatus = await checkWorkerTokenStatus();

			console.log(`${MODULE_TAG} Silent token retrieval successful`);

			// Show success toast if configured
			if (this.config.appId !== 'background') {
				toastV8.success('Worker token retrieved silently');
			}

			return {
				success: true,
				token,
				status: updatedStatus,
				wasSilent: true,
				showTokenModal: config.showTokenAtEnd,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Silent token retrieval failed:`, error);

			const errorMessage = error instanceof Error ? error.message : String(error);

			// Show error toast
			toastV8.error(`Silent token retrieval failed: ${errorMessage}`);

			return {
				success: false,
				status: tokenStatus,
				wasSilent: true,
				showTokenModal: true, // Fallback to modal
				error: errorMessage,
			};
		}
	}

	/**
	 * Get worker token with automatic silent API handling
	 * This is the main method that apps should call
	 */
	async getWorkerToken(options: { forceSilent?: boolean; forceModal?: boolean } = {}): Promise<{
		token?: string;
		showModal: boolean;
		error?: string;
	}> {
		const config = this.getConfig();

		// Handle forced options
		if (options.forceModal) {
			return { showModal: true };
		}

		if (options.forceSilent || config.silentApiRetrieval) {
			const result = await this.executeSilentApi();

			if (result.success && result.token) {
				return {
					token: result.token,
					showModal: result.showTokenModal || false,
				};
			} else {
				return {
					showModal: true,
					error: result.error,
				};
			}
		}

		// Default behavior - show modal
		return { showModal: true };
	}

	/**
	 * Check if silent API is enabled
	 */
	isSilentApiEnabled(): boolean {
		return this.getConfig().silentApiRetrieval;
	}

	/**
	 * Check if show token at end is enabled
	 */
	isShowTokenAtEndEnabled(): boolean {
		return this.getConfig().showTokenAtEnd;
	}

	/**
	 * Check if credentials are configured for worker token
	 */
	private async checkCredentialsConfigured(): Promise<boolean> {
		try {
			// Check unified worker token service for credentials
			const credentials = await unifiedWorkerTokenService.loadCredentials();

			// Check if we have the required credential fields
			const hasClientId = !!credentials?.clientId;
			const hasClientSecret = !!credentials?.clientSecret;
			const hasEnvironmentId = !!credentials?.environmentId;

			console.log(`${MODULE_TAG} Credential check:`, {
				hasClientId,
				hasClientSecret,
				hasEnvironmentId,
				hasCredentials: hasClientId && hasClientSecret && hasEnvironmentId,
			});

			return hasClientId && hasClientSecret && hasEnvironmentId;
		} catch (error) {
			console.warn(`${MODULE_TAG} Failed to check credentials:`, error);
			return false;
		}
	}

	/**
	 * Toggle silent API retrieval
	 */
	toggleSilentApi(): UniversalSilentApiConfig {
		const current = this.getConfig();
		return this.updateConfig({
			silentApiRetrieval: !current.silentApiRetrieval,
		});
	}

	/**
	 * Toggle show token at end
	 */
	toggleShowTokenAtEnd(): UniversalSilentApiConfig {
		const current = this.getConfig();
		return this.updateConfig({
			showTokenAtEnd: !current.showTokenAtEnd,
		});
	}

	/**
	 * Reset configuration to defaults
	 */
	resetConfig(): UniversalSilentApiConfig {
		const defaultConfig: UniversalSilentApiConfig = {
			silentApiRetrieval: false,
			showTokenAtEnd: true,
		};

		this.saveConfig(defaultConfig);
		return defaultConfig;
	}

	/**
	 * Broadcast configuration update to other components
	 */
	private broadcastConfigUpdate(config: UniversalSilentApiConfig): void {
		if (typeof window !== 'undefined') {
			const event = new CustomEvent('universalSilentApiConfigUpdated', {
				detail: {
					appId: this.config.appId,
					config,
					timestamp: Date.now(),
				},
			});
			window.dispatchEvent(event);
		}
	}

	/**
	 * Listen for configuration updates from other components
	 */
	onConfigUpdate(callback: (config: UniversalSilentApiConfig) => void): () => void {
		if (typeof window === 'undefined') {
			return () => {}; // No-op in SSR
		}

		const handler = (event: Event) => {
			const customEvent = event as CustomEvent<{
				appId: string;
				config: UniversalSilentApiConfig;
				timestamp: number;
			}>;

			// Only handle updates for this app or global updates
			if (customEvent.detail.appId === this.config.appId || customEvent.detail.appId === 'global') {
				callback(customEvent.detail.config);
			}
		};

		window.addEventListener('universalSilentApiConfigUpdated', handler);

		// Return cleanup function
		return () => {
			window.removeEventListener('universalSilentApiConfigUpdated', handler);
		};
	}

	/**
	 * Get service status for debugging
	 */
	getStatus(): {
		appId: string;
		config: UniversalSilentApiConfig;
		storageKey: string;
		hasStoredConfig: boolean;
	} {
		return {
			appId: this.config.appId,
			config: this.getConfig(),
			storageKey: this.storageKey,
			hasStoredConfig: !!localStorage.getItem(this.storageKey),
		};
	}
}

// Default instances for common apps
export const universalSilentApiService = new UniversalSilentApiService({
	appId: 'universal',
	appName: 'OAuth Playground Universal',
	appVersion: '1.0.0',
});

export const v8SilentApiService = new UniversalSilentApiService({
	appId: 'v8',
	appName: 'OAuth Playground V8',
	appVersion: '8.0.0',
});

export const v8uSilentApiService = new UniversalSilentApiService({
	appId: 'v8u',
	appName: 'OAuth Playground V8U',
	appVersion: '8.0.0',
});

export const v8mSilentApiService = new UniversalSilentApiService({
	appId: 'v8m',
	appName: 'OAuth Playground V8M',
	appVersion: '8.0.0',
});

// Export types and utilities
export type { UniversalSilentApiConfig, SilentApiResult };
