// src/services/v9/v9OidcDiscoveryService.ts
// V9 Wrapper for oidcDiscoveryService - Modern Messaging Compliant

import { type OIDCDiscoveryDocument, oidcDiscoveryService } from '../oidcDiscoveryService';
import { v9MessagingService } from './V9MessagingService';

// V9 Wrapper Service - wraps original with Modern Messaging
const V9OidcDiscoveryService = {
	// Wrapper for discover with V9 error handling and messaging
	async discover(config: { issuerUrl: string; timeout?: number; cacheTimeout?: number }) {
		try {
			// Add V9 logging for discovery attempt
			console.log(`[V9 OIDC Discovery] Starting discovery for: ${config.issuerUrl}`);
			v9MessagingService.showInfo('Discovering OIDC endpoints...');

			// Wrap the original service with error handling
			const result = await oidcDiscoveryService.discover(config);

			if (result.success) {
				if (result.cached) {
					v9MessagingService.showSuccess('OIDC endpoints loaded from cache');
				} else {
					v9MessagingService.showSuccess('OIDC endpoints discovered successfully');
				}
				console.log(`[V9 OIDC Discovery] Discovery successful for: ${result.issuerUrl}`);
			} else {
				v9MessagingService.showError(`Discovery failed: ${result.error}`);
				console.error('[V9 OIDC Discovery] Discovery failed:', result.error);
			}

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown discovery error';
			v9MessagingService.showError(`Discovery error: ${errorMessage}`);
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
			v9MessagingService.showError('Failed to extract environment ID from issuer URL');
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
			v9MessagingService.showError('Failed to convert discovery document to credentials');
			console.error('[V9 OIDC Discovery] Credentials conversion error:', error);
			return null;
		}
	},

	// Wrapper for clearCache with V9 messaging
	clearCache(): void {
		try {
			oidcDiscoveryService.clearCache();
			v9MessagingService.showInfo('Discovery cache cleared');
			console.log('[V9 OIDC Discovery] Cache cleared');
		} catch (error) {
			v9MessagingService.showError('Failed to clear discovery cache');
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
			v9MessagingService.showError('Failed to get cache statistics');
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
				v9MessagingService.showError('Invalid issuer URL provided');
				return false;
			}

			// Basic URL validation
			try {
				new URL(issuerUrl);
				return true;
			} catch {
				v9MessagingService.showError('Invalid URL format for issuer');
				return false;
			}
		} catch (error) {
			v9MessagingService.showError('Issuer URL validation failed');
			console.error('[V9 OIDC Discovery] URL validation error:', error);
			return false;
		}
	},
};

export default V9OidcDiscoveryService;
