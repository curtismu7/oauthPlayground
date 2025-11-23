/**
 * @file clientCredentialsIntegrationServiceV8.ts
 * @module v8/services
 * @description Real OAuth Client Credentials Flow integration with PingOne APIs
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Handles:
 * - Token request using client credentials grant
 * - No user interaction required (machine-to-machine)
 * - Token validation and decoding
 *
 * @example
 * const tokens = await ClientCredentialsIntegrationServiceV8.requestToken(credentials);
 */

const MODULE_TAG = '[🔑 CLIENT-CREDENTIALS-V8]';

export type ClientAuthMethod =
	| 'none'
	| 'client_secret_basic'
	| 'client_secret_post'
	| 'client_secret_jwt'
	| 'private_key_jwt';

export interface ClientCredentialsCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes?: string;
	clientAuthMethod?: ClientAuthMethod;
	privateKey?: string; // Required for private_key_jwt authentication
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
}

export interface DecodedToken {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
	signature: string;
}

/**
 * ClientCredentialsIntegrationServiceV8
 *
 * Real OAuth 2.0 Client Credentials Flow integration with PingOne APIs
 */
export class ClientCredentialsIntegrationServiceV8 {
	/**
	 * Request access token using client credentials grant
	 * @param credentials - OAuth credentials
	 * @returns Token response
	 */
	static async requestToken(credentials: ClientCredentialsCredentials): Promise<TokenResponse> {
		console.log(`${MODULE_TAG} Requesting access token`, {
			environmentId: credentials.environmentId,
			clientId: credentials.clientId,
			clientAuthMethod: credentials.clientAuthMethod || 'client_secret_post',
		});

		try {
			// Use backend proxy to avoid CORS issues
			const backendUrl = process.env.NODE_ENV === 'production'
				? 'https://oauth-playground.vercel.app'
				: 'https://localhost:3001';
			const tokenEndpoint = `${backendUrl}/api/client-credentials`;

			// Client Credentials flow REQUIRES client authentication (RFC 6749 Section 4.4)
			// 'none' is NOT allowed - default to client_secret_basic (most common) if none is specified
			const authMethod: Exclude<ClientAuthMethod, 'none'> =
				credentials.clientAuthMethod && credentials.clientAuthMethod !== 'none'
					? (credentials.clientAuthMethod as Exclude<ClientAuthMethod, 'none'>)
					: 'client_secret_basic';

			// Build request body for backend proxy
			const requestBody: Record<string, string> = {
				grant_type: 'client_credentials',
			};

			const headers: Record<string, string> = {};

			// Build request body for backend proxy
			// The backend proxy expects: environment_id, auth_method, body (with grant_type, client_id, etc.), headers (for Basic auth)
			const proxyRequestBody: Record<string, string> = {
				grant_type: 'client_credentials',
				client_id: credentials.clientId,
			};

			// Add scope - REQUIRED for client credentials flow
			// NOTE: Client credentials is for machine-to-machine auth, NOT user auth
			// Do NOT use 'openid' scope - use Management API scopes like p1:read:user
			if (!credentials.scopes || credentials.scopes.trim() === '') {
				console.error(`${MODULE_TAG} No scopes provided - client credentials flow requires scopes`);
				throw new Error(
					'Scopes are required for client credentials flow. Use Management API scopes (e.g., p1:read:users, p1:read:environments, p1:read:applications). Do NOT use "openid" - that is for user authentication flows only. See https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles'
				);
			}
			
			// Validate scopes for client credentials flow
			const scopeList = credentials.scopes.split(/\s+/).filter(s => s.trim());
			const invalidScopes = scopeList.filter(scope => 
				['offline_access', 'profile', 'email', 'address', 'phone'].includes(scope.toLowerCase())
			);
			
			if (invalidScopes.length > 0) {
				console.warn(
					`${MODULE_TAG} WARNING: Invalid scopes detected for client credentials flow: ${invalidScopes.join(', ')}. These are user authentication scopes and may not work with client credentials flow. Use Management API scopes instead (p1:read:users, p1:read:environments, p1:read:applications, etc.). See https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles`
				);
			}
			
			// Note: 'openid' is allowed per user request, though typically used for user authentication flows
			if (scopeList.includes('openid')) {
				console.log(
					`${MODULE_TAG} Note: 'openid' scope included. This may enable ID token issuance if supported by your PingOne application configuration.`
				);
			}
			
			console.log(`${MODULE_TAG} Requesting token with scopes: ${credentials.scopes}`);
			proxyRequestBody.scope = credentials.scopes;

			// Apply client authentication method
			switch (authMethod) {
				case 'client_secret_basic': {
					// HTTP Basic Authentication (RFC 7617) - pass via headers to backend
					const credentials_b64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
					headers['Authorization'] = `Basic ${credentials_b64}`;
					console.log(`${MODULE_TAG} Using Basic authentication`);
					break;
				}

				case 'client_secret_post': {
					// Client credentials in POST body (default)
					proxyRequestBody.client_secret = credentials.clientSecret;
					console.log(`${MODULE_TAG} Using POST body authentication`);
					break;
				}

				case 'client_secret_jwt': {
					// JWT assertion authentication using client secret (HS256)
					if (!credentials.clientSecret) {
						throw new Error('Client secret is required for client_secret_jwt authentication');
					}
					try {
						const { createClientAssertion } = await import('@/utils/clientAuthentication');
						const actualTokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
						const assertion = await createClientAssertion(
							credentials.clientId,
							actualTokenEndpoint,
							credentials.clientSecret,
							'HS256'
						);
						proxyRequestBody.client_id = credentials.clientId;
						proxyRequestBody.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
						proxyRequestBody.client_assertion = assertion;
						console.log(`${MODULE_TAG} Using Client Secret JWT assertion authentication`);
					} catch (error) {
						console.error(`${MODULE_TAG} Failed to generate client secret JWT assertion`, { error });
						throw new Error(
							`Failed to generate JWT assertion: ${error instanceof Error ? error.message : 'Unknown error'}`
						);
					}
					break;
				}

				case 'private_key_jwt': {
					// JWT assertion authentication using private key (RS256)
					const privateKey = (credentials as { privateKey?: string }).privateKey;
					if (!privateKey) {
						throw new Error('Private key is required for private_key_jwt authentication');
					}
					try {
						const { createClientAssertion } = await import('@/utils/clientAuthentication');
						const actualTokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
						const assertion = await createClientAssertion(
							credentials.clientId,
							actualTokenEndpoint,
							privateKey,
							'RS256'
						);
						proxyRequestBody.client_id = credentials.clientId;
						proxyRequestBody.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
						proxyRequestBody.client_assertion = assertion;
						console.log(`${MODULE_TAG} Using Private Key JWT assertion authentication`);
					} catch (error) {
						console.error(`${MODULE_TAG} Failed to generate private key JWT assertion`, { error });
						throw new Error(
							`Failed to generate JWT assertion: ${error instanceof Error ? error.message : 'Unknown error'}`
						);
					}
					break;
				}

				default: {
					// Fallback to client_secret_post for any unexpected values
					console.warn(
						`${MODULE_TAG} Unknown authentication method, using client_secret_post`
					);
					proxyRequestBody.client_secret = credentials.clientSecret;
					break;
				}
			}

			// Log the complete request body for debugging
			console.log(`${MODULE_TAG} Request body:`, proxyRequestBody);
			console.log(`${MODULE_TAG} Request URL:`, tokenEndpoint);
			console.log(`${MODULE_TAG} Request headers:`, headers);

			// Build request for backend proxy
			const proxyRequest: {
				environment_id: string;
				auth_method?: string;
				body: Record<string, string>;
				headers?: Record<string, string>;
			} = {
				environment_id: credentials.environmentId,
				body: proxyRequestBody,
			};

			// Add auth method and headers if using Basic auth
			if (authMethod === 'client_secret_basic') {
				proxyRequest.auth_method = 'client_secret_basic';
				proxyRequest.headers = headers;
			} else {
				proxyRequest.auth_method = authMethod;
			}

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(proxyRequest),
			});

			if (!response.ok) {
				const errorData = await response.json();
				const errorMessage = errorData.error_description || errorData.error || 'Unknown error';
				const errorCode = errorData.error || 'unknown_error';
				
				// Extract correlation ID from error data or error message
				let correlationId = errorData.correlation_id || errorData.correlationId;
				if (!correlationId && typeof errorMessage === 'string') {
					// Try to extract from error message format: "... (Correlation ID: ...)"
					const correlationMatch = errorMessage.match(/\(Correlation ID:\s*([^)]+)\)/i);
					if (correlationMatch) {
						correlationId = correlationMatch[1].trim();
					}
				}
				
				// Provide helpful error message for invalid_scope errors
				if (errorCode === 'invalid_scope') {
					console.error(`${MODULE_TAG} Invalid scope error`, {
						scopesRequested: credentials.scopes,
						errorCode,
						errorMessage,
						correlationId,
					});
					
					// Check if error indicates scopes are not granted (common issue)
					const isScopeNotGranted = errorMessage.toLowerCase().includes('at least one scope must be granted') ||
						errorMessage.toLowerCase().includes('scope must be granted') ||
						errorMessage.toLowerCase().includes('no scope granted');
					
					if (isScopeNotGranted) {
						throw new Error(
							`Scope Configuration Error: The scopes "${credentials.scopes}" are not enabled/granted to your application in PingOne.\n\n` +
							`🔧 How to Fix:\n` +
							`1. Go to PingOne Admin Console: https://admin.pingone.com\n` +
							`2. Navigate to: Applications → Your Application (${credentials.clientId?.substring(0, 8)}...)\n` +
							`3. Click the "Resources" tab\n` +
							`4. Enable "PingOne API" resource if not already enabled\n` +
							`5. Under "Scopes", check the boxes for: ${credentials.scopes.split(/\s+/).join(', ')}\n` +
							`6. Click "Save"\n` +
							`7. Try the request again\n\n` +
							`📚 Documentation: https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles\n` +
							`🔍 Correlation ID: ${correlationId || 'N/A'}`
						);
					}
					
					throw new Error(
						`Invalid scopes: ${errorMessage}. Client credentials flow requires Management API scopes (e.g., p1:read:users, p1:read:environments, p1:read:applications). The scopes "${credentials.scopes}" are not valid for this flow type. Ensure these scopes are enabled in your PingOne application's Resources tab. See https://apidocs.pingidentity.com/pingone/main/v1/api/#access-services-through-scopes-and-roles\n\nCorrelation ID: ${correlationId || 'N/A'}`
					);
				}
				
				console.error(`${MODULE_TAG} Token request failed`, {
					status: response.status,
					statusText: response.statusText,
					errorCode,
					errorMessage,
					scopesRequested: credentials.scopes,
					correlationId,
				});
				
				throw new Error(
					`Token request failed: ${errorCode} - ${errorMessage}`
				);
			}

			const tokens: TokenResponse = await response.json();

			console.log(`${MODULE_TAG} Access token received successfully`, {
				hasAccessToken: !!tokens.access_token,
				expiresIn: tokens.expires_in,
				scope: tokens.scope,
			});

			return tokens;
		} catch (error) {
			// Log detailed error information
			const errorDetails: Record<string, unknown> = {
				error: error instanceof Error ? error.message : String(error),
			};
			
			if (error instanceof Error) {
				errorDetails.stack = error.stack;
				errorDetails.name = error.name;
			}
			
			// Include request details for debugging
			errorDetails.environmentId = credentials.environmentId;
			errorDetails.clientId = credentials.clientId;
			errorDetails.scopes = credentials.scopes;
			errorDetails.authMethod = credentials.clientAuthMethod || 'client_secret_post';
			
			console.error(`${MODULE_TAG} Error requesting access token`, errorDetails);
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

			const header = JSON.parse(ClientCredentialsIntegrationServiceV8.base64UrlDecode(parts[0]));
			const payload = JSON.parse(ClientCredentialsIntegrationServiceV8.base64UrlDecode(parts[1]));
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
			const decoded = ClientCredentialsIntegrationServiceV8.decodeToken(token);
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
			const decoded = ClientCredentialsIntegrationServiceV8.decodeToken(token);
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

export default ClientCredentialsIntegrationServiceV8;
