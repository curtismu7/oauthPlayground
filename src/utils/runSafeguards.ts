// src/utils/runSafeguards.ts
// Script to run comprehensive safeguard checks

import { safeguardIntegration } from './safeguardIntegration';
import { flowTestSuite } from './flowTestSuite';
import { regressionSafeguards } from './regressionSafeguards';
import { errorMonitoring } from './errorMonitoring';

/**
 * Run comprehensive safeguard checks
 */
export async function runSafeguards(): Promise<void> {
	console.log('🛡️  Running Comprehensive Safeguard Checks');
	console.log('==========================================');

	try {
		// Run comprehensive check
		const results = await safeguardIntegration.runComprehensiveCheck();
		
		console.log('\n📊 Safeguard Check Results:');
		console.log('============================');
		console.log(`Overall Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
		console.log(`Summary: ${JSON.stringify(results.summary, null, 2)}`);

		// Show detailed results
		if (results.results.regressionTesting) {
			console.log('\n🧪 Regression Testing Results:');
			console.log(`Total Flows: ${results.results.regressionTesting.summary.totalFlows}`);
			console.log(`Passed: ${results.results.regressionTesting.summary.passedFlows}`);
			console.log(`Failed: ${results.results.regressionTesting.summary.failedFlows}`);
			console.log(`Critical Failures: ${results.results.regressionTesting.summary.criticalFailures}`);
		}

		if (results.results.preCommitChecks) {
			console.log('\n🔍 Pre-Commit Check Results:');
			console.log(`Total Checks: ${results.results.preCommitChecks.summary.totalChecks}`);
			console.log(`Passed: ${results.results.preCommitChecks.summary.passedChecks}`);
			console.log(`Failed: ${results.results.preCommitChecks.summary.failedChecks}`);
			console.log(`Critical Failures: ${results.results.preCommitChecks.summary.criticalFailures}`);
		}

		if (results.results.errorMonitoring) {
			console.log('\n📈 Error Monitoring Results:');
			console.log(`Overall: ${results.results.errorMonitoring.overall}`);
			console.log(`Recent Errors: ${results.results.errorMonitoring.recentErrors}`);
			console.log(`Critical Errors: ${results.results.errorMonitoring.criticalErrors}`);
		}

		if (results.results.flowValidation) {
			console.log('\n🔄 Flow Validation Results:');
			console.log(`Overall: ${results.results.flowValidation.overall}`);
			console.log(`Flows: ${results.results.flowValidation.flows.length}`);
			console.log(`Critical Issues: ${results.results.flowValidation.criticalIssues.length}`);
		}

		// Show health summary
		const healthSummary = safeguardIntegration.getHealthSummary();
		console.log('\n🏥 Health Summary:');
		console.log(`Overall: ${healthSummary.overall}`);
		console.log(`Components: ${healthSummary.components}`);
		console.log(`Healthy: ${healthSummary.healthy}`);
		console.log(`Warning: ${healthSummary.warning}`);
		console.log(`Critical: ${healthSummary.critical}`);

		// Show recommendations
		console.log('\n💡 Recommendations:');
		if (results.passed) {
			console.log('✅ All safeguard checks passed! Your system is healthy.');
		} else {
			console.log('❌ Some safeguard checks failed. Please review the issues above.');
			
			if (results.summary.metrics.criticalErrors > 0) {
				console.log('🚨 Critical errors detected. Immediate attention required.');
			}
			
			if (results.summary.metrics.failedTests > 0) {
				console.log('⚠️  Some tests failed. Review and fix before proceeding.');
			}
		}

	} catch (error) {
		console.error('❌ Safeguard check failed:', error);
		throw error;
	}
}

/**
 * Run quick health check
 */
export async function runQuickHealthCheck(): Promise<boolean> {
	console.log('🏥 Running Quick Health Check...');
	
	try {
		const status = await safeguardIntegration.runHealthCheck();
		const healthSummary = safeguardIntegration.getHealthSummary();
		
		console.log(`Health Status: ${status.overall}`);
		console.log(`Components: ${healthSummary.healthy}/${healthSummary.components} healthy`);
		
		return status.overall === 'healthy';
	} catch (error) {
		console.error('❌ Quick health check failed:', error);
		return false;
	}
}

/**
 * Run specific flow test
 */
export async function runFlowTest(flowName: string): Promise<boolean> {
	console.log(`🧪 Running test for flow: ${flowName}`);
	
	try {
		const result = await flowTestSuite.runFlowTest(flowName);
		
		if (result) {
			console.log(`Flow ${flowName}: ${result.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
			console.log(`Tests: ${result.tests.length}`);
			console.log(`Passed: ${result.tests.filter(t => t.passed).length}`);
			console.log(`Failed: ${result.tests.filter(t => !t.passed).length}`);
			
			return result.overallPassed;
		} else {
			console.error(`No test configuration found for flow: ${flowName}`);
			return false;
		}
	} catch (error) {
		console.error(`❌ Flow test failed for ${flowName}:`, error);
		return false;
	}
}

/**
 * Show safeguard status
 */
export function showSafeguardStatus(): void {
	console.log('📊 Safeguard System Status');
	console.log('==========================');
	
	const status = safeguardIntegration.getStatus();
	if (status) {
		console.log(`Overall: ${status.overall}`);
		console.log(`Last Run: ${new Date(status.lastRun).toISOString()}`);
		console.log(`Total Tests: ${status.metrics.totalTests}`);
		console.log(`Passed Tests: ${status.metrics.passedTests}`);
		console.log(`Failed Tests: ${status.metrics.failedTests}`);
		console.log(`Critical Errors: ${status.metrics.criticalErrors}`);
		console.log(`Recent Errors: ${status.metrics.recentErrors}`);
		
		console.log('\nComponent Status:');
		Object.entries(status.components).forEach(([component, health]) => {
			console.log(`  ${component}: ${health}`);
		});
	} else {
		console.log('No status available. Run health check first.');
	}
}

/**
 * Export safeguard data
 */
export function exportSafeguardData(): string {
	console.log('📤 Exporting safeguard data...');
	return safeguardIntegration.exportSafeguardData();
}

/**
 * Clear safeguard data
 */
export function clearSafeguardData(): void {
	console.log('🗑️  Clearing safeguard data...');
	safeguardIntegration.clearSafeguardData();
	console.log('✅ Safeguard data cleared');
}

// Export functions for use in other modules
export {
	safeguardIntegration,
	flowTestSuite,
	regressionSafeguards,
	errorMonitoring
};
