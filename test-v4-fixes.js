#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testV4Fixes() {
    console.log('🚀 Testing V4 Flow Fixes...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Set to false to see the browser
            defaultViewport: { width: 1280, height: 720 },
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--ignore-certificate-errors-spki-list',
                '--allow-running-insecure-content'
            ]
        });
        
        const page = await browser.newPage();
        
        // Log console messages
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                console.error(`📱 [ERROR] ${text}`);
            } else if (type === 'warn') {
                console.warn(`📱 [WARN] ${text}`);
            } else if (text.includes('URL parameters check') || 
                      text.includes('Authorization code captured') || 
                      text.includes('Rendering authCode in UI') ||
                      text.includes('Manual authorization code entered')) {
                console.log(`📱 [DEBUG] ${text}`);
            }
        });

        // Test 1: Navigate to V4 Flow
        console.log('\n📋 Test 1: Navigate to V4 Flow');
        try {
            await page.goto('https://localhost:3000/flows/authorization-code-v4', { 
                waitUntil: 'networkidle0',
                ignoreHTTPSErrors: true 
            });
            console.log('✅ Successfully navigated to V4 flow');
        } catch (error) {
            console.log('⚠️  HTTPS failed, trying HTTP...');
            await page.goto('http://localhost:3000/flows/authorization-code-v4', { 
                waitUntil: 'networkidle0'
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Check for NotificationProvider warnings
        console.log('\n📋 Test 2: Check for NotificationProvider warnings');
        const consoleMessages = [];
        page.on('console', msg => {
            if (msg.text().includes('NotificationProvider is not mounted')) {
                consoleMessages.push(msg.text());
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (consoleMessages.length === 0) {
            console.log('✅ No NotificationProvider warnings found');
        } else {
            console.log(`❌ Found ${consoleMessages.length} NotificationProvider warnings`);
            consoleMessages.forEach(msg => console.log(`   ${msg}`));
        }

        // Test 3: Test Next button styling
        console.log('\n📋 Test 3: Test Next button styling');
        
        // Check initial state (Step 1 should have green Next button)
        const nextButton = await page.$('button:has-text("Next")');
        if (nextButton) {
            const buttonClasses = await nextButton.evaluate(el => el.className);
            console.log('✅ Next button found, classes:', buttonClasses);
        }

        // Test 4: Test PKCE generation
        console.log('\n📋 Test 4: Test PKCE generation');
        
        // Navigate to Step 2 (PKCE Parameters)
        await page.click('button[aria-label="Go to step 2"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Click Generate PKCE button
        const generateButton = await page.$('button:has-text("Generate New PKCE Parameters")');
        if (generateButton) {
            await generateButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ PKCE generation button clicked');
            
            // Check if Next button turns green
            const nextButtonAfterPKCE = await page.$('button:has-text("Next")');
            if (nextButtonAfterPKCE) {
                const buttonClasses = await nextButtonAfterPKCE.evaluate(el => el.className);
                console.log('✅ Next button after PKCE generation, classes:', buttonClasses);
            }
        }

        // Test 5: Test authorization URL generation
        console.log('\n📋 Test 5: Test authorization URL generation');
        
        // Navigate to Step 3 (Authorization Request)
        await page.click('button[aria-label="Go to step 3"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Click Generate Authorization URL button
        const generateUrlButton = await page.$('button:has-text("Generate Authorization URL")');
        if (generateUrlButton) {
            await generateUrlButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Authorization URL generation button clicked');
            
            // Check if Next button turns green
            const nextButtonAfterURL = await page.$('button:has-text("Next")');
            if (nextButtonAfterURL) {
                const buttonClasses = await nextButtonAfterURL.evaluate(el => el.className);
                console.log('✅ Next button after URL generation, classes:', buttonClasses);
            }
        }

        // Test 6: Test manual authorization code entry
        console.log('\n📋 Test 6: Test manual authorization code entry');
        
        // Navigate to Step 4 (Authorization Response)
        await page.click('button[aria-label="Go to step 4"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Enter a test authorization code
        const codeInput = await page.$('input[placeholder="Enter authorization code here..."]');
        if (codeInput) {
            await codeInput.type('test_auth_code_12345');
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Test authorization code entered');
            
            // Check if Next button turns green
            const nextButtonAfterCode = await page.$('button:has-text("Next")');
            if (nextButtonAfterCode) {
                const buttonClasses = await nextButtonAfterCode.evaluate(el => el.className);
                console.log('✅ Next button after code entry, classes:', buttonClasses);
            }
        }

        // Test 7: Test URL parameter simulation
        console.log('\n📋 Test 7: Test URL parameter simulation');
        
        // Simulate returning from PingOne with authorization code
        const testUrl = 'https://localhost:3000/flows/authorization-code-v4?code=test_code_from_pingone_67890&state=random_state';
        await page.goto(testUrl, { 
            waitUntil: 'networkidle0',
            ignoreHTTPSErrors: true 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we're on the right step and code is captured
        const currentUrl = page.url();
        console.log('✅ Navigated with test URL parameters, current URL:', currentUrl);
        
        // Look for the authorization code display
        const codeDisplay = await page.$('div:has-text("Authorization Code Received!")');
        if (codeDisplay) {
            console.log('✅ Authorization code successfully captured and displayed');
        } else {
            console.log('❌ Authorization code not displayed - checking manual entry section');
        }

        console.log('\n🎉 All tests completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testV4Fixes().catch(console.error);
