const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logSecurityEvent: jest.fn(),
    logAuditEvent: jest.fn(),
    logApiRequest: jest.fn(),
    logApiResponse: jest.fn(),
    logCreditDataAccess: jest.fn(),
    logCreditCalculation: jest.fn(),
    logActivityEvent: jest.fn()
  }
}));

const app = require('../../server');

describe('API Endpoints Scope Validation Tests', () => {
  let tokens = {};

  beforeAll(() => {
    const secret = process.env.SESSION_SECRET || 'test-secret';
    const basePayload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    // Create tokens with different scope combinations
    tokens.noScopes = jwt.sign({
      ...basePayload,
      sub: 'user-no-scopes',
      username: 'no_scopes_user',
      role: 'user',
      scopes: []
    }, secret);

    tokens.basicRead = jwt.sign({
      ...basePayload,
      sub: 'user-basic',
      username: 'basic_user',
      role: 'user',
      scopes: ['lending:read']
    }, secret);

    tokens.creditRead = jwt.sign({
      ...basePayload,
      sub: 'user-credit',
      username: 'credit_user',
      role: 'user',
      scopes: ['lending:read', 'lending:credit:read']
    }, secret);

    tokens.creditLimits = jwt.sign({
      ...basePayload,
      sub: 'user-limits',
      username: 'limits_user',
      role: 'user',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits']
    }, secret);

    tokens.admin = jwt.sign({
      ...basePayload,
      sub: 'admin-user',
      username: 'admin_user',
      role: 'admin',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits', 'lending:admin']
    }, secret);

    tokens.lendingOfficer = jwt.sign({
      ...basePayload,
      sub: 'officer-user',
      username: 'lending_officer',
      role: 'lending_officer',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits', 'lending:officer']
    }, secret);
  });

  describe('User Endpoints Scope Validation', () => {
    describe('GET /api/users/me', () => {
      it('should require lending:read scope', async () => {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${tokens.noScopes}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
        expect(response.body.required_scopes).toContain('lending:read');
      });

      it('should allow access with lending:read scope', async () => {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${tokens.basicRead}`)
          .expect(200);

        expect(response.body).toHaveProperty('user');
      });
    });

    describe('GET /api/users/:id', () => {
      it('should require lending:read scope', async () => {
        const response = await request(app)
          .get('/api/users/1')
          .set('Authorization', `Bearer ${tokens.noScopes}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
        expect(response.body.required_scopes).toContain('lending:read');
      });

      it('should allow access with lending:read scope', async () => {
        const response = await request(app)
          .get('/api/users/1')
          .set('Authorization', `Bearer ${tokens.basicRead}`)
          .expect(200);

        expect(response.body).toHaveProperty('user');
      });
    });

    describe('GET /api/users/search/:query', () => {
      it('should require lending:read scope', async () => {
        const response = await request(app)
          .get('/api/users/search/John')
          .set('Authorization', `Bearer ${tokens.noScopes}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
      });

      it('should allow access with lending:read scope', async () => {
        const response = await request(app)
          .get('/api/users/search/John')
          .set('Authorization', `Bearer ${tokens.basicRead}`)
          .expect(200);

        expect(response.body).toHaveProperty('users');
      });
    });

    describe('GET /api/users (admin list)', () => {
      it('should require admin access', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'access_denied');
        expect(response.body.error_description).toContain('Admin access required');
      });

      it('should allow access for admin users', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(response.body).toHaveProperty('users');
      });
    });
  });

  describe('Credit Endpoints Scope Validation', () => {
    describe('GET /api/credit/:userId/score', () => {
      it('should require lending:credit:read scope', async () => {
        const response = await request(app)
          .get('/api/credit/1/score')
          .set('Authorization', `Bearer ${tokens.basicRead}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
        expect(response.body.required_scopes).toContain('lending:credit:read');
      });

      it('should allow access with lending:credit:read scope', async () => {
        const response = await request(app)
          .get('/api/credit/1/score')
          .set('Authorization', `Bearer ${tokens.creditRead}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/credit/:userId/limit', () => {
      it('should require lending:credit:limits scope', async () => {
        const response = await request(app)
          .get('/api/credit/1/limit')
          .set('Authorization', `Bearer ${tokens.creditRead}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
        expect(response.body.required_scopes).toContain('lending:credit:limits');
      });

      it('should allow access with lending:credit:limits scope', async () => {
        const response = await request(app)
          .get('/api/credit/1/limit')
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/credit/:userId/assessment', () => {
      it('should require both credit:read and credit:limits scopes', async () => {
        const response = await request(app)
          .get('/api/credit/1/assessment')
          .set('Authorization', `Bearer ${tokens.creditRead}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
        expect(response.body.required_scopes).toContain('lending:credit:limits');
      });

      it('should allow access with both required scopes', async () => {
        const response = await request(app)
          .get('/api/credit/1/assessment')
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('creditScore');
        expect(response.body.data).toHaveProperty('creditLimit');
      });
    });

    describe('POST /api/credit/:userId/recalculate', () => {
      it('should require admin or lending officer access', async () => {
        const response = await request(app)
          .post('/api/credit/1/recalculate')
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'access_denied');
      });

      it('should allow access for admin users', async () => {
        const response = await request(app)
          .post('/api/credit/1/recalculate')
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });

      it('should allow access for lending officers', async () => {
        const response = await request(app)
          .post('/api/credit/1/recalculate')
          .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/credit/:userId/history', () => {
      it('should require lending:credit:read scope', async () => {
        const response = await request(app)
          .get('/api/credit/1/history')
          .set('Authorization', `Bearer ${tokens.basicRead}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
      });

      it('should allow access with lending:credit:read scope', async () => {
        const response = await request(app)
          .get('/api/credit/1/history')
          .set('Authorization', `Bearer ${tokens.creditRead}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('Admin Endpoints Scope Validation', () => {
    describe('GET /api/admin/users', () => {
      it('should require admin access', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'access_denied');
      });

      it('should allow access for admin users', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(response.body).toHaveProperty('users');
      });
    });

    describe('GET /api/admin/credit/reports', () => {
      it('should require admin access', async () => {
        const response = await request(app)
          .get('/api/admin/credit/reports')
          .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'access_denied');
      });

      it('should allow access for admin users', async () => {
        const response = await request(app)
          .get('/api/admin/credit/reports')
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('POST /api/admin/credit/recalculate', () => {
      it('should require admin access', async () => {
        const response = await request(app)
          .post('/api/admin/credit/recalculate')
          .send({ userIds: ['1', '2'] })
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'access_denied');
      });

      it('should allow access for admin users', async () => {
        const response = await request(app)
          .post('/api/admin/credit/recalculate')
          .send({ userIds: ['1', '2'] })
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('Cache Management Endpoints', () => {
    describe('GET /api/credit/cache/stats', () => {
      it('should require admin or lending officer access', async () => {
        const response = await request(app)
          .get('/api/credit/cache/stats')
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'access_denied');
      });

      it('should allow access for admin users', async () => {
        const response = await request(app)
          .get('/api/credit/cache/stats')
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('DELETE /api/credit/cache/:userId?', () => {
      it('should require admin access', async () => {
        const response = await request(app)
          .delete('/api/credit/cache/1')
          .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'access_denied');
      });

      it('should allow access for admin users', async () => {
        const response = await request(app)
          .delete('/api/credit/cache/1')
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('Health Check Endpoints', () => {
    describe('GET /api/health', () => {
      it('should not require authentication', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        expect(response.body).toHaveProperty('status');
      });
    });

    describe('GET /api/credit/health', () => {
      it('should require basic lending:read scope', async () => {
        const response = await request(app)
          .get('/api/credit/health')
          .set('Authorization', `Bearer ${tokens.noScopes}`)
          .expect(403);

        expect(response.body).toHaveProperty('error', 'insufficient_scope');
      });

      it('should allow access with lending:read scope', async () => {
        const response = await request(app)
          .get('/api/credit/health')
          .set('Authorization', `Bearer ${tokens.basicRead}`)
          .expect(200);

        expect(response.body).toHaveProperty('status');
      });
    });
  });

  describe('Scope Combination Edge Cases', () => {
    it('should handle multiple required scopes correctly', async () => {
      // Test endpoint that requires multiple scopes
      const response = await request(app)
        .get('/api/credit/1/assessment')
        .set('Authorization', `Bearer ${tokens.creditRead}`) // Missing credit:limits
        .expect(403);

      expect(response.body).toHaveProperty('error', 'insufficient_scope');
      expect(response.body.required_scopes).toEqual(
        expect.arrayContaining(['lending:credit:read', 'lending:credit:limits'])
      );
    });

    it('should validate all required scopes are present', async () => {
      const secret = process.env.SESSION_SECRET || 'test-secret';
      const partialScopesToken = jwt.sign({
        sub: 'partial-user',
        username: 'partial_user',
        role: 'user',
        scopes: ['lending:read', 'lending:credit:limits'], // Missing credit:read
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, secret);

      const response = await request(app)
        .get('/api/credit/1/assessment')
        .set('Authorization', `Bearer ${partialScopesToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'insufficient_scope');
      expect(response.body.required_scopes).toContain('lending:credit:read');
    });

    it('should handle case-sensitive scope validation', async () => {
      const secret = process.env.SESSION_SECRET || 'test-secret';
      const wrongCaseToken = jwt.sign({
        sub: 'case-user',
        username: 'case_user',
        role: 'user',
        scopes: ['LENDING:READ', 'lending:credit:READ'], // Wrong case
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, secret);

      const response = await request(app)
        .get('/api/credit/1/score')
        .set('Authorization', `Bearer ${wrongCaseToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'insufficient_scope');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin role to access all endpoints', async () => {
      const endpoints = [
        '/api/users/me',
        '/api/users/1',
        '/api/credit/1/score',
        '/api/credit/1/limit',
        '/api/credit/1/assessment',
        '/api/admin/users'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${tokens.admin}`);
        
        expect(response.status).not.toBe(403);
      }
    });

    it('should restrict regular users from admin endpoints', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/credit/reports'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${tokens.creditLimits}`)
          .expect(403);
        
        expect(response.body).toHaveProperty('error', 'access_denied');
      }
    });
  });

  describe('Error Response Consistency', () => {
    it('should return consistent error format for scope violations', async () => {
      const response = await request(app)
        .get('/api/credit/1/score')
        .set('Authorization', `Bearer ${tokens.basicRead}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'insufficient_scope');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body).toHaveProperty('required_scopes');
      expect(response.body).toHaveProperty('provided_scopes');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');
    });

    it('should return consistent error format for admin access violations', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.creditLimits}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'access_denied');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');
    });
  });
});