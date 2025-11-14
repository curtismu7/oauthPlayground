console.log('🔧 Setting up separate credentials for OAuth Authorization Code V7 flow...');

// First, let's see what credentials are currently being used
const currentCreds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
console.log('Current shared credentials:', {
  clientId: currentCreds.clientId ? `${currentCreds.clientId.substring(0, 8)}...` : 'none',
  environmentId: currentCreds.environmentId || 'none',
  hasClientSecret: !!currentCreds.clientSecret
});

// Check if Authorization Code V7 flow has its own credentials
const authzV7Key = 'oauth-authorization-code-v7';
const authzV7Data = localStorage.getItem(authzV7Key);
console.log('
Authorization Code V7 flow-specific credentials:', authzV7Data ? 'EXISTS' : 'NOT FOUND');

if (!authzV7Data) {
  console.log('
💡 Solution: Configure separate credentials for Authorization Code V7 flow');
  console.log('1. Navigate to the OAuth Authorization Code V7 flow');
  console.log('2. Enter valid client credentials in the configuration form');
  console.log('3. Save the credentials (this will create flow-specific storage)');
  console.log('4. The flow will then use its own credentials instead of shared ones');
  
  // Create a placeholder flow-specific storage to encourage credential configuration
  const placeholderData = {
    credentials: {
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: 'https://localhost:3000/authz-callback',
      scope: 'openid profile email',
      scopes: 'openid profile email',
      responseType: 'code',
      grantType: 'authorization_code',
      clientAuthMethod: 'client_secret_post'
    },
    flowConfig: {},
    tokens: null,
    flowVariant: 'oidc'
  };
  
  localStorage.setItem(authzV7Key, JSON.stringify(placeholderData));
  console.log('
✅ Created placeholder storage for Authorization Code V7 flow');
  console.log('Now configure your credentials in the V7 flow UI!');
} else {
  console.log('
✅ Authorization Code V7 flow already has its own credentials');
  console.log('The flow should use these instead of shared credentials');
}

console.log('
🔄 Please refresh the page and try the Authorization Code V7 flow again');
