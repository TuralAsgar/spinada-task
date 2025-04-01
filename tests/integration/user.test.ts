import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearTestDB, setupTestDB, teardownTestDB } from '../test-setup';
import request from 'supertest';
import app from '../../src/app';
import { UserRole } from '../../src/models/user.model';
import { seedDatabase } from '../seed-db';

describe('User Routes', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;

  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: UserRole.ADMIN,
  };

  const regularUser = {
    name: 'Regular User',
    email: 'user@example.com',
    password: 'user123',
  };

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    const { user } = await seedDatabase();
    userId = user.id;

    const adminLoginRes = await request(app.app)
      .post('/v1/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });

    const userLoginRes = await request(app.app)
      .post('/v1/auth/login')
      .send({ email: regularUser.email, password: regularUser.password });

    adminToken = adminLoginRes.body.data.token;
    userToken = userLoginRes.body.data.token;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app.app).get('/v1/users').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should not allow regular user to get all users', async () => {
      const res = await request(app.app).get('/v1/users').set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail without auth token', async () => {
      const res = await request(app.app).get('/v1/users');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /v1/users/:id', () => {
    it('should allow admin to get any user', async () => {
      const res = await request(app.app).get(`/v1/users/${userId}`).set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(regularUser.email);
    });

    it('should allow user to get their own profile', async () => {
      const res = await request(app.app).get(`/v1/users/${userId}`).set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(regularUser.email);
    });

    it('should fail with invalid user id', async () => {
      const res = await request(app.app).get('/v1/users/invalid-id').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app.app)
        .get('/v1/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /v1/users/:id', () => {
    const updateData = {
      name: 'Updated Name',
    };

    it('should allow user to update their own profile', async () => {
      const res = await request(app.app)
        .patch(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
    });

    it('should allow admin to update any user', async () => {
      const res = await request(app.app)
        .patch(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
    });

    it('should not allow user to update other users', async () => {
      const otherUserRes = await request(app.app).post('/v1/auth/register').send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'other123',
      });

      const res = await request(app.app)
        .patch(`/v1/users/${otherUserRes.body.data.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid update data', async () => {
      const res = await request(app.app)
        .patch(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should not allow user to update email', async () => {
      const res = await request(app.app)
        .patch(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'another@example.com' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should not allow user to update role', async () => {
      const res = await request(app.app)
        .patch(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: UserRole.ADMIN });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /v1/users/:id', () => {
    it('should allow admin to delete user', async () => {
      const res = await request(app.app).delete(`/v1/users/${userId}`).set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user is deleted
      const getRes = await request(app.app).get(`/v1/users/${userId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(404);
    });

    it('should not allow regular user to delete any user', async () => {
      const res = await request(app.app).delete(`/v1/users/${userId}`).set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid user id', async () => {
      const res = await request(app.app).delete('/v1/users/invalid-id').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app.app)
        .delete('/v1/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
