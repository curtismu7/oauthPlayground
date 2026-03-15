const lendingDataStore = require('../data/store');
const { logger } = require('../utils/logger');

class CreditScoringService {
  constructor() {
    // Credit score cache with configurable TTL
    this.scoreCache = new Map();
    this.cacheTTL = parseInt(process.env.CREDIT_SCORE_TTL) || 3600; // Default 1 hour in seconds
    this.defaultScore = parseInt(process.env.DEFAULT_CREDIT_SCORE) || 600;
    this.minimumScore = parseInt(process.env.MINIMUM_CREDIT_SCORE) || 300;
    this.maximumScore = parseInt(process.env.MAXIMUM_CREDIT_SCORE) || 850;
  }

  /**
   * Get credit score for a user with caching
   * @param {string} userId - User ID
   * @param {boolean} forceRefresh - Force refresh from data store
   * @returns {Promise<Object>} Credit score data
   */
  async getCreditScore(userId, forceRefresh = false) {
    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedScore = this.getCachedScore(userId);
        if (cachedScore) {
          logger.info(`Credit score retrieved from cache for user ${userId}`, {
            userId,
            score: cachedScore.score,
            source: 'cache'
          });
          return cachedScore;
        }
      }

      // Verify user exists
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Get existing credit score from data store
      let creditScore = lendingDataStore.getCreditScoreByUserId(userId);
      
      if (!creditScore) {
        // Calculate new credit score if none exists
        creditScore = await this.calculateCreditScore(userId);
        logger.info(`New credit score calculated for user ${userId}`, {
          userId,
          score: creditScore.score,
          source: 'calculated'
        });
      } else {
        // Check if existing score is expired (older than 30 days)
        const scoreAge = Date.now() - new Date(creditScore.scoreDate).getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        if (scoreAge > thirtyDaysInMs) {
          logger.info(`Credit score expired for user ${userId}, recalculating`, {
            userId,
            oldScore: creditScore.score,
            scoreAge: Math.floor(scoreAge / (24 * 60 * 60 * 1000)) + ' days'
          });
          creditScore = await this.calculateCreditScore(userId);
        }
      }

      // Cache the score
      this.setCachedScore(userId, creditScore);

      logger.info(`Credit score retrieved for user ${userId}`, {
        userId,
        score: creditScore.score,
        source: creditScore.source
      });

      return creditScore;
    } catch (error) {
      logger.error(`Error retrieving credit score for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate credit score based on user profile and employment data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Calculated credit score
   */
  async calculateCreditScore(userId) {
    try {
      const user = lendingDataStore.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Calculate score factors based on user data
      const factors = this.calculateScoreFactors(user);
      
      // Calculate weighted score
      const score = this.calculateWeightedScore(factors);
      
      // Ensure score is within valid range
      const finalScore = Math.max(this.minimumScore, Math.min(this.maximumScore, score));

      // Create credit score record
      const creditScoreData = {
        userId: userId,
        score: finalScore,
        scoreDate: new Date(),
        factors: factors,
        source: 'calculated'
      };

      // Save to data store
      const savedScore = await lendingDataStore.createCreditScore(creditScoreData);

      logger.info(`Credit score calculated and saved for user ${userId}`, {
        userId,
        score: finalScore,
        factors: factors
      });

      return savedScore;
    } catch (error) {
      logger.error(`Error calculating credit score for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate individual score factors based on user profile
   * @param {Object} user - User profile data
   * @returns {Object} Score factors
   */
  calculateScoreFactors(user) {
    const factors = {
      paymentHistory: 35, // Default good payment history
      creditUtilization: 30, // Default moderate utilization
      creditLength: 15, // Default moderate credit length
      creditMix: 10, // Default basic credit mix
      newCredit: 10 // Default no new credit inquiries
    };

    // Adjust factors based on employment and income
    if (user.employment) {
      const { annualIncome, employmentLength } = user.employment;
      
      // Payment history factor (35% weight) - based on income stability
      if (annualIncome >= 100000) {
        factors.paymentHistory = 38; // Excellent
      } else if (annualIncome >= 75000) {
        factors.paymentHistory = 36; // Very good
      } else if (annualIncome >= 50000) {
        factors.paymentHistory = 34; // Good
      } else if (annualIncome >= 30000) {
        factors.paymentHistory = 30; // Fair
      } else {
        factors.paymentHistory = 25; // Poor
      }

      // Credit utilization factor (30% weight) - based on income level
      if (annualIncome >= 100000) {
        factors.creditUtilization = 32; // Low utilization assumed
      } else if (annualIncome >= 75000) {
        factors.creditUtilization = 30; // Moderate utilization
      } else if (annualIncome >= 50000) {
        factors.creditUtilization = 28; // Higher utilization
      } else {
        factors.creditUtilization = 25; // High utilization likely
      }

      // Credit length factor (15% weight) - based on employment length as proxy
      if (employmentLength >= 60) { // 5+ years
        factors.creditLength = 18;
      } else if (employmentLength >= 36) { // 3+ years
        factors.creditLength = 16;
      } else if (employmentLength >= 24) { // 2+ years
        factors.creditLength = 14;
      } else if (employmentLength >= 12) { // 1+ year
        factors.creditLength = 12;
      } else {
        factors.creditLength = 8; // Less than 1 year
      }
    }

    // Age factor - older users typically have longer credit history
    if (user.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age >= 50) {
        factors.creditLength = Math.min(factors.creditLength + 3, 20);
        factors.creditMix = Math.min(factors.creditMix + 2, 15);
      } else if (age >= 35) {
        factors.creditLength = Math.min(factors.creditLength + 2, 18);
        factors.creditMix = Math.min(factors.creditMix + 1, 12);
      } else if (age < 25) {
        factors.creditLength = Math.max(factors.creditLength - 2, 5);
        factors.newCredit = Math.max(factors.newCredit - 2, 5);
      }
    }

    return factors;
  }

  /**
   * Calculate weighted credit score from factors
   * @param {Object} factors - Score factors
   * @returns {number} Calculated score
   */
  calculateWeightedScore(factors) {
    // FICO-like scoring model
    const baseScore = 300; // Minimum possible score
    const maxAdditionalPoints = 550; // Maximum additional points (850 - 300)
    
    // Calculate percentage of maximum points based on factors
    const totalFactorPoints = factors.paymentHistory + factors.creditUtilization + 
                             factors.creditLength + factors.creditMix + factors.newCredit;
    const maxPossiblePoints = 38 + 32 + 20 + 15 + 10; // Maximum possible factor points
    
    const factorPercentage = totalFactorPoints / maxPossiblePoints;
    const additionalPoints = Math.floor(factorPercentage * maxAdditionalPoints);
    
    return baseScore + additionalPoints;
  }

  /**
   * Get credit score from cache
   * @param {string} userId - User ID
   * @returns {Object|null} Cached credit score or null
   */
  getCachedScore(userId) {
    const cached = this.scoreCache.get(userId);
    if (!cached) return null;

    // Check if cache entry has expired
    const now = Date.now();
    if (now - cached.timestamp > (this.cacheTTL * 1000)) {
      this.scoreCache.delete(userId);
      return null;
    }

    return cached.data;
  }

  /**
   * Set credit score in cache
   * @param {string} userId - User ID
   * @param {Object} scoreData - Credit score data
   */
  setCachedScore(userId, scoreData) {
    this.scoreCache.set(userId, {
      data: scoreData,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for specific user or all users
   * @param {string} userId - User ID (optional, clears all if not provided)
   */
  clearCache(userId = null) {
    if (userId) {
      this.scoreCache.delete(userId);
      logger.info(`Credit score cache cleared for user ${userId}`);
    } else {
      this.scoreCache.clear();
      logger.info('Credit score cache cleared for all users');
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

    for (const [userId, cached] of this.scoreCache.entries()) {
      if (now - cached.timestamp > (this.cacheTTL * 1000)) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.scoreCache.size,
      validEntries,
      expiredEntries,
      cacheTTL: this.cacheTTL,
      hitRate: 0 // Initialize hit rate tracking if needed
    };
  }

  /**
   * Recalculate credit score for user (admin function)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} New credit score
   */
  async recalculateCreditScore(userId) {
    try {
      // Clear cache for this user
      this.clearCache(userId);
      
      // Force recalculation
      const newScore = await this.calculateCreditScore(userId);
      
      logger.info(`Credit score recalculated for user ${userId}`, {
        userId,
        newScore: newScore.score,
        action: 'admin_recalculation'
      });

      return newScore;
    } catch (error) {
      logger.error(`Error recalculating credit score for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get credit score history for user
   * @param {string} userId - User ID
   * @returns {Array} Credit score history
   */
  getCreditScoreHistory(userId) {
    try {
      const scores = lendingDataStore.getCreditScoresByUserId(userId);
      
      logger.info(`Credit score history retrieved for user ${userId}`, {
        userId,
        historyCount: scores.length
      });

      return scores;
    } catch (error) {
      logger.error(`Error retrieving credit score history for user ${userId}`, {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate credit score data
   * @param {Object} scoreData - Credit score data to validate
   * @returns {Object} Validation result
   */
  validateCreditScore(scoreData) {
    const errors = [];

    if (!scoreData.userId) {
      errors.push('User ID is required');
    }

    if (typeof scoreData.score !== 'number') {
      errors.push('Score must be a number');
    } else if (scoreData.score < this.minimumScore || scoreData.score > this.maximumScore) {
      errors.push(`Score must be between ${this.minimumScore} and ${this.maximumScore}`);
    }

    if (!scoreData.factors || typeof scoreData.factors !== 'object') {
      errors.push('Score factors are required');
    } else {
      const requiredFactors = ['paymentHistory', 'creditUtilization', 'creditLength', 'creditMix', 'newCredit'];
      for (const factor of requiredFactors) {
        if (typeof scoreData.factors[factor] !== 'number') {
          errors.push(`Factor ${factor} must be a number`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const creditScoringService = new CreditScoringService();

module.exports = creditScoringService;