import {
  IdTokenPayload,
  UserInfo
} from '../types/oauth';
import {
  jwtVerify,
  createRemoteJWKSet,
  JWTVerifyOptions,
  type JWTHeaderParameters,
} from 'jose';

// Client logging function for server.log
const clientLog = async (message: string) => {
  try {
    await fetch('/__log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      keepalive: true,
    });
  } catch {
    // no-op
  }
};

/**
 * Generate a random string for state parameter
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  // Use browser-compatible crypto instead of Node.js randomBytes
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
  console.log('🔍 [OAuth] Parsing URL parameters from:', url);
  clientLog(`[OAuth] Parsing URL parameters from: ${url}`);
  const params = new URLSearchParams(url.split('?')[1] || '');
  const result = {};
  
  console.log('🔍 [OAuth] Query parameters:');
  clientLog(`[OAuth] Query parameters:`);
  for (const [key, value] of params.entries()) {
    result[key] = value;
    console.log(`   ${key}: ${value}`);
    clientLog(`   ${key}: ${value}`);
  }
  
  // Also check hash parameters
  const hash = url.split('#')[1];
  if (hash) {
    console.log('🔍 [OAuth] Hash parameters:');
    clientLog(`[OAuth] Hash parameters:`);
    const hashParams = new URLSearchParams(hash);
    for (const [key, value] of hashParams.entries()) {
      result[key] = value;
      console.log(`   ${key}: ${value}`);
      clientLog(`   ${key}: ${value}`);
    }
  } else {
    console.log('🔍 [OAuth] No hash parameters found');
    clientLog(`[OAuth] No hash parameters found`);
  }
  
  console.log('✅ [OAuth] Final parsed parameters:', result);
  clientLog(`[OAuth] Final parsed parameters: ${JSON.stringify(result)}`);
  return result;
};

/**
 * Create a signed JWT request object (JAR)
 * @param {Object} payload - Request object payload
 * @param {Object} options - Signing options
 * @param {string} options.privateKey - Private key for signing
 * @param {string} options.alg - Signing algorithm (default: RS256)
 * @returns {Promise<string>} Signed JWT request object
 */
export const createSignedRequestObject = async (
  payload: Record<string, unknown>,
  options: {
    privateKey: string;
    alg?: string;
    kid?: string;
    x5t?: string;
  }
): Promise<string> => {
  console.log('🔍 [OAuth] Creating signed request object (JAR)...');
  clientLog(`[OAuth] Creating signed request object (JAR)...`);

  const { SignJWT, importPKCS8 } = await import('jose');

  try {
    const header: JWTHeaderParameters = { alg: (options.alg as string) || 'RS256' };
    if (options.kid) header.kid = options.kid;
    if (options.x5t) header.x5t = options.x5t;

    const jwt = new SignJWT(payload)
      .setProtectedHeader(header)
      .setIssuedAt()
      .setExpirationTime('5m'); // Request objects typically expire quickly

    // Sign using provided private key PEM
    const alg = (options.alg as string) || 'RS256';
    const key = await importPKCS8(options.privateKey, alg);
    const signedRequest = await jwt.sign(key);

    console.log('✅ [OAuth] Signed request object created successfully');
    clientLog(`[OAuth] Signed request object created successfully`);

    return signedRequest;
  } catch (error) {
    console.error('❌ [OAuth] Error creating signed request object:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    clientLog(`[OAuth] Error creating signed request object: ${errorMessage}`);
    throw new Error(`Failed to create signed request object: ${errorMessage}`);
  }
};

/**
 * Push authorization request to PAR endpoint with optional JAR support
 * @param {Object} config - Configuration object
 * @param {string} config.parEndpoint - PAR endpoint URL
 * @param {string} config.clientId - Client ID
 * @param {string} config.clientSecret - Client secret (optional for confidential clients)
 * @param {Object} requestParams - Authorization request parameters
 * @param {string} [config.requestObject] - Signed request object (JAR)
 * @returns {Promise<Object>} PAR response with request_uri and expires_in
 */
export const pushAuthorizationRequest = async ({
  parEndpoint,
  clientId,
  clientSecret,
  requestParams,
  requestObject,
}: {
  parEndpoint: string;
  clientId: string;
  clientSecret?: string;
  requestParams: Record<string, string>;
  requestObject?: string;
}): Promise<{ request_uri: string; expires_in: number }> => {
  console.log('🔍 [OAuth] Pushing authorization request to PAR endpoint...');
  clientLog(`[OAuth] Pushing authorization request to PAR endpoint...`);

  const body = new URLSearchParams();
  body.append('client_id', clientId);

  // If using JAR, include the signed request object
  if (requestObject) {
    body.append('request', requestObject);
  } else {
    // Traditional PAR with individual parameters
    Object.entries(requestParams).forEach(([key, value]) => {
      body.append(key, value);
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Add basic auth if client secret is provided
  if (clientSecret) {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const response = await fetch(parEndpoint, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OAuth] PAR request failed:', response.status, errorText);
      clientLog(`[OAuth] PAR request failed: ${response.status} ${errorText}`);
      throw new Error(`PAR request failed: ${response.status} ${errorText}`);
    }

    const parResponse = await response.json();
    console.log('✅ [OAuth] PAR request successful:', parResponse);
    clientLog(`[OAuth] PAR request successful: ${JSON.stringify(parResponse)}`);

    return parResponse;
  } catch (error) {
    console.error('❌ [OAuth] Error in PAR request:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    clientLog(`[OAuth] Error in PAR request: ${errorMessage}`);
    throw new Error(`PAR request failed: ${errorMessage}`);
  }
};

/**
 * Build an authorization URL (traditional or PAR-based)
 * @param {Object} config - Configuration object
 * @param {string} config.authEndpoint - Authorization endpoint URL
 * @param {string} config.clientId - Client ID
 * @param {string} config.redirectUri - Redirect URI
 * @param {string} config.scope - Space-separated list of scopes
 * @param {string} config.state - State parameter for CSRF protection
 * @param {string} [config.codeChallenge] - PKCE code challenge
 * @param {string} [config.codeChallengeMethod='S256'] - PKCE code challenge method
 * @param {string} [config.responseType='code'] - Response type
 * @param {string} [config.requestUri] - PAR request_uri (if using PAR)
 * @returns {string} The complete authorization URL
 */
export const buildAuthUrl = ({
  authEndpoint,
  clientId,
  redirectUri,
  scope,
  state,
  nonce,
  codeChallenge,
  codeChallengeMethod = 'S256',
  responseType = 'code',
  requestUri,
}: {
  authEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  responseType?: string;
  requestUri?: string;
}) => {
  const url = new URL(authEndpoint);
  const params = new URLSearchParams();

  // If using PAR, only include client_id and request_uri
  if (requestUri) {
    params.append('client_id', clientId);
    params.append('request_uri', requestUri);
  } else {
    // Traditional authorization request
    params.append('client_id', clientId);
    params.append('redirect_uri', redirectUri);
    params.append('response_type', responseType);
    params.append('scope', scope);
    params.append('state', state);
    if (nonce) {
      params.append('nonce', nonce);
    }

    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', codeChallengeMethod);
    }
  }

  url.search = params.toString();
  return url.toString();
};

/**
 * Build RP-initiated logout (signoff) URL
 * @param {Object} cfg
 * @param {string} cfg.logoutEndpoint - OP signoff endpoint
 * @param {string} cfg.postLogoutRedirectUri - Where OP should redirect after logout
 * @param {string} [cfg.idTokenHint] - Optional id_token to hint user session
 */
export const buildSignoffUrl = ({
  logoutEndpoint,
  postLogoutRedirectUri,
  idTokenHint,
}: {
  logoutEndpoint: string;
  postLogoutRedirectUri: string;
  idTokenHint?: string;
}) => {
  const url = new URL(logoutEndpoint);
  const params = new URLSearchParams();
  if (idTokenHint) params.append('id_token_hint', idTokenHint);
  if (postLogoutRedirectUri) params.append('post_logout_redirect_uri', postLogoutRedirectUri);
  url.search = params.toString();
  return url.toString();
};

/**
 * Validate redirect URI against allowed URIs for a client
 * @param {string} redirectUri - The redirect URI to validate
 * @param {string[]} allowedRedirectUris - Array of allowed redirect URIs
 * @returns {boolean} True if the redirect URI is allowed
 */
export const validateRedirectUri = (
  redirectUri: string,
  allowedRedirectUris: string[]
): boolean => {
  // Exact match validation - no wildcards allowed
  return allowedRedirectUris.some(allowedUri => {
    // Normalize both URIs by removing trailing slashes
    const normalizedRedirect = redirectUri.replace(/\/$/, '');
    const normalizedAllowed = allowedUri.replace(/\/$/, '');

    return normalizedRedirect === normalizedAllowed;
  });
};

/**
 * Generate a CSRF token
 * @returns {string} Random CSRF token
 */
export const generateCsrfToken = (): string => {
  return generateRandomString(32);
};

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @param {string} expectedToken - Expected token value
 * @returns {boolean} True if tokens match
 */
export const validateCsrfToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken && token.length > 0;
};

/**
 * Create secure headers for state-changing requests
 * @param {string} csrfToken - CSRF token
 * @returns {Object} Headers object with security headers
 */
export const createSecureHeaders = (csrfToken?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
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
  authMethod = 'client_secret_basic',
  assertionOptions,
}: {
  tokenEndpoint: string;
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier?: string;
  clientSecret?: string;
  authMethod?: 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
  assertionOptions?: {
    // Common
    audience?: string;
    kid?: string;
    x5t?: string;
    // client_secret_jwt
    hmacAlg?: 'HS256' | 'HS384' | 'HS512';
    // private_key_jwt
    privateKeyPEM?: string;
    signAlg?: 'RS256' | 'ES256' | 'ES384' | 'PS256';
  };
}) => {
  try {
    console.debug('[oauth.util] Preparing token request', {
      tokenEndpoint,
      authMethod,
      has_client_secret: !!clientSecret,
      has_code_verifier: !!codeVerifier,
      client_id_len: clientId?.length || 0,
    });
  } catch {}
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

  // Helper to produce a client assertion
  const buildClientAssertion = async (
    method: 'client_secret_jwt' | 'private_key_jwt'
  ): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 300; // 5 minutes
    const aud = assertionOptions?.audience || tokenEndpoint;
    const claims = {
      iss: clientId,
      sub: clientId,
      aud,
      iat: now,
      nbf: now,
      exp,
      jti: generateRandomString(32),
    };

    const { SignJWT, importPKCS8 } = await import('jose');
    const header: JWTHeaderParameters = { alg: 'RS256' } as JWTHeaderParameters;
    if (assertionOptions?.kid) header.kid = assertionOptions.kid;
    if (assertionOptions?.x5t) header.x5t = assertionOptions.x5t;

    if (method === 'client_secret_jwt') {
      const alg = assertionOptions?.hmacAlg || 'HS256';
      header.alg = alg;
      const secret = new TextEncoder().encode(clientSecret || '');
      return new SignJWT(claims).setProtectedHeader(header).sign(secret);
    }

    // private_key_jwt
    const alg = (assertionOptions?.signAlg as string) || 'RS256';
    header.alg = alg as string;
    const pk = assertionOptions?.privateKeyPEM || '';
    const key = await importPKCS8(pk, alg);
    return new SignJWT(claims).setProtectedHeader(header).sign(key);
  };

  // Apply client authentication method
  if (authMethod === 'client_secret_basic') {
    if (clientSecret) {
      const credentials = btoa(`${clientId}:${clientSecret}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }
  } else if (authMethod === 'client_secret_post') {
    if (clientSecret) body.append('client_secret', clientSecret);
  } else if (authMethod === 'client_secret_jwt') {
    const assertion = await buildClientAssertion('client_secret_jwt');
    body.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    body.append('client_assertion', assertion);
  } else if (authMethod === 'private_key_jwt') {
    const assertion = await buildClientAssertion('private_key_jwt');
    body.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    body.append('client_assertion', assertion);
  }
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers,
    body,
  });
  try {
    console.debug('[oauth.util] Token endpoint responded', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    });
  } catch {}
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code for tokens');
  }
  
  return response.json();
};

/**
 * Fetch JWKS from the issuer
 * @param issuer - The issuer URL
 * @returns JWKS set
 */
const getJWKS = (issuer: string) => {
  // For PingOne, JWKS is typically at /as/jwks
  const jwksUrl = `${issuer.replace(/\/$/, '')}/as/jwks`;
  return createRemoteJWKSet(new URL(jwksUrl));
};

/**
 * Validate ID token with signature verification
 * @param {string} idToken - The ID token to validate
 * @param {string} clientId - The client ID
 * @param {string} issuer - The expected issuer URL
 * @returns {Promise<IdTokenPayload>} The decoded ID token claims
 */
export const validateIdToken = async (
  idToken: string,
  clientId: string,
  issuer: string
): Promise<IdTokenPayload> => {
  console.log('🔍 [OAuth] Validating ID token with signature verification...');
  clientLog(`[OAuth] Validating ID token with signature verification...`);
  console.log('🔍 [OAuth] Expected issuer:', issuer);
  clientLog(`[OAuth] Expected issuer: ${issuer}`);
  console.log('🔍 [OAuth] Expected clientId:', clientId);
  clientLog(`[OAuth] Expected clientId: ${clientId}`);

  try {
    // Get JWKS from the issuer
    const JWKS = getJWKS(issuer);

    // Calculate expected issuers for validation
    const expectedIssuer = issuer.replace(/\/$/, ''); // Remove trailing slash
    const expectedIssuerWithAs = expectedIssuer.endsWith('/as') ? expectedIssuer : `${expectedIssuer}/as`;
    const expectedIssuerBase = expectedIssuer.endsWith('/as') ? expectedIssuer.replace('/as', '') : expectedIssuer;

    console.log('🔍 [OAuth] Issuer validation details:');
    console.log('   Expected base issuer:', expectedIssuerBase);
    console.log('   Expected issuer with /as:', expectedIssuerWithAs);

    // Verify the JWT signature and decode the payload
    const verifyOptions: JWTVerifyOptions = {
      issuer: [
        expectedIssuerBase,
        expectedIssuerWithAs
      ],
      audience: clientId
    };

    const { payload, protectedHeader } = await jwtVerify(idToken, JWKS, verifyOptions);

    console.log('🔍 [OAuth] Token header:', protectedHeader);
    clientLog(`[OAuth] Token header: ${JSON.stringify(protectedHeader)}`);
    console.log('🔍 [OAuth] Token payload:', {
      iss: payload.iss,
      aud: payload.aud,
      exp: payload.exp,
      iat: payload.iat,
      nbf: payload.nbf,
      sub: payload.sub
    });
    clientLog(`[OAuth] Token payload: iss=${payload.iss}, aud=${payload.aud}, exp=${payload.exp}, sub=${payload.sub}`);

    console.log('✅ [OAuth] ID token signature and claims validation successful');
    clientLog(`[OAuth] ID token signature and claims validation successful`);

    return payload as IdTokenPayload;
  } catch (error) {
    console.error('❌ [OAuth] Error validating ID token:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    clientLog(`[OAuth] Error validating ID token: ${errorMessage}`);
    throw new Error(`Invalid ID token: ${errorMessage}`);
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
      'Content-Type': 'application/json',
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
export const parseJwt = (token) => {
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
