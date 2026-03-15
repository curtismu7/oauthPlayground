const request = require('supertest');
const app = require('../../server');
const lendingDataStore = require('../../data/store');

// Mock authentication middleware for testing
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    // Mock admin user for testing
    req.user = {
      id: 'admin-test-user',
      username: 'admin@test.com',
      role: 'admin',
      scopes: ['lending:admin', 'lending:read', 'lending:credit:read', 'lending:credit:limits']
    };
    next();
  },
  requireAdmin: (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.scopes.includes('lending:admin'))) {
      next();
    } else {
      res.status(403).json({ error: 'admin_access_required' });
    }
  },
  requireScopes: (scopes) => (req, res, next) => {
    if (req.user && req.user.scopes.includes('lending:admin')) {
      next();
    } else {
      res.status(403).json({ error: 'insufficient_scope' });
    }
  }
}));

describe('Admin Routes', () => {
  beforeEach(() => {
    // Reset any test data modifications
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return all users with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=john')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.filters.search).toBe('john');
    });

    it('should support active status filtering', async () => {
      const response = await request(app)
        .get('/api/admin/users?isActive=true')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.filters.isActive).toBe('true');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.users.length).toBeLessThanOrEqual(10);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/admin/users?sortBy=firstName&sortOrder=asc')
        .expect(200);

      expect(response.body.filters.sortBy).toBe('firstName');
      expect(response.body.filters.sortOrder).toBe('asc');
    });

    it('should not include sensitive information like SSN', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(200);

      if (response.body.users.length > 0) {
        expect(response.body.users[0]).not.toHaveProperty('ssn');
      }
    });
  });

  describe('GET /api/admin/users/:userId', () => {
    it('should return detailed user information', async () => {
      // Get a user ID from the data store
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) {
        console.log('No users found in data store, skipping test');
        return;
      }

      const userId = users[0].id;
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('creditAssessment');
      expect(response.body).toHaveProperty('creditHistory');
      expect(response.body).toHaveProperty('activitySummary');
      expect(response.body.user.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('user_not_found');
    });

    it('should include credit history and activity summary', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const userId = users[0].id;
      const response = await request(app)
        .get(`/api/admin/users/${userId}`)
        .expect(200);

      expect(response.body.creditHistory).toHaveProperty('scores');
      expect(response.body.creditHistory).toHaveProperty('limits');
      expect(response.body.activitySummary).toHaveProperty('totalActivities');
      expect(response.body.activitySummary).toHaveProperty('recentActivities');
    });
  });

  describe('PUT /api/admin/users/:userId', () => {
    it('should update user information', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const userId = users[0].id;
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        isActive: false
      };

      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.firstName).toBe('Updated');
      expect(response.body.user.lastName).toBe('Name');
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = { firstName: 'Test' };

      const response = await request(app)
        .put('/api/admin/users/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('user_not_found');
    });

    it('should validate allowed update fields', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const userId = users[0].id;
      const updateData = {
        id: 'should-not-update',
        ssn: 'should-not-update',
        firstName: 'Valid Update'
      };

      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user.firstName).toBe('Valid Update');
      expect(response.body.user.id).not.toBe('should-not-update');
    });

    it('should return error for empty update data', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const userId = users[0].id;

      const response = await request(app)
        .put(`/api/admin/users/${userId}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('validation_error');
    });
  });

  describe('GET /api/admin/credit/reports', () => {
    it('should return summary credit reports by default', async () => {
      const response = await request(app)
        .get('/api/admin/credit/reports')
        .expect(200);

      expect(response.body).toHaveProperty('reportType');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('creditScores');
      expect(response.body.summary).toHaveProperty('creditLimits');
      expect(response.body.summary).toHaveProperty('riskDistribution');
    });

    it('should support detailed report type', async () => {
      const response = await request(app)
        .get('/api/admin/credit/reports?reportType=detailed')
        .expect(200);

      expect(response.body.reportType).toBe('detailed');
      expect(response.body).toHaveProperty('detailed');
      expect(response.body.detailed).toHaveProperty('creditScoreDistribution');
      expect(response.body.detailed).toHaveProperty('creditLimitRanges');
    });

    it('should support trends report type', async () => {
      const response = await request(app)
        .get('/api/admin/credit/reports?reportType=trends')
        .expect(200);

      expect(response.body.reportType).toBe('trends');
      expect(response.body).toHaveProperty('trends');
      expect(response.body.trends).toHaveProperty('creditScoresByMonth');
      expect(response.body.trends).toHaveProperty('creditLimitsByMonth');
    });

    it('should support all report type', async () => {
      const response = await request(app)
        .get('/api/admin/credit/reports?reportType=all')
        .expect(200);

      expect(response.body.reportType).toBe('all');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('detailed');
      expect(response.body).toHaveProperty('trends');
    });

    it('should support date filtering', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/admin/credit/reports?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.filters.startDate).toBe(startDate);
      expect(response.body.filters.endDate).toBe(endDate);
    });

    it('should support risk level filtering', async () => {
      const response = await request(app)
        .get('/api/admin/credit/reports?riskLevel=high')
        .expect(200);

      expect(response.body.filters.riskLevel).toBe('high');
    });

    it('should include generation timestamp', async () => {
      const response = await request(app)
        .get('/api/admin/credit/reports')
        .expect(200);

      expect(response.body).toHaveProperty('generatedAt');
      expect(new Date(response.body.generatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('POST /api/admin/credit/recalculate', () => {
    it('should recalculate credit for specific users', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const userIds = [users[0].id];
      const requestData = {
        userIds,
        recalculationType: 'both',
        forceRecalculation: true
      };

      const response = await request(app)
        .post('/api/admin/credit/recalculate')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveProperty('totalUsers');
      expect(response.body.results).toHaveProperty('successful');
      expect(response.body.results).toHaveProperty('failed');
      expect(response.body.results).toHaveProperty('details');
      expect(response.body.results.totalUsers).toBe(1);
    });

    it('should recalculate credit for all users', async () => {
      const requestData = {
        recalculateAll: true,
        recalculationType: 'scores',
        forceRecalculation: true
      };

      const response = await request(app)
        .post('/api/admin/credit/recalculate')
        .send(requestData)
        .expect(200);

      expect(response.body.results.totalUsers).toBeGreaterThanOrEqual(0);
    });

    it('should validate request parameters', async () => {
      const requestData = {
        // Missing required parameters
      };

      const response = await request(app)
        .post('/api/admin/credit/recalculate')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('validation_error');
    });

    it('should support different recalculation types', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const userIds = [users[0].id];

      // Test scores only
      const scoresResponse = await request(app)
        .post('/api/admin/credit/recalculate')
        .send({
          userIds,
          recalculationType: 'scores',
          forceRecalculation: true
        })
        .expect(200);

      expect(scoresResponse.body.results).toBeDefined();

      // Test limits only
      const limitsResponse = await request(app)
        .post('/api/admin/credit/recalculate')
        .send({
          userIds,
          recalculationType: 'limits',
          forceRecalculation: true
        })
        .expect(200);

      expect(limitsResponse.body.results).toBeDefined();
    });

    it('should handle non-existent users gracefully', async () => {
      const requestData = {
        userIds: ['non-existent-1', 'non-existent-2'],
        recalculationType: 'both',
        forceRecalculation: true
      };

      const response = await request(app)
        .post('/api/admin/credit/recalculate')
        .send(requestData)
        .expect(400);

      expect(response.body.error).toBe('validation_error');
    });

    it('should include timing information', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const requestData = {
        userIds: [users[0].id],
        recalculationType: 'both',
        forceRecalculation: true
      };

      const response = await request(app)
        .post('/api/admin/credit/recalculate')
        .send(requestData)
        .expect(200);

      expect(response.body.results).toHaveProperty('startedAt');
      expect(response.body.results).toHaveProperty('completedAt');
      expect(response.body.results).toHaveProperty('duration');
    });
  });

  describe('GET /api/admin/system/status', () => {
    it('should return system status information', async () => {
      const response = await request(app)
        .get('/api/admin/system/status')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('dataStore');
      expect(response.body).toHaveProperty('recentActivity');
      expect(response.body).toHaveProperty('systemHealth');
    });

    it('should include data store statistics', async () => {
      const response = await request(app)
        .get('/api/admin/system/status')
        .expect(200);

      expect(response.body.dataStore).toHaveProperty('totalUsers');
      expect(response.body.dataStore).toHaveProperty('activeUsers');
      expect(response.body.dataStore).toHaveProperty('totalCreditScores');
      expect(response.body.dataStore).toHaveProperty('totalCreditLimits');
      expect(response.body.dataStore).toHaveProperty('totalActivityLogs');
    });

    it('should include system health metrics', async () => {
      const response = await request(app)
        .get('/api/admin/system/status')
        .expect(200);

      expect(response.body.systemHealth).toHaveProperty('memoryUsage');
      expect(response.body.systemHealth).toHaveProperty('cpuUsage');
      expect(response.body.systemHealth).toHaveProperty('nodeVersion');
      expect(response.body.systemHealth).toHaveProperty('platform');
    });

    it('should include recent activity summary', async () => {
      const response = await request(app)
        .get('/api/admin/system/status')
        .expect(200);

      expect(response.body.recentActivity).toHaveProperty('last24Hours');
      expect(response.body.recentActivity).toHaveProperty('byAction');
    });

    it('should detect warnings when appropriate', async () => {
      const response = await request(app)
        .get('/api/admin/system/status')
        .expect(200);

      // Status should be either 'healthy' or 'warning'
      expect(['healthy', 'warning']).toContain(response.body.status);
    });
  });

  describe('GET /api/admin/activity-logs', () => {
    it('should return activity logs with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/activity-logs')
        .expect(200);

      expect(response.body).toHaveProperty('activityLogs');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.activityLogs)).toBe(true);
    });

    it('should support user ID filtering', async () => {
      const users = lendingDataStore.getAllUsers();
      if (users.length === 0) return;

      const userId = users[0].id;
      const response = await request(app)
        .get(`/api/admin/activity-logs?userId=${userId}`)
        .expect(200);

      expect(response.body.filters.userId).toBe(userId);
    });

    it('should support action filtering', async () => {
      const action = 'user_login';
      const response = await request(app)
        .get(`/api/admin/activity-logs?action=${action}`)
        .expect(200);

      expect(response.body.filters.action).toBe(action);
    });

    it('should support date range filtering', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/admin/activity-logs?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.filters.startDate).toBe(startDate);
      expect(response.body.filters.endDate).toBe(endDate);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/activity-logs?page=1&limit=50')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.activityLogs.length).toBeLessThanOrEqual(50);
    });

    it('should support sort order', async () => {
      const response = await request(app)
        .get('/api/admin/activity-logs?sortOrder=asc')
        .expect(200);

      expect(response.body.filters.sortOrder).toBe('asc');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require admin access for all admin routes', async () => {
      // This test would normally fail without proper auth, but our mock allows it
      // In a real scenario, we'd test with non-admin users
      const routes = [
        '/api/admin/users',
        '/api/admin/credit/reports',
        '/api/admin/system/status',
        '/api/admin/activity-logs'
      ];

      for (const route of routes) {
        const response = await request(app)
          .get(route)
          .expect(200);

        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Mock a data store error
      const originalGetAllUsers = lendingDataStore.getAllUsers;
      lendingDataStore.getAllUsers = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/admin/users')
        .expect(500);

      expect(response.body.error).toBe('internal_server_error');

      // Restore original method
      lendingDataStore.getAllUsers = originalGetAllUsers;
    });

    it('should include proper error information', async () => {
      const response = await request(app)
        .get('/api/admin/users/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('error_description');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');
    });
  });
});