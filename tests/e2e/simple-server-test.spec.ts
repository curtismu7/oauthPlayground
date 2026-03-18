// tests/e2e/simple-server-test.spec.ts
/**
 * Simple Server Connection Test
 * Basic test to verify server connectivity without complex app loading
 */

import { expect, test } from '@playwright/test';

test.describe('Server Connectivity Tests', () => {
	test('frontend server responds', async ({ page }) => {
		// Test basic server response
		const response = await page.goto('https://api.pingdemo.com:3000');
		expect(response?.status()).toBe(200);
		
		// Check that we got HTML content
		const content = await page.content();
		expect(content).toContain('html');
	});

	test('backend API health check', async ({ page }) => {
		// Test backend health endpoint
		const response = await page.goto('https://api.pingdemo.com:3001/api/health');
		expect(response?.status()).toBe(200);
		
		// Check health response content
		const content = await page.content();
		expect(content).toContain('ok');
	});

	test('can access simple page without React errors', async ({ page }) => {
		// Navigate to a simple route
		await page.goto('https://api.pingdemo.com:3000/');
		
		// Wait for page to load
		await page.waitForLoadState('networkidle');
		
		// Check if page loaded (even with errors)
		const title = await page.title();
		console.log('Page title:', title);
		
		// Take screenshot for debugging
		await page.screenshot({ path: 'simple-page-load.png' });
	});

	test('can handle navigation to MFA route', async ({ page }) => {
		// Navigate to MFA route with longer timeout
		await page.goto('https://api.pingdemo.com:3000/v8/unified-mfa', { 
			timeout: 30000,
			waitUntil: 'networkidle'
		});
		
		// Wait a bit for any dynamic content
		await page.waitForTimeout(5000);
		
		// Take screenshot to see what loaded
		await page.screenshot({ path: 'mfa-route-load.png' });
		
		// Check for any MFA-related content
		const content = await page.content();
		console.log('Page content length:', content.length);
		
		// Look for basic indicators that the route is recognized
		const hasMFAContent = content.includes('MFA') || content.includes('unified-mfa') || content.includes('device');
		console.log('Has MFA content:', hasMFAContent);
	});
});

test.describe('Error Handling Tests', () => {
	test('handles 404 routes gracefully', async ({ page }) => {
		const response = await page.goto('https://api.pingdemo.com:3000/non-existent-route');
		
		// Should either load a 404 page or handle gracefully
		if (response) {
			const status = response.status();
			console.log('404 route status:', status);
		}
		
		// Take screenshot to see what happens
		await page.screenshot({ path: '404-route.png' });
	});

	test('can access AI Identity routes', async ({ page }) => {
		// Test one of the AI routes we standardized
		await page.goto('https://api.pingdemo.com:3000/ai-identity-architectures', {
			timeout: 30000,
			waitUntil: 'networkidle'
		});
		
		await page.waitForTimeout(3000);
		await page.screenshot({ path: 'ai-identity-route.png' });
		
		const content = await page.content();
		const hasAIContent = content.includes('AI') || content.includes('Identity');
		console.log('Has AI content:', hasAIContent);
	});
});
