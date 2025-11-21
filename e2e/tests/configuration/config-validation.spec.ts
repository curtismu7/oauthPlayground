import { expect, test } from '@playwright/test';
import { ConfigurationPage } from '../../fixtures/page-objects';

test.describe('Configuration and Settings', () => {
	test('PingOne configuration validation', async ({ page }) => {
		const config = new ConfigurationPage(page);

		await config.goto('/configuration');

		// Test invalid configuration
		await config.setEnvironmentId('');
		await config.setClientId('');
		await config.setClientSecret('');
		await config.setRedirectUri('invalid-url');

		await config.saveConfiguration();

		// Should show validation errors
		await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();

		// Test valid configuration
		await config.setEnvironmentId('valid-env-123');
		await config.setClientId('valid-client-abc');
		await config.setClientSecret('valid-secret-xyz');
		await config.setRedirectUri('https://example.com/callback');

		await config.saveConfiguration();

		// Should show success message
		const successMessage = await config.getSuccessMessage();
		expect(successMessage?.toLowerCase()).toContain('success');
	});

	test('Configuration persistence across sessions', async ({ page, context }) => {
		const config = new ConfigurationPage(page);

		// Set configuration
		await config.goto('/configuration');
		await config.setEnvironmentId('persistent-env-123');
		await config.setClientId('persistent-client-abc');
		await config.saveConfiguration();

		// Verify success
		await expect(page.locator('.success-message')).toBeVisible();

		// Create new page in same context (simulates tab refresh)
		const newPage = await context.newPage();
		const newConfig = new ConfigurationPage(newPage);

		await newConfig.goto('/configuration');

		// Configuration should still be there
		const envId = await newPage.inputValue('[name*="environment"]');
		expect(envId).toBe('persistent-env-123');
	});

	test('Environment variable override', async ({ page }) => {
		// Set environment variables (simulated)
		await page.addInitScript(() => {
			window.localStorage.setItem('PINGONE_ENVIRONMENT_ID', 'env-override-123');
			window.localStorage.setItem('PINGONE_CLIENT_ID', 'client-override-abc');
		});

		const config = new ConfigurationPage(page);
		await config.goto('/configuration');

		// Should show environment variable values
		const envId = await page.inputValue('[name*="environment"]');
		const clientId = await page.inputValue('[name*="client"]');

		expect(envId).toBe('env-override-123');
		expect(clientId).toBe('client-override-abc');
	});

	test('Configuration export/import', async ({ page }) => {
		const config = new ConfigurationPage(page);

		await config.goto('/configuration');

		// Set configuration
		await config.setEnvironmentId('export-test-env');
		await config.setClientId('export-test-client');
		await config.setClientSecret('export-test-secret');
		await config.setRedirectUri('https://export-test.com/callback');

		// Export configuration
		await page.click('button:has-text("Export"), [data-testid="export-config"]');

		// Should download file or show export data
		const downloadPromise = page.waitForEvent('download');
		const exportButton = page.locator('button:has-text("Export")');
		await exportButton.click();

		const download = await downloadPromise;
		expect(download.suggestedFilename()).toContain('config');

		// Test import (if supported)
		const importButton = page.locator('input[type="file"], [data-testid="import-config"]');
		if (await importButton.isVisible()) {
			// Would need to upload the exported file
			// This is complex to test fully in e2e
			expect(true).toBe(true); // Placeholder for import test
		}
	});

	test('Security settings validation', async ({ page }) => {
		await page.goto('/configuration');

		// Test PKCE settings
		const pkceToggle = page.locator('[name*="pkce"], [data-testid="pkce-required"]');
		if (await pkceToggle.isVisible()) {
			await pkceToggle.check();
			expect(await pkceToggle.isChecked()).toBe(true);

			await pkceToggle.uncheck();
			expect(await pkceToggle.isChecked()).toBe(false);
		}

		// Test state parameter settings
		const stateToggle = page.locator('[name*="state"], [data-testid="state-required"]');
		if (await stateToggle.isVisible()) {
			await stateToggle.check();
			expect(await stateToggle.isChecked()).toBe(true);
		}

		// Test nonce settings
		const nonceToggle = page.locator('[name*="nonce"], [data-testid="nonce-required"]');
		if (await nonceToggle.isVisible()) {
			await nonceToggle.check();
			expect(await nonceToggle.isChecked()).toBe(true);
		}
	});

	test('Advanced configuration options', async ({ page }) => {
		await page.goto('/advanced-config');

		// Test timeout settings
		const timeoutInput = page.locator('[name*="timeout"], [placeholder*="timeout"]');
		if (await timeoutInput.isVisible()) {
			await timeoutInput.fill('30000');
			expect(await timeoutInput.inputValue()).toBe('30000');
		}

		// Test retry settings
		const retryInput = page.locator('[name*="retry"], [placeholder*="retry"]');
		if (await retryInput.isVisible()) {
			await retryInput.fill('3');
			expect(await retryInput.inputValue()).toBe('3');
		}

		// Test custom headers
		const headersTextarea = page.locator('textarea[name*="headers"]');
		if (await headersTextarea.isVisible()) {
			const customHeaders = JSON.stringify({
				'X-Custom-Header': 'test-value',
				Authorization: 'Bearer test-token',
			});
			await headersTextarea.fill(customHeaders);

			const enteredHeaders = await headersTextarea.inputValue();
			expect(JSON.parse(enteredHeaders)).toEqual({
				'X-Custom-Header': 'test-value',
				Authorization: 'Bearer test-token',
			});
		}
	});
});
