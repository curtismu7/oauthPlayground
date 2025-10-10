const request  = require('supertest');
const app  = require('../../server.js');

describe('API UserInfo and Token Validation Endpoints', () => {
  const mockUserInfo = {
    sub: 'user123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    email_verified: true,
    profile: 'https://example.com/profile',
  });

  beforeEach(() => {
    global.fetch.mockClear();
  });

  test('GET /api/userinfo successfully retrieves user info', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockUserInfo),
      headers: new Map([['content-type', 'application/json']]),
    }));

    const response = await request(app)
      .get('/api/userinfo')
      .query({
        access_token: 'access-token-123',
        environment_id: 'test-env-123',
      })
      .expect(200));

    expect(response.body).toMatchObject({
      sub: 'user123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      server_timestamp: expect.any(String),
    }));
  }));

  test('GET /api/userinfo rejects requests without access_token', async () => {
    const response = await request(app)
      .get('/api/userinfo')
      .query({
        environment_id: 'test-env-123',
      })
      .expect(400));

    expect(response.body.error).toBe('invalid_request'));
  }));

  test('POST /api/validate-token validates active token', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockUserInfo),
      headers: new Map([['content-type', 'application/json']]),
    }));

    const response = await request(app)
      .post('/api/validate-token')
      .send({
        access_token: 'access-token-123',
        environment_id: 'test-env-123',
      })
      .expect(200));

    expect(response.body.valid).toBe(true));
    expect(response.body.user_info).toEqual(mockUserInfo));
  }));

  test('POST /api/validate-token handles invalid token', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: 'invalid_token',
        error_description: 'The access token is invalid',
      }),
      headers: new Map([['content-type', 'application/json']]),
    }));

    const response = await request(app)
      .post('/api/validate-token')
      .send({
        access_token: 'invalid-token',
        environment_id: 'test-env-123',
      })
      .expect(200));

    expect(response.body.valid).toBe(false));
    expect(response.body.error.error).toBe('invalid_token'));
  }));
}));
