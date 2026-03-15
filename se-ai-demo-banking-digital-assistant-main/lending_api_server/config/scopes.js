// OAuth Scope Configuration for Lending API
// This file defines scope mappings for different environments and user types

const LENDING_SCOPES = {
  // Read scopes
  READ: 'lending:read',
  CREDIT_READ: 'lending:credit:read',
  CREDIT_LIMITS: 'lending:credit:limits',
  
  // Administrative scopes
  ADMIN: 'lending:admin'
};

// User type to scope mappings
const USER_TYPE_SCOPES = {
  // Admin users get full access
  admin: [
    LENDING_SCOPES.ADMIN,
    LENDING_SCOPES.READ,
    LENDING_SCOPES.CREDIT_READ,
    LENDING_SCOPES.CREDIT_LIMITS
  ],
  
  // Lending officers get read and credit access but no admin
  lending_officer: [
    LENDING_SCOPES.READ,
    LENDING_SCOPES.CREDIT_READ,
    LENDING_SCOPES.CREDIT_LIMITS
  ],
  
  // Credit analysts get read and credit score access
  credit_analyst: [
    LENDING_SCOPES.READ,
    LENDING_SCOPES.CREDIT_READ
  ],
  
  // Read-only users get only basic read access
  readonly: [
    LENDING_SCOPES.READ
  ]
};

// Environment-specific scope configurations
const ENVIRONMENT_CONFIGS = {
  development: {
    // Development allows all scopes for testing
    allowedScopes: Object.values(LENDING_SCOPES),
    strictValidation: false,
    debugScopes: true,
    defaultUserType: 'lending_officer',
    scopeValidationTimeout: 5000, // 5 seconds
    cacheTokenValidation: false
  },
  
  test: {
    // Test environment with relaxed validation
    allowedScopes: Object.values(LENDING_SCOPES),
    strictValidation: false,
    debugScopes: true,
    defaultUserType: 'lending_officer',
    scopeValidationTimeout: 1000, // 1 second for fast tests
    cacheTokenValidation: false,
    skipTokenSignatureValidation: true
  },
  
  staging: {
    // Staging environment with production-like settings
    allowedScopes: Object.values(LENDING_SCOPES),
    strictValidation: true,
    debugScopes: false,
    defaultUserType: 'readonly',
    scopeValidationTimeout: 10000, // 10 seconds
    cacheTokenValidation: true,
    cacheTTL: 300 // 5 minutes
  },
  
  production: {
    // Production environment with strict validation
    allowedScopes: Object.values(LENDING_SCOPES),
    strictValidation: true,
    debugScopes: false,
    defaultUserType: 'readonly',
    scopeValidationTimeout: 10000, // 10 seconds
    cacheTokenValidation: true,
    cacheTTL: 600 // 10 minutes
  }
};

// Route-to-scope mapping for lending endpoints
const ROUTE_SCOPE_MAP = {
  // User routes
  'GET /api/users': [LENDING_SCOPES.READ],
  'GET /api/users/me': [LENDING_SCOPES.READ],
  'GET /api/users/:id': [LENDING_SCOPES.READ],
  
  // Credit score routes
  'GET /api/credit/:userId/score': [LENDING_SCOPES.CREDIT_READ, LENDING_SCOPES.READ],
  
  // Credit limit routes
  'GET /api/credit/:userId/limit': [LENDING_SCOPES.CREDIT_LIMITS],
  'GET /api/credit/:userId/assessment': [LENDING_SCOPES.CREDIT_LIMITS],
  
  // Admin routes
  'GET /api/admin/*': [LENDING_SCOPES.ADMIN],
  'POST /api/admin/*': [LENDING_SCOPES.ADMIN],
  'PUT /api/admin/*': [LENDING_SCOPES.ADMIN],
  'DELETE /api/admin/*': [LENDING_SCOPES.ADMIN],
  'POST /api/admin/credit/recalculate': [LENDING_SCOPES.ADMIN]
};

// OAuth provider scope configuration templates
const OAUTH_PROVIDER_SCOPE_CONFIGS = {
  // P1AIC (PingOne Advanced Identity Cloud) scope configuration
  p1aic: {
    // Admin client scopes
    adminClient: {
      defaultScopes: ['openid', 'profile', 'email'],
      lendingScopes: [
        LENDING_SCOPES.ADMIN,
        LENDING_SCOPES.READ,
        LENDING_SCOPES.CREDIT_READ,
        LENDING_SCOPES.CREDIT_LIMITS
      ]
    },
    
    // Lending officer client scopes
    lendingOfficerClient: {
      defaultScopes: ['openid', 'profile', 'email'],
      lendingScopes: [
        LENDING_SCOPES.READ,
        LENDING_SCOPES.CREDIT_READ,
        LENDING_SCOPES.CREDIT_LIMITS
      ]
    },
    
    // Credit analyst client scopes
    creditAnalystClient: {
      defaultScopes: ['openid', 'profile', 'email'],
      lendingScopes: [
        LENDING_SCOPES.READ,
        LENDING_SCOPES.CREDIT_READ
      ]
    }
  }
};

// Get configuration for current environment
const getCurrentEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT_CONFIGS[env] || ENVIRONMENT_CONFIGS.development;
};

// Get scopes for user type
const getScopesForUserType = (userType) => {
  return USER_TYPE_SCOPES[userType] || USER_TYPE_SCOPES.readonly;
};

// Validate scope against environment configuration
const isValidScope = (scope) => {
  const config = getCurrentEnvironmentConfig();
  return config.allowedScopes.includes(scope);
};

// Get OAuth provider configuration
const getOAuthProviderConfig = (provider = 'p1aic') => {
  return OAUTH_PROVIDER_SCOPE_CONFIGS[provider] || OAUTH_PROVIDER_SCOPE_CONFIGS.p1aic;
};

module.exports = {
  LENDING_SCOPES,
  USER_TYPE_SCOPES,
  ENVIRONMENT_CONFIGS,
  ROUTE_SCOPE_MAP,
  OAUTH_PROVIDER_SCOPE_CONFIGS,
  getCurrentEnvironmentConfig,
  getScopesForUserType,
  isValidScope,
  getOAuthProviderConfig
};