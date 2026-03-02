// src/services/v9/v9OidcDiscoveryService.ts
// V9 Wrapper for oidcDiscoveryService - Modern Messaging Compliant

import { type OIDCDiscoveryDocument, oidcDiscoveryService } from '../oidcDiscoveryService';
// Import Modern Messaging (V8) - established migration pattern
import { ToastNotificationsV8 as toastV8 } from '../../v8/utils/toastNotificationsV8';

// V9 Wrapper Service - wraps original with Modern Messaging
const V9OidcDiscoveryService = {
	// Wrapper for discover with V9 error handling and messaging
	async discover(config: { issuerUrl: string; timeout?: number; cacheTimeout?: number }) {
		try {
			// Add V9 logging for discovery attempt
			console.log(`[V9 OIDC Discovery] Starting discovery for: ${config.issuerUrl}`);
			toastV8.info('Discovering OIDC endpoints...');

			// Wrap the original service with error handling
			const result = await oidcDiscoveryService.discover(config);

			if (result.success) {
				if (result.cached) {
					toastV8.success('OIDC endpoints loaded from cache');
				} else {
					toastV8.success('OIDC endpoints discovered successfully');
				}
				console.log(`[V9 OIDC Discovery] Discovery successful for: ${result.issuerUrl}`);
			} else {
				toastV8.error(`Discovery failed: ${result.error}`);
				console.error('[V9 OIDC Discovery] Discovery failed:', result.error);
			}

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown discovery error';
			toastV8.error(`Discovery error: ${errorMessage}`);
			console.error('[V9 OIDC Discovery] Discovery error:', error);

			return {
				success: false,
				error: errorMessage,
			};
		}
	},

	// Wrapper for extractEnvironmentId with V9 error handling
	extractEnvironmentId(issuerUrl: string): string | null {
		try {
			const result = oidcDiscoveryService.extractEnvironmentId(issuerUrl);
			console.log(`[V9 OIDC Discovery] Extracted environment ID: ${result}`);
			return result;
		} catch (error) {
			toastV8.error('Failed to extract environment ID from issuer URL');
			console.error('[V9 OIDC Discovery] Environment ID extraction error:', error);
			return null;
		}
	},

	// Wrapper for documentToCredentials with V9 error handling
	documentToCredentials(
		document: OIDCDiscoveryDocument,
		clientId: string,
		clientSecret?: string,
		redirectUri?: string
	) {
		try {
			const result = oidcDiscoveryService.documentToCredentials(
				document,
				clientId,
				clientSecret,
				redirectUri
			);
			console.log(`[V9 OIDC Discovery] Converted discovery document to credentials`);
			return result;
		} catch (error) {
			toastV8.error('Failed to convert discovery document to credentials');
			console.error('[V9 OIDC Discovery] Credentials conversion error:', error);
			return null;
		}
	},

	// Wrapper for clearCache with V9 messaging
	clearCache(): void {
		try {
			oidcDiscoveryService.clearCache();
			toastV8.info('Discovery cache cleared');
			console.log('[V9 OIDC Discovery] Cache cleared');
		} catch (error) {
			toastV8.error('Failed to clear discovery cache');
			console.error('[V9 OIDC Discovery] Cache clear error:', error);
		}
	},

	// Wrapper for getCacheStats with V9 error handling
	getCacheStats() {
		try {
			const result = oidcDiscoveryService.getCacheStats();
			console.log(`[V9 OIDC Discovery] Cache stats: ${result.size} entries`);
			return result;
		} catch (error) {
			toastV8.error('Failed to get cache statistics');
			console.error('[V9 OIDC Discovery] Cache stats error:', error);
			return { size: 0, entries: [] };
		}
	},

	// Add V9-specific logging for discovery operations
	logDiscoveryOperation(operation: string, details?: unknown) {
		console.log(`[V9 OIDC Discovery] ${operation}`, details);
	},

	// Add V9 validation helper
	validateIssuerUrl(issuerUrl: string): boolean {
		try {
			if (!issuerUrl || typeof issuerUrl !== 'string') {
				toastV8.error('Invalid issuer URL provided');
				return false;
			}

			// Basic URL validation
			try {
				new URL(issuerUrl);
				return true;
			} catch {
				toastV8.error('Invalid URL format for issuer');
				return false;
			}
		} catch (error) {
			toastV8.error('Issuer URL validation failed');
			console.error('[V9 OIDC Discovery] URL validation error:', error);
			return false;
		}
	},
};

export default V9OidcDiscoveryService;
