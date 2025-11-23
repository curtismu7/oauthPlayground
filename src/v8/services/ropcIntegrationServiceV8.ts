/**
 * @file ropcIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OAuth Resource Owner Password Credentials Flow integration with PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Token request using username/password grant
 * - Client authentication
 * - Token validation and decoding
 *
 * Note: This flow is deprecated in OAuth 2.1 but still available in OAuth 2.0 and OIDC
 *
 * @example
 * const tokens = await ROPCIntegrationServiceV8.requestToken(credentials, username, password);
 */

const MODULE_TAG = '[🔐 ROPC-V8]';

export interface ROPCCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string;
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
 * ROPCIntegrationServiceV8
 *
 * Real OAuth 2.0 Resource Owner Password Credentials Flow integration with PingOne APIs
 */
export class ROPCIntegrationServiceV8 {
	/**
	 * Request access token using username/password grant
	 * @param credentials - OAuth credentials
	 * @param username - Resource owner username
	 * @param password - Resource owner password
	 * @returns Token response
	 */
	static async requestToken(
		credentials: ROPCCredentials,
		username: string,
		password: string
	): Promise<TokenResponse> {
		console.log(`${MODULE_TAG} Requesting access token`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			username, // Don't log password
		});

		try {
			// Use backend proxy to avoid CORS issues
			const backendUrl =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app'
					: 'https://localhost:3001';
			const tokenEndpoint = `${backendUrl}/api/token-exchange`;

			const bodyParams: Record<string, string> = {
				grant_type: 'password',
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				username: username,
				password: password,
				environment_id: credentials.environmentId,
			};

			// Add scope if provided
			if (credentials.scopes) {
				bodyParams.scope = credentials.scopes;
			}

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(bodyParams),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`Token request failed: ${errorData.error} - ${errorData.error_description || ''}`
				);
			}

			const tokens: TokenResponse = await response.json();

			console.log(`${MODULE_TAG} Access token received successfully`, {
				hasAccessToken: !!tokens.access_token,
				hasIdToken: !!tokens.id_token,
				hasRefreshToken: !!tokens.refresh_token,
				expiresIn: tokens.expires_in,
				scope: tokens.scope,
			});

			return tokens;
		} catch (error) {
			console.error(`${MODULE_TAG} Error requesting access token`, { error });
			throw error;
		}
	}

	/**
	 * Decode JWT token (without verification)
	 * @param token - JWT token to decode
	 * @returns Decoded token with header, payload, and signature
	 */
	static decodeToken(token: string): DecodedToken {
		console.log(`${MODULE_TAG} Decoding JWT token`);

		try {
			const parts = token.split('.');

			if (parts.length !== 3) {
				throw new Error('Invalid JWT format');
			}

			const header = JSON.parse(ROPCIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(ROPCIntegrationServiceV8.base64UrlDecode(parts[1]));
			const signature = parts[2];

			console.log(`${MODULE_TAG} Token decoded successfully`);

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
			const decoded = ROPCIntegrationServiceV8.decodeToken(token);
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
			const decoded = ROPCIntegrationServiceV8.decodeToken(token);
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

export default ROPCIntegrationServiceV8;
