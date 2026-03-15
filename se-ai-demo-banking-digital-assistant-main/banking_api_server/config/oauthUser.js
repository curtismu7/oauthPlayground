// P1AIC (PingOne Advanced Identity Cloud) OAuth Configuration for End Users
// Separate OAuth client for end user authentication

const config = {
  // P1AIC OAuth2 endpoints - replace with your actual tenant name
  tenantName: process.env.P1AIC_TENANT_NAME || 'your-tenant-name',
  
  // OAuth2 endpoints
  authorizationEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/authorize`,
  tokenEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/access_token`,
  userInfoEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/userinfo`,
  
  // Client configuration for end users (different from admin client)
  clientId: process.env.P1AIC_USER_CLIENT_ID || 'your-user-client-id',
  clientSecret: process.env.P1AIC_USER_CLIENT_SECRET || 'your-user-client-secret',
  
  // Redirect URI for end users (must match what's configured in P1AIC)
  redirectUri: process.env.P1AIC_USER_REDIRECT_URI || 'http://localhost:3001/api/auth/oauth/user/callback',
  
  // Scopes - includes banking scopes for end user client
  scopes: [
    'openid', 
    'profile', 
    'email',
    'banking:read',
    'banking:write',
    'banking:accounts:read',
    'banking:transactions:read',
    'banking:transactions:write'
  ],
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key',
  
  // End user role configuration
  userRole: process.env.USER_ROLE || 'customer',
  
  // Token validation
  tokenValidation: {
    issuer: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha`,
    audience: process.env.P1AIC_USER_CLIENT_ID || 'your-user-client-id'
  }
};

module.exports = config;
