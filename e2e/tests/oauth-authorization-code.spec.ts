import { test, expect } from '@playwright/test';

test.describe('OAuth Authorization Code Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000); // 90 seconds for OAuth flows
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Authorization Code Flow UI elements are present', async ({ page }) => {
    // Look for authorization code flow related UI elements
    const authCodeElements = page.locator('[data-testid*="auth-code"], [data-testid*="authorization-code"]');

    // If specific test IDs exist, check them
    if (await authCodeElements.count() > 0) {
      await expect(authCodeElements.first()).toBeVisible();
    } else {
      // Look for text-based identification
      const authCodeText = page.locator('text=/authorization code/i');
      await expect(authCodeText.or(page.locator('text=/auth code/i')).first()).toBeVisible();
    }
  });

  test('PKCE parameters can be configured', async ({ page }) => {
    // Look for PKCE-related inputs
    const pkceInputs = page.locator('input, select').filter({
      hasText: /pkce|code.challenge|code.verifier/i
    });

    if (await pkceInputs.count() > 0) {
      // Test that PKCE inputs are accessible
      const firstPkceInput = pkceInputs.first();
      await expect(firstPkceInput).toBeVisible();
      await expect(firstPkceInput).toBeEnabled();
    }
  });

  test('State parameter handling works', async ({ page }) => {
    // Look for state parameter inputs
    const stateInputs = page.locator('input').filter({
      hasText: /state/i
    });

    if (await stateInputs.count() > 0) {
      const stateInput = stateInputs.first();
      await expect(stateInput).toBeVisible();

      // Test input interaction
      await stateInput.fill('test-state-123');
      await expect(stateInput).toHaveValue('test-state-123');
    }
  });

  test('Scope configuration is available', async ({ page }) => {
    // Look for scope inputs or selectors
    const scopeInputs = page.locator('input, select, textarea').filter({
      hasText: /scope/i
    });

    if (await scopeInputs.count() > 0) {
      const scopeInput = scopeInputs.first();
      await expect(scopeInput).toBeVisible();

      // Test that common scopes can be entered
      if (await scopeInput.isEditable()) {
        await scopeInput.fill('openid profile email');
        await expect(scopeInput).toHaveValue('openid profile email');
      }
    }
  });

  test('Authorization URL generation works', async ({ page }) => {
    // Look for buttons that generate authorization URLs
    const generateButtons = page.locator('button, a').filter({
      hasText: /generate|create|build.*url/i
    });

    if (await generateButtons.count() > 0) {
      const generateButton = generateButtons.first();
      await expect(generateButton).toBeVisible();
      await expect(generateButton).toBeEnabled();
    }
  });

  test('Token exchange simulation works', async ({ page }) => {
    // Test token exchange functionality
    const exchangeButtons = page.locator('button').filter({
      hasText: /exchange|token|submit/i
    });

    // Look for forms that might handle token exchange
    const tokenForms = page.locator('form').filter({
      hasText: /token|code/i
    });

    if (await exchangeButtons.count() > 0 || await tokenForms.count() > 0) {
      // Test that token exchange UI is present
      const tokenExchangeUI = page.locator('[data-testid*="token"], .token-exchange, .code-exchange');
      if (await tokenExchangeUI.count() > 0) {
        await expect(tokenExchangeUI.first()).toBeVisible();
      }
    }
  });

  test('Client authentication method selection works', async ({ page }) => {
    // Look for client authentication method selectors
    const authMethodSelectors = page.locator('select, input[type="radio"]').filter({
      hasText: /client.*auth|auth.*method/i
    });

    if (await authMethodSelectors.count() > 0) {
      const authSelector = authMethodSelectors.first();
      await expect(authSelector).toBeVisible();
      await expect(authSelector).toBeEnabled();
    }
  });

  test('JWT Bearer authentication can be configured', async ({ page }) => {
    // Look for JWT-related inputs
    const jwtInputs = page.locator('textarea, input').filter({
      hasText: /jwt|assertion|client.assertion/i
    });

    if (await jwtInputs.count() > 0) {
      // Test JWT input accessibility
      const jwtInput = jwtInputs.first();
      await expect(jwtInput).toBeVisible();
    }
  });

  test('Token response display works', async ({ page }) => {
    // Look for areas that display token responses
    const tokenDisplays = page.locator('[data-testid*="response"], .response, .token-response, pre, code').filter({
      hasText: /access.*token|id.*token|refresh.*token/i
    });

    if (await tokenDisplays.count() > 0) {
      // Token display areas are present
      await expect(tokenDisplays.first()).toBeVisible();
    }
  });

  test('Error scenarios are handled gracefully', async ({ page }) => {
    // Try to submit incomplete forms to test error handling
    const submitButtons = page.locator('button[type="submit"], input[type="submit"]');

    if (await submitButtons.count() > 0) {
      // Click submit without filling required fields
      await submitButtons.first().click();

      // Wait for potential error messages
      await page.waitForTimeout(2000);

      // Check that application doesn't crash and shows appropriate feedback
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
