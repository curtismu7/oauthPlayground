console.log('🔍 Debugging Authorization Code V7 Credentials Issue...');

// Check what credentials are currently stored
const checkCredentials = () => {
  console.log('
📋 Current Credential Storage:');
  
  // Check shared credentials
  const sharedCreds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
  console.log('1. Shared credentials (pingone_permanent_credentials):', {
    clientId: sharedCreds.clientId ? `${sharedCreds.clientId.substring(0, 8)}...` : 'none',
    environmentId: sharedCreds.environmentId || 'none',
    hasClientSecret: !!sharedCreds.clientSecret
  });
  
  // Check Authorization Code V7 flow-specific credentials
  const authzV7Key = 'oauth-authorization-code-v7';
  const authzV7Data = localStorage.getItem(authzV7Key);
  if (authzV7Data) {
    const parsed = JSON.parse(authzV7Data);
    console.log('2. Authorization Code V7 flow-specific credentials:', {
      clientId: parsed.credentials?.clientId ? `${parsed.credentials.clientId.substring(0, 8)}...` : 'none',
      environmentId: parsed.credentials?.environmentId || 'none',
      hasClientSecret: !!parsed.credentials?.clientSecret,
      hasValidCredentials: !!(parsed.credentials?.clientId && parsed.credentials?.environmentId)
    });
  } else {
    console.log('2. Authorization Code V7 flow-specific credentials: NOT FOUND');
  }
  
  // Check all localStorage keys for authorization code flows
  const authzKeys = Object.keys(localStorage).filter(key => 
    key.includes('authorization-code') || 
    key.includes('oauth-authorization') ||
    key.includes('oidc-authorization')
  );
  
  console.log('
🔍 All authorization code related keys:');
  authzKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`${key}:`, {
        hasCredentials: !!(data.credentials?.clientId && data.credentials?.environmentId),
        clientId: data.credentials?.clientId ? `${data.credentials.clientId.substring(0, 8)}...` : 'none',
        environmentId: data.credentials?.environmentId || 'none'
      });
    } catch (_e) {
      console.log(`${key}: (parse error)`);
    }
  });
};

checkCredentials();

console.log('
💡 Solution:');
console.log('The Authorization Code V7 flow needs its own valid credentials.');
console.log('1. Navigate to the OAuth Authorization Code V7 flow');
console.log('2. Enter valid client credentials in the configuration form');
console.log('3. Make sure to SAVE the credentials');
console.log('4. The flow should then use these instead of shared credentials');
