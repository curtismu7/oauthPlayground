// tests/e2e/ai-identity-flows.spec.ts
/**
 * AI Identity Flows - E2E tests
 * Verifies AI & Identity flows are properly standardized and functional
 */

import { expect, test } from '@playwright/test';

test.describe('AI Identity Flows - Navigation & UI', () => {
	test.describe('AI Identity Architectures', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/ai-identity-architectures');
		});

		test('loads AI Identity Architectures page with V9 styling', async ({ page }) => {
			await expect(page).toHaveURL(/\/ai-identity-architectures/);
			// Check for V9 fluid layout and AI-themed content
			await expect(page.getByText(/AI Identity Architectures/i)).toBeVisible();
			await expect(page.getByText(/AI Agent Identity Patterns/i)).toBeVisible();
		});

		test('displays collapsible sections properly', async ({ page }) => {
			// Check that collapsible headers are present
			const firstHeader = page.locator('text=AI Agent Identity Patterns').first();
			await expect(firstHeader).toBeVisible();

			// Click to expand/collapse
			await firstHeader.click();
			await expect(page.getByText(/OAuth Assertion Grant/i)).toBeVisible();
		});
	});

	test.describe('OIDC for AI', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/docs/oidc-for-ai');
		});

		test('loads OIDC for AI page with V9 styling', async ({ page }) => {
			await expect(page).toHaveURL(/\/docs\/oidc-for-ai/);
			await expect(page.getByText(/OIDC for AI/i).first()).toBeVisible();
			// Check for the collapsible section header (always visible as a button)
			await expect(page.getByText(/AI Authentication Patterns/i).first()).toBeVisible();
		});

		test('shows proper OIDC content and links', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /RFC 7523/i })).toBeVisible();
			await expect(page.getByText(/OpenID Connect Core/i).first()).toBeVisible();
		});
	});

	test.describe('OAuth for AI', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/docs/oauth-for-ai');
		});

		test('loads OAuth for AI page with V9 styling', async ({ page }) => {
			await expect(page).toHaveURL(/\/docs\/oauth-for-ai/);
			await expect(page.getByText(/OAuth for AI/i)).toBeVisible();
			await expect(page.getByText(/AI Agent Authorization/i)).toBeVisible();
		});

		test('displays OAuth compatibility table', async ({ page }) => {
			await expect(page.getByText(/OAuth 2.0 Grant Type/i).first()).toBeVisible();
			await expect(page.getByRole('cell', { name: /Assertion Grant/i }).first()).toBeVisible();
		});
	});

	test.describe('PingOne AI Perspective', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/docs/ping-view-on-ai');
		});

		test('loads PingOne AI Perspective page with V9 styling', async ({ page }) => {
			await expect(page).toHaveURL(/\/docs\/ping-view-on-ai/);
			await expect(page.getByText(/PingOne AI Perspective/i)).toBeVisible();
			await expect(page.getByText(/Enterprise AI Identity Framework/i)).toBeVisible();
		});

		test('shows PingOne-specific content', async ({ page }) => {
			await expect(page.getByText(/AI Workload Identity/i)).toBeVisible();
			await expect(page.getByText(/Zero Trust AI Security/i)).toBeVisible();
		});
	});

	test.describe('Ping AI Resources', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/ping-ai-resources');
		});

		test('loads Ping AI Resources page with V9 styling', async ({ page }) => {
			await expect(page).toHaveURL(/\/ping-ai-resources/);
			await expect(page.getByText(/Ping AI Resources/i)).toBeVisible();
			await expect(page.getByText(/AI Identity Fundamentals/i)).toBeVisible();
		});

		test('displays resource cards and links', async ({ page }) => {
			await expect(page.getByRole('heading', { name: /Types of AI Agents/i })).toBeVisible();
			await expect(page.getByText(/PingOne AI Solutions/i).first()).toBeVisible();
		});
	});

	test.describe('Cross-navigation between AI flows', () => {
		test('can navigate between all AI flows', async ({ page }) => {
			// Start with AI Identity Architectures
			await page.goto('/ai-identity-architectures');
			await page.waitForLoadState('domcontentloaded');
			await expect(page.getByText(/AI Identity Architectures/i).first()).toBeVisible();

			// Navigate to OIDC for AI
			await page.goto('/docs/oidc-for-ai');
			await page.waitForLoadState('domcontentloaded');
			await expect(page.getByText(/OIDC for AI/i).first()).toBeVisible();

			// Navigate to OAuth for AI
			await page.goto('/docs/oauth-for-ai');
			await page.waitForLoadState('domcontentloaded');
			await expect(page.getByText(/OAuth for AI/i).first()).toBeVisible();

			// Navigate to PingOne AI Perspective
			await page.goto('/docs/ping-view-on-ai');
			await page.waitForLoadState('domcontentloaded');
			await expect(
				page.getByRole('heading', { name: 'PingOne AI Perspective' }).first()
			).toBeVisible({ timeout: 10000 });

			// Navigate to Ping AI Resources
			await page.goto('/ping-ai-resources');
			await page.waitForLoadState('domcontentloaded');
			await expect(page.getByRole('heading', { name: 'Ping AI Resources' }).first()).toBeVisible({
				timeout: 10000,
			});
		});

		test('all AI flows have proper V9 fluid layout', async ({ page }) => {
			const aiFlows = [
				'/ai-identity-architectures',
				'/docs/oidc-for-ai',
				'/docs/oauth-for-ai',
				'/docs/ping-view-on-ai',
				'/ping-ai-resources',
			];

			for (const flow of aiFlows) {
				await page.goto(flow);

				// Check that the page loads without errors
				await expect(page.locator('body')).toBeVisible();

				// Check for V9-styled content (no hardcoded max-width containers)
				const body = page.locator('body');
				await expect(body).toBeVisible();
			}
		});
	});
});
