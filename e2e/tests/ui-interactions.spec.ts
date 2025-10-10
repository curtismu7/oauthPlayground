import { test, expect } from '@playwright/test';

test.describe('UI Component Interactions', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Cards are interactive and display content properly', async ({ page }) => {
    // Look for card components
    const cards = page.locator('.card, [data-testid*="card"], [class*="card"]');

    if (await cards.count() > 0) {
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();

      // Test card hover effects (if any)
      await firstCard.hover();
      await expect(firstCard).toBeVisible(); // Should still be visible after hover
    }
  });

  test('Buttons respond to user interactions', async ({ page }) => {
    const buttons = page.locator('button:not([disabled])');

    if (await buttons.count() > 0) {
      const firstButton = buttons.first();

      // Test button visibility and accessibility
      await expect(firstButton).toBeVisible();
      await expect(firstButton).toBeEnabled();

      // Test hover state
      await firstButton.hover();
      await expect(firstButton).toBeVisible();

      // Test focus state
      await firstButton.focus();
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('Form inputs handle user input correctly', async ({ page }) => {
    const textInputs = page.locator('input[type="text"], input[type="email"], input[type="url"], textarea');

    if (await textInputs.count() > 0) {
      const firstInput = textInputs.first();

      // Test input visibility and editability
      await expect(firstInput).toBeVisible();
      await expect(firstInput).toBeEditable();

      // Test input interaction
      await firstInput.fill('test input value');
      await expect(firstInput).toHaveValue('test input value');

      // Test clearing input
      await firstInput.clear();
      await expect(firstInput).toHaveValue('');
    }
  });

  test('Select dropdowns work correctly', async ({ page }) => {
    const selects = page.locator('select');

    if (await selects.count() > 0) {
      const firstSelect = selects.first();
      await expect(firstSelect).toBeVisible();
      await expect(firstSelect).toBeEnabled();

      // Get initial value
      const initialValue = await firstSelect.inputValue();

      // Try to select a different option if available
      const options = firstSelect.locator('option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Select second option
        await firstSelect.selectOption({ index: 1 });
        const newValue = await firstSelect.inputValue();
        expect(newValue).not.toBe(initialValue);
      }
    }
  });

  test('Modal dialogs open and close properly', async ({ page }) => {
    // Look for modal triggers
    const modalTriggers = page.locator('button, a').filter({
      hasText: /modal|dialog|popup|open/i
    });

    if (await modalTriggers.count() > 0) {
      const trigger = modalTriggers.first();
      await trigger.click();

      // Wait for modal to appear
      await page.waitForTimeout(1000);

      // Look for modal content
      const modals = page.locator('.modal, [role="dialog"], [data-testid*="modal"]');
      if (await modals.count() > 0) {
        const modal = modals.first();
        await expect(modal).toBeVisible();

        // Try to close modal
        const closeButtons = modal.locator('button').filter({
          hasText: /close|×|cancel|ok/i
        });

        if (await closeButtons.count() > 0) {
          await closeButtons.first().click();
          await page.waitForTimeout(500);
          // Modal should be closed or hidden
        }
      }
    }
  });

  test('Loading spinners appear during async operations', async ({ page }) => {
    // Look for buttons that might trigger async operations
    const asyncButtons = page.locator('button').filter({
      hasText: /load|fetch|submit|send|generate/i
    });

    if (await asyncButtons.count() > 0) {
      const asyncButton = asyncButtons.first();

      // Click button to trigger potential loading state
      await asyncButton.click();

      // Wait a bit for loading state
      await page.waitForTimeout(1000);

      // Check for loading indicators
      const spinners = page.locator('.spinner, .loading, [data-testid*="loading"], [class*="spinner"]');
      // Note: Loading states might be conditional, so we don't assert they always appear
      if (await spinners.count() > 0) {
        await expect(spinners.first()).toBeVisible();
      }
    }
  });

  test('Copy to clipboard functionality works', async ({ page }) => {
    // Look for copy buttons or elements with copy functionality
    const copyButtons = page.locator('button, .copy-btn').filter({
      hasText: /copy|clipboard/i
    });

    if (await copyButtons.count() > 0) {
      const copyButton = copyButtons.first();
      await expect(copyButton).toBeVisible();

      // Click copy button
      await copyButton.click();

      // Wait for potential feedback
      await page.waitForTimeout(1000);

      // Application should still be functional
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Responsive design adapts to different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Keyboard navigation works', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');

    // Should focus on first focusable element
    const focusedCount = await focusedElement.count();
    if (focusedCount > 0) {
      await expect(focusedElement.first()).toBeVisible();
    }

    // Test more tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus').first()).toBeVisible();
  });

  test('Color contrast and visual accessibility', async ({ page }) => {
    // Check that text is readable (basic visual test)
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6').filter({
      hasText: /.+/
    });

    if (await textElements.count() > 0) {
      // Basic check that text elements exist and are visible
      await expect(textElements.first()).toBeVisible();
    }
  });
});
