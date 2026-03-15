#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Lending API Server
 * 
 * This script runs all test suites in the correct order and generates
 * comprehensive coverage reports for the lending API server.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Test configuration
const testConfig = {
  timeout: 60000, // 60 seconds per test suite
  coverage: true,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};

// Test suites in execution order
const testSuites = [
  {
    name: 'Unit Tests - Business Logic',
    file: 'business-logic.test.js',
    description: 'Credit calculation algorithms and validation logic',
    category: 'unit'
  },
  {
    name: 'Unit Tests - Credit Services',
    file: 'credit-service.test.js',
    description: 'Credit scoring service unit tests',
    category: 'unit'
  },
  {
    name: 'Unit Tests - Credit Limit Services',
    file: 'credit-limit-service.test.js',
    description: 'Credit limit calculation service unit tests',
    category: 'unit'
  },
  {
    name: 'Integration Tests - OAuth Authentication',
    file: 'oauth-authentication.test.js',
    description: 'OAuth token validation and authentication flows',
    category: 'integration'
  },
  {
    name: 'Integration Tests - API Endpoints with Scope Validation',
    file: 'api-endpoints-scope-validation.test.js',
    description: 'API endpoint access control and scope validation',
    category: 'integration'
  },
  {
    name: 'Integration Tests - User Management',
    file: 'users.test.js',
    description: 'User management API endpoints',
    category: 'integration'
  },
  {
    name: 'Integration Tests - Credit Operations',
    file: 'credit-integration.test.js',
    description: 'Credit scoring and limit calculation integration',
    category: 'integration'
  },
  {
    name: 'Integration Tests - Admin Operations',
    file: 'admin-routes.test.js',
    description: 'Administrative API endpoints',
    category: 'integration'
  },
  {
    name: 'Error Handling and Edge Cases',
    file: 'error-handling-edge-cases.test.js',
    description: 'Comprehensive error handling and edge case scenarios',
    category: 'edge-cases'
  },
  {
    name: 'End-to-End Workflow Tests',
    file: 'integration-workflows.test.js',
    description: 'Complete business workflow integration tests',
    category: 'e2e'
  }
];

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  const border = '='.repeat(message.length + 4);
  log(border, 'cyan');
  log(`  ${message}  `, 'cyan');
  log(border, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(50)}`, 'blue');
  log(message, 'blue');
  log('-'.repeat(50), 'blue');
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function checkTestFile(filename) {
  const testPath = path.join(__dirname, filename);
  return fs.existsSync(testPath);
}

function runTestSuite(suite) {
  const startTime = Date.now();
  
  try {
    log(`\nRunning: ${suite.name}`, 'yellow');
    log(`Description: ${suite.description}`, 'reset');
    
    if (!checkTestFile(suite.file)) {
      log(`❌ Test file not found: ${suite.file}`, 'red');
      return { success: false, duration: 0, error: 'File not found' };
    }

    // Build Jest command
    const jestArgs = [
      `--testPathPattern=${suite.file}`,
      '--verbose',
      '--forceExit',
      '--detectOpenHandles',
      `--testTimeout=${testConfig.timeout}`
    ];

    if (testConfig.coverage) {
      jestArgs.push('--coverage');
      jestArgs.push('--coverageDirectory=coverage-comprehensive');
    }

    const command = `npx jest ${jestArgs.join(' ')}`;
    
    log(`Command: ${command}`, 'reset');
    
    // Execute test
    execSync(command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..'),
      timeout: testConfig.timeout + 10000 // Add buffer
    });

    const duration = Date.now() - startTime;
    log(`✅ ${suite.name} completed successfully in ${formatDuration(duration)}`, 'green');
    
    return { success: true, duration, error: null };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ ${suite.name} failed after ${formatDuration(duration)}`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    return { success: false, duration, error: error.message };
  }
}

function generateSummaryReport(results) {
  logSection('TEST EXECUTION SUMMARY');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  log(`Total Test Suites: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  log(`Total Duration: ${formatDuration(totalDuration)}`, 'bright');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
      passedTests === totalTests ? 'green' : 'yellow');

  // Category breakdown
  const categories = {};
  results.forEach((result, index) => {
    const suite = testSuites[index];
    if (!categories[suite.category]) {
      categories[suite.category] = { total: 0, passed: 0 };
    }
    categories[suite.category].total++;
    if (result.success) categories[suite.category].passed++;
  });

  log('\nResults by Category:', 'bright');
  Object.entries(categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(1);
    log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`, 
        stats.passed === stats.total ? 'green' : 'yellow');
  });

  // Failed tests details
  if (failedTests > 0) {
    log('\nFailed Test Suites:', 'red');
    results.forEach((result, index) => {
      if (!result.success) {
        const suite = testSuites[index];
        log(`  ❌ ${suite.name}`, 'red');
        log(`     Error: ${result.error}`, 'red');
      }
    });
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    totalDuration,
    successRate: (passedTests / totalTests) * 100
  };
}

function checkPrerequisites() {
  logSection('CHECKING PREREQUISITES');
  
  try {
    // Check if Jest is available
    execSync('npx jest --version', { stdio: 'pipe' });
    log('✅ Jest is available', 'green');
    
    // Check if test setup file exists
    const setupPath = path.join(__dirname, 'setup.js');
    if (fs.existsSync(setupPath)) {
      log('✅ Test setup file found', 'green');
    } else {
      log('⚠️  Test setup file not found', 'yellow');
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'P1AIC_TENANT_NAME',
      'P1AIC_CLIENT_ID',
      'SESSION_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length === 0) {
      log('✅ All required environment variables are set', 'green');
    } else {
      log(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`, 'yellow');
      log('   Tests will use default values from setup.js', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Prerequisites check failed: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  logHeader('COMPREHENSIVE LENDING API SERVER TEST SUITE');
  
  log('This test runner executes all test suites for the lending API server', 'reset');
  log('including unit tests, integration tests, and end-to-end workflows.\n', 'reset');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  logSection('EXECUTING TEST SUITES');
  
  const results = [];
  const startTime = Date.now();
  
  // Run each test suite
  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    log(`\n[${i + 1}/${testSuites.length}] ${suite.category.toUpperCase()}`, 'magenta');
    
    const result = runTestSuite(suite);
    results.push(result);
    
    // Stop on first failure if not in CI mode
    if (!result.success && !process.env.CI) {
      log('\n⚠️  Stopping execution due to test failure (use CI=true to continue)', 'yellow');
      break;
    }
  }
  
  const totalExecutionTime = Date.now() - startTime;
  
  // Generate summary report
  const summary = generateSummaryReport(results);
  
  logSection('COVERAGE INFORMATION');
  if (testConfig.coverage) {
    log('Coverage reports have been generated in:', 'bright');
    log('  - coverage-comprehensive/ (HTML report)', 'reset');
    log('  - coverage-comprehensive/lcov.info (LCOV format)', 'reset');
    log('\nTo view the HTML coverage report:', 'bright');
    log('  open coverage-comprehensive/index.html', 'cyan');
  } else {
    log('Coverage collection was disabled', 'yellow');
  }
  
  logSection('RECOMMENDATIONS');
  
  if (summary.successRate === 100) {
    log('🎉 All tests passed! The lending API server is ready for deployment.', 'green');
  } else if (summary.successRate >= 90) {
    log('✅ Most tests passed. Review failed tests before deployment.', 'yellow');
  } else if (summary.successRate >= 70) {
    log('⚠️  Some tests failed. Significant issues need to be addressed.', 'yellow');
  } else {
    log('❌ Many tests failed. Major issues need to be resolved.', 'red');
  }
  
  log('\nNext steps:', 'bright');
  log('1. Review test results and fix any failing tests', 'reset');
  log('2. Check coverage report for untested code paths', 'reset');
  log('3. Run specific test suites for focused debugging:', 'reset');
  log('   npm test -- --testPathPattern=<test-file>', 'cyan');
  log('4. Run integration tests separately:', 'reset');
  log('   npm run test:integration', 'cyan');
  
  logHeader(`EXECUTION COMPLETED IN ${formatDuration(totalExecutionTime)}`);
  
  // Exit with appropriate code
  process.exit(summary.failedTests === 0 ? 0 : 1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught Exception: ${error.message}`, 'red');
  log(error.stack, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled Rejection at: ${promise}`, 'red');
  log(`Reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  testSuites,
  generateSummaryReport
};