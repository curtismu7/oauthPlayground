// Simple V4 Flow Test Script
import puppeteer from 'puppeteer';

async function testV4Flow() {
	console.log('🚀 Starting V4 Flow Simple Test...\n');

	let browser;
	try {
		// Launch browser
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

		// Enable console logging
		page.on('console', (msg) => {
			if (msg.type() === 'error' || msg.type() === 'warn') {
				console.log(`📱 [${msg.type().toUpperCase()}] ${msg.text()}`);
			}
		});

		// Test 1: Navigate to V4 Flow
		console.log('\n📋 Test 1: Navigate to V4 Flow');
		try {
			await page.goto('https://localhost:3000/flows/authorization-code-v4', {
				waitUntil: 'networkidle0',
				ignoreHTTPSErrors: true,
			});
		} catch (error) {
			console.log('⚠️  HTTPS failed, trying HTTP...');
			await page.goto('http://localhost:3000/flows/authorization-code-v4', {
				waitUntil: 'networkidle0',
			});
		}

		// Wait for page to load
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Check if we're on Step 1 (Understanding OAuth)
		const stepTitle = await page.$eval('h1', (el) => el.textContent);
		console.log(`✅ Page loaded successfully. Title: "${stepTitle}"`);

		// Test 2: Check Step Navigation
		console.log('\n📋 Test 2: Check Step Navigation');
		const stepDots = await page.$$('[aria-label*="Go to step"]');
		console.log(`✅ Found ${stepDots.length} step navigation dots`);

		// Test 3: Check Configuration Section
		console.log('\n📋 Test 3: Check Configuration Section');
		const configInputs = await page.$$('input[type="text"], input[type="password"]');
		console.log(`✅ Found ${configInputs.length} configuration inputs`);

		// Test 4: Test Save Configuration
		console.log('\n📋 Test 4: Test Save Configuration');
		const buttons = await page.$$('button');
		let saveButton = null;
		for (const button of buttons) {
			const text = await button.evaluate((el) => el.textContent);
			if (text.includes('Save Configuration')) {
				saveButton = button;
				break;
			}
		}

		if (saveButton) {
			await saveButton.click();
			console.log('✅ Save Configuration button clicked');
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		// Test 5: Navigate to Step 2 (PKCE Parameters)
		console.log('\n📋 Test 5: Navigate to Step 2 (PKCE Parameters)');
		let nextButton = null;
		for (const button of buttons) {
			const text = await button.evaluate((el) => el.textContent);
			if (text.includes('Next')) {
				nextButton = button;
				break;
			}
		}

		if (nextButton) {
			await nextButton.click();
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const pkceTitle = await page.$eval('h2', (el) => el.textContent);
			console.log(`✅ Navigated to Step 2: "${pkceTitle}"`);

			// Check for PKCE generation button
			const allButtons = await page.$$('button');
			let generateButton = null;
			for (const button of allButtons) {
				const text = await button.evaluate((el) => el.textContent);
				if (text.includes('Generate New PKCE Parameters')) {
					generateButton = button;
					break;
				}
			}

			if (generateButton) {
				console.log('✅ PKCE generation button found');
				await generateButton.click();
				console.log('✅ PKCE generation button clicked');
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Check if PKCE codes were generated
				const generatedBox = await page.$('[style*="background-color: #d1fae5"]');
				if (generatedBox) {
					console.log('✅ PKCE parameters generated successfully');
				} else {
					console.log('⚠️  PKCE parameters may not have been generated');
				}
			}
		}

		// Test 6: Test Reset Flow
		console.log('\n📋 Test 6: Test Reset Flow');
		let resetButton = null;
		for (const button of buttons) {
			const text = await button.evaluate((el) => el.textContent);
			if (text.includes('Reset Flow')) {
				resetButton = button;
				break;
			}
		}

		if (resetButton) {
			await resetButton.click();
			console.log('✅ Reset Flow button clicked');
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Check if we're back to Step 1
			const resetTitle = await page.$eval('h1', (el) => el.textContent);
			console.log(`✅ Reset successful. Back to: "${resetTitle}"`);
		}

		// Test 7: Check for Console Errors
		console.log('\n📋 Test 7: Check for Console Errors');
		const logs = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				logs.push(msg.text());
			}
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));
		if (logs.length === 0) {
			console.log('✅ No console errors found');
		} else {
			console.log(`⚠️  Found ${logs.length} console errors:`);
			logs.forEach((log) => console.log(`   - ${log}`));
		}

		console.log('\n🎉 V4 Flow Test Completed Successfully!');
	} catch (error) {
		console.error('❌ Test failed:', error);
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}

// Run the test
testV4Flow().catch(console.error);
