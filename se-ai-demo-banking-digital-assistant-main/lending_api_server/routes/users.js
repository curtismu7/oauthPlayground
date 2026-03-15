const express = require('express');
const router = express.Router();
const lendingDataStore = require('../data/store');
const { logger, LOG_CATEGORIES } = require('../utils/logger');
const { 
  authenticateToken, 
  requireScopes, 
  requireAdmin,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');
const { LENDING_SCOPES } = require('../config/scopes');
const { 
  OAuthError, 
  OAUTH_ERROR_TYPES 
} = require('../middleware/oauthErrorHandler');

// Utility function to sanitize user data for response
const sanitizeUserData = (user, includeFullProfile = false) => {
  if (!user) return null;
  
  const sanitized = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  // Include full profile data for authorized requests
  if (includeFullProfile) {
    sanitized.dateOfBirth = user.dateOfBirth;
    sanitized.address = user.address;
    sanitized.employment = user.employment;
    // Never include SSN in API responses
  }
  
  return sanitized;
};

// Utility function to log user access
const logUserAccess = async (action, userId, requestContext, details = {}) => {
  try {
    await lendingDataStore.createActivityLog({
      userId: userId,
      action: action,
      endpoint: requestContext.path,
      timestamp: new Date(),
      ipAddress: requestContext.ip,
      userAgent: requestContext.userAgent,
      details: {
        requestedBy: requestContext.userId,
        ...details
      }
    });
  } catch (error) {
    logger.error(LOG_CATEGORIES.AUDIT, 'Failed to log user access', {
      action,
      userId,
      error: error.message
    });
  }
};

// GET /api/users - List all users (admin only)
router.get('/', 
  authenticateToken,
  requireScopes([LENDING_SCOPES.READ]),
  requireAdmin,
  async (req, res) => {
    const requestContext = {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    try {
      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Admin user list request', {
        ...requestContext,
        requestedBy: req.user.username
      });

      // Get all users from data store
      const users = lendingDataStore.getAllUsers();
      
      // Sanitize user data for response and include credit information
      const sanitizedUsers = users.map(user => {
        const sanitizedUser = sanitizeUserData(user, true);
        
        // Add credit information
        const creditScore = lendingDataStore.getCreditScoreByUserId(user.id);
        const creditLimit = lendingDataStore.getCreditLimitByUserId(user.id);
        
        return {
          ...sanitizedUser,
          creditScore: creditScore ? creditScore.score : null,
          creditLimit: creditLimit ? creditLimit.approvedLimit : null
        };
      });
      
      // Log audit event for user data access
      logger.logActivityEvent('user_list_access', req.user?.sub || req.user?.id, {
        user_count: users.length,
        admin_access: true,
        endpoint: req.path
      });

      // Log the access
      await logUserAccess('USER_LIST_ACCESS', 'all', requestContext, {
        userCount: users.length
      });

      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'User list retrieved successfully', {
        ...requestContext,
        userCount: users.length
      });

      res.json({
        users: sanitizedUsers,
        count: sanitizedUsers.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(LOG_CATEGORIES.USER_MANAGEMENT, 'Error retrieving user list', {
        ...requestContext,
        error: error.message
      });

      res.status(500).json({
        error: 'internal_server_error',
        error_description: 'Failed to retrieve user list',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }
);

// GET /api/users/me - Get current user profile
router.get('/me', 
  authenticateToken,
  requireScopes([LENDING_SCOPES.READ]),
  async (req, res) => {
    const requestContext = {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    try {
      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Current user profile request', {
        ...requestContext,
        username: req.user.username
      });

      // Get user by ID from the authenticated token
      const user = lendingDataStore.getUserById(req.user.id);
      
      if (!user) {
        logger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'Current user not found in data store', {
          ...requestContext,
          tokenUserId: req.user.id
        });

        return res.status(404).json({
          error: 'user_not_found',
          error_description: 'Current user profile not found',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Sanitize user data for response (include full profile for own data)
      const sanitizedUser = sanitizeUserData(user, true);
      
      // Log audit event for user data access
      logger.logActivityEvent('user_profile_access', user.id, {
        access_type: 'self',
        endpoint: req.path
      });

      // Log the access
      await logUserAccess('USER_PROFILE_ACCESS', user.id, requestContext, {
        accessType: 'self'
      });

      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Current user profile retrieved successfully', {
        ...requestContext,
        userId: user.id
      });

      res.json({
        user: sanitizedUser,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(LOG_CATEGORIES.USER_MANAGEMENT, 'Error retrieving current user profile', {
        ...requestContext,
        error: error.message
      });

      res.status(500).json({
        error: 'internal_server_error',
        error_description: 'Failed to retrieve user profile',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }
);

// GET /api/users/:id - Get specific user profile
router.get('/:id', 
  authenticateToken,
  requireScopes([LENDING_SCOPES.READ]),
  async (req, res) => {
    const { id } = req.params;
    const requestContext = {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    try {
      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'User profile request', {
        ...requestContext,
        targetUserId: id,
        requestedBy: req.user.username
      });

      // Validate user ID format
      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'User ID is required and cannot be empty',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Get user by ID from data store
      const user = lendingDataStore.getUserById(id);
      
      if (!user) {
        logger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'User not found', {
          ...requestContext,
          targetUserId: id
        });

        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID '${id}' not found`,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Check if user is accessing their own profile or has admin privileges
      const isOwnProfile = req.user.id === id;
      const isAdmin = req.user.role === 'admin' || (req.user.scopes && req.user.scopes.includes(LENDING_SCOPES.ADMIN));
      const includeFullProfile = isOwnProfile || isAdmin;

      // Sanitize user data for response
      const sanitizedUser = sanitizeUserData(user, includeFullProfile);
      
      // Log audit event for user data access
      logger.logActivityEvent('user_profile_access', user.id, {
        access_type: isOwnProfile ? 'self' : 'other',
        full_profile_access: includeFullProfile,
        accessed_by: req.user?.sub || req.user?.id,
        endpoint: req.path
      });

      // Log the access
      await logUserAccess('USER_PROFILE_ACCESS', user.id, requestContext, {
        accessType: isOwnProfile ? 'self' : 'other',
        fullProfileAccess: includeFullProfile
      });

      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'User profile retrieved successfully', {
        ...requestContext,
        targetUserId: id,
        fullProfileAccess: includeFullProfile
      });

      res.json({
        user: sanitizedUser,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(LOG_CATEGORIES.USER_MANAGEMENT, 'Error retrieving user profile', {
        ...requestContext,
        targetUserId: id,
        error: error.message
      });

      res.status(500).json({
        error: 'internal_server_error',
        error_description: 'Failed to retrieve user profile',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }
);

// GET /api/users/search/:query - Search users by name, email, or phone
router.get('/search/:query', 
  authenticateToken,
  requireScopes([LENDING_SCOPES.READ]),
  async (req, res) => {
    const { query } = req.params;
    const requestContext = {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    try {
      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'User search request', {
        ...requestContext,
        searchQuery: query,
        requestedBy: req.user.username
      });

      // Validate search query
      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Search query must be at least 2 characters long',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Perform search using data store utility
      const searchResults = lendingDataStore.searchUsers(query.trim());
      
      // Check if user has admin privileges for full profile access
      const isAdmin = req.user.role === 'admin' || (req.user.scopes && req.user.scopes.includes(LENDING_SCOPES.ADMIN));
      
      // Sanitize search results
      const sanitizedResults = searchResults.map(user => sanitizeUserData(user, isAdmin));
      
      // Log audit event for user search
      logger.logActivityEvent('user_search', req.user?.sub || req.user?.id, {
        search_query: query,
        result_count: searchResults.length,
        endpoint: req.path
      });

      // Log the search
      await logUserAccess('USER_SEARCH', 'multiple', requestContext, {
        searchQuery: query,
        resultCount: searchResults.length
      });

      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'User search completed successfully', {
        ...requestContext,
        searchQuery: query,
        resultCount: searchResults.length
      });

      res.json({
        users: sanitizedResults,
        count: sanitizedResults.length,
        query: query,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(LOG_CATEGORIES.USER_MANAGEMENT, 'Error performing user search', {
        ...requestContext,
        searchQuery: query,
        error: error.message
      });

      res.status(500).json({
        error: 'internal_server_error',
        error_description: 'Failed to perform user search',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }
);

// GET /api/users/:id/summary - Get user summary with basic credit info (lending officers)
router.get('/:id/summary', 
  authenticateToken,
  requireScopes([LENDING_SCOPES.READ, LENDING_SCOPES.CREDIT_READ]),
  async (req, res) => {
    const { id } = req.params;
    const requestContext = {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    try {
      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'User summary request', {
        ...requestContext,
        targetUserId: id,
        requestedBy: req.user.username
      });

      // Validate user ID format
      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'User ID is required and cannot be empty',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Get user by ID from data store
      const user = lendingDataStore.getUserById(id);
      
      if (!user) {
        logger.warn(LOG_CATEGORIES.USER_MANAGEMENT, 'User not found for summary', {
          ...requestContext,
          targetUserId: id
        });

        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID '${id}' not found`,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Get credit information
      const creditScore = lendingDataStore.getCreditScoreByUserId(id);
      const creditLimit = lendingDataStore.getCreditLimitByUserId(id);

      // Create user summary
      const userSummary = {
        user: sanitizeUserData(user, false), // Basic user info only
        creditInfo: {
          hasScore: !!creditScore,
          score: creditScore ? creditScore.score : null,
          scoreDate: creditScore ? creditScore.scoreDate : null,
          hasLimit: !!creditLimit,
          approvedLimit: creditLimit ? creditLimit.approvedLimit : null,
          riskLevel: creditLimit ? creditLimit.riskLevel : null
        }
      };
      
      // Log audit event for user summary access
      logger.logActivityEvent('user_summary_access', user.id, {
        accessed_by: req.user?.sub || req.user?.id,
        has_credit_score: !!creditScore,
        has_credit_limit: !!creditLimit,
        endpoint: req.path
      });

      // Log the access
      await logUserAccess('USER_SUMMARY_ACCESS', user.id, requestContext, {
        hasCreditScore: !!creditScore,
        hasCreditLimit: !!creditLimit
      });

      logger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'User summary retrieved successfully', {
        ...requestContext,
        targetUserId: id,
        hasCreditData: !!creditScore || !!creditLimit
      });

      res.json({
        summary: userSummary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(LOG_CATEGORIES.USER_MANAGEMENT, 'Error retrieving user summary', {
        ...requestContext,
        targetUserId: id,
        error: error.message
      });

      res.status(500).json({
        error: 'internal_server_error',
        error_description: 'Failed to retrieve user summary',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }
);

module.exports = router;