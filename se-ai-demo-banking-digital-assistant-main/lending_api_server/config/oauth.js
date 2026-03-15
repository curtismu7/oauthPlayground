// P1AIC (PingOne Advanced Identity Cloud) OAuth Configuration for Lending Service
// ForgeRock Identity Cloud OAuth2 Authorization Code Flow

const config = {
  // P1AIC OAuth2 endpoints - replace with your actual tenant name
  tenantName: process.env.P1AIC_TENANT_NAME || 'your-tenant-name',
  
  // OAuth2 endpoints
  authorizationEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/authorize`,
  tokenEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/access_token`,
  userInfoEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/userinfo`,
  introspectionEndpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/introspect`,
  
  // Client configuration for lending service
  clientId: process.env.P1AIC_CLIENT_ID || 'lending_jk',
  clientSecret: process.env.P1AIC_CLIENT_SECRET || 'lending_jk',
  
  // Redirect URI (must match what's configured in P1AIC)
  redirectUri: process.env.P1AIC_REDIRECT_URI || 'http://localhost:3002/api/auth/oauth/callback',
  
  // Scopes - includes lending-specific scopes
  scopes: [
    'openid', 
    'profile', 
    'email',
    'lending:read',
    'lending:credit:read',
    'lending:credit:limits',
    'lending:admin'
  ],
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || 'lending-session-secret-key',
  
  // Admin role configuration
  adminRole: process.env.ADMIN_ROLE || 'admin',
  
  // Token validation
  tokenValidation: {
    issuer: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha`,
    audience: process.env.P1AIC_CLIENT_ID || 'lending_jk'
  },
  
  // Token introspection configuration
  introspection: {
    endpoint: `https://openam-${process.env.P1AIC_TENANT_NAME || 'your-tenant-name'}.forgeblocks.com/am/oauth2/realms/root/realms/alpha/introspect`,
    clientId: process.env.P1AIC_CLIENT_ID || 'lending_jk',
    clientSecret: process.env.P1AIC_CLIENT_SECRET || 'lending_jk',
    timeout: parseInt(process.env.OAUTH_INTROSPECTION_TIMEOUT) || 10000 // 10 seconds
  }
};

module.exports = config;