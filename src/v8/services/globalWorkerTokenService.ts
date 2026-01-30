/**
 * @file globalWorkerTokenService.ts
 * @module v8/services
 * @description Global Worker Token Service - Manages worker tokens globally with automatic refresh
 * @version 9.2.0
 */

import { workerTokenManager } from '@/services/workerTokenManager';
import type { WorkerTokenCredentials, WorkerTokenStatus } from '@/types/credentials';

type WorkerTokenStatusListener = (status: WorkerTokenStatus) => void;

/**
 * Global Worker Token Service
 * 
 * Manages Worker Tokens as a global singleton with:
 * - Automatic token lifecycle management (fetch, refresh, expire)
 * - Observable pattern for reactive updates
 * - Retry logic with exponential backoff
 * - Memory cache for fast access
 * - Cross-component token sharing
 */
export class GlobalWorkerTokenService {
	private static instance: GlobalWorkerTokenService;
	private listeners: Set<WorkerTokenStatusListener> = new Set();
	private currentStatus: WorkerTokenStatus | null = null;

	private constructor() {
		this.initialize();
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): GlobalWorkerTokenService {
		if (!GlobalWorkerTokenService.instance) {
			GlobalWorkerTokenService.instance = new GlobalWorkerTokenService();
		}
		return GlobalWorkerTokenService.instance;
	}

	/**
	 * Initialize the service
	 */
	private async initialize(): Promise<void> {
		console.log('[GlobalWorkerTokenService] Initializing...');
		await this.refreshStatus();
	}

	/**
	 * Get a valid Worker Token (auto-fetch if needed)
	 * 
	 * @returns Valid access token string
	 * @throws Error if credentials not configured or fetch fails
	 */
	async getToken(): Promise<string> {
		console.log('[GlobalWorkerTokenService] Getting token...');
		try {
			const token = await workerTokenManager.getWorkerToken();
			await this.refreshStatus();
			return token;
		} catch (error) {
			console.error('[GlobalWorkerTokenService] Failed to get token:', error);
			await this.refreshStatus();
			throw error;
		}
	}

	/**
	 * Get current Worker Token status
	 */
	async getStatus(): Promise<WorkerTokenStatus> {
		const status = await workerTokenManager.getStatus();
		this.currentStatus = status;
		return status;
	}

	/**
	 * Get cached status (synchronous)
	 */
	getCachedStatus(): WorkerTokenStatus | null {
		return this.currentStatus;
	}

	/**
	 * Save Worker Token credentials
	 */
	async saveCredentials(credentials: WorkerTokenCredentials): Promise<void> {
		console.log('[GlobalWorkerTokenService] Saving credentials...');
		await workerTokenManager.saveCredentials(credentials);
		await this.refreshStatus();
	}

	/**
	 * Clear Worker Token credentials and cached token
	 */
	async clearCredentials(): Promise<void> {
		console.log('[GlobalWorkerTokenService] Clearing credentials...');
		await workerTokenManager.clearAll();
		await this.refreshStatus();
	}

	/**
	 * Check if Worker Token is configured and valid
	 */
	async isConfigured(): Promise<boolean> {
		const status = await this.getStatus();
		return status.hasCredentials && status.tokenValid;
	}

	/**
	 * Subscribe to Worker Token status changes
	 * @returns Unsubscribe function
	 */
	subscribe(listener: WorkerTokenStatusListener): () => void {
		this.listeners.add(listener);
		// Immediately call with current value if available
		if (this.currentStatus) {
			listener(this.currentStatus);
		}
		return () => this.listeners.delete(listener);
	}

	/**
	 * Refresh status and notify listeners
	 */
	private async refreshStatus(): Promise<void> {
		try {
			const status = await workerTokenManager.getStatus();
			this.currentStatus = status;
			this.notifyListeners(status);
		} catch (error) {
			console.error('[GlobalWorkerTokenService] Failed to refresh status:', error);
		}
	}

	/**
	 * Notify all listeners of status change
	 */
	private notifyListeners(status: WorkerTokenStatus): void {
		console.log('[GlobalWorkerTokenService] Notifying listeners:', this.listeners.size);
		this.listeners.forEach(listener => listener(status));
	}

	/**
	 * Force refresh token (useful for testing or manual refresh)
	 */
	async forceRefresh(): Promise<string> {
		console.log('[GlobalWorkerTokenService] Forcing token refresh...');
		workerTokenManager.invalidateToken();
		return await this.getToken();
	}
}

// Export singleton instance
export const globalWorkerTokenService = GlobalWorkerTokenService.getInstance();

// Expose to window for debugging
if (typeof window !== 'undefined') {
	(window as unknown as Window & { globalWorkerTokenService: GlobalWorkerTokenService }).globalWorkerTokenService = globalWorkerTokenService;
}
