console.log('🔍 Checking OpenID Connect Endpoints...');

// For proper OpenID Connect, we should have these endpoints:
const expectedEndpoints = {
  authorizationEndpoint: 'https://auth.pingone.com/{environmentId}/as/authorize',
  tokenEndpoint: 'https://auth.pingone.com/{environmentId}/as/token',
  userInfoEndpoint: 'https://auth.pingone.com/{environmentId}/as/userinfo',
  introspectionEndpoint: 'https://auth.pingone.com/{environmentId}/as/introspect',
  jwksUri: 'https://auth.pingone.com/{environmentId}/as/jwks',
  issuer: 'https://auth.pingone.com/{environmentId}/as'
};

console.log('Expected OpenID Connect endpoints:');
Object.entries(expectedEndpoints).forEach(([name, url]) => {
  console.log(`${name}: ${url}`);
});

// Check what endpoints are currently configured
const authzV7Key = 'oauth-authorization-code-v7';
const currentData = JSON.parse(localStorage.getItem(authzV7Key) || '{}');

if (currentData.credentials) {
  console.log('
Current configured endpoints:');
  console.log('Authorization Endpoint:', currentData.credentials.authorizationEndpoint || 'Not set');
  console.log('Token Endpoint:', currentData.credentials.tokenEndpoint || 'Not set');
  console.log('UserInfo Endpoint:', currentData.credentials.userInfoEndpoint || 'Not set');
  console.log('Issuer URL:', currentData.credentials.issuerUrl || 'Not set');
  
  // Check if we have the environment ID
  const envId = currentData.credentials.environmentId;
  if (envId) {
    console.log('
🔗 Constructed endpoints for environment:', envId);
    console.log('Authorization:', `https://auth.pingone.com/${envId}/as/authorize`);
    console.log('Token:', `https://auth.pingone.com/${envId}/as/token`);
    console.log('UserInfo:', `https://auth.pingone.com/${envId}/as/userinfo`);
    console.log('Introspection:', `https://auth.pingone.com/${envId}/as/introspect`);
    console.log('JWKS:', `https://auth.pingone.com/${envId}/as/jwks`);
  }
}

console.log('
💡 For proper OpenID Connect, you should have:');
console.log('1. ✅ ID Token in the token response');
console.log('2. ✅ UserInfo endpoint for user profile data');
console.log('3. ✅ Introspection endpoint for token validation');
console.log('4. ✅ JWKS endpoint for token signature verification');
console.log('5. ✅ Proper response_type="code id_token"');
