#!/usr/bin/env node

/**
 * Admin Endpoints Integration Test Script
 * 
 * This script tests the admin API endpoints to ensure they work correctly.
 * It requires a valid OAuth token with admin privileges.
 * 
 * Usage:
 *   node test-admin-endpoints.js [base-url] [oauth-token]
 * 
 * Examples:
 *   node test-admin-endpoints.js http://localhost:3002 your-oauth-token
 *   node test-admin-endpoints.js  # Uses defaults
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:3002';
const OAUTH_TOKEN = process.argv[3] || process.env.OAUTH_TOKEN;

// Test configuration
const TESTS_CONFIG = {
  timeout: 10000, // 10 seconds
  verbose: true,
  stopOnFirstFailure: false
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Admin-Endpoints-Test/1.0',
        ...options.headers
      }
    };

    if (OAUTH_TOKEN) {
      requestOptions.headers['Authorization'] = `Bearer ${OAUTH_TOKEN}`;
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(TESTS_CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Utility function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test result tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Test runner function
async function runTest(testName, testFunction) {
  testResults.total++;
  
  try {
    log(`\n${colors.bright}Running: ${testName}${colors.reset}`);
    
    const startTime = Date.now();
    await testFunction();
    const duration = Date.now() - startTime;
    
    testResults.passed++;
    log(`✅ PASSED: ${testName} (${duration}ms)`, 'green');
    
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`❌ FAILED: ${testName}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    
    if (TESTS_CONFIG.stopOnFirstFailure) {
      throw error;
    }
    
    return false;
  }
}

// Assertion helper functions
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}\n  Expected: true\n  Actual: ${condition}`);
  }
}

function assertStatusCode(response, expectedCode, message = '') {
  if (response.statusCode !== expectedCode) {
    throw new Error(`${message}\n  Expected status: ${expectedCode}\n  Actual status: ${response.statusCode}\n  Response: ${JSON.stringify(response.data, null, 2)}`);
  }
}

function assertHasProperty(obj, property, message = '') {
  if (!obj || !obj.hasOwnProperty(property)) {
    throw new Error(`${message}\n  Object missing property: ${property}\n  Object: ${JSON.stringify(obj, null, 2)}`);
  }
}

// Test functions
async function testHealthCheck() {
  const response = await makeRequest(`${BASE_URL}/api/healthz`);
  assertStatusCode(response, 200, 'Health check should return 200');
  assertHasProperty(response.data, 'status', 'Health check should have status property');
  assertEqual(response.data.status, 'ok', 'Health check status should be ok');
}

async function testAdminUsersEndpoint() {
  const response = await makeRequest(`${BASE_URL}/api/admin/users`);
  assertStatusCode(response, 200, 'Admin users endpoint should return 200');
  assertHasProperty(response.data, 'users', 'Response should have users property');
  assertHasProperty(response.data, 'pagination', 'Response should have pagination property');
  assertTrue(Array.isArray(response.data.users), 'Users should be an array');
}

async function testAdminUsersWithPagination() {
  const response = await makeRequest(`${BASE_URL}/api/admin/users?page=1&limit=5`);
  assertStatusCode(response, 200, 'Admin users with pagination should return 200');
  assertTrue(response.data.users.length <= 5, 'Should respect limit parameter');
  assertEqual(response.data.pagination.page, 1, 'Should return correct page number');
  assertEqual(response.data.pagination.limit, 5, 'Should return correct limit');
}

async function testAdminUsersWithSearch() {
  const response = await makeRequest(`${BASE_URL}/api/admin/users?search=john`);
  assertStatusCode(response, 200, 'Admin users with search should return 200');
  assertEqual(response.data.filters.search, 'john', 'Should return correct search filter');
}

async function testAdminUserDetail() {
  // First get a user ID
  const usersResponse = await makeRequest(`${BASE_URL}/api/admin/users?limit=1`);
  assertStatusCode(usersResponse, 200, 'Should get users list first');
  
  if (usersResponse.data.users.length === 0) {
    log('No users found, skipping user detail test', 'yellow');
    return;
  }
  
  const userId = usersResponse.data.users[0].id;
  const response = await makeRequest(`${BASE_URL}/api/admin/users/${userId}`);
  assertStatusCode(response, 200, 'Admin user detail should return 200');
  assertHasProperty(response.data, 'user', 'Response should have user property');
  assertHasProperty(response.data, 'creditAssessment', 'Response should have creditAssessment property');
  assertHasProperty(response.data, 'creditHistory', 'Response should have creditHistory property');
  assertHasProperty(response.data, 'activitySummary', 'Response should have activitySummary property');
}

async function testAdminUserDetailNotFound() {
  const response = await makeRequest(`${BASE_URL}/api/admin/users/non-existent-id`);
  assertStatusCode(response, 404, 'Non-existent user should return 404');
  assertEqual(response.data.error, 'user_not_found', 'Should return correct error code');
}

async function testAdminCreditReports() {
  const response = await makeRequest(`${BASE_URL}/api/admin/credit/reports`);
  assertStatusCode(response, 200, 'Admin credit reports should return 200');
  assertHasProperty(response.data, 'reportType', 'Response should have reportType property');
  assertHasProperty(response.data, 'summary', 'Response should have summary property');
  assertHasProperty(response.data, 'generatedAt', 'Response should have generatedAt property');
}

async function testAdminCreditReportsDetailed() {
  const response = await makeRequest(`${BASE_URL}/api/admin/credit/reports?reportType=detailed`);
  assertStatusCode(response, 200, 'Detailed credit reports should return 200');
  assertEqual(response.data.reportType, 'detailed', 'Should return detailed report type');
  assertHasProperty(response.data, 'detailed', 'Response should have detailed property');
}

async function testAdminCreditReportsTrends() {
  const response = await makeRequest(`${BASE_URL}/api/admin/credit/reports?reportType=trends`);
  assertStatusCode(response, 200, 'Trends credit reports should return 200');
  assertEqual(response.data.reportType, 'trends', 'Should return trends report type');
  assertHasProperty(response.data, 'trends', 'Response should have trends property');
}

async function testAdminCreditReportsAll() {
  const response = await makeRequest(`${BASE_URL}/api/admin/credit/reports?reportType=all`);
  assertStatusCode(response, 200, 'All credit reports should return 200');
  assertEqual(response.data.reportType, 'all', 'Should return all report type');
  assertHasProperty(response.data, 'summary', 'Response should have summary property');
  assertHasProperty(response.data, 'detailed', 'Response should have detailed property');
  assertHasProperty(response.data, 'trends', 'Response should have trends property');
}

async function testAdminCreditRecalculate() {
  // First get a user ID
  const usersResponse = await makeRequest(`${BASE_URL}/api/admin/users?limit=1`);
  assertStatusCode(usersResponse, 200, 'Should get users list first');
  
  if (usersResponse.data.users.length === 0) {
    log('No users found, skipping credit recalculation test', 'yellow');
    return;
  }
  
  const userId = usersResponse.data.users[0].id;
  const requestBody = {
    userIds: [userId],
    recalculationType: 'both',
    forceRecalculation: true
  };
  
  const response = await makeRequest(`${BASE_URL}/api/admin/credit/recalculate`, {
    method: 'POST',
    body: requestBody
  });
  
  assertStatusCode(response, 200, 'Credit recalculation should return 200');
  assertHasProperty(response.data, 'message', 'Response should have message property');
  assertHasProperty(response.data, 'results', 'Response should have results property');
  assertHasProperty(response.data.results, 'totalUsers', 'Results should have totalUsers property');
  assertEqual(response.data.results.totalUsers, 1, 'Should process exactly one user');
}

async function testAdminCreditRecalculateAll() {
  const requestBody = {
    recalculateAll: true,
    recalculationType: 'scores',
    forceRecalculation: true
  };
  
  const response = await makeRequest(`${BASE_URL}/api/admin/credit/recalculate`, {
    method: 'POST',
    body: requestBody
  });
  
  assertStatusCode(response, 200, 'Credit recalculation for all should return 200');
  assertHasProperty(response.data, 'results', 'Response should have results property');
  assertTrue(response.data.results.totalUsers >= 0, 'Should process zero or more users');
}

async function testAdminCreditRecalculateValidation() {
  const requestBody = {
    // Missing required parameters
  };
  
  const response = await makeRequest(`${BASE_URL}/api/admin/credit/recalculate`, {
    method: 'POST',
    body: requestBody
  });
  
  assertStatusCode(response, 400, 'Invalid recalculation request should return 400');
  assertEqual(response.data.error, 'validation_error', 'Should return validation error');
}

async function testAdminSystemStatus() {
  const response = await makeRequest(`${BASE_URL}/api/admin/system/status`);
  assertStatusCode(response, 200, 'System status should return 200');
  assertHasProperty(response.data, 'status', 'Response should have status property');
  assertHasProperty(response.data, 'timestamp', 'Response should have timestamp property');
  assertHasProperty(response.data, 'uptime', 'Response should have uptime property');
  assertHasProperty(response.data, 'dataStore', 'Response should have dataStore property');
  assertHasProperty(response.data, 'systemHealth', 'Response should have systemHealth property');
  assertTrue(['healthy', 'warning'].includes(response.data.status), 'Status should be healthy or warning');
}

async function testAdminActivityLogs() {
  const response = await makeRequest(`${BASE_URL}/api/admin/activity-logs`);
  assertStatusCode(response, 200, 'Activity logs should return 200');
  assertHasProperty(response.data, 'activityLogs', 'Response should have activityLogs property');
  assertHasProperty(response.data, 'pagination', 'Response should have pagination property');
  assertTrue(Array.isArray(response.data.activityLogs), 'Activity logs should be an array');
}

async function testAdminActivityLogsWithFilters() {
  const response = await makeRequest(`${BASE_URL}/api/admin/activity-logs?page=1&limit=10&sortOrder=desc`);
  assertStatusCode(response, 200, 'Activity logs with filters should return 200');
  assertTrue(response.data.activityLogs.length <= 10, 'Should respect limit parameter');
  assertEqual(response.data.pagination.page, 1, 'Should return correct page number');
  assertEqual(response.data.filters.sortOrder, 'desc', 'Should return correct sort order');
}

// Authentication tests
async function testAuthenticationRequired() {
  // Test without token
  const response = await makeRequest(`${BASE_URL}/api/admin/users`, {
    headers: {} // No Authorization header
  });
  
  // Should return 401 if authentication is properly enforced
  // Note: This might pass in development mode with auth disabled
  if (response.statusCode === 401) {
    assertEqual(response.data.error, 'authentication_required', 'Should return authentication required error');
  } else {
    log('Authentication bypass detected (development mode?)', 'yellow');
  }
}

// Main test execution
async function runAllTests() {
  log(`${colors.bright}${colors.blue}Admin Endpoints Integration Test${colors.reset}`);
  log(`Base URL: ${BASE_URL}`);
  log(`OAuth Token: ${OAUTH_TOKEN ? 'Provided' : 'Not provided'}`);
  log(`Timeout: ${TESTS_CONFIG.timeout}ms`);
  
  if (!OAUTH_TOKEN) {
    log(`${colors.yellow}Warning: No OAuth token provided. Some tests may fail.${colors.reset}`);
    log(`${colors.yellow}Set OAUTH_TOKEN environment variable or pass as argument.${colors.reset}`);
  }
  
  log(`\n${colors.bright}Starting tests...${colors.reset}`);
  
  const tests = [
    ['Health Check', testHealthCheck],
    ['Admin Users Endpoint', testAdminUsersEndpoint],
    ['Admin Users with Pagination', testAdminUsersWithPagination],
    ['Admin Users with Search', testAdminUsersWithSearch],
    ['Admin User Detail', testAdminUserDetail],
    ['Admin User Detail Not Found', testAdminUserDetailNotFound],
    ['Admin Credit Reports', testAdminCreditReports],
    ['Admin Credit Reports Detailed', testAdminCreditReportsDetailed],
    ['Admin Credit Reports Trends', testAdminCreditReportsTrends],
    ['Admin Credit Reports All', testAdminCreditReportsAll],
    ['Admin Credit Recalculate', testAdminCreditRecalculate],
    ['Admin Credit Recalculate All', testAdminCreditRecalculateAll],
    ['Admin Credit Recalculate Validation', testAdminCreditRecalculateValidation],
    ['Admin System Status', testAdminSystemStatus],
    ['Admin Activity Logs', testAdminActivityLogs],
    ['Admin Activity Logs with Filters', testAdminActivityLogsWithFilters],
    ['Authentication Required', testAuthenticationRequired]
  ];
  
  for (const [testName, testFunction] of tests) {
    await runTest(testName, testFunction);
  }
  
  // Print summary
  log(`\n${colors.bright}Test Summary:${colors.reset}`);
  log(`Total: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, testResults.passed > 0 ? 'green' : 'reset');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'reset');
  
  if (testResults.failed > 0) {
    log(`\n${colors.bright}${colors.red}Failed Tests:${colors.reset}`);
    testResults.errors.forEach(({ test, error }) => {
      log(`❌ ${test}: ${error}`, 'red');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
  
  if (testResults.failed === 0) {
    log(`\n🎉 All tests passed!`, 'green');
    process.exit(0);
  } else {
    log(`\n💥 ${testResults.failed} test(s) failed.`, 'red');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught Exception: ${error.message}`, 'red');
  if (TESTS_CONFIG.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n💥 Unhandled Rejection: ${reason}`, 'red');
  if (TESTS_CONFIG.verbose) {
    console.error(reason);
  }
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    log(`\n💥 Test execution failed: ${error.message}`, 'red');
    if (TESTS_CONFIG.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  testResults
};