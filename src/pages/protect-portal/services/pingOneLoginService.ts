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

import { logger } from '../../../utils/logger';
import type { PortalError, ServiceResponse, UserContext } from '../types/protectPortal.types';

const MODULE_TAG = '[🔐 PINGONE-LOGIN-SERVICE]';

// ============================================================================
// PINGONE LOGIN SERVICE
// ============================================================================

export class PingOneLoginService {
	private static readonly PROXY_BASE_URL = '/api/pingone';

	/**
	 * Initialize PingOne embedded login using pi.flow.
	 * redirect_uri is optional per PingOne docs — omit for pi.flow to avoid validation errors.
	 */
	static async initializeEmbeddedLogin(
		environmentId: string,
		clientId: string,
		redirectUri?: string,
		scopes: string[] = ['openid', 'profile', 'email'],
		region?: string
	): Promise<
		ServiceResponse<{ flowId: string; sessionId: string; resumeUrl?: string; codeVerifier: string }>
	> {
		try {
			logger.info(`${MODULE_TAG} Initializing PingOne embedded login`, {
				environmentId,
				clientId,
				redirectUri: redirectUri ?? '(omitted for pi.flow)',
				scopes,
			});

			// Use response_type=code + PKCE — works with any Authorization Code app.
			// (response_type=token id_token requires Implicit grant which many apps don't have)
			const codeVerifier = PingOneLoginService.generateCodeVerifier();
			const codeChallenge = await PingOneLoginService.generateCodeChallenge(codeVerifier);

			const requestBody: Record<string, unknown> = {
				environmentId: environmentId,
				clientId: clientId,
				response_type: 'code',
				response_mode: 'pi.flow',
				scopes: scopes.join(' '),
				codeChallenge,
				codeChallengeMethod: 'S256',
			};
			if (region?.trim()) {
				requestBody.region = region.trim().toLowerCase();
			}

			logger.info(`${MODULE_TAG} Request body:`, {
				...requestBody,
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
				let errorDetails = '';
				let validationHint = '';
				try {
					const errorData = (await response.json()) as Record<string, unknown>;
					// The proxy wraps PingOne errors: { error_description, details: <PingOne body> }
					// Surface the deepest available message so the PingOne error is visible.
					const pingOneDetails = errorData.details as Record<string, unknown> | undefined;
					const pingOneMsg = pingOneDetails
						? String(
								pingOneDetails.message ||
									pingOneDetails.error_description ||
									pingOneDetails.error ||
									''
							) || JSON.stringify(pingOneDetails)
						: '';
					errorDetails =
						pingOneMsg ||
						(errorData.error_description !== undefined
							? String(errorData.error_description)
							: '') ||
						(errorData.message !== undefined ? String(errorData.message) : '') ||
						JSON.stringify(errorData);
					logger.error(MODULE_TAG, 'PingOne error response:', errorData);
					if (response.status === 400) {
						validationHint =
							' — Ensure the OAuth app (not Worker) has Authorization Code grant enabled. For pi.flow, no redirect_uri is required. See https://docs.pingidentity.com/pingone/applications/p1_response_mode_values.html';
					}
				} catch (_e) {
					try {
						errorDetails = await response.text();
					} catch (_e2) {
						errorDetails = 'Unable to read error details';
					}
				}
				throw new Error(`PingOne ${response.status}: ${errorDetails}${validationHint}`);
			}

			const result = await response.json();

			// Server returns flow id from PingOne, sessionId for cookie jar, resumeUrl
			const flowId = result.id || result.flowId;
			const sessionId = result._sessionId;
			const resumeUrl = result.resumeUrl;

			if (!flowId || !sessionId) {
				throw new Error(
					`Invalid authorize response: missing flow id or session (id=${!!flowId}, _sessionId=${!!sessionId})`
				);
			}

			// Store flow params by flowId for submitCredentials/resumeFlow
			PingOneLoginService.storeFlowParams(flowId, {
				codeVerifier,
				environmentId,
				clientId,
				redirectUri: '',
				sessionId,
				state: undefined,
				resumeUrl:
					resumeUrl || `https://auth.pingone.com/${environmentId}/as/resume?flowId=${flowId}`,
			});

			logger.info(`${MODULE_TAG} PingOne embedded login initialized`, {
				flowId,
				hasResumeUrl: !!resumeUrl,
			});

			return {
				success: true,
				data: {
					flowId,
					sessionId,
					resumeUrl: resumeUrl || result.authorizeUrl,
					codeVerifier,
				},
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `login-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to initialize embedded login:', undefined, error as Error);

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
		password: string,
		clientId?: string,
		clientSecret?: string
	): Promise<ServiceResponse<{ flowId: string; requiresMFA: boolean; resumeUrl?: string }>> {
		try {
			logger.info(`${MODULE_TAG} Submitting credentials for flow:`, flowId);

			const params = PingOneLoginService.getFlowParams(flowId);
			if (!params) {
				throw new Error('Flow parameters not found. Re-initialize the login flow.');
			}

			const flowUrl = `https://auth.pingone.com/${params.environmentId}/flows/${flowId}`;
			const requestBody: Record<string, unknown> = {
				flowUrl,
				environmentId: params.environmentId,
				sessionId: params.sessionId,
				username,
				password,
			};
			if (clientId) requestBody.clientId = clientId;
			if (clientSecret) requestBody.clientSecret = clientSecret;

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
				const errData = await response.json().catch(() => ({}));
				const msg =
					errData.error_description || errData.message || errData.error || response.statusText;
				throw new Error(msg);
			}

			const result = await response.json();

			// Update stored sessionId and resumeUrl from response
			if (result._sessionId || result.resumeUrl) {
				PingOneLoginService.updateFlowParams(flowId, {
					sessionId: result._sessionId ?? params.sessionId,
					resumeUrl: result.resumeUrl ?? params.resumeUrl,
				});
			}

			logger.info(`${MODULE_TAG} Credentials submitted successfully`, {
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
			logger.error(MODULE_TAG, 'Failed to submit credentials:', undefined, error as Error);

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
	 * Resume the pi.flow — works for both response_type=code (returns code, exchanges for tokens)
	 * and response_type=token id_token (tokens returned directly).
	 */
	static async resumeFlow(
		flowId: string,
		clientSecret?: string
	): Promise<
		ServiceResponse<{
			access_token: string;
			id_token?: string;
			token_type: string;
			expires_in: number;
			scope: string;
		}>
	> {
		try {
			logger.info(`${MODULE_TAG} Resuming pi.flow to get tokens:`, flowId);

			const params = PingOneLoginService.getFlowParams(flowId);
			if (!params) {
				throw new Error('Flow parameters not found. Re-initialize the login flow.');
			}

			const requestBody = {
				resumeUrl: params.resumeUrl,
				flowId,
				flowState: params.state,
				clientId: params.clientId,
				sessionId: params.sessionId,
				codeVerifier: params.codeVerifier || undefined,
			};

			const response = await fetch(`${PingOneLoginService.PROXY_BASE_URL}/resume`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				const msg =
					errData.error_description || errData.message || errData.error || response.statusText;
				throw new Error(msg);
			}

			const result = await response.json();

			// pi.flow with response_type=code: resume returns { code, state }
			// Exchange the code for tokens using PKCE verifier stored in FLOW_PARAMS_STORE.
			if (result.code) {
				const exchangeRes = await PingOneLoginService.exchangeCodeForTokens(
					params.environmentId,
					params.clientId,
					clientSecret || '',
					params.redirectUri || '',
					result.code as string,
					params.codeVerifier
				);
				if (!exchangeRes.success || !exchangeRes.data) {
					throw new Error(exchangeRes.error?.message || 'Token exchange failed');
				}
				PingOneLoginService.clearFlowParams(flowId);
				logger.info(`${MODULE_TAG} pi.flow code exchanged for tokens`, { flowId });
				return {
					success: true,
					data: exchangeRes.data,
					metadata: {
						timestamp: new Date().toISOString(),
						requestId: `resume-${Date.now()}`,
						processingTime: 0,
					},
				};
			}

			// pi.flow with response_type=token id_token: tokens may be at the top
			// level OR nested inside authorizeResponse depending on PingOne version.
			const tokenSource = result.access_token ? result : (result.authorizeResponse ?? result);
			const accessToken: string = tokenSource.access_token;
			if (!accessToken) {
				throw new Error(
					`Token not found in resume response. Got keys: ${Object.keys(result).join(', ')}`
				);
			}

			PingOneLoginService.clearFlowParams(flowId);

			logger.info(`${MODULE_TAG} pi.flow resumed — tokens received`, {
				flowId,
				hasAccessToken: true,
				hasIdToken: !!tokenSource.id_token,
				scope: tokenSource.scope,
			});

			return {
				success: true,
				data: {
					access_token: accessToken,
					id_token: tokenSource.id_token,
					token_type: tokenSource.token_type || 'Bearer',
					expires_in: tokenSource.expires_in ?? 3600,
					scope: tokenSource.scope || '',
				},
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: `resume-${Date.now()}`,
					processingTime: 0,
				},
			};
		} catch (error) {
			logger.error(MODULE_TAG, 'Failed to resume pi.flow:', undefined, error as Error);

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
			logger.info(`${MODULE_TAG} Exchanging authorization code for tokens`, 'Logger info');

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

			logger.info(`${MODULE_TAG} Token exchange successful`, {
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
			logger.error(MODULE_TAG, 'Failed to exchange code for tokens:', undefined, error as Error);

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
	// FLOW PARAMS (PKCE + session for pi.flow)
	// ============================================================================

	private static readonly FLOW_PARAMS_STORE = new Map<
		string,
		{
			codeVerifier: string;
			environmentId: string;
			clientId: string;
			redirectUri: string;
			sessionId: string;
			state: string;
			resumeUrl: string;
			timestamp: number;
		}
	>();

	private static readonly FLOW_PARAMS_TTL = 10 * 60 * 1000; // 10 minutes

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

			logger.info(`${MODULE_TAG} Extracted user claims from ID token:`, {
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
			logger.error(MODULE_TAG, 'Failed to extract user from ID token:', undefined, error as Error);
			throw new Error('Invalid ID token format');
		}
	}

	private static storeFlowParams(
		flowId: string,
		params: {
			codeVerifier: string;
			environmentId: string;
			clientId: string;
			redirectUri: string;
			sessionId: string;
			state: string;
			resumeUrl: string;
		}
	): void {
		PingOneLoginService.FLOW_PARAMS_STORE.set(flowId, {
			...params,
			timestamp: Date.now(),
		});
	}

	private static getFlowParams(flowId: string): {
		codeVerifier: string;
		environmentId: string;
		clientId: string;
		redirectUri: string;
		sessionId: string;
		state: string;
		resumeUrl: string;
	} | null {
		const params = PingOneLoginService.FLOW_PARAMS_STORE.get(flowId);
		if (!params) return null;
		if (Date.now() - params.timestamp > PingOneLoginService.FLOW_PARAMS_TTL) {
			PingOneLoginService.FLOW_PARAMS_STORE.delete(flowId);
			return null;
		}
		return params;
	}

	private static updateFlowParams(
		flowId: string,
		updates: { sessionId?: string; resumeUrl?: string }
	): void {
		const params = PingOneLoginService.FLOW_PARAMS_STORE.get(flowId);
		if (params) {
			if (updates.sessionId) params.sessionId = updates.sessionId;
			if (updates.resumeUrl) params.resumeUrl = updates.resumeUrl;
		}
	}

	private static clearFlowParams(flowId: string): void {
		PingOneLoginService.FLOW_PARAMS_STORE.delete(flowId);
	}

	/** Clean up expired flow parameters */
	static cleanupExpiredFlowParams(): void {
		const now = Date.now();
		for (const [flowId, params] of PingOneLoginService.FLOW_PARAMS_STORE.entries()) {
			if (now - params.timestamp > PingOneLoginService.FLOW_PARAMS_TTL) {
				PingOneLoginService.FLOW_PARAMS_STORE.delete(flowId);
			}
		}
	}

	// ============================================================================
	// PKCE HELPERS
	// ============================================================================

	/** Generate a cryptographically random code verifier (RFC 7636). */
	private static generateCodeVerifier(): string {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		return btoa(String.fromCharCode(...array))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/** Derive S256 code challenge from verifier. */
	private static async generateCodeChallenge(verifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(verifier);
		const digest = await crypto.subtle.digest('SHA-256', data);
		return btoa(String.fromCharCode(...new Uint8Array(digest)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default PingOneLoginService;
