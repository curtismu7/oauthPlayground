/**
 * @file runTokenExchangeTest.ts
 * @module v8u/tests
 * @description Browser-ready test runner for token exchange flow
 * @version 8.0.0
 * @since 2024-11-18
 */

import TokenExchangeFlowTest, { TestResult } from './tokenExchangeFlowTest';


/**
 * Initialize and run token exchange flow tests
 */
export function initializeTokenExchangeTests(): void {

	// Make test available globally
	if (typeof window !== 'undefined') {
		(window as { TokenExchangeFlowTest?: typeof TokenExchangeFlowTest }).TokenExchangeFlowTest = TokenExchangeFlowTest;

		// Create convenience function
		(window as { runTokenExchangeTests?: () => TestResult[] }).runTokenExchangeTests = () => {
			const test = new TokenExchangeFlowTest();
			test.runAllTests();
			return test.getResults();
		};

		}
}

// Auto-initialize when imported
initializeTokenExchangeTests();

export { TokenExchangeFlowTest };
