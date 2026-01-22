/**
 * @file deviceCodeIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OAuth Device Authorization Flow integration with PingOne APIs (RFC 8628)
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Device authorization request
 * - Device code and user code generation
 * - Token polling with device code
 * - Token validation and decoding
 *
 * @example
 * const deviceAuth = await DeviceCodeIntegrationServiceV8.requestDeviceAuthorization(credentials);
 * const tokens = await DeviceCodeIntegrationServiceV8.pollForTokens(credentials, deviceAuth.device_code);
 */

import { pingOneFetch } from '@/utils/pingOneFetch';

const MODULE_TAG = '[📱 DEVICE-CODE-V8]';

export interface DeviceCodeCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	clientAuthMethod?: 'client_secret_basic' | 'client_secret_post' | 'none';
	scopes?: string;
}

export interface DeviceAuthorizationResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete?: string;
	expires_in: number;
	interval?: number; // Polling interval in seconds
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	id_token?: string;
	scope?: string;
}

export interface DecodedToken {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
}

/**
 * DeviceCodeIntegrationServiceV8
 *
 * Real OAuth 2.0 Device Authorization Flow integration with PingOne APIs (RFC 8628)
 */
export class DeviceCodeIntegrationServiceV8 {
	/**
	 * Request device authorization
	 * @param credentials - OAuth credentials
	 * @returns Device authorization response with device code and user code
	 */
	static async requestDeviceAuthorization(
		credentials: DeviceCodeCredentials
	): Promise<DeviceAuthorizationResponse> {
		try {
			// Use backend proxy to avoid CORS issues
			// Use relative URL in development to go through Vite proxy (avoids SSL errors)
			const deviceAuthEndpoint =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app/api/device-authorization'
					: '/api/device-authorization';

			// Validate and handle scopes for Device Authorization Flow
			const finalScopes = credentials.scopes?.trim() || '';

			if (finalScopes) {
				const scopeList = finalScopes.split(/\s+/).filter((s) => s.trim());

				// Warn if Management API scopes are detected (these are for machine-to-machine, not user auth)
				const managementApiScopes = scopeList.filter(
					(scope) =>
						scope.toLowerCase().startsWith('p1:read:') ||
						scope.toLowerCase().startsWith('p1:update:') ||
						scope.toLowerCase().startsWith('p1:create:') ||
						scope.toLowerCase().startsWith('p1:delete:')
				);

				if (managementApiScopes.length > 0) {
					console.warn(
						`${MODULE_TAG} WARNING: Management API scopes detected: ${managementApiScopes.join(', ')}. ` +
							`Device Authorization Flow is for user authentication, not machine-to-machine. ` +
							`Management API scopes (p1:read:*, p1:update:*, etc.) are intended for Client Credentials flow. ` +
							`For Device Flow, use OIDC scopes like 'openid', 'profile', 'email', 'offline_access'. ` +
							`See https://apidocs.pingidentity.com/pingone/main/v1/api/`
					);
				}

				// Warn if 'openid' is missing (Device Flow is typically used for user authentication with OIDC)
				if (!scopeList.some((scope) => scope.toLowerCase() === 'openid')) {
					console.warn(
						`${MODULE_TAG} WARNING: 'openid' scope is missing. ` +
							`Device Authorization Flow is typically used for user authentication with OIDC. ` +
							`Without 'openid', you won't receive an ID token. ` +
							`Consider adding 'openid' to your scopes (e.g., 'openid profile email').`
					);
				}
			} else {
				// Suggest default scopes if none provided
				console.warn(
					`${MODULE_TAG} No scopes provided. ` +
						`For Device Authorization Flow with user authentication, consider using: 'openid profile email offline_access'. ` +
						`These scopes allow the device to authenticate users and access their profile information.`
				);
			}

			// Build request body for backend proxy
			// RFC 8628 Section 3.1: Device authorization request includes client_id and optionally scope
			// NOTE: Client credentials are NOT included in device authorization request
			// Client authentication happens later at the token endpoint during polling
			const requestBody: Record<string, string> = {
				environment_id: credentials.environmentId,
				client_id: credentials.clientId,
			};

			// RFC 8628: Device authorization endpoint does NOT accept client credentials
			// Client authentication is performed at token endpoint, not here
			// Backend will correctly ignore client_secret and client_auth_method if sent

			// Add scope if provided (optional per RFC 8628)
			if (finalScopes) {
				requestBody.scope = finalScopes;
			}

			// Track API call for display (with timeout to prevent hanging)
			let callId: string | undefined;
			let startTime = Date.now();
			try {
				// Add timeout to dynamic import (5 seconds max)
				const importPromise = import('@/services/apiCallTrackerService');
				const timeoutPromise = new Promise<never>((_, reject) => {
					setTimeout(() => reject(new Error('Import timeout')), 5000);
				});

				const { apiCallTrackerService } = await Promise.race([importPromise, timeoutPromise]);

				// Track the API call
				callId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: deviceAuthEndpoint,
					actualPingOneUrl: deviceAuthEndpoint,
					isProxy: false,
					headers: {
						'Content-Type': 'application/json',
					},
					body: requestBody,
					step: 'unified-device-authorization',
					flowType: 'unified',
				});
			} catch (importError) {
				// If import fails or times out, continue without tracking (non-blocking)
				console.warn(
					`${MODULE_TAG} Failed to import apiCallTrackerService, continuing without tracking:`,
					importError
				);
			}

			const response = await pingOneFetch(deviceAuthEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			// Parse response once (clone first to avoid consuming the body)
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			// Update API call with response (only if tracking was successful)
			if (callId) {
				try {
					const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);
				} catch (e) {
					// Ignore tracking errors - non-blocking
					console.warn(`${MODULE_TAG} Failed to update API call tracking:`, e);
				}
			}

			if (!response.ok) {
				// Use already parsed responseData instead of parsing again
				const errorData = responseData as Record<string, unknown>;
				const errorMessage = (errorData.error_description ||
					errorData.error ||
					errorData.message ||
					'Unknown error') as string;
				const errorCode = (errorData.error || 'unknown_error') as string;

				// Extract correlation ID from error data or error message
				// Check multiple possible field names and locations
				let correlationId: string | undefined = 
					(errorData.correlation_id as string) || 
					(errorData.correlationId as string) ||
					(errorData['correlation-id'] as string) ||
					(errorData['correlationId'] as string) ||
					(errorData.correlationId_ as string);

				// Also check response headers
				if (!correlationId && response.headers) {
					const headerCorrelationId = 
						response.headers.get('X-Correlation-ID') ||
						response.headers.get('x-correlation-id') ||
						response.headers.get('Correlation-ID') ||
						response.headers.get('correlation-id');
					if (headerCorrelationId) {
						correlationId = headerCorrelationId;
					}
				}

				// Extract from error message if still not found
				if (!correlationId && typeof errorMessage === 'string') {
					const correlationMatch = errorMessage.match(/\(Correlation ID:\s*([^)]+)\)/i);
					if (correlationMatch) {
						correlationId = correlationMatch[1].trim();
					}
					// Try alternative patterns
					if (!correlationId) {
						const altMatch = errorMessage.match(/correlation[_\s-]?id[:\s]+([a-f0-9-]+)/i);
						if (altMatch) {
							correlationId = altMatch[1].trim();
						}
					}
				}

				// Check if error indicates missing grant type
				const isMissingGrantType =
					errorMessage.toLowerCase().includes('missing required grant type') ||
					(errorMessage.toLowerCase().includes('grant type') &&
						errorMessage.toLowerCase().includes('device_code'));

				// Check for 403 Forbidden - often means missing client authentication or grant type
				if (response.status === 403) {
					const hasClientSecret = !!credentials.clientSecret;
					const authMethod =
						credentials.clientAuthMethod || (hasClientSecret ? 'client_secret_basic' : 'none');

					console.error(`${MODULE_TAG} 403 Forbidden - Possible causes:`, {
						errorCode,
						errorMessage,
						correlationId,
						clientId: `${credentials.clientId?.substring(0, 8)}...`,
						hasClientSecret,
						authMethod,
						possibleCauses: [
							!hasClientSecret && authMethod !== 'none'
								? 'Missing client secret (app may require authentication)'
								: null,
							'Device Code grant type not enabled in PingOne application',
							'Invalid client credentials',
							'Application configuration mismatch',
						].filter(Boolean),
					});

					let helpfulMessage = `403 Forbidden: ${errorMessage}\n\n`;

					if (!hasClientSecret && authMethod !== 'none') {
						helpfulMessage += `🔐 Client Authentication Issue:\n`;
						helpfulMessage += `Your PingOne application appears to require client authentication, but no client secret was provided.\n\n`;
						helpfulMessage += `🔧 How to Fix:\n`;
						helpfulMessage += `1. Check if your application requires client authentication\n`;
						helpfulMessage += `2. If yes, enter your Client Secret in the configuration section above\n`;
						helpfulMessage += `3. If your application is a public client, set Client Auth Method to "None"\n\n`;
					}

					helpfulMessage += `📋 Grant Type Configuration:\n`;
					helpfulMessage += `1. Go to PingOne Admin Console: https://admin.pingone.com\n`;
					helpfulMessage += `2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n`;
					helpfulMessage += `3. Click the "Configuration" tab\n`;
					helpfulMessage += `4. Under "Grant Types", ensure "Device Code" (or "DEVICE_CODE") is checked\n`;
					helpfulMessage += `5. Under "Token Endpoint Authentication Method", verify it matches your selection\n`;
					helpfulMessage += `6. Click "Save"\n`;
					helpfulMessage += `7. Try the request again\n\n`;
					helpfulMessage += `📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/\n`;
					helpfulMessage += `🔍 Correlation ID: ${correlationId || 'N/A'}`;

					throw new Error(helpfulMessage);
				}

				if (errorCode === 'unauthorized_client' && isMissingGrantType) {
					console.error(`${MODULE_TAG} Missing grant type error`, {
						errorCode,
						errorMessage,
						correlationId,
						clientId: credentials.clientId,
					});
					throw new Error(
						`Grant Type Configuration Error: Your PingOne application is missing the DEVICE_CODE grant type.\n\n` +
							`🔧 How to Fix:\n` +
							`1. Go to PingOne Admin Console: https://admin.pingone.com\n` +
							`2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n` +
							`3. Click the "Configuration" tab\n` +
							`4. Under "Grant Types", check the box for "Device Code" (or "DEVICE_CODE")\n` +
							`5. Click "Save"\n` +
							`6. Try the request again\n\n` +
							`📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/\n` +
							`🔍 Correlation ID: ${correlationId || 'N/A'}`
					);
				}

				console.error(`${MODULE_TAG} Device authorization failed`, {
					status: response.status,
					statusText: response.statusText,
					errorCode,
					errorMessage,
					correlationId,
				});

				throw new Error(
					`Device authorization failed: ${errorCode} - ${errorMessage}${correlationId ? ` (Correlation ID: ${correlationId})` : ''}`
				);
			}

			const deviceAuth: DeviceAuthorizationResponse = await response.json();

			return deviceAuth;
		} catch (error) {
			console.error(`${MODULE_TAG} Error requesting device authorization`, { error });
			throw error;
		}
	}

	/**
	 * Poll token endpoint with device code
	 * @param credentials - OAuth credentials
	 * @param deviceCode - Device code from authorization response
	 * @param interval - Polling interval in seconds (from device authorization response, default: 5)
	 *                   RFC 8628 Section 3.5: Client SHOULD wait at least this many seconds between polls
	 * @param maxAttempts - Maximum polling attempts (default: calculated from expires_in if provided)
	 * @returns Token response
	 */
	static async pollForTokens(
		credentials: DeviceCodeCredentials,
		deviceCode: string,
		interval?: number, // Optional - from device authorization response
		maxAttempts?: number // Optional - will be calculated from expires_in if not provided
	): Promise<TokenResponse> {
		// RFC 8628 Section 3.5: Default to 5 seconds minimum if interval not provided
		const pollInterval = interval || 5;
		// Use backend proxy to avoid CORS issues
		// Use relative URL for development (same origin), absolute for production
		const tokenEndpoint =
			process.env.NODE_ENV === 'production'
				? 'https://oauth-playground.vercel.app/api/token-exchange'
				: '/api/token-exchange';

		// Track API call for display
		const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');

		// Calculate max attempts if not provided (default to 10 minutes / interval)
		const calculatedMaxAttempts = maxAttempts || Math.ceil(600 / pollInterval); // 10 minutes default

		let currentInterval = pollInterval; // Track current interval (may be adjusted by slow_down)

		for (let attempt = 0; attempt < calculatedMaxAttempts; attempt++) {
			try {
			// Build request body for backend proxy (JSON format)
			// RFC 8628 Section 3.4: Token request includes grant_type, device_code, and client_id
			// Client authentication happens at token endpoint (handled by backend)
			const requestBody: Record<string, string> = {
				grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
				client_id: credentials.clientId,
				device_code: deviceCode,
				environment_id: credentials.environmentId,
			};

			// Handle Client Authentication - pass to backend proxy
			// RFC 8628: Client authentication is performed at token endpoint using standard OAuth 2.0 methods
			if (credentials.clientSecret) {
				requestBody.client_secret = credentials.clientSecret;
				requestBody.client_auth_method = credentials.clientAuthMethod || 'client_secret_post';
			} else if (credentials.clientAuthMethod === 'none') {
				// Explicitly set to 'none' for public clients
				requestBody.client_auth_method = 'none';
			}

			// Add scope if provided (optional per RFC 8628)
			if (credentials.scopes?.trim()) {
				requestBody.scope = credentials.scopes.trim();
			}

				// Track API call for display
				const pollStartTime = Date.now();
				const actualPingOneUrl = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
				const pollCallId = apiCallTrackerService.trackApiCall({
					method: 'POST',
					url: tokenEndpoint,
					actualPingOneUrl,
					isProxy: true,
					headers: {
						'Content-Type': 'application/json',
					},
					body: {
						...requestBody,
						device_code: '***REDACTED***', // Don't expose device code in display
						client_secret: requestBody.client_secret ? '***REDACTED***' : undefined,
					},
					step: 'unified-device-token-poll',
					flowType: 'unified',
				});

				const response = await pingOneFetch(tokenEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});

				// Update API call with response
				const responseClone = response.clone();
				let pollResponseData: unknown;
				try {
					pollResponseData = await responseClone.json();
				} catch {
					pollResponseData = { error: 'Failed to parse response' };
				}

				apiCallTrackerService.updateApiCallResponse(
					pollCallId,
					{
						status: response.status,
						statusText: response.statusText,
						data: pollResponseData,
					},
					Date.now() - pollStartTime
				);

				if (response.ok) {
					const tokens: TokenResponse = pollResponseData as TokenResponse;
					return tokens;
				}

				const errorData = pollResponseData as Record<string, unknown>;

				// Check for authorization_pending (user hasn't approved yet) - RFC 8628 Section 3.5
				if (errorData.error === 'authorization_pending') {
					await DeviceCodeIntegrationServiceV8.sleep(currentInterval * 1000); // Use current interval
					continue;
				}

				// Check for slow_down (rate limiting) - RFC 8628 Section 3.5
				// On slow_down, client MUST wait the new interval seconds (minimum increase recommended)
				if (errorData.error === 'slow_down' && errorData.interval) {
					const newInterval = Math.max(errorData.interval, currentInterval + 5); // RFC 8628: minimum increase
					currentInterval = newInterval;
					await DeviceCodeIntegrationServiceV8.sleep(currentInterval * 1000);
					continue;
				}

				// Other errors (expired_token, access_denied, etc.)
				throw new Error(
					`Token polling failed: ${errorData.error} - ${errorData.error_description || ''}`
				);
			} catch (error) {
				// If it's our own error (from the throw above), re-throw it
				if (error instanceof Error && error.message.includes('Token polling failed')) {
					throw error;
				}

				// Network or other errors - log and retry
				console.warn(`${MODULE_TAG} Polling error (attempt ${attempt + 1}/${maxAttempts})`, {
					error,
				});

				// On last attempt, throw the error
				if (attempt === calculatedMaxAttempts - 1) {
					throw error;
				}

				await DeviceCodeIntegrationServiceV8.sleep(currentInterval * 1000);
			}
		}

		throw new Error('Token polling timeout - user did not authorize within time limit');
	}

	/**
	 * Decode JWT token (without verification)
	 * @param token - JWT token to decode
	 * @returns Decoded token with header, payload, and signature
	 */
	static decodeToken(token: string): DecodedToken {
		try {
			const parts = token.split('.');

			if (parts.length !== 3) {
				throw new Error('Invalid JWT format');
			}

			const header = JSON.parse(DeviceCodeIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(DeviceCodeIntegrationServiceV8.base64UrlDecode(parts[1]));
			const signature = parts[2];

			return { header, payload, signature };
		} catch (error) {
			console.error(`${MODULE_TAG} Error decoding token`, { error });
			throw error;
		}
	}

	/**
	 * Validate token expiry
	 * @param token - JWT token
	 * @returns True if token is not expired
	 */
	static isTokenValid(token: string): boolean {
		try {
			const decoded = DeviceCodeIntegrationServiceV8.decodeToken(token);
			const payload = decoded.payload as { exp?: number };

			if (!payload.exp) {
				return true; // No expiry claim
			}

			const expiryTime = payload.exp * 1000; // Convert to milliseconds
			const currentTime = Date.now();

			return currentTime < expiryTime;
		} catch {
			return false;
		}
	}

	/**
	 * Get token expiry time
	 * @param token - JWT token
	 * @returns Expiry time in milliseconds from now, or null if no expiry
	 */
	static getTokenExpiryTime(token: string): number | null {
		try {
			const decoded = DeviceCodeIntegrationServiceV8.decodeToken(token);
			const payload = decoded.payload as { exp?: number };

			if (!payload.exp) {
				return null;
			}

			const expiryTime = payload.exp * 1000;
			const currentTime = Date.now();

			return Math.max(0, expiryTime - currentTime);
		} catch {
			return null;
		}
	}

	/**
	 * Sleep utility for polling
	 * @param ms - Milliseconds to sleep
	 */
	private static sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Base64 URL decode
	 * @param str - Base64 URL encoded string
	 * @returns Decoded string
	 */
	private static base64UrlDecode(str: string): string {
		let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

		// Add padding if needed
		const padding = 4 - (base64.length % 4);
		if (padding !== 4) {
			base64 += '='.repeat(padding);
		}

		return Buffer.from(base64, 'base64').toString('utf-8');
	}
}

export default DeviceCodeIntegrationServiceV8;
