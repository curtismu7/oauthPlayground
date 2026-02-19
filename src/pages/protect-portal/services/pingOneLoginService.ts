/**
 * @file pingOneLoginService.ts
 * @module protect-portal/services
 * @description PingOne authentication service using server proxy endpoints
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This service handles PingOne embedded login flows using the existing server.js proxy
 * endpoints to avoid CORS issues when calling PingOne APIs from localhost.
 */

import type { PortalError, ServiceResponse, UserContext } from '../types/protectPortal.types';

const MODULE_TAG = '[🔐 PINGONE-LOGIN-SERVICE]';

// ============================================================================
// PINGONE LOGIN SERVICE
// ============================================================================

export class PingOneLoginService {
	private static readonly PROXY_BASE_URL = '/api/pingone';

	/**
	 * Initialize PingOne embedded login using pi.flow
	 */
	static async initializeEmbeddedLogin(
		environmentId: string,
		clientId: string,
		redirectUri: string,
		scopes: string[] = ['openid', 'profile', 'email']
	): Promise<ServiceResponse<{ flowId: string; authorizeUrl: string }>> {
		try {
			console.log(`${MODULE_TAG} Initializing PingOne embedded login`, {
				environmentId,
				clientId,
				redirectUri,
				scopes,
			});

			// Generate PKCE parameters
			const codeVerifier = PingOneLoginService.generateCodeVerifier();
			const codeChallenge = await PingOneLoginService.generateCodeChallenge(codeVerifier);
			const state = PingOneLoginService.generateState();

			// Build request body for proxy endpoint
			const requestBody = {
				environmentId: environmentId,
				clientId: clientId,
				redirectUri: redirectUri,
				response_type: 'code',
				response_mode: 'pi.flow',
				scopes: scopes.join(' '),
				codeChallenge: codeChallenge,
				codeChallengeMethod: 'S256',
				state: state,
			};

			console.log(`${MODULE_TAG} Request body:`, {
				...requestBody,
				codeChallenge: `${codeChallenge.substring(0, 20)}...`,
				clientId: `${clientId.substring(0, 8)}...`,
			});

			// Call proxy endpoint
			const response = await fetch(`${PingOneLoginService.PROXY_BASE_URL}/redirectless/authorize`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				// Try to get error details from response
				let errorDetails = '';
				try {
					const errorData = await response.json();
					errorDetails =
						errorData.error_description || errorData.message || JSON.stringify(errorData);
					console.error(`${MODULE_TAG} Server error details:`, errorData);
				} catch (_e) {
					// If response is not JSON, try to get text
					try {
						errorDetails = await response.text();
					} catch (_e2) {
						errorDetails = 'Unable to read error details';
					}
				}
				throw new Error(
					`Proxy API error: ${response.status} ${response.statusText} - ${errorDetails}`
				);
			}

			const result = await response.json();

			// Store PKCE parameters for later use
			PingOneLoginService.storePKCEParams(
				state,
				codeVerifier,
				environmentId,
				clientId,
				redirectUri
			);

			console.log(`${MODULE_TAG} PingOne embedded login initialized`, {
				flowId: state,
				proxyResponse: result,
			});

			return {
				success: true,
				data: {
					flowId: state,
					authorizeUrl: result.authorizeUrl || result.resumeUrl,
				},
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `login-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to initialize embedded login:`, error);

			const portalError: PortalError = {
				code: 'LOGIN_INIT_FAILED',
				message: error instanceof Error ? error.message : 'Failed to initialize login',
				recoverable: true,
				suggestedAction: 'Please try again',
			};

			return {
				success: false,
				error: portalError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `login-${Date.now()}`,
					processingTime: 0,
				},
			};
		}
	}

	/**
	 * Submit user credentials to PingOne flow
	 */
	static async submitCredentials(
		flowId: string,
		username: string,
		password: string
	): Promise<ServiceResponse<{ flowId: string; requiresMFA: boolean; resumeUrl?: string }>> {
		try {
			console.log(`${MODULE_TAG} Submitting credentials for flow:`, flowId);

			// Get stored PKCE parameters
			const pkceParams = PingOneLoginService.getPKCEParams(flowId);
			if (!pkceParams) {
				throw new Error('PKCE parameters not found for flow');
			}

			// Build request body for proxy endpoint
			const requestBody = {
				flowId: flowId,
				username: username,
				password: password,
			};

			// Call proxy endpoint for credential submission
			const response = await fetch(
				`${PingOneLoginService.PROXY_BASE_URL}/flows/check-username-password`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				}
			);

			if (!response.ok) {
				throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();

			console.log(`${MODULE_TAG} Credentials submitted successfully`, {
				flowId,
				requiresMFA: result.requiresMFA || false,
				hasResumeUrl: !!result.resumeUrl,
			});

			return {
				success: true,
				data: {
					flowId,
					requiresMFA: result.requiresMFA || false,
					resumeUrl: result.resumeUrl,
				},
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `creds-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to submit credentials:`, error);

			const portalError: PortalError = {
				code: 'CREDENTIALS_FAILED',
				message: error instanceof Error ? error.message : 'Failed to submit credentials',
				recoverable: true,
				suggestedAction: 'Please check your credentials and try again',
			};

			return {
				success: false,
				error: portalError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `creds-${Date.now()}`,
					processingTime: 0,
				},
			};
		}
	}

	/**
	 * Resume the flow to get authorization code
	 */
	static async resumeFlow(
		flowId: string
	): Promise<ServiceResponse<{ authorizationCode: string; state: string }>> {
		try {
			console.log(`${MODULE_TAG} Resuming flow:`, flowId);

			// Get stored PKCE parameters
			const pkceParams = PingOneLoginService.getPKCEParams(flowId);
			if (!pkceParams) {
				throw new Error('PKCE parameters not found for flow');
			}

			// Build request body for proxy endpoint
			const requestBody = {
				resumeUrl: `https://auth.pingone.com/${pkceParams.environmentId}/as/resume?flowId=${flowId}`,
			};

			// Call proxy endpoint for resume
			const response = await fetch(`${PingOneLoginService.PROXY_BASE_URL}/redirectless/poll`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();

			// Extract authorization code from various possible locations
			const authorizationCode: string =
				result.code || result.authorizeResponse?.code || result.flow?.code;
			if (!authorizationCode) {
				throw new Error('Authorization code not found in response');
			}

			const state: string = result.state || flowId;

			// Clean up stored PKCE params
			PingOneLoginService.clearPKCEParams(flowId);

			console.log(`${MODULE_TAG} Flow resumed successfully`, {
				flowId,
				hasAuthCode: !!authorizationCode,
				state,
			});

			return {
				success: true,
				data: {
					authorizationCode,
					state,
				},
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `resume-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to resume flow:`, error);

			const portalError: PortalError = {
				code: 'RESUME_FAILED',
				message: error instanceof Error ? error.message : 'Failed to resume authentication flow',
				recoverable: true,
				suggestedAction: 'Please try again',
			};

			return {
				success: false,
				error: portalError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `resume-${Date.now()}`,
					processingTime: 0,
				},
			};
		}
	}

	/**
	 * Exchange authorization code for tokens
	 */
	static async exchangeCodeForTokens(
		environmentId: string,
		clientId: string,
		clientSecret: string,
		redirectUri: string,
		authorizationCode: string,
		codeVerifier: string
	): Promise<
		ServiceResponse<{
			access_token: string;
			id_token?: string;
			token_type: string;
			expires_in: number;
			scope: string;
			refresh_token?: string;
		}>
	> {
		try {
			console.log(`${MODULE_TAG} Exchanging authorization code for tokens`);

			const requestBody = {
				environment_id: environmentId,
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				code: authorizationCode,
				code_verifier: codeVerifier,
				redirect_uri: redirectUri,
			};

			// Call proxy endpoint for token exchange
			const response = await fetch(`${PingOneLoginService.PROXY_BASE_URL}/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error(`Proxy API error: ${response.status} ${response.statusText}`);
			}

			const tokens = await response.json();

			console.log(`${MODULE_TAG} Token exchange successful`, {
				hasAccessToken: !!tokens.access_token,
				hasIdToken: !!tokens.id_token,
				tokenType: tokens.token_type,
				expiresIn: tokens.expires_in,
			});

			return {
				success: true,
				data: tokens,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `token-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to exchange code for tokens:`, error);

			const portalError: PortalError = {
				code: 'TOKEN_EXCHANGE_FAILED',
				message:
					error instanceof Error
						? error.message
						: 'Failed to exchange authorization code for tokens',
				recoverable: true,
				suggestedAction: 'Please try again',
			};

			return {
				success: false,
				error: portalError,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `token-${Date.now()}`,
					processingTime: 0,
				},
			};
		}
	}

	// ============================================================================
	// PKCE MANAGEMENT
	// ============================================================================

	private static readonly PKCE_STORE = new Map<
		string,
		{
			codeVerifier: string;
			environmentId: string;
			clientId: string;
			redirectUri: string;
			timestamp: number;
		}
	>();

	private static readonly PKCE_TTL = 10 * 60 * 1000; // 10 minutes

	/**
	 * Extract user information from ID token
	 */
	static extractUserFromIdToken(idToken: string): UserContext {
		try {
			// Split JWT token parts
			const parts = idToken.split('.');
			if (parts.length !== 3) {
				throw new Error('Invalid ID token format');
			}

			// Decode payload (base64url encoded)
			const payload = parts[1];
			// Add padding if needed for base64 decoding
			const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
			const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
			const claims = JSON.parse(decodedPayload);

			console.log(`${MODULE_TAG} Extracted user claims from ID token:`, {
				sub: claims.sub,
				email: claims.email,
				name: claims.name,
				preferred_username: claims.preferred_username,
			});

			return {
				id: claims.sub || claims.preferred_username || 'unknown',
				email: claims.email || `${claims.preferred_username || 'unknown'}@example.com`,
				name: claims.name || claims.preferred_username || 'Unknown User',
				username: claims.preferred_username || claims.sub || 'unknown',
				type: 'PING_ONE' as const,
				groups: claims.groups || [{ name: 'Default Group' }],
				device: {
					userAgent: navigator.userAgent,
					ipAddress: 'unknown', // Would be obtained from server headers
				},
				session: {
					id: claims.jti || `session-${Date.now()}`,
					createdAt: new Date().toISOString(),
				},
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to extract user from ID token:`, error);
			throw new Error('Invalid ID token format');
		}
	}

	/**
	 * Generate a random code verifier for PKCE
	 */
	private static generateCodeVerifier(): string {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		return btoa(String.fromCharCode.apply(null, Array.from(array)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/**
	 * Generate code challenge from code verifier
	 */
	private static async generateCodeChallenge(codeVerifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(codeVerifier);
		const digest = await crypto.subtle.digest('SHA-256', data);
		return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/**
	 * Generate random state parameter
	 */
	private static generateState(): string {
		return (
			Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		);
	}

	/**
	 * Store PKCE parameters
	 */
	private static storePKCEParams(
		state: string,
		codeVerifier: string,
		environmentId: string,
		clientId: string,
		redirectUri: string
	): void {
		PingOneLoginService.PKCE_STORE.set(state, {
			codeVerifier,
			environmentId,
			clientId,
			redirectUri,
			timestamp: Date.now(),
		});
	}

	/**
	 * Get stored PKCE parameters
	 */
	private static getPKCEParams(state: string): {
		codeVerifier: string;
		environmentId: string;
		clientId: string;
		redirectUri: string;
	} | null {
		const params = PingOneLoginService.PKCE_STORE.get(state);
		if (!params) {
			return null;
		}

		// Check if expired
		if (Date.now() - params.timestamp > PingOneLoginService.PKCE_TTL) {
			PingOneLoginService.PKCE_STORE.delete(state);
			return null;
		}

		return params;
	}

	/**
	 * Clear stored PKCE parameters
	 */
	private static clearPKCEParams(state: string): void {
		PingOneLoginService.PKCE_STORE.delete(state);
	}

	/**
	 * Clean up expired PKCE parameters
	 */
	static cleanupExpiredPKCEParams(): void {
		const now = Date.now();
		for (const [state, params] of PingOneLoginService.PKCE_STORE.entries()) {
			if (now - params.timestamp > PingOneLoginService.PKCE_TTL) {
				PingOneLoginService.PKCE_STORE.delete(state);
			}
		}
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default PingOneLoginService;
