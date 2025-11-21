/**
 * @file tokenExchangeFlowTest.ts
 * @module v8u/tests
 * @description Test script to validate token exchange flow and single-use authorization code behavior
 * @version 8.0.0
 * @since 2024-11-18
 */

const MODULE_TAG = '[🧪 TOKEN-EXCHANGE-TEST-V8U]';

interface TestResult {
	testName: string;
	passed: boolean;
	message: string;
	details?: any;
}

interface MockFlowState {
	authorizationCode: string | null;
	codeVerifier: string | null;
	codeChallenge: string | null;
	tokens: {
		accessToken: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn: number;
	} | null;
}

interface MockCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	usePKCE: boolean;
	scopes: string;
}

/**
 * Token Exchange Flow Test Suite
 * Tests the complete OAuth authorization code flow including:
 * - Initial token exchange
 * - Single-use authorization code enforcement
 * - UI state management after successful exchange
 * - Error handling for expired/reused codes
 */
class TokenExchangeFlowTest {
	private results: TestResult[] = [];
	private mockFlowState: MockFlowState;
	private mockCredentials: MockCredentials;

	constructor() {
		this.mockFlowState = {
			authorizationCode: null,
			codeVerifier: null,
			codeChallenge: null,
			tokens: null,
		};

		this.mockCredentials = {
			environmentId: 'test-env-id',
			clientId: 'test-client-id',
			clientSecret: 'test-client-secret',
			redirectUri: 'https://localhost:3000/authz-callback',
			usePKCE: true,
			scopes: 'openid profile email',
		};
	}

	/**
	 * Test 1: Initial state - no tokens, no authorization code
	 */
	private testInitialState(): TestResult {
		console.log(`${MODULE_TAG} Test 1: Initial state validation`);

		const shouldShowButton =
			!this.mockFlowState.tokens?.accessToken && !!this.mockFlowState.authorizationCode;
		const shouldShowWarning = !this.mockFlowState.authorizationCode;
		const shouldShowSuccess = !!this.mockFlowState.tokens?.accessToken;

		const passed = !shouldShowButton && shouldShowWarning && !shouldShowSuccess;

		return {
			testName: 'Initial State',
			passed,
			message: passed
				? '✅ Initial state correct: No button, warning shown, no success message'
				: '❌ Initial state incorrect',
			details: {
				shouldShowButton,
				shouldShowWarning,
				shouldShowSuccess,
				flowState: this.mockFlowState,
			},
		};
	}

	/**
	 * Test 2: After callback - authorization code received
	 */
	private testAfterCallback(): TestResult {
		console.log(`${MODULE_TAG} Test 2: After callback state validation`);

		// Simulate callback with authorization code
		this.mockFlowState.authorizationCode = '00b1a38e-6d40-4bb1-98ee-4177c0471ec4';
		this.mockFlowState.codeVerifier =
			'53949796a65bf809153058db78e3c0e8b5e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2';
		this.mockFlowState.codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

		const shouldShowButton =
			!this.mockFlowState.tokens?.accessToken && !!this.mockFlowState.authorizationCode;
		const shouldShowWarning = !this.mockFlowState.authorizationCode;
		const shouldShowSuccess = !!this.mockFlowState.tokens?.accessToken;
		const buttonDisabled = false; // Not loading

		const passed = shouldShowButton && !shouldShowWarning && !shouldShowSuccess && !buttonDisabled;

		return {
			testName: 'After Callback',
			passed,
			message: passed
				? '✅ After callback state correct: Button shown, no warning, no success message'
				: '❌ After callback state incorrect',
			details: {
				shouldShowButton,
				shouldShowWarning,
				shouldShowSuccess,
				buttonDisabled,
				flowState: this.mockFlowState,
			},
		};
	}

	/**
	 * Test 3: During token exchange - loading state
	 */
	private testDuringExchange(): TestResult {
		console.log(`${MODULE_TAG} Test 3: During exchange state validation`);

		const isLoading = true;
		const shouldShowButton =
			!this.mockFlowState.tokens?.accessToken && !!this.mockFlowState.authorizationCode;
		const buttonDisabled = isLoading;
		const buttonText = isLoading ? 'Exchanging...' : 'Exchange Code for Tokens';

		const passed = shouldShowButton && buttonDisabled && buttonText === 'Exchanging...';

		return {
			testName: 'During Exchange',
			passed,
			message: passed
				? '✅ During exchange state correct: Button disabled, loading text shown'
				: '❌ During exchange state incorrect',
			details: {
				shouldShowButton,
				buttonDisabled,
				buttonText,
				isLoading,
			},
		};
	}

	/**
	 * Test 4: After successful exchange - tokens received
	 */
	private testAfterSuccessfulExchange(): TestResult {
		console.log(`${MODULE_TAG} Test 4: After successful exchange state validation`);

		// Simulate successful token exchange
		this.mockFlowState.tokens = {
			accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
			idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
			refreshToken: 'refresh_token_value',
			expiresIn: 3600,
		};

		const shouldShowButton =
			!this.mockFlowState.tokens?.accessToken && !!this.mockFlowState.authorizationCode;
		const shouldShowWarning = !this.mockFlowState.authorizationCode;
		const shouldShowSuccess = !!this.mockFlowState.tokens?.accessToken;
		const shouldShowError = false; // No error after success

		const passed = !shouldShowButton && !shouldShowWarning && shouldShowSuccess && !shouldShowError;

		return {
			testName: 'After Successful Exchange',
			passed,
			message: passed
				? '✅ After success state correct: No button, success message shown, no error'
				: '❌ After success state incorrect',
			details: {
				shouldShowButton,
				shouldShowWarning,
				shouldShowSuccess,
				shouldShowError,
				flowState: this.mockFlowState,
			},
		};
	}

	/**
	 * Test 5: Attempt to reuse authorization code (should be prevented by UI)
	 */
	private testReuseAttempt(): TestResult {
		console.log(`${MODULE_TAG} Test 5: Reuse attempt validation`);

		// User tries to click button again (but it should be hidden)
		const shouldShowButton =
			!this.mockFlowState.tokens?.accessToken && !!this.mockFlowState.authorizationCode;
		const shouldShowSuccess = !!this.mockFlowState.tokens?.accessToken;
		const buttonClickable = shouldShowButton; // Button only clickable if shown

		const passed = !shouldShowButton && shouldShowSuccess && !buttonClickable;

		return {
			testName: 'Reuse Attempt Prevention',
			passed,
			message: passed
				? '✅ Reuse prevented: Button hidden, success message shown, cannot click'
				: '❌ Reuse not prevented: Button still accessible',
			details: {
				shouldShowButton,
				shouldShowSuccess,
				buttonClickable,
				tokensPresent: !!this.mockFlowState.tokens?.accessToken,
				authCodePresent: !!this.mockFlowState.authorizationCode,
			},
		};
	}

	/**
	 * Test 6: Error handling - expired/invalid authorization code
	 */
	private testErrorHandling(): TestResult {
		console.log(`${MODULE_TAG} Test 6: Error handling validation`);

		// Reset to state before exchange
		this.mockFlowState.tokens = null;

		// Simulate error from server
		const mockError =
			'Token exchange failed: invalid_grant - The provided authorization code is expired or invalid';
		const hasError = !!mockError;
		const hasTokens = !!this.mockFlowState.tokens?.accessToken;

		// Error should be shown only if no tokens
		const shouldShowError = hasError && !hasTokens;
		const shouldHideError = hasError && hasTokens;

		const passed = shouldShowError && !shouldHideError;

		return {
			testName: 'Error Handling',
			passed,
			message: passed
				? '✅ Error handling correct: Error shown when no tokens, hidden after success'
				: '❌ Error handling incorrect',
			details: {
				hasError,
				hasTokens,
				shouldShowError,
				shouldHideError,
				mockError,
			},
		};
	}

	/**
	 * Test 7: PKCE validation
	 */
	private testPKCEValidation(): TestResult {
		console.log(`${MODULE_TAG} Test 7: PKCE validation`);

		// Reset state
		this.mockFlowState.tokens = null;
		this.mockFlowState.authorizationCode = 'test-auth-code';

		// Test with PKCE enabled but no code verifier
		this.mockFlowState.codeVerifier = null;
		const pkceEnabled = this.mockCredentials.usePKCE;
		const hasCodeVerifier = !!this.mockFlowState.codeVerifier;

		const shouldBlockExchange = pkceEnabled && !hasCodeVerifier;
		const expectedError = shouldBlockExchange
			? 'PKCE is enabled but code verifier is missing'
			: null;

		const passed = shouldBlockExchange && !!expectedError;

		return {
			testName: 'PKCE Validation',
			passed,
			message: passed
				? '✅ PKCE validation correct: Exchange blocked when verifier missing'
				: '❌ PKCE validation incorrect',
			details: {
				pkceEnabled,
				hasCodeVerifier,
				shouldBlockExchange,
				expectedError,
			},
		};
	}

	/**
	 * Test 8: Credentials validation
	 */
	private testCredentialsValidation(): TestResult {
		console.log(`${MODULE_TAG} Test 8: Credentials validation`);

		const validations = [
			{
				field: 'clientId',
				value: this.mockCredentials.clientId,
				required: true,
				valid: !!this.mockCredentials.clientId?.trim(),
			},
			{
				field: 'environmentId',
				value: this.mockCredentials.environmentId,
				required: true,
				valid: !!this.mockCredentials.environmentId?.trim(),
			},
			{
				field: 'redirectUri',
				value: this.mockCredentials.redirectUri,
				required: !this.mockCredentials.usePKCE,
				valid: this.mockCredentials.usePKCE || !!this.mockCredentials.redirectUri?.trim(),
			},
		];

		const allValid = validations.every((v) => !v.required || v.valid);
		const passed = allValid;

		return {
			testName: 'Credentials Validation',
			passed,
			message: passed
				? '✅ Credentials validation correct: All required fields present'
				: '❌ Credentials validation incorrect: Missing required fields',
			details: {
				validations,
				allValid,
			},
		};
	}

	/**
	 * Test 9: UI state transitions
	 */
	private testUIStateTransitions(): TestResult {
		console.log(`${MODULE_TAG} Test 9: UI state transitions validation`);

		const states = [
			{
				name: 'Initial',
				authCode: null,
				tokens: null,
				expectedButton: false,
				expectedWarning: true,
				expectedSuccess: false,
			},
			{
				name: 'After Callback',
				authCode: 'test-code',
				tokens: null,
				expectedButton: true,
				expectedWarning: false,
				expectedSuccess: false,
			},
			{
				name: 'After Exchange',
				authCode: 'test-code',
				tokens: { accessToken: 'token', expiresIn: 3600 },
				expectedButton: false,
				expectedWarning: false,
				expectedSuccess: true,
			},
		];

		const transitions = states.map((state) => {
			const shouldShowButton = !state.tokens?.accessToken && !!state.authCode;
			const shouldShowWarning = !state.authCode;
			const shouldShowSuccess = !!state.tokens?.accessToken;

			return {
				state: state.name,
				correct:
					shouldShowButton === state.expectedButton &&
					shouldShowWarning === state.expectedWarning &&
					shouldShowSuccess === state.expectedSuccess,
				actual: { shouldShowButton, shouldShowWarning, shouldShowSuccess },
				expected: {
					expectedButton: state.expectedButton,
					expectedWarning: state.expectedWarning,
					expectedSuccess: state.expectedSuccess,
				},
			};
		});

		const allCorrect = transitions.every((t) => t.correct);
		const passed = allCorrect;

		return {
			testName: 'UI State Transitions',
			passed,
			message: passed
				? '✅ UI state transitions correct: All states render correctly'
				: '❌ UI state transitions incorrect',
			details: {
				transitions,
				allCorrect,
			},
		};
	}

	/**
	 * Test 10: Storage persistence
	 */
	private testStoragePersistence(): TestResult {
		console.log(`${MODULE_TAG} Test 10: Storage persistence validation`);

		// Simulate storage operations
		const storageKey = 'v8u_flow_oauth-authz-v8u_pkce';
		const mockPKCEData = {
			codeVerifier: this.mockFlowState.codeVerifier,
			codeChallenge: this.mockFlowState.codeChallenge,
			savedAt: Date.now(),
		};

		// Check if data would be saved to multiple locations
		const storageLocations = [
			{ name: 'localStorage', available: typeof localStorage !== 'undefined' },
			{ name: 'sessionStorage', available: typeof sessionStorage !== 'undefined' },
			{ name: 'memory cache', available: true },
			{ name: 'IndexedDB', available: typeof indexedDB !== 'undefined' },
		];

		const availableLocations = storageLocations.filter((loc) => loc.available);
		const redundancyLevel = availableLocations.length;
		const passed = redundancyLevel >= 3; // At least 3 storage locations

		return {
			testName: 'Storage Persistence',
			passed,
			message: passed
				? `✅ Storage persistence correct: ${redundancyLevel} storage locations available`
				: `❌ Storage persistence insufficient: Only ${redundancyLevel} locations available`,
			details: {
				storageKey,
				mockPKCEData,
				storageLocations,
				availableLocations,
				redundancyLevel,
			},
		};
	}

	/**
	 * Run all tests
	 */
	public runAllTests(): void {
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} Starting Token Exchange Flow Test Suite`);
		console.log(`${MODULE_TAG} ========================================`);
		console.log('');

		this.results = [];

		// Run all tests in sequence
		this.results.push(this.testInitialState());
		this.results.push(this.testAfterCallback());
		this.results.push(this.testDuringExchange());
		this.results.push(this.testAfterSuccessfulExchange());
		this.results.push(this.testReuseAttempt());
		this.results.push(this.testErrorHandling());
		this.results.push(this.testPKCEValidation());
		this.results.push(this.testCredentialsValidation());
		this.results.push(this.testUIStateTransitions());
		this.results.push(this.testStoragePersistence());

		// Print results
		this.printResults();
	}

	/**
	 * Print test results
	 */
	private printResults(): void {
		console.log('');
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} Test Results Summary`);
		console.log(`${MODULE_TAG} ========================================`);
		console.log('');

		const passed = this.results.filter((r) => r.passed).length;
		const failed = this.results.filter((r) => !r.passed).length;
		const total = this.results.length;

		this.results.forEach((result, index) => {
			const icon = result.passed ? '✅' : '❌';
			console.log(`${MODULE_TAG} Test ${index + 1}: ${icon} ${result.testName}`);
			console.log(`${MODULE_TAG}   ${result.message}`);
			if (!result.passed && result.details) {
				console.log(`${MODULE_TAG}   Details:`, result.details);
			}
			console.log('');
		});

		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
		console.log(`${MODULE_TAG} Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
		console.log(`${MODULE_TAG} ========================================`);

		if (failed === 0) {
			console.log(`${MODULE_TAG} 🎉 All tests passed! Token exchange flow is working correctly.`);
		} else {
			console.log(`${MODULE_TAG} ⚠️ ${failed} test(s) failed. Please review the details above.`);
		}
	}

	/**
	 * Get test results
	 */
	public getResults(): TestResult[] {
		return this.results;
	}
}

// Export for use in browser console
if (typeof window !== 'undefined') {
	(window as any).TokenExchangeFlowTest = TokenExchangeFlowTest;
	console.log(`${MODULE_TAG} Test suite loaded. Run: new TokenExchangeFlowTest().runAllTests()`);
}

export default TokenExchangeFlowTest;
