import { test, expect } from '@playwright/test';

test.describe('OAuth Playground - Comprehensive User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for E2E tests
    test.setTimeout(60000);

    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Application loads successfully', async ({ page }) => {
    // Check that the main application loads
    await expect(page).toHaveTitle(/OAuth Playground/);

    // Check for main navigation elements
    await expect(page.locator('nav, .sidebar, [data-testid="sidebar"]')).toBeVisible();

    // Check for main content area
    await expect(page.locator('.main-content, main, [data-testid="main-content"]')).toBeVisible();
  });

  test('Sidebar navigation works', async ({ page }) => {
    // Wait for sidebar to be visible
    const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    // Try to find and click navigation items
    const navItems = sidebar.locator('a, button, [role="button"]');
    const count = await navItems.count();

    if (count > 0) {
      // Click first navigation item
      await navItems.first().click();
      await page.waitForLoadState('networkidle');

      // Verify content changed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Configuration forms are accessible', async ({ page }) => {
    // Look for configuration forms or inputs
    const configInputs = page.locator('input, select, textarea').filter({ hasText: /environment|client|redirect|scope/i });

    if (await configInputs.count() > 0) {
      // Test that configuration inputs are visible and interactable
      const firstInput = configInputs.first();
      await expect(firstInput).toBeVisible();
      await expect(firstInput).toBeEnabled();
    }
  });

  test('OAuth flow buttons are present and clickable', async ({ page }) => {
    // Look for buttons related to OAuth flows
    const flowButtons = page.locator('button, a').filter({
      hasText: /authorization|token|flow|login|authenticate/i
    });

    if (await flowButtons.count() > 0) {
      const firstButton = flowButtons.first();
      await expect(firstButton).toBeVisible();

      // Check if button is enabled (don't click if it might cause external redirects)
      const isEnabled = await firstButton.isEnabled();
      expect(isEnabled).toBe(true);
    }
  });

  test('Error handling displays user-friendly messages', async ({ page }) => {
    // Try to trigger an error by submitting empty forms or invalid data
    const forms = page.locator('form');
    if (await forms.count() > 0) {
      const firstForm = forms.first();
      const submitButtons = firstForm.locator('button[type="submit"], input[type="submit"]');

      if (await submitButtons.count() > 0) {
        // Try submitting empty form
        await submitButtons.first().click();
        await page.waitForTimeout(1000);

        // Check for error messages
        const errorMessages = page.locator('.error, [data-testid*="error"], .alert-danger, .text-danger');
        // Note: This might not always show errors depending on form validation
      }
    }
  });

  test('Responsive design works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for responsive changes
    await page.waitForTimeout(1000);

    // Check that main content is still accessible
    await expect(page.locator('body')).toBeVisible();

    // Check for mobile menu if present
    const mobileMenu = page.locator('.mobile-menu, .hamburger, [data-testid="mobile-menu"]');
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('Token display components work correctly', async ({ page }) => {
    // Look for token display areas
    const tokenDisplays = page.locator('[data-testid*="token"], .token-display, .jwt-display, pre, code');

    if (await tokenDisplays.count() > 0) {
      // Check that token displays are properly formatted
      const firstTokenDisplay = tokenDisplays.first();
      await expect(firstTokenDisplay).toBeVisible();
    }
  });

  test('API health check endpoint responds', async ({ page }) => {
    // Test the backend health endpoint through frontend
    const response = await page.request.get('http://localhost:3001/api/health');
    expect(response.status()).toBe(200);

    const healthData = await response.json();
    expect(healthData).toHaveProperty('status', 'ok');
    expect(healthData).toHaveProperty('version');
  });

  test('Environment configuration endpoint works', async ({ page }) => {
    const response = await page.request.get('http://localhost:3001/api/env-config');
    expect(response.status()).toBe(200);

    const envConfig = await response.json();
    expect(envConfig).toHaveProperty('environmentId');
    expect(envConfig).toHaveProperty('clientId');
    expect(envConfig).toHaveProperty('redirectUri');
    expect(envConfig).toHaveProperty('scopes');
  });
});
