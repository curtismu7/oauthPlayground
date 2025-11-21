/**
 * @file tokenExchangeIntegrationTest.ts
 * @module v8u/tests
 * @description Integration test for token exchange flow with real DOM manipulation
 * @version 8.0.0
 * @since 2024-11-18
 */

const MODULE_TAG = '[🧪 INTEGRATION-TEST-V8U]';

interface IntegrationTestResult {
	testName: string;
	passed: boolean;
	message: string;
	screenshot?: string;
	domState?: any;
}

/**
 * Token Exchange Integration Test
 * Tests the actual DOM behavior and user interactions
 */
class TokenExchangeIntegrationTest {
	private results: IntegrationTestResult[] = [];

	/**
	 * Test 1: Check if success message appears after token exchange
	 */
	private async testSuccessMessageDisplay(): Promise<IntegrationTestResult> {
		console.log(`${MODULE_TAG} Test 1: Success message display`);

		try {
			// Check if we're on the OAuth flow page
			const onFlowPage = window.location.pathname.includes('/v8u/unified/oauth-authz');

			if (!onFlowPage) {
				return {
					testName: 'Success Message Display',
					passed: true,
					message: '⏭️ Skipped - Not on OAuth flow page (navigate to /v8u/unified/oauth-authz)',
					domState: { skipped: true, currentPath: window.location.pathname },
				};
			}

			// Look for success message in DOM
			const successMessages = Array.from(document.querySelectorAll('div')).filter((div) => {
				const text = div.textContent || '';
				return (
					text.includes('Tokens already exchanged successfully') ||
					text.includes('Authorization codes are single-use only')
				);
			});

			const hasSuccessMessage = successMessages.length > 0;

			// If no success message, check if tokens exist in storage
			const flowKey = 'oauth-authz-v8u';
			const tokensKey = `v8u_flow_${flowKey}_tokens`;
			const hasTokensInStorage = !!sessionStorage.getItem(tokensKey);

			// Check if success message has correct styling
			let hasCorrectStyling = false;
			if (successMessages.length > 0) {
				const style = window.getComputedStyle(successMessages[0]);
				const bgColor = style.backgroundColor;
				const _color = style.color;

				// Check for green background (success color)
				hasCorrectStyling =
					bgColor.includes('209, 250, 229') || // #d1fae5
					bgColor.includes('rgb(209, 250, 229)');
			}

			// If tokens exist but no success message, that's a failure
			// If no tokens exist and no success message, that's expected (not yet completed)
			const passed = hasTokensInStorage ? hasSuccessMessage && hasCorrectStyling : true;

			return {
				testName: 'Success Message Display',
				passed,
				message: passed
					? hasTokensInStorage
						? '✅ Success message displayed with correct styling'
						: '⏭️ Skipped - No tokens yet (complete OAuth flow first)'
					: `❌ Tokens exist but success message ${hasSuccessMessage ? 'has incorrect styling' : 'not found'}`,
				domState: {
					successMessagesFound: successMessages.length,
					hasCorrectStyling,
					hasTokensInStorage,
					messageText: successMessages[0]?.textContent?.substring(0, 100),
				},
			};
		} catch (error) {
			return {
				testName: 'Success Message Display',
				passed: false,
				message: `❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Test 2: Check if exchange button is hidden after success
	 */
	private async testButtonHiddenAfterSuccess(): Promise<IntegrationTestResult> {
		console.log(`${MODULE_TAG} Test 2: Button hidden after success`);

		try {
			// Look for exchange button
			const buttons = Array.from(document.querySelectorAll('button')).filter((btn) => {
				const text = btn.textContent || '';
				return text.includes('Exchange Code for Tokens') || text.includes('Exchanging...');
			});

			const buttonVisible =
				buttons.length > 0 &&
				buttons.some((btn) => {
					const style = window.getComputedStyle(btn);
					return style.display !== 'none' && style.visibility !== 'hidden';
				});

			// Also check if success message is present
			const hasSuccessMessage = Array.from(document.querySelectorAll('div')).some((div) => {
				const text = div.textContent || '';
				return text.includes('Tokens already exchanged successfully');
			});

			// Button should be hidden if success message is shown
			const passed = hasSuccessMessage ? !buttonVisible : true;

			return {
				testName: 'Button Hidden After Success',
				passed,
				message: passed
					? '✅ Exchange button correctly hidden after success'
					: '❌ Exchange button still visible after success',
				domState: {
					buttonsFound: buttons.length,
					buttonVisible,
					hasSuccessMessage,
					buttonText: buttons[0]?.textContent,
				},
			};
		} catch (error) {
			return {
				testName: 'Button Hidden After Success',
				passed: false,
				message: `❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Test 3: Check if error is hidden after success
	 */
	private async testErrorHiddenAfterSuccess(): Promise<IntegrationTestResult> {
		console.log(`${MODULE_TAG} Test 3: Error hidden after success`);

		try {
			// Look for error messages
			const errorElements = Array.from(document.querySelectorAll('div, p, span')).filter((el) => {
				const text = el.textContent || '';
				return (
					text.includes('invalid_grant') ||
					text.includes('authorization code is expired') ||
					text.includes('Token exchange failed')
				);
			});

			const errorVisible =
				errorElements.length > 0 &&
				errorElements.some((el) => {
					const style = window.getComputedStyle(el);
					return style.display !== 'none' && style.visibility !== 'hidden';
				});

			// Check if success message is present
			const hasSuccessMessage = Array.from(document.querySelectorAll('div')).some((div) => {
				const text = div.textContent || '';
				return text.includes('Tokens already exchanged successfully');
			});

			// Error should be hidden if success message is shown
			const passed = hasSuccessMessage ? !errorVisible : true;

			return {
				testName: 'Error Hidden After Success',
				passed,
				message: passed
					? '✅ Error messages correctly hidden after success'
					: '❌ Error messages still visible after success',
				domState: {
					errorElementsFound: errorElements.length,
					errorVisible,
					hasSuccessMessage,
					errorText: errorElements[0]?.textContent?.substring(0, 100),
				},
			};
		} catch (error) {
			return {
				testName: 'Error Hidden After Success',
				passed: false,
				message: `❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Test 4: Check sessionStorage for PKCE codes
	 */
	private async testPKCEStoragePersistence(): Promise<IntegrationTestResult> {
		console.log(`${MODULE_TAG} Test 4: PKCE storage persistence`);

		try {
			const flowKey = 'oauth-authz-v8u';
			const storageKey = `v8u_flow_${flowKey}_pkce`;

			// Check sessionStorage
			const sessionData = sessionStorage.getItem(storageKey);
			const hasSessionData = !!sessionData;

			let pkceData = null;
			if (sessionData) {
				try {
					pkceData = JSON.parse(sessionData);
				} catch (_e) {
					// Invalid JSON
				}
			}

			const hasCodeVerifier = pkceData?.codeVerifier && pkceData.codeVerifier.length >= 43;
			const hasCodeChallenge = pkceData?.codeChallenge && pkceData.codeChallenge.length > 0;
			const hasSavedAt = !!pkceData?.savedAt;

			// If no PKCE data, check if user has started the flow
			const onFlowPage = window.location.pathname.includes('/v8u/unified/oauth-authz');
			const passed = hasSessionData
				? hasCodeVerifier && hasCodeChallenge && hasSavedAt
				: !onFlowPage;

			return {
				testName: 'PKCE Storage Persistence',
				passed,
				message: passed
					? hasSessionData
						? '✅ PKCE codes properly stored in sessionStorage'
						: '⏭️ Skipped - No PKCE codes yet (complete OAuth flow first)'
					: '❌ PKCE codes missing or incomplete in sessionStorage',
				domState: {
					storageKey,
					hasSessionData,
					hasCodeVerifier,
					hasCodeChallenge,
					hasSavedAt,
					codeVerifierLength: pkceData?.codeVerifier?.length,
					codeChallengeLength: pkceData?.codeChallenge?.length,
					savedAt: pkceData?.savedAt ? new Date(pkceData.savedAt).toISOString() : null,
				},
			};
		} catch (error) {
			return {
				testName: 'PKCE Storage Persistence',
				passed: false,
				message: `❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Test 5: Check if tokens are stored
	 */
	private async testTokenStorage(): Promise<IntegrationTestResult> {
		console.log(`${MODULE_TAG} Test 5: Token storage`);

		try {
			const flowKey = 'oauth-authz-v8u';
			const storageKey = `v8u_flow_${flowKey}_tokens`;

			// Check sessionStorage
			const sessionData = sessionStorage.getItem(storageKey);
			const hasSessionData = !!sessionData;

			let tokenData = null;
			if (sessionData) {
				try {
					tokenData = JSON.parse(sessionData);
				} catch (_e) {
					// Invalid JSON
				}
			}

			const hasAccessToken = !!tokenData?.accessToken;
			const hasExpiresIn = typeof tokenData?.expiresIn === 'number';
			const hasSavedAt = !!tokenData?.savedAt;

			// If no token data, check if user has completed the flow
			const onFlowPage = window.location.pathname.includes('/v8u/unified/oauth-authz');
			const passed = hasSessionData ? hasAccessToken && hasExpiresIn : !onFlowPage;

			return {
				testName: 'Token Storage',
				passed,
				message: passed
					? hasSessionData
						? '✅ Tokens properly stored in sessionStorage'
						: '⏭️ Skipped - No tokens yet (complete OAuth flow first)'
					: '❌ Tokens missing or incomplete in sessionStorage',
				domState: {
					storageKey,
					hasSessionData,
					hasAccessToken,
					hasExpiresIn,
					hasSavedAt,
					hasIdToken: !!tokenData?.idToken,
					hasRefreshToken: !!tokenData?.refreshToken,
					expiresIn: tokenData?.expiresIn,
					savedAt: tokenData?.savedAt ? new Date(tokenData.savedAt).toISOString() : null,
				},
			};
		} catch (error) {
			return {
				testName: 'Token Storage',
				passed: false,
				message: `❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Test 6: Check current step indicator
	 */
	private async testStepIndicator(): Promise<IntegrationTestResult> {
		console.log(`${MODULE_TAG} Test 6: Step indicator`);

		try {
			// Check if we're on the OAuth flow page
			const onFlowPage = window.location.pathname.includes('/v8u/unified/oauth-authz');

			if (!onFlowPage) {
				return {
					testName: 'Step Indicator',
					passed: true,
					message: '⏭️ Skipped - Not on OAuth flow page',
					domState: { skipped: true, currentPath: window.location.pathname },
				};
			}

			// Look for step indicator showing step 4 (token display)
			const stepElements = Array.from(document.querySelectorAll('div, span, button')).filter(
				(el) => {
					const text = el.textContent || '';
					return text.includes('Step 4') || text.includes('Display Tokens');
				}
			);

			const onStep4 = stepElements.length > 0;

			// Check if step 3 is marked complete
			const step3Complete = Array.from(document.querySelectorAll('div, span')).some((el) => {
				const text = el.textContent || '';
				const classList = Array.from(el.classList || []);
				return (
					(text.includes('Step 3') || text.includes('Exchange')) &&
					(classList.includes('complete') || classList.includes('completed') || text.includes('✓'))
				);
			});

			// Check if tokens exist in storage
			const flowKey = 'oauth-authz-v8u';
			const tokensKey = `v8u_flow_${flowKey}_tokens`;
			const hasTokensInStorage = !!sessionStorage.getItem(tokensKey);

			// If tokens exist, we should be on step 4 or step 3 should be complete
			const passed = hasTokensInStorage ? onStep4 || step3Complete : true;

			return {
				testName: 'Step Indicator',
				passed,
				message: passed
					? hasTokensInStorage
						? '✅ Step indicator shows progress correctly'
						: '⏭️ Skipped - No tokens yet (complete OAuth flow first)'
					: '❌ Step indicator not showing correct progress',
				domState: {
					onStep4,
					step3Complete,
					hasTokensInStorage,
					stepElementsFound: stepElements.length,
				},
			};
		} catch (error) {
			return {
				testName: 'Step Indicator',
				passed: false,
				message: `❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	/**
	 * Check current flow state and provide guidance
	 */
	private checkFlowState(): void {
		const onFlowPage = window.location.pathname.includes('/v8u/unified/oauth-authz');
		const flowKey = 'oauth-authz-v8u';
		const tokensKey = `v8u_flow_${flowKey}_tokens`;
		const pkceKey = `v8u_flow_${flowKey}_pkce`;
		const hasTokens = !!sessionStorage.getItem(tokensKey);
		const hasPKCE = !!sessionStorage.getItem(pkceKey);

		console.log(`${MODULE_TAG} 📊 Current Flow State:`);
		console.log(`${MODULE_TAG}    - On OAuth flow page: ${onFlowPage ? '✅' : '❌'}`);
		console.log(`${MODULE_TAG}    - Has PKCE codes: ${hasPKCE ? '✅' : '❌'}`);
		console.log(`${MODULE_TAG}    - Has tokens: ${hasTokens ? '✅' : '❌'}`);
		console.log(`${MODULE_TAG}    - Current path: ${window.location.pathname}`);
		console.log('');

		if (!onFlowPage) {
			console.log(`${MODULE_TAG} 💡 Tip: Navigate to /v8u/unified/oauth-authz to run all tests`);
		} else if (!hasTokens) {
			console.log(`${MODULE_TAG} 💡 Tip: Complete the OAuth flow to test the token exchange fix`);
		} else {
			console.log(`${MODULE_TAG} ✅ Ready to test! All prerequisites met.`);
		}
		console.log('');
	}

	/**
	 * Run all integration tests
	 */
	public async runAllTests(): Promise<void> {
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} Starting Integration Test Suite`);
		console.log(`${MODULE_TAG} ========================================`);
		console.log('');

		// Check flow state first
		this.checkFlowState();

		this.results = [];

		// Run all tests
		this.results.push(await this.testSuccessMessageDisplay());
		this.results.push(await this.testButtonHiddenAfterSuccess());
		this.results.push(await this.testErrorHiddenAfterSuccess());
		this.results.push(await this.testPKCEStoragePersistence());
		this.results.push(await this.testTokenStorage());
		this.results.push(await this.testStepIndicator());

		// Print results
		this.printResults();
	}

	/**
	 * Print test results
	 */
	private printResults(): void {
		console.log('');
		console.log(`${MODULE_TAG} ========================================`);
		console.log(`${MODULE_TAG} Integration Test Results`);
		console.log(`${MODULE_TAG} ========================================`);
		console.log('');

		const passed = this.results.filter((r) => r.passed).length;
		const skipped = this.results.filter((r) => r.message.includes('⏭️')).length;
		const failed = this.results.filter((r) => !r.passed).length;
		const total = this.results.length;
		const actualTests = total - skipped;

		this.results.forEach((result, index) => {
			const icon = result.passed ? '✅' : '❌';
			console.log(`${MODULE_TAG} Test ${index + 1}: ${icon} ${result.testName}`);
			console.log(`${MODULE_TAG}   ${result.message}`);
			if (result.domState && !result.message.includes('⏭️')) {
				console.log(`${MODULE_TAG}   DOM State:`, result.domState);
			}
			console.log('');
		});

		console.log(`${MODULE_TAG} ========================================`);
		console.log(
			`${MODULE_TAG} Total: ${total} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`
		);
		if (actualTests > 0) {
			console.log(
				`${MODULE_TAG} Success Rate: ${((passed / total) * 100).toFixed(1)}% (${passed}/${actualTests} applicable tests)`
			);
		}
		console.log(`${MODULE_TAG} ========================================`);

		if (failed === 0 && skipped === 0) {
			console.log(`${MODULE_TAG} 🎉 All integration tests passed!`);
			console.log(`${MODULE_TAG} ✅ The fix is working correctly:`);
			console.log(`${MODULE_TAG}    - Success message is displayed`);
			console.log(`${MODULE_TAG}    - Exchange button is hidden`);
			console.log(`${MODULE_TAG}    - Error messages are hidden`);
			console.log(`${MODULE_TAG}    - Storage is persisting data`);
		} else if (failed === 0 && skipped > 0) {
			console.log(`${MODULE_TAG} ✅ All applicable tests passed!`);
			console.log(
				`${MODULE_TAG} ℹ️ ${skipped} test(s) skipped (complete OAuth flow to run all tests)`
			);
			console.log(`${MODULE_TAG} 📋 To run all tests:`);
			console.log(`${MODULE_TAG}    1. Navigate to /v8u/unified/oauth-authz`);
			console.log(`${MODULE_TAG}    2. Complete OAuth flow through Step 3`);
			console.log(`${MODULE_TAG}    3. Click "Exchange Code for Tokens"`);
			console.log(`${MODULE_TAG}    4. Run: await runIntegrationTests()`);
		} else {
			console.log(`${MODULE_TAG} ⚠️ ${failed} test(s) failed.`);
			console.log(`${MODULE_TAG} 🔍 Review the DOM state details above.`);
		}
	}

	/**
	 * Get test results
	 */
	public getResults(): IntegrationTestResult[] {
		return this.results;
	}
}

/**
 * Quick diagnostic function to check current state
 */
function checkTokenExchangeState() {
	const MODULE_TAG = '[🔍 DIAGNOSTIC-V8U]';
	const flowKey = 'oauth-authz-v8u';
	const tokensKey = `v8u_flow_${flowKey}_tokens`;
	const pkceKey = `v8u_flow_${flowKey}_pkce`;
	const callbackKey = `v8u_flow_${flowKey}_callback`;

	console.log(`${MODULE_TAG} ========================================`);
	console.log(`${MODULE_TAG} Token Exchange State Diagnostic`);
	console.log(`${MODULE_TAG} ========================================`);
	console.log('');

	// Check location
	const onFlowPage = window.location.pathname.includes('/v8u/unified/oauth-authz');
	console.log(`${MODULE_TAG} 📍 Location:`);
	console.log(`${MODULE_TAG}    Current: ${window.location.pathname}`);
	console.log(`${MODULE_TAG}    On flow page: ${onFlowPage ? '✅ Yes' : '❌ No'}`);
	console.log('');

	// Check storage
	const tokensData = sessionStorage.getItem(tokensKey);
	const pkceData = sessionStorage.getItem(pkceKey);
	const callbackData = sessionStorage.getItem(callbackKey);

	console.log(`${MODULE_TAG} 💾 Storage:`);
	console.log(`${MODULE_TAG}    PKCE codes: ${pkceData ? '✅ Found' : '❌ Missing'}`);
	console.log(`${MODULE_TAG}    Callback data: ${callbackData ? '✅ Found' : '❌ Missing'}`);
	console.log(`${MODULE_TAG}    Tokens: ${tokensData ? '✅ Found' : '❌ Missing'}`);
	console.log('');

	// Check DOM
	const successMessages = Array.from(document.querySelectorAll('div')).filter((div) => {
		const text = div.textContent || '';
		return text.includes('Tokens already exchanged successfully');
	});

	const exchangeButtons = Array.from(document.querySelectorAll('button')).filter((btn) => {
		const text = btn.textContent || '';
		return text.includes('Exchange Code for Tokens');
	});

	console.log(`${MODULE_TAG} 🎨 DOM Elements:`);
	console.log(
		`${MODULE_TAG}    Success message: ${successMessages.length > 0 ? '✅ Visible' : '❌ Not found'}`
	);
	console.log(
		`${MODULE_TAG}    Exchange button: ${exchangeButtons.length > 0 ? '⚠️ Still visible' : '✅ Hidden'}`
	);
	console.log('');

	// Determine state
	const hasTokens = !!tokensData;
	const hasButton = exchangeButtons.length > 0;
	const hasSuccess = successMessages.length > 0;

	console.log(`${MODULE_TAG} 🎯 Fix Status:`);
	if (hasTokens && !hasButton && hasSuccess) {
		console.log(`${MODULE_TAG}    ✅ FIX WORKING CORRECTLY`);
		console.log(`${MODULE_TAG}    - Tokens received`);
		console.log(`${MODULE_TAG}    - Button hidden`);
		console.log(`${MODULE_TAG}    - Success message shown`);
	} else if (hasTokens && hasButton) {
		console.log(`${MODULE_TAG}    ❌ FIX NOT WORKING`);
		console.log(`${MODULE_TAG}    - Tokens received but button still visible`);
		console.log(`${MODULE_TAG}    - This should not happen!`);
	} else if (!hasTokens && !onFlowPage) {
		console.log(`${MODULE_TAG}    ℹ️ NOT TESTED YET`);
		console.log(`${MODULE_TAG}    - Navigate to /v8u/unified/oauth-authz`);
		console.log(`${MODULE_TAG}    - Complete OAuth flow`);
	} else if (!hasTokens && onFlowPage) {
		console.log(`${MODULE_TAG}    ℹ️ FLOW NOT COMPLETED`);
		console.log(`${MODULE_TAG}    - Complete OAuth flow through Step 3`);
		console.log(`${MODULE_TAG}    - Click "Exchange Code for Tokens"`);
	} else {
		console.log(`${MODULE_TAG}    ⚠️ UNKNOWN STATE`);
	}

	console.log('');
	console.log(`${MODULE_TAG} ========================================`);

	return {
		onFlowPage,
		hasTokens,
		hasPKCE: !!pkceData,
		hasCallback: !!callbackData,
		hasSuccessMessage: hasSuccess,
		hasExchangeButton: hasButton,
		fixWorking: hasTokens && !hasButton && hasSuccess,
	};
}

// Export for use in browser console
if (typeof window !== 'undefined') {
	(window as any).TokenExchangeIntegrationTest = TokenExchangeIntegrationTest;
	(window as any).runIntegrationTests = async () => {
		const test = new TokenExchangeIntegrationTest();
		await test.runAllTests();
		return test.getResults();
	};
	(window as any).checkTokenExchangeState = checkTokenExchangeState;

	console.log(`${MODULE_TAG} Integration test suite loaded.`);
	console.log(`${MODULE_TAG} 📋 Available commands:`);
	console.log(`${MODULE_TAG}   - runIntegrationTests() - Run all integration tests`);
	console.log(`${MODULE_TAG}   - checkTokenExchangeState() - Quick diagnostic check`);
	console.log(
		`${MODULE_TAG}   - new TokenExchangeIntegrationTest().runAllTests() - Run with custom instance`
	);
}

export default TokenExchangeIntegrationTest;
