/**
 * @file unifiedCredentialsService.ts
 * @description Unified credentials and settings service
 * @version 1.0.0
 * @since 2026-02-15
 *
 * This service provides unified storage for OAuth credentials, MFA credentials,
 * environment settings, UI preferences, and PKCE/flow state using localStorage
 * as the underlying storage mechanism.
 */

import { logger } from '../utils/logger';

const MODULE_TAG = '[🔐 UNIFIED-CREDENTIALS-STORAGE]';

// Storage key prefixes
const STORAGE_PREFIXES = {
	oauth_credentials: 'oauth_creds_',
	mfa_credentials: 'mfa_creds_',
	environment_settings: 'env_settings_',
	ui_preferences: 'ui_prefs_',
	pkce_state: 'pkce_',
	flow_state: 'flow_',
} as const;

export interface CredentialStorageOptions {
	environmentId?: string;
	clientId?: string;
	flowType?: string;
	flowName?: string;
	userId?: string;
}

export interface StorageItem<T = unknown> {
	id: string;
	type: keyof typeof STORAGE_PREFIXES;
	value: T;
	expiresAt: number | null;
	issuedAt: number;
	metadata?: Record<string, unknown>;
}

/**
 * Unified Credentials Service
 * 
 * Provides centralized storage for all non-token data with localStorage
 * as the underlying storage mechanism.
 */
export class UnifiedCredentialsService {
	private static instance: UnifiedCredentialsService | null = null;

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	static getInstance(): UnifiedCredentialsService {
		if (!UnifiedCredentialsService.instance) {
			UnifiedCredentialsService.instance = new UnifiedCredentialsService();
		}
		return UnifiedCredentialsService.instance;
	}

	/**
	 * Store OAuth credentials
	 */
	async storeOAuthCredentials(
		credentials: Record<string, unknown>,
		options?: CredentialStorageOptions
	): Promise<void> {
		const id = `${STORAGE_PREFIXES.oauth_credentials}${options?.environmentId || 'default'}_${options?.clientId || 'default'}`;
		const item: StorageItem = {
			id,
			type: 'oauth_credentials',
			value: credentials,
			expiresAt: null,
			issuedAt: Date.now(),
			metadata: {
				environmentId: options?.environmentId,
				clientId: options?.clientId,
				flowType: options?.flowType,
				flowName: options?.flowName,
			},
		};

		this.setItem(item);
		logger.debug(MODULE_TAG, 'Stored OAuth credentials', { id, environmentId: options?.environmentId });
	}

	/**
	 * Get OAuth credentials
	 */
	async getOAuthCredentials(options?: CredentialStorageOptions): Promise<Record<string, unknown> | null> {
		const id = `${STORAGE_PREFIXES.oauth_credentials}${options?.environmentId || 'default'}_${options?.clientId || 'default'}`;
		const item = this.getItem(id);

		if (item && !this.isExpired(item)) {
			logger.debug(MODULE_TAG, 'Retrieved OAuth credentials', { id });
			return item.value as Record<string, unknown>;
		}

		return null;
	}

	/**
	 * Store MFA credentials
	 */
	async storeMFACredentials(
		credentials: Record<string, unknown>,
		options?: CredentialStorageOptions
	): Promise<void> {
		const id = `${STORAGE_PREFIXES.mfa_credentials}${options?.environmentId || 'default'}_${options?.clientId || 'default'}`;
		const item: StorageItem = {
			id,
			type: 'mfa_credentials',
			value: credentials,
			expiresAt: null,
			issuedAt: Date.now(),
			metadata: {
				environmentId: options?.environmentId,
				clientId: options?.clientId,
				flowType: options?.flowType,
				flowName: options?.flowName,
			},
		};

		this.setItem(item);
		logger.debug(MODULE_TAG, 'Stored MFA credentials', { id, environmentId: options?.environmentId });
	}

	/**
	 * Get MFA credentials
	 */
	async getMFACredentials(options?: CredentialStorageOptions): Promise<Record<string, unknown> | null> {
		const id = `${STORAGE_PREFIXES.mfa_credentials}${options?.environmentId || 'default'}_${options?.clientId || 'default'}`;
		const item = this.getItem(id);

		if (item && !this.isExpired(item)) {
			logger.debug(MODULE_TAG, 'Retrieved MFA credentials', { id });
			return item.value as Record<string, unknown>;
		}

		return null;
	}

	/**
	 * Store environment settings
	 */
	async storeEnvironmentSettings(
		settings: Record<string, unknown>,
		environmentId?: string
	): Promise<void> {
		const id = `${STORAGE_PREFIXES.environment_settings}${environmentId || 'default'}`;
		const item: StorageItem = {
			id,
			type: 'environment_settings',
			value: settings,
			expiresAt: null,
			issuedAt: Date.now(),
			metadata: { environmentId },
		};

		this.setItem(item);
		logger.debug(MODULE_TAG, 'Stored environment settings', { id, environmentId });
	}

	/**
	 * Get environment settings
	 */
	async getEnvironmentSettings(environmentId?: string): Promise<Record<string, unknown> | null> {
		const id = `${STORAGE_PREFIXES.environment_settings}${environmentId || 'default'}`;
		const item = this.getItem(id);

		if (item && !this.isExpired(item)) {
			logger.debug(MODULE_TAG, 'Retrieved environment settings', { id });
			return item.value as Record<string, unknown>;
		}

		return null;
	}

	/**
	 * Store UI preferences
	 */
	async storeUIPreferences(
		preferences: Record<string, unknown>,
		userId?: string
	): Promise<void> {
		const id = `${STORAGE_PREFIXES.ui_preferences}${userId || 'default'}`;
		const item: StorageItem = {
			id,
			type: 'ui_preferences',
			value: preferences,
			expiresAt: null,
			issuedAt: Date.now(),
			metadata: { userId },
		};

		this.setItem(item);
		logger.debug(MODULE_TAG, 'Stored UI preferences', { id, userId });
	}

	/**
	 * Get UI preferences
	 */
	async getUIPreferences(userId?: string): Promise<Record<string, unknown> | null> {
		const id = `${STORAGE_PREFIXES.ui_preferences}${userId || 'default'}`;
		const item = this.getItem(id);

		if (item && !this.isExpired(item)) {
			logger.debug(MODULE_TAG, 'Retrieved UI preferences', { id });
			return item.value as Record<string, unknown>;
		}

		return null;
	}

	/**
	 * Store PKCE state
	 */
	async storePKCEState(
		state: Record<string, unknown>,
		flowId: string
	): Promise<void> {
		const id = `${STORAGE_PREFIXES.pkce_state}${flowId}`;
		const item: StorageItem = {
			id,
			type: 'pkce_state',
			value: state,
			expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
			issuedAt: Date.now(),
			metadata: { flowId },
		};

		this.setItem(item);
		logger.debug(MODULE_TAG, 'Stored PKCE state', { id, flowId });
	}

	/**
	 * Get PKCE state
	 */
	async getPKCEState(flowId: string): Promise<Record<string, unknown> | null> {
		const id = `${STORAGE_PREFIXES.pkce_state}${flowId}`;
		const item = this.getItem(id);

		if (item && !this.isExpired(item)) {
			logger.debug(MODULE_TAG, 'Retrieved PKCE state', { id });
			return item.value as Record<string, unknown>;
		}

		return null;
	}

	/**
	 * Store flow state
	 */
	async storeFlowState(
		state: Record<string, unknown>,
		flowId: string
	): Promise<void> {
		const id = `${STORAGE_PREFIXES.flow_state}${flowId}`;
		const item: StorageItem = {
			id,
			type: 'flow_state',
			value: state,
			expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
			issuedAt: Date.now(),
			metadata: { flowId },
		};

		this.setItem(item);
		logger.debug(MODULE_TAG, 'Stored flow state', { id, flowId });
	}

	/**
	 * Get flow state
	 */
	async getFlowState(flowId: string): Promise<Record<string, unknown> | null> {
		const id = `${STORAGE_PREFIXES.flow_state}${flowId}`;
		const item = this.getItem(id);

		if (item && !this.isExpired(item)) {
			logger.debug(MODULE_TAG, 'Retrieved flow state', { id });
			return item.value as Record<string, unknown>;
		}

		return null;
	}

	/**
	 * Clean up expired items
	 */
	async cleanupExpired(): Promise<void> {
		const keys = Object.keys(localStorage);
		let cleanedCount = 0;

		for (const key of keys) {
			const item = this.getItem(key);
			if (item && this.isExpired(item)) {
				localStorage.removeItem(key);
				cleanedCount++;
			}
		}

		if (cleanedCount > 0) {
			logger.info(MODULE_TAG, `Cleaned up ${cleanedCount} expired items`);
		}
	}

	/**
	 * Get all items of a specific type
	 */
	async getItemsByType(type: keyof typeof STORAGE_PREFIXES): Promise<StorageItem[]> {
		const items: StorageItem[] = [];
		const prefix = STORAGE_PREFIXES[type];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(prefix)) {
				const item = this.getItem(key);
				if (item && !this.isExpired(item)) {
					items.push(item);
				}
			}
		}

		return items;
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

	/**
	 * Store item in localStorage
	 */
	private setItem(item: StorageItem): void {
		try {
			localStorage.setItem(item.id, JSON.stringify(item));
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to store item', { id: item.id }, error as Error);
			throw error;
		}
	}

	/**
	 * Get item from localStorage
	 */
	private getItem(id: string): StorageItem | null {
		try {
			const stored = localStorage.getItem(id);
			if (!stored) return null;

			return JSON.parse(stored) as StorageItem;
		} catch (error) {
			logger.warn(MODULE_TAG, 'Failed to parse item', { id }, error);
			return null;
		}
	}

	/**
	 * Check if item is expired
	 */
	private isExpired(item: StorageItem): boolean {
		if (!item.expiresAt) return false;
		return Date.now() > item.expiresAt;
	}
}

// Export singleton instance
export const unifiedCredentialsService = UnifiedCredentialsService.getInstance();
