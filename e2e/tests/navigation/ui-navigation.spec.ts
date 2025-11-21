import { expect, test } from '@playwright/test';
import { ConfigurationPage, DashboardPage, SidebarPage } from '../../fixtures/page-objects';

test.describe('Navigation and UI', () => {
	test('Sidebar menu persistence across page refreshes', async ({ page }) => {
		const sidebar = new SidebarPage(page);

		// Start with default state
		await page.goto('/');

		// Expand some menu sections
		await sidebar.toggleMenuSection('OAuth 2.0 Flows');
		await sidebar.toggleMenuSection('OpenID Connect');
		await sidebar.toggleMenuSection('AI learning');

		// Verify sections are open
		expect(await sidebar.isMenuSectionOpen('OAuth 2.0 Flows')).toBe(true);
		expect(await sidebar.isMenuSectionOpen('OpenID Connect')).toBe(true);
		expect(await sidebar.isMenuSectionOpen('AI learning')).toBe(true);

		// Refresh the page
		await page.reload();

		// Verify sections remain open (persistence)
		expect(await sidebar.isMenuSectionOpen('OAuth 2.0 Flows')).toBe(true);
		expect(await sidebar.isMenuSectionOpen('OpenID Connect')).toBe(true);
		expect(await sidebar.isMenuSectionOpen('AI learning')).toBe(true);

		// Collapse a section
		await sidebar.toggleMenuSection('AI learning');

		// Verify it's closed
		expect(await sidebar.isMenuSectionOpen('AI learning')).toBe(false);

		// Refresh again
		await page.reload();

		// Verify the collapsed state is persisted
		expect(await sidebar.isMenuSectionOpen('AI learning')).toBe(false);
		expect(await sidebar.isMenuSectionOpen('OAuth 2.0 Flows')).toBe(true);
	});

	test('Navigation between different flow categories', async ({ page }) => {
		const sidebar = new SidebarPage(page);

		await page.goto('/');

		// Navigate to OAuth 2.0 Authorization Code flow
		await sidebar.navigateToFlow('/flows/oauth-authorization-code-v5');

		// Verify we're on the correct page
		await expect(page).toHaveURL(/.*oauth-authorization-code-v5/);
		await expect(page.locator('h1, .page-title')).toContainText(/Authorization Code/);

		// Navigate to OIDC flow
		await sidebar.navigateToFlow('/flows/oidc-authorization-code-v5');

		// Verify navigation
		await expect(page).toHaveURL(/.*oidc-authorization-code-v5/);
		await expect(page.locator('h1, .page-title')).toContainText(/OIDC.*Authorization Code/);

		// Navigate to AI learning section
		await sidebar.navigateToFlow('/ai-glossary');

		// Verify AI content
		await expect(page).toHaveURL(/.*ai-glossary/);
		await expect(page.locator('h1, .page-title')).toContainText(/AI.*Glossary/);
	});

	test('Dashboard loads correctly', async ({ page }) => {
		const dashboard = new DashboardPage(page);

		await dashboard.goto('/');

		// Verify dashboard elements
		await dashboard.isLoaded();

		const welcomeMessage = await dashboard.getWelcomeMessage();
		expect(welcomeMessage).toBeTruthy();

		// Verify main sections are visible
		await expect(page.locator('[data-testid="quick-start"], .quick-start')).toBeVisible();
		await expect(page.locator('[data-testid="recent-flows"], .recent-flows')).toBeVisible();
	});

	test('Configuration page functionality', async ({ page }) => {
		const config = new ConfigurationPage(page);

		await config.goto('/configuration');

		// Verify configuration form loads
		await config.isLoaded();

		// Test configuration input
		await config.setEnvironmentId('test-env-12345');
		await config.setClientId('test-client-abcdef');
		await config.setClientSecret('test-secret-xyz');
		await config.setRedirectUri('http://localhost:3000/callback');

		// Save configuration
		await config.saveConfiguration();

		// Verify success message
		const successMessage = await config.getSuccessMessage();
		expect(successMessage?.toLowerCase()).toContain('saved');
	});

	test('Responsive sidebar behavior', async ({ page }) => {
		const sidebar = new SidebarPage(page);

		await page.goto('/');

		// Test mobile view
		await page.setViewportSize({ width: 375, height: 667 });

		// Sidebar should be hidden by default on mobile
		await expect(page.locator('.sidebar-container')).not.toBeVisible();

		// Open sidebar
		await page.click('[data-testid="sidebar-toggle"], .sidebar-toggle');

		// Sidebar should now be visible
		await expect(page.locator('.sidebar-container')).toBeVisible();

		// Close sidebar
		await page.click('[data-testid="sidebar-close"], .sidebar-close');

		// Sidebar should be hidden again
		await expect(page.locator('.sidebar-container')).not.toBeVisible();

		// Test desktop view
		await page.setViewportSize({ width: 1200, height: 800 });

		// Sidebar should be visible by default on desktop
		await expect(page.locator('.sidebar-container')).toBeVisible();
	});

	test('Search and filter functionality', async ({ page }) => {
		await page.goto('/');

		// Check if search exists
		const searchInput = page.locator('[data-testid="search"], input[type="search"]');

		if (await searchInput.isVisible()) {
			// Test search functionality
			await searchInput.fill('authorization code');

			// Verify search results
			await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

			// Clear search
			await searchInput.clear();

			// Verify results are cleared or hidden
			await expect(page.locator('[data-testid="search-results"]')).not.toBeVisible();
		}
	});

	test('Error handling and user feedback', async ({ page }) => {
		// Navigate to a flow that might have errors
		await page.goto('/flows/oauth-authorization-code-v5');

		// Try to start flow without configuration
		await page.click('button:has-text("Start"), [data-testid="start-flow"]');

		// Should show error message
		await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();

		// Error should be dismissible
		const dismissButton = page.locator('button:has-text("Dismiss"), .error-dismiss');
		if (await dismissButton.isVisible()) {
			await dismissButton.click();
			await expect(page.locator('.error-message')).not.toBeVisible();
		}
	});

	test('Loading states and performance', async ({ page }) => {
		// Test page load performance
		const startTime = Date.now();

		await page.goto('/');

		const loadTime = Date.now() - startTime;
		expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

		// Test flow page load
		const flowStartTime = Date.now();

		await page.goto('/flows/oauth-authorization-code-v5');

		const flowLoadTime = Date.now() - flowStartTime;
		expect(flowLoadTime).toBeLessThan(3000); // Flow pages should load within 3 seconds

		// Verify loading indicators don't get stuck
		const loadingIndicators = page.locator('.loading, .spinner, [data-testid="loading"]');
		await expect(loadingIndicators).toHaveCount(0);
	});
});
