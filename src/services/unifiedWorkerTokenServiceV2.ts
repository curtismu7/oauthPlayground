/**
 * @file unifiedWorkerTokenServiceV2.ts
 * @description Optimized unified worker token service with performance improvements
 * @version 2.0.0
 *
 * Performance improvements:
 * - Repository pattern for clean data access
 * - Batch operations and write debouncing
 * - Circuit breaker and retry logic
 * - Memory cache with TTL
 * - Performance metrics
 */

import type {
	UnifiedWorkerTokenCredentials,
	UnifiedWorkerTokenStatus,
	WorkerTokenValidationResult,
} from './unifiedWorkerTokenService';
import { workerTokenRepository } from './workerTokenRepository';

const MODULE_TAG = '[🔑 UNIFIED-WORKER-TOKEN-V2]';

/**
 * Optimized Unified Worker Token Service V2
 */
class UnifiedWorkerTokenServiceV2 {
	private static instance: UnifiedWorkerTokenServiceV2;

	private constructor() {}

	static getInstance(): UnifiedWorkerTokenServiceV2 {
		if (!UnifiedWorkerTokenServiceV2.instance) {
			UnifiedWorkerTokenServiceV2.instance = new UnifiedWorkerTokenServiceV2();
		}
		return UnifiedWorkerTokenServiceV2.instance;
	}

	/**
	 * Save worker token credentials
	 */
	async saveCredentials(credentials: UnifiedWorkerTokenCredentials): Promise<void> {

		// Validate credentials first
		const validation = this.validateCredentials(credentials);
		if (!validation.isValid) {
			throw new Error(`Invalid credentials: ${validation.errors.join(', ')}`);
		}

		await workerTokenRepository.saveCredentials(credentials);
	}

	/**
	 * Load worker token credentials
	 */
	async loadCredentials(): Promise<UnifiedWorkerTokenCredentials | null> {

		// Try repository first
		let credentials = await workerTokenRepository.loadCredentials();

		if (credentials) {
			return credentials;
		}

		// Try legacy migration
		credentials = await workerTokenRepository.migrateLegacyCredentials();

		if (credentials) {
			return credentials;
		}

		return null;
	}

	/**
	 * Save worker token (access token)
	 */
	async saveToken(
		token: string,
		expiresAt?: number,
		tokenMetadata?: {
			tokenType?: string;
			expiresIn?: number;
			scope?: string;
		}
	): Promise<void> {

		const metadata = {
			expiresAt: expiresAt || Date.now() + 3600 * 1000, // Default 1 hour
			...tokenMetadata,
		};

		await workerTokenRepository.saveToken(token, metadata);

		// Broadcast token update event
		this.broadcastTokenUpdate({
			token,
			expiresAt: metadata.expiresAt,
			expiresIn: metadata.expiresIn,
			scope: metadata.scope,
		});

	}

	/**
	 * Get worker token (access token) if valid
	 */
	async getToken(): Promise<string | null> {

		const token = await workerTokenRepository.getToken();

		if (token) {
		} else {
		}

		return token;
	}

	/**
	 * Get worker token status
	 */
	async getStatus(): Promise<UnifiedWorkerTokenStatus> {

		const status = await workerTokenRepository.getStatus();


		return status;
	}

	/**
	 * Validate worker token credentials
	 */
	validateCredentials(credentials: UnifiedWorkerTokenCredentials): WorkerTokenValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];
		const suggestions: string[] = [];

		// Required field validation
		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		} else if (!this.isValidEnvironmentId(credentials.environmentId)) {
			errors.push('Environment ID must be a valid UUID format');
			suggestions.push(
				'Environment ID should be a UUID like: 12345678-1234-1234-1234-123456789012'
			);
		}

		if (!credentials.clientId?.trim()) {
			errors.push('Client ID is required');
		}

		if (!credentials.clientSecret?.trim()) {
			errors.push('Client Secret is required');
		}

		// Business logic validation
		if (
			credentials.environmentId &&
			credentials.clientId &&
			credentials.environmentId === credentials.clientId
		) {
			errors.push('Client ID cannot be the same as Environment ID');
		}

		// Scope validation
		if (!credentials.scopes || credentials.scopes.length === 0) {
			warnings.push('No scopes specified - using default MFA scopes');
			suggestions.push('Consider adding specific scopes for your use case');
		}

		// Security recommendations
		if (credentials.clientSecret && credentials.clientSecret.length < 16) {
			warnings.push('Client secret should be at least 16 characters for security');
			suggestions.push('Generate a longer client secret for better security');
		}

		// Auth method recommendations
		if (!credentials.tokenEndpointAuthMethod || credentials.tokenEndpointAuthMethod === 'none') {
			warnings.push('No authentication method specified');
			suggestions.push('Use client_secret_basic or client_secret_post for better security');
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			suggestions,
		};
	}

	/**
	 * Build token endpoint URL
	 */
	buildTokenEndpoint(credentials: UnifiedWorkerTokenCredentials): string {
		if (credentials.tokenEndpoint) {
			return credentials.tokenEndpoint;
		}

		const regionUrls = {
			us: 'https://auth.pingone.com',
			eu: 'https://auth.pingone.eu',
			ap: 'https://auth.pingone.asia',
			ca: 'https://auth.pingone.ca',
		};

		const baseUrl = regionUrls[credentials.region || 'us'];
		return `${baseUrl}/${credentials.environmentId}/as/token`;
	}

	/**
	 * Clear worker token credentials
	 */
	async clearCredentials(): Promise<void> {

		await workerTokenRepository.clearCredentials();

	}

	/**
	 * Clear only the access token (keep credentials)
	 */
	async clearToken(): Promise<void> {

		await workerTokenRepository.clearToken();

	}

	/**
	 * Get performance metrics
	 */
	getMetrics() {
		return workerTokenRepository.getMetrics();
	}

	/**
	 * Reset performance metrics
	 */
	resetMetrics(): void {
		workerTokenRepository.resetMetrics();
	}

	/**
	 * Validate environment ID format (UUID)
	 */
	private isValidEnvironmentId(envId: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(envId);
	}

	/**
	 * Broadcast token update event to other tabs/components
	 */
	private broadcastTokenUpdate(tokenData: {
		token: string;
		expiresAt?: number;
		expiresIn?: number;
		scope?: string;
	}): void {
		const _credentials = workerTokenRepository.loadCredentials();

		window.dispatchEvent(
			new CustomEvent('unified-worker-token-updated', {
				detail: {
					expiresAt: tokenData.expiresAt,
					expiresIn: tokenData.expiresIn,
					appInfo: {
						// We'll get this from credentials if needed
					},
				},
			})
		);

		// Also dispatch the legacy event for backward compatibility
		window.dispatchEvent(new Event('workerTokenUpdated'));
	}
}

// Export singleton instance
export const unifiedWorkerTokenServiceV2 = UnifiedWorkerTokenServiceV2.getInstance();

// Export types for backward compatibility
export type {
	UnifiedWorkerTokenCredentials,
	UnifiedWorkerTokenStatus,
	WorkerTokenValidationResult,
} from './unifiedWorkerTokenService';

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).unifiedWorkerTokenServiceV2 = unifiedWorkerTokenServiceV2;
}

export default unifiedWorkerTokenServiceV2;
