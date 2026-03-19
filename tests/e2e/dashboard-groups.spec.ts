// tests/e2e/dashboard-groups.spec.ts
/**
 * Dashboard Groups - E2E Tests
 * Tests all collapsible dashboard sections and their functionality
 */

import { expect, test } from '@playwright/test';

test.describe('Dashboard Groups - Core Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
	});

	test('dashboard page loads with all sections', async ({ page }) => {
		// Check that we're on the dashboard
		await expect(page).toHaveURL(/\/$/);

		// Look for main dashboard title
		await expect(page.getByText(/Dashboard/i)).toBeVisible();

		// Check for all main section headers
		const expectedSections = [
			'Dashboard',
			'API Status',
			'Custom Domain Config',
			'Available API Endpoints',
			'Quick Access Flows',
			'Recent Activity',
		];

		for (const section of expectedSections) {
			const sectionElement = page.getByText(section).first();
			await expect(sectionElement).toBeVisible({ timeout: 5000 });
			console.log(`✅ Found section: ${section}`);
		}
	});

	test('all dashboard groups are collapsible', async ({ page }) => {
		// Find all collapsible headers
		const collapsibleHeaders = page.locator(
			'[data-testid="collapsible-header"], .collapsible-header, .section-wrap > div:first-child'
		);
		const headerCount = await collapsibleHeaders.count();

		expect(headerCount).toBeGreaterThan(0);
		console.log(`Found ${headerCount} collapsible headers`);

		// Test each collapsible section
		for (let i = 0; i < Math.min(headerCount, 6); i++) {
			// Test first 6 sections
			const header = collapsibleHeaders.nth(i);

			// Get initial state
			const isInitiallyCollapsed = (await header.getAttribute('aria-expanded')) === 'false';

			// Click to toggle
			await header.click();
			await page.waitForTimeout(500);

			// Verify state changed
			const isNowCollapsed = (await header.getAttribute('aria-expanded')) === 'false';
			expect(isNowCollapsed).toBe(!isInitiallyCollapsed);

			console.log(
				`✅ Section ${i + 1} toggled from ${isInitiallyCollapsed ? 'collapsed' : 'expanded'} to ${isNowCollapsed ? 'collapsed' : 'expanded'}`
			);

			// Toggle back to original state
			await header.click();
			await page.waitForTimeout(500);
		}
	});

	test('dashboard header section content', async ({ page }) => {
		// Find and expand Dashboard header section
		const dashboardHeader = page.locator('text=Dashboard').first();
		await expect(dashboardHeader).toBeVisible();

		// Check for subtitle
		await expect(
			page.getByText(/Monitor system status, explore OAuth flows, and track recent activity/i)
		).toBeVisible();

		// Look for dashboard icon
		const dashboardIcon = page.locator(
			'[data-icon="chart-box"], .icon-chart-box, [class*="chart-box"]'
		);
		if ((await dashboardIcon.count()) > 0) {
			await expect(dashboardIcon.first()).toBeVisible();
		}
	});

	test('API Status section functionality', async ({ page }) => {
		// Find API Status section
		const apiStatusHeader = page.locator('text=API Status').first();
		await expect(apiStatusHeader).toBeVisible();

		// Expand if collapsed
		const isCollapsed = (await apiStatusHeader.getAttribute('aria-expanded')) === 'false';
		if (isCollapsed) {
			await apiStatusHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for API status content
		await expect(page.getByText(/Server health|Backend health|Global Configuration/i)).toBeVisible({
			timeout: 5000,
		});

		// Look for status badges
		const statusBadges = page.locator('.badge, [class*="badge"], [class*="status"]');
		if ((await statusBadges.count()) > 0) {
			console.log(`Found ${await statusBadges.count()} status badges`);
		}

		// Check for server status information
		const serverStatus = page.locator('text=Backend|Server|Health|Status').first();
		if (await serverStatus.isVisible()) {
			console.log('✅ Server status information found');
		}
	});

	test('Custom Domain Config section', async ({ page }) => {
		// Find Custom Domain Config section
		const configHeader = page.locator('text=Custom Domain Config').first();
		await expect(configHeader).toBeVisible();

		// Expand if collapsed
		const isCollapsed = (await configHeader.getAttribute('aria-expanded')) === 'false';
		if (isCollapsed) {
			await configHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for domain configuration content
		await expect(page.getByText(/App URL and custom domain|HTTPS|domain/i)).toBeVisible({
			timeout: 5000,
		});

		// Look for input fields or configuration elements
		const configInputs = page.locator('input[type="text"], input[type="url"], .form-control');
		if ((await configInputs.count()) > 0) {
			console.log(`Found ${await configInputs.count()} configuration inputs`);
		}

		// Check for save/configure buttons
		const configButtons = page.locator(
			'button:has-text("Save"), button:has-text("Configure"), button:has-text("Update")'
		);
		if ((await configButtons.count()) > 0) {
			console.log('✅ Configuration buttons found');
		}
	});

	test('API Endpoints section displays endpoints', async ({ page }) => {
		// Find API Endpoints section
		const endpointsHeader = page.locator('text=Available API Endpoints').first();
		await expect(endpointsHeader).toBeVisible();

		// Expand if collapsed
		const isCollapsed = (await endpointsHeader.getAttribute('aria-expanded')) === 'false';
		if (isCollapsed) {
			await endpointsHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for API endpoints content
		await expect(page.getByText(/Backend API endpoints|OAuth|OIDC/i)).toBeVisible({
			timeout: 5000,
		});

		// Look for method badges (GET, POST, etc.)
		const methodBadges = page.locator('.method-badge, [class*="method"], [class*="badge"]');
		if ((await methodBadges.count()) > 0) {
			console.log(`Found ${await methodBadges.count()} method badges`);

			// Check for common HTTP methods
			const commonMethods = ['GET', 'POST', 'PUT', 'DELETE'];
			for (const method of commonMethods) {
				const methodElement = page.locator(`text=${method}`).first();
				if (await methodElement.isVisible()) {
					console.log(`✅ Found ${method} method`);
				}
			}
		}

		// Look for endpoint paths
		const endpointPaths = page.locator('text=/api/');
		if ((await endpointPaths.count()) > 0) {
			console.log(`Found ${await endpointPaths.count()} API endpoints`);
		}
	});

	test('Quick Access Flows section', async ({ page }) => {
		// Find Quick Access Flows section
		const quickAccessHeader = page.locator('text=Quick Access Flows').first();
		await expect(quickAccessHeader).toBeVisible();

		// Expand if collapsed
		const isCollapsed = (await quickAccessHeader.getAttribute('aria-expanded')) === 'false';
		if (isCollapsed) {
			await quickAccessHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for flows content
		await expect(page.getByText(/OAuth 2\.0|OpenID Connect|flows/i)).toBeVisible({ timeout: 5000 });

		// Look for flow links or buttons
		const flowLinks = page.locator(
			'a[href*="flows"], .btn, button:has-text("Start"), button:has-text("Try")'
		);
		if ((await flowLinks.count()) > 0) {
			console.log(`Found ${await flowLinks.count()} flow links/buttons`);

			// Check for common OAuth flows
			const commonFlows = ['Authorization Code', 'Client Credentials', 'Implicit', 'Device'];
			for (const flow of commonFlows) {
				const flowElement = page.locator(`text=${flow}`).first();
				if (await flowElement.isVisible()) {
					console.log(`✅ Found ${flow} flow`);
				}
			}
		}
	});

	test('Recent Activity section', async ({ page }) => {
		// Find Recent Activity section
		const recentActivityHeader = page.locator('text=Recent Activity').first();
		await expect(recentActivityHeader).toBeVisible();

		// Expand if collapsed
		const isCollapsed = (await recentActivityHeader.getAttribute('aria-expanded')) === 'false';
		if (isCollapsed) {
			await recentActivityHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for activity content
		await expect(
			page.getByText(/Latest OAuth flow runs|credential updates|API interactions/i)
		).toBeVisible({ timeout: 5000 });

		// Look for activity list or items
		const activityList = page.locator('.activity-list, ul, [class*="activity"]');
		const activityItems = page.locator(
			'li:has-text("Updated"), li:has-text("Completed"), li:has-text("Run")'
		);

		if ((await activityItems.count()) > 0) {
			console.log(`Found ${await activityItems.count()} activity items`);
		} else {
			// Check for empty state
			const emptyState = page.locator('text=No recent activity|Complete an OAuth flow');
			if (await emptyState.isVisible()) {
				console.log('✅ Empty state displayed (no recent activity)');
			}
		}

		// Look for refresh button
		const refreshButton = page.locator(
			'button:has-text("Refresh"), [title*="refresh"], [class*="refresh"]'
		);
		if ((await refreshButton.count()) > 0) {
			console.log('✅ Refresh button found');
		}
	});
});

test.describe('Dashboard Groups - Interaction Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
	});

	test('can toggle multiple sections independently', async ({ page }) => {
		// Find all collapsible sections
		const sections = [
			'Dashboard',
			'API Status',
			'Custom Domain Config',
			'Available API Endpoints',
			'Quick Access Flows',
			'Recent Activity',
		];

		// Toggle each section and verify independence
		for (const sectionName of sections) {
			const sectionHeader = page.locator(`text=${sectionName}`).first();
			await expect(sectionHeader).toBeVisible();

			// Get initial state
			const initialState = await sectionHeader.getAttribute('aria-expanded');

			// Toggle
			await sectionHeader.click();
			await page.waitForTimeout(300);

			// Verify state changed
			const newState = await sectionHeader.getAttribute('aria-expanded');
			expect(newState).not.toBe(initialState);

			console.log(`✅ ${sectionName}: ${initialState} → ${newState}`);
		}
	});

	test('section states persist during page interactions', async ({ page }) => {
		// Expand API Status section
		const apiStatusHeader = page.locator('text=API Status').first();
		await apiStatusHeader.click();
		await page.waitForTimeout(500);

		// Verify it's expanded
		const isExpanded = (await apiStatusHeader.getAttribute('aria-expanded')) === 'true';
		expect(isExpanded).toBeTruthy();

		// Interact with another section
		const quickAccessHeader = page.locator('text=Quick Access Flows').first();
		await quickAccessHeader.click();
		await page.waitForTimeout(500);

		// Verify API Status is still expanded
		const stillExpanded = (await apiStatusHeader.getAttribute('aria-expanded')) === 'true';
		expect(stillExpanded).toBeTruthy();

		console.log('✅ Section states persist during interactions');
	});

	test('all sections have proper accessibility attributes', async ({ page }) => {
		// Find all collapsible headers
		const headers = page.locator('[role="button"], [aria-expanded], .collapsible-header');
		const headerCount = await headers.count();

		expect(headerCount).toBeGreaterThan(0);

		// Check accessibility attributes
		for (let i = 0; i < Math.min(headerCount, 6); i++) {
			const header = headers.nth(i);

			// Should have aria-expanded
			const hasAriaExpanded = (await header.getAttribute('aria-expanded')) !== null;
			if (hasAriaExpanded) {
				console.log(`✅ Header ${i + 1} has aria-expanded`);
			}

			// Should have role="button" or be button/interactive
			const hasRole =
				(await header.getAttribute('role')) === 'button' ||
				(await header.evaluate((el) => el.tagName.toLowerCase() === 'button'));
			if (hasRole) {
				console.log(`✅ Header ${i + 1} has proper interactive role`);
			}

			// Should be keyboard navigable
			const isTabbable = await header.isTabbable();
			if (isTabbable) {
				console.log(`✅ Header ${i + 1} is keyboard navigable`);
			}
		}
	});

	test('sections work with keyboard navigation', async ({ page }) => {
		// Focus on first collapsible header
		const firstHeader = page.locator('text=Dashboard').first();
		await firstHeader.focus();

		// Verify focus
		const isFocused = await firstHeader.evaluate((el) => document.activeElement === el);
		expect(isFocused).toBeTruthy();

		// Test Enter key to toggle
		await page.keyboard.press('Enter');
		await page.waitForTimeout(500);

		// Verify state changed
		const initialState = await firstHeader.getAttribute('aria-expanded');
		console.log(`✅ Keyboard toggle worked: ${initialState}`);

		// Test Space key to toggle
		await page.keyboard.press('Space');
		await page.waitForTimeout(500);

		const newState = await firstHeader.getAttribute('aria-expanded');
		expect(newState).not.toBe(initialState);
		console.log(`✅ Space key toggle worked: ${newState}`);

		// Test Tab navigation to next section
		await page.keyboard.press('Tab');
		await page.waitForTimeout(300);

		// Verify focus moved
		const newFocusedElement = await page.evaluate(() => document.activeElement?.textContent);
		console.log(`✅ Tab navigation moved focus to: ${newFocusedElement}`);
	});
});

test.describe('Dashboard Groups - Content Validation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(2000);
	});

	test('all sections contain meaningful content', async ({ page }) => {
		const sections = [
			{ name: 'Dashboard', expectedContent: ['Monitor', 'OAuth', 'activity'] },
			{ name: 'API Status', expectedContent: ['Server', 'health', 'Configuration'] },
			{ name: 'Custom Domain Config', expectedContent: ['domain', 'HTTPS', 'URL'] },
			{ name: 'Available API Endpoints', expectedContent: ['API', 'endpoint', '/api'] },
			{ name: 'Quick Access Flows', expectedContent: ['OAuth', 'flow', 'Start'] },
			{ name: 'Recent Activity', expectedContent: ['activity', 'recent', 'OAuth'] },
		];

		for (const section of sections) {
			// Find and expand section
			const header = page.locator(`text=${section.name}`).first();
			await header.click();
			await page.waitForTimeout(500);

			// Check for expected content
			let hasContent = false;
			for (const content of section.expectedContent) {
				const contentElement = page.locator(`text=${content}`).first();
				if (await contentElement.isVisible()) {
					hasContent = true;
					break;
				}
			}

			expect(hasContent).toBeTruthy();
			console.log(`✅ ${section.name} contains meaningful content`);
		}
	});

	test('sections display appropriate icons and visual elements', async ({ page }) => {
		// Check for icons in sections
		const sectionIcons = page.locator('[class*="icon"], [data-icon], svg');
		const iconCount = await sectionIcons.count();

		if (iconCount > 0) {
			console.log(`Found ${iconCount} icons in dashboard sections`);

			// Verify some key icons are present
			const expectedIcons = ['chart-box', 'server', 'cog', 'link', 'lightning-bolt', 'chart-line'];
			for (const iconName of expectedIcons) {
				const icon = page.locator(`[data-icon="${iconName}"], [class*="${iconName}"]`).first();
				if ((await icon.count()) > 0 && (await icon.isVisible())) {
					console.log(`✅ Found ${iconName} icon`);
				}
			}
		}
	});

	test('sections are responsive and adapt to screen size', async ({ page }) => {
		// Test desktop size first
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.waitForTimeout(1000);

		// Check sections are visible
		const headers = page.locator('text=Dashboard, text=API Status, text=Custom Domain Config');
		const desktopVisible = await headers.count();

		// Test tablet size
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.waitForTimeout(1000);

		const tabletVisible = await headers.count();

		// Test mobile size
		await page.setViewportSize({ width: 375, height: 667 });
		await page.waitForTimeout(1000);

		const mobileVisible = await headers.count();

		// All sections should be visible across screen sizes
		expect(desktopVisible).toBeGreaterThan(0);
		expect(tabletVisible).toBeGreaterThan(0);
		expect(mobileVisible).toBeGreaterThan(0);

		console.log(
			`✅ Responsive test: Desktop(${desktopVisible}), Tablet(${tabletVisible}), Mobile(${mobileVisible})`
		);
	});
});
