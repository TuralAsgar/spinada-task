import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearTestDB, setupTestDB, teardownTestDB } from '../test-setup';
import request from 'supertest';
import app from '../../src/app';

const user = {
  name: 'Test User',
  email: 'user@example.com',
  password: 'user123',
};

describe('Auth', () => {
  beforeAll(async () => {
    await setupTestDB();
  });
  afterAll(async () => {
    await teardownTestDB();
  });
  beforeEach(async () => {
    await clearTestDB();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST: /v1/auth/register', () => {
    it('should be successful with a new valid name, email, password', async () => {
      const res = await request(app.app).post('/v1/auth/register').send(user);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(user.email);
    });

    it('should fail when email is missing', async () => {
      const res = await request(app.app).post('/v1/auth/register').send({
        name: user.name,
        password: user.password,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail when email is invalid', async () => {
      const res = await request(app.app)
        .post('/v1/auth/register')
        .send({
          ...user,
          email: 'invalid-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when password is too short', async () => {
      const res = await request(app.app)
        .post('/v1/auth/register')
        .send({
          ...user,
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when registering duplicate email', async () => {
      await request(app.app).post('/v1/auth/register').send(user);

      const res = await request(app.app).post('/v1/auth/register').send(user);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/);
    });
  });

  describe('POST: /v1/auth/login', () => {
    beforeEach(async () => {
      await request(app.app).post('/v1/auth/register').send(user);
    });

    it('should be successful with an existent email', async () => {
      const res = await request(app.app).post('/v1/auth/login').send({
        email: user.email,
        password: user.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app.app).post('/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: user.password,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid credentials/i);
    });

    it('should fail with wrong password', async () => {
      const res = await request(app.app).post('/v1/auth/login').send({
        email: user.email,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid credentials/i);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app.app).post('/v1/auth/login').send({
        email: 'invalid-email',
        password: user.password,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when email is missing', async () => {
      const res = await request(app.app).post('/v1/auth/login').send({
        password: user.password,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail when password is missing', async () => {
      const res = await request(app.app).post('/v1/auth/login').send({
        email: user.email,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
