// Worker Token flow utilities for PingOne Worker Token implementation

import { unifiedLoggerV8 } from '../v8/services/unifiedLoggerV8';
import { unifiedStateServiceV8 } from '../v8/services/unifiedStateServiceV8';
import { logger } from './logger';

export interface WorkerTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
}

export interface ClientCredentials {
	clientId: string;
	clientSecret: string;
	environmentId: string;
	scopes: string[];
}

export interface TokenIntrospectionResponse {
	active: boolean;
	scope?: string;
	clientId?: string;
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
	scopes: string[],
	authMethod: string = 'client_secret_post'
): Promise<WorkerTokenResponse> {
	const startTime = Date.now();
	const currentState = unifiedStateServiceV8.getCurrentState();
	const transactionId = currentState?.transactionId || `txn_${startTime}`;

	// Set transaction ID for unified logger
	unifiedLoggerV8.setTransactionId(transactionId);

	logger.info('WORKER', 'Requesting client credentials token', {
		endpoint,
		clientId: `${clientId.substring(0, 8)}...`,
		scopes: scopes.join(' '),
		authMethod,
	});

	// Log API call start to unified logger
	await unifiedLoggerV8.logApiCall({
		transactionId,
		method: 'POST',
		url: endpoint,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json',
			...(authMethod === 'client_secret_basic' && {
				Authorization: `Basic [REDACTED]`,
			}),
		},
		body: {
			grant_type: 'client_credentials',
			scope: scopes.join(' '),
			client_id: clientId,
			...(authMethod === 'client_secret_post' && {
				client_secret: '[REDACTED]',
			}),
		},
		response: { status: 0 }, // Will be updated after response
		duration: 0, // Will be updated after response
	});

	// Debug: Log the scopes being sent
	console.log('🔍 [requestClientCredentialsToken] Scopes debug:');
	console.log('  - scopes array:', scopes);
	console.log('  - scopes length:', scopes.length);
	console.log('  - scopes joined:', scopes.join(' '));
	console.log('  - scopes joined length:', scopes.join(' ').length);

	// Safety check: Ensure we have valid scopes
	if (!scopes || scopes.length === 0 || scopes.join(' ').trim() === '') {
		const error = new Error(
			'No valid scopes provided. Please configure scopes for the worker token request.'
		);

		// Log error to unified logger
		await unifiedLoggerV8.logApiCall({
			transactionId,
			method: 'POST',
			url: endpoint,
			headers: {},
			response: { status: 400, data: { error: error.message } },
			duration: Date.now() - startTime,
			error: error.message,
		});

		logger.error('WORKER', 'No valid scopes provided for token request', { scopes });
		throw error;
	}

	const body = new URLSearchParams({
		grant_type: 'client_credentials',
		scope: scopes.join(' '),
	});

	// Debug: Log the final body
	console.log('🔍 [requestClientCredentialsToken] Final body:');
	console.log('  - grant_type:', body.get('grant_type'));
	console.log('  - scope:', body.get('scope'));
	console.log('  - client_id:', body.get('client_id'));
	console.log('  - client_secret:', body.get('client_secret') ? '[REDACTED]' : 'not set');

	// Debug: Log the full body as URL-encoded string
	console.log('🔍 [requestClientCredentialsToken] Full body string:', body.toString());

	const headers: Record<string, string> = {
		'Content-Type': 'application/x-www-form-urlencoded',
		Accept: 'application/json',
	};

	// Apply authentication method
	if (authMethod === 'client_secret_basic') {
		// HTTP Basic Authentication
		const credentials = btoa(`${clientId}:${clientSecret}`);
		headers.Authorization = `Basic ${credentials}`;
		// Still need client_id in body for token endpoint
		body.append('client_id', clientId);
	} else if (authMethod === 'client_secret_post') {
		// client_secret_post - send credentials in body
		body.append('client_id', clientId);
		body.append('client_secret', clientSecret);
	} else if (authMethod === 'none') {
		// Public client - no authentication
		body.append('client_id', clientId);
	} else {
		// For JWT methods or unknown, just add client_id
		// JWT assertion should be added by caller if needed
		body.append('client_id', clientId);
		logger.warn('WORKER', `Unsupported auth method: ${authMethod}. Add client_id only.`);
	}

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers,
			body: body.toString(),
		});

		const duration = Date.now() - startTime;
		let error: string | undefined;

		if (!response.ok) {
			const errorData: Record<string, unknown> = await response.json().catch(() => ({}));
			error = `Token request failed: ${response.status} ${response.statusText}. ${errorData.error_description || errorData.error || 'Please check your credentials and scopes.'}`;

			// Log failed response to unified logger
			await unifiedLoggerV8.logApiCall({
				transactionId,
				method: 'POST',
				url: endpoint,
				headers: {
					'Content-Type': headers['Content-Type'],
					Accept: headers['Accept'],
					...(headers.Authorization && { Authorization: '[REDACTED]' }),
				},
				body: {
					grant_type: 'client_credentials',
					scope: scopes.join(' '),
					client_id: clientId,
					...(authMethod === 'client_secret_post' && {
						client_secret: '[REDACTED]',
					}),
				},
				response: {
					status: response.status,
					headers: (() => {
						const headers: Record<string, string> = {};
						response.headers.forEach((value, key) => {
							headers[key] = value;
						});
						return headers;
					})(),
					data: errorData,
				},
				duration,
				error,
			});

			throw new Error(error);
		}

		const tokenData = await response.json();

		// Log successful response to unified logger
		await unifiedLoggerV8.logApiCall({
			transactionId,
			method: 'POST',
			url: endpoint,
			headers: {
				'Content-Type': headers['Content-Type'],
				Accept: headers['Accept'],
				...(headers.Authorization && { Authorization: '[REDACTED]' }),
			},
			body: {
				grant_type: 'client_credentials',
				scope: scopes.join(' '),
				client_id: clientId,
				...(authMethod === 'client_secret_post' && {
					client_secret: '[REDACTED]',
				}),
			},
			response: {
				status: response.status,
				headers: (() => {
					const headers: Record<string, string> = {};
					response.headers.forEach((value, key) => {
						headers[key] = value;
					});
					return headers;
				})(),
				data: {
					token_type: tokenData.token_type,
					expires_in: tokenData.expires_in,
					scope: tokenData.scope,
					access_token: '[REDACTED]',
				},
			},
			duration,
		});

		// Update state machine if worker token was successfully obtained
		if (currentState && currentState.state === 'INIT') {
			try {
				await unifiedStateServiceV8.processEvent('WORKER_TOKEN_LOADED', {
					workerToken: {
						token: tokenData.access_token,
						expiresAt: Date.now() + tokenData.expires_in * 1000,
					},
				});
			} catch (stateError) {
				console.warn('Failed to update state machine:', stateError);
			}
		}

		logger.success('TOKEN', 'Worker token received', {
			tokenType: tokenData.token_type,
			expiresIn: tokenData.expires_in,
			scopes: tokenData.scope,
		});

		return tokenData;
	} catch (error) {
		const duration = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : String(error);

		// Log error to unified logger if not already logged above
		if (!errorMessage.includes('Token request failed:')) {
			await unifiedLoggerV8.logApiCall({
				transactionId,
				method: 'POST',
				url: endpoint,
				headers: {},
				response: { status: 0, data: { error: errorMessage || 'Unknown error' } },
				duration,
				error: errorMessage,
			});
		}

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
		tokenType: `${token.substring(0, 8)}...`,
	});

	const credentials = btoa(`${clientCredentials.clientId}:${clientCredentials.clientSecret}`);
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

		const introspectionData = (await response.json()) as TokenIntrospectionResponse;

		logger.success('WORKER', 'Token introspection successful', {
			active: introspectionData.active,
			scopes: introspectionData.scope,
			clientId: introspectionData.clientId,
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
	const refreshThreshold = issuedTime + token.expires_in * 1000 * ttlPercent;

	return now >= refreshThreshold;
}

/**
 * Parse JWT token payload (if token is JWT format)
 */
export function parseJWTPayload(token: string): Record<string, unknown> | null {
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
	return ['p1:read:user', 'p1:update:user', 'p1:read:device', 'p1:update:device'];
}

/**
 * Validate environment ID format
 */
export function validateEnvironmentId(environmentId: string): boolean {
	// PingOne environment IDs are typically UUIDs
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(environmentId);
}
