#!/usr/bin/env node

/**
 * Test script for Protect Portal API endpoints
 * Tests all proxy endpoints used by the Protect Portal
 */

// Import fetch with SSL verification bypass for localhost
import { fetch } from 'undici';

const BASE_URL = 'https://localhost:3000';

// Create agent that ignores SSL errors for localhost
const agent = new (require('https').Agent)({
	rejectUnauthorized: false
});

// Test data
const testEnvironmentId = process.env.PINGONE_ENV_ID || 'test-env-id';
const testClientId = process.env.PINGONE_CLIENT_ID || 'test-client-id';
const testClientSecret = process.env.PINGONE_CLIENT_SECRET || 'test-client-secret';
const testWorkerToken = process.env.PINGONE_WORKER_TOKEN || 'test-worker-token';
const testUserId = 'test-user-id';

// Test endpoints
const testEndpoints = [
	{
		name: 'Risk Evaluation',
		method: 'POST',
		url: `${BASE_URL}/api/pingone/risk-evaluations`,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${testWorkerToken}`
		},
		body: {
			environmentId: testEnvironmentId,
			riskEvent: {
				type: 'LOGIN',
				userId: testUserId,
				timestamp: new Date().toISOString(),
				ipAddress: '192.168.1.1',
				userAgent: 'Mozilla/5.0 (Test Browser)',
				device: {
					type: 'desktop',
					os: 'Windows',
					browser: 'Chrome'
				}
			}
		},
		expectedStatus: [200, 201]
	},
	{
		name: 'Embedded Login Initialize',
		method: 'POST',
		url: `${BASE_URL}/api/pingone/redirectless/authorize`,
		headers: {
			'Content-Type': 'application/json'
		},
		body: {
			environmentId: testEnvironmentId,
			clientId: testClientId,
			redirectUri: 'http://localhost:3000/callback',
			scopes: ['openid', 'profile', 'email'],
			codeChallenge: 'test-code-challenge',
			codeChallengeMethod: 'S256',
			state: 'test-state'
		},
		expectedStatus: [200, 201]
	},
	{
		name: 'MFA User Devices',
		method: 'GET',
		url: `${BASE_URL}/api/pingone/user/${testUserId}/devices`,
		headers: {
			'Accept': 'application/json',
			'Authorization': `Bearer ${testWorkerToken}`
		},
		queryParams: {
			environmentId: testEnvironmentId,
			accessToken: testWorkerToken
		},
		expectedStatus: [200, 201]
	},
	{
		name: 'Worker Token',
		method: 'POST',
		url: `${BASE_URL}/api/pingone/token`,
		headers: {
			'Content-Type': 'application/json'
		},
		body: {
			environment_id: testEnvironmentId,
			client_id: testClientId,
			client_secret: testClientSecret,
			grant_type: 'client_credentials'
		},
		expectedStatus: [200, 201]
	},
	{
		name: 'User Profile',
		method: 'GET',
		url: `${BASE_URL}/api/pingone/user/${testUserId}`,
		queryParams: {
			environmentId: testEnvironmentId,
			accessToken: testWorkerToken
		},
		expectedStatus: [200, 201]
	},
	{
		name: 'User MFA Status',
		method: 'GET',
		url: `${BASE_URL}/api/pingone/user/${testUserId}/mfa`,
		queryParams: {
			environmentId: testEnvironmentId,
			accessToken: testWorkerToken
		},
		expectedStatus: [200, 201]
	}
];

/**
 * Make HTTP request
 */
async function makeRequest(endpoint) {
	const url = new URL(endpoint.url);
	
	// Add query params
	if (endpoint.queryParams) {
		Object.entries(endpoint.queryParams).forEach(([key, value]) => {
			url.searchParams.append(key, value);
		});
	}

	const options = {
		method: endpoint.method,
		headers: endpoint.headers || {}
	};

	// Add body for POST/PUT requests
	if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
		options.body = JSON.stringify(endpoint.body);
	}

	try {
		console.log(`\n🧪 Testing: ${endpoint.name}`);
		console.log(`   ${endpoint.method} ${url}`);
		
		const response = await fetch(url, options);
		const status = response.status;
		const contentType = response.headers.get('content-type');
		
		console.log(`   Status: ${status} ${response.statusText}`);
		console.log(`   Content-Type: ${contentType}`);

		// Check if status is in expected range
		const statusOk = endpoint.expectedStatus.includes(status);
		
		if (statusOk) {
			console.log(`   ✅ SUCCESS: Status ${status} is expected`);
		} else {
			console.log(`   ❌ FAILED: Expected status ${endpoint.expectedStatus.join(' or ')}, got ${status}`);
		}

		// Try to parse response
		let responseData;
		try {
			if (contentType && contentType.includes('application/json')) {
				responseData = await response.json();
				console.log(`   Response: ${JSON.stringify(responseData, null, 2).substring(0, 200)}...`);
			} else {
				responseData = await response.text();
				console.log(`   Response: ${responseData.substring(0, 200)}...`);
			}
		} catch (parseError) {
			console.log(`   ⚠️  Could not parse response: ${parseError.message}`);
		}

		return {
			name: endpoint.name,
			status,
			success: statusOk,
			response: responseData
		};

	} catch (error) {
		console.log(`   ❌ ERROR: ${error.message}`);
		return {
			name: endpoint.name,
			status: 'ERROR',
			success: false,
			error: error.message
		};
	}
}

/**
 * Run all tests
 */
async function runTests() {
	console.log('🚀 Starting Protect Portal API Tests');
	console.log(`   Base URL: ${BASE_URL}`);
	console.log(`   Environment ID: ${testEnvironmentId.substring(0, 8)}...`);
	console.log(`   Client ID: ${testClientId.substring(0, 8)}...`);
	console.log(`   User ID: ${testUserId}`);

	const results = [];

	for (const endpoint of testEndpoints) {
		const result = await makeRequest(endpoint);
		results.push(result);
		
		// Small delay between requests
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	// Summary
	console.log('\n📊 Test Results Summary:');
	console.log('='.repeat(50));

	const passed = results.filter(r => r.success).length;
	const failed = results.filter(r => !r.success).length;

	console.log(`   Total Tests: ${results.length}`);
	console.log(`   ✅ Passed: ${passed}`);
	console.log(`   ❌ Failed: ${failed}`);

	if (failed > 0) {
		console.log('\n❌ Failed Tests:');
		results.filter(r => !r.success).forEach(result => {
			console.log(`   - ${result.name}: ${result.error || `Status ${result.status}`}`);
		});
	}

	console.log('\n🎉 Test Complete!');
	process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
	console.error('❌ Test runner error:', error);
	process.exit(1);
});
