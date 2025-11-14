// Test script for user lookup functionality
// Usage: node test-user-lookup.mjs <environmentId> <workerToken> <identifier>

const [,, environmentId, workerToken, identifier] = process.argv;

if (!environmentId || !workerToken || !identifier) {
	console.error('Usage: node test-user-lookup.mjs <environmentId> <workerToken> <identifier>');
	console.error('Example: node test-user-lookup.mjs <envId> <token> curtis7');
	console.error('Example: node test-user-lookup.mjs <envId> <token> cmuir@pingone.com');
	process.exit(1);
}

async function testUserLookup() {
	console.log('🧪 Testing User Lookup');
	console.log('='.repeat(60));
	console.log(`Environment ID: ${environmentId.substring(0, 20)}...`);
	console.log(`Worker Token: ${workerToken.substring(0, 20)}...`);
	console.log(`Identifier: ${identifier}`);
	console.log('='.repeat(60));
	console.log('');

	try {
		const response = await fetch('http://localhost:3001/api/pingone/users/lookup', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				environmentId,
				accessToken: workerToken,
				identifier,
			}),
		});

		const responseText = await response.text();
		let data;
		
		try {
			data = JSON.parse(responseText);
		} catch (e) {
			console.error('❌ Failed to parse response as JSON:');
			console.error(responseText.substring(0, 500));
			process.exit(1);
		}

		console.log(`Status: ${response.status} ${response.statusText}`);
		console.log('');

		if (response.ok && data.user) {
			console.log('✅ User found!');
			console.log('='.repeat(60));
			console.log(`User ID: ${data.user.id}`);
			console.log(`Username: ${data.user.username || data.user.userName || 'N/A'}`);
			console.log(`Email: ${data.user.email || data.user.emails?.[0]?.value || 'N/A'}`);
			console.log(`Name: ${data.user.name?.given || ''} ${data.user.name?.family || ''}`.trim() || 'N/A');
			console.log(`Match Type: ${data.matchType || 'unknown'}`);
			if (data.filterUsed) {
				console.log(`Filter Used: ${data.filterUsed}`);
			}
			console.log('='.repeat(60));
		} else {
			console.error('❌ User not found or error occurred');
			console.error('='.repeat(60));
			console.error(`Error: ${data.error || 'unknown'}`);
			console.error(`Description: ${data.error_description || data.message || 'No description'}`);
			if (data.identifier) {
				console.error(`Identifier: ${data.identifier}`);
			}
			if (data.note) {
				console.error(`Note: ${data.note}`);
			}
			console.error('='.repeat(60));
			process.exit(1);
		}
	} catch (error) {
		console.error('❌ Test failed with error:');
		console.error(error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

testUserLookup();
