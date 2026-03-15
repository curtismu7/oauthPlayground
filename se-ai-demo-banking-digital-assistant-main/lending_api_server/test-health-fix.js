#!/usr/bin/env node

/**
 * Test script to verify health check fixes
 */

console.log('Testing health check fixes...\n');

// Test 1: Data Store
console.log('1. Testing Data Store...');
try {
  const lendingDataStore = require('./data/store');
  const users = lendingDataStore.getAllUsers();
  console.log(`✅ Data Store: Found ${users.length} users`);
} catch (error) {
  console.log(`❌ Data Store Error: ${error.message}`);
}

// Test 2: Credit Scoring Service
console.log('\n2. Testing Credit Scoring Service...');
try {
  const creditScoringService = require('./services/CreditScoringService');
  const cacheStats = creditScoringService.getCacheStats();
  console.log(`✅ Credit Scoring Service: Cache has ${cacheStats.totalEntries} entries`);
} catch (error) {
  console.log(`❌ Credit Scoring Service Error: ${error.message}`);
}

// Test 3: Credit Limit Service
console.log('\n3. Testing Credit Limit Service...');
try {
  const creditLimitService = require('./services/CreditLimitService');
  console.log(`✅ Credit Limit Service: Loaded successfully`);
} catch (error) {
  console.log(`❌ Credit Limit Service Error: ${error.message}`);
}

// Test 4: Health Monitor
console.log('\n4. Testing Health Monitor...');
try {
  const { healthMonitor } = require('./utils/healthMonitor');
  console.log(`✅ Health Monitor: Loaded successfully`);
  
  // Run a quick health check
  healthMonitor.runAllChecks().then(results => {
    console.log(`\n📊 Health Check Results:`);
    console.log(`Total checks: ${results.total_checks}`);
    console.log(`Healthy: ${results.healthy_checks}`);
    console.log(`Unhealthy: ${results.unhealthy_checks}`);
    console.log(`Overall healthy: ${results.healthy ? '✅' : '❌'}`);
    
    if (results.unhealthy_checks > 0) {
      console.log('\n🔍 Unhealthy components:');
      results.checks.filter(check => !check.healthy).forEach(check => {
        console.log(`  - ${check.name}: ${check.error || 'Failed'}`);
      });
    }
  }).catch(error => {
    console.log(`❌ Health Check Error: ${error.message}`);
  });
  
} catch (error) {
  console.log(`❌ Health Monitor Error: ${error.message}`);
}

console.log('\n✨ Test completed!');