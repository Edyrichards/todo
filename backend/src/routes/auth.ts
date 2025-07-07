import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { authController } from '@/controllers/auth.js';
import { validate } from '@/middleware/validation.js';
import { authMiddleware } from '@/middleware/auth.js';
import { authSchemas } from '@/schemas/auth.js';
import { config } from '@/config/index.js';

async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Apply stricter rate limiting for auth endpoints
  await fastify.register(rateLimit, {
    ...config.rateLimit.auth,
    keyGenerator: (request) => {
      return request.ip; // Rate limit by IP address
    },
    errorResponseBuilder: (request, context) => {
      return {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many authentication attempts. Try again in ${Math.round(context.ttl / 1000)} seconds.`,
        },
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    },
  });

  // Public authentication routes
  fastify.post(
    '/register',
    {
      preHandler: [validate(authSchemas.register)],
    },
    authController.register.bind(authController)
  );

  fastify.post(
    '/login',
    {
      preHandler: [validate(authSchemas.login)],
    },
    authController.login.bind(authController)
  );

  fastify.post(
    '/refresh',
    {
      preHandler: [validate(authSchemas.refreshToken)],
    },
    authController.refreshToken.bind(authController)
  );

  fastify.post(
    '/logout',
    {
      preHandler: [validate(authSchemas.logout)],
    },
    authController.logout.bind(authController)
  );

  // Email verification routes (placeholder)
  fastify.post(
    '/send-verification',
    {
      preHandler: [validate(authSchemas.sendVerification)],
    },
    authController.sendVerificationEmail.bind(authController)
  );

  fastify.post(
    '/verify-email',
    {
      preHandler: [validate(authSchemas.emailVerification)],
    },
    authController.verifyEmail.bind(authController)
  );

  // Password reset routes (placeholder)
  fastify.post(
    '/password-reset-request',
    {
      preHandler: [validate(authSchemas.passwordResetRequest)],
    },
    authController.sendPasswordResetEmail.bind(authController)
  );

  fastify.post(
    '/password-reset',
    {
      preHandler: [validate(authSchemas.passwordReset)],
    },
    authController.resetPassword.bind(authController)
  );

  // Protected routes (require authentication)
  fastify.register(async function (fastify) {
    // Add authentication hook for all routes in this context
    fastify.addHook('preHandler', authMiddleware);

    // Get current user profile
    fastify.get('/me', authController.getProfile.bind(authController));

    // Update user profile
    fastify.patch(
      '/profile',
      {
        preHandler: [validate(authSchemas.updateProfile)],
      },
      authController.updateProfile.bind(authController)
    );

    // Change password
    fastify.post(
      '/change-password',
      {
        preHandler: [validate(authSchemas.changePassword)],
      },
      authController.changePassword.bind(authController)
    );

    // Session management
    fastify.get('/sessions', authController.getSessions.bind(authController));

    fastify.post('/logout-all', authController.logoutAll.bind(authController));
  });

  // Health check for auth service
  fastify.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'auth',
      timestamp: new Date().toISOString(),
    };
  });
}

export default fp(authRoutes, {
  name: 'auth-routes',
  dependencies: [],
});