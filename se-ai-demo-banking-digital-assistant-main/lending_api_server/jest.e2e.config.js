/**
 * Jest Configuration for E2E Tests
 */

module.exports = {
  displayName: 'E2E Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/__tests__/e2e/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/e2e/jest.setup.js'
  ],
  testTimeout: 120000, // 2 minutes for E2E tests
  verbose: true,
  collectCoverage: false, // Disable coverage for E2E tests
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts
  forceExit: true,
  detectOpenHandles: true,
  globalSetup: '<rootDir>/src/__tests__/e2e/global-setup.js',
  globalTeardown: '<rootDir>/src/__tests__/e2e/global-teardown.js',
  reporters: [
    'default'
  ],
  testResultsProcessor: '<rootDir>/src/__tests__/e2e/results-processor.js'
};