console.log('🔧 Setting up Authorization Code V7 Flow Credentials...');

// First, let's clear any existing invalid flow-specific credentials
const authzV7Key = 'oauth-authorization-code-v7';
localStorage.removeItem(authzV7Key);

// Get the shared credentials as a starting point
const sharedCreds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');

console.log('Current shared credentials:', {
  clientId: sharedCreds.clientId ? `${sharedCreds.clientId.substring(0, 8)}...` : 'none',
  environmentId: sharedCreds.environmentId || 'none',
  hasClientSecret: !!sharedCreds.clientSecret
});

// Create a template for Authorization Code V7 flow credentials
const authzV7Template = {
  credentials: {
    environmentId: sharedCreds.environmentId || '',
    clientId: sharedCreds.clientId || '',
    clientSecret: sharedCreds.clientSecret || '',
    redirectUri: 'https://localhost:3000/authz-callback',
    scope: 'openid profile email',
    scopes: 'openid profile email',
    responseType: 'code',
    grantType: 'authorization_code',
    clientAuthMethod: 'client_secret_post',
    authorizationEndpoint: sharedCreds.environmentId ? `https://auth.pingone.com/${sharedCreds.environmentId}/as/authorize` : '',
    tokenEndpoint: sharedCreds.environmentId ? `https://auth.pingone.com/${sharedCreds.environmentId}/as/token` : '',
    userInfoEndpoint: sharedCreds.environmentId ? `https://auth.pingone.com/${sharedCreds.environmentId}/as/userinfo` : ''
  },
  flowConfig: {
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    grantType: 'authorization_code',
    enablePKCE: true,
    codeChallengeMethod: 'S256',
    clientAuthMethod: 'client_secret_post'
  },
  tokens: null,
  flowVariant: 'oidc'
};

// Save the template
localStorage.setItem(authzV7Key, JSON.stringify(authzV7Template));

console.log('
✅ Created Authorization Code V7 flow credentials template');
console.log('
📝 Next steps:');
console.log('1. Navigate to the OAuth Authorization Code V7 flow');
console.log('2. Check if the credentials are pre-filled (they should be)');
console.log('3. If the client credentials are invalid, update them with valid ones');
console.log('4. Make sure to SAVE the credentials');
console.log('5. Try the flow again');

console.log('
🔍 The flow should now use these credentials instead of shared ones');
