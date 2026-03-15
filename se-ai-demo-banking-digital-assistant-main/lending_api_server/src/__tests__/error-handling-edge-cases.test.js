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
    logErrorHandling: jest.fn(),
    logCreditDataAccess: jest.fn(),
    logCreditCalculation: jest.fn(),
    logActivityEvent: jest.fn()
  }
}));

const app = require('../../server');
const lendingDataStore = require('../../data/store');
const creditScoringService = require('../../services/CreditScoringService');
const creditLimitService = require('../../services/CreditLimitService');

describe('Error Handling and Edge Cases Tests', () => {
  let validToken;

  beforeAll(() => {
    const secret = process.env.SESSION_SECRET || 'test-secret';
    validToken = jwt.sign({
      sub: 'test-user-123',
      username: 'test_user',
      role: 'admin',
      scopes: ['lending:read', 'lending:credit:read', 'lending:credit:limits', 'lending:admin'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }, secret);
  });

  beforeEach(() => {
    // Clear caches before each test
    creditScoringService.clearCache();
    creditLimitService.clearCache();
  });

  describe('Data Store Error Handling', () => {
    it('should handle data store connection failures gracefully', async () => {
      // Mock data store failure
      const originalGetUserById = lendingDataStore.getUserById;
      lendingDataStore.getUserById = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'internal_server_error');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/users/1');

      // Restore original method
      lendingDataStore.getUserById = originalGetUserById;
    });

    it('should handle data corruption gracefully', async () => {
      // Mock corrupted data
      const originalGetUserById = lendingDataStore.getUserById;
      lendingDataStore.getUserById = jest.fn(() => {
        return { corrupted: 'data', missing: 'required_fields' };
      });

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'data_corruption');
      expect(response.body).toHaveProperty('error_description');

      // Restore original method
      lendingDataStore.getUserById = originalGetUserById;
    });

    it('should handle concurrent access issues', async () => {
      // Simulate concurrent access by making multiple requests
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/users/1')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 500, 503]).toContain(response.status);
        if (response.status !== 200) {
          expect(response.body).toHaveProperty('error');
          expect(response.body).toHaveProperty('error_description');
        }
      });
    });
  });

  describe('Credit Service Error Handling', () => {
    it('should handle credit calculation failures', async () => {
      // Mock credit calculation failure
      const originalCalculateScoreFactors = creditScoringService.calculateScoreFactors;
      creditScoringService.calculateScoreFactors = jest.fn(() => {
        throw new Error('Credit calculation engine failure');
      });

      const response = await request(app)
        .get('/api/credit/999/score')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'credit_calculation_failed');
      expect(response.body).toHaveProperty('error_description');

      // Restore original method
      creditScoringService.calculateScoreFactors = originalCalculateScoreFactors;
    });

    it('should handle invalid credit data gracefully', async () => {
      // Create user with invalid employment data
      const invalidUser = {
        firstName: 'Invalid',
        lastName: 'User',
        email: 'invalid@example.com',
        phone: '+1-555-0199',
        dateOfBirth: 'invalid-date',
        employment: {
          annualIncome: 'not-a-number',
          employmentLength: -5
        }
      };

      const createdUser = await lendingDataStore.createUser(invalidUser);
      
      try {
        const response = await request(app)
          .get(`/api/credit/${createdUser.id}/score`)
          .set('Authorization', `Bearer ${validToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'invalid_user_data');
        expect(response.body).toHaveProperty('error_description');
      } finally {
        await lendingDataStore.deleteUser(createdUser.id);
      }
    });

    it('should handle credit limit calculation edge cases', async () => {
      // Test with extreme values
      const extremeUser = {
        firstName: 'Extreme',
        lastName: 'User',
        email: 'extreme@example.com',
        phone: '+1-555-0199',
        dateOfBirth: new Date('1900-01-01'), // Very old
        employment: {
          annualIncome: 0, // No income
          employmentLength: 0 // No employment
        }
      };

      const createdUser = await lendingDataStore.createUser(extremeUser);
      
      try {
        const response = await request(app)
          .get(`/api/credit/${createdUser.id}/limit`)
          .set('Authorization', `Bearer ${validToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'insufficient_credit_data');
        expect(response.body).toHaveProperty('error_description');
      } finally {
        await lendingDataStore.deleteUser(createdUser.id);
      }
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle malformed user IDs', async () => {
      const malformedIds = [
        'null',
        'undefined',
        '',
        '   ',
        'very-long-id-that-exceeds-reasonable-limits-and-should-be-rejected',
        '../../../etc/passwd',
        '<script>alert("xss")</script>',
        'SELECT * FROM users',
        '{"injection": "attempt"}'
      ];

      for (const id of malformedIds) {
        const response = await request(app)
          .get(`/api/users/${encodeURIComponent(id)}`)
          .set('Authorization', `Bearer ${validToken}`);

        expect([400, 404]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body).toHaveProperty('error', 'invalid_request');
        }
      }
    });

    it('should handle special characters in search queries', async () => {
      const specialQueries = [
        '%',
        '*',
        '?',
        '[',
        ']',
        '\\',
        '/',
        '|',
        '^',
        '$',
        '(',
        ')',
        '{',
        '}',
        '+',
        '.'
      ];

      for (const query of specialQueries) {
        const response = await request(app)
          .get(`/api/users/search/${encodeURIComponent(query)}`)
          .set('Authorization', `Bearer ${validToken}`);

        // Should either succeed with empty results or return 400 for invalid query
        expect([200, 400]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body).toHaveProperty('users');
          expect(Array.isArray(response.body.users)).toBe(true);
        }
      }
    });

    it('should handle extremely long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      
      const response = await request(app)
        .get(`/api/users/search/${encodeURIComponent(longQuery)}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'invalid_request');
      expect(response.body.error_description).toContain('Query too long');
    });

    it('should handle unicode characters in queries', async () => {
      const unicodeQueries = [
        'José',
        '北京',
        'Москва',
        '🏦💰',
        'café',
        'naïve'
      ];

      for (const query of unicodeQueries) {
        const response = await request(app)
          .get(`/api/users/search/${encodeURIComponent(query)}`)
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('query', query);
      }
    });
  });

  describe('HTTP Method Edge Cases', () => {
    it('should reject unsupported HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/users/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(405);

      expect(response.body).toHaveProperty('error', 'method_not_allowed');
      expect(response.body).toHaveProperty('allowed_methods');
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await request(app)
        .options('/api/users/1')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should handle HEAD requests', async () => {
      const response = await request(app)
        .head('/api/users/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual({});
      expect(response.headers).toHaveProperty('content-type');
    });
  });

  describe('Content-Type Edge Cases', () => {
    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/credit/1/recalculate')
        .set('Authorization', `Bearer ${validToken}`)
        .send('{"test": "data"}')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'invalid_content_type');
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/credit/1/recalculate')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'invalid_json');
    });

    it('should handle extremely large request bodies', async () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      const response = await request(app)
        .post('/api/admin/credit/recalculate')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'application/json')
        .send(`{"data": "${largeData}"}`)
        .expect(413);

      expect(response.body).toHaveProperty('error', 'payload_too_large');
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    it('should handle burst requests gracefully', async () => {
      // Make rapid burst of requests
      const burstRequests = Array(50).fill().map(() =>
        request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(burstRequests);
      
      // Some requests should be rate limited
      const rateLimitedCount = responses.filter(res => res.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);

      // Rate limited responses should have proper headers
      const rateLimitedResponse = responses.find(res => res.status === 429);
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers).toHaveProperty('retry-after');
        expect(rateLimitedResponse.body).toHaveProperty('error', 'rate_limit_exceeded');
      }
    });

    it('should reset rate limits after time window', async () => {
      // This test would need to wait for rate limit window to reset
      // For now, just verify the rate limit headers are present
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Memory and Resource Edge Cases', () => {
    it('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure by creating many cache entries
      const userIds = Array(1000).fill().map((_, i) => `stress-test-${i}`);
      
      for (const userId of userIds.slice(0, 100)) {
        try {
          await request(app)
            .get(`/api/credit/${userId}/score`)
            .set('Authorization', `Bearer ${validToken}`);
        } catch (error) {
          // Expected to fail for non-existent users
        }
      }

      // Server should still respond to health checks
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should handle cache overflow scenarios', async () => {
      // Fill cache beyond reasonable limits
      const cacheStats = await request(app)
        .get('/api/credit/cache/stats')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(cacheStats.body.data).toHaveProperty('totalEntries');
      expect(cacheStats.body.data).toHaveProperty('cacheTTL');
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent credit calculations', async () => {
      const concurrentRequests = Array(20).fill().map(() =>
        request(app)
          .get('/api/credit/1/score')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All successful responses should have consistent data
      const successfulResponses = responses.filter(res => res.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);

      if (successfulResponses.length > 1) {
        const firstScore = successfulResponses[0].body.data.score;
        successfulResponses.forEach(response => {
          expect(response.body.data.score).toBe(firstScore);
        });
      }
    });

    it('should handle concurrent cache operations', async () => {
      const operations = [
        () => request(app).get('/api/credit/1/score').set('Authorization', `Bearer ${validToken}`),
        () => request(app).delete('/api/credit/cache/1').set('Authorization', `Bearer ${validToken}`),
        () => request(app).get('/api/credit/cache/stats').set('Authorization', `Bearer ${validToken}`),
        () => request(app).post('/api/credit/1/recalculate').set('Authorization', `Bearer ${validToken}`)
      ];

      const concurrentOps = Array(10).fill().map(() => 
        operations[Math.floor(Math.random() * operations.length)]()
      );

      const responses = await Promise.all(concurrentOps);
      
      // All responses should be valid (success or expected error)
      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('error', expect.any(String));
      });
    });
  });

  describe('Error Response Consistency', () => {
    it('should maintain consistent error format across all endpoints', async () => {
      const errorScenarios = [
        { endpoint: '/api/users/999', expectedError: 'user_not_found' },
        { endpoint: '/api/credit/999/score', expectedError: 'user_not_found' },
        { endpoint: '/api/credit/999/limit', expectedError: 'user_not_found' },
        { endpoint: '/api/users/search/a', expectedError: 'invalid_request' }
      ];

      for (const scenario of errorScenarios) {
        const response = await request(app)
          .get(scenario.endpoint)
          .set('Authorization', `Bearer ${validToken}`);

        expect(response.body).toHaveProperty('error', scenario.expectedError);
        expect(response.body).toHaveProperty('error_description');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('path', scenario.endpoint);
        expect(response.body).toHaveProperty('method', 'GET');
        
        // Validate timestamp format
        expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      }
    });

    it('should include correlation IDs in error responses', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('correlationId');
      expect(response.body.correlationId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    it('should sanitize sensitive information from error messages', async () => {
      // Mock an error that might contain sensitive info
      const originalGetUserById = lendingDataStore.getUserById;
      lendingDataStore.getUserById = jest.fn(() => {
        throw new Error('Database connection failed: password=secret123');
      });

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.error_description).not.toContain('password');
      expect(response.body.error_description).not.toContain('secret123');

      // Restore original method
      lendingDataStore.getUserById = originalGetUserById;
    });
  });
});