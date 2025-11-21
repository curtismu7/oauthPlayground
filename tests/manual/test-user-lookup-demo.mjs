#!/usr/bin/env node
// Demo of user lookup API showing the SCIM search implementation

const ENV_ID = 'b9817c16-9910-4415-b67e-4ac687da74d9';

console.log('🚀 PingOne User Lookup API - Implementation Demo');
console.log('='.repeat(70));
console.log('');

console.log('📋 Test Identifiers:');
console.log('  1. Username: curtis7');
console.log('  2. Email: cmuir@pingone.com');
console.log('');

console.log('🔍 How the API works:');
console.log('');

console.log('1️⃣  For username "curtis7":');
console.log('   Method: GET with filter parameter');
console.log('   Endpoint: GET /v1/environments/{envId}/users?filter=username%20eq%20%22curtis7%22');
console.log('   Headers:');
console.log('     Authorization: Bearer {workerToken}');
console.log('     Accept: application/json');
console.log('');
console.log('   Filter (before encoding): username eq "curtis7"');
console.log('   Filter (URL encoded): username%20eq%20%22curtis7%22');
console.log('');

console.log('2️⃣  For email "cmuir@pingone.com":');
console.log('   Method: GET with filter parameter');
console.log(
	'   Endpoint: GET /v1/environments/{envId}/users?filter=email%20eq%20%22cmuir%40pingone.com%22'
);
console.log('   Headers:');
console.log('     Authorization: Bearer {workerToken}');
console.log('     Accept: application/json');
console.log('');
console.log('   Filter (before encoding): email eq "cmuir@pingone.com"');
console.log('   Filter (URL encoded): email%20eq%20%22cmuir%40pingone.com%22');
console.log('');

console.log('3️⃣  Fallback search:');
console.log('   If username search fails, tries email search');
console.log('   If email search fails, tries username search');
console.log('');

console.log('='.repeat(70));
console.log('');

console.log('📝 Server Implementation (server.js):');
console.log('');
console.log('✅ Uses GET with filter parameter (not POST .search)');
console.log('✅ Proper URL encoding with encodeURIComponent()');
console.log('✅ Supports username and email filters (lowercase "username")');
console.log('✅ Includes fallback search mechanism');
console.log('✅ Returns user data with matchType indicator');
console.log('✅ Returns first user if multiple matches found');
console.log('');

console.log('🔐 To test with actual API calls, you need:');
console.log('  1. A Worker App configured in PingOne');
console.log('  2. Worker App must have "Identity Data Admin" or "Identity Data Read Only" role');
console.log('  3. Use client_credentials grant to get a worker token');
console.log('  4. Use the worker token to call the user lookup API');
console.log('');

console.log('📚 API Documentation:');
console.log(
	'  https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-read-all-scim-users-search'
);
console.log('');

console.log('='.repeat(70));
console.log('');

console.log('🧪 Testing server endpoint availability...');
console.log('');

async function testServerEndpoint() {
	try {
		const response = await fetch('http://localhost:3001/api/health');
		const data = await response.json();

		if (response.ok && data.status === 'ok') {
			console.log('✅ Server is running on http://localhost:3001');
			console.log(`   Version: ${data.version}`);
			console.log(`   Uptime: ${data.uptimeSeconds} seconds`);
			console.log('');

			console.log('📡 User Lookup Endpoint:');
			console.log('   POST http://localhost:3001/api/pingone/users/lookup');
			console.log('   Body: { environmentId, accessToken, identifier }');
			console.log('');

			console.log('💡 Example curl command (with valid worker token):');
			console.log('');
			console.log('curl -X POST http://localhost:3001/api/pingone/users/lookup \\');
			console.log('  -H "Content-Type: application/json" \\');
			console.log("  -d '{");
			console.log(`    "environmentId": "${ENV_ID}",`);
			console.log('    "accessToken": "YOUR_WORKER_TOKEN_HERE",');
			console.log('    "identifier": "curtis7"');
			console.log("  }'");
			console.log('');
		} else {
			console.log('❌ Server health check failed');
		}
	} catch (error) {
		console.log('❌ Server is not running or not accessible');
		console.log(`   Error: ${error.message}`);
		console.log('');
		console.log('   Start the server with: node server.js');
	}
}

await testServerEndpoint();

console.log('='.repeat(70));
console.log('✅ Demo completed');
console.log('='.repeat(70));
