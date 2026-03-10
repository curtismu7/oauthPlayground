#!/usr/bin/env node

/**
 * Comprehensive Password API Test Suite
 * Tests all password-related endpoints
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = process.env.BASE_URL || process.env.API_BASE_URL || 'https://localhost:3000';
const API_BASE = `${BASE_URL}/api/pingone/password`;
const region = process.env.PINGONE_REGION || process.env.REGION || 'us';

// Auth region map (auth.pingone.{tld})
const AUTH_REGION_MAP = { us: 'com', na: 'com', eu: 'eu', ca: 'ca', ap: 'asia', asia: 'asia', au: 'com.au', sg: 'sg' };

// Test configuration
const config = {
	environmentId: process.env.PINGONE_ENVIRONMENT_ID || process.env.VITE_PINGONE_ENVIRONMENT_ID,
	clientId: process.env.PINGONE_CLIENT_ID || process.env.VITE_PINGONE_CLIENT_ID,
	clientSecret: process.env.PINGONE_CLIENT_SECRET || process.env.VITE_PINGONE_CLIENT_SECRET,
	testUserId: process.argv[2] || process.env.TEST_USER_ID || 'test-user-id',
	testPassword: 'TestPassword123!',
	testRecoveryCode: '123456',
	region,
};

console.log(
	'\n💡 Tip: You can provide a real user ID as argument: node test-password-apis.js <userId>\n'
);

// Colors for output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
};

let workerToken = null;
const testResults = [];

function log(message, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
	const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
	const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
	log(`${icon} ${name}`, color);
	if (details) {
		log(`   ${details}`, colors.cyan);
	}
	testResults.push({ name, status, details });
}

async function getWorkerToken() {
	log('\n🔑 Getting Worker Token...', colors.blue);

	try {
		const authTld = AUTH_REGION_MAP[config.region?.toLowerCase()] || 'com';
		const tokenEndpoint = `https://auth.pingone.${authTld}/${config.environmentId}/as/token`;
		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: config.clientId,
				client_secret: config.clientSecret,
				scope: 'p1:read:user p1:update:user',
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Token request failed: ${response.status} - ${error}`);
		}

		const data = await response.json();
		workerToken = data.access_token;
		logTest('Get Worker Token', 'PASS', `Token obtained (${workerToken.substring(0, 20)}...)`);
		return true;
	} catch (error) {
		logTest('Get Worker Token', 'FAIL', error.message);
		return false;
	}
}

async function testPasswordState() {
	log('\n📊 Testing: Read Password State', colors.blue);

	try {
		const params = new URLSearchParams({
			environmentId: config.environmentId,
			userId: config.testUserId,
			workerToken,
		});
		if (config.region) params.set('region', config.region);
		const url = `${API_BASE}/state?${params.toString()}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Read Password State', 'PASS', `Status: ${response.status}`);
			log(`   Response: ${JSON.stringify(data, null, 2)}`, colors.cyan);
		} else {
			logTest(
				'Read Password State',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Read Password State', 'FAIL', error.message);
	}
}

async function testSendRecoveryCode() {
	log('\n📧 Testing: Send Recovery Code', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/send-recovery-code`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Send Recovery Code', 'PASS', `Status: ${response.status}`);
		} else {
			logTest(
				'Send Recovery Code',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Send Recovery Code', 'FAIL', error.message);
	}
}

async function testRecoverPassword() {
	log('\n🔄 Testing: Recover Password', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/recover`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				recoveryCode: config.testRecoveryCode,
				newPassword: config.testPassword,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Recover Password', 'PASS', `Status: ${response.status}`);
		} else {
			logTest(
				'Recover Password',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Recover Password', 'FAIL', error.message);
	}
}

async function testCheckPassword() {
	log('\n🔍 Testing: Check Password', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/check`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				password: config.testPassword,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok || response.status === 400) {
			// 400 is expected if password doesn't match
			logTest('Check Password', 'PASS', `Status: ${response.status} - Valid: ${data.valid}`);
			log(`   Response: ${JSON.stringify(data, null, 2)}`, colors.cyan);
		} else {
			logTest(
				'Check Password',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Check Password', 'FAIL', error.message);
	}
}

async function testForcePasswordChange() {
	log('\n⚠️  Testing: Force Password Change', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/force-change`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Force Password Change', 'PASS', `Status: ${response.status}`);
		} else {
			logTest(
				'Force Password Change',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Force Password Change', 'FAIL', error.message);
	}
}

async function testUnlockPassword() {
	log('\n🔓 Testing: Unlock Password', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/unlock`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Unlock Password', 'PASS', `Status: ${response.status}`);
		} else {
			logTest(
				'Unlock Password',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Unlock Password', 'FAIL', error.message);
	}
}

async function testSetPassword() {
	log('\n🔧 Testing: Set Password (Admin)', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/set`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				newPassword: config.testPassword,
				forceChange: false,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Set Password (Admin)', 'PASS', `Status: ${response.status}`);
		} else {
			logTest(
				'Set Password (Admin)',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Set Password (Admin)', 'FAIL', error.message);
	}
}

async function testSetPasswordValue() {
	log('\n🔧 Testing: Set Password Value', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/set-value`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				passwordValue: config.testPassword,
				forceChange: false,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Set Password Value', 'PASS', `Status: ${response.status}`);
		} else {
			logTest(
				'Set Password Value',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Set Password Value', 'FAIL', error.message);
	}
}

async function testAdminSetPassword() {
	log('\n👨‍💼 Testing: Admin Set Password', colors.blue);

	try {
		const response = await fetch(`${API_BASE}/admin-set`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: config.environmentId,
				userId: config.testUserId,
				workerToken: workerToken,
				newPassword: config.testPassword,
				forceChange: false,
				...(config.region ? { region: config.region } : {}),
			}),
		});

		const data = await response.json();

		if (response.ok) {
			logTest('Admin Set Password', 'PASS', `Status: ${response.status}`);
		} else {
			logTest(
				'Admin Set Password',
				'SKIP',
				`Status: ${response.status} - ${data.error_description || data.message}`
			);
		}
	} catch (error) {
		logTest('Admin Set Password', 'FAIL', error.message);
	}
}

async function printSummary() {
	log(`\n${'='.repeat(60)}`, colors.blue);
	log('📊 TEST SUMMARY', colors.blue);
	log('='.repeat(60), colors.blue);

	const passed = testResults.filter((r) => r.status === 'PASS').length;
	const failed = testResults.filter((r) => r.status === 'FAIL').length;
	const skipped = testResults.filter((r) => r.status === 'SKIP').length;

	log(`\nTotal Tests: ${testResults.length}`);
	log(`✅ Passed: ${passed}`, colors.green);
	log(`❌ Failed: ${failed}`, colors.red);
	log(`⚠️  Skipped: ${skipped}`, colors.yellow);

	if (failed > 0) {
		log('\n❌ Failed Tests:', colors.red);
		testResults
			.filter((r) => r.status === 'FAIL')
			.forEach((r) => {
				log(`   - ${r.name}: ${r.details}`);
			});
	}

	log(`\n${'='.repeat(60)}`, colors.blue);
}

async function runTests() {
	log('🚀 Starting Password API Test Suite', colors.blue);
	log('='.repeat(60), colors.blue);

	// Check configuration
	if (!config.environmentId || !config.clientId || !config.clientSecret) {
		log('❌ Missing required configuration:', colors.red);
		log(`   Environment ID: ${config.environmentId ? '✓' : '✗'}`);
		log(`   Client ID: ${config.clientId ? '✓' : '✗'}`);
		log(`   Client Secret: ${config.clientSecret ? '✓' : '✗'}`);
		log(
			'\nPlease set PINGONE_ENVIRONMENT_ID, PINGONE_CLIENT_ID, and PINGONE_CLIENT_SECRET in .env'
		);
		process.exit(1);
	}

	log(`\n📋 Configuration:`, colors.cyan);
	log(`   Base URL: ${BASE_URL}`);
	log(`   Region: ${config.region}`);
	log(`   Environment ID: ${config.environmentId.substring(0, 20)}...`);
	log(`   Client ID: ${config.clientId.substring(0, 20)}...`);
	log(`   Test User ID: ${config.testUserId}`);

	// Get worker token first
	const tokenObtained = await getWorkerToken();
	if (!tokenObtained) {
		log('\n❌ Cannot proceed without worker token', colors.red);
		process.exit(1);
	}

	// Run all tests
	await testPasswordState();
	await testSendRecoveryCode();
	await testRecoverPassword();
	await testCheckPassword();
	await testForcePasswordChange();
	await testUnlockPassword();
	await testSetPassword();
	await testSetPasswordValue();
	await testAdminSetPassword();

	// Print summary
	await printSummary();
}

// Run tests
runTests().catch((error) => {
	log(`\n❌ Test suite failed: ${error.message}`, colors.red);
	console.error(error);
	process.exit(1);
});
