const request = require('supertest');
const app = require('../../server');

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

// Mock the auth middleware for integration testing
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { 
      id: 'test_user_123', 
      username: 'test_user',
      role: 'admin',
      scopes: ['lending:credit:read', 'lending:admin'] 
    };
    next();
  },
  requireScopes: (scopes) => (req, res, next) => {
    req.scopes = scopes;
    next();
  },
  requireAdmin: (req, res, next) => {
    next();
  },
  requireOwnershipOrAdmin: (req, res, next) => {
    next();
  },
  requireLendingOfficer: (req, res, next) => {
    next();
  },
  requireCreditAnalyst: (req, res, next) => {
    next();
  }
}));

describe('Credit API Integration Tests', () => {
  beforeAll(async () => {
    // Wait for data store to initialize
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  describe('GET /api/credit/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/credit/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'credit-service');
      expect(response.body).toHaveProperty('components');
      expect(response.body.components).toHaveProperty('dataStore', 'healthy');
      expect(response.body.components).toHaveProperty('scoringCache', 'healthy');
      expect(response.body.components).toHaveProperty('limitCache', 'healthy');
      expect(response.body.components).toHaveProperty('scoring', 'healthy');
    });
  });

  describe('GET /api/credit/:userId/score', () => {
    it('should return credit score for existing user', async () => {
      const response = await request(app)
        .get('/api/credit/1/score')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId', '1');
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('scoreDate');
      expect(response.body.data).toHaveProperty('factors');
      expect(response.body.data).toHaveProperty('source');

      // Validate score is within valid range
      expect(response.body.data.score).toBeGreaterThanOrEqual(600);
      expect(response.body.data.score).toBeLessThanOrEqual(850);

      // Validate factors structure
      expect(response.body.data.factors).toHaveProperty('paymentHistory');
      expect(response.body.data.factors).toHaveProperty('creditUtilization');
      expect(response.body.data.factors).toHaveProperty('creditLength');
      expect(response.body.data.factors).toHaveProperty('creditMix');
      expect(response.body.data.factors).toHaveProperty('newCredit');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/credit/999/score')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'user_not_found');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body.error_description).toContain('User with ID 999 not found');
    });

    it('should support refresh parameter', async () => {
      const response = await request(app)
        .get('/api/credit/1/score?refresh=true')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('userId', '1');
    });
  });

  describe('GET /api/credit/:userId/history', () => {
    it('should return credit score history', async () => {
      const response = await request(app)
        .get('/api/credit/1/history')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const scoreEntry = response.body.data[0];
        expect(scoreEntry).toHaveProperty('id');
        expect(scoreEntry).toHaveProperty('score');
        expect(scoreEntry).toHaveProperty('scoreDate');
        expect(scoreEntry).toHaveProperty('factors');
        expect(scoreEntry).toHaveProperty('source');
      }
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/credit/1/history?limit=2&offset=0')
        .expect(200);

      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('offset', 0);
    });
  });

  describe('POST /api/credit/:userId/recalculate', () => {
    it('should recalculate credit score', async () => {
      const response = await request(app)
        .post('/api/credit/1/recalculate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('userId', '1');
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('recalculatedAt');
      expect(response.body.data).toHaveProperty('recalculatedBy');
    });
  });

  describe('GET /api/credit/cache/stats', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/credit/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalEntries');
      expect(response.body.data).toHaveProperty('validEntries');
      expect(response.body.data).toHaveProperty('expiredEntries');
      expect(response.body.data).toHaveProperty('cacheTTL');
    });
  });

  describe('DELETE /api/credit/cache/:userId?', () => {
    it('should clear cache for specific user', async () => {
      // First populate cache
      await request(app)
        .get('/api/credit/1/score')
        .expect(200);

      // Clear cache for user 1
      const response = await request(app)
        .delete('/api/credit/cache/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('user 1');
    });

    it('should clear cache for all users', async () => {
      // First populate cache
      await request(app)
        .get('/api/credit/1/score')
        .expect(200);

      // Clear all cache
      const response = await request(app)
        .delete('/api/credit/cache')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('all users');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid user ID format gracefully', async () => {
      const response = await request(app)
        .get('/api/credit//score')
        .expect(404); // Express returns 404 for malformed routes
    });

    it('should return proper error structure', async () => {
      const response = await request(app)
        .get('/api/credit/999/score')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body.error).toBe('user_not_found');
      expect(response.body.error_description).toContain('User with ID 999 not found');
    });
  });
});