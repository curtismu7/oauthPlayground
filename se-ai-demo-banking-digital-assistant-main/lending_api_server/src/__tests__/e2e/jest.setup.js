/**
 * Jest Setup for E2E Tests
 * Configures the test environment for each test file
 */

const { setupE2ETests, cleanupE2ETests } = require('./setup');

// Increase timeout for E2E tests
jest.setTimeout(120000);

// Setup before each test file
beforeAll(async () => {
  // Individual test files don't need to setup the entire environment
  // as it's handled by the global setup
  console.log('Setting up E2E test file...');
});

// Cleanup after each test file
afterAll(async () => {
  console.log('Cleaning up E2E test file...');
  // Individual cleanup if needed
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});