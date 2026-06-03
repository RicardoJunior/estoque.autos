import request from 'supertest';
import { createApp } from '../app';

describe('Health Check Endpoint', () => {
  const app = createApp();

  it('should return 200 and status ok', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should return timestamp in ISO format', async () => {
    const response = await request(app).get('/api/health');

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });

  it('should return uptime as a number', async () => {
    const response = await request(app).get('/api/health');

    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });
});

describe('Root API Endpoint', () => {
  const app = createApp();

  it('should return API information', async () => {
    const response = await request(app).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'Estoque.autos API');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('documentation');
  });
});
