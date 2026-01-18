/**
 * @file implicitFlowIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OAuth Implicit Flow integration with PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Authorization URL generation for implicit flow
 * - Token extraction from URL fragment
 * - Token validation and decoding
 * - State parameter validation
 *
 * @example
 * const service = new ImplicitFlowIntegrationServiceV8();
 * const authUrl = service.generateAuthorizationUrl(credentials);
 */

const MODULE_TAG = '[🔓 IMPLICIT-FLOW-V8]';

export interface ImplicitFlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	privateKey?: string; // For private_key_jwt authentication
	redirectUri: string;
	scopes: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

export interface ImplicitAuthorizationUrlParams {
	authorizationUrl: string;
	state: string;
	nonce: string;
}

export interface ImplicitTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	id_token?: string;
	scope?: string;
	state?: string;
}

export interface DecodedToken {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
}

/**
 * ImplicitFlowIntegrationServiceV8
 *
 * Real OAuth 2.0 Implicit Flow integration with PingOne APIs
 */
export class ImplicitFlowIntegrationServiceV8 {
	/**
	 * Generate authorization URL for implicit flow
	 * @param credentials - OAuth credentials
	 * @param appConfig - Optional PingOne application configuration (for JAR detection)
	 * @returns Authorization URL parameters
	 */
	static async generateAuthorizationUrl(
		credentials: ImplicitFlowCredentials,
		appConfig?: { requireSignedRequestObject?: boolean }
	): Promise<ImplicitAuthorizationUrlParams> {
		console.log(`${MODULE_TAG} Generating authorization URL`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
		});

		// Ensure scopes default to 'openid' for user authentication flows
		// Implicit flow MUST include 'openid' for OIDC (to get id_token)
		const scopes =
			credentials.scopes && credentials.scopes.trim() !== ''
				? credentials.scopes
				: 'openid profile email';

		// Warn if 'openid' is missing (user likely made a mistake)
		if (!scopes.includes('openid')) {
			console.warn(
				`${MODULE_TAG} WARNING: 'openid' scope is missing. For implicit flow with id_token, 'openid' scope is required. Adding it automatically.`
			);
		}

		// Ensure 'openid' is always included for implicit flow
		const finalScopes = scopes.includes('openid') ? scopes : `openid ${scopes}`;

		// Generate state parameter for CSRF protection
		const state = ImplicitFlowIntegrationServiceV8.generateRandomString(32);

		// Generate nonce for OIDC (if using id_token)
		const nonce = ImplicitFlowIntegrationServiceV8.generateRandomString(32);

		// Build authorization endpoint URL
		const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

		// Check if JAR (JWT-secured Authorization Request) is required
		const requiresJAR = appConfig?.requireSignedRequestObject === true;

		if (requiresJAR) {
			// Generate JAR request object
			console.log(`${MODULE_TAG} 🔐 JAR required - generating signed request object...`);

			try {
				const { jarRequestObjectServiceV8 } = await import('./jarRequestObjectServiceV8');

				// Determine signing algorithm (default to HS256, use RS256 if private key is available)
				const algorithm = credentials.privateKey ? 'RS256' : 'HS256';

				if (algorithm === 'HS256' && !credentials.clientSecret) {
					throw new Error(
						'JAR requires client secret for HS256 signing, but client secret is not provided'
					);
				}

				if (algorithm === 'RS256' && !credentials.privateKey) {
					throw new Error(
						'JAR requires private key for RS256 signing, but private key is not provided'
					);
				}

				// Generate signed request object
				const jarResult = await jarRequestObjectServiceV8.generateRequestObjectJWT(
					{
						clientId: credentials.clientId,
						responseType: 'token id_token',
						redirectUri: credentials.redirectUri,
						scope: finalScopes,
						state: state,
						nonce: nonce,
					},
					{
						algorithm,
						clientSecret: credentials.clientSecret,
						privateKey: credentials.privateKey,
						audience: authorizationEndpoint,
					}
				);

				if (!jarResult.success || !jarResult.requestObject) {
					throw new Error(
						`Failed to generate JAR request object: ${jarResult.error || 'Unknown error'}`
					);
				}

				console.log(`${MODULE_TAG} ✅ JAR request object generated successfully`, {
					algorithm,
					jti: jarResult.payload?.jti,
				});

				// Build JAR authorization URL (RFC 9101: client_id must remain in query, request parameter contains JWT)
				const params = new URLSearchParams({
					client_id: credentials.clientId, // Required by RFC 9101
					request: jarResult.requestObject, // Signed JWT request object
				});

				const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

				console.log(`${MODULE_TAG} ✅ Authorization URL generated for IMPLICIT FLOW (JAR)`, {
					url: `${authorizationUrl.substring(0, 150)}...`,
					response_type: 'token id_token',
					response_mode: 'fragment',
					redirect_uri: credentials.redirectUri,
				});

				return {
					authorizationUrl,
					state,
					nonce,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error during JAR generation';
				console.error(`${MODULE_TAG} ❌ JAR generation failed:`, errorMessage);
				throw new Error(`Failed to generate JAR authorization URL: ${errorMessage}`);
			}
		}

		// Standard authorization URL (without JAR)
		// Build query parameters
		const params = new URLSearchParams({
			client_id: credentials.clientId,
			response_type: 'token id_token', // Request both access token and ID token
			redirect_uri: credentials.redirectUri,
			scope: finalScopes,
			state: state,
			nonce: nonce,
			response_mode: 'fragment', // Use fragment for implicit flow
		});

		const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

		console.log(`${MODULE_TAG} ✅ Authorization URL generated for IMPLICIT FLOW`, {
			url: `${authorizationUrl.substring(0, 150)}...`,
			response_type: 'token id_token',
			response_mode: 'fragment',
			redirect_uri: credentials.redirectUri,
		});

		return {
			authorizationUrl,
			state,
			nonce,
		};
	}

	/**
	 * Parse callback URL fragment to extract tokens
	 * @param callbackUrl - Full callback URL with fragment
	 * @param expectedState - Expected state parameter for validation
	 * @returns Parsed tokens
	 */
	static parseCallbackFragment(callbackUrl: string, expectedState: string): ImplicitTokenResponse {
		console.log(`${MODULE_TAG} Parsing callback fragment`);

		try {
			const url = new URL(callbackUrl);
			const fragment = url.hash.substring(1); // Remove '#'
			const params = new URLSearchParams(fragment);

			// Check for error in callback
			const error = params.get('error');
			const errorDescription = params.get('error_description');

			if (error) {
				throw new Error(`Authorization failed: ${error} - ${errorDescription || ''}`);
			}

			// Extract tokens
			const accessToken = params.get('access_token');
			const idToken = params.get('id_token');
			const tokenType = params.get('token_type');
			const expiresIn = params.get('expires_in');
			const state = params.get('state');
			const scope = params.get('scope');

			// Validate access token
			if (!accessToken) {
				throw new Error('Access token not found in callback');
			}

			// Validate state
			if (!state) {
				throw new Error('State parameter not found in callback');
			}

			if (state !== expectedState) {
				throw new Error('State parameter mismatch - possible CSRF attack');
			}

			console.log(`${MODULE_TAG} Callback fragment parsed successfully`);

			return {
				access_token: accessToken,
				token_type: tokenType || 'Bearer',
				expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
				id_token: idToken || undefined,
				scope: scope || undefined,
				state: state,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Error parsing callback fragment`, { error });
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

			const header = JSON.parse(ImplicitFlowIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(ImplicitFlowIntegrationServiceV8.base64UrlDecode(parts[1]));
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
			const decoded = ImplicitFlowIntegrationServiceV8.decodeToken(token);
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
			const decoded = ImplicitFlowIntegrationServiceV8.decodeToken(token);
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
	 * Validate nonce in ID token
	 * @param idToken - ID token
	 * @param expectedNonce - Expected nonce value
	 * @returns True if nonce matches
	 */
	static validateNonce(idToken: string, expectedNonce: string): boolean {
		try {
			const decoded = ImplicitFlowIntegrationServiceV8.decodeToken(idToken);
			const payload = decoded.payload as { nonce?: string };

			if (!payload.nonce) {
				console.warn(`${MODULE_TAG} No nonce in ID token`);
				return false;
			}

			const nonceMatches = payload.nonce === expectedNonce;

			if (!nonceMatches) {
				console.error(`${MODULE_TAG} Nonce mismatch`);
			}

			return nonceMatches;
		} catch (error) {
			console.error(`${MODULE_TAG} Error validating nonce`, { error });
			return false;
		}
	}

	/**
	 * Generate random string for state and nonce
	 * @param length - Length of random string
	 * @returns Random string
	 */
	private static generateRandomString(length: number): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
		let result = '';

		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		return result;
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

export default ImplicitFlowIntegrationServiceV8;
