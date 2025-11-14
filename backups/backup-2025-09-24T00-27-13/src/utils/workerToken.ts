// Worker Token flow utilities for PingOne Worker Token implementation

import { logger } from './logger';

export interface WorkerTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
}

export interface ClientCredentials {
	client_id: string;
	client_secret: string;
	environment_id: string;
	scopes: string[];
}

export interface TokenIntrospectionResponse {
	active: boolean;
	scope?: string;
	client_id?: string;
	exp?: number;
	iat?: number;
	sub?: string;
	aud?: string;
	iss?: string;
}

/**
 * Request client credentials token from PingOne
 */
export async function requestClientCredentialsToken(
	endpoint: string,
	clientId: string,
	clientSecret: string,
	scopes: string[]
): Promise<WorkerTokenResponse> {
	logger.info('WORKER', 'Requesting client credentials token', {
		endpoint,
		clientId: clientId.substring(0, 8) + '...',
		scopes: scopes.join(' '),
	});

	const credentials = btoa(`${clientId}:${clientSecret}`);
	const body = new URLSearchParams({
		grant_type: 'client_credentials',
		scope: scopes.join(' '),
	});

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${credentials}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: body.toString(),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Token request failed: ${response.status} ${response.statusText}. ${errorData.error_description || errorData.error || 'Please check your credentials and scopes.'}`
			);
		}

		const tokenData = await response.json();

		logger.success('TOKEN', 'Worker token received', {
			tokenType: tokenData.token_type,
			expiresIn: tokenData.expires_in,
			scopes: tokenData.scope,
		});

		return tokenData;
	} catch (error) {
		logger.error('WORKER', 'Token request failed', error);
		throw error;
	}
}

/**
 * Introspect a worker token
 */
export async function introspectToken(
	introspectionEndpoint: string,
	token: string,
	clientCredentials: ClientCredentials
): Promise<TokenIntrospectionResponse> {
	logger.info('WORKER', 'Introspecting token', {
		endpoint: introspectionEndpoint,
		tokenType: token.substring(0, 8) + '...',
	});

	const credentials = btoa(`${clientCredentials.client_id}:${clientCredentials.client_secret}`);
	const body = new URLSearchParams({
		token: token,
		token_type_hint: 'access_token',
	});

	try {
		const response = await fetch(introspectionEndpoint, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${credentials}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: body.toString(),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Token introspection failed: ${response.status} ${response.statusText}. ${errorData.error_description || errorData.error || 'Unable to introspect token.'}`
			);
		}

		const introspectionData = await response.json();

		logger.success('WORKER', 'Token introspection successful', {
			active: introspectionData.active,
			scopes: introspectionData.scope,
			clientId: introspectionData.client_id,
		});

		return introspectionData;
	} catch (error) {
		logger.error('WORKER', 'Token introspection failed', error);
		throw error;
	}
}

/**
 * Validate worker credentials format
 */
export function validateWorkerCredentials(
	clientId: string,
	clientSecret: string
): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Validate client ID format (should be a valid UUID or similar)
	if (!clientId || clientId.trim().length === 0) {
		errors.push('Client ID is required');
	} else if (clientId.length < 8) {
		errors.push('Client ID appears to be too short');
	}

	// Validate client secret format
	if (!clientSecret || clientSecret.trim().length === 0) {
		errors.push('Client Secret is required');
	} else if (clientSecret.length < 16) {
		errors.push('Client Secret appears to be too short');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Generate token endpoint URL for PingOne environment
 */
export function generateTokenEndpoint(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/as/token`;
}

/**
 * Generate introspection endpoint URL for PingOne environment
 */
export function generateIntrospectionEndpoint(environmentId: string): string {
	return `https://auth.pingone.com/${environmentId}/as/introspect`;
}

/**
 * Generate Management API base URL for PingOne environment
 */
export function generateManagementApiUrl(environmentId: string, region: string = 'NA'): string {
	const baseUrls = {
		NA: 'https://api.pingone.com',
		EU: 'https://api.pingone.eu',
		CA: 'https://api.pingone.ca',
		AP: 'https://api.pingone.asia',
	};

	return `${baseUrls[region as keyof typeof baseUrls] || baseUrls.NA}/v1/environments/${environmentId}`;
}

/**
 * Create cache key for worker token
 */
export function createTokenCacheKey(clientId: string, scopes: string[]): string {
	const scopeKey = scopes.sort().join(',');
	return `worker_token_${clientId}_${scopeKey}`;
}

/**
 * Check if token should be refreshed based on expiry
 */
export function shouldRefreshToken(
	token: WorkerTokenResponse,
	issuedAt: number,
	ttlPercent: number = 0.8
): boolean {
	const now = Date.now();
	const issuedTime = issuedAt;
	const expiryTime = issuedTime + token.expires_in * 1000;
	const refreshThreshold = issuedTime + token.expires_in * 1000 * ttlPercent;

	return now >= refreshThreshold;
}

/**
 * Parse JWT token payload (if token is JWT format)
 */
export function parseJWTPayload(token: string): any | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		const payload = parts[1];
		const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(decoded);
	} catch (error) {
		logger.warn('WORKER', 'Failed to parse JWT payload', error);
		return null;
	}
}

/**
 * Format scopes for display
 */
export function formatScopes(scopes: string): string[] {
	return scopes.split(' ').filter((scope) => scope.trim().length > 0);
}

/**
 * Get default PingOne Management API scopes
 */
export function getDefaultWorkerScopes(): string[] {
	return [
		'openid',
		'p1:read:user',
		'p1:read:userGroup',
		'p1:read:application',
		'p1:read:environment',
	];
}

/**
 * Validate environment ID format
 */
export function validateEnvironmentId(environmentId: string): boolean {
	// PingOne environment IDs are typically UUIDs
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(environmentId);
}
