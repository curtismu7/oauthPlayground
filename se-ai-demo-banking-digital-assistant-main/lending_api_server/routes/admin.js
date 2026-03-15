const express = require('express');
const router = express.Router();
const lendingDataStore = require('../data/store');
const creditScoringService = require('../services/CreditScoringService');
const creditLimitService = require('../services/CreditLimitService');
const { authenticateToken, requireAdmin, requireScopes } = require('../middleware/auth');
const { LENDING_SCOPES } = require('../config/scopes');
const { logger, LOG_CATEGORIES } = require('../utils/logger');

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Apply admin authorization middleware to all admin routes
router.use(requireAdmin);

// Apply admin scope requirement to all admin routes
router.use(requireScopes([LENDING_SCOPES.ADMIN]));

/**
 * @route GET /api/admin/users
 * @desc Get all users with admin privileges
 * @access Admin only
 */
router.get('/users', async (req, res) => {
  const requestContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username
  };

  try {
    logger.info(LOG_CATEGORIES.ADMIN, 'Admin user list request', requestContext);

    // Get query parameters for filtering and pagination
    const {
      page = 1,
      limit = 50,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let users = lendingDataStore.getAllUsers();

    // Apply search filter if provided
    if (search) {
      users = lendingDataStore.searchUsers(search);
      logger.debug(LOG_CATEGORIES.ADMIN, 'Applied search filter', {
        ...requestContext,
        search_query: search,
        filtered_count: users.length
      });
    }

    // Apply active status filter if provided
    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      users = users.filter(user => user.isActive === activeFilter);
      logger.debug(LOG_CATEGORIES.ADMIN, 'Applied active status filter', {
        ...requestContext,
        active_filter: activeFilter,
        filtered_count: users.length
      });
    }

    // Apply sorting
    users.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date fields
      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'dateOfBirth') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string fields
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Remove sensitive information for admin view
    const sanitizedUsers = paginatedUsers.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      employment: user.employment,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive
    }));

    const response = {
      users: sanitizedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length,
        totalPages: Math.ceil(users.length / parseInt(limit)),
        hasNext: endIndex < users.length,
        hasPrev: startIndex > 0
      },
      filters: {
        search: search || null,
        isActive: isActive || null,
        sortBy,
        sortOrder
      }
    };

    logger.info(LOG_CATEGORIES.ADMIN, 'Admin user list retrieved successfully', {
      ...requestContext,
      total_users: users.length,
      returned_users: sanitizedUsers.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(response);
  } catch (error) {
    logger.error(LOG_CATEGORIES.ADMIN, 'Error retrieving admin user list', {
      ...requestContext,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Failed to retrieve user list',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

/**
 * @route GET /api/admin/users/:userId
 * @desc Get detailed user information including credit data
 * @access Admin only
 */
router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const requestContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username,
    target_user_id: userId
  };

  try {
    logger.info(LOG_CATEGORIES.ADMIN, 'Admin user detail request', requestContext);

    const user = lendingDataStore.getUserById(userId);
    if (!user) {
      logger.warn(LOG_CATEGORIES.ADMIN, 'User not found for admin detail request', requestContext);
      return res.status(404).json({
        error: 'user_not_found',
        error_description: 'User not found',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }

    // Get credit assessment data
    const creditAssessment = lendingDataStore.getCreditAssessment(userId);
    const creditScores = lendingDataStore.getCreditScoresByUserId(userId);
    const creditLimits = lendingDataStore.getCreditLimitsByUserId(userId);
    const activityLogs = lendingDataStore.getActivityLogsByUserId(userId);

    // Sanitize user data (remove SSN for security)
    const sanitizedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      employment: user.employment,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive
    };

    const response = {
      user: sanitizedUser,
      creditAssessment,
      creditHistory: {
        scores: creditScores.slice(0, 10), // Last 10 scores
        limits: creditLimits.slice(0, 10)  // Last 10 limits
      },
      activitySummary: {
        totalActivities: activityLogs.length,
        recentActivities: activityLogs.slice(0, 20) // Last 20 activities
      }
    };

    logger.info(LOG_CATEGORIES.ADMIN, 'Admin user detail retrieved successfully', {
      ...requestContext,
      has_credit_assessment: !!creditAssessment,
      credit_scores_count: creditScores.length,
      credit_limits_count: creditLimits.length,
      activities_count: activityLogs.length
    });

    res.json(response);
  } catch (error) {
    logger.error(LOG_CATEGORIES.ADMIN, 'Error retrieving admin user detail', {
      ...requestContext,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Failed to retrieve user details',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

/**
 * @route PUT /api/admin/users/:userId
 * @desc Update user information (admin only)
 * @access Admin only
 */
router.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const requestContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username,
    target_user_id: userId
  };

  try {
    logger.info(LOG_CATEGORIES.ADMIN, 'Admin user update request', requestContext);

    const user = lendingDataStore.getUserById(userId);
    if (!user) {
      logger.warn(LOG_CATEGORIES.ADMIN, 'User not found for admin update', requestContext);
      return res.status(404).json({
        error: 'user_not_found',
        error_description: 'User not found',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }

    // Validate and sanitize update data
    const allowedUpdates = [
      'firstName', 'lastName', 'email', 'phone', 'address', 
      'employment', 'isActive'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'validation_error',
        error_description: 'No valid fields provided for update',
        allowed_fields: allowedUpdates,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }

    const updatedUser = await lendingDataStore.updateUser(userId, updates);

    // Log the update activity
    await lendingDataStore.createActivityLog({
      userId: userId,
      action: 'user_updated_by_admin',
      details: {
        updated_fields: Object.keys(updates),
        admin_user_id: req.user.id,
        admin_username: req.user.username
      },
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    logger.info(LOG_CATEGORIES.ADMIN, 'User updated successfully by admin', {
      ...requestContext,
      updated_fields: Object.keys(updates)
    });

    // Return sanitized user data
    const sanitizedUser = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      dateOfBirth: updatedUser.dateOfBirth,
      address: updatedUser.address,
      employment: updatedUser.employment,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      isActive: updatedUser.isActive
    };

    res.json({
      message: 'User updated successfully',
      user: sanitizedUser
    });
  } catch (error) {
    logger.error(LOG_CATEGORIES.ADMIN, 'Error updating user by admin', {
      ...requestContext,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Failed to update user',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

/**
 * @route GET /api/admin/credit/reports
 * @desc Get credit reporting and analytics data
 * @access Admin only
 */
router.get('/credit/reports', async (req, res) => {
  const requestContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username
  };

  try {
    logger.info(LOG_CATEGORIES.ADMIN, 'Admin credit reports request', requestContext);

    const {
      reportType = 'summary',
      startDate,
      endDate,
      riskLevel,
      includeExpired = 'false'
    } = req.query;

    // Get basic statistics
    const creditScoreStats = lendingDataStore.getCreditScoreStatistics();
    const creditLimitStats = lendingDataStore.getCreditLimitStatistics();

    // Get users by risk level
    const lowRiskUsers = lendingDataStore.getUsersByRiskLevel('low');
    const mediumRiskUsers = lendingDataStore.getUsersByRiskLevel('medium');
    const highRiskUsers = lendingDataStore.getUsersByRiskLevel('high');

    // Get expired credit limits
    const expiredLimits = lendingDataStore.getExpiredCreditLimits();

    // Get all credit scores and limits for detailed analysis
    let allCreditScores = lendingDataStore.getAllCreditScores();
    let allCreditLimits = lendingDataStore.getAllCreditLimits();

    // Apply date filters if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date();

      allCreditScores = allCreditScores.filter(score => {
        const scoreDate = new Date(score.scoreDate);
        return scoreDate >= start && scoreDate <= end;
      });

      allCreditLimits = allCreditLimits.filter(limit => {
        const limitDate = new Date(limit.calculatedAt);
        return limitDate >= start && limitDate <= end;
      });
    }

    // Apply risk level filter if provided
    if (riskLevel) {
      allCreditLimits = allCreditLimits.filter(limit => limit.riskLevel === riskLevel);
    }

    // Filter out expired limits if requested
    if (includeExpired === 'false') {
      const now = new Date();
      allCreditLimits = allCreditLimits.filter(limit => new Date(limit.expiresAt) >= now);
    }

    // Build response based on report type
    let response = {
      reportType,
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        riskLevel: riskLevel || null,
        includeExpired: includeExpired === 'true'
      }
    };

    if (reportType === 'summary' || reportType === 'all') {
      response.summary = {
        creditScores: creditScoreStats,
        creditLimits: creditLimitStats,
        riskDistribution: {
          low: lowRiskUsers.length,
          medium: mediumRiskUsers.length,
          high: highRiskUsers.length,
          total: lowRiskUsers.length + mediumRiskUsers.length + highRiskUsers.length
        },
        expiredLimits: {
          count: expiredLimits.length,
          totalValue: expiredLimits.reduce((sum, limit) => sum + limit.calculatedLimit, 0)
        }
      };
    }

    if (reportType === 'detailed' || reportType === 'all') {
      response.detailed = {
        creditScoreDistribution: {
          excellent: allCreditScores.filter(s => s.score >= 800).length,
          veryGood: allCreditScores.filter(s => s.score >= 740 && s.score < 800).length,
          good: allCreditScores.filter(s => s.score >= 670 && s.score < 740).length,
          fair: allCreditScores.filter(s => s.score >= 580 && s.score < 670).length,
          poor: allCreditScores.filter(s => s.score < 580).length
        },
        creditLimitRanges: {
          under5k: allCreditLimits.filter(l => l.calculatedLimit < 5000).length,
          '5k-15k': allCreditLimits.filter(l => l.calculatedLimit >= 5000 && l.calculatedLimit < 15000).length,
          '15k-30k': allCreditLimits.filter(l => l.calculatedLimit >= 15000 && l.calculatedLimit < 30000).length,
          '30k-50k': allCreditLimits.filter(l => l.calculatedLimit >= 30000 && l.calculatedLimit < 50000).length,
          over50k: allCreditLimits.filter(l => l.calculatedLimit >= 50000).length
        },
        riskAnalysis: {
          lowRisk: {
            count: lowRiskUsers.length,
            averageLimit: lowRiskUsers.length > 0 ? 
              lowRiskUsers.reduce((sum, user) => {
                const limit = lendingDataStore.getCreditLimitByUserId(user.id);
                return sum + (limit ? limit.calculatedLimit : 0);
              }, 0) / lowRiskUsers.length : 0
          },
          mediumRisk: {
            count: mediumRiskUsers.length,
            averageLimit: mediumRiskUsers.length > 0 ? 
              mediumRiskUsers.reduce((sum, user) => {
                const limit = lendingDataStore.getCreditLimitByUserId(user.id);
                return sum + (limit ? limit.calculatedLimit : 0);
              }, 0) / mediumRiskUsers.length : 0
          },
          highRisk: {
            count: highRiskUsers.length,
            averageLimit: highRiskUsers.length > 0 ? 
              highRiskUsers.reduce((sum, user) => {
                const limit = lendingDataStore.getCreditLimitByUserId(user.id);
                return sum + (limit ? limit.calculatedLimit : 0);
              }, 0) / highRiskUsers.length : 0
          }
        }
      };
    }

    if (reportType === 'trends' || reportType === 'all') {
      // Group credit scores by month for trend analysis
      const scoresByMonth = {};
      const limitsByMonth = {};

      allCreditScores.forEach(score => {
        const monthKey = new Date(score.scoreDate).toISOString().substring(0, 7); // YYYY-MM
        if (!scoresByMonth[monthKey]) {
          scoresByMonth[monthKey] = [];
        }
        scoresByMonth[monthKey].push(score.score);
      });

      allCreditLimits.forEach(limit => {
        const monthKey = new Date(limit.calculatedAt).toISOString().substring(0, 7); // YYYY-MM
        if (!limitsByMonth[monthKey]) {
          limitsByMonth[monthKey] = [];
        }
        limitsByMonth[monthKey].push(limit.calculatedLimit);
      });

      response.trends = {
        creditScoresByMonth: Object.keys(scoresByMonth).map(month => ({
          month,
          count: scoresByMonth[month].length,
          average: scoresByMonth[month].reduce((a, b) => a + b, 0) / scoresByMonth[month].length,
          min: Math.min(...scoresByMonth[month]),
          max: Math.max(...scoresByMonth[month])
        })).sort((a, b) => a.month.localeCompare(b.month)),
        creditLimitsByMonth: Object.keys(limitsByMonth).map(month => ({
          month,
          count: limitsByMonth[month].length,
          average: limitsByMonth[month].reduce((a, b) => a + b, 0) / limitsByMonth[month].length,
          total: limitsByMonth[month].reduce((a, b) => a + b, 0)
        })).sort((a, b) => a.month.localeCompare(b.month))
      };
    }

    logger.info(LOG_CATEGORIES.ADMIN, 'Admin credit reports generated successfully', {
      ...requestContext,
      report_type: reportType,
      credit_scores_analyzed: allCreditScores.length,
      credit_limits_analyzed: allCreditLimits.length,
      filters_applied: Object.keys(response.filters).filter(key => response.filters[key] !== null).length
    });

    res.json(response);
  } catch (error) {
    logger.error(LOG_CATEGORIES.ADMIN, 'Error generating admin credit reports', {
      ...requestContext,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Failed to generate credit reports',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

/**
 * @route POST /api/admin/credit/recalculate
 * @desc Trigger credit recalculation for users
 * @access Admin only
 */
router.post('/credit/recalculate', async (req, res) => {
  const requestContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username
  };

  try {
    logger.info(LOG_CATEGORIES.ADMIN, 'Admin credit recalculation request', requestContext);

    const {
      userIds,
      recalculateAll = false,
      forceRecalculation = false,
      recalculationType = 'both' // 'scores', 'limits', or 'both'
    } = req.body;

    // Validate request parameters
    if (!recalculateAll && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      return res.status(400).json({
        error: 'validation_error',
        error_description: 'Either set recalculateAll to true or provide an array of userIds',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }

    // Determine which users to recalculate
    let targetUsers = [];
    if (recalculateAll) {
      targetUsers = lendingDataStore.getAllUsers().filter(user => user.isActive);
      logger.info(LOG_CATEGORIES.ADMIN, 'Recalculating credit for all active users', {
        ...requestContext,
        total_users: targetUsers.length
      });
    } else {
      targetUsers = userIds.map(id => lendingDataStore.getUserById(id)).filter(user => user);
      logger.info(LOG_CATEGORIES.ADMIN, 'Recalculating credit for specific users', {
        ...requestContext,
        requested_users: userIds.length,
        found_users: targetUsers.length
      });
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        error: 'validation_error',
        error_description: 'No valid users found for recalculation',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }

    const results = {
      totalUsers: targetUsers.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [],
      startedAt: new Date().toISOString()
    };

    // Services are already initialized as singletons

    // Process each user
    for (const user of targetUsers) {
      const userResult = {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        status: 'processing',
        actions: [],
        errors: []
      };

      try {
        // Check if recalculation is needed (unless forced)
        if (!forceRecalculation) {
          const existingScore = lendingDataStore.getCreditScoreByUserId(user.id);
          const existingLimit = lendingDataStore.getCreditLimitByUserId(user.id);

          // Skip if recent calculations exist (within 24 hours)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          if (recalculationType === 'scores' && existingScore && new Date(existingScore.scoreDate) > oneDayAgo) {
            userResult.status = 'skipped';
            userResult.reason = 'Recent credit score exists';
            results.skipped++;
            results.details.push(userResult);
            continue;
          }

          if (recalculationType === 'limits' && existingLimit && new Date(existingLimit.calculatedAt) > oneDayAgo) {
            userResult.status = 'skipped';
            userResult.reason = 'Recent credit limit exists';
            results.skipped++;
            results.details.push(userResult);
            continue;
          }

          if (recalculationType === 'both' && existingScore && existingLimit && 
              new Date(existingScore.scoreDate) > oneDayAgo && 
              new Date(existingLimit.calculatedAt) > oneDayAgo) {
            userResult.status = 'skipped';
            userResult.reason = 'Recent credit data exists';
            results.skipped++;
            results.details.push(userResult);
            continue;
          }
        }

        // Recalculate credit score if requested
        if (recalculationType === 'scores' || recalculationType === 'both') {
          try {
            const newScore = await creditScoringService.calculateCreditScore(user.id);
            await lendingDataStore.createCreditScore({
              userId: user.id,
              score: newScore.score,
              factors: newScore.factors,
              source: 'admin_recalculation'
            });
            userResult.actions.push('credit_score_recalculated');
            logger.debug(LOG_CATEGORIES.ADMIN, 'Credit score recalculated', {
              ...requestContext,
              target_user_id: user.id,
              new_score: newScore.score
            });
          } catch (scoreError) {
            userResult.errors.push(`Credit score calculation failed: ${scoreError.message}`);
            logger.warn(LOG_CATEGORIES.ADMIN, 'Credit score recalculation failed', {
              ...requestContext,
              target_user_id: user.id,
              error_message: scoreError.message
            });
          }
        }

        // Recalculate credit limit if requested
        if (recalculationType === 'limits' || recalculationType === 'both') {
          try {
            const newLimit = await creditLimitService.calculateCreditLimit(user.id);
            await lendingDataStore.createCreditLimit({
              userId: user.id,
              creditScore: newLimit.creditScore,
              calculatedLimit: newLimit.calculatedLimit,
              approvedLimit: newLimit.approvedLimit,
              riskLevel: newLimit.riskLevel,
              businessRules: newLimit.businessRules
            });
            userResult.actions.push('credit_limit_recalculated');
            logger.debug(LOG_CATEGORIES.ADMIN, 'Credit limit recalculated', {
              ...requestContext,
              target_user_id: user.id,
              new_limit: newLimit.calculatedLimit
            });
          } catch (limitError) {
            userResult.errors.push(`Credit limit calculation failed: ${limitError.message}`);
            logger.warn(LOG_CATEGORIES.ADMIN, 'Credit limit recalculation failed', {
              ...requestContext,
              target_user_id: user.id,
              error_message: limitError.message
            });
          }
        }

        // Determine final status
        if (userResult.errors.length > 0 && userResult.actions.length === 0) {
          userResult.status = 'failed';
          results.failed++;
        } else if (userResult.actions.length > 0) {
          userResult.status = 'success';
          results.successful++;
        } else {
          userResult.status = 'no_action';
          results.skipped++;
        }

        // Log activity
        await lendingDataStore.createActivityLog({
          userId: user.id,
          action: 'credit_recalculated_by_admin',
          details: {
            recalculation_type: recalculationType,
            actions_performed: userResult.actions,
            admin_user_id: req.user.id,
            admin_username: req.user.username,
            forced: forceRecalculation
          },
          metadata: {
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });

      } catch (error) {
        userResult.status = 'failed';
        userResult.errors.push(`Unexpected error: ${error.message}`);
        results.failed++;
        
        logger.error(LOG_CATEGORIES.ADMIN, 'Unexpected error during credit recalculation', {
          ...requestContext,
          target_user_id: user.id,
          error_message: error.message
        });
      }

      results.details.push(userResult);
    }

    results.completedAt = new Date().toISOString();
    results.duration = new Date(results.completedAt) - new Date(results.startedAt);

    logger.info(LOG_CATEGORIES.ADMIN, 'Credit recalculation completed', {
      ...requestContext,
      total_users: results.totalUsers,
      successful: results.successful,
      failed: results.failed,
      skipped: results.skipped,
      duration_ms: results.duration
    });

    res.json({
      message: 'Credit recalculation completed',
      results
    });

  } catch (error) {
    logger.error(LOG_CATEGORIES.ADMIN, 'Error during admin credit recalculation', {
      ...requestContext,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Failed to recalculate credit data',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

/**
 * @route GET /api/admin/system/status
 * @desc Get system status and health information
 * @access Admin only
 */
router.get('/system/status', async (req, res) => {
  const requestContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username
  };

  try {
    logger.info(LOG_CATEGORIES.ADMIN, 'Admin system status request', requestContext);

    // Get data store statistics
    const totalUsers = lendingDataStore.getAllUsers().length;
    const activeUsers = lendingDataStore.getAllUsers().filter(user => user.isActive).length;
    const totalCreditScores = lendingDataStore.getAllCreditScores().length;
    const totalCreditLimits = lendingDataStore.getAllCreditLimits().length;
    const totalActivityLogs = lendingDataStore.getAllActivityLogs().length;

    // Get expired credit limits
    const expiredLimits = lendingDataStore.getExpiredCreditLimits();

    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivities = lendingDataStore.getAllActivityLogs()
      .filter(log => new Date(log.timestamp) > oneDayAgo);

    // System health indicators
    const systemStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      dataStore: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalCreditScores,
        totalCreditLimits,
        totalActivityLogs,
        expiredLimitsCount: expiredLimits.length
      },
      recentActivity: {
        last24Hours: recentActivities.length,
        byAction: recentActivities.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {})
      },
      systemHealth: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Check for potential issues
    const warnings = [];
    if (expiredLimits.length > 0) {
      warnings.push(`${expiredLimits.length} credit limits have expired`);
    }
    if (activeUsers === 0) {
      warnings.push('No active users in the system');
    }
    if (recentActivities.length === 0) {
      warnings.push('No recent activity in the last 24 hours');
    }

    if (warnings.length > 0) {
      systemStatus.warnings = warnings;
      systemStatus.status = 'warning';
    }

    logger.info(LOG_CATEGORIES.ADMIN, 'System status retrieved successfully', {
      ...requestContext,
      system_status: systemStatus.status,
      warnings_count: warnings.length
    });

    res.json(systemStatus);
  } catch (error) {
    logger.error(LOG_CATEGORIES.ADMIN, 'Error retrieving system status', {
      ...requestContext,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Failed to retrieve system status',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

/**
 * @route GET /api/admin/activity-logs
 * @desc Get system activity logs with filtering
 * @access Admin only
 */
router.get('/activity-logs', async (req, res) => {
  const requestContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    username: req.user?.username
  };

  try {
    logger.info(LOG_CATEGORIES.ADMIN, 'Admin activity logs request', requestContext);

    const {
      page = 1,
      limit = 100,
      userId,
      action,
      startDate,
      endDate,
      sortOrder = 'desc'
    } = req.query;

    let activityLogs = lendingDataStore.getAllActivityLogs();

    // Apply filters
    if (userId) {
      activityLogs = activityLogs.filter(log => log.userId === userId);
    }

    if (action) {
      activityLogs = activityLogs.filter(log => log.action === action);
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date();

      activityLogs = activityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    }

    // Sort by timestamp
    activityLogs.sort((a, b) => {
      const aTime = new Date(a.timestamp);
      const bTime = new Date(b.timestamp);
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    });

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = activityLogs.slice(startIndex, endIndex);

    const response = {
      activityLogs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activityLogs.length,
        totalPages: Math.ceil(activityLogs.length / parseInt(limit)),
        hasNext: endIndex < activityLogs.length,
        hasPrev: startIndex > 0
      },
      filters: {
        userId: userId || null,
        action: action || null,
        startDate: startDate || null,
        endDate: endDate || null,
        sortOrder
      }
    };

    logger.info(LOG_CATEGORIES.ADMIN, 'Activity logs retrieved successfully', {
      ...requestContext,
      total_logs: activityLogs.length,
      returned_logs: paginatedLogs.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(response);
  } catch (error) {
    logger.error(LOG_CATEGORIES.ADMIN, 'Error retrieving activity logs', {
      ...requestContext,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      error: 'internal_server_error',
      error_description: 'Failed to retrieve activity logs',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

module.exports = router;