/**
 * Performance and Load Testing for Credit Operations
 * Tests system performance under various load conditions
 */

const request = require('supertest');
const { generateTestToken } = require('./setup');

// Import the app - we'll need to create a test server instance
let app;

beforeAll(async () => {
  // Import server after environment setup
  app = require('../../../server');
});

describe('Performance and Load Tests', () => {
  let authToken;
  let adminToken;
  let testUserIds = [];

  beforeAll(async () => {
    authToken = generateTestToken({
      sub: 'test-user-123',
      scope: 'lending:read lending:credit:read lending:credit:limits'
    });
    
    adminToken = generateTestToken({
      sub: 'admin-user-123',
      scope: 'lending:admin lending:read lending:credit:read lending:credit:limits'
    });

    // Get test user IDs
    const usersResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    testUserIds = usersResponse.body.data.slice(0, 10).map(user => user.id);
  });

  describe('Response Time Performance Tests', () => {
    test('should respond to user lookup within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should calculate credit scores within acceptable time', async () => {
      const userId = testUserIds[0];
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/credit/${userId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(1000); // Credit calculation within 1s
      expect(response.body.data.score).toBeGreaterThanOrEqual(300);
    });

    test('should calculate credit limits within acceptable time', async () => {
      const userId = testUserIds[0];
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/credit/${userId}/limit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(1500); // Limit calculation within 1.5s
      expect(response.body.data.calculatedLimit).toBeGreaterThan(0);
    });

    test('should provide comprehensive assessment within acceptable time', async () => {
      const userId = testUserIds[0];
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/credit/${userId}/assessment`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(2000); // Full assessment within 2s
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('creditScore');
      expect(response.body.data).toHaveProperty('creditLimit');
    });
  });

  describe('Concurrent Request Load Tests', () => {
    test('should handle concurrent user lookups', async () => {
      const concurrentRequests = 20;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(1000);
    });

    test('should handle concurrent credit score calculations', async () => {
      const concurrentRequests = 15;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const userId = testUserIds[i % testUserIds.length];
        promises.push(
          request(app)
            .get(`/api/credit/${userId}/score`)
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.score).toBeGreaterThanOrEqual(300);
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 15 concurrent requests
    });

    test('should handle concurrent comprehensive assessments', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const userId = testUserIds[i % testUserIds.length];
        promises.push(
          request(app)
            .get(`/api/credit/${userId}/assessment`)
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('creditScore');
        expect(response.body.data).toHaveProperty('creditLimit');
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(8000); // 8 seconds for 10 concurrent assessments
    });
  });

  describe('Memory and Resource Usage Tests', () => {
    test('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const userId = testUserIds[i % testUserIds.length];
        await request(app)
          .get(`/api/credit/${userId}/score`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle large user datasets efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/users?limit=1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(3000); // Should handle 1000 users within 3s
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Stress Testing', () => {
    test('should maintain performance under high load', async () => {
      const highLoadRequests = 50;
      const promises = [];
      const responseTimes = [];

      for (let i = 0; i < highLoadRequests; i++) {
        const userId = testUserIds[i % testUserIds.length];
        const startTime = Date.now();
        
        promises.push(
          request(app)
            .get(`/api/credit/${userId}/assessment`)
            .set('Authorization', `Bearer ${authToken}`)
            .then(response => {
              responseTimes.push(Date.now() - startTime);
              return response;
            })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      expect(avgResponseTime).toBeLessThan(3000); // Average under 3s
      expect(maxResponseTime).toBeLessThan(10000); // Max under 10s
      expect(p95ResponseTime).toBeLessThan(5000); // 95th percentile under 5s
    });

    test('should gracefully degrade under extreme load', async () => {
      const extremeLoadRequests = 100;
      const promises = [];

      for (let i = 0; i < extremeLoadRequests; i++) {
        const userId = testUserIds[i % testUserIds.length];
        promises.push(
          request(app)
            .get(`/api/credit/${userId}/score`)
            .set('Authorization', `Bearer ${authToken}`)
            .catch(error => ({ error: true, status: error.status }))
        );
      }

      const results = await Promise.all(promises);
      
      const successfulRequests = results.filter(r => !r.error && r.status === 200);
      const failedRequests = results.filter(r => r.error || r.status !== 200);

      // Should handle at least 70% of requests successfully
      const successRate = successfulRequests.length / extremeLoadRequests;
      expect(successRate).toBeGreaterThan(0.7);

      // Failed requests should be due to rate limiting (429) or server overload (503)
      failedRequests.forEach(result => {
        if (result.status) {
          expect([429, 503]).toContain(result.status);
        }
      });
    });
  });

  describe('Database Performance Tests', () => {
    test('should efficiently query user data', async () => {
      const startTime = Date.now();
      
      // Simulate complex user query
      const response = await request(app)
        .get('/api/users?search=john&limit=50&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(1000); // Query should complete within 1s
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should efficiently calculate credit metrics for multiple users', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/admin/credit/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const calculationTime = Date.now() - startTime;
      
      expect(calculationTime).toBeLessThan(2000); // Bulk calculations within 2s
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('averageCreditScore');
    });
  });

  describe('Caching Performance Tests', () => {
    test('should improve performance with caching', async () => {
      const userId = testUserIds[0];
      
      // First request (cache miss)
      const startTime1 = Date.now();
      await request(app)
        .get(`/api/credit/${userId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const firstRequestTime = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      await request(app)
        .get(`/api/credit/${userId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // Cached request should be significantly faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.5);
    });

    test('should handle cache invalidation properly', async () => {
      const userId = testUserIds[0];
      
      // Initial request
      await request(app)
        .get(`/api/credit/${userId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Trigger cache invalidation
      await request(app)
        .post('/api/admin/credit/recalculate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId })
        .expect(200);

      // Next request should recalculate
      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/credit/${userId}/score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeGreaterThan(100); // Should take time to recalculate
      expect(response.body.data.score).toBeGreaterThanOrEqual(300);
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should enforce rate limits properly', async () => {
      const rateLimitRequests = 60; // Assuming 50 requests per minute limit
      const promises = [];

      for (let i = 0; i < rateLimitRequests; i++) {
        promises.push(
          request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(promises);
      
      const successfulRequests = responses.filter(r => r.status === 200);
      const rateLimitedRequests = responses.filter(r => r.status === 429);

      // Should start rate limiting after threshold
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length).toBeLessThan(rateLimitRequests);
    });
  });
});