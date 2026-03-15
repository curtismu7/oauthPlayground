/**
 * Cross-Service Communication Tests
 * Tests communication between lending API and external services
 */

const request = require('supertest');
const { generateTestToken } = require('./setup');
const axios = require('axios');

// Import the app - we'll need to create a test server instance
let app;

beforeAll(async () => {
  // Import server after environment setup
  app = require('../../../server');
});

// Mock external services for testing
jest.mock('axios');
const mockedAxios = axios;

describe('Cross-Service Communication E2E Tests', () => {
  let authToken;
  let adminToken;

  beforeAll(async () => {
    authToken = generateTestToken({
      sub: 'test-user-123',
      scope: 'lending:read lending:credit:read lending:credit:limits'
    });
    
    adminToken = generateTestToken({
      sub: 'admin-user-123',
      scope: 'lending:admin lending:read lending:credit:read lending:credit:limits'
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Provider Communication', () => {
    test('should validate tokens with OAuth provider', async () => {
      // Mock OAuth introspection response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          active: true,
          sub: 'test-user-123',
          scope: 'lending:read lending:credit:read',
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should handle OAuth provider failures gracefully', async () => {
      // Mock OAuth provider failure
      mockedAxios.post.mockRejectedValueOnce(new Error('OAuth provider unavailable'));

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(503);

      expect(response.body.error).toBe('oauth_provider_unavailable');
    });

    test('should handle invalid token responses from OAuth provider', async () => {
      // Mock invalid token response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          active: false,
          error: 'invalid_token'
        }
      });

      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('Banking API Integration', () => {
    test('should communicate with banking API for user data', async () => {
      // Mock banking API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            accounts: [
              { id: 'acc-1', balance: 5000, type: 'checking' },
              { id: 'acc-2', balance: 15000, type: 'savings' }
            ]
          }
        }
      });

      const response = await request(app)
        .get('/api/users/user-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id', 'user-123');
      expect(response.body.data).toHaveProperty('firstName', 'John');
    });

    test('should handle banking API unavailability', async () => {
      // Mock banking API failure
      mockedAxios.get.mockRejectedValueOnce(new Error('Banking API unavailable'));

      const response = await request(app)
        .get('/api/users/user-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(503);

      expect(response.body.error).toBe('external_service_unavailable');
      expect(response.body.error_description).toContain('Banking API');
    });
  });

  describe('Credit Bureau Integration', () => {
    test('should fetch credit scores from external credit bureau', async () => {
      // Mock credit bureau response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          creditScore: 750,
          scoreDate: new Date().toISOString(),
          factors: {
            paymentHistory: 35,
            creditUtilization: 30,
            creditLength: 15,
            creditMix: 10,
            newCredit: 10
          }
        }
      });

      const response = await request(app)
        .get('/api/credit/user-123/score')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.score).toBe(750);
      expect(response.body.data.source).toBe('external');
    });

    test('should fallback to calculated scores when credit bureau fails', async () => {
      // Mock credit bureau failure
      mockedAxios.get.mockRejectedValueOnce(new Error('Credit bureau timeout'));

      const response = await request(app)
        .get('/api/credit/user-123/score')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.score).toBeGreaterThanOrEqual(300);
      expect(response.body.data.source).toBe('calculated');
      expect(response.body.warnings).toContain('External credit bureau unavailable');
    });
  });

  describe('Notification Service Integration', () => {
    test('should send notifications for high-risk assessments', async () => {
      // Mock notification service
      mockedAxios.post.mockResolvedValueOnce({
        data: { messageId: 'msg-123', status: 'sent' }
      });

      const response = await request(app)
        .get('/api/credit/high-risk-user/assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.riskLevel).toBe('high');
      
      // Verify notification was sent
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/notifications'),
        expect.objectContaining({
          type: 'high_risk_assessment',
          userId: 'high-risk-user'
        })
      );
    });

    test('should continue processing when notification service fails', async () => {
      // Mock notification service failure
      mockedAxios.post.mockRejectedValueOnce(new Error('Notification service down'));

      const response = await request(app)
        .get('/api/credit/high-risk-user/assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.riskLevel).toBe('high');
      expect(response.body.warnings).toContain('Notification delivery failed');
    });
  });

  describe('Audit Service Integration', () => {
    test('should log credit assessments to audit service', async () => {
      // Mock audit service
      mockedAxios.post.mockResolvedValueOnce({
        data: { auditId: 'audit-123', status: 'logged' }
      });

      await request(app)
        .get('/api/credit/user-123/assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify audit log was created
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/audit'),
        expect.objectContaining({
          action: 'credit_assessment',
          userId: 'user-123',
          performedBy: 'test-user-123'
        })
      );
    });

    test('should handle audit service failures without affecting main operation', async () => {
      // Mock audit service failure
      mockedAxios.post.mockRejectedValueOnce(new Error('Audit service unavailable'));

      const response = await request(app)
        .get('/api/credit/user-123/assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('creditScore');
      expect(response.body.warnings).toContain('Audit logging failed');
    });
  });

  describe('Service Circuit Breaker Tests', () => {
    test('should implement circuit breaker for external services', async () => {
      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        mockedAxios.get.mockRejectedValueOnce(new Error('Service timeout'));
        
        await request(app)
          .get('/api/credit/user-123/score')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200); // Should still return calculated score
      }

      // Next request should use circuit breaker (no external call)
      mockedAxios.get.mockClear();
      
      const response = await request(app)
        .get('/api/credit/user-123/score')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.source).toBe('calculated');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('Service Health Monitoring', () => {
    test('should report external service health status', async () => {
      // Mock various service health checks
      mockedAxios.get
        .mockResolvedValueOnce({ data: { status: 'healthy' } }) // OAuth
        .mockResolvedValueOnce({ data: { status: 'healthy' } }) // Banking API
        .mockRejectedValueOnce(new Error('Timeout')); // Credit Bureau

      const response = await request(app)
        .get('/api/health/detailed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.services).toHaveProperty('oauth', 'healthy');
      expect(response.body.services).toHaveProperty('bankingApi', 'healthy');
      expect(response.body.services).toHaveProperty('creditBureau', 'unhealthy');
    });
  });

  describe('Data Synchronization Tests', () => {
    test('should synchronize user data across services', async () => {
      // Mock user update in banking API
      mockedAxios.put.mockResolvedValueOnce({
        data: { 
          id: 'user-123',
          firstName: 'Jane',
          lastName: 'Smith',
          updatedAt: new Date().toISOString()
        }
      });

      const response = await request(app)
        .put('/api/users/user-123/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ source: 'banking_api' })
        .expect(200);

      expect(response.body.data.synchronized).toBe(true);
      expect(response.body.data.updatedFields).toContain('firstName');
      expect(response.body.data.updatedFields).toContain('lastName');
    });

    test('should handle data conflicts during synchronization', async () => {
      // Mock conflicting data from different services
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { firstName: 'John', lastName: 'Doe', updatedAt: '2023-01-01T00:00:00Z' }
        })
        .mockResolvedValueOnce({
          data: { firstName: 'Jane', lastName: 'Smith', updatedAt: '2023-01-02T00:00:00Z' }
        });

      const response = await request(app)
        .post('/api/users/user-123/resolve-conflicts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ strategy: 'latest_timestamp' })
        .expect(200);

      expect(response.body.data.resolved).toBe(true);
      expect(response.body.data.finalData.firstName).toBe('Jane');
      expect(response.body.data.conflicts).toHaveLength(2);
    });
  });
});