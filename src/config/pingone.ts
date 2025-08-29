// OAuth Configuration for PingOne
export interface PingOneConfig {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  logoutRedirectUri: string;
  apiUrl: string;
  authServerId: string;
  baseUrl: string;
  authUrl: string;
  tokenEndpoint: string;
  authorizationEndpoint: string;
  userInfoEndpoint: string;
  logoutEndpoint: string;
}

// Get PingOne configuration from environment variables
export const getPingOneConfig = (): PingOneConfig => {
  const config: PingOneConfig = {
    environmentId: (import.meta as any).env?.VITE_PINGONE_ENVIRONMENT_ID || '',
    clientId: (import.meta as any).env?.VITE_PINGONE_CLIENT_ID || '',
    clientSecret: (import.meta as any).env?.VITE_PINGONE_CLIENT_SECRET || '',
    redirectUri: (import.meta as any).env?.VITE_PINGONE_REDIRECT_URI || 'https://localhost:3000/callback',
    logoutRedirectUri: (import.meta as any).env?.VITE_PINGONE_LOGOUT_REDIRECT_URI || 'https://localhost:3000',
    apiUrl: (import.meta as any).env?.VITE_PINGONE_API_URL || 'https://auth.pingone.com',
    authServerId: (import.meta as any).env?.VITE_PINGONE_AUTH_SERVER_ID || '',
    baseUrl: '',
    authUrl: '',
    tokenEndpoint: '',
    authorizationEndpoint: '',
    userInfoEndpoint: '',
    logoutEndpoint: ''
  };

  // Construct URLs
  config.baseUrl = `${config.apiUrl}/${config.environmentId}`;
  config.authUrl = `${config.baseUrl}/as`;
  config.authorizationEndpoint = `${config.authUrl}/authorize`;
  config.tokenEndpoint = `${config.authUrl}/token`;
  config.userInfoEndpoint = `${config.authUrl}/userinfo`;
  config.logoutEndpoint = `${config.authUrl}/signoff`;

  return config;
};

// Default OAuth configuration for PingOne
export const pingOneConfig = getPingOneConfig();

// OAuth scope defaults for PingOne
export const DEFAULT_SCOPES = 'openid profile email';

// PKCE configuration
export const PKCE_CONFIG = {
  codeChallengeMethod: 'S256',
  usePkce: true
};

// Session configuration
export const SESSION_CONFIG = {
  // Token refresh threshold (refresh when token expires in less than 5 minutes)
  tokenRefreshThreshold: 5 * 60 * 1000,
  // Session check interval (check every 30 seconds)
  sessionCheckInterval: 30 * 1000,
  // Maximum number of retry attempts for token refresh
  maxRetryAttempts: 3
};
