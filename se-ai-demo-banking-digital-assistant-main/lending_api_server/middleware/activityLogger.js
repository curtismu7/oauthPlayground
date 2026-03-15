/**
 * Activity logging middleware for comprehensive request/response tracking
 * Logs all API requests, responses, and user activities for audit purposes
 */

const { logger } = require('../utils/logger');

/**
 * Middleware to log all incoming requests and outgoing responses
 */
function activityLogger(req, res, next) {
  const startTime = Date.now();
  
  // Extract user information from token if available
  const userId = req.user?.sub || req.user?.id || 'anonymous';
  const userEmail = req.user?.email || 'unknown';
  const userScopes = req.user?.scope || [];

  // Log incoming request
  logger.logApiRequest(req.method, req.path, userId, {
    user_email: userEmail,
    user_scopes: userScopes,
    user_agent: req.get('User-Agent'),
    ip_address: req.ip || req.connection.remoteAddress,
    query_params: req.query,
    request_id: req.id || generateRequestId()
  });

  // Store original res.json to intercept response
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Override res.json to capture response data
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.logApiResponse(req.method, req.path, res.statusCode, responseTime, {
      user_id: userId,
      user_email: userEmail,
      response_size: JSON.stringify(data).length,
      request_id: req.id || generateRequestId()
    });

    // Log performance warning if response is slow
    if (responseTime > 2000) {
      logger.logPerformanceMetric(`${req.method} ${req.path}`, responseTime, {
        user_id: userId,
        status_code: res.statusCode,
        slow_response: true
      });
    }

    return originalJson.call(this, data);
  };

  // Override res.send for non-JSON responses
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    logger.logApiResponse(req.method, req.path, res.statusCode, responseTime, {
      user_id: userId,
      user_email: userEmail,
      response_size: typeof data === 'string' ? data.length : 0,
      request_id: req.id || generateRequestId()
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware specifically for credit-related operations
 */
function creditActivityLogger(req, res, next) {
  const userId = req.params.userId || req.user?.sub || req.user?.id;
  const accessedBy = req.user?.sub || req.user?.id || 'system';
  
  // Log credit data access
  if (req.path.includes('/credit/')) {
    const dataType = req.path.includes('/score') ? 'credit_score' :
                     req.path.includes('/limit') ? 'credit_limit' :
                     req.path.includes('/assessment') ? 'credit_assessment' : 'credit_data';
    
    logger.logCreditDataAccess(userId, dataType, accessedBy, {
      endpoint: req.path,
      method: req.method,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress
    });
  }

  next();
}

/**
 * Middleware for user operations logging
 */
function userActivityLogger(req, res, next) {
  const userId = req.params.id || req.params.userId || req.user?.sub || req.user?.id;
  const accessedBy = req.user?.sub || req.user?.id || 'system';
  
  // Log user data access
  if (req.path.includes('/users/')) {
    logger.logActivityEvent('user_data_access', userId, {
      accessed_by: accessedBy,
      endpoint: req.path,
      method: req.method,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress
    });
  }

  next();
}

/**
 * Middleware for admin operations logging
 */
function adminActivityLogger(req, res, next) {
  const adminUserId = req.user?.sub || req.user?.id || 'unknown_admin';
  
  // Log admin operations
  if (req.path.includes('/admin/')) {
    logger.logSecurityEvent('admin_access', 'medium', {
      admin_user_id: adminUserId,
      admin_email: req.user?.email,
      endpoint: req.path,
      method: req.method,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress,
      admin_scopes: req.user?.scope || []
    });
  }

  next();
}

/**
 * Error logging middleware
 */
function errorLogger(err, req, res, next) {
  const userId = req.user?.sub || req.user?.id || 'anonymous';
  
  logger.logErrorHandling(err.name || 'UnknownError', {
    error_message: err.message,
    error_stack: err.stack,
    user_id: userId,
    endpoint: req.path,
    method: req.method,
    status_code: err.status || 500,
    user_agent: req.get('User-Agent'),
    ip_address: req.ip || req.connection.remoteAddress
  });

  next(err);
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request ID middleware to add unique ID to each request
 */
function requestIdMiddleware(req, res, next) {
  req.id = generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
}

module.exports = {
  activityLogger,
  creditActivityLogger,
  userActivityLogger,
  adminActivityLogger,
  errorLogger,
  requestIdMiddleware
};