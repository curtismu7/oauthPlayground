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
    logApiResponse: jest.fn()
  }
}));

// Don't mock auth middleware for this test - we want to test it
const app = require('../../server');

describe('OAuth Authentication Integration Tests', () => {
  let validToken;
  let expiredToken;
  let invalidToken;

  beforeAll(() => {
    // Create test tokens
    const secret = process.env.SESSION_SECRET || 'test-secret';
    
    validToken = jwt.sign({
      sub: 'test-user-123',
      username: 'test_user',
      email: 'test@example.com',
      role: 'user',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    }, secret);

    expiredToken = jwt.sign({
      sub: 'test-user-123',
      username: 'test_user',
      email: 'test@example.com',
      role: 'user',
      scopes: ['lending:read'],
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600  // 1 hour ago (expired)
    }, secret);

    invalidToken = 'invalid.jwt.token';
  });

  describe('Token Validation', () => {
    it('should accept valid JWT token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'unauthorized');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body.error_description).toContain('No token provided');
    });

    it('should reject expired tokens', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'token_expired');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body.error_description).toContain('Token has expired');
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'invalid_token');
      expect(response.body).toHaveProperty('error_description');
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'invalid_token');
      expect(response.body).toHaveProperty('error_description');
    });
  });

  describe('Scope Validation', () => {
    it('should allow access with correct scopes', async () => {
      const response = await request(app)
        .get('/api/credit/1/score')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should deny access without required scopes', async () => {
      // Create token without credit:read scope
      const secret = process.env.SESSION_SECRET || 'test-secret';
      const limitedToken = jwt.sign({
        sub: 'test-user-123',
        username: 'test_user',
        role: 'user',
        scopes: ['lending:read'], // Missing lending:credit:read
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, secret);

      const response = await request(app)
        .get('/api/credit/1/score')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'insufficient_scope');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body.error_description).toContain('lending:credit:read');
    });

    it('should require admin scope for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'access_denied');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body.error_description).toContain('Admin access required');
    });

    it('should allow admin access with admin scope', async () => {
      const secret = process.env.SESSION_SECRET || 'test-secret';
      const adminToken = jwt.sign({
        sub: 'admin-user-123',
        username: 'admin_user',
        role: 'admin',
        scopes: ['lending:read', 'lending:admin'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, secret);

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });
  });

  describe('Multiple Scope Requirements', () => {
    it('should require all specified scopes for credit limits', async () => {
      const secret = process.env.SESSION_SECRET || 'test-secret';
      const partialToken = jwt.sign({
        sub: 'test-user-123',
        username: 'test_user',
        role: 'user',
        scopes: ['lending:read', 'lending:credit:read'], // Missing lending:credit:limits
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, secret);

      const response = await request(app)
        .get('/api/credit/1/limit')
        .set('Authorization', `Bearer ${partialToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'insufficient_scope');
      expect(response.body.error_description).toContain('lending:credit:limits');
    });

    it('should allow access when all required scopes are present', async () => {
      const response = await request(app)
        .get('/api/credit/1/limit')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('User Context', () => {
    it('should set user context from token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id', 'test-user-123');
    });

    it('should handle ownership validation', async () => {
      // Test accessing own data
      const response = await request(app)
        .get('/api/users/test-user-123')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id', 'test-user-123');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for auth failures', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/users/me');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('should return consistent error format for scope failures', async () => {
      const secret = process.env.SESSION_SECRET || 'test-secret';
      const limitedToken = jwt.sign({
        sub: 'test-user-123',
        username: 'test_user',
        role: 'user',
        scopes: ['lending:read'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }, secret);

      const response = await request(app)
        .get('/api/credit/1/score')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'insufficient_scope');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/credit/1/score');
      expect(response.body).toHaveProperty('method', 'GET');
      expect(response.body).toHaveProperty('required_scopes');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to authentication endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(20).fill().map(() => 
        request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${invalidToken}`)
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});