// src/services/oauthMetadataService.ts
/**
 * OAuth 2.0 Authorization Server Metadata Service
 *
 * This service implements the OAuth 2.0 Authorization Server Metadata specification (RFC 8414)
 * to automatically discover OAuth endpoints from an issuer URL.
 *
 * Key benefits:
 * - OAuth-specific metadata without OIDC extensions
 * - Standards-compliant OAuth 2.0 implementation
 * - Automatic endpoint discovery for OAuth flows
 * - Reduced configuration errors
 */

export interface OAuthMetadataDocument {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	jwks_uri?: string;
	response_types_supported?: string[];
	grant_types_supported?: string[];
	subject_types_supported?: string[];
	id_token_signing_alg_values_supported?: string[];
	scopes_supported?: string[];
	claims_supported?: string[];
	end_session_endpoint?: string;
	introspection_endpoint?: string;
	revocation_endpoint?: string;
	device_authorization_endpoint?: string;
	// PingOne specific extensions
	pushed_authorization_request_endpoint?: string;
	require_pushed_authorization_requests?: boolean;
}

export interface OAuthMetadataResult {
	success: boolean;
	document?: OAuthMetadataDocument;
	issuerUrl?: string;
	error?: string;
	cached?: boolean;
}

export interface OAuthMetadataConfig {
	issuerUrl: string;
	timeout?: number;
	cacheTimeout?: number;
}

class OAuthMetadataService {
	private cache = new Map<string, { document: OAuthMetadataDocument; timestamp: number }>();
	private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
	private readonly DEFAULT_CACHE_TIMEOUT = 3600000; // 1 hour

	/**
	 * Discover OAuth endpoints from an issuer URL
	 *
	 * @param config Discovery configuration
	 * @returns Promise with metadata result
	 */
	async discover(config: OAuthMetadataConfig): Promise<OAuthMetadataResult> {
		try {
			const {
				issuerUrl,
				timeout = this.DEFAULT_TIMEOUT,
				cacheTimeout = this.DEFAULT_CACHE_TIMEOUT,
			} = config;

			// Normalize issuer URL
			const normalizedIssuer = this.normalizeIssuerUrl(issuerUrl);

			// Check cache first
			const cached = this.getCachedDocument(normalizedIssuer, cacheTimeout);
			if (cached) {
				console.log('[OAuth Metadata] Using cached document for:', normalizedIssuer);
				return {
					success: true,
					document: cached,
					issuerUrl: normalizedIssuer,
					cached: true,
				};
			}

			// Extract environment ID and region from issuer URL
			const { environmentId, region } = this.extractEnvironmentInfo(normalizedIssuer);

			// Use backend proxy to avoid CORS issues and fetch OAuth metadata
			const proxyUrl = `/api/oauth-metadata?environment_id=${environmentId}&region=${region}`;
			console.log('[OAuth Metadata] Fetching OAuth metadata document via proxy:', proxyUrl);

			// Fetch OAuth metadata document via backend proxy
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch(proxyUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'User-Agent': 'MasterFlow API OAuth Metadata Service',
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`OAuth metadata request failed: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error_description || 'OAuth metadata discovery failed');
			}

			const document: OAuthMetadataDocument = result.configuration || result.document;

			// Validate OAuth metadata document
			this.validateOAuthMetadataDocument(document, normalizedIssuer);

			// Cache the document
			this.cacheDocument(normalizedIssuer, document);

			console.log(
				'[OAuth Metadata] Successfully discovered OAuth endpoints for:',
				normalizedIssuer
			);
			return {
				success: true,
				document,
				issuerUrl: normalizedIssuer,
				cached: false,
			};
		} catch (error) {
			console.error('[OAuth Metadata] Discovery failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown OAuth metadata error',
			};
		}
	}

	/**
	 * Extract environment ID from PingOne issuer URL
	 *
	 * @param issuerUrl PingOne issuer URL
	 * @returns Environment ID or null if not a PingOne URL
	 */
	extractEnvironmentId(issuerUrl: string): string | null {
		try {
			const url = new URL(issuerUrl);

			// PingOne pattern: https://auth.pingone.com/{envId}
			if (
				url.hostname === 'auth.pingone.com' ||
				url.hostname === 'auth.pingone.eu' ||
				url.hostname === 'auth.pingone.asia' ||
				url.hostname === 'auth.pingone.ca'
			) {
				const pathSegments = url.pathname.split('/').filter((segment) => segment);
				if (pathSegments.length > 0) {
					return pathSegments[0];
				}
			}

			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Convert OAuth metadata document to flow credentials
	 *
	 * @param document OAuth metadata document
	 * @param clientId Client ID
	 * @param clientSecret Client secret (optional)
	 * @param redirectUri Redirect URI
	 * @returns Flow credentials object
	 */
	documentToCredentials(
		document: OAuthMetadataDocument,
		clientId: string,
		clientSecret?: string,
		redirectUri?: string
	) {
		const environmentId = this.extractEnvironmentId(document.issuer);

		return {
			environmentId: environmentId || '',
			clientId,
			clientSecret: clientSecret || '',
			redirectUri: redirectUri || '',
			issuerUrl: document.issuer,
			authorizationEndpoint: document.authorization_endpoint,
			tokenEndpoint: document.token_endpoint,
			jwksUri: document.jwks_uri || '',
			endSessionEndpoint: document.end_session_endpoint || '',
			introspectionEndpoint: document.introspection_endpoint || '',
			revocationEndpoint: document.revocation_endpoint || '',
			deviceAuthorizationEndpoint: document.device_authorization_endpoint || '',
			pushedAuthorizationRequestEndpoint: document.pushed_authorization_request_endpoint || '',
			supportedResponseTypes: document.response_types_supported || [],
			supportedGrantTypes: document.grant_types_supported || [],
			supportedScopes: document.scopes_supported || [],
			supportedClaims: document.claims_supported || [],
			supportedSigningAlgorithms: document.id_token_signing_alg_values_supported || [],
			requirePar: document.require_pushed_authorization_requests || false,
		};
	}

	/**
	 * Extract environment ID and region from PingOne issuer URL
	 *
	 * @param issuerUrl PingOne issuer URL
	 * @returns Object with environmentId and region
	 */
	extractEnvironmentInfo(issuerUrl: string): { environmentId: string; region: string } {
		try {
			if (!issuerUrl || typeof issuerUrl !== 'string') {
				throw new Error('Issuer URL is required and must be a string');
			}

			console.log('[OAuth Metadata] Processing issuer URL:', issuerUrl);
			const url = new URL(issuerUrl);

			// Validate that this is a PingOne URL
			if (!url.hostname.includes('pingone')) {
				throw new Error(
					`Only PingOne issuer URLs are supported. Received: ${issuerUrl}. Please use a URL like https://auth.pingone.com/{environment-id}`
				);
			}

			// Extract environment ID from path (e.g., /b9817c16-9910-4415-b67e-4ac687da74d9)
			const pathParts = url.pathname.split('/').filter((part) => part.length > 0);
			const environmentId = pathParts[0];

			if (!environmentId) {
				throw new Error('Environment ID not found in issuer URL path');
			}

			// Validate environment ID format (should be a UUID)
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(environmentId)) {
				throw new Error('Invalid environment ID format. Expected UUID format.');
			}

			// Determine region from hostname
			let region = 'us'; // default
			if (url.hostname === 'auth.pingone.eu') {
				region = 'eu';
			} else if (url.hostname === 'auth.pingone.asia') {
				region = 'ap';
			} else if (url.hostname === 'auth.pingone.ca') {
				region = 'ca';
			}

			return { environmentId, region };
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error(`Invalid issuer URL format: ${issuerUrl}`);
		}
	}

	/**
	 * Check if an issuer URL is a valid PingOne URL
	 *
	 * @param issuerUrl Issuer URL to check
	 * @returns True if it's a PingOne URL
	 */
	isPingOneIssuer(issuerUrl: string): boolean {
		try {
			const url = new URL(issuerUrl);
			return url.hostname.includes('pingone');
		} catch {
			return false;
		}
	}

	/**
	 * Get suggested issuer URLs for common PingOne regions
	 */
	getSuggestedIssuers(): Array<{ label: string; value: string; region: string }> {
		return [
			{ label: 'PingOne US (North America)', value: 'https://auth.pingone.com', region: 'us' },
			{ label: 'PingOne EU (Europe)', value: 'https://auth.pingone.eu', region: 'eu' },
			{ label: 'PingOne AP (Asia Pacific)', value: 'https://auth.pingone.asia', region: 'ap' },
			{ label: 'PingOne CA (Canada)', value: 'https://auth.pingone.ca', region: 'ca' },
		];
	}

	/**
	 * Clear OAuth metadata cache
	 */
	clearCache(): void {
		this.cache.clear();
		console.log('[OAuth Metadata] Cache cleared');
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; entries: Array<{ issuer: string; age: number }> } {
		const now = Date.now();
		const entries = Array.from(this.cache.entries()).map(([issuer, data]) => ({
			issuer,
			age: now - data.timestamp,
		}));

		return {
			size: this.cache.size,
			entries,
		};
	}

	private normalizeIssuerUrl(issuerUrl: string): string {
		try {
			if (!issuerUrl || typeof issuerUrl !== 'string') {
				throw new Error('Issuer URL is required and must be a string');
			}

			// Clean up the input first
			const cleanedUrl = issuerUrl.trim();

			// If it doesn't start with http/https, assume https
			let urlToNormalize = cleanedUrl;
			if (!/^https?:\/\//.test(cleanedUrl)) {
				urlToNormalize = `https://${cleanedUrl}`;
			}

			const url = new URL(urlToNormalize);
			// Remove trailing slash and normalize
			return url.toString().replace(/\/$/, '');
		} catch (error) {
			console.error('[OAuth Metadata] Failed to normalize issuer URL:', issuerUrl, error);
			throw new Error(`Invalid issuer URL: ${issuerUrl}`);
		}
	}

	private validateOAuthMetadataDocument(
		document: OAuthMetadataDocument,
		expectedIssuer: string
	): void {
		if (!document.issuer) {
			throw new Error('OAuth metadata document missing issuer');
		}

		if (!document.authorization_endpoint) {
			throw new Error('OAuth metadata document missing authorization_endpoint');
		}

		if (!document.token_endpoint) {
			throw new Error('OAuth metadata document missing token_endpoint');
		}

		// Validate issuer matches (allowing for case-insensitive comparison)
		if (document.issuer.toLowerCase() !== expectedIssuer.toLowerCase()) {
			console.warn(
				'[OAuth Metadata] Issuer mismatch:',
				document.issuer,
				'expected:',
				expectedIssuer
			);
		}
	}

	private getCachedDocument(issuerUrl: string, cacheTimeout: number): OAuthMetadataDocument | null {
		const cached = this.cache.get(issuerUrl);
		if (!cached) return null;

		const age = Date.now() - cached.timestamp;
		if (age > cacheTimeout) {
			this.cache.delete(issuerUrl);
			return null;
		}

		return cached.document;
	}

	private cacheDocument(issuerUrl: string, document: OAuthMetadataDocument): void {
		this.cache.set(issuerUrl, {
			document,
			timestamp: Date.now(),
		});
	}
}

// Export singleton instance
export const oauthMetadataService = new OAuthMetadataService();
