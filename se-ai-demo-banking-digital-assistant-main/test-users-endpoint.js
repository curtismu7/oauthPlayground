#!/usr/bin/env node

/**
 * Test script to check if users endpoint is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testUsersEndpoint() {
  console.log('Testing users endpoint...');
  
  try {
    // First check OAuth status to get token
    console.log('1. Getting OAuth token...');
    const statusResponse = await axios.get(`${BASE_URL}/api/auth/oauth/status`, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    if (!statusResponse.data?.authenticated || !statusResponse.data?.accessToken) {
      console.log('❌ No active OAuth session. Please log in first.');
      return;
    }
    
    const token = statusResponse.data.accessToken;
    console.log('✅ Got OAuth token');
    
    // Test users endpoint
    console.log('2. Testing /api/users endpoint...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      validateStatus: () => true
    });
    
    console.log('Users Response:', {
      status: usersResponse.status,
      hasData: !!usersResponse.data,
      dataType: typeof usersResponse.data,
      dataKeys: usersResponse.data ? Object.keys(usersResponse.data) : [],
      usersCount: usersResponse.data?.users?.length || 0
    });
    
    if (usersResponse.status === 200) {
      console.log('✅ Users endpoint working');
      if (usersResponse.data.users && usersResponse.data.users.length > 0) {
        console.log(`📊 Found ${usersResponse.data.users.length} users`);
        console.log('Sample user:', {
          id: usersResponse.data.users[0].id,
          name: `${usersResponse.data.users[0].firstName} ${usersResponse.data.users[0].lastName}`,
          email: usersResponse.data.users[0].email
        });
      } else {
        console.log('⚠️  No users found in response');
      }
    } else {
      console.log('❌ Users endpoint failed:', usersResponse.data);
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
  testUsersEndpoint();
}

module.exports = { testUsersEndpoint };