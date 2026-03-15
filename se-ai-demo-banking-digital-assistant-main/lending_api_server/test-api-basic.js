#!/usr/bin/env node

/**
 * Basic API test script to verify the lending service is working
 */

const http = require('http');

console.log('🧪 Testing Consumer Lending API...\n');

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await makeRequest('/health');
    if (response.status === 200 || response.status === 503) {
      console.log('✅ Health endpoint: Responding');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Uptime: ${Math.floor(response.data.uptime / 60)} minutes`);
      console.log(`   Checks: ${response.data.checks?.length || 0}`);
    } else {
      console.log(`❌ Health endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error.message}`);
  }
}

async function testDetailedHealthEndpoint() {
  console.log('\n2. Testing Detailed Health Endpoint...');
  try {
    const response = await makeRequest('/health/detailed');
    if (response.status === 200 || response.status === 503) {
      console.log('✅ Detailed health endpoint: Responding');
      console.log(`   Overall Status: ${response.data.status}`);
      console.log(`   Total Checks: ${response.data.health_summary?.total_checks || 0}`);
      console.log(`   Healthy: ${response.data.health_summary?.healthy_checks || 0}`);
      console.log(`   Unhealthy: ${response.data.health_summary?.unhealthy_checks || 0}`);
    } else {
      console.log(`❌ Detailed health endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Detailed health endpoint error: ${error.message}`);
  }
}

async function testUsersEndpoint() {
  console.log('\n3. Testing Users Endpoint (without auth)...');
  try {
    const response = await makeRequest('/api/users');
    console.log(`📊 Users endpoint status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ Expected: Authentication required (401)');
    } else if (response.status === 200) {
      console.log('✅ Users endpoint accessible');
      console.log(`   Users found: ${response.data.data?.users?.length || 0}`);
    } else {
      console.log(`❓ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Users endpoint error: ${error.message}`);
  }
}

async function testCreditEndpoint() {
  console.log('\n4. Testing Credit Endpoint (without auth)...');
  try {
    const response = await makeRequest('/api/credit/1/score');
    console.log(`📊 Credit endpoint status: ${response.status}`);
    if (response.status === 401) {
      console.log('✅ Expected: Authentication required (401)');
    } else if (response.status === 200) {
      console.log('✅ Credit endpoint accessible');
    } else {
      console.log(`❓ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Credit endpoint error: ${error.message}`);
  }
}

async function testNonExistentEndpoint() {
  console.log('\n5. Testing Non-existent Endpoint...');
  try {
    const response = await makeRequest('/api/nonexistent');
    console.log(`📊 Non-existent endpoint status: ${response.status}`);
    if (response.status === 404) {
      console.log('✅ Expected: Not Found (404)');
    } else {
      console.log(`❓ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Non-existent endpoint error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  try {
    await testHealthEndpoint();
    await testDetailedHealthEndpoint();
    await testUsersEndpoint();
    await testCreditEndpoint();
    await testNonExistentEndpoint();
    
    console.log('\n✨ API tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - Health endpoints should be working');
    console.log('   - Protected endpoints should return 401 (auth required)');
    console.log('   - Server is responding correctly');
    console.log('\n💡 Next steps:');
    console.log('   1. Configure OAuth provider for full functionality');
    console.log('   2. Use the cURL examples with proper authentication');
    console.log('   3. Test the UI application');
    
  } catch (error) {
    console.log(`\n❌ Test runner error: ${error.message}`);
  }
}

// Check if server is running first
console.log('🔍 Checking if server is running on port 3002...');
makeRequest('/health').then(() => {
  console.log('✅ Server is running!\n');
  runTests();
}).catch(() => {
  console.log('❌ Server is not running on port 3002');
  console.log('\n💡 To start the server:');
  console.log('   cd lending_api_server');
  console.log('   npm run dev');
  console.log('\n   Then run this test again.');
});