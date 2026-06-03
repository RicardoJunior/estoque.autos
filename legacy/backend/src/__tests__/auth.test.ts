import request from 'supertest';
import { createApp } from '../app';
import { supabaseAdmin } from '../config/supabase';

const app = createApp();

/**
 * NOTE: These tests require a real Supabase instance to run.
 * They are integration tests that verify the full auth flow.
 * To run these tests:
 * 1. Create a Supabase project
 * 2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.test
 * 3. Run the database migrations
 * 4. Run: npm test -- auth.test.ts
 */
describe.skip('Auth Endpoints (Integration Tests - Requires Supabase)', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    phone: '11999999999',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  afterAll(async () => {
    // Cleanup: delete test user if created
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('users').delete().eq('id', userId);
    }
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const response = await request(app).post('/api/auth/signup').send(testUser).expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user.role).toBe('owner');
      expect(response.body).toHaveProperty('needsOnboarding', true);

      userId = response.body.user.id;
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          email: `test2-${Date.now()}@example.com`,
          password: '123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app).post('/api/auth/signup').send(testUser).expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body).toHaveProperty('needsOnboarding', true);

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');

      // Update tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body).toHaveProperty('needsOnboarding', true);
      expect(response.body.tenant).toBeNull();
    });

    it('should fail without auth token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/onboarding/tenant', () => {
    const tenantData = {
      name: 'Test Auto Store',
      slug: `test-store-${Date.now()}`,
      cnpj: '12.345.678/0001-90',
      phone: '11999999999',
      whatsapp: '11999999999',
      email: 'store@example.com',
    };

    it('should create tenant successfully', async () => {
      const response = await request(app)
        .post('/api/auth/onboarding/tenant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tenantData)
        .expect(201);

      expect(response.body).toHaveProperty('tenant');
      expect(response.body.tenant.name).toBe(tenantData.name);
      expect(response.body.tenant.slug).toBe(tenantData.slug);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail to create duplicate tenant', async () => {
      const response = await request(app)
        .post('/api/auth/onboarding/tenant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tenantData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid slug format', async () => {
      const response = await request(app)
        .post('/api/auth/onboarding/tenant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...tenantData,
          slug: 'Invalid Slug!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should show tenant in /me endpoint after creation', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tenant');
      expect(response.body.tenant).not.toBeNull();
      expect(response.body.tenant.name).toBe(tenantData.name);
      expect(response.body).toHaveProperty('needsOnboarding', false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail without auth token', async () => {
      const response = await request(app).post('/api/auth/logout').expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
