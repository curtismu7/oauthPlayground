/**
 * Global Setup for E2E Tests
 * Runs once before all E2E tests
 */

const { setupE2ETests } = require('./setup');

module.exports = async () => {
  console.log('🚀 Global E2E Test Setup Starting...');
  
  try {
    await setupE2ETests();
    console.log('✅ Global E2E Test Setup Completed');
  } catch (error) {
    console.error('❌ Global E2E Test Setup Failed:', error);
    throw error;
  }
};