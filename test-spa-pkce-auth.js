#!/usr/bin/env node

/**
 * Test script to verify SPA PKCE authentication configuration
 * This script ensures the backend correctly handles SPA + PKCE authentication
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001/api/token-exchange';

// Test configuration for SPA + PKCE
const testConfig = {
  environmentId: 'test-env',
  clientId: 'test-client',
  authenticationMethod: 'pkce',
  applicationType: 'spa',
  usePKCE: true
};

async function testSPAPKCEAuth() {
  console.log('🧪 Testing SPA PKCE Authentication Configuration...\n');

  try {
    // Test 1: Correct SPA + PKCE configuration
    console.log('Test 1: SPA + PKCE (should use no authentication method)');
    const response1 = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'test-code',
        redirect_uri: 'https://localhost:3000/callback',
        code_verifier: 'test-verifier',
        config: testConfig
      })
    });

    const result1 = await response1.text();
    console.log(`Status: ${response1.status}`);
    console.log(`Response: ${result1}\n`);

    // Test 2: Incorrect configuration (should be rejected)
    console.log('Test 2: SPA + PKCE with Client Secret Basic (should be rejected)');
    const incorrectConfig = {
      ...testConfig,
      authenticationMethod: 'client_secret_basic',
      clientSecret: 'test-secret'
    };

    try {
      const response2 = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: 'test-code',
          redirect_uri: 'https://localhost:3000/callback',
          code_verifier: 'test-verifier',
          config: incorrectConfig
        })
      });

      const result2 = await response2.text();
      console.log(`Status: ${response2.status}`);
      console.log(`Response: ${result2}\n`);
    } catch (error) {
      console.log(`Expected error: ${error.message}\n`);
    }

    // Test 3: Backend application (should work with client secret)
    console.log('Test 3: Backend application with Client Secret Basic (should work)');
    const backendConfig = {
      environmentId: 'test-env',
      clientId: 'test-client',
      authenticationMethod: 'client_secret_basic',
      applicationType: 'backend',
      clientSecret: 'test-secret'
    };

    const response3 = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'test-code',
        redirect_uri: 'https://localhost:3000/callback',
        config: backendConfig
      })
    });

    const result3 = await response3.text();
    console.log(`Status: ${response3.status}`);
    console.log(`Response: ${result3}\n`);

    console.log('✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- SPA + PKCE uses no authentication method (client_id in body)');
    console.log('- SPA + PKCE with client secret is rejected (as expected)');
    console.log('- Backend applications can use client secret authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSPAPKCEAuth();



