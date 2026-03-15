const express = require('express');
const router = express.Router();
const creditScoringService = require('../services/CreditScoringService');
const creditLimitService = require('../services/CreditLimitService');
const lendingDataStore = require('../data/store');
const { authenticateToken, requireScopes } = require('../middleware/auth');
const { LENDING_SCOPES } = require('../config/scopes');
const { logger } = require('../utils/logger');

// Middleware to log credit operations
const logCreditOperation = (action) => {
  return async (req, res, next) => {
    try {
      const userId = req.params.userId || req.user?.id;
      const requestingUser = req.user?.id || 'unknown';
      
      await lendingDataStore.createActivityLog({
        userId: userId,
        action: action,
        endpoint: req.originalUrl,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        details: {
          requestedBy: requestingUser,
          method: req.method,
          params: req.params,
          query: req.query
        }
      });
      
      next();
    } catch (error) {
      logger.error('Error logging credit operation', {
        action,
        error: error.message,
        userId: req.params.userId
      });
      next(); // Continue even if logging fails
    }
  };
};

/**
 * GET /api/credit/:userId/score
 * Get credit score for a specific user
 * Requires: lending:credit:read scope
 */
router.get('/:userId/score', 
  authenticateToken,
  requireScopes([LENDING_SCOPES.CREDIT_READ]),
  logCreditOperation('CREDIT_SCORE_REQUEST'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { refresh } = req.query;
      
      // Validate userId parameter
      if (!userId) {
        return res.status(400).json({
          error: 'validation_error',
          error_description: 'User ID is required',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Check if user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Get credit score with optional refresh
      const forceRefresh = refresh === 'true';
      const creditScore = await creditScoringService.getCreditScore(userId, forceRefresh);

      // Log audit event for credit data access
      logger.logCreditDataAccess(userId, 'credit_score', req.user?.sub || req.user?.id, {
        score: creditScore.score,
        force_refresh: forceRefresh,
        endpoint: req.path
      });

      // Log successful retrieval
      logger.info(`Credit score retrieved successfully`, {
        userId,
        score: creditScore.score,
        requestedBy: req.user?.id,
        forceRefresh
      });

      res.json({
        success: true,
        data: {
          userId: creditScore.userId,
          score: creditScore.score,
          scoreDate: creditScore.scoreDate,
          factors: creditScore.factors,
          source: creditScore.source,
          retrievedAt: new Date().toISOString()
        },
        metadata: {
          cached: !forceRefresh && creditScore.source !== 'calculated',
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error retrieving credit score', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      // Determine appropriate error response
      let statusCode = 500;
      let errorCode = 'credit_score_error';
      let errorDescription = 'Failed to retrieve credit score';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorCode = 'user_not_found';
        errorDescription = error.message;
      } else if (error.message.includes('calculation')) {
        statusCode = 422;
        errorCode = 'calculation_error';
        errorDescription = 'Credit score calculation failed';
      }

      res.status(statusCode).json({
        error: errorCode,
        error_description: errorDescription,
        timestamp: new Date().toISOString(),
        path: req.path,
        userId: req.params.userId,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  }
);

/**
 * GET /api/credit/:userId/history
 * Get credit score history for a specific user
 * Requires: lending:credit:read scope
 */
router.get('/:userId/history',
  authenticateToken,
  requireScopes([LENDING_SCOPES.CREDIT_READ]),
  logCreditOperation('CREDIT_SCORE_HISTORY_REQUEST'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      // Validate userId parameter
      if (!userId) {
        return res.status(400).json({
          error: 'validation_error',
          error_description: 'User ID is required',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Check if user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Get credit score history
      const history = creditScoringService.getCreditScoreHistory(userId);
      
      // Apply pagination
      const startIndex = parseInt(offset);
      const limitNum = parseInt(limit);
      const paginatedHistory = history.slice(startIndex, startIndex + limitNum);

      logger.info(`Credit score history retrieved successfully`, {
        userId,
        historyCount: history.length,
        returnedCount: paginatedHistory.length,
        requestedBy: req.user?.id
      });

      res.json({
        success: true,
        data: paginatedHistory.map(score => ({
          id: score.id,
          score: score.score,
          scoreDate: score.scoreDate,
          factors: score.factors,
          source: score.source,
          createdAt: score.createdAt
        })),
        pagination: {
          total: history.length,
          limit: limitNum,
          offset: startIndex,
          hasMore: startIndex + limitNum < history.length
        },
        metadata: {
          userId,
          retrievedAt: new Date().toISOString(),
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error retrieving credit score history', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        error: 'credit_history_error',
        error_description: 'Failed to retrieve credit score history',
        timestamp: new Date().toISOString(),
        path: req.path,
        userId: req.params.userId,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        })
      });
    }
  }
);

/**
 * POST /api/credit/:userId/recalculate
 * Recalculate credit score for a specific user (admin only)
 * Requires: lending:admin scope
 */
router.post('/:userId/recalculate',
  authenticateToken,
  requireScopes([LENDING_SCOPES.ADMIN]),
  logCreditOperation('CREDIT_SCORE_RECALCULATION'),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Validate userId parameter
      if (!userId) {
        return res.status(400).json({
          error: 'validation_error',
          error_description: 'User ID is required',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Check if user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Recalculate credit score
      const newScore = await creditScoringService.recalculateCreditScore(userId);

      // Log audit event for credit calculation
      logger.logCreditCalculation(userId, 'score_recalculation', newScore.score, {
        previous_score: 'unknown', // Could be enhanced to track previous value
        requested_by: req.user?.sub || req.user?.id,
        admin_action: true
      });

      logger.info(`Credit score recalculated successfully`, {
        userId,
        newScore: newScore.score,
        requestedBy: req.user?.id,
        action: 'admin_recalculation'
      });

      res.json({
        success: true,
        message: 'Credit score recalculated successfully',
        data: {
          userId: newScore.userId,
          score: newScore.score,
          scoreDate: newScore.scoreDate,
          factors: newScore.factors,
          source: newScore.source,
          recalculatedAt: new Date().toISOString(),
          recalculatedBy: req.user?.id
        },
        metadata: {
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error recalculating credit score', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        error: 'recalculation_error',
        error_description: 'Failed to recalculate credit score',
        timestamp: new Date().toISOString(),
        path: req.path,
        userId: req.params.userId,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        })
      });
    }
  }
);

/**
 * GET /api/credit/cache/stats
 * Get credit score cache statistics (admin only)
 * Requires: lending:admin scope
 */
router.get('/cache/stats',
  authenticateToken,
  requireScopes([LENDING_SCOPES.ADMIN]),
  async (req, res) => {
    try {
      const stats = creditScoringService.getCacheStats();

      logger.info('Credit score cache statistics retrieved', {
        requestedBy: req.user?.id,
        stats
      });

      res.json({
        success: true,
        data: stats,
        metadata: {
          retrievedAt: new Date().toISOString(),
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error retrieving cache statistics', {
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        error: 'cache_stats_error',
        error_description: 'Failed to retrieve cache statistics',
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        })
      });
    }
  }
);

/**
 * DELETE /api/credit/cache/:userId?
 * Clear credit score cache for specific user or all users (admin only)
 * Requires: lending:admin scope
 */
router.delete('/cache/:userId?',
  authenticateToken,
  requireScopes([LENDING_SCOPES.ADMIN]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      creditScoringService.clearCache(userId);

      const message = userId 
        ? `Credit score cache cleared for user ${userId}`
        : 'Credit score cache cleared for all users';

      logger.info('Credit score cache cleared', {
        userId: userId || 'all',
        requestedBy: req.user?.id
      });

      res.json({
        success: true,
        message,
        metadata: {
          clearedAt: new Date().toISOString(),
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error clearing cache', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        error: 'cache_clear_error',
        error_description: 'Failed to clear cache',
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        })
      });
    }
  }
);

/**
 * GET /api/credit/:userId/limit
 * Get credit limit for a specific user
 * Requires: lending:credit:limits scope
 */
router.get('/:userId/limit',
  authenticateToken,
  requireScopes([LENDING_SCOPES.CREDIT_LIMITS]),
  logCreditOperation('CREDIT_LIMIT_REQUEST'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { refresh } = req.query;
      
      // Validate userId parameter
      if (!userId) {
        return res.status(400).json({
          error: 'validation_error',
          error_description: 'User ID is required',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Check if user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Get credit limit with optional refresh
      const forceRefresh = refresh === 'true';
      const creditLimit = await creditLimitService.getCreditLimit(userId, forceRefresh);

      // Log audit event for credit data access
      logger.logCreditDataAccess(userId, 'credit_limit', req.user?.sub || req.user?.id, {
        calculated_limit: creditLimit.calculatedLimit,
        approved_limit: creditLimit.approvedLimit,
        risk_level: creditLimit.riskLevel,
        force_refresh: forceRefresh,
        endpoint: req.path
      });

      // Log successful retrieval
      logger.info(`Credit limit retrieved successfully`, {
        userId,
        limit: creditLimit.calculatedLimit,
        riskLevel: creditLimit.riskLevel,
        requestedBy: req.user?.id,
        forceRefresh
      });

      res.json({
        success: true,
        data: {
          userId: creditLimit.userId,
          creditScore: creditLimit.creditScore,
          calculatedLimit: creditLimit.calculatedLimit,
          approvedLimit: creditLimit.approvedLimit,
          riskLevel: creditLimit.riskLevel,
          businessRules: creditLimit.businessRules,
          calculatedAt: creditLimit.calculatedAt,
          expiresAt: creditLimit.expiresAt,
          retrievedAt: new Date().toISOString()
        },
        metadata: {
          cached: !forceRefresh,
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error retrieving credit limit', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      // Determine appropriate error response
      let statusCode = 500;
      let errorCode = 'credit_limit_error';
      let errorDescription = 'Failed to retrieve credit limit';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorCode = 'user_not_found';
        errorDescription = error.message;
      } else if (error.message.includes('calculation')) {
        statusCode = 422;
        errorCode = 'calculation_error';
        errorDescription = 'Credit limit calculation failed';
      }

      res.status(statusCode).json({
        error: errorCode,
        error_description: errorDescription,
        timestamp: new Date().toISOString(),
        path: req.path,
        userId: req.params.userId,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  }
);

/**
 * GET /api/credit/:userId/assessment
 * Get comprehensive credit assessment combining score and limit data
 * Requires: lending:credit:limits scope
 */
router.get('/:userId/assessment',
  authenticateToken,
  requireScopes([LENDING_SCOPES.CREDIT_LIMITS]),
  logCreditOperation('CREDIT_ASSESSMENT'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { refresh } = req.query;
      
      // Validate userId parameter
      if (!userId) {
        return res.status(400).json({
          error: 'validation_error',
          error_description: 'User ID is required',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Check if user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Get comprehensive credit assessment
      const forceRefresh = refresh === 'true';
      const assessment = await creditLimitService.getCreditAssessment(userId, forceRefresh);

      // Log audit event for comprehensive credit assessment
      logger.logCreditDataAccess(userId, 'credit_assessment', req.user?.sub || req.user?.id, {
        credit_score: assessment.creditScore.score,
        calculated_limit: assessment.creditLimit.calculatedLimit,
        risk_level: assessment.creditLimit.riskLevel,
        recommendation_approved: assessment.recommendation.approved,
        force_refresh: forceRefresh,
        endpoint: req.path
      });

      // Log successful retrieval
      logger.info(`Credit assessment completed successfully`, {
        userId,
        creditScore: assessment.creditScore.score,
        creditLimit: assessment.creditLimit.calculatedLimit,
        riskLevel: assessment.creditLimit.riskLevel,
        approved: assessment.recommendation.approved,
        requestedBy: req.user?.id,
        forceRefresh
      });

      res.json({
        success: true,
        data: assessment,
        metadata: {
          cached: !forceRefresh,
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error generating credit assessment', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      // Determine appropriate error response
      let statusCode = 500;
      let errorCode = 'credit_assessment_error';
      let errorDescription = 'Failed to generate credit assessment';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorCode = 'user_not_found';
        errorDescription = error.message;
      } else if (error.message.includes('calculation')) {
        statusCode = 422;
        errorCode = 'calculation_error';
        errorDescription = 'Credit assessment calculation failed';
      }

      res.status(statusCode).json({
        error: errorCode,
        error_description: errorDescription,
        timestamp: new Date().toISOString(),
        path: req.path,
        userId: req.params.userId,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  }
);

/**
 * POST /api/credit/:userId/limit/recalculate
 * Recalculate credit limit for a specific user (admin only)
 * Requires: lending:admin scope
 */
router.post('/:userId/limit/recalculate',
  authenticateToken,
  requireScopes([LENDING_SCOPES.ADMIN]),
  logCreditOperation('CREDIT_LIMIT_RECALCULATION'),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Validate userId parameter
      if (!userId) {
        return res.status(400).json({
          error: 'validation_error',
          error_description: 'User ID is required',
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Check if user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'user_not_found',
          error_description: `User with ID ${userId} not found`,
          timestamp: new Date().toISOString(),
          path: req.path
        });
      }

      // Recalculate credit limit
      const newLimit = await creditLimitService.recalculateCreditLimit(userId);

      // Log audit event for credit calculation
      logger.logCreditCalculation(userId, 'limit_recalculation', newLimit.calculatedLimit, {
        risk_level: newLimit.riskLevel,
        credit_score: newLimit.creditScore,
        requested_by: req.user?.sub || req.user?.id,
        admin_action: true
      });

      logger.info(`Credit limit recalculated successfully`, {
        userId,
        newLimit: newLimit.calculatedLimit,
        riskLevel: newLimit.riskLevel,
        requestedBy: req.user?.id,
        action: 'admin_recalculation'
      });

      res.json({
        success: true,
        message: 'Credit limit recalculated successfully',
        data: {
          userId: newLimit.userId,
          creditScore: newLimit.creditScore,
          calculatedLimit: newLimit.calculatedLimit,
          approvedLimit: newLimit.approvedLimit,
          riskLevel: newLimit.riskLevel,
          businessRules: newLimit.businessRules,
          calculatedAt: newLimit.calculatedAt,
          expiresAt: newLimit.expiresAt,
          recalculatedBy: req.user?.id
        },
        metadata: {
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error recalculating credit limit', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        error: 'recalculation_error',
        error_description: 'Failed to recalculate credit limit',
        timestamp: new Date().toISOString(),
        path: req.path,
        userId: req.params.userId,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        })
      });
    }
  }
);

/**
 * GET /api/credit/limits/cache/stats
 * Get credit limit cache statistics (admin only)
 * Requires: lending:admin scope
 */
router.get('/limits/cache/stats',
  authenticateToken,
  requireScopes([LENDING_SCOPES.ADMIN]),
  async (req, res) => {
    try {
      const stats = creditLimitService.getCacheStats();

      logger.info('Credit limit cache statistics retrieved', {
        requestedBy: req.user?.id,
        stats
      });

      res.json({
        success: true,
        data: stats,
        metadata: {
          retrievedAt: new Date().toISOString(),
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error retrieving limit cache statistics', {
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        error: 'cache_stats_error',
        error_description: 'Failed to retrieve cache statistics',
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        })
      });
    }
  }
);

/**
 * DELETE /api/credit/limits/cache/:userId?
 * Clear credit limit cache for specific user or all users (admin only)
 * Requires: lending:admin scope
 */
router.delete('/limits/cache/:userId?',
  authenticateToken,
  requireScopes([LENDING_SCOPES.ADMIN]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      creditLimitService.clearCache(userId);

      const message = userId 
        ? `Credit limit cache cleared for user ${userId}`
        : 'Credit limit cache cleared for all users';

      logger.info('Credit limit cache cleared', {
        userId: userId || 'all',
        requestedBy: req.user?.id
      });

      res.json({
        success: true,
        message,
        metadata: {
          clearedAt: new Date().toISOString(),
          requestId: req.id || Date.now().toString()
        }
      });

    } catch (error) {
      logger.error('Error clearing limit cache', {
        userId: req.params.userId,
        error: error.message,
        stack: error.stack,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        error: 'cache_clear_error',
        error_description: 'Failed to clear cache',
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message 
        })
      });
    }
  }
);

/**
 * GET /api/credit/health
 * Health check endpoint for credit scoring service
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test basic functionality
    const testUserId = '1'; // Use first sample user
    const testUser = lendingDataStore.getUserById(testUserId);
    
    const healthStatus = {
      status: 'healthy',
      service: 'credit-service',
      timestamp: new Date().toISOString(),
      components: {
        dataStore: testUser ? 'healthy' : 'unhealthy',
        scoringCache: 'healthy',
        limitCache: 'healthy',
        scoring: 'healthy',
        limits: 'healthy'
      }
    };

    // Test cache functionality
    try {
      const scoreCacheStats = creditScoringService.getCacheStats();
      const limitCacheStats = creditLimitService.getCacheStats();
      healthStatus.components.scoringCache = 'healthy';
      healthStatus.components.limitCache = 'healthy';
      healthStatus.cacheStats = {
        scoring: scoreCacheStats,
        limits: limitCacheStats
      };
    } catch (error) {
      healthStatus.components.scoringCache = 'unhealthy';
      healthStatus.components.limitCache = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    healthStatus.response_time_ms = responseTime;

    // Determine overall status
    const allHealthy = Object.values(healthStatus.components).every(status => status === 'healthy');
    healthStatus.status = allHealthy ? 'healthy' : 'degraded';

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error('Credit service health check failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(503).json({
      status: 'unhealthy',
      service: 'credit-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;