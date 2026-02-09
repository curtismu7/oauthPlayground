/**
 * Debug SMS Registration Issue
 *
 * This script helps debug the 400 Bad Request error in SMS registration
 * by testing the lookup-user endpoint directly and showing what's being sent.
 */

const http = require('node:http');

// Configuration
const _BASE_URL = 'http://localhost:3001';

// Test data - replace with your actual values
const testData = {
	environmentId: process.env.PINGONE_ENV_ID || 'your-environment-id',
	username: process.env.TEST_USERNAME || 'test@example.com',
	workerToken: process.env.PINGONE_WORKER_TOKEN || 'your-worker-token',
};

console.log('🔍 SMS Registration Debug Tool');
console.log('==============================');
console.log('');

// Function to make HTTP request
function makeRequest(path, data) {
	return new Promise((resolve, reject) => {
		const postData = JSON.stringify(data);

		const options = {
			hostname: 'localhost',
			port: 3001,
			path: path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(postData),
			},
		};

		console.log(`📤 Request to ${path}:`);
		console.log(
			`   Environment ID: ${data.environmentId ? '✓' : '✗ MISSING'} ${data.environmentId}`
		);
		console.log(`   Username: ${data.username ? '✓' : '✗ MISSING'} ${data.username}`);
		console.log(
			`   Worker Token: ${data.workerToken ? '✓' : '✗ MISSING'} ${data.workerToken ? `(length: ${data.workerToken.length})` : ''}`
		);
		console.log('');

		const req = http.request(options, (res) => {
			console.log(`📥 Response Status: ${res.statusCode} ${res.statusMessage}`);
			console.log(`   Headers:`, res.headers);
			console.log('');

			let body = '';
			res.on('data', (chunk) => {
				body += chunk;
			});

			res.on('end', () => {
				try {
					const parsedBody = JSON.parse(body);
					console.log('📄 Response Body:');
					console.log(JSON.stringify(parsedBody, null, 2));
				} catch (_e) {
					console.log('📄 Response Body (raw):');
					console.log(body);
				}
				console.log('');
				resolve({ statusCode: res.statusCode, body: body });
			});
		});

		req.on('error', (error) => {
			console.error('❌ Request Error:', error.message);
			reject(error);
		});

		req.write(postData);
		req.end();
	});
}

// Test 1: Check lookup-user endpoint
async function testLookupUser() {
	console.log('🧪 Test 1: Lookup User Endpoint');
	console.log('================================');

	try {
		const response = await makeRequest('/api/pingone/mfa/lookup-user', testData);

		if (response.statusCode === 200) {
			console.log('✅ Lookup user successful');
		} else if (response.statusCode === 400) {
			console.log('❌ Lookup user failed with 400 Bad Request');
			console.log('   This usually means:');
			console.log('   - Missing or invalid environment ID');
			console.log('   - Missing or invalid username');
			console.log('   - Missing or invalid worker token');
			console.log('   - Worker token is expired');
		} else if (response.statusCode === 401) {
			console.log('❌ Lookup user failed with 401 Unauthorized');
			console.log('   This usually means the worker token is invalid or expired');
		} else if (response.statusCode === 404) {
			console.log('❌ Lookup user failed with 404 Not Found');
			console.log('   This usually means the user was not found in PingOne');
		} else {
			console.log(`❌ Lookup user failed with ${response.statusCode}`);
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}

	console.log('');
}

// Test 2: Check worker token status
async function testWorkerTokenStatus() {
	console.log('🧪 Test 2: Worker Token Status');
	console.log('===============================');

	try {
		const response = await makeRequest('/api/pingone/worker-token-status', {});

		if (response.statusCode === 200) {
			const data = JSON.parse(response.body);
			console.log('✅ Worker token status retrieved');
			console.log(`   Has Token: ${data.hasToken ? '✓' : '✗'}`);
			console.log(`   Token Valid: ${data.tokenValid ? '✓' : '✗'}`);
			console.log(`   Expires In: ${data.tokenExpiresIn || 'N/A'} seconds`);

			if (!data.tokenValid) {
				console.log('');
				console.log('⚠️  Worker token issues detected:');
				console.log('   - Token may be expired');
				console.log('   - Token may be invalid');
				console.log('   - Check your worker token configuration');
			}
		} else {
			console.log(`❌ Worker token status failed with ${response.statusCode}`);
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}

	console.log('');
}

// Test 3: Check environment configuration
async function testEnvironmentConfig() {
	console.log('🧪 Test 3: Environment Configuration');
	console.log('===================================');

	if (!testData.environmentId || testData.environmentId === 'your-environment-id') {
		console.log('❌ Environment ID not configured');
		console.log('   Please set PINGONE_ENV_ID environment variable');
		console.log('   Example: export PINGONE_ENV_ID="12345678-1234-1234-1234-123456789012"');
		return;
	}

	if (!testData.workerToken || testData.workerToken === 'your-worker-token') {
		console.log('❌ Worker token not configured');
		console.log('   Please set PINGONE_WORKER_TOKEN environment variable');
		console.log('   Example: export PINGONE_WORKER_TOKEN="your-worker-token"');
		return;
	}

	if (!testData.username || testData.username === 'test@example.com') {
		console.log('❌ Username not configured');
		console.log('   Please set TEST_USERNAME environment variable');
		console.log('   Example: export TEST_USERNAME="test.user@example.com"');
		return;
	}

	console.log('✅ Environment configuration appears to be set');
	console.log(`   Environment ID: ${testData.environmentId}`);
	console.log(`   Username: ${testData.username}`);
	console.log(`   Worker Token: ${testData.workerToken.substring(0, 20)}...`);
	console.log('');
}

// Main execution
async function main() {
	console.log('🚀 Starting SMS Registration Debug');
	console.log('');

	await testEnvironmentConfig();
	await testWorkerTokenStatus();
	await testLookupUser();

	console.log('🏁 Debug Complete');
	console.log('');
	console.log('📋 Next Steps:');
	console.log('1. Check the server logs for detailed debugging information');
	console.log('2. Verify your worker token is valid and not expired');
	console.log('3. Ensure the user exists in your PingOne environment');
	console.log('4. Check that the environment ID is correct');
	console.log('');
	console.log('🔧 To fix worker token issues:');
	console.log('   - Go to the Worker Token UI in the app');
	console.log('   - Reconfigure your worker token credentials');
	console.log('   - Ensure environment ID, client ID, and client secret are correct');
	console.log('');
}

// Run the debug script
main().catch(console.error);
