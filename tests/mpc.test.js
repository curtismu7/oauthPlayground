import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('MPC Server', () => {
  let server;

  beforeAll(() => {
    server = app.listen(0); // Use random port for testing
  });

  afterAll(() => {
    server.close();
  });

  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
    expect(response.body.version).toBeDefined();
  });

  test('Root endpoint', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.name).toBe('OAuth Playground MPC Server');
    expect(response.body.endpoints).toBeDefined();
  });

  test('Start MPC computation', async () => {
    const computationData = {
      computationId: 'test-computation-1',
      participants: ['participant1', 'participant2'],
      operation: 'add',
      inputs: [10, 20, 30]
    };

    const response = await request(app)
      .post('/api/mpc/compute')
      .send(computationData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.computationId).toBe('test-computation-1');
    expect(response.body.status).toBe('started');
  });

  test('Get computation status', async () => {
    // First create a computation
    const computationData = {
      computationId: 'test-computation-2',
      participants: ['participant1', 'participant2'],
      operation: 'multiply',
      inputs: [5, 6]
    };

    await request(app)
      .post('/api/mpc/compute')
      .send(computationData);

    // Then check its status
    const response = await request(app)
      .get('/api/mpc/status/test-computation-2')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.computationId).toBe('test-computation-2');
    expect(response.body.status).toBeDefined();
  });

  test('Get all computations', async () => {
    const response = await request(app)
      .get('/api/mpc/computations')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.computations)).toBe(true);
  });

  test('Invalid computation data', async () => {
    const invalidData = {
      // Missing required fields
      operation: 'add'
    };

    const response = await request(app)
      .post('/api/mpc/compute')
      .send(invalidData)
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  test('Non-existent computation status', async () => {
    const response = await request(app)
      .get('/api/mpc/status/non-existent')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Computation not found');
  });
});

