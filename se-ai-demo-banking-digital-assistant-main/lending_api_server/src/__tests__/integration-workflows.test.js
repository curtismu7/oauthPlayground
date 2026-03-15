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
    logActivityEvent: jest.fn(),
    logPerformanceMetric: jest.fn()
  }
}));

const app = require('../../server');
const lendingDataStore = require('../../data/store');

describe('Integration Workflows Tests', () => {
  let tokens = {};
  let testUsers = [];

  beforeAll(async () => {
    const secret = process.env.SESSION_SECRET || 'test-secret';
    const basePayload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    // Create tokens for different user types
    tokens.lendingOfficer = jwt.sign({
      ...basePayload,
      sub: 'officer-123',
      username: 'lending_officer',
      role: 'lending_officer',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits', 'lending:officer']
    }, secret);

    tokens.admin = jwt.sign({
      ...basePayload,
      sub: 'admin-123',
      username: 'admin_user',
      role: 'admin',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits', 'lending:admin']
    }, secret);

    tokens.creditAnalyst = jwt.sign({
      ...basePayload,
      sub: 'analyst-123',
      username: 'credit_analyst',
      role: 'credit_analyst',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits']
    }, secret);

    // Wait for data store to initialize
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  beforeEach(async () => {
    // Clean up test users from previous tests
    for (const user of testUsers) {
      try {
        await lendingDataStore.deleteUser(user.id);
      } catch (error) {
        // User might not exist, ignore error
      }
    }
    testUsers = [];
  });

  afterEach(async () => {
    // Clean up test users after each test
    for (const user of testUsers) {
      try {
        await lendingDataStore.deleteUser(user.id);
      } catch (error) {
        // User might not exist, ignore error
      }
    }
    testUsers = [];
  });

  describe('Complete Loan Application Assessment Workflow', () => {
    it('should complete full credit assessment for new applicant', async () => {
      // Step 1: Create new loan applicant
      const newApplicant = {
        firstName: 'John',
        lastName: 'Applicant',
        email: 'john.applicant@example.com',
        phone: '+1-555-0123',
        dateOfBirth: new Date('1985-06-15'),
        ssn: '123-45-6789',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        },
        employment: {
          employer: 'Tech Corp',
          position: 'Software Engineer',
          annualIncome: 85000,
          employmentLength: 48 // 4 years
        }
      };

      const createdUser = await lendingDataStore.createUser(newApplicant);
      testUsers.push(createdUser);

      // Step 2: Lending officer searches for the applicant
      const searchResponse = await request(app)
        .get(`/api/users/search/${encodeURIComponent(newApplicant.firstName)}`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(searchResponse.body.users).toContainEqual(
        expect.objectContaining({
          id: createdUser.id,
          firstName: newApplicant.firstName,
          lastName: newApplicant.lastName
        })
      );

      // Step 3: Get detailed user profile
      const profileResponse = await request(app)
        .get(`/api/users/${createdUser.id}`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(profileResponse.body.user).toHaveProperty('employment');
      expect(profileResponse.body.user.employment).toHaveProperty('annualIncome', 85000);

      // Step 4: Calculate credit score
      const scoreResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/score`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(scoreResponse.body.data).toHaveProperty('score');
      expect(scoreResponse.body.data).toHaveProperty('factors');
      expect(scoreResponse.body.data.score).toBeGreaterThanOrEqual(600);

      // Step 5: Calculate credit limit
      const limitResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/limit`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(limitResponse.body.data).toHaveProperty('calculatedLimit');
      expect(limitResponse.body.data).toHaveProperty('riskLevel');
      expect(limitResponse.body.data.calculatedLimit).toBeGreaterThan(0);

      // Step 6: Get comprehensive assessment
      const assessmentResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/assessment`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(assessmentResponse.body.data).toHaveProperty('creditScore');
      expect(assessmentResponse.body.data).toHaveProperty('creditLimit');
      expect(assessmentResponse.body.data).toHaveProperty('recommendation');
      expect(assessmentResponse.body.data.creditScore.score).toBe(scoreResponse.body.data.score);
      expect(assessmentResponse.body.data.creditLimit.calculatedLimit).toBe(limitResponse.body.data.calculatedLimit);

      // Step 7: Verify audit trail
      const summaryResponse = await request(app)
        .get(`/api/users/${createdUser.id}/summary`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(summaryResponse.body.summary.creditInfo).toHaveProperty('hasScore', true);
      expect(summaryResponse.body.summary.creditInfo).toHaveProperty('hasLimit', true);
    });

    it('should handle high-risk applicant workflow', async () => {
      // Create high-risk applicant
      const highRiskApplicant = {
        firstName: 'Risk',
        lastName: 'Applicant',
        email: 'risk.applicant@example.com',
        phone: '+1-555-0124',
        dateOfBirth: new Date('2000-01-01'), // Young
        employment: {
          employer: 'Startup Inc',
          position: 'Intern',
          annualIncome: 25000, // Low income
          employmentLength: 3 // Short employment
        }
      };

      const createdUser = await lendingDataStore.createUser(highRiskApplicant);
      testUsers.push(createdUser);

      // Get credit assessment
      const assessmentResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/assessment`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(assessmentResponse.body.data.creditLimit.riskLevel).toBe('high');
      expect(assessmentResponse.body.data.recommendation.approved).toBe(false);
      expect(assessmentResponse.body.data.recommendation.reasons).toContain('High risk profile');
    });

    it('should handle excellent credit applicant workflow', async () => {
      // Create excellent credit applicant
      const excellentApplicant = {
        firstName: 'Excellent',
        lastName: 'Applicant',
        email: 'excellent.applicant@example.com',
        phone: '+1-555-0125',
        dateOfBirth: new Date('1975-01-01'), // Mature
        employment: {
          employer: 'Fortune 500 Corp',
          position: 'Senior Director',
          annualIncome: 150000, // High income
          employmentLength: 120 // Long employment (10 years)
        }
      };

      const createdUser = await lendingDataStore.createUser(excellentApplicant);
      testUsers.push(createdUser);

      // Get credit assessment
      const assessmentResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/assessment`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(assessmentResponse.body.data.creditLimit.riskLevel).toBe('low');
      expect(assessmentResponse.body.data.creditScore.score).toBeGreaterThan(750);
      expect(assessmentResponse.body.data.creditLimit.calculatedLimit).toBeGreaterThan(50000);
      expect(assessmentResponse.body.data.recommendation.approved).toBe(true);
    });
  });

  describe('Credit Monitoring and Recalculation Workflow', () => {
    it('should handle credit score recalculation workflow', async () => {
      // Create test user
      const testUser = {
        firstName: 'Monitor',
        lastName: 'User',
        email: 'monitor.user@example.com',
        phone: '+1-555-0126',
        dateOfBirth: new Date('1980-01-01'),
        employment: {
          employer: 'Stable Corp',
          position: 'Manager',
          annualIncome: 75000,
          employmentLength: 60
        }
      };

      const createdUser = await lendingDataStore.createUser(testUser);
      testUsers.push(createdUser);

      // Step 1: Get initial credit score
      const initialScoreResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/score`)
        .set('Authorization', `Bearer ${tokens.creditAnalyst}`)
        .expect(200);

      const initialScore = initialScoreResponse.body.data.score;

      // Step 2: Check credit history (should be empty initially)
      const historyResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/history`)
        .set('Authorization', `Bearer ${tokens.creditAnalyst}`)
        .expect(200);

      expect(historyResponse.body.data).toHaveLength(1); // Only initial calculation

      // Step 3: Trigger recalculation
      const recalcResponse = await request(app)
        .post(`/api/credit/${createdUser.id}/recalculate`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(recalcResponse.body.data).toHaveProperty('recalculatedAt');
      expect(recalcResponse.body.data).toHaveProperty('recalculatedBy', 'lending_officer');

      // Step 4: Verify new score is calculated
      const newScoreResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/score?refresh=true`)
        .set('Authorization', `Bearer ${tokens.creditAnalyst}`)
        .expect(200);

      expect(newScoreResponse.body.data.score).toBeDefined();

      // Step 5: Check updated history
      const updatedHistoryResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/history`)
        .set('Authorization', `Bearer ${tokens.creditAnalyst}`)
        .expect(200);

      expect(updatedHistoryResponse.body.data.length).toBeGreaterThan(1);
    });

    it('should handle bulk recalculation workflow', async () => {
      // Create multiple test users
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = {
          firstName: `Bulk${i}`,
          lastName: 'User',
          email: `bulk${i}.user@example.com`,
          phone: `+1-555-012${i}`,
          dateOfBirth: new Date('1985-01-01'),
          employment: {
            employer: 'Bulk Corp',
            position: 'Employee',
            annualIncome: 60000 + (i * 10000),
            employmentLength: 36
          }
        };

        const createdUser = await lendingDataStore.createUser(user);
        users.push(createdUser);
        testUsers.push(createdUser);
      }

      // Trigger bulk recalculation
      const bulkRecalcResponse = await request(app)
        .post('/api/admin/credit/recalculate')
        .send({ userIds: users.map(u => u.id) })
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(bulkRecalcResponse.body.data).toHaveProperty('processedCount', 3);
      expect(bulkRecalcResponse.body.data).toHaveProperty('successCount');
      expect(bulkRecalcResponse.body.data).toHaveProperty('failureCount');

      // Verify all users have updated scores
      for (const user of users) {
        const scoreResponse = await request(app)
          .get(`/api/credit/${user.id}/score`)
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);

        expect(scoreResponse.body.data).toHaveProperty('score');
      }
    });
  });

  describe('Administrative Reporting Workflow', () => {
    it('should generate comprehensive credit reports', async () => {
      // Create test users with different profiles
      const profiles = [
        { income: 50000, employment: 24, risk: 'high' },
        { income: 75000, employment: 48, risk: 'medium' },
        { income: 100000, employment: 72, risk: 'low' }
      ];

      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        const user = {
          firstName: `Report${i}`,
          lastName: 'User',
          email: `report${i}.user@example.com`,
          phone: `+1-555-013${i}`,
          dateOfBirth: new Date('1980-01-01'),
          employment: {
            employer: 'Report Corp',
            position: 'Employee',
            annualIncome: profile.income,
            employmentLength: profile.employment
          }
        };

        const createdUser = await lendingDataStore.createUser(user);
        testUsers.push(createdUser);

        // Generate credit data for each user
        await request(app)
          .get(`/api/credit/${createdUser.id}/assessment`)
          .set('Authorization', `Bearer ${tokens.admin}`)
          .expect(200);
      }

      // Generate credit reports
      const reportsResponse = await request(app)
        .get('/api/admin/credit/reports')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(reportsResponse.body.data).toHaveProperty('summary');
      expect(reportsResponse.body.data).toHaveProperty('riskDistribution');
      expect(reportsResponse.body.data).toHaveProperty('scoreDistribution');
      expect(reportsResponse.body.data).toHaveProperty('limitDistribution');

      // Verify risk distribution includes all risk levels
      const riskDist = reportsResponse.body.data.riskDistribution;
      expect(riskDist).toHaveProperty('low');
      expect(riskDist).toHaveProperty('medium');
      expect(riskDist).toHaveProperty('high');
    });

    it('should handle user management workflow', async () => {
      // Step 1: Admin lists all users
      const usersListResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const initialUserCount = usersListResponse.body.count;

      // Step 2: Create new user through admin interface
      const newUser = {
        firstName: 'Admin',
        lastName: 'Created',
        email: 'admin.created@example.com',
        phone: '+1-555-0140',
        dateOfBirth: new Date('1990-01-01'),
        employment: {
          employer: 'Admin Corp',
          position: 'Employee',
          annualIncome: 65000,
          employmentLength: 36
        }
      };

      const createdUser = await lendingDataStore.createUser(newUser);
      testUsers.push(createdUser);

      // Step 3: Verify user appears in admin list
      const updatedUsersListResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(updatedUsersListResponse.body.count).toBe(initialUserCount + 1);
      expect(updatedUsersListResponse.body.users).toContainEqual(
        expect.objectContaining({
          id: createdUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        })
      );

      // Step 4: Generate credit assessment for new user
      const assessmentResponse = await request(app)
        .get(`/api/credit/${createdUser.id}/assessment`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(assessmentResponse.body.data).toHaveProperty('creditScore');
      expect(assessmentResponse.body.data).toHaveProperty('creditLimit');
    });
  });

  describe('Cache Management Workflow', () => {
    it('should handle cache lifecycle management', async () => {
      // Create test user
      const testUser = {
        firstName: 'Cache',
        lastName: 'User',
        email: 'cache.user@example.com',
        phone: '+1-555-0150',
        dateOfBirth: new Date('1985-01-01'),
        employment: {
          employer: 'Cache Corp',
          position: 'Developer',
          annualIncome: 80000,
          employmentLength: 48
        }
      };

      const createdUser = await lendingDataStore.createUser(testUser);
      testUsers.push(createdUser);

      // Step 1: Check initial cache stats
      const initialStatsResponse = await request(app)
        .get('/api/credit/cache/stats')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      const initialEntries = initialStatsResponse.body.data.totalEntries;

      // Step 2: Generate credit data (populates cache)
      await request(app)
        .get(`/api/credit/${createdUser.id}/score`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      await request(app)
        .get(`/api/credit/${createdUser.id}/limit`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      // Step 3: Check updated cache stats
      const updatedStatsResponse = await request(app)
        .get('/api/credit/cache/stats')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(updatedStatsResponse.body.data.totalEntries).toBeGreaterThan(initialEntries);

      // Step 4: Clear specific user cache
      const clearUserResponse = await request(app)
        .delete(`/api/credit/cache/${createdUser.id}`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(clearUserResponse.body.message).toContain(`user ${createdUser.id}`);

      // Step 5: Clear all cache
      const clearAllResponse = await request(app)
        .delete('/api/credit/cache')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(clearAllResponse.body.message).toContain('all users');

      // Step 6: Verify cache is cleared
      const finalStatsResponse = await request(app)
        .get('/api/credit/cache/stats')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(finalStatsResponse.body.data.totalEntries).toBe(0);
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle partial system failures gracefully', async () => {
      // Create test user
      const testUser = {
        firstName: 'Recovery',
        lastName: 'User',
        email: 'recovery.user@example.com',
        phone: '+1-555-0160',
        dateOfBirth: new Date('1985-01-01'),
        employment: {
          employer: 'Recovery Corp',
          position: 'Tester',
          annualIncome: 70000,
          employmentLength: 36
        }
      };

      const createdUser = await lendingDataStore.createUser(testUser);
      testUsers.push(createdUser);

      // Simulate partial failure scenario
      // Even if credit calculation fails, user data should still be accessible
      const userResponse = await request(app)
        .get(`/api/users/${createdUser.id}`)
        .set('Authorization', `Bearer ${tokens.lendingOfficer}`)
        .expect(200);

      expect(userResponse.body.user).toHaveProperty('id', createdUser.id);

      // Health check should still work
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body).toHaveProperty('status');
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Create test user
      const testUser = {
        firstName: 'Concurrent',
        lastName: 'User',
        email: 'concurrent.user@example.com',
        phone: '+1-555-0170',
        dateOfBirth: new Date('1985-01-01'),
        employment: {
          employer: 'Concurrent Corp',
          position: 'Tester',
          annualIncome: 75000,
          employmentLength: 48
        }
      };

      const createdUser = await lendingDataStore.createUser(testUser);
      testUsers.push(createdUser);

      // Perform concurrent operations
      const operations = [
        request(app).get(`/api/credit/${createdUser.id}/score`).set('Authorization', `Bearer ${tokens.creditAnalyst}`),
        request(app).get(`/api/credit/${createdUser.id}/limit`).set('Authorization', `Bearer ${tokens.creditAnalyst}`),
        request(app).get(`/api/users/${createdUser.id}`).set('Authorization', `Bearer ${tokens.lendingOfficer}`),
        request(app).post(`/api/credit/${createdUser.id}/recalculate`).set('Authorization', `Bearer ${tokens.lendingOfficer}`)
      ];

      const responses = await Promise.all(operations);

      // All operations should complete successfully or with expected errors
      responses.forEach((response, index) => {
        expect([200, 400, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body).toBeDefined();
        }
      });

      // Final state should be consistent
      const finalAssessment = await request(app)
        .get(`/api/credit/${createdUser.id}/assessment`)
        .set('Authorization', `Bearer ${tokens.creditAnalyst}`)
        .expect(200);

      expect(finalAssessment.body.data).toHaveProperty('creditScore');
      expect(finalAssessment.body.data).toHaveProperty('creditLimit');
    });
  });
});