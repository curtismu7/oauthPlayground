// OAuth 2.0 and OpenID Connect Utility Functions
import {
  IdTokenPayload,
  UserInfo
} from '../types/oauth';

/**
 * Generate a random string for state parameter
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32): string => {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
};

/**
 * Generate a code verifier for PKCE
 * @returns {string} A random code verifier
 */
export const generateCodeVerifier = (): string => {
  return generateRandomString(64);
};

/**
 * Generate a code challenge from a code verifier for PKCE
 * @param {string} codeVerifier - The code verifier
 * @returns {Promise<string>} The code challenge (base64url encoded SHA-256 hash)
 */
export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert the ArrayBuffer to a base64url string
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Parse the URL hash or query parameters
 * @param {string} url - The URL to parse
 * @returns {Object} Parsed parameters as key-value pairs
 */
export const parseUrlParams = (url: string): Record<string, string> => {
  const params = new URLSearchParams(url.split('?')[1] || '');
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  // Also check hash parameters
  const hash = url.split('#')[1];
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    for (const [key, value] of hashParams.entries()) {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Build an authorization URL
 * @param {Object} config - Configuration object
 * @param {string} config.authEndpoint - Authorization endpoint URL
 * @param {string} config.clientId - Client ID
 * @param {string} config.redirectUri - Redirect URI
 * @param {string} config.scope - Space-separated list of scopes
 * @param {string} config.state - State parameter for CSRF protection
 * @param {string} [config.codeChallenge] - PKCE code challenge
 * @param {string} [config.codeChallengeMethod='S256'] - PKCE code challenge method
 * @param {string} [config.responseType='code'] - Response type
 * @returns {string} The complete authorization URL
 */
export const buildAuthUrl = ({
  authEndpoint,
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
  codeChallengeMethod = 'S256',
  responseType = 'code',
}: {
  authEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  responseType?: string;
}) => {
  const url = new URL(authEndpoint);
  const params = new URLSearchParams();

  params.append('client_id', clientId);
  params.append('redirect_uri', redirectUri);
  params.append('response_type', responseType);
  params.append('scope', scope);
  params.append('state', state);

  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', codeChallengeMethod);
  }

  url.search = params.toString();
  return url.toString();
};

/**
 * Exchange authorization code for tokens
 * @param {Object} config - Configuration object
 * @param {string} config.tokenEndpoint - Token endpoint URL
 * @param {string} config.clientId - Client ID
 * @param {string} config.redirectUri - Redirect URI
 * @param {string} config.code - Authorization code
 * @param {string} [config.codeVerifier] - PKCE code verifier
 * @param {string} [config.clientSecret] - Client secret (for confidential clients)
 * @returns {Promise<Object>} Token response
 */
export const exchangeCodeForTokens = async ({
  tokenEndpoint,
  clientId,
  redirectUri,
  code,
  codeVerifier,
  clientSecret,
}: {
  tokenEndpoint: string;
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier?: string;
  clientSecret?: string;
}) => {
  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('client_id', clientId);
  body.append('redirect_uri', redirectUri);
  body.append('code', code);

  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // For confidential clients, use Basic Auth or include client_secret in the body
  if (clientSecret) {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code for tokens');
  }

  return response.json();
};

/**
 * Validate ID token
 * @param {string} idToken - The ID token to validate
 * @param {string} clientId - The client ID
 * @param {string} issuer - The expected issuer URL
 * @returns {Promise<Object>} The decoded ID token claims
 */
export const validateIdToken = async (idToken: string, clientId: string, issuer: string): Promise<IdTokenPayload> => {
  // In a real app, you would use a JWT library to validate the token
  // This is a simplified example
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid ID token format');
  }

  try {
    const payload = JSON.parse(atob(parts[1]));

    console.log('🔍 ID Token Validation Debug:');
    console.log('  - Token issuer (iss):', payload.iss);
    console.log('  - Expected issuer:', issuer);
    console.log('  - Token audience (aud):', payload.aud);
    console.log('  - Expected audience (clientId):', clientId);

    // Verify the issuer
    if (payload.iss !== issuer) {
      console.error('❌ Issuer mismatch:', { expected: issuer, actual: payload.iss });
      throw new Error('Invalid issuer');
    }

    // Verify the audience
    if (payload.aud !== clientId) {
      console.error('❌ Audience mismatch:', { expected: clientId, actual: payload.aud });
      throw new Error('Invalid audience');
    }

    // Verify the token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }

    // Verify the token is not used before the 'nbf' (not before) time
    if (payload.nbf && payload.nbf > now) {
      throw new Error('Token is not yet valid');
    }

    // Note: In a real app, you should also verify the token signature
    // using the JWKS endpoint of the identity provider

    return payload;
  } catch (error) {
    console.error('Error validating ID token:', error);
    throw new Error('Invalid ID token');
  }
};

/**
 * Get user info from the UserInfo endpoint
 * @param {string} userInfoEndpoint - UserInfo endpoint URL
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} User info
 */
export const getUserInfo = async (userInfoEndpoint: string, accessToken: string): Promise<UserInfo> => {
  const response = await fetch(userInfoEndpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  
  return response.json();
};

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = parseJwt(token);
  if (!decoded?.exp) return true;
  
  const now = Date.now() / 1000;
  return decoded.exp < now;
};
