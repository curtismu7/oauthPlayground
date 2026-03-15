#!/usr/bin/env node

/**
 * Test script to verify OAuth token flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testOAuthFlow() {
  console.log('Testing OAuth token flow...');
  
  try {
    // Step 1: Check OAuth status (should return session info if logged in)
    console.log('1. Checking OAuth status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/auth/oauth/status`, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('OAuth Status Response:', {
      status: statusResponse.status,
      authenticated: statusResponse.data?.authenticated,
      hasAccessToken: !!statusResponse.data?.accessToken,
      user: statusResponse.data?.user?.email
    });
    
    if (statusResponse.data?.authenticated && statusResponse.data?.accessToken) {
      // Step 2: Test API call with OAuth token
      console.log('2. Testing API call with OAuth token...');
      const token = statusResponse.data.accessToken;
      
      const apiResponse = await axios.get(`${BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      });
      
      console.log('API Response:', {
        status: apiResponse.status,
        success: apiResponse.status === 200,
        error: apiResponse.data?.error || 'none'
      });
      
      if (apiResponse.status === 200) {
        console.log('✅ OAuth token flow working correctly!');
      } else {
        console.log('❌ API call failed:', apiResponse.data);
      }
    } else {
      console.log('ℹ️  No active OAuth session found. Please log in first.');
    }
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⚠️  Rate limited. Please wait and try again.');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

if (require.main === module) {
  testOAuthFlow();
}

module.exports = { testOAuthFlow };