/**
 * @file V9MockApiLogger.ts
 * @description Mock API call logger for V7M educational services
 * @version 1.0.0
 * @since 2026-03-10
 *
 * Logs mock API calls in the same format as real PingOne API calls
 * so they appear in the log viewer for educational purposes.
 */

import { logger } from '../../../utils/logger';

const MODULE_TAG = '[🎭 V7M-MOCK-API]';

// ============================================================================
// INTERFACES
// ============================================================================

export interface MockApiCallOptions {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	url: string;
	endpoint: string; // Human-readable endpoint name
	headers?: Record<string, string>;
	body?: Record<string, unknown> | string;
	queryParams?: Record<string, string>;
	responseStatus?: number;
	responseData?: Record<string, unknown> | string;
	responseError?: string;
	duration?: number; // Simulated network delay in ms
	flowType?: string;
	step?: string;
	environmentId?: string;
	clientId?: string;
}

// ============================================================================
// MOCK API LOGGER SERVICE
// ============================================================================

class V9MockApiLogger {
	/**
	 * Log a mock API call in the same format as real PingOne API calls
	 * This will appear in the log viewer just like real API calls
	 */
	static logMockApiCall(options: MockApiCallOptions): void {
		const {
			method,
			url,
			endpoint,
			headers = {},
			body,
			queryParams,
			responseStatus = 200,
			responseData,
			responseError,
			duration = 800 + Math.random() * 400, // 800-1200ms simulated delay
			flowType = 'v7m-mock',
			step,
			environmentId,
			clientId,
		} = options;

		// Start timing
		const startTime = Date.now();

		// Log API call start
		V9MockApiLogger.logApiCallStart({
			method,
			url,
			endpoint,
			headers,
			body,
			queryParams,
			flowType,
			step,
			environmentId,
			clientId,
		});

		// Simulate network delay and log response
		setTimeout(() => {
			if (responseError) {
				V9MockApiLogger.logApiCallError({
					method,
					url,
					endpoint,
					responseStatus,
					responseError,
					duration: Date.now() - startTime,
					flowType,
					step,
				});
			} else {
				V9MockApiLogger.logApiCallSuccess({
					method,
					url,
					endpoint,
					responseStatus,
					responseData,
					duration: Date.now() - startTime,
					flowType,
					step,
				});
			}
		}, duration);
	}

	/**
	 * Log the start of an API call
	 */
	private static logApiCallStart(options: {
		method: string;
		url: string;
		endpoint: string;
		headers?: Record<string, string>;
		body?: Record<string, unknown> | string;
		queryParams?: Record<string, string>;
		flowType?: string;
		step?: string;
		environmentId?: string;
		clientId?: string;
	}): void {
		const {
			method,
			url,
			endpoint,
			headers,
			body,
			queryParams,
			flowType,
			step,
			environmentId,
			clientId,
		} = options;

		// Build the mock API call log in the same format as real PingOne calls
		const mockLogEntries = [
			'',
			'************************************************************************************',
			'******************************************************************                  *                                                                                   ',
			`*  🌐 MOCK PINGONE API CALL: ${endpoint}`,
			`*  📅 Timestamp: ${new Date().toISOString()}`,
			`*  🕐 Local Time: ${new Date().toLocaleString()}`,
			'*                                                                                   ',
			'************************************************************************************',
			'******************************************************************                  ',
			'═══════════════════════════════════════════════════════════════════════════════',
			'📤 REQUEST',
			'═══════════════════════════════════════════════════════════════════════════════',
			`📍 URL: ${url}`,
			`🔧 METHOD: ${method}`,
		];

		// Add headers
		if (headers && Object.keys(headers).length > 0) {
			mockLogEntries.push(`📋 REQUEST HEADERS: ${JSON.stringify(headers, null, 2)}`);
		}

		// Add query parameters
		if (queryParams && Object.keys(queryParams).length > 0) {
			mockLogEntries.push(`🔍 QUERY PARAMETERS: ${JSON.stringify(queryParams, null, 2)}`);
		}

		// Add body
		if (body) {
			const bodyStr = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
			mockLogEntries.push(`📦 REQUEST BODY (JSON): ${bodyStr}`);
		}

		// Add flow context
		if (flowType || step || environmentId || clientId) {
			mockLogEntries.push(
				'🏷️  FLOW CONTEXT: ' +
					JSON.stringify(
						{
							flowType,
							step,
							environmentId,
							clientId,
						},
						null,
						2
					)
			);
		}

		// Add mock note
		mockLogEntries.push(
			'',
			'🎭 MOCK NOTE: This is a simulated API call for educational purposes.',
			'   In a real implementation, this would make an actual HTTP request to PingOne.',
			''
		);

		// Log each line
		mockLogEntries.forEach((line) => {
			logger.info(MODULE_TAG, line);
		});
	}

	/**
	 * Log successful API call response
	 */
	private static logApiCallSuccess(options: {
		method: string;
		url: string;
		endpoint: string;
		responseStatus: number;
		responseData?: Record<string, unknown> | string;
		duration: number;
		flowType?: string;
		step?: string;
	}): void {
		const { method, url, endpoint, responseStatus, responseData, duration, flowType, step } =
			options;

		const mockLogEntries = [
			'',
			'═══════════════════════════════════════════════════════════════════════════════',
			'📥 RESPONSE',
			'═══════════════════════════════════════════════════════════════════════════════',
			`✅ STATUS: ${responseStatus} ${V9MockApiLogger.getStatusText(responseStatus)}`,
			`⏱️  DURATION: ${duration}ms`,
		];

		// Add response data
		if (responseData) {
			const dataStr =
				typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2);
			mockLogEntries.push(`📦 RESPONSE BODY (JSON): ${dataStr}`);
		}

		// Add flow context
		if (flowType || step) {
			mockLogEntries.push(
				'🏷️  FLOW CONTEXT: ' +
					JSON.stringify(
						{
							flowType,
							step,
							completed: true,
						},
						null,
						2
					)
			);
		}

		mockLogEntries.push(
			'',
			'🎭 MOCK NOTE: Mock response generated successfully for educational purposes.',
			'',
			'************************************************************************************',
			'******************************************************************                  *                                                                                   ',
			''
		);

		// Log each line
		mockLogEntries.forEach((line) => {
			logger.info(MODULE_TAG, line);
		});
	}

	/**
	 * Log API call error
	 */
	private static logApiCallError(options: {
		method: string;
		url: string;
		endpoint: string;
		responseStatus: number;
		responseError: string;
		duration: number;
		flowType?: string;
		step?: string;
	}): void {
		const { method, url, endpoint, responseStatus, responseError, duration, flowType, step } =
			options;

		const mockLogEntries = [
			'',
			'═══════════════════════════════════════════════════════════════════════════════',
			'📥 RESPONSE',
			'═══════════════════════════════════════════════════════════════════════════════',
			`❌ STATUS: ${responseStatus} ${V9MockApiLogger.getStatusText(responseStatus)}`,
			`⏱️  DURATION: ${duration}ms`,
			`🚨 ERROR: ${responseError}`,
		];

		// Add flow context
		if (flowType || step) {
			mockLogEntries.push(
				'🏷️  FLOW CONTEXT: ' +
					JSON.stringify(
						{
							flowType,
							step,
							completed: false,
							error: true,
						},
						null,
						2
					)
			);
		}

		mockLogEntries.push(
			'',
			'🎭 MOCK NOTE: Mock error generated for educational purposes.',
			'',
			'************************************************************************************',
			'******************************************************************                  *                                                                                   ',
			''
		);

		// Log each line
		mockLogEntries.forEach((line) => {
			logger.error(MODULE_TAG, line);
		});
	}

	/**
	 * Get status text for HTTP status codes
	 */
	private static getStatusText(status: number): string {
		const statusTexts: Record<number, string> = {
			200: 'OK',
			201: 'Created',
			400: 'Bad Request',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			500: 'Internal Server Error',
		};
		return statusTexts[status] || 'Unknown';
	}
}

// ============================================================================
// CONVENIENCE METHODS FOR COMMON V7M API CALLS
// ============================================================================

export class V9MockApiCalls {
	/**
	 * Mock authorization endpoint call
	 */
	static logAuthorizationEndpoint(options: {
		environmentId: string;
		clientId: string;
		redirectUri: string;
		scope: string;
		state?: string;
		codeChallenge?: string;
		codeChallengeMethod?: string;
		responseType: string;
	}): void {
		const queryParams: Record<string, string> = {
			response_type: options.responseType,
			client_id: options.clientId,
			redirect_uri: options.redirectUri,
			scope: options.scope,
		};

		if (options.state) queryParams.state = options.state;
		if (options.codeChallenge) queryParams.code_challenge = options.codeChallenge;
		if (options.codeChallengeMethod)
			queryParams.code_challenge_method = options.codeChallengeMethod;

		V9MockApiLogger.logMockApiCall({
			method: 'GET',
			url: `https://auth.pingone.com/${options.environmentId}/as/authorization?${new URLSearchParams(queryParams).toString()}`,
			endpoint: 'Authorization Endpoint',
			queryParams,
			responseStatus: 302,
			responseData: {
				redirect_uri: `${options.redirectUri}?code=mock-auth-code-12345${options.state ? `&state=${options.state}` : ''}`,
			},
			flowType: 'authorization-code',
			step: 'authorization-request',
			environmentId: options.environmentId,
			clientId: options.clientId,
		});
	}

	/**
	 * Mock token endpoint call
	 */
	static logTokenEndpoint(options: {
		environmentId: string;
		clientId: string;
		code?: string;
		codeVerifier?: string;
		grantType: string;
		redirectUri?: string;
		scope?: string;
	}): void {
		const body: Record<string, string> = {
			grant_type: options.grantType,
			client_id: options.clientId,
		};

		if (options.code) body.code = options.code;
		if (options.codeVerifier) body.code_verifier = options.codeVerifier;
		if (options.redirectUri) body.redirect_uri = options.redirectUri;
		if (options.scope) body.scope = options.scope;

		V9MockApiLogger.logMockApiCall({
			method: 'POST',
			url: `https://auth.pingone.com/${options.environmentId}/as/token`,
			endpoint: 'Token Endpoint',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
			responseStatus: 200,
			responseData: {
				access_token: 'mock-access-token-eyJhbGciOiJSUzI1NiIs...',
				token_type: 'Bearer',
				expires_in: 3600,
				refresh_token: 'mock-refresh-token-eyJhbGciOiJSUzI1NiIs...',
				scope: options.scope || 'read write',
			},
			flowType: 'authorization-code',
			step: 'token-exchange',
			environmentId: options.environmentId,
			clientId: options.clientId,
		});
	}

	/**
	 * Mock userinfo endpoint call
	 */
	static logUserInfoEndpoint(options: { environmentId: string; accessToken: string }): void {
		V9MockApiLogger.logMockApiCall({
			method: 'GET',
			url: `https://auth.pingone.com/${options.environmentId}/as/userinfo`,
			endpoint: 'UserInfo Endpoint',
			headers: {
				Authorization: `Bearer ${options.accessToken}`,
			},
			responseStatus: 200,
			responseData: {
				sub: 'mock-user-12345',
				email: 'jane.doe@example.com',
				name: 'Jane Doe',
				given_name: 'Jane',
				family_name: 'Doe',
				preferred_username: 'jane.doe',
			},
			flowType: 'authorization-code',
			step: 'userinfo-fetch',
			environmentId: options.environmentId,
		});
	}

	/**
	 * Mock token introspection endpoint call
	 */
	static logIntrospectionEndpoint(options: {
		environmentId: string;
		token: string;
		clientId: string;
		clientSecret?: string;
	}): void {
		const body: Record<string, string> = {
			token: options.token,
			client_id: options.clientId,
		};

		if (options.clientSecret) body.client_secret = options.clientSecret;

		V9MockApiLogger.logMockApiCall({
			method: 'POST',
			url: `https://auth.pingone.com/${options.environmentId}/as/introspection`,
			endpoint: 'Token Introspection Endpoint',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
			responseStatus: 200,
			responseData: {
				active: true,
				client_id: options.clientId,
				token_type: 'Bearer',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
				sub: 'mock-user-12345',
				scope: 'read write',
			},
			flowType: 'authorization-code',
			step: 'token-introspection',
			environmentId: options.environmentId,
			clientId: options.clientId,
		});
	}
}

export default V9MockApiLogger;
