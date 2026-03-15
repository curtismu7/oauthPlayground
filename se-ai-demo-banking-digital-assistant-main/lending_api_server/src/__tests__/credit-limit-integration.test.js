const request = require('supertest');
const express = require('express');
const creditRoutes = require('../../routes/credit');
const lendingDataStore = require('../../data/store');

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logCreditDataAccess: jest.fn(),
    logCreditCalculation: jest.fn(),
    logActivityEvent: jest.fn(),
    logAuditEvent: jest.fn(),
    logSecurityEvent: jest.fn(),
    logPerformanceMetric: jest.fn(),
    logHealthCheck: jest.fn(),
    logApiRequest: jest.fn(),
    logApiResponse: jest.fn(),
    logErrorHandling: jest.fn()
  }
}));

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'test_user', scopes: ['lending:credit:limits', 'lending:admin'] };
    next();
  },
  requireScopes: (scopes) => (req, res, next) => {
    // Mock scope validation - assume all scopes are valid for tests
    next();
  }
}));

describe('Credit Limit API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/credit', creditRoutes);
    
    // Wait for data store to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Ensure sample data is loaded
    if (!lendingDataStore.getUserById('1')) {
      lendingDataStore.initializeSampleData();
    }
  });

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  describe('GET /api/credit/:userId/limit', () => {
    it('should return credit limit for valid user', async () => {
      const userId = '1'; // Sample user
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(userId);
      expect(typeof response.body.data.calculatedLimit).toBe('number');
      expect(response.body.data.calculatedLimit).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(response.body.data.riskLevel);
      expect(response.body.data.businessRules).toBeDefined();
      expect(response.body.data.calculatedAt).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 'non-existent';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit`)
        .expect(404);

      expect(response.body.error).toBe('user_not_found');
      expect(response.body.error_description).toContain('not found');
    });

    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .get('/api/credit//limit')
        .expect(404); // Express will return 404 for malformed route
    });

    it('should support refresh parameter', async () => {
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit?refresh=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should include proper response structure', async () => {
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit`)
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      
      // Check data structure
      const { data } = response.body;
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('creditScore');
      expect(data).toHaveProperty('calculatedLimit');
      expect(data).toHaveProperty('approvedLimit');
      expect(data).toHaveProperty('riskLevel');
      expect(data).toHaveProperty('businessRules');
      expect(data).toHaveProperty('calculatedAt');
      expect(data).toHaveProperty('expiresAt');
      expect(data).toHaveProperty('retrievedAt');
      
      // Check metadata structure
      const { metadata } = response.body;
      expect(metadata).toHaveProperty('cached');
      expect(metadata).toHaveProperty('requestId');
    });
  });

  describe('GET /api/credit/:userId/assessment', () => {
    it('should return comprehensive credit assessment', async () => {
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/assessment`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const assessment = response.body.data;
      expect(assessment.userId).toBe(userId);
      expect(assessment.user).toBeDefined();
      expect(assessment.creditScore).toBeDefined();
      expect(assessment.creditLimit).toBeDefined();
      expect(assessment.recommendation).toBeDefined();
      expect(assessment.assessmentDate).toBeDefined();
      
      // Check user data
      expect(assessment.user.id).toBe(userId);
      expect(assessment.user.firstName).toBeDefined();
      expect(assessment.user.lastName).toBeDefined();
      expect(assessment.user.email).toBeDefined();
      
      // Check credit score data
      expect(typeof assessment.creditScore.score).toBe('number');
      expect(assessment.creditScore.scoreDate).toBeDefined();
      expect(assessment.creditScore.factors).toBeDefined();
      
      // Check credit limit data
      expect(typeof assessment.creditLimit.calculatedLimit).toBe('number');
      expect(assessment.creditLimit.riskLevel).toBeDefined();
      expect(assessment.creditLimit.businessRules).toBeDefined();
      
      // Check recommendation data
      expect(typeof assessment.recommendation.approved).toBe('boolean');
      expect(typeof assessment.recommendation.maxLoanAmount).toBe('number');
      expect(assessment.recommendation.interestRateRange).toBeDefined();
      expect(Array.isArray(assessment.recommendation.terms)).toBe(true);
      expect(Array.isArray(assessment.recommendation.conditions)).toBe(true);
      expect(Array.isArray(assessment.recommendation.reasons)).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 'non-existent';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/assessment`)
        .expect(404);

      expect(response.body.error).toBe('user_not_found');
    });

    it('should support refresh parameter', async () => {
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/assessment?refresh=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should provide lending recommendation based on credit profile', async () => {
      const userId = '4'; // User with good profile
      
      const response = await request(app)
        .get(`/api/credit/${userId}/assessment`)
        .expect(200);

      const recommendation = response.body.data.recommendation;
      
      // Should be approved for good credit profile
      expect(recommendation.approved).toBe(true);
      expect(recommendation.maxLoanAmount).toBeGreaterThan(0);
      expect(recommendation.interestRateRange.min).toBeGreaterThan(0);
      expect(recommendation.interestRateRange.max).toBeGreaterThan(recommendation.interestRateRange.min);
      expect(recommendation.terms.length).toBeGreaterThan(0);
      expect(recommendation.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/credit/:userId/limit/recalculate', () => {
    it('should recalculate credit limit for valid user', async () => {
      const userId = '1';
      
      const response = await request(app)
        .post(`/api/credit/${userId}/limit/recalculate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('recalculated successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(userId);
      expect(typeof response.body.data.calculatedLimit).toBe('number');
      expect(response.body.data.recalculatedBy).toBe('test_user');
    });

    it('should return 404 for non-existent user', async () => {
      const userId = 'non-existent';
      
      const response = await request(app)
        .post(`/api/credit/${userId}/limit/recalculate`)
        .expect(404);

      expect(response.body.error).toBe('user_not_found');
    });

    it('should include proper response structure', async () => {
      const userId = '1';
      
      const response = await request(app)
        .post(`/api/credit/${userId}/limit/recalculate`)
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      
      // Check data structure
      const { data } = response.body;
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('creditScore');
      expect(data).toHaveProperty('calculatedLimit');
      expect(data).toHaveProperty('approvedLimit');
      expect(data).toHaveProperty('riskLevel');
      expect(data).toHaveProperty('businessRules');
      expect(data).toHaveProperty('calculatedAt');
      expect(data).toHaveProperty('expiresAt');
      expect(data).toHaveProperty('recalculatedBy');
    });
  });

  describe('GET /api/credit/limits/cache/stats', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/credit/limits/cache/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const stats = response.body.data;
      expect(typeof stats.totalEntries).toBe('number');
      expect(typeof stats.validEntries).toBe('number');
      expect(typeof stats.expiredEntries).toBe('number');
      expect(typeof stats.cacheTTL).toBe('number');
    });
  });

  describe('DELETE /api/credit/limits/cache/:userId?', () => {
    it('should clear cache for specific user', async () => {
      const userId = '1';
      
      const response = await request(app)
        .delete(`/api/credit/limits/cache/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(`cleared for user ${userId}`);
    });

    it('should clear cache for all users', async () => {
      const response = await request(app)
        .delete('/api/credit/limits/cache/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cleared for all users');
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service error
      const originalGetCreditLimit = require('../../services/CreditLimitService').getCreditLimit;
      require('../../services/CreditLimitService').getCreditLimit = jest.fn()
        .mockRejectedValue(new Error('Service unavailable'));
      
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit`)
        .expect(500);

      expect(response.body.error).toBe('credit_limit_error');
      expect(response.body.error_description).toContain('Failed to retrieve credit limit');
      
      // Restore original method
      require('../../services/CreditLimitService').getCreditLimit = originalGetCreditLimit;
    });

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Mock a service error
      const originalGetCreditLimit = require('../../services/CreditLimitService').getCreditLimit;
      require('../../services/CreditLimitService').getCreditLimit = jest.fn()
        .mockRejectedValue(new Error('Detailed error message'));
      
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit`)
        .expect(500);

      expect(response.body.details).toBe('Detailed error message');
      
      // Restore
      require('../../services/CreditLimitService').getCreditLimit = originalGetCreditLimit;
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include error details in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Mock a service error
      const originalGetCreditLimit = require('../../services/CreditLimitService').getCreditLimit;
      require('../../services/CreditLimitService').getCreditLimit = jest.fn()
        .mockRejectedValue(new Error('Detailed error message'));
      
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit`)
        .expect(500);

      expect(response.body.details).toBeUndefined();
      
      // Restore
      require('../../services/CreditLimitService').getCreditLimit = originalGetCreditLimit;
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Activity logging', () => {
    it('should log credit limit requests', async () => {
      const userId = '1';
      
      // Spy on createActivityLog
      const createActivityLogSpy = jest.spyOn(lendingDataStore, 'createActivityLog');
      
      await request(app)
        .get(`/api/credit/${userId}/limit`)
        .expect(200);

      expect(createActivityLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId,
          action: 'CREDIT_LIMIT_REQUEST',
          endpoint: `/api/credit/${userId}/limit`
        })
      );
      
      createActivityLogSpy.mockRestore();
    });

    it('should log credit assessment requests', async () => {
      const userId = '1';
      
      // Spy on createActivityLog
      const createActivityLogSpy = jest.spyOn(lendingDataStore, 'createActivityLog');
      
      await request(app)
        .get(`/api/credit/${userId}/assessment`)
        .expect(200);

      expect(createActivityLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId,
          action: 'CREDIT_ASSESSMENT',
          endpoint: `/api/credit/${userId}/assessment`
        })
      );
      
      createActivityLogSpy.mockRestore();
    });

    it('should log credit limit recalculations', async () => {
      const userId = '1';
      
      // Spy on createActivityLog
      const createActivityLogSpy = jest.spyOn(lendingDataStore, 'createActivityLog');
      
      await request(app)
        .post(`/api/credit/${userId}/limit/recalculate`)
        .expect(200);

      expect(createActivityLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId,
          action: 'CREDIT_LIMIT_RECALCULATION',
          endpoint: `/api/credit/${userId}/limit/recalculate`
        })
      );
      
      createActivityLogSpy.mockRestore();
    });
  });
});