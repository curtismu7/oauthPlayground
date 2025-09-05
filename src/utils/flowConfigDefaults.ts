import type { FlowConfig } from '../components/FlowConfiguration';

// Generate a random string for nonce/state
const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Default configuration for Authorization Code Flow
export const getAuthorizationCodeConfig = (): FlowConfig => ({
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code',
  responseMode: 'query', // Authorization Code Flow uses query mode
  grantType: 'authorization_code',
  applicationType: 'spa',
  authenticationMethod: 'none', // PKCE is handled separately
  enablePKCE: true,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: true,
  nonce: generateRandomString(32),
  state: generateRandomString(32),
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: ['urn:pingone:loa:1'],
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for PKCE Flow
export const getPKCEConfig = (): FlowConfig => ({
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code',
  responseMode: 'query', // PKCE Flow uses query mode
  grantType: 'authorization_code',
  applicationType: 'spa',
  authenticationMethod: 'none', // PKCE is handled separately
  enablePKCE: true,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: true,
  nonce: generateRandomString(32),
  state: generateRandomString(32),
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: ['urn:pingone:loa:1'],
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for Implicit Flow
export const getImplicitConfig = (): FlowConfig => ({
  scopes: ['openid', 'profile', 'email'],
  responseType: 'id_token token', // OIDC Implicit Flow
  responseMode: 'fragment', // Implicit Flow uses fragment mode
  grantType: 'implicit',
  applicationType: 'spa',
  authenticationMethod: 'none', // PKCE is handled separately
  enablePKCE: false,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: true,
  nonce: generateRandomString(32),
  state: generateRandomString(32),
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: ['urn:pingone:loa:1'],
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for Client Credentials Flow
export const getClientCredentialsConfig = (): FlowConfig => ({
  scopes: ['api:read', 'api:write'],
  responseType: '',
  responseMode: 'query',
  grantType: 'client_credentials',
  applicationType: 'backend',
  authenticationMethod: 'client_secret_basic',
  enablePKCE: false,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: false,
  nonce: '',
  state: '',
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: [],
  accessTokenLifetime: 5, // 5 minutes for security
  refreshTokenLifetime: 0, // No refresh tokens for client credentials
  idTokenLifetime: 5,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for Worker Token Flow (short-lived tokens for security)
export const getWorkerTokenConfig = (): FlowConfig => ({
  scopes: ['api:read'],
  responseType: '',
  responseMode: 'query',
  grantType: 'client_credentials',
  applicationType: 'backend',
  authenticationMethod: 'client_secret_post',
  enablePKCE: false,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: false,
  nonce: '',
  state: '',
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: [],
  accessTokenLifetime: 5, // 5 minutes for security
  refreshTokenLifetime: 0, // No refresh tokens for worker tokens
  idTokenLifetime: 5,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for Device Code Flow
export const getDeviceCodeConfig = (): FlowConfig => ({
  scopes: ['openid', 'profile', 'email'],
  responseType: '',
  responseMode: 'query',
  grantType: 'urn:ietf:params:oauth:grant-type:device_code',
  applicationType: 'spa',
  authenticationMethod: 'none', // PKCE is handled separately
  enablePKCE: false,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: true,
  nonce: generateRandomString(32),
  state: generateRandomString(32),
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: ['urn:pingone:loa:1'],
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for Refresh Token Flow
export const getRefreshTokenConfig = (): FlowConfig => ({
  scopes: ['openid', 'profile', 'email'],
  responseType: '',
  responseMode: 'query',
  grantType: 'refresh_token',
  applicationType: 'spa',
  authenticationMethod: 'none', // PKCE is handled separately
  enablePKCE: false,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: true,
  nonce: '',
  state: '',
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: [],
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for Password Grant Flow
export const getPasswordGrantConfig = (): FlowConfig => ({
  scopes: ['openid', 'profile', 'email'],
  responseType: '',
  responseMode: 'query',
  grantType: 'password',
  applicationType: 'backend',
  authenticationMethod: 'client_secret_basic',
  enablePKCE: false,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: true,
  nonce: generateRandomString(32),
  state: generateRandomString(32),
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: ['urn:pingone:loa:1'],
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Default configuration for Hybrid Flow
export const getHybridConfig = (): FlowConfig => ({
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code id_token', // Default to most common hybrid type
  responseMode: 'fragment', // Hybrid flows use fragment mode
  grantType: 'authorization_code',
  applicationType: 'spa',
  authenticationMethod: 'none', // PKCE is handled separately
  enablePKCE: true,
  codeChallengeMethod: 'S256',
  customParams: {},
  enableOIDC: true,
  nonce: generateRandomString(32),
  state: generateRandomString(32),
  customClaims: {},
  audience: '',
  maxAge: 0,
  prompt: '',
  loginHint: '',
  acrValues: ['urn:pingone:loa:1'],
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: ['https://localhost:3000'],
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60
});

// Factory function to get default config based on flow type
export const getDefaultConfig = (flowType: string): FlowConfig => {
  switch (flowType) {
    case 'authorization-code':
      return getAuthorizationCodeConfig();
    case 'pkce':
      return getPKCEConfig();
    case 'implicit':
      return getImplicitConfig();
    case 'client-credentials':
      return getClientCredentialsConfig();
    case 'worker-token':
      return getWorkerTokenConfig();
    case 'device-code':
      return getDeviceCodeConfig();
    case 'refresh-token':
      return getRefreshTokenConfig();
    case 'password-grant':
      return getPasswordGrantConfig();
    case 'hybrid':
      return getHybridConfig();
    default:
      return getAuthorizationCodeConfig();
  }
};

// PingOne-specific configuration presets
export const getPingOnePresets = () => ({
  // Standard OIDC scopes supported by PingOne
  standardScopes: ['openid', 'profile', 'email', 'address', 'phone', 'offline_access'],
  
  // PingOne-specific ACR values for different levels of assurance
  acrValues: [
    'urn:pingone:loa:1',  // Level 1 - Basic authentication
    'urn:pingone:loa:2',  // Level 2 - Multi-factor authentication
    'urn:pingone:loa:3'   // Level 3 - Hardware token authentication
  ],
  
  // PingOne-supported prompt values
  promptValues: ['', 'login', 'consent', 'select_account'],
  
  // PingOne-supported response types
  responseTypes: [
    'code',                    // Authorization Code
    'token',                   // Implicit
    'id_token',                // OIDC ID Token
    'code token',              // Hybrid
    'code id_token',           // Hybrid
    'code id_token token'      // Hybrid (all three)
  ],
  
  // PingOne-supported grant types
  grantTypes: [
    'authorization_code',
    'implicit',
    'client_credentials',
    'password',
    'refresh_token',
    'urn:ietf:params:oauth:grant-type:device_code'
  ]
});

// Validate configuration for PingOne compatibility
export const validatePingOneConfig = (config: FlowConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required scopes for OIDC
  if (config.enableOIDC && !config.scopes.includes('openid')) {
    errors.push('OpenID Connect requires the "openid" scope');
  }
  
  // Check PKCE requirements for public clients
  if (config.responseType === 'code' && !config.enablePKCE) {
    errors.push('PKCE is recommended for public clients using Authorization Code flow');
  }
  
  // Check nonce requirement for OIDC implicit flow
  if (config.enableOIDC && config.responseType === 'id_token' && !config.nonce) {
    errors.push('Nonce is required for OIDC implicit flow with id_token response type');
  }
  
  // Check state requirement for security
  if (config.responseType === 'code' && !config.state) {
    errors.push('State parameter is recommended for CSRF protection');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
