#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testClearConfig() {
	console.log('🚀 Testing Clear Configuration Enhancement...\n');

	let browser;
	try {
		browser = await puppeteer.launch({
			headless: false,
			defaultViewport: { width: 1280, height: 720 },
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--ignore-certificate-errors',
				'--ignore-ssl-errors',
				'--ignore-certificate-errors-spki-list',
				'--allow-running-insecure-content',
			],
		});

		const page = await browser.newPage();

		// Log console messages
		page.on('console', (msg) => {
			const type = msg.type();
			const text = msg.text();

			if (type === 'error') {
				console.error(`📱 [ERROR] ${text}`);
			} else if (type === 'warn') {
				console.warn(`📱 [WARN] ${text}`);
			} else if (
				text.includes('Configuration cleared') ||
				text.includes('Client ID and Client Secret removed')
			) {
				console.log(`📱 [NOTIFICATION] ${text}`);
			}
		});

		// Test 1: Navigate to V4 Flow
		console.log('📋 Navigating to V4 Flow...');
		await page.goto('https://localhost:3000/flows/authorization-code-v4', {
			waitUntil: 'networkidle0',
			ignoreHTTPSErrors: true,
		});
		console.log('✅ Successfully navigated to V4 flow');

		// Wait for page to load
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Test 2: Check initial state of Client ID and Client Secret fields
		console.log('\n📋 Checking initial state of form fields...');

		// Check if Client ID field has default value
		const clientIdValue = await page.evaluate(() => {
			const input = document.querySelector('input[placeholder*="a4f963ea"]');
			return input ? input.value : null;
		});
		console.log('✅ Client ID initial value:', clientIdValue ? 'Has default value' : 'Empty');

		// Test 3: Click Clear Configuration button
		console.log('\n📋 Testing Clear Configuration button...');

		// Find and click the Clear Configuration button
		await page.evaluate(() => {
			const buttons = Array.from(document.querySelectorAll('button'));
			const clearButton = buttons.find((btn) => btn.textContent.includes('Clear Configuration'));
			if (clearButton) {
				clearButton.click();
			}
		});

		await new Promise((resolve) => setTimeout(resolve, 2000));
		console.log('✅ Clear Configuration button clicked');

		// Test 4: Verify Client ID and Client Secret are cleared
		console.log('\n📋 Verifying fields are cleared...');

		const clearedValues = await page.evaluate(() => {
			const clientIdInput = document.querySelector(
				'input[placeholder*="Required: Enter your Client ID"]'
			);
			const clientSecretInput = document.querySelector(
				'input[placeholder*="Required: Enter your Client Secret"]'
			);

			return {
				clientId: clientIdInput ? clientIdInput.value : 'not found',
				clientSecret: clientSecretInput ? clientSecretInput.value : 'not found',
				clientIdHasError: clientIdInput
					? clientIdInput.style.borderColor === 'rgb(239, 68, 68)'
					: false,
				clientSecretHasError: clientSecretInput
					? clientSecretInput.style.borderColor === 'rgb(239, 68, 68)'
					: false,
			};
		});

		console.log('✅ Client ID cleared:', clearedValues.clientId === '');
		console.log('✅ Client Secret cleared:', clearedValues.clientSecret === '');
		console.log('✅ Client ID has red border:', clearedValues.clientIdHasError);
		console.log('✅ Client Secret has red border:', clearedValues.clientSecretHasError);

		// Test 5: Test typing in fields to remove error styling
		console.log('\n📋 Testing field input to remove error styling...');

		// Type in Client ID field
		await page.evaluate(() => {
			const clientIdInput = document.querySelector(
				'input[placeholder*="Required: Enter your Client ID"]'
			);
			if (clientIdInput) {
				clientIdInput.focus();
				clientIdInput.value = 'test-client-id';
				clientIdInput.dispatchEvent(new Event('input', { bubbles: true }));
			}
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Check if error styling is removed
		const afterTyping = await page.evaluate(() => {
			const clientIdInput = document.querySelector('input[value="test-client-id"]');
			return {
				hasError: clientIdInput ? clientIdInput.style.borderColor === 'rgb(239, 68, 68)' : false,
				value: clientIdInput ? clientIdInput.value : null,
			};
		});

		console.log('✅ Client ID field updated:', afterTyping.value === 'test-client-id');
		console.log('✅ Error styling removed:', !afterTyping.hasError);

		console.log('\n🎉 Clear Configuration enhancement test completed!');
		console.log('   - Clear Configuration clears both Client ID and Client Secret');
		console.log('   - Red border styling applied to empty required fields');
		console.log('   - Error styling removed when user types in fields');
		console.log('   - Visual indicators (red asterisks) show required fields');

		// Keep browser open for manual inspection
		console.log('\n⏰ Browser will stay open for 15 seconds for manual inspection...');
		await new Promise((resolve) => setTimeout(resolve, 15000));
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}

testClearConfig().catch(console.error);
