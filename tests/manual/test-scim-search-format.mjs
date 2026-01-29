#!/usr/bin/env node
// Shows the exact SCIM search requests that the server makes

console.log('🔍 SCIM Search Request Format Verification\n');
console.log('='.repeat(70));

const testCases = [
	{ identifier: 'curtis7', type: 'username' },
	{ identifier: 'cmuir@pingone.com', type: 'email' },
	{ identifier: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', type: 'user_id' },
];

testCases.forEach((testCase, index) => {
	console.log(`\n${index + 1}. Testing: ${testCase.identifier} (${testCase.type})`);
	console.log('-'.repeat(70));

	if (testCase.type === 'user_id') {
		console.log('   Method: Direct GET request');
		console.log('   URL: GET /v1/environments/{envId}/users/{userId}');
		console.log('   Headers:');
		console.log('     Authorization: Bearer {workerToken}');
		console.log('     Accept: application/json');
	} else {
		const filter =
			testCase.type === 'email'
				? `email eq "${testCase.identifier}"`
				: `username eq "${testCase.identifier}"`;

		console.log('   Method: SCIM Search (POST)');
		console.log('   URL: POST /v1/environments/{envId}/users/.search');
		console.log('   Headers:');
		console.log('     Authorization: Bearer {workerToken}');
		console.log('     Content-Type: application/scim+json');
		console.log('     Accept: application/json');
		console.log('   Body:');
		console.log('   {');
		console.log('     "schemas": [');
		console.log('       "urn:ietf:params:scim:api:messages:2.0:SearchRequest"');
		console.log('     ],');
		console.log(`     "filter": "${filter}",`);
		console.log('     "startIndex": 1,');
		console.log('     "count": 10');
		console.log('   }');

		console.log('\n   Expected Response:');
		console.log('   {');
		console.log('     "schemas": [');
		console.log('       "urn:ietf:params:scim:api:messages:2.0:ListResponse"');
		console.log('     ],');
		console.log('     "totalResults": 1,');
		console.log('     "Resources": [');
		console.log('       {');
		console.log('         "id": "user-id-here",');
		console.log('         "userName": "curtis7",');
		console.log('         "email": "cmuir@pingone.com",');
		console.log('         "name": {');
		console.log('           "given": "Curtis",');
		console.log('           "family": "Muir"');
		console.log('         },');
		console.log('         "enabled": true,');
		console.log('         "...": "other user attributes"');
		console.log('       }');
		console.log('     ]');
		console.log('   }');
	}
});

console.log(`\n${'='.repeat(70)}`);
console.log('\n✅ Server Implementation Details:\n');
console.log('1. Detects identifier type automatically:');
console.log('   - UUID pattern → Direct GET request');
console.log('   - Contains @ → Email SCIM search');
console.log('   - Otherwise → Username SCIM search');
console.log('');
console.log('2. Fallback mechanism:');
console.log('   - If username search fails → Try email search');
console.log('   - If email search fails → Try username search');
console.log('');
console.log('3. Response format:');
console.log('   {');
console.log('     "user": { ...user object... },');
console.log('     "matchType": "username" | "email" | "id"');
console.log('   }');
console.log('');
console.log('='.repeat(70));
console.log('\n📚 Filter Syntax (SCIM-style):');
console.log('');
console.log('  Equality:     username eq "curtis7"');
console.log('  Email:        email eq "cmuir@pingone.com"');
console.log('  Complex:      username eq "curtis7" and enabled eq true');
console.log('');
console.log('  Note: Use lowercase "username" (not "userName")');
console.log('');
console.log('  Reference: RFC 7644 - SCIM Protocol Specification');
console.log('  https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2');
console.log('');
console.log('='.repeat(70));
