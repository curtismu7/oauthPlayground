// src/utils/v4ApiClient.ts - Enhanced API Client for V4 Flows

import { showGlobalError, showGlobalSuccess, showGlobalWarning } from '../hooks/useNotifications';
import { ApiCallHandler, NodeServerErrorHandling } from '../types/v4FlowTemplate';

// Node server error messages
const NODE_SERVER_ERRORS: NodeServerErrorHandling = {
	400: 'Bad Request - Please check your input',
	401: 'Unauthorized - Check your client credentials',
	403: 'Forbidden - Access denied',
	404: 'Not Found - Endpoint not available',
	429: 'Too Many Requests - Please wait and try again',
	500: 'Internal Server Error - Please try again later',
	502: 'Bad Gateway - Server temporarily unavailable',
	503: 'Service Unavailable - Please try again later',
	504: 'Gateway Timeout - Request timed out',

	NETWORK_ERROR: 'Network connection failed',
	TIMEOUT_ERROR: 'Request timed out',
	PARSE_ERROR: 'Invalid response from server',

	INVALID_CLIENT: 'Invalid client credentials',
	INVALID_GRANT: 'Invalid authorization code',
	INVALID_REQUEST: 'Invalid request parameters',
	ACCESS_DENIED: 'User denied authorization',
	EXPIRED_TOKEN: 'Authorization code has expired',
};

export class V4ApiClient {
	private baseUrl: string = '';
	private defaultTimeout: number = 10000;
	private defaultRetries: number = 3;

	constructor(baseUrl: string = '', timeout: number = 10000, retries: number = 3) {
		this.baseUrl = baseUrl;
		this.defaultTimeout = timeout;
		this.defaultRetries = retries;
	}

	/**
	 * Make an API call with enhanced error handling and Toast feedback
	 */
	async makeApiCall<T = any>(config: ApiCallHandler): Promise<T> {
		const {
			endpoint,
			method,
			body,
			headers = {},
			showLoadingToast = false,
			successMessage,
			errorMessage,
			timeout = this.defaultTimeout,
			retries = this.defaultRetries,
		} = config;

		// Show loading toast if specified
		if (showLoadingToast) {
			showGlobalWarning(`Processing ${endpoint}...`);
		}

		let lastError: Error | null = null;

		// Retry logic with exponential backoff
		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeout);

				const response = await fetch(`${this.baseUrl}${endpoint}`, {
					method,
					headers: {
						'Content-Type': 'application/json',
						...headers,
					},
					body: body ? JSON.stringify(body) : null,
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				// Handle HTTP errors
				if (!response.ok) {
					const errorData = await this.parseResponse(response);
					const errorMessage = this.getErrorMessage(response.status, errorData);
					throw new Error(errorMessage);
				}

				const result = await this.parseResponse(response);

				// Show success message if specified
				if (successMessage) {
					showGlobalSuccess(successMessage);
				}

				return result;
			} catch (error) {
				lastError = error as Error;

				// Don't retry on certain errors
				if (this.shouldNotRetry(error as Error)) {
					break;
				}

				// Wait before retry (exponential backoff)
				if (attempt < retries) {
					const delay = 2 ** attempt * 1000;
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// All retries failed
		const finalErrorMessage = errorMessage || `Failed to call ${endpoint}`;
		showGlobalError(`${finalErrorMessage}: ${lastError?.message || 'Unknown error'}`);
		throw lastError || new Error(finalErrorMessage);
	}

	/**
	 * Exchange authorization code for tokens
	 */
	async exchangeTokens(params: {
		grant_type: string;
		code: string;
		redirect_uri: string;
		client_id: string;
		client_secret: string;
		code_verifier?: string;
		environment_id: string;
	}): Promise<any> {
		return this.makeApiCall({
			endpoint: '/api/token-exchange',
			method: 'POST',
			body: params,
			showLoadingToast: true,
			successMessage: 'Tokens exchanged successfully',
			errorMessage: 'Token exchange failed',
		});
	}

	/**
	 * Get user information
	 */
	async getUserInfo(params: { access_token: string; environment_id: string }): Promise<any> {
		return this.makeApiCall({
			endpoint: '/api/userinfo',
			method: 'POST',
			body: params,
			showLoadingToast: true,
			successMessage: 'User information retrieved',
			errorMessage: 'Failed to fetch user information',
		});
	}

	/**
	 * Validate token
	 */
	async validateToken(params: { access_token: string; environment_id: string }): Promise<any> {
		return this.makeApiCall({
			endpoint: '/api/validate-token',
			method: 'POST',
			body: params,
			showLoadingToast: true,
			successMessage: 'Token validated successfully',
			errorMessage: 'Token validation failed',
		});
	}

	/**
	 * Get OpenID Discovery configuration
	 */
	async getDiscoveryConfig(environmentId: string, region: string = 'us'): Promise<any> {
		return this.makeApiCall({
			endpoint: `/api/discovery?environment_id=${environmentId}&region=${region}`,
			method: 'GET',
			showLoadingToast: true,
			successMessage: 'Discovery configuration loaded',
			errorMessage: 'Failed to load discovery configuration',
		});
	}

	/**
	 * Get JWKS
	 */
	async getJWKS(environmentId: string): Promise<any> {
		return this.makeApiCall({
			endpoint: `/api/jwks?environment_id=${environmentId}`,
			method: 'GET',
			showLoadingToast: true,
			successMessage: 'JWKS loaded successfully',
			errorMessage: 'Failed to load JWKS',
		});
	}

	/**
	 * Parse response with error handling
	 */
	private async parseResponse(response: Response): Promise<any> {
		try {
			const text = await response.text();
			if (!text) {
				return {};
			}
			return JSON.parse(text);
		} catch (_error) {
			throw new Error(NODE_SERVER_ERRORS.PARSE_ERROR);
		}
	}

	/**
	 * Get appropriate error message based on status code and response
	 */
	private getErrorMessage(status: number, errorData: any): string {
		// Check for specific PingOne errors first
		if (errorData?.error) {
			switch (errorData.error) {
				case 'invalid_client':
					return NODE_SERVER_ERRORS.INVALID_CLIENT;
				case 'invalid_grant':
					return NODE_SERVER_ERRORS.INVALID_GRANT;
				case 'invalid_request':
					return NODE_SERVER_ERRORS.INVALID_REQUEST;
				case 'access_denied':
					return NODE_SERVER_ERRORS.ACCESS_DENIED;
				default:
					return errorData.error_description || errorData.error || `HTTP ${status}`;
			}
		}

		// Fall back to status code messages
		const statusKey = status.toString() as keyof NodeServerErrorHandling;
		return (
			NODE_SERVER_ERRORS[statusKey] ||
			`HTTP ${status} - ${errorData?.error_description || 'Unknown error'}`
		);
	}

	/**
	 * Determine if an error should not be retried
	 */
	private shouldNotRetry(error: Error): boolean {
		// Don't retry on client errors (4xx) except 429 (rate limiting)
		if (
			error.message.includes('400') ||
			error.message.includes('401') ||
			error.message.includes('403') ||
			error.message.includes('404')
		) {
			return true;
		}

		// Don't retry on network errors that are likely permanent
		if (error.name === 'AbortError' || error.message.includes('Network connection failed')) {
			return true;
		}

		return false;
	}
}

// Create default instance
export const v4ApiClient = new V4ApiClient();
