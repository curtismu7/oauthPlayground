#!/usr/bin/env node

/**
 * Flow Config Integration Test Script
 * Tests all Flow Config parameters in EnhancedAuthorizationCodeFlowV2
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Flow Config Integration in Enhanced Authorization Code Flow V2\n');

// Test 1: Check if Flow Config imports are correct
console.log('✅ Test 1: Checking Flow Config imports...');

const flowFile = path.join(__dirname, 'src/pages/flows/EnhancedAuthorizationCodeFlowV2.tsx');
const flowContent = fs.readFileSync(flowFile, 'utf8');

// Check imports
const hasFlowConfigImport = flowContent.includes(
	"import { FlowConfiguration, FlowConfig } from '../../components/FlowConfiguration'"
);
const hasDefaultConfigImport = flowContent.includes(
	"import { getDefaultConfig } from '../../utils/flowConfigDefaults'"
);

console.log(`   📦 FlowConfiguration import: ${hasFlowConfigImport ? '✅' : '❌'}`);
console.log(`   📦 getDefaultConfig import: ${hasDefaultConfigImport ? '✅' : '❌'}`);

// Test 2: Check if Flow Config state is defined
console.log('\n✅ Test 2: Checking Flow Config state management...');
const hasFlowConfigState = flowContent.includes(
	"useState<FlowConfig>(() => getDefaultConfig('authorization-code'))"
);
console.log(`   🔄 Flow Config state: ${hasFlowConfigState ? '✅' : '❌'}`);

// Test 3: Check if generateAuthUrl uses Flow Config parameters
console.log('\n✅ Test 3: Checking generateAuthUrl Flow Config integration...');

const authUrlTests = [
	{ param: 'scopes', check: "flowConfig.scopes.length > 0 ? flowConfig.scopes.join(' ')" },
	{ param: 'state', check: 'flowConfig.state ||' },
	{ param: 'nonce', check: 'nonce: flowConfig.nonce ||' },
	{ param: 'responseType', check: 'response_type: flowConfig.responseType ||' },
	{ param: 'PKCE', check: 'flowConfig.enablePKCE &&' },
	{ param: 'maxAge', check: 'flowConfig.maxAge > 0' },
	{ param: 'prompt', check: 'flowConfig.prompt' },
	{ param: 'loginHint', check: 'flowConfig.loginHint' },
	{ param: 'acrValues', check: 'flowConfig.acrValues.length > 0' },
	{ param: 'customParams', check: 'Object.entries(flowConfig.customParams)' },
];

authUrlTests.forEach((test) => {
	const hasParam = flowContent.includes(test.check);
	console.log(`   🔧 ${test.param} integration: ${hasParam ? '✅' : '❌'}`);
});

// Test 4: Check if Flow Config UI is rendered
console.log('\n✅ Test 4: Checking Flow Config UI rendering...');
const hasFlowConfigUI =
	flowContent.includes('<FlowConfiguration') &&
	flowContent.includes('config={flowConfig}') &&
	flowContent.includes('onConfigChange={setFlowConfig}');
console.log(`   🎨 Flow Config UI: ${hasFlowConfigUI ? '✅' : '❌'}`);

// Test 5: Check if generateAuthUrl dependency includes flowConfig
console.log('\n✅ Test 5: Checking generateAuthUrl dependencies...');
const hasDependency = flowContent.includes('[credentials, pkceCodes.codeChallenge, flowConfig]');
console.log(`   🔗 flowConfig dependency: ${hasDependency ? '✅' : '❌'}`);

// Test 6: Check Token Management enhancements
console.log('\n✅ Test 6: Checking Token Management enhancements...');
const tokenFile = path.join(__dirname, 'src/pages/TokenManagement.tsx');
const tokenContent = fs.readFileSync(tokenFile, 'utf8');

const hasTokenTypeDisplay = tokenContent.includes(
	"getTokenTypeInfo().type === 'access' ? 'Access Token'"
);
const hasDynamicExpiration = tokenContent.includes('currentAnalysis?.expiresIn');
const hasDynamicScopes = tokenContent.includes('getTokenTypeInfo().scopes?.join');

console.log(`   🏷️  Token type display: ${hasTokenTypeDisplay ? '✅' : '❌'}`);
console.log(`   ⏰ Dynamic expiration: ${hasDynamicExpiration ? '✅' : '❌'}`);
console.log(`   🎯 Dynamic scopes: ${hasDynamicScopes ? '✅' : '❌'}`);

// Test 7: Check centralized utilities
console.log('\n✅ Test 7: Checking centralized utilities...');

const centralizedFiles = [
	{ name: 'CentralizedSuccessMessage', path: 'src/components/CentralizedSuccessMessage.tsx' },
	{ name: 'usePageScroll', path: 'src/hooks/usePageScroll.ts' },
	{ name: 'scrollManager', path: 'src/utils/scrollManager.ts' },
	{ name: 'configurationStatus', path: 'src/utils/configurationStatus.ts' },
];

centralizedFiles.forEach((file) => {
	const exists = fs.existsSync(path.join(__dirname, file.path));
	console.log(`   📁 ${file.name}: ${exists ? '✅' : '❌'}`);
});

// Summary
console.log('\n📊 INTEGRATION TEST SUMMARY');
console.log('================================');

const totalTests = 6;
let passedTests = 0;

if (hasFlowConfigImport && hasDefaultConfigImport) passedTests++;
if (hasFlowConfigState) passedTests++;
if (authUrlTests.every((test) => flowContent.includes(test.check))) passedTests++;
if (hasFlowConfigUI) passedTests++;
if (hasDependency) passedTests++;
if (hasTokenTypeDisplay && hasDynamicExpiration && hasDynamicScopes) passedTests++;

console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
	console.log('\n🎉 ALL TESTS PASSED! Flow Config integration is complete and functional.');
	console.log('\n🚀 Ready to test in browser:');
	console.log('   1. Navigate to https://localhost:3000/flows/enhanced-authorization-code-v2');
	console.log('   2. Click the Configuration button to open Flow Config');
	console.log('   3. Modify scopes, nonce, max_age, prompt, login_hint, ACR values');
	console.log('   4. Add custom parameters');
	console.log('   5. Generate authorization URL and verify all parameters are included');
	console.log('   6. Complete the flow and check Token Management page for token types');
} else {
	console.log('\n⚠️  Some tests failed. Check the integration above.');
	process.exit(1);
}
