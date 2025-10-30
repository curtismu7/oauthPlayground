// Debug script to help diagnose file download issue
console.log('='.repeat(60));
console.log('🔍 DEBUGGING FILE DOWNLOAD ISSUE');
console.log('='.repeat(60));

// Check stored configuration
const flowKey = 'pingone-authentication';
const storedConfig = localStorage.getItem('pingone_login_playground_config');
const storedFlowData = comprehensiveFlowDataService.loadFlowCredentialsIsolated(flowKey);
const storedFlowConfig = comprehensiveFlowDataService.loadFlowDataComprehensive({ flowKey });

console.log('\n📂 STORED CONFIGURATION:');
console.log('localStorage:', storedConfig);
console.log('FlowData:', storedFlowData);
console.log('FlowConfig:', storedFlowConfig);

// Check if environment ID is valid
if (storedFlowData) {
  console.log('\n🔍 VALIDATION CHECKS:');
  console.log('Environment ID:', storedFlowData.environmentId || '(empty)');
  console.log('Client ID:', storedFlowData.clientId || '(empty)');
  console.log('Redirect URI:', storedFlowData.redirectUri || '(empty)');
  console.log('Scopes:', storedFlowData.scopes || '(empty)');
  
  // Try to build the URL
  const envId = storedFlowData.environmentId || 'MISSING';
  const clientId = storedFlowData.clientId || 'MISSING';
  const redirectUri = storedFlowData.redirectUri || 'MISSING';
  const scopes = Array.isArray(storedFlowData.scopes) ? storedFlowData.scopes.join(' ') : 'openid';
  
  const testUrl = `https://auth.pingone.com/${envId}/as/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=test-123`;
  
  console.log('\n🔗 GENERATED TEST URL:');
  console.log(testUrl);
  
  // Try to validate the URL
  try {
    const urlObj = new URL(testUrl);
    console.log('\n✅ URL IS VALID');
    console.log('Protocol:', urlObj.protocol);
    console.log('Host:', urlObj.host);
    console.log('Pathname:', urlObj.pathname);
  } catch (e) {
    console.error('\n❌ URL IS INVALID:', e.message);
  }
}

// Check session storage
console.log('\n📦 SESSION STORAGE:');
console.log('PKCE Verifier:', sessionStorage.getItem('pkce_code_verifier') ? 'Present' : 'Missing');
console.log('PKCE Challenge:', sessionStorage.getItem('pkce_code_challenge') ? 'Present' : 'Missing');
console.log('Flow Context:', sessionStorage.getItem('pingone_login_playground_context') || 'Missing');

// Instructions
console.log('\n📋 NEXT STEPS:');
console.log('1. Copy the "GENERATED TEST URL" above');
console.log('2. Paste it in a new browser tab');
console.log('3. See if it redirects properly or downloads a file');
console.log('4. Check the Network tab for the redirect request');
console.log('5. Look for any error responses from PingOne');
console.log('='.repeat(60));
