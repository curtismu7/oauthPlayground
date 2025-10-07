// src/services/comprehensiveDiscoveryService.ts
/**
 * Comprehensive OIDC Discovery Service
 *
 * This service supports multiple OIDC providers:
 * - PingOne (Environment ID, issuer URL)
 * - Google OAuth
 * - Auth0
 * - Microsoft Entra ID
 * - Generic OIDC providers
 *
 * Features:
 * - Environment ID resolution for PingOne
 * - Multiple provider support
 * - Caching and error handling
 * - RFC 8414 compliant
 */

export interface OIDCDiscoveryDocument {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint?: string;
	jwks_uri: string;
	response_types_supported: string[];
	grant_types_supported: string[];
	subject_types_supported: string[];
	id_token_signing_alg_values_supported: string[];
	scopes_supported?: string[];
	claims_supported?: string[];
	end_session_endpoint?: string;
	introspection_endpoint?: string;
	revocation_endpoint?: string;
	device_authorization_endpoint?: string;
	// Provider-specific extensions
	pushed_authorization_request_endpoint?: string;
	require_pushed_authorization_requests?: boolean;
}

export interface DiscoveryResult {
	success: boolean;
	document?: OIDCDiscoveryDocument;
	issuerUrl?: string;
	provider?: string;
	error?: string;
	cached?: boolean;
}

export interface DiscoveryConfig {
	input: string; // Environment ID, issuer URL, or provider name
	timeout?: number;
	cacheTimeout?: number;
}

export type ProviderType = 'pingone' | 'google' | 'auth0' | 'microsoft' | 'generic';

export class ComprehensiveDiscoveryService {
	private cache = new Map<string, { document: OIDCDiscoveryDocument; timestamp: number }>();
	private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
	private readonly DEFAULT_CACHE_TIMEOUT = 3600000; // 1 hour

	// Provider configurations
	private readonly PROVIDERS = {
		pingone: {
			name: 'PingOne',
			baseUrl: 'https://auth.pingone.com',
			regions: ['us', 'eu', 'ap', 'ca'],
			discoveryPath: '/.well-known/openid_configuration'
		},
		google: {
			name: 'Google OAuth',
			baseUrl: 'https://accounts.google.com',
			discoveryPath: '/.well-known/openid_configuration'
		},
		auth0: {
			name: 'Auth0',
			baseUrl: 'https://{domain}.auth0.com',
			discoveryPath: '/.well-known/openid_configuration'
		},
		microsoft: {
			name: 'Microsoft Entra ID',
			baseUrl: 'https://login.microsoftonline.com',
			discoveryPath: '/{tenant}/v2.0/.well-known/openid_configuration'
		}
	};

	/**
	 * Discover OIDC endpoints from various input types
	 */
	async discover(config: DiscoveryConfig): Promise<DiscoveryResult> {
		try {
			const {
				input,
				timeout = this.DEFAULT_TIMEOUT,
				cacheTimeout = this.DEFAULT_CACHE_TIMEOUT,
			} = config;

			// Determine provider and issuer URL
			const { provider, issuerUrl } = await this.resolveInput(input);

			// Check cache first
			const cached = this.getCachedDocument(issuerUrl, cacheTimeout);
			if (cached) {
				console.log('[Comprehensive Discovery] Using cached document for:', issuerUrl);
				return {
					success: true,
					document: cached,
					issuerUrl,
					provider,
					cached: true,
				};
			}

			// Fetch discovery document
			const document = await this.fetchDiscoveryDocument(issuerUrl, timeout);

			// Validate discovery document
			this.validateDiscoveryDocument(document, issuerUrl);

			// Cache the document
			this.cacheDocument(issuerUrl, document);

			console.log('[Comprehensive Discovery] Successfully discovered endpoints for:', issuerUrl);
			return {
				success: true,
				document,
				issuerUrl,
				provider,
				cached: false,
			};
		} catch (error) {
			console.error('[Comprehensive Discovery] Discovery failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown discovery error',
			};
		}
	}

	/**
	 * Resolve input to provider and issuer URL
	 */
	private async resolveInput(input: string): Promise<{ provider: ProviderType; issuerUrl: string }> {
		// Check if it's a PingOne Environment ID
		if (this.isPingOneEnvironmentId(input)) {
			return {
				provider: 'pingone',
				issuerUrl: await this.resolvePingOneEnvironmentId(input)
			};
		}

		// Check if it's a full issuer URL
		if (this.isValidIssuerUrl(input)) {
			const provider = this.detectProvider(input);
			return { provider, issuerUrl: input };
		}

		// Check if it's a provider name
		if (this.isProviderName(input)) {
			const issuerUrl = await this.resolveProviderName(input);
			return { provider: input as ProviderType, issuerUrl };
		}

		throw new Error(`Invalid input: ${input}. Expected Environment ID, issuer URL, or provider name.`);
	}

	/**
	 * Check if input is a PingOne Environment ID
	 */
	private isPingOneEnvironmentId(input: string): boolean {
		// PingOne Environment IDs are typically UUIDs or alphanumeric strings
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const alphanumericRegex = /^[a-zA-Z0-9]{8,32}$/;
		return uuidRegex.test(input) || alphanumericRegex.test(input);
	}

	/**
	 * Resolve PingOne Environment ID to issuer URL
	 */
	private async resolvePingOneEnvironmentId(envId: string): Promise<string> {
		// Try different PingOne regions
		const regions = ['us', 'eu', 'ap', 'ca'];
		
		for (const region of regions) {
			try {
				const issuerUrl = `https://auth.pingone.com/${envId}/as`;
				const testUrl = `${issuerUrl}/.well-known/openid_configuration`;
				
				const response = await fetch(testUrl, { method: 'HEAD' });
				if (response.ok) {
					return issuerUrl;
				}
			} catch (error) {
				// Continue to next region
			}
		}

		// If no region works, return default US region
		return `https://auth.pingone.com/${envId}/as`;
	}

	/**
	 * Check if input is a valid issuer URL
	 */
	private isValidIssuerUrl(input: string): boolean {
		try {
			const url = new URL(input);
			return url.protocol === 'https:' && (
				input.includes('/.well-known/openid_configuration') ||
				input.includes('/as') ||
				input.includes('/oauth') ||
				input.includes('/auth')
			);
		} catch {
			return false;
		}
	}

	/**
	 * Detect provider from issuer URL
	 */
	private detectProvider(issuerUrl: string): ProviderType {
		if (issuerUrl.includes('pingone.com')) return 'pingone';
		if (issuerUrl.includes('google.com')) return 'google';
		if (issuerUrl.includes('auth0.com')) return 'auth0';
		if (issuerUrl.includes('microsoftonline.com')) return 'microsoft';
		return 'generic';
	}

	/**
	 * Check if input is a provider name
	 */
	private isProviderName(input: string): boolean {
		return ['pingone', 'google', 'auth0', 'microsoft'].includes(input.toLowerCase());
	}

	/**
	 * Resolve provider name to issuer URL
	 */
	private async resolveProviderName(providerName: string): Promise<string> {
		const provider = providerName.toLowerCase();
		
		switch (provider) {
			case 'pingone':
				throw new Error('PingOne requires Environment ID or issuer URL');
			case 'google':
				return 'https://accounts.google.com';
			case 'auth0':
				throw new Error('Auth0 requires domain (e.g., your-domain.auth0.com)');
			case 'microsoft':
				throw new Error('Microsoft requires tenant ID or common');
			default:
				throw new Error(`Unknown provider: ${providerName}`);
		}
	}

	/**
	 * Fetch discovery document from issuer URL
	 */
	private async fetchDiscoveryDocument(issuerUrl: string, timeout: number): Promise<OIDCDiscoveryDocument> {
		// Construct discovery URL
		const discoveryUrl = issuerUrl.endsWith('/.well-known/openid_configuration') 
			? issuerUrl 
			: `${issuerUrl.replace(/\/$/, '')}/.well-known/openid_configuration`;

		console.log('[Comprehensive Discovery] Fetching discovery document:', discoveryUrl);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(discoveryUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'User-Agent': 'OAuth Playground Discovery Service',
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`Discovery request failed: ${response.status} ${response.statusText}`);
			}

			const document = await response.json();
			return document;
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	/**
	 * Validate discovery document
	 */
	private validateDiscoveryDocument(document: any, issuerUrl: string): void {
		const requiredFields = [
			'issuer',
			'authorization_endpoint',
			'token_endpoint',
			'jwks_uri',
			'response_types_supported',
			'grant_types_supported'
		];

		for (const field of requiredFields) {
			if (!document[field]) {
				throw new Error(`Missing required field in discovery document: ${field}`);
			}
		}

		// Validate issuer matches
		if (document.issuer !== issuerUrl) {
			console.warn('[Comprehensive Discovery] Issuer mismatch:', document.issuer, 'vs', issuerUrl);
		}
	}

	/**
	 * Get cached document if still valid
	 */
	private getCachedDocument(issuerUrl: string, cacheTimeout: number): OIDCDiscoveryDocument | null {
		const cached = this.cache.get(issuerUrl);
		if (cached && Date.now() - cached.timestamp < cacheTimeout) {
			return cached.document;
		}
		return null;
	}

	/**
	 * Cache discovery document
	 */
	private cacheDocument(issuerUrl: string, document: OIDCDiscoveryDocument): void {
		this.cache.set(issuerUrl, {
			document,
			timestamp: Date.now()
		});
	}

	/**
	 * Get supported providers
	 */
	getSupportedProviders(): Array<{ name: string; type: ProviderType; description: string }> {
		return [
			{
				name: 'PingOne',
				type: 'pingone',
				description: 'Environment ID or issuer URL (e.g., https://auth.pingone.com/{env-id}/as)'
			},
			{
				name: 'Google OAuth',
				type: 'google',
				description: 'Google OAuth 2.0 and OpenID Connect'
			},
			{
				name: 'Auth0',
				type: 'auth0',
				description: 'Auth0 domain (e.g., your-domain.auth0.com)'
			},
			{
				name: 'Microsoft Entra ID',
				type: 'microsoft',
				description: 'Microsoft tenant ID or common'
			},
			{
				name: 'Generic OIDC',
				type: 'generic',
				description: 'Any RFC 8414 compliant OIDC provider'
			}
		];
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		this.cache.clear();
	}
}

export const comprehensiveDiscoveryService = new ComprehensiveDiscoveryService();
