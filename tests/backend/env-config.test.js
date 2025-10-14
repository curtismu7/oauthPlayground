import request from 'supertest';
import app from '../../server.js';

describe('API Environment Config Endpoint', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment variables before each test
    process.env.PINGONE_ENVIRONMENT_ID = '';
    process.env.VITE_PINGONE_ENVIRONMENT_ID = '';
    process.env.PINGONE_CLIENT_ID = '';
    process.env.VITE_PINGONE_CLIENT_ID = '';
    process.env.PINGONE_CLIENT_SECRET = '';
    process.env.VITE_PINGONE_CLIENT_SECRET = '';
    process.env.PINGONE_REDIRECT_URI = '';
    process.env.VITE_PINGONE_REDIRECT_URI = '';
    process.env.PINGONE_API_URL = '';
    process.env.VITE_PINGONE_API_URL = '';
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  test('GET /api/env-config returns default config when no env vars set', async () => {
    const response = await request(app)
      .get('/api/env-config')
      .expect(200);

    expect(response.body).toEqual({
      environmentId: '',
      clientId: '',
      clientSecret: '',
      redirectUri: 'https://localhost:3000/authz-callback',
      scopes: ['openid', 'profile', 'email'],
      apiUrl: 'https://auth.pingone.com',
    });
  });

  test('GET /api/env-config uses PINGONE_ prefixed env vars', async () => {
    process.env.PINGONE_ENVIRONMENT_ID = 'test-env-123';
    process.env.PINGONE_CLIENT_ID = 'test-client-456';
    process.env.PINGONE_CLIENT_SECRET = 'test-secret-789';
    process.env.PINGONE_REDIRECT_URI = 'https://example.com/callback'\;
    process.env.PINGONE_API_URL = 'https://test.pingone.com'\;

    const response = await request(app)
      .get('/api/env-config')
      .expect(200);

    expect(response.body).toEqual({
      environmentId: 'test-env-123',
      clientId: 'test-client-456',
      clientSecret: 'test-secret-789',
      redirectUri: 'https://example.com/callback',
      scopes: ['openid', 'profile', 'email'],
      apiUrl: 'https://test.pingone.com',
    });
  });

  test('GET /api/env-config prioritizes PINGONE_ over VITE_ env vars', async () => {
    process.env.PINGONE_ENVIRONMENT_ID = 'pingone-env';
    process.env.VITE_PINGONE_ENVIRONMENT_ID = 'vite-env';
    process.env.PINGONE_CLIENT_ID = 'pingone-client';
    process.env.VITE_PINGONE_CLIENT_ID = 'vite-client';

    const response = await request(app)
      .get('/api/env-config')
      .expect(200);

    expect(response.body.environmentId).toBe('pingone-env');
    expect(response.body.clientId).toBe('pingone-client');
  });
});
