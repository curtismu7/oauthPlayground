/**
 * Environment-specific configuration management
 */

const environments = {
  development: {
    port: process.env.PORT || 3002,
    logLevel: 'debug',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3003',
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // requests per windowMs
    },
    creditConfig: {
      scoreTTL: parseInt(process.env.CREDIT_SCORE_TTL) || 3600,
      defaultLimit: parseInt(process.env.DEFAULT_CREDIT_LIMIT) || 5000,
      minimumScore: parseInt(process.env.MINIMUM_CREDIT_SCORE) || 600,
      maxLimit: parseInt(process.env.MAX_CREDIT_LIMIT) || 50000
    }
  },

  test: {
    port: process.env.PORT || 3012,
    logLevel: 'error',
    cors: {
      origin: true,
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 10000
    },
    creditConfig: {
      scoreTTL: 60, // Short TTL for testing
      defaultLimit: 1000,
      minimumScore: 500,
      maxLimit: 10000
    }
  },

  production: {
    port: process.env.PORT || 3002,
    logLevel: process.env.LOG_LEVEL || 'info',
    cors: {
      origin: process.env.CORS_ORIGIN || false,
      credentials: true
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    creditConfig: {
      scoreTTL: parseInt(process.env.CREDIT_SCORE_TTL) || 3600,
      defaultLimit: parseInt(process.env.DEFAULT_CREDIT_LIMIT) || 5000,
      minimumScore: parseInt(process.env.MINIMUM_CREDIT_SCORE) || 600,
      maxLimit: parseInt(process.env.MAX_CREDIT_LIMIT) || 50000
    }
  }
};

/**
 * Get configuration for current environment
 * @returns {Object} Environment configuration
 */
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  const config = environments[env];
  
  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }

  return {
    ...config,
    environment: env,
    oauth: {
      issuerUrl: process.env.OAUTH_ISSUER_URL,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET
    },
    security: {
      sessionSecret: process.env.SESSION_SECRET,
      encryptionKey: process.env.ENCRYPTION_KEY
    }
  };
}

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
function validateConfig() {
  const required = [
    'OAUTH_ISSUER_URL',
    'OAUTH_CLIENT_ID',
    'OAUTH_CLIENT_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  getConfig,
  validateConfig,
  environments
};