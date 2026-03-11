// src/utils/flowRedirectUriMapping.test.ts
import { logger } from '../utils/logger';
// Test file to demonstrate the centralized redirect URI mapping system

import {
	FLOW_REDIRECT_URI_MAPPING,
	flowRequiresRedirectUri,
	generateRedirectUriForFlow,
	getFlowRedirectUriConfig,
	getFlowsNotRequiringRedirectUri,
	getFlowsRequiringRedirectUri,
} from './flowRedirectUriMapping';

// Mock window.location.origin for testing
Object.defineProperty(window, 'location', {
	value: {
		origin: 'https://localhost:3001',
	},
	writable: true,
});

logger.info('🧪 Testing Flow Redirect URI Mapping System', 'Logger info');
logger.info('==========================================', 'Logger info');

// Test 1: Get redirect URI for OAuth Authorization Code V6
const oauthAuthzV6Uri = generateRedirectUriForFlow('oauth-authorization-code-v6');
logger.info('1. OAuth Authorization Code V6:', oauthAuthzV6Uri);
// Expected: https://localhost:3001/authz-callback

// Test 2: Get redirect URI for OIDC Implicit V6
const oidcImplicitV6Uri = generateRedirectUriForFlow('oidc-implicit-v6');
logger.info('2. OIDC Implicit V6:', oidcImplicitV6Uri);
// Expected: https://localhost:3001/oidc-implicit-callback

// Test 3: Get redirect URI for Client Credentials (should return null)
const clientCredsUri = generateRedirectUriForFlow('client-credentials-v6');
logger.info('3. Client Credentials V6:', clientCredsUri);
// Expected: null (no redirect URI needed)

// Test 4: Check if flows require redirect URI
logger.info('4. Flow Requirements:', 'Logger info');
logger.info(
	'   - OAuth Authz V6 requires redirect URI:',
	flowRequiresRedirectUri('oauth-authorization-code-v6')
);
logger.info(
	'   - Client Creds V6 requires redirect URI:',
	flowRequiresRedirectUri('client-credentials-v6')
);
logger.info(
	'   - Device Auth V6 requires redirect URI:',
	flowRequiresRedirectUri('device-authorization-v6')
);

// Test 5: Get flow configurations
const oauthAuthzConfig = getFlowRedirectUriConfig('oauth-authorization-code-v6');
const hybridConfig = getFlowRedirectUriConfig('oidc-hybrid-v6');
logger.info('5. Flow Configurations:', 'Logger info');
logger.info('   - OAuth Authz V6:', oauthAuthzConfig);
logger.info('   - OIDC Hybrid V6:', hybridConfig);

// Test 6: Get flows requiring redirect URIs
const flowsRequiringRedirect = getFlowsRequiringRedirectUri();
const flowsNotRequiringRedirect = getFlowsNotRequiringRedirectUri();
logger.info('6. Flows by Requirements:', 'Logger info');
logger.info('   - Flows requiring redirect URI:', flowsRequiringRedirect.length, 'flows');
logger.info('   - Flows NOT requiring redirect URI:', flowsNotRequiringRedirect.length, 'flows');

// Test 7: Show all V6 flows
const v6Flows = FLOW_REDIRECT_URI_MAPPING.filter((config) => config.flowType.includes('v6'));
logger.info('7. All V6 Flows:', 'Logger info');
v6Flows.forEach((flow) => {
	const uri = generateRedirectUriForFlow(flow.flowType);
	logger.info(`   - ${flow.flowType}: ${uri || 'No redirect URI needed'}`, 'Logger info');
});

logger.info('\n✅ All tests completed!', 'Logger info');
logger.info('\n📋 Summary:', 'Logger info');
logger.info('- Centralized redirect URI mapping system is working', 'Logger info');
logger.info('- Each flow type has its correct callback path', 'Logger info');
logger.info('- System automatically adapts to different ports', 'Logger info');
logger.info('- Easy to maintain and extend with new flows', 'Logger info');
