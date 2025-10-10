const request = require('supertest');
const app = require('../../server.js');

describe('API Health Endpoint', () => {
  test('GET /api/health returns health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('pid');
    expect(response.body).toHaveProperty('startTime');
    expect(response.body).toHaveProperty('uptimeSeconds');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('node');
    expect(response.body).toHaveProperty('memory');
    expect(response.body).toHaveProperty('systemMemory');
    expect(response.body).toHaveProperty('loadAverage');
    expect(response.body).toHaveProperty('cpuUsage');
    expect(response.body).toHaveProperty('requestStats');
  });

  test('Health endpoint includes valid uptime', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  test('Health endpoint includes memory usage', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.memory.rss).toBeGreaterThan(0);
    expect(response.body.memory.heapTotal).toBeGreaterThan(0);
    expect(response.body.memory.heapUsed).toBeGreaterThan(0);
  });
});
