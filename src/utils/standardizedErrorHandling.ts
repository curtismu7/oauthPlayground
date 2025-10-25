// src/utils/standardizedErrorHandling.ts
// Standardized error handling for all OAuth/OIDC flows

export interface StandardizedErrorResponse {
	error: string;
	error_description: string;
	error_uri?: string;
	state?: string;
}

export interface OAuth2ErrorDetails {
	error: string;
	error_description: string;
	error_uri?: string;
	state?: string;
	correlation_id?: string;
	timestamp: number;
	flow_name: string;
	step: string;
}

export interface ErrorContext {
	flowName: string;
	step: string;
	operation: string;
	parameters?: Record<string, any>;
	userAgent?: string;
	timestamp: number;
}

/**
 * Standardized Error Handler for OAuth 2.0 and OIDC flows
 * Implements RFC 6749 Section 4.1.2.1 and OIDC Core 1.0 error handling
 */
export class StandardizedErrorHandler {
	private static errorLog: OAuth2ErrorDetails[] = [];

	/**
	 * Create standardized error response
	 */
	static createErrorResponse(
		error: string,
		description: string,
		state?: string,
		errorUri?: string
	): StandardizedErrorResponse {
		return {
			error,
			error_description: description,
			error_uri: errorUri,
			state
		};
	}

	/**
	 * Handle OAuth 2.0 errors
	 */
	static handleOAuthError(error: any, context?: ErrorContext): StandardizedErrorResponse {
		const errorDetails: OAuth2ErrorDetails = {
			error: 'server_error',
			error_description: 'An unexpected error occurred',
			timestamp: Date.now(),
			flow_name: context?.flowName || 'unknown',
			step: context?.step || 'unknown'
		};

		// Handle HTTP errors
		if (error.response?.data) {
			const { error: errorCode, error_description, error_uri, state } = error.response.data;
			
			errorDetails.error = errorCode || 'server_error';
			errorDetails.error_description = error_description || 'An error occurred';
			errorDetails.error_uri = error_uri;
			errorDetails.state = state;
			errorDetails.correlation_id = error.response.headers?.['x-correlation-id'];

			// Log error
			this.errorLog.push(errorDetails);

			return this.createErrorResponse(
				errorDetails.error,
				errorDetails.error_description,
				errorDetails.state,
				errorDetails.error_uri
			);
		}

		// Handle network errors
		if (error.code === 'NETWORK_ERROR') {
			errorDetails.error = 'temporarily_unavailable';
			errorDetails.error_description = 'Service temporarily unavailable';
		} else if (error.code === 'TIMEOUT') {
			errorDetails.error = 'temporarily_unavailable';
			errorDetails.error_description = 'Request timeout';
		} else {
			errorDetails.error_description = error.message || 'An unexpected error occurred';
		}

		// Log error
		this.errorLog.push(errorDetails);

		return this.createErrorResponse(
			errorDetails.error,
			errorDetails.error_description
		);
	}

	/**
	 * Handle OIDC specific errors
	 */
	static handleOIDCError(error: any, context?: ErrorContext): StandardizedErrorResponse {
		const oauthError = this.handleOAuthError(error, context);
		
		// Add OIDC-specific error handling
		if (error.code === 'ID_TOKEN_VALIDATION_FAILED') {
			oauthError.error = 'invalid_token';
			oauthError.error_description = 'ID token validation failed';
		} else if (error.code === 'NONCE_MISMATCH') {
			oauthError.error = 'invalid_request';
			oauthError.error_description = 'Nonce mismatch';
		}

		return oauthError;
	}

	/**
	 * Validate error response format
	 */
	static validateErrorResponse(response: any): boolean {
		// Check required fields
		if (!response || typeof response !== 'object') {
			return false;
		}

		if (!response.error || typeof response.error !== 'string') {
			return false;
		}

		// Check error code validity
		const validErrorCodes = [
			'invalid_request',
			'invalid_client',
			'invalid_grant',
			'unauthorized_client',
			'unsupported_grant_type',
			'invalid_scope',
			'access_denied',
			'unsupported_response_type',
			'server_error',
			'temporarily_unavailable'
		];

		if (!validErrorCodes.includes(response.error)) {
			console.warn(`Invalid error code: ${response.error}`);
		}

		return true;
	}

	/**
	 * Get error description for common errors
	 */
	static getErrorDescription(errorCode: string): string {
		const descriptions: Record<string, string> = {
			'invalid_request': 'The request is missing a required parameter, includes an invalid parameter value, or is otherwise malformed',
			'invalid_client': 'Client authentication failed',
			'invalid_grant': 'The provided authorization grant is invalid, expired, or revoked',
			'unauthorized_client': 'The client is not authorized to request an authorization code using this method',
			'unsupported_grant_type': 'The authorization grant type is not supported by the authorization server',
			'invalid_scope': 'The requested scope is invalid, unknown, or malformed',
			'access_denied': 'The resource owner or authorization server denied the request',
			'unsupported_response_type': 'The authorization server does not support obtaining an authorization code using this method',
			'server_error': 'The authorization server encountered an unexpected condition',
			'temporarily_unavailable': 'The authorization server is currently unable to handle the request'
		};

		return descriptions[errorCode] || 'An error occurred';
	}

	/**
	 * Create user-friendly error message
	 */
	static createUserFriendlyError(error: StandardizedErrorResponse): string {
		const baseMessage = error.error_description || this.getErrorDescription(error.error);
		
		// Add context-specific messages
		switch (error.error) {
			case 'invalid_request':
				return `Invalid request: ${baseMessage}. Please check your parameters and try again.`;
			case 'invalid_client':
				return `Authentication failed: ${baseMessage}. Please check your client credentials.`;
			case 'access_denied':
				return `Access denied: ${baseMessage}. You may need to grant additional permissions.`;
			case 'server_error':
				return `Server error: ${baseMessage}. Please try again later.`;
			case 'temporarily_unavailable':
				return `Service unavailable: ${baseMessage}. Please try again later.`;
			default:
				return baseMessage;
		}
	}

	/**
	 * Log error for debugging
	 */
	static logError(error: StandardizedErrorResponse, context?: ErrorContext): void {
		const errorDetails: OAuth2ErrorDetails = {
			...error,
			timestamp: Date.now(),
			flow_name: context?.flowName || 'unknown',
			step: context?.step || 'unknown'
		};

		this.errorLog.push(errorDetails);

		// Log to console in development
		if (process.env.NODE_ENV === 'development') {
			console.error('OAuth/OIDC Error:', {
				error: errorDetails.error,
				description: errorDetails.error_description,
				flow: errorDetails.flow_name,
				step: errorDetails.step,
				context
			});
		}
	}

	/**
	 * Get error statistics
	 */
	static getErrorStatistics(): {
		totalErrors: number;
		errorsByCode: Record<string, number>;
		errorsByFlow: Record<string, number>;
		recentErrors: OAuth2ErrorDetails[];
	} {
		const totalErrors = this.errorLog.length;
		const errorsByCode: Record<string, number> = {};
		const errorsByFlow: Record<string, number> = {};
		const recentErrors = this.errorLog.slice(-10); // Last 10 errors

		this.errorLog.forEach(error => {
			errorsByCode[error.error] = (errorsByCode[error.error] || 0) + 1;
			errorsByFlow[error.flow_name] = (errorsByFlow[error.flow_name] || 0) + 1;
		});

		return {
			totalErrors,
			errorsByCode,
			errorsByFlow,
			recentErrors
		};
	}

	/**
	 * Clear error log
	 */
	static clearErrorLog(): void {
		this.errorLog = [];
	}

	/**
	 * Export error log
	 */
	static exportErrorLog(): string {
		return JSON.stringify(this.errorLog, null, 2);
	}

	/**
	 * Create error response for specific scenarios
	 */
	static createScenarioError(scenario: string, context?: ErrorContext): StandardizedErrorResponse {
		const scenarios: Record<string, StandardizedErrorResponse> = {
			'invalid_credentials': {
				error: 'invalid_client',
				error_description: 'Invalid client credentials provided'
			},
			'missing_redirect_uri': {
				error: 'invalid_request',
				error_description: 'Missing or invalid redirect_uri parameter'
			},
			'invalid_scope': {
				error: 'invalid_scope',
				error_description: 'Invalid or unsupported scope requested'
			},
			'state_mismatch': {
				error: 'invalid_request',
				error_description: 'State parameter mismatch'
			},
			'nonce_mismatch': {
				error: 'invalid_request',
				error_description: 'Nonce parameter mismatch'
			},
			'token_expired': {
				error: 'invalid_grant',
				error_description: 'Token has expired'
			},
			'network_error': {
				error: 'temporarily_unavailable',
				error_description: 'Network error occurred'
			}
		};

		const error = scenarios[scenario] || {
			error: 'server_error',
			error_description: 'An unexpected error occurred'
		};

		// Log the error
		this.logError(error, context);

		return error;
	}
}
