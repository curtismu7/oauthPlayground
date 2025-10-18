console.log('🔍 Debugging OAuth Authorization Code V7 Credentials...');

// Check what credentials are currently stored
const credentialManager = {
  getAllCredentials: () => {
    try {
      const stored = localStorage.getItem('pingone_permanent_credentials');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },
  loadConfigCredentials: () => {
    try {
      const stored = localStorage.getItem('pingone_config_credentials');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },
  loadAuthzFlowCredentials: () => {
    try {
      const stored = localStorage.getItem('pingone_authz_flow_credentials');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }
};

console.log('📋 Current Credential Storage:');
console.log('1. getAllCredentials():', credentialManager.getAllCredentials());
console.log('2. loadConfigCredentials():', credentialManager.loadConfigCredentials());
console.log('3. loadAuthzFlowCredentials():', credentialManager.loadAuthzFlowCredentials());

// Check for flow-specific credentials
const flowKeys = Object.keys(localStorage).filter(key => 
  key.includes('oauth-authorization-code') || 
  key.includes('authorization-code') ||
  key.includes('oidc-authorization-code')
);

console.log('
🔍 Flow-specific credential keys:');
flowKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`${key}:`, {
      hasCredentials: !!(data.credentials?.clientId && data.credentials?.environmentId),
      clientId: data.credentials?.clientId ? `${data.credentials.clientId.substring(0, 8)}...` : 'none',
      environmentId: data.credentials?.environmentId || 'none',
      hasClientSecret: !!data.credentials?.clientSecret
    });
  } catch (e) {
    console.log(`${key}: (parse error)`);
  }
});

console.log('
💡 Recommendation:');
console.log('If the Authorization Code V7 flow is using invalid credentials,');
console.log('you may need to configure separate credentials for this flow.');
