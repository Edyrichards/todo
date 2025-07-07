import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '@/index.js';
import { FastifyInstance } from 'fastify';

describe('Authentication API', () => {
  let app: FastifyInstance;
  
  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123',
        },
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('User registered successfully');
      expect(body.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
      });
      expect(body.tokens).toHaveProperty('accessToken');
      expect(body.tokens).toHaveProperty('refreshToken');
      expect(body.tokens).toHaveProperty('expiresAt');
      expect(body.tokens.tokenType).toBe('Bearer');
    });

    it('should reject registration with weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'weak',
          confirmPassword: 'weak',
        },
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with mismatched passwords', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'TestPassword123',
          confirmPassword: 'DifferentPassword123',
        },
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalid-email',
          name: 'Test User',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123',
        },
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a user first
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'login-test@example.com',
          name: 'Login Test User',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123',
        },
      });

      // Manually verify the user for testing
      const { query } = await import('@/utils/database.js');
      await query(
        'UPDATE users SET email_verified = true WHERE email = $1',
        ['login-test@example.com']
      );
    });

    it('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login-test@example.com',
          password: 'TestPassword123',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Login successful');
      expect(body.user).toMatchObject({
        email: 'login-test@example.com',
        name: 'Login Test User',
        emailVerified: true,
      });
      expect(body.tokens).toHaveProperty('accessToken');
      expect(body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login-test@example.com',
          password: 'WrongPassword123',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject login with non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'profile-test@example.com',
          name: 'Profile Test User',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123',
        },
      });

      const registerBody = JSON.parse(registerResponse.body);
      accessToken = registerBody.tokens.accessToken;

      // Verify email for testing
      const { query } = await import('@/utils/database.js');
      await query(
        'UPDATE users SET email_verified = true WHERE email = $1',
        ['profile-test@example.com']
      );
    });

    it('should get user profile with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.user).toMatchObject({
        email: 'profile-test@example.com',
        name: 'Profile Test User',
        emailVerified: true,
      });
      expect(body.user).toHaveProperty('id');
      expect(body.user).toHaveProperty('createdAt');
      expect(body.user).toHaveProperty('updatedAt');
    });

    it('should reject request without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject request with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register to get refresh token
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'refresh-test@example.com',
          name: 'Refresh Test User',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123',
        },
      });

      const registerBody = JSON.parse(registerResponse.body);
      refreshToken = registerBody.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Tokens refreshed successfully');
      expect(body.tokens).toHaveProperty('accessToken');
      expect(body.tokens).toHaveProperty('refreshToken');
      expect(body.tokens).toHaveProperty('expiresAt');
      expect(body.tokens.tokenType).toBe('Bearer');
    });

    it('should reject invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: 'invalid-refresh-token',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register to get refresh token
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'logout-test@example.com',
          name: 'Logout Test User',
          password: 'TestPassword123',
          confirmPassword: 'TestPassword123',
        },
      });

      const registerBody = JSON.parse(registerResponse.body);
      refreshToken = registerBody.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        payload: {
          refreshToken,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Logout successful');
    });

    it('should logout successfully even with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        payload: {
          refreshToken: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Logout successful');
    });
  });
});