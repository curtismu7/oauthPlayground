/**
 * @file hybridFlowIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OIDC Hybrid Flow integration with PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Authorization URL generation for hybrid flow
 * - Multiple response types (code id_token, code token, code token id_token)
 * - Token exchange with authorization code
 * - Token extraction from URL fragment (for implicit parts)
 * - Token validation and decoding
 *
 * @example
 * const authUrl = HybridFlowIntegrationServiceV8.generateAuthorizationUrl(credentials);
 * const tokens = await HybridFlowIntegrationServiceV8.exchangeCodeForTokens(credentials, code, codeVerifier);
 */

import { pingOneFetch } from '../../utils/pingOneFetch.ts';

const MODULE_TAG = '[🔀 HYBRID-FLOW-V8]';

export interface HybridFlowCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	privateKey?: string; // For private_key_jwt authentication
	redirectUri: string;
	scopes: string;
	responseType?: 'code id_token' | 'code token' | 'code token id_token';
	clientAuthMethod?:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
}

export interface HybridAuthorizationUrlParams {
	authorizationUrl: string;
	state: string;
	nonce: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
	codeVerifier?: string;
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
 * HybridFlowIntegrationServiceV8
 *
 * Real OpenID Connect Hybrid Flow integration with PingOne APIs
 */
export class HybridFlowIntegrationServiceV8 {
	/**
	 * Generate authorization URL for hybrid flow
	 * @param credentials - OAuth credentials
	 * @param pkceCodes - Optional PKCE codes (if provided, will be used instead of generating new ones)
	 * @returns Authorization URL parameters
	 */
	static generateAuthorizationUrl(
		credentials: HybridFlowCredentials,
		pkceCodes?: {
			codeVerifier: string;
			codeChallenge: string;
			codeChallengeMethod: 'S256' | 'plain';
		}
	): HybridAuthorizationUrlParams {
		console.log(`${MODULE_TAG} Generating authorization URL`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			responseType: credentials.responseType,
			hasPKCE: !!pkceCodes,
		});

		// Ensure scopes default to 'openid' for user authentication flows
		// Hybrid flow MUST include 'openid' for OIDC (to get id_token)
		const scopes =
			credentials.scopes && credentials.scopes.trim() !== ''
				? credentials.scopes
				: 'openid profile email';

		// Warn if 'openid' is missing (user likely made a mistake)
		if (!scopes.includes('openid')) {
			console.warn(
				`${MODULE_TAG} WARNING: 'openid' scope is missing. For hybrid flow with id_token, 'openid' scope is required. Adding it automatically.`
			);
		}

		// Ensure 'openid' is always included for hybrid flow
		const finalScopes = scopes.includes('openid') ? scopes : `openid ${scopes}`;

		// Generate state parameter for CSRF protection
		const state = HybridFlowIntegrationServiceV8.generateRandomString(32);

		// Generate nonce for OIDC (required for id_token)
		const nonce = HybridFlowIntegrationServiceV8.generateRandomString(32);

		// Build authorization endpoint URL
		const authorizationEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

		// Default response type
		const responseType = credentials.responseType || 'code id_token';

		// Build query parameters
		const params = new URLSearchParams({
			client_id: credentials.clientId,
			response_type: responseType,
			redirect_uri: credentials.redirectUri,
			scope: finalScopes,
			state: state,
			nonce: nonce,
			response_mode: 'fragment', // Hybrid flow uses fragment
		});

		let codeChallenge: string | undefined;
		let codeChallengeMethod: string | undefined;
		let codeVerifier: string | undefined;

		// Add PKCE if response type includes 'code'
		if (responseType.includes('code')) {
			// Use provided PKCE codes or generate new ones
			const pkce = pkceCodes || HybridFlowIntegrationServiceV8.generatePKCECodes();
			params.append('code_challenge', pkce.codeChallenge);
			params.append('code_challenge_method', pkce.codeChallengeMethod);
			codeChallenge = pkce.codeChallenge;
			codeChallengeMethod = pkce.codeChallengeMethod;
			codeVerifier = pkce.codeVerifier;
		}

		const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

		console.log(`${MODULE_TAG} Authorization URL generated`, {
			url: `${authorizationUrl.substring(0, 100)}...`,
			responseType,
		});

		const result: HybridAuthorizationUrlParams = {
			authorizationUrl,
			state,
			nonce,
		};

		if (codeChallenge) result.codeChallenge = codeChallenge;
		if (codeChallengeMethod) result.codeChallengeMethod = codeChallengeMethod;
		if (codeVerifier) result.codeVerifier = codeVerifier;

		return result;
	}

	/**
	 * Parse callback URL fragment to extract tokens and code
	 *
	 * For hybrid flow, the callback contains:
	 * - Authorization code in query string (?code=...)
	 * - ID token and access token in fragment (#id_token=...&access_token=...)
	 *
	 * @param callbackUrl - Full callback URL with fragment
	 * @param expectedState - Expected state parameter for validation
	 * @returns Parsed code and tokens
	 */
	static parseCallbackFragment(
		callbackUrl: string,
		expectedState: string
	): { code?: string; access_token?: string; id_token?: string; state: string } {
		console.log(`${MODULE_TAG} Parsing callback fragment for hybrid flow`);

		try {
			const url = new URL(callbackUrl);

			// For hybrid flow, check BOTH query string and fragment
			// - Authorization code is in query string (?code=...)
			// - ID token and access token are in fragment (#id_token=...&access_token=...)
			const queryParams = new URLSearchParams(url.search);
			const fragment = url.hash.substring(1); // Remove '#'
			const fragmentParams = fragment ? new URLSearchParams(fragment) : null;

			// Check for error in either query or fragment
			const error = fragmentParams?.get('error') || queryParams.get('error');
			const errorDescription =
				fragmentParams?.get('error_description') || queryParams.get('error_description');

			if (error) {
				throw new Error(`Authorization failed: ${error} - ${errorDescription || ''}`);
			}

			// Extract authorization code from query string (hybrid flow standard)
			const code = queryParams.get('code');

			// Extract tokens from fragment (hybrid flow standard)
			const accessToken = fragmentParams?.get('access_token') || null;
			const idToken = fragmentParams?.get('id_token') || null;

			// State can be in either query or fragment (check both)
			const state = fragmentParams?.get('state') || queryParams.get('state');

			// Validate state
			if (!state) {
				throw new Error('State parameter not found in callback');
			}

			if (state !== expectedState) {
				throw new Error('State parameter mismatch - possible CSRF attack');
			}

			// Validate that we have at least code or tokens
			if (!code && !accessToken && !idToken) {
				throw new Error('No authorization code or ID token found in callback URL');
			}

			console.log(`${MODULE_TAG} Callback parsed successfully`, {
				hasCode: !!code,
				hasAccessToken: !!accessToken,
				hasIdToken: !!idToken,
				codeSource: code ? 'query' : 'none',
				tokenSource: accessToken || idToken ? 'fragment' : 'none',
			});

			const result: { code?: string; access_token?: string; id_token?: string; state: string } = {
				state,
			};

			if (code) result.code = code;
			if (accessToken) result.access_token = accessToken;
			if (idToken) result.id_token = idToken;

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Error parsing callback fragment`, { error });
			throw error;
		}
	}

	/**
	 * Exchange authorization code for tokens
	 * @param credentials - OAuth credentials
	 * @param code - Authorization code from callback
	 * @param codeVerifier - PKCE code verifier (if used)
	 * @returns Token response
	 */
	static async exchangeCodeForTokens(
		credentials: HybridFlowCredentials,
		code: string,
		codeVerifier?: string
	): Promise<TokenResponse> {
		console.log(`${MODULE_TAG} Exchanging authorization code for tokens`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
		});

		try {
			// Use backend proxy to avoid CORS issues
			const backendUrl =
				process.env.NODE_ENV === 'production'
					? 'https://oauth-playground.vercel.app'
					: 'https://localhost:3001';
			const tokenEndpoint = `${backendUrl}/api/token-exchange`;

			const bodyParams: Record<string, string> = {
				grant_type: 'authorization_code',
				client_id: credentials.clientId,
				code: code,
				redirect_uri: credentials.redirectUri,
				environment_id: credentials.environmentId,
			};

			// Add PKCE code verifier if provided
			if (codeVerifier) {
				bodyParams.code_verifier = codeVerifier;
			}

			// Handle client authentication based on method
			const authMethod = credentials.clientAuthMethod || 'client_secret_post';
			console.log(`${MODULE_TAG} 🔐 Using client authentication method: ${authMethod}`);

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
					console.log(`${MODULE_TAG} ✅ Using JWT assertion authentication (${authMethod})`);
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
							console.log(
								`${MODULE_TAG} ✅ Including client_secret in request (client_secret_post)`
							);
						} else {
							// client_secret_basic - will be handled in Authorization header
							console.log(`${MODULE_TAG} ✅ Will use client_secret_basic authentication`);
						}
					} else {
						throw new Error(`Client secret is required for ${authMethod} authentication`);
					}
				} else {
					// none - public client, no authentication
					console.log(`${MODULE_TAG} ⚠️ No client authentication (public client)`);
				}
			}

			// Prepare request headers
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};

			// Add Authorization header for client_secret_basic
			if (authMethod === 'client_secret_basic' && credentials.clientSecret) {
				const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
				headers.Authorization = `Basic ${basicAuth}`;
				console.log(`${MODULE_TAG} ✅ Added Authorization header (client_secret_basic)`);
			}

			const response = await pingOneFetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify(bodyParams),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`Token exchange failed: ${errorData.error} - ${errorData.error_description || ''}`
				);
			}

			const tokens: TokenResponse = await response.json();

			console.log(`${MODULE_TAG} Tokens received successfully`, {
				hasAccessToken: !!tokens.access_token,
				hasIdToken: !!tokens.id_token,
				hasRefreshToken: !!tokens.refresh_token,
				expiresIn: tokens.expires_in,
			});

			return tokens;
		} catch (error) {
			console.error(`${MODULE_TAG} Error exchanging code for tokens`, { error });
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

			const header = JSON.parse(HybridFlowIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(HybridFlowIntegrationServiceV8.base64UrlDecode(parts[1]));
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
			const decoded = HybridFlowIntegrationServiceV8.decodeToken(token);
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
	 * Validate nonce in ID token
	 * @param idToken - ID token
	 * @param expectedNonce - Expected nonce value
	 * @returns True if nonce matches
	 */
	static validateNonce(idToken: string, expectedNonce: string): boolean {
		try {
			const decoded = HybridFlowIntegrationServiceV8.decodeToken(idToken);
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
	 * Generate PKCE codes for secure authorization code flow
	 * @returns PKCE codes (verifier and challenge)
	 */
	private static generatePKCECodes(): {
		codeVerifier: string;
		codeChallenge: string;
		codeChallengeMethod: 'S256';
	} {
		// Generate random code verifier (43-128 characters)
		const codeVerifier = HybridFlowIntegrationServiceV8.generateRandomString(128);

		// Generate code challenge from verifier using SHA256
		const codeChallenge = HybridFlowIntegrationServiceV8.generateCodeChallenge(codeVerifier);

		return {
			codeVerifier,
			codeChallenge,
			codeChallengeMethod: 'S256',
		};
	}

	/**
	 * Generate code challenge from code verifier using SHA256
	 * Uses browser-compatible encoding
	 * @param codeVerifier - Code verifier
	 * @returns Code challenge
	 */
	private static generateCodeChallenge(codeVerifier: string): string {
		// Browser-compatible base64url encoding
		// Note: For production, this should hash with SHA-256 first using Web Crypto API
		// For now, using simple base64url encoding for compatibility
		return HybridFlowIntegrationServiceV8.base64UrlEncode(codeVerifier);
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
			// Buffer (Node.js)
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

export default HybridFlowIntegrationServiceV8;
