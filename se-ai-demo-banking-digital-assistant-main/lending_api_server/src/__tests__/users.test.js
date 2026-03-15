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
  },
  LOG_CATEGORIES: {
    USER_MANAGEMENT: 'user_management',
    AUDIT: 'audit'
  }
}));

// Mock authentication middleware before importing the app
jest.mock('../../middleware/auth', () => {
  let mockUser = {
    id: '1',
    username: 'test_user',
    email: 'test@example.com',
    role: 'user',
    scopes: ['lending:read', 'lending:credit:read']
  };

  return {
    authenticateToken: (req, res, next) => {
      req.user = mockUser;
      next();
    },
    requireScopes: (scopes) => (req, res, next) => next(),
    requireAdmin: (req, res, next) => {
      if (req.user.role === 'admin' || (req.user.scopes && req.user.scopes.includes('lending:admin'))) {
        next();
      } else {
        res.status(403).json({ error: 'access_denied', error_description: 'Admin access required' });
      }
    },
    requireOwnershipOrAdmin: (req, res, next) => next(),
    // Helper function to change mock user for testing
    __setMockUser: (user) => { mockUser = user; }
  };
});

const app = require('../../server');
const lendingDataStore = require('../../data/store');
const authMock = require('../../middleware/auth');

describe('User Management API Endpoints', () => {
  beforeAll(async () => {
    // Wait for data store to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('firstName');
      expect(response.body.user).toHaveProperty('lastName');
      expect(response.body.user).toHaveProperty('email');
    });

    it('should return 404 if user not found in data store', async () => {
      // Set mock user that doesn't exist in the data store
      authMock.__setMockUser({
        id: 'nonexistent',
        username: 'nonexistent_user',
        email: 'nonexistent@example.com',
        role: 'user',
        scopes: ['lending:read']
      });

      const response = await request(app)
        .get('/api/users/me')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'user_not_found');
      expect(response.body).toHaveProperty('error_description');

      // Restore original user
      authMock.__setMockUser({
        id: '1',
        username: 'test_user',
        email: 'test@example.com',
        role: 'user',
        scopes: ['lending:read', 'lending:credit:read']
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user profile for valid user ID', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.user).toHaveProperty('id', '1');
      expect(response.body.user).toHaveProperty('firstName');
      expect(response.body.user).toHaveProperty('lastName');
      expect(response.body.user).toHaveProperty('email');
    });

    it('should return 404 for non-existent user ID', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'user_not_found');
      expect(response.body).toHaveProperty('error_description');
    });

    it('should handle empty user ID path', async () => {
      // This will actually hit the admin route since /api/users/ maps to /api/users
      const response = await request(app)
        .get('/api/users/')
        .expect(403); // Should get 403 since user is not admin
    });
  });

  describe('GET /api/users/search/:query', () => {
    it('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/users/search/John')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('query', 'John');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should return 400 for query less than 2 characters', async () => {
      const response = await request(app)
        .get('/api/users/search/a')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'invalid_request');
      expect(response.body).toHaveProperty('error_description');
    });

    it('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/users/search/nonexistentuser')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('count', 0);
      expect(response.body.users).toHaveLength(0);
    });
  });

  describe('GET /api/users/:id/summary', () => {
    it('should return user summary with credit info', async () => {
      const response = await request(app)
        .get('/api/users/1/summary')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.summary).toHaveProperty('user');
      expect(response.body.summary).toHaveProperty('creditInfo');
      expect(response.body.summary.creditInfo).toHaveProperty('hasScore');
      expect(response.body.summary.creditInfo).toHaveProperty('hasLimit');
    });

    it('should return 404 for non-existent user in summary', async () => {
      const response = await request(app)
        .get('/api/users/999/summary')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'user_not_found');
    });
  });

  describe('GET /api/users (admin only)', () => {
    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'access_denied');
    });

    it('should return user list for admin user', async () => {
      // Set mock admin user
      authMock.__setMockUser({
        id: '1',
        username: 'admin_user',
        email: 'admin@example.com',
        role: 'admin',
        scopes: ['lending:read', 'lending:admin']
      });

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.users)).toBe(true);

      // Restore original user
      authMock.__setMockUser({
        id: '1',
        username: 'test_user',
        email: 'test@example.com',
        role: 'user',
        scopes: ['lending:read', 'lending:credit:read']
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle data store errors gracefully', async () => {
      // Mock data store error
      const originalGetUserById = lendingDataStore.getUserById;
      lendingDataStore.getUserById = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/users/1')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'internal_server_error');
      expect(response.body).toHaveProperty('error_description');

      // Restore original method
      lendingDataStore.getUserById = originalGetUserById;
    });
  });

  describe('Data Sanitization', () => {
    it('should not include SSN in user responses', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body.user).not.toHaveProperty('ssn');
    });

    it('should include full profile for own data', async () => {
      const response = await request(app)
        .get('/api/users/1') // User ID matches authenticated user ID
        .expect(200);

      expect(response.body.user).toHaveProperty('dateOfBirth');
      expect(response.body.user).toHaveProperty('address');
      expect(response.body.user).toHaveProperty('employment');
    });
  });
});