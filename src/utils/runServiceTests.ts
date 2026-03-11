// src/utils/runServiceTests.ts
/**
 * Programmatic Test Runner for ComprehensiveFlowDataService
 *
 * This script runs the comprehensive tests and outputs results
 * for validation before updating flows.
 */

import { logger } from '../utils/logger';
import { comprehensiveFlowDataServiceTest } from './comprehensiveFlowDataServiceTest';
export const runServiceTests = async (): Promise<{
	success: boolean;
	results: any;
	summary: string;
}> => {
	logger.info(
		'🧪 [PROGRAMMATIC TEST RUNNER] Starting ComprehensiveFlowDataService Tests',
		'Logger info'
	);

	try {
		// Run all tests
		await comprehensiveFlowDataServiceTest.runAllTests();

		// Get results
		const testResults = comprehensiveFlowDataServiceTest['testResults'];
		const total = testResults.length;
		const passed = testResults.filter((r) => r.passed).length;
		const failed = testResults.filter((r) => !r.passed).length;
		const successRate = (passed / total) * 100;

		const results = {
			total,
			passed,
			failed,
			successRate,
			results: testResults,
		};

		const summary = `
🧪 COMPREHENSIVE FLOW DATA SERVICE TEST RESULTS
================================================
📊 Total Tests: ${total}
✅ Passed: ${passed}
❌ Failed: ${failed}
📈 Success Rate: ${successRate.toFixed(1)}%

${failed > 0 ? '❌ SOME TESTS FAILED - SERVICE NOT READY' : '✅ ALL TESTS PASSED - SERVICE IS ROCK SOLID'}
		`.trim();

		logger.info(summary, 'Logger info');

		if (failed > 0) {
			logger.info('\n❌ Failed Tests:', 'Logger info');
			testResults
				.filter((r) => !r.passed)
				.forEach((result) => {
					logger.info(`  - ${result.testName}: ${result.error}`, 'Logger info');
				});
		}

		return {
			success: failed === 0,
			results,
			summary,
		};
	} catch (error) {
		logger.error('❌ Test runner error:', error);
		return {
			success: false,
			results: null,
			summary: `❌ TEST RUNNER ERROR: ${error}`,
		};
	}
};

// Make it available globally
if (typeof window !== 'undefined') {
	(window as any).runServiceTests = runServiceTests;
	logger.info('🧪 runServiceTests() available globally');
}

export default runServiceTests;
