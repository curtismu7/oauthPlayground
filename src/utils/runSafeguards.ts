// src/utils/runSafeguards.ts
// Script to run comprehensive safeguard checks

import { logger } from '../utils/logger';
import { errorMonitoring } from './errorMonitoring';
import { flowTestSuite } from './flowTestSuite';
import { regressionSafeguards } from './regressionSafeguards';
import { safeguardIntegration } from './safeguardIntegration';
/**
 * Run comprehensive safeguard checks
 */
export async function runSafeguards(): Promise<void> {
	logger.info('🛡️  Running Comprehensive Safeguard Checks', "Logger info");
	logger.info('==========================================', "Logger info");

	try {
		// Run comprehensive check
		const results = await safeguardIntegration.runComprehensiveCheck();

		logger.info('\n📊 Safeguard Check Results:', "Logger info");
		logger.info('============================', "Logger info");
		logger.info(`Overall Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`, "Logger info");
		logger.info(`Summary: ${JSON.stringify(results.summary, null, 2)}`);

		// Show detailed results
		if (results.results.regressionTesting) {
			logger.info('\n🧪 Regression Testing Results:', "Logger info");
			logger.info(`Total Flows: ${results.results.regressionTesting.summary.totalFlows}`, "Logger info");
			logger.info(`Passed: ${results.results.regressionTesting.summary.passedFlows}`, "Logger info");
			logger.info(`Failed: ${results.results.regressionTesting.summary.failedFlows}`, "Logger info");
			logger.info(
				`Critical Failures: ${results.results.regressionTesting.summary.criticalFailures}`
			, "Logger info");
		}

		if (results.results.preCommitChecks) {
			logger.info('\n🔍 Pre-Commit Check Results:', "Logger info");
			logger.info(`Total Checks: ${results.results.preCommitChecks.summary.totalChecks}`, "Logger info");
			logger.info(`Passed: ${results.results.preCommitChecks.summary.passedChecks}`, "Logger info");
			logger.info(`Failed: ${results.results.preCommitChecks.summary.failedChecks}`, "Logger info");
			logger.info(`Critical Failures: ${results.results.preCommitChecks.summary.criticalFailures}`, "Logger info");
		}

		if (results.results.errorMonitoring) {
			logger.info('\n📈 Error Monitoring Results:', "Logger info");
			logger.info(`Overall: ${results.results.errorMonitoring.overall}`, "Logger info");
			logger.info(`Recent Errors: ${results.results.errorMonitoring.recentErrors}`, "Logger info");
			logger.info(`Critical Errors: ${results.results.errorMonitoring.criticalErrors}`, "Logger info");
		}

		if (results.results.flowValidation) {
			logger.info('\n🔄 Flow Validation Results:', "Logger info");
			logger.info(`Overall: ${results.results.flowValidation.overall}`, "Logger info");
			logger.info(`Flows: ${results.results.flowValidation.flows.length}`, "Logger info");
			logger.info(`Critical Issues: ${results.results.flowValidation.criticalIssues.length}`, "Logger info");
		}

		// Show health summary
		const healthSummary = safeguardIntegration.getHealthSummary();
		logger.info('\n🏥 Health Summary:', "Logger info");
		logger.info(`Overall: ${healthSummary.overall}`, "Logger info");
		logger.info(`Components: ${healthSummary.components}`, "Logger info");
		logger.info(`Healthy: ${healthSummary.healthy}`, "Logger info");
		logger.info(`Warning: ${healthSummary.warning}`, "Logger info");
		logger.info(`Critical: ${healthSummary.critical}`, "Logger info");

		// Show recommendations
		logger.info('\n💡 Recommendations:', "Logger info");
		if (results.passed) {
			logger.info('✅ All safeguard checks passed! Your system is healthy.', "Logger info");
		} else {
			logger.info('❌ Some safeguard checks failed. Please review the issues above.', "Logger info");

			if (results.summary.metrics.criticalErrors > 0) {
				logger.info('🚨 Critical errors detected. Immediate attention required.', "Logger info");
			}

			if (results.summary.metrics.failedTests > 0) {
				logger.info('⚠️  Some tests failed. Review and fix before proceeding.', "Logger info");
			}
		}
	} catch (error) {
		logger.error('❌ Safeguard check failed:', error);
		throw error;
	}
}

/**
 * Run quick health check
 */
export async function runQuickHealthCheck(): Promise<boolean> {
	logger.info('🏥 Running Quick Health Check...', "Logger info");

	try {
		const status = await safeguardIntegration.runHealthCheck();
		const healthSummary = safeguardIntegration.getHealthSummary();

		logger.info(`Health Status: ${status.overall}`, "Logger info");
		logger.info(`Components: ${healthSummary.healthy}/${healthSummary.components} healthy`, "Logger info");

		return status.overall === 'healthy';
	} catch (error) {
		logger.error('❌ Quick health check failed:', error);
		return false;
	}
}

/**
 * Run specific flow test
 */
export async function runFlowTest(flowName: string): Promise<boolean> {
	logger.info(`🧪 Running test for flow: ${flowName}`, "Logger info");

	try {
		const result = await flowTestSuite.runFlowTest(flowName);

		if (result) {
			logger.info(`Flow ${flowName}: ${result.overallPassed ? '✅ PASSED' : '❌ FAILED'}`, "Logger info");
			logger.info(`Tests: ${result.tests.length}`, "Logger info");
			logger.info(`Passed: ${result.tests.filter((t) => t.passed).length}`);
			logger.info(`Failed: ${result.tests.filter((t) => !t.passed).length}`);

			return result.overallPassed;
		} else {
			logger.error(`No test configuration found for flow: ${flowName}`, "Logger error");
			return false;
		}
	} catch (error) {
		logger.error(`❌ Flow test failed for ${flowName}:`, error);
		return false;
	}
}

/**
 * Show safeguard status
 */
export function showSafeguardStatus(): void {
	logger.info('📊 Safeguard System Status', "Logger info");
	logger.info('==========================', "Logger info");

	const status = safeguardIntegration.getStatus();
	if (status) {
		logger.info(`Overall: ${status.overall}`, "Logger info");
		logger.info(`Last Run: ${new Date(status.lastRun).toISOString()}`);
		logger.info(`Total Tests: ${status.metrics.totalTests}`, "Logger info");
		logger.info(`Passed Tests: ${status.metrics.passedTests}`, "Logger info");
		logger.info(`Failed Tests: ${status.metrics.failedTests}`, "Logger info");
		logger.info(`Critical Errors: ${status.metrics.criticalErrors}`, "Logger info");
		logger.info(`Recent Errors: ${status.metrics.recentErrors}`, "Logger info");

		logger.info('\nComponent Status:', "Logger info");
		Object.entries(status.components).forEach(([component, health]) => {
			logger.info(`  ${component}: ${health}`, "Logger info");
		});
	} else {
		logger.info('No status available. Run health check first.', "Logger info");
	}
}

/**
 * Export safeguard data
 */
export function exportSafeguardData(): string {
	logger.info('📤 Exporting safeguard data...', "Logger info");
	return safeguardIntegration.exportSafeguardData();
}

/**
 * Clear safeguard data
 */
export function clearSafeguardData(): void {
	logger.info('🗑️  Clearing safeguard data...', "Logger info");
	safeguardIntegration.clearSafeguardData();
	logger.info('✅ Safeguard data cleared', "Logger info");
}

// Export functions for use in other modules
export { safeguardIntegration, flowTestSuite, regressionSafeguards, errorMonitoring };
