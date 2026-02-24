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
						`For Device Authorization Flow with user authentication, consider using: 'openid profile email'. ` +
						`These scopes allow the device to authenticate users and access their profile information.`
				);
			}

			// Build request body for backend proxy
			// RFC 8628 Section 3.1: Device authorization request includes client_id and optionally scope
			// NOTE: Client credentials are NOT included in device authorization request
			// Client authentication happens later at the token endpoint during polling
			const requestBody: Record<string, unknown> = {
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

			// Make the device authorization request
			const response = await fetch(deviceAuthEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Device authorization failed: ${response.status} ${errorText}`);
			}

			const data = await response.json();

			// Validate response structure
			if (!data.device_code || !data.user_code) {
				throw new Error('Invalid device authorization response: missing required fields');
			}

			return {
				device_code: data.device_code,
				user_code: data.user_code,
				verification_uri: data.verification_uri,
				expires_in: data.expires_in || 1800, // Default 30 minutes
				interval: data.interval || 5, // Default 5 seconds
			};
		} catch (error) {
			console.error('[❌ DEVICE-CODE-V8] Device authorization request failed:', error);
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
		_credentials: DeviceCodeCredentials,
		_deviceCode: string,
		_interval?: number, // Optional - from device authorization response
		_maxAttempts?: number // Optional - will be calculated from expires_in if not provided
	): Promise<TokenResponse> {
		// Placeholder implementation - file structure was corrupted and needs restoration
		throw new Error('Method implementation corrupted - needs restoration');
	}

	/**
	 * Decode JWT token (without verification)
	 * @param token - JWT token to decode
	 * @returns Decoded token with header, payload, and signature
	 */
	static decodeToken(_token: string): DecodedToken {
		// Placeholder implementation - file structure was corrupted and needs restoration
		throw new Error('Method implementation corrupted - needs restoration');
	}

	/**
	 * Validate token expiry
	 * @param token - JWT token
	 * @returns True if token is not expired
	 */
	static isTokenValid(_token: string): boolean {
		// Placeholder implementation - file structure was corrupted and needs restoration
		throw new Error('Method implementation corrupted - needs restoration');
	}

	/**
	 * Get token expiry time
	 * @param token - JWT token
	 * @returns Expiry time in milliseconds from now, or null if no expiry
	 */
	static getTokenExpiryTime(_token: string): number | null {
		// Placeholder implementation - file structure was corrupted and needs restoration
		throw new Error('Method implementation corrupted - needs restoration');
	}

	/**
	 * Sleep utility for polling
	 * @param ms - Milliseconds to sleep
	 */
	private static sleep(_ms: number): Promise<void> {
		// Placeholder implementation - file structure was corrupted and needs restoration
		throw new Error('Method implementation corrupted - needs restoration');
	}

	/**
	 * Base64 URL decode
	 * @param str - Base64 URL encoded string
	 * @returns Decoded string
	 */
	private static base64UrlDecode(_str: string): string {
		// Placeholder implementation - file structure was corrupted and needs restoration
		throw new Error('Method implementation corrupted - needs restoration');
	}
}

export default DeviceCodeIntegrationServiceV8;
