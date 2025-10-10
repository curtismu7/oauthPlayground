const request  = require('supertest');
const app  = require('../../server.js');

describe('API JWKS and Discovery Endpoints', () => {
  const mockJwks = {
    keys: [
      {
        kty: 'RSA',
        kid: 'test-key-1',
        use: 'sig',
        alg: 'RS256',
        n: 'mock-modulus',
        e: 'AQAB',
      },
    ],
  });

  const mockDiscoveryConfig = {
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
  });

  beforeEach(() => {
    global.fetch.mockClear();

  test('GET /api/jwks successfully retrieves JWKS', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockJwks),
      headers: new Map([['content-type', 'application/json']]),
    }));

    const response = await request(app)
      .get('/api/jwks')
      .query({
        environment_id: 'test-env-123',
      })
      .expect(200));

    expect(response.body).toMatchObject({
      keys: expect.any(Array),
      server_timestamp: expect.any(String),
    }));
  }));

  test('GET /api/jwks rejects requests without environment_id', async () => {
    const response = await request(app)
      .get('/api/jwks')
      .expect(400));

    expect(response.body.error).toBe('invalid_request'));
    expect(response.body.error_description).toContain('Missing required parameter: environment_id'));
  }));

  test('GET /api/discovery successfully retrieves OpenID configuration', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockDiscoveryConfig),
      headers: new Map([['content-type', 'application/json']]),
    }));

    const response = await request(app)
      .get('/api/discovery')
      .query({
        environment_id: 'test-env-123',
      })
      .expect(200));

    expect(response.body.success).toBe(true));
    expect(response.body.configuration).toEqual(mockDiscoveryConfig));
    expect(response.body.environmentId).toBe('test-env-123'));
    expect(response.body.server_timestamp).toBeDefined());
  }));

  test('GET /api/discovery returns fallback config when PingOne is unreachable', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error')));

    const response = await request(app)
      .get('/api/discovery')
      .query({
        environment_id: 'test-env-123',
      })
      .expect(200));

    expect(response.body.success).toBe(true));
    expect(response.body.fallback).toBe(true));
    expect(response.body.configuration.issuer).toBe('https://auth.pingone.com/test-env-123'));
    expect(response.body.configuration.authorization_endpoint).toBe('https://auth.pingone.com/test-env-123/as/authorize'));
  }));

  test('GET /api/discovery rejects requests without environment_id', async () => {
    const response = await request(app)
      .get('/api/discovery')
      .expect(400));

    expect(response.body.error).toBe('invalid_request'));
    expect(response.body.error_description).toContain('Missing required parameter: environment_id'));
  }));

  test('GET /api/playground-jwks returns generated JWKS', async () => {
    const response = await request(app)
      .get('/api/playground-jwks')
      .expect(200));

    expect(response.body.keys).toHaveLength(1));
    expect(response.body.keys[0]).toMatchObject({
      kty: 'RSA',
      kid: 'oauth-playground-default',
      use: 'sig',
      alg: 'RS256',
      n: expect.any(String),
      e: 'AQAB',
    }));
  }));

  test('GET /.well-known/jwks.json returns JWKS structure', async () => {
    const response = await request(app)
      .get('/.well-known/jwks.json')
      .expect(200));

    expect(response.body).toHaveProperty('keys'));
    expect(Array.isArray(response.body.keys)).toBe(true));
  }));
}));
