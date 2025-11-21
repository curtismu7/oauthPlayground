#!/usr/bin/env node
// Direct test of user lookup API with curtis7 and cmuir@pingone.com

const ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';
const CLIENT_ID = '66a4686b-9222-4ad2-91b6-03113711c9aa';
const CLIENT_SECRET = '3D_ksu7589TfcVJm2fqEHjXuhc-DCRfoxEv0urEw8GIK7qiJe72n92WRQ0uaT2tC';

async function getWorkerToken() {
	console.log('🔑 Getting worker token...');

	// Try to get a worker token - this client may not be configured as a worker app
	// We'll try anyway and see what happens
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
		console.error('Note: This client may not be configured as a Worker App in PingOne');
		console.error(
			'You need to configure the client with appropriate roles (e.g., Identity Data Admin)'
		);
		return null;
	}

	console.log('✅ Worker token obtained');
	return data.access_token;
}

async function testUserLookup(identifier, workerToken) {
	console.log('\n' + '='.repeat(70));
	console.log(`🧪 Testing User Lookup: ${identifier}`);
	console.log('='.repeat(70));

	try {
		const response = await fetch('http://localhost:3001/api/pingone/users/lookup', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId: ENV_ID,
				accessToken: workerToken,
				identifier: identifier,
			}),
		});

		const data = await response.json();

		console.log(`Status: ${response.status} ${response.statusText}`);

		// Show full response for debugging
		if (!response.ok) {
			console.log('Full response:', JSON.stringify(data, null, 2));
		}

		if (response.ok && data.user) {
			console.log('✅ User found!');
			console.log(`  User ID: ${data.user.id}`);
			console.log(`  Username: ${data.user.username || data.user.userName || 'N/A'}`);
			console.log(`  Email: ${data.user.email || data.user.emails?.[0]?.value || 'N/A'}`);
			console.log(
				`  Name: ${data.user.name?.given || ''} ${data.user.name?.family || ''}`.trim() || 'N/A'
			);
			console.log(`  Match Type: ${data.matchType || 'unknown'}`);
			console.log(`  Status: ${data.user.enabled ? 'Enabled' : 'Disabled'}`);
		} else {
			console.error('❌ User not found or error occurred');
			console.error(`  Error: ${data.error || 'unknown'}`);
			console.error(`  Description: ${data.error_description || data.message || 'No description'}`);
			if (data.details) {
				console.error(`  Details: ${JSON.stringify(data.details, null, 2)}`);
			}
		}
	} catch (error) {
		console.error('❌ Test failed with error:');
		console.error(`  ${error.message}`);
	}
}

async function main() {
	console.log('🚀 PingOne User Lookup API Test');
	console.log('Environment ID:', ENV_ID);
	console.log('');

	const workerToken = await getWorkerToken();

	if (!workerToken) {
		console.log('\n⚠️  Cannot proceed without worker token.');
		console.log('Please configure the client as a Worker App with appropriate roles.');
		console.log('Required roles: Identity Data Admin or Identity Data Read Only');
		process.exit(1);
	}

	// Test with username
	await testUserLookup('curtis7', workerToken);

	// Test with email
	await testUserLookup('cmuir@pingone.com', workerToken);

	console.log('\n' + '='.repeat(70));
	console.log('✅ All tests completed');
	console.log('='.repeat(70));
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
