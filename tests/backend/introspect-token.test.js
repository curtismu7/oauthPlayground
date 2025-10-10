const request  = require('supertest');
const app  = require('../../server.js');

describe('API Token Introspection Endpoint', () => {
  const mockIntrospectionResponse = {
    active: true,
    client_id: 'test-client',
    scope: 'openid profile email',
    token_type: 'Bearer',
    exp: 1638360000,
    iat: 1638356400,
    sub: 'user123',
  });

  beforeEach(() => {
    global.fetch.mockClear();
  });

  test('POST /api/introspect-token rejects requests without token', async () => {
    const response = await request(app)
      .post('/api/introspect-token')
      .send({
        client_id: 'test-client',
        introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
      })
      .expect(400));

    expect(response.body.error).toBe('invalid_request'));
    expect(response.body.error_description).toContain('Missing required parameters'));
  }));

  test('POST /api/introspect-token rejects requests without client_id', async () => {
    const response = await request(app)
      .post('/api/introspect-token')
      .send({
        token: 'access-token-123',
        introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
      })
      .expect(400));

    expect(response.body.error).toBe('invalid_request'));
    expect(response.body.error_description).toContain('Missing required parameters'));
  }));

  test('POST /api/introspect-token successfully introspects token', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockIntrospectionResponse),
      headers: new Map([['content-type', 'application/json']]),
    }));

    const response = await request(app)
      .post('/api/introspect-token')
      .send({
        token: 'access-token-123',
        client_id: 'test-client',
        client_secret: 'test-secret',
        introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
        token_auth_method: 'client_secret_post',
      })
      .expect(200));

    expect(response.body).toMatchObject({
      active: true,
      client_id: 'test-client',
      scope: 'openid profile email',
      token_type: 'Bearer',
      exp: 1638360000,
      iat: 1638356400,
      sub: 'user123',
      server_timestamp: expect.any(String),
    }));

    expect(global.fetch).toHaveBeenCalledWith(
      'https://auth.pingone.com/test/as/introspect',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        }),
      })
    ));
  }));

  test('POST /api/introspect-token handles public client', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockIntrospectionResponse),
      headers: new Map([['content-type', 'application/json']]),
    }));

    await request(app)
      .post('/api/introspect-token')
      .send({
        token: 'access-token-123',
        client_id: 'test-client',
        introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
        token_auth_method: 'none',
      })
      .expect(200));

    const fetchCall = global.fetch.mock.calls[0]);
    const requestBody = fetchCall[1].body);
    expect(requestBody).toContain('token=access-token-123'));
    expect(requestBody).toContain('client_id=test-client'));
    expect(requestBody).not.toContain('client_secret='));
  }));

  test('POST /api/introspect-token handles basic auth', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockIntrospectionResponse),
      headers: new Map([['content-type', 'application/json']]),
    }));

    await request(app)
      .post('/api/introspect-token')
      .send({
        token: 'access-token-123',
        client_id: 'test-client',
        client_secret: 'test-secret',
        introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
        token_auth_method: 'client_secret_basic',
      })
      .expect(200));

    const fetchCall = global.fetch.mock.calls[0]);
    const headers = fetchCall[1].headers);
    expect(headers.Authorization).toMatch(/^Basic /));
    const requestBody = fetchCall[1].body);
    expect(requestBody).not.toContain('client_secret='));
  }));

  test('POST /api/introspect-token handles JWT assertion', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockIntrospectionResponse),
      headers: new Map([['content-type', 'application/json']]),
    }));

    await request(app)
      .post('/api/introspect-token')
      .send({
        token: 'access-token-123',
        client_id: 'test-client',
        introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
        token_auth_method: 'client_secret_jwt',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: 'jwt-assertion-123',
      })
      .expect(200));

    const fetchCall = global.fetch.mock.calls[0]);
    const requestBody = fetchCall[1].body);
    expect(requestBody).toContain('client_assertion_type=urn%3Aietf%3Aparams%3Aoauth%3Aclient-assertion-type%3Ajwt-bearer'));
    expect(requestBody).toContain('client_assertion=jwt-assertion-123'));
  }));
}));
