import { FastifyInstance } from 'fastify';
import { logger } from '@/utils/logger.js';

// Import route modules
import authRoutes from '@/routes/auth.js';
import workspaceRoutes from '@/routes/workspaces.js';
import websocketRoutes from '@/routes/websocket.js';
// import userRoutes from '@/routes/users.js';
// import taskRoutes from '@/routes/tasks.js';
// import categoryRoutes from '@/routes/categories.js';
// import syncRoutes from '@/routes/sync.js';
// import analyticsRoutes from '@/routes/analytics.js';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  try {
    // API versioning
    await fastify.register(async function (fastify) {
      // Health check routes (no auth required)
      fastify.get('/ping', async () => {
        return { 
          message: 'pong',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
      });

      // Register authentication routes
      await fastify.register(authRoutes, { prefix: '/auth' });

      // Register WebSocket routes
      await fastify.register(websocketRoutes);

      // Register protected routes
      await fastify.register(workspaceRoutes, { prefix: '/workspaces' });
      // await fastify.register(userRoutes, { prefix: '/users' });
      // await fastify.register(taskRoutes, { prefix: '/workspaces' });
      // await fastify.register(categoryRoutes, { prefix: '/workspaces' });
      // await fastify.register(syncRoutes, { prefix: '/workspaces' });
      // await fastify.register(analyticsRoutes, { prefix: '/workspaces' });

      // Placeholder route for testing
      fastify.get('/status', async () => {
        return {
          status: 'API is running',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          version: '1.0.0',
          routes: [
            'GET /api/v1/ping',
            'GET /api/v1/status',
            'POST /api/v1/auth/register',
            'POST /api/v1/auth/login',
            'POST /api/v1/auth/refresh',
            'POST /api/v1/auth/logout',
            'GET /api/v1/auth/me',
            'PATCH /api/v1/auth/profile',
            'POST /api/v1/auth/change-password',
            'GET /api/v1/auth/sessions',
            'POST /api/v1/auth/logout-all',
            'GET /api/v1/workspaces',
            'POST /api/v1/workspaces',
            'GET /api/v1/workspaces/:workspaceId',
            'PATCH /api/v1/workspaces/:workspaceId',
            'DELETE /api/v1/workspaces/:workspaceId',
            'GET /api/v1/workspaces/:workspaceId/members',
            'POST /api/v1/workspaces/:workspaceId/invite',
            'GET /api/v1/ws (WebSocket)',
            'GET /api/v1/ws/health',
            'GET /api/v1/ws/metrics',
            // TODO: Add task and category routes
          ]
        };
      });

    }, { prefix: '/api/v1' });

    logger.info('Routes registered successfully');
  } catch (error) {
    logger.error('Failed to register routes:', error);
    throw error;
  }
}