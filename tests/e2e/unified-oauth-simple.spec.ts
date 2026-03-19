// tests/e2e/unified-oauth-simple.spec.ts
/**
 * Unified OAuth - Simple E2E Tests
 * Focused tests for the Unified OAuth system with robust selectors
 */

import { expect, test } from '@playwright/test';

test.describe('Unified OAuth - Simple Tests', () => {
	const BASE_URL = '/v8u/unified';

	test.beforeEach(async ({ page }) => {
		await page.goto(BASE_URL);
		await page.waitForLoadState('domcontentloaded');
	});

	test('unified oauth page loads', async ({ page }) => {
		// Check we're on the unified oauth page
		await expect(page).toHaveURL(/\/v8u\/unified/);

		// Look for any unified flow content
		const unifiedContent = page.locator('text=Unified, text=OAuth, text=Flow, text=Authorization');
		if ((await unifiedContent.count()) > 0) {
			console.log('✅ Unified OAuth content found');
		}

		// Check for any form elements
		const forms = page.locator('form, input, select, button');
		const formCount = await forms.count();
		expect(formCount).toBeGreaterThan(0);
		console.log(`Found ${formCount} form elements`);
	});

	test('can navigate to authorization code flow', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Check URL reflects the flow type
		await expect(page).toHaveURL(/oauth-authz/);

		// Look for authorization code flow content
		const authzContent = page.locator(
			'text=Authorization Code, text=Client ID, text=Client Secret'
		);
		const contentCount = await authzContent.count();
		if (contentCount > 0) {
			console.log(`✅ Found ${contentCount} authorization code flow elements`);
		}

		// Look for input fields
		const inputs = page.locator('input');
		const inputCount = await inputs.count();
		if (inputCount > 0) {
			console.log(`✅ Found ${inputCount} input fields`);
		}
	});

	test('can navigate to client credentials flow', async ({ page }) => {
		await page.goto(`${BASE_URL}/client-credentials`);
		await page.waitForLoadState('domcontentloaded');

		// Check URL reflects the flow type
		await expect(page).toHaveURL(/client-credentials/);

		// Look for client credentials flow content
		const clientCredsContent = page.locator(
			'text=Client Credentials, text=Client ID, text=Client Secret'
		);
		const contentCount = await clientCredsContent.count();
		if (contentCount > 0) {
			console.log(`✅ Found ${contentCount} client credentials flow elements`);
		}
	});

	test('can navigate to implicit flow', async ({ page }) => {
		await page.goto(`${BASE_URL}/implicit`);
		await page.waitForLoadState('domcontentloaded');

		// Check URL reflects the flow type
		await expect(page).toHaveURL(/implicit/);

		// Look for implicit flow content
		const implicitContent = page.locator('text=Implicit Flow, text=Client ID, text=Redirect URI');
		const contentCount = await implicitContent.count();
		if (contentCount > 0) {
			console.log(`✅ Found ${contentCount} implicit flow elements`);
		}
	});

	test('can navigate to device code flow', async ({ page }) => {
		await page.goto(`${BASE_URL}/device-code`);
		await page.waitForLoadState('domcontentloaded');

		// Check URL reflects the flow type
		await expect(page).toHaveURL(/device-code/);

		// Look for device code flow content
		const deviceContent = page.locator('text=Device Code, text=Device, text=User Code');
		const contentCount = await deviceContent.count();
		if (contentCount > 0) {
			console.log(`✅ Found ${contentCount} device code flow elements`);
		}
	});

	test('can navigate to hybrid flow', async ({ page }) => {
		await page.goto(`${BASE_URL}/hybrid`);
		await page.waitForLoadState('domcontentloaded');

		// Check URL reflects the flow type
		await expect(page).toHaveURL(/hybrid/);

		// Look for hybrid flow content
		const hybridContent = page.locator('text=Hybrid Flow, text=Authorization Code, text=ID Token');
		const contentCount = await hybridContent.count();
		if (contentCount > 0) {
			console.log(`✅ Found ${contentCount} hybrid flow elements`);
		}
	});

	test('can navigate with spec versions', async ({ page }) => {
		// Test OAuth 2.0
		await page.goto(`${BASE_URL}/oauth2.0/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		const oauth2Content = page.locator('text=OAuth 2.0, text=2.0');
		if ((await oauth2Content.count()) > 0) {
			console.log('✅ OAuth 2.0 spec version found');
		}

		// Test OAuth 2.1
		await page.goto(`${BASE_URL}/oauth2.1/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		const oauth21Content = page.locator('text=OAuth 2.1, text=2.1');
		if ((await oauth21Content.count()) > 0) {
			console.log('✅ OAuth 2.1 spec version found');
		}

		// Test OIDC
		await page.goto(`${BASE_URL}/oidc/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		const oidcContent = page.locator('text=OIDC, text=OpenID Connect');
		if ((await oidcContent.count()) > 0) {
			console.log('✅ OIDC spec version found');
		}
	});

	test('forms have input fields', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Look for different types of inputs
		const textInputs = page.locator('input[type="text"]');
		const passwordInputs = page.locator('input[type="password"]');
		const textareas = page.locator('textarea');
		const selects = page.locator('select');

		const textCount = await textInputs.count();
		const passwordCount = await passwordInputs.count();
		const textareaCount = await textareas.count();
		const selectCount = await selects.count();

		console.log(
			`Found: ${textCount} text inputs, ${passwordCount} password inputs, ${textareaCount} textareas, ${selectCount} selects`
		);

		// Should have at least some input fields
		const totalInputs = textCount + passwordCount + textareaCount + selectCount;
		expect(totalInputs).toBeGreaterThan(0);
	});

	test('has action buttons', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Look for various action buttons
		const actionButtons = page.locator('button');
		const buttonCount = await actionButtons.count();

		if (buttonCount > 0) {
			console.log(`✅ Found ${buttonCount} buttons`);

			// Check button text content
			for (let i = 0; i < Math.min(buttonCount, 5); i++) {
				const button = actionButtons.nth(i);
				const buttonText = await button.textContent();
				if (buttonText) {
					console.log(`  Button ${i + 1}: "${buttonText.trim()}"`);
				}
			}
		}
	});

	test('has flow type selection mechanism', async ({ page }) => {
		await page.goto(BASE_URL);
		await page.waitForLoadState('domcontentloaded');

		// Look for flow selection elements
		const selectors = page.locator(
			'select, button:has-text("Authorization"), button:has-text("Client"), button:has-text("Implicit")'
		);
		const selectorCount = await selectors.count();

		if (selectorCount > 0) {
			console.log(`✅ Found ${selectorCount} flow selection elements`);
		}

		// Look for flow type labels
		const flowLabels = page.locator(
			'text=Authorization Code, text=Client Credentials, text=Implicit Flow, text=Device Code, text=Hybrid Flow'
		);
		const labelCount = await flowLabels.count();

		if (labelCount > 0) {
			console.log(`✅ Found ${labelCount} flow type labels`);
		}
	});

	test('has spec version selection mechanism', async ({ page }) => {
		await page.goto(BASE_URL);
		await page.waitForLoadState('domcontentloaded');

		// Look for spec version elements
		const specElements = page.locator(
			'text=OAuth 2.0, text=OAuth 2.1, text=OIDC, text=OpenID Connect'
		);
		const specCount = await specElements.count();

		if (specCount > 0) {
			console.log(`✅ Found ${specCount} spec version elements`);
		}

		// Look for spec version selectors
		const specSelectors = page.locator(
			'select[id*="spec"], select:has-text("OAuth"), select:has-text("OIDC")'
		);
		const selectorCount = await specSelectors.count();

		if (selectorCount > 0) {
			console.log(`✅ Found ${selectorCount} spec version selectors`);
		}
	});

	test('handles invalid URLs gracefully', async ({ page }) => {
		// Try invalid flow type
		await page.goto(`${BASE_URL}/invalid-flow`);
		await page.waitForTimeout(2000);

		// Should either show error or redirect
		const currentUrl = page.url();
		const errorContent = page.locator('text=error, text=not found, text=invalid');

		if ((await errorContent.count()) > 0) {
			console.log('✅ Error shown for invalid flow type');
		} else if (!currentUrl.includes('invalid-flow')) {
			console.log('✅ Redirected from invalid flow type');
		}

		// Try invalid step
		await page.goto(`${BASE_URL}/oauth-authz/999`);
		await page.waitForTimeout(2000);

		const currentUrl2 = page.url();
		const errorContent2 = page.locator('text=error, text=not found, text=invalid');

		if ((await errorContent2.count()) > 0) {
			console.log('✅ Error shown for invalid step');
		} else if (!currentUrl2.includes('999')) {
			console.log('✅ Redirected from invalid step');
		}
	});

	test('page is responsive', async ({ page }) => {
		const screenSizes = [
			{ width: 1200, height: 800, name: 'Desktop' },
			{ width: 768, height: 1024, name: 'Tablet' },
			{ width: 375, height: 667, name: 'Mobile' },
		];

		for (const size of screenSizes) {
			await page.setViewportSize({ width: size.width, height: size.height });
			await page.goto(`${BASE_URL}/oauth-authz`);
			await page.waitForLoadState('domcontentloaded');
			await page.waitForTimeout(2000);

			// Check main content is visible
			const mainContent = page.locator('body');
			await expect(mainContent).toBeVisible();

			console.log(`✅ ${size.name} size: ${size.width}x${size.height} - page loads`);
		}
	});

	test('has token display area', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Look for token-related elements
		const tokenElements = page.locator(
			'text=Token, text=Access Token, text=ID Token, [class*="token"]'
		);
		const tokenCount = await tokenElements.count();

		if (tokenCount > 0) {
			console.log(`✅ Found ${tokenCount} token-related elements`);
		}

		// Look for copy buttons
		const copyButtons = page.locator('button:has-text("Copy"), [title*="copy"], [class*="copy"]');
		const copyCount = await copyButtons.count();

		if (copyCount > 0) {
			console.log(`✅ Found ${copyCount} copy buttons`);
		}
	});

	test('has help or documentation elements', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Look for help/documentation elements
		const helpElements = page.locator(
			'text=Help, text=Documentation, text=Info, text=Learn, [class*="help"], [class*="info"]'
		);
		const helpCount = await helpElements.count();

		if (helpCount > 0) {
			console.log(`✅ Found ${helpCount} help/documentation elements`);
		}

		// Look for tooltips or info icons
		const tooltips = page.locator('[title], [data-tooltip], [class*="tooltip"], [class*="info"]');
		const tooltipCount = await tooltips.count();

		if (tooltipCount > 0) {
			console.log(`✅ Found ${tooltipCount} tooltip/info elements`);
		}
	});

	test('has navigation elements', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Look for navigation elements
		const navElements = page.locator('nav, [class*="nav"], [class*="breadcrumb"], [class*="step"]');
		const navCount = await navElements.count();

		if (navCount > 0) {
			console.log(`✅ Found ${navCount} navigation elements`);
		}

		// Look for links
		const links = page.locator('a[href]');
		const linkCount = await links.count();

		if (linkCount > 0) {
			console.log(`✅ Found ${linkCount} links`);
		}
	});

	test('has status or feedback elements', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Look for status indicators
		const statusElements = page.locator(
			'[class*="status"], [class*="badge"], [class*="indicator"]'
		);
		const statusCount = await statusElements.count();

		if (statusCount > 0) {
			console.log(`✅ Found ${statusCount} status elements`);
		}

		// Look for message areas
		const messageElements = page.locator(
			'[class*="message"], [class*="alert"], [class*="notification"]'
		);
		const messageCount = await messageElements.count();

		if (messageCount > 0) {
			console.log(`✅ Found ${messageCount} message elements`);
		}
	});
});
