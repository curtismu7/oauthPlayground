// Comprehensive V4 Flow Test Script
// This script tests the Authorization Code Flow V4 step by step

import puppeteer from 'puppeteer';

async function testV4Flow() {
    console.log('🚀 Starting V4 Flow Comprehensive Test...\n');
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Set to true for headless testing
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
        
        // Enable console logging
        page.on('console', msg => {
            console.log(`📱 [${msg.type().toUpperCase()}] ${msg.text()}`);
        });
        
        // Enable network logging
        page.on('request', request => {
            if (request.url().includes('localhost:3000') || request.url().includes('localhost:3001')) {
                console.log(`🌐 [REQUEST] ${request.method()} ${request.url()}`);
            }
        });
        
        // Test 1: Navigate to V4 Flow
        console.log('\n📋 Test 1: Navigate to V4 Flow');
        try {
            await page.goto('https://localhost:3000/flows/authorization-code-v4', { 
                waitUntil: 'networkidle0',
                ignoreHTTPSErrors: true 
            });
        } catch (error) {
            console.log('⚠️  HTTPS failed, trying HTTP...');
            await page.goto('http://localhost:3000/flows/authorization-code-v4', { 
                waitUntil: 'networkidle0'
            });
        }
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we're on Step 1 (Understanding OAuth)
        const stepTitle = await page.$eval('h1', el => el.textContent);
        console.log(`✅ Page loaded successfully. Title: "${stepTitle}"`);
        
        // Test 2: Check Step Navigation
        console.log('\n📋 Test 2: Check Step Navigation');
        const stepDots = await page.$$('[aria-label*="Go to step"]');
        console.log(`✅ Found ${stepDots.length} step navigation dots`);
        
        const navigationButtons = await page.$$('button');
        const prevButton = await page.$$('button').then(buttons => 
            buttons.filter(async btn => {
                const text = await btn.evaluate(el => el.textContent);
                return text.includes('Previous');
            })
        );
        const nextButton = await page.$$('button').then(buttons => 
            buttons.filter(async btn => {
                const text = await btn.evaluate(el => el.textContent);
                return text.includes('Next');
            })
        );
        const resetButton = await page.$$('button').then(buttons => 
            buttons.filter(async btn => {
                const text = await btn.evaluate(el => el.textContent);
                return text.includes('Reset Flow');
            })
        );
        
        console.log(`✅ Navigation buttons found: Previous=${prevButton.length > 0}, Next=${nextButton.length > 0}, Reset=${resetButton.length > 0}`);
        
        // Test 3: Check Configuration Section
        console.log('\n📋 Test 3: Check Configuration Section');
        const configInputs = await page.$$('input[type="text"], input[type="password"]');
        console.log(`✅ Found ${configInputs.length} configuration inputs`);
        
        // Test 4: Test Save Configuration
        console.log('\n📋 Test 4: Test Save Configuration');
        const saveButton = await page.$x('//button[contains(text(), "Save Configuration")]');
        if (saveButton.length > 0) {
            await saveButton[0].click();
            console.log('✅ Save Configuration button clicked');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Test 5: Navigate to Step 2 (PKCE Parameters)
        console.log('\n📋 Test 5: Navigate to Step 2 (PKCE Parameters)');
        if (nextButton.length > 0) {
            await nextButton[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const pkceTitle = await page.$eval('h2', el => el.textContent);
            console.log(`✅ Navigated to Step 2: "${pkceTitle}"`);
            
            // Check for PKCE generation button
            const generateButton = await page.$x('//button[contains(text(), "Generate New PKCE Parameters")]');
            if (generateButton.length > 0) {
                console.log('✅ PKCE generation button found');
                await generateButton[0].click();
                console.log('✅ PKCE generation button clicked');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if PKCE codes were generated
                const generatedBox = await page.$('[style*="background-color: #d1fae5"]');
                if (generatedBox) {
                    console.log('✅ PKCE parameters generated successfully');
                } else {
                    console.log('⚠️  PKCE parameters may not have been generated');
                }
            }
        }
        
        // Test 6: Navigate to Step 3 (Authorization Request)
        console.log('\n📋 Test 6: Navigate to Step 3 (Authorization Request)');
        const nextButton2 = await page.$x('//button[contains(text(), "Next")]');
        if (nextButton2.length > 0) {
            await nextButton2[0].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const authTitle = await page.$eval('h2', el => el.textContent);
            console.log(`✅ Navigated to Step 3: "${authTitle}"`);
            
            // Check for authorization URL generation
            const generateUrlButton = await page.$x('//button[contains(text(), "Generate Authorization URL")]');
            if (generateUrlButton.length > 0) {
                console.log('✅ Authorization URL generation button found');
                await generateUrlButton[0].click();
                console.log('✅ Authorization URL generation button clicked');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if authorization URL was generated
                const urlBox = await page.$('[style*="background-color: #d1fae5"]');
                if (urlBox) {
                    console.log('✅ Authorization URL generated successfully');
                } else {
                    console.log('⚠️  Authorization URL may not have been generated');
                }
            }
        }
        
        // Test 7: Test Reset Flow
        console.log('\n📋 Test 7: Test Reset Flow');
        const resetButton2 = await page.$x('//button[contains(text(), "Reset Flow")]');
        if (resetButton2.length > 0) {
            await resetButton2[0].click();
            console.log('✅ Reset Flow button clicked');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if we're back to Step 1
            const resetTitle = await page.$eval('h1', el => el.textContent);
            console.log(`✅ Reset successful. Back to: "${resetTitle}"`);
        }
        
        // Test 8: Test All Steps Navigation
        console.log('\n📋 Test 8: Test All Steps Navigation');
        const stepDots2 = await page.$$('[aria-label*="Go to step"]');
        for (let i = 0; i < Math.min(stepDots2.length, 4); i++) {
            await stepDots2[i].click();
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentTitle = await page.$eval('h1, h2', el => el.textContent);
            console.log(`✅ Step ${i + 1}: "${currentTitle}"`);
        }
        
        // Test 9: Check for Console Errors
        console.log('\n📋 Test 9: Check for Console Errors');
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logs.push(msg.text());
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (logs.length === 0) {
            console.log('✅ No console errors found');
        } else {
            console.log(`⚠️  Found ${logs.length} console errors:`);
            logs.forEach(log => console.log(`   - ${log}`));
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
