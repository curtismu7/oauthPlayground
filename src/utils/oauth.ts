// OAuth 2.0 and OpenID Connect Utility Functions
import {
  IdTokenPayload,
  UserInfo
} from '../types/oauth';
import {
  jwtVerify,
  createRemoteJWKSet,
  JWTVerifyOptions
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

export const generateRandomString = (length = 32) => {
  // Use browser-compatible crypto instead of Node.js randomBytes
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
};

export const generateCodeVerifier = (): string => {
  return generateRandomString(64);
};

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

export const parseUrlParams = (url: string): Record<string, string> => {
  console.log('🔍 [OAuth] Parsing URL parameters from:', url);
  clientLog(`[OAuth] Parsing URL parameters from: ${url}`);
  const params = new URLSearchParams(url.split('?')[1] || '');
  const result: { [key: string]: string } = {};
  
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

export const createSignedRequestObject = async (
  payload: Record<string, any>,
  options: {
    privateKey: string;
    alg?: string;
  }
): Promise<string> => {
  console.log('🔍 [OAuth] Creating signed request object (JAR)...');
  clientLog(`[OAuth] Creating signed request object (JAR)...`);

  const { SignJWT } = await import('jose');

  try {
    const jwt = new SignJWT(payload)
      .setProtectedHeader({ alg: options.alg || 'RS256' })
      .setIssuedAt()
      .setExpirationTime('5m'); // Request objects typically expire quickly

    const signedRequest = await jwt.sign(new TextEncoder().encode(options.privateKey));

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

export const generateCsrfToken = (): string => {
  return generateRandomString(32);
};

export const validateCsrfToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken && token.length > 0;
};

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
}): Promise<any> => {
  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('client_id', clientId);
  body.append('redirect_uri', redirectUri);
  body.append('code', code);
  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
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

// Fetch JWKS from the issuer
const getJWKS = (issuer: string) => {
  // For PingOne, JWKS is typically at /as/jwks
  const jwksUrl = `${issuer.replace(/\/$/, '')}/as/jwks`;
  return createRemoteJWKSet(new URL(jwksUrl));
};

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

export const parseJwt = (token: string): any => {
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

export const isTokenExpired = (token: string): boolean => {
  const decoded = parseJwt(token);
  if (!decoded?.exp) return true;
  const now = Date.now() / 1000;
  return decoded.exp < now;
};

export const buildSignoffUrl = ({
  signoffEndpoint,
  clientId,
  redirectUri,
  idTokenHint,
  state,
}: {
  signoffEndpoint: string;
  clientId: string;
  redirectUri: string;
  idTokenHint?: string;
  state?: string;
}): string => {
  const url = new URL(signoffEndpoint);
  const params = new URLSearchParams();
  
  params.append('client_id', clientId);
  params.append('post_logout_redirect_uri', redirectUri);
  
  if (idTokenHint) {
    params.append('id_token_hint', idTokenHint);
  }
  
  if (state) {
    params.append('state', state);
  }
  
  url.search = params.toString();
  return url.toString();
};
