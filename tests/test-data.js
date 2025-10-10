// Test data and fixtures for OAuth Playground testing

export const testData = {
  // Mock OAuth configuration
  oauthConfig: {
    environmentId: 'test-env-12345',
    clientId: 'test-client-67890',
    clientSecret: 'test-client-secret-abc123',
    redirectUri: 'http://localhost:3000/callback',
    scopes: ['openid', 'profile', 'email'],
    apiUrl: 'https://auth.pingone.com',
  },

  // Mock tokens
  tokens: {
    accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test-payload.signature',
    refreshToken: 'refresh-token-12345-abcdef',
    idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.id-token-payload.signature',
    code: 'auth-code-abcdef123456',
    codeVerifier: 'pkce-code-verifier-abcdefghijklmnopqrstuvwxyz123456',
    codeChallenge: 'pkce-code-challenge-base64url-encoded',
    state: 'csrf-protection-state-12345',
  },

  // Mock PingOne API responses
  pingOneResponses: {
    tokenExchange: {
      access_token: 'mock-access-token-123',
      refresh_token: 'mock-refresh-token-456',
      id_token: 'mock-id-token-789',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email',
    },

    clientCredentials: {
      access_token: 'client-credentials-token-123',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'read write',
    },

    introspection: {
      active: true,
      client_id: 'test-client-67890',
      scope: 'openid profile email',
      token_type: 'Bearer',
      exp: 1638360000,
      iat: 1638356400,
      sub: 'user123',
    },

    userInfo: {
      sub: 'user123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      email_verified: true,
      profile: 'https://example.com/profile',
    },

    deviceAuthorization: {
      device_code: 'device-code-123',
      user_code: 'ABC123',
      verification_uri: 'https://auth.pingone.com/test/device',
      verification_uri_complete: 'https://auth.pingone.com/test/device?user_code=ABC123',
      expires_in: 1800,
      interval: 5,
    },

    parResponse: {
      request_uri: 'urn:ietf:params:oauth:request_uri:abc123',
      expires_in: 600,
    },

    jwks: {
      keys: [
        {
          kty: 'RSA',
          kid: 'test-key-1',
          use: 'sig',
          alg: 'RS256',
          n: 'mock-modulus-base64',
          e: 'AQAB',
        },
      ],
    },

    discovery: {
      issuer: 'https://auth.pingone.com/test-env',
      authorization_endpoint: 'https://auth.pingone.com/test-env/as/authorize',
      token_endpoint: 'https://auth.pingone.com/test-env/as/token',
      userinfo_endpoint: 'https://auth.pingone.com/test-env/as/userinfo',
      jwks_uri: 'https://auth.pingone.com/test-env/as/jwks',
      scopes_supported: ['openid', 'profile', 'email'],
      response_types_supported: ['code', 'id_token', 'token'],
      grant_types_supported: ['authorization_code', 'implicit', 'client_credentials'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'auth_time'],
      code_challenge_methods_supported: ['S256', 'plain'],
      request_parameter_supported: true,
      request_uri_parameter_supported: true,
      require_request_uri_registration: false,
      end_session_endpoint: 'https://auth.pingone.com/test-env/as/signoff',
      revocation_endpoint: 'https://auth.pingone.com/test-env/as/revoke',
      introspection_endpoint: 'https://auth.pingone.com/test-env/as/introspect',
      device_authorization_endpoint: 'https://auth.pingone.com/test-env/as/device',
      pushed_authorization_request_endpoint: 'https://auth.pingone.com/test-env/as/par',
    },
  },

  // Mock error responses
  errorResponses: {
    invalidClient: {
      error: 'invalid_client',
      error_description: 'Client authentication failed',
    },

    invalidGrant: {
      error: 'invalid_grant',
      error_description: 'Authorization code is invalid or has expired',
    },

    invalidRequest: {
      error: 'invalid_request',
      error_description: 'Missing required parameter: client_id',
    },

    serverError: {
      error: 'server_error',
      error_description: 'Internal server error',
    },
  },

  // Test user data
  users: {
    validUser: {
      id: 'user123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
    },

    adminUser: {
      id: 'admin456',
      name: 'Admin User',
      email: 'admin@example.com',
      emailVerified: true,
      roles: ['admin'],
    },
  },

  // Test URLs and endpoints
  urls: {
    authorization: 'https://auth.pingone.com/test-env/as/authorize',
    token: 'https://auth.pingone.com/test-env/as/token',
    userinfo: 'https://auth.pingone.com/test-env/as/userinfo',
    introspection: 'https://auth.pingone.com/test-env/as/introspect',
    device: 'https://auth.pingone.com/test-env/as/device',
    par: 'https://auth.pingone.com/test-env/as/par',
    jwks: 'https://auth.pingone.com/test-env/as/jwks',
    discovery: 'https://auth.pingone.com/test-env/.well-known/openid_configuration',
  },

  // Form data for testing
  formData: {
    authorizationCodeFlow: {
      grant_type: 'authorization_code',
      client_id: 'test-client-67890',
      client_secret: 'test-client-secret-abc123',
      code: 'auth-code-abcdef123456',
      redirect_uri: 'http://localhost:3000/callback',
      code_verifier: 'pkce-code-verifier-abcdefghijklmnopqrstuvwxyz123456',
    },

    refreshTokenFlow: {
      grant_type: 'refresh_token',
      client_id: 'test-client-67890',
      client_secret: 'test-client-secret-abc123',
      refresh_token: 'refresh-token-12345-abcdef',
      scope: 'openid profile email',
    },

    clientCredentialsFlow: {
      grant_type: 'client_credentials',
      client_id: 'test-client-67890',
      client_secret: 'test-client-secret-abc123',
      scope: 'read write',
    },

    deviceAuthorization: {
      client_id: 'test-client-67890',
      scope: 'openid profile email',
      audience: 'api://default',
    },
  },

  // UI test selectors (common patterns)
  selectors: {
    sidebar: '.sidebar, nav, [data-testid="sidebar"]',
    mainContent: '.main-content, main, [data-testid="main-content"]',
    card: '.card, [data-testid*="card"], [class*="card"]',
    button: 'button:not([disabled])',
    input: 'input:not([disabled])',
    form: 'form',
    modal: '.modal, [role="dialog"], [data-testid*="modal"]',
    spinner: '.spinner, .loading, [data-testid*="loading"], [class*="spinner"]',
    error: '.error, [data-testid*="error"], .alert-danger, .text-danger',
    success: '.success, [data-testid*="success"], .alert-success, .text-success',
    tokenDisplay: '[data-testid*="token"], .token-display, .jwt-display, pre, code',
    copyButton: 'button[data-testid*="copy"], .copy-btn, button:has-text("Copy")',
  },
};

// Helper functions for test data
export const helpers = {
  // Generate mock JWT
  generateMockJWT: (payload: any, header: any = { alg: 'RS256', typ: 'JWT' }) => {
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${encodedHeader}.${encodedPayload}.mock-signature`;
  },

  // Generate random strings for testing
  generateRandomString: (length: number = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Create mock fetch response
  createMockResponse: (data: any, status: number = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map([['content-type', 'application/json']]),
  }),

  // Mock network delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
