/**
 * Type definitions for OAuth error handling
 */

export type OAuthErrorCode = 
  // Standard OAuth 2.0 errors (RFC 6749 Section 4.1.2.1, 4.2.2.1, 5.2)
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unsupported_grant_type'
  
  // OpenID Connect errors (OpenID Connect Core 1.0 Section 3.1.2.6)
  | 'interaction_required'
  | 'login_required'
  | 'account_selection_required'
  | 'consent_required'
  | 'invalid_request_uri'
  | 'invalid_request_object'
  | 'request_not_supported'
  | 'request_uri_not_supported'
  | 'registration_not_supported'
  
  // PKCE errors (RFC 7636 Section 4.4.1)
  | 'invalid_code_challenge'
  | 'invalid_code_challenge_method'
  
  // Custom errors for the playground
  | 'configuration_error'
  | 'network_error'
  | 'timeout_error'
  | 'unknown_error'
  | 'invalid_token'
  | 'token_expired'
  | 'invalid_state'
  | 'invalid_nonce'
  | 'missing_parameter'
  | 'invalid_redirect_uri'
  | 'unsupported_flow'
  | 'user_cancelled';

export interface OAuthErrorResponse {
  error: OAuthErrorCode;
  error_description?: string | undefined;
  error_uri?: string | undefined;
  state?: string | undefined;
  [key: string]: unknown;
}

export interface OAuthErrorOptions {
  description?: string;
  uri?: string;
  originalError?: Error | unknown;
  state?: string;
  context?: Record<string, unknown>;
}

export interface TokenValidationError extends Error {
  code: OAuthErrorCode;
  description?: string;
  uri?: string;
  state?: string;
  context?: Record<string, unknown>;
}

/**
 * Creates a standardized error object for OAuth/Token related errors
 */
export function createTokenError(
  code: OAuthErrorCode,
  options: OAuthErrorOptions = {}
): TokenValidationError {
  const { description, uri, originalError, state, context } = options;
  const error = new Error(description || `OAuth Error: ${code}`) as TokenValidationError;
  
  error.code = code;
  error.name = 'TokenValidationError';
  
  if (description) error.description = description;
  if (uri) error.uri = uri;
  if (state) error.state = state;
  if (context) error.context = context;
  
  // Preserve original error stack if available
  if (originalError instanceof Error) {
    error.stack = `${error.stack}\nCaused by: ${originalError.stack}`;
  }
  
  return error;
}

/**
 * Checks if an error is a TokenValidationError
 */
export function isTokenError(error: unknown): error is TokenValidationError {
  return error instanceof Error && 
         'code' in error && 
         typeof (error as TokenValidationError).code === 'string';
}

/**
 * Standard error messages for common token validation errors
 */
export const TokenErrorMessages: Record<OAuthErrorCode, string> = {
  // Standard OAuth 2.0 errors
  invalid_request: 'The request is missing a required parameter',
  unauthorized_client: 'The client is not authorized to request an access token',
  access_denied: 'The resource owner or authorization server denied the request',
  unsupported_response_type: 'The authorization server does not support this response type',
  invalid_scope: 'The requested scope is invalid, unknown, or malformed',
  server_error: 'The authorization server encountered an error',
  temporarily_unavailable: 'The server is temporarily unable to handle the request',
  invalid_client: 'Client authentication failed',
  invalid_grant: 'The provided authorization grant is invalid, expired, or revoked',
  unsupported_grant_type: 'The authorization grant type is not supported',
  
  // OpenID Connect errors
  interaction_required: 'The authorization server requires user interaction',
  login_required: 'The authorization server requires user authentication',
  account_selection_required: 'The user must select an account',
  consent_required: 'The user must provide consent',
  invalid_request_uri: 'The request URI is invalid',
  invalid_request_object: 'The request object is invalid',
  request_not_supported: 'The request is not supported',
  request_uri_not_supported: 'The request URI is not supported',
  registration_not_supported: 'Dynamic client registration is not supported',
  
  // PKCE errors
  invalid_code_challenge: 'The code challenge is invalid',
  invalid_code_challenge_method: 'The code challenge method is not supported',
  
  // Custom errors
  configuration_error: 'There is a configuration error',
  network_error: 'A network error occurred',
  timeout_error: 'The request timed out',
  unknown_error: 'An unknown error occurred',
  invalid_token: 'The access token is invalid or malformed',
  token_expired: 'The access token has expired',
  invalid_state: 'The state parameter is invalid or missing',
  invalid_nonce: 'The nonce is invalid or missing',
  missing_parameter: 'A required parameter is missing',
  invalid_redirect_uri: 'The redirect URI is invalid',
  unsupported_flow: 'The requested flow is not supported',
  user_cancelled: 'The user cancelled the request'
};

export interface OAuthErrorConstructorOptions {
  description?: string | undefined;
  uri?: string | undefined;
  state?: string | undefined;
  originalError?: Error | undefined;
}

export const OAuthErrorTypes: Record<string, OAuthErrorCode> = {
  // Standard OAuth 2.0 errors
  INVALID_REQUEST: 'invalid_request',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  ACCESS_DENIED: 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
  INVALID_SCOPE: 'invalid_scope',
  SERVER_ERROR: 'server_error',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  
  // OpenID Connect errors
  INTERACTION_REQUIRED: 'interaction_required',
  LOGIN_REQUIRED: 'login_required',
  ACCOUNT_SELECTION_REQUIRED: 'account_selection_required',
  CONSENT_REQUIRED: 'consent_required',
  INVALID_REQUEST_URI: 'invalid_request_uri',
  INVALID_REQUEST_OBJECT: 'invalid_request_object',
  REQUEST_NOT_SUPPORTED: 'request_not_supported',
  REQUEST_URI_NOT_SUPPORTED: 'request_uri_not_supported',
  REGISTRATION_NOT_SUPPORTED: 'registration_not_supported',
  
  // PKCE errors
  INVALID_CODE_CHALLENGE: 'invalid_code_challenge',
  INVALID_CODE_CHALLENGE_METHOD: 'invalid_code_challenge_method',
  
  // Custom errors for the playground
  CONFIGURATION_ERROR: 'configuration_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  UNKNOWN_ERROR: 'unknown_error',
  INVALID_TOKEN: 'invalid_token',
  TOKEN_EXPIRED: 'token_expired',
  INVALID_STATE: 'invalid_state',
  INVALID_NONCE: 'invalid_nonce',
  MISSING_PARAMETER: 'missing_parameter',
  INVALID_REDIRECT_URI: 'invalid_redirect_uri',
  UNSUPPORTED_FLOW: 'unsupported_flow',
  USER_CANCELLED: 'user_cancelled',
} as const;
