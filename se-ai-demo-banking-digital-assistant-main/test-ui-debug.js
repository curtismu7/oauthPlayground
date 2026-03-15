#!/usr/bin/env node

/**
 * Test script to verify UI debug version
 */

const http = require('http');

console.log('🧪 Testing Consumer Lending UI Debug Version...\n');

function makeRequest(port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET'
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

async function testUI() {
  console.log('1. Testing UI Server (port 3003)...');
  try {
    const response = await makeRequest(3003, '/');
    if (response.status === 200) {
      console.log('✅ UI Server: Responding');
      console.log(`   Status: ${response.status}`);
      console.log(`   Content size: ${response.data.length} bytes`);
      
      // Check for React error indicators
      const hasReactError = response.data.includes('Element type is invalid') || 
                           response.data.includes('React error');
      
      console.log(`   React errors: ${hasReactError ? '❌ Found' : '✅ None detected'}`);
      
      if (hasReactError) {
        console.log('   💡 Still has React component errors');
      } else {
        console.log('   🎉 Debug version appears to be working!');
      }
    } else {
      console.log(`❌ UI Server failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ UI Server error: ${error.message}`);
    console.log('💡 Make sure UI server is running: cd lending_api_ui && npm start');
  }
}

async function runTest() {
  console.log('🚀 Testing debug UI version...\n');
  
  await testUI();
  
  console.log('\n✨ Debug test completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. If debug version works, gradually add back components');
  console.log('   2. If still failing, check browser console for specific errors');
  console.log('   3. Visit http://localhost:3003 to see the result');
}

runTest();