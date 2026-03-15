// Test setup file for lending API server
// This file is run before each test suite

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for tests

// Mock environment variables for testing
process.env.P1AIC_TENANT_NAME = 'test-tenant';
process.env.P1AIC_CLIENT_ID = 'test-client-id';
process.env.P1AIC_CLIENT_SECRET = 'test-client-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.CREDIT_SCORE_TTL = '3600';
process.env.DEFAULT_CREDIT_LIMIT = '5000';
process.env.MINIMUM_CREDIT_SCORE = '600';

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Mock OAuth token
  mockToken: {
    access_token: 'mock-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'lending:read lending:credit:read lending:credit:limits'
  },
  
  // Mock user profile
  mockUser: {
    id: 'test-user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    dateOfBirth: '1990-01-01',
    isActive: true
  },
  
  // Mock credit score
  mockCreditScore: {
    id: 'score-123',
    userId: 'test-user-123',
    score: 750,
    scoreDate: new Date().toISOString(),
    factors: {
      paymentHistory: 35,
      creditUtilization: 30,
      creditLength: 15,
      creditMix: 10,
      newCredit: 10
    },
    source: 'calculated'
  },
  
  // Mock credit limit
  mockCreditLimit: {
    id: 'limit-123',
    userId: 'test-user-123',
    creditScore: 750,
    calculatedLimit: 25000,
    approvedLimit: 25000,
    riskLevel: 'low',
    businessRules: {
      incomeMultiplier: 5,
      debtToIncomeRatio: 0.3,
      minimumScore: 600
    }
  }
};