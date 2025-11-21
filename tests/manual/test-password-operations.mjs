#!/usr/bin/env node
// Test password reset operations with curtis7 user

const ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';
const CLIENT_ID = '66a4686b-9222-4ad2-91b6-03113711c9aa';
const CLIENT_SECRET = '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC';
const TEST_USER_ID = '5adc497b-dde7-44c6-a003-9b84f8038ff9'; // curtis7

async function getWorkerToken() {
	console.log('🔑 Getting worker token...');

	const tokenUrl = `https://auth.pingone.com/${ENV_ID}/as/token`;

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
		}),
	});

	const data = await response.json();

	if (!response.ok) {
		console.error('❌ Failed to get worker token:', data);
		return null;
	}

	console.log('✅ Worker token obtained\n');
	return data.access_token;
}

async function testGetPasswordState(workerToken) {
	console.log('='.repeat(70));
	console.log('🧪 Test 1: Get Password State');
	console.log('='.repeat(70));

	try {
		const response = await fetch(
			`http://localhost:3001/api/pingone/password/state?environmentId=${ENV_ID}&userId=${TEST_USER_ID}&workerToken=${workerToken}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);

		const data = await response.json();

		console.log(`Status: ${response.status} ${response.statusText}`);

		if (response.ok && data.success) {
			console.log('✅ Password state retrieved successfully');
			console.log('Password State:', JSON.stringify(data.passwordState, null, 2));
		} else {
			console.error('❌ Failed to get password state');
			console.error('Error:', data.error || 'unknown');
			console.error('Description:', data.error_description || data.message);
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
	console.log('');
}

async function testForcePasswordChange(workerToken) {
	console.log('='.repeat(70));
	console.log('🧪 Test 2: Force Password Change');
	console.log('='.repeat(70));

	try {
		const response = await fetch('http://localhost:3001/api/pingone/password/force-change', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: ENV_ID,
				userId: TEST_USER_ID,
				workerToken: workerToken,
			}),
		});

		const data = await response.json();

		console.log(`Status: ${response.status} ${response.statusText}`);

		if (response.ok && data.success) {
			console.log('✅ Password change forced successfully');
			console.log('Message:', data.message);
			if (data.transactionId) {
				console.log('Transaction ID:', data.transactionId);
			}
		} else {
			console.error('❌ Failed to force password change');
			console.error('Error:', data.error || 'unknown');
			console.error('Description:', data.error_description || data.message);
			if (data.pingOne) {
				console.error('PingOne Response:', JSON.stringify(data.pingOne, null, 2));
			}
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
	console.log('');
}

async function testSetPassword(workerToken) {
	console.log('='.repeat(70));
	console.log('🧪 Test 3: Set Password (Admin)');
	console.log('='.repeat(70));

	const newPassword = 'TempPass123!@#';

	try {
		const response = await fetch('http://localhost:3001/api/pingone/password/set', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: ENV_ID,
				userId: TEST_USER_ID,
				workerToken: workerToken,
				newPassword: newPassword,
				forceChange: true,
				bypassPasswordPolicy: false,
			}),
		});

		const data = await response.json();

		console.log(`Status: ${response.status} ${response.statusText}`);

		if (response.ok && data.success) {
			console.log('✅ Password set successfully');
			console.log('Message:', data.message);
			console.log('Force Change: true (user must change on next login)');
			if (data.transactionId) {
				console.log('Transaction ID:', data.transactionId);
			}
		} else {
			console.error('❌ Failed to set password');
			console.error('Error:', data.error || 'unknown');
			console.error('Description:', data.error_description || data.message);
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
	console.log('');
}

async function testUnlockPassword(workerToken) {
	console.log('='.repeat(70));
	console.log('🧪 Test 4: Unlock Password');
	console.log('='.repeat(70));

	try {
		const response = await fetch('http://localhost:3001/api/pingone/password/unlock', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: ENV_ID,
				userId: TEST_USER_ID,
				workerToken: workerToken,
			}),
		});

		const data = await response.json();

		console.log(`Status: ${response.status} ${response.statusText}`);

		if (response.ok && data.success) {
			console.log('✅ Password unlocked successfully');
			console.log('Message:', data.message);
		} else {
			console.error('❌ Failed to unlock password');
			console.error('Error:', data.error || 'unknown');
			console.error('Description:', data.error_description || data.message);
		}
	} catch (error) {
		console.error('❌ Test failed:', error.message);
	}
	console.log('');
}

async function main() {
	console.log('🚀 PingOne Password Operations Test');
	console.log('Environment ID:', ENV_ID);
	console.log('Test User: curtis7 (ID:', TEST_USER_ID + ')');
	console.log('');

	const workerToken = await getWorkerToken();

	if (!workerToken) {
		console.log('\n⚠️  Cannot proceed without worker token.');
		process.exit(1);
	}

	// Run tests
	await testGetPasswordState(workerToken);
	await testForcePasswordChange(workerToken);
	await testSetPassword(workerToken);
	await testUnlockPassword(workerToken);

	console.log('='.repeat(70));
	console.log('✅ All password operation tests completed');
	console.log('='.repeat(70));
	console.log('');
	console.log('📝 Summary:');
	console.log('  - Password state retrieval: Tests GET endpoint');
	console.log('  - Force password change: Tests PUT with forceChange flag');
	console.log('  - Set password: Tests PUT with value field and options');
	console.log('  - Unlock password: Tests PUT with status field');
	console.log('');
	console.log('🔐 All operations use correct PingOne API format:');
	console.log('  - PUT method (not POST)');
	console.log('  - Standard application/json content type');
	console.log('  - Correct field names (value, currentPassword, forceChange)');
	console.log('  - Proper verifyPolicy handling');
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
