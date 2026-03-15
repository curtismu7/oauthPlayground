/**
 * Global Teardown for E2E Tests
 * Runs once after all E2E tests
 */

const { cleanupE2ETests } = require('./setup');

module.exports = async () => {
  console.log('🧹 Global E2E Test Teardown Starting...');
  
  try {
    await cleanupE2ETests();
    console.log('✅ Global E2E Test Teardown Completed');
  } catch (error) {
    console.error('❌ Global E2E Test Teardown Failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
};