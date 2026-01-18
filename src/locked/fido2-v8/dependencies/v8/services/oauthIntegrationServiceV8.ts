/**
 * @file oauthIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OAuth integration with PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Authorization URL generation with PKCE
 * - Token endpoint calls
 * - Callback URL parsing
 * - Token validation and decoding
 *
 * @example
 * const service = new OAuthIntegrationServiceV8();
 * const authUrl = service.generateAuthorizationUrl(credentials);
 */

import { pingOneFetch } from '@/utils/pingOneFetch';

const MODULE_TAG = '[🔐 OAUTH-INTEGRATION-V8]';

export interface OAuthCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	scopes: string;
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	privateKey?: string; // For private_key_jwt authentication
}

export interface PKCECodes {
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: 'S256' | 'plain';
}

export interface AuthorizationUrlParams {
	authorizationUrl: string;
	state: string;
	codeChallenge: string;
	codeChallengeMethod: string;
	codeVerifier: string;
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	id_token?: string;
	refresh_token?: string;
	scope?: string;
}

export interface DecodedToken {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
}

/**
 * OAuthIntegrationServiceV8
 *
 * Real OAuth 2.0 integration with PingOne APIs
 */
export class OAuthIntegrationServiceV8 {
	/**
	 * Generate PKCE codes for secure authorization code flow
	 * @returns PKCE codes (verifier and challenge)
	 */
	static async generatePKCECodes(): Promise<PKCECodes> {
		// Generate random code verifier (43-128 characters)
		const codeVerifier = OAuthIntegrationServiceV8.generateRandomString(128);

		// Generate code challenge from verifier using SHA256 (properly async)
		const codeChallenge = await OAuthIntegrationServiceV8.generateCodeChallenge(codeVerifier);

		return {
			codeVerifier,
			codeChallenge,
			codeChallengeMethod: 'S256',
		};
	}

	/**
	 * Generate authorization URL for user authentication
	 * @param credentials - OAuth credentials
	 * @param pkceCodes - Optional PKCE codes (if provided, will be used instead of generating new ones)
	 * @returns Authorization URL parameters
	 */
	static async generateAuthorizationUrl(
		credentials: OAuthCredentials,
		pkceCodes?: PKCECodes
	): Promise<AuthorizationUrlParams> {
		// Validate required fields
		if (!credentials.redirectUri) {
			throw new Error('Redirect URI is required but not provided in credentials');
		}
		if (!credentials.clientId) {
			throw new Error('Client ID is required but not provided in credentials');
		}
		if (!credentials.environmentId) {
			throw new Error('Environment ID is required but not provided in credentials');
		}

		// Ensure scopes default to 'openid' for user authentication flows
		// User flows (authorization code, implicit, hybrid) MUST include 'openid' for OIDC
		const scopes =
			credentials.scopes && credentials.scopes.trim() !== ''
				? credentials.scopes
				: 'openid profile email';

		// Warn if 'openid' is missing (user likely made a mistake)
		if (!scopes.includes('openid')) {
			console.warn(
				`${MODULE_TAG} WARNING: 'openid' scope is missing. For user authentication flows, 'openid' scope is required for OIDC. Adding it automatically.`
			);
		}

		// Ensure 'openid' is always included for user flows
		const finalScopes = scopes.includes('openid') ? scopes : `openid ${scopes}`;

		// Use provided PKCE codes or generate new ones (now async)
		const pkce = pkceCodes || (await OAuthIntegrationServiceV8.generatePKCECodes());

		// Generate state parameter for CSRF protection
		const state = OAuthIntegrationServiceV8.generateRandomString(32);

		// Build authorization endpoint URL
		const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

		// Build query parameters
		const params = new URLSearchParams({
			client_id: credentials.clientId,
			response_type: 'code',
			redirect_uri: credentials.redirectUri,
			scope: finalScopes,
			state: state,
			code_challenge: pkce.codeChallenge,
			code_challenge_method: pkce.codeChallengeMethod,
		});

		const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

		return {
			authorizationUrl,
			state,
			codeChallenge: pkce.codeChallenge,
			codeChallengeMethod: pkce.codeChallengeMethod,
			codeVerifier: pkce.codeVerifier,
		};
	}

	/**
	 * Parse callback URL to extract authorization code and state
	 * @param callbackUrl - Full callback URL from authorization server
	 * @param expectedState - Expected state parameter for validation
	 * @returns Parsed code and state
	 */
	static parseCallbackUrl(
		callbackUrl: string,
		expectedState: string
	): { code: string; state: string } {
		try {
			const url = new URL(callbackUrl);
			const code = url.searchParams.get('code');
			const state = url.searchParams.get('state');
			const error = url.searchParams.get('error');
			const errorDescription = url.searchParams.get('error_description');

			// Check for error in callback
			if (error) {
				throw new Error(`Authorization failed: ${error} - ${errorDescription || ''}`);
			}

			// Validate code
			if (!code) {
				throw new Error('Authorization code not found in callback URL');
			}

			// Validate state
			if (!state) {
				throw new Error('State parameter not found in callback URL');
			}

			if (state !== expectedState) {
				throw new Error('State parameter mismatch - possible CSRF attack');
			}

			console.log(`${MODULE_TAG} Callback URL parsed successfully`);

			return { code, state };
		} catch (error) {
			console.error(`${MODULE_TAG} Error parsing callback URL`, { error });
			throw error;
		}
	}

	/**
	 * Exchange authorization code for tokens
	 * @param credentials - OAuth credentials
	 * @param code - Authorization code from callback
	 * @param codeVerifier - PKCE code verifier
	 * @returns Token response
	 */
	static async exchangeCodeForTokens(
		credentials: OAuthCredentials,
		code: string,
		codeVerifier: string
	): Promise<TokenResponse> {
		// Exchanging authorization code for tokens

		try {
			// Use relative path to leverage Vite proxy (proxies /api to http://localhost:3001)
			// This avoids SSL protocol errors and CORS issues
			const tokenEndpoint = '/api/token-exchange';

			const bodyParams: Record<string, string> = {
				grant_type: 'authorization_code',
				client_id: credentials.clientId,
				code: code,
				redirect_uri: credentials.redirectUri,
				environment_id: credentials.environmentId,
			};

			// Add scope parameter (optional but recommended for clarity)
			// This should match the scopes from the authorization request
			if (credentials.scopes) {
				bodyParams.scope = credentials.scopes;
			}

			// Only add code_verifier if it's provided (PKCE flow)
			if (codeVerifier) {
				bodyParams.code_verifier = codeVerifier;
			}

			// Handle client authentication based on method
			const authMethod = credentials.clientAuthMethod || 'client_secret_post';

			if (authMethod === 'client_secret_jwt' || authMethod === 'private_key_jwt') {
				// JWT assertion authentication
				try {
					const { createClientAssertion } = await import('../../utils/clientAuthentication');
					const actualTokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;

					let assertion: string;
					if (authMethod === 'client_secret_jwt') {
						if (!credentials.clientSecret) {
							throw new Error('Client secret is required for client_secret_jwt authentication');
						}
						assertion = await createClientAssertion(
							credentials.clientId,
							actualTokenEndpoint,
							credentials.clientSecret,
							'HS256'
						);
					} else {
						// private_key_jwt
						if (!credentials.privateKey) {
							throw new Error('Private key is required for private_key_jwt authentication');
						}
						assertion = await createClientAssertion(
							credentials.clientId,
							actualTokenEndpoint,
							credentials.privateKey,
							'RS256'
						);
					}

					bodyParams.client_assertion_type =
						'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
					bodyParams.client_assertion = assertion;
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to generate JWT assertion`, { error });
					throw new Error(
						`Failed to generate JWT assertion: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
				}
			} else {
				// Basic authentication methods (client_secret_basic, client_secret_post, none)
				if (authMethod === 'client_secret_basic' || authMethod === 'client_secret_post') {
					if (credentials.clientSecret) {
						if (authMethod === 'client_secret_post') {
							bodyParams.client_secret = credentials.clientSecret;
						}
						// client_secret_basic - will be handled in Authorization header
					} else {
						throw new Error(`Client secret is required for ${authMethod} authentication`);
					}
				}
			}

			// Include client_auth_method in request body so backend knows which method to use
			bodyParams.client_auth_method = authMethod;

			// Prepare request headers
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};

			// Add Authorization header for client_secret_basic
			if (authMethod === 'client_secret_basic' && credentials.clientSecret) {
				const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
				headers.Authorization = `Basic ${basicAuth}`;
			}

			// Track API call for display
			const { apiCallTrackerService } = await import('@/services/apiCallTrackerService');
			const startTime = Date.now();

			const trackedHeaders: Record<string, string> = { ...headers };
			if (trackedHeaders.Authorization) {
				trackedHeaders.Authorization = '***REDACTED***';
			}

			const actualPingOneUrl = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: tokenEndpoint,
				actualPingOneUrl,
				isProxy: true,
				headers: trackedHeaders,
				body: {
					...bodyParams,
					code: '***REDACTED***', // Don't expose authorization code in display
					code_verifier: bodyParams.code_verifier ? '***REDACTED***' : undefined,
					client_secret: bodyParams.client_secret ? '***REDACTED***' : undefined,
					client_assertion: bodyParams.client_assertion ? '***REDACTED***' : undefined,
				},
				step: 'unified-token-exchange',
				flowType: 'unified',
			});

			const response = await pingOneFetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify(bodyParams),
			});

			// Update API call with response
			const responseClone = response.clone();
			let responseData: unknown;
			try {
				responseData = await responseClone.json();
			} catch {
				responseData = { error: 'Failed to parse response' };
			}

			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				Date.now() - startTime
			);


			if (!response.ok) {
				console.error(`${MODULE_TAG} ❌ Token exchange failed with status ${response.status}`);
				const errorData = responseData as Record<string, unknown>;
				console.error(`${MODULE_TAG} Error response:`, errorData);
				
				// Check for MUST_CHANGE_PASSWORD requirement
				const requiresPasswordChange =
					errorData.requires_password_change === true ||
					errorData.password_change_required === true ||
					(errorData.error_description as string)?.toLowerCase().includes('must_change_password') ||
					(errorData.error_description as string)?.toLowerCase().includes('password change required') ||
					(errorData.error_description as string)?.toLowerCase().includes('must change password');

				if (requiresPasswordChange) {
					console.log(`${MODULE_TAG} 🔐 Password change required detected`);
					const passwordChangeError = new Error('MUST_CHANGE_PASSWORD');
					(passwordChangeError as any).code = 'MUST_CHANGE_PASSWORD';
					(passwordChangeError as any).requiresPasswordChange = true;
					(passwordChangeError as any).userId = errorData.user_id || errorData.userId;
					(passwordChangeError as any).errorData = errorData;
					throw passwordChangeError;
				}
				
				const errorCode = (errorData.error as string) || 'unknown_error';
				const errorDescription = (errorData.error_description as string) || '';
				const correlationId = (errorData.correlation_id as string) || '';
				
				// Enhanced error message for invalid_client
				if (errorCode === 'invalid_client') {
					const authMethod = credentials.clientAuthMethod || 'client_secret_post';
					const clientIdPreview = credentials.clientId
						? `${credentials.clientId.substring(0, 8)}...`
						: 'NOT PROVIDED';
					
					const enhancedMessage = `Token exchange failed: invalid_client - ${errorDescription}

📋 Root Cause:
The client credentials (client_id or client_secret) are invalid, or the authentication method doesn't match your PingOne application configuration.

🔍 Diagnostic Information:
• Client ID: ${clientIdPreview}
• Authentication Method Used: ${authMethod}
• Correlation ID: ${correlationId || 'Not provided'}

🔧 How to Fix:

1. Verify Client ID and Client Secret:
   • Go to PingOne Admin Console: https://admin.pingone.com
   • Navigate to: Applications → Your Application (${clientIdPreview})
   • Check that the Client ID matches exactly
   • Verify the Client Secret is correct (you may need to regenerate it)

2. Check Authentication Method Mismatch:
   • In PingOne, go to: Applications → Your Application → Configuration tab
   • Find "Token Endpoint Authentication Method"
   • Verify it matches what you're using: ${authMethod}
   • Common values:
     - "Client Secret Post" = client_secret_post
     - "Client Secret Basic" = client_secret_basic
     - "Private Key JWT" = private_key_jwt
     - "Client Secret JWT" = client_secret_jwt

3. If Authentication Method Doesn't Match:
   • Option A: Update PingOne app to use "${authMethod}"
   • Option B: Update your credentials to match PingOne's configured method
   • Go to Step 0 (Configuration) and change "Token Endpoint Authentication Method"

4. Verify Application is Active:
   • Ensure the application is enabled in PingOne
   • Check that the application hasn't been deleted or disabled

💡 Common Issues:
• Client Secret may have been regenerated in PingOne (old secret is invalid)
• Copy/paste errors in Client ID or Client Secret
• Authentication method changed in PingOne but not updated in your configuration
• Application was deleted and recreated with a new Client ID

📚 Documentation:
• PingOne Applications: https://apidocs.pingidentity.com/pingone/main/v1/api/#applications
• OAuth 2.0 Client Authentication: https://tools.ietf.org/html/rfc6749#section-2.3`;

					throw new Error(enhancedMessage);
				}
				
				// Standard error message for other errors
				throw new Error(
					`Token exchange failed: ${errorCode} - ${errorDescription}${correlationId ? ` (Correlation ID: ${correlationId})` : ''}`
				);
			}

			const tokens: TokenResponse = responseData as TokenResponse;

			// Check for MUST_CHANGE_PASSWORD in successful response (from ID token or response metadata)
			const requiresPasswordChange =
				(responseData as Record<string, unknown>).requires_password_change === true ||
				(responseData as Record<string, unknown>).password_change_required === true;

			if (requiresPasswordChange && tokens.id_token) {
				// Extract user ID from ID token if available
				try {
					const parts = tokens.id_token.split('.');
					if (parts.length === 3) {
						const payload = JSON.parse(atob(parts[1]));
						const passwordState =
							payload.password_state || payload.password_status || payload.pwd_state;

						if (passwordState === 'MUST_CHANGE_PASSWORD') {
							console.log(`${MODULE_TAG} 🔐 Password change required detected in ID token`);
							const passwordChangeError = new Error('MUST_CHANGE_PASSWORD');
							(passwordChangeError as any).code = 'MUST_CHANGE_PASSWORD';
							(passwordChangeError as any).requiresPasswordChange = true;
							(passwordChangeError as any).userId = payload.sub || payload.user_id;
							(passwordChangeError as any).accessToken = tokens.access_token; // Store access token for password change API call
							(passwordChangeError as any).tokens = tokens; // Store tokens for after password change
							throw passwordChangeError;
						}
					}
				} catch (parseError) {
					// If parsing fails, check response metadata
					if (requiresPasswordChange) {
						console.log(`${MODULE_TAG} 🔐 Password change required detected in response metadata`);
						const passwordChangeError = new Error('MUST_CHANGE_PASSWORD');
						(passwordChangeError as any).code = 'MUST_CHANGE_PASSWORD';
						(passwordChangeError as any).requiresPasswordChange = true;
						(passwordChangeError as any).userId = (responseData as Record<string, unknown>).user_id;
						(passwordChangeError as any).accessToken = tokens.access_token;
						(passwordChangeError as any).tokens = tokens;
						throw passwordChangeError;
					}
				}
			}

			console.log(`${MODULE_TAG} ✅ Tokens received successfully!`, {
				hasAccessToken: !!tokens.access_token,
				accessTokenLength: tokens.access_token?.length,
				hasIdToken: !!tokens.id_token,
				idTokenLength: tokens.id_token?.length,
				hasRefreshToken: !!tokens.refresh_token,
				refreshTokenLength: tokens.refresh_token?.length,
				expiresIn: tokens.expires_in,
				tokenType: tokens.token_type,
				scope: tokens.scope,
			});

			return tokens;
		} catch (error) {
			console.error(`${MODULE_TAG} ❌ Error exchanging code for tokens:`, error);
			if (error instanceof Error) {
				console.error(`${MODULE_TAG} Error message:`, error.message);
				console.error(`${MODULE_TAG} Error stack:`, error.stack);
			}
			throw error;
		}
	}

	/**
	 * Refresh access token using refresh token
	 * @param credentials - OAuth credentials
	 * @param refreshToken - Refresh token
	 * @returns New token response
	 */
	static async refreshAccessToken(
		credentials: OAuthCredentials,
		refreshToken: string
	): Promise<TokenResponse> {
		console.log(`${MODULE_TAG} Refreshing access token`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
		});

		try {
			// Use backend proxy to avoid CORS issues
			// Use relative path to leverage Vite proxy (proxies /api to http://localhost:3001)
			// This avoids SSL protocol errors and CORS issues
			const tokenEndpoint = '/api/token-exchange';

			const bodyParams: Record<string, string> = {
				grant_type: 'refresh_token',
				client_id: credentials.clientId,
				refresh_token: refreshToken,
				environment_id: credentials.environmentId,
			};

			// Add client secret if provided
			if (credentials.clientSecret) {
				bodyParams.client_secret = credentials.clientSecret;
			}

			const response = await pingOneFetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(bodyParams),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`Token refresh failed: ${errorData.error} - ${errorData.error_description || ''}`
				);
			}

			const tokens: TokenResponse = await response.json();

			console.log(`${MODULE_TAG} Access token refreshed successfully`);

			return tokens;
		} catch (error) {
			console.error(`${MODULE_TAG} Error refreshing access token`, { error });
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

			const header = JSON.parse(OAuthIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(OAuthIntegrationServiceV8.base64UrlDecode(parts[1]));
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
			const decoded = OAuthIntegrationServiceV8.decodeToken(token);
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
			const decoded = OAuthIntegrationServiceV8.decodeToken(token);
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
	 * Generate random string for state and code verifier
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
	 * Generate code challenge from code verifier using SHA256
	 * @param codeVerifier - Code verifier
	 * @returns Code challenge (using proper crypto.subtle.digest)
	 */
	private static async generateCodeChallenge(codeVerifier: string): Promise<string> {
		// Use Web Crypto API (available in all modern browsers and Node.js 15+)
		if (crypto?.subtle) {
			// Browser environment - use Web Crypto API with proper SHA-256 hashing
			return OAuthIntegrationServiceV8.browserGenerateCodeChallenge(codeVerifier);
		}

		// Fallback: simple base64 encoding (not cryptographically secure, but works)
		// This should not happen in modern browsers
		console.warn(`${MODULE_TAG} Web Crypto API not available, using fallback`);
		return OAuthIntegrationServiceV8.base64UrlEncode(codeVerifier);
	}

	/**
	 * Generate code challenge in browser using Web Crypto API with proper SHA-256
	 * @param codeVerifier - Code verifier
	 * @returns Code challenge
	 */
	private static async browserGenerateCodeChallenge(codeVerifier: string): Promise<string> {
		try {
			// Use proper crypto.subtle.digest for SHA-256 hashing (RFC 7636 compliant)
			const encoder = new TextEncoder();
			const data = encoder.encode(codeVerifier);

			// Generate SHA-256 hash using Web Crypto API
			const hashBuffer = await crypto.subtle.digest('SHA-256', data);

			// Convert ArrayBuffer to base64url
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashBase64 = btoa(String.fromCharCode(...hashArray));

			// Convert to base64url (RFC 4648 §5)
			return hashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
		} catch (err) {
			console.error(`${MODULE_TAG} Failed to generate code challenge with Web Crypto`, err);
			// Fallback to base64url encoding (not secure, but better than failing)
			return OAuthIntegrationServiceV8.base64UrlEncode(codeVerifier);
		}
	}

	/**
	 * Base64 URL encode (browser-compatible)
	 * @param data - String, Buffer, or Uint8Array to encode
	 * @returns Base64 URL encoded string
	 */
	private static base64UrlEncode(data: string | Buffer | Uint8Array): string {
		let base64: string;

		if (typeof data === 'string') {
			// Browser-compatible base64 encoding
			if (typeof btoa !== 'undefined') {
				base64 = btoa(data);
			} else if (typeof Buffer !== 'undefined') {
				// Node.js fallback
				base64 = Buffer.from(data).toString('base64');
			} else {
				throw new Error('No base64 encoding method available');
			}
		} else if (data instanceof Uint8Array) {
			// Convert Uint8Array to base64
			if (typeof btoa !== 'undefined') {
				base64 = btoa(String.fromCharCode(...data));
			} else if (typeof Buffer !== 'undefined') {
				base64 = Buffer.from(data).toString('base64');
			} else {
				throw new Error('No base64 encoding method available');
			}
		} else {
			// Buffer (Node.js) - TypeScript knows this is Buffer here
			base64 = (data as Buffer).toString('base64');
		}

		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}

	/**
	 * Base64 URL decode (browser-compatible)
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

		// Browser-compatible base64 decoding
		if (typeof atob !== 'undefined') {
			return atob(base64);
		} else if (typeof Buffer !== 'undefined') {
			// Node.js fallback
			return Buffer.from(base64, 'base64').toString('utf-8');
		} else {
			throw new Error('No base64 decoding method available');
		}
	}
}

export default OAuthIntegrationServiceV8;
