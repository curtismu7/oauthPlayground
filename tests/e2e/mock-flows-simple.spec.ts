// tests/e2e/mock-flows-simple.spec.ts
/**
 * Mock Flows - Simple E2E tests
 * Basic connectivity and loading tests for mock flows
 */

import { expect, test } from '@playwright/test';

test.describe('Mock Flows - Basic Connectivity', () => {
	test('can access frontend server', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.status()).toBe(200);
	});

	test('can access a mock flow route', async ({ page }) => {
		const response = await page.goto('/flows/oidc-authorization-code-v9');
		expect(response?.status()).toBe(200);

		// Wait for page to load
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(3000);

		// Take screenshot to see what loaded
		await page.screenshot({ path: 'mock-flow-simple-test.png' });

		// Check page content
		const content = await page.content();
		console.log('Page content length:', content.length);

		// Look for any mock flow indicators
		const hasMockContent =
			content.includes('Mock') || content.includes('Educational') || content.includes('Demo');
		console.log('Has mock content:', hasMockContent);

		// Look for form fields
		const hasInputs = content.includes('input') || content.includes('button');
		console.log('Has inputs/buttons:', hasInputs);
	});

	test('test multiple mock flow routes for basic loading', async ({ page }) => {
		const mockFlows = [
			'/flows/oidc-authorization-code-v9',
			'/flows/client-credentials-v9',
			'/flows/device-authorization-v9',
		];

		for (const flow of mockFlows) {
			console.log(`Testing: ${flow}`);

			try {
				const response = await page.goto(flow, { timeout: 15000 });
				expect(response?.status()).toBe(200);

				// Wait for content to load
				await page.waitForTimeout(2000);

				// Check if page loaded successfully
				const title = await page.title();
				console.log(`  Title: ${title}`);

				// Check for any errors in console
				const content = await page.content();
				const hasError =
					content.includes('error') || content.includes('Error') || content.includes('ERROR');
				console.log(`  Has errors: ${hasError}`);

				// Basic success check - page has content
				expect(content.length).toBeGreaterThan(1000);
				console.log(`  ✓ Page loaded successfully`);
			} catch (error) {
				console.log(`  ✗ Failed: ${error}`);
				throw error;
			}
		}
	});
});
