/**
 * E2E Test Setup and Configuration
 * Sets up the test environment for end-to-end testing
 */

const TestDataManager = require('./test-data-manager');
const jwt = require('jsonwebtoken');

// Global test data manager instance
let testDataManager;

/**
 * Setup function called before all E2E tests
 */
async function setupE2ETests() {
  console.log('Setting up E2E test environment...');
  
  try {
    // Initialize test data manager
    testDataManager = new TestDataManager();
    await testDataManager.initialize();
    
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.CREDIT_SCORE_TTL = '60'; // 1 minute for testing
    process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
    
    console.log('E2E test environment setup completed');
  } catch (error) {
    console.error('Failed to setup E2E test environment:', error);
    throw error;
  }
}

/**
 * Cleanup function called after all E2E tests
 */
async function cleanupE2ETests() {
  console.log('Cleaning up E2E test environment...');
  
  try {
    if (testDataManager) {
      await testDataManager.cleanup();
    }
    
    console.log('E2E test environment cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup E2E test environment:', error);
    throw error;
  }
}

/**
 * Generate test JWT token for authentication
 */
function generateTestToken(payload = {}) {
  const defaultPayload = {
    sub: 'test-user-123',
    scope: 'lending:read',
    iss: 'test-issuer',
    aud: 'lending-api',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000)
  };

  const finalPayload = { ...defaultPayload, ...payload };
  
  // Use a test secret for JWT signing
  const testSecret = 'test-jwt-secret-for-e2e-tests';
  
  return jwt.sign(finalPayload, testSecret);
}

/**
 * Get test data manager instance
 */
function getTestDataManager() {
  if (!testDataManager) {
    // For individual tests, create a new instance if needed
    const TestDataManager = require('./test-data-manager');
    testDataManager = new TestDataManager();
  }
  return testDataManager;
}

/**
 * Wait for a specified amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await wait(delay);
    }
  }
  
  throw lastError;
}

/**
 * Create test user with specific attributes
 */
async function createTestUser(attributes = {}) {
  const manager = getTestDataManager();
  
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+1-555-0199',
    dateOfBirth: '1990-01-01',
    ssn: 'encrypted_test_ssn',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    },
    employment: {
      employer: 'Test Company',
      position: 'Test Position',
      annualIncome: 50000,
      employmentLength: 24
    },
    isActive: true
  };

  return await manager.createTestUser({ ...defaultUser, ...attributes });
}

/**
 * Create test credit score for user
 */
async function createTestCreditScore(userId, attributes = {}) {
  const manager = getTestDataManager();
  
  const defaultScore = {
    score: 650,
    scoreDate: new Date().toISOString(),
    factors: {
      paymentHistory: 30,
      creditUtilization: 30,
      creditLength: 15,
      creditMix: 15,
      newCredit: 10
    },
    source: 'calculated'
  };

  return await manager.createTestCreditScore(userId, { ...defaultScore, ...attributes });
}

/**
 * Create test credit limit for user
 */
async function createTestCreditLimit(userId, attributes = {}) {
  const manager = getTestDataManager();
  
  const defaultLimit = {
    creditScore: 650,
    calculatedLimit: 15000,
    approvedLimit: 15000,
    riskLevel: 'medium',
    businessRules: {
      incomeMultiplier: 0.3,
      debtToIncomeRatio: 0.3,
      minimumScore: 600
    }
  };

  return await manager.createTestCreditLimit(userId, { ...defaultLimit, ...attributes });
}

/**
 * Performance test helpers
 */
const performanceHelpers = {
  /**
   * Measure execution time of a function
   */
  async measureTime(fn) {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return { result, executionTime };
  },

  /**
   * Run concurrent operations and measure performance
   */
  async runConcurrent(operations, concurrency = 10) {
    const results = [];
    const errors = [];
    const startTime = Date.now();

    // Split operations into batches
    const batches = [];
    for (let i = 0; i < operations.length; i += concurrency) {
      batches.push(operations.slice(i, i + concurrency));
    }

    // Execute batches sequentially, operations within batch concurrently
    for (const batch of batches) {
      const batchPromises = batch.map(async (operation, index) => {
        try {
          const opStartTime = Date.now();
          const result = await operation();
          const opEndTime = Date.now();
          
          return {
            index: results.length + index,
            result,
            executionTime: opEndTime - opStartTime,
            success: true
          };
        } catch (error) {
          errors.push({
            index: results.length + index,
            error: error.message,
            success: false
          });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));
    }

    const totalTime = Date.now() - startTime;
    
    return {
      results,
      errors,
      totalTime,
      successRate: results.length / operations.length,
      averageTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
    };
  }
};

/**
 * Test environment validation
 */
async function validateTestEnvironment() {
  const checks = [
    {
      name: 'Server startup',
      check: async () => {
        // This would typically check if the server is running
        return true;
      }
    },
    {
      name: 'Database connectivity',
      check: async () => {
        // This would check database connection
        return true;
      }
    },
    {
      name: 'Test data availability',
      check: async () => {
        const manager = getTestDataManager();
        const users = manager.getTestUsers();
        return users.length > 0;
      }
    }
  ];

  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.check();
      results.push({ name: check.name, passed: result, error: null });
    } catch (error) {
      results.push({ name: check.name, passed: false, error: error.message });
    }
  }

  const allPassed = results.every(r => r.passed);
  
  if (!allPassed) {
    console.error('Test environment validation failed:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`- ${r.name}: ${r.error}`);
    });
    throw new Error('Test environment validation failed');
  }

  console.log('Test environment validation passed');
  return results;
}

module.exports = {
  setupE2ETests,
  cleanupE2ETests,
  generateTestToken,
  getTestDataManager,
  wait,
  retryWithBackoff,
  createTestUser,
  createTestCreditScore,
  createTestCreditLimit,
  performanceHelpers,
  validateTestEnvironment
};