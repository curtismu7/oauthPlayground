// tests/e2e/dashboard-groups-targeted.spec.ts
/**
 * Dashboard Groups - Targeted E2E Tests
 * Tests all collapsible dashboard sections using correct component selectors
 */

import { expect, test } from '@playwright/test';

test.describe('Dashboard Groups - Targeted Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
	});

	test('dashboard page loads with all six main sections', async ({ page }) => {
		// Check that we're on the dashboard
		await expect(page).toHaveURL(/\/$/);

		// Look for the main dashboard sections using the CollapsibleHeader structure
		const sectionHeaders = page.locator('button[id^="header-"]');
		const headerCount = await sectionHeaders.count();

		expect(headerCount).toBe(6); // Should have exactly 6 sections
		console.log(`Found ${headerCount} dashboard sections`);

		// Verify specific section titles
		const expectedSections = [
			'dashboard',
			'api-status',
			'custom-domain-config',
			'available-api-endpoints',
			'quick-access-flows',
			'recent-activity',
		];

		for (const sectionId of expectedSections) {
			const header = page.locator(`#header-${sectionId}`);
			await expect(header).toBeVisible({ timeout: 5000 });
			console.log(`✅ Found section: ${sectionId}`);
		}
	});

	test('each section has proper CollapsibleHeader structure', async ({ page }) => {
		const sectionHeaders = page.locator('button[id^="header-"]');
		const headerCount = await sectionHeaders.count();

		for (let i = 0; i < headerCount; i++) {
			const header = sectionHeaders.nth(i);

			// Check for proper accessibility attributes
			await expect(header).toHaveAttribute('aria-expanded');
			await expect(header).toHaveAttribute('aria-controls');
			await expect(header).toHaveAttribute('id');

			// Check for proper role (should be button)
			const tagName = await header.evaluate((el) => el.tagName.toLowerCase());
			expect(tagName).toBe('button');

			// Check for header content structure
			const headerContent = header.locator('> div'); // HeaderContent
			const hasHeaderContent = (await headerContent.count()) > 0;
			expect(hasHeaderContent).toBeTruthy();

			// Check for title (h3)
			const title = header.locator('h3');
			const hasTitle = (await title.count()) > 0;
			expect(hasTitle).toBeTruthy();

			console.log(`✅ Section ${i + 1} has proper CollapsibleHeader structure`);
		}
	});

	test('all sections are collapsible and expandable', async ({ page }) => {
		const sectionHeaders = page.locator('button[id^="header-"]');
		const headerCount = await sectionHeaders.count();

		for (let i = 0; i < headerCount; i++) {
			const header = sectionHeaders.nth(i);
			const headerId = await header.getAttribute('id');

			// Get initial state
			const initialExpanded = await header.getAttribute('aria-expanded');
			const contentId = await header.getAttribute('aria-controls');

			// Verify content area exists
			if (contentId) {
				const content = page.locator(`#${contentId}`);
				await expect(content).toBeVisible();
			}

			// Click to toggle
			await header.click();
			await page.waitForTimeout(500);

			// Verify state changed
			const newExpanded = await header.getAttribute('aria-expanded');
			expect(newExpanded).not.toBe(initialExpanded);

			// Verify content visibility matches state
			if (contentId) {
				const content = page.locator(`#${contentId}`);
				const shouldBeVisible = newExpanded === 'true';

				if (shouldBeVisible) {
					// Content should be visible when expanded
					await expect(content).toBeVisible();
				} else {
					// Content should be hidden/height 0 when collapsed
					const maxHeight = await content.evaluate((el) => getComputedStyle(el).maxHeight);
					expect(maxHeight).toBe('0px');
				}
			}

			console.log(`✅ Section ${headerId}: ${initialExpanded} → ${newExpanded}`);

			// Toggle back to original state
			await header.click();
			await page.waitForTimeout(500);
		}
	});

	test('Dashboard section content validation', async ({ page }) => {
		const dashboardHeader = page.locator('#header-dashboard');
		const dashboardContent = page.locator('#content-dashboard');

		// Expand if collapsed
		const isExpanded = await dashboardHeader.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await dashboardHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for dashboard-specific content (subtitle is in header, not content)
		await expect(dashboardHeader).toContainText(
			/Monitor system status.*explore OAuth flows.*track recent activity/i
		);

		// Look for dashboard icon (chart-box)
		const icon = dashboardHeader.locator('svg, [data-icon], .icon');
		if ((await icon.count()) > 0) {
			console.log('✅ Dashboard section has icon');
		}
	});

	test('API Status section functionality', async ({ page }) => {
		const apiStatusHeader = page.locator('#header-api-status');
		const apiStatusContent = page.locator('#content-api-status');

		// Expand if collapsed
		const isExpanded = await apiStatusHeader.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await apiStatusHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for API status content
		await expect(apiStatusContent).toBeVisible();

		// Look for status indicators
		const statusElements = apiStatusContent.locator('.badge, [class*="status"], [class*="badge"]');
		if ((await statusElements.count()) > 0) {
			console.log(`Found ${await statusElements.count()} status indicators in API Status`);
		}

		// Look for configuration status
		const configStatus = apiStatusContent.locator('text=Configuration|Global|Ready|Missing');
		if ((await configStatus.count()) > 0) {
			console.log('✅ API Status shows configuration status');
		}
	});

	test('Custom Domain Config section', async ({ page }) => {
		const configHeader = page.locator('#header-custom-domain-config');
		const configContent = page.locator('#content-custom-domain-config');

		// Expand if collapsed
		const isExpanded = await configHeader.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await configHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for domain configuration content
		await expect(configContent).toBeVisible();
		await expect(configContent).toContainText(/App URL|custom domain|HTTPS/i);

		// Look for input fields
		const inputs = configContent.locator('input[type="text"], input[type="url"], .form-control');
		if ((await inputs.count()) > 0) {
			console.log(`Found ${await inputs.count()} configuration inputs`);
		}

		// Look for save/configure buttons
		const buttons = configContent.locator(
			'button:has-text("Save"), button:has-text("Configure"), button:has-text("Update")'
		);
		if ((await buttons.count()) > 0) {
			console.log('✅ Custom Domain Config has action buttons');
		}
	});

	test('API Endpoints section displays endpoints', async ({ page }) => {
		const endpointsHeader = page.locator('#header-available-api-endpoints');
		const endpointsContent = page.locator('#content-available-api-endpoints');

		// Expand if collapsed
		const isExpanded = await endpointsHeader.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await endpointsHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for API endpoints content
		await expect(endpointsContent).toBeVisible();
		await expect(endpointsContent).toContainText(/Backend API endpoints|OAuth|OIDC/i);

		// Look for method badges
		const methodBadges = endpointsContent.locator('.method-badge, [class*="method"]');
		if ((await methodBadges.count()) > 0) {
			console.log(`Found ${await methodBadges.count()} method badges`);

			// Check for common HTTP methods
			const commonMethods = ['GET', 'POST', 'PUT', 'DELETE'];
			for (const method of commonMethods) {
				const methodElement = endpointsContent.locator(`text=${method}`).first();
				if (await methodElement.isVisible()) {
					console.log(`✅ Found ${method} method`);
				}
			}
		}

		// Look for API paths
		const apiPaths = endpointsContent.locator('text=/api/');
		if ((await apiPaths.count()) > 0) {
			console.log(`Found ${await apiPaths.count()} API endpoints`);
		}
	});

	test('Quick Access Flows section', async ({ page }) => {
		const quickAccessHeader = page.locator('#header-quick-access-flows');
		const quickAccessContent = page.locator('#content-quick-access-flows');

		// Expand if collapsed
		const isExpanded = await quickAccessHeader.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await quickAccessHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for flows content
		await expect(quickAccessContent).toBeVisible();
		await expect(quickAccessContent).toContainText(/OAuth 2\.0|OpenID Connect|flows/i);

		// Look for flow links or buttons
		const flowLinks = quickAccessContent.locator('a[href*="flows"], .btn, button');
		if ((await flowLinks.count()) > 0) {
			console.log(`Found ${await flowLinks.count()} flow links/buttons`);

			// Check for common OAuth flows
			const commonFlows = ['Authorization Code', 'Client Credentials', 'Implicit', 'Device'];
			for (const flow of commonFlows) {
				const flowElement = quickAccessContent.locator(`text=${flow}`).first();
				if (await flowElement.isVisible()) {
					console.log(`✅ Found ${flow} flow`);
				}
			}
		}
	});

	test('Recent Activity section', async ({ page }) => {
		const recentActivityHeader = page.locator('#header-recent-activity');
		const recentActivityContent = page.locator('#content-recent-activity');

		// Expand if collapsed
		const isExpanded = await recentActivityHeader.getAttribute('aria-expanded');
		if (isExpanded === 'false') {
			await recentActivityHeader.click();
			await page.waitForTimeout(500);
		}

		// Check for activity content (subtitle is in header)
		await expect(recentActivityContent).toBeVisible();
		await expect(recentActivityHeader).toContainText(
			/Latest OAuth flow runs.*credential updates.*API interactions/i
		);

		// Look for activity items or empty state
		const activityItems = recentActivityContent.locator('li, .activity-item');
		const emptyState = recentActivityContent.locator(
			'text=No recent activity|Complete an OAuth flow'
		);

		if ((await activityItems.count()) > 0) {
			console.log(`Found ${await activityItems.count()} activity items`);
		} else if (await emptyState.isVisible()) {
			console.log('✅ Recent Activity shows empty state');
		}

		// Look for refresh functionality
		const refreshButton = recentActivityContent.locator(
			'button:has-text("Refresh"), [title*="refresh"]'
		);
		if ((await refreshButton.count()) > 0) {
			console.log('✅ Recent Activity has refresh button');
		}
	});

	test("section independence - toggling one doesn't affect others", async ({ page }) => {
		const sectionHeaders = page.locator('button[id^="header-"]');
		const headerCount = await sectionHeaders.count();

		// Get initial states of all sections
		const initialStates = [];
		for (let i = 0; i < headerCount; i++) {
			const header = sectionHeaders.nth(i);
			const state = await header.getAttribute('aria-expanded');
			initialStates.push(state);
		}

		// Toggle the first section
		const firstHeader = sectionHeaders.first();
		await firstHeader.click();
		await page.waitForTimeout(500);

		// Verify only the first section changed
		for (let i = 0; i < headerCount; i++) {
			const header = sectionHeaders.nth(i);
			const currentState = await header.getAttribute('aria-expanded');

			if (i === 0) {
				// First section should have changed
				expect(currentState).not.toBe(initialStates[i]);
			} else {
				// Other sections should remain the same
				expect(currentState).toBe(initialStates[i]);
			}
		}

		console.log('✅ Section independence verified');

		// Toggle back to original state
		await firstHeader.click();
		await page.waitForTimeout(500);
	});

	test('keyboard navigation works for all sections', async ({ page }) => {
		const sectionHeaders = page.locator('button[id^="header-"]');
		const headerCount = await sectionHeaders.count();

		// Focus on first header
		await sectionHeaders.first().focus();
		let focusedElement = await page.evaluate(() => document.activeElement?.id);
		expect(focusedElement).toBe(await sectionHeaders.first().getAttribute('id'));

		// Test keyboard navigation through sections
		for (let i = 0; i < headerCount; i++) {
			const header = sectionHeaders.nth(i);
			const headerId = await header.getAttribute('id');

			// Verify current focus
			focusedElement = await page.evaluate(() => document.activeElement?.id);
			if (focusedElement === headerId) {
				// Test Enter key
				const initialState = await header.getAttribute('aria-expanded');
				await page.keyboard.press('Enter');
				await page.waitForTimeout(300);

				const newState = await header.getAttribute('aria-expanded');
				expect(newState).not.toBe(initialState);
				console.log(`✅ ${headerId}: Enter key toggle worked`);

				// Toggle back
				await page.keyboard.press('Enter');
				await page.waitForTimeout(300);

				// Move to next section with Tab (except last one)
				if (i < headerCount - 1) {
					await page.keyboard.press('Tab');
					await page.waitForTimeout(200);
				}
			}
		}

		console.log('✅ Keyboard navigation works for all sections');
	});

	test('responsive behavior across screen sizes', async ({ page }) => {
		const sectionHeaders = page.locator('button[id^="header-"]');

		// Test desktop size
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.waitForTimeout(1000);
		const desktopCount = await sectionHeaders.count();

		// Test tablet size
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.waitForTimeout(1000);
		const tabletCount = await sectionHeaders.count();

		// Test mobile size
		await page.setViewportSize({ width: 375, height: 667 });
		await page.waitForTimeout(1000);
		const mobileCount = await sectionHeaders.count();

		// All sections should be visible across all screen sizes
		expect(desktopCount).toBe(6);
		expect(tabletCount).toBe(6);
		expect(mobileCount).toBe(6);

		console.log(
			`✅ Responsive: Desktop(${desktopCount}), Tablet(${tabletCount}), Mobile(${mobileCount})`
		);

		// Test section functionality on mobile
		const firstHeader = sectionHeaders.first();
		const initialExpanded = await firstHeader.getAttribute('aria-expanded');
		await firstHeader.click();
		await page.waitForTimeout(500);
		const newExpanded = await firstHeader.getAttribute('aria-expanded');
		expect(newExpanded).not.toBe(initialExpanded);

		console.log('✅ Sections remain functional on mobile');
	});
});
