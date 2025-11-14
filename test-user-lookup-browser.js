// Browser Console Test Script for User Lookup
// Copy and paste this into the browser console on the password reset page
// Usage: Just paste and run, it will use credentials from localStorage

(async function testUserLookup() {
	console.log('🧪 Testing User Lookup (Browser Console)');
	console.log('='.repeat(60));
	
	// Get credentials from localStorage
	const FLOW_TYPE = 'heliomart-password-reset';
	const credsKey = `pingone_worker_token_credentials_${FLOW_TYPE}`;
	const tokenKey = `worker_token_${FLOW_TYPE}`;
	
	const credsStr = localStorage.getItem(credsKey);
	const token = localStorage.getItem(tokenKey);
	
	if (!credsStr || !token) {
		console.error('❌ Credentials not found in localStorage');
		console.error('Please configure worker token on the password reset page first.');
		console.error('Looking for:', { credsKey, tokenKey });
		return;
	}
	
	const creds = JSON.parse(credsStr);
	const environmentId = creds.environmentId;
	
	if (!environmentId) {
		console.error('❌ Environment ID not found in credentials');
		return;
	}
	
	console.log(`Environment ID: ${environmentId.substring(0, 20)}...`);
	console.log(`Worker Token: ${token.substring(0, 20)}...`);
	console.log('='.repeat(60));
	console.log('');
	
	// Test identifiers
	const identifiers = ['curtis7', 'cmuir@pingone.com'];
	
	for (const identifier of identifiers) {
		console.log(`\n🔍 Testing identifier: ${identifier}`);
		console.log('-'.repeat(60));
		
		try {
			const response = await fetch('http://localhost:3001/api/pingone/users/lookup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					environmentId,
					accessToken: token,
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
				continue;
			}
			
			console.log(`Status: ${response.status} ${response.statusText}`);
			
			if (response.ok && data.user) {
				console.log('✅ User found!');
				console.log(`  User ID: ${data.user.id}`);
				console.log(`  Username: ${data.user.username || data.user.userName || 'N/A'}`);
				console.log(`  Email: ${data.user.email || data.user.emails?.[0]?.value || 'N/A'}`);
				console.log(`  Name: ${(data.user.name?.given || '')} ${(data.user.name?.family || '')}`.trim() || 'N/A');
				console.log(`  Match Type: ${data.matchType || 'unknown'}`);
				if (data.filterUsed) {
					console.log(`  Filter Used: ${data.filterUsed}`);
				}
			} else {
				console.error('❌ User not found or error occurred');
				console.error(`  Error: ${data.error || 'unknown'}`);
				console.error(`  Description: ${data.error_description || data.message || 'No description'}`);
				if (data.identifier) {
					console.error(`  Identifier: ${data.identifier}`);
				}
			}
		} catch (error) {
			console.error('❌ Test failed with error:');
			console.error(`  ${error.message}`);
		}
	}
	
	console.log('\n' + '='.repeat(60));
	console.log('✅ Test completed!');
})();


