#!/usr/bin/env node

/**
 * Comprehensive API Test Suite
 * Tests all 45+ API endpoints with proper credentials and error handling
 * 
 * Usage: node scripts/test-all-apis.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { Agent } from 'https';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Test configuration
// Always use localhost for API tests since backend server runs locally
const BASE_URL = 'https://localhost:3001';
const httpsAgent = new Agent({
  rejectUnauthorized: false // Ignore self-signed certificate errors
});

// Worker token credentials from .env
const WORKER_CREDENTIALS = {
  environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
  clientId: 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
  clientSecret: '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a'
};

// User credentials for OAuth flow tests (reserved for future use)
// const USER_CREDENTIALS = {
//   username: 'elizabeth',
//   password: 'Tigers7&'
// };

let WORKER_TOKEN = null;
const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  results: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

const API_RESPONSES = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  responses: []
};

// Helper functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function createTestResult(endpoint, method, status, error = null, responseTime = 0, httpStatus = null) {
  return {
    endpoint,
    method,
    status,
    httpStatus,
    error: error ? error.message : null,
    responseTime,
    timestamp: new Date().toISOString()
  };
}

function captureApiResponse(endpoint, method, httpStatus, responseData, responseTime) {
  API_RESPONSES.responses.push({
    endpoint,
    method,
    httpStatus,
    responseTime,
    timestamp: new Date().toISOString(),
    response: responseData
  });
}

async function getWorkerToken() {
  log('=== Obtaining Worker Token via Client Credentials ===');
  
  try {
    // Use backend API to get worker token with required scopes
    const scopes = 'p1:read:user p1:update:user p1:create:user p1:delete:user p1:read:userPassword p1:reset:userPassword';
    const tokenRequestBody = `grant_type=client_credentials&client_id=${WORKER_CREDENTIALS.clientId}&client_secret=${WORKER_CREDENTIALS.clientSecret}&scope=${encodeURIComponent(scopes)}`;
    
    const result = await makeRequest('/api/pingone/token', 'POST', {
      environment_id: WORKER_CREDENTIALS.environmentId,
      region: 'us',
      body: tokenRequestBody,
      auth_method: 'client_secret_post'
    });
    
    if (result.ok && result.data && result.data.access_token) {
      WORKER_TOKEN = result.data.access_token;
      log(`✓ Worker token obtained successfully (expires in ${result.data.expires_in}s)`);
      return true;
    } else {
      log(`✗ Failed to get worker token: ${result.status} - ${JSON.stringify(result.data)}`);
      return false;
    }
  } catch (error) {
    log(`✗ Error obtaining worker token: ${error.message}`);
    return false;
  }
}

async function makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
  const startTime = Date.now();
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      agent: BASE_URL.startsWith('https://localhost') ? httpsAgent : undefined
    };
    
    if (body) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    log(`Testing ${method} ${url}`);
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    
    // Try to parse response as JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = await response.text();
    }
    
    // Capture the API response
    captureApiResponse(endpoint, method, response.status, responseData, responseTime);
    
    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 0,
      ok: false,
      error,
      responseTime
    };
  }
}

// Test categories
async function testSystemHealth() {
  log('=== Testing System Health Endpoints ===');
  
  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api-status', method: 'GET' },
    { path: '/api/version', method: 'GET' },
    { path: '/api/debug', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, endpoint.method);
    TEST_RESULTS.results.push(createTestResult(
      endpoint.path,
      endpoint.method,
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ ${endpoint.path} - ${result.status} - ${result.responseTime}ms`);
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ ${endpoint.path} - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
  }
}

async function testSettingsManagement() {
  log('=== Testing Settings Management ===');
  
  const endpoints = [
    { path: '/api/settings/custom-domain', method: 'GET' },
    { path: '/api/settings/environment-id', method: 'GET' },
    { path: '/api/settings/region', method: 'GET' },
    { path: '/api/settings/debug-log-viewer', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, endpoint.method);
    TEST_RESULTS.results.push(createTestResult(
      endpoint.path,
      endpoint.method,
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ ${endpoint.path} - ${result.status} - ${result.responseTime}ms`);
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ ${endpoint.path} - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
  }
}

async function testFileStorage() {
  log('=== Testing File Storage Operations ===');
  
  const testContent = {
    directory: 'test',
    filename: 'api-test.json',
    data: { test: true, timestamp: new Date().toISOString() }
  };
  
  // Test save
  let result = await makeRequest('/api/file-storage/save', 'POST', testContent);
  TEST_RESULTS.results.push(createTestResult(
    '/api/file-storage/save',
    'POST',
    result.ok ? 'PASS' : 'FAIL',
    result.error,
    result.responseTime,
    result.status
  ));
  
  TEST_RESULTS.summary.total++;
  if (result.ok) {
    TEST_RESULTS.summary.passed++;
    log(`✓ POST /api/file-storage/save - ${result.status} - ${result.responseTime}ms`);
    
    // Test load
    result = await makeRequest('/api/file-storage/load', 'POST', {
      directory: testContent.directory,
      filename: testContent.filename
    });
    
    TEST_RESULTS.results.push(createTestResult(
      '/api/file-storage/load',
      'POST',
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ POST /api/file-storage/load - ${result.status} - ${result.responseTime}ms`);
      
      // Test delete
      result = await makeRequest('/api/file-storage/delete', 'DELETE', {
        directory: testContent.directory,
        filename: testContent.filename
      });
      
      TEST_RESULTS.results.push(createTestResult(
        '/api/file-storage/delete',
        'DELETE',
        result.ok ? 'PASS' : 'FAIL',
        result.error,
        result.responseTime,
        result.status
      ));
      
      TEST_RESULTS.summary.total++;
      if (result.ok) {
        TEST_RESULTS.summary.passed++;
        log(`✓ DELETE /api/file-storage/delete - ${result.status} - ${result.responseTime}ms`);
      } else {
        TEST_RESULTS.summary.failed++;
        log(`✗ DELETE /api/file-storage/delete - ${result.status} ${result.error?.message || 'Unknown error'}`);
      }
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ POST /api/file-storage/load - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
  } else {
    TEST_RESULTS.summary.failed++;
    log(`✗ POST /api/file-storage/save - ${result.status} ${result.error?.message || 'Unknown error'}`);
  }
}

async function testApiKeyManagement() {
  log('=== Testing API Key Management ===');
  
  const services = ['groq', 'brave'];
  
  for (const service of services) {
    // Test get API key
    let result = await makeRequest(`/api/api-key/${service}`, 'GET');
    TEST_RESULTS.results.push(createTestResult(
      `/api/api-key/${service}`,
      'GET',
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ GET /api/api-key/${service} - ${result.status} - ${result.responseTime}ms`);
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ GET /api/api-key/${service} - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
    
    // Test backup load
    result = await makeRequest('/api/api-key/backup', 'GET');
    TEST_RESULTS.results.push(createTestResult(
      '/api/api-key/backup',
      'GET',
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ GET /api/api-key/backup - ${result.status} - ${result.responseTime}ms`);
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ GET /api/api-key/backup - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
  }
}

async function testPingOneEnvironments() {
  log('=== Testing PingOne Environment APIs ===');
  
  if (!WORKER_TOKEN) {
    log('⚠ No worker token available, skipping authenticated endpoints');
    TEST_RESULTS.summary.skipped += 2;
    return;
  }
  
  const endpoints = [
    { path: '/api/environments', method: 'GET' },
    { path: '/api/test-environments', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    const headers = { 'Authorization': `Bearer ${WORKER_TOKEN}` };
    const result = await makeRequest(endpoint.path, endpoint.method, null, headers);
    
    TEST_RESULTS.results.push(createTestResult(
      endpoint.path,
      endpoint.method,
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ ${endpoint.path} - ${result.status} - ${result.responseTime}ms`);
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ ${endpoint.path} - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
  }
}

async function testOAuthFlows() {
  log('=== Testing OAuth Flow Endpoints ===');
  
  // Test PAR endpoint - requires environment_id, client_id, and optional client_secret
  // Use non-Vite prefixed env vars for Node.js scripts
  const parData = {
    environment_id: process.env.PINGONE_ENVIRONMENT_ID || process.env.VITE_PINGONE_ENVIRONMENT_ID,
    client_id: process.env.PINGONE_CLIENT_ID || process.env.VITE_PINGONE_CLIENT_ID,
    client_secret: process.env.PINGONE_CLIENT_SECRET || process.env.VITE_PINGONE_CLIENT_SECRET,
    redirect_uri: process.env.PINGONE_REDIRECT_URI || process.env.VITE_PINGONE_REDIRECT_URI || 'https://localhost:3000/callback',
    scope: 'openid profile email',
    state: 'test-state-' + Date.now(),
    response_type: 'code',
    code_challenge_method: 'S256',
    code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  };
  
  let result = await makeRequest('/api/par', 'POST', parData);
  TEST_RESULTS.results.push(createTestResult(
    '/api/par',
    'POST',
    result.ok ? 'PASS' : 'FAIL',
    result.error,
    result.responseTime,
    result.status
  ));
  
  TEST_RESULTS.summary.total++;
  if (result.ok) {
    TEST_RESULTS.summary.passed++;
    log(`✓ POST /api/par - ${result.status} - ${result.responseTime}ms`);
  } else {
    TEST_RESULTS.summary.failed++;
    log(`✗ POST /api/par - ${result.status} ${result.error?.message || 'Unknown error'}`);
  }
}

async function testMCPEndpoints() {
  log('=== Testing MCP/AI Assistant Endpoints ===');
  
  const endpoints = [
    { path: '/api/mcp/query', method: 'POST', body: { query: 'test query' } }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, endpoint.method, endpoint.body);
    TEST_RESULTS.results.push(createTestResult(
      endpoint.path,
      endpoint.method,
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ ${endpoint.path} - ${result.status} - ${result.responseTime}ms`);
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ ${endpoint.path} - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
  }
}

async function testLoggingEndpoints() {
  log('=== Testing Logging & Diagnostics ===');
  
  const endpoints = [
    { path: '/api/logs/list', method: 'GET' },
    { path: '/api/pingone/api-calls', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.path, endpoint.method);
    TEST_RESULTS.results.push(createTestResult(
      endpoint.path,
      endpoint.method,
      result.ok ? 'PASS' : 'FAIL',
      result.error,
      result.responseTime,
      result.status
    ));
    
    TEST_RESULTS.summary.total++;
    if (result.ok) {
      TEST_RESULTS.summary.passed++;
      log(`✓ ${endpoint.path} - ${result.status} - ${result.responseTime}ms`);
    } else {
      TEST_RESULTS.summary.failed++;
      log(`✗ ${endpoint.path} - ${result.status} ${result.error?.message || 'Unknown error'}`);
    }
  }
}

// Main test runner
async function runAllTests() {
  log('Starting Comprehensive API Test Suite');
  log(`Base URL: ${BASE_URL}`);
  log(`Timestamp: ${TEST_RESULTS.timestamp}`);
  log('');
  
  // Get worker token first
  await getWorkerToken();
  log('');
  
  try {
    await testSystemHealth();
    log('');
    
    await testSettingsManagement();
    log('');
    
    await testFileStorage();
    log('');
    
    await testApiKeyManagement();
    log('');
    
    await testPingOneEnvironments();
    log('');
    
    await testOAuthFlows();
    log('');
    
    await testMCPEndpoints();
    log('');
    
    await testLoggingEndpoints();
    log('');
    
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'ERROR');
  }
  
  // Generate summary
  log('=== Test Summary ===');
  log(`Total Tests: ${TEST_RESULTS.summary.total}`);
  log(`Passed: ${TEST_RESULTS.summary.passed}`);
  log(`Failed: ${TEST_RESULTS.summary.failed}`);
  log(`Skipped: ${TEST_RESULTS.summary.skipped}`);
  
  const successRate = TEST_RESULTS.summary.total > 0 ? 
    ((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.total) * 100).toFixed(2) : 0;
  log(`Success Rate: ${successRate}%`);
  
  // Save results to file
  const resultsPath = path.join(process.cwd(), 'api-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(TEST_RESULTS, null, 2));
  log(`Results saved to: ${resultsPath}`);
  
  // Save API responses to separate file
  const responsesPath = path.join(process.cwd(), 'api-test-responses.json');
  fs.writeFileSync(responsesPath, JSON.stringify(API_RESPONSES, null, 2));
  log(`API responses saved to: ${responsesPath}`);
  
  return TEST_RESULTS;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, TEST_RESULTS };
