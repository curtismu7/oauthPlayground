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
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  logoutEndpoint: string;
}

// App configuration from environment variables
export const appConfig = {
  title: process.env.PINGONE_APP_TITLE || 'PingOne OAuth Playground',
  description: process.env.PINGONE_APP_DESCRIPTION || 'Interactive playground for OAuth 2.0 and OpenID Connect with PingOne',
  version: process.env.PINGONE_APP_VERSION || '1.0.0',
  defaultTheme: process.env.PINGONE_APP_DEFAULT_THEME || 'light',
  devServer: {
    port: parseInt(process.env.PINGONE_DEV_SERVER_PORT || '3000'),
    https: process.env.PINGONE_DEV_SERVER_HTTPS === 'true',
  },
  features: {
    debugMode: process.env.PINGONE_FEATURE_DEBUG_MODE === 'true',
    analytics: process.env.PINGONE_FEATURE_ANALYTICS === 'true',
  },
};

// Default PingOne configuration
export const pingOneConfig: PingOneConfig = {
  environmentId: process.env.PINGONE_ENVIRONMENT_ID || '',
  clientId: process.env.PINGONE_CLIENT_ID || '',
  clientSecret: process.env.PINGONE_CLIENT_SECRET || '',
  redirectUri: process.env.PINGONE_REDIRECT_URI || `${window.location.origin}/callback`,
  logoutRedirectUri: process.env.PINGONE_LOGOUT_REDIRECT_URI || window.location.origin,
  apiUrl: process.env.PINGONE_API_URL || 'https://auth.pingone.com',
  authServerId: '', // Removed from .env as requested
  baseUrl: '',
  authUrl: '',
  authorizationEndpoint: '',
  tokenEndpoint: '',
  userInfoEndpoint: '',
  logoutEndpoint: '',
};

// OAuth 2.0 PKCE Configuration
export const PKCE_CONFIG = {
  codeChallengeMethod: 'S256',
  codeVerifierLength: 64,
};

// Default OAuth scopes
export const DEFAULT_SCOPES = 'openid profile email';

// OAuth flow types
export enum OAuthFlowType {
  AUTHORIZATION_CODE = 'authorization_code',
  IMPLICIT = 'implicit',
  CLIENT_CREDENTIALS = 'client_credentials',
  DEVICE_CODE = 'device_code',
  REFRESH_TOKEN = 'refresh_token',
}

// OAuth response types
export enum OAuthResponseType {
  CODE = 'code',
  TOKEN = 'token',
  ID_TOKEN = 'id_token',
}

// Security constants
export const SECURITY_CONFIG = {
  STATE_LENGTH: 32,
  NONCE_LENGTH: 32,
  MAX_TOKEN_AGE: 3600, // 1 hour
  MAX_STATE_AGE: 600, // 10 minutes
};

// API endpoints
export const API_ENDPOINTS = {
  AUTHORIZE: '/as/authorize',
  TOKEN: '/as/token',
  USERINFO: '/as/userinfo',
  REVOKE: '/as/revoke',
  INTROSPECT: '/as/introspect',
  LOGOUT: '/as/signoff',
  PAR: '/as/par', // Pushed Authorization Requests endpoint
};

// Error messages
export const OAUTH_ERRORS = {
  INVALID_REQUEST: 'invalid_request',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  ACCESS_DENIED: 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
  INVALID_SCOPE: 'invalid_scope',
  SERVER_ERROR: 'server_error',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
  INVALID_TOKEN: 'invalid_token',
};
