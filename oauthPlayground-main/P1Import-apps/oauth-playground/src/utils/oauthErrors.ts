/**
 * OAuth 2.0 Error Types
 * Standard error codes as defined in RFC 6749 and OpenID Connect Core 1.0
 */
const OAuthErrorTypes = {
  // Standard OAuth 2.0 errors (RFC 6749 Section 4.1.2.1, 4.2.2.1, 5.2)
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
  
  // OpenID Connect errors (OpenID Connect Core 1.0 Section 3.1.2.6)
  INTERACTION_REQUIRED: 'interaction_required',
  LOGIN_REQUIRED: 'login_required',
  ACCOUNT_SELECTION_REQUIRED: 'account_selection_required',
  CONSENT_REQUIRED: 'consent_required',
  INVALID_REQUEST_URI: 'invalid_request_uri',
  INVALID_REQUEST_OBJECT: 'invalid_request_object',
  REQUEST_NOT_SUPPORTED: 'request_not_supported',
  REQUEST_URI_NOT_SUPPORTED: 'request_uri_not_supported',
  REGISTRATION_NOT_SUPPORTED: 'registration_not_supported',
  
  // PKCE errors (RFC 7636 Section 4.4.1)
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
};

/**
 * OAuthError class for consistent error handling
 */
class OAuthError extends Error {
  /**
   * Create a new OAuthError
   * @param {string} code - Error code from OAuthErrorTypes
   * @param {string} message - Human-readable error message
   * @param {string} [description] - Additional error details
   * @param {string} [uri] - URI identifying a human-readable web page with information about the error
   * @param {Error} [originalError] - Original error that caused this error
   */
  constructor(code, message, description = '', uri = '', originalError = null) {
    super(message);
    this.name = 'OAuthError';
    this.code = code;
    this.description = description;
    this.uri = uri;
    this.originalError = originalError;
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OAuthError);
    }
  }
  
  /**
   * Convert error to a plain object for serialization
   * @returns {Object} Plain object representation of the error
   */
  toJSON() {
    return {
      error: this.code,
      error_description: this.description || this.message,
      error_uri: this.uri,
      ...(this.originalError && { original_error: this.originalError.toString() })
    };
  }
  
  /**
   * Create an OAuthError from an error response object
   * @param {Object} error - Error response object
   * @param {Error} [originalError] - Original error that caused this error
   * @returns {OAuthError} New OAuthError instance
   */
  static fromErrorResponse(error, originalError = null) {
    const {
      error: code = OAuthErrorTypes.UNKNOWN_ERROR,
      error_description: description = 'An unknown error occurred',
      error_uri: uri = ''
    } = error;
    
    return new OAuthError(code, description, description, uri, originalError);
  }
  
  /**
   * Check if an error is an OAuthError
   * @param {*} error - The error to check
   * @returns {boolean} True if the error is an OAuthError
   */
  static isOAuthError(error) {
    return error instanceof OAuthError || 
           (error && error.name === 'OAuthError');
  }
}

/**
 * Create a new OAuthError with a standard message
 * @param {string} code - Error code from OAuthErrorTypes
 * @param {Object} [options] - Additional options
 * @param {string} [options.description] - Additional error details
 * @param {string} [options.uri] - URI with more information about the error
 * @param {Error} [options.originalError] - Original error that caused this error
 * @returns {OAuthError} New OAuthError instance
 */
const createOAuthError = (code, {
  description = '',
  uri = '',
  originalError = null
} = {}) => {
  // Default error messages for standard error codes
  const errorMessages = {
    [OAuthErrorTypes.INVALID_REQUEST]: 'The request is missing a required parameter or is otherwise malformed',
    [OAuthErrorTypes.UNAUTHORIZED_CLIENT]: 'The client is not authorized to request an authorization code using this method',
    [OAuthErrorTypes.ACCESS_DENIED]: 'The resource owner or authorization server denied the request',
    [OAuthErrorTypes.UNSUPPORTED_RESPONSE_TYPE]: 'The authorization server does not support obtaining an authorization code using this method',
    [OAuthErrorTypes.INVALID_SCOPE]: 'The requested scope is invalid, unknown, or malformed',
    [OAuthErrorTypes.SERVER_ERROR]: 'The authorization server encountered an unexpected condition',
    [OAuthErrorTypes.TEMPORARILY_UNAVAILABLE]: 'The authorization server is currently unable to handle the request',
    [OAuthErrorTypes.INVALID_CLIENT]: 'Client authentication failed',
    [OAuthErrorTypes.INVALID_GRANT]: 'The provided authorization grant or refresh token is invalid, expired, revoked, or does not match the redirection URI',
    [OAuthErrorTypes.UNSUPPORTED_GRANT_TYPE]: 'The authorization grant type is not supported by the authorization server',
    [OAuthErrorTypes.INTERACTION_REQUIRED]: 'The Authorization Server requires end-user interaction',
    [OAuthErrorTypes.LOGIN_REQUIRED]: 'The Authorization Server requires end-user authentication',
    [OAuthErrorTypes.ACCOUNT_SELECTION_REQUIRED]: 'The Authorization Server requires end-user account selection',
    [OAuthErrorTypes.CONSENT_REQUIRED]: 'The Authorization Server requires end-user consent',
    [OAuthErrorTypes.INVALID_REQUEST_URI]: 'The request_uri in the Authorization Request returns an error',
    [OAuthErrorTypes.INVALID_REQUEST_OBJECT]: 'The request parameter contains an invalid Request Object',
    [OAuthErrorTypes.REQUEST_NOT_SUPPORTED]: 'The OP does not support use of the request parameter',
    [OAuthErrorTypes.REQUEST_URI_NOT_SUPPORTED]: 'The OP does not support use of the request_uri parameter',
    [OAuthErrorTypes.REGISTRATION_NOT_SUPPORTED]: 'The OP does not support use of the registration parameter',
    [OAuthErrorTypes.INVALID_CODE_CHALLENGE]: 'The provided code challenge is not valid',
    [OAuthErrorTypes.INVALID_CODE_CHALLENGE_METHOD]: 'The provided code challenge method is not supported',
    [OAuthErrorTypes.CONFIGURATION_ERROR]: 'Invalid or missing OAuth configuration',
    [OAuthErrorTypes.NETWORK_ERROR]: 'A network error occurred',
    [OAuthErrorTypes.TIMEOUT_ERROR]: 'The request timed out',
    [OAuthErrorTypes.UNKNOWN_ERROR]: 'An unknown error occurred',
    [OAuthErrorTypes.INVALID_TOKEN]: 'The provided token is invalid',
    [OAuthErrorTypes.TOKEN_EXPIRED]: 'The provided token has expired',
    [OAuthErrorTypes.INVALID_STATE]: 'Invalid state parameter',
    [OAuthErrorTypes.INVALID_NONCE]: 'Invalid nonce parameter',
    [OAuthErrorTypes.MISSING_PARAMETER]: 'A required parameter is missing',
    [OAuthErrorTypes.INVALID_REDIRECT_URI]: 'Invalid redirect URI',
    [OAuthErrorTypes.UNSUPPORTED_FLOW]: 'The requested OAuth flow is not supported',
    [OAuthErrorTypes.USER_CANCELLED]: 'The user cancelled the authorization request',
  };
  
  const message = errorMessages[code] || 'An unknown error occurred';
  return new OAuthError(code, message, description || message, uri, originalError);
};

/**
 * Handle an error and return an OAuthError
 * @param {Error|Object|string} error - The error to handle
 * @param {Object} [options] - Additional options
 * @param {string} [options.defaultCode] - Default error code if not provided
 * @returns {OAuthError} The processed OAuthError
 */
const handleOAuthError = (error, { defaultCode = OAuthErrorTypes.UNKNOWN_ERROR } = {}) => {
  if (OAuthError.isOAuthError(error)) {
    return error;
  }
  
  if (error && typeof error === 'object') {
    // Handle error response from server
    if (error.error) {
      return OAuthError.fromErrorResponse(error, error);
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      return createOAuthError(OAuthErrorTypes.NETWORK_ERROR, {
        originalError: error
      });
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      return createOAuthError(OAuthErrorTypes.TIMEOUT_ERROR, {
        originalError: error
      });
    }
  }
  
  // Fallback to default error
  return createOAuthError(defaultCode, {
    description: error?.message || String(error),
    originalError: error
  });
};

export {
  OAuthErrorTypes,
  OAuthError,
  createOAuthError,
  handleOAuthError
};

export default OAuthError;
