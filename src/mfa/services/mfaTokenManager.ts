/**
 * @file mfaTokenManager.ts
 * @module v8/services
 * @description Centralized MFA token management service
 * @version 8.1.0
 * @since 2026-01-29
 *
 * Purpose: Unified token state management for all MFA flows
 * - Delegates to tokenGateway for all token operations
 * - Provides subscription-based updates
 * - Supports auto-refresh
 * - Singleton pattern for consistent state
 *
 * IMPORTANT: This service now delegates to tokenGateway for token acquisition.
 * Do NOT add direct token fetch logic here - use tokenGateway instead.
 *
 * @example
 * // Subscribe to token updates
 * const manager = MFATokenManager.getInstance();
 * const unsubscribe = manager.subscribe((state) => {
 *   logger.info('Token state:', state);
 * });
 *
 * // Refresh token manually
 * await manager.refreshToken();
 *
 * // Cleanup
 * unsubscribe();
 */

import { logger } from '../../utils/logger';
import { tokenGateway } from './auth/tokenGateway';
import type { TokenStatusInfo } from './workerTokenStatusService';
export type TokenUpdateCallback = (state: TokenStatusInfo) => void;

export interface MFATokenManagerConfig {
	refreshInterval: number;
	autoRefresh: boolean;
}

const DEFAULT_CONFIG: MFATokenManagerConfig = {
	refreshInterval: 30000,
	autoRefresh: true,
};

/**
 * Centralized token manager for MFA flows
 *
 * Features:
 * - Singleton pattern (one instance across all flows)
 * - Subscription-based updates (reactive state management)
 * - Auto-refresh capability (configurable interval)
 * - Wraps existing WorkerTokenStatusService (no breaking changes)
 */
export class MFATokenManager {
	private static instance: MFATokenManager | null = null;
	private tokenState: TokenStatusInfo;
	private subscribers: Set<TokenUpdateCallback>;
	private refreshTimer: NodeJS.Timeout | null;
	private config: MFATokenManagerConfig;

	/**
	 * Private constructor (singleton pattern)
	 */
	private constructor(config?: Partial<MFATokenManagerConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.subscribers = new Set();
		this.refreshTimer = null;

		// Initialize with current token state via tokenGateway
		this.tokenState = tokenGateway.getWorkerTokenStatusSync();

		logger.info('[MFATokenManager] Initialized with state:', this.tokenState.status);
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(config?: Partial<MFATokenManagerConfig>): MFATokenManager {
		if (!MFATokenManager.instance) {
			MFATokenManager.instance = new MFATokenManager(config);
		}
		return MFATokenManager.instance;
	}

	/**
	 * Reset instance (testing only)
	 */
	static resetInstance(): void {
		if (MFATokenManager.instance) {
			MFATokenManager.instance.stopAutoRefresh();
			MFATokenManager.instance.subscribers.clear();
			MFATokenManager.instance = null;
		}
		logger.info('[MFATokenManager] Instance reset', 'Logger info');
	}

	/**
	 * Subscribe to token state updates
	 *
	 * @param callback - Function to call when token state changes
	 * @returns Unsubscribe function
	 */
	subscribe(callback: TokenUpdateCallback): () => void {
		this.subscribers.add(callback);
		logger.info(`[MFATokenManager] Subscriber added (total: ${this.subscribers.size})`);

		// Immediately notify with current state
		callback(this.tokenState);

		// Return unsubscribe function
		return () => {
			this.unsubscribe(callback);
		};
	}

	/**
	 * Unsubscribe from token state updates
	 *
	 * @param callback - The callback to remove
	 */
	unsubscribe(callback: TokenUpdateCallback): void {
		const removed = this.subscribers.delete(callback);
		if (removed) {
			logger.info(`[MFATokenManager] Subscriber removed (total: ${this.subscribers.size})`);
		}
	}

	/**
	 * Get current token state (synchronous)
	 *
	 * @returns Current token status info
	 */
	getTokenState(): TokenStatusInfo {
		return this.tokenState;
	}

	/**
	 * Refresh token state (async)
	 *
	 * Checks token status and notifies all subscribers if state changed.
	 * Delegates to tokenGateway for consistent token handling.
	 */
	async refreshToken(): Promise<void> {
		try {
			logger.info(
				'[MFATokenManager] Refreshing token state via tokenGateway...',
				'Logger info'
			);

			// Delegate to tokenGateway for status check
			const newState = await tokenGateway.getWorkerTokenStatus();

			// Check if state actually changed
			const stateChanged =
				this.tokenState.status !== newState.status ||
				this.tokenState.isValid !== newState.isValid ||
				this.tokenState.expiresAt !== newState.expiresAt;

			// Update internal state
			this.tokenState = newState;

			if (stateChanged) {
				logger.info('[MFATokenManager] Token state changed:', newState.status);
				this.notify();
			} else {
				logger.info('[MFATokenManager] Token state unchanged', 'Logger info');
			}
		} catch (error) {
			logger.error('[MFATokenManager] Error refreshing token:', error);

			// Update to error state
			this.tokenState = {
				status: 'missing',
				message: 'Failed to refresh token',
				isValid: false,
			};
			this.notify();
		}
	}

	/**
	 * Start auto-refresh timer
	 *
	 * Automatically refreshes token at configured interval.
	 */
	startAutoRefresh(): void {
		if (!this.config.autoRefresh) {
			logger.info('[MFATokenManager] Auto-refresh disabled in config', 'Logger info');
			return;
		}

		if (this.refreshTimer) {
			logger.info('[MFATokenManager] Auto-refresh already running', 'Logger info');
			return;
		}

		logger.info(
			`[MFATokenManager] Starting auto-refresh (interval: ${this.config.refreshInterval}ms)`
		);

		this.refreshTimer = setInterval(() => {
			this.refreshToken();
		}, this.config.refreshInterval);
	}

	/**
	 * Stop auto-refresh timer
	 */
	stopAutoRefresh(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
			this.refreshTimer = null;
			logger.info('[MFATokenManager] Auto-refresh stopped', 'Logger info');
		}
	}

	/**
	 * Notify all subscribers of state change
	 */
	private notify(): void {
		logger.info(
			`[MFATokenManager] Notifying ${this.subscribers.size} subscribers`,
			'Logger info'
		);
		this.subscribers.forEach((callback) => {
			try {
				callback(this.tokenState);
			} catch (error) {
				logger.error('[MFATokenManager] Error in subscriber callback:', error);
			}
		});
	}

	/**
	 * Update configuration
	 *
	 * @param config - Partial config to update
	 */
	updateConfig(config: Partial<MFATokenManagerConfig>): void {
		const oldInterval = this.config.refreshInterval;
		this.config = { ...this.config, ...config };

		logger.info('[MFATokenManager] Config updated:', this.config);

		// Restart auto-refresh if interval changed
		if (config.refreshInterval && config.refreshInterval !== oldInterval && this.refreshTimer) {
			this.stopAutoRefresh();
			this.startAutoRefresh();
		}
	}

	/**
	 * Get current configuration
	 */
	getConfig(): MFATokenManagerConfig {
		return { ...this.config };
	}
}
