const lendingDataStore = require('../data/store');
const creditScoringService = require('./CreditScoringService');
const { logger } = require('../utils/logger');

class CreditLimitService {
  constructor() {
    // Credit limit cache with configurable TTL
    this.limitCache = new Map();
    this.cacheTTL = parseInt(process.env.CREDIT_LIMIT_TTL) || 7200; // Default 2 hours in seconds
    this.defaultLimit = parseInt(process.env.DEFAULT_CREDIT_LIMIT) || 5000;
    this.minimumLimit = parseInt(process.env.MINIMUM_CREDIT_LIMIT) || 1000;
    this.maximumLimit = parseInt(process.env.MAXIMUM_CREDIT_LIMIT) || 100000;
    this.minimumCreditScore = parseInt(process.env.MINIMUM_CREDIT_SCORE) || 600;
    
    // Business rule configuration
    this.businessRules = {
      incomeMultipliers: {
        excellent: 0.35, // 750+ credit score
        good: 0.30,      // 700-749 credit score
        fair: 0.25,      // 650-699 credit score
        poor: 0.20       // 600-649 credit score
      },
      maxDebtToIncomeRatio: 0.40,
      creditScoreThresholds: {
        excellent: 750,
        good: 700,
        fair: 650,
        poor: 600
      },
      riskAdjustments: {
        low: 1.0,     // No adjustment
        medium: 0.85, // 15% reduction
        high: 0.70    // 30% reduction
      }
    };
  }

  /**
   * Get credit limit for a user with caching
   * @param {string} userId - User ID
   * @param {boolean} forceRefresh - Force refresh from calculation
   * @returns {Promise<Object>} Credit limit data
   */
  async getCreditLimit(userId, forceRefresh = false) {
    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedLimit = this.getCachedLimit(userId);
        if (cachedLimit) {
          logger.info(`Credit limit retrieved from cache for user ${userId}`, {
            userId,
            limit: cachedLimit.calculatedLimit,
            source: 'cache'
          });
          return cachedLimit;
        }
      }

      // Verify user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get existing credit limit from data store
      let creditLimit = lendingDataStore.getCreditLimitByUserId(userId);
      
      if (!creditLimit || forceRefresh) {
        // Calculate new credit limit
        creditLimit = await this.calculateCreditLimit(userId);
        logger.info(`New credit limit calculated for user ${userId}`, {
          userId,
          limit: creditLimit.calculatedLimit,
          source: 'calculated'
        });
      } else {
        // Check if existing limit is expired (older than 6 months)
        const limitAge = Date.now() - new Date(creditLimit.calculatedAt).getTime();
        const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000;
        
        if (limitAge > sixMonthsInMs) {
          logger.info(`Credit limit expired for user ${userId}, recalculating`, {
            userId,
            oldLimit: creditLimit.calculatedLimit,
            limitAge: Math.floor(limitAge / (24 * 60 * 60 * 1000)) + ' days'
          });
          creditLimit = await this.calculateCreditLimit(userId);
        }
      }

      // Cache the limit
      this.setCachedLimit(userId, creditLimit);

      logger.info(`Credit limit retrieved for user ${userId}`, {
        userId,
        limit: creditLimit.calculatedLimit,
        riskLevel: creditLimit.riskLevel
      });

      return creditLimit;
    } catch (error) {
      logger.error(`Error retrieving credit limit for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate credit limit based on user profile, credit score, and business rules
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Calculated credit limit
   */
  async calculateCreditLimit(userId) {
    try {
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get current credit score
      const creditScore = await creditScoringService.getCreditScore(userId);
      
      // Check minimum credit score requirement
      if (creditScore.score < this.minimumCreditScore) {
        logger.info(`Credit score below minimum for user ${userId}`, {
          userId,
          score: creditScore.score,
          minimumRequired: this.minimumCreditScore
        });
        
        return await this.createMinimumCreditLimit(userId, creditScore.score);
      }

      // Calculate base limit using income and credit score
      const baseLimit = this.calculateBaseLimit(user, creditScore.score);
      
      // Assess risk level
      const riskAssessment = this.assessRisk(user, creditScore.score);
      
      // Apply risk adjustments
      const adjustedLimit = this.applyRiskAdjustments(baseLimit, riskAssessment);
      
      // Ensure limit is within bounds
      const finalLimit = Math.max(this.minimumLimit, Math.min(this.maximumLimit, adjustedLimit));
      
      // Create credit limit record
      const creditLimitData = {
        userId: userId,
        creditScore: creditScore.score,
        calculatedLimit: finalLimit,
        approvedLimit: finalLimit, // In production, this might be manually adjusted
        riskLevel: riskAssessment.level,
        businessRules: {
          incomeMultiplier: riskAssessment.incomeMultiplier,
          debtToIncomeRatio: riskAssessment.estimatedDebtToIncome,
          minimumScore: this.minimumCreditScore,
          riskAdjustment: riskAssessment.adjustment
        },
        calculatedAt: new Date(),
        expiresAt: new Date(Date.now() + (6 * 30 * 24 * 60 * 60 * 1000)) // 6 months
      };

      // Save to data store
      const savedLimit = await lendingDataStore.createCreditLimit(creditLimitData);

      logger.info(`Credit limit calculated and saved for user ${userId}`, {
        userId,
        limit: finalLimit,
        riskLevel: riskAssessment.level,
        creditScore: creditScore.score
      });

      return savedLimit;
    } catch (error) {
      logger.error(`Error calculating credit limit for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate base credit limit using income and credit score
   * @param {Object} user - User profile data
   * @param {number} creditScore - Credit score
   * @returns {number} Base credit limit
   */
  calculateBaseLimit(user, creditScore) {
    if (!user.employment || !user.employment.annualIncome) {
      logger.warn(`No employment data for user ${user.id}, using minimum limit`);
      return this.minimumLimit;
    }

    const { annualIncome } = user.employment;
    
    // Determine income multiplier based on credit score
    let multiplier;
    if (creditScore >= this.businessRules.creditScoreThresholds.excellent) {
      multiplier = this.businessRules.incomeMultipliers.excellent;
    } else if (creditScore >= this.businessRules.creditScoreThresholds.good) {
      multiplier = this.businessRules.incomeMultipliers.good;
    } else if (creditScore >= this.businessRules.creditScoreThresholds.fair) {
      multiplier = this.businessRules.incomeMultipliers.fair;
    } else {
      multiplier = this.businessRules.incomeMultipliers.poor;
    }

    const baseLimit = annualIncome * multiplier;
    
    logger.debug(`Base limit calculated`, {
      userId: user.id,
      annualIncome,
      creditScore,
      multiplier,
      baseLimit
    });

    return Math.round(baseLimit);
  }

  /**
   * Assess risk level based on user profile and credit score
   * @param {Object} user - User profile data
   * @param {number} creditScore - Credit score
   * @returns {Object} Risk assessment
   */
  assessRisk(user, creditScore) {
    const assessment = {
      level: 'medium',
      factors: [],
      adjustment: 1.0,
      incomeMultiplier: 0.25,
      estimatedDebtToIncome: 0.30
    };

    // Credit score risk factor
    if (creditScore >= this.businessRules.creditScoreThresholds.excellent) {
      assessment.factors.push('excellent_credit_score');
      assessment.level = 'low';
    } else if (creditScore >= this.businessRules.creditScoreThresholds.good) {
      assessment.factors.push('good_credit_score');
      assessment.level = 'low';
    } else if (creditScore >= this.businessRules.creditScoreThresholds.fair) {
      assessment.factors.push('fair_credit_score');
      assessment.level = 'medium';
    } else {
      assessment.factors.push('poor_credit_score');
      assessment.level = 'high';
    }

    // Employment stability risk factor
    if (user.employment) {
      const { employmentLength, annualIncome } = user.employment;
      
      if (employmentLength >= 60) { // 5+ years
        assessment.factors.push('stable_employment');
      } else if (employmentLength >= 24) { // 2+ years
        assessment.factors.push('moderate_employment');
      } else if (employmentLength < 12) { // Less than 1 year
        assessment.factors.push('unstable_employment');
        if (assessment.level === 'low') assessment.level = 'medium';
        else if (assessment.level === 'medium') assessment.level = 'high';
      }

      // Income level risk factor
      if (annualIncome >= 100000) {
        assessment.factors.push('high_income');
        assessment.estimatedDebtToIncome = 0.25;
      } else if (annualIncome >= 75000) {
        assessment.factors.push('good_income');
        assessment.estimatedDebtToIncome = 0.28;
      } else if (annualIncome >= 50000) {
        assessment.factors.push('moderate_income');
        assessment.estimatedDebtToIncome = 0.32;
      } else if (annualIncome >= 30000) {
        assessment.factors.push('low_income');
        assessment.estimatedDebtToIncome = 0.35;
        if (assessment.level === 'low') assessment.level = 'medium';
      } else {
        assessment.factors.push('very_low_income');
        assessment.estimatedDebtToIncome = 0.40;
        assessment.level = 'high';
      }
    } else {
      assessment.factors.push('no_employment_data');
      assessment.level = 'high';
      assessment.estimatedDebtToIncome = 0.40;
    }

    // Age risk factor (younger borrowers may have less credit history)
    if (user.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 25) {
        assessment.factors.push('young_borrower');
        if (assessment.level === 'low') assessment.level = 'medium';
      } else if (age >= 50) {
        assessment.factors.push('mature_borrower');
      }
    }

    // Set risk adjustment based on final level
    assessment.adjustment = this.businessRules.riskAdjustments[assessment.level];
    
    // Set income multiplier based on risk level and credit score
    if (creditScore >= this.businessRules.creditScoreThresholds.excellent) {
      assessment.incomeMultiplier = this.businessRules.incomeMultipliers.excellent;
    } else if (creditScore >= this.businessRules.creditScoreThresholds.good) {
      assessment.incomeMultiplier = this.businessRules.incomeMultipliers.good;
    } else if (creditScore >= this.businessRules.creditScoreThresholds.fair) {
      assessment.incomeMultiplier = this.businessRules.incomeMultipliers.fair;
    } else {
      assessment.incomeMultiplier = this.businessRules.incomeMultipliers.poor;
    }

    logger.debug(`Risk assessment completed`, {
      userId: user.id,
      creditScore,
      riskLevel: assessment.level,
      factors: assessment.factors,
      adjustment: assessment.adjustment
    });

    return assessment;
  }

  /**
   * Apply risk adjustments to base limit
   * @param {number} baseLimit - Base credit limit
   * @param {Object} riskAssessment - Risk assessment data
   * @returns {number} Adjusted credit limit
   */
  applyRiskAdjustments(baseLimit, riskAssessment) {
    const adjustedLimit = baseLimit * riskAssessment.adjustment;
    
    logger.debug(`Risk adjustments applied`, {
      baseLimit,
      riskLevel: riskAssessment.level,
      adjustment: riskAssessment.adjustment,
      adjustedLimit
    });

    return Math.round(adjustedLimit);
  }

  /**
   * Create minimum credit limit for users who don't meet requirements
   * @param {string} userId - User ID
   * @param {number} creditScore - Credit score
   * @returns {Promise<Object>} Minimum credit limit record
   */
  async createMinimumCreditLimit(userId, creditScore) {
    const creditLimitData = {
      userId: userId,
      creditScore: creditScore,
      calculatedLimit: this.minimumLimit,
      approvedLimit: this.minimumLimit,
      riskLevel: 'high',
      businessRules: {
        incomeMultiplier: 0,
        debtToIncomeRatio: 0,
        minimumScore: this.minimumCreditScore,
        reason: 'below_minimum_credit_score'
      },
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + (3 * 30 * 24 * 60 * 60 * 1000)) // 3 months for review
    };

    const savedLimit = await lendingDataStore.createCreditLimit(creditLimitData);

    logger.info(`Minimum credit limit assigned for user ${userId}`, {
      userId,
      creditScore,
      limit: this.minimumLimit,
      reason: 'below_minimum_credit_score'
    });

    return savedLimit;
  }

  /**
   * Get comprehensive credit assessment combining score and limit
   * @param {string} userId - User ID
   * @param {boolean} forceRefresh - Force refresh of both score and limit
   * @returns {Promise<Object>} Complete credit assessment
   */
  async getCreditAssessment(userId, forceRefresh = false) {
    try {
      // Get user profile
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get credit score and limit in parallel
      const [creditScore, creditLimit] = await Promise.all([
        creditScoringService.getCreditScore(userId, forceRefresh),
        this.getCreditLimit(userId, forceRefresh)
      ]);

      // Create comprehensive assessment
      const assessment = {
        userId: userId,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          employment: user.employment
        },
        creditScore: {
          score: creditScore.score,
          scoreDate: creditScore.scoreDate,
          factors: creditScore.factors,
          source: creditScore.source
        },
        creditLimit: {
          calculatedLimit: creditLimit.calculatedLimit,
          approvedLimit: creditLimit.approvedLimit,
          riskLevel: creditLimit.riskLevel,
          businessRules: creditLimit.businessRules,
          calculatedAt: creditLimit.calculatedAt,
          expiresAt: creditLimit.expiresAt
        },
        recommendation: this.generateRecommendation(creditScore, creditLimit),
        assessmentDate: new Date().toISOString()
      };

      logger.info(`Comprehensive credit assessment completed for user ${userId}`, {
        userId,
        creditScore: creditScore.score,
        creditLimit: creditLimit.calculatedLimit,
        riskLevel: creditLimit.riskLevel
      });

      return assessment;
    } catch (error) {
      logger.error(`Error generating credit assessment for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Generate lending recommendation based on credit data
   * @param {Object} creditScore - Credit score data
   * @param {Object} creditLimit - Credit limit data
   * @returns {Object} Lending recommendation
   */
  generateRecommendation(creditScore, creditLimit) {
    const recommendation = {
      approved: false,
      maxLoanAmount: 0,
      interestRateRange: { min: 0, max: 0 },
      terms: [],
      conditions: [],
      reasons: []
    };

    // Determine approval based on credit score and limit
    if (creditScore.score >= this.minimumCreditScore && creditLimit.calculatedLimit >= this.minimumLimit) {
      recommendation.approved = true;
      recommendation.maxLoanAmount = creditLimit.approvedLimit;

      // Set interest rate range based on credit score and risk level
      if (creditScore.score >= 750) {
        recommendation.interestRateRange = { min: 3.5, max: 6.0 };
        recommendation.terms.push('Prime rate eligible');
        recommendation.reasons.push('Excellent credit score');
      } else if (creditScore.score >= 700) {
        recommendation.interestRateRange = { min: 5.0, max: 8.5 };
        recommendation.terms.push('Good rate eligible');
        recommendation.reasons.push('Good credit score');
      } else if (creditScore.score >= 650) {
        recommendation.interestRateRange = { min: 7.5, max: 12.0 };
        recommendation.terms.push('Standard rate');
        recommendation.reasons.push('Fair credit score');
      } else {
        recommendation.interestRateRange = { min: 10.0, max: 18.0 };
        recommendation.terms.push('Higher rate due to credit risk');
        recommendation.reasons.push('Below average credit score');
      }

      // Add conditions based on risk level
      if (creditLimit.riskLevel === 'high') {
        recommendation.conditions.push('Income verification required');
        recommendation.conditions.push('Collateral may be required');
      } else if (creditLimit.riskLevel === 'medium') {
        recommendation.conditions.push('Income verification required');
      }

      // Add terms based on credit limit
      if (creditLimit.calculatedLimit >= 25000) {
        recommendation.terms.push('Up to 7-year term available');
      } else if (creditLimit.calculatedLimit >= 15000) {
        recommendation.terms.push('Up to 5-year term available');
      } else {
        recommendation.terms.push('Up to 3-year term available');
      }

    } else {
      recommendation.approved = false;
      
      if (creditScore.score < this.minimumCreditScore) {
        recommendation.reasons.push(`Credit score ${creditScore.score} below minimum ${this.minimumCreditScore}`);
      }
      
      if (creditLimit.calculatedLimit < this.minimumLimit) {
        recommendation.reasons.push(`Calculated limit ${creditLimit.calculatedLimit} below minimum ${this.minimumLimit}`);
      }

      recommendation.conditions.push('Credit improvement required');
      recommendation.conditions.push('Reapply after 6 months');
    }

    return recommendation;
  }

  /**
   * Get credit limit from cache
   * @param {string} userId - User ID
   * @returns {Object|null} Cached credit limit or null
   */
  getCachedLimit(userId) {
    const cached = this.limitCache.get(userId);
    if (!cached) return null;

    // Check if cache entry has expired
    const now = Date.now();
    if (now - cached.timestamp > (this.cacheTTL * 1000)) {
      this.limitCache.delete(userId);
      return null;
    }

    return cached.data;
  }

  /**
   * Set credit limit in cache
   * @param {string} userId - User ID
   * @param {Object} limitData - Credit limit data
   */
  setCachedLimit(userId, limitData) {
    this.limitCache.set(userId, {
      data: limitData,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for specific user or all users
   * @param {string} userId - User ID (optional, clears all if not provided)
   */
  clearCache(userId = null) {
    if (userId) {
      this.limitCache.delete(userId);
      logger.info(`Credit limit cache cleared for user ${userId}`);
    } else {
      this.limitCache.clear();
      logger.info('Credit limit cache cleared for all users');
    }
  }

  /**
   * Recalculate credit limit for user (admin function)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} New credit limit
   */
  async recalculateCreditLimit(userId) {
    try {
      // Clear cache for this user
      this.clearCache(userId);
      
      // Force recalculation
      const newLimit = await this.calculateCreditLimit(userId);
      
      logger.info(`Credit limit recalculated for user ${userId}`, {
        userId,
        newLimit: newLimit.calculatedLimit,
        riskLevel: newLimit.riskLevel,
        action: 'admin_recalculation'
      });

      return newLimit;
    } catch (error) {
      logger.error(`Error recalculating credit limit for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [userId, cached] of this.limitCache.entries()) {
      if (now - cached.timestamp > (this.cacheTTL * 1000)) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.limitCache.size,
      validEntries,
      expiredEntries,
      cacheTTL: this.cacheTTL
    };
  }

  /**
   * Validate credit limit data
   * @param {Object} limitData - Credit limit data to validate
   * @returns {Object} Validation result
   */
  validateCreditLimit(limitData) {
    const errors = [];

    if (!limitData.userId) {
      errors.push('User ID is required');
    }

    if (typeof limitData.calculatedLimit !== 'number') {
      errors.push('Calculated limit must be a number');
    } else if (limitData.calculatedLimit < 0) {
      errors.push('Calculated limit cannot be negative');
    }

    if (typeof limitData.creditScore !== 'number') {
      errors.push('Credit score must be a number');
    } else if (limitData.creditScore < 300 || limitData.creditScore > 850) {
      errors.push('Credit score must be between 300 and 850');
    }

    if (!['low', 'medium', 'high'].includes(limitData.riskLevel)) {
      errors.push('Risk level must be low, medium, or high');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const creditLimitService = new CreditLimitService();

module.exports = creditLimitService;