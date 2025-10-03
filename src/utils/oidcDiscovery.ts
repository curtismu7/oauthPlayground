// src/utils/oidcDiscovery.ts - OIDC discovery utilities for multi-flow reuse
import { logger } from './logger';

/**
 * Standard OIDC configuration structure
 */
export interface OIDCConfiguration {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
	jwks_uri: string;
	scopes_supported: string[];
	response_types_supported: string[];
	grant_types_supported: string[];
	subject_types_supported: string[];
	id_token_signing_alg_values_supported: string[];
	token_endpoint_auth_methods_supported: string[];
	claims_supported: string[];
	code_challenge_methods_supported: string[];
	request_parameter_supported: boolean;
	request_uri_parameter_supported: boolean;
	require_request_uri_registration: boolean;
	end_session_endpoint: string;
	revocation_endpoint: string;
	introspection_endpoint: string;
	device_authorization_endpoint: string;
	pushed_authorization_request_endpoint?: string;
	backchannel_authentication_endpoint?: string;
	backchannel_token_delivery_modes_supported?: string[];
	backchannel_user_code_parameter_supported?: boolean;
}

/**
 * Discovery result
 */
export interface DiscoveryResult {
	success: boolean;
	configuration?: OIDCConfiguration;
	error?: string;
	environmentId?: string;
	region?: string;
	fallback?: boolean;
}

/**
 * Discovery options
 */
export interface DiscoveryOptions {
	/** Environment ID */
	environmentId: string;
	/** Region (us, eu, ca, ap) */
	region?: string;
	/** Use backend proxy for CORS handling */
	useBackendProxy?: boolean;
	/** Backend proxy URL */
	backendProxyUrl?: string;
	/** Request timeout in milliseconds */
	timeout?: number;
	/** Enable fallback configuration */
	enableFallback?: boolean;
}

/**
 * Discover OIDC configuration
 */
export async function discoverOIDCConfiguration(
	options: DiscoveryOptions
): Promise<DiscoveryResult> {
	try {
		logger.info('OIDCDiscovery', 'Starting OIDC configuration discovery', {
			environmentId: options.environmentId,
			region: options.region || 'us',
			useBackendProxy: options.useBackendProxy ?? true,
		});

		const discoveryUrl = buildDiscoveryUrl(options);

		const response = await fetchWithRetry(discoveryUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			timeout: options.timeout || 30000,
		});

		if (!response.ok) {
			throw new Error(`Discovery failed: ${response.status} ${response.statusText}`);
		}

		const configuration: OIDCConfiguration = await response.json();

		// Validate required fields
		if (
			!configuration.issuer ||
			!configuration.authorization_endpoint ||
			!configuration.token_endpoint
		) {
			throw new Error('Invalid OpenID configuration: missing required fields');
		}

		logger.success('OIDCDiscovery', 'OIDC configuration discovered successfully', {
			environmentId: options.environmentId,
			issuer: configuration.issuer,
			endpoints: {
				authorization: configuration.authorization_endpoint,
				token: configuration.token_endpoint,
				userinfo: configuration.userinfo_endpoint,
				jwks: configuration.jwks_uri,
			},
		});

		return {
			success: true,
			configuration,
			environmentId: options.environmentId,
			region: options.region,
		};
	} catch (error) {
		logger.error('OIDCDiscovery', 'Failed to discover OIDC configuration', {
			environmentId: options.environmentId,
			region: options.region,
			error: error instanceof Error ? error.message : 'Unknown error',
		});

		// Try fallback configuration if enabled
		if (options.enableFallback !== false) {
			return createFallbackConfiguration(options);
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Discovery failed',
			environmentId: options.environmentId,
			region: options.region,
		};
	}
}

/**
 * Build discovery URL
 */
export function buildDiscoveryUrl(options: DiscoveryOptions): string {
	if (options.useBackendProxy) {
		const backendUrl = options.backendProxyUrl || getBackendUrl();
		return `${backendUrl}/api/discovery?environment_id=${options.environmentId}&region=${options.region || 'us'}`;
	} else {
		const baseUrl = getBaseUrl(options.region || 'us');
		const issuer = `${baseUrl}/${options.environmentId}/as`;
		return buildWellKnownUrl(issuer);
	}
}

/**
 * Build well-known discovery URL
 */
export function buildWellKnownUrl(issuer: string): string {
	return `${issuer.replace(/\/$/, '')}/.well-known/openid_configuration`;
}

/**
 * Get base URL for PingOne based on region
 */
export function getBaseUrl(region: string): string {
	const regionMap: Record<string, string> = {
		us: 'https://auth.pingone.com',
		eu: 'https://auth.pingone.eu',
		ca: 'https://auth.pingone.ca',
		ap: 'https://auth.pingone.asia',
	};

	return regionMap[region.toLowerCase()] || regionMap['us'];
}

/**
 * Get backend URL for proxy requests
 */
export function getBackendUrl(): string {
	return process.env.NODE_ENV === 'production' ? 'https://oauth-playground.vercel.app' : ''; // Use relative URL in development to go through Vite proxy
}

/**
 * Create fallback configuration
 */
function createFallbackConfiguration(options: DiscoveryOptions): DiscoveryResult {
	const baseUrl = getBaseUrl(options.region || 'us');
	const issuer = `${baseUrl}/${options.environmentId}/as`;

	const fallbackConfig: OIDCConfiguration = {
		issuer,
		authorization_endpoint: `${issuer}/authorize`,
		token_endpoint: `${issuer}/token`,
		userinfo_endpoint: `${issuer}/userinfo`,
		jwks_uri: `${issuer}/jwks`,
		scopes_supported: ['openid', 'profile', 'email', 'address', 'phone'],
		response_types_supported: [
			'code',
			'id_token',
			'token',
			'id_token token',
			'code id_token',
			'code token',
			'code id_token token',
		],
		grant_types_supported: [
			'authorization_code',
			'implicit',
			'client_credentials',
			'refresh_token',
			'urn:ietf:params:oauth:grant-type:device_code',
		],
		subject_types_supported: ['public'],
		id_token_signing_alg_values_supported: ['RS256', 'RS384', 'RS512'],
		token_endpoint_auth_methods_supported: [
			'client_secret_basic',
			'client_secret_post',
			'private_key_jwt',
			'client_secret_jwt',
		],
		claims_supported: [
			'sub',
			'iss',
			'aud',
			'exp',
			'iat',
			'auth_time',
			'nonce',
			'acr',
			'amr',
			'azp',
			'at_hash',
			'c_hash',
		],
		code_challenge_methods_supported: ['S256', 'plain'],
		request_parameter_supported: true,
		request_uri_parameter_supported: true,
		require_request_uri_registration: false,
		end_session_endpoint: `${issuer}/signoff`,
		revocation_endpoint: `${issuer}/revoke`,
		introspection_endpoint: `${issuer}/introspect`,
		device_authorization_endpoint: `${issuer}/device_authorization`,
		pushed_authorization_request_endpoint: `${issuer}/par`,
	};

	logger.info('OIDCDiscovery', 'Using fallback configuration', {
		environmentId: options.environmentId,
		issuer: fallbackConfig.issuer,
	});

	return {
		success: true,
		configuration: fallbackConfig,
		environmentId: options.environmentId,
		region: options.region,
		fallback: true,
	};
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
	url: string,
	options: RequestInit & { timeout?: number; retries?: number } = {}
): Promise<Response> {
	const { timeout = 30000, retries = 3, ...fetchOptions } = options;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			logger.debug('OIDCDiscovery', 'Fetch attempt', { url, attempt, retries });

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch(url, {
				...fetchOptions,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				logger.debug('OIDCDiscovery', 'Fetch successful', {
					url,
					attempt,
					status: response.status,
				});
				return response;
			}

			// Don't retry on client errors (4xx)
			if (response.status >= 400 && response.status < 500) {
				logger.warn('OIDCDiscovery', 'Client error, not retrying', {
					url,
					status: response.status,
				});
				return response;
			}

			// Retry on server errors (5xx) or network issues
			if (attempt < retries) {
				const delay = Math.min(1000 * 2 ** (attempt - 1), 5000); // Exponential backoff, max 5s
				logger.warn('OIDCDiscovery', 'Fetch failed, retrying', {
					url,
					attempt,
					status: response.status,
					delay,
				});
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				logger.error('OIDCDiscovery', 'Fetch failed after all retries', {
					url,
					status: response.status,
				});
				return response;
			}
		} catch (error) {
			if (attempt < retries) {
				const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
				logger.warn('OIDCDiscovery', 'Fetch error, retrying', { url, attempt, error, delay });
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				logger.error('OIDCDiscovery', 'Fetch failed after all retries', { url, error });
				throw error;
			}
		}
	}

	throw new Error('Fetch failed after all retries');
}

/**
 * Validate environment ID format
 */
export function validateEnvironmentId(environmentId: string): boolean {
	// PingOne environment IDs are typically UUIDs
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(environmentId);
}

/**
 * Extract environment ID from PingOne URL
 */
export function extractEnvironmentIdFromUrl(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const pathParts = urlObj.pathname.split('/');

		// Look for environment ID in common PingOne URL patterns
		for (let i = 0; i < pathParts.length; i++) {
			if (validateEnvironmentId(pathParts[i])) {
				return pathParts[i];
			}
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Validate OIDC configuration
 */
export function validateOIDCConfiguration(config: OIDCConfiguration): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	const requiredFields = [
		'issuer',
		'authorization_endpoint',
		'token_endpoint',
		'userinfo_endpoint',
		'jwks_uri',
	];

	for (const field of requiredFields) {
		if (!config[field as keyof OIDCConfiguration]) {
			errors.push(`Missing required field: ${field}`);
		}
	}

	// Validate URLs
	const urlFields = [
		'issuer',
		'authorization_endpoint',
		'token_endpoint',
		'userinfo_endpoint',
		'jwks_uri',
	];

	for (const field of urlFields) {
		const value = config[field as keyof OIDCConfiguration] as string;
		if (value && !isValidUrl(value)) {
			errors.push(`Invalid URL in ${field}: ${value}`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get supported features from configuration
 */
export function getSupportedFeatures(config: OIDCConfiguration): {
	pkce: boolean;
	par: boolean;
	deviceCode: boolean;
	backchannelAuth: boolean;
	introspection: boolean;
	revocation: boolean;
} {
	return {
		pkce: config.code_challenge_methods_supported?.includes('S256') ?? false,
		par: !!config.pushed_authorization_request_endpoint,
		deviceCode: !!config.device_authorization_endpoint,
		backchannelAuth: !!config.backchannel_authentication_endpoint,
		introspection: !!config.introspection_endpoint,
		revocation: !!config.revocation_endpoint,
	};
}
