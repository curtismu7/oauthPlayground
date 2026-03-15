#!/usr/bin/env node

/**
 * E2E Test Runner
 * Orchestrates the execution of all end-to-end tests
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { setupE2ETests, cleanupE2ETests, validateTestEnvironment } = require('./setup');

class E2ETestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      suites: []
    };
    this.startTime = null;
  }

  /**
   * Run all E2E tests
   */
  async runAllTests() {
    console.log('🚀 Starting E2E Test Suite');
    console.log('=' .repeat(50));
    
    this.startTime = Date.now();
    
    try {
      // Setup test environment
      await this.setupEnvironment();
      
      // Validate environment
      await this.validateEnvironment();
      
      // Run test suites
      await this.runTestSuites();
      
      // Generate reports
      await this.generateReports();
      
      // Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ E2E Test Suite Failed:', error.message);
      process.exit(1);
    } finally {
      // Cleanup
      await this.cleanupEnvironment();
    }
  }

  /**
   * Setup test environment
   */
  async setupEnvironment() {
    console.log('📋 Setting up test environment...');
    
    try {
      await setupE2ETests();
      console.log('✅ Test environment setup completed');
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error.message);
      throw error;
    }
  }

  /**
   * Validate test environment
   */
  async validateEnvironment() {
    console.log('🔍 Validating test environment...');
    
    try {
      await validateTestEnvironment();
      console.log('✅ Test environment validation passed');
    } catch (error) {
      console.error('❌ Test environment validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Run all test suites
   */
  async runTestSuites() {
    const testSuites = [
      {
        name: 'User Workflows',
        file: 'user-workflows.test.js',
        timeout: 60000
      },
      {
        name: 'Cross-Service Communication',
        file: 'cross-service-communication.test.js',
        timeout: 90000
      },
      {
        name: 'Performance and Load',
        file: 'performance-load.test.js',
        timeout: 120000
      }
    ];

    console.log('🧪 Running test suites...');
    
    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suite) {
    console.log(`\n📝 Running ${suite.name}...`);
    
    const suiteStartTime = Date.now();
    
    try {
      const result = await this.executeJestTest(suite.file, suite.timeout);
      
      const suiteResult = {
        name: suite.name,
        file: suite.file,
        duration: Date.now() - suiteStartTime,
        passed: result.success,
        tests: result.tests || 0,
        failures: result.failures || 0,
        output: result.output
      };

      this.testResults.suites.push(suiteResult);
      this.testResults.total += suiteResult.tests;
      this.testResults.passed += (suiteResult.tests - suiteResult.failures);
      this.testResults.failed += suiteResult.failures;

      if (result.success) {
        console.log(`✅ ${suite.name} completed successfully`);
      } else {
        console.log(`❌ ${suite.name} failed`);
      }
      
    } catch (error) {
      console.error(`❌ ${suite.name} encountered an error:`, error.message);
      
      const suiteResult = {
        name: suite.name,
        file: suite.file,
        duration: Date.now() - suiteStartTime,
        passed: false,
        tests: 0,
        failures: 1,
        error: error.message
      };

      this.testResults.suites.push(suiteResult);
      this.testResults.failed += 1;
    }
  }

  /**
   * Execute Jest test file
   */
  async executeJestTest(testFile, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const testPath = path.join(__dirname, testFile);
      
      const jestProcess = spawn('npx', ['jest', testPath, '--verbose', '--forceExit'], {
        cwd: path.join(__dirname, '../../../'),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout
      });

      let output = '';
      let errorOutput = '';

      jestProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      jestProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      jestProcess.on('close', (code) => {
        const result = {
          success: code === 0,
          output: output + errorOutput,
          tests: this.extractTestCount(output),
          failures: this.extractFailureCount(output)
        };

        resolve(result);
      });

      jestProcess.on('error', (error) => {
        reject(new Error(`Failed to execute test: ${error.message}`));
      });

      // Handle timeout
      setTimeout(() => {
        jestProcess.kill('SIGTERM');
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Extract test count from Jest output
   */
  extractTestCount(output) {
    const match = output.match(/Tests:\s+(\d+)\s+passed/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Extract failure count from Jest output
   */
  extractFailureCount(output) {
    const match = output.match(/(\d+)\s+failed/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Generate test reports
   */
  async generateReports() {
    console.log('\n📊 Generating test reports...');
    
    try {
      // Generate JSON report
      await this.generateJSONReport();
      
      // Generate HTML report
      await this.generateHTMLReport();
      
      console.log('✅ Test reports generated');
    } catch (error) {
      console.error('❌ Failed to generate reports:', error.message);
    }
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport() {
    const reportPath = path.join(__dirname, '../../../reports/e2e-results.json');
    
    // Ensure reports directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    const report = {
      ...this.testResults,
      duration: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport() {
    const reportPath = path.join(__dirname, '../../../reports/e2e-report.html');
    
    const html = this.generateHTMLContent();
    await fs.writeFile(reportPath, html);
  }

  /**
   * Generate HTML report content
   */
  generateHTMLContent() {
    const duration = Date.now() - this.startTime;
    const successRate = this.testResults.total > 0 ? 
      ((this.testResults.passed / this.testResults.total) * 100).toFixed(1) : 0;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .duration { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E2E Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Duration: ${(duration / 1000).toFixed(2)}s</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <p>${this.testResults.total}</p>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <p class="passed">${this.testResults.passed}</p>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <p class="failed">${this.testResults.failed}</p>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <p>${successRate}%</p>
        </div>
    </div>

    <h2>Test Suites</h2>
    ${this.testResults.suites.map(suite => `
        <div class="suite">
            <h3 class="${suite.passed ? 'passed' : 'failed'}">${suite.name}</h3>
            <p>File: ${suite.file}</p>
            <p>Duration: <span class="duration">${(suite.duration / 1000).toFixed(2)}s</span></p>
            <p>Tests: ${suite.tests}, Failures: ${suite.failures}</p>
            ${suite.error ? `<p class="failed">Error: ${suite.error}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Display test summary
   */
  displaySummary() {
    const duration = Date.now() - this.startTime;
    const successRate = this.testResults.total > 0 ? 
      ((this.testResults.passed / this.testResults.total) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(50));
    console.log('📊 E2E Test Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Some tests failed. Check the detailed output above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanupEnvironment() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      await cleanupE2ETests();
      console.log('✅ Test environment cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test environment:', error.message);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = E2ETestRunner;