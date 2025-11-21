// src/utils/runServiceTests.ts
/**
 * Programmatic Test Runner for ComprehensiveFlowDataService
 *
 * This script runs the comprehensive tests and outputs results
 * for validation before updating flows.
 */

import { comprehensiveFlowDataServiceTest } from './comprehensiveFlowDataServiceTest';

export const runServiceTests = async (): Promise<{
	success: boolean;
	results: any;
	summary: string;
}> => {
	console.log('🧪 [PROGRAMMATIC TEST RUNNER] Starting ComprehensiveFlowDataService Tests');

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

		console.log(summary);

		if (failed > 0) {
			console.log('\n❌ Failed Tests:');
			testResults
				.filter((r) => !r.passed)
				.forEach((result) => {
					console.log(`  - ${result.testName}: ${result.error}`);
				});
		}

		return {
			success: failed === 0,
			results,
			summary,
		};
	} catch (error) {
		console.error('❌ Test runner error:', error);
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
	console.log('🧪 runServiceTests() available globally');
}

export default runServiceTests;
