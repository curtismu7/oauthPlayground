const creditScoringService = require('../../services/CreditScoringService');
const lendingDataStore = require('../../data/store');

describe('CreditScoringService', () => {
  beforeAll(async () => {
    // Wait for data store to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  beforeEach(() => {
    creditScoringService.clearCache();
  });

  afterEach(() => {
    creditScoringService.clearCache();
  });

  describe('getCreditScore', () => {
    it('should return existing credit score from data store', async () => {
      const creditScore = await creditScoringService.getCreditScore('1');

      expect(creditScore).toHaveProperty('userId', '1');
      expect(creditScore).toHaveProperty('score');
      expect(creditScore).toHaveProperty('scoreDate');
      expect(creditScore).toHaveProperty('factors');
      
      // Validate score is within valid range
      expect(creditScore.score).toBeGreaterThanOrEqual(300);
      expect(creditScore.score).toBeLessThanOrEqual(850);
    });

    it('should calculate credit score for user without existing score', async () => {
      // Create a test user first
      const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1-555-0199',
        dateOfBirth: new Date('1990-01-01'),
        ssn: '999-99-9999',
        address: {
          street: '999 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '99999'
        },
        employment: {
          employer: 'Test Corp',
          position: 'Test Engineer',
          annualIncome: 80000,
          employmentLength: 36
        }
      };

      // Add test user to data store
      const createdUser = await lendingDataStore.createUser(testUser);
      
      try {
        const creditScore = await creditScoringService.getCreditScore(createdUser.id);

        expect(creditScore).toHaveProperty('userId', createdUser.id);
        expect(creditScore).toHaveProperty('score');
        expect(creditScore).toHaveProperty('scoreDate');
        expect(creditScore).toHaveProperty('factors');
        expect(creditScore).toHaveProperty('source', 'calculated');

        // Validate score range
        expect(creditScore.score).toBeGreaterThanOrEqual(300);
        expect(creditScore.score).toBeLessThanOrEqual(850);

        // Validate factors
        expect(creditScore.factors).toHaveProperty('paymentHistory');
        expect(creditScore.factors).toHaveProperty('creditUtilization');
        expect(creditScore.factors).toHaveProperty('creditLength');
        expect(creditScore.factors).toHaveProperty('creditMix');
        expect(creditScore.factors).toHaveProperty('newCredit');
      } finally {
        // Clean up test user
        await lendingDataStore.deleteUser(createdUser.id);
      }
    });

    it('should use cache on subsequent calls', async () => {
      const firstCall = await creditScoringService.getCreditScore('1');
      const secondCall = await creditScoringService.getCreditScore('1');

      expect(firstCall.score).toBe(secondCall.score);
      expect(firstCall.scoreDate).toEqual(secondCall.scoreDate);
    });

    it('should force refresh when requested', async () => {
      const firstCall = await creditScoringService.getCreditScore('1');
      const refreshedCall = await creditScoringService.getCreditScore('1', true);

      expect(refreshedCall).toHaveProperty('userId', '1');
      expect(refreshedCall).toHaveProperty('score');
    });

    it('should throw error for non-existent user', async () => {
      await expect(creditScoringService.getCreditScore('999999'))
        .rejects
        .toThrow('User not found: 999999');
    });
  });

  describe('calculateScoreFactors', () => {
    it('should calculate factors based on user employment data', () => {
      const user = {
        dateOfBirth: new Date('1985-01-01'),
        employment: {
          annualIncome: 100000,
          employmentLength: 60
        }
      };

      const factors = creditScoringService.calculateScoreFactors(user);

      expect(factors).toHaveProperty('paymentHistory');
      expect(factors).toHaveProperty('creditUtilization');
      expect(factors).toHaveProperty('creditLength');
      expect(factors).toHaveProperty('creditMix');
      expect(factors).toHaveProperty('newCredit');

      // High income should result in better payment history factor
      expect(factors.paymentHistory).toBeGreaterThan(35);
    });

    it('should adjust factors based on age', () => {
      const youngUser = {
        dateOfBirth: new Date('2000-01-01'), // 24 years old
        employment: {
          annualIncome: 50000,
          employmentLength: 12
        }
      };

      const olderUser = {
        dateOfBirth: new Date('1970-01-01'), // 54 years old
        employment: {
          annualIncome: 50000,
          employmentLength: 12
        }
      };

      const youngFactors = creditScoringService.calculateScoreFactors(youngUser);
      const olderFactors = creditScoringService.calculateScoreFactors(olderUser);

      // Older users should have better credit length factors
      expect(olderFactors.creditLength).toBeGreaterThan(youngFactors.creditLength);
    });
  });

  describe('calculateWeightedScore', () => {
    it('should calculate score within valid range', () => {
      const factors = {
        paymentHistory: 35,
        creditUtilization: 30,
        creditLength: 15,
        creditMix: 10,
        newCredit: 10
      };

      const score = creditScoringService.calculateWeightedScore(factors);

      expect(score).toBeGreaterThanOrEqual(300);
      expect(score).toBeLessThanOrEqual(850);
    });

    it('should return higher scores for better factors', () => {
      const goodFactors = {
        paymentHistory: 38,
        creditUtilization: 32,
        creditLength: 20,
        creditMix: 15,
        newCredit: 10
      };

      const poorFactors = {
        paymentHistory: 25,
        creditUtilization: 20,
        creditLength: 8,
        creditMix: 5,
        newCredit: 5
      };

      const goodScore = creditScoringService.calculateWeightedScore(goodFactors);
      const poorScore = creditScoringService.calculateWeightedScore(poorFactors);

      expect(goodScore).toBeGreaterThan(poorScore);
    });
  });

  describe('cache functionality', () => {
    it('should cache credit scores', async () => {
      const userId = '1';
      
      // First call should calculate and cache
      await creditScoringService.getCreditScore(userId);
      
      // Check cache
      const cached = creditScoringService.getCachedScore(userId);
      expect(cached).not.toBeNull();
      expect(cached).toHaveProperty('userId', userId);
    });

    it('should expire cache entries after TTL', async () => {
      const userId = '1';
      
      // Temporarily set very short TTL for testing
      const originalTTL = creditScoringService.cacheTTL;
      creditScoringService.cacheTTL = 0.001; // 1ms
      
      try {
        await creditScoringService.getCreditScore(userId);
        
        // Wait for cache to expire
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const cached = creditScoringService.getCachedScore(userId);
        expect(cached).toBeNull();
      } finally {
        // Restore original TTL
        creditScoringService.cacheTTL = originalTTL;
      }
    });

    it('should clear cache for specific user', async () => {
      const userId = '1';
      
      await creditScoringService.getCreditScore(userId);
      creditScoringService.clearCache(userId);
      
      const cached = creditScoringService.getCachedScore(userId);
      expect(cached).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await creditScoringService.getCreditScore('1');
      await creditScoringService.getCreditScore('2');
      
      creditScoringService.clearCache();
      
      expect(creditScoringService.getCachedScore('1')).toBeNull();
      expect(creditScoringService.getCachedScore('2')).toBeNull();
    });
  });

  describe('validateCreditScore', () => {
    it('should validate correct credit score data', () => {
      const validScore = {
        userId: '1',
        score: 720,
        factors: {
          paymentHistory: 35,
          creditUtilization: 30,
          creditLength: 15,
          creditMix: 10,
          newCredit: 10
        }
      };

      const validation = creditScoringService.validateCreditScore(validScore);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid credit score data', () => {
      const invalidScore = {
        // Missing userId
        score: 'not a number',
        factors: {
          // Missing required factors
          paymentHistory: 35
        }
      };

      const validation = creditScoringService.validateCreditScore(invalidScore);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject scores outside valid range', () => {
      const invalidScore = {
        userId: '1',
        score: 1000, // Too high
        factors: {
          paymentHistory: 35,
          creditUtilization: 30,
          creditLength: 15,
          creditMix: 10,
          newCredit: 10
        }
      };

      const validation = creditScoringService.validateCreditScore(invalidScore);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Score must be between 600 and 850');
    });
  });
});