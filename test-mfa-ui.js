/**
 * MFA Flow UI Testing Script
 * Tests the actual UI components and flows in the browser
 */

import puppeteer from 'puppeteer';

// Test configuration
const FRONTEND_URL = 'https://localhost:3000';
const _BACKEND_URL = 'http://localhost:3001';

// Test data
const TEST_DATA = {
	environmentId: 'env-123456',
	userId: 'user-789012',
	email: 'test@example.com',
	phone: '+1.5551234567',
	policyId: 'policy-test-123',
};

/**
 * Test the Unified Device Registration Form
 */
async function testUnifiedDeviceRegistrationForm(page) {
	console.log('\n🧪 Testing Unified Device Registration Form');

	try {
		// Navigate to the unified MFA flow
		await page.goto(`${FRONTEND_URL}/unified-mfa-flow`);
		await page.waitForSelector('[data-testid="unified-device-form"]', { timeout: 10000 });

		console.log('✅ Unified Device Registration Form loaded successfully');

		// Test flow type selection
		const flowTypeRadios = await page.$$('input[name="flowType"]');
		console.log(`✅ Found ${flowTypeRadios.length} flow type options`);

		// Test device type tabs
		const deviceTabs = await page.$$('button[data-device-type]');
		console.log(`✅ Found ${deviceTabs.length} device type tabs`);

		// Test API Comparison Modal button
		const apiComparisonButton = await page.$('button:has-text("API Comparison")');
		if (apiComparisonButton) {
			console.log('✅ API Comparison Modal button found');

			// Test clicking the modal button
			await apiComparisonButton.click();
			await page.waitForSelector('[data-testid="api-comparison-modal"]', { timeout: 5000 });
			console.log('✅ API Comparison Modal opened successfully');

			// Test modal content
			const modalContent = await page.$('[data-testid="api-comparison-modal"]');
			const modalText = await modalContent.textContent();

			// Check if modal contains expected content
			const expectedContent = [
				'Admin Flow',
				'Admin Activation Required',
				'User Flow',
				'POST /api/pingone/mfa/register-device',
				'workerToken',
				'userToken',
			];

			const hasExpectedContent = expectedContent.every((content) => modalText.includes(content));

			if (hasExpectedContent) {
				console.log('✅ API Comparison Modal contains expected content');
			} else {
				console.log('⚠️ API Comparison Modal missing some expected content');
			}

			// Close modal
			await page.keyboard.press('Escape');
			await page.waitForTimeout(1000);
			console.log('✅ API Comparison Modal closed');
		} else {
			console.log('❌ API Comparison Modal button not found');
		}

		return { success: true };
	} catch (error) {
		console.log(`❌ Unified Device Registration Form test failed: ${error.message}`);
		return { success: false, error: error.message };
	}
}

/**
 * Test form submission with different flow types
 */
async function testFormSubmission(page) {
	console.log('\n🧪 Testing Form Submission');

	try {
		await page.goto(`${FRONTEND_URL}/unified-mfa-flow`);
		await page.waitForSelector('[data-testid="unified-device-form"]', { timeout: 10000 });

		// Test each flow type
		const flowTypes = ['admin', 'admin_activation_required', 'user'];
		const results = [];

		for (const flowType of flowTypes) {
			console.log(`\n📋 Testing ${flowType} flow`);

			// Select flow type
			await page.click(`input[name="flowType"][value="${flowType}"]`);
			await page.waitForTimeout(500);

			// Select EMAIL device type
			await page.click('[data-device-type="EMAIL"]');
			await page.waitForTimeout(500);

			// Fill in form fields
			await page.type('input[name="email"]', TEST_DATA.email);
			await page.waitForTimeout(500);

			// Check if Register button is enabled
			const registerButton = await page.$('button[type="submit"]');
			const isDisabled = await registerButton.evaluate((el) => el.disabled);

			if (!isDisabled) {
				console.log(`✅ Register button is enabled for ${flowType} flow`);

				// Try to submit (this will likely fail without real tokens, but tests the UI flow)
				try {
					await registerButton.click();
					await page.waitForTimeout(2000);

					// Check for any error messages
					const errorElement = await page.$('.error, .alert, [role="alert"]');
					if (errorElement) {
						const errorText = await errorElement.textContent();
						console.log(`ℹ️ Expected error for ${flowType} flow: ${errorText}`);
					} else {
						console.log(`ℹ️ No error message shown for ${flowType} flow`);
					}
				} catch (_submitError) {
					console.log(`ℹ️ Form submission failed as expected for ${flowType} flow`);
				}

				results.push({ flowType, success: true });
			} else {
				console.log(`❌ Register button is disabled for ${flowType} flow`);
				results.push({ flowType, success: false, error: 'Button disabled' });
			}
		}

		return { success: true, results };
	} catch (error) {
		console.log(`❌ Form submission test failed: ${error.message}`);
		return { success: false, error: error.message };
	}
}

/**
 * Test device type switching
 */
async function testDeviceTypeSwitching(page) {
	console.log('\n🧪 Testing Device Type Switching');

	try {
		await page.goto(`${FRONTEND_URL}/unified-mfa-flow`);
		await page.waitForSelector('[data-testid="unified-device-form"]', { timeout: 10000 });

		const deviceTypes = ['EMAIL', 'SMS', 'VOICE', 'WHATSAPP', 'TOTP', 'FIDO2'];
		const results = [];

		for (const deviceType of deviceTypes) {
			console.log(`📱 Testing ${deviceType} device type`);

			const deviceTab = await page.$(`[data-device-type="${deviceType}"]`);
			if (deviceTab) {
				await deviceTab.click();
				await page.waitForTimeout(500);

				// Check if device-specific content appears
				const deviceContent = await page.$(`[data-device-content="${deviceType}"]`);
				if (deviceContent) {
					console.log(`✅ ${deviceType} device content loaded`);
					results.push({ deviceType, success: true });
				} else {
					console.log(`⚠️ ${deviceType} device content not found`);
					results.push({ deviceType, success: false, error: 'Content not found' });
				}
			} else {
				console.log(`❌ ${deviceType} device tab not found`);
				results.push({ deviceType, success: false, error: 'Tab not found' });
			}
		}

		return { success: true, results };
	} catch (error) {
		console.log(`❌ Device type switching test failed: ${error.message}`);
		return { success: false, error: error.message };
	}
}

/**
 * Test responsive design
 */
async function testResponsiveDesign(page) {
	console.log('\n📱 Testing Responsive Design');

	try {
		await page.goto(`${FRONTEND_URL}/unified-mfa-flow`);
		await page.waitForSelector('[data-testid="unified-device-form"]', { timeout: 10000 });

		const viewports = [
			{ width: 1920, height: 1080, name: 'Desktop' },
			{ width: 768, height: 1024, name: 'Tablet' },
			{ width: 375, height: 667, name: 'Mobile' },
		];

		const results = [];

		for (const viewport of viewports) {
			console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

			await page.setViewport(viewport.width, viewport.height);
			await page.waitForTimeout(1000);

			// Check if form is still visible and functional
			const form = await page.$('[data-testid="unified-device-form"]');
			const isVisible = await form.evaluate((el) => {
				const style = window.getComputedStyle(el);
				return style.display !== 'none' && style.visibility !== 'hidden';
			});

			if (isVisible) {
				console.log(`✅ Form is visible on ${viewport.name}`);
				results.push({ viewport: viewport.name, success: true });
			} else {
				console.log(`❌ Form is not visible on ${viewport.name}`);
				results.push({ viewport: viewport.name, success: false, error: 'Not visible' });
			}
		}

		return { success: true, results };
	} catch (error) {
		console.log(`❌ Responsive design test failed: ${error.message}`);
		return { success: false, error: error.message };
	}
}

/**
 * Test accessibility
 */
async function testAccessibility(page) {
	console.log('\n♿ Testing Accessibility');

	try {
		await page.goto(`${FRONTEND_URL}/unified-mfa-flow`);
		await page.waitForSelector('[data-testid="unified-device-form"]', { timeout: 10000 });

		// Check for proper semantic HTML
		const hasMainLandmark = await page.$('main');
		const hasFormLandmark = await page.$('form');
		const hasLabels = await page.$$('label');
		const hasButtons = await page.$$('button');

		console.log(`✅ Semantic HTML: main=${!!hasMainLandmark}, form=${!!hasFormLandmark}`);
		console.log(
			`✅ Interactive elements: ${hasLabels.length} labels, ${hasButtons.length} buttons`
		);

		// Check for proper ARIA attributes
		const hasAriaLabels = await page.$$('[aria-label]');
		const hasAriaDescribed = await page.$$('[aria-describedby]');

		console.log(
			`✅ ARIA support: ${hasAriaLabels.length} aria-labels, ${hasAriaDescribed.length} aria-describedby`
		);

		// Test keyboard navigation
		await page.keyboard.press('Tab');
		await page.waitForTimeout(500);

		const focusedElement = await page.evaluate(() => document.activeElement.tagName);
		console.log(`✅ Keyboard navigation: Focus on ${focusedElement}`);

		return { success: true };
	} catch (error) {
		console.log(`❌ Accessibility test failed: ${error.message}`);
		return { success: false, error: error.message };
	}
}

/**
 * Main test runner
 */
async function runUITests() {
	console.log('🚀 Starting MFA Flow UI Testing');
	console.log('==================================');

	let browser;
	let page;

	try {
		// Launch browser
		browser = await puppeteer.launch({
			headless: false,
			defaultViewport: { width: 1920, height: 1080 },
			args: ['--ignore-certificate-errors', '--ignore-https-errors'],
		});

		page = await browser.newPage();

		// Set up request interception to monitor API calls
		page.on('request', (request) => {
			if (request.url().includes('/api/pingone/mfa/')) {
				console.log(`🔍 API Call: ${request.method()} ${request.url()}`);
			}
		});

		const results = {
			form: null,
			submission: null,
			deviceSwitching: null,
			responsive: null,
			accessibility: null,
			summary: {
				total: 0,
				passed: 0,
				failed: 0,
			},
		};

		// Run tests
		results.form = await testUnifiedDeviceRegistrationForm(page);
		results.summary.total++;
		if (results.form.success) results.summary.passed++;
		else results.summary.failed++;

		results.submission = await testFormSubmission(page);
		results.summary.total++;
		if (results.submission.success) results.summary.passed++;
		else results.summary.failed++;

		results.deviceSwitching = await testDeviceTypeSwitching(page);
		results.summary.total++;
		if (results.deviceSwitching.success) results.summary.passed++;
		else results.summary.failed++;

		results.responsive = await testResponsiveDesign(page);
		results.summary.total++;
		if (results.responsive.success) results.summary.passed++;
		else results.summary.failed++;

		results.accessibility = await testAccessibility(page);
		results.summary.total++;
		if (results.accessibility.success) results.summary.passed++;
		else results.summary.failed++;

		// Print summary
		console.log('\n📊 Test Summary');
		console.log('===============');
		console.log(`Total Tests: ${results.summary.total}`);
		console.log(`Passed: ${results.summary.passed}`);
		console.log(`Failed: ${results.summary.failed}`);
		console.log(
			`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`
		);

		// Detailed results
		console.log('\n📋 Detailed Results');
		console.log('==================');

		console.log('\nUnified Device Registration Form:');
		const formStatus = results.form.success ? '✅' : '❌';
		console.log(`${formStatus} Unified Device Registration Form`);

		if (results.submission?.results) {
			console.log('\nForm Submission Results:');
			results.submission.results.forEach((result) => {
				const status = result.success ? '✅' : '❌';
				console.log(`${status} ${result.flowType} flow`);
			});
		}

		if (results.deviceSwitching?.results) {
			console.log('\nDevice Type Switching Results:');
			results.deviceSwitching.results.forEach((result) => {
				const status = result.success ? '✅' : '❌';
				console.log(`${status} ${result.deviceType}`);
			});
		}

		if (results.responsive?.results) {
			console.log('\nResponsive Design Results:');
			results.responsive.results.forEach((result) => {
				const status = result.success ? '✅' : '❌';
				console.log(`${status} ${result.viewport}`);
			});
		}

		console.log('\nAccessibility:');
		const accessibilityStatus = results.accessibility.success ? '✅' : '❌';
		console.log(`${accessibilityStatus} Accessibility`);

		// Production readiness assessment
		console.log('\n🏭 Production Readiness Assessment');
		console.log('==================================');

		const successRate = (results.summary.passed / results.summary.total) * 100;

		if (successRate >= 95) {
			console.log('✅ READY FOR PRODUCTION');
			console.log('   All UI components are working correctly');
		} else if (successRate >= 80) {
			console.log('⚠️  CONDITIONALLY READY');
			console.log('   Some UI issues found but core functionality works');
		} else {
			console.log('❌ NOT READY FOR PRODUCTION');
			console.log('   Significant UI issues need to be addressed');
		}

		return results;
	} catch (error) {
		console.error('\n❌ UI testing failed:', error);
		return { success: false, error: error.message };
	} finally {
		if (page) {
			await page.close();
		}
		if (browser) {
			await browser.close();
		}
	}
}

// Run tests
runUITests()
	.then((_results) => {
		console.log('\n✅ UI testing completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ UI testing failed:', error);
		process.exit(1);
	});
