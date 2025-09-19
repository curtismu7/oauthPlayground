 
// src/utils/clientAuthentication.ts
/**
 * OIDC Core 1.0 Client Authentication Methods Implementation
 * Based on Section 9: https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
 */

export type ClientAuthMethod = 'client_secret_post' | 'client_secret_basic' | 'client_secret_jwt' | 'private_key_jwt' | 'none';

export interface ClientAuthConfig {
  method: ClientAuthMethod;
  clientId: string;
  clientSecret?: string;
  privateKey?: string;
  tokenEndpoint: string;
}

export interface AuthenticatedRequest {
  headers: Record<string, string>;
  body: URLSearchParams;
}

/**
 * Apply client authentication to token request
 * @param config - Client authentication configuration
 * @param baseBody - Base request body parameters
 * @returns Authenticated request with proper headers and body
 */
export const applyClientAuthentication = async (
  config: ClientAuthConfig,
  baseBody: URLSearchParams
): Promise<AuthenticatedRequest> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  
  const body = new URLSearchParams(baseBody);

  switch (config.method) {
    case 'client_secret_post':
      // Method 1: Client secret in POST body (current implementation)
      body.append('client_id', config.clientId);
      if (config.clientSecret) {
        body.append('client_secret', config.clientSecret);
      }
      break;

    case 'client_secret_basic':
      // Method 2: HTTP Basic Authentication
      if (!config.clientSecret) {
        throw new Error('Client secret is required for client_secret_basic authentication');
      }

      headers['Authorization'] = `Basic ${credentials}`;
      // Don't add client_id/client_secret to body for Basic auth
      break;

    case 'client_secret_jwt':
      // Method 3: JWT signed with client secret (HS256)
      if (!config.clientSecret) {
        throw new Error('Client secret is required for client_secret_jwt authentication');
      }
      const secretJWT = await createClientAssertion(
        config.clientId,
        config.tokenEndpoint,
        config.clientSecret,
        'HS256'
      );
      body.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      body.append('client_assertion', secretJWT);
      break;

    case 'private_key_jwt':
      // Method 4: JWT signed with private key (RS256)
      if (!config.privateKey) {
        throw new Error('Private key is required for private_key_jwt authentication');
      }
      const privateKeyJWT = await createClientAssertion(
        config.clientId,
        config.tokenEndpoint,
        config.privateKey,
        'RS256'
      );
      body.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
      body.append('client_assertion', privateKeyJWT);
      break;

    case 'none':
      // Method 5: No client authentication (public clients)
      body.append('client_id', config.clientId);
      // No client authentication - PKCE MUST be used for security
      break;

    default:
      throw new Error(`Unsupported client authentication method: ${config.method}`);
  }

  return { headers, body };
};

/**
 * Create client assertion JWT for client_secret_jwt or private_key_jwt
 * @param clientId - Client identifier
 * @param tokenEndpoint - Token endpoint URL (audience)
 * @param secret - Client secret or private key
 * @param algorithm - Signing algorithm (HS256 for secret, RS256 for private key)
 * @returns JWT assertion string
 */
const createClientAssertion = async (
  clientId: string,
  tokenEndpoint: string,
  secret: string,
  algorithm: 'HS256' | 'RS256'
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  
  // JWT claims per OIDC spec
  const claims = {
    iss: clientId,           // Issuer = client ID
    sub: clientId,           // Subject = client ID
    aud: tokenEndpoint,      // Audience = token endpoint
    iat: now,                // Issued at
    nbf: now,                // Not before
    exp: now + 300,          // Expires in 5 minutes
    jti: generateRandomId()  // Unique JWT ID
  };

  try {
    if (algorithm === 'HS256') {
      // Sign with client secret (HMAC)
      const { SignJWT } = await import('jose');
      const secretKey = new TextEncoder().encode(secret);
      return await new SignJWT(claims)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secretKey);
    } else {
      // Sign with private key (RSA)
      const { SignJWT, importPKCS8 } = await import('jose');
      const privateKey = await importPKCS8(secret, 'RS256');
      return await new SignJWT(claims)
        .setProtectedHeader({ alg: 'RS256' })
        .sign(privateKey);
    }
  } catch (_error) {
    throw new Error(`Failed to create client assertion: ${error instanceof Error ? error.message : String(_error)}`);
  }
};

/**
 * Generate random JWT ID
 */
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Get security level description for each authentication method
 */
export const getAuthMethodSecurityLevel = (method: ClientAuthMethod): {
  level: 'Low' | 'Medium' | 'High' | 'Highest';
  description: string;
  icon: string;
} => {
  switch (method) {
    case 'none':
      return {
        level: 'Low',
        description: 'No client authentication. Relies on PKCE for security. Suitable for public clients that cannot store secrets.',
        icon: '⚠️'
      };
    case 'client_secret_post':
      return {
        level: 'Medium',
        description: 'Client secret sent in POST body. Simple but secret is visible in request body.',
        icon: '📤'
      };
    case 'client_secret_basic':
      return {
        level: 'Medium',
        description: 'Client secret sent via HTTP Basic Authentication. More secure than POST method.',
        icon: '🔐'
      };
    case 'client_secret_jwt':
      return {
        level: 'High',
        description: 'JWT signed with client secret (HS256). Prevents secret exposure and includes timing protection.',
        icon: '🏆'
      };
    case 'private_key_jwt':
      return {
        level: 'Highest',
        description: 'JWT signed with private key (RS256). No shared secrets, asymmetric cryptography. Enterprise grade.',
        icon: '🔒'
      };
  }
};

export default {
  applyClientAuthentication,
  getAuthMethodSecurityLevel
};
