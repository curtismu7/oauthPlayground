// src/services/implicitFlowComplianceService.ts
/**
 * OAuth 2.0 Implicit Flow Compliance Service
 *
 * Implements RFC 6749 Section 4.2 compliant OAuth 2.0 Implicit Flow
 * with proper fragment-based token delivery, security validations, and error handling.
 *
 * Key Features:
 * - RFC 6749 Section 4.2 compliant parameter validation
 * - Fragment-based token response handling
 * - Proper state validation for CSRF protection
 * - Token lifetime validation
 * - Security headers implementation
 * - Implicit flow specific error handling
 */

import {
	type OAuth2AuthorizationRequest,
	oauth2ComplianceService,
	type ValidationResult,
} from './oauth2ComplianceService';

// OAuth 2.0 Implicit Flow Authorization Request per RFC 6749 Section 4.2.1
export interface ImplicitFlowAuthorizationRequest extends OAuth2AuthorizationRequest {
	response_type: 'token' | 'id_token' | 'id_token token'; // Implicit flow response types
	scope?: string;
	state?: string; // RECOMMENDED for CSRF protection
}

// OAuth 2.0 Implicit Flow Token Response per RFC 6749 Section 4.2.2
export interface ImplicitFlowTokenResponse {
	access_token: string;
	token_type: string;
	expires_in?: number;
	scope?: string;
	state?: string;
	id_token?: string; // For OIDC implicit flows
}

// Fragment parsing result
export interface FragmentParseResult {
	valid: boolean;
	tokens?: ImplicitFlowTokenResponse;
	errors: string[];
	warnings?: string[];
}

// Token validation result for implicit flow
export interface ImplicitTokenValidationResult {
	valid: boolean;
	tokenInfo?: {
		accessToken?: string;
		idToken?: string;
		tokenType?: string;
		expiresIn?: number;
		scope?: string;
		state?: string;
	};
	errors: string[];
	warnings?: string[];
}

/**
 * OAuth 2.0 Implicit Flow Compliance Service
 *
 * Provides RFC 6749 Section 4.2 compliant implementation with proper
 * fragment-based token handling, security validations, and error responses.
 */
export class ImplicitFlowComplianceService {
	private oauth2Service = oauth2ComplianceService;

	/**
	 * Validate implicit flow authorization request parameters
	 * per RFC 6749 Section 4.2.1
	 */
	validateImplicitAuthorizationRequest(params: ImplicitFlowAuthorizationRequest): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// First validate OAuth 2.0 parameters
		const oauth2Validation = this.oauth2Service.validateAuthorizationRequest(params);
		// Filter out response_type errors since we'll validate them specifically for implicit flow
		const filteredErrors = oauth2Validation.errors.filter(
			(error) => !error.includes('unsupported_response_type')
		);
		errors.push(...filteredErrors);
		warnings.push(...(oauth2Validation.warnings || []));

		// Validate response_type for implicit flow
		if (!params.response_type) {
			errors.push('invalid_request: response_type parameter is required');
		} else if (!['token', 'id_token', 'id_token token'].includes(params.response_type)) {
			errors.push(
				'unsupported_response_type: response_type must be "token", "id_token", or "id_token token" for implicit flow'
			);
		}

		// Validate client_id (REQUIRED)
		if (!params.client_id) {
			errors.push('invalid_request: client_id parameter is required');
		}

		// Validate redirect_uri (OPTIONAL but RECOMMENDED)
		if (params.redirect_uri) {
			const redirectUriValidation = this.oauth2Service.validateRedirectUri(params.redirect_uri);
			errors.push(...redirectUriValidation.errors);
			warnings.push(...(redirectUriValidation.warnings || []));
		} else {
			warnings.push('redirect_uri parameter not provided - using pre-registered URI');
		}

		// Validate scope (OPTIONAL)
		if (params.scope) {
			const scopeValidation = this.oauth2Service.validateScope(params.scope);
			errors.push(...scopeValidation.errors);
			warnings.push(...(scopeValidation.warnings || []));
		}

		// Validate state (RECOMMENDED for CSRF protection)
		if (!params.state) {
			warnings.push('state parameter not provided - CSRF protection disabled (SECURITY RISK)');
		} else if (params.state.length < 16) {
			warnings.push('state parameter is too short - should be at least 16 characters for security');
		}

		// PKCE is not typically used with implicit flow, but warn if present
		if (params.code_challenge) {
			warnings.push(
				'PKCE (code_challenge) is not typically used with implicit flow - consider authorization code flow instead'
			);
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Parse token response from URL fragment per RFC 6749 Section 4.2.2
	 */
	parseFragmentResponse(fragment: string): FragmentParseResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Remove leading # if present
			const cleanFragment = fragment.startsWith('#') ? fragment.substring(1) : fragment;

			if (!cleanFragment) {
				errors.push('No fragment found in URL - implicit flow requires fragment-based response');
				return { valid: false, errors };
			}

			// Parse fragment as URL parameters
			const params = new URLSearchParams(cleanFragment);

			// Check for error response first
			const error = params.get('error');
			if (error) {
				errors.push(`Authorization error: ${error}`);
				const errorDescription = params.get('error_description');
				if (errorDescription) {
					errors.push(`Error description: ${errorDescription}`);
				}
				return { valid: false, errors };
			}

			// Extract token response parameters
			const accessToken = params.get('access_token');
			const tokenType = params.get('token_type');
			const expiresIn = params.get('expires_in');
			const scope = params.get('scope');
			const state = params.get('state');
			const idToken = params.get('id_token');

			// Validate required parameters for token response
			if (!accessToken && !idToken) {
				errors.push('Missing access_token or id_token in fragment response');
			}

			if (accessToken && !tokenType) {
				errors.push('Missing token_type parameter - required when access_token is present');
			}

			if (tokenType && tokenType.toLowerCase() !== 'bearer') {
				warnings.push(`Unexpected token_type: ${tokenType} - typically should be "Bearer"`);
			}

			// Validate expires_in format
			if (expiresIn) {
				const expiresInNum = parseInt(expiresIn, 10);
				if (Number.isNaN(expiresInNum) || expiresInNum <= 0) {
					errors.push('Invalid expires_in parameter - must be positive integer');
				} else if (expiresInNum > 86400) {
					warnings.push('expires_in is greater than 24 hours - unusually long for implicit flow');
				} else if (expiresInNum < 300) {
					warnings.push('expires_in is less than 5 minutes - very short token lifetime');
				}
			}

			// Build token response
			const tokens: ImplicitFlowTokenResponse = {
				access_token: accessToken || '',
				token_type: tokenType || 'Bearer',
			};

			if (expiresIn) {
				tokens.expires_in = parseInt(expiresIn, 10);
			}

			if (scope) {
				tokens.scope = scope;
			}

			if (state) {
				tokens.state = state;
			}

			if (idToken) {
				tokens.id_token = idToken;
			}

			return {
				valid: errors.length === 0,
				tokens,
				errors,
				warnings,
			};
		} catch (error) {
			errors.push(
				`Fragment parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
			return { valid: false, errors };
		}
	}

	/**
	 * Validate implicit flow token response per RFC 6749 Section 4.2.2
	 */
	validateImplicitTokenResponse(
		tokens: ImplicitFlowTokenResponse,
		expectedState?: string,
		requestedScope?: string
	): ImplicitTokenValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Validate state parameter (CSRF protection)
		if (expectedState) {
			if (!tokens.state) {
				errors.push('Missing state parameter in token response - CSRF protection failed');
			} else if (tokens.state !== expectedState) {
				errors.push('State parameter mismatch - possible CSRF attack');
			}
		} else if (tokens.state) {
			warnings.push('Received state parameter but no expected state provided');
		}

		// Validate access token
		if (tokens.access_token) {
			const tokenValidation = this.oauth2Service.validateAccessToken(tokens.access_token);
			if (!tokenValidation.valid) {
				errors.push(...tokenValidation.errors);
			}
			warnings.push(...(tokenValidation.warnings || []));
		}

		// Validate token type
		if (tokens.token_type && tokens.token_type.toLowerCase() !== 'bearer') {
			warnings.push(`Non-standard token_type: ${tokens.token_type}`);
		}

		// Validate expires_in
		if (tokens.expires_in !== undefined) {
			if (tokens.expires_in <= 0) {
				errors.push('Invalid expires_in: must be positive');
			} else if (tokens.expires_in > 86400) {
				warnings.push('Token expires in more than 24 hours - unusually long for implicit flow');
			} else if (tokens.expires_in < 300) {
				warnings.push('Token expires in less than 5 minutes - very short lifetime');
			}
		}

		// Validate scope
		if (requestedScope && tokens.scope) {
			const requestedScopes = new Set(requestedScope.split(' '));
			const grantedScopes = new Set(tokens.scope.split(' '));

			// Check if granted scopes are a subset of requested scopes
			for (const grantedScope of grantedScopes) {
				if (!requestedScopes.has(grantedScope)) {
					warnings.push(`Granted scope "${grantedScope}" was not requested`);
				}
			}
		}

		// Security warnings for implicit flow
		warnings.push(
			'Implicit flow tokens are exposed in URL fragment - consider authorization code flow for enhanced security'
		);

		if (tokens.access_token && !tokens.expires_in) {
			warnings.push('No expires_in provided - token lifetime unknown');
		}

		return {
			valid: errors.length === 0,
			tokenInfo: {
				accessToken: tokens.access_token,
				idToken: tokens.id_token,
				tokenType: tokens.token_type,
				expiresIn: tokens.expires_in,
				scope: tokens.scope,
				state: tokens.state,
			},
			errors,
			warnings,
		};
	}

	/**
	 * Generate authorization URL for implicit flow
	 */
	generateImplicitAuthorizationUrl(
		authEndpoint: string,
		params: ImplicitFlowAuthorizationRequest
	): string {
		// Validate parameters first
		const validation = this.validateImplicitAuthorizationRequest(params);
		if (!validation.valid) {
			throw new Error(`Invalid authorization request: ${validation.errors.join(', ')}`);
		}

		// Build URL parameters
		const urlParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value) {
				urlParams.set(key, value.toString());
			}
		});

		return `${authEndpoint}?${urlParams.toString()}`;
	}

	/**
	 * Generate secure state parameter for implicit flow
	 */
	generateSecureState(): string {
		return this.oauth2Service.generateSecureState();
	}

	/**
	 * Validate state parameter using constant-time comparison
	 */
	async validateState(receivedState: string, expectedState: string): Promise<boolean> {
		return this.oauth2Service.validateState(receivedState, expectedState);
	}

	/**
	 * Get security headers for implicit flow responses
	 */
	getImplicitFlowSecurityHeaders(): Record<string, string> {
		return {
			...this.oauth2Service.getSecurityHeaders(),
			'X-Frame-Options': 'DENY', // Prevent clickjacking
			'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
		};
	}

	/**
	 * Create implicit flow error response
	 */
	createImplicitErrorResponse(error: string, description?: string, state?: string): string {
		const params = new URLSearchParams();
		params.set('error', error);

		if (description) {
			params.set('error_description', description);
		}

		if (state) {
			params.set('state', state);
		}

		return `#${params.toString()}`;
	}

	/**
	 * Validate complete implicit flow
	 */
	validateImplicitFlow(
		authRequest: ImplicitFlowAuthorizationRequest,
		tokenResponse: ImplicitFlowTokenResponse,
		expectedState?: string
	): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Validate authorization request
		const authValidation = this.validateImplicitAuthorizationRequest(authRequest);
		errors.push(...authValidation.errors);
		warnings.push(...(authValidation.warnings || []));

		// Validate token response
		const tokenValidation = this.validateImplicitTokenResponse(
			tokenResponse,
			expectedState,
			authRequest.scope
		);
		errors.push(...tokenValidation.errors);
		warnings.push(...(tokenValidation.warnings || []));

		// Additional flow-level validations
		if (authRequest.response_type === 'token' && !tokenResponse.access_token) {
			errors.push('Missing access_token for response_type=token');
		}

		if (authRequest.response_type.includes('id_token') && !tokenResponse.id_token) {
			errors.push('Missing id_token for response_type including id_token');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

// Export singleton instance
export const implicitFlowComplianceService = new ImplicitFlowComplianceService();

// Export types for use in other modules
export type {
	ImplicitFlowAuthorizationRequest,
	ImplicitFlowTokenResponse,
	FragmentParseResult,
	ImplicitTokenValidationResult,
};
