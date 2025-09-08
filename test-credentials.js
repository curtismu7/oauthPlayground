// Test script to run in browser console
console.log('🧪 Testing credential manager...');

// Test saving credentials
const testCredentials = {
  environmentId: 'test-env-12345-6789-4abc-def0-1234567890ab',
  clientId: 'test-client-12345',
  clientSecret: 'test-secret-12345',
  redirectUri: window.location.origin + '/dashboard-callback',
  scopes: ['openid', 'profile', 'email'],
  authEndpoint: 'https://auth.pingone.com/test-env-12345-6789-4abc-def0-1234567890ab/as/authorize',
  tokenEndpoint: 'https://auth.pingone.com/test-env-12345-6789-4abc-def0-1234567890ab/as/token',
  userInfoEndpoint: 'https://auth.pingone.com/test-env-12345-6789-4abc-def0-1234567890ab/as/userinfo'
};

console.log('💾 Saving test credentials...');
const permanentSuccess = credentialManager.savePermanentCredentials({
  environmentId: testCredentials.environmentId,
  clientId: testCredentials.clientId,
  redirectUri: testCredentials.redirectUri,
  scopes: testCredentials.scopes,
  authEndpoint: testCredentials.authEndpoint,
  tokenEndpoint: testCredentials.tokenEndpoint,
  userInfoEndpoint: testCredentials.userInfoEndpoint
});

const sessionSuccess = credentialManager.saveSessionCredentials({
  clientSecret: testCredentials.clientSecret
});

console.log('Save results:', { permanentSuccess, sessionSuccess });

// Test loading credentials
console.log('📖 Loading credentials...');
const loadedCredentials = credentialManager.getAllCredentials();
console.log('Loaded credentials:', loadedCredentials);

// Test status
console.log('📊 Credential status:', credentialManager.getCredentialsStatus());
console.log('✅ Permanent complete:', credentialManager.arePermanentCredentialsComplete());

// Test localStorage directly
console.log('🗄️ localStorage contents:');
console.log('pingone_permanent_credentials:', localStorage.getItem('pingone_permanent_credentials'));
console.log('pingone_session_credentials:', sessionStorage.getItem('pingone_session_credentials'));

console.log('🧪 Test complete!');
