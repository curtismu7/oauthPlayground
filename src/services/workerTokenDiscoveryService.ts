// src/services/workerTokenDiscoveryService.ts
// Comprehensive OIDC Discovery Service for Worker Token Flows

import { ComprehensiveDiscoveryService } from './comprehensiveDiscoveryService';
import { oidcDiscoveryService } from './oidcDiscoveryService';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';

export interface WorkerTokenDiscoveryConfig {
	environmentId: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
	clientId?: string;
	clientSecret?: string;
	timeout?: number;
	enableCaching?: boolean;
}

export interface WorkerTokenDiscoveryResult {
	success: boolean;
	environmentId?: string;
	issuerUrl?: string;
	tokenEndpoint?: string;
	introspectionEndpoint?: string;
	userInfoEndpoint?: string;
	jwksUri?: string;
	scopes?: string[];
	supportedGrantTypes?: string[];
	supportedResponseTypes?: string[];
	error?: string;
	cached?: boolean;
	discoveryDocument?: any;
}

class WorkerTokenDiscoveryService {
	private comprehensiveDiscovery = new ComprehensiveDiscoveryService();
	private cache = new Map<string, { result: WorkerTokenDiscoveryResult; timestamp: number }>();
	private readonly DEFAULT_TIMEOUT = 15000; // 15 seconds
	private readonly DEFAULT_CACHE_TIMEOUT = 3600000; // 1 hour

	/**
	 * Discover OIDC configuration for Worker Token flows
	 */
	async discover(config: WorkerTokenDiscoveryConfig): Promise<WorkerTokenDiscoveryResult> {
		try {
			const {
				environmentId,
				region = 'us',
				clientId,
				clientSecret,
				timeout = this.DEFAULT_TIMEOUT,
				enableCaching = true,
			} = config;

			// Create cache key
			const cacheKey = `worker-token-${environmentId}-${region}`;

			// Check cache first if enabled
			if (enableCaching) {
				const cached = this.getCachedResult(cacheKey);
				if (cached) {
					logger.info('WorkerTokenDiscovery', 'Using cached discovery result', {
						environmentId,
						region,
						cached: true,
					});
					return cached;
				}
			}

			logger.info('WorkerTokenDiscovery', 'Starting comprehensive OIDC discovery', {
				environmentId,
				region,
				timeout,
			});

			// Construct PingOne issuer URL
			const issuerUrl = `https://auth.pingone.com/${environmentId}/as`;

			// Use comprehensive discovery service for PingOne
			const discoveryResult = await this.comprehensiveDiscovery.discover({
				issuerUrl,
				timeout,
				enableCaching,
			});

			if (!discoveryResult.success || !discoveryResult.document) {
				throw new Error(discoveryResult.error || 'Comprehensive discovery failed');
			}

			// Extract worker token specific endpoints and configuration
			const result: WorkerTokenDiscoveryResult = {
				success: true,
				environmentId,
				issuerUrl: discoveryResult.document.issuer,
				tokenEndpoint: discoveryResult.document.token_endpoint,
				introspectionEndpoint: discoveryResult.document.introspection_endpoint,
				userInfoEndpoint: discoveryResult.document.userinfo_endpoint,
				jwksUri: discoveryResult.document.jwks_uri,
				scopes: this.extractWorkerTokenScopes(discoveryResult.document),
				supportedGrantTypes: discoveryResult.document.grant_types_supported || ['client_credentials'],
				supportedResponseTypes: discoveryResult.document.response_types_supported || [],
				discoveryDocument: discoveryResult.document,
				cached: discoveryResult.cached || false,
			};

			// Cache the result if caching is enabled
			if (enableCaching) {
				this.cache.set(cacheKey, {
					result,
					timestamp: Date.now(),
				});
			}

			// Auto-update credentials if clientId and clientSecret are provided
			if (clientId && clientSecret) {
				await this.updateCredentialsFromDiscovery(result, clientId, clientSecret);
			}

			logger.success('WorkerTokenDiscovery', 'OIDC discovery completed successfully', {
				environmentId,
				issuerUrl: result.issuerUrl,
				tokenEndpoint: result.tokenEndpoint,
				scopes: result.scopes,
			});

			return result;
		} catch (error) {
			logger.error('WorkerTokenDiscovery', 'Discovery failed', {
				environmentId: config.environmentId,
				region: config.region,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Discovery failed',
				environmentId: config.environmentId,
			};
		}
	}

	/**
	 * Extract worker token specific scopes from discovery document
	 */
	private extractWorkerTokenScopes(document: any): string[] {
		const defaultWorkerScopes = [
			'p1:read:user',
			'p1:update:user',
			'p1:read:device',
			'p1:update:device',
		];

		// Get supported scopes from discovery document
		const supportedScopes = document.scopes_supported || [];
		
		// Filter for PingOne worker token scopes
		const workerScopes = supportedScopes.filter((scope: string) => 
			scope.startsWith('p1:') && 
			(scope.includes('user') || scope.includes('device') || scope.includes('application'))
		);

		// Return worker scopes if found, otherwise return defaults
		return workerScopes.length > 0 ? workerScopes : defaultWorkerScopes;
	}

	/**
	 * Update credentials from discovery result
	 */
	private async updateCredentialsFromDiscovery(
		result: WorkerTokenDiscoveryResult,
		clientId: string,
		clientSecret: string
	): Promise<void> {
		try {
			if (!result.issuerUrl) return;

			// Use credential manager to update credentials
			await credentialManager.discoverAndUpdateCredentials(
				result.issuerUrl,
				clientId,
				clientSecret
			);

			logger.info('WorkerTokenDiscovery', 'Credentials updated from discovery');
		} catch (error) {
			logger.warn('WorkerTokenDiscovery', 'Failed to update credentials from discovery', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Get cached discovery result
	 */
	private getCachedResult(cacheKey: string): WorkerTokenDiscoveryResult | null {
		const cached = this.cache.get(cacheKey);
		if (!cached) return null;

		const now = Date.now();
		const age = now - cached.timestamp;
		const maxAge = this.DEFAULT_CACHE_TIMEOUT;

		if (age > maxAge) {
			this.cache.delete(cacheKey);
			return null;
		}

		return cached.result;
	}

	/**
	 * Clear discovery cache
	 */
	clearCache(): void {
		this.cache.clear();
		logger.info('WorkerTokenDiscovery', 'Cache cleared');
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; keys: string[] } {
		return {
			size: this.cache.size,
			keys: Array.from(this.cache.keys()),
		};
	}
}

// Export singleton instance
export const workerTokenDiscoveryService = new WorkerTokenDiscoveryService();
export default workerTokenDiscoveryService;
