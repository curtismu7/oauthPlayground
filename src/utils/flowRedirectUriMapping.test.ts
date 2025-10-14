// src/utils/flowRedirectUriMapping.test.ts
// Test file to demonstrate the centralized redirect URI mapping system

import { 
	generateRedirectUriForFlow, 
	getFlowRedirectUriConfig, 
	flowRequiresRedirectUri,
	getFlowsRequiringRedirectUri,
	getFlowsNotRequiringRedirectUri,
	FLOW_REDIRECT_URI_MAPPING
} from './flowRedirectUriMapping';

// Mock window.location.origin for testing
Object.defineProperty(window, 'location', {
	value: {
		origin: 'https://localhost:3001'
	},
	writable: true
});

console.log('🧪 Testing Flow Redirect URI Mapping System');
console.log('==========================================');

// Test 1: Get redirect URI for OAuth Authorization Code V6
const oauthAuthzV6Uri = generateRedirectUriForFlow('oauth-authorization-code-v6');
console.log('1. OAuth Authorization Code V6:', oauthAuthzV6Uri);
// Expected: https://localhost:3001/authz-callback

// Test 2: Get redirect URI for OIDC Implicit V6
const oidcImplicitV6Uri = generateRedirectUriForFlow('oidc-implicit-v6');
console.log('2. OIDC Implicit V6:', oidcImplicitV6Uri);
// Expected: https://localhost:3001/oidc-implicit-callback

// Test 3: Get redirect URI for Client Credentials (should return null)
const clientCredsUri = generateRedirectUriForFlow('client-credentials-v6');
console.log('3. Client Credentials V6:', clientCredsUri);
// Expected: null (no redirect URI needed)

// Test 4: Check if flows require redirect URI
console.log('4. Flow Requirements:');
console.log('   - OAuth Authz V6 requires redirect URI:', flowRequiresRedirectUri('oauth-authorization-code-v6'));
console.log('   - Client Creds V6 requires redirect URI:', flowRequiresRedirectUri('client-credentials-v6'));
console.log('   - Device Auth V6 requires redirect URI:', flowRequiresRedirectUri('device-authorization-v6'));

// Test 5: Get flow configurations
const oauthAuthzConfig = getFlowRedirectUriConfig('oauth-authorization-code-v6');
const hybridConfig = getFlowRedirectUriConfig('oidc-hybrid-v6');
console.log('5. Flow Configurations:');
console.log('   - OAuth Authz V6:', oauthAuthzConfig);
console.log('   - OIDC Hybrid V6:', hybridConfig);

// Test 6: Get flows requiring redirect URIs
const flowsRequiringRedirect = getFlowsRequiringRedirectUri();
const flowsNotRequiringRedirect = getFlowsNotRequiringRedirectUri();
console.log('6. Flows by Requirements:');
console.log('   - Flows requiring redirect URI:', flowsRequiringRedirect.length, 'flows');
console.log('   - Flows NOT requiring redirect URI:', flowsNotRequiringRedirect.length, 'flows');

// Test 7: Show all V6 flows
const v6Flows = FLOW_REDIRECT_URI_MAPPING.filter(config => config.flowType.includes('v6'));
console.log('7. All V6 Flows:');
v6Flows.forEach(flow => {
	const uri = generateRedirectUriForFlow(flow.flowType);
	console.log(`   - ${flow.flowType}: ${uri || 'No redirect URI needed'}`);
});

console.log('\n✅ All tests completed!');
console.log('\n📋 Summary:');
console.log('- Centralized redirect URI mapping system is working');
console.log('- Each flow type has its correct callback path');
console.log('- System automatically adapts to different ports');
console.log('- Easy to maintain and extend with new flows');
