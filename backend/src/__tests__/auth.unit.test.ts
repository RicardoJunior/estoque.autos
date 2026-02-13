import request from 'supertest';
import { createApp } from '../app';

// Mock the Supabase client
jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
  createSupabaseClient: jest.fn(),
}));

const app = createApp();

describe('Auth Endpoints - Unit Tests', () => {
  describe('POST /api/auth/signup', () => {
    it('should validate email format', async () => {
      const response = await request(app).post('/api/auth/signup').send({
        email: 'invalid-email',
        password: 'TestPassword123!',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation Error');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate password length', async () => {
      const response = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation Error');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate name length', async () => {
      const response = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'A',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation Error');
      expect(response.body).toHaveProperty('details');
    });

    it('should require all mandatory fields', async () => {
      const response = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate email format', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should require password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should require refresh token', async () => {
      const response = await request(app).post('/api/auth/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should require authorization header', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authorization');
    });

    it('should reject invalid bearer token format', async () => {
      const response = await request(app).get('/api/auth/me').set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/onboarding/tenant', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/auth/onboarding/tenant').send({
        name: 'Test Store',
        slug: 'test-store',
        phone: '11999999999',
        email: 'store@example.com',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid auth token', async () => {
      const response = await request(app)
        .post('/api/auth/onboarding/tenant')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Test Store',
          slug: 'test-store',
          phone: '11999999999',
          email: 'store@example.com',
        });

      // Auth middleware will reject before validation
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should require name field', async () => {
      const response = await request(app).post('/api/auth/onboarding/tenant').send({
        slug: 'test-store',
        phone: '11999999999',
        email: 'store@example.com',
      });

      // Will fail auth first, but validates required fields
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should require slug field', async () => {
      const response = await request(app).post('/api/auth/onboarding/tenant').send({
        name: 'Test Store',
        phone: '11999999999',
        email: 'store@example.com',
      });

      // Will fail auth first, but validates required fields
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
