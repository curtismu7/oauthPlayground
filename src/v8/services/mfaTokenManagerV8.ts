/**
 * @file mfaTokenManagerV8.ts
 * @module v8/services
 * @description Centralized MFA token management service
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Unified token state management for all MFA flows
 * - Wraps existing WorkerTokenStatusServiceV8
 * - Provides subscription-based updates
 * - Supports auto-refresh
 * - Singleton pattern for consistent state
 *
 * @example
 * // Subscribe to token updates
 * const manager = MFATokenManagerV8.getInstance();
 * const unsubscribe = manager.subscribe((state) => {
 *   console.log('Token state:', state);
 * });
 *
 * // Refresh token manually
 * await manager.refreshToken();
 *
 * // Cleanup
 * unsubscribe();
 */

import type { TokenStatusInfo } from './workerTokenStatusServiceV8';
import { WorkerTokenStatusServiceV8 } from './workerTokenStatusServiceV8';

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
 * - Wraps existing WorkerTokenStatusServiceV8 (no breaking changes)
 */
export class MFATokenManagerV8 {
	private static instance: MFATokenManagerV8 | null = null;
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

		// Initialize with current token state
		this.tokenState = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();

		console.log('[MFATokenManagerV8] Initialized with state:', this.tokenState.status);
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(config?: Partial<MFATokenManagerConfig>): MFATokenManagerV8 {
		if (!MFATokenManagerV8.instance) {
			MFATokenManagerV8.instance = new MFATokenManagerV8(config);
		}
		return MFATokenManagerV8.instance;
	}

	/**
	 * Reset instance (testing only)
	 */
	static resetInstance(): void {
		if (MFATokenManagerV8.instance) {
			MFATokenManagerV8.instance.stopAutoRefresh();
			MFATokenManagerV8.instance.subscribers.clear();
			MFATokenManagerV8.instance = null;
		}
		console.log('[MFATokenManagerV8] Instance reset');
	}

	/**
	 * Subscribe to token state updates
	 *
	 * @param callback - Function to call when token state changes
	 * @returns Unsubscribe function
	 */
	subscribe(callback: TokenUpdateCallback): () => void {
		this.subscribers.add(callback);
		console.log(`[MFATokenManagerV8] Subscriber added (total: ${this.subscribers.size})`);

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
			console.log(`[MFATokenManagerV8] Subscriber removed (total: ${this.subscribers.size})`);
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
	 */
	async refreshToken(): Promise<void> {
		try {
			console.log('[MFATokenManagerV8] Refreshing token state...');

			// Delegate to existing service
			const newState = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();

			// Check if state actually changed
			const stateChanged =
				this.tokenState.status !== newState.status ||
				this.tokenState.isValid !== newState.isValid ||
				this.tokenState.expiresAt !== newState.expiresAt;

			// Update internal state
			this.tokenState = newState;

			if (stateChanged) {
				console.log('[MFATokenManagerV8] Token state changed:', newState.status);
				this.notify();
			} else {
				console.log('[MFATokenManagerV8] Token state unchanged');
			}
		} catch (error) {
			console.error('[MFATokenManagerV8] Error refreshing token:', error);

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
			console.log('[MFATokenManagerV8] Auto-refresh disabled in config');
			return;
		}

		if (this.refreshTimer) {
			console.log('[MFATokenManagerV8] Auto-refresh already running');
			return;
		}

		console.log(
			`[MFATokenManagerV8] Starting auto-refresh (interval: ${this.config.refreshInterval}ms)`
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
			console.log('[MFATokenManagerV8] Auto-refresh stopped');
		}
	}

	/**
	 * Notify all subscribers of state change
	 */
	private notify(): void {
		console.log(`[MFATokenManagerV8] Notifying ${this.subscribers.size} subscribers`);
		this.subscribers.forEach((callback) => {
			try {
				callback(this.tokenState);
			} catch (error) {
				console.error('[MFATokenManagerV8] Error in subscriber callback:', error);
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

		console.log('[MFATokenManagerV8] Config updated:', this.config);

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
