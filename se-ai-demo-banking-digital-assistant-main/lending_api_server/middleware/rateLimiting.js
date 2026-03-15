const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * Enhanced rate limiting middleware with better error handling and monitoring
 */

// Store for tracking rate limit violations
const rateLimitViolations = new Map();

/**
 * Custom rate limit handler with enhanced logging
 */
const rateLimitHandler = (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'unknown';
  const endpoint = req.path;
  
  // Track violations
  const violationKey = `${clientIP}:${endpoint}`;
  const violations = rateLimitViolations.get(violationKey) || 0;
  rateLimitViolations.set(violationKey, violations + 1);
  
  // Log rate limit violation
  logger.warn('RATE_LIMIT', 'Rate limit exceeded', {
    client_ip: clientIP,
    user_agent: userAgent,
    endpoint: endpoint,
    method: req.method,
    violations_count: violations + 1,
    user_id: req.session?.user?.id || 'anonymous'
  });
  
  // Clean up old violations (older than 1 hour)
  setTimeout(() => {
    rateLimitViolations.delete(violationKey);
  }, 60 * 60 * 1000);
  
  res.status(429).json({
    error: 'rate_limit_exceeded',
    error_description: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString(),
    endpoint: endpoint,
    method: req.method
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req) => {
  // Skip for health checks in test environment
  if (process.env.NODE_ENV === 'test' && req.path === '/api/healthz') {
    return true;
  }
  
  // Skip for internal health monitoring
  if (req.get('User-Agent')?.includes('health-monitor')) {
    return true;
  }
  
  return false;
};

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on environment and user type
    if (process.env.NODE_ENV === 'development') {
      return 500; // Higher limit for development
    }
    
    if (process.env.NODE_ENV === 'test') {
      return 10000; // Very high limit for testing
    }
    
    // Production limits based on user role
    const userRole = req.session?.user?.role;
    switch (userRole) {
      case 'admin':
        return 200; // Higher limit for admins
      case 'lending_officer':
        return 100; // Standard limit for lending officers
      default:
        return 50; // Lower limit for unauthenticated users
    }
  },
  message: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipRateLimit,
  keyGenerator: (req) => {
    // Use IP + user ID for authenticated users, just IP for anonymous
    const baseKey = req.ip || req.connection.remoteAddress;
    const userId = req.session?.user?.id;
    return userId ? `${baseKey}:${userId}` : baseKey;
  },
  // onLimitReached is deprecated in express-rate-limit v7
  // Using handler function instead for logging
});

/**
 * Strict rate limiter for OAuth endpoints
 */
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 20, // Lower limit for OAuth
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  // onLimitReached is deprecated in express-rate-limit v7
  // Using handler function instead for logging
});

/**
 * Very strict rate limiter for admin endpoints
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 30, // Very low limit for admin
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const baseKey = req.ip || req.connection.remoteAddress;
    const userId = req.session?.user?.id;
    return userId ? `admin:${baseKey}:${userId}` : `admin:${baseKey}`;
  },
  onLimitReached: (req, res, options) => {
    logger.error('RATE_LIMIT', 'Admin rate limit reached - security alert', {
      client_ip: req.ip,
      endpoint: req.path,
      method: req.method,
      user_id: req.session?.user?.id || 'anonymous',
      user_agent: req.get('User-Agent'),
      limit: options.max
    });
  }
});

/**
 * Get rate limiting statistics
 */
const getRateLimitStats = () => {
  const stats = {
    total_violations: rateLimitViolations.size,
    violations_by_endpoint: {},
    violations_by_ip: {}
  };
  
  for (const [key, count] of rateLimitViolations.entries()) {
    const [ip, endpoint] = key.split(':');
    
    if (!stats.violations_by_endpoint[endpoint]) {
      stats.violations_by_endpoint[endpoint] = 0;
    }
    stats.violations_by_endpoint[endpoint] += count;
    
    if (!stats.violations_by_ip[ip]) {
      stats.violations_by_ip[ip] = 0;
    }
    stats.violations_by_ip[ip] += count;
  }
  
  return stats;
};

module.exports = {
  generalLimiter,
  oauthLimiter,
  adminLimiter,
  getRateLimitStats,
  rateLimitHandler
};