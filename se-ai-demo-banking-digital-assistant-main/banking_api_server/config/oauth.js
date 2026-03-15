// P1AIC (PingOne Advanced Identity Cloud) OAuth Configuration
// ForgeRock Identity Cloud OAuth2 Authorization Code Flow

const config = {
  // P1AIC OAuth2 endpoints - replace with your actual tenant name
  tenantName: process.env.P1AIC_TENANT_NAME || 'your-tenant-name',
  
  // OAuth2 endpoints
  authorizationEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/authorize`,
  tokenEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/access_token`,
  userInfoEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/userinfo`,
  
  // Client configuration
  clientId: process.env.P1AIC_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.P1AIC_CLIENT_SECRET || 'your-client-secret',
  
  // Redirect URI (must match what's configured in P1AIC)
  redirectUri: process.env.P1AIC_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/callback',
  
  // Scopes - includes banking:admin scope for admin client
  scopes: [
    'openid', 
    'profile', 
    'email',
    'banking:admin'
  ],
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key',
  
  // Admin role configuration
  adminRole: process.env.ADMIN_ROLE || 'admin',
  
  // Token validation
  tokenValidation: {
    issuer: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha`,
    audience: process.env.P1AIC_CLIENT_ID || 'your-client-id'
  }
};

module.exports = config;
