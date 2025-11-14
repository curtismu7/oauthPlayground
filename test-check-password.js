#!/usr/bin/env node
/**
 * Quick test for Password Check API with real credentials
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://localhost:3000';

const config = {
  environmentId: process.env.PINGONE_ENVIRONMENT_ID || process.env.VITE_PINGONE_ENVIRONMENT_ID,
  clientId: process.env.PINGONE_CLIENT_ID || process.env.VITE_PINGONE_CLIENT_ID,
  clientSecret: process.env.PINGONE_CLIENT_SECRET || process.env.VITE_PINGONE_CLIENT_SECRET,
  testUsername: 'curtis7',
  testPassword: 'Claire7&',
};

async function getWorkerToken() {
  console.log('🔑 Getting worker token...');
  
  const tokenEndpoint = `https://auth.pingone.com/${config.environmentId}/as/token`;
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token request failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('✅ Worker token obtained\n');
  return data.access_token;
}

async function lookupUser(workerToken, username) {
  console.log(`🔍 Looking up user: ${username}...`);
  
  const response = await fetch(`${BASE_URL}/api/pingone/users/lookup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      environmentId: config.environmentId,
      accessToken: workerToken,
      identifier: username,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`User lookup failed: ${error.error_description || error.message}`);
  }

  const data = await response.json();
  console.log(`✅ User found: ${data.user.username} (${data.user.id})\n`);
  return data.user;
}

async function checkPassword(workerToken, userId, password, testName) {
  console.log(`🔐 Testing: ${testName}...`);
  
  const response = await fetch(`${BASE_URL}/api/pingone/password/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      environmentId: config.environmentId,
      userId: userId,
      workerToken: workerToken,
      password: password,
    }),
  });

  const data = await response.json();
  
  console.log(`   Status: ${response.status} ${response.statusText}`);
  console.log(`   Response:`, JSON.stringify(data, null, 2));
  
  if (data.success && data.valid !== undefined) {
    if (data.valid) {
      console.log(`   ✅ Password is CORRECT\n`);
    } else {
      console.log(`   ❌ Password is INCORRECT`);
      if (data.failuresRemaining !== undefined) {
        console.log(`   ⚠️  Failures remaining: ${data.failuresRemaining}\n`);
      }
    }
  } else if (data.error) {
    console.log(`   ❌ Error: ${data.error_description || data.message}\n`);
  }
  
  return data;
}

async function runTests() {
  console.log('🚀 Password Check API Test\n');
  console.log('='.repeat(60));
  console.log(`Environment: ${config.environmentId.substring(0, 20)}...`);
  console.log(`Test User: ${config.testUsername}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Get worker token
    const workerToken = await getWorkerToken();
    
    // Lookup user
    const user = await lookupUser(workerToken, config.testUsername);
    
    // Test 1: Check with correct password
    await checkPassword(workerToken, user.id, config.testPassword, 'Correct Password');
    
    // Test 2: Check with incorrect password
    await checkPassword(workerToken, user.id, 'WrongPassword123!', 'Incorrect Password');
    
    // Test 3: Check with empty password
    await checkPassword(workerToken, user.id, '', 'Empty Password');
    
    console.log('='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
