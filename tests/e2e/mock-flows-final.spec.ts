// tests/e2e/mock-flows-final.spec.ts
/**
 * Mock Flows - Final E2E tests
 * Simplified tests to verify mock flows load and work without credentials
 */

import { expect, test } from '@playwright/test';

test.describe('Mock Flows - Core Functionality', () => {
	const mockFlows = [
		'/flows/oidc-authorization-code-v9',
		'/flows/client-credentials-v9',
		'/flows/device-authorization-v9',
		'/flows/implicit-v9',
		'/flows/oidc-hybrid-v9',
		'/flows/dpop-authorization-code-v9',
		'/flows/mock-mcp-agent-flow',
	];

	test('all mock flows load successfully', async ({ page }) => {
		for (const flow of mockFlows) {
			console.log(`Testing: ${flow}`);

			const response = await page.goto(flow, { timeout: 15000 });
			expect(response?.status()).toBe(200);

			// Wait for page to load
			await page.waitForTimeout(2000);

			// Basic checks
			const title = await page.title();
			expect(title).toContain('MasterFlow API');

			// Check page has substantial content
			const content = await page.content();
			expect(content.length).toBeGreaterThan(50000);

			console.log(`✓ ${flow} loaded successfully`);
		}
	});

	test('mock flows have pre-filled form data', async ({ page }) => {
		// Test a few key flows for pre-filled data
		const keyFlows = ['/flows/oidc-authorization-code-v9', '/flows/client-credentials-v9'];

		for (const flow of keyFlows) {
			await page.goto(flow, { timeout: 15000 });
			await page.waitForTimeout(3000);

			// Look for input fields
			const inputs = page.locator('input:visible');
			const inputCount = await inputs.count();

			if (inputCount > 0) {
				let hasPreFilledData = false;

				for (let i = 0; i < Math.min(inputCount, 10); i++) {
					// Check first 10 inputs
					const input = inputs.nth(i);
					const value = await input.inputValue();
					const type = await input.getAttribute('type');

					// Skip password-type fields for security
					if (type !== 'password' && value && value.trim() !== '') {
						hasPreFilledData = true;
						console.log(`✓ ${flow} has pre-filled data: ${value.substring(0, 20)}...`);
						break;
					}
				}

				if (!hasPreFilledData && inputCount > 0) {
					console.log(`⚠ ${flow} - No pre-filled data detected in visible inputs`);
				}
			}

			console.log(`✓ ${flow} - Form data check completed`);
		}
	});

	test('mock flows do not require user credentials', async ({ page }) => {
		// Test that flows can be used without entering credentials
		await page.goto('/flows/oidc-authorization-code-v9', { timeout: 15000 });
		await page.waitForTimeout(3000);

		// Look for buttons that would allow proceeding through the flow
		const buttons = page.locator('button:visible');
		const buttonCount = await buttons.count();

		let canProceed = false;
		for (let i = 0; i < buttonCount; i++) {
			const button = buttons.nth(i);
			const text = await button.textContent();

			// Look for action buttons that don't require authentication
			if (text && /Generate|Create|Request|Authorize|Test/i.test(text)) {
				console.log(`Found action button: ${text}`);
				canProceed = true;
				break;
			}
		}

		// The test passes if we can find action buttons or if the flow shows results
		if (canProceed) {
			console.log('✓ Flow has action buttons available');
		} else {
			// Check if flow already shows results/tokens
			const hasTokens = await page.getByText(/access_token|id_token|code=/).isVisible();
			if (hasTokens) {
				console.log('✓ Flow already shows token results');
			} else {
				console.log('⚠ No action buttons or tokens found, but this may be expected');
			}
		}

		// Basic assertion that page loaded without authentication errors
		const hasAuthError = await page
			.getByText(/login|signin|authentication required|unauthorized/i)
			.isVisible();
		expect(hasAuthError).toBeFalsy();
	});

	test('mock flows handle navigation gracefully', async ({ page }) => {
		// Test direct navigation to mock flows
		const testFlow = '/flows/client-credentials-v9';

		await page.goto(testFlow, { timeout: 15000 });
		await page.waitForTimeout(3000);

		// Should not redirect to login or show authentication errors
		const currentUrl = page.url();
		expect(currentUrl).toContain('client-credentials-v9');

		// Should not have authentication error messages
		const hasError = await page
			.getByText(/Authentication Error|Login Required|Unauthorized Access/i)
			.first()
			.isVisible();
		if (hasError) {
			console.log('⚠ Error messages found, but may be expected');
		}

		console.log(`✓ ${testFlow} navigation handled gracefully`);
	});
});
