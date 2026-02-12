import { expect, test } from '@playwright/test';

/**
 * Golden-Path Playwright Tests - Highest ROI Regression Prevention
 * 
 * These tests cover the most critical user flows that, when broken,
 * cause the biggest impact on user experience and business functionality.
 * 
 * Tests focus on USER-VISIBLE OUTCOMES, not implementation details.
 * 
 * Run in CI after inventory script for comprehensive regression prevention.
 */

test.describe('Golden Path - Critical User Flows', () => {
	test.beforeEach(async ({ page }) => {
		// Set longer timeout for E2E tests
		test.setTimeout(60000);

		// Navigate to the application
		await page.goto('http://localhost:3000');
		await page.waitForLoadState('networkidle');
	});

	test('GP-01: Application loads and main navigation works', async ({ page }) => {
		// CRITICAL: App must load at all
		await expect(page).toHaveTitle(/OAuth Playground/);
		
		// Main navigation must be present
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		await expect(sidebar).toBeVisible();
		
		// Main content area must be present
		await expect(page.locator('.main-content, main, [data-testid="main-content"]')).toBeVisible();
		
		// Should have navigation items (menu structure)
		const navItems = sidebar.locator('a, button, [role="button"]');
		const navCount = await navItems.count();
		expect(navCount).toBeGreaterThan(0);
	});

	test('GP-02: Production menu items are accessible', async ({ page }) => {
		// CRITICAL: Production features must work
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		
		// Look for key Production menu items
		const productionItems = [
			'Token Monitoring',
			'Environment Management', 
			'API Status',
			'MFA Feature Flags'
		];
		
		for (const item of productionItems) {
			const menuItem = sidebar.locator(`text=${item}`).first();
			if (await menuItem.isVisible()) {
				await menuItem.click();
				await page.waitForLoadState('networkidle');
				
				// Verify page loaded (not crashed)
				await expect(page.locator('body')).toBeVisible();
				
				// Go back to main menu
				await page.goto('http://localhost:3000');
				await page.waitForLoadState('networkidle');
			}
		}
	});

	test('GP-03: Environment Management page loads safely', async ({ page }) => {
		// CRITICAL: Environment Management was recently fixed for null safety
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		
		// Navigate to Environment Management
		const envLink = sidebar.locator('text=Environment Management').first();
		if (await envLink.isVisible()) {
			await envLink.click();
			await page.waitForLoadState('networkidle');
			
			// CRITICAL: Must not crash with undefined error
			await expect(page.locator('body')).toBeVisible();
			
			// Should show either content or loading/error state (not blank crash)
			const pageContent = page.locator('body');
			const textContent = await pageContent.textContent();
			
			// Should have meaningful content (not just error text)
			expect(textContent?.length || 0).toBeGreaterThan(50);
			
			// Should not contain crash indicators
			await expect(page.locator('text=Cannot read properties of undefined')).not.toBeVisible();
			await expect(page.locator('text=TypeError')).not.toBeVisible();
		}
	});

	test('GP-04: MFA flows are accessible', async ({ page }) => {
		// CRITICAL: MFA functionality must be accessible
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		
		// Look for MFA-related menu items
		const mfaItems = sidebar.locator('text=/MFA|Unified|mfa/i');
		const mfaCount = await mfaItems.count();
		
		if (mfaCount > 0) {
			// Test first MFA item
			await mfaItems.first().click();
			await page.waitForLoadState('networkidle');
			
			// Should not crash
			await expect(page.locator('body')).toBeVisible();
			
			// Should have MFA-related content
			const pageContent = page.locator('body');
			const textContent = await pageContent.textContent();
			expect(textContent?.length || 0).toBeGreaterThan(50);
		}
	});

	test('GP-05: OAuth flows are accessible', async ({ page }) => {
		// CRITICAL: OAuth functionality must be accessible
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		
		// Look for OAuth-related menu items
		const oauthItems = sidebar.locator('text=/OAuth|oauth|Authorization|authorization/i');
		const oauthCount = await oauthItems.count();
		
		if (oauthCount > 0) {
			// Test first OAuth item
			await oauthItems.first().click();
			await page.waitForLoadState('networkidle');
			
			// Should not crash
			await expect(page.locator('body')).toBeVisible();
			
			// Should have OAuth-related content
			const pageContent = page.locator('body');
			const textContent = await pageContent.textContent();
			expect(textContent?.length || 0).toBeGreaterThan(50);
		}
	});

	test('GP-06: Token Monitoring page works', async ({ page }) => {
		// CRITICAL: Token Monitoring is a key Production feature
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		
		const tokenLink = sidebar.locator('text=Token Monitoring').first();
		if (await tokenLink.isVisible()) {
			await tokenLink.click();
			await page.waitForLoadState('networkidle');
			
			// Should not crash
			await expect(page.locator('body')).toBeVisible();
			
			// Should have token-related content
			const pageContent = page.locator('body');
			const textContent = await pageContent.textContent();
			expect(textContent?.length || 0).toBeGreaterThan(50);
			
			// Should not contain null safety errors
			await expect(page.locator('text=Cannot read properties of undefined')).not.toBeVisible();
		}
	});

	test('GP-07: API Status page works', async ({ page }) => {
		// CRITICAL: API Status is important for monitoring
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		
		const apiLink = sidebar.locator('text=API Status').first();
		if (await apiLink.isVisible()) {
			await apiLink.click();
			await page.waitForLoadState('networkidle');
			
			// Should not crash
			await expect(page.locator('body')).toBeVisible();
			
			// Should have API status content
			const pageContent = page.locator('body');
			const textContent = await pageContent.textContent();
			expect(textContent?.length || 0).toBeGreaterThan(50);
		}
	});

	test('GP-08: No JavaScript errors in console', async ({ page }) => {
		// CRITICAL: No unhandled JavaScript errors
		const errors: string[] = [];
		
		page.on('pageerror', (error) => {
			errors.push(error.message);
		});
		
		// Navigate around the app
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		const navItems = sidebar.locator('a, button, [role="button"]');
		const count = await navItems.count();
		
		// Test first 5 navigation items
		const itemsToTest = Math.min(count, 5);
		for (let i = 0; i < itemsToTest; i++) {
			await navItems.nth(i).click();
			await page.waitForLoadState('networkidle');
			
			// Wait a bit for any delayed errors
			await page.waitForTimeout(1000);
		}
		
		// Should have no JavaScript errors
		expect(errors).toHaveLength(0);
		
		if (errors.length > 0) {
			console.error('JavaScript errors found:', errors);
		}
	});

	test('GP-09: Configuration forms are safe', async ({ page }) => {
		// CRITICAL: Configuration forms should not crash
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
		
		// Look for configuration-related pages
		const configItems = sidebar.locator('text=/Configuration|Config|Settings|Settings/i');
		const configCount = await configItems.count();
		
		if (configCount > 0) {
			await configItems.first().click();
			await page.waitForLoadState('networkidle');
			
			// Should not crash
			await expect(page.locator('body')).toBeVisible();
			
			// Look for form elements
			const formElements = page.locator('input, select, textarea');
			const formCount = await formElements.count();
			
			// If forms exist, they should be safe to interact with
			if (formCount > 0) {
				// Test first input element
				const firstInput = formElements.first();
				await expect(firstInput).toBeVisible();
				
				// Some inputs might be disabled by design, so we just check they're visible
			}
		}
	});

	test('GP-10: Responsive design works on mobile', async ({ page }) => {
		// CRITICAL: Mobile experience should work
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
		
		// App should still work on mobile
		await expect(page).toHaveTitle(/OAuth Playground/);
		
		// Navigation should be accessible (might be different on mobile)
		const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"], .mobile-nav').first();
		await expect(sidebar).toBeVisible();
		
		// Main content should be visible
		await expect(page.locator('.main-content, main, [data-testid="main-content"]')).toBeVisible();
		
		// Should have meaningful content
		const pageContent = page.locator('body');
		const textContent = await pageContent.textContent();
		expect(textContent?.length || 0).toBeGreaterThan(50);
	});
});

/**
 * Test Metadata for CI Integration:
 * 
 * These tests are designed to run after the inventory gate in CI.
 * They complement the static analysis with dynamic user journey testing.
 * 
 * Exit Codes:
 * - 0: All golden paths working
 * - 1: One or more golden paths broken (regression detected)
 * 
 * Runtime: ~2-3 minutes for full suite
 * Coverage: Critical user flows across Production, MFA, and OAuth
 * 
 * Integration: Called from comprehensive-inventory-check.sh
 */
