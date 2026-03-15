#!/usr/bin/env node

/**
 * Test script to verify rate limiting behavior
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const TEST_ENDPOINT = '/api/healthz';

async function testRateLimiting() {
  console.log('Testing rate limiting behavior...');
  console.log(`Target: ${BASE_URL}${TEST_ENDPOINT}`);
  
  const results = {
    successful: 0,
    rateLimited: 0,
    errors: 0,
    responses: []
  };

  // Send 60 requests quickly to trigger rate limiting
  const requests = [];
  for (let i = 0; i < 60; i++) {
    requests.push(
      axios.get(`${BASE_URL}${TEST_ENDPOINT}`, {
        timeout: 5000,
        validateStatus: () => true // Don't throw on 4xx/5xx
      }).catch(error => ({
        status: error.code === 'ECONNABORTED' ? 'timeout' : 'error',
        error: error.message
      }))
    );
  }

  console.log('Sending 60 concurrent requests...');
  const responses = await Promise.all(requests);

  // Analyze responses
  responses.forEach((response, index) => {
    if (response.status === 200) {
      results.successful++;
    } else if (response.status === 429) {
      results.rateLimited++;
      console.log(`Request ${index + 1}: Rate limited (429)`);
    } else if (response.status === 'timeout' || response.status === 'error') {
      results.errors++;
      console.log(`Request ${index + 1}: ${response.status} - ${response.error}`);
    } else {
      results.errors++;
      console.log(`Request ${index + 1}: Unexpected status ${response.status}`);
    }
    
    results.responses.push({
      index: index + 1,
      status: response.status,
      headers: response.headers || {}
    });
  });

  // Print results
  console.log('\n=== Rate Limiting Test Results ===');
  console.log(`Total requests: ${responses.length}`);
  console.log(`Successful (200): ${results.successful}`);
  console.log(`Rate limited (429): ${results.rateLimited}`);
  console.log(`Errors/Timeouts: ${results.errors}`);
  
  // Check rate limit headers from successful responses
  const successfulResponse = results.responses.find(r => r.status === 200);
  if (successfulResponse && successfulResponse.headers) {
    console.log('\n=== Rate Limit Headers ===');
    console.log(`X-RateLimit-Limit: ${successfulResponse.headers['x-ratelimit-limit'] || 'Not set'}`);
    console.log(`X-RateLimit-Remaining: ${successfulResponse.headers['x-ratelimit-remaining'] || 'Not set'}`);
    console.log(`X-RateLimit-Reset: ${successfulResponse.headers['x-ratelimit-reset'] || 'Not set'}`);
  }

  // Check if rate limiting is working
  if (results.rateLimited > 0) {
    console.log('\n✅ Rate limiting is working correctly');
  } else if (results.errors > 10) {
    console.log('\n⚠️  High error rate - server may be crashing under load');
  } else {
    console.log('\n⚠️  Rate limiting may not be working - all requests succeeded');
  }

  return results;
}

// Test with a delay to see recovery
async function testRateLimitRecovery() {
  console.log('\n=== Testing Rate Limit Recovery ===');
  
  try {
    // First request should work
    const response1 = await axios.get(`${BASE_URL}${TEST_ENDPOINT}`);
    console.log(`Initial request: ${response1.status}`);
    
    // Wait a bit
    console.log('Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Second request should also work
    const response2 = await axios.get(`${BASE_URL}${TEST_ENDPOINT}`);
    console.log(`Recovery request: ${response2.status}`);
    
    console.log('✅ Rate limit recovery working');
  } catch (error) {
    console.log(`❌ Recovery test failed: ${error.message}`);
  }
}

async function main() {
  try {
    await testRateLimiting();
    await testRateLimitRecovery();
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRateLimiting, testRateLimitRecovery };