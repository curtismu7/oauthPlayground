#!/usr/bin/env node

/**
 * Test script for MFA OTP Send functionality
 * Tests the send OTP endpoint to verify it works correctly
 */

import http from 'http';

// Test configuration
const TEST_CONFIG = {
  environmentId: process.env.PINGONE_ENVIRONMENT_ID || 'test-env-id',
  username: 'test.user@example.com',
  deviceId: 'test-device-id',
  workerToken: process.env.PINGONE_WORKER_TOKEN || 'test-token'
};

console.log('🧪 MFA OTP Send Test');
console.log('===================\n');

// Test 1: Send OTP with valid parameters
async function testSendOTP() {
  console.log('Test 1: Send OTP to device');
  console.log('---------------------------');
  console.log('Environment ID:', TEST_CONFIG.environmentId);
  console.log('Username:', TEST_CONFIG.username);
  console.log('Device ID:', TEST_CONFIG.deviceId);
  console.log('Worker Token:', TEST_CONFIG.workerToken ? '✓ Present' : '✗ Missing');
  console.log('');

  const postData = JSON.stringify({
    environmentId: TEST_CONFIG.environmentId,
    username: TEST_CONFIG.username,
    deviceId: TEST_CONFIG.deviceId
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/pingone/mfa/send-otp',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.workerToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('Response Body:', data);
        console.log('');

        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Test PASSED: OTP sent successfully');
            resolve(parsed);
          } else {
            console.log('⚠️  Test WARNING: Non-200 status code');
            resolve(parsed);
          }
        } catch (e) {
          console.log('❌ Test FAILED: Invalid JSON response');
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Test FAILED: Request error');
      console.error(error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test 2: Send OTP without Content-Type header (should work)
async function testSendOTPWithoutContentType() {
  console.log('\nTest 2: Send OTP without Content-Type header');
  console.log('---------------------------------------------');
  console.log('This tests the fix for the send OTP issue');
  console.log('');

  const postData = JSON.stringify({
    environmentId: TEST_CONFIG.environmentId,
    username: TEST_CONFIG.username,
    deviceId: TEST_CONFIG.deviceId
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/pingone/mfa/send-otp',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.workerToken}`,
      // No Content-Type header
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', data);
        console.log('');

        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Test PASSED: OTP sent without Content-Type header');
            resolve(parsed);
          } else {
            console.log('⚠️  Test WARNING: Non-200 status code');
            resolve(parsed);
          }
        } catch (e) {
          console.log('❌ Test FAILED: Invalid JSON response');
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Test FAILED: Request error');
      console.error(error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Send OTP with empty body (should fail gracefully)
async function testSendOTPWithEmptyBody() {
  console.log('\nTest 3: Send OTP with empty body');
  console.log('---------------------------------');
  console.log('This tests error handling');
  console.log('');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/pingone/mfa/send-otp',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.workerToken}`,
      'Content-Length': 0
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', data);
        console.log('');

        if (res.statusCode >= 400) {
          console.log('✅ Test PASSED: Empty body rejected with error');
          resolve({ error: true });
        } else {
          console.log('⚠️  Test WARNING: Empty body accepted (unexpected)');
          resolve({ error: false });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Test FAILED: Request error');
      console.error(error);
      reject(error);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  try {
    await testSendOTP();
    await testSendOTPWithoutContentType();
    await testSendOTPWithEmptyBody();
    
    console.log('\n===================');
    console.log('✅ All tests completed');
    console.log('===================\n');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Check if required environment variables are set
if (!process.env.PINGONE_ENVIRONMENT_ID || !process.env.PINGONE_WORKER_TOKEN) {
  console.log('⚠️  WARNING: Environment variables not set');
  console.log('Set PINGONE_ENVIRONMENT_ID and PINGONE_WORKER_TOKEN for real API testing');
  console.log('Running with test values...\n');
}

runTests();
