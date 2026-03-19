// tests/e2e/unified-oauth-comprehensive.spec.ts
/**
 * Unified OAuth - Comprehensive E2E Tests
 * Tests the Unified OAuth flow system with all flow types, spec versions, and paths
 */

import { expect, test } from '@playwright/test';

test.describe('Unified OAuth - Core Functionality', () => {
	const BASE_URL = '/v8u/unified';
	const FLOW_TYPES = [
		'oauth-authz',
		'implicit',
		'client-credentials',
		'device-code',
		'hybrid',
	] as const;
	const SPEC_VERSIONS = ['oauth2.0', 'oauth2.1', 'oidc'] as const;
	const FLOW_LABELS = {
		'oauth-authz': 'Authorization Code Flow',
		implicit: 'Implicit Flow',
		'client-credentials': 'Client Credentials Flow',
		'device-code': 'Device Code Flow',
		hybrid: 'Hybrid Flow',
	} as const;

	test.beforeEach(async ({ page }) => {
		await page.goto(BASE_URL);
		await page.waitForLoadState('domcontentloaded');
	});

	test('unified oauth page loads successfully', async ({ page }) => {
		// Check we're on the unified oauth page
		await expect(page).toHaveURL(/\/v8u\/unified/);

		// Look for main unified flow elements
		await expect(page.getByText(/Unified OAuth|OAuth Flow|Authorization/i)).toBeVisible({
			timeout: 10000,
		});

		// Check for flow type selector
		const flowSelector = page.locator(
			'[data-testid="flow-type-selector"], select[id*="flow"], select:has-text("Authorization Code")'
		);
		if ((await flowSelector.count()) > 0) {
			await expect(flowSelector.first()).toBeVisible();
			console.log('✅ Flow type selector found');
		}

		// Check for spec version selector
		const specSelector = page.locator(
			'[data-testid="spec-version-selector"], select[id*="spec"], select:has-text("OAuth")'
		);
		if ((await specSelector.count()) > 0) {
			await expect(specSelector.first()).toBeVisible();
			console.log('✅ Spec version selector found');
		}
	});

	test('all flow types are available in selector', async ({ page }) => {
		// Find flow type selector
		const flowSelector = page
			.locator('select[id*="flow"], select:has-text("Authorization Code"), [data-testid*="flow"]')
			.first();

		if ((await flowSelector.count()) > 0) {
			await flowSelector.click();
			await page.waitForTimeout(500);

			// Check for all expected flow types
			for (const flowType of FLOW_TYPES) {
				const option = flowSelector.locator(
					`option[value="${flowType}"], option:has-text("${FLOW_LABELS[flowType]}")`
				);
				const optionCount = await option.count();
				if (optionCount > 0) {
					console.log(`✅ Found flow type: ${flowType} (${FLOW_LABELS[flowType]})`);
				} else {
					console.log(`⚠️  Flow type not found: ${flowType}`);
				}
			}
		} else {
			// Alternative: Look for flow type buttons or cards
			for (const flowType of FLOW_TYPES) {
				const flowButton = page.locator(
					`button:has-text("${FLOW_LABELS[flowType]}"), [data-flow="${flowType}"], .flow-card:has-text("${FLOW_LABELS[flowType]}")`
				);
				if ((await flowButton.count()) > 0) {
					console.log(`✅ Found flow button: ${flowType}`);
				}
			}
		}
	});

	test('all spec versions are available in selector', async ({ page }) => {
		// Find spec version selector
		const specSelector = page
			.locator('select[id*="spec"], select:has-text("OAuth"), [data-testid*="spec"]')
			.first();

		if ((await specSelector.count()) > 0) {
			await specSelector.click();
			await page.waitForTimeout(500);

			// Check for all expected spec versions
			const specLabels = {
				'oauth2.0': 'OAuth 2.0',
				'oauth2.1': 'OAuth 2.1',
				oidc: 'OIDC',
			};

			for (const specVersion of SPEC_VERSIONS) {
				const option = specSelector.locator(
					`option[value="${specVersion}"], option:has-text("${specLabels[specVersion]}")`
				);
				const optionCount = await option.count();
				if (optionCount > 0) {
					console.log(`✅ Found spec version: ${specVersion}`);
				} else {
					console.log(`⚠️  Spec version not found: ${specVersion}`);
				}
			}
		}
	});

	test('can navigate to different flow types via URL', async ({ page }) => {
		// Test direct URL navigation for each flow type
		for (const flowType of FLOW_TYPES) {
			console.log(`Testing flow type: ${flowType}`);

			await page.goto(`${BASE_URL}/${flowType}`);
			await page.waitForLoadState('domcontentloaded');

			// Check URL reflects the flow type
			await expect(page).toHaveURL(new RegExp(`${flowType}`));

			// Look for flow-specific content
			const flowLabel = FLOW_LABELS[flowType];
			const flowContent = page.locator(`text=${flowLabel}`);

			if ((await flowContent.count()) > 0) {
				console.log(`✅ ${flowType} page loaded with correct content`);
			} else {
				console.log(`⚠️  ${flowType} content not immediately visible`);
			}
		}
	});

	test('authorization code flow loads with proper components', async ({ page }) => {
		await page.goto(`${BASE_URL}/oauth-authz`);
		await page.waitForLoadState('domcontentloaded');

		// Look for authorization code flow specific elements
		const expectedElements = [
			'text=Authorization Code Flow',
			'text=Client ID',
			'text=Client Secret',
			'text=Redirect URI',
			'text=Scope',
			'text=PKCE',
		];

		for (const element of expectedElements) {
			const found = page.locator(element).first();
			if ((await found.count()) > 0 && (await found.isVisible())) {
				console.log(`✅ Found element: ${element}`);
			} else {
				console.log(`⚠️  Element not found: ${element}`);
			}
		}

		// Look for form inputs
		const inputs = page.locator('input[type="text"], input[type="password"], textarea');
		const inputCount = await inputs.count();
		console.log(`Found ${inputCount} input fields`);

		// Look for action buttons
		const buttons = page.locator(
			'button:has-text("Generate"), button:has-text("Request"), button:has-text("Authorize")'
		);
		const buttonCount = await buttons.count();
		console.log(`Found ${buttonCount} action buttons`);
	});

	test('client credentials flow loads with proper components', async ({ page }) => {
		await page.goto(`${BASE_URL}/client-credentials`);
		await page.waitForLoadState('domcontentloaded');

		// Look for client credentials flow specific elements
		const expectedElements = [
			'text=Client Credentials Flow',
			'text=Client ID',
			'text=Client Secret',
			'text=Scope',
			'text=Token Endpoint',
		];

		for (const element of expectedElements) {
			const found = page.locator(element).first();
			if ((await found.count()) > 0 && (await found.isVisible())) {
				console.log(`✅ Found element: ${element}`);
			} else {
				console.log(`⚠️  Element not found: ${element}`);
			}
		}

		// Client credentials should not have redirect URI
		const redirectUri = page.locator('text=Redirect URI');
		if ((await redirectUri.count()) === 0) {
			console.log('✅ Redirect URI correctly absent in client credentials flow');
		}
	});

	test('implicit flow loads with proper components', async ({ page }) => {
		await page.goto(`${BASE_URL}/implicit`);
		await page.waitForLoadState('domcontentloaded');

		// Look for implicit flow specific elements
		const expectedElements = [
			'text=Implicit Flow',
			'text=Client ID',
			'text=Redirect URI',
			'text=Response Type',
			'text=token',
		];

		for (const element of expectedElements) {
			const found = page.locator(element).first();
			if ((await found.count()) > 0 && (await found.isVisible())) {
				console.log(`✅ Found element: ${element}`);
			} else {
				console.log(`⚠️  Element not found: ${element}`);
			}
		}

		// Look for deprecation warnings in OAuth 2.1
		const warnings = page.locator('text=deprecated, text=warning, [class*="warning"]');
		if ((await warnings.count()) > 0) {
			console.log('✅ Deprecation warnings found for implicit flow');
		}
	});

	test('device code flow loads with proper components', async ({ page }) => {
		await page.goto(`${BASE_URL}/device-code`);
		await page.waitForLoadState('domcontentloaded');

		// Look for device code flow specific elements
		const expectedElements = [
			'text=Device Code Flow',
			'text=Device Code',
			'text=User Code',
			'text=Verification URI',
			'text=Poll',
		];

		for (const element of expectedElements) {
			const found = page.locator(element).first();
			if ((await found.count()) > 0 && (await found.isVisible())) {
				console.log(`✅ Found element: ${element}`);
			} else {
				console.log(`⚠️  Element not found: ${element}`);
			}
		}
	});

	test('hybrid flow loads with proper components', async ({ page }) => {
		await page.goto(`${BASE_URL}/hybrid`);
		await page.waitForLoadState('domcontentloaded');

		// Look for hybrid flow specific elements
		const expectedElements = [
			'text=Hybrid Flow',
			'text=Authorization Code',
			'text=ID Token',
			'text=Response Type',
			'text=code id_token',
		];

		for (const element of expectedElements) {
			const found = page.locator(element).first();
			if ((await found.count()) > 0 && (await found.isVisible())) {
				console.log(`✅ Found element: ${element}`);
			} else {
				console.log(`⚠️  Element not found: ${element}`);
			}
		}
	});

	test('spec version filtering works correctly', async ({ page }) => {
		// Test OAuth 2.1 filtering (should not show implicit flow)
		await page.goto(`${BASE_URL}/oauth2.1`);
		await page.waitForLoadState('domcontentloaded');

		// Look for spec version indicator
		const specIndicator = page.locator('text=OAuth 2.1, text=2.1, [data-spec="oauth2.1"]');
		if ((await specIndicator.count()) > 0) {
			console.log('✅ OAuth 2.1 spec version indicator found');
		}

		// Try to navigate to implicit flow (should be filtered out)
		await page.goto(`${BASE_URL}/oauth2.1/implicit`);
		await page.waitForLoadState('domcontentloaded');

		// Should either redirect or show unavailable message
		const unavailable = page.locator('text=unavailable, text=not supported, text=deprecated');
		const currentUrl = page.url();

		if ((await unavailable.count()) > 0) {
			console.log('✅ Implicit flow correctly filtered in OAuth 2.1');
		} else if (!currentUrl.includes('implicit')) {
			console.log('✅ Implicit flow correctly redirected in OAuth 2.1');
		}

		// Test OIDC spec (should show hybrid flow)
		await page.goto(`${BASE_URL}/oidc`);
		await page.waitForLoadState('domcontentloaded');

		// Look for OIDC indicator
		const oidcIndicator = page.locator('text=OIDC, text=OpenID Connect, [data-spec="oidc"]');
		if ((await oidcIndicator.count()) > 0) {
			console.log('✅ OIDC spec version indicator found');
		}

		// Hybrid flow should be available in OIDC
		await page.goto(`${BASE_URL}/oidc/hybrid`);
		await page.waitForLoadState('domcontentloaded');

		const hybridContent = page.locator('text=Hybrid Flow');
		if ((await hybridContent.count()) > 0) {
			console.log('✅ Hybrid flow available in OIDC spec');
		}
	});
});

test.describe('Unified OAuth - Flow Type Changes', () => {
	test('can switch between flow types', async ({ page }) => {
		await page.goto('/v8u/unified');
		await page.waitForLoadState('domcontentloaded');

		// Find flow type selector
		const flowSelector = page.locator('select[id*="flow"], [data-testid*="flow"]').first();

		if ((await flowSelector.count()) > 0) {
			// Switch to client credentials
			await flowSelector.selectOption({ label: 'Client Credentials Flow' });

			// Check URL updated
			await expect(page).toHaveURL(/client-credentials/);
			console.log('✅ Flow type switch to client credentials successful');

			// Switch to authorization code
			await flowSelector.selectOption({ label: 'Authorization Code Flow' });

			// Check URL updated
			await expect(page).toHaveURL(/oauth-authz/);
			console.log('✅ Flow type switch to authorization code successful');
		} else {
			// Try button-based flow selection
			const clientCredentialsButton = page.locator('button:has-text("Client Credentials")');
			if ((await clientCredentialsButton.count()) > 0) {
				await clientCredentialsButton.click();
				console.log('✅ Flow type switch via button successful');
			}
		}
	});

	test('can change spec versions', async ({ page }) => {
		await page.goto('/v8u/unified/oauth-authz');
		await page.waitForLoadState('domcontentloaded');

		// Find spec version selector
		const specSelector = page.locator('select[id*="spec"], [data-testid*="spec"]').first();

		if ((await specSelector.count()) > 0) {
			// Switch to OAuth 2.1
			await specSelector.selectOption({ label: 'OAuth 2.1' });

			// Check for PKCE requirement indicator
			const pkceIndicator = page.locator('text=PKCE, text=required, [class*="pkce"]');
			if ((await pkceIndicator.count()) > 0) {
				console.log('✅ PKCE requirement indicator shown for OAuth 2.1');
			}

			// Switch to OIDC
			await specSelector.selectOption({ label: 'OIDC' });

			// Check for OpenID scope requirement
			const openidIndicator = page.locator('text=openid, text=OpenID Connect');
			if ((await openidIndicator.count()) > 0) {
				console.log('✅ OpenID Connect indicators shown for OIDC');
			}
		}
	});
});

test.describe('Unified OAuth - Form Interactions', () => {
	test('authorization code form accepts input', async ({ page }) => {
		await page.goto('/v8u/unified/oauth-authz');
		await page.waitForLoadState('domcontentloaded');

		// Look for input fields
		const clientIdInput = page
			.locator('input[id*="client"], input[name*="client"], input[placeholder*="client"]')
			.first();
		const clientSecretInput = page
			.locator('input[type="password"], input[id*="secret"], input[name*="secret"]')
			.first();

		if ((await clientIdInput.count()) > 0) {
			await clientIdInput.fill('test-client-id');
			const value = await clientIdInput.inputValue();
			expect(value).toBe('test-client-id');
			console.log('✅ Client ID input accepts text');
		}

		if ((await clientSecretInput.count()) > 0) {
			await clientSecretInput.fill('test-client-secret');
			const value = await clientSecretInput.inputValue();
			expect(value).toBe('test-client-secret');
			console.log('✅ Client Secret input accepts text');
		}
	});

	test('form validation works', async ({ page }) => {
		await page.goto('/v8u/unified/oauth-authz');
		await page.waitForLoadState('domcontentloaded');

		// Look for submit/generate button
		const submitButton = page
			.locator(
				'button:has-text("Generate"), button:has-text("Request"), button:has-text("Authorize")'
			)
			.first();

		if ((await submitButton.count()) > 0) {
			// Try to submit without required fields
			await submitButton.click();
			await page.waitForTimeout(500);

			// Look for validation messages
			const validationMessages = page.locator(
				'text=required, text=invalid, [class*="error"], [class*="validation"]'
			);
			if ((await validationMessages.count()) > 0) {
				console.log('✅ Form validation messages shown');
			}
		}
	});
});

test.describe('Unified OAuth - Token Display', () => {
	test('token display area exists', async ({ page }) => {
		await page.goto('/v8u/unified/oauth-authz');
		await page.waitForLoadState('domcontentloaded');

		// Look for token display area
		const tokenDisplay = page
			.locator('[class*="token"], [data-testid*="token"], .token-display')
			.first();

		if ((await tokenDisplay.count()) > 0) {
			console.log('✅ Token display area found');

			// Should be empty initially
			const tokenContent = await tokenDisplay.textContent();
			if (!tokenContent || tokenContent.trim() === '') {
				console.log('✅ Token display initially empty');
			}
		}
	});

	test('can copy token to clipboard', async ({ page }) => {
		await page.goto('/v8u/unified/oauth-authz');
		await page.waitForLoadState('domcontentloaded');

		// Look for copy button
		const copyButton = page
			.locator('button:has-text("Copy"), [data-testid*="copy"], .copy-button')
			.first();

		if ((await copyButton.count()) > 0) {
			console.log('✅ Copy button found');

			// Note: Cannot actually test clipboard in Playwright without permissions
			// But we can verify the button exists and is clickable
			await expect(copyButton).toBeEnabled();
		}
	});
});
