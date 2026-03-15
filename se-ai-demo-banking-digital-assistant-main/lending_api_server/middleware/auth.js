const oauthConfig = require('../config/oauth');
const { 
  LENDING_SCOPES, 
  USER_TYPE_SCOPES, 
  ROUTE_SCOPE_MAP,
  getCurrentEnvironmentConfig,
  getScopesForUserType,
  isValidScope
} = require('../config/scopes');
const { logger, LOG_CATEGORIES } = require('../utils/logger');
const { 
  OAuthError, 
  OAUTH_ERROR_TYPES, 
  validateTokenWithErrorHandling,
  validateScopesWithErrorHandling
} = require('./oauthErrorHandler');

// Environment configuration
const SKIP_TOKEN_SIGNATURE_VALIDATION = process.env.SKIP_TOKEN_SIGNATURE_VALIDATION === 'true';
const DEBUG_TOKENS = process.env.DEBUG_TOKENS === 'true';
const DEBUG_SCOPES = process.env.DEBUG_SCOPES === 'true';
const LENDING_AUDIENCE = process.env.LENDING_AUDIENCE || 'lending_client';
const DEFAULT_USER_TYPE = process.env.DEFAULT_USER_TYPE || 'lending_officer';

// Get current environment configuration
const envConfig = getCurrentEnvironmentConfig();

if (SKIP_TOKEN_SIGNATURE_VALIDATION) {
  console.warn('⚠️  WARNING: Token signature validation is disabled. This should only be used in development! ⚠️');
}

// Utility function to determine client type from OAuth token scopes
const determineClientType = (oauthToken) => {
  try {
    // Parse JWT payload without verification (just for reading claims)
    const parts = oauthToken.split('.');
    if (parts.length !== 3) {
      return 'unknown';
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload) {
      return 'unknown';
    }
    
    // Check for lending-specific scopes
    if (payload.scope) {
      const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : payload.scope;
      if (scopes.includes(LENDING_SCOPES.ADMIN)) {
        return 'admin';
      } else if (scopes.includes(LENDING_SCOPES.CREDIT_LIMITS)) {
        return 'lending_officer';
      } else if (scopes.includes(LENDING_SCOPES.CREDIT_READ)) {
        return 'credit_analyst';
      }
    }
    
    // Fallback to audience-based detection
    if (payload.aud) {
      const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      
      if (audience.includes(LENDING_AUDIENCE)) {
        return 'lending_user';
      }
    }
    
    // Default to lending user for tokens without specific scopes
    return 'lending_user';
  } catch (error) {
    console.error('Error determining client type from OAuth token:', error.message);
    return 'unknown';
  }
};

// Utility function to determine user type from OAuth token
const determineUserTypeFromToken = (payload) => {
  try {
    // Check for explicit user type in token claims
    if (payload.user_type) {
      return payload.user_type;
    }
    
    // Determine from scopes
    const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : (payload.scope || []);
    
    if (scopes.includes(LENDING_SCOPES.ADMIN)) {
      return 'admin';
    } else if (scopes.includes(LENDING_SCOPES.CREDIT_LIMITS)) {
      return 'lending_officer';
    } else if (scopes.includes(LENDING_SCOPES.CREDIT_READ)) {
      return 'credit_analyst';
    } else if (scopes.includes(LENDING_SCOPES.READ)) {
      return 'readonly';
    }
    
    // Fallback to default user type
    return DEFAULT_USER_TYPE;
  } catch (error) {
    logger.warn(LOG_CATEGORIES.SCOPE_VALIDATION, 'Error determining user type from token', {
      error_message: error.message
    });
    return DEFAULT_USER_TYPE;
  }
};

// Utility function to parse scopes from OAuth token with enhanced logging
const parseTokenScopes = (token, requestContext = {}) => {
  const { method = 'UNKNOWN', path = 'UNKNOWN' } = requestContext;
  
  try {
    // Parse JWT payload without verification (just for reading claims)
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.debug(LOG_CATEGORIES.SCOPE_VALIDATION, 'Invalid token format during scope parsing', {
        method,
        path,
        token_parts: parts.length
      });
      return [];
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload) {
      logger.debug(LOG_CATEGORIES.SCOPE_VALIDATION, 'Failed to decode token payload', {
        method,
        path
      });
      return [];
    }
    
    if (!payload.scope) {
      logger.debug(LOG_CATEGORIES.SCOPE_VALIDATION, 'No scope claim found in token', {
        method,
        path,
        available_claims: Object.keys(payload)
      });
      return [];
    }
    
    let parsedScopes = [];
    
    // Handle both string and array formats
    if (typeof payload.scope === 'string') {
      parsedScopes = payload.scope.split(' ').filter(scope => scope.trim().length > 0);
      logger.debug(LOG_CATEGORIES.SCOPE_VALIDATION, 'Parsed string format scopes', {
        method,
        path,
        raw_scope: payload.scope,
        parsed_scopes: parsedScopes,
        scope_count: parsedScopes.length
      });
    } else if (Array.isArray(payload.scope)) {
      parsedScopes = payload.scope.filter(scope => typeof scope === 'string' && scope.trim().length > 0);
      logger.debug(LOG_CATEGORIES.SCOPE_VALIDATION, 'Parsed array format scopes', {
        method,
        path,
        raw_scope: payload.scope,
        parsed_scopes: parsedScopes,
        scope_count: parsedScopes.length
      });
    } else {
      logger.warn(LOG_CATEGORIES.SCOPE_VALIDATION, 'Unexpected scope format in token', {
        method,
        path,
        scope_type: typeof payload.scope,
        scope_value: JSON.stringify(payload.scope)
      });
    }
    
    // Validate scopes against environment configuration if strict validation is enabled
    if (envConfig.strictValidation) {
      const validScopes = parsedScopes.filter(scope => isValidScope(scope));
      const invalidScopes = parsedScopes.filter(scope => !isValidScope(scope));
      
      if (invalidScopes.length > 0) {
        logger.warn(LOG_CATEGORIES.SCOPE_VALIDATION, 'Invalid scopes found in token', {
          method,
          path,
          invalid_scopes: invalidScopes,
          valid_scopes: validScopes
        });
      }
      
      return validScopes;
    }
    
    return parsedScopes;
  } catch (error) {
    logger.error(LOG_CATEGORIES.SCOPE_VALIDATION, 'Error parsing token scopes', {
      method,
      path,
      error_message: error.message,
      token_preview: token.substring(0, 50) + '...'
    });
    return [];
  }
};

// Utility function to check if user has required scopes
const hasRequiredScopes = (userScopes, requiredScopes, requireAll = false) => {
  if (!Array.isArray(userScopes) || !Array.isArray(requiredScopes)) {
    if (DEBUG_TOKENS) {
      console.log(`🔍 [Scope Check] Invalid input - userScopes: ${Array.isArray(userScopes) ? 'array' : typeof userScopes}, requiredScopes: ${Array.isArray(requiredScopes) ? 'array' : typeof requiredScopes}`);
    }
    return false;
  }
  
  // Check for lending:admin scope - grants access to all endpoints
  if (userScopes.includes(LENDING_SCOPES.ADMIN)) {
    if (DEBUG_TOKENS) {
      console.log(`🔍 [Scope Check] ✅ User has lending:admin scope - access granted to all endpoints`);
    }
    return true;
  }
  
  if (requiredScopes.length === 0) {
    if (DEBUG_TOKENS) {
      console.log(`🔍 [Scope Check] No scopes required - access granted`);
    }
    return true; // No scopes required
  }
  
  if (requireAll) {
    // AND logic - user must have ALL required scopes
    const missingScopes = requiredScopes.filter(scope => !userScopes.includes(scope));
    const hasAllScopes = missingScopes.length === 0;
    
    if (DEBUG_TOKENS) {
      console.log(`🔍 [Scope Check] AND logic - checking if user has ALL required scopes`);
      if (hasAllScopes) {
        console.log(`🔍 [Scope Check] ✅ User has all required scopes`);
      } else {
        console.log(`🔍 [Scope Check] ❌ User missing scopes: [${missingScopes.join(', ')}]`);
      }
    }
    
    return hasAllScopes;
  } else {
    // OR logic - user must have at least ONE of the required scopes
    const matchingScopes = requiredScopes.filter(scope => userScopes.includes(scope));
    const hasAnyScope = matchingScopes.length > 0;
    
    if (DEBUG_TOKENS) {
      console.log(`🔍 [Scope Check] OR logic - checking if user has ANY required scope`);
      if (hasAnyScope) {
        console.log(`🔍 [Scope Check] ✅ User has matching scopes: [${matchingScopes.join(', ')}]`);
      } else {
        console.log(`🔍 [Scope Check] ❌ User has no matching scopes`);
      }
    }
    
    return hasAnyScope;
  }
};

// Middleware function to require specific scopes with enhanced error handling and logging
const requireScopes = (requiredScopes, requireAll = false) => {
  return (req, res, next) => {
    const requestContext = {
      method: req.method,
      path: req.path || req.url,
      userId: req.user?.id || 'anonymous',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    try {
      // Ensure user is authenticated first
      if (!req.user) {
        logger.warn(LOG_CATEGORIES.AUTHORIZATION, 'Scope validation attempted without authenticated user', requestContext);
        
        throw new OAuthError(
          OAUTH_ERROR_TYPES.AUTHENTICATION_REQUIRED,
          'Authentication required to access this resource',
          401,
          { hint: 'Include a valid Bearer token in the Authorization header' }
        );
      }
      
      // Get user scopes from the authenticated user object
      const userScopes = req.user.scopes || [];
      
      // Normalize required scopes to array
      const scopesToCheck = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
      
      logger.debug(LOG_CATEGORIES.SCOPE_VALIDATION, 'Starting scope validation middleware', {
        ...requestContext,
        required_scopes: scopesToCheck,
        user_scopes: userScopes,
        validation_mode: requireAll ? 'all_required' : 'any_required'
      });
      
      // Use enhanced scope validation with detailed error handling
      validateScopesWithErrorHandling(userScopes, scopesToCheck, requireAll, requestContext);
      
      logger.debug(LOG_CATEGORIES.AUTHORIZATION, 'Scope validation successful - access granted', {
        ...requestContext,
        granted_scopes: scopesToCheck
      });
      
      next();
    } catch (error) {
      logger.logAuthorizationAttempt(false, {
        ...requestContext,
        error_type: error.type || 'access_denied',
        error_message: error.message,
        required_scopes: Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes],
        user_scopes: req.user?.scopes || []
      });
      
      // Format and send OAuth error response
      const errorResponse = {
        error: error.type || 'access_denied',
        error_description: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.path || req.url,
        method: req.method
      };
      
      // Add additional OAuth error data
      if (error.additionalData) {
        Object.assign(errorResponse, error.additionalData);
      }
      
      return res.status(error.statusCode || 403).json(errorResponse);
    }
  };
};

// Utility function to decode and log OAuth token information
const logTokenInfo = (token, context = '') => {
  if (!DEBUG_TOKENS) return;
  
  try {
    // Parse JWT without verification (just for reading claims)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log(`🔐 [${context}] Invalid token format`);
      return;
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    if (!header || !payload) {
      console.log(`🔐 [${context}] Failed to decode token`);
      return;
    }
    
    // Determine token type based on claims
    const isP1AICToken = payload.iss && (payload.iss.includes('forgeblocks') || payload.iss.includes('pingidentity'));
    
    const tokenType = isP1AICToken ? 'P1AIC OAUTH' : 'OAUTH';
    
    // Determine client type from scopes and audience for OAuth tokens
    let clientTypeFromToken = 'unknown';
    // Check scopes first
    if (payload.scope) {
      const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : payload.scope;
      if (scopes.includes(LENDING_SCOPES.ADMIN)) {
        clientTypeFromToken = 'admin';
      } else if (scopes.includes(LENDING_SCOPES.CREDIT_LIMITS)) {
        clientTypeFromToken = 'lending_officer';
      } else if (scopes.includes(LENDING_SCOPES.CREDIT_READ)) {
        clientTypeFromToken = 'credit_analyst';
      } else {
        clientTypeFromToken = 'lending_user';
      }
    }
    // Fallback to audience-based detection
    else if (payload.aud) {
      const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (audience.includes(LENDING_AUDIENCE)) {
        clientTypeFromToken = 'lending_user';
      }
    }
    
    console.log(`🔐 [${context}] ${tokenType} Token Information:`);
    console.log(`   Algorithm: ${header.alg}`);
    console.log(`   Type: ${header.typ}`);
    if (header.kid) console.log(`   Key ID: ${header.kid}`);
    
    // OAuth token format
    console.log(`   Subject: ${payload.sub || 'N/A'}`);
    console.log(`   Issuer: ${payload.iss || 'N/A'}`);
    console.log(`   Audience: ${Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud || 'N/A'}`);
    console.log(`   Client Type: ${clientTypeFromToken}`);
    
    if (payload.preferred_username) console.log(`   Username: ${payload.preferred_username}`);
    if (payload.email) console.log(`   Email: ${payload.email}`);
    if (payload.given_name) console.log(`   First Name: ${payload.given_name}`);
    if (payload.family_name) console.log(`   Last Name: ${payload.family_name}`);
    
    // Log roles/permissions
    if (payload.realm_access?.roles) {
      console.log(`   Realm Roles: ${payload.realm_access.roles.join(', ')}`);
    }
    if (payload.resource_access) {
      console.log(`   Resource Access: ${JSON.stringify(payload.resource_access)}`);
    }
    if (payload.scope) {
      console.log(`   Scopes: ${payload.scope}`);
    }
    
    // Common fields
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      const timeUntilExp = expDate.getTime() - now.getTime();
      console.log(`   Expires: ${expDate.toISOString()} (in ${Math.round(timeUntilExp / 1000 / 60)} minutes)`);
    }
    
    if (payload.iat) {
      const iatDate = new Date(payload.iat * 1000);
      console.log(`   Issued At: ${iatDate.toISOString()}`);
    }
    
    // Log any other custom claims not already covered
    const standardClaims = ['sub', 'iss', 'aud', 'exp', 'iat', 'nbf', 'jti', 'preferred_username', 'email', 'given_name', 'family_name', 'realm_access', 'resource_access', 'scope'];
    const customClaims = Object.keys(payload).filter(key => !standardClaims.includes(key));
    if (customClaims.length > 0) {
      console.log(`   Other Claims:`);
      customClaims.forEach(claim => {
        console.log(`     ${claim}: ${JSON.stringify(payload[claim])}`);
      });
    }
    
  } catch (error) {
    console.log(`🔐 [${context}] Error decoding token: ${error.message}`);
  }
};

// Validate P1AIC access token using OAuth introspection with enhanced logging
const validateP1AICToken = async (token, requestContext = {}) => {
  const { method = 'UNKNOWN', path = 'UNKNOWN' } = requestContext;
  
  logger.debug(LOG_CATEGORIES.OAUTH_VALIDATION, 'Starting P1AIC token validation', {
    method,
    path,
    token_length: token ? token.length : 0
  });
  
  try {
    // Skip validation if SKIP_TOKEN_SIGNATURE_VALIDATION is true
    if (SKIP_TOKEN_SIGNATURE_VALIDATION) {
      logger.warn(LOG_CATEGORIES.OAUTH_VALIDATION, 'Skipping token validation for testing', {
        method,
        path,
        environment: process.env.NODE_ENV
      });
      
      // Parse JWT payload without verification (just for reading claims)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new OAuthError(
          OAUTH_ERROR_TYPES.MALFORMED_TOKEN,
          'Invalid token format',
          401
        );
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (!payload) {
        throw new OAuthError(
          OAUTH_ERROR_TYPES.MALFORMED_TOKEN,
          'Failed to decode token payload',
          401
        );
      }
      
      logger.debug(LOG_CATEGORIES.OAUTH_VALIDATION, 'Token validation skipped - using decoded payload', {
        method,
        path,
        subject: payload.sub,
        scopes: payload.scope
      });
      
      return { valid: true, decoded: payload };
    }

    // Use OAuth token introspection for validation (no JWT signature verification)
    const introspectionResult = await validateTokenWithErrorHandling(token, oauthConfig, requestContext);
    
    // Parse the token payload for user information
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new OAuthError(
        OAUTH_ERROR_TYPES.MALFORMED_TOKEN,
        'Invalid token format',
        401
      );
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (!payload) {
      throw new OAuthError(
        OAUTH_ERROR_TYPES.MALFORMED_TOKEN,
        'Failed to decode token payload',
        401
      );
    }
    
    logger.info(LOG_CATEGORIES.OAUTH_VALIDATION, 'Token introspection validation successful', {
      method,
      path,
      subject: payload.sub,
      scopes: payload.scope,
      token_active: introspectionResult.active
    });
    
    return { valid: true, decoded: payload };
  } catch (error) {
    logger.error(LOG_CATEGORIES.OAUTH_VALIDATION, 'Token validation failed', {
      method,
      path,
      error_type: error.type || 'unknown',
      error_message: error.message
    });
    
    // Re-throw OAuth errors as-is
    if (error instanceof OAuthError) {
      throw error;
    }
    
    // Convert other errors to OAuth errors
    const oauthError = new OAuthError(
      OAUTH_ERROR_TYPES.TOKEN_INTROSPECTION_FAILED,
      `Token validation failed: ${error.message}`,
      401
    );
    
    return { 
      valid: false, 
      error: oauthError
    };
  }
};

// Session-based authentication middleware for OAuth flow
const authenticateSession = async (req, res, next) => {
  const requestContext = {
    method: req.method,
    path: req.path || req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  };

  try {
    // Check if user is authenticated via session
    if (!req.session.user || !req.session.oauthTokens?.accessToken) {
      const error = new OAuthError(
        OAUTH_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        'Authentication required - please log in',
        401,
        { hint: 'User session not found or expired' }
      );
      
      logger.logAuthenticationAttempt(false, {
        ...requestContext,
        error_type: OAUTH_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        reason: 'no_session'
      });
      
      throw error;
    }

    // Check if OAuth token is expired
    if (req.session.oauthTokens.expiresAt && Date.now() > req.session.oauthTokens.expiresAt) {
      const error = new OAuthError(
        OAUTH_ERROR_TYPES.TOKEN_EXPIRED,
        'OAuth token has expired',
        401,
        { hint: 'Please refresh your session or log in again' }
      );
      
      logger.logAuthenticationAttempt(false, {
        ...requestContext,
        error_type: OAUTH_ERROR_TYPES.TOKEN_EXPIRED,
        reason: 'token_expired'
      });
      
      throw error;
    }

    // Set user information on request object
    req.user = {
      ...req.session.user,
      scopes: getScopesForUserType(req.session.user.role || DEFAULT_USER_TYPE),
      clientType: req.session.clientType || 'lending_officer'
    };

    logger.logAuthenticationAttempt(true, {
      ...requestContext,
      user_id: req.user.id,
      user_role: req.user.role,
      client_type: req.user.clientType
    });

    next();
  } catch (error) {
    logger.error(LOG_CATEGORIES.AUTHENTICATION, 'Session authentication failed', {
      ...requestContext,
      error_type: error.type || 'unknown',
      error_message: error.message
    });

    if (error instanceof OAuthError) {
      return res.status(error.statusCode).json({
        error: error.type,
        error_description: error.message,
        ...error.details
      });
    }

    return res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Authentication system error'
    });
  }
};

// Verify OAuth tokens with comprehensive logging and monitoring (for API key auth)
const authenticateToken = async (req, res, next) => {
  const requestContext = {
    method: req.method,
    path: req.path || req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  };

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    logger.debug(LOG_CATEGORIES.AUTHENTICATION, 'Starting token authentication', {
      ...requestContext,
      has_auth_header: !!authHeader,
      has_token: !!token
    });

    if (!token) {
      const error = new OAuthError(
        OAUTH_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        'Access token is required',
        401,
        { hint: 'Include a valid Bearer token in the Authorization header' }
      );
      
      logger.logAuthenticationAttempt(false, {
        ...requestContext,
        error_type: OAUTH_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        reason: 'missing_token'
      });
      
      throw error;
    }

    // Log token information for debugging
    if (DEBUG_TOKENS) {
      logTokenInfo(token, `${req.method} ${req.path}`);
    }

    try {
      // Validate OAuth token with enhanced error handling
      const { valid, decoded, error } = await validateP1AICToken(token, requestContext);
      
      if (!valid) {
        logger.error(LOG_CATEGORIES.AUTHENTICATION, 'OAuth token validation failed', {
          ...requestContext,
          error_type: error?.type || 'unknown',
          error_message: error?.message || 'Unknown validation error'
        });
        
        // The error should already be an OAuthError from validateP1AICToken
        throw error;
      }

      // Determine client type from OAuth token audience
      const clientType = determineClientType(token);
      
      // Parse scopes from OAuth token with request context
      const scopes = parseTokenScopes(token, requestContext);
      
      // Determine user type from token payload
      const userType = determineUserTypeFromToken(decoded);

      logger.info(LOG_CATEGORIES.AUTHENTICATION, 'OAuth token authentication successful', {
        ...requestContext,
        subject: decoded.sub,
        username: decoded.preferred_username,
        client_type: clientType,
        user_type: userType,
        scopes: scopes,
        scope_count: scopes.length
      });
      
      // Map OAuth token claims to user model
      req.user = {
        id: decoded.sub,
        username: decoded.preferred_username || decoded.sub,
        email: decoded.email,
        role: decoded.realm_access?.roles?.includes(oauthConfig.adminRole) ? 'admin' : 'user',
        clientType: clientType,
        userType: userType,
        tokenType: 'oauth',
        scopes: scopes // Add parsed scopes to user object
      };
      
      return next();
    } catch (oauthError) {
      logger.error(LOG_CATEGORIES.AUTHENTICATION, 'OAuth token validation error', {
        ...requestContext,
        error_type: oauthError.type || 'unknown',
        error_message: oauthError.message
      });
      
      // Re-throw OAuth errors as-is
      if (oauthError instanceof OAuthError) {
        throw oauthError;
      }
      
      // Convert other errors to OAuth errors
      throw new OAuthError(
        OAUTH_ERROR_TYPES.INVALID_TOKEN,
        'Token validation failed',
        401,
        { 
          hint: 'Ensure your token is valid and not expired',
          details: process.env.NODE_ENV === 'development' ? oauthError.message : undefined
        }
      );
    }
  } catch (error) {
    logger.logAuthenticationAttempt(false, {
      ...requestContext,
      error_type: error.type || 'authentication_failed',
      error_message: error.message,
      status_code: error.statusCode || 401
    });
    
    // Format and send OAuth error response
    const errorResponse = {
      error: error.type || 'authentication_failed',
      error_description: error.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path || req.url,
      method: req.method
    };
    
    // Add additional OAuth error data
    if (error.additionalData) {
      Object.assign(errorResponse, error.additionalData);
    }
    
    return res.status(error.statusCode || 401).json(errorResponse);
  }
};

// Check if user is admin with enhanced error handling and logging
const requireAdmin = (req, res, next) => {
  const requestContext = {
    method: req.method,
    path: req.path || req.url,
    userId: req.user?.id || 'anonymous',
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  };

  try {
    // Ensure user is authenticated first
    if (!req.user) {
      logger.warn(LOG_CATEGORIES.AUTHORIZATION, 'Admin check attempted without authenticated user', requestContext);
      
      throw new OAuthError(
        OAUTH_ERROR_TYPES.AUTHENTICATION_REQUIRED,
        'Authentication required to access this resource',
        401,
        { hint: 'Include a valid Bearer token in the Authorization header' }
      );
    }
    
    logger.debug(LOG_CATEGORIES.AUTHORIZATION, 'Starting admin access check', {
      ...requestContext,
      username: req.user.username,
      user_role: req.user.role,
      token_type: req.user.tokenType
    });
    
    // Check if user has admin role (from user object) OR lending:admin scope
    const userScopes = req.user.scopes || [];
    const hasAdminRole = req.user.role === 'admin';
    const hasAdminScope = userScopes.includes(LENDING_SCOPES.ADMIN);
    
    logger.debug(LOG_CATEGORIES.AUTHORIZATION, 'Checking admin access', {
      ...requestContext,
      user_scopes: userScopes,
      has_admin_role: hasAdminRole,
      has_admin_scope: hasAdminScope
    });
    
    // Grant access if user has admin role OR lending:admin scope
    if (hasAdminRole || hasAdminScope) {
      logger.info(LOG_CATEGORIES.AUTHORIZATION, 'Admin access granted', {
        ...requestContext,
        username: req.user.username,
        access_reason: hasAdminScope ? 'lending:admin scope' : 'admin role'
      });
      
      next();
    } else {
      throw new OAuthError(
        OAUTH_ERROR_TYPES.INSUFFICIENT_SCOPE,
        'Admin access required. User must have admin role or lending:admin scope.',
        403,
        { 
          hint: 'Contact your administrator to grant admin privileges',
          required_access: 'admin role or lending:admin scope'
        }
      );
    }
  } catch (error) {
    logger.logAuthorizationAttempt(false, {
      ...requestContext,
      error_type: error.type || 'access_denied',
      error_message: error.message,
      required_access: 'admin role or lending:admin scope',
      user_role: req.user?.role,
      user_scopes: req.user?.scopes || []
    });
    
    // Format and send OAuth error response
    const errorResponse = {
      error: error.type || 'access_denied',
      error_description: error.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path || req.url,
      method: req.method
    };
    
    // Add additional OAuth error data
    if (error.additionalData) {
      Object.assign(errorResponse, error.additionalData);
    }
    
    return res.status(error.statusCode || 403).json(errorResponse);
  }
};

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (req, res, next) => {
  const { userId } = req.params;
  
  if (req.user.role === 'admin' || req.user.id === userId) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

// Check if token is for lending officer
const requireLendingOfficer = (req, res, next) => {
  const userScopes = req.user.scopes || [];
  if (userScopes.includes(LENDING_SCOPES.CREDIT_LIMITS) || userScopes.includes(LENDING_SCOPES.ADMIN)) {
    next();
  } else {
    res.status(403).json({ error: 'Lending officer access required' });
  }
};

// Check if token is for credit analyst
const requireCreditAnalyst = (req, res, next) => {
  const userScopes = req.user.scopes || [];
  if (userScopes.includes(LENDING_SCOPES.CREDIT_READ) || userScopes.includes(LENDING_SCOPES.ADMIN)) {
    next();
  } else {
    res.status(403).json({ error: 'Credit analyst access required' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireLendingOfficer,
  requireCreditAnalyst,
  requireScopes,
  determineClientType,
  determineUserTypeFromToken,
  parseTokenScopes,
  hasRequiredScopes,
  ROUTE_SCOPE_MAP: ROUTE_SCOPE_MAP // Use the imported ROUTE_SCOPE_MAP from config
};