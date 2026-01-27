/**
 * @file workerTokenServiceV8.ts
 * @module v8/services
 * @description V8 Worker Token Service - Wrapper for unified service
 * @version 8.0.0
 * @since 2025-01-20
 *
 * This is a compatibility wrapper that delegates to the unified worker token service.
 * All new code should use the unified service directly.
 */

import type {
	UnifiedWorkerTokenCredentials,
	UnifiedWorkerTokenData,
} from '../../services/unifiedWorkerTokenService';
import { unifiedWorkerTokenService } from '../../services/unifiedWorkerTokenService';

// Re-export types for backward compatibility
export type { WorkerTokenStatus } from '../../services/unifiedWorkerTokenTypes';

// Legacy compatibility - map old interfaces to new ones
export interface WorkerTokenData {
	token: string;
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string[];
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	expiresAt?: number;
	savedAt: number;
}

export interface WorkerTokenCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string[];
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
	tokenEndpointAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

/**
 * V8 Worker Token Service - Compatibility Wrapper
 *
 * This class provides backward compatibility for existing V8 code while
 * delegating all operations to the unified worker token service.
 */
class WorkerTokenServiceV8 {
	/**
	 * Save worker token credentials
	 */
	async saveCredentials(credentials: WorkerTokenCredentials): Promise<void> {
		// Convert to unified format if needed
		const unifiedCredentials: UnifiedWorkerTokenCredentials = {
			...credentials,
			appId: 'v8',
			appName: 'OAuth Playground V8',
			appVersion: '8.0.0',
		};

		await unifiedWorkerTokenService.saveCredentials(unifiedCredentials);
	}

	/**
	 * Load worker token credentials
	 */
	async loadCredentials(): Promise<WorkerTokenCredentials | null> {
		const unifiedCredentials = await unifiedWorkerTokenService.loadCredentials();

		if (!unifiedCredentials) {
			return null;
		}

		// Convert back to V8 format (remove app-specific fields)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { appId, appName, appVersion, ...v8Credentials } = unifiedCredentials;
		return v8Credentials as WorkerTokenCredentials;
	}

	/**
	 * Save worker token (access token)
	 */
	async saveToken(token: string, expiresAt?: number): Promise<void> {
		await unifiedWorkerTokenService.saveToken(token, expiresAt);
	}

	/**
	 * Get worker token (access token)
	 */
	async getToken(): Promise<string | null> {
		return await unifiedWorkerTokenService.getToken();
	}

	/**
	 * Check if credentials exist
	 */
	async hasCredentials(): Promise<boolean> {
		return (await this.loadCredentials()) !== null;
	}

	/**
	 * Check if valid token exists
	 */
	async hasValidToken(): Promise<boolean> {
		const token = await this.getToken();
		return token !== null;
	}

	/**
	 * Clear credentials
	 */
	async clearCredentials(): Promise<void> {
		await unifiedWorkerTokenService.clearCredentials();
	}

	/**
	 * Clear token only
	 */
	async clearToken(): Promise<void> {
		await unifiedWorkerTokenService.clearToken();
	}

	/**
	 * Get status
	 */
	async getStatus() {
		return await unifiedWorkerTokenService.getStatus();
	}

	/**
	 * Synchronous version for backwards compatibility (localStorage only)
	 */
	loadCredentialsSync(): WorkerTokenCredentials | null {
		try {
			const stored = localStorage.getItem('unified_worker_token');
			if (stored) {
				const data: UnifiedWorkerTokenData = JSON.parse(stored);
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { appId, appName, appVersion, ...v8Credentials } = data.credentials;
				return v8Credentials as WorkerTokenCredentials;
			}
		} catch (error) {
			console.error('[WorkerTokenServiceV8] Failed to load credentials sync', error);
		}
		return null;
	}
}

// Export singleton instance for backward compatibility
export const workerTokenServiceV8 = new WorkerTokenServiceV8();

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as unknown as { workerTokenServiceV8: WorkerTokenServiceV8 }).workerTokenServiceV8 =
		workerTokenServiceV8;
}

export default workerTokenServiceV8;
