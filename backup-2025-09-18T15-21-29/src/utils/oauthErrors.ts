 
import { 
  OAuthErrorCode, 
  OAuthErrorResponse, 
  OAuthErrorOptions, 
  OAuthErrorConstructorOptions,
  OAuthErrorTypes 
} from '../types/oauthErrors';


/**
 * OAuthError class for consistent error handling
 */
class OAuthError extends Error {
  public readonly code: OAuthErrorCode;
  public readonly description: string;
  public readonly uri: string;
  public readonly originalError: Error | undefined;
  public readonly state: string | undefined;

  /**
   * Create a new OAuthError
   * @param code - Error code from OAuthErrorTypes
   * @param message - Human-readable error message
   * @param options - Additional error options
   */
  constructor(
    code: OAuthErrorCode, 
    message: string, 
    options: OAuthErrorConstructorOptions = {}
  ) {
    super(message);
    this.name = 'OAuthError';
    this.code = code;
    this.description = options.description ?? '';
    this.uri = options.uri ?? '';
    this.state = options.state;
    this.originalError = options.originalError;
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OAuthError);
    }
  }
  
  /**
   * Convert error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  toJSON(): OAuthErrorResponse & { original_error?: string } {
    return {
      error: this.code,
      error_description: this.description || this.message,
      error_uri: this.uri,
      ...(this.state && { state: this.state }),
      ...(this.originalError && { 
        original_error: this.originalError instanceof Error 
          ? this.originalError.toString() 
          : String(this.originalError) 
      })
    };
  }
  
  /**
   * Create an OAuthError from an error response object
   * @param error - Error response object or string
   * @param options - Additional options
   * @returns New OAuthError instance
   */
  static fromErrorResponse(
    error: Partial<OAuthErrorResponse> | string | unknown, 
    options: Omit<OAuthErrorConstructorOptions, 'description' | 'uri'> & { originalError?: unknown } = {}
  ): OAuthError {
    // Handle string errors
    if (typeof error === 'string') {
      const errorOptions: OAuthErrorConstructorOptions = {};
      
      if (options.originalError instanceof Error) {
        errorOptions.originalError = options.originalError;
      }
      
      return new OAuthError(
        OAuthErrorTypes.UNKNOWN_ERROR, 
        error,
        errorOptions
      );
    }
    
    // Handle Error instances
    if (error instanceof Error) {
      return new OAuthError(
        OAuthErrorTypes.UNKNOWN_ERROR,
        error.message,
        { 
          ...options,
          originalError: error 
        }
      );
    }
    
    // Handle error objects with OAuth error response structure
    const errorObj = error as Partial<OAuthErrorResponse>;
    const code = (errorObj.error as OAuthErrorCode) || OAuthErrorTypes.UNKNOWN_ERROR;
    const message = errorObj.error_description || 'An unknown error occurred';
    
    const errorOptions: OAuthErrorConstructorOptions = {
      description: errorObj.error_description,
      uri: errorObj.error_uri,
      state: errorObj.state
    };
    
    if (options.originalError instanceof Error) {
      errorOptions.originalError = options.originalError;
    }
    if (error instanceof Error) {
      errorOptions.originalError = error;
    }
    
    return new OAuthError(code, message, errorOptions);
  }
  
  /**
   * Check if an error is an OAuthError
   * @param error - The error to check
   * @returns True if the error is an OAuthError
   */
  static isOAuthError(error: unknown): error is OAuthError {
    if (error instanceof OAuthError) {
      return true;
    }
    
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    
    const err = error as Record<string, unknown>;
    return (
      'code' in err &&
      'description' in err &&
      'uri' in err &&
      typeof err.code === 'string' &&
      Object.values(OAuthErrorTypes).includes(err.code as OAuthErrorCode)
    );
  }
}

/**
 * Create a new OAuthError with a standard message
 * @param code - Error code from OAuthErrorTypes
 * @param options - Additional options
 * @returns New OAuthError instance
 */
function createOAuthError(
  code: OAuthErrorCode, 
  options: OAuthErrorOptions = {}
): OAuthError {
  // Default error messages for standard OAuth error codes
  // Use type assertion since we know all OAuthErrorCode values are covered
  const defaultMessages = {
    [OAuthErrorTypes.INVALID_REQUEST]: 'The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.',
    [OAuthErrorTypes.UNAUTHORIZED_CLIENT]: 'The client is not authorized to request an access token using this method.',
    [OAuthErrorTypes.ACCESS_DENIED]: 'The resource owner or authorization server denied the request.',
    [OAuthErrorTypes.UNSUPPORTED_RESPONSE_TYPE]: 'The authorization server does not support obtaining an access token using this method.',
    [OAuthErrorTypes.INVALID_SCOPE]: 'The requested scope is invalid, unknown, or malformed.',
    [OAuthErrorTypes.SERVER_ERROR]: 'The authorization server encountered an unexpected condition that prevented it from fulfilling the request.',
    [OAuthErrorTypes.TEMPORARILY_UNAVAILABLE]: 'The authorization server is currently unable to handle the request due to a temporary overloading or maintenance of the server.',
    [OAuthErrorTypes.INVALID_CLIENT]: 'Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).',
    [OAuthErrorTypes.INVALID_GRANT]: 'The provided authorization grant or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.',
    [OAuthErrorTypes.UNSUPPORTED_GRANT_TYPE]: 'The authorization grant type is not supported by the authorization server.',
    [OAuthErrorTypes.INTERACTION_REQUIRED]: 'The authorization server requires end-user interaction of some form to proceed.',
    [OAuthErrorTypes.LOGIN_REQUIRED]: 'The authorization server requires end-user authentication.',
    [OAuthErrorTypes.ACCOUNT_SELECTION_REQUIRED]: 'The end-user is required to select an account.',
    [OAuthErrorTypes.CONSENT_REQUIRED]: 'The authorization server requires end-user consent.',
    [OAuthErrorTypes.INVALID_REQUEST_URI]: 'The request_uri in the authorization request returns an error or contains invalid data.',
    [OAuthErrorTypes.INVALID_REQUEST_OBJECT]: 'The request parameter contains an invalid request object.',
    [OAuthErrorTypes.REQUEST_NOT_SUPPORTED]: 'The authorization server does not support the request parameter.',
    [OAuthErrorTypes.REQUEST_URI_NOT_SUPPORTED]: 'The authorization server does not support the request_uri parameter.',
    [OAuthErrorTypes.REGISTRATION_NOT_SUPPORTED]: 'The authorization server does not support dynamic client registration.',
    [OAuthErrorTypes.INVALID_CODE_CHALLENGE]: 'The code challenge is invalid.',
    [OAuthErrorTypes.INVALID_CODE_CHALLENGE_METHOD]: 'The code challenge method is not supported.',
    [OAuthErrorTypes.CONFIGURATION_ERROR]: 'There was an error in the OAuth configuration.',
    [OAuthErrorTypes.NETWORK_ERROR]: 'A network error occurred while making the request.',
    [OAuthErrorTypes.TIMEOUT_ERROR]: 'The request timed out.',
    [OAuthErrorTypes.UNKNOWN_ERROR]: 'An unknown error occurred.',
    [OAuthErrorTypes.INVALID_TOKEN]: 'The access token provided is expired, revoked, malformed, or invalid for other reasons.',
    [OAuthErrorTypes.TOKEN_EXPIRED]: 'The access token has expired.',
    [OAuthErrorTypes.INVALID_STATE]: 'The state parameter is missing or invalid.',
    [OAuthErrorTypes.INVALID_NONCE]: 'The nonce parameter is missing or invalid.',
    [OAuthErrorTypes.MISSING_PARAMETER]: 'A required parameter is missing.',
    [OAuthErrorTypes.INVALID_REDIRECT_URI]: 'The redirect URI is missing or does not match a pre-registered value.',
    [OAuthErrorTypes.UNSUPPORTED_FLOW]: 'The requested OAuth flow is not supported.',
    [OAuthErrorTypes.USER_CANCELLED]: 'The user cancelled the authorization request.',
  };

  const message = defaultMessages[code] || 'An unknown OAuth error occurred';
  
  const errorOptions: OAuthErrorConstructorOptions = {
    description: options.description,
    uri: options.uri,
    state: options.state
  };
  
  if (options.originalError instanceof Error) {
    errorOptions.originalError = options.originalError;
  }
  
  return new OAuthError(code, message, errorOptions);
}

/**
 * Handle an error and return an OAuthError
 * @param error - The error to handle
 * @param options - Additional options
 * @returns The processed OAuthError
 */
function handleOAuthError(
  error: unknown, 
  { defaultCode = OAuthErrorTypes.UNKNOWN_ERROR }: { defaultCode?: OAuthErrorCode } = {}
): OAuthError {
  // If it's already an OAuthError, return it as is
  if (OAuthError.isOAuthError(_error)) {
    return error;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return new OAuthError(defaultCode, _error);
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
      return new OAuthError(OAuthErrorTypes.NETWORK_ERROR, 'A network error occurred', {
        originalError: error
      });
    }
    
    // Check for timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return new OAuthError(OAuthErrorTypes.TIMEOUT_ERROR, 'The request timed out', {
        originalError: error
      });
    }
    
    // Generic error
    return new OAuthError(defaultCode, error.message, {
      originalError: error
    });
  }
  
  // Handle error objects with code and message properties
  if (error && typeof error === 'object') {
    // Create a custom error object that we can safely work with
    const safeError: Record<string, unknown> = { ...error };
    
    // Handle error response from server (OAuth error format)
    if ('error' in safeError) {
      // Get the error code, defaulting to unknown error if not a valid OAuth error code
      const errorCode = Object.values(OAuthErrorTypes).includes(safeError.error as OAuthErrorCode)
        ? safeError.error as OAuthErrorCode
        : OAuthErrorTypes.UNKNOWN_ERROR;
      
      // Create a properly typed error response
      const errorResponse: OAuthErrorResponse = {
        error: errorCode,
        error_description: safeError.error_description ? String(safeError.error_description) : undefined,
        error_uri: safeError.error_uri ? String(safeError.error_uri) : undefined,
        state: safeError.state ? String(safeError.state) : undefined
      };
      
      // Create options with original error if it's an Error instance
      const options: OAuthErrorConstructorOptions = {};
      if (error instanceof Error) {
        options.originalError = error;
      }
      
      return OAuthError.fromErrorResponse(errorResponse, options);
    }
    
    // Handle objects with message property
    if ('message' in safeError && typeof safeError.message === 'string') {
      // If we have a code that matches an OAuth error code, use it
      if ('code' in safeError && typeof safeError.code === 'string' && 
          Object.values(OAuthErrorTypes).includes(safeError.code as OAuthErrorCode)) {
        return new OAuthError(
          safeError.code as OAuthErrorCode,
          safeError.message,
          error instanceof Error ? { originalError: error } : {}
        );
      }
      
      // Fallback to default code
      return new OAuthError(
        defaultCode,
        safeError.message,
        error instanceof Error ? { originalError: error } : {}
      );
    }
  }
  
  // Fallback for unknown error types
  return new OAuthError(defaultCode, 'An unknown error occurred');
}

export {
  OAuthErrorTypes,
  OAuthError,
  createOAuthError,
  handleOAuthError
};

export default OAuthError;
