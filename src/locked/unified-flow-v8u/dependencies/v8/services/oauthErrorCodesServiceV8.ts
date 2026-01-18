// src/v8/services/oauthErrorCodesServiceV8.ts
/**
 * @file oauthErrorCodesServiceV8.ts
 * @module v8/services
 * @description OAuth 2.0 error codes with descriptions and solutions
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Provides OAuth error code references, descriptions, and common solutions
 * Based on RFC 6749 Section 5.2 and OAuth 2.0 Security Best Current Practice
 */

const MODULE_TAG = '[❌ OAUTH-ERROR-CODES-V8]';

export interface OAuthErrorInfo {
	code: string;
	description: string;
	specification: string;
	commonCauses: string[];
	suggestedFixes: string[];
	specReference?: string;
	severity: 'error' | 'warning';
}

/**
 * OAuth 2.0 error codes per RFC 6749 Section 5.2
 */
const OAUTH_ERROR_CODES: Record<string, OAuthErrorInfo> = {
	invalid_request: {
		code: 'invalid_request',
		description:
			'The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.',
		specification: 'RFC 6749 Section 5.2',
		commonCauses: [
			'Missing required parameter (client_id, redirect_uri, etc.)',
			'Invalid parameter format (e.g., redirect_uri mismatch)',
			'Duplicate parameters in request',
			'Malformed authorization URL',
		],
		suggestedFixes: [
			'Check that all required parameters are present',
			'Verify redirect_uri exactly matches registered URI',
			'Ensure no duplicate parameters in the request',
			'Validate URL encoding and formatting',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-5.2',
		severity: 'error',
	},
	invalid_client: {
		code: 'invalid_client',
		description:
			'Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).',
		specification: 'RFC 6749 Section 5.2',
		commonCauses: [
			'Invalid or unknown client_id',
			'Missing or incorrect client_secret',
			'Unsupported client authentication method',
			'Client disabled or deleted',
		],
		suggestedFixes: [
			'Verify client_id is correct',
			'Check client_secret matches PingOne application configuration',
			'Confirm client authentication method matches app settings',
			'Verify client is enabled in PingOne',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-5.2',
		severity: 'error',
	},
	invalid_grant: {
		code: 'invalid_grant',
		description:
			'The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, was issued to another client, or was issued in another request.',
		specification: 'RFC 6749 Section 5.2',
		commonCauses: [
			'Authorization code already used or expired',
			'Invalid or expired refresh token',
			'Code issued to different client',
			'PKCE code_verifier mismatch',
		],
		suggestedFixes: [
			'Request a new authorization code (each code is single-use)',
			'Verify PKCE code_verifier matches original code_challenge',
			'Check authorization code expiration time',
			'Ensure code was issued to the same client_id',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-5.2',
		severity: 'error',
	},
	unauthorized_client: {
		code: 'unauthorized_client',
		description: 'The authenticated client is not authorized to use this authorization grant type.',
		specification: 'RFC 6749 Section 5.2',
		commonCauses: [
			'Client not configured for selected grant type',
			'Grant type disabled in PingOne application',
			'Client type mismatch (public vs confidential)',
		],
		suggestedFixes: [
			'Verify grant type is enabled in PingOne application settings',
			'Check client type matches flow requirements',
			'Review application configuration in PingOne dashboard',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-5.2',
		severity: 'error',
	},
	unsupported_grant_type: {
		code: 'unsupported_grant_type',
		description: 'The authorization grant type is not supported by the authorization server.',
		specification: 'RFC 6749 Section 5.2',
		commonCauses: [
			'Grant type not supported by PingOne',
			'Invalid grant_type parameter value',
			'Using deprecated grant type',
		],
		suggestedFixes: [
			'Check PingOne documentation for supported grant types',
			'Verify grant_type parameter spelling',
			'Consider using Authorization Code flow with PKCE',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-5.2',
		severity: 'error',
	},
	invalid_scope: {
		code: 'invalid_scope',
		description:
			'The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.',
		specification: 'RFC 6749 Section 5.2',
		commonCauses: [
			'Scope not available for this client',
			'Invalid scope format',
			'Scope not granted by user',
			'Requesting more scopes than configured',
		],
		suggestedFixes: [
			'Review available scopes in PingOne application settings',
			'Verify scope names are correct (e.g., "openid profile email")',
			'Check that user granted requested scopes',
			'Reduce number of requested scopes',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-5.2',
		severity: 'error',
	},
	access_denied: {
		code: 'access_denied',
		description: 'The resource owner or authorization server denied the request.',
		specification: 'RFC 6749 Section 4.1.2.1',
		commonCauses: [
			'User denied authorization consent',
			'User canceled login',
			'Authorization server policy rejection',
		],
		suggestedFixes: [
			'User needs to approve the authorization request',
			'Check PingOne policy settings',
			'Verify user has required permissions',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1',
		severity: 'warning',
	},
	unsupported_response_type: {
		code: 'unsupported_response_type',
		description:
			'The authorization server does not support obtaining an authorization code using this method.',
		specification: 'RFC 6749 Section 4.1.2.1',
		commonCauses: [
			'Invalid response_type value',
			'Response type not supported for this client',
			'Response type mismatch with flow',
		],
		suggestedFixes: [
			'Verify response_type matches flow (code, token, id_token combinations)',
			'Check PingOne application configuration',
			'Review flow requirements',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1',
		severity: 'error',
	},
	server_error: {
		code: 'server_error',
		description:
			'The authorization server encountered an unexpected condition that prevented it from fulfilling the request.',
		specification: 'RFC 6749 Section 4.1.2.1',
		commonCauses: [
			'PingOne service outage',
			'Temporary server issue',
			'Internal authorization server error',
		],
		suggestedFixes: [
			'Wait a moment and retry the request',
			'Check PingOne status page',
			'Contact PingOne support if issue persists',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1',
		severity: 'error',
	},
	temporarily_unavailable: {
		code: 'temporarily_unavailable',
		description:
			'The authorization server is currently unable to handle the request due to a temporary overloading or maintenance of the server.',
		specification: 'RFC 6749 Section 4.1.2.1',
		commonCauses: ['PingOne service overloaded', 'Maintenance window', 'Rate limiting'],
		suggestedFixes: [
			'Wait and retry after a delay',
			'Check PingOne status page',
			'Reduce request frequency if rate limited',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1',
		severity: 'warning',
	},
	// RFC 8628 (Device Authorization) specific errors
	authorization_pending: {
		code: 'authorization_pending',
		description:
			'The authorization request is still pending as the end user has not yet completed the user-interactive authorization steps.',
		specification: 'RFC 8628 Section 3.5',
		commonCauses: [
			'User has not yet authorized the device',
			'Polling too frequently',
			'User code entry in progress',
		],
		suggestedFixes: [
			'Continue polling (this is expected)',
			'Ensure user has entered the user code',
			'Wait for user to complete authorization',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.5',
		severity: 'warning',
	},
	slow_down: {
		code: 'slow_down',
		description:
			'A variant of "authorization_pending", the authorization request is still pending and polling should continue, but the interval MUST be increased by 5 seconds for this and all subsequent requests.',
		specification: 'RFC 8628 Section 3.5',
		commonCauses: ['Polling too frequently', 'Rate limiting protection'],
		suggestedFixes: [
			'Increase polling interval by 5 seconds',
			'Continue polling with longer delays',
			'Wait for user to complete authorization',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.5',
		severity: 'warning',
	},
	expired_token: {
		code: 'expired_token',
		description:
			'The "device_code" has expired, and the device authorization session has concluded.',
		specification: 'RFC 8628 Section 3.5',
		commonCauses: [
			'Device code expired (typically 15-20 minutes)',
			'User took too long to authorize',
			'Authorization session timed out',
		],
		suggestedFixes: [
			'Request a new device authorization',
			'Start the device authorization flow again',
			'Ensure user authorizes within the expiration window',
		],
		specReference: 'https://datatracker.ietf.org/doc/html/rfc8628#section-3.5',
		severity: 'error',
	},
};

export class OAuthErrorCodesServiceV8 {
	/**
	 * Get error information for an OAuth error code
	 * @param errorCode - OAuth error code (e.g., 'invalid_client')
	 * @returns Error information or null if not found
	 */
	static getErrorInfo(errorCode: string): OAuthErrorInfo | null {
		const normalizedCode = errorCode.toLowerCase().trim();
		const errorInfo = OAUTH_ERROR_CODES[normalizedCode];

		if (errorInfo) {
			console.log(`${MODULE_TAG} Found error info for code: ${normalizedCode}`);
			return errorInfo;
		}

		console.warn(`${MODULE_TAG} Unknown error code: ${normalizedCode}`);
		return null;
	}

	/**
	 * Extract error code from error message
	 * @param errorMessage - Full error message
	 * @returns Error code if found, null otherwise
	 */
	static extractErrorCode(errorMessage: string): string | null {
		// Try to extract error code from common patterns
		const patterns = [
			/(?:error[:\s]+)?([a-z_]+)(?:\s|$|:)/i, // "error: invalid_client" or "invalid_client:"
			/\[([a-z_]+)\]/i, // "[invalid_client]"
			/`([a-z_]+)`/i, // "`invalid_client`"
		];

		for (const pattern of patterns) {
			const match = errorMessage.match(pattern);
			if (match?.[1]) {
				const code = match[1].toLowerCase();
				if (OAUTH_ERROR_CODES[code]) {
					return code;
				}
			}
		}

		// Check if entire message matches an error code
		const trimmed = errorMessage.trim().toLowerCase();
		if (OAUTH_ERROR_CODES[trimmed]) {
			return trimmed;
		}

		return null;
	}

	/**
	 * Get all available error codes
	 * @returns Array of error codes
	 */
	static getAllErrorCodes(): string[] {
		return Object.keys(OAUTH_ERROR_CODES);
	}

	/**
	 * Format error with helpful information
	 * @param errorCode - OAuth error code
	 * @param errorDescription - Optional error description from server
	 * @returns Formatted error information
	 */
	static formatError(
		errorCode: string,
		errorDescription?: string
	): {
		code: string;
		message: string;
		info: OAuthErrorInfo | null;
		specification: string;
	} {
		const info = OAuthErrorCodesServiceV8.getErrorInfo(errorCode);
		const message = errorDescription || info?.description || `Unknown OAuth error: ${errorCode}`;
		const spec = info?.specReference || 'https://datatracker.ietf.org/doc/html/rfc6749';

		return {
			code: errorCode,
			message,
			info,
			specification: spec,
		};
	}
}

export default OAuthErrorCodesServiceV8;
