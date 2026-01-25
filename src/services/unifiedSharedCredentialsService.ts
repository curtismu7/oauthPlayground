/**
 * @file unifiedSharedCredentialsService.ts
 * @description Unified Shared Credentials Service - Single source of truth for all OAuth Playground credentials
 * @version 9.0.0
 * @since 2025-01-25
 * 
 * This service provides a unified interface for all flows to access shared credentials:
 * - Environment ID (global across all flows)
 * - Worker Token credentials (shared across all flows)
 * - OAuth credentials (clientId, clientSecret, issuerUrl)
 * - Client authentication method
 * 
 * All flows should use this service to ensure credentials are entered once and reused everywhere.
 */

import { SharedCredentialsServiceV8, type SharedCredentials } from '@/v8/services/sharedCredentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { unifiedWorkerTokenService, type UnifiedWorkerTokenCredentials } from '@/services/unifiedWorkerTokenService';

const MODULE_TAG = '[🔗 UNIFIED-SHARED-CREDENTIALS]';

export interface UnifiedSharedCredentials {
	// Environment ID (global)
	environmentId?: string;
	
	// OAuth credentials (shared across flows)
	clientId?: string;
	clientSecret?: string;
	issuerUrl?: string;
	clientAuthMethod?: 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
	
	// Worker Token credentials (shared across flows)
	workerTokenCredentials?: UnifiedWorkerTokenCredentials;
	
	// Metadata
	lastUpdated?: number;
	source?: string; // Which flow last updated the credentials
}

/**
 * Unified Shared Credentials Service
 * 
 * This service acts as a facade over multiple credential services to provide
 * a single interface for all flows to access shared credentials.
 */
class UnifiedSharedCredentialsService {
	private static instance: UnifiedSharedCredentialsService;
	
	/**
	 * Get singleton instance
	 */
	static getInstance(): UnifiedSharedCredentialsService {
		if (!UnifiedSharedCredentialsService.instance) {
			UnifiedSharedCredentialsService.instance = new UnifiedSharedCredentialsService();
		}
		return UnifiedSharedCredentialsService.instance;
	}
	
	/**
	 * Load all shared credentials from their respective services
	 */
	async loadAllCredentials(): Promise<UnifiedSharedCredentials> {
		try {
			console.log(`${MODULE_TAG} Loading all shared credentials`);
			
			// Load Environment ID (global)
			const environmentId = EnvironmentIdServiceV8.getEnvironmentId();
			
			// Load OAuth shared credentials
			const sharedCredentials = await SharedCredentialsServiceV8.loadSharedCredentials();
			
			// Load Worker Token credentials
			const workerTokenCredentials = await unifiedWorkerTokenService.loadCredentials();
			
			const result: UnifiedSharedCredentials = {
				lastUpdated: Date.now(),
			};
			
			// Only add properties that have values
			if (environmentId || sharedCredentials.environmentId) {
				result.environmentId = environmentId || sharedCredentials.environmentId;
			}
			if (sharedCredentials.clientId) {
				result.clientId = sharedCredentials.clientId;
			}
			if (sharedCredentials.clientSecret) {
				result.clientSecret = sharedCredentials.clientSecret;
			}
			if (sharedCredentials.issuerUrl) {
				result.issuerUrl = sharedCredentials.issuerUrl;
			}
			if (sharedCredentials.clientAuthMethod) {
				result.clientAuthMethod = sharedCredentials.clientAuthMethod;
			}
			if (workerTokenCredentials) {
				result.workerTokenCredentials = workerTokenCredentials;
			}
			
			console.log(`${MODULE_TAG} ✅ Loaded shared credentials:`, {
				hasEnvironmentId: !!result.environmentId,
				hasClientId: !!result.clientId,
				hasClientSecret: !!result.clientSecret,
				hasWorkerToken: !!result.workerTokenCredentials,
			});
			
			return result;
			
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to load shared credentials:`, error);
			return {
				lastUpdated: Date.now(),
			};
		}
	}
	
	/**
	 * Load all shared credentials synchronously (for immediate UI updates)
	 */
	loadAllCredentialsSync(): UnifiedSharedCredentials {
		try {
			console.log(`${MODULE_TAG} Loading all shared credentials (sync)`);
			
			// Load Environment ID (global)
			const environmentId = EnvironmentIdServiceV8.getEnvironmentId();
			
			// Load OAuth shared credentials (sync)
			const sharedCredentials = SharedCredentialsServiceV8.loadSharedCredentialsSync();
			
			// Load Worker Token credentials (sync from localStorage)
			let workerTokenCredentials = null;
			try {
				const stored = localStorage.getItem('unified_worker_token');
				if (stored) {
					const data = JSON.parse(stored);
					workerTokenCredentials = data.credentials || null;
				}
			} catch (error) {
				console.warn(`${MODULE_TAG} Failed to load worker token credentials from localStorage:`, error);
			}
			
			const result: UnifiedSharedCredentials = {
				lastUpdated: Date.now(),
			};
			
			// Only add properties that have values
			if (environmentId || sharedCredentials.environmentId) {
				result.environmentId = environmentId || sharedCredentials.environmentId;
			}
			if (sharedCredentials.clientId) {
				result.clientId = sharedCredentials.clientId;
			}
			if (sharedCredentials.clientSecret) {
				result.clientSecret = sharedCredentials.clientSecret;
			}
			if (sharedCredentials.issuerUrl) {
				result.issuerUrl = sharedCredentials.issuerUrl;
			}
			if (sharedCredentials.clientAuthMethod) {
				result.clientAuthMethod = sharedCredentials.clientAuthMethod;
			}
			if (workerTokenCredentials) {
				result.workerTokenCredentials = workerTokenCredentials;
			}
			
			console.log(`${MODULE_TAG} ✅ Loaded shared credentials (sync):`, {
				hasEnvironmentId: !!result.environmentId,
				hasClientId: !!result.clientId,
				hasClientSecret: !!result.clientSecret,
				hasWorkerToken: !!result.workerTokenCredentials,
			});
			
			return result;
			
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to load shared credentials (sync):`, error);
			return {
				lastUpdated: Date.now(),
			};
		}
	}
	
	/**
	 * Save Environment ID globally
	 */
	async saveEnvironmentId(environmentId: string, source?: string): Promise<void> {
		if (!environmentId?.trim()) {
			console.warn(`${MODULE_TAG} Attempted to save empty environment ID`);
			return;
		}
		
		try {
			EnvironmentIdServiceV8.saveEnvironmentId(environmentId.trim());
			
			// Also save to shared credentials for backup
			const shared = await SharedCredentialsServiceV8.loadSharedCredentials();
			shared.environmentId = environmentId.trim();
			await SharedCredentialsServiceV8.saveSharedCredentials(shared);
			
			console.log(`${MODULE_TAG} ✅ Saved Environment ID from ${source || 'unknown'}`);
			
			// Dispatch event for other components
			window.dispatchEvent(new CustomEvent('unifiedSharedCredentialsUpdated', {
				detail: { type: 'environmentId', environmentId, source }
			}));
			
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to save Environment ID:`, error);
			throw error;
		}
	}
	
	/**
	 * Save OAuth shared credentials
	 */
	async saveOAuthCredentials(credentials: {
		clientId?: string;
		clientSecret?: string;
		issuerUrl?: string;
		clientAuthMethod?: string;
	}, source?: string): Promise<void> {
		try {
			const sharedCredentials: SharedCredentials = {};
			
			// Only add properties that have values
			if (credentials.clientId) {
				sharedCredentials.clientId = credentials.clientId;
			}
			if (credentials.clientSecret) {
				sharedCredentials.clientSecret = credentials.clientSecret;
			}
			if (credentials.issuerUrl) {
				sharedCredentials.issuerUrl = credentials.issuerUrl;
			}
			if (credentials.clientAuthMethod) {
				sharedCredentials.clientAuthMethod = credentials.clientAuthMethod as any;
			}
			
			await SharedCredentialsServiceV8.saveSharedCredentials(sharedCredentials);
			
			console.log(`${MODULE_TAG} ✅ Saved OAuth credentials from ${source || 'unknown'}`);
			
			// Dispatch event for other components
			window.dispatchEvent(new CustomEvent('unifiedSharedCredentialsUpdated', {
				detail: { type: 'oauth', credentials, source }
			}));
			
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to save OAuth credentials:`, error);
			throw error;
		}
	}
	
	/**
	 * Save Worker Token credentials
	 */
	async saveWorkerTokenCredentials(credentials: UnifiedWorkerTokenCredentials, source?: string): Promise<void> {
		try {
			await unifiedWorkerTokenService.saveCredentials(credentials);
			
			console.log(`${MODULE_TAG} ✅ Saved Worker Token credentials from ${source || 'unknown'}`);
			
			// Dispatch event for other components
			window.dispatchEvent(new CustomEvent('unifiedSharedCredentialsUpdated', {
				detail: { type: 'workerToken', credentials, source }
			}));
			
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to save Worker Token credentials:`, error);
			throw error;
		}
	}
	
	/**
	 * Check if user has any credentials configured
	 */
	async hasAnyCredentials(): Promise<boolean> {
		const creds = await this.loadAllCredentials();
		return !!(
			creds.environmentId ||
			creds.clientId ||
			creds.clientSecret ||
			creds.workerTokenCredentials
		);
	}
	
	/**
	 * Check if user has complete OAuth credentials
	 */
	hasOAuthCredentials(): boolean {
		const creds = this.loadAllCredentialsSync();
		return !!(creds.environmentId && creds.clientId);
	}
	
	/**
	 * Check if user has Worker Token credentials
	 */
	hasWorkerTokenCredentials(): boolean {
		const creds = this.loadAllCredentialsSync();
		return !!creds.workerTokenCredentials;
	}
	
	/**
	 * Get credential status summary
	 */
	getCredentialStatus(): {
		hasEnvironmentId: boolean;
		hasClientId: boolean;
		hasClientSecret: boolean;
		hasWorkerToken: boolean;
		isComplete: boolean;
	} {
		const creds = this.loadAllCredentialsSync();
		
		return {
			hasEnvironmentId: !!creds.environmentId,
			hasClientId: !!creds.clientId,
			hasClientSecret: !!creds.clientSecret,
			hasWorkerToken: !!creds.workerTokenCredentials,
			isComplete: !!(creds.environmentId && creds.clientId),
		};
	}
	
	/**
	 * Clear all shared credentials (for testing/reset)
	 */
	async clearAllCredentials(): Promise<void> {
		try {
			// Clear Environment ID
			localStorage.removeItem('v8:global_environment_id');
			
			// Clear shared credentials
			await SharedCredentialsServiceV8.clearSharedCredentials();
			
			// Clear worker token credentials
			await unifiedWorkerTokenService.clearCredentials();
			
			console.log(`${MODULE_TAG} ✅ Cleared all shared credentials`);
			
			// Dispatch event for other components
			window.dispatchEvent(new CustomEvent('unifiedSharedCredentialsUpdated', {
				detail: { type: 'clear' }
			}));
			
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Failed to clear credentials:`, error);
			throw error;
		}
	}
}

// Export singleton instance
export const unifiedSharedCredentialsService = UnifiedSharedCredentialsService.getInstance();

// Export class for testing
export { UnifiedSharedCredentialsService };
