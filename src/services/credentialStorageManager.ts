// src/services/credentialStorageManager.ts
// Unified credential storage manager with 3-tier storage (memory, browser, file)

import type { CredentialStorageConfig, FlowCredentials, StorageResult } from '../types/credentials';
import { FileStorageUtil } from '../utils/fileStorageUtil';
import { logger } from '../utils/logger';

/**
 * Extended data types that can be stored
 */
export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256' | 'plain';
}

export interface FlowState {
	currentStep?: number;
	authCode?: string;
	state?: string;
	nonce?: string;
	tokens?: Record<string, unknown>;
	userInfo?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface WorkerTokenData {
	accessToken: string;
	expiresAt: number;
	environmentId: string;
}

/**
 * Credential Storage Manager
 *
 * Provides a unified interface for storing and retrieving credentials with:
 * - Memory cache (fastest, session-only)
 * - Browser localStorage (survives refresh)
 * - File storage (survives restart)
 *
 * Key Features:
 * - Flow-specific isolation (no credential bleeding)
 * - Explicit loading (no fallback to other flows)
 * - Comprehensive logging for debugging
 * - Graceful degradation on storage failures
 * - Support for multiple data types (credentials, PKCE, flow state, tokens)
 */
export class CredentialStorageManager {
	private memoryCache: Map<string, unknown> = new Map();
	private config: CredentialStorageConfig;

	constructor(config?: Partial<CredentialStorageConfig>) {
		this.config = {
			enableFileStorage: true,
			enableMemoryCache: true,
			fileStoragePath: '~/.pingone-playground/credentials',
			encryptSecrets: false, // TODO: Implement encryption
			...config,
		};
	}

	/**
	 * Load credentials with explicit flow key (no fallback)
	 *
	 * Priority order:
	 * 1. Memory cache (fastest)
	 * 2. Browser localStorage
	 * 3. File storage
	 *
	 * @param flowKey - Unique identifier for the flow
	 * @returns Storage result with credentials or null
	 */
	async loadFlowCredentials(flowKey: string): Promise<StorageResult<FlowCredentials>> {
		logger.debug(
			'CredentialStorageManager',
			`🔍 [CredentialStorageManager] Loading credentials for: ${flowKey}`
		);

		try {
			// 1. Check memory cache first
			if (this.config.enableMemoryCache && this.memoryCache.has(flowKey)) {
				const cached = this.memoryCache.get(flowKey);
				logger.info('CredentialStorageManager', `✅ Found in memory cache`);

				return {
					success: true,
					data: cached,
					source: 'memory',
					timestamp: Date.now(),
				};
			}

			// 2. Check browser storage
			const browserResult = this.loadFromBrowser(flowKey);
			if (browserResult.success && browserResult.data) {
				// Cache in memory
				if (this.config.enableMemoryCache) {
					this.memoryCache.set(flowKey, browserResult.data);
				}
				logger.info('CredentialStorageManager', `✅ Found in browser storage`);

				return browserResult;
			}

			// 3. Check file storage
			if (this.config.enableFileStorage) {
				const fileResult = await this.loadFromFile(flowKey);
				if (fileResult.success && fileResult.data) {
					// Cache in memory and browser
					if (this.config.enableMemoryCache) {
						this.memoryCache.set(flowKey, fileResult.data);
					}
					this.saveToBrowser(flowKey, fileResult.data);
					logger.info('CredentialStorageManager', `✅ Found in file storage`);

					return fileResult;
				}
			}

			// 4. No credentials found
			logger.info('CredentialStorageManager', `❌ No credentials found for ${flowKey}`);

			return {
				success: false,
				data: null,
				source: 'none',
			};
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Error loading credentials:`,
				undefined,
				error as Error
			);

			return {
				success: false,
				data: null,
				source: 'none',
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Save credentials to all storage layers
	 *
	 * Writes to:
	 * 1. Memory cache
	 * 2. Browser localStorage
	 * 3. File storage (if enabled)
	 *
	 * Continues on partial failure (best-effort)
	 *
	 * @param flowKey - Unique identifier for the flow
	 * @param credentials - Credentials to save
	 * @returns Storage result indicating success/failure
	 */
	async saveFlowCredentials(
		flowKey: string,
		credentials: FlowCredentials | Record<string, unknown>
	): Promise<StorageResult<void>> {
		logger.debug(
			'CredentialStorageManager',
			`💾 [CredentialStorageManager] Saving credentials for: ${flowKey}`
		);

		const results = {
			memory: false,
			browser: false,
			file: false,
		};

		// Add timestamp
		const credentialsWithMetadata = {
			...credentials,
			savedAt: Date.now(),
		};

		// 1. Save to memory cache
		if (this.config.enableMemoryCache) {
			try {
				this.memoryCache.set(flowKey, credentialsWithMetadata);
				results.memory = true;
				logger.info('CredentialStorageManager', `✅ Saved to memory cache`);
			} catch (error) {
				logger.error(
					'CredentialStorageManager',
					`❌ Failed to save to memory:`,
					undefined,
					error as Error
				);
			}
		}

		// 2. Save to browser storage
		try {
			this.saveToBrowser(flowKey, credentialsWithMetadata);
			results.browser = true;
			logger.info('CredentialStorageManager', `✅ Saved to browser storage`);
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to save to browser:`,
				undefined,
				error as Error
			);
		}

		// 3. Save to file storage
		if (this.config.enableFileStorage) {
			try {
				await this.saveToFile(flowKey, credentialsWithMetadata);
				results.file = true;
				logger.info('CredentialStorageManager', `✅ Saved to file storage`);
			} catch (error) {
				logger.error(
					'CredentialStorageManager',
					`❌ Failed to save to file:`,
					undefined,
					error as Error
				);
			}
		}

		const success = results.browser || results.file;
		logger.info('CredentialStorageManager', `📊 Save results:`, { data: results });

		return {
			success,
			data: null,
			source: 'browser',
			timestamp: Date.now(),
		};
	}

	/**
	 * Clear credentials from all storage layers
	 *
	 * @param flowKey - Unique identifier for the flow
	 */
	async clearFlowCredentials(flowKey: string): Promise<void> {
		logger.info(
			'CredentialStorageManager',
			`🗑️ [CredentialStorageManager] Clearing credentials for: ${flowKey}`
		);

		// Clear from memory
		this.memoryCache.delete(flowKey);

		// Clear from browser
		try {
			localStorage.removeItem(`flow_credentials_${flowKey}`);
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to clear from browser:`,
				undefined,
				error as Error
			);
		}

		// Clear from file
		if (this.config.enableFileStorage) {
			try {
				await this.deleteFile(flowKey);
			} catch (error) {
				logger.error(
					'CredentialStorageManager',
					`❌ Failed to delete file:`,
					undefined,
					error as Error
				);
			}
		}

		logger.info('CredentialStorageManager', `✅ Cleared credentials for ${flowKey}`);
	}

	/**
	 * Get all flow keys that have stored credentials
	 *
	 * @returns Array of flow keys
	 */
	getAllFlowKeys(): string[] {
		const keys = new Set<string>();

		// Get from memory cache
		this.memoryCache.forEach((_, key) => keys.add(key));

		// Get from browser storage
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith('flow_credentials_')) {
					const flowKey = key.replace('flow_credentials_', '');
					keys.add(flowKey);
				}
			}
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to scan browser storage:`,
				undefined,
				error as Error
			);
		}

		return Array.from(keys);
	}

	/**
	 * Clear all credentials (nuclear option)
	 */
	async clearAll(): Promise<void> {
		logger.warn(
			'CredentialStorageManager',
			`☢️ [CredentialStorageManager] Clearing ALL credentials`
		);

		// Clear memory cache
		this.memoryCache.clear();

		// Clear browser storage
		const flowKeys = this.getAllFlowKeys();
		for (const flowKey of flowKeys) {
			try {
				localStorage.removeItem(`flow_credentials_${flowKey}`);
			} catch (error) {
				logger.error(
					'CredentialStorageManager',
					`❌ Failed to clear ${flowKey} from browser:`,
					undefined,
					error as Error
				);
			}
		}

		// Clear file storage
		if (this.config.enableFileStorage) {
			for (const flowKey of flowKeys) {
				try {
					await this.deleteFile(flowKey);
				} catch (error) {
					logger.error(
						'CredentialStorageManager',
						`❌ Failed to delete file for ${flowKey}:`,
						undefined,
						error as Error
					);
				}
			}
		}

		logger.info('CredentialStorageManager', `✅ Cleared all credentials`);
	}

	// ============================================
	// Private Helper Methods
	// ============================================

	/**
	 * Load credentials from browser localStorage
	 */
	private loadFromBrowser(flowKey: string): StorageResult<FlowCredentials> {
		try {
			const key = `flow_credentials_${flowKey}`;
			const stored = localStorage.getItem(key);

			if (!stored) {
				return {
					success: false,
					data: null,
					source: 'browser',
				};
			}

			const data = JSON.parse(stored) as FlowCredentials;
			return {
				success: true,
				data,
				source: 'browser',
				timestamp: data.savedAt,
			};
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to load from browser:`,
				undefined,
				error as Error
			);
			return {
				success: false,
				data: null,
				source: 'browser',
				error: error instanceof Error ? error.message : 'Parse error',
			};
		}
	}

	/**
	 * Save credentials to browser localStorage
	 */
	private saveToBrowser(flowKey: string, credentials: Record<string, unknown>): void {
		const key = `flow_credentials_${flowKey}`;
		const sanitized = this.sanitizeForLogging(credentials);
		logger.info('CredentialStorageManager', `💾 Saving to browser storage:`, {
			data: { key, credentials: sanitized },
		});
		localStorage.setItem(key, JSON.stringify(credentials));
	}

	/**
	 * Load credentials from file storage
	 */
	private async loadFromFile(flowKey: string): Promise<StorageResult<FlowCredentials>> {
		try {
			const result = await FileStorageUtil.load<FlowCredentials>({
				directory: 'credentials',
				filename: `${flowKey}.json`,
			});

			if (!result.success || !result.data) {
				return {
					success: false,
					data: null,
					source: 'file',
					error: result.error || 'File not found',
				};
			}

			return {
				success: true,
				data: result.data,
				source: 'file',
				timestamp: result.data.savedAt,
			};
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to load from file:`,
				undefined,
				error as Error
			);
			return {
				success: false,
				data: null,
				source: 'file',
				error: error instanceof Error ? error.message : 'File read error',
			};
		}
	}

	/**
	 * Save credentials to file storage
	 */
	private async saveToFile(flowKey: string, credentials: Record<string, unknown>): Promise<void> {
		const result = await FileStorageUtil.save(
			{
				directory: 'credentials',
				filename: `${flowKey}.json`,
			},
			credentials
		);

		if (!result.success) {
			throw new Error(result.error || 'Failed to save to file storage');
		}
	}

	/**
	 * Delete credentials file
	 */
	private async deleteFile(flowKey: string): Promise<void> {
		const result = await FileStorageUtil.delete({
			directory: 'credentials',
			filename: `${flowKey}.json`,
		});

		if (!result.success) {
			throw new Error(result.error || 'Failed to delete file');
		}
	}

	/**
	 * Sanitize credentials for logging (hide secrets)
	 */
	private sanitizeForLogging(credentials: Record<string, unknown>): Record<string, unknown> {
		if (!credentials) return credentials;

		const sanitized = { ...credentials };

		// Sanitize client secret
		if (sanitized.clientSecret) {
			const secret = sanitized.clientSecret;
			if (secret.length > 8) {
				sanitized.clientSecret = `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
			} else {
				sanitized.clientSecret = '***';
			}
		}

		return sanitized;
	}

	// ============================================
	// Extended Storage Methods for Flow Data
	// ============================================

	/**
	 * Save PKCE codes for a flow
	 * Stored in localStorage (persisted across redirects and browser restarts)
	 * Changed from sessionStorage to localStorage to survive OAuth redirects
	 */
	savePKCECodes(flowKey: string, pkceCodes: PKCECodes): void {
		const key = `flow_pkce_${flowKey}`;
		try {
			localStorage.setItem(key, JSON.stringify(pkceCodes));
			logger.info(
				'CredentialStorageManager',
				`✅ [CredentialStorageManager] Saved PKCE codes for ${flowKey}`,
				{
					data: {
						codeVerifier: `${pkceCodes.codeVerifier.substring(0, 10)}...`,
						codeChallenge: `${pkceCodes.codeChallenge.substring(0, 10)}...`,
					},
				}
			);
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to save PKCE codes:`,
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Load PKCE codes for a flow
	 */
	loadPKCECodes(flowKey: string): PKCECodes | null {
		const key = `flow_pkce_${flowKey}`;
		try {
			const stored = localStorage.getItem(key);
			if (!stored) {
				logger.warn(
					'CredentialStorageManager',
					`⚠️ [CredentialStorageManager] No PKCE codes found for ${flowKey}`
				);
				return null;
			}
			const codes = JSON.parse(stored) as PKCECodes;
			logger.info(
				'CredentialStorageManager',
				`✅ [CredentialStorageManager] Loaded PKCE codes for ${flowKey}`,
				{
					data: {
						codeVerifier: `${codes.codeVerifier.substring(0, 10)}...`,
						codeChallenge: `${codes.codeChallenge.substring(0, 10)}...`,
					},
				}
			);
			return codes;
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to load PKCE codes:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/**
	 * Clear PKCE codes for a flow
	 */
	clearPKCECodes(flowKey: string): void {
		const key = `flow_pkce_${flowKey}`;
		try {
			localStorage.removeItem(key);
			logger.info(
				'CredentialStorageManager',
				`✅ [CredentialStorageManager] Cleared PKCE codes for ${flowKey}`
			);
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to clear PKCE codes:`,
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Save flow state (current step, auth code, etc.)
	 * Stored in sessionStorage (not persisted across browser restarts)
	 */
	saveFlowState(flowKey: string, state: FlowState): void {
		const key = `flow_state_${flowKey}`;
		try {
			sessionStorage.setItem(key, JSON.stringify(state));
			logger.info(
				'CredentialStorageManager',
				`✅ [CredentialStorageManager] Saved flow state for ${flowKey}`
			);
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to save flow state:`,
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Load flow state
	 */
	loadFlowState(flowKey: string): FlowState | null {
		const key = `flow_state_${flowKey}`;
		try {
			const stored = sessionStorage.getItem(key);
			if (!stored) return null;
			return JSON.parse(stored) as FlowState;
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to load flow state:`,
				undefined,
				error as Error
			);
			return null;
		}
	}

	/**
	 * Clear flow state
	 */
	clearFlowState(flowKey: string): void {
		const key = `flow_state_${flowKey}`;
		try {
			sessionStorage.removeItem(key);
			logger.info(
				'CredentialStorageManager',
				`✅ [CredentialStorageManager] Cleared flow state for ${flowKey}`
			);
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				`❌ Failed to clear flow state:`,
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Save worker token with expiration
	 * Stored in localStorage (persists across browser restarts)
	 */
	async saveWorkerToken(data: WorkerTokenData): Promise<StorageResult<void>> {
		const flowKey = 'worker-token';
		return await this.saveFlowCredentials(flowKey, data);
	}

	/**
	 * Load worker token
	 * Returns null if token is expired
	 */
	async loadWorkerToken(): Promise<WorkerTokenData | null> {
		const flowKey = 'worker-token';
		const result = await this.loadFlowCredentials(flowKey);

		if (!result.success || !result.data) {
			return null;
		}

		const data = result.data as unknown as WorkerTokenData;

		// Check if token is expired
		if (data.expiresAt && Date.now() > data.expiresAt) {
			logger.info('CredentialStorageManager', `⏰ [CredentialStorageManager] Worker token expired`);
			await this.clearFlowCredentials(flowKey);
			return null;
		}

		return data;
	}

	/**
	 * Clear worker token
	 */
	async clearWorkerToken(): Promise<void> {
		await this.clearFlowCredentials('worker-token');
	}

	/**
	 * Save generic flow data (for any custom data)
	 * Uses localStorage for persistence
	 */
	async saveFlowData<T>(flowKey: string, dataKey: string, data: T): Promise<StorageResult<void>> {
		const key = `${flowKey}_${dataKey}`;
		return await this.saveFlowCredentials(key, data);
	}

	/**
	 * Load generic flow data
	 */
	async loadFlowData<T>(flowKey: string, dataKey: string): Promise<T | null> {
		const key = `${flowKey}_${dataKey}`;
		const result = await this.loadFlowCredentials(key);

		if (!result.success || !result.data) {
			return null;
		}

		return result.data as unknown as T;
	}

	/**
	 * Clear generic flow data
	 */
	async clearFlowData(flowKey: string, dataKey: string): Promise<void> {
		const key = `${flowKey}_${dataKey}`;
		await this.clearFlowCredentials(key);
	}

	/**
	 * Clear all data for a specific flow (credentials, PKCE, state, etc.)
	 */
	async clearAllFlowData(flowKey: string): Promise<void> {
		logger.info(
			'CredentialStorageManager',
			`🗑️ [CredentialStorageManager] Clearing all data for ${flowKey}`
		);

		// Clear credentials
		await this.clearFlowCredentials(flowKey);

		// Clear PKCE codes
		this.clearPKCECodes(flowKey);

		// Clear flow state
		this.clearFlowState(flowKey);

		logger.info('CredentialStorageManager', `✅ Cleared all data for ${flowKey}`);
	}

	// ============================================================================
	// Cross-Tab Synchronization
	// ============================================================================

	private syncListeners: Map<string, Set<(data: Record<string, unknown>) => void>> = new Map();
	private storageEventHandler: ((event: StorageEvent) => void) | null = null;

	/**
	 * Initialize cross-tab sync by listening to storage events
	 */
	initializeCrossTabSync(): void {
		if (typeof window === 'undefined') return;

		// Remove existing listener if any
		if (this.storageEventHandler) {
			window.removeEventListener('storage', this.storageEventHandler);
		}

		// Create new storage event handler
		this.storageEventHandler = (event: StorageEvent) => {
			// Only process localStorage changes
			if (!event.key || event.storageArea !== localStorage) return;

			// Filter for credential-related keys
			if (this.isCredentialKey(event.key)) {
				logger.info('CredentialStorageManager', `🔄 [CrossTabSync] Storage change detected:`, {
					data: {
						key: event.key,
						oldValue: event.oldValue ? 'exists' : 'null',
						newValue: event.newValue ? 'exists' : 'null',
					},
				});

				this.handleStorageChange(event.key, event.newValue);
			}
		};

		window.addEventListener('storage', this.storageEventHandler);
	}

	/**
	 * Check if a storage key is credential-related
	 */
	private isCredentialKey(key: string): boolean {
		return (
			key.startsWith('flow_credentials_') ||
			key.startsWith('worker_token_') ||
			key.startsWith('pkce_codes_') ||
			key.startsWith('flow_state_') ||
			key.includes('_app-config') ||
			key.includes('_token-to-analyze')
		);
	}

	/**
	 * Handle storage change from another tab
	 */
	private handleStorageChange(key: string, newValue: string | null): void {
		try {
			// Update memory cache
			if (newValue) {
				const data = JSON.parse(newValue);

				// Extract flow key from storage key
				const flowKey = this.extractFlowKey(key);
				if (flowKey) {
					this.memoryCache.set(flowKey, data);
					logger.info(
						'CredentialStorageManager',
						`✅ [CrossTabSync] Updated memory cache for ${flowKey}`
					);

					// Notify listeners
					this.notifyListeners(flowKey, data);
				}
			} else {
				// Key was deleted
				const flowKey = this.extractFlowKey(key);
				if (flowKey) {
					this.memoryCache.delete(flowKey);
					logger.info(
						'CredentialStorageManager',
						`🗑️ [CrossTabSync] Cleared memory cache for ${flowKey}`
					);

					// Notify listeners
					this.notifyListeners(flowKey, null);
				}
			}
		} catch (error) {
			logger.error(
				'CredentialStorageManager',
				'[CrossTabSync] Failed to handle storage change:',
				undefined,
				error as Error
			);
		}
	}

	/**
	 * Extract flow key from storage key
	 */
	private extractFlowKey(storageKey: string): string | null {
		if (storageKey.startsWith('flow_credentials_')) {
			return storageKey.replace('flow_credentials_', '');
		}
		if (storageKey.startsWith('pkce_codes_')) {
			return storageKey.replace('pkce_codes_', '');
		}
		if (storageKey.startsWith('flow_state_')) {
			return storageKey.replace('flow_state_', '');
		}
		if (storageKey.startsWith('worker_token_')) {
			return 'worker-token';
		}
		return null;
	}

	/**
	 * Subscribe to credential changes for a specific flow
	 */
	onCredentialChange(flowKey: string, callback: (data: Record<string, unknown>) => void): () => void {
		if (!this.syncListeners.has(flowKey)) {
			this.syncListeners.set(flowKey, new Set());
		}

		this.syncListeners.get(flowKey)!.add(callback);
		logger.info('CredentialStorageManager', `📡 [CrossTabSync] Added listener for ${flowKey}`);

		// Return unsubscribe function
		return () => {
			const listeners = this.syncListeners.get(flowKey);
			if (listeners) {
				listeners.delete(callback);
				if (listeners.size === 0) {
					this.syncListeners.delete(flowKey);
				}
			}
			logger.info('CredentialStorageManager', `📡 [CrossTabSync] Removed listener for ${flowKey}`);
		};
	}

	/**
	 * Notify all listeners for a flow key
	 */
	private notifyListeners(flowKey: string, data: Record<string, unknown>): void {
		const listeners = this.syncListeners.get(flowKey);
		if (listeners && listeners.size > 0) {
			logger.info(
				'CredentialStorageManager',
				`📢 [CrossTabSync] Notifying ${listeners.size} listeners for ${flowKey}`
			);
			listeners.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					logger.error(
						'CredentialStorageManager',
						'[CrossTabSync] Listener callback error:',
						undefined,
						error as Error
					);
				}
			});
		}
	}

	/**
	 * Broadcast a credential change to other tabs
	 */
	broadcastChange(flowKey: string, _data: Record<string, unknown>): void {
		// The storage event will automatically fire in other tabs when we write to localStorage
		// This method is here for explicit broadcasting if needed
		logger.info('CredentialStorageManager', `📡 [CrossTabSync] Broadcasting change for ${flowKey}`);
	}

	/**
	 * Cleanup cross-tab sync
	 */
	cleanupCrossTabSync(): void {
		if (this.storageEventHandler) {
			window.removeEventListener('storage', this.storageEventHandler);
			this.storageEventHandler = null;
		}
		this.syncListeners.clear();
		logger.info('CredentialStorageManager', '🧹 [CrossTabSync] Cleaned up storage event listener');
	}
}

// Export singleton instance
export const credentialStorageManager = new CredentialStorageManager();

// Initialize cross-tab sync
if (typeof window !== 'undefined') {
	credentialStorageManager.initializeCrossTabSync();
}

export default credentialStorageManager;
