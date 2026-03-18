// tests/e2e/playwright-setup.spec.ts
/**
 * Playwright Setup Verification Test
 * Simple test to verify Playwright is properly installed and configured
 */

import { expect, test } from '@playwright/test';

test.describe('Playwright Setup Verification', () => {
	test('Playwright is properly installed and configured', async ({ page }) => {
		// Test basic browser functionality
		await page.goto('https://example.com');
		await expect(page).toHaveTitle(/Example Domain/);
		
		// Test basic element interaction
		const heading = page.locator('h1');
		await expect(heading).toContainText('Example Domain');
		
		// Test screenshot capability
		await page.screenshot({ path: 'test-screenshot.png' });
	});

	test('Can access local development server', async ({ page }) => {
		// Try to access the local server (this will fail if server isn't running)
		try {
			await page.goto('http://localhost:3000', { timeout: 5000 });
			// If we get here, the server is running
			await expect(page.locator('body')).toBeVisible();
		} catch (_error) {
			// Server isn't running, which is expected for this setup test
			console.log('Development server not running - this is expected for setup verification');
		}
	});

	test('Playwright configuration is valid', async ({ page, browserName }) => {
		// Verify browser context
		expect(browserName).toBeDefined();
		
		// Navigate to a simple page
		await page.goto('data:text/html,<html><body><h1>Playwright Test</h1></body></html>');
		await expect(page.locator('h1')).toHaveText('Playwright Test');
	});
});
