/**
 * @file cibaServiceV8.ts
 * @module v8/services
 * @description CIBA (Client Initiated Backchannel Authentication) Service V8
 * @version 8.0.0
 * @since 2026-02-17
 *
 * Handles CIBA flow operations including:
 * - Authentication request initiation
 * - Token polling and retrieval
 * - Status management
 * - Error handling for CIBA-specific scenarios
 *
 * @example
 * const service = new CibaServiceV8();
 * const authRequest = await service.initiateAuthentication(credentials);
 * const tokens = await service.pollForTokens(authRequest.auth_req_id);
 */

import { pingOneFetch } from '@/utils/pingOneFetch';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔐 CIBA-SERVICE-V8]';

export interface CibaCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scope: string;
	loginHint: string;
	bindingMessage?: string;
	requestContext?: string;
	clientAuthMethod?: 'client_secret_basic' | 'client_secret_post';
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

/**
 * CIBA Service V8
 * Provides comprehensive CIBA flow management with modern error handling
 * and integration with V8 service patterns
 */
export const CibaServiceV8 = {
	/**
	 * Initiate CIBA authentication request
	 * @param credentials - CIBA credentials and configuration
	 * @returns Promise<CibaAuthRequest> - Authentication request details
	 */
	async initiateAuthentication(credentials: CibaCredentials): Promise<CibaAuthRequest> {
		console.log(`${MODULE_TAG} Initiating CIBA authentication request`);

		try {
			const formData = new URLSearchParams();
			formData.append('environment_id', credentials.environmentId);
			formData.append('client_id', credentials.clientId);
			formData.append('client_secret', credentials.clientSecret);
			formData.append('scope', credentials.scope);
			formData.append('login_hint', credentials.loginHint);
			
			if (credentials.bindingMessage) {
				formData.append('binding_message', credentials.bindingMessage);
			}
			
			if (credentials.requestContext) {
				formData.append('request_context', credentials.requestContext);
			}

			if (credentials.clientAuthMethod) {
				formData.append('auth_method', credentials.clientAuthMethod);
			}

			const response = await pingOneFetch('/api/ciba-backchannel', {
				method: 'POST',
				body: formData,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error_description || `CIBA request failed: ${response.status} ${response.statusText}`
				);
			}

			const authRequest = await response.json();
			console.log(`${MODULE_TAG} CIBA authentication request initiated:`, {
				auth_req_id: `${authRequest.auth_req_id?.substring(0, 20)}...`,
				expires_in: authRequest.expires_in,
				interval: authRequest.interval,
			});

			toastV8.success('CIBA authentication request initiated successfully');
			return authRequest;

		} catch (error) {
			console.error(`${MODULE_TAG} Failed to initiate CIBA authentication:`, error);
			toastV8.error(`Failed to initiate CIBA authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
			throw error;
		}
	},

	/**
	 * Poll for CIBA tokens
	 * @param authReqId - Authentication request ID from initiation
	 * @param credentials - CIBA credentials for token polling
	 * @returns Promise<CibaPollingResult> - Polling result with tokens or error
	 */
	async pollForTokens(authReqId: string, credentials: CibaCredentials): Promise<CibaPollingResult> {
		console.log(`${MODULE_TAG} Polling for CIBA tokens: ${authReqId.substring(0, 20)}...`);

		try {
			const formData = new URLSearchParams();
			formData.append('environment_id', credentials.environmentId);
			formData.append('client_id', credentials.clientId);
			formData.append('client_secret', credentials.clientSecret);
			formData.append('auth_req_id', authReqId);

			if (credentials.clientAuthMethod) {
				formData.append('auth_method', credentials.clientAuthMethod);
			}

			const response = await pingOneFetch('/api/ciba-token', {
				method: 'POST',
				body: formData,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});

			const data = await response.json();

			// Handle CIBA-specific responses
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
					error_description: data.error_description || 'Unknown error occurred during token polling',
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
	 * Validate CIBA credentials
	 * @param credentials - CIBA credentials to validate
	 * @returns {valid: boolean, errors: string[]} - Validation result
	 */
	validateCredentials(credentials: Partial<CibaCredentials>): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!credentials.environmentId?.trim()) {
			errors.push('Environment ID is required');
		}

		if (!credentials.clientId?.trim()) {
			errors.push('Client ID is required');
		}

		if (!credentials.clientSecret?.trim()) {
			errors.push('Client Secret is required');
		}

		if (!credentials.scope?.trim()) {
			errors.push('Scope is required');
		} else if (!credentials.scope.includes('openid')) {
			errors.push('Scope must include "openid" for CIBA flows');
		}

		if (!credentials.loginHint?.trim()) {
			errors.push('Login Hint is required for CIBA flows');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	/**
	 * Get default CIBA scope
	 * @returns Default scope for CIBA flows
	 */
	getDefaultScope(): string {
		return 'openid profile';
	},

	/**
	 * Get default polling interval
	 * @returns Default polling interval in seconds
	 */
	getDefaultPollingInterval(): number {
		return 5;
	},

	/**
	 * Format CIBA status for display
	 * @param status - CIBA status
	 * @returns Human-readable status string
	 */
	formatStatus(status: CibaStatus): string {
		const statusMap: Record<CibaStatus, string> = {
			pending: 'Awaiting User Approval',
			approved: 'Authentication Approved',
			denied: 'Authentication Denied',
			expired: 'Request Expired',
			error: 'Error Occurred',
		};

		return statusMap[status] || status;
	},

	/**
	 * Check if CIBA is supported for the given environment
	 * @param environmentId - PingOne environment ID
	 * @returns Promise<boolean> - Whether CIBA is supported
	 */
	async isCibaSupported(environmentId: string): Promise<boolean> {
		try {
			// Try to fetch OIDC discovery to check for CIBA support
			const discoveryUrl = `https://auth.pingone.com/${environmentId}/as/.well-known/openid_configuration`;
			
			const response = await fetch(discoveryUrl);
			if (!response.ok) {
				return false;
			}

			const discovery = await response.json();
			
			// Check for CIBA grant type support
			const grantTypesSupported = discovery.grant_types_supported || [];
			return grantTypesSupported.includes('urn:openid:params:grant-type:ciba');

		} catch (error) {
			console.error(`${MODULE_TAG} Failed to check CIBA support:`, error);
			return false;
		}
	}
}

export default CibaServiceV8;
