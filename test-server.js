#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 Starting MPC Server Test...\n');

// Start the server
const server = spawn('node', ['src/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

let serverOutput = '';
let serverError = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log('📡 Server Output:', data.toString().trim());
});

server.stderr.on('data', (data) => {
  serverError += data.toString();
  console.error('❌ Server Error:', data.toString().trim());
});

server.on('close', (code) => {
  console.log(`\n🔚 Server process exited with code ${code}`);
  if (serverError) {
    console.log('\n📋 Error Details:');
    console.log(serverError);
  }
});

// Wait for server to start
console.log('⏳ Waiting for server to start...');
await setTimeout(3000);

// Test the health endpoint
console.log('\n🧪 Testing health endpoint...');
try {
  const response = await fetch('http://localhost:3001/health');
  const data = await response.json();
  console.log('✅ Health check successful:', data);
} catch (error) {
  console.error('❌ Health check failed:', error.message);
}

// Test the root endpoint
console.log('\n🧪 Testing root endpoint...');
try {
  const response = await fetch('http://localhost:3001/');
  const data = await response.json();
  console.log('✅ Root endpoint successful:', data);
} catch (error) {
  console.error('❌ Root endpoint failed:', error.message);
}

// Test MPC computation
console.log('\n🧪 Testing MPC computation...');
try {
  const response = await fetch('http://localhost:3001/api/mpc/compute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      computationId: 'test-computation',
      participants: ['participant1', 'participant2'],
      operation: 'add',
      inputs: [10, 20, 30]
    })
  });
  const data = await response.json();
  console.log('✅ MPC computation successful:', data);
} catch (error) {
  console.error('❌ MPC computation failed:', error.message);
}

console.log('\n🎉 Test completed!');

// Kill the server
server.kill();




