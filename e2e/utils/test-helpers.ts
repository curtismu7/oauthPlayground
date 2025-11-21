import { test as base, expect, Page } from '@playwright/test';

/**
 * Base test configuration with common setup
 */
export const test = base.extend<{
	authenticatedPage: Page;
}>({
	authenticatedPage: async ({ page }, use) => {
		// Setup authentication if needed
		await page.goto('/');
		// Add any authentication setup here
		await use(page);
	},
});

/**
 * Common test utilities
 */
export class TestUtils {
	static async waitForLoading(page: Page) {
		await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });
	}

	static async waitForNetworkIdle(page: Page) {
		await page.waitForLoadState('networkidle');
	}

	static async fillFormField(page: Page, label: string, value: string) {
		const field = page.locator(`input[placeholder*="${label}"], input[name*="${label}"]`).first();
		await field.fill(value);
	}

	static async clickButton(page: Page, text: string) {
		await page.locator(`button:has-text("${text}"), [role="button"]:has-text("${text}")`).click();
	}

	static async selectFromDropdown(page: Page, selectName: string, option: string) {
		await page.selectOption(`select[name*="${selectName}"]`, option);
	}

	static async waitForToast(page: Page, message: string) {
		await page.waitForSelector(
			`[role="alert"]:has-text("${message}"), .toast:has-text("${message}")`
		);
	}

	static async dismissToast(page: Page) {
		const closeButton = page.locator('[aria-label="Close"], .toast-close').first();
		if (await closeButton.isVisible()) {
			await closeButton.click();
		}
	}
}

/**
 * OAuth flow test utilities
 */
export class OAuthTestUtils {
	static async configurePingOne(
		page: Page,
		config: {
			environmentId: string;
			clientId: string;
			clientSecret: string;
			redirectUri: string;
		}
	) {
		// Navigate to configuration page
		await page.goto('/configuration');

		// Fill in PingOne configuration
		await TestUtils.fillFormField(page, 'Environment ID', config.environmentId);
		await TestUtils.fillFormField(page, 'Client ID', config.clientId);
		await TestUtils.fillFormField(page, 'Client Secret', config.clientSecret);
		await TestUtils.fillFormField(page, 'Redirect URI', config.redirectUri);

		// Save configuration
		await TestUtils.clickButton(page, 'Save Configuration');
		await TestUtils.waitForToast(page, 'Configuration saved');
	}

	static async startOAuthFlow(page: Page, flowType: string) {
		// Navigate to the specific flow
		await page.goto(`/flows/${flowType}`);

		// Wait for the flow to load
		await TestUtils.waitForLoading(page);
		await TestUtils.waitForNetworkIdle(page);
	}

	static async completeAuthorizationCodeFlow(
		page: Page,
		credentials: {
			username: string;
			password: string;
		}
	) {
		// Wait for redirect to PingOne login
		await page.waitForURL(/.*pingone.*/, { timeout: 10000 });

		// Fill in credentials
		await TestUtils.fillFormField(page, 'username', credentials.username);
		await TestUtils.fillFormField(page, 'password', credentials.password);

		// Submit login
		await TestUtils.clickButton(page, 'Sign On');

		// Wait for redirect back to callback
		await page.waitForURL(/.*callback.*/, { timeout: 10000 });
	}

	static async verifyTokenResponse(page: Page) {
		// Check for token display
		await page.waitForSelector('.token-display, [data-testid="access-token"]', { timeout: 10000 });

		// Verify token exists
		const tokenElement = page.locator('.token-display, [data-testid="access-token"]');
		await expect(tokenElement).toBeVisible();

		// Verify token is not empty
		const tokenText = await tokenElement.textContent();
		expect(tokenText).toBeTruthy();
		expect(tokenText?.length).toBeGreaterThan(10);
	}

	static async verifyOIDCTokens(page: Page) {
		// Check for ID token
		const idToken = page.locator('[data-testid="id-token"], .id-token');
		await expect(idToken).toBeVisible();

		// Check for access token
		const accessToken = page.locator('[data-testid="access-token"], .access-token');
		await expect(accessToken).toBeVisible();

		// Optionally check for refresh token (may not always be present)
		const refreshToken = page.locator('[data-testid="refresh-token"], .refresh-token');
		// Note: Refresh token presence depends on the OAuth flow configuration
	}
}

/**
 * Mock OAuth server utilities for testing
 */
export class MockOAuthServer {
	static async setupMockResponses(page: Page) {
		// Intercept and mock OAuth endpoints
		await page.route('**/oauth2/token', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					access_token: 'mock_access_token_' + Date.now(),
					token_type: 'Bearer',
					expires_in: 3600,
					id_token: 'mock_id_token_' + Date.now(),
					refresh_token: 'mock_refresh_token_' + Date.now(),
				}),
			});
		});

		await page.route('**/oauth2/authorize', async (route) => {
			// Redirect back to callback with authorization code
			const url = new URL(route.request().url());
			url.searchParams.set('code', 'mock_authorization_code_' + Date.now());
			url.searchParams.set('state', url.searchParams.get('state') || 'test_state');

			await route.fulfill({
				status: 302,
				headers: {
					Location: `/callback${url.search}`,
				},
			});
		});
	}
}
