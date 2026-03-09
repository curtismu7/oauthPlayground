// src/utils/comprehensiveServiceValidation.ts
/**
 * Comprehensive Service Validation
 *
 * This script runs all validations to ensure the ComprehensiveFlowDataService
 * is rock solid and ready for production use.
 */

import { runServiceTests } from './runServiceTests';
import { validateServiceAPI } from './validateServiceAPI';

import { logger } from '../utils/logger';
export const runComprehensiveValidation = async (): Promise<{
	overallSuccess: boolean;
	apiValidation: any;
	testResults: any;
	summary: string;
}> => {
	logger.info('🚀 [COMPREHENSIVE VALIDATION] Starting Complete Service Validation');
	logger.info('='.repeat(80));

	// Step 1: API Interface Validation
	logger.info('\n🔍 STEP 1: API Interface Validation');
	logger.info('-'.repeat(50));
	const apiValidation = validateServiceAPI();

	// Step 2: Comprehensive Test Suite
	logger.info('\n🧪 STEP 2: Comprehensive Test Suite');
	logger.info('-'.repeat(50));
	const testResults = await runServiceTests();

	// Step 3: Overall Assessment
	const overallSuccess = apiValidation.success && testResults.success;

	const summary = `
🚀 COMPREHENSIVE SERVICE VALIDATION RESULTS
==========================================

🔍 API Interface Validation: ${apiValidation.success ? '✅ PASSED' : '❌ FAILED'}
🧪 Test Suite Execution: ${testResults.success ? '✅ PASSED' : '❌ FAILED'}

📊 OVERALL ASSESSMENT: ${overallSuccess ? '✅ SERVICE IS ROCK SOLID' : '❌ SERVICE NEEDS FIXES'}

${
	overallSuccess
		? '🚀 READY TO UPDATE V7 FLOWS WITH CONFIDENCE'
		: '⚠️ DO NOT UPDATE FLOWS UNTIL ISSUES ARE RESOLVED'
}

${
	apiValidation.issues.length > 0
		? `
🔍 API Issues (${apiValidation.issues.length}):
${apiValidation.issues.map((issue) => `  - ${issue}`).join('\n')}
`
		: ''
}

${
	testResults.results?.failed > 0
		? `
🧪 Failed Tests (${testResults.results.failed}):
${testResults.results.results
	.filter((r) => !r.passed)
	.map((r) => `  - ${r.testName}: ${r.error}`)
	.join('\n')}
`
		: ''
}
	`.trim();

	logger.info(summary);

	return {
		overallSuccess,
		apiValidation,
		testResults,
		summary,
	};
};

// Make it available globally
if (typeof window !== 'undefined') {
	(window as any).runComprehensiveValidation = runComprehensiveValidation;
	logger.info('🚀 runComprehensiveValidation() available globally');
	logger.info('🚀 Run with: runComprehensiveValidation()');
}

export default runComprehensiveValidation;
