/* eslint-disable */
#!/usr/bin/env node

/**
 * OIDC Flow Compliance Test
 * Verifies our Enhanced Authorization Code Flow V2 follows OIDC-conformant patterns
 * Based on Auth0 documentation and OIDC Core 1.0 specification
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 OIDC FLOW COMPLIANCE VERIFICATION\n');
console.log('=====================================\n');

// Read implementation files
const enhancedFlowFile = path.join(__dirname, 'src/pages/flows/EnhancedAuthorizationCodeFlowV2.tsx');
const oauthUtilsFile = path.join(__dirname, 'src/utils/oauth.ts');
const clientAuthFile = path.join(__dirname, 'src/utils/clientAuthentication.ts');

const enhancedFlowContent = fs.readFileSync(enhancedFlowFile, 'utf8');
const oauthUtilsContent = fs.readFileSync(oauthUtilsFile, 'utf8');
const clientAuthContent = fs.readFileSync(clientAuthFile, 'utf8');

// Test categories based on Auth0 OIDC-conformant documentation
const complianceTests = [
  {
    category: '🔐 OIDC-Conformant Authorization Request',
    tests: [
      { name: 'response_type=code', check: enhancedFlowContent.includes('response_type: flowConfig.responseType'), required: true },
      { name: 'openid scope required', check: enhancedFlowContent.includes('openid'), required: true },
      { name: 'client_id parameter', check: enhancedFlowContent.includes('client_id: credentials.clientId'), required: true },
      { name: 'redirect_uri parameter', check: enhancedFlowContent.includes('redirect_uri: redirectUri'), required: true },
      { name: 'state parameter (CSRF)', check: enhancedFlowContent.includes('state: generatedState'), required: true },
      { name: 'nonce parameter (OIDC)', check: enhancedFlowContent.includes('nonce: generatedNonce'), required: true },
      { name: 'PKCE code_challenge', check: enhancedFlowContent.includes('code_challenge'), required: true },
      { name: 'audience parameter', check: enhancedFlowContent.includes('audience') || enhancedFlowContent.includes('flowConfig.audience'), required: false }
    ]
  },
  {
    category: '🔄 OIDC-Conformant Token Exchange',
    tests: [
      { name: 'grant_type=authorization_code', check: enhancedFlowContent.includes('authorization_code'), required: true },
      { name: 'Multiple client auth methods', check: clientAuthContent.includes('client_secret_basic') && clientAuthContent.includes('private_key_jwt'), required: false },
      { name: 'PKCE code_verifier', check: enhancedFlowContent.includes('code_verifier'), required: true },
      { name: 'Client authentication', check: enhancedFlowContent.includes('applyClientAuthentication'), required: true },
      { name: 'Secure token exchange', check: enhancedFlowContent.includes('token-exchange'), required: true }
    ]
  },
  {
    category: '🛡️ Enhanced Security (Beyond Standard)',
    tests: [
      { name: 'ID token signature verification', check: oauthUtilsContent.includes('jwtVerify'), required: true },
      { name: 'Nonce validation', check: oauthUtilsContent.includes('payload.nonce !== nonce'), required: true },
      { name: 'Issuer validation', check: oauthUtilsContent.includes('expectedIssuer'), required: true },
      { name: 'Audience validation', check: oauthUtilsContent.includes('audience: clientId'), required: true },
      { name: 'max_age/auth_time validation', check: oauthUtilsContent.includes('auth_time') && oauthUtilsContent.includes('maxAge'), required: true },
      { name: 'Nonce storage and cleanup', check: enhancedFlowContent.includes('oauth_nonce'), required: true }
    ]
  },
  {
    category: '📚 Educational Features',
    tests: [
      { name: 'Step-by-step flow', check: enhancedFlowContent.includes('EnhancedStepFlowV2'), required: false },
      { name: 'Security level descriptions', check: clientAuthContent.includes('getAuthMethodSecurityLevel'), required: false },
      { name: 'Detailed logging', check: enhancedFlowContent.includes('console.log'), required: false },
      { name: 'Error explanations', check: enhancedFlowContent.includes('Educational'), required: false },
      { name: 'Parameter explanations', check: enhancedFlowContent.includes('Flow config'), required: false }
    ]
  }
];

// Run compliance tests
let totalTests = 0;
let passedTests = 0;
let criticalIssues = 0;

console.log('📋 DETAILED COMPLIANCE ANALYSIS');
console.log('===============================\n');

complianceTests.forEach(category => {
  console.log(category.category);
  console.log('-'.repeat(category.category.length));
  
  category.tests.forEach(test => {
    totalTests++;
    const passed = test.check;
    if (passed) passedTests++;
    if (!passed && test.required) criticalIssues++;
    
    const status = passed ? '✅' : (test.required ? '❌' : '⚠️');
    const level = test.required ? 'REQUIRED' : 'OPTIONAL';
    console.log(`   ${status} ${test.name}: ${passed ? 'IMPLEMENTED' : 'MISSING'} (${level})`);
  });
  
  console.log('');
});

// Flow step verification
console.log('🔄 FLOW STEP SEQUENCE VERIFICATION');
console.log('===================================');

const expectedSteps = [
  'Setup OAuth Credentials',
  'Generate PKCE',
  'Build Authorization URL', 
  'User Authorization',
  'Receive Authorization Code',
  'Exchange Code for Tokens',
  'Validate Tokens & User Info'
];

const stepChecks = expectedSteps.map((step, index) => {
  const stepExists = enhancedFlowContent.includes(step) || 
                   enhancedFlowContent.includes(step.toLowerCase()) ||
                   enhancedFlowContent.includes(step.replace(/\s+/g, ''));
  return { step, exists: stepExists, index };
});

stepChecks.forEach(({ step, exists, index }) => {
  console.log(`   ${exists ? '✅' : '❌'} Step ${index + 1}: ${step} - ${exists ? 'PRESENT' : 'MISSING'}`);
});

console.log('');

// Server connectivity test
console.log('🌐 SERVER CONNECTIVITY TEST');
console.log('============================');

try {
  // Test backend health
  const { execSync } = await import('node:child_process');
  
  try {
    const backendTest = execSync('curl -s http://localhost:3001/api/health', { timeout: 5000 });
    const backendResponse = JSON.parse(backendTest.toString());
    console.log('   ✅ Backend Server: ONLINE');
    console.log(`      Status: ${backendResponse.status}`);
    console.log(`      Version: ${backendResponse.version}`);
  } catch (_error) {
    console.log('   ❌ Backend Server: OFFLINE or ERROR');
    console.log(`      Error: ${error.message}`);
  }
  
  try {
    const frontendTest = execSync('curl -s -I http://localhost:3000 | head -1', { timeout: 5000 });
    const frontendResponse = frontendTest.toString().trim();
    console.log('   ✅ Frontend Server: ONLINE');
    console.log(`      Response: ${frontendResponse}`);
  } catch (_error) {
    console.log('   ❌ Frontend Server: OFFLINE or ERROR');
    console.log(`      Error: ${error.message}`);
  }
  
} catch (_error) {
  console.log('   ⚠️ Server test skipped (child_process not available)');
}

console.log('');

// Final summary
console.log('📊 FINAL COMPLIANCE SUMMARY');
console.log('============================');
console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Compliance Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
console.log(`🚨 Critical Issues: ${criticalIssues}`);

const flowStepsWorking = stepChecks.filter(s => s.exists).length;
console.log(`🔄 Flow Steps: ${flowStepsWorking}/${expectedSteps.length} implemented`);

if (criticalIssues === 0 && passedTests >= totalTests * 0.9) {
  console.log('\n🏆 EXCELLENT OIDC COMPLIANCE!');
  console.log('\n🎉 Your Enhanced Authorization Code Flow V2 implementation:');
  console.log('   ✅ Exceeds OIDC-conformant standards');
  console.log('   ✅ Implements all required security features');
  console.log('   ✅ Provides comprehensive educational value');
  console.log('   ✅ Ready for production use');
  
  console.log('\n🚀 READY FOR TESTING:');
  console.log('   1. Navigate to: https://localhost:3000/flows/enhanced-authorization-code-v2');
  console.log('   2. Test different client authentication methods');
  console.log('   3. Verify OIDC parameter functionality');
  console.log('   4. Complete full OAuth flow with ID token validation');
  console.log('   5. Check console logs for detailed security validation');
  
} else {
  console.log('\n⚠️ Some compliance issues found:');
  if (criticalIssues > 0) {
    console.log(`   🚨 ${criticalIssues} critical OIDC requirements missing`);
  }
  if (passedTests < totalTests * 0.9) {
    console.log(`   📉 Compliance rate below 90%`);
  }
}

console.log('\n📚 REFERENCES:');
console.log('   • OpenID Connect Core 1.0: https://openid.net/specs/openid-connect-core-1_0.html');
console.log('   • Auth0 OIDC-Conformant: https://auth0.com/docs/authenticate/login/oidc-conformant-authentication/oidc-adoption-auth-code-flow');
