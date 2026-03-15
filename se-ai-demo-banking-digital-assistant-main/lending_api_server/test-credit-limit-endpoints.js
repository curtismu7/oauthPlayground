#!/usr/bin/env node

/**
 * Test script for credit limit endpoints
 * This script tests the newly implemented credit limit functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const TEST_USER_ID = '1';

// Mock OAuth token for testing (in production this would be a real JWT)
const MOCK_TOKEN = 'mock_token_for_testing';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${MOCK_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testCreditLimitEndpoints() {
  console.log('🧪 Testing Credit Limit Endpoints');
  console.log('==================================\n');

  try {
    // Test 1: Get credit limit for user
    console.log('1️⃣  Testing GET /api/credit/:userId/limit');
    try {
      const limitResponse = await api.get(`/api/credit/${TEST_USER_ID}/limit`);
      console.log('✅ Credit limit retrieved successfully');
      console.log(`   User ID: ${limitResponse.data.data.userId}`);
      console.log(`   Credit Score: ${limitResponse.data.data.creditScore}`);
      console.log(`   Calculated Limit: $${limitResponse.data.data.calculatedLimit.toLocaleString()}`);
      console.log(`   Approved Limit: $${limitResponse.data.data.approvedLimit.toLocaleString()}`);
      console.log(`   Risk Level: ${limitResponse.data.data.riskLevel}`);
      console.log(`   Income Multiplier: ${limitResponse.data.data.businessRules.incomeMultiplier}`);
    } catch (error) {
      console.log('❌ Credit limit test failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 2: Get comprehensive credit assessment
    console.log('2️⃣  Testing GET /api/credit/:userId/assessment');
    try {
      const assessmentResponse = await api.get(`/api/credit/${TEST_USER_ID}/assessment`);
      console.log('✅ Credit assessment retrieved successfully');
      const assessment = assessmentResponse.data.data;
      console.log(`   User: ${assessment.user.firstName} ${assessment.user.lastName}`);
      console.log(`   Credit Score: ${assessment.creditScore.score}`);
      console.log(`   Credit Limit: $${assessment.creditLimit.calculatedLimit.toLocaleString()}`);
      console.log(`   Risk Level: ${assessment.creditLimit.riskLevel}`);
      console.log(`   Loan Approved: ${assessment.recommendation.approved ? 'Yes' : 'No'}`);
      console.log(`   Max Loan Amount: $${assessment.recommendation.maxLoanAmount.toLocaleString()}`);
      console.log(`   Interest Rate Range: ${assessment.recommendation.interestRateRange.min}% - ${assessment.recommendation.interestRateRange.max}%`);
      console.log(`   Terms: ${assessment.recommendation.terms.join(', ')}`);
      console.log(`   Reasons: ${assessment.recommendation.reasons.join(', ')}`);
    } catch (error) {
      console.log('❌ Credit assessment test failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 3: Test with refresh parameter
    console.log('3️⃣  Testing GET /api/credit/:userId/limit?refresh=true');
    try {
      const refreshResponse = await api.get(`/api/credit/${TEST_USER_ID}/limit?refresh=true`);
      console.log('✅ Credit limit refresh test successful');
      console.log(`   Refreshed Limit: $${refreshResponse.data.data.calculatedLimit.toLocaleString()}`);
    } catch (error) {
      console.log('❌ Credit limit refresh test failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 4: Test recalculation (admin endpoint)
    console.log('4️⃣  Testing POST /api/credit/:userId/limit/recalculate');
    try {
      const recalcResponse = await api.post(`/api/credit/${TEST_USER_ID}/limit/recalculate`);
      console.log('✅ Credit limit recalculation successful');
      console.log(`   New Limit: $${recalcResponse.data.data.calculatedLimit.toLocaleString()}`);
      console.log(`   Recalculated By: ${recalcResponse.data.data.recalculatedBy}`);
    } catch (error) {
      console.log('❌ Credit limit recalculation test failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 5: Test cache statistics
    console.log('5️⃣  Testing GET /api/credit/limits/cache/stats');
    try {
      const cacheStatsResponse = await api.get('/api/credit/limits/cache/stats');
      console.log('✅ Cache statistics retrieved successfully');
      const stats = cacheStatsResponse.data.data;
      console.log(`   Total Entries: ${stats.totalEntries}`);
      console.log(`   Valid Entries: ${stats.validEntries}`);
      console.log(`   Expired Entries: ${stats.expiredEntries}`);
      console.log(`   Cache TTL: ${stats.cacheTTL} seconds`);
    } catch (error) {
      console.log('❌ Cache statistics test failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 6: Test error handling with non-existent user
    console.log('6️⃣  Testing error handling with non-existent user');
    try {
      await api.get('/api/credit/non-existent-user/limit');
      console.log('❌ Should have returned 404 error');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Error handling test successful - returned 404 as expected');
        console.log(`   Error: ${error.response.data.error}`);
        console.log(`   Description: ${error.response.data.error_description}`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n');

    // Test 7: Test different users to see varying credit profiles
    console.log('7️⃣  Testing different user credit profiles');
    const testUsers = ['1', '2', '3', '4', '5'];
    
    for (const userId of testUsers) {
      try {
        const response = await api.get(`/api/credit/${userId}/assessment`);
        const assessment = response.data.data;
        console.log(`   User ${userId} (${assessment.user.firstName} ${assessment.user.lastName}):`);
        console.log(`     Score: ${assessment.creditScore.score}, Limit: $${assessment.creditLimit.calculatedLimit.toLocaleString()}, Risk: ${assessment.creditLimit.riskLevel}, Approved: ${assessment.recommendation.approved ? 'Yes' : 'No'}`);
      } catch (error) {
        console.log(`   User ${userId}: Error - ${error.response?.data?.error || error.message}`);
      }
    }

    console.log('\n✅ All credit limit endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await api.get('/api/credit/health');
    console.log('✅ Server is running and healthy');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Response Time: ${response.data.response_time_ms}ms`);
    return true;
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    console.log('   Make sure the lending API server is running on port 3002');
    console.log('   Run: npm start');
    return false;
  }
}

async function main() {
  console.log('🚀 Credit Limit Endpoint Test Suite');
  console.log('===================================\n');
  
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }
  
  console.log('');
  await testCreditLimitEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCreditLimitEndpoints, checkServerHealth };