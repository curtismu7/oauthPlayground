/**
 * End-to-End User Workflow Tests
 * Tests complete user workflows from authentication to credit assessment
 */

const request = require('supertest');
const { generateTestToken } = require('./setup');

// Import the app - we'll need to create a test server instance
let app;

beforeAll(async () => {
  // Import server after environment setup
  app = require('../../../server');
});

describe('E2E User Workflows', () => {
  let authToken;
  let adminToken;
  let testUserId;

  beforeAll(async () => {
    // Generate tokens for different user types
    authToken = generateTestToken({
      sub: 'test-user-123',
      scope: 'lending:read lending:credit:read lending:credit:limits'
    });
    
    adminToken = generateTestToken({
      sub: 'admin-user-123',
      scope: 'lending:admin lending:read lending:credit:read lending:credit:limits'
    });

    // Get a test user ID from the system
    const usersResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    testUserId = usersResponse.body.data[0]?.id;
  });

  describe('Complete Lending Officer Workflow', () => {
    test('should complete full credit assessment workflow', async () => {
      // Step 1: Authenticate and access dashboard
      const healthCheck = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthCheck.body.status).toBe('healthy');

      // Step 2: Search for user
      const userSearch = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(userSearch.body.data).toBeInstanceOf(Array);
      expect(userSearch.body.data.length).toBeGreaterThan(0);

      // Step 3: Get specific user profile
      const userProfile = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(userProfile.body.data).toHaveProperty('id', testUserId);
      expect(userProfile.body.data).toHaveProperty('firstName');
      expect(userProfile.body.data).toHaveProperty('lastName');

      // Step 4: Get credit score
      const creditScore = await request(app)
        .get(`/api/credit/${testUserId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(creditScore.body.data).toHaveProperty('score');
      expect(creditScore.body.data.score).toBeGreaterThanOrEqual(300);
      expect(creditScore.body.data.score).toBeLessThanOrEqual(850);

      // Step 5: Get credit limit
      const creditLimit = await request(app)
        .get(`/api/credit/${testUserId}/limit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(creditLimit.body.data).toHaveProperty('calculatedLimit');
      expect(creditLimit.body.data).toHaveProperty('riskLevel');
      expect(creditLimit.body.data.calculatedLimit).toBeGreaterThan(0);

      // Step 6: Get comprehensive assessment
      const assessment = await request(app)
        .get(`/api/credit/${testUserId}/assessment`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(assessment.body.data).toHaveProperty('user');
      expect(assessment.body.data).toHaveProperty('creditScore');
      expect(assessment.body.data).toHaveProperty('creditLimit');
      expect(assessment.body.data.user.id).toBe(testUserId);
    });

    test('should handle workflow with insufficient permissions', async () => {
      const limitedToken = generateTestToken({
        sub: 'limited-user-123',
        scope: 'lending:read'
      });

      // Should succeed with basic user access
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(200);

      // Should fail when accessing credit score without proper scope
      await request(app)
        .get(`/api/credit/${testUserId}/score`)
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);

      // Should fail when accessing credit limits without proper scope
      await request(app)
        .get(`/api/credit/${testUserId}/limit`)
        .set('Authorization', `Bearer ${limitedToken}`)
        .expect(403);
    });
  });

  describe('Admin Workflow', () => {
    test('should complete admin user management workflow', async () => {
      // Step 1: Access admin endpoints
      const adminUsers = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminUsers.body.data).toBeInstanceOf(Array);

      // Step 2: Get credit reports
      const creditReports = await request(app)
        .get('/api/admin/credit/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(creditReports.body.data).toHaveProperty('totalUsers');
      expect(creditReports.body.data).toHaveProperty('averageCreditScore');
      expect(creditReports.body.data).toHaveProperty('riskDistribution');

      // Step 3: Trigger credit recalculation
      const recalculation = await request(app)
        .post('/api/admin/credit/recalculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: testUserId })
        .expect(200);

      expect(recalculation.body.data).toHaveProperty('recalculatedUsers');
      expect(recalculation.body.data.recalculatedUsers).toBeGreaterThan(0);
    });

    test('should prevent non-admin access to admin endpoints', async () => {
      // Regular user should not access admin endpoints
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      await request(app)
        .post('/api/admin/credit/recalculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: testUserId })
        .expect(403);
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should handle invalid user ID gracefully', async () => {
      const invalidUserId = 'invalid-user-id';

      const userResponse = await request(app)
        .get(`/api/users/${invalidUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(userResponse.body.error).toBe('user_not_found');

      const creditResponse = await request(app)
        .get(`/api/credit/${invalidUserId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(creditResponse.body.error).toBe('user_not_found');
    });

    test('should handle authentication failures', async () => {
      // No token
      await request(app)
        .get('/api/users')
        .expect(401);

      // Invalid token
      await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Expired token (simulated)
      const expiredToken = generateTestToken({
        sub: 'test-user-123',
        scope: 'lending:read',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      });

      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Data Consistency Workflows', () => {
    test('should maintain data consistency across operations', async () => {
      // Get initial user data
      const initialUser = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get credit data
      const creditScore = await request(app)
        .get(`/api/credit/${testUserId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const creditLimit = await request(app)
        .get(`/api/credit/${testUserId}/limit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify data consistency
      expect(creditLimit.body.data.creditScore).toBe(creditScore.body.data.score);
      
      // Get comprehensive assessment and verify consistency
      const assessment = await request(app)
        .get(`/api/credit/${testUserId}/assessment`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(assessment.body.data.user.id).toBe(initialUser.body.data.id);
      expect(assessment.body.data.creditScore.score).toBe(creditScore.body.data.score);
      expect(assessment.body.data.creditLimit.calculatedLimit).toBe(creditLimit.body.data.calculatedLimit);
    });
  });
});