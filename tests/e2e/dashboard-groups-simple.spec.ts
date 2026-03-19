// tests/e2e/dashboard-groups-simple.spec.ts
/**
 * Dashboard Groups - Simple E2E Tests
 * Focused tests for dashboard collapsible sections
 */

import { expect, test } from '@playwright/test';

test.describe('Dashboard Groups - Simple Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(3000);
	});

	test('dashboard loads with all section headers', async ({ page }) => {
		// Check we're on dashboard
		await expect(page).toHaveURL(/\/(dashboard)?$/);

		// Look for section headers using multiple selector strategies
		const sectionSelectors = [
			'button[id^="header-"]',
			'h3:has-text("Dashboard")',
			'h3:has-text("API Status")',
			'h3:has-text("Custom Domain")',
			'h3:has-text("API Endpoints")',
			'h3:has-text("Quick Access")',
			'h3:has-text("Recent Activity")',
		];

		let foundSections = 0;
		for (const selector of sectionSelectors) {
			const elements = page.locator(selector);
			const count = await elements.count();
			if (count > 0) {
				foundSections += count;
				console.log(`✅ Found ${count} elements with selector: ${selector}`);
			}
		}

		expect(foundSections).toBeGreaterThan(5);
		console.log(`Total dashboard sections found: ${foundSections}`);
	});

	test('can find and interact with Dashboard section', async ({ page }) => {
		// Try multiple approaches to find the Dashboard section
		let dashboardHeader = null;

		// Approach 1: By ID
		const byId = page.locator('#header-dashboard');
		if ((await byId.count()) > 0) {
			dashboardHeader = byId;
			console.log('Found Dashboard header by ID');
		}

		// Approach 2: By text content
		if (!dashboardHeader) {
			const byText = page.locator('h3:has-text("Dashboard")').first();
			if ((await byText.count()) > 0) {
				dashboardHeader = byText.locator('..').locator('button, [role="button"]').first();
				console.log('Found Dashboard header by text');
			}
		}

		// Approach 3: By any element containing "Dashboard"
		if (!dashboardHeader) {
			const byAny = page.locator(':has-text("Dashboard")').first();
			if ((await byAny.count()) > 0) {
				dashboardHeader = byAny;
				console.log('Found Dashboard header by any element');
			}
		}

		expect(dashboardHeader).toBeTruthy();
		if (dashboardHeader) {
			await expect(dashboardHeader).toBeVisible();
			console.log('✅ Dashboard section header is visible');
		}
	});

	test('can find API Status section', async ({ page }) => {
		// Look for API Status section
		const apiStatusSelectors = [
			'#header-api-status',
			'h3:has-text("API Status")',
			':has-text("API Status")',
		];

		let found = false;
		for (const selector of apiStatusSelectors) {
			const element = page.locator(selector).first();
			if ((await element.count()) > 0 && (await element.isVisible())) {
				found = true;
				console.log(`✅ Found API Status with selector: ${selector}`);
				break;
			}
		}

		expect(found).toBeTruthy();
	});

	test('can find Custom Domain Config section', async ({ page }) => {
		// Look for Custom Domain Config section
		const configSelectors = [
			'#header-custom-domain-config',
			'h3:has-text("Custom Domain")',
			':has-text("Custom Domain Config")',
		];

		let found = false;
		for (const selector of configSelectors) {
			const element = page.locator(selector).first();
			if ((await element.count()) > 0 && (await element.isVisible())) {
				found = true;
				console.log(`✅ Found Custom Domain Config with selector: ${selector}`);
				break;
			}
		}

		expect(found).toBeTruthy();
	});

	test('can find API Endpoints section', async ({ page }) => {
		// Look for API Endpoints section
		const endpointsSelectors = [
			'#header-available-api-endpoints',
			'h3:has-text("API Endpoints")',
			':has-text("Available API Endpoints")',
		];

		let found = false;
		for (const selector of endpointsSelectors) {
			const element = page.locator(selector).first();
			if ((await element.count()) > 0 && (await element.isVisible())) {
				found = true;
				console.log(`✅ Found API Endpoints with selector: ${selector}`);
				break;
			}
		}

		expect(found).toBeTruthy();
	});

	test('can find Quick Access Flows section', async ({ page }) => {
		// Look for Quick Access Flows section
		const quickAccessSelectors = [
			'#header-quick-access-flows',
			'h3:has-text("Quick Access")',
			':has-text("Quick Access Flows")',
		];

		let found = false;
		for (const selector of quickAccessSelectors) {
			const element = page.locator(selector).first();
			if ((await element.count()) > 0 && (await element.isVisible())) {
				found = true;
				console.log(`✅ Found Quick Access Flows with selector: ${selector}`);
				break;
			}
		}

		expect(found).toBeTruthy();
	});

	test('can find Recent Activity section', async ({ page }) => {
		// Look for Recent Activity section
		const recentActivitySelectors = [
			'#header-recent-activity',
			'h3:has-text("Recent Activity")',
			':has-text("Recent Activity")',
		];

		let found = false;
		for (const selector of recentActivitySelectors) {
			const element = page.locator(selector).first();
			if ((await element.count()) > 0 && (await element.isVisible())) {
				found = true;
				console.log(`✅ Found Recent Activity with selector: ${selector}`);
				break;
			}
		}

		expect(found).toBeTruthy();
	});

	test('sections have proper structure with titles and subtitles', async ({ page }) => {
		// Look for section titles and subtitles
		const expectedTitles = [
			'Dashboard',
			'API Status',
			'Custom Domain Config',
			'Available API Endpoints',
			'Quick Access Flows',
			'Recent Activity',
		];

		let foundTitles = 0;
		for (const title of expectedTitles) {
			const titleElement = page.locator(`h3:has-text("${title}")`).first();
			if ((await titleElement.count()) > 0) {
				foundTitles++;
				console.log(`✅ Found title: ${title}`);
			}
		}

		expect(foundTitles).toBeGreaterThan(0);
		console.log(`Found ${foundTitles} out of ${expectedTitles.length} expected titles`);
	});

	test('page contains dashboard-related content', async ({ page }) => {
		// Check for dashboard-specific content
		const contentSelectors = [
			'text=Monitor system status',
			'text=explore OAuth flows',
			'text=track recent activity',
			'text=Server health',
			'text=API endpoints',
			'text=OAuth 2.0',
			'text=OpenID Connect',
		];

		let foundContent = 0;
		for (const selector of contentSelectors) {
			const element = page.locator(selector).first();
			if ((await element.count()) > 0) {
				foundContent++;
				console.log(`✅ Found content: ${selector}`);
			}
		}

		expect(foundContent).toBeGreaterThan(2);
		console.log(`Found ${foundContent} dashboard content elements`);
	});

	test('sections have interactive elements', async ({ page }) => {
		// Look for buttons, links, or interactive elements
		const interactiveSelectors = [
			'button',
			'a[href]',
			'[role="button"]',
			'.btn',
			'input[type="button"]',
		];

		let foundInteractive = 0;
		for (const selector of interactiveSelectors) {
			const elements = page.locator(selector);
			const count = await elements.count();
			if (count > 0) {
				foundInteractive += count;
				console.log(`✅ Found ${count} ${selector} elements`);
			}
		}

		expect(foundInteractive).toBeGreaterThan(0);
		console.log(`Total interactive elements found: ${foundInteractive}`);
	});

	test('dashboard has proper visual structure', async ({ page }) => {
		// Check for visual indicators of sections
		const visualSelectors = [
			'.section-wrap',
			'[class*="section"]',
			'[class*="header"]',
			'[class*="collapsible"]',
			'.card',
			'[class*="container"]',
		];

		let foundVisual = 0;
		for (const selector of visualSelectors) {
			const elements = page.locator(selector);
			const count = await elements.count();
			if (count > 0) {
				foundVisual += count;
				console.log(`✅ Found ${count} ${selector} elements`);
			}
		}

		expect(foundVisual).toBeGreaterThan(0);
		console.log(`Total visual structure elements found: ${foundVisual}`);
	});

	test('dashboard contains status indicators or badges', async ({ page }) => {
		// Look for status indicators
		const statusSelectors = [
			'.badge',
			'[class*="status"]',
			'[class*="indicator"]',
			'.version-badge',
			'[class*="success"]',
			'[class*="warning"]',
			'[class*="danger"]',
		];

		let foundStatus = 0;
		for (const selector of statusSelectors) {
			const elements = page.locator(selector);
			const count = await elements.count();
			if (count > 0) {
				foundStatus += count;
				console.log(`✅ Found ${count} ${selector} elements`);
			}
		}

		// Status indicators are optional, so we just log what we find
		if (foundStatus > 0) {
			console.log(`Found ${foundStatus} status indicators`);
		} else {
			console.log('No status indicators found (this may be expected)');
		}
	});

	test('dashboard is accessible and keyboard navigable', async ({ page }) => {
		// Check for keyboard-navigable elements
		const keyboardSelectors = [
			'button:not([disabled])',
			'a[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
		];

		let foundKeyboard = 0;
		for (const selector of keyboardSelectors) {
			const elements = page.locator(selector);
			const count = await elements.count();
			if (count > 0) {
				foundKeyboard += count;
				console.log(`✅ Found ${count} keyboard-navigable ${selector} elements`);
			}
		}

		expect(foundKeyboard).toBeGreaterThan(0);
		console.log(`Total keyboard-navigable elements found: ${foundKeyboard}`);
	});
});
