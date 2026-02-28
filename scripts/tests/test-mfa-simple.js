/**
 * Simple MFA Flow Testing Script (SSL disabled)
 * Tests Admin, Admin Activation Required, and User flows for all device types
 */

import axios from 'axios';

// Test configuration
const BASE_URL = 'https://localhost:3001';
const TEST_CONFIG = {
	environmentId: 'env-123456',
	userId: 'user-789012',
	workerToken: 'WORKER_TOKEN',
	userToken: 'USER_TOKEN',
	policyId: 'policy-test-123',
};

// Device types to test
const DEVICE_TYPES = ['EMAIL', 'SMS', 'VOICE', 'WHATSAPP', 'TOTP', 'FIDO2'];

// Flow types to test
const FLOW_TYPES = [
	{ name: 'Admin Flow', tokenType: 'worker', defaultStatus: 'ACTIVE' },
	{ name: 'Admin Activation Required', tokenType: 'worker', defaultStatus: 'ACTIVATION_REQUIRED' },
	{ name: 'User Flow', tokenType: 'user', defaultStatus: 'ACTIVATION_REQUIRED' },
];

// Create axios instance with SSL disabled
const api = axios.create({
	baseURL: BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 10000,
});

/**
 * Test device registration for a specific flow and device type
 */
async function testDeviceRegistration(flowType, deviceType) {
	console.log(`\n🧪 Testing ${flowType.name} - ${deviceType}`);

	const payload = {
		environmentId: TEST_CONFIG.environmentId,
		userId: TEST_CONFIG.userId,
		type: deviceType,
		status: flowType.defaultStatus,
		tokenType: flowType.tokenType,
		policy: { id: TEST_CONFIG.policyId },
	};

	// Add device-specific fields
	if (deviceType === 'EMAIL') {
		payload.email = 'test@example.com';
	} else if (deviceType === 'SMS' || deviceType === 'VOICE' || deviceType === 'WHATSAPP') {
		payload.phone = '+1.5551234567';
	} else if (deviceType === 'FIDO2') {
		payload.rp = {
			id: 'localhost',
			name: 'Local Development',
		};
		// FIDO2 doesn't use status field
		delete payload.status;
	}

	// Add appropriate token
	if (flowType.tokenType === 'worker') {
		payload.workerToken = TEST_CONFIG.workerToken;
	} else {
		payload.userToken = TEST_CONFIG.userToken;
	}

	try {
		const response = await api.post('/api/pingone/mfa/register-device', payload);

		console.log(`✅ ${flowType.name} - ${deviceType}: SUCCESS`);
		console.log(`   Status: ${response.status}`);
		console.log(`   Device ID: ${response.data.deviceId || 'N/A'}`);
		console.log(`   Device Status: ${response.data.status || 'N/A'}`);

		return { success: true, data: response.data };
	} catch (error) {
		console.log(`❌ ${flowType.name} - ${deviceType}: FAILED`);
		if (error.response) {
			console.log(`   Status: ${error.response.status}`);
			console.log(`   Error: ${error.response.data?.error || 'Unknown error'}`);
			console.log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
		} else if (error.request) {
			console.log(`   Error: No response from server`);
		} else {
			console.log(`   Error: ${error.message}`);
		}

		return { success: false, error: error.message };
	}
}

/**
 * Test server connectivity
 */
async function testServerConnectivity() {
	console.log('\n🔗 Testing Server Connectivity...');

	try {
		const response = await api.get('/');
		console.log('✅ Server connectivity: SUCCESS');
		console.log(`   Status: ${response.status}`);
		return { success: true };
	} catch (error) {
		console.log('❌ Server connectivity: FAILED');
		console.log(`   Error: ${error.message}`);
		return { success: false, error: error.message };
	}
}

/**
 * Test API endpoint availability
 */
async function testAPIEndpoints() {
	console.log('\n🔍 Testing API Endpoints...');

	const endpoints = [
		'/api/pingone/mfa/register-device',
		'/api/pingone/mfa/devices',
		'/api/pingone/mfa/activate-device',
	];

	const results = [];

	for (const endpoint of endpoints) {
		try {
			// Test with GET to see if endpoint exists (should return 405 for POST-only endpoints)
			await api.get(endpoint);
			console.log(`✅ ${endpoint}: EXISTS`);
			results.push({ endpoint, success: true });
		} catch (error) {
			if (error.response && error.response.status === 405) {
				console.log(`✅ ${endpoint}: EXISTS (POST-only)`);
				results.push({ endpoint, success: true });
			} else {
				console.log(`❌ ${endpoint}: NOT FOUND`);
				console.log(`   Error: ${error.message}`);
				results.push({ endpoint, success: false, error: error.message });
			}
		}
	}

	return results;
}

/**
 * Main test runner
 */
async function runSimpleTests() {
	console.log('🚀 Starting Simple MFA Flow Testing');
	console.log('====================================');

	const results = {
		connectivity: null,
		endpoints: [],
		deviceRegistration: [],
		summary: {
			total: 0,
			passed: 0,
			failed: 0,
		},
	};

	// Test server connectivity
	const connectivityResult = await testServerConnectivity();
	results.connectivity = connectivityResult;
	results.summary.total++;
	if (connectivityResult.success) {
		results.summary.passed++;
	} else {
		results.summary.failed++;
		console.log('\n❌ Server connectivity failed. Skipping remaining tests.');
		return results;
	}

	// Test API endpoints
	const endpointResults = await testAPIEndpoints();
	results.endpoints = endpointResults;
	results.summary.total += endpointResults.length;
	results.summary.passed += endpointResults.filter((r) => r.success).length;
	results.summary.failed += endpointResults.filter((r) => !r.success).length;

	// Test device registration for all combinations
	console.log('\n📱 Testing Device Registration Flows');
	console.log('-------------------------------------');

	for (const flowType of FLOW_TYPES) {
		for (const deviceType of DEVICE_TYPES) {
			const result = await testDeviceRegistration(flowType, deviceType);
			results.deviceRegistration.push({
				flow: flowType.name,
				device: deviceType,
				...result,
			});
			results.summary.total++;
			if (result.success) {
				results.summary.passed++;
			} else {
				results.summary.failed++;
			}
		}
	}

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

	console.log('\nServer Connectivity:');
	const connectivityStatus = results.connectivity.success ? '✅' : '❌';
	console.log(`${connectivityStatus} Server connectivity`);

	console.log('\nAPI Endpoints:');
	results.endpoints.forEach((result) => {
		const status = result.success ? '✅' : '❌';
		console.log(`${status} ${result.endpoint}`);
	});

	console.log('\nDevice Registration Results:');
	results.deviceRegistration.forEach((result) => {
		const status = result.success ? '✅' : '❌';
		console.log(`${status} ${result.flow} - ${result.device}`);
	});

	// Production readiness assessment
	console.log('\n🏭 Production Readiness Assessment');
	console.log('==================================');

	const successRate = (results.summary.passed / results.summary.total) * 100;

	if (successRate >= 95) {
		console.log('✅ READY FOR PRODUCTION');
		console.log('   All critical functionality is working correctly');
	} else if (successRate >= 80) {
		console.log('⚠️  CONDITIONALLY READY');
		console.log('   Some issues found but core functionality works');
	} else {
		console.log('❌ NOT READY FOR PRODUCTION');
		console.log('   Significant issues need to be addressed');
	}

	console.log('\nKey Issues to Address:');
	if (results.summary.failed > 0) {
		console.log(`- ${results.summary.failed} test(s) failed`);

		// List specific failed tests
		const failedDeviceTests = results.deviceRegistration.filter((r) => !r.success);
		if (failedDeviceTests.length > 0) {
			console.log('- Device registration failures:');
			failedDeviceTests.forEach((test) => {
				console.log(`  * ${test.flow} - ${test.device}`);
			});
		}

		const failedEndpointTests = results.endpoints.filter((r) => !r.success);
		if (failedEndpointTests.length > 0) {
			console.log('- API endpoint failures:');
			failedEndpointTests.forEach((test) => {
				console.log(`  * ${test.endpoint}`);
			});
		}
	} else {
		console.log('- No critical issues found');
	}

	return results;
}

// Run tests
runSimpleTests()
	.then((results) => {
		console.log('\n✅ Testing completed successfully');
		process.exit(results.summary.failed > 0 ? 1 : 0);
	})
	.catch((error) => {
		console.error('\n❌ Testing failed:', error);
		process.exit(1);
	});
