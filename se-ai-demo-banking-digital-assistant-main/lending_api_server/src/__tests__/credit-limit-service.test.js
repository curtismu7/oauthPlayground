const creditLimitService = require('../../services/CreditLimitService');
const creditScoringService = require('../../services/CreditScoringService');
const lendingDataStore = require('../../data/store');

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('CreditLimitService', () => {
  beforeAll(async () => {
    // Wait for data store to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Ensure sample data is loaded
    if (!lendingDataStore.getUserById('1')) {
      lendingDataStore.initializeSampleData();
    }
  });

  beforeEach(() => {
    // Clear caches before each test
    creditLimitService.clearCache();
    creditScoringService.clearCache();
  });

  describe('getCreditLimit', () => {
    it('should return credit limit for existing user', async () => {
      const userId = '1'; // Sample user from data
      const creditLimit = await creditLimitService.getCreditLimit(userId);
      
      expect(creditLimit).toBeDefined();
      expect(creditLimit.userId).toBe(userId);
      expect(typeof creditLimit.calculatedLimit).toBe('number');
      expect(creditLimit.calculatedLimit).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(creditLimit.riskLevel);
    });

    it('should throw error for non-existent user', async () => {
      const userId = 'non-existent';
      
      await expect(creditLimitService.getCreditLimit(userId))
        .rejects.toThrow('User not found: non-existent');
    });

    it('should use cached result when available', async () => {
      const userId = '1';
      
      // First call - should calculate
      const firstResult = await creditLimitService.getCreditLimit(userId);
      
      // Second call - should use cache
      const secondResult = await creditLimitService.getCreditLimit(userId);
      
      expect(firstResult).toEqual(secondResult);
    });

    it('should force refresh when requested', async () => {
      const userId = '1';
      
      // First call
      await creditLimitService.getCreditLimit(userId);
      
      // Force refresh
      const refreshedResult = await creditLimitService.getCreditLimit(userId, true);
      
      expect(refreshedResult).toBeDefined();
      expect(refreshedResult.userId).toBe(userId);
    });
  });

  describe('calculateCreditLimit', () => {
    it('should calculate credit limit based on user profile and credit score', async () => {
      const userId = '1';
      const creditLimit = await creditLimitService.calculateCreditLimit(userId);
      
      expect(creditLimit).toBeDefined();
      expect(creditLimit.userId).toBe(userId);
      expect(typeof creditLimit.calculatedLimit).toBe('number');
      expect(creditLimit.calculatedLimit).toBeGreaterThanOrEqual(1000); // Minimum limit
      expect(creditLimit.calculatedLimit).toBeLessThanOrEqual(100000); // Maximum limit
      expect(creditLimit.businessRules).toBeDefined();
      expect(creditLimit.businessRules.incomeMultiplier).toBeDefined();
    });

    it('should assign minimum limit for users below minimum credit score', async () => {
      const userId = '1';
      
      // Mock a low credit score
      jest.spyOn(creditScoringService, 'getCreditScore').mockResolvedValue({
        userId: userId,
        score: 550, // Below minimum of 600
        scoreDate: new Date(),
        factors: {},
        source: 'calculated'
      });
      
      const creditLimit = await creditLimitService.calculateCreditLimit(userId);
      
      expect(creditLimit.calculatedLimit).toBe(1000); // Minimum limit
      expect(creditLimit.riskLevel).toBe('high');
      expect(creditLimit.businessRules.reason).toBe('below_minimum_credit_score');
    });

    it('should calculate higher limits for users with excellent credit', async () => {
      const userId = '4'; // User with high income and good employment
      
      // Mock excellent credit score
      jest.spyOn(creditScoringService, 'getCreditScore').mockResolvedValue({
        userId: userId,
        score: 780,
        scoreDate: new Date(),
        factors: {},
        source: 'calculated'
      });
      
      const creditLimit = await creditLimitService.calculateCreditLimit(userId);
      
      expect(creditLimit.calculatedLimit).toBeGreaterThan(20000);
      expect(creditLimit.riskLevel).toBe('low');
    });
  });

  describe('calculateBaseLimit', () => {
    it('should calculate base limit using income and credit score', () => {
      const user = {
        id: '1',
        employment: {
          annualIncome: 80000,
          employmentLength: 36
        }
      };
      const creditScore = 720;
      
      const baseLimit = creditLimitService.calculateBaseLimit(user, creditScore);
      
      expect(typeof baseLimit).toBe('number');
      expect(baseLimit).toBeGreaterThan(0);
      expect(baseLimit).toBe(Math.round(80000 * 0.30)); // Good credit score multiplier
    });

    it('should return minimum limit for users without employment data', () => {
      const user = { id: '1' }; // No employment data
      const creditScore = 720;
      
      const baseLimit = creditLimitService.calculateBaseLimit(user, creditScore);
      
      expect(baseLimit).toBe(1000); // Minimum limit
    });

    it('should use different multipliers based on credit score', () => {
      const user = {
        id: '1',
        employment: {
          annualIncome: 100000,
          employmentLength: 36
        }
      };
      
      // Excellent credit score
      const excellentLimit = creditLimitService.calculateBaseLimit(user, 780);
      expect(excellentLimit).toBe(Math.round(100000 * 0.35));
      
      // Good credit score
      const goodLimit = creditLimitService.calculateBaseLimit(user, 720);
      expect(goodLimit).toBe(Math.round(100000 * 0.30));
      
      // Fair credit score
      const fairLimit = creditLimitService.calculateBaseLimit(user, 670);
      expect(fairLimit).toBe(Math.round(100000 * 0.25));
      
      // Poor credit score
      const poorLimit = creditLimitService.calculateBaseLimit(user, 620);
      expect(poorLimit).toBe(Math.round(100000 * 0.20));
    });
  });

  describe('assessRisk', () => {
    it('should assess low risk for high income and excellent credit', () => {
      const user = {
        id: '1',
        dateOfBirth: new Date('1985-01-01'),
        employment: {
          annualIncome: 120000,
          employmentLength: 60
        }
      };
      const creditScore = 780;
      
      const assessment = creditLimitService.assessRisk(user, creditScore);
      
      expect(assessment.level).toBe('low');
      expect(assessment.factors).toContain('excellent_credit_score');
      expect(assessment.factors).toContain('high_income');
      expect(assessment.factors).toContain('stable_employment');
      expect(assessment.adjustment).toBe(1.0);
    });

    it('should assess high risk for low income and poor credit', () => {
      const user = {
        id: '1',
        dateOfBirth: new Date('2002-01-01'), // Young borrower (22 years old)
        employment: {
          annualIncome: 25000,
          employmentLength: 6
        }
      };
      const creditScore = 620;
      
      const assessment = creditLimitService.assessRisk(user, creditScore);
      
      expect(assessment.level).toBe('high');
      expect(assessment.factors).toContain('poor_credit_score');
      expect(assessment.factors).toContain('very_low_income');
      expect(assessment.factors).toContain('unstable_employment');
      expect(assessment.factors).toContain('young_borrower');
      expect(assessment.adjustment).toBe(0.70);
    });

    it('should assess medium risk for moderate profile', () => {
      const user = {
        id: '1',
        dateOfBirth: new Date('1990-01-01'),
        employment: {
          annualIncome: 60000,
          employmentLength: 30
        }
      };
      const creditScore = 680;
      
      const assessment = creditLimitService.assessRisk(user, creditScore);
      
      expect(assessment.level).toBe('medium');
      expect(assessment.factors).toContain('fair_credit_score');
      expect(assessment.factors).toContain('moderate_income');
      expect(assessment.adjustment).toBe(0.85);
    });
  });

  describe('getCreditAssessment', () => {
    it('should return comprehensive credit assessment', async () => {
      const userId = '1';
      const assessment = await creditLimitService.getCreditAssessment(userId);
      
      expect(assessment).toBeDefined();
      expect(assessment.userId).toBe(userId);
      expect(assessment.user).toBeDefined();
      expect(assessment.creditScore).toBeDefined();
      expect(assessment.creditLimit).toBeDefined();
      expect(assessment.recommendation).toBeDefined();
      expect(assessment.assessmentDate).toBeDefined();
      
      // Check recommendation structure
      expect(typeof assessment.recommendation.approved).toBe('boolean');
      expect(typeof assessment.recommendation.maxLoanAmount).toBe('number');
      expect(assessment.recommendation.interestRateRange).toBeDefined();
      expect(assessment.recommendation.interestRateRange.min).toBeDefined();
      expect(assessment.recommendation.interestRateRange.max).toBeDefined();
      expect(Array.isArray(assessment.recommendation.terms)).toBe(true);
      expect(Array.isArray(assessment.recommendation.conditions)).toBe(true);
      expect(Array.isArray(assessment.recommendation.reasons)).toBe(true);
    });

    it('should force refresh both score and limit when requested', async () => {
      const userId = '1';
      
      // First call
      await creditLimitService.getCreditAssessment(userId);
      
      // Force refresh
      const refreshedAssessment = await creditLimitService.getCreditAssessment(userId, true);
      
      expect(refreshedAssessment).toBeDefined();
      expect(refreshedAssessment.userId).toBe(userId);
    });
  });

  describe('generateRecommendation', () => {
    it('should approve loan for good credit profile', () => {
      const creditScore = { score: 750 };
      const creditLimit = { 
        calculatedLimit: 25000, 
        approvedLimit: 25000, 
        riskLevel: 'low' 
      };
      
      const recommendation = creditLimitService.generateRecommendation(creditScore, creditLimit);
      
      expect(recommendation.approved).toBe(true);
      expect(recommendation.maxLoanAmount).toBe(25000);
      expect(recommendation.interestRateRange.min).toBe(3.5);
      expect(recommendation.interestRateRange.max).toBe(6.0);
      expect(recommendation.terms).toContain('Prime rate eligible');
      expect(recommendation.reasons).toContain('Excellent credit score');
    });

    it('should reject loan for poor credit profile', () => {
      const creditScore = { score: 550 };
      const creditLimit = { 
        calculatedLimit: 1000, 
        approvedLimit: 1000, 
        riskLevel: 'high' 
      };
      
      const recommendation = creditLimitService.generateRecommendation(creditScore, creditLimit);
      
      expect(recommendation.approved).toBe(false);
      expect(recommendation.maxLoanAmount).toBe(0);
      expect(recommendation.reasons).toContain('Credit score 550 below minimum 600');
      expect(recommendation.conditions).toContain('Credit improvement required');
    });

    it('should set appropriate interest rates based on credit score', () => {
      const testCases = [
        { score: 780, expectedMin: 3.5, expectedMax: 6.0 },
        { score: 720, expectedMin: 5.0, expectedMax: 8.5 },
        { score: 670, expectedMin: 7.5, expectedMax: 12.0 },
        { score: 620, expectedMin: 10.0, expectedMax: 18.0 }
      ];
      
      testCases.forEach(({ score, expectedMin, expectedMax }) => {
        const creditScore = { score };
        const creditLimit = { 
          calculatedLimit: 15000, 
          approvedLimit: 15000, 
          riskLevel: 'medium' 
        };
        
        const recommendation = creditLimitService.generateRecommendation(creditScore, creditLimit);
        
        expect(recommendation.interestRateRange.min).toBe(expectedMin);
        expect(recommendation.interestRateRange.max).toBe(expectedMax);
      });
    });
  });

  describe('cache management', () => {
    it('should cache credit limits', async () => {
      const userId = '1';
      
      // First call - should calculate and cache
      await creditLimitService.getCreditLimit(userId);
      
      // Check cache
      const cached = creditLimitService.getCachedLimit(userId);
      expect(cached).toBeDefined();
      expect(cached.userId).toBe(userId);
    });

    it('should clear cache for specific user', async () => {
      const userId = '1';
      
      // Cache a limit
      await creditLimitService.getCreditLimit(userId);
      expect(creditLimitService.getCachedLimit(userId)).toBeDefined();
      
      // Clear cache for user
      creditLimitService.clearCache(userId);
      expect(creditLimitService.getCachedLimit(userId)).toBeNull();
    });

    it('should clear all cache', async () => {
      const userId1 = '1';
      const userId2 = '2';
      
      // Cache limits for multiple users
      await creditLimitService.getCreditLimit(userId1);
      await creditLimitService.getCreditLimit(userId2);
      
      // Clear all cache
      creditLimitService.clearCache();
      
      expect(creditLimitService.getCachedLimit(userId1)).toBeNull();
      expect(creditLimitService.getCachedLimit(userId2)).toBeNull();
    });

    it('should return cache statistics', async () => {
      const userId = '1';
      
      // Cache a limit
      await creditLimitService.getCreditLimit(userId);
      
      const stats = creditLimitService.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalEntries).toBe('number');
      expect(typeof stats.validEntries).toBe('number');
      expect(typeof stats.expiredEntries).toBe('number');
      expect(typeof stats.cacheTTL).toBe('number');
    });
  });

  describe('validation', () => {
    it('should validate valid credit limit data', () => {
      const validData = {
        userId: '1',
        calculatedLimit: 15000,
        creditScore: 720,
        riskLevel: 'medium'
      };
      
      const validation = creditLimitService.validateCreditLimit(validData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid credit limit data', () => {
      const invalidData = {
        // Missing userId
        calculatedLimit: -5000, // Negative limit
        creditScore: 950, // Invalid score
        riskLevel: 'invalid' // Invalid risk level
      };
      
      const validation = creditLimitService.validateCreditLimit(invalidData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('User ID is required');
      expect(validation.errors).toContain('Calculated limit cannot be negative');
      expect(validation.errors).toContain('Credit score must be between 300 and 850');
      expect(validation.errors).toContain('Risk level must be low, medium, or high');
    });
  });

  describe('recalculateCreditLimit', () => {
    it('should recalculate credit limit and clear cache', async () => {
      const userId = '1';
      
      // First calculation
      const originalLimit = await creditLimitService.getCreditLimit(userId);
      
      // Recalculate
      const newLimit = await creditLimitService.recalculateCreditLimit(userId);
      
      expect(newLimit).toBeDefined();
      expect(newLimit.userId).toBe(userId);
      expect(typeof newLimit.calculatedLimit).toBe('number');
      
      // Cache should be cleared
      const cached = creditLimitService.getCachedLimit(userId);
      expect(cached).toBeDefined(); // Should be re-cached after recalculation
    });
  });
});