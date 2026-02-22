/**
 * @file unifiedTokenService.ts
 * @module shared/services
 * @description Unified Token Service - Canonical service for all token operations
 * @version 1.0.0
 * @since 2025-02-19
 *
 * This is the canonical service for all token operations across the application.
 * It consolidates functionality from:
 * - tokenMonitoringService (OAuth app)
 * - tokenOperationsServiceV8 (Shared)
 * - tokenManagementService (Legacy)
 *
 * Features:
 * - Token lifecycle management (get, set, refresh, remove)
 * - Token monitoring and status tracking
 * - Token validation and introspection
 * - Token operation rules and permissions
 * - API call tracking and logging
 *
 * @example
 * import { unifiedTokenService } from '@/shared/services/unifiedTokenService';
 * const token = await unifiedTokenService.getToken('access_token');
 * const status = await unifiedTokenService.getTokenStatus('access_token');
 */

import { apiCallTrackerService } from '../../services/apiCallTrackerService';
import type { UnifiedToken } from '../../services/unifiedTokenStorageService';
import { unifiedTokenStorage } from '../../services/unifiedTokenStorageService';
import { pingOneFetch } from '../../utils/pingOneFetch';

const MODULE_TAG = '[🔑 UNIFIED-TOKEN-SERVICE]';

// ========================================
// INTERFACES
// ========================================

export interface TokenData extends UnifiedToken {
	// Additional properties for our service
	status: 'active' | 'expiring' | 'expired' | 'error';
	introspectionData: Record<string, unknown> | null;
	isVisible: boolean;
}

export interface TokenStatus {
	isValid: boolean;
	expiresAt: number | null;
	timeToExpiry: number | null; // milliseconds
	status: 'active' | 'expiring' | 'expired' | 'error';
	lastChecked: number;
	introspectionData: Record<string, unknown> | null;
}

export interface TokenOperationRules {
	// Introspection
	canIntrospectAccessToken: boolean;
	canIntrospectRefreshToken: boolean;
	canIntrospectIdToken: boolean;

	// UserInfo
	canCallUserInfo: boolean;

	// Reasons (for educational purposes)
	introspectionReason: string;
	userInfoReason: string;

	// Educational content
	introspectionExplanation: string;
	userInfoExplanation: string;
}

export interface TokenRequest {
	grantType:
		| 'authorization_code'
		| 'refresh_token'
		| 'client_credentials'
		| 'urn:ietf:params:oauth:grant-type:token-exchange';
	code?: string;
	refreshToken?: string;
	redirectUri?: string;
	scope?: string;
	clientId: string;
	clientSecret?: string;
	environmentId: string;
	audience?: string;
	subjectToken?: string;
	subjectTokenType?: string;
	actorToken?: string;
	actorTokenType?: string;
	requestedTokenType?: string;
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
	refresh_token?: string;
	id_token?: string;
	issued_token_type?: string;
}

export interface ApiCall {
	id: string;
	timestamp: number;
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: string;
	response: {
		status: number;
		statusText: string;
		headers: Record<string, string>;
		body?: string;
	};
	duration: number;
	type: 'oauth_revoke' | 'sso_signoff' | 'session_delete' | 'introspect' | 'worker_refresh';
	success: boolean;
}

// ========================================
// CANONICAL SERVICE
// ========================================

/**
 * Unified Token Service - Canonical service for all token operations
 *
 * This service provides a unified interface for all token-related operations
 * across the application, consolidating functionality from multiple legacy services.
 */
export class UnifiedTokenService {
	private static instance: UnifiedTokenService;
	private config = {
		refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
		pollingInterval: 30 * 1000, // 30 seconds
		enableNotifications: true,
		enableApiLogging: true,
	};

	private constructor() {}

	/**
	 * Get singleton instance
	 */
	static getInstance(): UnifiedTokenService {
		if (!UnifiedTokenService.instance) {
			UnifiedTokenService.instance = new UnifiedTokenService();
		}
		return UnifiedTokenService.instance;
	}

	// ========================================
	// CORE TOKEN OPERATIONS
	// ========================================

	/**
	 * Get token by type and optional ID
	 */
	async getToken(
		type: 'access_token' | 'refresh_token' | 'id_token' | 'worker_token',
		tokenId?: string
	): Promise<TokenData | null> {
		console.log(`${MODULE_TAG} Getting token`, { type, tokenId });

		try {
			// Use unified token storage for persistence
			const storageResult = await unifiedTokenStorage.getTokens();

			if (!storageResult.success || !storageResult.data) {
				console.log(`${MODULE_TAG} Failed to get tokens from storage`);
				return null;
			}

			const tokens = storageResult.data;
			const token = tokens.find(
				(t: UnifiedToken) => t.type === type && (!tokenId || t.id === tokenId)
			);

			if (!token) {
				console.log(`${MODULE_TAG} Token not found`);
				return null;
			}

			// Check if token is expired
			if (token.expiresAt && token.expiresAt < Date.now()) {
				// Update status in storage
				await unifiedTokenStorage.deleteToken(token.id);
				return null; // Return null for expired tokens
			}

			// Convert UnifiedToken to TokenData with additional properties
			const tokenData: TokenData = {
				...token,
				status: 'active',
				introspectionData: null,
				isVisible: true,
			};

			return tokenData;
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting token:`, error);
			return null;
		}
	}

	/**
	 * Save/update token
	 */
	async setToken(token: TokenData): Promise<void> {
		console.log(`${MODULE_TAG} Saving token`, {
			id: token.id,
			type: token.type,
			status: token.status,
		});

		try {
			// Set default values
			token.issuedAt = token.issuedAt || Date.now();
			token.isVisible = token.isVisible !== false;

			// Save to unified storage
			await unifiedTokenStorage.saveToken(token);

			console.log(`${MODULE_TAG} ✅ Token saved successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Error saving token:`, error);
			throw error;
		}
	}

	/**
	 * Remove token
	 */
	async removeToken(
		type: 'access_token' | 'refresh_token' | 'id_token' | 'worker_token',
		tokenId?: string
	): Promise<void> {
		console.log(`${MODULE_TAG} Removing token`, { type, tokenId });

		try {
			await unifiedTokenStorage.removeToken(type, tokenId);
			console.log(`${MODULE_TAG} ✅ Token removed successfully`);
		} catch (error) {
			console.error(`${MODULE_TAG} Error removing token:`, error);
			throw error;
		}
	}

	/**
	 * Get all tokens
	 */
	async getAllTokens(): Promise<TokenData[]> {
		try {
			const tokens = await unifiedTokenStorage.getTokens();

			// Update status for expired tokens
			const now = Date.now();
			for (const token of tokens) {
				if (token.expiresAt && token.expiresAt < now) {
					token.status = 'expired';
				}
			}

			return tokens;
		} catch (error) {
			console.error(`${MODULE_TAG} Error getting all tokens:`, error);
			return [];
		}
	}

	// ========================================
	// TOKEN MONITORING
	// ========================================

	/**
	 * Get token status
	 */
	async getTokenStatus(
		type: 'access_token' | 'refresh_token' | 'id_token' | 'worker_token',
		tokenId?: string
	): Promise<TokenStatus | null> {
		const token = await this.getToken(type, tokenId);

		if (!token) {
			return null;
		}

		const now = Date.now();
		const timeToExpiry = token.expiresAt ? token.expiresAt - now : null;

		return {
			isValid: token.status === 'active',
			expiresAt: token.expiresAt,
			timeToExpiry,
			status: token.status,
			lastChecked: now,
			introspectionData: token.introspectionData,
		};
	}

	/**
	 * Refresh token if needed
	 */
	async refreshToken(
		type: 'access_token' | 'refresh_token',
		tokenId?: string
	): Promise<TokenData | null> {
		console.log(`${MODULE_TAG} Refreshing token`, { type, tokenId });

		try {
			const token = await this.getToken(type, tokenId);

			if (!token) {
				throw new Error('Token not found for refresh');
			}

			// Check if token needs refresh
			if (token.expiresAt && token.expiresAt > Date.now() + this.config.refreshThreshold) {
				console.log(`${MODULE_TAG} Token does not need refresh yet`);
				return token;
			}

			// Implement refresh logic based on token type
			if (type === 'access_token' && token.environmentId) {
				// Use refresh token to get new access token
				const refreshToken = await this.getToken('refresh_token');

				if (refreshToken) {
					const newToken = await this.exchangeToken({
						grantType: 'refresh_token',
						refreshToken: refreshToken.value,
						environmentId: token.environmentId,
						clientId: token.environmentId, // This should come from stored credentials
					});

					await this.setToken(newToken);
					return newToken;
				}
			}

			throw new Error('Cannot refresh token: no refresh mechanism available');
		} catch (error) {
			console.error(`${MODULE_TAG} Error refreshing token:`, error);
			return null;
		}
	}

	// ========================================
	// TOKEN VALIDATION
	// ========================================

	/**
	 * Validate token format and structure
	 */
	validateToken(token: string): boolean {
		if (!token || typeof token !== 'string') {
			return false;
		}

		// Check JWT format (3 parts separated by dots)
		const parts = token.split('.');
		if (parts.length !== 3) {
			return false;
		}

		// Try to decode payload
		try {
			const payload = JSON.parse(atob(parts[1]));

			// Check for required claims
			if (!payload.exp || !payload.iat) {
				return false;
			}

			// Check expiration
			const now = Math.floor(Date.now() / 1000);
			if (payload.exp < now) {
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Introspect token
	 */
	async introspectToken(
		token: string,
		environmentId: string,
		clientId: string,
		clientSecret?: string
	): Promise<Record<string, unknown> | null> {
		console.log(`${MODULE_TAG} Introspecting token`);

		try {
			// Get worker token for API call
			const workerToken = await this.getToken('worker_token');
			if (!workerToken) {
				throw new Error('Worker token required for introspection');
			}

			const response = await pingOneFetch(
				`https://api.pingone.com/v1/environments/${environmentId}/as/introspect`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Bearer ${workerToken.value}`,
					},
					body: new URLSearchParams({
						token,
						client_id: clientId,
						...(clientSecret && { client_secret: clientSecret }),
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`Introspection failed: ${response.status}`);
			}

			const result = await response.json();
			console.log(`${MODULE_TAG} ✅ Token introspected successfully`);

			return result;
		} catch (error) {
			console.error(`${MODULE_TAG} Error introspecting token:`, error);
			return null;
		}
	}

	// ========================================
	// TOKEN OPERATION RULES
	// ========================================

	/**
	 * Get token operation rules for a flow
	 */
	getOperationRules(flowType: string, scopes?: string): TokenOperationRules {
		const normalizedFlow = flowType.toLowerCase().replace(/[-_]/g, '-');
		const hasOpenIdScope = scopes?.toLowerCase().includes('openid') || false;

		console.log(`${MODULE_TAG} Getting operation rules`, {
			flowType,
			normalizedFlow,
			hasOpenIdScope,
		});

		// Define rules based on flow type and scopes
		const rules: TokenOperationRules = {
			canIntrospectAccessToken: false,
			canIntrospectRefreshToken: false,
			canIntrospectIdToken: false,
			canCallUserInfo: false,
			introspectionReason: '',
			userInfoReason: '',
			introspectionExplanation: '',
			userInfoExplanation: '',
		};

		// Set rules based on flow type
		switch (normalizedFlow) {
			case 'oauth-authz':
			case 'authorization-code':
				rules.canIntrospectAccessToken = true;
				rules.canIntrospectRefreshToken = true;
				rules.canIntrospectIdToken = hasOpenIdScope;
				rules.canCallUserInfo = hasOpenIdScope;
				rules.introspectionReason =
					'Authorization Code flows support token introspection for both access and refresh tokens';
				rules.userInfoReason = hasOpenIdScope
					? 'OIDC UserInfo endpoint available with openid scope'
					: 'UserInfo endpoint requires openid scope';
				break;

			case 'client-credentials':
				rules.canIntrospectAccessToken = true;
				rules.canIntrospectRefreshToken = false;
				rules.canIntrospectIdToken = false;
				rules.canCallUserInfo = false;
				rules.introspectionReason = 'Client Credentials flow supports access token introspection';
				rules.userInfoReason = 'UserInfo endpoint not available for client credentials';
				break;

			case 'implicit':
				rules.canIntrospectAccessToken = true;
				rules.canIntrospectRefreshToken = false;
				rules.canIntrospectIdToken = hasOpenIdScope;
				rules.canCallUserInfo = hasOpenIdScope;
				rules.introspectionReason = 'Implicit flow supports access token introspection';
				rules.userInfoReason = hasOpenIdScope
					? 'OIDC UserInfo endpoint available with openid scope'
					: 'UserInfo endpoint requires openid scope';
				break;

			default:
				rules.introspectionReason = 'Unknown flow type - introspection not supported';
				rules.userInfoReason = 'Unknown flow type - UserInfo not supported';
		}

		// Set educational explanations
		rules.introspectionExplanation = this.getIntrospectionExplanation(normalizedFlow);
		rules.userInfoExplanation = this.getUserInfoExplanation(normalizedFlow, hasOpenIdScope);

		return rules;
	}

	private getIntrospectionExplanation(flowType: string): string {
		switch (flowType) {
			case 'oauth-authz':
			case 'authorization-code':
				return 'Token introspection (RFC 7662) allows resource servers to validate access tokens and get metadata about them. In Authorization Code flows, both access and refresh tokens can be introspected to check their validity and expiration.';
			case 'client-credentials':
				return 'Client Credentials flow tokens can be introspected to validate their scope and expiration. However, refresh tokens are not used in this flow.';
			case 'implicit':
				return 'Implicit flow tokens can be introspected, but this flow does not use refresh tokens for security reasons.';
			default:
				return 'Token introspection is not supported for this flow type.';
		}
	}

	private getUserInfoExplanation(flowType: string, hasOpenIdScope: boolean): string {
		if (!hasOpenIdScope) {
			return 'The UserInfo endpoint is an OIDC feature that requires the "openid" scope. Without this scope, the endpoint cannot be accessed.';
		}

		switch (flowType) {
			case 'oauth-authz':
			case 'authorization-code':
				return 'The OIDC UserInfo endpoint returns claims about the authenticated user. This is available in Authorization Code flows when the openid scope is requested.';
			case 'implicit':
				return 'The OIDC UserInfo endpoint is available in Implicit flows with the openid scope, though this flow is less recommended due to security concerns.';
			case 'client-credentials':
				return 'The UserInfo endpoint is not applicable to Client Credentials flow as there is no user authentication involved.';
			default:
				return 'UserInfo endpoint access is not supported for this flow type.';
		}
	}

	// ========================================
	// TOKEN EXCHANGE
	// ========================================

	/**
	 * Exchange token for new token
	 */
	async exchangeToken(request: TokenRequest): Promise<TokenData> {
		console.log(`${MODULE_TAG} Exchanging token`, {
			grantType: request.grantType,
			environmentId: request.environmentId,
		});

		try {
			// Get worker token for API call
			const workerToken = await this.getToken('worker_token');
			if (!workerToken) {
				throw new Error('Worker token required for token exchange');
			}

			// Build token endpoint URL
			const tokenEndpoint = `https://auth.pingone.com/${this.getRegion(request.environmentId)}/${request.environmentId}/as/token`;

			// Prepare request body
			const body = new URLSearchParams({
				grant_type: request.grantType,
				client_id: request.clientId,
				...(request.clientSecret && { client_secret: request.clientSecret }),
				...(request.code && { code: request.code }),
				...(request.refreshToken && { refresh_token: request.refreshToken }),
				...(request.redirectUri && { redirect_uri: request.redirectUri }),
				...(request.scope && { scope: request.scope }),
				...(request.audience && { audience: request.audience }),
			});

			// Track API call
			const startTime = Date.now();

			const response = await pingOneFetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization: `Bearer ${workerToken.value}`,
				},
				body,
			});

			// Track the API call
			apiCallTrackerService.trackApiCall(
				'POST',
				`/as/token`,
				Date.now() - startTime,
				response.status
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
			}

			const tokenResponse: TokenResponse = await response.json();

			// Convert to TokenData
			const tokenData: TokenData = {
				id: `${request.grantType}_${Date.now()}`,
				type: 'access_token',
				value: tokenResponse.access_token,
				expiresAt: tokenResponse.expires_in ? Date.now() + tokenResponse.expires_in * 1000 : null,
				issuedAt: Date.now(),
				scope: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
				status: 'active',
				introspectionData: null,
				isVisible: true,
				source: 'oauth_flow',
				environmentId: request.environmentId,
			};

			// Save refresh token if present
			if (tokenResponse.refresh_token) {
				const refreshTokenData: TokenData = {
					id: `refresh_${Date.now()}`,
					type: 'refresh_token',
					value: tokenResponse.refresh_token,
					expiresAt: null, // Refresh tokens typically don't expire
					issuedAt: Date.now(),
					scope: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
					status: 'active',
					introspectionData: null,
					isVisible: false, // Refresh tokens are usually hidden
					source: 'oauth_flow',
					environmentId: request.environmentId,
				};

				await this.setToken(refreshTokenData);
			}

			// Save ID token if present
			if (tokenResponse.id_token) {
				const idTokenData: TokenData = {
					id: `id_${Date.now()}`,
					type: 'id_token',
					value: tokenResponse.id_token,
					expiresAt: tokenData.expiresAt, // ID token expires with access token
					issuedAt: Date.now(),
					scope: ['openid'],
					status: 'active',
					introspectionData: null,
					isVisible: true,
					source: 'oauth_flow',
					environmentId: request.environmentId,
				};

				await this.setToken(idTokenData);
			}

			console.log(`${MODULE_TAG} ✅ Token exchanged successfully`);
			return tokenData;
		} catch (error) {
			console.error(`${MODULE_TAG} Error exchanging token:`, error);
			throw error;
		}
	}

	// ========================================
	// API CALL TRACKING
	// ========================================

	/**
	 * Get API call history
	 */
	getApiCalls(): ApiCall[] {
		return apiCallTrackerService.getApiCalls();
	}

	/**
	 * Clear API call history
	 */
	clearApiCalls(): void {
		apiCallTrackerService.clearApiCalls();
	}

	// ========================================
	// UTILITY METHODS
	// ========================================

	/**
	 * Get region from environment ID
	 */
	private getRegion(_environmentId: string): string {
		// Extract region from environment ID or use default
		// This is a simplified implementation - in reality, this would be more complex
		return 'us'; // Default to US region
	}

	/**
	 * Clear all tokens
	 */
	async clearAllTokens(): Promise<void> {
		console.log(`${MODULE_TAG} Clearing all tokens`);

		try {
			await unifiedTokenStorage.clearAllTokens();
			console.log(`${MODULE_TAG} ✅ All tokens cleared`);
		} catch (error) {
			console.error(`${MODULE_TAG} Error clearing tokens:`, error);
			throw error;
		}
	}
}

// ========================================
// EXPORTS
// ========================================

// Export singleton instance for easy use
export const unifiedTokenService = UnifiedTokenService.getInstance();

// Export types for consumers
export type { TokenData, TokenStatus, TokenOperationRules, TokenRequest, TokenResponse, ApiCall };

export default UnifiedTokenService;
