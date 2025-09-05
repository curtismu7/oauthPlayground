import { logger } from '../utils/logger';

export interface JWTAuthConfig {
  clientId: string;
  clientSecret?: string;
  privateKey?: string;
  keyId?: string;
  issuer: string;
  audience: string;
  tokenEndpoint: string;
}

export interface JWTClaims {
  iss: string; // issuer
  sub: string; // subject (client_id)
  aud: string; // audience
  jti: string; // JWT ID
  iat: number; // issued at
  exp: number; // expiration
  [key: string]: any; // additional claims
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
  id_token?: string;
}

export interface JWTAuthResult {
  success: boolean;
  tokenResponse?: TokenResponse;
  error?: string;
  method?: 'CLIENT_SECRET_JWT' | 'PRIVATE_KEY_JWT';
}

class JWTAuthService {
  private readonly ALGORITHM = 'HS256'; // For CLIENT_SECRET_JWT
  private readonly RSA_ALGORITHM = 'RS256'; // For PRIVATE_KEY_JWT

  /**
   * Generate a JWT for CLIENT_SECRET_JWT authentication
   */
  async generateClientSecretJWT(config: JWTAuthConfig): Promise<string> {
    try {
      logger.jwt('JWTAuthService', 'Generating CLIENT_SECRET_JWT', { clientId: config.clientId });

      if (!config.clientSecret) {
        throw new Error('Client secret is required for CLIENT_SECRET_JWT');
      }

      const header = {
        alg: this.ALGORITHM,
        typ: 'JWT'
      };

      const now = Math.floor(Date.now() / 1000);
      const claims: JWTClaims = {
        iss: config.clientId, // issuer is the client_id for CLIENT_SECRET_JWT
        sub: config.clientId, // subject is the client_id
        aud: config.audience, // audience is the token endpoint
        jti: this.generateJTI(), // unique JWT ID
        iat: now, // issued at
        exp: now + 300 // expires in 5 minutes
      };

      const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
      const encodedClaims = this.base64UrlEncode(JSON.stringify(claims));
      
      const signature = await this.signWithHMAC(
        `${encodedHeader}.${encodedClaims}`,
        config.clientSecret
      );

      const jwt = `${encodedHeader}.${encodedClaims}.${signature}`;

      logger.success('JWTAuthService', 'CLIENT_SECRET_JWT generated successfully', {
        clientId: config.clientId,
        jti: claims.jti,
        exp: claims.exp
      });

      return jwt;

    } catch (error) {
      logger.error('JWTAuthService', 'Failed to generate CLIENT_SECRET_JWT', {
        clientId: config.clientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate a JWT for PRIVATE_KEY_JWT authentication
   */
  async generatePrivateKeyJWT(config: JWTAuthConfig): Promise<string> {
    try {
      logger.jwt('JWTAuthService', 'Generating PRIVATE_KEY_JWT', { clientId: config.clientId });

      if (!config.privateKey) {
        throw new Error('Private key is required for PRIVATE_KEY_JWT');
      }

      const header = {
        alg: this.RSA_ALGORITHM,
        typ: 'JWT',
        kid: config.keyId || 'default' // key ID for JWKS
      };

      const now = Math.floor(Date.now() / 1000);
      const claims: JWTClaims = {
        iss: config.clientId, // issuer is the client_id for PRIVATE_KEY_JWT
        sub: config.clientId, // subject is the client_id
        aud: config.audience, // audience is the token endpoint
        jti: this.generateJTI(), // unique JWT ID
        iat: now, // issued at
        exp: now + 300 // expires in 5 minutes
      };

      const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
      const encodedClaims = this.base64UrlEncode(JSON.stringify(claims));
      
      const signature = await this.signWithRSA(
        `${encodedHeader}.${encodedClaims}`,
        config.privateKey
      );

      const jwt = `${encodedHeader}.${encodedClaims}.${signature}`;

      logger.success('JWTAuthService', 'PRIVATE_KEY_JWT generated successfully', {
        clientId: config.clientId,
        jti: claims.jti,
        exp: claims.exp,
        kid: header.kid
      });

      return jwt;

    } catch (error) {
      logger.error('JWTAuthService', 'Failed to generate PRIVATE_KEY_JWT', {
        clientId: config.clientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Exchange JWT for access token using CLIENT_SECRET_JWT
   */
  async exchangeClientSecretJWT(
    config: JWTAuthConfig,
    grantType: string = 'client_credentials',
    scope?: string
  ): Promise<JWTAuthResult> {
    try {
      logger.jwt('JWTAuthService', 'Exchanging CLIENT_SECRET_JWT for token', {
        clientId: config.clientId,
        grantType,
        scope
      });

      const jwt = await this.generateClientSecretJWT(config);
      
      const tokenResponse = await this.exchangeJWTForToken(
        config.tokenEndpoint,
        jwt,
        grantType,
        scope
      );

      logger.success('JWTAuthService', 'CLIENT_SECRET_JWT exchange successful', {
        clientId: config.clientId,
        tokenType: tokenResponse.token_type,
        expiresIn: tokenResponse.expires_in
      });

      return {
        success: true,
        tokenResponse,
        method: 'CLIENT_SECRET_JWT'
      };

    } catch (error) {
      logger.error('JWTAuthService', 'CLIENT_SECRET_JWT exchange failed', {
        clientId: config.clientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'JWT exchange failed',
        method: 'CLIENT_SECRET_JWT'
      };
    }
  }

  /**
   * Exchange JWT for access token using PRIVATE_KEY_JWT
   */
  async exchangePrivateKeyJWT(
    config: JWTAuthConfig,
    grantType: string = 'client_credentials',
    scope?: string
  ): Promise<JWTAuthResult> {
    try {
      logger.jwt('JWTAuthService', 'Exchanging PRIVATE_KEY_JWT for token', {
        clientId: config.clientId,
        grantType,
        scope
      });

      const jwt = await this.generatePrivateKeyJWT(config);
      
      const tokenResponse = await this.exchangeJWTForToken(
        config.tokenEndpoint,
        jwt,
        grantType,
        scope
      );

      logger.success('JWTAuthService', 'PRIVATE_KEY_JWT exchange successful', {
        clientId: config.clientId,
        tokenType: tokenResponse.token_type,
        expiresIn: tokenResponse.expires_in
      });

      return {
        success: true,
        tokenResponse,
        method: 'PRIVATE_KEY_JWT'
      };

    } catch (error) {
      logger.error('JWTAuthService', 'PRIVATE_KEY_JWT exchange failed', {
        clientId: config.clientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'JWT exchange failed',
        method: 'PRIVATE_KEY_JWT'
      };
    }
  }

  /**
   * Exchange JWT for access token
   */
  private async exchangeJWTForToken(
    tokenEndpoint: string,
    jwt: string,
    grantType: string,
    scope?: string
  ): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: grantType,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: jwt
    });

    if (scope) {
      body.append('scope', scope);
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Sign data with HMAC-SHA256 (for CLIENT_SECRET_JWT)
   */
  private async signWithHMAC(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    );

    return this.base64UrlEncode(new Uint8Array(signature));
  }

  /**
   * Sign data with RSA-SHA256 (for PRIVATE_KEY_JWT)
   */
  private async signWithRSA(data: string, privateKeyPem: string): Promise<string> {
    try {
      // Convert PEM to ArrayBuffer
      const pemHeader = '-----BEGIN PRIVATE KEY-----';
      const pemFooter = '-----END PRIVATE KEY-----';
      const pemContents = privateKeyPem
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s/g, '');
      
      const binaryDer = this.base64ToArrayBuffer(pemContents);
      
      const key = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      );

      const encoder = new TextEncoder();
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        encoder.encode(data)
      );

      return this.base64UrlEncode(new Uint8Array(signature));

    } catch (error) {
      logger.error('JWTAuthService', 'RSA signing failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`RSA signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique JWT ID
   */
  private generateJTI(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(data: string | Uint8Array): string {
    let base64: string;
    
    if (typeof data === 'string') {
      base64 = btoa(data);
    } else {
      base64 = btoa(String.fromCharCode(...data));
    }
    
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Validate private key format
   */
  validatePrivateKey(privateKey: string): boolean {
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    
    return privateKey.includes(pemHeader) && privateKey.includes(pemFooter);
  }

  /**
   * Extract key ID from private key (if present)
   */
  extractKeyId(privateKey: string): string | null {
    // This is a simplified implementation
    // In practice, you might need to parse the PEM more thoroughly
    const keyIdMatch = privateKey.match(/kid["\s]*[:=]["\s]*([^"\s]+)/i);
    return keyIdMatch ? keyIdMatch[1] : null;
  }
}

export const jwtAuthService = new JWTAuthService();
export default jwtAuthService;

