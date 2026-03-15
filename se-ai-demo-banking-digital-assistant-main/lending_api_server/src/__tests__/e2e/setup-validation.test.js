/**
 * E2E Setup Validation Test
 * Simple test to validate E2E test environment setup
 */

const { generateTestToken, getTestDataManager } = require('./setup');

describe('E2E Setup Validation', () => {
  test('should generate valid test tokens', () => {
    const token = generateTestToken({
      sub: 'test-user-123',
      scope: 'lending:read lending:credit:read'
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  test('should have test data manager available', () => {
    expect(() => {
      const manager = getTestDataManager();
      expect(manager).toBeDefined();
    }).not.toThrow();
  });

  test('should have test environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should validate test utilities', () => {
    const { wait, retryWithBackoff } = require('./setup');
    
    expect(typeof wait).toBe('function');
    expect(typeof retryWithBackoff).toBe('function');
  });
});