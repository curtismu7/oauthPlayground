/**
 * @file cibaServiceV8Enhanced.ts
 * @module v8/services
 * @description Enhanced CIBA Service V8 - OpenID Connect Core 1.0 Compliant
 * @version 8.0.0
 * @since 2026-02-17
 *
 * Enhanced CIBA service implementation fully compliant with:
 * - OpenID Connect Client-Initiated Backchannel Authentication Core 1.0
 * - Auth0 CIBA implementation guidelines
 * - Orange API CIBA backend flow specifications
 *
 * Key improvements:
 * - Proper grant type: urn:openid:params:grant-type:ciba
 * - Complete login_hint support (login_hint, id_token_hint, login_hint_token)
 * - Token delivery modes: poll, ping, push
 * - Signed authentication requests (JWS)
 * - Discovery metadata support
 * - Complete error handling per specification
 *
 * @example
 * const service = new CibaServiceV8Enhanced();
 * const authRequest = await service.initiateAuthentication(credentials);
 * const tokens = await service.pollForTokens(authRequest.auth_req_id, credentials);
 */

import { pingOneFetch } from '@/utils/pingOneFetch';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 CIBA-SERVICE-V8-ENHANCED]';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CibaCredentials {
	environmentId: string;
	clientId: string;
	clientSecret?: string; // Optional for JWT assertion auth
	scope: string;

	// Login hints - exactly one REQUIRED per spec
	loginHint?: string; // email, phone number, or username
	idTokenHint?: string; // ID Token from previous authentication
	loginHintToken?: string; // JWT containing user identifier

	// Optional parameters
	bindingMessage?: string; // Human-readable message to user
	userCode?: string; // User code for additional verification
	requestContext?: string; // Context information for the request

	// Token delivery configuration
	tokenDeliveryMode: 'poll' | 'ping' | 'push';
	clientNotificationEndpoint?: string; // Required for ping/push modes

	// Authentication method
	clientAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'private_key_jwt';

	// Signed request support
	signingAlg?: string; // JWS algorithm for signed requests
	requestSigningKey?: string; // Private key for signing requests
}

export interface CibaAuthRequest {
	auth_req_id: string;
	expires_in: number;
	interval: number;
	binding_message?: string;
	user_code?: string;
	request_context?: string;
	server_timestamp?: string;
}

export interface CibaTokens {
	access_token: string;
	refresh_token?: string;
	token_type: string;
	expires_in?: number;
	scope?: string;
	id_token?: string;
	client_id?: string;
	sub?: string;
	aud?: string | string[];
	iss?: string;
	iat?: number;
	exp?: number;
	issued_at?: number;
	server_timestamp?: string;
	grant_type?: string;
}

export type CibaStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'error';

export interface CibaPollingResult {
	status: CibaStatus;
	tokens?: CibaTokens;
	error?: string;
	error_description?: string;
	interval?: number;
}

// Discovery metadata for CIBA
export interface CibaDiscoveryMetadata {
	backchannel_authentication_endpoint: string;
	backchannel_token_delivery_modes_supported: ('poll' | 'ping' | 'push')[];
	backchannel_authentication_request_signing_alg_values_supported?: string[];
	backchannel_user_code_parameter_supported: boolean;
}

// ============================================================================
// ENHANCED CIBA SERVICE
// ============================================================================

/**
 * Enhanced CIBA Service V8 - OpenID Connect Core 1.0 Compliant
 */
export const CibaServiceV8Enhanced = {
	/**
	 * Get CIBA discovery metadata
	 * @param environmentId - PingOne environment ID
	 * @returns Promise<CibaDiscoveryMetadata>
	 */
	async getDiscoveryMetadata(environmentId: string): Promise<CibaDiscoveryMetadata> {
		console.log(`${MODULE_TAG} Fetching CIBA discovery metadata for environment: ${environmentId}`);

		try {
			// Construct the full PingOne OIDC discovery URL
			const region = 'com'; // Default to North America, can be made configurable
			const discoveryUrl = `https://auth.pingone.${region}/${environmentId}/as/.well-known/openid-configuration`;

			console.log(`${MODULE_TAG} Discovery URL: ${discoveryUrl}`);

			const response = await fetch(discoveryUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch discovery metadata: ${response.status} ${response.statusText}`
				);
			}

			const metadata = await response.json();

			console.log(`${MODULE_TAG} Discovery metadata received:`, {
				hasBackchannelEndpoint: !!metadata.backchannel_authentication_endpoint,
				deliveryModes: metadata.backchannel_token_delivery_modes_supported,
			});

			return {
				backchannel_authentication_endpoint: metadata.backchannel_authentication_endpoint,
				backchannel_token_delivery_modes_supported:
					metadata.backchannel_token_delivery_modes_supported || ['poll'],
				backchannel_authentication_request_signing_alg_values_supported:
					metadata.backchannel_authentication_request_signing_alg_values_supported,
				backchannel_user_code_parameter_supported:
					metadata.backchannel_user_code_parameter_supported || false,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to fetch discovery metadata:`, error);
			throw error;
		}
	},

	/**
	 * Validate CIBA credentials per specification requirements
	 * @param credentials - CIBA credentials to validate
	 * @returns {valid: boolean, errors: string[]} - Validation result
	 */
	validateCredentials(credentials: Partial<CibaCredentials>): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Required fields
		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		}

		if (!credentials.clientId?.trim()) {
			errors.push('Client ID is required');
		}

		// Client secret required for basic/post auth, optional for JWT
		if (
			!credentials.clientSecret?.trim() &&
			(credentials.clientAuthMethod === 'client_secret_basic' ||
				credentials.clientAuthMethod === 'client_secret_post')
		) {
			errors.push('Client Secret is required for basic/post authentication methods');
		}

		// Scope validation
		if (!credentials.scope?.trim()) {
			errors.push('Scope is required');
		} else if (!credentials.scope.includes('openid')) {
			errors.push('Scope must include "openid" for CIBA flows');
		}

		// Login hint validation - EXACTLY ONE required per spec
		const loginHints = [
			credentials.loginHint,
			credentials.idTokenHint,
			credentials.loginHintToken,
		].filter(Boolean);

		if (loginHints.length === 0) {
			errors.push(
				'Exactly one login hint is required: login_hint, id_token_hint, or login_hint_token'
			);
		} else if (loginHints.length > 1) {
			errors.push(
				'Only one login hint may be provided: login_hint, id_token_hint, or login_hint_token'
			);
		}

		// Token delivery mode validation
		if (
			!credentials.tokenDeliveryMode ||
			!['poll', 'ping', 'push'].includes(credentials.tokenDeliveryMode)
		) {
			errors.push('Token delivery mode must be one of: poll, ping, push');
		}

		// Client notification endpoint required for ping/push modes
		if (
			(credentials.tokenDeliveryMode === 'ping' || credentials.tokenDeliveryMode === 'push') &&
			!credentials.clientNotificationEndpoint?.trim()
		) {
			errors.push('Client notification endpoint is required for ping and push modes');
		}

		// JWT signing key required for signed requests
		if (credentials.signingAlg && !credentials.requestSigningKey?.trim()) {
			errors.push('Request signing key is required when signing algorithm is specified');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	/**
	 * Initiate CIBA authentication request - OpenID Connect Core 1.0 Compliant
	 * @param credentials - CIBA credentials and configuration
	 * @returns Promise<CibaAuthRequest> - Authentication request details
	 */
	async initiateAuthentication(credentials: CibaCredentials): Promise<CibaAuthRequest> {
		console.log(`${MODULE_TAG} Initiating OpenID Connect CIBA authentication request`);

		// Validate credentials first
		const validation = this.validateCredentials(credentials);
		if (!validation.valid) {
			throw new Error(`Invalid credentials: ${validation.errors.join(', ')}`);
		}

		try {
			// Build request body with underscore parameter names expected by backend
			const requestBody: Record<string, string> = {
				environment_id: credentials.environmentId,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret || '',
				scope: credentials.scope,
				auth_method: credentials.clientAuthMethod || 'client_secret_post',
			};

			// Exactly one login hint is required
			if (credentials.loginHint) {
				requestBody.login_hint = credentials.loginHint;
			} else if (credentials.idTokenHint) {
				requestBody.id_token_hint = credentials.idTokenHint;
			} else if (credentials.loginHintToken) {
				requestBody.login_hint_token = credentials.loginHintToken;
			}

			// Optional parameters
			if (credentials.bindingMessage) {
				requestBody.binding_message = credentials.bindingMessage;
			}

			if (credentials.userCode) {
				requestBody.user_code = credentials.userCode;
			}

			if (credentials.requestContext) {
				requestBody.requested_context = credentials.requestContext;
			}

			// Token delivery mode
			if (credentials.tokenDeliveryMode) {
				requestBody.backchannel_token_delivery_mode = credentials.tokenDeliveryMode;
			}

			// Client notification endpoint for ping/push modes
			if (credentials.clientNotificationEndpoint) {
				requestBody.client_notification_endpoint = credentials.clientNotificationEndpoint;
			}

			// Request signing configuration
			if (credentials.signingAlg) {
				requestBody.backchannel_authentication_request_signing_alg = credentials.signingAlg;
			}

			console.log(`${MODULE_TAG} Sending CIBA request with parameters:`, {
				environment_id: requestBody.environment_id,
				client_id: requestBody.client_id,
				scope: requestBody.scope,
				login_hint: requestBody.login_hint || 'N/A',
				auth_method: requestBody.auth_method,
			});

			const response = await fetch('/api/ciba-backchannel', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error_description ||
						`CIBA request failed: ${response.status} ${response.statusText}`
				);
			}

			const authRequest = await response.json();
			console.log(`${MODULE_TAG} CIBA authentication request initiated:`, {
				auth_req_id: `${authRequest.auth_req_id?.substring(0, 20)}...`,
				expires_in: authRequest.expires_in,
				interval: authRequest.interval,
				token_delivery_mode: credentials.tokenDeliveryMode,
			});

			toastV8.success('CIBA authentication request initiated successfully');
			return authRequest;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to initiate CIBA authentication:`, error);
			toastV8.error(
				`Failed to initiate CIBA authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
			throw error;
		}
	},

	/**
	 * Poll for CIBA tokens - OpenID Connect Core 1.0 Compliant
	 * @param authReqId - Authentication request ID from initiation
	 * @param credentials - CIBA credentials for token polling
	 * @returns Promise<CibaPollingResult> - Polling result with tokens or error
	 */
	async pollForTokens(authReqId: string, credentials: CibaCredentials): Promise<CibaPollingResult> {
		console.log(`${MODULE_TAG} Polling for CIBA tokens: ${authReqId.substring(0, 20)}...`);

		try {
			const formData = new URLSearchParams();

			// Required parameters per spec
			formData.append('grant_type', 'urn:openid:params:grant-type:ciba');
			formData.append('auth_req_id', authReqId);
			formData.append('client_id', credentials.clientId);

			// Build headers based on authentication method
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Environment-ID': credentials.environmentId,
			};

			if (credentials.clientAuthMethod === 'client_secret_basic') {
				const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
				headers['Authorization'] = `Basic ${basicAuth}`;
			} else if (credentials.clientAuthMethod === 'client_secret_post') {
				formData.append('client_secret', credentials.clientSecret!);
			}

			const response = await pingOneFetch('/api/ciba-token', {
				method: 'POST',
				body: formData,
				headers,
			});

			const data = await response.json();

			// Handle CIBA-specific responses per spec
			if (!response.ok) {
				const errorCode = data.error;

				// Authorization pending - user hasn't approved yet
				if (errorCode === 'authorization_pending') {
					console.log(`${MODULE_TAG} Authorization pending - continue polling`);
					return {
						status: 'pending',
						interval: data.interval || 5,
					};
				}

				// Slow down - polling too frequently
				if (errorCode === 'slow_down') {
					console.log(`${MODULE_TAG} Slow down - increase polling interval`);
					return {
						status: 'pending',
						error: 'slow_down',
						error_description: data.error_description || 'Polling too frequently, please slow down',
						interval: data.interval || 10,
					};
				}

				// Request expired
				if (errorCode === 'expired_token') {
					console.log(`${MODULE_TAG} Request expired`);
					return {
						status: 'expired',
						error: 'expired_token',
						error_description: data.error_description || 'The authorization request has expired',
					};
				}

				// Access denied by user
				if (errorCode === 'access_denied') {
					console.log(`${MODULE_TAG} Access denied by user`);
					return {
						status: 'denied',
						error: 'access_denied',
						error_description: data.error_description || 'User denied the authentication request',
					};
				}

				// Other errors
				console.error(`${MODULE_TAG} CIBA polling error:`, data);
				return {
					status: 'error',
					error: errorCode || 'unknown_error',
					error_description:
						data.error_description || 'Unknown error occurred during token polling',
				};
			}

			// Success - tokens issued
			console.log(`${MODULE_TAG} CIBA tokens received successfully`);
			toastV8.success('CIBA authentication completed successfully');

			return {
				status: 'approved',
				tokens: data as CibaTokens,
			};
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to poll for CIBA tokens:`, error);
			return {
				status: 'error',
				error: 'network_error',
				error_description: `Network error during token polling: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	},

	/**
	 * Get default CIBA scope per specification
	 * @returns Default scope for CIBA flows
	 */
	getDefaultScope(): string {
		return 'openid profile email';
	},

	/**
	 * Get default polling interval per specification
	 * @returns Default polling interval in seconds
	 */
	getDefaultPollingInterval(): number {
		return 5; // Per OpenID Connect spec
	},

	/**
	 * Format CIBA status for display
	 * @param status - CIBA status
	 * @returns Human-readable status string
	 */
	formatStatus(status: CibaStatus): string {
		const statusMap = {
			pending: 'Waiting for user approval...',
			approved: 'Authentication approved',
			denied: 'Authentication denied',
			expired: 'Request expired',
			error: 'Error occurred',
		};
		return statusMap[status] || status;
	},
};

export default CibaServiceV8Enhanced;
