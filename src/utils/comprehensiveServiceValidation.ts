// src/utils/comprehensiveServiceValidation.ts
/**
 * Comprehensive Service Validation
 * 
 * This script runs all validations to ensure the ComprehensiveFlowDataService
 * is rock solid and ready for production use.
 */

import { runServiceTests } from './runServiceTests';
import { validateServiceAPI } from './validateServiceAPI';

export const runComprehensiveValidation = async (): Promise<{
	overallSuccess: boolean;
	apiValidation: any;
	testResults: any;
	summary: string;
}> => {
	console.log('🚀 [COMPREHENSIVE VALIDATION] Starting Complete Service Validation');
	console.log('=' .repeat(80));
	
	// Step 1: API Interface Validation
	console.log('\n🔍 STEP 1: API Interface Validation');
	console.log('-'.repeat(50));
	const apiValidation = validateServiceAPI();
	
	// Step 2: Comprehensive Test Suite
	console.log('\n🧪 STEP 2: Comprehensive Test Suite');
	console.log('-'.repeat(50));
	const testResults = await runServiceTests();
	
	// Step 3: Overall Assessment
	const overallSuccess = apiValidation.success && testResults.success;
	
	const summary = `
🚀 COMPREHENSIVE SERVICE VALIDATION RESULTS
==========================================

🔍 API Interface Validation: ${apiValidation.success ? '✅ PASSED' : '❌ FAILED'}
🧪 Test Suite Execution: ${testResults.success ? '✅ PASSED' : '❌ FAILED'}

📊 OVERALL ASSESSMENT: ${overallSuccess ? '✅ SERVICE IS ROCK SOLID' : '❌ SERVICE NEEDS FIXES'}

${overallSuccess ? 
	'🚀 READY TO UPDATE V7 FLOWS WITH CONFIDENCE' : 
	'⚠️ DO NOT UPDATE FLOWS UNTIL ISSUES ARE RESOLVED'
}

${apiValidation.issues.length > 0 ? `
🔍 API Issues (${apiValidation.issues.length}):
${apiValidation.issues.map(issue => `  - ${issue}`).join('\n')}
` : ''}

${testResults.results?.failed > 0 ? `
🧪 Failed Tests (${testResults.results.failed}):
${testResults.results.results.filter(r => !r.passed).map(r => `  - ${r.testName}: ${r.error}`).join('\n')}
` : ''}
	`.trim();
	
	console.log(summary);
	
	return {
		overallSuccess,
		apiValidation,
		testResults,
		summary
	};
};

// Make it available globally
if (typeof window !== 'undefined') {
	(window as any).runComprehensiveValidation = runComprehensiveValidation;
	console.log('🚀 runComprehensiveValidation() available globally');
	console.log('🚀 Run with: runComprehensiveValidation()');
}

export default runComprehensiveValidation;
