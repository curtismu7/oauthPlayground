// src/utils/runSafeguards.ts
// Script to run comprehensive safeguard checks

import { errorMonitoring } from './errorMonitoring';
import { flowTestSuite } from './flowTestSuite';
import { regressionSafeguards } from './regressionSafeguards';
import { safeguardIntegration } from './safeguardIntegration';

import { logger } from '../utils/logger';
/**
 * Run comprehensive safeguard checks
 */
export async function runSafeguards(): Promise<void> {
	logger.info('🛡️  Running Comprehensive Safeguard Checks');
	logger.info('==========================================');

	try {
		// Run comprehensive check
		const results = await safeguardIntegration.runComprehensiveCheck();

		logger.info('\n📊 Safeguard Check Results:');
		logger.info('============================');
		logger.info(`Overall Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
		logger.info(`Summary: ${JSON.stringify(results.summary, null, 2)}`);

		// Show detailed results
		if (results.results.regressionTesting) {
			logger.info('\n🧪 Regression Testing Results:');
			logger.info(`Total Flows: ${results.results.regressionTesting.summary.totalFlows}`);
			logger.info(`Passed: ${results.results.regressionTesting.summary.passedFlows}`);
			logger.info(`Failed: ${results.results.regressionTesting.summary.failedFlows}`);
			logger.info(
				`Critical Failures: ${results.results.regressionTesting.summary.criticalFailures}`
			);
		}

		if (results.results.preCommitChecks) {
			logger.info('\n🔍 Pre-Commit Check Results:');
			logger.info(`Total Checks: ${results.results.preCommitChecks.summary.totalChecks}`);
			logger.info(`Passed: ${results.results.preCommitChecks.summary.passedChecks}`);
			logger.info(`Failed: ${results.results.preCommitChecks.summary.failedChecks}`);
			logger.info(`Critical Failures: ${results.results.preCommitChecks.summary.criticalFailures}`);
		}

		if (results.results.errorMonitoring) {
			logger.info('\n📈 Error Monitoring Results:');
			logger.info(`Overall: ${results.results.errorMonitoring.overall}`);
			logger.info(`Recent Errors: ${results.results.errorMonitoring.recentErrors}`);
			logger.info(`Critical Errors: ${results.results.errorMonitoring.criticalErrors}`);
		}

		if (results.results.flowValidation) {
			logger.info('\n🔄 Flow Validation Results:');
			logger.info(`Overall: ${results.results.flowValidation.overall}`);
			logger.info(`Flows: ${results.results.flowValidation.flows.length}`);
			logger.info(`Critical Issues: ${results.results.flowValidation.criticalIssues.length}`);
		}

		// Show health summary
		const healthSummary = safeguardIntegration.getHealthSummary();
		logger.info('\n🏥 Health Summary:');
		logger.info(`Overall: ${healthSummary.overall}`);
		logger.info(`Components: ${healthSummary.components}`);
		logger.info(`Healthy: ${healthSummary.healthy}`);
		logger.info(`Warning: ${healthSummary.warning}`);
		logger.info(`Critical: ${healthSummary.critical}`);

		// Show recommendations
		logger.info('\n💡 Recommendations:');
		if (results.passed) {
			logger.info('✅ All safeguard checks passed! Your system is healthy.');
		} else {
			logger.info('❌ Some safeguard checks failed. Please review the issues above.');

			if (results.summary.metrics.criticalErrors > 0) {
				logger.info('🚨 Critical errors detected. Immediate attention required.');
			}

			if (results.summary.metrics.failedTests > 0) {
				logger.info('⚠️  Some tests failed. Review and fix before proceeding.');
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
	logger.info('🏥 Running Quick Health Check...');

	try {
		const status = await safeguardIntegration.runHealthCheck();
		const healthSummary = safeguardIntegration.getHealthSummary();

		logger.info(`Health Status: ${status.overall}`);
		logger.info(`Components: ${healthSummary.healthy}/${healthSummary.components} healthy`);

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
	logger.info(`🧪 Running test for flow: ${flowName}`);

	try {
		const result = await flowTestSuite.runFlowTest(flowName);

		if (result) {
			logger.info(`Flow ${flowName}: ${result.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
			logger.info(`Tests: ${result.tests.length}`);
			logger.info(`Passed: ${result.tests.filter((t) => t.passed).length}`);
			logger.info(`Failed: ${result.tests.filter((t) => !t.passed).length}`);

			return result.overallPassed;
		} else {
			logger.error(`No test configuration found for flow: ${flowName}`);
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
	logger.info('📊 Safeguard System Status');
	logger.info('==========================');

	const status = safeguardIntegration.getStatus();
	if (status) {
		logger.info(`Overall: ${status.overall}`);
		logger.info(`Last Run: ${new Date(status.lastRun).toISOString()}`);
		logger.info(`Total Tests: ${status.metrics.totalTests}`);
		logger.info(`Passed Tests: ${status.metrics.passedTests}`);
		logger.info(`Failed Tests: ${status.metrics.failedTests}`);
		logger.info(`Critical Errors: ${status.metrics.criticalErrors}`);
		logger.info(`Recent Errors: ${status.metrics.recentErrors}`);

		logger.info('\nComponent Status:');
		Object.entries(status.components).forEach(([component, health]) => {
			logger.info(`  ${component}: ${health}`);
		});
	} else {
		logger.info('No status available. Run health check first.');
	}
}

/**
 * Export safeguard data
 */
export function exportSafeguardData(): string {
	logger.info('📤 Exporting safeguard data...');
	return safeguardIntegration.exportSafeguardData();
}

/**
 * Clear safeguard data
 */
export function clearSafeguardData(): void {
	logger.info('🗑️  Clearing safeguard data...');
	safeguardIntegration.clearSafeguardData();
	logger.info('✅ Safeguard data cleared');
}

// Export functions for use in other modules
export { safeguardIntegration, flowTestSuite, regressionSafeguards, errorMonitoring };
