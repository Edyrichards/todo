import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { config } from '@/config/index.js';
import { logger } from '@/utils/logger.js';
import { connectDatabase } from '@/utils/database.js';
import { connectRedis } from '@/utils/redis.js';
import { registerRoutes } from '@/routes/index.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { authMiddleware } from '@/middleware/auth.js';
import { validationErrorHandler } from '@/middleware/validation.js';
import { initializeWebSocketService } from '@/services/websocket.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.log.level,
    prettyPrint: config.env.NODE_ENV === 'development',
  },
  trustProxy: true,
  bodyLimit: config.upload.maxFileSize,
});

// Global error handler
fastify.setErrorHandler(errorHandler);

// Validation error handler
fastify.setNotFoundHandler(validationErrorHandler);

async function buildApp(): Promise<typeof fastify> {
  try {
    // Register CORS
    await fastify.register(cors, config.cors);

    // Register security middleware
    await fastify.register(helmet, config.security.helmet);

    // Register rate limiting
    await fastify.register(rateLimit, config.rateLimit.global);

    // Register JWT
    await fastify.register(jwt, {
      secret: config.jwt.secret,
      sign: {
        algorithm: config.jwt.algorithm,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        expiresIn: config.jwt.expiresIn,
      },
      verify: {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      },
    });

    // Register WebSocket support
    await fastify.register(websocket);

    // Initialize WebSocket service
    initializeWebSocketService(fastify, {
      pingInterval: 30000,
      connectionTimeout: 60000,
      maxConnections: 10000,
      heartbeatInterval: 5000,
      enablePresence: true,
      enableTypingIndicators: true,
      enableCursorPositions: true,
    });

    // Register multipart support for file uploads
    await fastify.register(multipart, {
      limits: {
        fileSize: config.upload.maxFileSize,
      },
    });

    // Register static file serving for uploads
    await fastify.register(fastifyStatic, {
      root: path.join(__dirname, '..', config.upload.uploadDir),
      prefix: '/uploads/',
    });

    // Add authentication decorator
    fastify.decorate('authenticate', authMiddleware);

    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Register all routes
    await registerRoutes(fastify);

    // Health check endpoint
    fastify.get('/health', async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.env.NODE_ENV,
      };
    });

    // Ready check endpoint
    fastify.get('/ready', async () => {
      // Check database and Redis connections
      try {
        // Add actual health checks here
        return {
          status: 'ready',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            redis: 'connected',
          },
        };
      } catch (error) {
        throw new Error('Service not ready');
      }
    });

    logger.info('Application built successfully');
    return fastify;
  } catch (error) {
    logger.error('Failed to build application:', error);
    throw error;
  }
}

async function start(): Promise<void> {
  try {
    const app = await buildApp();

    // Start the server
    const address = await app.listen({
      port: config.env.PORT,
      host: '0.0.0.0',
    });

    logger.info(`Server listening on ${address}`);
    logger.info(`Environment: ${config.env.NODE_ENV}`);
    logger.info(`API Base URL: ${config.env.API_BASE_URL}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        // Shutdown WebSocket service first
        const { getWebSocketService } = await import('@/services/websocket.js');
        try {
          const wsService = getWebSocketService();
          await wsService.shutdown();
          logger.info('WebSocket service shutdown successfully');
        } catch (wsError) {
          logger.warn('WebSocket service was not initialized or already shutdown');
        }
        
        await app.close();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { buildApp, start };
export default fastify;