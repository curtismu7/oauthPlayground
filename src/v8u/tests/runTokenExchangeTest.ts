/**
 * @file runTokenExchangeTest.ts
 * @module v8u/tests
 * @description Browser-ready test runner for token exchange flow
 * @version 8.0.0
 * @since 2024-11-18
 */

import TokenExchangeFlowTest from './tokenExchangeFlowTest';

const MODULE_TAG = '[🧪 TEST-RUNNER-V8U]';

/**
 * Initialize and run token exchange flow tests
 */
export function initializeTokenExchangeTests(): void {
	console.log(`${MODULE_TAG} Initializing Token Exchange Flow Tests...`);

	// Make test available globally
	if (typeof window !== 'undefined') {
		(window as any).TokenExchangeFlowTest = TokenExchangeFlowTest;

		// Create convenience function
		(window as any).runTokenExchangeTests = () => {
			const test = new TokenExchangeFlowTest();
			test.runAllTests();
			return test.getResults();
		};

		console.log(`${MODULE_TAG} ✅ Test suite loaded successfully!`);
		console.log(`${MODULE_TAG} 📋 Available commands:`);
		console.log(`${MODULE_TAG}   - runTokenExchangeTests() - Run all tests`);
		console.log(
			`${MODULE_TAG}   - new TokenExchangeFlowTest().runAllTests() - Run with custom instance`
		);
		console.log('');
		console.log(`${MODULE_TAG} 🚀 Quick start: runTokenExchangeTests()`);
	}
}

// Auto-initialize when imported
initializeTokenExchangeTests();

export { TokenExchangeFlowTest };
