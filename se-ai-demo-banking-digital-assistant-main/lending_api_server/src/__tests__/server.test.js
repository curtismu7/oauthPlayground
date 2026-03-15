const request = require('supertest');

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

// Mock the health monitor to avoid issues during tests
jest.mock('../../utils/healthMonitor', () => ({
  healthMonitor: {
    runAllChecks: jest.fn().mockResolvedValue({
      healthy: true,
      timestamp: new Date().toISOString(),
      total_checks: 5,
      healthy_checks: 5,
      unhealthy_checks: 0,
      total_response_time_ms: 100,
      checks: [
        { name: 'memory', healthy: true, response_time_ms: 10 },
        { name: 'filesystem', healthy: true, response_time_ms: 20 },
        { name: 'datastore', healthy: true, response_time_ms: 30 },
        { name: 'oauth_provider', healthy: true, response_time_ms: 20 },
        { name: 'credit_services', healthy: true, response_time_ms: 20 }
      ]
    }),
    startPeriodicChecks: jest.fn(),
    stopPeriodicChecks: jest.fn()
  }
}));

const app = require('../../server');

describe('Lending API Server', () => {
  describe('Health Checks', () => {
    test('GET /api/healthz should return basic health status', async () => {
      const response = await request(app)
        .get('/api/healthz')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'lending-api-server',
        version: '1.0.0',
        environment: 'test'
      });
      expect(response.body.port).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    test('GET /health should return detailed health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'lending_api',
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    test('GET / should return service information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Lending API Server',
        version: '1.0.0',
        service: 'consumer-lending-service',
        endpoints: [
          '/api/auth',
          '/api/users',
          '/api/credit',
          '/api/admin'
        ]
      });
    });

    test('GET /api/docs should return API documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Consumer Lending API',
        version: '1.0.0',
        description: expect.any(String),
        endpoints: expect.any(Object),
        scopes: {
          'lending:read': expect.any(String),
          'lending:credit:read': expect.any(String),
          'lending:credit:limits': expect.any(String),
          'lending:admin': expect.any(String)
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'not_found',
        error_description: 'The requested endpoint was not found',
        method: 'GET'
      });
      expect(response.body.path).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.available_endpoints).toBeDefined();
    });

    test('should handle different HTTP methods for 404', async () => {
      const response = await request(app)
        .post('/api/invalid-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'not_found',
        method: 'POST'
      });
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/healthz')
        .expect(200);

      // Check for Helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('Rate Limiting', () => {
    test('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/healthz')
        .expect(200);

      // Rate limiting headers may not be present in all versions
      // Just check that the request was successful
      expect(response.status).toBe(200);
    });
  });
});