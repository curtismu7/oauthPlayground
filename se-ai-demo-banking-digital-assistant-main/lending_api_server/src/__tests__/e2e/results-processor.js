/**
 * E2E Test Results Processor
 * Processes and formats test results
 */

const fs = require('fs').promises;
const path = require('path');

module.exports = async (results) => {
  try {
    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '../../../reports');
    await fs.mkdir(reportsDir, { recursive: true });

    // Process results
    const processedResults = {
      summary: {
        total: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numPendingTests,
        duration: results.testResults.reduce((sum, result) => sum + result.perfStats.end - result.perfStats.start, 0),
        success: results.success
      },
      testSuites: results.testResults.map(result => ({
        name: path.basename(result.testFilePath),
        path: result.testFilePath,
        duration: result.perfStats.end - result.perfStats.start,
        tests: result.testResults.map(test => ({
          title: test.title,
          fullName: test.fullName,
          status: test.status,
          duration: test.duration,
          failureMessages: test.failureMessages,
          ancestorTitles: test.ancestorTitles
        }))
      })),
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // Save detailed results
    const resultsPath = path.join(reportsDir, 'e2e-detailed-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(processedResults, null, 2));

    // Generate performance metrics
    const performanceMetrics = generatePerformanceMetrics(processedResults);
    const metricsPath = path.join(reportsDir, 'e2e-performance-metrics.json');
    await fs.writeFile(metricsPath, JSON.stringify(performanceMetrics, null, 2));

    // Generate summary report
    const summaryReport = generateSummaryReport(processedResults);
    const summaryPath = path.join(reportsDir, 'e2e-summary.md');
    await fs.writeFile(summaryPath, summaryReport);

    console.log('📊 E2E Test results processed and saved to reports directory');

  } catch (error) {
    console.error('❌ Failed to process E2E test results:', error);
  }

  return results;
};

/**
 * Generate performance metrics from test results
 */
function generatePerformanceMetrics(results) {
  const testDurations = [];
  const suiteDurations = [];

  results.testSuites.forEach(suite => {
    suiteDurations.push(suite.duration);
    
    suite.tests.forEach(test => {
      if (test.duration) {
        testDurations.push(test.duration);
      }
    });
  });

  const calculateStats = (durations) => {
    if (durations.length === 0) return { min: 0, max: 0, avg: 0, p95: 0 };
    
    const sorted = durations.sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  };

  return {
    testPerformance: calculateStats(testDurations),
    suitePerformance: calculateStats(suiteDurations),
    totalDuration: results.summary.duration,
    testCount: results.summary.total,
    throughput: results.summary.total / (results.summary.duration / 1000), // tests per second
    timestamp: results.timestamp
  };
}

/**
 * Generate markdown summary report
 */
function generateSummaryReport(results) {
  const { summary } = results;
  const successRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;

  let report = `# E2E Test Summary Report

Generated: ${new Date(results.timestamp).toLocaleString()}

## Overview

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.total} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Skipped | ${summary.skipped} |
| Success Rate | ${successRate}% |
| Total Duration | ${(summary.duration / 1000).toFixed(2)}s |

## Test Suites

`;

  results.testSuites.forEach(suite => {
    const suitePassed = suite.tests.filter(t => t.status === 'passed').length;
    const suiteFailed = suite.tests.filter(t => t.status === 'failed').length;
    const suiteSuccessRate = suite.tests.length > 0 ? 
      ((suitePassed / suite.tests.length) * 100).toFixed(1) : 0;

    report += `### ${suite.name}

- **Duration**: ${(suite.duration / 1000).toFixed(2)}s
- **Tests**: ${suite.tests.length}
- **Passed**: ${suitePassed}
- **Failed**: ${suiteFailed}
- **Success Rate**: ${suiteSuccessRate}%

`;

    if (suiteFailed > 0) {
      report += `#### Failed Tests:\n\n`;
      suite.tests.filter(t => t.status === 'failed').forEach(test => {
        report += `- **${test.title}**\n`;
        if (test.failureMessages.length > 0) {
          report += `  - Error: ${test.failureMessages[0].split('\n')[0]}\n`;
        }
      });
      report += '\n';
    }
  });

  if (summary.failed > 0) {
    report += `## Recommendations

Based on the test results, consider the following actions:

- Review failed tests and their error messages
- Check for performance issues if tests are taking too long
- Verify test data setup and cleanup procedures
- Ensure external service dependencies are properly mocked or available

`;
  }

  return report;
}