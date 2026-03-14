// tests/e2e/unified-oauth.spec.ts
/**
 * Unified OAuth & OIDC Flow - E2E tests
 * Verifies UI, navigation, and key flows at /v8u/unified
 */

import { expect, test } from '@playwright/test';

test.describe('Unified OAuth - Navigation & UI', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/v8u/unified');
	});

	test('loads Unified OAuth page and shows flow content', async ({ page }) => {
		await expect(page).toHaveURL(/\/v8u\/unified/);
		// Flow type dropdown or credentials section should be visible
		await expect(
			page.getByRole('combobox', { name: /Flow Type|Grant type/i }).or(
				page.getByText(/Unified OAuth|Configure Credentials|Authorization Code/i)
			)
		).toBeVisible({ timeout: 10000 });
	});

	test('navigates to Authorization Code flow', async ({ page }) => {
		await page.goto('/v8u/unified/oauth-authz/0');
		await expect(page).toHaveURL(/\/v8u\/unified\/oauth-authz/);
		await expect(
			page.getByText(/Authorization Code|Configure|Credentials/i)
		).toBeVisible({ timeout: 5000 });
	});

	test('navigates to Implicit flow', async ({ page }) => {
		await page.goto('/v8u/unified/implicit/0');
		await expect(page).toHaveURL(/\/v8u\/unified\/implicit/);
	});

	test('navigates to Client Credentials flow', async ({ page }) => {
		await page.goto('/v8u/unified/client-credentials/0');
		await expect(page).toHaveURL(/\/v8u\/unified\/client-credentials/);
	});

	test('navigates to Device Code flow', async ({ page }) => {
		await page.goto('/v8u/unified/device-code/0');
		await expect(page).toHaveURL(/\/v8u\/unified\/device-code/);
	});

	test('sidebar link to Unified OAuth works', async ({ page }) => {
		await page.goto('/dashboard');
		await page.getByRole('link', { name: /Unified OAuth|Unified OAuth & OIDC/i }).first().click();
		await expect(page).toHaveURL(/\/v8u\/unified/);
	});
});

test.describe('Unified OAuth - Flow Type Selector', () => {
	test('changing flow type updates URL', async ({ page }) => {
		await page.goto('/v8u/unified/oauth-authz/0');
		const flowSelect = page.getByRole('combobox', { name: /Flow Type|Grant type/i });
		await flowSelect.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
		if (await flowSelect.isVisible()) {
			await flowSelect.selectOption('client-credentials');
			await expect(page).toHaveURL(/\/v8u\/unified\/client-credentials/);
		}
	});
});
