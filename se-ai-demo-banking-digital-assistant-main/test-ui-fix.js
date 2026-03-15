#!/usr/bin/env node

/**
 * Test script to verify UI fixes
 */

const http = require('http');

console.log('🧪 Testing Consumer Lending UI Fix...\n');

// Helper function to make HTTP requests
function makeRequest(port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'text/html'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testUIServer() {
  console.log('1. Testing UI Server (port 3003)...');
  try {
    const response = await makeRequest(3003, '/');
    if (response.status === 200) {
      console.log('✅ UI Server: Responding');
      console.log(`   Status: ${response.status}`);
      console.log(`   Content includes React: ${response.data.includes('React') ? 'Yes' : 'No'}`);
      console.log(`   Content size: ${response.data.length} bytes`);
    } else {
      console.log(`❌ UI Server failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ UI Server error: ${error.message}`);
    console.log('💡 Make sure to start the UI server:');
    console.log('   cd lending_api_ui && npm start');
  }
}

async function testAPIServer() {
  console.log('\n2. Testing API Server (port 3002)...');
  try {
    const response = await makeRequest(3002, '/health');
    if (response.status === 200 || response.status === 503) {
      console.log('✅ API Server: Responding');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log(`❌ API Server failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ API Server error: ${error.message}`);
    console.log('💡 Make sure to start the API server:');
    console.log('   cd lending_api_server && npm run dev');
  }
}

async function runTests() {
  console.log('🚀 Starting UI fix verification...\n');
  
  await testAPIServer();
  await testUIServer();
  
  console.log('\n✨ UI fix test completed!');
  console.log('\n📝 Summary:');
  console.log('   - Replaced complex App.js with simple version');
  console.log('   - Simple version shows API status and login button');
  console.log('   - No complex component dependencies');
  console.log('\n💡 Next steps:');
  console.log('   1. Start both servers if not running');
  console.log('   2. Visit http://localhost:3003 to see the simple UI');
  console.log('   3. Check API connection status in the UI');
  console.log('   4. Test OAuth login flow');
}

runTests();