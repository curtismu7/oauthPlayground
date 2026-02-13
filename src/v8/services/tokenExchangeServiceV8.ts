// src/v8/services/tokenExchangeServiceV8.ts
// Token Exchange Phase 1 - Core Service Implementation

import {
	TokenExchangeContext,
	TokenExchangeError,
	TokenExchangeErrorType,
	TokenExchangeParams,
	TokenExchangeResponse,
	TokenValidationResult,
} from '../types/tokenExchangeTypesV8';
import { GlobalEnvironmentService } from './globalEnvironmentService';
import { TokenExchangeConfigServiceV8 } from './tokenExchangeConfigServiceV8';

/**
 * Token Exchange Service V8
 *
 * Core token exchange implementation following RFC 8693
 * Phase 1: Same environment only, admin enablement required
 *
 * SWE-15 Principles:
 * - Single Responsibility: Token exchange logic only
 * - Open/Closed: Extensible for future phases
 * - Interface Segregation: Focused interfaces
 * - Dependency Inversion: Depends on abstractions
 */
export class TokenExchangeServiceV8 {
	private static readonly MODULE_TAG = '[TokenExchangeServiceV8]';

	/**
	 * Execute Token Exchange - RFC 8693 Section 2.1
	 *
	 * @param params Token exchange parameters
	 * @param environmentId Target environment ID
	 * @returns Token exchange response
	 */
	static async exchangeToken(
		params: TokenExchangeParams,
		environmentId: string
	): Promise<TokenExchangeResponse> {
		try {
			console.log(
				`${TokenExchangeServiceV8.MODULE_TAG} Starting token exchange for environment: ${environmentId}`
			);

			// 1. CRITICAL: Validate admin enablement
			if (!(await TokenExchangeConfigServiceV8.isEnabled(environmentId))) {
				throw new TokenExchangeError(
					TokenExchangeErrorType.ADMIN_DISABLED,
					'Token Exchange is not enabled for this environment'
				);
			}

			// 2. CRITICAL: Validate subject token
			const subjectTokenValidation = await TokenExchangeServiceV8.validateToken(
				params.subject_token,
				environmentId
			);
			if (!subjectTokenValidation.isValid) {
				throw new TokenExchangeError(
					TokenExchangeErrorType.INVALID_TOKEN,
					`Invalid subject token: ${subjectTokenValidation.error}`
				);
			}

			// 3. CRITICAL: Validate same environment (Phase 1 requirement)
			if (subjectTokenValidation.environmentId !== environmentId) {
				throw new TokenExchangeError(
					TokenExchangeErrorType.WRONG_ENVIRONMENT,
					'Token must be from the same environment (Phase 1 restriction)'
				);
			}

			// 4. Validate requested token type (Phase 1: access_token only)
			if (params.requested_token_type !== 'urn:ietf:params:oauth:token-type:access_token') {
				throw new TokenExchangeError(
					TokenExchangeErrorType.UNSUPPORTED_TOKEN_TYPE,
					'Only access_token is supported in Phase 1'
				);
			}

			// 5. Validate scopes if provided
			if (params.scope) {
				const requestedScopes = params.scope.split(' ').filter((s) => s.length > 0);
				const scopesValid = await TokenExchangeConfigServiceV8.validateScopes(
					environmentId,
					requestedScopes
				);
				if (!scopesValid) {
					throw new TokenExchangeError(
						TokenExchangeErrorType.INVALID_SCOPE,
						'Requested scopes are not allowed'
					);
				}
			}

			// 6. Validate actor token if provided
			if (params.actor_token) {
				const actorTokenValidation = await TokenExchangeServiceV8.validateToken(
					params.actor_token,
					environmentId
				);
				if (!actorTokenValidation.isValid) {
					throw new TokenExchangeError(
						TokenExchangeErrorType.INVALID_TOKEN,
						`Invalid actor token: ${actorTokenValidation.error}`
					);
				}
			}

			// 7. Execute token exchange with PingOne
			const response = await TokenExchangeServiceV8.executeTokenExchangeWithPingOne(
				params,
				environmentId
			);

			console.log(`${TokenExchangeServiceV8.MODULE_TAG} Token exchange completed successfully`);
			return response;
		} catch (error) {
			console.error(`${TokenExchangeServiceV8.MODULE_TAG} Token exchange failed:`, error);
			if (error instanceof TokenExchangeError) {
				throw error;
			}
			throw new TokenExchangeError(
				TokenExchangeErrorType.SERVER_ERROR,
				`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Validate token and extract information
	 */
	static async validateToken(
		token: string,
		expectedEnvironmentId: string
	): Promise<TokenValidationResult> {
		try {
			console.log(
				`${TokenExchangeServiceV8.MODULE_TAG} Validating token for environment: ${expectedEnvironmentId}`
			);

			// TODO: Implement actual token validation with PingOne
			// For now, simulate token validation

			// Parse JWT token (simplified)
			const tokenParts = token.split('.');
			if (tokenParts.length !== 3) {
				return {
					isValid: false,
					environmentId: '',
					tokenType: 'access_token',
					error: 'Invalid token format',
				};
			}

			// Decode payload (simplified - in production use proper JWT library)
			const payload = JSON.parse(atob(tokenParts[1]));

			// Check expiration
			if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
				return {
					isValid: false,
					environmentId: '',
					tokenType: 'access_token',
					error: 'Token expired',
				};
			}

			// Extract environment ID from token
			const tokenEnvironmentId = payload.env_id || payload.environmentId || expectedEnvironmentId;

			// Determine token type based on claims
			const tokenType = payload.client_id ? 'access_token' : 'id_token';

			const result: TokenValidationResult = {
				isValid: true,
				environmentId: tokenEnvironmentId,
				tokenType,
				expiresAt: payload.exp,
				subject: payload.sub,
				audience: payload.aud ? (Array.isArray(payload.aud) ? payload.aud : [payload.aud]) : [],
				issuer: payload.iss,
			};

			console.log(`${TokenExchangeServiceV8.MODULE_TAG} Token validation successful:`, result);
			return result;
		} catch (error) {
			console.error(`${TokenExchangeServiceV8.MODULE_TAG} Token validation error:`, error);
			return {
				isValid: false,
				environmentId: '',
				tokenType: 'access_token',
				error: error instanceof Error ? error.message : 'Validation failed',
			};
		}
	}

	/**
	 * Execute token exchange with PingOne API
	 */
	private static async executeTokenExchangeWithPingOne(
		params: TokenExchangeParams,
		environmentId: string
	): Promise<TokenExchangeResponse> {
		try {
			console.log(`${TokenExchangeServiceV8.MODULE_TAG} Executing token exchange with PingOne`);

			// TODO: Implement actual PingOne token exchange API call
			// For now, simulate successful response

			// Get current environment for API endpoint
			const currentEnvId = GlobalEnvironmentService.getInstance().getEnvironmentId();
			if (!currentEnvId) {
				throw new Error(`No current environment configured`);
			}

			// Build token exchange request
			const requestBody = {
				grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subject_token: params.subject_token,
				subject_token_type: params.subject_token_type,
				requested_token_type: params.requested_token_type,
				...(params.scope && { scope: params.scope }),
				...(params.actor_token && { actor_token: params.actor_token }),
				...(params.actor_token_type && { actor_token_type: params.actor_token_type }),
				...(params.resource && { resource: params.resource }),
				...(params.audience && { audience: params.audience }),
			};

			console.log(`${TokenExchangeServiceV8.MODULE_TAG} Token exchange request:`, {
				...requestBody,
				subject_token: '[REDACTED]',
				...(params.actor_token && { actor_token: '[REDACTED]' }),
			});

			// TODO: Make actual API call to PingOne token endpoint
			// const response = await fetch(`${env.apiUrl}/oauth2/token`, {
			//   method: 'POST',
			//   headers: {
			//     'Content-Type': 'application/x-www-form-urlencoded',
			//     'Authorization': `Bearer ${env.clientSecret}`
			//   },
			//   body: new URLSearchParams(requestBody).toString()
			// });

			// Simulate successful response
			const response: TokenExchangeResponse = {
				access_token: TokenExchangeServiceV8.generateMockAccessToken(environmentId),
				token_type: 'Bearer',
				expires_in: 3600,
				scope: params.scope || 'read',
				issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
			};

			console.log(`${TokenExchangeServiceV8.MODULE_TAG} Token exchange response received:`, {
				...response,
				access_token: '[REDACTED]',
			});

			return response;
		} catch (error) {
			console.error(`${TokenExchangeServiceV8.MODULE_TAG} PingOne API error:`, error);
			throw new TokenExchangeError(
				TokenExchangeErrorType.SERVER_ERROR,
				`PingOne API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Generate mock access token for testing
	 * TODO: Remove when actual PingOne integration is implemented
	 */
	private static generateMockAccessToken(environmentId: string): string {
		const header = { alg: 'HS256', typ: 'JWT' };
		const payload = {
			env_id: environmentId,
			sub: 'token-exchange-user',
			aud: ['resource-server'],
			iss: `https://auth.pingone.com/${environmentId}/oauth2`,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
			scope: 'read',
			grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
		};

		return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.mock-signature`;
	}

	/**
	 * Build token exchange context for PingOne expressions
	 */
	static buildTokenExchangeContext(
		params: TokenExchangeParams,
		environmentId: string
	): TokenExchangeContext {
		// Parse subject token claims (simplified)
		let subjectTokenClaims = {};
		try {
			const tokenParts = params.subject_token.split('.');
			if (tokenParts.length === 3) {
				subjectTokenClaims = JSON.parse(atob(tokenParts[1]));
			}
		} catch (error) {
			console.warn(
				`${TokenExchangeServiceV8.MODULE_TAG} Failed to parse subject token claims:`,
				error
			);
		}

		// Parse actor token claims if provided
		let actorTokenClaims = {};
		if (params.actor_token) {
			try {
				const tokenParts = params.actor_token.split('.');
				if (tokenParts.length === 3) {
					actorTokenClaims = JSON.parse(atob(tokenParts[1]));
				}
			} catch (error) {
				console.warn(
					`${TokenExchangeServiceV8.MODULE_TAG} Failed to parse actor token claims:`,
					error
				);
			}
		}

		return {
			requestData: {
				grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
				subjectToken: subjectTokenClaims,
				subjectTokenType: params.subject_token_type,
				requestedTokenType: params.requested_token_type,
				...(params.scope && { scope: params.scope }),
				...(params.actor_token && { actorToken: actorTokenClaims }),
				...(params.actor_token_type && { actorTokenType: params.actor_token_type }),
				...(params.resource && { resource: params.resource }),
				...(params.audience && {
					audience: Array.isArray(params.audience) ? params.audience : [params.audience],
				}),
			},
			appConfig: {
				clientId: 'token-exchange-client',
				tokenEndpointAuthMethod: 'client_secret_basic',
				envId: environmentId,
				orgId: 'demo-org',
			},
		};
	}
}
