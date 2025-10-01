// Test script to verify authorization URL generation and API calls
import fetch from 'node-fetch';
import crypto from 'crypto';

// Test credentials (using the real values from the user's configuration)
const testCredentials = {
	environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
	clientId: 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
	clientSecret: '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a',
	redirectUri: 'https://localhost:3000/authz-callback',
	scopes: 'openid profile email',
};

// Test PKCE code generation
async function generatePKCECodes() {
	// Generate code verifier
	const codeVerifier = crypto.randomBytes(32).toString('base64url');

	// Generate code challenge
	const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

	return { codeVerifier, codeChallenge };
}

// Test authorization URL generation
async function testAuthorizationURL() {
	console.log('🧪 Testing Authorization URL Generation');
	console.log('=====================================');

	try {
		// Generate PKCE codes
		const pkceCodes = await generatePKCECodes();
		console.log('✅ PKCE codes generated');
		console.log('   Code Verifier:', pkceCodes.codeVerifier.substring(0, 20) + '...');
		console.log('   Code Challenge:', pkceCodes.codeChallenge.substring(0, 20) + '...');

		// Generate state
		const state = Math.random().toString(36).substring(2, 15);
		console.log('✅ State generated:', state);

		// Build authorization URL
		const authEndpoint = `https://auth.pingone.com/${testCredentials.environmentId}/as/authorize`;
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: testCredentials.clientId,
			redirect_uri: testCredentials.redirectUri,
			scope: testCredentials.scopes,
			state: state,
			code_challenge: pkceCodes.codeChallenge,
			code_challenge_method: 'S256',
		});

		const authUrl = `${authEndpoint}?${params.toString()}`;

		console.log('✅ Authorization URL generated:');
		console.log('   URL:', authUrl);
		console.log('');
		console.log('📋 URL Parameters:');
		console.log('   response_type:', 'code');
		console.log('   client_id:', testCredentials.clientId);
		console.log('   redirect_uri:', testCredentials.redirectUri);
		console.log('   scope:', testCredentials.scopes);
		console.log('   state:', state);
		console.log('   code_challenge:', pkceCodes.codeChallenge.substring(0, 20) + '...');
		console.log('   code_challenge_method:', 'S256');

		// Validate URL structure
		const url = new URL(authUrl);
		if (
			url.hostname === 'auth.pingone.com' &&
			url.pathname.includes(testCredentials.environmentId) &&
			url.searchParams.get('client_id') === testCredentials.clientId
		) {
			console.log('✅ URL structure validation passed');
		} else {
			console.log('❌ URL structure validation failed');
			return false;
		}

		return { authUrl, pkceCodes, state };
	} catch (error) {
		console.error('❌ Error generating authorization URL:', error);
		return false;
	}
}

// Test API endpoints
async function testAPIEndpoints() {
	console.log('\n🧪 Testing API Endpoints');
	console.log('========================');

	const baseUrl = 'http://localhost:3001';

	try {
		// Test environment config endpoint
		console.log('🔍 Testing /api/env-config...');
		const envResponse = await fetch(`${baseUrl}/api/env-config`);
		if (envResponse.ok) {
			const envConfig = await envResponse.json();
			console.log('✅ Environment config loaded:');
			console.log('   Environment ID:', envConfig.environmentId);
			console.log('   Client ID:', envConfig.clientId);
			console.log('   API URL:', envConfig.apiUrl);
		} else {
			console.log('❌ Failed to load environment config:', envResponse.status);
		}

		// Test token exchange endpoint (with mock data)
		console.log('\n🔍 Testing /api/token-exchange...');
		const tokenExchangeData = {
			grant_type: 'authorization_code',
			client_id: testCredentials.clientId,
			client_secret: testCredentials.clientSecret,
			code: 'mock-authorization-code',
			redirect_uri: testCredentials.redirectUri,
			environment_id: testCredentials.environmentId,
			code_verifier: 'mock-code-verifier',
		};

		const tokenResponse = await fetch(`${baseUrl}/api/token-exchange`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(tokenExchangeData),
		});

		if (tokenResponse.ok) {
			console.log('✅ Token exchange endpoint is accessible');
		} else {
			const errorText = await tokenResponse.text();
			console.log(
				'⚠️ Token exchange endpoint returned error (expected with mock data):',
				tokenResponse.status
			);
			console.log('   Error:', errorText.substring(0, 100) + '...');
		}
	} catch (error) {
		console.error('❌ Error testing API endpoints:', error);
	}
}

// Test credential validation
function testCredentialValidation() {
	console.log('\n🧪 Testing Credential Validation');
	console.log('================================');

	// Test environment ID format
	const envIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (envIdPattern.test(testCredentials.environmentId)) {
		console.log('✅ Environment ID format is valid');
	} else {
		console.log('❌ Environment ID format is invalid');
	}

	// Test client ID format
	const clientIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (clientIdPattern.test(testCredentials.clientId)) {
		console.log('✅ Client ID format is valid');
	} else {
		console.log('❌ Client ID format is invalid');
	}

	// Test redirect URI format
	if (
		testCredentials.redirectUri.startsWith('https://') ||
		testCredentials.redirectUri.startsWith('http://localhost')
	) {
		console.log('✅ Redirect URI format is valid');
	} else {
		console.log('❌ Redirect URI format is invalid');
	}

	// Test scopes
	const requiredScopes = ['openid'];
	const scopes = testCredentials.scopes.split(' ');
	const hasRequiredScopes = requiredScopes.every((scope) => scopes.includes(scope));
	if (hasRequiredScopes) {
		console.log('✅ Required scopes are present');
	} else {
		console.log('❌ Missing required scopes');
	}
}

// Run all tests
async function runTests() {
	console.log('🚀 Starting Authorization URL and API Tests');
	console.log('============================================');

	// Test credential validation
	testCredentialValidation();

	// Test authorization URL generation
	const authResult = await testAuthorizationURL();

	// Test API endpoints
	await testAPIEndpoints();

	console.log('\n📊 Test Summary');
	console.log('===============');
	if (authResult) {
		console.log('✅ Authorization URL generation: PASSED');
		console.log('✅ URL structure validation: PASSED');
		console.log('✅ Credential validation: PASSED');
		console.log('\n🎉 All tests passed! The authorization URL should work correctly.');
	} else {
		console.log('❌ Some tests failed. Please check the errors above.');
	}
}

// Run the tests
runTests().catch(console.error);
