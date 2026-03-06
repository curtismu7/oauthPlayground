// src/services/v9/v9OidcDiscoveryService.ts
// V9 Wrapper for oidcDiscoveryService - Modern Messaging Compliant

// Import Modern Messaging (V9) - proper migration to non-toast messaging
import { modernMessaging } from '../../components/v9/V9ModernMessagingComponents';
import { logger } from '../../utils/logger';
import { type OIDCDiscoveryDocument, oidcDiscoveryService } from '../oidcDiscoveryService';

// V9 Wrapper Service - wraps original with Modern Messaging
const V9OidcDiscoveryService = {
	// Wrapper for discover with V9 error handling and messaging
	async discover(config: { issuerUrl: string; timeout?: number; cacheTimeout?: number }) {
		try {
			// Add V9 logging for discovery attempt
			logger.info('V9OidcDiscovery', 'Starting discovery', { issuerUrl: config.issuerUrl });
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Discovering OIDC endpoints...',
				duration: 5000,
			});

			// Wrap the original service with error handling
			const result = await oidcDiscoveryService.discover(config);

			if (result.success) {
				if (result.data.cached) {
					modernMessaging.showFooterMessage({
						type: 'info',
						message: 'OIDC endpoints loaded from cache',
						duration: 4000,
					});
				} else {
					modernMessaging.showFooterMessage({
						type: 'info',
						message: 'OIDC endpoints discovered successfully',
						duration: 4000,
					});
				}
				logger.info('V9OidcDiscovery', 'Discovery successful', {
					issuerUrl: result.data.issuerUrl,
				});
			} else {
				modernMessaging.showCriticalError({
					title: 'Discovery Failed',
					message: `Discovery failed: ${result.error.message}`,
					contactSupport: false,
				});
			}

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown discovery error';
			modernMessaging.showCriticalError({
				title: 'Discovery Error',
				message: `Discovery error: ${errorMessage}`,
				contactSupport: false,
			});

			return { success: false, error: { code: 'OIDC_DISCOVERY_FAILED', message: errorMessage } };
		}
	},

	// Wrapper for extractEnvironmentId with V9 error handling
	extractEnvironmentId(issuerUrl: string): string | null {
		try {
			const result = oidcDiscoveryService.extractEnvironmentId(issuerUrl);
			logger.info('V9OidcDiscovery', 'Extracted environment ID', { result });
			return result;
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Environment ID Extraction Failed',
				message: 'Failed to extract environment ID from issuer URL',
				contactSupport: false,
			});
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
			logger.info('V9OidcDiscovery', 'Converted discovery document to credentials');
			return result;
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Credentials Conversion Failed',
				message: 'Failed to convert discovery document to credentials',
				contactSupport: false,
			});
			return null;
		}
	},

	// Wrapper for clearCache with V9 messaging
	clearCache(): void {
		try {
			oidcDiscoveryService.clearCache();
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Discovery cache cleared',
				duration: 3000,
			});
			logger.info('V9OidcDiscovery', 'Cache cleared');
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Cache Clear Failed',
				message: 'Failed to clear discovery cache',
				contactSupport: false,
			});
		}
	},

	// Wrapper for getCacheStats with V9 error handling
	getCacheStats() {
		try {
			const result = oidcDiscoveryService.getCacheStats();
			logger.info('V9OidcDiscovery', 'Cache stats', { size: result.size });
			return result;
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'Cache Stats Failed',
				message: 'Failed to get cache statistics',
				contactSupport: false,
			});
			return { size: 0, entries: [] };
		}
	},

	// Add V9-specific logging for discovery operations
	logDiscoveryOperation(operation: string, details?: unknown) {
		logger.info('V9OidcDiscovery', operation, details as Record<string, unknown> | undefined);
	},

	// Add V9 validation helper
	validateIssuerUrl(issuerUrl: string): boolean {
		try {
			if (!issuerUrl || typeof issuerUrl !== 'string') {
				modernMessaging.showCriticalError({
					title: 'Invalid Issuer URL',
					message: 'Invalid issuer URL provided',
					contactSupport: false,
				});
				return false;
			}

			// Basic URL validation
			try {
				new URL(issuerUrl);
				return true;
			} catch {
				modernMessaging.showCriticalError({
					title: 'Invalid URL Format',
					message: 'Invalid URL format for issuer',
					contactSupport: false,
				});
				return false;
			}
		} catch (_error) {
			modernMessaging.showCriticalError({
				title: 'URL Validation Failed',
				message: 'Issuer URL validation failed',
				contactSupport: false,
			});
			return false;
		}
	},
};

export default V9OidcDiscoveryService;
